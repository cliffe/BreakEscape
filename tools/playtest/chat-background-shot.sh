#!/bin/bash
# Screenshot a person-chat conversation in a room, to see its chatBackground behind a portrait.
#
#   tools/playtest/chat-background-shot.sh <scenario> <out_dir> <room_id> [npc_id]
#
# Makes a fresh game on the keyless :3001 server, unlocks every room (unlock-all-rooms.rb),
# starts a headless session, loads <room_id> and puts the player in it. The NPC is npc_id, else
# the first person NPC whose room is <room_id>. If the room has no NPCs, any person NPC is
# borrowed and its live room (npc.roomId and its behaviour's roomId) is pointed at <room_id>
# in the page only; the script says so. The chat opens through the same call the engine uses
# for a click on an NPC (MinigameFramework.startMinigame('person-chat', ...)) with no
# background passed, so the room fallback (person-chat-background.js) is what is tested.
# Saves <out_dir>/<room_id>-chat.png and prints the background path the minigame resolved
# (BACKGROUND=none if it resolved nothing). The session is stopped at the end.
set -uo pipefail
cd "$(dirname "$0")/../.."
U="usage: chat-background-shot.sh <scenario> <out_dir> <room_id> [npc_id]"
SCEN=${1:?$U}; OUT=${2:?$U}; R=${3:?$U}; NPC=${4:-}
[[ "$R" =~ ^[A-Za-z0-9_]+$ && "$NPC" =~ ^[A-Za-z0-9_]*$ ]] || { echo "bad room or npc id"; exit 2; }
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

ev() { tools/playtest/cmd.sh "$GID" "{\"cmd\":\"eval\",\"fn\":$(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" | grep -oP '"result":"\K[^"]*'; }

# Hide the HUD (objectives, toasts, barks, buttons, inventory) so only the conversation shows.
ev '() => { if (!document.getElementById("shot-hide-hud")) { const st = document.createElement("style"); st.id = "shot-hide-hud"; st.textContent = ".objectives-panel, #notification-container, .notification, #npc-bark-container, .npc-interaction-prompt, .phone-access-button, #health-ui-container, #hud-info-label, #scenario-timer-display, #toggle-buttons-container, #music-widget-btn-anchor, #vm-controls-overlay, #inventory-container { display: none !important; }"; document.head.appendChild(st); } return 1; }' >/dev/null

# Load the room, put the player in it, pick the NPC (borrowing one if the room has none).
PICK=$(ev "async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const R = '$R', want = '$NPC'; if (!window.gameScenario.rooms[R]) return 'ERR no such room'; if (!window.rooms[R]) await window.loadRoom(R); const r = window.rooms[R]; if (!r) return 'ERR room not loaded'; const pl = window.player; pl.body.setVelocity(0, 0); pl.setPosition(r.position.x + r.map.widthInPixels / 2, r.position.y + r.map.heightInPixels / 2); const all = [...window.npcManager.npcs.values()].filter(n => n.npcType !== 'phone'); let n = want ? window.npcManager.getNPC(want) : all.find(x => x.roomId === R); let borrowed = false; if (!n) { if (want) return 'ERR npc not found: ' + want; n = all[0]; borrowed = true; } if (!n) return 'ERR no person npc'; if (borrowed || (want && n.roomId !== R)) { n.roomId = R; const b = window.npcBehaviorManager?.getBehavior?.(n.id); if (b) b.roomId = R; borrowed = true; } await wait(500); return (borrowed ? 'borrowed:' : 'own:') + n.id + ' playerRoom=' + window.currentPlayerRoom; }")
case "$PICK" in ERR*|"") echo "FAILED: $PICK"; exit 1;; esac
NID=${PICK#*:}; NID=${NID%% *}
BORROWED=0; [[ "$PICK" == borrowed:* ]] && BORROWED=1
if [ "${PICK%%:*}" = borrowed ]; then echo "NOTE: room $R has no NPC of its own; borrowed $NID and pointed its live room at $R (page only)"; else echo "NPC: $NID (in $R)"; fi
echo "$PICK"

# Open the chat the way interactions.js does, with no background param.
RES=$(ev "async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); if (window.MinigameFramework.currentMinigame) window.MinigameFramework.endMinigame(false); await wait(300); const n = window.npcManager.getNPC('$NID'); if ('$BORROWED' === '1') { n.roomId = '$R'; const b = window.npcBehaviorManager?.getBehavior?.(n.id); if (b) b.roomId = '$R'; } await window.MinigameFramework.startMinigame('person-chat', null, { npcId: '$NID', title: n.displayName || '$NID', disableClose: n.disableClose === true }); const mg = window.MinigameFramework.currentMinigame; if (!mg) return 'ERR minigame did not open'; const bg = mg.background || 'none'; let st = 'no-bg'; if (mg.background) { for (let i = 0; i < 40; i++) { const pr = mg.ui?.portraitRenderer; if (pr?.backgroundImage) { st = 'loaded'; break; } await wait(250); } if (st !== 'loaded') st = 'NOT-LOADED'; } await wait(2500); return bg + ' ' + st; }")
case "$RES" in ERR*|"") echo "FAILED: $RES"; exit 1;; esac
echo "BACKGROUND=${RES% *} ($(echo "${RES#* }"))"
tools/playtest/cmd.sh "$GID" "{\"cmd\":\"screenshot\",\"path\":\"$OUT/$R-chat.png\"}" >/dev/null
echo "SCREENSHOT=$OUT/$R-chat.png"
