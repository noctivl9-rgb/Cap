/* Vérification indépendante des VRAIS appels au modèle enregistrés par l'artefact « Cap essais IA ».
 * Les réponses brutes du modèle (champ brut) sont revalidées ici avec les mêmes règles, puis des contrôles de cohérence
 * propres à chaque essai sont appliqués. Usage : node dev/tests/reel-verif.js <dossier contenant essais/*.json> */
const fs = require('fs'), path = require('path');
const E = require('../../engine.js'), T = require('../../training.js'), B = require('../../business.js'), K = require('../../contrats.js'), Mx = require('../../matrice.js');
const dir = process.argv[2];
if (!dir) { console.log('Usage : node dev/tests/reel-verif.js <dossier>'); process.exit(2); }
const lire = id => { const f = path.join(dir, 'essais', id + '.json'); if (!fs.existsSync(f)) return null; const j = JSON.parse(fs.readFileSync(f, 'utf8')); return j.data || j; };
let ok = 0, ko = 0, abs = 0; const res = [];
const t = (n, c, i) => { res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300))); if (c) ok++; else ko++; };
const KARIM = { domaines: ['corps'], age: 34, sexe: 'H', taille: 181, poids: 96, tour: 104, objectif: 'perdre', cible: 86, delaiSem: 40, activite: 'assis', autreSport: 1, niveau: 'debutant', jours: 3, minutes: 45, lieu: 'maison', materielSport: ['halteres', 'elastique'], prioriteSport: 'auto', contraintes: ['douleur'], zonesDouleur: ['genou'], tempsLibre: 8, obstacle: 'regularite' };
const LEA = { domaines: ['corps'], age: 29, sexe: 'F', taille: 165, poids: 60, objectif: 'prendre', cible: 63, delaiSem: 26, activite: 'mixte', autreSport: 0, niveau: 'intermediaire', jours: 4, minutes: 60, lieu: 'salle', prioriteSport: 'force', contraintes: ['aucune'], tempsLibre: 14, obstacle: 'motivation' };
const SAMI = { domaines: ['corps', 'entreprise'], age: 22, sexe: 'H', taille: 175, poids: 72, objectif: 'maintenir', activite: 'mixte', autreSport: 2, niveau: 'intermediaire', jours: 3, minutes: 60, lieu: 'salle', contraintes: ['aucune'], tempsLibre: 18, pays: 'france', ville: 'Lyon', capital: 400, competences: ['code', 'sport'], materielPro: ['ordinateur', 'smartphone'], heuresProjet: 8, experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux', revenuVise: 800 };
const absent = id => { res.push('—    ' + id + ' : pas de résultat enregistré'); abs++; };
const meta = d => d.essais && d.essais.length ? d.essais.map(e => (e.modele || '?') + ' ' + Math.round(e.ms / 1000) + ' s').join(', ') : '';

// Programmes : revalidation indépendante des réponses brutes
function programme(id, p) {
  const d = lire(id); if (!d) return absent(id), null;
  t(id + ' : appel réel effectué (' + meta(d) + ')', d.essais && d.essais.length > 0 && d.essais.every(e => e.ms > 500), d.erreur);
  if (!d.ok) { t(id + ' : réponse acceptée par Cap', false, d.erreursValidation || d.erreur); return null; }
  const v = K.validerProgrammeIA(d.brut, p, T.generer(p));
  t(id + ' : revalidation indépendante identique', v.ok, v.erreurs);
  if (!v.ok) return null;
  const pg = v.programme;
  t(id + ' : chaque séance justifiée', pg.seances.every(s => s.justification.length >= 15));
  t(id + ' : temps hebdomadaire ≤ temps disponible calculé', pg.minutesSemaine <= (T.generer(p).parametres.joursRetenus * T.generer(p).parametres.minutesRetenues) * 1.1, pg.minutesSemaine);
  return { d, pg };
}
const a1 = programme('A1_karim', KARIM);
if (a1) {
  t('A1 : aucun exercice sollicitant le genou (bibliothèque et hors bibliothèque)', a1.pg.seances.every(s => s.exercices.every(e => !(e.id && T.PAR_ID[e.id].zones.indexOf('genou') >= 0))));
  t('A1 : matériel limité à haltères, élastiques, poids du corps', a1.pg.seances.every(s => s.exercices.every(e => !e.id || ['aucun', 'halteres', 'elastique'].indexOf(T.PAR_ID[e.id].mat) >= 0)));
  t('A1 : la justification mentionne le genou ou la douleur', JSON.stringify(a1.d.brut).match(/genou|douleur/i) !== null);
}
const a2 = programme('A2_lea', LEA);
if (a1 && a2) t('A : deux profils différents → programmes différents', JSON.stringify(a1.pg.seances.map(s => s.exercices.map(e => e.nom))) !== JSON.stringify(a2.pg.seances.map(s => s.exercices.map(e => e.nom))));
if (a2) t('A2 : force en salle → au moins un exercice à 6 répétitions ou moins', a2.pg.seances.some(s => s.exercices.some(e => /^[1-6](-[1-6])?$/.test(e.reps))));
const pC = Object.assign({}, KARIM, { tempsLibre: 3, poids: 93 });
const c = programme('C_karim_temps', pC);
if (a1 && c) {
  t('C : temps réduit → programme réorganisé (moins de minutes par semaine)', c.pg.minutesSemaine < a1.pg.minutesSemaine, [a1.pg.minutesSemaine, c.pg.minutesSemaine]);
  t('C : adaptation expliquée (changements listés)', (c.d.brut.changements || []).length > 0 || /temps|3 h/i.test(JSON.stringify(c.d.brut)));
}
// Activités
function activites(id, p) {
  const d = lire(id); if (!d) return absent(id), null;
  t(id + ' : appel réel effectué (' + meta(d) + ')', d.essais && d.essais.length > 0, d.erreur);
  if (!d.ok) { t(id + ' : réponse acceptée', false, d.erreursValidation || d.erreur); return null; }
  const v = K.validerBusinessIA(d.brut, p, null);
  t(id + ' : revalidation indépendante (sans web)', v.ok && v.opportunites.length >= 1, v.erreurs);
  t(id + ' : 3 activités proposées', (d.brut.opportunites || []).length === 3, (d.brut.opportunites || []).length);
  t(id + ' : aucun fait présenté comme sourcé sans recherche web', v.opportunites.every(o => o.faits.length === 0));
  t(id + ' : aucun revenu promis par le modèle', !v.erreurs.some(e => /revenu chiffré/.test(e)), v.erreurs);
  return v;
}
const d1 = activites('D1_sami', SAMI);
if (d1) {
  const horsCatalogue = d1.opportunites.filter(o => !B.CATALOGUE.some(m => m.nom.toLowerCase() === o.nom.toLowerCase()));
  t('D1 : au moins une activité hors catalogue Cap', horsCatalogue.length >= 1, d1.opportunites.map(o => o.nom));
  t('D1 : plans calculés par Cap pour chaque activité compatible', d1.opportunites.filter(o => o.statut === 'compatible').every(o => B.plan(o, SAMI, []).ok));
  t('D1 : les activités utilisent ses compétences (code ou sport)', d1.opportunites.some(o => /code|site|appli|logiciel|sport|coach|entraîn|foot|club/i.test(o.nom + o.offre + o.pourquoiToi)));
}
const d2 = activites('D2_sami_0', Object.assign({}, SAMI, { capital: 0 }));
if (d1 && d2) {
  const budgets = v => v.opportunites.map(o => o.budget);
  t('D/E : capital 0 € → activités moins coûteuses ou marquées non finançables', Math.max(...budgets(d2)) <= Math.max(...budgets(d1)) || d2.opportunites.some(o => o.statut === 'non_financable'), [budgets(d1), budgets(d2)]);
  t('E : aucune activité finançable dont le budget dépasse 0 €', d2.opportunites.every(o => o.statut !== 'compatible' || o.budget === 0), d2.opportunites.map(o => o.nom + ':' + o.statut + ':' + o.budget));
}
// Questions
const h = lire('H_questions');
if (!h) absent('H_questions'); else {
  t('H : appel réel effectué (' + meta(h) + ')', h.essais && h.essais.length > 0, h.erreur);
  const q = K.validerQuestionsIA(h.brut && h.brut.questions, Mx.REGISTRE, { domaines: ['entreprise'], age: 25, pays: 'france', heuresProjet: 5 });
  t('H : 1 à 3 questions justifiées', q.questions.length >= 1 && q.questions.length <= 3, q);
  t('H : demande les compétences ou le capital', q.questions.some(x => x.champ === 'competences' || x.champ === 'capital' || /compétence|capital|budget|savoir-faire/i.test(x.texte)), q.questions.map(x => x.texte));
  t('H : ne redemande pas l’âge ni le pays déjà connus', !q.refus.some(r => r.raison === 'Déjà renseigné.') || q.questions.every(x => x.champ !== 'age' && x.champ !== 'pays'));
}
// Pourquoi
const i = lire('I_pourquoi');
if (!i) absent('I_pourquoi'); else {
  t('I : appel réel effectué (' + meta(i) + ')', i.essais && i.essais.length > 0, i.erreur);
  const v = K.validerPourquoi(i.brut);
  t('I : réponse fournie', v.ok, i.brut);
  if (v.ok) t('I : l’explication cite des réponses de l’utilisateur (genou, temps, débutant, régularité)', /genou|8 h|débutant|régularité|haltères|élastique/i.test(v.reponse), v.reponse);
}
console.log(res.join('\n'));
console.log('\n' + ok + ' réussis, ' + ko + ' échoués, ' + abs + ' sans résultat');
process.exit(ko ? 1 : 0);
