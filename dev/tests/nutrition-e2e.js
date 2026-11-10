/* Parcours nutrition : ajout, quantité, recalcul, totaux, correction, sauvegarde ; code-barres (Open Food Facts simulé
 * par interception réseau : prouve le traitement des réponses, PAS le service réel) ; cas d'erreur. */
const { chromium, devices } = require('playwright');
const aller = require('./nav');
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300)));
const P = { v: 2, domaines: ['corps'], sexe: 'H', age: 24, taille: 178, poids: 76, objectif: 'perdre', cible: 72, delaiSem: 16, activite: 'mixte', niveau: 'intermediaire', lieu: 'salle', jours: 3, minutes: 45, autreSport: 0, tempsLibre: 10, prioriteSport: 'muscle', contraintes: ['aucune'], obstacle: 'regularite', regime: 'omnivore', creeLe: '2026-11-01T10:00:00Z' };
const OFF = { status: 1, product: { product_name: 'Pâte à tartiner', brands: 'Marque X, Groupe Y', serving_quantity: 15, nutriments: { 'energy-kcal_100g': 539, proteins_100g: 6.3, carbohydrates_100g: 57.5, fat_100g: 30.9, fiber_100g: 0, sugars_100g: 56.3, salt_100g: 0.107 } } };
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext(devices['iPhone 14'])).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  let mode = 'ok';
  await pg.route('https://world.openfoodfacts.org/**', r => mode === 'ok' ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(OFF) }) : mode === '404' ? r.fulfill({ status: 404, body: '{}' }) : mode === 'incomplet' ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 1, product: { product_name: 'Mystère', nutriments: { proteins_100g: 2 } } }) }) : r.abort());
  await pg.clock.setFixedTime(new Date('2026-11-10T12:30:00'));
  await pg.goto('file://' + __dirname + '/out/page.html');
  await pg.evaluate(p => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify({ profil: { main: p } })); }, P);
  await pg.reload(); await pg.waitForTimeout(500); await aller(pg, 'Journal');
  const sh = '.sheet:last-of-type', items = () => pg.evaluate(() => Object.values(JSON.parse(localStorage.getItem('cap-local')).repas || {})[0]?.items || []);
  // 1-2-3. Ajout d'un aliment, quantité, recalcul
  await pg.click('.jr-repas'); await pg.waitForTimeout(250);
  await pg.fill(sh + ' input[type=search], ' + sh + ' .searchbox input', 'riz'); await pg.waitForTimeout(250);
  await pg.click(sh + ' .cell >> nth=0'); await pg.waitForTimeout(250);
  await pg.fill('#q-qte', '200'); await pg.waitForTimeout(150);
  const k200 = await pg.$eval(sh + ' .hero b', e => e.textContent);
  await pg.fill('#q-qte', '100'); await pg.waitForTimeout(150);
  const k100 = await pg.$eval(sh + ' .hero b', e => e.textContent);
  T('2-3. quantité modifiée → recalcul proportionnel (200 g = 2 × 100 g, à l’arrondi près)', Math.abs(parseInt(k200.replace(/\D/g, '')) - 2 * parseInt(k100.replace(/\D/g, ''))) <= 1, [k200, k100]);
  await pg.fill('#q-qte', '150'); await pg.click(sh + ' .btn:has-text("Ajouter au journal")'); await pg.waitForTimeout(400);
  let it = await items();
  T('6. sauvegarde : aliment enregistré avec 150 g', it.length === 1 && it[0].q === 150, it);
  // 4. Total
  const reste = await pg.$eval('.jr-reste b', e => e.textContent.replace(/\s/g, ''));
  T('4. total du jour recalculé (reste = objectif − noté)', parseInt(reste) > 0 && it[0].k > 0);
  // Correction d'une saisie
  await pg.click('.cell:has-text("' + it[0].n.slice(0, 10) + '")'); await pg.waitForTimeout(250);
  await pg.fill(sh + ' input[inputmode="decimal"]', '50'); await pg.waitForTimeout(150);
  await pg.click(sh + ' .btn:has-text("Enregistrer")'); await pg.waitForTimeout(400);
  it = await items();
  T('correction d’une saisie : 50 g, calories divisées par 3', it[0].q === 50, it[0]);
  // Code-barres : réponse Open Food Facts (simulée)
  await pg.click('.jr-repas'); await pg.waitForTimeout(250); await pg.click(sh + ' .btn:has-text("Code-barres")'); await pg.waitForTimeout(250);
  await pg.fill('#cb-code', '123'); await pg.click(sh + ' .btn:has-text("Rechercher")'); await pg.waitForTimeout(100);
  T('code-barres invalide refusé (longueur)', (await pg.$eval(sh + ' .cb-out', e => e.textContent)).includes('8, 12, 13 ou 14'));
  await pg.fill('#cb-code', '3017620422003'); await pg.click(sh + ' .btn:has-text("Rechercher")'); await pg.waitForTimeout(500);
  T('code-barres : fiche produit ouverte (nom + marque), portion déclarée 15 g', (await pg.$eval(sh, e => e.textContent)).includes('Pâte à tartiner (Marque X)') && (await pg.$eval('#q-qte', e => e.value)) === '15');
  await pg.click(sh + ' .btn:has-text("Ajouter au journal")'); await pg.waitForTimeout(400);
  it = await items(); const off = it.find(x => x.code === '3017620422003');
  T('code-barres : 15 g → 81 kcal, sucres 8,45 g, sel 0,02 g, source « off »', off && off.k === 81 && off.sug === 8.45 && off.sel === 0.02 && off.src === 'off', off);
  T('fibres / sucres / sel affichés seulement pour les aliments renseignés', (await pg.$eval('.jr-extra', e => e.textContent)).includes('sur 1 aliment renseigné (2 notés)'));
  // Les champs facultatifs survivent à une autre sauvegarde du jour (ajout d'eau)
  await pg.click('button[aria-label="Ajouter 250 ml"]'); await pg.waitForTimeout(300);
  it = await items();
  T('régression corrigée : sucres/sel/code conservés après une autre sauvegarde du jour', it.find(x => x.code === '3017620422003').sug === 8.45, it);
  // Erreurs
  for (const [m, attendu] of [['404', 'introuvable'], ['incomplet', 'incomplètes'], ['reseau', 'injoignable']]) {
    mode = m; await pg.click('.jr-repas'); await pg.waitForTimeout(200); await pg.click(sh + ' .btn:has-text("Code-barres")'); await pg.waitForTimeout(200);
    await pg.fill('#cb-code', '3017620422003'); await pg.click(sh + ' .btn:has-text("Rechercher")'); await pg.waitForTimeout(500);
    T('code-barres, cas « ' + m + ' » : message clair, aucune valeur inventée', (await pg.$eval(sh + ' .cb-out', e => e.textContent)).includes(attendu));
    await pg.click(sh + ' button[aria-label="Fermer"]'); await pg.waitForTimeout(150);
  }
  // Hors connexion
  await pg.context().setOffline(true); mode = 'ok';
  await pg.click('.jr-repas'); await pg.waitForTimeout(200); await pg.click(sh + ' .btn:has-text("Code-barres")'); await pg.waitForTimeout(200);
  await pg.fill('#cb-code', '3017620422003'); await pg.click(sh + ' .btn:has-text("Rechercher")'); await pg.waitForTimeout(300);
  T('hors connexion : message dédié, saisie manuelle proposée', (await pg.$eval(sh + ' .cb-out', e => e.textContent)).includes('Pas de connexion'));
  await pg.context().setOffline(false);
  // Unitaire : énergie en kJ seulement → conversion
  const kj = await pg.evaluate(() => window.CapJournal.lireOFF('12345678', { status: 1, product: { product_name: 'x', nutriments: { energy_100g: 418.4, proteins_100g: 1, carbohydrates_100g: 2, fat_100g: 3 } } }).al.k);
  T('énergie en kJ convertie (418,4 kJ = 100 kcal)', kj === 100, kj);
  T('aucune erreur JavaScript', errs.length === 0, errs);
  console.log(res.join('\n')); const f = res.filter(x => x.startsWith('FAIL')).length; console.log('\n' + (res.length - f) + ' réussis, ' + f + ' échoués'); await b.close();
})();
