# S8c review, round 5 (final): R4 fixes, the R3-SERVER1 fix, the second playtest

Delta reviewed on `ops-lock2` since `8194044e4`: `83616e969` (scanner, R4-1..R4-5: `tools/playtest/lib/lock_step_leak_rules.rb`
(`rules`), new `access_leak_scanner_lock_step_r4fix_real_test.rb` (`r4fix`)), `ca43fafc9` (client, R4-6: `inventory-menu.js`,
`inventory-menu.test.mjs`), `d3aeb4f81` (server, R3-SERVER1: `lock_step_gate.rb`, `lock_step_r2_server_test.rb`). Inputs:
`S8c_R4_delta.md`, `S8c_R3_server.md`, the round-3 section of `S8C_HANDON.md` (decisions and limits). Review only; no code changed.

Counts: 0 blockers, 0 majors, 2 minors (R5-1, R5-2), 1 nit (R5-3).

## How it was checked

All runs in the session scratch folder `s8c-r5/` (outside the tree).

- **Probes.** `s8c-r5/r5_probe_test.rb`: the R4 probe file unchanged (E0-E6, M1-M7, S1-S4, A1-A5, the real run), plus new
  probes N0-N8 (below). Run with `r4fix`, `r3fix` and `lock_step_r2_server_test.rb` under the test lock:
  `s8c-r5/run1.txt`, **55 runs, 24798 assertions, 0 failures, 0 errors, 0 skips** (the `r4fix` prop test did not skip; the new
  never-met headless test passes; the real run: 0 findings).
- **JS.** `bin/test-js -j 2 test/js/inventory-menu.test.mjs test/js/inventory-tray.test.mjs test/js/lock-step-carried.test.mjs`:
  3 passed, 0 failed.
