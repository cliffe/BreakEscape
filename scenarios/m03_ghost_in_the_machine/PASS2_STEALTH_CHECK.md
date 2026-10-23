# m03 stealth and A4 regression check (targeted, not blind)

Questions answered: 2 (unexpected behaviour: Terry, stealth) and 1 (plumbing for the A4 fixes). Not a solvability pass: the four VM flags were supplied from the session flag XML (not earned), and Terry was KO'd with `debugKO` in game C (assisted).

Headless, keyless server :3001, load about 1. Sonnet-class tester. Screenshots are in `tools/playtest/m03-stealth-shots/` (copied from the scratchpad).

## Games and logs

| Game | Purpose | Log | Lines |
|---|---|---|---|
| 2196 (A) | Main run: day check, bark, Terry challenge, "ten minutes", read-dropped reload, debrief and credits | `tools/playtest/m03-stealth-A-2196.jsonl` | 1205 |
| 2197 (C) | Cloner glimpse, reload, lockpick-in-sight, combat, Restart, mission finish after hostile Terry | `tools/playtest/m03-stealth-C-2197.jsonl` | 919 |

## Results at a glance

| # | Test | Result |
|---|---|---|
| 1 | Lockpick in Terry's sight, night | PASS (hostile at once). Hostility is real combat, see S1 |
| 2a | On-sight challenge at night | PASS |
| 2b | "Ten minutes" warning | NOT DESIGNED (ink wording only) |
| 3 | Day: no challenge on sight | PASS |
| 4a | "What's your route?" has three replies | PASS |
| 4b | Ffion bark once, not on re-entry | PASS (one caveat) |
| 4c | Cloner callback after a reload | PASS (both read_dropped and cloner paths) |
| 4d | Debrief approach line and credits lines | PASS (both approaches) |
| 4e | Ffion day hub: only leave starts with "Thanks" | PASS (note on the entry menu) |
| 4f | Backgrounds match room and time of day | PASS (5 conversations) |

## 1. Lockpick in Terry's sight (game C)

Setup: night, Terry already talked round at his challenge (excuse "Sterling asked me to grab some files", then "Training programme enrolment forms", then "I'll let you get on"; log 365-413, he ends on "Mind how you go."). I stood at the executive office door (574,-83) and polled Terry's x from `room`; when he reached x=488 (walking east to his post) I called `interact` on `door:executive_wing_hallway->executive_office` (log 429-433). This is the real start of the pick: the result event was `door_unlock_attempt`. I did not use `completeLockpick`.

What happened:

- The lockpicking minigame never opened. A person-chat opened instead (log 434-437): Narrator "A torch beam lands on your hands, and on the pick in them." then Terry "Picks. Right. We're done talking." The chat closes after that one line (no choices).
- `guard_attacking` was already set by the first `brief` after the interact. He is hostile at once (`#hostile:terry_mott`).
- Hostile means real combat. Terry walked up and hit for 10 HP a time. I deliberately stood still: HP 90, 50, 40, 30, 10, 0 in about 12 s from the end of the chat. Then the "KNOCKED OUT / You have been defeated" screen with Restart and Main Menu (log 455-456, screenshot `t1_combat.png`).
- Restart reloads the page. The save kept inventory, globals (`guard_attacking` still set) and tasks, put the player back at reception with HP 100 (log 458-464, `t1_after_restart.png`).
- Terry stayed hostile after the Restart. On the next entry to the wing he chased the player out through the door into `main_hallway` and KO'd them there a second time (log 466-489).
- Mission completion afterwards: after `debugKO terry_mott` (log 498, "debug-shortcut (combat not played)", `guard_knocked_out` set), the server room, four flags, a reload, the confrontation, the debrief and the credits all worked. The credits showed "TERRY MOTT, NIGHT GUARD: KNOCKED OUT ON SHIFT" (log 917). So with Terry removed the mission is completable. Whether a human can beat or outrun a hostile Terry was not tested (see S1).

Not tested: a pick started while he is facing away (the designed safe window), and a pick started before the first challenge.

## 2. On-sight challenge and "ten minutes" (game A)

