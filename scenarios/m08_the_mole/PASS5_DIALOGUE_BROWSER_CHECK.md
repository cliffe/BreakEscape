# m08 pass 5, dialogue stage: browser check (cycles 1-2)

Date 2026-10-14. Keyless server :3001 only, headless (load 1-2), checked-in harness scripts only. No mission files edited, nothing committed. Every session started here was stopped with `session-stop.sh` (2482, 2494, 2495, 2501). Rooms were re-dressed (`room_hq_*`) and lighting was being tuned concurrently; layout notes only, lighting not judged. No SecGen XML or restricted exploit guide opened.

Question answered: do the cycle 1 and 2 dialogue changes behave on screen (the six owed items). Plumbing and unexpected-behaviour (talk twice, leave, return, reload). Not a solvability pass.

## Games and logs

| Game | Purpose | Session log (repo `tools/playtest/`) |
|---|---|---|
| 2482 (A) | Main run. All eight person-chats re-talked before the naming, Cipher accused, mid-mission reload (after flags 1-4), Netherton flag-4 nudge, apology and audit beat, naming, post-naming greetings (Netherton, Cipher, Phantom, HaX), confrontation (triple agent), debrief with the conduct beat | `m08-pass5-dialogue-browser-game2482.jsonl` (2135 commands) |
| 2494 | Scripted route aborted at the first unfinished conversation (my driver, not the game). Stopped, not used | `m08-pass5-dialogue-browser-game2494.jsonl` |
| 2495 (B) | Clean route, no accusation: confrontation (arrest) and debrief read through a MutationObserver on the chat caption (walk-out ending, HaX's two debrief lines, no conduct beat) | `m08-pass5-dialogue-browser-game2495.jsonl` |
| 2501 (C) | Clean route to "Then you go." on screen, then a reload to look for the reopen line | `m08-pass5-dialogue-browser-game2501.jsonl` |

Scratch (driver scripts, observer): session scratchpad `m08-pass5-dialogue-browser/`.

## verify-run.rb (post-run, after `sync`)

Game 2482: `VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.` Rooms unlocked: main_lobby, director_office, cryptography_lab, operations_floor, intel_analysis, break_room, server_room, security_archives, interrogation_room. NPCs met 12 including agent_0x99_person, background_agent, background_analyst, closing_debrief, nightshade_confrontation. Globals include accused_cipher, cipher_audit_confirmed, mole_identified, named_on_evidence, nightshade_triple_agent, fate_decided, debrief_played, mission_complete.

Game 2495: `VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.` Globals include debrief_played, mole_identified, named_on_evidence, no accused_*.

Game 2501: `VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.` Globals include fate_decided, debrief_backstop_fired, mission_complete (see N2).

Full output: scratchpad `verify2495.txt`, `verify2501.txt`, `verify2482.txt`.

## Earned-secrets table

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Netherton card clone | cloner Save, Emulate | "Step up beside him" then the cloner (MIFARE Classic custom keys: Crack keys first, Darkside ~30 s, Save) | yes (all games) |
| Archives password | `TrustNoOne` | break-room post-it | 2482, 2501: yes (post-it opened first, in inventory). 2495: **no**, typed without visiting the break room. The post-it text itself was not read on screen in any run |
| Suite PIN | `5386` | Netherton after the naming ("The chain is in. He goes down to the suite now. The code is 5386.") | yes (2482 quoted, 2495, 2501 same route) |
| `safetynet_gitlist_server:flag_1..4` | `<flag:1>`..`<flag:4>` | Evidence Relay Terminal | **exercised, not earned**: supplied by the harness, the GitList launcher never opened. Mission solvability past these is unproven here (VM content: needs checking against SecGen by the user) |
| Door-audit readings (10:38, Nightshade, out of the lab at 10:32, confirm their own rows) | choices | Badge Audit Printout (archives) plus Cipher's audit beat | knowledge from the briefing text, not read afresh on screen: partly earned (printout and Cipher's confirmation obtained first) |

