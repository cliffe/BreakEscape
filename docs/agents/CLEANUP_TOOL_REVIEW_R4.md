# Cleanup tool review, round 4

**Verdict: clean.** 0 blockers, 0 majors, 6 minors. Every round 3 finding is closed or recorded, with evidence below. The R3 major is fixed: a root inside `$HOME`, `/root` or any `/home/*` is refused, so `~/.claude`, `~/.config` and `~/.ssh` stop the run with exit 2. The new tests fail on the old code and pass on the new. No new finding is above minor. Each minor needs a deliberate setting, a rare layout, or an owner-written file. They should be recorded as limits in the AGENTS.md cleanup line (list at the end).

Reviewed: fix commit 6f2889795 on `ops-follow2` (worktree `/data/be-ops-follow`), against round 3 (`docs/agents/CLEANUP_TOOL_REVIEW_R3.md`). Changed files: `tools/clean-lib.sh`, `test/js/disk-clean.test.mjs`, `tools/clean.conf.example` and the AGENTS.md cleanup line. `wt-clean.sh`, `disk-clean.sh` and `safe-rm.sh` were not changed, and I re-read them against the new library. Reviewed 2026-11-25, bash 5.0.17, locale `en_GB.UTF-8`.

## What was run

- **Tests.** `bin/test-js test/js/disk-clean.test.mjs` with Node 22.11 on PATH: 16 of 16 passed.
- **Tests before the fix.** I extracted `tools/` at e67855c44 into my scratchpad and ran the new test file against it. Tests 1 to 12 passed and the four new tests (13 to 16) failed. So the new tests catch M1 and minors 1 to 4.
- **The real dry run.** I ran `tools/disk-clean.sh` from `/` with no flags, using `~/.config/break-escape/clean.conf` (still identical to `tools/clean.local.conf`). Exit 0. The new home rule did not refuse any configured root (`/data/tmp`, `/data/tmp/scratch`).
  - All five lanes were kept by the keep list.
  - The checkout, be-ops-follow and be-ops-logs were skipped as busy. One be-ops-skin log and two keyless logs were skipped because they had been written 0 min ago.
  - It would trim two `test.log` files (832 MB and 329 MB). It would remove dead playtest pids and pipes and stopped keyless logs in be-ops-build and be-ops-core, plus one in be-ops-skin.
  - It kept train34 and train35. Scratch and tmpdirs found nothing. It would free 1.2 GB on `/data`.
- **Real HOME, dry run only.** I used `safe-rm --dry-run` with an empty `CLEAN_CONF` and a path that does not exist, so nothing could be deleted.
- **Temp tree.** I built a repo and roots in my scratchpad with `CLEAN_OWN_SCRATCH` naming it. For cases that need a root outside `/tmp/claude-*`, I used a small folder at `/data/tmp/scratch/r4-review-cleanup`, holding only empty folders and links. I left it there for the scratch category to collect. `--apply` ran only on the scratch category in my scratchpad tree. It removed exactly the three folders the dry run listed and refused the folder holding a checkout.

## Round 3 findings

| R3 | Status | Evidence |
|---|---|---|
| M1 roots inside HOME | **Closed** | Exit 2 with real HOME for each of these roots: `~/.claude`, `~/.claude/`, `~/.config`, `~/.ssh`, `~/.local/share` and `~/notes`. The spellings `//home/deploy/.claude`, `/home/./deploy/.claude` and `/home/deploy/../deploy/.ssh` also gave exit 2. So did `/home/secgen/x`, `/home/dev`, `/home/dev/x` and `/root/x`. With `HOME=/`, `HOME=` and `HOME=/nonexistent`, `~/.claude` was still refused through the `/home/*` rule. HOME link targets (`/data/hacktivity-videos/x`, `/data/.vagrant.d/boxes`) were still refused. `/data/tmp/scratch` was still accepted. |
| m1 locale from settings | Closed | `LANG`, `LANGUAGE` and every `LC_*` are unset after the file is sourced, and `LC_ALL=C` is set again. Test 14 runs the R3 case (`export LC_ALL=en_GB.UTF-8` with `CLEAN_WT_MIN_AGE_HOURS=１`): exit 2 and no `syntax error`. It fails on e67855c44. |
| m2 internal variables from env | Closed | `CLEAN_CWDS=`, `CLEAN_CWDS=/nothing`, `CLEAN_PROTECTED=`, `CLEAN_HOME=/zz`, `CLEAN_ROOTS_RESOLVED=/` and `CLEAN_APPLY=1` from the environment each still gave `REFUSED (a process is working in it)` for a folder a `sleep` was in. `CLEAN_CWDS=` with `CLEAN_APPLY=1` in the settings file gave the same refusal. `CLEAN_APPLY=1` with `CLEAN_CONF_USED=/x` and no settings file: disk-clean printed `DRY RUN` and the no-settings WARNING. |
| m3 trailing slash | Closed | `lnk`, `lnk/` and `lnk//` all gave `REFUSED (is a symlink)`. `lnk/.` is refused for its `.` component. A busy folder given as `u/` was refused as busy. |
| m4 nested checkout | Closed (to depth 4, documented) | A `.git` at `c/d/e/f/.git` gave `REFUSED (contains a git checkout)` from both safe-rm and disk-clean `--apply`. A `.git` at depth 5 (`dd/1/2/3/4/.git`) is listed as `WOULD rm`. This is the documented "up to 4 levels" limit. |
| m5 bulky `/data` folders | **Open (settings)** | `/data/backup`, `/data/footage` and `/data/video_out_archive` are still accepted as roots. `CLEAN_PROTECT_EXTRA` is not set in this machine's `clean.conf`. See minor 5. |
| m6 doc for `/tmp` | Closed | AGENTS.md and the example now say a root may lie inside `/tmp`, `/var/tmp` or `/home` but may not be or contain them, which matches the code. |
| m7 `CLEAN_OWN_SCRATCH` source | Closed | It is read only from the environment. A settings file naming my scratchpad, with a root inside it, gave `root ... is in Claude session scratch; name this session's scratchpad in CLEAN_OWN_SCRATCH` (exit 2). |

