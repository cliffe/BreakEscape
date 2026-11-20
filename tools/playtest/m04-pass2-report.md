# m04_critical_failure pass 2 playtest

Question answered: plumbing (critical path) plus unexpected behaviour (ESD early, re-talks, stances). Not a solvability pass (standalone, no VMs).
Source of steps: scenarios/m04_critical_failure/TESTING_WALKTHROUGH.md (+ PASS2_IMPROVEMENTS.md).
Headless Chromium, `--speed fast`.

- Game 1: id 1161, log `tools/playtest/m04-pass2-session.jsonl` (1055 commands). Main run, status=completed.
- Game 2: id 1162, log `tools/playtest/m04-pass2-session-g2.jsonl`. Second Voltage stance (arrest) only.
- Screenshots: `m04-pass2-shot-scada-door.png`, `m04-pass2-shot-hall1-east.png`, `m04-pass2-shot-hall2-drop.png`, `m04-pass2-shot-countdown.png`.

## Harness caveats (read first)

The scada_control_room -> battery_hall_1 door cannot be walked through (defect D1). To keep testing I used `eval window.player.setPosition(...)` four times (game 1: into battery_hall_1, back to operations_office, into plant_room; game 2: into battery_hall_1). Each is marked with a `note` command in the logs. These are teleports, not legitimate movement. Every Cipher/Relay/Voltage KO was `debugKO` (assisted, combat not played). Locker lock was `completeLockpick` (assisted). Flags were `<flag:N>` session tokens.

## verify-run.rb, game 1161 (full)

```
game            1161  (mission 48)
created         2026-09-30 18:06:37 UTC
last write      2026-09-30 18:35:23 UTC
played for      1725s of wall clock
current room    "main_entrance"
unlocked rooms  8: main_entrance, operations_office, security_office, scada_control_room, battery_hall_1, engineering_workshop, battery_hall_2, plant_room
unlocked objs   1: security_equipment_locker
inventory       10: Your Phone, Lock Pick Kit, Grid Regulator Credentials, Notepad, Maintenance Work Orders, Spare Keycard (Level 1), Incident Response Guide, Workshop Keycard (relayed copy), Master Keycard (relayed copy), Master Keycard
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_ad4e82}, ..._2_86b5e5, ..._4_cc44e4, ..._3_cf911e
globals set     30: anomaly_detected, attack_mechanism_known, attack_prevented, briefing_played, casualties_occurred, chen_is_ally, chen_phone_available, chen_provided_keycard, debrief_ready, disclosure_choice, distcc_guide_offered, esd_authorized, evidence_maintenance_logs_found, hydrogen_alarm, lockpicking_guide_offered, mission_complete, operative_cipher_defeated, operative_relay_defeated, operative_static_defeated, player_name, racks_vented, recon_guide_offered, remote_trigger_disabled, rfid_guide_offered, server_room_reached, vance_met, voltage_captured, voltage_escaped, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 7 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```
(Two flag values abbreviated here; full values in the log.) Game record via rails runner: `status=completed`, `mission_concluded_at=2026-09-30 18:35:23 UTC`, all five aims completed, `stop_the_runaway` completed at 18:35:23.

Game 1162 verifier: progress recorded, 6 rooms beyond the first, 0 flags (game-2 scope was the arrest stance only).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Level 1 keycard | (item) | Security Equipment Locker, security_office (lockpick, `completeLockpick` assisted). Vance's hand-over did NOT work (D2) | g1 after Vance talk | yes, via locker only |
| Workshop keycard (L2) | relayed copy (item) | HaX phone relay on `npc_ko:operative_cipher`. Physical drop did not happen (D3) | g1 at Cipher KO | yes (fallback route) |
| Master keycard | physical drop (g1 Relay) and relayed copy (g1, g2) | Relay KO drop / HaX relay | g1 at Relay KO | yes |
| Hall 2 and plant-room doors | cards above | RFID readers | - | yes |
| `bms_jump_server-flag1..4` | `<flag:1..4>` | VM launcher shows IP 192.168.100.10, but standalone has no VM | - | **no**. Prerequisites (workshop reached, launcher terminal, drop-site terminal) were reached. Flags were session-supplied, not earned. |
| Voltage stance | n/a | dialogue | - | n/a |

Rows marked no are the boundary of the proof. Flag-to-task wiring, aim completion, ESD authorisation and conclusion were exercised, not tested against real VM flags. Flags not earned: all four (1, 2, 3, 4). There were no PINs on this route.

## Priorities