2a. Passed. Entering the wing at night (log 735) put a torch conversation up within one poll: Narrator "A torch beam swings round and settles on you."; Terry (Ffion had been brushed off, afternoon not met): "Ffion rang. Said someone come in at eleven and wouldn't say what for. That you?" then "Go on, then. Why are you here?" with five-way excuse choices (screenshot `t2_terry_challenge_night.png`). In game C, with Ffion not spoken to, the opener was "Building's shut, mate. So you're either lost or you're trouble." (log 365). The excuse "Sterling asked me to grab some files" gets "Ms. Sterling mentioned a potential recruit... alright." then "She does ring down at odd hours. Which files?" then, after "Training programme enrolment forms", "Ten minutes. Then I come looking." and his hub.

2b. Not designed. The only places "ten minutes" appears are Terry's ink lines (`m03_npc_terry_mott.ink` lines 260 and 294). No timer, mapping, event or global in `scenario.json.erb` or the ink is tied to it. I stayed in the wing hallway for 11 min 12 s after the chat closed (log 836 at 23:50:14 to 846 at 00:01:26, with a 5.5 min wait between), polled `brief` and `drain`: no dialogue, no event, no log entries. I then left to `main_hallway`, came back, and walked to within 52 px of him (log 850-858 and after): nothing. Once waved on (`guard_waved_on`) the on-sight check is skipped for the rest of the mission, so he never challenges again. Also noted: he says "Ten minutes" and then, on the route branch, "Fifteen minutes, I'm back past this door" and "Rounds every fifteen minutes" (see M1).

## 3. Daytime (game A)

Passed. In the afternoon, in the wing, at 33 to 52 px from Terry and inside his LOS cone (`t3_day_wing_no_challenge.png`, green cone on the player), for about 20 s: no conversation, no event (screenshot at log 302, moveTo at 292). The wing door is not locked by day, so no sign-in was needed to get there.

## 4. A4 fixes

- **(a) Route reply.** Passed. After "Long night ahead of you?" then "What's your route?", Terry: "Round the executive wing, mostly. Sterling's office, Mr Foster's, back down the corridor." / "Why d'you want to know my route?" Three replies: "So I'm not under your feet. I'll be done before you come round again." / "No reason! Just... making conversation." / "Forget I asked. I'll get out of your way." (screenshot `a_terry_route_reply.png`, log 771). Reply 1 goes to his hub ("Considerate. Fifteen minutes, I'm back past this door. Be done by then.").
- **(b) Ffion bark.** Passed. First night entry to reception, before speaking to her: toast and a speech bubble over Ffion, "Ffion Rees: Charger, charger... I know I left it here somewhere." (`b1_night_reception_bark.png`, log 682-683). I left, came back after about 20 s and entered again: no bubble and no toast (`b2_night_reception_reentry_no_bark.png`, log 692-693). Caveat: between the two I removed any `[class*=toast]` DOM nodes by script so an old toast would not mask the check, and the bubble was also absent. After a page reload at night (starting in reception) no bubble was looked for in game A, and in game C the screenshots were not taken at those moments, so the reload case is untested.
- **(c) Cloner callback after a reload.**
  - Game C: the "Her eyes drop to your pocket" beat fired at the second read question (suspicion 5, read not dropped; `cloner_glimpsed` set, log 251). Deflection chosen: "This lab can't have been cheap to build." (`diagram`). Four flags, page reload (log 538 in game C), Resume clicked through the DOM. Victoria's night opener, exact lines (log 571): "Victoria is standing by the window. Coat on, a slim bag over one shoulder. She has been waiting for you." / "You came back after hours. Recruits don't do that." / "Report it and bill them anyway, you said. I took that for greed. It was a conscience keeping its options open." / "Your pocket lit up this afternoon, and my network diagram suddenly fascinated you. I checked my card was still in my bag. It was. That's the trick, isn't it?" / "So let's not perform the part where I'm surprised. Who are you with?" The callback survived the reload and reads in order with no stacking.
  - Game A: read dropped (suspicion 10 from the "advocating selling" line), so no glimpse by design. After a reload (log 914) her opener (log 951) was: "Victoria is standing by the window. Coat on, a slim bag over one shoulder. She has been waiting for you." / "You came back after hours. Recruits don't do that." / "You asked about the training network twice this afternoon. Once is curiosity. Twice is an inventory." / "So let's not perform the part where I'm surprised. Who are you with?" So `read_dropped` survives a reload too.
