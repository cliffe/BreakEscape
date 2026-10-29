#!/usr/bin/env bash
# env-up.sh <n>: Xvfb :<n> (screen 1928x1088x24 by default, see BE_SCREEN; the game window and the capture are 1920x1080 at 0,0) + PulseAudio null sink be_rec_<n> (default sink).
# PIDs go to $VIDEO_STATE_DIR/env-<n>.pids. Reuses a running PulseAudio daemon.
set -euo pipefail
N="${1:?usage: env-up.sh <display-number>}"
: "${VIDEO_STATE_DIR:?set VIDEO_STATE_DIR}"
mkdir -p "$VIDEO_STATE_DIR"
PIDFILE="$VIDEO_STATE_DIR/env-$N.pids"
SINK="be_rec_$N"
# Chrome shrinks a window that is exactly screen-sized by 1 px each way (no window manager), so the X screen is a
# few pixels larger than the 1920x1080 window. The recorder grabs only the 1920x1080 area at 0,0.
SCREEN="${BE_SCREEN:-1928x1088}"
[ -s "$PIDFILE" ] && { echo "env $N already up? see $PIDFILE (run env-down.sh $N first)" >&2; exit 1; }
: > "$PIDFILE"

# Xvfb
if [ -e "/tmp/.X11-unix/X$N" ]; then echo "display :$N already in use" >&2; exit 1; fi
Xvfb ":$N" -screen 0 ${SCREEN}x24 -nolisten tcp >"$VIDEO_STATE_DIR/xvfb-$N.log" 2>&1 &
echo "xvfb $!" >> "$PIDFILE"
for _ in $(seq 1 50); do [ -e "/tmp/.X11-unix/X$N" ] && break; sleep 0.1; done
[ -e "/tmp/.X11-unix/X$N" ] || { echo "Xvfb did not start" >&2; exit 1; }

# PulseAudio: reuse if running, else start in user mode (allowed as root with --system=false)
if ! pactl info >/dev/null 2>&1; then
  pulseaudio --start --exit-idle-time=-1 --daemonize=yes --disallow-exit \
    --log-target=file:"$VIDEO_STATE_DIR/pulse.log" >/dev/null 2>&1 || true
  for _ in $(seq 1 50); do pactl info >/dev/null 2>&1 && break; sleep 0.2; done
  pactl info >/dev/null 2>&1 || { echo "PulseAudio did not start" >&2; exit 1; }
  # we started it, record its pid so env-down can stop it (only if no other env uses it)
  PAPID="$(cat "$HOME"/.config/pulse/*-runtime/pid 2>/dev/null | head -1 || true)"
  [ -n "$PAPID" ] || PAPID="$(pgrep -u "$(id -u)" -x pulseaudio | tail -1 || true)"
  [ -n "$PAPID" ] && echo "pulse $PAPID" >> "$PIDFILE"
fi
MOD="$(pactl load-module module-null-sink sink_name="$SINK" sink_properties=device.description="$SINK")"
echo "sinkmodule $MOD" >> "$PIDFILE"
pactl set-default-sink "$SINK"
echo "display=:$N sink=$SINK monitor=$SINK.monitor pidfile=$PIDFILE"
