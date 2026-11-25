# Cleanup tool review, round 2

**Verdict: not clean.** 1 blocker, 2 majors, 9 minors. Most round 1 findings are closed. The blocker is round 1's B1 coming back in a narrower form: the "whole number" check depends on the locale, so a non-ASCII digit gets through and turns a guard off again. The majors are two new gaps. First, roots are not checked against Claude session scratch or other repos. Second, the busy check is skipped when a root is reached through a symlink, and safe-rm has no busy check at all.

Reviewed: fix commit 837f38255 on `ops-follow2` (worktree `/data/be-ops-follow`), against round 1 (`docs/agents/CLEANUP_TOOL_REVIEW.md`). Files: `tools/clean-lib.sh`, `tools/wt-clean.sh`, `tools/disk-clean.sh`, `tools/safe-rm.sh`, `tools/clean.conf.example`, `test/js/disk-clean.test.mjs` and the AGENTS.md cleanup line. Reviewed 2026-11-25.

## What was run

- `bin/test-js test/js/disk-clean.test.mjs` with Node 22: 1 file passed, 0 failed.
- The real dry run, `tools/disk-clean.sh` from `/data/be-ops-follow`, with no flags. It used `/home/deploy/.config/break-escape/clean.conf`, which matches `tools/clean.local.conf` line for line. Results:
  - All five lanes were kept by the keep list.
  - The checkout, be-ops-follow and be-ops-logs were skipped as busy for logs and leftovers.
  - It would trim three `test.log` files to their last 10 MB (832, 329 and 797 MB).
  - It would remove dead playtest pids and pipes and stopped keyless logs in be-ops-build, be-ops-core and be-ops-skin.
  - It kept train34 and train35. Scratch and tmpdirs found nothing.
  - Only `/data` is covered, which closes round 1 minor 6. It would free 2.0 GB.
- I built a temp tree under my scratchpad: a repo, worktrees outside it, a nested worktree under `.claude/worktrees`, train, scratch and mktemp roots, and test logs. I set `HOME`, `XDG_CONFIG_HOME`, `TMPDIR` and `CLEAN_CONF` to the temp tree. Every attack below ran there. `--apply` ran only there. It removed exactly the dry-run list, skipped the scratch folder a process was working in, and deleted no branches.
- To test roots under `/tmp/claude-*` and `$HOME`, I ran `safe-rm --dry-run` with the real HOME and an empty settings file. Nothing was deleted.

## Round 1 findings

| R1 | Status | Evidence |
|---|---|---|
| B1 numeric guard | **Reopened (narrower)** | ASCII typos are refused: `x`, `''`, `2d`, `' 3'`, `'3 '`, `03`, `-1`, `1e3`, `0x10`, `1+1`, `a[$(touch pwn)]`, `$(touch pwn)`, `9999999999` and `0`. Each of the 9 numeric keys was tried through the env with disk-clean, wt-clean and safe-rm, and `x` and `''` also through the settings file. Every one gave exit 2 with nothing listed, and no injected command ran. But Unicode digits pass (blocker B1 below). |
| M1 roots unchecked | Closed for `/`, `$HOME`, the checkout and worktrees; **open for Claude scratch** (major M1 below) | Each of these stops the run with exit 2: `/`, `//`, `/.`, `$HOME`, `$HOME/`, `$HOME/../home`, a parent of the checkout, the checkout, `checkout/tools`, `.claude`, the worktree parent, a worktree, a path inside a worktree, a path inside the nested worktree, a symlink to `$HOME` and a symlink to a worktree. A root that contains a worktree whose path has a space is also refused. `clean_guard` refuses a path inside a worktree unless that worktree is the root. |
| M2 settings in a worktree | Closed | `~/.config/break-escape/clean.conf` is looked up before the checkout, and the real dry run used it. With no file there is a loud WARNING, and `--apply --if-low` refuses (covered by a test). `~/.config` is mode 700, so the group-writable file inside it is not reachable by others. |
| M3 keep list and busy | Closed, with new holes (major M2 below) | All lanes are on `CLEAN_KEEP`. A fresh `tmp/in-use` keeps a worktree. An open file descriptor now counts as busy: a worktree held only by an fd was skipped. |
| m1 whitespace | Closed | A worktree path with a space stays protected. A root whose path has a space is refused. |
| m2 glob loops | Closed, small remainder (minor m5) | `CLEAN_KEEP='be-*'` gives exit 2. The keep and glob loops run under `set -f`. |
| m3 leftovers vs tmp/pids | Closed | Leftovers touches only `tmp/*.pid` and `test/dummy/tmp/pids/*.pid`. |
| m4 logs in busy worktrees | Closed | Busy worktrees are skipped, and the last `CLEAN_LOG_KEEP_MB` is kept. |
| m5 AGENTS wording | Closed | |
| m6 `--if-low` and `/` | Closed here | Only `/data` is covered. See minor m6 for the gap between the code and its doc. |
| m7 tally file | Closed | Accepted only with `CLEAN_PARENT`, when the name is `clean-tally.*`, it is owned by the user and it is not a symlink. |
| m8 guard/rm race | Closed | `clean_rm_in_parent`: `cd -P`, then a check, then `rm -rf --one-file-system ./name`. |
| m9 git status failure | Closed | Both status calls skip the worktree on a non-zero exit. |
| m11 mktemp names | Closed | Mode 700 is now required. |

