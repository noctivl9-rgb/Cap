/* Test d'interface du parcours IA dans Cap (version Claude), iPhone 14 simulé.
 * La réponse « programme » rejouée ici est la VRAIE réponse du modèle obtenue par le banc d'essai (essai A1_karim,
 * enregistrée dans dev/tests/fixtures/reel-A1_karim.json) : on teste l'interface sur une sortie réelle, sans nouvel appel.
 * Vérifie : génération → validation → affichage « généré par IA et vérifié », persistance après réouverture,
 * « Pourquoi ce programme ? », changement de réponse détecté, panne du service annoncée honnêtement, retour au programme calculé.
 * Prérequis : bash dev/tests/build.sh. Lancer depuis dev/tests : node ia-ui.js */
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const OUT = path.join(__dirname, 'out');
const brut = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/reel-A1_karim.json'), 'utf8'));
const KARIM = { v: 2, domaines: ['corps'], age: 34, sexe: 'H', taille: 181, poids: 96, tour: 104, objectif: 'perdre', cible: 86, delaiSem: 40, activite: 'assis', autreSport: 1, niveau: 'debutant', jours: 3, minutes: 45, lieu: 'maison', materielSport: ['halteres', 'elastique'], prioriteSport: 'auto', contraintes: ['douleur'], zonesDouleur: ['genou'], tempsLibre: 8, obstacle: 'regularite', regime: 'omnivore', modeSimple: true, creeLe: '2026-11-10T08:00:00Z' };
const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style><script>' +
  'window.__APPELS=[];window.__PANNE=false;window.claude={use:async n=>{if(n!=="sample")return null;const f=async(prompt,o)=>{window.__APPELS.push(String(prompt).slice(0,200));if(window.__PANNE)throw{code:"rate_limited",message:"sampling too often"};' +
  'if(/TÂCHE : répondre à la question/.test(prompt))return{text:JSON.stringify({reponse:"Tu as indiqué une douleur au genou et 8 h libres par semaine : Cap a retiré les squats et les fentes, et limité le programme à 3 séances de 45 minutes car la régularité est ton frein principal.",reponsesCitees:["douleur au genou","8 h libres","régularité"]}),truncated:false};' +
  'return{text:' + JSON.stringify(JSON.stringify(brut)) + ',truncated:false,modelApplied:"rejoué (réponse réelle A1)"}};f.json=async()=>({});f.limits=async()=>({images:{mediaTypes:["image/jpeg"]}});return f}}</script></head><body>' +
  fs.readFileSync(path.join(OUT, 'index.html'), 'utf8') + '</body></html>';
fs.writeFileSync(path.join(OUT, 'ia.html'), page);
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300)));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 14'] }); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  // Profil installé UNE fois (un script de démarrage relancé à chaque rechargement pouvait écraser les données : faux positif)
  const srv = http.createServer((q, r) => { const f = path.join(OUT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(OUT) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(r); }).listen(8770);
  await pg.goto('http://localhost:8770/ia.html'); await pg.waitForTimeout(300);
  await pg.evaluate(p => { localStorage.setItem('cap-local', JSON.stringify({ profil: { main: p } })); localStorage.setItem('cap-intro', String(Date.now())); }, KARIM);
  await pg.reload(); await pg.waitForTimeout(1000);
  const main = () => pg.$eval('main', e => e.textContent.replace(/[  ]/g, ' '));
  await pg.click('.tabbar button:has-text("Programme")'); await pg.waitForTimeout(400);
  let m = await main();
  T('avant génération : programme calculé par les règles affiché', /Programme calculé par les règles de Cap/.test(m));
  T('bouton de génération IA actif', await pg.$('main button:has-text("Générer mon programme avec l’IA"):not([disabled])') !== null);
  await pg.click('main button:has-text("Générer mon programme avec l’IA")');
  await pg.waitForSelector('.sheet:has-text("Programme généré et vérifié")', { timeout: 15000 });
  const feuille = await pg.$eval('.sheet:has-text("Programme généré et vérifié")', e => e.textContent);
  T('réponse réelle du modèle acceptée par la validation', /Programme généré et vérifié/.test(feuille) && /rejoué/.test(feuille), feuille.slice(0, 200));
  await pg.click('.sheet:has-text("Programme généré et vérifié") [aria-label="Fermer"]'); await pg.waitForTimeout(400);
  m = await main();
  T('programme affiché comme « généré par IA et vérifié par Cap »', /Programme généré par IA et vérifié par Cap/.test(m));
  T('aucun exercice sollicitant le genou dans la semaine affichée', !/Squat au poids du corps|Fentes|Squat gobelet|Montées sur banc/.test(m.slice(m.indexOf('Ta semaine'))));
  await pg.screenshot({ path: path.join(__dirname, 'ia-programme.png') });
  // Persistance
  await pg.reload(); await pg.waitForTimeout(900); await pg.click('.tabbar button:has-text("Programme")'); await pg.waitForTimeout(400);
  T('F · après réouverture : programme IA conservé', /Programme généré par IA et vérifié par Cap/.test(await main()));
  // Pourquoi
  await pg.click('main button:has-text("Pourquoi ce programme ?")'); await pg.waitForTimeout(400);
  await pg.click('.sheet button:has-text("Demander à l’IA")'); await pg.waitForTimeout(800);
  const pq = await pg.$$eval('.sheet', s => s.map(x => x.textContent).join(' '));
  T('I · « Pourquoi ? » : explication fondée sur les réponses (genou, 8 h, régularité)', /genou/.test(pq) && /8 h/.test(pq), pq.slice(0, 300));
  await pg.click('.sheet [aria-label="Fermer"]').catch(() => {}); await pg.waitForTimeout(300);
  // Changement de réponse : temps libre 8 → 3 h
  await pg.evaluate(() => { const d = JSON.parse(localStorage.getItem('cap-local')); d.profil.main.tempsLibre = 3; localStorage.setItem('cap-local', JSON.stringify(d)); });
  await pg.reload(); await pg.waitForTimeout(900); await pg.click('.tabbar button:has-text("Programme")'); await pg.waitForTimeout(400);
  m = await main();
  T('C · temps libre réduit : programme IA signalé (changement ou suspension), pas gardé en silence', /Tes réponses ont changé|Programme IA suspendu/.test(m) && /temps libre/.test(m), m.slice(0, 400));
  // Panne du service
  await pg.evaluate(() => { window.__PANNE = true; });
  const bt = await pg.$('main button:has-text("Adapter avec l’IA"), main button:has-text("Générer mon programme avec l’IA")');
  await bt.click(); await pg.waitForSelector('.sheet:has-text("Génération non effectuée")', { timeout: 10000 });
  const pn = await pg.$eval('.sheet:has-text("Génération non effectuée")', e => e.textContent);
  T('J · panne du service : message honnête, programme actuel conservé', /Trop de demandes/.test(pn) && /reste affiché/.test(pn), pn);
  await pg.click('.sheet [aria-label="Fermer"]'); await pg.waitForTimeout(300);
  const versions = await pg.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('cap-local')).programmes || {}).length);
  T('historique : la version IA est conservée (aucune suppression)', versions === 1, versions);
  T('aucune erreur de page', errs.length === 0, errs);
  console.log(res.join('\n'));
  console.log('\n' + res.filter(x => x.startsWith('ok')).length + ' réussis, ' + res.filter(x => x.startsWith('FAIL')).length + ' échoués');
  await b.close(); srv.close();
})().catch(e => { console.log(res.join('\n')); console.error(e); process.exit(1); });
