# Access model: events as the unit of access

Status: draft v2, 2026-10-25, from rounds 1–5 (`OPEN_QUESTIONS.md`). This replaces the Product,
PlanProduct and OrgProduct tables in `ENTITLEMENTS.md`; the Steam sign-in, key and store-rule
parts of that file still stand. Points still open are posed in the round-6 review form (linked
from `OPEN_QUESTIONS.md`).

## Principles

- **The event is the product.** Courses, hackboxes and games are events. No Product model.
- **Plans say what is available; orgs choose what their members get.** One table links plans to
  events; one flag marks the "everything" plans.
- **Org managers copy courses (pools) only.** Games and hackboxes are played directly in the public
  event. Only admins copy games, as now.
- **Single-sale games** (Steam, Play, admin grant) are the only stored per-user entitlements.
  Subscriptions and org access are computed live.
- **The demo needs nothing new:** a free window on one mission's game slot, as open-subscription
  events already allow. Demo players are ordinary free accounts.

## Schema changes (Hacktivity)

```
plans
  + includes_all_events  boolean, default false, null false
      -- true: every open_subscription event is playable, and (org plans) every pool is copyable

plan_events                       (new)
  plan_id     bigint fk plans, null false
  event_id    bigint fk events, null false
  access      string, null false  -- "play" | "copy"
  timestamps
  unique (plan_id, event_id, access); index event_id

orgs
  + plan_id              bigint fk plans, null       -- the org's tier, for Stripe and manual deals
  + org_only_scoreboards boolean, default false      -- members see open-event scoreboards filtered to the org

org_events                        (new: the org's opt-in for direct access)
  org_id      bigint fk orgs, null false
  event_id    bigint fk events, null false
  timestamps
  unique (org_id, event_id)

event_entitlements                (new: single-sale games only)
  user_id     bigint fk users, null false
  event_id    bigint fk events, null false
  source      string, null false  -- "steam" | "google_play" | "grant"
  source_ref  string, null false  -- "<steamid64>:<appid>", Play order id, or admin grant id
  metadata    jsonb, default {}   -- persona name, purchase token, raw store response, granted_by
  granted_at  datetime, null false
  revoked_at  datetime, null
  timestamps
  unique (source, source_ref); index (user_id, event_id)

users
  + steam_id            string, unique, null
  + steam_persona_name  string, null
  + steam_linked_at     datetime, null

events
  + steam_app_id        bigint, unique, null   -- full game app
  + steam_demo_app_id   bigint, unique, null   -- demo app; opens the same event
  + play_product_id     string, unique, null   -- Play one-off product id
```

No change to `subscriptions`, `results`, `game_slots` or `sec_gen_batches`.

## Seed and data entries

**Plans** (prices are working figures):

| Plan | subscription_type | user_role (quota) | includes_all_events | plan_events |
|---|---|---|---|---|
| Pro | individual | pro (guest quota) | true | none |
| Premium | individual | premium | true | none |
| Business & Education | organization | premium | true | none |
| Games (new, about £4.99/month) | individual | pro (guest quota) | false | play: each game event |
| Awareness & Games (new, about £5/user/month) | organization | pro (guest quota) | false | play: game events; copy: awareness pools |

**Events:**

- "SAFETYNET: Licence to Hack": `type_of_hacktivity: game`, `open_to: open_subscription`,
  `steam_app_id`, `steam_demo_app_id`, `play_product_id` set; game slots m01–m10. One slot at a
  time carries a free window (the demo mission, which can rotate).
- "SAFETYNET: Eldritch Hacker" later, the same shape with no VM batches.
- Incident response simulation game events: get `play` rows on Games and Awareness & Games.
- Awareness course pools: get `copy` rows on Awareness & Games.

**Example rows:**

```
event_entitlements: user 812, event 41 (Licence to Hack), source "steam",
  source_ref "76561198000000000:<appid>", metadata {"persona":"..."}, granted_at ..., revoked_at null
org_events: org 7 (Awareness & Games), event 52 (an IR simulation)
orgs: id 7, plan_id <Awareness & Games>, seats 40, org_only_scoreboards true
```

