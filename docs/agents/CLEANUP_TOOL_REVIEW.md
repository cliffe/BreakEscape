# Cleanup tool review

**Verdict: not clean.** There is 1 blocker and 3 majors. The path guard itself holds: no `..`, symlink, relative path, empty root or unset root got a deletion outside a configured root. But a mistyped number in the settings turns off the age and keep-newest guards. The roots themselves are never checked. On this machine the settings file sits in a worktree, so the cron line would not use it.

Reviewed: 77bba9f6a and 9fdc6de7e on `ops-follow2`. Files: `tools/clean-lib.sh`, `tools/clean.conf.example`, `tools/wt-clean.sh`, `tools/disk-clean.sh`, `tools/safe-rm.sh`, `test/js/disk-clean.test.mjs` and the AGENTS.md line. Reviewed 2026-11-25.

## What was run

- `bin/test-js test/js/disk-clean.test.mjs` passes 3 of 3 with Node 22 (`PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH`). With the default `/usr/bin/node` (v10.19) the file fails with `SyntaxError` on `import test from 'node:test'`. The cause is the environment, not the code.
- I ran the real dry run, `tools/disk-clean.sh`, from `/data/be-ops-follow`. It picked up `/data/be-ops-follow/tools/clean.local.conf`. The run would:
  - remove `/data/be-ops-build` (3.0 GB) and unlink `~/be-ops-build`
  - empty three `test/dummy/log/test.log` files (842 MB, 1.5 GB and 807 MB)
  - remove stale playtest pids and pipes and keyless logs in be-ops-build, be-ops-core and be-ops-skin
  - keep train34 and train35
  - total: about 6.1 GB on /data

  It skipped be-ops-core (keep list), be-ops-follow (not in main), be-ops-logs (a process is in it) and be-ops-skin (uncommitted changes). Scratch and tmpdirs found nothing old enough.
- I never ran `--apply` on real folders. I ran `--apply` only in a temp repo with temp worktrees under my scratchpad. There, wt-clean removed only the eligible worktree and its dangling link. It kept these:
  - the keep-list worktree, matched through its link name
  - a worktree with a process's cwd inside it
  - a worktree with a live `test/dummy/tmp/pids` pid
  - a worktree with a `tmp/pids/server.pid`
  - dirty worktrees
  - a worktree whose HEAD moved recently
  - an outer worktree holding a nested worktree (git-ignored, so kept as "ignored file worth keeping")

  Branches were never deleted.
- Dry run side effects: I compared a file listing before and after a full dry run in the temp tree. Nothing was created or deleted. The only mtime changes were `git status` index refreshes under `.git/worktrees/*`, which is old behaviour. The tally temp file is removed on exit.

## Attacks that the guard held

All of these ran through `safe-rm --dry-run`, disk-clean or wt-clean in the temp tree:

- `..` in a path, or produced by a `CLEAN_TRAIN_GLOB='../*'`: refused (". or .. component").
- A relative path: refused.
- The final component is a symlink: refused.
- A symlinked middle directory pointing outside the root: refused ("resolves to ... outside the allowed roots").
- The root itself, with or without a trailing slash, and `//` inside a path: refused, or resolved to the same real path.
- No roots configured, or a root that is unset or missing: everything is refused (`safe-rm` exits 1).
- A worktree, the checkout or `$HOME` as the target: refused ("is or contains protected").
- A glob that matches nothing, or an empty `CLEAN_WORKTREE_GLOBS`: nothing is considered.
- `CLEAN_MAIN_BRANCH=` (empty): every worktree is skipped ("not in").
- An unknown argument to wt-clean (`--aply`): usage message, exit 2. The old script treated it as a dry run, so this is still safe.
- `CLEAN_APPLY` set in the environment or the settings file: reset to 0. Only the `--apply` flag turns it on.
- Worktree names with spaces or newlines: wt-clean drops them without a message. This fails safe, but see minor 1.
- A path under another session's Claude scratchpad (`/tmp/claude-*`): it is in no root unless someone configures one.

## Old wt-clean rules

Every old rule is kept:

- HEAD is in main
- nothing dirty except `node_modules` and `.bundle`
- the `tmp/pids/*.pid` file check
- the process-cwd check
- the HEAD reflog age check
- the ignored-file check against `SAFE`
- `git worktree remove --force` only
- no branch deletion
- the keep list

