-- Eish & Malh — per-expense split ("who's in on this")
--
-- Adds an optional list of member ids an expense is split among. NULL means the
-- whole trip splits it (the default and every existing row). computeBalances
-- divides each expense equally among its participants.
--
-- No new grants/RLS/realtime needed — those are table-level and already cover
-- expenses. Additive and backfill-free (existing rows stay NULL = everyone).

alter table public.expenses
  add column if not exists split_between uuid[];

comment on column public.expenses.split_between is
  'Member ids this expense is split among; NULL = everyone in the trip.';

notify pgrst, 'reload schema';
