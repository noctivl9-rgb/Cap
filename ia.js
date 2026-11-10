/* Cap — génération par IA (moteur B) avec validation systématique (moteur C).
 * Transport interchangeable : capacité « sample » de l'artefact Claude (compte de l'utilisateur, pas de clé)
 * ou fonction serveur Supabase « cap-ai » (clé côté serveur, recherche web possible).
 * Cycle : demande structurée → réponse JSON → validation → si refus, 1 correction avec les erreurs → sinon refus honnête. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./prompts.js'), require('./contrats.js'));
  else root.CapIA = factory(root.CapPrompts, root.CapContrats);
})(typeof self !== 'undefined' ? self : this, function (P, K) {
  'use strict';
  let transport = null, nomTransport = null, estDispo = null;
  // t(tache, demande, { prompt, erreurs, essai }) → { data, modele, sources? } ; d() : le transport est-il utilisable maintenant ?
  function configurer(t, nom, d) { transport = t; nomTransport = nom || 'inconnu'; estDispo = d || null; }
  const nom = () => (typeof nomTransport === 'function' ? nomTransport() : nomTransport);
  const dispo = () => !!transport && (!estDispo || !!estDispo());
  function extraireJSON(texte) {
    const t = String(texte || '').replace(/^```(?:json)?/m, '').replace(/```\s*$/m, '');
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b <= a) { const e = new Error('invalid_json'); e.code = 'invalid_json'; throw e; }
    try { return JSON.parse(t.slice(a, b + 1)); } catch (x) { const e = new Error('invalid_json'); e.code = 'invalid_json'; throw e; }
  }
  const PROMPTS = { programme: d => P.programme(d), business: d => P.business(d, false), questions: d => P.questions(d), pourquoi: d => P.pourquoi(d) };

  async function appeler(tache, demande, valider, opts) {
    if (!dispo()) return { ok: false, indisponible: true, erreur: { code: 'ia_indisponible' }, essais: [] };
    const base = PROMPTS[tache](demande), essais = [];
    let erreurs = null, derniere = null, derniereBrute = null;
    for (let i = 0; i < 2; i++) {
      const t0 = Date.now();
      let r;
      try { r = await transport(tache, demande, { prompt: erreurs ? P.correction(base, erreurs) : base, erreurs, essai: i + 1, signal: opts && opts.signal }); }
      catch (e) { essais.push({ essai: i + 1, ms: Date.now() - t0, erreur: e && (e.code || e.message) }); return { ok: false, erreur: e, essais, transport: nom() }; }
      let v;
      try { v = valider(r.data, r.sources); } catch (e) { v = { ok: false, erreurs: ['Réponse illisible : ' + (e.message || e)] }; }
      essais.push({ essai: i + 1, ms: Date.now() - t0, modele: r.modele || null, erreurs: v.erreurs || [], corrections: v.corrections || [] });
      derniere = v; derniereBrute = r.data;
      if (v.ok) return Object.assign({ ok: true, modele: r.modele || null, essais, brut: r.data, sources: r.sources || null, transport: nom() }, v);
      erreurs = (v.erreurs || []).slice(0, 12);
    }
    return { ok: false, refuse: true, validation: derniere, essais, transport: nom(), bruteRefusee: derniereBrute };
  }

  // ctx : { prog (programme calculé par règles, contraintes), energie, physique, tendance, seances, precedent, changements, registre }
  function programme(p, ctx, opts) {
    const demande = K.demandeProgramme(p, ctx.prog, ctx.seances, ctx);
    return appeler('programme', demande, data => {
      const v = K.validerPlanIndividuel(data, p, ctx.prog, { physique: ctx.physique, changements: ctx.changements, precedent: ctx.precedent, registre: ctx.registre, questionsDejaPosees: demande.questionsDejaPosees });
      if (!v.attente) v.questions = K.validerQuestionsIA(data && data.questions, ctx.registre, p).questions.filter(q => !q.bloquante);
      return v;
    }, opts);
  }
  function business(p, ctx, opts) {
    const demande = K.demandeMarche(p, ctx.reco);
    return appeler('business', demande, (data, sources) => {
      const v = K.validerBusinessIA(data, p, sources || null, { registre: ctx.registre });
      if (!v.attente) v.questions = K.validerQuestionsIA(data && data.questions, ctx.registre, p).questions;
      return v;
    }, opts);
  }
  function questions(p, ctx, opts) {
    const demande = K.demandeQuestions(p, ctx.registre, ctx.manquantes);
    return appeler('questions', demande, data => { const q = K.validerQuestionsIA(data && data.questions, ctx.registre, p); return { ok: true, questions: q.questions, refus: q.refus }; }, opts);
  }
  function pourquoi(question, contexte, opts) {
    return appeler('pourquoi', { question, contexte }, data => K.validerPourquoi(data), opts);
  }
  return { configurer, dispo, transportNom: () => (typeof nomTransport === 'function' ? nomTransport() : nomTransport), extraireJSON, appeler, programme, business, questions, pourquoi };
});