With no settings file, the candidates are the same as before: `<checkout>/.claude/worktrees/*`. New checks were added on top: live pid files under `test/dummy/tmp/pids` and `tools/playtest`, keep by link name, and no `/` or `$HOME`. The age is now a setting, which brings in the blocker below. One rule gets weaker when wt-clean runs together with disk-clean's leftovers category (see minor 3).

## Findings

### Blocker

**B1. A mistyped or empty number turns off the age and keep-newest guards, so fresh data gets deleted.** Bash arithmetic reads a word that is not a number as an unset variable, which counts as 0. In the temp tree:

- `CLEAN_SCRATCH_DAYS=abc` listed a scratch folder written seconds earlier as `WOULD rm`.
- `CLEAN_TRAIN_DAYS=x` listed every train folder, including the newest.
- `CLEAN_TRAIN_KEEP_NEWEST=two` made the check at `[ $i -le two ]` fail on every folder, so the newest two were no longer kept.
- `CLEAN_WT_MIN_AGE_HOURS=x`, or the same key set but empty, put a worktree whose HEAD had moved 0 minutes earlier into the would-remove list.
- `CLEAN_SCRATCH_DAYS=` or `2d` aborts the scratch category with a bash error, but the run still exits 0.

These values come from the environment as well as the settings file. With the suggested `*/30` cron line, one typo deletes, unattended, everything in the scratch and train roots that is not some process's cwd. The same arithmetic also runs `$(...)` hidden in a value such as `a[$(cmd)]`.

**Fix:** after the defaults in `clean-lib.sh`, check every numeric key against `^[0-9]+$`. For the age and day keys, also reject 0 unless an explicit override is set. If a check fails, stop the whole run before any category starts, with a non-zero exit. Add a test that sets each numeric key to `x` and to `''` and expects exit 2 with nothing listed.

### Major

**M1. Roots are never checked, and safe-rm can delete inside a worktree or the checkout.** `clean_guard` ignores a root only when it is `/` or `$HOME`. If a root is a parent of protected paths (for example `CLEAN_RM_ROOTS=/data` or `/home/deploy/..`), these are all allowed:

- `/data/footage`
- `/data/backup`
- `/data/video_out_archive`
- the contents of every worktree

The "protected" rule only blocks a path that *is or contains* a worktree. In the temp tree, root `$S` allowed `safe-rm $S/repo/tools`, which deletes the checkout's tracked files.

**Fix:**
- At load time, refuse any root that is, or contains, the checkout, a worktree or `$HOME`, and stop the run.
- In `clean_rm`, refuse a resolved path inside a worktree or the checkout unless the caller passed that worktree as the root. The logs and leftovers categories do pass it; safe-rm, scratch, train and tmpdirs never should.
- Optionally, keep an extra protected list (`CLEAN_PROTECT_EXTRA`) for `/data/footage` and the other folders listed above.

**M2. On this machine the settings live in a worktree, so the main checkout and the cron line run with the defaults.** The only `clean.local.conf` is `/data/be-ops-follow/tools/clean.local.conf`. `/home/deploy/BreakEscape/tools/clean.local.conf` does not exist. The lookup order is `$CLEAN_CONF`, then `<checkout>/tools/`, then the script's own directory. So `<checkout>/tools/disk-clean.sh`, which is what the AGENTS.md cron line runs, gets the defaults (`.claude/worktrees` only, plus logs). It reports `settings none (defaults)` and nothing more, so the automatic cleanup the user asked for would quietly do almost nothing. Running from a different worktree also gives different settings.

**Fix:**
- Move the file to `/home/deploy/BreakEscape/tools/clean.local.conf`, or better, to a path outside any checkout such as `~/.config/break-escape/clean.conf`, and look there first.
- Have disk-clean print a loud `WARNING: no settings file` line, and refuse `--apply --if-low` when no settings file was found.

**M3. The keep list and busy check do not fit how agents work here. The real dry run would delete lane `be-ops-build`.** The lanes `/data/be-ops-*` are long-lived and reused for new branches (ops-follow1 became ops-follow2), and they are linked from `$HOME`. Only `be-ops-core` is on the keep list. The dry run marks `/data/be-ops-build` (3.0 GB, branch `ops-helpdesk`) for removal.

