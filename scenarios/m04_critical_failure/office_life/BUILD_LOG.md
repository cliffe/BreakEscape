# m04 office life: build log

## Slice A (scenario data, ink, static checks; no live server)

Built to PLAN sections 2.2 to 2.14, 3, 6, 7, 8 on the plan's picks. Estimated cells stay estimates (slice B measures): posts (6.7,7.47) and (7.47,7.47); cooler `useFrom` dx 0, dy 1; kettle `useFrom` dx 0, dy 2.

| Check | Result |
|---|---|
| Validator | (first run) 8 errors, 33 warnings (baseline 0 errors, 25). All 8 errors are one rule: exchange lines over 40 characters of spoken text (`validate_npc_needs.rb:715`, `:941`), in `ex_six_oclock`, `ex_not_on_the_rota` and `ex_stay_out_of_the_halls`. The sample's wording was kept as instructed; it needs shortening or a rule exemption (user decision) |
| New warnings (+8) | V4 on both newcomers (expected); caffeine target in another room than home, both newcomers (expected, kettle is in the ops office); `reception_cooler` chatter 'cooler' has no lines and needs capacity 2 (the preset supplies the pool name; plan says the cooler sets none, so accepted); onceOnly wiring notes on `agent_0x99` for `crew_warned` and `racks_vented` (new evacuation mappings meant to fire together with the existing ones) |
| `room_entered:*` | accepted, no message; per-room fallback not needed |
| `--office-summary` diff | only `ibrahim_diallo` and `joanne_pell` added (`v1_summary_build.txt`) |
| `lock_key_diff.rb` vs baseline | empty |
| Positions diff | only `reception_cooler` and `ops_kettle` rows added. The one-liner prints no NPC rows (no `itemsHeld`), so the two NPCs do not show |
| dialoguelint | new ink clean; debrief one warning at L294, pre-existing |
| tagdiff (debrief vs HEAD) | only the two VARs and the head-count condition |
| reopencheck (missions.json, m04) | 0 problems |
| `m04_routes` | 27 pass, 13 fail; the same 13 fail on an untouched HEAD checkout (pre-existing) |
| `bin/test-js` | not finished within 100 s; not run to completion |


Slice A follow-up (orchestrator): the ten exchange lines were rewritten to at most 40 characters of speech, `DIALOGUE_SAMPLE.md` and `SPOKEN_LINES.md` updated, Ibrahim's ink recompiled. Validator: 0 errors, 33 warnings.

## Slice B (live measurements, keyless server :3097, headless, 20 fps fixed step)

All numbers below are measured unless marked otherwise. Method: fresh game per run from `tools/playtest/new-game.rb` (games 7666 to 7693 for the earlier posts, cooler and clock measurements; 7699, 7714 and 7729 for the kettle runs on the edited scenario), body centres read from `sprite.body.center`, needs state polled from `window.__test` and the needs system, event times from `npc_left_post`, `npc_use_started`, `npc_used` and `npc_returned_post`. The kettle runs reach the state by the real route (talk to the keycard NPC, clone his card, which clears `ops_kettle_off`), go to the SCADA room and back to fire the mapped kettle break, and park the player at (250, 330), clear of the door lane.

- Sofa posts (edited into `position` and `needsHome`): Ibrahim x 6.72, Joanne x 7.47, both y 7.81. Fresh game 7699 and 7729: both NPCs seated at body centres (215.0, 250.0) and (239.0, 250.0), as predicted.
- Cooler (earlier runs): Joanne `using` at body centre (270.7, 212.8) for 11.7 s; guard 92.7 px away; `useFrom` dx 0, dy 1 unchanged.
- Door: one doorway at world (48, 288), gap x 32 to 64.
- Needs clock: 120 real s gave 120.0 clock s; decay 1.5 per minute stays.
- Kettle `using` cells, body centres (world): first user cells x 205.8 to 211.7, y 372; second user cells ranged x 205.9 to 240.6, y 372 to 382.8 (seen: (240.6, 372.2), (226.5, 381.7), (226.9, 381.5), (219.1, 382.8), (239.2, 372.8), (205.9, 372)). The kettle sprite is at (203, 300), so every cell is 72 to 83 px south of it, which is the two-tile `useFrom` plus the counter.
- Distances: to Vance (160, 480): 117 to 135 px (first-user cells 117 to 119). To the reception doorway (48, 288): 179 to 210 px. The nearest cell to the door lane (x 32 to 64) is 142 px east of it. No cell was blocked, none was inside another sprite, and none touched Vance's tile, so `useFrom` stays dx 0, dy 2; no scenario change was needed.
- Pair overlap at the kettle (clock seconds, from `npc_use_started` to the earlier `npc_used`): 19.3 s and 19.5 s (game 7699, two breaks), 23.7 s and 23.7 s (games 7714 and 7729). Four pair uses measured, not five; a fifth in 7729 was cut off by the probe's loop. A single use is 25 s (`useSeconds`). The second user leaves post 0.7 to 5 s after the first and starts using 2.8 to 7.5 s after the first starts.
- A forced second break did not always pair: in game 7714 break 1 and game 7729 break 1 the second NPC left post some 30 s after the first, so those had no overlap. The natural trigger (return from the SCADA room) paired in 7699 and 7729.
- Screenshot of the pair at the kettle: `screenshots/kettle_pair.png` (game 7729, both `using`, speech bubble visible). The two stand shoulder to shoulder with the sprites slightly overlapping (body centres 16 px apart in x, 10 px in y); readable, left as is.

Static checks after the posts edit: validator 0 errors, 33 warnings (unchanged from slice A); `lock_key_diff.rb` vs `baseline_locks.json` empty (regenerated `dungeon_graph.html` and `.md` reverted with `git checkout`); `--office-summary` diff vs `v1_summary_base.txt` is only the two added NPCs (identical to `v1_summary_build.txt`); positions diff vs `positions_base.txt` is only the added `reception_cooler` and `ops_kettle` rows.

Probe script (reaches the kettle state and measures pairs): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/kettle.mjs <game id>` (needs `lib.mjs` beside it).
