# m07 The Architect's Gambit: dialogue review, pass 5 cycle 2

Reviewer: fresh Opus, read-only, 2026-10-14. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission judged as a TV spy thriller, the season's climax: four crises in one minute, one team, a choice that has to cost something real and be paid off honestly (`docs/agents/M07_PASS_BRIEF.md`). Inputs: `DIALOGUE_REVIEW_P5_C1.md`, the "Phase 4 dialogue, cycle 1" entry in `IMPROVEMENT_LOOP_LOG.md`, and the ink at commit `60170e1b` (m07's ink is unchanged since; the later commit `f9b11416` touches m08 only). The working tree's `scenario.json.erb` holds uncommitted room-dressing changes and four dialogue text edits (the T-5 and T-1 barks, the never-committed credits line, Elena's voice style), which I review below. Model for format: `scenarios/m05_insider_trading/DIALOGUE_REVIEW_P5_C2.md`.

I didn't open the SecGen XML or the four listed field guides. The debrief's VM summary (`m07_closing_debrief.ink:116`) and HaX's VM hints are judged as writing only. Whether they match the VM **needs checking against SecGen by the user** (U3 in `DECISIONS_PENDING.md`, unchanged).

Finding ids are `D7C2-n`, tagged **blocker / major / minor**. No m07 audio exists, so no rewrite costs anything to re-voice. Erb line numbers are from the working tree and will drift while room dressing edits the file. Re-read each region before an Edit.

## Step 1: compile, validator, lint, runtime

All run by me, into `…/scratchpad/m07-dialogue-reviewer-c2/` (`json/`, `routes/`).

- **Compile to scratch.** `bin/inklecate` on all eight files: no errors, no loose ends. Every scratch JSON is byte-identical to the committed JSON, so the routes test exactly this ink.
- **Routes, all 30** (`route.js`, transcripts in `routes/`): every one ends `[result] all expectations met`. The longest run without a choice is 9 (the briefing's opening on every route; the debrief on r30 and six others). Debrief runs of 6 or more over all routes: 43 of 6, 28 of 7, 21 of 8, 7 of 9.
- **dialoguelint:** 0 errors. What's left is what cycle 1 explained or withdrew: `transition` ×1 (Architect :120, "however you like"), `not-x-but-y` ×1 (debrief :737, "Not to this room. Somewhere without windows."), `you-after-choice` ×2 (Elena :372, Mercer :114, non-verbal), `blank-reentry` ×3 (Hollis `parked`, Park `parked` and `hub`), `crowded-hub` ×1 (HaX hub, a static count of 14; the runtime maximum is 9, see below).
- **tagdiff against HEAD:** structure unchanged in all eight files. **tagdiff `--old` against the cycle-1 snapshot**, file by file: Architect 16, debrief 76, Elena 66, Mercer 74, Hollis 5, HaX 114, Park and briefing none. Total 351, matching the log. I read the debrief, HaX and Architect diffs against the logged changes, and every difference maps to one.
- **reopencheck:** total problems 0. m07 HaX 1800 reopens, 1280 re-runs; the Architect 472 reopens, 316 re-runs.
- **loopcheck** (200 steps × 6 strategies) on states the fixer didn't list: HaX with all three sub-menus open, Mercer hostile and left standing, the clock expired; the debrief with Fracture covered, the clock expired, the thin coda and Tomb Gamma found; Elena with the projection; Mercer with Elena turned and every topic open; Hollis with both documents; the Architect at T-5 with no team committed. No runtime errors.
- **Validator** (`--skip-ink --no-graph`): schema passes. The same 13 onceOnly notes on HaX's mappings, the two cutscene notes, the `object_interacted` timed-text note and the three all-conditional credits sections as before. Nothing new and nothing dialogue-facing.
- **HaX's hub at runtime:** r28 (the review's 15-choice state) shows 9. The sub-menus show 5, 3 and 3 there.
- **UK English and the user's writing rules** over every changed line and the four erb edits: no banned words, no US spellings in narration or British voices (the Americans' "apartments" and "parking lot" are vocabulary in American mouths, which is right), no double hyphens left in spoken text.

## Confirmation of cycle 1 (D7-1 to D7-42)

All 42 are closed in the ink and erb. I checked each against the line, not the log. Where the fixer departed from the review, my judgement is in the last column.

