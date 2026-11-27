# Ops follow-up C: review R2 (delta)

Delta of fix commit 46ed7a057 over R1 (FOLLOW_C_R1.md). Node 22.11 at ~/.local/node-v22.11.0-linux-x64 (default node is v10 and cannot run the tests).

## R1-C1 closed
- `train-check.sh` now has `exec 9>"$TESTS_LOCK" || exit 2` (message names the file and TESTS_LOCK) and `flock 9 || exit 2`.
- `bin/test-js` on train-check-lock-path and playtest-session-capture: 2 files passed, 0 failed. This includes the two new tests (unopenable lock dir exits 2, openable exits 0; a stub `flock` that exits 1 exits 2 with "cannot take the lock").
- `TRAIN_CHECK_PRINT_LOCK=1 tools/playtest/train-check.sh /data/be-ops-follow /tmp/x 3999` printed `TESTS_LOCK=/home/deploy/BreakEscape/tmp/tests.lock` and `BUNDLE_PATH=...`, rc 0.
- `TRAIN_CHECK_LOCK_ONLY` sits inside the `!= none` branch, after both checks, so it cannot skip taking the lock. With `TESTS_LOCK=none` it is ignored (the train then runs, unlocked as before, with the warning).
- `bin/ops-golden-compare` is not inside any flock here (the script holds fd 9 only for the train run, unchanged).

## R1-C2 closed (JS side)
- New fixture `test/fixtures/files/recorder_tag_rows.jsonl` (9 rows) is rebuilt by the real `onResponse` in the new JS test, which fails on any drift and has an `UPDATE_RECORDER_TAGS=1` refresh. That test passed.
- Both Rails tests now look the tag up in the fixture by id and fail (flunk/assert) on a missing id instead of inventing one. Ids used in the tests (code_pc1, plain_pc, bay_pc, store_pc, lobby_cabinet; dana/farah/sparedesk/eli hashes) are all in the fixture.

## New findings
### R2-C1 (minor) a stray TRAIN_CHECK_LOCK_ONLY=1 makes a real train exit 0 having checked nothing
Evidence: `TESTS_LOCK=/tmp/claude-1002/r2.lock TRAIN_CHECK_LOCK_ONLY=1 tools/playtest/train-check.sh /data/be-ops-follow /tmp/claude-1002/o 3999` gave rc=0, no summary, no checks. The lock is not skipped, but a green exit with no work is a false pass if the variable leaks from an environment. Fix: print `LOCK_ONLY: lock held, no checks run` to stderr before that exit, or exit with a distinct code. Not a blocker; the switch is test-only and undocumented in the header.

## Rails tag tests
`RBENV_VERSION=2.7.8 bin/rails test` on recorder_tags_scanner_mfa_test.rb and recorder_tags_scanner_crack_test.rb (under the shared flock): 16 runs, 511 assertions, 0 failures, 0 errors, 0 skips.

## Verdict
clean (0 blockers, 0 majors, 1 minor)
