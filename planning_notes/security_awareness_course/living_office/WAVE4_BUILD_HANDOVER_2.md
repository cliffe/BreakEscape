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
