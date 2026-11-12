# Handover: A2b (wiring and the banner, phone closed)

**Implementer 2 (2026-11-12): live proof done, see `proofs/A2b/README.md`.** Suites: Rails TTS/ink 196 runs 0 failures; JS full suite re-run after the fixes. Lab SE Dev proof identical to A0/A1. Fixed: ringer call screen no longer draws thread history (preloaded opening showed as a subtitle), no "Conversation ended" toast on ringer calls, queue test stub. Not done live: guard dropped challenge (no guard NPC in `test_phone_calls`, unit-covered), m09/m10 breach regression routes, Ruth thread screenshot. The open list below is now items 5 to 7 only; items 1 to 4 are done. Tool: `tools/phone_calls/routes/a2b_lib.sh`.

Branch `build/phone-calls`. Stopped at the call/context budget with the live proof partly done.

## Done (commits)
- `81d4cf1f7` engine: `phone-ringer-dom.js` (layer, banner, adapter, hooks, VAR writer, `game_loaded`), `css/phone-ring.css` and its link, npc-manager (`scriptedConversationActive()` split, `_scriptedCallBusy()`, `ring` on the mapping builder and timed conversations, ring branch in the phone-chat path, trigger persisted at offer, delayed-mapping bypass, `hasPendingOpeningConversation` reads the ringer), `callStartKnots`, extractor `ring?` / `voiced_phone_call?` / `call_start_knots`, npc-barks hold, phone-chat ringer-call end handling (`_resetAfterRingerCall`, `_exitRingerCall`, `_releaseForcedCall`, End call x, no Cancel, no Add to Notepad, Esc = End call), `RUN_SCOPED_NAMES`, minigame-manager start hook and end hook from a `finally` (passes the ending minigame), popup-close hooks, `phone_ringtone` in the notification match. One existing test regex updated (`finale-forced-call-and-closing-card`, `_releaseForcedCall` guard).
- `a4bcf86e0` tests and scenario: `test/js/phone-ring-harness.mjs` (not a test), `phone-ring-layer`, `phone-call-busy`, `phone-call-vars`, `phone-call-knots-parity`, `phone-outgoing-call` tests; `scenarios/test_phone_calls/` (ink compiled, validator 0 errors, Mission row id 249 inserted with a one-row runner).
- `2cb86788c` Rails: `test/unit/break_escape/tts_line_extractor_ring_test.rb`.
- Uncommitted at handover: the avatar path fix in `phone-ringer-dom.js` and `docs/agents/phone_calls/proofs/A2b/`, committed together with this note.

## Verified
- `bin/test-js -j 3`: 497 passed, 2 failed at the first run, both source-regex tests I then fixed. The new files were not in that run. Re-run the full suite.
- Rails: ring test, `tts_phone_note_parity_test`, `tts_mission_lines_test` pass.
- TTS keys: dump from detached worktree at 868c58560 vs HEAD: `OK: 28 scenarios`, only `test_phone_calls` is new (32 keys).
- Live (keyless :3024, stopped): briefing, then `caller_basic` rings 3 s after it closes with the banner at top centre (`proofs/A2b/basic_banner.png`; avatar was a broken image, fixed since, not re-shot). Answer at once: call opens, `call_answer_seconds` 0 line "Good, you're there."; x is "End call", no Cancel, no Add to Notepad. End closes the call, ringer state null, `callActive()` false. Lever ring answered after 12.5 s: "There you are. I was about to give up." (`basic_tts.jsonl`).

## Open (not done)
1. Live proof for the rest: story end, `caller_patient` (60 s, nudge, 45 s answer), decline and timeout events, `caller_debrief` (hand-off line voiced, phone not reopened, person-chat debrief opens), queue, replace, timed caller (start with `--set skip_timed=false`), legacy voiced (unchanged), texter, guard variant and knockout variant.
2. Lab SE Dev proof (`routes/se_dev.sh`, compare `sha256_noseed` with A0) and the regression set.
3. Dump the server `phoneState` for one caller after a reload (R3 note).
4. Run the full `bin/test-js -j 3` once more under the lock, and re-check the `tts_*` Rails tests.
5. Scenario gaps against plan 5.3 (belong to A2c onwards): lockpick/keypad, popups, hostile NPC, patrolling guard with a `player_in_view` mapping, `caller_voicemail`, `caller_forced`, `caller_hold`, `caller_thread`, `desk_contact`, `away_contact`. The `caller_basic` first ring uses `conversation_closed:debrief_host` plus `delayMs: 3000`, not `room_entered`.
6. "Call ended m:ss" is not shown (End completes the minigame at once); add if the plan still wants it.
7. A stale-record case in `phone-ringer.test.mjs` itself: covered in `phone-call-busy.test.mjs` instead.

## Gotchas
- A2b adapter reports `minigameOpen()` false (no pill) and `putAside()` null; any open minigame or popup blocks ringing and opening. A2c relaxes both.
- `lastHitAt()` returns null until A2c converts `player-damage-interrupt.js`'s `Date.now` stamp.
- `savePendingCall` only sets `npc.pendingCall` in memory; A4 persists it.
- Default 20 s ring timeout: a proof script that waits longer than that before clicking Answer finds no banner.
- The `phone-call` VAR writer registers once `window.npcConversationStateManager` exists (retry timer and `game_loaded`).
- Harness: jsdom needs `pretendToBeVisual` or `document.hidden` pauses the ringer.
- The detached worktree used for the HEAD key baseline is in the scratchpad (`headwt`); remove it with `git worktree remove` when finished.
