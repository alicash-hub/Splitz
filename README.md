# Bread & Salt (عيش وملح) — Product Requirements Document (v2)

**Author:** Ali
**Date:** June 17, 2026
**Status:** Ready to build MVP

-----

## 1. Origin Story

During a real picnic expense split with 7 friends, the group tried to manually calculate who owes whom and failed. Ali stepped in, did the math, and shared the result in the WhatsApp group. This triggered the question: is there a product here?

-----

## 2. Problem Statement

When a group of friends travels or goes out together, multiple people pay for different things throughout the trip. At the end (or during), someone needs to figure out the minimum set of transfers so everyone is even. This is:

- **Math-heavy** — most people can’t do it correctly by hand, especially with 5+ people and many transactions
- **Ongoing** — expenses happen over days, not all at once. By the end of a trip, people forget who paid for what
- **Currently solved with pen & paper, calculators, and WhatsApp messages** — the process is manual, error-prone, and time-consuming

-----

## 3. Problem Validation

### Is the problem real?

Yes. In our test case (7 people, 4 expenses), friends attempted manual calculation and failed. Ali has previously done this on pen and paper during a trip — it took significant time.

### Does Splitwise solve it?

Not well for the Egyptian market:

- **No local presence** — Splitwise traffic is heavily US-concentrated, no Arabic support, no Egyptian payment integrations (InstaPay, Vodafone Cash)
- **Aggressive paywalling** — Free tier limited to ~5 expenses/day with a 10-second cooldown. Pro costs $40–60/year
- **Requires everyone to sign up** — major friction when most people just want to see the running total
- **No “couples as a unit” concept** — a natural behavior in Egyptian friend groups (future feature)

### Competitive landscape

Tricount, Settle Up, Splid, Spliit — all Western-first, English-first. None target MENA. Tricount removed its premium tier entirely. The category struggles to monetize globally.

### Market assessment

Honest take: this is a “nice to have” — the travel use case is infrequent, and Egypt’s roommate culture is smaller than the US/Europe. But it’s worth building for personal and learning reasons (see Goals below).

-----

## 4. Key Behavioral Insight

Every friend group has one person who volunteers to track expenses. But the burden shouldn’t fall on one person. The ideal solution lets **anyone** in the group log an expense when they pay, and everyone can check the balance at any time. The “accountant” role disappears.

The natural home for this coordination is **WhatsApp** — that’s where the group communicates. So the tool’s output needs to be shareable there, and the entry point is a link shared in the group chat.

-----

## 5. Target User

**Any member of a friend group on a trip or shared outing.** The person who creates the trip shares a link, and anyone with the link can participate. No single “accountant” needed.

Likely profile:

- Tech-comfortable but not technical
- Based in Egypt / Arabic-speaking (but UI can be English-first for MVP)
- Uses WhatsApp as primary group communication
- Settles payments via InstaPay

-----

## 6. Why Build This (Personal Goals)

1. **Product experience** — end-to-end ownership from problem discovery to shipped product
1. **Personal brand** — every shared link is organic distribution
1. **Market discovery** — ship small, see what happens. Unexpected use cases may emerge
1. **Modest revenue potential** — if traffic grows, lightweight ads could generate small income (not a priority)

-----

## 7. Solution Overview

A **mobile-first web app** — no download, no install, works in any browser. Anyone can create a trip, share the link, and the group logs expenses collaboratively in real time.

### Core flow:

1. **Someone creates a trip** → gets a unique shareable URL (e.g., `app.com/t/abc123`)
1. **They share the link in WhatsApp**
1. **Each person opens the link** → asked to enter their name → cached in localStorage
1. **Anyone can log an expense** → who paid, how much, description
1. **Dashboard always shows:**
- All logged expenses
- Running balance per person
- Settlement plan (who sends how much to whom, minimum transfers)

### Identity system (no login):

- First visit to a trip: user enters their name → saved to localStorage and stored as a trip member
- Return visit: system recognizes them via localStorage, no prompt
- If cache is cleared: user picks their name from the existing member list, or adds a new name
- On name selection from list: show a confirmation (“You’re continuing as Yara — is that right?”) to prevent mis-taps

### What an expense looks like:

- **Who paid** (select from group members)
- **Amount** (in EGP)
- **What for** (short description, e.g., “Lunch at the resort”)
- **Date/time** (auto-filled, editable)
- **Split type**: split equally among everyone (MVP default)

-----

## 8. Design Direction

**Inspiration: Airbnb.** Clean, minimal, generous white space, friendly but not childish. The design should feel trustworthy and simple — like a tool that “just works.”

### Design principles:

- **Mobile-first** — designed for phones in portrait mode. Everything reachable with one thumb
- **Generous spacing** — don’t cram. Let elements breathe
- **Clean typography** — use Inter or system fonts. Clear hierarchy: one big number, supporting text below
- **Soft, rounded UI** — rounded corners on cards and buttons (8–12px radius), subtle shadows
- **Warm neutral palette** — white/off-white backgrounds, dark gray text, one accent color for CTAs and key numbers
- **Cards as the primary UI pattern** — each expense is a card, each person’s balance is a card
- **Bottom-anchored primary action** — “Add expense” button fixed at the bottom of the screen, always visible, like a FAB (floating action button)
- **No clutter** — no sidebars, no nav menus, no settings pages for MVP. One screen does the job
- **Friendly micro-copy** — “Who paid?”, “What was it for?”, “Here’s where everyone stands”

