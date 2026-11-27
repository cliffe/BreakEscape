# Cleanup tool review, round 3

**Verdict: not clean.** 0 blockers, 1 major, 7 minors. Every round 2 finding is closed, with evidence below. Round 2's blocker and both majors are fixed, and the new tests fail on the old code and pass on the new. One new major: a root that lies inside `$HOME` is still accepted, for example `~/.claude`, `~/.config` or `~/.ssh`. AGENTS.md and `clean.conf.example` both say such a root is refused. With the real HOME, `safe-rm --dry-run ~/.claude/projects` printed `WOULD rm 1.1GB`.

Reviewed: fix commit e67855c44 on `ops-follow2` (worktree `/data/be-ops-follow`), against round 2 (`docs/agents/CLEANUP_TOOL_REVIEW_R2.md`). Files: `tools/clean-lib.sh`, `tools/wt-clean.sh`, `tools/disk-clean.sh`, `tools/safe-rm.sh`, `tools/clean.conf.example`, `test/js/disk-clean.test.mjs` and the AGENTS.md cleanup line. Reviewed 2026-11-25, bash 5.0.17, locale `en_GB.UTF-8`.

## What was run

- `bin/test-js -v test/js/disk-clean.test.mjs` with Node 22.11 (`~/.local/node-v22.11.0-linux-x64`): 12 of 12 passed. The default `node` on PATH is v10, which cannot run the file, so the Node 22 PATH is needed.
- **Tests before the fix.** I extracted `tools/` at 837f38255 with `git archive` into my scratchpad and ran the new test file against it. Tests 1 to 8 passed, and tests 9 to 12 failed. So the new tests do catch B1, M1, M2 and the minors.
- **The real dry run.** I ran `tools/disk-clean.sh` from `/data/be-ops-follow` with no flags. It used `~/.config/break-escape/clean.conf`, which is still identical to `tools/clean.local.conf`. Results:
  - All five lanes were kept by the keep list.
  - The checkout, be-ops-follow, be-ops-logs and be-ops-skin were skipped as busy. be-ops-skin is newly busy, now that `exe` and `maps` are read.
  - It would trim two `test.log` files, 832 MB and 329 MB.
  - It would remove dead playtest pids and pipes and stopped keyless logs in be-ops-build and be-ops-core.
  - It kept train34 and train35. Scratch and tmpdirs found nothing.
  - Only `/data` is covered. It would free 1.2 GB.
- **Temp tree.** I built a repo, worktrees and roots under my own scratchpad, with `CLEAN_OWN_SCRATCH` naming it and `HOME`, `XDG_CONFIG_HOME` and `TMPDIR` pointing into the tree. `--apply` ran only there. It removed the two worktrees that the dry run listed, deleted no branches, and trimmed a log to its exact last 1 MB, with the temp file beside the log and cleaned up afterwards.
- **Roots against the real HOME.** I tested these with `safe-rm --dry-run`, an empty `CLEAN_CONF`, and paths that do not exist, apart from one dry-run listing of `~/.claude/projects`. Nothing was deleted.

## Round 2 findings

| R2 | Status | Evidence |
|---|---|---|
| B1 locale digits | **Closed** | Under `LC_ALL=en_GB.UTF-8`, `C.UTF-8` and unset, I set each of `CLEAN_WT_MIN_AGE_HOURS`, `CLEAN_TRAIN_KEEP_NEWEST` and `CLEAN_LOW_PCT` to `１`, `³`, `٣`, `1１`, `२`, `١٢`, `'1 '`, `1\n`, `00` and `+1`. Every run gave exit 2. `１` and `³` in the settings file gave exit 2. `--if-low` with `１`, `³`, `٣` or `9999` gave exit 2. One gap remains (minor 1). |
| M1 roots | **Closed for what R2 named**; new gap (major M1) | Refused with exit 2: `/tmp`, `/tmp/`, `/tmp/claude-1002`, `/tmp/claude-1002/<project>`, another session's folder and its scratchpad, my own scratchpad without `CLEAN_OWN_SCRATCH`, `~/SecGen`, `~/SecGen/lib`, `~/Hacktivity`, `/data/hacktivity-videos`, `/data/.vagrant.d/boxes`, `/data/HacktivityLabSheets`, `/var/tmp`, `/root`, `/home` and `/data`. With `CLEAN_OWN_SCRATCH` set, my scratchpad and folders inside it were accepted, and another session's scratchpad was refused. Relative roots were refused. A temp-HOME link target was refused. |
| M2 busy | **Closed** | With a symlinked scratch root, disk-clean skipped folders held as a cwd, by an open fd, by a running binary (`exe`), by an mmap, and by a binary in a folder whose name has a space. Only the idle folder was listed. `safe-rm --dry-run` refused each busy folder, by the real path and by the link path. |
| m1 nested worktree logs | Closed | The log in `<checkout>/.claude/worktrees/n1` was listed as `WOULD trim`. |
| m2 stale `tmp/in-use` | Closed | A marker 2 days old no longer keeps the worktree, and `--apply` removed it. |
| m3 relative roots | Closed | `CLEAN_RM_ROOTS=data/tmp` gave exit 2. |
| m4 train glob | Closed | `*`, `tr*`, `???*` and `a/b*` gave exit 2, and `train*` was accepted. |
| m5 link loops | Closed | Both link loops run under `set -f`. |
| m6 volume doc | Closed | The header now matches the code. |
| m7 trim temp file | Closed | strace showed `.clean-trim.XXXXXX` created in the log's folder. The kept tail's md5 matched. |
| m8 two settings copies | Closed (doc) | AGENTS.md and the example both say the `~/.config` file wins. Both copies still exist and are identical today. |
| m9 tests | Closed | Tests 9 to 12 were added, and they fail on 837f38255. |

