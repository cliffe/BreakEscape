# m10 Full Disclosure, stages 1–2: review round 2 (structure, consistency, playability)

## 1. Scope and method

Reviewer: fresh read-only reviewer (Opus), round 2, 2026-10-21. Lens: structure, consistency and playability, with emphasis on what changed since round 1.

Read: `docs/agents/FINALE_BRIEF.md`; `.claude/skills/mission-alignment-plan/SKILL.md`; `finale/FINALE_ARC.md` §1–9 and §13 ("FA L<n>"); m10 `stage_0_initialization.md` ("s0 L<n>"); m10 `stage_1/story_arc.md` draft 2 ("arc L<n>"), including §14 (33 changes) and §15; m10 `stage_2/storytelling_elements.md` draft 2 ("SE L<n>"); `stage_1/REVIEW_R1_STRUCTURE.md`; m09 `stage_1/story_arc.md` ("m09 L<n>"). No VM material was opened.

Orchestrator rulings taken as given: WREN has one goal (the key); budget ≤ 110 minutes; the countdown is objects reading a story-beat global, no engine feature; Kowalczyk's cracker in m10's start kit; F11's two lethal versions.

Spot checks against shipped missions:

- m04: "Above him it stops being a person you can arrest" is Voltage's line about Blackout (`m04_npc_voltage.ink:270`), so quoting it at the core's door about the man above Blackout fits. "it'll be waiting" is HaX's (`m04_closing_debrief.ink:223`), so "I said it'd be waiting" fits.
- m02: HaX's line is "Don't be the fifth person tonight to walk in and treat him as one" (an overhead; `m02_phone_agent0x99.ink:445`). Ghost: "We'll be watching." (`m02_phone_ghost.ink:611`), "I hope it's you leading it." (`:625`). Gary: protected, Director of Cyber Security (`m02_closing_debrief.ink:542`, `:587`); unprotected and exposed, fired then **rehired** as IT Security Director after the backlash (`:553`); unprotected and quiet, fired and blacklisted, on a college help desk (`:597`).
- m03: "My associates offered to deal with you. I said I'd do it myself. I still might." (`m03_npc_victoria.ink:737`); "proof of concept ... You'll see the rest." (`:790`).
- m07: Tesseract says "Let it hurt afterwards, not during. I expect you've been told that." on the handset (`m07_architect_comms.ink:122`, sets `architect_echo_heard` at `:119`), so HaX's "You heard him say that on your handset" is right.
- m08: Netherton's "Two of ours are dead in the space between what I knew and what I did." (`m08_closing_debrief.ink:80`); Nightshade's "the man who put me here fifteen years ago" (`m08_nightshade_confrontation.ink:205`); the KO safety net sets `nightshade_arrested` and `nightshade_ko_before_fate` together (`scenario.json.erb:1054`), and m08's own credits guard the arrested line with `!nightshade_ko_before_fate` (`:194`), which is the guard m10 now uses. m08 never mentions the Insider Threat Initiative.
- m06: Satoshi asks "Do you ever wonder if we're right?" and sets `satoshi_stance=wondered` (`m06_satoshi_confrontation.ink:540–547`).
- "0x99" appears in shipped m01–m08 dialogue only in comments; "Ninety-nine" is unused, as round 1 found.

## 2. Round 1 findings: confirmation

Arc §15 marks all 28 structure findings fixed. Checked against the text:

| ID | R1 sev | Confirmed? | Evidence / residue |
|---|---|---|---|
| S1-01 | blocker | **Yes** | Release moved to the outer lock: arc L28, L168, L172, L218, L306; SE L486, L500. Every gallery outcome now comes first (§4 below). Residue: s0 L45, L147 still say "gallery door" (S2-15). |
| S1-02 | major | **Yes** | arc L242: no 02:10 entry, no HaX line, no core WREN beat on `m09_sleeper_named`. |
| S1-03 | major | **Yes** | arc L193 guards the arrested branch; change 24 covers m09. Matches m08's own credit guard (erb:194). |
| S1-04 | major | **Yes** | Phantom's list now replaces clue 3 (arc L272) as the breaching-case sign-out, which fits m09 making Quintero an H&L hire too. |
| S1-05 | major | **Yes, with knock-ons** | The silent door has a decision (arc L194, L122). Taking Arakawa off the main path breaks three later beats (S2-06). |
| S1-06 | major | **Partly** | "An archive in Helena" and the Nightshade line are in (arc L87, L90), but "our mole" is spoken in the WREN fact (L89) before the line that explains it (L90) (S2-09). |
| S1-07 | major | **Partly** | Fence wait during flag 1 (L108), 06:00 as a cutscene (L363), cut list extended (L48–54). The figures are still optimistic in two places (S2-16). |
| S1-08 | major | **Yes** | Accusation on the line (arc L278); Vector staged (L134). |
| S1-09 | major | **Yes** | Countdown objects reading a global (arc L11; change 25), per ruling. |
| S1-10 | minor | **Yes** | Ghost "unanswered" (arc L237; SE L398). |
| S1-11 | minor | **Partly** | Branches on `m02_gary_protected`, but the exposed-and-unprotected Gary was rehired in m02, and the default branch has no line (S2-10). |
| S1-12 | minor | **Yes in m10** | Tasking taken (arc L244); mirror explains the leverage (L323). m09's change 8 still says "plays both ends" (S2-19). |
| S1-13 | minor | **Yes** | SE L217 keeps m09's "everything from now on" (m09 L317). |
| S1-14 | minor | **Yes** | Echo-heard (SE L142), guard-bribed (arc L113), redirected counts (L168), told/confessed (L323), HashChain line moved to Netherton (SE L287). |
| S1-15 | minor | **Partly** | Slot reserved (arc L331), but the answer claims the player *heard* the tapes, which m09 rules out, and the import name differs from m09's (S2-11). |
| S1-16 | minor | **Yes** | arc L147; change 29. m09 L278 agrees ("his original"). |
| S1-17 | minor | **Yes** | Plain-form rebuttal (SE L104); HaX reads the memo on a cold start (arc L317). |
| S1-18 | minor | **Yes** | arc L14, L287. |
| S1-19 | minor | **Yes** | arc L285, L337. |
| S1-20 | minor | **Yes** | Moved to the outer lock (arc L307); the m04 source supports it (§1). |
| S1-21 | minor | **Yes** | All three m09 beats called back (arc L252–255; SE L332, L342). |
| S1-22 | minor | **Yes** | Checking avoids the tripwire (arc L192). |
| S1-23 | minor | **Fixed as asked, but it exposed a larger problem** | Both briefings state "placed eleven years ago" (L73, L89), said with the team present (S2-01). |
| S1-24 | minor | **Partly** | Fixed order, but the rebuttal sits in slot 2 in both exchange 1 and exchange 3 (S2-12). |
| S1-25 | minor | **Yes** | SE L537. |
| S1-26 | minor | **Yes** | Start kit (arc L62); Tesseract non-hostile, KO-proof (L312). |
| S1-27 | minor | **Yes** | arc L363. |
| S1-28 | minor | **Yes** | Vos's trade (arc L226; SE L416). |

**Tally:** 21 confirmed (S1-01 with a stage 0 sweep left over, S1-12 with an m09 sync left over); 6 partly (S1-05, S1-06, S1-07, S1-11, S1-15, S1-24); S1-23 fixed but exposed S2-01. None reopened at its old severity; the residues are new findings below.

## 3. New findings

Counts: **0 blockers, 5 majors, 14 minors.**

### 3.1 Blockers

None.

### 3.2 Majors

