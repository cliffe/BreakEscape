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
