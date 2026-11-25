# demo_ops_second_step: build report (unit S-S, wave 1)

Scope: SHOWCASE_PLAN.md sections 4, 7.1 to 7.4, 7.7 to 7.9, contract 8.3.1. No helpdesk, no lock step, no `records_room` or `archive_store`. No `dungeon_graph.*` (the wave-2 T unit writes it, plan R1 m7); the validator was run with `--no-graph`.

## Probes

- **P6** (is there an event when a written-down note is shown?): yes. The sign-in screen emits `pc_signin_shown` and `pc_signin_shown:<pcId>` with `{ pcId, usernames, usernameList, hasPostit }` (`public/break_escape/js/systems/pc-sessions.js:1231-1238`, called from `public/break_escape/js/systems/unlock-system.js:814`; the suffix is added by `_emit`, `pc-sessions.js:365-370`). `see_note` therefore also has a mapping on Ama: `pc_signin_shown:anjali_pc` with `data.hasPostit === true` (scoped to Anjali's PC, because Darren's PC also shows a note after the temper beat). The ink tick in `tell_note` stays as the contract says.
- **P8** (office-life sync budget, validator output): reveal and left-behind globals 2/6; office-life onceOnly mappings 6/10; office-life items 3/4; small keys 23/64; workstation globals 12/24; frustration 2/6; workaround slots 2/4; magnet servings 1/2.

## Validator

`ruby scripts/validate_scenario.rb scenarios/demo_ops_second_step/scenario.json.erb --no-graph` (ink included, the S-I ink has landed): 1 error, 22 warnings.

- The one error is `work: Friendface phone 'Yusuf's phone' ... is not in yusuf_demir's itemsHeld` (`scripts/validate_access_work.rb:80`). It contradicts `docs/ACCESS_AND_NETWORKS.md:828` and `validate_mfa.rb` (a loose owned phone is a warning, "free to take"), and the plan's M7 needs the phone as a room object, because a left-behind item is looked up only among loaded rooms' objects (`public/break_escape/js/systems/npc-needs.js:6147-6160`). Fix belongs in `validate_access_work.rb` (skip an owned phone that has `leftBehindChance`); not touched here (not this unit's file).
- Intended warnings: `lorna_pc` "nobody passes this push step" (7.4); `kiosk` policy "does nothing" (Niamh is exempt, by design, M9); `yusuf_phone` lies loose (M7); `workstation_accessed:darren_pc` fires on some leaves only (M8 needs the short coffee trip).
- Warning for the S-I unit: `ink/ama_owusu.ink:11` `VAR see_note_done` (and every `<task>_done` VAR) is also a scenario global; the validator wants a "// Synced scenario global" comment on those VAR lines. Also `ama_owusu.ink:115` has `#give_item:text_file` after a dialogue line (must come before it).
- Remaining warnings are the standard "need target is in another room" notes for the kitchen, as in `office_life_showcase`.
- `python3 scripts/check_door_alignment.py`: all three connections OK. `tools/check_mapping_index_drift.rb`: 0 scenarios checked (new scenario).

## Away times (7.4 "Who is where")

Not measured in a browser (no run in this unit); estimated from `_expectedAwayMs` (`npc-needs.js:3412-3441`: walk distance over speed, plus the target's `useSeconds`, plus queue wait). Coffee trip: 12 s use at the office machine (a queue of up to three adds up to 24 s) plus a few seconds walking in one room: about 25 to 45 s, under Darren's 90 s threshold, so his screen stays open (M8). Lunch: the kitchen fridge and microwave presets use 15 s and 10 s, which would give about 35 to 50 s in all (under 90 s, so the screen would stay open and M5 would fail). So both kitchen hunger objects carry an explicit `affordance.useSeconds: 100` (the microwave also `capacity: 2`), which makes Darren's and Lorna's lunch trip over 100 s. The threshold stays at 90 s. The Haiku run should confirm both and record the real numbers.

Darren's `social` need goes to the kitchen water cooler (15 s preset, `useSeconds` 40 on the cooler here), about 60 s away, still under 90 s: an extra open-screen chance, harmless.

## Where the plan was wrong or needed a change

1. Loose owned phone: see the error above.
2. `wk_share_login` "Printer's dead. I'll ask Anjali to send it from hers." is 53 characters; a bubble holds 40 (schema error). Shortened to "Printer's dead. Asking Anjali." (30). Contract 8.3.1 quotes the long form; the S-I unit does not use it (the line is scenario chatter).
3. The printer resource cannot share an id or name with its object (`network model` error): resource id `print_service`, name "Print service"; the object stays `office_printer`.
4. NPCs in the office listen for `coffee_call`, `act_midday` and `act_evening`, but the start room is reception, so their mappings only exist once the office has loaded. Each live mapping carries `"fireOnlyWhenLoaded": true`, and `room_entered:office` relays (cooldown 300000 for the needs ones) catch a lever pressed before the first visit.
5. Thandiwe has no `work` need: with the preset on, a `work` need sends her to the nearest PC with a work affordance, which would be Darren's or Yusuf's.
6. The coffee machine sits at (8, 7), not (8, 8): the office has a south door, and the copied queue cells fell next to it.
7. A needs-based `workstation: true` is written on every owned PC, so `habits.screen` on Darren is read.
8. Positions are by hand from the room size (10 by 10) and the other scenarios; nothing was rendered. Check the room look in the first browser run.
9. `heard_exchange_cooler_chat` and `kitchen_seen` (office-life globals in the contract's copy list) are not declared: the cooler exchange and the kitchen-seen mapping are not used here.

## Rule 7

Each of the five passwords is one literal at the top of the erb. Rendered, each appears only in the owner's `creds`, in `credentials.lorna_login`'s item (`lorna_login_card`, Ama's `itemsHeld`) and in the kiosk card's text. No ink, chatter, objective or notice-board text holds one (grep over the scenario folder).

## Unit S-T (wave 2): integration, test, playtest outline, graph

- Integration: the two ink warnings from wave 1 are closed. `give_lorna_card` now tags `#give_item:text_file` before the dialogue line (the bare type form, as `test_ops_mfa/ink/hana.ink` does), and every `VAR` that is also a scenario global carries `// Synced scenario global` (Ama's fifteen, Thandiwe's `act_evening`). `scripts/compile-ink.sh demo_ops_second_step` compiles 7 files with 0 failures; dialoguelint under node 22 gives 0 ERROR lines; the validator's ink step reports "All ink files valid".
- Validator after the loose-phone fix landed in `validate_access_work.rb`: 0 errors, 20 warnings, all of the kinds listed above (the intended `lorna_pc` push, the unused `kiosk` policy, loose `yusuf_phone`, `workstation_accessed:darren_pc`, kitchen need targets in another room, missing recommended fields).
- Dungeon graph regenerated by the validator for this scenario only (`dungeon_graph.{html,json,md}`).
- Away times are still estimates: PLAYTEST.md asks the first browser run to record the real seconds.
