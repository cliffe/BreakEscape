# m08 "The Mole": pass 5 blind playtest A ("do your best")

Tester: Sonnet, headless (machine load average was 43 with three other playtests running, so timings are not representative).
Question answered: solvability and deduction (can a player work out the traitor from what the game gives them), plus plumbing along the way.
Game id: 2596. Keyless server :3001. Session log: `tools/playtest/m08-blind-A-session.jsonl` (3,513 lines; the log timestamps are UTC, game created 19:24:48, last write 19:53:23, 1,716 s of wall clock played).
Route: opening cutscene, Director, all three suspects, break room, Security Archives, server room (flags supplied), fingerprint kit, one mid-run reload, Director's reading quiz, safe, interrogation suite, debrief, credits.
Not run: the "struggling player" persona, any off-path softlock test, the "leash" disposition, the "I have a name forming" instinct branches, ATHENA's post-intro conversation, the Junior Analyst.

## How I drove it, and two honest caveats

- I did not use `bootstrap`. I drove the opening cutscene with `mg continue` and declined the tutorial with `dismiss`.
- **Caveat 1, harness-made accusation.** My first `converse` call on Vector ("exhaust the branches") picked "I think it's you, Vector. (Out loud. The whole floor will hear.)" and then "I was wrong to say that. I'm sorry." I did not choose that as a player. I kept the run going rather than restarting, because it showed the consequences of an early public accusation (see the debrief section). Every later conversation used explicit choices. Lesson for the next tester brief: `converse` will take accusation branches unless you pass `choices`.
- **Caveat 2, state I could read by accident.** `brief.recentGlobals` shows global names (`accused_vector`, `nightshade_tipped_off`, `nightshade_tidied`, `found_phantom_lead`) that a player would not see. I did not use them to decide who the mole was. One `mg getState` on the fingerprint kit also exposed a `debug` block with the print pattern; I identified the pattern by eye from the screenshot, as a player would. All reads of a brief, note or screen text came from visible text.
- DOM use, all said where it happened: (a) opening the Notepad and phone by clicking the inventory icon (the harness has no command for it); (b) driving the fingerprint-kit brush with pointer events over the visible canvas (arrow-key and Space brushing cannot be sent through `pressKey` while a minigame is active); (c) clicking "Resume" on the resume overlay after the last reload; (d) a MutationObserver-style poll on `#bv-cr-label` to read the credits.

## Verify-run output

```
game            2596  (mission 52)
created         2026-10-16 19:24:48 UTC
last write      2026-10-16 19:53:23 UTC
played for      1716s of wall clock
current room    "main_lobby"
unlocked rooms  9: main_lobby, director_office, cryptography_lab, operations_floor, intel_analysis, break_room, security_archives, server_room, interrogation_room
unlocked objs   5: nightshade_locker, vector_locker, phantom_locker, badge_printer, director_safe
inventory       27: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Suspect Dossiers, Personnel Print Job -- Director's Investigation Request, Phantom's Off-Book Notes, Post-It On The Coffee Machine, Leak Timeline (someone's working notes), Badge Audit Printout -- Leak Window, Global Threat Database Catalogue, USB Stick -- PERSONAL_BACKUP.enc, Insider Threat Initiative -- 'Deep State' Brief, Holdall -- Locker 0x47, Token Pouch -- Locker 0x23, Project Sheet -- Locker 0x23, Boarding Pass Stub -- Locker 0x88, Folded Suspect Sheet -- Locker 0x88, Printed Server-Zone Badge, Server Access Log (excerpt), Vector's Locker Key, Nightshade's Locker Key, Interrogation Suite Code Card, Sealed Psych Evaluation -- Agent 0x47, Sealed Vetting Query -- Agent 0x23, Sealed Standards Referral -- Agent 0x88
NPCs met        12: opening_briefing_cutscene, receptionist_ai, agent_0x99, closing_debrief, director_netherton, agent_nightshade, agent_vector, background_analyst, agent_phantom, agent_0x99_person, background_agent, nightshade_confrontation
flags submitted 4: flag{m08_the_mole_safetynet_gitlist_server_1_cf1e68}, ..._2_ba22a3, ..._3_3ca977, ..._4_4a6a08
globals set     60: access_nudge_sent, accused_vector, all_flags_submitted, badge_cloned, brief_taken, ... debrief_played, debrief_stance, fate_decided, mission_complete, mole_identified, named_on_evidence, nightshade_arrested, nightshade_tidied, nightshade_tipped_off, tomb_gamma_location_known, vector_audit_confirmed ... (60 in all)

VERDICT: progress recorded — 8 rooms beyond the first, 5 objects unlocked, 4 flags submitted.
```

