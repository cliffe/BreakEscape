# Access model slice 9.2, sub-slice B (workarounds): code review round 2, server half

Branch `build/9-2-b` against `main`, Ruby and its tests only
(`git diff main...build/9-2-b -- ':!*.js' ':!*.mjs'`). Plan: `ACCESS_MODEL_SLICE_9_2_PLAN.md`
sub-slice B, sections 6 and 9.1 to 9.4. Round 1: `ACCESS_MODEL_SLICE_9_2_B_CODE_REVIEW_R1_SERVER.md`.
Build log section checked: "Sub-slice B review round 1 outcomes". A second reviewer covers the
client JavaScript.

Files read: `app/models/break_escape/npc_frustration.rb` (whole), `app/models/break_escape/game.rb`
(`written_down?`, `login_pc_owner`, `login_postit_for`, `unlock_room!`, `merge_global_variables!`,
`complete_task!`, `unlock_condition_met?`, `unmet_conclude_requires`, the NPC key filter),
`app/models/break_escape/carry_over.rb` (globals), `app/controllers/break_escape/games_controller.rb`
(`npc_workaround`, `serve_opened_room`, `with_game_lock`, `scenario`, `sync_state` and its two merge
helpers), `game_policy.rb`, `routes.rb`, `scripts/validate_access_work.rb`, the scanner,
`test/controllers/break_escape/npc_workaround_test.rb`, the X beats in
`scenarios/test_access_work/scenario.json.erb`, and (for the retry model only)
`public/break_escape/js/systems/npc-reports.js:80-115`.

Run with `RBENV_VERSION=2.7.8`, single files:

| File | Result |
|---|---|
| `test/controllers/break_escape/npc_workaround_test.rb` | 22 runs, 147 assertions, 0 failures |
| `test/controllers/break_escape/npc_frustration_test.rb` | 38 runs, 234 assertions, 0 failures |
| `test/unit/access_leak_scanner_test.rb` | 25 runs, 195 assertions, 0 failures |
| `test/js/validator-access-work.test.mjs` (drives the Ruby validator) | 27 pass, 0 skipped |
| `ruby -wc` on every changed `.rb` | Syntax OK. One warning, `games_controller.rb:2701` unused `stdout`, which is on `main` too (line 2681 there) |
| `validate_scenario.rb` on `test_access_work` | the three `Workaround` report lines, no B error |

No Ruby 3-only syntax (`filter_map`, `Float#ceil(1)` and `Hash#except` from ActiveSupport all work on
2.7).

## Severity

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 2 |
| Nit | 4 |

## Round 1 findings: closed

| R1 | Status | Evidence |
|---|---|---|
| M1 `prop_door` with no `door` or `prop` | Closed | Validator errors (`validate_access_work.rb`, `check_npc_workarounds`, the two `has no door` / `has no prop` lines); server `performable?` needs both (`npc_frustration.rb:203-205`); tests `validator-access-work.test.mjs:399` and `npc_workaround_test.rb:195` |
| m1 `writes_down` on another owner's PC, empty password | Closed | Validator uses the server's rule (`screenOwner`, else the first room NPC with it as `needsHome`, same as `game.rb:1452-1456`); test `validator-access-work.test.mjs:419` |
| m2 prop not hidden on `setGlobal` | Closed | Two warnings; test `validator-access-work.test.mjs:413-416` |
| m3 scanner blind to `writes_down` | Closed | `scan_workarounds` reports any hash with a workaround `do` and an `at`, with no exemption; test `access_leak_scanner_test.rb` "an authored workaround entry" |
| m4 replay of a dropped hand answers `{}` | Closed | `npc_frustration.rb:153-158` and `:173-176` answer `{ "dropped": true }`; tests `:117-128`, `:141-154` |
| m5 test gaps | Closed | drop inside the dwell `:130`; done after drop `:141`; `writes_down` and `emit` replays `:180`; parsing `:165` (negative, float, seven digits, `"1.0"`) |
| n1 `retryAfter` | Closed | `(dwell - elapsed).ceil(1)` at `npc_frustration.rb:167`; test `:156` |
| n3 graph warn | Closed | `generate_dungeon_graph.rb` warns to stderr |
| n5 sync race note | Closed | in plan 9.4 per the build log |
| n6 H-only kinds | Closed | report line ends "Not performed until sub-slice H." |
| n2, n4 | Deferred to H / a profile, as logged; I agree |

