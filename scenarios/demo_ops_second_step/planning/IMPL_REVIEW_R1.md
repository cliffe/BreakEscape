# demo_ops_second_step: implementation review R1

Reviewer: Opus, read-only, round 1. Branch `ops-follow1`, worktree `/data/be-ops-follow`, at `68adcac6b`.
Read: SHOWCASE_PLAN.md sections 1 to 4, 7, 8.3 to 8.6 and 9; the wave notes for this scenario; `planning/BUILD_REPORT.md`; `PLAYTEST.md`; `scenario.json.erb`; the seven ink files; `test/controllers/break_escape/demo_ops_second_step_scenario_test.rb`; AGENTS.md (mission loop).

**Verdict: not clean** (1 blocker, 2 majors, 7 minors).

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_second_step/scenario.json.erb` | 0 errors, 20 warnings, all of the kinds BUILD_REPORT lists. The regenerated `dungeon_graph.*` match the committed files (no diff). |
| Ink compiled with `bin/inklecate` into the scratchpad and compared with the committed `.json` | all 7 identical |
| `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/demo_ops_second_step/` (node 22) | no findings |
| `flock ... bin/rails test test/controllers/break_escape/demo_ops_second_step_scenario_test.rb` | 14 runs, 209 assertions, 0 failures |
| Password grep (the five literals) | Each appears only in `scenario.json.erb`, as one erb literal interpolated into `creds`, Ama's card and the kiosk card, and in the test's constants. None is in the ink, PLAYTEST, VOICED_LINES or the graph. |
| Shipped scenarios | The scenario's five commits (27561b043, 55587072a, 2139f76c9, ba9af5d14, 68adcac6b) touch only `scenarios/demo_ops_second_step/` and its own test. |
| Realism grep (advisory ids, tool names, module paths) | none found |
| Leak-scan filter | None: `scan(@log)` is asserted `== []` (test:423-430). The passwords test filters `heldItem` (`without_held_item`) until the Track A scanner fix lands. This test needs no such filter, because its run has no hash rows. Noted here so the Track A fixer knows this test needs no change. |

## Blocker

**B1. Anjali never leaves her desk, and nobody goes to lunch, until the player has opened the kitchen. So M1, M6 and M5 cannot open by clicking, and nothing in the game says why.**

The engine only offers need targets in rooms that are already loaded:
- `listObjects()` walks `W().rooms` (`public/break_escape/js/systems/npc-needs.js:5525-5541`).
- A room is built only when the player opens its door (`systems/doors.js:880-890`). Only the start room is created at boot (`core/game.js:2266`).
- The validator warns about the same thing: "it may be unloaded when needed" (`scripts/validate_npc_needs.rb:1682-1687`).

This scenario puts every target these beats need in the kitchen:
- Anjali's only thirst target is the kitchen `water_cooler` (`scenario.json.erb:581`, `:668-675`). Her hunger targets are the kitchen `fridge` and `microwave`.
- Darren's and Lorna's only lunch targets are the kitchen `fridge` and `microwave` (`:640-656`). The lunch lever (`:315`, `:558`) sets their hunger, but there is nowhere loaded for them to go.

How a player gets stuck:
- **M1 and M6.** PLAYTEST Run A (`PLAYTEST.md:52-55`) and Ama's "What's next?" (`ink/ama_owusu.ink:68-72`) take the player from Reception to the Office to press "Send them for coffee". Lorna, Darren and Yusuf go to the office coffee. Anjali's thirst drops to 10 with no loaded target, so she stays put. No fob is left and no note can be read. Ama's hint "If she's staying put, send them for coffee" does not help.
- **M5.** Run C says "Start a fresh game ... Send them to lunch ... Darren goes to the Kitchen" (`PLAYTEST.md:87`), so lunch is pressed before the kitchen exists. `act_midday` fires once only. The scripted run then waits on the office relay's 5-minute cooldown (`:555`) or on natural hunger.

`office_life_showcase` guards against exactly this: its lunch lever waits for `kitchen_seen` ("Have a look in the kitchen first", `scenarios/office_life_showcase/ink/ama_owusu.ink:98-102`, mapping at `scenario.json.erb:256`). This scenario dropped `kitchen_seen` on purpose (`planning/BUILD_REPORT.md:36`, item 9).

Fix (scenario, ink and PLAYTEST). Either of these:
- (a) Copy the `kitchen_seen` global and the `room_entered:kitchen` mapping onto Ama. Gate `lever_coffee` (for Anjali's sake) and `lever_lunch` on `kitchen_seen` in ink ("Have a look in the kitchen first: that's where the water and lunch are."). While `kitchen_seen` is false, "What's next?" sends the player to the kitchen first.
- (b) Put a second water cooler in the office for Anjali's thirst, and keep the kitchen gate for lunch only.

With either choice:
- PLAYTEST Runs A, B and C each start by opening the Kitchen door (and the IT room door) before any lever.
- BUILD_REPORT item 9 is updated.
- A browser run confirms that Anjali leaves on the first coffee press after the kitchen is open, and not before.

## Majors

**M1. The test does not prove the three beats whose server answer is the password itself (M1 the note, M2 the temper note, M3 the overheard login), and the leak-scan run never makes those requests.**

The server decides each of these beats:
- **M1 and M2.** `GET /login_accounts` serves the sticky note `"<username> / <password>"`. It does so only at the PC's own keyboard and only when `written_down?` holds (`app/models/break_escape/game.rb:3600-3616`, `app/controllers/break_escape/games_controller.rb:1748-1753`). For Anjali that is her `writesDown` habit. For Darren it holds only after his `writes_down` workaround is "done", which takes `POST /npc_frustration` (two fails at `perFail` 35 reach 60) and then `POST /npc_workaround` "done".
- **M3.** Yusuf's password reaches the player only in a heard `share_login` "done" answer, in a room the player has opened (`systems/npc-workarounds.js`, header lines 45-58).

The test's header leaves "the notes, the overheard login" to the browser (test:8-10). `run_game` (test:384-421) never calls `login_accounts`, `npc_frustration` or `npc_workaround`, yet it types all five passwords. So the scan has not covered the three routes in this scenario that hand out passwords. Plan 8.3 does not name these beats for S-T. But rule 7 and 8.4 step 5 ask for every answer the run received, and a browser run receives these.

Fix: add three cases, driven as `test/controllers/break_escape/npc_workaround_test.rb:362-395` drives them:
1. Anjali's `login_accounts` answer carries her note; Lorna's and Yusuf's carry none.
2. Darren's answer has no note before the workaround and has one after it: two `npc_frustration` fails with `print_service` down, then `npc_workaround` writes_down "done", then `login_accounts`. A further fail starts no second workaround.
3. Yusuf's `share_login`: an unheard "done" returns `{}` and no password; a heard "done" with `room_id: 'office'` returns the capture.

Then add these requests to `run_game` before the matching sign-ins: the note before Anjali's and Darren's sign-ins, the heard share before Yusuf's. Keep `scan(@log) == []` with no filter.

**M2. PLAYTEST Run C cannot earn Darren's password before the lunch window it needs.**

What Run C says:
- It starts a fresh game, or continues Run B (which never switches the printer off).
- Step 1 presses "Send them to lunch". Step 2 then says "if not earned, press 'Switch the printer off.' first" (`PLAYTEST.md:87-88`). By then lunch has already been pressed.

Why that fails:
- While Darren is at lunch he does no work, so no print fails and no note is written. He writes the note when he gets back, and by then his one long absence with a locked screen is over.
- `act_midday` fires once only (`ink/ama_owusu.ink:49,146-152`). The only other locked absence is the office relay, which needs a re-entry after 5 minutes (`scenario.json.erb:555`).

Ama's guided order is correct: "What's next?" puts the temper note before lunch (`ama_owusu.ink:73-75,85-87`). So a teacher following Ama is fine, but the scripted run is not.

Fix: in Run C, before step 1, open the Kitchen, press "Switch the printer off", and wait for "That's it. I'm writing it down." and the task tick. Then press lunch. Say in the run's opening line that lunch fires once only.

## Minors

1. **Reading Darren's temper note in the morning.** `PLAYTEST.md:63` says "Click Darren's PC once he is back at the desk".
   - With its owner at the desk, a click on the PC shows "Darren Price is using this PC." and no sign-in screen (`systems/unlock-system.js:630`, the `pcUserAt` check at `:661-664`).
   - His morning trips are all under 90 s, so his screen stays open and a click claims it; the sign-in screen with the note never shows. The note can be read only at lunch, or straight after signing out of a claimed session while he is still away.
   - The task ticks on the workaround event, so only the wording is wrong. Fix: "The task ticks when he writes it. You read the note on his sign-in screen at lunch (Run C)."
2. **Free play: an expired push writes no row.** `PLAYTEST.md:103` says "Let a push wait past its expiry (five minutes) and see the expired row in the log".
   - A step left past the pending time is refused. `mfa_expired` is written only at the 20-prompt cap (`app/models/break_escape/mfa_sign_in.rb:154-157`, `if capped`). The S-T report and test:198 agree.
   - Fix: "Send the request twenty times: the step ends and an expired row is written."
3. **The M4 tick is not tested at its source.** The `step_holds` tick reads `data.n` from the prompt answer's `promptsSent` (`systems/mfa-client.js:259-262`).
   - The M4 test (test:164-182) checks `approved == false` and the summed log count.
   - It never checks `promptsSent` (expected 1, then 2). It also never checks that the two requests merge into one log row with `n == 2` (plan 7.4, "one row with a count").
   - Fix: assert `prompt('lorna_pc')['promptsSent']` on each request, and `rows('mfa_prompt_sent').size == 1` with `.first['n'] == 2`.
4. **The pestered beat says nothing when it happens.** Plan 7.4 M5 has Ama say "He approved just to make it stop."
   - The build puts that line only in `recap` (`ama_owusu.ink:220-225`), and PLAYTEST:89 says so. A teacher hears nothing at the moment Darren approves.
   - Fix: add a onceOnly bark on Ama with the same `mfa_approved:darren_price` / `data.pcId === 'darren_pc'` condition. There is room in the budget (onceOnly 6/10).
5. **The cake can spoil the lunch beat.** The starting cake (`scenario.json.erb:108-120`) is a hunger magnet with `useSeconds` 12.
   - Dropped in the office, it can turn Darren's lunch into a 12 s trip. His screen then stays open, and M5 becomes a claim instead of a pestered sign-in.
   - Fix: add a PLAYTEST line ("don't drop the cake before M5"), or make the cake `satisfies: ["social"]` only.
6. **Barks that can be untrue.**
   - "Darren's popped out for coffee. His screen is still open." (`scenario.json.erb:284`) fires on his first leave of the morning, for any reason and whatever the screen state. A trip to the cooler or a long queue makes it untrue. Fix: "Darren's away from his desk. See if his screen is still open."
   - The short version says "a phone by the kettle" (`ama_owusu.ink:248`), but the phone is by the coffee machine. For the dialogue fixer.
7. **Office relays keep firing on later entries.** The `room_entered:office` relays with `coffee_call > 0` (`scenario.json.erb:554,586,625`) reset caffeine or thirst on every entry at least 5 minutes apart, once coffee has been pressed even once.
   - This is harmless and even useful for recovery, but nothing documents it.
   - Fix: one sentence in BUILD_REPORT item 4.

## What holds

**Levers and ticks**
- Every beat M1 to M10 has a lever or a forced window:
  - coffee: M1, M4, M6, M7, M8
  - printer (Ama or the socket): M2, M3
  - lunch: M5
  - none needed: M9
  - "Call it a day" with Thandiwe: M10
- Ticks follow contract 8.3.1 exactly, plus the P6 mapping on `pc_signin_shown:anjali_pc`.
- The objectives list the aims and tasks in the plan's order.
- `coffee_call` is a counter with `cooldown: 0` and no condition (section 4).

**Access**
- Each MFA PC's `access` list names only its owner, and the test proves every cross-account refusal.
- Niamh is exempt, and she is the only one.

**The test** drives real routes and reads each assertion back from a re-read game:
- M4: no deny row, refused after the pending time, and the cap.
- M5: approval on the third request, and the count survives a fresh sign-in.
- M6: the device route is refused before the take, a wrong code is counted, the code works once only.
- M7: a wrong number cancels with no failed sign-in, and the approver is `held_phone`.
- M8: the claim writes no row, and the claim at Lorna's PC is refused.
- M9 and M10: the rows, the burst of 12, no code or password in the reader, and a read writes no row.

No check has been weakened: `count` sums `n`, and nothing is filtered.

**Writing**: UK English, plain lines, no variables printed, no password in any line.
