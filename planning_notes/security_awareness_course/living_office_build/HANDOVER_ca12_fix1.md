# Handover: ca12 fix batch 1 (edits applied and tested, live re-check still to do)

Branch feat/ca-living-office-1b at 203a7fb99 (worktree .claude/worktrees/b-ca-lo-1b). Stopped at the context note before any file edit. Everything below is diagnosis; Items 2-5 of the brief are untouched.

## Diagnoses (item 1)

All times in tiles (px/32). Room is 10x10; floor is x 1.25..8.75, y 2.0..9.4. Live world-grid dump (8 px cells, :3003, game 10574, probe in scratchpad ca12_live/gp.py) shows only walls and the desk strip (x 0.6-5.0, y 7.75-8.5) blocked. Kiosk, sofa, chairs have no body in the grid.

(a) Camila's (7.5, 3.5) is NOT blocked. The walker stops early because of the arrival-tolerance guard: public/break_escape/js/systems/npc-behavior.js:1432-1445 (`d2 < TILE_SIZE*TILE_SIZE` calls `_triggerGoToStayArrival`, which emits npc_arrived at :3578-3626). The door tile (8.5, 2.5) to (7.5, 3.5) is only 1.41 tiles, so she is "arrived" after about 0.4 tile (stops at ~(7.9, 2.8), pathLeft 4). The same guard means every goToAndStay ends up to 1 tile short of its target, so the exit tile (8.5, 2.5) is never reached either (she is hidden ~1 tile from the door). Also the kiosk is at about (8.0, 3.9), so (7.5, 3.5) stands on it visually.
Proposed fix (data only): step-in tile (6.5, 4.5) in BOTH the panel npcs[0] eventMapping patrolOverride and the fallback npcs[0].position (merrin_sallow.json lines ~216-219 / ~601-604 region; grep "7.5"). Free floor, 2.8 tiles from the door, 1.2 from Lorna's post, 1.5 from the kiosk. Keep exit (8.5, 2.5) and say in the sheet that "arrives" means within 1 tile (npc-behavior.js:1440). Sheet proof text "Camila's last position before the hide must be the east door tile" (CA12_BUILD.md:590) and "Lorna ends on {5.5, 3.8}" (:584-585) need rewording to "within 1 tile of". Lorna's tiles (5.5,3.8), (3.5,5.0) and Camila's desk tile (2.5,5.0) are all free floor.

(b) Julian never walks: same guard. At load and through the beat he stands at about (6.9, 8.1), his resting cell next to the sofa use cell (~(7.4, 7.7)). J2's target (6.0, 8.0) is 0.9 tile away, so the guard fires on the first tick: a2.out shows `npc_arrived kit_julian_sallow` 0.55 s after kit_ca12_out with pathLeft 4 and no owner (he did not move). Proposed fix: J2 patrolOverride target further off, e.g. (7.0, 5.5) (he stops ~(7.0, 6.5), 1.3 tiles from the use cell, clear of Thandiwe's route and 2 tiles from Camila's step-in). Keep his needsHome/position (6, 8). Verify live that the sofa use cell is free when Thandiwe goes. Sheet 2.2 J2 text says "walks him to his home tile": reword to a "clear tile", not his home, with the 1-tile reason.

(c) Not the bubble rule. npc-barks.js:26-29 routeBark sends an other-room bark to a toast, and npc-world-bubbles.js:17-18 / :183-185 (speechShown) only gate bubbles. The real cause: Delphine is in the lobby, and room NPCs are registered only when their room is created (core/rooms.js:1027 -> npc-lazy-loader.js:37-110 registerNPC, which sets up eventMappings at npc-manager.js:402). The e12 bridge never walks into the lobby, so her A7 mapping (global_variable_changed:kit_ca12_done, condition includes kit_quiet) was never registered. The live probe confirms npcManager.npcs holds only lorna, kit_thandiwe, kit_julian, kit_camila at start. Action: in the sheet's A7 entry write "plays only once the lobby room has been loaded (player has been in or beside it); with the player in the studio it arrives as a toast; best-effort, accepted"; proof re-run must visit the lobby first (walk through the door, return is not needed: stand in the lobby at the answer, as the brief says). Check live whether, with the player in the lobby, the bubble appears.

(d) Not diagnosed. The shot a-camila-bark.png shows only the bottom name pill ("Camila Ospina"), not a Thandiwe caption; the caption may be the harness's converse-close or the interaction label. Capture it in the live re-run (dump `document.body.innerText` for the caption element and screenshot right after Camila's bark; check whether a person-chat/ dialogue caption element remains after conversation_closed).

## Time of day (item 3)
The setting is morning: Delphine "Morning. Can I help you?" (delphine_reception.ink:48), Camila "Morning, I've a ten o'clock" (scenario.json.erb:324, defend.json:121), Lorna twin "You're on reception this morning" (defend lorna ink:24), S1 "Long morning" (thandiwe_moyo_ambient.ink:20). The conceptPanel and episodes.json rows hold no time. Only clash: pool line "Client's in this afternoon." (merrin_sallow.json:12, copied into all three shells + twin) -> change to "Client's in this morning." Change nothing else.

