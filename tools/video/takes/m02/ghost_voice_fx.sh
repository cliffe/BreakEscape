#!/usr/bin/env bash
# ghost_voice_fx.sh: Ghost's trailer voice for the m02 60 s trailer (owner's recipe, 2026-11-24).
#
# The game's Ghost voice FX is baked into tts_cache (bake.py) and, in t17_ghost_call, was the run-time
# 'voice-distortion' (dry voice plus an octave layer, tts-manager.js). For the trailer the Money line is rebuilt from the clean TTS clip instead:
#   main voice  : rubberband pitch MAIN_ST semitones (MAIN_FORMANT: preserved or shifted)
#   sub layer   : -12 semitones with the formant moved SUB_FORMANT semitones, SUB_DB under the main
#                 (asetrate moves pitch and formant together by SUB_FORMANT, then rubberband with
#                 formant=preserved moves the pitch the rest of the way and restores the tempo)
#   bus         : parallel drive (gain, tanh soft clip, 300-3400 Hz phone band) at DRIVE_WET,
#                 optional bitcrush (acrusher) at CRUSH_WET,
#                 slow chorus at CHORUS_WET, one slapback tap at SLAP_MS (aecho, single tap, no feedback)
#   tone        : low shelf BASS_DB at 140 Hz, high shelf SHELF_DB from 3 kHz, low-pass LP_HZ, light
#                 compression (the recipe's 'darker': the clean TTS is brighter than the game's band-limited take)
#   level       : one static gain (ebur128 integrated) to TARGET_LUFS, the v4 take line's level, so the
#                 edit's gain_db for ghost_close still holds
#
# Usage:
#   ghost_voice_fx.sh line <out.wav>          processed line only (variants: set the env vars)
#   ghost_voice_fx.sh take [takes_dir]        writes <takes_dir>/t17_ghost_call_fx.trimmed.mkv:
#                                             t17's picture (stream copy) with the take's audio replaced
#                                             by the processed line at the clean clip's place in the take
# Defaults are the chosen chain (variant B). Runs under nice -n 19.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd); repo=$(cd "$here/../../../.." && pwd)
# The game bakes the FX into tts_cache/<scenario>/<key>.mp3 (tools/voice_fx/bake.py); the clean take is
# kept in clean/. Always read clean/, or the voice is processed twice. A clip with no clean/ copy is
# still unbaked (pre-bake checkout), so the top-level file is the clean take then.
key=ca91a93fd21bd742409fc49bce44296e
for d in "$repo" /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape; do
  c=$d/tts_cache/m02_ransomed_trust
  if [ -f "$c/clean/$key.mp3" ]; then CLEAN=${CLEAN:-$c/clean/$key.mp3}; break; fi
done
CLEAN=${CLEAN:-$repo/tts_cache/m02_ransomed_trust/$key.mp3}
[ -f "$CLEAN" ] || CLEAN=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tts_cache/m02_ransomed_trust/$key.mp3
MAIN_ST=${MAIN_ST:--2.5}; MAIN_FORMANT=${MAIN_FORMANT:-preserved}
SUB_FORMANT=${SUB_FORMANT:--3}; SUB_DB=${SUB_DB:--12}
DRIVE_WET=${DRIVE_WET:-0.20}; DRIVE_DB=${DRIVE_DB:-14}; CRUSH_WET=${CRUSH_WET:-0}; CRUSH_BITS=${CRUSH_BITS:-7}
CHORUS_WET=${CHORUS_WET:-0.12}; CHORUS_HZ=${CHORUS_HZ:-0.25}; CHORUS_MS=${CHORUS_MS:-2}
SLAP_MS=${SLAP_MS:-55}; SLAP_GAIN=${SLAP_GAIN:-0.28}
BASS_DB=${BASS_DB:-2}; SHELF_DB=${SHELF_DB:--4}; LP_HZ=${LP_HZ:-6000}   # tone: darker than the clean TTS, consonants kept
TARGET_LUFS=${TARGET_LUFS:--19.5}  # stereo; the v4 take's Money line (t17 19.0-24.05) measures -19.5 stereo, -22.5 mono
PEAK=${PEAK:-0.45}                  # sample-peak ceiling after the gain (about -7 dBFS, the v4 line's peak)
# the clean clip's t=0 sits at 18.948 s in t17_ghost_call.trimmed.mkv (envelope cross-correlation, r=0.78;
# voice onset 19.19 s in the take = 0.24 s into the clip)
OFFSET=${OFFSET:-18.948}