**Migrating existing data:** set `includes_all_events` on the three existing plans; set
`orgs.plan_id` to Business & Education for every org with seats or a current org subscription;
nothing else changes until orgs tick events.

## Access rules

**Play an `open_subscription` event E** (in `GameSlotPolicy#start?`,
`SecGenBatchPolicy#assign_vm_set?`, and the event's sign-up check). True if any:

1. **Individual subscription** whose status is active, trialing or cancelling, and whose plan
   grants E (`includes_all_events`, or a `play` row for E).
2. **Org access:** the user is a seated member (role other than `user`), the org's deal is
   current (seats > 0), `orgs.plan_id` grants E, and the org has an `org_events` row for E.
3. **Entitlement:** an `event_entitlements` row for (user, E) with no `revoked_at`.
4. **Free window** on the slot or batch, as now. This is the demo path.

`org_members` events (org copies of pools) keep today's rule.

**Copy a pool P into an org** (`EventPolicy#copy_event?`, org managers): P is a pool, and the org's
plan has `includes_all_events` or a `copy` row for P. The copy screen shows the plan's other pools
greyed out. Admins can copy anything, games included, as now.

**Org opt-in screen:** org managers see the open-subscription events their plan grants, each with a
checkbox (`org_events`), and the `org_only_scoreboards` setting.

**Scoreboards:** an open-subscription event's results page gains an "my org only" filter. If the
viewer's org has `org_only_scoreboards`, members see the filtered view by default. Steam and Play
play is shown on public scoreboards like anyone else (D3, user decision: store players register an account during setup to accept terms, so C5 is dropped).

**VM quota** (`User#has_premium_quota?`): the org branch becomes "seated member and the org's plan
`user_role == 'premium'`". Steam and Play owners get guest quota, with the claim wait lifted inside
an event they hold an entitlement for (D1). Anyone with several routes gets the most generous (D7).

## Store apps

- **Steam sign-in:** ticket → SteamID → `users.steam_id`. Ownership of `events.steam_app_id` is
  checked at each sign-in and creates or revokes the `steam` entitlement. Admin, account_manager and
  org-owner accounts can't be linked (B10).
- **Steam demo:** the demo app id maps to the same event. No entitlement; the player is a free
  account and plays whichever slot has the free window.
- **Play:** a verified purchase of `events.play_product_id` creates a `google_play` entitlement.
  The Play app only unlocks with a Play entitlement (G4).
- **Single-game app mode:** the shell sends a header naming the app, its event and its build
  version. Hacktivity renders that one event without site navigation, refuses Stripe and billing
  pages for those requests, opens other links in the system browser, and refuses builds below the
  minimum version (A3).

## Admin screens

- Event form: a row per plan with play / copy checkboxes (`plan_events`); the store id fields.
- Plan form: the `includes_all_events` flag; a read-only list of the plan's events.
- Org form: the plan choice (beside seats and end date), and the org's opted-in events.
- User page: Steam link (unlink through support only), entitlements with revoke and grant.
- Lapsed orgs list: deal ended, members still seated (M7).

## Rollout

One release with migrations, tests and a per-org check list (Q3):

1. Migrations above; backfill `includes_all_events` and `orgs.plan_id`.
2. Policy changes behind tests for each route: individual (each status, each plan), org member
   (seated, unseated, lapsed, opted in or not), entitlement (live, revoked), free window, copy
   limits, quota.
3. Per-org check list: each org's plan, and what its members can play before and after.
4. Store work after that: Steam link and ownership, single-game app mode, then Play.

All Hacktivity work: ask before editing, and commit on main.

## Prices (working)

Licence to Hack £14.99 on Steam and Play (R1); Eldritch Hacker £9.99 (R2); Games plan about £4.99/
month (R3); Awareness & Games about £5/user/month (R4).
