# m10 Full Disclosure: alignment review, round 10 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only for game files. I worked the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, R1 to R9 and CONTRACT §11 (rounds 1 to 9). The tree is HEAD 801c377e; the R9 fixes are 280f51e2..HEAD (`m10_asante`, `m10_imran`, `m10_victoria`, `m10_voltage`, `m10_vos`, `m10_wendell` ink and JSON, CONTRACT §11, FINALE_DEV_LOG). m10 has no uncommitted changes. No VM material was opened. Scratch files are in the session scratchpad's `m10_r10/`.

What I ran:
- **Validator** (`--skip-ink --no-graph`): 0 errors; the same 2 objective-wiring warnings (`aside_done`, `blast_tunnel`) and cutscene `onceOnly` advisories as R9. Every `.json` is newer than its `.ink`.
- **How a conversation resumes, read from the engine first.**
  - Person-chat, same session (person-chat-minigame.js:504-566): the saved story is restored, then `ChoosePathString(owner)`, where the owner is `sourcePath.split('.')[0]` of the first saved choice. That is always a **knot**, never a stitch, and `ChoosePathString` resets the call stack. A story that ran to its end restarts at the NPC's knot (`restartAfterEnd`).
  - Phone-chat (phone-chat-minigame.js:493-545, phone-chat-conversation.js:603-680): the same owner-knot re-run, but only when a global changed since the save, and only lines the player hasn't seen are shown. An event call with `targetKnot` restores the state and then jumps to its knot; `resume: true` skips the jump.
  - Reload (npc-conversation-state.js:221-253): only ink-local VARs come back; the position is lost and the next talk starts at the NPC's knot.
