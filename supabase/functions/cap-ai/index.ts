// Cap — fonction serveur « cap-ai » (Supabase Edge Function, Deno).
// Rôle : appeler l'API Claude avec une clé gardée côté serveur, pour l'utilisateur connecté uniquement.
// - La clé ANTHROPIC_API_KEY est un secret Supabase (supabase secrets set …) : jamais dans le dépôt ni le navigateur.
// - Les consignes (prompts) sont fixées ici : le navigateur envoie seulement les données, pas les règles.
// - Quotas par utilisateur et par jour (table cap_ai_usage), en plus de la limite de dépense réglée chez Anthropic.
// - L'IA ne produit aucun chiffre affiché tel quel : le navigateur revalide tout (CapEngine.validerScan) et
//   le coach n'a le droit d'utiliser que les chiffres calculés par le moteur déterministe.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import '../_shared/prompts.js'; // mêmes consignes que le navigateur (copie de prompts.js, voir dev/scripts/sync-shared.sh)
// deno-lint-ignore no-explicit-any
const P = (globalThis as any).CapPrompts;

const MODELE = Deno.env.get('CAP_MODELE') ?? 'claude-haiku-5-5';
const SCANS_JOUR = Number(Deno.env.get('CAP_SCANS_JOUR') ?? '20');
const MESSAGES_JOUR = Number(Deno.env.get('CAP_MESSAGES_JOUR') ?? '40');
const GENERATIONS_JOUR = Number(Deno.env.get('CAP_GENERATIONS_JOUR') ?? '10');
const MODELE_BUSINESS = Deno.env.get('CAP_MODELE_BUSINESS') ?? 'claude-sonnet-5-5';
const WEB = Deno.env.get('CAP_WEB') === '1'; // recherche web réelle pour les activités (10 $ / 1 000 recherches)
const WEB_MAX = Number(Deno.env.get('CAP_WEB_MAX') ?? '5');
const TACHES: Record<string, { max: number }> = { programme: { max: 6000 }, business: { max: 6000 }, questions: { max: 1200 }, pourquoi: { max: 1200 } };
const ORIGINE = Deno.env.get('CAP_ORIGINE') ?? 'https://noctivl9-rgb.github.io';
const TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];

const cors = {
  'Access-Control-Allow-Origin': ORIGINE,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};
const repondre = (corps: unknown, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { ...cors, 'Content-Type': 'application/json' } });
const erreur = (code: string, statut: number) => repondre({ error: code }, statut);
const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

const REGLES_SCAN = (noms: string[]) => [
  'Tu analyses la photo d’un repas pour un journal alimentaire personnel.',
  'Identifie chaque aliment VISIBLE et estime sa quantité en grammes (une photo ne permet qu’une estimation : sois prudent, n’invente pas d’aliment caché).',
  noms.length ? 'Si un aliment correspond à un nom de cette liste, reprends ce nom EXACTEMENT : ' + noms.join(' ; ') + '.' : '',
  'Pour chaque aliment, donne ses valeurs moyennes pour 100 g (aliment tel que servi).',
  'preparation : "aucune" (cru, vapeur, à l’eau), "poele" (sauté avec matière grasse) ou "frit".',
  'confiance : "haute", "moyenne" ou "faible" sur l’identification ET la quantité.',
  'remarque : une phrase sur les incertitudes (sauce, huile, portion cachée). Si la photo ne montre pas de nourriture, renvoie une liste vide et explique-le.',
  'Réponds uniquement avec ce JSON : {"aliments":[{"nom":string,"grammes":number,"preparation":string,"confiance":string,"kcal_100g":number,"proteines_100g":number,"glucides_100g":number,"lipides_100g":number}],"remarque":string}',
].filter(Boolean).join('\n');

const REGLES_COACH = (contexte: string) => [
  'Tu es le coach de l’application personnelle « Cap ». Réponds en français, simplement, en 120 mots maximum, avec une action concrète à la fin si c’est utile.',
  'Règles strictes :',
  '1. Tous les chiffres viennent du contexte ci-dessous, calculé par des formules vérifiées. N’invente AUCUN chiffre (calories, poids, revenus, délais, progrès). S’il manque une donnée, dis : « Je ne dispose pas de suffisamment d’informations pour établir une estimation fiable. »',
  '2. Les projections sont des estimations, jamais des promesses. Ne présente pas un revenu futur comme acquis.',
  '3. Tu n’es ni médecin ni conseiller financier agréé : pour un problème de santé, une douleur, un trouble alimentaire ou une dette, oriente vers un professionnel. Ta réponse n’est jamais une validation médicale, financière ou juridique.',
  '4. Aucun régime extrême, aucune promesse d’enrichissement rapide, aucun conseil de trading ou de placement risqué.',
  '5. Si l’utilisateur est mineur (âge dans le contexte), adapte tes conseils : croissance, droit du travail, accord des parents.',
  'Contexte (données que l’utilisateur a choisi de partager) :',
  contexte,
].join('\n');

