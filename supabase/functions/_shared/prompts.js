/* Cap — consignes envoyées à l'IA (moteur B). Module partagé : le navigateur (capacité Claude « sample ») et la fonction
 * serveur Supabase « cap-ai » construisent exactement les mêmes consignes à partir des mêmes données structurées.
 * Copie serveur : supabase/functions/_shared/prompts.js (dev/scripts/sync-shared.sh, vérifiée par les tests). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapPrompts = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const VERSION = 'cap-prompts-1.0';
  const COMMUN = [
    'Tu es le moteur de personnalisation de l’application « Cap ». Tu écris en français, simplement, sans flatterie.',
    'Les chiffres critiques (métabolisme, calories, budget de temps, cotisations, revenus) sont calculés par Cap et fournis dans « donnees ». Tu ne les recalcules pas et tu n’en inventes pas.',
    'N’invente aucune donnée sur l’utilisateur. S’il manque une information qui changerait vraiment ta proposition, pose au plus 3 questions dans « questions », avec la raison.',
    'Ta réponse n’est ni un avis médical, ni un conseil financier ou juridique.',
    'Réponds uniquement avec un objet JSON valide, sans texte autour, sans bloc de code.'
  ];
  const J = o => JSON.stringify(o);

  function programme(demande) {
    return COMMUN.concat([
      '',
      'TÂCHE : construire un programme sportif hebdomadaire complet et individualisé.',
      'Analyse : objectifs, métabolisme et dépense estimés, niveau, temps réellement disponible, matériel, contraintes et douleurs, autre sport pratiqué, historique des séances et ressentis, tendance de poids, réponses complémentaires.',
      demande.programmePrecedent ? 'Un programme existe déjà : ADAPTE-LE aux changements listés dans « changements » au lieu de tout refaire. Garde ce qui fonctionne et explique chaque modification.' : 'Aucun programme précédent : crée-le.',
      'Règles de sécurité impératives (Cap les vérifie, une violation fait refuser ton programme) :',
      '- au plus ' + demande.contraintes.seancesMax + ' séances de renforcement par semaine, chacune d’au plus ' + demande.contraintes.minutesMax + ' minutes échauffement compris ; au moins 1 jour de repos complet ;',
      '- matériel disponible uniquement : ' + demande.contraintes.materiel.join(', ') + ' ;',
      '- aucun exercice qui sollicite fortement : ' + ((demande.contraintes.zonesExclues || []).join(', ') || 'aucune zone exclue') + (demande.contraintes.zonesExclues === null ? ' (douleur sans zone précisée : aucun saut ni impact)' : '') + ' ;',
      demande.profil.age < 18 ? '- utilisateur mineur : jamais moins de 8 répétitions, pas de charge maximale ;' : '- adulte : charges lourdes (moins de 6 répétitions) seulement si le niveau n’est pas débutant ;',
      '- les séances de l’autre sport déclaré comptent dans la récupération : place le renforcement en conséquence.',
      'Exercices : utilise de préférence la « bibliotheque » (indique son « id »). Tu peux proposer un exercice absent de la bibliothèque s’il est plus adapté : donne alors « id » null, son « pattern », le « materiel » utilisé et les « zones » articulaires fortement sollicitées (genou, dos, epaule, poignet, cheville). Il sera affiché comme « hors bibliothèque, non vérifié par Cap ».',
      'Chaque séance a une « justification » qui cite les réponses de l’utilisateur qui l’expliquent. Chaque exercice a une « raison » courte.',
      'Format exact :',
      J({ resume: 'string (3 phrases max : la logique du programme)', seances: [{ cle: 'S1', nom: 'string', jour: '0-6 (0 = dimanche)', objectif: 'string', justification: 'string', echauffement: 'string', exercices: [{ id: 'id de la bibliothèque ou null', nom: 'string', pattern: 'squat|hinge|lunge|push_h|push_inc|push_v|pull_h|pull_v|ischios|epaules_lat|bras_flex|bras_ext|mollets|core|cardio|mobilite', materiel: 'aucun|halteres|barre|machine|poulie|traction|elastique|banc', zones: ['string'], series: 'number', reps: 'ex. 8-12 ou 30-45 s ou 10 min', repos: 'secondes', consigne: 'string', alternative: 'string', raison: 'string' }] }], progression: { regle: 'string', semaines: [{ semaine: 'number', consigne: 'string' }] }, recuperation: 'string', changements: [{ raison: 'string' }], questions: [{ champ: 'variable connue ou null', id: 'identifiant court si nouvelle question', question: 'string', type: 'texte|nombre|choix', options: ['string'], raison: 'string', module: 'corps|argent|entreprise' }] }),
      '',
      'Données :',
      J(demande)
    ]).join('\n');
  }

  function business(demande, avecWeb) {
    return COMMUN.concat([
      '',
      'TÂCHE : proposer exactement 3 activités concrètes que cet utilisateur peut lancer avec SES ressources (compétences, capital, matériel, heures, âge, pays, ville si connue, tolérance au risque, aisance commerciale).',
      'Le catalogue « referenceCap » est un point de départ, pas une limite : propose d’autres activités si elles conviennent mieux. Évite les idées génériques ; sois précis sur le client, le problème et l’offre.',
      avecWeb ? 'Tu as un outil de recherche web : vérifie demande, concurrents, prix pratiqués, coûts et réglementation dans la zone de l’utilisateur. Chaque fait de « faits » doit citer une source trouvée par la recherche (titre, url, date). Ce qui n’est pas sourcé va dans « hypotheses ».'
        : 'Tu n’as PAS accès au web : ne cite aucune source et aucune URL. Tes estimations de prix, de demande et de concurrence vont dans « hypotheses » et seront affichées comme telles.',
      'Ne donne AUCUN revenu prévisionnel ni chiffre d’affaires : Cap calcule les scénarios à partir de tes paramètres (prix, heures par unité, heures de prospection par client). Ne promets rien.',
      'Respecte le droit : âge minimum, activités réglementées (diplôme, carte professionnelle), statut de commerçant interdit à un mineur non émancipé. Indique « ageMin » et « reglementation ».',
      'Le budget de départ doit tenir dans le capital indiqué ; sinon dis-le dans « risques ».',
      'Format exact :',
      J({ opportunites: [{ nom: 'string', categorie: 'web|contenu|service|commerce|autre', client: 'string', probleme: 'string', offre: 'string', pourquoiToi: 'string (cite ses réponses)', competencesUtilisees: ['string'], materiel: [{ nom: 'string', cout: 'number €', possede: 'boolean' }], coutDemarrage: 'number € hors matériel', chargesMensuelles: 'number €', coutVariableUnitaire: 'number €', unite: 'string (ce qui est vendu)', prix: { bas: 'number', median: 'number', haut: 'number' }, heuresParUnite: 'number', heuresProspectionParClient: 'number', recurrence: 'unités par client et par mois, 0 si vente ponctuelle', regime: 'vente|bic|bnc', ageMin: 'number', reglementation: 'string', concurrents: ['string'], demande: 'string', risques: ['string'], validation: 'test simple pour vérifier la demande avant d’investir', faits: [{ theme: 'demande|concurrence|prix|clients|couts|reglementation|tendance', texte: 'string', source: { titre: 'string', url: 'string', date: 'AAAA-MM-JJ' } }], hypotheses: ['string'] }], questions: [{ champ: 'string ou null', id: 'string', question: 'string', type: 'texte|nombre|choix', options: ['string'], raison: 'string', module: 'entreprise' }] }),
      '',
      'Données :',
      J(demande)
    ]).join('\n');
  }

  function questions(demande) {
    return COMMUN.concat([
      '',
      'TÂCHE : repérer les informations manquantes qui changeraient vraiment les recommandations de Cap pour les modules choisis, et poser au plus 3 questions.',
      'N’en pose aucune si rien d’important ne manque. Ne redemande jamais une information déjà présente dans « profil » ou « complements ».',
      'Pour chaque question : « champ » = une variable de « registre » si elle convient, sinon null avec un « id » court ; « raison » = ce que la réponse changera concrètement.',
      'Format exact :',
      J({ questions: [{ champ: 'string ou null', id: 'string', question: 'string', type: 'texte|nombre|choix', options: ['string'], raison: 'string', module: 'corps|argent|entreprise' }] }),
      '',
      'Données :',
      J(demande)
    ]).join('\n');
  }

  function pourquoi(demande) {
    return COMMUN.slice(0, 4).concat([
      '',
      'TÂCHE : répondre à la question de l’utilisateur en expliquant les décisions de Cap à partir de SES réponses et des calculs fournis (« decisions », « justifications », « calculs »).',
      'Cite les réponses qui ont pesé (par exemple « tu as indiqué 6 h libres »). Si une décision vient d’une règle de sécurité, dis-le. Si l’information manque, dis-le. 150 mots maximum.',
      'Format exact :',
      J({ reponse: 'string', reponsesCitees: ['string'] }),
      '',
      'Question : ' + String(demande.question || '').slice(0, 500),
      'Données :',
      J(demande.contexte)
    ]).join('\n');
  }
  function correction(prompt, erreurs) {
    return prompt + '\n\nTa réponse précédente a été refusée par les vérifications de Cap pour ces raisons :\n- ' + erreurs.join('\n- ') + '\nCorrige-la et renvoie le JSON complet.';
  }
  return { VERSION, programme, business, questions, pourquoi, correction };
});
