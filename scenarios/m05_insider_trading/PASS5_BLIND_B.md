# m05 Insider Trading: Pass 5 blind playtest B ("do your best")

Question answered: solvability and clarity of the deduction, with a mid-mission reload. One persona (do your best), fresh game, standalone, keyless server :3001, headless (machine load average 14).

- Game id: 2627 (mission 49). Seeded flags: `tools/playtest/m05_insider_trading-flags-game2627.xml`.
- Session log: `tools/playtest/m05-blindB-session.jsonl` (2430 lines, 2429 commands). Not committed.
- Wall clock: about 23 minutes (16:37:46 to 17:00:57). Credits reached and read.

## Blind caveat (read first)

The brief allowed me to read mission.json. Its `key_npcs` block says, in plain words, "David Torres, Cryptography Lead, ENTROPY Insider". I saw it before the game started, so I knew the answer. I could not unsee it. What this run can still tell you: whether the in-game evidence supports Torres, which clue connects to which, how hard the proof is, and what the hints do. What it cannot tell you: whether a student who starts with no name gets there. The suspicion timeline below says honestly which clues I would have treated as decisive with no prior.

I also skipped the lab sheet (the lookup was refused by the permission layer, and I did not work around it). The opening briefing was driven by `bootstrap` (auto-picks choice 1), so I did not read it as a player would.

## verify-run.rb output

```
game            2627  (mission 49)
created         2026-10-17 15:37:28 UTC
last write      2026-10-17 16:00:46 UTC
played for      1398s of wall clock
current room    "reception_lobby"
unlocked rooms  10: reception_lobby, patricia_office, main_corridor, open_office_area, break_room, research_lab, server_hallway, server_room, torres_office, data_center
unlocked objs   2: torres_briefcase, data_center_pc_0
inventory       23: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Building Directory, Visitor Badge, Security Incident Log, Noticeboard Flyer, Server Hallway Badge Log, Server Password Sticky Note, TalentStack Leaflet, Conference Lanyard, Patricia's Copy of the CEO's Email, Vetting Aftercare File: D. Torres, Vetting Aftercare File: R. Halloran, IT Notice: Server Room Access, IT Spare Office Card, Personal Journal, Medical Bills, Sealed TalentStack Envelope, Upload Schedule, Data Package Manifest
NPCs met        12: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, lisa_park, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_5ad597}, ..._2_6ce1cf, ..._3_41be01, ..._4_7a45a0
globals set     58 (includes heard_tin_story, torres_suspected, torres_identified, torres_turned, elena_treatment_funded, debrief_played, mission_complete, final_choice, confront_stance, case_motive, case_exfil)

VERDICT: progress recorded - 9 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Owen's staff badge (server hallway) | cloned card | Owen, "Lean over his log screen" choice, RFID flipper read then Emulate at the hallway door | 16:39 | yes |
| Server room password | `quantum2024` | Owen's sticky note, given after I quoted Patricia's log at him | 16:40 | yes |
| IT spare office card (Torres' office) | item | Owen, after Patricia authorised it (naming Torres to her in person) | 16:47 | yes |
| Torres' thumbprint | lift, 77% | Mug in his office, dusted and lifted, matched to his card | 16:50 | yes (bridge debug field used to find the print and read its pattern, see finding 7) |
| Key vault | Torres lift | Fingerprint reader, data centre door | 16:51 | yes |
| Torres' briefcase | lockpick | Pin tumbler, `completeLockpick` | 16:50 | PASS (assisted) |
| `qdc_research_server:flag_1` to `flag_4` | `<flag:1>` to `<flag:4>` | Bludit VM challenges. Not possible standalone | 16:45 | **no, flags supplied, VM work not earned** |

Rows marked "no": the VM prerequisite chain (launcher terminal reached and read, no VM exists) was exercised, not tested. HaX's flag-triggered hint messages arrive only because the flags were accepted, so everything gated on them is unproven for a real student. I did not open any guide.

## Suspicion timeline (clock is wall time, goal in italics)

| Time | What I had just seen | Suspicion |
| --- | --- | --- |
| before play | mission.json key_npcs names Torres | **contaminated: answer known** |
| 16:38 | Building directory: eight crypto staff. Patricia's log: "The badge is always one of eight." | *Goal: find which of eight.* No names |
| 16:38:58 | Owen: Ben Ashworth "always skint", Halloran "lives in that lab", a wrecked-looking man in the server hallway at night. Reader log says "Halloran's spare" | Halloran and Ben as candidates, no one favoured |
| 16:40:00 | **Lisa's tin**: "someone on the crypto team", wife stage 3, insurer won't touch it, he has lost weight and hasn't slept. Same talk: "David Torres has barely said a word in weeks" | Narrows to a married man on the team. Ben is single-sounding and "skint", Torres is "silent". I leaned Torres, but only with the spoiler |
| 16:40:22 | TalentStack leaflet: "R. CALLED AGAIN. RETAINER + THE DEBT" | Supports a debt story, no name |
| 16:41:30 | **Halloran**: "David's had a hard year at home... I've watched him fight the insurer for months." | **First clue that closes the loop.** Lisa's "insurer" plus Halloran's "David... insurer". Without a prior, this is where I would have named him as the tin's recipient |
| 16:43 to 16:44 | Notepad: reader log shows `#4408 D. TORRES` on the main entrance 6 minutes before every `#4471 R. HALLORAN (spare)` hallway swipe; Halloran's Zurich lanyard covers 23 Sep; Torres vetting file (three new loans, spouse in treatment abroad, insurer declined) | **Confirmed.** The proof is the "front door then spare" pattern, which I found the most satisfying part |
| 16:45:43 | HaX "Where do I stand?": "Lisa's tin is for someone on that team with a sick wife and no cover. One file fits. Find that name on the badge log." | Hint confirmed my route. It names the method, not the person |
| 16:46:37 | Named Torres to Patricia in person | |

