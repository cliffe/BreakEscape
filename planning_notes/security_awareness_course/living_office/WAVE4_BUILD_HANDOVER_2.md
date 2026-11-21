# Wave 4 build handover 2 (builder stopped at the 150k context guard)

Worktree `.claude/worktrees/b-ca-lo-w4`, branch `feat/ca-living-office-w4` from main bc8670fbd.
Spec: `.claude/worktrees/p-ca-living-office/planning_notes/security_awareness_course/living_office/WAVE4_BUILD.md`
(+ WAVE4_BUILD_NOTES.md, WAVE4_VOICING.md beside it). Read them in full; the sheet is 75 KB, so read it in 3 chunks.

## Done
- Step 0 PASSED live. Probe: `wave4_step0_probe.mjs` (beside this note; playwright-core from the main checkout's
  node_modules, headless chrome-headless-shell, `window.stateSync.writeGlobal('kit_e1_out', true)` sets the global,
  `window.__test.throttleFps(20)`). Server on :3007 (stopped), game id 11367 (test_ca_office_kit), keyless.
  Evidence (events wrapped on eventDispatcher.emit, needs clock 250 ms/tick):
  - `npc_use_failed:kit_priya_nair` data `{"npcId":"kit_priya_nair","objectId":"kit_e1_pc2","need":"work","missing":[{"id":"kit_e1_system","why":"down"}],"station":false}` at 3.43 s after out (needs-clock 7500).
  - `global_variable_changed:kit_e1_note_up` value true 3 ms later (3.434 s), set by the mapping, well before the 6000 ms timer `kit_e1_t_note`.
  - needs log: urgent work 10, job_start, using (t18), use_failed `causes kit_e1_system:down` (t30), turned_back, parked reason failed, frustration.
  - triggeredEvents fired: `kit_priya_nair:npc_use_failed:kit_priya_nair:1` = 1 and `kit_priya_nair:global_variable_changed:kit_e1_note_up:2` = 1.
  - Stand/step/sit: Priya's sprite stayed at (160, 161) through the whole window, mode job -> returning, so no visible stand, step and sit again at the failure in the fixture. (Fixture PC useSeconds is about 3, so failure at 3.4 s here; ca09/ca16 use 2 s.)
  - Page errors: none. Fallback NOT needed: build ca09 and ca16 with the work need, resource and rows 2/5/20 and 2/5/16.
- Read the spec, `office_kit.py`, the ca12 set piece in `merrin_sallow.json`, Tarrowby and Quayholt kits, `episodes.json` rows.
  Baseline `python3 apply_training_room.py --kit <out>` reports every shell "(unchanged)" on this branch.

## Not started (steps 1-5, in this order)
1. Lines are locked by WAVE4_VOICING.md; no dialogue review needed (brief says use them exactly).
2. Generator: set-piece `resources` merged into `kit_keyed` for its own row (ids start `kit_`), unit test in
   `planning_notes/phishing_and_social_engineering/awareness/test_office_kit.py` (ca09 gets `kit_ca09_signin`, ca16 gets `kit_ca16_signin`; ca06, ca15, twins none). `build()` returns `kit_keyed(kit,row)`; `apply_kit` at office_kit.py:546 and `strip_kit` :480 already handle `resources` by `kit_` id.
3. Tests first in `test/js/social-awareness-office-kit.test.mjs` (1177 lines; only lines 1-140 read): W4 map beside W3,
   tier-keyed bark cap (T:364), no-`||` extension to timers/variants, onceOnly check, placement test, PC-home
   exemption at T:737-746, `aes_clipboard` in `MOVED_TYPES` (T:~1080), depth test over W3+W4+fixture with minimums 6 moved items / 8 overlaps. Commit them.
4. Kits: `office_kits/tarrowby_logistics.json` gets a new `setPieces` (`ca06_notice`, `ca09_note_on_screen`,
   `ca15_found_stick`); `quayholt_insurance.json` gets `ca16_borrowed_login`; rows in `episodes.json` flip `setPiece` + `stepAway: true`
   (ca06, ca09, ca15, ca16 only). Staff patches shape: copy `ca12_visitor` (`staff` keyed by bare name, own `eventMappings`
   list replaces the generated one; `needsHome`/`needs`/`workNeeds` in the patch). Stand-in PNGs + `game.js` load lines
   (`aw_notice_qr_parking1` and `pc1_locked_note` beside `pc1_locked` GJ:~851; `usb_storage_swivel_taken` beside `usb_storage_swivel` GJ:~498);
   record sha256 of each stand-in (NOTES 3). Hand-edit the four erbs (pointer sentence, array wrap for ca06/ca15,
   kiosk finished condition, panel entries with headings, `strings.stepAway` first key). Regenerate with
   `apply_training_room.py --kit <out>`, copy the four erbs in, confirm twins and ca03/ca08/ca19 "(unchanged)".
   Chain tables are §4-§7 of the sheet (rows, delays, conditions); NOTES 6: ca09 uses `kit_ca09_note_up` as `there`.
