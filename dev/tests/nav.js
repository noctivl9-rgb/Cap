/* Aide de test : ouvre une vue (Aujourd'hui · Corps · ＋ · Avenir · Profil). Anciens noms d'onglets acceptés. */
const M = { Programme: ['Corps', 'Programme'], 'Séance': ['Corps', 'Programme'], Journal: ['Corps', 'Journal'], 'Progrès': ['Corps', 'Évolution', 'Mesures'], Mesures: ['Corps', 'Évolution', 'Mesures'], Photos: ['Corps', 'Évolution', 'Photos'], Argent: ['Avenir', 'Finances'], Finances: ['Avenir', 'Finances'], Projet: ['Avenir', 'Business'], Business: ['Avenir', 'Business'] };
// Les sections secondaires sont regroupées sous « Plus de détails » : les tests les ouvrent après chaque navigation.
async function ouvrirPlus(pg) { await pg.evaluate(() => document.querySelectorAll('main details.plus').forEach(x => { x.open = true; })); }
module.exports = async function aller(pg, nom) { await allerSeul(pg, nom); await ouvrirPlus(pg); };
module.exports.ouvrirPlus = ouvrirPlus;
module.exports.seul = (pg, nom) => allerSeul(pg, nom);
async function allerSeul(pg, nom) {
  const direct = { 'Réglages': 'Profil', Profil: 'Profil', 'Aujourd’hui': 'Aujourd’hui', Accueil: 'Aujourd’hui' }[nom];
  if (direct) { await pg.click('.tabbar .nav-d:has-text("' + direct + '")'); await pg.waitForTimeout(250); return; }
  const [tab, sous, evo] = M[nom];
  await pg.click('.tabbar .nav-d:has-text("' + tab + '")'); await pg.waitForTimeout(250);
  const seg = await pg.$('.segs.sous button:has-text("' + sous + '"), .segs.mods button:has-text("' + sous + '")');
  if (seg) { await seg.click(); await pg.waitForTimeout(250); }
  if (evo) { await pg.click('.segs.evo button:has-text("' + evo + '")'); await pg.waitForTimeout(250); }
}
