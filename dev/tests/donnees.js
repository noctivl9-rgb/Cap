/* Tests d'interface : export, import, copie de secours, connexion au compte et migration.
 * Partie 1 : mode sans compte (page de test). Partie 2 : version GitHub avec un Supabase SIMULÉ dans le navigateur
 * (aucun vrai projet n'existe encore) : vérifie cloud.js, la migration et la synchro entre deux « appareils ».
 * Prérequis : bash dev/tests/build.sh, puis lancer depuis dev/tests : node donnees.js */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const S = require('../../sync.js');
const RACINE = path.join(__dirname, '../..');
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (i !== undefined && !c ? ' → ' + JSON.stringify(i) : ''));

// Petit serveur statique : /out/... = page de test, le reste = racine du dépôt (version GitHub)
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); const f = u.startsWith('/out/') ? path.join(__dirname, u) : path.join(RACINE, u === '/' ? 'index.html' : u);
  if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(r);
}).listen(8766);

// Supabase simulé : un « serveur » partagé entre pages via un objet Node exposé (exposeFunction)
const SERVEUR = { rows: {}, users: { 'elias@exemple.fr': 'u-1' }, codes: {} };
const MOCK = `(() => {
  window.__CFG = { supabaseUrl: 'https://simule.supabase.co', supabaseAnonKey: 'sb_publishable_test', ia: true };
  Object.defineProperty(window, 'CAP_CONFIG', { configurable: true, get: () => window.__CFG, set: () => {} });
  const srv = (op, a) => window.__srv(op, JSON.stringify(a || {})).then(x => JSON.parse(x));
  const sess = () => { try { return JSON.parse(localStorage.getItem('cap-auth-sim')); } catch (e) { return null; } };
  const chans = [];
  window.__notify = ev => chans.forEach(f => f(ev));
  window.supabase = { createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: sess() } }),
      signInWithOtp: async ({ email, options }) => { const r = await srv('otp', { email, create: options.shouldCreateUser }); return { error: r.error ? { message: r.error } : null }; },
      verifyOtp: async ({ email, token }) => { const r = await srv('verify', { email, token }); if (r.error) return { error: { message: r.error }, data: {} }; const s = { user: { id: r.uid, email } }; localStorage.setItem('cap-auth-sim', JSON.stringify(s)); return { data: { session: s }, error: null }; },
      signOut: async () => { localStorage.removeItem('cap-auth-sim'); return {}; }
    },
    from: () => { const st = { f: {} }; const b = {
      select() { st.op = 'select'; return b; }, eq(k, v) { st.f[k] = v; return b; },
      upsert(row) { st.op = 'upsert'; st.row = row; return b; }, delete() { st.op = 'delete'; return b; },
      then(ok, ko) { const s = sess(); return srv(st.op, { uid: s && s.user.id, f: st.f, row: st.row }).then(r => ({ data: r.data, error: r.error ? { message: r.error } : null })).then(ok, ko); }
    }; return b; },
    channel: () => { const c = { on(_, __, fn) { chans.push(p => { const s = sess(); const row = p.new || p.old; if (s && row && row.user_id === s.user.id) fn(p); }); return c; }, subscribe() { return c; } }; return c; },
    functions: { invoke: async (nom, { body }) => { const s = sess(); const r = await srv('ia', { uid: s && s.user.id, body }); return r.error ? { error: { context: { json: async () => ({ error: r.error }) } } } : { data: r.data }; } }
  }) };
})();`;
async function serveur(op, a) {
  a = JSON.parse(a);
  if (op === 'otp') { if (!SERVEUR.users[a.email] && !a.create) return JSON.stringify({ error: 'Signups not allowed for otp' }); SERVEUR.codes[a.email] = '123456'; return '{}'; }
  if (op === 'verify') return JSON.stringify(SERVEUR.codes[a.email] === a.token ? { uid: SERVEUR.users[a.email] } : { error: 'Token has expired or is invalid' });
  if (!a.uid) return JSON.stringify({ error: 'JWT manquant' });
  const mine = Object.values(SERVEUR.rows).filter(r => r.user_id === a.uid);
  if (op === 'select') return JSON.stringify({ data: mine.filter(r => r.coll === a.f.coll).map(r => ({ doc_id: r.doc_id, data: r.data })) });
  if (op === 'upsert') { if (a.row.user_id !== a.uid) return JSON.stringify({ error: 'RLS' }); SERVEUR.rows[a.uid + '|' + a.row.coll + '|' + a.row.doc_id] = a.row; SERVEUR.dernier = { new: a.row }; return '{"data":null}'; }
  if (op === 'delete') { const k = a.uid + '|' + a.f.coll + '|' + a.f.doc_id; const old = SERVEUR.rows[k]; delete SERVEUR.rows[k]; SERVEUR.dernier = old ? { old } : null; return '{"data":null}'; }
  if (op === 'ia') { SERVEUR.ia = a.body; if (a.body.type === 'coach') return JSON.stringify({ data: { text: 'Réponse du coach serveur.' } }); return JSON.stringify({ data: { aliments: [{ nom: 'Riz blanc (cuit)', grammes: 150, preparation: 'aucune', confiance: 'moyenne', kcal_100g: 130, proteines_100g: 2.7, glucides_100g: 28, lipides_100g: 0.3 }], remarque: 'Test.' } }); }
  return JSON.stringify({ error: 'op ' + op });
}

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const nouvellePage = async (ctx, url) => { const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message)); await pg.goto(url); return pg; };
  const cont = async pg => { await pg.click('.ob-bar .btn:not(.text)'); await pg.waitForTimeout(220); };
  const type = async (pg, v) => { await pg.click('.ruler-value'); await pg.fill('.ruler-input', v); await pg.keyboard.press('Enter'); };
  async function onboardingArgent(pg) {
    await pg.click('.sk-btn'); await pg.waitForTimeout(450);
    await pg.click('.choice:has-text("Mon argent")'); await cont(pg); await type(pg, '15'); await cont(pg); await type(pg, '20'); await cont(pg);
    for (const f of ['revenus', 'fixes', 'variables', 'remboursements', 'epargne']) { await pg.fill('#m-' + f, f === 'revenus' ? '40' : '0'); await cont(pg); }
    await pg.click('.choice:has-text("Appartement à Dubaï")'); await cont(pg); await pg.click('.choice:has-text("2036")'); await cont(pg); await pg.click('.choice:has-text("Code")'); await cont(pg); await type(pg, '7'); await cont(pg);
    await pg.click('.ob-bar .btn.text'); await pg.waitForTimeout(250); await cont(pg); await pg.waitForTimeout(400);
    await pg.waitForSelector('.rv'); await pg.click('.rv'); await pg.click('.rv-go'); await pg.waitForTimeout(350); await pg.click('.ob-bar .btn:not(.text), .ob-bar .sk-btn, .stage .sk-btn'); await pg.waitForTimeout(600);
  }
  const reglages = async pg => { await pg.click('.tabbar button:has-text("Réglages")'); await pg.waitForTimeout(250); };
  const exporterTexte = async pg => { await reglages(pg); await pg.click('button.cell:has-text("Exporter mes données")'); await pg.waitForTimeout(300); await pg.click('.sheet button:has-text("Copier le texte")'); await pg.waitForTimeout(200); const t = await pg.evaluate(() => navigator.clipboard.readText()); await pg.click('.sheet [aria-label="Fermer"]'); await pg.waitForTimeout(250); return t; };
  const importerTexte = async (pg, texte) => { await reglages(pg); await pg.click('button.cell:has-text("Importer une sauvegarde")'); await pg.waitForTimeout(300); await pg.fill('#imp-t', texte); await pg.click('.sheet button:has-text("Analyser")'); await pg.waitForTimeout(300); return pg.$eval('.sheet', e => e.textContent); };

  // ------------------------------------------------------------ Partie 1 : sans compte
  const ctx1 = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx1.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:8766' });
  const p1 = await nouvellePage(ctx1, 'http://localhost:8766/out/page.html');
  await onboardingArgent(p1);
  await p1.click('.tabbar button:has-text("Argent")'); await p1.waitForTimeout(200); await p1.click('button:has-text("Mouvement")'); await p1.waitForTimeout(250); await p1.fill('#m-montant', '50'); await p1.click('.sheet .btn:has-text("Enregistrer")'); await p1.waitForTimeout(300);
  const t1 = await exporterTexte(p1); const lu1 = S.lireExport(t1);
  T('export : fichier valide (empreinte vérifiée)', lu1.ok, lu1.erreurs);
  T('export : profil + 1 mouvement d’épargne', lu1.ok && lu1.data.profil.main && Object.keys(lu1.data.epargne).length === 1);
  let txt = await importerTexte(p1, t1);
  T('réimport du même fichier : « Rien à importer »', txt.includes('Rien à importer'), txt.slice(0, 200));
  await p1.click('.sheet [aria-label="Fermer"]'); await p1.waitForTimeout(250);
  T('fichier tronqué refusé avec message', (await importerTexte(p1, t1.slice(0, 300))).includes('JSON lisible'));
  await p1.click('.sheet [aria-label="Fermer"]'); await p1.waitForTimeout(250);
  // Fichier d'un autre appareil : un mouvement en plus, un profil différent
  const autre = JSON.parse(JSON.stringify(lu1.data)); autre.epargne['e-autre'] = { date: '2026-11-03', montant: 15, note: 'autre appareil' }; autre.profil.main = Object.assign({}, autre.profil.main, { revenus: 99 });
  txt = await importerTexte(p1, JSON.stringify(S.creerExport(autre, 'claude')));
  T('aperçu : 1 nouveau, profil différent signalé', txt.includes('1 nouveau') && txt.includes('profil du fichier est différent'), txt.slice(0, 300));
  await p1.click('.sheet button:has-text("Ajouter les 1 nouveaux")'); await p1.waitForTimeout(500);
  let apres = S.lireExport(await exporterTexte(p1)).data;
  T('mode « ajouter » : mouvement ajouté', !!apres.epargne['e-autre']);
  T('mode « ajouter » : profil actuel inchangé', apres.profil.main.revenus === 40, apres.profil.main.revenus);
  T('copie de secours créée avant l’import', await p1.evaluate(() => !!localStorage.getItem('cap-backup')));
  txt = await importerTexte(p1, JSON.stringify(S.creerExport(autre, 'claude')));
  await p1.click('.sheet button:has-text("Remplacer les")'); await p1.waitForTimeout(350);
  T('remplacement : demande de confirmation', (await p1.$$eval('.sheet', s => s.map(x => x.textContent).join(' '))).includes('Confirmer le remplacement'));
  await p1.click('.sheet:has-text("Confirmer le remplacement") button:has-text("Remplacer")'); await p1.waitForTimeout(600);
  apres = S.lireExport(await exporterTexte(p1)).data;
  T('après confirmation : profil importé', apres.profil.main.revenus === 99, apres.profil.main.revenus);
  T('ancien profil gardé dans l’historique', Object.values(apres.historique).some(x => x.profil && x.profil.revenus === 40));
  T('rien supprimé : 2 mouvements', Object.keys(apres.epargne).length === 2);
  const avantConnexion = apres;

  // ------------------------------------------------------------ Partie 2 : version GitHub + Supabase simulé
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx2.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:8766' });
  await ctx2.exposeFunction('__srv', serveur); await ctx2.addInitScript(MOCK);
  // L'appareil A a déjà des données locales (celles de la partie 1)
  await ctx2.addInitScript(d => { if (!localStorage.getItem('cap-init')) { localStorage.setItem('cap-local', d); localStorage.setItem('cap-init', '1'); localStorage.setItem('cap-intro', String(Date.now())); } }, JSON.stringify(avantConnexion));
  const a = await nouvellePage(ctx2, 'http://localhost:8766/'); await a.waitForTimeout(900);
  T('GitHub : bandeau propose de connecter le compte', (await a.$eval('main', e => e.textContent)).includes('Connecte ton compte Cap'));
  await reglages(a);
  T('Réglages : ligne « Compte Cap » visible', (await a.$eval('main', e => e.textContent)).includes('Non connecté'));
  await a.click('button.cell:has-text("Compte Cap")'); await a.waitForTimeout(300);
  await a.fill('#cpt-mail', 'inconnu@exemple.fr'); await a.click('.sheet button:has-text("Recevoir un code")'); await a.waitForTimeout(300);
  T('adresse sans compte refusée (inscriptions fermées)', (await a.$eval('.sheet .err', e => e.textContent)).includes('n’a pas de compte'));
  await a.fill('#cpt-mail', 'elias@exemple.fr'); await a.click('.sheet button:has-text("Recevoir un code")'); await a.waitForTimeout(300);
  await a.fill('#cpt-code', '000000'); await a.click('.sheet button:has-text("Se connecter")'); await a.waitForTimeout(300);
  T('mauvais code refusé', (await a.$eval('.sheet .err', e => e.textContent)).includes('Code incorrect'));
  await a.fill('#cpt-code', '123456'); await a.click('.sheet button:has-text("Se connecter")'); await a.waitForTimeout(700);
  const mig = await a.$$eval('.sheet', s => s.map(x => x.textContent).join(' '));
  T('migration : compte vide → propose d’envoyer les données', mig.includes('Envoyer tes données'), mig.slice(0, 200));
  await a.click('.sheet button:has-text("Envoyer")'); await a.waitForTimeout(1800);
  const nb = Object.keys(SERVEUR.rows).length;
  T('données envoyées vers le compte', nb === S.total(avantConnexion), [nb, S.total(avantConnexion)]);
  T('données locales intactes après connexion', await a.evaluate(n => Object.keys(JSON.parse(localStorage.getItem('cap-local')).epargne).length === n, Object.keys(avantConnexion.epargne).length));
  await reglages(a);
  T('après rechargement : connecté', (await a.$eval('main', e => e.textContent)).includes('Connecté : elias@exemple.fr'));
  T('texte « Données » exact : compte Supabase', (await a.$eval('main', e => e.textContent)).includes('ton compte Cap (Supabase)'));

  // Appareil B : nouveau téléphone, aucune donnée, même compte → retrouve tout
  const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx3.exposeFunction('__srv', serveur); await ctx3.addInitScript(MOCK);
  await ctx3.addInitScript(() => localStorage.setItem('cap-intro', String(Date.now())));
  const bb = await nouvellePage(ctx3, 'http://localhost:8766/'); await bb.waitForTimeout(900);
  await bb.click('.sk-btn').catch(() => {}); // accueil d'un appareil neuf
  await bb.evaluate(() => localStorage.setItem('cap-auth-sim', JSON.stringify({ user: { id: 'u-1', email: 'elias@exemple.fr' } })));
  await bb.reload(); await bb.waitForTimeout(1200);
  await bb.click('.tabbar button:has-text("Argent")').catch(() => {}); await bb.waitForTimeout(300);
  const mB = await bb.$eval('main', e => e.textContent.replace(/[  ]/g, ' '));
  T('appareil B : profil et épargne retrouvés depuis le compte', mB.includes('Appartement') && mB.includes('+50 €'), mB.slice(0, 160));
  // Écriture sur B → visible sur A en temps réel
  await bb.click('button:has-text("Mouvement")'); await bb.waitForTimeout(250); await bb.fill('#m-montant', '7'); await bb.click('.sheet .btn:has-text("Enregistrer")'); await bb.waitForTimeout(400);
  await a.evaluate(ev => window.__notify(ev), SERVEUR.dernier); await a.waitForTimeout(300);
  await a.click('.tabbar button:has-text("Argent")'); await a.waitForTimeout(300);
  T('synchro : mouvement de B visible sur A', (await a.$eval('main', e => e.textContent.replace(/[  ]/g, ' '))).includes('+7 €'));
  // IA par le serveur
  T('IA serveur : coach et scan disponibles', await a.evaluate(() => window.CapAI.texteDispo() && window.CapAI.photoDispo()));
  const coach = await a.evaluate(async () => (await window.CapAI.coach('Test ?', [], { age: 15 }, {})).text);
  T('IA serveur : réponse du coach reçue', coach === 'Réponse du coach serveur.' && SERVEUR.ia.type === 'coach');
  T('IA serveur : le navigateur n’envoie aucune consigne système', SERVEUR.ia && !JSON.stringify(SERVEUR.ia).includes('Règles strictes'));
  const scan = await a.evaluate(async () => { const c = document.createElement('canvas'); c.width = c.height = 8; const blob = await new Promise(r => c.toBlob(r, 'image/jpeg')); const v = await window.CapAI.analyserRepas(blob); return v; });
  T('IA serveur : scan revalidé par le moteur (CapEngine.validerScan)', scan && scan.aliments && scan.aliments.length === 1, scan);

  console.log(res.join('\n')); console.log('\nerreurs de page :', errs);
  console.log('\n' + res.filter(x => x.startsWith('ok')).length + ' réussis, ' + res.filter(x => x.startsWith('FAIL')).length + ' échoués');
  await b.close(); srv.close();
})().catch(e => { console.log(res.join('\n')); console.error(e); srv.close(); process.exit(1); });