async function claude(corps: Record<string, unknown>) {
  const cle = Deno.env.get('ANTHROPIC_API_KEY');
  if (!cle) return { erreur: 'ia_non_configuree' as const };
  // deno-lint-ignore no-explicit-any
  const contenu: any[] = [], sources = new Set<string>();
  let messages = corps.messages as unknown[], modele = (corps.model as string) ?? MODELE;
  for (let tour = 0; tour < 3; tour++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': cle, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODELE, ...corps, messages }),
    });
    if (r.status === 429) return { erreur: 'rate_limited' as const };
    if (!r.ok) { console.error('API Claude', r.status, (await r.text()).slice(0, 300)); return { erreur: 'ia_echec' as const }; }
    const j = await r.json();
    modele = j.model ?? modele;
    for (const b of j.content ?? []) {
      contenu.push(b);
      if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) for (const x of b.content) if (x.url) sources.add(x.url);
      if (b.type === 'text' && Array.isArray(b.citations)) for (const c of b.citations) if (c.url) sources.add(c.url);
    }
    // Recherche web longue : l'API rend la main (pause_turn) ; on renvoie le tour tel quel pour qu'elle continue
    if (j.stop_reason !== 'pause_turn') break;
    messages = [...(corps.messages as unknown[]), { role: 'assistant', content: contenu.slice() }];
  }
  // Le JSON final est dans le dernier bloc de texte qui en contient un
  const textes = contenu.filter((b) => b.type === 'text').map((b) => b.text as string);
  const t = textes.reverse().find((x) => x.includes('{')) ?? textes.join('');
  return { texte: t, modele, sources: [...sources] };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return erreur('requete_invalide', 405);

  // 1. Utilisateur connecté (jeton de session Supabase)
  const auth = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const utilisateur = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: u, error: eu } = await utilisateur.auth.getUser();
  if (eu || !u?.user) return erreur('non_connecte', 401);

  let corps: Record<string, unknown>;
  try { corps = await req.json(); } catch { return erreur('requete_invalide', 400); }
  const type = corps.type === 'scan' ? 'scan' : corps.type === 'coach' ? 'coach' : corps.type === 'generation' ? 'generation' : null;
  if (!type) return erreur('requete_invalide', 400);

  // 2. Validation des entrées avant toute dépense
  let demande: Record<string, unknown>;
  if (type === 'scan') {
    const image = texte(corps.image, 3_000_000), media = texte(corps.media_type, 20);
    if (!image) return erreur('requete_invalide', 400);
    if (image.length >= 3_000_000) return erreur('image_trop_lourde', 413);
    if (!TYPES_IMAGE.includes(media)) return erreur('image_rejected', 400);
    const noms = Array.isArray(corps.noms) ? corps.noms.filter((n) => typeof n === 'string').slice(0, 200).map((n) => (n as string).slice(0, 60)) : [];
    demande = { max_tokens: 900, messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: media, data: image } },
      { type: 'text', text: REGLES_SCAN(noms) },
    ] }] };
  } else if (type === 'generation') {
    const tache = String(corps.tache ?? '');
    if (!TACHES[tache]) return erreur('requete_invalide', 400);
    const brut = JSON.stringify(corps.demande ?? null);
    if (!corps.demande || brut.length > 80_000) return erreur('requete_invalide', 400);
    const d = corps.demande as Record<string, unknown>;
    let prompt: string = tache === 'business' ? P.business(d, WEB) : P[tache](d);
    const erreurs = Array.isArray(corps.erreurs) ? (corps.erreurs as unknown[]).filter((x) => typeof x === 'string').slice(0, 12).map((x) => (x as string).slice(0, 300)) : null;
    if (erreurs && erreurs.length) prompt = P.correction(prompt, erreurs);
    demande = { max_tokens: TACHES[tache].max, messages: [{ role: 'user', content: prompt }] };
    if (tache === 'business') {
      demande.model = MODELE_BUSINESS;
      if (WEB) demande.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: WEB_MAX, user_location: { type: 'approximate', country: 'FR', timezone: 'Europe/Paris' } }];
    }
  } else {
    const question = texte(corps.question, 1000).trim();
    if (!question) return erreur('requete_invalide', 400);
    const contexte = JSON.stringify(corps.contexte ?? {}).slice(0, 8000);
    const hist = (Array.isArray(corps.historique) ? corps.historique : []).slice(-10)
      .filter((m: { role?: string; content?: unknown }) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    while (hist.length && hist[0].role !== 'user') hist.shift();
    // L'API exige une alternance utilisateur / assistant : deux messages consécutifs du même rôle sont fusionnés
    const messages: { role: string; content: string }[] = [];
    for (const m of [...hist, { role: 'user', content: question }]) {
      const der = messages[messages.length - 1];
      if (der && der.role === m.role) der.content += '\n\n' + m.content; else messages.push({ ...m });
    }
    demande = { max_tokens: 400, system: REGLES_COACH(contexte), messages };
  }

  // 3. Quota du jour (incrément atomique côté base, avec la clé de service)
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: ok, error: eq } = await service.rpc('cap_ai_consommer', { p_user: u.user.id, p_type: type, p_limite: type === 'scan' ? SCANS_JOUR : type === 'generation' ? GENERATIONS_JOUR : MESSAGES_JOUR });
  if (eq) { console.error('quota', eq.message); return erreur('ia_echec', 500); }
  if (!ok) return erreur('quota_atteint', 429);

  // 4. Appel IA
  const r = await claude(demande);
  if ('erreur' in r) return erreur(r.erreur!, r.erreur === 'ia_non_configuree' ? 503 : r.erreur === 'rate_limited' ? 429 : 502);
  if (type === 'coach') return repondre({ text: r.texte.slice(0, 2000) });
  if (type === 'generation') {
    const g = r.texte.match(/\{[\s\S]*\}/);
    // sources : URL réellement renvoyées par l'outil de recherche ; le navigateur n'accepte que des faits cités parmi elles
    try { return repondre({ data: JSON.parse(g ? g[0] : ''), modele: r.modele, sources: corps.tache === 'business' && WEB ? r.sources : null }); } catch { return erreur('invalid_json', 502); }
  }
  const m = r.texte.match(/\{[\s\S]*\}/);
  try { return repondre(JSON.parse(m ? m[0] : '')); } catch { return erreur('invalid_json', 502); }
});
