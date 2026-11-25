#!/bin/bash
# Remove landed worktrees (the user approved deleting them outright, 2026-11-15:
# parking them in tmp/delete filled the disk). Dry run unless --apply.
# Which worktrees it considers, the keep list and the age come from the
# machine's settings (tools/clean-lib.sh; tools/clean.conf.example): with no
# settings file, worktrees under <checkout>/.claude/worktrees, keeping
# p-9-2-h and p-train36-live.
# A worktree goes only if: its HEAD is in main, it has no changes other than
# untracked node_modules/.bundle, its HEAD has not moved for CLEAN_WT_MIN_AGE_HOURS
# (3 by default; git status rewrites index, so index mtime is useless), no server
# pid file (tmp/pids) or live pid file (test/dummy/tmp/pids, tools/playtest) or
# process (working directory or open file) is in it, no fresh tmp/in-use marker
# (touch it to say a session will come back), and it isn't on the keep list.
# It is also skipped if git-ignored files other than build and test clutter are
# present (for example tmp/pixellab art), so nothing worth keeping is lost.
# A worktree reached through a symlink (a glob in CLEAN_WORKTREE_GLOBS, or a link
# in CLEAN_SYMLINK_DIRS) is matched by its real path, and the link left dangling
# by the removal is removed too (the link only).
# Branches are never deleted (that needs the user's yes).
. "$(dirname "${BASH_SOURCE[0]}")/clean-lib.sh"
# Ignored paths that are safe to lose with the worktree, including the playtest
# clutter a train's live check leaves (server logs, per-game flag XML, pipes).
SAFE='^(\.bundle/|node_modules|log/|tmp/(cache|pids|sockets|storage)/|tmp/(restart|local_secret|development_secret)\.txt$|test/dummy/(log|tmp|storage)/|tmp/keyless-[0-9]+\.log$|tmp/in-use$|(tmp/delete/|tools/playtest/)([^/]+-flags-game[0-9]+\.xml|[0-9]+\.pid)$|(tmp/delete/|tools/playtest/)pipes-[0-9]+/|.*__pycache__/|coverage/)'
case "${1:-}" in --apply) CLEAN_APPLY=1;; ""|--dry-run) ;; *) echo "usage: $0 [--apply]" >&2; exit 2;; esac
cd "$CHECKOUT" || exit 1
now=$(date +%s)
min_age=$(( CLEAN_WT_MIN_AGE_HOURS * 3600 ))
clean_read_cwds

# Candidate worktrees: the real path of every glob match (a match may be a symlink).
shopt -s nullglob
declare -A CAND
set -f
for g in $CLEAN_WORKTREE_GLOBS; do
  set +f
  for m in $g; do r=$(realpath -e -- "$m" 2>/dev/null) && CAND[$r]=1; done
done
shopt -u nullglob

# links_to WT: symlinks in the link dirs, or matched by the globs, that point at WT.
links_to() {
  local d l g m
  { shopt -s nullglob
    for d in $CLEAN_SYMLINK_DIRS; do for l in "$d"/* "$d"/.[!.]*; do [ -L "$l" ] && echo "$l"; done; done
    set -f
    for g in $CLEAN_WORKTREE_GLOBS; do set +f; for m in $g; do [ -L "$m" ] && echo "$m"; done; set -f; done
    set +f; shopt -u nullglob
  } | sort -u | while read -r l; do [ "$(realpath -m -- "$l")" = "$1" ] && echo "$l"; done
}

while read -r wt; do
  [ -n "$wt" ] && [ "$wt" != "$CHECKOUT" ] && [ -n "${CAND[$wt]:-}" ] || continue
  n=$(basename "$wt")
  links=$(links_to "$wt")
  kept=
  set -f
  for k in $CLEAN_KEEP; do
    [ "$k" = "$n" ] && kept=1
    for l in $links; do [ "$k" = "$(basename "$l")" ] && kept=1; done
  done
  set +f
  if [ -n "$kept" ]; then echo "KEEP  $n (keep list)"; continue; fi
  if [ "$wt" = / ] || [ "$wt" = "$CLEAN_HOME" ]; then echo "SKIP  $n (protected path)"; continue; fi
  head=$(git -C "$wt" rev-parse HEAD 2>/dev/null) || { echo "SKIP  $n (no HEAD)"; continue; }
  if ! git merge-base --is-ancestor "$head" "$CLEAN_MAIN_BRANCH"; then echo "SKIP  $n (not in $CLEAN_MAIN_BRANCH)"; continue; fi
  st=$(git -C "$wt" status --porcelain) || { echo "SKIP  $n (git status failed)"; continue; }
  dirty=$(grep -vE '^\?\? (node_modules|\.bundle/?)$' <<<"$st")
  if [ -n "$dirty" ]; then echo "SKIP  $n (uncommitted changes)"; continue; fi
  if ls "$wt"/tmp/pids/*.pid >/dev/null 2>&1; then echo "SKIP  $n (server pid file)"; continue; fi
  live=
  for pf in "$wt"/test/dummy/tmp/pids/*.pid "$wt"/tools/playtest/*.pid; do clean_pid_alive "$pf" && live=$pf; done
  if [ -n "$live" ]; then echo "SKIP  $n (live pid file ${live#"$wt"/})"; continue; fi
  if clean_busy "$wt"; then echo "SKIP  $n (a process is working in it)"; continue; fi
  if clean_in_use "$wt"; then echo "SKIP  $n (in-use marker tmp/in-use is fresh)"; continue; fi
  gd=$(git -C "$wt" rev-parse --absolute-git-dir)
  age=$(( now - $(stat -c %Y "$gd/logs/HEAD" 2>/dev/null || echo "$now") ))
  if [ $age -lt $min_age ]; then echo "SKIP  $n (touched $((age/60)) min ago)"; continue; fi
  st=$(git -C "$wt" status --porcelain --ignored -uall 2>/dev/null) || { echo "SKIP  $n (git status failed)"; continue; }
  keep=$(sed -n 's/^!! //p' <<<"$st" | grep -vE "$SAFE" | head -1)
  if [ -n "$keep" ]; then echo "SKIP  $n (ignored file worth keeping: $keep)"; continue; fi
  kb=$(clean_kb "$wt"); vol=$(clean_vol "$wt")
  if [ "$CLEAN_APPLY" = 1 ]; then
    if git worktree remove --force "$wt" 2>/dev/null; then
      echo "REMOVED $n  $(clean_h "$kb")  $wt"; clean_tally "$vol" "$kb"
      set -f
      for l in $links; do
        if [ -L "$l" ] && [ ! -e "$l" ]; then rm -f -- "$l" && echo "UNLINKED  $l (dangling link to $n)"; fi
      done
      set +f
    else echo "FAIL  $n"; fi
  else
    echo "WOULD $n  $(clean_h "$kb")  $wt"; clean_tally "$vol" "$kb"
    set -f; for l in $links; do echo "WOULD unlink $l (link to $n)"; done; set +f
  fi
done <<<"$CLEAN_WORKTREES"

if [ -z "${CLEAN_PARENT:-}" ]; then
  echo "Worktrees: $([ "$CLEAN_APPLY" = 1 ] && echo freed || echo 'would free')"; clean_tally_summary
fi