## Server trust, afresh: what holds

- **Many, late, or after a reload.** Every request runs under `@game.with_lock` (`games_controller.rb:1834`,
  which reloads the row) and a transaction, so two copies of one hand-over are serialised: the
  second finds `lastSpent[index].hand == hand` and gets the same body, recomposed from the scenario,
  with nothing written (`npc_frustration.rb:153-158`). The full set of orderings for one index:
  - done then done: same body (test `:260`);
  - drop then drop, or drop then done: `{ "dropped": true }` (tests `:122`, `:141`);
  - done then drop: the done body (see nit N1);
  - an old hand after a newer hand on the same index: `lastSpent` holds only the newest hand, so the
    old one falls to the `handed` check and gets 403. That is right for a lasting kind, because a
    lasting index is re-handed only after a drop, so the old hand was a drop.
- **403 ends it.** An honest runner gets 403 only for a hand the server no longer knows: after a
  reset (which drops `npcFrustration`), or for a superseded dropped hand (above). I found no path
  where an unspent or done hand answers 403, so the rule loses nothing. No test pins the reset case
  (m2).
- **425.** Writes nothing, gives the time left, and the dwell is measured from server hand time, so
  a reload or a resend cannot shorten it.
- **Pending after a reload.** `pending_runs` rebuilds each unspent hand-over with its original hand
  (`npc_frustration.rb:259-268`), so a runner restarted after a reload spends the same hand, and a
  second tab doing the same run gets the replay body. `done_list` lets the client re-apply the
  global and the propped door; `unlockedRooms` is only ever grown by the server (`game.rb:113-117`;
  `sync_state` does not write it), so a stale sync cannot close the propped room.
- **Body shapes.** `index`/`hand` go through `strict_int`; an Integer has no upper bound but only
  matches a stored hand. `npc_id` is `to_s`. `dropped` is cast through `ActiveModel::Type::Boolean`
  (nit N3).
- **Leaks in answers.** `run` carries only the kind, the target ids and the dwell; a `writes_down`
  answer is `{ pcId, hasPostit }`; `done` names a room already unlocked. `workarounds`, `roles`,
  `workNeeds`, `frustration` stay withheld (`game.rb:4111-4142`). See m1 for what the room and
  scenario data still give away.
- **Lock time.** Bounded per request: one scenario walk for the NPC's list, at most one
  `filtered_room_data` for a `prop_door` done or replay. Same cost as `GET /room`.

## Major

### M1. A lost `POST /npc_frustration` answer strands its hand-over until the next reload

`choose_run!` (`npc_frustration.rb:242-254`) records the hand-over in `handed` and returns it as
`run` in that one answer. The client treats a failed send as "a lost request loses one step of
frustration and nothing else" (`npc-reports.js:97-98`) and does not resend. If the server
committed the fail but the answer never arrived (timeout, dropped connection, a proxy error after
the commit), the runner never hears of the run, and the server will not offer it again:

- later fails skip the index while it is in `handed` (`:245`, pinned by the test at
  `npc_workaround_test.rb:121`, "handed over and waiting");
- `too_soon` and `answer` carry only a new pick (`:483-493`);
- `settled` stays false for good, since `handed` is not empty (`:478`).

The hand-over comes back only as `pending` in `GET /scenario`, that is after a reload. Until then
the beat silently does not happen: no note, no propped door, no emit. The round 1 client fix (resend
the "done" until answered) covers the other half of the exchange; this half is the same loss, one
request earlier, and it is exactly the case the brief names (a hand-over arriving late or not at
all).

