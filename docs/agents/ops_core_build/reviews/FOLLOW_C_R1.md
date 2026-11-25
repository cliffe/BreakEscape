# Ops follow-up C: review R1

Reviewed commits 92dd74f90 (C1), 63f7c75f6 (C2), 1d1ac8acc (C3), 81cc3ea10 (C4) on `ops-follow1`.
Scope: tooling only. Verdict at the end.

## Findings

### R1-C1 (minor) A lock path that cannot be opened still lets the train run unlocked
Evidence: `tools/playtest/train-check.sh:94-96` runs `exec 9>"$TESTS_LOCK"` then `flock 9`, and the script has no `set -e`.
On this machine `bash -c 'exec 9>/nonexistent/dir/x.lock; echo CONTINUED rc=$?'` prints the redirection error and then `CONTINUED rc=1`, so the
script goes on; `flock 9` on a closed descriptor fails and nothing checks it. The same applies if the default `mkdir -p` at line 87 fails (read-only
`tmp/`) or `flock` is missing. The only trace is a line on stderr, none in `summary.txt`. The C1 work closed the git-detection hole but this
route to an unlocked train remains (it pre-dates C1; it is the "cannot silently run unlocked" test the owner set).
Fix, in `tools/playtest/train-check.sh`: write `exec 9>"$TESTS_LOCK" || { echo "cannot open lock $TESTS_LOCK: set TESTS_LOCK" >&2; exit 2; }` and
`flock 9 || exit 2`; add one case to `test/js/train-check-lock-path.test.mjs` only if the dry mode is taught to open the lock (otherwise leave
untested and say so in the build log).

### R1-C2 (minor) The C3 tests tag rows by hand, not through the recorder
Evidence: `test/controllers/break_escape/recorder_tags_scanner_mfa_test.rb` (`tagged`, copy['pc'] = ...) and
`recorder_tags_scanner_crack_test.rb` (overridden `post` writes `row['hash']`) build the tags in the test. The proof that the unchanged scanner
tolerates the tag is sound, but nothing ties the tag shape to what `response-capture.js` really writes. The shape is covered separately by
`test/js/playtest-session-capture.test.mjs` (deepEqual on `{ pcId }` and `{ hashId }`), so the gap is a shared-shape one only.
Fix: none required now. When the scanner stage reads the tags, add one test that feeds a JS-written capture line to the Ruby scanner.

## Checked and found sound
- C1 on this machine (git 2.25.1): `TRAIN_CHECK_PRINT_LOCK=1 tools/playtest/train-check.sh /data/be-ops-follow /tmp/x 3999` printed
  `TESTS_LOCK=/home/deploy/BreakEscape/tmp/tests.lock` and `BUNDLE_PATH=/home/deploy/BreakEscape/vendor/bundle`, rc 0.
- Fail closed: a non-git folder exits 2 with `cannot work out the main checkout from <wt>: set TESTS_LOCK`, stdout empty; the same with `TESTS_LOCK=`
  (empty counts as unset). A set `TESTS_LOCK` is used as given with no git call. A worktree sub-folder in a throwaway repo gave the right main checkout.
  `main_checkout` runs inside `$(...)` but both callers use `|| exit 2`, so the exit is not lost.
- `--path-format` no longer appears in the script; `bash -n` clean; dry mode exits before `exec 9>` and writes no lock (the `mkdir -p` is skipped).
  `node --test` on playtest-session-capture, train-check-lock-path and shell-x-check: 30 pass, 0 fail (the earlier "skipped 1" is the third file's own).
- C2 recorder: every new branch read. `pcTag`/`hashTag` return only `{pcId}`/`{hashId}` or `null`, take the id alone, cap it at 200, decline on
  `target_type`/`target_id` in the body and on query-named fields (decoded, `;` and `&` split), and never throw (body read and URL decode are in try).
  `onResponse` sets the key only on POST rows with the exact last segment, wraps each tag in try/catch to `null`, and the key is present-or-absent as
  specified. The test `C2 nothing but the id is written` plants username, password, credential, number and facts markers and finds none in the file.
- Key names: scanner `hand_tag_problem` (`access_leak_scanner.rb:338-345`) refuses only `login`; no row key `pc` or `hash` is read anywhere
  (grep of `row.key?`/`row['...']` found none). A test confirms no row carries `login` even when the body holds one.
- C3/C4: the scanner and `access-leak-check.rb` are byte for byte unchanged (`git diff 2d9e963c8..HEAD --stat` over both is empty). C4 text matches the code
  (null conditions, `pc` not `login`, `--signin`/`--logout`/`--resume` still needed). Build-log entry is append-only. Commit messages match their diffs.
- Not touched: `tools/wt-clean.sh`; no scenario, validator or game file changed by this track, so golden and validator output are unaffected by construction.

## Not run / pending
- The two C3 Rails files were queued behind the shared lock (16 waiters) and were not finished when this review was written; see the line below if updated.

## For the owner
None.

## Verdict
clean (0 blockers, 0 majors, 2 minors)
