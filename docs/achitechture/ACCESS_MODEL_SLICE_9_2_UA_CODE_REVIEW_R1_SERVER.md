# Access model slice 9.2, sub-slices U and A: code review round 1 (server half)

Scope: the Ruby side of `git diff claude/break-escape-access-design-090sjx build/9-2-u-a` (worktree
`.claude/worktrees/p-9-2-u-a`): `games_controller.rb`, `game.rb`, `npc_frustration.rb` (new),
`game_policy.rb`, `config/routes.rb`, `lib/break_escape/access_work.rb` (new),
`scripts/validate_access_work.rb` (new), `scripts/validate_scenario.rb`,
`scripts/validate_npc_needs.rb`, `scripts/scenario-schema.json`, `tools/playtest/verify-run.rb`, and
the three new Rails test files with their fixture. The client JavaScript is reviewed separately.
Measured against `ACCESS_MODEL_SLICE_9_2_PLAN.md` (sections 4, 5.4, 7, 9.1 to 9.4, 10, 12 U and A)
and `ACCESS_MODEL_SLICE_9_2_PLAN_REVIEW_R5.md` (n1 to n6, which the build folds in).

What was run:

- `ruby -wc` on every new Ruby file under the host Ruby 2.7.8: all clean. No Ruby 3-only syntax in
  the added lines (no endless methods, no hash shorthand, no pattern matching; `filter_map`,
  `entry[1..]` and `Float#ceil(1)` are all 2.7).
- `bin/rails test` on `test/unit/access_work_test.rb` (13 runs), `test/models/break_escape/access_work_plan_test.rb`
  (9) and `test/controllers/break_escape/npc_frustration_test.rb` (20): all pass.
