# m04 pass 5, dialogue cycle 2: browser check

Date 2026-10-13. Keyless server :3001 only (:3000 untouched). Headless (load average 12.8 at the start), speed fast. Targeted run of the cycle 2 changes (commit 29cc8171), plus the cycle 3 additions the coordinator flagged mid-run. It answers question 2 (unexpected behaviour) and the plumbing question. Not blind, not a solvability pass. The do-not-open rule held. All three sessions stopped with `session-stop.sh`; no harness process of mine is left.

## Builds

- Checks 1 to 4 and the Voltage checks ran in games 2224 and 2226 before the cycle 3 commit (131d288f, 16:06 BST) landed.
- Both debriefs (2226 crew-lost, 2229 clean) were opened after `m04_closing_debrief.json` was recompiled (16:02, working tree) and show the cycle 3 text: "Nine. Tell me we came out with something.", "I'm sorry about your people, Mr Vance." / "It's all going in the report. Every line.", and the kit line "Keep the OptiGrid print kit. Forensics can have the case it came in." So the debriefs are the cycle 3 build; the guard, phone and Voltage checks are the cycle 2 text (cycle 3 did not touch them as far as the commit message says).

## Games and logs

| Game | Used for | Session log | Flags XML |
|---|---|---|---|
| 2224 | guard repeat sighting, briefing without the promise (global stays false) | `tools/playtest/m04-pass5-dlg-c2-game2224.jsonl` | `tools/playtest/m04_critical_failure-flags-game2224.xml` (not used) |
| 2226 | briefing promise, HaX gate reply, second admission path, Voltage (number asked, back off, return), real vent by the trigger race, reload, crew-lost debrief | `tools/playtest/m04-pass5-dlg-c2-game2226.jsonl` | `tools/playtest/m04_critical_failure-flags-game2226.xml` (4 flags supplied) |
| 2229 | clean-route debrief, Voltage-first opener | `tools/playtest/m04-pass5-dlg-c2-game2229.jsonl` | `...-game2229.xml` (not used) |

Screenshots (all looked at) are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-p5-dlg-c2-browser/`: 01 guard opener, 02 re-sighting (taken, same background), 03/04 phone at the gate, 05 Voltage choices, 07/08 debrief, 09 Vance. Debrief transcripts: `debrief_crewlost_t1..t10.txt`, `debrief_clean_t1..t6.txt` in the same folder (reproduced below).

## Earned-secrets table

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Level 1 spare card | item | Security Equipment Locker, lock opened with `completeLockpick` (assisted) | yes, lock assisted |
| Level 2 workshop card | cloned | Relay, RFID cloner read during her conversation (quiet clone choice) | yes |
| `bms_jump_server` flags 1 to 4 | `<flag:1>`..`<flag:4>` | the VM work, not possible standalone | **no, flag supplied** |
| Fingerprint kit, Vance's print | lifted | tool case (lock assisted), Hall 1 duty panel, dusting minigame replayed from the 2210 command log | yes (replayed commands) |
| Voltage and Static KO | `debugKO` | combat not played | **no, exercised, not earned** |
| ESD | pressed through DOM clicks | | yes, after `debugKO` made it arm |
| Game 2229 state | every global listed in the next section set by `eval` | | **no, seeded** |

Everything downstream of the two "no" rows is exercised, not tested. The vent in 2226 was real: I chose "I'm taking you down. Now.", did not neutralise Voltage, and the 25 s trigger race fired (`racks_vented`, `crew_lost`, `vented_by_trigger` true). The player was KO'd, "Restart" reloaded the page, and all globals survived the reload.

Game 2229 was seeded by `eval` (guard_admitted, checkpoint_passed, vance_met, vance_spoken, vance_is_ally, vance_trust_level 90, anomaly_detected, attack_mechanism_known, all_flags_in, operative_static_defeated, voltage_neutralised, voltage_captured, plant_room_entered, esd_authorized, promised_voltage_alive, asked_the_number, then attack_prevented with its event). Its debrief proves the text, not the route to it.

## verify-run.rb output

```
game            2224  (mission 48)
unlocked rooms  2: main_entrance, operations_office
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad
globals set     6: briefing_played, checkpoint_passed, disclosure_choice, engine_tutorial_declined, guard_admitted, player_name
VERDICT: progress recorded - 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted.

game            2226  (mission 48)
played for      871s of wall clock
unlocked rooms  8: main_entrance, operations_office, security_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   2: security_equipment_locker, optigrid_tool_case
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Spare Keycard (Level 1), Fingerprint Kit
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_2b25c7}, ..._2_58643f, ..._3_399c46, ..._4_511df9
globals set     47: all_flags_in, anomaly_detected, asked_the_number, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, casualties_occurred, checkpoint_passed, clock_started, crew_lost, debrief_started, disclosure_choice, ..., mission_complete, ..., promised_voltage_alive, racks_vented, ..., vented_by_trigger, voltage_captured, voltage_fight_started, voltage_neutralised, voltage_six_cities, vuln_guide_offered
VERDICT: progress recorded - 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.

