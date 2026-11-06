# m04 Critical Failure: pass 5 alignment round 4, browser confirmation

Date 2026-10-13. Keyless server :3001 only (:3000 untouched). Headless, speed fast. Load average was about 8.6 and rising at the start, so timings are not representative. A targeted confirmation of the "Browser checks for the confirmation run" list in `IMPROVEMENT_LOOP_LOG.md` (commit 8169473a). It answers the plumbing and unexpected-behaviour questions; it is not blind. Steps came from the round 4 log and from replaying the drivers in `tools/playtest/m04-pass5-align-r2-game2204.jsonl` and `...-game2205.jsonl`.

**Commit tested:** HEAD was 8169473a at the start (includes the engine fix 0b66f334, "Sight challenges hold while the tutorial prompt is open"). A docs-only commit (5b70ebbf, `docs/IDEAS_BACKLOG.md`) landed during the run; no `js`/`public` change between 8169473a and HEAD (checked with `git diff --stat`). The server served the working tree throughout.

One game covered all seven checks, because the early alarm, the mapping, both reloads, the button route and the ending fit on one path inside 20 minutes of wall clock.

## Games and logs

| Game | Purpose | Session log (cited by `seq`) | Result |
|---|---|---|---|
| 2207 | Fresh game. Guard opener with the tutorial prompt up, ally-by-clone route, Cipher east-look wait at the Hall 2 door, early alarm, flags supplied for the mapping, print lift, reload before the ESD (Relay hostile), plant room, coordination log after talking past Static, button route, reload (Static check), ESD, reload after the ESD, sweep, call-in, debrief, credits | `tools/playtest/m04-pass5-align-r4-game2207.jsonl` (1822 lines) | Mission complete, credits read; session stopped with `session-stop.sh`, no harness process left |

Flags XML: `tools/playtest/m04_critical_failure-flags-game2207.xml`. Screenshots (all looked at): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-align-r4-browser/`, files 01 to 13 (the folder also has the small helper scripts I wrote there, `adv.sh`, `b.sh`, `flip.sh`; they only call the checked-in `cmd.sh`). No game file edited.

## verify-run.rb output (pasted)

```
game            2207  (mission 48)
created         2026-10-13 06:22:34 UTC
last write      2026-10-13 06:42:21 UTC
played for      1187s of wall clock
current room    "main_entrance"
unlocked rooms  8: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room, loading_dock
unlocked objs   2: optigrid_tool_case, extraction_gobag
inventory       12: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Fingerprint Kit, OptiGrid Job Card #4782 (back page), Critical Mass Coordination Log, Voltage's Operation Log, Facility Blueprints (Marked), Social Fabric Safehouse Card (Encoded), Voltage's Escape Plan
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_93457e}, flag{m04_critical_failure_bms_jump_server_2_77e874}, flag{m04_critical_failure_bms_jump_server_4_3a4c9c}, flag{m04_critical_failure_bms_jump_server_3_14a56e}
globals set     47: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, clock_started, crew_warned, crew_warned_early, cyberchef_guide_offered, debrief_started, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, esd_authorized, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, guard_admitted, lockpicking_guide_offered, lore_architect_directive_found, lore_cross_cell_coordination_found, lore_safehouse_address_found, mission_complete, plant_reader_seen, plant_room_entered, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, relay_card_cloned, remote_trigger_disabled, rfid_guide_offered, server_room_reached, static_left, static_stood_aside, vance_card_cloned, vance_is_ally, vance_met, vance_phone_available, vance_print_lifted, vance_provided_keycard, voltage_escaped, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

(The game ends "current room main_entrance": the known respawn after the last reload.)

