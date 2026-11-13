# Handover: M1 R2 fixer (m09 Nightshade ring order, m2 file line)

Opus, 2026-11-12, `build/phone-calls` (worktree `p-phone-calls`). Stopped at the orchestrator's token-budget handover.

## Done
- Source fixes all in: M1 (three Nightshade mappings, cage-gate fallback + room_entered backstop), m1 (`flag1_read_done` global + ring keyed on it), m2 (file-held line rewrite). Detail and before/after in `REVIEW_M1_R2_OUTCOMES.md`.
- Ink recompiled (only agent0x99.json, nightshade.json changed). Validators clean: dialoguelint no new finding, validator 0 errors/24 issues, `tts_mission_lines_test.rb` 5/0. Key diff worked out (count 411; file-held re-keyed `db6c420b…`→`89cf88a1…`); parent dump impossible from the worktree (noted in outcomes).
- Route extended with R2 subcommands (`race`, `readout_full`, `first_choice_close`, `readout_reload`) that walk the real path from the drop terminal — no hand-set flags.
- Proofs captured in `proofs/M1_r2/`: **race** (full PASS) and **readout_full** (PASS; log truncated by the handover stop after the call opened).

## Open / owed
- Clean captured runs of **first_choice_close** and **readout_reload** (routes are corrected and ready; `readout_reload` was observed working in an interim run). Server was on :3025 (now stopped). Re-run: `PC_PORT=3025 OUT=docs/agents/phone_calls/proofs/M1_r2 bash tools/phone_calls/routes/m09_m1_live.sh <sub>` against a fresh keyless :3025 server.
- Audio: 2 lines under `nightshade_phone` need clips (`339ba23f…` cage, unchanged from R1; `89cf88a1…` the R2 file-held rewrite).

## Gotchas
- The drop terminal validates the game's **per-game stand-in** flag, not `flag{m09_catalogue_index}`. `submit_flag1` in the route reads it with `bin/rails runner … player_state['flags_by_vm']['catalogue_server'][0]` and types it. In standalone that stand-in is the valid flag.
- Opening the read-out: tap the **toast** (`First box is in`), not the contact list — the contact opens the hub at `start`. Then `choose [1]` once reveals the choice menu (done still false); a second `choose [1]` plays the card line and sets `flag1_read_done`; a third `choose [1]` is [Got it] and self-closes (which fires mapping 1).
- Room moves: `moveToNear`+`interact` on an adjacent door does not reliably cross. `enter_stacks`/`enter_reading` open the near door then `moveToNear` a door INSIDE the target room (cross-room pathing) and retry until `window.currentPlayerRoom` matches.
- Start the :3025 server with a **custom `-P` pidfile** — other sessions own the default `test/dummy/tmp/pids/server.pid`.
- Other agents are committing in this tree (PHONE_CALLS_PLAN.md, test_phone_calls/*, validate_phone_calls.rb, m05_live.sh, M5_r1/). Do not stage theirs.
