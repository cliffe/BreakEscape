#!/bin/bash
# Screenshot every room of a scenario with lighting, dark and lit, for review.
#
#   tools/playtest/lighting-tour.sh <scenario> <out_dir> [room_id ...] [--player <room>:<tx>,<ty>:<facing> ...]
#
# Makes a fresh game on the keyless :3001 server, unlocks every room in that game
# (unlock-all-rooms.rb), starts a headless session, then for each room (default:
# all) loads it, centres the camera on it and saves <out_dir>/<room>-a.png. A room
# whose lights are off also gets <room>-b.png with them switched on. The camera is
# moved directly and rooms are loaded from the console: this is a visual check,
# not a playtest. Prints the game id; the session is stopped at the end.
#
# --player (repeatable, optional): after the normal shots, switch <room> off, put the
# player on tile (tx,ty) of it facing up|down|left|right (or a diagonal), close any
# conversation/minigame that opens, and save <room>-player-dark.png (torch and player
# visible), then lights on and <room>-player-lit.png. Without it nothing changes.
#
# The HUD (objectives panel, toasts, barks, buttons, inventory) is hidden by CSS in the page
# before each shot, so it does not cover the room.
#
# Optional flags (none changes the default behaviour):
#   --close-intro          close an opening briefing/cutscene and the tutorial prompt before
#                          shooting. While either is open the scene is paused and the light map
#                          stops drawing, so every shot shows the briefing (m03).
#   --globals k=v[,k=v]    set scenario globals before any room is shot (values: true, false,
#                          numbers, or strings). Rooms with lighting "variants" and conditional
#                          emitters follow them, e.g. a night tour:
#                          --globals clone_call_done=true,mission_phase=act2_infiltration
#   --show-npc id[,id]     make hidden NPCs visible (night-only characters).
#   --restore-off          after a motion room's lit (-b) shot, switch it back off, so later
#                          shots of its neighbours show it as the player would find it.
#   --check                print the room's mode, variant, lit ambient and how recently the
#                          light map redrew, next to each room's on/off state.
set -uo pipefail
cd "$(dirname "$0")/../.."
SCEN=${1:?usage: lighting-tour.sh <scenario> <out_dir> [room ...] [--player room:tx,ty:facing ...] [--close-intro] [--globals k=v,...] [--show-npc id,...] [--restore-off] [--check]}
OUT=${2:?usage: lighting-tour.sh <scenario> <out_dir> [room ...] [--player room:tx,ty:facing ...] [--close-intro] [--globals k=v,...] [--show-npc id,...] [--restore-off] [--check]}
shift 2
PLAYERS=(); REST=(); CLOSE_INTRO=0; GLOBALS=""; SHOW_NPC=""; RESTORE_OFF=0; CHECK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --player)
      [[ "${2:-}" =~ ^[A-Za-z0-9_]+:[0-9]+,[0-9]+:[a-z-]+$ ]] || { echo "bad --player '${2:-}' (want room:tx,ty:facing)"; exit 2; }
      PLAYERS+=("$2"); shift 2 ;;
    --close-intro) CLOSE_INTRO=1; shift ;;
    --globals)
      [[ "${2:-}" =~ ^[A-Za-z0-9_]+=[A-Za-z0-9_.-]*(,[A-Za-z0-9_]+=[A-Za-z0-9_.-]*)*$ ]] || { echo "bad --globals '${2:-}' (want k=v,k=v)"; exit 2; }
      GLOBALS="$2"; shift 2 ;;
    --show-npc)
      [[ "${2:-}" =~ ^[A-Za-z0-9_]+(,[A-Za-z0-9_]+)*$ ]] || { echo "bad --show-npc '${2:-}'"; exit 2; }
      SHOW_NPC="$2"; shift 2 ;;
    --restore-off) RESTORE_OFF=1; shift ;;
    --check) CHECK=1; shift ;;
    *) REST+=("$1"); shift ;;
  esac
done
set -- ${REST[@]+"${REST[@]}"}
mkdir -p "$OUT"

