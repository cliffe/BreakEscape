# NPC icons wiring, code review round 1

Branch `build/icons-wiring`, head 5e8af31f6, reviewed as `git diff 6192486b6..HEAD` (4 commits, 13 files).

What I ran:

- `bin/test-js` on the new and changed files alone: `npc-workaround-barrier-icons`, `npc-needs-usb-policy`, `npc-pressing-needs`: all pass. Also the neighbours that import the touched modules (`npc-needs-work`, `npc-needs`, `npc-coffee-off`, `npc-office-visuals`, `npc-needs-slots`, `npc-workarounds`, `dungeon-graph-workarounds`, `validator-access-work`, `workaround-door-label`, `npc-social-pairing`, `npc-queues`, `office-presets`): all pass.
- A probe on `fixtures/needs-work-world.mjs` (share and printer down) that prints which icon the renderer would choose on each tick (scratch file, deleted).
- Two mutations of `npc-needs.js` (restored afterwards) to see whether the new tests notice.
- `tools/npc_icon_cleanup.py --dry-run`, and a pixel comparison of the committed PNGs with the pick (f373df648) and with the script's output.
- The live screenshots in the scratchpad `icons/` folder (`trio.png`, the 1233 state files).

## Blocker

None.

## Major

### M1. The first failure on a down resource with an object never shows the barrier

`public/break_escape/js/systems/npc-needs.js:2094` sets `failedShow` to run 4 s from the end of the failure line, and `:2117` in the same `_countFailure` queues a check visit for the first down resource that has an object. The queued visit starts on the next tick the NPC is idle or returning (`:1328`, before the selector), so the NPC has a job by the time the line ends. `stateIconEntry` returns null for any NPC with a job (`npc-action-icons.js:141`), and the check visit shows `work`. The 4 s run out during the visit.

Failure scenario (probe on the work fixture, `printer_jammed` and `share_down`): at 5.25 s the use fails and the line shows; at 7.75 s the line ends and the check visit begins (`work`); at 11.75 s `failed` goes null while the visit is still running. The barrier is never drawn. On the next two failures (resource already in `s.checked`) it shows for 4 s as intended. So the failure that matters most, the first one, the one that starts the student's reading of the NPC, is the one that loses its icon. The live run did not catch this because `stores` had presumably been checked already by the time of the screenshot. An `emit` workaround due in answer to that failure has the same problem: `showWorkaround` starts its 4 s while the check visit's job hides it.

Fix (pick one): (a) hold a queued check visit until `failedShow.until` has passed (in `_startVisit`, return false while `s.failedShow && this.clockMs < s.failedShow.until` for a `check` visit); or (b) show `barrier` for a check visit's job while `failed` is set, in `pickIconEntry` via a `job.failedNow` flag from `getState`; or (c) pause the timer while a job runs (store the remaining ms and resume it when the job ends). (a) is the smallest and keeps the order "line, barrier, then off to check". Apply the same to `workaroundShow`. Add a test on the fixture with `printer_jammed` that steps tick by tick and asserts `stateIconEntry(...).key === 'barrier'` at some tick after the line ends.

### M2. The "timed from the end of the line" rule (user decision q27) is untested

`test/js/npc-workaround-barrier-icons.test.mjs:91` uses the line "Share's down again." (19 characters, `bubbleMs` 3450 ms, under `FAIL_SHOW_MS`). With `+ said` removed from `npc-needs.js:2094` the test still passes: 4 s from the failure still outlasts the line. Likewise `:134` calls `showWorkaround` with no line showing, so removing `said` from `npc-needs.js:1905` passes as well. Both mutations survived.

Failure scenario: a later refactor drops the offset; a 39-character line (4000 ms, `CHAT_MAX_MS`) then hides the whole barrier and every test stays green.

Fix: in the failure test use a line of 30 characters or more (4000 ms) and assert `failed` is still set at least 3 s after `talking` clears; in the `showWorkaround` test start a line first (for example `sys.mutter('dana', 'work_fail')` with a chatter pool) and assert `workaround` is still true 3 s after it clears.

## Minor

### m1. A borrowed PC's use has no after-show, unlike a visit

`npc-needs.js:2277` keeps the icon 4 s after a done workaround visit because the start line (`MUTTER_BUBBLE_MS`, 6000 ms) can cover a short visit. `borrow_session` has the same start line (`wk_borrow`, `npc-workarounds.js:58`) and `_borrowDone` (`npc-needs.js:3018`) does not call `showWorkaround`. Failure scenario: a hot desk two tiles away with `useSeconds: 3`; the walk plus use is under 6 s, the speech bubble hides the action icon throughout, and the student never sees `workaround` for the borrow (the Tom case from the first live run, for the other kind). Fix: call `this.showWorkaround(id)` in `_borrowDone` when the borrow started, and extend the visit test to the borrow.

### m2. README overstates which failure pictures are the barrier

`README_scenario_design.md:1033` says "A failure mutter with no line shows the barrier as its picture". Only `station_fail`, `work_fail_no_access`, `work_fail_fed_up`, `social_blocked` (and `usb_refused`) do; `work_fail_file_share` shows `file`, `work_fail_printer` `print`, `work_fail_email` and `work_fail` `work` (`npc-needs.js:92-99`, unchanged). Failure scenario: an author with a printer outage and no lines expects the barrier picture and gets the printer. Fix: "A refusal or no-access mutter with no line shows the barrier as its picture (a down printer or share shows its own); a workaround's start line shows the workaround picture." The same bullet also says the barrier follows "a failed use"; it follows a counted failure of a judged use only (not a USB refusal, which only gets the picture). Worth one word: "a failed work use".

