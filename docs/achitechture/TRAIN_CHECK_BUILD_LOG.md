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
- A line with audio is not edited. It gets an entry `{file, start, reason}` where `start` is the first eight words after the TTS normalisation, matched on the file's base name. 26 entries.
- A line without audio is split at a sentence break into two or three lines in ink. Timed text messages (`sendTimedMessage` in `scenario.json.erb`) are one string each and cannot be split, so they were shortened to 30 words or fewer instead.
- Em dashes in lines I touched became commas or colons. Compiled ink was rebuilt with `scripts/compile-ink.sh <scenario>`.

## Lines changed

Split (ink, no audio), 13 in labs: lab_intro_linux `instructor.ink` (4: man page tip, log analysis, Hydra strategy, Hydra legal status), lab_malware_metasploit `instructor.ink` (1: suspicious patterns), lab_vulnerabilities `instructor.ink` (2), lab_scanning `instructor.ink` (6: port checking, Nmap scanning, service identification, timing, output, combined scans).

Split (ink, no audio), 24 in missions: phone `agent0x99` lines in m03 (2), m04, m05, m06, m08, m10 (1 each); sis03 `npc_james_whitworth.ink` (5), `npc_robert_ngata.ink` (9), `npc_simon_hartley.ink` (3). (7 phone lines and 17 sis03 lines.)

Shortened (timed messages, no audio), 14: m03 FTP note message; m04 Erlang message; m06 backend message and second account message; m07 four operator password messages; m08 three messages; sis03 Eleanor intro, two Whitworth messages. Wording that was dropped to fit: m03 "the man who drew it" became "its author"; m06 backend message lost "one operator login runs the box"; m06 second account message lost "Its account runs their doors" (and "stopped ... then let them go" became "held ... then released"); m07 984/992/1000 lost "You've got their operator's name" and "Elena says"; m08 798 lost "No password. That's a report nobody will enjoy"; m08 806 lost "committed straight into the repo, deleted" and "the full Portland intercept"; m08 814 became "your web foothold". Worth a read by whoever owns those missions.

Exempted (audio exists, text untouched), 26: m03, m04 and m05 `*_closing_debrief.ink` (1 each); sis03 `npc_eleanor_vance.ink` (22 lines); sis03 `scenario.json.erb` (2 timed texts, lines 637 and 715).

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
- The run left one stray file, `scenarios/test_access_social/ink/staff.json.tmp-<pid>-<hex>`, a validator compile temp that was not cleaned up (the validator deletes it in an `ensure`, so something interrupted that one compile). It was moved to `tmp/delete/`. If it shows up in a summary's git status again, the corpus's three-way parallelism is the first suspect; drop `-P 3` in `train-check.sh` for a serial run.
- The corpus takes about three minutes at three at a time instead of the serial ten or so.
- The exemption list is keyed on text. If an exempt line's wording changes, its entry stops matching and the line becomes an ERROR again, which is the point: a changed line has a new key and no audio yet.
