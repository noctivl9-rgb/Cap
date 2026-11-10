/* Mesure la quantité de texte visible par écran (mots hors <details> fermés) et le nombre d'éléments interactifs.
 * Usage : bash build.sh && node densite.js [fichier-json-sortie] */
const { chromium, devices } = require('playwright');
const aller = require('./nav').seul, fs = require('fs');
const PROFIL = { v: 2, domaines: ['corps', 'argent', 'entreprise'], sexe: 'H', age: 22, taille: 178, poids: 78, objectif: 'perdre', cible: 73, delaiSem: 20, activite: 'mixte', niveau: 'intermediaire', lieu: 'salle', jours: 3, minutes: 50, autreSport: 0, tempsLibre: 12, prioriteSport: 'muscle', contraintes: ['douleur'], zonesDouleur: ['genou'], obstacle: 'regularite', regime: 'omnivore', revenus: 1900, fixes: 800, variables: 450, remboursements: 0, epargne: 2500, reve: 'appart', reveMontant: 250000, reveAnnee: 2034, revenuVise: 3000, pays: 'france', capital: 600, competences: ['code'], materielPro: ['ordinateur'], heuresProjet: 8, experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux', creeLe: '2026-09-01T10:00:00Z' };
const J = d => new Date(Date.parse('2026-11-10') - d * 864e5).toISOString().slice(0, 10);
const MEM = { profil: { main: PROFIL }, pesees: { a: { date: J(42), poids: 78.4 }, b: { date: J(28), poids: 77.6, tour: 88 }, c: { date: J(14), poids: 77.1 }, d: { date: J(1), poids: 76.5, tour: 86.5 } },
  epargne: { m1: { date: J(30), montant: 150, note: 'Salaire' }, m2: { date: J(3), montant: 200 } }, seances: { s1: { date: J(5), cle: 'FA', nom: 'Corps complet A', ressenti: 'ok' } },
  repas: { [J(0)]: { date: J(0), items: [{ id: 'i1', n: 'Flocons d’avoine', q: 60, k: 225, p: 8, c: 36, f: 4, slot: 'petit_dej' }], eauMl: 750, activites: [] } },
  operations: { o1: { date: J(2), sens: 'depense', montant: 42, categorie: 'alimentation' }, o2: { date: J(4), sens: 'depense', montant: 60, categorie: 'loisirs' } } };
module.exports = { PROFIL, MEM };
if (require.main === module) (async () => {
  const b = await chromium.launch(), pg = await (await b.newContext(devices['iPhone 14'])).newPage();
  await pg.clock.setFixedTime(new Date('2026-11-10T09:30:00'));
  await pg.goto('file://' + __dirname + '/out/page.html');
  await pg.evaluate(m => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify(m)); }, MEM);
  await pg.reload(); await pg.waitForTimeout(500);
  const out = {}; let tot = 0;
  for (const ec of ['Aujourd’hui', 'Programme', 'Journal', 'Progrès', 'Photos', 'Finances', 'Business', 'Profil']) {
    await aller(pg, ec); await pg.waitForTimeout(250);
    const r = await pg.evaluate(() => {
      const m = document.querySelector('main'), w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); let mots = 0, n;
      while ((n = w.nextNode())) { const el = n.parentElement; if (!el || !el.offsetParent || el.closest('.sr')) continue; const cache = (el) => { for (let d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) { if (!d.open) { const s = d.querySelector(':scope > summary'); if (!(s && s.contains(el))) return true; } } return false; }; if (cache(el)) continue; mots += (n.textContent.match(/[A-Za-zÀ-ÿ0-9’']+/g) || []).length; }
      return { mots, hauteur: Math.round(m.scrollHeight / innerHeight * 10) / 10, paragraphes: [...m.querySelectorAll('p')].filter(p => p.offsetParent && p.textContent.trim().split(/\s+/).length > 12).length };
    });
    out[ec] = r; tot += r.mots;
  }
  out.total = tot; console.log(JSON.stringify(out, null, 1)); if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out));
  await b.close();
})();
