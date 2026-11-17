# Outcomes: review round 2 of A0 and A1

Review: `REVIEW_A0_A1_R2.md`. Fixer commits: `d184413ea` (code and tests) and the commit that adds this file, the live proof and the demo scenario's second contact. One deviation from the review's suggested fix (M1, below); nothing else rejected. No handover note: the work finished well inside the budget.

## Major

**M1. A preloaded opening's note was lost on a reload before the first open.** Fixed by persisting it.
- `npc-manager.js`: `PHONE_MESSAGE_FIELDS` gains `deliveryTags`; on restore the field is kept only as an array of at most 5 strings of at most 300 characters, else dropped.
- `game.rb`: `PHONE_MESSAGE_KEYS` gains `deliveryTags`, cleaned by `clean_phone_delivery_tags` (Array only; each entry a String of at most 300 characters with no control characters; at most 5; empty list means no key). The tags are never rendered; they only reach the TTS prompt, which `TtsService.clean_delivery` cleans again.
- Deviation from the review: it suggested saving a cleaned `delivery` string. I save the raw tags (as `deferredTags` already is) because the string needs `deliveryFromTags` in `phone-chat-conversation.js`, a new static import that would go into 13 test harness copy lists, and the raw tags keep the client's "last usable tag wins" rule exactly. Same validation class as the neighbouring fields.
- Tests: Rails `test/models/break_escape/phone_message_delivery_tags_test.rb` (kept, absent, non-array, hostile entries including non-strings, 400-character, control characters, markup and extra tags, only-bad list, text still capped). Node `phone-call-notes-paths.test.mjs`: real preload, real `NPCManager` export, JSON round trip, restore, then the real `_speakPreloadedOpening` speaks `calm and low`; and a hostile saved thread is cleaned on restore.
- Live proof (`proofs/A1R2/`, route `routes/note_preload_reload.sh`, keyless :3024, `test_phone_call_notes` now has a second voiced contact, Agent Dee, with a tagged preloaded opening and `skip_hax` to keep HaX quiet): after pickup the history holds `deliveryTags` (`history_before_reload.json`); after sync and reload, before the thread is opened, it still does (`history_after_reload.json`); opening it (`ring_dee`) sends `/tts` with `npc_id agent_dee`, `delivery "breathless, glancing behind her"` for the first line and none for the second (`tts.jsonl`). I did not run the pre-fix code live; the node test fails without the field in `PHONE_MESSAGE_FIELDS`.

## Minor

- **m1** (own display name vs another record's id). `tts_line_extractor.rb`: when `id_names` is on, a prefix equal to the host's displayName, id or spaced id (case-insensitive, as `contactNames` builds them) resolves to the host before `speaker_id_for` runs. Rails test (both record orders) and node test (both orders, through `displayPhoneLine` then `phoneLineVoice` as `_speakCallLine` does). Note that "ghost" is also the display name "Ghost" case-insensitively, so it stays with the host on both sides; another record's own id still names it.
- **m2** (reopen carry at the replayed/fresh boundary). `reopenWithCurrentGlobals` starts `carried` with the tags of the empty steps that end the replayed part. New knot `call2` in `phone_call_notes.ink`, test fails without the fix (checked).
- **m3** (`compare_tts_keys.rb`). The allow file now takes exact moves (`-key`, `+key`, `-line npc|text`, `+line npc|text`), `added-scenario` and `removed-scenario`, plus the old counts form. It prints every moved key with its line. `dump_tts_keys.rb` gains `TTS_DUMP_LABELS=1` (writes `_labels/<scenario>.tsv`); without it the dump is byte-identical to before. `test_phone_call_notes` is allowed through `added-scenario` in `keys_allow_a1.txt`. Against `keys_baseline_a1/` the script still reports m09 (58/58) and lab_physical_pentest as unexpected: those are the other agents' content moves (M2/M3, M9), not A1, and need their own allowance or a re-cut baseline. Baselines have no labels, so removed keys print without text until a labelled baseline is cut.
- **m4** (walker crash on `{cond: text #delivery: note}`). Not supported (it needs the walker to follow a tag across a container boundary, not small). The walker now treats the stray `/#` as an unsupported shape: the line is left unresolved, one warning is logged per story, nothing raises. Walker unit test with fixture `inline_tag.ink`. `dialoguelint.mjs` warns (rule `delivery-note`, both channels) for a tag inside braces and says to use `{cond: text} #tag`; lint test added; 0 hits across 361 shipped ink files.
- **m5** (coverage). The open-path choice moved out of `open` into `_showRestoredThread`, and tests drive the real method: reopen, preloaded-only voiced, reopen on preloaded-only, silent thread, non-voiced NPC, resuming pretext, played thread, ended story, `restartOnRetalk: false`. The source-regex test stays as a wiring check. The parity test now also runs the shared ink through `reopenWithCurrentGlobals` (fixture gained a `Hang up` choice so a global change re-runs the knot) and checks each fresh line's note against the shared table.

## Checks

- Key dump: before (HEAD extractor and walker loaded over the working tree) and after, with chatter: identical (`diff -r`, 27 scenarios). The labelled dump differs only by `_labels/`.
- Node: phone-area and dialoguelint files pass (200); `bin/test-js -j 3` under the lock: 497 files passed, 0 failed.
- Rails under the lock: resolver, parity, walker, new model test, game-time test, reload persistence, `tts_controller_test`, all `tts_*` and `ink_*` unit tests: 265 runs, 0 failures.
- Lab SE Dev regression on :3024 (`proofs/A1R2/se_dev/`): `sha256_noseed` for `dev_service_desk` and `ruth_phone` after the call and after reload equals A0 and A1R1; the four `/tts` requests are the same text with no note. Server stopped.

## Noticed, not acted on

- `dump_tts_keys.rb` still aborts if `TtsLineExtractor.new` raises (its rescue covers only the ERB render). The walker no longer raises for the inline form, so I left it.
- Other agents' untracked `tools/phone_calls/routes/m09_m3_*.sh` and `proofs/M3/` are not mine and were not committed.
