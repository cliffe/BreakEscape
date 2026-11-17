#!/bin/bash
# Engine sweep R3: HaX's identity scene in m09 (seeded flag3 + file held, as PS_m09/hax_label.sh) opens on load as her
# voiced call, inside bootstrap. caption_raf_pre.js, installed before bootstrap (PRE_EV), logs #call-caption's text on
# the first three painted frames (requestAnimationFrame) and on every change; a MutationObserver logs any rewrite.
# The call plays through inside bootstrap, so the bridge cannot screenshot it (the m03 route does the screenshot).
#   PC_PORT=3027 OUT=docs/agents/phone_calls/proofs/ENGINE_SWEEP_R3 IMP=docs/agents/phone_calls/proofs/M1/imports.json bash .../hax_caption.sh
source tools/phone_calls/routes/m09_m1_live.sh
PRE_EV=$OUT/caption_raf_pre.js open_m09 hax_caption --start-room reading_room --set flag1_submitted=true --set flag3_submitted=true --set nightshade_file_held=true
echo "frames: $(a2b_ev "return window.__capf.slice(0,12)")"
echo "mutations: $(a2b_ev "return window.__capm")"
echo "contact callLabel: $(a2b_ev "return window.npcManager.getNPC('agent_0x99').callLabel")"
a2b_quit
