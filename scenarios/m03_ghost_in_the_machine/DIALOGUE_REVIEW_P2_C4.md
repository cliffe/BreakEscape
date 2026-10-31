# m03 Ghost in the Machine: dialogue review, pass 2 cycle 4

Reviewer: fresh Opus, read-only, 2026-10-12. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M03_PASS2_BRIEF.md`). Inputs: `DIALOGUE_REVIEW_P2_C1.md` to `_C3.md`, "Dialogue cycle 3 fixes" in `IMPROVEMENT_LOOP_LOG.md`, commit 341be38e. m03 has no audio, so no rewrite here costs anything in TTS.

Finding ids: `D5-n` (cycle 4). Weakest lines: `W4-n`. Tags: **blocker / major / minor**. Every finding is mission-local unless it says otherwise. Line numbers refer to the files at HEAD 341be38e. The ink in the working tree is unchanged, and all eight compiled files match the committed JSON byte for byte.

## Step 1: compile, validator, lint, runtime checks

**Compile.** 8/8 compile with `bin/inklecate` into the scratchpad (`m03-dialogue-review-c4/`), with no errors and no loose-end warnings. All eight match the committed JSON exactly.

**Validator** (`--skip-ink --no-graph`). Schema passes. Only the known, justified items remain: the 4 `npc_ko:victoria_sterling` handlers on `agent_0x99`, Terry's lockpick cutscene without `onceOnly` (deliberate), the `night_transition` visemes suggestion, and two "no behavior" notes on reception NPCs. No unresolved speaker prefixes, dead `VAR`s or undeclared `#set_global`s.

**dialoguelint.** 0 errors, 2 warnings. Both have been justified since cycle 1: `m03_npc_victoria.ink:634` ("That isn't cruelty. It's arithmetic.") and `:695` (choice length 18). No fall-through, blank re-entry, exit-no-reply, tag-on-narrator or cue-density findings.

**reopencheck.** 0 problems. The m03 phone: 454 reopens, 0 problems.

**loopcheck.** Clean on the states I suspected:
- Ffion's `hub` at night before `night_greeted`;
- Ffion's `ask_danny` at night;
- Victoria's `clone_check_2` with the card saved at night;
- Terry's `guard_idle` at night after a detection;
- Terry's `hostile_confrontation` re-entered;
- the debrief's `aftermath_choices` on ko + ko.

**Route walks.** `scripts/ink_runtime_check/m03_routes/route.js` is the main evidence again. I ran all eleven existing routes and wrote seven new ones (saved in that folder):

