# USB habit build log (user decision q39)

Plan: `docs/achitechture/USB_HABIT_PLAN.md`. Branch `build/usb-habit`.

## What changed

- `lib/break_escape/access_work.rb`: `usb_refused` joins `FAIL_CAUSES`; `usb_habit`, `usb_every`,
  `usb_habit_refused?`; the cause in `cause_holds?`, `cause_candidates`, `cause_why_reachable?`,
  `cause_belongs?` (work, station only) and `can_fail?('work')`; `plan` carries `usb { every,
  setGlobal }`. Not an owned cause, so eases at the station stay possible.
- `app/models/break_escape/npc_frustration.rb`: an accepted fail whose `usb_refused` cause holds
  sets the habit's declared `setGlobal` (`set_usb_habit_global!`).
- `app/models/break_escape/game.rb`: `usbHabit` added to `WITHHELD_WORK_NPC_KEYS`.
- `public/break_escape/js/systems/npc-needs.js`: `usbUses` counter in the NPC state;
  `_usbAttempt` at the end of a judged work use at the station (not when locked out there): on
  every nth use, a refusing `usbPolicy` appends `{ id: station, why: 'usb_refused' }`, emits
  `npc_usb_refused:<npcId>` and sets `work.usb.setGlobal`; an allowing one emits
  `npc_usb_copied:<npcId>`. `_failTopic` maps `usb_refused` to its own pool. No new imports.
- `scripts/scenario-schema.json`: `usbHabit` on the NPC. `scripts/validate_scenario.rb`: known
  field. `scripts/validate_access_work.rb`: `check_usb_habit` (shape, `every` range, declared
  global, no-plan warning), the `usb_refused` mutter in `check_mutters`, room-NPC-only field,
  and the habit on the work report's `Work` line.
- `scenarios/test_access_social`: beat U1 (room `u1_room` east of F13, Kim, policy
  `usb_locked`, resource `u1_reports`, global `u1_kim_emailed_file`, tasks `u1_refused`,
  `u1_emailed`, `u1_posted`, a `usb_refused` chatter line, a Friendface profile). PLAYTEST.md
  gains the U1 section.
- `README_scenario_design.md`: "The USB habit as a cause"; the `usb_refused` pool row.
- `docs/IDEAS_BACKLOG.md`: the parked USB item marked built.

## Spoken lines (TTS-voiceable, test scenario, not voiced)

- Scenario chatter `usb_refused`: "IT blocked my USB. Email it is, then."

The feed posts are written text, not spoken.

## Tests

- `test/unit/access_work_usb_habit_test.rb`: 9 runs (cause, refusal by policy, `every`,
  can fail, belongs, holds and not owned, reachable and candidates, plan, feed selection and
  reachability).
- `test/controllers/break_escape/usb_habit_test.rb`: 6 runs on the real routes (room data ships
  `work.usb` and withholds `usbHabit`; a fail recorded with its global, then the vent served by
  `/feed_post`; the vent held back before; an ease after is accepted; an allowing policy refuses
  the fail; social media or another PC refused).
- `test/js/npc-needs-usb-habit.test.mjs`: 7 tests (refusal on the second use with event,
  global, mutter and report; the next use eases; every 1 and every 3; an allowing PC copies; no
  plan block, no attempt; locked out, no attempt; the work_fail fallback).
- `test/js/validator-usb-habit.test.mjs`: 7 tests (clean, errors, no plan, mutter, room-NPC
  only, report line, reactive post accepted and dead where USB is allowed).
- Full suites under the lock: see "Suites" below.

## Validator

`test_access_social`: 0 errors; the three expected warnings only (Jake's two mappings,
`priya_pc` maxAttempts, the guard). New report lines for Kim as PLAYTEST.md lists.

## Live proof (keyless server :3035, headless, game 1379, `--start-room u1_room`)

- Kim's room record: `work.usb = { every: 2, setGlobal: "u1_kim_emailed_file" }`, no `usbHabit`.
- Needs log: social use, work use met, then `usb_refused kim_pc`, `use_failed work
  kim_pc:usb_refused`, `turned_back` with grumble `usb_refused`, `failure_counted`.
- Tasks `u1_refused`, `u1_emailed` and `u1_posted` toasted; the vent served on her next met
  social use after the ordered post.
- Server: `npcFrustration.kim.failWhy.work = ["usb_refused"]`, level 30 after two fails and two
  eases (it rises and falls), `globalVariables.u1_kim_emailed_file` true,
  `feedRevealed.kim.shown = ["u1_ordered", "u1_usb_vent"]`.
- Tampered: fails naming `usb_refused` for Kim's social media, for another PC, and for Nadia
  (no habit) were all refused.