- **Orchestrator's runs at `ca43fafc9`** (not repeated): all scanner files 561 runs, 0 failures; golden 33 runs, 0 failures.
- **Playtest 2 scan** with the current rules (the command form of playtest 1's RESULTS.md):
  `env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game> <responses file>`.
  Outputs `s8c-r5/leak-166.txt`, `s8c-r5/leak-168.txt`.

## R4 and R3-SERVER1 findings

| Finding | State | Evidence |
|---|---|---|
| R4-1 (major) empty-open allowance wider than the decision | **closed** | `rules:711-712`: `empty_room` needs `Array(objects)` and `Array(npcs)` both empty. E1, E2, E3 now report every shut gated door (records_room, plant_room); the decision case E0 (also with the keys absent) and E6 stay 0. Odd shapes fail closed: `objects` a Hash with content (N7b), `[nil]` (N7c), a String (N7d) are reported; an empty Hash (N7a, N7e) counts as empty. E4 (content under an unknown key `items`) is still 0: limit 4. |
| R4-2 (minor) carried ids make an honest open mixed | **closed** | `rules:187-190`: a top-level object with `needsTag` or `takeable` (and its contents) is left out of the room proof; `rules:257-258`: an `alreadyOpen` answer naming two rooms proves and reports nothing. `r4fix` pins the honest carry (clean, closet opened) and the carried object alone (proves no room). M2 now proves nothing (was: marked the carry's home room). N5a/N5b: a takeable closet object listed alone or beside another room's fixed id never opens the closet; N5c: `takeable: false` still proves. The content rules use each lock's own `room_ids`, not the proof, so nothing gated gets through (M1, M3, M4, M6 still mixed; N6, an `alreadyOpen` answer carrying records_room's memo, is still reported). Wider than the server (any takeable, not only `carriable_object?`), which only fails closed. |
| R4-3 (minor) ordinary rooms opened by a reward or a prop never "opened" | **closed**, with a loose edge (R5-1) | Reward: `rules:859` marks `room_id` opened only from a 200 `POST /flags` with `success: true` and a successful `unlock_door` for a door some station authors. N3 clean; N3b (403), N3c (`success: false`), N3d (reward after the gate), and the `r4fix` "no station" case keep the gate reported. Prop: `rules:264-269` needs a 200 `POST npc_workaround`, a `roomId` the scenario authors a `prop_door` for, and listed fixed ids of that room only. N4a clean; N4b (other room's ids), N4c (mixed), N4d (unauthored room), N4f (403), N4g (no prop authored) keep the gate. Both routes are tied to the route's own answer in the capture. The `r4fix` prop test only refutes the gate, which is not enough on its own: N4b-N4g are the negative cases it lacks (R5-1 fix adds them). Edge: R5-1. |
| R4-4 (minor) stations keyed by name | **closed** | `rules:292-297` keys a station by the id `stamp_scenario_object_ids!` gives it (`game.rb:7917`, `:7930`), never by name. S1, S2 clean; S3 (name) reported; a held station by `moira_held_0` (N8) clean, another station's id (N8b) reported. |
| R4-5 (minor) `awareness` on `contacts[i].emailRecord` | **closed** | `rules:435` adds `(\.emailRecord)?`. A1 reported; A2, A3, A5 as before. |
| R4-6 (minor) "Open" on the emptied briefcase | **closed for the menu rule; not reached in the real flow** (R5-2) | `inventory-menu.js:129`: a contents list decides when there is one; `hasContents` only when there is none. Test pins `{hasContents: true, contents: []}`. But a take does not empty the client's `contents` for the briefcase: R5-2. |
| R3-SERVER1 (minor) never-met headless record as opener | **closed** | `lock_step_gate.rb:43-44` needs the opener in `encounteredNPCs` before `validate_npc_unlock`. New test (never met, locked and lockless door: owner named, no grant, nothing in the bootstrap room; met: named) passes. A25 ("an NPC the player has met") now matches the code. A headless record becomes met only by its own give (`games_controller.rb:3780-3787`, `encounter_npc!`), so a headless record that opens a door before any give names the owner (stricter; limit 12). Nit: R5-3. |

## New findings

### R5-1 (minor) The reward and prop routes accept bytes the server cannot send

1. **Untargeted door reward** (`rules:313`): `door = r['target_room'] || r['room_id'] || room_id` gives every station its own room
   as a fallback. The server's fallback (`find_flag_rewards`, `games_controller.rb:4239-4245`) is the room of a **room object of
   type `flag-station`** only; for a station held by an NPC, a `launch-device`, or a flag-locked object (`lockType: flag`), an
   untargeted `unlock_door` has `room_id` nil and `process_door_unlock_reward` answers `{type: 'error'}`, never `unlock_door`.
   N1 (an NPC in the closet holds such a station) and N2 (a flag-locked safe in the closet): a tampered `{unlock_door, room_id:
   closet, success: true}` reward opens the closet and the gate is **not** reported (N0 control: reported). Since R4-3 this marks
   ordinary rooms too; for gated doors it dates from unit 28 (`@ls_opened`). Practical reach is small (the station sits in the room
   it would open, so an honest player is already there) and no shipped scenario authors such a reward.
2. **Prop answer** (`rules:264`): the new branch does not test `success`; N4e (`success: false` with `roomData`) opens the closet.
   The server merges `roomData` only on `:ok` (`games_controller.rb:1833`), and `ls_judge_prop_door` already refuses
   `success == false`.

Fails open only on bytes the honest server does not send. **Fix:** in `ls_collect_door_routes`, fall back to the station's room
only for a room object with `type == 'flag-station'` (as the server does); in `ls_note_rooms` add `root['success'] != false`. Tests:
N1, N2, N4e reported; add N4b, N4d, N4g to `r4fix` beside the honest prop case.

### R5-2 (minor) The emptied briefcase still offers "Open" once (R4-6 not reached)

The unlock copies the server's list onto `scenarioData.contents` (`unlock-system.js:43`). Opening the unlocked briefcase loads its
contents from the server into a fresh array (`container-minigame.js:1444-1451`), and a take splices only that array
(`:2790-2792`); nothing writes `scenarioData.contents` back (grep of `public/break_escape/js`: only the unlock setters and
`dispense-on-unlock.js`). `board_minutes` is a readable `notes1`, so the dispense path leaves it to the container screen. After the
take the tray still holds `contents: [board_minutes]`, so the new rule still offers "Open"; the next Open shows an empty container,
and `dispense-on-unlock.js:97` then clears the list. Traced, not run in a browser. Nothing leaks (the server answers the real, empty
list). **Fix:** after the splice in `container-minigame.js`, remove the item by id from `this.containerItem.scenarioData.contents`
when it is an Array; test with a held unlocked container whose last item is taken.

### R5-3 (nit) The new opener test asserts the opener only when a gate answered

`lock_step_r2_server_test.rb`: `assert_equal 'amy', body['opener'] ... if body['secondStep']`. If a later change stops the gate
answering for the headless attempt, the opener check is skipped silently (the grant and bootstrap checks still run). It failed
before the fix, so it asserts today. **Fix:** assert `body['secondStep']` for both door kinds, then the opener.

## Playtest 2 scan (games 166, 168) with the current rules

- Game 166, `responses-166.jsonl`, 123 responses: exit 0, "VERDICT: no leaks found", every rule 0 (lock_step_content,
  lock_step_secret, lock_step_answer all 0). The run opened records_room and plant_room, so the R4-1/R4-2/R4-3 changes ran on real
  door opens.
- Game 168, `responses-168.jsonl`, 23 responses: exit 0, "VERDICT: no leaks found", every rule 0.
- Same result as the playtest's own scan at `2788775bd`: the round 3 and 4 changes add no finding on honest captures.

## Limits the stage lands with (all rounds, corrected)

1. **P1c**: a door open that serves another shut room's data whole is the same bytes as that room's honest open (no request body in
   the capture).
2. With a PC push step open in a mixed scenario, an echo-less cancel or waiting prompt reads as the PC's.
3. An echo-less open of a gated lock that serves no contents and no room data is not reported; the echo-less door open of a room
   with no objects and no NPCs (both absent or empty) is placed nowhere (owner decision, 2026-11-24).
4. Values under `serverGlobals`, the text of contents, id-less content under unknown keys of an honestly opened item, and unknown
   keys of room data (such as `items`, E4) are not judged; freshness is on the recorder's clock.
5. Integers inside the server's bounds can still carry a value (`promptsSent` 10..20, `retryIn` 10..99).
6. A gated room whose only ids are NPCs moved out before it opens is reported on its honest first open (fail closed).
7. **Route rooms** (R3-SCANNER5, decision 2026-11-25): an unpromoted route room counts as opened; for the scanner hardening stage
   (a server mark such as `routeRoom: true`). No shipped scenario has both a route room and a lock step.
8. Door rewards share one station set (the `unlock_door` answer carries no station id).
9. Room proof (after R4-2): a room whose top-level objects are all takeable or `needsTag` is never marked opened by a door open or a
   prop; an item from inside a fixed container that the player carried into a room whose next door open is not `alreadyOpen` makes
   that open mixed. Both fail closed.
10. A takeable room object that has left the player stays in reach (round 1, pinned).
11. Client: the test bridge's tray menu hint lists only "Drop here" and "Examine"; the tray click listener in `lock-step-carried`
    is a two-line copy of `inventory.js`, pinned by a source test (round 1). Until R5-2 is fixed, an emptied held container offers
    "Open" once more and shows an empty screen.
12. Server: a headless email record counts as an opener only once met, and it is met only by its own give; a headless record whose
    ink opens a door before any give names the owner as opener. A step with no owner stores a named opener's grant for a door it can
    never pass (R3 "outside the eight"; the validator warns; none shipped).
13. Until R5-1 is fixed: an untargeted `unlock_door` reward on a held, `launch-device` or flag-locked station, and a prop answer with
    `success: false`, count as opening their room; fails open on bytes the server does not send; no shipped scenario authors it.

## Verdict

**clean** (0 blockers, 0 majors). R5-1 and R5-2 are minors and land as limits 13 and 11 unless fixed; R5-3 is a test nit.
