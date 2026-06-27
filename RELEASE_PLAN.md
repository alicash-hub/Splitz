# Eish & Malh — Prototype → Production Rollout Plan

A sequenced plan to land the redesign into the `alicash-hub/Splitz` codebase **one
release at a time**, smallest blast-radius first, so Claude Code is never
overwhelmed. Each release is independently shippable, reviewable, and reversible.

The prototype is `Splitz.dc.html` (the four-theme explorer). **Production uses one
theme: Azure** (sky-blue brand, green = owed / red = owe). The theme *switcher* and
the other three palettes are prototyping scaffolding — **do not port them.**

---

## How the prototype differs from `main` (the gap analysis)

| Area | Today in the repo | Prototype | Type of change |
|---|---|---|---|
| **Visual system** | Inter, coral `#ff5a5f`, 12px radius, flat subtle shadows, Airbnb-clean | Baloo 2 + Nunito, Azure blue, 18px radius, chunky `0 4px 0` offset-shadow buttons, bright chips | Restyle — `index.css` tokens + component classes |
| **Balance semantics** | green/red already correct | same, plus a single **hero "You're owed / You owe"** summary for the current user | New derived UI |
| **Home** | app name + trip-name field + button only | + **"Your trips"** recents list, + **"Join an existing group"** | New features (localStorage history, join-by-code) |
| **Join** | only via `/t/:slug` link | + manual **group-code** entry from Home | New feature |
| **Share** | `SettlementSection` copies settlement text | **Share sheet**: invite link **+ group code** + copy message | New component |
| **Dashboard** | per-person `BalanceCard` list + read-only `SettlementSection` | hero card, settle-up rows **with CTAs**, expenses+settlements merged into **Activity** | Restructure |
| **Settle up** | **read-only** (display + copy) | **"Settle up / Mark received"** → confirm → **records a settlement**, nets balances, "all settled" state | **DB migration + algorithm + UI** |

Everything except the last row is presentation/client-state only. The settle-up
recording is the sole change that touches the database and the tested core
algorithm — which is why it ships last.

---

## Release sequence

1. **R1 — Visual refresh** (tokens + component restyle). Foundation; pure CSS/markup.
2. **R2 — Home revamp** (recent-trips history + restyled create card).
3. **R3 — Sharing & joining by code** (share sheet + manual code entry).
4. **R4 — Dashboard restructure** (hero summary + Activity + settle-up row styling).
5. **R5 — Settle up recording** (new `settlements` table + algorithm + confirm sheet). The big one, last.

Optional polish (fold in anywhere or skip): per-trip emoji, auto-emoji on expenses,
numeric keypad in Add Expense.

Each release below has: **scope**, **files**, and a **copy-paste prompt** for Claude
Code. Send the prompt, let it open a PR, review, merge, then move on. Attach
`Splitz.dc.html` (or per-screen screenshots) to the chat as the visual reference.

---

## R1 — Visual refresh

**Goal:** the existing app, restyled to Azure. No new screens, no data changes.
Display font is **Plus Jakarta Sans** (modern, fintech-trustworthy); body stays **Nunito**.
Shadows are the **softened** tier (see the offset values in the prompt).

**Files:** `src/index.css` (tokens), `index.html` (font links), and the className
restyle across `src/components/*` and `src/pages/*`. `CLAUDE.md` palette/typography
section.

**Exact Azure tokens** (drop into the `@theme` block in `src/index.css`):

```css
@theme {
  --color-bg: #ffffff;
  --color-surface: #f4f8fb;     /* light blue-tinted, replaces warm gray */
  --color-text: #1d2a3a;
  --color-text-muted: #9aacc0;
  --color-border: #e7edf3;      /* NEW — hairline + chunky-shadow color */
  --color-chip: #dcefff;        /* NEW — avatar/emoji tile background */

  --color-accent: #1cb0f6;      /* primary brand blue */
  --color-accent-hover: #1483cc;
  --color-accent-shadow: #1483cc; /* NEW — offset shadow under blue buttons */
  --color-accent2: #7b61ff;     /* NEW — violet, for secondary links (e.g. Copy) */

  --color-positive: #1cb0f6;    /* BLUE (brand) = owed / gets back */
  --color-positive-shadow: #1483cc; /* NEW */
  --color-negative: #ff5a5f;    /* red = owes */
  --color-negative-shadow: #d8474c; /* NEW */

  --radius-card: 18px;
  --font-sans: "Nunito", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Plus Jakarta Sans", var(--font-sans); /* NEW — headings & numbers */
}
```

