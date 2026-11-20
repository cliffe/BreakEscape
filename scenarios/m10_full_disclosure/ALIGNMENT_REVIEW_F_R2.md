# m10 Full Disclosure: alignment review, round 2 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. I'm a fresh Opus reviewer, working read-only and static (no browser session). I ran the `mission-alignment-plan` ten-row rubric as a single reviewer, against `ALIGNMENT_PLAN.md`, `ALIGNMENT_REVIEW_F_R1.md` and the alignment R1 entries in `CONTRACT.md` §11 (JSON side, ink side, and the ELSEWHERE strings). The built mission is the working tree at d03e1180 plus uncommitted edits (m10 has only `dungeon_graph.md` modified). I didn't open any VM material.

- **Ink compile:** every `.json` is newer than its `.ink`.
- **Validator** (`--skip-ink --no-graph`): no errors. It gave the same 2 objective-wiring warnings and 78 issues as R1. The `blast_tunnel` pair is now in `mutuallyExclusiveGlobals`. The remaining warning pairs those two with the non-once handlers, which is harmless.
- **dialoguelint:** 0 errors, the same counts as R1 (blank re-entry 5, stage cue on an information line 5, crowded hub 1, "not X, Y" 2, US spelling 1).
- **Engine reads** (to check the new wiring):
  - `closing-sequence.js:64-69` `personLine`: the first clause that holds wins;
  - `npc-manager.js:1670-1716` `_deliverTimedMessage`: `skipIfGlobal` is checked at delivery, and again at release through `stillValid`;
  - `person-chat-minigame.js:1772-1797`: `conversation_closed` is emitted *before* `drainDeferredBarks`, so `night_closed` is set before any held toast is re-checked.
- **Canon checks against the source missions:**
  - m01: `final_choice`, abort and launch;
  - m05: Torres's five fates and who Elena is;
  - m07: Denver and Austin;
  - m09: the memo question, Noor's arms and the 23 exports.
- **Save-by-save trace:** a cold start, a full season, and five mixed saves, each through all six endings (below).

## Counts and verdict

**0 blockers, 5 majors, 17 minors** (open). R1's 8 majors and 12 minors: 19 closed, plus m11, which was deferred to the dialogue phase as planned. Six of the closed items brought in a new problem, listed below.

**Verdict: another round needed (phase not complete).** R1's work is real. Since R1:
- the player heads their own credits;
- every ending's last beat sits inside its scene;
- Netherton adds the season up once;
- m01 and m05 reach the core and the credits;
- Tesseract's case is now a short argument the player answers, not a list;
- the music follows the climax and the epilogue.

The new majors are mostly in that new layer:
- the 0x00 credit hides tonight's outcome on `told` saves (R2-M1);
- the only m05 lines on screen get Torres's family wrong (R2-M2);
- on any save that played m04 the season line is always Albion, straight before the memo line, which is also about Albion (R2-M3);
- m09's four newest exports (and its knock-outs) never reach m10 (R2-M4);
- the credits contradict themselves about Noor on the good m05 path (R2-M5).

All five are small, mission-local fixes.

## R1 findings: closed or not

