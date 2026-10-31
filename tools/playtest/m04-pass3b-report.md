# m04 pass-3b playtest: plant-room confrontation and endings

Question answered: plumbing plus unexpected behaviour (reload, KO, wrong order). Not solvability: the VM flags were session-supplied (`<flag:N>`, standalone), so every flag row is "no" in the earned-secrets sense. Source for expectations: `TESTING_WALKTHROUGH.md` checks (g1)-(g4) and Aim 4b/5. Headless, fresh game each time.

Combat was never played. Hostile Voltage/Static were KO'd with `debugKO` (assisted). Player KO used `window.playerHealth.damage(1000)` via `eval` (assisted). Both are logged.

## Games and logs

| Game | Id | Purpose | Session log | Result |
|---|---|---|---|---|
| 1 | 1224 | Fight, KO inside the race, full ending | `m04-pass3b-game1-session.jsonl` | PASS (race), debrief PASS, credits NOT SHOWN (see D1) |
| 2 | 1227 | Fight, lose the race in-session, ending | `m04-pass3b-game2-session.jsonl` | PASS, credits show the "he reached the laptop" line |
| 3 | 1229 | Reload mid-race, re-talk | `m04-pass3b-game3-session.jsonl` | PASS |
| 3b | 1232 | In-session race loss with a `gameAlert` hook (text capture) | `m04-pass3b-game3b-session.jsonl` | PASS |
| 3c | 1234, 1235 | 1234: race loss again; 1235: KO mid-race then Restart | `m04-pass3b-game3c-session.jsonl` (both games append to this file) | PASS |
| 4 | 1231 | Arrest, Static down | `m04-pass3b-game4-session.jsonl` | PASS |
| 5 | 1228 | 12-minute vent, then fight | `m04-pass3b-game5-session.jsonl` | PASS |

Screenshots: `m04-pass3b-game1-credits.png` (no credits; the world with HaX toasts), `m04-pass3b-game2-credits.png` (credits), `m04-pass3b-game2-race-lost.png`, `m04-pass3b-game3b-racelost.png`, `m04-pass3b-game5-ko.png`.

## verify-run.rb (post-run, all sessions stopped with session-stop.sh)

Game 1224 (full):
```
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, plant_room, engineering_workshop
inventory       6: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Workshop Keycard (relayed copy)
flags submitted 4 (flag_1 .. flag_4 stand-ins)
globals set     22: ... attack_prevented, mission_complete, voltage_captured, voltage_fight_started, voltage_ko, voltage_neutralised ...
VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```
Game 1227 (full):
```
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
flags submitted 4
globals set     28: ... attack_prevented, casualties_occurred, mission_complete, racks_vented, vented_by_trigger, voltage_captured, voltage_fight_started, voltage_ko, voltage_neutralised ...
VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```
Games 1228, 1229, 1231, 1232, 1234, 1235: each `VERDICT: progress recorded — 5 rooms beyond the first, 0 objects unlocked, 0 flags submitted.` (these were not meant to conclude).

Server record: 1224 status=completed, mission_concluded_at 2026-10-01 10:57:20 UTC. 1227 status=completed, mission_concluded_at 11:04:30 UTC. All others in_progress.

## Earned-secrets table (games 1 and 2, the ones that concluded)

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Level 1 Facility Card | cloner card | Vance, cover route (lean in), real RFID clone | before Hall 2 | yes |
| Workshop Keycard (Level 2) | HaX relayed copy | Relay KO (`debugKO`, combat not played) then HaX phone | before workshop | assisted |
| Vance's print | `{owner:"Robert Vance", quality:0.8}` pushed into `gameState.biometricSamples` | not collected (Hall 1 panel and kit skipped; walkthrough console "fake a print") | before plant door | **no, assisted** |
| `bms_jump_server:flag_1..4` | `<flag:1>`..`<flag:4>` | VM work, not possible standalone | drop-site terminal | **no** |
| attack_mechanism_known (game 1) | emitted via eval | normally aim 4 completing | before the race | **no, assisted** (game 2 earned it: workshop flags, thermometer, work orders) |

Everything downstream of the flags and the print was exercised, not tested as a solvability pass. Games 3-5 skipped the flags, the workshop, the print and `attack_mechanism_known` (emitted via eval with `global_variable_changed`, plus `anomaly_detected`), so only the plant-room behaviour in them counts.

## Per-game results

