# m08 The Mole: improvement loop

Started 2026-10-13. Method: the five-phase improvement loop in `AGENTS.md`, to the standard m03 and m04 reached on 2026-10-13 (`scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md`, `scenarios/m04_critical_failure/IMPROVEMENT_LOOP_LOG.md`). Shared agent brief: `docs/agents/M08_PASS_BRIEF.md`.

Stages: regression playtest, then alignment, puzzle chains and scenario design (review then fix loops), dialogue, room dressing, lighting, POV backgrounds, characters (parked for user input), playtests. Each round is logged here with a severity table and an outcome for every finding (fixed, withdrawn and why, or deferred and why).

## Pass 5 (2026-10-13)

### Stage 1 regression

Run: `PASS5_REGRESSION.md` (Sonnet-class playtest agent, keyless :3001, headless, game 2375, log `tools/playtest/m08-pass5-regression1-game2375.jsonl`, 1,180 lines). About 23 minutes, three page reloads, **credits reached** (16 lines read from `#bv-cr-label`; `mission_complete` set; `verify-run.rb`: 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted). Flags were supplied, not earned (standalone, no VM); the box itself is "needs checking against SecGen by the user". Session stopped; :3000 not touched.

Counts: 0 blockers, 4 majors, 11 minors (three of the minors are planned work for later stages).

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| 1 | major | HaX in person and her phone avatar use `female_hacker_hood_*`, not `agent_hax` (erb 1576 to 1578, 595); m01 to m07 use `agent_hax` | Open: wiring fix with existing assets, for the next round (mission-local, reversible) |
| 2 | major | Netherton and the debrief Netherton use generic `male_spy_v2` (erb 993, 834); m04 has a `netherton` sheet, talk sheet and visemes | Open: wiring fix with existing assets (confirm the sheet's frames work at m08 scale) |
| 3 | major | The mole is handed over by wording before evidence: the optional task "Tell the Director who the door audit puts in the Crypto Lab", "Interview the cryptography lab's duty officer", "TERM crypto-lab-04" in the access-log excerpt, HaX in person ("he'll explain…fifteen years"), a personnel printout that is Nightshade's alone | Open: stage 2 (puzzle chains and scenario design) |
| 4 | major | Red herrings have no visible cost in the route played; accusation branches were not played in this run | Open: design flag for stage 2, to be confirmed or withdrawn by a run that plays them |
| 5 | minor (planned) | No sight challenges configured | Open: stage 2 (m04 pattern) |
| 6 | minor (planned) | No lighting config; every room fully lit | Open: stage 4 lighting |
| 7 | minor (planned) | No `chatBackground`; person chats on black | Open: stage 4 POV backgrounds |
| 8 | minor | "* required" key reads "Unmarked tasks are optional", but required tasks in an aim with no optional task show no `*` (`objectives-panel.js:90-96`) | Deferred: engine; to `DECISIONS_PENDING.md` with a recommendation |
| 9 | minor | Crypto Lab: `moveToNear` stops 60 px short of Nightshade (interact works through the menu) | Open: stage 4 room dressing |
| 10 | minor | Dusting panel: ciphertext line runs out of the frame | Open: a wrapping fix on the item's text, or an engine CSS note |
| 11 | minor | Stacked toasts cover Nightshade's face in the suite opening and the top of chat portraits | Deferred: engine; to `DECISIONS_PENDING.md` |
| 12 | minor | Safe keypad titled "Enter PIN for item" | Open: check whether the title is engine-generic; if so, deferred as engine |
| 13 | minor | Credits "placed by ENTROPY during training" against Nightshade's own account | Open: stage 3 story ruling |
| 14 | minor | "PHANTOM: Cleared. His off-book hunt pointed the right way." printed with no action on Phantom | Open: stage 3, check the credit's gate |
| 15 | minor | Mission Brief note pops before the Resume overlay; the overlay did not appear on the first reload | Deferred: engine/session behaviour; no progress lost |

Engine checks (brief stage 1): KO body persists on reload (pass); tutorial hold (pass); required-task marker works as coded; toasts last long enough (pass); `nightshade` sprite and Nightshade's talk sheet (pass); `agent_hax` and HaX's new bust (**fail**, finding 1); lighting variants and sight challenges have nothing to check (the mission has neither; findings 5 and 6); the RFID denial hold was **not exercised** (one reader, one card, no wrong-card path).

Not played (needs a second game): the badge-printer route, accusing a suspect before flag 4, Netherton's door-audit check and its End Conversation re-ask, the reader denial hold, Netherton or Nightshade KO'd.

Decisions taken (tester and orchestrator): none beyond running the arrest ending and the earned route (clone, personnel printout to safe PIN to suite code) so that the credits exercised the clone and USB-stick credit lines. Cipher was KO'd with `debugKO` to test the KO-on-reload body; that choice shows in the credits ("CIPHER: Knocked out").

### Stage 2 alignment, round 1 fix (2026-10-14)

Fixer (Opus) on `ALIGNMENT_REVIEW_P5_C1.md` (1 blocker, 6 majors, 7 minors) and the regression findings handed to it (`PASS5_REGRESSION.md` 1, 2, 3, 10, 12, 13, 14). Orchestrator decisions applied: U2 Option B, U3 textVariants first with no engine edit, U4 yes (hedge, no name). Mission files only: `scenario.json.erb`, the ink, `mission.json`; plus the new route driver and the m08 block of `scripts/ink_runtime_check/missions.json`.

#### Alignment review C1

| # | Sev | Finding | Outcome |
|---|---|---|---|
| B1 | blocker | Naming optional; HaX names him on flag 4 | **Fixed (Option B).** Flag-4 texts give terminal and time, never a name (four disjoint mappings A-D). `mole_identified` moved to Netherton's `audit_right` (with `named_before_box` when it beats the box). `name_the_mole` is required, retitled "Name the leak to Director Netherton, on evidence"; Confront The Mole now unlocks on `aimsCompleted: [work_the_suspects, correlate_the_evidence]`. The old "[It's Nightshade, sir. The root logs name his account.]" is gone; "[I can name the leak, sir.]" opens the audit check from the audit or the box (a login alone gets "A login is a key... Bring me the door's"), and the box's minute stands in for step 1. Confrontation, lab hide/seat, `get_suite_code`, the case-made texts and the evidence wall all wait for the name as well as the flags (pairs on `mole_identified`). Fallbacks, each visible: three misreads after flag 4, the Director reads it himself (`named_by_director`, no suite code aloud); before flag 4, he takes the audit over and asks questions on the floor (`nightshade_tipped_off`, so the locker is cleared), then names him when flag 4 lands; Director KO'd, HaX reads it (`named_by_hax`). Debrief and credits name each route. HaX hub ladder "[What does the Director need from me?]": audit, clock, confirmed row, misread, go (checks state only) |
| M1 | major | Pointers stack on Nightshade; innocents clear themselves at once | **Fixed.** Netherton's "empty file keeps me awake" lines cut, replaced with an equal-weight worry; Cipher gets a real one (badge and locked screen). Dossier: service years for all three, Phantom's absences "including the morning of D-2", note now "All three had the plan. I need the one who had the room, at the minute." Personnel printout lists all three with service numbers (safe deduction unchanged). Phantom refuses an alibi; the audit's TRAVEL DESK row clears him via a new audit beat. His "stopped believing we can win" pointer softened. Off-duty agent adds Phantom's empty morning. ATHENA's line and the PIN-cracker plant kept |
| M2 | major | HaX says "fifteen years" before identification | **Fixed.** Neutral wording ("Whoever's across that table... They've had years") until `mole_identified`; the original after |
| M3 | major | Wrong accusations and tip-offs cost nothing | **Fixed (no engine edit; U3).** Accused Cipher refuses to confirm his row until the player apologises (apology now open before evidence); Netherton's step 4 then needs Nightshade's. Accused Phantom withholds his lead (which now points at the archive printer) until the apology. Accusing Nightshade before he is named sets `nightshade_tipped_off`; if the locker is untouched, `nightshade_tidied` latches: `textVariants`/`observationVariants` show the stick wiped (thumbprint survives), the go-bag gone, the locker scratched (engine already resolves variants for any object and inventory item, `conditional-text.js` via `interactions.js:1327`). HaX, the confrontation (three new tip-off lines and a wiped-stick print line) and the credits read it |
| M4 | major | Debrief/credits ignore the VM chain | **Fixed.** Credits section "THE BOX", four unconditional lines worded from HaX's flag texts only. Debrief: one player beat "[Our own code server let me in without a password, sir.]" on every path, Netherton puts it in his report (it also splits a 12-line run) |
| M5 | major | Teacher line lands with no one | **Fixed (U4).** HaX text on the confrontation closing with the fate in: "Same classroom, 0x00. Don't ask me whose yet." Debrief option "[He used HaX's line...]" gets Netherton's hedge ("whoever taught her taught him"); no name anywhere |
| M6 | major | mission.json lists a nonexistent choice; "Arrest" | **Fixed.** "Detain and hand over to police (no deal)"; second choice is the debrief stance (`debrief_stance` defended/owned) |
| m1 | minor | Odd task title; "duty officer" collision | **Fixed.** "Interview Agent Nightshade in the Crypto Lab"; Phantom's notes and line say "archive duty officer" |
| m2 | minor | "Not one scrap of intelligence" | **Fixed**, split on `tomb_gamma_location_known` (KO-before-fate keeps the old line, which is true there) |
| m3 | minor | Debrief location | **Fixed:** "Netherton finds you, empty-handed." |
| m4 | minor | CyBOK and other mission.json entries | **Fixed.** Dropped AB/MAT kill chains and AC; merged AAA; added WAM (unauthenticated RCE, unpatched web app) and F Artifact Analysis (the optional decode); F Forensics now matches the required audit reading. Lore entries corrected to what and where they are; success metrics no longer count fewer than four flags; mechanics name the door-audit reading and tip-off costs. NS SSH and the CVE stay but are U1 claims |
| m5 | minor | Locker key handed over with no beat | **Fixed:** narrator line, he keeps hold a second longer |
| m6 | minor | Triple agent buys nothing in m08 | **Fixed:** a first payment owed at Tomb Gamma (which catalogued weaknesses guard it; no layout invented), `triple_agent_first_payment`, credit line |
| m7 | minor | Stale header names a different SecGen scenario | **Partly fixed:** comment now says the built scenario is unconfirmed (U1); final wording waits for the user |

