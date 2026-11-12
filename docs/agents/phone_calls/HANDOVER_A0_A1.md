# Handover: A0 and A1 (implementer, stopped at the context limit)

Worktree `.claude/worktrees/p-phone-calls`, branch `build/phone-calls`. Plan: `docs/achitechture/PHONE_CALLS_PLAN.md` section 6. The R5 minors touch A2b, A5, A2a and the M slices only, so none applies to A0 or A1.

## Done

**A0 (commit 8a1ee3fbc), partly complete.**

- TTS key baseline for the 25 scenarios with a phone record: `docs/agents/phone_calls/keys_baseline/` (`_index.txt` has counts). Script `tools/phone_calls/dump_tts_keys.rb`.
- Live-proof tooling in `tools/phone_calls/` (see `docs/agents/phone_calls/proofs/ROUTES.md`). `ps.js` is a copy of the skill harness plus `--tts-log`, so every `POST /tts` (npc_id, text, delivery, status) is recorded from before the first page load.
- lab SE Dev call baseline: `proofs/A0/` (`storystate_after_call.json`, `storystate_after_reload.json`, `tts.jsonl`, four screenshots, looked at). `storySeed` is a random ink seed that changes on every run, so the byte-for-byte rule is applied to the state with `storySeed` removed (`sha256_noseed`); two unchanged-engine runs matched. The A1 re-run is `tools/phone_calls/routes/se_dev.sh <outdir>`, then compare `sha256_noseed` in the two `storystate_*.json` files.
- m09 Recruiter call baseline (`proofs/A0/m09_recruiter*`): the call rang and spoke with HaX as co-speaker.

**A1, delivery notes on voiced calls (client and server), committed as the second commit below.**

- Client: `phone-chat-minigame.js` carries each step's `#delivery:` note (`deliveryFromTags`) to the last line of the step through `_presentOutput` and `_showStoryLine` to `_speakCallLine`, on both the continue path and the after-choice path; `PhoneCallVoice.speak(..., { delivery })` calls `play(speakerId, text, delivery ? { delivery } : undefined)`. New helper `stepDeliveries` in `phone-call-voice.js` (no new import there, so the finale test copy list is unchanged).
- Server: `tts_line_extractor.rb` `line_delivery(line, sends_delivery)` and `each_host_line` yield `true`, so voiced-call lines carry their note. Key diff against A0: exactly 5 keys moved, 4 in `m09_digital_archaeology`, 1 in `m10_full_disclosure`, nothing else in any of the 25 baselines.
- Tests: new `test/js/phone-call-delivery.test.mjs` (5 tests). Updated source-text assertions in `finale-voiced-calls.test.mjs` (:253, :261), `phone-player-lines.test.mjs`, and the injected-symbol lists in `engine-fixes-round6.test.mjs` and `phone-chat-line-tags.test.mjs` (they build `handleChoice`/`continueStory` from the source and need `stepDeliveries` and `deliveryFromTags`).

## Test results

- `bin/test-js -j 3` (under flock): 493 files passed, 0 failed.
- Rails: `tts_mission_lines_test`, `tts_delivery_test` (two assertions updated to the new rule), `tts_line_resolver_test`, `tts_wasted_clips_test`, `ink_line_walker_test`, `tts_carried_globals_test`: 79 runs, 0 failures after the update (re-run of `tts_delivery_test` alone: 24 runs, 0 failures).
- `reopencheck.mjs missions.json`: total problems 4, all "restart after an end replays the opening of start" on the four m09 contacts (recruiter, nightshade_phone, torres_phone, gary_phone). The script imports only the ink engine, not the files A1 changed, so I believe these predate A1. Not verified against a pre-A1 checkout.
- Key diff vs A0: 5 keys moved (4 m09, 1 m10), nothing else.

## Commits

1. 8a1ee3fbc: A0 baseline and tooling.
2. A1 delivery notes (client, server, tests, this handover).

## Open

1. A0 routes not captured (details in `ROUTES.md`): m09 `identity_scene`, m10 `breach_call`, m10 `victoria_call`, m02 console video call, lab_tesseract `the_offer_call`, the m10 HaX co-speaker portraits, and the m09 Recruiter hit-and-`resume` part. m09 and m10 open with a long briefing person-chat that has to be cleared before their phone calls can ring. The `TRIGGER`/`EMIT` options in `routes/call_probe.sh` are the way in.
2. A1 speaker ids (2.10): not started. `otherSpeaker` fourth argument, `phoneLineVoice`, the two `phone-chat-ui.js` callers, `test/js/phone-speaker-ids.test.mjs`, and the id scan committed to the log. The scan result the plan expects: only `Narrator:` and each contact's own id (`test_dm_social`) match, so no key moves.
3. A1 live proof not run: the m09 `tesseract_call` line (`m09_phone_agent0x99.ink:678`) must request with its note (needs `hour_read_done` and a cleared briefing), and the lab SE Dev regression re-run after the change.
4. `test/unit/break_escape/tts_line_extractor_calls_test.rb` is for A2b and A5; no Rails test was added for the A1 server change beyond the key diff. A short extractor test (a voiced-call line with `#delivery:` has a note) would be the proper one.
5. The five re-keyed lines (for the audio step): `m09_phone_agent0x99.ink:494, 506, 678`, `m09_phone_recruiter.ink:171`, `m10_ghost_phone.ink:146`.
6. Log line for `docs/agents/PHONE_CALLS_LOG.md` is not added (the file is the orchestrator's).

## Gotchas

- The brief's `RBENV_VERSION=3.1.6` is not installed. Use the default Ruby 2.7.8; set only `BUNDLE_PATH` and `BREAK_ESCAPE_STANDALONE=true`.
- The server on :3023 serves the worktree's JS live. Editing engine files while a baseline run is in progress changes what the browser loads. Do not edit engine files during an A0-style baseline.
- `session-start.sh` takes its tag from the trailing digits of `--url`, so never put `?skip_resume=1` on the URL.
- Stale `tools/playtest/pipes-*` directories make `cmd.sh ... quit` hang. Delete them.
- Proof games: ids 1278 to 1291 on the shared dev DB (created by `new-game.rb`; no schema commands were run).
