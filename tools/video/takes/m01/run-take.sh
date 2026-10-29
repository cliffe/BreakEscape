#!/usr/bin/env bash
# run-take.sh <take-id> "<new-game flags>" "<record-take flags>"
# Creates a fresh m01 game, records takes/m01/<id>.mjs on display 97, checks it, deletes the raw .mkv on pass.
# Outputs in video_out/m01/takes/<id>.* . Requires VIDEO_STATE_DIR and env-up.sh 97.
set -uo pipefail
ID="$1"; NG="${2:-}"; REC="${3:-}"
ROOT=/home/user/BreakEscape
export LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true BE_DB_USER=root NODE_PATH=/opt/node-tools/node_modules
cd "$ROOT"
OUT="$ROOT/video_out/m01/takes"; mkdir -p "$OUT"
GID=$(PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact $NG 2>&1 | tee "$OUT/$ID.newgame.log" | sed -n 's/^GAME_ID=//p')
[ -n "$GID" ] || { echo "no game id, see $OUT/$ID.newgame.log"; exit 3; }
echo "game $GID"
node tools/video/capture/record-take.mjs --display 97 --url "http://127.0.0.1:3001/break_escape/games/$GID" \
  --take "tools/video/takes/m01/$ID.mjs" --out "$OUT/$ID" --fps 30 --preset ultrafast --crf 14 --music 0 $REC > "$OUT/$ID.record.json" 2> "$OUT/$ID.record.err"
echo "record exit $?"
VOPT=""; case "$REC" in *--title-take*) VOPT="--video-only";; esac
node tools/video/capture/check-take.mjs "$OUT/$ID.mkv" $VOPT > "$OUT/$ID.check.json" 2>"$OUT/$ID.check.err"; RC=$?
echo "check exit $RC"
node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1]));console.log(JSON.stringify({pass:c.pass,dropPct:c.dropPct,offStart:c.offsetStartMs,offEnd:c.offsetEndMs,mode:c.offsetMode,problems:c.problems,trim:c.trimmed&&c.trimmed.out,len:c.trimmed&&+(c.trimmed.toS-c.trimmed.fromS).toFixed(2)}))' "$OUT/$ID.check.json"
[ $RC -eq 0 ] && rm -f "$OUT/$ID.mkv"
exit $RC