#### Regression findings handed to this round

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | major | HaX not on `agent_hax` | **Fixed:** in-person sheet, talk, visemes and headshot; phone avatar `agent_hax_headshot.png` (m04/m07 pattern) |
| 2 | major | Netherton on `male_spy_v2` | **Fixed:** both Netherton NPCs on `netherton` sheet, talk, visemes, headshot (m04 pattern; atlas has the same 256 frames as `nightshade`). Not yet seen in a browser |
| 3 | major | Answer handed over by wording | **Fixed:** naming task retitled, Nightshade's interview named, HaX's fifteen years gated, printout covers all three. **Withdrawn in part:** "TERM crypto-lab-04" narrows to two men (Cipher and Nightshade both badge in), which is the intended clue |
| 10 | minor | Dusting quote runs out of the panel | **Fixed mission-side:** ciphertext wrapped at 64 characters (CyberChef's From Base64 drops newlines by default). CSS `overflow-wrap` would be the engine fix (E3) |
| 12 | minor | Safe keypad titled "Enter PIN for item" | **Deferred: engine** (`minigame-starters.js:531` builds the title from the lock type; no scenario field). E2 |
| 13 | minor | "placed by ENTROPY" credit | **Fixed:** "recruited by ENTROPY in training, then left to wait fifteen years" |
| 14 | minor | Phantom credit printed with no action | **Fixed:** "pointed the right way" needs his notes read; otherwise "Innocent, and running his own hunt the whole time." |

Counts this round: 1 blocker, 6 majors, 7 minors fixed (m7 partly, pending U1); regression 1, 2, 3, 10, 13, 14 fixed, 12 deferred (engine).

Checks (all run after the last edit): `scripts/compile-ink.sh m08_the_mole` 12/12; route driver `scripts/ink_runtime_check/m08_routes/route.js`, 7 routes all pass (r1 named on the audit before the box, defended; r2 Cipher accused and refused then apologised, box first, wrong name then right, triple agent, owned; r3 three misreads after the box plus a page reload mid-check; r4 Nightshade tipped off early, locker tidied; r5 locker emptied before the accusation, nothing to tidy; r6 badge printer, three misreads before the box, Director names on flag 4, confront locked until the interviews; r7 Phantom accused then apologised, Director KO after flag 4, HaX names). The driver also fails any mapping, credit or music condition the engine's &&-only evaluator can't read. Longest run without a choice 11 (the opening cutscene, unchanged; for the dialogue stage). `dialoguelint` 0 errors, 0 warnings (8 pre-existing blank-reentry CHECKs). `reopencheck` m08 0 problems. `inkcheck` every file plus a state matrix on Netherton, HaX, confrontation, debrief, Cipher, Phantom: clean. `loopcheck` on every hub: clean. `tagdiff` vs HEAD: 111 structural differences, all from this round (listed above). Validator: no errors; two warnings, both pre-existing and intended (brief_taken co-fire; the confrontation cutscene re-opens after a reload by design). `check_door_alignment.py`: m08 all OK. No browser run this round.

Decisions taken (fixer, reversible, mission-local):
- Naming task kept in Work The Three Suspects, so its aim completes only with the name, and Confront The Mole waits on both aims (`aimsCompleted`) rather than moving the task.
- The pre-flag-4 fallback costs a tip-off rather than time, because time has no mechanic here and the brief names "a tipped-off mole" as a cost.
- The tidy latches only if nothing has been taken from the locker, so a variant never rewrites a note already in the inventory.
- Triple agent's payment kept abstract (which catalogued weaknesses guard Tomb Gamma), so m09/m10 aren't committed to a layout.
- Debrief VM beat made a one-option player line to keep it unconditional and break the long run.

Spoken lines changed (old → new), for the TTS stage. m08 has a `tts_cache/m08_the_mole` folder (4 entries); check before voicing.

HaX, phone texts (`scenario.json.erb`):
- flag 4 (not named) "Root. Crypto Lab terminal, two days before Portland, plan open forty-seven minutes. The root file says what that night was for: our threat database. It's Nightshade. I trained with him." → "Root. A terminal and a time, no face: crypto-lab-04, D-2 10:38, forty-seven minutes. The root file says it was for our threat database. Who was behind that lab door?"
- new, flag 4 after the Director took the audit: "Root. Crypto Lab terminal, forty-seven minutes, for our threat database. The Director read the door audit against it himself. It's Nightshade. I trained with him."
- new, flag 4 with the Director down: "Root. Crypto Lab terminal, forty-seven minutes, for our threat database. The Director's down, so I read the door audit against it myself. It's Nightshade. I trained with him."
- new, Director KO'd after flag 4: "With the Director down, I've read the door audit against the box myself. It's Nightshade. I trained with him."
- "Whole chain's in. He's been walked down to the interrogation room, south of the Crypto Lab. Suite code's in the Director's safe, if you don't have it. Finish it." → "Whole chain's in, and it has a name. He's in the interrogation room, south of the Crypto Lab. Suite code's in the Director's safe if you need it. Finish it."
- new, flags in and not named: "Whole chain's in: a terminal, a time, an account. The Director won't walk anyone anywhere on a login. Give him the person. Door audit."
- new, stick after a tip-off: "Empty. He wiped it after you tipped him off. The print on the casing is still there. Lift it."
- new, after the confrontation: "He said it to you? 'Afterwards, not during.' I was taught that line, and I say it to every agent I run. Same classroom, 0x00. Don't ask me whose yet."

HaX, phone hub (`m08_phone_agent_0x99.ink`):
- "...Root shows you the logs, and logs put a body in a chair." → "...Root shows you the logs, and logs put an account at a terminal."
- new: "A name he can stand behind, and you haven't got one yet. Doors before faces. The archives keep the door audits." / "You've got the door. Now you need the clock: when was the plan opened? Somebody in this building wrote it down." / "Door and clock. He'll want someone on that audit to stand behind their own row. Ask the men who badge through the lab door." / "He's said no once. Before you go back, put every row against the minute the plan opened. Who was still inside?" / "Door, clock, a confirmed row. Take it to him. Read the door against the minute, not the man." / "He has. He'll put the name to it himself once the box gives him the account. Get root." / "And he's asking questions on the floor now, so don't expect anyone to stay surprised."

HaX, in person (`m08_agent_0x99.ink`):
- new (before naming): "Yeah. Whoever's across that table will explain. They always explain." / "Don't argue the philosophy. They've had years to polish it, and you'll lose."
- "Hold the two dead agents up and make him look at them. That's the one thing in the room he can't out-talk." → "Hold the two dead agents up and make them look. That's the one thing in the room nobody can out-talk."

Netherton (`m08_director_netherton.ink`):
- "You've been in the logs. I can see it on you. Say the name when you're sure, and not before." → "You've been in the logs. I can see it on you. A terminal and a time is not a man. Read me the door."
- "On paper he is the obvious one. In my experience the obvious one usually has a secret that is none of my business." → "He carries a crypto annex badge and keeps a locked screen, and he has never once explained either. I should like to know why."
- "Impeccable record. And nothing, nothing at all, on his file." / "I will tell you what I told no one else. It is the empty file that keeps me awake." / "Everyone leaves marks. A man who leaves none has been very careful for a very long time." → "If it is him, I have stood beside him for years and noticed nothing. I do not enjoy that thought."
- told_him knot removed: "He does not sit down. He puts one hand flat on the desk, as if the floor has moved." (narrator) / "Then I sealed a warning about him a year ago and told myself it was prudence." / "Dr Okafor's evaluation is in my safe, with the suite code. Read it before you face him. The combination is the same lazy number everyone here uses." / "Put the whole chain through the relay. When it is all in, I will have him walked down to interrogation." / "You will be the one who goes in." → folded into audit_right as "He puts one hand flat on the desk, as if the floor has moved." (narrator) / "I sealed a warning about him a year ago and told myself it was prudence."
- audit_right: "That is a door, not an account. A man may sit in his own lab." + "But it is something I could put in front of a lawyer. Get me the account, and I will move." → "That is a door, not an account. A man may sit in his own lab. Get me the account from the box, and I will move." (or, after flag 4, new "And the box has an account on that terminal for the same forty-seven minutes. A door and a login, at the same minute. That I can act on.")
- "When the box agrees, he goes down to the suite. The code is {suite_code}." → "When the whole chain is through the relay, he goes down to the suite. The code is {suite_code}." ({suite_code} is the fixed constant 5386.)
- "The code card is in my safe, with Dr Okafor's evaluation. Read her evaluation before you face him." → "The card is in my safe, with Dr Okafor's evaluation. Read hers before you face him."
- "Enough. You've read me that log three ways. Bring me the account." → "Enough. You've read me that log three ways. I shall take it from here, and that means asking questions on this floor." + "People will notice. If he did not know we were looking, he will soon. Bring me the account, and I will put the name to it." (before flag 4), or "Enough. Give it to me." + narrator "He reads the audit against the box's minute himself. It takes him less than a minute." + "Nightshade. I should not have had to do that, Agent, and nor should you." + "The suite code is in my safe, with Dr Okafor's evaluation. Read hers before you face him." (after flag 4)
- new: "On a login? A login is a key, Agent, not a hand on it. Two of those men badge through that lab door." / "Doors keep their own records. Bring me the door's." / "Go. Finish the chain. I want it all in front of him."

Netherton, debrief (`m08_closing_debrief.ink`):
- narrator "Netherton is waiting in the corridor outside the interrogation suite, empty-handed. He looks older..." → "Netherton finds you, empty-handed. He looks older than he did at the briefing a few hours ago."
- "You read me that door log three ways. The box made the case in the end." → "You read me that door log three ways. In the end I read it myself."
- "It buys us not one scrap of intelligence, and I do not care..." kept for KO-before-fate; new "Beyond what he gave freely tonight, it buys us nothing, and I do not care. Some lines you hold because they are the line."
- new: "The box gave me a login. You gave me the man at the keyboard, off a door log. You read the clock, not the face." / "HaX read the door audit against the box while I was on my office floor. The name reached me secondhand." / "Next time, bring the reading to me yourself." / "And kept credentials in its history for anyone patient enough to read it. That goes in my report too." / narrator "He is quiet for a moment." / "Then whoever taught her taught him. There are not many people left who could have done both, and I do not like any of the names." / "We will not say one aloud until we can prove it."

Nightshade, confrontation:
- "You said it to my face before you could prove it." + "I had the whole night to tidy up after that, and I didn't. Think about why." → (tidied) "You said it to my face before you could prove it. So I tidied. The bag, the stick." + "Not well enough, it seems."; (locker already emptied) "You said it to my face before you could prove it. By then you'd been through my locker, so there was nothing left to tidy."
- new: "The Director went asking questions on my floor. I can count. So I tidied. Not well enough, it seems." / "And you printed the stick. I wiped the file and forgot my own thumb. Fifteen years, and I forgot my thumb." / "First payment, then. Tomb Gamma's defences were chosen out of our own threat database. I know which entries. Ask me when you're standing at the door."
- "I'll be your ghost inside their machine, for exactly as long as it suits me." + "Never forget I told you that part." → one line: "I'll be your ghost inside their machine, for exactly as long as it suits me. Never forget I told you that part."

Nightshade, interview: new narrator "He holds it out, and keeps hold of it a second longer than he needs to."

Cipher: new "You've already decided I did it. I'm not handing you another row to hang me with." / "Apologise, or read it without me." / narrator "He looks at you for a long second, as if checking the sum." / "Before you've proved anything either way. That's either decent or tactical." / "I'll take it. People don't usually come back at all."

Phantom:
- "Airborne. Zurich handover, forty passengers and a flight manifest with my name on it." / "The one alibi in this building nobody can fake. Check it. I'll wait." / "Only time I've ever been glad of economy class." → "Out of the building. Where is my business." / "You want my morning, find something that logged it. I'm not making your job easy just because I'd like to be off your list."
- "There's no money trail. So it's belief. Ask yourself who in this building has stopped believing we can win." → "There's no money trail. So it's belief, or it's fear. I haven't worked out which."
- "Get onto that box. The name's in the logs." → "My door audit's still in the archive printer, if nobody's binned it. Doors tell you who was in the room. The box tells you when."
- "So it printed. The duty officer walked me out before it finished. I never saw what it says, and I'd rather you didn't tell me. Tell the Director." → narrator "He sits back, and for once he doesn't smile." / "So it printed. Wheels up 10:09, forty passengers and a manifest. I wanted to see whether you'd check or take my word." / "The archive duty officer walked me out before it finished. I never saw the rest, and I'd rather you didn't tell me. Tell the Director."
- "...and you know it, because you're the type who checked." → "...and you know it, because you've read the travel desk."
- "Bold. On what? A flight manifest you haven't pulled, and a vibe?" → "Bold. On what? An empty morning on a roster, and a vibe?"
- new: "You put it on me to my face. You don't get my notes as well." / "Apologise, or work it out on your own." / "An apology before the evidence. Either you've found something, or you've got manners. I'll take either."

Off-duty agent: "Phantom's stopped being charming. Nightshade's the same as ever." → "Phantom's stopped being charming. He was off the floor all that morning, two days before Portland, and nobody's said where." / "Nightshade's the same as ever."

Open for the next round: a browser check of the naming flow (aimsCompleted unlock, the `netherton` and `agent_hax` sheets in play, the tidied variants in the container and inventory); the blank-reentry CHECKs and the 11-line opening for the dialogue stage; U1 (below in DECISIONS_PENDING).

### Stage 2 alignment, round 2 fix (2026-10-14)

Fixer (Opus) on `ALIGNMENT_REVIEW_P5_C2.md` (0 blockers, 5 majors, 10 minors) and `PASS5_ALIGN_R1_BROWSER.md` (2 majors, 4 minors). Mission files only: `scenario.json.erb`, the ink, `mission.json`, `CONTRACT.md` (pass-5 section), the route driver and routes, the m08 block of `scripts/ink_runtime_check/missions.json`. No engine edits; nothing committed.

#### Alignment review C2

| # | Sev | Finding | Outcome |
|---|---|---|---|
| J1 | major | KO texts give the verdict | **Fixed.** Each suspect KO is a pair on `mole_identified`: before the naming one neutral shape for all three ("You put X on the floor. Whatever he is, he isn't answering questions tonight. The door logs still can."), after it the original text. Nightshade's pre-naming text no longer mentions the interrogation room |
| J2 | major | Accusing is an oracle; herrings cost a click | **Fixed.** Any accusation before the naming (Cipher, Phantom or Nightshade) sets `nightshade_tipped_off` with one shared text; silent once he is already tipped off. Confrontation line for a tidy caused by accusing an innocent ("You put it on Cipher/Phantom in front of the floor..."). The off-duty agent repeats the gossip. Debrief and credits record the tip-off (n7). Cipher's refusal and Phantom's withheld lead stay as the trust beat. Residual for the reviewer: the tidy itself only touches 0x47, so a player who accuses someone and then opens all three lockers finds his scratched. That is the in-world cost (the evidence is gone), but it is a weak pointer |
| J3 | major | Director KO skips the deduction | **Fixed (option a).** Neither the flag-4 fallback C nor the `netherton_ko` mapping names anyone now. HaX tells the player to bring the reading to her (split on `found_badge_audit`, plus a prompt when the audit turns up). Phone hub "[I can name the leak.]" (`netherton_ko and found_badge_audit and not mole_identified`) runs two of the Director's steps (the minute, the man) in `hax_read_1`/`hax_read_2`; a right answer sets `named_by_hax`, `mole_identified`, completes `name_the_mole`. Free retries; the KO is the cost. New flag-4 text A2 when the HaX reading came before the box. HaX's ladder gets two netherton_ko rungs. The KO still drops his card (the clone gate is skipped, the badge printer was always the other route); the deduction is no longer skipped |
| J4 | major | One pickable locker confesses at minute one | **Fixed (both parts).** Three lockers in a row on the single-locker sprite `student_locker1` (no new art): 0x23 Cipher (token pouch signed out D-2 10:26, unsigned "do not discuss" sheet), 0x47 Nightshade, 0x88 Phantom (torn ZRH boarding stub "Usual place. Bring the list.", his folded suspect sheet "DOORS, NOT FACES"). Each has a key in its owner's itemsHeld, given after his audit beat (as Nightshade's), dropped on a KO; picks open all three. The go-bag is "Holdall -- Locker 0x47" and reads as any agent's packed bag until `mole_identified`; after the naming a read shows the passport and ticket, and a player who read it earlier gets HaX's text on what security found (`go_bag_lining_known`, latched on ATHENA). The confrontation's Montana choice, HaX's "bag packed" line and the GO-BAG credit wait for it |
| J5 | major | Third misread is unannounced | **Fixed.** At the second misread Netherton warns ("Once more like that and I take this off you, and I shall have to ask questions on the floor to do it", or after flag 4 "...I read it myself, and the file will say that I had to") and sets `audit_warned`. HaX's ladder names the limit at one misread and repeats the warning after two |
| n1 | minor | Herring costs that cost nothing | **Fixed** via J2 (the tip-off is the cost) |
| n2 | minor | HaX's "calm" pointer | **Fixed:** neutral line, no envy, no calm |
| n3 | minor | "Let the box say it" | **Fixed:** "Let the doors say it." |
| n4 | minor | Timeline note narrows the field | **Fixed:** ends "Find out who could get through the lab door. Get the door logs." |
| n5 | minor | Hidden `asked_alibi` prerequisite | **Fixed:** both audit choices open on the audit alone. Cipher has two disjoint choices ("You left that out" only after his alibi) into a new `audit_beat` knot; Nightshade's "I told you" is conditional |
| n6 | minor | Tidy incomplete and instant | **Fixed (both).** The 'Deep State' brief has a tidied variant (one torn page left). The tidy latches on the next entry into a room other than the Crypto Lab and the break room, and not if he is down or anything is already out of the locker; a sprint from the lab to the locker beats him. The latch lives on `receptionist_ai` (no text) so it shares no events with HaX's onceOnly texts |
| n7 | minor | Debrief ignores the tip-off | **Fixed:** Netherton line on `nightshade_tipped_off`; credit "NIGHTSHADE: Tipped off before he was named" |
| n8 | minor | Evidence wall wording | **Fixed:** "Named on the door audit." |
| n9 | minor | Cipher volunteers the terminal | **Fixed:** "My desk is out on the ops floor. Do the geography." |
| n10 | minor | route.js crashes with no argument | **Fixed:** prints usage, exit 2 |