**Prompt to send Claude Code:**

```
We're rebranding the app's look to "Azure" — a Duolingo-flavored sky-blue theme —
keeping the Airbnb-clean structure intact. This release is VISUAL ONLY: no new
screens, no routing changes, no data/schema changes.

1. Replace the @theme tokens in src/index.css with the Azure token set below
   (note the NEW tokens: --color-border, --color-chip, --color-accent-shadow,
   --color-accent2, --color-positive-shadow, --color-negative-shadow, --font-display).
   [paste the @theme block from RELEASE_PLAN.md R1]

2. Load fonts in index.html <head>:
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">

3. Apply the new visual language across existing components/pages:
   - Headings and big numbers use font-display (Plus Jakarta Sans), weight 800.
   - Primary buttons: solid accent, white text, a softened offset shadow
     (shadow-[0_3px_0_var(--color-accent-shadow)]), and an active press
     (active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-accent-shadow)]).
     Apply the same pattern to positive/negative buttons with their *-shadow tokens.
   - Cards: bg-bg, border border-[var(--color-border)], rounded-card, a soft
     offset shadow (shadow-[0_2px_0_var(--color-border)]) instead of the blurry
     drop shadow. The big balance hero is the heaviest at shadow-[0_4px_0_...].
   - Member initials / emoji tiles sit on bg-chip.
   - The "Copy for WhatsApp" link uses accent2 (violet).
   - Balance semantics: positive (owed / gets back) uses the brand BLUE
     (--color-positive == accent), negative (owes) stays red. NOTE this changes
     the repo's current green-positive to blue — update the token value accordingly.

4. Update the Design direction + Palette sections of CLAUDE.md to describe Azure
   (Plus Jakarta Sans + Nunito, sky-blue accent, chunky offset shadows, blue=owed / red=owes
   balance semantics) so the file stays the source of truth.

Do NOT add a theme switcher or any alternate palettes. One theme: Azure.
Run npm run lint and npm run build before opening the PR.
```

---

## R2 — Home revamp

**Goal:** Home gains a **"Your trips"** recents list and a restyled create-trip card.

**Why a new lib:** the repo keeps no local trip history (identity is per-trip in
`localStorage` only). Add a tiny `recent-trips` store and write to it when a trip is
created and when one is opened.

**Files:** new `src/lib/recentTrips.js`; `src/pages/Home.jsx`; `src/lib/trips.js`
(or `TripPage.jsx`) to record a visit; reuse `getTripBySlug`.

**Prompt:**

```
Add a "Your trips" section to the Home page, backed by a small localStorage store.
Visual language is the Azure theme from the previous release.

1. New file src/lib/recentTrips.js — a guarded localStorage helper (mirror the
   try/catch storage() pattern in src/lib/identity.js). Key e.g.
   "breadsalt:recent-trips". Expose:
     - rememberTrip({ id, name, slug }) — upsert to the FRONT, de-dupe by slug, cap ~8.
     - listRecentTrips() -> array (most-recent first).
   Store only id, name, slug, and lastOpenedAt. No expense data.

2. Call rememberTrip in two places:
     - after createTrip succeeds in Home.jsx (before navigate),
     - when TripPage successfully loads a trip by slug.

3. Home.jsx: above (or below) the create form, render a "Your trips" list when
   listRecentTrips() is non-empty. Each row: trip name + a muted "Open" affordance,
   styled as an Azure card (chunky border-shadow), tapping navigates to /t/<slug>.
   When empty, render nothing (no placeholder).

4. Keep the create-trip flow exactly as-is functionally; only restyle to match.

This is client-only — no schema or settlement changes. The recents list is a local
convenience, NOT a synced "my trips" feature; don't add a backend for it.
Run npm run lint and npm run build. Add a Vitest spec for recentTrips.js
(upsert/de-dupe/cap).
```

---

## R3 — Sharing & joining by code

**Goal:** the two halves of "spread the link" — a **share sheet** that surfaces the
invite link AND the group code, and a Home entry to **join by typing the code**.

**Key fact:** the group code *is* the slug (`src/lib/slug.js`, 6 chars, unambiguous
alphabet). "Find group" just navigates to `/t/<code>` — `TripPage` already gates
join/dashboard. No backend needed beyond the existing `getTripBySlug`.

**Files:** new `src/components/ShareSheet.jsx`; new `src/pages/JoinByCode.jsx` (+
route in `App.jsx`) or a small inline section on Home; `src/components/SettlementSection.jsx`
(or dashboard header) to trigger the share sheet.