tools/playtest/start-keyless-server.sh >/dev/null 2>&1
out=$(PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb "$SCEN" 2>&1)
GID=$(echo "$out" | grep -oP 'GAME_ID=\K\d+') || { echo "$out"; exit 1; }
FX=$(echo "$out" | grep -oP 'FLAGS_XML=\K.*')
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/unlock-all-rooms.rb "$GID" >/dev/null 2>&1
ARGS=(--url "http://127.0.0.1:3001/break_escape/games/$GID" --headless --log "$OUT/session-$GID.jsonl")
[ -n "$FX" ] && ARGS+=(--flags "$FX")
tools/playtest/session-start.sh "${ARGS[@]}" >/dev/null || { tools/playtest/session-stop.sh "$GID" >/dev/null 2>&1; exit 1; }
trap 'tools/playtest/session-stop.sh "$GID" >/dev/null 2>&1' EXIT
tools/playtest/cmd.sh "$GID" '{"cmd":"bootstrap","tutorial":"decline","resume":"new","autoBrief":true}' >/dev/null
echo "GAME_ID=$GID"

# Hide the HUD so it does not cover the room in screenshots: objectives panel, toast/notification
# popups (Agent HaX messages, "Task Complete"), NPC barks and prompts, health, timer, buttons,
# inventory. A <style> in the page; no game code changes. display:none, so toasts that appear
# later stay hidden too. Idempotent: called again before each room in case the page reloaded.
hide_hud() {
  tools/playtest/cmd.sh "$GID" '{"cmd":"eval","fn":"() => { if (!document.getElementById(\"shot-hide-hud\")) { const st = document.createElement(\"style\"); st.id = \"shot-hide-hud\"; st.textContent = \".objectives-panel, #notification-container, .notification, #npc-bark-container, .npc-interaction-prompt, .phone-access-button, #health-ui-container, #hud-info-label, #scenario-timer-display, #toggle-buttons-container, #music-widget-btn-anchor, #vm-controls-overlay, #inventory-container { display: none !important; }\"; document.head.appendChild(st); } return 1; }"}' >/dev/null
}
# --close-intro: the opening briefing (a person-chat) and then the tutorial prompt.
if [ "$CLOSE_INTRO" = 1 ]; then
  sleep 2
  for _ in 1 2; do
    tools/playtest/cmd.sh "$GID" '{"cmd":"eval","fn":"async () => { const w = ms => new Promise(r => setTimeout(r, ms)); for (let i = 0; i < 12; i++) { const b = [...document.querySelectorAll(\"button\")].find(x => x.offsetParent && /figure it out/i.test(x.textContent)); if (b) b.click(); const mg = window.MinigameFramework; if (mg && mg.currentMinigame) { try { mg.endMinigame(false); } catch (e) {} } await w(250); } return 1; }"}' >/dev/null
  done
fi
# --globals: k=v pairs into gameState.globalVariables (true/false/numbers parsed).
if [ -n "$GLOBALS" ]; then
  tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":\"() => { const g = window.gameState.globalVariables; for (const kv of '$GLOBALS'.split(',')) { const i = kv.indexOf('='); const k = kv.slice(0, i), v = kv.slice(i + 1); g[k] = v === 'true' ? true : v === 'false' ? false : (v !== '' && !isNaN(Number(v))) ? Number(v) : v; } return 1; }\"}" >/dev/null
  sleep 1
fi
hide_hud