## Still to do (nothing started)
- merrin_sallow.json edits above + chatter swaps (Thandiwe "Plan sets everywhere." -> "Rev C or Rev D?", Julian "Back in a minute." -> "That roof pitch still won't work.") + `_note` pc1_break PLACEHOLDER line (m4) + measured-tile note; also fix game.js:853 comment ("hand edit of pc1.png"). Sheet: open items (m4), A7 entry, Dialogue appendix (chatter lines incl. the new ones), proofs/wording above.
- m1: camila_ospina_ca12.ink: move the "synced global" comment to the line directly above `VAR kit_ca12_door_choice` (line 8); recompile .ink and .json together with bin/inklecate.
- m2: scenarios/test_ca12_fallback/scenario.json.erb lines 2-3: scenario_id `test_ca12_fallback`, scenario_name `Test: CA12 visitors and tailgating (fallback)` (precedent test_ca01_panel).
- m3: test/js/social-awareness-office-kit.test.mjs ~:291 and :116, office_kit.py:359 also read `targetKnot`; new test that each bark's targetKnot names a real `=== name ===` knot in the NPC's compiled ink.
- m5: data-driven JS tests (walk every setPieces[*].npcs[*] in office_kits/*.json; every spriteVariants value is preloaded in game.js; fallback layer-0/layer-1 text assertions: ends "have a word with Lorna." and contains "To a real attacker").
- Regenerate: `python3 planning_notes/phishing_and_social_engineering/awareness/apply_training_room.py --kit <scratch>` (no --allow-drop expected), diff, copy back. Run test_office_kit.py, the office-kit JS test, dialoguelint-wordcap-exempt test, validator on the 3 shells (`--strict-social --no-graph --skip-ink`, count '^ +ERROR ' = 0). Commit with explicit paths; no Ruby expected.
- Live re-check (item 5): reset .claude/worktrees/x-ca12-live (`checkout -f --detach <hash>`; scratchpad ca12_live/orig_kit.erb is the old test_ca_office_kit), copy the regenerated ca12_visitor_tailgater shell over scenarios/test_ca_office_kit/scenario.json.erb with scenario_id test_ca_office_kit; server :3003 PID 3548858 (static files reload, game rows are copied at creation so make a new game with ca12_live/mk_game.sh 3003 278 TAG). Routes via ca12_live/routes.py `lookup()`; for A7 visit the lobby first. Append "Fix batch 1" to ca12_live/RESULTS.md.

## Gotchas
- A new game row is needed after any scenario change (mk_game.sh). Game 10574 was made for the grid probe only.
- Camila ink knot stays; no Ruby touched so far; nothing committed except this note.


## Done (commit 3ba62b332 plus the follow-up test commit)

Edits, regeneration (scratch outdir, diff showed only the intended lines, copied back to the 3 shells) and offline tests are complete. Nothing was run live.

New tile values for the live run (merrin_sallow.json, sheet CA12_BUILD.md):
- Camila step-in: (6.5, 4.5) in the panel patrolOverride and the fallback position (was 7.5, 3.5).
- Camila exit: kept at the east door tile (8.5, 2.5). With the 1-tile arrival guard she is hidden about 1 tile short, so from the step-in she vanishes near the door edge (about (7.8, 3.2)), not mid-room. Check this live; if she reads as mid-room, the door cannot be moved (wall), so pick an exit target nearer the door edge that is still free floor.
- Julian J2: (7.0, 5.5) (was 6.0, 8.0); free floor per the live grid dump; his rest spot (6.9, 8.1) is 2.6 tiles away. Julian home (6, 8) unchanged. Live check still needed that the sofa use cell is free when Thandiwe goes.
- Sheet proofs reworded to "within 1 tile of" (Lorna post, desks, door); A7 says it plays only once the lobby has loaded (toast elsewhere) and proof 5/9 visit the lobby first.
- Dialogue: pool "Client's in this morning."; Thandiwe chatter "Rev C or Rev D?"; Julian chatter "That roof pitch still won't work." (kit, 3 shells, sheet appendix).
- m1 comment moved, ink recompiled (json unchanged); panel validator warnings 4 to 3. m2 test_ca12_fallback scenario_id/name renamed (only reference to the old id is the test, which now asserts it). m3 targetKnot guards (JS isKitMapping, "knot only beside bark", office_kit.is_kit_mapping) plus a new test that each targetKnot names an ink knot. m4 pc1_break flagged PLACEHOLDER in the kit _note, sheet Q6, and game.js comment fixed. m5 JS tests are data-driven over office_kits/*.json (spriteVariants preload, set-piece NPC records, fallback layer 0/1).
- The conformance test skips the "a bark is gated" rule for the hand-authored fixture test_ca_office_kit (its barks use kit_e1_* targetKnots, which the wider isKitMapping now picks up).

Results: test_office_kit.py 59 OK; social-awareness-office-kit.test.mjs 17/17; dialoguelint-wordcap-exempt 7/7; validator (--strict-social --no-graph --skip-ink) ERROR lines 0 on ca12_visitor_tailgater, test_ca12_fallback and the twin.

Still to do: the live re-check (item 5 above), proof of (d) the caption, m6/m7 from the review (record measured tiles; twin host line wording is Q5).