r() { python3 -c "import sys;print(f'{eval(sys.argv[1]):.6f}')" "$1"; }
main_p=$(r "2**($MAIN_ST/12)")
sf=$(r "2**($SUB_FORMANT/12)")                 # pitch+formant move from asetrate
sub_p=$(r "2**((-12-($SUB_FORMANT))/12)")       # the rest of the octave, formant preserved
sub_t=$(r "1/$sf")                              # undo asetrate's slow-down
sr_sub=$(r "48000*$sf")
dry=$(r "1-$DRIVE_WET-$CRUSH_WET")

graph() {
  cat <<EOF
[0:a]aresample=48000,aformat=channel_layouts=mono,apad=pad_dur=0.6,asplit=2[m0][s0];
[m0]rubberband=pitch=$main_p:formant=$MAIN_FORMANT:pitchq=quality:window=standard[main];
[s0]asetrate=$sr_sub,aresample=48000,rubberband=tempo=$sub_t:pitch=$sub_p:formant=preserved:pitchq=quality,volume=${SUB_DB}dB[sub];
[main][sub]amix=inputs=2:normalize=0:duration=first,asplit=3[bd][bw][bc];
[bw]highpass=f=300,volume=${DRIVE_DB}dB,asoftclip=type=tanh,volume=-${DRIVE_DB}dB,lowpass=f=3400,volume=4dB[wet];
[bc]acrusher=bits=$CRUSH_BITS:mode=log:mix=1:aa=0.6[crush];
[bd][wet][crush]amix=inputs=3:weights='$dry $DRIVE_WET $CRUSH_WET':normalize=0,
chorus=1:1:28:$CHORUS_WET:$CHORUS_HZ:$CHORUS_MS,
aecho=1:1:$SLAP_MS:$SLAP_GAIN,
highpass=f=45,lowshelf=f=140:g=$BASS_DB,highshelf=f=3000:g=$SHELF_DB,lowpass=f=$LP_HZ,acompressor=threshold=0.125:ratio=2.5:attack=5:release=120,aformat=channel_layouts=stereo[out]
EOF
}

line() {
  local out=$1
  local raw="$out.raw.wav"
  nice -n 19 ffmpeg -v error -y -i "$CLEAN" -filter_complex "$(graph)" -map '[out]' -ar 48000 -c:a pcm_f32le "$raw"
  local i; i=$(nice -n 19 ffmpeg -hide_banner -nostats -i "$raw" -af ebur128 -f null - 2>&1 | awk '/Integrated loudness/{f=1} f&&/ I:/{print $2; exit}')
  local g; g=$(r "$TARGET_LUFS-($i)")
  # gain, then a soft ceiling so the line's crest matches the take's; measure again and trim the gain once
  nice -n 19 ffmpeg -v error -y -i "$raw" -af "volume=${g}dB,alimiter=limit=$PEAK:level=false:attack=2:release=60" -c:a pcm_f32le "$raw.2.wav"
  local i2; i2=$(nice -n 19 ffmpeg -hide_banner -nostats -i "$raw.2.wav" -af ebur128 -f null - 2>&1 | awk '/Integrated loudness/{f=1} f&&/ I:/{print $2; exit}')
  local g2; g2=$(r "$TARGET_LUFS-($i2)")
  nice -n 19 ffmpeg -v error -y -i "$raw.2.wav" -af "volume=${g2}dB" -c:a pcm_s16le "$out"; rm -f "$raw" "$raw.2.wav"
  echo "line: $out (integrated $i LUFS, gain $g dB, then $g2 dB after the ceiling, to $TARGET_LUFS)" >&2
}

case "${1:-}" in
  line) line "$2" ;;
  take)
    takes=${2:-$HOME/video-takes-local/m02/takes}; src=$takes/t17_ghost_call.trimmed.mkv; dst=$takes/t17_ghost_call_fx.trimmed.mkv
    tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
    line "$tmp/line.wav"
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
    ms=$(r "round($OFFSET*1000)"); ms=${ms%.*}
    nice -n 19 ffmpeg -v error -y -i "$src" -i "$tmp/line.wav" -filter_complex \
      "[1:a]adelay=delays=$ms:all=1,apad,atrim=0:$dur,aformat=channel_layouts=stereo[a]" \
      -map 0:v -map '[a]' -c:v copy -c:a pcm_s16le -ar 48000 "$dst"
    # copy the marks so the lint and srt see the same take
    for x in markers.json; do [ -f "$takes/t17_ghost_call.trimmed.$x" ] && cp "$takes/t17_ghost_call.trimmed.$x" "$takes/t17_ghost_call_fx.trimmed.$x"; done
    echo "wrote $dst"
    ;;
  *) sed -n 2,22p "$0"; exit 2 ;;
esac
