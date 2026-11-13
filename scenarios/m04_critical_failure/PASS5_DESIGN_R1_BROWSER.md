# m04 pass 5, scenario design round 1: browser checks

Date 2026-10-13. Keyless server :3001 only (:3000 untouched). Headless, speed fast, load about 0.6. Targeted run of the seven checks from the round-1 entry in `IMPROVEMENT_LOOP_LOG.md` (commit f5baf890), plus coordinator checks 8 to 10 for the round-2 build (commit 7f4fb684, 10:18:45). Answers question 2 (unexpected routes) and the plumbing question. Not blind, not a solvability pass. Do-not-open rule held. All five sessions stopped with `session-stop.sh`; no `pipes-*` or `.pid` of mine remains (the chromium at PID 14308 predates this run and is not mine).

## Games, builds and logs

| Game | Build | Checks | Session log (line = `seq`) |
|---|---|---|---|
| 2211 | old (created 10:08, before 7f4fb684) | 1 (ignored text, hub re-offer), 2 (Hall 2), 4 (aims on entry) | `tools/playtest/m04-pass5-design-r1-game2211.jsonl` (267 cmds) |
| 2213 | old (created 10:13) | 3, 4, 7 (full run to credits; Vance never met) | `tools/playtest/m04-pass5-design-r1-game2213.jsonl` (1157 cmds) |
| 2214 | new (7f4fb684) | 1 (click the text), 8, 9 | `tools/playtest/m04-pass5-design-r2-game2214.jsonl` (757 cmds; stopped after Voltage KO) |
| 2215 | new | 10 (full run to credits) | `tools/playtest/m04-pass5-design-r2-game2215.jsonl` (861 cmds) |
| 2216 | new | 5, 6 (Vance ally, evacuation, Voltage stances) | `tools/playtest/m04-pass5-design-r2-game2216.jsonl` (833 cmds; stopped in Voltage's chat) |

(Game 2212 was not mine.) Flags XMLs: `tools/playtest/m04_critical_failure-flags-game<id>.xml`. Screenshots (all looked at) in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-p5-design-r1-browser/`: A01 ops-office objectives, A02 to A04 Hall 2 flipper, A05 synthetic no-card text, A06 and A07 dial, A08 hub, B01 dial text, B02 Voltage KO, B03 credits, C01 Hall 2, C02 call opened from the text, C03 Static text, E01 evacuation with chat open, E02 Voltage stance choices.

## Summary

| # | Check | Build | Result |
|---|---|---|---|
| 1 | Dial call: text after about 6 s, click opens the call, view not closed, hub re-offers | old (ignore) and new (click) | **PASS** |
| 2 | Hall 2 refusal text (as shipped in round 1, on `door_unlock_failed`) | old | **FAIL**: never fires for a player with the cloner. Superseded by check 8 |
| 3 | Static slips out; credit line | old and new | **PASS** (credit); see finding F2 for the new text |
| 4 | Never met Vance: aims, optional task, debrief, credit | old | **PASS** |
| 5 | Arrest wording | new | **PASS** for "Step away from the bench. You're coming with me."; the second choice not reached |
| 6 | Evacuation texts wait 8 s | new | **PASS with a limit** (nothing interrupted the chat; arrival time not isolated) |
| 7 | Debrief "what failed" beat | old | **PASS** (lines recorded below) |
| 8 | Hall 2 no-card text on `door_unlock_attempt` | new | **PASS** |
| 9 | Static-gone text | new | **FAIL on attribution** (F2) |
| 10 | Clone then walk off: Vance debrief lines, "never told" | new | **PASS** |

0 blockers, 0 majors, 3 minors (F1 to F3), plus 2 observations.

## verify-run.rb output (pasted)

```
game            2211  (mission 48)
created         2026-10-13 09:08:27 UTC
last write      2026-10-13 09:13:00 UTC
played for      273s of wall clock
current room    "main_entrance"
unlocked rooms  4: main_entrance, operations_office, scada_control_room, battery_hall_1
unlocked objs   0: 
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad
NPCs met        9: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher
flags submitted 0: 
globals set     6: anomaly_detected, briefing_played, checkpoint_passed, disclosure_choice, engine_tutorial_declined, player_name

VERDICT: progress recorded — 3 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.

game            2213  (mission 48)
created         2026-10-13 09:13:10 UTC
last write      2026-10-13 09:21:47 UTC
played for      517s of wall clock
current room    "main_entrance"
unlocked rooms  8: main_entrance, operations_office, security_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   2: security_equipment_locker, optigrid_tool_case
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Spare Keycard (Level 1), Workshop Keycard (relayed copy), Fingerprint Kit
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_1c4fb8}, flag{m04_critical_failure_bms_jump_server_2_87bfce}, flag{m04_critical_failure_bms_jump_server_3_738788}, flag{m04_critical_failure_bms_jump_server_4_bb13f4}
globals set     36: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, briefing_played, checkpoint_passed, clock_started, debrief_started, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, esd_authorized, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, level1_card_held, lockpicking_guide_offered, mission_complete, operative_relay_defeated, plant_reader_seen, plant_room_entered, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, rfid_guide_off

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.

