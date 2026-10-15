# m08 The Mole: pass 5 blind playtest, "struggling player" (A)

Blind, struggling-player persona. Reached the credits and read them through. Game 2510, mission id 52, keyless server :3001, headless (load was 0.6, no display assumed). Machine time 08:00 to 08:31, about 30 minutes.

Session log: `tools/playtest/m08_blindA-session.jsonl` (1793 lines, 1797 commands). Flags XML: `tools/playtest/m08_the_mole-flags-game2510.xml`.

What I read before playing: AGENTS.md "Standing user rules" and "Verifying work", the M08 brief "Rules" and "Environment", the playtest-scenario skill. Nothing under `scenarios/m08_the_mole/`, no SecGen XML, no exploit guides, no route driver. I did glance at `docs/test-bridge.md` section headings for the dusting minigame (harness only) and `playtest-session.js` command names.

Method note: I drive a text bridge, not a screen. Colour, layout and animation cues a human would see are outside this report. Where I say "the screen" I mean DOM text and the dialogue the harness returns.

## Severity table

| # | Severity | Finding | Where |
|---|----------|---------|-------|
| 1 | Moderate | The auth log excerpt stays `[REDACTED]` after the repo box is rooted (all four flags in, reload, re-read at 08:12). Nightshade then says "Bring me the account" and the player never has one. The Director's gate does not need it (he says the box "has an account" in his own words), so the mole is nameable without it, but a careful player will feel a loose end. In standalone this cannot be verified either way. Needs checking against SecGen by the user: does root on the box give the player an account name somewhere in-game? | server_room `server_access_logs`; Nightshade dialogue 08:20 |
| 2 | Moderate | Badge 0x3C (OFF-SHIFT) is inside the lab door from 07:52 to 13:10, so also present at 10:38. Nothing in the evidence rules him out. He is the off-duty agent in the break room who says he walked through for a stapler. A suspicious player could name him; the Director's question offers "None of them" but never says why not. I did not suspect him, but I did not rule him out either. | `badge_audit_printout`, break room |
| 3 | Minor | "Kettle." (HaX) is a one-word hint for the archives passphrase. I took it as the password and burned 1 of 3 attempts. The sticky note by the coffee machine (TrustNoOne) was found two minutes later. Reads fine in hindsight. | HaX phone 08:05, archives door 08:13 |
| 4 | Minor | Walking into the interrogation room starts the Nightshade confrontation at once. I never got to read the evidence wall ("the chain is in... one account") before it, and the room has nothing else to do first. The wall text appears to be meant as a recap. | interrogation_room, 08:25 |
| 5 | Minor | After a reload the player is back in the lobby (160,144) rather than the server room, sees the title ("Continue?") and then the Mission Brief note again. State, tasks, inventory, globals all preserved. Not a bug, noted as a small break in flow. | 08:12 |
| 6 | Minor | The early "I think it's you" accusations are on offer in every suspect's menu with no warning that they cost something later (tipped-off Nightshade, tidied locker, wiped stick, go-bag gone, credits lines). The cost is real and well reported afterwards, but a player cannot weigh it beforehand. Possibly intended. | all three interviews |
| 7 | Minor | Trust question in the Director's reading ("That audit is Phantom's query, off Phantom's printer. Why trust it?") offers four plausible answers. I chose "The people on it confirm their own rows" because the Director had told me to take it to the men on it. "The badge system printed it. Nobody typed those rows" also reads as sound. I did not test whether it fails. Worth the user's eye. | Director reading |
| 8 | Harness | `lock {code}` on a PIN keypad retried the same wrong code 5 times and used all attempts (Director's safe, I used Nightshade's number 4719 first). Not the game. | tools |
| 9 | Harness | `converse` stops at its turn cap and closes the conversation half-done; a first call on Netherton ended after six lines. Rerun with a higher cap. | tools |
| 10 | Harness | Wall boards (Security Alert Board, Operations Board, Tactical Board) report `no-effect-confirmed` from `interact`, yet the Operations Board did open a text dialog that then blocked `moveToNear`. Harness misreport, game fine. | tools |
| 11 | Info | Credits state VM facts ("Through a sudo rule", "Logged in as its owner. The mail to the Architect was in it") as if earned. In this run the four flags were supplied, so these lines are "exercised, not earned". | credits |

