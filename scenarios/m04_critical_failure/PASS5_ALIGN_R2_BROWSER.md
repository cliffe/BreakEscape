# m04 Critical Failure: pass 5 alignment round 2, browser confirmation

Date 2026-10-13. Keyless server :3001 only (:3000 untouched). Headless, speed fast, load low (about 0.4 at the start). A targeted regression run of the "Browser checks for round 3" list in `IMPROVEMENT_LOOP_LOG.md` (commit 74c3b367). It answers the plumbing and unexpected-behaviour questions; it is not blind. Source of steps: the round 2 log and `TESTING_WALKTHROUGH.md` (routes only); the fingerprint-lift and flipper drivers were replayed from `tools/playtest/m04-pass5-align-r1-game2202.jsonl`. Flags were supplied from the seeded XML in both games (marked "flag supplied").

## Games and logs

| Game | Purpose | Session log (cited by `seq`) | Result |
|---|---|---|---|
| 2204 | Guard challenge, cover route then late reveal to ally, early alarm, Cipher patrol sampled over about 25 cycles and crossed on and off his timing, mapping with flags supplied, advisory firing, print lift, reload before the ESD, Relay cloned (hostile), Static and Voltage button route, ESD, reload after the ESD | `tools/playtest/m04-pass5-align-r2-game2204.jsonl` (1869 lines) | ESD pressed, `attack_prevented` true; stopped before the call-in |
| 2205 | Guard "(Keep walking.)" branch, ally on the first meeting, Vance's 20 s text, Vance and HaX phone lines before and after the dial, "Not yet" by phone, untimed crossings of Hall 1, mapping with no early alarm, late alarm | `tools/playtest/m04-pass5-align-r2-game2205.jsonl` (973 lines) | stopped after the late alarm |

Flags XMLs: `tools/playtest/m04_critical_failure-flags-game2204.xml`, `...-game2205.xml`. Screenshots (all looked at): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-align-r2-browser/` files 01 to 14. Both sessions stopped (`session-stop.sh`, which syncs first); `ps` shows no harness process of mine. About 59 other chromium/playwright processes were already running when I started; I did not touch them.

How I measured Cipher: an in-page sampler (a `setInterval` run through the harness `eval`, no game files edited) logged his position, direction and moving flag every 200 ms, and for each sample asked the engine's own `isInLineOfSight` whether a player at y=312 would be seen at each x from 640 to 1280. Timed crossings then used `moveTo` / `moveToNear` started at a chosen offset from his panel arrival (P).

## verify-run.rb output (pasted)

```
game            2204  (mission 48)
created         2026-10-13 02:31:45 UTC
last write      2026-10-13 03:03:37 UTC
played for      1912s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_e57824}, flag{m04_critical_failure_bms_jump_server_2_4d35dc}, flag{m04_critical_failure_bms_jump_server_4_035c09}, flag{m04_critical_failure_bms_jump_server_3_d42f86}
globals set     42: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, clock_started, crew_warned, crew_warned_early, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, esd_authorized, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, guard_admitted, hydrogen_alarm, lockpicking_guide_offered, plant_reader_seen, plant_room_entered, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, relay_card_cloned, remote_trigger_disabled, rfid_guide_offered, server_room_reached, static_left, static_stood_aside, vance_card_cloned, vance_is_ally, vance_met, vance_phone_available, vance_print_lifted, vance_provided_keycard, voltage_escaped, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.

game            2205  (mission 48)
created         2026-10-13 03:03:52 UTC
last write      2026-10-13 03:11:30 UTC
played for      458s of wall clock
current room    "main_entrance"
unlocked rooms  6: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop
unlocked objs   0: 
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad
NPCs met        10: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_cb2382}, flag{m04_critical_failure_bms_jump_server_2_52d790}, flag{m04_critical_failure_bms_jump_server_4_7e7c29}, flag{m04_critical_failure_bms_jump_server_3_1f1f30}
globals set     30: all_flags_in, anomaly_detected, attack_mechanism_known, blackout_named, briefing_played, clock_started, crew_warned, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, guard_admitted, lockpicking_guide_offered, plant_reader_seen, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, relay_card_cloned, rfid_guide_offered, server_room_reached, vance_card_cloned, vance_is_ally, vance_met, vance_phone_available, vance_provided_keycard, vuln_guide_offered