**Prompt:**

```
Two related additions. Azure visual language throughout. No schema changes.

A) Share sheet (src/components/ShareSheet.jsx): a bottom sheet (reuse the
   animate-overlay / animate-sheet pattern from AddExpense.jsx) that shows:
     - heading "Invite the group"
     - the invite link: `${window.location.origin}/t/${trip.slug}`
     - the group code (trip.slug, displayed UPPERCASE, letter-spaced)
     - a "Copy message" button that copies a WhatsApp-ready string:
         Join our "<trip name>" trip on Eish & Malh 👋
         <invite link>
         …or join with group code <CODE>
   Trigger it from the trip dashboard (e.g. an invite "+" by the member initials,
   and/or a Share button near Settle up). Keep the existing "Copy for WhatsApp"
   settlement-summary copy as a separate action.

B) Join by code: add a "Join an existing group" entry on Home that opens a code
   input (its own route /join is fine, or an inline panel). On submit, normalize
   the input (trim, lowercase, strip spaces/dashes) and navigate to /t/<code>.
   Let TripPage's existing not-found handling cover bad codes — don't duplicate the
   lookup. The code equals the slug; reuse it directly.

Friendly micro-copy, mobile-first, one-thumb reachable. Run npm run lint and build.
```

---

## R4 — Dashboard restructure

**Goal:** reshape the dashboard to the prototype: a **hero summary** for the current
user, settle-up rows styled with (inert for now) CTA affordances, and expenses shown
as an **Activity** list. Still presentation + derived state — no schema, no recording
yet (that's R5).

**Files:** `src/pages/TripDashboard.jsx`; new `src/components/BalanceHero.jsx`;
restyle `src/components/SettlementSection.jsx`, `ExpenseCard.jsx`. `BalanceCard.jsx`
moves into the member detail (or a collapsible "per-person" section).

**Derived hero value:** from `computeBalances(members, expenses)`, take the current
member's `net`. `net > 0` → "You're owed" (blue/brand hero); `net < 0` → "You owe" (red
hero); `≈ 0` → "You're all settled".

**Prompt:**

```
Restructure the trip dashboard to match the prototype. Presentation + derived state
only — do NOT change settlement.js, useTripData, or any data/schema. Azure theme.

1. New src/components/BalanceHero.jsx: a big rounded hero card showing the CURRENT
   user's net (from the existing computeBalances result — find the row whose
   memberId === memberId prop). net>0 → label "You're owed", brand-blue bg
   (--color-positive, the accent blue) with --color-positive-shadow offset; net<0 → "You owe", red
   bg; ~0 → "You're all settled" + a cheerful subline. Big number in font-display.

2. In TripDashboard.jsx, replace the "Where everyone stands" list of BalanceCards
   at the top with <BalanceHero>. Keep per-person balances reachable (e.g. a
   "Per person" collapsible below, or via the existing MemberSheet) — don't delete
   that information, just demote it.

3. Restyle SettlementSection rows to the prototype's settle-up cards: from-avatar →
   arrow → to-avatar, names, amount in brand blue when the current user receives. Add a
   full-width CTA button on rows that INVOLVE the current user — label "Settle up"
   when they pay, "Mark received" when they receive. For now the button can be a
   no-op / disabled placeholder; R5 wires it up. Rows between two OTHER people get
   NO button.

4. Merge the expense list into an "Activity" section (keep ExpenseCard, restyle to
   Azure). Keep the bottom-anchored Add expense FAB and the swipe-to-edit/delete.

Keep computeBalances/minimizeTransfers untouched. Run npm run lint and build.
```

---

## R5 — Settle up recording (the big one)

**Goal:** make "Settle up / Mark received" actually record a settlement, net it out
of balances, log it in Activity, and reach the "all settled" state. This touches the
**database**, the **tested core algorithm**, the **data hook**, and **UI**. Ship it
alone, after everything else is stable.

**Files:** new migration `supabase/migrations/<timestamp>_settlements.sql`; new
`src/lib/settlements.js`; `src/lib/settlement.js` (+ its test); `src/hooks/useTripData.js`;
the confirm sheet + CTA wiring in `TripDashboard.jsx` / `SettlementSection.jsx`;
`CLAUDE.md` data-model + algorithm sections.

**Schema** (forward-only new file — never edit the init migration; mirror its
idempotent style, RLS, grants, realtime publication):

