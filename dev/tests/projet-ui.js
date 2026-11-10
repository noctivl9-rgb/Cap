/* Test d'interface : module Entreprise (questionnaire, onglet Projet, plan, tâches, ventes) et programme expliqué.
 * Mode sans compte (localStorage), iPhone 14 simulé. Prérequis : bash dev/tests/build.sh. Lancer depuis dev/tests : node projet-ui.js */
const aller = require('./nav');
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out');
const srv = http.createServer((q, r) => { const f = path.join(OUT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(OUT) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(r); }).listen(8768);
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300)));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 14'] }); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8768/page.html'); await pg.click('.sk-btn'); await pg.waitForTimeout(450);
  const cont = async () => { await pg.click('.ob-bar .btn:not(.text)'); await pg.waitForTimeout(230); };
  const pick = async t => { await pg.click('.choice:has-text("' + t + '")'); await pg.waitForTimeout(60); };
  const type = async v => { await pg.click('.ruler-value'); await pg.fill('.ruler-input', v); await pg.keyboard.press('Enter'); };
  const titre = () => pg.$eval('.stage h1', e => e.textContent).catch(() => '');
  const main = () => pg.$eval('main', e => e.textContent.replace(/[  ]/g, ' '));
  await pick('Créer une entreprise'); await cont();
  await type('16'); await cont(); await type('20'); await cont();
  T('module entreprise seul : compétences demandées', /sais déjà faire/.test(await titre()), await titre());
  await pick('Code (sites, applis)'); await cont(); await type('7'); await cont();
  await pg.click('.ob-bar .btn.text'); await pg.waitForTimeout(230); // revenu visé facultatif
  T('question pays posée', /pays/.test(await titre()), await titre()); await pick('France'); await cont();
  T('question capital posée', /investir/.test(await titre())); await pg.fill('#m-capital', '500'); await cont();
  await pick('Ordinateur'); await cont(); await pick('Des projets perso'); await cont(); await pick('Ça va'); await cont(); await pick('Moyen'); await cont(); await pick('Les deux me vont'); await cont();
  T('bilan atteint sans question du module corps ni argent', /Vérification/.test(await titre()), await titre());
  await cont(); await pg.waitForTimeout(300);
  await pg.waitForSelector('.rv'); await pg.click('.rv'); await pg.click('.rv-go'); await pg.waitForTimeout(350); await pg.click('.ob-bar .btn:not(.text), .ob-bar .sk-btn, .stage .sk-btn'); await pg.waitForTimeout(700);
  T('onglet Projet présent (Avenir › Business)', await pg.$('.tabbar .nav-d:has-text("Avenir")') !== null);
  await aller(pg, 'Projet'); await pg.waitForTimeout(400);
  let m = await main();
  T('origine honnête : calculé par les règles, IA indisponible', /Classement calculé par les règles de Cap/.test(m) && /indisponible/.test(m));
  const cartes = await pg.$$eval('main .pj-opt h3', hs => hs.map(h => h.textContent));
  T('trois activités affichées', cartes.length >= 3, cartes);
  T('une activité de code dans le top 3 (compétence + 500 €)', cartes.slice(0, 3).some(c => /sites|Maintenance|Automatisations/i.test(c)), cartes);
  T('activités écartées avec raison', /Activités écartées/.test(m) && /Non finançable|Écartée/.test(m));
  await pg.screenshot({ path: path.join(__dirname, 'projet-top.png') });
  const avant = cartes.slice(0, 3).join('|');
  // Choisir la première activité
  await pg.click('main button:has-text("Choisir cette activité") >> nth=0'); await pg.waitForTimeout(500);
  m = await main();
  T('plan financier affiché avec scénarios', /Scénarios de bénéfice net/.test(m) && /Prudent/.test(m) && /Favorable/.test(m));
  T('chiffres distingués : hypothèse, calcul, prévision, observé', /Hypothèse/.test(m) && /Calcul/.test(m) && /Prévision/.test(m) && /Observé/.test(m));
  T('plan d’action 30/60/90 affiché', /Plan d’action/.test(m) && /Jours 1 à 30/.test(m));
  // Cocher la première tâche
  await pg.click('main button[role=checkbox] >> nth=0'); await pg.waitForTimeout(400);
  T('tâche cochée', /1 tâche\(s\) sur/.test(await main()));
  // Vente réelle
  await pg.click('main button:has-text("Enregistrer une vente")'); await pg.waitForTimeout(300);
  await pg.fill('#m-montant', '350'); await pg.fill('#v-note', 'Garage test'); await pg.click('.sheet .btn:has-text("Enregistrer")'); await pg.waitForTimeout(500);
  m = await main();
  T('vente enregistrée : remplace la prévision du mois', /1 mois avec des ventes/.test(m) && /350 €/.test(m), m.slice(m.indexOf('Ventes réelles'), m.indexOf('Ventes réelles') + 200));
  await pg.screenshot({ path: path.join(__dirname, 'projet-plan.png'), fullPage: true });
  // Test F : fermeture puis réouverture
  await pg.reload(); await pg.waitForTimeout(900); await aller(pg, 'Projet'); await pg.waitForTimeout(400);
  m = await main();
  T('F · après réouverture : activité choisie, tâche faite et vente conservées', /Activité choisie/.test(m) && /1 tâche\(s\) sur/.test(m) && /Garage test/.test(m));
  // Test D dans l'interface : capital à 0 → classement recalculé
  await pg.click('main summary:has-text("Activités écartées")'); await pg.click('main button:has-text("Modifier mon capital")'); await pg.waitForTimeout(300);
  await pg.fill('.sheet #m-capital', '0'); await pg.click('.sheet button:has-text("Enregistrer")'); await pg.waitForTimeout(600);
  const apres = (await pg.$$eval('main .panel h3', hs => hs.map(h => h.textContent))).slice(0, 3).join('|');
  T('D · capital modifié dans l’interface : classement recalculé', apres !== avant, [avant, apres]);
  const hist = await pg.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('cap-local')).historique).length);
  T('historique : ancien profil conservé après modification', hist >= 2, hist);
  T('aucune erreur de page', errs.length === 0, errs);

  // Programme expliqué (module corps ajouté)
  const ctx2 = await b.newContext({ ...devices['iPhone 14'] }); const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push(e.message));
  await ctx2.addInitScript(() => { localStorage.setItem('cap-intro', String(Date.now())); localStorage.setItem('cap-local', JSON.stringify({ profil: { main: { v: 2, domaines: ['corps'], age: 16, tempsLibre: 3, sexe: 'H', taille: 170, poids: 71, objectif: 'perdre', cible: 66, delaiSem: 26, activite: 'assis', autreSport: 0, niveau: 'debutant', jours: 4, minutes: 60, lieu: 'maison', materielSport: ['aucun'], prioriteSport: 'auto', contraintes: ['aucune'], regime: 'omnivore', modeSimple: true, creeLe: '2026-11-10T08:00:00Z' } } })); });
  await p2.goto('http://localhost:8768/page.html'); await p2.waitForTimeout(900);
  await aller(p2, 'Programme'); await p2.waitForTimeout(400);
  const mp = await p2.$eval('main', e => e.textContent);
  T('programme : origine « calculé par les règles », IA indisponible', /Construit par les règles de Cap/.test(mp) && /pas généré par une IA/.test(mp));
  T('programme : décisions expliquées avec les réponses utilisées', /Limites appliquées/.test(mp) && /il te reste 3 h/.test(mp) && /D’après : temps libre/.test(mp));
  T('programme : 3 h libres → 4 × 60 min réduits, décision affichée', (await p2.$$('details.session')).length <= 4 && /Tu demandais 4 × 60 min/.test(mp));
  await p2.screenshot({ path: path.join(__dirname, 'programme-pourquoi.png'), fullPage: true });
  console.log(res.join('\n')); console.log('\nerreurs :', errs);
  console.log('\n' + res.filter(x => x.startsWith('ok')).length + ' réussis, ' + res.filter(x => x.startsWith('FAIL')).length + ' échoués');
  await b.close(); srv.close();
})().catch(e => { console.log(res.join('\n')); console.error(e); srv.close(); process.exit(1); });