Counts: Blocker 0, Major 0, Moderate 2, Minor 5, Harness 3, Info 1.

No softlock found. Wrong-order play (accusing early, picking lockers before the audit, wrong answers to the Director, wrong print pattern, wrong print card, wrong archive password) all recovered with fair feedback.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|--------|-----------|----------------|-------------|---------|
| Director's safe PIN | 2407 (first tried 4719, wrong) | Personnel Print Job on ops floor: "Personal safe codes: service number, all three", Director's svc no. 2407 | 08:01:56 read, used 08:09 | yes (the print job is the only source I saw) |
| Server room reader | Director's card (MIFARE, darkside) | Netherton conversation with cloner, HaX's hint to run darkside | 08:07 to 08:08 | yes |
| Archives passphrase | `TrustNoOne` | Post-It on the coffee machine, break room | 08:13 | yes |
| Interrogation suite code | 5386 | Code card in the Director's safe | 08:09 | yes |
| Locker contents (x3) | lockpick, assisted | locker lock is a pick, not a PIN | 08:15 to 08:16 | yes (assisted PASS) |
| `gitlist_server` flags 1 to 4 | `<flag:1>` to `<flag:4>` | VM challenge, not available standalone | 08:11 | **no, exercised, not earned**. Standalone, nothing downstream of the VM was tested for solvability. |
| Fingerprint match | Nightshade | Dusting the USB stick from his locker | 08:22 | yes (pattern guessed: Loop wrong, Whorl right) |

The only VM work not proven in this run is everything on the box. Everything off the box (archives, lockers, door audit, print, confrontation, debrief) was earned in game.

## Timeline

Time shown is machine time. "Goal" is what I thought I was doing.