## Did the deduction work with Lisa's vaguer line?

Yes, mechanically, and it is not hard. Lisa alone does not name anyone (that is right). It gives a male team member, a wife, an insurer refusal. The decisive link is Halloran's "fight the insurer" line, and the vetting file then states it in writing. Ben is a weak red herring ("skint", junior, own badge on the hallway log with an innocent evening run). The badge log then separates Torres from everyone, including Halloran, whose alibi (lanyard) is in a room I walked into.

What lowers the difficulty: Patricia hands over only two vetting files, Halloran and Torres, and calls them "the two I'd have pulled anyway". HaX's "one file fits" is a heavy nudge. For a student the effective suspect list is two by 16:42. That is fair, and probably what you want for a difficulty-2 mission, but it is not an eight-way puzzle. The satisfying part is the badge-log pattern, not the tin.

HaX's help did its job without naming him, but if the target is "a student who can get stuck and still feel they solved it", the 16:45:43 line takes the thinking out of the final step. Consider making "One file fits" only fire after the student has opened both vetting files.

## "Didn't know what to do" moments

| # | When | How long | What I tried | What unstuck me |
| --- | --- | --- | --- | --- |
| 1 | 16:38:58 to 16:39:30 | ~30 s | Owen's lean-in choice gave "The cloner didn't get a clean read" and the RFID flipper never opened | Re-took the choice by hand and continued past the narrator line: the flipper opened, I Saved the read. The first miss was my harness (`converse` closed the minigame), not the game |
| 2 | 16:45:50 to 16:46:37 | ~45 s | HaX at 16:40 says IT holds a spare for every office and "you'd need a reason Owen can write in his log". I went back to Owen at once: only "That's everything" was offered. Patricia's "I need your help" offered only the vetting files | Naming Torres to Patricia. She then told Owen to give me the spare. Nothing in-game says the reason is "name your suspect to Patricia" |
| 3 | 16:51:26 to 16:51:49 | ~25 s | In the data centre Torres is not visible, `identify_torres` still open (I had named him in person). I tried the upload terminal | HaX had already said "Call her" and the phone offered "I know who it is" again. Naming a second time by phone (why, then proof) set `identify_torres` and Torres appeared at 20:14 |

No stuck moment lasted more than a minute.

## Timeline

