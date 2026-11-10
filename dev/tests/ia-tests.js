/* Tests du circuit de génération (ia.js + contrats.js + prompts.js) avec un transport SCRIPTÉ.
 * Ils vérifient la mécanique (validation, correction, refus, erreurs, sources). Les vrais appels au modèle sont
 * testés à part (artefact « Cap — essais IA réels », dev/tests/reel-verif.js). Lancer : node dev/tests/ia-tests.js */
const fs = require('fs'), path = require('path');
const IA = require('../../ia.js'), K = require('../../contrats.js'), T = require('../../training.js'), E = require('../../engine.js'), Mx = require('../../matrice.js'), P = require('../../prompts.js');
let ok = 0, ko = 0; const t = (n, c, i) => { if (c) ok++; else { ko++; console.log('ÉCHEC ' + n + (i !== undefined ? ' → ' + JSON.stringify(i).slice(0, 400) : '')); } };
const R = path.join(__dirname, '../..');
t('copie serveur de prompts.js identique', fs.readFileSync(path.join(R, 'prompts.js'), 'utf8') === fs.readFileSync(path.join(R, 'supabase/functions/_shared/prompts.js'), 'utf8'));

const p = { domaines: ['corps', 'entreprise'], age: 22, sexe: 'H', taille: 170, poids: 71, objectif: 'perdre', cible: 66, delaiSem: 26, activite: 'assis', autreSport: 2, niveau: 'debutant', jours: 4, minutes: 60, lieu: 'maison', materielSport: ['halteres'], contraintes: ['douleur'], zonesDouleur: ['genou'], tempsLibre: 10, heuresProjet: 4, pays: 'france', capital: 300, competences: ['code'], materielPro: ['ordinateur'] };
const prog = T.generer(p);
const ctx = { prog, energie: E.energie(p), physique: E.physique(p), seances: [{ date: '2026-11-08', nom: 'Corps complet A', ressenti: 'dur' }], registre: Mx.REGISTRE };
const bonneSeance = (j, cle) => ({ cle, nom: 'Haut du corps', jour: j, justification: 'Genou douloureux et 2 matchs de foot : haut du corps et gainage.', exercices: [{ id: 'dc_sol', series: 3, reps: '8-12', repos: 90, raison: 'Épaule protégée' }, { id: null, nom: 'Planche avec toucher d’épaule', pattern: 'core', materiel: 'aucun', zones: ['poignet'], series: 3, reps: '30-45 s', repos: 45, raison: 'Gainage anti-rotation' }] });

