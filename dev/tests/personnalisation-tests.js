/* Tests de personnalisation A à J (cahier des charges V5, section 14). Profils fictifs.
 * Lancer : node dev/tests/personnalisation-tests.js */
const vm = require('vm'), fs = require('fs'), path = require('path');
const R = path.join(__dirname, '../..');
const E = require('../../engine.js'), T = require('../../training.js'), B = require('../../business.js'), K = require('../../contrats.js'), S = require('../../sync.js'), Mx = require('../../matrice.js');
let ok = 0, ko = 0; const res = [];
const t = (lettre, nom, c, info) => { res.push((c ? 'ok   ' : 'FAIL ') + lettre + ' · ' + nom + (c || info === undefined ? '' : ' → ' + JSON.stringify(info).slice(0, 300))); if (c) ok++; else ko++; };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Profils fictifs
const LEA = { domaines: ['corps'], age: 34, sexe: 'F', taille: 162, poids: 58, objectif: 'prendre', cible: 61, delaiSem: 26, activite: 'mixte', autreSport: 0, niveau: 'intermediaire', jours: 4, minutes: 60, lieu: 'salle', prioriteSport: 'force', contraintes: ['aucune'], tempsLibre: 15 };
const KARIM = { domaines: ['corps'], age: 52, sexe: 'H', taille: 181, poids: 104, tour: 112, objectif: 'perdre', cible: 92, delaiSem: 52, activite: 'assis', autreSport: 0, niveau: 'debutant', jours: 3, minutes: 45, lieu: 'maison', materielSport: ['elastique'], contraintes: ['douleur'], zonesDouleur: ['genou'], tempsLibre: 6 };
const ELIAS = { domaines: ['corps', 'argent', 'entreprise'], age: 16, sexe: 'H', taille: 170, poids: 71, objectif: 'perdre', cible: 65, delaiSem: 26, activite: 'assis', autreSport: 0, niveau: 'debutant', jours: 3, minutes: 60, lieu: 'maison', materielSport: ['aucun'], contraintes: ['aucune'], tempsLibre: 20, revenus: 0, fixes: 0, variables: 0, remboursements: 0, epargne: 0, reve: 'appart', reveAnnee: 2036, competences: ['code'], heuresProjet: 7, pays: 'france', capital: 0, materielPro: ['ordinateur', 'smartphone'], experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux' };

// ---------------------------------------------------------------- A
{
  const a = T.generer(LEA), b = T.generer(KARIM), ea = E.energie(LEA), eb = E.energie(KARIM);
  t('A', 'profils différents → dépenses différentes', ea.tdee !== eb.tdee, [ea.tdee, eb.tdee]);
  t('A', 'profils différents → programmes différents', a.empreinte !== b.empreinte);
  t('A', 'Léa (salle, force, intermédiaire) : charges lourdes, 4-6 répétitions', a.seances[0].exercices[0].reps === '4-6' && a.seances.length === 4);
  t('A', 'Karim (genou douloureux) : aucun exercice qui sollicite le genou', b.seances.every(s => s.exercices.every(e => !(T.PAR_ID[e.id] && T.PAR_ID[e.id].zones.indexOf('genou') >= 0))));
  t('A', 'Karim (élastiques seulement) : aucun exercice demandant haltères, barre ou machine', b.seances.every(s => s.exercices.every(e => ['aucun', 'elastique'].indexOf(T.PAR_ID[e.id].mat) >= 0)));
  t('A', 'Karim (débutant) : force refusée par défaut, 8 répétitions minimum', b.seances.every(s => s.exercices.every(e => !/^[1-7]-/.test(e.reps))));
  t('A', 'Karim (6 h libres) : programme tenu dans le temps disponible', b.seances.reduce((x, s) => x + s.duree, 0) <= 6 * 60);
}
// ---------------------------------------------------------------- B
{
  const p1 = Object.assign({}, KARIM), p2 = Object.assign({}, KARIM, { poids: 98 });
  const e1 = E.energie(p1), e2 = E.energie(p2), f1 = E.physique(p1), f2 = E.physique(p2);
  t('B', 'poids modifié → métabolisme recalculé (Mifflin : −10 kcal par kg)', e1.bmr - e2.bmr === 60, [e1.bmr, e2.bmr]);
  t('B', 'poids modifié → dépense, calories et semaines recalculées', e1.tdee !== e2.tdee && f1.kcal !== f2.kcal && f1.semaines !== f2.semaines);
  t('B', 'poids modifié → les finances et le classement business ne bougent pas (non concernés)', eq(Mx.consequences(Object.assign({}, ELIAS)).hasOwnProperty('finances.capacite') && Mx.consequences(Object.assign({}, ELIAS, { poids: 75 }))['finances.capacite'], Mx.consequences(ELIAS)['finances.capacite']) && Mx.consequences(Object.assign({}, ELIAS, { poids: 75 }))['business.top'] === Mx.consequences(ELIAS)['business.top']);
}
// ---------------------------------------------------------------- C
{
  const base = Object.assign({}, ELIAS, { jours: 4, minutes: 60 });
  const p1 = T.generer(Object.assign({}, base, { tempsLibre: 20 })), p2 = T.generer(Object.assign({}, base, { tempsLibre: 9 })), p3 = T.generer(Object.assign({}, base, { tempsLibre: 3 }));
  const tot = p => p.parametres.joursRetenus * p.parametres.minutesRetenues;
  t('C', '20 h libres : 4 séances de 60 min conservées', p1.parametres.joursRetenus === 4 && p1.parametres.minutesRetenues === 60);
  t('C', 'temps réduit (9 h − 7 h projet) : séances raccourcies ou retirées', tot(p2) <= 120 && tot(p2) < tot(p1), p2.parametres);
  t('C', 'temps encore réduit : programme réorganisé et décision expliquée', tot(p3) < tot(p1) && p3.decisions.some(d => d.sujet === 'temps' && /réduit/.test(d.raison)));
  const dt = T.generer({ age: 25, niveau: 'debutant', jours: 6, minutes: 60, lieu: 'maison', materielSport: ['aucun'], tempsLibre: 2, objectif: 'maintenir', contraintes: ['aucune'] });
  t('C', 'exemple du cahier : débutant, 2 h, sans matériel → pas 6 séances en salle', dt.seances.length <= 3 && dt.seances.every(s => s.exercices.every(e => T.PAR_ID[e.id].mat === 'aucun')) && dt.seances.reduce((x, s) => x + s.duree, 0) <= 120);
}
// ---------------------------------------------------------------- D
{
  const p0 = Object.assign({}, ELIAS, { capital: 0 }), p5 = Object.assign({}, ELIAS, { capital: 500 });
  const r0 = B.recommander(p0), r5 = B.recommander(p5);
  t('D', 'capital 0 € → 500 € : le classement change', r0.top.map(x => x.id).join() !== r5.top.map(x => x.id).join(), [r0.top.map(x => x.id), r5.top.map(x => x.id)]);
  t('D', 'avec 500 €, une activité de code (compétence déclarée) entre dans le top 3', r5.top.some(x => ['sites_vitrines', 'maintenance_web', 'automatisation'].indexOf(x.id) >= 0));
  const rv = B.recommander(Object.assign({}, p5, { competences: ['video'] }));
  t('D', 'compétences modifiées (code → vidéo) : le montage vidéo passe devant', rv.top[0].id === 'montage_video', rv.top.map(x => x.id));
}
// ---------------------------------------------------------------- E
{
  const r = B.recommander(Object.assign({}, ELIAS, { capital: 0 }));
  const photo = r.ecartes.find(x => x.id === 'photo');
  t('E', 'photographe sans appareil ni budget : présenté comme non finançable', photo && photo.statut === 'non_financable' && /manque/.test(photo.raisons.join(' ')), photo);
  t('E', 'aucune activité non finançable dans le top 3', r.top.every(x => x.statut === 'compatible' && x.budget <= 0));
  const rev = r.ecartes.find(x => x.id === 'revente');
  t('E', 'achat-revente à 16 ans : rejeté pour raison légale', rev && rev.statut === 'rejete' && /mineur/.test(rev.raisons.join(' ')));
  const coach = r.ecartes.find(x => x.id === 'coach_sportif');
  t('E', 'coaching sportif sans diplôme : rejeté (carte professionnelle)', coach && /L212-1/.test(coach.raisons.join(' ')));
}
// ---------------------------------------------------------------- F (persistance logique ; la persistance navigateur est testée par persist2.js et projet-ui.js)
{
  const data = { profil: { main: Object.assign({ businessChoisi: 'sites_vitrines' }, ELIAS) }, taches: { 'sites_vitrines:offre': { id: 'sites_vitrines:offre', fait: true, date: '2026-11-12', historique: [{ fait: true, date: '2026-11-12T10:00:00Z' }] } }, ventes: { v1: { date: '2026-12-03', montant: 350, note: 'garage' } }, historique: { 'p-1': { date: '2026-11-01', raison: 'modification', profil: { poids: 72 } } } };
  const lu = S.lireExport(JSON.stringify(S.creerExport(data, 'test')));
  t('F', 'sauvegarde puis restauration : profil, tâches faites, ventes et historique identiques', lu.ok && eq(lu.data.taches, data.taches) && eq(lu.data.ventes, data.ventes) && eq(lu.data.historique, data.historique) && eq(lu.data.profil, data.profil));
}
// ---------------------------------------------------------------- G
{
  const deux = f => eq(f(), f());
  t('G', 'énergie reproductible', deux(() => E.energie(KARIM)));
  t('G', 'programme reproductible (empreinte identique)', deux(() => T.generer(ELIAS)) && T.generer(ELIAS).empreinte === T.generer(Object.assign({}, ELIAS)).empreinte);
  t('G', 'classement business reproductible', deux(() => B.recommander(ELIAS)));
  t('G', 'plan financier et plan d’action reproductibles', deux(() => B.plan('sites_vitrines', Object.assign({}, ELIAS, { capital: 500 }), [])) && deux(() => B.planAction('sites_vitrines', ELIAS, {})));
  const shuffled = {}; Object.keys(ELIAS).reverse().forEach(k => { shuffled[k] = ELIAS[k]; });
  t('G', 'ordre des réponses sans effet', eq(Mx.consequences(ELIAS), Mx.consequences(shuffled)));
}
// ---------------------------------------------------------------- H
{
  const e = E.energie({ age: 30, activite: 'assis' });
  t('H', 'poids absent : pas d’estimation, message clair', !e.ok && /poids/.test(e.message) && e.tdee === undefined);
  const r = B.recommander(Object.assign({}, ELIAS, { competences: [] }));
  t('H', 'compétences absentes : Cap les demande avant de recommander', !r.ok && r.manquants.some(m => m.champ === 'competences' && m.raison.length > 10));
  const p = T.generer({ age: 20, niveau: 'debutant', jours: 3, minutes: 45, lieu: 'maison', tempsLibre: 10 });
  t('H', 'matériel absent : hypothèse prudente annoncée, pas inventée en silence', p.decisions.some(d => d.sujet === 'materiel' && /hypothèse prudente/.test(d.raison)));
  const q = T.generer({ age: 20, niveau: 'debutant', jours: 3, lieu: 'maison' });
  t('H', 'durée absente : programme non construit, champ demandé', !q.ok && q.manquants.indexOf('minutes') >= 0);
  const pa = B.planAction('sites_vitrines', { age: 17, heuresProjet: 0 }, {});
  t('H', '0 h pour le projet : pas de calendrier inventé', !pa.ok && pa.manquants[0].champ === 'heuresProjet');
  const ph = E.physique({ age: 30, poids: 80, taille: 180, activite: 'assis', objectif: 'perdre' });
  t('H', 'paramètre physiologique absent : demandé, pas deviné', !ph.ok && ph.manquants.indexOf('sexe') >= 0);
  const nr = E.energie({ age: 30, poids: 80, taille: 180, activite: 'assis', sexe: 'nr' });
  t('H', '« ne pas répondre » : moyenne des formules et marge élargie, expliquées', nr.ok && /moyenne/i.test(nr.bmrMethode) && nr.marge > E.energie({ age: 30, poids: 80, taille: 180, activite: 'assis', sexe: 'H' }).marge);
}
// ---------------------------------------------------------------- I
{
  const prog = T.generer(Object.assign({}, KARIM));
  const d = { energie: E.energie(KARIM), prog, business: B.recommander(Object.assign({}, ELIAS, { capital: 500 })) };
  const c = K.contexteCoach(KARIM, d);
  t('I', 'le contexte du coach contient chaque décision, sa raison et les réponses utilisées', c.programme.decisions.length === prog.decisions.length && c.programme.decisions.every(x => x.raison && Array.isArray(x.reponses_utilisees)));
  t('I', 'le contexte contient les chiffres des moteurs (dépense, plage, méthode)', c.energie.depense === d.energie.tdee && c.energie.plage && /Mifflin/.test(c.energie.methode));
  t('I', 'le contexte explique le classement business et les activités écartées', c.business.top.every(x => /Points forts/.test(x.explication)) && c.business.ecartes.length > 0);
  const l = K.expliquerSansIA(d);
  t('I', 'explication disponible sans IA : douleur, temps et classement', l.some(x => /genou/.test(x)) && l.some(x => /h par semaine/.test(x)) && l.some(x => /Rang 1/.test(x)));
}
// ---------------------------------------------------------------- J
(async () => {
  const st = K.statutIA(() => false);
  t('J', 'IA non connectée : statut annoncé, pas de fausse génération', !st.actif && /indisponible/.test(st.texte) && /pas généré par une IA/.test(st.texte));
  // ai.js dans un faux navigateur dont le service IA échoue
  const win = { CapEngine: E, CapFoods: require('../../foods.js'), FileReader: function () {}, claude: { use: async n => { if (n !== 'sample') return null; const f = async () => { throw { code: 'rate_limited', message: 'trop' }; }; f.json = async () => { throw { code: 'invalid_json' }; }; f.limits = async () => ({ images: { mediaTypes: ['image/jpeg'] } }); return f; } } };
  win.window = win; vm.createContext(win); vm.runInContext(fs.readFileSync(path.join(R, 'ai.js'), 'utf8'), win);
  await win.CapAI.init();
  let err1 = null; try { await win.CapAI.coach('Pourquoi ?', [], {}, {}); } catch (e) { err1 = e; }
  t('J', 'erreur du service (limite atteinte) : message honnête, aucune réponse inventée', err1 && win.CapAI.erreur(err1) === 'Trop de demandes d’un coup. Réessaie dans une minute.');
  let err2 = null, scan = null; try { scan = await win.CapAI.analyserRepas({}, null); } catch (e) { err2 = e; }
  t('J', 'scan illisible : erreur annoncée, aucun aliment affiché', scan === null && win.CapAI.erreur(err2).indexOf('illisible') >= 0);
  t('J', 'code inconnu : message générique qui propose la saisie manuelle', /à la main/.test(win.CapAI.erreur({ code: 'xyz' })));
  // Réponses IA non conformes : refusées ou corrigées
  const prog = T.generer(Object.assign({}, ELIAS));
  const faux = { seances: [{ cle: 'FA', exercices: [{ id: 'squat_barre', series: 5, reps: '3-5', repos: 200 }] }, { cle: 'X', exercices: [{ id: 'exercice_invente', series: 3, reps: '10', repos: 60 }] }, { cle: 'Y', exercices: [] }, { cle: 'Z', exercices: [] }] };
  const v = K.validerProgrammeIA(faux, ELIAS, prog);
  t('J', 'programme IA : exercice inventé, matériel absent et séance en trop refusés', !v.ok && v.programme === null && v.erreurs.some(e => /inconnu/.test(e)) && v.erreurs.some(e => /matériel/.test(e)) && v.erreurs.some(e => /Trop de séances/.test(e)));
  const bon = { seances: [{ cle: 'FA', jour: 1, justification: 'Débutant avec 20 h libres : corps complet au poids du corps.', exercices: [{ id: 'squat_pdc', series: 3, reps: '5-6', repos: 90 }, { id: 'pompes', series: 9, reps: '10-12', repos: 600 }] }] };
  const v2 = K.validerProgrammeIA(bon, ELIAS, prog);
  t('J', 'programme IA conforme : accepté avec corrections (mineur 8 répétitions min, séries et repos bornés)', v2.ok && v2.programme.origine === 'ia_validee' && v2.corrections.length === 3 && v2.programme.seances[0].exercices[0].reps === '8-12');
  const m = K.validerMarcheIA({ activites: [{ id: 'sites_vitrines', faits: [{ theme: 'prix', texte: 'Un site vitrine coûte 500 à 1500 €.', source: { titre: 'Étude', url: 'https://exemple.fr/etude', date: '2026-10-01' } }, { theme: 'demande', texte: 'Forte demande.' }], hypotheses: ['Tu gagneras 2000 € par mois'] }, { id: 'activite_inventee' }] });
  t('J', 'recherche IA : fait sans source reclassé en hypothèse, revenu promis et activité inventée signalés', m.activites[0].faits.length === 1 && m.activites[0].hypotheses.some(h => /non sourcé/.test(h)) && m.erreurs.some(e => /revenu prévisionnel/.test(e)) && m.erreurs.some(e => /inconnue/.test(e)));
  const qv = K.validerQuestionsIA([{ champ: 'capital', raison: 'Pour savoir quelles activités sont finançables.' }, { champ: 'couleur_preferee', raison: 'Pour personnaliser.' }, { champ: 'risque', raison: '' }], Mx.REGISTRE);
  t('J', 'questions IA : seules les questions utiles et justifiées passent', qv.questions.length === 1 && qv.refus.length === 2);
  const dm = K.demandeProgramme(ELIAS, prog, []);
  t('J', 'demande IA prête : bibliothèque filtrée sur le matériel réel', dm.bibliotheque.every(e => prog.parametres.materiel.indexOf(T.PAR_ID[e.id].mat) >= 0) && dm.contraintes.seancesMax === prog.parametres.joursRetenus);

  console.log(res.join('\n'));
  console.log('\n' + ok + ' réussis, ' + ko + ' échoués');
  process.exit(ko ? 1 : 0);
})();
