# m03 Ghost in the Machine: dialogue review, pass 2 cycle 3

Reviewer: fresh Opus, read-only, 2026-10-12. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M03_PASS2_BRIEF.md`). Inputs: `DIALOGUE_REVIEW_P2_C1.md`, `DIALOGUE_REVIEW_P2_C2.md`, the "Dialogue cycle 2 fixes" entry in `IMPROVEMENT_LOOP_LOG.md`, commit 24f184f4. m03 has no audio, so no rewrite below costs anything in TTS.

Finding ids: `D4-n` (cycle 3). Weakest lines: `W3-n`. Tags: **blocker / major / minor**, and **local** (mission-local) or **approval** (engine, cross-mission, or a standing rule). Line numbers are in the current files (HEAD 24f184f4; the ink is unchanged in the working tree).

## Step 1: compile, validator, lint, runtime checks

**Compile.** All eight ink files compile with no errors and no loose-end warnings (compiled into the session scratchpad, `m03-dialogue-review-c3/`). All eight match the committed JSON exactly.

**Validator** (`--skip-ink --no-graph`). Schema passes. Only the known, justified items remain: the 4 `npc_ko:victoria_sterling` handlers on `agent_0x99`; Terry's repeatable lockpick cutscene without `onceOnly` (deliberate); the `night_transition` visemes suggestion; one "no behavior" note on a reception NPC. No unresolved speaker prefixes, dead `VAR`s or undeclared `#set_global`s.

