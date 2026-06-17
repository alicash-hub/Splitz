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

When the toolchain is scaffolded, document the real commands here:

```
# dev server     — TODO once scaffolded (likely `npm run dev`)
# build          — TODO
# lint           — TODO
# test           — TODO
```

> Keep this section honest: update it the moment scripts exist, and don't claim a
> command works until it's been run.

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

Inspiration: **Airbnb.** Clean, minimal, generous whitespace, trustworthy.

- **Mobile-first** — portrait, one-thumb reachable. Primary "Add expense" action
  is bottom-anchored (FAB-style), always visible.
- **Cards** are the primary UI pattern — one card per expense, one per balance.
- **Typography:** Inter or system fonts. Clear hierarchy: one big number,
  supporting text below.
- **Soft, rounded UI:** 8–12px corner radius, subtle shadows.
- **No clutter:** no sidebars, nav menus, or settings pages in MVP.
- **Friendly micro-copy:** "Who paid?", "What was it for?", "Here's where
  everyone stands".

### Palette

- Background: `#FFFFFF` / `#F7F7F7`
- Text: `#222222` (primary), `#717171` (secondary)
- Accent: one warm color for CTAs/highlights (coral or teal — pick one and keep it)
- Positive balance (gets money back): green
- Negative balance (owes): soft red/coral
- Cards: white with subtle `box-shadow`

### Key screens

1. **Home / Create trip** — app name, trip-name field, "Start a new trip". Nothing else.
2. **Trip dashboard** — trip name, member initials row, per-person balances
   (green/red), settle-up section (copyable minimum transfers), expense list,
   floating "Add expense".
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