| R1 | Status | Where it is now | New problem from the fix |
|---|---|---|---|
| A1 0x00 missing from the credits | closed | erb:557-570: a clause for every ending, plus the season line | **R2-M1**: the `told` clause comes first, so on a `told` save it replaces tonight's outcome on every ending, Join's "Pressed the key." included. **R2-m11**: "Ten operations" is gated on `m09_completed` alone |
| A2 last beats under the credits | closed | six_oclock.ink:83-108 `phone_beat`; :571-574 the executed screen as `Narrator[none]` lines; :587-590 HaX's text last; citadel.ink:24; erb:1696-1697, 2184, 2245 `skipIfGlobal: night_closed` (re-checked at release, after the `conversation_closed` mapping has set it) | **R2-m9**: the executed ending has no `phone_beat`, so Ghost's last word and the Recruiter's are lost there. **R2-m10**: on scorched and on Join, a toast can render between two scenes and repeat what the narrator then reads |
| A3 m05 only in the credits | closed | tesseract.ink:529-541 (five stings); :1043-1046 and six_oclock.ink:411-412, 434-437 (Torres's channel); carryover_vars.ink close_compute `torres`; erb:749, 788-792 | **R2-M2**: Elena is Torres's wife, not his daughter. **R2-m5**: two stings can stand between a landed rebuttal and his reply. **R2-m15**: `combat_lethal`, m05's heaviest outcome, has no credit row |
| A4 m01 thin, false on a cold start | closed | tesseract.ink:245-247, 294-323 (`rec_derek` only on `m01_completed`); erb:783-787 Lawson rows; `m01_player_aborted_attack` imported (erb:4109) | none |
| A5 nobody on the player's side says it | closed | walkabout clauses six_oclock.ink:124-131, 190-193, 221-231, 252-258, 299-303; `season` :615-646 called from `the_rest` and `scorched_close` | **R2-M3**: the priority makes it Albion on every save that played m04, twice with the memo line. **R2-m6**: "since Denver" is wrong for the values that reach it. **R2-m7**: Voltage's escaped line. **R2-m8**: Victoria's knock-out line. **R2-m12**: Netherton runs five lines with no breath |
| A6 Tesseract's record as a list | closed | tesseract.ink:237-361 (two records at most, each with a menu and his reply); Satoshi at :840-847; the bank at :115-117 | **R2-m1**: a reload replays the whole case (the plan's own risk line said to guard it). **R2-m2**: his memo challenge is offered answers that don't answer it. **R2-m3**: one button can never show. **R2-m4**: "Since your first day." is left orphaned |
| A7 music | closed | erb:1170-1186 (`wren_entering`, the ending by value, three scene-open cues, each with an exclusive `game_loaded` twin); :1201-1213 lethal on `end` | **R2-m13**: a reload during the exchanges loses the talk-down's quieter score. **R2-m17**: the music comment is stale |
| A8 surrender and lethal at 06:00 | closed | six_oclock.ink:313-316, 481-482 | none |
| m1 cold-start Derek | closed | tesseract.ink:245 | none |
| m2 Netherton's self-introduction | closed | director_netherton.ink:72-77 | none |
| m3 the brief | closed | erb:1123 | none (`on_resume` kept until a regression run, as planned) |
| m4 credits duplicated | closed | erb:1102-1113 | **R2-m14**: the SAFETYNET fragment's per-ending clauses for HaX and Netherton can no longer show |
| m5 the Citadel | closed | citadel.ink:27-34 | **R2-m16**: "Whitlock rang" and the old "He told her" |
| m6 Netherton's cut | closed | director_netherton.ink:81-83 | none |
| m7 HaX answers the sting | closed | tesseract.ink:739-742 | none |
| m8 Gary's job | closed | gary.ink:27 | none |
| m9 "file" | closed | phone_agent0x99.ink:200 | none |
| m10 tunnel toasts | closed | erb `mutuallyExclusiveGlobals` | none (the remaining warning pairs with non-once handlers) |
| m11 stage cues, Elena's spelling | deferred to phase 4 | six_oclock.ink:184, 229, 231; elena_phone.ink | not counted here |
| m12 HaX's hub order | closed | phone_agent0x99.ink:83-89 | none |

## Severity table (new and open findings)

### Majors

