# m04 Critical Failure, pass 5, struggling player A (blind run)

**Question answered:** unexpected behaviour and decision consequences (blind run, struggling-player persona). Not a solvability pass: the four VM flags were supplied.

- Game id 2316, keyless :3001, headless (machine load about 17 at start). Speed `fast`.
- Session log: `tools/playtest/m04-pass5-strugglingA-session.jsonl` (2205 lines, 18:59:29 to 19:30:52 UTC, 1812 s played).
- Screenshots (scratchpad, `m04-pass5-strugglingA/`): 01-brief, 02-guard, 03-vance, 04-hmi, 05-thermo, 06-cipher-sighting, 07-fight, 08-after-fight, 09-restart, 11-rfid, 12/13-cipher-hostile, 15-relay, 16-plant-door, 18-dusting, 20-compare, 21-reload, 22-plant, 23-esd, 24-static-fight, 25-voltage, 26-esd2, 27/28-esd-pressed, 31-debrief-HaX, 32-debrief-vance, 33-credits.
- Read nothing from the scenario folder, ink or JSON. Read only the skill, AGENTS housekeeping and the brief's Environment section.

## verify-run.rb output (full)

```
game            2316  (mission 48)
created         2026-10-13 18:59:12 UTC
last write      2026-10-13 19:29:24 UTC
played for      1812s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       18: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Security Desk Procedures, Facility Layout Map, Budget Cut Memo, Maintenance Work Orders, Emergency Shutdown Procedure, Cipher's Intelligence Note, Rack Bank Maintenance Manifest, Workshop Access Log, Fingerprint Kit, OptiGrid Job Card #4782 (back page), Critical Mass Coordination Log, Voltage's Operation Log, Workshop Keycard (relayed copy)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_2d9e1f}, ..._2_b96b19, ..._3_bd6f36, ..._4_4fdf1e
globals set     53: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, casualties_occurred, checkpoint_passed, cipher_engaged, clock_started, crew_lost, debrief_started, disclosure_choice, ... mission_complete, ... racks_vented, ... vented_by_trigger, voltage_captured, voltage_fight_started, voltage_neutralised, vuln_guide_offered
VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

(The `globals set` line is trimmed for length here; the full list is in the verifier run. `mission_complete`, `crew_lost`, `casualties_occurred` and `disclosure_choice` are all set.)

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Vance's Level 1 card | cloned RFID | Vance, "lean in over the site map" option, ops office; HaX phone hint explained it after I missed it | log ~1010 (second visit) | yes (first pass missed it, hint needed) |
| Relay's Level 2 card | cloned RFID | Relay standoff option "close the gap", Hall 2 | ~1440 | yes |
| Hall 2 door | Level 1 emulated | Vance's card | ~1380 | yes |
| Workshop door | Level 2 emulated | Relay's card | ~1500 | yes |
| Plant-room reader | Vance's fingerprint lift | OptiGrid tool case (lockpick, **assisted**), job card, Hall 1 duty panel | ~1584 | yes (dusting driven by DOM drag and key events; I judged the visible sheen and pattern myself) |
| `bms_jump_server:flag_1..4` | `<flag:1>`..`<flag:4>` | HaX hints, jump-server launcher, drop-site terminal. No VM in standalone | ~1521 | **no, flag supplied.** In-game prerequisites reached: terminal, IP, HaX hints. VM work itself not possible, so everything downstream of the flag tasks is exercised, not tested. |
| ESD arming | n/a | HaX text "grid control standing by" after Voltage was out of the way | ~1876 | yes |

Assisted/not earned: `completeLockpick` on the tool case (assisted); `debugKO` on Cipher, Static, Voltage and Relay (combat not played, exercised not earned); four flags supplied.

## Timeline (what I thought the goal was)

All times are log timestamps (UTC).

1. 18:59 Briefing by hand. Goal: "get in as the regulator, find Vance, stop an attack at 0800". Took the quick options (threat, timeline, cover, orders, "Fine. What else?"). Asked HaX if I should expect a fight; first mention of the combat.
2. Guard: said "Just a routine visit" instead of "grid-safety regulator". Guard pushed back ("I've an audit on my list, not a visit"), I bluffed, he let me through.
3. Vance: "Just doing the job", asked about maintenance, said "just being thorough" to "Is there a problem?". Declined the cloner option (a parenthesised stage direction, did not look like a hacking action). Ended the chat. Goal: "read the desk papers, check the SCADA screens".
4. SCADA HMI: all green. The HMI text says only a standalone instrument would tell the truth. Hall 1 thermometer: 61 C vs 28 C. Goal: "something is lying, find who".
5. Cipher in Hall 1: sighting scene triggered by walking toward him. Chose "Put the radio down", then "Walk out. Leave the handset." That set `cipher_engaged` and he went hostile. Goal: "get past him somehow".
6. 19:05 Fought Cipher for real (see below), lost twice, Restart. Phone: asked HaX how to get through card readers. HaX told me about Vance's lanyard. Goal: "go back and lean in on Vance".
7. Cloned Vance's card (flipper Save). Level 1 card denied at the workshop door, accepted at the Hall 2 door. Cipher kept hitting me, so I used `debugKO`.
8. Hall 2: Relay sighting, cloned her Level 2 card. Plant-room door: "You haven't lifted any prints yet."
9. Workshop with the Level 2 card. Jump-server launcher (no VM). Tool case (assisted pick), fingerprint kit, job card. Goal: "get Vance's print".
10. Dusting minigame at the Hall 1 duty panel, lift Vance's print, flags 1 to 4 submitted at the drop-site terminal (flag supplied).
11. 19:19 Page reload at this point (before the plant room). Resume overlay appeared, Resume clicked through the DOM. Position reset to the main entrance, progress kept.
12. Plant room: Static fight (lost ground, debugKO), Voltage conversation, picked "Then I take that laptop off you", then "I'm taking you down. Now." Voltage's fight KO'd me from 24 HP with me doing nothing. Restart, then Voltage fight again from 100 HP, KO in 13 s. Restart, `debugKO` on Voltage, ESD armed and pressed.
13. Relay attacked again after the ESD (HP 90 to 35), `debugKO`. Phone call to HaX, "Bring me in". Debrief, credits.

## Stuck moments

| Where | How long | What I tried | What unstuck me |
| --- | --- | --- | --- |
| Hall 1, after Cipher went hostile | about 15 min of log time (19:05 to 19:11), two KOs | punching via `interact`, retreating one room (he followed), pressing e and space | the harness `debugKO`. Nothing in-game told me how to win or avoid it |
| Workshop door, no Level 2 card | about 3 min | Level 1 card on the workshop door (denied) | HaX phone ("Where do I stand?" / "How do I get through the card readers?") |
| Vance cloner option | about 5 min | skipped it, then no way forward | HaX phone hint. The option stays on the hub. |
| Dusting minigame (powder, brushing, tape) | about 6 min | black powder (the screen then told me silver is better) | the on-screen hints. Brushing needed a held drag, so DOM events |
| Plant room, after "taking you down" | immediate KO | n/a | Restart, debugKO |
| Harness: Restart goes to the title screen, which needs an Enter keypress dispatched through `eval` | 2 min each time | `pressKey`, `clickText` refused (minigame-active / no control) | `eval` KeyboardEvent Enter (a visible "press Space or Enter" prompt) |

## Real fights (HP and time)

| Fight | Start | Result |
| --- | --- | --- |
| Cipher #1 | 100 HP, 19:05 | 13 `interact` punches over about 36 s, HP 100 to 0 (about 4 HP every 2 s), his HP bar stayed full red, KNOCKED OUT. Restart returns to the main entrance with progress kept, HP 100. |
| Cipher #2 | 64 HP after he chased me across a room boundary | HP 64 to 0 in about 25 s, no KO on him. |
| Static | 84 HP | 8 punches, 16 s, HP 84 to 44, his bar full. Stopped, debugKO. |
| Voltage | 100 HP | 6 punches, 13 s, HP 100 to 0 (12 HP per hit, first hit 48), his bar not reduced. |

I could not see any damage landing on any of them. I do not know if that is the harness `interact` (which may not deliver a punch the way a mouse click does) or the game. **Suspect harness or engine; evidence: log lines 800-809, 1832 and the screenshots 07, 13, 24 (enemy bar full after a dozen interact calls).** A human might do better. If they cannot, HaX's "Whatever force it takes" has no counterpart.

## Decisions

| Decision | Felt | Consequence seen later |
| --- | --- | --- |
| Guard: "routine visit" vs "regulator" | arguable (a loose word choice, not signposted) | guard challenged me; the bluff still worked. No effect in the debrief. Fair. |
| Vance: "Just being thorough" to "Is there a problem?" | arguable, I did not know "There's something you need to know" mattered | **Debrief and credits: "The evacuation alarm was on Vance's desk. He never knew he had a reason to use it." and "ROBERT VANCE: never told".** Nine night-crew died, two more on the feed. I never saw an alarm object and was never told about the night crew except in the HaX phone menu I did not open ("Can we get the night crew out of Hall 2?"). Strong consequence, but the player is not told the alarm exists. |
| Skipping Vance's confrontation twice ("That's all for now") | obvious to skip; a rushed player would | same as above |
| Cipher: "Put the radio down", "Walk out" | arguable, I picked the sharper line | `cipher_engaged`, hostile, and he chased me. The softer opener ("Albion contracted me") was not tried, so I do not know the alternative. |
| Relay: "Then why are you walking it?" then "close the gap" | obvious (the bracketed option is clearly the cloner) | worked; credits: "RELAY: card copied mid-standoff" |
| Voltage: "Then I take that laptop off you" and "I'm taking you down. Now." | arguable, I took the aggressive lines | fight started with me at 24 HP, KO. After my assisted KO the debrief said "Voltage is in custody" and also "he reached the laptop before I reached him ... Bank B went" (see findings) |
| Report: "Voltage is in custody" | felt true after my debugKO | HaX: "You said you'd bring him in breathing. You did." Credits: "VOLTAGE: CAPTURED". Consistent with `promised_voltage_alive`. |
| Disclosure: "Full public disclosure" | obvious first choice, not agonised | credits: "DISCLOSED IN FULL"; Vance reacts ("Nine of mine paid for that."). Vance: "I'm sorry about your people." |
| Pressing ESD: the Pushbutton minigame tells you why it is not armed ("Grid permissive not received. The trigger holder is still within reach of the laptop.") | clear, not arguable | worked once Voltage was out of the way |

## What I learned (own words)

- The SCADA screen is copied from one sensor bus, so it can show 28 C while a wall dial in the hall says 61. Check the dial, not the screen.
- An old prox card is just a number the cloner can read off a lanyard while the person talks to you. Same for Relay.
- The plant-room reader takes a lifted print. A print says whose finger it is, not whether the finger is attached to the person standing there.
- Silver powder for dark glossy surfaces. Lift, then pick Vance's card by name.
- Four VM flags: status page, FTP drop, distcc foothold, root.
- The fix list HaX read out: encrypted cards, a second factor on the HV door, a gauge someone reads, the compile service off the network, the FTP leak, a privileged jump-server account.

Lab-sheet questions: I did not see the lab sheet, so I cannot say which it answers.

## Best five lines

1. HaX, debrief: "The evacuation alarm was on Vance's desk. He never knew he had a reason to use it."
2. Vance: "We've run this place on hope and gaffer tape for years. That stops on my shift."
3. HaX: "Vance's door card copied from across his own desk. Old prox hands its number to anything that asks."
4. Voltage: "One keystroke and it's now, not eight o'clock. The racks go critical, the hall burns, and the grid drops."
5. Credits: "ROBERT VANCE: never told — the cover held all night".

## Worst five lines (or places)

1. HaX: "Remember the directive from the Zero Day job?" (long exposition in a briefing that already has a lot of exposition).
2. Narrator before the Voltage choice: "You cannot reach both." The prompt then offers "Step away from the bench" and "Not like this. (Back off.)", which do not obviously relate to the two things the line names.
3. Credits "CRITICAL FAILURE" and "COSTLY SUCCESS" printed together: confusing. And "RACK BANK B LOST — he reached the laptop" when I had pressed the ESD with Voltage down on the floor.
4. Debrief: "he got to the laptop before you got to him, and Bank B went with it" two lines after "Voltage is in custody" (contradictory; see findings, partly caused by my assisted KO).
5. Relay at the Hall 2 door: choice 3 "The bypass modules on all three rack banks. Was that you?" names something I had not yet found (a hint given away by the wording).

## Scores (1 to 5)

| Fun | Pacing | Clarity of goals | Openness of decisions | Teaching |
| --- | --- | --- | --- | --- |
| 3 | 3 | 4 | 4 | 5 |

Fun is held down by the fights (I could never win one) and the long walks back from the main entrance after each KO (five room transitions, no shortcut). Teaching is the strongest part: the cloner, the dusting kit, the sensor-bus point and the debrief tie together.

## Findings (severity table)

| # | Severity | Finding | Repro |
| --- | --- | --- | --- |
| F1 | major | Combat unwinnable by the harness: 14 punches on Cipher, 8 on Static, 6 on Voltage with no KO and full enemy bars, while each of them takes 4 to 12 HP every 2 s. Suspect harness or engine; I cannot tell. If a human cannot win either, the optional-fight branch is a trap for a struggling player. | game 2316, log 800-809, 1832, 1850; screenshots 07, 13, 24 |
| F2 | major | After a KO, Restart sends the player back to the main entrance. The route back to the fight is five rooms. Cipher then hits you in Hall 1 as soon as you approach the Hall 2 door or the thermometer, and he follows you across room boundaries. No in-game way to avoid or end it once `cipher_engaged` is set. | log 815, 1048; HP trail in log 1000-1100 |
| F3 | major | Debrief and credits contradict each other in my run: "Voltage is in custody ... You did." then "he got to the laptop before you got to him, and Bank B went with it. Nine in Hall 2"; credits show COSTLY SUCCESS and CRITICAL FAILURE together. The state was mixed (I pressed the ESD after an assisted KO following a real-fight KO), so I cannot say if this is reachable without assistance. A tester should check the real-fight-loss branch. | log 2160-2200; globals `voltage_captured`, `crew_lost`, `vented_by_trigger`, `voltage_neutralised` all set |
| F4 | major | The consequence of not telling Vance (nine dead) points at an "evacuation alarm on Vance's desk" the player never saw and, as a rushed player, could not have found; the alarm is only mentioned after the loss. Strong teaching moment, but the player is not given a chance. | log 2150-2170; Vance hub, first visit |
| F5 | minor | The Vance cloner choice is a parenthesised stage direction; I took two other options and had to be told by the phone. HaX hints are good, but the option reads as flavour. | log ~1010 |
| F6 | minor | Relay dialogue choice 3 names "bypass modules on all three rack banks" before the player has seen the bypass module. | screenshot 15 |
| F7 | minor | Hall 1 duty-round panel and other objects: the interaction hit a Hall 1 popup (BESS diagram) again whenever I walked past with Cipher KO'd; I could not interact with the KO'd Cipher (`still-out-of-range` at 2.6 px). | log ~1130-1160 |
| F8 | minor | Phone choice "Where do I stand?" ends on a stale one-option menu ("Right."), and the "Send me a field guide" choice gave no visible response in the phone state I could read. | log ~1250, 1270 |
| F9 | minor | Mission brief on screen says "trigger Emergency Shutdown"; but ESD arming needs the grid permissive, HaX confirmation and the trigger holder out of reach. The ESD minigame says this plainly. Fine, noted only for the brief. | screenshot 23 |
| F10 | minor | Resume overlay appears after a reload even without a new session (expected per the skill). Position resets to the main entrance, not the last room. | log 1555, screenshot 21 |

0 blockers, 4 majors, 6 minors.

Backgrounds checked: guard (entrance logo, board, desk) match. Vance (office with kettle, monitor, cabinet) match. Cipher (brick wall, hazard sign, racks) match Hall 1. Relay (rack bank signs) match Hall 2. Static (door, fans, panels) and Voltage (ESD box, fuse panel) match the plant room. HaX debrief (office with blinds) is HaX's office, used for the debrief including Vance's call-in; fine.

## Top three issues

1. Combat. I could not win any fight and the damage taken is high (F1, F2).
2. The Vance consequence is invisible to the player until the debrief (F4), and the debrief contradicts itself in my mixed-state run (F3).
3. The Vance cloner option and the Relay bypass line (F5, F6) reduce discoverability and give away information.
