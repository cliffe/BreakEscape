# Access model slice 9.2, sub-slices U and A: code review round 2 (server half)

Scope: the Ruby side of `git diff claude/break-escape-access-design-090sjx build/9-2-u-a` in the
worktree `.claude/worktrees/p-9-2-u-a` (head `bba919f35`): `games_controller.rb`, `game.rb`,
`capture_proofs.rb`, `npc_frustration.rb`, `game_policy.rb`, `config/routes.rb`,
`lib/break_escape/access_work.rb`, `scripts/validate_access_work.rb`, `scripts/validate_scenario.rb`,
`scripts/validate_npc_needs.rb`, `scripts/scenario-schema.json`, `tools/playtest/verify-run.rb`, and
their tests. Measured against `ACCESS_MODEL_SLICE_9_2_PLAN.md` (9.1 to 9.4, 10, sub-slices U, A and
L), the round 1 server review and the five "for the server reviewer" items of the round 1 client
review. The client JavaScript was read only where a server rule depends on it (`npc-work.js`,
`pc-policy.js`).

What was run (Ruby 2.7.8):

- `ruby -wc` on every changed Ruby file and test: clean apart from five unused-variable warnings
  at lines this branch does not touch. No Ruby 3-only syntax in the added lines (`filter_map`,
  `entry[1..]` and `Float#ceil(1)` are 2.7).
- `bin/rails test`, one file at a time: `test/unit/access_work_test.rb` (14 runs),
  `test/models/break_escape/access_work_plan_test.rb` (9), `test/controllers/break_escape/npc_frustration_test.rb`
  (30), `test/controllers/break_escape/capture_proofs_test.rb` (25). All pass.
- The validator (`--skip-ink --no-graph`) on `test_access_work`, `test_needs_sims`,
  `test_access_networks`, `lab_social_engineering` and `m01_first_contact`: `test_access_work`
  raises exactly the three warnings its `PLAYTEST.md` lists; the others raise no `work:` line.
- A throwaway integration test in the scratchpad (not in the repository) against the real route:
  P1 the worst batch the bounds allow, P2 a global named `""`, P3 an ease naming an object in a
  locked room, P4 a phone ease, P5 a stored entry with odd types. Results below.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 5 |
| Nit | 6 |

## Round 1 findings: verified

| Round 1 | Status | Evidence |
|---|---|---|
| M1 unbounded `missing` | Closed | `npc_frustration.rb:21-22, 137-142` (20 raw, 8 distinct); `games_controller.rb:1189-1195` (64 KB, 413); `access_work.rb:53-80` (`with_index`, identity keyed, restored in `ensure`, nests). `scenario_data` is the record's cached jsonb value, so the identity check holds within a request. Probe P1: the fixture plus 1,700 extra objects (1,500 chairs, 200 workstations), 20 Dana fail reports each with 20 entries over 7 distinct belonging causes, every one passing checks 1 to 3: **0.10 s** for the request; 20 eases 0.08 s. Round 1 measured 8.9 s. Puma 6.6.1 sets `CONTENT_LENGTH` after decoding a chunked body (`puma/client.rb:558, 577`), so a chunked request does not slip past the 64 KB check |
| M2 borrow PC oracle | Closed | `access_work.rb:225-247, 357-393`: borrow PCs are in none of `places`, `can_fail?`, `cause_belongs?`; `owned_causes` and `frustration_cause_holds?` read only the station. The test compares the four borrow-PC answers with the same reports naming `amy_pc` and checks no `easeAt` is written (`npc_frustration_test.rb:329-338`). With level 0 an ease at a real place answers non-refused, so the test would have failed before the fix. Plan 9.1 says "a handed-over `borrow_session`" |
| m1 halved park floor | Closed | `validate_access_work.rb:507-508`; plan 9.3 has the sentence |
| m2 alternating note and `[]` route | Closed as specified | `validate_access_work.rb:498-510`. See minor m3 below: the server could refuse those eases outright |
| m3 resource with `network` or `observations` | Closed | `validate_access_work.rb:322-323`, tested |
| m4 malformed `roles` | Closed | `access_work.rb:37-40`; `note_npcs_met!` has its own `rescue` (`games_controller.rb:1866-1870`) |
| m5 test gaps | Closed | The listed tests exist and pass (R5 n5, `tell` at or below `perFail`, `hold` after an ease, both gates at their boundary, malformed bodies) |
| m6 `social_media` with `"phone": false` | Closed | `validate_npc_needs.rb:10, 1245`; `validator-npc-leash.test.mjs:114` |
| n1 to n7 | Closed | Comments, `scenario_room_npc` in `compile_npc_plan!` (`game.rb:4119-4131`), the level-0 ease (`npc_frustration.rb:178-184`), and `frustration_view` for the GET (`:79-113`) |

