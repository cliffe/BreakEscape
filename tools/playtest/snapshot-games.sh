#!/bin/bash
# Make one throwaway game per scenario for the room snapshot (tools/playtest/room-snapshot.mjs),
# with every room unlocked so the client can load each one (loadRoom gets a 403 for a locked room).
#
#   tools/playtest/snapshot-games.sh <out.tsv> [all | name ...]
#
# Each game comes from tools/playtest/new-game.rb, then tools/playtest/unlock-all-rooms.rb, on the
# keyless :3001 setup. No db: tasks. Writes <out.tsv>: name, game id (0 when new-game.rb failed),
# room count, and "office" when a room has type room_office.
# Reuse the same TSV for every snapshot you mean to compare: the game row holds the rendered
# scenario, so two snapshots of the same games differ only by engine and room JSON changes.
set -uo pipefail
cd "$(dirname "$0")/../.."
OUT=${1:?usage: snapshot-games.sh <out.tsv> [all | name ...]}; shift
export PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true
if [ $# -eq 0 ] || [ "$1" = all ]; then
  mapfile -t NAMES < <(bin/rails runner 'puts BreakEscape::Mission.order(:name).pluck(:name)' 2>/dev/null)
else
  NAMES=("$@")
fi
: > "$OUT"
for n in "${NAMES[@]}"; do
  out=$(bin/rails runner tools/playtest/new-game.rb "$n" 2>&1)
  gid=$(echo "$out" | grep -oP 'GAME_ID=\K\d+')
  if [ -z "$gid" ]; then echo "FAILED $n: $(echo "$out" | tail -1 | cut -c1-160)" >&2; printf '%s\t0\t0\t\n' "$n" >> "$OUT"; continue; fi
  info=$(bin/rails runner "load 'tools/playtest/unlock-all-rooms.rb'; g = BreakEscape::Game.find($gid); puts \"INFO=#{g.scenario_data['rooms'].size} #{g.scenario_data['rooms'].values.any? { |r| r['type'] == 'room_office' } ? 'office' : '-'}\"" "$gid" 2>/dev/null | grep -oP 'INFO=\K.*')
  set -- $info
  printf '%s\t%s\t%s\t%s\n' "$n" "$gid" "${1:-0}" "$([ "${2:-}" = office ] && echo office)" >> "$OUT"
done
echo "games: $(awk -F'\t' '$2!=0' "$OUT" | wc -l) made, $(awk -F'\t' '$2==0' "$OUT" | wc -l) failed; office scenarios: $(awk -F'\t' '$4=="office"' "$OUT" | wc -l)"