game            2214  (mission 48)
created         2026-10-13 09:22:50 UTC
last write      2026-10-13 09:28:57 UTC
played for      367s of wall clock
current room    "main_entrance"
unlocked rooms  8: main_entrance, operations_office, scada_control_room, battery_hall_1, security_office, battery_hall_2, engineering_workshop, plant_room
unlocked objs   2: security_equipment_locker, optigrid_tool_case
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Spare Keycard (Level 1), Workshop Keycard (relayed copy), Fingerprint Kit
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_6ef647}, flag{m04_critical_failure_bms_jump_server_2_c65c37}, flag{m04_critical_failure_bms_jump_server_3_f15192}, flag{m04_critical_failure_bms_jump_server_4_c4d42f}
globals set     33: all_flags_in, anomaly_detected, attack_mechanism_known, briefing_played, checkpoint_passed, clock_started, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, esd_authorized, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, level1_card_held, lockpicking_guide_offered, operative_re

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.

game            2215  (mission 48)
created         2026-10-13 09:29:42 UTC
last write      2026-10-13 09:35:23 UTC
played for      341s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_7768b3}, flag{m04_critical_failure_bms_jump_server_2_f8fc38}, flag{m04_critical_failure_bms_jump_server_3_e363fd}, flag{m04_critical_failure_bms_jump_server_4_11e52d}
globals set     38: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, briefing_played, checkpoint_passed, clock_started, debrief_started, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, esd_authorized, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, lockpicking_guide_offe

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.

game            2216  (mission 48)
created         2026-10-13 09:36:25 UTC
last write      2026-10-13 09:42:33 UTC
played for      369s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_48ac36}, flag{m04_critical_failure_bms_jump_server_2_a56aa8}, flag{m04_critical_failure_bms_jump_server_3_8a9169}, flag{m04_critical_failure_bms_jump_server_4_90e135}
globals set     36: all_flags_in, anomaly_detected, attack_mechanism_known, briefing_played, checkpoint_passed, clock_started, crew_warned, crew_warned_early, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, lockpicking_guide_offered, operative_rela

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

