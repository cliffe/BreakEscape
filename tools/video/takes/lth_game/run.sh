#!/usr/bin/env bash
# run.sh <take id> : record one LTH game-trailer gap take. The stock run-take.sh needs a scenario folder named after the take folder, so this wrapper
# repeats its non-live branch for tools/video/takes/lth_game. Needs VIDEO_STATE_DIR and env-up.sh 97 first (video-takes skill Step 1); no render running.
# BE_PORT default 3187 (keyless server: tools/playtest/start-keyless-server.sh 3187). Output: $FOOTAGE_ROOT/lth_game/takes/<id>.*
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/../../../.." && pwd); cd "$ROOT"; export BE_ROOT=$ROOT
ID="${1:?take id}"; PORT="${BE_PORT:-3187}"; DISP="${BE_DISPLAY:-97}"
FOOTAGE_ROOT="${FOOTAGE_ROOT:-/data/footage}"; OUT="${FOOTAGE_ROOT:?}/lth_game/takes"; mkdir -p "$OUT"
case "$ID" in
  gap2_field_guide)  NG="--set briefing_played=true --set lockpicking_guide_offered=true" ;;
  gap3_flag_station|gap3_archive_key) NG="--start-room server_room --set briefing_played=true" ;;
  gap1_walkthrough)  NG="" ;;
  *) echo "unknown take $ID" >&2; exit 2 ;;
esac
TAKE="tools/video/takes/lth_game/$ID.mjs"
if [ "$ID" = gap1_walkthrough ]; then
  node tools/video/capture/record-take.mjs --no-game --display "$DISP" --out "$OUT/$ID" --take "$TAKE" --fps 30 --preset ultrafast --crf 14 --music 0 \
    > "$OUT/$ID.record.json" 2> "$OUT/$ID.record.err"; VOPT="--video-only"
else
  export LANG=C.UTF-8 LC_ALL=C.UTF-8; VOPT=""
  GID=$(PLAYTEST_PORT=$PORT tools/playtest/new-game.sh m01_first_contact $NG 2>&1 | tee "$OUT/$ID.newgame.log" | sed -n 's/^GAME_ID=//p')
  [ -n "$GID" ] || { echo "no game id, see $OUT/$ID.newgame.log" >&2; exit 3; }
  export GAME_ID=$GID; echo "game $GID"
  node tools/video/capture/record-take.mjs --display "$DISP" --url "http://127.0.0.1:$PORT/break_escape/games/$GID" --take "$TAKE" --out "$OUT/$ID" \
    --fps 30 --preset ultrafast --crf 14 --music 0 > "$OUT/$ID.record.json" 2> "$OUT/$ID.record.err"
fi
echo "record exit $?"
node tools/video/capture/check-take.mjs "$OUT/$ID.mkv" $VOPT > "$OUT/$ID.check.json" 2> "$OUT/$ID.check.err"; RC=$?
echo "check exit $RC"
[ $RC -eq 0 ] && rm -f "${OUT:?}/${ID:?}.mkv"
exit $RC
