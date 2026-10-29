#!/usr/bin/env bash
# Usage: tools/video/slideshow/make-slideshow.sh STILLS_DIR OUT.mp4 [options]
#   STILLS_DIR  folder of NN_name.png (1920x1080) plus optional captions.json
# Options (env or flags): see slideshow.py --help. Common:
#   MUSIC="path.mp3"  TITLE="Break Escape"  SUBTITLE="Mission 1: First Contact"
#   END1="Play Mission 1 free" END2="hacktivity.co.uk"  REVIEW=out_review.mp4  BURN=1 (captions on screen)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
STILLS="$1"; OUT="$2"; shift 2
WORK="${WORK:-$(mktemp -d)}"
MUSIC="${MUSIC:-$ROOT/public/break_escape/assets/music/Noir/Shadow In E Minor.mp3}"
args=(--out "$OUT" --music "$MUSIC" --font "$ROOT/public/break_escape/assets/fonts/PressStart2P-Regular.ttf" --work "$WORK"
  --title "${TITLE:-Break Escape}" --subtitle "${SUBTITLE:-Mission 1: First Contact}" --end1 "${END1:-Play Mission 1 free}" --end2 "${END2:-hacktivity.co.uk}")
[ -f "$STILLS/captions.json" ] && args+=(--captions "$STILLS/captions.json")
[ -n "${REVIEW:-}" ] && args+=(--review "$REVIEW")
[ -n "${BURN:-}" ] && args+=(--burn-captions)
exec python3 "$(dirname "$0")/slideshow.py" "$STILLS" "${args[@]}" "$@"
