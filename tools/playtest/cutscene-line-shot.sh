#!/bin/bash
# Screenshot the opening cutscene of a scenario at the first line matching a pattern, to see
# which background is behind it (e.g. after a Background[...] cut).
#
#   tools/playtest/cutscene-line-shot.sh <scenario> <out_dir> <regex> [name]
#
# Makes a fresh game on the keyless :3001 server, dismisses the start-up dialogs without
# bootstrap (which would skip the cutscene), steps the dialogue (continue, first choice)
# until the shown text matches <regex> (JavaScript, case-sensitive), hides the HUD and saves
# <out_dir>/<name or "cutscene">.png. Prints the background the portrait renderer is showing.
set -uo pipefail
cd "$(dirname "$0")/../.."
SCEN=${1:?usage: cutscene-line-shot.sh <scenario> <out_dir> <regex> [name]}
OUT=${2:?usage}; RX=${3:?usage}; NAME=${4:-cutscene}
mkdir -p "$OUT"

tools/playtest/start-keyless-server.sh >/dev/null 2>&1
out=$(PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb "$SCEN" 2>&1)
GID=$(echo "$out" | grep -oP 'GAME_ID=\K\d+') || { echo "$out"; exit 1; }
FX=$(echo "$out" | grep -oP 'FLAGS_XML=\K.*')
ARGS=(--url "http://127.0.0.1:3001/break_escape/games/$GID" --headless --log "$OUT/session-$GID.jsonl")
[ -n "$FX" ] && ARGS+=(--flags "$FX")
tools/playtest/session-start.sh "${ARGS[@]}" >/dev/null || { tools/playtest/session-stop.sh "$GID" >/dev/null 2>&1; exit 1; }
trap 'tools/playtest/session-stop.sh "$GID" >/dev/null 2>&1' EXIT
echo "GAME_ID=$GID"

ev() { tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":$(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" | grep -oP '"result":"\K[^"]*'; }
RXJ=$(printf '%s' "$RX" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

HIT=""
for i in $(seq 1 160); do
  R=$(ev "async () => { const T = window.__test; const s = T.getState(); const rx = new RegExp($RXJ);
    if (s.activeMinigame) { const d = T.minigame.getState()?.dialogue; const txt = JSON.stringify(d || {});
      if (rx.test(txt)) { const pr = window.MinigameFramework.currentMinigame?.ui?.portraitRenderer; return 'HIT ' + (pr?.backgroundPath || 'none'); }
      if (d && d.awaitingChoice) { T.minigame.choose(1); return 'choice'; }
      if (d && d.canContinue) { T.minigame.continue(); return 'cont'; }
      return 'wait'; }
    if (s.blockingUi) { const L = s.blockingUi.buttons.map(b => b.label); const t = s.blockingUi.text;
      let p = /tutorial/i.test(t + s.blockingUi.classes) ? L.find(l => /no|figure/i.test(l)) : (/RESUME SESSION/i.test(t) ? L.find(l => /new session/i.test(l)) : null);
      p = p || L.filter(l => !/load session/i.test(l))[0]; T.dismissBlockingUi(p); return 'dismiss'; }
    return 'idle'; }")
  case "$R" in HIT*) HIT=$R; break;; esac
  sleep 0.7
done
[ -z "$HIT" ] && { echo "FAILED: no line matched /$RX/"; exit 1; }
ev '() => { if (!document.getElementById("shot-hide-hud")) { const st = document.createElement("style"); st.id = "shot-hide-hud"; st.textContent = ".objectives-panel, #notification-container, .notification, #npc-bark-container, .npc-interaction-prompt, .phone-access-button, #health-ui-container, #hud-info-label, #scenario-timer-display, #toggle-buttons-container, #music-widget-btn-anchor, #vm-controls-overlay, #inventory-container { display: none !important; }"; document.head.appendChild(st); } return 1; }' >/dev/null
sleep 2.5
tools/playtest/cmd.sh "$GID" "{\"cmd\":\"screenshot\",\"path\":\"$OUT/$NAME.png\"}" >/dev/null
echo "BACKGROUND=${HIT#HIT }"
echo "SHOT=$OUT/$NAME.png"