Fix (server, small): when a counted fail or a `too_soon` finds an unspent hand-over for the NPC and
picks no new one, answer it again as `run`, with its stored `index` and `hand` and the dwell left.
It was already handed over, so this reveals nothing and costs nothing: the hand is the same, the
dwell still runs from the stored server time, and a second "done" is a replay. Change the test at
`:121` to expect the same run with `hand` 1, and add one that discards the third fail's answer and
gets the run from the fourth. The client reviewer should confirm the runner ignores a run whose
`(npcId, hand)` it already holds (the round 1 client tests include "two `pending` runs for one
NPC", which suggests it does).

## Minor

### m1. Room and scenario data still tell a player which NPC has which workaround, before any hand-over

Plan 9.3 says a tampered browser cannot "read ... a workaround ... before the server has handed it
over". The `workarounds` list is withheld, but three things a scenario must author for a workaround
are served from the start:

- **NPC `eventMappings`** are not withheld (`game.rb:4111-4114` lists `creds awareness habits role
  workarounds` and `workNeeds frustration feed`). In `test_access_work` Mei's mapping is
  `"eventPattern": "npc_workaround:mei"` with condition `data.do === 'writes_down' && ...`
  (`scenario.json.erb:1738-1743`); Tom's names `door_propped:store_room` (`:1919-1923`); Ellis's
  names `ellis_gave_up` (`:2120-2124`).
- **The reveal props** come in the room data with their `revealOnGlobal` and text: the server does
  no reveal filtering (only the client hides them, `rooms.js` `hideUntilReveal`). The wedge reads
  "A fire extinguisher, wedging the stores door open." (`:1850-1860`); Ellis's note reads "Intranet
  down again. Gone to do something useful." (`:2022-2030`).
- **Global names** (`store_door_propped`, `ellis_out_of_office`) are in the served
  `globalVariables` defaults.

No secret value escapes: no password, no room. What leaks is the plan, which 9.3 and 11 treat as a
secret. The scanner does not see it either, since none of these is a hash with `do` beside a
target. The test at `npc_workaround_test.rb:397-398` checks only for `"do": "..."` and the
`"store_wedge","setGlobal"` string, so it passes while the wedge object is in the same body.

Fix: for B, correct the 9.3 sentence ("before the server has handed it over, except what the
scenario's own mappings, reveal props and global names show") and add a line to the README's
workaround section telling authors to keep mapping conditions, prop text and global names neutral.
For H, which reopens the filter: withhold an object whose `revealOnGlobal` is a workaround's
`setGlobal` until that workaround is in `done`, and strip `eventMappings` patterns that start
`npc_workaround:` from NPC records (the runner emits that event itself, so the client mapping can
be rebuilt from `done`).

### m2. Two orderings the retry makes likely have no test

- **Reset, then an old hand.** Nothing asserts that a "done" or "dropped" for a hand made before
  `POST /reset` answers 403 and writes nothing. That is the case where the client's "403 ends it"
  rule must fire; a regression that kept `lastSpent` across a reset would turn it into a 200.
- **Done, then dropped, for one hand.** Nothing pins that a drop arriving after the done answers the
  done body (and, for a `prop_door`, still serves `roomData`) and writes nothing. The reverse order
  is tested (`:141`).

Fix: one test each in `npc_workaround_test.rb`, both comparing `player_state` before and after.

## Nits

- **N1.** A drop that arrives after the done answers the done body, which for an `emit` is `{}`
  (`npc_frustration.rb:158`, `:220-229`). The client can tell it from `{ "dropped": true }`, but only
  by the absence of a key. Adding `"done": true` to every done body would make all three answers
  explicit. Cheap; optional.
- **N2.** `pending_runs` sends the full `dwell`, not the time left since the stored hand time
  (`:265`), so a runner restarted after a reload waits longer than it must. Harmless; the same
  `(dwell - elapsed)` as the 425 would match it.
- **N3.** `ActiveModel::Type::Boolean.new.cast` turns any non-empty, non-false value into true, so
  `dropped: {}` or `dropped: [1]` counts as a drop (`games_controller.rb:1222`). A drop gains the
  player nothing, so this is only tidiness: `params[:dropped] == true || params[:dropped] == 'true'`.
- **N4.** `complete_npc_workaround!` and `workaround_done_kind?` do not run inside
  `AccessWork.with_index`, unlike `report_npc_uses!` and `npc_frustration_for_client`. The R1 n4
  deferral covers it; the same fix would apply.

## Open question: should the server refuse client writes of workaround globals?

**Recommendation: no, not in B.** Add one validator warning now, and keep the read-only option for
the day a server gate reads such a global.

What a player gets today by writing a workaround's `setGlobal` through `sync_state`
(`games_controller.rb:1738-1740` into `game.rb:281-299`, which refuses only imported globals):

| Claimed gain | Result | Where |
|---|---|---|
| A propped door opens | No. Room access is `unlockedRooms`, which only the server grows (`game.rb:113-121`); `sync_state` refuses a `currentRoom` outside it (`games_controller.rb:1730-1733`). The door sprite is reopened from `done`, not the global | `npc_frustration.rb:283-284` |
| A written-down note appears | No. `written_down?` reads `done`, not the global | `game.rb:1476-1479`, `npc_frustration.rb:120-129` |
| A hand-over skipped | No. `done` is written only by `complete_npc_workaround!` after the hand and dwell checks | `npc_frustration.rb:178-181` |
| A task completes | Nothing new. The X tasks are `custom` and complete from events, not globals, and a `custom` task is accepted from `POST complete_task` with no check at all | `game.rb:2644-2645`, `scenario.json.erb:236-246` |
| The prop or note shows | Yes, client-side only: `revealOnGlobal` is a client hide (`rooms.js` `hideUntilReveal`). The wedge is `takeable: false`; the note is text already in the room data (m1) | `scenario.json.erb:1850-1860`, `:2022-2030` |
| Frustration rises faster | No. Workaround globals are not causes. The cause globals (`downIf`, routes, `offWhen`) are just as client-writable, and plan 9.3 accepts that residual | `npc_frustration.rb:438-452`, plan 9.3 |

So a direct write gains nothing that a player cannot already get, and less than writing the outage
global itself, which 9.3 accepts. Refusing the workaround globals alone would not close anything.

Where it would start to matter is if an author makes a server gate read the same global. The server
reads globals at four places: an aim or task `unlockCondition.globalVariable` (`game.rb:2845-2847`),
`concludeRequires.globals` (`game.rb:4503-4505`, `carry_over.rb:91-95`), the carry-over snapshot
into a later mission (`carry_over.rb:81-87`), and the frustration causes (`npc_frustration.rb:441-452`).
A workaround `setGlobal` used at any of these is a gate a player opens with one sync.

Fix now: a validator warning when a workaround's `setGlobal` is also an `unlockCondition`
`globalVariable`, in a `concludeRequires.globals` list, a carry-over export, or a resource's `downIf`
/ route global / `offWhen`. If that ever has to be allowed, refuse the client write the way imports
already are: add the scenario's workaround `setGlobal` names to `read_only` in
`merge_global_variables!` (`game.rb:283`). That is a one-line change on an existing path, not a
change for every scenario, since a scenario with no workarounds has no names to add; the client
already gets the true value from the done answer and `savedGlobalVariables`. Log it for H.

## Verdict

No blocker. Every round 1 server finding is closed, with tests, and the hand-over route stays
idempotent and ordered under the new retry: duplicates, late resends and reloads all land on the
same hand, and an honest runner gets 403 only for a hand the server has truly forgotten. Fix M1
(re-offer an unspent hand-over in later answers, so a lost `/npc_frustration` answer does not strand
it) before merging; it is small and server-only. m1 needs a plan sentence and a README line now, with
the filter change in H; m2 is two tests. No server refusal of workaround globals is needed in B.
