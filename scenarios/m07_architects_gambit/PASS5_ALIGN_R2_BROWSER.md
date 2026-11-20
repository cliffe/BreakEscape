# m07 pass 5, alignment round 2: browser check

Date 2026-10-14. Keyless server :3001 (already up; :3000 untouched). Headless (load average about 17, so headed was not an option), speed fast. Regression run, not blind: it answers the plumbing question for the round-2 fixes and nothing else. Step sources: the "Stage 2 alignment, round 2" section of `IMPROVEMENT_LOOP_LOG.md` ("Open after round 2" list), `PASS5_ALIGN_R1_BROWSER.md` for the driving method, and `TESTING_WALKTHROUGH.md`. No SecGen XML and none of the four restricted guides were opened. No mission file was edited and nothing was committed. Both sessions were stopped.

| Game | Route | Session log | Flags XML | Wall clock |
|---|---|---|---|---|
| **2409** | Fracture; Hollis backed off, re-sighted, talked round; decode read; deduction made, redirect not asked for; one page reload; generator hall; Park three visits (third hostile); door before login; flags 3 and 4; Mercer; abort; debrief with the "I want the numbers" stance | `tools/playtest/m07-pass5-align-r2-browser-game2409.jsonl` (1031 commands) | `tools/playtest/m07_architects_gambit-flags-game2409.xml` | 591 s |
| **2414** | Meltdown; Hollis talked round; decode read with the window open and never deduced; timers shifted twice; Architect call opened after minute 40 with no login; Park talked down with the projection; flags 3 and 4; debrief with the "I made the call" stance | `tools/playtest/m07-pass5-align-r2-browser-game2414.jsonl` (831 commands) | `tools/playtest/m07_architects_gambit-flags-game2414.xml` | 367 s |

Screenshots (session scratchpad `m07-align-r2-browser/`): `01_generator_aim.png`, `02_park_third.png`, `02b_ko.png`, `03_t10_after_40.png`, `04_deduction_menu.png`, `06_hollis_resight.png`.

Counts: **0 blockers, 1 major, 2 minors** (new, all in code or text this round did not touch), plus observations. All six owed items pass.

## verify-run.rb (pasted)

Game 2409:

```
game            2409  (mission 51)
created         2026-10-13 23:43:17 UTC
last write      2026-10-13 23:53:08 UTC
played for      591s of wall clock
current room    "security_checkpoint"
unlocked rooms  6: security_checkpoint, operations_floor, server_room, generator_room, cable_vault, scada_control
unlocked objs   1: crisis_control_system
inventory       12: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Threat Desk Summary -- Tasking 02:41 PT, Notepad, Shift Handover Sheet, Plant Maintenance Key, Facility Access Badge -- Server Zone, Coordination Schedule -- Relay Decode, Listener Capture -- Operator Credentials, Sequence Abort Confirmation
NPCs met        8: opening_briefing_cutscene, agent_0x99, ray_hollis, the_architect, closing_debrief, elena_rodriguez, thomas_park, james_mercer
flags submitted 4: flag{..._scada_attack_host_1_10132f}, ..._2_536a6e, ..._3_ddf0f1, ..._4_398bae
globals set     47: ... (incl. decode_read_open, found_coordination_traffic, park_resolved, hollis_resolved, grid_saved, debrief_played, mission_complete)

VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Game 2414:

```
game            2414  (mission 51)
created         2026-10-13 23:54:49 UTC
last write      2026-10-14 00:00:56 UTC
played for      367s of wall clock
current room    "security_checkpoint"
unlocked rooms  6: security_checkpoint, operations_floor, server_room, scada_control, generator_room, cable_vault
unlocked objs   1: crisis_control_system
inventory       13: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Threat Desk Summary -- Tasking 02:41 PT, Notepad, Shift Handover Sheet, Plant Maintenance Key, Facility Access Badge -- Server Zone, Coordination Schedule -- Relay Decode, Listener Capture -- Operator Credentials, Signed Casualty Projection, Sequence Abort Confirmation
NPCs met        8: opening_briefing_cutscene, agent_0x99, ray_hollis, the_architect, closing_debrief, elena_rodriguez, james_mercer, thomas_park
flags submitted 4: flag{..._scada_attack_host_1_4b1c64}, ..._2_3d31e4, ..._3_e23216, ..._4_3e1699
globals set     47: ... (incl. decode_read_open, found_coordination_traffic, casualty_projection_found, park_resolved, hollis_resolved, grid_saved, debrief_played)

VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

("Current room security_checkpoint" is the known reload respawn.)

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Plant Maintenance Key | (item) | ops-floor supervisor's tray | before the generator door, both games | yes |
| Server-zone badge | (item) | Hollis, talked round with the Shift Handover Sheet's print-history line ("You renewed Mercer's credentials on the sixteenth of June. Your login.") | after the sheet was read, both games | yes |
| Vault keypad PIN | `4703` | ATS-1 plate on the transfer switch in the generator hall: "The rating plate riveted to the door reads ATS-1, S/N 0098-4703." (also Hollis's tip: "He read the number off the plate on the transfer switch.") | read before the keypad, both games | yes |
| Control-room door password | `CascadeWindow19` | Listener Capture (flag 2 reward), opened and read before typing | after flag 2, both games | yes for the item; flag 2 itself is supplied |
| Casualty projection (for Park) | (item) | Signed Casualty Projection on Mercer's console, control room | game 2414, before the vault | yes |
| `scada_attack_host:flag_1` to `flag_4` | `<flag:1>` to `<flag:4>` | the VM challenge | submitted at the relay | **no, flags supplied** |

Flag steps are **exercised, not earned**, and so is everything downstream of each flag (the decode, Listener Capture, the door password, the cascade clock, the console unlock). Also **exercised, not earned**: the clock shifts in game 2414 (item 3), set through `scenarioTimerDispatcher._timerStartTimes` to 30.9 minutes then 40.9 minutes after the commit. A real 40-minute wait was not reachable in a 6-minute run. Not played: Elena (never spoken to), the Contractor Badge Station route, the redirect itself, Park knocked out by the player, Hollis hostile or KO'd, the Architect's other T-10 rows.

## Results per owed item

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | Generator hall no longer completes or folds the former "(Optional)" aim | **PASS** | Before entering (game 2409, objectives panel text): "Trace How They Got In ... Get into the backup generator hall* / Work out the plant keypad code* / Deal with whoever is working the trunk runs / Find how the intrusion reached the breakers / Bring back whatever they printed and left behind down there (0/2)". There is no "(Optional)" in the title and both gate tasks carry the required `*`. After the key opened the door and the hall was entered (`generator_hall_reached` true), the aim stayed expanded and open: only "Get into the backup generator hall" ticked (and lost its `*`); "Work out the plant keypad code*" and the other three stayed unticked and the group did not complete or fold. Screenshot `01_generator_aim.png`. In R1 these showed as "(opt)" |
| 2 | Park: third visit hostile; talked-down and/or KO outcome | **PASS** for hostile (game 2409) and talked down (game 2414). Player-delivered KO of Park not exercised | **Game 2409.** First visit (entry chat, no projection): "He is kneeling at an open junction box on the control run to the transfer switch. He doesn't stop working." / "Four minutes and I'd have been out. Four." Chose "Nothing. I was never here." Second: "He is still at the junction box, working faster. His flashlight finds the door before you're through it." / "Second time. There isn't a third." Third: "He sets the wire down on the mat without looking round." / "I said there wasn't a third." / "He comes up off his knees with the crimping tool swinging." No choices were offered and no "Right." line; `park_resolved` was `ko` (the hostile marker), HP dropped to 80 at once. The credit read "THOMAS PARK: Fought off, not stopped — finished the cut and walked out" and the debrief "Thomas Park came at you in the vault, and you left him to it. He finished the cut and was gone before the police got down there." HaX's projection hint reached the thread in this game before the vault: "That'll be their plant man. He was briefed on a building, not a body count. Mercer's signed projection is in the control room. Show him that." **Game 2414.** With the projection read first, the entry chat offered a new option ("Read this. It's the projection for what you're covering."); "You've got four minutes. Spend them walking out." gave "He lays the wire down on the mat and puts his hands on his knees." / "I'm not helping you. Put that on record. I'm just not doing this one." / "The north trunk run's tapped. Months ago. Not me." / "He picks up his bag and walks out past you, unhurried." `park_resolved` = `talked`; credit "THOMAS PARK: Talked — the transfer switch was left intact"; debrief "Thomas Park walked out of the vault into the police cordon. He has given his name and nothing else. He left the switch alone." Screenshot `02_park_third.png`. See N2 for what hostile Park then did |
| 3 | T-10 call opened after minute 40 with no login | **PASS (clock shifted: exercised, not earned)** | Game 2414. Team on Meltdown, decode read, no login. Shifted the four team timers to 30.9 minutes: `architect_t20_played` and `architect_t10_played` set, calls left unopened. Shifted to 40.9 minutes: `redirect_window_closed` true, `cascade_armed` false, `flag3_submitted` false. Then opened the Architect's thread: "A word, Agent 0x00." / "Ten minutes before your team is too committed to move, Agent 0x00." / "Your screen wakes on its own. Nothing else on it moves." / **"Forty minutes. Your team is committed now, wherever you left it."** / "Stop this, and something else fails. Someone else dies. You simply won't be in the room for it." Choices: "Then I'll be in this one." / "You're not as clever as you sound." No "You logged in" line anywhere in the thread. Screenshot `03_t10_after_40.png`. Read in order, the stale "Ten minutes before your team is too committed" bark sits directly above the "Forty minutes" line because the bark was delivered at minute 30 and the call opened later; it reads as intended (the warning, then the verdict) and is noted only so nobody mistakes it for a duplicate |
| 4 | Phone deduction menu offers field names only | **PASS** | Game 2409. After "Their schedule doesn't match our brief." the operation menu (Fracture. Washington. / Trojan Horse. Austin. / Meltdown. San Francisco. / Never mind...), then, after Trojan Horse: "Austin. What's wrong with it?" with the choices "The dormancy." / "The manifest." / "The key count." / "The site." / "Never mind. I'll read it again." No value text in any choice. A wrong first pick (Fracture) gave "That isn't what I'm reading. Look again." and the menu came back. "The dormancy." gave "Yes. Nine days, and dispatch on the manifest. Austin was briefed low on purpose." / "One authority signing for all four. One operation wearing four coats." / "That's grounds to move the team. The window's open until they're too committed, or until you log in on their host. Whichever comes first." The hub then offered "Those numbers were understated. I want the team moved to Trojan Horse." (not taken). Screenshot `04_deduction_menu.png` |
| 5 | A debrief branch not seen before; credits match | **PASS (two branches)** | **Game 2414, decode read, deduction never made** (team on Meltdown, window shut by time). Netherton: "One note from analysis, added an hour ago. The Trojan Horse projection was wrong, in the direction that made it easy to set aside." / **"Their own schedule was in your hands tonight. The Austin row said nine days. Nobody put it next to the brief."** HaX, after the dispatch paragraph: "It was in your hands. Nine days, in their own table." The old "Two copies. Nobody read them." did not play. Credits (read from `#bv-cr-label`): "PROJECTION UNCHALLENGED: Their schedule was read; the Austin row was never put against the brief", under "TACTICAL TEAM: Operation Meltdown — 4,200 hospitals ran a normal night". They match the debrief. **Game 2409, correction found with the window open and the team left on Fracture, then the stance "I want the numbers before he writes them. Next time."** Netherton: "Your field notes say the Trojan Horse projection was understated. Nine days, not ninety, and dispatch on the manifest." / "The team was not moved on it." HaX: "I logged it. You found the thing that was built not to be found. That's the part I'd keep." / "The team not moving is a separate sentence. I won't pretend otherwise." After the stance: "Yes. You had one of his numbers in your hands tonight. Next time it moves the team." and the handoff "You finished it, Agent. I will write the rest myself." (no "Almost nobody gets there this quickly", no "Above expectations": the round-1 N1 fix works). Credits: "PROJECTION CORRECTED: Trojan Horse dormancy nine days, not ninety — EHR and dispatch keys on the manifest" / "CORRECTION FOUND WITH THE WINDOW OPEN: the team was not moved" / "AGENT 0x00: Wants the numbers before he writes them — no more briefing off his figures". Round-1 N2 also confirmed: "DR. JAMES MERCER (BLACKOUT): Left before the cordon closed — no trace". The found-late branch ("Their schedule was in your hands with the window open...") and the informed-commit branches were not played here (routes r9 to r11 cover them in ink) |
| 6 | Hollis re-sighting line | **PASS** | Game 2409. Sight challenge: "Building's been evacuated forty minutes. So you're lost, or you're the other thing." Chose "Back off. I'm leaving." ("Yeah. Thought so."). Re-entering the checkpoint from the ops floor: "He is jumpier now. The flashlight comes up fast, and this time it finds you." / **"There you are. I knew something was in here."** with five choices including "You renewed Mercer's credentials on the sixteenth of June. Your login." Screenshot `06_hollis_resight.png`. Game 2414 played the same two sightings and reached the same line |
| R | Mid-mission page reload | **PASS** | Game 2409, after the deduction (sync, `location.reload()`, Enter key event on the title screen, then `mg close` on the Mission Brief notes): inventory held (decode, badge, key), `hollis_resolved` talked, `projection_revised` and `revision_found_open` true, `team_assignment` fracture, no briefing or deduction replay, the HUD readout resumed at "TEAM REDIRECT WINDOW 37:16". A second restart came after the KNOCKED OUT screen (see N2): inventory, `flag2_submitted`, `park_resolved` and the window HUD (34:30) held |

## New findings

| # | Severity | Finding | Evidence |
|---|---|---|---|
| N1 | **major** (pre-existing, outside round 2; dialogue stage) | The debrief contradicts what Hollis did on the only route that sets `hollis_resolved = "talked"`. Netherton says "Ray Hollis walked to the muster point and waited for the police. He is giving a full statement, payment included. / He did not have to wait." In the conversation Hollis refuses ("I'm not saying anything to anybody. Don't ask me that again."), the player's option is "Your badge. Server zone. Then you go, and you keep going.", and he "goes out through the muster door and doesn't look back." The "wait here for the police" option only leads to `deal_refused`, then either the fight or back to `deal_take`. The credit "RAY HOLLIS: Talked, and handed over the zone badge" is correct; only the debrief line is wrong. `m07_closing_debrief.ink` line 428 against `m07_npc_ray_hollis.ink` `deal` / `deal_take` | Debrief read-out, both games (`A_debrief_1.txt`, `B_debrief_1.txt` in the scratchpad), game 2409 and 2414 logs |
| N2 | minor (design call for the orchestrator) | Hostile Park pursues the player out of the vault through the generator hall and the server hall and knocks them out within about a minute. In game 2409 the player, after the third visit, walked to the server hall, did flag 2 and the control-room door, and was on the "KNOCKED OUT" screen (Restart / Main Menu) at the door with HP 0 (HP was 80 straight after the swing). A player who flees, as the "Nothing. I was never here." pattern invites, has no way to shake him except punching him. This is the engine's standard hostile chase, and `park_resolved = "ko"` with the "Fought off, not stopped" credit is the designed ending, so it is not a plumbing fault. Restart works and the debrief and credits then read correctly | Game 2409 log, third Park visit to the KO screen; screenshot `02b_ko.png` |
| N3 | minor | A player who read the decode with the window open, never made the deduction, and answered "I made the call on the numbers I had" gets "Good. That answer will stand up in any review room you ever sit in." and "Above expectations, Agent. I do not say that often..." straight after "Their own schedule was in your hands tonight... Nobody put it next to the brief." The N1 gate looks at `revision_found_open` only, so the praise is still given on this path. The line before it ("It is also the predictable answer. Predictable is what he was shopping for tonight.") softens it. Dialogue stage item | Game 2414 debrief, `B_debrief_2.txt` |

## Observations (no action needed)

- **Harness:** `mg getState().text` for a phone thread is cut at about 2,000 characters; the DOM bubbles are complete (as R1 N3). The `thread` reads for the HaX chat after `clickText` sometimes returned "no chat" because the phone had closed; the state text was used instead.
- After the abort HaX's hub still lists "Can I still move the team to Trojan Horse?"; this is the documented refusal path ("Redirect asked after the abort") and was not selected.

## Needs checking against SecGen by the user

Unchanged from R1: the three-doors description in the debrief ("Their backup server shared its coordination file with anyone who asked. Its listener read the operator's password to anyone who connected. And that account could make itself root."), the "ATTACK HOST" credit, the one-host wording, the CyBOK NS/OSV keywords (U3), and whether flag 4 can be reached before flag 3. I did not check any of it.

## Not covered by this run (owed to later rounds)

Park knocked out by the player (the fight itself); Hollis hostile and KO'd; the redirect itself; the "found late" debrief block (`decode_read_open` plus a late deduction) and the informed-commit branches (r9 to r11 cover them in ink only); the T-10 rows other than the time-shut one; the Elena turn path.
