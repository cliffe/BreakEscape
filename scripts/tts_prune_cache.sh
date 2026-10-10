#!/usr/bin/env bash
# Find (and optionally prune) cached TTS audio that no longer matches any line of
# dialogue. Thin wrapper over: bin/rails app:break_escape:tts:prune_cache
# Dry run by default: nothing is moved or deleted unless --apply or --delete is given.
#
# Usage:
#   scripts/tts_prune_cache.sh                         # dry run, all scenarios
#   scripts/tts_prune_cache.sh sis02_energy            # dry run, one scenario
#   scripts/tts_prune_cache.sh sis02_energy --apply    # move orphans to tmp/tts_pruned/<date>/
#   scripts/tts_prune_cache.sh sis02_energy --delete   # delete orphans permanently
#   scripts/tts_prune_cache.sh --unknown quota_test --apply   # prune a cache dir that matches no scenario
# Other flags: --certain-only, --verbose, --no-walk, --walk-time N

set -e
cd "$(dirname "$0")/.."

SCENARIO=""
while [ $# -gt 0 ]; do
  case "$1" in
    --apply) export APPLY=1 ;;
    --delete) export DELETE=1 ;;
    --unknown) shift; export UNKNOWN="$1" ;;
    --certain-only) export CERTAIN_ONLY=1 ;;
    --verbose) export VERBOSE=1 ;;
    --no-walk) export NO_WALK=1 ;;
    --walk-time) shift; export WALK_TIME="$1" ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; exit 2 ;;
    *) SCENARIO="$1" ;;
  esac
  shift
done

export BUNDLE_FORCE_RUBY_PLATFORM="${BUNDLE_FORCE_RUBY_PLATFORM:-true}"
export LANG="${LANG:-C.UTF-8}"

if [ -n "$SCENARIO" ]; then
  exec bin/rails "app:break_escape:tts:prune_cache[$SCENARIO]"
else
  exec bin/rails app:break_escape:tts:prune_cache
fi
