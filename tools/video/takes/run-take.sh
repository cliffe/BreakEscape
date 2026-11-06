#!/usr/bin/env bash
# run-take.sh <mission> <take-id> ["<new-game flags>"] ["<record-take flags>"]
#   <mission> is a folder under tools/video/takes/ (m01, m02, sis01 ...) or a scenario id (m02_ransomed_trust).
# Creates a fresh game of that mission, records tools/video/takes/<mission>/<id>.mjs on display 97, checks it, deletes the raw .mkv on pass.
# Outputs in video_out/<mission>/takes/<id>.* . Requires VIDEO_STATE_DIR and env-up.sh 97. Missions: see mission.sh.
# Old form still works and means m01:  run-take.sh <take-id> ["<new-game flags>"] ["<record-take flags>"]
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
export LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true BE_DB_USER=root NODE_PATH=/opt/node-tools/node_modules
cd "$ROOT"
OUT="$ROOT/video_out/$KEY/takes"; mkdir -p "$OUT"
GID=$(PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb "$MISSION" $NG 2>&1 | tee "$OUT/$ID.newgame.log" | sed -n 's/^GAME_ID=//p')
[ -n "$GID" ] || { echo "no game id, see $OUT/$ID.newgame.log"; exit 3; }
echo "game $GID"
node tools/video/capture/record-take.mjs --display 97 --url "http://127.0.0.1:3001/break_escape/games/$GID" \
  --take "$TAKE" --out "$OUT/$ID" --fps 30 --preset ultrafast --crf 14 --music 0 $REC > "$OUT/$ID.record.json" 2> "$OUT/$ID.record.err"
echo "record exit $?"
VOPT=""; case "$REC" in *--title-take*) VOPT="--video-only";; esac
node tools/video/capture/check-take.mjs "$OUT/$ID.mkv" $VOPT > "$OUT/$ID.check.json" 2>"$OUT/$ID.check.err"; RC=$?
echo "check exit $RC"
node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1]));console.log(JSON.stringify({pass:c.pass,dropPct:c.dropPct,offStart:c.offsetStartMs,offEnd:c.offsetEndMs,mode:c.offsetMode,problems:c.problems,trim:c.trimmed&&c.trimmed.out,len:c.trimmed&&+(c.trimmed.toS-c.trimmed.fromS).toFixed(2)}))' "$OUT/$ID.check.json"
[ $RC -eq 0 ] && rm -f "$OUT/$ID.mkv"
exit $RC