### Color palette (suggested starting point):

- Background: `#FFFFFF` / `#F7F7F7`
- Text: `#222222` (primary), `#717171` (secondary — Airbnb’s exact secondary gray)
- Accent: a single warm color for CTAs and highlights (coral, teal, or similar — pick one)
- Positive balance (gets money back): green
- Negative balance (owes money): soft red/coral
- Cards: white with subtle `box-shadow`

### Key screens:

**1. Home / Create Trip**

- App name/logo
- “Start a new trip” button
- Field for trip name
- That’s it. Nothing else.

**2. Trip Dashboard (the main screen)**

- Trip name at top
- Member avatars/initials in a row
- Balance summary: each person’s net balance shown clearly (positive = green, negative = red)
- “Settle up” section: the minimum transfers needed, copy-pasteable
- Expense list below: cards showing who paid, what, how much, when
- Floating “Add expense” button at bottom

**3. Add Expense (bottom sheet or modal)**

- Who paid (tap to select from member list)
- Amount (big number input, EGP)
- What for (text field)
- “Add” button
- Split equally among everyone (no options for MVP — just auto-split)

**4. Join Trip (when someone opens a shared link)**

- Trip name shown
- “What’s your name?” input
- “Join” button
- Or: “Already here? Pick your name” → shows existing member list with confirmation

-----

## 9. Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend/Database:** Supabase (free tier — real-time database, no server to manage)
- **Hosting:** Vercel (free tier — deploys from Git, gives you a URL)
- **State management:** React state + Supabase real-time subscriptions
- **No auth** — identity handled via localStorage + trip membership

### Database schema (Supabase):

**`trips`**

|Column    |Type     |Notes                                   |
|----------|---------|----------------------------------------|
|id        |uuid     |Primary key, auto-generated             |
|name      |text     |Trip name                               |
|slug      |text     |Short unique ID for URL (e.g., “abc123”)|
|created_at|timestamp|Auto                                    |

**`members`**

|Column    |Type     |Notes              |
|----------|---------|-------------------|
|id        |uuid     |Primary key        |
|trip_id   |uuid     |Foreign key → trips|
|name      |text     |Display name       |
|created_at|timestamp|Auto               |

**`expenses`**

|Column     |Type     |Notes                   |
|-----------|---------|------------------------|
|id         |uuid     |Primary key             |
|trip_id    |uuid     |Foreign key → trips     |
|paid_by    |uuid     |Foreign key → members   |
|amount     |numeric  |Amount in EGP           |
|description|text     |What the expense was for|
|created_at |timestamp|Auto                    |

### Settlement algorithm:

1. Calculate total expenses
1. Calculate per-person fair share (total ÷ number of members)
1. For each person: net balance = what they paid − fair share
1. Positive balance = they overpaid (get money back)
1. Negative balance = they underpaid (owe money)
1. Greedily match the largest debtor with the largest creditor to minimize transfers

-----

## 10. MVP Scope

### Must-haves:

- [x] Create a trip with a name
- [x] Shareable link (unique slug)
- [x] Join a trip by entering your name
- [x] Cache identity in localStorage
- [x] Pick from existing members if cache cleared (with confirmation)
- [x] Block duplicate names (case-insensitive)
- [x] Add an expense (who paid, amount, description)
- [x] Edit/delete any expense
- [x] View all expenses
- [x] View per-person balance
- [x] View settlement plan (minimum transfers)
- [x] Mobile-first responsive design
- [x] Copy settlement summary to clipboard

### Nice-to-haves (post-MVP):

- Avatars or uploaded profile pictures
- Couples as a single unit
- Multi-currency support
- WhatsApp share button (deep link)
- Arabic RTL support
- Receipt photo → auto-extract amounts (AI)
- Expense categories
- Trip history / archive

### Out of scope:

- Payment integration (InstaPay/Vodafone Cash)
- Native mobile app
- User accounts / authentication
- Monetization

-----

## 11. Success Metrics

|Metric                         |What it tells us                                              |
|-------------------------------|--------------------------------------------------------------|
|**Trips created**              |Are people finding and using it?                              |
|**Expenses per trip**          |Are groups actually logging throughout the trip?              |
|**Members per trip**           |Are people sharing the link?                                  |
|**Return visits**              |Does the same trip get revisited?                             |
|**Settlement copies**          |Is the output useful enough to share?                         |
|**New trips from shared links**|Organic growth — did a participant start their own trip later?|

-----

## 12. Open Questions (Resolved)

- **Name:** Bread & Salt (عيش وملح) — a culturally meaningful Arabic expression about shared trust and hospitality
- **Should expenses be deletable/editable in MVP?** Yes. Anyone can edit or delete any expense — it’s a trusted friend group, keep it simple.
- **What happens if two people have the same name?** The system blocks exact duplicate names (case-insensitive) and prompts the person to differentiate (e.g., add a last initial).
- **Should there be a trip “owner” with admin powers?** No for MVP. Everyone is equal. Revisit if real usage shows a need for admin controls.

-----

*This PRD was developed through a structured problem validation conversation, starting from a real expense-splitting scenario and working through competitive analysis, behavioral 
