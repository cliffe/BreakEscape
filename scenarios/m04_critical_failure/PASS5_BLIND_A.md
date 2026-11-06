# m04 Critical Failure: pass 5 blind playtest A ("do your best")

Run type: blind run, persona "do your best", question 1 (plumbing) plus a read of question 2 (what happens when the player chooses differently). Not a solvability pass: the VM work was not done.

- Game id: **2513** (mission 48), keyless server :3001, headless, speed fast.
- Session log: `tools/playtest/m04-blindA-session-2513.jsonl` (2435 commands). Key lines: reload 738, debugKO 900 / 1006 / 1582, alarm decision 1443-1445, lockpick assists 1204 / 1880 / 1984, fingerprint compare 1307-1309, ESD confirm 1757-1808, credits observer 2148, flags 1144 onward.
- Flag policy: `session` (flags supplied, marked below). `completeLockpick` used three times (assisted). `debugKO` used three times (assisted, combat not played).
- Read before playing: playtest skill (steps 2-5, blind runs, severity table), AGENTS.md Housekeeping, M04 brief Environment. Nothing else from the scenario folder.

## Deviations from "a player gets only the screen" (disclosed)

- DOM clicks on visible controls because the harness had no command: the inventory slots (phone, guides), the RFID flipper menu items, the ESD guard flap, ESD button and confirm button, and dusting-canvas strokes. Each was a control I could see on screen.
- `room` output listed hidden NPCs (including `agent_nightshade`, `agent_0x99_debrief`) at far-off coordinates. I did not use them.
- While hunting for the CyberChef workstation I ran one `eval` that listed the `.laptop-frame` elements. That is closer to inspecting the DOM than I should have gone. It showed a "Crypto Workstation" frame sitting behind the Lab Sheet viewer (see finding M2). Treat that finding with that caveat.
- Combat cannot be driven by the harness. My first fight with Cipher was a harness mistake: I used `interact` on him repeatedly, which does not punch, and I lost all HP (KNOCKED OUT screen, Restart, back at the entrance with progress kept). After that I used `debugKO`.

## verify-run.rb output (full)

```
game            2513  (mission 48)
created         2026-10-16 13:00:55 UTC
last write      2026-10-16 13:40:34 UTC
played for      2379s of wall clock
current room    "main_entrance"
unlocked rooms  9: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room, loading_dock, security_office
unlocked objs   3: optigrid_tool_case, extraction_gobag, security_equipment_locker
inventory       29: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Security Desk Procedures, Facility Layout Map, Budget Cut Memo, Maintenance Work Orders, Emergency Shutdown Procedure, SAFETYNET Field Guide: RFID Cloning, Cipher's Intelligence Note, Workshop Keycard (relayed copy), Rack Bank Maintenance Manifest, Workshop Keycard (Level 2), OptiGrid Operations Log, Workshop Access Log, Fingerprint Kit, OptiGrid Job Card #4782 (back page), Facility Blueprints (Marked), Critical Mass Coordination Log, Voltage's Operation Log, Voltage's Escape Plan, Social Fabric Safehouse Card (Encoded), SAFETYNET Field Guide: Encoding and Decoding with CyberChef, Camera System Logs, Access Control Export: HV Plant Room, Spare Keycard (Level 1), Incident Response Guide
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_28bc83}, flag{m04_critical_failure_bms_jump_server_2_993ef2}, flag{m04_critical_failure_bms_jump_server_3_fe7528}, flag{m04_critical_failure_bms_jump_server_4_cb58cc}
globals set     63: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, ... mission_complete, ... vance_is_ally, vance_print_lifted, voltage_captured, voltage_neutralised ... (full list in the verifier output; includes crew_warned, disclosure_choice, debrief_started, mission_complete)
VERDICT: progress recorded — 8 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```

