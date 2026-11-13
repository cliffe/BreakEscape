#!/usr/bin/env bash
# env-down.sh <n>: stop what env-up.sh <n> started, by recorded PID / module id only. No pkill.
set -uo pipefail
N="${1:?usage: env-down.sh <display-number>}"
: "${VIDEO_STATE_DIR:?set VIDEO_STATE_DIR}"
PIDFILE="$VIDEO_STATE_DIR/env-$N.pids"
[ -f "$PIDFILE" ] || { echo "no pidfile $PIDFILE"; exit 0; }
while read -r kind id; do
  case "$kind" in
    sinkmodule) pactl unload-module "$id" 2>/dev/null || true ;;
    xvfb) kill "$id" 2>/dev/null || true ;;
  esac
done < "$PIDFILE"
# Stop PulseAudio only if we started it and no other be_rec_ sink is still loaded
if grep -q '^pulse ' "$PIDFILE"; then
  if ! pactl list short sinks 2>/dev/null | grep -q 'be_rec_'; then
    kill "$(awk '/^pulse /{print $2}' "$PIDFILE")" 2>/dev/null || true
  fi
fi
rm -f "$PIDFILE" "/tmp/.X11-unix/X$N" "/tmp/.X$N-lock" 2>/dev/null
echo "env $N down"
