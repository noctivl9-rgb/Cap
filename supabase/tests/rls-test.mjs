// Vérifie la migration SQL dans un Postgres embarqué (PGlite) avec une imitation minimale de Supabase :
// schéma auth, auth.uid() lu dans le jeton simulé, rôles anon / authenticated, publication temps réel.
// Lancer : node supabase/tests/rls-test.mjs  (nécessite npm i @electric-sql/pglite@0.2.17 ; vérifié le 10/11/2026)
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
const db = new PGlite();
const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c || i === undefined ? '' : ' → ' + i));
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
  create publication supabase_realtime;
  insert into auth.users values ('00000000-0000-0000-0000-00000000000a', 'elias@x.fr'), ('00000000-0000-0000-0000-00000000000b', 'autre@x.fr');
`);
const sql = readFileSync(new URL('../migrations/20261110000000_cap_init.sql', import.meta.url), 'utf8');
await db.exec(sql); T('migration exécutée sans erreur', true);
await db.exec(sql); T('migration rejouable (idempotente)', true);
await db.exec(`grant usage on schema public to anon, authenticated; grant select, insert, update, delete on public.cap_docs to authenticated; grant select on public.cap_ai_usage to authenticated;`);
const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b';
const as = async (uid, q, p) => { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${uid ? 'authenticated' : 'anon'};`); try { return await db.query(q, p); } finally { await db.exec('reset role;'); } };
const err = async f => { try { await f(); return null; } catch (e) { return e.message; } };

await as(A, `insert into public.cap_docs (coll, doc_id, data) values ('pesees', '2026-11-10', '{"date":"2026-11-10","poids":70.2}')`);
T('A écrit sa pesée (user_id rempli automatiquement)', (await as(A, `select user_id from public.cap_docs`)).rows[0]?.user_id === A);
T('B ne voit pas les données de A', (await as(B, `select * from public.cap_docs`)).rows.length === 0);
T('anonyme ne voit rien', !!(await err(() => as(null, `select * from public.cap_docs`))) || (await as(null, `select * from public.cap_docs`)).rows.length === 0);
T('B ne peut pas écrire au nom de A', !!(await err(() => as(B, `insert into public.cap_docs (user_id, coll, doc_id, data) values ('${A}', 'pesees', 'x', '{}')`))));
await as(B, `update public.cap_docs set data = '{"pirate":true}'`); await as(B, `delete from public.cap_docs`);
T('B ne peut ni modifier ni supprimer les lignes de A', (await as(A, `select data from public.cap_docs`)).rows[0]?.data?.poids === 70.2);
T('nom de collection invalide refusé', !!(await err(() => as(A, `insert into public.cap_docs (coll, doc_id, data) values ('../x', 'a', '{}')`))));
T('donnée non-objet refusée', !!(await err(() => as(A, `insert into public.cap_docs (coll, doc_id, data) values ('pesees', 'b', '[1,2]')`))));
const avant = (await as(A, `select updated_at from public.cap_docs`)).rows[0].updated_at;
await new Promise(r => setTimeout(r, 20));
await as(A, `insert into public.cap_docs (coll, doc_id, data) values ('pesees', '2026-11-10', '{"date":"2026-11-10","poids":70.1}') on conflict (user_id, coll, doc_id) do update set data = excluded.data`);
const ap = (await as(A, `select data, updated_at from public.cap_docs`)).rows[0];
T('upsert met à jour la ligne et la date', ap.data.poids === 70.1 && ap.updated_at > avant);
T('B ne peut pas modifier ses quotas IA', !!(await err(() => as(B, `insert into public.cap_ai_usage (user_id) values ('${B}')`))));
T('B ne peut pas appeler la fonction de quota', !!(await err(() => as(B, `select public.cap_ai_consommer('${B}', 'scan', 99)`))));
let oks = 0; for (let i = 0; i < 4; i++) if ((await db.query(`select public.cap_ai_consommer('${A}', 'scan', 3) as ok`)).rows[0].ok) oks++;
T('quota : 3 scans acceptés, le 4e refusé', oks === 3, oks);
T('A lit son compteur', (await as(A, `select scans from public.cap_ai_usage`)).rows[0]?.scans === 3);
T('table publiée pour le temps réel', (await db.query(`select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='cap_docs'`)).rows.length === 1);
console.log(res.join('\n')); console.log('\n' + res.filter(x => x.startsWith('ok')).length + ' réussis, ' + res.filter(x => x.startsWith('FAIL')).length + ' échoués');
