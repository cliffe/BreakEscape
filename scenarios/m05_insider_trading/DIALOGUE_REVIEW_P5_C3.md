# m05 Insider Trading: dialogue review, pass 5 cycle 3 (confirmation)

Reviewer: fresh Opus, read-only, 2026-10-13. Skill: `npc-dialog-review`. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M05_PASS_BRIEF.md`). Inputs: `DIALOGUE_REVIEW_P5_C2.md` and the "Phase 4 dialogue, cycle 2" entry in `IMPROVEMENT_LOOP_LOG.md` (fix commit `fbe1c0eb`). The ink in the working tree is identical to that commit, and only `scenario.json.erb` has uncommitted changes, which belong to the room-dressing agent. Line numbers below are HEAD's. I didn't open the SecGen XML or the four listed field guides, and I made no VM-side claims.

Finding ids are `D5C3-n`. **Counts: 0 blockers, 0 majors, 6 minors.**

## Step 1: compile, routes, lint, runtime, validator

All outputs are in the session scratchpad, `m05-dialogue-c3-review/`.

- **Compile to scratch.** I ran `bin/inklecate -o <scratch>/json/<file>.json` on all ten files, which is the compile step of `scripts/compile-ink.sh` without writing into the repo. There were no errors and no loose-end warnings, and every scratch JSON is identical to the committed JSON, so the routes ran against exactly this ink.
- **Routes, all 38** (`route.js`): every one ends `[result] all expectations met`. The longest run without a choice is **9** (r12, r13, r16, r29, r30), within the limit. The `FAIL`/`error` grep hits are all dialogue text ("never once failed me", "throws an error").
- **dialoguelint:** 0 errors, and only the two known, allowed findings (Recruiter L86 `you-after-choice` on the non-verbal "Say nothing", L363 `not-x-but-y`, the villain's one use).
- **reopencheck:** total problems 0. HaX, the Recruiter and Patricia's phone each ran 1800 reopens with 0 problems.
- **tagdiff against HEAD:** structure unchanged in all 10 files. Against `fbe1c0eb~1` there are 17 structural differences (11 in the debrief, 6 in Halloran), and each matches a logged C2 change: the D5C2-13, -7, -10, -3 and -1/-17 conditions, and Halloran's split "[It's David.]" choice (D5C2-6). Every other file changed prose only.
- **loopcheck**, 38 states, no runtime errors: every file at its declared `currentKnot` (`start`); Patricia, Owen, Halloran and Lisa at `start` under each of the five fates with `torres_identified`; the debrief on lethal (sympathetic, trust 90), lethal (hardline, trust 40), arrest with the deal after a wrong accusation (cautious), arrest without the deal after a wrong accusation (diplomatic, no offer), subdued (trust 55), exposure and turned (trust 75); Torres with the deal.
- **Validator** (`--skip-ink --no-graph`, so it doesn't rewrite files someone else is editing): the schema passes. The same 12 same-pattern notes on HaX's mappings and the same `object_interacted` timed-text pair as cycle 2. The credits notes (sections with only conditional entries) aren't dialogue-facing, and none of them is new. One credit line has the D5C2-13 gap (D5C3-5).

## Confirmation of cycle 2 (D5C2-1 to D5C2-32)

I checked every one against the ink at HEAD, not against the log. 31 are closed and one was declined. One closed fix brought in a new contradiction (D5C2-18 → D5C3-1).

| # | Status | Where it now lives | Judgement |
|---|---|---|---|
| D5C2-1 | closed | debrief :781, :788-807 | Closed, and the fixer went further than the review. On `combat_lethal`, "[Did I get him right?]" gets "You know the answer to that.", a sympathetic player hears "Then you left him on the floor.", and every player hears "The job got done. I'm still deciding about the rest." The trust line no longer praises over a death (r29). HaX holds her verdict to the end. Right call |
| D5C2-2 | closed | debrief :357, :363 | As proposed. "Two in the morning, week after week" fits the badge log (three of the four pairs fall between 01:46 and 01:59, over a fortnight) |
| D5C2-3 | closed | debrief :759-761 | The line is now only on `combat_nonlethal`. r29 and r3 no longer say "slow way" |
| D5C2-4 | closed | Patricia :189; Owen :130 | Neither asks a question now. Patricia's new number causes D5C3-2 |
| D5C2-5 | closed | Lisa :110 | "Someone's" in place of "Patricia's" is a good catch, since Lisa's ink has no `patricia_ko` |
| D5C2-6 | closed | Halloran :183, :186 | Only one of the two choices shows at a time (tagdiff; r34, r38) |
| D5C2-7 | closed | debrief :221-222, :240-241 | The extra fix on the diplomatic branch was right. KOs still come first |
| D5C2-8 | closed | debrief :265-266 | The choice is fixed. The reply now repeats :199 on one route class (D5C3-4) |
| D5C2-9 | closed | debrief :616 | As proposed |
| D5C2-10 | closed | debrief :451, :593 | As proposed. r3 no longer says "forty-seven" in the debrief |
| D5C2-11 | closed | Torres :491 | "Somebody always finds the name." then "They're eight and eleven." can only mean the children (r37) |
| D5C2-12 | closed | Torres :233 | As proposed. "Me." now comes from Torres (:480) |
| D5C2-13 | closed in the ink | debrief :206-215 | The credit line has the same gap (D5C3-5) |
| D5C2-14 | closed | debrief :768, :771 | "Somebody pays the Architect, too." follows :740 well and sets up m06's opening (`m06_opening_briefing.ink:25`). "Torres knows where his came from" leaves "money" understood, and it calls back his own "Where the money comes from" (Torres :347). Fine |
| D5C2-15 | closed | debrief :208, :224, :342 | "File" is down to 2 or 3 per route. "Report" now appears four to six times on r31, but it mostly means one thing, the player's report, and :695 "Your report doesn't mention the Recruiter's call" pays it off. No finding apart from :266 (D5C3-4) |
| D5C2-16 | closed | debrief :729 | As proposed |
| D5C2-17 | closed | debrief :801-806 | The 50-69 band prints nothing, so the tail is "Ask me in a year.", then the stance line, then "Go home." |
| D5C2-18 | closed, new contradiction | Halloran :152 | The twin is gone, but the new line contradicts Owen :128 on the same ending (D5C3-1) |
| D5C2-19 | closed | Patricia :194, :557 | As proposed |
| D5C2-20 | closed | Torres :550-557 | Right, including the extra cut. After "nothing to say to you" (r38) he says one line. On the deal path, "Elena gets her treatment. That's all I asked for." answers "Just... Elena. Please." (:349) |
| D5C2-21 | closed | Patricia :509; phone :257 | As proposed |
| D5C2-22 | closed | Patricia :554; phone :287 | As proposed. Both are gated on `not door_log_reasoned`, so no route hears the admission twice |
| D5C2-23 | closed | HaX :525 | "All four nights" matches the log's four Torres-then-spare pairs (erb `door_log_text`) and Halloran's "Four times." (:171) |
| D5C2-24 | closed | HaX :379 | As proposed |
| D5C2-25 | closed | HaX :773, :785 | The "carrying" repeat is gone. "You've read his file" is literally true only on some routes (D5C3-6) |
| D5C2-26 | closed | HaX :338 | "Forget how it sounded" avoids the X-not-Y shape. Better than the review's wording |
| D5C2-27 | closed | Recruiter :395 | The only divert into `end_contact` is :310, on the ring-back. As proposed |
| D5C2-28 | closed | debrief :343 | As proposed |
| D5C2-29 | **declined** | Owen :176+:184 and the six other pairs | **Acceptable.** The cycle-2 reviewer marked it optional polish. Every popup still lands on a spoken line (Owen :179/:186, for example), which is what the README asks. Folding the pairs would touch the thresholds in seven knots for a cosmetic gain. Leave it open as polish, not a blocker to closing |
| D5C2-30 | closed | briefing :38 | "[Bought with what?]" is better than the review's wording, because a second "who" choice would have doubled "[Then we find out who sold.]". Netherton's "That is what you are going to tell me." lands |
| D5C2-31 | closed | briefing :315 | "And keep Patricia on side. You'll need her doors." is new information. Patricia is introduced at :234 on every route |
| D5C2-32 | closed | briefing :25 | Cut. Netherton's :29 is now the first to say it |

## Severity table

None of these touches a global, a task, a gate or a condition, except D5C3-5, which is a credit condition in the erb. All six are wording.

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5C3-1 | minor | `m05_npc_dr_halloran.ink:152` against `m05_npc_owen_gallagher.ink:128` | **New in C2 (from D5C2-18).** On the exposure ending, Halloran says "David left his badge on my desk on his way out. No note." Owen says "David's badge just went out the front door. Thought you'd want to know." The badge can't be on her desk and through the exit reader at once (the log records exits, erb :86). A player who visits both after the exposure hears the contradiction. r37 doesn't visit Owen, so no route caught it. | Halloran :152 → `Dr Ruth Halloran: David put his head round my door on his way out. He said thank you, and went.` It makes a contrast with Lisa's "He didn't even look at the tin." (:112) without twinning it. Update r37's quote. |
| D5C3-2 | minor | `m05_npc_patricia_morgan.ink:189` against `m05_closing_debrief.ink:481, 484` | **New in C2 (from D5C2-4).** On the lethal ending, Patricia says "I'll give him ten minutes, then I'm sending someone down." The debrief says "Nobody found him until Patricia went looking, forty minutes later" and "twenty minutes would have been enough". A player who walks straight from the data centre to Patricia (the natural move, since she said "call me") has heard her promise to send someone within about fifteen minutes of the fall, so the debrief's timeline doesn't add up. | :189 → `Patricia Morgan: Torres hasn't come up from the data centre. I'll go down myself once the CEO's off my phone.` No number, and it explains the forty minutes through the CEO thread the mission already runs (her greeting "The CEO's prowling.", :194). Update r34's quote. |
| D5C3-3 | minor | `m05_npc_patricia_morgan.ink:185` against `m05_npc_dr_halloran.ink:150` | Older than C2, and neither earlier cycle caught it. On the arrest ending each NPC speaks once, on the first reopen, so the order the player visits decides the timeline. r38 visits Halloran, who says "The police have David.", then Patricia, who says "Police are on their way up." The police have him before they've arrived. | :185 → `Patricia Morgan: The police are with him now. I gave them the side door. Nobody in this building needs to watch.` This holds in any order with Owen's "There's police on the stairs" and Lisa's propped side door. r38's quote "I've given them the side door." becomes "I gave them the side door." |
| D5C3-4 | minor | `m05_closing_debrief.ink:266` against :199 | On routes with `halloran_accused` and `case_strength() >= 7` (r31), HaX says "It went through an innocent woman on the way, and that's in it too." Seven lines later the player says "[That one's on me.]" and she answers "Yes. It's in the report, next to your name." The same fact twice: the wrong accusation is on record. | :266 → `Agent HaX: Yes. Dr Halloran will want to hear you say it.` It leads straight into :295 ("She's lodged a complaint, and she's right to.") and pays off Halloran's own "I'll want an apology from you. Not tonight." (Halloran :302/:304). Update r31's quote. |
| D5C3-5 | minor | `scenario.json.erb:217` (credits, "QUANTUM DYNAMICS") | D5C2-13 fixed the debrief but not the credits. On r3 (no vetting file, no stand-down email) the debrief now says "Nobody asked who told Patricia to stop looking." The credits still print "WHO STOPPED THE INTERVIEW — never asked", about an interview this player never heard of. | Split the entry: keep the text with `"condition": "!globalVars.found_stand_down_email && globalVars.found_vetting_file"`, and add `{ "text": "WHO TOLD SECURITY TO STOP — never asked", "style": "warning", "condition": "!globalVars.found_stand_down_email && !globalVars.found_vetting_file" }`. The room-dressing agent is editing the erb, so make one small, exact Edit after re-reading the region. |
| D5C3-6 | minor | `m05_phone_agent_0x99.ink:773` | **New in C2 (from D5C2-25).** "You've read his file." The moral board is reached through `has_motive()`, which is the medical bills, the journal or the vetting file (:104-105). A player who has only the journal or the bills hasn't read a file, and "file" is the word D5C2-15 was cutting. | `You know his reasons now. I won't tell you what he deserves.` Update r36's quote. |

## Fresh read of the changed lines

**The lethal ending.** This is now the strongest stretch of the debrief. "David Torres is dead." / "The pathologist thinks twenty minutes would have been enough." / "You know the answer to that." / "The job got done. I'm still deciding about the rest." She doesn't comfort and she doesn't lecture. For a sympathetic player, "You went looking for the man underneath. Then you left him on the floor." turns the stance line against the player, which is the right instinct. In the building, the dramatic irony works: Halloran rings him, Lisa sees his coat, Owen watches the badge. Halloran's post-fate "[It was David. I'm sorry.]" then "What happens to him now?" / "[It's out of my hands now.]" / "It was never in yours. Mine, maybe." is painful in the right way on this ending. The one slip is Patricia's number (D5C3-2).

**Contradictions between NPCs.** I walked the four fate reactions on every ending against each other and against the debrief. Exposure: Halloran and Owen disagree about the badge (D5C3-1). Arrest: the timeline depends on visit order (D5C3-3). Subdued: consistent. Patricia's car park, Owen's stairs, Lisa's side door and Halloran's "The police have David" all fit, because the police have him by the time anyone notices. Turned: consistent ("gone home" from Patricia, Lisa and Halloran's Monday). Lethal: consistent apart from D5C3-2. Owen's "an hour ago" fits the debrief's forty minutes.

**Choices that don't answer what was asked.** I checked every choice C2 added or reworded against each route into it. "[That one's on me.]", "[QDC won't like seeing that in my report.]", "[Bought with what?]", "[What ENTROPY did to him. Help me think it through.]", the Torres exposure pick and his softer follow-up, and Halloran's two David choices each answer the line before them. "[Same hand as the other cells?]" now gets its answer.

**Repetition.** The cycle-2 repeats are gone: the badge log, the slow way, money, "file", "carrying", "reasonable", "Go on". "Report" took over some of the "file" load but stays readable (see D5C2-15). The one new same-fact repeat is D5C3-4. Across the building, three of the four hub greeting cycles still contain a "Go on" variant (Halloran "Go on, so.", Lisa "Go on.", Owen "Go on. I'm half listening."). These are separate NPCs, so it isn't worth a finding.

**Voice.** Patricia's new lines ("Then go.", "I sign that log off every Monday, and I never once read the front door.") sound like her. Torres' "Somebody always finds the name." and "That's all I asked for." suit a man who has stopped arguing. HaX's "Checked. All four nights." is drier and better than the echo it replaced.

## Verdict

**The dialogue stage can close on the review side: this round found nothing above minor.** All 32 cycle-2 findings are accounted for (31 closed, D5C2-29 declined acceptably), and every static check passes: compile, 38 routes with a maximum run of 9, lint, reopencheck, tagdiff, loopcheck and the validator. The six minors are one-line wording changes, plus one credit condition. They can go in a short fix pass without another review cycle, as long as the routes are re-run with the five updated quotes (r31, r34, r36, r37, r38). It would also help to add an Owen visit to r37, so D5C3-1 is covered by a route.

The stage's close rule also asks for a browser check. I didn't run one (no browser sessions were allowed), so the browser checks still open in the log remain the orchestrator's: the debrief beats on two endings, the lethal close, Patricia's naming with a close and reopen on "...Damn.", a fate reaction and Halloran's post-fate choice in a person-chat, HaX's flag choice with two flags waiting, and the Recruiter's hang-up and ring-back.

## Spoken lines this review would change

All of these are new this pass or uncached, so re-voicing costs almost nothing.
- Halloran :152: "David left his badge on my desk on his way out. No note." → "David put his head round my door on his way out. He said thank you, and went."
- Patricia :189: "Torres hasn't come up from the data centre. I'll give him ten minutes, then I'm sending someone down." → "Torres hasn't come up from the data centre. I'll go down myself once the CEO's off my phone."
- Patricia :185: "Police are on their way up. I've given them the side door. Nobody in this building needs to watch." → "The police are with him now. I gave them the side door. Nobody in this building needs to watch."
- Debrief :266: "Yes. It's in the report, next to your name." → "Yes. Dr Halloran will want to hear you say it."
- HaX :773: "You've read his file. I won't tell you what he deserves." → "You know his reasons now. I won't tell you what he deserves."

Not voiced: the credit line in the erb (D5C3-5).
