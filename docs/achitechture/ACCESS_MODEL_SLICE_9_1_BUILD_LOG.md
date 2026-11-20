# Access model slice 9.1: build log

Plan: `ACCESS_MODEL_SLICE_9_1_PLAN.md`, with the minors of `ACCESS_MODEL_SLICE_9_1_PLAN_REVIEW_R4.md`
that touch the steps built here. Steps 0 to 4, 6 and 7 are built on branch
`claude/break-escape-access-design-090sjx` (from `0b1a457b8`). Step 5 (`holdsDoors`) waits for the
engine plan's door work (E1 item 3) and step 8 for the lab's feedback pass and 9.3's lab step.

## Step 0. The locked look (2026-11-10)

Keyless server on :3001, at `0b1a457b8`.

- `test_access_sessions` (game 86): the player walked into `ian_room` and waited for Ian to leave
  (48 s). `window.__test.access.workstation('ian_pc')`: `screenLocked: true`,
  `lockedLook: true`, `texture: "pc8"`. The PC has no `"sprite": "pc_desktop"`, so there is no
  `pc8_locked` art and the picture does not change: a set-up fact of the fixture, not a fault.
  `screenTransitions()` last entry `{ objectId: "ian_pc", locked: true, sound: null }`.
  `npcOfficeVisuals.cueLog` last entry `{ how: "leave", locked: true, flash: null, glyph: true,
  chime: { key: "screen_lock", volume: 0.058 } }` (the room is unlit, so a glyph, and the player
  stood in the room, so a chime above 0).
- Repeated in `lab_physical_pentest` on Chris's `staff_pc` (game 87, started in `open_plan` with
  `new-game.rb --start-room open_plan`): `texture: "pc_desktop_locked"`, `lockedLook: true`;
  transition `{ objectId: "staff_pc", locked: true, sound: null }`; cue
  `{ how: "leave", locked: true, flash: "lock", glyph: false, chime: { key: "screen_lock",
  volume: 0.01 } }` (a lit room, so a flash). The padlock look shows. Screenshots were looked at
  and kept out of the repo.

Nothing to send to the owners of `screen-states.js` or `npc-office-visuals.js`.

## Step 1. Foundation (2026-11-10)

Built as planned: the claim check fix first (`AccessIdentities.screen_always_locks?`, and
`Game#pc_always_locks?(pc, owner = login_pc_owner(pc))` with `claim_login_session!` passing the
owner it has found), then `lib/break_escape/npc_habits.rb`, the third step in
`prepare_scenario_data!`, `Game#npc_habit` and `Game#written_down?`, the `roles` deletion in the
bootstrap, the schema's step 1 block and the known-field lists. The loader's order is unchanged:
it gains a third step after stamping (review R4-m4).

Deviations and notes:

- The shared fixture `test/support/access_model_scenario.rb` gave Jake `"awareness": "low"`
  (a probe written by the first slice for the withholding test). With the habit now acting,
  `low` fills his `screenHabit` with lockChance 0 and the claim refusal case "no lockChance,
  screen locks on leave" in `access_model_login_test.rb` became a grant. The fixture now says
  `high`, which fills lockChance 1 and leaves every existing claim test unchanged. The new
  withholding test sets `low` on its own copy.
- `expanded_copy` stamps room objects and their contents only, not profile or resource
  contents (the server stamps all four). The equality test is scoped to room objects and their
  contents (review R4-m3).
- `bin/rails zeitwerk:check` does not exist in this engine's Rails task list. The loader test
  reaches `BreakEscape::NpcHabits` by name with no `require`, which is the autoload proof.
- `expand!` writes the NPC's `habits` object only when the NPC has a level, or when an
  authored `habits` object loses invalid entries; a non-object `habits` skips the NPC.

One-off check: every scenario under `scenarios/` (170) rendered through
`Mission#generate_scenario_data` and run through `NpcHabits.expand!`: the output equals the input
and the report is empty for all of them.

## Step 2. The sticky note (2026-11-10)

