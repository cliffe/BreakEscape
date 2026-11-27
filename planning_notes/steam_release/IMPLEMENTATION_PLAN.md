# Hacktivity implementation plan: event-based access

Status: for review, 2026-10-25. Nothing in Hacktivity is edited until the user approves this plan
(standing rule: ask before any Hacktivity edit; commits go on main). The design is
`ACCESS_MODEL.md` (draft v2, confirmed in round 6). Paths below are relative to the Hacktivity
repo; line numbers are from a read-only survey on 2026-10-25.

## Scope

In: the access model (plans ↔ events, org opt-in, entitlements table), the policy changes, VM
quota, copy limits, scoreboard filter, admin and org-manager screens, the Stripe plan sync, and the
tests for all of it.

Later (separate plan, after this ships): Steam sign-in and ownership, single-game app mode, Play.
The `event_entitlements` table and store id columns land now so admin grants work and the store
work has somewhere to write.

## Phase 1: migrations and models

Rails 7.0.4, `db/schema.rb`. Latest migration `20261019120000_add_title_image_to_events.rb`.

| Migration | Change |
|---|---|
| `add_includes_all_events_to_plans` | `plans.includes_all_events boolean default false null false` |
| `create_plan_events` | `plan_id`, `event_id` (fks, not null), `access string not null`, timestamps; unique `(plan_id, event_id, access)`; index `event_id` |
| `add_plan_and_scoreboard_setting_to_orgs` | `orgs.plan_id` (fk, null), `orgs.org_only_scoreboards boolean default false null false` |
| `create_org_events` | `org_id`, `event_id` (fks, not null), timestamps; unique `(org_id, event_id)` |
| `create_event_entitlements` | `user_id`, `event_id` (fks), `source`, `source_ref` (not null), `metadata jsonb default {}`, `granted_at` (not null), `revoked_at`; unique `(source, source_ref)`; index `(user_id, event_id)` |
| `add_steam_fields_to_users` | `steam_id string` (unique, null), `steam_persona_name`, `steam_linked_at` |
| `add_store_ids_to_events` | `steam_app_id bigint`, `steam_demo_app_id bigint`, `play_product_id string`, each unique where not null |
| `backfill_access_model` (data) | set `includes_all_events = true` on Pro, Premium, Business & Education; set `orgs.plan_id` to each org's current org subscription plan, else Business & Education where `seats > 0` or a current subscription exists |

Models:

- `PlanEvent` (`belongs_to :plan, :event`; `enum access: { play: "play", copy: "copy" }`).
  `Plan has_many :plan_events`; `Plan#grants_play?(event)`, `Plan#grants_copy?(event)`
  (`includes_all_events` or a matching row; copy only for pools).
- `OrgEvent` (`belongs_to :org, :event`); `Org has_many :org_events`, `belongs_to :plan, optional`.
  Validation: the event must be `open_to_open_subscription?` and granted by the org's plan.
  `Org#deal_current?` (seats > 0, as `total_seats` today).
- `EventEntitlement` (`belongs_to :user, :event`; `enum source`; scope `live` =
  `revoked_at: nil`; `revoke!`).
- `Subscription`: new scope `entitling` = status in `active, trialing, cancelling` (Q2). Kept apart
  from the existing `current` scope, which also includes expired within 7 days (used by
  `User#active_subscription?` and seat counts; unchanged).

## Phase 2: one access service, then the policies

New `app/services/event_access.rb`: `EventAccess.new(user, event)` answering `playable?`,
`route` (`:subscription`, `:org`, `:entitlement`, `:free_window`, `nil`; used for quota and logging).
For an `open_subscription` event:

1. individual: `user.subscriptions.entitling` whose plan `grants_play?(event)`;
2. org: user seated (role ≠ `user`), `org.deal_current?`, `org.plan&.grants_play?(event)`, and an
   `org_events` row;
3. entitlement: `EventEntitlement.live` for (user, event);
4. free window: unchanged `free_tier_accessible?` on the slot or batch (checked by the caller,
   since the window is per slot/batch).

Call sites to switch:

