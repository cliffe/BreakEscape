# Review: A2b round 4 (ringer wiring and the banner, phone closed)

**Verdict: accept.** 0 blocker, 0 major, 4 minor. None of the minors blocks A2c. m1 is a one-line plan edit that A2c needs before it starts; the rest are proof and tooling hygiene.

HEAD `d3109a0c5` (R3 fixes `4ebf6dda0`, route-helper fix `69392dd04`). Node runs at HEAD, no server: `phone-ring-layer` 22/0, `phone-outgoing-call` 24/0, `phone-call-bark-hold` 2/0, `phone-call-busy` 7/0, `phone-call-vars` 5/0, `phone-call-knots-parity` 4/0, `phone-ringer` 122/0, `phone-call-queue` 8/0, `scripted-conversation-queue` 14/0, `social-lab-dev-call` 5/0, `finale-forced-call-and-closing-card` 17/0.

Live runs on a keyless server on :3024, headless, with the fixed `a2b_lib.sh` (games 1633 to 1635). The server was stopped at the end (`ss -ltnp | grep 3024` empty). Outputs are reviewer scratch and not committed; the timelines are quoted below.

## 1. R3 fixes on the real path

**"Call ended" beat.** `_completeRingerCallWithBeat()` (`phone-chat-minigame.js:1388-1396`) is the single helper. Its callers:

- the `_releaseForcedCall` timer, ringer branch (`:1334`);
- `_exitRingerCall` (`:1379`), which both `#exit_conversation` paths reach: the continue path `:906` and the after-choice path `:1270`;
- `closeConversation` (`:1631`).

All three callers sit behind `params.ringerCall`. The terminal look completes at once because `showCallEnded()` returns false without a call screen (`phone-chat-ui.js:229`). A non-ringer phone chat never reaches the helper: it goes through `this.complete(true)` at `:1336`, and through the legacy exit at `:1272` onwards.

Live, with the timelines unpatched:

| Path | Game | Timeline |
|---|---|---|
| Story end (`caller_basic` "Finish it here.") | 1633 | `26.6s phone-chat callEnded=false`, `29.8s phone-chat callEnded=true`, `30.7s null`. Beat 0.9 s, status bar `CALL ENDED 0:05`. |
| `#exit_conversation` ("Hang up politely.") | 1634 | `25.5s phone-chat callEnded=false`, `26.7s phone-chat callEnded=true`, `27.6s null`. Beat 0.9 s, status bar `CALL ENDED 0:03`, `callActive()` false afterwards. |
| `caller_debrief` hand-off ("Bring me in") | 1635 | `35.8s phone-chat go=true`, `38.2s phone-chat ended=true callActive=true`, `39.1s - callActive=false`, `39.3s person-chat/debrief_host`. The debrief waits through the beat and opens 0.2 s after it. The `/tts` list matches R1's: hand-off line, "Stay sharp...", then the debrief. |

The debrief hand-off was R3 M1's third live item. The fixer's outcomes do not mention it, so this run closes it.

**`currentKnot` restored.** `phone-ringer-dom.js:190-218` keeps `previousKnot` and puts it back both in the `catch` and when `started` is falsy. The test `phone-ring-layer.test.mjs` "A2b R3 m1" drives the real `_handleEventMapping` and adapter, then clicks Answer. It covers both a null return and a throw, and asserts `start`. Without the restore the knot stays `ring_call`, so the test would fail.

**Tests guard the wiring.** In `phone-outgoing-call.test.mjs`:

- The "A2b R3 M1" tests count `showCallEnded` calls and check that `complete` does not run before the beat timer. If `complete(true)` is swapped back in on either path, or the helper loses the beat, the tests fail.
- Both `#exit_conversation` callers are driven: `_exitRingerCall` directly, and `_presentOutput` with the tag.
- A legacy forced call with no `ringerCall` asserts no beat.
- The End path keeps its R1/R2 test.

**Plan edits** (2.5 "Ending", 2.7, A4, A2c wording) read correctly against the code. 2.7 now says the timed ring's delivered mark is not saved, A4 has the work item, and A2c's "The A2c rows" slip is fixed.

## 2. The route-helper bug's reach

Before `69392dd04`, any gate of the form `a2b_ev ... | grep -q true` passed on its first poll, whether the result was true or false. A false result printed the whole reply, and that reply contains `"ok":true`. So `wait_ring` was a no-op and `a2b_lever` never retried. Both gates are still not load-bearing in any route: no route checks `wait_ring`'s return code (`wait_ring caller_basic 20; a2b_answer`), and `ring_timed` and the `r2m1` loop compare strings, so the bug never touched them. What matters is whether each proof shows its state independently.

