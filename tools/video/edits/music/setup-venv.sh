#!/usr/bin/env bash
# One-line setup for analyse_music.py: BE_MUSIC_VENV=<scratch path outside BE_VIDEO_SCRATCH> tools/video/edits/music/setup-venv.sh
# then run: nice -n 19 "$BE_MUSIC_VENV/bin/python" tools/video/edits/music/analyse_music.py <out_dir> <track.mp3> ...
set -euo pipefail
: "${BE_MUSIC_VENV:?set BE_MUSIC_VENV to a scratch path (not BE_VIDEO_SCRATCH: render.sh deletes that)}"
python3 -m venv "$BE_MUSIC_VENV" && "$BE_MUSIC_VENV/bin/pip" install -q -r "$(dirname "$0")/requirements.txt" && echo "ready: $BE_MUSIC_VENV/bin/python"
