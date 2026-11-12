# m09 Sorensen door: HaX lines 403 on /tts

## Cause

A game's `scenario_data` is a jsonb column. Postgres jsonb does not keep object key order (it sorts keys by length, then bytes), so a stored game's `rooms` come back in a different order from the template's. `TtsLineExtractor#speaker_id_for` picks "the first character in scenario order" whose id or display name matches a line's prefix. Where two records share a display name ("Agent HaX": `hax_voice`/`hax_post` and the `agent_0x99` phone record), a stored game can pick another record from the one a fresh render picks. The line is then voiced as the wrong id, and the request for `agent_0x99` (or `quintero_post`, etc.) is refused with 403 "Text not found in NPC story or barks".

Nothing is wrong with ERB parameters, the ink path or the game's copy of the scenario beyond key order. Reproduced with game 1331 (m09) and by round-tripping a fresh render through `SELECT ...::jsonb`.

## Effect on main (checked read-only on main, branch main, and on the worktree; same numbers)

Fresh-render-OK lines that the stored data refuses or changes, per game:

| Mission | Games affected | Lines per game | Who |
|---|---|---|---|
| m10_full_disclosure | every game (all 15 listed, back to 31 Oct) | 46 of 2366 (quintero_post 12, kowalczyk_post 12, voltage_van 8, wendell_voice 4, victoria_line 4, nightshade_table 3, tesseract_voice 2, arakawa_post 1) | all players |
| m08_the_mole | every game (2 listed) | 2 of 442 (agent_0x99) | all players |
| m09_digital_archaeology | normal games: none (21 of 21 clean). Games 1331 and 1332 only: 31 of 397 (agent_0x99) | | see below |
| m01 to m07, sis01 to sis03, ca*, test*, lab | none | 0 | |

So yes, it affects players on main today: m10 (46 lines, played silent) and m08 (2 lines). The m09 Sorensen finding is different. In a normal m09 game the phone record and `hax_voice` both sit in `loading_dock`, array order keeps agent_0x99 first, and it wins. Games 1331/1332 were made with `tools/playtest/new-game.rb --start-room restricted_cage`, which moves the phone records into the new start room. `loading_dock` sorts before `restricted_cage` in jsonb order, so `hax_voice` wins. That is a test-tool artefact, not a player path. M10 game 1325 (start `core`) has the same artefact: 4 victoria_line lines remain after the fix.

## Fix (worktree, build/phone-calls)

- `Mission#template_room_order`: room ids from the rendered template, cached per template mtime (like `current_voice_configs`).
- `TtsLineResolver.in_template_order(scenario_data, room_order)`: returns the scenario with `rooms` back in template order (rooms the template lacks go last; no-op when already in order).
- `GamesController#tts_scenario_data` feeds that to `TtsLineResolver` and to `ink_delivery_note`'s extractor.

No audio key moves: the key dump (`tools/phone_calls/dump_tts_keys.rb`, fresh renders) is identical before and after (`diff -r`, 28 files). With the fix, all stored games of m08, m09 and m10 resolve identically to a fresh render except the start-room-moved games above.

Overlap with the A1 fixer: none in the extractor or phone-chat JS. The touch points are one `scenario_data:` argument in `GamesController#tts`, and the `ink_delivery_note` call. Merge conflicts, if any, will be in those two lines.

## Options not taken

- Make `speaker_id_for` order-independent (prefer the host's own record, or prefer a phone/voiced record), which would also fix the start-room artefact. It moves speaker choice in the batch too, so it could move keys. Left for the extractor owner.
- Make `new-game.rb --start-room` leave phone records in place (or insert them first). Cheap, and stops proof games from hitting the artefact.

## Tests

- `test/unit/break_escape/tts_stored_room_order_test.rb`: round-trips real m10 and m08 renders through Postgres jsonb, asserts the stored data refuses the co-speaker line (the bug), and that `in_template_order` restores it; unit tests for the helper and `Mission#template_room_order`.
- TTS suite (`tts_controller_test`, `*tts*`, `ink_*`): 186 runs, 0 failures.
- Survey runner: scratchpad `survey.rb` / `survey2.rb` (read-only, every mission's latest game; all games for m08/m09/m10).
