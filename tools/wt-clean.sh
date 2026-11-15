#!/bin/bash
# Move landed worktrees into tmp/delete/worktrees. Dry run unless --apply.
# A worktree moves only if: its HEAD is in main, it has no changes other than
# untracked node_modules/.bundle, it HEAD has not moved for 3 hours (git status rewrites index, so index mtime is useless), and it isn't on the keep list.
# Branches are never deleted (that needs the user's yes).
R=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape
KEEP="p-9-2-h p-train36-live"
DEST=$R/tmp/delete/worktrees
APPLY=0; [ "$1" = "--apply" ] && APPLY=1
cd $R || exit 1
mkdir -p $DEST
now=$(date +%s)
git worktree list --porcelain | awk '/^worktree /{print $2}' | grep '/.claude/worktrees/' | while read -r wt; do
  n=$(basename "$wt")
  case " $KEEP " in *" $n "*) echo "KEEP  $n (keep list)"; continue;; esac
  head=$(git -C "$wt" rev-parse HEAD 2>/dev/null) || { echo "SKIP  $n (no HEAD)"; continue; }
  if ! git merge-base --is-ancestor "$head" main; then echo "SKIP  $n (not in main)"; continue; fi
  dirty=$(git -C "$wt" status --porcelain | grep -vE '^\?\? (node_modules|\.bundle/?)$')
  if [ -n "$dirty" ]; then echo "SKIP  $n (uncommitted changes)"; continue; fi
  if ls "$wt"/tmp/pids/*.pid >/dev/null 2>&1; then echo "SKIP  $n (server pid file)"; continue; fi
  if [ -n "$(for p in /proc/[0-9]*; do c=$(readlink $p/cwd 2>/dev/null); case "$c" in "$wt"|"$wt"/*) echo x;; esac; done | head -1)" ]; then echo "SKIP  $n (a process is working in it)"; continue; fi
  gd=$(git -C "$wt" rev-parse --git-dir)
  age=$(( now - $(stat -c %Y "$gd/logs/HEAD" 2>/dev/null || echo $now) ))
  if [ $age -lt 10800 ]; then echo "SKIP  $n (touched $((age/60)) min ago)"; continue; fi
  if [ $APPLY = 1 ]; then
    t=$DEST/$n; [ -e "$t" ] && t=$t-$(date +%s)
    if git worktree move "$wt" "$t" 2>/dev/null; then echo "MOVED $n"; else echo "FAIL  $n"; fi
  else echo "WOULD $n"; fi
done