| Time | Goal as I understood it | Action |
| --- | --- | --- |
| 16:37 | Find the insider among eight | Bootstrapped, read directory |
| 16:38 | Get the lay of the land | Patricia (visitor badge, "both the why and the proof"), incident log |
| 16:39 | Who owns the access logs | Owen, badge cloned, password, reader log |
| 16:40 | Who is the tin for | Lisa, leaflet in the break room |
| 16:41 | Rule people out | Halloran, lanyard, lab notice |
| 16:42 | Get vetting files | Patricia handed Halloran and Torres files (they go to Notepad) |
| 16:44 | Reader log in Notepad | Realised the front-door pattern |
| 16:44 to 16:45 | Server side | Server hallway (emulate cloned card), server room, flags 1 to 4 supplied |
| 16:45:43 | Check where I stand | HaX hint |
| 16:46 to 16:47 | Office access | Named Torres in person, Owen's spare |
| 16:47:14 | Reload test | `sync`, `location.reload()`, title screen, Resume through the DOM. Inventory, tasks and globals intact. Player back at the lobby start point |
| 16:48 to 16:51 | Prove it | Torres' office: mug print (dust, feather brush, lift, match), briefcase (journal, bills), vault, data centre papers (envelope, upload schedule, manifest) |
| 16:51:49 | Torres isn't there | Phone call to Patricia: why, then proof |
| 16:52:45 | Confront | Evidence route, "they lied to you", "you knew people would die", "not too far gone", "wrote you don't recognise yourself", "go back to your desk", "I need everything", "cancel it, David". Outcome: turned, Elena funded |
| 16:55 | Wrap up | Recruiter text (ring-back "rings out"), HaX: bring me in |
| 16:57 to 17:00 | Debrief, credits | Debrief 4 questions, credits read via MutationObserver |

## Reload