#### Round 1 browser check

| # | Sev | Finding | Outcome |
|---|---|---|---|
| N1 | major | Dusting panel ignores variants; full ciphertext after "Empty." | **Fixed mission-side, no engine change.** The stick's base `text` and `observations` are now true in every state ("PERSONAL_BACKUP.enc. One file on the stick."); the ciphertext and the wiped file are both `textVariants` (`!nightshade_tidied` / `nightshade_tidied`), likewise the observations. Confirmed in the browser (game 2415): the panel shows the neutral line in both states; "Use normally" shows the ciphertext, then the wiped file once tidied. Engine note E5 logged for other missions |
| N2 | major | "Same classroom" text unread during the debrief | **Fixed.** The phone mapping is gone; the debrief's first beat is a narrator line reading HaX's text ("Your phone buzzes once in the corridor. HaX: ..."), skipped on the KO-before-fate path as before. Seen in the browser as the debrief opens |
| N3 | minor | Ciphertext overflows the dusting frame | **Fixed:** the panel no longer prints it (N1), and the file wraps at 48 characters. Panel quote `scrollWidth == clientWidth` in the browser |
| N4 | minor | Locker header shows "nothing on it at all" after the tidy | **Fixed:** base observations are true in every state; the scratches are in the go-bag's tidied text (seen on opening) and in the locker's variant (seen on hover) |
| N5 | minor | Instinct question re-asks after End Conversation | **Fixed:** `name_a_suspect` became the stitch `hub.name_forming`, so the reopen lands on the hub (person-chat re-navigates to the first choice's top-level knot); "[Not yet, sir.]" backs out without a name |
| N6 | minor | "Through the relay" after the chain is in | **Fixed:** "The chain is in. He goes down to the suite now. The code is 5386." when `all_flags_submitted` |

Found while fixing (n11, minor): the disposition screen named Nightshade ("SUBJECT: Agent 0x47") as soon as all four flags were in, before anyone named him, and the suite code is reachable from the safe by then. **Fixed:** that variant also needs `mole_identified`.

Counts this round: 5 majors and 10 minors from C2 fixed; browser N1-N6 fixed; one extra minor fixed. Nothing deferred.

Checks (all after the last edit): `scripts/compile-ink.sh m08_the_mole` 12/12. Route driver, ten routes, all "all expectations met": r1-r7 updated (accusation text, tidy on room entry, neutral go-bag, J5 warnings in r3 and r6, N6 in r2, "Same classroom" in the debrief, r7 rewritten for the HaX reading), new r8 (Cipher accused, tidy on leaving, Phantom KO neutral, N5 reopen and "Not yet", Cipher's audit beat without the alibi, all three lockers and keys, Cipher KO after naming), r9 (Nightshade accused, sprint to the locker beats the tidy, second accusation silent, Phantom's key and locker, go-bag lining after naming), r10 (Director KO before the audit and the box, HaX prompts, HaX reading before the box, A2 flag-4 text, Cipher KO before and Phantom KO after the naming). Longest run without a choice 11 (the opening cutscene; r2's confrontation opening also reaches 11 with the new tidy line). `dialoguelint` 0 errors, 0 warnings, 8 blank-reentry CHECKs (unchanged). `reopencheck` m08 0 problems (HaX's two question knots hold back one line each, as intended). `inkcheck` every file plus a state matrix on Netherton (hub, audit_c1 at one misread with and without the box, audit_c4 with all flags), HaX phone (KO and audit; warned), confrontation (accused Cipher/Phantom tidied), debrief, Cipher, Phantom, Nightshade, HaX in person, off-duty agent: clean. `loopcheck` on every changed hub: clean. `tagdiff` vs HEAD: 153 structural differences, all from this round. Validator (full, graph regenerated): no errors; the same two known warnings (brief_taken co-fire; confrontation cutscene not onceOnly); the new lockers clear rule 6 (pinned a little over a tile apart). `check_door_alignment.py`: m08 all OK. Browser (:3001, game 2415, headless, session stopped): N1, N2, N3 confirmed; screenshots and log in the session scratchpad `m08-align-r2/` (`lockers.png`, `N1_dusting_untidied.png`, `N3_viewer.png`, `N2_debrief_first.png`, `game2415-session.jsonl`). Globals were set by eval to reach the debrief, so that part is plumbing, not play.

Decisions taken (fixer, reversible, mission-local):
- J3 option (a), as the review preferred; HaX's reading is two steps with free retries, because the KO already costs (credits, debrief) and a third misread fallback with no Director has nowhere to go.
- Cipher and Phantom get locker keys handed over like Nightshade's, so his key isn't the only one on offer (another asymmetry) and the validator's key-only warnings go away.
- Single-locker sprite rather than three three-door sprites, so each locker is one object; the dressing stage may want to revisit the look.
- The go-bag's contents reach a player who read it early through HaX ("security searched it"), rather than requiring a re-read.
- The tidy latch and go-bag latches sit on ATHENA (main_lobby, always loaded, no texts), keeping HaX's mappings free of intended co-fires.
- "Same classroom" became a narrator line quoting the text, not an "Agent HaX:" speaker line: the phone NPC isn't a reliable portrait in a person-chat.

Spoken lines changed (old → new), for the TTS stage:

HaX, phone texts (`scenario.json.erb`):
- KO, before the naming (new, one shape for all three): "You put Cipher/Phantom/Nightshade on the floor. Whatever he is, he isn't answering questions tonight. The door logs still can." (originals now only after the naming)
- "You told him. He knows now. If he was ever going to tidy up, he's doing it tonight." → "You've said it to someone's face. On this floor, that's said to everyone by midnight. If it's the right man, he knows we're looking." (now on all three accusations)
- flag 4, Director down: "Root. Crypto Lab terminal, forty-seven minutes, for our threat database. The Director's down, so I read the door audit against it myself. It's Nightshade. I trained with him." → "Root. A terminal and a time, no face: crypto-lab-04, D-2 10:38, forty-seven minutes. The Director's down, and a login isn't a person. Get the door audit from the archives and read it to me." / "Root. A terminal and a time, no face: crypto-lab-04, D-2 10:38, forty-seven minutes. The Director's down, so read me the door audit instead. Call me when you've got it."
- new, flag 4 after the HaX reading: "Root. Logs agree with the reading you gave me: Crypto Lab terminal, forty-seven minutes, for our threat database. It's Nightshade. I trained with him."
- "With the Director down, I've read the door audit against the box myself. It's Nightshade. I trained with him." → "With the Director down, I'm who you bring the name to. Get the door audit from the archives first, then read it to me." / "With the Director down, I'm who you bring the name to. Read me the door audit when you're ready."
- new: "That's the door audit. With the Director on his floor, read it to me. Call me when you've got it straight."
- new: "Security searched his holdall once you named him. Passport in the lining, his photo, a name I've never heard. A one-way to Helena, Montana, for the morning after Portland."
- removed as a text: "He said it to you? 'Afterwards, not during.' ... Same classroom, 0x00. Don't ask me whose yet." (now read by the narrator in the debrief, below)

HaX, phone hub (`m08_phone_agent_0x99.ink`):
- "He's said no once. Before you go back, put every row against the minute the plan opened. Who was still inside?" → "He's said no once. Three misses and {he reads it himself | he takes it off you, and the floor will know}. Every row against the minute. Who stayed inside?"
- new: "He's warned you. One more miss and {he reads it himself | he takes it off you, and the floor will know}. Every row against the minute. Who stayed inside?"
- new: "He's on his floor, so it's me you read it to. Doors before faces. The archives keep the door audits." / "He's on his floor, so it's me you read it to. Tell me you can name the leak, and I'll ask you what he would."
- new reading: "Two questions, the ones he'd ask. When was the plan opened?" / "That's a door moving or the file closing. When did it open? Read it again and call me back." / "Who was behind the lab door at 10:38, and still inside?" / "Read the door against the minute, not the man. Who was still inside at 10:38? Call me back." / "In at 10:15, out at 11:43. Cipher was gone by 10:32, and Phantom was on a plane." / "Nightshade. I trained with him." / "I'll put it in front of the Director when he can stand. You finish the chain."

HaX, in person (`m08_agent_0x99.ink`):
- "Don't make me say a name." + "I used to envy one of them for how calm he is. Tonight I don't. Go and prove it, so I don't have to guess." → "Don't make me say a name. You've been watching them, I can tell." + "Watch the door log instead. Doors don't have friends."
- "Get me evidence. Let the box say it." → "Get me evidence. Let the doors say it."

Netherton (`m08_director_netherton.ink`):
- new: "Once more like that and I take this off you, and I shall have to ask questions on the floor to do it." / "Once more like that and I read it myself, and the file will say that I had to."
- new (all flags in): "The chain is in. He goes down to the suite now. The code is 5386." (the "through the relay" line stays before that)
- new: "Good. Keep it to yourself until it is more than a feeling."

Netherton, debrief (`m08_closing_debrief.ink`):
- new narrator: "Your phone buzzes once in the corridor. HaX: \"He said it to you? 'Afterwards, not during.' I was taught that line, and I say it to every agent I run. Same classroom, 0x00. Don't ask me whose yet.\""
- "HaX read the door audit against the box while I was on my office floor. The name reached me secondhand." → "You read the door audit to HaX while I was on my office floor. The name reached me secondhand."
- new: "And he knew we were coming before we came. Whatever he had time to clear, we will never see now."

Nightshade, confrontation: new "You put it on {Cipher|Phantom} in front of the floor. Walls are thin here. So I tidied. Not well enough, it seems."

Nightshade, interview: "Yes. I told you: I'm always here. You've proved I keep long hours, 0x00. Bring me the account." → same, with "I'm always here." when he wasn't asked for an alibi.

Cipher:
- "Whoever opened that plan did it from a Crypto Lab terminal. My desk is on the ops floor. Do the geography." → "My desk is out on the ops floor. Do the geography."
- new: "There's a project sheet in there you're not cleared for. Read it anyway. You'll only pick the lock otherwise." / "Go on, then. Add it to the pile. 0x23, the one with the stickers."

Phantom: new narrator "He laughs, and fishes it out of his jacket." / "0x88, the one with the luggage tag. Mind the folded sheet. It took me a week."

Off-duty agent: new "Word is you've been calling people traitors to their faces. Whole floor's heard. If one of them is the mole, so has he."

Open for cycle 3: confirm J1-J5 in the files; judge the J2 residual (only 0x47 is ever tidied); a browser pass of an accusation, the warning at two misreads, the Director-KO reading on the phone and the three lockers (none played in a browser this round); the locker row's look for the dressing stage (the 0x23 sprite rendered without the lock overlay the other two showed in `lockers.png`, probably the in-range highlight; check).

### Stage 2 alignment, round 3 fix (closing round, 2026-10-14)

Fixer (Opus) on `ALIGNMENT_REVIEW_P5_C3.md` (0 blockers, 1 major, 4 minors) and `PASS5_ALIGN_R2_BROWSER.md` (3 minors, 1 note). Mission files only: `scenario.json.erb`, three ink files, `DECISIONS_PENDING.md`, the m08 route driver and routes. No engine edits; no browser session; nothing committed.

#### Alignment review C3

| # | Sev | Finding | Outcome |
|---|---|---|---|
| K1 | major | The 0x47 "Deep State" brief confesses before the naming | **Fixed (holdall pattern).** Base observation "A slim stapled document, cover torn off. Page 7 has been read more than the rest." and base text the page without the ENTROPY header, both true in every state (E5). Text variants, first match wins: tidied and not named (torn page, headerless, closing line); tidied (torn page with the header); named (the header back); not named (headerless, plus "No letterhead. He gave your intake the insider-threat lecture; this could be his reading for it. Or not."). Observation variant on `mole_identified` restores "A slim ENTROPY recruitment document. Page 7 is the one that matters." Item name and credit unchanged (E4; credits follow the naming). Route `look` steps before and after the naming in r9 (untidied) and r4 (tidied); `route.js` look gained a `lacks` assertion for the missing header |
| K2 | minor | HaX's KO reading needs no clock source | **Fixed.** "[I can name the leak.]" now also needs `found_timeline or found_access_logs_hint or found_access_logs`. New KO rung in her ladder: "You've got the door. Now the clock: when was the plan opened? Somebody in this building wrote it down." Retries stay free. The audit-arrived text now mentions the clock too, so "call me" doesn't lead to a hub with no reading (below) |
| K3 | minor | Netherton narrows the field to two | **Fixed.** "Two of those men badge through that lab door." cut |
| K4 | minor | HaX draws the tidy's conclusion | **Fixed.** Neutral wiped-stick text (below) |
| K5 | minor | Stale "[The Director's taken the audit off me.]" after a KO | **Fixed.** `and not netherton_ko` added |

#### Round 2 browser check

| # | Sev | Finding | Outcome |
|---|---|---|---|
| R1 | minor | A re-opened hub shows the previous line over the hub choices | **Deferred (engine):** logged as E6 in `DECISIONS_PENDING.md` |
| R2 | minor | Notes taken from a container can't be re-read | **Deferred (engine):** logged as E7. HaX's "Security searched his holdall" text already covers the holdall; the brief and stick are `text_file` and stay in the inventory, so the brief's header does reach a re-read after the naming |
| R3 | minor | Tidy line names only one innocent when both were accused | **Fixed:** "Cipher and Phantom both" when both flags are set (order-free, since ink can't tell which came first). New route r11 |
| R4 | note | Montana-flight choice absent after the tidy | **Confirmed as designed, no change.** The choice (and HaX's "bag packed" line, the "Packed nine days ago" credit) waits on `go_bag_lining_known`, and both latches that set it require `nightshade_tidied` false. The tidy itself can't fire once the holdall has been read (`found_go_bag`), so a tidied run never saw the passport and ticket: he took the bag before the player looked. Asking about a flight the player never learned of would be a leak. Montana still reaches the tidied player through Tomb Gamma in the confrontation and debrief, and the credit reads "GO-BAG: Gone from his locker the night you tipped him off" |
| HaX controls | check | Fight-controls wording (Q cycles open hand, jab, cross; hostile chases don't leash) | **Nothing to change:** m08 has no fight-controls text (grep for stow, leash, fists, Q in the ink, scenario and mission.json; the only "leash" is Netherton's deal metaphor) |

Counts: C3 1 major and 4 minors, all fixed; browser 3 minors and 1 note: 1 fixed, 2 deferred to the engine, the note confirmed.

Decisions taken (fixer, reversible, mission-local):
- The brief's base `text` is the headerless page, not the full text the holdall keeps as its base: E5 says some panels print raw fields, and the headerless page is true in every state.
- HaX's audit-arrived text names the clock rather than being split three ways on the clock sources (the engine's evaluator has no `||`, so "has any clock" would need three mappings).
- R3 says "both" rather than an order, because ink doesn't record which accusation came first.

Checks (all after the last edit): `scripts/compile-ink.sh m08_the_mole` 12/12. Route driver, eleven routes (r1-r11), all "all expectations met"; r4, r9, r10 updated and r11 new; longest run without a choice 11 (the opening cutscene, unchanged). Reviewer's probes re-run as written: p3 and p5 pass; p1, p2 and p4 fail exactly on the old behaviour they recorded (the reading with no clock, "Two of those men", the header, "He wiped it after you tipped him off"). Inverted probes in the session scratchpad `m08-align-r3/probes/` (q1 K2 no reading and the clock rung until the timeline, then free retries; q2 K3; q3 K5 on p3's state, the hub offers the reading and not the stale reply; q4 K1 and K4 on p4; q5 p5 again): all pass. `dialoguelint` 0 errors, 0 warnings, 8 blank-reentry CHECKs (unchanged). `reopencheck` m08 0 problems. `inkcheck` every file, plus the HaX phone hub under KO/audit/clock/closed combinations and Netherton's `audit_case` and hub with and without the box and audit: clean. `loopcheck` HaX phone hub (KO with audit) and Netherton's hub: clean. `tagdiff` vs HEAD: 6 structural differences, all from this round (the two phone choices, the ladder rung). Validator (full): no errors; the same two known warnings (brief_taken co-fire; confrontation cutscene not onceOnly). `check_door_alignment.py`: m08 all OK.

Spoken lines changed (old → new), for the TTS stage:

HaX, phone texts (`scenario.json.erb`):
- "Empty. He wiped it after you tipped him off. The print on the casing is still there. Lift it." → "Empty. Written over tonight, and not by accident. The print on the casing is still there. Lift it."
- "That's the door audit. With the Director on his floor, read it to me. Call me when you've got it straight." → "That's the door audit. With the Director on his floor, you read it to me: the door against the minute the plan was opened. Call me when you've got both."

HaX, phone hub (`m08_phone_agent_0x99.ink`):
- new ladder rung (Director down, audit in, no clock): "You've got the door. Now the clock: when was the plan opened? Somebody in this building wrote it down."

Netherton (`m08_director_netherton.ink`):
- "On a login? A login is a key, Agent, not a hand on it. Two of those men badge through that lab door." → "On a login? A login is a key, Agent, not a hand on it."

Nightshade, confrontation (`m08_nightshade_confrontation.ink`):
- "You put it on {Cipher|Phantom} in front of the floor. ..." → "You put it on {Cipher and Phantom both|Cipher|Phantom} in front of the floor. ..."

Item text (not voiced): the 0x47 brief's observation and text, as K1 above.

Open for the orchestrator: alignment can close on the reviewer's terms (static confirmation: route `look` steps on the brief before and after the naming, r1-r11 and the probes). A browser look at the brief before and after the naming, and the KO reading needing a clock, would confirm them on screen.

### Stage 2 alignment: CLOSED (orchestrator, 2026-10-14)
Cycle 3 review 0/1/4; round 3 fixed K1–K5, R3, R4 (no change, reasoned), with routes r1–r11 and the reviewer's probes re-run clean (the static confirmation the cycle-3 reviewer asked for). Round-2 browser check passed all six items. Owed on screen, carried to the puzzle-chains browser check: the brief before and after the naming; HaX's post-KO reading needing a clock source.

### Stage 2 puzzle chains, round 1 fix (2026-10-14)

Fixer (Opus) on `PUZZLE_REVIEW_P5_C1.md` (0 blockers, 1 major, 7 minors). The orchestrator took m5 (MIFARE) and m6 (the locker catch). Mission files only: `scenario.json.erb`, six ink files, `DECISIONS_PENDING.md`, the m08 routes. No engine edits; no browser session; nothing committed. I opened no SecGen XML and none of the four restricted guides.

#### Puzzle chains review C1

| # | Sev | Finding | Outcome |
|---|---|---|---|
| F1 | major | HaX's VM hint ladder is one step late | **Fixed.** The box topic "[What am I looking at on this box?]" opens on `server_room_entered` (declared in the phone ink; HaX's server-room entry mapping already sets it) and closes at flag 1. New flag-2 topic "[I'm on the box. Where do I look?]" between flags 1 and 2. The credentials topic now closes at flag 3, and the mail topic already closed at flag 4, so only the current step shows. Wording from the in-game framing; the VM claims are logged in `DECISIONS_PENDING.md` (U1 addendum 2) as needing checking against SecGen by the user. New route r12 (with a page reload between flags 1 and 2) |
| m1 | minor | Phantom's confirmation doesn't count, and nothing says so | **Fixed.** Netherton's gate names "the men who went through that lab door"; Phantom closes his audit beat with "don't take my word for my own printout. Ask the men on the lab door." (split over two lines for the 30-word cap). Step 4's answer "The people on it confirm their own rows" is still true and is left. r2's expectation updated; r13 is p2 inverted |
| m2 | minor | Every NPC fights at engine defaults when punched | **Fixed.** `behavior.hostile` on every NPC a player can punch: Netherton 75/3, Cipher 70/3, junior analyst 70/3, off-duty agent 80/3, Phantom 90/4, Nightshade (lab and confrontation) 100/4, all `pauseToAttack`. ATHENA and HaX in person don't fight back: `aggroDistance: 1` means the chase never starts, and the engine only swings from the chase (`npc-behavior.js:694`, `:1369`); 0 isn't usable because the engine falls back to 160. HaX texts on `npc_hostile_state_changed` with `data.restored !== true`: m07's two-part wording copied exactly, with a per-NPC opening (pronouns switched for the analyst); one text each for ATHENA and HaX in person. The existing KO texts are untouched. r13 checks the Director's pair, silence on a restored hostile, and ATHENA's text |
| m3 | minor | The access-log excerpt promises a name the box no longer gives | **Fixed** (item text, not voiced): "Only root on the box will show the account behind it, and an account is not a person." / "Root for the account. The doors for the person." |
| m4 | minor | Stale comments | **Fixed.** Header key list (three lockers), win condition (needs the name), PIN cracker (signed out to 0x47), "flag 4 alone names him", the flag-3 and flag-4 comments, the flagRewards comment, the "optional" interviews on Cipher, Phantom and Nightshade; Nightshade's and Phantom's ink headers. No behaviour change |
| m5 | minor | The Director's card is EM4100 | **Fixed (orchestrator: yes).** `rfidCard.rfid_protocol` is `MIFARE_Classic_Custom_Keys`, as m03's Victoria (the dropped physical card carries the same protocol, which the reader ignores for a held card, `unlock-system.js:463-470`). The clone minigame offers the darkside attack for that protocol (`rfid-ui.js:470-481`) and returns through `pendingConversationReturn` to `clone_debrief`; `card_cloned` still carries the same card name. HaX explains the difference before the clone (the all-three branch of her server-room answer) and after (the cloned branch); the all-three nudge says "give it time". m04-m07 were all EM4100, so "the EM4100 you've been reading all year" holds. r13 runs the clone end to end in the driver (`netherton_card_cloned`, `netherton_card_taken`) |
| m6 | minor | Searching an innocent man's locker costs nothing | **Fixed (orchestrator: yes).** The off-duty agent has `los` (360 degrees, 160 px, drawn) and a `lockpick_used_in_view` person-chat mapping, once, before the naming. New knot `on_locker_picked` sets `locker_seen_picked` (new scenario global); HaX's mapping on it sets `nightshade_tipped_off` when not already tipped off, with its own text, so the tidy machinery does the rest. Credit "THE LOCKERS: Seen picking one by an off-duty agent who saw nothing"; debrief line in `the_hunt`. His observations now say he watches the lockers. r13 checks the catch, the tip-off, that a second pick isn't caught, the tidy on the next room, and the credits |
| m7 | minor | The reader opens the cloner with nothing to emulate | **Deferred (engine):** carried, `docs/IDEAS_BACKLOG.md:48` |