Built as planned: `Game#login_postit_for` (public), `hasPostit` in `attach_login_accounts!`
inside the existing headless guard, `postitNote` and `Cache-Control: no-store` on every
`GET /login_accounts` answer (404 and 403 included), the desk branch of `openLoginSignIn`
(9.3a's remote branch is not on this branch yet; the test checks it if it appears),
`hasPostit` on `pc_signin_shown`, and `systems/postit-marks.js` with its install in
`core/game.js` and the `syncRoom` call in `core/rooms.js`.

Notes:

- `pcSessions.screenShown` adds `hasPostit` only when its fourth argument is given. The sign-in
  screen always passes it (true or false); a three-argument call sends the same data as before,
  so `pc-sessions.test.mjs` passes unchanged.
- An authored `postitNote` that is empty or only spaces counts as no note on the server.
- Postit marks install unconditionally (not only with the needs system), since a sign-in PC
  with an authored note can be in any scenario.

Browser check on :3001 (`test_access_signin`, game 90): the hot desk shows the note picture at
its monitor's top-left (screenshot looked at); its sign-in screen shows the authored note (the
fallback), `pc_signin_shown` carried `hasPostit: true`, and the `/login_accounts` answer was
`no-store` with keys `pc_id` and `loginAccounts` only. The hot desk has no owner, so there is no
indicator dot beside it; the dot and the note together are seen in step 7's scenario. The full
`test_access_signin` scripted runs were not repeated by this builder (scripted runs are a
separate tester's job, section 15).

Node suite: 455 of 456 files passed; `fingerprint-generator.test.mjs` failed once under
`-j 6` load and passes alone (unrelated to this step).

## Step 3. Validator (2026-11-10)

Built: `scripts/validate_npc_habits.rb` (`ValidateNpcHabits.check` and `report_lines`),
`lib/break_escape/npc_habits/clues.rb` (`pieces`, `readable_texts`, `secret_homes`, `backing`,
plus `reuse_homes` and `parts_all_sourced?`), the wiring in `validate_scenario.rb` (the three
`require_relative` lines, the `expanded_copy` line before `ValidateNpcNeeds.check`, its new
keyword, the `ValidateNpcHabits.check` line after `check_access_model`, and the report printed
after the issue list) and the `screen_habits:` keyword in `validate_npc_needs.rb`.
`check_access_model` is not edited.

Notes and choices:

- The office life keyword's fixture is a plain workstation (`workstation: true`), as review
  R4-m5 says: `ValidateNpcNeeds.workstation?` does not count a sign-in PC, and an
  `autoLockSeconds` on a sign-in PC without `workstation: true` draws office life's "not a
  workstation: it never locks" warning before the line this slice changes. That warning is
  false (the client idles such a PC out) and is for office life's owner, not this slice.
- `main` passes `npc_screen_habits(copy)`: every room NPC's `screenHabit` in the expanded copy,
  authored and filled alike, so the one changed line reads the same value as before for an
  authored habit.
- A profile is the account's own when its `for.people` names the account or it admits no other
  account; a sign-in PC's contents are the account's own when the PC admits only that account.
- Readable text: object `name`, `text`, `observations`, `postitNote` and the same fields in any
  `*Variants` array; NPC `itemsHeld`; `startItemsInInventory`; profile contents;
  `social.intelFacts`, `social.osint.sites` and `social.mailClient.seededMessages` (strings
  under text, body, subject, label, value, title, note, fact, caption); the compiled ink under
  the scenario's `ink/`.
- The sprite suggestion is raised for a workstation where the habit's fill applies, not where
  the PC's own field wins.
- The Wi-Fi key is in `secret_homes` (`networks.<id>.wifi.psk`) whenever a scenario has one.

One-off run: the validator (`--skip-ink --no-graph`) over all 170 scenarios. The only new
`habits:` line on an existing scenario is in `test_needs_sims`: "the mapping on
'workstation_accessed:tom_pc' fires on some leaves only" (Tom's PC authors `lockChance` 0.5 and
the mapping is a print trigger on an open screen). It is a real finding for that fixture's
owner and is accurate; nothing in this slice changes it. No scenario has a habits report.

## Step 4. Dungeon graph (2026-11-10)

Built: the habits block in `scripts/generate_dungeon_graph.rb`, after the identity edges, read
from `NpcHabits.expanded_copy`. Review R4-m7 is settled the first way: the "unlocked screen"
edge is drawn only where the owner has a `locksScreen` habit whose fill applies at that PC (no
lock field of its own), so a PC whose authored `lockChance` 0 or authored `screenHabit` makes
it claimable gets no edge, and `dungeon-graph-identities.test.mjs` is unchanged. Edges for
authored lock fields are a later idea. A "clue" node is the clue object, hung from the lock of
the innermost locked container it sits in, else from its room, so a clue behind the account it
opens shows as a loop. A "same password" edge from a capture or Wi-Fi key starts at a small key
node of its own.

## Step 6. Playtest tooling (2026-11-10)

Built: the scanner takes `game:` (`AccessLeakScanner.new(scenario_data, game: game)`) and adds
the note exception (`$.postitNote` of a `GET /login_accounts` answer whose own `pc_id` names a
PC whose owner the game says `written_down?`), the saved-copy exception (`savedNotes` after an
earlier `/login_accounts` line carried the value, across files in order) and the
`withheld_key` finding (an NPC record with creds, role, awareness, habits or workarounds, by key
and NPC id; the top-level `social` subtree is skipped). `access-leak-check.rb` hands it the game.
`verify-run.rb` prints a `habits` block of values after the access section; its stub gains
`STUB_SCENARIO` and `STUB_POSTIT`.

Notes:

- The scanner's existing fixture test now also expects one `withheld_key` finding: the planted
  `creds` on Jake in `responses.jsonl` line 4 is exactly what the new rule reports.
- Without a game the note exception never applies (a `/login_accounts` note is then reported).
- The sentence for `.claude/skills/playtest-scenario/SKILL.md` ("Access model checks") was not
  written in: skills are edited with the orchestrator's say-so. Proposed text: "From slice 9.1
  the leak check allows a password in two places only: at `postitNote` of a `/login_accounts`
  answer for a writesDown owner's own PC, and in `savedNotes` once such an answer has carried
  it; it also reports any NPC record carrying creds, role, awareness, habits or workarounds.
  The `habits` block of `verify-run.rb --access` and the validator's habits report name who
  never locks and whose password is on a note, so neither is shown to a tester playing blind."

## Step 7. The feature scenario (2026-11-10)

