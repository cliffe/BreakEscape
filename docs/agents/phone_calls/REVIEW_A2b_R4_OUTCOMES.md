# A2b review round 4: outcomes

Fixer, 2026-11-12. Findings: `REVIEW_A2b_R4.md` (verdict accept, 4 minors).

| Finding | Status | Where |
|---|---|---|
| m1 A2c accept list lacks the Mission Brief over a ringing call | Fixed | `PHONE_CALLS_PLAN.md` A2c Accept now opens with the brief-over-non-opening-ring case (banner stays, ring paused and resumes with elapsed time, live proof with `timed_caller` ringing out into `caller_basic`). |
| m2 committed exit timeline is the HOLD run | Fixed | `a2b_r1_finish.sh` timeline name now carries `${HOLD:+_held}`. The old file is kept as `proofs/A2b_r3/live/r3_ended_exit_held_timeline.json` (git mv). `r3_ended_exit_timeline.json` is a fresh unheld run on :3024 (game 1638): `31.6s phone-chat false`, `32.8s phone-chat true`, `33.7s null`, a 0.9 s beat. The rerun also refreshed the unheld `r3_ended_exit_*` screenshot, session and tts files. |
| m3 second beat timer when End is pressed in the story-end gap | Fixed | `phone-chat-minigame.js`: `_completeRingerCallWithBeat()` returns at once if `_callEndedPending`, and the `_releaseForcedCall` ringer branch returns before the reset when End's beat is already running. Test "A2b R4 m3" in `phone-outgoing-call.test.mjs` failed first (second beat shown), passes now. |
| m4 route gates do not gate | Fixed | `wait_ring` and `a2b_lever` failures now stop the route (`|| { ...; a2b_quit; exit 1; }`) in `a2b_r1_live.sh` and `a2b_r1_finish.sh` for the caller_basic routes. `a2b_lever` with a caller accepts only `current().npcId` equal to it (queue and callActive no longer count). `grep -qx true` throughout. Bare `a2b_lever lever_decline` (no caller) is unchanged. |

Suite: `bin/test-js` 506 passed, 0 failed (under the lock). Server on :3024 stopped (`ss -ltnp | grep 3024` empty).
