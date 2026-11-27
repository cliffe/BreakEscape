# m05 Insider Trading: pass-4 round-2 confirmation (runs D and E)

Source of steps: scenarios/m05_insider_trading/PASS4_PLAYTEST.md, "Round 2 confirmation". Question answered: plumbing plus the player-experience of the whodunnit (not solvability: flags are session-supplied stand-ins, no VM).
Server: keyless :3001. Scratch: scratchpad/m05-confirm/.

## Run D: blind detective (game 1405)

Session log: tools/playtest/m05-confirm-D-session.jsonl. Headless (machine load average 21).

Contamination note: the run script I was given (PASS4_PLAYTEST.md) names Torres in step 4 and I read it before playing, so I was not blind to the answer. I did not open the guide, walkthrough, erb, ink or design reviews until after I had named him, and I judged the clues only by what the game showed. Treat "when did I suspect" as "when did the game point at him", not "when did I independently deduce him". Also, `bootstrap` auto-clicked through the HaX briefing (first choice each time) instead of my driving it; I did not see the briefing text.

### Detective log (in-game clues only)

| Clock | Clue | Effect on suspicion |
| --- | --- | --- |
| ~07:57 | Patricia, suspect list: "Halloran's been fighting the CEO to publish. Torres has been distracted. Trouble at home." | Eight names; Halloran and Torres get a one-line motive each. Others get none. |
| 07:57 | Incident log (Patricia's desk): "badge is always one of eight", pencilled "Owen keeps the reader logs. Ask him whose badge." | Points at Owen and a badge, not a person. |
| 07:57 | Noticeboard flyer (main corridor): "someone on the research side has a family member very unwell... insurer said no" | Fits Torres' "trouble at home". First time I leaned to Torres. |
| ~07:58 | Owen, "anyone on the crypto team odd hours?": Ben overnight tests; "David Torres, though, lately... His wife's ill... saw him in the server hallway the other night... looking wrecked." | Torres named directly with presence in the hallway. Strong lean. |
| 07:58 | Owen, "whose badge at 23:47?": "Halloran's spare on the server hallway. Odd. She's not a night owl." | Halloran becomes the badge-holder, so a Halloran/Torres question. |
| 07:59 | Badge log (auto-added to Notepad on that Owen question, `found_door_log` true): Torres #4408 at the main entrance 6 min before every spare swipe. Ben (Thu 24, with Owen's ticket note) and Amara (stayed in lab) cleared in Owen's pencil note. | Ben and Amara out by the note. Pattern visible: Torres in, then Halloran's spare six minutes later, four times. |
| ~08:00 | Halloran, spare question: hook by the door, Zurich on the 23rd (lanyard on monitor), "Amara some evenings... David, mostly. He says the lab's quieter than his office. ...Oh. Oh, no." | Halloran herself clears her spare and points at Torres. |
| 08:00 | Zurich lanyard (21-25 Sep, return Sat 26): covers the 23rd only. | Corroborates one alibi. |

First suspected Torres: about 07:57 (about 4 minutes in), from "trouble at home" plus the flyer; firm by 07:58 once Owen volunteered him. Named him at 08:00:27, about 7 minutes after game start (07:53). I never read Ben, Tomasz, Chloe, Hannah, Sanjay or Lisa, so the other five team members were never eliminated by the game; they were eliminated by Owen's note (Ben, Amara) or simply never raised.

Did it feel like narrowing down? Partly. Honest answer: it narrowed from eight to a Halloran/Torres pair quickly, and then to Torres, but the narrowing was done for me by dialogue volunteering (Owen and Halloran each say Torres' name unprompted) rather than by me working the log. The badge log itself is the right size of puzzle (Torres in, spare out six minutes later, every row), and I did spot the six-minute pattern only because Patricia's reason option told me where to look ("Look at the main-entrance times"). Without that option text I would likely have named him on Owen's remark and Halloran's "Oh, no". The pattern needs to be noticed, not just clicked; see recommendation below.

Naming menu (as shown): Halloran ("spare badge is all over the night log"), Ben ("on the log in the server hallway"), Torres (bare "David Torres."), "I've got a feeling." So it is a three-name pick plus a bail-out, not eight. Amara is not offered. The Torres option carries no evidence in its text while the other two do, which makes Torres the odd one out; a player who guesses it by elimination is rewarded the same as one who has the pattern.

Reason choice at naming: four options, "Look at the main-entrance times." (correct), "Halloran says he's in her lab after hours, where the spare hangs." (testimony), "He's been under strain. His wife's ill." (motive only), "He's the cryptography lead. He'd know how." (means only). The correct one is the only one that cites the log, and it is first in the list. Did it feel earned? Mostly: the refusal for the strain reason ("So's half this building's family. That's not evidence.") taught the right distinction. Two weaknesses: the correct reason is first and the only one that names a document, so it reads as the answer rather than a deduction; and I did not test whether the Halloran-testimony reason is also refused or accepted (see steps).

### Run D step table (game 1405; log lines in tools/playtest/m05-confirm-D-session.jsonl)

| # | Step | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Meet Patricia, read incident log, ask for vetting files at once | PASS | Refused: "Vetting files are restricted. Bring me a name or a pattern and I'll pull the ones that matter." Suspect list names all eight (Halloran, Torres, Okafor, Wierzbicki, Leigh, Rao, Ashworth, Marsh). Objectives panel (screenshot d-patricia-office.png) shows "Find out who on the team is under pressure" and "Work out who has been recruiting in the building"; no mention of vetting files or Torres. "Find Out Why" aim not listed. |
| 2 | Read IT notice without trying the server-room door; Owen offers "The server room wants a password." | PASS, with a route caveat | Before the notice Owen's hub had no password option (checked at ~07:58). I could only reach the notice by cloning Owen's badge first (the hallway is behind the reader), after which Owen's hub offered "The server room wants a password." Note: the reader on the hallway door means the notice is not readable at the start of the game. |
| 3 | Badge log from Owen shows Ben, Amara and Halloran's spare; Owen's note explains Ben and Amara; ask Halloran; Torres office ask and "Find Out Why" absent | PASS | Notepad note 4 lists 14 swipes: Torres #4408 main entrance then spare #4471 six minutes later on 23, 30 Sep, 2 Oct, 5 Oct; Ben (24 Sep), Amara (29 Sep), Owen (4 Oct). Pencil note explains Ben (ticket 2264), Amara (stayed in the lab), Sunday (Owen). Halloran: hook by the door, Zurich 23 Sep, lanyard on monitor, "Amara some evenings... David, mostly", "Oh, no." State after: `found_halloran_alibi` true, `torres_suspected` false, `office_card_obtained` false, aim "Find Out Why" status locked, not in the objectives panel; Owen's hub had no Torres office option. |
| 4a | Name Ben | PASS | "Ben logged that test run with Owen. It's pencilled on the sheet. Try again." No globals changed. |
| 4b | Name Torres, reason "He's been under strain" | PASS | "So's half this building's family. That's not evidence." Back to hub, `torres_suspected` still false. |
| 4c | Name Torres, "Look at the main-entrance times" | PASS | Patricia: "His badge at the front door, then her spare at the server hallway six minutes on. Every night. And her own badge never comes in after seven. That's a pattern. It's not a reason... enough to look in his office. I'll tell Owen you can have the spare." Globals: `patricia_authorised_office`, `torres_suspected` true; "Find Out Why" appeared; Owen then offered "I need into David Torres' office." and the inventory item is "IT Spare Office Card" (id torres_office_keycard). |
| 5a | Torres sprite (data centre) has beard and glasses; Owen's has cap and hi-vis | PASS | Screenshots d-torres.png (brown hair, beard, glasses, red shirt, jeans, distinct from the player's black hoodie) and d-office.png (Owen: dark cap, hi-vis yellow top, at his desk). Both read clearly at game scale and look different from each other. |
| 5b | "Get into the research portal" ticks on flag 1, not on launcher open | PASS | Opened the Bludit terminal (VM launcher, "start your VM... connect to 192.168.100.75"): `access_bludit_vm` still active. After submitting `<flag:1>` it went completed. |
| 5c | Debrief line | PASS | "You read the badge log properly. Her spare on the server hallway, his badge on the front door six minutes before, every night. That's how they're caught." followed by "Every locked door in that building, you opened on someone else's trust. A colleague's badge, a colleague's password, his thumbprint." (transcript: scratchpad m05-confirm/D-debrief.txt). |
| 5d | Credits show BORROWED BADGE | NOT OBSERVED in the DOM | I polled the credits overlay too late (my debrief loop was still running when they started) and caught only the tail: "Father facing trial, mother untreated / THE RECRUITER: NEVER HEARD HER OFFER... / QUANTUM DYNAMICS: CEO'S STAND-DOWN, on file with the Home Office review / The Architect remains at large...". Credits did not replay after a page reload. scenario.json.erb:152 has the BORROWED BADGE entry with condition `door_log_reasoned && !halloran_accused`, and both were true at the end (verify output lists `door_log_reasoned`). Not read from the DOM; run E does it with polling started first. |

Ending taken: hold him for the police, pulled the drive (`final_choice`, `torres_arrested`). Time: game created 07:52 (local), named Torres 08:00:27, debrief done about 08:15, so about 8 minutes to naming and 23 minutes for the whole mission including a lot of harness overhead.

Earned-secrets table, run D:

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Owen's badge (hallway reader) | cloned EM4100 | Owen, "(Lean over his log screen...)" with the RFID cloner | before hallway | yes |
| Server room password | `quantum2024` | Server Password Sticky Note from Owen after the log leverage line (Notepad note 7) | before the server door | yes |
| Torres' office card | item | Patricia's authorisation then Owen | after naming | yes |
| Torres' print | lift 74% | Mug in torres_office, dusted, lifted, compared (chose loop from the picture, Torres from two candidates) | before the vault reader | yes |
| Flags 1 to 4 | `<flag:1>`..`<flag:4>` | none, no VM in standalone | n/a | **no** (stand-in values; prerequisite held: server room reached with the password) |

Everything downstream of the four flag rows (the exfil half of the case, `case_exfil`, the HaX "both halves" text, the vault) was exercised, not earned. Torres' `found_upload_schedule` and manifest were read in the data centre after the vault opened.

D verify-run output (tools/playtest/m05-confirm-D-verify.txt), full:

```
game            1405  (mission 49)
played for      1321s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, research_lab, server_hallway, torres_office, server_room, data_center
inventory       18 items (incl. Security Incident Log, Server Hallway Badge Log, Conference Lanyard, IT Spare Office Card, Server Password Sticky Note, Personal Journal, Upload Schedule, Data Package Manifest, Sealed TalentStack Envelope, Patricia's Copy of the CEO's Email)
NPCs met        11 (incl. patricia_morgan, owen_gallagher, dr_halloran, david_torres, recruiter)
flags submitted 4 (stand-in values)
globals set     46 (incl. door_log_reasoned, found_halloran_alibi, torres_suspected, torres_print_collected, final_choice, torres_arrested, debrief_played)
VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```

## Run E: vetting files first, then the exposure ending (game 1412)

Session log: tools/playtest/m05-confirm-E-session.jsonl. Headless. Game created 07:16 UTC (08:16 local); debrief finished about 08:30 local (777 s of game time).

| # | Step | Result | Evidence |
| --- | --- | --- | --- |
| E1a | Get the badge log, then ask Patricia for the vetting files at once | PASS | Read the incident log, asked Owen "Patricia's log has a crypto badge in the server hallway at 23:47. Whose?" (`found_door_log` true, `door_log_reasoned` false), walked back to Patricia, "I need your help with something" then "The vetting files on the cryptography team." |
| E1b | Both files arrive, "Neither one's tidy" | PASS | "Two names on Owen's sheet have something in their files this year. Here are both." then "Read them properly. Neither one's tidy." Inventory: "Vetting Aftercare File: D. Torres" and "...R. Halloran". |
| E1c | Halloran's file: late report, no dates, cancelled interview; does not clear her | PASS | File text: change of circumstances "DECLARED (late)", "Foreign travel: conference, Switzerland, September. Dates to follow. [Not yet supplied.]", contact report from TalentStack recruiter reported 11 days late, follow-up interview "Cancelled by the CEO's office". `found_halloran_alibi` false immediately after (state read straight after receiving both). |
| E1d | Torres' file sets `torres_suspected`, "Find Out Why" appears | PASS | Same state read: `torres_suspected` true, `found_vetting_file` true, `found_halloran_vetting` true, `case_motive` true; aim `gather_evidence` status active ("Find Out Why"); `find_vetting_file` completed. Torres file: change of circumstances NOT DECLARED, three loans in six weeks, second charge on the home, spouse in treatment abroad, insurer declined, aftercare interview cancelled by the CEO's office. |
| E1e | Anything gives Torres away before the badge log? | See findings | I took the badge log first, so for this run nothing did; the earlier things in run D (Patricia's "trouble at home", the flyer, Owen's "odd hours" answer) are the answer to that, see findings. Asking for the vetting files before the badge log is refused (run D step 1). |
| E2a | Read the lanyard | PASS | Lanyard read after the files: `found_halloran_alibi` flipped to true on reading it (not before). The file's missing dates and the lanyard's dates fit together. |
| E2b | Name Torres with both halves | PASS | By phone from the server room after flags 1 to 4 (flag 3 gives the exfil half) plus the vetting file (motive). Patricia accepted at once, no "why?": "His wife's treatment isn't covered and he's borrowed against the house... His own journal says... The staging manifest on the research portal is in his name... You've got his print, then. Go." |
| E2c | Public-exposure ending | PASS | Confront: "I'm going public..." then "You'll be named..." then "Cancel it, David. Your hand, not mine." `entropy_program_exposed` true, `final_choice` set. |
| E2d | Re-talk shows "Go home, David. They'll come for you soon enough." | NOT VERIFIED | The debrief starts about 4 s after the conversation closes and my next command landed after it began; the credits overlay is `disableClose` and blocks all interaction. The line exists at scenarios/m05_insider_trading/ink/m05_torres_confrontation.ink:521 behind `final_choice == "public_exposure"`; that is a static finding, not a browser one. |
| E2e | Debrief: Zurich declared-versus-undeclared line and SAFETYNET cost lines | PASS | "Halloran had the same recruiter at her table in Zurich. She reported it, late. Torres never reported anything. That's the difference." Cost lines: "Your consultant cover is burnt. Netherton wants you in his office at two." "This week, three newspapers are asking who their source was." "A strategic win, at a human cost. That's the trade you made." Also "The badge log was in your kit all night. It would have saved you time." (correct variant: log never used for a reason in this run). Transcript: scratchpad m05-confirm/E-debrief2.txt. |

Credits read from the DOM (`bv-credits-overlay`, polled every 0.5 s from the end of the debrief; seconds since poll start):

```
0 MISSION COMPLETE / 4 INSIDER TRADING / 7 OPERATION SCHRÖDINGER: STOPPED
11 CIVILIAN LIVES SAVED: 30-45 (estimated, first rollout wave)
14 THE CASE / 18 RECRUITMENT PIPELINE — TalentStack link not documented
21 DAVID TORRES / 25 EXPOSED — named publicly as "The Quantum Traitor"
29 ELENA TORRES / 32 Still fighting Stage 3 cancer — treatment unfunded
35 SOFIA (11) AND MIGUEL (8) TORRES / 38 Classmates saw their father named a spy on the news
42 THE RECRUITER / 45 NEVER HEARD HER OFFER — the TalentStack list was never recovered
49 QUANTUM DYNAMICS / 52 WHO STOPPED THE INTERVIEW — never asked
56 The Architect remains at large...
```

Credits match the run: no BORROWED BADGE and no WRONG ACCUSATION (`door_log_reasoned` false, `halloran_accused` false); pipeline "not documented" (never opened the TalentStack envelope); no CEO stand-down line (never took the email); exposed (matches `entropy_program_exposed`); never heard the Recruiter's offer (matches); "who stopped the interview, never asked" matches the debrief's "Nobody asked who cancelled Patricia's interview" and the cancelled interviews in both vetting files. Sofia and Miguel ages (11 and 8) match Torres' "They're eight and eleven."

E verify-run output (tools/playtest/m05-confirm-E-verify.txt), full:

```
game            1412  (mission 49)
played for      777s of wall clock
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, research_lab, torres_office, server_hallway, server_room, data_center
inventory       17 (incl. both Vetting Aftercare Files, Server Hallway Badge Log, Conference Lanyard, IT Spare Office Card, Upload Schedule, Data Package Manifest)
flags submitted 4 (stand-in values)
globals set     42 (incl. found_vetting_file, found_halloran_vetting, found_halloran_alibi, torres_suspected, entropy_program_exposed, final_choice, debrief_played; no door_log_reasoned)
VERDICT: progress recorded — 8 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```

Earned-secrets table, run E: same as run D except Torres' office card came from Patricia's phone ask ("I need into David Torres' office") then Owen, the password from Owen after reading the IT notice, the print from the mug; flags 1 to 4 stand-ins, **not earned** (exfil half, vault and everything after them exercised, not tested). Vetting files, lanyard, badge log and card were all earned in-game before use.

## Findings and things a player would notice

1. Torres is volunteered before any evidence (run D). Patricia's suspect list gives him "distracted... Trouble at home" (and Halloran "fighting the CEO"); the corridor flyer describes a colleague's unwell family without a name; Owen's "odd hours" answer says "David Torres, though, lately... His wife's ill... I saw him in the server hallway the other night. Not doing anything. Just standing there, looking wrecked."; and Halloran, asked about her spare, says "David, mostly... Oh. Oh, no." So the whodunnit does not hold the name back: four separate NPCs or objects point at Torres before the player has compared a single badge swipe. By the pass-4 checklist ("before any evidence, no to-do item, Patricia choice or Owen choice names Torres") the to-do items and choice labels are clean, but Owen's dialogue answer to the optional "Anyone on the crypto team keeping odd hours?" names him with motive and presence. Suggest: keep Owen's line to hours and presence for Ben/Halloran and move the "wife's ill... looking wrecked" colour to after the log, or let Halloran carry the Torres pointer only. Player's call.
2. The badge-log pattern is solid but the Patricia reason menu does the noticing for the player. "Look at the main-entrance times." is the only option that cites a document and it is listed first; a player who has not found the six-minute pattern can still pick it by elimination. Consider shuffling the order or making the text not reveal the method ("Check who came in just before the spare was used.").
3. The naming menu is Halloran / Ben / Torres / "a feeling", not eight names, and the Torres option is a bare "David Torres." while the other two carry log evidence in their text. Fine as a design, but it makes Torres the odd one out; a player who deduces nothing still gets there. Amara (cleared by Owen's pencil note) is not offered, which is correct but means the note, not the player, rules her out.
4. The IT notice and Owen's password ask are only reachable after cloning Owen's badge (the hallway door is a reader). So "read the notice without trying the server-room door" always costs a clone first; fine, but the walkthrough step order (clone, hallway, notice) is the only order.
5. After the clone, the minigame does not open until the narrator line is advanced; if a harness or player leaves the conversation first, Owen says "The cloner didn't get a clean read" and the choice reappears. This worked as documented (cancel re-offers the choice).
6. In Owen's hub "I need into David Torres' office." stays listed after the card is given and before Patricia has signed it off it gets "No chance. Not without Patricia signing it off... Get her to message me and it's yours." That reads fine. Patricia's phone has the same ask after the vetting files and it works.
7. HaX's "That's both halves... Call Patricia and give her the name" text arrives even if the player has already named Torres to Patricia once with a partial case (run D). Not wrong, but a player who named him earlier may read "give her the name" as a repeat.
8. After the data centre opens, up to four toasts stack at once (HaX print note, HaX flag note, Recruiter's text, HaX "That's both halves") and cover the objectives panel (screenshot e-torres.png). Cosmetic.
9. Debrief and credits are consistent with each other in both runs (credits sampled in run E; run D partial).
10. Run D bootstrap: `bootstrap` clicked through the HaX briefing itself, so the "drive the briefing manually" instruction could not be followed in either run without bypassing bootstrap. I did not read the briefing text.
11. "So's half this building's family. That's not evidence." (Patricia refusing the strain reason) reads oddly: "half this building's family" is not a grammatical construction. A rewrite is a one-line ink change.
12. Not checked: Lisa, the break-room leaflet, Torres' briefcase, a wrong accusation of Halloran (that was run B), and the re-talk line "Go home, David".

Detective summary (what to feed back): about 8 minutes from game start to naming; first suspected Torres at roughly the 4 minute mark from Patricia's suspect list plus the flyer, firm by Owen's answer at 5 minutes; the badge log made it provable at 6 minutes; Halloran's alibi took no effort. The "reason" choice felt earned only because the strain option was refused. It was not a two-way pick (Halloran vs Torres), it was a one-way pick that the dialogue made for me.