### Game 1 (1224): fight and win the race. PASS (race); see D1 for credits
- Stance: Static up. Voltage: "You genuinely don't get to have both, and I'd think about it quickly." Choices: "I'm taking you down. Now." / "Go for the button and let him run." (no arrest option).
- Before the stance, HUD: `H₂ ADVISORY — RACK BANK B / 04:55`. First read after the conversation closed: `VOLTAGE — THE LAPTOP / 00:22`. The race label is first on the HUD while h2_advisory is also pending. Globals then: voltage_fight_started=true, vented_by_trigger=false, racks_vented=false, voltage_captured=false.
- Telegraph: "He's going for the laptop. Drop him." is in the Agent HaX phone history and as a toast (screenshot game1 credits file shows it was queued among HaX toasts; it appeared in `conversationHistory`).
- `debugKO voltage` at about 00:20 left: HUD returned to `H₂ ADVISORY — RACK BANK B / 04:44`, voltage_captured=true, voltage_neutralised=true, racks_vented=false, vented_by_trigger=false. Race cancelled and the advisory returned.
- Voltage's re-talk after the KO: not possible. A KO'd NPC is not interactable (interact fell through to the ESD button).
- ESD before the arming conditions: "NOT ARMED. Nobody has checked the racks against an instrument that isn't on the BMS bus." (anomaly_detected missing). After `anomaly_detected` + `esd_authorized`: guard flip, button, confirm. attack_prevented, mission_complete set.
- Debrief opener (exactly one Bank B option plus the Voltage option): "1. Shutdown engaged before the racks went. Banks isolated, hall intact." / "2. Voltage is in custody." HaX: "Thermal runaway aborted before a single cell vented..." "Eleven people on site tonight walked out of there. Forty-odd on that feed never knew they were on it." Disclosure choices followed; Vance's thanks ("I appreciate what you did...") is attributed in the harness to "Agent HaX" as speaker (D3).
- Credits: **not shown.** I submitted the four flags after the debrief (my ordering, to make the conclusion gate true). The server then concluded (status=completed 10:57:20) but no `bv-stage` overlay opened (`missionEnd` null, screenshot shows the workshop). The credits trigger is `conversation_closed:agent_0x99_debrief`, which had already fired before the gate was met. This order is not reachable in normal play (ESD needs attack_mechanism_known, which needs the flags), so I count it as an artefact of the assisted route, not a defect. Credits text for the intact ending was therefore not captured; the scenario's own text is `MISSION COMPLETE` / `ALBION ENERGY STORAGE: THERMAL RUNAWAY AVERTED...`.