(Shortened only in the inventory-adjacent flag values and the middle of the globals list; the verdict line and every count are as printed.)
`mission_complete` and `debrief_played` are set, so the server-side conclusion happened.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Security Archives password | `TrustNoOne` | Post-it on the coffee machine, break room ("Archives backup pw") | before the archives step | yes |
| Visitor badge printer PIN | `0311` | Same post-it ("Visitor badge printer PIN") | before the badge step | yes |
| Server-zone badge | (item) | Printer output tray, lobby, after the PIN | before the server-room door | yes |
| Director's safe PIN | `2407` | Ops-floor print job: "Requested by Director M. Netherton (svc no. 2407)" plus the margin note "every safe opens on its owner's service number" | before the safe step | yes |
| Interrogation Suite code | `5386` | Director said it aloud after the reading quiz, and the code card in his safe says the same | after the quiz | yes |
| Staff lockers 0x23, 0x47, 0x88 | (lockpick) | Lock Pick Kit from the starting inventory | n/a | yes, **assisted** (`completeLockpick`) |
| `safetynet_gitlist_server:flag_1..4` | `<flag:1>`..`<flag:4>` | Reached the "GitList Repository Server" launcher in the server room, which needs a local VM that does not exist standalone | server room | **no, flag supplied** |

Boundary of what this run proves: the flag rows are exercised, not tested. Everything the game gives from the VM (the repository files, the committed credentials, the sent mail to architect@entropy.onion, the root auth-log file naming the account) was **never seen by me**. I only read the in-game summary of it that Agent HaX sends on the phone after each flag, plus the Director's later "the box has an account on that terminal for the same 47 minutes". Whether the account named in the root file is plainly Nightshade's is therefore unproven in this run.

## Timeline (what I thought the goal was)

Times are play order, not clock.