- Reload with `?skip_resume=1`: both posts restored in reveal order, no new `/feed_post`, the
  global and level 30 restored.
- `access-leak-check.rb` over the captured responses: no leaks found.

## Left open

- The `usbUses` counter is not saved: after a reload it restarts at 0, which only shifts which
  use carries the next copy.
- The C2 plan's decision 1 ("USB refusal is not a condition") is now superseded by this build; the
  plan text was left as written.
- No mission uses the habit yet; the office-life mission skill could offer it where a PC policy
  blocks USB.

## Suites

Under the shared lock, on `a2ca5dd59` (code and tests; later commits are docs only):

- `bin/rails test`: 1811 runs, 25632 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3`: 509 files passed, 0 failed.

## Code review R1 fixes (`docs/achitechture/USB_HABIT_CODE_REVIEW_R1.md`)

- **M1:** `NpcFrustration#fail_report!` ignores `rearmed` when every cause that holds is
  `usb_refused`, so only an accepted ease opens the use floor. Controller test "rearmed usb_refused
  fails inside the park floor come back tooSoon" (amy at every 1) failed on `0f00d816e` (20 then
  40) and passes now.
- **m1:** the server counts the uses. `usbUses` in the NPC's frustration entry (saved with the
  game, never sent) counts accepted work uses at the station since the last accepted refusal: an
  ease (including at level 0) and a fail without the cause. A held-back (`tooSoon`) report is not
  counted. A fail naming `usb_refused` is refused unless this use is at least the `every`th. The
  browser now reports every met work use at a station that refuses the stick, even at level 0, so
  the count can see them. The browser's counter can only lag the server's (it restarts on a
  reload), so an honest refusal is never refused.
- **m2:** `AccessWork.cause_belongs?` takes `usb_refused` only when `usb_habit_refused?`.
- **m3:** `usbHabit` is on the leak scanner's withheld list and label, with a scanner test.
- **m4** (pre-existing): in `docs/IDEAS_BACKLOG.md`, not fixed here.
- **m5:** the validator warns on a habit with a work plan but no station, and on a `setGlobal` at
  a station whose policy allows USB storage (the global can never be set).
- **n1:** a fail naming `usb_refused` must have `object_id` equal to the cause's id (the station).
  Tested with a non-desk work object amy can use; the test fails with the guard removed.
- **n2:** JS test: a work use at another place (station off) neither attempts nor moves the
  counter; it fails with the `atStation` guard removed.
- **n3:** the README's "Refused" bullet says the mutter comes from the first cause's pool.
- **n4:** the plan's Tests section names the files the build used; its pace-floor claim is
  corrected.

Live (keyless :3035, `--start-room u1_room`):

- Game 1448, Kim's `every` set to 1 in that game's row only, a tampered client posting
  `rearmed: true` refusals 3 s apart: 25, then `tooSoon` four times (level stays 25).
- Game 1447, as authored (every 2): a refusal with no counted use is refused; after one level-0
  ease, 25; then four forged refusals 3 s apart, all refused.
- Game 1450, honest client: Kim's first met use posts an ease at level 0 (answer level 0), her
  second posts the `usb_refused` fail (`rearmed: true`), accepted at 25.

Suites under the shared lock on `1109bee39`: `bin/rails test` 1816 runs, 25657 assertions, 0
failures, 0 errors, 1 skip; `bin/test-js -j 3` 509 files passed, 0 failed.

## Added scope: the habit's USB stick (user request 2026-11-12)

Asked: an NPC with `usbHabit` holds a USB stick in `itemsHeld` (default one `work_file.txt`; a
scenario can list others); the validator errors when it has none and checks the contents; a player
who takes it can open it and read its files, served from the server only; once the stick is gone the
habit stops (the user's decision: a missing stick is no frustration cause, the use is met).

### What changed

- `lib/break_escape/access_work.rb`: `usb_stick(npc)` (the first `usb` item with an id in a habit
  NPC's itemsHeld), `usb_stick_files(stick)` (its `contents`, else one `text_file`
  `<stick id>_work_file` named `work_file.txt` with `USB_STICK_DEFAULT_TEXT`),
  `usb_habit_sticks(data)`; the plan's `work.usb` gains `stick` (the stick's id).
- `app/models/break_escape/game.rb`: `usb_stick_taken?(npc)` (the give record
  `npc_given_items` addresses it, or the NPC is knocked out), `usb_stick_with_npc?`,
  `usb_habit_stick_ids`, `held_usb_sticks` (habit sticks with the taken record whose id the server
  inventory holds, ignoring `clientAdded` entries, with their files resolved from the scenario).
  `find_scenario_object` (the `/unlock` lookup) falls back to them. In
  `filter_requires_and_contents_recursive` a habit stick loses `contents` and gets
  `hasContents: true`, so room data, NPC itemsHeld, knock-out drops and the inventory copy never
  carry the files.