## Findings

### Major

**M1. A root inside `$HOME` is accepted.** The code refuses `$HOME` itself and any root that contains it. It does not refuse a root that lies inside it. Nothing else in the check covers these folders: they hold no `.git`, and they are not symlink targets. With the real HOME and an empty settings file:
- `CLEAN_RM_ROOTS` set to each of `/home/deploy/.claude`, `.config`, `.ssh` and `.local` was accepted (exit 1 for a missing path, not exit 2).
- `safe-rm --dry-run /home/deploy/.claude/projects` printed `WOULD rm 1.1GB`. That folder holds every session's memory and transcripts.

The same happens in the temp tree for `$HOME/.claude` and `$HOME/.config`. With such a root in `CLEAN_SCRATCH_ROOTS`, disk-clean would delete everything in it that is older than N days. Links deeper in HOME are not protected either: a link at `$HOME/.local/share/bk` pointing to `/data/backup` was not treated as protected.

AGENTS.md says "a root that is, contains or lies inside … `$HOME` … stops the run with exit 2". The example settings say the same. So the stated contract is broken, which is the same misconfiguration class as round 2's M1.

**Fix:** move `$CLEAN_HOME` from the exact-or-contains test into `_clean_noroot` (is, contains or lies inside). Do the same for the other entries in `/home/*`. Keep the existing exceptions for `/data` roots reached only through HOME links: those are already link targets, so they are checked by their real path. Add a test with `~/.claude` and `~/.config` as roots.

### Minor

1. **A settings file that sets `LC_ALL` brings B1 back.** `export LC_ALL=C` runs before the settings file is sourced. A file holding `export LC_ALL=en_GB.UTF-8` and `CLEAN_WT_MIN_AGE_HOURS=１` gave `wt-clean.sh: line 27: １: syntax error` and exit 0. Only the owner writes this file, so the risk is low. **Fix:** set `LC_ALL=C` again after the `eval "$_clean_env"` line, and ignore `LC_*` and `LANG` from the file.
2. **Internal names are taken from the environment.** `compgen -v CLEAN_` restores every `CLEAN_*` variable, not only the settings.
   - `CLEAN_CWDS=` (empty) turns safe-rm's busy check off. disk-clean and wt-clean re-read it, but safe-rm only reads it when it is unset. `CLEAN_CWDS= safe-rm --dry-run <folder a process is in>` printed `WOULD rm`.
   - `CLEAN_CONF_USED=/x`, with no settings file, hides the WARNING and lets `--apply --if-low` run. I confirmed this in the temp tree.

   **Fix:** after the eval, unset `CLEAN_CWDS`, `CLEAN_RP` and `CLEAN_TALLY_OWNER`, and set `CLEAN_CONF_USED` after the eval, not before it. Better still, restore only the documented keys.
3. **A trailing slash gets past the symlink rule.** `[ -L "$p" ]` is false for `link/`. `safe-rm --dry-run scratch/lnk/`, where `lnk` points to `scratch/real`, printed `WOULD rm scratch/real`, the target. The target still has to pass every other guard: it must be inside a root, not protected and not busy. A link out of the root (`hl/` to HOME) was refused. **Fix:** strip trailing slashes before the `-L` test, or refuse a path that ends in `/`.
4. **A git checkout two or more levels inside a root is not seen.** The root check looks only at the root, its parents and its direct children. `clean_guard` looks only at `$rp/.git`. With root `data/tmp`, `safe-rm --dry-run data/tmp/c` listed a folder that holds a checkout at `c/d/e`. A scratch unit holding a clone with unpushed work would go once it is N days idle. **Fix:** refuse a candidate with `find "$rp" -xdev -maxdepth 4 -name .git -print -quit`, or document the limit.
5. **Bulky `/data` folders that no HOME link points to are accepted as roots.** `/data/backup`, `/data/footage` and `/data/video_out_archive` are not protected. A typo in a root could select them. **Fix:** add them to `CLEAN_PROTECT_EXTRA` in this machine's `clean.conf`. That is a settings change, not a code change.
6. **The docs say more than the code does for `/tmp`, `/var/tmp` and `/home`.** AGENTS.md and the example say a root may not lie inside `/tmp`. The code only refuses a root that is or contains `/tmp`, `/var/tmp`, `/root` or `/home/*`. `/tmp/foo-r3` and `/var/tmp/r3nx` were accepted. Accepting them is reasonable, since it is needed for `CLEAN_OWN_SCRATCH`, and under `/tmp` the user can only delete their own files. **Fix:** change the doc wording to match the code, after M1 is fixed for `$HOME`.
7. **`CLEAN_OWN_SCRATCH` is not tied to the running session.** Naming another session's scratchpad in it (`.../other/scratchpad`) makes that scratchpad an accepted root. This is a stated escape hatch and only applies when someone sets it, but it should never go in the shared `clean.conf`. **Fix:** say so in the example, or refuse it when it comes from the settings file rather than the environment.

Tests are missing for M1 and minors 1 to 4.

## What held (new code)

- `LC_ALL=C` is exported to child processes too. git, sort, df and numfmt output were unaffected in the real dry run.
- The busy scan leaves out only this script's own pid and subshell. disk-clean runs from `/`, so the caller's cwd does not hide anything.
- The `/tmp/claude-*` rule is checked against the resolved path (`realpath -m`). I read this in the code but did not test a symlink into another session's scratch.
- The parent `.git` walk caught `~/SecGen/lib`.
- `clean_trim` keeps exactly the last `KEEP_MB` and leaves no temp file behind.
- `--apply` in the temp tree removed exactly the worktrees the dry run listed, and no branch was deleted. The log trim the dry run listed for n1 did not happen because n1 had already been removed by the worktrees category, which is expected.