5. Inks: knots `ca06_notice`, `ca09_note`, `ca15_stick`, `ca16_signin` in `scenarios/_office_kit/ink/<person>_ambient.ink`
   (guard copied from `lorna_easton.ink:36` / `thandiwe_moyo_ambient.ink` ca12_screen; `+` option syntax, NOTES 5);
   `#delivery:` tags per VOICING; host recap guards in `scenarios/<shell>/ink/<host>.ink`
   (ca06 chidi_okeke, ca09 and ca15 nilesh_solanki, ca16 anjali_rao) `(kit_<ep>_done || not kit_<ep>_out)`. Compile each with `bin/inklecate`.
   Also bark `delivery` fields for lines 4? (check VOICING: delivery notes on 4, 5, 6, 13, 14, 15, 19).
Then: `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle bin/test-js`, python office_kit tests,
rubocop touched Ruby, validator on the four shells (`ruby scripts/validate_scenario.rb <erb> --strict-social --no-graph --skip-ink`).

## Gotchas
- The worktree has no node_modules and no vendor/bundle: use the main checkout's (`BUNDLE_PATH=.../BreakEscape/vendor/bundle`; playwright via `createRequire('/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/node_modules/')`).
- Game creation: `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3007 bundle exec rails runner tools/playtest/new-game.rb <scenario>`.
- Sheet shorthand `v` = `value`; conditions `&&` only; every chain mapping `onceOnly: true`; new eventMappings go last; run `ruby tools/check_mapping_index_drift.rb main` before sending a hash.
- Hand-authored rows: generator refuses to write them; only `apply_training_room.py --kit` splices, and refuses hand-written kit content it cannot regenerate (move everything into the kit data's set pieces).
- Never db:* tasks. Server on :3007 was killed by PID; no other process of mine remains.

## Handover 3 (builder stopped at the context guard; step 3 tests written, nothing else built)

### Done
- Read the sheet, notes, VOICING, office_kit.py, ca12 set piece, Tarrowby/Quayholt kits, episodes rows, ca12 ink precedent.
- Step 3 tests written in `test/js/social-awareness-office-kit.test.mjs` (syntax checked only, NOT run): tier-keyed bark cap, no-`||` on timers and variants (generic chain test), `PC_HOMES` exemption in the coordinate-home test, `W4` map + `W34` (kiosk, pointer, parity tests now cover W4), `aes_clipboard` in `MOVED_TYPES`, depth test over W3+W4+fixture with minimums 6 moved / 8 overlaps, and a new "Wave 4" block appended at the file end (rows/globals, stepAway line + panel entries with headings, `&&`/onceOnly/out/needs-walk/bark checks, exact staff-bark counts, request recipe, walk-issued flags, ca09 objectName + PC homes + work need + resource, PC hint order, host recap guard, knot guard text, PNG dims + game.js preloads, placement, twin check). Some assertions in the last two tests are loose (`|| true`); tighten once the kits exist. Expect failures on the unbuilt shells.

### Contradictions found (report to caller)
1. Bark `delivery`: VOICING says a bark may take a `delivery` field, but the engine has none (`npc-barks.js _speakBark` and `tts-manager.play` take a delivery only from ink tags; no mapping field is read). Lines 5, 6, 13, 14, 15 are barks with delivery notes. Adding one is an engine change (out of scope). Options: put `#delivery:` on the ink knot's first line only (line 6 then has a different clip from its bark), or add a bark `delivery` mapping field in a later engine change. Needs a ruling.
2. Sheet says "no JS behaviour change"; no conflict otherwise found yet.

### Next (steps 3 commit, 2, 4, 5, in this order)
- Commit the tests (explicit path), then step 2 generator: in `office_kit.py` `kit_keyed(kit,row)` also merge `_set_piece(kit,row).get('resources')` (ids `kit_`; the kit-level `resources` stays); unit test in `test_office_kit.py` (ca09 gets `kit_ca09_signin`, ca16 `kit_ca16_signin`, ca06/ca15/twins none). `build()` already calls `kit_keyed`.
- Step 4: write set pieces as text into `office_kits/tarrowby_logistics.json` (new `setPieces`, file is not a json.dumps round trip, so splice text) and `quayholt_insurance.json` (`ca16_borrowed_login` appended; setPieces is the last key). Generate the pieces with a Python script from the sheet tables (§4-§7): staff patch is a SHALLOW `npc.update(patch)` in `room_npcs`, so a patch carries the whole `needs`, `needsHome`, `workNeeds`, `eventMappings`. Host mappings go in set-piece `mappings` (Nilesh barks ca09 N1, ca15 N1/N2; ca09 row 10 `object_interacted`). Mapping fields must stay in `ALLOWED_MAPPING_FIELDS` (no `delivery`). Rows in `episodes.json`: `setPiece` + `stepAway: true` for the four. Stand-in PNGs: `pc1_locked_note` = byte copy of `pc1_locked`; `aw_notice_qr_parking1` 16x21 flat/cropped; `usb_storage_swivel_taken` transparent 14x6; `game.js` load lines beside `pc1_locked` (~851) and `usb_storage_swivel` (~498); record sha256 of the two stand-ins in the log. Hand-edit the four erbs (pointer sentence §1, array wrap ca06/ca15, kiosk condition §1a, panel entries with plain headings §3.6, `strings.stepAway` first key §1b), regenerate with `python3 apply_training_room.py --kit <out>` (scratchpad), copy the four erbs in, confirm twins + ca03/ca08/ca19 "(unchanged)".
- Step 5: inks (knots in `scenarios/_office_kit/ink/<person>_ambient.ink`, `+` options, guard as `thandiwe_moyo_ambient.ink` ca12_screen; stub `start` diverts to the knot while `kit_<ep>_asked`, before the `kit_defend_done` divert; VARs per knot) and host guards `(kit_<ep>_done || not kit_<ep>_out)` in `scenarios/<shell>/ink/<host>.ink` (+ VARs); compile each with `bin/inklecate`; `#delivery:` per VOICING on ink lines 4, 6(?), 15? (only ink-spoken: 4 Z4, 19 N4; others are barks, see contradiction 1).
- Then the full test run list from the brief, validator on the four shells, `ruby tools/check_mapping_index_drift.rb main`, rubocop on touched Ruby (none expected).

### Gotchas
- Chain-shell generic test requires: every walker has suspend+resume mappings; one suspend on the out global somewhere (partner); `npc_use_failed`/`npc_arrived:` events are allowed chain events; barks only on staff counted (cap 3 for tier E); setVisible only on kit NPCs; host mappings must name `kit_` globals to count as kit mappings.
- Sheet shorthand `v` = `value`; `&&` only in conditions (panel conditions may use `||`); NOTES 6: ca09 `there` = `kit_ca09_note_up`.
- Commits so far on the branch by this builder: tests (see git log).

## Handover 4 (builder stopped at the context guard; steps 2 done, step 4 mostly done)

### Done (commits on feat/ca-living-office-w4)
- Step 2: `office_kit.py` `kit_keyed` merges a set piece's `resources` into its own row; unit test `test_set_piece_resources_reach_only_their_own_row`; 104 Python tests pass (b9ff72218).
- Step 4 kits: Tarrowby `setPieces` (`ca06_notice`, `ca09_note_on_screen`, `ca15_found_stick`), Quayholt `ca16_borrowed_login`, four `episodes.json` rows flipped (`setPiece` + `stepAway: true`), three stand-in PNGs, three `game.js` load lines (6bda5b2d6). The set pieces were generated by `gen_w4.py` (kept in the scratchpad, not in the repo) from the sheet tables; spoken lines are the VOICING text exactly; no `delivery` field on any mapping.
- Stand-in sha256 (step 6 must show the final file differs): pc1_locked_note 8f9fba0b40d49648f76b71773c185af131e7b697066f91128f0a5a6c97abaa4b (byte copy of pc1_locked); aw_notice_qr_parking1 875ec2186d0bf6986e2580cb15d00f1a0945302503a6e0b63bf95cff3e747a38 (flat paper with header bar, 16x21); usb_storage_swivel_taken 77bbaa2720604da270abfda574c185edb1801416258736f216d210484b99744f (transparent 14x6, final).
- Regenerated the four erbs with `apply_training_room.py --kit <out>` and copied them into `scenarios/<shell>/scenario.json.erb` (twins, ca03/ca08/ca19 and every other shell reported "(unchanged)"; the only rewrite warnings were the expected colleague `needs`/`needsHome`/`workNeeds`). Committed as regenerated, WITHOUT the hand edits below.

### Not done (next agent, in order)
1. Hand-edit the four erbs by text (not a json round trip), then re-run `--kit` to confirm they stay "(unchanged)":
   - `social.awarenessEpisode.strings`: insert `"stepAway": "Look up from the kiosk and carry on in the room for a minute. Someone may ask you something. Your place is saved."` as the FIRST key (before `"brief"`); no `stepAwayHeading`.
   - Delete the final pointer sentence ` Before you leave, have a word with <Chidi|Nilesh|Nilesh|Anjali>.` from the last conceptPanel text (ca06 :405, ca09 :595, ca15 :579, ca16 :638; each occurs once).
   - ca06 and ca15 `conceptPanel` is an object: wrap it as the first entry of an array. Then append conditioned entries `{heading, text, condition}` (sheet 3.6 texts, sections 4-7; plain headings with no names; conditions may use `||` but must read only the choice global): ca06 `kit_ca06_notice_choice` check / (fine||silent); ca09 `kit_ca09_note_choice` mention / (fine||silent); ca15 `kit_ca15_stick_choice` handin / lost / leave; ca16 `kit_ca16_signin_choice` (desk||silent) / lend. Test needs the conditions to contain `=== '<value>'` for every value, so write the `||` form with every value spelled out.
   - Kiosk `observationVariants[0].condition` (`globalVars.episode_<id>_defend_complete`, e.g. ca06 :1130) becomes `globalVars.kit_defend_done === true && globalVars.kit_quiet === false`.
2. Suggested debrief headings (for the caller's wording check): ca06 "What the notice was" / "Why the code mattered"? Pick plain ones, for example ca06 "Checking the notice" and "Scanning the code"; ca09 "Taking the note down" and "Leaving the note up"; ca15 "Handed to IT", "Left in lost property", "Left on the floor"; ca16 "Not lending the login", "Lending the login".
3. Commit, then run: `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle bin/test-js` (expect only the ink-dependent W4 tests to fail: host recap guard, request knots), Python office_kit tests (`python3 -m unittest test_office_kit test_apply_training_room test_office_kit_caught_verdicts test_proof5` in the awareness folder), `ruby scripts/validate_scenario.rb <erb> --strict-social --no-graph --skip-ink` on the four shells, `ruby tools/check_mapping_index_drift.rb main`.
4. Tests not yet run against the built shells: expect to tighten the loose `|| true` assertions in the last Wave 4 tests (see Handover 3), and check placement (notice, stick, drop box at x 8.35, binders at 6.47/7.75) and the claim of the `aes_clipboard` and `binders` placeholders.

### Gotchas
- ca09/ca16 colleagues carry a string `needsHome` (PC id); the generator warns "rewrites kit-owned field" the first time, which is expected.
- The ca15 `silent` value is `leave`, not `silent`.
- `type` for the notice, stick and drop box is the sprite name minus trailing digit (`aw_notice_qr_parking`, `usb_storage_swivel`, `drop_box`); if the placement test or the engine wants another, change in the kit and regenerate.
- No tests, validator or drift check have been run on step 4 yet.

## Handover 5 (step 4 finished and verified)
- Hand edits to the four erbs done (9b7ca8fe2, fixed for ca16 in 0766a94fd): `stepAway` string, host pointer sentence removed, conceptPanel arrays with choice-keyed entries (final headings from the caller), kiosk finished condition. `apply_training_room.py --kit` reports all four shells and twins "(unchanged)".
- `type` kept as sprite minus trailing digit (aw_notice_qr_parking, usb_storage_swivel, drop_box): the placement/depth tests only constrain types of table items (MOVED_TYPES) and rooms.js picks the texture from `sprite` first. Other scenarios use `usb` for the same stick sprite (14 uses, engine special-cases takeable `usb` only) and `pc` for a network drop box; neither fits a takeable:false evidence stick or a lost-property box.
- bin/test-js: only social-awareness-office-kit.test.mjs fails, 3 ink-dependent tests: #19 targetKnot ca06_notice not in zainab_hussain_ambient.ink, #57 host recap guard (ca06), #58 request knot guard (ca06 knot ca06_notice). 56 pass, 2 skipped (ca19 art pending). Two loose `|| true` assertions tightened.
- Validator on the four shells: 0 errors. Drift check: 0 failures.
- Next (step 5): inks.
