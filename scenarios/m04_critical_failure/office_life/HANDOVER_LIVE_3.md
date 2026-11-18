# Handover: live proof 3

Done: L1, L2, L7 (see LIVE_PROOF_3.md). Open: L6 re-run (post-call steps), attack probe (10.4 and M1), credits.
Scripts (scratchpad .../scratchpad/): lp3_lib.mjs, lp3_reach.mjs, lp3_ally.mjs (ally + anomaly by play, `allyAndAnomaly`), lp3_g.mjs (L6), lp3_f.mjs (cooler), lp3_ng.sh (prints new game id; ALWAYS use its output, other agents create games concurrently).
Gotchas: after the phone call close the phone minigame and dismiss barks before enterRoom; Hall 1 is reached ops -> scada -> battery_hall_1 and the player ends there; the path back is battery_hall_1 -> scada -> ops -> reception. Reload mid-script needs `stateSync.sync()`.