- `node --test test/js/validator-access-work.test.mjs` (15, which drive the Ruby validator): all pass.
- The validator with `--skip-ink --no-graph` on `test_access_work`, `test_needs_sims`,
  `test_npc_needs`, `test_access_networks`, `test_access_habits`, `test_access_doors`,
  `test_access_sessions`, `test_access_signin`, `lab_social_engineering` and `m01_first_contact`.
  `test_access_work` raises exactly the three expected warnings its `PLAYTEST.md` lists (U3's tray,
  Kai's "work never succeeds", the unused `intranet`); no other scenario raises a `work:` line or a
  work report. No false positive found on existing scenarios.
- Two throwaway integration probes, kept out of the repository (scratchpad), against the real route:
  a large `missing` list, and the refused/stale answers for a hidden borrow PC. Results below.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 2 |
| Minor | 6 |
| Nit | 7 |

## What holds

- Check order on `POST /npc_frustration` matches 9.1: known NPC (`encounteredNPCs`, not `metAt`,
  per R5 n2), can fail and belongs, cause holds, pace floor. Refused, stale and too-soon answers
  write nothing (the entry is only created on the paths that go on to write).
- The route is in both the `set_game` list and the `with_game_lock` list, authorised with
  `npc_frustration?` (`show?`), so two requests cannot race on `npcFrustration`.
- Every rule is read from `scenario_data` and the server's own state, never from the report: the
  NPC record comes from `scenario_room_npc`, places and use times from `AccessWork`, owned causes
  from the scenario and `loginLockouts`. A report cannot name another NPC's resource or station, or
  an object outside the NPC's places, to choose its floor (tested).
- `workNeeds`, `frustration` and `feed` are withheld from every room NPC beside the first slice's
  keys; `resources` and `roles` stay out of the bootstrap; the `work` plan carries ids, kinds,
  `admitted`, `downIf`, `object`, `routes` and `breakDrain` and no name or network (tested, and the
  no-exposure test covers the routes that exist at this step).
- `npcFrustration` is in `ACCESS_STATE_DEFAULTS` and not in `preserved_keys`: a reset drops it, a
  game without the key answers as empty (tested). GET /scenario carries `level`, `tell`, `settled`
  and `hold`; `hold` uses the park floor unless an ease came after the last fail, which never ends
  earlier than the server would accept (it can over-hold after an R5 n1 gate; that is safe).
- R5 n1 (gate after an `off`-only fail), n5 (no ease at the own station while an owned cause holds)
  and n6 are implemented as the review asked.

## Major

### M1. An unbounded `missing` list holds the game lock for seconds per request

`app/models/break_escape/npc_frustration.rb:110-114`, with `lib/break_escape/access_work.rb:48-57`
and `:308-320`.

`MAX_REPORTS` caps reports at 20, but each report's `missing` is any length, and every entry is
passed to `AccessWork.cause_belongs?`, which for `off`, `locked_out` and `social_blocked` calls
`station`, which calls `object`, which rebuilds `object_index` (a walk of every room object) each
time. All of it runs inside `with_game_lock` (a row lock on the game) on a Puma thread.

Probe: the test fixture plus 300 chairs, 20 reports each listing `{ id: "ian_pc", why: "off" }`
1500 times (an 840 KB JSON body, valid in every entry): **8.9 seconds** for one request, answered
200. The request can be repeated at once; nothing on the server limits how often a client posts.
The state written is still bounded by the floors, so this is not a way to raise frustration, but
it is the "spam the endpoint" case: one student's script can tie up a worker and the game row for
seconds at a time, at will, and a larger body scales linearly.

Fix:

1. In `fail_report!`, refuse (422 for the request, or `refused` for the report) when `missing` has
   more entries than the NPC can have causes, or simply more than a small constant (8 is ample:
   an honest report lists one cause per resource in the NPC's list plus its station). Take
   `missing.uniq { |c| [c['id'], c['why']] }` before checking.
2. Memoise `object_index` per scenario hash inside `AccessWork` (for example a one-entry cache keyed
   by `data.object_id`, or pass the index down), so `object`, `station`, `places` and
   `shortest_use_seconds` stop re-walking every room for each call; `shortest_use_seconds` today
   rebuilds the index once per place.
3. Add a controller test: 21 causes in one report is refused, and a report with a duplicated cause
   is answered as one.

### M2. Refused and stale answers reveal a hidden `borrow_session` PC before it is handed over

`lib/break_escape/access_work.rb:195-211` (`borrow_pcs`, `places`), `:295` (`can_fail?`),
`:317-320` (`cause_belongs?`); answered at `npc_frustration.rb:113-118` and `:134-136`.

The plan's 9.2 table withholds "the list, the thresholds, and every workaround not yet due", and
9.3 says a modified browser cannot "read ... a workaround ... before the server has handed it
over" (decision 12: the player cannot learn what a workaround will open). But a PC named by any of
the NPC's `borrow_session` workarounds already counts as one of its places and as a station that a
cause can belong to, from the moment the NPC is met, so check 2 answers differently for it.

Probe on the test fixture (Dana has `{ at: 50, do: "borrow_session", pc: "hot_desk" }`), with
no outage and nothing handed over:

| Report | Answer |
|---|---|
| fail, `missing: [{ id: "hot_desk", why: "locked_out" }]`, `object_id: "dana_pc"` | `stale` |
| the same with `amy_pc` or `kai_pc` | `refused` |
| ease at `hot_desk` | accepted (level 0, writes `easeAt`) |
| ease at `amy_pc` | `refused` |

So a player walking the PC ids that room data already ships learns which NPC will borrow which PC,
and that the NPC has a `borrow_session` at all, before any outage. `can_fail?` leaks the same fact
for an NPC whose only failure path is an `offWhen` on a borrow PC (`stale` instead of `refused`).
The ease at the borrow PC also writes `easeAt`, which opens the fail gate early (small, but it is
a write the plan's "an ease at a place" rule did not mean before a borrow exists).

In sub-slice A nothing is ever handed over (`run` is always null), so no honest report can name a
borrow PC: 6.4 says a failed use at a borrowed PC is not reported, and an ease there only exists
after sub-slice H hands the borrow over.

Fix: count a borrow PC in `places`, `cause_belongs?` and `can_fail?` only once that `borrow_session`
has been handed over (its index in the NPC's `handed`, or `guestSessions` naming the NPC; both are
sub-slice H's state). For A, the smallest faithful change is to leave borrow PCs out of all three,
with a comment that H adds them back behind the hand-over. Add a controller test: a cause and an
ease naming an unhanded borrow PC are answered exactly as for another NPC's PC (`refused`). The
plan's 9.1 "Belongs to the NPC" and "can fail" bullets should say "a PC a handed-over
`borrow_session` names".

## Minor

### m1. R5 n1 changed the tampered bound, and neither the plan nor the report says so

`npc_frustration.rb:173`; `scripts/validate_access_work.rb:482-486`; plan 9.3 (:1426-1435) and
section 10's report line.

The extra gate lets an NPC with an owned cause and a station `offWhen` take two counted fails per
park floor (an `off` fail, then an owned-cause fail at the use floor, then `off` again at the park
floor, and so on). R5 n1 asked for 9.3 to say so and for the validator to halve the park-floor
figure for such an NPC. The plan text was not updated and `workaround_timing` still prints the full
park-floor figure, so the "earliest by a modified browser" line overstates the time for, say, a
Kai whose PC can be unplugged. Fix: in `workaround_timing`, halve the park-floor branch when the
station (or a borrow PC) has an `offWhen`, and add the sentence to plan 9.3. Test it in
`validator-access-work.test.mjs`.

### m2. The report misses the "only by alternating eases and fails" note, and the `[]` route case

`scripts/validate_access_work.rb:472-498`; plan section 10 report line, R5 n5.

Plan 10 asks for the note "only by alternating eases and fails" for an NPC whose only failures are
causes the server owns, and R5 n5 adds the `[]` route to that class. The report prints a plain
use-floor figure for them. For a `[]`-route NPC with no non-desk place and no borrow PC, an ease is
refused everywhere it could be claimed (own station, R5 n5), `rearmed` is ignored, so the real
bound is the park floor, and the report understates it. Fix: classify the NPC as unadmitted (park
floor), alternating-only (use floor, with the note), or browser-controlled (use floor), from
`AccessWork.owned_causes` with an empty lockout list plus whether any ease place other than the
station exists.

### m3. A 9.3a resource with only `network` and `observations` would be called unused

`scripts/validate_access_work.rb:318-323`.

The schema (`scenario-schema.json`, resources) describes `observations` as "For a resource with no
contents: the text shown when the player clicks its row", and does not require `host`. Such a
resource is a player-facing 9.3a resource, but the "in no NPC's work list and has no contents and no
host: nothing uses it" warning fires on it. No current scenario has that shape, so this is a latent
false positive. Fix: also skip a resource that has a `network` (a foothold lists it) or
`observations`.

### m4. A malformed `roles` entry raises inside room loading and inside encounter tracking

`lib/break_escape/access_work.rb:69`, `:94`, `:108`; called from `game.rb:4116-4125`
(`compile_npc_plan!`) and `games_controller.rb` `track_npc_encounters` (`note_npcs_met!`).

`roles.dig(role, 'workNeeds')` raises `TypeError` when `roles.staff` is a list ("no implicit
conversion of String into Integer") or a string ("String does not have #dig method"), confirmed on
the resolver. In `filtered_room_data` that is a 500 on every room with an NPC of that role. In
`track_npc_encounters` the `rescue => e` swallows it, so the whole room's NPCs are silently not
recorded in `encounteredNPCs`, which breaks `npc_conversation` tasks, `give_item` and every
frustration report for them. The validator would also crash rather than report. The schema says
`roles.<role>` is an object, so this needs an authoring mistake, but the server path should not
depend on the validator having been run. Fix: in `roles_block`, keep only entries whose value is a
Hash (`r.select { |_k, v| v.is_a?(Hash) }`), and call `note_npcs_met!` after the encounter save,
or in its own `begin/rescue`, so a resolver fault cannot cost the encounter record.

### m5. Tests that would not catch a regression

`test/controllers/break_escape/npc_frustration_test.rb`.

- R5 n5 (an ease at the own station refused while an owned cause holds) is not reached by any test:
  the only owned-cause ease, Kai's, is refused earlier by the unadmitted rule. Add: Dana locked out
  (`loginLockouts: ['dana_pc|dreyes']`), an ease at `dana_pc` refused, and one at a non-desk place
  accepted.
- Plan A-3's "`tell` ... with one whose `at` is at or below `perFail` (straight from 0 to the
  workaround)" is not tested.
- `hold` after an ease (the use-floor branch of `npc_frustration_for_client`) is not tested; only
  the park-floor branch is.
- The use floor after an ease is never tested at its boundary (W4's test spaces reports 5 s apart
  against a 1.5 s floor), so swapping `use_floor` for `park_floor` in the ease gate would be caught
  only by the `rearmed` test, not by the ease path.
- No test sends a malformed body: `reports` not a list (422), an empty `missing` (refused), a cause
  that is not a hash, `rearmed: "true"` as a string.

### m6. `validate_npc_needs.rb` now drops a check that sub-slice C has not yet replaced

`scripts/validate_npc_needs.rb:1239-1243`.

`next if targets.empty? && name == 'social_media'` skips the "no object satisfies it" error for
every `social_media` need, including one with `"phone": false`, which plan 10 keeps as an error
("an NPC with a `social_media` need, `"phone": false`, no workstation for a home and no object that
satisfies the need"). Until C lands that case is unreported. Separately, the desk filter is guarded
by `defined?(BreakEscape::AccessWork)`, so the same file gives different answers depending on
whether its caller loaded the resolver first. Fix: skip only when `npc['phone'] != false`, and
`require_relative '../lib/break_escape/access_work'` at the top of `validate_npc_needs.rb` instead
of testing `defined?`.

## Nits

- **n1.** `metAt` is written (`npc_frustration.rb:43-53`) and never read: since R5 n2 check 1 is
  `encounteredNPCs`. Either say in the comment that it is kept for sub-slice C's feed and the
  verify-run report, or drop it from A.
- **n2.** `compile_npc_plan!` (`game.rb:4116-4125`) builds the plan from the room copy (after the
  `npc_states` overlay and, for a moved NPC, the `npcs_added` copy), while every server decision
  reads the `scenario_room_npc` record. Today `npc_state_params` permits only `isKO`, `currentHP`
  and `isVisible`, so the two cannot differ; pass `scenario_room_npc(npc['id'])` to
  `AccessWork.plan` so they never can.
- **n3.** `AccessWork.preset_id` (`access_work.rb:153`) treats `"lockType": ""` as set (Ruby
  truthiness), where `office-presets.js presetIdFor` treats it as unset; `desk?` likewise checks
  `id` as a non-empty String where `isWorkstation` checks truthiness. Harmless today; worth a
  comment saying the two follow the JS rule.
- **n4.** Plan 9.2's table lists `perFail` and `easePerSuccess` as withheld, but every answer carries
  `level` and `previous`, so `perFail` is `level - previous` on the first fail. `previous` is needed
  for W3's mapping, so fix the plan's table ("not sent as fields; inferable from the level steps"),
  not the code.
- **n5.** An ease is accepted at level 0 (`npc_frustration.rb:132-157`), including for an NPC that
  cannot fail (probe: Amy's ease writes an entry with `easeAt`). An honest client sends an ease only
  above 0 (5.4), so answering a level-0 ease with the current level and writing nothing loses
  nothing and keeps `npcFrustration` to NPCs that have actually failed.
- **n6.** In A, once the level passes a workaround's `at` without a hand-over (run is null by
  design), `frustration_tell` (`:224-242`) treats it as neither to come nor in force, so with `at`
  20 and `perFail` 34 the first fail answers `tell` 1. Correct for A; leave a comment so sub-slice B
  replaces the "in force" test with the `handed` record.
- **n7.** `npc_frustration_for_client` calls `frustration_entry`, which fills defaults into
  `player_state` on an unlocked GET. `end_claimed_sessions!` reloads under `with_lock`, so nothing
  is persisted, but read the entry without filling it (`entry.fetch('failAt', {})`) to keep the
  GET free of writes.

## Docs against code

`README_scenario_design.md` ("Work, frustration and workarounds"), `NPC_NEEDS_SYSTEM.md` 5.9 and
`docs/test-bridge.md` match the server code on every point checked (report shape, `settled`,
`hold`, `tell`, withheld keys, validator errors and warnings). The build log's claims about the
server (R5 n1, n2, n5, n6 folded in; `WITHHELD_WORK_NPC_KEYS`; `metAt` for any NPC that can fail or
has a feed; A-4's list) hold. The one gap is m1: R5 n1's consequence was not carried into plan 9.3
or the report.

## Verdict

Changes requested. The server keeps its own facts, checks every report against the scenario and
its own state, and holds the pace floors the plan describes, and the tests cover the main A-3
cases. Two things should be fixed before sub-slice B builds on this route: the unbounded `missing`
list (M1, a cheap way to hold the game lock for seconds) and the borrow PC oracle (M2, which
reveals a workaround's target before it is due, against plan 9.3). The minors are small and can go
in the same round; m4 and m6 are worth doing because they fail silently.
