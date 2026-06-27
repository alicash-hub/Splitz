# CLAUDE.md

Guidance for Claude Code (and any contributor) working in this repository. This
is the working reference for everything we build. The full product rationale
lives in [README.md](./README.md) (the PRD); this file is the build-facing
distillation.

## What we're building

**Bread & Salt (عيش وملح)** — a mobile-first web app for splitting group
expenses on trips and outings. Anyone in a group can log an expense; everyone
can see the running balance and the minimum set of transfers needed to settle
up. No login, no install — share a link in WhatsApp and go.

- **Target user:** any member of a friend group on a trip. Egypt / Arabic-speaking
  market first (UI is English-first for MVP). Settles via InstaPay.
- **Status:** pre-code. Building the MVP from the PRD.
- **Core principle:** no "accountant." Anyone logs an expense, anyone checks the
  balance, everyone is equal — no admin/owner role in MVP.

## Tech stack

- **Frontend:** React + Tailwind CSS
- **Backend / DB:** Supabase (real-time Postgres, free tier — no server to manage)
- **Hosting:** Vercel (deploys from Git)
- **State:** React state + Supabase real-time subscriptions
- **Auth:** none. Identity = name in `localStorage` + a row in the `members` table.

- **Build tool:** Vite 6 (React 19, `@vitejs/plugin-react`)
- **Routing:** React Router (`react-router-dom`)
- **Tailwind:** v4, wired via the `@tailwindcss/vite` plugin. There is **no**
  `tailwind.config.js` — design tokens live in `@theme` inside `src/index.css`.
- **Tests:** Vitest

Commands (verified working):

```
npm install      # install deps
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # ESLint (flat config in eslint.config.js)
npm test         # Vitest (run once); npm run test:watch for watch mode
```

> Keep this section honest: update it the moment scripts change, and don't claim a
> command works until it's been run.

## Project structure

```
src/
  components/        # reusable UI (cards, buttons, bottom sheet, …)
  pages/            # route-level screens (Home, TripDashboard, JoinTrip)
  hooks/            # custom React hooks (e.g. useLocalStorage, useTrip)
  lib/
    supabaseClient.js  # single shared Supabase client (reads VITE_ env vars)
    settlement.js      # pure settlement algorithm — UI-free + unit-tested
  App.jsx
  main.jsx
  index.css         # Tailwind import + @theme design tokens
.env.example        # template for Supabase env vars (copy to .env.local)
```

### Environment variables

Supabase config is read from Vite env vars (only `VITE_`-prefixed vars reach the
client). Copy `.env.example` → `.env.local` and fill in:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (anon key only — never the `service_role` key)

`.env.local` is gitignored. The anon key is safe in the browser because access is
gated by Supabase Row Level Security.

## Core user flow

1. Someone creates a trip → gets a unique shareable URL (`app.com/t/<slug>`).
2. They share the link in WhatsApp.
3. Each person opens the link → enters their name → cached in `localStorage`.
4. Anyone logs an expense: who paid, amount (EGP), description.
5. Dashboard always shows: all expenses, per-person net balance, and the
   settlement plan (who sends how much to whom).

### Identity (no login)

- **First visit:** user enters name → saved to `localStorage` + inserted as a
  trip member.
- **Return visit:** recognized via `localStorage`, no prompt.
- **Cache cleared:** user picks their name from the existing member list, with a
  confirmation ("You're continuing as Yara — is that right?") to prevent mis-taps.
- **Duplicate names:** block exact duplicates case-insensitively; prompt the user
  to differentiate (e.g., add a last initial).

## Data model (Supabase)

**`trips`** — `id` (uuid, pk), `name` (text), `slug` (text, unique short id for
the URL), `created_at` (timestamp).

**`members`** — `id` (uuid, pk), `trip_id` (uuid → trips), `name` (text display
name), `created_at` (timestamp).

**`expenses`** — `id` (uuid, pk), `trip_id` (uuid → trips), `paid_by` (uuid →
members), `amount` (numeric, EGP), `description` (text), `created_at` (timestamp).

Split is **equal among all members** for MVP — no per-expense split config.

### Migrations

Schema lives in `supabase/migrations/` as timestamped SQL files. Supabase is
connected to this GitHub repo and **auto-applies migrations on push** — so a
migration is a forward-only change: never edit an applied file, add a new one.
RLS is enabled on all tables with permissive public (anon) read/write policies
for the MVP (no auth). All three tables are added to the `supabase_realtime`
publication so the dashboard can subscribe to live changes. A case-insensitive
unique index on `members (trip_id, lower(name))` enforces the no-duplicate-names
rule at the DB level.

