# Handover: A0 and A1 (final state)

Worktree `.claude/worktrees/p-phone-calls`, branch `build/phone-calls`. Plan: `docs/achitechture/PHONE_CALLS_PLAN.md` section 6. A0 and A1 are finished apart from the open items below. Server on :3023 stopped; the temporary pre-A1 worktree is removed.

## Commits

1. 8a1ee3fbc A0 baseline and tooling.
2. db4983a98 A1 delivery notes on voiced calls (client, extractor, tests).
3. 153ee86b2 A1 speaker ids (`otherSpeaker` id map, `phoneLineVoice`, `phone-chat-ui.js`, `test/js/phone-speaker-ids.test.mjs`, id scan).
4. 8b38bce3d A0 remaining routes from the pre-A1 engine.
5. The commit with this file, the A1 live proof and the `finale-forced-call-and-closing-card` assertion update.

## Done

- **A1 delivery** (see commit 2). Rails coverage already exists in `tts_delivery_test.rb` (two tests rewritten for the new rule: a voiced call's tagged line has a note and the key of the video-call form, an untagged line keeps the plain key), so no extra extractor test was added.
- **A1 speaker ids (2.10).** `otherSpeaker(text, contact, knownNames, knownIds)`: exact id prefix, any case, never the contact's own id, `narrator` or `player`; returns `{ name, id, text }`. `phoneLineVoice` builds the id map from the characters it gets and voices the record with that id. `phone-chat-ui.js` has `_knownSpeakerIds()` and passes it at both callers (bubble and call subtitle show the display name). No new static import, so no harness copy-list change. Id scan: `tools/phone_calls/scan_speaker_ids.rb`, output `proofs/A1/id_scan.txt`: 45 hits over 25 scenarios, none of them a different character's id. 6 are the contact's own id (`chat_minigame_demo` Cipher), 39 are `Narrator:` lines (m02, m05, m07, m09, lab_tesseract_trials), which the rule excludes. The plan's `Priya:`/`Dom:` in `test_dm_social` are not hits (those contacts' ids are `priya_dm` and `dom_dm`). So no key moves from 2.10. Note for the log.
- **A0 routes**: all captured except the Recruiter re-ring (below). How each was reached is in `proofs/ROUTES.md`.
- **A1 live proof** (`proofs/A1/`): m09 `tesseract_call` request for "Nobody's called me that since the course..." carries `delivery: "a beat's pause after the first sentence, then firmer"` (`m09_tesseract_call_tts.jsonl`); lab SE Dev call re-run: `sha256_noseed` for `dev_service_desk` and `ruth_phone` after the call and after reload, and the four `/tts` requests (text, npc_id, delivery), are identical to A0; screenshots looked at.

## Test results (A1 code)

- `bin/test-js -j 3` under flock: 494 files, 493 passed on the first run, 1 failed (`finale-forced-call-and-closing-card`, a source-text assertion on the old `otherSpeaker` call); fixed, file re-run alone 17 pass. A full re-run was not repeated after that one-line fix.
- Rails: 6 TTS test files (`tts_mission_lines`, `tts_delivery`, `tts_line_resolver`, `tts_wasted_clips`, `ink_line_walker`, `tts_carried_globals`): 79 runs, 0 failures.
- Key diff against the A0 baseline: exactly 5 keys moved (4 in `m09_digital_archaeology`, 1 in `m10_full_disclosure`), nothing else. The five lines (by text, since line numbers move; the number at A1, then at `b40d0c916`): `m09_phone_agent0x99.ink` "Don't be kind about it. Thank you. Once." (494, then 496); "...That's mine. You don't get to use it on me. Thank you." (506, then 508); "Nobody's called me that since the course. It's HaX. It has been for seven years." (678, now 680); `m09_phone_recruiter.ink` "Then I'll tidy my own desk. Gone. Goodnight, agent." (171); `m10_ghost_phone.ink` "No. I'd rather not leave on that." (146).
- `reopencheck.mjs missions.json` (in `scripts/ink_runtime_check/`): total problems 4, the same four m09 contacts as before.

## Open

1. **Recruiter hit and re-ring: not reached.** The call had ended before `window.playerHealth.damage()` ran (the whole call and HaX's follow-up played first, `A0/m09_hit_tts.jsonl`; `m09_hit_2_after_hit.png` shows a text thread, no call screen). Nothing was tested about a hit during a call, and "no re-ring" is explained by the re-ring conditions already being false. Corrected in review round 1 (M3). See `ROUTES.md` and "A2c: start here" below.
2. Screenshots for the m09 identity and m10 breach calls show the map after the call ended (keyless 503 makes calls advance at once); the `/tts` request lists are the evidence.
3. Log line for `docs/agents/phone_calls/PHONE_CALLS_LOG.md` not added (the orchestrator's file).
4. A2a not started.

## A2c: start here

Before any A2c code change, capture a real mid-call baseline for the Recruiter hit from the **pre-A2c engine** (the A0 run never had a call connected when it hit; see Open 1). Stop at the Recruiter's first choice before answering (`UNTIL_TTS` on the first Recruiter line, then the hit), on a server with cached audio so the call does not race through on 503s, and use a real guard hit if one can be staged. Record whether the call stays open, what the thread shows, and whether any re-ring fires after close, save, reload and resume. A2c designs against that record, not against the A0 note.

## Gotchas

- Bridge: setting a global through `window.gameState.globalVariables` does not emit `global_variable_changed:x`. Emit it (`EMIT=` in `call_probe.sh`). `--set` is overwritten for imported globals: use `--imports=<file>`.
- Proof tools need `NODE_PATH=<repo>/node_modules` when the checkout is outside the repo tree. The brief's `RBENV_VERSION=3.1.6` is not installed (default Ruby 2.7.8).
- `session-start.sh` takes its tag from the trailing digits of `--url`. Stale `tools/playtest/pipes-*` directories make `cmd.sh` hang: delete them. A `cmd.sh` hang with no `ps.js` process means the session never started.
- Don't use broad `pkill -f` patterns: they match your own shell.
- Proof games on the shared dev DB: ids 1278 to 1320 (made by `new-game.rb`, no schema commands run).
