# m04 Critical Failure: pass 5 alignment round 1, browser confirmation

Date 2026-10-13. Keyless server :3001 only (:3000 was up and untouched). Headless, speed fast, load low. Targeted run of the checks listed under "Not yet checked in a browser" in `IMPROVEMENT_LOOP_LOG.md` (commit 826c6c2c). It answers the plumbing and unexpected-behaviour questions. It is a regression run, not blind. Flags supplied from the seeded XML (game 2202 only).

Source of steps: the round 1 log, `TESTING_WALKTHROUGH.md` (routes only), and the previous regression log `tools/playtest/m04-pass5A-game2199.jsonl` (the fingerprint-lift drag sequence was replayed from it).

## Games and logs

| Game | Purpose | Session log (line numbers cited below are `seq`) | Result |
|---|---|---|---|
| 2202 | Quiet route, Vance ally, evacuation by "Not yet" then hub, Static talk-past, Voltage back-off and button stance, ESD, two reloads, sweep, call-in, debrief, credits | `tools/playtest/m04-pass5-align-r1-game2202.jsonl` (1802 lines) | credits reached, `mission_complete` set |
| 2201 | Gate guard after admission, Vance ally, evacuation by "Sound it.", Cipher after the alarm, Relay cloned, Voltage before the attack is mapped (no button), back-off, fight with Static joining, game over and restart, music after a fight | `tools/playtest/m04-pass5-align-r1-game2201.jsonl` (915 lines) | no flags (on purpose), Voltage and Static KO'd |
| 2203 | Vance by phone ("The night crew in Hall 2. Can you get them out?"), HaX hint, toast avatar, late reload and the opening status check | `tools/playtest/m04-pass5-align-r1-game2203.jsonl` (289 lines) | short run |

Flags XML: `tools/playtest/m04_critical_failure-flags-game2202.xml` (2201 and 2203 have XMLs but submitted none). Screenshots: session scratchpad `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-align-r1-browser/` (files 01 to 35), each cited below. All three sessions stopped; `ps` shows no harness or playwright process of mine.

## verify-run.rb output (pasted, all three games)