| # | Finding | Where | Fix |
|---|---|---|---|
| R2-M1 | **On a `told` save the player's own credit hides what they did tonight.** `personLine` prints the first clause that holds (`closing-sequence.js:64-69`). `AGENT 0x00`'s first clause is m09's "Told their handler about the Recruiter's call." (`m09_recruiter_secret === 'told'`). So for a player who told HaX in m09, the season's good choice, the credit never says "Brought him out alive…", "Fired when his hands were empty." or, on Join, "Pressed the key.". This contradicts CONTRACT §11's own entry ("after `Pressed the key.` and the m09 `told` clause"). A rich save is exactly where this bites | erb:557-565 | Put the six ending clauses first. Move the `told` clause into the unnamed row under 0x00, as a second row (`m09_recruiter_secret === 'told' && ending !== 'joined'`), or fold it into the season row as two clauses, `told` first: "Ten operations. Told their handler everything." / "Ten operations. Still answering for every one." |
| R2-M2 | **The m05 payoff gets Torres's family wrong.** In m05, Elena Torres is David's wife: "Elena Torres is a widow now, still fighting Stage 3 cancer" (m05_closing_debrief.ink:535), and he goes "Home. To tell Elena before the papers do." (m05_torres_confrontation.ink:610). Their children are Sofia and Miguel (:593). m10 calls her his daughter in two of the five stings and in a credit row. Those are the only m05 lines on screen for the arrest and exposure saves, and an m05 player will notice | tesseract.ink:536, 538; erb:789 | "You handed Torres to the police for paying his wife's hospital bills. I count her as well." / "You put Torres's name in the papers. His wife reads them in a hospital bed." / "David Torres: serving. His wife's treatment goes on." |
| R2-M3 | **The season line is always Albion for anyone who played m04, and the memo line straight after is Albion again.** `season_line()` tests m04 first, and m04 always sets `full`, `partial` or `quiet`, so every save with m04 gets an Albion key. The m02, m07, m08 and m01 arms are reachable only on saves that skipped m04, so the players with the fullest season never hear them. On any save with m09 as well, `season` then plays the memo line ("You told me he was right about Albion…" or "…wrong about all of it."). The result is two Albion lines in a row. With Tesseract's `rec_albion`, exchange 2's Albion answer and the card's Albion human line, a full save meets Albion five times and the rest of the season once, in the walkabout. D1 meant this line to be the one place the player's side adds up the season | carryover_vars.ink:476-500; six_oclock.ink:615-646 | When the memo line will play (`m09_completed and m09_memo_stance != ""`), skip the three Albion keys and start at `stcath_*`, since the memo line already carries Albion. Alternatively, keep Albion only when m09 wasn't played. Either way, a full season hears Albion (memo) plus one of St. Catherine's, Austin, the mole or the first week. Re-check `first_week_button` on a save with m01 alone |
| R2-M4 | **m09's four newest exports never reach m10, and Tesseract's knock-out count stops at m08.** m09 exports 23 globals. m10 imports 19 (erb:4117) and leaves out the four added for m10's sake: `reading_told_hax`, `noor_ko`, `old_coyote_ko` and `debrief_notice_before` (m09 ALIGNMENT_REVIEW_F_R2 n14: "Hand the payoffs to m10's loop"). `ko_pattern()` counts m01–m08 only. So a clerk or night guard knocked out in m09, the night before, never reaches "You put someone on the floor who wasn't armed". That holds even though `m09_sorensen_fate == "ko"` and `m09_tran_outcome == "ko"` are already imported and unused | erb:4117; carryover_vars.ink:309-337; tesseract.ink:729-743; six_oclock.ink:488-521 | Import the four (Tier 2, defaults false). Add a ninth arm to `ko_pattern()`: `m09_completed and (m09_noor_ko or m09_old_coyote_ko or m09_sorensen_fate == "ko" or m09_tran_outcome == "ko")`. Then pay off the other two with one line each:<br>• `reading_told_hax` in HaX's `the_rest`, after "The night he left, he asked me to go with him.": on true, "You read what he wrote about me. You told me anyway."<br>• `debrief_notice_before` in the core's `database` (tesseract.ink:987-989): a second form of HaX's line, "You sent his notice before anyone asked you to. This is that letter, a thousand times."<br>`noor_ko` goes into R2-M5's rows |
| R2-M5 | **The credits contradict themselves on the good m05 path.** A save that kept the pipeline list in m05 (`m05_found_pipeline_list && !m05_recruiter_deal_accepted`) gets "Every one of the forty-seven was warned in time." (erb:821). On that same save m09 hides both "tell Noor" buttons, because she was already warned in October (m09_noor_haddad.ink:103, 106; m09_closing_debrief.ink:225-227), so `noor_told` stays false. The same roll then prints "Noor Haddad: never told. Still on the list." (erb:797). Every player who did the right thing in m05 sees this. A knocked-out Noor (`noor_ko`, R2-M4) also reads "never told" | erb:796-797, 821 | Add rows above "never told", all with `m09_completed === true`:<br>• `m05_completed && m05_found_pipeline_list && !m05_recruiter_deal_accepted && !m09_noor_told`: "Noor Haddad: warned in October. Still at the archive."<br>• `m09_noor_ko === true`: "Noor Haddad: woke at her own desk. Still asking who hit her."<br>Gate "never told" on `!m09_noor_ko` and on the m05 test failing. With `&&` only, that is two rows, one on `!m05_found_pipeline_list` and one on `m05_recruiter_deal_accepted === true`. Also check "Still at the archive" against m09's told line ("in a hotel in Great Falls"); "Back at the archive." reads better as an epilogue |

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R2-m1 | **A reload in Tesseract's case replays all of it.** The plan's risk list said the new record menus "must write their state on the pick and route through `core_router`… or a reload replays the speech". The fix left them inline (CONTRACT §11: "a reload replays `case` from the top"). On a rich save, `case` now has up to six menus, so a reload at the third replays the pitch, the casualty figures and the first record | tesseract.ink:203-255, 405 | Add a file-local `tess_case_step` (0 to 3), set after the pitch, after each record and before `case_recruiter`. Have `case` enter at the step reached, with one bridging line ("Where was I. Your record.") |
| R2-m2 | **Two of the record menus don't answer what he asks.** On a save with m04 and m09's memo, he says two things ("You told them half…" then "You told Magnus I was right about Albion. Say it to me."). The menu then offers the memo answer, the m04 answer and "That was my call." Only one of the three answers "Say it to me" | tesseract.ink:260-289 | When the memo line plays, show only the memo answer and the generic decline. Keep the m04 buttons for saves without the memo |
| R2-m3 | **One button can never show.** "[Then you should have sent your notice.]" needs `not m04_completed and m09_memo_stance == ""`, but `rec_albion` is only entered on `m04_completed or (m09_completed and m09_memo_stance != "")` | tesseract.ink:242, 286-287 | Cut it, or gate it on the memo branch it was meant for |
| R2-m4 | **"Since your first day." is now an orphan.** It used to close the "Since your first day" pair, which was cut. After `rec_derek`'s "It was. I've been reading since." it repeats him, and after `rec_cold`'s "Then we agree on the price…" it answers nothing | tesseract.ink:254 | Cut it, or fold it into the line before the records: "I prefer to watch. I've watched you since your first day." |
| R2-m5 | **Two ledger stings can come between a landed point and his reply.** `exch_1_sting` runs on every exchange-1 pick, before his response. It plays bed four (m02) and, since R1, a Torres line (m05). On a save with both, a landed rebuttal ("Asante corrected your sheet…") gets two unrelated lines before "*pause* I knew.", and the narrator's "He looks at the console" comes third | tesseract.ink:448-458, 525-542 | Play at most one sting there (bed four, else m05). Or move the m05 line into `exch_1`'s opener, after "That's the cheapest it will ever be.", where it supports his price |
| R2-m6 | **"Since Denver" is wrong for the saves that hear it.** `austin_uncovered` fires on `fracture` and `meltdown`. In m07, "Denver" belongs only to `team_assignment == ""` (the team "circled over Denver all night", m07_closing_debrief.ink:218), which `season_line()` doesn't cover; that case falls through to the mole or the first week. The dropped calls are Austin's (m07:389-392) | six_oclock.ink:630-631; carryover_vars.ink:490 | `austin_uncovered`: "Eleven counties have dropped calls since Austin. Tonight is the first night I can tell them why." Add `m07_completed and m07_team_assignment == ""` with the Denver form, which is true there |
| R2-m7 | **Voltage's escaped "talked down" line lost its point.** "You let me walk out of Albion, and I never said a word since." doesn't say what he never said, and "never said … since" is ungrammatical. The captured form keeps "March to tonight" (his find in March, voltage.ink:212) | six_oclock.ink:229 | "You let me walk out of Albion. March to tonight, I never said a word. Put that in too." |
| R2-m8 | **Victoria's knock-out line is false on recruited saves.** "You never did learn to ask first. Not in Cardiff, not here." is reached only when she held the gallery (recruited or escaped). A recruited Victoria was asked, in Cardiff | six_oclock.ink:298-299 | Split by `m03_victoria_fate`. Recruited: "You asked nicely in Cardiff. Tonight you didn't bother. I'll want a doctor, and then a lawyer." Escaped: keep the line |
| R2-m9 | **On the executed ending, Ghost's last word and the Recruiter's are lost.** Executed skips the walkabout, so `phone_beat` never plays, and T-47 to T-55 are dropped at release by `skipIfGlobal: night_closed`. Ghost's credit still reads as if the thread closed. A cold ending is fine, but the player gets no closure on Ghost at all | six_oclock.ink:566-593; erb:2184, 2245 | In `executed_close`, before HaX's text: "Narrator: Before that, one from a number with no name. You don't open it." That keeps the cold tone and accounts for it. Or record in the contract that executed drops it on purpose |
| R2-m10 | **On two endings a toast can land between scenes and repeat the narrator.** Scorched: Ghost's and the Recruiter's texts (2 s and 5 s after `six_done`) can render between the 06:00 scene closing and the hearing opening (1.5 s after `six_done`), because `night_closed` is set only when the hearing closes. Join: T-57 "0x00." (3 s after `ending`) shows between Tesseract and the Citadel once his last two lines take more than 3 s, and the Citadel then narrates it again. It depends on timing, so check it in the browser | erb:1696, 2184, 2245, 2287, 2305 | Use `skipIfGlobal: "six_open"` on T-47 to T-55 (the scene carries them now) and `"citadel_open"` on T-57, or open the next scene sooner. If the thread should still keep them, add an engine option for "history only, no toast" (the user's call) |
| R2-m11 | **"Ten operations" can be false.** The season credit shows on `m09_completed` alone, so a player who played only m09 and m10 is told "Ten operations" | erb:568-570 | Gate "Ten operations." on all of `m01_completed` to `m09_completed` (`&&` only). Add a second row for the rest: "Still answering for every one." |
| R2-m12 | **Netherton speaks five lines in a row with no choice.** On arrest, from "I know. I kept it to one page." through "A trial…", "He is in a cell…", the season line and the memo line. Surrender is the same length. README_ink_best_practices puts a choice at least every three lines | six_oclock.ink:470-483 then 615-646 | Before `season`, add a beat in the player's voice: "+ [Sir?] / + [(Wait.)]", or move the season line to just after the van's choice |
| R2-m13 | **A reload during the exchanges loses the talk-down's score.** The `game_loaded` twin for `outer_lock_open && ending === ''` always plays "Steel Shadows", so a player with two points landed (silence) or one ("Shadow In E Minor") gets the start-of-core track back | erb:1170 | Add twins ahead of it, exclusive and in order: two or more landed → `silence`, one → "Shadow In E Minor" (the same tests as the `exchange_3` cues; `points_landed` is only written at the console, so use the exchange globals) |
| R2-m14 | **The SAFETYNET fragment now carries text that can't show.** The merge puts each person's conditional IN THIS OPERATION clauses first. HaX's cover every ending, and Netherton's cover executed, scorched and Join. So HaX's six SAFETYNET clauses ("First on the prosecution's witness list", "Her agent's file is on her desk, unopened", …) and Netherton's executed and scorched ones never print. They are better written than some that do | erb:1102-1113; credits_sections.json `safetynet` | For each ending, pick the one clause to keep, and delete the other from either the ERB or the fragment (changing both, as the drift check needs). For example, keep "Testifying against her teacher." on arrest and drop the fragment's arrest line |
| R2-m15 | **m05's heaviest outcome has no credit row.** `combat_lethal` (Torres left to bleed out; his wife a widow, untreated) gets Tesseract's sting but nothing in ELSEWHERE, while every other m05 outcome gets a row | erb:788-792 | "Elena Torres: a widow since the server room. Her treatment was never funded." (warning style), on `m05_completed && m05_final_choice === 'combat_lethal'` |
| R2-m16 | **Two Citadel lines don't hold.** (1) "Whitlock rang": a protected Gary is at the forward post tonight, a few metres from Netherton. (2) "He told her it had to be one of ours." On Join, the refusal scene with Kowalczyk ("Not you, Halina…", `wren_beat`) never plays, because it needs `console_choice == "stopped"`. So on most Join saves "her" has no referent | citadel.ink:25, 29 | "Whitlock came to the table. He asked if it was you. I told him yes." and "He said it had to be one of ours. He was right, and I signed for that agent myself." |
| R2-m17 | **Stale comments mislead the next fixer.**<br>• tesseract.ink:18: `tess_bridge`'s comment is fused onto `tess_rec`.<br>• tesseract.ink:200-202: "three record lines at most".<br>• six_oclock.ink:564-565: "no narrator reads it".<br>• erb:1158-1164: "victory for arrest / surrender / lethal".<br>• erb:4101-4105: "91 imports … m09's source has no scenario.json.erb yet" | as listed | Update each one to match the code |

## Does the ending land? Save by save

These are static traces through the ink and the card and credit conditions.

| Save | At the core | At 06:00 / hearing / Citadel | Card and credits | Lands? |
|---|---|---|---|---|
| **Cold start** (no imports) | Netherton introduces himself. `rec_cold` ("Two of yours died…", with an answer); no m01 claim; rebuttals can still win all three points | Walkabout: Quintero, Wendell, Imran, Kowalczyk if caught. Ghost: "You don't know me" leads to the stopped or bait text. No season line, no memo line | 0x00 by ending; no season row; no Lawson or Torres rows | **Yes, for a cold start.** Nothing false is said |
| **Full season, m09 `told`** | Albion record + Derek record, each answered. m05 sting. Satoshi on the Join path | Up to three backward clauses. Netherton: an Albion season line, then the Albion memo line (R2-M3). HaX: "the rest", with no use of `reading_told_hax` (R2-M4) | 0x00 reads "Told their handler about the Recruiter's call." on **every** ending (R2-M1). If m05's list was kept: "Every one of the forty-seven was warned" next to "Noor Haddad: never told" (R2-M5) | **Mostly.** The structure carries it, but the two places meant to sum the season up (the season line and the player's credit) point at Albion and m09 instead of tonight |
| **m01, m02, m05 only** | `rec_derek` only (one record). The bed four sting and a Torres sting stack in exchange 1 (R2-m5) | Gary with St. Catherine's. Season: St. Catherine's (exposed or bed four), else the first week | Lawson and Torres rows; "His daughter's treatment" on arrest (R2-M2) | **Yes**, apart from the canon slip |
| **m04 + m07 (fracture), no m09** | Albion record + debrief record | Voltage with Albion. Season: Albion (m04 wins). On a save without m04, "since Denver" would be wrong (R2-m6) | Austin human line on the card | **Yes** |
| **m09 only** | Memo record ("Albion. A site left open…"), with the memo answer | Memo line; no season key | "Ten operations. Still answering for every one." is false (R2-m11) | **Mostly** |
| **m05 good path + m09, Noor met** | m05 sting | — | the Noor contradiction (R2-M5) | **No, in the credits** |
| **m09, Noor or the night guard knocked out** | Tesseract's knock-out count ignores them (R2-M4) | — | Noor "never told" | **Not seen** |

