/* Cap — budget du projet business : calculs purs, reproductibles, testés (dev/tests/budget-tests.js).
 * Principe : le budget est une contrainte. Une dépense prévue qui dépasse ce qui reste est refusée avec la raison ;
 * une dépense réellement payée est toujours enregistrable (le réel prime), et Cap signale alors le dépassement.
 * Aucun coût n'est inventé : seuls les montants saisis et les coûts déclarés du modèle d'activité sont utilisés.
 *
 *   total          = budget de départ déclaré (profil.capital)
 *   reserve        = somme à ne pas toucher (profil.reserveProjet ; non définie = 0, signalé)
 *   mobilisable    = total − reserve
 *   confirme       = dépenses payées
 *   prevu          = dépenses prévues non encore payées
 *   recurrentMois  = dépenses récurrentes mensuelles (prévues ou payées, comptées une fois)
 *   revenus        = ventes encaissées
 *   tresorerie     = mobilisable − confirme + revenus
 *   disponible     = tresorerie − prevu (ce qui peut encore être engagé)
 *   resultat       = revenus − confirme (bénéfice avant impôt et cotisations, jamais confondu avec le chiffre d'affaires) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapBudget = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CATEGORIES = [['achat', 'Achat / stock'], ['livraison', 'Livraison'], ['commission', 'Commissions de plateforme'], ['publicite', 'Publicité'], ['outil', 'Outil / matériel'], ['abonnement', 'Abonnement'], ['retours', 'Retours / remboursements'], ['taxes', 'Taxes et cotisations'], ['formation', 'Formation'], ['autre', 'Autre']];
  const NOM_CAT = Object.fromEntries(CATEGORIES);
  const arr = v => Math.round(v * 100) / 100;
  const n = v => (typeof v === 'number' && isFinite(v) ? v : 0);

  function valider(dep) {
    const e = [];
    if (!(typeof dep.montant === 'number' && isFinite(dep.montant) && dep.montant > 0)) e.push('Montant positif obligatoire.');
    if (dep.montant > 100000) e.push('Montant trop élevé pour ce suivi (100 000 € maximum).');
    if (['prevue', 'confirmee'].indexOf(dep.statut) < 0) e.push('Statut inconnu.');
    if (!NOM_CAT[dep.categorie]) e.push('Catégorie inconnue.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dep.date || '')) e.push('Date invalide.');
    if (dep.recurrence && dep.recurrence !== 'mensuelle') e.push('Récurrence inconnue.');
    return e;
  }
  function calculer(o) {
    const total = Math.max(0, n(o.capital)), reserveDefinie = typeof o.reserve === 'number' && o.reserve >= 0;
    const reserve = reserveDefinie ? Math.min(o.reserve, total) : 0;
    const deps = (o.depenses || []).filter(d => valider(d).length === 0);
    const confirme = arr(deps.filter(d => d.statut === 'confirmee').reduce((s, d) => s + d.montant, 0));
    const prevu = arr(deps.filter(d => d.statut === 'prevue').reduce((s, d) => s + d.montant, 0));
    const recurrentMois = arr(deps.filter(d => d.recurrence === 'mensuelle' && d.statut === 'prevue').reduce((s, d) => s + d.montant, 0));
    const revenus = arr((o.ventes || []).reduce((s, v) => s + n(v.montant), 0));
    const mobilisable = arr(total - reserve), tresorerie = arr(mobilisable - confirme + revenus), disponible = arr(tresorerie - prevu);
    const parCategorie = {}; deps.forEach(d => { const k = d.categorie; parCategorie[k] = parCategorie[k] || { confirme: 0, prevu: 0 }; parCategorie[k][d.statut === 'confirmee' ? 'confirme' : 'prevu'] = arr(parCategorie[k][d.statut === 'confirmee' ? 'confirme' : 'prevu'] + d.montant); });
    const alertes = [];
    if (!reserveDefinie) alertes.push({ niveau: 'info', texte: 'Réserve non définie : tout ton budget est considéré comme mobilisable. Fixe une somme à ne pas toucher.' });
    if (tresorerie < 0) alertes.push({ niveau: 'bloquant', texte: 'Trésorerie négative de ' + arr(-tresorerie) + ' € : tes dépenses payées dépassent ton budget mobilisable et tes ventes.' });
    else if (disponible < 0) alertes.push({ niveau: 'attention', texte: 'Les dépenses prévues dépassent ce qui reste de ' + arr(-disponible) + ' € : certaines ne sont pas finançables sans modifier le plan.' });
    if (recurrentMois > 0 && tresorerie > 0 && recurrentMois * 3 > tresorerie) alertes.push({ niveau: 'attention', texte: 'Tes abonnements prévus (' + recurrentMois + ' € par mois) épuisent ta trésorerie en moins de 3 mois sans ventes.' });
    return { total, reserve, reserveDefinie, mobilisable, confirme, prevu, recurrentMois, revenus, tresorerie, disponible, resultat: arr(revenus - confirme), parCategorie, alertes, nbDepenses: deps.length, ignorees: (o.depenses || []).length - deps.length };
  }
  // Une nouvelle dépense est-elle finançable ? Le réel (« confirmee ») passe toujours, avec avertissement.
  function verifier(b, dep) {
    const err = valider(dep); if (err.length) return { ok: false, bloque: true, raison: err.join(' ') };
    const reste = dep.statut === 'confirmee' ? b.tresorerie : b.disponible;
    if (dep.montant <= reste) return { ok: true, reste: arr(reste - dep.montant) };
    const manque = arr(dep.montant - Math.max(0, reste));
    if (dep.statut === 'confirmee') return { ok: true, depasse: true, manque, raison: 'Cette dépense déjà payée dépasse ta trésorerie de ' + manque + ' €. Elle est enregistrée car elle est réelle ; ton budget passe en négatif.' };
    return { ok: false, bloque: true, manque, raison: 'Non finançable : il ne reste que ' + Math.max(0, reste) + ' € à engager' + (b.reserve ? ' (réserve de ' + b.reserve + ' € protégée)' : '') + '. Il manque ' + manque + ' €. Réduis la dépense, retire une autre dépense prévue, ou augmente ton budget de départ.' };
  }
  // Coût d'une tâche face au budget : « finançable », « non finançable » avec le manque exact
  function tacheFinancable(b, cout) {
    if (!cout) return { ok: true };
    if (cout <= b.disponible) return { ok: true };
    return { ok: false, manque: arr(cout - Math.max(0, b.disponible)) };
  }
  // Résultat mensuel réel : ventes et dépenses payées par mois (AAAA-MM)
  function parMois(depenses, ventes) {
    const m = {};
    (depenses || []).filter(d => d.statut === 'confirmee' && valider(d).length === 0).forEach(d => { const k = d.date.slice(0, 7); m[k] = m[k] || { ventes: 0, depenses: 0 }; m[k].depenses = arr(m[k].depenses + d.montant); });
    (ventes || []).forEach(v => { const k = String(v.date).slice(0, 7); m[k] = m[k] || { ventes: 0, depenses: 0 }; m[k].ventes = arr(m[k].ventes + n(v.montant)); });
    return Object.keys(m).sort().map(k => ({ mois: k, ventes: m[k].ventes, depenses: m[k].depenses, resultat: arr(m[k].ventes - m[k].depenses) }));
  }
  // Comparaison de fournisseurs : coût total réel par unité livrée, puis classement ; aucune donnée inventée
  function comparerFournisseurs(liste, quantite) {
    const q = Math.max(1, Math.round(n(quantite) || 1));
    return (liste || []).map(f => {
      const manquants = ['prixUnitaire', 'livraison'].filter(k => typeof f[k] !== 'number');
      const total = manquants.length ? null : arr(f.prixUnitaire * q + f.livraison + n(f.autresFrais));
      return Object.assign({}, f, { quantite: q, total, parUnite: total === null ? null : arr(total / q), manquants });
    }).sort((a, b) => (a.total === null) - (b.total === null) || (a.total || 0) - (b.total || 0));
  }
  return { CATEGORIES, NOM_CAT, valider, calculer, verifier, tacheFinancable, parMois, comparerFournisseurs };
});