## The client reviewer's five server items: verified

1. **Plant records and the USB policy.** Closed. `capture_proofs.rb:38` refuses a plant that
   `AccessWork.plant_refused?` refuses. `held_data` is the server's own inventory copy
   (`canonical_inventory_item`, `games_controller.rb:1055`), so a client cannot strip `usbClass`.
   A refused plant still removes the item, so a forged remove only costs the player the device.
   Tested for storage and hid.
2. **`rearmed`.** The claim holds. I tried to build a request that gains something: with no owned
   cause, every cause that can hold (`down`, `off`, `unreachable` with a global) comes from a global
   the browser writes, so `rearmed` buys only the use floor the validator already prints as
   "earliest by a modified browser". With an owned cause it is ignored (`npc_frustration.rb:212`).
   One edge: a `downIf` or `offWhen` naming an imported (read-only) global is, in practice, a
   cause the browser cannot clear, yet `rearmed` is honoured for it. The bound printed is still
   the use floor, so the report stays truthful; no change needed.
3. **`<npcId>_frustration` globals.** Grants nothing new, but the recorded reason is too strong; see
   nit n2.
4. **The reload `hold`.** Holds: client-only, the floors are the control.
5. **Tasks from needs events.** Holds: nothing server-side reads them.

## What holds (fresh pass)

- Check order and what each answer writes match 9.1: refused, stale and too-soon answers write
  nothing; an ease at level 0 writes nothing; `save!` runs only when something changed.
- Every rule reads the scenario and the server's own state. `npc_id`, `need`, `event`, `object_id`
  and causes of the wrong type all fall to `refused` (a Hash as `need`, a list as a report, a
  number as a cause id). Probe P5: a stored entry with a string level and a string fail time does
  not break GET /scenario.
- `refused` and `stale` answers are derivable from data the browser already holds: the `work` plan
  (ids, `admitted`, `downIf`, `routes`), the room objects' affordances and the policies the client
  reads for `pc-policy.js`, and the player's own globals. Nothing about workarounds is reachable
  before a fail other than the designed `tell`.
- Lock time is now bounded by 20 reports and 8 causes each, at about 5 ms a report on a large
  scenario (P1). The lock is per game, so a client that loops slows only its own game and one
  Puma thread at a time.
- Reload: `npcFrustration` is in `ACCESS_STATE_DEFAULTS`, dropped by a reset and by
  `new_session`, and served read-only by the GET.

## Minor

### m1. A global named `""` makes `down` hold for any resource with no `downIf`

`app/models/break_escape/npc_frustration.rb:242-243`.

`frustration_global(resources[id]&.dig('downIf').to_s)` reads the global `""` when the resource has
no `downIf`. `merge_global_variables!` (`game.rb:281-298`) stores any key the client sends,
including `""`. Probe P2: with `globalVariables: { "": true }`, a Dana fail listing
`{ id: "email", why: "down" }` (email has no `downIf`) is **accepted** (level 0 to 34); the
control without that global answers `stale`. The browser's verdict never reports it
(`npc-work.js:46` requires a non-empty `downIf`), so server and client disagree on which
resources can go down. It grants no faster floor in A (every cause it adds is one a modified
browser controls anyway), but it is a wrong answer from a check the plan calls "consistency and
honest logs", and later sub-slices build on accepted fails.

Fix: `dn = AccessWork.resources(scenario_data)[id]&.dig('downIf'); AccessWork.present_string?(dn) && truthy_global?(frustration_global(dn))`.
Test: a `""` global and a `down` cause on a resource with no `downIf` answer `stale`.