| Time | What I did | What I thought |
|------|-----------|----------------|
| 08:00:34 | Session up. Opening ATHENA cutscene by hand (not bootstrap). Lines: leak is inside, "three names", Agent 0x47's PIN device "signed out since St. Catherine's". | Find a mole among three. |
| 08:01:08 | Declined tutorial. Went to Director. Netherton briefing: three profiles, "Interview all three as if none is guilty", "If you are certain before you are sure, come and tell me." | Interview all three. |
| 08:01:45 | Suspect Dossiers (ends with "I need the one who had the room, at the minute"), Personnel Print Job (service numbers, "every safe opens on its owner's service number"). | Noted both. |
| 08:02:24 | Cipher. Asked the questions, then deliberately accused him ("I think it's you") to test the cost, then apologised. | Cipher is odd but his story is checkable. |
| 08:02:53 | Intel analysis. Phantom's Off-Book Notes (47-minute session from a Crypto Lab terminal, door audit exists). Phantom interview, accused him too. | Phantom is evasive, but "find something that logged it". |
| 08:03:43 | Crypto Lab. Nightshade interview. He is calm, helpful, warm. Accused him too. Globals: `nightshade_tipped_off`, `accused_*`. | Nightshade feels the most suspicious on tone only. |
| 08:04:17 | Phone: 6 unread from HaX. "Whichever of the three it is, it's a friend of mine." "You've said it to someone's face... he knows we're looking." | Oops. Maybe I made it worse. |
| 08:05:42 | HaX hints: logs are in the archives, "Kettle"; server room by cloning the Director's MIFARE card, darkside. | Need access. |
| 08:06 to 08:09 | Director conversation, cloner, darkside attack (~30 s), save card. Then safe: tried 4719 (harness retried to lockout), then 2407. Got suite code card and sealed psych eval for 0x47. | Lead on Nightshade, sealed by the Director himself. |
| 08:10 to 08:11 | Server room. Redacted auth log (crypto-lab-04, D-2 10:38, 47 min). VM terminal unavailable (standalone). Supplied flags 1 to 4 (exercised, not earned). | Flags give me root. |
| 08:12 | **Mid-mission reload.** Title screen, Mission Brief note. State intact, back in lobby. | Fine. |
| 08:13 | Archives door: tried "kettle", wrong. Walked to break room: sticky note (TrustNoOne), Leak Timeline. | Got the passphrase. |
| 08:14 to 08:16 | Lockers. Off-duty agent caught me ("Oi. That's not yours."). He then told the floor I had been at the lockers. Nightshade: stick, Deep State brief, empty holdall. Phantom: Zurich boarding pass "Usual place. Bring the list". Cipher: token signed out at 10:26, project sheet. | Phantom now looks guilty (travel, "bring the list"). Cipher's token is inside the hour. Confusing. |
| 08:17 | Archives. **Badge Audit Printout.** Cipher out of lab 10:32, Phantom on a plane 10:09 to 11:54, Nightshade in 10:15 to 11:43. | Nightshade is the only one in the room at 10:38. |
| 08:18 | Director: "I can name the leak." He sends me to the men on the audit: "come back when one of them has told you it is right." | I need confirmation. |
| 08:18 to 08:20 | Cipher (shows row is accurate, 8 minutes in, token). Nightshade: "Yes... bring me the account." | Confirmed. Account never found. |
| 08:21 to 08:23 | HaX: the stick is wiped, "the print on the casing is still there. Lift it." Dusting. Loop wrong, Whorl right. Director vs Nightshade card: Director wrong, Nightshade right. | Nightshade. Sure. |
| 08:24 | Director reading: 10:15 (wrong, "that's a door moving"), then 10:38 and Cipher (wrong, "read the door against the minute"), then 10:38, Nightshade, 10:32, "people confirm their own rows". Director: "A door and a login, at the same minute." | Done. |
| 08:25 | Interrogation room. Confrontation starts on entry. Confession, why, PIN cracker, Architect. Chose "No deals". Tomb Gamma given. | Done. |
| 08:27 | Debrief with Netherton: "You accused both of the innocent men to their faces", "picked a colleague's locker in front of a witness". Picked the sympathetic line, "it was wrong, sir", asked everything, ended. | Mission complete. |
| 08:28:48 to 08:30:26+ | Credits read via an interval on `#bv-cr-label`. Full list captured. | n/a |

Longest stuck: about 2 minutes, at 08:18 after the Director sent me back to the suspects (I did not realise at first that "the men on the audit" included Cipher), and at 08:13 over the archives passphrase. Never stuck for 10 minutes. No help used beyond HaX's in-game phone hints (I used the door logs, interrogation suite, server room, Director options).

## Confusion points

1. 08:05, HaX: "Kettle." Read as a password, not a place. About 1 minute and 1 of 3 attempts.
2. 08:09, Director's safe: I first tried 4719 (Nightshade's service number) because I thought of the safe as "his". The print job says each safe opens on its **owner's** number, so the Director's is 2407. Not a game fault, an honest misread. The harness retried 4719 five times.
3. 08:10, the VM terminal says "You've discovered a computer terminal... launch the virtual machine on your local system" with Kali details. Clear in a real game; in standalone it is a dead end, so I supplied flags.
4. 08:14, first locker interaction launched the Off-Duty Agent's "Oi" cutscene. I did not understand it was the consequence of picking a lock with a witness in the room until the debrief ("locker_seen_picked"). Fine for a first-timer; fair.
5. 08:16 to 08:17, three lockers, three suspicious items. Phantom's boarding pass felt decisive for roughly a minute. I held off because the Suspect Dossiers and Phantom's own notes both say "doors, not faces".
6. 08:18, the Director's "take it to the men who went through that lab door" was slightly unclear: I first went to Cipher alone. Nightshade's answer ("Yes... bring me the account") did not feel like "it is right" to me; I wasn't sure the gate had cleared until the Director's next dialogue went on.
7. 08:21, dusting: I cannot judge the pattern on the screen. The game rejected Loop with a clear reason and let me retry. Fair.
8. 08:25, no chance to read the evidence wall (finding 4).

