# Merge main -> build/phone-calls: proofs

Merge commit `111b0b094` (parents: branch tip `9ca867ac2`, main tip `f2d53bb40`).
Server: keyless `:3024`, headless, stopped at the end.

## Tests

- `bin/test-js`: 560 files passed, 0 failed (after the three harness fixes below).
- Rails TTS + phone tests (tts_controller, tts_text_match, tts_line_resolver,
  ink_line_walker, tts_line_extractor_calls/ring/voicemail, tts_stored_room_order,
  tts_phone_note_parity, game_phone_calls_state, reload_persistence,
  phone_message_delivery_tags, phone_message_game_time): 298 runs, 0 failures.

## Conflict resolutions (see the merge commit message for the full list)

- `tts_line_extractor.rb` `resolve()`: both `id_names:` (branch) and `transcript:` (main).
- `games_controller.rb`: keep the branch's `story_file:` kwarg.
- `validate_scenario.rb`: keep `check_speaker_id_name_clashes`, adopt main's
  `check_network_model(json_data, erb_path)`.
- `phone-chat-ui.js`: contact preview keeps the branch's missed-call class and
  adopts main's `escHtml()` escaping.
- `player-damage-interrupt.js`: parallel `lastPlayerHitAt()` name collision —
  kept the branch's perf-clock `lastPlayerHitAt()`, added epoch
  `lastPlayerHitAtWall()` for main's container-return reader (repointed
  `container-minigame.js` and `container-shares.test.mjs`).

Merge-integration harness fixes (main refactors broke branch harness copy lists):
base-minigame now imports `escape-html.js` and has `closeByPlayer()`
(`phone-call-bark-hold`, `phone-outgoing-call`); `escHtml` is now an import in
phone-chat-ui.js (`phone-call-log` stub).

## TTS key identity (dump_tts_keys.rb, no chatter)

- merged vs main (`f2d53bb40`): only `m09`, `m10`, `lab_physical_pentest` (the
  track's intended re-keys) and the two new scenarios `test_phone_calls`,
  `test_phone_call_notes` differ. No unexpected scenario moved.
- merged vs branch tip (`9ca867ac2`): one key in `m02_ransomed_trust` moves, and
  the merged key equals main's — the merge adopts main's voice-marker stripping
  (`transcript:true`), which the endpoint already does; the branch tip's unstripped
  key was the anomaly. A correction, not a regression.

## Validator (scripts/validate_scenario.rb --no-graph + dialoguelint)

- `test_phone_calls`: 0 errors. `lab_social_engineering`: 0 errors, no phone-call
  or call-in-text findings.
- All 28 phone scenarios: 0 phone-call errors, 92 "call me" warnings, 36
  call-in-text-thread lint hits. The 92 matches A7a R4's baseline. The merge does
  not change `dialoguelint.mjs` or `check_phone_calls` (branch tip == merged); the
  36 is the branch's own state (the baseline doc's 30 is from an earlier commit).

## Lab SE regression (se_dev/, route se_dev.sh on :3024)

- `dev_service_desk` sha256_noseed `ffe4c083…` and `ruth_phone` `52c50b7a…`,
  after the call and after the reload — identical to A6. The four Dev `/tts` lines
  resolve to `dev_service_desk` with the same text.
- `se_phone_contacts.png`: Dev and Ruth render correctly (previews escaped and
  shown); md5 differs from A6 only by the per-run "Just now"/"1m" timestamp.

## Ringer and outgoing (test_phone_calls, :3024)

- `caller_basic/`: caller_basic answered (ringer connected on `ring_call`,
  callActive true, End clean) and declined (ringer gone, thread back on its home
  knot `start`, `pendingCall.live` = missed with `onMissed: callback`).
- `a5_desk/`: outgoing `desk_contact` call from the header Call button — CALLING,
  connect ("Desk line. Go ahead."), End mid-choice → thread on `start` with an
  "Outgoing call, 0:03" row, reopen shows the hub + Call button, the second call
  plays the "second time round" VAR line. The first attempt tripped the known
  patrolling-guard person-chat gotcha (guard opened over the phone during the ring
  wait); the retry passed. Not an engine regression (caller_basic passed on the
  same scenario; all phone-outgoing JS tests are green).
