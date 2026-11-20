# m05 Insider Trading: pass-4 playtest script

Covers what pass 4 (design) changed: the whodunnit (badge log, Halloran red herring, naming menu, wrong accusation), suspicion-gated office access, Patricia-KO lines, the Recruiter pointer and credits, flag warnings at the naming, the turn-path arguments, the drive choice, v2 sprites and the debrief.

Keyless server on :3001 (`PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m05_insider_trading`). Follow `.claude/skills/playtest-scenario/SKILL.md`. Silent lines are expected. Keep an earned-secrets table; anything set by console is "exercised, not earned". `tools/playtest/verify-run.rb` must show progress after each run.

Split into three short runs (10–15 minutes each). Flags may be submitted from the solution guide in run C, marked "exercised".

## Run A: the whodunnit, with a reload (steps 1–6)

1. **Opening and sprites.** The briefing waits for the game to load, then plays. HaX in the briefing uses the same female spy sprite as the debrief will. HaX now says what to look for (odd-hour badges, money, behaviour) and not to take anyone's hunch for proof. In the world: the player, Patricia, Owen, Lisa and Halloran each have a distinct v2 sprite, and each renders fully at its position (screenshot every room with an NPC). Check the corridor flyer: it names nobody.
2. **No early pointers.** Meet Patricia, take the badge, read the incident log (its pencilled note points at Owen's reader logs). Open her "I need your help" menu: vetting files and "it can wait" only, no "David Torres' office". In the to-do list, nothing names Torres. At Owen's hub, there is "Anyone on the crypto team keeping odd hours?" and no Torres office ask.
3. **The badge log.** Ask Owen "Patricia's log has a crypto badge in the server hallway at 23:47. Whose?" He hands over the Server Hallway Badge Log and says it's Halloran's spare. Read it: Halloran's spare #4471 on the server hallway four nights; #4408 D. TORRES on the main entrance six minutes before each; her primary never in after hours. The task "Find out whose badge was in the server hallway at night" ticks.
4. **Reload here** (mid-mission). After reload: no intro replays; the log is still in your notes; the Owen ask is gone; HaX's general advice says to ask Halloran where the spare lives and to read the front-door lines.
5. **Clear Halloran.** Research lab: read the Conference Lanyard (Zurich, 21–25 Sep). Ask Halloran about the spare badge. She gives the alibi, the hook, and "David, mostly". The "Find Out Why" aim appears with "Get a keycard for Torres' office". Patricia's help menu and Owen's hub now offer the Torres office ask.
6. **Lisa.** Ask "Who's the collection tin for?": she names David and Elena. Her office-mood line mentions Halloran's row with the CEO. Check `verify-run.rb`.

## Run B: wrong accusation, and Patricia knocked out (steps 7–9)

New game. Read the incident log and get the badge log from Owen (steps 2–3) **without** talking to Halloran, reading the lanyard or asking for vetting files.

7. **Wrong accusation.** Phone Patricia (after her mobile text): "I know who it is". The menu offers "Dr Ruth Halloran…" and "David Torres". Pick Halloran. She suspends Halloran. About 15 s later HaX texts the nudge (where was she on the twenty-third; whose badge came in first). Visit Halloran: her badge is cut in half, she is suspended, she still answers the spare-badge question (alibi), and she won't give her spare. Name Torres to Patricia with only the log: she won't name him, but authorises his office ("enough to look in his office"). "Find Out Why" appears.
8. **Knock Patricia out** (any time after step 7). HaX's relay arrives (contractor pass, authorities). Her phone only rings out. Patricia's vetting files drop with her other items; read them (the Halloran file shows the declared trip and approach). Name Torres to HaX once you have both halves: the menu no longer offers Halloran (already accused). HaX's closing lines depend on state: "Stop him first…" if flags are outstanding; the print line matches whether you've dusted the mug.
9. **Patricia-KO lines.** Confront Torres. He mentions Ruth being suspended ("I watched them cut her badge"). Choose "hold him for the police": the player's line says the police are on their way, with no mention of Patricia. Re-talk: the choice reads "Sit tight. The police are on their way." If you have time, also take the fight branch in a second game with Patricia KO'd: the post-KO narration has you call HaX, not Patricia. Check `verify-run.rb`.

## Run C: the climax and the debrief (steps 10–12)

Continue run A (or a new game played to the naming). Don't ring the Recruiter back.

10. **Naming and the Recruiter.** With motive and exfil in hand but **not all four flags**, name Torres to Patricia in person. She says "Stop him first. Then finish whatever you were doing on that research server." As the chat closes, the Recruiter texts; about 6 s later HaX texts "That TalentStack number is the Recruiter…". Don't ring back.
11. **Confrontation.** Torres' line about the bills fits what you found (dollar figure only with the medical bills). Choose the sympathetic opener: the player asks "What did they tell you it was for?" Pick "Help us, and we'll help Elena": the argument choices depend on evidence (journal quote only if the journal was read; the Architect line only with flag 4; Elena always). At the stop-upload moment, choose "Pull the drive myself". The conversation closes. HaX's "finish the job on that research server" text arrives; HaX's general advice now says Torres is dealt with but the portal isn't.
12. **Debrief and credits.** Submit the remaining flags; the debrief fires. Check: the briefing-answer line matches the case (e.g. "methodical" with a thin file is called out); the badge-log line ("You read the badge log properly…", or the wrong-accusation line in run B); the "someone else's trust" lines; the warning-sign recap names only what you found; no claim that SAFETYNET has the forty-seven names if you took the Recruiter's deal. Credits: "NEVER HEARD HER OFFER — …" under THE RECRUITER (not an empty section), and "BORROWED BADGE" (or "WRONG ACCUSATION" in run B) under THE CASE. Check `verify-run.rb`.

## Report back

Per step: pass / fail with screenshot or game id, and anything a player would find unfair or confusing in the badge log, the naming menu or the nudge. Note sprite render problems by NPC and room.

## Round 2 confirmation (short; two runs, about 10–15 minutes each)

### Run D: blind detective
New game. The tester doesn't read the guide, walkthrough, erb or ink before naming. In-game clues only. Keep a detective log: who was suspected, when, and why.

1. Meet Patricia and read the incident log. Ask for the vetting files at once: she refuses ("Bring me a name or a pattern"). Her suspect list names all eight. The to-do list shows "Find out who on the team is under pressure", with no mention of vetting files or Torres.
2. Read the IT notice in the server hallway without trying the server-room door. Owen now offers "The server room wants a password."
3. Get the badge log from Owen. It shows Ben Ashworth and Amara Okafor as well as Halloran's spare, and Owen's note explains Ben and Amara. Ask Halloran about her spare: alibi, the hook, "Amara some evenings… David, mostly". Check that the Torres office ask and the "Find Out Why" aim have **not** appeared yet.
4. Name to Patricia. Try Ben first: refused, no cost. Then pick Torres. On the log alone she asks why. Pick "He's been under strain" first (refused, no cost, back to the hub), then name again and pick "Look at the main-entrance times." She confirms the pattern and authorises the office, and "Find Out Why" appears. Owen's card reads "IT Spare Office Card".
5. Torres' sprite in the data centre has a beard and glasses; Owen's has a cap and hi-vis. The "Get into the research portal" task ticks on flag 1, not when the launcher opens. Debrief: "You read the badge log properly…" and, in the credits, BORROWED BADGE. Record time to certainty, and whether the Halloran detour felt real.

### Run E: vetting files first, and the exposure ending
New game.

1. Get the badge log, then ask Patricia for the vetting files at once (before Halloran or the lanyard). Both files arrive ("Neither one's tidy"). Halloran's file shows a late report, no dates and a cancelled interview. On its own it should not clear her: check `found_halloran_alibi` is still false. Torres' file sets `torres_suspected`, and "Find Out Why" appears.
2. Read the lanyard. Name Torres with both halves of the case. Take the public-exposure ending; re-talk shows "Go home, David. They'll come for you soon enough." The debrief has the Zurich declared-versus-undeclared line and the SAFETYNET cost lines. Check `verify-run.rb` after each run.

## Round 3 confirmation (one short run, about 15 minutes)

### Run F: files first, then a reasoned naming
New game, in-game clues only. Keep the detective log.

1. Before the badge log, check that nobody volunteers Torres: Patricia's suspect line spreads motives across Halloran, Ben and Torres; the flyer says "one of our colleagues"; Owen's odd-hours answer describes "someone from crypto" in the hallway with no name.
2. Get the badge log. Owen's note explains Sunday and Amara, not Ben. Ask Patricia for the vetting files. Both arrive, and **"Find Out Why" does not appear**; neither does HaX's "Torres is buried in debt" topic (check `torres_suspected` is false).
3. Name to Patricia by phone. The menu shows bare names. Pick Ben: "Thursday at eight? The transfers run two till four…" (no cost). Pick Torres and the decoy "His own badge is on the server hallway those nights.": refused, and the call ends. Ring back, pick Torres and "Check who comes in the front door just before the spare is used.": accepted. "Find Out Why" appears, and its first task reads "Get IT's spare card for his office".
4. Try Torres' office door before step 3 if possible: the text should be the neutral "Office keycard…" line.
5. Play on to the data centre and a full naming. The new "[And the badge log…]" choice should not show (already reasoned). Watch the texts land spaced, not stacked, over the objectives. Debrief: "You read the badge log properly…". Check `verify-run.rb`.