1. Opening, ATHENA cutscene in the lobby (a night-blue lobby, "Level Red" board). Goal: report to the Director, north of the lobby. ATHENA's lines already name three people on a planning list and add, unprompted, that "the PIN device you are thinking of is still signed out to Agent 0x47".
2. Director's office. Goal: find the mole among Vector (0x23), Phantom (0x88), Nightshade (0x47), quietly, with proof ("a hunch is not proof"). He will not give access yet: talk to all three first. I read the Suspect Dossiers on his desk. Tried his safe (PIN, locked).
3. Operations floor. Read the personnel print job in the tray: service numbers for all three plus "every safe opens on its owner's service number". Talked to Vector (the accusation incident, see Caveat 1). Goal: interview the other two.
4. Intelligence Analysis: Phantom (conversation starts on approach), his off-book notes. Goal shifted: the leak came from Crypto Lab terminal 03 for 47 minutes; "doors tell you who was in a room, not whose account"; find the door audit.
5. Crypto Lab: Nightshade. Break room: Post-it (archives password, printer PIN), leak timeline note, HaX, Off-Duty Agent. Goal: get into the Security Archives for the door audit (the objective panel says so in plain words).
6. Security Archives, badge audit printout. **My conclusion that it was Nightshade formed here** (see Deduction). Goal: corroborate, then name him.
7. Lockers in the break room (all three, lockpicked). Nightshade's: wiped USB stick, a "Deep State" brief page, an emptied holdall shelf. Vector's: annex token slip, project sheet. Phantom's: half boarding pass to ZRH, a suspect sheet ending "DOORS, NOT FACES".
8. Lobby printer (0311) then the server room. Auth log excerpt with a redacted user. Flags 1 to 4 supplied; objectives moved through "Get Into The Internal Repository" to "Follow The Account To Root". HaX's phone thread: "Who was behind that lab door?"
9. Lifted the thumbprint off the USB stick with the fingerprint kit; reference cards were Director Netherton and Nightshade; matched Nightshade.
10. **Page reload** (after lifting the print, in the server room). Resumed: title screen "Continue?", Mission Brief pops up again, player put back at the lobby spawn (160,144), inventory and tasks intact.
11. Director: "I can name the leak" is a reading quiz, not a name. He sent me back to "the men who went through that lab door" to check their rows. Vector and Nightshade each confirmed their own row. Back to the Director: quiz (10:38; Nightshade; why not Vector; why trust Phantom's audit) then he named the suite code and told me to read Dr Okafor's evaluation in his safe first.
12. Director's safe (2407): code card, Okafor's evaluation of Nightshade, a vetting query on Vector, a standards referral on Phantom. All three sealed by the Director.
13. Interrogation suite: confrontation, confession, a choice about his fate (police, not a leash), Netherton's debrief in the corridor, credits. All six objectives ticked.

## "Didn't know what to do" moments

None longer than about a minute. In order:

- Right after the three interviews: not stuck, because the objective panel read "Find the door audit for the leak window in the Security Archives". The archives door wanted a password; I did not know where to look for about 30 seconds, then the break room Post-it ("Archives backup pw") answered it. Good.
- The Director's "Give me a reading. Before you read it to me, take it to the men who went through that lab door." I had the door audit and expected to name the man to the Director. I was unsure for about a minute whether "I can name the leak" would take a name. I tried "I have a name forming" first, which asks for a gut-feel suspect with "Vector. The odd hours" style options, backed out with "Not yet", then "I can name the leak". The cue "come back when one of them has told you it is right" unstuck me.
- Fingerprint kit: after clicking the USB stick in the inventory I did not know I had to drive a five-step kit. Once open the on-screen hints were fine. Mechanical problem for the harness only (brush strokes).
- After the print was matched nothing told me to go to the Director. The objective list showed only `name_the_mole`, which was the right pointer.

## Decisions

| Decision | Arguable or obvious? | Consequence seen later? |
| --- | --- | --- |
| Accuse Vector out loud (harness-made, then apologised) | The option's label says "(Out loud. The whole floor will hear.)", so it reads as a clear public act. | Yes, strongly. Off-Duty Agent: "Word is you've been calling people traitors to their faces." Nightshade's confession: "You put it on Vector in front of the floor. Walls are thin here. So I tidied." His holdall was gone from the locker and the USB was wiped. Debrief: "You accused Vector to his face. I read the transcripts. It will follow him longer than it follows you." Credits: "VECTOR: Accused to his face, then cleared by the logs". My apology to Vector is not mentioned anywhere afterwards. |
| Picking all three staff lockers (in front of a witness) | Arguable. The game gives no warning that the Off-Duty Agent sees. | Yes: Off-Duty Agent says he is telling the floor he saw nothing; Director raises it in the debrief ("a colleague's locker in front of a witness"). |
| Told the Director "Not yet" when asked for an instinct | Obvious from his own line ("Keep it to yourself until it is more than a feeling"). | Only his approving line. |
| Reading quiz answers (10:38 / Nightshade / "door log has him out of the lab at 10:32" / "the people on it confirm their own rows") | Obvious. See Deduction: every wrong option was visibly wrong. | None visible. I took the "own rows" option because he had told me to ask them. |
| Fate: "No deals. The police get the file." (vs a leash) | Arguable and a good one. Nightshade: "Clean. Predictable." | Yes: Netherton: "Some lines you hold because they are the line"; credits: "Handed to the police with the full case file. No deal." |
| Debrief: "Okafor warned you in writing. You sealed it. Own the gap." (vs "He's the crime, not you") | Arguable. I chose accountability because I had read the sealed Standards and Vetting papers too. | Yes, in the debrief: "I will put my own name in the report beside his." Not in the credits, which only name the leak, fate, Tomb Gamma, two suspects and the case. |
| "It was wrong, sir" (vs "It was the job, sir") | Arguable, though in my case the Vector accusation was not my choice. | "It was. Now the case." The credits do not carry it. |

## What I learned, in my own words

The leak was a single login on a lab terminal for 47 minutes, two days before Portland. The terminal tells you the minute but not the person; the badge doors tell you who stood in which room but not whose hands were on the keys. You put the two together: only one of the three was in the Crypto Lab for the whole of the window. Vector looked guilty (locked screen, a token signed out inside the hour, seen at the lab bench) but the doors put him in the library by 10:35, three minutes before the file opened. Phantom looked guilty (absences, Zurich boarding pass) but his own row puts him on a plane from 10:09 to 11:54. Nightshade was the one who looked innocent by being calm, tidy and coaching me. The motive was belief, not money: ENTROPY recruited him in training and waited fifteen years. The four attacks were cover for the theft of the threat database; Tomb Gamma in Montana (47.2382 N, 112.5156 W) is the next target. The Director had sealed warnings on all three suspects, and Nightshade's psychological evaluation by Dr Okafor was the one that mattered.

## Five best lines

1. Nightshade, on being calm: "Fear is what you feel when the outcome is still uncertain. I made my peace with most outcomes long ago."
2. Nightshade, caught: "I wiped the file and forgot my own thumb. Fifteen years, and I forgot my thumb."
3. Vector: "Do the maths again, please. The maths is the only friend I've got in this building."
4. Netherton, debrief: "You read the clock, not the face."
5. The Post-it note: "(In a building called the Citadel, on a Level Red posture, both are on a post-it by the kettle.)" Also close: the Off-Duty Agent's "I'll be telling everyone I didn't see anything. Very convincingly."

## Five worst lines

1. Nightshade: "Don't rule anyone out because they wrote the list." Tells you it is him, as advice.
2. Nightshade, handing over the locker key: "Take it. 0x47, second from the end. I'd genuinely encourage it." He had already tidied it; the eagerness is a cartoon signal and the "I'd genuinely encourage it" phrasing repeats from "Pull the terminal logs. I'd genuinely encourage it."
3. Narrator, twice (after his tells and when handing the key): "He holds your eye a moment longer than a colleague would." The prose is pointing a finger.
4. Nightshade, the confession: "Order is a candle in a hurricane. We stand round it with our hands cupped, night after night, and call it a career." Reads written, not spoken.
5. Director, reading quiz: "Which of the three was behind that door at 10:38?" A multiple-choice with "None of them" as the decoy, after I had already read the audit.

## Deduction

**Who I concluded it was, and when.** Agent 0x47 Nightshade. I reached it in the Security Archives when I read the badge audit printout (about a third of the way through, after all three interviews, the break room and the archives, and before the server room). Everything after that, locker and USB, fingerprint, auth log, confession, was confirmation, not discovery.

**What it rested on, in the order I found it.**
1. Director's dossiers: all three have planning access, so no one is excluded by access.
2. Phantom's notes: a login from Cryptography Lab terminal 03; "doors tell you who was in a room, not whose account; match it to when the plan was opened".
3. Leak Timeline note (break room): window D-2 10:38 to 11:25, "find out who could get through the lab door; get the door logs".
4. Badge audit printout: lab door shows Nightshade in 10:15, out 11:43; Vector in 10:24, out 10:32, library door 10:35 in with no exit until 13:40; Phantom on a plane 10:09 to 11:54; 0x3C (break room, off-shift, no planning clearance) in since 07:52.
5. Off-Duty Agent: saw "the nerdy one, Vector" at the bench at about 10:20 to 10:30, before the window (a deliberate red herring, and the door row fits it).
6. Nightshade confirmed his own row ("Yes, that row's right").
7. Corroboration: Nightshade's locker had been broken into "tonight" and his holdall was missing; the USB stick he wiped carried his thumbprint (matched after I lifted it); Okafor's evaluation, which the Director had sealed.

**Who else I suspected and what ruled them out.**
- Vector: "locked screen", a token signed out at 10:26 "inside the hour", seen in the lab. Ruled out by the door log (out of the lab at 10:32, into the library at 10:35, still in the library at 13:40), then by Vector's own statement that the row was right ("eight minutes"), and by his locker (project sheet, key schedule, nothing about the plan).
- Phantom: unlogged absences and a boarding pass to ZRH with "Usual place. Bring the list." Ruled out by the travel desk row (wheels up 10:09, down 11:54, manifest on file) and by his own off-book notes. He is the only one of the three whose evidence is hard to read in the other direction, because "Usual place. Bring the list." is never explained in this run.
- 0x3C, the Off-Duty Agent: briefly, because he is in the break room beyond the door log. Ruled out by no planning clearance ("I couldn't open that share if I wanted to") and a flat statement, which I took at face value; I could not test it.
- The Director: only because the fingerprint kit offered "Director Netherton" as one of two reference cards. I did not seriously suspect him, but the card list puts the idea in the player's head.

**How sure I was when I acted, and whether I could have been wrong.** About 85 per cent from the doors alone and effectively certain after Nightshade confirmed his row and the thumbprint matched. I could have been wrong in one specific way: the door log shows presence, not an account. If someone had used Nightshade's login (a scripted job, the off-shift agent in the break room) the log would not tell me. I did not see the auth log's account name (VM-gated), so the "account" half of "a door and a login at the same minute" was told to me by the Director rather than shown. The Director also says in the quiz "he walked into his own lab twenty-three minutes before that plan opened, and out again eighteen minutes after it closed", which is the door log read back to me.

**Did anything give the answer away before I had earned it?** Yes, several things, in order of when I noticed them:
- ATHENA's opening cutscene: "The PIN device you are thinking of is still signed out to Agent 0x47." The only suspect named with a specific incriminating object in the intro (noticed when I first heard it, but not weighed until later).
- Director's brief: "[Nightshade] helps write the plans ENTROPY seemed to be reading."
- The suspect dossier: "In the lab most nights, alone" for Nightshade only.
- Nightshade's own dialogue: "I'm always here" (three times), "Pull the terminal logs. I'd genuinely encourage it", the desk with "nothing personal on it", and the coaching line "Don't rule anyone out because they wrote the list". Phantom's suspect sheet, "always in. too easy?", points two ways, which helps.
- The break-room Leak Timeline's own wording: "a terminal in the Cryptography Lab. Find out who could get through the lab door." The only suspect with a lab desk is Nightshade.
- The evidence-wall display in the interrogation suite carries "CASE FILE 0X47 CONCLUSIVE" when you walk in, before the confrontation dialogue (not a problem in order, since the Director has named him by then).
- The reading quiz: three questions whose wrong options are visibly wrong.

**Was the evidence enough to be sure, or did I end up guessing?** The doors plus Nightshade's own confirmation plus the thumbprint were enough. I never had to guess between the three. The one gap is that nothing a player reads in play shows the account name on terminal 03 (it sits behind the VM). In a run where the VM works that is presumably closed; here it was not tested.

## Lighting and conversation backgrounds

I only captured a conversation screenshot in the interrogation suite: the 400 px background is a grey door, black chairs and steel table under cold light, which matches the room and the night shift. I did not capture backgrounds in the director's office, ops floor, intelligence analysis, crypto lab or break room conversations, so I cannot say they match (not tested). Overworld lighting, from screenshots: lobby is dim night blue with a red "Level Red" board and reads right for the night after the attacks; the crypto lab is bright white-blue with a monitor glow at Nightshade's desk; the break room is warm wood with a translucent green circle and a thin green horizontal line across it (looked like a vision cone or a debug overlay for the Off-Duty Agent, see M2); the archives are grey-green and plain; the server room is cool blue. The interrogation suite has a spot-lit table and a red RECORDING lamp. After the confrontation the objective panel switches to a different frame style, which looked deliberate.

## Scores (1 to 5)

| | Score | Why |
| --- | --- | --- |
| Fun | 4 | The doors-versus-faces reading and the confession are good. The VM-less middle is flat. |
| Pacing | 4 | About 29 minutes of game time on a loaded machine; the middle (lockers, notes) goes quickly, and the quiz plus suite code gate the finale well. |
| Clarity of goals | 4 | The objective panel names every next step, perhaps too plainly ("Name the leak from the door audit, on evidence"). |
| Openness of decisions | 3 | Real choices at the end (fate, how to treat the Director) and one trap early (public accusation). The reading quiz and fingerprint cards are not decisions. |
| Teaching | 3 | The door-versus-account point is taught well and repeated. The VM part could not be assessed. The fingerprint kit teaches a real procedure. |

## Severity table

Counts: 0 blockers, 1 major, 7 minors. No finding is classified as a game bug; each is what I saw.

| # | Severity | Finding | Repro (log lines are approximate, search the log) |
| --- | --- | --- | --- |
| D1 | major | The mole is signposted well before it is earned: ATHENA's intro names Nightshade's missing PIN device, the dossier says "in the lab most nights, alone", Nightshade coaches ("Don't rule anyone out because they wrote the list") and is eager to hand over his locker key, and the narrator twice notes he "holds your eye a moment longer". The reading quiz then offers three questions with visibly wrong decoys. A player can name him from the first interviews and never need the door audit. | Game 2596: lines about 60 to 130 (cutscene and first interviews), 400 to 700 (Nightshade conversations), 2400 to 2600 (quiz) |
| M1 | minor | Apology to Vector is not remembered: after "I was wrong to say that. I'm sorry." the Director still says it "will follow him", and the credits say "Accused to his face, then cleared by the logs". | Log 19:27:51 onwards (about line 121); debrief near line 3200 |
| M2 | minor | Break room shows a translucent green circle and a thin green line across the room (looked like a vision cone or debug overlay). | Screenshot `s07_break.png` in `m08-blind/`, break room, after entering from the crypto lab |
| M3 | minor | Fingerprint reference cards (Director Netherton and Nightshade) are near-identical whorls. I chose by the inner-core tilt and by context (the stick was in Nightshade's locker). A player cannot really compare them. Putting the Director on the card list also plants the idea that he could be the mole. | Dusting minigame, compare step (log about lines 1250 to 1290) |
| M4 | minor | After a mid-run reload the player returns to the lobby spawn (160,144), not the server room where I was; the "Mission Brief" note pops up again. After the mission ended, a reload replays the credits (with a close button) and shows a "Resume Session?" overlay. | Log about line 1296 (reload), and the last reload at about line 3400 |
| M5 | minor | Overly written lines: "Order is a candle in a hurricane...", the repeated "I'd genuinely encourage it", "holds your eye a moment longer than a colleague would" twice. | Nightshade conversations; interrogation confession |
| M6 | minor | Dossier and Director disagree on Vector's role: dossier "Intelligence Analyst", Director "Signals and cryptography, on the operations floor", Phantom "Field Coordinator in intelligence analysis, north of the operations floor". Cosmetic but a careful reader notices. | Suspect Dossiers note; Director conversation |
| M7 | minor | Credits do not carry the player's main moral choice about the Director (own the gap) or the locker break-ins; they list the leak, fate, Tomb Gamma, two suspects and the case. | Credits text (line near 3480; `#bv-cr-label` list in the notes) |

Harness findings (not the game): `interact` on Security Alert Board, Operations Status Board, Nightshade's workstation and HaX in the break room reports `no-effect-confirmed` although the first two open a "Close"-button overlay that then blocks `moveToNear` with `blocking-ui`, and HaX and the workstation only show a toast; `converse` will take accusation branches unless `choices` is given (Caveat 1); `pressKey` is refused while any minigame is open, including the title screen; the harness has no command to open the Notepad or the phone.

## Top three issues

1. D1: the traitor is signposted by the opening scene, the dossier, and Nightshade's own behaviour long before the door audit; the reading quiz then hands over the answer.
2. M3: the fingerprint reference cards cannot be told apart by sight, and the Director appears as a candidate.
3. M4: a reload loses the player's position and re-shows the mission brief, and a concluded game reopens with a "Resume Session?" overlay and replayed credits.
