# m10 Full Disclosure: alignment review, round 7 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only and static (no browser). I worked the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, R1 to R6 and CONTRACT §11 (rounds 1 to 6). The tree is HEAD e983ac9d. The R6 fixes are that commit; d547c33a and afff86ed don't touch m10, and m10 has no uncommitted changes. I read e983ac9d as a diff, then `six_oclock`, `hearing` and `citadel` in full, Tesseract's database, Join and ending knots, `close_compute()`, Victoria's and Vos's gallery ink, the gallery and share mappings, the card, every credits section and the `credits_for` merge. No VM material was opened. Scratch files are in `scratchpad/m10_r7/`.

- **Ink:** R6 changed no ink. Every `.json` is newer than its `.ink`.
- **Validator** (`--skip-ink --no-graph`): 0 errors. The same 2 objective-wiring warnings (`aside_done`, `blast_tunnel`) and the long-standing advisory list as R6.
- **Credits copies:** `safetynet`, `safetynet_join` and `in_memory` in the ERB's fragment (erb:825 on) parse equal to `credits_sections.json`.
- **Rendered credits.** I rendered the ERB at HEAD and expanded the six closing entries (`music.events` 52 to 57) with the engine's own `buildEndSequence` (closing-sequence.js:109). Over 20,000 random states per ending (every global the card and credits test, with the values their conditions name), **exactly one "Zero Day:" row prints on every save, on all six endings**. I also expanded hand-built saves: Join with each R6 case, a rich surrender, a cold lethal, a mixed arrest, and the traced-then-stopped save in R7-m1.

## Counts and verdict

**0 blockers, 0 majors, 3 minors** (open).

All three R6 minors are closed at the lines R6 named, and the clause order and new rows print as intended. Two of them bring small problems, both in the new Zero Day and Vos rows, and a fresh look at the share found an older state bug behind them:
- After four, a gallery choice can turn a **traced** Zero Day share into `stopped`. The player's trace then vanishes from the 06:00 scene, the card and THE CELLS, and ELSEWHERE says "Zero Day: got nothing tonight." under a card that says "Zero Day has it." (R7-m1).
- R6-m3's new Join rows say Zero Day was "Given everything at six". On Join the player pressed the key before six: Tesseract's "It goes at six whatever we say. Or now, if someone presses this." (R7-m2).
- When Zero Day's share is stopped, Vos tells the player "My delivery was cancelled. I am waiting for a flight." His credit still says he was arrested "waiting for a delivery", or on Join "Still waiting for his delivery", beside the new "Given everything" row (R7-m3).

**Verdict: another round needed (phase not complete; 0 majors, 3 minors).** All three fixes are JSON: a mapping guard and credit strings in the ERB. None is voiced and none needs the user. Outside these, every save I traced lands each earlier choice at the close, and the season adds up from the player's side.

## R6 findings: closed or not