(The globals line is shortened here; `mission_complete`, `crew_warned`, `disclosure_choice`, `voltage_captured`, `relay_card_cloned`, `vance_card_cloned`, `vance_print_lifted` and `lore_safehouse_address_found` were all present.)

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Vance Level 1 card | cloned EM4100 (facility 103) | Cloner use on Vance's lanyard in the ops office conversation | log ~line 350 (opening, before the Hall 1 door) | yes. Used on Hall 2 door. |
| Workshop door | Level 2 keycard | Relay's cloned card, plus the dropped "Workshop Keycard (Level 2)" after the fight | after line 1006 | yes (the fight itself was `debugKO`, assisted). The workshop door opened on interact with the items in inventory; the Hax text message handed over "a copy of her number" as well. |
| Plant-room fingerprint | Vance's lifted print (75% quality) | Tool case (lockpick, assisted) gave the kit and the job card; dusted the Hall 1 duty round panel | lines 1204-1309 | yes |
| Safehouse card decode | "SOCIAL FABRIC - REGIONAL SAFEHOUSE / Unit 14, Calder Wharf, Salford / Knock 2-1-3 / Ask for Loom" | Go-bag card (lockpick, assisted), Base64 | line ~1880 | **no**: I could not reach a CyberChef workstation in the UI. I read the Base64 by eye; "exercised, not earned". The debrief's "decodes to Calder Wharf" agreed with my reading. |
| Flags 1-4 (`bms_jump_server`) | `<flag:1>` ... `<flag:4>` | Drop-site terminal in the engineering workshop | line 1144 onward | **flag supplied**. Prerequisite held: I reached the VM launcher and flag station through the workshop. I did not request or read the network, FTP, distcc or sudo field guides, so the VM prerequisites were not tested. The station accepted all four back to back in any order with no sign of gating. |

Rows marked "no" or "flag supplied" are the boundary of what the run proves. Everything after the flags was exercised, not tested: the VM challenge (no VM in standalone), and the decode.

## Timeline (what I thought the goal was)

