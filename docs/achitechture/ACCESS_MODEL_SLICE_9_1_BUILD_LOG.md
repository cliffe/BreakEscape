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

## Step 5. `holdsDoors` (2026-11-10, parked part way: handover)

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

### Half done

- H8 rerun not done; `PLAYTEST.md` has no H9 section, its header still says H1 to H8 and its
  expected validator output does not mention the H9 report lines; `tools/playtest/test_access_habits-report.md`
  has no entry for these runs.
- Full `bin/rails test` and `bin/test-js -j 3` were not run at the end. The last full Rails run
  (after the preset change, before the loader test fix) had 1 failure, since fixed; the targeted
  files all pass.

### Not started

- A `test_gate_tailgate` browser run (plan: show its gates unchanged). The node tests cover
  `playerMayPassIf` ignoring `noHold`.
- The playtest skill sentence (skills need the orchestrator's say-so). Proposed: "From slice 9.1
  step 5, `verify-run.rb --access` prints a `gate` line for each gate with a `noHold`; like the
  rest of the habits block it is not for a tester playing blind."

### Known problems found (door work and route engine, not changed here)

1. A guard sent to `approachPoint` with the default radius can stop with his body centre exactly
   56 px from the door (reach `openRadius - 8`, body 8 px further), just outside the radius, and
   stand there with no target while the player is near his waypoint. Seen with Gary at radius 56;
   H9 uses radius 80 and waypoint (1,2) to avoid it.
2. With Sara's door waypoint at (1,7), directly above the door, her `unlockRoom` action never ran
   (`store_b` never loaded) and she stood with no target. Back at (2,8) it works. Not diagnosed.
3. Port :3017 was taken by another agent's server (`slice-9-2` worktree) when this builder
   started; its first game (129) was opened once there. Games 129 to 132 are scratch.

### Next steps

1. Finish the H8 rerun on a new game (`new-game.rb test_access_habits`), reload inside H8.
2. Add H9 to `PLAYTEST.md` (set-up, the spots used: beside Gary's door feet (98,72); within
   Sara's radius feet (40,232); parked outside feet (160,285)), update its header and expected
   validator lines (gary and sara report lines), and add the runs to the report file.
3. Run `bin/rails test` and `bin/test-js -j 3` and record the counts; squash or retitle the WIP
   commit.
4. Optionally the `test_gate_tailgate` run; pass the two known problems to the door work's owner.
