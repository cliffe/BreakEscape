# m04 Critical Failure: pass 5 puzzle chains round 3, browser confirmation

Date 2026-10-13. Keyless server :3001 only (:3000 untouched). Headless, speed fast, load about 1.2. This is a targeted run of the six "Browser checks before closing" from `PUZZLE_CHAINS_REVIEW_P5_R3.md` (commit e1f1a317), plus the briefing HaX sprite check. It answers question 2 (unexpected routes) and the plumbing question; it is not blind and not a solvability pass. Source of steps: the review's six checks, the round 2 and 3 entries in `IMPROVEMENT_LOOP_LOG.md`, and a replay of the print-lift and ESD drivers from `tools/playtest/m04-pass5-align-r2-game2204.jsonl`.

Both sessions stopped with `session-stop.sh`; `ps` shows no harness process of mine and no `pipes-*` or `.pid` left. The do-not-open rule held (no SecGen XML, none of the four listed field guides).

## Games and logs

| Game | Checks | Session log (line number = `seq`) | Flags XML |
|---|---|---|---|
| 2209 | briefing HaX; 1 locker spare; 3 dial only; 4 evidence afterwards | `tools/playtest/m04-pass5-puzzle-r3-game2209.jsonl` (933 commands; stopped after check 4, no ending) | `tools/playtest/m04_critical_failure-flags-game2209.xml` (not used) |
| 2210 | 2 slip past the guard; 5 flags first and dial last; 6 no-evidence ending | `tools/playtest/m04-pass5-puzzle-r3-game2210.jsonl` (1207 commands; ESD pressed, debrief and credits played, `mission_complete` true) | `tools/playtest/m04_critical_failure-flags-game2210.xml` |

Screenshots (all looked at), in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-p5-puzzle-r3-browser/`: 01, 02, 03 briefing; 04 locker take; 05 and 07 "Where do I stand?" before and after reload; 08, 09, 10 dial and objectives; 11 evidence after the dial; 12 to 13 guard challenge and slip-past hub; 14 to 16b flags, ESD refusal, hub; 17 dial last; 18 debrief; 19 credits.

## Summary

| # | Check | Result |
|---|---|---|
| B | Briefing HaX has her own sprite and bust | PASS |
| 1 | Locker spare without cloning Vance | PASS |
| 2 | Slip past the guard | PASS |
| 3 | Dial only, no evidence | PASS |
| 4 | Evidence after the dial | PASS |
| 5 | Flags first, dial last | PASS, with one finding (M-1, minor) |
| 6 | No-evidence ending | PASS for the absence of the credits line; the presence half is untested |

0 blockers, 0 majors, 4 minors (3 game, 1 harness note), 0 of them stopping the ending.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Spare Keycard (Level 1) | item | Security Equipment Locker, security office; lock opened with `completeLockpick` (assisted, dexterity minigame) | 2209 line 767; 2210 line 257 | yes (lock assisted) |
| Workshop Keycard (relayed copy) | item | HaX text after Relay's KO | 2210 after `debugKO` | **no: Relay KO'd with `debugKO` (combat not played), "exercised, not earned"** |
| Fingerprint Kit | item | OptiGrid tool case, workshop (lock assisted) | 2210 | yes (lock assisted) |
| Vance's print | lift | Hall 1 Duty Round Panel, dusting minigame played in full | 2210 line 549 | yes |
| Plant-room reader | the lift | Fingerprint reader | 2210 | yes |
| `bms_jump_server` flags 1 to 4 | `<flag:1>` .. `<flag:4>` | the VM work, which standalone cannot do | 2210 lines 420 to 437 | **no: flag supplied.** Prerequisite held: the workshop was reached through the relayed card, and the terminal and drop site were used |

The two "no" rows (the relayed card, the flags) are the limit of what the run proves. The route to the workshop and the flag station was exercised, not earned. Voltage was handled by talk, not combat.

## verify-run.rb output (pasted)

```
game            2209  (mission 48)
created         2026-10-13 08:17:08 UTC
last write      2026-10-13 08:25:26 UTC
played for      498s of wall clock
current room    "main_entrance"
unlocked rooms  5: main_entrance, operations_office, security_office, scada_control_room, battery_hall_1
unlocked objs   1: security_equipment_locker
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Spare Keycard (Level 1), Maintenance Work Orders
NPCs met        9: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher
flags submitted 0: 
globals set     10: anomaly_detected, briefing_played, checkpoint_passed, disclosure_choice, engine_tutorial_declined, evidence_maintenance_logs_found, guard_admitted, level1_card_held, lockpicking_guide_offered, player_name