(async () => {
  // Demande : toutes les données d'analyse demandées par l'utilisateur sont présentes
  const dm = K.demandeProgramme(p, prog, ctx.seances, ctx);
  t('demande : objectifs, métabolisme, niveau, temps, matériel, contraintes, historique', dm.profil.objectif === 'perdre' && dm.donnees.energie.depense > 0 && dm.profil.niveau === 'debutant' && dm.contraintes.tempsDisponibleH === 3 && dm.contraintes.materiel.indexOf('halteres') >= 0 && dm.contraintes.zonesExclues[0] === 'genou' && dm.historique.length === 1);
  const pr = P.programme(dm);
  t('consignes : limites de sécurité écrites dans le prompt', /au plus \d+ séances/.test(pr) && /genou/.test(pr) && /hors bibliothèque/.test(pr) && /justification/.test(pr));
  t('consignes business sans web : interdiction de citer des sources', /PAS accès au web/.test(P.business({}, false)) && /AUCUN revenu prévisionnel/.test(P.business({}, true)));

  // 1. Première réponse invalide → correction avec les erreurs → acceptée
  let appels = [];
  IA.configurer(async (tache, demande, o) => {
    appels.push(o);
    if (o.essai === 1) return { data: { resume: 'x', seances: [bonneSeance(1, 'S1'), bonneSeance(1, 'S2'), Object.assign(bonneSeance(3, 'S3'), { exercices: [{ id: 'fente_arriere', series: 3, reps: '10', repos: 60 }] })] }, modele: 'test' };
    return { data: { resume: 'Programme adapté au genou.', seances: [bonneSeance(1, 'S1'), bonneSeance(4, 'S2')], questions: [{ champ: null, id: 'poste_foot', question: 'À quel poste joues-tu au football ?', type: 'texte', raison: 'Adapter le travail des jambes à tes efforts en match.', module: 'corps' }, { champ: 'couleur', question: 'x', raison: 'aucune raison valable ici' }] }, modele: 'test' };
  }, 'test');
  const r1 = await IA.programme(p, ctx);
  t('réponse invalide (même jour, genou) puis corrigée : acceptée au 2e essai', r1.ok && r1.essais.length === 2 && r1.essais[0].erreurs.some(e => /même jour/.test(e)) && r1.essais[0].erreurs.some(e => /zone douloureuse/.test(e)), r1.essais);
  t('les erreurs exactes sont renvoyées au modèle pour correction', appels[1].erreurs && /refusée par les vérifications/.test(appels[1].prompt));
  t('exercice hors bibliothèque accepté et signalé', r1.programme.horsBibliotheque === 2 && r1.programme.seances[0].exercices[1].horsBibliotheque && !r1.programme.seances[0].exercices[0].horsBibliotheque);
  t('durée recalculée par Cap, pas celle de l’IA', r1.programme.seances[0].duree > 0 && r1.programme.minutesSemaine === r1.programme.seances.reduce((s, x) => s + x.duree, 0));
  t('questions de l’IA filtrées : utile gardée, champ inconnu refusé', r1.questions.length === 1 && r1.questions[0].id === 'poste_foot');

  // 2. Deux réponses invalides → refus honnête, rien n'est remplacé
  IA.configurer(async () => ({ data: { seances: [{ cle: 'X', jour: 9, exercices: [{ id: 'exercice_imaginaire' }] }] }, modele: 'test' }), 'test');
  const r2 = await IA.programme(p, ctx);
  t('deux refus : résultat refusé, aucune donnée de programme', !r2.ok && r2.refuse && !r2.programme && r2.validation.erreurs.length > 0);

  // 3. Erreurs de transport : message honnête
  IA.configurer(async () => { const e = new Error('rate'); e.code = 'rate_limited'; throw e; }, 'test');
  const r3 = await IA.programme(p, ctx);
  t('service saturé : erreur transmise, aucun résultat inventé', !r3.ok && r3.erreur.code === 'rate_limited' && !r3.programme);
  IA.configurer(async () => ({ data: IA.extraireJSON('Désolé, je ne peux pas.'), modele: 'test' }), 'test');
  const r4 = await IA.programme(p, ctx);
  t('réponse non JSON : erreur invalid_json', !r4.ok && r4.erreur && r4.erreur.code === 'invalid_json');
  IA.configurer(null, null);
  const r5 = await IA.programme(p, ctx);
  t('aucun transport : indisponible, pas de génération', !r5.ok && r5.indisponible);

  // 4. Business : modèles hors catalogue, chiffres calculés par Cap, sources filtrées
  const B = require('../../business.js');
  const act = (nom, extra) => Object.assign({ nom, categorie: 'web', client: 'Clubs de foot amateurs du département', probleme: 'Inscriptions et paiements gérés à la main.', offre: 'Site d’inscription en ligne avec paiement, installé et maintenu.', pourquoiToi: 'Tu codes et tu connais le football amateur.', materiel: [{ nom: 'Ordinateur', cout: 500, possede: true }], coutDemarrage: 40, chargesMensuelles: 15, coutVariableUnitaire: 0, unite: 'club équipé', prix: { bas: 250, median: 450, haut: 800 }, heuresParUnite: 12, heuresProspectionParClient: 8, recurrence: 0, regime: 'bnc', ageMin: 16, reglementation: 'RGPD : données de mineurs.', concurrents: ['Plateformes nationales'], demande: 'Clubs souvent bénévoles.', risques: ['Saisonnalité'], validation: 'Présenter une maquette à 5 clubs.', faits: [{ theme: 'prix', texte: 'Abonnements de plateformes à 30 €/mois.', source: { titre: 'Comparatif', url: 'https://vrai.fr/comparatif', date: '2026-09-01' } }, { theme: 'demande', texte: 'Fort besoin.', source: { titre: 'Inventé', url: 'https://invente.fr/x', date: '2026-01-01' } }], hypotheses: [] }, extra || {});
  IA.configurer(async () => ({ data: { opportunites: [act('Inscriptions pour clubs de foot'), act('Matériel de luxe', { coutDemarrage: 5000 }), act('Revenu garanti', { hypotheses: ['Tu vas gagner 3000 € par mois'] }), { nom: 'Incomplète' }] }, modele: 'test', sources: ['https://vrai.fr/comparatif'] }), 'test');
  const rb = await IA.business(p, { reco: B.recommander(p), registre: Mx.REGISTRE });
  const m0 = rb.opportunites[0];
  t('activité hors catalogue acceptée et convertie en modèle Cap', rb.ok && m0.ia && m0.statut === 'compatible' && !B.PAR_ID[m0.id]);
  t('fait sourcé gardé seulement si l’URL vient de la recherche réelle', m0.faits.length === 1 && m0.faits[0].source.url === 'https://vrai.fr/comparatif' && m0.hypotheses.some(h => /source non retrouvée/.test(h)));
  t('budget au-delà du capital : non finançable (calcul Cap)', rb.opportunites[1].statut === 'non_financable');
  t('revenu promis par l’IA signalé', rb.erreurs.some(e => /revenu chiffré/.test(e)));
  t('activité incomplète écartée', rb.erreurs.some(e => /Incomplète|manquant/.test(e)));
  const pl = B.plan(m0, p, []);
  t('plan, scénarios et plan d’action calculés par Cap pour l’activité IA', pl.ok && pl.scenarios.median.total12 !== undefined && B.planAction(m0, p, {}).ok && pl.ia);
  const pl2 = B.plan(m0, Object.assign({}, p, { capital: 10 }), []);
  t('capital réduit : la même activité IA devient non finançable', pl2.statut === 'non_financable');
  const reel = B.plan(m0, Object.assign({}, p, { debutProjet: '2026-11-10' }), [{ date: '2026-12-05', montant: 450 }]);
  t('première vente réelle : mois marqué « observé »', reel.scenarios.median.mois[1].type === 'observe' && reel.scenarios.median.mois[1].ca === 450);
  // Sans web : aucun fait ne peut être présenté comme sourcé
  IA.configurer(async () => ({ data: { opportunites: [act('Sans web')] }, modele: 'test' }), 'test');
  const rsw = await IA.business(p, { reco: B.recommander(p), registre: Mx.REGISTRE });
  t('sans recherche web : tous les « faits » deviennent des hypothèses', rsw.mode === 'sans_web' && rsw.opportunites[0].faits.length === 0 && rsw.opportunites[0].hypotheses.filter(h => /pas de recherche web/.test(h)).length === 2);

  // 5. Pourquoi
  IA.configurer(async () => ({ data: { reponse: 'Tu as indiqué un genou douloureux et 3 h disponibles : Cap a retiré les fentes et limité à 2 séances.', reponsesCitees: ['genou', '3 h'] }, modele: 'test' }), 'test');
  const rp = await IA.pourquoi('Pourquoi ?', { reponses: K.entrees(p, K.CHAMPS_PROGRAMME) });
  t('« Pourquoi ? » : réponse et réponses citées', rp.ok && /genou/.test(rp.reponse) && rp.citees.length === 2);

  // 6. Adaptation : changements détectés champ par champ
  const ch = K.changements(K.entrees(p, K.CHAMPS_PROGRAMME), K.entrees(Object.assign({}, p, { poids: 69, tempsLibre: 6 }), K.CHAMPS_PROGRAMME));
  t('adaptation : seuls les champs modifiés sont signalés', ch.length === 2 && ch.some(c => c.champ === 'poids' && c.avant === 71 && c.apres === 69));
  const prog2 = T.generer(Object.assign({}, p, { tempsLibre: 5 }));
  const vieux = K.validerProgrammeIA({ seances: [bonneSeance(1, 'S1'), bonneSeance(3, 'S2'), bonneSeance(5, 'S3')] }, p, prog2);
  t('programme IA revérifié contre les nouvelles contraintes : suspendu si le temps baisse', !vieux.ok && vieux.erreurs.some(e => /Trop de séances|min estimées/.test(e)), vieux.erreurs);

  console.log('\n' + ok + ' réussis, ' + ko + ' échoués');
  process.exit(ko ? 1 : 0);
})();
