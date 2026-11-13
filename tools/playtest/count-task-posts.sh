#!/usr/bin/env bash
# Counts task-completion requests in the keyless server log.
#
#   tools/playtest/count-task-posts.sh <game_id> [task_id] [log_file]
#
# Counts only POST requests to the exact path
#   /break_escape/games/<game_id>/objectives/tasks/<task_id>
# (config/routes.rb:39, GamesController#complete_task) that completed with 200.
# Ignored: PUT progress updates (:41), POST .../skip (:40), and requests that did
# not complete (422 refusals, 5xx errors the client retried).
#
# How it decides "completed with 200": Rails logs "Completed 200 OK" without the
# path, and the three Puma threads interleave their lines, so the status line
# cannot be matched to its request. complete_task logs
# "[BreakEscape] Task completed: <task_id>" only on the success path (the 200;
# failures log "Task completion failed" and answer 422, and an exception logs
# neither). Each "Started POST" on the exact path is queued, and each such
# marker takes the oldest queued request for the same task id. A repeat POST for
# an already-completed task also answers 200 and logs the marker, so it counts:
# that is how a double completion shows up. If two games complete the same task
# id in the same instant and one fails, their counts can swap; run one game at a
# time when this matters.
#
# start-keyless-server.sh truncates the log on each start, so a count only covers
# the current server. The server start time is printed with the count.
#
# Without task_id, prints one line per task id seen for the game.
set -euo pipefail

GAME="${1:-}"
TASK="${2:-}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG="${3:-$ROOT/tmp/keyless-3001.log}"
[ -n "$GAME" ] || { echo "usage: count-task-posts.sh <game_id> [task_id] [log_file]" >&2; exit 2; }
[ -f "$LOG" ] || { echo "no log at $LOG" >&2; exit 2; }

CLEAN="$(mktemp)"; trap 'rm -f "$CLEAN"' EXIT
# Strip colour codes; keep only the log from the last server boot.
sed 's/\x1b\[[0-9;]*m//g' "$LOG" | awk '/^=> Booting Puma/{n=0} {a[n++]=$0} END{for(i=0;i<n;i++)print a[i]}' > "$CLEAN"

PID="$(grep -m1 -E '^\*[[:space:]]+PID:' "$CLEAN" | sed -E 's/.*PID:[[:space:]]*//' || true)"
START=""
if [ -n "$PID" ] && ps -p "$PID" -o args= 2>/dev/null | grep -qiE 'puma|rails'; then
  START="$(ps -p "$PID" -o lstart= | sed 's/^ *//') (pid $PID, from ps)"
else
  FIRST="$(grep -m1 -oE 'at [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9:]+ [+-][0-9]{4}' "$CLEAN" | sed 's/^at //' || true)"
  START="not running now (log pid ${PID:-unknown}); first request in this log at ${FIRST:-none}"
fi
echo "server start: $START"
echo "log: $LOG"

awk -v game="$GAME" -v want="$TASK" '
  BEGIN { prefix = "Started POST \"/break_escape/games/" game "/objectives/tasks/" }
  index($0, prefix) == 1 {
    rest = substr($0, length(prefix) + 1)
    q = index(rest, "\"")
    if (q == 0) next
    t = substr(rest, 1, q - 1)
    if (t == "" || index(t, "/") || index(t, "?")) next    # /skip or odd path
    pend[t]++; next
  }
  /^\[BreakEscape\] Task completed: / {
    t = substr($0, length("[BreakEscape] Task completed: ") + 1)
    sub(/[ \t\r]+$/, "", t)
    if (pend[t] > 0) { pend[t]--; done[t]++; seen[t] = 1 }
    next
  }
  /^\[BreakEscape\] Task completion failed: / {
    t = substr($0, length("[BreakEscape] Task completion failed: ") + 1)
    sub(/ - .*$/, "", t)
    if (pend[t] > 0) { pend[t]--; failed[t]++; seen[t] = 1 }
    next
  }
  END {
    if (want != "") { printf "game %s task %s: %d completed POST(s) with 200\n", game, want, done[want] + 0; exit }
    n = 0
    for (t in seen) { printf "game %s task %s: %d completed POST(s) with 200 (%d refused)\n", game, t, done[t] + 0, failed[t] + 0; n++ }
    if (n == 0) printf "game %s: no task POSTs completed in this log\n", game
  }' "$CLEAN" | sort
