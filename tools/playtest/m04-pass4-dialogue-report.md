# m04 Critical Failure: pass-4 dialogue playtest report

Question answered: plumbing + reading the words (question 1, with a note on question 2 where the player wanders). Keyless server :3001, headless, fast speed. Route source: `scenarios/m04_critical_failure/PASS4_PLAYTEST.md` (route and reload point only).

Run A (quiet route): game 1410, log `tools/playtest/m04-pass4-dialogue-A-session.jsonl`. Screenshots in `scratchpad/m04-dlg-playtest/`.

## Findings log (written as I go)

### Opening briefing (fresh start)
- Plays in full on a fresh start before the Mission Brief notes panel. Order seen: cutscene narrator, Netherton, Nightshade, HaX hub, then Mission Brief, then the tutorial prompt, then the overworld. No empty lines, no "Name:" prefixes in the bubbles.
- Player choices echo as a `demo_player` bubble (engine behaviour for every choice, not only silent ones). Not a Narrator/"You:" prefix. Noted only so nobody counts it as a "You:" bubble.
- ESD is introduced in the briefing ("hardwired Emergency Shutdown button, the ESD") before any text uses it. Good. Mission Brief panel spells out "Emergency Shutdown".
- Flat spot: hub choice "[Right. What else should I know?]" (after the Critical Mass answer) plays the player line and returns to the hub with no HaX reply. Reads as a dead beat.
- "...whoever's holding the watch" (orders, HaX) is vague; I could not tell what "watch" referred to.
- Lines with prior-mission knowledge ("Remember the directive from the Zero Day job?") would be opaque to a player who skipped m03, but HaX does quote it in full.
- First timed text after the briefing arrives on the gate: "Gate first. Regulator badge, routine audit, came early. Then find Vance in the operations office." Clear.

### Gate guard (male_security_guard_v2)
- Sprite: peaked cap, dark uniform, white short sleeves, badge. Reads as a guard, clearly distinct from the hooded player. See s02_guard.png.
- Redundant: after "Where do I find Mr Vance?" he says "Operations office, straight down the hall. He'll be at his desk or in the control room…" and then straight after "Go on through. Operations office is straight down the hall." Same fact twice in a row.

### Vance in person (male_telecom_v2) and first texts
- Sprite: flat cap, hi-vis yellow vest, dark trousers, tool belt. Reads as a plant engineer, nothing like the hooded operatives or the player. Good (s03_vance_room.png).
- Opening line "A grid-safety audit at four in the morning. You regulator lot keep strange hours." Good, distinct, dry.
- Vance replies are plain and short ("Auditors get escorted, not carded."). The Vance cover route works: lean in -> cloner RFID read (Save) -> Narrator "The cloner buzzes once against your hip. Old prox. It didn't even have to work for it." Hooks: `vance_card_cloned`, `vance_provided_keycard` set; `find_infiltration_evidence` and `identify_scada_anomalies` became the open tasks.
- Weak: after the clone Vance's last line "Of course. And... if you find anything, come to me." / "This place is my responsibility. People depend on it." is the second time the "people depend on it" idea appears (he already said "keeps two hundred and forty thousand people on power"). Mildly repetitive.
- Phone (Agent HaX thread): no "Name:" prefixes, no empty bubbles. Hub choices read as the player. Opening text "Agent, status check. Are you inside the facility?" arrives even after I had met Vance (reads as a stale prompt), but "I'm in. Anything new from your end?" gets a clear next step ("First job: find how they got onto the SCADA network... The way on is the engineering workshop, off Battery Hall 1. Start there.").
- Entering Hall 1 text from HaX: "The workshop wants a Level 2 card. Vance hasn't got one. Relay has, and it's old prox, like his. She walks the inverter room." Clear, tells me what to do next.