VERDICT: progress recorded — 5 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```

(Both games end "current room main_entrance": the known reload respawn in 2204, and the session-stop sync in 2205.)

## Results per check

| # | Check | Result | Evidence |
|---|---|---|---|
| 1a | Cipher walks every waypoint without sticking | PASS | 2204 sampler, about 30 cycles over about 12 minutes, plus a resample after the reload: he visits (12,7) at x 1028 y 454, the gap at (12,3), (14,3) at x 1085, (10,3) at x 971, back to (12,3) and down, every cycle. `stuckInWall` never set; never off the track (x 970 to 1086, y 333 to 456). Cycle 21.2 s (21.0 to 21.4 over 8 measured cycles). |
| 1b | His cone is drawn | PASS | Screenshot 04: green 120 degree wedge, range 150, facing east at the east look; also visible in 07 behind the workshop. |
| 1c | On-sight challenge fires on the normal route | PASS | Untimed walks through Hall 1 were challenged every time: 2204 seq 628 to 675 (six `player_spotted:operative_cipher` events at x 937 to 1228, the first at (1006,317)); 2205 seq 715 (at (937,341), game 2205 return trip too). Chat opens on "He is crouched at the end of the rack row..." (screenshot 03). Closing it with the x leaves him non-hostile (`cipher_engaged` false) and he calls again once the 20 s cooldown has passed and he sees the player again. Not fired after the ESD (2204 reload walk, no event). |
| 1d | A fair window to cross | PASS, with caveats (observations O1, m1) | See the timing table below. Eastbound starts at P+17.4 crossed unseen three times (2204 after the early alarm, after the first reload, and 2204's earlier timed trial); westbound starts at P+19.5 crossed unseen twice. Control: an eastbound start at P+3 was seen at x=943 (P+4.9). One start at P+16.5 was seen at x=840 because his west look ran about 2 s long in that cycle (O1). |
| 2 | Guard `on_sighted` knot opens on the challenge | PASS | 2204 seq 333: narration "The guard is out of his chair before you reach the inner door.", then "Oi. Desk first. Who are you, then?" with the three choices (screenshot 01 was taken a beat late and shows the second line and his portrait). 2205 seq 361: "(Keep walking.)" gives "You keep walking. He steps into your path." then "Hey. Where do you think you're going?" and the sign-in; `guard_admitted` true afterwards, no hostility. |
| 3a | Vance states the cost before "Sound it." | PASS | 2204 seq 944/948: "Nine. The module-swap crew, behind the inverter wall in Hall 2, till six...", "I can sound the evacuation from this desk...", "Whoever's in my plant room hears it too. He won't wait for eight. You'll have half an hour, maybe, and your workshop job isn't done." Then the two choices (screenshot 05). By phone, same wording (2205 seq 695/699). |
| 3b | HaX says "about half an hour" | PASS | Toast 3 s after "Sound it": "That's the evacuation. Good. But Voltage heard it too, and he won't wait for eight now. You've about half an hour." (screenshot 06). HaX hub "Can we get the night crew out of Hall 2?" before any alarm: "...You'd have about half an hour, not till eight." (2205 seq 679). |
| 3c | HUD countdown and its order after the alarm | PASS as designed | "H2 ADVISORY - RACK BANK B 23:43" 20 s after the alarm (screenshot 06); `exportState` showed `h2_advisory_alarm` and `racks_vent_alarm` started, nothing else; `crew_warned_early` true. The 30 minute vent timer has no HUD. The count ran in real time through chats and minigames (23:20, 21:33, 21:12, 20:26 at the spot checks). |
| 3d | HUD after the attack is mapped | See finding B1 | After the four flags (2204 seq 1313 onwards) the HUD still read "H2 ADVISORY - RACK BANK B 20:14" (screenshot 07, `exportState` now listing `h2_advisory` and `racks_vent` as well). Without an early alarm (2205) the HUD shows "08:00" at the mapping (screenshot 13). |
| 3e | Late alarm (after the mapping) | PASS | 2205: Vance "...But your clock's already running, so it costs you nothing now but surprise." (seq 936/940); after "Sound it" `crew_warned_early` stays false, `exportState` shows only `h2_advisory` and `racks_vent`, the HUD carries on (07:14, screenshot 14), HaX: "That's the evacuation. Nine out of Hall 2. Voltage knows we're here now. Keep moving." |
| 3f | Advisory firing and the hydrogen text | PASS | 2204 seq 1720: `hydrogen_alarm` true; HaX toast "Bank B's venting. Hall 2 is empty, thanks to Vance's alarm. Now get to that button." (screenshot 10). See B1 for when it fired. |
| 4 | Static leaves with Voltage on the button route | PASS | 2204: "Go for the button and let him run." gives "...He goes the other way, for the dock door." / "Static peels off the wall and goes with him without a word." (seq 1672); `static_left` true; Static's sprite `visible:false` at once and again after the ESD reload on re-entering the plant room (`room` lists him `visible:false`); Voltage's line "You save your eleven and your forty." Screenshot 09. Voltage's klaxon line fired earlier: "Your klaxon. Nine people in hi-vis on my cameras..." (seq 1584). |
| 5a | Music after a reload, Relay hostile, before the ESD | PASS | 2204 (reload at seq 1451): `spy-action` at the title, after resume, in the entrance, ops, SCADA, Hall 1 and Hall 2, with `isNPCHostile(operative_relay)` true throughout. (Relay turning hostile live, with the clock running, also stayed `spy-action`.) |
| 5b | Music after a reload, Relay hostile, after the ESD | PASS | Playlist `end` after the ESD; reload (seq 1763): `end` at the entrance after Resume, and through ops, SCADA, Hall 1 and Hall 2. The restored event fired (seq 1828, `npc_hostile_state_changed {operative_relay, isHostile:true, restored:true}`) and the playlist stayed `end` (screenshot 11 is the entrance after the reload). R1's N1 is fixed. |
| 6 | Vance: hydrogen readout, never the historian; 20 s text to the dial | PASS | Zero occurrences of "historian" in either session log, which hold every Vance line I opened. Face to face: after the dial, before the mapping, "What should I be doing right now?" gives the Level 2 card line; after the mapping it gives "The screens are lying to you. I've the hydrogen readout from the vent controller up here. It's off their network, and it's climbing." (2205 seq 912). By phone: before the dial "My screens say twenty-eight and I don't believe them. Read the dial in Hall 1. It isn't on their network." and priority "Check the racks against something that isn't on it. There's an old dial on the Rack Bank C wall in Hall 1." (2205 seq 641 to 651); after the dial "I've the hydrogen readout from the vent controller up here, it's off their network, and it's climbing."; after the ESD "You've done it. Banks isolated, vents at full. Go and see what they left behind." The 20 s text, 2205 (about 20 s after the ally conversation closed): "It's Vance. Every screen I've got says twenty-eight, and I don't believe one of them. There's an old dial on the Rack Bank C wall in Hall 1. Read it." (screenshot 12). |
| 7 | Reload after lifting the print: kit text does not replay | PASS | 2204: kit picked before the mapping (HaX: "The crew's own fingerprint kit... Lift Vance's print now."), print lifted, `vance_print_lifted` true, reload at seq 1451. HaX thread before and after: the kit line appears once in each, no "Hurry" variant, no new line (saved as `hax_thread_before_reload.txt` and `hax_thread_after_reload1.txt` in the scratch folder). No kit toast during the 40 s I watched after the reload and again after the second reload (toast DOM empty). Not tested: a reload before the print is lifted, where round 2 says one replay is still possible. |

### Cipher's timing (game 2204)

P is the moment he arrives at his panel (1028, 454), facing south.

| Offset from P | What he does |
|---|---|
| 0.0 to 4.0 s | Dwells at the panel facing south (cone away from the aisle) |
| 4.0 to 8.5 s | Walks up the rack gap, facing north |
| 8.5 to 11.2 s | Looks east from (1085,333) (2.7 s) |
| 11.2 to 14.0 s | Walks west along the door row |
| 14.0 to 16.6 s | Looks west from (971,333) (2.6 s) |
| 16.6 to 21.2 s | Walks back east to the gap and down to the panel |

Cycle 21.2 s. The cone is range 150, 120 degrees. Computed from the engine's own line-of-sight check on the live positions, for a player walking door to door at about 150 px/s (measured: about 144 px in 1.2 s) along y 312:

| Direction | Safe start offsets (start at the Hall 1 door) | Window per cycle | Share of cycle |
|---|---|---|---|
| Eastbound (west door x 656 to Hall 2 door x 1264) | P+15.6 to P+22.4 | 6.8 s | 32% |
| Westbound | P+17.8 to P+23.4 | 5.6 s | 26% |

The player is inside his reach (x about 880 to 1180) for about 2 s of the crossing. Live trials agree with the computation except the P+16.5 start (O1). The window is readable: the cone is drawn and he turns his back when the safe stretch begins.

## Findings

Counts: 0 blockers, 1 major, 2 minors, 3 observations, 3 harness notes. I classify nothing as an engine bug; "suspect" marks where I think the cause lies.

| # | Severity | Finding | Repro |
|---|---|---|---|
| B1 | major (conditional on pace, and documented as a known limit in the erb timer comment) | **After an early alarm, the HUD overstates the time left once the attack is mapped within 16 minutes.** The widget shows the first pending countdown in array order, the alarm's 24 minute advisory, while the normal advisory (8 minutes after the mapping) and the vent (14 minutes) are the real deadlines. In 2204 the mapping came 3.5 minutes after the alarm (flags supplied, so faster than a real VM run). The HUD read 20:14 after the mapping; the hydrogen alarm fired when it read about 12:15 (poll seq 1720: 13:03 at the last poll, `hydrogen_alarm` true within the next 54 s), 12 minutes before its zero, and the HUD then vanished with the vent still about 6 minutes away. The player is told "about half an hour" and gets 14 to 22 minutes. At real VM pace (mapping 16 or more minutes after the alarm) the alarm clock is the earlier one and the HUD is right. | 2204 seq 952 (Sound it), 1313 to 1334 (flags, HUD 20:14), 1720 (fired). Fresh game, Vance ally, early alarm, flags in within 16 minutes, then watch the HUD |
| m1 | minor | **Cipher's east look reaches the Hall 2 door approach.** The east waypoint (1085,333) is 144 px from the usual stopping point at the Hall 2 door (x 1228, centre y 310), inside his 150 px range. A player who waits there during his east look (P+8.5 to P+11.2) is challenged: it happened three times in 2204 (sampler `sp` records at t 274.5, 295.5, 338.0 s) while I stood at the door waiting for a westbound window. It does not affect crossing, because the RFID flipper minigame pauses the check. It does mean the only safe place to wait for a westbound crossing is inside Hall 2. | 2204: `moveToNear` the Hall 2 door, then stand still 10 s |
| m2 | minor | **Vance's resting hub opens on a stale line on the ally-by-clone route.** After "I'll need into the halls" and the clone, re-talking opens with "That's uncomfortably easy. We were meant to replace those readers this year." above the hub choices, from a conversation that ended long before. On the reveal route without the clone the stale line is "Come back to the ops desk when you need the SCADA side..." (2204 after the reveal). Probably the engine showing the last line before a choices-only knot; wording only. | 2205 seq 904, talk to Vance after mapping |
| O1 | observation | **One long west look.** In every sampled cycle his west dwell is 2.6 s. In the one cycle where I started walking towards him while he was on it (2204, t about 193 to 198 s) it ran 4.6 s, and he challenged at x=840 (131 px) instead of walking off. Cause unknown (suspect a reaction to the approach, not the patrol timer). It is why the leading edge of the window is soft by about 2 s. | 2204 `sp` record at t 196.8 s |
| O2 | observation | After the advisory fires the HUD shows nothing for the last stage (the vent timer has `showCountdown:false`, by design). | 2204 seq 1720 onwards |
| O3 | observation | Vance's chat portrait is still the hooded figure (N5, deferred to the character stage). Screenshot 05. | any Vance chat |
| H1 | harness note | `interact esd_pushbutton` reports `ok:false, reason:"wrong-target-opened", mismatch:true` although the Emergency Shutdown Control opened; the button then works through the DOM (`.esd-guard`, `.esd-button`, `.esd-confirm`). Probably an id-naming difference (`esd-pushbutton`). | 2204 seq 1734 |
| H2 | harness note | `converse` with a long `choices` list ran Vance's cover-route retry choices in an order I did not intend and left the cloner minigame cancelled ("didn't get a clean read"); I recovered through the hub's "(Ask about the site map again, and stand close.)". The `mg choose` regex also fails on a choice starting with "(" if backslash-escaped through the shell; matching on "Close the gap" worked. | 2204 early lines |
| H3 | harness note | `completeLockpick` answered "dexterity minigame not machine-playable" yet the case was open (the lock had completed); the first two `take` calls then returned `no-active-minigame` until the container finished loading. | 2204 workshop |

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Vance's Level 1 card | cloned (EM4100 HEX 8E 50 68 FC 79) | Vance's lanyard, cover route "(Ask about the site map again, and stand close.)" (2204) and the ally route (2205) | 2204 seq 559; 2205 before the dial | yes |
| Hall 2 reader | emulate Level 1 | cloner "Saved" list | after the dial | yes |
| Relay's Workshop Card Level 2 | cloned | Relay's standoff, "(Keep her talking...)" (2204) and "(Close the gap...)" (2205) | both games | yes |
| Workshop door | emulate Workshop Card Level 2 | cloner "Saved" list; HaX text names the need | both games | yes |
| OptiGrid tool case | lockpick | HaX workshop text "Open it." | 2204 | yes, **assisted** (`completeLockpick`) |
| Fingerprint Kit | item | inside the case | 2204 | yes |
| Powder and print class | Silver, Loop | the surface text "dark, smooth, shiny" gave Silver; the class Loop came from the earlier regression log, not from reading the lift | 2204 | powder yes, class **assisted** (replayed) |
| Plant reader | Vance's 70% lift | the logged sample | 2204 | yes |
| `<flag:1>` to `<flag:4>` | seeded values | VM jump server, unreachable in standalone | 2204 and 2205 (four submits each) | **no, flag supplied** |
| Flag prerequisites | VM launcher not opened; field-guide offers fired | | | **no** (flags exercised, not tested) |
| ESD | pressed after Voltage's button stance | Voltage's chat | 2204 | yes (flags supplied) |

Rows marked "no" bound the run: the four flags and the VM teaching behind them were exercised, not tested, in both games. The mission's solvability past the flag station is unproven by this run.

## Not covered

Vance's "How bad is it?" after the shutdown (the reply did not render in the phone view; priority after the shutdown did); a reload before the print is lifted (round 2's accepted single replay); crew-lost and Vance-KO'd variants; HaX's call-in and the debrief after the ESD (stopped at the ESD); the vent firing at 30 minutes after an early alarm (not waited for); Cipher's alarm-specific chat options (covered in round 1); a human at the keys for the Static fight (O2 of round 1).
