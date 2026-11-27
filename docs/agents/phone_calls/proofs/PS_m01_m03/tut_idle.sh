#!/bin/bash
# PS R3: m01, tutorial accepted then left idle. Expect the ring at about 20 s, banner below the tutorial panel.
#   PC_PORT=3023 OUT=docs/agents/phone_calls/proofs/PS_m01_m03 docs/agents/phone_calls/proofs/PS_m01_m03/tut_idle.sh
source /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-calls/tools/phone_calls/routes/m10_lib.sh
LABEL=tut_idle; mkdir -p "$OUT"
tut() { a2b_ev "const t=window.getTutorialManager(); return {active:t.active, prompt:t.promptOpen, step:t.currentStep};"; }
geo() { a2b_ev "const r=e=>{if(!e) return null; const b=e.getBoundingClientRect(); return [Math.round(b.left),Math.round(b.top),Math.round(b.right),Math.round(b.bottom)];}; const b=document.querySelector('.incoming-call'); const p=document.querySelector('.tutorial-panel'); const sk=[...document.querySelectorAll('button')].find(x=>/SKIP TUTORIAL/i.test(x.innerText)); const ov=(a,c)=>!!(a&&c&&a[0]<c[2]&&c[0]<a[2]&&a[1]<c[3]&&c[1]<a[3]); const B=r(b),P=r(p),S=r(sk); return {banner:b?b.innerText.replace(/\n+/g,' | '):null, layerClass:(document.getElementById('phone-ring-layer')||{}).className, bannerRect:B, panelRect:P, skipRect:S, overlapsPanel:ov(B,P), overlapsSkip:ov(B,S), vh:innerHeight};"; }
GID=$(tools/phone_calls/newgame.sh m01_first_contact --unlock main_office_area | sed -n 's/^GAME_ID=//p'); echo "$GID" > "$OUT/${LABEL}_game_id.txt"; echo "game $GID"
tools/phone_calls/session-start.sh --url "http://127.0.0.1:$PC_PORT/break_escape/games/$GID" --headless true --log "$OUT/${LABEL}_session.jsonl" --tts-log "$OUT/${LABEL}_tts.jsonl" 2>&1 | tail -1
$S $GID '{"cmd":"bootstrap","tutorial":"accept","resume":"new","autoBrief":true}' 120 | cut -c1-200
sleep 3; echo "after bootstrap: $(tut) mg=$(mgc)"
$S $GID '{"cmd":"enter","room":"main_office_area"}' 60 | jq -c '{ok,reason}'; T0=$(date +%s.%N); echo "entered, t=0"
for i in $(seq 1 60); do a2b_ev "return !!document.querySelector('.incoming-call');" | grep -qx true && break; sleep 1; done
echo "banner at t=$(echo "$(date +%s.%N) - $T0" | bc | cut -c1-5) s; tut=$(tut)"; echo "geometry: $(geo)"; a2b_shot banner_tut_idle
a2b_answer; gate wait_screen "$IN_CALL" 20; sleep 4; echo "call: $(screen | jq -c '{bar,subs,choices}')"; echo "tut during call: $(tut)"; a2b_shot call
press_when "Texts it is"; sleep 4; gate wait_screen "!document.getElementById('call-end-button')" 30; sleep 6
echo "tour rows=$(a2b_ev "return (window.npcManager.getConversationHistory('agent_0x99')||[]).filter(m=>/get a feel for the place/.test(m.text)).length;") tut=$(tut)"; a2b_shot after
a2b_quit
