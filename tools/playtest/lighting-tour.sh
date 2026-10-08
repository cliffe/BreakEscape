#!/bin/bash
# Screenshot every room of a scenario with lighting, dark and lit, for review.
#
#   tools/playtest/lighting-tour.sh <scenario> <out_dir> [room_id ...]
#
# Makes a fresh game on the keyless :3001 server, unlocks every room in that game
# (unlock-all-rooms.rb), starts a headless session, then for each room (default:
# all) loads it, centres the camera on it and saves <out_dir>/<room>-a.png. A room
# whose lights are off also gets <room>-b.png with them switched on. The camera is
# moved directly and rooms are loaded from the console: this is a visual check,
# not a playtest. Prints the game id; the session is stopped at the end.
set -uo pipefail
cd "$(dirname "$0")/../.."
SCEN=${1:?usage: lighting-tour.sh <scenario> <out_dir> [room ...]}
OUT=${2:?usage: lighting-tour.sh <scenario> <out_dir> [room ...]}
shift 2
mkdir -p "$OUT"

tools/playtest/start-keyless-server.sh >/dev/null 2>&1
out=$(PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb "$SCEN" 2>&1)
GID=$(echo "$out" | grep -oP 'GAME_ID=\K\d+') || { echo "$out"; exit 1; }
FX=$(echo "$out" | grep -oP 'FLAGS_XML=\K.*')
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/unlock-all-rooms.rb "$GID" >/dev/null 2>&1
ARGS=(--url "http://127.0.0.1:3001/break_escape/games/$GID" --headless --log "$OUT/session-$GID.jsonl")
[ -n "$FX" ] && ARGS+=(--flags "$FX")
tools/playtest/session-start.sh "${ARGS[@]}" >/dev/null || exit 1
tools/playtest/cmd.sh "$GID" '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}' >/dev/null
echo "GAME_ID=$GID"

if [ $# -eq 0 ]; then
  ROOMS=$(tools/playtest/cmd.sh "$GID" '{"cmd":"eval","fn":"() => Object.keys(window.gameScenario.rooms).join(\" \")"}' | grep -oP '"result":"\K[^"]*')
else
  ROOMS="$*"
fi

LIT=$(tools/playtest/cmd.sh "$GID" '{"cmd":"eval","fn":"() => !!window.lightingSystem"}' | grep -oP '"result":\K\w+')
[ "$LIT" = "true" ] || echo "WARNING: lighting is not active (scenario not opted in, or Canvas renderer)"

for R in $ROOMS; do
  RES=$(tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":\"async () => { if (!window.rooms['$R']) await window.loadRoom('$R'); const r = window.rooms['$R']; if (!r) return 'not-loaded'; const cam = (window.lightingSystem?.scene || window.game).cameras.main; cam.stopFollow(); cam.centerOn(r.position.x + r.map.widthInPixels / 2, r.position.y + r.map.heightInPixels / 2); await new Promise(res => setTimeout(res, 400)); const s = window.lightingSystem?.rooms.get('$R'); return s ? (s.on ? 'on' : 'off') : 'no-lighting'; }\"}" | grep -oP '"result":"\K[^"]*')
  tools/playtest/cmd.sh "$GID" "{\"cmd\":\"screenshot\",\"path\":\"$OUT/$R-a.png\"}" >/dev/null
  if [ "$RES" = "off" ]; then
    tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":\"async () => { window.lightingSystem.switchOn('$R', { animate: false }); await new Promise(res => setTimeout(res, 300)); return 1; }\"}" >/dev/null
    tools/playtest/cmd.sh "$GID" "{\"cmd\":\"screenshot\",\"path\":\"$OUT/$R-b.png\"}" >/dev/null
  fi
  echo "$R: $RES"
done
tools/playtest/session-stop.sh "$GID" >/dev/null
