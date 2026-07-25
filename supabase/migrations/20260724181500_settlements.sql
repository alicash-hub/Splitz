-- Eish & Malh — settlements (recorded real-world payments)
--
-- Forward-only. A settlement of `amount` from `from_id` to `to_id` records that a
-- debtor paid a creditor; computeBalances nets these out so debts clear and a trip
-- can reach "all settled". Settlements are plain records — no money moves through
-- the app, and they're deletable (undo). Mirrors the init migration's idempotent
-- style, RLS, grants, and realtime.

create table if not exists public.settlements (
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