| Proof | Gate used | Conclusion stands? | Why |
|---|---|---|---|
| `A2b/` banner, `basic*` (both speeds, End, story end, Hang up) | `a2b_lever` retry | Yes | Screenshots of the banner and the call, and `/tts` lists with the fast and slow answer lines. |
| `A2b/` `caller_patient` | lever | Yes | `patient_ringing_40s.png` shows the banner after 40 s; `patient_answered.png` and `/tts` show "You took your time". |
| `A2b/` `caller_decline` | lever | Yes | `declined_seen` and `missed_seen` were read from globals, with thread screenshots. R1/R3 `r2m1_*` and `m2_*` re-proved it without the gates. |
| `A2b/` `caller_debrief` ringing and knockout | lever | Yes | Banner and person-chat screenshots, the event list, `/tts`. Also re-run live this round (game 1635). |
| `A2b/` `caller_queue` | lever | Yes | `queue_second_ringing.png` shows "Caller Queue Two" ringing, and `/tts` has both calls in order. |
| `A2b/` `caller_replace` | lever | Yes, but its ringing shot is empty | `replace_ringing.png` shows no banner (a "A chair." prompt), so the lever probably hit a neighbour first and the broken retry did not notice. The conclusion rests on `replace_answered.png` ("This is the newer call...") and `queue_tts.jsonl`, which has no old-call line. Both mappings share the one event `ring_replace`, so a call that connected at all means both offers were made. |
| `A2b/` `timed_caller`, `legacy_voiced`, `texter`, reload `phoneState`, `reg/`, `se/` | none, or lever only for legacy/texter | Yes | Screenshots, `/tts` lists, server dumps and hashes. |
| `A2b_r1/live` `m1` | `ring_timed` (string compare) | Yes | Not affected. `m1_ringseq.txt` shows the shell poll never saw `timed_caller`, which is R3's bootstrap artefact. The in-page `m1_timeline.txt` shows the ring and the answer. |
| `A2b_r1/live` `m2` (r1 version) | `ring_timed` | Superseded | Replaced by R3's `A2b_r3/live/m2_*`, which uses an in-page watcher installed before `bootstrap`. |
| `A2b_r1/live` `m3` (held toast) | `a2b_lever`, `wait_ring` | Yes | `m3_emit.json` reads `callActive` true in the same tick as the emit. The timeline shows `connected` then `phone-chat`, `barks=0` during the call and `barks=1` after End. |
| `A2b_r1/live` `ended`, `ended2` | `a2b_lever`, `wait_ring` | Yes | The End-beat screenshot shows "Call ended". `ended2` was the pre-fix evidence and its timeline shows `phone-chat` going straight to `null`. |
| `A2b_r1/live` `r2m1_*` | lever without an expected caller; string loop | Yes | Not affected. Node and thread JSON show `start`. |
| `A2b_r1/live/se_dev`, `A2b_r3/live/se_dev` | none | Yes | Hash comparison (item 4). |
| `A2b_r1/cur`, `pre`, `reg` | m09 `tl` was print-only; its loop tests a string | Yes | Not affected. |
| `A2b_r3/live` `m2_decline`, `m2_ringout` | in-page watcher, `grep -qx` | Yes | Not affected. |
| `A2b_r3/live` `r3_ended_story`, `r3_ended_exit` | `a2b_lever`, `wait_ring` | Story yes; exit's committed timeline is wrong (m2) | The answer is proved by `phone-chat` in each timeline. The committed `r3_ended_exit_timeline.json` is the HOLD run, which shows a 4.9 s beat. Re-run unpatched this round: 0.9 s on both paths (table in item 1). |
| `A8` ringtone | lever (2 interacts) | Yes | The wrapped `soundManager.play`/`stop` log and `isPlaying` read-backs are independent of any gate. |

No proof's conclusion depended on a gate passing. The only re-runs needed were the exit-path beat timeline (m2) and the debrief hand-off that R3 asked for. Both were done this round.

## 3. A2b accept list (plan section 6)

Met:

- Every named test file exists and passes.
- Each listed `test_phone_calls` caller has a live proof (table above, plus R1/R3).
- The lab SE `storyState` comparison is done.
- The regression set is unchanged: R3's edits are all inside `ringerCall` branches, and the regression routes have none.
- The guard's dropped challenge is in A2c's accept.

