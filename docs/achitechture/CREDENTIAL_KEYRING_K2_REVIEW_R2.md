# Credential keyring K2: code review, round 2

Diff: `c8a2bbc28..1555ab434` on `build/keyring-k2` (the fixes for `CREDENTIAL_KEYRING_K2_REVIEW_R1.md`; fixer's notes in the "K2 R1 fixes" section of the build log).

## Verdict: SHIP (B0 M0 m0 t2)

Every R1 finding is fixed as claimed or soundly deferred. The new tests fail on broken code (two mutations re-run, below). The only app change is a comment. All five K2 test files pass (70 runs, 307 assertions, 0 failures) and so does `TtsDeliveryTest` (24 runs, 0 failures).

## R1 findings, one by one

- **m1 (fixed).** `network_access.rb:1257-1262` is a comment-only change; the loop body is untouched, so no behaviour change. The comment states the argument I gave in R1 correctly (a pruned session sits outside the reach, so it never fed the reach). The test rename at `credential_sessions_test.rb:94` now says what it proves. Accept.
- **m2 (fixed).** Two new tests, `sync_end_globals_test.rb:105-128`. The first ends the invite, then syncs `endedCredentials: []` with the end global `false`, and asserts the stored list still holds `jake_assist` and the relay sign-in still answers `ended`. The second sends a forged list and asserts `[]`. Mutation re-run: I inserted `@game.player_state['endedCredentials'] = params[:endedCredentials].to_a` before the `apply_credential_end_globals!` call in `games_controller.rb`; both new tests failed (lines 115 and 127), 7 runs, 2 failures. Restored with `git checkout -- app/controllers/break_escape/games_controller.rb`. Accept.
- **m3 (fixed).** `count_scenario_loads` (`sync_end_globals_test.rb:34-46`) now counts a named `"scenario_data"` select and a whole-row select of `break_escape_games` (both the `"break_escape_games".*` and `SELECT * FROM` forms). The suite still passes with the zero-load assertion, so the request path issues no whole-row load today. I did not re-run the fixer's `find(id).scenario_data` mutation; the counter logic reads correctly. Accept.
- **m4 (deferred to K3c/K4).** The deferral is sound. A folder under a relay desktop goes through `session_admits?` with no route check, which shows only what the relay desktop already shows and gives no pivot (relay sessions are skipped by `reach_session_hosts`, `view_session_hosts`, `mapped_shares` and `implant_foothold!`, none changed here). The same gap exists for foothold sessions today, the fix needs the client to send the route on folder opens, and K3c is where the client work lands. No data exposure, no pivot. Keep it on the K3c brief as a named item so it is not lost.
- **Missing typed/claim `endedPcIds` test (fixed).** `credential_login_test.rb:238-276`: a typed sign-in and an owner claim (which can replace only a relay, so the claim test seeds one) each answer `endedPcIds: ['sv_fs02']` and drop the session; a typed re-sign-in that prunes nothing is byte-identical to the fresh answer with no `endedPcIds` key. Mutation re-run: I replaced line 4150 of `game.rb` (`replaced ? prune_unreachable_sessions! : []`) with `[]`; the typed and claim tests failed (lines 254 and 263), and so did the existing relay-replaces-pivot test (line 214), 3 failures in 27 runs. Restored with `git checkout -- app/models/break_escape/game.rb`. `git status` afterwards shows only the untracked `node_modules`, which was there before. Accept.
- **t1 to t4.** No code action asked for. The notes for t2, t3 and t4 are recorded in the build log for K3a and K3c. The `with_game_lock` question from "Not checked" in R1 is answered in the log (`login` is in the list); I did not re-grep it.

## Regressions

None found. `app/` changes by one comment block. The test changes only add cases or widen a counter. The widened counter could in principle fail on a legitimate whole-row load added to the sync path later; that is the intended tripwire.

## Findings

No B, M or m.

**t1. The `TtsDeliveryTest` warnings.** `test/unit/break_escape/tts_delivery_test.rb:8` (the new `require 'net/http'`). The "already initialized constant Net::BufferedIO::BUFSIZE / Net::NetPrivate::Socket" warnings are not caused by the test. The bundle loads the `net-protocol` 0.1.3 gem (a dependency of `net-imap`, `net-pop`, `net-smtp`). Ruby 2.7.8's stdlib `net/http.rb` line 23 uses `require_relative 'protocol'`, which loads the stdlib `net/protocol.rb` by absolute path even though the gem's copy of the same feature is already loaded, so every constant in it is defined twice. Evidence: `bundle exec ruby -e 'require "net/http"'` prints the same warnings with no test code involved, and `tts_spoken_text_test.rb`, which has no explicit require, prints 3 of them when run alone (the first `TtsService` use pulls in `net/http` through `tts_service.rb:4`). So the warnings come from the first load of `net/http` in the process, and the require only moves that load to file-load time. Keep the require: it fixes the order-dependent `uninitialized constant Net::HTTPOK` at `tts_delivery_test.rb:161`, and it costs no extra warnings. The warnings are harmless noise. If they matter, the fix is outside this slice: add `gem 'net-http'`/a newer `net-protocol` pin, or run on a newer Ruby.

**t2. Keep m4 on a list.** Add "folder under a relay desktop skips the route check" to the K3c/K4 brief headings so the deferral has an owner. No action in K2.