| Where | Today | Change |
|---|---|---|
| `game_slot_policy.rb:11-13` (`start?`, and the actions that fall through to it :24-28) | `has_active_subscription? \|\| free_tier_accessible?(slot)` | `EventAccess#playable? \|\| free_tier_accessible?(slot)` |
| `sec_gen_batch_policy.rb:68-70` (`assign_vm_set?`) | same | same change |
| `application_policy.rb:26` `has_active_subscription?` | `subscriptions.active` | `subscriptions.entitling` (still used by `individual_subscriptions` events) |
| `event_policy.rb:54` (`sign_up_current_user?`, individual_subscriptions events) | `subscriptions.active.exists?` | `has_active_subscription?` |
| Views: `events/_sign_up_btn.html.erb:1`, `events/show.html.erb:34`, `game_slots/_list_display.html.erb:28`, `sec_gen_batches/_list_display.html.erb:26` | inline `subscriptions.active.exists?` | a helper `can_play_event?(event)` backed by `EventAccess`, so buttons and locks match the policy |
| `event_policy.rb:93-100` `copy?`, `copy_event?` | VIP/AM may copy any event with no org | non-admins: `@record.hacktivity_type_pool?` and `user.org.plan&.grants_copy?(@record)` (V4) |

**Auto-enrol.** `ApplicationController#auto_enroll_open_subscription!` (`application_controller.rb:63-70`,
before `show`/`start` on game slots and `show`/`assign_vm_set` on batches) returns early for
anyone with an `org_id` (:65). `start?` needs the user signed up, so org direct access would fail
there. Change :65 to skip org members only when `EventAccess#route` isn't `:org`. Steam and Play
owners get enrolled by the same hook (or at link time).

Left alone: mailers and `user_engagement_content.rb` that read `subscriptions.active` for
marketing copy (not access).

**Engine gap.** The engine's `MissionPolicy#create_game?` (`../BreakEscape/BreakEscape/app/policies/break_escape/mission_policy.rb:15`)
lets any signed-in user create a game for any published mission outside a slot
(`games_controller.rb:86, :98`). Hacktivity's own launch path (`GameSlotsController#start`,
`game_slots_controller.rb:80`) is already policed. Close the gap with a config hook in the engine
(`BreakEscape.configuration.can_create_game = ->(user, mission) { ... }`), set in
`config/initializers/break_escape.rb` to allow admins only outside slots. This is a BreakEscape
change plus a Hacktivity initializer line.

## Phase 3: VM quota

- `User#has_premium_quota?` (`user.rb:290`): org branch becomes
  `org && role != 'user' && org.deal_current? && org.plan&.user_role == 'premium'`; individual
  branch reads `subscriptions.entitling` instead of `active.first`, and takes premium if any
  entitling plan is premium (D7, most generous).
- Claim wait (`VmSetAssignmentService#wait_quota_exceeded?`, `vm_set_assignment_service.rb:40-49`,
  keyed on the event): skip the wait when the user holds a live entitlement for `@event` (D1).
- No change to `quota_config.rb`.

## Phase 4: Stripe

- `StripeService#handle_org_subscription_created` (`stripe_service.rb:62`): set `org.plan_id` to
  the purchased plan (:70-71 already resolves it).
- `handle_subscription_updated` (:245) doesn't read the price today, so a plan change made in Stripe
  isn't reflected anywhere. Read the subscription item's price, map it to a Plan by the
  `stripe_*_price_id_*` columns, update `subscription.plan_id`, and for org subscriptions
  `org.plan_id`. This also fixes the existing gap for individual plan changes.
- `SubscriptionsController#change_plan` (`subscriptions_controller.rb:262`): update the local
  `plan_id` (and `org.plan_id`) on success, so the app doesn't wait for the webhook.
- New plans "Games" and "Awareness & Games" created in Stripe (GBP and USD prices), then in
  Hacktivity through the existing plan form; seeds updated (`db/seeds/plans.rb`).

## Phase 5: screens

| Screen | Where | Change |
|---|---|---|
| Event form (admin) | `events/_form.html.erb`, `event_params` `events_controller.rb:627` | "Plans" fieldset: per plan, play and copy checkboxes (copy only shown for pools); store id fields. Saved through nested `plan_event_ids` handling in the controller. Not in `event_vip_params` (:649) |
| Plan form (admin) | `plans/_form.html.erb`, `plan_params` `plans_controller.rb:57` | `includes_all_events` checkbox; read-only list of the plan's events |
| Org form (admin) | `orgs/_form.html.erb`, `org_params` `orgs_controller.rb:70` | `plan_id` select; `org_only_scoreboards`; read-only list of opted-in events |
| Org content (managers and admins) | new `OrgEventsController#edit/update`, route under orgs; `OrgPolicy#manage_events?` = admin or VIP/AM of that org | checkboxes for the open-subscription events the plan grants; `org_only_scoreboards` toggle |
| Copy screen | `EventsController#copy` (:264) and pools listing | pools outside the plan shown greyed with "Not in your plan" |
| Event listing | `EventsController#index` (:17-56) | no change to visibility; lock badges come from `can_play_event?` |
| User page (admin) | administrate user dashboard | entitlements list with revoke, and "grant event" (creates `source: grant`, `source_ref` = admin id + timestamp) |
| Lapsed orgs (admin) | new admin page | orgs with `deal_current?` false and seated members (M7) |