| # | Result | Evidence |
| --- | --- | --- |
| 1 Critical path to completed | PASS with caveats (needs teleports because of D1) | DB: status=completed, mission_concluded_at set 18:35:23. Four flag tasks completed with `flag_station_dropsite:bms_jump_server-flagN` targets. Debrief played, credits up. |
| 2 Keycards | PARTIAL / FAIL | Vance gives no card on either route (D2). Cipher drop failed (D3). Relay physical drop worked once in g1 and was picked up, failed in g2. HaX relayed copy arrived every time and opened workshop and plant room. Spare in locker works. |
| 3 ESD gate | PASS | Before VM work (g1, and g2 with nothing done) the minigame showed the "Three things first" text and the ESD button `disabled:true`. After flag 3 set `attack_mechanism_known`, `esd_authorized` became true; guard flip, button and confirm worked, `mission_complete` set. Minor: text is identical regardless of what is already done (D6). |
| 4 Timers | PASS | No timer on thermometer (g1 18:14:12). Both started at `attack_mechanism_known` (18:21:47). Advisory (`hydrogen_alarm`, urgency 3) seen between 18:27:45 and 18:28:00 (6:00). Vent (`racks_vented`, `casualties_occurred`, urgency 4) between 18:33:42 and 18:33:57 (12:00). Countdown "H2 ADVISORY 05:39" shown on screen. ESD still pressable after vent, run concluded. |
| 5 Voltage stances | FAIL for escape, PASS for arrest | Escape: `voltage_escaped` set, `confront_voltage` completed, but Voltage was still in the room, talkable, and debugKO then set `voltage_captured` too (D4). Debrief then said "Voltage is in custody" / "interrogation has already begun" alongside the escape. Credits text not distinguishable in the DOM I read. Arrest (g2): `voltage_captured`+`voltage_neutralised`, hub re-talk fine. Fight stance not tried (KO'd via escape contamination only). |
| 6 Re-talks | PASS with notes | Guard (g1): second and third approach gave a menu hub, no intro replay, no End of conversation. Vance (g1, after ally route): hub with "What should I be doing right now?", no replay. Voltage captured hub (g2) loops. Static becomes hostile after one talk (by design) and hit me from 100 to 10 HP within seconds. Cipher/Relay were never talked to before KO. |
| 7 Unexpected | see defects | |

## Defects

**D1 (blocker). scada_control_room -> battery_hall_1 door cannot be walked through.** Repro: operations_office east door, into scada, interact with south door (592,416) (opens, `door_unlocked`), then `enter battery_hall_1` -> `did-not-cross`; walking down stops at y=404. Evidence: log game 1 around seq 280-330, screenshot `m04-pass2-shot-scada-door.png`. Rooms data: scada pos (320,256), hall1 pos (320,384), hall1 north door sprite at (912,416) while scada door is at (592,416); hall1 wall tiles at x 560-624, y 424-440 are collidable. scada is `room_control_1x2gu` (10 tiles wide), hall is `room_battery_hall` (20 wide); `positionSouthSingle` left-aligns them, so the two doors are 320px apart. Suspect layout data (not an engine bug). Without a teleport the mission cannot be completed. The validator reported geometry OK.

**D2. Vance never hands over the Level 1 card (both routes).** Repro: ally route (g1) and cover route (g2): choices through to `chen_commits_to_helping` / `chen_provides_access`; the line "Here, take my facility keycard" plays, `chen_provided_keycard` becomes true, inventory does not gain a card. `NPCGameBridge.actionLog` length 0 (giveItem never called), Vance still holds the card in `itemsHeld`. Suspect engine tag handling or tag placement (the `#give_item:keycard` tag sits inside a `{not chen_provided_keycard: ...}` block, no selector). Since the global is already set, the `vance_hub` "I still need a keycard" safety net never appears; the only Level 1 source left is the locker. Evidence: g1 log after the Vance conversation (seq ~150-160), g2 end of Vance conversation.

**D3. Physical keycard drop unreliable on KO.** Cipher (g1, g2) and Relay (g2): `npc._sprite` false before KO, no dropped object, `itemsHeld` unchanged. Relay in g1 dropped Master (`dropped_operative_relay_0_...`). All KOs were `debugKO` and arrivals partly by teleport, so this is confounded; real combat was not tested. HaX relay of a copy worked in all four KOs, so the mission stays finishable. HaX's own line on Cipher says "his Level 2 card should be on him" while the card was not on him.

**D4. Escape stance does not remove Voltage.** `#remove_npc` after "I'll be somewhere else..." did not fire (same tag-with-NPC-context pattern as D2; `#complete_task` in the same knot did fire). Voltage stays at (1504,842) and re-opens `voltage_escape_success`. debugKO afterwards set `voltage_captured=true` while `voltage_escaped=true`, so the `voltage_escaped !== true` guard on `npc_ko:voltage` did not stop it. The debrief also offered "Voltage is in custody" (HaX: "interrogation has already begun") in that game. The player cannot be punched in practice only if the real combat path is also guarded, which I did not test.

**D5. Stop-the-runaway aim and its tasks open before `map_the_attack` completes.** After the Relay KO (g1, before any flag) the open tasks already included `confront_voltage`, `disable_attack_vectors`, `report_to_0x99` and the objectives panel showed "Stop the Thermal Runaway" active. The walkthrough says it unlocks after `map_the_attack`. The ESD gate still holds, so this is ordering/doc, not a soft lock.

**D6. ESD refusal text does not track progress.** It always lists all three requirements (thermal, OT network, "the man behind you") even when two are done, and still mentions the man behind you after he has escaped (g1).

**D7 (minor). Optional tasks never tick.** `scan_scada_network`, `investigate_compromised_services`, `exploit_distcc_vulnerability` stay open after their flags are submitted (g1 brief after flag 2 and after flag 4). Walkthrough calls them optional progress flavour.

**D8 (minor). `enter battery_hall_2` fails from hall 1.** The `battery_hall_1_notes_3` BESS Process Diagram sits in front of the east door at (925,465); `enter` returns did-not-cross and walking at y 465 is blocked. Walking at y 428-440 passes. Screenshot `m04-pass2-shot-hall1-east.png`.

**D9 (minor). Dropped Master Keycard sits among racks** (1391,515 in hall 2). The approach from the north at y 475 stops 41px away (outside the 32px gather range). It was reachable via pointer move from the south side.

Observations that are not defects: a phone-chat with HaX opens automatically after each operative KO (no overlap with a conversation was seen); the debrief and credits ran; the interact harness flagged `mismatch` on the ESD (object name vs minigame title), which is benign.

## Not tested
Fight stance via real combat; real combat at all; Static KO drop; bark overlap with conversations under real pacing; credits variant text (ESCAPED / CAPTURED / COSTLY) was not located in the DOM text I read; operative re-talk before KO; HaX/Vance phone hubs beyond the auto relays.
