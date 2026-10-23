# m04 pass-3c playtest: focused confirmation (vance_* rename, phone, clone, race telegraph, debrief)

Question answered: plumbing (confirmation of seven specific fixes). Not a solvability pass: VM flags were session-supplied `<flag:N>`, the Hall 1 fingerprint was faked, Relay and Voltage were `debugKO`'d, the OptiGrid case lock used `completeLockpick`.

Games and logs (headless, Sonnet-style driving, one command at a time):

| Game | Id | Purpose | Session log | Result |
|---|---|---|---|---|
| A | 1241 | Checks 1-6, full run to ending | `tools/playtest/m04-pass3c-session.jsonl` (970 lines) | status=completed, mission_concluded_at 2026-10-01 12:09:01 UTC |
| B | 1244 | Check 7, 12-minute vent then Voltage | `tools/playtest/m04-pass3c-game2-session.jsonl` (320 lines) | in_progress (not meant to conclude) |

Screenshots: `m04-pass3c-roundpanel.png` (check 4), `m04-pass3c-credits.png` (credits overlay, game A), `m04-pass3c-voltage-postvent.png` (game B, taken after the Voltage conversation closed, so it only shows the world).

Evidence capture beyond `brief`: `eval` hooks installed in the page. A 100 ms poller on `window.npcManager.conversationHistory` stamped every new phone/history entry (`window.__hl`); listeners on `eventDispatcher` and a MutationObserver stamped `conversation_closed:voltage`, `npc_hostile_state_changed`, and the on-screen toast (`window.__ev`). Both are in the session log as `eval` commands and results.

## verify-run.rb output

Game 1241 (after `session-stop.sh`):
```
game            1241  (mission 48)
created         2026-10-01 11:56:44 UTC
last write      2026-10-01 12:09:11 UTC
played for      746s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit, OptiGrid Job Card #4782 (back page), Maintenance Work Orders
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_ab301b}, ..._2_1d2100}, ..._3_5dd483}, ..._4_c40a85}
globals set     28: anomaly_detected, attack_mechanism_known, attack_prevented, briefing_played, debrief_ready, disclosure_choice, distcc_guide_offered, esd_authorized, evidence_maintenance_logs_found, fingerprint_kit_found, mission_complete, operative_relay_defeated, plant_reader_seen, player_name, privesc_guide_offered, recon_guide_offered, remote_trigger_disabled, rfid_guide_offered, server_room_reached, vance_is_ally, vance_met, vance_phone_available, vance_provided_keycard, voltage_captured, voltage_fight_started, voltage_ko, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```
Server record: `BreakEscape::Game.find(1241)` status "completed", mission_concluded_at 12:09:01 UTC. `missionEnd` read `creditsShowing: true, closable: false`.