Reloaded once, after naming Torres and collecting the office card, before the office, vault and confrontation. Resume worked via the DOM Resume button (the overlay's other buttons were "Load session" links, not touched). Inventory (7 items), open tasks, globals and Notepad pages were all intact. The player is placed at the lobby start point, not where they stood. No dialogue state was lost; Owen had no re-offer problem because the card was already in inventory.

## Scores (1 to 5)

| Dimension | Score | Why |
| --- | --- | --- |
| Fun | 4 | The mug print, the Patricia naming and the Torres scene are strong. The confrontation and the "cancel it, David, your hand not mine" beat land |
| Clarity of goals | 4 | The task list tells you what is next. Two small gaps: the office card route and the in-person vs phone naming |
| Fairness | 4 | Every fact needed is in the building. The badge-log pattern is only visible in the Notepad |
| Pacing | 4 | About 23 min with no dead time. The server/flag block in the middle pauses the story for the VM work |
| Teaching | 4 | Dusting steps are well explained (powder choice, loop/whorl). Reader-log correlation is the best lesson. Spare badge sign-out, undeclared change of circumstances and the CEO's stand-down all teach |

## Best five lines

1. Patricia: "Angry, skint and distracted aren't evidence. I've been wrong about people before."
2. Patricia: "I sign that log off every Monday. I never once read the front door."
3. Torres: "I wrote that about strangers so I wouldn't have to think of them as people."
4. Owen: "Course, you can't change one either, once it's out." (thumbprint)
5. Lisa: "He'd hate that I told you even that much. He hates a fuss."

## Worst five lines

1. HaX debrief: "You read past her line on the badge log." ("Her" has no antecedent; Halloran has not just been mentioned.)
2. Patricia in person: "That's a pattern... Now I need a reason." Then she gives the spare after only the proof option, with no reason asked.
3. HaX 16:50: "One file fits. Find that name on the badge log." (does the student's thinking for them)
4. Owen (16:39): "Patricia's log has a crypto badge in the server hallway at 23:47. Whose?" is answered "Halloran's spare". Accurate to the log but sends the student to Halloran, with Torres only in the Notepad entry.
5. Patricia: "Those are the two I'd have pulled anyway." (narrows eight to two out loud)

## What I learned, in my own words

Reader logs show whose badge opens which door, but a borrowed spare hides the person; the front-door swipe 6 minutes earlier gives the borrower away. An undeclared change of circumstances (debt, a sick spouse, an insurer refusing) is what a recruiter looks for. A fingerprint lifted from a mug can beat a biometric reader. Powder colour should contrast with the surface. I could not answer the lab-sheet questions as I did not read them.

## Findings

| # | Severity | Finding | Repro (log) |
| --- | --- | --- | --- |
| 1 | major | mission.json `key_npcs` names Torres as "ENTROPY Insider" (and `narrative_summary.act3` describes the confrontation). If students can read mission.json, the whole deduction is spoiled; a blind tester told they may read it was blinded out of the main question | n/a (file read at start) |
| 2 | minor | HaX's 16:40 hint says Owen holds an office spare and wants "a reason". Owen offers nothing until you name Torres to Patricia in person. No in-game pointer connects the two. About 45 s lost | log around 16:45:50 to 16:46:37 |
| 3 | minor | Naming Torres to Patricia in person completes `name_a_suspect` and unlocks the spare but leaves `identify_torres` open. Torres does not appear at the terminal until you name him again by phone, with a different two-step menu (why, then proof). Easy to miss; HaX does say "Call her" | game 2627, 16:51:26 |
| 4 | minor | In-person naming says "Now I need a reason" after a proof-type reason, then accepts and hands over the spare. The menu also offers factually wrong claims ("His own badge is on the server hallway those nights"). I did not test whether a wrong answer has any consequence | 16:46:37 |
| 5 | minor | The badge log, the key clue, is delivered only to the Notepad and Owen's spoken answer ("That's Halloran's spare") points away from Torres. A student who never opens the Notepad misses the front-door pattern. I could not see whether a "note added" cue shows in the HUD | 16:39 and 16:43:30 |
| 6 | minor | Patricia's filing cabinet (key lock, `requires: null`) is unreachable: `moveToNear` stops 34 px away at (548,64), plain range 32. Not on the critical path, since the vetting files come by dialogue | 16:43:50 |
| 7 | minor | Dusting: the fine brush plateaus at 23 to 36% coverage on an easy ceramic surface (40% needed), the feather brush reaches 68% in one pass. A student with the fine brush may sweep for a long time with no hint to switch. Also the bridge state exposes `debug.pattern` and print centre (harness only, but I used it to find the print and to read "loop") | 16:48 to 16:50 |
| 8 | minor | Debrief "You read past her line on the badge log" has no antecedent for "her" | debrief line 1 of "How close was it?" |
| 9 | minor | HaX's 16:50 "One file fits. Find that name on the badge log." gives the method away. Consider gating it on both vetting files being opened | 16:45:43 |

Counts: **0 blockers, 1 major, 8 minors.**

Not tested: the Recruiter's deal (my route turned Torres, ring-back "rings out"), the other four confrontation endings, the combat branch, wrong-suspect naming (Halloran, Ben), and whether a wrong "why/proof" answer has any consequence. No NPC combat state was read.

## Fixes round 3 (2026-10-17)

Ink, routes, map and art in commit 06482430. The scenario.json.erb changes (two HaX door texts and a skip on the "both halves" text) are in the working tree for the lead to commit. Checks: ink compile (10 of 10), validator (0 errors; warnings 15, same as HEAD), dialoguelint (2 findings, both in the Recruiter's ink and both from before), tagdiff (61 structural differences, all from the items below), loopcheck on Owen, Patricia, her phone and HaX (no runtime errors), reopencheck (0 problems), m05 routes r1 to r44 all pass. No browser run yet.

| # | Finding | Outcome |
| --- | --- | --- |
| 1 | mission.json `key_npcs` names Torres | **Withdrawn, no change.** Nothing in the game or in Hacktivity reads `key_npcs`, so students never see it. Only this tester saw it, by reading the raw file. |
| 2 | Office-card route hidden: HaX wants "a reason", Owen offers nothing | **Fixed.** Owen has a new topic before anyone is suspected ("Do you keep spare cards for the offices?"): searching a desk is Patricia's call, so tell her who and why. Patricia's "I need your help" menu has "I need a look inside someone's office", which goes to her naming menu. HaX's door text before suspicion now says "searching someone's desk is Security's call. Tell Patricia who you suspect, and why." After suspicion it says Owen hands the card over on Patricia's say-so. |
| 3 | Naming in person leaves `identify_torres` open | **Fixed.** When the front-door reason completes the proof (flag 3, the manifest or the upload schedule) and a motive is already in hand, Patricia now asks why, and a right answer is the full naming: `identify_torres` completes and Torres appears, with no second naming by phone. The same change is in her phone ink and in HaX's (for when Patricia is knocked out). Route r44 plays the tester's exact path. |
| 4 | "Now I need a reason", then the spare without one | **Fixed.** In that case she now asks for the reason ("Now tell me why he'd do it") and acts on the answer. If the motive isn't in hand yet she says "That's how. I still don't know why", and the office search is her way of finding it. Without the exfil half she says the pattern puts him at the door but doesn't show the data leaving. The wrong reasons on the menu ("His own badge is on the server hallway…") are decoys on purpose. Each one costs her trust and ends the conversation (`reason_wrong`). |
| 5 | Owen's "Halloran's spare" points away; the log only goes to the Notepad | **Fixed.** After "Halloran's spare", Owen now adds: "Mind, a spare only tells you which card. The front door's on there too, and that one tells you who was actually in the building." A narrator line follows: "He prints the log and hands it over. It goes into your notes, every door on one sheet." That points at the front-door column without giving away the 6-minute pattern. |
| 6 | Patricia's filing cabinet out of reach (34 px against 32) | **Fixed.** The cabinet's collision rectangle in `room_qdc_security` (json and tmj) is trimmed from 10 px to 4 px, so the player can stand 6 px closer. That works out at about 28 px from the sprite's anchor. The sprite isn't moved, so it stays lined up with the steel cabinet beside it. **Owed: a browser check that E opens it.** |
| 7 | Fine brush stalls on the mug; debug pattern in the bridge | Not mine: the engine agent has the dusting threshold. |
| 8 | Debrief "her line" has no antecedent | **Fixed.** It now reads: "You read past the obvious line on the badge log. Halloran's spare on the server hallway, Torres' badge on the front door six minutes before, every night." |
| 9 | HaX's "One file fits" does the thinking | **Fixed.** The first "Where do I stand?" with the files now gives a gentler rung: "You've got the files. Read both against what the team have told you about each other, then go back to the badge log." "One file fits" comes only on a later ask, and only with both files in the notes (`found_vetting_file`, `found_halloran_vetting`). The engine has no "note opened in the Notepad" event, so "opened" here means "handed over". The rung order is what holds the line back. If a true "opened" signal is wanted, that needs an engine event. |
| C-F1 | Patricia's bust has a white speckled fringe (confirm report) | **Fixed.** A script darkened the light edge pixels on every cell of the bust, the talk sheet and the viseme sheet: 109, 436 and 763 pixels. It changes only opaque pixels that touch transparency and are much lighter than the pixels just inside them. Each one takes the mean colour of those inner pixels. There's no resampling and alpha is unchanged. The head (white hair, face) and the shoulder radio are left alone. Before and after at 4x: `docs/agents/pending_review/patricia_fringe_before.png`, `patricia_fringe_after.png`. Script: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/r3-content/defringe.py`. |
| C-F2 | Owen's narration mentions headphones he doesn't have (confirm report) | **Fixed.** It now reads: "A bearded man in his late twenties at a workstation, three terminals of logs scrolling past, a staff badge on a lanyard round his neck. He swivels round." That matches `owen_gallagher_talk_init.png`. |
| C-F3 | UI art 404s (confirm report) | Not mine: the engine agent has these. |

Also tidied: the "That's both halves… Call her." text now has `skipIfGlobal: torres_identified`. Without it, the text would land stale after a naming that completes in the same conversation (erb).

Spoken lines changed (TTS): Owen's opening narration; Owen's front-door line and the narrator line after it; Owen's two "spare cards" lines; Patricia in person: "Whose, and why? Give me a name I can defend and I'll message Owen for the spare.", "That's a pattern. Put it with the upload schedule/staging manifest and it's proof. Now tell me why he'd do it.", "That's a pattern, and it ties him to the package. That's how. I still don't know why.", "That's a pattern. It puts him at the door. It doesn't tell me why, and it doesn't show me the data leaving.", "Money. And you've shown me how. That's both.", "In his own hand. And you've shown me how. That's both."; the same four lines in her phone ink; HaX's debrief "obvious line" sentence. HaX's phone texts changed too (the files rung, the proof-given lines).
