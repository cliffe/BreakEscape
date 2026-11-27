#!/usr/bin/env bash
# render_preview.sh <epNN> : renders tools/video/edits/<epNN>_preview.json (made by make_preview_edit.py) to
# $BE_RENDER_DIR/<mission name>_preview.mp4: silent Remotion render (16:9), then a 0.4 s loop cross-fade (the end fades into
# the opening frames, so the tile does not jump when it restarts), 1280x720, H.264 CRF 30, no audio stream, faststart.
# Env as render.sh: BE_TAKES_DIR, BE_RENDER_DIR, BE_VIDEO_SCRATCH. Plan: docs/video/CA_PREVIEW_CUTS_PLAN.md.
set -euo pipefail
EP=${1:?usage: render_preview.sh <epNN>}
HERE=$(cd "$(dirname "$0")" && pwd); REPO=$(cd "$HERE/../../.." && pwd); R=$REPO/tools/video/remotion
EDIT=$REPO/tools/video/edits/${EP}_preview.json
NAME=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['preview_for'])" "$EDIT")
TAKES=${BE_TAKES_DIR:-$REPO/video_out/$EP/takes}; OUT=${BE_RENDER_DIR:-$REPO/video_out/$EP/renders}; mkdir -p "$OUT"
SCR=${BE_VIDEO_SCRATCH:-${TMPDIR:-/tmp}/be-preview-$$}; mkdir -p "$SCR"
N="nice -n 19"; X=0.4
cd "$R"
$N node scripts/sync-assets.mjs --takes-dir "$TAKES"
$N node scripts/lint-edit.mjs "$EDIT" --takes-dir "$TAKES"
$N node scripts/render.mjs "$EDIT" 16:9 "$SCR/${EP}_preview.silent.mp4"
L=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SCR/${EP}_preview.silent.mp4")
OFF=$(awk -v l="$L" -v x="$X" 'BEGIN{printf "%.3f", l-2*x}')
$N ffmpeg -nostdin -v error -y -i "$SCR/${EP}_preview.silent.mp4" -an -filter_complex \
  "[0:v]split[x][y];[x]trim=start=$X,setpts=PTS-STARTPTS[a];[y]trim=end=$X,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=$X:offset=$OFF,scale=1280:720:flags=lanczos,format=yuv420p[o]" \
  -map "[o]" -c:v libx264 -crf 30 -preset slow -movflags +faststart "$OUT/${NAME}_preview.mp4"
$N ffmpeg -nostdin -v error -y -i "$OUT/${NAME}_preview.mp4" -vf "fps=1,scale=320:-2,tile=5x4:padding=4:color=black" -frames:v 1 "$OUT/${NAME}_preview.contact.png"
echo "done: $OUT/${NAME}_preview.mp4 $(stat -c%s "$OUT/${NAME}_preview.mp4") bytes, $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/${NAME}_preview.mp4") s, audio streams: $(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$OUT/${NAME}_preview.mp4" | wc -l)"
