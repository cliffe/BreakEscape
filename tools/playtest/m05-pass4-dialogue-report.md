# m05 pass-4 dialogue playtest

**Question answered:** plumbing plus on-screen reading of the rewritten dialogue (question 1 and a little of 2). Not a solvability pass: the four flags are session stand-ins.
**Setup:** keyless server :3001, headless, fast speed, load average about 2. Briefing driven by hand in both games (no `bootstrap`).
**Games and logs**
- Game A, id 1441: new-player detective run, one reload. Log `tools/playtest/m05-pass4-dialogue-session-A.jsonl` (3053 commands).
- Game B, id 1442: wrong accusation (Halloran), then Patricia knocked out with `debugKO` (combat not played). Log `tools/playtest/m05-pass4-dialogue-session-B.jsonl` (1615 commands).
- Scratch: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/129f788c-d240-4d67-b97d-c380ab27daf1/scratchpad/m05-dlg-playtest/` (verify-A.txt, verify-B.txt, screenshots).

## verify-run.rb
- **1441:** `VERDICT: progress recorded — 9 rooms beyond the first, 1 objects unlocked, 4 flags submitted.` 51 globals, incl. door_log_reasoned, torres_suspected, torres_identified, torres_turned, elena_treatment_funded, final_choice, debrief_played, recruiter_texted.
- **1442:** `VERDICT: progress recorded — 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.` 44 globals, incl. halloran_accused, patricia_ko, torres_arrested, door_log_reasoned, debrief_played.

## Earned-secrets table
| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Server badge (A, B) | cloned EM4100 | Owen's lanyard via the "(Lean over his log screen...)" choice and the cloner | A: after Owen/Halloran/Lisa; B: after the Halloran accusation | yes |
| Server room password (A, B) | `quantum2024` | Owen, "The server room wants a password" (A: reason = Patricia's log; B: "Security's signed it off") then the sticky note | after reading the IT notice | yes |
| IT Spare Office Card (A, B) | item | Owen, after Patricia authorised the office (A: reasoned naming; B: HaX relay) | after the naming | yes |
| Torres' print (A, B) | lift matched to David Torres | the mug in his office, dusted in-game (loop, 72%) | office | yes |
| Briefcase (A, B) | pick lock | `completeLockpick` | office | yes, PASS (assisted) |
| Flags 1-4 (A, B) | `<flag:1>`..`<flag:4>` | none: no VM in standalone | drop-site terminal | **no**. Reached the drop-site and the vault door, so the route to the flag station was earned; the flag values were handed over. Everything from "flags verified" onward (HaX flag texts, debrief trigger) is exercised, not earned. |

## Detective timeline (game A)
1. Briefing: eight names, three tells (odd-hour badges, money, change), "don't take anyone's hunch for proof, Patricia's included". No name.
2. Patricia's suspect list: Halloran (row with the CEO), Ben (asked twice for a pay review), Torres "distracted". Evenly spread; "angry, skint and distracted aren't evidence". Good.
3. Incident log (pencil note: ask Owen). Owen's odd-hours answer: Halloran lives in the lab, Ben does evening runs ("always behind, always skint"), and "someone from crypto" stood in the server hallway "looking wrecked". Unnamed.
4. **Badge log: first real suspicion (Torres), about a third of the way in.** The log gives four nights of `#4408 D. TORRES` at the main entrance six minutes before `#4471 R. HALLORAN (spare)` on the server hallway, her own badge never after hours. I suspected Torres for the means and thought Halloran was the owner of a borrowed spare, not the user. Owen's pencilled note explains Sunday and Amara.
5. Halloran: Zurich 23rd, lanyard on her monitor, "David, mostly" in the lab after hours. This is the point I was fairly sure.
6. Lisa (optional): David crying in the car park, desk phone rung and taken in the stairwell, Elena, $380,000. Motive, not means.
7. Break-room leaflet: "R. CALLED AGAIN. RETAINER + THE DEBT, ALL OF IT. SAY YES BY THURS." Ambiguous: "R." could be Ruth, "Thurs" fits Patricia's Ben refusal. It did not move me off Torres but a careful player could be thrown.
8. Naming Torres with a reason felt earned. Ben first: refused with a specific reply ("Thursday at eight? The transfers run two till four, and he logged it with Owen"), no cost. Torres with "He's been under strain. His wife's ill.": refused, call ends ("Half this building has someone ill at home. That's not evidence."). Then "Check who comes in the front door just before the spare is used.": accepted, "That's a pattern. It's not a reason...", office authorised. The correct reason is a pointer to the log rather than a deduction the player states, so it reads a little like handing Patricia a homework task, but the decoys fail for sound reasons.
9. Anything pointing at Torres before the badge log: nothing that names him. Soft pointers a player can hit first: Lisa's "David Torres has barely said a word in weeks" and her optional David branch (if the break room is visited first this is the strongest early lean); Owen's "wrecked" hallway sighting; Patricia's "distracted"; Torres is the only crypto person listed as "Cryptography Lead", and Owen's vault line ("The cryptography lead's thumb and nobody else's") comes after the log anyway. In game B, HaX's nudge text ("whose badge came through the front door just before hers?") hands the log reading to the player, which is generous but fine after a wrong accusation.