"Busy" means only that some process's cwd is inside the worktree. Agents on this machine have their cwd reset between Bash calls and work through absolute paths, so an agent reading or testing in a lane usually does not count as busy. Nothing uncommitted is lost, because dirty worktrees are skipped. But with the cron running every 30 minutes, a lane that is landed and idle for 3 hours can be deleted under a session that is about to reuse it. The next builder then needs a new worktree and a new `node_modules`.

**Fix:**
- Put every live lane in `CLEAN_KEEP` (`be-ops-build be-ops-core be-ops-follow be-ops-logs be-ops-skin`), or keep `CLEAN_WORKTREE_GLOBS` to throwaway worktrees only.
- Honour an in-use marker file (for example `<wt>/tmp/in-use` with a pid or a timestamp under 24 hours old).
- Extend `clean_busy` to open file descriptors (`/proc/*/fd`) as well as the cwd.

### Minor

1. **Paths with spaces or newlines are skipped but not protected.** `CLEAN_PROTECTED` and `for w in $CLEAN_WORKTREES` split on whitespace. A worktree at `.../be-sp ace` is never cleaned, which is safe. But it is not protected either: `safe-rm ".../be-sp ace"` with a root above it would delete the whole worktree (confirmed in the dry run). **Fix:** keep the worktrees and protected paths in arrays or newline-separated lists, loop with `while IFS= read -r`, and refuse any configured root or worktree path that contains whitespace.
2. **Unquoted list loops glob-expand.** With `CLEAN_KEEP='*'` (meant as "keep everything"), the `*` expands to the file names in the checkout, so nothing is kept. In the temp tree, the dry run listed the keep-list worktree for removal. Roots and protected paths expand the same way, and the worktree glob is expanded twice (`for g in $GLOBS; for m in $g`). **Fix:** run `set -f` around the word loops and expand only the glob keys on purpose. Reject `*` in `CLEAN_KEEP`.
3. **Leftovers weakens the old pid-file rule.** The old rule was that any `tmp/pids/*.pid` keeps the worktree. The leftovers category deletes a dead `tmp/pids/server.pid`, so the next wt-clean run can remove that worktree. In the temp tree, the dry run lists be-srv's stale `server.pid` for removal. **Fix:** in leftovers, leave `tmp/pids/*.pid` alone in wt-clean candidates. Or state the change in AGENTS.md, since that rule existed to keep worktrees with a server.
4. **The logs category ignores busy and keep-list worktrees.** It would empty be-ops-logs' 1.5 GB `test.log`, although a process is working in that worktree. Logs are sometimes the evidence a count is taken from. **Fix:** skip busy worktrees, and keep the last 10 MB rather than emptying the file (`tail -c` into a temp file, then copy back).
5. **The AGENTS.md wording is slightly wrong.** It says that with no settings file "nothing else is deleted". The default categories include `logs`, which empties logs over 200 MB in every worktree and the checkout. **Fix:** reword the line.
6. **`--if-low 90` never limits anything here.** `/` is always about 93% full (it is not resizable) and counts as covered because the main checkout is on it. The cron would effectively run `--apply` every 30 minutes, even though cleaning `/data` frees nothing on `/`. **Fix:** count a volume only when a root or candidate worktree for the selected categories is on it, or document this.
7. **`CLEAN_TALLY_FILE` is read from the environment.** A value from outside gets "volume kb" lines appended to it. In the temp tree, a victim file got `/ 8`. **Fix:** accept it only when `CLEAN_PARENT` is set, or only when it is under `$TMPDIR` and named `clean-tally.*`.
8. **There is a race between `clean_guard` and `rm -rf`.** A middle directory swapped for a symlink in between would be followed. This is a low risk with one user. **Fix:** change into the parent with `cd -P`, check it again, then `rm -rf -- ./name`. Or accept the risk and note it.
9. **A failing `git status` counts as clean.** This is old behaviour. The dirty and ignored-file checks pipe `git status` into grep or sed, so if git errors the output is empty and the worktree passes. **Fix:** capture `git status` first and skip the worktree on a non-zero exit.
10. **`safe-rm` deletes by default.** This is fine for a tool meant to replace `rm`, and the header says so. Dry run is the default in wt-clean and disk-clean. No fix needed beyond keeping `--dry-run` in the AGENTS.md examples.
11. **Some mktemp names fall through.** The tmpdirs pattern skips mktemp suffixes made only of lowercase letters. It could also match a real folder such as `notes-2026q4` in a tmpdir root. Both risks are small in `/data/tmp`. **Fix:** document it, or also require a mode of `drwx------`, which mktemp folders have.
