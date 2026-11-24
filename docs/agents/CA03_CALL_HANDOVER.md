# ca03 voiced helpdesk call — handover (2026-11-24)

Branch `feat/ca03-voiced-call`, worktree `.claude/worktrees/b-ca03-call`. HEAD `c40fa3a03`.

## Task
Turn ca03's helpdesk call (player rings Leila Nassar on the Quayholt IT service desk) into a voiced phone call. Keep influence meter, thresholds, scoring, flip replay and all outcomes identical.

## Done
- Engine: NO engine change needed. The awareness-kit SERVICE DESK tab already routes through
  episode-model write stage -> pretext-prep -> `callLaunch` (pretext-card.js:287-303), which sets
  `params.voiced = true` when the phone NPC has `voiced: true` (pretext-card.js:299-300). phone-chat
  voices the pretext outcome line too (phone-chat-minigame.js:1247). TtsLineExtractor extracts the
  call knots + `each_pretext_outcome_line`. Mirrors scenarios/lab_social_engineering dev_service_desk.
- Scenario `scenarios/ca03_helpdesk_reset/scenario.json.erb`, NPC `leila_servicedesk`: added
  `"voiced": true`, `"callLabel": "Quayholt IT service desk"`, and a `voice` block
  (name Sulafat, en-GB, London/South-East English, British Arab, warm/efficient service-desk style).
  `avatar` deliberately omitted — Leila has no headshot asset; call header shows the placeholder
  icon, talking head uses existing `leila_nassar_visemes.png`. (Optional polish: generate a headshot.)
- Reworded ONE voiced line to fit the 25-word phone cap (the outcome `reported.line`):
  before (28w): "I'm going to stop there. I'll call you back on the number we hold for your account, and if this is really you, you'll hear from us."
  after  (24w): "I'm going to stop there. I'll call you back on the number we hold on file. If that's really you, you'll hear from us."
  Keeps the callback-on-file teaching. No other Leila line prints a variable or exceeds the cap.
- TTS: generated 15 Leila clips (`bin/rails app:break_escape:tts:batch_generate[ca03_helpdesk_reset]`).
  `tts:wasted` = 0 unrequested of 61 current-model clips, 61 expected (46 prior + 15 Leila). Durations 1.97-6.50s.
- Committed scenario + dungeon_graph(.html/.md regen) + 30 cache files (15 mp3 + 15 json) in `c40fa3a03`.

## Checks passed
- ink compile OK (2 files). validate_scenario.rb: 0 errors, 6 pre-existing warnings (office-kit ink
  VARs; avatar/timedConversation "recommended" — not new). dialoguelint ca03: 0 rule hits.
  check_mapping_index_drift main: 0 failures (no eventMappings added).

## Open / remaining (what a continuer should finish)
1. JS tests: `MERGE_BATCH=0 bin/test-js` (or at least phone-voiced-contact, social-pretext-prep,
   validator-phone-calls, phone-chat-* tests). No engine/JS change was made, so these should be green.
2. TTS extractor Ruby tests (tts_line_extractor / ink_text_validator / tts_mission_lines_test /
   tts_wasted_clips) — confirm "no voiced mission line prints a variable" still passes with Leila voiced.
3. Live proof, headless, port 3461 keyless-but-cached:
   `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=.../vendor/bundle bundle exec rails server -b 127.0.0.1 -p 3461 -P <scratch>/srv3461.pid`
   Fresh ca03 game via tools/playtest/new-game.rb. Drive the attack call via window.__test. Prove:
   call opens as a phone call (voiced), Leila's lines POST /tts -> cached audio (200, no 403/404),
   influence meter moves, a reset-granted route and a refused route both reach the flip + defend half.
   Kill only own server PID. Do NOT touch the reserved ports. Headless only.

## Gotchas
- No ca03 routes script exists in tools/playtest or test.
- Player choice labels contain `{pretext_*}` variables — fine, they are NOT voiced (only Leila's lines are).
- Commit only on feat/ca03-voiced-call, explicit paths, no add -A/amend/rebase.
- Defend scenario scenarios/ca03_helpdesk_reset_defend is OUT OF SCOPE (queue cards stay text).