```sql
create table if not exists public.settlements (
  id         uuid        primary key default gen_random_uuid(),
  trip_id    uuid        not null references public.trips (id)   on delete cascade,
  from_id    uuid        not null references public.members (id) on delete cascade,
  to_id      uuid        not null references public.members (id) on delete cascade,
  amount     numeric     not null check (amount > 0),  -- EGP
  created_at timestamptz not null default now()
);
create index if not exists settlements_trip_id_idx on public.settlements (trip_id);
-- + grants to anon/authenticated, RLS enable + "public access" policy,
-- + add to supabase_realtime publication, + notify pgrst 'reload schema'
-- (copy the exact patterns from 20260618084350_init_schema.sql)
```

**Algorithm change:** a recorded settlement of `amount` from A→B means A has paid
down their debt, so it should move A's net **up** by `amount` and B's net **down** by
`amount` before minimizing transfers. Decide explicitly (and TEST) whether
`computeBalances` takes a third `settlements` arg, or a new wrapper nets them in.
Recommended: extend `computeBalances(members, expenses, settlements = [])` so nets
still sum to zero; keep integer-piastre arithmetic.

**Prompt:**

```
Implement "Settle up" — recording real-world payments so debts clear. This is the
one release that changes the database and the core algorithm, so go carefully and
keep the settlement logic pure and fully tested (per CLAUDE.md).

1. Migration: add supabase/migrations/<new-timestamp>_settlements.sql creating a
   `settlements` table (trip_id, from_id, to_id, amount>0, created_at). It is
   FORWARD-ONLY — do not touch the existing init migration. Mirror that file's
   idempotent style EXACTLY: grants to anon+authenticated, enable RLS + a permissive
   "public access to settlements" policy, add the table to the supabase_realtime
   publication (guarded), and notify pgrst to reload. Schema below:
   [paste the SQL from RELEASE_PLAN.md R5]

2. src/lib/settlements.js: addSettlement(tripId, { fromId, toId, amount }) and
   listSettlements(tripId), following the supabase patterns in lib/expenses.js.

3. settlement.js: extend computeBalances to accept a third arg
   `settlements = []`. Each settlement moves from_id's net UP and to_id's net DOWN
   by amount (in piastres) so nets still sum to exactly zero. Update
   settlement.test.js with cases: a partial-debt payment is NOT in scope, but a
   full settlement of a transfer should make that pair disappear from
   minimizeTransfers and not create a reverse debt. Keep integer-piastre math.

4. useTripData.js: also fetch settlements and subscribe to their realtime changes,
   returned alongside expenses; expose a refreshSettlements().

5. UI: wire the R4 CTA buttons. "Settle up"/"Mark received" opens a confirm sheet:
   the other person's avatar, "Did you pay <name>?" (or "Did <name> pay you?"), the
   amount, the honest line "This just records it for the group — no money moves
   through the app.", and Mark as paid / Cancel. On confirm, call addSettlement with
   the FULL transfer amount (no partial payments this release), close, toast
   "Settled with <name> ✓". Balances recompute via the extended computeBalances; the
   row leaves Settle up; show settlements in the Activity list (🤝 "<A> paid <B>",
   "Settled up") and collapse to "All settled up 🎉" when no transfers remain.

   IMPORTANT: no payment-method selection (Cash/Instapay/etc) — out of scope.
   Partial payments are deferred to a later release; settle the full transfer only.

6. Update CLAUDE.md: add `settlements` to the data model, and note that
   computeBalances nets recorded settlements. Keep MVP "out of scope" honest
   (still no payment integration — settlements are just records).

Run npm test (settlement specs must pass), npm run lint, npm run build.
```

---

## Notes for working with Claude Code

- **One release per PR.** Don't let it batch R1–R5; review and merge each before the next.
- **Attach the visual reference** (`Splitz.dc.html` or per-screen screenshots) so it
  matches spacing/shape, not just tokens.
- **Migrations are live on push** — R5's migration auto-applies to Supabase. Confirm
  the table appears before wiring the UI, and never edit an applied migration file.
- **Keep `CLAUDE.md` current** each release — it's the repo's source of truth and what
  Claude Code reads first.
- **Decisions already locked:** direction = **Azure** (sky-blue); display font = **Plus
  Jakarta Sans**, body = Nunito; **softened** offset shadows (hero 4px, buttons 3px,
  cards 2px); owed = brand blue, owe = red; no payment
  methods; no partial payments yet; recents list is local-only; group code = slug.
