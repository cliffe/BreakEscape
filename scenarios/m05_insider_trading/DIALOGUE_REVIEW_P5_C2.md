# m05 Insider Trading: dialogue review, pass 5 cycle 2

Reviewer: fresh Opus, read-only, 2026-10-13. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission judged as a TV spy thriller (`docs/agents/M05_PASS_BRIEF.md`). Inputs: `DIALOGUE_REVIEW_P5_C1.md` and the cycle-1 entry in `IMPROVEMENT_LOOP_LOG.md` (commit `ee4fb9e5`; the erb's removal of `torres_fate_by_phone` is still uncommitted in the working tree). I didn't open the SecGen XML or the four listed field guides.

Finding ids are `D5C2-n`, tagged **blocker / major / minor**. Every fix is mission-local wording or a one-line condition in the ink.

## Step 1: compile, validator, lint, runtime

All run by me, into `scratchpad/m05-dialogue-c2-review/`.

- **Compile to scratch.** `bin/inklecate -o <scratch>/json/<file>.json` for all ten files: no errors, no loose-end warnings. Every scratch JSON is identical to the committed JSON, so the routes test exactly this ink.
- **Routes, all 36** (`route.js`): every one ends `[result] all expectations met`. The longest run without a choice is 9 (debrief, r29 and r30). Transcripts are kept in the scratch folder.
- **dialoguelint:** 0 errors. Two known, allowed findings: Recruiter L86 `you-after-choice` (the non-verbal "Say nothing") and L363 `not-x-but-y` (the villain's one use).
- **reopencheck:** total problems 0. m05's HaX, the Recruiter and Patricia's phone each ran 1800 reopens with 0 problems.
- **tagdiff `--old`** against the cycle-1 snapshot, file by file: debrief 53, briefing 4, Halloran 30, Lisa 28, Owen 25, Patricia 64, HaX 65, Recruiter 11, Torres 5, Patricia's phone structure unchanged. Total 285, matching the log. I read the debrief, Recruiter, Torres and Owen diffs line by line, and every difference matches a logged change (new knots `bar_reaction`, `cells`; `header_said`; beat choices; the D5-5 ring-back diverts; the D5-22 choice; `fate_noted` and `final_choice`; influence tags; dead VARs removed). Against HEAD, the structure is unchanged in all ten files.
- **Validator** (`--skip-ink --no-graph`): schema passes. The same 12 same-pattern notes on HaX's mappings and the `object_interacted` text pair as before. Nothing new.
- **loopcheck** on the post-fate states cycle 1 added (Patricia, Halloran, Lisa and Owen at `hub` after each kind of fate; the debrief on the lethal path and on the deal-taken path; Torres at `start`; HaX's hub with flags and Torres topics open): no runtime errors.
- **D5-6 mechanically:** every `influence +=` / `-=` is followed by its tag, except Halloran :77 and Lisa :55. Both are deliberate, because the next knot's own tag lands on the same line (logged).
- **D5-30 mechanically:** `recruiter_persuasion_attempted` and `torres_fate_by_phone` appear nowhere in the ink, the erb or `missions.json`. The four unread VARs are gone.

## Confirmation of cycle 1 (D5-1 to D5-36)

All 34 open findings are closed in the ink (D5-29 and D5-34 were folded by the cycle-1 reviewer; D5-35 needed no change). I checked every claim against the file and line, not the log. Where the fixer's wording departs from the review, my judgement is in the last column.

| # | Status | Where it now lives | Judgement on any departure |
|---|---|---|---|
| D5-1 | closed | debrief `bar_reaction` :252, portal beats :323-332, deal beat :596-600, exposure beat :643-648, `cells` :713-719, `final_reflection` :761-765. Max run 9 on every route | "Nine per cent to spare" is better than the review's "of room" and fixes its sum (91 per cent). "Ask me in a year." beats the review's "Not X. Y." reply. The court reply "What he told us stays with us" corrects the review's canon slip. The sixth (exposure) beat was right: "It already has." is one of HaX's best replies. Two side effects: the deal beat leaves :601 dangling (D5C2-9), and the lethal reply "You know the answer to that." is then softened by the stance line (D5C2-1) |
| D5-2 | closed | hub :167-216, `flag_news` :351, `about_torres` :376 | Sound. Keeping the old board label avoided one repeat but created another: "I need to talk about Torres." then "…I need to talk it through." (D5C2-24) |
| D5-3 | closed | Patricia :422, :443-458; phone :198, :212-224; HaX :507, :521-527 | "I sign that log off every Monday. I never once read the front door." is the best line the cycle added. HaX's reply restates the player's line (D5C2-23) |
| D5-4 | closed | `significant_reaction` :501, `significant_orders` :512 | Right fix. The second reply loses the tablecloth (D5C2-21) |
| D5-5 | closed | Recruiter :301-310; debrief :671 | "Then we're done. I'll close your file." is better than the review's line. One contradiction is left in the same knot set (D5C2-27) |
| D5-6 | closed | all four person-chats | The no-double-tag rule is right. See D5C2-29 for popups that land two lines apart |
| D5-7 | closed | HaX :243, :272, :773-781 | Closed. HaX no longer lectures. Some new phrasing repeats itself (D5C2-25) |
| D5-8 | closed | Patricia :176-195, Owen :119-136, Halloran :143-160, Lisa :102-119 | Going beyond the review to give all four a line was right, and the lethal set is the strongest new material in the cycle. Three details need fixing: Patricia asks a question the player can't answer (D5C2-4), Lisa's police contradict Patricia's side door (D5C2-5), and Halloran's "It's David." can follow her own "The police have David." (D5C2-6) |
| D5-9 | closed | Recruiter :113, :119, :176, :207, :218, :342 | As proposed |
| D5-10 | closed | Torres :282-283 | As proposed. "She told me I was the only one." works |
| D5-11 | closed | Halloran :277-279 | As proposed |
| D5-12 | closed | HaX :934 | As proposed |
| D5-13 | closed | Torres :106; HaX :468; Patricia :552; phone :287; debrief :287 | "I thought I had until the server gave me up" is good. Patricia's late reply is weaker than her admission (D5C2-22) |
| D5-14 | closed | HaX :148, :154 | As proposed |
| D5-15, D5-17 | closed | `flag_news` :359, :371 | Folded, as proposed |
| D5-16 | closed | HaX :264 | As proposed |
| D5-18 | closed | debrief :326, :330 | Correcting Owen's "asked for the budget twice" was right. "Clean file" adds to a word the debrief already overuses (D5C2-15) |
| D5-19, D5-20, D5-21 | closed | debrief | Only :680's "One more thing." remains. The summing-up line is gone |
| D5-22 | closed | Torres :490-492 | Right idea. The reply's "They" collides with the next line (D5C2-11), and the choice now contradicts the exposure pick (D5C2-12) |
| D5-23 | closed | Torres :172 | As proposed |
| D5-24 | closed | Recruiter :142, :148 | As proposed |
| D5-25 | closed | Owen :293-297 | "Password's not going anywhere. Neither am I." is better than the review's |
| D5-26 | closed | Owen :221-225 | Better than the review's, because it ties to the pencilled note on the badge log |
| D5-27 | closed | phone :296-297 | As proposed |
| D5-28 | closed | briefing :38-42 | The first choice echoes Netherton's own question (D5C2-30) |
| D5-30 | closed | see Step 1 | As proposed, and the erb comment was updated |
| D5-31 | closed | briefing :286, :291 | :291 now doubles :315 (D5C2-31) |
| D5-32 | closed | Recruiter :130 | As proposed |
| D5-33 | closed | Halloran :306 | As proposed |
| D5-35 | no change | — | Agree: one "Duw" would be the only Welsh word in the mission |
| D5-36 | closed | Recruiter :327 | As proposed |

## Severity table

Counts: **0 blockers, 1 major, 31 minors.** No lint finding was withdrawn. None of these changes a global, a task or a gate. D5C2-10 and D5C2-13 change one condition each; everything else is wording.

### Major

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5C2-1 | major | `m05_closing_debrief.ink:766-771` (heard after :762) | On the lethal ending, the player asks "[Did I get him right?]" and HaX answers "You know the answer to that." The next line then praises the player's stance. Hardline: "You never let him hide behind his story. Cold, maybe. But you saw it clearly." (r29). Sympathetic: "You went looking for the man underneath. That mattered, whatever you decided in the end." Coming just after "The pathologist thinks twenty minutes would have been enough", both read as consolation. This is the last judgement on the game's hardest ending, and it softens what the rest of the path holds firm. | Wrap the two stance blocks in `{final_choice != "combat_lethal": … }`. On the lethal ending, "You know the answer to that." (or "I know. I read the report.") then goes straight to the trust line, "The job got done. I'm still deciding about the rest." Optional: give the lethal path its own stance line, `{confront_stance == "sympathetic" and final_choice == "combat_lethal": Agent HaX: You went looking for the man underneath. Then you left him on the floor.}` |

### Minors: the debrief

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5C2-2 | minor | `m05_closing_debrief.ink:344, 350` against :287 / :291 | The same fact twice on nearly every route. `the_night` says "Her spare on the server hallway, his badge on the front door six minutes before, every night." (or "Its front-door lines had him all along."). Six to eight lines later the training-file sign says "His badge at the front door at two in the morning, and a borrowed one on the server hallway." (r1, r2, r29, r30, r31). | For `found_door_log`, make the sign about the warning signal, not the log: :344 → `Agent HaX: Hours. Two in the morning, week after week, and nobody asked why.` and :350 → `Agent HaX: For the training file: hours. Two in the morning, week after week, and nobody asked why.` Keep the incident-log variants (:346, :352). |
| D5C2-3 | minor | `m05_closing_debrief.ink:742-743` against :507 and :577-579 | The same fact twice on the lethal and no-deal endings. Lethal: "We're mapping it the hard way now." (:507), then eight lines later "We'll map the Initiative the slow way. Harder, but doable." (r29). No deal: "Without him, we're blind on the Initiative…" (:577/:579), then the same "slow way" line (r3). "Blind" and "doable" also pull against each other. | Narrow :742 to `{final_choice == "combat_nonlethal":`, the one path that hasn't already said it. |
| D5C2-7 | minor | `m05_closing_debrief.ink:213-218` | On a wrong-accusation route with `cautious`, HaX says "It went through an innocent woman on the way" and then "You said you'd be methodical. The file says you were." (r31). Naming the wrong woman wasn't methodical. | Add a first branch inside the cautious block: `{halloran_accused: Agent HaX: You said you'd be methodical. Most of the night, you were.` then the existing `- case_strength() >= 6:` / `- else:` branches. |
| D5C2-8 | minor | `m05_closing_debrief.ink:253-254` | HaX has just said "When Security moved on Dr Halloran, he brought the upload forward", and the choice says it straight back to her: "[One region. Because I named the wrong person.]". | Choice → `[That one's on me.]`. Reply → `Agent HaX: Yes. It's in the file next to your name.` |
| D5C2-9 | minor | `m05_closing_debrief.ink:601` | After either deal beat, "Less than a double agent would give us. A good deal more than nothing, and clean." has no subject. After "The court sees him without it." (r31), or after the line about the children (r2), it reads as if the court or the family is "less than a double agent". | `Agent HaX: What he gave us is less than a double agent would. A good deal more than nothing, and clean.` |
| D5C2-10 | minor | `m05_closing_debrief.ink:437, 579` | "Not all forty-seven" and "The forty-seven stay in the pipeline" assume the player has heard the number. A player who ignored the Recruiter's text and never opened the envelope hasn't (r3: `recruiter_deal_offered` false, `found_pipeline_list` false; the only other "forty-seven" in that run is the $847,000). The briefing number (:173) is on an optional branch. | :579 → `Agent HaX: Without him, we're blind on the Initiative. The placements carry on, and so does TalentStack's recruiting.` :437 → `{recruiter_deal_offered: …Not all forty-seven, but it's a start.\|He's met some of the Recruiter's other candidates. It's a start.}` |
| D5C2-13 | minor | `m05_closing_debrief.ink:209` | "Nobody asked who cancelled Patricia's interview." The interview appears only in the vetting file (erb :1775). A player who never read it doesn't know there was one. Every player can hear that Patricia was stopped (her :119, Owen :101). | `{found_vetting_file: Agent HaX: QDC's readiness review passed. Nobody asked who cancelled Patricia's interview.\|Agent HaX: QDC's readiness review passed. Nobody asked who told Patricia to stop looking.}` |
| D5C2-14 | minor | `m05_closing_debrief.ink:722-724, 749, 752` | Money, five times in six lines: "pays them like one", "$847,000 for this job alone", "Every one of these operations has been paid for by someone", "follow the money", "how TalentStack paid him" (r1, r31). :749 is also ambiguous: right after "the Architect … pays them", "paid for by someone" could mean the cells or the Architect. | :749 → `Agent HaX: Somebody pays the Architect, too. Next, we follow the money.` (sets up m06 without repeating the cells' pay). |
| D5C2-15 | minor | `m05_closing_debrief.ink:197-224, 254, 330, 339, 646` | "File" six times on r31 before the Torres section, in two senses: SAFETYNET's case file and the CEO's "clean file". | :330 → `…The CEO wanted a clean audit more than a safe one.` :215 → `Agent HaX: You said you'd be methodical. You were.` |
| D5C2-16 | minor | `m05_closing_debrief.ink:713-714` | "[Same hand as the other cells?]" goes straight into a list of cell names with no answer to the question. It reads as if HaX didn't hear it. | In the choice body, before the divert: `Agent HaX: The same hand.` |
| D5C2-17 | minor | `m05_closing_debrief.ink:777` | With `handler_trust` 50–69, the tail runs player beat, stance verdict, then "You made hard calls, and you made them yourself.", a second verdict that says nothing (r1, r2). The ≥70 and <50 lines carry real information. | Cut the 50–69 line, so that branch prints nothing. "I know. I read the report." or "Ask me in a year." then leads into the stance line and "Go home." |

### Minors: the building's reactions (D5-8) and Patricia

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5C2-4 | minor | `m05_npc_patricia_morgan.ink:189`; `m05_npc_owen_gallagher.ink:130` | On the lethal ending, Patricia asks "Torres hasn't come up from the data centre. Should I be sending someone down?" and the hub offers no answer. The player's options are her topics and "[That's everything for now. I'll keep you posted.]", which gets "Do. I don't like surprises." Owen's "Should I be worried?" has the same problem. Lisa's and Halloran's lines create the same dread as statements and don't need an answer. | Patricia → `Patricia Morgan: Torres hasn't come up from the data centre. I'll give him ten minutes, then I'm sending someone down.` (this fits the debrief's "Patricia went looking, forty minutes later"). Owen → `Owen Gallagher: David's badge went into the vault an hour ago. It's not come out.` |
| D5C2-5 | minor | `m05_npc_lisa_park.ink:109` against `m05_npc_patricia_morgan.ink:185` | Patricia: "I've given them the side door. Nobody in this building needs to watch." Lisa, on the same ending: "There are police in reception. Everyone's pretending not to look." The same branch also covers `combat_nonlethal`, where Patricia says the police came with the ambulance in the car park. | `Lisa Park: Patricia's had the side door propped open for ten minutes. Nobody will say why.` This fits both endings, and Lisa still reports only what she can see from the kettle. |
| D5C2-6 | minor | `m05_npc_dr_halloran.ink:182`, after :150 | On the arrest and subdued endings, Halloran's first reopen says "The police have David. Nobody's told me anything else." The hub then offers "[It's David.]", telling her what she has just said. | Gate the existing choice on `final_choice == ""` and add `+ {torres_identified and not told_about_torres and final_choice != ""} [It was David. I'm sorry.]` → `-> halloran_guilt`. Lisa's "[It's David. I'm sorry.]" and Owen's "[It's David. He's the one.]" read correctly after their fate lines, because neither has named him. |
| D5C2-18 | minor | `m05_npc_dr_halloran.ink:152` against `m05_npc_lisa_park.ink:111` | The exposure lines are twins: Halloran "David walked past my door with his coat on. He didn't look in." / Lisa "David just walked out in his coat. He didn't even look at the tin." The coat is also in Lisa's lethal line (:113) and Halloran's suspended greeting (:265). Lisa's version is the better of the two. | Halloran → `Dr Ruth Halloran: David left his badge on my desk on his way out. No note.` |
| D5C2-19 | minor | `m05_npc_patricia_morgan.ink:194, 349, 555` | "Go on" three times in one naming visit: the hub greeting "Go on." (first in the `{&…}` cycle), then at once "Go on, then. Who?", and later the farewell "Go on, then." On r16 the first two are adjacent lines. | Hub greeting: `{&What now?\|Yes?\|Quickly, now. The CEO's prowling.}`. Farewell :555 → `Patricia Morgan: Then go.` Keep "Go on, then. Who?", which is her best version. |
| D5C2-21 | minor | `m05_npc_patricia_morgan.ink:509`; `m05_phone_patricia.ink:257` | The second reaction reply and the phone summary keep "I sat three desks from him at the Christmas party" but drop "His kids drew on the tablecloth", which is the half that hurts. On those routes (r12 and others, every phone naming) the line is only a seating plan. | :509 → `Patricia Morgan: He's Ruth's. But I vetted him. His kids drew on the tablecloth at our Christmas party.` Phone :257 → `...Damn. His kids drew on the tablecloth at our Christmas party.` |
| D5C2-22 | minor | `m05_npc_patricia_morgan.ink:552`; `m05_phone_patricia.ink:287` | The late disclosure gets "...Every night. I should have seen that myself.", a weaker form of the admission the reason-menu route earns ("I sign that log off every Monday. I never once read the front door."). Most players with a full case only ever hear the weaker one. | `Patricia Morgan: ...Every night. I sign that log off every Monday, and I never once read the front door.` (phone the same without the prefix). Both are 18 words. |

### Minors: Torres

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5C2-11 | minor | `m05_torres_confrontation.ink:491` then :497 | "You can't. They'll find it. They always find it." is followed at once by "They're eight and eleven." Spoken aloud, the second "they" seems to point at the people who find names, so the hardest line in the exposure path loses its subject for a beat. | :491 → `David Torres: You can't. Somebody always finds the name.` Then "They're eight and eleven." can only mean the children. |
| D5C2-12 | minor | `m05_torres_confrontation.ink:233` against :490 | The exposure pick says "[I'm going public. The programme, the Recruiter, you. …]", and two lines later the new softer choice says "[I'll keep your name out of it if I can…]". The player names him, then offers to keep his name out. | Drop "you" from the pick: `[I'm going public. The programme and the Recruiter, from a source nobody can trace.]`. Torres' reply "You'd burn all of it. The Recruiter, the placements. Me." then has him draw the conclusion himself, which is stronger. |
| D5C2-20 | minor | `m05_torres_confrontation.ink:361` then :548-557 | Hand-over without the deal: "Then I've got nothing to say to you. I'll wait for them." The player pulls the drive, and he says four more lines ("How long will I get?" / "...No. That's for a court, isn't it. Not you." / "Elena will be dead before I get out."). His silence lasts one click. | Gate :550-551 on `elena_treatment_funded`, so the no-deal path gets only his last line: `Elena will be dead before I get out.` After "nothing to say to you", that single line is harder. |

### Minors: HaX, the Recruiter, influence

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5C2-23 | minor | `m05_phone_agent_0x99.ink:525` | The player says "His badge comes in the front door six minutes before her spare. Every night." and HaX answers "Six minutes, every night. That's the pattern.", which repeats it. Patricia checks the sheet and adds a new fact, so her echo works and this one doesn't. | `Checked. All four nights.` (then "Now find me why, and proof it's leaving." as now). The log has four Torres-then-spare pairs (erb :86). |
| D5C2-24 | minor | `m05_phone_agent_0x99.ink:192, 379` | Two player lines in a row: "[I need to talk about Torres.]" then "[What ENTROPY did to him. I need to talk it through.]" | :379 → `[What ENTROPY did to him. Help me think it through.]` |
| D5C2-25 | minor | `m05_phone_agent_0x99.ink:773, 785-786`; :757 | In `moral_sounding_board`, "You've read what he's carrying" (:773) is followed two lines later by "That's a lot to carry." (:786). Confrontation advice also uses "You've seen what he's carrying" (:757). "Each way you go writes a different ending for him" (:785) sounds like a game menu. | :785-786 → `Depends on what you do tonight. Whichever way you go, Elena lives with it too.` (one line; cut "That's a lot to carry."). :773 → `You've read his file. I won't tell you what he deserves.` |
| D5C2-26 | minor | `m05_phone_agent_0x99.ink:332, 338` | "Reasonable" twice in two lines: "making a bad trade sound reasonable" / "Ignore how reasonable she sounded." | :338 → `Of course she did. Weigh what it costs, not how it sounded.` |
| D5C2-27 | minor | `m05_phone_recruiter.ink:395` against :200, :289 | The Recruiter's ring-back opens "The offer doesn't improve with age", and her first hang-up line is "Time's short for both of us, then." If the player hangs up on the ring-back, she closes with "Think it over. I'm not in a hurry." That contradicts both, inside one call. | :395 → `Think it over. Quickly.` |
| D5C2-28 | minor | `m05_closing_debrief.ink:331` | "[QDC won't thank me for that part.]": "that part" points at nothing the player has said. HaX gave the account; the player hasn't claimed any of it. | `[QDC won't like seeing that in my report.]` Keep the reply "The board won't. Owen might." |
| D5C2-29 | minor (polish) | Owen :176+:184, :194+:203, :213+:222; Halloran :93+:101, :194+:202; Lisa :145+:152, :164+:174 | In seven knots, a base increase and a rapport bonus each carry a tag, so "+ Influence" pops twice within three lines, and a single neutral question ("Walk me through the network") can raise two. That follows the README rule. It also makes the popup cheap, when the bonus line itself is the reward. | No change needed to ship. If the fixer wants it: fold each pair into one change and one tag above the bonus line, e.g. Owen `ask_network`: `{owen_influence + 5 >= 15: ~ owen_influence += 10 … - else: ~ owen_influence += 5}`, keeping the thresholds the same. |

### Minors: the briefing

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D5C2-30 | minor | `m05_insider_trading_opening.ink:33, 38` | Netherton ends on "I want to know how." The new choice "[Bought a person how?]" asks him his own question, and his reply "That is what you are going to tell me." then answers a question he set. | Choice → `[Who sells out the 999 network?]`. Keep the reply, which now lands. |
| D5C2-31 | minor | `m05_insider_trading_opening.ink:291, 315` | On the aggressive answer, "Fast's fine. Sloppy isn't." is followed two lines later by "Move fast, but the police will still need a file they can use.", the same warning twice. | :315 → `Agent HaX: And keep Patricia on side. You'll need her doors.` |
| D5C2-32 | minor | `m05_insider_trading_opening.ink:25` | The narrator says "Before he ran the technical side, insider threat was his speciality." and Netherton says the same at once: "catching a mole is precisely his trade". Netherton's line is the m08 plant. The narrator's sentence only spoils its timing. | Cut the narrator's last sentence. (I checked: no later mission quotes either line.) |

## The script-editor pass: how it plays

I read the debrief end to end on six endings, from the route transcripts: deal (r2), lethal with every sign and four KOs (r29), exposure (r30), deal after a wrong accusation with a confession (r31), turned (r1), and no deal after a wrong accusation (r3). I also read Patricia's naming on four surfaces (in person with the reason menu, in person with a full case, both on the phone) and HaX's naming, the confrontation on every path, and each fate reaction.

**Pacing.** Cycle 1 fixed the debrief. It now plays as a conversation: a run of up to nine lines, a choice, a reply, and on again, and every ending gives the player a say before the Torres verdict. The beats are well placed. "How close was it?", "Who signs off on a number like that?" and "Did I get him right?" are the questions a player would actually ask. The tail is short. What drags now is repetition, not length: the badge log twice (D5C2-2), the slow-way line twice (D5C2-3), money five times (D5C2-14), "file" six times (D5C2-15). Cut those and the debrief tightens by four or five lines on most routes, with no structural work.

**Tone.** HaX holds her voice through the debrief: dry, factual, and leaving the verdict to the player. "It worked. This time.", "Ask me in a year.", "I know. I read the report." and "It already has." are all on model. One line breaks it, at the worst moment: the stance line after a lethal ending (D5C2-1). The Recruiter's moral ("the price was real, and he still took it") now stands alone, as cycle 1 intended.

**The deduction.** It now plays as drama. The player states the pattern, Patricia runs a finger down the sheet and finds it, and then she admits her own failure: "I sign that log off every Monday. I never once read the front door." That is the scene the mission is named for, and now it belongs to the player. Two things hold it back. Most full-case players reach the naming without the reason menu and only hear the weaker late reply (D5C2-22). And on HaX's surface the reply is an echo (D5C2-23). With a full case, the "...Damn." beat and "You knew him." / "His kids drew on the tablecloth." give the naming a human moment it lacked. The other reply, and every phone naming, drop the kids (D5C2-21).

**Fate reactions.** On the lethal ending they add up to the best new sequence in the cycle. Walk back through the building and Lisa asks if anyone has seen David, because his coat is still on his chair. Halloran has rung him twice. Owen sees his badge go into the vault and never come out. Patricia is about to send someone down. The player knows, and none of them do. Two of the four ask questions the player can't answer, and Patricia's matters because she has to act on it (D5C2-4). On the arrest ending they contradict each other about where the police came in (D5C2-5). Halloran's reaction can make the next choice redundant (D5C2-6). The turned-ending lines ("I'm told he's gone home. I'm told nothing else, and I'm not asking.", "Patricia says I never pulled that badge log. Fine by me.") show the cover-up from below, and they are very good.

**Influence feedback.** It reads naturally where it rewards a stance (Halloran "Thank you. Not many in your line would say that.", Lisa "Wow. Okay. Right.", Patricia's drop after a wrong reason). It lands on the NPC's line, never on narration. The one weakness is volume: two popups three lines apart in seven topic knots (D5C2-29), which is polish.

**Torres.** Still the best scene in the mission, and cycle 1 made it better ("She told me I was the only one.", "He almost laughs."). Three small slips came in with the new exposure choice and the no-deal path (D5C2-11, -12, -20).

**Repetition across the mission**, not yet covered above: "every night" closes the player's statement and opens both replies, which is fine for Patricia and an echo for HaX. "What he's carrying" is used three times by HaX. "Coat" is used four times by the building.

## Best and worst lines

**Five best** (the cycle-1 list still stands; these are from the current text, weighted towards what cycle 1 added)

1. `m05_npc_patricia_morgan.ink:453`, Patricia after the player states the pattern: "I sign that log off every Monday. I never once read the front door."
2. `m05_npc_lisa_park.ink:113`, Lisa on the lethal ending: "Has anyone seen David? His coat's still on his chair."
3. `m05_closing_debrief.ink:716`, HaX: "Someone who never has to hear the ambulance not come."
4. `m05_npc_dr_halloran.ink:329`, Halloran after the fate: "It was never in yours. Mine, maybe."
5. `m05_closing_debrief.ink:764`, HaX: "I know. I read the report."

Close behind: "The pathologist thinks twenty minutes would have been enough." (debrief :470); "Is thirty to forty-five families. Like mine." (Torres :184); "I'm told he's gone home. I'm told nothing else, and I'm not asking." (Patricia :191); "It already has. Your consultant cover is burnt, and Netherton wants you in his office at two." (debrief :644).

**Five worst**

1. `m05_closing_debrief.ink:770`, HaX on the lethal ending: "You never let him hide behind his story. Cold, maybe. But you saw it clearly." Praise, straight after a man died through neglect (D5C2-1).
2. `m05_closing_debrief.ink:601`, HaX: "Less than a double agent would give us. A good deal more than nothing, and clean." No subject after either beat reply (D5C2-9).
3. `m05_closing_debrief.ink:344`, HaX: "Hours. His badge at the front door at two in the morning, and a borrowed one on the server hallway." The badge log a second time, six lines after the first (D5C2-2).
4. `m05_closing_debrief.ink:749`, HaX: "Every one of these operations has been paid for by someone." The fourth money line in a row, and unclear about who is paying (D5C2-14).
5. `m05_torres_confrontation.ink:491`, Torres: "You can't. They'll find it. They always find it." Its "they" spills into "They're eight and eleven." (D5C2-11).

Dishonourable mention: "[Bought a person how?]" (briefing :38), the player asking Netherton his own question (D5C2-30).

## Is another cycle worth it?

Yes, one more, and it should be short. The stage's close rule is a round with nothing above minor, confirmed in the browser. This round has one major (D5C2-1, a one-condition fix), so it can't close yet. Everything else is wording or a one-line guard, so cycle 3 should be a light fix pass, a confirmation review and the browser checks still open from cycle 1:
- the debrief beats on two endings;
- Patricia's naming with a close and reopen on "...Damn.";
- one fate reaction in a person-chat;
- HaX's flag choice with two flags waiting;
- the Recruiter's hang-up and ring-back.

I'd expect cycle 3 to find nothing above minor. Past that, returns will be small. The writing is now at or near the m04 and m06 standard. Only two route quotes would break. Thirteen routes pick the briefing choice by the substring "Bought a person" (D5C2-30), and r31 asserts "Less than a double agent" (D5C2-9 lower-cases it, so the check becomes "less than a double agent"). Every other changed line is unasserted, so the new wording wants a few `said` checks added: the lethal debrief without the stance line, r3 without "slow way", and Patricia's lethal reaction.

## Spoken lines this review would change

The m05 cache holds 8 clips, and every line below is new this pass or uncached, so re-voicing costs almost nothing. Old → new is in each table row. Voiced lines touched:
- debrief :209, :215, :254, :330, :344, :350, :437, :579, :601, :749, :767/:770 (gated, not reworded), :777 (cut), plus a new "The same hand.";
- Patricia :189, :194 (greeting cycle), :509, :552, :555; phone :257, :287;
- Owen :130; Halloran :152; Lisa :109;
- Torres :491; HaX :338, :525, :773, :785-786; Recruiter :395;
- briefing :25 (narrator, cut a sentence), :315.

Choices (not voiced): debrief :253, :331; Halloran's new post-fate "[It was David. I'm sorry.]"; Torres :233; HaX :379; briefing :38.