| Route | Path | Lines | Choices | Longest run with no choice |
|---|---|---|---|---|
| r11_rude | rude to everyone: skip, sign-and-go, needles Sterling, dropped read and walk-back, brushes Ffion off, snaps at Terry ("Wrong answer"), condemns Danny, hospital opener, arrest | 175 | 41 | 8 (briefing) |
| r11b_rude_lowinfluence | rude, but walks it back before the board, so there's no dropped read: which read-back plays at night? | 59 | 15 | 5 |
| r12_reload_everywhere | reloads mid-read; at the test after the card is saved; at Ffion's night question; at Terry's first question; at Danny's question; at "Who are you with?" and at her one move | 133 | 26 | 9 (debrief) |
| r13_sold_then_protect | "sold" and "keen" by day, then protects Danny, opens the night on St. Catherine's, names the ten thousand, arrests | 119 | 28 | 9 (debrief) |
| r14_no_danny_no_drive | never meets Danny, never takes the revelation call, no drive, no paper; "Work for us" refused, then lets her go | 101 | 27 | **10** (debrief) |
| r15_ko_heavy | Ffion KO by day, Sterling KO in the meeting (Nightshade's card), Terry KO after a catch, Danny KO | 83 | 18 | 9 (debrief) |
| r16_terry_probes | Terry met by day then shown the cloned card; caught picking before any challenge; met by day with Ffion's "notebook" | 24 | 7 | 3 |

The existing routes, re-run:

| Route | Lines | Choices | Longest run |
|---|---|---|---|
| r1 | 244 | 65 | 9 |
| r2 | 193 | 49 | 9 |
| r3 | 149 | 32 | 9 |
| r4 | 127 | 29 | 9 |
| r5 | 188 | 47 | 8 |
| r6 | 217 | 67 | 9 |
| r7 | 17 | 6 | 3 |
| r8 | 28 | 6 | 5 |
| r9 | 36 | 12 | 6 |
| r9b | 26 | 10 | 3 |
| r10 | 77 | 16 | 9 |

These match the fixer's log. Three of them now stop early on stale picks, so they no longer reach the ends they were written for (D5-21):
- r2: "What do you need";
- r7: "Building maintenance" after the reload;
- r8: "Take the forty".

**The debrief is now 27 to 37 lines with 4 to 6 choices on every full route** (38 to 50 lines before cycle 3). Its longest run is 9 lines on most routes, and 10 when the player never met Danny (D5-13). In the field nothing runs longer than 7 lines (Danny's confession). The briefing runs 8.

**Two candidates withdrawn after checking the code:**
- **Mid-scene KO replay.** After a mid-confrontation KO, Victoria's night opener replays in the driver (r4's last step), because `nighttime_confrontation` has no `victoria_fate == "ko"` hand-over. The player can't reach this: a KO'd NPC can't be interacted with (`public/break_escape/js/systems/interactions.js:1733`).
- **Stale distcc status.** "Where do I stand?" says "Just distcc left" (`m03_phone_agent0x99.ink:379-380`) in a state where all four flags are in but `night_confrontation_ready` is false. That state can't happen: the fourth flag sets it (`scenario.json.erb:952-968`).

## Part 1: cycle 3 verification

I read every line the log cites and walked each change on at least one route.
- All 22 findings, the 12 rewrites and the 3 scenes are in the ink as logged.
- D4-1, the night hand-over sweep, D4-2, D4-4, D4-8 and D4-12 work in play.
- Two items don't fully reach the player: **D4-3** (Terry's recognition) and **D4-22** (the phone's Danny line).

| C3 id | Claimed | Verified at | Verdict |
|---|---|---|---|
| D4-1 Ffion's night question | hub routes the first night visit to `closing_up` | `m03_npc_ffion_rees.ink:147-149` | **Fixed.** r1, r6, r9 (no reload) all play "Oh! You made me jump..." and the three answers. The next reopen plays "Found it. Charger was in the biscuit tin", which now has its setup. Terry reads all three stories (r1 brushoff, r7/r9 notebook, r5/r9b sterling). One gap after a reload or a closed chat (D5-10). |
| Night hand-over sweep | 7 Ffion knots, 10 Victoria knots, Terry `daytime` and `guard_idle` | Ffion `:55,89,114,185,213,240,265`; Victoria `:125,151,186,236,276,333,419,450,488,539`; Terry `:84`, `:583-585` | **Fixed, and safe.** See "Hand-overs" below. One parallel spot was missed (Victoria's `idle`, D5-6), and one hand-over lands on the wrong line after a lockpick catch (D5-3). |
| D4-2 night read-back | read_dropped → suspicion ≥ 20 → influence < 10 → test → else; "keen" adds one line to "sold" | Victoria `:591-615` | **Fixed.** Five different read-backs on my routes: "inventory" (r2, r11), "rude" (r11b), "sold" + "keen" (r1, r13), "hedged" (r3, r14), "asked" (r6), plus the else line after a reload (r12). Every one is true where it plays. The goodbye writes are gone except "keen" (`:554`). |
| D4-3 Terry recognises the recruit | four `day_greeted` lines | Terry `:57-58`, `:181-182`, `:150-154`, `:247-248` | **Partly fixed.** All four lines play (r9b, r16a). But the opener loses recognition whenever Ffion has spoken to him (D5-2), and the work-excuse line now runs straight into his accepting a cloned executive card from the man he has just called a visitor (D5-1). |
| D4-4 debrief length | recap made a question; folds; rest lines cut | debrief `:438-447`, `:516-528` | **Fixed.** 27-37 lines, 4-6 choices, longest run 9 (10 with no Danny, D5-13). `aftermath_choices` is sound: the recap returns to three once-only exits, so it can't starve (loopcheck clean). Two polish items: D5-14, D5-16. |
| D4-5 | "invoices by the body" | debrief `:148` | Fixed (r5). |
| D4-6 | one rest line | `:497`, `:521`, `:532` | Fixed. A milder echo remains (D5-16). |
| D4-7 | "You didn't push. He noticed." | `:307` | Fixed (r1). |
| D4-8 | first night meeting goes straight to the challenge | Terry `:583-585` | **Fixed** (r1, r9: one torch, no extra click). The check sits inside the quiet-flag else, so it can't fire on an exit (the exit sets `idle_quiet` and `guard_idle` consumes it in the same pass). |
| D4-9 | notebook + files has teeth | Terry `:141-145` | Fixed. |
| D4-10 | "scenic route" | `:118` | Fixed. A small exit issue remains (D5-18). |
| D4-11 | "Now one of mine" | Victoria `:340-341` | Fixed. |
| D4-12 | no "Before you go" at 11pm | Victoria `:333-335` | **Fixed** (r8 plays her night call). |
| D4-13 | pocket | `:495` | Fixed. |
| D4-14 | `came_via_hospital` skips the second defence | `:630`, `:649-651` | Fixed (r2, r11, r13). |
| D4-15 | "One more thing." | `:687` | Fixed. It lands now (r1, r3, r6). |
| D4-16 | catch then KO | debrief `:91-92` | Fixed (r6, r10, r11, r15). |
| D4-17 | bribe | `:76-77`, `:103-104` | Fixed (r3, r10). The receipt line isn't said twice. |
| D4-18 | skip route | briefing `:54-59`, `:118` | Fixed (r3, r11). A small setup gap is left (D5-20). |
| D4-19 | "She lied to him first." | debrief `:401` | Fixed. |
| D4-20 | "running her now" | `:159` | Fixed. |
| D4-21 | code comment | Ffion `:123-124` | Fixed. |
| D4-22 | phone "Danny's made his call." | phone `:367` | **Wording changed, still wrong.** The line is true only when Danny is protected. It is false for exposed, left and ko (r15 plays it with Danny unconscious). See D5-7. "They chose the hospital" is fixed (`:448`). |
| W3-1..W3-10 | applied | Victoria `:92,280,294,627`; Terry `:60,191,207`; debrief `:58,512,469` | All applied. W3-1 ("Let's see if you match your file.") is the best of them. |
| Noted lines | Ffion "First time at a place like this, is it?"; whiteboard sarcasm gated | Ffion `:117`; Victoria `:384-388` | Applied (r3: "The training lab. Have a look."; r2: the curt line). |
| Scene #1 the reckoning without the ledger | ungated "[You could have walked away from that sale.]" | Victoria `:664-666` | Fixed, and good. "I did walk away. With twenty-five thousand." plays well on r11 (after the hospital opener), r11b and r14. |
| Terry's cold hub | `{guard_suspicious: Well?...}` | Terry `:357-361` | Built, but it is now the only greeting anyone hears, and it prints straight after his dismissals (D5-4). |

**Hand-overs.** Each new `-> start` lands on `start`, which routes by phase:
- Ffion goes to `closing_up`, so either the question or the hub's "Found it..."/"I'm going, I'm going."
- Victoria goes to `night_on_call` or `nighttime_confrontation`. Her fate is never set at this point, because she isn't interactable once KO'd.
- Terry goes to his challenge, or to "You again." once warned.

I checked whether any hand-over could fire mid-scene or on an exit. None can:
- The phase flags change only between conversations. The night scene launches on entering the main hallway (`m03_night_transition.ink:2-4`), and `clone_call_done` is set there.
- Every Ffion and Victoria hand-over sits at the top of a knot that, by day, is entered only through in-scene diverts. At those points the flag is still false.
- Terry's sits in the quiet-flag else.

The sweep's coverage claim is right for knots that own choices. It missed one two-step greeting of the D4-8 kind (Victoria's `idle`, D5-6) and one state the challenge opener doesn't know about (a lockpick catch first, D5-3).

**Terry's `day_greeted` at four points** (r9b second half, r16a):
- Opener: "You. The three o'clock..." plays only when Ffion has no story for him (D5-2).
- Work excuse: plays. The card choice that follows ignores it (D5-1).
- Suspicious path: plays.
- Files excuse: plays, at +5. On the brushoff route the opener has just asked "That you?" without recognising the player, and three lines later he quotes the afternoon (r1: `:55` → `:154`).

**C3 items not properly fixed:**
- **D4-3**: two of the four recognition lines are undercut, by the Ffion opener (D5-2) and by the cloned card (D5-1).
- **D4-22**: "Danny's made his call" is false for three of the four Danny outcomes (D5-7).

## Part 2: findings

No blockers.

### Majors

#### D5-1 (major): Terry calls the player a visitor, then waves them through on a cloned executive card

- **Route** (r16a): the player met Terry by day. At night:
  - [I work here -- research, second floor.]
  - "You don't work here. You were in reception at three with a visitor badge." (`m03_npc_terry_mott.ink:182`)
  - [Hold up the cloned executive card. This do you?]
  - "That's... that's an executive-level card. Alright, carry on." / "Didn't have you down as a night person." (`:190-191`), at +15 influence.
- **Why it matters.** D4-3's recognition makes the card line absurd. A guard who has just caught the lie accepts the CEO's card from a three o'clock visitor without a beat. The card is the obvious answer for any player holding it, so this is a natural path, and it is the cover-maintenance scene the last two cycles built.
- **Fix** (local, a branch on `day_greeted` inside the card choice):

  ```ink
  * [Hold up the cloned executive card. This do you?]
      { day_greeted:
          ~ guard_influence = guard_influence + 5
          # influence_increased
          Terry Mott: A visitor badge at three and her card at eleven.
          Terry Mott: Either she's taken a shine to you or I'm in trouble. Ten minutes.
      - else:
          ~ guard_influence = guard_influence + 15
          # influence_increased
          Terry Mott: That's one of the exec cards. ...Right. Carry on.
          Terry Mott: Didn't have you down as a night person.
      }
      ~ hub_quiet = true
      -> hub
  ```

  `guard_suspicious` stays true on the day-greeted branch. The `hub_quiet` addresses D5-4 for this exit.

#### D5-2 (major): Terry's recognition is lost whenever Ffion has spoken to him, and since D4-1 that is most players

- **Mechanism.** The opener tests `ffion_night_story` before `day_greeted` (`m03_npc_terry_mott.ink:49-61`). D4-1 made Ffion's question play for every player who talks to her at night, and she is the first person they meet. So the recognition opener ("You. The three o'clock.", `:58`) now reaches only players who walk past her.
- **What plays** (r1, the smooth route):
  - "Ffion rang. Said someone come in at eleven and wouldn't say what for. That you?";
  - [Sterling asked me to grab some files.];
  - "Ms. Sterling told me nothing about it. She told me nothing this afternoon either." (`:154`).
  - He fails to place the player, then places them three lines later. The notebook story (r7, r9, r16c) and the sterling story (r5, r9b) never recognise them at all.
- **Fix** (local): fold recognition into each Ffion line with an inline choice between fixed strings, so the line count stays the same:
  - `:51` notebook: "Ffion said there'd be someone about. Notebook, was it?{day_greeted: Should've known it'd be you.} Conference room's the other end of the building."
  - `:53` sterling: "Ffion reckons Ms. Sterling's expecting you.{day_greeted: The three o'clock, back again.} She never said nothing to me."
  - `:55` brushoff: "Ffion rang. Said someone come in at eleven and wouldn't say what for.{day_greeted: Didn't say it was the three o'clock.| That you?}"

  This is the scene the night was missing: the afternoon lie and the night lie meet in one man, *and* Ffion's call reaches him.

### Minors

| # | File:line | Finding | Fix |
|---|---|---|---|
| D5-3 | Terry `:44-61`, `guard_idle :583-585` | A player caught picking Sterling's door at night *before* any challenge, who then talks to him, gets the stranger opener: "Building's shut, mate. So you're either lost or you're trouble." (r16b). He has just written them down. D4-8 sends this reopen straight to the challenge, so the line now plays first. | Add a first branch in the challenge: `- guard_detection_count > 0: Terry Mott: You. The one with the picks. Let's hear it, then.` |
| D5-4 | Terry `:63`, `:113`, `:357-361`; excuse exits `:192, :212, :218, :230, :236` | The challenge always sets `guard_suspicious` (`:63`). Only the SAFETYNET credentials and "obstructing" clear it, so the cold greeting is effectively universal. The excuse exits go to `hub` without `hub_quiet`, so the greeting prints straight after his dismissal: "Ten minutes. Then I come looking." / "Well?" (r1, r9b, r13); "Alright, carry on." / "Well?" (r16a). His first question also opens "Well?" (`:113`), so on the default route he says "Well?" twice. Every exit after a challenge is "I've got your face now." | Set `hub_quiet = true` on the five excuse exits into `hub`. Rewrite `:113` (W4-1). Optional: give "Mind how you go." to an excuse that landed (`enrolment forms`, the sterling-story files line). |
| D5-5 | Terry `:174` → `:222` | The same fact twice in a row: "Maintenance? I didn't get a work order notice." / "No work order, and you don't look like our usual maintenance crew." (r4, r11). | `:174` "Maintenance? At eleven at night?"; keep `:222`. |
| D5-6 | Victoria idle `:791-792`, `:806` → night_on_call `:754-755`; `:789` | The first night look-in takes two clicks and says "back to the door" twice: "Sterling's still on the phone, her back to the door." / [Look in on Sterling] / "*low, into her phone, back to the door* ..." / "She doesn't seem to have heard you come in." The idle line narrates from inside before "you come in" (r1, r3, r6). This is the D4-8 pattern that the sweep fixed for Terry. `:789` "The light's still on in the conference room" is said to a player standing in it. | In idle's else, before the narration: `{ victoria_fate == "" and clone_call_done and not sterling_on_call_seen and not night_confrontation_ready: -> start }`. `:789` "Sterling hasn't left." |
| D5-7 | phone `:367` | "Network's stripped, the case is made, and Danny's made his call." It is true only when Danny is protected. Exposed: the player made it. Left: he's "still deciding". KO: he's unconscious (r15). This is D4-22 not properly fixed. | `...the case is made, and {danny_fate == "protected":Danny's on his way in\|{danny_fate == "exposed":Danny's on the record\|{danny_fate == "left":Danny's choice is his now\|Danny's out cold in his office}}}. Sterling's your last move.` Fixed strings only. |
| D5-8 | debrief `:395-396` | "[She's worth more to us than he is. That's the arithmetic.]" → "Careful. That's her word." Victoria says "arithmetic" only on the hospital follow-up (`m03_npc_victoria.ink:634`), and HaX wasn't in the room. On r5 (office opener) the player has never heard it. | "Careful. You're starting to sound like her." This is true on every route, because HaX knows her pitch. |
| D5-9 | debrief `:183` | "[She picked St. Catherine's off a survey of two hundred and fourteen.]" is offered to any arrested player who didn't name the targeting. The figure is only in the roster and the printed log (`scenario.json.erb:49`, `:66`), and in Victoria's target line, which this branch excludes. | Gate it on `transaction_log_read or roster_seen`. Two choices remain, so nothing starves. |
| D5-10 | Ffion `:315-321`, comment `:323-324` | `night_greeted` is set before the question. So a reload at the question skips it for good, and she says "Found it. Charger was in the biscuit tin" to a player who never answered (r12). Terry then gets no story. The comment says a reload "replays it", which it doesn't. A chat closed at the question re-enters `night_answer` with no line (choices only). | In `closing_up`: `{ night_greeted and ffion_night_story == "": Ffion Rees: Well? Is she expecting you? -> night_answer }`. Make the hub check `not night_greeted or ffion_night_story == ""`. Correct the comment. |
| D5-11 | Terry `:62-64`, `:73-79` | A reload at his first question ("What's your explanation...") restarts at `start`, which treats `player_warned` as "excuse given". He says "You again." and the player never has to answer (r12). | Set a local `excuse_given` in each `first_excuse` choice. In `start`, send `player_warned and not excuse_given` to `first_excuse` with "Still waiting." |
| D5-12 | Terry `:461-466` | `hostile_confrontation` counts a detection at the top of the knot, and the knot owns its choices. A chat closed at "Tackle / Wait / Run" and reopened replays "Right. That's the police, then." and counts a second detection. That moves the debrief from "caught you once" to "clocked you twice". | Count the detection in a choice-free knot before the choices (the `eager_recruit` pattern), or guard it with a local flag. |
| D5-13 | debrief `:355-357` | With no Danny, the debrief runs 10 lines with no choice: the target list → "You never found the consultant" → four paper lines → "It's done." → the two aftermath lines (r14). It is the longest run in the mission, and the only Danny fate with no reply. | Add `danny_reply_none`: "[Find him before they do.]" → "That's the plan. You could have saved us the trouble."; "[He wasn't my job.]" → "He was somebody's. Now he's mine." |
| D5-14 | debrief `:446` | The recap's last line starts "And their records sat...". On routes with no clone and no password (r15: Ffion and Sterling KO'd, Nightshade's card), it is the whole answer to the player's question. | `{reception_badge_cloned or victoria_card_cloned or draft_seen or roster_seen:And their\|Their} records sat...` |
| D5-15 | debrief `:192`, `:269`, `:526` | On the arrested "arms dealer" route, "Ransomware Incorporated, Critical Mass" is listed three times in one debrief: in HaX's reply, in the Architect line, and in the player's last choice (r11). | `:192` "Every buyer downstream just lost their supplier. They'll pay more for worse." |
| D5-16 | debrief `:483-497`, `:521`, `:532` | The last stretch says "what's next" three times: "We'll need you soon." (every `final_assessment` branch) → "[What's my next assignment?]" "We see where ENTROPY surfaces..." → "We'll brief the next one when you're ready." (r1, r2, r3, r13). | End the `final_assessment` lines without the tail: "Clean enough.", "It's done.", "Good work last night." (and "I read your notes on Foster twice. That's not a complaint."). Keep the closing line. |
| D5-17 | Terry `:149` → `:207` | Sterling story + files excuse: "Ffion said the same. Still nobody told me. Go on, then." then "She does ring down at odd hours. Which files?" He waves the player through, then questions them (r5, r9b). | Cut "Go on, then." on this branch. |
| D5-18 | Terry `:117-120` | "[Wrong turn. I'll find it.]" → "Then you've taken the scenic route..." → his hub with four topics. The player has just said they're leaving (r7, r9, r16c). | End it as an exit: add `Terry Mott: Back the way you came.` with `idle_quiet` and `#exit_conversation` → `guard_idle`. Or reword the choice: "[Wrong turn. It's a long building.]" |
| D5-19 | Ffion `:39-41`, `:59`, `:62`, `:70` | On the curious route (r1) she gives the directions three times in seven lines and says "check you in" then "sign in here". `:62` prints again when `company_overview` returns to `badge_process`. | Cut `:41` ("Let me get you checked in."). Print `:62` only `{not topic_company_history}`. |
| D5-20 | briefing `:57-58`, `:120` | On the skip route "Phase 2" first appears in objective three with no setup, and "client roster" is said twice in four lines (r3, r11, r15). | `:58` on the skip route: "The client roster, the logs, and whatever they're planning next. There's a Phase 2." Leave `:120`. |
| D5-21 | routes r2, r7, r8 | Housekeeping, not a game bug. Three routes stop on picks that no longer exist, so they don't reach the ends they were written for. | Update the picks (r2: "Just continue your normal patrol"; r7's mismatch variant needs `player_warned:false` before the reload; r8's last pick is a probe end, so mark it as one). |

