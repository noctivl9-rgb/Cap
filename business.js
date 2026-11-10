/* Cap — moteur entrepreneurial (règles déterministes, AUCUNE IA).
 * 1. Filtre un catalogue de modèles d'activité selon l'âge, la réglementation, le capital, le matériel et le temps.
 * 2. Classe les modèles compatibles avec un score décomposé et expliqué.
 * 3. Calcule pour le modèle choisi un plan financier sur 12 mois (3 scénarios) et un plan d'action 30/60/90 jours.
 * Les paramètres du catalogue (prix, heures, conversion) sont des HYPOTHÈSES de départ, affichées comme telles :
 * une recherche de marché sourcée (IA + web) est nécessaire pour les confirmer. Aucun revenu n'est promis. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapBusiness = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const VERSION = 'cap-business-1.0';
  const has = v => v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && !isFinite(v));
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
  const r0 = v => Math.round(v), r2 = v => Math.round(v * 100) / 100;
  const SEM_PAR_MOIS = 4.33;

  // Taux globaux micro-entrepreneur 2026 (cotisations sociales) + formation professionnelle (CFP).
  // Source : Weblex, « Tableau des cotisations sociales dues par les micro-entrepreneurs – Année 2026 », consulté le 10/11/2026.
  const REGIMES = {
    vente: { taux: 0.123, cfp: 0.001, nom: 'Vente de marchandises (BIC)' },
    bic: { taux: 0.212, cfp: 0.003, nom: 'Prestations de services commerciales ou artisanales (BIC)' },
    bnc: { taux: 0.256, cfp: 0.002, nom: 'Prestations de services libérales (BNC, hors Cipav)' }
  };
  const SOURCE_TAUX = 'Weblex, taux micro-entrepreneur 2026 (décret n° 2025-943), consulté le 10/11/2026';
  const MATERIEL = { ordinateur: ['Ordinateur', 500], smartphone: ['Smartphone récent', 250], appareil_photo: ['Appareil photo + objectif', 700], voiture: ['Voiture', null], kit_lavage: ['Kit de lavage sans eau', 180], outils: ['Outillage de base', 250], micro: ['Micro et éclairage', 120] };
  const COMPETENCES = { code: 'Code', design: 'Design', video: 'Vidéo', vente: 'Vente', ecriture: 'Écriture', langues: 'Langues', photo: 'Photo', sport: 'Sport', cours: 'Matières scolaires', bricolage: 'Bricolage', reseaux: 'Réseaux sociaux' };

  // m : un modèle. prix : [bas, médian, haut] par unité. hU : heures de production par unité. hC : heures de prospection
  // par nouveau client (scénario médian). rec : unités par client et par mois (0 = vente ponctuelle). uC : unités par client ponctuel.
  const M = (o) => Object.assign({ format: 'mixte', regime: 'bnc', ageMin: 16, couts: 0, capital: 0, mat: [], rec: 0, uC: 1, cVar: 0, demande: 2, risque: 2, difficulte: 2, vente: 2, hMin: 4, delaiSem: 4, diplome: null, comp: {}, requis: [] }, o);
  const CATALOGUE = [
    M({ id: 'sites_vitrines', nom: 'Sites vitrines pour commerces locaux', cat: 'web', format: 'mixte', client: 'Commerces et artisans sans site ou avec un site daté (restaurants, coiffeurs, garages)', probleme: 'Ils sont peu visibles sur Google et perdent des clients au profit de concurrents en ligne.', offre: 'Site d’une à cinq pages, fiche Google à jour, livré en 2 semaines.', comp: { code: 1, design: 0.5, vente: 0.3 }, requis: ['code', 'design'], mat: ['ordinateur'], capital: 30, couts: 15, prix: [300, 600, 1200], unite: 'site', hU: 18, hC: 12, demande: 3, risque: 1, difficulte: 2, vente: 2, hMin: 5, delaiSem: 4, validation: 'Montrer une maquette gratuite à 10 commerçants : au moins 2 demandes de devis.' }),
    M({ id: 'maintenance_web', nom: 'Maintenance et mises à jour de sites', cat: 'web', format: 'en_ligne', client: 'Petites entreprises qui ont déjà un site WordPress ou Wix', probleme: 'Site jamais mis à jour, failles de sécurité, horaires et prix faux.', offre: 'Abonnement mensuel : mises à jour, sauvegardes, 1 h de modifications.', comp: { code: 1, vente: 0.3 }, requis: ['code'], mat: ['ordinateur'], capital: 20, couts: 10, prix: [30, 50, 90], unite: 'abonnement mensuel', hU: 1.5, hC: 12, rec: 1, demande: 2, risque: 1, difficulte: 2, vente: 2, hMin: 3, delaiSem: 6, validation: 'Repérer 20 sites avec des erreurs visibles, proposer un audit gratuit : 2 abonnés.' }),
    M({ id: 'automatisation', nom: 'Automatisations pour petites entreprises', cat: 'web', format: 'en_ligne', client: 'Indépendants et TPE qui recopient des données à la main (devis, factures, réservations)', probleme: 'Des heures perdues chaque semaine en tâches répétitives.', offre: 'Une automatisation livrée clés en main (formulaires, tableurs, e-mails), forfait.', comp: { code: 1, vente: 0.4 }, requis: ['code'], mat: ['ordinateur'], capital: 0, couts: 20, prix: [150, 350, 800], unite: 'automatisation', hU: 8, hC: 14, demande: 2, risque: 2, difficulte: 3, vente: 3, hMin: 5, delaiSem: 6, validation: 'Interroger 10 indépendants sur leurs tâches répétitives : 3 problèmes identiques = offre.' }),
    M({ id: 'appli_saas', nom: 'Mini-application payante (SaaS)', cat: 'web', format: 'en_ligne', client: 'Une niche précise que tu connais (élèves, clubs de sport, créateurs)', probleme: 'Un besoin répété que les outils actuels gèrent mal.', offre: 'Abonnement mensuel à une petite application.', comp: { code: 1, design: 0.4, reseaux: 0.3 }, requis: ['code'], mat: ['ordinateur'], capital: 50, couts: 25, prix: [3, 6, 12], unite: 'abonné par mois', hU: 0.1, hC: 1.5, rec: 1, demande: 2, risque: 3, difficulte: 3, vente: 2, hMin: 8, delaiSem: 16, validation: 'Page d’attente + 50 inscrits avant de coder la version complète.' }),
    M({ id: 'montage_video', nom: 'Montage vidéo pour créateurs', cat: 'contenu', format: 'en_ligne', client: 'Créateurs YouTube et TikTok de 5 000 à 100 000 abonnés', probleme: 'Le montage leur prend plus de temps que le tournage.', offre: 'Montage de vidéos courtes ou longues, livré en 48 h.', comp: { video: 1, reseaux: 0.4 }, requis: ['video'], mat: ['ordinateur'], capital: 0, couts: 25, prix: [20, 45, 100], unite: 'vidéo', hU: 3, hC: 4, rec: 4, demande: 3, risque: 2, difficulte: 2, vente: 2, hMin: 4, delaiSem: 3, validation: 'Remonter gratuitement un extrait pour 10 créateurs : 2 réponses positives.' }),
    M({ id: 'design', nom: 'Logos et visuels pour petites marques', cat: 'contenu', format: 'en_ligne', client: 'Nouvelles marques, associations, commerces', probleme: 'Identité visuelle faite maison, peu professionnelle.', offre: 'Logo + 5 visuels pour les réseaux.', comp: { design: 1, vente: 0.3 }, requis: ['design'], mat: ['ordinateur'], capital: 0, couts: 12, prix: [60, 150, 400], unite: 'projet', hU: 6, hC: 6, demande: 2, risque: 2, difficulte: 2, vente: 2, hMin: 3, delaiSem: 3, validation: 'Portfolio de 3 projets fictifs puis 15 messages : 1 commande.' }),
    M({ id: 'reseaux_sociaux', nom: 'Gestion des réseaux sociaux de commerces', cat: 'contenu', format: 'local', client: 'Restaurants, salles de sport, boutiques du quartier', probleme: 'Comptes Instagram abandonnés faute de temps.', offre: '8 publications par mois, photos sur place comprises.', comp: { reseaux: 1, design: 0.4, photo: 0.4, vente: 0.3 }, requis: ['reseaux'], mat: ['smartphone'], capital: 0, couts: 10, prix: [120, 250, 450], unite: 'abonnement mensuel', hU: 8, hC: 10, rec: 1, demande: 3, risque: 2, difficulte: 2, vente: 3, hMin: 4, delaiSem: 4, validation: 'Proposer un mois d’essai à 50 % à 10 commerces : 1 accepte.' }),
    M({ id: 'cours', nom: 'Cours particuliers et aide aux devoirs', cat: 'service', format: 'mixte', client: 'Parents d’élèves de primaire et de collège', probleme: 'Les élèves décrochent dans une matière et les parents cherchent un tuteur proche et abordable.', offre: 'Séances d’une heure, à domicile ou en visio.', comp: { cours: 1, langues: 0.4 }, requis: ['cours', 'langues'], mat: [], capital: 0, couts: 0, prix: [12, 18, 25], unite: 'heure de cours', hU: 1.2, hC: 3, rec: 4, demande: 3, risque: 1, difficulte: 1, vente: 1, hMin: 2, delaiSem: 2, validation: 'Annonce dans 3 groupes de parents du quartier : 2 demandes en 2 semaines.' }),
    M({ id: 'aide_numerique', nom: 'Aide informatique à domicile', cat: 'service', format: 'local', client: 'Personnes âgées et familles du quartier', probleme: 'Téléphone, ordinateur, comptes en ligne : besoin d’aide patiente et proche.', offre: 'Interventions d’une heure : réglages, apprentissage, sécurité.', comp: { code: 0.6, vente: 0.3 }, requis: [], mat: ['smartphone'], capital: 20, couts: 5, prix: [15, 20, 30], unite: 'heure', hU: 1.3, hC: 3, rec: 1, demande: 3, risque: 1, difficulte: 1, vente: 2, hMin: 2, delaiSem: 2, validation: 'Affiche chez 5 commerçants et à la mairie : 3 appels.' }),
    M({ id: 'lavage_auto', nom: 'Lavage de voitures sans eau à domicile', cat: 'service', format: 'local', regime: 'bic', client: 'Particuliers pressés et petites flottes (artisans, agences)', probleme: 'Pas le temps d’aller au lavage.', offre: 'Lavage extérieur et intérieur sur le parking du client.', comp: { vente: 0.5 }, requis: [], mat: ['kit_lavage'], capital: 30, couts: 15, cVar: 4, prix: [20, 35, 55], unite: 'lavage', hU: 1.4, hC: 2, rec: 0.5, demande: 2, risque: 2, difficulte: 1, vente: 3, hMin: 4, delaiSem: 2, validation: 'Flyers dans 2 résidences : 5 réservations le premier mois.' }),
    M({ id: 'photo', nom: 'Photographe pour particuliers et commerces', cat: 'contenu', format: 'local', client: 'Familles, sportifs, commerces (photos de produits)', probleme: 'Besoin de belles photos sans payer un studio.', offre: 'Séance de 1 h + 20 photos retouchées.', comp: { photo: 1, design: 0.3, vente: 0.3 }, requis: ['photo'], mat: ['appareil_photo', 'ordinateur'], capital: 0, couts: 15, prix: [60, 120, 250], unite: 'séance', hU: 4, hC: 5, demande: 2, risque: 2, difficulte: 2, vente: 2, hMin: 3, delaiSem: 3, validation: '3 séances gratuites contre avis et portfolio, puis 15 contacts : 1 réservation.' }),
    M({ id: 'redaction', nom: 'Rédaction web et traduction', cat: 'contenu', format: 'en_ligne', client: 'Sites, blogs et commerces en ligne', probleme: 'Besoin de textes réguliers pour être trouvés sur Google.', offre: 'Articles de 800 mots optimisés, ou traduction.', comp: { ecriture: 1, langues: 0.5 }, requis: ['ecriture', 'langues'], mat: ['ordinateur'], capital: 0, couts: 0, prix: [25, 50, 100], unite: 'article', hU: 2.5, hC: 5, rec: 2, demande: 2, risque: 2, difficulte: 2, vente: 2, hMin: 3, delaiSem: 3, validation: '3 articles exemples, 20 propositions : 1 commande.' }),
    M({ id: 'revente', nom: 'Achat-revente d’objets d’occasion', cat: 'commerce', format: 'en_ligne', regime: 'vente', ageMin: 18, client: 'Acheteurs sur les plateformes d’occasion', probleme: 'Objets sous-évalués en brocante, recherchés en ligne.', offre: 'Revente d’une catégorie précise (sneakers, consoles, livres).', comp: { vente: 0.6, photo: 0.3 }, requis: [], mat: ['smartphone'], capital: 200, couts: 5, cVar: 25, prix: [30, 45, 70], unite: 'objet vendu', hU: 1, hC: 0.5, demande: 2, risque: 3, difficulte: 2, vente: 2, hMin: 3, delaiSem: 2, validation: 'Revendre 5 objets avec au moins 40 % de marge avant d’en acheter plus.', reglementation: 'Achat pour revente = activité commerciale : impossible pour un mineur non émancipé.' }),
    M({ id: 'coach_sportif', nom: 'Coaching sportif rémunéré', cat: 'service', format: 'local', diplome: 'BPJEPS ou équivalent', ageMin: 18, client: 'Adultes débutants', probleme: 'Besoin d’un accompagnement pour reprendre le sport.', offre: 'Séances individuelles.', comp: { sport: 1, vente: 0.4 }, requis: ['sport'], mat: [], capital: 0, couts: 20, prix: [25, 40, 60], unite: 'séance', hU: 1.2, hC: 4, rec: 4, demande: 2, risque: 2, difficulte: 2, vente: 3, hMin: 3, delaiSem: 4, validation: '—', reglementation: 'Encadrer une activité sportive contre rémunération exige une carte professionnelle (Code du sport, art. L212-1).' }),
    M({ id: 'bricolage', nom: 'Petits travaux et montage de meubles', cat: 'service', format: 'local', regime: 'bic', client: 'Particuliers, personnes âgées, étudiants qui emménagent', probleme: 'Petits travaux trop petits pour un artisan.', offre: 'Montage de meubles, fixations, petites réparations à l’heure.', comp: { bricolage: 1, vente: 0.3 }, requis: ['bricolage'], mat: ['outils'], capital: 20, couts: 10, prix: [20, 28, 40], unite: 'heure', hU: 1.3, hC: 2.5, rec: 0.5, demande: 3, risque: 2, difficulte: 2, vente: 2, hMin: 4, delaiSem: 2, validation: 'Annonce sur 2 plateformes locales : 3 demandes en 3 semaines.' })
  ];
  const PAR_ID = {}; CATALOGUE.forEach(m => { PAR_ID[m.id] = m; });

  // Pondérations du classement (somme = 1). Documentées dans BUSINESS_RECOMMENDATION_ENGINE.md.
  const POIDS = { competences: 0.22, potentiel: 0.15, temps: 0.12, budget: 0.12, demande: 0.10, risque: 0.08, difficulte: 0.08, vente: 0.06, couts: 0.04, format: 0.03 };
  const LIB_CRITERES = { competences: 'compétences', potentiel: 'potentiel économique estimé', temps: 'temps disponible', budget: 'budget', demande: 'demande supposée', risque: 'risque', difficulte: 'difficulté', vente: 'effort commercial', couts: 'charges mensuelles', format: 'format préféré' };
  const clamp = v => Math.max(0, Math.min(1, v));

  // Questions indispensables avant toute recommandation (pas de valeur inventée)
  function manquants(p) {
    const out = [];
    const q = (champ, raison) => out.push({ champ, raison });
    if (!has(p.age)) q('age', 'L’âge décide des statuts possibles (micro-entreprise dès 16 ans, achat-revente à 18 ans).');
    if (!(p.competences || []).length) q('competences', 'Sans tes compétences, Cap ne peut pas savoir quelle activité tu peux livrer.');
    if (!has(p.capital)) q('capital', 'Le capital décide quelles activités sont finançables.');
    if (!has(p.heuresProjet)) q('heuresProjet', 'Le temps disponible décide du calendrier et du revenu possible.');
    if (!Array.isArray(p.materielPro)) q('materielPro', 'Le matériel que tu as déjà réduit le budget de départ.');
    return out;
  }

  function evaluer(m, p) {
    const age = num(p.age) || 0, capital = num(p.capital) || 0, heures = num(p.heuresProjet) || 0;
    const comps = (p.competences || []).filter(c => c !== 'aucune');
    const matUser = (p.materielPro || []).filter(x => x !== 'aucun');
    const manque = m.mat.filter(x => matUser.indexOf(x) < 0);
    const coutMat = manque.reduce((s, x) => s + (MATERIEL[x][1] || 0), 0);
    const budget = m.capital + coutMat + m.couts * 2; // démarrage + 2 mois de charges
    const r = { id: m.id, nom: m.nom, cat: m.cat, statut: 'compatible', raisons: [], budget, materielManquant: manque.map(x => MATERIEL[x][0]), coutMateriel: coutMat };
    if (age < m.ageMin) {
      if (m.ageMin === 16 && age >= 13) { r.preparation = true; r.raisons.push('Déclaration possible à partir de 16 ans : à préparer d’ici là, sans facturer.'); }
      else { r.statut = 'rejete'; r.raisons.push(m.reglementation || ('Âge minimum ' + m.ageMin + ' ans pour exercer cette activité en micro-entreprise.')); }
    }
    if (m.diplome) { r.statut = 'rejete'; r.raisons.push(m.reglementation || ('Diplôme requis : ' + m.diplome + '.')); }
    if (budget > capital) { if (r.statut === 'compatible') r.statut = 'non_financable'; r.raisons.push('Budget de départ ' + budget + ' € (' + (coutMat ? 'dont matériel ' + coutMat + ' €, ' : '') + '2 mois de charges compris) pour un capital de ' + capital + ' €. Il manque ' + (budget - capital) + ' €.'); }
    if (heures < m.hMin) { if (r.statut === 'compatible') r.statut = 'rejete'; r.raisons.push('Au moins ' + m.hMin + ' h par semaine nécessaires, tu en as ' + heures + '.'); }
    // Scores
    const totalPoids = Object.keys(m.comp).reduce((s, k) => s + m.comp[k], 0) || 1;
    const acquis = Object.keys(m.comp).reduce((s, k) => s + (comps.indexOf(k) >= 0 ? m.comp[k] : 0), 0);
    const requisOk = !m.requis.length || m.requis.some(c => comps.indexOf(c) >= 0);
    const sc = {};
    sc.competences = requisOk ? clamp(0.4 + 0.6 * acquis / totalPoids) : 0.1;
    if (!requisOk) r.aApprendre = m.requis.map(c => COMPETENCES[c]).join(' ou ');
    sc.budget = budget === 0 ? 1 : clamp(0.5 + (capital - budget) / (2 * Math.max(budget, 100)));
    sc.temps = clamp(heures / (m.hMin * 2));
    sc.demande = m.demande / 3;
    const tol = { faible: 1, moyen: 2, eleve: 3 }[p.risque] || 2;
    sc.risque = 1 - Math.abs(m.risque - tol) / 2;
    sc.couts = 1 - Math.min(1, m.couts / 100);
    const exp = { aucune: 0, projets: 1, clients: 2 }[p.experience]; const e = has(exp) ? exp : 0;
    sc.difficulte = 1 - Math.max(0, (m.difficulte - 1) - e) / 2;
    const aisance = num(p.aisanceVente) || 2;
    sc.vente = 1 - Math.max(0, m.vente - aisance) / 2;
    sc.format = !has(p.formatPref) || p.formatPref === 'les_deux' || m.format === 'mixte' || m.format === p.formatPref ? 1 : 0.4;
    const fin = projection(m, p, []);
    const net6 = fin.scenarios.median.mois[5].net;
    sc.potentiel = clamp(net6 / Math.max(num(p.revenuVise) || 400, 100));
    let total = 0; Object.keys(POIDS).forEach(k => { total += POIDS[k] * sc[k]; });
    r.scores = sc; r.score = Math.round(total * 100);
    r.net6 = net6;
    const tri = Object.keys(POIDS).map(k => ({ k, contrib: POIDS[k] * sc[k], manque: POIDS[k] * (1 - sc[k]) }));
    const forts = tri.filter(x => sc[x.k] >= 0.6).sort((a, b) => b.contrib - a.contrib).slice(0, 3);
    r.forces = forts.map(x => LIB_CRITERES[x.k]);
    r.faiblesses = tri.filter(x => sc[x.k] < 0.6 && forts.indexOf(x) < 0).sort((a, b) => b.manque - a.manque).slice(0, 2).map(x => LIB_CRITERES[x.k]);
    r.competencesOk = requisOk;
    return r;
  }

  function recommander(p) {
    const mq = manquants(p);
    if (mq.length) return { ok: false, origine: 'calcul', manquants: mq, message: 'Avant de recommander une activité, Cap a besoin de : ' + mq.map(x => x.champ).join(', ') + '.' };
    if (p.pays && p.pays !== 'france') return { ok: false, origine: 'calcul', manquants: [], message: 'Les règles juridiques et fiscales de Cap couvrent la France uniquement. Pour un autre pays, la recherche IA sourcée sera nécessaire.', pays: p.pays };
    const tous = CATALOGUE.map(m => evaluer(m, p));
    // Une activité dont tu as déjà la compétence clé passe avant une activité à apprendre, quel que soit le score
    const ok = tous.filter(x => x.statut === 'compatible').sort((a, b) => (b.competencesOk - a.competencesOk) || b.score - a.score || a.id.localeCompare(b.id));
    // Diversité : une seule activité par catégorie dans le top 3 tant que possible
    const top = [], cats = {};
    ok.forEach(x => { if (top.length < 3 && !cats[x.cat]) { top.push(x); cats[x.cat] = 1; } });
    ok.forEach(x => { if (top.length < 3 && top.indexOf(x) < 0) top.push(x); });
    top.forEach((x, i) => { x.rang = i + 1; x.explication = 'Rang ' + (i + 1) + ', score ' + x.score + '/100. Points forts : ' + x.forces.join(', ') + '.' + (x.faiblesses.length ? ' Points faibles : ' + x.faiblesses.join(', ') + '.' : '') + (x.aApprendre ? ' À apprendre d’abord : ' + x.aApprendre + '.' : '') + (x.materielManquant.length ? ' Matériel à acheter : ' + x.materielManquant.join(', ') + '.' : ''); });
    const ecartes = tous.filter(x => x.statut !== 'compatible');
    const notes = [];
    const age = num(p.age) || 0;
    if (age < 16) notes.push('Avant 16 ans, aucune activité ne peut être déclarée en micro-entreprise : Cap te propose de préparer une activité (portfolio, compétences, premiers clients test) que tu lanceras à 16 ans.');
    else if (age < 18) notes.push('Entre 16 et 18 ans : micro-entreprise de prestations de services possible avec l’autorisation écrite de tes parents selon plusieurs guides (Indy, LegalPlace) ; Bpifrance indique des conditions plus strictes. À confirmer auprès du guichet unique de l’INPI avant de t’inscrire. Achat-revente impossible sans émancipation.');
    return { ok: true, origine: 'calcul', version: VERSION, top, compatibles: ok.length, ecartes, notes, poids: POIDS, hypotheses: 'Prix, heures et taux de conversion du catalogue Cap : hypothèses de départ non vérifiées sur ton marché local.' };
  }

  // ---------------------------------------------------------------- Plan financier sur 12 mois
  // Part du temps consacrée à la prospection, mois par mois (le reste = production)
  const PART_PROSPECTION = [0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3];
  const SCENARIOS = { prudent: { prix: 0, hC: 1.6 }, median: { prix: 1, hC: 1 }, favorable: { prix: 2, hC: 0.7 } };
  const ATTRITION = 0.1; // 10 % des clients récurrents partent chaque mois (hypothèse)
  function projection(m, p, ventes) {
    const heures = num(p.heuresProjet) || 0, H = heures * SEM_PAR_MOIS, reg = REGIMES[m.regime];
    const pa = planAction(m.id, p, {});
    const pv = pa.ok ? pa.taches.find(t => t.id === 'premiere_vente') : null;
    // Avant la date de la première vente prévue par le plan d'action, aucun revenu n'est compté
    const delaiMois = Math.max(Math.ceil(m.delaiSem / SEM_PAR_MOIS), pv ? Math.ceil(pv.jourFin / 30.4) : 13);
    const obs = {}; (ventes || []).forEach(v => { if (v && v.date && num(v.montant)) { const k = Number(v.date.slice(0, 4)) * 12 + Number(v.date.slice(5, 7)) - 1; obs[k] = (obs[k] || 0) + v.montant; } });
    const debut = p.debutProjet ? new Date(p.debutProjet + 'T12:00') : null;
    const k0 = debut ? debut.getFullYear() * 12 + debut.getMonth() : null;
    const out = {};
    Object.keys(SCENARIOS).forEach(nom => {
      const S = SCENARIOS[nom]; const prix = m.prix[S.prix]; const hC = m.hC * S.hC;
      let actifs = 0, cumul = 0; const mois = [];
      for (let i = 0; i < 12; i++) {
        const prosp = H * PART_PROSPECTION[i], prod = H - prosp;
        const nouveaux = i + 1 < delaiMois || (num(p.age) || 0) < 16 ? 0 : (i + 1 === delaiMois ? Math.max(1, prosp / hC) : prosp / hC);
        let unites;
        if (m.rec > 0) { actifs = actifs * (1 - ATTRITION) + nouveaux; unites = actifs * m.rec; }
        else unites = nouveaux * m.uC;
        const capacite = prod / m.hU;
        const limite = unites > capacite;
        unites = Math.min(unites, capacite);
        let ca = unites * prix, type = 'prevision';
        const k = k0 !== null ? k0 + i : null;
        if (k !== null && obs[k] !== undefined) { ca = obs[k]; type = 'observe'; }
        const cot = ca * (reg.taux + reg.cfp), varC = (type === 'observe' ? ca / prix : unites) * m.cVar;
        const net = ca - cot - varC - m.couts;
        cumul += net;
        mois.push({ mois: i + 1, unites: r2(unites), ca: r0(ca), cotisations: r0(cot), charges: r0(m.couts + varC), net: r0(net), cumul: r0(cumul), type, limiteCapacite: limite });
      }
      out[nom] = { prix, mois, total12: r0(cumul) };
    });
    return { scenarios: out, premierMois: delaiMois };
  }
  function plan(id, p, ventes) {
    const m = PAR_ID[id]; if (!m) return { ok: false, message: 'Activité inconnue.' };
    const ev = evaluer(m, p), reg = REGIMES[m.regime];
    const proj = projection(m, p, ventes || []);
    const margeUnit = m.prix[1] * (1 - reg.taux - reg.cfp) - m.cVar;
    const seuil = margeUnit > 0 ? Math.ceil(m.couts / margeUnit) : null;
    const budgetInitial = ev.budget;
    const retour = nom => { const x = proj.scenarios[nom].mois.find(z => z.cumul >= budgetInitial); return x ? x.mois : null; };
    const observes = proj.scenarios.median.mois.filter(x => x.type === 'observe');
    return {
      ok: true, origine: 'calcul', version: VERSION, id, nom: m.nom, statut: ev.statut, raisons: ev.raisons,
      concept: { client: m.client, probleme: m.probleme, offre: m.offre, unite: m.unite, format: m.format },
      prix: { bas: m.prix[0], median: m.prix[1], haut: m.prix[2], type: 'hypothese' },
      budgetInitial: { total: budgetInitial, demarrage: m.capital, materiel: ev.coutMateriel, materielListe: ev.materielManquant, chargesAvance: m.couts * 2, type: 'calcul' },
      charges: { mensuelles: m.couts, variablesParUnite: m.cVar, cotisations: reg.taux, cfp: reg.cfp, regime: reg.nom, source: SOURCE_TAUX },
      margeParUnite: r2(margeUnit), seuilRentabilite: seuil === null ? null : { unites: seuil, texte: seuil + ' ' + m.unite + (seuil > 1 ? 's' : '') + ' par mois couvrent les charges fixes (' + m.couts + ' €).' },
      scenarios: proj.scenarios, retourInvestissement: { prudent: retour('prudent'), median: retour('median'), favorable: retour('favorable') },
      observe: observes.length ? { mois: observes.length, ca: observes.reduce((s, x) => s + x.ca, 0) } : null,
      validation: m.validation, formalites: formalites(m, p), risques: risques(m, p),
      hypotheses: [
        'Prix ' + m.prix.join(' / ') + ' € par ' + m.unite + ' (prudent / médian / favorable) : hypothèse Cap à vérifier sur ton marché.',
        'Production : ' + m.hU + ' h par ' + m.unite + '. Prospection : ' + m.hC + ' h par nouveau client (×1,6 en prudent, ×0,7 en favorable).',
        'Temps : ' + (num(p.heuresProjet) || 0) + ' h par semaine, dont 70 % de prospection le premier mois puis 30 % à partir du 7e.',
        'Premier revenu compté au mois ' + proj.premierMois + ', date de la première vente dans ton plan d’action.' + (m.rec ? ' Clients récurrents : 10 % partent chaque mois.' : ''),
        'Cotisations ' + Math.round(reg.taux * 1000) / 10 + ' % + CFP ' + Math.round(reg.cfp * 1000) / 10 + ' % du chiffre d’affaires (' + SOURCE_TAUX + '). Impôt sur le revenu non compté.'
      ],
      avertissement: 'Ces montants sont des scénarios calculés à partir d’hypothèses, pas des revenus promis.'
    };
  }
  function formalites(m, p) {
    const age = num(p.age) || 0, f = [];
    if (age < 16) f.push('Avant 16 ans : pas d’immatriculation possible. Prépare l’activité, sans facturer.');
    else {
      f.push('Déclarer la micro-entreprise sur le guichet unique (formalites.entreprises.gouv.fr), gratuit.');
      if (age < 18) f.push('Mineur : autorisation écrite des deux parents (ou du représentant légal), à joindre au dossier. Revenus rattachés au foyer fiscal des parents.');
      f.push('Ouvrir un compte bancaire dédié si le chiffre d’affaires dépasse 10 000 € deux années de suite.');
      f.push('Déclarer le chiffre d’affaires à l’URSSAF chaque mois ou chaque trimestre, même s’il est nul.');
    }
    if (m.reglementation) f.push(m.reglementation);
    return f;
  }
  function risques(m, p) {
    const r = ['La demande réelle peut être plus faible que prévu : valide-la avant d’investir (' + m.validation + ')'];
    if (m.rec) r.push('Revenus récurrents fragiles au début : un client perdu pèse lourd.');
    if (m.risque === 3) r.push('Activité à risque élevé : beaucoup de temps avant un revenu stable.');
    if (m.format === 'local') r.push('Activité locale : ta zone de déplacement limite le nombre de clients.');
    if ((num(p.age) || 0) < 18) r.push('Certains clients hésitent à travailler avec un mineur : mets en avant ton portfolio et des avis.');
    return r;
  }

  // ---------------------------------------------------------------- Plan d'action 30 / 60 / 90 jours
  function taches(m, p) {
    const age = num(p.age) || 0;
    const T = (id, titre, h, prio, deps, critere) => ({ id, titre, heures: h, priorite: prio, deps, critere });
    const portfolio = { web: 10, contenu: 8, service: 2, commerce: 1 }[m.cat] || 4;
    const out = [
      T('offre', 'Écrire ton offre en 3 lignes et fixer un prix de départ', 2, 1, [], 'Offre et prix écrits, relus par une personne extérieure'),
      T('formalites', age < 18 ? 'Lister les démarches et obtenir l’accord écrit de tes parents' : 'Lister les démarches de micro-entreprise', 1, 1, [], 'Liste des démarches complète'),
      T('portfolio', m.cat === 'commerce' ? 'Choisir une catégorie d’objets et étudier 30 ventes récentes' : 'Préparer ' + (m.cat === 'service' ? 'une présentation et 1 recommandation' : '2 ou 3 réalisations d’exemple'), portfolio, 1, ['offre'], 'Exemples prêts à montrer'),
      T('liste', 'Lister 30 clients potentiels avec leur contact', 2, 1, ['offre'], '30 contacts dans un tableau'),
      T('validation', 'Valider la demande : ' + m.validation, 4, 1, ['portfolio', 'liste'], m.validation),
      T('immat', age < 16 ? 'Préparer le dossier pour tes 16 ans' : 'S’inscrire comme micro-entrepreneur', 2, 2, ['validation', 'formalites'], age < 16 ? 'Dossier prêt' : 'Numéro SIRET reçu'),
      T('premiere_vente', 'Livrer ton premier client payant', Math.max(2, m.hU), 1, ['immat'], '1 client payé et satisfait'),
      T('avis', 'Demander un avis écrit au premier client', 0.5, 2, ['premiere_vente'], '1 avis publié'),
      T('prospection2', 'Contacter 30 nouveaux prospects', 5, 1, ['avis'], '30 messages envoyés, réponses notées'),
      T('mesure', 'Mesurer : taux de réponse, heures par client, marge réelle', 1, 2, ['prospection2'], 'Chiffres réels saisis dans Cap'),
      T('ajustement', 'Ajuster le prix ou l’offre selon les chiffres réels', 1, 2, ['mesure'], 'Nouvelle offre écrite'),
      T('seuil', 'Atteindre le seuil de rentabilité sur un mois', Math.max(3, m.hU * 2), 1, ['ajustement'], 'Charges du mois couvertes par les ventes')
    ];
    return out;
  }
  function planAction(id, p, faites, debut) {
    const m = PAR_ID[id]; if (!m) return { ok: false, message: 'Activité inconnue.' };
    const h = num(p.heuresProjet) || 0;
    if (h <= 0) return { ok: false, manquants: [{ champ: 'heuresProjet', raison: 'Sans heures disponibles, aucun calendrier n’est possible.' }], message: 'Indique combien d’heures par semaine tu peux consacrer au projet.' };
    faites = faites || {};
    const liste = taches(m, p), fin = {}, out = [];
    let curseur = 0; // en heures de projet cumulées
    const parJour = h / 7;
    // Ordre : priorité puis dépendances (tri topologique stable)
    const restantes = liste.slice();
    while (restantes.length) {
      const i = restantes.findIndex(t => t.deps.every(dp => fin[dp] !== undefined));
      const t = restantes.splice(i < 0 ? 0 : i, 1)[0];
      const cle = id + ':' + t.id;
      if (faites[cle]) { fin[t.id] = curseur; out.push(Object.assign({}, t, { cle, fait: true, faitLe: faites[cle].date || null, jourDebut: null, jourFin: null, phase: 'fait' })); continue; }
      const depFin = t.deps.reduce((mx, dp) => Math.max(mx, fin[dp] || 0), 0);
      const start = Math.max(curseur, depFin), end = start + t.heures;
      curseur = end; fin[t.id] = end;
      const jd = Math.floor(start / parJour) + 1, jf = Math.ceil(end / parJour);
      out.push(Object.assign({}, t, { cle, fait: false, jourDebut: jd, jourFin: jf, phase: jf <= 30 ? '30' : jf <= 60 ? '60' : jf <= 90 ? '90' : 'apres' }));
    }
    const pv = out.find(t => t.id === 'premiere_vente');
    const alerte = pv && !pv.fait && pv.phase === 'apres' ? 'Avec ' + h + ' h par semaine, la première vente arrive après 90 jours (jour ' + pv.jourFin + '). Plus d’heures ou une offre plus simple raccourcissent ce délai.' : null;
    return { ok: true, origine: 'calcul', id, heuresSemaine: h, debut: debut || null, taches: out, alerte, faites: out.filter(t => t.fait).length, total: out.length };
  }
  return { VERSION, REGIMES, SOURCE_TAUX, CATALOGUE, PAR_ID, POIDS, COMPETENCES, MATERIEL, manquants, evaluer, recommander, projection, plan, planAction };
});