- **Reopen sweep, all 27 inks** (`sweep.cjs`). For every NPC entry knot in the rendered scenario (`npcs.tsv`, 71 NPCs), 14 global presets, a 7-deep walk over choices (up to 250 choice points each). At each choice point, every global the ink reads that **another scene** can write (another ink, or a JSON mapping that isn't this NPC's own knock-out) was changed to each value the ink compares it with; the engine reopen (owner knot) was compared with a fresh entry at the NPC's knot. A change that alters the entry's choices but not the reopen's is an entry-only guard.
- **Tunnel check.** Every knot that holds choices and returns with `->->` was listed, and each was reopened the engine's way.
- **Reload sweep** (`reload_sweep.cjs`, after the m09 reviewer's `sim7.cjs`), added at the orchestrator's request: Esc at each of the first three choice points, reload (ink-locals kept, position lost), talk again; any line the first open could still have reached within four picks that the reloaded talk can't reach within five is reported.
- **Phone cut calls** (`phone_cut.cjs`) and the R9 fixes (`r10_confirm.cjs`, the fixer's `r9sim.cjs` with the owner rule corrected to the engine's) re-run on the compiled ink.

## Counts and verdict

**0 blockers, 1 major, 5 minors** (open).

The five R9 findings are closed and their fixes are sound. The fixer's deferral is not a finding: on a captured save nobody but Voltage can cut the shutter. Sweeping the parts of m10 that R9's fixer left out (Tesseract, the phone calls, reloads) turned up six problems:
- **R10-M1 (major).** Tesseract's conversation crashes on an ordinary close and reopen. His record knots and Ghost's lesson are tunnels that hold choices. The engine's reopen re-enters a knot with a fresh call stack, so the `->->` at the end has nowhere to return. The player sees "An error occurred when processing your choice", and the core is stuck until a page reload.
- **R10-m1.** A wrong-accusation "Sure?" that the player backed out of with Esc still works after the case is closed. It sends a second officer back, and that officer replaces the first in `officer_out`, which the close and the credits read.
- **R10-m2.** A cut call the player parked (Vance, Elena or HaX) still talks them through a shutter that Wendell has since cut.
- **R10-m3.** Esc at protected Gary's first choice loses his pointer to Imran ("I trained him. Talk him round or take him in, but talk to him first."), on a reopen and on a reload.
- **R10-m4.** After a reload, a Voltage the player chose to fight is no longer hostile. He can then be talked down, which overwrites `fought` and leaves Vance or Elena credited with a cut Voltage made. A Victoria who drew on the player stands passive after a reload.
- **R10-m5.** At 06:00 the `avoided` default can't tell "never spoke" from "heard him out and walked off". Gary says "Nobody came to my bench all night." to a player who stood at his bench and listened.

**Verdict: another round needed (phase not complete; 1 major, 5 minors).** None needs the user. M1, m1, m2 and m4 are guards or re-arms that add no new lines. m3 moves one assignment. m5 rewords two voiced lines (or adds a flag and one line). Outside these six, every save I traced lands each earlier choice at the close, and the season adds up from the player's side.

## R9 findings: closed or not

All five are closed, checked with the engine's owner rule (`r10_confirm.cjs`).

| R9 | Status | Evidence |
|---|---|---|
| m1 lock deals after the lock | closed | victoria.ink:52-54, vos.ink:267-269. Talk, "[Give me a minute.]", lock opens, reopen: Victoria lands in `recruited_menu`, diverts to `gallery_rest` and says "You found your own way in. I'll remember that.", with only "[Goodbye, Victoria.]"; `victoria_gallery` stays `refused`. Vos lands in `vos_menu`, rests ("I am waiting for a delivery…"), only "[Goodbye, Mr Vos.]"; `vos_outcome` stays `avoided`. `vos_secret_known` set while he is parked still offers the secret before the lock, because the menu re-evaluates on reopen |
| m2 Vos's m03 line | closed | vos.ink:234-237. First meeting after the lock on an m03 knock-out: the flowers line, then his resting line. `vos_l_seen` stops it repeating |
| m3 Asante after Wendell's warning | closed | asante.ink:32-34. "Somebody rang the switchboard about a raid…", only "[Suit yourself.]"; `asante_outcome` stays `untouched` |
| m4 Imran over a knocked-out Gary | closed | imran.ink:211-213. Reopen goes to `workshop`, whose Gary test now fails, and Imran's own scene and choices play. No loop. Gary knocked out after his own pick keeps that pick for Imran (`card_cloned` → resting line; `taken_in` → "I've given you everything…"), which is right: the mapping at erb:1671 doesn't overwrite a settled Gary |
| m5 Wendell after a walk-away | closed | wendell.ink:49-52, 65-77. Told after the phone cut: only "Dale's on the next shift…", `cut_by_hand` stays true (the phone voice did it). Told before it: Wendell cuts and `cut_by_hand` goes false, so no Vance or Elena row prints. But see R10-m2: the phone call the player parked is still open on the old step |

The sweep's extra fixes (`imran_menu`'s settled test, Wendell's "Never mind" on a dead shutter) are right and add nothing new.

## The fixer's deferral and the new Wendell knots

**The deferral ("captured Voltage chose 'I'll do it', then Wendell cuts") is not a finding: the state can't happen.**
- Wendell's slot copy is shown only on `!m04_voltage_captured && !m04_voltage_escaped` (erb:3219); `wendell_far` only on escaped saves (erb:3237-3238). On a captured save there is no Wendell to tell.
- The phone voices can't cut either. `phone_voice_is_hax` is set only on `!m04_voltage_captured` (erb:1561); Vance's and Elena's calls test `!m04_voltage_captured` (erb:2271-2272, 2287-2288). Every `cut_by_hand` writer needs Wendell or escaped Voltage (erb:1678-1682, voltage.ink:265).
- So on a captured save Voltage is the only person who can cut the shutter. His `by_hand` always ends in his own cut, and "Talked 0x00 through the switching. Kept his hands still." (erb:656) is always true.
- The new `{gallery_shutter_cut: -> captured_rest}` guards in `captured`, `captured_menu` and the three `cut_pN_menu` stitches (voltage.ink:45-47, 70-72, 141-143, 157-159, 173-175) can't fire. They are harmless; leave them or drop them, the fixer's choice.
- Correction to the fixer's proof: `r9volt.cjs` reopens the cut stitches at `cut_pN.cut_pN_menu`. The engine takes only the first path segment, so it re-enters the knot `cut_pN`, which replays that step's line ("Grey panel by the door…") before the stitch. Harmless here, since the guard is unreachable, but the harness should use the engine's rule.

**`wendell_switch` and `wendell_dale` land and divert correctly.**
- `wendell_switch` (wendell.ink:65-71) owns "[The one marked gallery shutter.]". A reopen there (Esc at that choice) re-runs its two assignments, which are already true/false, and repeats "*pause* Well. Which switch do you want." before the same single choice, then goes on to `wendell_dale`. That is a repeated voiced line on an Esc, not a wrong state: phase 4 polish at most.
- `wendell_dale` (:73-77) has no choices, so nothing can be parked in it; it ends in `wendell_rest`, whose re-entry line on `told` is "Dale's staying home. I guess I owe you for that." Correct on both the live-shutter and dead-shutter routes.
- The shutter is cut on entering `wendell_switch`, before the player names the switch, as it was before R9. If the player presses Esc there, the shutter is dead and "Shutter's dead. The hall's next." arrives (erb:1694, since `cut_by_hand` is false). Fine.

## Severity table (new findings)

### Major

| # | Finding | Where | Fix |
|---|---|---|---|
| R10-M1 | **A reopen inside one of Tesseract's record tunnels crashes the core conversation.** `case_records` calls `rec_albion`, `rec_derek`, `rec_debrief` and `rec_cold` as tunnels (tesseract.ink:258-269), and `case` calls `case_lesson` the same way (:232). Each of those knots holds a choice and ends `->->`. Tesseract's conversation can be closed: his `core_router` mappings have no `disableClose` (erb, `tesseract` NPC), and Esc closes any person-chat. On the next click the engine re-enters the owner knot with `ChoosePathString`, which resets the call stack (person-chat-minigame.js:551-566). The record line and its choices show, but any pick hits `->->` with no tunnel to return to. inkjs throws "Found tunnel onwards statement (->->), when expected end of flow" (`tess_tunnel2.cjs`; reproduced for `case_lesson`, `rec_albion` and `rec_derek`). With no `story.onError` the exception reaches handleChoice, which shows "An error occurred when processing your choice" (person-chat-minigame.js:1103-1105). Every later click lands on the same knot and fails the same way. Only a page reload recovers: the reload restarts at `start`, and `tess_case_step` resumes the records. The records are the heart of "every earlier choice lands" (Albion, Derek, the m07 debrief, the two dead agents), and the core is on the critical path for every ending. The other tunnels with choices are in `m10_six_oclock` (`more_menu`, `fortyseven_*`, `season`); that scene is `disableClose` and reopens only through its event knot, so it is safe | tesseract.ink:232, 258-269; the knots at :274, :313, :346, :373, :387 | Use the file's own reopen guard. Open each of the five knots with `{ tess_menu: ~ tess_menu = false - else: -> core_router }`, and put `~ tess_menu = true` on the line before each tunnel call (:232, :259, :262, :265, :268). A reopen then finds `tess_menu` false and re-routes: `core_router` → `case` → "Where was I. Your record." → the same record, called properly as a tunnel. No new lines. **Proved on a scratch copy** (`fixproof/`, inklecate + the engine's reopen): every reopen plays and picks without error, the record and recruiter order is unchanged, and a straight run still reaches "Three things." A reopen at `case_lesson` replays the pitch from "All four. Good." because `tess_case_step` is still 0 there; that is a repeat, not an error (phase 4 can move the step write earlier). Browser check: at the core, Esc on the Albion record's choice, click Tesseract, pick: no error, and the next record or the recruiter follows |

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R10-m1 | **A wrong accusation the player backed out of with Esc still works after the case is settled.** Each officer's `accuse_check` (arakawa.ink:187, malhotra.ink:56, phantom.ink:60, quintero.ink:119, vector.ink:82) asks HaX's "Wrong, and … Sure?" and writes `officer_out` and `wrong_accusation` on "[I'm sure.]". The gate (`*_can_accuse()`: `accused == ""`, `officer_out == ""`, `not wren_at_core`) is tested only on the menu choice that leads in, so a reopen at `accuse_check` skips it. Esc is the natural way to back out of "Sure?". Simulated (`accuse.cjs`) for Vector, Phantom and Malhotra; Arakawa and Quintero have the same knot. Park at "Sure?", name WREN on the line (or have another officer sent back), reopen, pick "[I'm sure.]": `officer_out` becomes the second officer. That overwrites the first officer's send-back, which `walk_officer`, Quintero's 06:00 line, `more_menu`, the Join and SAFETYNET credit clauses and the recall topics all read. The first man is still off the raid in the room, but the close forgets him. It also makes a fresh wrong accusation after the case is solved | the five `accuse_check` knots | Open each with its own gate: `{ not arak_can_accuse(): -> menu }` (and `mal_`, `pha_`, `quin_`, `vec_`). Divert to the knot each `[Forget I said it.]` already uses: `menu` for Arakawa, Quintero and Vector, `post` for Malhotra and Phantom. No new lines. Kowalczyk's card knots don't need it: her copies hide once she is accused or at the core |
| R10-m2 | **A parked cut call still talks the player through a shutter Wendell has since cut.** Vance's and Elena's calls park on "[Give me a minute.]" in the stitch `cut_N_menu`, whose owner knot is `cut_N` (vance_phone.ink:30, 43, 55; elena_phone.ink:31, 48, 60). HaX's `cut_step_0`/`cut_step_1`/`cut_breakers` park the same way if the phone is closed mid-call (phone_agent0x99.ink, `cut_call` and below). Only `cut_call` tests `gallery_shutter_cut`. This is the other half of R9-m5's route: walk away from Wendell, the phone rings, "[Give me a minute.]", go back and tell him. Wendell now cuts and clears `cut_by_hand`, but opening the call's thread re-runs `cut_N` (phone-chat-conversation.js:603-680) and offers "[Key's turned.]" or "[Pulling it.]" for a dead shutter. "Pulling it." then gives "That's it. Shutter's dead. Sixty-year-old kit…" for a cut Wendell made (`phone_cut.cjs`). Nothing at the close changes (`cut_by_hand` stays false), so this is spoken lines only; the player has to open the thread themselves | vance_phone.ink:30-71; elena_phone.ink:31-82; phone_agent0x99.ink `cut_step_0`, `cut_step_1`, `cut_breakers` | At the top of each step knot: `{gallery_shutter_cut: -> cut_call}`. `cut_call` already says "Shutter's dead already. You don't need me for that." (Elena's and HaX's have the same arm) and ends on "[Right.]". No new lines |
| R10-m3 | **Esc at protected Gary's first choice loses his pointer to Imran.** `consultant` sets `gary_c_seen` before the opener (gary.ink:26) and then offers "[Same supplier, then.]" / "[What are you doing down here?]". The reply and `consultant_imran` ("That's Imran at the far bench. I trained him. Talk him round or take him in, but talk to him first.", :37) come after the pick. A reopen (owner `consultant`) or a reload finds `gary_c_seen` and goes to `consultant_rest`: "He's at the far bench. Go on." (`gary_c.cjs`; the reload sweep finds the same three lines lost on all 16 presets). The m02-protected payoff, Gary vouching for the man he trained and framing the choice, is gone for anyone who backs out of the first menu | gary.ink:26, 36-39 | Move `~ gary_c_seen = true` from :26 to the first line of `= consultant_imran`. A reopen or reload before the pick then replays the opener and the two choices. No new lines |
| R10-m4 | **A reload drops a fight the player chose.** Hostility isn't saved (nothing in the state sync or npc-conversation-state.js writes it), and a reload restarts at the NPC's knot with ink-locals only. **Voltage:** `escaped` (voltage.ink:197-218) routes only the stand-downs to `escaped_rest`, so after "[Step away from the board. Now.]" and a reload he talks again ("You came back…") and offers the talk-down or the print (`volt_fought.cjs`). Picking it writes `talked_down` (or `stood_down_print`) over `fought` and cuts the shutter, while `cut_by_hand` stays true from the fight (:265). The credits then say "Checked the sums. Stood down." beside "ROBERT VANCE: Talked 0x00 through 1960s switchgear from Teesside." (erb:678) or Elena's row, for a cut Voltage made. This is R8-m3's class from the other side. **Victoria (threat):** after a miss and a reload, `threat_missed` (victoria.ink:177-186) says "We're past talking." and offers "(Back off.)", but she is no longer hostile, so the pistol scene goes slack | voltage.ink:201-203; victoria.ink:177-182 | Voltage: at the top of `escaped`, after the default, `{voltage_outcome == "fought": -> fight}`. That re-arms both hostiles with the existing "Then be quick about it." No new lines. Victoria: put `#hostile:victoria_threat` on the `else` arm of `threat_missed` (the line that only plays on a fresh entry). Check after a reload: Voltage and Static attack again and `voltage_outcome` stays `fought`; Victoria raises the pistol |
| R10-m5 | **The 06:00 lines for `avoided` deny a conversation the player had.** Unprotected Gary writes `avoided` on his first line (gary.ink:67-69), so a player who heard all three beats ("Seven warnings, nobody listened. You're listening now?") and left on "[Give me a minute.]" is still `avoided`. The fitter's spare card (erb:2939-2950) or Imran's card gets them through, so this is an ordinary route. At 06:00 Gary is offered and says "Nobody came to my bench all night. Same as St. Catherine's." (six_oclock.ink:260). The player came to his bench and listened, which is the opposite of what the line accuses them of. Imran is the same on a cold or protected save: heard, HaX's cost said, "[Give me a minute.]", then "Nobody asked me anything all night. Same as the board." (:275) and the credit "Never asked. Still at his bench at six, under his own sheet." (erb:652) | six_oclock.ink:260, 275; erb:652 | Reword so the line holds on both readings: Gary "Nobody decided anything about me all night. Same as St. Catherine's."; Imran "Nobody made me choose, all night. Same as the board."; credit "Left at his bench at six, under his own sheet." Two voiced lines reworded, credit unvoiced. Or, to keep the sharper lines for players who never spoke to them: set a global (`gary_heard`, `imran_heard_out`) in `tech_1` and `imran_margin`, and give the heard case its own line. That costs two new voiced lines |