VERDICT: progress recorded — 4 rooms beyond the first, 1 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.

game            2210  (mission 48)
created         2026-10-13 08:26:14 UTC
last write      2026-10-13 08:39:27 UTC
played for      793s of wall clock
current room    "main_entrance"
unlocked rooms  8: main_entrance, operations_office, security_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   2: security_equipment_locker, optigrid_tool_case
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Spare Keycard (Level 1), Workshop Keycard (relayed copy), Fingerprint Kit
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_78e7f9}, flag{m04_critical_failure_bms_jump_server_2_1b24cf}, flag{m04_critical_failure_bms_jump_server_4_37abde}, flag{m04_critical_failure_bms_jump_server_3_d21382}
globals set     35: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, briefing_played, checkpoint_passed, clock_started, debrief_started, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, esd_authorized, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, level1_card_held, lockpicking_guide_offered, mission_complete, operative_relay_defeated, plant_reader_seen, plant_room_entered, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, rfid_guide_offered, server_room_reached, static_left, static_stood_aside, vance_print_lifted, voltage_escaped, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

(Both games end "current room main_entrance": the session-stop sync and the reload respawn. 2209 reads `meet_robert_vance` completed only because Vance's chat was opened; `vance_met` stayed false because it is set only after the clone. 2210 never opened Vance's chat.)

## Results per check

### B. Briefing HaX (game 2209, lines 1 to 60)

PASS. The briefing was not bootstrapped; the title screen let go and the briefing was driven by hand. When "Agent HaX" speaks (line about Ransomware Incorporated), the bust in screenshot 02 is the trench-coat-and-hat woman with dark hair, identical to `public/break_escape/assets/characters/agent_hax_talk.png` (checked against the file). It is not the hooded hacker. The same bust shows at the debrief (2210, screenshot 18) and the phone header avatar is her `agent_hax_headshot` (screenshots 07, 16b). Observation, not a finding: during the narrator, Netherton and Nightshade lines the portrait stays HaX's (screenshot 01 shows her while the narrator names Netherton); the briefing NPC has one talk sprite for the whole conversation, which is how every briefing works. I could not read the NPC's `spriteSheet` key from the page (`window.npcManager` was not reachable in a briefing, and the walk sprite is hidden), so the sprite-sheet field itself is checked by the bust only.

### 1. Locker spare without cloning Vance (game 2209)

PASS.
- Signed in with the guard ("Grid-safety regulator", then "Routine procedure"), `guard_admitted` true (line 673 first read; sign-in at lines 619 to 640).
- Opened Vance's chat, took "Just doing the job" and "Tell me about the recent maintenance work", then closed with the x. No clone: `vance_met`, `vance_card_cloned`, `vance_provided_keycard` all false.
- Locker lock opened with `completeLockpick` (assisted). Container take of "Spare Keycard (Level 1)": `level1_card_held` false at line 765, **true at line 769** straight after the take. `onPickup` fires for a container take. `vance_provided_keycard` stayed false (as designed).
- HaX hub (line 809, screenshot 05): choices were "How do I prove the screens are lying?", "Send me a field guide.", "Where do I stand?", "Nothing right now." No card-reader hint. "Where do I stand?" answered "Prove the screens are lying. The dial on the Rack Bank C wall in Hall 1 isn't on their network." It did not name Vance's card.
- Reload (`location.reload()`, Enter on the title, DOM click on Resume, line 818 onwards): inventory kept the spare, `level1_card_held` true, `checkpoint_passed` true, and the same hub answer (line 851, screenshot 07).

### 2. Slip past the guard (game 2210)

PASS.
- The guard's challenge opened by itself on spawn (line 179, "Morning. Bit early for visitors. Desk first, if you don't mind.", screenshot 12). Closed with the x (`mg close`), no choice made. `guard_admitted`, `security_guard_ko`, `guard_hostile` all false. (This is the "close the challenge" route, not the "(Keep walking.)" choice, which round 2 already covered.)
- Walked south (`enter operations_office`): **`checkpoint_passed` true** at line 193, `guard_admitted` still false.
- First open of the HaX hub (after the start knot greeting and "On it."): choices were "How do I prove the screens are lying?", "How do I get through the card readers?", "Where do I stand?", "Nothing right now." **"How do I get past the gate?" is gone; the card-reader hint is offered.**
- "Where do I stand?" (line 227, screenshot 13): "Find Robert Vance, in the operations office. Nobody knows that plant better." The card-reader hint (line ~237): "Vance's door card is old prox... If that goes wrong, there's a spare Level 1 in the security office locker."