- **(d) Debrief and credits.**
  - Game A (chose "I move fast"): debrief line "You said you'd move fast, grab the objectives and get out. You did, and nobody kept up with you." (log 1163). Credits read from `#bv-cr-label` (log 1201): "APPROACH: FAST — grab the objectives, get out" and "STERLING'S NHS QUESTION: TAKE THE FORTY — said too quickly to be believed", then "VICTORIA STERLING: ARRESTED ...", "DANNY FOSTER: NEVER FOUND ...".
  - Game C (bootstrap picked "thorough"): "You told me you'd be thorough and document everything. Most of it. Next time, the drawers you skipped." Credits (log 917): "APPROACH: THOROUGH — document everything", "STERLING'S NHS QUESTION: REPORT IT, THEN INVOICE — a conscience keeping its options open", "VICTORIA STERLING: ESCAPED ...", "TERRY MOTT, NIGHT GUARD: KNOCKED OUT ON SHIFT".
- **(e) Ffion daytime hub.** Passed. The hub choices in game A and C: "What's Ms. Sterling like?", "Who else works here?", "How long has WhiteHat been going?", "How's the building laid out?" (when offered), "Lean in by her lanyard..." (when offered), then only "Thanks. I'll head through." starts with "Thanks" (`e_ffion_day_hub.png`, log 264). Note: the first-visit menu still has "Thanks. Where do I sign?" as option 1 (log 201-259). It is not the hub and is not a leave option, so I counted it as outside the test, but it is the one other "Thanks" opener (M2).
- **(f) Backgrounds.** Five conversations checked by screenshot, all match: day reception (`f1_day_reception_ffion.png`: bright, sun bars, WHITEHAT sign), night reception (`f3_night_reception_ffion.png`: same room dark and blue), day conference (`f2_day_conference_victoria.png`: bright blinds, org chart, screen), night conference (`f4_night_conference_victoria.png`: the same room dark, blinds against a dark window), night wing (`t2_terry_challenge_night.png`: dark blue, wall clock, alarm and water jug; `t1_lockpick_caught_chat.png`: dark blue, clock, painting, PRIVATE sign). The wing chat shows two different crops of the same corridor (the challenge one with the alarm and jug, the lockpick one with the painting and sign). Both are the wing; I do not know if that is chosen at random.

## Severity table

| # | Severity | Finding | Repro |
|---|---|---|---|
| S1 | major, for a human ruling (I cannot classify it as a bug) | Being caught picking in Terry's view starts a real fight with a hostile Terry who persists across Restart and follows the player between rooms. A stationary player is KO'd in about 12 s (10 HP a hit), and again after Restart on the next wing entry. I could not test whether a human can win or escape; the mission only completed after `debugKO`. Suspect the risk is that a player who cannot fight Terry has no way to finish. Terry's `chaseSpeed` 100 and `attackDamage` 10 are the m01-mild settings per the scenario comment. | Game 2197, log 429-437 (catch), 455-456 (KO), 458-489 (Restart, second KO), 498 (debugKO), 917 (credits). Night, wave Terry on, start a pick on the executive office door while he is walking to his post. |
| M1 | minor | Terry's timers disagree: "Ten minutes. Then I come looking" (4 branches), "Rounds every fifteen minutes", "Fifteen minutes, I'm back past this door". Nothing enforces either. The first sounds like a deadline that never arrives. | Game 2196, log 771 (ten minutes), 803-817 (route branch, fifteen minutes). Ink lines 260, 294 and the route_reply knot. |
| M2 | minor | Ffion's first-visit menu still has "Thanks. Where do I sign?" as choice 1 (not a leave option, not the hub). Matches the brief only if the brief meant the hub. | Game 2196, log 201 (first-visit menu) |
| M3 | minor | Bark reload case unchecked (see 4b caveat); and my toast-removal script weakens the re-entry check, though the speech bubble was also absent. | Game 2196, log 682-693 |
| M4 | minor | Debrief says "The search team found a drive in Sterling's desk this morning" and the credits say "found in Sterling's desk by the search team", although neither run opened the office. Probably intended (the player is told, not shown); noted, not changed. | Game 2196 and 2197 debrief |
| M5 | minor | The two wing chat backgrounds (alarm/jug versus painting/PRIVATE sign) differ between the sighting and the lockpick catch. Both match the room. | `t2_terry_challenge_night.png` vs `t1_lockpick_caught_chat.png` |

