/* Parcours business de bout en bout (budget 250 €) et activité existante. bash build.sh && node business-e2e.js */
const { chromium, devices } = require('playwright');
const aller = require('./nav');
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300)));
const PROFIL = { v: 2, domaines: ['entreprise'], sexe: 'H', age: 22, pays: 'france', capital: 250, competences: ['code'], materielPro: [], heuresProjet: 8, experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux', creeLe: '2026-11-01T10:00:00Z' };
const lire = (pg, c) => pg.evaluate(c => Object.values(JSON.parse(localStorage.getItem('cap-local'))[c] || {}), c);
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext(devices['iPhone 14'])).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.clock.setFixedTime(new Date('2026-11-10T10:00:00'));
  await pg.goto('file://' + __dirname + '/out/page.html');
  await pg.evaluate(p => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify({ profil: { main: p } })); }, PROFIL);
  await pg.reload(); await pg.waitForTimeout(600);
  const sheet = '.sheet:last-of-type';
  // 1-2. Budget de 250 € et options
  await aller(pg, 'Business');
  let m = await pg.$eval('main', e => e.textContent);
  T('1. contraintes affichées (capital 250 €, 8 h par semaine)', /250\s€/.test(m.replace(/ /g, ' ')) && m.includes('8 h/sem'));
  const opts = await pg.$$eval('.pj-opt h3', l => l.map(e => e.textContent));
  T('2. options compatibles classées par les règles (2 à 3 selon le budget et le matériel)', opts.length >= 2 && opts.length <= 3, opts);
  // 3-4. Choix et plan
  await pg.click('.pj-opt.fort .btn:has-text("Choisir cette activité")'); await pg.waitForTimeout(500);
  T('3-4. plan créé : prochaine tâche affichée', !!(await pg.$('.pj-hero .pj-t')));
  // Matériel manquant (ordinateur ~500 €) > 250 € → tâche non finançable
  m = await pg.$eval('main', e => e.textContent).catch(() => '');
  const bloq = await pg.$$eval('.pj-cb[disabled]', l => l.length);
  T('budget contrainte : la tâche « matériel » (≈ 500 €) est non finançable avec 250 €', m.includes('Non finançable') || bloq > 0, { bloq });
  // 5. Consultation d'une tâche détaillée
  await pg.click('.pj-hero .btn:has-text("Comment faire")'); await pg.waitForTimeout(300);
  const st = await pg.$eval(sheet, e => e.textContent);
  T('5. tâche détaillée : objectif, pourquoi, durée, coût, réussi si, comment faire', ['Objectif', 'Pourquoi', 'Durée estimée', 'Coût', 'Réussi si', 'Comment faire'].every(k => st.includes(k)), st.slice(0, 200));
  await pg.click(sheet + ' button[aria-label="Fermer"]'); await pg.waitForTimeout(200);
  // Ouvrir une tâche avec liens officiels (formalités)
  await pg.click('.pj-tache:visible:has-text("démarches")'); await pg.waitForTimeout(300);
  const lk = await pg.$$eval(sheet + ' .td-liens a', l => l.map(a => a.href));
  T('liens officiels datés (service-public.gouv.fr, bpifrance-creation.fr)', lk.length >= 1 && lk.every(u => /^https:\/\/(entreprendre\.service-public\.gouv\.fr|bpifrance-creation\.fr)\//.test(u)), lk);
  await pg.click(sheet + ' button[aria-label="Fermer"]'); await pg.waitForTimeout(200);
  // Réserve
  await pg.click('.bp button:has-text("Définir")'); await pg.waitForTimeout(200);
  await pg.fill('#bp-res', '50'); await pg.click(sheet + ' .btn:has-text("Enregistrer")'); await pg.waitForTimeout(400);
  T('réserve de 50 € enregistrée dans le profil', (await pg.evaluate(() => JSON.parse(localStorage.getItem('cap-local')).profil.main.reserveProjet)) === 50);
  // 6. Dépense
  await pg.click('.bp .btn:has-text("Dépense")'); await pg.waitForTimeout(250);
  await pg.click(sheet + ' .choice:has-text("Déjà dépensée")'); await pg.fill('#dp-m', '30'); await pg.click(sheet + ' .choice:has-text("Abonnement")'); await pg.fill('#dp-n', 'Nom de domaine'); await pg.waitForTimeout(100);
  T('6. dépense contrôlée avant enregistrement (« Finançable »)', (await pg.$eval(sheet + ' .bp-verdict', e => e.textContent)).includes('Finançable'));
  await pg.click(sheet + ' .btn:has-text("Enregistrer la dépense")'); await pg.waitForTimeout(400);
  // 7. Recalcul
  const dispo = await pg.$eval('.bp-dispo b', e => e.textContent.replace(/ /g, ' '));
  T('7. budget recalculé : 250 − 50 − 30 = 170 € engageables', /170\s€/.test(dispo), dispo);
  // Dépense prévue trop chère → refusée
  await pg.click('.bp .btn:has-text("Dépense")'); await pg.waitForTimeout(250);
  await pg.fill('#dp-m', '180'); await pg.click(sheet + ' .choice:has-text("Achat")'); await pg.waitForTimeout(100);
  const ver = await pg.$eval(sheet + ' .bp-verdict', e => e.textContent);
  T('dépense prévue de 180 € refusée avec la raison et le manque (10 €)', ver.includes('Non finançable') && /10\s?€/.test(ver.replace(/ /g, ' ')) && await pg.$eval(sheet + ' .btn:has-text("Enregistrer la dépense")', e => e.disabled), ver);
  await pg.click(sheet + ' button[aria-label="Fermer"]'); await pg.waitForTimeout(200);
  // 8-9. Blocage et réponse contextualisée
  await pg.click('.pj-journal .btn:has-text("Noter")'); await pg.waitForTimeout(250);
  await pg.fill('#pj-txt', 'Il me reste peu et mon fournisseur demande 180 € minimum'); await pg.fill('#pj-mt', '180');
  await pg.click(sheet + ' .btn:has-text("Enregistrer")'); await pg.waitForTimeout(600);
  const an = await pg.$eval(sheet, e => e.textContent).catch(() => '');
  T('8-9. blocage : réponse fondée sur les données (170 € engageables, dépassement 10 €), options, informations manquantes', an.includes('Ce que l’on sait') && /170\s€/.test(an.replace(/ /g, ' ')) && an.includes('Options réalistes') && an.includes('Ce qui manque pour conclure'), an.slice(0, 400));
  T('réponse étiquetée « Calculé par Cap », sans IA simulée', an.includes('Calculé par Cap') && an.includes('Aucune réponse générée par une IA'));
  await pg.click(sheet + ' button[aria-label="Fermer"]'); await pg.waitForTimeout(200);
  // Publicité sans vente : pas de conseil de dépenser plus
  const an2 = await pg.evaluate(() => { const d = window.CapUI.derive(); return window.CapProjetBudget.analyser(d, { texte: 'J’ai dépensé 40 € en publicité sans vente', montant: 40 }); });
  T('« 40 € de pub sans vente » : diagnostic, infos manquantes, aucun conseil d’augmenter la dépense', an2.manque.length >= 2 && !an2.options.some(o => /augmente|dépense davantage|plus de budget/i.test(o)) && an2.constats.some(c => /ne recommande pas d’augmenter/.test(c)), an2);
  // Comparateur de fournisseurs
  await pg.click('main .btn:has-text("Comparer des fournisseurs")'); await pg.waitForTimeout(250);
  const ajout = async (nom, pu, liv) => { await pg.fill('#cf-nom', nom); await pg.fill('#cf-prixUnitaire', String(pu)); if (liv !== null) await pg.fill('#cf-livraison', String(liv)); await pg.click(sheet + ' .btn:has-text("Ajouter l’offre")'); await pg.waitForTimeout(250); };
  await pg.fill('#cf-q', '20'); await ajout('Offre A', 4, 12); await ajout('Offre B', 3.5, 25); await ajout('Offre C', 3, null);
  const cf = await pg.$$eval('.cf-f', l => l.map(e => e.textContent.replace(/ /g, ' ')));
  T('comparateur : coût total livré classé (A 92 €, B 95 €), offre incomplète signalée', cf[0].includes('Offre A') && /92\s€/.test(cf[0]) && cf[2].includes('Incomplet'), cf);
  await pg.click('.cf-f >> nth=0 >> .btn:has-text("Choisir")'); await pg.waitForTimeout(500);
  const deps = await lire(pg, 'depenses'), dec = await lire(pg, 'decisions');
  T('choix du fournisseur : dépense prévue (92 €) et décision notées', deps.some(x => x.montant === 92 && x.statut === 'prevue') && dec.some(x => x.type === 'decision' && x.texte.includes('Offre A')), { deps, dec });
  // 10. Suivi : vente → trésorerie et résultat
  await pg.click('.pj-vente .btn:has-text("Enregistrer une vente")'); await pg.waitForTimeout(250);
  await pg.fill(sheet + ' input[inputmode="decimal"]', '120').catch(() => {});
  await pg.click(sheet + ' .btn:has-text("Enregistrer")').catch(() => {}); await pg.waitForTimeout(400);
  const res2 = await pg.$eval('.bp-res', e => e.textContent.replace(/ /g, ' ')).catch(() => '');
  T('10. suivi : vente réelle → résultat = 120 − 30 = +90 €', /\+90\s€/.test(res2), res2);
  // Activité existante
  await pg.evaluate(() => { const m = JSON.parse(localStorage.getItem('cap-local')); m.profil.main.businessChoisi = null; m.profil.main.activiteExistante = { nom: 'Cours de guitare', depuis: '2026-01' }; localStorage.setItem('cap-local', JSON.stringify(m)); });
  await pg.reload(); await pg.waitForTimeout(500); await aller(pg, 'Business');
  m = await pg.$eval('main', e => e.textContent.replace(/ /g, ' '));
  T('activité existante : tableau de bord (résultat par mois, pistes, budget, journal)', m.includes('Cours de guitare') && m.includes('Résultat par mois') && m.includes('Budget du projet') && m.includes('Journal du projet'), m.slice(0, 300));
  T('aucune erreur JavaScript', errs.length === 0, errs);
  console.log(res.join('\n')); const f = res.filter(x => x.startsWith('FAIL')).length; console.log('\n' + (res.length - f) + ' réussis, ' + f + ' échoués');
  await b.close();
})();
