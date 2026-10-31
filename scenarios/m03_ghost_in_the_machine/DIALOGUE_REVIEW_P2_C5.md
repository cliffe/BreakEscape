# m03 Ghost in the Machine: dialogue review, pass 2 cycle 5 (confirmation read)

Reviewer: fresh Opus, read-only, 2026-10-12. Skill: `npc-dialog-review`, run as a sign-off read. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M03_PASS2_BRIEF.md`). Inputs: `DIALOGUE_REVIEW_P2_C4.md`, "Dialogue cycle 4 fixes" in `IMPROVEMENT_LOOP_LOG.md`, commit fb3049cf. Line numbers refer to HEAD fb3049cf. The ink in the working tree matches it, and all eight files compile byte for byte to the committed JSON.

Scope, as the cycle-4 review asked: verify every cycle-4 finding at its line, read r1, r12, r14 and r16 in full as a player would, skim the other fourteen routes for regressions, and only raise new findings a player would notice.

## Step 1: checks

| Check | Result |
|---|---|
| Compile (`bin/inklecate`, scratchpad `c5/ink/`) | 8/8, no warnings, identical to the committed JSON. |
| Validator `--skip-ink --no-graph` | Schema passes. Known items only (4 `npc_ko:victoria_sterling` handlers, Terry's lockpick cutscene without `onceOnly`, `night_transition` visemes, two reception NPCs with no behaviour). One new warning, `behavior.torch` "unknown field" on Terry: that comes from the lighting L3 work. The engine reads the field (commit 33ecfbe7) but the validator's field list doesn't know it yet. It has nothing to do with the dialogue. |
| dialoguelint | 0 errors, the 2 justified warnings (Victoria `:634`, `:695`). |
| reopencheck (`missions.json m03`) | 0 problems. |
| loopcheck | 8 states, all clean: Terry `start` with a prior catch; `excuse_menu` warned and unanswered; `hostile_confrontation` re-entered; `guard_idle` warned and unanswered; `start` day-met with the sterling story; Victoria `idle` on the first night look-in; debrief `danny_reply_none`; Ffion `night_answer` re-entry. |
| Route driver | 18 routes. Lines, choices and longest runs match the fixer's table exactly (r1 243/65/9, r12 137/28/9, r14 102/28/8, r16 27/9/3). |

## Part 1: cycle-4 verification

Every finding and rewrite is in the ink as logged, and each one I could reach plays correctly on a route.

| C4 id | Verified at | Verdict |
|---|---|---|
| D5-1 card after recognition | Terry `:222-237` | **Fixed.** r16a: "A visitor badge at three and her card at eleven. / Either she's taken a shine to you or I'm in trouble. Ten minutes." He stays suspicious, so the exit is "I've got your face now." This is the best line of the rewrite. |
| D5-2 recognition inside Ffion's openers | `:58-63` | **Fixed.** r1: "...wouldn't say what for. Didn't say it was the three o'clock."; r5 and r9b: "The three o'clock, back again."; r7, r9 and r16c: "Should've known it'd be you." The afternoon lie and the night lie now meet in one man. |
| D5-3 picks opener | `:56-57`, `first_excuse :123-124` | **Fixed.** r16b opens "You. The one with the picks. Let's hear it, then." with no second question. See C5-1 for what happens three lines later. |
| D5-4 no greeting after a dismissal | `hub_quiet` on all six excuse exits; `:257-259` | **Fixed.** On r1, r4, r5, r9b, r12, r13 and r16, no greeting follows a dismissal. "Well?" now plays only on a return from a topic, where it reads as him waiting. "Mind how you go." plays on r9b, r13 and r16b, so "I've got your face now" is no longer the only exit and it lands when it does play. |
| D5-5 | `:208` | Fixed ("Maintenance? At eleven at night?", r4, r7, r11, r12). |
| D5-6 Victoria's first night look-in | Victoria `:784-786`, `:794` | **Fixed.** One click: the call plays straight away. "Sterling hasn't left." The second call print on r1 is an artefact of the route, not the game (see Housekeeping). |
| D5-7 phone Danny line | phone `:369-378` | **Fixed.** Four outcomes, fixed strings. `danny_ko` is a declared global (`scenario.json.erb:1845`) and set by `globalVarOnKO` (`:1768`). |
| D5-8 | debrief `:399` | Fixed ("You're starting to sound like her."). |
| D5-9 | debrief `:186` | Fixed. Gated on `transaction_log_read or roster_seen`; both are declared globals. |
| D5-10 Ffion's question survives a reload | Ffion `:151`, `:321-322`, `:337-341` | **Fixed.** r12: "Well? Is she expecting you?" after a reload. "Found it. Charger was in the biscuit tin" now only plays after an answer. |
| D5-11 Terry's question survives a reload | Terry `:25-28`, `:75-77`, `:135-141`, `guard_idle :641` | **Fixed.** r12: "Still waiting." then the four excuses. |
| D5-12 double count | `hostile_count :516-519` | **Fixed.** r11 reopens `hostile_confrontation`: the line replays, the count doesn't. |
| D5-13 no-Danny reply | debrief `:358-360`, `:433-440` | **Fixed.** r14: "Find him before they do." / "That's the plan. You could have saved us the trouble." Longest run 10 → 8. |
| D5-14 | debrief `:460` | Fixed. |
| D5-15 | `:195` | Fixed. |
| D5-16 | `:497-509` | Fixed. r1, r14: one "what's next", at the close. |
| D5-17 | Terry `:182` | Fixed (r5, r9b). |
| D5-18 | `:144-151` | Fixed. r7, r9, r16c end on "Back the way you came." and the next reopen is the guard's idle torch line. |
| D5-19 | Ffion `:59-66` | Fixed. r1: directions once; "Anyway. Sign in when you're ready." on the return from the company talk. |
| D5-20 | briefing `:59` | Fixed (r11, r15: "There's a Phase 2." comes before objective three). |
| D5-21 routes | r2, r7, r8 | **Fixed.** All three reach their ends. Four other routes still have stale picks (Housekeeping). None of them hides a game problem. |
| W4-1 to W4-4 | Terry `:129`, `:273-274`, `:233`, `:241` | All applied, and all play. Terry's night corridor is dry and short from the torch to the exit. |
| W4-5 to W4-10 | Ffion `:73`; Victoria `:129`, `:717`, `:740`; debrief `:273`, `:175` | All applied. "Competent is cheap." and "Some of what they bought from me is already installed." both do what they were meant to do. |
| Noted lines | debrief `:498`; Ffion `:61` | Applied. |
| Flat scenes | Terry at eleven; no-Danny debrief; first look-in | All three now play as one scene each. |

**Not fixed: none.** All 21 findings and 10 rewrites are done.

## Part 2: reading the four routes

- **r1 (smooth).** The briefing, the afternoon and the read play as before. At night: Ffion's question, a brushoff, then Terry's "Didn't say it was the three o'clock." The files excuse gets "She told me nothing this afternoon either," so the scene now has one consistent guard who remembers the afternoon. The look-in is one click. The close and the debrief (37 lines, 5 choices) are unchanged, apart from the shorter ending.
- **r12 (reloads).** All seven reload points recover cleanly: mid-read, after the card, Ffion's question, Terry's question ("Still waiting."), Danny's question, "Who are you with?" and her one move. Nothing replays that shouldn't, and nothing is skipped.
- **r14 (no Danny, no drive).** The escape with "Work for us" refused reads well ("In exchange for what?..." then "The sensible answer."). The no-Danny debrief now has a say.
- **r16 (Terry probes).** (a) and (c) are right. (b) has one wrong note, below.

Skimmed for regressions: r2 to r11b, r13 and r15. I saw no new problem. Terry's openers and exits are right on every Ffion story × day-met combination the routes cover, the bribe still holds, and the hostile branch counts once.

## Part 3: new findings

No blockers, no majors.

| # | File:line | Finding | Fix |
|---|---|---|---|
| C5-1 (minor) | Terry `:229-234`, `:257-259`, `hub :428-430` | A player caught at Sterling's door before any challenge, who then talks to him, gets "You. The one with the picks." If they then answer with the cloned card (r16b), or with the files story and "enrolment forms", the excuse clears `guard_suspicious`, and he says goodbye with "Mind how you go." He caught them with a pick set four lines earlier. D5-1 fixed this mismatch for the visitor; it still shows for the lock. It's a rare order of events (caught at a lock first, then talks to him), so it doesn't block the playtest. | Add `and guard_detection_count == 0` to both clears: `:232` wrap `~ guard_suspicious = false` in `{ guard_detection_count == 0: ... }`, and at `:257` use `{ (not day_greeted or ffion_night_story == "sterling") and guard_detection_count == 0: ...}`. The exit then becomes "I've got your face now." Two lines, no new text. |

### Housekeeping (routes and tools, not the game)

- **r1** still picks "Look in" at night. Since D5-6 the call plays on the first open, and the driver carries on past `#exit_conversation` while picks remain, so r1 prints the call twice. In the game it plays once. Drop the pick.
- **r12**'s debrief step picks "St. Catherine's", which no longer exists, so r12 stops before its debrief ends. **r11** and **r15** pick briefing options that are no longer there ("take the supplier", "What else are they planning"). **r6**'s second lockpick step lands on `lockpick_still_here` because `guard_grace` is still true; set `guard_grace:false` first to reach `lockpick_again`. The fixer's log calls these "deliberate probe steps", but they are stale picks. All four routes still cover what they were written for up to that point.
- **Validator:** add `torch` to the known `behavior` fields (lighting L3). This is outside the dialogue.

