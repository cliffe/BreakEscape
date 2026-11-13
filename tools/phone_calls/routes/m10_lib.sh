#!/bin/bash
# M10 live helpers for m06 / m08 (source after setting PC_PORT, OUT). Reuses a2b_lib.sh.
export OUT=${OUT:-docs/agents/phone_calls/proofs/M10} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
# m10_open <label> <scenario> [new-game opts]
m10_open() {
  LABEL=$1; SCEN=$2; shift 2
  mkdir -p "$OUT"
  GID=$(tools/phone_calls/newgame.sh "$SCEN" "$@" | sed -n 's/^GAME_ID=//p')
  [ -n "$GID" ] || { echo "no game id" >&2; return 1; }
  echo "$GID" > "$OUT/${LABEL}_game_id.txt"
  tools/phone_calls/open.sh "$GID" "$OUT/${LABEL}_session.jsonl" "$OUT/${LABEL}_tts.jsonl" true >/dev/null
  echo "game $GID ($LABEL)"
}
gate() { "$@" || { echo "GATE FAILED: $*" >&2; a2b_quit; exit 1; }; }
open_phone() { $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; }
open_thread() { a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"$1\"]'); if(!c) return 'no contact $1'; c.click(); return 'opened $1';"; sleep 2; }
choose_text() { a2b_ev "const b=[...document.querySelectorAll('.choice-button')].find(x=>x.innerText.includes('$1')); if(!b) return 'no choice $1'; b.click(); return 'chose $1';"; }
wait_screen() { for i in $(seq 1 ${2:-30}); do a2b_ev "return $1;" | grep -qx true && return 0; sleep 1; done; return 1; }
IN_CALL="!!document.getElementById('call-end-button')"
screen() { a2b_ev "const bar=document.getElementById('call-status-bar'); const subs=[...document.querySelectorAll('.call-subtitle')].map(s=>s.innerText.replace(/\n+/g,' ')); const choices=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); const hb=document.querySelector('.call-button'); const m=document.querySelector('.messages-container'); return {bar: bar?bar.innerText.replace(/\n+/g,' | '):null, subs, choices, header: hb?hb.innerText.trim():null, thread: m?m.innerText.replace(/\n+/g,' | ').slice(-500):null};"; }
mgc() { a2b_ev "const m=window.MinigameFramework.currentMinigame; return m ? (m.constructor.name+' '+(m._sceneType||'')) : null;"; }
ending_overlay() { a2b_ev "const o=document.getElementById('ending-check-overlay'); return o ? o.innerText.replace(/\n+/g,' | ') : null;"; }
click_overlay() { a2b_ev "const b=[...document.querySelectorAll('#ending-check-overlay button')].find(x=>x.innerText.includes('$1')); if(!b) return 'no $1'; b.click(); return '$1';"; }
rows() { a2b_ev "const h=window.npcManager.getConversationHistory('$1')||[]; return h.filter(m=>m.type==='call').map(m=>m.text);"; }
glob() { a2b_ev "return window.gameState.globalVariables['$1'];"; }
tts_log() { echo "/tts requests: $(jq -c '[.npc_id // .npcId, .text]' "$OUT/${LABEL}_tts.jsonl" 2>/dev/null | tr '\n' ' ')"; }
reload() {
  a2b_ev "await window.stateSync.sync(); return true;" >/dev/null; sleep 1
  $S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
  sleep 8
  $S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null
}
# press_when <substring> [secs]: wait until a choice button holds the text, let the line settle (3 s), press it once
# and wait for the choice list to change. No apostrophes in the text.
press_when() {
  local has; has="[...document.querySelectorAll('.choice-button')].some(x=>x.innerText.includes('$1'))"
  gate wait_screen "$has" ${2:-40}
  sleep 3
  choose_text "$1" >/dev/null
  for n in 1 2 3 4 5 6 7 8; do sleep 1; a2b_ev "return $has;" | grep -qx true || return 0; done
  echo "choice $1 never took" >&2; return 1
}