## Screen reading (what I looked at)
- No "Name:" prefixes in any phone bubble (HaX, Patricia, Recruiter) or conversation. No "You:" bubbles. The only player bubbles are the chosen choice text (speaker label shows the standalone player name `demo_player`), including the phone choices.
- Narration is italic and centred in every scene (Narrator style read from computed style: `italic / center`). Dialogue is `normal / start`.
- No empty lines seen. En dash written as " – " in the Netherton cameo ("HaX – the detail."). Object notes still use plain hyphens as written (see worst lines item 11).
- Screenshots looked at: lab (sprites distinct: player hooded, Halloran in lab coat, Owen cap and hi-vis), Halloran portrait, phone thread, title/continue after reload, reception after reload. Torres' beard/glasses sprite not screenshotted.

## Reopen conversations (same session)
One line, never blank, never doubled, in both games and after the reload. Examples: Patricia "Go on." / "What now?" / "Quickly, now. The CEO's prowling." / "Do. I don't like surprises." (exit); Owen "What else?" / "Go on. I'm half listening." / "Yeah?" / "Cool. I'll be here. I'm always here." (exit); Halloran "Quickly, please. I've work to do." / "Go on, so." / exit "Good luck. I mean that."; Lisa "Anything else? I've got nowhere to be." / exit "Any time. I'll be here. Apparently forever."; Torres "Still here." Halloran's "Oh, no." and Owen's news about David end with the choice list directly (no "What else?" after them), as intended.
After the reload, Patricia opened on "Go on." and the log was still in the notepad (11 pages).

## Voices
Distinct: Owen (dry Mancunian, "Finally. Someone to fix our mess who isn't me.", "I did half of Finance on last year's pen test.", "please don't put that in your report"), Patricia (clipped, "Bring me a name or a pattern", "If you're wrong, that's her career"), Halloran (Irish "Go on, so", "I hope to God you're wrong about my team"), Lisa (chatty, "Cluedo", "poor lamb"), Torres (the strongest writing: "Is thirty to forty-five families. Like mine."), the Recruiter (only one text seen; not rung). HaX and Patricia's phone are the least distinct from each other: both short declaratives with an instruction at the end. The Recruiter and HaX both say "Call me/ring me" style closers.

