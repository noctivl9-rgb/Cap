/* Vérifie la règle « chaque question a une conséquence ».
 * 1. Toute variable demandée dans le questionnaire (app.js) figure dans le registre (matrice.js).
 * 2. Pour chaque question, deux réponses différentes changent au moins une des sorties déclarées.
 * 3. Les questions à effet d'interface seulement sont réellement lues par le code.
 * Lancer : node dev/tests/matrice-tests.js */
const fs = require('fs'), path = require('path');
const Mx = require('../../matrice.js');
const R = path.join(__dirname, '../..');
let ok = 0, ko = 0; const T = (n, c, i) => { if (c) ok++; else { ko++; console.log('ÉCHEC ' + n + (i !== undefined ? ' → ' + JSON.stringify(i) : '')); } };

const app = fs.readFileSync(path.join(R, 'app.js'), 'utf8');
const champs = new Set();
for (const m of app.matchAll(/\{ id: '([a-zA-Z]+)', sec: '[^']+'(?:, when: [^,]+(?:\([^)]*\))?[^,]*)?, f: \[([^\]]*)\]/g)) m[2].split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean).forEach(v => champs.add(v));
T('questions trouvées dans app.js', champs.size >= 35, champs.size);
const ignores = { reveMontant: 'complément de « reve » (montant du projet « autre »)', objectifsPerso: 'objectifs personnalisés : testés dans tests.js (validerObjectifsPerso, cibleJour)' };
champs.forEach(v => T('registre : « ' + v + ' » documenté', !!Mx.PAR_VARIABLE[v] || !!ignores[v]));

const BASE = { domaines: ['corps', 'argent', 'entreprise'], age: 25, tempsLibre: 20, sexe: 'H', taille: 178, poids: 80, tour: 90, objectif: 'perdre', cible: 74, delaiSem: 26, rythme: 0.4, activite: 'assis', autreSport: 1, niveau: 'intermediaire', jours: 3, minutes: 60, lieu: 'maison', materielSport: ['halteres'], prioriteSport: 'muscle', contraintes: ['aucune'], regime: 'omnivore', modeSimple: false, obstacle: 'motivation', revenus: 1800, fixes: 700, variables: 400, remboursements: 0, epargne: 2000, reve: 'vivre', reveAnnee: 2031, competences: ['code', 'design'], heuresProjet: 8, revenuVise: 3000, pays: 'france', capital: 300, materielPro: ['ordinateur'], experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux', businessChoisi: 'sites_vitrines', debutProjet: '2026-11-10' };
const CONTEXTE = { zonesDouleur: { contraintes: ['douleur'] } };
const rapport = [];
Mx.REGISTRE.forEach(q => {
  if (!q.sonde) return;
  const p1 = Object.assign({}, BASE, CONTEXTE[q.variable] || {}, { [q.variable]: q.sonde[0] });
  const p2 = Object.assign({}, BASE, CONTEXTE[q.variable] || {}, { [q.variable]: q.sonde[1] });
  const c1 = Mx.consequences(p1), c2 = Mx.consequences(p2);
  const changes = Object.keys(c1).filter(k => JSON.stringify(c1[k]) !== JSON.stringify(c2[k]));
  const attendues = q.sorties.filter(k => changes.indexOf(k) >= 0);
  T('« ' + q.variable + ' » change ' + q.sorties.join(' / '), attendues.length > 0, { sonde: q.sonde, changes });
  rapport.push(q.variable + ' : ' + JSON.stringify(q.sonde[0]) + ' → ' + JSON.stringify(q.sonde[1]) + ' modifie ' + (changes.join(', ') || 'rien'));
});
// Effets d'interface : la valeur est lue par le code de l'interface
const journal = fs.readFileSync(path.join(R, 'journal.js'), 'utf8');
T('« modeSimple » lu par l’accueil', /profil \|\| \{\}\)\.modeSimple/.test(journal));
T('chaque entrée du registre a une utilité, un module et une règle de valeur manquante', Mx.REGISTRE.every(q => q.utilite && q.modules.length && q.manquant && q.recalcul));
// Valeurs manquantes : une question utile, jamais une valeur inventée (test H en partie)
const qm = Mx.questionsManquantes({ domaines: ['entreprise'], age: 17 });
T('entreprise sans compétences : Cap demande les compétences', qm.some(x => x.champ === 'competences'));
T('entreprise sans capital : Cap demande le capital', qm.some(x => x.champ === 'capital'));
T('les questions manquantes sont justifiées', qm.every(x => x.raison.length > 10));
if (process.argv.includes('--rapport')) console.log(rapport.join('\n'));
console.log('\n' + ok + ' réussis, ' + ko + ' échoués');
process.exit(ko ? 1 : 0);
