/* Cap Finances — opérations réelles saisies à la main (aucune connexion bancaire). Calculs purs et reproductibles.
 * operation = { date: 'AAAA-MM-JJ', sens: 'depense'|'revenu', montant > 0, categorie, note? } */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapFinances = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CATEGORIES = [['logement', 'Logement'], ['alimentation', 'Courses et repas'], ['transport', 'Transport'], ['abonnements', 'Abonnements'], ['loisirs', 'Loisirs et sorties'], ['shopping', 'Vêtements et achats'], ['sante', 'Santé'], ['etudes', 'Études'], ['cadeaux', 'Cadeaux'], ['autre', 'Autre']];
  const REVENUS = [['salaire', 'Salaire ou job'], ['aide', 'Aide ou argent de poche'], ['vente', 'Vente'], ['autre_revenu', 'Autre revenu']];
  const NOM = Object.fromEntries(CATEGORIES.concat(REVENUS));
  const arr = v => Math.round(v * 100) / 100;
  function valider(o) {
    const e = [];
    if (!(typeof o.montant === 'number' && isFinite(o.montant) && o.montant > 0 && o.montant <= 1e6)) e.push('Montant positif obligatoire.');
    if (['depense', 'revenu'].indexOf(o.sens) < 0) e.push('Sens inconnu.');
    if (!NOM[o.categorie]) e.push('Catégorie inconnue.');
    if (o.sens === 'depense' && !CATEGORIES.some(c => c[0] === o.categorie)) e.push('Catégorie de dépense attendue.');
    if (o.sens === 'revenu' && !REVENUS.some(c => c[0] === o.categorie)) e.push('Catégorie de revenu attendue.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date || '')) e.push('Date invalide.');
    return e;
  }
  // Bilan d'un mois (AAAA-MM) : réel saisi, comparé au budget déclaré (dépenses fixes + variables)
  function mois(ops, m, budgetDeclare) {
    const l = (ops || []).filter(o => valider(o).length === 0 && o.date.slice(0, 7) === m);
    const dep = l.filter(o => o.sens === 'depense'), rev = l.filter(o => o.sens === 'revenu');
    const parCat = {}; dep.forEach(o => { parCat[o.categorie] = arr((parCat[o.categorie] || 0) + o.montant); });
    const classement = Object.keys(parCat).map(k => ({ categorie: k, nom: NOM[k], montant: parCat[k] })).sort((a, b) => b.montant - a.montant);
    const depenses = arr(dep.reduce((s, o) => s + o.montant, 0)), revenus = arr(rev.reduce((s, o) => s + o.montant, 0));
    const r = { mois: m, nb: l.length, depenses, revenus, solde: arr(revenus - depenses), classement, top: classement[0] || null, alertes: [] };
    if (typeof budgetDeclare === 'number' && budgetDeclare > 0) {
      r.budget = budgetDeclare; r.ecartBudget = arr(budgetDeclare - depenses);
      if (depenses > budgetDeclare) r.alertes.push('Dépenses saisies supérieures de ' + arr(depenses - budgetDeclare) + ' € au budget mensuel déclaré.');
    }
    if (revenus > 0 && depenses > revenus) r.alertes.push('Ce mois-ci, tu as dépensé plus que tes revenus saisis (' + arr(depenses - revenus) + ' € de plus).');
    return r;
  }
  function historique(ops, n) {
    const ms = Array.from(new Set((ops || []).filter(o => valider(o).length === 0).map(o => o.date.slice(0, 7)))).sort().reverse().slice(0, n || 12);
    return ms.map(m => mois(ops, m));
  }
  return { CATEGORIES, REVENUS, NOM, valider, mois, historique };
});
