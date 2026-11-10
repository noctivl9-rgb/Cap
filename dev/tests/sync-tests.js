/* Tests de sync.js (export, import, fusion). Lancer : node dev/tests/sync-tests.js */
const S = require('../../sync.js');
let ok = 0, ko = 0;
const T = (nom, cond, info) => { if (cond) ok++; else { ko++; console.log('ÉCHEC ' + nom + (info !== undefined ? ' → ' + JSON.stringify(info) : '')); } };
const date = new Date('2026-11-10T09:00:00Z');

const tel = { profil: { main: { age: 15, poids: 71, taille: 170, creeLe: '2026-11-01' } }, pesees: { '2026-11-01': { date: '2026-11-01', poids: 71 }, '2026-11-08': { date: '2026-11-08', poids: 70.4 } }, repas: { '2026-11-09': { date: '2026-11-09', entrees: [{ n: 'Riz', g: 180 }] } }, epargne: { e1: { date: '2026-11-02', montant: 20 } } };
const claude = { profil: { main: { age: 15, poids: 71, taille: 170, creeLe: '2026-10-20' } }, pesees: { '2026-11-01': { date: '2026-11-01', poids: 71 }, '2026-11-05': { date: '2026-11-05', poids: 70.8 }, '2026-11-08': { date: '2026-11-08', poids: 70.6 } }, photos: { ph1: { assetId: 'a1', date: '2026-11-03' } } };

// Export → import : aller-retour sans perte
const ex = S.creerExport(tel, 'github', date);
T('export : format et source', ex.app === 'cap' && ex.format === 1 && ex.source === 'github');
T('export : comptes', ex.comptes.pesees === 2 && ex.comptes.profil === 1 && ex.comptes.repas === 1);
const lu = S.lireExport(JSON.stringify(ex));
T('import : fichier valide accepté', lu.ok, lu.erreurs);
T('aller-retour identique', S.egal(lu.data, S.normaliser(tel)));
T('empreinte stable quel que soit l’ordre des clés', S.empreinte({ a: 1, b: { c: 2, d: 3 } }) === S.empreinte({ b: { d: 3, c: 2 }, a: 1 }));

// Fichiers refusés
T('JSON tronqué refusé', !S.lireExport(JSON.stringify(ex).slice(0, 120)).ok);
T('fichier d’une autre appli refusé', !S.lireExport({ app: 'autre', format: 1, collections: {} }).ok);
T('format inconnu refusé', !S.lireExport(Object.assign({}, ex, { format: 99 })).ok);
const modifie = JSON.parse(JSON.stringify(ex)); modifie.collections.pesees['2026-11-08'].poids = 60;
T('fichier modifié après export : bloqué (empreinte)', !S.lireExport(modifie).ok);
T('fichier vide refusé', !S.lireExport(S.creerExport({}, 'x', date)).ok);

// Contrôles de type
const sale = S.creerExport({ pesees: { a: { date: '2026-11-01', poids: 71 }, b: { date: 'hier', poids: 70 }, c: { date: '2026-11-02', poids: 9000 } } }, 'x', date);
const luSale = S.lireExport(sale);
T('éléments invalides écartés, valides gardés', luSale.ok && Object.keys(luSale.data.pesees).length === 1 && /2 élément/.test(luSale.avertissements.join(' ')), luSale);

// Photos non transférables
const luC = S.lireExport(S.creerExport(claude, 'claude', date));
T('photos signalées et non importées', luC.ok && Object.keys(luC.data.photos).length === 0 && /photo/.test(luC.avertissements.join(' ')));

// Plan de fusion
const plan = S.planifier(tel, luC.data);
T('plan : pesée du 05/11 nouvelle', plan.parColl.pesees.nouveaux.indexOf('2026-11-05') >= 0);
T('plan : pesée du 01/11 identique (doublon)', plan.parColl.pesees.identiques.indexOf('2026-11-01') >= 0);
T('plan : pesée du 08/11 en conflit (70,4 contre 70,6)', plan.parColl.pesees.conflits.indexOf('2026-11-08') >= 0);
T('plan : deux profils différents détectés', plan.profilsDifferents === true);
T('plan : totaux', plan.total.nouveaux === 1 && plan.total.identiques === 1 && plan.total.conflits === 2, plan.total);

// Mode garder : rien d'existant n'est modifié
const wG = S.ecritures(tel, luC.data, 'garder', date);
const resG = S.appliquer(tel, wG);
T('garder : pesée nouvelle ajoutée', resG.pesees['2026-11-05'].poids === 70.8);
T('garder : conflit → version actuelle conservée', resG.pesees['2026-11-08'].poids === 70.4);
T('garder : profil actuel conservé', resG.profil.main.creeLe === '2026-11-01');
T('garder : repas absent de l’import pas supprimé', !!resG.repas['2026-11-09']);
T('garder : aucune écriture sur un document existant', wG.every(w => !(tel[w.coll] && tel[w.coll][w.id])));

// Mode remplacer : l'import gagne, l'ancien profil est archivé, rien n'est supprimé
const wR = S.ecritures(tel, luC.data, 'remplacer', date);
const resR = S.appliquer(tel, wR);
T('remplacer : conflit → version importée', resR.pesees['2026-11-08'].poids === 70.6);
T('remplacer : profil importé', resR.profil.main.creeLe === '2026-10-20');
const arch = Object.values(resR.historique);
T('remplacer : ancien profil archivé dans l’historique', arch.length === 1 && arch[0].profil.creeLe === '2026-11-01' && arch[0].raison === 'import');
T('remplacer : épargne absente de l’import gardée', !!resR.epargne.e1);
T('mode inconnu refusé', (() => { try { S.ecritures(tel, claude, 'effacer'); return false; } catch (e) { return true; } })());

// Import idempotent : réimporter le même fichier n'écrit rien
T('réimport du même fichier : 0 écriture', S.ecritures(resG, S.normaliser(tel), 'remplacer', date).length === 0);

// Résumé lisible
const lignes = S.resume(plan);
T('résumé : pesées 1 nouvelle, 1 conflit', lignes.some(l => l.coll === 'pesees' && l.nouveaux === 1 && l.conflits === 1), lignes);

console.log('\n' + ok + ' réussis, ' + ko + ' échoués');
process.exit(ko ? 1 : 0);
