/* Cap — services IA (reconnaissance de repas, coach).
 * L'IA identifie et estime ; tous les totaux sont recalculés par CapEngine. Aucun chiffre de l'IA
 * n'est affiché sans passer par la validation (CapEngine.validerScan).
 * Deux chemins : dans Claude, la capacité « sample » ; ailleurs, la fonction serveur Supabase « cap-ai »
 * (clé IA côté serveur, consignes fixées côté serveur, quotas par jour). */
(function () {
  'use strict';
  const E = window.CapEngine, F = window.CapFoods;
  let sample = null, limits = null;
  const serveur = () => !!(window.CapCloud && window.CapCloud.iaActivee() && window.CapCloud.connecte());
  const enBase64 = blob => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = () => ko(new Error('image')); r.readAsDataURL(blob); });
  const A = {
    async init() {
      if (!window.claude || !window.claude.use) return;
      try { sample = await window.claude.use('sample'); } catch (e) { sample = null; }
      if (sample) { try { limits = await sample.limits(); } catch (e) { limits = null; } }
    },
    // Transport de génération pour CapIA : Claude (capacité sample) en priorité, sinon la fonction serveur.
    branchement() {
      if (!window.CapIA) return;
      window.CapIA.configurer(async (tache, demande, o) => {
        if (sample) {
          const r = await sample(o.prompt, { modelTier: 'default', cache: false, signal: o.signal });
          if (r.truncated) { const e = new Error('truncated'); e.code = 'truncated'; throw e; }
          return { data: window.CapIA.extraireJSON(r.text), modele: r.modelApplied || r.modelTierApplied || 'Claude' };
        }
        if (serveur()) {
          const r = await window.CapCloud.ia({ type: 'generation', tache, demande, erreurs: o.erreurs || null });
          return { data: r.data, modele: r.modele || null, sources: r.sources || null };
        }
        const e = new Error('ia_indisponible'); e.code = 'ia_indisponible'; throw e;
      }, () => (sample ? 'claude' : 'serveur'), () => !!sample || serveur());
    },
    photoDispo() { return !!(sample && limits && limits.images) || serveur(); },
    texteDispo() { return !!sample || serveur(); },
    // Réduit la photo (1 280 px max, JPEG) : moins de données envoyées, même précision utile
    async preparer(file) {
      const types = (limits && limits.images && limits.images.mediaTypes) || ['image/jpeg', 'image/png', 'image/webp'];
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('image')); i.src = url; });
        const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const type = types.indexOf('image/jpeg') >= 0 ? 'image/jpeg' : types[0];
        const blob = await new Promise(ok => c.toBlob(ok, type, 0.85));
        return { blob, apercu: c.toDataURL('image/jpeg', 0.6) };
      } finally { URL.revokeObjectURL(url); }
    },
    async analyserRepas(blob, signal) {
      const noms = F.BASE.map(a => a.n).join(' ; ');
      const prompt = [
        'Tu analyses la photo d’un repas pour un journal alimentaire personnel.',
        'Identifie chaque aliment VISIBLE et estime sa quantité en grammes (une photo ne permet qu’une estimation : sois prudent, n’invente pas d’aliment caché).',
        'Si un aliment correspond à un nom de cette liste, reprends ce nom EXACTEMENT : ' + noms + '.',
        'Pour chaque aliment, donne ses valeurs moyennes pour 100 g (aliment tel que servi).',
        'preparation : "aucune" (cru, vapeur, à l’eau), "poele" (sauté avec matière grasse) ou "frit".',
        'confiance : "haute", "moyenne" ou "faible" sur l’identification ET la quantité.',
        'remarque : une phrase sur les incertitudes (sauce, huile, portion cachée). Si la photo ne montre pas de nourriture, renvoie une liste vide et explique-le.',
        'Réponds uniquement avec ce JSON : {"aliments":[{"nom":string,"grammes":number,"preparation":string,"confiance":string,"kcal_100g":number,"proteines_100g":number,"glucides_100g":number,"lipides_100g":number}],"remarque":string}'
      ].join('\n');
      if (!sample && serveur()) {
        const image = await enBase64(blob);
        const rep = await window.CapCloud.ia({ type: 'scan', image, media_type: blob.type || 'image/jpeg', noms: F.BASE.map(a => a.n) });
        if (signal && signal.aborted) { const e = new Error('cancelled'); e.code = 'cancelled'; throw e; }
        return E.validerScan(rep);
      }
      const rep = await sample.json(prompt, { images: [blob], signal });
      return E.validerScan(rep);
    },
    async coach(question, historique, contexte, opts) {
      const regles = [
        'Tu es le coach de l’application personnelle « Cap ». Réponds en français, simplement, en 120 mots maximum, avec une action concrète à la fin si c’est utile.',
        'Règles strictes :',
        '1. Tous les chiffres viennent du contexte ci-dessous, calculé par des formules vérifiées. N’invente AUCUN chiffre (calories, poids, revenus, délais, progrès). S’il manque une donnée, dis : « Je ne dispose pas de suffisamment d’informations pour établir une estimation fiable. »',
        '2. Les projections sont des estimations, jamais des promesses. Ne présente pas un revenu futur comme acquis.',
        '3. Tu n’es ni médecin ni conseiller financier agréé : pour un problème de santé, une douleur, un trouble alimentaire ou une dette, oriente vers un professionnel.',
        '4. Aucun régime extrême, aucune promesse d’enrichissement rapide, aucun conseil de trading ou de placement risqué.',
        '5. Si l’utilisateur est mineur (âge dans le contexte), adapte tes conseils : croissance, droit du travail, accord des parents.',
        'Contexte (données que l’utilisateur a choisi de partager) :',
        JSON.stringify(contexte)
      ].join('\n');
      if (!sample && serveur()) {
        const rep = await window.CapCloud.ia({ type: 'coach', question, historique: historique.slice(-10), contexte });
        const text = String((rep && rep.text) || '');
        if (opts.onText) opts.onText({ text, delta: text });
        return { text, truncated: false };
      }
      const turns = [{ role: 'user', content: regles }, { role: 'assistant', content: 'Compris. Je m’appuie uniquement sur ce contexte.' }].concat(historique, [{ role: 'user', content: question }]);
      return sample(turns, { cache: false, onText: opts.onText, signal: opts.signal });
    },
    // Outils disponibles ? (capacité sample avec « tools », dans l'appli Claude seulement)
    outilsDispo() { return !!(sample && limits && limits.tools); },
    // Coach avec outils : l'IA lit les données via les fonctions de coach.js (consentements appliqués dans chaque outil)
    async coachOutils(question, historique, T, opts) {
      opts = opts || {};
      const tools = Object.keys(T).map(nom => ({ name: nom, description: T[nom].description, inputSchema: T[nom].schema || { type: 'object', properties: {} },
        execute: async input => { if (opts.onOutil) opts.onOutil(nom); return T[nom].run(input || {}); } }));
      const regles = ['Tu es le coach de l’application Cap. Réponds en français, en 2 à 6 phrases, avec des actions concrètes.',
        'Règles absolues :',
        '1. Utilise les outils pour lire les données. N’invente AUCUN chiffre, aucune donnée absente, aucune source : si un outil renvoie « refus » ou « erreur », dis-le simplement et explique comment l’autoriser ou compléter.',
        '2. Les calculs viennent des outils (Cap) ; tu les expliques, tu ne les recalcules pas autrement.',
        '3. Pour modifier un plan, utilise proposePlanAdjustment : rien n’est modifié sans l’accord de l’utilisateur. Dis-lui qu’une proposition l’attend.',
        '4. Business : jamais de promesse de revenus ; ne conseille pas de dépenser davantage quand des dépenses n’ont rien rapporté ; identifie les informations manquantes.',
        '5. Santé : douleur vive, thoracique, malaise ou trouble alimentaire → orienter vers un professionnel. Tu n’es ni médecin ni conseiller financier.',
        '6. Sources : uniquement celles de searchVerifiedSources, avec leur date.'].join('\n');
      const turns = [{ role: 'user', content: regles }, { role: 'assistant', content: 'Compris.' }].concat(historique.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })), [{ role: 'user', content: question }]);
      // Tours alternés obligatoires : on fusionne deux messages consécutifs du même rôle
      const fus = []; turns.forEach(t => { if (fus.length && fus[fus.length - 1].role === t.role) fus[fus.length - 1].content += '\n' + t.content; else fus.push(Object.assign({}, t)); });
      return sample(fus, { tools, onText: opts.onText, signal: opts.signal, modelTier: 'default' });
    },
    erreur(e) {
      const c = e && e.code;
      return ({
        not_granted: 'Accès à Claude refusé. Tu peux l’autoriser à la prochaine demande.',
        rate_limited: 'Trop de demandes d’un coup. Réessaie dans une minute.',
        cancelled: 'Analyse arrêtée.',
        images_unavailable: 'L’analyse photo n’est pas disponible ici.',
        image_rejected: 'Photo refusée (format ou taille). Essaie une autre photo.',
        tools_unavailable: 'Le coach avec accès aux données n’est pas disponible ici.',
        invalid_request: 'Demande refusée par le service. Réessaie.',
        invalid_json: 'Réponse illisible. Réessaie ou ajoute les aliments à la main.',
        quota_atteint: 'Limite du jour atteinte pour l’IA. Elle revient demain ; en attendant, ajoute à la main.',
        non_connecte: 'Connecte ton compte Cap (Réglages) pour utiliser l’IA.',
        ia_indisponible: 'L’IA n’est pas activée sur cette version.',
        ia_non_configuree: 'L’IA du serveur n’a pas encore de clé. Elle doit être ajoutée dans Supabase.',
        image_trop_lourde: 'Photo trop lourde. Essaie une autre photo.',
        truncated: 'Réponse de l’IA coupée avant la fin. Réessaie.',
        ia_echec: 'Le service IA a renvoyé une erreur. Rien n’a été modifié ; réessaie plus tard.'
      })[c] || 'L’analyse a échoué. Réessaie ou ajoute les aliments à la main.';
    }
  };
  window.CapAI = A;
})();