(2211 and 2214 and 2216 end before the mission does, on purpose. 2213 and 2215 reached `mission_complete` true. Long lines are cut at 400 to 600 characters here; the verifier's full output is reproducible with `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <id>`.)

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Spare Keycard (Level 1) | item | security locker, lock opened with `completeLockpick` (assisted) | 2213, 2214 | yes (lock assisted) |
| Vance's card clone | cloner save | Vance's chat, cloner minigame, Save clicked | 2215, 2216 | yes |
| Workshop Keycard (relayed copy) | item | HaX call after Relay's KO | all full games | **no: Relay KO'd with `debugKO` (combat not played)** |
| Fingerprint Kit | item | OptiGrid tool case (lock assisted) | 2213 to 2216 | yes (lock assisted) |
| Vance's print | lift | Hall 1 duty panel, dusting played through | 2213 to 2216 | yes |
| `bms_jump_server` flags 1 to 4 | `<flag:1>`..`<flag:4>` | the VM work (not possible standalone) | 2213 to 2216 | **no: flag supplied.** Workshop and drop site reached |
| Voltage | KO | `debugKO` in 2213, 2214, 2215 | | **no: exercised, not earned** |
| Static down | KO | `debugKO` in 2216 | | **no: exercised, not earned** |

The "no" rows are the limit of the run: combat, Relay's and Voltage's fights and the VM work were exercised, not tested.

## Results per check

### 1. The dial call (PASS)

- Ignore variant, game 2211 (old build, lines from the dial interact to 140): the dial opened as a bottom text bar ("The thermometer dial reads: 61°C ... is hiding.", A06), not a minigame. No phone chat opened by itself; the bar stayed up while the HaX toast "Sixty-one on that dial? Call me when you're clear of it." arrived (A07). The text arrived within about 12 s of the interact (not timed in 2211). Opened the phone without clicking the text: the HaX hub (choices read, in order) was "You wanted to talk about the dial reading." / "Can we get the night crew out of Hall 2?" / "How do I get through the card readers?" / "Where do I stand?" / "Nothing right now." (A08 taken one step later). Taking it played the 61 degrees call ("Nightshade's got your reading. Sixty-one degrees on the Hall 1 battery thermometer, against twenty-eight on the screens." ...). Reopened the hub: the offer was gone.
- Same hub offer seen unprompted in 2213 (old build, after the flags): "You wanted to talk about the dial reading." was first in the list.
- Click variant, game 2214 (new build): a poller found the toast (`SPAN.npc-bark-text`) 6.6 s after the interact (7305 ms against an interact at about 700 ms) and clicked it; a `phone-chat` minigame opened on the `on_anomaly_confirmed` knot (C02). The player was not holding any open view at that moment.
- Not tested: the toast being clicked while the dial text bar is still showing in the same frame; the 6 s was measured by poll, with 100 ms resolution.

### 2. Hall 2 refusal, round-1 wiring (FAIL, then check 8)

Game 2211 (old build). Walked to the Hall 2 door with no Level 1 card and the cloner. Interacting opens the RFID flipper; "Saved" says "No saved cards", "Read" says "No keycards in inventory" (A02 to A04). Cancelling emitted only `door_unlock_attempt` (drain), no `door_unlock_failed`, and no HaX text came in 4 s. A player holding the cloner (everyone) and no card has no way to be "refused": the `door_unlock_failed:battery_hall_2` event fires only for a wrong card or a no-cloner player (`unlock-system.js`, `rfid-minigame.js:153`). Emitting the event by hand (`eventDispatcher.emit("door_unlock_failed:battery_hall_2", ...)`, "exercised, not earned") produced the text: "That reader wants a Level 1 card. Vance's is old prox: stand close while he talks and the cloner reads it. Or the spare in the security locker." (A05). The wording is fine; the trigger was the problem, which round 2 changed.

### 8. Hall 2 no-card text on `door_unlock_attempt` (PASS, new build)

Game 2214. Same steps (no card, cloner, interact on the door, flipper open): `door_unlock_attempt` fired and the identical text was in HaX's thread within about 4 s (read after closing the flipper; C01 is the flipper). Not covered: that the text does not also fire for a player who holds the spare or the clone (the mapping's condition says it won't; not run).

### 3. Static slips out (PASS)

- 2213 (old): Static's chat, "I'm not here for you. I'm here to talk to him." (`static_stood_aside` true, `static_engaged` false). `debugKO voltage` with no stance chat: within 3 s `static_left`, `static_left_alone`, `voltage_neutralised` true; Static no longer visible in the room list (`visible: false`); Voltage lying on the floor (B02). Credits (read from `#bv-cr-label`): "... VOLTAGE: CAPTURED — Blackout's field lead in custody / ROBERT VANCE: never met — you went round him / **STATIC: stood aside, and slipped out when Voltage fell** / DISCLOSED IN FULL ..." (full list under check 4).
- 2214 and 2215 (new): same globals; 2215's credits repeat the line.

### 4. Never met Vance (PASS, game 2213, old build)

- Slipped past the guard (closed his challenge), entered the operations office: drain showed `objective_aim_completed:get_inside` and `objective_task_completed:enter_facility`. Aims straight after: `get_inside:completed [enter_facility=completed, meet_robert_vance=active(opt)]`, `confirm_the_lie:active [find_infiltration_evidence=active(opt), identify_scada_anomalies=active]`, the rest locked. Panel (A01): "Get Inside" ticked and folded, "Confirm the Telemetry Is Lying" open with "(Optional) Find evidence of the break-in" and "Verify the rack temperatures independently". The "(Optional) Find the OT engineer on shift" line is not shown once the aim is complete, and stays `active(opt)` in the manager to the end (checked at the debrief). Fine.
- After the dial (read in Hall 1): "Confirm the Telemetry Is Lying" completed; "Reach the Engineering Workshop" and "Take the Plant Back from the Cell" unlocked in that order (A06, B01), then "Map the Attack" after the workshop, then "Stop the Thermal Runaway". Sensible.
- Debrief (lines under check 7): no "Vance needs to hear it too", no Vance speaking, no "Vance will want every line", no thanks. The farewell choices were "Make sure the site manager gets the report." and "Just doing my job." and the answer was "He'll get it. He'll want to know who was in his plant tonight, and why nobody told him."
- Credits in full (2213, B03): MISSION COMPLETE / CRITICAL FAILURE / ALBION ENERGY STORAGE: THERMAL RUNAWAY AVERTED — Emergency Shutdown engaged / GRID HELD: 240,000 residents kept on supply / ALL ELEVEN ON SITE WALKED OUT / ── DECISIONS ── / VOLTAGE: CAPTURED — Blackout's field lead in custody / **ROBERT VANCE: never met — you went round him** / STATIC: stood aside, and slipped out when Voltage fell / DISCLOSED IN FULL — the attack, the vulnerabilities, and how close it came / THE ARCHITECT: identity still unknown. Phase 3 looms. / ENTROPY: Still operational. Cross-cell strikes continue.
- `mission_complete` true.

### 5. Arrest wording (PASS for one choice, game 2216, new build)

Voltage's "We'll stop all of them. Starting with you." leads (with Static down) to four choices (E02): "I'm taking you down. Now." / "Step away from the bench. You're coming with me." / "Go for the button and let him run." / "Not like this. (Back off.)". No "under arrest" anywhere. Taking the second one: Narrator "He looks at your hands, then at the door behind you." Voltage "Nobody left to stop you. All right.", then "Blackout signed it. You countersigned. Tell that to a court." / "Not yet." The other choice, "Hands on the bench. The police can have you.", is in `voltage_after_trigger` (`m04_npc_voltage.ink:454`), which needs a vented bank first. **Not reached in the browser.**

### 6. Evacuation texts (PASS with a limit, game 2216, new build)

In-person Vance (ally route): "Is anyone working in the halls tonight?" then "Sound it. Get them out." (`crew_warned` true). I held the chat open on "They're moving. Nine of them, out through the Hall 2 fire doors." for about 25 s of page time (E01: no toast over the chat, chat still open). Afterwards the HaX thread held "That's the evacuation. Good. But Voltage heard it too, and he won't wait for eight now. You've about half an hour." (variant with Voltage still up). So the text neither opened a call nor interrupted the chat. Limit: my DOM poller for the text saw no element at any point (the toast either does not draw over a chat or was gone before I looked), so I did not record the exact arrival time; it is not shown that the 8 s delay, rather than the chat, held it back.

### 7. Debrief "what failed" beat (game 2213, old build; word for word)

New HaX lines about the network weaknesses:

1. "On the network it was the same story."
2. "A legacy compile service left running on an OT box, trusting whatever it was sent."
3. "An FTP service that handed their cross-cell plan to anyone who looked. And an account on the jump server with far more privilege than its job needed."

Fix line that follows the "Encrypted cards..." and gauge lines: "Old services off the OT network, and privileges somebody actually reviews."

Line crediting the FTP flag, in the intelligence beat: "Their FTP drop already put Critical Mass and Social Fabric on the same job. The paper in the plant room would have signed it."

Context, in order: "Their door cards are old prox. They hand their number to anything that asks. You could have had Vance's from across his desk." / "The HV door took one finger, and that finger was on a panel he touched every two hours. A print names you. It can't prove you're the one standing there." / "And the control room believed its own sensors. The honest instruments were the ones nobody had wired to the bus: a dial, and a gas monitor nobody read." / [the three lines above] / "Encrypted cards. A second factor on the HV door, and a reader that checks for a live finger." / "A temperature gauge in every hall that isn't on the bus, and somebody reading it." / [the fix line]. Full transcript: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-p5-design-r1-browser/B-debrief.txt`. The three network lines say "needs checking against SecGen by the user" (not opened here).

### 9. Static-gone text (FAIL on attribution, game 2214, new build)

`static_left_alone` set; the text was scheduled and delivered (`delivered: true`, `npcId: operative_static`, `phoneId: player_phone`), but under Static's name. The toast read "ENTROPY Operative 'Static': Static's gone out the dock door. Let him go. The button's what matters." (C03). It is not in HaX's thread and Static is not a phone contact, so a player sees an enemy NPC telling them to let him go, once, as a toast. Cause: `npc-manager.js:854-865` sends a mapping's `sendTimedMessage` as the NPC that owns the mapping (here `operative_static`), and the mapping is on Static (`scenario.json.erb:2219-2224`). The other HaX texts live in HaX's own mappings. Suggest moving the mapping to `agent_0x99` (same event, same condition).

### 10. Clone, close the chat, finish (PASS, game 2215, new build)

Vance: "Just doing the job" > "I'll need the staff records." > "(Lean in over the site map while the cloner reads his lanyard.)"; the flipper read, Save clicked, then closed the chat on "The cloner buzzes once against your hip..." (`vance_spoken` true, `vance_met` false, `vance_is_ally` false, `vance_provided_keycard` true, `meet_robert_vance` completed). The mission was finished with Voltage KO'd (Static stood aside). Debrief kept Vance's lines (choice "It goes in the report. Vance will want every line.", HaX "Vance needs to hear it too.", Vance speaking: "There'll be hell to pay for this place. Fair enough.", "I don't follow all of it. I know the hall's still standing.", "I'll have those card readers out by the end of the week.", farewell choice "It was an honour working with you, Mr Vance."). Credits: "**ROBERT VANCE: never told — the cover held all night**", plus the Static slip-out line. `mission_complete` true. Transcript `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-p5-design-r1-browser/D-debrief.txt`.

## Findings

| # | Severity | Finding | Repro (game, log) |
|---|---|---|---|
| F1 | minor | (Round-1 wiring, already superseded.) The Hall 2 no-card text never fired for a player with the cloner and no card, because `door_unlock_failed` is emitted only for a wrong card or no cloner. Round 2 moved it to `door_unlock_attempt` and check 8 passes | 2211, interact on `door:battery_hall_1->battery_hall_2` then drain: `door_unlock_attempt` only |
| F2 | minor | The "Static's gone out the dock door" text arrives as a toast from "ENTROPY Operative 'Static'" and is in no thread. A player reads the enemy telling them to let him go. The text is in Static's mapping, and mapping texts are sent as the mapping's owner | 2214, after `debugKO voltage` in the plant room (stood aside first); toast in C03 |
| F3 | minor | The debrief still says "Eleven people walked out of there tonight. Forty-odd on that feed never knew they were on it." in the new build, against "GRID HELD: 240,000" in the credits and 240,000 in the briefing. (The coordinator's round-2 list says a debrief count line was fixed; I saw this one unchanged in game 2215. If it was changed in a branch I did not take, ignore this) | 2215, `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-p5-design-r1-browser/D-debrief.txt` line 46 |

Counts: 0 blockers, 0 majors, 3 minors.

Observations, not findings:
- Vance's in-person chat shows a dark hooded figure on black (E01), not a man in an office. It may be the missing-art placeholder; the Voltage bust in the same session is a finished portrait (E02).
- The evacuation text could not be timed (check 6 limit above). A test that reads the thread's delivered timestamp (`npcManager.timedMessages`, `delivered`) would settle it.

## Exercised, not earned

Relay, Static and Voltage KO'd with `debugKO`; the four flags supplied; locker and tool-case locks opened with `completeLockpick`; the no-card text in 2211 produced by emitting the event by hand. The "Hands on the bench" choice, the evac-text arrival time and a reload mid-debrief were not tested.
