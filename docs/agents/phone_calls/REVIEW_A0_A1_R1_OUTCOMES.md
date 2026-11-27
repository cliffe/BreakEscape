# Outcomes: review round 1 of A0 and A1

Review: `REVIEW_A0_A1_R1.md`. Fixer commits: `daee4e25f` (code, tests, record corrections) and the commit that adds this file, the proofs and the post-A1 key baseline. Nothing was rejected.

## Major

**M1. Preloaded opening and reopen re-run spoke call lines without their note.** Fixed as the review suggested.
- `phone-chat-conversation.js`: the preload keeps each opening line's `#delivery:` tag(s) on the message (`deliveryTags`, only when there is one; no new import, so no harness copy-list change). `reopenWithCurrentGlobals` returns `messageTags`, parallel to `messages`; tags of steps that print nothing are carried to the next visible line, as `InkEngine.continue` does. New statics `lastLineTags`, `isDeliveryTag`.
- `phone-chat-minigame.js`: `_speakPreloadedOpening` passes `deliveryFromTags(msg.deliveryTags)`; the reopen branch goes through a new `_presentReopened(reopen)`, which passes `{ deliveries }` to `_presentOutput` (a small extraction so the path can be driven by a test).
- Tests (`test/js/phone-call-notes-paths.test.mjs`, fixture `fixtures/phone_call_notes.ink`): real ink through the real conversation class; real `_speakPreloadedOpening` -> `_speakCallLine` -> `PhoneCallVoice.speak` gets `{ delivery }`; real `reopenWithCurrentGlobals` -> `_presentReopened` -> `_presentOutput` -> `_showStoryLine` gets each note, a tag on an empty step carried forward; `_showStoryLine` speaks with the note on a voiced call and never speaks in a silent thread.
- Live proof (keyless :3024, new demo scenario `scenarios/test_phone_call_notes`): the call's first line requests `delivery: "low and even"`; after setting `alarm` and force-closing the call it rings again and the reopen re-run requests "The alarm just went off." with `delivery: "urgent and clipped"` (`proofs/A1R1/m1_tts.jsonl`, `m1_reopen.png`). The scenario needed one `Mission` row (id 247) in the shared dev DB, inserted with a one-row runner, no schema command.
- The preloaded-opening path has no shipped line with a note (only Dev, who has none), so its proof is the node test, not a live run.

