#!/bin/bash
# A5 R1 fix-round live proofs on test_phone_calls (m1, m2, m3).
#   PC_PORT=3025 tools/phone_calls/routes/a5r1_live.sh line_keep|line_end|button|caption
export OUT=${OUT:-docs/agents/phone_calls/proofs/A5_r1} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
wait_ring() { for i in $(seq 1 ${2:-60}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
calm_guard() { a2b_ev "window.gameState.globalVariables.guard_off = true; const m=window.MinigameFramework.currentMinigame; if (m && m._sceneType==='person-chat') window.MinigameFramework.endMinigame(false); return 'guard calm';" >/dev/null; }
clear_basic() { calm_guard; wait_ring caller_basic 40 && a2b_decline >/dev/null; sleep 1; }
gate() { "$@" || { echo "GATE FAILED: $*" >&2; a2b_quit; exit 1; }; }
open_phone() { $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; }
open_thread() { a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"$1\"]'); if(!c) return 'no contact $1'; c.click(); return 'opened $1';"; sleep 2; }
close_phone() { a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'phone closed';" >/dev/null; sleep 1; }
choose_text() { a2b_ev "const b=[...document.querySelectorAll('.choice-button')].find(x=>x.innerText.includes('$1')); if(!b) return 'no choice $1'; b.click(); return 'chose $1';"; }
wait_screen() { for i in $(seq 1 ${2:-30}); do a2b_ev "return $1;" | grep -qx true && return 0; sleep 1; done; return 1; }
screen() { a2b_ev "const bar=document.getElementById('call-status-bar'); const cap=document.getElementById('call-caption'); const choices=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); const btn=document.querySelector('.call-button'); const name=document.querySelector('.conversation-header .contact-name, .conversation-info')?.innerText; return {name, bar: bar?bar.innerText.replace(/\n+/g,' | '):null, caption: cap?cap.innerText:null, choices, callButton: btn?btn.innerText.trim():null};"; }
set_global() { a2b_ev "const m = await import('/break_escape/js/systems/apply-actions.js'); m.applyActions([{ type: 'set_global', key: '$1', value: $2 }], { source: 'proof' }); return '$1=$2';"; }
IN_CALL="!!document.getElementById('call-end-button') && !!document.querySelector('.choice-button')"
state() { a2b_ev "const o=window.npcManager.getNPC('desk_contact'); const h=window.npcManager.getConversationHistory('desk_contact')||[]; const m=window.MinigameFramework.currentMinigame; return {rows:h.filter(x=>x.type==='call').map(x=>x.text), currentKnot:o.currentKnot, ringer:(window.phoneRinger.current()||{}).state||null, open:m?m._sceneType:null, end_go:window.gameState.globalVariables.end_go, start_debrief:window.gameState.globalVariables.start_debrief_cutscene, closed:window.phoneRinger.isClosed()};"; }
case $1 in
line_keep|line_end)
  AUTOBRIEF=true a2b_open $1 --set ending_ok=true; gate clear_basic
  a2b_ev "window.__ev=[]; for (const n of ['conversation_closed:desk_contact','global_variable_changed:end_go','minigame_completed']) window.eventDispatcher.on(n, ()=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); return true;" >/dev/null
  open_phone; open_thread desk_contact
  choose_text "line-tag way" >/dev/null; gate wait_screen "$IN_CALL" 15; echo "line call: $(screen)"; a2b_shot call
  choose_text "On my way" >/dev/null; sleep 1.5
  echo "ending check: $(a2b_ev "const o=document.getElementById('ending-check-overlay'); return o ? o.innerText.replace(/\n+/g,' | ') : null;")"; a2b_shot ending_check
  echo "end_go while the question is up: $(state | jq -c .end_go)"
  if [ $1 = line_keep ]; then
    a2b_ev "const b=[...document.querySelectorAll('#ending-check-overlay button')].find(x=>x.innerText.includes('Keep going')); if(!b) return 'no keep'; b.click(); return 'Keep going';" >/dev/null; sleep 5
    echo "after Keep going: $(state | jq -c .) $(screen | jq -c '{bar,choices,caption}')"; a2b_shot kept_going
  else
    a2b_ev "const b=[...document.querySelectorAll('#ending-check-overlay button')].find(x=>x.innerText.includes('End the mission now')); if(!b) return 'no end'; b.click(); return 'End now';" >/dev/null
    sleep 2; echo "2 s after End now: $(state | jq -c .)"; a2b_shot ending_line
    sleep 6; echo "8 s after End now: $(state | jq -c .) credits=$(a2b_ev "return !!document.querySelector('.bond-visualiser, #bond-visualiser, .credits-overlay');")"; a2b_shot credits
  fi
  echo "events: $(a2b_ev 'return window.__ev;')"; a2b_ev "return window.__ev;" > "$OUT/${1}_events.json"; a2b_quit ;;
button)
  AUTOBRIEF=true a2b_open button; gate clear_basic
  open_phone; open_thread hidden_contact; echo "hidden thread, away_back false: $(screen | jq -c '{callButton}')"; a2b_shot hidden_none
  echo "$(set_global away_back true)"; sleep 1; echo "after the global turns true, thread still open: $(screen | jq -c '{callButton}')"; a2b_shot hidden_appeared
  echo "$(set_global away_back false)"; sleep 1; echo "after it turns false again: $(screen | jq -c '{callButton}')"; a2b_shot hidden_gone
  echo "$(set_global away_back true)"; sleep 1
  # a stale press: the button is on screen, the entry goes (silently, no event), then the player presses
  a2b_ev "window.gameState.globalVariables.away_back = false; return 'flag cleared without an event';" >/dev/null
  echo "stale button before the press: $(screen | jq -c '{callButton}')"
  a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed';"; sleep 1.5
  echo "after the press: $(screen | jq -c '{callButton,bar}') open=$(state | jq -c .open) ringer=$(state | jq -c .ringer)"; a2b_shot stale_press
  a2b_quit ;;
caption)
  AUTOBRIEF=true a2b_open caption; gate clear_basic
  open_phone; open_thread desk_contact
  a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed';" >/dev/null; sleep 0.8
  echo "dialling: $(screen)"; a2b_shot calling
  gate wait_screen "$IN_CALL" 12; echo "connected: $(screen)"; a2b_shot connected
  a2b_ev "const b=document.getElementById('call-end-button'); b.click(); return 'End';" >/dev/null; sleep 3.5
  close_phone
  open_phone; open_thread away_contact
  a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed';" >/dev/null; sleep 0.8
  echo "away dialling (no callLabel): $(screen)"; a2b_shot calling_nolabel
  a2b_quit ;;
esac
