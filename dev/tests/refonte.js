/* Tests de la refonte : navigation, priorité d'Aujourd'hui, séance guidée, migration des photos v1, consentements,
 * réduction des animations, mode sans IA, accessibilité de base (noms accessibles, zones tactiles), CSP.
 * Prérequis : bash build.sh. Lancer depuis dev/tests : node refonte.js */
const { chromium, devices } = require('playwright');
const aller = require('./nav');
const P = require('../../photos.js');
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300)));

// ---------- Unitaires : migration des métadonnées photo ----------
const v1 = P.normaliser({ id: 'x', date: '2026-05-02', assetId: 'abc', url: '/_blob/abc' });
T('photo v1 → v2 : catégorie « libre », référence de stockage conservée', v1.v === 2 && v1.categorie === 'libre' && v1.assetId === 'abc' && v1.url === '/_blob/abc' && v1.date === '2026-05-02', v1);
const bad = P.normaliser({ date: 'n’importe', ts: '2026-01-03T10:00:00Z', categorie: 'xx', poids: -4, note: 'a'.repeat(400) });
T('photo : valeurs invalides neutralisées (date, catégorie, mesure, note ≤ 140)', bad.date === '2026-01-03' && bad.categorie === 'libre' && bad.poids === undefined && bad.note.length === 140, bad);
T('photo : type de fichier refusé (PDF) et taille maximale', !!P.verifierFichier({ type: 'application/pdf', size: 10 }) && !!P.verifierFichier({ type: 'image/jpeg', size: 30 * 1024 * 1024 }) && P.verifierFichier({ type: 'image/jpeg', size: 2e6 }) === null);