## Findings

### Blocker

**B1. The numeric check depends on the locale. A non-ASCII digit passes it and turns the age and keep-newest guards off again.** In `clean-lib.sh`, `[[ $_v =~ ^(0|[1-9][0-9]{0,8})$ ]]` uses a bracket range. With bash 5.0 under `en_GB.UTF-8` (the agents' locale here), `[0-9]` also matches `１` (fullwidth), `³` and `٣`. The value is then used in arithmetic or `[ -le ]`, where it is an error. In the temp tree:
- `CLEAN_WT_MIN_AGE_HOURS='１'`: wt-clean printed `syntax error: operand expected`, then `WOULD wb` for a worktree whose HEAD had moved 0 minutes earlier. Without the bad value the same worktree gives `SKIP wb (touched 0 min ago)`.
- `CLEAN_TRAIN_KEEP_NEWEST='１'`: `[: １: integer expression expected` on every folder, so every old train is listed and the newest are no longer kept.
- `CLEAN_SCRATCH_DAYS`, `CLEAN_LOG_*`, `CLEAN_LOW_PCT` set to `'１'`: the category aborts or misreads, and the run still exits 0.

This is the exact failure round 1 named, and the task's rule: a non-numeric value must stop the run, never be read as 0. It is less likely than an ASCII typo (it takes a paste or an IME), and cron's usual C locale would refuse it, but agent runs here are UTF-8.

**Fix:** put `export LC_ALL=C` at the top of `clean-lib.sh`. That also makes the tmpdirs suffix check exact. Or test with `case $_v in ''|*[!0123456789]*) bad;; esac` plus a length limit. Apply the same fix to the `--if-low` value check in disk-clean. Add `１` and `³` to the numeric test.

### Major

**M1. Roots are not checked against another session's scratch, or against other repos and the bulky folders on `/data`.** With the real HOME and an empty settings file, each of these roots was accepted:
- `CLEAN_RM_ROOTS=/tmp`
- `/tmp/claude-1002`
- `/tmp/claude-1002/-home-deploy-Hacktivity`

`safe-rm --dry-run /tmp/claude-1002/-home-deploy-Hacktivity/<another session>` then printed `WOULD rm`, with exit 0. As a scratch root, any of them would let disk-clean delete every session scratchpad untouched for N days. `~/SecGen` (local only, never pushed), `~/Hacktivity`, and the `$HOME` link targets `/data/hacktivity-videos`, `/data/HacktivityLabSheets` and `/data/.vagrant.d` are also accepted as roots. This takes a misconfiguration, like round 1's M1.

**Fix:** at load time, refuse a root that is, contains, or lies inside:
- `/tmp/claude-*` or `${TMPDIR:-/tmp}` itself
- the real target of any symlink in `$HOME` or `CLEAN_SYMLINK_DIRS`
- a git work tree: `git -C root rev-parse` succeeds, or the root holds a top-level `.git`

Optionally add `CLEAN_PROTECT_EXTRA`. Add tests.

**M2. The busy check has holes, and safe-rm has none.**
- **Symlinked root.** `cat_scratch`, `cat_train` and `cat_tmpdirs` pass `$root/name` to `clean_busy` without resolving it, but `/proc/*/cwd` and `fd` hold real paths. With `CLEAN_SCRATCH_ROOTS` set to a symlink to the scratch folder, two folders were listed as `WOULD rm`: `old1` (a process's cwd) and `old2` (a file held open). Through the real path, the same two are `SKIP (a process is working in it)`.
- **Running programs.** Only the cwd and fds are read. A running binary inside an old scratch folder, started with its cwd elsewhere, was listed (`old3`). `/proc/*/exe` and `/proc/*/maps` are not checked.
- **safe-rm.** `safe-rm` never calls `clean_busy`. `safe-rm --dry-run` on the folder a process was working in printed `WOULD rm`. With `CLEAN_TRAIN_ROOTS=/data/tmp` and `CLEAN_TMPDIR_ROOTS=/data/tmp`, any agent can safe-rm a running train's output folder or `/data/tmp/be_tts_local_backup` with no check.

**Fix:** have `clean_busy` resolve its argument (`realpath -e`). Read `exe` and `maps` paths in `clean_read_cwds`. Call `clean_busy` on the resolved path inside `clean_rm`, which also covers safe-rm. The logs and leftovers callers already skip busy worktrees, so this check adds nothing there. Add a test with a symlinked root and a process in the folder.

### Minor

1. **Logs and leftovers in a nested worktree are always refused.** In `.claude/worktrees/*`, the default worktree location, `clean_guard` refuses the file with "is inside protected worktree <checkout>". The file is under both the checkout and its own worktree, and the first match is compared with the root. With default settings, those logs are never trimmed. This fails safe. **Fix:** compare the root with the innermost worktree that contains the path.
2. **A stale `tmp/in-use` keeps a worktree forever.** After 24 hours the marker is an ignored file that is not in `SAFE`, so the worktree gives `SKIP (ignored file worth keeping: tmp/in-use)`. AGENTS.md says the marker is good for 24 hours. This fails safe. **Fix:** add `tmp/in-use$` to `SAFE`, or change the doc.
3. **Relative roots are accepted.** They are resolved against the caller's cwd at load time. disk-clean then does `cd /`, and its categories refuse paths that are not absolute, so this fails safe. safe-rm, though, resolves them against wherever it is run. **Fix:** require absolute roots.
4. **`CLEAN_TRAIN_GLOB` is not checked.** `*` would make the train category delete any entry in `/data/tmp` older than 2 days, other than the newest two, for example `be_tts_local_backup`. **Fix:** require a literal prefix and reject a bare `*`.
5. **The link loops in wt-clean still glob-expand.** `for l in $links` in the keep check and the unlink loop runs without `set -f`. A link whose name holds `*` would expand. Only dangling links are unlinked, so the risk is low.
6. **Volume coverage does not match its doc.** It uses every worktree except the checkout, while the disk-clean header says candidate worktrees. It is harmless on this machine.
7. **`clean_trim` writes the kept tail to `${TMPDIR:-/tmp}`, which is on the full `/`.** If it fails the result is FAIL with the log unchanged, so it is safe. Writing the tail beside the log on the same volume would be sturdier.
8. **There are two copies of the settings.** `~/.config/break-escape/clean.conf` and `/data/be-ops-follow/tools/clean.local.conf` are the same today but can drift. The worktree copy is used only when the `~/.config` file is missing. **Fix:** delete the worktree copy, or note that `~/.config` wins.
9. **Tests are missing** for non-ASCII digits, symlinked roots with a busy folder, safe-rm on a busy folder, and Claude scratch roots.

## What held (new code)

- The env and file order: the env wins through `declare -p`, and `eval` ran no injected code.
- `CLEAN_APPLY` from the env or the file is reset.
- `CLEAN_CONF` pointing at a missing file gives exit 1.
- `CLEAN_MAIN_BRANCH=` gives exit 2.
- `clean_rm_in_parent` removed only the named folder.
- `git worktree remove` is reached only for registered, landed, clean, idle worktrees.
- `--apply` in the temp tree matched the dry run exactly.