Counts: 1 major and 6 minors fixed; 1 minor deferred to the engine.

Decisions taken (fixer, reversible, mission-local):
- The catch works for any of the three lockers. The engine's gate passes no lockable to the condition and the evaluator reads only one level of `data`, so the mapping can't tell 0x47 from the others. Being seen at 0x47 is the loudest tip-off anyway. A player caught at 0x47 who picks it again before leaving still beats the tidy, as with a sprint after an accusation. The real cost lands on the herrings: a player caught at 0x23 or 0x88 who goes to 0x47 later finds it emptied.
- The catch uses a 360-degree sight circle rather than a facing cone. A 140-degree cone would only take in 0x23 if he turned, and the engine's `facePlayerDistance` works but the validator reports it as unknown (E8). The drawn circle shows the player where he can see.
- ATHENA and HaX in person don't fight back, using an existing field. They keep low chase and damage values as a fallback.
- No text when the agent catches the player after the naming (the mapping is gated off then), and no catch with him down or with the owner's key.

Checks (all after the last edit): `scripts/compile-ink.sh m08_the_mole` 12/12. Route driver, thirteen routes, all "all expectations met": r1-r11 (r2's gate wording updated), new r12 (F1 ladder, reload between flags 1 and 2) and r13 (MIFARE hint and clone, p2 inverted, punch texts, the locker catch). Longest run without a choice 11 (the opening cutscene, unchanged). Reviewer's probes re-run as written: p1 passes; p2 and p3 fail exactly on the old behaviour they recorded ("take it to the people on it"; no box topic before flag 1, "That's your first flag"). r12 and r13 are the inverted forms. `dialoguelint` 0 errors, 0 warnings, 8 blank-reentry CHECKs (unchanged). `reopencheck` m08 0 problems. `inkcheck` every file, plus the HaX hub at each VM step, after the three interviews and after the clone, the off-duty agent's catch knot and the debrief's `the_hunt` with `locker_seen_picked`: clean. `loopcheck` HaX hub (three states), off-duty agent (catch and hub), Netherton and Phantom hubs, debrief: clean. `tagdiff` vs HEAD: 17 structural differences, all from this round (the phone topics and VAR, the catch knot, the debrief condition). Validator (full, graph regenerated): no errors. Warnings: the two known ones (brief_taken co-fire; confrontation cutscene not onceOnly), plus two new and intended: the 16 `npc_hostile_state_changed` texts on HaX can co-fire (the two-part pairs, as m07), and the catch is a person-chat with no `background` (the break room has no POV background yet; that is stage 4). `check_door_alignment.py`: m08 all OK.

Spoken lines changed (old → new), for the TTS stage:

HaX, phone hub (`m08_phone_agent_0x99.ink`):
- "One crafted request gets you code execution with no login at all. That's your first flag." → "One crafted request gets you code execution with no login at all. Get that working and it's your first flag."
- new: "Read the history, not just the files. Then the stash: git keeps what people meant to throw away." / "Whoever's account it is, they committed something they shouldn't have. Git secrets guide's yours if you want it."
- "Reader's east of the ops floor. Open the cloner, pick his card from Saved, emulate it. EM4100 has no crypto; the reader can't tell." → "Reader's east of the ops floor. Open the cloner, pick his card from Saved, emulate it." / "With the keys cracked, the reader can't tell a copy from his own card. Our top card, and it fell in half a minute."
- new, after "You've seen all three...": "His card isn't the EM4100 you've been reading all year. It's MIFARE Classic with its own keys, so the cloner can't just copy it." / "Run the darkside attack to crack the keys first, then read it. Half a minute beside him."

HaX, phone texts (`scenario.json.erb`):
- "That's all three. Now go and see the Director about the server room. Take the cloner." → "That's all three. Now go and see the Director about the server room. Take the cloner, and give it time: his card has proper keys on it."
- new: "Someone saw you at the lockers. He'll tell the floor he saw nothing, which here is the same thing. If one's the mole's locker, he knows we're looking."
- new, per NPC on turning hostile: "<opening> Q switches to fists (again for a harder punch), then E or click when he's in front. Face him squarely." and "Keep pressing Q until the open hand shows to walk by clicking. He's slower than you if you need distance." Openings: "The Director's coming for you." / "Cipher's swinging." / "Phantom's coming at you." / "Nightshade's coming for you." / "He's coming over the table." / "The analyst's swinging." (she/her) / "The off-duty agent's coming at you."
- new: "That's ATHENA's reception avatar you're hitting. She won't hit back, and she logs everything. Keep pressing Q until the open hand shows to walk by clicking." / "Ow. I'm not hitting back, 0x00. Keep pressing Q until the open hand shows to walk by clicking."

Netherton (`m08_director_netherton.ink`, `m08_closing_debrief.ink`):
- "Before you read it to me, take it to the people on it. If a man's own row is wrong, he will say so." → "Before you read it to me, take it to the men who went through that lab door. If a man's own row is wrong, he will say so."
- new (debrief): "You picked a colleague's locker in front of a witness, who then told the whole floor he saw nothing."

Phantom (`m08_suspect_phantom.ink`):
- "The archive duty officer walked me out before it finished. I never saw the rest, and I'd rather you didn't tell me. Tell the Director." → "...I never saw the rest, and I'd rather you didn't tell me." / "And don't take my word for my own printout. Ask the men on the lab door."

Off-duty agent (`m08_background_agent.ink`), new: "The magazine comes down." (narrator) / "Oi. That's not yours." / "Don't worry. I didn't see anything. I'll be telling everyone I didn't see anything."

Item text (not voiced): the access-log excerpt (m3); the off-duty agent's observations.

Owed on screen at the stage's browser check: HaX's hub before flag 1 (after entering the server room) and between flags 1 and 2; the Director's chase speed and the two texts after a punch; ATHENA not hitting back; the MIFARE darkside clone at Netherton returning to his chat, then the saved card at the reader; the off-duty agent's drawn sight circle and the catch at a locker. Carried from alignment: the brief before and after the naming; HaX's post-KO reading needing a clock.

### Stage 2 puzzle chains, round 2 fix (closing round, 2026-10-14)

Fixer (Opus) on `PUZZLE_REVIEW_P5_C2.md` (0 blockers, 0 majors, 4 new minors, 1 carried) and `PASS5_PUZZLE_R1_BROWSER.md` (all five items pass; 3 minors, 2 notes). Mission files only: `scenario.json.erb`, three ink files, `DECISIONS_PENDING.md`, the m08 routes. No engine edits; no browser session; nothing committed. I opened no SecGen XML and none of the four restricted guides.

#### Puzzle chains review C2

| # | Sev | Finding | Outcome |
|---|---|---|---|
| N1 | minor | A tidy caused by the locker catch got the audit-closed reason ("The Director went asking questions on my floor") | **Fixed.** Confrontation declares `locker_seen_picked` and `offduty_agent_ko`; two branches after the accusation branches and before the catch-all: the catch line, then the KO line (if both are set the catch came first, since the KO tips off only when nothing has, and a KO'd watcher catches nobody). New route r15 (q6 inverted) |
| N2 | minor | Knocking out the off-duty agent skipped the catch and nothing recorded it | **Fixed.** `globalVarOnKO: offduty_agent_ko` on `background_agent` and a new global; HaX's onceOnly `npc_ko:background_agent` mapping, before the naming and if not already tipped off, sets `nightshade_tipped_off` and texts. The tidy follows through the existing room-entry latches. Credit in ON THE RECORD and a Netherton line in `the_hunt`, both on `offduty_agent_ko` whenever the KO happened. The erb comment no longer calls the KO free. New route r14 (q2 inverted) |
| N3 | minor | The controls texts implied a punched NPC could be talked to again | **Fixed (text only).** Hostility never clears in m08 and clicking a hostile NPC jabs (`interactions.js:662-676`), so each second text now says the NPC won't talk again. The Director's names the KO route (his card off the floor). ATHENA's and HaX-in-person's say the same in their one text. The Q wording is unchanged and correct ("Q switches to fists (again for a harder punch)"; "Keep pressing Q until the open hand shows"). All at 30 words or fewer. r13 updated. The optional `netherton_hostile` rung on HaX's ladder was not added: the text names the route |
| N4 | minor | The sight circle stays drawn after the catch, the naming, a KO | **Deferred (engine):** E9 in `DECISIONS_PENDING.md` |
| m7 | minor (carried) | The reader opens the cloner with nothing to emulate | Deferred (engine backlog), unchanged |

#### Round 1 browser check

| # | Sev | Finding | Outcome |
|---|---|---|---|
| P1 | minor | "How do I get into the server room?" stayed in HaX's hub after the room was open | **Fixed.** Gated `{ not server_room_entered }` (the synced latch set by HaX's room-entry mapping), so it retires on first entry. r15 checks it is gone after entry and after flag 4 |
| P2 | minor | A reload puts the player in `main_lobby` | **Deferred (engine):** the known backlog item "Resume in the room you left"; E10 in `DECISIONS_PENDING.md` |
| P3 | minor | Fists up blocks click-to-move; the text covers it | No change (the browser check found the text accurate) |
| P4 | note | Punched ATHENA and HaX show `isNPCHostile` true though they never fight | No change; not seen on screen. N3's texts now say they won't talk again, which is what hostility does to them |
| P5 | note | Catch with the owner's key, or with the agent KO'd, untested | **Confirmed in the engine, no change needed.** Any key in the inventory sends a key lock to the key minigame (`unlock-system.js:141-186`), which runs the catch gate only if the player chooses "Switch to Lockpicking" (`minigame-starters.js:419`); the direct-pick gate (`unlock-system.js:194`) runs only with no keys at all. So the owner's key (any suspect locker key, in fact) opens a locker with no catch. The gate skips a KO'd watcher (`npc-manager.js:313`). The erb comment now says both. Still worth one look on screen at the next browser check |

Counts: C2 4 new minors: 3 fixed, 1 deferred to the engine; 1 carried (engine). Browser 3 minors and 2 notes: 1 fixed, 1 deferred to the engine, 1 no change, the notes answered.

Decisions taken (fixer, reversible, mission-local):
- The off-duty agent's KO tips the mole off (the reviewer's first option), so assaulting the witness costs at least what being seen costs. No separate record-only mapping: the credit and debrief read `offduty_agent_ko` directly, and an extra mapping would only add a co-fire warning.
- The credit and debrief line call him "a witness, not a suspect" rather than saying why he was hit, since the player may have had no reason.
- P1 retires the topic on entering the room rather than on the door opening: entry is the latch that already exists, and a player who cloned the card but hasn't gone in still needs the "emulate it" answer.

