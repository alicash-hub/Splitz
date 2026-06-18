-- Bread & Salt (عيش وملح) — initial schema
--
-- Three tables: trips, members, expenses (see CLAUDE.md "Data model").
-- MVP has no auth: identity is a name in localStorage + a row in `members`.
-- Row Level Security is enabled on every table, with policies that allow
-- public (anon) read/write. This is intentional for the MVP trusted-friend-group
-- model — revisit before adding any sensitive data.

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
-- Row Level Security — public read/write for the MVP (no auth)
-- ---------------------------------------------------------------------------
alter table public.trips    enable row level security;
alter table public.members  enable row level security;
alter table public.expenses enable row level security;

-- One permissive policy per table covering all commands for both the anon and
-- authenticated roles. `using (true)` allows reads/updates/deletes on every row;
-- `with check (true)` allows any insert/update.
create policy "public access to trips"
  on public.trips
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "public access to members"
  on public.members
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "public access to expenses"
  on public.expenses
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Realtime — the dashboard subscribes to live changes
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.expenses;
