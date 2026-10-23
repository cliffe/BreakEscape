# m07 lighting browser check (cycle 5)

Note (orchestrator of the lighting stage): game 2469 was created before the cycle 5 edit (armed wall-end lights `#ff6a10` 0.65 → `#ff4a10` 0.7), so it ran the cycle 4 config. The reload checks cover the variant mechanism, which is unchanged.

Game 2469, keyless server :3001, headless. Session log: `live/session-2469.jsonl`. All screenshots in `live/`.
This is a lighting check, not a route test: every door was opened with `unlock-all-rooms.rb` (6 rooms), and the opening briefing was skipped by force-closing the minigame (bootstrap looped on the Netherton hub for about 90 s, as the skill warns).
State read with the supplied eval; the field names (`on`, `mode`, `variantIdx`, `emitters[].variantIdx`, `obj.texture.key`) were right as given. Rooms were loaded with `loadRoom` for the reads.

## Exercised, not earned (set by console)
`cascade_armed`, `countdown_expired`, `grid_saved`, `vault_entered` were all set with the supplied eval (global + broadcast + event). Doors were unlocked by script. Nothing was earned in play.

## Results

| Check | Result | Evidence |
|---|---|---|
| A. Start state | PASS | checkpoint on/on; operations_floor on/on; scada_control on/on; server_room on, mode motion; generator_room **off**, motion; cable_vault on/on. `cascade_countdown_display:3:pnw_countdown1`. |
| B. Motion strike | PASS | Before entering the hall: `generator_room=false`. After `enter generator_room`: `true` (and still true 1 s later). Screenshots `B1_checkpoint`, `B_operations_floor`, `B_server_room`, `B_generator_room`. HUD (objectives panel, hearts, inventory, toast, Agent HaX bubble) readable in each. In `B_generator_room` the hall is lit and the server room above it is lit. |
| C. cascade_armed | PASS | ~1.5 s after the set: countdown `cascade_countdown_display:2:pnw_countdown_armed1` (variant 3 to 2); operations_floor variant -1 to 0 (`situation_board` variant 2 to 1). Screenshots `C_scada_armed` (sign reads SEQUENCE ARMED PENDING / CLOCK RUNNING, "CASCADE SEQUENCE 14:57" HUD timer appears), `C_ops_armed`. |
| D. countdown_expired | PASS | `cascade_countdown_display:1:pnw_countdown_running1`; ops variant 0 (situation_board 0). Screenshot `D_scada_running`. |
| E. Reload persistence | PASS | After sync, reload, Resume clicked by exact text (no New Session/Restart), lightingSystem present. Globals still true. Countdown `pnw_countdown_running1`, ops variant 0, `situation_board:0`, same modes as before. generator_room came back **off** (motion): known and accepted. server_room on. Screenshots `E_scada_after_reload`, `E_ops_after_reload`. |
| F. grid_saved | PASS | Countdown `0:pnw_countdown_aborted1`; ops variant -1 (`situation_board` 2); `crisis_control_system` variant 1 to 0. Second reload: identical (`pnw_countdown_aborted1`, ops -1, `crisis_control_system:0`, generator_room off again). Screenshots `F_scada_aborted`, `F_ops_aborted`. |
| G. ATS-1 lamp | PASS | `vault_entered=true`; camera centred on generator_room (ATS at 740,306, texture `pnw_ats1`). First set `G_ats_1..4` (about 0.6-0.8 s apart because screenshot latency) had the Objectives panel covering the cabinet. Second set `G2_ats_1..6` with the panel hidden by display:none: amber lamp on the cabinet top bright in frames 2, 4, 6 and dim/off in 1, 3, 5. Blinks. |

## Odd or worth noting
- The Objectives DOM panel overlaps the west end of the generator hall at 1400x1000, so the ATS cabinet is hidden behind it unless the panel is collapsed. Not a lighting bug.
- Each reload plays the title screen again, and after pressing Enter the Ray Hollis checkpoint intro cutscene and the tutorial prompt replay. Closed with `forceCloseMinigame` and the "no, I'll figure it out" button. Probably a side effect of the resume path, unrelated to lighting.
- generator_room starts dark after every reload (motion mode), as expected; re-entering struck it again before check G.
- The cascade HUD timer started on cascade_armed; countdown_expired was then set by hand while it was still running, so the two states were not reached by the game's own order.
- Another agent's session (game 2471) is running concurrently; its browser processes were left alone.

## Cleanup
`session-stop.sh 2469` run (synced first); my harness pid 2960759 is gone. No headless browsers of mine remain. New chromium/node processes seen in `ps` belong to game 2471's session and were not killed. Nothing committed.
