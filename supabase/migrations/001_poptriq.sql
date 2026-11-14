create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "admin_users_select_self"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_poptriq_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_poptriq_admin() from public;
grant execute on function public.is_poptriq_admin() to anon, authenticated;

create table if not exists public.cards (
  id text primary key check (id ~ '^[MF][0-9]{3}$'),
  type text not null check (type in ('music', 'movie')),
  status text not null default 'draft',
  title text not null check (length(trim(title)) > 0),
  artist text,
  playback_url text not null check (playback_url ~ '^https://'),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) = 3),
  answers jsonb not null check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) = 3),
  playback jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint cards_id_matches_type check (
    (type = 'music' and id like 'M%') or
    (type = 'movie' and id like 'F%')
  )
);

alter table public.cards enable row level security;

create policy "cards_read_public"
on public.cards for select
to anon, authenticated
using (true);

create policy "cards_insert_admin"
on public.cards for insert
to authenticated
with check (public.is_poptriq_admin());

create policy "cards_update_admin"
on public.cards for update
to authenticated
using (public.is_poptriq_admin())
with check (public.is_poptriq_admin());

create policy "cards_delete_admin"
on public.cards for delete
to authenticated
using (public.is_poptriq_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at
before update on public.cards
for each row execute function public.set_updated_at();