Checks (all after the last edit): `scripts/compile-ink.sh m08_the_mole` 12/12. Route driver, fifteen routes (r1-r15), all "all expectations met"; r13 updated, r14 and r15 new; longest run without a choice 11 (the opening cutscene, unchanged). Reviewer's probes re-run as written: q1, q3, q4, q5 pass; q6 now passes (it was the failing evidence for N1); q2 fails exactly on the old behaviour it recorded (no tip-off after the KO). `dialoguelint` 0 errors, 0 warnings, 8 blank-reentry CHECKs (unchanged); timed texts max 30 words. `reopencheck` m08 0 problems. `tagdiff` vs HEAD: 8 structural differences, all from this round (the hub gate, the confrontation branches, the debrief condition). Validator (full): no errors; the four known warnings (the 16 hostile-text co-fires on HaX; brief_taken co-fire; confrontation cutscene not onceOnly; the catch person-chat has no background). `check_door_alignment.py` on m08: all OK.

Spoken lines changed (old → new), for the TTS stage:

HaX, phone texts (`scenario.json.erb`):
- second controls text, the Director: "Keep pressing Q until the open hand shows to walk by clicking. He's slower than you if you need distance." → "He won't talk to you again tonight. Put him down for his card, or keep away: he's slower. Keep pressing Q until the open hand shows to walk by clicking."
- second controls text, Cipher, Phantom, Nightshade (lab), the confrontation, the off-duty agent (the analyst with "She"/"her"): "Keep pressing Q until the open hand shows to walk by clicking. He's slower than you if you need distance." → "He won't talk to you again tonight. Put him down or keep away: he's slower than you. Keep pressing Q until the open hand shows to walk by clicking."
- ATHENA: "That's ATHENA's reception avatar you're hitting. She won't hit back, and she logs everything. Keep pressing Q until the open hand shows to walk by clicking." → "That's ATHENA's reception avatar. She won't hit back, or answer you again, and she logs everything. Keep pressing Q until the open hand shows to walk by clicking."
- HaX in person: "Ow. I'm not hitting back, 0x00. Keep pressing Q until the open hand shows to walk by clicking." → "Ow. I'm not hitting back, 0x00, but I'm done talking in person tonight. Ring me. Keep pressing Q until the open hand shows to walk by clicking."
- new, the off-duty agent knocked out before the naming: "An agent out cold in the break room. That's round the floor by midnight, and if one of those lockers is his, so is he."

