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

## Builder 2 (kit, set pieces, shells, tests) at the 150k note
Commits: 7030b94e9 (kit, episodes rows, shells, conceptPanel, A7), then the JS tests and the kiosk fix (see git log). Form A.
Done: office_kits/merrin_sallow.json (panel + fallback set pieces), 3 episodes rows, scenarios/test_ca12_fallback/{scenario.json.erb,mission.json}, --kit run (needed `--allow-drop ca12_visitor_tailgater` once, for the knot to targetKnot change only), conceptPanel layers in all three shells (+ "word with Lorna" in the fallback; twin gets layer 1 only, fragment e12/defend.json updated), Delphine A7 mapping in the panel shell, JS tests (pc1_break preload, set-piece npc conformance). Validator --strict-social --no-graph: 0 errors on all three shells. test_office_kit.py 59 OK. JS suite: 14/15.
Deviations: (1) bark mappings use `targetKnot`, not the sheet's `knot` (validator errors on `knot`; the engine reads both). ALLOWED_MAPPING_FIELDS in the JS test gained 'targetKnot'. (2) The panel shell's kiosk finished variant was hand-edited to the KIOSK_FINISHED condition, because patch_kiosk skips handAuthored rows. (3) Camila uses the generic `female_blowse` sprite/talk/visemes: TODO until camila_ospina art exists (Q2). (4) No Julian/Thandiwe 'person' warnings fixed: same as ca01.
Open: 
- JS test 10 fails: scenarios/_office_kit/ink/camila_ospina_ca12.ink must mention kit_defend_done and kit_ep (ink agent's file; sheet 1.3 says it declares them).
- Validator warnings left: twin undeclared-VAR kit_ca12_screen_asked (sheet-expected), ca12 panel VAR kit_ca12_door_choice synced-global comment wanted in camila_ospina_ca12.ink.
- dialoguelint on _office_kit: exit-no-reply=9 (ink files, not mine).
- Tile coordinates (PC 3.5,6.75; Thandiwe 3.9,6.0; walk tiles) are guesses, need live proof 4. Julian/Thandiwe chatterLines are my own drafts (sheet says 3 each, no text).
- Not run: full bin/test-js, ink staleness test, pin test, validator on other shells, live proofs. No Ruby touched, so no rubocop. Twin was not regenerated with gen_e8_e17_shells (text edited in the fragment and the shell; they agree).
