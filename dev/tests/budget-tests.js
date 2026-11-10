/* Tests du budget business (node budget-tests.js). */
const B = require('../../budget.js');
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + JSON.stringify(i)));
const D = (montant, statut, categorie, extra) => Object.assign({ montant, statut, categorie: categorie || 'achat', date: '2026-11-10' }, extra || {});

// Budget de 250 €, réserve 50 €
let b = B.calculer({ capital: 250, reserve: 50, depenses: [D(60, 'confirmee'), D(40, 'prevue', 'publicite')], ventes: [] });
T('250 € avec 50 € de réserve : mobilisable 200', b.mobilisable === 200);
T('dépenses confirmées 60, prévues 40', b.confirme === 60 && b.prevu === 40);
T('trésorerie = 200 − 60 = 140 ; disponible = 140 − 40 = 100', b.tresorerie === 140 && b.disponible === 100, b);
T('résultat = ventes − dépenses payées (−60), distinct du chiffre d’affaires', b.resultat === -60 && b.revenus === 0);
// Fournisseur demande 180 € alors qu'il reste 100 € à engager
let v = B.verifier(b, D(180, 'prevue'));
T('dépense prévue de 180 € bloquée, manque exact 80 €, raison expliquée', !v.ok && v.bloque && v.manque === 80 && /Non finançable/.test(v.raison) && /réserve de 50/.test(v.raison), v);
v = B.verifier(b, D(90, 'prevue'));
T('dépense prévue de 90 € acceptée, reste 10 €', v.ok && v.reste === 10, v);
v = B.verifier(b, D(180, 'confirmee'));
T('dépense déjà payée de 180 € enregistrable mais signalée (dépassement 40 €)', v.ok && v.depasse && v.manque === 40, v);
// Ventes : la trésorerie remonte
b = B.calculer({ capital: 250, reserve: 50, depenses: [D(60, 'confirmee')], ventes: [{ montant: 120, date: '2026-11-12' }] });
T('une vente de 120 € remonte la trésorerie à 260, résultat +60', b.tresorerie === 260 && b.resultat === 60);
// Budget nul
b = B.calculer({ capital: 0, reserve: 0, depenses: [], ventes: [] });
v = B.verifier(b, D(5, 'prevue'));
T('budget nul : toute dépense prévue est non finançable', !v.ok && v.manque === 5);
// Réserve non définie
b = B.calculer({ capital: 100, depenses: [] });
T('réserve non définie : signalée, rien n’est inventé', !b.reserveDefinie && b.reserve === 0 && b.alertes.some(a => /Réserve non définie/.test(a.texte)));
// Réserve supérieure au budget
b = B.calculer({ capital: 100, reserve: 300, depenses: [] });
T('réserve plafonnée au budget (mobilisable 0)', b.reserve === 100 && b.mobilisable === 0);
// Trésorerie négative → alerte bloquante
b = B.calculer({ capital: 50, reserve: 0, depenses: [D(80, 'confirmee')] });
T('trésorerie négative → alerte bloquante', b.tresorerie === -30 && b.alertes.some(a => a.niveau === 'bloquant'));
// Abonnements qui épuisent la trésorerie
b = B.calculer({ capital: 100, reserve: 0, depenses: [D(40, 'prevue', 'abonnement', { recurrence: 'mensuelle' })] });
T('abonnement 40 €/mois sur 100 € : alerte (moins de 3 mois)', b.recurrentMois === 40 && b.alertes.some(a => /abonnements/.test(a.texte)));
// Données invalides ignorées et comptées
b = B.calculer({ capital: 100, reserve: 0, depenses: [D(-5, 'confirmee'), D(10, 'bizarre'), D(10, 'confirmee', 'inconnue'), D(20, 'confirmee')] });
T('dépenses invalides ignorées (3), valide comptée (20)', b.confirme === 20 && b.ignorees === 3);
T('validation : montant, statut, catégorie, date', B.valider({ montant: 0, statut: 'x', categorie: 'y', date: 'z' }).length === 4);
// Arrondis au centime
b = B.calculer({ capital: 100, reserve: 0, depenses: [D(0.1, 'confirmee'), D(0.2, 'confirmee')] });
T('arrondis : 0,1 + 0,2 = 0,3 exactement', b.confirme === 0.3 && b.tresorerie === 99.7);
// Tâche coûteuse
b = B.calculer({ capital: 250, reserve: 50, depenses: [D(150, 'prevue')] });
T('tâche à 80 € quand il reste 50 € : non finançable, manque 30 €', B.tacheFinancable(b, 80).ok === false && B.tacheFinancable(b, 80).manque === 30);
T('tâche gratuite toujours finançable', B.tacheFinancable(b, 0).ok);
// Résultat par mois
const pm = B.parMois([D(30, 'confirmee', 'achat', { date: '2026-10-05' }), D(20, 'prevue', 'achat', { date: '2026-10-06' }), D(10, 'confirmee', 'outil', { date: '2026-11-01' })], [{ montant: 50, date: '2026-11-03' }]);
T('résultat par mois : octobre −30 (prévu exclu), novembre +40', pm.length === 2 && pm[0].resultat === -30 && pm[1].resultat === 40, pm);
// Comparaison de fournisseurs
const fs = B.comparerFournisseurs([{ nom: 'A', prixUnitaire: 4, livraison: 12 }, { nom: 'B', prixUnitaire: 3.5, livraison: 25 }, { nom: 'C', prixUnitaire: 3 }], 20);
T('comparaison : coût total réel (A 92 €, B 95 €), incomplet en dernier', fs[0].nom === 'A' && fs[0].total === 92 && fs[1].total === 95 && fs[2].total === null && fs[2].manquants[0] === 'livraison', fs);
T('coût par unité livrée (A 4,60 €)', fs[0].parUnite === 4.6);
console.log(res.join('\n')); const f = res.filter(x => x.startsWith('FAIL')).length; console.log('\n' + (res.length - f) + ' réussis, ' + f + ' échoués');
