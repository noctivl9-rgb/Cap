-- Cap : quotas des générations IA (programme, activités, questions, explications). Non destructif, rejouable.
alter table public.cap_ai_usage add column if not exists generations int not null default 0;

create or replace function public.cap_ai_consommer(p_user uuid, p_type text, p_limite int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into public.cap_ai_usage (user_id, jour) values (p_user, current_date) on conflict do nothing;
  if p_type = 'scan' then
    update public.cap_ai_usage set scans = scans + 1 where user_id = p_user and jour = current_date and scans < p_limite returning scans into n;
  elsif p_type = 'generation' then
    update public.cap_ai_usage set generations = generations + 1 where user_id = p_user and jour = current_date and generations < p_limite returning generations into n;
  else
    update public.cap_ai_usage set messages = messages + 1 where user_id = p_user and jour = current_date and messages < p_limite returning messages into n;
  end if;
  return n is not null;
end; $$;
revoke all on function public.cap_ai_consommer(uuid, text, int) from public, anon, authenticated;
