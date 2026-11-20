# m10 Full Disclosure: confirmation playtest 1 (after the fix round)

Browser playtest, 2026-10-22, keyless server :3001, headless (machine load average about 48), playtest-scenario skill. Regression run, not blind. Mechanical driving only, no VM files. Every game fresh.
Screenshots, helpers and session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10cf1/` = `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10cf1/`. Session logs are `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10cf1/s<game>.jsonl`.

Games and what they covered:
- 3074 cold start: items 2 (before table, after table), 4, 11 baseline, T-58a/b.
- 3078 head-start flag 1: table, split, Arakawa's call, breach, tunnel, item 12 (blast side).
- 3080 imports m08_completed + flag 1, tether "Leave him in the van": item 12 (Phantom at spawn), T-03.
- 3082 imports arrested + flag 1, Nightshade's map ("Name them", "We go by your map"): item 3, item 5 (handset).
- 3086 head start in power_room, hall with raid copies: item 6 (stand-down), item 5 (plotting board, schedule terminal).
- 3089 as 3086, plus the spare card taken from the fitter's locker (assisted lockpick): item 2 (gallery stair with a card).
- 3091, 3092 hall without a team: item 6 (no stand-down option, two challenges).
- 3093, 3094, 3095, 3097, 3098 gallery: item 7 (control, rota route, Vos route, with and without `lock_guard_known`).
- 3102 cold start with `--set arakawa_ko=true`: item 11.

## Results

| # | Item | Result |
|---|---|---|
| 2a | Blast door before the table: one bark per try | PASS |
| 2b | Blast door after the table, before flag 1: one bark per try | PASS |
| 2c | Blast door while Arakawa is on the phone: one bark per try | PASS (see note) |
| 2d | Gallery stair with an RFID card held: pointer bark | PASS |
| 3 | Inner door: first push no ladder bark, second push the bark, HaX "[Where are we?]" says the ladder | PASS |
| 4 | Incident file shows its text | PASS |
| 5 | duty_handset, plotting_board, schedule_terminal open from the normal approach | PASS for reach; **plotting_board FAILS on content** (see F-1) |
| 6a | Hall, raid copy present: "(Wave the team up...)" shows, both guards stand down and park, no second challenge | PASS |
| 6b | Hall, no team: two challenges | PASS (4 s gap not isolated, see note) |
| 7 | Fonoti, no keypad challenge after "Go on through" / a Vos card | PASS when `lock_guard_known` is set as real play sets it; see F-2 |
| 11a | 02:00 screen shows before the split | PASS |
| 11b | Arakawa KO'd: clock skips 02:10 | PASS (KO by head-start global, see note) |
| 12 | Phantom clear of spawn; Arakawa and Nightshade clear of GEN 3 and the tank | PASS (Nightshade marginal, see note) |
| T-58a/b | Gate-console texts arrive | PASS |

## Evidence per item

**2a.** Game 3074, cold start, `door_scene_done` false. Bark "Netherton won't call it till the table's settled." One `showBark` per push (hooked `barkSystem.showBark`). A push made while the same bark is still on screen produces none (the engine suppresses the duplicate); never two. Screenshot `t2a_blast_before_table.png`.

**2b.** Game 3074 after the table, `flag1_submitted` false: "Their monitoring first. Then we go." one per push, same duplicate suppression. `t2b_blast_after_table.png`. T-11 ("The gate terminal's yours...") arrived 3 s after the table closed.

**2c.** Game 3080: flag 1 head start, table, tether choice "Leave him in the van", split. Arakawa's call opened; I closed it unfinished (`arakawa_call_done` false, `pair_back` false), then pushed the blast door. One bark, "Arakawa's still on the phone. Quintero's waiting on him.", and Arakawa's call reopened as designed. `t2c_blast_phone_window.png`. Note: the window only exists if the call is abandoned. When played through, `pair_back` is set the moment the call ends (games 3078, 3082), so a player who plays the call out never sees T-03. Not a defect, but T-03 is nearly unreachable in normal play.

**2d.** Game 3089, spare card (`Spare Power-Room Card`) in the inventory, flag 2 not submitted. Gallery Stair push gave "The staging copy first." once, and the RFID minigame opened as well (`mismatch` not relevant, a card in hand opens the cloner as the contract says). `t2d_gallery_stair_with_card.png`. Note: `--give fitter_spare_card` put nothing in the inventory in this build (`new-game.rb` reports "give ... (keycard, from security_office)" but the client inventory stayed at 7 items; checked twice). I took the card from the locker instead.

**3.** Game 3082 (arrested branch, "Name them", "That'll do. We go by your map"; `tripwire_armed` true). Push 1 at the inner door: `tripwire_tripped` true, no bark (log empty), HaX's tripwire call opened. Push 2: "The ladder at the guard post. Up and round." once. HaX "[Where are we?]" in the phone thread returned "The ladder at the guard post. Up and round." (`t3_push2_ladder_bark.png`, `t3_where_are_we_ladder.png`). Ladder then opened the inner door and HaX's ladder call played. Observation: HaX's tripwire call itself already says "There's a ladder at the guard post. Up and round." so the player has the pointer on push 1, by call, not bark.
Tethered branch (game 3078): `tripwire_armed` false, the inner door is open from HaX, no tripwire. Correct.

**4.** Game 3074, `incident_file` (type notes4): opens a viewer with the full file, items 1 to 4 readable, including "4. Stores. Every unit 0x47 signed in for evaluation..." `t4_incident_file.png`. The bridge reports `no-effect-confirmed` for it because a notes viewer is not a minigame; the text is on screen.

**5.** Game 3082: `duty_handset` opens its examine panel then Ghost's call (task `answer_the_handset` done). Game 3086: `schedule_terminal` opens its examine panel ("The staging copy of the release schedule, behind the monitoring host's login."), `plotting_board` opens. All three reached with `moveToNear` + `interact`, no `arrived-but-outside-plain-range`. Screenshots `t5_duty_handset.png`, `t5_schedule_terminal.png`, `t5_plotting_board.png`.

**6a.** Game 3086, entered server_hall from power_room (not spawned in it, because a head start in the hall never fires `room_entered` and leaves `hall_team_present` false). `hall_team_present` true. Guard A challenged within about 3 s: "Hall's closed. Turn around." with "1. (Wave the team up behind you.)" first (`t6_hall_wave_option.png`). Chosen: narrator beat, then "That's more of you than they pay me for. I didn't see anyone." `hall_guards_stood_down` true. Watched 32 s and then walked the full hall to the plotting board and the schedule terminal: no second conversation, guard A stayed at (414,166) and guard B parked at (765,229). Same result in game 3089 (and the guard challenge there was the first thing on entry).

**6b.** Games 3091 (all three raid copies knocked out by globals): `hall_team_present` false; the challenge has no wave option (choices "I'm going to the core. Read the photo." and "Move."); screenshot `t6_hall_no_team_challenge1.png`. Game 3092: both guards sighted back to back (sighting events emitted, synthetic, because the first real challenge blocks all input): guard A opened at 27.2 s; guard B's challenge was held behind it and opened at 49.5 s, the moment A's conversation closed. Both challenges fire, never overlapping. I did not isolate the 4 s gap itself (A stayed open about 22 s while I read it). "Core's past us. Nobody's going past us." then turned guard A hostile and knocked the player out in game 3091 (expected hostile fight).

**7.** Control (game 3093, nothing known): keypad push then close, Fonoti challenges 3 to 10 s after (`t7_control_challenge.png`) and the bark "That takes the shift code..." plays. Vos route with `vos_outcome=bought` and `lock_guard_known=true` as Vos's "Deal" sets them (game 3097): keypad push, close, 66 s watched, Fonoti walked to 58 px from the player twice (x=221, 222) with no challenge and no bark. `t7_vos_known_no_challenge.png`.
Without `lock_guard_known` the challenge still fires after the "Vos sold you out" and "The rota says you carry the card" lines (games 3095, 3098; `t7_vos_route_challenge_withoutknown.png`, `t7_rota_route_challenge.png`). Those lines do not set it. In real play the globals come from Vos's "Deal" (ink line 50), Ghost's card (ink line 85), Victoria's "Go." and the Tunnel Post Rota's onRead (ERB line 2763 sets `gallery_rota_read` and `lock_guard_known`). My head start for the rota route set only `gallery_rota_read`, so that run was not faithful; the faithful state is the 3097 one. I did not read the rota in-game, so the onRead path is read from the ERB, not run.

**11.** Game 3102: console used first, then the table. When the table conversation closed, `raid_clock` was already `t0200` and `split_started` was still false. An in-page poll opened the Table Screen in that window: "EARLY ACCESS 04:00 · RELEASE 06:00 UTC · NOW 02:00" (`t11_clock_0200_before_split_ko.png`). Split began 0.8 s later. Event order from the page: t0145 > console used > t0200 at table close > split. With `arakawa_ko` true, Arakawa's call finished and `raid_clock` stayed `t0200` (never `t0210`); the screen afterwards still read 02:00 (`t11_clock_0200_after_split_ko.png`). With Arakawa alive (game 3074) the screen read 02:10 after the split (`t11_clock_0200_after_split.png`, `t11_clock_before.png` is the 01:45 baseline). Arakawa's post copy is `ko-immune` (`debugKO` refuses), so the KO case used `--set arakawa_ko=true`, not a fought or `debugKO` KO.

**12.** Spawn (game 3080, Phantom and Vector on the team through `m08_completed`): player at (160,144) in the middle of the post, Phantom at (224,97) and Vector at (128,97), no overlap (`t12_g3_spawn_phantom.png`). Blast side (game 3078): Arakawa at (544,225) below GEN 3, clear of the bay; Nightshade at (576,161) beside the tank bay, clear of the tank and GEN 3, with his head touching the bay's lower hazard border, so marginal but not overlapping (`t12_g2_blast_side.png`).

**T-58a / T-58b.** Game 3074. T-58a "Field console by the gate first. Start it, then the terminal." arrived 8 s after `door_scene_done` (5 s after T-11). T-58b "Not the terminal yet. The field console beside it." fired on the first Gate Terminal open. With the console already used (head-start games 3078, 3080, 3082) neither text arrived.

## Findings

- **F-1 (major). `plotting_board` opens the wrong minigame.** Server hall, object type `command_board`. It opens "NORTHGATE GENERAL HOSPITAL - MAJOR INCIDENT RESPONSE / LIVE INCIDENT BOARD" with an incident timeline, system-status tiles and a "LOG DECISION OR ACTION / POST" box: m02's board, not a 1960s plotting board with red tape. `t5_plotting_board.png`. m07 and m08 hit the same engine route (`interactions.js` sends `command_board` to that minigame) and fixed it in PASS 2 by changing the type to a readable (their ERB comments say so). m10 needs the same: make `plotting_board` a `notes`/readable carrying its observation text. The reach fix (item 5) is fine; the content is wrong.
- **F-2 (minor). Fonoti's own card-handover lines do not set `lock_guard_known`.** If a state ever gets `fon_card_given` without one of the four setters above, he still challenges at the keypad after saying "Go on through". Not reachable in normal play as far as I can tell. A one-line `~ lock_guard_known = true` in the three card branches of `m10_fonoti.ink` `talk` would close it. Related: after "Go on through" the bark "That takes the shift code. It's on my card, and it stays there." still plays on the first keypad push in that state (game 3094).
- **F-3 (minor, T-03 reach).** See 2c: T-03 only plays if the player abandons Arakawa's call.
- **F-4 (minor, tooling).** `new-game.rb --give fitter_spare_card` reports success but the item is not in the client inventory.
- **F-5 (note).** An identical bark is suppressed while it is on screen, so the second of two quick pushes at a door can be silent. Not a doubled-bark risk.

## Verifier

`verify-run.rb` outputs (games where the run left the forward post show "progress recorded"; 3074 and 3102 only exercised the forward post, so the verifier calls them "BOOTSTRAP ONLY" and the claims for items 2a, 2b, 4, 11 rest on the session logs, not on the verifier):
- 3082: progress recorded, 3 rooms beyond the first, 1 flag submitted (head start), 8 tasks completed.
- 3089: progress recorded, 4 rooms beyond the first, 1 object unlocked, 6 tasks completed.
- 3074: BOOTSTRAP ONLY (settle_the_table completed in play).
- 3102: BOOTSTRAP ONLY (settle_the_table completed in play).

## Earned secrets

No PINs or flags were typed. Flag 1 was a head start (`--submit-flag`), not earned, in games 3078, 3080, 3082. Items 6, 7, 11 used head-start globals as listed above.
