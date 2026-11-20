# m08 lighting stage: browser check (c4)

Game 2508, keyless server :3001, headless session (stopped at end). All 9 rooms unlocked via unlock-all-rooms.rb. Opening brief closed by `bootstrap`.

Method
- Rooms loaded with `window.loadRoom(id)` (no walking), except B, where the player was moved with `player.setPosition` + a 300 ms `walk` (teleport alone leaves the sprite depth stale and the player invisible in a lower room; a test artefact, not a game bug).
- Globals set with the game's own `applyActions([{type:"set_global",...}])` (systems/apply-actions.js, imported dynamically), which sets `gameState.globalVariables[k]` and emits `global_variable_changed:<k>`. `stateSync` `sync` before each reload.
- Reload: `location.reload()`, click "Resume" through the DOM, poll `window.lightingSystem`. After each reload the game shows the title screen and then the Mission Brief notes; both need dismissing (Continue button) before gameplay screenshots.
- State read from `window.lightingSystem.rooms` (mode, on, variantIdx, emitters[].variantIdx/def) and `window.rooms[id].objects[].texture.key`.

| | Result | Evidence |
|---|---|---|
| A start modes | PASS | main_lobby, director_office, operations_floor, intel_analysis, cryptography_lab, break_room = on/on; server_room, security_archives = motion/off; interrogation_room = motion/off (registered after C, see C). `A_lobby_lit.png` shows archives (bottom right) dark |
| B motion entry | PASS (partial on readability) | archives off before (`A_lobby_lit.png`), after entering: on=true, panel levels [1,1,1] (`B_archives_lit_player_visible.png`; dark server room visible at right with its rack and desk glows). HUD (objectives, hearts, inventory) and the "Recording / Case file / Disp" wall signs read in a dim room (`C_interrogation_named_off.png`). No NPC or interactable marker was available in a dim room to check talk icons |
| C mole_identified | PASS | After set + loadRoom without entering: evidence_display texture `hq_evidence_wall_named1`; room mode motion, on=false, variant -1; player stayed in cryptography_lab. `C_interrogation_named_off.png` |
| D + all_flags_submitted | PASS | variant 0, mode "on", on=true, ambient #8c929e; evidence_display `hq_evidence_wall_closed1`; disposition_terminal `hq_disposition_awaiting1`; emitters hq_recording1 (#ff2a20 r26 i1), hq_recorder1 (#ff3020 r5), hq_camera_tripod1 (#ff3020 r5) all variantIdx 0; laptop3 intensity 0. `D_interrogation_closed_from_lab.png` (red glow on RECORDING sign, red LED on camera). Suite not entered |
| E reload | PASS | Globals persisted (mole/all true). After reloading all rooms: interrogation v0, closed1/awaiting1, same three red emitters at variantIdx 0; A's modes unchanged (server_room, security_archives motion/off; six rooms on). No post-reload screenshot of the closed state (screenshot caught the title screen, deleted); eval only |
| F fate_decided + nightshade_arrested | PASS | variant 1, mode on, ambient #c0c4cc; disposition_terminal `hq_disposition_handover1`; evidence wall stays `closed1`; hq_recording1/hq_recorder1/hq_camera_tripod1 variantIdx -1, def null (off); laptop3 back at r30 i0.3. Same after second reload. `F_after_reload_handover.png` (after reload). Note (closing review c5 m1): `F_handover.png` caught the title screen ("Continue?"), not the handover state; the before-reload claim rests on eval output only |
| G anomalies | see below | |

G notes
- No page errors. 9 console "503 Service Unavailable" resource loads (keyless server, likely TTS/audio; not investigated).
- No black rooms; every lit room rendered.
- security_archives stays on after the player leaves (no `offAfter` in its config, so motion rooms never switch back off). Likely intended, but the "off until entered" reading holds only for the first visit.
- A large translucent green circle with a vertical green line sits over the break room (left of `C_`, `D_`, `F_after_reload_handover.png`), around the hooded NPC. Not lighting; cause not investigated.
- hq_recording_on1 / hq_disposition_retained1 sprites not exercised.

Not exercised
- Walking into interrogation_room or the server_room by real pathing (teleport used); the confrontation cutscene.
- The retained disposition branch (fate_decided without nightshade_arrested), hq_recording_on1.
- Fire alarm / door-spill / torch behaviour, flicker, NPC-triggered motion lights.
- Real route to set the globals (puzzles); globals were set by console.
