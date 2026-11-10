/* Tests unitaires de la flamme (node flammes-tests.js). */
const F = require('../../flammes.js');
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i)));
const A = (o) => o; // activités
const base = (act, x) => Object.assign({ aujourdHui: '2026-11-10', debut: '2026-11-01', activites: act, joursSeance: null, seancesSemaine: 0, plancher: null }, x || {});

// 1. Série simple sur jours consécutifs (2026-11-10 est un mardi)
let r = F.calculer(base({ '2026-11-07': { pesee: 1 }, '2026-11-08': { tache: 1 }, '2026-11-09': { epargne: 1 }, '2026-11-10': { vente: 1 } }));
T('4 jours consécutifs avec actions réelles = 4', r.serie === 4, r.serie);
// 2. Aujourd'hui non fait n'interrompt pas
r = F.calculer(base({ '2026-11-08': { pesee: 1 }, '2026-11-09': { pesee: 1 } }));
T('aujourd’hui pas encore fait : série conservée (2), état « attente »', r.serie === 2 && r.aujourdhui === 'attente', r);
// 3. Un oubli par semaine couvert, le deuxième casse
r = F.calculer(base({ '2026-11-03': { pesee: 1 }, '2026-11-05': { pesee: 1 }, '2026-11-06': { pesee: 1 } }, { aujourdHui: '2026-11-06', debut: '2026-11-03' }));
T('un oubli dans la semaine couvert automatiquement', r.serie === 3 && r.calendrier.find(x => x.date === '2026-11-04').etat === 'couvert', r.calendrier.slice(-4));
r = F.calculer(base({ '2026-11-03': { pesee: 1 }, '2026-11-06': { pesee: 1 } }, { aujourdHui: '2026-11-06', debut: '2026-11-03' }));
T('deux oublis la même semaine : la série repart', r.serie === 1, r.serie);
// 4. Jours de repos prévus : pause
r = F.calculer(base({ '2026-11-09': { seance: 1 }, '2026-11-07': { seance: 1 } }, { joursSeance: [1, 3, 6], seancesSemaine: 3, debut: '2026-11-07' })); // sam 7 séance, dim 8 repos, lun 9 séance, mar 10 attente
T('jour de repos prévu = pause, pas de casse', r.serie === 2 && r.calendrier.find(x => x.date === '2026-11-08').etat === 'repos', r.calendrier.slice(-4));
// 5. Sous-alimentation non récompensée, sans casser
r = F.calculer(base({ '2026-11-08': { pesee: 1 }, '2026-11-09': { repas: 2, kcal: 900 } }, { plancher: 1500, debut: '2026-11-08' }));
T('repas sous le minimum de sécurité : jour neutre (ne compte pas, ne casse pas)', r.serie === 1 && r.calendrier.find(x => x.date === '2026-11-09').etat === 'neutre', r.calendrier.slice(-3));
r = F.calculer(base({ '2026-11-09': { repas: 3, kcal: 1800 } }, { plancher: 1500, debut: '2026-11-09' }));
T('repas au-dessus du minimum : jour compté', r.serie === 1);
// 6. Surentraînement : séances au-delà du programme + 1 ne comptent pas
const act = {}; ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'].forEach(d => { act[d] = { seance: 1 }; });
r = F.calculer(base(act, { joursSeance: [1, 3, 5], seancesSemaine: 3, debut: '2026-11-02', aujourdHui: '2026-11-08' }));
const etats7 = r.calendrier.slice(-7).map(x => x.etat);
T('7 séances pour 3 prévues : seules 4 comptent, les autres sont neutres', etats7.filter(x => x === 'actif').length === 4 && etats7.filter(x => x === 'neutre').length === 3, etats7);
// 7. Plusieurs actions le même jour = 1 jour
r = F.calculer(base({ '2026-11-10': { seance: 1, pesee: 1, tache: 3, vente: 2 } }, { debut: '2026-11-10' }));
T('plusieurs actions le même jour = un seul jour', r.serie === 1 && r.calendrier[34].motifs.length === 4);
// 8. Record conservé après une coupure
const a2 = { '2026-10-01': { pesee: 1 }, '2026-10-02': { pesee: 1 }, '2026-10-03': { pesee: 1 }, '2026-10-04': { pesee: 1 }, '2026-10-05': { pesee: 1 }, '2026-11-10': { pesee: 1 } };
r = F.calculer(base(a2, { debut: '2026-10-01' }));
T('record conservé (5) et série actuelle (1)', r.record === 5 && r.serie === 1, [r.record, r.serie]);
T('paliers : « Étincelle » atteinte (record ≥ 3), prochain palier calculé sur la série', r.paliers[0].atteint && r.prochain.jours === 3 && r.prochain.reste === 2, r.prochain);
T('historique des séries ≥ 3 jours', r.historique.length === 1 && r.historique[0].jours === 5, r.historique);
// 9. Changement d'heure : fin octobre (passage à l'heure d'hiver) sans trou ni doublon
r = F.calculer(base({ '2026-10-24': { pesee: 1 }, '2026-10-25': { pesee: 1 }, '2026-10-26': { pesee: 1 } }, { debut: '2026-10-24', aujourdHui: '2026-10-26' }));
T('passage à l’heure d’hiver (25/10) : 3 jours consécutifs', r.serie === 3, r.serie);
T('décalage de date stable sur un an', F.decaler('2026-03-28', 2) === '2026-03-30' && F.decaler('2026-12-31', 1) === '2027-01-01');
// 10. Profil sans données : rien d'inventé
r = F.calculer(base({}, { debut: '2026-11-10' }));
T('aucune donnée : flamme à 0, aucun palier atteint', r.serie === 0 && r.record === 0 && r.atteints === 0);
// 11. Résumé hebdomadaire
r = F.calculer(base({ '2026-11-09': { seance: 1, repas: 2, kcal: 2000 }, '2026-11-10': { pesee: 1 } }, { debut: '2026-11-09', plancher: 1500 }));
T('résumé de la semaine (lundi → aujourd’hui) : 2 jours actifs, détail par type', r.semaine.actifs === 2 && r.semaine.parType.séance === 1 && r.semaine.parType.repas === 1 && r.semaine.parType.pesée === 1, r.semaine);
console.log(res.join('\n')); const f = res.filter(x => x.startsWith('FAIL')).length; console.log('\n' + (res.length - f) + ' réussis, ' + f + ' échoués');
