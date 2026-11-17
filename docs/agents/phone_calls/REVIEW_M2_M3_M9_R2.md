# Review R2: M2, M3, M9 (and the m09 and sis02 lab sheets)

Reviewer: Opus, fresh context, 2026-11-12. Findings only. The only file edited is this one.

Commits read: 7da501f44 (R1 fixes), b3c800afe (outcomes, proofs, route scripts); HacktivityLabSheets 08e2e7a. The engine was read as committed at HEAD (`git show HEAD:…`). I ignored the uncommitted A2b edits in the tree.

## Verdicts

| Slice | Verdict | Why |
|---|---|---|
| M2 | **accept** | The m5 proof gap is closed (`proofs/M2/m09_sorensen_door_hax.png`, `m10_tesseract_hax.png`: HaX's portrait, name, `agent_0x99` requests). The n6 prefixes change only the speaker id (40 lines, all `Agent HaX:` → `agent_0x99:`), and the JSON recompiles identical. |
| M3 | **accept** | M1 is fixed and works the way the engine does it. The R1 fixes add one minor regression, m1 below (the known gap): nothing is lost for good, but it is worth the small fix. No path plays a read-out twice, gives the item twice, or blocks a voiced scene, the Recruiter's ring or the ending. |
| M9 | **revise (text only)** | m6, m7 and n8 are fixed as asked. Four more player-visible "call" lines for sis03 text contacts remain (m2). |
| Lab sheets | **accept** (m09, sis02) | The m8 and m9 edits match what the player sees. The sis03 sheet's one sentence is part of m2. |

## Checks run

- **Validator** (`--skip-ink --no-graph --no-lint`, so no shared files were rewritten): m09 0 errors, 25 warnings, none on the new mappings (no "texts less than 4 s apart" for `game_loaded`). sis02 3 errors and sis03 4 errors, all `minigameData` schema fields on `hmi_eng_02` and `claims_management_system`, which the slice didn't touch and which the outcomes also list as pre-existing. lab_physical_pentest 0 errors, 5 warnings.
- **dialoguelint** on m09: 5 not-x-but-y and 1 you-after-choice. No finding on a changed line. The two Derek handwriting lines now carry the `agent_0x99:` prefix. `[timed texts] texts=0` is still the open n4 (logged for A7).
- **Ink:** fresh inklecate builds of `m09_phone_agent0x99`, `m09_sorensen_door` and `m09_noor_haddad` match the committed JSON.
- **`tts_mission_lines_test.rb`** under `flock /tmp/be-test-suite.lock`: 5 runs, 44 assertions, 0 failures. The tree has another agent's uncommitted `tts_line_extractor.rb` edit, so this ran against that.
- **Proofs looked at:** `M3R1/early_open_output.txt` and `early_4_stale_tap.png` (thread opened before the text: no text or toast, one salvage note; a forced stale tap shows the hub), `reload_early_thread.png` (one ledger text, then the read-out), `M2/m09_sorensen_door_hax.png`, `M2/m10_tesseract_hax.png`.

## How the engine handles `skipIfGlobal` and the latches (checked)

- `_handleEventMapping` passes `sendTimedMessage.skipIfGlobal` to `scheduleTimedMessage` (`npc-manager.js:1276-1286`). `_deliverTimedMessage` returns without adding to history or showing a toast when the global is truthy (`:2021-2026`). That return is `undefined`, not `false`, so the message is marked delivered and never retried. The toast gets the same test as `stillValid` (`:2052-2054`). The hold queue re-checks it on release, and `_dropStaleVisibleBarks` closes a visible toast when a minigame closes (`npc-barks.js:487-500`).
- A pending text keeps `skipIfGlobal` through a reload (`exportTimedMessages` / `restoreTimedMessages`, `:2149-2228`).
- A `delayMs` mapping re-checks its condition when the delay is up, and waits while any minigame (the phone included) is open (`:634-654`). So a thread opened inside the 2.5 s window means the main mapping never fires: the condition sees `*_heard`, so the latch stays unset and no text is scheduled. The backstops then fail on `!*_heard`.
- Game action tags run before the typing animation (`phone-chat-minigame.js:809-840`), so `#set_global:ledger_read_heard` / `hour_read_started` are set as soon as the read-out opens, ahead of the 5 s text. `flag1_read_heard` is now a declared global, so `~ flag1_read_heard = true` already writes through the observer. The tag on the next line is redundant but harmless.
- `#set_global` also broadcasts into every loaded story (`chat-helpers.js:589-596`), so the saved story state carries the heard flags.

## Walk-through per read-out

Rows: toast tapped / toast ignored, then the thread opened / thread opened early / reload at each stage / closed mid-knot.

| | flag1_read | ledger_read | afterwards | hour_read |
|---|---|---|---|---|
| Tapped | Plays once. A second tap goes to the hub. | Same | Same | Same |
| Ignored, opened | Hub divert plays it (the baseline under the old globals doesn't divert, so all of it is new and its tags run, `#give_item` included) | Same | Same, unless `hax_scene_pending()`: then the `[Afterwards.]` topic | Same |
| Opened early | Text skipped, toast closed; proof `early_*` | Same mechanism (tag before typing) | Same (`afterwards_heard` is on the last line, which is before the only choice) | Same (`hour_read_started` on body line 2) |
| Reload, mapping not yet fired | Backstop, 5 s | Backstop, 10 s; proof `reload_early` | Backstop, 15 s | Backstop, 20 s (disjoint from the `game_loaded` re-ring, which needs `hour_read_started`) |
| Reload, text pending | Restored, one copy, still skippable | Same; proof `reload_pending` | Same | Same |
| Reload, delivered | Latch set, no backstop | Same; proof `reload_delivered` | Same | Same |
| Closed mid-knot | **m1** | **m1** | No mid-knot choice, nothing to lose | Forced re-ring (`conversation_closed`, `room_exited`, `game_loaded`) to `hour_read_resume` → `body`. The ending is not blocked. |

- **Item twice:** no path. A stale tap goes to the hub. The reopen re-run only runs tags from new steps, and the baseline has the same `#give_item` step, so it is dropped.
- **Voiced scenes, Recruiter, ending:** none of them reads a read-out shadow. The Recruiter keys on `ledger_read_heard`, which the read-out sets on its first line, however it is opened. `tesseract_call` keys on `hour_read_done`, which the forced re-ring guarantees.
- `hax_voiced_scene_pending()` is exactly the old guard 1 condition, and `hax_scene_pending()` is exactly the old union.
- **Moving the `hour_read` re-ring to `hour_read_resume` is required and correct.** With the new guard, a re-ring at `hour_read` would land on the hub (with `hax_scene_pending()` true, so no divert), and the hour read and `tesseract_call` would stall. `hour_read_resume`'s `else` enters `body` just as the old target did. No other mapping targets `hour_read`.

## Findings

### M3

**m1 (minor, regression from the R1 guards; the known gap): a reopen with changed globals after closing mid-read-out skips the rest of flag 1's and the ledger's read-outs.** `ink/m09_phone_agent0x99.ink:222` and `:258`.

- **Mechanism.** `reopenWithCurrentGlobals` re-runs the knot that owns the first choice (`phone-chat-conversation.js:625`). The baseline run (the saved state, which holds the heard shadow) and the real re-run both hit the new guard and go to `support_hub`, so the player lands on the hub choices with nothing new shown. Before R1 both runs replayed the knot, the shared prefix was dropped, and the player was back at the first choice.
- **How likely it is.** Very likely for flag 1. The field-guide text sets `ledger_guide_offered` 15 s after flag 1 (`scenario.json.erb:233-234`). Its `delayMs` waits for the phone to close, so a player who closes at `[Ledger or stacks first?]` (`:233`) flips a global the story holds, and every reopen after that lands on the hub. For the ledger, any held global works the same way (`stacks_entered`, `in_cage` and so on).
- **What is lost, and whether it matters.**
  - Flag 1, `:236-246`: the three answers, "Her card's on a reel at her hip", "Salvage cage, their own code" and the Tomb Beta line. Each has a fallback: hub topic 15 ("The gate takes her card", `:889-890`), the status ladder (`:1043`, `:1059`, `:1038`), the keypad topic and the objective titles. The salvage note is given on the first line, so it is safe.
  - Ledger, `:266-296`: "I've told the Director…", the m05/m07/m08 callbacks, and the H&L file number `HL2015-0477` (`:287`), which is the H&L box lid password (`scenario.json.erb:1469`). The number is also on the drop terminal screen once flag 2 is in (`:1669-1672`), and the WREN topic (`:842`) says "You've got the number", so it can still be found. The recap lines are lost.
  - Afterwards: nothing (no choice before its last line). Hour read: nothing (the forced re-ring).
- **Blocks acceptance?** No. No clue, item or global another beat reads lives only in the skipped lines. It is still worth fixing, since it is about ten lines and puts back the pre-R1 behaviour.
- **Smallest fix.** A two-level guard, with an ink-local "finished" flag per knot:
  - `flag1_read`:
    - Add `VAR flag1_read_done = false`.
    - The guard becomes `{flag1_read_done: -> support_hub}` then `{flag1_read_heard: -> ask}`.
    - Move the first choice block into `= ask` (choices only).
    - Set `~ flag1_read_done = true` on the Tomb Beta line, before both `{flag1_to_hub: …}` and `[Got it.]`.
  - `ledger_read`: the same.
    - `{ledger_read_done: -> support_hub}` then `{ledger_read_here or ledger_read_heard: -> ask}`.
    - `= ask` holds the `[TF Null…]` / `[Who is WREN?]` block.
    - `~ ledger_read_done = true` before `[Got it.]`.
    - Optionally a `more` stitch for `[What else is on the entry?]`, so a close at that choice doesn't re-ask the first block.
  - **What changes.** The re-run and the baseline both go to `ask`, so the player lands back on the choices, as before R1. A stale tap mid-knot also shows only the choices: no replay and no second `#give_item`. A stale tap after the end still shows the hub. The re-run still finds the knot, because the stitch path `flag1_read.ask…` splits to `flag1_read`.
  - **Cost.** No spoken line changes (these texts are unvoiced). Recompile, re-run dialoguelint, and add a live proof: close at the first choice, wait 15 s, reopen, and show the choices with Tomb Beta reachable.

**n1 (nit):** `scenario.json.erb:141`. The `read_text` comment says the latch "is set when the text is sent". It is set when the mapping fires, which is when the text is scheduled (the comment at `:310-314` says so correctly).

### Other R1 outcomes

- **n1 (R1) change: sound.** Calling `hax_scene_pending()` in guard 1 would have caught the Recruiter-pending case and shown "One moment" instead of "Her call first", so the split into `hax_voiced_scene_pending()` is correct.
- **n3 (R1) rejection: sound.** With `deck_choice_made` true, `hax_scene_pending()` can still hold through `identity_scene_started && !identity_scene_done`, `hour_read_started && !hour_read_done` or `tesseract_call_started && !tesseract_call_done`. A player who ignored the afterwards toast can reach those. The hub's divert to `afterwards` is then held back, and `[Afterwards.]` (`:834-835`) is the only way in. Keep it.
- **m2, m3 (R1) texts:** "Her call first. I'll be on it with you.", "First box is in. It came with a list." and "The job on his box has a clock on it." all fit. None points at itself, and the shapes vary.

### M9

**m2 (minor): sis03 text contacts still ask to be called, in four player-visible places.**

- `sis03_cyber_insurance/scenario.json.erb:788`. Hartley's second text reads "Call me about the contested items…". His first text, two bubbles up in the same thread, says "Message me when you've reviewed it" (`:776`). This is exactly the "reads as a call inside a text thread" class M9 was for. Fix: "Message me about the contested items: …".
- `:676`. Eleanor's text after the NCSC brief reads "Call him on the claims phone for what the NCSC knows about the Trent side". Ngata's own text says "Message me once you've read it" (`:806`). Fix: "Message him on the claims phone for what the NCSC knows about the Trent side."
- `:119`. The claims phone's description says "(NCSC threat assessment lead; call him once you have read the NCSC brief)". Fix: "message him once you have read the NCSC brief".
- HacktivityLabSheets `_labs/security_informed_safety/sis03_cyber_insurance.md:104` says "and phone three people", while `:146` says they are "contacts on your claims phone". Fix: "and message three people on the claims phone". The outcome's "No sis03 sheet quotes it" is true of the task title, not of this sentence.
- All four are silent text, so there is no audio. `lab_social_engineering:24` keeps "Ruth on speed dial", which is right: Ruth is a voiced call there, and that lab is frozen.

The sis02 objective, the sis03 aim description and task title, and the lab_physical_pentest phone description read correctly against what the player sees. sis02's lab sheet `:656` matches the new aim title. No other "Call Marcus" remains in the sheet or the scenario.

### Lab sheets (08e2e7a)

- **m09:** `:369` (open HaX's text about the ledger, then the ring), `:478` ("the Architect ringing HaX") and `:488` ("stay on while HaX takes the Architect's call") all match. `tesseract_call` is forced (`disableClose`), so "stay on" is right. `:364` already said to open her text.
- **sis02:** `:656` is right.
- VM companions not opened.

## Counts

0 blocker, 0 major, 2 minor (m1 M3, m2 M9), 1 nit (n1).