## Part 4: the two deferred callbacks

Both need a new scenario global, because `came_via_hospital` is local to Victoria's ink and the "Danny drew that survey" choice sets nothing.

1. **The debrief remembering a St. Catherine's opener ("You opened on St. Catherine's. Good. She should hear that name from us first."). Not worth adding.** The opener is a stance choice, and Victoria already answers it in the scene: the "arithmetic" follow-up, and `came_via_hospital` skipping the second defence. The debrief already credits the stronger version of the same move: "you got her to call it consultancy on an open line" when the player names the targeting (r12). A third line on the same idea would add length to the debrief, which cycle 3 worked to bring down.
2. **"Danny drew that survey for you." Worth adding, one line, when the erb is free.** It is the only place the player speaks up for Danny to Sterling, and nothing pays it back. One `#set_global:defended_danny:true` on the choice (Victoria `:670`) and one gated line before "He asked which floor they're holding Sterling on." (debrief `:320`) would join the two scenes. For example: "I told him what you said to her about the survey. He went quiet for a long time." Keep it to the protected and exposed fates, because those are the ones where HaX has spoken to him. It does not need to happen before the blind playtest.

## Verdict

**Ship.** The dialogue is ready for the blind playtest.

- Cycle 4 did everything it logged. All 21 findings, the 10 rewrites, the 2 noted lines and the 3 flat scenes are in the ink, and each one I could reach plays correctly.
- Terry's night corridor now plays as one scene on every route: Ffion's call reaches him, he places the face, the card and the excuses respect what he knows, and his exits change with how the lie went.
- The single new minor (C5-1) is a rare-path tone slip with a two-line fix. Take it in passing if anyone touches Terry again; it doesn't need another review cycle.

| Severity | Count | Ids |
|---|---|---|
| Blocker | 0 | |
| Major | 0 | |
| Minor | 1 | C5-1 |
| Housekeeping | 3 | stale route picks (r1, r6, r11, r12, r15); validator `torch` field |

Cycle-4 items not fixed: none. Checks were static only (compile, validator, dialoguelint, reopencheck, loopcheck on 8 states, 18 route walks). No browser run.
