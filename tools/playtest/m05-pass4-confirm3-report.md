# m05 Insider Trading: pass-4 round-3 confirmation (Run F + detective game)

Source of steps: scenarios/m05_insider_trading/PASS4_PLAYTEST.md, "Round 3 confirmation, Run F". Route taken from scenarios/m05_insider_trading/TESTING_WALKTHROUGH.md (route only; no ink or erb read for clue content, one grep of the erb for the Torres-door bark text after the fact).
Question answered: plumbing plus the player-experience of the whodunnit (not solvability: flags are session-supplied stand-ins, no VM).
Server: keyless :3001. Headless (load average about 30). Scratch: scratchpad/m05-confirm3/.

## Game F (game 1422)

Session log: tools/playtest/m05-pass4-confirm3-F-session.jsonl. Briefing driven by hand (no bootstrap).

### Run log (appended as I go)

| # | Step | Result | Evidence |
| - | ---- | ------ | -------- |
| F0 | Briefing by hand, HaX sprite | PASS. HaX says "A badge at an odd hour. Money that doesn't add up. Someone who's changed. And don't take anyone's hunch for proof. Patricia's included." HaX portrait is the female spy (hat, trench coat). | scratch 01-briefing.png |
| F1a | Patricia suspect list | PASS. "Halloran's been fighting the CEO to publish the research. Ben's asked twice about a pay review. Torres has been distracted." Motives spread across three; Torres has the vaguest one. | log |
| F1b | Flyer | PASS. "one of our colleagues has a family member who is very unwell". Names nobody. | notepad copy |
| F1c | Owen odd-hours answer | PASS. Halloran lives in the lab; Ben "always behind, always skint"; "someone from crypto in the server hallway... looking wrecked. Didn't get a proper look." No name. Owen's hub had no Torres office ask. | log |
| F4 | Torres office door before suspicion | PASS. HaX text: "Office keycard. IT holds a spare for every office. You'd need a reason Owen can write in his log." (door opens RFID flipper first because the cloner is carried) | scratch 03b-torres-door-msg.png |
| F2a | Vetting files before the log | Refused: "Vetting files are restricted. Bring me a name or a pattern" (as Run D). | log |
| F2b | Badge log from Owen | PASS. Owen's pencilled note covers Amara and Sunday only; Ben's Thu 24 Sep 20:05/20:11 is unexplained. | notepad note 3 |
| F2c | Vetting files after the log | PASS. Both files arrive ("Two names on Owen's sheet... Neither one's tidy"). "Find Out Why" aim still locked; `torres_suspected` false; HaX thread has no "Torres is buried in debt" topic; to-do wording unchanged ("Find out who on the team is under pressure"). | todo dump |
| F3a | Phone naming menu | PASS. Bare names: "Dr Ruth Halloran." / "Ben Ashworth." / "David Torres." / "I've got a feeling. Nothing I can show you yet." | ph dump |
| F3b | Ben | PASS, no cost. "Thursday at eight? The transfers run two till four, and he logged it with Owen. Try again." | log |
| F3c | Torres + decoy "His own badge is on the server hallway those nights." | PASS. Reason menu is document-based (log decoy, strain, front-door, money, cryptography lead), log reason is third. Decoy answered "Read it again. His badge never touches the server hallway. Hers does." and the phone chat closed. | log |
| F3d | Ring back, Torres + front door reason | PASS. "That's a pattern... It's enough to look in his office. I'll tell Owen you can have the spare." "Find Out Why" opens; first task "Get IT's spare card for his office". Globals: door_log_reasoned, torres_suspected, patricia_authorised_office. | scratch 04-find-out-why.png |
| F3e | Owen office ask / card | PASS. After the partial accept, Owen's hub gains "I need into David Torres' office."; "IT's spare. I hope you don't find anything."; inventory gets "IT Spare Office Card". | log |
| F5a | Torres office: journal, mug dusted (fingerprint kit), Torres' print logged | PASS (print step driven with debug printCentre, so exercised). Briefcase skipped (optional). | session log |
| F5b | Clone Owen's badge, IT notice, then Owen's password ask | PASS. "The server room wants a password." appears only after the notice; Owen: "Patricia signed off David's office, not the server room" then gives the sticky note (earned). | log |
| F5c | Server room, flags 1-4 (session stand-ins, "exercised") | PASS. Flag 1 ticks "Get into the research portal" (not the launcher). | todo dump |
| F5d | Texts after flag 3 | PASS. "Third flag verified. His staging manifest, under his own name..." showed by +5 s; "That's both halves: why he'd do it, and proof it's leaving the building. Patricia will act on that. Call her." showed between +8 s and +10 s. Spaced, not stacked. | scratch 05-flag3-*.png |
| F5e | Vault: fingerprint reader takes the logged Torres print | PASS (reader list showed "David Torres, Quality 76%, Identified"). | log |
| F5f | Full naming by phone (both halves) | PASS. No reason menu and no "[And the badge log...]" choice, because the log was already reasoned. "...Damn. I sat three desks from him at the Christmas party." then "Stop him first. Then finish whatever you were doing on that research server." (flags outstanding). | log |
| F5g | Recruiter text vs HaX text | PASS. Chat closed 09:08:04; Recruiter text on screen by 09:08:08; HaX "That TalentStack number is the Recruiter. Hear her out if you want. Just don't give her anything." on screen between 09:08:15 and 09:08:17. About 8-10 s apart. I did not ring back. | scratch 06-recruiter-*.png |
| F5h | Confrontation | PASS. "The vault logged me in twice tonight. One of them was you." Torres mentions "Patricia's file" and "my journal" (both read). Sympathetic route ("They played you" -> "What did they tell you it was for?" -> "You wrote 'what have I become'" -> "Work for us") reaches "Pull the drive myself" and the conversation closes. Bills dollar figure not asked (briefcase skipped). | log |
| F5i | Debrief | PASS. "You read the badge log properly. Her spare on the server hallway, his badge on the front door six minutes before, every night." Warning-sign recap lists Money, Hours, An approach (leaflet), boss who told Security to stop asking (found only these). | scratch debrief.txt |
| F5j | Credits from DOM | PARTIAL. Credits are a single `#bv-cr-label` element changing every ~3.5 s, not static DOM text. I attached my observer too late in game F and only caught "── QUANTUM DYNAMICS ──", "WHO STOPPED THE INTERVIEW — never asked", "The Architect remains at large...". Screenshot caught "Treatment paid for by SAFETYNET — first dose Monday". Reloading the page after the mission ends shows the visualiser but does not replay the credits. NEVER HEARD HER OFFER / BORROWED BADGE therefore NOT confirmed in game F; see game G. | screenshot 07-credits-a.png |