### m2. `locked_out` is accepted in A, ahead of sub-slice L's gate, and works as a username oracle

`npc_frustration.rb:197-199, 213, 254-256`; `access_work.rb:412, 418-423`; plan L-1
(`ACCESS_MODEL_SLICE_9_2_PLAN.md:2153-2154`) and decision 14 (`:2454`).

In A the browser never reports `locked_out`: the station it passes to the verdict always has
`lockedOut: false` (`npc-needs.js:4156`), and the `check` report and the `lockedOut` record arrive
with L. The server, though, already treats a `loginLockouts` entry for the NPC's username at its
station as a holding, owned cause, in three places that answer differently:

- a fail listing `{ id: <station>, why: "locked_out" }` is accepted, not `stale`;
- an ease at the own station is `refused` (R5 n5) instead of accepted;
- a `rearmed` fail is held to the park floor (`tooSoon`) instead of accepted at the use floor.

The sign-in screen deliberately answers an unknown username and a wrong password alike
(`game.rb:1495-1497`), and keeps lockouts for usernames that are not accounts. So a player who
types `maxAttempts` wrong passwords for a guessed username at an NPC's PC can then ask this route
whether that username is the NPC's. Decision 14 accepts exactly this leak for L ("a modified
browser can ask that at any time after the lockout"), but L also says "a fail with `locked_out` is
accepted only then", meaning after a true `check` has recorded the PC in the NPC's `lockedOut`
list. A has no `check`, so the oracle ships one sub-slice early and without that record, and a
crafted `locked_out` fail also counts towards frustration.

Fix, either:

1. Gate it as L will: `frustration_cause_holds?` for `locked_out` also requires the station id in
   the entry's `lockedOut` list, and `owned_causes` is called with only the lockouts that list
   confirms (in A, none). The R5 n5 and W5 tests then set `lockedOut` as well as `loginLockouts`.
2. Or record in the build log that decision 14 is taken to cover A, so L's reviewer does not
   treat the earlier exposure as a regression.

Option 1 matches the plan's L test list without waiting for L.

### m3. Work eases are accepted for an NPC with a `[]`-route resource, though no honest client sends one

`npc_frustration.rb:169-173`; `validate_access_work.rb:503-505`.

Routes are worked out from the NPC's station (`access_work.rb:278-285`), and the browser applies
them at every place (`npc-work.js:30-34, 48`), so an NPC with a resource whose `routes` are `[]`
fails every work use everywhere, exactly like an unadmitted NPC. The server refuses work eases for
the unadmitted case (W5) but accepts them at any non-desk place for the `[]` case, which is the
only reason the validator needs its "only by alternating eases and fails" branch for it. Refusing
them closes a path only a modified browser can use and moves the `[]` case to the park floor.

Fix: in `ease_report!`, refuse a `work` ease when `owned_causes(npc, 'work')` holds any
`no_access` or `unreachable` (both apply at every place); keep R5 n5's station-only rule for
`locked_out` and `social_blocked`. In `earliest_pace`, treat `unreachable` as `no_access`. Test:
an ease at a non-desk place for a `[]`-route NPC is refused.

### m4. Test gaps that would let a regression through

- M1's timing test (`npc_frustration_test.rb:290-302`) sends 21-entry lists, which are refused at
  the raw count before any resolver call, so it never times the worst accepted batch (P1's shape:
  20 entries, up to 8 distinct belonging causes, a large object count). Its assertion is `< 2.0`
  while its message says "well under a second". Add P1's shape with a few hundred extra objects,
  and a test that counts `build_object_index` calls across one full request (one per request).
- No test for m1 (`""` global).
- No test that a plant on an ungoverned object (no workstation fields, no `policy`) under a
  blocking `defaultPolicy` is recorded, the parity case `pc-policy.js` and the validator's
  "does not reach it" warning both rely on.
- The R5 n1 test covers one alternation; nothing checks that a third, `off` fail after the
  owned-cause fail goes back to the park floor when the report lists both `off` and the owned
  cause (`failWhy` then is not `['off']`).

### m5. A request naming an object in a locked room learns that it exists