### m3. A borrowed use no longer honours a scenario's object-id icon

`npc-action-icons.js:126` returns `workaround` before the target lookup, so a scenario `actionIcons` entry keyed by the borrowed PC's id (or `print`, or the need) no longer wins for that use. That is the intended q21 behaviour, but `docs/achitechture/NPC_NEEDS_SYSTEM.md:357` still says "a use tries the object id, then `print` ..." with no exception. Failure scenario: an author gives `hot_desk` its own icon and wonders why it never shows. Fix: add "(a workaround visit or a borrowed PC's use shows `workaround` first; a scenario `workaround` entry overrides it)" to that sentence.

### m4. The workaround timer survives an intervening job and can reappear

`workaroundShow` is not cleared when a new job starts. Failure scenario: an emit at t=0, the NPC at once takes a 2 s coffee use (a short `useSeconds`), finishes at t=3 s, and the arrow pops back for 1 s over an NPC that is plainly not doing a workaround. Same for `failedShow` across a short unrelated job. Low odds, visible flicker when it happens. Fix: clear `s.workaroundShow` (and `s.failedShow`'s icon part, keeping `failCause`) in `_startJob` unless the new job is itself a workaround; or accept it and note it in the plan.

## Nit

- n1. `npc-action-icons.js:136-139`: the `stateIconEntry` JSDoc still says the slot is "noticed" or "blocked", shown only with `showPressingNeeds` or a scenario entry. `workaround` and `barrier` now show without either. Update the comment.
- n2. `tools/npc_icon_cleanup.py:477`: "the outline was 20 near-black shades (#00101b to #361018)". The pick has 29 distinct dark shades recoloured (73 pixels); the range is right. Say 29, or drop the count.
- n3. `tools/npc_icon_cleanup.py` reports "205 pixels changed" for `workaround` and 199 for `barrier` because it compares RGBA including the RGB of fully transparent pixels. The real changes are 73 recoloured plus 1 added (workaround) and 41 recoloured (barrier). Pre-existing behaviour, but the inflated number makes the "exact edit" hard to audit. Fix: skip pairs where both alphas are 0.
- n4. `test/js/npc-workaround-barrier-icons.test.mjs:131`: the visit test asserts `getState().workaround` after the visit but not that no job hides it (`after.job` may be non-null and the assertion `after.job?.workaround ?? false` still passes). Assert `after.job === null` or call `stateIconEntry(after)` as the failure test does, so it checks what is drawn.

## Checked and fine

- Priority with no job: `noticed` (only where it shows), `workaround`, `barrier`, frustration `blocked` (pulse at 2, faded on `causeCleared`, q17), leashed `blocked`. The code matches the docs and the tests cover each step. A hidden `noticed` (not opted in) correctly lets the barrier through; the frustration branch keeps its old `!st.noticed` guard.
- Speech bubbles: the renderer hides the action icon while `talking` (`npc-action-icons.js:554`); the failure grumble is shown before `_countFailure` in both callers (`npc-needs.js:1504-1505`, `:1856` then `:1866`), so `said` measures the right line. `emit` has no start pool, so `showWorkaround` only waits for a line already up.
- Reload: `failedShow` and `workaroundShow` are transient and absent after a reload, so nothing sticks; the q17 faded icon still comes from `_seedFailCause`. Not run live.
- Many NPCs: all state is per NPC; no shared timer or lock was added.
- Scenarios without 9.2 (`test_needs_sims`, `test_npc_needs`, `lab_physical_pentest`): `failed` is only set by `_countFailure` (judged needs), `workaround` only by the runner or a workaround visit, `job.workaround` only for a borrowed job or a workaround visit. None of the three scenarios' `actionIcons` define `workaround` or `barrier`. No validator or Ruby list of icon names needs the new names. The office-life `blocked` picture (`grumble_printer_off`) is unchanged and tested.
- Switched pictures: `station_fail`, `work_fail_no_access`, `work_fail_fed_up`, `social_blocked`, `usb_refused` and the four `wk_*` topics are used only by the needs system's mutter and failure paths and the workaround runner; nothing else (server, validator, tests outside 9.2) reads their pictures. The meanings hold everywhere they appear. `social_blocked` as a `why` code in `npc-work.js`, `access_work.rb` and `npc_frustration.rb` is a different namespace and untouched.
- Pixel edits: both PNGs are 16x16 RGBA with only alpha 0 and 255; the committed files equal the script's output byte for byte in pixels; the base branch's files equal the pick f373df648; every change is a dark outline pixel recoloured to `#16141e`, plus one added outline pixel at (5,10) in `workaround`. No fill pixel moved or changed, no resampling. `--dry-run` reports no problems for any of the 18 icons.
- Docs: the plan 5.5 text, `NPC_NEEDS_SYSTEM.md` and the `OFFICE_LIFE_PLAN.md` table match the code apart from m2 and m3.

## Verdict

Not ready to merge. Fix M1 (the barrier is lost on the first failure of a resource with an object, and an emit's icon with it) and M2 (the q27 timing has no test that fails without it). m1 and m2 are small and worth doing in the same pass; the rest can follow.
