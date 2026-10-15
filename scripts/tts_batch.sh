#!/usr/bin/env bash
# Run the TTS batch generator from the Hacktivity host Rails app.
# Usage:
#   ./scripts/tts_batch.sh                     # all scenarios
#   ./scripts/tts_batch.sh m02_ransomed_trust  # one scenario
#   ./scripts/tts_batch.sh cache_stats         # show cache statistics
#   ./scripts/tts_batch.sh clear_cache         # clear TTS cache

set -e

HACKTIVITY_DIR="/home/cliffe/Files/Projects/Code/Hacktivity"

if [ ! -d "$HACKTIVITY_DIR" ]; then
  echo "ERROR: Hacktivity app not found at $HACKTIVITY_DIR"
  exit 1
fi

cd "$HACKTIVITY_DIR"

case "${1:-}" in
  cache_stats)
    bundle exec rake break_escape:tts:cache_stats
    ;;
  clear_cache)
    bundle exec rake break_escape:tts:clear_cache
    ;;
  "")
    bundle exec rake break_escape:tts:batch_generate
    ;;
  *)
    bundle exec rake "break_escape:tts:batch_generate[$1]"
    ;;
esac
