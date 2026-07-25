-- Eish & Malh — fix PGRST205 on settlements ("Mark as paid")
--
-- Symptom: reading settlements works, but every INSERT fails with
--   PGRST205 "Could not find the table 'public.settlements' in the schema cache".
-- Cause: the initial settlements migration created the table in Postgres, but
-- PostgREST never registered it in its in-memory schema cache, and the inline
-- `notify pgrst, 'reload schema'` didn't take. Same class of stale-cache issue
-- we hit on the initial tables.
--
-- Fix: drop + recreate. A fresh CREATE TABLE fires a DDL event that reliably
-- makes Supabase reload the PostgREST schema cache (the notify alone did not).
-- This is SAFE: no settlement has ever been written (every insert hit PGRST205),
-- so the table holds 0 rows. Forward-only; mirrors the original migration's
-- idempotent style, RLS, grants, and realtime membership.

drop table if exists public.settlements cascade;

create table public.settlements (
  id         uuid        primary key default gen_random_uuid(),
  trip_id    uuid        not null references public.trips (id)   on delete cascade,
  from_id    uuid        not null references public.members (id) on delete cascade,
  to_id      uuid        not null references public.members (id) on delete cascade,
  amount     numeric     not null check (amount > 0),  -- EGP
  created_at timestamptz not null default now()
);

create index if not exists settlements_trip_id_idx on public.settlements (trip_id);

grant select, insert, update, delete on public.settlements to anon, authenticated;

alter table public.settlements enable row level security;

drop policy if exists "public access to settlements" on public.settlements;
create policy "public access to settlements"
  on public.settlements
  for all
  to anon, authenticated
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'settlements'
  ) then
    alter publication supabase_realtime add table public.settlements;
  end if;
end $$;

notify pgrst, 'reload schema';
