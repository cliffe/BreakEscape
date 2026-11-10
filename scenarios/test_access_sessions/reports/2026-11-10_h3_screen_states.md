# test_access_sessions: H3 screen-state run (H3a and H3b)

Run by a scripted Haiku tester following `scenarios/test_access_sessions/PLAYTEST.md`, section "H3: screen states in the other scenarios". Date 2026-11-10.

- **Server:** keyless, :3001 (already up, not restarted). Headless Chromium (`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`, `--headless true`).
- **H3a:** `test_access_sessions`, game 44 (mission 163). Session log: `/tmp/claude-0/-home-user/00ac45c7-5637-5831-96c6-3d6101c5b398/scratchpad/h3/session-44.jsonl`. Access responses: `.../scratchpad/h3/test_access_sessions-h3a-responses.jsonl` (35 responses).
- **H3b:** `test_needs_sims`, game 52 (mission 138). Session log: `.../scratchpad/h3/session-52.jsonl`. Responses: `.../scratchpad/h3/test_needs_sims-h3b-responses.jsonl` (19 responses).
- **Scratch folder:** `/tmp/claude-0/-home-user/00ac45c7-5637-5831-96c6-3d6101c5b398/scratchpad/h3/` (drain dumps and verifier output are there too).
- **Clean-up:** both games were deleted at the end (`BreakEscape::Game` rows 44 and 52, `destroy_all`). The playtest skill has no documented delete step, so I used the model directly. Only those two ids were touched.
- **No screenshots taken.** Evidence is bridge values and events.
- Nothing was committed. No game, scenario or script file was edited.

## Results

Every numbered check ran. **19 PASS, 0 FAIL.** Two checks passed after a retry or with a caveat (see notes).

### H3a: `test_access_sessions` (game 44)