`access_work.rb:236-247` (`places` walks every room); `npc_frustration.rb:166-168`.

Probe P3: a `vault` room, locked and never entered, holds `vault_kiosk` (satisfies `work`, not a
desk). An ease from Amy (who cannot fail, level 0) at `vault_kiosk` answers
`{ level: 0, previous: 0, tell: 0, ... }`; at a made-up id it answers `refused`. So guessed ids
reveal objects, and their `satisfies`, in rooms whose data the server has not yet sent. Ids must
be guessed and the fact is small, hence minor, but it is the "response differences reveal hidden
map data" case. No honest client can name such an object: its candidates come from loaded rooms.

Fix: in the report path, keep only places whose room is the start room or in `unlockedRooms`
(`room_unlocked?`, already used by `record_planted_item!`), or at least answer a level-0 ease
before the places check so that case says nothing.

## Nits

- **n1.** The 64 KB check (`games_controller.rb:1191-1193`) runs after `set_game`, whose
  `params[:id]` parses the whole JSON body, and inside `with_game_lock`. The build log's "refused
  before any report is read" is true; "before the body is parsed" would not be. Parsing happens
  before the lock, so the lock cost is nil, but the cap does not limit parse cost. A
  `prepend_before_action` on `:npc_frustration` that reads only `request.content_length` (and
  `request.path_parameters[:id]` if it needs the game) would, or Puma's `http_content_length_limit`
  for the whole app.
- **n2.** Client item 3's recorded reason, "no server-checked condition can name one", is too
  strong: `unlock_condition_met?` (`game.rb:2833-2846`) reads any global by name, and the
  validator forbids only declaring a `_frustration` global, not naming one in an aim or task
  `unlockCondition`. An author who gates an aim on `dana_frustration` gets a client-trusted gate.
  Every non-imported global is client-written, so this adds no new hole; correct the reason in the
  build log, or have `validate_access_work.rb` raise an error for an `unlockCondition` (or an
  `eventMappings` condition, as a warning) that names a global ending in `_frustration`.
- **n3.** `validate_access_work.rb:92-125` re-implements `usb_governed?`, `usb_policy_for` and the
  refusal table rather than calling `AccessWork`'s (`access_work.rb:313-336`), against the
  module's "one resolver so the two cannot drift" aim. They differ already on a whitespace-only
  `policy` (`!empty?` against `present_string?`). Call `AW.usb_policy_for` and `AW.plant_refused?`.
- **n4.** `AccessWork.preset_table` (`access_work.rb:168-170`) is memoised for the process, so an
  edit to `office-presets.json` in development needs a server restart before server floors and
  places follow it. A comment is enough.
- **n5.** Fails and eases store floats (`34.0`): `FRUSTRATION_BOUNDS` clamps through `to_f`
  (`access_work.rb:126`). Harmless, but the verify-run line and test assertions mix `34` and
  `34.0`; rounding to an Integer when the value is whole would keep logs tidy.
- **n6.** A phone `social_media` ease (`npc_frustration.rb:167`) needs no object and lowers the
  one per-NPC level that `work` fails raise (probe P4: 34 to 24). That is what the plan says (one
  level per NPC), and lowering frustration never helps the player, so no change; noting it so C's
  reviewer knows the phone ease is unconditional apart from its floor.

## Docs against code

The build log's round 1 server table and its answers to the five client items match the code,
except the wording points in nits n1 and n2. `README_scenario_design.md`, `NPC_NEEDS_SYSTEM.md`
and plan 9.1 to 9.3 match the server on the borrow PC change, the halved floor and the alternating
note (m3 would change the last for `[]` routes).

## Verdict

Approve with minor changes. Both round 1 majors are fixed and hold under a direct probe (the worst
batch the bounds allow now takes about 0.1 s of lock time on a 1,700-object scenario, and a hidden
borrow PC is answered like any other NPC's PC). No blocker or major remains. Fix m1 (a one-line
guard) and decide m2 (gate `locked_out` on L's record now, or log that decision 14 covers A)
before sub-slice B builds on accepted fails; m3 to m5 and the nits can go in the same round or be
logged for B.
