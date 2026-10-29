#!/usr/bin/env bash
# render.sh <edit.json> <aspect: 16:9|9:16|1:1> [--final]
# sync assets -> lint -> silent Remotion render -> audio mix -> two-pass loudnorm (-14 LUFS) -> mux -> .srt -> contact sheet.
# Everything runs under nice -n 19 with Remotion concurrency 1 (captures share this machine); BE_CONCURRENCY=2 raises it.
# Env: BE_VIDEO_SCRATCH (scratch dir), BE_RENDER_DIR (output dir), BE_CONCURRENCY.
# Outputs in video_out/m01/renders/<edit id>_<aspect>.{mp4,srt,contact.png}.
set -euo pipefail
EDIT=${1:?usage: render.sh <edit.json> <aspect> [--final]}; ASPECT=${2:?aspect 16:9|9:16|1:1}; FINAL=${3:-}
HERE=$(cd "$(dirname "$0")" && pwd); REPO=$(cd "$HERE/../../.." && pwd)
EDIT=$(cd "$(dirname "$EDIT")" && pwd)/$(basename "$EDIT")
case "$ASPECT" in 16:9|9:16|1:1) ;; *) echo "bad aspect $ASPECT" >&2; exit 2;; esac
ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$EDIT','utf8')).id)")
TAG=${ID}_${ASPECT/:/x}
OUT=${BE_RENDER_DIR:-$REPO/video_out/m01/renders}; mkdir -p "$OUT"
SCR=${BE_VIDEO_SCRATCH:-${TMPDIR:-/tmp}/be-render-$$}; mkdir -p "$SCR"
N="nice -n 19"
cd "$HERE"
[ -d node_modules ] || { echo "run: nice -n 19 npm install" >&2; exit 1; }
echo "== sync";  $N node scripts/sync-assets.mjs
echo "== lint";  $N node scripts/lint-edit.mjs "$EDIT" $FINAL
echo "== render"; $N node scripts/render.mjs "$EDIT" "$ASPECT" "$SCR/$TAG.silent.mp4"
echo "== audio";  $N node scripts/mix-audio.mjs "$EDIT" "$SCR/$TAG.mix.wav"
$N node scripts/loudnorm.mjs "$SCR/$TAG.mix.wav" "$SCR/$TAG.norm.wav" "$(node -e "console.log(JSON.parse(require('fs').readFileSync('$EDIT','utf8')).audio.target_lufs)")" "$(node -e "console.log(JSON.parse(require('fs').readFileSync('$EDIT','utf8')).audio.true_peak ?? -1.5)")"
echo "== mux"
$N ffmpeg -v error -y -i "$SCR/$TAG.silent.mp4" -i "$SCR/$TAG.norm.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT/$TAG.mp4"
echo "== srt + contact sheet"
$N node scripts/make-srt.mjs "$EDIT" "$OUT/${ID}.srt"
# contact sheet: 30 frames spread over the whole video (1 per second for 30 s, 1 per 2 s for 60 s)
CFPS=$(node -e "console.log(Math.min(1, 30 / JSON.parse(require('fs').readFileSync('$EDIT','utf8')).length))")
$N ffmpeg -v error -y -i "$OUT/$TAG.mp4" -vf "fps=$CFPS,scale=384:-2:flags=neighbor,tile=6x5:padding=4:color=black" -frames:v 1 "$OUT/$TAG.contact.png"
echo "done: $OUT/$TAG.mp4"
rm -rf "$SCR"