### 3. Dial only, no evidence (game 2209)

PASS.
- Dial read in Hall 1 at line 868, with no document read. The HaX phone conversation opened (screenshot 08) and its one reply "Then where do I start?" was taken.
- `window.objectivesManager.aims` at line 873: `confirm_the_lie: completed [find_infiltration_evidence=active, identify_scada_anomalies=completed]`, `reach_the_workshop: active`, `take_back_the_plant: active`. The objectives panel (screenshot 09) shows "Confirm the Telemetry Is Lying" ticked and folded, and "Reach the Engineering Workshop" and "Take the Plant Back from the Cell" open with their tasks.
- Reload (line 894): the same aim list (line 903, screenshot 10): `confirm_the_lie` still completed with the evidence task still active. The aim is server state.
- `brief().openTasks` after the dial no longer listed the evidence task (it is optional; the manager's list still carries it as active).

### 4. Evidence after the dial (game 2209)

PASS.
- Read "Maintenance Work Orders" (ops office) after the dial and the reload. `evidence_maintenance_logs_found` true (line 919). The drain at line 919 contains `objective_task_completed` and `objective_task_completed:find_infiltration_evidence` (`optional: true`, `aimId: confirm_the_lie`) and **no `objective_aim_completed` or aim-unlock event**. Toast DOM empty afterwards; objectives panel unchanged (screenshot 11); manager shows `confirm_the_lie: completed [find_infiltration_evidence=completed, identify_scada_anomalies=completed]`.
- Limit: I did not catch the dial-time `objective_aim_completed` in a drain (the event buffer had rolled over), so "no second toast" rests on the absence of the event after the read, the empty toast DOM and the screenshot, not on a toast watcher.

### 5. Flags first, dial last (game 2210)

PASS, one finding (M-1).
- Dial unread. Submitted flags 1, 2, 4 and 3 in that order at the workshop drop site ("flag supplied", `submittedVia: button`), lines 420 to 437. After the last: `all_flags_in`, `attack_mechanism_known`, `clock_started` true; `anomaly_detected` false.
- HaX texts that arrived (thread read from the DOM, all stamped 9:30; line 459): "Their route in, proven. They pushed the charge-ceiling override from that box, and the bypass modules hide it. The trigger is in the plant room. Get to the ESD." then "Flags are in. Grid control still wants a real reading off the racks. The dial thermometer on the Rack Bank C wall, Hall 1. It isn't on their network." (contact list preview at line 449). **Two texts, not one** (M-1). I did not time the 2.5 s to the millisecond: the thread stamps only to the minute, and the toast watcher I armed was too noisy to separate them. The erb delays are 1.5 s (aim-complete text) and 2.5 s (flags-in text).
- ESD refusal (line 735, screenshot 15): "NOT ARMED. GRID PERMISSIVE NOT RECEIVED. Grid control won't drop supply on a screen that says everything is fine. Check the racks on an instrument that isn't on the bus." It names an off-bus instrument.
- Voltage with the dial unread: the "Go for the button and let him run" choice is correctly absent (offered only with the attack mapped and the dial read); "Not like this. (Back off.)" works and leaves a standoff (line 699).
- Hub "Where do I stand?" (lines 767 to 789, screenshot 16b): "Your flags are in. Grid control still wants a real reading off the racks." / "The dial thermometer on the Rack Bank C wall in Hall 1. It isn't on their network." Names the dial. Before the answer, the hub offered "How do I prove the screens are lying?" (dial hint) and "I've got their attack mechanism mapped."
- Dial read last (line 782, screenshot 17): Nightshade's reading and "Then what's still missing?" offered (line 789), taken. Back in the plant room Voltage's re-talk offered "Then let's finish this", then all three stances including "Go for the button and let him run." (line 857). `voltage_neutralised`, `voltage_escaped`, `esd_authorized`, `static_left` all true.

### 6. No-evidence ending (game 2210)

PASS for the absence half.
- Pressed the ESD (guard, button, confirm via `.esd-guard`, `.esd-button`, `.esd-confirm`, as in earlier runs, line 906): `attack_prevented` true (line 909).
- HaX phone "I'm done here. Bring me in." then "Bring me in." then "On my way." (lines 915 to 935). Debrief (`agent_0x99_debrief`) ran to the end through the disclosure choice ("Full public disclosure") and Vance's lines (line 1077). `mission_complete` true (lines 1202 to 1203; verify-run lists it).
- No document was read in the run (`evidence_maintenance_logs_found`, `evidence_access_logs_found`, `evidence_camera_tampering_found`, `evidence_reader_spoof_found` all false). Credits, read from `#bv-cr-label` with a MutationObserver armed before the last debrief line: MISSION COMPLETE / CRITICAL FAILURE / ALBION ENERGY STORAGE: THERMAL RUNAWAY AVERTED / GRID HELD: 240,000 / ALL ELEVEN ON SITE WALKED OUT / DECISIONS / VOLTAGE: ESCAPED / ROBERT VANCE: never told, the cover held all night / STATIC: stood aside, and left with Voltage / DISCLOSED IN FULL / THE ARCHITECT: identity still unknown / ENTROPY: Still operational. **No "THE BREAK-IN: on paper" line.** Screenshot 19 is the visualiser, not the label.
- Not tested: that the line appears on a run that did read a document. Needs one more run to the ending with a document read.

## Findings

| # | Severity | Finding | Repro (game, log lines) |
|---|---|---|---|
| M-1 | minor | Flags in with the dial unread: two HaX texts arrive within a second of each other. The aim-complete text ends "The trigger is in the plant room. Get to the ESD." and the next, "Flags are in. Grid control still wants a real reading off the racks...", says the ESD won't arm yet. The order reads as a contradiction, and the review expected a single "Flags are in..." text. The erb has both: `objective_aim_completed:map_the_attack` (condition `voltage_neutralised !== true`, 1.5 s, `scenario.json.erb` about line 1168) and `global_variable_changed:all_flags_in` (2.5 s, line 1167). Suggest: skip the aim-complete text's final sentence while `anomaly_detected` is false, or fold the dial pointer into it | 2210, lines 437 to 459 (thread read in `phonedom` after the flags) |
| M-2 | minor | A player who never speaks to Vance (slip past the guard, locker spare, workshop by the relayed card) ends the mission with "Find the OT engineer on shift" (`meet_robert_vance`) still active and the "Get Inside" aim never completed. It doesn't block the ending (it is not in `concludeRequires`; `mission_complete` true), but the round-3 hub sweep treats the Vance step as done in this case while the objectives list still asks for him. Suggest completing the task from `level1_card_held` or `plant_reader_seen`, or marking it optional | 2210, line 935 (`openTasks` includes `meet_robert_vance`; `get_inside:active`) |
| M-3 | minor | The debrief and credits assume Vance was met: HaX says "Vance will want every line" and "Vance needs to hear it too", Vance speaks in the debrief, the player can answer "It was an honour working with you, Mr Vance", and the credits read "ROBERT VANCE: never told — the cover held all night" for a player who never saw him | 2210, lines 1023 to 1077 and the credits read (line 1197) |
| H-1 | minor (harness note, not classified as a game fault) | `mg choose` with seven phone choices reported `chose: "Where do I stand?"`, `key: "6"` (lines 747 and 755) but the thread did not change; `mg clickText "Where do I stand?"` then worked. The earlier 3- and 4-choice hubs took `choose` fine. Possible number-key limit on the phone hub; I did not isolate it | 2210, lines 747 to 763 |

Counts: 0 blockers, 0 majors, 4 minors (M-1, M-2, M-3 and the harness note H-1).

Other observations, not findings: Cipher re-challenged on most crossings of Hall 1 after the 20 s cooldown, so about six x-closes were needed on the way through (consistent with the round 2 report). The phone's `mg getState` text truncates a long thread, so the latest messages had to be read from the DOM. The briefing's "Mission Brief" notes minigame stays open after the last HaX line and has to be closed with `mg close`, then the tutorial prompt dismissed.

## Exercised, not earned

- Relay was KO'd with `debugKO` (combat not played); the Level 2 card came from HaX's relayed copy. The quiet clone route was not exercised here.
- Lockpicks used `completeLockpick` (assisted).
- The four flags were supplied.
- Voltage was handled by the button route, not combat or arrest.

## Not covered

- The presence half of check 6 (credits line shown after a document was read).
- A reload after the flags with the dial unread (r14's "then the 'last piece' reply" was seen live, not after a reload).
- Millisecond timing of the two flags-in texts.
