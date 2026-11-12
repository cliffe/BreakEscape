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