- `app/controllers/break_escape/games_controller.rb`: `find_container_in_scenario` (GET
  `/container`) and `find_object_in_scenario` (the `/unlock` answer) fall back to
  `held_usb_sticks`. The client's contents are never read.
- `app/models/break_escape/npc_frustration.rb`: a fail naming `usb_refused` is refused once the
  stick has left the NPC, and such uses are no longer counted.
- `public/break_escape/js/systems/npc-needs.js`: `_usbStickHeld(s)` (the plan names a stick and
  the NPC record's itemsHeld still has that id); `_usbAttempt` and the level-0 ease report need it.
  A give, a pickpocket and a knock-out already splice the record's itemsHeld; on a reload the
  server leaves a given stick out. No new imports.
- `scripts/validate_access_work.rb`: `check_usb_stick`: errors for no stick, a locked stick, empty
  `contents`, an entry that is not a `text_file`, a file with no id, name or text, a locked file or
  one with contents, duplicate file ids; a warning for a stick that is not takeable.
  `scripts/scenario-schema.json`: the `usbHabit` description covers the stick (the item schema
  already took `contents`).
- `scenarios/test_access_social`: Kim holds `kim_usb` (default contents) and has her own ink
  `ink/kim.ink` (the staff hub plus a once-only "Could I borrow your USB stick?" that gives it).
  PLAYTEST.md gains beat U2. `README_scenario_design.md`: "The stick" bullet and the validator
  line.

Spoken line (test scenario, not voiced): Kim, "Take it. My PC won't read it anyway."

### Tests

- `test/controllers/break_escape/usb_habit_test.rb`: 18 runs (8 new): no files in room data, the
  bootstrap or the inventory copy; a given stick opens to the default file through `/unlock` and
  GET `/container`; authored files instead of the default; an unheld stick gives 422 and 404; a
  forged inventory entry (no record, or `clientAdded`) opens nothing; a stick picked up after a
  knock-out opens; after the give a `usb_refused` fail is refused and uses are not counted; a
  habit NPC with no stick never fails for USB. The existing fixtures gained a stick.
- `test/unit/access_work_usb_habit_test.rb`: 13 runs (4 new: the stick, the plan names it, the
  files, the sticks in the rooms).
- `test/js/npc-needs-usb-habit.test.mjs`: 12 tests (3 new: no stick, the stick taken after the
  first use, a plan with no stick named). The three fail with the stick guard removed. The
  away-from-station test now has a stick, so it still tests the station guard.
- `test/js/validator-usb-habit.test.mjs`: 13 tests (4 new).
- Run without the lock (the test lock rule), before the `locked: false` fix (the controller file
  was rerun after it: 18 runs, 0 failures): every model test plus every controller, unit and
  integration test that touches the frustration, room, inventory, unlock or container routes or
  the USB habit: 48 files, 1003 runs, 0 failures. JS files importing npc-needs.js, the needs-work
  fixture or the validator: 77 files, 1301 tests, 0 failures. Full suites left to the orchestrator.

Validator, `test_access_social`: 0 errors; the three expected warnings only.

### Live proof (keyless :3035, headless, `--start-room u1_room`)

- Game 1530 and again 1537 (after the fix below), honest client: Kim's second work use is refused
  while she holds the stick (`usb_refused kim_pc`, a `usb_refused` fail posted). No response up to
  then carried `work_file.txt` or its text. Asked "Could I borrow your USB stick?", she gives it:
  her itemsHeld is empty and the inventory holds `kim_usb`. Her next four work uses are all met,
  with 0 refusals; only eases are posted.
- Game 1537: opening the stick from the tray sends `POST /unlock` and `GET /container/kim_usb`, the
  container minigame lists `work_file.txt`, and clicking it opens the text-file minigame with the
  default text.
- Game 1511, Kim still holding the stick, tampered client: `POST /unlock` and `GET /container` for
  `kim_usb` and for an invented `evil_usb` answer 422 and 404; a stick forged in the browser's own
  tray opens nothing. No response carried the file text.
- Found live and fixed (`24cb39203`): the client reads an item with no `locked` field as
  key-locked, so the first try showed "Locked, requires key". A habit stick now ships
  `locked: false`, and a controller test asserts it.

### Left open

- A stick dropped on the floor by a knock-out and not yet picked up still stops the habit (the NPC
  is out anyway). Its saved `objects_added` copy keeps the files server-side, like any drop.
- The forged tray check used a client-built stub, which takes the client's lock path; the server
  refusals above are what make it safe.
- No mission uses the habit or the stick yet.
