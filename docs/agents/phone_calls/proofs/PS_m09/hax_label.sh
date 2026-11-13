#!/bin/bash
# Review M1 R4: HaX's identity scene (seeded flag3 + file held) opens on load as her voiced call; a recorder
# installed before bootstrap (PRE_EV) logs the call screen's caption. Bootstrap plays the call through.
source tools/phone_calls/routes/m09_m1_live.sh
PRE_EV=$OUT/hax_label_pre.js open_m09 hax_label --start-room reading_room --set flag1_submitted=true --set flag3_submitted=true --set nightshade_file_held=true
echo "captions seen: $(a2b_ev "return window.__cap")"
echo "contact callLabel: $(a2b_ev "return window.npcManager.getNPC('agent_0x99').callLabel")"
a2b_quit