## Hooks
All fired; none failed.
- Gives: Visitor Badge, Server Hallway Badge Log (found_door_log, task ticks), cloned badge (server_badge_obtained), password note (server_password_obtained), IT Spare Office Card (after naming), vetting files (A: on request after the log; B: from the desk after KO), Contractor Pass (B: HaX relay), journal, bills, print.
- Aims/tasks: "Find Out Why" tasks (obtain_torres_keycard, access_torres_office, find_journal, find_medical_bills) appear only after the reasoned naming in A (checked via task list, not visually); "Prove the Exfiltration" aim after the server door and password.
- Reason step: decoys refused, correct reason accepted, no cost on Ben or decoys (A). B: Torres accepted on the log alone after a Halloran accusation.
- Wrong-accusation costs (B): Patricia suspends Halloran, HaX nudge text about 12 s later, Halloran "Security have suspended my access...", Torres "You had Ruth suspended. I watched Security walk her back to the lab.", debrief "Dr Halloran spent four hours under suspension because of a badge log read halfway", credit WRONG ACCUSATION — Dr Ruth Halloran suspended, then cleared; the HaX naming menu no longer offers Halloran.
- Patricia KO (B): HaX relay ("Patricia's down..."), phone choice "(Ring her. It rings out.)", Owen "Nobody's answering down there, though. Is Patricia all right?", new choice "Security's signed it off. Check your messages.", Torres "Security's gone quiet tonight", re-talk "Sit tight. The police are on their way." with no Patricia mention, debrief "Patricia Morgan spent the night in A&E."
- Credits A (read from #bv-cr-label): MISSION COMPLETE / INSIDER TRADING / OPERATION SCHRÖDINGER: STOPPED / CIVILIAN LIVES SAVED: 30-45 / THE CASE: MOTIVE, MEANS AND AUTHORISATION — all on file; BORROWED BADGE — Halloran's spare traced back to Torres / DAVID TORRES: TURNED / ELENA TORRES: treatment paid for by SAFETYNET / SOFIA (11) AND MIGUEL (8) TORRES: Father home, family intact / THE RECRUITER: NEVER HEARD HER OFFER — the TalentStack list went to SAFETYNET / QUANTUM DYNAMICS: CEO'S STAND-DOWN — on file with the Home Office review / The Architect remains at large...
- Credits B: ... RECRUITMENT PIPELINE — TalentStack link not documented; WRONG ACCUSATION — Dr Ruth Halloran suspended, then cleared; HANDED TO THE POLICE — said nothing; ELENA: Still fighting Stage 3 cancer — treatment unfunded; Father facing trial, mother untreated; THE RECRUITER: NEVER HEARD HER OFFER — the TalentStack list was never recovered; WHO STOPPED THE INTERVIEW — never asked. B has no "CIVILIAN LIVES SAVED" line (upload stopped at 97%); A has it. Say if that is intended.
- Timed texts: Recruiter text and HaX's "That TalentStack number is the Recruiter..." arrived after the call to Patricia closed (about 12 s after I closed the phone, not 6 s while it was open). Several HaX texts arrive late or out of order: "Fingerprint reader on the key vault. It takes the cryptography lead's print..." landed after "That's Torres' print" in both games.

## "Didn't know what to do" moments
1. Dr Halloran cannot be reached from the front of her desk (the player stops at 35 px, outside the 32 px range) and she paces. The way in is round the left end of the desks, and `moveToNear` reports `arrived-but-outside-plain-range` three times. Layout finding for the lab, not dialogue.
2. In the research lab the exit door is easy to lose after the first visit (the door sprite vanishes); `enter` walked me into the wrong place twice (harness gotcha).
3. Owen's first menu has "I'll need your help with access" and it quietly goes after the first visit if you pick another branch. Nothing needed it, but a player may wonder where the access ask went. The access is found through the badge-log, password and lanyard choices.
4. The Torres office door, tried while holding the RFID cloner, opens the RFID flipper (no "Office keycard..." text seen), so the neutral text could not be checked. A player with a cloner may try to clone the door.
5. Torres' first dust: the fingerprint minigame offered Owen and Torres as the only candidates, so the print answer is a free pick for a player who has read the log.

## The 10 worst lines
1. Patricia (A), "How did you spot it?": "Three weeks to rule out legitimate remote work. Then I was told to stop looking." then, with no question between: "Visitor badge. It gets you through the front of the building and nowhere that matters." The visitor-badge answer belongs to "What access can you give me?" and reads as a reply to something unsaid in this branch.
2. Lisa (A): the choice "What do you know about his wife?" is offered straight after the gossip, before anyone has mentioned a wife. Her answer opens "Elena came to the Christmas party two years ago..." then "He told me the number once, after a glass of wine. Three hundred and eighty thousand dollars." "The number" has no antecedent (Lisa never said what costs what; the flyer says "treatment").
3. Torres (B, hard branch), after the player says "You knew. The dispatch network. The projection. You knew.": "'Investigative journalists exposing a corrupt contractor.' That's what the Recruiter said. For about two weeks." It answers "What did they tell you it was for?", which the player did not ask.
4. Narrator (A, turn path): "You tell him the Recruiter rang you tonight, with forty-seven more names lined up behind him." The player was only texted, and did not ring back; the narrator also vouches for SAFETYNET ("SAFETYNET pays for the trial, and if it ever gets dangerous, the family moves somewhere quiet.") in the lines before it, which the CR3 fix removed elsewhere.
5. Halloran (A), after "David Torres is my cryptography lead, the best I've worked with.": the "What can you tell me about David Torres?" answer is "David is one of the finest cryptographers in the country." (same praise again, nothing new) and then "What else?". Flat.
6. HaX debrief (A): "An approach. A recruiter's leaflet, with his answer on the back." The leaflet note ("R. CALLED AGAIN. RETAINER + THE DEBT... SAY YES BY THURS.") has no name or initials for him and is not an answer. Same debrief: "The final upload stopped at ninety-seven per cent." conflicts with the briefing's "73 per cent staged / the last 27 per cent stays in the building".
7. HaX debrief (B): "I know that's what you said to him. I'm not sure it's true." The player's line was said to HaX; the reply only makes sense if the player took the cold line to Torres. Also "The job got done. We'll talk about the rest another time." reads as two different closes in a row.
8. Patricia phone (B), the switch from Halloran to Torres: "...His badge at the front door, then her spare six minutes on. Every night. And hers never comes in after seven." then "It's enough to look in his office. I'll tell Owen you can have the spare." She never acknowledges that she has just suspended Halloran on the player's word, and "hers" is ambiguous (Halloran's or the spare's). The Halloran suspension only gets acknowledged by HaX and Torres.
9. Briefing, HaX: "Fair enough. Trust what you see in there." follows "I'll read the room when I get there." two lines after the briefing told the player not to take hunches for proof. Also "We have no badge, Agent 0x00. What happens to them after that isn't ours to decide." / "Whoever it is, ENTROPY got to them first." changes subject mid-thought.
10. Owen (A): "Sure. Whatever you need, within reason. Mostly reason." Flat gag with no information, followed by the hub line "What else?" in the same beat. (Also, "Don't be. Just don't let Patricia see you do it." plays while Patricia is unconscious in B.)

Other small things, in no order:
11. Object notes keep plain hyphens: "Thank you - Lisa", "QDC PERSONNEL SECURITY - VETTING AFTERCARE", "TALENTSTACK ... reward loyalty - and who look after their families", "OPERATION SCHRÖDINGER - UPLOAD SCHEDULE". These are scenario text, not ink, and not converted to " – ".
12. The incident log says "after-hours server room access (23:47)" while Owen's choice and the badge log say "server hallway". Patricia in B says "her spare, at two in the morning" while Owen's 23:47 question is the one in the menu.
13. HaX's "Torres is buried in debt he's hiding. Is that the hook?" is still offered after Torres has been dealt with (A), and "What do you know about his wife" is still offered when she has just been described.
14. In B the fast briefing route ("I'm ready. Give me the objectives" then "Fast and direct") never states the death toll or the 73 per cent, only "that last twenty-seven per cent stays in the building" and the four hours. The "Thirty to forty-five lives" line (M1) only appears on the "I'll read the room" approach answer. Players taking the other two approach answers skip it. Check against the design: the number first appears for them in the journal and Torres.
15. Owen's password-ask choice still shows "I need into David Torres' office" after the card has been handed over (A), so a player can ask twice.

## Not done
- Fight branch with Patricia KO'd (the "post-KO narration" check): skipped for time.
- Exposure ending and the Recruiter call (deliberately not rung).
- Rounds D/E/F alternates beyond what the two games hit (vetting files first; Ben's "Thursday" decoy was hit; Halloran's vetting file alone not tested for found_halloran_alibi).
- The neutral Torres door text (needs a player without the cloner).

## Housekeeping
Both sessions stopped with `session-stop.sh`; no browser of mine left running (the headless browser for game 1443 belongs to another agent and was left alone). :3000 untouched. No ink, scenario or engine files edited, nothing committed.