```
game            2201  (mission 48)
created         2026-10-13 01:33:03 UTC
last write      2026-10-13 02:09:39 UTC
played for      2196s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Fingerprint Kit, OptiGrid Job Card #4782 (back page), Workshop Keycard (relayed copy)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 0:
globals set     33: anomaly_detected, blackout_named, briefing_played, casualties_occurred, cipher_walked, clock_started, crew_warned, disclosure_choice, engine_tutorial_declined, fingerprint_kit_found, guard_admitted, operative_relay_defeated, operative_static_defeated, plant_reader_seen, plant_room_entered, player_name, racks_vented, recon_guide_offered, relay_card_cloned, rfid_guide_offered, server_room_reached, static_engaged, static_stood_aside, vance_card_cloned, vance_is_ally, vance_met, vance_phone_available, vance_provided_keycard, vented_by_trigger, voltage_captured, voltage_fight_started, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 0 flags submitted.

game            2202  (mission 48)
created         2026-10-13 01:35:21 UTC
last write      2026-10-13 01:56:16 UTC
played for      1256s of wall clock
current room    "main_entrance"
unlocked rooms  8: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room, loading_dock
unlocked objs   2: optigrid_tool_case, extraction_gobag
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Fingerprint Kit, OptiGrid Job Card #4782 (back page), Social Fabric Safehouse Card (Encoded)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_d80441}, flag{m04_critical_failure_bms_jump_server_2_0b4dd4}, flag{m04_critical_failure_bms_jump_server_4_5bd215}, flag{m04_critical_failure_bms_jump_server_3_04f2b8}
globals set     42: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, cipher_walked, clock_started, crew_warned, cyberchef_guide_offered, debrief_started, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, esd_authorized, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, guard_admitted, lore_safehouse_address_found, mission_complete, plant_reader_seen, plant_room_entered, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, relay_card_cloned, remote_trigger_disabled, rfid_guide_offered, server_room_reached, static_stood_aside, vance_card_cloned, vance_is_ally, vance_met, vance_phone_available, vance_provided_keycard, voltage_escaped, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.

game            2203  (mission 48)
created         2026-10-13 02:09:43 UTC
last write      2026-10-13 02:13:55 UTC
played for      253s of wall clock
current room    "main_entrance"
unlocked rooms  4: main_entrance, operations_office, scada_control_room, battery_hall_1
unlocked objs   0:
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad
NPCs met        9: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher
flags submitted 0:
globals set     16: anomaly_detected, blackout_named, briefing_played, clock_started, crew_warned, disclosure_choice, engine_tutorial_declined, fingerprint_kit_found, guard_admitted, player_name, rfid_guide_offered, vance_card_cloned, vance_is_ally, vance_met, vance_phone_available, vance_provided_keycard

VERDICT: progress recorded — 3 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

("current room main_entrance" is the known reload respawn, E1 in the regression run. In 2203, `fingerprint_kit_found` is set because I emitted `item_picked_up:fingerprint_kit` from the console to read the toast avatar: assisted, not earned.)

## Results per check

| # | Check | Result | Evidence |
|---|---|---|---|
| 1a | Gate guard challenges on sight before admission | PASS | Game 2202: after the briefing closed, with the player still on the spawn tile (160,144), the guard's chat opened by itself ("Morning. Bit early for visitors.", log seq 341; event `player_spotted:security_guard` at playerPosition 160,144). Game 2201: same during `bootstrap`, which then auto-picked through it (that is why `guard_admitted` was already set). Screenshot 02 was taken as the chat ended and shows the tutorial prompt on top of the world, not the chat (see finding N4). |
| 1b | No second challenge once admitted | PASS | Game 2201: `guard_admitted` true, player stood 47 px from him for 25 s (longer than the 20 s cooldown): no event, no dialogue (`brief` after the wait; screenshot 01). Game 2202: walked on to the ops office and never saw him again. After a page reload (2202 seq 1136, 2203) the global stays set and he did not fire at the respawn tile. |
| 1c | Guard cone data | recorded | Position (160,97), facing `down-left`, `los` range 150, angle 120. In practice the challenge came from the player's spawn tile, 47 px away. |
| 2a | Cipher challenges on sight in Hall 1 | PASS, with a narrow trigger | `player_spotted:operative_cipher` fired at player (1048,364) (game 2202 log, event drained after seq 415; screenshot 03 shows the chat opening on the narration "He is crouched at the end of the rack row…"). Game 2201: same at (1033,371). |
| 2b | Cipher's cone and position against the route | recorded (finding N2) | Cipher stands at (1024,457), `bdir` `down` at rest (south, away from the route), `los` range 150 angle 120. The straight west-to-east walk along y about 317 to 348 (Hall 1 west door at (656,336) to the Hall 2 door at (1264,336)) passes 121 to 140 px north of him, behind his facing: no challenge, tested at (1033,334) and along the whole route to (1141,317). The thermometer (720,298), round panel (832,480) and workshop door (688,544) are 190 to 340 px away. He turns to face the player only inside `facePlayerDistance` 96 px (`npc-behavior.js:333`), and then the cone (range 150) holds. So the challenge fires only if the player walks within about 96 px of him. Hall 2's door is 240 px east of him. |
| 3a | Static's entry challenge opens on walking into the plant room with Voltage there | PASS | Games 2202 (seq 1203) and 2201: `enter plant_room` is followed at once by the narration "He steps out from behind the plant-room door frame…", then "Voltage. Company." and four choices. Screenshots 12 (not retaken at the chat; 13 is the room after), choices in the log. |
| 3b | Talk-past option works | PASS | "I'm not here for you. I'm here to talk to him." → "He weighs you for a long second, then takes one step to the side." → "Talk, then. From there." `static_stood_aside` true (2202 seq 1229; also 2201). Chat closes, no hostility. |
| 3c | Quiet route still reaches Voltage | PASS | Both games: `moveToNear voltage` and `interact` opened Voltage's chat with Static standing beside it, no attack. Screenshot 13. |
| 4a | Before the attack is mapped the button stance is not offered | PASS | Game 2201 (flags 0, `attack_mechanism_known` false, `anomaly_detected` true): "The button? Press it. Grid control won't shed a megawatt on what you've got." then the choices are only "I'm taking you down. Now." and "Not like this. (Back off.)" (seq 695, screenshot 24). Game 2202, mapped: three stances, button included (screenshot 14). |
| 4b | "Not like this. (Back off.)" works | PASS | Both games. "Then get out of my plant room. The clock doesn't care either way." closes the chat. Re-talk: "Still here." / "Nothing you say next will be new." with "Then let's finish this." and "Say nothing." Back to the stances (2202 seq 1339; 2201). No fight started (`voltage_fight_started` stayed false). |
| 4c | Fighting Voltage brings Static in | PASS | Game 2201, "I'm taking you down. Now.": "He moves for the bench, Static comes off the wall at you…"; `npcHostileSystem` showed `operative_static` hostile True and `voltage` True at that moment (seq 767; screenshot 25 with both on the player, race clock "VOLTAGE - THE LAPTOP 00:13"). |
| 5a | Vance shows the cost first | PASS | "Is anyone working in the halls tonight?" appears only after `vance_is_ally` and the dial (checked absent before the dial in 2202 and present after). First lines: "Nine. The module-swap crew, behind the inverter wall in Hall 2, till six. Your contractor wanted the halls clear from midnight. I said no." / "I can sound the evacuation from this desk. Klaxon and strobes in every hall." / "Whoever's in my plant room hears it too. The minute it goes, they know we've found them." Then "Sound it. Get them out." or "Not yet. Give me time to get to them first." Screenshot 04. |
| 5b | "Sound it." | PASS | Game 2201 (seq 243 region): "Sounding it now." / narration "Somewhere past the walls a klaxon starts, and the strobes in the corridor go white." / "They're moving. Nine of them, out through the Hall 2 fire doors." (screenshots 05, 22). "Not yet" returns "Your call. It's on this desk when you want it." and the hub then offers "Sound the evacuation. Get the night crew out." (2202 seq 783 to 815), same lines. |
| 5c | Clock starts | PASS | `clock_started` true; HUD "H2 ADVISORY - RACK BANK B 07:38" a few seconds later (2202, screenshot 06). The playlist went `threat` to `spy-action` at the same moment. |
| 5d | HaX text after the alarm | PASS | "That's the evacuation. Good. But Voltage heard it too, and he won't wait for eight now. Your clock just started." (toast, screenshot 06; also in the thread, 2202 and 2203). HaX's hub choice "Can we get the night crew out of Hall 2?" gives "Ask him. He'll do it." / "But think first. The minute that alarm goes, Voltage knows we've found him, and he won't wait for eight." (2203, screenshot 31). |
| 5e | Relay's reaction | PASS | Both games, on entering Hall 2 after the alarm: narration "The strobes are still going. She's standing in the middle of the aisle, watching the door, as if she's been waiting for it to open." / "Nine of them went past me in their hi-vis. Somebody told them to. That'll be you." / "You're not getting to those rack banks." Screenshot 07 not retaken at the chat; lines in log (2202 seq 907, 2201). |
| 5f | Cipher's reaction | PASS | Game 2201, after the alarm, Cipher chat route "Put the radio down." then "Whatever Voltage told you…": the "There's a night crew in Hall 2. Go and look." option is replaced by "Hear that klaxon? Nine people just walked out of Hall 2." → "...Nine?" / "His eyes go to the Hall 2 door, and stay there." / "If you're lying, I'm coming back for you." / he walks off, `cipher_walked` true (seq 355; screenshot 23 for the choices). |
| 5g | Vance by phone | PASS | Game 2203: "The night crew in Hall 2. Can you get them out?" offered only after the dial; "I can sound the evacuation from here. Klaxon and strobes in every hall." / "And whoever's in my plant room hears it too…" with "Sound it. Get them out." / "Not yet."; then "Sounding it now. They're moving. Nine of them, out through the Hall 2 fire doors." `clock_started` and `crew_warned` true, playlist `spy-action`. Screenshots 32, 33. |
| 5h | Crew line in the debrief and credits | PASS | Debrief (2202, no vent): "Clean. Runaway aborted before a single cell vented." / "Eleven people walked out of there tonight. Forty-odd on that feed never knew they were on it." / "And Vance's alarm had the night crew out before the button went in. It started your clock early. It was still the right call." Credits (observer on `#bv-cr-label`, 2202 seq 1795 region, screenshot 21): MISSION COMPLETE / CRITICAL FAILURE / ALBION ENERGY STORAGE: THERMAL RUNAWAY AVERTED — Emergency Shutdown engaged / GRID HELD: 240,000 residents kept on supply / ALL ELEVEN ON SITE WALKED OUT / NIGHT CREW: out of Hall 2 on Vance's alarm, and the cell heard it too / ── DECISIONS ── / VOLTAGE: ESCAPED — you took the button and let him reach the dock / ROBERT VANCE: vindicated — his warning broke the case open / CIPHER: walked off the job when you told him about the night crew / RELAY: card copied mid-standoff / SOCIAL FABRIC SAFEHOUSE: located / DISCLOSED IN FULL — the attack, the vulnerabilities, and how close it came / BLACKOUT: signed the casualty model. Still at large. / THE ARCHITECT: identity still unknown. Phase 3 looms. / ENTROPY: Still operational. Cross-cell strikes continue. |
| 6a | ESD does not open the debrief | PASS | Game 2202 seq 1420 (`.esd-confirm`): `attack_prevented` true, `mission_complete` false, `debrief_started` false. Tasks left: `call_in_after_sweep (opt)`, `report_to_0x99`. Task toast "Force the shutdown before the racks go" complete; objective "Sweep the site, then call HaX to bring you in". Screenshot 16. |
| 6b | HaX texts "sweep, then call me" | PASS | "Grid control confirms it. Banks isolated, vents at full, the trigger's dead. Sweep the plant room and the dock, then call me and I'll bring you in." (toast, screenshot 16). |
| 6c | Reload after the ESD; the call-in is still there | PASS | 2202 seq 1436: reload, Resume (by DOM click: the helper's `dismiss` could not find it, harness note H1). After the reload `mission_complete` false, `debrief_started` false (the backstops did not fire early), tasks unchanged, HaX hub shows "I'm done here. Bring me in." (screenshot 17 is the Resume overlay; the hub is in the thread read at seq 1465). |
| 6d | Walk around; call in | PASS | Plant room, dock (`loading_dock`), go-bag opened with `completeLockpick` (assisted) and the Safehouse Card taken (screenshots 19, 20). First "I'm done here. Bring me in." (seq 1465, before the sweep) answered "Once you're out, you don't go back in. Whatever you haven't read stays for forensics." / "Voltage's operation log is still on the plant-room bench, for one." / "And there's a go-bag at the dock nobody's opened." with "Bring me in." / "Not yet. I'm still looking." (screenshot 18). "Not yet" worked. After the sweep (go-bag opened) the offer named only the log. "Bring me in." → "Car's at the loading dock. Two minutes." → "On my way." sets `mission_complete` and `debrief_started` (seq 1535); the debrief opened ("Agent, report."), ran to the end (60 distinct lines, saved in the scratchpad as `debrief.txt`), then credits. |
| 7 | Music | PASS with finding N1 | See the table below. |
| 8a | HaX's phone and toast avatar is her headshot | PASS | DOM check: the phone chat's `<img>` is `characters/agent_hax_headshot.png`; the toast's `<img>` is the same file (2203, synthetic bark; crop `35_crop.png`). Both erb NPCs point at it (`scenario.json.erb:621,1225`). The 32x32 headshot is the fedora-and-trench-coat figure. |
| 8b | A late reload does not replay "Are you inside the facility?" | PASS | 2202 after the reload at seq 1136 and after seq 1436, and 2203 after a reload with the clock running: the HaX thread contains that line once (the original), no new copy (counted in the thread DOM: 1). |

### Music (`window.MusicController._currentPlaylistKey`)

| Moment | Playlist | Game and note |
|---|---|---|
| After the briefing, before the dial | `noir` | 2201, 2202, 2203 |
| After the dial (`anomaly_detected`) | `threat` | all three |
| When the clock starts (alarm sounded) | `spy-action` | 2202, 2201, 2203 (switch is immediate) |
| After the flags map the attack (clock already running) | `spy-action` | 2202 |
| After a fight, all hostiles KO'd | `spy-action` (clock phase) | 2201: Relay, Static and Voltage KO'd, then `all_hostiles_ko` returned the phase playlist |
| With Relay hostile and alive (quiet route), clock running | `threat` | 2201, 2202 (seq 1411): the `npc_hostile_state_changed` rule, by design |
| After a reload mid-crisis | `spy-action` at the title and after Resume | 2202 (screenshots 08, 09), 2203. But see N1: it becomes `threat` once Hall 1 loads and Relay's hostile state is restored |
| After a game over and Restart (2201) | `spy-action` | phase kept |
| After the ESD | `end` | 2202 (seq 1420) |
| After a reload post-ESD | `end` at the title and after Resume | 2202; then `threat` again on the sweep (N1) |
| Debrief and credits | `victory` | 2202 |

## Findings

Counts: 0 blockers, 0 majors, 5 minors, 3 observations, 2 harness notes. I classify nothing as an engine or scenario bug; "suspect" marks where I think the cause lies.

| # | Severity | Finding | Repro |
|---|---|---|---|
| N1 | minor | **Music slips back to `threat` after a reload while Relay is still hostile, including after the ESD.** On a reload, the restored NPC fires `npc_hostile_state_changed {npcId: "operative_relay", isHostile: true, restored: true}` as Hall 1 loads. The scenario's `npc_hostile_state_changed` rule (`isHostile === true`) has no guard for `restored` or for the phase, so it plays `threat`. Round 1's phase conditions (A2) are on `game_loaded` and `all_hostiles_ko` only. The quiet route (Relay cloned, not KO'd) always leaves her hostile. Effect: the post-ESD `end` cue is replaced by `threat` during the sweep and the call-in (debrief still switches to `victory`). Suspect the music rule, not the engine. | Game 2202: clone Relay's card, take the quiet route to the ESD, press it (playlist `end`, seq 1420), reload (still `end` after Resume), walk Hall 1 then Hall 2 and the dock: `threat` (seq 1521 shows the restored event; playlist read at the dock). Same on the pre-ESD reload (seq 1136 onward): `spy-action` becomes `threat` after Hall 1. |
| N2 | minor | **Cipher's sight challenge fires only inside about 96 px, and the route is 121 to 140 px from him.** He faces south at rest (`down`); the straight Hall 1 walk to Hall 2 is behind him, so a player who goes straight through never sees the challenge. He turns to face the player at 96 px (`facePlayerDistance`) and the challenge follows at once. The 150 px cone range is never the binding limit. If the design wants the on-sight challenge on the normal route, he needs a facing toward the aisle, a larger `facePlayerDistance`, or a different spot. If "optional, you can leave him" is the aim, this is already true. | Game 2202: `moveTo (1150,340)` from the west door: no event. `moveTo (1000,560)`: `player_spotted:operative_cipher` at playerPosition (1048,364) (seq 415 region). Game 2201: `walk down` from (1033,334) to (1033,371): fires. |
| N3 | minor | **A reload replays a stale HaX text.** After the print was lifted and logged, a reload brought "The crew's own fingerprint kit. It's how they beat the plant reader. Vance's print is on the Hall 1 duty panel. Hurry." as a toast and a second thread message. The inventory restore appears to re-emit `item_picked_up:fingerprint_kit`; the mapping at `scenario.json.erb:790-795` is `onceOnly` in memory only, and `attack_mechanism_known` was true by then, so the second variant fired. (Not one of round 1's changes, but it is the "late reload replays a text" class.) | Game 2202: take the kit, submit the four flags, lift the print, reload (seq 1136). Thread shows the line at 2:47 (first time) and again at 2:48 (screenshots 09, 11). |
| N4 | minor | **The tutorial prompt and the guard's on-sight chat open together.** The guard fires on the first frame after the briefing, while the "Welcome to Hacktivity Games!" prompt is still up. In 2202 the `brief` showed the guard's dialogue active while the screenshot showed only the tutorial modal (screenshot 02). A new player has to answer the prompt before they can see the guard. Probably harmless (the chat waited), but the order is fragile: `requireGlobal: briefing_played` is all that holds it back. | Fresh game, drive the briefing by hand (2202 seq 335 to 345), screenshot as the guard's first line shows. |
| N5 | minor | **Vance's chat portrait is a generic hooded hacker on black.** Vance (hi-vis site engineer, his sprite and phone avatar are right) appears in conversation as the dark hooded figure also used for the operatives. Looks like the character stage's job (R-M1 style). | Game 2202 or 2201: talk to Vance (screenshots 04, 05). |
| O1 | observation | **Voltage before the mapping:** "The button? Press it. Grid control won't shed a megawatt on what you've got." is followed by "You don't get to have both. I'd decide quickly." with only fight and back off on offer. "Both" no longer parses. Wording only. | Game 2201 screenshot 24. |
| O2 | observation | **Fight with Static joining, idle:** a player who did nothing for the roughly 20 s it took to leave the chat and read the screen died ("KNOCKED OUT", Restart / Main Menu, screenshot 26). On Restart, `racks_vented`, `vented_by_trigger` and `casualties_occurred` were already set (the race is forfeited, known as walkthrough g5), even with `crew_warned` true. With a perfect-timing bot (second fight, no race): Static KO in 4.9 s (HP 100 to 88) and Voltage in 5.7 s more (88 to 76), 94 punches in all. Fairness under real play with both up is still unjudged; this needs a human. | Game 2201 seq 767 to 830 (fight), 788 (death), later fight in the same log. |
| O3 | observation | KO'd Static still stands upright after a fight (known E2 from the regression run); Voltage lies down. | Game 2201 screenshot 30. |
| H1 | harness note | `dismiss` could not find the Resume button after a reload ("no-button-matching:Resume", blocker text "OTHER SESSIONS…"); an `eval` clicking the button with the exact text "Resume" worked. After the ESD reload the overlay appeared; after the first reload it appeared only after the title screen. | 2202 seq 1136, 1436. |
| H2 | harness note | `enter plant_room` from Hall 2 reported `did-not-cross` after three attempts in game 2201 after the Restart: feet (1327,550) aligned in the gap (1312 to 1344), `crossed:false` each time, doorway at (1328,544), door sprite absent and open. `walk down` for 600 ms twice crossed fine. Possibly the entry guard was still up from the restart. Report only. | Game 2201 after seq 830. |

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at (seq) | Earned? |
|---|---|---|---|---|
| Vance's Level 1 card | cloned (EM4100 HEX 8E 50 68 FC 79) | Vance's lanyard, ally route "I'll need into the halls." | 2202 about 600 | yes |
| Hall 2 reader | emulate Level 1 | cloner "Saved" list | 2202 after the dial | yes |
| Relay's Workshop Card Level 2 | cloned (HEX BB 3F F1 C6 51) | Relay's standoff "(Keep her talking…)" | 2202 and 2201 | yes |
| Workshop door | emulate Workshop Card Level 2 | cloner "Saved" list; HaX text names the need | 2202, 2201 | yes |
| OptiGrid tool case | lockpick | HaX workshop text "Open it." | 2202, 2201 | yes, **assisted** (`completeLockpick`) |
| Go-bag | lockpick | HaX's call-in offer names it | 2202 | yes, **assisted** |
| Fingerprint Kit and Job Card | items | inside the case | 2202, 2201 | yes |
| Powder and print class | Silver, Loop | surface text "dark, smooth, shiny"; the Loop answer came from the earlier regression log, not from reading the lift | 2202, 2201 | powder yes, class **assisted** (replayed) |
| Plant reader | Vance's 71% lift | the logged sample | 2202, 2201 | yes |
| `<flag:1>`, `<flag:2>`, `<flag:4>`, `<flag:3>` | seeded values | VM jump server, unreachable in standalone | 2202 (four submits) | **no, flag supplied** |
| Flag prerequisites | VM launcher not opened; field-guide offers fired | | | **no** (flags exercised, not tested) |
| ESD arming | thermometer read, flags in, Voltage handled by the button stance | thermometer, flags, Voltage's chat | 2202 | yes (flags supplied) |

Rows marked "no" bound the run: the four flags and the VM teaching behind them were exercised, not tested. In 2201 the attack was deliberately left unmapped to see Voltage's early stances and the unarmed ESD. `debugKO` was used on Relay only (game 2201, "combat not played"); Static and Voltage were punched in an in-page loop (a perfect-timing floor, not a human).

## Not covered

The phone path's "Not yet"; an unwarned vent and the "CASUALTIES" credits line; the guard KO credits; the arrest route and the Static-down stance menu; the fight with Cipher; the crew-warned-then-vent variants (r4 route, covered by the driver but not in a browser); a Static fight beside the unmapped Voltage with a human at the keys.
