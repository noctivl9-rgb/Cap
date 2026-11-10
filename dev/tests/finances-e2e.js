/* Parcours finances de bout en bout : budget déclaré, dépense, modification, recalcul, résultat. */
const { chromium, devices } = require('playwright');
const aller = require('./nav');
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300)));
const P = { v: 2, domaines: ['argent'], sexe: 'H', age: 22, revenus: 1500, fixes: 700, variables: 300, remboursements: 0, epargne: 500, reve: 'appart', reveAnnee: 2032, reveMontant: 200000, creeLe: '2026-11-01T10:00:00Z' };
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext(devices['iPhone 14'])).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.clock.setFixedTime(new Date('2026-11-10T10:00:00'));
  await pg.goto('file://' + __dirname + '/out/page.html');
  await pg.evaluate(p => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify({ profil: { main: p } })); }, P);
  await pg.reload(); await pg.waitForTimeout(500); await aller(pg, 'Finances');
  const sh = '.sheet:last-of-type', txt = async () => (await pg.$eval('main', e => e.textContent)).replace(/ /g, ' ');
  T('1. budget déclaré pris en compte (aucune opération : rien d’inventé)', (await txt()).includes('Aucune opération saisie ce mois-ci'));
  const ajout = async (sens, m, cat, note) => { await pg.click('main .btn:has-text("Opération")'); await pg.waitForTimeout(250); if (sens === 'revenu') { await pg.click(sh + ' .choice:has-text("Revenu")'); await pg.waitForTimeout(80); } await pg.fill('#op-m', String(m)); await pg.click(sh + ' .choice:has-text("' + cat + '")'); if (note) await pg.fill('#op-n', note); await pg.click(sh + ' .btn:has-text("Enregistrer")'); await pg.waitForTimeout(350); };
  await ajout('depense', 42.5, 'Courses', 'Supermarché');
  await ajout('depense', 120, 'Loisirs', 'Concert');
  await ajout('revenu', 600, 'Salaire', null);
  let t = await txt();
  T('2. dépenses ajoutées : 162,50 € dépensés sur 1 000 € déclarés', /162,50\s€ sur 1\s000\s€/.test(t), t.slice(t.indexOf('Dépensé'), t.indexOf('Dépensé') + 80));
  T('« où ai-je le plus dépensé ? » → Loisirs et sorties', /Plus gros poste\s*Loisirs et sorties : 120\s€/.test(t));
  // 3. Modification
  await pg.click('summary:has-text("Historique des opérations")'); await pg.click('.fi-op:has-text("Concert")'); await pg.waitForTimeout(250);
  await pg.fill('#op-m', '80'); await pg.click(sh + ' .btn:has-text("Enregistrer la modification")'); await pg.waitForTimeout(350);
  t = await txt();
  T('3-4. modification et recalcul : 122,50 €', /122,50\s€ sur 1\s000\s€/.test(t));
  T('5. solde du mois : 600 − 122,50 = +477,50 €', /solde \+477,50\s€/.test(t));
  // Validation : montant invalide
  await pg.click('main .btn:has-text("Opération")'); await pg.waitForTimeout(250); await pg.fill('#op-m', '0'); await pg.click(sh + ' .choice:has-text("Transport")'); await pg.click(sh + ' .btn:has-text("Enregistrer")'); await pg.waitForTimeout(150);
  T('donnée invalide refusée avec message', (await pg.$eval(sh + ' .err', e => e.textContent)).includes('Montant positif'));
  T('aucune erreur JavaScript', errs.length === 0, errs);
  console.log(res.join('\n')); const f = res.filter(x => x.startsWith('FAIL')).length; console.log('\n' + (res.length - f) + ' réussis, ' + f + ' échoués'); await b.close();
})();
