#!/bin/bash
# R4 n2 probe: row31_probe's head start; sample the Recruiter twin's ringMs before, during and after the HaX call.
export OUT=docs/agents/phone_calls/proofs/R4_m05_m06_m08
source tools/phone_calls/routes/m10_lib.sh
eval "$(sed -n '/^LOGEV=/p;/^evs()/p;/^end_call()/p;/^call_up()/p;/^banner()/p;/^emit()/p;/^ALLF=/p' tools/phone_calls/routes/m05_live.sh)"
cur() { a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state,ringMs:Math.round(c.ringMs),t:Math.round(performance.now()/100)/10}:{t:Math.round(performance.now()/100)/10};"; }
m10_open n2_probe m05_insider_trading --set torres_identified=true --set architect_approval_confirmed=true $ALLF; a2b_ev "$LOGEV" >/dev/null
for i in 1 2 3 4 5 6; do echo "before phone: $(cur)"; sleep 1; done
emit 'global_variable_changed:flag4_submitted' '{"name":"flag4_submitted","value":true}'
open_phone; echo "phone open: $(cur) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"
open_thread agent_0x99_handler
choose_text "Architect signed off" >/dev/null; call_up 40; echo "in call: $(cur) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"
end_call >/dev/null
for i in $(seq 1 16); do echo "after End: $(cur)"; sleep 1; done
evs; a2b_quit
