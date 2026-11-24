#!/usr/bin/env bash
# architect_voice_fx.sh: the Architect's trailer voice for the m07 60 s trailer (owner, 2026-11-24:
# "apply the Ghost recipe"). Same chain as m02's Ghost, variant B, run through
# tools/video/takes/m02/ghost_voice_fx.sh 'line' on the clean TTS clips (no game FX in them):
#   main -2.5 st formant preserved; sub-octave -12 st, formant -3, at -12 dB; 20% parallel drive;
#   12% chorus; one 55 ms slapback; darker tone. See that script's header for the whole chain.
#
# t13c_architect_call carries the game's 'voice-distortion' FX baked in. This script writes
# t13c_architect_call_fx.trimmed.mkv beside it: the picture stream-copied, the audio rebuilt as the
# take's own audio with the two trailer lines' windows silenced and the processed clean lines laid
# in at the clips' own places in the take (envelope cross-correlation on the log RMS, 5 ms steps):
#   call_trace  "Don't look for the trace. It isn't there."          clip t=0 at 15.600 s (r=0.89)
#   ending      "Four fires tonight, and only one of you. I set..."   clip t=0 at 37.242 s (r=0.93)
# Everything else (the ring 9.8-11.7, "I've read your file..." 24.0-32.8, game FX still on it) is
# the take's own audio. The take is silent (-87 dB or lower) at every window edge, so the hard
# mute does not click.
#
# Level: each processed line is set to its take line's integrated level (stereo) under that line's
# sample peak, so the edit's gain_db holds; the edit then trims gain_db to match the take line's
# ebur128 momentary max (as m02 v5 did; numbers in docs/video/logs/m07_VIDEO_LOG.md, v2).
#   call_trace take line (15.6 + 3.4 s): I -18.9 LUFS, sample peak -8.3 dBFS, M max -15.0
#   ending take line (37.24 + 7.1 s):   I -19.9 LUFS, sample peak -8.1 dBFS, M max -15.5
#
# Usage: architect_voice_fx.sh [takes_dir]     (default ~/video-takes-local/m07/takes)
# Audio-only encode, picture stream copy; runs under nice -n 19. Never touches tts_cache or game audio.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd); repo=$(cd "$here/../../../.." && pwd)
ghost=$repo/tools/video/takes/m02/ghost_voice_fx.sh
cache=$repo/tts_cache/m07_architects_gambit
[ -d "$cache" ] || cache=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tts_cache/m07_architects_gambit
TRACE_CLIP=${TRACE_CLIP:-$cache/1a24b995d6d8e6611ae6fb530b39137d.mp3}   # "Don't look for the trace. It isn't there."
FIRES_CLIP=${FIRES_CLIP:-$cache/410f1532c29f0d5ecc815ff2fc661dd1.mp3}   # "Four fires tonight, ..." (#delivery tagged)
TRACE_AT=${TRACE_AT:-15.600}; FIRES_AT=${FIRES_AT:-37.242}
TRACE_LUFS=${TRACE_LUFS:--18.9}; TRACE_PEAK=${TRACE_PEAK:-0.385}   # -8.3 dBFS
FIRES_LUFS=${FIRES_LUFS:--19.9}; FIRES_PEAK=${FIRES_PEAK:-0.394}   # -8.1 dBFS
# windows of the take's own audio replaced (start a little before the clip, end in the silence after)
MUTE=${MUTE:-"between(t,15.55,19.9)+between(t,37.19,46.3)"}

takes=${1:-$HOME/video-takes-local/m07/takes}
src=$takes/t13c_architect_call.trimmed.mkv; dst=$takes/t13c_architect_call_fx.trimmed.mkv
[ -f "$src" ] || { echo "no $src" >&2; exit 1; }
for c in "$TRACE_CLIP" "$FIRES_CLIP"; do [ -f "$c" ] || { echo "no clean clip $c" >&2; exit 1; }; done

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
CLEAN=$TRACE_CLIP TARGET_LUFS=$TRACE_LUFS PEAK=$TRACE_PEAK "$ghost" line "$tmp/trace.wav"
CLEAN=$FIRES_CLIP TARGET_LUFS=$FIRES_LUFS PEAK=$FIRES_PEAK "$ghost" line "$tmp/fires.wav"

ms() { python3 -c "import sys;print(round(float(sys.argv[1])*1000))" "$1"; }
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
nice -n 19 ffmpeg -v error -y -i "$src" -i "$tmp/trace.wav" -i "$tmp/fires.wav" -filter_complex \
  "[0:a]aresample=48000,aformat=channel_layouts=stereo,volume=0:enable='$MUTE'[orig];
   [1:a]adelay=delays=$(ms "$TRACE_AT"):all=1[l1];
   [2:a]adelay=delays=$(ms "$FIRES_AT"):all=1[l2];
   [orig][l1][l2]amix=inputs=3:normalize=0:duration=first,atrim=0:$dur,aformat=channel_layouts=stereo[a]" \
  -map 0:v -map '[a]' -c:v copy -c:a pcm_s16le -ar 48000 "$dst"
# copy the marks so the lint and srt see the same take
for x in markers.json; do [ -f "$takes/t13c_architect_call.trimmed.$x" ] && cp "$takes/t13c_architect_call.trimmed.$x" "$takes/t13c_architect_call_fx.trimmed.$x"; done
echo "wrote $dst"