Built `scenarios/test_access_habits/` (scenario, mission.json, ink, PLAYTEST.md, dungeon graph)
with beats H1 to H8; H9 waits for step 5. The validator raises no errors and no warnings and one
habits suggestion (Lena's preset `sometimes`); ink compiles; `check_door_alignment.py` is clean;
the graph has the expected habit edges. Lena's PC id `lena_pc` gives the seeded sequence open,
open, locked, locked.

Deviations:

- The coffee stations take 600 seconds, not 900: the schema caps `useSeconds` at 600. Ten
  minutes away is still "once gone they stay gone" for a beat.
- H4's record: Priya's `screenHabit` is not filled. The plan's H4 row says lockChance 0, but 5.2
  says nothing is filled when every PC the NPC owns sets its own field, and the build follows
  5.2. `PLAYTEST.md` says so.
- H3's task also needs the global `h3_note_seen`, set from `pc_signin_shown:omar_pc` with
  `data.hasPostit === true`, so the run proves the note was shown before the sign-in.
- The mission row was published alone (the fields `db/seeds.rb` sets), not with `db:seed`.

Scripted runs (builder's own Playwright script, :3001): see
`tools/playtest/test_access_habits-report.md`. Every beat passed once three script mistakes were
corrected; the leak check was clean after every beat.

## Step 5. `holdsDoors` (2026-11-10, parked; finished 2026-11-11)

Branch `build/9-1-step5-holds-doors`, from `f86912dd4`. Parked at the user's request.

**Contract 5.4 checked against the code first:** all six clauses are met by the committed door
work (`openToPlayer` is the one question for click and body, `blocksPlayer` follows it,
`handleGateBump` emits `door_gate_denied` at most once per `BUMP_INTERVAL_MS`, a clone hold
answers first, `open()`/`close()` are the only start and end of an open period (exit opening and
`closeNow` go through them), and both branches of `update()` read `_playerBarred`). No change to
the door work was needed.

### Built and tested

- Client (`door-gates.js`): `normaliseGate` keeps `noHold`; `nearGuardIds(g)`; `lastGuards` set
  in `open()` before the body rule, added to per open tick in `update()`, cleared in `close()`;
  one clause each in `_playerBarred` and `openToPlayer`. The careful-set rule is one small public
  helper, `careful(g)`, which both clauses call (an eighth place, beyond the plan's seven).
  `test/js/door-gates-no-hold.test.mjs` (8 tests, every case in the plan's list) passes; the
  other door-gates test files pass unchanged.
- Library: `holdsDoors` in `HABITS` and `PRESETS` (low, medium true; high false); `expand!` fills
  `gate.noHold` (no `playerMayPassIf`, no authored `noHold`, `enabled: false` skipped, string
  `openFor` read as one id); each NPC report item gains `:doors`. Unit tests extended (28 runs);
  a loader test shows the saved game and `filtered_room_data` carry `noHold` and no habits.
- Schema: `habits.holdsDoors`, `gate.noHold`, presets text. Validator: the two step 5 warnings and
  report lines per gate; tests in `validator-npc-habits.test.mjs` (38 + schema test pass).
- Dungeon graph: the secured room's door label gains "gate: held by ...; not held by ...".
- `verify-run.rb --access`: one `gate` line per gate with a `noHold`; two tests added.
- `README_scenario_design.md`: `noHold` row and a "Careful guards" paragraph in Gate doors.
- Validator fix (own commit, can be dropped): `check_lock_credentials` counted only typed items as
  declaring a card id, so a gate whose `requires` is its guard's card drew "nothing can open it"
  (also in `test_gate_tailgate`). A room NPC's card now declares its id. Test in
  `door-gates-validator.test.mjs`.
- Beat H9 in `test_access_habits` (WIP commit): `gate_hall` east of `kai_room`, `store_a` north
  and `store_b` south, gates `holdMs` 6000 and `openRadius` 80, Gary (low) and Sara (high, own
  sprite `female_security_guard_v2`), globals `h9_a_opened`, `h9_b_opened`,
  `h9_sara_turned_back`, task `h9_holds_doors` completed (on Rowan) by `door_gate_denied` for
  `store_b` once all three globals are set; Sara barks on each denial (cooldown 4 s). Validator:
  no errors, no warnings, one suggestion (Lena), as before. Door alignment clean.

**Browser run of H9** (own keyless server on :3031, game 133, started in `gate_hall` with
`--carry-npc rowan`): Gary's gate opened with the player 71 px from it and the player walked in
behind him (`room_entered:store_a`). Within Sara's radius the gate never opened and she turned
back after 5 s (`door_gate_guard_turned_back` sara). Parked outside it opened for her; walking in
after her, at every 16 ms sample the gate was shut or solid (0 passable of 145), and it shut on
the first sample with the player inside the radius (no lingering). A refused click gave the
toast, `door_gate_denied`, Sara's bark and the task. Twenty seconds of pushing: gate never open,
no `room_entered:store_b`, no denial (a bump on a shut gate is silent, as the door work rules).
`verify-run`: Sara's gate `noHold sara`, Gary's none; leak check clean. Note: `store_b` is in
`unlockedRooms` because Sara's route unlocks it on the server; the player never entered it.

**H1 to H8 rerun** (game 134, one game for both runs, reload after H3): H1, H2, H3, the reload,
H4, H5, H6 and H7 all pass with a clean leak check after each beat. Stopped at the start of H8.

### Finished (2026-11-11)

Resumed on a new host: the games below are on a different database from games 129 to 134 above.
Keyless server on :3012. Details in `tools/playtest/test_access_habits-report.md`.

- **H8 rerun** (game 1165, started in `lena_room` with Rowan carried in): open (1, a claim, task
  done, gone on her return), open (2), locked (3, padlock, cue and chime, sign-in screen); after
  the reload leave 1 open again with a claim. Leak check clean.
- **H9** (game 1173): every check of the first run passed again on the final code. `PLAYTEST.md`
  now has Run 3 (H9) with its spots, its header says H1 to H9, and the expected validator lines
  include Gary's and Sara's report lines and Store B's graph label.
- **`test_gate_tailgate`** (games 1174, 1175, 1177): unchanged by step 5 (its gate has
  `playerMayPassIf`, so no `noHold`). No pass, lanyard and clone routes as in its README; the
  README's "NOT RECHECKED" row (a player waiting at the door without a lanyard) is now seen: the
  gate never opened in about 61 s, Sam turned back six times. Not seen in this run: the gate
  shutting after the clone window, and Sam's sight challenge.
- **Validator change** (`8de585565`) kept: the tailgate scenario no longer draws the
  "no item declares card_id" warning, and nothing else changed.
- The WIP commit `b07634550` keeps its title (no rebase in a shared tree); H9 is final as of this
  step.

### The two door and route problems: fixed in the engine

1. **A guard sent back to his door stopped on the radius edge** (commit `4181df1c7`). Cause:
   `approachPoint` put the spot `openRadius - 8` from the door centre; a walker stops within 8 px
   of the end of his path and the spot is snapped to an 8 px cell centre, so he could end up to
   about 14 px further out. At radius 56 that is just outside, and `_approachRouteGate` then finds
   nothing left to walk (the spot is under 8 px away), so he retried for ever with no target.
   Seen live on game 1168 (Gary, radius 56, unlock waypoint (2,4)): he stood 56.1 to 57.9 px out.
   Fix: the spot is 16 px inside the radius (`APPROACH_MARGIN_PX`; still at most 48 px out, at
   least half a tile). Test: `door-gates.test.mjs` checks, for radii 40 to 120 and four
   directions, that the snapped spot plus the 8 px stop is inside the radius; three expectations
   moved with the margin.
2. **A route action lost when its leg was cut short** (commit `66f2136d4`). The handover's "door
   waypoint directly above the door" was not about the door: a chair stands on the cell that
   Sara's waypoint (1,7) snaps to (the world grid counts the chair's cell as walkable, its body
   blocks her). She stopped about 20 px short; the stall re-target (or the stuck recovery) chose
   again, but the waypoint had been counted as taken when its path was found, so its
   `unlockRoom` was skipped and she waited at the unloaded `store_b` for good. Seen live on
   game 1167. Fix in `npc-behavior.js`: when a leg to a waypoint whose `unlockRoom` room is not
   loaded yet is cut short (stuck recovery or the stall re-target in
   `chooseWaypointTargetMultiRoom`), within 1.5 tiles of the spot counts as the arrival and the
   action runs; further off, the waypoint is put back so the leg is walked again. Once the room
   is loaded the old skip stands (the action is only a pause then). Tests: four in
   `npc-stuck-detector.test.mjs`, three in `npc-route-multiroom.test.mjs`.

   Live proof (game 1172, the H9 scenario with Gary at radius 56 and waypoint (2,4), and Sara's
   waypoint at (1,7)): Sara logged "Wedged 19px from a route waypoint with an action: arrived",
   unlocked and loaded `store_b` and lapped through it; Gary went through his gate on every lap
   watched, with no stand-off (three in game 1172, four in game 1170 with fix 1 alone). H9 itself keeps radius 80 and the waypoints (1,2) and (2,8):
   they suit the beat's spots and are no longer a workaround.

### Tests

After merging `8dafe1863` (the habits validator on Ruby 2.7.8), on the project's Ruby 2.7.8,
under the shared lock: `bin/rails test` 1306 runs, 9564 assertions, 0 failures, 0 errors,
1 skip; `bin/test-js -j 3` 475 files passed, 0 failed. Validator on `test_access_habits`: no
errors, no warnings.

### Open

- The playtest skill sentence still needs the user's say-so: "From slice 9.1 step 5,
  `verify-run.rb --access` prints a `gate` line for each gate with a `noHold`; like the rest of
  the habits block it is not for a tester playing blind."
- The world grid treats a chair's cell as walkable while its body blocks an NPC (the cause of
  problem 2). Not changed here; the route fix makes it harmless for route actions.

### Review round 1 outcomes (2026-11-11)

Review: `ACCESS_MODEL_SLICE_9_1_STEP5_CODE_REVIEW_R1.md` (0 blockers, 0 majors, 5 minors,
6 nits). Commits `946b5db9d` (minors 1 and 2) and `7904f54aa` (the rest).

- **Minor 1, fixed.** `check_lock_credentials` now counts a card a room NPC carries as declared
  only when the player can use it: an `rfid_cloner` anywhere in the scenario (object, start item
  or NPC item), or a gate into the locked room whose `openFor` names a holder. Otherwise the lock
  draws its own warning: only an NPC carries the card, add a cloner, a keycard item or a gate.
  Compared with `claude/break-escape-access-design-090sjx` (validator, `--skip-ink --no-graph`):
  m04, m05, m07 and m08 have no soft-lock warning on either branch, before or after the fix,
  because each of the cards the review named is also declared by a keycard item in the scenario
  (and m04 has a cloner); the review listed the cards the line matched, not warnings it removed.
  The one warning the step 5 line removed was `cm_records_badge` in `lab_physical_pentest`; it
  stays suppressed, correctly: the lab has an `rfid_cloner` and Len's gate opens for its holder,
  so it is a clone target, not a soft-lock. A scan of every scenario finds no lock that gets the
  new warning. Tests (`door-gates-validator.test.mjs`): no cloner and no gate warns; a cloner as
  object, start item or NPC item declares it; a gate for someone other than the holder does not.
- **Minor 2, fixed.** Four tests in `door-gates-no-hold.test.mjs`: the clone window ending on a
  careful gate with the player near shuts it on that tick; with the player in the doorway it
  stays open and the body stays off until he steps off, then shuts; with nobody in `lastGuards`
  it is not careful and lingers as any gate (held by a guard's crossing path); Sara opens, it
  closes, then Gary opens beside the player and `openToPlayer` is true. Mutation checks: removing
  the doorway hold in `update()` fails the doorway test, and `close()` not clearing `lastGuards`
  fails the Gary test. **Live check** (keyless server on :3012, game 1186, H9 in
  `test_access_habits`): the player stood 58 px from Sara's gate; with Sara near and the gate
  shut, `doorGates.playerOpen('store_b')` (what a granted clone calls) opened it with
  `lastGuards` sara, careful, open to the player and body off; the window ended at +5980 ms and
  the gate shut at +5999 ms (`door_gate_closed`), body on. H9 has no cloner, so the clone was
  driven through `playerOpen` rather than the RFID minigame; `test_gate_tailgate` has a cloner
  but its gate has `playerMayPassIf`, so it is never careful and cannot show this.
- **Minor 3, behaviour left as the plan says; documented.** The README "Careful guards"
  paragraph now says a careful guard inside the secured room will not come out while the player
  waits within the radius outside, so a loitering player keeps her in.
- **Minor 4, fixed in the test name; engine change deferred.** The test is now "on open floor,
  stopping short of the spot still leaves the guard inside the radius". Dropping an approach whose
  snapped spot lands outside `openRadius - 8` is deferred: no gate scenario has a blocked cell in
  front of a door, and it changes route behaviour that the live runs have just settled.
- **Minor 5, fixed.** The habits report leaves out `holdsDoors` when it comes from the preset and
  no gate opens for the NPC; set by name, the line and its "no effect" stay. Test in
  `validator-npc-habits.test.mjs`.
- **Nit 1, fixed.** The cut-short block calls `_haltForRoute()`, which idles the animation. Test
  in `npc-route-multiroom.test.mjs`.
- **Nit 2, fixed.** `doorGates.state()` gives `lastGuards` and `careful`. Test added.
- **Nit 3, fixed.** `_npcNear(g)` is `nearGuardIds(g).length > 0`: one distance rule.
- **Nit 4, fixed.** An authored `noHold` on a gate with `playerMayPassIf` is a warning; a
  `holdsDoors: false` by name whose NPC is already in every authored `noHold` says so instead of
  "the habit does nothing" (the loader's doors entry now sets `no_hold` for an authored listing).
  Tests in `validator-npc-habits.test.mjs`.
- **Nit 5, fixed.** README: "the player" in place of "he"; "the player cannot tailgate behind a
  careful guard" in place of "cannot be tailgated at all".
- **Nit 6, fixed.** Store B's sign now says the player should not have walked in, not that the
  sign cannot be read.

Suites after the fixes, under the shared lock on Ruby 2.7.8: `bin/rails test` 1306 runs, 9564
assertions, 0 failures, 0 errors, 1 skip; `bin/test-js -j 3` 475 files passed, 0 failed.

### Review round 2 outcomes (2026-11-11)

Review: `ACCESS_MODEL_SLICE_9_1_STEP5_CODE_REVIEW_R2.md` (0 blockers, 1 major, 2 minors, 3 nits).
Commit `e9d5f710d` (validator, tests, nits) and the commit that adds this section.

- **Major 1, fixed.** `check_lock_credentials` reads the gates from
  `NpcHabits.expanded_copy`, so `noHold` is the one the loader writes. A gate into the locked
  room counts as a way in for a card only when it opens for a holder and either sets a non-empty
  `playerMayPassIf` or opens for at least one holder who is not in its `noHold`. When every such
  gate opens only for careful guards (and there is no cloner and no keycard item) the lock gets
  its own warning: only careful guards (holdsDoors false) open the gate into the room, add a
  cloner, a keycard item, a guard who holds doors, `playerMayPassIf` or another door.
- **Minor 1, fixed.** `door-gates-validator.test.mjs` (10 tests): the fixture helper takes
  `passIf` and `awareness`; the existing gate test also runs with no `playerMayPassIf` (Sam with
  no level holds doors, no warning); the review's reproduction (Sam `high`, no `playerMayPassIf`)
  gets the careful-guard warning and not the plain "only an NPC" one; an authored `noHold: ["sam"]`
  gets it too; Sam `low`, `playerMayPassIf`, a cloner, or a second holder who holds doors each
  clear it.
- **`store_b` in `test_access_habits`: the warning is right and stays.** Plan beat H9 expects
  `store_b` not entered (the player never gets in; the scripted run checks twenty seconds of
  pushing never fires `room_entered:store_b`). So H9 is a deliberate soft-lock and its behaviour
  is unchanged. The validator has no suppression mechanism; following `test_access_doors`, the
  warning is recorded as expected in `scenarios/test_access_habits/PLAYTEST.md`.
- **Validator comparison** (`--skip-ink --no-graph`, every scenario with `openFor`,
  `playerMayPassIf`, `holdsDoors` or `awareness`, which covers all `ca*` scenarios,
  `test_social_*`, the two gate scenarios, `lab_physical_pentest`, plus m01 to m10; 84 runs, all
  exit 0) against `claude/break-escape-access-design-090sjx`: one new warning, the `store_b_badge`
  one above. Two vanished, both "no item declares card_id": `cm_records_badge` in
  `lab_physical_pentest` (a cloner, and Len's gate has `playerMayPassIf`) and `test_staff_badge`
  in `test_gate_tailgate` (a cloner, and Sam's gate has `playerMayPassIf`); both are clone
  targets, removed by the round 1 rule. m01 to m10 unchanged.
- **Minor 2, fixed.** The re-indented `if/elsif` and `case/when` blocks in
  `validate_npc_habits.rb` and the one `end` in `validate_scenario.rb` are back at their old
  indentation; only the new `when 'holdsDoors'` line remains in that hunk.
- **Nit 1, fixed.** `verify-run.rb` prints `noHold (none, authored)` for an authored empty
  `noHold`. Test in `playtest-verify-run-access.test.mjs`.
- **Nit 2, fixed.** `verify-run.rb`, `check_gate_no_hold` and the dungeon graph read `openFor` as
  the loader does (a list or a single value, strings only).
- **Nit 3, not done.** The graph label "held by" keeps listing guards with no level; optional in
  the review, and the label is right as it stands.

Suites after the fixes, under the shared lock on Ruby 2.7.8: `bin/rails test` 1306 runs, 9564
assertions, 0 failures, 0 errors, 1 skip; `bin/test-js -j 3` 475 files passed, 0 failed.

### Review round 3 outcomes (2026-11-11)

Review: `ACCESS_MODEL_SLICE_9_1_STEP5_CODE_REVIEW_R3.md` (0 blockers, 1 major, 1 minor, 2 nits).
Commit `3bfaa0039` (validator, loader helper, tests) and the commit that adds this section.

- **Major 1, fixed.** `check_lock_credentials` decides each locked room on its own. A card a
  room NPC carries, with no cloner and no keycard item, is fine only when every room that
  requires it has a gate into it that is a way in. Rooms whose gates open only for careful
  guards get the careful-guard warning, naming those rooms; rooms with no gate that opens for an
  NPC get the "only an NPC carries that card" warning, naming those rooms. A card required only
  by non-room locks keeps the old "only an NPC" warning. Both R3 probes (B: Gary's careless gate
  into `vault`, Sam's careful gate into `vault2`; C: one NPC, authored `noHold` on the `vault2`
  gate only) now warn for `vault2` alone, and each mirror (a second, passable gate into
  `vault2`) is clear.
- **Minor 1, fixed.** Who a gate opens for now matches `door-gates.js` (`nearGuardIds`,
  `careful()`): any room NPC in `openFor`, card or not; an id with no NPC behind it never counts.
  A gate is a way in when it opens for someone and sets `playerMayPassIf`, or when one of those
  NPCs is outside its `noHold`. Probe A (careless Gary with no card in `openFor`) is clear, as is
  Gary alone in `openFor`; a careful Gary still warns; probe E (`ghost`) still warns.
- **Nit 1, fixed.** `NpcHabits.gate_no_hold` reads `noHold` as the client does (the strings of a
  list, else none). The lock check and the loader's report (`doors_entry`) use it, so a string
  `noHold` is no longer read as a one-item list. `check_gate_no_hold` now warns on a `noHold`
  that is not a list (the client ignores it).
- **Nit 2, fixed.** The comment says the check is a warning heuristic, not a proof of
  solvability (a cloner's own reachability and whether a guard ever walks the gate are not
  checked), and the careful-guard message says the player is likely stuck "unless another way in
  exists" rather than "cannot get in".
- **Tests.** `door-gates-validator.test.mjs` 16 (was 10): probes B and C with mirrors, a mixed
  case (one room careful-only, another with no gate: both warnings, each naming its room), probe A
  and its variants, probe E, a string `noHold`. `validator-npc-habits.test.mjs` 43 (non-list
  `noHold` warning). `test/unit/npc_habits_test.rb` 30 runs (`gate_no_hold`, string `noHold` in
  the report).
- **Validator comparison**, rerun as in round 2 (84 runs, `--skip-ink --no-graph`, all exit 0)
  against `claude/break-escape-access-design-090sjx`: unchanged from round 2. One new warning,
  `store_b_badge` in `test_access_habits` (new wording, same room), and the same two gone
  (`cm_records_badge`, `test_staff_badge`). m01 to m10 unchanged. `PLAYTEST.md` paraphrases the
  warning, so it needs no edit.

Suites after the fixes, under the shared lock on Ruby 2.7.8: `bin/rails test` 1308 runs, 9570
assertions, 0 failures, 0 errors, 1 skip; `bin/test-js -j 3` 475 files passed, 0 failed.

### Review round 4 outcomes (2026-11-11)

Review: `ACCESS_MODEL_SLICE_9_1_STEP5_CODE_REVIEW_R4.md` (0 blockers, 1 major, 2 minors, 2 nits).
Commit `7678f5118` (validator, graph, loader helper, tests) and the commit that adds this section.

- **Major 1, fixed.** `check_lock_credentials` now collects, for each NPC card with no cloner
  and no keycard item, every object lock that requires it (`AccessIdentities.room_objects`:
  room objects, container contents, NPCs' items). Tailgating never gives the player the card,
  so these are a gap no gate fills, whatever the room gates say. They get their own warning,
  naming each object path and saying a cloner or a keycard item is needed. A card required only
  by object locks gets this warning in place of the general "only an NPC carries that card" one;
  that general one stays for a lock found nowhere else (a door entry, a start item). Probes P3
  (careless gate into `vault`, safe inside on the same card) and P3b (safe only) warn; a cloner,
  a keycard item, or a safe that also accepts an item card each clear it.
- **Minor 1, fixed.** Only NPCs with a sprite open a gate: `npcType` `person` or `both`, as
  `core/rooms.js` makes sprites. A phone NPC, or one with no `npcType` (`npc-manager.js` reads it
  as phone), does not count. Probes P1, P1b and `run2.rb` (no `npcType`) warn again; `both` is a
  way in; `behavior.initiallyHidden` still counts, as the review allows.
- **Minor 2, fixed.** A lock (room or object) whose `requires` also lists a card the player can
  hold as an item is passed: no careful-guard, "only an NPC" or object warning. The item set is
  taken before NPC cards are declared, so the result does not depend on card order. Probes P4
  and R3 G are quiet; without the item the careful warning stays.
- **Nit 1, fixed.** A gate on an east or west door is no gate for the lock check (`gate_entries`
  now carries the door's `direction`), matching `register()` in `door-gates.js`. Probe P2 now
  gets the "only an NPC" warning as well as the side-gate warning; a south gate is a way in.
- **Nit 2, fixed.** The graph label walks `NpcHabits.gate_entries` (so a gate with
  `enabled: false` is skipped) and skips a gate with a non-empty `playerMayPassIf`; an empty one
  counts as none, as `normaliseGate` reads it.
- **Tests.** `door-gates-validator.test.mjs` 21 (was 16): object lock with a passable room gate,
  object only, object in a container's contents; cloner, keycard and second-card mirrors; phone
  NPC in `openFor`, phone holder, no `npcType`, `both`; item card in `requires` with a careful
  gate and with no gate, plus mirror; east and west gates, south mirror.
  `dungeon-graph-habits.test.mjs` 8 (was 7): disabled gate and `playerMayPassIf` gate unlabelled,
  empty `playerMayPassIf` labelled.
- **Probes.** All of `holds-r3` and `holds-r4` rerun against the branch. R4: P1, P1b, P2, P3,
  P3b, P5, P7, P8, P9 warn; P4 and P6 quiet; P11 and P12 as base. `run2.rb`: no `npcType` warns,
  `initiallyHidden` quiet. `mal.rb`: no crash, every result identical to the previous commit. R3:
  A, F, G quiet; B and C warn for `vault2` only; D, E, H warn. (`holds-r3/run2.rb` calls
  `ValidateNpcHabits.check` with an old signature and stops there; its lock check line is quiet,
  as expected for a string `noHold`.)
- **Validator comparison**, rerun as in round 3 (84 runs, `--skip-ink --no-graph`, all exit 0)
  against `claude/break-escape-access-design-090sjx`: identical to round 3's branch output. One
  new warning, `store_b_badge` in `test_access_habits`; `cm_records_badge` and
  `test_staff_badge` gone. m01 to m10 unchanged.

Suites after the fixes, under the shared lock on Ruby 2.7.8: `bin/rails test` 1308 runs, 9570
assertions, 0 failures, 0 errors, 1 skip; `bin/test-js -j 3` 475 files passed, 0 failed.

## Step 8. `lab_physical_pentest` adopts habits (2026-11-11)

Worktree `.claude/worktrees/p-lab-networks-habits`, branch `build/lab-networks-habits`, on top of
slice 9.3a step 9 (`ACCESS_MODEL_SLICE_9_3_BUILD_LOG.md`). Plan section 12, in its order.

### Preconditions

1. Step 7's runs pass: every beat of `test_access_habits` (step 7 above), H9 with step 5.
2. The lab's feedback pass: the content plan's part (a), A1 to A18, is committed and reviewed.
   Its B3 remainder (the capture log holder in place of the tablet, `storeIn`, `linkStoreIn`) is
   still open; it touches no screen lock field and no owner's leave rate, which is what section 12
   orders this step after, so this step went ahead. B4's held choice (Sofia's PC as a
   workstation) was not taken, so Sofia's `usb_target_pc` is still no workstation.
3. Slice 9.3's lab step (step 9) is finished on this branch.

### Built

- Recipe 1: the only hand-set screen habits were `staff_pc` (`locksScreenOnLeave: true`, owner
  Chris) and `staff_pc_2` (`false`, owner Melanie). No `lockChance`, `autoLockSeconds`,
  `screenHabit`, `policy` or `defaultPolicy` anywhere.
- Recipe 2 and 3: Chris `"awareness": "high"`, Melanie `"awareness": "low"`; both PC fields
  removed; no `habits` object, no `guessable`, nothing on Len. Each level carries a comment naming
  the beat it holds. The presets' `holdsDoors` has no effect: no gate opens for either.
- Recipe 4: office life fields untouched (needs, `needsCompany`, `maxQueue`, `needsDeferMin`,
  `chatterCooldownMin`, the exchange).
- Recipe 5: the two comments reworded to name the habit.
- Recipe 6: validator diff against the baseline is exactly the habits report: hampshire high,
  `locksScreen always (preset)`, lockChance 1 at `staff_pc`; pierce low, `never`, lockChance 0 at
  `staff_pc_2`. No other fill, no "not applied", no screen state mapping warning.
- Recipe 7: `lab_physical_pentest_secrets_test.rb`: Chris's test asserts her expanded
  `locksScreen` `always`, `screenHabit` exactly `{ "lockChance" => 1 }`, no lock field on
  `staff_pc`, and `pc_always_locks?` true, keeping the capture comment; Melanie's assertion is
  `{ "lockChance" => 0 }` and `never`; new test: a claim at `staff_pc_2` is granted (status ok,
  session for pierce).
- Recipe 8: `PLAYTEST.md` "Expected validator output" gains the report and a warning not to show
  it to a blind tester. The dated note in `PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md` is the
  orchestrator's.
- Dungeon graph regenerated: one new edge, `open_plan -->|unlocked screen| lock_staff_pc_2`
  (Melanie's habit fill applies at a PC with no lock field of its own, step 4's rule).
- Leak scanner (`a30e29ad7`): a network string inside `$.contents[...]` of a `POST /unlock`
  answer is now treated as a container answer, as the share and folder rules already do. See the
  browser run. Test added to `access_leak_scanner_test.rb`.

### Lines to voice

None. No ink file changed (tagdiff: structure unchanged in all ten), no bark, no NPC JSON spoken
field. Nothing added, changed or removed.

### Static checks

| Check | Result |
|---|---|
| `scripts/compile-ink.sh lab_physical_pentest` | 10 compiled, 0 failed; compiled JSON unchanged |
| Validator `--no-graph`, then with the graph | Exit 0; diff against the pre-step output is the habits report only. Graph: puzzle edges 43 to 44 |
| Habits report | As recipe 6 (above) |
| `dialoguelint` | Totals by rule: none |
| `tagdiff` (all ten ink files against HEAD) | Structure unchanged |
| Lab Rails tests | `lab_physical_pentest_secrets_test.rb` 35 runs, 0 failures; content, loader and shares tests 32 runs, 0 failures |

### Browser run

Keyless server on :3014, headless, game 1193, one session, responses captured, driven by a
subagent tester from `PLAYTEST.md`. Every secret came from its in-game source (the capture tablet
and Captured sign-ins picker, the in-game capture answer); none typed from a document.

- Habit beat A (keylogger): on Chris's leave `staff_pc` showed `screenLocked: true`,
  `lockedLook: true`, `texture: pc_desktop_locked`; transition `locked: true`; cue
  `how: leave, locked: true`. On her return the capture landed.
- Habit beat B (unlocked screen): on Melanie's leave `staff_pc_2` stayed `pc_desktop`, not
  locked, no transition recorded; the claim was granted and her desktop opened. The run's one
  reload was taken with that claim open: the claimed session ended (by design), `signedInPcs`
  kept `staff_pc_2`, and the game resumed in `briefing_room`.
- BadUSB drop: foothold, the remote session item, its file read.
  **LW-FS01:** the leak scanner raised one `network_string` finding (owner
  `resource:lw_fs01_records`, `POST /unlock`, `$.contents[1].text`): opening the remote session
  item answers with its contents through `/unlock`, which the network rule did not count as a
  container answer. The note is authored container content, served only while the grant is held,
  as `/container` would serve it (a resource host is otherwise withheld; see the 9.3 log, review
  round 1, M4), so the scanner was wrong, not the scenario. Fixed in the scanner (above); over the whole run's
  181 responses the check now says `VERDICT: no leaks found`. Before the fix, beats 1 to 3 were
  clean and that finding was the only one at any later beat.
- Tailgate, the network beats H5.15 to H5.20 (plant, view, folder, remote sign-in to LW-DOOR01
  with Chris's password from the picker, unplug), the hot desk sign-in, the debrief and credits:
  all passed. The debrief needs the hot desk sign-in (`use_creds`) first, as H5.4 says.
- **"The link dropped" toast:** not shown, and not expected here. The unplug answer carried
  `endedPcIds: ["store_controller"]`; `PcSessions.linkDropped` drops the session and passes the
  message to `_closeDesktop`, which shows it only on a remote desktop that is open (9.3 plan 4.1
  and its table: "an open remote desktop closes with 'The link dropped'"). The unplug happens at
  the jack in the world, so in this lab no desktop is ever open at that moment and the player gets
  no message that the remote session ended. A question for the 9.3 owner, not a fault of this
  step; nothing changed.
- Final `verify-run.rb --access`: habits block shows both PCs with no lock field and the two
  fills; footholds 0 (gained `network_port`), sessions 1 (`hot_desk_pc`, password),
  `signedInPcs` `staff_pc_2`, `store_controller`, `hot_desk_pc`; 16 of 16 tasks; score 100.
- Harness notes: the hot desk's visible password field takes per-character key events (a value
  set on the DOM was not seen); a dropped device needs the menu's "Drop here" click after the
  inventory item opens.

Outputs (not in the repo): `<scratchpad>/lab-habits/run/` (session and responses logs).

### Not run

The persona run of section 12 (a tester who does not know the answers, questions after play).
What a model tester cannot judge (sounds, whether the padlock reads) is for the user's own look.

### Suites

Under the shared lock, Ruby 2.7.8: `bin/rails test` 1416 runs, 14672 assertions, 0 failures,
0 errors, 1 skip; `bin/test-js -j 3` 483 files passed, 0 failed.

### Handover

Step complete; nothing in progress. Commits: `b3cb03244` (lab, guard test, PLAYTEST, graph),
`a30e29ad7` (leak scanner), and the build log commit. Open for others: the dated note in
`PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md` (orchestrator), the persona run, the "link dropped"
question above (9.3 owner), and the content plan's B3 remainder.
