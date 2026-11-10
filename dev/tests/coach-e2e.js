/* Coach : outils internes, consentements, propositions confirmées, questions rapides. bash build.sh && node coach-e2e.js */
const { chromium, devices } = require('playwright');
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300)));
const P = { v: 2, domaines: ['corps', 'argent', 'entreprise'], sexe: 'H', age: 22, taille: 178, poids: 78, objectif: 'perdre', cible: 73, delaiSem: 20, activite: 'mixte', niveau: 'intermediaire', lieu: 'salle', jours: 3, minutes: 50, autreSport: 0, tempsLibre: 12, prioriteSport: 'muscle', contraintes: ['aucune'], obstacle: 'regularite', regime: 'omnivore', revenus: 1900, fixes: 800, variables: 450, remboursements: 0, epargne: 2500, reve: 'appart', reveMontant: 250000, reveAnnee: 2034, pays: 'france', capital: 250, competences: ['code'], materielPro: ['ordinateur'], heuresProjet: 8, experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux', creeLe: '2026-11-01T10:00:00Z' };
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext(devices['iPhone 14'])).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.clock.setFixedTime(new Date('2026-11-10T10:00:00'));
  await pg.goto('file://' + __dirname + '/out/page.html');
  await pg.evaluate(p => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify({ profil: { main: p }, pesees: { a: { date: '2026-11-02', poids: 78, tour: 88 }, b: { date: '2026-11-09', poids: 77.4, tour: 87 } }, operations: { o1: { date: '2026-11-03', sens: 'depense', montant: 60, categorie: 'loisirs' }, o2: { date: '2026-11-04', sens: 'depense', montant: 25, categorie: 'transport' } } })); }, P);
  await pg.reload(); await pg.waitForTimeout(500);
  const run = (nom, input) => pg.evaluate(([n, i]) => { const d = window.CapUI.derive(); return window.CapCoach.outils(d).T[n].run(i || {}); }, [nom, input]);
  // Sans consentement
  for (const n of ['getNutritionSummary', 'getTrainingPlan', 'getProgressHistory', 'getFinanceSummary', 'getBusinessBudget', 'getBusinessTasks', 'getBusinessProject']) { const r = await run(n); T('sans accord : ' + n + ' refuse de lire', !!r.refus, r); }
  const prof = await run('getUserProfile');
  T('getUserProfile : uniquement les informations de base', prof.age === 22 && prof.modules.length === 3 && Object.keys(prof).length === 3, prof);
  await pg.evaluate(() => window.CapUI.savePrefs({ coachCorps: true, coachArgent: true, coachProjet: true })); await pg.waitForTimeout(200);
  const nut = await run('getNutritionSummary');
  T('getNutritionSummary : objectif et restant calculés par Cap', nut.objectif_kcal > 1500 && nut.restant_kcal === nut.objectif_kcal && nut.repas_notes === 0, nut);
  const tp = await run('getTrainingPlan');
  T('getTrainingPlan : semaine et séance du jour (mardi = repos possible)', Array.isArray(tp.semaine) && tp.semaine.length === 3, tp);
  const ph = await run('getProgressHistory');
  T('getProgressHistory : pesées et tour de taille réels', ph.pesees.length === 2 && ph.pesees[1].tour_cm === 87, ph);
  const fi = await run('getFinanceSummary');
  T('getFinanceSummary : « où ai-je le plus dépensé ? » → Loisirs 60 €', fi.par_categorie[0].categorie === 'Loisirs et sorties' && fi.par_categorie[0].montant === 60 && fi.depenses_saisies === 85, fi);
  const bb = await run('getBusinessBudget');
  T('getBusinessBudget : réserve non définie dite, 250 € engageables', bb.reserve === 'non définie' && bb.encore_engageable === 250, bb);
  const cc = await run('calculateBusinessCosts', { quantite: 20, prixUnitaire: 4, livraison: 12, commissionPct: 10, prixVente: 12 });
  T('calculateBusinessCosts : coût 92 €, marge 240 − 24 − 92 = 124 € (si tout vendu, avant cotisations)', cc.cout_total === 92 && cc.marge_brute_si_tout_vendu === 124 && /pas garanti/.test(cc.note), cc);
  const src = await run('searchVerifiedSources', { sujet: 'micro-entreprise' });
  T('searchVerifiedSources : liste fermée, liens officiels datés', src.sources.length >= 1 && src.sources.every(s => !s.url || /^https:\/\/(entreprendre\.service-public\.gouv\.fr|bpifrance-creation\.fr)/.test(s.url)) && /Aucune recherche web/.test(src.note), src);
  const p1 = await run('proposePlanAdjustment', { type: 'objectif_kcal', valeur: 900, raison: 'test' });
  T('proposition sous le minimum de sécurité refusée par Cap', !!p1.refuse, p1);
  const p2 = await run('proposePlanAdjustment', { type: 'objectif_kcal', valeur: 2200, raison: 'test' });
  T('proposition valable : en attente de confirmation, rien n’est modifié', p2.statut === 'en_attente_de_confirmation' && !(await pg.evaluate(() => JSON.parse(localStorage.getItem('cap-local')).profil.main.objectifsPerso)), p2);
  // Interface : questions rapides sans IA
  await pg.click('.td-head button[aria-label="Ouvrir le coach"]'); await pg.waitForTimeout(300);
  const sh = '.sheet:last-of-type';
  T('sans IA : état clair, questions libres désactivées', (await pg.$eval(sh, e => e.textContent)).includes('Questions libres indisponibles ici') && await pg.$eval(sh + ' .btn:has-text("Envoyer")', e => e.disabled));
  await pg.click(sh + ' .chip-btn:has-text("Où ai-je le plus dépensé")'); await pg.waitForTimeout(200);
  T('question rapide finances : réponse chiffrée par Cap', /Loisirs et sorties : 60 € sur 85 €/.test((await pg.$eval(sh, e => e.textContent)).replace(/ /g, ' ')));
  await pg.click(sh + ' .chip-btn:has-text("mesures ont changé")'); await pg.waitForTimeout(200);
  T('question rapide évolution : poids et tour de taille mesurés', /78 kg .*77.4 kg.*Tour de taille : 88 → 87 cm/.test(await pg.$eval(sh, e => e.textContent)));
  await pg.waitForTimeout(300);
  const conv = await pg.evaluate(() => JSON.parse(localStorage.getItem('cap-local')).conversations.principal.messages.length);
  T('conversation conservée (4 messages)', conv === 4, conv);
  // Réponse IA simulée DANS LE TEST uniquement (aucun faux en production) : rendu court + actions + Approfondir
  await pg.click(sh + ' .close, ' + sh + ' button[aria-label="Fermer"]').catch(() => {}); await pg.waitForTimeout(250);
  await pg.evaluate(() => { const A = window.CapAI; A.texteDispo = () => true; A.outilsDispo = () => false; window.__appels = []; A.coach = async (q, hist, ctx, o) => { window.__appels.push({ q, appro: !!o.approfondir }); return { text: o.approfondir ? 'Détail : <b>pas de HTML</b>.' : 'Tu as dépensé surtout en loisirs.\n- Fixe un plafond loisirs\n- Note chaque sortie' }; }; });
  await pg.click('.td-head button[aria-label="Ouvrir le coach"]'); await pg.waitForTimeout(300);
  await pg.fill('#coach-q', 'Comment réduire mes dépenses ?'); await pg.click(sh + ' .btn:has-text("Envoyer")'); await pg.waitForTimeout(300);
  const acts = await pg.$$eval(sh + ' .coach-act li', l => l.map(x => x.textContent));
  T('coach IA : réponse courte + actions rendues en liste', acts.length === 2 && acts[0] === 'Fixe un plafond loisirs', acts);
  await pg.click(sh + ' .coach-plus'); await pg.waitForTimeout(300);
  const ap = await pg.evaluate(() => window.__appels);
  T('« Approfondir » renvoie la question en mode détaillé', ap.length === 2 && ap[1].appro === true && !ap[0].appro, ap);
  T('texte IA inséré sans HTML interprété', !(await pg.$(sh + ' .bubble b')) && (await pg.$eval(sh, e => e.textContent)).includes('<b>pas de HTML</b>'));
  T('aucune erreur JavaScript', errs.length === 0, errs);
  console.log(res.join('\n')); const f = res.filter(x => x.startsWith('FAIL')).length; console.log('\n' + (res.length - f) + ' réussis, ' + f + ' échoués'); await b.close();
})();
