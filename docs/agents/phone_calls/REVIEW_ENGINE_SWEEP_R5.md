# Engine sweep review, round 5 (final, light)

Reviewer: Opus 5.5, 2026-11-13. Commit reviewed: `53daddfa5` (no code change since R4). `public/` was clean in the
worktree, so every live run used committed engine code. The keyless server ran on :3027 (pid file under
`test/dummy/tmp/pids/`) with headless browsers only. Afterwards I stopped the server, quit every session and moved
my ten `tools/playtest/pipes-23xx` folders to `tmp/delete/r5_pipes/`. The suites were not re-run (R4: JS 567/0,
Rails 2137/0 with 1 skip). Proofs are in `proofs/ENGINE_SWEEP_R5/`.

**Verdict: accept, and the sweep closes. No blocker, major, minor or new nit.** All five paths that R3 and R4 did not
drive work live and match the code.

## Findings

None new.

One thing to know before re-running old routes: `ENGINE_SWEEP_R1/beat_probe.js:13` wraps
`_completeRingerCallWithBeat` as `function () { …; return beat(); }`, so it drops the `selfClose` argument that the
R1 m3 fix added. Under that probe every terminal call end looks like a hang-up and closes at once. R2 already
recorded and fixed this (R2 n5, `ENGINE_SWEEP_R2/beat_probe_r2.js`), but `ENGINE_SWEEP_R1/r1_live.sh:108,140` still
loads the old probe. I reused it at first and got `completeAt == beatAt` on a self-closed taunt. That run is kept in
`proofs/ENGINE_SWEEP_R5/probe_artefact/` as a record and is not evidence about the engine. The R5 copy
(`proofs/ENGINE_SWEEP_R5/beat_probe.js`) forwards the arguments, records `selfClose` and keeps `beatAt` from the
first call. The (d) results below use it. Run m07 beat checks with `ENGINE_SWEEP_R2/r1_live_r2probe.sh` or
`ENGINE_SWEEP_R5/r5_live.sh`, not the R1 script.

## Live checks (:3027, committed code)

Routes: `proofs/ENGINE_SWEEP_R5/r5_live.sh` (new: `a_ring_reload`, `a_cb_reload`, `b_vm_reload`, `c_vance`, `d_self`,
`d_back`), `ENGINE_SWEEP_R1/r1_live.sh m07_theme` and `tools/phone_calls/routes/m05_live.sh root_slow`, all with
`OUT=proofs/ENGINE_SWEEP_R5`. The preconditions are head-start globals plus the one event the ring mapping listens
for (named below). The ring, banner, decline, reload, thread, Call back press and replies are all real.

### (a) Reload while a call rings; a pending Call back across a reload: pass

**`a_ring_reload`** (m05, game 2384, `a_ring_reload_out.txt`). Head start `torres_identified`, then
`conversation_closed:agent_0x99_handler`.
- The Recruiter rings (`first_call`, `onMissed: callback`), and the saved slot holds `live.state: "ringing"`.
- After the reload: no ringer and no toast in the 6 s after load. The rows are `["Missed call"]` (one row), and the
  callback is restored (`first_call`, "TalentStack Executive Recruiting"). The slot is now `live.state: "missed"`.
- The thread shows "Missed call" with an inline Call back, and the header shows Call back.
- Pressing it goes to CALLING, then ON CALL. `phone_call_answered:recruiter callback` fires and the
  `call_is_callback` line plays ("You rang back. Manners, or curiosity?").
- The callback clears on connect, and the rows stay `["Missed call"]`.

**`a_cb_reload`** (game 2385). Same start, then the ring is declined.
- After the decline: one "Missed call" row, the callback set, and `phone_call_declined:recruiter`. The slot is
  `live.state: "missed"`.
- After the reload: the same single row, the same callback and no toast.
- Call back dials and connects with `callback`. The callback is then cleared, and there is still one row.

This matches `npc-manager.js:2794-2812`: a saved `missed` record goes back through `restoreCallback`, and a live one
writes one row and runs `missedOffline` quietly. It also matches the `refreshSave` at `:2820`.

### (b) Reload with a held voicemail (m07): pass

**`b_vm_reload`** (game 2386, `b_vm_reload_out.txt`). Countdown head start; the Architect's thread is opened from
the inventory phone, then `room_entered:operations_floor` fires.
- T-30 rings inside the open thread (`.phone-incoming-call-decline`) and is declined there. The rows are
  `["Missed call: No caller ID"]` with no voicemail bubbles, because the voicemail is held behind the open thread.