| Step | Check | Result | Evidence |
|---|---|---|---|
| H3 Ian 1 | Enter `ian_room`; note `ian_pc` before anything happens | PASS | `workstation('ian_pc')`: texture `pc8`, 34x22, `lockedLook` false; `screenTransitions()` empty |
| H3 Ian 2 | `workstation_owner_left:ian_pc`, `screenLocked` true; one transition locked with `lockpick_set`; `lockedLook` true; texture and size unchanged | PASS | Event `data.screenLocked: true, reason: "needs"`; one entry `{locked: true, sound: "lockpick_set"}`; `lockedLook` true; `pc8` 34x22 |
| H3 Ian 3 | `workstation_owner_returned:ian_pc`, `wasLocked` true; second transition `locked: false`, `ui_confirm`; `lockedLook` false | PASS | Event `wasLocked: true`; entries `[lockpick_set, ui_confirm]`; `lockedLook` false |
| 2a. Beat T1 step 2 (Dana, no H3 line) | Toast "Dana Reyes is using this PC.", `pc_in_use`, no minigame, task `t1` complete | PASS | Toast and `pc_in_use` seen; `t1_owner_present` completed. Dana's room was entered from the lobby (see notes) |
| 2b. Beat T2 step 1, H3 | Claim on `dana_pc` after `npc_left_post:dana`; no `dana_pc` transition; `lockedLook` false | PASS | `sessions`: `dana_pc` via claim; `danaTransitions: []`; `lockedLook` false; `screenLocked` false; events `workstation_accessed:dana_pc`, `pc_signed_in` |
| 2c. Beat T3 step 1, H3 | `owner_returned` with no `dana_pc` transition | PASS | Events `workstation_owner_returned:dana_pc` (`wasLocked: false`), `pc_signed_out:dana_pc` (`reason: "owner_returned"`, `firstAtPc: true`); `danaTransitions: []`. See the waitFor note |
| 3.1 Beat T6 step 1, H3 (Omar) | Claim on `omar_pc` after `npc_left_post:omar`; no transition; `lockedLook` false; `lockAt` set | PASS (after one retry) | `workstation('omar_pc')`: `pc8` 34x22, `lockedLook` false, `lockAt` 610250; no transitions; session via claim. First attempt hit Omar himself (see notes) |
| 3.2 Beat T6 step 2 | `step(240000)`: desktop still open, session still listed | PASS | `needs.step` returned `clockMs: 600750`; minigame open; session `omar_pc` via claim |
| 3.3 Beat T6 step 3, H3 | `workstation_auto_locked:omar_pc`, `pc_signed_out` `auto_locked`; exactly one `omar_pc` transition `locked: true`, `lockpick_set`; `lockedLook` true; texture and size unchanged; toast "The screen locked" | PASS | Events `workstation_auto_locked:omar_pc`, `pc_signed_out` (`reason: "auto_locked"`, `firstAtPc: true`); `omar_pc` transitions: one entry `{locked: true, sound: "lockpick_set"}`; `lockedLook` true, `pc8` 34x22; toast "Omar's PC: The screen locked" (held until the desktop closed, see notes) |
| 3.4 Beat T6 step 4 | `interact` `omar_pc` shows the sign-in screen, `reason: "locked"` | PASS | Minigame `password` "Omar's PC" with the seven usernames; `pc_signin_shown:omar_pc` with `reason: "locked"` (session log seq 236); `workstation_locked_attempt:omar_pc` |
| 3.5 Beat T6 step 5 | Clock handed back (`setManualClock(false)`) | PASS | `{"manualClock": false}` |
| 4. Hot desk, beat T10, H3 | Sign-in on `hot_desk`, no claim; `hot_desk` unchanged | PASS | `workstation('hot_desk')`: `owner: null`, `pc8` 34x22, `lockedLook` false; sign-in minigame "Hot desk PC"; no `hot_desk` transition; events `pc_signin_shown` and `pc_signin_shown:hot_desk`, no `workstation_*` event |
| 5. Final `screenTransitions()` | Only `ian_pc` and `omar_pc` entries; sounds only `lockpick_set`, `ui_confirm` or null | PASS | 9 entries: `ian_pc` ×8 (sounds: `lockpick_set`, `ui_confirm`, then null ×6), `omar_pc` ×1 (`lockpick_set`). No `dana_pc` or `hot_desk` entry |
| End | `sync`, full `verify-run.rb`, `--access` run, leak check | PASS | Leak check: `VERDICT: no leaks found` (35 responses). Verifier `rc=0`: "progress recorded"; tasks `t1`, `t3`, `t6`, `t10` completed (expected) |

### H3b: `test_needs_sims` (game 52)

| Step | Check | Result | Evidence |
|---|---|---|---|
| 1. At once | `amara_pc` texture, size, `lockedLook` false; transitions empty | PASS | `pc8`, 34x22, `lockedLook` false, owner `amara`, `present: true`; `screenTransitions()` `[]` |
| 2. Drop labels | "Parcel for Amara (click to drop)" and "Dirty Mugs (click to drop)"; Notepad plain. Nothing dropped | PASS | Hover labels read `["Parcel for Amara (click to drop)", "Dirty Mugs (click to drop)", "Notepad"]`; inventory still 3 items at the end |
| 3. Amara leaves | `workstation_owner_left:amara_pc`, `screenLocked` true; one transition locked `lockpick_set`; `lockedLook` true; texture and size unchanged | PASS | Event `{screenLocked: true, reason: "needs"}`; one entry `{locked: true, sound: "lockpick_set"}`; `lockedLook` true; `pc8` 34x22 |
| 4. Amara returns (within 2 min) | `workstation_owner_returned:amara_pc`, `wasLocked` true; second transition `locked: false`, `ui_confirm`; texture and size unchanged | PASS | Event `{wasLocked: true}`; entries `[lockpick_set, ui_confirm]`; `lockedLook` false; `pc8` 34x22 |

End checks, H3b: sync done; leak check `VERDICT: no leaks found` (19 responses). Full verifier exited 1 with `VERDICT: BOOTSTRAP ONLY`, as expected for this run: it never leaves `office` and does not ask for progress. Details in the verifier output below.

## Verifier output (full)

H3a, `verify-run.rb 44` (exit 0):