The other R3 case not tested in round 3, a symlink into another session's scratch, now has evidence. A root `/data/tmp/scratch/.../toother` linking to another session's `scratchpad` was refused, both with `CLEAN_OWN_SCRATCH` unset and with it set to mine.

## Findings

No blocker. No major.

### Minor

1. **Glob-disabling shell state removes the glob-built protections.** The link targets in `$HOME`, `/home/*`, the `/tmp/claude-*` "contains" check and the direct-child `.git` check are all built with globs. Three things turn globbing off: `SHELLOPTS=noglob` in the environment, or `set -f` or `GLOBIGNORE='*'` in the settings file. With a HOME link `vid -> $Q/vids`, the root `$Q/vids/x` was refused at baseline, but under each of those three it was accepted, and `safe-rm --dry-run $Q/vids/x/y` printed `WOULD rm`. `$HOME` itself, `/` and checkouts found through the parent `.git` walk stay protected, because those checks use no glob. Someone would have to set this on purpose, the same class as R3 minor 1. `nocasematch`, `BASHOPTS` and `GLOBIGNORE` from the environment made no difference. **Fix:** after the locale reset, run `set +f; unset GLOBIGNORE; shopt -u nocasematch nocaseglob dotglob failglob nullglob`. Or record it as a limit.
2. **The own-scratch exception skips every "lies inside" entry, not only home folders.** In `clean-lib.sh` lines 151 to 154, a root inside `CLEAN_OWN_SCRATCH` is allowed inside any `_clean_noroot` entry. That includes HOME link targets and `CLEAN_PROTECT_EXTRA` paths, though the comment only mentions home folders. In the temp tree, a HOME link pointing into my scratchpad did not stop a root under its target. This only matters when a protected path lies inside the session's own `/tmp/claude-*` scratchpad, which is unlikely. A candidate that is or contains the protected path is still refused by `clean_guard`. **Fix:** apply the exception only to the `$HOME` and `/home/*` entries, or record it.
3. **A bare git repository is not a "git checkout".** `scr/bare.git` (with `HEAD` and `refs/`, no `.git`) was removed by disk-clean `--apply` in the temp tree after 2 idle days. A bare clone in scratch holding unpushed commits would be lost. **Fix:** also refuse a folder that `git -C "$rp" rev-parse --is-bare-repository` reports as bare (or that holds `HEAD` with `objects/` and `refs/`). Or record it next to the depth-4 limit.
4. **"Another user's home" means only `/root` and `/home/*`.** `postgres` has its home at `/var/lib/postgresql`, which is accepted as a root. deploy cannot write there (`postgres 755`), so nothing can be lost. The AGENTS.md wording is still broader than the code. **Fix:** say "`/root` or any `/home/*` folder".
5. **Bulky `/data` folders are still unprotected (carried from R3 minor 5).** `/data/backup`, `/data/footage` and `/data/video_out_archive` are owned by deploy and accepted as roots. A typo in a root could select them. **Fix:** a settings change, not code: add them to `CLEAN_PROTECT_EXTRA` in `~/.config/break-escape/clean.conf` and `tools/clean.local.conf`.
6. **The refusal message names the wrong kind of path.** A root inside a HOME link target or a `CLEAN_PROTECT_EXTRA` path prints `is inside protected /data/hacktivity-videos ($HOME or a home folder)`. The run still stops correctly. **Fix:** say "a protected path ($HOME, a home folder, a HOME link target or CLEAN_PROTECT_EXTRA)".

Limits that are already accepted and documented: a checkout deeper than 4 levels is not seen. The settings file is sourced as shell, so its owner can do anything; for example, `realpath(){ ...; }` in the file changes what the checks see. My test of this was refused only by chance.

## What held

- The `/home/*` rule makes the real home safe even when `HOME` is wrong, empty or `/`.
- `realpath -m` turns `//home`, `/./` and `..` spellings into the canonical path before every comparison.
- The `CLEAN_OWN_SCRATCH` value must resolve to `/tmp/claude-*/.../scratchpad`. A root that is a link to my own scratchpad was refused (it contains the temp repo), and a link to another session's scratchpad was refused.
- `CLEAN_APPLY` is set to 0 after both the settings file and the environment are read, so only `--apply` (or safe-rm without `--dry-run`) can delete.
- The `find -xdev -maxdepth 4` nested-checkout check matches `rm --one-file-system`. Neither crosses a mount.
- `--apply` removed exactly what the dry run listed.

## Recorded limits to add to the AGENTS.md cleanup line

Write minors 1 to 4 and 6 as one sentence, or fix them: globbing must stay on; the own-scratch exception covers every protected path inside it; bare repositories and checkouts deeper than 4 levels are not seen; only `/root` and `/home/*` count as other users' homes. Minor 5 is a one-line change to this machine's settings.
