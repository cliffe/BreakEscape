#!/usr/bin/env bash
# run-take.sh <mission> <take-id> ["<new-game flags>"] ["<record-take flags>"]
#   <mission> is a folder under tools/video/takes/ (m01, m02, sis01 ...) or a scenario id (m02_ransomed_trust).
# Creates a fresh game of that mission, records tools/video/takes/<mission>/<id>.mjs on display 97, checks it, deletes the raw .mkv on pass.
# Outputs in video_out/<mission>/takes/<id>.* . Requires VIDEO_STATE_DIR and env-up.sh 97 (or BE_DISPLAY=<n>). Missions: see mission.sh.
# Old form still works and means m01:  run-take.sh <take-id> ["<new-game flags>"] ["<record-take flags>"]
#
# LIVE mode (the keyed dev Hacktivity server on :3000, so every voiced line plays, cached or not):
#   LIVE_URL=https://localhost:3000/hacktivities/<event>/play/mission/<game> STORAGE_STATE=<login.mjs state of that game's player> \
#   run-take.sh <mission> <take-id> "" ["<record-take flags>"]
# No new game is made (the new-game flags must be empty): the take drives that live game as it stands, so a take script must
# not finish the mission. record-take.mjs gets --live (https, notifyjs toasts hidden). BE_SWIFTSHADER defaults to 1 here.
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd); export BE_ROOT=$ROOT
. "$ROOT/tools/video/mission.sh"
K1=$(be_mission_key "${1:-}")
if [ $# -ge 2 ] && [ "$K1" != lib ] && [ -d "$ROOT/tools/video/takes/$K1" ]; then
  MISSION_ARG="$1"; shift
else
  MISSION_ARG=m01   # compatibility: the first argument is a take id
fi
[ $# -ge 1 ] || { sed -n 2,7p "$0"; exit 2; }
ID="$1"; NG="${2:-}"; REC="${3:-}"
KEY=$(be_mission_key "$MISSION_ARG"); MISSION=$(be_mission_id "$MISSION_ARG") || exit 2
TAKE="tools/video/takes/$KEY/$ID.mjs"
[ -f "$ROOT/$TAKE" ] || { echo "no take script $TAKE" >&2; exit 2; }
export LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true BE_DB_USER=root
# Playwright: the container's /opt/node-tools, else whatever NODE_PATH / node_modules already resolves it. Node 18+ is needed.
[ -d /opt/node-tools/node_modules ] && export NODE_PATH=/opt/node-tools/node_modules
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
[ "$NODE_MAJOR" -ge 18 ] || { [ -x "$HOME/.local/node/bin/node" ] && export PATH="$HOME/.local/node/bin:$PATH"; }
cd "$ROOT"
OUT="$ROOT/video_out/$KEY/takes"; mkdir -p "$OUT"
DISPLAY_N="${BE_DISPLAY:-97}"
if [ -n "${LIVE_URL:-}" ]; then
  [ -z "$NG" ] || { echo "LIVE_URL: no new game is made, so the new-game flags must be empty (got: $NG)" >&2; exit 2; }
  [ -n "${STORAGE_STATE:-}" ] && [ -f "$STORAGE_STATE" ] || { echo "LIVE_URL needs STORAGE_STATE=<login.mjs state file>" >&2; exit 2; }
  export BE_SWIFTSHADER="${BE_SWIFTSHADER:-1}"
  echo "live $LIVE_URL"
  node tools/video/capture/record-take.mjs --display "$DISPLAY_N" --live --url "$LIVE_URL" --storage-state "$STORAGE_STATE" \
    --take "$TAKE" --out "$OUT/$ID" --fps 30 --preset ultrafast --crf 14 --music 0 $REC > "$OUT/$ID.record.json" 2> "$OUT/$ID.record.err"
else
GID=$(PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb "$MISSION" $NG 2>&1 | tee "$OUT/$ID.newgame.log" | sed -n 's/^GAME_ID=//p')
[ -n "$GID" ] || { echo "no game id, see $OUT/$ID.newgame.log"; exit 3; }
echo "game $GID"
node tools/video/capture/record-take.mjs --display "$DISPLAY_N" --url "http://127.0.0.1:3001/break_escape/games/$GID" \
  --take "$TAKE" --out "$OUT/$ID" --fps 30 --preset ultrafast --crf 14 --music 0 $REC > "$OUT/$ID.record.json" 2> "$OUT/$ID.record.err"
fi
echo "record exit $?"
VOPT=""; case "$REC" in *--title-take*) VOPT="--video-only";; esac
node tools/video/capture/check-take.mjs "$OUT/$ID.mkv" $VOPT > "$OUT/$ID.check.json" 2>"$OUT/$ID.check.err"; RC=$?
echo "check exit $RC"
node -e 'const fs=require("fs");let c={pass:false,problems:["no check result (see .record.json / .check.err)"]};try{c=JSON.parse(fs.readFileSync(process.argv[1]))}catch(_){};let r={};try{r=JSON.parse(fs.readFileSync(process.argv[2]))}catch(_){};console.log(JSON.stringify({pass:c.pass,fullFrame:r.fullFrame,dropPct:c.dropPct,offStart:c.offsetStartMs,offEnd:c.offsetEndMs,mode:c.offsetMode,problems:c.problems,trim:c.trimmed&&c.trimmed.out,len:c.trimmed&&+(c.trimmed.toS-c.trimmed.fromS).toFixed(2)}))' "$OUT/$ID.check.json" "$OUT/$ID.record.json"
[ $RC -eq 0 ] && rm -f "$OUT/$ID.mkv"
exit $RC