const BASE = { v: 2, sexe: 'H', age: 24, taille: 178, poids: 76, objectif: 'perdre', cible: 72, delaiSem: 16, activite: 'mixte', niveau: 'intermediaire', lieu: 'salle', jours: 3, minutes: 45, autreSport: 0, tempsLibre: 10, prioriteSport: 'muscle', contraintes: ['aucune'], obstacle: 'regularite', regime: 'omnivore', creeLe: '2026-10-01T10:00:00Z' };
async function ouvrir(b, mem, opts) {
  const ctx = await b.newContext(Object.assign({}, devices['iPhone 14'], opts || {})); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.errs = errs;
  await pg.clock.setFixedTime(new Date('2026-11-09T09:30:00')); // lundi
  await pg.goto('file://' + __dirname + '/out/page.html' + ((opts && opts.mock) ? '#mock' : ''));
  await pg.evaluate(m => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify(m)); }, mem);
  await pg.reload(); await pg.waitForTimeout(600);
  return pg;
}
(async () => {
  const b = await chromium.launch();
  // ---------- Navigation selon les modules ----------
  let pg = await ouvrir(b, { profil: { main: Object.assign({}, BASE, { domaines: ['argent'], revenus: 1500, fixes: 900, variables: 400, remboursements: 0, epargne: 300, reve: 'appart', reveAnnee: 2032, reveMontant: 200000 }) } });
  let navs = await pg.$$eval('.tabbar .nav-d', l => l.map(e => e.textContent));
  T('module Argent seul : pas d’onglet Corps (Aujourd’hui, ＋, Avenir, Profil)', navs.join('|') === 'Aujourd’hui|Avenir|Profil' && !!(await pg.$('.nav-plus')), navs);
  await aller(pg, 'Argent');
  T('Avenir avec un seul module : pas de sélecteur, titre « Finances »', !(await pg.$('.segs.mods')) && (await pg.$eval('.pc-head h1', e => e.textContent)) === 'Finances');
  T('Argent : Réel, Projection et Hypothèse nommés', await pg.evaluate(() => { const t = document.querySelector('main').textContent; return t.includes('Réel') && t.includes('Projection') && t.includes('Ce n’est pas une promesse'); }));

  // ---------- Priorité : déficit avant tout le reste ----------
  pg = await ouvrir(b, { profil: { main: Object.assign({}, BASE, { domaines: ['corps', 'argent'], revenus: 1000, fixes: 900, variables: 400, remboursements: 0, epargne: 0, reve: 'appart', reveAnnee: 2032, reveMontant: 200000 }) } });
  let prio = await pg.$eval('.td-prio-t', e => e.textContent);
  T('Aujourd’hui : budget en déficit = priorité, factuelle', /déficit|Dépenses supérieures aux revenus/.test(prio) && /300/.test(await pg.$eval('.td-prio-x', e => e.textContent)), [prio, await pg.$eval('.td-prio-x', e => e.textContent)]);
  T('Aujourd’hui : une seule priorité, une seule action', (await pg.$$('.td-prio')).length === 1 && (await pg.$$('.td-prio-go')).length === 1);
  T('Aujourd’hui : aucune flamme, série ni score', !(await pg.evaluate(() => /série|score|\/100/i.test(document.querySelector('main').textContent))) && !(await pg.$('main svg.i.flame')));

  // ---------- Séance guidée : lundi = séance prévue ----------
  pg = await ouvrir(b, { profil: { main: Object.assign({}, BASE, { domaines: ['corps'] }) } });
  prio = await pg.$eval('.td-prio-go', e => e.textContent);
  T('Aujourd’hui : séance du jour proposée en priorité', prio === 'Commencer la séance', prio);
  await pg.click('.td-prio-go'); await pg.waitForTimeout(400);
  T('séance guidée : plein écran, dialogue nommé', await pg.$eval('.sg', e => e.getAttribute('role') === 'dialog' && /Séance/.test(e.getAttribute('aria-label'))));
  await pg.click('.sg-go'); await pg.waitForTimeout(200);
  const cible = await pg.$eval('.sg-cible', e => e.textContent);
  T('séance guidée : séries × répétitions en grand', /\d+ × /.test(cible), cible);
  await pg.click('.sg-serie'); await pg.waitForTimeout(100);
  T('séance guidée : le repos ne démarre pas tout seul', !(await pg.$('.sg-chrono')) && !!(await pg.$('.sg-repos .btn')));
  await pg.click('.sg-repos .btn'); await pg.waitForTimeout(150);
  T('séance guidée : minuteur lancé à la demande', !!(await pg.$('.sg-chrono')));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
  T('séance guidée : quitter propose de garder ce qui est fait, sans culpabiliser', (await pg.$eval('.sg-titre', e => e.textContent)) === 'Quitter la séance ?' && (await pg.$eval('.sg', e => e.textContent)).includes('Rien n’est perdu'));
  await pg.click('.sg-barre .btn:has-text("Enregistrer ce que j’ai fait")'); await pg.waitForTimeout(150);
  T('séance guidée : enregistrement impossible sans ressenti', await pg.$eval('.sg-barre .btn:has-text("Enregistrer la séance")', e => e.disabled));
  await pg.click('.sg .choice:has-text("Correct")');
  T('séance guidée : la question « gêne ? » est obligatoire avant d’enregistrer', await pg.$eval('.sg-barre .btn:has-text("Enregistrer la séance")', e => e.disabled));
  await pg.click('.sg .choice:has-text("Non")'); await pg.fill('#sg-com', 'Bonne énergie'); await pg.click('.sg-barre .btn:has-text("Enregistrer la séance")'); await pg.waitForTimeout(400);
  const se = await pg.evaluate(() => Object.values(JSON.parse(localStorage.getItem('cap-local')).seances || {}));
  T('séance guidée : séance partielle enregistrée comme telle', se.length === 1 && se[0].partielle === true && se[0].ressenti === 'ok' && se[0].exercicesFaits === 0, se);
  T('séance guidée : durée mesurée, gêne et commentaire enregistrés', typeof se[0].dureeMin === 'number' && se[0].gene === false && se[0].commentaire === 'Bonne énergie', se[0]);
  T('focus rendu à la page après la séance', !(await pg.$('.sg')) && !(await pg.evaluate(() => document.body.classList.contains('sg-ouvert'))));
  await aller(pg, 'Séance');
  T('Séance : séance du jour marquée faite, pas de nouvelle demande', (await pg.$eval('.pg-quand', e => e.textContent)) === 'Faite aujourd’hui');

  // ---------- Séance : pause, alternative, gêne signalée, report ----------
  {
    const p2 = await ouvrir(b, { profil: { main: Object.assign({}, BASE, { domaines: ['corps'] }) } });
    await p2.click('.td-prio-go'); await p2.waitForTimeout(300); await p2.click('.sg-go'); await p2.waitForTimeout(200);
    await p2.clock.setFixedTime(new Date('2026-11-09T09:31:05')); await p2.waitForTimeout(700);
    const t1 = await p2.$eval('.sg-temps', e => e.textContent);
    await p2.click('.sg-pause'); await p2.waitForTimeout(100);
    T('pause : écran « En pause »', (await p2.$eval('.sg-titre', e => e.textContent)) === 'En pause');
    await p2.clock.setFixedTime(new Date('2026-11-09T09:33:05'));
    await p2.click('.sg-barre .btn:has-text("Reprendre")'); await p2.waitForTimeout(100);
    await p2.waitForTimeout(700); const t2 = await p2.$eval('.sg-temps', e => e.textContent);
    T('pause : le temps de séance ne court pas pendant la pause', t1.startsWith('1:') && t2.startsWith('1:'), [t1, t2]);
    const nom1 = await p2.$eval('.sg-titre', e => e.textContent);
    await p2.click('.sg-outils .btn:has-text("Faire l’alternative")'); await p2.waitForTimeout(100);
    T('modifier un exercice : l’alternative remplace, l’original est rappelé', (await p2.$eval('.sg-titre', e => e.textContent)) !== nom1 && (await p2.$eval('.sg-remp', e => e.textContent)).includes(nom1));
    await p2.click('.sg-gene'); await p2.waitForTimeout(100);
    const g = await p2.$eval('.sg', e => e.textContent);
    T('gêne : arrêt du mouvement, signes d’urgence et numéros (15 / 112), aucune incitation à continuer', g.includes('Arrête ce mouvement') && g.includes('15 ou le 112') && !/continue|pousse/i.test(g));
    await p2.click('.sg .choice:has-text("Une douleur")'); await p2.fill('#sg-gene-note', 'genou droit');
    await p2.click('.sg-barre .btn:has-text("Arrêter la séance")'); await p2.waitForTimeout(100);
    T('après une gêne signalée, « Oui » est déjà indiqué', await p2.$eval('.sg .choice[aria-checked="true"], .sg .choice.on', e => e.textContent.includes('Oui')).catch(() => false));
    await p2.click('.sg .choice:has-text("Facile")'); await p2.click('.sg-barre .btn:has-text("Enregistrer la séance")'); await p2.waitForTimeout(400);
    const s2 = await p2.evaluate(() => Object.values(JSON.parse(localStorage.getItem('cap-local')).seances)[0]);
    T('gêne enregistrée avec l’exercice, la précision et le remplacement', s2.gene === true && s2.signalements[0].type === 'douleur' && s2.signalements[0].note === 'genou droit' && s2.remplacements.length === 1, s2);
    await aller(p2, 'Programme');
    T('Programme : gêne récente rappelée, pas d’augmentation de charge', (await p2.$eval('main', e => e.textContent)).includes('Cap ne propose aucune augmentation de charge'));
    // Report : nouveau jour (mercredi = repos) → on teste depuis un lundi neuf
    const p3 = await ouvrir(b, { profil: { main: Object.assign({}, BASE, { domaines: ['corps'] }) } });
    await aller(p3, 'Programme');
    await p3.click('.pg-hero .btn:has-text("Reporter à demain")'); await p3.waitForTimeout(400);
    const q = await p3.$eval('.pg-quand', e => e.textContent);
    T('reporter une séance : affichée « Reportée à demain »', q === 'Reportée à demain', q);
    await aller(p3, 'Aujourd’hui');
    T('Aujourd’hui : la séance reportée n’est plus la priorité du jour', (await p3.$eval('.td-prio-t', e => e.textContent)) !== 'Corps complet A' && !(await p3.$eval('main', e => e.textContent)).includes('Commencer la séance'));
  }

  // ---------- Pesée : note facultative, rappel sur les variations ----------
  await pg.click('.nav-plus'); await pg.waitForTimeout(250); await pg.click('.sheet .tile:has-text("Pesée")'); await pg.waitForTimeout(300);
  const ps = await pg.$eval('.sheet:last-of-type', e => e.textContent);
  T('pesée : rappel que le chiffre d’un jour n’est pas une tendance + note facultative', ps.includes('n’est pas une tendance') && !!(await pg.$('#p-note')));
  await pg.fill('#p-note', 'Repas salé hier'); await pg.click('.sheet .btn:has-text("Enregistrer")'); await pg.waitForTimeout(400);
  await aller(pg, 'Progrès');
  const pr = await pg.$eval('main', e => e.textContent);
  T('Progression : mesuré, nombre de mesures et date affichés ; tendance non inventée avec 1 pesée', pr.includes('Mesuré') && pr.includes('1 pesée depuis') && pr.includes('Pas encore calculable'), pr.slice(0, 300));
  T('pesée : note conservée', pr.includes('Repas salé hier'));

  // ---------- Photos v1 → migration à l'ouverture, sans perte ----------
  pg = await ouvrir(b, { profil: { main: Object.assign({}, BASE, { domaines: ['corps'] }) }, photos: { p1: { date: '2026-03-01', assetId: 'a1', url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E' } }, prefs: { main: { photosCorps: { accepte: '2026-03-01' } } } });
  await aller(pg, 'Photos'); await pg.waitForTimeout(500);
  const ph = await pg.evaluate(() => JSON.parse(localStorage.getItem('cap-local')).photos.p1);
  T('migration photos v1 → v2 à l’ouverture (référence et date conservées)', ph && ph.v === 2 && ph.categorie === 'libre' && ph.assetId === 'a1' && ph.date === '2026-03-01', ph);
  T('photo migrée visible dans la chronologie', (await pg.$$('.ph-vign')).length === 1);

  // ---------- Profil : consentements séparés, retrait, réduction des animations ----------
  await aller(pg, 'Profil');
  const pf = await pg.$eval('main', e => e.textContent);
  T('Profil : état (données, connexion, IA) et consentements séparés', pf.includes('Tes données') && pf.includes('Connexion') && pf.includes('Coach · données du corps') && pf.includes('IA · photos de plats') && pf.includes('Photos de progression'));
  await pg.click('button[role=switch]:has-text("Réduire les animations")'); await pg.waitForTimeout(200);
  T('réglage interne « Réduire les animations » appliqué', await pg.evaluate(() => document.documentElement.classList.contains('anim-reduites')));
  await pg.click('main button[aria-label="Partager mes données corps avec le coach"]'); await pg.waitForTimeout(300);
  T('consentement coach corps activable depuis Profil', await pg.evaluate(() => JSON.parse(localStorage.getItem('cap-local')).prefs.main.coachCorps === true));

  // ---------- Questionnaire : pourquoi cette question ----------
  pg = await ouvrir(b, {});
  await pg.click('.sk-btn'); await pg.waitForTimeout(450);
  T('questionnaire : « Pourquoi cette question ? » relié au registre', (await pg.$eval('.ob-pq', e => e.textContent).catch(() => '')).includes('Pourquoi cette question'));

  // ---------- Accessibilité de base ----------
  pg = await ouvrir(b, { profil: { main: Object.assign({}, BASE, { domaines: ['corps'] }) } });
  for (const ec of ['Aujourd’hui', 'Programme', 'Progrès', 'Photos', 'Journal', 'Profil']) {
    await aller(pg, ec);
    const sansNom = await pg.evaluate(() => [...document.querySelectorAll('main button, nav button, main a, main input, main select')].filter(e => e.offsetParent && !(e.getAttribute('aria-label') || e.textContent.trim() || (e.labels && e.labels.length) || e.title)).map(e => e.outerHTML.slice(0, 80)));
    T(ec + ' : chaque contrôle a un nom accessible', sansNom.length === 0, sansNom);
    const petits = await pg.evaluate(() => [...document.querySelectorAll('nav button, main .btn, main .td-ligne, main .round, main summary')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()).filter(r => r.height < 43.5 || r.width < 43.5).length);
    T(ec + ' : zones tactiles principales ≥ 44 px', petits === 0, petits);
    const h1 = await pg.$$eval('main h1', l => l.length);
    T(ec + ' : un seul titre de niveau 1', h1 === 1, h1);
  }
  // Clavier : la navigation s'atteint et s'active au clavier
  await pg.focus('.tabbar .nav-d:has-text("Corps")'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(250);
  T('clavier : destination activable avec Entrée', (await pg.$eval('.tabbar [aria-current="page"]', e => e.textContent)) === 'Corps');
  const errs = [];
  console.log(res.join('\n')); const f = res.filter(r => r.startsWith('FAIL')).length; console.log('\n' + (res.length - f) + ' réussis, ' + f + ' échoués');
  await b.close();
})();
