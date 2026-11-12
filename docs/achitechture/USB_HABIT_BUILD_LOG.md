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

## Added scope, not started: Kim's USB stick (coordinator, 2026-11-12)

Asked: an NPC with `usbHabit` holds a USB stick in `itemsHeld` (default contents one
`work_file.txt`; a scenario can list others); the validator errors when it has none and checks the
contents; a player who takes it (given, pickpocketed, picked up after a knock-out) can open it and
read its files, contents served from the server only; once the stick is gone the habit stops; demo
on Kim in U1; tests and a live check.

Not built: this builder's context ran out. Research for the next builder:

- An item type exists: `"type": "usb"` with `"sprite": "usb_bowl1"` and `usbClass` (see
  `scenarios/test_access_work` `kit_usb`). `inventory.js` (about line 383) keeps the sprite apart
  from the type on reload. No new art needed.
- Opening: `interactions.js` (about line 1712) opens anything with `contents` or `hasContents` as
  a container (`startContainerMinigame`); the server strips locked contents and marks
  `hasContents`. `GET container/:id` (`games_controller.rb#container`) finds containers in room
  objects, nested contents and `@game.held_grant_items`, and serves them only when
  `check_container_unlocked` (the id in `unlockedObjects`). An NPC's `itemsHeld` is not searched,
  so a held stick's contents need a lookup (held by the player: from the give record
  `player_state['npc_given_items']`, or the inventory) and must be withheld from room data.
- `Game` (about line 1170) drops from each NPC's `itemsHeld` what the give record says the NPC
  handed over; `ItemIdentity.addressed_by?` matches. The habit stopping should read the same record
  (server: in `usb_habit_refused?` or a wrapper that takes `player_state`, which makes it no longer
  static; client: `_usbAttempt` checks the NPC still holds the stick).
- Recommended answer for "is a missing stick a frustration cause": no. Without a stick there is
  nothing to copy, so the use is a plain met use; no new cause, no mutter. A missing stick is the
  player's doing and should calm the NPC, not wind it up.