game            2229  (mission 48)
unlocked rooms  2: main_entrance, operations_office
globals set     24: ... asked_the_number, attack_prevented, ..., mission_complete, ..., promised_voltage_alive, ... (seeded)
VERDICT: progress recorded - 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

(Trimmed with "..." only where the global list is long; the full output is in `verify.txt` in the scratch folder. Voltage's "forty-odd" line and the 2226 globals are all there.)

## Results

| # | Check | Result |
|---|---|---|
| 1 | Guard repeat sighting and admission | PASS |
| 2 | HaX gate reply | PASS |
| 3 | Voltage narration after backing off | PASS |
| 4 | `asked_the_number`, `promised_voltage_alive` sync | PASS |
| 5 | Crew-lost debrief | PASS (cycle 3 build), notes below |
| 6 | Clean-route debrief | PASS |
| 7 | Backgrounds | see below |

### 1. Guard (game 2224)

The opener played on spawn: "The guard's already on his feet as you come through the door." / "Morning. Bit early for visitors. Desk first, if you don't mind." (screenshot 01). Closed with the x. Walking about inside the room does not re-fire it (the engine needs the player out of his sight first). I left for the operations office and came back after more than 20 s: the chat opened on "Still need you at the desk first, my lover. Badge." with no narration and no opener. Admission via "Grid-safety regulator" then "Routine procedure. Where do I find Mr Vance?": "Regulator, is it." / "Alright, sign in here. Mr Vance said there was an audit today. He's not happy about it, fair warning." / "He'll be at his desk or in the control room at this hour." / "Go on through, my lover. Operations office is straight down the hall." The line "Go on through, my lover." is the first half of that last line; it is not the very last words he says. In game 2226 the other admission choice ("I'll keep that in mind. Thank you.") ended on the same line. A direct talk after the x-close also resumed on the re-sighting line (his resting knot), which reads right.

### 2. HaX gate reply (game 2226)

Phone opened at the gate (`interactInventory("phone")`, then "Agent HaX"). Choice "Not yet. I'm at the gate." The conversation closes (`#exit_conversation`), so the reply is read from the thread when the phone is reopened (screenshot 04): "Then the badge. Routine audit, came early. Once you're past him: Vance, then something in Hall 1 that isn't on their feed." Exact match. The hub then offers "How do I get past the gate?", "Where do I stand?", "Nothing right now."

### 3. Voltage back-off (game 2226)

After "Not like this. (Back off.)" Voltage says "Then get out of my plant room. The clock doesn't care either way." On return: "*not looking up* You came back. Nothing you say next will be new." then "Then let's finish this." goes straight to "So. The button, or me." / "You don't get to have both. I'd decide quickly." The narration ("The laptop is open on the plant-room bench...") does not replay. Static's "Talk, then. From there." and Voltage's "Static let you walk up to my bench" both played on the first visit.

### 4. The two globals

- 2224 (briefing without the "Four of them" branch): `promised_voltage_alive` false after the briefing.
- 2226: "Four of them. Should I expect a fight?" then "Stop the trigger, and bring Voltage in alive if I can." set `promised_voltage_alive` true (read through `gameState.globalVariables`). I could not reach it from the "orders" branch alone: its "If it comes to it: stop the attack, or take Voltage?" branch ends without the promise choice, so the promise needs the timeline then fight route. Not a fault, but a player on the shorter route never gets the "alive" payoff line.
- 2226: "How many does the hall take with it?" set `asked_the_number` true.
- Both stayed true after a full page reload (Restart after the KO) and verify-run lists both as persisted. I did not play the HaX phone "[Understood. I'll try to take him alive.]" variant.

### 5. Crew-lost debrief, word for word (game 2226, vance_trust_level 10, Voltage KO'd so `voltage_captured` true, promise and number both set)

Phone, then the debrief person-chat. Screenshot 07 and 08: HaX in her trench coat and hat in the office background (real art, not the placeholder pattern).

```
Agent HaX: Agent, report.
 [1. He reached the laptop before I reached him. Shutdown held A and C.]  [2. Voltage is in custody.]
> He reached the laptop before I reached him. Shutdown held A and C.
Agent HaX: Bank B's gone, but you isolated A and C and forced the vents. It could have been the whole hall.
Agent HaX: The night crew were still in Hall 2 when Bank B went. Nine of them.
Agent HaX: And you've got Voltage.
 [1. Nine. Tell me we came out with something.]
> Nine. Tell me we came out with something.
Agent HaX: The directive said it: Zero Day supplies, Critical Mass executes, grid storage this winter. Tonight was that plan, running.
Agent HaX: Voltage is in a room now. So far he's given us one thing: his casualty figure.
Agent HaX: To the decimal this time. You only got "forty-odd".
Agent HaX: You said you'd bring him in breathing. You did.
Agent HaX: Their FTP drop already put Critical Mass and Social Fabric on the same job. The paper in the plant room would have signed it.
Agent HaX: Keep the OptiGrid print kit. Forensics can have the case it came in.
 [1. And how did they get in? How did I?]
Agent HaX: Before you write it up. Here's what let them in. Nearly all of it let you in too.
Agent HaX: Their door cards are old prox. They hand their number to anything that asks. You could have had Vance's from across his desk.
Agent HaX: You did it to Relay, while she was talking.
Agent HaX: The HV door took one finger, and that finger was on a panel he touched every two hours. A print names you. It can't prove you're the one standing there.
Agent HaX: And the control room believed its own sensors. The honest ones weren't on the bus: a dial on a wall, and a gas monitor off their network.
 [1. And the network?]  [2. So what do they fix first?]
> And the network?
Agent HaX: A legacy compile service on an OT box, trusting whatever it was sent. That comes off the network.
Agent HaX: An FTP service handing their cross-cell plan to anyone who looked, and a jump-server account with more privilege than it ever needed. Somebody reviews those.
Agent HaX: And on site: encrypted cards, a second factor on the HV door, and a gauge in every hall that somebody reads.
 [1. It goes in the report. Vance will want every line.]  [2. The budget let them in as much as the readers did.]
> It goes in the report. Vance will want every line.
Agent HaX: Social Fabric had disinformation queued for the morning, ready to turn a fire into a panic.
 [1. The Architect. He's running all of it.]  [2. How far does this reach?]
> How far does this reach?
Agent HaX: Voltage told you six cities, in the plant room.
Agent HaX: OptiGrid, their cover firm, has contracts at forty sites nationwide. We're auditing every one.
Agent HaX: We've never seen it run this tight.
Agent HaX: Netherton wants a standing team on The Architect. Hunt the coordination, not the cells.
Agent HaX: He's calling it Task Force Null. Your name's on his list.
 [1. What would Task Force Null do?]  [2. I'm in. When do we start?]
> I'm in. When do we start?
Agent HaX: He'll call when he's ready. Not tonight.
Agent HaX: Nine in Hall 2. Two more on the feed before the grid caught up.
Agent HaX: The evacuation alarm was on Vance's desk. He never knew he had a reason to use it.
Agent HaX: You stopped the rest of it. Hold on to that when the names come out tomorrow.
Narrator: Vance is on the line from the Albion ops desk.
Agent HaX: How do we handle this publicly?
 [1. Full public disclosure. People have a right to know.]  [2. Keep it classified. Let them patch it quietly.]  [3. Say there was an incident. Keep the details back.]
> Full public disclosure. People have a right to know.
Agent HaX: Full transparency. The attack, the holes it came through, ENTROPY. All of it.
Robert Vance: There'll be hell to pay for this place. There should be.
Agent HaX: The public gets the truth and the warning with it. Albion takes the hit, every other storage site gets audited, and someone in Parliament finally answers for the funding.
Agent HaX: Netherton will back that.
Agent HaX: Done.
Agent HaX: Statement goes out with the local authorities.
Robert Vance: Nobody told me what was in my own plant. Nine of mine paid for that.
 [1. I'm sorry about your people, Mr Vance.]  [2. It's all going in the report. Every line.]
> I'm sorry about your people, Mr Vance.
Robert Vance: We've run this place on hope and gaffer tape for years.
Robert Vance: That stops on my shift.
Agent HaX: Voltage will keep.
Agent HaX: Sleep. I'll call.
```

Checks: "Nine of them" arrives on the third line, before any choice (pass). Vance's goodbye at trust 10 (below 50) is "Nobody told me what was in my own plant. Nine of mine paid for that." (pass; the 50 to 79 and 80+ goodbyes were not played). "Vance is on the line from the Albion ops desk." comes right before the disclosure question (pass). Background is HaX's office, not the placeholder (pass). The bracket text renders cleanly: no raw ink conditionals on any choice. The Voltage-first opener ("Voltage is in custody") was not taken in this game; see 2229.

### 6. Clean-route debrief (game 2229, seeded, trust 90, ally, Voltage captured, no vent)

```
Agent HaX: Agent, report.
 [1. Shutdown engaged before the racks went. Banks isolated, hall intact.]  [2. Voltage is in custody.]
> Voltage is in custody.
Agent HaX: Good. Nobody else in that building knows the chain above Blackout.
Agent HaX: He'll talk. He wants someone to check his sums.
Agent HaX: Vance says the grid held because of you. He wants that in writing.
 [1. What did we get out of there?]
> What did we get out of there?
(the same six lines as the crew-lost "something" beat, ending "Keep the OptiGrid print kit. Forensics can have the case it came in.")
 [1. And how did they get in? How did I?]
Agent HaX: Before you write it up. Here's what let them in. Nearly all of it let you in too.
Agent HaX: Their door cards are old prox. They hand their number to anything that asks. You could have had Vance's from across his desk.
Agent HaX: The HV door took one finger, and that finger was on a panel he touched every two hours. A print names you. It can't prove you're the one standing there.
Agent HaX: And the control room believed its own sensors. The honest ones weren't on the bus: a dial on a wall, and a gas monitor off their network.
 [1. And the network?]  [2. So what do they fix first?]
> So what do they fix first?
(the same three lines as above, "A legacy compile service..." to "...a gauge in every hall that somebody reads.")
 [1. It goes in the report. Vance will want every line.]  [2. The budget let them in as much as the readers did.]
```

The "what failed" beat: the player turn is "And how did they get in? How did I?", then the second turn is "And the network?" or "So what do they fix first?" (both gave the same three lines). Cycle 3 check: on the Voltage-first opener a player choice does come after the people lines ("What did we get out of there?"). The rest of the clean route: "The documents name several cities." / "OptiGrid's contracts turn up at dozens of infrastructure sites." (no "six cities" or "forty" because Voltage never said them in a seeded run), "Eleven people walked out of there tonight. Two hundred and forty thousand on that feed never knew they were on it.", the Vance-on-the-line Narrator line, Vance "It'll hurt us. People should still know how close it came." / "Thank you." / "I don't know what you are. I know what you did." / "Nobody in that hall died, and two hundred and forty thousand never lost the lights." Choices at the end: "It was an honour working with you, Mr Vance." / "Just doing my job." Then "We've run this place on hope and gaffer tape for years." / "That stops on my shift." / "Voltage will keep." / "Sleep. I'll call."

### 7. Conversation backgrounds

From `scenario.json.erb` (grep) and what I saw:

| NPC / room | Background | Seen |
|---|---|---|
| Debrief (HaX, `hq1.png`), briefing | HaX's office, real art | yes (07, 08) |
| Security guard, main entrance | `background1.png`, the purple matrix **placeholder pattern** | yes (01) |
| Cipher (Hall 1), Relay (Hall 2), Static (plant room) | `background1.png`, the same placeholder (by config, not looked at) | no |
| Voltage (plant room) | none configured: **plain black** behind him | yes (05) |
| Robert Vance (operations office) | none configured: **plain black**, and in screenshot 09 the figure drawn looks like a walking sprite rather than a talk bust (seeded game 2229, toasts overlaying; not seen in 2226) | yes (09) |

So every on-site room (entrance, ops office, Hall 1, Hall 2, plant room) still lacks a room POV background; three show the placeholder and two show black.

## Findings

| # | Severity | Finding | Repro |
|---|---|---|---|
| F1 | minor | On-site conversations use the placeholder purple pattern (guard, Cipher, Relay, Static) or black (Voltage, Vance). Expected until the POV background stage | 2224 line of the first guard chat, screenshots 01, 05, 09 |
| F2 | minor, needs a look | Vance's chat in game 2229 shows a walk-sprite-style figure on black. Could be seeding (fresh page, no talk art loaded) or a missing talk sprite. Not seen in 2226 or 2224. Check with a plain route | 2229, ops office, `interact robert_vance`, screenshot 09 |
| F3 | minor | The shorter briefing route ("I've got what I need. What are my orders?" then "If it comes to it: stop the attack, or take Voltage?") never offers the promise choice, so `promised_voltage_alive` stays false for a player who says "The attack first" and the debrief's "You said you'd bring him in breathing" can never fire for them. Probably as designed | 2224 and 2226 briefing |
| F4 | minor | Relay's "Nae bother." after the player's "Radio. Down. Now." reads like agreement to a request she was refusing a line earlier. Context may be intended (she leaves the radio) | 2226, Hall 2 |
| F5 | note | A player who closes the guard's challenge with the x and keeps wandering in the room is not re-challenged until they leave his sight and return. Matches the engine comment, not a fault | 2224 |
| F6 | note | After the phone choice "Not yet. I'm at the gate." the phone closes at once, so the reply is only visible when the phone is reopened | 2226 |

0 blockers, 0 majors, 4 minors, 2 notes. The cycle 2 and cycle 3 changes checked behave as the coordinator and the log describe.

## Not covered

- Vance goodbyes for trust 50 to 79 and 80+ on a crew-lost route; the clean route at trust 90 was played, in seeded form.
- The HaX phone "alive" choice, the "never told" and "escaped" payoff lines.
- A real (unseeded) clean route to the ESD; a Voltage arrest.
- Cipher, Relay, Static backgrounds were read from config, not looked at.
