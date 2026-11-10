/* Aide de test : ouvre une vue avec la navigation à 5 destinations (anciens noms d'onglets acceptés). */
const M = { Programme: ['Corps', 'Séance'], 'Séance': ['Corps', 'Séance'], 'Progrès': ['Corps', 'Progression'], Photos: ['Corps', 'Photos'], Argent: ['Argent'], Projet: ['Projet'] };
module.exports = async function aller(pg, nom) {
  const direct = { 'Réglages': 'Profil', Profil: 'Profil', Journal: 'Journal', 'Aujourd’hui': 'Aujourd’hui', Accueil: 'Aujourd’hui' }[nom];
  if (direct) { await pg.click('.tabbar .nav-d:has-text("' + direct + '")'); await pg.waitForTimeout(250); return; }
  const [mod, sous] = M[nom];
  await pg.click('.tabbar .nav-d:has-text("Parcours")'); await pg.waitForTimeout(250);
  if (await pg.$('.segs.mods')) { await pg.click('.segs.mods button:has-text("' + mod + '")'); await pg.waitForTimeout(250); }
  if (sous) { await pg.click('.segs.sous button:has-text("' + sous + '")'); await pg.waitForTimeout(250); }
};