1. Briefing (Netherton, then HaX). I thought: stop an ENTROPY attack on a battery site, meet Vance, find the control network, stop the trigger. Picked the "alive" line for Voltage. Briefing was long (about 25 clicks) but clear. Two things I did not follow: the HaX line "That's what Nightshade's reading is for" (I never learned who or what that is), and the choice to tell Vance (left to me).
2. Entrance. Guard auto-talked at the gate. "Sign in" was never required (no task for it). Read desk notes and sign-in log (OptiGrid crew on the 9th).
3. Ops office. Vance, cloned his card. Read work orders (flagged the break-in as evidence, objective ticked), the memo, the layout map. Thought: find evidence, check the readings.
4. SCADA room. HMI shows 28 C everywhere and says if the feed lies "only a standalone instrument in the hall would show it". Thought: find the instrument. Parameter log and ESD procedure gave the ESD / "grid control permissive" rule.
5. Battery Hall 1. Thermometer dial 61 C. "Confirm the Telemetry" objective ticked, new objectives appeared (workshop, plant room). HaX texted a check-in sequence and the RFID field guide offer. I asked for the guide.
6. Cipher saw me crossing Hall 1. Reloaded the page here (see below). Then bluffed "thermal survey"; Cipher radioed Voltage and fought. I died once (harness mistake), restarted at the entrance, walked back, `debugKO`.
7. Hall 2 (Vance's card works). Relay waiting at the door. Tried to persuade her ("I need you to understand what they'll do", then the night crew), then cloned her card. She went hostile; `debugKO`. Read the manifest (night crew of nine, Vance refused to clear the halls), bypass module, emergency procedures. Took the dropped Level 2 keycard and the OptiGrid ops log.
8. Engineering workshop (door opened with the Level 2 card). Objective switched to "Map the attack on the OT network". Terminal needs a VM; supplied flags 1-4; objectives progressed through the list, ended with "get past the plant reader" and "confront Voltage". Picked the tool case lock (assisted), got the kit and the job card ("Use R.V. ... His thumb's on the Hall 1 round panel every 2 hours").
9. Dusted the Hall 1 round panel, matched to Vance. Goal now: plant room.
10. Ops office, told Vance the truth with the evidence. Asked about the night crew. **Sounded the evacuation.** HaX had warned about "half an hour, not till eight".
11. Hall 2, plant-room door with the lifted print. A red advisory clock appeared ("H2 ADVISORY - RACK BANK B 01:26"), then 00:33 as I entered the plant room. I did not see it run out.
12. Plant room: Static (talked, then `debugKO`). Pressed the ESD first: "NOT ARMED. GRID PERMISSIVE NOT RECEIVED. The trigger holder is still within reach of the laptop." So the goal became: move Voltage. Talked to Voltage (4 options after his "button, or me" line). Chose "Step away from the bench" then "Hands where I can see them". He gave up the laptop. Read the log, the blueprints and the coordination log.
13. ESD: flipped guard, pressed, confirmed. HaX: "Grid control confirms it." New task: sweep the site and call HaX.
14. Loading dock: schedule, Voltage's escape plan (mentions an "encoded address in the go-bag"), go-bag (lockpick, assisted), Base64 card. Security office: camera log, access export, locker (lockpick, assisted). Went back to the plant room laptop looking for CyberChef (no effect). Called HaX ("Bring me in"), debrief, public disclosure choice, credits.

## "Didn't know what to do" moments

| Where | How long | What I tried | What unstuck me |
| --- | --- | --- | --- |
| Hall 1, Cipher fight | ~2 min | `interact` on Cipher many times (took 4 damage a hit, lost all HP) | Harness cannot punch. Restarted, used `debugKO`. Not a game problem. |
| Battery Hall 1 ESD button after Static | ~1 min | Pressed ESD with Voltage by the laptop | The ESD message said exactly why (trigger holder in reach, no permissive). Clear. |
| Phone: guide offers | ~1 min | After "Their route in, proven" the only visible reply was "On it." and I thought the guide menu had gone | Closing and reopening the chat brought back "Send me a field guide" with seven guides. Looks like a dead end the first time. |
| Finding CyberChef | ~10 min | Both lab-workstation inventory items, the notepad, the plant-room command laptop (describes only), the security office | Never found it. Decoded by eye, marked not earned. The CyberChef guide item opens a Lab Sheet viewer; a "Crypto Workstation" frame was behind it but unreachable (M2). |
| Fingerprint dusting, step 1 | ~2 min | Clicked where I guessed | The sheen (a dotted disc) shows on screen; clicking its centre found the print. Fine once seen. |
| ESD guard | ~1 min | "Flip guard to arm ESD control" text only; I did not know the flap was clickable | A DOM click on the flap. A real player may well see it; text could say "lift the flap". |
| Where is CyberChef after HaX says "decoding guide" | see above | - | - |

## Reload test

Reloaded with `location.reload()` at line 738, while Cipher's challenge ("Who signed you in?") was on screen. Pressed Enter on the "Critical Failure / Continue?" title, no resume overlay appeared. Result: progress kept (guide in inventory, tasks, globals, cloned card), but the player is put back at the main entrance and the Cipher conversation starts over when you reach him. No blocker. The walk back is three rooms. Nothing in the game said where I was or what I was doing; the objective list covered it.

## Decisions

| Decision | Arguable or obvious? | Consequence shown later? |
| --- | --- | --- |
| Briefing: "bring Voltage in alive" vs "keep it quiet" | Arguable. HaX says "Whatever force it takes ... but I want Voltage breathing". | Yes. `promised_voltage_alive`; debrief: "You said you'd bring him in breathing. You did." Credits: "VOLTAGE: CAPTURED". I did not test the other option. |
| Tell Vance the truth, with evidence, vs keep the cover | Arguable. HaX: "Read him first." I waited until I had the dial reading and the job card. | Yes. Vance becomes an ally (`vance_is_ally`), runs the desk. Credits: "ROBERT VANCE: brought in". Vance's closing line is the best in the mission. |
| Cloning Vance's card during the conversation | Obvious (it is the only item-using option and HaX hints at it). | Debrief: "Vance's door card copied from across his own desk." |
| Cover bluff at Cipher | Felt like a trap: any bluff fails ("There's no survey tonight"), then a fight. Arguable only if the other two options differ. | `cell_alerted`, Cipher radios Voltage. Not mentioned later. |
| Persuade Relay vs clone her card | Arguable and interesting: persuasion beats didn't change the outcome, both end with her hostile ("Last chance to be somewhere else", then "That was my card. Run, then."). | Debrief: "You did it to Relay too, while she was talking." Credits: "RELAY: card copied mid-standoff". |
| Sound the evacuation | **Clearly arguable.** HaX warns it costs the surprise and gives "about half an hour". It felt like the right thing, but the cost felt thin once I saw it. | Strong. Debrief: "Vance's alarm had the night crew out before the button went in" and "Eleven people walked out". Credits: "ALL ELEVEN ON SITE WALKED OUT / NIGHT CREW: out of Hall 2 on Vance's alarm, and the cell heard it too". |
| Voltage: step away / take him down / go for the button / back off | Arguable but weighted: my briefing promise made "step away" the obvious pick. His surrender ("Nobody left to stop you. All right.") felt quick after he said one keystroke ends everything. | Yes. "VOLTAGE: CAPTURED". |
| Public disclosure | Arguable (three options, all plausible). | Credits: "DISCLOSED IN FULL". Vance replies in the same conversation. |

## What I learned, in my own words

- A door card that only broadcasts a number (old prox, EM4100) can be copied from a lanyard at arm's length, and any reader that accepts the number can be fooled. Level 1 opens Hall 2, but Level 2 is needed for the workshop. Newer card types need more work.
- A fingerprint reader can be fooled by a print lifted from a glass or gloss surface: find, powder (silver for dark shiny), dust lightly, lift with tape, compare. A print names a person but cannot prove the person is there.
- A control system that trusts its own sensors can be lied to; an independent instrument (dial on a wall, gas monitor off the network) is how you find out. The 28 C screen against the 61 C dial was the best teaching beat.
- OT networks: a jump server, an FTP service leaking plans and a compile service trusting input are the routes in. I only got this from the debrief, because I did not play the VM or ask for the guides.
- Safety systems that are hardwired (the ESD) are the last control that cannot be taken over, but it still needs a human permission step here.
- Lab-sheet questions answered by play: card cloning (yes), fingerprint lift and compare (yes), sensor trust (yes). Not answered: network mapping, FTP, distcc, sudo, Base64 decoding (not reachable, M2).

## Best five lines

1. Relay: "Thermal runaway in a sealed hall. I know exactly what they'll do. I did the modelling." followed by the narrator, "There is no flinch in it."
2. Vance, at the end: "I don't know what you are. I know what you did."
3. Voltage: "Let them read the casualty model. I signed it."
4. HaX in the debrief: "A print names you. It can't prove you're the one standing there."
5. Vance: "We've run this place on hope and gaffer tape for years. That stops on my shift."

## Worst five lines

1. Vance after the shutdown, still on the ops desk: "I'm not going anywhere. Call the moment you're moving." The mission is over and he still talks as if I am going in.
2. Voltage: "Nobody left to stop you. All right." A cell lead who has costed 40-60 civilian casualties gives in in one beat.
3. HaX's briefing infodump, "Remember the directive from the Zero Day job?" and the four-line orders list. Accurate, but it reads as written, not spoken, and it arrives after the player has already stopped listening.
4. HaX: "Eleven people walked out of there tonight. Two hundred and forty thousand on that feed never knew they were on it." The second sentence reads awkwardly (on what feed?).
5. HaX at the ESD step, "That's what Nightshade's reading is for" (briefing): the name is never explained in play.

## Night lighting and conversation backgrounds

Map lighting: **did not read as night.** The entrance, ops office, SCADA room, Hall 1 and Hall 2 all look evenly bright (grey and blue-white, no dark pools, no sense of 4 am). The engineering workshop and plant room are dimmer and greener and are the closest to night. The hall green vision cone is a good readable cue. Hall 2 and the plant room go red-tinted after the alarm, which reads well.

Conversation backgrounds:

| Scene | Room | Match? |
| --- | --- | --- |
| Security guard | Entrance | Matches (logo, notice board, light beams). Dim blue. OK. |
| Vance (ops) | Ops office | Matches (cabinet, kettle, microwave, coat stand). Night-blue. Good. |
| Cipher | Battery Hall 1 | Matches (brick, hazard sign, panel). |
| Relay | Battery Hall 2 | First frame (narrator line) is plain black; then the rack-bank background loads. Sign text is garbled ("WECK BALK 0", "PETION"). |
| Static, Voltage | Plant room | Matches, pink emergency glow. Good. |
| Vance after the alarm and in the debrief | Ops office | **The portrait is a coarse, low-resolution hooded figure** (looks like a stretched copy of the player sprite), not Vance. Background also becomes very coarse in the debrief. |
| HaX debrief | SAFETYNET office | Matches. Dawn light through the blinds. Sharp. |

## Scores

| Aspect | Score | Note |
| --- | --- | --- |
| Fun | 4 | The cards, print lifting, and the ESD gate were satisfying. Fights I could not play. |
| Pacing | 3 | Long walks between ops office and the plant (6 rooms each way); the clock and the alarm are strongest; the middle (workshop and VM) is a gap without a VM. |
| Clarity of goals | 4 | Objectives panel and the ESD message were very clear. Briefing dense; the clock unit and CyberChef are not clear. |
| Openness of decisions | 3 | Three real choices (tell Vance, sound the alarm, Voltage/disclosure) matter and show up; the Cipher and Relay choices converge on a fight. |
| Teaching | 3 | The physical-security beats teach well. Network and decode beats were not reachable in this run. |

## Severity table

| # | Severity | Finding | Repro (log lines) |
| --- | --- | --- | --- |
| M1 | major | Robert Vance's conversation portrait is a coarse hooded placeholder from the alarm decision onward, including the debrief. Persistent. | Alarm choice at 1443-1445; screenshots after; debrief near 2100 |
| M2 | major | Suspect engine: the CyberChef workstation was not reachable. The CyberChef guide opens a Lab Sheet viewer; a "Crypto Workstation" frame sat behind it, but closing the sheet closed both. No other object offered it. I decoded the Base64 card by eye. Evidence: two `.laptop-frame` elements after opening the guide; the plant-room command laptop only describes itself. | Guide opened ~1900-2000 |
| M3 | major | The red "H2 ADVISORY" clock counted 01:26 to 00:33 in about 90 seconds after the alarm, but HaX had said "about half an hour". The unit and the consequence of reaching zero are never shown. I never saw it expire. | Alarm 1443; plant-room entrance ~1560 |
| m1 | minor | Vance stays on a stale line after the mission ends: "Call the moment you're moving." | After ESD, ~line 2010 |
| m2 | minor | Hall 2 conversation starts on a black frame and the background text is garbled ("WECK BALK 0", "PETION"). | ~line 960 |
| m3 | minor | After a reload the player returns to the main entrance and has to walk back three rooms; the Cipher challenge repeats. | line 738 onward |
| m4 | minor | Phone: after HaX's last message the only reply shown is "On it.", which hides the guide menu until the chat is reopened. | ~1170 |
| m5 | minor | Map lighting does not read as night in most rooms (see above). | screenshots s03, s06, s07, s31 |
| m6 | minor | "Nightshade's reading" in the briefing is never explained. | briefing |
| m7 | minor | "neutralize_operative_cipher (opt)" stayed in the task list after he was down. | line 900 onward |
| m8 | minor | All four flags are accepted in any order with no sign of gating by the VM guides; I could not test whether that is intended in standalone. | 1144-1160 |
| m9 | minor | The ESD guard flap is only described as "Flip guard"; nothing on the text says it is clickable. | ~1757 |

0 blockers, 3 majors, 9 minors.

## Top three issues

1. M1: Vance's portrait is a broken placeholder after the alarm and in the debrief, which is where the best writing is.
2. M2: no way to reach CyberChef for the Base64 safehouse card, so the decode (which the debrief refers to) is not playable.
3. M3: the advisory clock contradicts HaX's "half an hour" and does not say what zero does.