### Game 2 (1227): fight and lose the race in-session. PASS
- Route here earned `attack_mechanism_known` (flags, Hall 1 thermometer, Maintenance Work Orders), so the H₂ advisory really ran (06:00 at start).
- Race read at 00:24 after the conversation closed, counted down 00:22 ... 00:03, then fired. HUD label after firing: `Voltage — the laptop00:01` (label stays; see D2). Globals after: racks_vented=true, vented_by_trigger=true, voltage_captured=false.
- Player HP: 100, 78, 56, 12, then flat at 12 for the rest of the race (standing, never KO'd).
- Hint text: not captured in this game (my sampling missed the 5 s toast). Captured in game 3b below.
- Finished him with `debugKO` after the race. ESD (armed), debrief opener: "1. He reached the laptop before I reached him. Shutdown held A and C." HaX: "Bank B's gone, but you isolated A and C and forced the vents. It could have been the whole hall. It wasn't." Later: "The banks are isolated, but he got to the laptop before you got to him, and Bank B went with it." "Nine on the night crew in Hall 2. Two more on the feed before the grid caught up."
- Credits (screenshot `m04-pass3b-game2-credits.png`): the scrolling line reads **"RACK BANK B LOST — he reached the laptop"** on the map visualiser. `missionEnd` returned creditsShowing=true, closable=false. Server: status=completed, mission_concluded_at 11:04:30. No "you went down" in `document.body.innerText`.

### Game 3 (1229), 3b (1232), 3c (1234/1235): in-session loss text, reload, KO. PASS
- 3b (hook on `window.gameAlert`): at expiry the alert was captured verbatim, **title "HE REACHED THE LAPTOP", message "Bank B is going. He's still in the plant room, and so is the button. A and C are still yours to save."** `/went down/i` over the page text: false. Same in 3c/1234.
- Reload mid-race (1229, at 00:19; page reload after `sync`, then bootstrap resume): respawned at `main_entrance` hp 100. The race restarted from 25 s on reload (HUD `00:24` then `00:15` on my next read) and fired while I walked back (racks_vented=true, vented_by_trigger=true, same alert text).
- Player KO mid-race (1235, `playerHealth.damage(1000)` at race 00:22): the "KNOCKED OUT" overlay (Restart / Main Menu) appeared and the HUD kept counting during it (00:19, 00:18, 00:16). Restart then bootstrap resume: respawned at `main_entrance`; the race restarted at 00:25 and fired as in the reload case.
- Re-talk with Voltage after walking back (1229 and 1235, both): opens straight on "It's done. You went down, and Bank B went with you." with exactly two choices, **"1. Take him down." and "2. Not yet."**. No button stance. (The "you went down" line is the after-trigger conversation designed for this case, and it is the only place the phrase appeared.)
- "Not yet." works: the line repeats once and the conversation closes; Voltage is not hostile and a re-talk offers the same two choices. "Take him down." starts the fight (player HP 100 to 78), and no second race and no second alert appeared (racks_vented already true). I could not verify the HaX telegraph for the second fight because the reload cleared the client-side phone history; the alert hook shows no new alerts.
- The reload kept the plant door open (biometric unlock persisted) and Hall 2 open.

### Game 4 (1231): arrest with Static down. PASS
- Static `debugKO` first (assisted). Voltage: "Static's down. So it's you, me, and one keystroke." Choices: "I'm taking you down. Now." / "Step away from the bench. You're under arrest." / "Go for the button and let him run."
- Arrest: "Static's down, isn't he." with "1. Blackout signed it. You countersigned. Tell that to a court." / "2. Not yet." "Not yet." returned to the three stances. Court line: "...A court. Fine. A court can have the number too." / "He steps back from the bench with his hands open, and lets you take the laptop off it." Globals: voltage_captured=true, voltage_neutralised=true, voltage_fight_started=false. HUD stayed on the H₂ advisory (04:38): no race, no alert.
- "Last chance. Step away." is gone from `m04_npc_voltage.json` (0 hits). The only remaining match is in an explanatory comment at `m04_npc_voltage.ink:291`.
- Re-talk afterwards: opens on a blank line with "1. Nothing you want to tell me?" / "2. Say nothing."
- Not taken to the debrief (no flags submitted in this game).

### Game 5 (1228): 12-minute vent path. PASS
- `attack_mechanism_known` emitted at 11:06:31. H₂ advisory fired at about 6:00 (hydrogen_alarm=true, HUD label stale: `H₂ Advisory — rack bank B00:01`). `racks_vented` set at 11:18:32 (12:01 after, vented_by_trigger=false).
- Voltage's conversation after the vent is the standard first conversation: "One keystroke and I trigger it now. The racks go critical, the hall burns..." (D4), then the two-button stance.
- Fight: voltage_fight_started=true, racks_vented=true, vented_by_trigger=false, HUD unchanged at the stale H₂ label (no race countdown). Alerts after the stance: only "Task Complete: Confront the cell leader". HaX phone history had no "He's going for the laptop" line. So no race and no telegraph.
- Unexpected: the fight itself KO'd the player some seconds after the 12 s window (HP 100, 78, 34, 12 over about 7 s, then 0 later). "KNOCKED OUT" with Restart/Main Menu; Restart then resume put the player at `main_entrance`. I did not finish this game (no ESD).

## Defects and observations (none classified as engine or scenario faults)

- **D1 (observation, probably an artefact of my order):** Credits did not open when the flags were submitted after the debrief had closed (game 1). The credits trigger is `conversation_closed:agent_0x99_debrief`; the server concluded afterwards. Normal play cannot reach that order. Suspect only if there is another route to the ESD before the four flags (none found). Repro: set attack_mechanism_known via eval, do the fight and ESD, run the debrief, then submit the four flags.
- **D2 (observation):** After the race fires, the HUD keeps `Voltage — the laptop00:01` (or `H₂ Advisory — rack bank B00:01` after that timer fires) as a stale label instead of clearing. Repro: game 2, read the HUD after the race expires.
- **D3 (observation):** In the debrief, Vance's thanks ("I appreciate what you did, even if I don't fully understand it.") reports its `speaker` as "Agent HaX" in `brief().dialogue`. May be a harness attribution; not checked against the ink.
- **D4 (observation, writing):** After bank B vents by the 12-minute clock, Voltage still says "One keystroke and I trigger it now. The racks go critical..." in the first conversation. It reads as stale but is the first-contact line. Repro: game 5.
- **D5 (observation):** Voltage's after-trigger line "You went down, and Bank B went with you." is shown after a reload or Restart (by design) even if the player's HP was full on respawn.
- **D6 (observation, harness):** `moveTo` sometimes reports `via: "pathfinder-direct(offscreen)"` and puts the player in another room (workshop from Hall 2, ops office from the workshop). Treated as assisted movement. Plant-room to Hall 2 also needed manual `moveTo` plus `walk up` since `enter` does not know the reverse doorway.
- Harness note: `converse` was not usable for the Voltage stance; I drove it with `mg choose` patterns.

## Did 25 s feel fair?

I cannot judge it as a fought race, because I used `debugKO`. What I can say from timing:
- The countdown starts at 00:24-00:25 when the conversation closes. In game 1 the debugKO landed at about 00:20 left and the race cancelled cleanly.
- Voltage takes the player from 100 HP to 12 in about 5-7 s (78, 56/34, 12) and then stops hitting for the rest of the 25 s window in four separate games. Standing at 12 HP, I never saw a KO inside the window. In game 5 (no race) the player did go to 0 after the window. So a player who cannot land the KO has little room to try more than once, and a real player has to deal with Voltage's burst in the first seconds. My synthetic input cannot land punches, so whether 25 s is enough depends on how fast Voltage dies to real hits. Someone should time a real fight (ideally against Static up, which also attacks, per the screenshot with two hostile NPCs adjacent).
- Mechanically it is fair: the countdown is visible first on the HUD, the telegraph arrives at the start, and the loss costs bank B only (A and C still savable, ESD still works).

## Status

- status=completed with mission_concluded_at: games 1 (1224) and 2 (1227).
- Games 3, 3b, 3c, 4, 5: not meant to conclude, in_progress.
- Not tested: real combat; the Hall 1 round-panel fingerprint chain (replaced by a fake print); the player KO inside the race via natural damage (forced with `playerHealth.damage`); the intact-ending credits text; the debrief for the arrest ending.