Steps downstream of the flag submission (the naming's box line, the suite, the confrontation, the debrief) were exercised, not earned.

## Results per owed item

### 1. Re-talk all eight person-chats: PASS

Each chat was run: first talk, one topic, goodbye, re-talk (greeting), one topic (no greeting), goodbye (no greeting on the way out), re-talk again (second variant). Quoted lines are what the dialogue box showed (game 2482 unless stated).

| Chat | First talk opens | Return greeting 1 | Return greeting 2 | After a topic | After goodbye |
|---|---|---|---|---|---|
| ATHENA | "Reception. How may I help you tonight, Agent? Discreetly, of course..." | "Reception. Still discreet." | "Agent. How may I help?" | topic reply then hub, no greeting | "Of course. I'll log that you were here. I log everything now." then closed |
| Netherton | "An inner office with no windows..." | "Agent. What do you need?" | "Agent. Go on." | none | "Go. Whoever it is was one of us this morning..." then closed |
| Cipher | "Cipher does not look up until you are right on top of him..." | "You again. Come to cross me off, or add me back on?" | "Back. Still boring, I promise." | none | "You'll clear me on the evidence. Good..." / "Back to the maths, then." |
| Phantom | "Agent 0x00. The Director's own bloodhound. Sit." | "Back again. Either you've cleared me or you've got nothing. Which is it?" | "You again. Sit. Tell me something I don't know." | none | "Go and get onto that repo..." |
| Nightshade (lab) | "The Crypto Lab is quiet..." | "Back so soon. You must be enjoying my company, or getting nowhere. I hope it's the first." | "Still here, as promised. Ask." | none | "Come back when you can prove something. I'll be right here. I always am." |
| Off-duty agent | "He doesn't look up from the magazine." | "Still here. Still not reading this." | "Back again. People will talk." | none | "Mind the door." |
| Junior analyst | "You're the one the Director brought in..." | "Still here. Still reading the same paragraph." | "Yes?" | none | "Close the door behind you. Please." |
| HaX (in person) | "HaX is folded into the corner with a coffee she has let go stone cold..." | "Still here. The coffee's still cold." | "You came back. Sit, if you want." | none | "I know you will. Go." |

- Reload (game 2482, after flags 1-4): ATHENA then greeted "Reception. Still discreet." instead of replaying her opener (the `met` guard works).
- After the naming (not owed, checked): Netherton "Agent. What do you need?"; Cipher "You again. I hear it's over. I'm still doing the maths on how I feel about that."; Phantom "The hunt's over, I hear, and you came back anyway. Sit."; leave lines "Go and finish it. And thank you. I mean that." (Cipher, apologised) and "Not my collar, then. Tell the Director I was right to look."
- None of the pre-naming greetings, topics or goodbyes names the mole. Two method pointers, no name: HaX "Watch the door log instead. Doors don't have friends." and the Director's nudge "A terminal and a time is not a man. Read me the door." (see note N6).

### 2. Netherton's flag-4 nudge on a re-talk: PARTIAL (plays once on the first return, then the short variant, then the long one again)

Game 2482, after flag 4 and before the naming. Re-talk A: "You've been in the logs. I can see it on you. A terminal and a time is not a man. Read me the door." Topic ("What are the rules of engagement, sir?") then goodbye: no nudge repeated inside the conversation. Re-talk B: "The door, Agent. Read it to me when you can." Re-talk C (third visit): "You've been in the logs. I can see it on you..." again. So it is a cycle, not "once then short". Cause: `m08_director_netherton.ink:108` uses `{&...|...}` (cycle); a stopping sequence is `{...|...}` with no `&`. The cycle 2 log calls it a stopping sequence. See N1.

### 3. An accused Cipher's greeting: PASS

Game 2482. "I think it's you, Cipher." (before any evidence), then "That's all for now.", re-talk: "You again. Sorry, or cuffs?" (twice, including after another topic and a second goodbye). Farewell while accused: "Check the logs. That's all I ask." After "I was wrong to say that. I'm sorry." the greeting went back to "You again. Come to cross me off, or add me back on?". The accusation option ("I think it's you, Cipher.") is gone from the hub once said.

### 4. The debrief's conduct beat after an accusation; HaX's two lines: PASS

- Game 2482 (Cipher accused, then apologised to): after the stance pick ("You had a warning and you sealed it. Own the gap, or it happens again."), "A long beat." / "Yes. I will put my own name in the report beside his. You were right to make me say it aloud." / "You accused Cipher to his face. I read the transcripts." / "It is in the file now, and it will follow him longer than it follows you." then the two picks "1. It was wrong, sir." / "2. It was the job, sir." I picked the first: "It was. Now the case." and the case lines followed. Beat shows once.
- Game 2495 (nothing accused): after the same stance kind of pick ("You had a warning and no proof, in a war. He's the crime, not you.") the reply goes straight to "Kinder than I would be..." and the case; no conduct beat.
- HaX's lines, read from the observer (game 2495, order as shown): Narrator "Netherton finds you in the corridor. He looks older than he did at the briefing a few hours ago. Your phone buzzes once: HaX." then speaker label **Agent HaX**: "He said it to you? Afterwards, not during. I was taught that line, and I say it to every agent I run." then **Agent HaX**: "Same classroom, 0x00. Don't ask me whose yet." then Director: "It's done, then. Agent 0x47. Nightshade." Game 2482 showed the first HaX line on `brief` (speaker "Agent HaX"). The scene advances by itself fast, so I did not take a screenshot of the portrait; the speaker label is HaX's own, the portrait itself is not confirmed here.

### 5. Confrontation walk-out ending and the reopen line: PASS for the ending, NOT OBSERVABLE for the reopen (N2)

- Ending (game 2495, arrest fate, observer log, in order): "...And 0x00. Let it hurt afterwards, not during." then Narrator "You hold his eye a moment longer than you mean to. Then you go." then the chat closes and the debrief Narrator line follows. No "Go on. I'll still be here when the police come." plays in the batch. Game 2482 (triple agent) steps matched: "And 0x00..." then one more line, then the debrief. Run lengths with no choice: triple agent 8 lines, arrest 7 after the choice echo.
- Reopen (game 2501): with "Then you go." on screen and the fate already written, I reloaded and pressed Enter. The game came back in `main_lobby` with the Mission Brief note, `debrief_backstop_fired`, `mission_complete` set, and the credits overlay up (uncloseable). The suite could not be re-entered, so "Go on. I'll still be here when the police come." / "Go on. They'll be expecting you upstairs." was never reached on screen. Game 2482 gave the same result after a normal finish plus reload. Read in ink only (routes r25 cover it).

### 6. HaX in person after the naming: PASS (with a wording note, N7)

Game 2482, after the Director named him on the audit. Hub choices: "1. How are you holding up? 2. It's Nightshade. 3. Any advice for the room? 4. Netherton send you down here? 5. I'll come back." ("Who's your money on?" is gone.)
- "How are you holding up?": "Worse, now I know which face. He stood next to me at the Portland debrief and handed me a tissue." / "Ask me tomorrow."
- "It's Nightshade." (once): Narrator "She doesn't answer for a long moment." / "Nightshade. Of course it's Nightshade." / "Go and do the job, 0x00. I'll sit here and un-know a friend. I'll manage." The option does not return.
- Before the naming the same question answered "I can't work out which face it was. And I'm frightened of the second I can." That line is gone after the naming.
- Return greeting after the naming: "You came back. Sit, if you want." The "[It's done.]" option after the fate was not reachable (the debrief starts at the end of the confrontation).

## Reload

One mid-mission reload (game 2482, after flags 1-4, three suspects interviewed, Cipher accused, clone in the cloner): title screen, Enter via `eval`, Mission Brief note, closed it. Inventory (phone, picks, cloner, fingerprint kit), tasks (`read_the_archives (opt)`, `name_the_mole`) and globals intact. ATHENA and Netherton both greeted instead of replaying openers.

## New findings

| # | Severity | Finding | Where |
|---|---|---|---|
| N1 | minor | Netherton's flag-4 nudge cycles instead of stopping: long, short, long. `m08_director_netherton.ink:108` uses `{&A\|B}` (cycle); drop the `&` to get "once, then the short one". The cycle 2 log (D8C2-1) calls it a stopping sequence | game 2482, third re-talk |
| N2 | minor | The confrontation's reopen line cannot be reached in play. After the fate any reload fires the debrief backstop at load (`debrief_backstop_fired`, `mission_complete`) and shows the uncloseable credits, so the player cannot walk back into the suite. The `after_choice` "Go on..." branch is only reachable in ink. Harmless, but "its line on reopen" is dead text in play | game 2501, game 2482 |
| N3 | minor | Layout: `moveToNear` stops 34-38 px short (plain range 32) for Cipher (operations floor, twice) and the off-duty agent (break room): `arrived-but-outside-plain-range`, "interactDistance" 34-37.9. `interact` still opened the chat each time (`mismatch` false), so a player clicking the NPC is fine; the pathing stop-point is just marginal. Cipher's y also shifts (134.8 then 148) between attempts | game 2482, session log |
| N4 | note | `TESTING_WALKTHROUGH.md` row 3a still says the Director's card is EM4100. In play it is MIFARE Classic 1K with custom keys: "Crack keys first", "Darkside Attack (~30 sec)", then Save. Doc stale, game fine | all games |
| N5 | note | In a driver run with a half-finished conversation the harness's `converse` with a `choices` list can leave a chat open (game 2494). Harness only, not the game | game 2494 |
| N6 | note | Judgement: HaX before the naming says "Watch the door log instead. Doors don't have friends." and the Director's nudge says "Read me the door." Both point at the method (the audit), neither at a person. Fine for "doesn't give away the deduction" in my reading; flagged in case the orchestrator wants the door pointer softer | games 2482 |
| N7 | note | Item 6's "no 'which face'": the new post-naming line itself reads "Worse, now I know which face." The pre-naming "I can't work out which face it was." is gone after the naming. If the intent was the phrase to disappear entirely, the new line still has it | game 2482 |

Counts: 0 blockers, 0 majors, 3 minors, 4 notes.

## Not covered

HaX's debrief portrait (label only); the triple-agent and arrest reopen lines (N2); `[It's done.]` after the fate; the off-duty agent's locker-gossip line (needs the lockers touched); suspect KOs and the Director KO/hostile branches; audio (keyless server); VM contents (needs checking against SecGen by the user). Lighting was not judged; no layout problems seen beyond N3 (no disambiguation menu, no `mismatch:true`, no blocked door across the rooms visited: lobby, director's office, operations floor, intel analysis, Crypto Lab, break room, server room, archives, interrogation room).
