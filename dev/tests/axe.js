/* Audit axe-core (WCAG 2.1 A/AA) de chaque écran. axe-core n'est pas une dépendance du dépôt :
 * AXE=/chemin/vers/axe.min.js node axe.js (npm install axe-core dans un dossier temporaire). */
const { chromium, devices } = require('playwright');
const fs = require('fs'), aller = require('./nav');
const AXE = fs.readFileSync(process.env.AXE, 'utf8');
const PROFIL = { v: 2, domaines: ['corps', 'argent', 'entreprise'], sexe: 'H', age: 22, taille: 178, poids: 78, objectif: 'perdre', cible: 73, delaiSem: 20, activite: 'mixte', niveau: 'intermediaire', lieu: 'salle', jours: 3, minutes: 50, autreSport: 0, tempsLibre: 12, prioriteSport: 'muscle', contraintes: ['aucune'], obstacle: 'regularite', regime: 'omnivore', revenus: 1900, fixes: 800, variables: 450, remboursements: 0, epargne: 2500, reve: 'appart', reveMontant: 250000, reveAnnee: 2034, pays: 'france', capital: 600, competences: ['code'], materielPro: ['ordinateur'], heuresProjet: 8, experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux' };
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext(devices['iPhone 14'])).newPage();
  await pg.goto('file://' + __dirname + '/out/page.html');
  await pg.evaluate(p => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify({ profil: { main: p }, pesees: { a: { date: '2026-11-01', poids: 77 }, b: { date: '2026-11-08', poids: 76.6 } } })); }, PROFIL);
  await pg.reload(); await pg.waitForTimeout(600);
  let total = 0;
  for (const ec of ['Aujourd’hui', 'Programme', 'Journal', 'Progrès', 'Photos', 'Finances', 'Business', 'Profil']) {
    await aller(pg, ec); await pg.waitForTimeout(250);
    await pg.addScriptTag({ content: AXE });
    const r = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 2).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]) })));
    total += r.length;
    console.log((r.length ? 'FAIL ' : 'ok   ') + ec + ' : ' + r.length + ' violation(s)' + (r.length ? '\n' + r.map(v => '   - ' + v.id + ' (' + v.impact + ', ' + v.n + ') ' + v.ex.join(' | ')).join('\n') : ''));
  }
  console.log('\ntotal : ' + total); await b.close();
})();