```
game            44  (mission 163)
unlocked rooms  5: lobby, ian_room, dana_room, omar_room, hot_desk_room
inventory       1: Notepad
NPCs met        4: rob, ian, dana, omar
flags submitted 0
globals set     6: dana_pc_accessed, dana_pc_owner_away, engine_tutorial_declined, omar_pc_accessed, omar_pc_owner_away, omar_pc_screen_locked
access model
  sessions       0
  signedInPcs    2: dana_pc; omar_pc
  serverClones   0
  copiedItems    0
  loginFailures  0
  loginLockouts  0
tasks           4 in objectivesState, 4 completed
  t10_unowned, t6_auto_lock_5, t1_owner_present, t3_owner_returns (all completed)
VERDICT: progress recorded — 4 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

H3b, `verify-run.rb 52` (exit 1):

```
game            52  (mission 138)
unlocked rooms  1: office
inventory       3: Parcel for Amara, Dirty Mugs, Notepad
NPCs met        5: amara, tom, grace, sanjay, marek
globals set     4: copier_out_a_shown, engine_tutorial_declined, last_activity, tom_pc_owner_away
access model    nothing recorded (no sessions, sign-ins, card copies, copied files or failed sign-ins)
tasks           6 in objectivesState, 6 completed
VERDICT: BOOTSTRAP ONLY — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

## Anything surprising

1. **Omar's first click hit Omar.** `interact` on `omar_pc` ran about 1 s after `npc_left_post:omar` (his `playerDistance` was 6). It opened his chat ("Can't stop, I'm in the middle of something") and not the desktop. This is the timing trap the script warns about. I closed the chat, waited for him to leave `room` listings, then re-approached and claimed the desktop. The first `interact` reply was `ok: false`. The retry passed. The step is recorded as PASS after a retry.
2. **Ian's later cycles have null sounds.** After his first leave and return (`lockpick_set`, `ui_confirm`), Ian's further leave and return cycles wrote transitions with `sound: null`. I was in other rooms then. This fits the rule that the lock sound is heard only in the room, but PLAYTEST.md does not state that rule. Checks that passed (`sound` in {`lockpick_set`, `ui_confirm`, null}) are unaffected.
3. **Ian unlocked and locked again 28 ms apart.** During `step(60000)` in Omar's T6, `ian_pc` returned and left again in the same step: unlock at `1794273908183`, lock at `1794273908211` (drain: `workstation_owner_returned:ian_pc` at 380205 ms, `workstation_owner_left:ian_pc` at 380233 ms). The desk had no real sit time between. This looks like the manual clock running several owner ticks in one step. Probably harmless for the H3 checks, but it is odd.
4. **`waitFor` missed events that had already fired.** `waitFor` on `workstation_owner_returned:dana_pc` timed out at 10 s. The state (`present: true`, no session) and a later `drain` both show the event fired before the wait began, with `wasLocked: false` and `reason: "owner_returned"`. For a return that is already over, read the state or `drain` rather than `waitFor`.
5. **Toast held until the desktop closed.** "The screen locked" was missing from the `toasts` read right after the step. It arrived on the next `toasts` call, as the skill says for toasts raised while a minigame is open.
6. **Route to Dana's room.** PLAYTEST.md does not say the route. From `ian_room` there is no door to `dana_room` (`no-doorway`). The route was `ian_room` → lobby → `dana_room`. Similarly, `omar_room` → `hot_desk_room` needs `dana_room` → lobby. Worth a line in the script's route notes.
7. **Verifier on H3b.** `verify-run.rb 52` exits 1 with `BOOTSTRAP ONLY`. That is correct for a run that never leaves `office`. The tasks `see_work`, `hear_drink`, `see_coffee`, `see_printout`, `see_back_at_desk` and `spot_open_screen` show as completed (the verifier counts them as 6), though the player only sat in `office`. The verifier notes these do not count as progress.
8. **Priya's room was not loaded**, and no `priya_pc` or `hot_desk` transition appeared. Consistent with PLAYTEST.md.
9. **No password was typed** in either game. Ian's note was not read in H3a. No `dana_pc` or `hot_desk` transition appeared at any point.
