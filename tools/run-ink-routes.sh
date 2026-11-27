#!/usr/bin/env bash
# Runs every scripts/ink_runtime_check/m*_routes/*.json route with that folder's route.js
# (one route per node call). Prints the full output of each failing route, then one summary line:
#   ink-routes exit N: X routes, Y failed
# and the failing route names after it. Exit 0 when none failed, else 1.
#   tools/run-ink-routes.sh [repo-root]
set -uo pipefail
ROOT="$(cd "${1:-$(dirname "$0")/..}" && pwd)" || exit 2
cd "$ROOT" || exit 2
total=0; failed=0; names=()
for dir in scripts/ink_runtime_check/m*_routes; do
  [ -f "$dir/route.js" ] || continue
  for r in "$dir"/*.json; do
    [ -f "$r" ] || continue
    total=$((total+1))
    if ! out="$(node "$dir/route.js" "$r" 2>&1)"; then
      failed=$((failed+1)); names+=("$r")
      echo "=== FAIL $r"; echo "$out" | grep -E 'FAIL|Error|\[result\]' | head -8
    fi
  done
done
rc=0; [ "$failed" -ne 0 ] && rc=1
echo "ink-routes exit $rc: $total routes, $failed failed"
for n in "${names[@]+"${names[@]}"}"; do echo "  failing: $n"; done
exit "$rc"
