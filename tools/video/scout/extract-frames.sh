#!/usr/bin/env bash
# extract-frames.sh <video> <out-dir> <t1> [t2 ...]   (times in seconds, in the video's own clock)
#   -> <out-dir>/f_<nn>_<t>.png at the video's full size (nearest-neighbour is only applied when SCALE=WxH is set, e.g. SCALE=1920x1080)
#      and <out-dir>/sheet.png, a numbered-by-order contact sheet (6 across, 384 px thumbnails).
# Window mode: extract-frames.sh <video> <out-dir> --window <start> <length> [fps]   (default 2 fps) takes frames over a window instead.
# For takes use video_out/<mission>/takes/<id>.trimmed.mkv (its times match the markers in <id>.trimmed.markers.json).
set -euo pipefail
V="${1:?video}"; O="${2:?out dir}"; shift 2; mkdir -p "$O"
VF=""; [ -n "${SCALE:-}" ] && VF="-vf scale=${SCALE/x/:}:flags=neighbor"
if [ "${1:-}" = "--window" ]; then
  S="${2:?start}"; L="${3:?length}"; F="${4:-2}"
  ffmpeg -v error -y -ss "$S" -t "$L" -i "$V" -vf "fps=$F${SCALE:+,scale=${SCALE/x/:}:flags=neighbor}" "$O/w_%03d.png"
else
  [ $# -ge 1 ] || { echo "give at least one time" >&2; exit 2; }
  i=0; for t in "$@"; do i=$((i+1)); ffmpeg -v error -y -ss "$t" -i "$V" -frames:v 1 $VF "$O/f_$(printf %02d $i)_$t.png"; done
fi
N=$(find "$O" -maxdepth 1 \( -name "f_*.png" -o -name "w_*.png" \) | wc -l)
ROWS=$(( (N + 5) / 6 ))
ffmpeg -v error -y -pattern_type glob -i "$O/[fw]_*.png" -vf "scale=384:-2:flags=neighbor,tile=6x${ROWS}:padding=4:color=black" -frames:v 1 "$O/sheet.png"
echo "$N frame(s) in $O, sheet $O/sheet.png"
