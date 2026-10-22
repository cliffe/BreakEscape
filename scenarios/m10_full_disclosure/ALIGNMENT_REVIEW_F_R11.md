# m10 Full Disclosure: alignment review, round 11 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only for game files. I worked the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, R1 to R10, CONTRACT §11 (rounds 1 to 10) and the finale brief. The tree is HEAD d988f957; the R10 fixes are 25092818..HEAD (17 ink files and their JSON, the credits in `scenario.json.erb`, CONTRACT §11, the dev log and the TTS count). m10 has no uncommitted changes. No VM material was opened. Scratch files are in the session scratchpad's `m10_r11/` (R10's harness and the fixer's `m10b/`, copied, plus `accuse2.cjs`, `vic_tag.cjs` and `tunnels.py`).

What I ran:
- **Validator** (`--skip-ink --no-graph`): 0 errors. The same 2 objective-wiring warnings (`aside_done`, `blast_tunnel`) and the cutscene `onceOnly` advisories as R10. It also prints 59 "condition on an imported global changes the game" advisories. Each is a deliberate carry-over reveal (who is standing where, by the earlier missions), and the cold-save traces below cover the check they ask for. Every `.json` is newer than its `.ink`, and the compiled Tesseract file carries the R10 guard (the simulators hit the new lines).
- **R10's focused simulators**, re-run on HEAD: `tess_tunnel2.cjs`, `phone_cut.cjs`, `gary_c.cjs`, `volt_fought.cjs`, and a new `accuse2.cjs` that parks all five officers at "Sure?" (R10's `accuse.cjs` never reached Arakawa's or Quintero's accusation).
- **Tunnel scan** (`tunnels.py`): every knot in every m10 ink that holds a choice and either ends `->->` or is called as a tunnel.
- **Reopen sweep** (`sweep.cjs`, every person-chat and phone ink, every NPC entry knot, 14 presets) and **reload sweep** (`reload_sweep.cjs`, Esc at each of the first three choice points, reload, talk again).
- **Engine reading** for the reload rules: `npc-hostile.js`, `state-sync.js`, `game.js`, `games_controller.rb`, `game.rb`, `interactions.js`, and the in-progress `person-chat-pending-reply.js` (read only to know what it covers; I reviewed the ink as it stands).
- **The close, read afresh**: `m10_six_oclock.ink` in full, Tesseract's core in full, and the credits clauses for the workshop, the power room and the gallery.
## Counts and verdict

**0 blockers, 0 majors, 2 minors** (open).