Counts: 0 blockers, 1 major (for ruling), 5 minors.

## Not tested

- A human-style fight with Terry, or running from him.
- A pick started while he is facing away (the designed stealth window).
- Bribe, SAFETYNET and KO routes at the guard; the Perfect Stealth debrief.
- The VM flags (supplied, not earned).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Receptionist badge | cloned card | Ffion's lanyard (cloner, dictionary attack) | A: log 71-300; C: before log 251 | yes |
| Victoria's keycard | cloned card | Victoria, conference room (Darkside, 30 s) | before the night turn | yes |
| Flags 1 to 4 | `<flag:1..4>` | Drop-Site Terminal in the server room, VM not available in standalone | A: before log 914 (reload); C: before log 538 | **no (flag supplied)** |

The flag rows are the boundary of this run: everything downstream of the flags (the confrontation and debrief) was exercised, not proven solvable.

## verify-run.rb, game 2196 (main game)

```
game            2196  (mission 47)
created         2026-10-12 23:40:30 UTC
last write      2026-10-13 00:05:55 UTC
played for      1525s of wall clock
current room    "reception_lobby"
unlocked rooms  5: reception_lobby, main_hallway, executive_wing_hallway, conference_room_01, server_room
unlocked objs   0: 
inventory       6: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Zero Day Transaction Log
NPCs met        9: briefing_cutscene, director_netherton, agent_nightshade, ffion_rees, agent_0x99, closing_debrief, night_transition, terry_mott, victoria_sterling
flags submitted 4: flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_1_67d08c}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_2_2acc1f}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_3_39ba9e}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_4_3a8f12}
globals set     34: afternoon_goodbye, briefing_played, clone_call_done, clone_read_dropped, cloner_deflection, conference_reader_tried, danny_fate, debrief_played, engine_tutorial_declined, exec_wing_entered, exec_wing_night, ffion_night_story, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, guard_challenged, guard_waved_on, knows_m2_connection, lockpicking_guide_offered, mission_phase, netexploit_guide_offered, night_confrontation_ready, night_explored, player_approach, read_dropped, reception_badge_cloned, victoria_card_cloned, victoria_choice_made, victoria_fate, victoria_test_answer, vm_flag1_reward, vm_flag2_reward, vm_flag3_reward

VERDICT: progress recorded — 4 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## verify-run.rb, game 2197

```
game            2197  (mission 47)
created         2026-10-13 00:06:43 UTC
last write      2026-10-13 00:18:46 UTC
played for      724s of wall clock
current room    "reception_lobby"
unlocked rooms  5: reception_lobby, main_hallway, conference_room_01, executive_wing_hallway, server_room
unlocked objs   0: 
inventory       6: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Zero Day Transaction Log
NPCs met        9: briefing_cutscene, director_netherton, agent_nightshade, ffion_rees, agent_0x99, closing_debrief, night_transition, victoria_sterling, terry_mott
flags submitted 4: flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_1_90bafd}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_2_67cdf4}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_3_c39d2a}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_4_7b4e68}
globals set     37: afternoon_goodbye, briefing_played, called_it_murder, clone_call_done, cloner_deflection, cloner_explained, cloner_glimpsed, danny_fate, debrief_played, engine_tutorial_declined, exec_wing_entered, exec_wing_night, ffion_night_story, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, guard_attacking, guard_challenged, guard_knocked_out, guard_waved_on, knows_m2_connection, lockpicking_guide_offered, mission_phase, netexploit_guide_offered, night_confrontation_ready, night_explored, player_approach, reception_badge_cloned, sable_named, victoria_card_cloned, victoria_choice_made, victoria_fate, victoria_test_answer, vm_flag1_reward, vm_flag2_reward, vm_flag3_reward

VERDICT: progress recorded — 4 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Sessions 2196 and 2197 were both stopped with `session-stop.sh`. :3000 was not touched. No game files were edited; the only files added are the two session logs, the two flags XMLs, the screenshots folder and this report.
