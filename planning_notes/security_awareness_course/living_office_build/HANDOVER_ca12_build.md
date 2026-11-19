# Handover: ca12 build (wave 1B), builder 1 stopped at the 150k context note

Branch feat/ca-living-office-1b, worktree .claude/worktrees/b-ca-lo-1b. Spec: CA12_BUILD.md (aee60f262).
Form chosen for the build: Form A (course shell = panel `ca12_visitor`, test shell `test_ca12_fallback`). D195 still the owner's call; only the episodes.json rows and the test shell's name change for form B.

## Done (committed in the one commit that carries this note)
1. Tooling: `office_kit.room_npcs` appends `_subst(setPiece.npcs)` after the ambient pair (office_kit.py). Python test `test_set_piece_npcs_are_kit_records_after_the_ambient_pair_and_round_trip` in test_office_kit.py. `python3 test_office_kit.py`: 59 tests OK.
2. Preload: `this.load.image('pc1_break', 'objects/pc1_break.png')` in public/break_escape/js/core/game.js beside pc1_locked. The PNG is a PLACEHOLDER made by tinting pc1.png's screen (x5..19, y2..11) amber with a cup mark; real art is Q6. The break-reminder key to use in the set piece is `pc1_break`.

## Not done (all of it still to do, in the sheet's work order)
- JS test for the preload line (add to test/js/social-awareness-office-kit.test.mjs: game.js loads pc1_break, file exists, same size as pc1.png) and the conformance test for set-piece npcs (hidden NPC has behavior.initiallyHidden and no `person`).
- AW/office_kits/merrin_sallow.json (pair, kit_sofa, pool, both set pieces ca12_visitor and ca12_visitor_fallback), the three shared inks in scenarios/_office_kit/ink/ (compile .ink and .json together), the three episodes.json rows, the test shell folder scenarios/test_ca12_fallback/ (scenario.json.erb, mission.json, ink/ with its own lorna_easton), --kit run to a scratch outdir with `--allow-drop <shell>` only if the guard demands it, copy back the two shells, twin regeneration from AW/e12/defend.json, Lorna's two ink copies (H1a/H1b/H2 and gates), Delphine A7 mapping in the panel build, conceptPanel text, validator (`--strict-social --no-graph --skip-ink`), dialoguelint, ink staleness test, node suites, rubocop (no Ruby touched yet), commit, then live proofs on :3003/:3004 from a throwaway worktree x-ca12-live (RESULTS.md path in the brief).

## Gotchas found while reading
- Sofa catalogue type is `leather_sofa` (image leather_sofa1.png, extractBaseTypeFromImageName strips trailing digits, core/rooms.js:186). Sofa object is at tile (6.75, 9.38), size 62x38 px; useFrom dy -1 puts the use cell at row ~7.4: check it is free floor (desk rect spans x 36-162 px, y 215-270 px, so x 216-278 px is clear).
- Studio map is 10x10 tiles; chairs aw_studio_chair_s1 at px x 46/85/124 (y bottom 216), n1 at y 300. Put kit_ca12_pc on a free desk cell beside one s1 chair; verify by screenshot in the live run.
- Existing tests glob `^(ca\d\d_|test_ca)` (social-awareness-office-kit.test.mjs:130), so the new shells join the conformance walk automatically; chainShells() are those with stepAway true.
- test_office_kit.py has hard-coded ca01 names; new ca12 checks should be added beside, not by editing them.
- The conformance tests and validator V3/V3b rules apply to the visitor's mappings (arrival filter `data.owner !== 'needs'`, once-only, out global, suspender-with-resume).