**m4 of R3 is not in A2c's list** (m1 below).

## 4. Lab SE and `sha256_noseed`

The lab is still gated everywhere:

- its ERB has no `"ring"`;
- every R3 code path is behind `params.ringerCall` or a ringer offer.

The comparison is sound:

- `tools/phone_calls/js/storystate-dump.js:13` parses the state, deletes only `storySeed` (a fresh random seed every run) and re-stringifies. Every other part is hashed, including variables (`dev_influence: -70`), visit counts, choices and output.
- The dumped `storyState` text itself is byte-identical to A0 for `dev_service_desk` and `ruth_phone`, both after the call and after the reload. I checked the text directly as well as the hashes.
- Every A2b, R1 and R3 run gives the same `ffe4c083...` and `52c50b7a...`.

The hash covers story state only. The thread history and the call screen are covered by the screenshots and the `/tts` lists in the same folders.

## Findings

### m1. A2c's accept list does not carry R3 m4 (Mission Brief opening over a ringing call)

`PHONE_CALLS_PLAN.md:768`. R3 left m4 for A2c, and the fixer's outcomes say "Add ... to A2c's proofs". The plan was not edited: `grep -n "Mission Brief" PHONE_CALLS_PLAN.md` finds only 1.x/2.2 text and the `timed_caller` row.

**Failure:** A2c lifts "any minigame blocks" and implements "paused" for the brief, but nothing makes it prove the case seen live in game 1593. There, the brief opened 0.3 s after a non-opening ring started and requeued the ring. A2c could ship with the banner vanishing under the brief.

**Fix:** add to A2c's Accept: "the Mission Brief opening while a non-opening call rings: the banner stays, the ring is paused (2.2) and resumes with its elapsed time when the brief closes; live proof with `timed_caller` ringing out into `caller_basic`."

### m2. The committed `r3_ended_exit_timeline.json` is the HOLD run, not the unpatched one

The cause is `tools/phone_calls/routes/a2b_r1_finish.sh:85`. The timeline file name has no `${HOLD:+_held}` suffix, unlike the label, so the screenshot-only run (with `complete` delayed 4 s) overwrites the timeline. The committed exit timeline shows a 4.9 s beat (`28.5s callEnded=true`, then `33.4s null`). That contradicts the R3 outcome's "about 1 s", and a reader can't tell the run was patched.

**Fix:**

- Add the suffix at `:85`.
- Replace `proofs/A2b_r3/live/r3_ended_exit_timeline.json` with an unpatched run: re-run `ended_exit` without `HOLD`. This round's run gives `25.5s phone-chat false`, `26.7s phone-chat true`, `27.6s null`.

### m3. A second beat can be scheduled when End is pressed during the 2 s story-end gap (harmless)

`phone-chat-minigame.js:1388`. The helper does not check `_callEndedPending`.

**Scenario:**

1. The story ends and the `_releaseForcedCall` timer is pending.
2. The player presses End: `closeConversation` runs the beat.
3. The timer fires during that beat (`isActive` is still true). It calls the helper again: `showCallEnded()` runs again and a second `complete` timer is set.
4. The second `complete` is a no-op, because `isActive` is false by then and `complete` also ignores superseded instances.

Nothing visible changes.

**Fix (nit):** start the helper with `if (this._callEndedPending) return;`, and have the timer branch return early when `_endedByCall` is already set.

### m4. Route gates still don't gate

`tools/phone_calls/routes/a2b_r1_live.sh:10` and `a2b_r1_finish.sh:11` still use `grep -q true`. That is now correct for a boolean, but no caller checks the return code. `a2b_lib.sh:40` accepts `r.queueLength()>0 || r.callActive()` for any caller. Game 1635 is an example: `caller_basic` was ringing, so the lever check passed on "something queued" alone.

**Failure:** a missed lever or a missed ring carries on to `a2b_answer` ("no answer button"), and only the timeline shows it. That is what happened to `replace_ringing.png`.

**Fix (tooling):**

- Make `wait_ring ... || { echo "no ring" >&2; a2b_quit; exit 1; }` in the routes.
- In `a2b_lever`, accept only `c.npcId==='$2'`, or a queue entry for `$2` if the ringer exposes one.
- Use `grep -qx true` throughout.

A2c–A6 proofs will lean on these routes, so it is worth doing before A2c's live work.