**dialoguelint.** 0 errors, 2 warnings, both justified since cycle 1: `m03_npc_victoria.ink:576` ("That isn't cruelty. It's arithmetic.", the villain's one) and `:630` (choice length 18, P4-37). No fall-through, blank re-entry, exit-no-reply, tag-on-narrator or cue-density findings.

**reopencheck.** 0 problems; m03 phone 454 reopens, 0 re-greets.

**loopcheck.** Clean on the states I suspected: Ffion's `hub` at night, Victoria's `the_question` with the card saved at night, the debrief on recruited + protected and on ko + exposed, Terry at night on the "sterling" story. loopcheck starts each run at a knot I name, so it can't see the blocker below, which is about *which* knot the engine re-enters.

**Route walks.** These are the main evidence this cycle. I wrote a route driver (`scratchpad/m03-dialogue-review-c3/route.js`, routes in `routes/`). It plays the conversations in order with shared globals and copies the engine's restore behaviour:
- a reopened person-chat re-enters the knot that owns its saved choices (`person-chat-minigame.js:525-536`);
- `#set_global` writes through;
- the clone tag counts as a saved card;
- a "reload" step restarts the story from `start` with only its variables, which is what the server keeps (`npc-conversation-state.js:122-139`, `:229-240`).

Six complete routes, briefing to debrief, plus three short probes:

| Route | Path | Lines | Choices | Longest run with no choice |
|---|---|---|---|---|
| R1 | smooth: Ffion chat, Terry by day, test "sold", recruit, Danny protected | 258 | 66 | 13 (debrief) |
| R2 | suspicious: "unconventional", "selling", test "asked", dropped read, walk-back, Ffion brushoff (after a reload), Terry SAFETYNET, arrest, Danny exposed | 205 | 49 | 13 (debrief) |
| R3 | skip-all: skip background, sign and go, straight to the whiteboard (D3-21), bribe, Danny left, escape | 161 | 32 | 12 (debrief) |
| R4 | receptionist KO'd by day, eager walk-back, Victoria and Danny KO'd at night | 136 | 29 | 12 (debrief) |
| R5 | recruit + expose, Ffion "sterling" (after a reload), Terry files excuse, office opener | 187 | 41 | 13 (debrief) |
| R6 | escape + protect, Terry catches a pick then is KO'd, status checks at five points | 226 | 67 | 12 (debrief) |
| probes | Ffion notebook → Terry; Terry mismatch; chat closed at the D3-21 question then reopened at night | | | |

Outside the debrief the longest run without a choice is 8 or 9 lines (the briefing's opening and its skip route). Every conversation in the field stays at 7 or under. The debrief is 38 to 50 lines with 5 choices on every route.

**Softlock patterns S1–S8 on the cycle-2 material.**
- `the_question`: still sticky, and every answer sets `victoria_test_answer`.
- `question_done`: choice-free, and both of its exits land on knots that print and offer choices.
- `danny_reply_*`: four once-only knots, reached once. Every (Danny fate, Victoria fate) pair has at least one choice; I checked them by enumeration and loopcheck.
- S3: Ffion's "I'll tell the guard you're about" is backed in the ink, but the scene that says it doesn't play (D4-1).
- S4 unchanged (`#complete_task:meet_victoria`, `m03_npc_victoria.ink:87`, day only).
- No gate sits on the critical path. The stale-knot reopen in D4-12 is a wrong-scene bug, not a softlock.

## Part 1: cycle 2 verification

I read every line the log cites and walked each change on at least one route. All 23 findings, 15 rewrites and the cloner scene are in the ink as logged. Four of them don't reach the player as intended:
- **D3-2** (and so D2-12): written correctly, but unreachable in an unbroken session (D4-1).
- **D3-3**: the order is right, but D3-21 made the test universal, so everything below it in the read-back can no longer play (D4-2).
- **D3-21**: works, but adds a second afternoon knot that can replay at night (D4-12).
- **Scene #1**: the cloner's light is in the jacket while the cloner buzzes "against your leg" (D4-13).

| C2 id | Claimed | Verified at | Verdict |
|---|---|---|---|
| D3-1 doorway reveal moved | to `the_reckoning_close` | `m03_npc_victoria.ink:616-626`; opener `:526-565` | **Fixed.** The opener is now the arrival line, one read-back and at most the guard's call (R2: 5 lines). "Nor do they leave my receptionist on her own floor" follows "Recruits don't do that." again (R4). At the close the reveal plays as a live threat just before the ultimatum (R1, R3, R6). One polish note in D4-15. |
| D3-2 Terry reads Ffion | three openers, notebook answer, mismatch -5 | Terry `:47-58`, `:103-160` | **Written, not reachable.** Every reading works when `ffion_night_story` is set (probe: notebook; R2: brushoff; R5: sterling). But Ffion's night question only plays after a page reload (D4-1). In an unbroken session (R1, R6) she says "Found it. Charger was in the biscuit tin" with no setup, and Terry gets the generic opener. The -5 itself is right. On the files excuse a "notebook" mismatch costs 15 against a match (-5 vs +10), but Terry still says "alright" in the same breath (`:134-135`), so the catch has no teeth (D4-9). |
| D3-3 read-back order | read_dropped → asked → sold → hedged → suspicion → low influence → goodbye | `:531-558` | **Fixed as written; the lower half is now dead.** D3-21 sets a test answer for every player who clones the card, so the new suspicion line (`:545`), the low-influence line (`:548`) and all four goodbye-stance lines (`:550-556`) can't play (D4-2). R2 shows "Twice is an inventory" is true where it plays; R6 shows the "asked" line pays off. |
| D3-4 player replies after Danny | four `danny_reply_*` knots | debrief `:359-423` | **Fixed**, and the replies are good: "You're the second person to say that this morning. He was the first." (`:377`), "Careful. That's her word." (`:392`), "Then say so in the report. It reads better than a reason." (`:422`). The run after the reply is still 12-13 lines (D4-4). One reply repeats HaX (D4-19). |
| D3-5 sleep line kept | `target_followup` option | `:609-611` | Fixed (R6). |
| D3-6 "Danny Foster's survey. One of mine." | | `:598` | Fixed. |
| D3-7 narrator cut, pause in her mouth | | `:598-600` | Fixed. The cue sits on a line with no number. |
| D3-8 "asked" reply | | `:327` | Fixed. |
| D3-9 Ffion doesn't know | | Ffion `:97-98` | Fixed. "Turned away a lad who'd been on the telly last spring." is her. |
| D3-10 "Night, then" | | Ffion `:145`, `:310` | Fixed. |
| D3-11 Terry/Ffion contradiction | | Terry `:84` | Fixed. |
| D3-12 knock-off callback | | Terry `:360` | Fixed, and it shows the gap in D4-3: he remembers telling the player his hours, but not their face. |
| D3-13 Terry's flip | | `:287`, `:293`, `:299` | Fixed. "Obstructing. Lovely. Fine. I'm not in your way." is him (R2). |
| D3-14 Danny rang in | | debrief `:300` | Fixed. |
| D3-15 gated targeting choice | | debrief `:174-179` | Fixed. |
| D3-16 cover-sheet line | | debrief `:161` | Fixed, but now echoed by `:142` four lines earlier (D4-5). |
| D3-17 no moral summing | | debrief `:323` | Fixed. |
| D3-18 KO stance | | debrief `:203` | Fixed. |
| D3-19 afternoon tail | | `:510-521` | Fixed. The scene closes on the phone buzz. |
| D3-20 varied re-entry | | Victoria `:108`, Ffion `:47`, Terry `:73` | Fixed. |
| D3-21 test after a straight-to-whiteboard clone | `clone_debrief` → `the_question` → `question_done` | `:486-490`, `:304-340` | **Fixed** (R3: "Before you go. One question." → hedged → "That's enough philosophy for one afternoon."). Side effects: D4-2, and the stale-knot reopen in D4-12. |
| D3-22 Ffion cues | 0 | Ffion | Fixed. Stale code comment at `:111-112` (D4-21). |
| D3-23 ten-thousand hint | | phone `:172-174` | Fixed (R1). |
| W-1 .. W-15 | applied | spot-checked all 15 | Applied as logged. W-4's low-influence goodbye ("Brave. Not useful.", `:211`) loses its night payoff to D4-2. |
| Scene #1 cloner's light | | `:439-441` | Built, and it lands (R4, R6: after "I watch for it in guests"). Jacket vs leg: D4-13. |

**C2 items not properly fixed:**
- **D3-2 / D2-12**: unreachable in an unbroken session (D4-1, blocker).
- **D3-3**: correct, but the D3-21 fix made its lower six branches dead (D4-2).
- **D3-21**: introduced a stale reopen at night (D4-12, minor).

The log's claim that the review's D3-3 route "now plays the 'asked' line" is true.

## Part 2: findings

### Blocker

#### D4-1 (blocker, local): Ffion's night question never plays in an unbroken session, so the whole Ffion → Terry chain is dead

- **Mechanism.**
  - Every one of Ffion's exits parks the story at `hub`'s choices (`m03_npc_ffion_rees.ink:78-80`, `:124-127`, `:143-148`, `:159-163`).
  - A reopen re-enters the knot that owns the saved choices (`person-chat-minigame.js:525-536`), not `start`.
  - So at night her story re-enters `hub`. The only way into `closing_up` (`:277-288`) is through `start`, and in a live session that happens only after the story has ended, which this ink never does.
  - Before cycle 1 the night hub offered "[You're still here? It's late.] → closing_up" (`git show adee101b^`, receptionist hub). D2-15 swapped it for "[Night, Ffion.]", which exits directly (`:143-148`).
- **What plays** (R1, R6, every player who hasn't reloaded since their last day-time talk with her):
  - "Ffion Rees: Found it. Charger was in the biscuit tin, don't ask." She has never said she was looking for a charger.
  - "[Night, Ffion.]"
  - "Go on, I'm locking the drawer. Don't let the guard scare you."
  - Then Terry opens with the generic "Hey! What are you doing here?" (`:57`).
- **What should play** (R2 and R5, only because they reload first): "Oh! You made me jump. I only came back for my charger. Is Ms. Sterling expecting you this late?", the three answers, and Terry's three readings.
- **Why it's a blocker for this round.** It breaks no puzzle. But it is the scene two cycles were spent on (D2-12, D3-2, "Scenes #3"), Ffion's "I'll tell the guard you're about" is the S3 promise the C2 review checked, and the line that plays instead refers to a setup nobody heard. The C2 loopcheck ran "Ffion at night" from `start`, which the engine never uses here, so the static checks couldn't catch it.
- **Fix** (two lines at the top of `hub`, before the quiet check):

  ```ink
  === hub ===
  { mission_phase == "act2_infiltration" and not night_greeted:
      -> closing_up
  }
  ```

  `closing_up` sets `night_greeted` and goes to `night_answer`, whose exits return to `hub` with `hub_quiet`. The next reopen then prints "Found it. Charger was in the biscuit tin", which now has its setup. Verify with a multi-visit script that talks to her by day, then reopens at night *without* restarting at `start`. My `routes/r1_smooth.json` does this, and fails on the current ink. On a patched scratch copy (`scratchpad/m03-dialogue-review-c3/fixtest/`) the same route plays "Oh! You made me jump..." and the notebook answer, and Terry opens with "Ffion said there'd be someone about."

### Majors

#### D4-2 (major, local): since D3-21, the test answer pre-empts every read-back below it, and six authored lines can't play

- **Why.** `clone_debrief` now sends every player with no answer to `the_question` (`m03_npc_victoria.ink:488-490`), and you can't reach the night without a saved card. So `victoria_test_answer` is always "sold", "hedged" or "asked" at night. The chain at `:534-557` stops at the test, and these never play (the only exceptions are a reload or a closed chat during the clone):
  - `:545` "You asked me the questions a prosecutor asks. Recruits ask about the salary." (new in cycle 2);
  - `:548` "You were rude this afternoon... Nerves don't come back at eleven at night." (D2-16);
  - `:550`, `:552`, `:554` the goodbye-stance lines (Scenes #6). `afternoon_goodbye` is set only *after* the test in `clone_debrief`, so it can never be the deciding branch;
  - `:556` the else line.
- **Cost.** The night opener no longer reflects how the player behaved, only how they answered one question:
  - a rude, high-suspicion player who said "sold" hears "You said it very quickly. The ones who mean it take longer." (R1 shape), the same line as a smooth one;
  - the goodbye stance, a cycle-1 consequence, is now set and never read.
- **Fix** (pick one; I recommend (a)):
  - (a) Keep one read-back, and let the stance add a second line only where it sharpens the first. After the test line, add:

    ```ink
    { afternoon_goodbye == "keen" and victoria_test_answer == "sold":
        Victoria Sterling: And you told me this was exactly the work you'd been looking for. I believed you. That's the part I mind.
    }
    ```

    Then move the suspicion line above the test answers for heavy suspicion only (`victoria_suspicious >= 20`). It then replaces the test line for a player she had marked by the end of the afternoon. Delete `:548`, `:552`, `:554` and `:556`, plus the goodbye "undecided" and "thanked" writes, or keep those two writes as plain flavour with a comment.
  - (b) Accept the test as the universal read-back. Delete the six dead lines and the `afternoon_goodbye` variable, and say so in the log.
- Either way the opener stays at two Victoria lines before the guard and "Who are you with?".

#### D4-3 (major, local): Terry doesn't recognise the recruit he spoke to that afternoon, then quotes their conversation

- **Route** (R1, R5, notebook probe): the player meets Terry by day ("Afternoon. Executive wing's staff only", `m03_npc_terry_mott.ink:83`; the knock-off question, `:95`). At night:
  - "Hey! What are you doing here? Building's closed for the night." (`:57`);
  - on the work excuse, "I don't recognise you, and I know most of the faces here." (`:166`) and "No badge, a face I've never seen" (`:229`);
  - then, in the same scene, "Told you this afternoon. On till six." (`:360`).
- **Why it matters.** Night at Zero Day is a cover-maintenance game (D3-2's whole premise). A guard who met your cover at three o'clock and doesn't place you at eleven makes the cover meaningless. Recognition is also the better beat: the player's afternoon lie and night lie meet in one man.
- **Fix** (local; `day_greeted` already exists):
  - Opener else-branch: `{day_greeted:Terry Mott: You. The three o'clock. Building's shut, and you're a long way from the conference room.|Terry Mott: Building's shut, mate. So you're either lost or you're trouble.}`.
  - `:166` when `day_greeted`: "You don't work here. You were in reception at three with a visitor badge."
  - `:229` when `day_greeted`: "No badge, a visitor this afternoon, and back at eleven. Pull the other one."
  - The files excuse when `day_greeted` and `ffion_night_story != "sterling"`: "Ms. Sterling told me nothing about it. She told me nothing this afternoon either." This also calls back to `:84`.

#### D4-4 (major, local): the debrief is 38 to 50 lines with five choices, and the second half still runs 12 to 13 lines straight

- **Measured on all six routes:**
  - the debrief is 38-50 HaX lines and 5 player choices;
  - runs with no choice: 10 (opener to the Victoria choice), 11 (`victoria_recruited_path` → `directive_substance`), 11 (Architect → Danny), and 12-13 after the Danny reply (`what_made_it_possible` → `final_assessment` → `aftermath`).
- **What earns its place.** The Victoria fate, the Danny fate with its new reply, the directive, and the one Architect beat.
- **What doesn't:**
  - `what_made_it_possible` (`:434-444`), a 4-line security recap with no choice. It's a lecture in the voice bible's sense, and it's the main reason the last run is 13 lines;
  - the catalogue's three lines (`:471-481`);
  - three rest/sleep lines in a row (D4-6).
- **Fix** (cuts about ten lines per route, no structure change beyond one knot):
  - Turn `what_made_it_possible` into a player question inside `aftermath`: `* [What should they have locked down?]` → keep the badge line and the distcc line, drop the password line or keep it gated. A player who doesn't ask skips the recap. It is defender teaching, so keeping it optional matches "teaching comes through the VM work and the field guides".
  - Cut `:103` "Let's go through it." `mission_impact` already does that.
  - Fold the catalogue to one line per branch: non-recruited "The catalogue goes out as an anonymous advisory, and every buyer on it learns we've read it."; recruited "The catalogue trickles out as routine advisories, so nothing points back at her."
  - Fix D4-6 (rest lines).
- With these, the longest debrief run drops to about 8, roughly the field conversations' maximum.

### Minors

| # | Tag | File:line | Finding | Fix |
|---|---|---|---|---|
| D4-5 | minor, local | debrief `:142`, `:161` | On the recruited branch, "A lot of ifs riding on someone who priced a hospital." is followed four lines later by Netherton's "she priced a hospital" on the cover sheet (R5). The echo spends the Netherton beat before it lands. | `:142` "...A lot of ifs riding on a woman who invoices by the body." Or end at "If the Architect doesn't smell it." |
| D4-6 | minor, local | debrief `:499`, `:520`, `:531` | Three rest lines in six (R2, R3): "It's done. Get some rest. We'll need you soon." → "[What's my next assignment?]" "Rest first..." → "Go home and get some sleep." | `:499` "It's done. We'll need you soon."; `:520` "Then we see where ENTROPY surfaces. Take one cell down and it shows you the next."; keep `:531`. |
| D4-7 | minor, local | debrief `:298`, `:303` | Diplomatic + protected: "You gave him the way in and he took it." then, four lines on, "You gave him room to come in by himself. That's why he did." The same idea twice (R1). | Cut `:303`, or make it the approach line's own idea: "You didn't push. He noticed." |
| D4-8 | minor, local | Terry idle `:560` → start `:47` | A player who met Terry by day gets "The guard's torch swings your way again." then "[Talk to the guard]" then "A torch beam swings round and settles on you." Two torches, an extra click, and "again" on a first night meeting (R1, R5). | In `guard_idle`, `{mission_phase == "act2_infiltration" and not player_warned: -> start}` before the quiet check, the same pattern as D4-1. |
| D4-9 | minor, local | Terry `:131-135` | Notebook story, files excuse: "Funny. Ffion said notebook." / "Ms. Sterling did mention a recruit... alright." He catches the lie and accepts it in the same breath. | "Funny. Ffion said notebook." / "Notebook, files. Make your mind up. Five minutes, and I'm stood at the end of the corridor." Set `guard_suspicious` (already true) and skip the +10 influence in `excuse_victoria` with a flag, or leave the numbers. |
| D4-10 | minor, local | Terry `:51`, `:111` | Notebook route: "Conference room's the other end of the building." then "Other end, mate." two lines later. | `:111` "Then you've taken the scenic route. Through the executive wing." |
| D4-11 | minor, local | Victoria `:269`, `:285`, `:309` | `ethics_response_nuance`: "Interesting question. Where would you draw it?" → "She waits... she does." → two lines → "My turn. One question." She has just asked one (R5). | Opener when `topic_ethics`: "Now one of mine. I ask everyone, and most people get it wrong." And W3-3 for `:269`. |
| D4-12 | minor, local | Victoria `:304`, `:480` | If the player closes the chat at the D3-21 question (the card is already saved) and walks out, the night reopen re-enters `the_question`: "Before you go. One question..." at 11pm, then "That's enough philosophy for one afternoon." (probe `r8_closed`). `clone_debrief` had the same exposure before cycle 2. `night_on_call` never plays, so `sterling_on_call_seen` and its hint are lost. | `{ clone_call_done: -> start }` as the first line of `the_question` and of `clone_debrief`. |
| D4-13 | minor, local | Victoria `:350`, `:440`, `:458` | The cloner is "in your pocket" and "buzzes once against your leg", but its light "shows through the cloth" of your jacket. | `:440` "Her eyes drop to your pocket, where the cloner's light shows through the cloth." |
| D4-14 | minor, local | Victoria `:573-576` → `:588-590` | St. Catherine's route: "a buyer's problem" and the ProFTPD price, then the_reckoning's "Better a professional who logs the sale than a criminal who doesn't". The same defence twice in five lines, and seven Victoria lines around one choice (R2). | On this route only, skip `:590`: gate it `{not came_via_hospital}` with a local flag set on the St. Catherine's choice. |
| D4-15 | minor, local | Victoria `:619-623` | The doorway reveal follows "All of it replaceable." with no turn, so it reads as a new paragraph rather than a last card. | Start it "One more thing. You stood in my doorway earlier..." |
| D4-16 | minor, local | debrief `:84-86` | Terry catches a pick once, then the player fights and KOs him (R6): "Security flagged one run-in with the guard. You recovered, but you left a mark on the log." Nothing about the KO until "Not cleanly". "You recovered" is false. | `{guard_knocked_out:Agent HaX: The guard caught you once, and then you put him on the floor. That's not a mark on the log, that's the log.\|...current line}`. |
| D4-17 | minor, local | debrief `:74-75` | Bribed: "The guard never logged you, because you'd talked your way past him." The player paid. | `{guard_bribed:...because you'd paid your way past him\|...talked your way past him}`, using an inline choice between fixed strings. |
| D4-18 | minor, local | briefing `:45-61`, `:117` | "[Skip the background. What's the mission?]" → "Right to business." then four lines of background anyway (`:52-53`, `:58-59`), 9 lines with no choice (R3). "Three things, then." refers back to nothing on this route. | On the skip route, go from `:47` straight to `:58-59` (skip `:52-53`). Make `:117` `{skipped_background:Three things.\|Three things, then.}`. |
| D4-19 | minor, local | debrief `:327`, `:397` | HaX: "...the deception's real and he's cooperating." The player's next choice: "[I'll give evidence for him. The deception was real.]" | "[I'll give evidence for him. She lied to him first.]" |
| D4-20 | minor, local | debrief `:152` | "Counter-intelligence has her." followed by "She stays at Zero Day so nothing looks wrong." Two lines that read as a contradiction. | "Counter-intelligence is running her now." |
| D4-21 | minor, local | Ffion `:111-112` | Code comment still says the tip "helps at the whiteboard" (the C2 log corrected this). | "The modest answer earns flavour and influence." |
| D4-22 | minor, local | phone `:367`; phone `:448` | "Danny's dealt with" after protecting him reads like a body. "They chose the ward for Ghost": the survey was of hospitals (D3-15's unit point, still on the phone). | "Danny's made his call."; "They chose the hospital for Ghost." |

## Part 3: playing it as a player, and raising the bar

### Flow across whole routes

- **The afternoon is now the best stretch of the mission.** On every route the test arrives after one topic (or, via D3-21, right after the clone). It is the first moment the recruit is under pressure, and the read that follows plays as a heist: "Halfway", the cloner's light for a player who pushed her, "Nearly there", the buzz. The first third is still three lecture beats (`first_impression` → `philosophy_intro` → `market_efficiency_pitch`), but at 2-3 lines each with a choice between them it no longer drags (R1: 6 choices before the test).
- **The night is where the joins show.**
  - In an unbroken session the reception scene is one line that refers to a setup the player never heard (D4-1).
  - The guard who met you at three doesn't know you at eleven (D4-3), and he greets you with two torches (D4-8).
  - Victoria's opener is right-sized now. Her read-back reflects the test answer and nothing else (D4-2).
  - The close, with the doorway reveal, is the strongest scene in the mission on R1, R3 and R6. "I said I'd do it myself. I still might." followed by "you have exactly one move" is a proper TV-thriller ultimatum.
- **Lines that only make sense on another route:**
  - "Found it. Charger was in the biscuit tin" (D4-1);
  - "Three things, then." after skipping (D4-18);
  - "You recovered" after a fight (D4-16);
  - "talked your way past him" after a bribe (D4-17);
  - "Before you go" at 11pm (D4-12);
  - "My turn" straight after her own question (D4-11).
- **The same idea twice:**
  - "priced a hospital" (D4-5);
  - three rest lines (D4-6);
  - Danny "came in by himself" (D4-7);
  - Victoria's defence on the St. Catherine's route (D4-14);
  - Terry's "other end" (D4-10);
  - HaX and the player on "the deception's real" (D4-19).
- **The deliberate echoes work and should stay:**
  - "I said I'd deal with it myself" (the call) / "I said I'd do it myself" (the close);
  - Terry's "She never said nothing to me" against his afternoon "she'd have told me. She hasn't";
  - "You're the second person to say that this morning. He was the first."
- **Tonal jumps.**
  - Terry takes the thinnest maintenance lie ("I didn't hear about any alerts...") and then asks "Anything else, or are we done?" (R4, `:216` → hub `:334`). His hub greeting should stay cold while `guard_suspicious`: `{guard_suspicious:Terry Mott: {&Well?|Go on.|I'm listening.}|...}`.
  - HaX's "They've sent out for more tape." (`:395`) is a joke about a man facing years. It works because the player chose "Let him", but only just.
- **Time without a choice.** Outside the debrief, never more than 9 lines (the briefing). In the field, never more than 7 (Danny's confession, which earns it). The debrief is the outlier (D4-4).

### Does the debrief earn its length?

Not yet, but it's close. Per route it is 38-50 HaX lines and 5 choices.
- **The first half earns it:**
  - the stealth verdict;
  - "Finance will want a receipt.";
  - the Victoria fate and its stance;
  - "St. Catherine's was the test run. This is the order book.";
  - the Danny fate, now with a reply.
- **The second half doesn't.** After the Danny reply the player gets 12-13 lines in a row:
  - a 4-line security recap;
  - a list of what they left behind;
  - three catalogue lines;
  - the trust line;
  - the three-line aftermath;
  - then a choice whose answer is "Rest first", followed by "Go home and get some sleep".
- D4-4 cuts about ten lines and makes the recap a question. That makes the debrief as long as its consequences, which is the m01/m02 standard.

### The 10 weakest remaining lines

Before suggesting each change I grepped m04–m08 for the phrases involved ("three o'clock", "thorough", "supply chain", "late requests", "lost or", "priced a hospital", "deception"). No later mission calls back to any of them. The "thorough" hits in m04 and m06 and the "Supply Chain Saboteurs" in m07 are unrelated.

| # | File:line | Now | Rewrite | Why |
|---|---|---|---|---|
| W3-1 | `m03_npc_victoria.ink:91-92` | You must be the candidate. Welcome to WhiteHat Security. / I'm Victoria Sterling, CEO. Have a seat. | Victoria Sterling. Sit down. Let's see if you match your file. | The villain's entrance is a receptionist's script. One line in her own voice, and it puts the player under assessment from the first word (W-1 then follows it). |
| W3-2 | `:255` | Go ahead. I've heard every argument. | Go on. Everyone brings a speech about it. | Stock. Hers is drier. |
| W3-3 | `:269` | Interesting question. Where would you draw it? | You tell me. Where would you draw it? | "Interesting question" is filler, and it sets up the "My turn" collision (D4-11). |
| W3-4 | `:570` | Then you've read more than most of my staff. You really have been thorough. | Then you've read more than my accountant. He'll be disappointed. | The tail is the same as `:567`'s and adds nothing. The rewrite is the money motif, with contempt. |
| W3-5 | Terry `:57` | Hey! What are you doing here? Building's closed for the night. | Building's shut, mate. So you're either lost or you're trouble. | The C2 rule: Terry never shouts a full sentence, he gets shorter. This is the most-heard Terry night line. |
| W3-6 | Terry `:172` | Just surprised to see someone here this late. | Didn't have you down as a night person. | Generic. The rewrite is dry and still suspicious. |
| W3-7 | Terry `:188-189` | Ms. Sterling does sometimes have late requests. / What files are you supposed to grab? | She does ring down at odd hours. Which files? | Two stiff lines become one in his register. |
| W3-8 | debrief `:58` | There you are. Sit down before you fall down. You've earned it. | There you are. Sit down before you fall down. | "You've earned it" is the stock compliment the voice bible says HaX shows rather than says. The first sentence already does it. |
| W3-9 | debrief `:518` | Ghost's still out there. But last night you put the people who armed them on paper. That's ENTROPY's supply chain. | Ghost's still out there. The people who armed them are on paper now. | The last sentence explains the one before it. Shorter, and true on the recruited branch too. |
| W3-10 | debrief `:467` | What you brought out is enough to prosecute and enough to warn people. More would have helped. It usually does. | Enough to charge and enough to warn. Not everything. It never is. | Three clauses of report-speak become her rhythm. |

Also worth a look: Ffion `:105` "Is this your first time working with a Cyber Security firm?" reads like a form ("First time at a place like this, is it?" is her). And `m03_npc_victoria.ink:348` "*curtly* The training lab. Since you're so interested." plays for any player under 20 influence, including a polite one on their first question (R3). Gate the sarcasm on `victoria_suspicious >= 5` and give the rest "The training lab. Have a look."

### Scenes that still land flat

1. **The reckoning without the ledger** (R3). A player who never read the transaction log or took HaX's revelation call gets one choice at the_reckoning (`:591`). That is a click, not a choice, at the mission's climax. Add an ungated second option:

   ```ink
   + [You could have walked away from that sale.]
       Victoria Sterling: I did walk away. With twenty-five thousand.
       -> the_reckoning_close
   ```

2. **Ffion at night** (D4-1), once it plays. It is a good small scene: the one civilian who tests the cover, and her answer reaches the guard.
3. **Terry recognising the recruit** (D4-3). The scene the cover-maintenance chain is missing.

### Characters

- **Ffion:** right by day. "Turned away a lad who'd been on the telly last spring." and "Ask her. Actually, don't, you'll be here till six." are her. At night she has, in practice, one line (D4-1).
- **Terry:** right whenever he's dry: "Pays the mortgage...", "It's Terry, since you didn't ask.", "Obstructing. Lovely.", "That's a lot of laminate for people nobody's heard of." His night opener (W3-5), his failure to recognise the recruit (D4-3) and his chatty hub after a weak lie are the slips. Nothing in the ink needs to reflect the new art.
- **Victoria:** the strongest voice in the mission from the test onward. Her first two lines (W3-1) are the weakest she has.
- **HaX:** the fate lines and the new replies are the best HaX writing in m03. The recap (D4-4) is the one stretch where she lectures.

## Structure and skill checklist (§2a–§2i)

| Check | Result |
|---|---|
| 2a Attribution | OK. Every prefix resolves; no new speakers. |
| 2a-bis Supported by scenario | OK, with one note: the cloner is in a pocket (D4-13). The window and the bag are narration inside the chat. |
| 2a-ter Voices | OK. Ffion's Cardiff style and Terry's Essex style are explicit. Nothing in the ink conflicts with Terry's new art. |
| 2b Choices spoken | OK. The new reply choices are first-person speech. |
| 2c Hub structure | OK in the ink. **But Ffion's hub at night is a dead end for the scene it should open** (D4-1). Terry's idle adds a redundant click at night (D4-8). |
| 2c-bis Starved knots | OK. loopcheck is clean on every state tried, including the cycle-2 knots. |
| 2d Choices that matter | Test answer: remembered, and now the only night read-back (D4-2). Goodbye stance: set, never read (D4-2). Ffion's night answer: read by Terry, but the question doesn't play (D4-1). Target selection: read by the debrief. Danny × Victoria: paid off, with a reply. The no-ledger reckoning has one choice (Scenes #1). |
| 2d.4 S1–S8 | No softlock. One stale reopen (D4-12, the S1 family: a once-only afternoon knot re-entered at night). |
| 2e Cross-file state | OK. Nothing undeclared or dead at the declaration level. Functionally dead: `afternoon_goodbye` (D4-2); `ffion_night_story` without a reload (D4-1). |
| 2f Influence tags | OK. Every `+=`/`-=` in the cycle-2 lines is tagged, including the mismatch -5s. |
| 2g Syntax | OK. |
| 2h KO | OK. The receptionist-KO day opener and walk-back read well (R4). The debrief misses a guard KO after a detection (D4-16). |
| 2i Recurring bugs | A greeting with no setup (D4-1). Status answers: "Where do I stand?" checked at five points on R6 and correct at each (one wording slip, D4-22). Credit against route: D4-16, D4-17. Same fact twice: D4-5, D4-6, D4-7, D4-10, D4-14, D4-19. |

## Prioritised action list

**Must fix**
- D4-1: Ffion's night hub routes the first night visit to `closing_up`. Prove it with a day-then-night script that doesn't restart at `start`.

**Should fix (this cycle)**
- D4-2: decide the read-back (recommend (a)); remove or reconnect the six dead lines.
- D4-3: Terry recognises the afternoon recruit (`day_greeted`).
- D4-4: shorten the debrief's second half; make the security recap a question.
- D4-12: guard `the_question` and `clone_debrief` against a night reopen.
- D4-16, D4-17: the debrief's guard lines against the KO and bribe routes.

**Worth doing**
- W3-1 to W3-10; the no-ledger reckoning option (Scenes #1).
- D4-5 to D4-11, D4-13 to D4-15, D4-18 to D4-22.

**Process note for the fixer and the next reviewer.** Prove reopen behaviour with a script that plays one NPC by day and reopens it at night through the knot that owns the saved choices. Don't jump to `start`: that is how D4-1 slipped past two cycles of loopcheck. `scratchpad/m03-dialogue-review-c3/route.js` does this and can be reused (copy it into `tools/` if it should outlive the session).

## For the user

- Nothing here needs approval. Every finding is mission-local, and m03 has no audio.
- **One finding is about the engine's behaviour, not a request to change it** (no engine change proposed). A person-chat NPC whose exits all park at a hub keeps that position for the whole session, and the server keeps only its variables across a reload. So a scene behind `start` can play for players who reloaded and never for players who didn't. m03's Ffion is the casualty here. Any NPC in another mission that relies on `start` re-routing between phases may have the same gap. It might be worth a validator or reopencheck rule for person-chat in a later pass; that would be approval territory.

## Verdict and counts

**Verdict: revise.**
- Cycle 2's writing is good and mostly lands in play: the test pays off at night, the doorway reveal makes the close, and the Danny replies give the debrief a pulse.
- But the Ffion → Terry chain, which cycles 1 and 2 built, can't reach a player who doesn't reload (a blocker for this round, though not for play).
- D3-21 quietly made six night read-back lines dead.
- Terry forgets a face he saw that afternoon.
- The debrief's last stretch is still a 13-line run.

All four are small fixes. Expect cycle 4 to confirm them and take the weakest-lines pass. Cycle 5 can then be a light read.

| Severity | Count | Ids |
|---|---|---|
| Blocker | 1 | D4-1 |
| Major | 3 | D4-2, D4-3, D4-4 |
| Minor | 18 | D4-5 .. D4-22 |

All 22 are mission-local.
- Weakest-line rewrites: 10 (W3-1 to W3-10, all voiced lines), plus two noted lines (Ffion `:105`, Victoria `:348`).
- Flat or missing scenes: 3 (all local).
- C2 items not properly fixed: D3-2 (with D2-12), unreachable; D3-3, lower branches dead since D3-21; D3-21, stale night reopen.
- Checks: static only (compile to the scratchpad, validator `--skip-ink --no-graph`, dialoguelint, reopencheck, loopcheck on 5 targeted states). Six full route walks and three probes ran with an inkjs driver that copies the engine's reopen behaviour. No browser run.