if [ $# -eq 0 ]; then
  ROOMS=$(tools/playtest/cmd.sh "$GID" '{"cmd":"eval","fn":"() => Object.keys(window.gameScenario.rooms).join(\" \")"}' | grep -oP '"result":"\K[^"]*')
else
  ROOMS="$*"
fi

LIT=$(tools/playtest/cmd.sh "$GID" '{"cmd":"eval","fn":"() => !!window.lightingSystem"}' | grep -oP '"result":\K\w+')
[ "$LIT" = "true" ] || echo "WARNING: lighting is not active (scenario not opted in, or Canvas renderer)"

for R in $ROOMS; do
  hide_hud
  RES=$(tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":\"async () => { if (!window.rooms['$R']) await window.loadRoom('$R'); const r = window.rooms['$R']; if (!r) return 'not-loaded'; for (const id of '$SHOW_NPC'.split(',').filter(Boolean)) { const n = window.npcManager && window.npcManager.npcs.get(id); if (n && n._sprite) n._sprite.setVisible(true); } const cam = (window.lightingSystem?.scene || window.game).cameras.main; cam.stopFollow(); cam.centerOn(r.position.x + r.map.widthInPixels / 2, r.position.y + r.map.heightInPixels / 2); await new Promise(res => setTimeout(res, 400)); const s = window.lightingSystem?.rooms.get('$R'); return s ? (s.on ? 'on' : 'off') : 'no-lighting'; }\"}" | grep -oP '"result":"\K[^"]*')
  INFO=""
  if [ "$CHECK" = 1 ]; then
    INFO=" $(tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":\"async () => { const L = window.lightingSystem; if (!L) return 'no-lighting'; const t = L.lastDraw; await new Promise(res => setTimeout(res, 300)); const s = L.rooms.get('$R'); return s ? ('mode=' + s.mode + ' variant=' + s.variantIdx + ' lit=#' + s.litAmbient.toString(16) + ' redraw=' + Math.round(L.lastDraw - t) + 'ms') : 'unregistered'; }\"}" | grep -oP '"result":"\K[^"]*')"
  fi
  tools/playtest/cmd.sh "$GID" "{\"cmd\":\"screenshot\",\"path\":\"$OUT/$R-a.png\"}" >/dev/null
  if [ "$RES" = "off" ]; then
    tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":\"async () => { window.lightingSystem.switchOn('$R', { animate: false }); await new Promise(res => setTimeout(res, 300)); return 1; }\"}" >/dev/null
    tools/playtest/cmd.sh "$GID" "{\"cmd\":\"screenshot\",\"path\":\"$OUT/$R-b.png\"}" >/dev/null
    [ "$RESTORE_OFF" = 1 ] && tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":\"() => { window.lightingSystem.switchOff('$R'); return 1; }\"}" >/dev/null
  fi
  echo "$R: $RES$INFO"
done

# Player shots. updatePlayerRoom() runs every frame and derives currentPlayerRoom from the
# player's feet, so placing the sprite inside the room is what pins the current room.
# Entering fires the room's motion light and any entry conversation: close that, then
# force the room dark again before shooting.
for P in ${PLAYERS[@]+"${PLAYERS[@]}"}; do
  IFS=':' read -r R TXY FACE <<< "$P"
  TX=${TXY%,*}; TY=${TXY#*,}
  hide_hud
  RES=$(tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":\"async () => { const wait = ms => new Promise(res => setTimeout(res, ms)); if (!window.rooms['$R']) await window.loadRoom('$R'); const r = window.rooms['$R']; const pl = window.player; if (!r || !pl || !window.lightingSystem) return 'unavailable'; window.lightingSystem.switchOff('$R'); pl.body.setVelocity(0, 0); pl.setPosition(r.position.x + $TX * 32 + 16, r.position.y + $TY * 32 + 16); pl.direction = '$FACE'; pl.lastDirection = '$FACE'; try { const k = 'idle-' + ((!pl.scene.anims.exists('idle-left') && '$FACE'.endsWith('left')) ? '$FACE'.replace('left', 'right') : '$FACE'); if (pl.scene.anims.exists(k)) pl.anims.play(k, true); } catch (e) {} for (let i = 0; i < 6; i++) { await wait(250); if (window.MinigameFramework && window.MinigameFramework.currentMinigame) window.MinigameFramework.endMinigame(false); } window.lightingSystem.switchOff('$R'); const cam = window.lightingSystem.scene.cameras.main; cam.stopFollow(); cam.centerOn(r.position.x + r.map.widthInPixels / 2, r.position.y + r.map.heightInPixels / 2); await wait(600); return 'room=' + window.currentPlayerRoom + ' dir=' + pl.direction + ' on=' + window.lightingSystem.rooms.get('$R').on; }\"}" | grep -oP '"result":"\K[^"]*')
  tools/playtest/cmd.sh "$GID" "{\"cmd\":\"screenshot\",\"path\":\"$OUT/$R-player-dark.png\"}" >/dev/null
  tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":\"async () => { window.lightingSystem.switchOn('$R', { animate: false }); await new Promise(res => setTimeout(res, 400)); return 1; }\"}" >/dev/null
  tools/playtest/cmd.sh "$GID" "{\"cmd\":\"screenshot\",\"path\":\"$OUT/$R-player-lit.png\"}" >/dev/null
  echo "$R player ($TX,$TY,$FACE): $RES"
done
tools/playtest/session-stop.sh "$GID" >/dev/null
