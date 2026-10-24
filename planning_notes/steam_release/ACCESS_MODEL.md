# Access model: events as the unit of access

Status: draft, 2026-10-24, from the round-3 answers (`OPEN_QUESTIONS.md`). This replaces the
Product, PlanProduct and OrgProduct tables in `ENTITLEMENTS.md`. The Steam sign-in, key and
store-rule parts of that file still stand.

## The idea

Hacktivity already sells events: courses, hackboxes and games that people play directly, and pools
that org managers copy into events their org owns. So **an event is the product**. No Product
model is needed. What's missing is a way to say "this user may play this event" for reasons other
than an individual subscription, and "this org plan may copy or play these events".

## Pieces

**1. EventEntitlement** (new): `user_id, event_id, source, source_ref, starts_at, ends_at,
revoked_at`, with `source` in `steam | google_play | grant`.

- Steam: the Licence to Hack app maps to one game event. Linking a Steam account that owns the app
  creates the row; the ownership recheck at sign-in revokes it.
- Play: the same, from a verified Play Billing purchase.
- `grant`: an admin gives one person one event (press, a prize, a support fix).
- Kept apart from `results`, which is the sign-up and scoring table (`Event has_many :users,
  through: :results`). Linking also signs the user up to the event, so they appear in it as now.

**2. PlanEvent** (new): `plan_id, event_id, grant`, with `grant` in `play | copy`.

- `play`: the plan's holders can play this `open_subscription` event directly.
- `copy`: the plan's org managers can copy this event into their org.
- A plan with **no** PlanEvent rows keeps today's behaviour: it grants every `open_subscription`
  event (P3: Pro and Premium are unchanged). Only new, narrower plans list events.

**3. Org tier** = an org plan plus its PlanEvent rows. Manual deals pick a plan on the org form,
beside the existing seats and end date (T2).

## Access checks

`GameSlotPolicy#start?` and `SecGenBatchPolicy#assign_vm_set?` for an `open_subscription` event
become: any of

- an individual subscription (active, trialing or cancelling: Q2) whose plan grants the event
  (no PlanEvent rows, or a `play` row for it);
- a seated org member (T4) whose org's current plan has a `play` row for the event;
- an unrevoked EventEntitlement for the event;
- the free-access window, as now.

`org_members` events (org copies) keep today's rule: a seated member of the owning org (T3). Their
access was decided when the manager copied them.

## Copying (O1, O2)

- The copy screen lists every copyable event, with the ones outside the org's plan shown but not
  selectable (O2 note).
- "Copyable" means a `copy` PlanEvent row on some org plan. That makes game events copyable without
  turning them into pools. Today a pool becomes a course when copied, and other types keep their
  type, so a copied game stays a game, with its slots and VM batches.
- `EventPolicy#copy_event?` adds: the source event has a `copy` row on the org's current plan.

## VM quota (Q1)

`has_premium_quota?` today gives premium to any seated org member. Change that branch to use the
org's current plan: `plan.user_role == 'premium'`. Tiers with no VM content (awareness, incident
response) are seeded with a non-premium role and give guest quota. Steam and Play owners get guest
quota with the claim wait lifted inside their entitled event (D1), or whichever is more generous
if they also subscribe (D7).

## Ending deals (T5)

Leave as today: members keep their role when a deal ends, so it can be sorted out with the org by
hand. Suggested small addition: an admin list of orgs whose deal has ended but still have seated
members, so these cases are noticed.

## Rollout (Q3)

One release with migrations, tests and a per-org check list:

1. Migrations: `event_entitlements`, `plan_events`; plan choice on orgs.
2. Seed the new plans and their PlanEvent rows. Existing plans get no rows, so nothing changes for
   current subscribers.
3. Tests per access path: individual (each status), org member (seated, unseated, lapsed), Steam,
   Play, grant, free window, copy limits.
4. Per-org check list: for each current org, which plan it moves to and what its members can play
   before and after.

All of this is Hacktivity work: ask before editing, and commit on main.

## Pricing (to discuss; round 4)

Working figures from the user: Steam and Play games at about £10, a games-only Stripe plan, and
games or awareness for orgs at about £5 per user per month.

What a £9.99 Steam sale nets (UK buyer; verify current rates): Steam prices include VAT, so £8.33
before VAT; after Valve's 30% share, about £5.83. Play takes 15% on a developer's first US$1M a year,
so about £7.08. Licence to Hack's hosted VMs cost us per player for as long as they play, so its
price should wait until the Playtest (E6) measures VM hours per completion. Eldritch Hacker has no
VM cost.

A games-only subscription doesn't involve Steam keys, so Valve's key parity rule doesn't apply to it
(verify). It would undercut the Steam price for someone who plays through in a month, and that may
be acceptable since it's browser-only.