## Deduction

**Verdict: the mole can be deduced from the evidence, and I did, but I'd guessed the answer on tone earlier and a player could land on it without the audit.**

What I concluded and when:

- **08:03** Nightshade felt the likeliest on tone alone: the calm, "I know your tells", "Don't rule anyone out because they wrote the list", the empty desk. A guess. I wrote it down as "suspect, not proven."
- **08:04** HaX: "whichever of the three it is, it's a friend of mine." Not evidence.
- **08:09** Sealed psych eval for 0x47, locked in the Director's safe and "sealed by order of the Director". Motive and a hint of coverup. It reads as designed to point at Nightshade.
- **08:16** Lockers. Nightshade: Deep State brief (recruit idealists, "belief is the payment"), wiped stick, holdall gone. Phantom: boarding pass to Zurich, "Bring the list". Cipher: hardware token signed out 10:26, project sheet. Each suspect has something that looks guilty. This is the most misleading beat, and a fair one.
- **08:17** Door audit. This is what separates them: Cipher out of the lab 10:32 (before 10:38, and in the library door at 10:35), Phantom on a plane for the whole window, Nightshade in from 10:15 to 11:43. From the log excerpt (crypto-lab-04, 10:38, 47 minutes) and the Leak Timeline in the break room, this is an elimination, not a guess.
- **08:23** The thumbprint match on the USB stick. Confirms the stick is his; doesn't prove the leak.
- **08:24** The Director's reading. The question order (when was the file opened, who was behind that door, why not Cipher, why trust the audit) walks you through exactly what I'd done.

Where I guessed: the early tone read (08:03); the dusting pattern; the order in which I treated the lockers. Where I didn't have to guess: the name, once the audit was in my hands.

Did anything give the answer away?
- Yes, mildly, and early. ATHENA's briefing says Agent 0x47's PIN device is signed out (a planted pointer), the psych eval is a free motive file sitting in a safe I could open with a number printed in the same building, and Nightshade is the only suspect with zero "flags" in his dossier, which for a thriller reads as "too clean". A player who reads for tone, or who stops at the psych eval, can reach the right name without ever opening the archives.
- The cost of that shortcut is mostly limited. The Director refuses a name without a reading ("Give me a reading"), so you still have to do the door audit. I count that as the design working: the name is findable early, the proof isn't.
- Counterweight: the lockers hand Cipher and Phantom guilty-looking objects too (the token slip is genuinely inside the hour). I could see a player who skips the archives believing Cipher or Phantom, and they would be corrected by the Director's wrong-answer lines. That is a good failure branch.
- The eyewitness (Off-Duty Agent) nudging at "the nerdy one, Cipher. Or not" is a gentle misdirect and good.

Not tested: what happens if you name nobody for a long time, or answer the Director's reading wrong a second time ("Once more like that and I read it myself, and the file will say that I had to").

## Scores (1 to 5)

| Aspect | Score | Note |
|--------|-------|------|
| Fun | 4 | The darkside attack and the dusting are the high points; lockers are dull to open (lockpick assisted). Confrontation and debrief are strong. |
| Pacing | 4 | About 30 minutes, each room has something. The back half (audit to confrontation) is quick. |
| Clarity of goals | 4 | The objectives panel is clear. The "take it to the men who went through that lab door" step is the only blurred one. |
| Openness of decisions | 3 | Three accusation routes feel open and have consequences, but there is only one workable route to the end, and the player can't see the cost of an early accusation. Fate choice and debrief stance are real. |
| Teaching | 4 | Darkside versus dictionary attacks explained on screen; fingerprint steps (powder choice, loop/whorl/arch, minutiae) explained with feedback; door-log reading is a lesson in "account is not a person". |

## What the debrief and credits reflected

**Debrief:** reflected my play accurately. It named both innocents I'd accused, the locker picking in front of a witness, and "You read the clock, not the face... Not on the first reading. I noticed." The "debrief stance" choice (I picked the sympathetic "He's the crime, not you") and "No deals" were echoed.

