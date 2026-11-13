# Review: A2b round 5 (ringer wiring and the banner, phone closed), the last round

**Verdict: accept.** 0 blocker, 0 major, 2 minor, 1 nit. All three are in the live-proof tooling, not the engine. The slice closes; the minors are worth doing before A2c's first live proof (they can go in A2c's first fix round or be done by hand).

Reviewed at `e27c30d6c` (read with `git show`, the working tree carries A2c). The whole A2b diff is `81d4cf1f7~1..e27c30d6c` (32 commits; the range also holds A7a, A8 and M2/M3/M9 commits, which I skipped except where they touch A2b files).

Node runs at `e27c30d6c` in a detached temp worktree (removed afterwards): `phone-outgoing-call` 25/0, `phone-ring-layer` 22/0, `phone-ringer` 122/0, `phone-call-vars` 5/0, `phone-call-busy` 7/0, `phone-call-bark-hold` 2/0, `phone-call-queue` 8/0, `phone-call-knots-parity` 4/0, `scripted-conversation-queue` 14/0, `social-lab-dev-call` 5/0, `finale-forced-call-and-closing-card` 17/0. No live run: no finding needed one.

## 1. R4 minors

| R4 | Fixed? | Evidence |
|---|---|---|
| m1 A2c accept line | Yes | `PHONE_CALLS_PLAN.md:768` A2c Accept now opens with the brief-over-non-opening-ring case, `timed_caller` into `caller_basic`, ring paused and resumed with its elapsed time. |
| m2 exit timeline | Yes | `r3_ended_exit_timeline.json` is game 1638, unheld: `31.6s false`, `32.8s true`, `33.7s null` (0.9 s beat). The held run is kept as `r3_ended_exit_held_timeline.json`. `a2b_r1_finish.sh:85` carries `${HOLD:+_held}`. |
| m3 idempotent beat | Yes | `phone-chat-minigame.js:1390` returns at once on `_callEndedPending`; the `_releaseForcedCall` ringer branch (`:1330`) returns before the reset when End's beat is running. Either guard alone passes the new test; without both, the timer re-shows the beat, so "A2b R4 m3" (`phone-outgoing-call.test.mjs:351`) fails as claimed. If End completed at once (terminal look), the timer already stops on `!isActive`. |
| m4 route gates | Yes | `wait_ring` and `a2b_lever` failures exit the `caller_basic` routes in both route files; `a2b_lever` with a caller now accepts only `current().npcId === $2` (`a2b_lib.sh:40`); `grep -qx true` throughout. `a2b_ev` unwraps `.result` with `if type == "object" and has("result")`, so a `false` result prints `false` and can no longer match. |

## 2. Last pass over the A2b diff

Engine, for A2c to A6:

- **Busy rule and the scripted queue** (`npc-manager.js:761`, `:785`). `_scriptedCallBusy()` now includes `callActive()`, and the ringer reads `scriptedConversationActive()`, never the busy rule, so the two cannot block each other through the same predicate. The one cycle (call `connected` but not yet open, a beat queued) is broken by the second open check ignoring `queuedBeats()` (`phone-ringer.js:461`, adapter `openBlocked` `phone-ringer-dom.js:149`). The queue pump polls, so a beat queued behind a call opens once `callActive()` goes false.
- **Bark drain at call end.** `endMinigame` sets `_ending` before the drain (`minigame-manager.js:225`), and `callMinigameOpen()` checks `!m._ending`, so `callActive()` is already false when the barks drain inside the `try`. The end hook in `finally` runs after. This matches R1 M3's live `barks=1` after End.
- **`#exit_conversation` closes do not cut the last line.** Both exit paths reach `_exitRingerCall()` only after the typeout loop, and `_showStoryLine` awaits `_speakCallLine` on a voiced call, so `_callVoice.stop()` in the helper never clips the farewell.
- **`ring` truthiness** agrees across `callStartKnots` (JS), `TtsLineExtractor.ring?` and `npc-manager` (`ring || null`) for `true` and objects; odd values (`0`, `""`) differ, but the validator rejects anything that is not `true` or an object (`validate_phone_calls.rb:203`).
- **Adapter seams A2c will replace** are clearly marked: `minigameOpen: () => false`, `lastHitAt: () => null`, `putAside`/`reopen` no-ops, `ringBlocked` with any open minigame. `isPaused` spots the brief by `params.title === 'Mission Brief'` (`phone-ringer-dom.js:167`); A2c's new accept line exercises it live, so a renamed title would show there.

Deployed `lab_social_engineering`: no `ring` in its ERB, so no ringer offer is ever made, `callActive()` stays false, and the bark, busy and minigame-hook changes are no-ops for it. `callVariablesFor` returns the defaults for any non-ringer phone-chat, and R1/R3's `sha256_noseed` for Dev and Ruth is identical to A0. `social-lab-dev-call` passes at `e27c30d6c`. The `minigame-manager` `try/finally` keeps the old behaviour on a throwing `cleanup()` (the exception still propagates, now after the hook).

## Findings

### m1. The route helpers write to one session's scratchpad

`tools/phone_calls/routes/a2b_lib.sh:24` and `a2b_r1_finish.sh:31` hard-code `/tmp/claude-1000/.../2dd9046d-5103-4a95-9363-70f3aa5c1f4a/scratchpad/`.

**Failure:** after the next orchestrator restart (a handover starts a new session id) or a `/tmp` clean, the directory is gone. `printf > "$f"` fails, `ev.sh` reads no file, and every `a2b_ev` prints an error instead of a result. Since R4 m4 the gates stop the route, so it fails loudly, but with a misleading "lever ... did not ring" or "no ring" for every A2c to A6 proof built on this lib.

**Fix:** make the file under a directory created once when the lib is sourced, for example `A2B_TMP=${A2B_TMP:-$(mktemp -d)}` near the top and `local f=$A2B_TMP/ev-$GID.js`; the same for `a2b_r1_finish.sh:31`.

### m2. An unset `PC_PORT` drives another agent's server on :3023

`tools/phone_calls/open.sh:5` and `newgame.sh:5` default to `${PC_PORT:-3023}`, and `a2b_lib.sh` only documents `export PC_PORT=3024` in a comment.

**Failure:** an A2c to A6 route run from a fresh shell without the export creates games on, and drives a headless session against, :3023, which belongs to other work. Port rules for this track forbid touching it.

**Fix:** in `a2b_lib.sh`, after the `cd`, add `: "${PC_PORT:?set PC_PORT (3024 for this track)}"`. Optionally drop the 3023 default in `open.sh`/`newgame.sh` the same way.

### n1. The committed unheld exit `_tts.jsonl` and `_session.jsonl` hold two runs

`proofs/A2b_r3/live/r3_ended_exit_tts.jsonl` has the five-line `/tts` sequence twice (timestamps `1794485…` and `1794486…`): the logs are appended across runs, so the "unheld" files also carry the earlier run. The conclusion is unaffected (both runs say the same lines). **Fix:** truncate the label's logs in `a2b_open` before `open.sh`, so each committed proof file is one run.

## A2c note (not an A2b finding)

`a2b_lever` with a caller now retries whenever the current call is not that caller, including when another call (say `timed_caller`) is legitimately ringing first. Each retry pulls the lever again and offers the knot again. For A2c routes that mix a timed ring with a lever ring, pass no caller to `a2b_lever` and gate on `wait_ring` with a longer timeout instead.