## Reopen sweep (every person-chat and phone ink)

`sweep.cjs` flagged 179 (ink, owner knot, global) groups where a fresh entry reacts to a changed global and the reopen doesn't. Triage:

| Group | Verdict |
|---|---|
| Any knot × `ending` (Arakawa, Kowalczyk, Malhotra, minders, Nightshade, Phantom, Quintero, Vector, Netherton, `hax_post`, HaX's hub) | Can't happen. Tesseract's last close opens a `disableClose` closing scene 1.5 s later, and `after_end_json` hides the bunker copies, so nobody is reopened after an ending |
| `six_oclock`, `hearing`, `citadel` (every global) | Can't happen. All three are `disableClose`, and they reopen only through `game_loaded` → `start` (an event start, so a fresh knot) |
| Own-outcome flips (Gary `gary_outcome`, Imran `imran_rest`, Victoria's three menus, Voltage `escaped_menu`/`captured_menu`/`cut_pN`, Vos `vos_menu`, Wendell) | Can't happen. The only outside writers are the NPC's own knock-out (no talk afterwards) and `room_exited` defaults that write only over `""`, which the entry knot has already replaced |
| Voltage `cut_pN` × `cut_step`; `captured_rest` × `gallery_shutter_cut` | Can't happen on a captured save (the deferral section) |
| Asante `warned`, Vos `vos_rest` × `outer_lock_open`, guards `passed` | The flip is the impossible direction (one-way flags) |
| Kowalczyk `gone`, `menu` (× `clue_door_log`, `nightshade_tethered`, `wren_warned`) | Safe. Her copies hide on `kowalczyk_gone_ahead`, and each room has its own copy and its own entry, so the next room's peel runs fresh |
| Nightshade `van` × `door_scene_done` | Safe. The van copy is the silent branch, and the tether writes `door_scene_done` along with its own outcome; "Door." stays true |
| Guards `fight` | Out of scope for the close (as in R9). The same reload re-arm as R10-m4 would apply if the guards matter later |
| **Vector `accuse_check`** × `accused`, `officer_out`, `wren_at_core`, `whodunit_live` | **R10-m1** (the same knot in four other inks) |
| **HaX `cut_step_0`, `cut_step_1`, `cut_breakers`** × `gallery_shutter_cut` | **R10-m2** (Vance and Elena by hand: `phone_cut.cjs`) |
| Voltage `escaped_rest` × `casualty_sheet_read`, `voltage_print_lifted` | Shows the reload side of **R10-m4**: the entry knot doesn't route `fought` to rest |

The sweep compares choices only, so two classes needed their own checks:
- **Tunnels holding choices.** Found by listing every knot that has both a choice and `->->`, then reopening each: **R10-M1**.
- **Lost lines on a reload.** `reload_sweep.cjs`: Esc at each of the first three choice points, reload, talk again. Ten lines are lost:
  - Gary's three (**R10-m3**).
  - Tesseract's optional head-start reply and his "I'll be here."
  - Voltage's reply to "[I'll write it down.]" / "[We'll see.]".
  - Wendell's switch line and his Dale line. His resting line ("Dale's staying home. I guess I owe you for that.") still carries the outcome.
  
  None of the last three changes a state or drops a carry-over. Not raised.
- **Fight state on a reload** (no checker catches it; found by reading): **R10-m4**.

Phone threads were checked by reading against the engine's rule (re-run only when a global changed, unseen lines only):
- Ghost's call is `disableClose`.
- Victoria's line diverts to `call_after` on `victoria_line_done` once the gallery abandons it.
- HaX's calls end in `DONE` and restart at `start`.
- Only the parked cut calls go wrong (R10-m2).

## The six endings on rich, cold and mixed saves

These are static traces through the ink and the card and credits source on HEAD, with the reopen and reload rules applied. The user's test is whether every earlier choice lands at the close and whether the season ends well.

| Save | What the close does | Lands? |
|---|---|---|
| **Rich surrender** (m01-m09 played, Gary protected, Victoria recruited and confronted, Voltage captured and his hands, m04 full, m07 debrief, m09 memo and notice, Nightshade shown and taken in) | Tesseract reads two records (Albion with the memo answer, Derek) and answers each; the exchanges have record slots for each mission. At 06:00: the walkabout, Ghost's word, the numbers, "Sterling's line went dead at five." or the secured cell, the van with Nightshade at the window, the season and memo lines, "He asked who taught you. I said I did." Then the card and the credits, person by person | **Yes**, unless the player presses Esc during the records (**R10-M1**: the core errors until a reload) |
| **Rich, protected Gary, Esc at his first menu** | Imran's choice is still offered, but Gary's framing ("I trained him… talk to him first") is gone. At 06:00 Gary's line by Imran's outcome still lands | **Partly** (R10-m3) |
| **Cold lethal** (no imports) | Records: `rec_cold` (the two dead agents). 06:00: Quintero, Imran, Wendell; "There'll be a board. I'll be sitting next to you." A cold player who heard Imran out and took the fitter's card hears "Nobody asked me anything all night." | **Partly** (R10-m5) |
| **Mixed arrest, unprotected Gary heard out, fitter's card** | At 06:00 Gary: "Nobody came to my bench all night." The player stood at his bench through three beats | **No** (R10-m5) |
| **Mixed arrest, escaped Voltage fought, reload, then talked down, Vance an ally** | "Checked the sums. Stood down." beside Vance's switchgear credit; Static "Went where Voltage went." after he too was made hostile | **No** (R10-m4) |
| **Mixed arrest, Esc at "Sure?" for Vector, WREN later named on the line, then "[I'm sure.]"** | Two officers sent back in the room; the close and the credits name only Vector | **No** (R10-m1) |
| **Mixed scorched, walked from Wendell, Vance call parked, Wendell told** | The close is right (Wendell "Rang his mate Dale.", no Vance row). Opening Vance's thread talks the player through a dead shutter | **Yes** at the close; the call is wrong (R10-m2) |
| **R9's saves** (recruited Victoria before the lock, Vos with and without the m03 knock-out, Asante after Wendell, Imran over a knocked-out Gary, Wendell after a walk-away) | As R9 asked | **Yes** (R9-m1 to m5 closed) |
| **Rich scorched, cold executed, Join** (R6-R9's saves) | As before | **Yes** |

| Ending | Last in-scene beat | Season line | Open |
|---|---|---|---|
| Arrest (incl. hold fire) | "I said no. It took me till morning." | in `the_rest` | M1 at the core; m1, m3, m4, m5 on those saves |
| Surrender | "He asked who taught you. I said I did." | as arrest | as arrest |
| Lethal | "There'll be a board. I'll be sitting next to you." | as arrest | as arrest |
| Executed | HaX's message read in the van | none (by design) | M1; the credits carry m1 and m4 |
| Scorched | The hearing: HaX on whether she was asked | after the map line | as arrest |
| Join | Netherton: "Find 0x00…" | none (by design) | M1; m1 and m4 in the credits |

Taken as a whole, the close still does what the user asked. Every earlier mission has a voice at the core (the records, the exchange slots, the stings) and at 06:00 (walkabout, numbers, season and memo lines, HaX's "rest"), and the credits finish the job person by person. Join and executed end hard and on purpose. What is left is narrower than R9's set. One engine rule hurts the most important conversation in the season: a reopen resets the call stack, which breaks Tesseract's tunnels. The rest are spots where a back-out (Esc, a reload, walking off) makes a later line or credit say something that isn't so.

## Rubric (ten rows)

| # | Dimension | R9 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | none | none | none |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | none | minor | R10-m2 (her parked cut steps) |
| 4 | Ink craft | minor | major | R10-M1 (tunnels with choices under the engine's reopen), R10-m3 |
| 5 | Moral choices and consequences | minor | minor | R10-m1, m4, m5 |
| 6 | Music | none | none | none |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | minor | minor | R10-m4 (a fight lost on a reload) |
| 10 | Bookends | none | minor | R10-M1 blocks the way to every ending until a reload |

## Deferred to phase 4

These are not findings; they are noted for the dialogue phase.
- **A reopen at `case` before `tess_case_step` is set** replays the pitch from "All four. Good." (up to eight voiced lines). Moving `~ tess_case_step = 1` up, or splitting the pitch into resumable knots, would stop the repeat.
- **Wendell's `wendell_switch` on an Esc** repeats "*pause* Well. Which switch do you want."
- **Imran's reopen after Gary is knocked out** opens with "They sacked the whole team and kept the board. You'd have taken this job too.", the line he has just said in `follows_gary`.
- R9's list stands: Vos's post-four "waiting for a delivery", escaped and threat Victoria's order lines after four, Fonoti after the lock, single-line first meetings after the lock, and the dialoguelint backlog.

## Withdrawn, not raised, and browser checks

- **Withdrawn after checking:**
  - The deferral (captured Voltage, `by_hand`, Wendell cuts). Unreachable: Wendell and every phone voice are off on captured saves (deferral section).
  - Kowalczyk's card knots after WREN is named elsewhere. Her copies hide on `accused`, `wren_entering` and `wren_at_core`, so she can't be reopened.
  - `six_oclock`'s tunnels with choices. `disableClose`, and reopened only by event start.
  - Victoria's line after the gallery abandons it. It diverts to `call_after`.
- **Not raised:**
  - The fixer's captured-Voltage guards are dead code. Harmless.
  - The reload sweep's other lost lines (Tesseract's head-start reply, Voltage's write-it-down reply, Wendell's switch line). No state or carry-over is lost.
  - Wendell's cut never blinds the gallery camera, while every phone and Voltage cut offers to. That is a design difference, not an alignment gap.
- **For the orchestrator:**
  - Voiced delta, if the fixer takes the suggested fixes: R10-m5 rewords two lines (Gary, Imran), or adds two lines if the flag route is taken. Everything else adds nothing.
  - R10-M1 shows a tooling gap. A lint rule that flags "a knot with a choice that ends `->->`, in a conversation without `disableClose`" would have caught it. That belongs in `docs/IDEAS_BACKLOG.md`, beside R9's reopen-guard idea.
  - The fixer's harness needs the engine's owner rule (the first path segment only), not `knot.stitch`.
- **Static proof for the fixer:** `m10_r10/` in the session scratchpad.
  - `tess_tunnel2.cjs` (the crash) and `fixproof/` (the patched Tesseract, compiled with inklecate, plus `test.cjs`).
  - `accuse.cjs`, `phone_cut.cjs`, `gary_c.cjs`, `volt_fought.cjs`.
  - `sweep.cjs` and `reload_sweep.cjs` for a re-sweep.
- **Browser checks for the fixer** (keyless :3001):
  - At the core, Esc on a record's choice (Albion or Derek), click Tesseract, pick: no error, and the records continue.
  - Vector: "You're WREN." → Esc at "Sure?"; name WREN on the line; talk to Vector: no "Sure?".
  - Walk away from Wendell; Vance rings; "[Give me a minute.]"; tell Wendell; open Vance's thread: "Shutter's dead already."
  - Protected Gary: Esc at his first menu, talk again: the opener and the two choices.
  - Escaped Voltage: "[Step away from the board. Now.]", reload, approach: he attacks; `voltage_outcome` stays `fought`.
  - Unprotected Gary heard out, fitter's card, arrest: his 06:00 line no longer says nobody came.