**Credits (captured through `#bv-cr-label`):**
- THE LEAK: Agent 0x47 'Nightshade', recruited by ENTROPY in training, then left to wait fifteen years
- NIGHTSHADE: Handed to the police with the full case file. No deal.
- TOMB GAMMA: Coordinates given up in the interrogation room, Montana
- CIPHER: Accused to his face, then cleared by the logs
- PHANTOM: Accused to his face, then cleared by a flight manifest
- THE CASE: Named from the door audit, not on the first reading
- THE LOCKERS: Seen picking one by an off-duty agent who saw nothing
- NIGHTSHADE: Tipped off before he was named
- SEALED PSYCH EVALUATION: Read. The warning was in writing a year ago.
- 'DEEP STATE' RECRUITMENT BRIEF: Recovered from his locker
- GO-BAG: Gone from his locker the night you tipped him off
- THE USB STICK: Wiped after you tipped him off. His thumbprint survived it.
- THE SERVER ROOM: The Director's card, cloned off his lanyard while he studied the maps
- GLOBAL THREAT DATABASE: Confirmed stolen during the four-site night
- THE REPOSITORY BROWSER / THE HISTORY / THE ACCOUNT: VM lines, as above
- ROOT: Through a sudo rule. The logs put the plan on a Crypto Lab terminal for forty-seven minutes.
- AGENT 0x00 TO THE DIRECTOR: He's the crime, not you
- THE ARCHITECT: At large, with every weakness SAFETYNET ever catalogued.
- ENTROPY: Still operational.

All credits lines matched what I did. The credits are the best piece of reflective feedback in the mission.

## Best five lines and worst five lines

Best:
1. Director: "Do not let it choose the suspect for you."
2. Cipher: "Do the maths again, please. The maths is the only friend I've got in this building."
3. Nightshade: "A sealed file makes a very tidy suspect. Tidy isn't the same as right."
4. Nightshade: "I wiped the file and forgot my own thumb."
5. Director: "You read the clock, not the face... Not on the first reading. I noticed."

Weakest:
1. HaX: "Kettle." (cryptic one-worder)
2. Nightshade, 08:20: "Bring me the account." (no account to bring)
3. Off-duty agent: "I'll be telling everyone I didn't see anything." (funny, but quickly repeated in the debrief and credits)
4. Director's "Come back when one of them has told you it is right." (when is "right" said?)
5. The Evidence Display text appearing only in a room that starts a cutscene on entry.

## Game ids and evidence

- Game 2510 (mission 52), URL `http://127.0.0.1:3001/break_escape/games/2510`
- Session log: `tools/playtest/m08_blindA-session.jsonl`
- Verifier output (`BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 2510`): "VERDICT: progress recorded — 8 rooms beyond the first, 4 objects unlocked, 4 flags submitted." 9 rooms unlocked, 4 objects (director_safe, three lockers), 63 globals including `mission_complete`, `mole_identified`, `named_on_evidence`, `debrief_played`, `fate_decided`, `nightshade_arrested`, `nightshade_print_lifted`, `tomb_gamma_location_known`, `audit_misread`, `audit_warned`, `locker_seen_picked`, `nightshade_tipped_off`, `nightshade_tidied`. Played 1752 s.
- Session closed with `session-stop.sh 2510` (commands 1797, flags used 4). No other sessions started.

## Things I noticed but left alone

- Nightshade's workstation (`nightshade_desk`) and the CyberChef workstation were not used. The stick was already wiped; I didn't try to decode anything.
- The Visitor Badge Printer PIN (0311, on the sticky note) was not used. In the archives I read only the badge audit and Past Leak Investigations, not the Global Threat Database Catalogue.
- The ten-line off-duty agent and background analyst chatter was only partly read.
- I never started a fight, so no combat damage readings were taken.
- No "I started a fight" persona behaviour was exercised. The persona's "maybe start a fight" step was skipped because nothing offered a way to; that's not a finding, only a gap in coverage.