## Part 3: whole routes, and raising the bar

### Flow

- **The afternoon is the strongest stretch, and it holds on every route.** W3-1 puts the player under assessment from the first line. The test arrives after one topic, or after the clone on the skip route. The read is a small heist ("Halfway", the cloner's light for a player who pushed her, "Nearly there", the buzz). Even the rude route (r11) plays well: the curt whiteboard line, the dropped read, the walk-back and "She stops watching your hands" feel like a scene, not a punishment.
- **The night now joins up.** In an unbroken session Ffion's question plays, her answer reaches Terry, and Victoria's read-back reflects the afternoon. The close with the doorway reveal is still the best scene in the mission.
- **The joins that still show are all in Terry's corridor:**
  - he fails to recognise the recruit when Ffion has called (D5-2);
  - he accepts the card from someone he just called a visitor (D5-1);
  - he treats a player he caught with a pick as a stranger (D5-3);
  - his "Well?" lands after every dismissal (D5-4);
  - he says "work order" twice (D5-5).

  He is the night's most-played NPC, and nearly every route meets him. One focused pass on his night scene would finish the mission's dialogue.
- **Lines that only make sense on another route:**
  - "Careful. That's her word." (D5-8);
  - the 214-site survey choice (D5-9);
  - "Danny's made his call." (D5-7);
  - "Found it. Charger was in the biscuit tin" after a reload at the question (D5-10);
  - "Building's shut... lost or you're trouble" after a lockpick catch (D5-3).
- **The same idea twice:**
  - "work order" (D5-5);
  - "back to the door" (D5-6);
  - the cell list (D5-15);
  - "what's next" (D5-16);
  - Ffion's directions (D5-19);
  - "Go on, then." followed by a question (D5-17).
- **Deliberate echoes that work and should stay:**
  - Terry's exit "I've got your face now" and HaX's "he'll remember your face" (r1, r5, r13). They land, but only if D5-4 makes the exit line less universal.
  - "I said I'd deal with it myself" (the call) and "I said I'd do it myself. I still might." (the close).
  - "You're the second person to say that this morning. He was the first."
  - Victoria's "I did walk away. With twenty-five thousand." against the player's "walked away".
- **Is every choice remembered?**
  - Remembered, and the story pays it back:
    - Ffion's night answer (by Terry);
    - Victoria's test and the keen goodbye (at night);
    - the afternoon's tone, through her influence and suspicion (at night);
    - the guard's handling (by Victoria and the debrief);
    - the targeting confrontation, the fates, the approach and "murder with an invoice" (all by the debrief).
  - Stance only, which is right for an immovable antagonist: the night opener (hospital / Sable / office) and the reckoning replies.
  - Two places could still remember more:
    - The debrief never mentions how the player opened on Sterling. "You opened on St. Catherine's. Good. She should hear that name from us first." would cost one gated line.
    - It never picks up the player's "Danny drew that survey for you." On the protected route that would strengthen "He asked which floor they're holding Sterling on."
- **Listening without choosing:** at most 10 lines (the no-Danny debrief, D5-13) and otherwise 9. In the field nothing runs longer than 7 (Danny's confession, which earns it). This is close to m01's rhythm.

### The debrief

It now earns its length. On r1 it runs 37 lines and 5 choices: the stealth verdict, "murder with an invoice", the Victoria fate and stance, the directive, the Danny fate with a reply, then four short closing lines and a choice. The recap as a question works: on r10 and r13 it reads as the player asking, not HaX lecturing. What's left is polish: D5-13 to D5-16.

### The 10 weakest remaining lines

Before suggesting each change I grepped m04 to m08 for the phrases involved ("professional to the end", "moving into position", "proves they exist", "executive-level", "after-hours access", "keep it visible", "night person", "need you soon", "could almost have used"). The only hit is "work order" in m04's phone ink, which is unrelated. No later mission calls back to any of these lines.

| # | File:line | Now | Rewrite | Why |
|---|---|---|---|---|
| W4-1 | Terry `:113` | Well? What's your explanation for being here after hours? | Go on, then. Why are you here? | A police-form sentence, and the most-heard Terry night line after the opener. The C2 rule: he gets shorter, never formal. It also removes one of his two "Well?"s (D5-4). |
| W4-2 | Terry `:222-223` | No work order, and you don't look like our usual maintenance crew. / I'm going to need to verify this. | No work order, and you're not our usual lot. / Who's your supervisor, then? | "I'm going to need to verify this" is corporate. His question leads into the player's "Ring the supervisor, then". |
| W4-3 | Terry `:190` | That's... that's an executive-level card. Alright, carry on. | That's one of the exec cards. ...Right. Carry on. | "Executive-level" is a spec sheet, not a guard (see D5-1 for the day-greeted branch). |
| W4-4 | Terry `:196` | New hires don't usually have after-hours access... | New starters don't get nights. Not here. | The trailing ellipsis is where his dry flatness should be. |
| W4-5 | Ffion `:69` | Here's your badge. Please keep it visible while you're in the building. | There you go. Keep it on show, or the guard has kittens. | A sign on a wall. Ffion is "love", "mind" and the biscuit tin. |
| W4-6 | Victoria `:128-129` | I reviewed your background. Freelance pen testing, some CTF competition work. / Solid technical skills. But that's not why you're here. | Freelance pen testing. Some CTF work. Competent. / Competent is cheap. That's not why you're here. | "Solid technical skills" is a recruiter's email. After W3-1 ("Let's see if you match your file") she should sound like she's pricing the player, and the money motif starts here. The choice "[Why am I here, then?]" still fits. |
| W4-7 | Victoria `:717` | The window opens in weeks. The assets are already moving into position. | The window opens in weeks. Some of what they bought from me is already installed. | "Assets moving into position" is stock thriller. The rewrite is in her voice (the supplier) and makes Phase 2 concrete. |
| W4-8 | Victoria `:740` | A professional to the end. I could almost have used you. | The sensible answer. I could almost have used you. | "A professional to the end" is a cliché, and the escape route's only reply from her. |
| W4-9 | debrief `:270` | The directive proves they exist and proves they plan at this scale. Command's had it since first thing. | Until last night the Architect was a rumour. Now it's a signature on a plan. Command's had it since first thing. | Report-speak ("proves... proves...") on every route. The rewrite is the same fact as a turn. |
| W4-10 | debrief `:173` | In custody. The CPS are looking at conspiracy, supplying articles for use in fraud and computer misuse, and her part in the deaths at St. Catherine's. | In custody. Conspiracy, computer misuse, and they want St. Catherine's on the charge sheet. | A 25-word legal list in HaX's mouth (the voice bible: about 13 words, fact then reason). The rewrite keeps the deaths as the point. |

Also worth a look:
- debrief `:483`: "...We'll still need you soon." See D5-16. End on "...will remember last night."
- Ffion `:59`: "I just need you to sign in here, and I'll print you a visitor badge." becomes "Sign in for me, and I'll print you a badge." once `:41` is cut (D5-19).

### Scenes that still land flat

1. **Terry at eleven for a player he met at three** (D5-1, D5-2, D5-4). Every piece is written, but the opener, the card and the hub greeting don't yet agree with each other. Done together, the scene becomes the night's best minor beat: Ffion's call reaches him, he places the face, and the player's lie has to survive both.
2. **The no-Danny debrief** (D5-13). A player who never found Danny gets a 10-line stretch and no say. One two-choice reply fixes it.
3. **Victoria's first night look-in** (D5-6). A small one: the most ominous line in the mission ("I said I'd deal with it myself") is preceded by a narration that tells the player what they're about to see.

### Characters

- **Ffion:** right by day and now at night ("Sounds like her. She does her best talking after hours."). Only her check-in script (W4-5, D5-19) is still a form.
- **Terry:** right whenever he's dry. "Then you've taken the scenic route. Through the executive wing.", "Notebook, files. Make your mind up." and "She told me nothing this afternoon either." are him. His stiff lines are the excuse handlers that predate pass 2 (W4-1 to W4-4).
- **Victoria:** the strongest voice in the mission from her first line now. Her weakest are W4-6 to W4-8, and two of them are at the very end of her scenes.
- **HaX:** the debrief's fate lines and replies are her best m03 writing. The two report-speak lines (W4-9, W4-10) are what's left.

## Structure and skill checklist (§2a–§2i, S1–S8)

| Check | Result |
|---|---|
| 2a Attribution | OK. Every prefix resolves; no new speakers. |
| 2a-bis Supported by scenario | OK. The cloner is in a pocket. Nothing in the ink conflicts with the room or cast changes this pass. |
| 2a-ter Voices | OK. Unchanged since cycle 3. |
| 2b Choices spoken | OK. The new choices ("[You could have walked away from that sale.]", "[What should they have locked down?]") are first-person speech. |
| 2c Hub structure | OK. Ffion's night hub now opens her scene. Terry's hub greets after his dismissals (D5-4). Victoria's idle takes an extra click at night (D5-6). |
| 2c-bis Starved knots | OK. loopcheck is clean on all six states tried, including `aftermath_choices` after the recap. |
| 2d Choices that matter | Strong. The test answer, the afternoon tone and the keen goodbye are read at night. Ffion's answer reaches Terry. The guard's handling is read by Victoria and the debrief. Targeting is read by the debrief. Danny × Victoria is paid off with a reply on every pair except "no Danny" (D5-13). The reckoning has two choices on every route. Possible extra callbacks: the night opener and the "Danny drew that survey" line (Part 3). |
| 2d.4 S1–S8 | No softlock. **S1:** Ffion's `night_greeted` is set before the question, so a reload burns it (D5-10). It gates only flavour. **S3:** "I'll tell the guard you're about" is backed and played. **S4:** unchanged (`#complete_task:meet_victoria` at `m03_npc_victoria.ink:88`, day only). **S5:** `+` options over `*` content all have sticky fallbacks. A related re-entry double count is D5-12. **S6–S8:** nothing new. The phone's hints don't warn around bugs. |
| 2e Cross-file state | OK. `afternoon_goodbye` is now read. `came_via_hospital` is local and read. No dead or undeclared globals. |
| 2f Influence tags | OK. Every `+=`/`-=` in the cycle-3 lines is tagged, including the +5 files line. |
| 2g Syntax | OK. |
| 2h KO | OK in writing: the KO stance in the debrief, the catch-then-KO line, the day-KO night narration (r15). One phone status line is false after a Danny KO (D5-7). |
| 2i Recurring bugs | "Where do I stand?" was checked at five points on r6 and r14 and is right except D5-7. No greeting without setup. Credit against route: D5-8, D5-9. Same fact twice: D5-5, D5-6, D5-15, D5-16, D5-19. |

## Prioritised action list

**Must fix:** nothing.

**Should fix (cycle 5):**
- **Terry's night scene, as one piece:**
  - D5-1, the card after recognition;
  - D5-2, recognition inside the Ffion openers;
  - D5-3, an opener that knows about the lockpick catch;
  - D5-4, `hub_quiet` on the excuse exits;
  - D5-5, the work order said twice;
  - W4-1 to W4-4.
- **Wrong on some routes:**
  - D5-7, the phone's Danny line by fate;
  - D5-8, "That's her word.";
  - D5-9, gating the 214 choice.
- D5-6, Victoria's first night look-in.

**Worth doing:**
- D5-10 to D5-20;
- W4-5 to W4-10;
- the two possible callbacks in Part 3 (the night opener, "Danny drew that survey").

**Proof for the fixer:**
- r16 (all three probes) and r1 should show recognition and no "Well?" after a dismissal.
- r14 should show a choice in the no-Danny debrief.
- r12 should show Ffion's question surviving a reload.
- Update r2, r7 and r8 so all routes reach their ends (D5-21).

## Verdict and counts

**Verdict: revise, light. Nearly ready.**

- **Cycle 3 did what it said.** In an unbroken session Ffion's scene plays and reaches Terry. Victoria's night read-back reflects the afternoon in five distinct ways. The debrief is the length of its consequences. No hand-over fires mid-scene or on an exit.
- **What remains is concentrated in one place.** Terry's night scene has every line it needs, but the pieces don't yet agree: the Ffion openers lose his recognition, the card ignores it, a lockpick catch is forgotten, and his "Well?" lands after every dismissal. The rest is route-specific wrong lines and polish.
- **Readiness.** The dialogue is ready for a blind playtest now. Nothing here blocks play or breaks a promise the mission makes. It is not yet at its final polish.
- **What cycle 5 should do, in one sentence:** rewrite Terry's night corridor as one scene (D5-1 to D5-5 with W4-1 to W4-4) and take the eight small route fixes (D5-6 to D5-9, D5-13 to D5-16). That is about 25 lines of ink.
- **After cycle 5.** A light confirmation read on r1, r12, r14 and r16 should be enough to sign the dialogue off. I don't expect a cycle 6 to be needed.

| Severity | Count | Ids |
|---|---|---|
| Blocker | 0 | |
| Major | 2 | D5-1, D5-2 |
| Minor | 19 | D5-3 .. D5-21 |

All 21 are mission-local. Nothing needs approval, and m03 has no audio.
- **Weakest-line rewrites:** 10 (W4-1 to W4-10, all voiced lines), plus 2 noted lines (debrief `:483`, Ffion `:59`).
- **Flat scenes:** 3 (Terry at eleven; the no-Danny debrief; Victoria's first look-in).
- **C3 items not properly fixed:**
  - D4-3, recognition undercut by the Ffion openers and the card (D5-1, D5-2);
  - D4-22, "Danny's made his call" false for three of four fates (D5-7).
- **Withdrawn after checking:** 2 (a KO'd Victoria replaying the confrontation; a stale "just distcc left" status). Neither state is reachable.
- **Checks run:** static only.
  - Compile to the scratchpad; validator `--skip-ink --no-graph`; dialoguelint; reopencheck; loopcheck on 6 states.
  - The route driver on 18 routes: 11 existing and 7 new, r11, r11b and r12 to r16, saved in `scripts/ink_runtime_check/m03_routes/`.
  - No browser run.
