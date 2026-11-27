# m10 office life: build log (slice A built, slice B live measurements in LIVE_B1.md and LIVE_B1B.md)

## Done (uncommitted checks pending)
- ink/m10_fp_support.ink compiled to .json; m10_six_oclock.ink edited (2 conditions, 2 VARs) and recompiled. dialoguelint clean; tagdiff vs HEAD shows only those 6 structural differences.
- room_m10_forward.json: second-kit crate id 41 (x 256, y 292) on `tables`, kettle1 gid 834 id 42 (x 265, y 284) on `conditional_table_items`, nextobjectid 43.
- scenario.json.erb: voices fp_darren/fp_sofia in the voice table, NPCs darren_price and sofia_marchetti after `citadel` (scenario.json.erb:2607 on), fp_kettle at end of forward_post objects, three globals, seven onceOnly mappings at end of agent_0x99, credits entries in both credits_sections.json and the ERB heredoc.
- Deviation: needsHome x/y are TILE units in the engine (`tileToWorld` = room origin + x*32), not pixels as PLAN first said (PLAN now corrected). Measured homes: Darren 8.625/8.375 and Sofia 9.625/8.375 tiles, i.e. (276,268) and (308,268) px; position equals needsHome. `behavior.hostile.chaseRange` is 32 on both (LIVE_B1B.md item 5: the table's items are reachable from cells 17 to 28 px from the extras, so no range clears the table; 32 keeps a struck extra within a tile of its post).
- Voice style lines: now end "Calm and quiet, as at three in the morning; no urgent wording." (unvoiced, so no audio cost).
- fp_kettle useFrom {dx 0, dy -0.1}; use cells measured at (276,268) and (308,268) px (LIVE_B1.md item 2).

## Static checks (slice A checks pass, 17 Nov 2026)
1. Validator now: 0 errors, 67 warnings (was 64 at baseline). Original slice A run: 6 errors, all fixed by shortening the exchange lines (fcd50438e). The six were exchange lines over the 40-character bubble cap (`scripts/validate_npc_needs.rb:715`, `:940`; length counted without the speaker prefix). Lines (see SPOKEN_LINES.md): ex_fp_kettle_on lines 1, 2, 3 (44, 46, 48), ex_fp_radios line 2 (44), ex_fp_door_open lines 2, 3 (47, 44). The plan's rule of 40 applies to exchanges too, so these need shortening (ink and recompile) before the build can pass. Fix made: the three `heard_ex_fp_*` keys were not declared; added as `false` after `fp_sofia_ko` in `globalVariables` (plan section 7 counts them). That removed 3 warnings.
   Warnings above baseline (3): `fp_kettle` has officeType but no `officePresets` (expected: plan section 2.7 hand-writes the one affordance and refuses the flag); V4 attackable needs NPC for darren_price and sofia_marchetti (expected until the live attack probe passes). No `validator_info_lines.txt` change: baseline has no info lines; the two new info lines are the needs timings for the two caffeine users via `fp_kettle` (T1 10.0/24.0 min, P 23.33/28.0 min, restores 70).
2. `--office-summary` block diff vs v1_summary_base.txt: header 75 to 77 NPCs, plus exactly the darren_price and sofia_marchetti rows (post forward_post, leash rooms=forward_post, needs=caffeine, groups=fp_support, chatter=4, exchanges=3). The summary has no machine rows; the affordance shows only in the needs info lines, and those name only `fp_kettle`.
3. `lock_key_diff.rb` vs baseline_locks.json: empty (before and after the globals fix). dungeon_graph.* regenerated, not staged.
4. Positions one-liner vs positions_base.txt: one new row, `["forward_post","fp_kettle","kettle","as-type:kettle"]`.
5. ERB render: the credits_fragment check (`scenario.json.erb:1230`, raises on mismatch) passes in every render above.
6. V6 (`app:break_escape:tts:office_lines[m10_full_disclosure]`, keyless, read only): 33 clips, 18 uncached (690 of 1364 characters). New: Despina en-GB (Sofia) 10 clips, Orus en-GB (Darren) 8 clips, all uncached: 8 pool + 10 exchange. The other 15 clips are existing cached barks. Exchange lines are keyed under the speaker's own voice (Darren's under Orus, Sofia's under Despina), with the "Darren Price: " / "Sofia Marchetti: " prefix stripped (the report text shows no prefix; `tts_line_extractor.rb:41` to `:42` CLIENT_STRIP_PREFIX, `:348` `InkLineWalker.split_prefix` in `voiced_as`, and the prefix resolves the speaker at `:388` to `:391`). No `#delivery` is applied to exchange keys (`tts_office_lines.rb:11` to `:16`). The 6 conversation lines are person-chat clips and are not in V6 (`person_chat_keys`).
7. Prefixes: every exchange line carries "Darren Price:" or "Sofia Marchetti:", matching displayName exactly (`scenario.json.erb:2610`, `:2644`). ex_fp_radios (ink:69) and ex_fp_door_open (ink:76) open with Sofia.
8. inkcheck (talk_darren, talk_sofia, three ex_ knots): clean. loopcheck on talk_darren and talk_sofia: no runtime errors over 200 steps x 6 strategies. dialoguelint on the ink: no findings.

## Review fixes (build review R1)
- Pool lines: Sofia "Soup's in the flask, if anyone wants it." (40), Darren "I've run the lamp off a spare battery." (38).
- chaseRange 32 on both extras; fp_kettle `_comment` gives the measured use cells; PLAN.md needsHome corrected to tiles and section 2.1 rewritten with the measured distances; SPOKEN_LINES.md refreshed; DIALOGUE_SAMPLE.md written (wording and voicing unapproved).
- Validator 0 errors / 67 warnings; lock/key diff empty; positions diff: one new row.

## Still open
- Live proof of L2, L3 beyond the Netherton path, L4, E1 to E3, reload and the attack probe (LIVE_B1.md; the live-proof slice).
- The user's yes on the wording (DIALOGUE_SAMPLE.md), then a separate yes on voicing.