**M2. Id prefix on a voiced call could name a speaker the server refuses.** Fixed on the server (the review's first option), phone path only.
- `tts_line_extractor.rb`: `speaker_id_for` returns `[id, matched_by_id]`; `resolve(..., id_names:)` skips the same-display-name rule when the line was matched by id and `id_names` is true. `each_host_line` sets `id_names` for a phone host's voiced-call lines (not its video-call knots).
- Person-chat keeps the same-name rule on both sides (`isOwnNpcByName` is unchanged), so the paths agree where they overlap and no person-chat key moves. This is the review's note about the twin, resolved by scoping the id rule to the phone path.
- Tests: Rails (`tts_line_resolver_test.rb`) for a same-name pair `hax_post` / `agent_0x99` as extractor entries and as resolver requests, plus the person-chat contrast; JS (`phone-speaker-ids.test.mjs`) for the same pair.
- Key diff: dump from `git archive` of HEAD before my edits vs. HEAD after: identical (`diff -r`, no key moved, 26 scenarios, exit 0). Against the A0 baseline the only moves are the allowed ones (`keys_allow_a1.txt`: m09 4, m10 1, `lab_physical_pentest` 1 from M9).
- Not run live: no shipped line has an id prefix naming a same-named record (m10's `hax_post:` lines arrive with M2).

**M3. Recruiter hit record.** Corrected in `proofs/ROUTES.md` (table row), `HANDOVER_A0_A1.md` (Open 1) and the comment in `routes/m09_recruiter_hit_resume.sh`: "not reached, the call had ended before `damage()` ran". The handover has a new section "A2c: start here": capture a real mid-call baseline from the pre-A2c engine before any A2c code change.

## Minor

- **m1** Name-before-id precedence. Validator warning `check_speaker_id_name_clashes` (id equal to another record's display name, any case), test `validator-speaker-id-clash.test.mjs`. The server's order is not changed (it would touch person-chat keys); a comment on `speaker_id_for` says why the orders agree when the warning is clean. A JS test fixes the client's name-first order.
- **m2** Tests. Replaced the test that could not fail (the Narrator line now asserts `narrator` speaks). Added: `_speakCallLine` gets `{ delivery }` through the real `continueStory` and `handleChoice` bodies (`phone-chat-line-tags.test.mjs`); a silent thread never speaks (`phone-call-notes-paths.test.mjs`); a client/server parity fixture (`test/fixtures/files/phone_note_parity/`, `phone-call-note-parity.test.mjs`, `tts_phone_note_parity_test.rb`, shared `expected.json`) covering a note above the line, after a `{cond: ...}` line, across a divert, into a tunnel, in a block, and a glued line (client joins it, the walker leaves it unresolved, so the server does not list it); the M1 paths; the M2 pair; the id/name clash.
- **m3** `dialoguelint.mjs` phone delivery checks: not changed in behaviour. The linter cannot tell a call knot from a text knot until the `// lint: call-knot` marker exists (plan 4.4), so the stale comment now says A7 does this. Log line for A7.
- **m4** `line_delivery` lost its always-true parameter; `each_host_line` yields five values.
- **m5** Id path live proof stays with M2 (Ghost's `agent_0x99:` line must show `npc_id: agent_0x99` and subtitle "Agent HaX"). Of the five re-keyed lines, `tesseract_call` was proved in A1; the other four are the same code path and are covered by the parity test and the key diff.
- **m6** `tools/phone_calls/ps.js` resolves the skill helpers relative to `__dirname`. Drift from the skill harness remains: log for the user that `--tts-log` belongs in the skill harness. `newgame.sh` and `open.sh` now take `PC_PORT` (default 3023).
- **m7** `dump_tts_keys.rb`: `TTS_DUMP_CHATTER=1` adds bark and chatter keys, and a scenario that fails to render exits 1. New `tools/phone_calls/compare_tts_keys.rb <base> <new> [allow_file]`. Post-A1 baseline `keys_baseline_a1/` (made with chatter on, from a clean archive of `daee4e25f`, so it excludes the other agent's uncommitted m09/m10 edits; re-cut after those land). Not done: varying imports per scenario (`m03_victoria_fate`); log for A2c.
- **m8** `call_probe.sh` comment and the ROUTES.md closing paragraph now say `TRIGGER` does not emit the event; use `EMIT`.
- **m9** The five re-keyed lines, by text, in the handover and plan 1.9: m09 `m09_phone_agent0x99.ink` "Don't be kind about it. Thank you. Once." (496), "...That's mine. You don't get to use it on me. Thank you." (508), "Nobody's called me that since the course. It's HaX. It has been for seven years." (680); `m09_phone_recruiter.ink` "Then I'll tidy my own desk. Gone. Goodnight, agent." (171); `m10_ghost_phone.ink` "No. I'd rather not leave on that." (146).

## Tests

- Phone-area node tests: all pass (one run showed `social-mail-ink-runner` failing under load; it passes alone). Full `bin/test-js -j 3` under the lock: 497 files passed, 0 failed.
- Rails (`tts_controller_test`, `*tts*`, `ink_*`) under the lock: 181 runs, 0 failures (also after the demo scenario was added).
- Lab SE Dev proof re-run on :3024 (`proofs/A1R1/se_dev/`): `sha256_noseed` for `dev_service_desk` and `ruth_phone` after the call and after reload equal A0's, and the four `/tts` requests (npc_id, text, delivery, status) are identical to A0.

## Noticed, not acted on

- The extractor's walker raises (`nil.strip` in `handle_string`) on the inline form `{cond: text #delivery: note}`, because inklecate emits an unbalanced `#` pair for it. The block form and `{cond: text} #delivery: note` work. No shipped ink uses the inline form (every scenario extracts), but a lint rule or a walker guard would be cheap.
