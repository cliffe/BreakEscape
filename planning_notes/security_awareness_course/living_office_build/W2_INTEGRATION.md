# W2 integration (I): results

Branch `feat/ca-living-office-w2`, worktree `.claude/worktrees/b-ca-lo-w2`. Live proofs, the whole-batch dialogue review and the voicing card are not part of this note; the orchestrator runs them.

## Commits

- f2c758e07: merge of main (clean).
- 84f8fa3bb: episodes.json rows (35 new, ca13 twin amended, keyMessage, hostLine, convention).
- a6a5e28cf: `apply_training_room.py --kit` fix for the ca00 convention row.
- 8291063a3: regenerated and spliced the 36 wave 2 shells (kit rows, twins, ca00, ca17), compiled changed ink.
- bf39af8d8: tests read the kit-carrying ca03 and ca00 shells; bare ca00 build for tests.
- bf196cc81: re-splice of ca11 and its twin after the Carrholme cooler fix (771429eb8, `useFrom` dy 1.25).

Build-log note (history not rewritten, content correct): commit b55ba4c60 (label "P-SBM") holds P-KC's Carrholme files; commit 9df9d0c05 (label "Wave 2 test") holds P-KQ's Quayholt files.

## Checks

- proof5 on HEAD bf196cc81: 0 differences (40 generated shells, 42 kit-spliced, 137 files). Before the re-splice it showed 2 (the ca11 pair, dy 1 against 1.25).
- Full `bin/test-js` (with BUNDLE_PATH): 958 passed, 0 failed, 958 total, 6m19s.
- Run alone: `social-awareness-office-kit`, `office-kit-quiet-and-stub`, all 30 `social-*` files that mention payload, and `social-mail-ink-runner`: 32 passed, 0 failed (the runner passed alone and in the full run; no flake this time).
- Ink routes: `scripts/ink_runtime_check` has route folders m02 to m08 only (`m*_routes`); no `ca*` scenario has one, so `tools/run-ink-routes.sh` was not run. `missions.json` there holds ca entries for `inkcheck`, which is a separate check and was not part of this step.
- Ruby: none touched; rubocop not run.
- Earlier in I (see HANDOVER_w2_I.md): validator 0 ERROR on the 36 shells, mapping-index drift 0 failures, unittest 87 OK.

## Clip counts (no clip voiced)

Method: `TtsLineExtractor.for_scenario` keys (every line the client can request) against `tts_cache/<scenario>/<key>.mp3`, read-only. `app:break_escape:tts:wasted[<scenario>]` was run too; it reports clips that nothing requests (waste), not missing ones, and its counts are the last column. Several shells have 1 to 4 stale clips from earlier line text (for example ca00: the old Anjali greeting); nothing was deleted.

| scenario | lines expected | clips present | missing | unrequested (stale) |
|---|---|---|---|---|
| ca00_first_play | 25 | 2 | 23 | 1 |
| ca02_cv_lures | 36 | 5 | 31 | 1 |
| ca02_cv_lures_defend | 33 | 2 | 31 | 2 |
| ca03_helpdesk_reset | 39 | 5 | 34 | 1 |
| ca03_helpdesk_reset_defend | 36 | 2 | 34 | 1 |
| ca04_exec_whaling | 36 | 5 | 31 | 1 |
| ca04_exec_whaling_defend | 33 | 2 | 31 | 2 |
| ca05_signin_pages | 40 | 4 | 36 | 1 |
| ca05_signin_pages_defend | 38 | 2 | 36 | 1 |
| ca06_texts_and_qr | 38 | 4 | 34 | 1 |
| ca06_texts_and_qr_defend | 35 | 2 | 33 | 1 |
| ca07_voice_ceo | 34 | 4 | 30 | 1 |
| ca07_voice_ceo_defend | 31 | 2 | 29 | 2 |
| ca08_after_the_click | 45 | 5 | 40 | 2 |
| ca08_after_the_click_defend | 41 | 2 | 39 | 2 |
| ca09_passwords | 46 | 8 | 38 | 1 |
| ca09_passwords_defend | 39 | 2 | 37 | 2 |
| ca10_downloads_and_fake_checks | 43 | 6 | 37 | 2 |
| ca10_downloads_and_fake_checks_defend | 38 | 2 | 36 | 2 |
| ca11_misdirected_data | 13 | 5 | 8 | 0 |
| ca11_misdirected_data_defend | 9 | 2 | 7 | 1 |
| ca13_ai_assistant | 46 | 17 | 29 | 2 |
| ca13_ai_assistant_defend | 40 | 13 | 27 | 4 |
| ca14_social_media | 38 | 7 | 31 | 1 |
| ca14_social_media_defend | 33 | 2 | 31 | 2 |
| ca15_shadow_it | 42 | 5 | 37 | 2 |
| ca15_shadow_it_defend | 39 | 2 | 37 | 2 |
| ca16_insider_risk | 45 | 6 | 39 | 3 |
| ca16_insider_risk_defend | 41 | 2 | 39 | 1 |
| ca17_acceptable_use_defend | 36 | 3 | 33 | 0 |
| ca18_credential_attacks_at_scale | 43 | 12 | 31 | 1 |
| ca18_credential_attacks_at_scale_defend | 33 | 2 | 31 | 1 |
| ca19_malware_and_updates | 45 | 6 | 39 | 1 |
| ca19_malware_and_updates_defend | 41 | 2 | 39 | 1 |
| ca20_remote_and_mobile_working | 45 | 8 | 37 | 1 |
| ca20_remote_and_mobile_working_defend | 39 | 2 | 37 | 1 |
| **total (36)** | 1334 | 162 | 1172 | 51 |

Expected lines include existing shared lines (ca01/ca12-style hubs, mission dialogue) as the extractor counts them, so "missing" is the number to voice-check, not the wave 2 new-line count. W2_LINES_ALL.md lists the new lines (182 proposed voiced, 64 written). Twin host lines are unvoiced by D226/D207.
