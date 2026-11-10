// Test de la fonction cap-ai avec des services externes SIMULÉS (auth Supabase, RPC de quota, API Claude).
// Lancer : deno run --allow-net --allow-env --allow-read supabase/tests/cap-ai-test.ts
const appels: { url: string; corps: any }[] = [];
let quotaOk = true, cleIA = true;
Deno.env.set('SUPABASE_URL', 'https://simule.supabase.co');
Deno.env.set('SUPABASE_ANON_KEY', 'anon'); Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service');
Deno.env.set('ANTHROPIC_API_KEY', 'cle-factice-de-test');
const vraiFetch = globalThis.fetch;
globalThis.fetch = async (entree: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof entree === 'string' ? entree : entree instanceof URL ? entree.href : entree.url;
  if (url.startsWith('http://localhost')) return vraiFetch(entree, init);
  const hdr = new Headers(init?.headers ?? (entree instanceof Request ? entree.headers : undefined));
  let corps: any = null; try { corps = init?.body ? JSON.parse(String(init.body)) : null; } catch { corps = init?.body; }
  appels.push({ url, corps });
  if (url.endsWith('/auth/v1/user')) return hdr.get('Authorization') === 'Bearer bon-jeton' ? Response.json({ id: 'u-1', aud: 'authenticated', email: 'e@x.fr' }) : new Response(JSON.stringify({ msg: 'invalid JWT' }), { status: 401 });
  if (url.includes('/rest/v1/rpc/cap_ai_consommer')) return Response.json(quotaOk);
  if (url === 'https://api.anthropic.com/v1/messages') {
    if (!cleIA) throw new Error('ne doit pas être appelé');
    const scan = Array.isArray(corps.messages[0].content);
    return Response.json({ content: [{ type: 'text', text: scan ? 'Voici : {"aliments":[{"nom":"Riz blanc (cuit)","grammes":150}],"remarque":"ok"}' : 'Garde ton rythme.' }] });
  }
  return new Response('inconnu', { status: 404 });
};
let port = 0;
const vraiServe = Deno.serve;
(Deno as any).serve = (h: any) => vraiServe({ port: 0, onListen: (a: any) => { port = a.port; } }, h);
await import('../functions/cap-ai/index.ts');
while (!port) await new Promise((r) => setTimeout(r, 10));
const res: string[] = []; const T = (n: string, c: boolean, i?: unknown) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c ? '' : ' → ' + JSON.stringify(i)));
const post = (corps: unknown, jeton = 'bon-jeton') => vraiFetch(`http://localhost:${port}/`, { method: 'POST', headers: { Authorization: 'Bearer ' + jeton, 'content-type': 'application/json', Origin: 'https://noctivl9-rgb.github.io' }, body: JSON.stringify(corps) });

let r = await vraiFetch(`http://localhost:${port}/`, { method: 'OPTIONS' }); await r.text();
T('CORS : origine limitée à GitHub Pages', r.headers.get('access-control-allow-origin') === 'https://noctivl9-rgb.github.io');
r = await post({ type: 'coach', question: 'Salut' }, 'faux'); T('jeton invalide → 401 non_connecte', r.status === 401 && (await r.json()).error === 'non_connecte');
const avant = appels.filter((a) => a.url.includes('anthropic')).length;
r = await post({ type: 'autre' }); T('type inconnu → 400', r.status === 400); await r.body?.cancel();
r = await post({ type: 'scan', image: 'aGVsbG8=', media_type: 'image/gif' }); T('format d’image refusé avant toute dépense', r.status === 400 && (await r.json()).error === 'image_rejected');
T('aucun appel IA pour une requête invalide', appels.filter((a) => a.url.includes('anthropic')).length === avant);
r = await post({ type: 'coach', question: 'Mon objectif ?', historique: [{ role: 'assistant', content: 'x' }, { role: 'user', content: 'a' }, { role: 'user', content: 'b' }], contexte: { age: 15 } });
const j = await r.json(); T('coach : réponse renvoyée', r.status === 200 && j.text === 'Garde ton rythme.', j);
const dem = appels.filter((a) => a.url.includes('anthropic')).at(-1)!.corps;
T('coach : consignes fixées par le serveur (règle « N’invente AUCUN chiffre »)', String(dem.system).includes('N’invente AUCUN chiffre') && String(dem.system).includes('"age":15'));
T('coach : alternance des rôles respectée', dem.messages.every((m: any, i: number, a: any[]) => i === 0 ? m.role === 'user' : m.role !== a[i - 1].role), dem.messages);
T('coach : modèle Haiku par défaut', dem.model === 'claude-haiku-5-5');
r = await post({ type: 'scan', image: 'aGVsbG8=', media_type: 'image/jpeg', noms: ['Riz blanc (cuit)'] });
const s = await r.json(); T('scan : JSON extrait de la réponse', r.status === 200 && s.aliments?.[0]?.grammes === 150, s);
quotaOk = false; r = await post({ type: 'coach', question: 'Encore ?' }); T('quota dépassé → 429 sans appel IA', r.status === 429 && (await r.json()).error === 'quota_atteint');
quotaOk = true; Deno.env.delete('ANTHROPIC_API_KEY'); cleIA = false;
r = await post({ type: 'coach', question: 'Sans clé ?' }); T('clé IA absente → 503 ia_non_configuree', r.status === 503 && (await r.json()).error === 'ia_non_configuree');
T('la clé n’apparaît dans aucune réponse', !res.join('').includes('cle-factice'));
console.log(res.join('\n')); console.log('\n' + res.filter((x) => x.startsWith('ok')).length + ' réussis, ' + res.filter((x) => x.startsWith('FAIL')).length + ' échoués');
Deno.exit(0);
