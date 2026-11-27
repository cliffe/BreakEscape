# m08 lighting stage: browser re-check (c5), sprite-variant fallback fix

Game 2509 (new game, so the new erb is rendered), keyless server :3001, headless session, now stopped. Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m08-lighting-browser2/session.jsonl`. All 9 rooms unlocked via unlock-all-rooms.rb. Opening brief closed by `bootstrap`.

Method
- Interrogation room loaded with `window.loadRoom("interrogation_room")` before any global was set; the player was never moved (stayed in main_lobby), so the suite was never entered. Camera centred with `cameras.main.stopFollow(); centerOn(-160, 283)`.
- Globals set with `applyActions([{type:"set_global",key,value}])` imported from `/break_escape/js/systems/apply-actions.js`, so `global_variable_changed:<key>` fires.
- Reload: `stateSync sync`, `location.reload()`, click "Resume" through the DOM, `mg continue` on the title screen, click "Continue" on the Mission Brief. Each post-reload screenshot was taken only after `brief` showed no active minigame, and the PNG shows the map.
- State read from `window.rooms.interrogation_room.objects[].texture.key` (scenarioData.id `evidence_display`, `disposition_terminal`) and `window.lightingSystem.rooms.get("interrogation_room")`.

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Load suite first, start state | PASS | evidence_display `hq_evidence_wall1`, disposition_terminal `hq_disposition1`; light motion/off/variant -1. `1_start.png` (suite dark, "CASE FILE" and "DISP" signs dimly visible) |
| 2 | set mole_identified, suite already loaded | PASS | evidence `hq_evidence_wall_named1`, disposition still `hq_disposition1` (not smartscreen). `2_mole_identified_before_reload.png` (case file shows "0X47 PENDING", DISP board unchanged) |
| 3 | Reload, load suite | PASS | Same as 2: `hq_evidence_wall_named1` / `hq_disposition1`, mole true. `3_mole_identified_after_reload.png` (gameplay map, Objectives panel) |
| 4 | set all_flags_submitted | PASS | light mode on, on=true, variantIdx 0, emitters [0,0,0,0]; evidence `hq_evidence_wall_closed1`; disposition `hq_disposition_awaiting1`. `4_all_flags_submitted.png` (lit, red RECORDING glow, "CONCLUSIVE", "AWAITING") |
| 5 | Reload, confirm 4 holds | PASS | Identical eval to 4 after reload (variant 0, closed1, awaiting1). `5_all_flags_after_reload.png` (gameplay map, not title screen; same picture as 4) |
| 6 | fate_decided + nightshade_triple_agent | PASS | disposition `hq_disposition_retained1`; variantIdx 1; emitters [-1,-1,-1,0] (red recording glow off); evidence stays closed1. `6_retained.png` ("RETAINED", glow gone, ambient lighter) |

Notes
- Step 1 on a fresh game: lightingSystem registers interrogation_room on loadRoom (mode motion, on=false), as in c4.
- A white-coated NPC stands in the suite from step 4 onward (not present in 1-3): Nightshade (`nightshade_confrontation`), shown once all_flags_submitted and mole_identified hold. Screenshot 6 shows him still at the table after the fate: closing review c5 m6(b), left as a play check for the orchestrator.
- Not exercised: entering the suite, hq_recording_on1, the handover branch (covered in c4).
- Globals were set by console, not by playing the puzzles.
