/* Captures de tous les écrans (profil complet Corps + Argent + Projet, données fictives) à 320, 390 et 1280 px.
 * Usage : bash build.sh && node ecrans.js  → out/ecr-<largeur>-<écran>.png ; affiche aussi débordements et erreurs. */
const { chromium, devices } = require('playwright');
const aller = require('./nav');
const PROFIL = { v: 2, domaines: ['corps', 'argent', 'entreprise'], sexe: 'H', age: 22, taille: 178, poids: 78, objectif: 'perdre', cible: 73, delaiSem: 20, activite: 'mixte', niveau: 'intermediaire', lieu: 'salle', jours: 3, minutes: 50, autreSport: 0, tempsLibre: 12, prioriteSport: 'muscle', contraintes: ['douleur'], zonesDouleur: ['genou'], obstacle: 'regularite', regime: 'omnivore',
  revenus: 1900, fixes: 800, variables: 450, remboursements: 0, epargne: 2500, reve: 'appart', reveMontant: 250000, reveAnnee: 2034, revenuVise: 3500,
  pays: 'france', capital: 600, competences: ['code'], materielPro: ['ordinateur'], heuresProjet: 8, experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux', creeLe: '2026-09-01T10:00:00Z' };
const J = d => new Date(Date.parse('2026-11-10') - d * 864e5).toISOString().slice(0, 10);
const MEM = { profil: { main: PROFIL }, pesees: { [J(42)]: { date: J(42), poids: 78.4 }, [J(28)]: { date: J(28), poids: 77.6, tour: 88 }, [J(14)]: { date: J(14), poids: 77.1 }, [J(1)]: { date: J(1), poids: 76.5, tour: 86.5 } },
  epargne: { m1: { date: J(30), montant: 150, note: 'Salaire' }, m2: { date: J(3), montant: 200, note: 'Salaire' } }, seances: { s1: { date: J(5), cle: 'FA', nom: 'Corps complet A', ressenti: 'ok' } },
  repas: { [J(0)]: { date: J(0), items: [{ id: 'i1', n: 'Flocons d’avoine', q: 60, k: 225, p: 8, c: 36, f: 4, slot: 'matin' }], eauMl: 750, activites: [] } }, ventes: {} };
(async () => {
  const b = await chromium.launch(), errs = [], bilan = [];
  for (const [nom, ctxOpt] of [['390', devices['iPhone 14']], ['320', { viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['1280', { viewport: { width: 1280, height: 860 } }]]) {
    const ctx = await b.newContext(ctxOpt); const pg = await ctx.newPage();
    await pg.clock.setFixedTime(new Date('2026-11-10T09:30:00'));
    pg.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await pg.goto('file://' + __dirname + '/out/page.html');
    await pg.evaluate(m => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify(m)); }, MEM);
    await pg.reload(); await pg.waitForTimeout(600);
    for (const ec of ['Aujourd’hui', 'Programme', 'Journal', 'Progrès', 'Photos', 'Finances', 'Business', 'Profil']) {
      await aller(pg, ec); await pg.waitForTimeout(250);
      const ov = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      bilan.push(nom + ' ' + ec + ' : débordement ' + ov + ' px');
      await pg.screenshot({ path: __dirname + '/out/ecr-' + nom + '-' + ec.replace(/[’ ]/g, '') + '.png', fullPage: true });
    }
    await ctx.close();
  }
  console.log(bilan.join('\n')); console.log('erreurs :', errs); await b.close();
})();