| R6 | Status | Where it is now | New problem from the fix |
|---|---|---|---|
| m1 Vector/Phantom order on Join | closed | `safetynet_join`: Vector credits_sections.json:236 (`officer_out`) before :240 (recall), erb:1060 before :1064; Phantom credits_sections.json:258 before :262, erb:1082 before :1086. Order is knock-out, `officer_out`, recall, presence default, as in `safetynet` (credits_sections.json:101/105, :123/127). Rendered on Join: recalled and sent back again prints "Cryptographer. Still waiting for an apology." and "Auditor. Filed a complaint about tonight. It was upheld."; recalled only prints the recall line | none |
| m2 Arakawa's Join line | closed | credits_sections.json:207, erb:1031: "US liaison. Sent back to the post. The sheriff opened the road at four." It matches six_oclock.ink:204 ("Sheriff opened the road at four.") and the Join default "US liaison. Reopened the county road." can't print beside it (one clause per person) | none |
| m3 Zero Day rows on Join | closed | erb:785-786 carry `ending !== 'joined'`; erb:788-789 are the two Join rows (warning). Exactly one Zero Day row prints per save on every ending (20,000 random states each). Vos is named in the `vos_named` row | **R7-m2** ("at six"); **R7-m3** (Vos's own credit beside it); the state bug in **R7-m1** also reaches these rows |

## Severity table (new findings)

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R7-m1 | **A gallery choice after four can wipe out the player's trace.** Three mappings turn Zero Day's share to `stopped` when Victoria walks, is talked down or is confronted (erb:1729, three rows from the loop) or when Vos's secret is used (erb:1731). Their guard is `share_zero_day !== 'released'`, which catches a live share once the head start has gone, but not a **traced** one: a traced share stays `traced` after four (erb:1747 only releases `live`). Victoria and Vos stay on the walkway after the outer lock opens (erb:3624-3625, 3646, 3671), and their menus are still offered: escaped Victoria's menu on `avoided` (victoria.ink:96-100; erb:1737 writes `avoided` on leaving the room), recruited Victoria's on `refused` (victoria.ink:29-31; erb:1736 writes `refused` on the lock), and Vos's secret line (vos.ink:43). So a player who traces at the console, opens the lock with Fonoti's card or the cracker, then turns to the woman or man standing beside the lock, flips `traced` to `stopped` two hours late. Rendered (arrest, disclosed, `head_start_out` `zero_day`, Victoria walked): the card reads "Zero Day has it." where it should read "Zero Day has it. We followed it."; THE CELLS loses "Zero Day's share: four buyers followed. One was careless."; ELSEWHERE prints "Zero Day: got nothing tonight. Still trading." under the card's "Zero Day has it."; at 06:00 Netherton says "Zero Day got its two hours." (six_oclock.ink:343) and drops "We followed Zero Day's share." (:352-353); `close_cell_name` and the cell count lose the trace (carryover_vars.ink:407, 420). On Join the same save prints R6-m3's "shut out at four", which is false. The trace is a choice the player made at the console, and on this route it does not reach the close | erb:1729, 1731 | Replace `globalVars.share_zero_day !== 'released'` with `globalVars.head_start_out === ''` in both places. Before four nothing changes (a traced share can still be stopped by Victoria or Vos, which is their withdrawn order); after four the share keeps whatever went out. `head_start_out` is set in the same event chain as `released` (erb:1743-1747), so it covers every case the old guard did. Optional, phase 4: the lines that promise to pull the order (victoria.ink:104, 156; vos.ink:48) are untrue after four on any share; a `head_start_out != ""` arm would fix them, but they are voiced |
| R7-m2 | **R6-m3's Join rows say Zero Day was given everything "at six".** On Join the player presses the key in the core, after four and before six. Tesseract says so: "It goes at six whatever we say. Or now, if someone presses this." (tesseract.ink:118; also :222-223), and the key console asks "Publish the database to everyone, now?" (:923). The Citadel is "an hour later" (citadel.ink:22), and the credits' own header says "RELEASED BY KEY. ALL CITIES, ONE MINUTE." (erb:1132). "At six" describes the release the player was there to stop, not the one they caused | erb:788, 789 | "Zero Day: shut out at four. Given everything by the key." and "Zero Day: shut out at four. Given everything by the key. Its broker, Pieter Vos, named." The four o'clock choice still lands against the key, and the line no longer names a time the key beat. Not voiced |
| R7-m3 | **Vos's credit ignores his own "My delivery was cancelled."** When Zero Day's share is stopped, Vos says "You are still here. My delivery is not." (vos.ink:25-26), "My delivery was cancelled, so I have time." (:62-63) and "My delivery was cancelled. I am waiting for a flight." (:86-87). His credit doesn't test the share: on a stopped share it still prints "PIETER VOS: Named. Arrested on the walkway, waiting for a delivery." (erb:713-714), next to ELSEWHERE's "Zero Day: got nothing tonight. Its broker, Pieter Vos, named." On Join it prints "Named. Still waiting for his delivery." (erb:711-712) beside R6-m3's "Given everything…". Rendered on arrest and Join. **Reopened with a new reason:** R6 judged the Vos rows fine on Join, without his stopped-share lines; R6-m3's new row now puts the contradiction in the same credits | erb:711-714 | Add two rows ahead of the four that are there, and leave those four for a share that wasn't stopped: `(vos_outcome refused or avoided) && share_zero_day === 'stopped' && ending === 'joined'` → "Named. His delivery was cancelled. He caught his flight." (one row per `vos_outcome`, as now); the same with `ending !== 'joined'` → "Named. Arrested on the walkway, waiting for a flight." Both echo his own line. Not voiced. Check: every Vos save still prints exactly one row |

No blockers or majors.

## The six endings on rich, cold and mixed saves

Static traces through the ink, plus the engine-expanded card and credits on HEAD. The user's test: does every earlier choice land at the close, and does the season end well?

### Save by save

| Save | Close in the scene | Card and credits | Lands? |
|---|---|---|---|
| **Rich surrender** (m01–m09; Gary protected, Imran sent home; Victoria recruited and confronted; Voltage captured, his hands; m04 full; m05 arrest, list kept, funded; m06 watched; m07 Trojan Horse; Nightshade shown the file and taken in; Recruiter named, Kowalczyk held; told; Noor told; disclosed) | Walkabout (Quintero, Kowalczyk, Voltage, Gary); Ghost's word; Netherton's numbers with the tap line; disclosure's dark operations; the van with Nightshade at the window; Albion season line and the memo line; "He asked who taught you. I said I did." | Card: cooperating, the vendors, "Nothing went at four.", the Albion inquiry. "Took his surrender. Kept his protocol."; "Told their handler…"; "Ten operations…"; Nightshade "Gone by morning, under a new name."; Gary, Imran, Voltage, Victoria each by tonight; couriers and quartermaster; Lawson, Torres, Sorensen, Noor, the forty-seven, Elena; HaX "Sat in on every one of his debriefs." | **Yes** |
| **Cold lethal** (nothing imported; both shares out; secured) | Walkabout offers Quintero, Imran and Wendell; "Two cells have it."; the order book's buyer at five; no season line; "There'll be a board. I'll be sitting next to you." | Card ends on Billings; "Fired when his hand was on the key."; Vos "Arrested on the walkway, waiting for a delivery."; "Zero Day: still trading. Its broker, Pieter Vos, named." | **Yes** |
| **Mixed arrest, Zero Day killed at four, Vos refused** | Netherton: "The cells got nothing at four."; Vos told the player his delivery was cancelled | ELSEWHERE "Zero Day: got nothing tonight. Its broker, Pieter Vos, named." beside "PIETER VOS: Named. Arrested on the walkway, waiting for a delivery." | **Partly** (R7-m3) |
| **Mixed arrest, trace at the console, lock opened, then Victoria "[Go.]"** | Netherton: "Zero Day got its two hours." with no trace line | Card "Zero Day has it." (not "We followed it."); no trace row in THE CELLS; ELSEWHERE "Zero Day: got nothing tonight." | **No** (R7-m1) |
| **Join, share killed at four, Vos refused** | Citadel; Netherton's line by Gary, Voltage or Nightshade | "PIETER VOS: Named. Still waiting for his delivery." and "Zero Day: shut out at four. Given everything at six. Its broker, Pieter Vos, named." | **Partly** (R7-m2, R7-m3) |
| **Join, Vector or Phantom sent back, recalled, sent back again; Arakawa sent back** | — | "Still waiting for an apology." / "Filed a complaint…" / "The sheriff opened the road at four." | **Yes** (R6 closed) |
| **Rich scorched, cold executed** (R6's saves, re-expanded) | As R6 | As R6; only the R6 Join lines differ from R6's render | **Yes** |

### Ending by ending

| Ending | Last in-scene beat | Season line | 0x00 credit | Open |
|---|---|---|---|---|
| Arrest (incl. hold fire) | "I said no. It took me till morning." | in `the_rest`, by database | "Brought him out alive, in front of a court." | R7-m1, R7-m3 (on those saves) |
| Surrender | "He asked who taught you. I said I did." | as arrest | "Took his surrender. Kept his protocol." | as arrest |
| Lethal | "There'll be a board. I'll be sitting next to you." | as arrest | "Fired when his hand was on the key." | as arrest |
| Executed | HaX's message read in the van | none (by design) | "Fired when his hands were empty." | as arrest |
| Scorched | The hearing: HaX on whether she was asked | after the map line, before the suspension | "Wiped both copies. Suspended." | as arrest |
| Join | Netherton: "Find 0x00…" | none (by design) | "Pressed the key." | R7-m1, R7-m2, R7-m3 |

The scenes themselves are finished as far as this phase can judge them statically: every earlier mission reaches the close on every save that played it, each ending's last beat happens inside a scene, and the season is added up on the player's side wherever there is one to add up. What is left is the Zero Day share and its broker: one state bug that can erase the trace, and two credit lines that misreport the delivery.

## Rubric (ten rows)

| # | Dimension | R6 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | none | none | none |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | none | none | none |
| 4 | Ink craft | none | none | none (the optional voiced fix in R7-m1 is phase 4's) |
| 5 | Moral choices and consequences | minor | minor | R7-m1, R7-m2, R7-m3 |
| 6 | Music | none | none | none (no cue touched) |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | none | none | none |
| 10 | Bookends | none | none | none |

## Deferred to phase 4

Not findings; noted for the dialogue phase.
- **dialoguelint backlog** unchanged since R2 (R6 changed no ink): blank re-entry 5, stage cue on an information line 5, crowded hub 1, "not X, Y" 2, US spelling 1.
- **Victoria's and Vos's order lines after four.** "Zero Day's order goes away" (victoria.ink:104), "Zero Day's order goes with me" (:156) and "The order goes with me" (vos.ink:48) play unchanged after the head start has gone. Voiced; an arm on `head_start_out != ""` would fix them. R7-m1's mapping fix makes the state right without them.

## Withdrawn, not raised, and browser checks

- **Withdrawn after checking:**
  - I suspected the Join Zero Day rows could double up with the "still trading" rows or leave a Join save with none. They can't: 20,000 random states per ending print exactly one, and `close_compute()` always writes `trading` or `vos_named` (carryover_vars.ink:474-479), on Join too (citadel.ink:12).
  - I suspected "shut out at four" was false when the share was stopped by Victoria or Vos rather than the console. Before four it is true either way: the player's gallery choice withdrew the order, and the share never went. After four it is R7-m1's bug, and the fix there covers it.
  - I suspected Vos's "waiting for a delivery" was false whenever Zero Day's share went out at four. Not raised: he holds a visitor's code card for the core ("VISITOR: ZERO DAY. Outer lock", erb:3667), so his delivery is a collection in the bunker, and he can still be waiting for it after four. Only the stopped share, where he says it was cancelled, contradicts him (R7-m3).
- **Not raised:**
  - **Arakawa's Join default "US liaison. Reopened the county road."** beside the sent-back clause "The sheriff opened the road at four." They never print together (one clause per person), and on Join a liaison who stayed reopening the road afterwards is consistent with both.
  - **Phantom's Join clause "Filed a complaint about tonight. It was upheld."** on a night the agent defected. It still reads true: the complaint is about the wrong accusation, which happened.
  - **Validator advisories and the dialoguelint backlog** belong to phases 3 and 4.
- **For the orchestrator (not a finding):** R7's fixes add no voiced lines. `FINALE_TTS_COUNT.md` needs no change from this round.
- **Browser checks for the fixer** (keyless :3001):
  - trace Zero Day's share at the console, open the outer lock with Fonoti's card, then "[Go.]" to escaped Victoria: `share_zero_day` stays `traced`; the 06:00 scene says "We followed Zero Day's share."; card "Zero Day has it. We followed it.";
  - the same before opening the lock: `share_zero_day` becomes `stopped` as now;
  - Join after "[Kill Zero Day's.]" with Vos refused: read the Vos and Zero Day rows;
  - arrest after "[Kill Zero Day's.]" with Vos refused: read Vos's row.