## The six endings, scene by scene

| Ending | Last in-scene beat | Season line | Music | Credits for 0x00 | Open |
|---|---|---|---|---|---|
| Arrest (incl. hold fire) | HaX "I said no. It took me till morning." (six_oclock.ink:510) | yes, in `the_rest` | silence, then cutscene, then victory | "Brought him out alive, in front of a court." | R2-M1, R2-M3, R2-m12 |
| Surrender | "He asked who taught you. I said I did." (:515) | yes | as arrest | "Took his surrender. Kept his protocol." | R2-M1, R2-M3, R2-m12 |
| Lethal | "There'll be a board. I'll be sitting next to you." (:520); the cost line at :315 | yes | silence, then cutscene, then end | "Fired when his hand was on the key." | R2-M1, R2-M3 |
| Executed | HaX's text inside the van (:587-590); the screen read as `Narrator[none]` (:573-574) | none (by design) | silence, then cutscene, then end | "Fired when his hands were empty." | R2-M1, R2-m9 |
| Scorched | the hearing: HaX on whether she was asked (hearing.ink:56-60) | yes, before the suspension | threat, then cutscene, then cutscene, then end | "Wiped both copies. Suspended." | R2-M1, R2-M3, R2-m10 |
| Join | Netherton "Find 0x00…" (citadel.ink:39); HaX's "0x00." narrated (:24) | none | end, then cutscene, then end | "Pressed the key." | R2-M1, R2-m10, R2-m16 |

