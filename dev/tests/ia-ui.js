/* Test d'interface du parcours IA (version Claude), iPhone 14 simulé. Réponses du modèle SCRIPTÉES (annoncées comme
 * telles) pour tester la mécanique de l'interface ; les vrais appels sont testés par le banc « Cap essais IA » + reel-verif.js.
 * Séances : réponse réelle A1 ; analyse et objectifs : écrits pour le test (fixtures/ia-karim-complet.json, champ _note).
 * Parcours : questions bloquantes → réponse → programme qui utilise la réponse → réouverture → « Pourquoi ? » →
 * temps libre modifié → ajustements proposés → appliqués → panne du service. Lancer depuis dev/tests : node ia-ui.js */
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const OUT = path.join(__dirname, 'out');
const complet = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/ia-karim-complet.json'), 'utf8')); delete complet._note;
const KARIM = { v: 2, domaines: ['corps'], age: 34, sexe: 'H', taille: 181, poids: 96, tour: 104, objectif: 'perdre', cible: 86, delaiSem: 40, activite: 'assis', autreSport: 1, niveau: 'debutant', jours: 3, minutes: 45, lieu: 'maison', materielSport: ['halteres', 'elastique'], prioriteSport: 'auto', contraintes: ['douleur'], zonesDouleur: ['genou'], tempsLibre: 8, obstacle: 'regularite', regime: 'omnivore', modeSimple: true, creeLe: '2026-11-10T08:00:00Z' };
const R = {
  questions: { pret: false, analyse: complet.analyse, questions: [{ id: 'charge_halteres', question: 'Quelle charge maximale permettent tes haltères ?', type: 'texte', raison: 'La charge disponible fixe la progression possible.', consequence: 'Nombre de répétitions et date de passage à des exercices plus durs.', bloquante: true, module: 'corps' }] },
  programme: Object.assign({}, complet, { complementsUtilises: [{ id: 'charge_halteres', effet: 'Haltères jusqu’à 12 kg : répétitions entre 10 et 15 puis tempo lent pour progresser.' }] }),
  adaptation: Object.assign({}, complet, { complementsUtilises: [{ id: 'charge_halteres', effet: 'Toujours 12 kg maximum : progression par le tempo.' }], ajustements: [{ changement: 'Temps libre 8 h → 3 h', consequence: 'Les 3 séances ne tiennent plus avec l’autre sport', ajustement: '2 séances de 40 min, gainage déplacé en fin de séance' }], progresConserves: ['Exercices maîtrisés conservés'], seances: complet.seances.slice(0, 2) }),
  pourquoi: { reponse: 'Tu as indiqué une douleur au genou et 8 h libres avec la régularité comme frein : Cap a retiré les squats et les fentes et fixé 3 séances courtes.', reponsesCitees: ['genou', '8 h', 'régularité'] }
};
const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style><script>' +
  'window.__R=' + JSON.stringify(R) + ';window.__SCENARIO="questions";window.__PANNE=false;window.claude={use:async n=>{if(n!=="sample")return null;const f=async(prompt)=>{if(window.__PANNE)throw{code:"rate_limited",message:"sampling too often"};' +
  'const k=/TÂCHE : répondre à la question/.test(prompt)?"pourquoi":window.__SCENARIO;window.__DERNIER=prompt;return{text:JSON.stringify(window.__R[k]),truncated:false,modelApplied:"scripté (test)"}};f.json=async()=>({});f.limits=async()=>({images:{mediaTypes:["image/jpeg"]}});return f}}</script></head><body>' +
  fs.readFileSync(path.join(OUT, 'index.html'), 'utf8') + '</body></html>';
