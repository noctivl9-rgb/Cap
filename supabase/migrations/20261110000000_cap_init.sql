-- Cap : schéma initial. À exécuter une fois dans Supabase (SQL Editor) ou via `supabase db push`.
-- Un seul tableau de documents par utilisateur, même modèle que la base de l'artefact Claude.
-- Sécurité : RLS activé ; chaque utilisateur ne voit et ne modifie que ses lignes.

create table if not exists public.cap_docs (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  coll       text        not null check (coll ~ '^[a-z]{1,30}$'),
  doc_id     text        not null check (char_length(doc_id) between 1 and 200),
  data       jsonb       not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 200000),
  updated_at timestamptz not null default now(),
  primary key (user_id, coll, doc_id)
);

alter table public.cap_docs enable row level security;

drop policy if exists "cap_docs lecture" on public.cap_docs;
drop policy if exists "cap_docs ajout" on public.cap_docs;
drop policy if exists "cap_docs modification" on public.cap_docs;
drop policy if exists "cap_docs suppression" on public.cap_docs;
create policy "cap_docs lecture"      on public.cap_docs for select to authenticated using ((select auth.uid()) = user_id);
create policy "cap_docs ajout"        on public.cap_docs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "cap_docs modification" on public.cap_docs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "cap_docs suppression"  on public.cap_docs for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.cap_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists cap_docs_touch on public.cap_docs;
create trigger cap_docs_touch before update on public.cap_docs for each row execute function public.cap_touch();

-- Temps réel : les suppressions transmettent la ligne complète (nécessaire pour savoir quelle collection change)
alter table public.cap_docs replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.cap_docs;
exception when duplicate_object then null; end $$;

-- Quotas d'IA par jour (écrits uniquement par la fonction serveur cap-ai, avec la clé de service)
create table if not exists public.cap_ai_usage (
  user_id  uuid not null references auth.users (id) on delete cascade,
  jour     date not null default current_date,
  scans    int  not null default 0,
  messages int  not null default 0,
  primary key (user_id, jour)
);
alter table public.cap_ai_usage enable row level security;
drop policy if exists "cap_ai_usage lecture" on public.cap_ai_usage;
create policy "cap_ai_usage lecture" on public.cap_ai_usage for select to authenticated using ((select auth.uid()) = user_id);
-- Aucune politique d'écriture : le navigateur ne peut pas modifier ses propres quotas.

-- Incrément atomique, appelé par la fonction serveur ; refuse au-delà de la limite
create or replace function public.cap_ai_consommer(p_user uuid, p_type text, p_limite int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into public.cap_ai_usage (user_id, jour) values (p_user, current_date) on conflict do nothing;
  if p_type = 'scan' then
    update public.cap_ai_usage set scans = scans + 1 where user_id = p_user and jour = current_date and scans < p_limite returning scans into n;
  else
    update public.cap_ai_usage set messages = messages + 1 where user_id = p_user and jour = current_date and messages < p_limite returning messages into n;
  end if;
  return n is not null;
end; $$;
revoke all on function public.cap_ai_consommer(uuid, text, int) from public, anon, authenticated;
