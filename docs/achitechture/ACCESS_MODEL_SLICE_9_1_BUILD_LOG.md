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