Game 1244:
```
game            1244  (mission 48)
played for      859s of wall clock
unlocked rooms  6: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, plant_room
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad
globals set     11: attack_mechanism_known, briefing_played, casualties_occurred, disclosure_choice, hydrogen_alarm, plant_reader_seen, player_name, racks_vented, rfid_guide_offered, vance_met, vance_provided_keycard
VERDICT: progress recorded — 5 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Vance's Level 1 card (A) | cloner, Saved > Level 1 > Emulate | Vance in person, ally route ("I'll need into the halls"), real RFID read and Save | game A, ops office | yes |
| Vance's Level 1 card (B) | same | Vance cover route (lean in), real read and Save | game B, ops office | yes |
| Workshop Level 2 card | "Workshop Keycard (relayed copy)" | Relay `debugKO`, then HaX phone relays it | game A, Hall 2 | **assisted** (KO shortcut; the card itself came from the designed HaX message) |
| OptiGrid Tool Case | picked | `completeLockpick` | game A workshop | **assisted** |
| Vance's print | `{owner:"Robert Vance", quality:0.8}` pushed into `gameState.biometricSamples` | Job card names the Hall 1 panel; I did not dust it | game A and B, before plant door | **no, assisted** (the panel dusting was not played this pass) |
| `bms_jump_server:flag_1..4` | `<flag:1>`..`<flag:4>` | VM work, not possible standalone | game A, workshop drop-site | **no** |
| `attack_mechanism_known` (A) | earned | flags, Hall 1 thermometer (`anomaly_detected`), Maintenance Work Orders (`evidence_maintenance_logs_found`) | game A | yes (flags themselves not earned) |
| `attack_mechanism_known` (B) | emitted via `eval` | not earned | game B | **no, assisted** (only used to start the 12-minute vent clock) |
| Plant door | biometric | fake print above | game A, B | consequence of the "no" row |

Rows marked "no": the flag steps, the print and game B's attack_mechanism_known were exercised, not tested. Everything downstream of the flags is unproven for solvability. Real combat was not played (Relay, Voltage KO'd with `debugKO`; Static was never fought).

## Check results

1. **Vance's phone before and after allying: PASS.**
   - Before: in game A, after the guard conversation, opened the phone (`interactInventory("phone")`), contact "Robert Vance — No messages yet", opened it: the only text is the choice "(He's at the ops desk. Talk to him there.)" with no NPC line (session log, seq near 30-40 of game A). Closed it.
   - Ally in person: guard (state regulator), Vance "There have been concerns...", "Actually, I should be frank...", "You deserve the truth. ENTROPY operatives...", "Completely serious", "Our intelligence shows...". `vance_is_ally` set mid-talk.
   - After: `vance_phone_available` set when the conversation closed; his text arrived ("It's Vance. I'm staying on the ops desk with the historian up..."). Reopened the Robert Vance contact: "Robert Vance: Agent. I'm on the ops desk with both screens up." and the hub choices (charge-control systems, disable the attack safely, what to prioritise, how urgent, that's everything for now). Asked the charge-control question; the answer played.

2. **Ally-route clone with cancel: PASS.**
   - After "I'll need into the halls." the narrator line "You hold the cloner up to his lanyard." then the RFID flipper opened (Reading 1/2, ASK PSK). Pressed Cancel before Save: narrator "The cloner didn't get a clean read." then choices "1. Try again." / "2. Right. Going." So the clone option comes back.
   - "Try again." reopened the minigame, EM4100 FC 103 card 46439, Save. Narrator "The cloner buzzes once. Old prox..."; `vance_provided_keycard` set; Vance "That's uncomfortably easy. We were meant to replace those readers this year."
   - Hall 2 door (`lockType rfid`, requires `facility_keycard_level1`): flipper Saved > Level 1 Facility Card > Emulate. Door opened, entered `battery_hall_2` (needed `moveTo` plus `walk right`; `enter` reported `did-not-cross`, known harness quirk).
   - No text during the minigame: the history poller stamped nothing between the Cancel and the clone Save. HaX's RFID guide text (t=178007) and Vance's text (t=173999) both landed after the conversation closed (`rfid_guide_offered`, `vance_phone_available` appear only in globals read after close). Also game B (cover route) cloned cleanly with the same result.
   - Note: the narrator line is a single beat before the reader opens; I did not see a separate pre-minigame toast.

3. **HaX phone history, no duplicates: PASS (one side observation).** Before the check I had held two Vance phone conversations (before and after allying, one question answered), HaX relay text, the RFID/vuln/recon/distcc/privesc guide barks, picked up the tool case items and kit, opened the Hall 2 and workshop doors, set `anomaly_detected`, `evidence_maintenance_logs_found`, `attack_mechanism_known`. Reopened HaX: 14 entries, every line unique (Python Counter over the text, `DUPES: []`). The history Map for `agent_0x99` also had no repeats (5 entries at the Relay point, one per call). Side observation: `npcManager.conversationHistory` contains an extra Map entry keyed `undefined` (typeof undefined) holding 4 copies of HaX's first four messages, created when the phone auto-opened for the Relay card message (t=380201 in the page clock). It does not render, so no player-visible duplicate, but it is a stray key.

4. **Duty Round Panel renders inside Hall 1: PASS.** `m04-pass3c-roundpanel.png`: a computer sprite (`hall1_round_panel`, texture `pc`, 28x23, visible/active, alpha 1, depth 503.5) at (832, 480) stands on the floor in the middle of the hall, below the rack rows, in the open. `moveToNear` stopped at 51 px (plain range 32), same short-stop as pass 3a; not a player problem. The panel was not dusted this pass.

5. **Race telegraph timing: PASS.** Game A, plant room. Stamps from the page clock (ms): `npc_hostile_state_changed(voltage)` 648612 (mid-conversation, minigame still open), `conversation_closed:voltage` 649245, toast "He's going for the laptop. Drop him." on screen 651006, with no minigame open (`mg: null`) and the history entry for HaX at 651007. So the toast came 1.76 s after the conversation closed, never while it was open. HUD then read `VOLTAGE — THE LAPTOP / 00:20`. `debugKO voltage` then returned the HUD to `H₂ ADVISORY — RACK BANK B / 03:52`.

6. **Completed game, debrief speaker: PASS.** Game A reached status=completed (see verify). In the debrief (`agent_0x99_debrief`), the person-chat DOM `person-chat-speaker-name` read "Robert Vance" for all of Vance's lines: "The public backlash will be severe. But I understand the reasoning.", "You did good work here.", "This facility won't forget it.", "This facility's been operating on hope and duct tape for too long.", "That changes now. I'll make sure of it." (portrait section class `speaker-npc:Robert Vance`). Agent HaX lines read "Agent HaX". Evidence is DOM text per line in the session log (eval results after each continue), not a screenshot. Credits opened (`creditsShowing: true, closable: false`), screenshot `m04-pass3c-credits.png`. Note the closing debrief for the intact ending has no "Voltage is in custody" requirement beyond choice 2 (not tested; I chose option 1 each time).

7. **After the 12-minute vent, Voltage's line: PASS.** Game B: `attack_mechanism_known` emitted at 12:03:01 UTC (assisted); `hydrogen_alarm` set at about 6 min; `racks_vented` true at 12:15:04 UTC (12:02 after emit; `vented_by_trigger` false, `casualties_occurred` set). First talk to Voltage, line: "Bank B's already gone. One keystroke and A and C follow it, the hall burns, and 240,000 people lose power by n[oon]." (not "The racks go critical..."). The stance then offers the two options ("I'm taking you down. Now." / "Go for the button and let him run."). Fight not started in game B. His opener was "Sneaky approach. I respect that." versus game A's "You got past my people." (presumably stealth/relay-dependent variation).

## Defects and observations (not classified)

- O1: `conversationHistory` stray key `undefined` (check 3). Repro: game A, let the phone auto-open for Relay's card message; eval `[...window.npcManager.conversationHistory.keys()]`.
- O2: HUD stale label after the 12-minute clock: `H₂ Advisory — rack bank B00:01` stays (also pass-3b D2). Seen in game B before the vent.
- O3: `esd_pushbutton` `interact` returned a "not a pass" disambiguation result (ESD overlay still opened when I then clicked `#esd-guard`); harness mismatch, Voltage and the button sit within 32 px of the player there.
- O4: Vance's early timed text "It's Vance again. I pulled the rack trends..." (20 s after `vance_phone_available`) arrives before the player has spoken to him by phone, so "again" follows immediately after his first text and four more lines of his phone hub; reads slightly quick but not wrong.
- Harness: `enter` after an unlocked door vanishes reports `did-not-cross`/`no-known-doorway` but `moveTo` + `walk` works; `moveToNear` short-stops at the tool case and round panel (51 px, plain range 32). `interact voltage` needed `moveTo(1480,700)` first.
- Not tested: Hall 1 panel dusting, the Static fight, real combat/race loss, arrest ending debrief.

## Status
Game 1241 status=completed. Game 1244 in_progress. Both sessions stopped with `session-stop.sh`; flags XMLs: `tools/playtest/m04_critical_failure-flags-game1241.xml`, `...-game1244.xml` (values substituted: 4 flags used in A, 0 in B).