All six R10 findings are closed, and none of the fixes broke anything I could find. The reopen sweep now reports 168 groups. Every one of them was among R10's 179, and the 11 that dropped out are exactly R10-m1 (Vector's `accuse_check`), R10-m2 (HaX's cut steps) and the reload side of R10-m4. The reload sweep has lost Gary's three lines (R10-m3) and found nothing new. The tunnel scan finds only `m10_six_oclock.ink`'s four, which is `disableClose` and opened by event only.

Both new minors come from R10-m5's rewording:
- **R11-m1.** Gary's new 06:00 line, "Nobody decided anything about me all night. Same as St. Catherine's.", contradicts his own record. St. Catherine's did decide about him: it sacked him (his own lines, gary.ink:97 and six_oclock.ink:254). It also loses the echo of "Seven warnings, nobody listened." that made the old line land. Imran's new line is true, but its comparison runs backwards.
- **R11-m2.** Imran's new default credit now repeats Gary's. On an unprotected-Gary save the credits read "Left at his bench." and then "Left at his bench at six, under his own sheet."; on Join they read "Left at his bench." twice.

There is also one **correction to the record**, not counted: a reload does restore hostility (next section). R10-m4's fix is still right, for the Restart-after-knock-out path, but its comments and the CONTRACT note give the wrong reason.

**Verdict: another round needed (phase not complete; 2 minors).** Both are word changes: two voiced lines and one unvoiced credit. Neither needs the user. Outside these two, every save I traced lands each earlier choice at the close, and the season adds up from the player's side.
## A correction to the engine background

**A reload does restore hostility and knock-outs.** R10-m4, the R10 fix comments and my brief all say it doesn't. The engine has saved both since 8e868565 (2026-10-05, "E-B"):
- `npc-hostile.js:8-30` records `{ hostile, ko }` (plus HP and fall facing) for every NPC that turns or drops.
- `state-sync.js:158-159` sends it as `npcHostility` with each save; `game.rb:1841-` merges it (a KO is never undone); `games_controller.rb:343-345` returns it as `savedNpcHostility`.
- `game.js:1854-1855` restores it before any room's NPCs load, and `npc-behavior.js:324` re-announces a restored hostile once its sprite exists.
- A hostile NPC can't be talked to at all: a click starts combat instead (`interactions.js:733-734`).

So a plain reload never gave a passive Voltage or Victoria. Hostility goes only when the player is knocked out and picks **Restart**: `resetHostilesForRespawn()` (`npc-hostile.js:100-127`, called from `game-over-screen.js:171`) calms every hostile that isn't down, on purpose, before the reload.

What this means for R10-m4's fix:
- The fix still does useful work, but on the Restart path, not the reload path. After a Restart, Voltage and Static stand calm with `voltage_outcome == "fought"`, and Victoria with `vic_missed`. Without the fix the player could talk Voltage down and leave `cut_by_hand` true beside "Checked the sums. Stood down." With it, talking to him re-arms the fight. Walking past him to the panel still works, and the phone voice still cuts. That is consistent, and the player isn't forced into the fight. I'm keeping the fix.
- The comments are wrong and will mislead the next fixer: voltage.ink:213 ("hostility isn't saved, so after a reload…"), victoria.ink:181 ("a fresh entry (a reload) re-arms her; hostility isn't saved"), and CONTRACT §11's round-10 R10-m4 bullet. They should say "a Restart after a knock-out calms her or him (`resetHostilesForRespawn`)". This is a record fix, not a finding, so it isn't counted.
- The orchestrator's engine background should drop "doesn't restore hostility" for later rounds and for m09.
## R10 findings: closed or not

All six are closed. Each was checked on the compiled ink with the engine's owner rule (the first path segment of the first saved choice, re-entered with `ChoosePathString`, which resets the call stack).

| R10 | Status | Evidence, and what I checked for new problems |
|---|---|---|
| M1 Tesseract's tunnels | closed | tesseract.ink:232, 260-273 set `tess_menu` before each tunnel call, and :283-287, 327-331, 365-369, 397-401, 416-420 test it. `tess_tunnel2.cjs`: a reopen at `rec_albion` or `rec_derek` says "Where was I. Your record.", replays the same record, and the pick runs on into the next record or "Three things." with no error. A reopen at `case_lesson` re-routes to `case`, which replays the pitch from "All four. Good." (`tess_case_step` is still 0) and then calls the lesson properly. That repeat is R10's phase-4 note. **New-problem checks:** `tess_menu` is never left true at a choice point. Every set is followed straight away by the divert that clears it, so a save or reload never carries a stale `true` that would let a later reopen skip the guard. A reload restarts at `start`, and `case` resumes on `tess_case_step`. On a double-cross save `core_router`'s first arm is spent before the case (`wren_at_core` is set in `double_cross_open` or `double_cross_take`), so a re-route can't replay the double-cross. The tunnel scan finds no other knot in a closable conversation that holds a choice and returns with `->->` |
| m1 accusation gates | closed | arakawa.ink:188-191, malhotra.ink:57-60, phantom.ink:61-64, quintero.ink:120-123, vector.ink:83-86. `accuse2.cjs` parks each of the five at "Sure?" and reopens it under four changes (another officer sent back, `accused` set, `wren_at_core`, an ending). Every gated reopen lands on the officer's own re-entry line and menu with no "[I'm sure.]". An ending lands on `end_rest` through `menu`/`post`'s own `ending` test. With nothing changed, "Sure?" plays again as it should. Kowalczyk's `accuse_check` (kowalczyk.ink:190) has no gate, correctly: her accusation is the right one, her gate doesn't test `officer_out`, and her copies hide on `accused`, `kowalczyk_gone_ahead` and `wren_entering` (erb:2568-2570) |
| m2 parked cut steps | closed | vance_phone.ink:31, 48, 64; elena_phone.ink:32, 53, 69; phone_agent0x99.ink:691, 706, 720, 728. `phone_cut.cjs`: a call parked at each step, with the shutter cut meanwhile, reopens on "Shutter's dead already. You don't need me for that." (Vance) or "The shutter's already dead. You don't need me for this one." (Elena), then "[Right.]". HaX's guard leads to her own `cut_call` arm, "Shutter's already dead. Nothing left to do in there.", then `hax_close_right`. The sweep's three HaX groups are gone. Captured Voltage's `cut_p0`–`cut_p2` knot-level guards (voltage.ink:137-141, 157-161, 177-181) are still unreachable, as R10 showed, and harmless |
| m3 Gary's pointer | closed | gary.ink:37. `gary_c.cjs`: Esc at "[Same supplier, then.]" / "[What are you doing down here?]", then a reopen at `consultant`, replays the opener and both choices. The reload sweep no longer lists Gary's three lines. Nothing else reads `gary_c_seen`, and Imran's protected-branch opener (imran.ink:27-31) doesn't depend on it |
| m4 fights after a reload | closed (for a different reason) | voltage.ink:213-216 and victoria.ink:181-183. `volt_fought.cjs`: with `fought`, a talk re-arms him and Static with "Then be quick about it." and leaves only "[Stay down.]". `vic_tag.cjs`: on a fresh entry and on a same-session reopen, "We're past talking." carries `hostile:victoria_threat`, and the tag sits on that line. But a plain reload already kept them hostile (next section). What the fix really covers is Restart after the player is knocked out, and there it is right. Its comments need correcting |
| m5 the `avoided` 06:00 lines | closed as written; the reword raises **R11-m1** and **R11-m2** | six_oclock.ink:260-261, 276; erb:651-653 (Gary's at :644). Neither line now denies a conversation the player had. But Gary's contradicts his own St. Catherine's line, and Imran's credit now repeats Gary's |
## Severity table (new findings)

No blockers or majors.

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R11-m1 | **Gary's reworded 06:00 line contradicts his own record, and Imran's comparison runs backwards.** Gary's `else` arm plays to an unprotected Gary who was never settled: never met, or heard out and left on "[Give me a minute.]". It now says "Nobody decided anything about me all night. Same as St. Catherine's." But St. Catherine's is the place that did decide about him. He says so twice: "They sacked IT after the inquiry and kept the board." (gary.ink:97) and, on another save, "St. Catherine's sacked me for being right." (six_oclock.ink:254). The old line landed because it echoed his first beat, "Seven warnings, nobody listened." (gary.ink:89), and HaX's "the fifth person to treat him as an overhead". The new one drops that echo and says something untrue about his past. Imran's "Nobody made me choose, all night. Same as the board." is true on every save. But "same as the board" now reads as if the board spared him a choice, when his story is that the board ignored him ("We told the board, in writing. Nobody read it.", imran.ink:38) or sacked his team (:36). Both lines are what the player hears from the last person on the workshop floor, at the close | six_oclock.ink:260-261, 276 | Reword both so they are true on every reading of `avoided` and keep the echo. Gary: "Nobody's problem all night. Same as St. Catherine's." (he was an overhead there, and he was left that way tonight, whether the player listened or not). Imran: "Left me to it all night. Same as the board." (the board left their warning unread; tonight the player left him at the bench, heard or not). These two voiced lines replace R10's two, so there is still nothing new to voice beyond R10's count |
| R11-m2 | **Imran's new default credit repeats Gary's.** R10-m5 changed Imran's default to "Left at his bench at six, under his own sheet." and his Join line to "Left at his bench." (erb:652-653). Gary's last clause is already "Left at his bench." (erb:644), and the two rows sit next to each other. On an unprotected-Gary save where neither man was settled (`gary_tech` writes `avoided` for both, gary.ink:68-73), the credits read "GARY WHITLOCK — Left at his bench." and then "IMRAN SIDDIQUI — Left at his bench at six, under his own sheet." On Join the two rows are identical. In a person-by-person close that's meant to show each choice landing, the second row reads as a copy error | scenario.json.erb:652-653 | Go back to R9's wording without the false part: "Still at his bench at six, under his own sheet." and, on Join, "Still at his bench." Both hold whether or not he was heard, and neither repeats Gary. Unvoiced. `credits_sections.json` doesn't carry these rows, so nothing else to match |
## Reopen, Esc and reload sweeps

**Reopen sweep** (`sweep.cjs`, unchanged from R10 apart from the re-rendered scenario; 925 cases in 168 groups). Diffed group by group against R10's 179:
- **Gone (11):** Vector `accuse_check` × `accused`, `clue_door_log`, `ending`, `officer_out`, `whodunit_live`, `wren_at_core` (R10-m1); HaX `cut_step_0`, `cut_step_1`, `cut_breakers` × `gallery_shutter_cut` (R10-m2); Voltage `escaped_rest` × `casualty_sheet_read`, `voltage_print_lifted` (R10-m4's entry routing).
- **New: none.** The other 168 are R10's "can't happen" or "safe" classes, unchanged. They are: any knot × `ending` (the closing scene opens 1.5 s after Tesseract's last close and `after_end_json` hides the bunker copies); `six_oclock`, `hearing` and `citadel` (`disableClose`, event start only); own-outcome flips with no outside writer; captured Voltage's cut knots (unreachable); one-way flags flipped backwards; Kowalczyk's per-room copies; Nightshade's van copy; the guards' fight (out of scope, as in R9 and R10).

**Tunnel scan** (`tunnels.py`): knots holding a choice that end `->->` or are called as tunnels. Tesseract's five now carry the guard. The others are `m10_six_oclock.ink`'s `more_menu`, `fortyseven_kept`, `fortyseven_denied` and `season`, in a `disableClose` scene that opens only on `conversation_closed:tesseract` or `game_loaded` at `start` (erb:2309-2310). Safe.

**Reload sweep** (`reload_sweep.cjs`; Esc at each of the first three choice points, reload, talk again). Seven lost lines, all among R10's ten minus Gary's three:
- Tesseract's head-start reply and "I'll be here."
- Voltage's reply to "[I'll write it down.]" / "[We'll see.]"
- Wendell's switch line and his Dale call.

None of them loses a state or a carry-over, and each NPC's resting line still carries the outcome. Not raised, as in R10.

**Phone threads**, read against the engine's rule (re-run the owner knot only when a global changed since the save, and show unseen lines only):
- The three cut calls now end cleanly on a dead shutter.
- Ghost's call is `disableClose`.
- Victoria's line diverts to `call_after`.
- HaX's other calls end in `DONE`.

**Reply tags under Esc.** The in-progress engine fix (`person-chat-pending-reply.js`) flushes a reply's state tags when a chat closes. I didn't count tag-on-reply placements against the ink. Every R10 fix puts its state writes as `~` assignments before the reply line, or (Victoria's) as the opening line's tag, so none of them depends on that fix.
## The endings on rich, cold and mixed saves

These are static traces through the ink and the credits source on HEAD, applying the engine's reopen, reload and Restart rules. The user's test is whether every earlier choice lands at the close and the season ends well.

| Save | What the close does | Lands? |
|---|---|---|
| **Rich surrender** (m01-m09 played, Gary protected, Victoria recruited and confronted, Voltage captured and his hands, m04 full, m07 debrief, m09 memo and notice, Nightshade shown and taken in), **with Esc pressed on the Albion record** | The reopen says "Where was I. Your record." and replays Albion with the memo answer, then Derek. The exchanges answer from the record slots. At 06:00: the walkabout, Ghost's text, the numbers, "Sterling's line went dead at five." or the secured cell, the van with Nightshade at the window, the season and memo lines, then "He asked who taught you. I said I did." The credits go person by person | **Yes** (R10-M1 closed) |
| **Rich, protected Gary, Esc at his first menu** | The opener replays. "Talk him round or take him in, but talk to him first." plays on the pick, and his 06:00 line follows Imran's outcome | **Yes** (R10-m3 closed) |
| **Cold lethal** (no imports), Imran heard out, fitter's card | Records: `rec_cold`. 06:00: Quintero, Imran ("Nobody made me choose, all night. Same as the board."), Wendell. Close: "There'll be a board. I'll be sitting next to you." Credits: Imran "Left at his bench at six, under his own sheet." | **Yes, weakly.** True, but the line's comparison reads backwards (R11-m1) |
| **Mixed arrest, unprotected Gary heard out, fitter's card** | 06:00 Gary: "Nobody decided anything about me all night. Same as St. Catherine's." Credits: Gary "Left at his bench.", Imran "Left at his bench at six, under his own sheet." | **No.** His line contradicts his own St. Catherine's history (R11-m1), and the credits repeat (R11-m2) |
| **Join, unprotected Gary never settled** | Netherton: "Find 0x00…". Credits: Gary "Left at his bench.", Imran "Left at his bench." | **No.** Two identical rows (R11-m2) |
| **Mixed arrest, escaped Voltage fought, player knocked out, Restart, Voltage talked to** | He re-arms with "Then be quick about it." and the outcome stays `fought`. The credits: "Fought at his own switchgear. Charged." beside the phone voice's row, which is true, since the phone voice cut | **Yes** (R10-m4's fix, on the Restart path) |
| **Mixed arrest, Esc at "Sure?" for any officer, WREN named on the line** | The officer's resting line; `officer_out` keeps the first send-back; the close and the credits name the right man | **Yes** (R10-m1 closed) |
| **Mixed scorched, walked from Wendell, Vance call parked, Wendell told** | The close is right ("Rang his mate Dale.", no Vance row). Opening Vance's thread now says "Shutter's dead already." | **Yes** (R10-m2 closed) |
| **R6 to R10's other saves** (recruited Victoria before the lock, Vos with and without the m03 knock-out, Asante after Wendell, Imran over a knocked-out Gary, rich scorched, cold executed) | As before | **Yes** |

| Ending | Last in-scene beat | Season line | Open |
|---|---|---|---|
| Arrest (incl. hold fire) | "I said no. It took me till morning." | in `the_rest` | R11-m1, m2 on unprotected-Gary or cold saves |
| Surrender | "He asked who taught you. I said I did." | as arrest | as arrest |
| Lethal | "There'll be a board. I'll be sitting next to you." | as arrest | as arrest |
| Executed | HaX's message read in the van | none (by design) | R11-m2 in the credits |
| Scorched | The hearing: HaX on whether she was asked | after the map line | as arrest |
| Join | Netherton: "Find 0x00…" | none (by design) | R11-m2 in the credits |

Read afresh as a whole, the close does what the user asked. Each earlier mission has a voice at the core (the records, the exchange slots, the stings) and at 06:00 (the walkabout, the numbers, the season and memo lines, HaX's "the rest"), and the credits finish it person by person. Join and executed end hard, on purpose. Nothing in this round's sweeps reopens a settled beat. What's left is two word problems in the workshop pair's last appearance.
## Rubric (ten rows)

| # | Dimension | R10 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | none | none | none |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | minor | none | none (R10-m2 closed) |
| 4 | Ink craft | major | none | none (R10-M1, m3 closed) |
| 5 | Moral choices and consequences | minor | minor | R11-m1, R11-m2 |
| 6 | Music | none | none | none |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | minor | none | none (R10-m4 holds on the Restart path; the comments need the record fix) |
| 10 | Bookends | minor | minor | R11-m2 (the credits) |

## Deferred to phase 4

These are not findings; they are noted for the dialogue phase.
- R10's list stands:
  - a reopen at `case` before `tess_case_step` is set replays the pitch from "All four. Good." (and, on an m02 save, Ghost's lesson and HaX's reply);
  - Wendell's "*pause* Well. Which switch do you want." on an Esc;
  - Imran's repeated opener after Gary is knocked out;
  - R9's items: Vos's "waiting for a delivery" after four, Victoria's order lines after four, Fonoti after the lock, single-line first meetings after the lock, and the dialoguelint backlog.
- Static after a Restart that followed a fight says "Talk to him. From there." to a player he was just fighting, until Voltage is talked to and re-arms him. One line, no state.

## Withdrawn, not raised, and browser checks

- **Not raised:**
  - The seven lines the reload sweep loses (Tesseract, Voltage, Wendell). No state or carry-over is lost, as in R10.
  - The fixer's knot-level guards in captured Voltage's `cut_p0`–`cut_p2`. Unreachable and harmless.
  - The 59 imported-condition advisories. Each is a carry-over reveal, and the cold-save traces pass.
- **For the orchestrator:**
  - **Correct the engine background.** A reload restores hostility and knock-outs (`npc-hostile.js:8-30`, `state-sync.js:158-159`, `game.js:1854-1855`). Only Restart after a knock-out calms hostiles (`npc-hostile.js:100-127`). Please also fix the two ink comments (voltage.ink:213, victoria.ink:181) and CONTRACT §11's round-10 R10-m4 bullet. That's a comment edit and a JSON recompile with no behaviour change.
  - Voiced delta, if the fixer takes R11-m1: the two lines R10 reworded are reworded again, so there is still no new line beyond R10's count. R11-m2 is unvoiced.
  - R10's lint idea stands (a knot holding a choice that ends `->->` in a conversation without `disableClose`); `tunnels.py` in the scratch folder is a starting point.
- **Static proof:** `m10_r11/` in the session scratchpad.
  - `accuse2.cjs` (all five officers), `vic_tag.cjs`, `tunnels.py`.
  - `new_groups.txt` / `old_groups.txt` (the sweep diff).
  - R10's harness, re-run on HEAD.
- **Browser checks for the fixer** (keyless :3001):
  - Unprotected Gary heard out, fitter's card, arrest: his 06:00 line, and the GARY and IMRAN credit rows read differently.
  - Same save on Join: the two rows still differ.
  - Optionally, to see the corrected engine rule: fight escaped Voltage, reload. He is still hostile, and a click starts combat, not talk.
