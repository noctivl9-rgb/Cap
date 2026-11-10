/* Vérification indépendante des VRAIS appels au modèle enregistrés par l'artefact « Cap essais IA » (consignes v2).
 * Les réponses brutes du modèle sont revalidées ici avec les règles de Cap, puis comparées entre profils :
 * les différences doivent découler des différences réelles des personnes (douleur, lieu, priorité, capital, compétences, ville).
 * Un essai bloqué par la limite d'usage ou obtenu avec d'anciennes consignes est « non exécuté », jamais compté comme réussi.
 * Usage : node dev/tests/reel-verif.js <dossier contenant essais/*.json> */
const fs = require('fs'), path = require('path');
const E = require('../../engine.js'), T = require('../../training.js'), B = require('../../business.js'), K = require('../../contrats.js'), Mx = require('../../matrice.js'), P = require('../../prompts.js');
const dir = process.argv[2];
if (!dir) { console.log('Usage : node dev/tests/reel-verif.js <dossier>'); process.exit(2); }
let ok = 0, ko = 0, abs = 0; const res = [];
const t = (n, c, i) => { res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 300))); if (c) ok++; else ko++; };
const non = (id, raison) => { res.push('—    ' + id + ' : ' + raison); abs++; };
const lire = id => {
  const f = path.join(dir, 'essais', id + '.json'); if (!fs.existsSync(f)) { non(id, 'pas de résultat enregistré'); return null; }
  const j = JSON.parse(fs.readFileSync(f, 'utf8')); const d = j.data || j;
  if (d.consignes !== P.VERSION) { non(id, 'obtenu avec d’anciennes consignes (' + (d.consignes || 'v1') + '), à relancer'); return null; }
  if (d.erreur && d.erreur.code === 'rate_limited') { non(id, 'non exécuté (limite d’usage du compte Claude), à relancer'); return null; }
  if (d.erreur && d.erreur.code === 'prerequis') { non(id, 'non exécuté : l’essai dont il dépend n’a pas réussi'); return null; }
  if (d.erreur && d.erreur.code === 'delai') { t(id + ' : réponse du modèle dans le délai', false, d.erreur.message); return null; }
  t(id + ' : appel réel au modèle (' + (d.essais || []).map(e => (e.modele || '?') + ' ' + Math.round((e.ms || 0) / 1000) + ' s').join(', ') + ')', (d.essais || []).length > 0 && d.essais.every(e => e.ms > 1500), d.erreur);
  return d;
};
const KARIM = { domaines: ['corps'], age: 34, sexe: 'H', taille: 181, poids: 96, tour: 104, objectif: 'perdre', cible: 86, delaiSem: 40, activite: 'assis', autreSport: 1, niveau: 'debutant', jours: 3, minutes: 45, lieu: 'maison', materielSport: ['halteres', 'elastique'], prioriteSport: 'auto', contraintes: ['douleur'], zonesDouleur: ['genou'], tempsLibre: 8, obstacle: 'regularite' };
const MONIQUE = { domaines: ['corps'], age: 61, sexe: 'F', taille: 162, poids: 68, objectif: 'maintenir', activite: 'mixte', autreSport: 0, niveau: 'debutant', jours: 3, minutes: 45, lieu: 'salle', prioriteSport: 'forme', contraintes: ['douleur'], zonesDouleur: ['dos'], tempsLibre: 12, obstacle: 'motivation' };
const LEA = { domaines: ['corps'], age: 29, sexe: 'F', taille: 165, poids: 60, objectif: 'prendre', cible: 63, delaiSem: 26, activite: 'mixte', autreSport: 0, niveau: 'intermediaire', jours: 4, minutes: 60, lieu: 'salle', prioriteSport: 'force', contraintes: ['aucune'], tempsLibre: 14, obstacle: 'motivation' };
const TOM = { domaines: ['corps'], age: 19, sexe: 'H', taille: 178, poids: 64, objectif: 'prendre', cible: 69, delaiSem: 40, activite: 'assis', autreSport: 0, niveau: 'debutant', jours: 4, minutes: 45, lieu: 'maison', prioriteSport: 'muscle', contraintes: ['aucune'], tempsLibre: 10 };
const TOM2 = Object.assign({}, TOM, { materielSport: ['elastique', 'traction'], complements: { experience_pompes: { question: 'Combien de pompes et de tractions fais-tu d’affilée aujourd’hui ?', reponse: '15 pompes, 2 tractions', raison: 'Fixer le niveau de départ', module: 'corps' } } });
const SAMI = { domaines: ['corps', 'entreprise'], age: 22, sexe: 'H', taille: 175, poids: 72, objectif: 'maintenir', activite: 'mixte', autreSport: 2, niveau: 'intermediaire', jours: 3, minutes: 60, lieu: 'salle', contraintes: ['aucune'], tempsLibre: 18, pays: 'france', ville: 'Lyon', capital: 400, competences: ['code', 'sport'], materielPro: ['ordinateur', 'smartphone'], heuresProjet: 8, experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux', revenuVise: 800 };
const INES = { domaines: ['entreprise'], age: 38, pays: 'france', ville: 'Marseille', capital: 2500, competences: ['vente', 'reseaux', 'photo'], materielPro: ['ordinateur', 'smartphone'], heuresProjet: 15, experience: 'clients', aisanceVente: 3, risque: 'faible', formatPref: 'local', revenuVise: 1200 };

// Programme : revalidation indépendante complète (sécurité, objectifs contre le rythme max de Cap, calendrier, compléments)
function programme(id, p, extra) {
  const d = lire(id); if (!d) return null;
  if (!d.ok) { t(id + ' : réponse acceptée par Cap', false, d.erreursValidation || d.erreur); return null; }
  const v = K.validerPlanIndividuel(d.brut, p, T.generer(p), Object.assign({ physique: E.physique(p), registre: Mx.REGISTRE }, extra || {}));
  t(id + ' : revalidation indépendante (sécurité, objectifs, calendrier, adaptations)', v.ok, v.erreurs);
  if (!v.ok || v.attente) return v.ok ? v : null;
  const pg = v.programme;
  t(id + ' : analyse avec au moins 2 liens entre ses réponses', pg.analyse.liens.length >= 2, pg.analyse.liens);
  t(id + ' : chaque séance justifiée', pg.seances.every(s => s.justification.length >= 20));
  const zones = T.generer(p).parametres.zones || [];
  t(id + ' : aucun exercice sur une zone douloureuse (' + (zones.join(', ') || 'aucune') + ')', pg.seances.every(s => s.exercices.every(e => { const r = e.id ? T.PAR_ID[e.id] : null; return !r || !r.zones.some(z => zones.indexOf(z) >= 0); })));
  return { d, pg, txt: JSON.stringify(d.brut).toLowerCase() };
}
const ka = programme('A1_karim', KARIM), mo = programme('A3_monique', MONIQUE), le = programme('A2_lea', LEA);
if (ka) t('Karim : l’analyse tient compte du genou et du frein « régularité »', /genou/.test(ka.txt) && /régularit/.test(ka.txt));
if (mo) t('Monique : l’analyse tient compte du dos, de l’âge et de la motivation', /dos/.test(mo.txt) && /61|âge/.test(mo.txt) && /motiv/.test(mo.txt));
if (le) {
  t('Léa : priorité force → au moins un exercice polyarticulaire sous 6 répétitions', le.pg.seances.some(s => s.exercices.some(e => /^[1-5]-/.test(e.reps))), le.pg.seances.map(s => s.exercices.map(e => e.reps)));
}
if (ka && mo) {
  const mats = x => new Set(x.pg.seances.flatMap(s => s.exercices.map(e => e.id ? T.PAR_ID[e.id].mat : 'hors')));
  t('Karim (maison) et Monique (salle) : matériel différent, conforme à leur lieu', [...mats(ka)].every(m => ['aucun', 'halteres', 'elastique', 'hors'].indexOf(m) >= 0) && [...mats(mo)].some(m => ['machine', 'poulie', 'barre'].indexOf(m) >= 0), [[...mats(ka)], [...mats(mo)]]);
  const ids = x => new Set(x.pg.seances.flatMap(s => s.exercices.map(e => e.nom)));
  const commun = [...ids(ka)].filter(n => ids(mo).has(n)).length;
  t('Karim et Monique : programmes différents (moins de la moitié d’exercices en commun)', commun < Math.min(ids(ka).size, ids(mo).size) / 2, commun);
}
// Tom : information décisive manquante → questions
const tom = lire('H_tom');
if (tom) {
  const v = tom.ok ? K.validerPlanIndividuel(tom.brut, TOM, T.generer(TOM), { physique: E.physique(TOM), registre: Mx.REGISTRE }) : null;
  t('Tom (muscle à la maison, matériel non précisé) : l’IA pose des questions avant de créer', v && v.attente && v.questions.length >= 1, tom.brut && (tom.brut.pret === false ? 'questions refusées' : 'programme créé sans demander'));
  if (v && v.attente) t('Tom : la question porte sur le matériel ou l’expérience', v.questions.some(q => q.champ === 'materielSport' || /matériel|équipement|haltère|élastique|barre|expérience|pompes/i.test(q.texte)), v.questions.map(q => q.texte));
}
const tom2 = programme('H2_tom', TOM2);
if (tom2) {
  t('Tom après réponses : la réponse complémentaire (15 pompes, 2 tractions) est utilisée', tom2.pg.complementsUtilises.some(c => c.id === 'experience_pompes'));
  t('Tom après réponses : la barre de traction ou les élastiques sont utilisés', tom2.pg.seances.some(s => s.exercices.some(e => /traction|élastique/i.test(e.nom))));
}
// Adaptation
const ad = programme('C_karim_temps', Object.assign({}, KARIM, { tempsLibre: 3, poids: 93 }), { changements: [{ champ: 'tempsLibre' }, { champ: 'poids' }], precedent: true });
if (ad) {
  t('Adaptation : ajustements expliqués pour le temps libre', ad.pg.ajustements.some(a => /temps|3 h|heure/i.test(a.changement + a.consequence)), ad.pg.ajustements);
  t('Adaptation : progrès conservés mentionnés (séances jugées faciles)', ad.pg.progresConserves.length > 0 || /facile/.test(ad.txt));
}
// Business
function business(id, p) {
  const d = lire(id); if (!d) return null;
  if (!d.ok) { t(id + ' : réponse acceptée', false, d.erreursValidation || d.erreur); return null; }
  const v = K.validerBusinessIA(d.brut, p, null, { registre: Mx.REGISTRE });
  if (v.attente) { t(id + ' : questions bloquantes justifiées', v.questions.length > 0); return { attente: true }; }
  t(id + ' : 3 activités valables après revalidation', v.ok && v.opportunites.length === 3, v.erreurs);
  t(id + ' : analyse du profil présente', !!(v.analyseProfil && v.analyseProfil.length > 40));
  t(id + ' : chaque activité a ses propres tâches avec une première vente', v.opportunites.every(o => o.tachesIA && o.tachesIA.some(x => x.id === 'premiere_vente')));
  t(id + ' : aucun fait présenté comme sourcé sans recherche web', v.opportunites.every(o => o.faits.length === 0));
  const comp = v.opportunites.filter(o => o.statut === 'compatible');
  t(id + ' : budget des activités compatibles dans le capital (' + p.capital + ' €)', comp.every(o => o.budget <= p.capital), v.opportunites.map(o => o.nom + ':' + o.statut + ':' + o.budget));
  comp.forEach(o => { const pl = B.plan(o, p, []), pa = B.planAction(o, p, {}); t(id + ' / ' + o.nom + ' : plan et calendrier calculés par Cap', pl.ok && pa.ok); });
  return { v, txt: JSON.stringify(d.brut).toLowerCase() };
}
const sa = business('D1_sami', SAMI), ie = business('D3_ines', INES), s0 = business('D2_sami_0', Object.assign({}, SAMI, { capital: 0 }));
if (sa && sa.v) t('Sami : propositions fondées sur le code ou le sport et Lyon', /code|développ|site|appli/.test(sa.txt) && /sport|club|coach/.test(sa.txt));
if (ie && ie.v) t('Inès : propositions fondées sur la vente, les réseaux ou la photo, à Marseille', /vente|vendre|réseaux|photo|instagram/.test(ie.txt) && /marseille/.test(ie.txt));
if (sa && ie && sa.v && ie.v) { const n1 = sa.v.opportunites.map(o => o.nom.toLowerCase()), n2 = ie.v.opportunites.map(o => o.nom.toLowerCase()); t('Sami et Inès : aucune activité identique', !n1.some(n => n2.indexOf(n) >= 0), [n1, n2]); }
if (s0 && s0.v) t('Sami à 0 € : aucune activité « compatible » avec un budget positif', s0.v.opportunites.every(o => o.statut !== 'compatible' || o.budget === 0), s0.v.opportunites.map(o => o.nom + ':' + o.statut + ':' + o.budget));
// Pourquoi
const pq = lire('I_pourquoi');
if (pq) { const v = K.validerPourquoi(pq.brut); t('« Pourquoi ? » : réponse fondée sur les réponses de Karim', v.ok && /genou|8 h|débutant|régularité/i.test(v.reponse), pq.brut); }
console.log(res.join('\n'));
console.log('\n' + ok + ' réussis, ' + ko + ' échoués, ' + abs + ' non exécutés');
process.exit(ko ? 1 : 0);