## Results per check

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Countdown HUD switches at the mapping after an early alarm | **PASS** | Before the alarm the HUD element was empty (seq 811: `hud:""`, `crew_warned_early` false, no timers started). After "Sound it." the HUD read "H₂ ADVISORY — RACK BANK B 23:56" (seq 839; screenshot 05 shows 23:49 with HaX's "about half an hour" toast); state `started: h2_advisory_alarm, racks_vent_alarm`. It ran down through chats and minigames (22:06 at seq 951, 21:57 after the last flag). The four flags went in at seq 954 to 975 (flags supplied); `attack_mechanism_known` and `all_flags_in` became true a few seconds later (the mapping is asynchronous) and the next read showed "H₂ ADVISORY — RACK BANK B 07:56" with `h2_advisory` and `racks_vent` now started (seq 973; screenshot 06 shows 07:49 and HaX's attack-mechanism toast). So it dropped from about 22 minutes to about 8 at the moment of mapping, 4 minutes after the alarm. The HUD kept counting from there (06:33 at the print lift, 06:17 after the first reload, 03:52 at the plant room). |
| 2a | Cipher's east look no longer reaches a player waiting at the Hall 2 door | **PASS** | Sampler (in-page `setInterval` through `eval`, using the engine's own `isInLineOfSight`) from seq 720. The player stood at (1239,338), the usual stop at the door, from t 33 s to 101 s. Cipher's east waypoint was x=1054 (never beyond, `maxX` 1054; 185 px from the player, range 150). Over that wait he did 56 east-look samples (about 11 s, four cycles) while the player was at the door: `__sp` stayed empty, no chat opened, and the line-of-sight bit at x=1232 was 0 in every sample (seq 749 to 753). |
| 2b | His patrol still completes | **PASS** | The full loop repeats: west to (970,333), back east to the gap at x=1028, south to the panel (1028,454), dwell about 3.5 s, back up the gap, east to (1054,333), east look about 2.6 s, west, and so on. East arrivals at t 17.4 s and 37.0 s, so the cycle is about 19.6 s (the round 2 log had 21.2 s with the old waypoint). No `stuckInWall`; never off the track. |
| 2c | He still challenges a normal walk | **PASS (as intended)** | Challenged on the west door approach at (1037,319) (event at t 111 s; chat opens on "He's halfway up the rack row, a handset already half out of its clip." and "Hey. Hey! This bay's locked off for maintenance. Who signed you in?", seq 767/771; this is also the round 4 m2 narration check). Challenged twice more on later walks. Closing the chat with the x left him non-hostile (`cipher_engaged` false). |
| 3 | Gate guard's on-sight opener, and the tutorial prompt | **PASS** | Fresh game, briefing driven by hand (not bootstrap), then `mg close` on the Mission Brief. The tutorial prompt ("Welcome to Hacktivity Games!") came up with the player on the spawn tile (160,144) and the guard in view. For the 6 s I watched it, and in a second read, no guard conversation opened underneath it (seq 477 to 483, screenshots 01 and 02). After "NO, I'LL FIGURE IT OUT" the chat opened at once, narrator "The guard's already on his feet as you come through the door." then Security Guard "Morning. Bit early for visitors. Desk first, if you don't mind." with the three choices (seq 487 to 493, screenshot 03). So the prompt and the opener were never on screen together at commit 8169473a/HEAD; the engine hold works for this overlap. Not tested: the backlog item in 5b70ebbf (the prompt over the opening cutscene itself). |
| 4 | Coordination Log in the plant room | **PASS** | `room` lists `plant_room_notes_3` "Critical Mass Coordination Log" at (1456,677), `visible: true`, on the bench in the south centre of the room: about 50 px from Voltage (1504,705) and Static (1408,713). I first talked past Static ("I'm not here for you. I'm here to talk to him." sets `static_stood_aside`, he steps aside one tile; seq 1218), then `moveToNear` landed 26 px from it (`interactDistance` 5.2, no mismatch), `interact` opened the notes (title "Critical Mass Coordination Log", FROM Voltage TO Loom, screenshot 09), and the global `lore_cross_cell_coordination_found` was true after closing, with the log in the inventory (verify-run lists it). It reaches the debrief ("The documents show Critical Mass and Social Fabric coordinating the one attack"). Not tested: picking it up while Static is still engaged and blocking, or a player who fights Static. |
| 5 | Vance's re-entry line on the ally-by-clone route | **PASS** | After the clone and "Right. Going." (the stale "That's uncomfortably easy. We were meant to replace those readers this year." still plays once, as the clone's own reaction, before the goodbye choice), talking to him again opened on "What do you need?" (seq 691, screenshot 04), later "Go on." (seq 785) and "Still here." (seq 831). None is the card-reader line. |
| 6a | Static leaves with Voltage on the button route and stays hidden after a reload | **PASS** | "Go for the button and let him run." gave "He goes the other way, for the dock door." / "Static peels off the wall and goes with him without a word." / "Good. That's the right call." / "You save your eleven and your forty. I'll be long gone before anyone counts them." (seq 1335). `static_left`, `voltage_escaped`, `static_stood_aside` all true; `voltage` and `operative_static` sprites `visible:false` (seq 1355, screenshot 10). After a reload (resume overlay clicked by its exact text) I walked back to the plant room: `room` lists `operative_static` `visible:false`, Voltage is gone from the NPC list altogether, and screenshot 11 shows the room empty. |
| 6b | Music with Relay hostile after a reload: `spy-action` before the ESD | **PASS** | Reload at seq 1094 (after the print lift): `spy-action` on the title screen and after resume at the entrance, and in operations, SCADA, Hall 1 and Hall 2 (seq 1121 and following reads), with `isNPCHostile(operative_relay)` true throughout. Again after the second reload (seq 1373, 1391), including the plant room. |
| 6c | Music after the ESD and a reload: `end` | **PASS** | ESD pressed at seq 1432 (guard, button, confirm through the DOM; `attack_prevented` true); playlist `end` at once (seq 1437). Reload (seq 1442): `end` at the title screen, at the entrance after Resume, and in operations, SCADA, Hall 1 and Hall 2 (seq 1453 to 1475), Relay still hostile (true). Screenshot 12 (entrance after the reload) shows no countdown HUD and the objectives now offering "Sweep the site, then call HaX to bring you in". |
| 7 | Ending: ESD, sweep, "Bring me in.", debrief, credits | **PASS** | After the ESD, HaX's unlock text and the `call_in_after_sweep` task opened. Swept the plant room (Voltage's Operation Log, Facility Blueprints) and the dock (go-bag by lockpick, assisted, Safehouse Card, Voltage's Escape Plan). Phone: "I'm done here. Bring me in." → "Bring me in." → "On my way." (seq 1557 to 1571) set `mission_complete`. Debrief opened on "Agent, report." (seq 1575) and ran through the "Voltage is out through the dock." opener, the intel, kit and "what failed" choices, the Architect and Task Force Null, the disclosure choice ("Say there was an incident…"), Vance's thanks and HaX's sign-off. `mission_complete` and `debrief_started` true. Credits read from `#bv-cr-label` with a MutationObserver (seq 1809): MISSION COMPLETE / CRITICAL FAILURE / THERMAL RUNAWAY AVERTED / GRID HELD: 240,000 / ALL ELEVEN ON SITE WALKED OUT / NIGHT CREW: out of Hall 2 on Vance's alarm, and the cell heard it too / DECISIONS: VOLTAGE ESCAPED, ROBERT VANCE vindicated, STATIC stood aside and left with Voltage, RELAY card copied mid-standoff, SOCIAL FABRIC SAFEHOUSE located, PARTIALLY DISCLOSED / BLACKOUT / THE ARCHITECT / ENTROPY. Screenshot 13 is the bond visualiser (the terminal state). |

Round 4 line changes seen on the way, all as logged: the debrief line "And Vance's alarm had the night crew out before the button went in. It started your clock early. It was still the right call." (early-alarm branch); "The honest instruments were the ones nobody had wired to the bus: a dial, and a gas monitor nobody read."; the split fix lines ("Encrypted cards. A second factor…" / "A temperature gauge in every hall that isn't on the bus, and somebody reading it."); "Lives over one operative, every time." after the Voltage-escapes opener (no crew lost); the Vance and KO lines did not play on the "Voltage is…" opener because nobody was KO'd and Vance was fine, so the new `debrief_people` tunnel for that opener is not exercised here (the closing "And not one of his crew on the floor." did play).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Vance's Level 1 card | cloned | Vance's lanyard, ally route "I'll need into the halls." | seq ~700 | yes |
| Hall 2 reader | emulate Level 1 | cloner "Saved" list | seq ~900 | yes |
| Relay's Workshop Card Level 2 | cloned | Relay's standoff, "(Keep her talking. Step in close enough…)" | seq 905 | yes |
| Workshop door | emulate Workshop Card Level 2 | cloner "Saved" list; HaX text names the need | seq ~940 | yes |
| OptiGrid tool case | lockpick | HaX workshop text | seq ~1000 | yes, **assisted** (`completeLockpick`) |
| Go-bag | lockpick | HaX call-in text | seq ~1540 | yes, **assisted** |
| Fingerprint Kit | item | inside the case | seq ~1010 | yes |
| Powder and print class | Silver, Loop | the surface text ("dark, smooth, shiny") gave Silver; the class Loop came from the earlier regression drivers | seq ~1030 | powder yes, class **assisted** (replayed from the earlier driver) |
| Plant reader | Vance's 71% lift | the logged sample | seq ~1090 | yes |
| `<flag:1>` to `<flag:4>` | seeded values | VM jump server, unreachable in standalone | seq 954 to 975 | **no, flag supplied** |
| Flag prerequisites | VM launcher not opened; field-guide offers fired | | | **no** (flags exercised, not tested) |
| ESD | pressed after Voltage's button stance | Voltage's chat | seq 1432 | yes (flags supplied) |

Rows marked "no" bound the run: the four flags and the VM work behind them were exercised, not tested. Solvability past the flag station is unproven by this run.

## Findings

Counts: 0 blockers, 0 majors, 2 minors, 4 observations, 2 harness notes. Nothing here is classified as an engine bug; "suspect" marks where I think the cause lies.

| # | Severity | Finding | Repro |
|---|---|---|---|
| m1 | minor | **A Task Complete toast covers the right end of the countdown HUD.** After Voltage's stance closes, the "Task Complete" and "Objective Complete!" toasts sit across the top of the screen from about x=780 and clip the advisory ("H₂ ADVISORY — RACK BANK B", the right half hidden, countdown still readable). Cosmetic and brief. | game 2207 seq ~1335, screenshot 10 |
| m2 | minor | **The reload overlay is inconsistent.** After the first reload (seq 1094) the game went title screen to resume with no "RESUME SESSION?" overlay (Enter twice on the title); after the second and third reloads (seq 1360, 1442) the overlay came up before the title screen, and `enter` failed with `blocking-ui` until Resume was clicked through the DOM. State resumed correctly each time. Suspect timing of the overlay against the title screen, not a data issue. | game 2207, three reloads |
| O1 | observation | The first plant-room entry after the second reload gave `door-locked` on one `enter` call, then crossed on the next (Cipher's chat had been open and closed between the two calls). I did not isolate whether the Hall 2 door re-locked or the call raced the chat. | game 2207 seq ~1385 |
| O2 | observation | `h2_advisory_alarm` still appears in `exportState().started` after the mapping; only its display condition changed. The HUD is right. A future reader of that state should know the alarm timer is still pending and only hidden. | seq 973 |
| O3 | observation | Vance's chat portrait is still the hooded figure (N5, deferred to the character stage). Screenshot 04. | any Vance chat |
| O4 | observation | Cipher's cone window is wider now: east look from x=1054 only, so the whole stretch of Hall 1 east of x=1060 is safe at all times for a player standing still. A player who walks door to door is still challenged on the west half. Whether that is too generous is a design call. | seq 749 to 753 |
| H1 | harness note | `interact esd_pushbutton` returns `ok:false` although the Emergency Shutdown Control opened (known from round 2); the button works through the DOM (`.esd-guard`, `.esd-button`, `.esd-confirm`). | seq ~1420 |
| H2 | harness note | `mg clickControl` for the RFID cloner "Save" needs a second click or a wait before the dialogue resumes (the first click returned ok with the minigame still showing); and `dismiss` of the tutorial prompt takes the lower-case label as the harness reports it. Neither blocked the run. | Vance and Relay clones |

## Not covered

- The vent firing: the ESD went in with the HUD at 02:30 on the advisory, before the advisory fired at 0:00 and before the vent at mapping + 14.
- The early alarm followed by a quick mapping with the vent as the early deadline at alarm + 30 (r7 in the route driver covers it statically).
- The Voltage-down variants of the debrief opener, the `debrief_people` tunnel with a KO or a lost crew, and Vance's phone after the shutdown (round 4 m6).
- The guard opener on the cover route, and the tutorial prompt over the opening cutscene (backlog 5b70ebbf).
- A human at the keys for the Static fight (O2 of round 1).