- The slot holds `{"forced":[],"voicemails":[{"knot":"taunt_t30_vm","withheld":true}]}`.
- After the reload, no toast showed in the notification container from the end of bootstrap to +6 s.
- The rows are `["Missed call: No caller ID","Voicemail"]`: one Missed row and one Voicemail row. The slot is null.
- The voicemail's three transcript lines appear once, and they are the whole of `taunt_t30_vm`. No
  `phone_call_missed` was sent again.
- The thread then ends on the Architect's home narration ("A carrier tone…"). This is the usual resting line after a
  voicemail and was in the M6 and R_m07_m09 proofs. It shows twice here only because the thread had been opened
  before the ring.

One caveat: my toast wrapper could only be installed after bootstrap, so the no-toast evidence is the DOM poll over
that window. The code supports it: `_resumePendingCall` passes `quiet: true` (`npc-manager.js:2790`), and the toast
code is gated on `!opts.quiet` (`:662`).

### (c) The look: outgoing call from the list, then the Architect opened directly: pass

**`c_vance`** (m04, game 2387). Head start `vance_phone_available`, `vance_is_ally`.
- The inventory phone lists `agent_0x99` and `robert_vance_phone`.
- Robert Vance's thread opened from the list has `theme` and `appTheme` null, no terminal elements, and Call in the
  header.
- Call goes to CALLING, then the handset call screen: "ON CALL", "ROBERT VANCE (OPS DESK): Vance. What do you
  need?", with five choices.
- The thread, the dial and the call all keep the device look.

**`m07_theme`** (game 2388, `m07_theme_out.txt`).
- Tapping the Architect in the device list keeps the device look (`paramsTheme` null, no terminal elements).
- Opening him directly (`barkSystem.openPhoneChat`) gives `paramsTheme` and `appTheme` "terminal" with no contact
  list.
- His call is terminal too.

This matches `phone-app.js:87` (device app, then params, then `npc.phoneTheme`).

### (d) m07 terminal call end: pass

**`d_self`** (game 2391, R5 probe). T-30 is answered and walked to `#exit_conversation`.
- The record is `selfClose: true`, `beatAt 66089`, `completeAt 68723`, so the read beat is **2634 ms**
  (`TERMINAL_CALL_END_READ_MS` 2600).
- The last line on screen at the beat is "Let it hurt afterwards, not during…".
- No later calls; one "Call: No caller ID" row; the phone is closed.

**`d_back`** (game 2392, R5 probe). The back arrow is pressed 3 s into T-30.
- The record is `selfClose: false`, `beatAt 37798`, `completeAt 37799`. It closes at once, with the half-typed line
  "Don't look for the t" on screen.
- One "Call: No caller ID" row.

The wait for the last clip (`_waitForCallClipThen`) can't be checked here. With no Gemini key every `/tts` returns
503 (`clipPlayingAtBeat: false` in both runs), so no clip was ever playing at the beat.

### (e) Answer after more than 10 s gets the answer-delay comment: pass

**`m05_live.sh root_slow`** (game 2393, `e_root_slow_out.txt`). Head start `torres_identified`, then
`global_variable_changed:flag4_submitted`.
- The Recruiter's own ring came first. HaX's `untilAnswered` root-flag ring waited behind it until the Recruiter rang
  out (`phone_call_missed:recruiter@69.7`).
- HaX then rang past the 20 s timeout, as `untilAnswered` should, and was answered at 96.9 s:
  `phone_call_answered:agent_0x99_handler as=27`.
- So `call_answer_seconds` counts from the moment HaX's ring started, not from the offer while it was queued
  (about 42 s).
- The first line of the call is the `call_answer_seconds > 10` branch: "Agent HaX: Finally. Sit down for this."
  (`m05_phone_agent_0x99.ink:332`).

## Files

`proofs/ENGINE_SWEEP_R5/`:
- `r5_live.sh` and `beat_probe.js` (the R5 probe)
- `a_ring_reload_*` and `a_cb_reload_*`
- `b_vm_reload_*`
- `c_vance_*` and `m07_theme_*`
- `d_self_*` and `d_back_*`
- `root_slow_*` and `e_root_slow_out.txt`
- `probe_artefact/` (the runs made with the R1 probe, kept only as the record above)
