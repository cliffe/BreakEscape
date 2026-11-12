# A2b live proof (test_phone_calls and the regression set)

Keyless server on :3024, headless, game ids in the `*_game_id.txt` files. Driven with `tools/phone_calls/routes/a2b_lib.sh`. Compare `/tts` request lists (`*_tts.jsonl`, status 503 is keyless) rather than audio.

| Proof | Files | Shows |
|---|---|---|
| Lab SE Dev call (first) | `se/` | `sha256_noseed` for `dev_service_desk` and `ruth_phone` after the call and after a reload equal A0 and A1 (`ffe4c083...`, `52c50b7a...`); the four Dev `/tts` lines equal A0; contacts screenshot is byte-identical to A1; call screen still has Add to Notepad, Close and the hang-up button; debrief card unchanged. |
| Banner, re-shot | `basic_banner.png`, `basic2_banner.png` | Avatar loads (`img` natural width > 0), name "Caller Basic", caption "Basic", Answer and Decline. |
| caller_basic | `basic_call.png`, `basic_slow_call.png`, `basic2_call.png`, `basic_tts.jsonl`, `basic2_tts.jsonl` | Fast answer "Good, you're there."; slow answer "There you are. I was about to give up."; no Cancel, no Add to Notepad. |
| Story end | `basic2_storyend_1.png`, `basic2_storyend_2.png` | "Finish it here." ends the story; the call closes by itself, ringer null, knot back on `start`. The toast "Conversation ended" no longer shows (fixed, see below). |
| Hang up politely | `basic2_*` | `#exit_conversation` closes the call, ringer null. |
| caller_patient | `basic2_patient_ringing.png`, `patient_ringing_40s.png`, `patient_answered.png` | Still ringing after 40 s with the banner; answered at about 50 s: "You took your time. I almost gave up." Ring cycle every 2 s for 10 s, then one `phone_vibrate` every 10 s (a wrapped `soundManager.play` log). |
| caller_decline | `decline_*` | Decline: `phone_call_declined` sets `declined_seen`; 20 s timeout: `phone_call_missed` sets `missed_seen`; the thread opens on `start` after a decline (`decline_thread_after_decline.png`). |
| caller_debrief, ringing variant | `debrief_*`, `basic2_tts.jsonl` | Answer, "Bring me in": the hand-off line "Bringing you in now." is typed and `/tts`-requested, "Stay sharp in there..." is requested, the phone does not reopen, person-chat `debrief_host` opens (`debrief_person_chat.png`). |
| caller_debrief, knockout variant | `knockout_*` | `playerHealth.damage(100)` during a connected call: events `phone_call_answered`, `conversation_closed`, `phone_call_missed`, `player_ko`; thread on `start`; no `pendingCall` (the callback is A6). |
| caller_queue | `queue_*` | Two callers: the first rings with the second queued (queue 1), after End the second rings, both `/tts` lists complete. |
| caller_replace | `replace_*` | Only the `new_call` knot rings; `old_call` is never requested. |
| timed_caller (no reload) | `timed_*` | Offered during the briefing: queued (queue 1). Rings after the briefing, answered; the Mission Brief popup opened during the ring (the call went `held` with no pill, A2c), and the call connected when it closed. Caller Basic then rang behind it. |
| legacy_voiced | `replace_legacy_call.png` | No ring, opens at once with the legacy buttons (Add to Notepad, Close). |
| texter | `texter_*` | The `send_text` text arrives in the thread, no ring, ringer null. (The toast was not caught in the screenshot.) |
| Server phoneState after reload | `reload_server_phoneState_caller_basic.json`, `reload_client_after.json`, `dump_phone_state.rb` | After a finished call, sync and reload: server and client agree: 8 history rows (preloaded intro, the call's lines, the player's choices), `currentKnot` and `lastEnteredKnot` `start`, no `pendingCall` (A4). |
| Regression set | `reg/` | m02 console video call, lab_tesseract video call and m10 Victoria call: the call lines requested equal A0 (the extra `ghost` line in the tesseract list is later in the same scene; A0 stopped earlier). Victoria's screen matches A0 apart from a HaX toast landing over it (timing; a legacy voiced call is not a ringer call, so the bark hold does not apply). |

Not done live: the guard's dropped challenge (`test_phone_calls` has no guard NPC; `phone-call-busy.test.mjs` covers it, and the scenario gap is on the A2c list); m09 and m10 breach routes (another agent is editing m09; m10 breach unchanged by this slice); Ruth's thread screenshot (her `storyState` hash is unchanged).

## Findings fixed in this round
1. A ringer call's screen showed the contact's preloaded opening ("Queue One here.") as the dimmed previous subtitle, a line the caller never said on the call. The call screen no longer draws the thread history (`callScreenOnly` in `openConversation`); the history stays in the thread.
2. "Conversation ended" drew as unstyled text outside the phone at a ringer call's story end. Skipped for ringer calls (`_notifyConversationEnded`).
3. `phone-call-queue.test.mjs` stubbed a minigame without `_resetRingerCallOnTeardown`; the stub now has it (test only).

## Harness notes
- With `AUTOBRIEF=false` the tutorial prompt modal stays up and blocks lever interaction (`blocking-ui`); dismiss it first.
- A lever press can pick a neighbouring lever when several are in range: `a2b_lever <id> <expected npc>` retries until that caller rings.
- After a reload `timed_caller` rings again, because its `skipIfGlobal` is `skip_timed`, which never flips. A4's reload proof should use its own guard.
