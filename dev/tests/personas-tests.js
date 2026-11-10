/* Batterie de 8 profils : la personnalisation par règles varie réellement selon les informations pertinentes.
 * (L'IA générative n'est pas testée ici : elle exige un appel réel, voir dev/essais-ia.) node personas-tests.js */
const T = require('../../training.js'), B = require('../../business.js'), BG = require('../../budget.js');
const res = []; const t = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i).slice(0, 400)));
const base = { domaines: ['corps'], sexe: 'H', taille: 178, poids: 75, objectif: 'maintenir', activite: 'mixte', autreSport: 0, prioriteSport: 'forme', contraintes: ['aucune'], tempsLibre: 15 };
const P = {
  debutantSansMateriel: Object.assign({}, base, { age: 25, niveau: 'debutant', jours: 3, minutes: 45, lieu: 'maison', materielSport: ['aucun'] }),
  sportifExperimente: Object.assign({}, base, { age: 28, niveau: 'avance', jours: 5, minutes: 75, lieu: 'salle', prioriteSport: 'force' }),
  peuDeTemps: Object.assign({}, base, { age: 35, niveau: 'intermediaire', jours: 2, minutes: 20, lieu: 'maison', materielSport: ['halteres'], tempsLibre: 2 }),
  contraintes: Object.assign({}, base, { age: 45, niveau: 'debutant', jours: 3, minutes: 45, lieu: 'maison', materielSport: ['elastique'], contraintes: ['douleur'], zonesDouleur: ['genou', 'dos'] })
};
const G = {}; Object.keys(P).forEach(k => { G[k] = T.generer(P[k]); });
const exos = g => g.seances.flatMap(s => s.exercices.map(e => e.nom));
const vol = g => g.seances.reduce((s, x) => s + x.exercices.reduce((a, e) => a + (e.series || 1), 0), 0);
Object.keys(G).forEach(k => t(k + ' : programme généré avec séances, exercices, séries, répétitions, repos et alternative', G[k].ok && G[k].seances.length > 0 && G[k].seances.every(s => s.exercices.every(e => e.nom && (e.type === 'cardio' || (e.series && e.reps)) && (e.repos !== undefined))), G[k].ok ? null : G[k]));
t('séances par semaine respectent la demande (3 / 5 / 2 / 3)', G.debutantSansMateriel.planning.length === 3 && G.sportifExperimente.planning.length === 5 && G.peuDeTemps.planning.length === 2 && G.contraintes.planning.length === 3, Object.keys(G).map(k => G[k].planning.length));
t('peu de temps : durée des séances ≤ 20 min, durées plus longues pour le sportif', G.peuDeTemps.seances.every(s => s.duree <= 20) && G.sportifExperimente.seances.every(s => s.duree > 20), G.peuDeTemps.seances.map(s => s.duree));
t('sans matériel : aucun exercice demandant salle, barre ou machine', !exos(G.debutantSansMateriel).some(n => /barre|machine|poulie|presse|banc/i.test(n)), exos(G.debutantSansMateriel));
t('sportif expérimenté : volume supérieur au débutant', vol(G.sportifExperimente) > vol(G.debutantSansMateriel), [vol(G.sportifExperimente), vol(G.debutantSansMateriel)]);
t('contraintes (genou, dos) : décisions de sécurité tracées', G.contraintes.decisions.some(d => (d.champs || []).indexOf('zonesDouleur') >= 0), G.contraintes.decisions.map(d => d.sujet));
t('contraintes : aucun saut ni charge axiale lourde', !exos(G.contraintes).some(n => /saut|burpee|squat barre|soulevé de terre/i.test(n)), exos(G.contraintes));
const empreinte = g => JSON.stringify(g.seances.map(s => s.exercices.map(e => e.nom + e.series + e.reps)));
t('les 4 programmes sont différents deux à deux', new Set(Object.keys(G).map(k => empreinte(G[k]))).size === 4);

// Business : 50 €, 250 €, 1 000 €, activité existante
const bb = { domaines: ['entreprise'], age: 24, pays: 'france', competences: ['code', 'design'], materielPro: ['ordinateur', 'smartphone'], heuresProjet: 10, experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux' };
const R = {}; [50, 250, 1000].forEach(c => { R[c] = B.recommander(Object.assign({}, bb, { capital: c })); });
[50, 250, 1000].forEach(c => t('entrepreneur ' + c + ' € : chaque option recommandée tient dans le budget (budget de départ ≤ ' + c + ' €)', R[c].ok && R[c].top.every(x => x.budget <= c), R[c].top.map(x => [x.nom, x.budget])));
t('les recommandations varient avec le budget (50 € ≠ 1 000 €)', JSON.stringify(R[50].top.map(x => x.id)) !== JSON.stringify(R[1000].top.map(x => x.id)) || R[50].ecartes.length > R[1000].ecartes.length, [R[50].top.map(x => x.id), R[1000].top.map(x => x.id)]);
t('50 € : des activités sont écartées pour budget, avec la raison', R[50].ecartes.some(x => /budget|capital|€/i.test(x.raisons.join(' '))), R[50].ecartes.slice(0, 3).map(x => x.raisons));
const plan250 = B.planAction(R[250].top[0].id, Object.assign({}, bb, { capital: 250 }), {}, null);
const b250 = BG.calculer({ capital: 250, reserve: 50, depenses: [], ventes: [] });
t('250 € : chaque tâche coûteuse est classée finançable ou non selon le budget engageable (200 €)', plan250.ok && plan250.taches.filter(x => x.cout).every(x => BG.tacheFinancable(b250, x.cout).ok === (x.cout <= 200)), plan250.taches.filter(x => x.cout).map(x => [x.id, x.cout]));
t('toutes les tâches ont objectif, instructions et critère de réussite', plan250.taches.every(x => x.objectif && Array.isArray(x.instructions) && x.instructions.length >= 2 && x.critere), plan250.taches.filter(x => !x.objectif).map(x => x.id));
// Activité existante : suivi par les chiffres réels, pas de recommandation d'idée
const mois = BG.parMois([{ montant: 40, statut: 'confirmee', categorie: 'publicite', date: '2026-10-10' }], [{ montant: 300, date: '2026-10-20' }, { montant: 120, date: '2026-11-02' }]);
t('activité existante : résultat mensuel réel (oct. +260 €, nov. +120 €)', mois.length === 2 && mois[0].resultat === 260 && mois[1].resultat === 120, mois);
console.log(res.join('\n')); const f = res.filter(x => x.startsWith('FAIL')).length; console.log('\n' + (res.length - f) + ' réussis, ' + f + ' échoués');