### Thermometer / 61 call
- Reading the thermometer opens a HaX phone chat by itself ~3 s later (hook OK). Text: "Nightshade's got your sixty-one. His words: those cells are past safe, and the time we thought we had is gone, trigger or no trigger." then "The screens lie because they have to."
- AWKWARD: "Nightshade's got your sixty-one." has no unit and no object ("sixty-one what?"). A new player who didn't read the thermometer label closely won't connect it. "The screens lie because they have to." is cryptic with no setup on screen.
- Reply choice "Then where do I start?" -> "With how they're driving it. The workshop, off Hall 1." Then the normal hub (RFID guide / I need guidance / Nothing right now).

### HaX hub: "didn't know what to do" test
- "I need guidance" -> "What should I be doing right now?" -> "The engineering workshop, off Battery Hall 1. That's where they got onto the SCADA network." DOES NOT mention the workshop is locked or that you need Relay's card. A player who missed the Hall 1 text gets sent to a locked door.
- "I need guidance" -> "I'm stuck. Where do I look?" -> "I can't work out where to go next." -> "The workshop's off Battery Hall 1, and it wants a Level 2 card. Vance's only reaches Level 1. / Relay's in the inverter room, and she carries a workshop card. Hall 2 opens on Vance's." This is clear and fixed the gap. So two clicks deeper the dialogue does help.
- Moment 1 (didn't know what to do): after the clone I did not know whether Vance's clone was the objective for the Hall 2 door or where the cloned card applies. HaX's "Hall 2 opens on Vance's." (only in the stuck branch) is what says it.

### Cipher (in Hall 1, talked out)
- Opens "Hey. Hey! This bay's locked off for maintenance. Who signed you in?" Jumpy, handset out. Distinct: short, anxious.
- "Hall 2 is venting..." -> Narrator "It lands. His eyes go to the hydrogen panel over your shoulder, and the handset stops moving." -> "That panel's amber. That panel is not supposed to be amber." -> "So what happens now?" Good beat.
- "Whatever Voltage told you this was, the racks vent hydrogen. People die." -> "Nobody's in the halls at night. That's the whole point of doing it at night." -> Narrator "He says it like a line he has been given, and not one he has checked." The Narrator line is a "like X, and not Y" shape. Reads a bit written.
- "There's a night crew in Hall 2. Go and look." -> "...You're lying." / "If you're lying, I'm coming back for you." / he clips the handset on unradioed and walks out. `cipher_walked` set. No fight.

### Reload (F5 equivalent: `location.reload()` after sync)
- No briefing or intro replay. Title screen then the Mission Brief notes panel opened again (closed it via bootstrap: trace `close title-screen`, `close notes`). The Mission Brief re-opening on every reload may be intended; it is one more click.
- After reload the player respawned at main_entrance (160,144), not in Hall 1. The PASS4_PLAYTEST note says "Back in Hall 1". Rooms stayed unlocked and I walked back (operations -> SCADA -> Hall 1). Cipher still gone; `cipher_walked` still true; inventory intact. Suspect engine (room not restored on reload), evidence: state after reload `room: main_entrance`.
- No HaX text repeated on re-entering Hall 1 after reload.

### Vance late reveal and phone
- Hub on re-talk shows only the three choices with no spoken line (speaker null, empty text, no "None:" prefix). Reads as a bare menu over his portrait; fine but there's no greeting. Portrait is the hi-vis bust, not the hooded silhouette (s08_vance_hub.png). Fixed.
- Reveal path: Narrator "You drop the cover and tell him who you work for..." -> "...What?" / "ENTROPY. Here. In my plant." -> "My God. Two hundred and forty thousand people on this grid." -> "How long have we got?" Good, blunt.
- Flat/odd: "What do you need from me?" then, in the same speaker's next bubble, "Access, the SCADA side, whatever you need." He asks the question and answers it himself, so it reads as two stitched lines. Then "Not on my site. We're stopping this." is good.
- Hooks: `vance_is_ally`, `vance_phone_available` set. His phone contact appears after the chat closes (not during). Avatar is the hi-vis pixel headshot (s09_vance_phone.png). Good.
- Redundancy: Vance's phone opens with "It's Vance. I'm on the ops desk with the historian up, and on comms if you're moving..." and immediately after "Agent. On the ops desk, both screens up." Same fact twice in a row.
- Voice: Vance phone "The historian has the cells past sixty and climbing. My screens still say twenty-eight." / "They've set it for 0800, but cells that hot don't wait for a clock." Plain engineer. Distinct from HaX. His "What should I be doing right now?" answer "Find out how they're driving the SCADA network. Everything waits on that." is almost HaX's own wording.
- Notification toasts carry "Agent HaX: ..." / "Robert Vance: ..." prefixes. That's the toast UI, not a bubble. The bubbles in the threads have none.

### Relay (Hall 2, clone route)
- Entering Hall 2 opens her chat by itself. Narrator "She comes round the end of the inverter cabinets mid-stride and stops dead." -> "Inverter room's closed. Has been all week."
- "Radio. Down. Now." -> Narrator "Her hand stops halfway. She weighs it, and leaves the radio where it is." -> "Easy." -> "You're not getting to those rack banks." Clean and clipped. Relay sounds like a controlled, cold professional.
- Clone choice "(Keep her talking. Step in close enough for the cloner to find her card.)" -> Narrator "You let her talk and drift closer while she does, until the cloner on your hip is a hand's width from the card on her belt." -> RFID read (Save).
- ANSWERS SOMETHING NOT SAID: after the clone Narrator "The cloner buzzes once. She hears it." Relay: "...Was that what I think it was?" then, with no player reply between them, "Then you'd better be quick." The second line answers an answer nobody gave. (Both lines are in one run of continues.)
- Hooks: `relay_card_cloned` true, `neutralize_operative_relay` complete, chat closes, I retreated west with 100 HP (no hit). HaX texts after: "And that plant-room door is biometric. Picks and cloner won't touch it. Somebody got through it on the ninth, though." then "Card's yours. She knows, and she'll walk that hall faster now. She won't chase far. Cross when she's at the far end." Order is backwards: the biometric text lands before the "Card's yours" confirmation, so the second reads like a delayed reply. "on the ninth" is unexplained for a new player.
- The Level 2 card showed in the cloner under "Saved" as "Workshop Card Level 2"; Emulate at the workshop door opened it. Hall 2 opened on Vance's saved Level 1 card. Both hooks OK.

### Workshop
- HaX texts: "You're on the OT network. The BMS jump server is their way in; scan it from the terminal. Four flags make the case: status page, FTP drop, distcc foothold, root." then 6 s later "I've guides for mapping the network and reading its attack surface, if you want them. And that OptiGrid case under the bench is theirs. Open it." Clear on what to do. (Toasts were visible on screen; they were not in the thread when I read it within ~14 s of entering. Re-read later.)
- Tool case: lockpick minigame, completed assisted. Contents: Fingerprint Kit + OptiGrid Job Card #4782 (back page). Kit text on pickup: "The crew's fingerprint kit, with our file prints for the cell on their cards. It's how they beat the plant reader. Lift Vance's print now, while nothing's counting down."
- AWKWARD: "with our file prints for the cell on their cards" is hard to parse (whose file prints? on whose cards?). And "while nothing's counting down" contradicts Nightshade's "the time we thought we had is gone" and Vance's "cells that hot don't wait for a clock" earlier in the same run (the advisory timer only starts after the flags).

### Plant door, Voltage (quiet route: stealth then "let him run")
- Relay patrolled y=461 between x~1452 and x~1758 at roughly 100 px per 1.5 s. Each of my three crossings (to the plant door, back out, in again) started when she was at x>1650; she never touched me (HP 100 throughout, no hit, no waiting beyond one poll). Fingerprint reader opened on the lifted Vance print (quality 73%). The dusting steps worked (silver powder on black glass, 3 passes, tape pressed 100%). The "compare" step I took from `debug.correctCandidate` (loop vs two cards), so the identification is **exercised, not earned**.
- HaX print text arrived after the lift: "That's Vance's print. He leaves it on every panel he touches, and the reader in Hall 2 can't tell a lift from a living thumb." Good.
- Reader overlay carries the Touch ID 2013 line. Good, short.
- Voltage opening: "You're good. Better than the usual SAFETYNET drones." / "Sneaky approach. I respect that." / "But you're late. This place has no security worth the name, and we've had three days in it." The first two are stock-villain lines; "SAFETYNET drones" and "Sneaky approach. I respect that." are flat.
- "Bold. Conviction never stopped an attack." / "One keystroke. That's all it takes." / "One keystroke and it's now. The racks go critical, the hall burns, and the grid drops by noon." Two "One keystroke" back to back; "by noon" doesn't fit the 0800 trigger every other line gives. "Your move, agent." is a cliche.
- Ideology beats are the strongest writing in the mission: "Two hundred megawatt-hours in a shed on a floodplain, holding up a city that never asked whether it should." / "We didn't make it fragile. We just stopped pretending it wasn't." / "I know it to one decimal place." / "I came *because* of it." The last line shows literal asterisks in the ink (`m04_npc_voltage.ink:210`); I did not confirm on screen whether the UI italicises them (the dialogue text field returned the asterisks).
- Stray emote: Voltage "*already moving* Good. That's the right call." (let-him-run branch). That is a standalone `*emote*` inside a spoken line, plus Narrator "he goes the other way, for the dock door, and that tells you exactly how he had this ranked" ("--" double hyphen in the same Narrator line).
- Narrator "He answers without hesitating, and without looking away from you, which is the part you will remember." is the kind of line the review was meant to cut.
- Hook: "Go for the button" -> `voltage_neutralised` and `voltage_escaped` set; Voltage left the room (only Static remained, not hostile, no fight). `neutralize` tasks: `confront_voltage` complete.
- ESD refusal text before the VM (with `voltage_neutralised` but no `attack_mechanism_known`): "NOT ARMED. GRID PERMISSIVE NOT RECEIVED. Grid control has the hazard, not the cause. The proof is on the workshop jump server." Clear.

### DIDN'T KNOW WHAT TO DO (dead end) and a hook problem
- After submitting all four flags the ESD still said "NOT ARMED... The proof is on the workshop jump server." I had already done that. Cause: the aims are chained (`confirm_the_lie` -> `reach_the_workshop` -> `map_the_attack`), and `find_infiltration_evidence` ("Search for evidence of unauthorised access") was still open, because I never read a work order, the workshop access log or the camera log. `map_the_attack` showed all tasks completed but the aim stayed `locked`, `attack_mechanism_known` never set, ESD never armed. Nothing in a text or in HaX's hub told me an evidence document was outstanding; the one line that does ("That work order was never authorised...") only fires when you read the work order. The ESD text then points at the workshop jump server (already done), which is misleading in this state. Repro: do everything except read the Maintenance Work Orders / Workshop Access Log / camera log, submit four flags, press ESD at the plant room. Reading the Workshop Access Log fixed it at once (`evidence_access_logs_found` set; `attack_mechanism_known` set; "He's out of the way, the 61's confirmed and the attack's on record. Grid control's standing by. The ESD is live. Press it." arrived once).
- Suspect design gap, not just my play: the Objectives panel did show the open sub-task the whole time, but the phone dialogue's "What should I be doing right now?" did not mention it.
- ESD armed text: "the 61's confirmed" again has no unit.
- After the ESD guard-flip + confirm, the debrief opened straight on "Agent HaX: Agent, report." with no Narrator beat for the shutdown.

### Debrief (disclosure = full, quiet route, Vance ally)
- Opens with the report choice; "Shutdown engaged before the racks went. Banks isolated, hall intact." -> HaX "Clean. Runaway aborted before a single cell vented. Banks isolated." Grading words gone. Good.
- WALL OF TEXT: after the first choice HaX speaks 15 consecutive bubbles with no player input (from "Clean..." to "Encrypted cards. A second factor on the HV door, and a reader that checks for a live finger...."). The what-failed beat itself is good ("A print names you. It can't prove you're the one standing there."), but the stretch before it ("Vance says...", "Voltage is out through the dock.", the intelligence/directive paragraph, "Voltage is gone, so the paper will have to talk.", Cipher) is a lot of reading before the first choice.
- "Voltage is out through the dock." is said twice: the first choice option text and then HaX "And Voltage is out through the dock."
- Quiet-route consistency: "You did it to Relay too, while she was talking." is right for this route. "Cipher went to look at the night crew and kept walking. Police picked him up on the access road. He's talking." is right.
- "But..." as a line on its own, then "How do we handle this publicly?". A fake transition.
- "Approved." / "Decision recorded." reads like system boilerplate in HaX's mouth.
- Vance debrief: "It'll hurt us. People should still know how close it came." / "You did right by this place." / "I'll not forget it." / "We've run this place on hope and gaffer tape for years. That stops on my shift." Good, distinct, northern.
- End: "Get some rest, Agent." / "Voltage is out there. So is The Architect." / "And not one of his crew on the floor. Harder than it looks." / "Sleep. I'll call." Fine. "And not one of his crew on the floor" is a quiet-route-only claim but Static was never fought; consistent here.
- Credits (`bv-stage`) came up, `missionEnd.creditsShowing: true`. Task list empty.

### Sprites
- Vance (male_telecom_v2): in person reads as a hi-vis plant engineer; dialogue bust is a proper portrait; phone avatar is the hi-vis pixel headshot. Differs clearly from every hooded operative. 
- Gate guard (male_security_guard_v2): peaked cap, uniform, badge; clearly a guard, clearly not an operative. Good.
- Observation (not asked): Cipher, Relay, Static and Voltage all use red hooded sprites; in the plant room Voltage and Static are the same sprite and Voltage's dialogue bust is a faceless red hoodie (s13_voltage.png), so they only differ by name label.

## Run B: fight route up to Voltage (game 1418, log `tools/playtest/m04-pass4-dialogue-B-session.jsonl`)

Fights were `debugKO` (Cipher, Relay, Static): **PASS (assisted), combat not played**. Dialogue before and after each is real. Run B stopped after the arrest.

- Briefing fight choice "Stop the trigger, and bring Voltage in alive if I can." -> HaX "That's the order." (bare). Orders branch "If it comes to it: stop the attack, or take Voltage?" -> "The attack. Eleven people on site, and everyone on that feed. / Take Voltage if you can... / But if he goes for the trigger, stop him any way you have to. Lives first. Intelligence second." Clear.
- "I'm ready. What's the target?" skips straight to the same hub with no extra information. A new player picking it learns nothing about the target (it just re-shows the hub).
- Guard skipped on purpose: walking from the entrance to the operations office without talking to the guard still completes "Get past the checkpoint" (the door is unlocked, `enter_facility` completes on entering). The guard's "slip past" choice is therefore decorative.
- Vance via "Just doing the job, Mr Vance." -> "Right. I run a tight ship here, budget and all. / Tick your boxes and let's be quick about it. I've a plant to keep running." -> "Tell me about the recent maintenance work." -> "OptiGrid came in on the ninth, control-system upgrades. / Cards worked, they quoted an order number. I've still not found the order." That is where "the ninth" is explained; HaX's later "got through it on the ninth" only makes sense on this path.
- Reply that doesn't follow: player "Just being thorough." (after asking for the access logs) -> Vance "Auditors get escorted, not carded. When the shift settles I'll walk you round myself." It answers a request for a pass nobody made.
- Cipher with "Albion contracted me for the thermal survey. Check your list." -> "There's no survey tonight. And you came in the wrong door for one." / "Voltage, Hall 1. We've got a live one." / Narrator "The handset squawks once and goes dead. He drops it and squares up." / "You picked the wrong facility." The last is stock.
- Relay on a hostile entry: Narrator "She's already facing the door when it opens, one hand resting on the radio." / "Cipher said we had a live one. That'll be you." (it was said on the radio to Voltage, so she overheard; fine) / "You're not getting to those rack banks." Then "Walk away. I'm not here for you." -> "No. You're really not." / "Last chance to be somewhere else." -> "Then we do this the hard way." The chat then closes on the player's line with no Relay reaction or Narrator beat before the fight.
- After Relay's KO: the phone opened by itself with "Relay's down. I've pulled her Level 2 number off the reader logs and pushed you a copy. That's the workshop." Item `Workshop Keycard (relayed copy)` in inventory. Workshop door opened on it with no prompt. Relay also dropped `Workshop Keycard (Level 2)` and `OptiGrid Operations Log` in Hall 2. Hook OK.
- Optional second print: dusted the BMS Interlock-Bypass Module (black granular on pale), reference cards Cipher / Voltage; Voltage matched. `voltage_print_on_bypass` set; HaX: "Voltage's own thumb, on the bypass module. Whatever else he says tonight, that puts his hand in the cabinet." Good. (50/50 between two cards, no visible comparison available to me.)
- Voltage opening on the fight route: "You're good. Better than the usual SAFETYNET drones. / You put three of my people down. Impressive. / But you're late..." (the 'three' pays off). After "Make me understand it first" -> "Who is The Architect?" -> "The Architect? You'll never find him... Above him it stops being a person you can arrest." -> Narrator laptop/button line -> "So. The button, or me. / Static's down. So it's you, me, and one keystroke."
- Contradiction: choosing "Step away from the bench. You're under arrest." gives Narrator "He looks at your hands, then at the door behind you, and does the arithmetic he has done all night." then Voltage "Static's down, isn't he." He has just said "Static's down." two bubbles earlier, so the question reads as forgetful.
- Arrest outcome: "Your thumb's on the bypass module. Blackout signed, you countersigned. Tell that to a court." -> "...A court. Fine. A court can have the number too." / Narrator "He steps back from the bench with his hands open, and lets you take the laptop off it." Globals `voltage_neutralised`, `voltage_captured` set. "A court can have the number too" is cryptic ("the number" of what?).
- "I respect that" appears in two Voltage openers ("Sneaky approach. I respect that." / "Professional to the end. I can respect that."), a verbal tic, but it's two different branches so only a re-player sees both.
- HP: 88 on arrival in Hall 2 with Cipher KO'd by `debugKO` and no combat played. I did not see what took 12 HP (no fight in this run). Not investigated.

## Hook check (both runs)

| Hook | Result |
|---|---|
| Briefing plays in full on fresh start, then Mission Brief, then tutorial prompt | OK (A). `briefing_played` set |
| `enter_facility` open at spawn, completes on entering the operations office | OK (A, B) |
| Vance clone: `vance_card_cloned`, `vance_provided_keycard`; Level 1 card opens Hall 2 | OK (A, B) |
| Thermometer read -> HaX chat opens ~3 s later, `anomaly_detected` | OK (A) |
| Cipher talked out: `cipher_walked`, gone after reload | OK (A) |
| Late reveal: `vance_is_ally`, `vance_phone_available`, phone contact + avatar | OK (A) |
| Relay clone: `relay_card_cloned`, `neutralize_operative_relay` complete, workshop opens on emulated Level 2 card | OK (A) |
| Relay KO: relayed card by phone + item | OK (B) |
| Tool case -> Fingerprint Kit + Job Card, `fingerprint_kit_found` | OK (A, B; lockpick assisted) |
| Vance print lift -> `vance_print_collected`; plant door reader opens; "Get into the plant room" task | OK (A, B) |
| ESD refusal text variants | "mechanism" variant seen (A); see dead end below |
| Four stand-in flags accepted, tasks `scan_scada_network`..`submit_privesc_flag` complete | OK (A) |
| ESD armed once the flags land | **Only after reading an evidence document**; see "dead end" |
| Armed text arrives once ("Grid control's standing by. The ESD is live. Press it.") | OK (A), once |
| H2 advisory timer (07:50 ticking) | Seen on screen (A) |
| ESD press -> debrief -> credits (`missionEnd.creditsShowing`) | OK (A) |
| Reload: no replay of briefing/intro | OK; but player respawns at main_entrance and the Mission Brief reopens (see Reload) |
| "Eleven people", "all three of his crew down" etc. | Voltage "three of my people" OK (B); the debrief "all three of his crew down" was not reached (A was a quiet route) |
| Not reached | Static fight, Voltage "You put three" in the debrief, no-kit plant-door refusal text, 6-minute advisory path, RFID/ProFTPD guide requests, closing disclosure variants other than "Full" |

## Earned-secrets table (Run A, game 1410)

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Vance Level 1 card | cloned (item in cloner) | Vance, "Lean in..." choice + cloner read | A step 8 | yes |
| Relay Workshop Card Level 2 | cloned | Relay, "(Keep her talking...)" + cloner read | A step 21 | yes |
| Tool case lock | assisted `completeLockpick` | Lock Pick Kit (briefing) | A step 24 | **no, assisted (dexterity minigame)** |
| Vance print (plant door) | lift quality 73% | Hall 1 duty panel, Fingerprint Kit from the tool case, Job Card #4782 clue + HaX print text | A step 27 | yes for the lift; **the "which card" compare step used `debug.correctCandidate`** so the identification is exercised, not earned |
| ESD-arming evidence (`evidence_access_logs_found`) | Workshop Access Log | read in the workshop | A step 40 | yes (after the dead end) |
| `bms_jump_server:flag_1..4` | `<flag:1>`..`<flag:4>` | In-game prerequisite is the VM work; none exists in standalone | A step 36 | **no, exercised, not earned**. Everything downstream of the flags (ESD arming, debrief) is exercised, not tested for solvability |
| Voltage's print on bypass (B) | matched "Voltage" | BMS module, black powder | B | guess between two cards (no visual comparison attempted) |
| Fights (B) | `debugKO` | n/a | B | **no, assisted** |

## Moments where I didn't know what to do, and whether the dialogue helped

1. After cloning Vance, whether Hall 2 was the next target. HaX's "I'm stuck. Where do I look?" -> "I can't work out where to go next." answered it ("The workshop's off Battery Hall 1, and it wants a Level 2 card... Relay's in the inverter room... Hall 2 opens on Vance's."). Helped, but it is two menus deep. The front-line "What should I be doing right now?" answer says only "The engineering workshop, off Battery Hall 1" and never mentions the locked card.
2. The 61 call. "Nightshade's got your sixty-one" did not say what 61 was. Dialogue did not help me connect it to the thermometer.
3. ESD stayed "NOT ARMED" after all four flags (evidence task unread). Dialogue misled: "The proof is on the workshop jump server." No hub line mentions the open evidence sub-task. **This was a real dead end.** I solved it by looking at the Objectives panel.
4. Phone HaX hub option "I'm on the OT network. What am I looking at?" appears even after the flags were all submitted; the reply is pre-flag text and the follow-up options say "There's a terminal here into the SCADA backup server." (the terminal is the BMS jump server).
5. Reload put me at the entrance with no hint that I was no longer in Hall 1 (not dialogue, but I needed a text to say where I'd been).
6. ESD explained before use: yes. The briefing defines it ("hardwired Emergency Shutdown button, the ESD"), the Mission Brief spells it out, Vance and HaX texts use it after. No text used "ESD" before the briefing defined it.

## The ten worst lines (as heard on screen)

1. Voltage (let-him-run branch): "*already moving* Good. That's the right call." Stray stage direction inside speech.
2. Voltage (same beat) Narrator: "You break for the wall. He does not try to stop you -- he goes the other way, for the dock door, and that tells you exactly how he had this ranked." Double hyphen, "that tells you exactly how..." is a tell.
3. HaX text after the 61 reading: "Nightshade's got your sixty-one. His words: those cells are past safe, and the time we thought we had is gone, trigger or no trigger. / The screens lie because they have to." No unit, no object, cryptic second text. (Same "the 61's confirmed" in the armed text.)
4. HaX kit text: "The crew's fingerprint kit, with our file prints for the cell on their cards. It's how they beat the plant reader. Lift Vance's print now, while nothing's counting down." Garbled first sentence, contradicts "the time we thought we had is gone".
5. Relay after the clone: "...Was that what I think it was?" then "Then you'd better be quick." With no player line between them the second answers nothing.
6. Voltage: "One keystroke. That's all it takes. / One keystroke and it's now. The racks go critical, the hall burns, and the grid drops by noon." Repeats itself and "by noon" disagrees with 0800.
7. Voltage opener: "You're good. Better than the usual SAFETYNET drones. / Sneaky approach. I respect that." Stock villain.
8. Voltage (arrest beat): Narrator "He looks at your hands, then at the door behind you, and does the arithmetic he has done all night." then "Static's down, isn't he." (he said "Static's down." two bubbles earlier).
9. Debrief: HaX "But..." as its own line, then "How do we handle this publicly?"; followed by "Approved." / "Decision recorded." Fake transition and system boilerplate.
10. Voltage Narrator: "He answers without hesitating, and without looking away from you, which is the part you will remember." Close second: Cipher Narrator "He says it like a line he has been given, and not one he has checked."

Honourable mentions: Vance "What do you need from me? / Access, the SCADA side, whatever you need." (asks and answers himself); Vance phone "It's Vance. I'm on the ops desk with the historian up..." immediately followed by "Agent. On the ops desk, both screens up."; guard "Operations office, straight down the hall... / Go on through. Operations office is straight down the hall."; HaX orders "whoever's holding the watch"; Voltage "A court can have the number too."

## Voices: do they sound distinct?

- HaX: warm, direct, plain nouns ("Clean. Runaway aborted before a single cell vented."). Distinct. Weak when she narrates plot in blocks (debrief) or uses boilerplate ("Approved. Decision recorded.").
- Vance: northern, engineer, short ("Not on my site. We're stopping this." / "gaffer tape"). Distinct from HaX, except his phone "What should I be doing?" answer, which borrows HaX's phrasing.
- Voltage: best writing when he argues (floodplain, "one decimal place", "I came because of it"). Weakest in the openers and his stock lines.
- Relay: cold, clipped, professional ("Easy." / "Inverter room's closed. Has been all week."). Distinct.
- Cipher: jumpy, repeats himself ("Hey. Hey!", "That panel's amber. That panel is not supposed to be amber."). Distinct and good.
- Nightshade (briefing only): "The physics doesn't lie and neither do I." Three short lines, distinct enough, but he speaks twice and then vanishes.

## Verification (full output)

Run A, game 1410:
```
game            1410  (mission 48)
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
flags submitted 4 (stand-ins)
VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```
Run B, game 1418:
```
game            1418  (mission 48)
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
flags submitted 0
VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 0 flags submitted.
```
Both sessions ended with `{"cmd":"sync"}` then `session-stop.sh`. No stray browsers of mine left (checked with ps).