## Rubric (ten rows)

| # | Dimension | R1 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | minor | major | R2-M2 (Torres's wife), R2-m6 (Denver), R2-m8 |
| 2 | Aims and objective staging | none | none | none (the brief now holds on every branch) |
| 3 | HaX's hub | minor | none | none |
| 4 | Ink craft | major | minor | R2-m1, m2, m3, m4, m5, m7, m12, m16 |
| 5 | Moral choices and consequences | major | major | R2-M3, R2-M4, R2-M5, R2-m15 |
| 6 | Music | major | minor | R2-m13, R2-m17 |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | none | none | none in-mission (m09's knock-outs not counted is under R2-M4) |
| 10 | Bookends | major | major | R2-M1, R2-m9, R2-m10, R2-m11, R2-m14 |

## Deferred, withdrawn or not raised

- **Deferred to phase 4 (dialogue), not counted:** R1 m11. That covers the stage cues on information lines (`*almost laughs*` six_oclock.ink:184, `*flatly*` :229 and :231) and Elena's US spelling.
- **Not raised:**
  - The validator's `blast_tunnel` warning: the two HaX texts are exclusive through `mutuallyExclusiveGlobals`, and the remaining warning only pairs them with non-once handlers.
  - The executed ending has no season line. Netherton refuses to sign, and the season credit row still shows, which fits.
  - "The cells have gone quiet since" (lethal), said a few hours after the shot. It reads as Netherton's judgement, not a timeline.
  - ELSEWHERE takes Tesseract's word that Derek gave himself up "as he was told". That's a fair choice for a narrator.
  - The walkabout's three-pick cap. It is by design, and the R1 clauses already make each pick count.
- **Withdrawn after checking:**
  - The concern that held closing texts would still toast over the card. They don't: `conversation_closed` is emitted before the held barks drain, and the HaX mapping sets `night_closed` synchronously (`person-chat-minigame.js:1772-1797`).
  - The concern that the Ghost `else` arm is false when the call was never answered. The call is on the critical path (Stair B opens on `ghost_call_done`, erb:1588), so the `else` arm is always the talked-out branch.
- **Browser checks for the fixer** (with the ones in the plan): R2-m10's two timings; R2-M1's credit on `told` saves, on executed and on Join; R2-M5 on an m05-list + m09 save; a reload mid-case after R2-m1.