Nightshade, confrontation (`m08_nightshade_confrontation.ink`), new:
- after a locker catch: "Somebody saw you at the lockers in the break room. On this floor that reaches me before the kettle boils. So I tidied. Not well enough, it seems."
- after the off-duty agent's KO: "You left a man out cold in the break room. That was round the building before he woke. So I tidied. Not well enough, it seems."

Netherton, debrief (`m08_closing_debrief.ink`), new: "You put an off-duty agent on the break-room floor. He was a witness, not a suspect. He'll mend. The floor's opinion of you may not."

Credit (not voiced), new: "AN OFF-DUTY AGENT: Knocked out in the break room. A witness, not a suspect."

### Stage 2 puzzle chains: CLOSED (fixer, for the orchestrator, 2026-10-14)
Cycle 2 review 0/0/4 (plus 1 carried engine minor); the round-1 browser check passed all five items with 3 minors. Round 2 fixed N1, N2, N3 and P1, confirmed P5 in the engine, and deferred N4 (E9) and P2 (E10) to the engine. Static confirmation as the cycle-2 reviewer asked: r13 updated, the inverted q2 (r14) and q6 (r15), all fifteen routes clean. Owed on screen, carried to the next browser check: a punched NPC's second text and that clicking them afterwards jabs; the off-duty agent's KO text and the tidy; the catch not firing with a suspect's locker key in hand; HaX's hub without the server-room topic after entry.