Deleting a member or trip **cascades** (removes their expenses too). We keep this
at the DB level and put the safety where it belongs — in the **UX**: deleting a
member is a destructive action that must be hard to do by mistake (confirm step,
and surface that their expenses go with them). Don't rely on the database to
second-guess the user.

## Settlement algorithm

1. Sum all expenses for the trip.
2. Fair share per person = total ÷ number of members.
3. For each member: net balance = (what they paid) − (fair share).
4. Positive balance = overpaid → gets money back. Negative = underpaid → owes.
5. Greedily match the largest debtor with the largest creditor, repeating until
   everyone is settled, to minimize the number of transfers.

Keep this logic isolated and unit-tested — it's the heart of the product and the
thing people get wrong by hand.

## Design direction

Theme: **Azure** — a Duolingo-flavored sky-blue look on an Airbnb-clean structure:
friendly, trustworthy, mobile-first. Design tokens live in `@theme` in
`src/index.css`.

- **Mobile-first** — portrait, one-thumb reachable. Primary "Add expense" action
  is bottom-anchored (FAB-style), always visible.
- **Cards** are the primary UI pattern — one card per expense, one per balance.
- **Typography:** **Plus Jakarta Sans** (`--font-display`) for headings and big
  numbers (weight 800); **Nunito** (`--font-sans`) for body. One big number,
  supporting text below.
- **Chunky offset shadows** instead of blurry drop shadows: hero `0 4px 0`,
  buttons `0 3px 0` (with an `active:translate-y` press), cards `0 2px 0`, all in
  the relevant `*-shadow` token. Corner radius is 18px (`--radius-card`).
- **No clutter:** no sidebars, nav menus, or settings pages in MVP.
- **Friendly micro-copy:** "Who paid?", "What was it for?", "Here's where
  everyone stands".

### Palette (Azure)

- Background: `#FFFFFF` (`--color-bg`) / `#F4F8FB` blue-tinted surface (`--color-surface`)
- Text: `#1D2A3A` (`--color-text`), `#9AACC0` muted (`--color-text-muted`)
- Border / card offset-shadow: `#E7EDF3` (`--color-border`)
- Chip (avatar/emoji tiles): `#DCEFFF` (`--color-chip`)
- Accent (brand blue, CTAs): `#1CB0F6` (`--color-accent`), darker `#1483CC` for
  hover/shadow; secondary violet `#7B61FF` (`--color-accent2`) for links like "Copy"
- **Balance semantics: positive (owed / gets back) = brand BLUE** (`--color-positive`,
  same as accent); **negative (owes) = red** `#FF5A5F` (`--color-negative`)
- Cards: white with a chunky border + offset shadow (no blurry box-shadow)

### Key screens

1. **Home / Create trip** — app name, trip-name field, "Start a new trip". Nothing else.
2. **Trip dashboard** — trip name, member initials row, per-person balances
   (blue = owed / red = owes), settle-up section (copyable minimum transfers),
   expense list, floating "Add expense".
3. **Add expense** (bottom sheet/modal) — who paid, amount, description, "Add".
4. **Join trip** — trip name, "What's your name?", "Join"; or "Already here? Pick
   your name" with confirmation.

## MVP scope

**In:** create trip; shareable slug link; join by name; cache identity in
`localStorage`; pick from members if cache cleared (with confirmation); block
case-insensitive duplicate names; add/edit/delete any expense; view expenses,
per-person balance, and settlement plan; copy settlement summary to clipboard;
mobile-first responsive design.

Anyone can edit or delete any expense — it's a trusted friend group, keep it simple.

**Out (do not build for MVP):** payment integration (InstaPay/Vodafone Cash),
native app, user accounts/auth, monetization.

**Post-MVP (don't pull forward without a reason):** avatars, couples-as-a-unit,
multi-currency, WhatsApp share deep link, Arabic RTL, receipt-photo AI extraction,
expense categories, trip history/archive.

## Working conventions

- **Honor MVP boundaries.** If a request touches out-of-scope or post-MVP items,
  flag it before building.
- **Currency is EGP** everywhere in MVP.
- **Keep the settlement logic pure and tested**, separate from UI.
- **Match the surrounding code** once it exists — naming, structure, idiom.
- **Keep this file current.** When the stack is scaffolded or decisions change
  (e.g., the accent color, real npm scripts), update CLAUDE.md in the same change.