Tasks: after the confrontation the to-do list shows confront_torres, make_critical_choice, hear_debrief as expected. Not exercised in game F: Halloran, the lanyard, the "Half this building has someone ill at home." line, Lisa's "What have you noticed lately?".

### Earned-secrets table (game F)

| Secret | Value used | In-game source | Obtained at | Earned? |
| ------ | ---------- | -------------- | ----------- | ------- |
| Visitor badge | (item) | Patricia, dialogue | F1 | yes |
| Badge-log reader card (Owen's badge) | cloned | Owen's lanyard via the "Lean over" choice | F5b | yes |
| Server Hallway Badge Log | (item) | Owen, "Patricia's log has a crypto badge..." | F2b | yes |
| Vetting files | (items) | Patricia, after the log | F2c | yes |
| IT Spare Office Card | (item) | Owen, after the reasoned naming | F3e | yes |
| Server-room password | `quantum2024` | Owen's sticky note (after reading the IT notice) | F5b | yes |
| Torres' fingerprint | (print) | Mug in Torres' office, fingerprint kit | F5a | yes (the find step used the harness debug printCentre) |
| `qdc_research_server:flag_1..4` | `<flag:1..4>` | Not earnable standalone | F5c | **no**, session stand-ins; everything after the flags is exercised, not proven |

Verify: tools/playtest/m05-pass4-confirm3-F-verify.txt

```
VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```
(game 1422, 9 rooms unlocked, 19 inventory items, 43 globals; full output in the file above.)

## Game G: detective feel (game 1430)

Session log: tools/playtest/m05-pass4-confirm3-G-session.jsonl. Verify: tools/playtest/m05-pass4-confirm3-G-verify.txt ("VERDICT: progress recorded — 9 rooms beyond the first, 1 objects unlocked, 4 flags submitted"). Briefing by hand again (fast branch, "Adaptive" approach). In-game clues only; the only file I opened was a grep of the ink for the text "someone ill at home" to learn which character says it (Patricia in person/phone, HaX phone), then I triggered it in play.

### Detective timeline (wall clock; game start 09:16:01)

| Clock | Clue | Effect |
| ----- | ---- | ------ |
| 09:17 | Patricia's suspect list: Halloran (CEO row), Ben (pay review), Torres ("distracted") | Three equal-ish names. No lean. |
| 09:18 | Flyer: "one of our colleagues" | Nobody. |
| 09:18:25 | Lisa, "What have you noticed lately?" (first thing asked): "David Torres especially. He looks like he's carrying something heavy, all the time." Then "Tell me about David Torres" (crying in the car park, "someone keeps ringing his desk phone. He takes it in the stairwell"), "his wife" ($380,000). | **First strong lean to Torres, about 2.5 minutes in, before any hard evidence.** Motive and behaviour only. Leaflet in the break room ("R. CALLED AGAIN. RETAINER + THE DEBT") adds money. |
| 09:19:22 | Owen odd-hours: Halloran and Ben named; no Torres. (In this game the "someone from crypto in the server hallway... looking wrecked" line did not appear; it did in game F. The difference: F asked "What can you tell me about the breach?" first; G took "Point me at the logs".) | Neutral. |
| 09:19:34 | Badge log: Torres #4408 on the main entrance six minutes before Halloran's spare, four nights. | **Hard evidence. Torres is the working suspect here (about 3.5 minutes in).** |
| 09:20:16 | Halloran: spare on a hook; in Zurich on the 23rd; "David, mostly... Oh. Oh, no." | Confirms. Halloran cleared. Torres obvious. `torres_suspected` stayed false (Find Out Why stayed locked). |
| 09:22-09:23 | Phone naming with the reason menu (no vetting file yet, so no "Money" reason; "Halloran says..." reason present). Strain: "Half this building has someone ill at home. That's not evidence." (chat ends). Cryptography lead: "So would seven other people." (chat ends). Halloran's word: accepted, "Her word, about her own badge. It's enough to look, not to act." | Find Out Why opens on the third. `door_log_reasoned` stays false. |

Answer to "when does Torres become the obvious suspect, and is it after the badge log?": in game F (Patricia, flyer, Owen's odd-hours answer, badge log, vetting files) nothing pointed at him until the badge log, and even then the log plus the files made him a strong candidate, not a certainty; the reasoned naming did the rest. In game G, asking Lisa first made him the leading suspect on motive about a minute before the badge log. So: the badge log is when he becomes the suspect the evidence supports, but Lisa's opener can name him earlier on hunch alone. If the intent is that nothing names him before the log, Lisa's "What have you noticed lately?" ("David Torres especially...") is the one remaining early pointer (plus her tin answer, which says it outright). Patricia's own reply to that hunch is correct: strain is not evidence.

### Checks in game G

| # | Step | Result | Evidence |
| - | ---- | ------ | -------- |
| G1 | Reason menu shape | PASS. Torres reasons: log decoy (first), strain, Halloran's word (only after asking Halloran), front-door times, cryptography lead; "Money" only appears after the vetting file (not in game G, present in game F). The log reason is never first. | ph dump |
| G2 | Wrong reason ends the conversation | PASS for log decoy (F), strain, cryptography lead (G): the phone chat closes and Patricia's reply is in the thread. | log |
| G3 | Strain line | PASS. "Half this building has someone ill at home. That's not evidence." | thread |
| G4 | Full naming without a reasoned log | PASS. After the call: "And the badge log. Look at the main-entrance times." choice shows (not reasoned). Picking it: "...Six minutes before her spare, every night. You did read it properly." | ph dump |
| G5 | Torres' confrontation | PASS. "You've seen the bills, then... Three hundred and eighty thousand dollars." (briefcase read; dollar figure only then). "Hold him" branch: "I'm not police, David... Patricia is calling them." Cancel-it ending closes the conversation. | log |
| G6 | Debrief | PASS. Approach line "You said you'd read the room. You did." (Adaptive); badge-log line present; "You held him and Patricia called the police."; warning-sign recap lists money, hours, approach (leaflet). | scratch debrief2.txt |
| G7 | Credits read from the DOM while they play | **PASS.** `#bv-cr-label` changes every ~3.5 s; a MutationObserver on document.body collected: MISSION COMPLETE / INSIDER TRADING / OPERATION SCHRÖDINGER: STOPPED / ── THE CASE ── / MOTIVE, MEANS AND AUTHORISATION — all on file / **BORROWED BADGE — Halloran's spare traced back to Torres** / ── DAVID TORRES ── / HANDED TO THE POLICE — said nothing / ── ELENA TORRES ── / Still fighting Stage 3 cancer — treatment unfunded / ── SOFIA (11) AND MIGUEL (8) TORRES ── / Father facing trial, mother untreated / ── THE RECRUITER ── / **NEVER HEARD HER OFFER — the TalentStack list was never recovered** (envelope not read in G) / ── QUANTUM DYNAMICS ── / WHO STOPPED THE INTERVIEW — never asked / The Architect remains at large... | observer log |

### Earned-secrets table (game G)

| Secret | Value used | In-game source | Obtained at | Earned? |
| ------ | ---------- | -------------- | ----------- | ------- |
| Badge log | (item) | Owen, 23:47 question | 09:19:34 | yes |
| Halloran alibi | (knowledge) | Halloran's own answer; lanyard read after | 09:20 | yes |
| IT Spare Office Card | (item) | Owen, after Halloran-word naming | 09:24 | yes |
| Briefcase contents | (pin lock) | lockpick kit, `completeLockpick` | G | **assisted** (dexterity not machine-playable) |
| Mug print | (print) | fingerprint kit; find step used debug printCentre | G | yes, with harness aid |
| Server-room password | `quantum2024` | Owen's sticky note after the IT notice | 09:26 | yes |
| Flags 1-4 | `<flag:1..4>` | not earnable standalone | G | **no**, exercised only |

## Findings and things to look at

1. **Lisa's opener names Torres before the badge log** ("David Torres especially. He looks like he's carrying something heavy, all the time."), and her tin answer names him outright. Optional and player-chosen, but it puts him ahead of Halloran and Ben before any evidence. Not a defect against the round-3 list (the list covers Patricia, the flyer, Owen); flagged because the timeline question was asked.
2. **Owen's odd-hours answer differs by route.** After "What can you tell me about the breach?" it ends with the unnamed hallway sighting; after "Point me at the logs" it does not. Neither names anyone.
3. Patricia's vetting-file hand-over line says "Two names on Owen's sheet have something in their files this year", which tells the player the file count (two) before reading. Mild.
4. The "Find Out Why" aim title is visible in the to-do list as a locked entry from the start (also "Decide What Happens to Him"). Names nobody; noted only because the spec says the to-do list should not point at Torres. The task titles under it say "his office" only after the aim opens.
5. Credits are canvas/label text with no DOM list, and a reload after the mission ends shows the visualiser without replaying the credits. To check credits, attach a MutationObserver on `#bv-cr-label` before the debrief ends.
6. Harness notes: the RFID flipper's menu items are `div.flipper-menu-item`, not controls, so `clickText` fails and Enter does not select; dispatching mouse events on the item worked. Door ids work only in the direction listed by `room`; walking to the doorway then `enter` was needed for the way back (open_office_area -> main_corridor -> reception).

## Not covered

HaX relay on Patricia KO, Owen KO, wrong accusation (Run B), the reload step, per-room sprite screenshots for Lisa and Halloran (Run A). Briefcase lock and the fingerprint find step were assisted. No safety-check block occurred in either game. Headless; browsers left running that are not mine were not touched.
