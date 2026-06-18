-- Bread & Salt (عيش وملح) — initial schema
--
-- Three tables: trips, members, expenses (see CLAUDE.md "Data model").
-- MVP has no auth: identity is a name in localStorage + a row in `members`.
-- Row Level Security is enabled on every table, with policies that allow
-- public (anon) read/write. This is intentional for the MVP trusted-friend-group
-- model — revisit before adding any sensitive data.
--
-- This migration is written to be idempotent and safe to (re)apply: it uses
-- `if not exists`, drops-then-creates policies, guards the realtime publication,
-- and re-asserts grants. It never drops a table, so it is non-destructive.

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  slug       text        not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------
create table if not exists public.members (
  id         uuid        primary key default gen_random_uuid(),
  trip_id    uuid        not null references public.trips (id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now()
);

-- Look up members by trip quickly.
create index if not exists members_trip_id_idx on public.members (trip_id);

-- Block duplicate names within a trip, case-insensitively (PRD: prompt the user
-- to differentiate, e.g. add a last initial). Enforced at the DB level so the
-- rule holds even with concurrent joins.
create unique index if not exists members_trip_id_lower_name_idx
  on public.members (trip_id, lower(name));

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id          uuid        primary key default gen_random_uuid(),
  trip_id     uuid        not null references public.trips (id) on delete cascade,
  paid_by     uuid        not null references public.members (id) on delete cascade,
  amount      numeric     not null check (amount > 0),  -- EGP
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists expenses_trip_id_idx on public.expenses (trip_id);
create index if not exists expenses_paid_by_idx on public.expenses (paid_by);

-- ---------------------------------------------------------------------------
-- Grants — the anon (and authenticated) roles back the public API. RLS below is
-- what actually gates access; these grants make the tables reachable at all.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.trips    to anon, authenticated;
grant select, insert, update, delete on public.members  to anon, authenticated;
grant select, insert, update, delete on public.expenses to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security — public read/write for the MVP (no auth)
-- ---------------------------------------------------------------------------
alter table public.trips    enable row level security;
alter table public.members  enable row level security;
alter table public.expenses enable row level security;

-- One permissive policy per table covering all commands for both the anon and
-- authenticated roles. `using (true)` allows reads/updates/deletes on every row;
-- `with check (true)` allows any insert/update. Drop-then-create keeps this
-- re-runnable (Postgres has no CREATE POLICY IF NOT EXISTS).
drop policy if exists "public access to trips" on public.trips;
create policy "public access to trips"
  on public.trips
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "public access to members" on public.members;
create policy "public access to members"
  on public.members
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "public access to expenses" on public.expenses;
create policy "public access to expenses"
  on public.expenses
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Realtime — the dashboard subscribes to live changes. Guarded so re-applying
-- doesn't error on tables already in the publication.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['trips', 'members', 'expenses'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Make sure PostgREST picks up the schema immediately.
notify pgrst, 'reload schema';