fs.writeFileSync(path.join(OUT, 'ia.html'), page);
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300)));
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(OUT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(OUT) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(r); }).listen(8770);
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 14'] }); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8770/ia.html'); await pg.waitForTimeout(300);
  await pg.evaluate(p => { localStorage.setItem('cap-local', JSON.stringify({ profil: { main: p } })); localStorage.setItem('cap-intro', String(Date.now())); }, KARIM);
  await pg.reload(); await pg.waitForTimeout(1000);
  const main = () => pg.$eval('main', e => e.textContent.replace(/[  ]/g, ' '));
  const fermer = async t => { await pg.click('.sheet:has-text("' + t + '") [aria-label="Fermer"]'); await pg.waitForTimeout(350); };
  const nbProg = () => pg.evaluate(() => Object.values(JSON.parse(localStorage.getItem('cap-local')).programmes || {}));
  await pg.click('.tabbar button:has-text("Programme")'); await pg.waitForTimeout(400);
  T('avant génération : programme calculé par les règles, présenté comme tel', /Programme calculé par les règles de Cap/.test(await main()));
  // 1. Questions bloquantes
  await pg.click('main button:has-text("Générer mon programme avec l’IA")');
  await pg.waitForSelector('.sheet:has-text("Avant de créer ton programme")', { timeout: 15000 });
  T('information décisive manquante : questions avant tout programme', (await nbProg()).length === 0);
  T('la demande envoyée ne contient pas le programme par règles', !/programmeReferenceCap|"Corps complet A","exercices"/.test(await pg.evaluate(() => window.__DERNIER)));
  await pg.fill('#qc-charge_halteres', '12 kg par haltère'); await pg.click('.sheet button:has-text("Enregistrer")'); await pg.waitForTimeout(500);
  await fermer('Avant de créer ton programme');
  // 2. Programme qui utilise la réponse
  await pg.evaluate(() => { window.__SCENARIO = 'programme'; });
  await pg.click('main button:has-text("Générer mon programme avec l’IA")');
  await pg.waitForSelector('.sheet:has-text("Programme généré et vérifié")', { timeout: 15000 });
  T('la réponse complémentaire est envoyée au modèle', /12 kg par haltère/.test(await pg.evaluate(() => window.__DERNIER)));
  await fermer('Programme généré et vérifié');
  let m = await main();
  T('programme IA affiché comme « généré par IA et vérifié par Cap »', /Programme généré par IA et vérifié par Cap/.test(m));
  await pg.click('main details summary:has-text("Analyse de ta situation")'); await pg.waitForTimeout(200);
  m = await main();
  T('analyse, objectifs datés, calendrier et adaptations affichés', /Karim, 34 ans/.test(m) && /10 semaines/.test(m) && /Semaines 1-3/.test(m) && /Si le genou fait mal/.test(m));
  T('réponse complémentaire : effet expliqué', /Haltères jusqu’à 12 kg/.test(m));
  T('avertissement : la vérification ne garantit pas l’absence de risque', /ne garantit pas l’absence de risque/.test(m));
  await pg.screenshot({ path: path.join(__dirname, 'ia-programme.png'), fullPage: true });
  // 3. Réouverture
  await pg.reload(); await pg.waitForTimeout(900); await pg.click('.tabbar button:has-text("Programme")'); await pg.waitForTimeout(400);
  T('F · après réouverture : programme IA et réponse complémentaire conservés', /Programme généré par IA et vérifié par Cap/.test(await main()) && /12 kg par haltère/.test(await pg.evaluate(() => localStorage.getItem('cap-local'))));
  // 4. Pourquoi
  await pg.click('main button:has-text("Pourquoi ce programme ?")'); await pg.waitForTimeout(300);
  await pg.click('.sheet button:has-text("Demander à l’IA")'); await pg.waitForTimeout(800);
  const pq = await pg.$eval('.sheet:has-text("Pourquoi ce programme")', e => e.textContent);
  T('I · « Pourquoi ? » : réponse fondée sur ses réponses', /genou/.test(pq) && /8 h/.test(pq));
  await fermer('Pourquoi ce programme');
  // 5. Temps libre réduit → changement détecté → ajustements proposés (programme actuel conservé) → appliqués
  await pg.evaluate(() => { const d = JSON.parse(localStorage.getItem('cap-local')); d.profil.main.tempsLibre = 3; localStorage.setItem('cap-local', JSON.stringify(d)); });
  await pg.reload(); await pg.waitForTimeout(900); await pg.click('.tabbar button:has-text("Programme")'); await pg.waitForTimeout(400);
  m = await main();
  T('C · temps libre réduit : programme IA signalé (changement ou suspension)', /Tes réponses ont changé|Programme IA suspendu/.test(m) && /temps libre/.test(m), m.slice(0, 300));
  await pg.evaluate(() => { window.__SCENARIO = 'adaptation'; });
  await pg.click('main button:has-text("Adapter avec l’IA")');
  await pg.waitForSelector('.sheet:has-text("Ajustements proposés et vérifiés")', { timeout: 15000 });
  await fermer('Ajustements proposés et vérifiés');
  m = await main();
  const progs = await nbProg();
  T('adaptation proposée, pas imposée : ancien programme toujours actif', progs.length === 2 && progs.filter(x => x.actif).length === 1 && progs.some(x => x.statut === 'propose') && /Ajustements proposés par l’IA/.test(m));
  T('ajustement expliqué (changement → conséquence → ajustement) et progrès conservés', /Temps libre 8 h → 3 h/.test(m) && /Progrès conservés/.test(m));
  await pg.click('main button:has-text("Appliquer les ajustements")'); await pg.waitForTimeout(500);
  const apres = await nbProg();
  T('ajustements appliqués : nouvelle version active, ancienne conservée dans l’historique', apres.length === 2 && apres.filter(x => x.actif).length === 1 && apres.find(x => x.actif).statut === 'accepte' && apres.some(x => !x.actif && x.remplacePar));
  // 6. Panne
  await pg.evaluate(() => { window.__PANNE = true; });
  await pg.click('main button:has-text("Adapter avec l’IA"), main button:has-text("Générer mon programme avec l’IA")');
  await pg.waitForSelector('.sheet:has-text("Génération non effectuée")', { timeout: 10000 });
  const pn = await pg.$eval('.sheet:has-text("Génération non effectuée")', e => e.textContent);
  T('J · panne du service : message honnête, programme actuel conservé', /Trop de demandes/.test(pn) && /reste affiché/.test(pn));
  T('aucune version supprimée', (await nbProg()).length === 2);
  T('aucune erreur de page', errs.length === 0, errs);
  console.log(res.join('\n'));
  console.log('\n' + res.filter(x => x.startsWith('ok')).length + ' réussis, ' + res.filter(x => x.startsWith('FAIL')).length + ' échoués');
  await b.close(); srv.close();
})().catch(e => { console.log(res.join('\n')); console.error(e); process.exit(1); });