## Phase 6: scoreboards

- `EventsController#event_scoreboard` (:170-186) and `GameSlotsController#mission_scoreboard`
  (:311-321): add `org_only` param; default on when the viewer's org has `org_only_scoreboards`
  and the event is `open_subscription`. Filter `users.org_id = viewer.org_id`. Managers always see
  the toggle.
- Steam and Play play off public scoreboards (C5): exclude users whose only route to the event is
  an entitlement, via a `results` scope. (Only matters once store sign-in ships; build the scope
  now with the test.)
- `download_scores` (:194, `download_scores.csv.erb:1`): the policy comment (`event_policy.rb:88`)
  says the controller filters by org, but the view queries every result. Add the org filter for
  scoped VIPs.

## Phase 7: tests (extensive, policy and role focused)

Existing pattern: `ActiveSupport::TestCase` with fixtures (`test/fixtures`), `assert_permit` /
`refute_permit` helpers (`test/policies/game_slot_policy_test.rb:158-163`), `bin/rails test`. There
are no org, plan or subscription factories, and no CI config.

**Fixtures to add:** plans `games_plan`, `awareness_games_plan` (and `includes_all_events` on the
three existing); events `ltd_game_event` (open_subscription, game, store ids), `ir_sim_event`,
`hackbox_event`, `awareness_pool`, `full_pool`; game slots with and without free windows;
plan_events for the two narrow plans; orgs `ag_org` (Awareness & Games), `be_org`, `lapsed_org`,
`other_org`; org_events; users for each role in each org (user, pro, lbu_student, vip,
account_manager) plus `steam_owner`, `revoked_owner`; subscriptions for each status (active,
trialing, cancelling, expired, canceled) on Pro, Premium and Games; entitlements live and revoked.

