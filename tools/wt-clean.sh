#!/bin/bash
# Remove landed worktrees (the user approved deleting them outright, 2026-11-15:
# parking them in tmp/delete filled the disk). Dry run unless --apply.
# A worktree moves only if: its HEAD is in main, it has no changes other than
# untracked node_modules/.bundle, it HEAD has not moved for 3 hours (git status rewrites index, so index mtime is useless), and it isn't on the keep list.
# It is also skipped if git-ignored files other than build and test clutter are
# present (for example tmp/pixellab art), so nothing worth keeping is lost.
# Branches are never deleted (that needs the user's yes).
R=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape
KEEP="p-9-2-h p-train36-live"
# Ignored paths that are safe to lose with the worktree, including the playtest
# clutter a train's live check leaves (server logs, per-game flag XML, pipes).
SAFE='^(\.bundle/|node_modules|log/|tmp/(cache|pids|sockets|storage)/|tmp/(restart|local_secret|development_secret)\.txt$|test/dummy/(log|tmp|storage)/|tmp/keyless-[0-9]+\.log$|(tmp/delete/|tools/playtest/)([^/]+-flags-game[0-9]+\.xml|[0-9]+\.pid)$|(tmp/delete/|tools/playtest/)pipes-[0-9]+/|.*__pycache__/|coverage/)'
APPLY=0; [ "$1" = "--apply" ] && APPLY=1
cd $R || exit 1
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
  keep=$(git -C "$wt" status --porcelain --ignored -uall 2>/dev/null | sed -n 's/^!! //p' | grep -vE "$SAFE" | head -1)
  if [ -n "$keep" ]; then echo "SKIP  $n (ignored file worth keeping: $keep)"; continue; fi
  if [ $APPLY = 1 ]; then
    if git worktree remove --force "$wt" 2>/dev/null; then echo "REMOVED $n"; else echo "FAIL  $n"; fi
  else echo "WOULD $n"; fi
done