| # | Status | Where it now lives | Judgement on any departure |
|---|---|---|---|
| D7-1 | closed | debrief beat 1 :124-126, `team_reaction` :219-225, `revision_lesson` :312-318, beat 4 :335-338, `between` :365-371, beat 6 :359-363, one line per person :428-521, coda turn :534-537, beat 7 :550-553 and :568-570, `coda_close` :581-583, handoff beat :741-744. Max run 9 on every route | The two extra beats were right. The coda turn ("Then it's over." / HaX "Not quite.") is one of the best new exchanges, and "Why without windows, sir?" earns Netherton's last speech. "Is there more, sir?" / "(Wait.)" with the two-of-ours line as the reply is better than the review's version. Three costs: "Was it worth it?" is deferred and never answered (D7C2-1); the merged site list now says "walked out" three times and "You told him" twice (D7C2-5); and the run from the coda to the handoff has three silent choices (D7C2-3) |
| D7-2 | closed | :207, :377-378, :412, :414-415 | As proposed |
| D7-3 | closed | Architect :60, :66, :207-210, :239-245, :284, :458, :479; r6 and r7 assert T-20 doesn't follow | Right. One wording problem: the folded line names the city straight after "wherever you left it" (D7C2-16) |
| D7-4 | closed | :650-654, :656/:673 gated, :680-684, :688/:692-696, :713-714 | Rewording "Not choosing was a choice" was right. Fixing the refused stance as well was right. Its last line, "You will live between those two", now has nothing to stand between (D7C2-6) |
| D7-5 | closed | HaX :272-286, :296, :438-505; most at once 9 | `submenu_from_hub` works as described: a reopen that re-runs a sub-menu goes to the hub, and one with unchanged globals shows the saved sub-menu with "Never mind." (r28, reopencheck). Retiring the closed-window question at the abort is sound. Two issues: the Park pointer, a hint, is filed under "people" (D7C2-9), and the vault sub-menu repeats "vault" (D7C2-10) |
| D7-6 | closed | :174, :187-188, :242-245 | As proposed |
| D7-7 | closed | cut (comment :268-269) | As proposed |
| D7-8 | closed | :612 | As proposed |
| D7-9 | closed | :662-663 (r30) | As proposed |
| D7-10 | closed | :565 | As proposed |
| D7-11 | closed | Architect :156-160 | "goes dark with the other" is better than the review's, for the reason the log gives |
| D7-12 | closed | HaX :657 (r10) | As proposed. On that branch the next line now contradicts it (D7C2-13) |
| D7-13 | closed | Hollis :147 | As proposed |
| D7-14 | closed | erb :1487, :1493; Architect :237 | The barks no longer give the punch line away. They now repeat the narrator line that opens each call ("Five minutes, Agent 0x00." then "Five minutes on the display."; "One minute, Agent 0x00." then "One minute."), so it's the same fault in a new place (D7C2-14). T-10's line was reworded, but it still makes the bark's point (D7C2-15) |
| D7-15 | closed | Architect :179 | As proposed |
| D7-16 | closed | Architect :295 | "even when it's monstrous" is fine |
| D7-17 | closed | briefing :24, :36 | "the fund behind them" is better than the review's |
| D7-18 | closed | briefing :142, :210 | As proposed. The Fracture tail now repeats one question's reply (D7C2-23) |
| D7-19 | closed | Architect :151, :161 | As proposed |
| D7-20 | closed | Architect :233 | As proposed |
| D7-21 | closed | Hollis :62 | As proposed |
| D7-22 | closed | Hollis :270-285 | As proposed. The review's structure has a gap: the after-clone line isn't latched, so it plays on every re-talk (D7C2-18) |
| D7-23 | closed | Hollis :103 | As proposed |
| D7-24 | closed | Elena :214-215, :241, :243 | As proposed |
| D7-25 | closed | Mercer :147, :213 | "Mine didn't." is better than the review's |
| D7-26 | closed | erb :1716 (working tree) | Correct for the ink. Her opening (she's been at the rack forty minutes, putting back the tables Mercer rewrote) shows she already knows, so "has just read otherwise" holds from her first line |
| D7-27 | closed | Mercer :176 | The count now agrees across :176, :235, :351, :401/:403. The fix leaves "twice … twice" in one sentence (D7C2-20) |
| D7-28 | closed | Mercer :280, :395 | Right. "the host in the server hall" now comes twice in three lines (D7C2-19) |
| D7-29 | closed | Mercer :240, :257 | As proposed |
| D7-30 | closed | HaX :130, :178 | As proposed |
| D7-31 | closed | HaX :121 | "running four fires tonight" now sets up Nightshade's "Four fires, one bucket" in m08 (`m08_nightshade_confrontation.ink:142`) and pairs with HaX's own "One team, three fires." (:673). Keep it word for word |
| D7-32 | closed | first-call line cut; :684 kept | As proposed |
| D7-33 | closed | HaX :641 | As proposed |
| D7-34 | closed | HaX :689-692 | As proposed |
| D7-35 | closed | HaX :706 | As proposed |
| D7-36 | closed | HaX :752 | The branch names have a hole: a hostile Mercer left standing is told about "the cell", and "He'll talk" follows "Nobody was talking him down" (D7C2-11) |
| D7-37 | closed | Elena :103-113, :320-328; Mercer :126-138 | The pattern is right, and lint is down to the three explained cases. Elena's line has two small slips (D7C2-21) |
| D7-38 | closed | HaX :796 | As proposed |
| D7-39 | closed | debrief :436-437, :439 (r30) | As proposed |
| D7-40 | closed | debrief :213; erb :200 "held over Denver" (working tree) | "circled" and "held over" agree well enough |
| D7-41 | closed | debrief :547; the document (erb :2135) says forty | As proposed |
| D7-42 | closed | HaX :124, :265, :458, :653 | As proposed |

## Severity table

Counts: **0 blockers, 0 majors, 23 minors.** No lint finding was withdrawn this cycle (the two cycle 1 withdrew stay withdrawn). Two findings change a condition (D7C2-9 moves one gated choice between sub-menus; D7C2-17 gates two choices). Everything else is wording.

### Minors: the debrief

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7C2-1 | minor | `m07_closing_debrief.ink:221`, with :368 | "[Was it worth it?]" gets "Ask me again when I have read you the other two." The player never gets to ask again: after the read-outs the beats are "Is there more, sir?" / "(Wait.)". Eight lines later the `between` beat defers too ("I will ask you that at the end…"), which *is* paid off at the stance. Two deferrals in a row, one of them a broken promise (r1, r30). | `Director Magnus Netherton: For the people the team reached, yes. That is the only half I can answer tonight.` It answers, it absolves nobody, and it promises nothing. r30 asserts the old line; update it. |
| D7C2-2 | minor | `m07_closing_debrief.ink:126` after :104 | On every clean save, "You did the thing. It is done." is followed three lines later by "[It doesn't feel done, sir.]" → "It will not, tonight. It is done anyway." The same three words twice (r1, r30). | `Director Magnus Netherton: It will not, tonight. Count it anyway.` |
| D7C2-3 | minor | `m07_closing_debrief.ink:582` (and :536, :742) | From the site list to the end, every route offers "(Say nothing.)" three times in about 25 lines: the coda turn, `coda_close` and the handoff. The first and last work (the first meets "Nobody speaks."; the last makes HaX say "Sir?"). The middle one is filler, and it sits on the beat that should hit hardest: "You gave him a clean reading." | `+ [What does he do with a reading?]` in place of `+ [(Say nothing.)]`. "Agent. Look at me." then answers by refusing the question, which suits him. r29 and r30 pick "Say nothing" by substring at this beat; re-point them. |
| D7C2-4 | minor | `m07_closing_debrief.ink:369` | On an uncommitted route the second `between` offers only "(Say nothing.)" and "Go on." once "How many of those are on me?" has been asked (r29). It's the only beat in the debrief where neither option is something the player says. | `+ {asked_on_me} [I'm keeping count, sir.]` (no reply; Meltdown follows). It carries on the player's question instead of going quiet. r29 asserts "[choice] (Say nothing.)"; update it. |
| D7C2-5 | minor | `m07_closing_debrief.ink:468`, :475, :493 | The merged site list repeats itself. On r30: "You told him what he was." then "And you told him he was scenery…", then "Elena Rodriguez walked out…", "Ray Hollis walked out through the muster door…", "Thomas Park walked out of the vault…": three "walked out" in four lines. | :468 → `Director Magnus Netherton: He also heard from you that he was scenery, there to keep us busy. Whatever that does to a man like him, it is doing it now.` :475 → `Director Magnus Netherton: Elena Rodriguez gave a statement without being asked twice. Analysis wants her. I have not decided.` :493 → `Director Magnus Netherton: The police picked Ray Hollis up at the gate. He told you more about the vault than he has told us.` r30 asserts "And you told him he was scenery"; change it to "he was scenery". |
| D7C2-6 | minor | `m07_closing_debrief.ink:692-697` | The uncommitted refusal ends "I will note the refusal. You made it tonight as well, and three operations went dark while you did." then "You will live between those two. Most of us do." For the committed player the two are the refusal and the sum he did anyway. Here both sentences are the refusal, so "between those two" has nothing to stand between (r29). | Move :697 inside the `- else:` branch. In the uncommitted branch, after :693: `Director Magnus Netherton: That one you will have to live with.` r29's assertion on :693 still passes. |
| D7C2-7 | minor | `m07_closing_debrief.ink:551` | "[That's my deployment. Word for word.]" → HaX: "Word for word." She repeats the player, the m05 C2 echo class (D5C2-23). | `Agent HaX: Down to the forty minutes.` It confirms the claim and points at the detail (the window) that HaX checks next. r29 asserts "Word for word."; update it. |
| D7C2-8 | minor | `m07_closing_debrief.ink:752` | On a clean save, "Eight point four million" comes at :102, :416 (Meltdown dark), :587 and then in the closing narrator line, about fifteen lines after :587. The last image doesn't need the number to work. | `Narrator: Outside, across three states, people are asleep with the lights on.` (The expired branch, :750, is already figure-free.) No route asserts it. |

### Minors: HaX (phone)

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7C2-9 | minor | `m07_phone_agent_0x99.ink:439`, :467 | The Park pointer, "[The man in the vault won't stop. What would reach him?]", is a hint for an optional task with a hard clock ("He won't wait for a third look"), but it's filed under "About the people in here." A player stuck in the vault looks under "I'm stuck on something." first. When it's the only people item, the generic label hides it completely. | Move the choice from `people_topics` to `stuck_topics`, above the vault keypad line. Drop `or park_pointer_open()` from `people_news()` and add it to `stuck_news()`. The most choices at once is unchanged (one item moves between two groups that are each one button). Re-run reopencheck. |
| D7C2-10 | minor | `m07_phone_agent_0x99.ink:477`, :479 | "[What I found in the vault.]" opens "[I found a dossier down in the vault. Tomb Gamma.]" and "[The intercept in the vault. They didn't leak…]". The player says "vault" twice in two clicks. | `[A dossier. Tomb Gamma.]` and `[An intercept. They didn't leak the operation. They leaked me.]` (the mole sentence word for word, as cycle 1 asked). r28 picks "The intercept in the vault" and "dossier down"; re-point it. |
| D7C2-11 | minor | `m07_phone_agent_0x99.ink:749-752` | Two slips in the D7-36 fix. "Nobody was talking him down." is followed at once by "He'll talk." (r28). And the last branch, "He never got to say his piece. He'll mind that more than the cell.", plays for a hostile Mercer who was left standing (`mercer_fate == "ko"`, `mercer_ko` false). The debrief says he was gone before the police came (:437). | `{mercer_fate == "arrested": Good. He's waited twenty years for a room that has to listen.\|{mercer_fate == "escaped": You let him walk. That's in the log, in your words.\|{mercer_ko: He never got to say his piece. He'll mind that more than the cell.\|He came at you instead of saying his piece. Wherever he is, he's still writing it.}}}` r28 asserts "He'll talk. He's waited…"; update it to "He's waited twenty years". |
| D7C2-12 | minor | `m07_phone_agent_0x99.ink:126` | First call: "I can't be in the other two places." HaX isn't in any place. It reads like Netherton's "The other two go unanswered" given to the wrong speaker, and the commit text has just said "Two of the three go unanswered tonight." | Cut the line. "It'd take something new to move it." then leads into the checkpoint line. No route asserts it. |
| D7C2-13 | minor | `m07_phone_agent_0x99.ink:657`, :661 | On the D7-12 branch, "You made that call with the numbers in hand. It stands." is followed by "You found the numbers were wrong. That goes in the report." The player hasn't just found anything; they had the numbers before the commit. | :661 → `{not revision_before_commit: You found the numbers were wrong. That goes in the report. }Now finish the part that's still yours.` r2's assertion is on the other branch and still passes. |

### Minors: the Architect and his barks (including the erb text edits)

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7C2-14 | minor | erb :1487, :1493 (working tree); `m07_architect_comms.ink:289`, :291, :348, :350 | The new barks, "Five minutes, Agent 0x00." and "One minute, Agent 0x00.", are followed by narrator lines that open on the same words: "Five minutes on the display." and "One minute." That's the bark-repeat fault D7-14 set out to remove (README pass-4 bug 8). | Keep the barks and drop the time from the narrator. T-5 :289 → `Narrator: Your handset lights without ringing. The call is already connected, and has been for some seconds.`; :291 → `Narrator: The handset opens the line without asking.` T-1 :348 → `Narrator: {countdown_expired:The countdown has run out. }Your handset lights without ringing…`; :350 → `Narrator: {countdown_expired:The countdown has run out. }The handset is warm in your hand and the line is already open.` r24 and r25 assert "Five minutes on the display" and "One minute."; change them to assert the barks. |
| D7C2-15 | minor | `m07_architect_comms.ink:237` with erb :1469; :227 with erb :1481 | T-10's `else` line was reworded, but "Soon your team won't be yours to move." still makes the point of the bark the player has just read, "Ten minutes before your team is too committed to move". The login bark, "You logged in, Agent 0x00. A word about doors.", is followed by "You logged in. The door closed behind you." (r3, r7). | :237 → `The beauty of entropy is that it doesn't require me to win. It only requires you to wait.` erb :1481 → `"A word about doors, Agent 0x00."` r2 asserts "Soon your team won't be yours to move"; r3 and r7 assert the login bark. Update all three. |
| D7C2-16 | minor | `m07_architect_comms.ink:241`, :243 after :229 | With T-20 folded in and the window shut, he says "Forty minutes. Your team is committed now, wherever you left it." and then "You sent your team to Washington…" (r6). "Wherever" pretends not to know, and the next breath names the city. | :241 → `Washington, then. San Francisco and the vendors are on your clock.` :243 → `San Francisco, then. Washington and the vendors stand open.` This reads right after every T-10 opener, and better after "wherever you left it". No route asserts the old text. |
| D7C2-17 | minor | `m07_architect_comms.ink:315`, :323 | An uncommitted player who logs in hears T-5 (its timer starts on `cascade_armed`, erb :694). He says "You covered nothing at all." and the player can answer "[I made a call. I'll carry it.]". Then: "Do you believe in yours enough to name them?" No call was made, so there is nothing to call "yours". It's the D7-4 class in the Architect's mouth. No route covers it. | :315 → `+ {team_assignment != ""} [I made a call. I'll carry it.]` plus `+ {team_assignment == ""} [I didn't make one. I'll carry that too.]` (both → "Noted."). :323 → `{team_assignment == "": You'll have to name all three, eventually, to somebody with a tablet.\|Do you believe in yours enough to name them? You will have to, eventually, to somebody with a tablet.}` Add a route: uncommitted, login, advance 10 minutes, open the Architect. |

The other two erb edits are sound: the credits line (erb :200, "held over Denver") agrees with the debrief's "circled over Denver", and Elena's voice style (erb :1716) is covered under D7-26 above.

### Minors: Hollis, Mercer, Elena, the briefing

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7C2-18 | minor | `m07_npc_ray_hollis.ink:276-278` | The after-clone sighting isn't latched. Every re-talk after the clone plays "He looks up from the desk. His hand stays off his belt this time." / "Thought you'd gone. Say it or go." The `wary_said` branch never takes over (the review's own structure had the same gap). | `- hollis_cloned and not wary_said:` then `~ wary_said = true` above the two lines. Later re-talks fall to "Still here. Say it or go." r14 asserts the first sighting only, so it still passes. |
| D7C2-19 | minor | `m07_npc_james_mercer.ink:280`, :283 | "While the host in the server hall drives it, this chair takes no abort…" then, two lines on, "You need the host in the server hall." (a D7-28 side effect). | :280 → `Dr. James Mercer: End it how? This chair takes no abort while the host drives it, and the sequence doesn't care what happens to me.` :283 keeps the full name. |
| D7C2-20 | minor | `m07_npc_james_mercer.ink:176` | "I testified twice, and filed the same submission twice in eight years." Two "twice" in one clause (a D7-27 side effect), and :177 then says "Each time". | `Dr. James Mercer: I did publish. Four papers, two of them still cited. I testified twice. The same submission went in two times in eight years.` |
| D7C2-21 | minor | `m07_npc_elena_rodriguez.ink:111` | Her new re-entry lines: "Still here. Ask." is Hollis's re-talk opener ("Still here. Say it or go.", Hollis :280). And "Neither has the table" makes her one table singular; everywhere else they are "the load-shed tables" (her own :84, :184, :326, :402). | `Elena Rodriguez: {&Ask. I can listen and type.\|I haven't moved. Neither have the tables.}` |
| D7C2-22 | minor (polish) | `m07_npc_elena_rodriguez.ink:371-372`; `m07_npc_james_mercer.ink:110`, :114 | The debrief now writes non-verbal choices as `[(Say nothing.)]`, as Park's are. Elena's and Mercer's are still `[Say nothing.]` / `[Say nothing. Let him fill the silence.]` followed by a `You: ...` line. | `[(Say nothing.)]` and `[(Say nothing. Let him fill the silence.)]`; cut both `You: ...` lines (the narrator line after each carries the silence). This clears the two `you-after-choice` lint notes. Routes that pick "Say nothing" by substring still match. |
| D7C2-23 | minor | `m07_opening_briefing.ink:130-133`, :142 | After "[What can the team actually stop at this point?]" Netherton says "They can take the cluster before it publishes. A breach without the story is a scandal…", and the new tail line at once says "If the team goes there, the story never runs. The breach does." The same fact twice in three lines (D7-18's tail). Trojan's and Meltdown's question replies don't repeat their tails. | Label the choice `* (stop_asked) [What can the team actually stop at this point?]` and gate the tail: `{not brief_fracture.stop_asked: Director Magnus Netherton: If the team goes there, the story never runs. The breach does.}` |

## Fresh review: how it plays now

I read the debrief end to end on six routes from the transcripts: Meltdown covered with the correction held (r30), never committed with the vault searched and refused (r29), the redirect (r1), Trojan direct with Hollis knocked out (r3), never committed (r5) and Elena first, then a commit after a declined redirect (r4). I also read HaX's hub and sub-menus (r28, r21, r22), the Architect on every taunt order (r6, r7, r23-r25) and each person-chat's re-talks.

### The new debrief beats: the player's, or filler?

Mostly the player's. Of the ten beats, seven give the player a line they would actually say at that moment:
- "How close was it?" / "It doesn't feel done, sir.";
- "Was it worth it?" (and, uncommitted, "I couldn't choose, sir.");
- "He let us capture it." / "Then whose numbers were they?";
- "How many of those are on me?";
- "Then it's over.";
- "That's my deployment. Word for word.";
- "Why without windows, sir?".

"He let us capture it." is the best of them: the player states the mission's twist before Netherton can, as m05's deduction beat did. "Then it's over." → "Not quite." turns the scene back towards the coda in four words.

Three beats are weaker. "Read them, sir." is a "go on" choice that sits two lines after another one ("Go on, sir."), but its partner "I know what they were, sir." → "You know the briefs. These are the results." is good, and the beat is needed to keep the next run at 9. The two-silence `between` on uncommitted routes is pure filler (D7C2-4). The silence at `coda_close` is the one that hurts, because it's the third silent option in a row on the beat that should hit hardest (D7C2-3).

The beats come thick between the team's result and the first dark read-out: three choices within about eight lines on routes with a short `revision_payoff` (r29: team result, two lines, the twist, one reply, one line, "Read them, sir."). That's acceptable. The scene reads as a conversation now, which cycle 1 asked for. It could become choppy if a later fix adds another beat in that stretch, so don't.

### Do any let the player off?

No. I tested every beat against the scene's rule ("Nobody absolves the player", debrief :16-19):
- "It doesn't feel done" doesn't make Netherton soften the win, and it doesn't soften the cost.
- "I couldn't choose, sir." gets "Then the writing will be short. It will not be easy."
- "I know what they were, sir." gets "These are the results."
- "How many of those are on me?" is deferred to the stance, where it's answered in the player's own words.
- "He let us capture it." gives the player the Architect's hand in the numbers just before the dark read-outs. Even so, every dark read-out is still read in full, and HaX's "You knew" lines follow.
- "Then he got what he came for." is self-reproach, and Netherton's "He measured you. He did not beat you." meets it without absolving.

The only soft spot is "Was it worth it?" → "Ask me again when I have read you the other two". It absolves nobody, but it makes a promise the scene never keeps (D7C2-1).

### HaX's sub-menus and their reopen behaviour

The fold works and the labels are good spoken lines ("About the people in here.", "What I found in the vault.", "I'm stuck on something."). The mission's best HaX beats, the teacher line and the mole, now stand out: the teacher line is a top-level choice and the mole is one click down. On reopen:
- a reopen with changed globals re-runs the sub-menu, finds `submenu_from_hub` cleared, and goes to the hub (r28's last section shows it);
- a reopen with unchanged globals shows the saved sub-menu, with "Never mind." always there, the same as `field_guides`;
- a page reload restarts at `start` and lands on the hub.

reopencheck is clean over 1800 reopens. The two issues are what gets filed where: a hint under "people" (D7C2-9), and the vault repetition (D7C2-10). "Where do I stand?" now carries the clock after the server hall ("The clock's running. Fifteen minutes from your login on their host." and "Step one ran. Seattle's dark…"), and the ladder stays current at every step on r21, r22 and r26.

### Repetition the merges introduced

- The site list: "walked out" ×3, "You told him" ×2 (D7C2-5).
- "It is done" twice in three lines (D7C2-2).
- "the host in the server hall" twice in three lines; "twice … twice" (D7C2-19, D7C2-20).
- "Nobody was talking him down." / "He'll talk." (D7C2-11).
- The barks and their narrator lines (D7C2-14), T-10's bark and its line (D7C2-15).
- The Fracture tail and its question's reply (D7C2-23).
- "vault" in the sub-menu (D7C2-10).
- "Eight point four million" four times on a clean route (D7C2-8, partly pre-existing).
- Not a problem: "in your own words" (`between`) and "in your words rather than mine" (the stance) is a deliberate callback, and it's the promise the scene keeps.

### Contradictions

- An uncommitted player can claim a call at T-5 (D7C2-17).
- A hostile Mercer left standing is put in "the cell" by HaX (D7C2-11).
- "with the numbers in hand" is followed by "You found the numbers were wrong" (D7C2-13).
- "wherever you left it" is followed by the city (D7C2-16).
- Nothing else across the routes: the debrief tense, the team's whereabouts, the intercept's forty minutes and fifty-one minutes, and the submission count all now agree.

### Voice

- **Netherton:** on model in every new line. "Then the writing will be short. It will not be easy." and "You know the briefs. These are the results." sound exactly like him. "Leaving it unordered was yours" is a shade clever for him, but it lands on "the menu was his", so keep it.
- **HaX:** stays dry. "Not quite. Director, one more thing." is the right register. "Word for word." is an echo (D7C2-7).
- **The Architect:** intact; "Nearly." is a better reply than the one it replaced.
- **Elena:** her re-entry lines need one slip fixed (D7C2-21).
- **Mercer:** the "Back." lines finally play, and "Back. There's nothing left on that console for either of us." is good.
- **Hollis:** "Thought you'd gone. Say it or go." is the right pitch for after the clone, once it's latched (D7C2-18).

## Best and worst lines

**Five best** (the cycle-1 list still stands; these weight what cycle 1 added)

1. `m07_closing_debrief.ink:314-317`, the player: "[He let us capture it.]" → Netherton: "Yes. Our threat desk did not derive one of those numbers." The twist given to the player.
2. `m07_closing_debrief.ink:534-535`, the player: "[Then it's over.]" → HaX: "Not quite. Director, one more thing. It isn't in the reporting yet."
3. `m07_closing_debrief.ink:223`, Netherton to the player who couldn't choose: "Then the writing will be short. It will not be easy."
4. `m07_closing_debrief.ink:682`, Netherton: "It is. Leaving the team in the air was the most expensive answer on the board."
5. `m07_phone_agent_0x99.ink:689`, HaX after the correction: "Not on the brief we gave you. He wrote the brief."

Close behind: "You know the briefs. These are the results." (debrief :337); "Thought you'd gone. Say it or go." (Hollis :278); "Page one of her copy had the carve-out. Mine didn't." (Mercer :213); "The ops room's running four fires tonight." (HaX :121, which m08 now echoes).

**Five worst**

1. `m07_closing_debrief.ink:221`, Netherton: "Ask me again when I have read you the other two." The player never can (D7C2-1).
2. `m07_architect_comms.ink:291`, after the bark "Five minutes, Agent 0x00.": "Narrator: Five minutes on the display." (D7C2-14).
3. `m07_architect_comms.ink:315`, an uncommitted player to the Architect: "[I made a call. I'll carry it.]" (D7C2-17).
4. `m07_phone_agent_0x99.ink:752`, HaX on a Mercer who got away: "He'll mind that more than the cell." (D7C2-11).
5. `m07_closing_debrief.ink:697`, to the player who never sent the team: "You will live between those two." There's only one thing to live with (D7C2-6).

Dishonourable mention: "I can't be in the other two places." (HaX :126, D7C2-12).

## Skill checks, one line each

- **2a attribution.** OK. Every prefix resolves (validator); the phone inks carry no self-prefix.
- **2a-bis, supported by the scenario.** OK. The debrief's site list matches each fate's mapping. Hollis's "Building's evacuating." matches the briefing's handoff.
- **2a-ter voices.** OK. Elena's style now describes the character in the ink.
- **2b choice phrasing.** OK. D7C2-22 is polish.
- **2c hub structure.** OK. Every person-chat keeps a sticky exit with a reply.
- **2c-bis starved knots.** None: loopcheck is clean on the states above and the fixer's 21; reopencheck is clean.
- **2d choices that matter.** Strong, as in cycle 1. The new beats are stances or questions. None sets state, which is correct for a debrief that already reads back every choice.
- **2e cross-file state.** OK. `revision_before_commit` is declared in HaX and is a scenario global.
- **2f influence.** N/A. Outcomes are gated on evidence.
- **2g syntax.** OK.
- **2h KO.** One writing gap: D7C2-11.
- **2i recurring bugs.** Status answers stay current (r21, r22, r26). The same fact twice: D7C2-2, -5, -7, -14, -15, -19, -23. Choices that claim what didn't happen: D7C2-17. Credit and debrief lines against every route: D7C2-6.

## Route quotes the rewrites would break

| Fix | Route | Assertion or pick |
|---|---|---|
| D7C2-1 | r30 | `said` "Ask me again when I have read you the other two." |
| D7C2-3 | r29, r30 | pick "Say nothing" at `coda_close` (re-point to "What does he do") |
| D7C2-4 | r29 | `said` "[choice] (Say nothing.)" |
| D7C2-5 | r30 | `said` "And you told him he was scenery" |
| D7C2-7 | r29 | `said` "Word for word." (the reply; the choice text keeps it) |
| D7C2-10 | r28 | picks "The intercept in the vault", "dossier down" |
| D7C2-11 | r28 | `said` "He'll talk. He's waited twenty years…" |
| D7C2-14 | r24, r25 | `said` "Five minutes on the display", "One minute." |
| D7C2-15 | r2, r3, r7 | `said` "Soon your team won't be yours to move"; the login bark text |
| D7C2-17 | new | an uncommitted login that hears T-5 |

No other changed line is asserted. Worth adding as `said` checks: D7C2-6 (r29), D7C2-9 (the Park pointer under "I'm stuck on something." in r28), D7C2-16 (r6), D7C2-18 (r14, a second re-talk after the clone).

## Is another cycle needed?

No full review cycle. By the stage's close rule (a cycle that finds nothing above minor, confirmed in the browser), this round would close the dialogue stage once the minors are fixed and the browser check left open from cycle 1 has run. Every finding here is wording or a one-line guard, so a fix pass and a check of the touched lines by the orchestrator (grep each line, re-run routes, reopencheck, lint) are enough. A third reviewer would be confirming polish.

The targeted browser check should cover what the static tools can't see:
- the debrief beats on two routes (one committed, one uncommitted), watching the bracketed non-verbal choices and how the runs pace on screen;
- HaX's three sub-menus, with a close and reopen inside one, before and after a global changes;
- Elena's and Mercer's re-talk lines;
- T-10 heard with T-20 folded in;
- the T-5 bark, then opening the call, to confirm D7C2-14 reads once.

The writing is now at the m04 and m06 standard, and in the debrief it's better than either.

## Spoken lines this review would change

No m07 audio is cached, so none of this costs anything to re-voice. Old → new wording is in each table row. Voiced lines touched:
- debrief :126, :221, :468, :475, :493, :551, :697 (moved), :752, plus a new uncommitted line after :693;
- HaX :126 (cut), :661 (gated), :752;
- Architect :237, :241, :243, :289, :291, :323, :348, :350;
- Mercer :176, :280;
- Elena :111;
- the barks at erb :1481 (and :1487/:1493 kept, with their narrator lines changed instead).

Choices (not voiced): debrief :369, :582; HaX :467 (moved), :477, :479; Architect :315 (gated, plus a new uncommitted choice); Elena :371; Mercer :110; briefing :130 (labelled).