| ID | Sev | Location | Evidence | Problem | Fix |
|---|---|---|---|---|---|
| S2-01 | major | arc §3 beat 5 L73, §4 L83 and L89; FA §4.0 L483; m09 L169, L319 | m10 briefing: "Netherton states what the ledger says, for every player: one of this team, 'placed eleven years ago' ... The team stands in view." Cold start: the WREN fact "with the four suspects in view". m09: Netherton "will say nothing to the team; 'and neither will you.'" and his reason, "If I bench four agents tonight, WREN knows we know." HaX's shortlist line "Two faces from Helena. Watch both." is also placed "at the briefing" (arc L273). | Telling the team that one of them is WREN, with WREN listening, is exactly what Netherton's rule exists to prevent. It breaks m09's explicit instruction, makes his "WREN knows we know" reasoning nonsense, and gives WREN every reason not to clone a badge eight minutes later at the same table (arc L244). The placement date (S1-23's fix) makes it worse: WREN now knows SAFETYNET has the ledger entry. This is the premise of the whodunit on every branch except named-in-m09. | Make the WREN beat private. After the public part of the briefing (stakes, invitation, Quintero's objection, the order), Netherton and HaX take the player to the van end: the ledger fact, "placed eleven years ago", why the team stays together, and on `m09_sleeper_shortlist` HaX's "Two faces from Helena. Watch both." The team is visible through the van's door, packing, out of earshot. Same on the cold start. Change FA §4.0's "with the four suspects in view" to "in view, out of earshot" (new FA change 35). |
| S2-02 | major | arc §5.2 L110, L114; §8.2 L263; FA §6.2 L737 | Flag 1 buys "the cameras, the blast-door route, and the door log". Kowalczyk, on the service door: "Steel, a reader, a camera that doesn't move." Clue 1 is the reader's log at 02:10. | If there is a fixed camera on the service door and flag 1 gives the camera feeds, the obvious move is to look at 02:10 on that camera, which shows WREN. Nothing in the arc says why that doesn't work. Any player who thinks to check, or asks HaX, breaks the whodunit or hits a silent gap. | One sentence and one HaX line. Best: the camera is a dummy (the refit never wired it), so Kowalczyk's true line is also the tell; HaX after clue 1: "That camera's a box on a bracket. Never wired." Alternatively, it watches the approach road, not the door. Write it into §8.2 and FA §4.4 clue 1 (new FA change 36). |
| S2-03 | major | arc §5.2 L114, §8.1 L252, §8.3 L271; SE L303, L325; FA §4.0 L485 | Quintero: "I took the drain, she took the door end." Kowalczyk: "Door end. Service door's real." Clue 1: the service door opened at 02:10. Nightshade's helper line: "Your log will show a borrowed badge. Don't ask whose. Ask who took the door end." The door scene is before flag 1 and the split (arc L104, L106). | (1) Clue 1 plus a conversation every curious player has already names Kowalczyk: she says herself she was at the door end, and the door end is where the service door is. That contradicts the arc's own logic ("No clue names WREN on its own; two together do"; "Clues 2 and 3 cross at one name", L261, L267) and empties Quintero's suspicion ("Clue 2 leaves her in; she is the obvious wrong answer", L252), because the line that puts Quintero in the tunnel also puts her at the drain. (2) Nightshade speaks at the forward post before the split happens, so "Ask who took the door end" foretells an event he can't know about. | Make the fork not decide it: both branches of the service tunnel reach the service door (the drain comes up beside it), and Quintero's line becomes "We split at the fork. I took the drain." with Kowalczyk's "Door end." kept as true colour; or move the fork so the service door is past where the two branches rejoin. Then clue 2 genuinely leaves two names. Rewrite Nightshade's helper as playbook, not prophecy: "They always borrow a badge, and it's never the borrower's. Look for whoever went where nobody watches." Keep it worth exactly one clue. Adjust change 11. |
| S2-04 | major | arc §3 L68, §8.2 L265, §8.4 L282; SE L309; arc L244 | Clue 3 turns on who packed the breaching case: "At 01:58 the case was open on the kit-check table, packed by Kowalczyk and Arakawa." The only place the player learns that is the briefing's cold open, where "Nobody remarks on either." HaX's nudge asks "Who packed it?" but the arc gives her no answer. Phantom's list carries the fact, but only when Phantom is present. Kowalczyk says it herself only during the accusation. | On the default branch (no Phantom, no m09 shortlist, no kept Nightshade) clue 3 depends on the player remembering an unremarked detail from a cutscene they can't replay. A player who missed it holds clues 1 and 2 (two names) and a clue 3 that says nothing. That fails "solvable on every branch" and "the player always knows what to do next". Also, the briefing starts at 01:45 and the clone is at 01:58, so the kit-check table has to stay open through the briefing and the door scene, which the arc doesn't say. | Give the fact a recoverable source on every branch: a breaching-case sign-out sheet on the forward-post table (the same record Phantom audits; readable any time, and on the line HaX can read it), or HaX answering her own nudge if asked ("Kowalczyk and Arakawa. I watched them do it."). Say once that the kit check runs from 01:45 until the split, with the case open on the table, so 01:58 sits inside it. |
| S2-05 | major | arc §7.2 L202, §7.3 L214, §7.4 L225, §7.5 L234, §8.4 L289, §7.3 L212, §10.1 L365, §11.1 L412–420; m09 L193; FA §4.6 L597 | The arc promises an epilogue payoff for: Imran's phone call (L202), Gary's fate when not talked round (L203), Wendell's colleague (L214), Voltage's ask for the inquiry (L212), arrested Victoria's reduced charge (L225), Ghost's message answering "Did the board ever thank you?" (L234; row 13), the Recruiter's "I'll remember the shape of you" on `double_crossed` (m09 L193: "waits for the m10 epilogue"), a knocked-out raid member's line and "never named" (L289), Elena Torres, the forty-seven, dispatch, Albion's inquiry, the $12.8M (§13 item 3), each burned operation going dark (§10.8). The 06:00 frame gives at most five walkabout slots "chosen by weight" (L365), Netherton two lines, and the card five lines with one "human line" (L420). | Several promised payoffs have no slot, and the walkabout's cap drops others silently on a rich save, which is the save the user most wants to feel. Ghost's message and the Recruiter's line have no place at all: neither is in the walkabout (both are phone-only), neither is in the five-line card. The executed ending also has no walkabout, so it loses every one of them. | Give each promised payoff a guaranteed home, cheaply. (1) The credits' "In this operation" list (L428) already names every person the player met; add one fixed outcome clause per person by branch ("Imran Siddiqui, the workshop. Kept his phone. Didn't use it."), which pays most of the list on every ending, executed included. (2) Ghost's message and the Recruiter's line arrive as phone texts during the 06:00 cutscene (one line each, unvoiced). (3) The $12.8M goes in Netherton's two lines on `m06_assets_seized`. (4) Keep the walkabout for the five heaviest, as now. Write the precedence once in §10.1 and amend change 33. |

### 3.3 Minors

| ID | Sev | Location | Evidence | Problem | Fix |
|---|---|---|---|---|---|
| S2-06 | minor | arc §7.1 L194; §6.3 L171; §8.4 L283; §8.1 L255 | Silent door, "brought": "Arakawa walks him up and stays with him, so Arakawa isn't a room ahead." Later beats assume Arakawa is with the player: his line as Kowalczyk peels off (L171), "Arakawa ... looks away" at the accusation (L283). | On this branch those beats have no speaker, and a wrong accusation of Arakawa costs "one more guard ahead", which the branch already charges. | State the branch: Quintero says the peel-off line; the accusation's third beat drops Arakawa's reaction; Arakawa is accused on the line; a wrong accusation of him on this branch costs Nightshade's crank instead (he's sent back with Arakawa). |
| S2-07 | minor | arc §9.2 L305–306; §6.3 L168–169 | The head start goes as the outer lock opens; stopping it needs flag 2 at the server-hall console; "Stop it" needs the disarm from flag 3. | Nothing in the arc says the gallery can't be reached before flags 2 and 3. If stage 5 leaves any route round the server hall, the release goes before the player could have stopped it, and the player reaches the core with no disarm. | Write the gate into §6.3: the gallery door opens only with flag 3 in (the disarm armed). Stage 5 enforces it. Add to change 19. |
| S2-08 | minor | arc §9.3 L345–347, §10.5 L388; SE L189–193; §11.1 L416 | The cold choice is "[Shoot him where he sits.]" in both menus, but on two or more points he has stood up (SE L176). The executed aftermath: "Quintero comes in from the lock and takes the player's weapon." Card line 1: "dead". | The button is wrong on the two-point menu. Quintero may be wounded at the core or sent back and not recalled. The card doesn't tell the two lethal endings apart. | Label by state ("[Shoot him.]" with the narrator's warning doing the work). Fallback for Quintero: Arakawa, or Netherton's van team at the lock. Card line 1: "dead, reaching" / "dead, unarmed, and the board sits next month". |
| S2-09 | minor | arc §4 L89–90 | Cold start: the WREN fact "The people who placed our mole placed someone else" comes in item 2; the line explaining Nightshade on `not m08_completed` comes in item 3. | A player who skipped m08 hears "our mole" before being told who he is (S1-06's residue). The phrase also conflates two recruiters: Tesseract recruited Nightshade through his own intake (FA row 106; m08 confrontation:205), while the Initiative placed WREN through Harwick & Lowe (FA row 117). | Put the Nightshade line first on `not m08_completed`, and reword: "The same people who bought our mole placed someone else." |
| S2-10 | minor | arc §7.2 L198, L204; SE L421–422; `m02_closing_debrief.ink:553`, `:597` | Imran's grievance: protected, "Gary landed on his feet"; unprotected, "They sacked the whole team and kept the board." The default branch (m02 never played, or exposed without protection) gets neither by rule. | On exposed-and-unprotected Gary was rehired after the backlash, so "sacked ... kept the board" is half false for that player; never-played has no line. | Key the line on Gary's m02 outcome: in work (protected, or exposed) → "landed on his feet"; out of work (unprotected and quiet) → "sacked the whole team"; never played → a neutral grievance about the board. |
| S2-11 | minor | SE L139; arc L331; m09 L242, L284; change 31 | Alpha-tapes answer: "I've heard you teach it, on the Alpha tapes." m09: "His voice is never heard in m09"; the tapes are pulled to the drop terminal and only their annotation sheets are decoded. The import is `alpha_tapes_saved` in m10; m09 keeps `deck_pulled` for stage 3 (m09 L373). | The player never hears the tapes, so the line claims an experience m09 doesn't give. The two missions name the carrying global differently. | m10 line: "I've read your Alpha notes. You told them to carry it. You never told them to hand it on." One name for the export, chosen by stage 3 in both files; add it to FA §3.2 and §3.4 in change 31. |
| S2-12 | minor | SE §2.3 L101–140; arc §9.3 L328 | The arc: "the mission's rebuttal never in the same slot twice". SE: rebuttal in slot 2 (exchange 1), slot 4 (exchange 2), slot 2 (exchange 3). Exchange 3's table has two rows numbered 3, and the "–" fill rows shift positions. | The rule isn't met, and the slot a fill row takes is undefined. | Put exchange 3's rebuttal in slot 1 or 3; give each exchange four fixed slots, with the fill rows taking a named slot. |
| S2-13 | minor | SE §2.1 L37; m09 L286; SE §3.4 L322 | SE: HaX "told him not to in m09". m09's side of the call: "Nobody's called me that since the course. *(beat)* No." Quintero: "She doesn't know Harwick & Lowe placed her too, as honest cover". | m09 doesn't show her refusing the name, only a "No." to something unheard. Quintero would know her own recruiter; what she doesn't know is that it was a front. | SE: "She didn't answer to it in m09." Quintero: "She doesn't know the firm that placed her was a front." |
| S2-14 | minor | SE §3.5 L373; `m02_phone_agent0x99.ink:445` | m10: "At St. Catherine's I asked you not to be the fifth person to treat him as a suspect." m02: "Don't be the fifth person tonight to walk in and treat him as one" (an overhead). | A callback that misquotes the line it calls back. | "At St. Catherine's I asked you not to be the fifth person to treat him as an overhead. He's had a few more since." |
| S2-15 | minor | s0 L45, L47, L50, L147, L160, L200; FA §1.3 L48, §8 r6; changes 19, 20 | Stage 0 still says the head start goes "as the gallery door opens" and that lethal force comes "only when he reaches for the dead-man switch". FA and stage 0 say "about 100 minutes"; the arc now targets 105 under a 110 ceiling. | Changes 19 and 20 list only FA sections, so the arc-keeper's sweep would miss stage 0. No change records the new duration. | Add stage 0's lines to the sweeps of changes 19 and 20. New FA change 34: m10 runs about 105 minutes, ceiling 110 (FA §1.3, §8 r6; s0 §1, L200). |
| S2-16 | minor | arc §2 L40–44 | Act 1: "tunnel and security office (6)" carries the blast door, the tunnel guard post, the photo and props, clue 1, Ghost's full scene (2–3 alone) and Vector's door. Act 3: "the choices (5)" carries Stop it, WREN's entrance and fight, Netherton and Tesseract's greeting, three stated costs, and the step-5 menus with the cold choice's confirmation. | Both are short by two or three minutes for a first-time player; a realistic total is 108–115. The ceiling holds only if the cut list fires. | Set Act 1 to 25 and Act 3's choices to 6–7, and state that the media room cut (item 1) is planned unless stage 8's timed playtest comes in under 105. |
| S2-17 | minor | arc §9.3 L317; SE §2.4 L153 | Tesseract's idle lines during flag 4 fire "each on VM sub-progress, never on time". | The game sees a flag when it is submitted, not the steps inside one, so "sub-progress" has no trigger. | Trigger them on things the game sees: the player's first use of the host terminal, a field-guide hint request, and a failed flag submission. Or keep one line. |
| S2-18 | minor | arc §8.4 L289 | "A knocked-out Kowalczyk can't act at the core, but `sleeper_caught` stays false." | Unstated whether the player can still accuse her on the line once she is held at the forward post, which decides whether `sleeper_caught` can become true later. | Yes: a held raid member can be accused on the line with the same outcomes; say so. |
| S2-19 | minor | m09 §14 change 8 L501; arc change 27 L498 | m09 still says "In m10, WREN plays both ends ... the m10 author confirms." m10 change 27 drops it, per the ruling. | The two missions disagree until m09's change 8 is rewritten. m09's Beat 2.4 text already agrees with m10; only the change row is stale. | The m09 author rewrites change 8's second half to "one goal at the core: the key". |

## 4. The changed areas, checked

**The head start at the outer lock, against every gallery outcome.** All in time now. Recruited: confronted, she withdraws Zero Day's order before opening the lock; trusted blind or refused, Zero Day's share goes at the lock, as intended. Escaped with the threat: talked down or knocked out, the order stands (no claim otherwise). Escaped without the threat: walk, the order is withdrawn in the gallery; arrest, it stands. Arrested: Vos withdraws it when her information is used. Default: Vos's trade buys the card, not the order; talking him out works only with the head start already stopped, which is consistent. Ghost's share is settled earlier, in the security office. The lock's object reads RELEASED, partial, or nothing, and the card's three head-start lines cover every mix. The Join path is after the lock, so it is consistent. One gap: the gallery must be gated on flag 3 (S2-07).

**The budget.** 105 at the act level is plausible against m09's 7 minutes a VM stage (35 of 105 for four flags, one of them the container escape). Two buckets are short (S2-16); expect 108–115 for a first-time player, so the cut list is doing real work. The forward post now holds about 16 minutes before the first door, but flag 1 fills 9 of them, so the pace problem round 1 raised is gone.

**Five full scenes, a decision on every combination.** Holds. The door: kept-shown (take him in or not), kept-not-shown (check or not), arrested (deal or not), silent (bring him or not). Workshop, power room, gallery and network: every row has a decision (arc §7). The silent-door decision is a real trade (the crank against Arakawa's place), with knock-ons to write (S2-06). It is still the thinnest scene, a one-word NPC, which is acceptable.

**The whodunit, branch by branch.**

| Branch | Route to the answer | Holds? |
|---|---|---|
| Default (no helpers) | clue 1 → clue 2 (tunnel pair) → clue 3 (case packers) | Only if the player recalls the kit check (S2-04); and clue 1 plus the recon chat already names her (S2-03) |
| Phantom present | clue 1, clue 2, Phantom's list for clue 3 | Yes |
| Kept or dealt Nightshade | his line for clue 2, then clue 3 | Yes, once the line is reworded (S2-03) |
| `m09_sleeper_shortlist` | the shortlist for clue 2, then clue 3 | Yes, once the HaX line is private (S2-01) |
| Warned WREN (tripwire) | same clues; she peels off at the workshop; the line accusation still works | Yes |
| Accusations on the line | Malhotra, Vector, Phantom, Kowalczyk after the peel-off | Yes; held-after-KO unstated (S2-18) |
| No Quintero (wrongly accused, not recalled) | the player stops WREN at the core; `sleeper_caught` true if named | Yes |
| Named in m09 | skipped; no 02:10 entry | Yes |
| Any branch | the service-door camera | Breaks it unless explained (S2-02) |

**Every ending reachable and distinct.** Arrest (two routes), surrender (two points), justified lethal (fewer than two, "arrest", he reaches, fire), executed (the cold choice in either menu, two steps), Scorched Earth ("wipe both", no step 5), Join (three steps). All six are reachable and each has its own core beat, 06:00 or Citadel frame and title. Executed is distinct in tone and in what it withholds (no walkabout, no "rest", no signature). Small fixes in S2-08. `ending` gains `executed` (change 20 covers FA §3.5).

**Imports placed, none gating.** All 63 FA §3.2 imports plus the new `m09_sleeper_shortlist` have a beat; the four round 1 gaps are closed. Several Tier 2 epilogue imports (`m05_elena_treatment_funded`, the forty-seven's three, `m04_disclosure_choice`'s inquiry line, the dispatch count) now compete for one card line, so on most saves they are placed but not seen: S2-05's credits fix carries them. Nothing gates completion: every import-driven obstacle (the tripwire, blind trust, the broken Ghost deal, warned WREN, a wrong accusation, the silent door left in the van) has an in-mission way round.

**Cold start.** Coherent once S2-09 reorders two lines: Helena, Tesseract, the hour, WREN and Nightshade are each said before they matter, and every slot has its default. The privacy fix (S2-01) applies here too.

**m09 ↔ m10 agreement.**

| Thread | Verdict |
|---|---|
| Quintero canon (H&L hire, father in care, argued against Helena) | Agrees (m09 L87, L199; arc L252; SE L322). One wording fix (S2-13). Note: m09's placing sheet dates Quintero's hire to the same quarter as Kowalczyk's, so "placed eleven years ago" fits Quintero as well as Malhotra; that helps the field, and nobody should write a line saying only Malhotra matches. |
| The confession promise ("the rest") | Agrees: promised m09 L215, owed at m09's debrief (L317), paid at 06:00 on every ending that reaches it except executed (arc L366; SE L260). Join has no 06:00, so it goes unpaid there, which suits that ending. |
| "Ninety-nine" | Agrees in substance (m09 L286, L288; arc L316; SE L240). One wording fix (S2-13). |
| Casualty-sheet copies | Agrees: m09's flag 4 gives his original (m09 L278); m10's bench copy is a later printing with Asante's upward correction and his second signature (arc L147; SE L404). FA §4.1's wording waits on change 29. |
| Alpha tapes | Disagrees on what the player experienced and on the export name (S2-11). |
| WREN's allegiance | m09's Beat 2.4 agrees with m10; m09's change 8 row is stale (S2-19). |
| Keeping the team in the dark | Disagrees (S2-01). |
| `recruiter_secret` | Agrees: told/kept/confessed set in m09 (L183–184); m10 reads all three (arc L323). |
| `should_have_told` follow-through | Agrees (m09 L317; SE L217). |

## 5. Verdicts on the 33 proposed FINALE_ARC changes

Accept 23, modify 10, reject 0. Plus three new changes this review proposes (34–36).

| # | Change (short) | Verdict | Reason |
|---|---|---|---|
| 1 | No pronoun for WREN before the accusation | Accept | Unchanged from round 1. |
| 2 | The cracker canon, one line in both missions | Accept | m09 L96 and arc L91 agree. |
| 3 | Accusations on the line; Netherton through HaX's channel | Accept | Add that a held (knocked-out) raid member can still be accused on the line (S2-18). |
| 4 | Malhotra's eleven years; both briefings state the placement date | **Modify** | Keep the date, but say it at the private aside, not in front of the team (S2-01). |
| 5 | 06:00 under floodlights, a cutscene | Accept | |
| 6 | Escaped Victoria's trade | Accept | In time now (§4). |
| 7 | Arrested Victoria's information (Vos's skim) | Accept | In time now. |
| 8 | Imran and Wendell; Imran's grievance by `m02_gary_protected` | **Modify** | Key the grievance on whether Gary is in work after m02, and add a never-played line (S2-10). |
| 9 | Warned WREN goes ahead at the workshop | Accept | |
| 10 | Shown Nightshade's override is the alarm panel | Accept | |
| 11 | Helpers: Nightshade and the shortlist replace clue 2; Phantom's list replaces clue 3 | **Modify** | Right mapping. Reword Nightshade's line as playbook (he speaks before the split), and fix the fork so clue 2 really leaves two names (S2-03). The shortlist line is private (S2-01). Add `m09_sleeper_shortlist` to FA §3.2 Tier 1 and §3.4. |
| 12 | Asante corrected the sheet | Accept | |
| 13 | Escaped Voltage talked down with the corrected sheet | Accept | |
| 14 | Close order; credits open with "In this operation" | Accept | It becomes the home for most epilogue payoffs under S2-05. |
| 15 | Quintero's objection and the player's stance | Accept | |
| 16 | Arakawa's call is his alibi; the road is his suspicion | Accept | |
| 17 | "Ninety-nine" | Accept | Fix SE's "told him not to" (S2-13). |
| 18 | Suspicion beats agree across both missions | Accept | |
| 19 | The head start goes as the outer lock opens | **Modify** | Right. Add the gate (gallery opens only with flag 3, S2-07) and sweep stage 0 L45, L147 (S2-15). |
| 20 | Two lethal-force endings (F11) | **Modify** | Right. Fix the cold choice's label on the two-point menu, the Quintero fallback, and the card line (S2-08); sweep stage 0 L47, L50, L160 (S2-15). |
| 21 | HaX pays "the rest" at 06:00 except on the cold ending | Accept | Agrees with m09 (§4). |
| 22 | Clue 3 is the cloner record | **Modify** | Give "who packed the case" a recoverable source and pin the kit check's time span (S2-04); explain the service-door camera (S2-02). |
| 23 | The silent door's decision ("Manual.", the crank) | **Modify** | Good. Write the Arakawa knock-ons (S2-06). |
| 24 | Guard the arrested branch | Accept | Matches m08's own credit guard (erb:194). |
| 25 | No countdown engine feature; objects read a global | Accept | Per ruling. |
| 26 | The cracker in m10's start kit | Accept | Per ruling. |
| 27 | WREN's tasking and one goal | Accept | Per ruling. m09's change 8 row must be rewritten to match (S2-19). |
| 28 | Netherton and Tesseract speak | Accept | |
| 29 | The casualty-sheet copies | Accept | Agrees with m09 L278. |
| 30 | Quintero holds the outer lock | **Modify** | Add who stands at the lock, and who takes the weapon on the executed ending, when Quintero is wounded or sent back (S2-08). |
| 31 | Exchange 3's rebuttal; record lines after the offer; the Alpha-tapes slot | **Modify** | The Alpha answer must be about his notes, not his voice, and one export name across both missions (S2-11). |
| 32 | Vos's trade; Ghost's "unanswered" branch | Accept | |
| 33 | The closing card is five lines at most | **Modify** | Keep the cap, and give every promised epilogue payoff a guaranteed home (credits outcome clauses, two phone texts, Netherton's $12.8M line) (S2-05). |
| 34 (new) | m10 runs about 105 minutes, ceiling 110 | – | FA §1.3, §8 r6; stage 0 §1 and L200 (S2-15). |
| 35 (new) | The WREN fact is told to the player privately; the team is in view, out of earshot | – | FA §4.0, row 117 (S2-01). |
| 36 (new) | The service door's camera is a dummy (or faces the road) | – | FA §4.4 clue 1, §6.2 flag 1 (S2-02). |

## 6. Engine plausibility list for stage 5

Things the beats assume, for stage 5 (and 9) to confirm or replace. List only.

1. **Countdown objects** (one per main-path room) whose displayed text follows a story-beat global, including "PAUSED", "EARLY ACCESS: RELEASED" and the post-06:00 Join run. Confirm an object's readable text can switch on a global.
2. **Objects shown or hidden by imports at `game_loaded`**: the duty-board props, the rota sheet, Static's kit, the media room's drafted story, the "posts unmanned" memo, the fence gap.
3. **Companions staged per room with `setVisible`**: Quintero, Arakawa, Kowalczyk, Vector (at his door, then the forward post), Nightshade on the tether at the blast door, Gary in the workshop, Voltage at the power room; one covering line each.
4. **Phone NPCs that ring on room entry** and interrupt: Ghost in the security office, arrested Victoria in the server hall.
5. **HaX unreachable for one room** (the gallery jam), and one room earlier if Malhotra is sent back.
6. **Accusation plumbing**: a face-to-face three-beat ink and an on-the-line route through HaX's hub, each setting globals and hiding the accused; the recall restoring a function "from the next room"; a held, knocked-out raid member still accusable.
7. **The blast door** that opens for the player by event with their designation on the panel, and a second unlock (the crank) that sets a different global.
8. **The tripwire**: an already-passable door that locks on an event and is reopened remotely from the security office.
9. **The alarm-panel override** and **Wendell's call**: guards switched to non-hostile or alerted by a global.
10. **Vector's sealed door** opened by an NPC beat.
11. **The gallery gated on flag 3** (S2-07).
12. **Start inventory**: Kowalczyk's cracker, with a description that varies by branch (given in m09, or this morning).
13. **Tesseract** non-hostile, KO-proof, seated; a bark then a different chat opening; idle lines on events the game can see (S2-17).
14. **WREN's entrance at the core**: an NPC made visible and hostile while the player is mid-sequence with Tesseract; a knock-out fight in the same room as a non-hostile NPC; Quintero's arrival and wounded state.
15. **The release key**: a console object with its own confirmation that alone sets `ending = joined`.
16. **The cold choice**: a two-step ink choice that sets `ending = executed`.
17. **Points-landed counter** in ink driving music track switches on `global_variable_changed`; silence (gallery, executed, Scorched Earth) needs a silent track or a stop event.
18. **Cutscenes with choices**: the briefing (stance on Quintero, question hub), the 06:00 frame (the walkabout hub), Scorched Earth's purge (lights out, doors cycling), the Join walk-out, the executed aftermath.
19. **Conclusion order**: `bond_visualiser`, then the closing card, the teaser slot behind `teaser_enabled`, then the credits roll with per-branch "In this operation" lines (and outcome clauses, S2-05).
20. **Phone texts during a cutscene** (Ghost's message, the Recruiter's line), if S2-05's fix is taken.
21. **Imran's phone** as an item the player can take, carrying the supplier contact.
22. **Exports**: `ending` (six values), `database_outcome`, `sleeper_caught`, `wrong_accusation`, `head_start_out`, `partial_release`, `media_story_ran`; the import of `m09_sleeper_shortlist` and the Alpha-tapes global.
23. **Validator warnings by design**: one per R/P import (FA §3), signed off at stage 8.

## 7. Verdict

**Not clean: another round needed** (0 blockers, 5 majors, 14 minors).

Round 1's work holds. The blocker is gone: the head start now goes at the outer lock and every gallery decision is in time. The arrested-Nightshade guard, Phantom's rewiring, the silent door's decision, accusations on the line and the countdown objects are all in the text. The core sequence and the six endings are reachable and distinct, every import has a beat, and m09 and m10 agree on Quintero, the promise, "Ninety-nine", `recruiter_secret` and the casualty-sheet copies.

Four of the five majors are in the whodunit, the thread round 1 rebuilt most. In the order to fix:

1. **S2-01**: Netherton tells the team, WREN included, that WREN is among them. Make it a private aside.
2. **S2-02**: the service door has a camera, and flag 1 gives the cameras. Make it a dummy.
3. **S2-03**: "she took the door end" plus clue 1 already names her, and Nightshade foretells the split. Make the fork indecisive and his line playbook.
4. **S2-04**: clue 3 rests on an unremarked cutscene detail. Give "who packed the case" a source the player can go back to.
5. **S2-05**: about a dozen promised epilogue payoffs share five walkabout slots and one card line. Give them homes in the credits and two phone texts.

None needs a redesign: each is a line, a prop or a staging note. The minors are wording, sweeps and knock-ons, and can be folded in at the same pass.