**1. Characterisation tests first** (written against today's code and run before any change):
record what each existing fixture user can do on each existing fixture event, slot and batch. They
stay in the suite; every expected change is edited in the same commit as the code that changes it,
with a comment naming the decision (Q2, V4, T3...). That makes every access change visible in
review.

**2. Access matrix test** (`test/services/event_access_matrix_test.rb`): a table-driven test over

- roles: none (guest), `user`, `pro`, `lbu_student`, `vip`, `account_manager`, `admin`;
- individual subscription: none, or each status on Pro, Premium, Games;
- org: none, seated in `be_org`, seated in `ag_org`, unseated, `lapsed_org`, `other_org`; opted in
  or not;
- entitlement: none, live, revoked, live for another event;
- event `open_to`: `open_subscription` (game, hackbox, course), `org_members` (own org, other org),
  `individual_subscriptions`, `all`, `lbu_students`;
- free window: none, open, ended, not started.

Each row states the expected `playable?` and `route`. The table is written out explicitly (not
generated from the rules), so the test checks the rules rather than restating them.

**3. Auto-enrol tests:** an opted-in org member is enrolled on visiting a slot of an org-granted
event; a member of an org that hasn't opted in isn't; a solo user with a Games subscription is.

**3a. Policy tests** per action, using the same fixtures: `GameSlotPolicy#start?` and every action
that falls through to it, `restart?`, `show?`; `SecGenBatchPolicy#assign_vm_set?`;
`EventPolicy#show?`, `sign_up_current_user?`, `copy?`, `copy_event?`, `event_scoreboard?`,
`download_scores?`; `OrgPolicy#manage_events?` (own org, other org, each role).

**4. Quota tests:** `has_premium_quota?` per route and plan (including D7 most generous); claim wait
skipped only for the entitled event.

**5. Model tests:** `PlanEvent` uniqueness and copy-only-for-pools; `OrgEvent` validation (event
must be open_subscription and granted by the plan; removing an event from a plan leaves the
`org_events` row inert, not deleted); `EventEntitlement` uniqueness and `revoke!`; `Subscription`
`entitling` scope.

**6. Stripe tests** (stripe_mock and VCR, as now): org purchase sets `org.plan_id`;
`subscription.updated` with a new price updates `plan_id` on the subscription and org; unknown price
leaves both and logs.

**7. Controller/integration tests:** event form saves plan checkboxes (admin), ignored for VIP;
org content screen (manager of own org allowed, other org and plain users refused, only
plan-granted events listed); copy of a pool outside the plan refused by direct POST; scoreboard
filter on and off; `download_scores` filtered for a VIP.

**8. System tests** (`application_system_test_case.rb`, `login_as`): an Awareness & Games org
manager ticks an IR game and a member starts it; a Games subscriber starts Licence to Hack m03 and
is refused a hackbox; a free user plays only the free-window mission.

**9. Engine test:** with the hook set, a signed-in non-admin can't create a game outside a slot
through the engine route.

## Rollout

1. Each phase is a commit on main (Hacktivity), tests green before the next.
2. Per-org check list before deploying: for each org, its `plan_id` after backfill, its seat count,
   and what its members can play before and after (generated by a rake task from the
   characterisation and matrix logic: `rake access:org_report`).
3. Deploy migrations and code together (one release, Q3). No feature flag.
4. Afterwards: create the two new plans in Stripe and on the pricing page; tick plan_events for
   the IR games and awareness pools.

## Estimate

Phases 1–3 about 4–5 days with tests; phase 4 about 1 day; phases 5–6 about 3–4 days; system
tests and the org report about 1–2 days. Roughly two working weeks. The engine hook is half a day
in BreakEscape.

## Implementation status (2026-10-26)

Approved in the implementation review (I1–I3, J1–J2, K1–K4 all as recommended). Built by Sonnet
agents phase by phase, each phase reviewed (adversarial review rounds, fixes, re-check) before its
commit on Hacktivity main, then a whole-change review and fixes.

| Phase | Hacktivity commit |
|---|---|
| 0 characterisation tests | 5d9f60b2 |
| 1 migrations, models, fixtures | c5bf60b8 |
| 2 EventAccess, policies, views, auto-enrol, copy limit (V4), engine gate (I1) | fc359c9b |
| 3 VM quota (J1, D1, D7) | 5e269682 |
| 4 Stripe plan sync (I2); Stripe test flakiness fixed | 0f4c428a |
| 5 admin and org-manager screens | 1c66aa35 |
| 6 scoreboards (org filter, C5, I3) | 46d55669 |
| 7 integration flows, system tests, `rake access:org_report` | ac2d89ec |
| whole-change review fixes (M1–M4) | 3de32cfb |

Engine (BreakEscape): `config.can_create_game` hook 39ad6b9a5; `missions#show` gate 139ecd0ff.

Suite: 2637 runs; the only failures are two that predate this work
(`stripe_webhooks_controller_test` invalid payload, `subscription_flow_test` :51). Browser system
tests are written but can't run on this machine (Capybara/Puma mismatch, no chromedriver); the same
flows pass as integration tests.

Decisions taken during implementation (beyond the review picks):
- J1 applies to orgs too: `Org#deal_current?` has no 7-day grace (access, quota, copy).
- Any route (org opt-in, own subscription, entitlement) auto-enrols an org member.
- Individual-subscription events need an all-events plan (Games stays games-only).
- Org copies of pools can't be copied again; the copy button says why a copy is refused.
- One live entitlement per user, event and source (Steam and Play may both be live).
- Admin grants count as normal players on public boards; only Steam/Play-only owners are hidden.
- New plans are skipped by the seeds until their Stripe price ids are set.

Answers and follow-up work (2026-10-26, Hacktivity main):

| Change | Commit |
|---|---|
| Q2: members of `org_only_scoreboards` orgs hidden from outsiders on public boards, panels and live toasts ("A player"); org view labelled as an org leaderboard. Q4: `plans.listed`; Games and Awareness & Games unlisted (admin-only, no checkout for others), draft feature lists in the seed | 62bcbdbe |
| D3: Steam/Play players shown on public boards (C5 removed). D4: `GameSlot.available` uses the event start when `release_at` is blank | 3e9fa48f |
| Playtesters: `playtest` entitlement source, optional `expires_at` (all sources); testers and own-org VIPs/account managers start unreleased missions; see-only visibility unchanged; testers' feedback from first play, editable until release | 059a6074 |

Settled: Q1 no free window for org members (as now); Q3 invitations as now; Q5 engine gate admins
only; C1–C4 confirmed; D1 lapsed orgs keep their own copied events; D2 re-seating stays on the org
page (VIPs and account managers already have it); P5 testers' games count normally; P7 no engine
published check. Deferred: D5, a lapsed player's direct engine game link still opens their own
game; close it in the Steam sign-in work.

Next: Stripe deploy prep, then Steam/Play sign-in.

Before deploy: run `rake access:org_report` on production data; create the two plans in Stripe and
set the STRIPE_* variables; tick plan_events for game events and awareness pools; set the Licence
to Hack store ids. Where Games or Awareness & Games already exist, untick Listed by hand (the seed
only unlists on creation). Keep unlisted plans' prices out of the Stripe customer portal. Edit the
draft feature lists in `db/seeds/plans.rb` (the "Hacktivity Games" tooltip mentions Kali VMs).
