# Train check build log

## What

The integrator lands a branch (a train) after four checks: the Rails suite, `MERGE_BATCH=1 bin/test-js -j 3`, the validator over every scenario, and a live smoke. The smoke was a hand-driven agent run, and `test/js/shell-x-check.test.mjs` always failed in the batch because nobody set `SHELL_X_PORT` and `SHELL_X_GAME`. This work makes the whole check one command whose "green" means zero failures.

```
TESTS_LOCK=<lockfile> tools/playtest/train-check.sh <worktree> <outdir> <port>
```

## Pieces

- `tools/playtest/train-smoke.mjs --port P --game ID [--game ID ...]`: boots each game headless (chrome-headless-shell, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` or the default under `~/.cache/ms-playwright`), the same boot as `shell-x-check.mjs` and `sync-delta-proof.mjs` (`?skip_resume=1`, `window.__test`, `waitUntilReady`, then `setFPS(20)` with fixed steps on). Per game it checks 0 page errors, a player with a position, a current room that is loaded, and no 4xx/5xx responses except POST `/tts` (keyless cache misses) and the favicon. One `SMOKE <game> OK|FAIL` line per game, then `TRAIN-SMOKE n games, f failed`. Exit 0, 1 (a failure) or 2 (setup error). Port 3000 is refused.
- `tools/playtest/train-check.sh`: under `TESTS_LOCK` (if set) records HEAD, starts a keyless server from the worktree on the port, makes the m01, sis01 and sis02 games with `new-game.rb`, runs Rails, then JS with `SHELL_X_PORT`/`SHELL_X_GAME` set to the m01 game, then the smoke, then the validator corpus (three scenarios at a time), and writes `summary.txt`. A trap kills only the server PID it started. Ports 3000, 3085 and 3086 are refused. No `db:` task is run. `TRAIN_CHECK_SKIP_RAILS`, `_SKIP_JS` and `_SKIP_CORPUS` give a partial run (the summary says SKIPPED; a partial run is not green).
- `test/js/train-smoke.test.mjs`: argument parsing, the response filter, the per-game judgement and the final line. No server.
- `scripts/ink_runtime_check/wordcap_audio_exempt.json` and `capFinding` in `dialoguelint.mjs`: an over-cap line with cached voice audio reports as WARN. `test/js/dialoguelint-wordcap-exempt.test.mjs` tests it.

## Decisions

- The validator's `ERROR ... words (cap N)` lines come from `dialoguelint.mjs` and never change the exit code, so "corpus fails 0" did not catch them. The summary now also counts `ERROR` lines across all validator output.
- The validator prints only four findings per rule per scenario, so the 40 visible word-cap errors hid more. The lint itself found 77 over-cap lines (not only lab instructor ink, and not all at cap 30: phone contacts have cap 25). All 77 were handled: 37 split, 14 shortened, 26 exempted.
- "Has audio" was decided from `tts_cache/<scenario>/`: the line's normalised text against every sidecar's `text`, plus the key (`normalised|voice|style|language|model`, and the old key with no model) crossed with every voice in the scenario's `scenario.json.erb`. The four labs with lines to fix have no `tts_cache` folder at all. In sis03 only Eleanor Vance (and the narrator voice) have clips; Whitworth, Ngata and Hartley have none.
- A line with audio is not edited. It gets an entry `{file, text_md5, start, reason}`. (First version: `start` was the first eight normalised words, matched on the file's base name. That did not freeze the text; see R1 fixes.) 26 entries.
- A line without audio is split at a sentence break into two or three lines in ink. Timed text messages (`sendTimedMessage` in `scenario.json.erb`) are one string each and cannot be split, so they were shortened to 30 words or fewer instead.
- Em dashes in lines I touched became commas or colons. Compiled ink was rebuilt with `scripts/compile-ink.sh <scenario>`.

## Lines changed

Split (ink, no audio), 13 in labs: lab_intro_linux `instructor.ink` (4: man page tip, log analysis, Hydra strategy, Hydra legal status), lab_malware_metasploit `instructor.ink` (1: suspicious patterns), lab_vulnerabilities `instructor.ink` (2), lab_scanning `instructor.ink` (6: port checking, Nmap scanning, service identification, timing, output, combined scans).

Split (ink, no audio), 24 in missions: phone `agent0x99` lines in m03 (2), m04, m05, m06, m08, m10 (1 each); sis03 `npc_james_whitworth.ink` (5), `npc_robert_ngata.ink` (9), `npc_simon_hartley.ink` (3). (7 phone lines and 17 sis03 lines.)

Shortened (timed messages, no audio), 14: m03 FTP note message; m04 Erlang message; m06 backend message and second account message; m07 four operator password messages; m08 three messages; sis03 Eleanor intro, two Whitworth messages. Wording that was dropped to fit: m03 "the man who drew it" became "its author"; m06 backend message lost "one operator login runs the box"; m06 second account message lost "Its account runs their doors" (and "stopped ... then let them go" became "held ... then released"); m07 984/992/1000 lost "You've got their operator's name" and "Elena says"; m08 798 lost "No password. That's a report nobody will enjoy"; m08 806 lost "committed straight into the repo, deleted" and "the full Portland intercept"; m08 814 became "your web foothold". Worth a read by whoever owns those missions.

Exempted (audio exists, text untouched), 26: m03, m04 and m05 `*_closing_debrief.ink` (1 each); sis03 `npc_eleanor_vance.ink` (21 lines); sis03 `scenario.json.erb` (2 timed texts, lines 637 and 715).

## Results

End-to-end run on port 3081 at HEAD 58683c3c1 (before this log's own commit; the later commits are docs only), under the shared lock:

```
rails exit 0: 2761 runs, 46003 assertions, 0 failures, 0 errors, 2 skips
js exit 0: Files: 659 passed, 0 failed, 659 total        (shell-x-check passing)
smoke exit 0: TRAIN-SMOKE 3 games, 0 failed
corpus fails 0 of 179
validator ERROR lines: 0
```

Smoke detail from the partial run: m01 reception_area, sis01 ward_7, sis02 scada_control_room all booted clean.

Notes for the next person:
- The run left one stray file, `scenarios/test_access_social/ink/staff.json.tmp-<pid>-<hex>`, a validator compile temp that was not cleaned up. It was moved to `tmp/delete/`. The first guess here was the corpus's `-P 3`; the review showed that cannot collide (temp names carry the PID plus random bytes, and the validator deletes them in an `ensure`), so a stray means a validator was killed mid-compile, most likely by a JS test timeout killing a child validator or an interrupted run. `train-check.sh` now lists any `*.tmp-*` file in the summary and counts it as red.
- The corpus takes about three minutes at three at a time instead of the serial ten or so.
- The exemption list is keyed on the MD5 of the whole normalised text (and the path under `scenarios/`). If an exempt line's wording changes anywhere, its entry stops matching and the line becomes an ERROR again, which is the point: a changed line has a new key and no audio yet. A test fails on entries that no longer match a live over-cap line.

## R1 fixes (review round 1: 0 blockers, 4 major, 15 minor)

| Finding | Fix |
|---|---|
| M1 m07 reuse hint (`m07_architects_gambit/scenario.json.erb` two rows) | The reviewer's text, 29 words: names the operator's name, Elena, the door code as login, and "that operator flag hits the relay, the team window shuts". |
| M2 m08 flag-2 message | The reviewer's text, 29 words: "Log in properly", and the sealed key is the Portland intercept in the safe. |
| M3 exemption on an eight-word prefix | `wordcap_audio_exempt.json` entries are `{file, text_md5, start, reason}`; `capFinding` compares the MD5 of the full normalised text. `file` is the path under `scenarios/` and is matched on whole path segments (so `sis03_cyber_insurance/scenario.json.erb`, not any `scenario.json.erb`). New tests: a last-word edit and an appended word turn a listed line back into an ERROR, the path match, and every entry still matching a live over-cap line (stale entries fail). The claims in this log and the AGENTS.md "train check" bullet now match. |
| M4 exit code | `train-check.sh` exits 1 when red, 3 for a partial run, 0 only for green, 2 for setup errors. The last line of `summary.txt` is `GREEN`, `RED: <reasons>` or `PARTIAL: skipped <steps>`. Rails, JS, smoke, new-game, corpus, dialogue-lint, unknown validator errors and a dirty tree are all red conditions. |
| m1 m03 FTP note | Reviewer's text (30 words). |
| m2 m06 backend | Reviewer's text (28). |
| m3 m06 second account | Reviewer's text (28). |
| m4 m07 listener, Elena row | Reviewer's text (29). |
| m5 m08 flag 1 | Reviewer's optional text (30). |
| m6 m08 flag 3 | Reviewer's text (29). |
| m7 sis03 Eleanor intro | Reviewer's text (30, "Eleanor Vance:" prefix counted). |
| m8 Ngata exclusion split | The reviewer's wording came to 27 words in the phone-capped Ngata file (cap 25), so it would have been an ERROR. Used instead: "But if they know a claim will be denied because a nation-state was involved, under the state-sponsored attack exclusion, the incentive flips." and "It becomes: ..." as the next line. The cause ("because ... exclusion") stays in one sentence. Compiled JSON rebuilt. |
| m9 Ngata IOCs colon | "The GREYMANTLE tools matter most: the DNS-over-HTTPS C&C and the domain controller implant characteristics." |
| m10 Hartley circularity colon | "There's a layer of circularity there." |
| m11 lab continuation lines | Indented (4 spaces) in `lab_malware_metasploit` (1) and `lab_scanning` (8). Compiled JSON is unchanged, as expected. |
| m12 basename match | Folded into M3. The list header in `dialoguelint.mjs` now notes that a `#delivery`-tagged line keys its clip on different text. |
| m13 validator ERROR lines | The summary reports `dialogue-lint ERROR lines` and `validator ERROR lines: known N, unknown M`; only unknown ones count against green. |
| m14 dirty tree | A clean `git status` (nothing but `node_modules` and `.bundle`) is part of green; stray `*.tmp-*` files are listed and red. The `.tmp` cause is described in the notes above as the reviewer gave it (a killed validator, not `-P 3`). |
| m15 smoke and wrapper | `train-smoke.mjs` refuses 3000, 3085 and 3086, listens for `requestfailed` and `console.error`. Failing: any failed request except a page-cancelled one (`ERR_ABORTED`), keyless `/tts` and the favicon; any `console.error` except the browser's "Failed to load resource" echo of an HTTP status (judged separately) and keyless TTS noise. Reason: a boot step that logs and carries on is exactly the regression the smoke should catch. `TESTS_LOCK` unset now warns in `summary.txt` and on stderr. `$HOME` replaces the hard-coded home, `RUBY` overrides the validator ruby (default `/usr/bin/ruby3.2` if present, else `ruby`). `$OUT` is passed to the `bash -c` as `$2`. |

Known gap left as the reviewer described it: the smoke covers the first 2.5 s of m01, sis01 and sis02 only.
