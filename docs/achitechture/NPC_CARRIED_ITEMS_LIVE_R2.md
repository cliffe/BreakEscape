# NPC carried items: R2 live proof

Branch `build/ol-carry` at `4ddee1096` (main merged, R2 fixes in `cf15812c5`). Keyless server from the worktree on port 3091 only, scenario `test_needs_sims`, one fresh game per beat, headless, setFPS(20) with fixed steps on.

## Suites

- `bin/test-js`: 680 files passed, 0 failed (includes validator-schema-known-keys; no schema registration was needed).
- Rails: `npc_carried_items_test`, `forged_ko_drop_test`, `models/game_test`, `controllers/reload_persistence_test`: 216 runs, 900 assertions, 0 failures, 0 errors.
- `bundle exec rubocop`: 368 files, no offences.

## Commands

    env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails server -b 127.0.0.1 -p 3091
    bundle exec rails runner tools/playtest/new-game.rb test_needs_sims   # one per beat
    node tools/playtest/npc-carry-live-proof.mjs <gameId> 3091 <consume|drop|ko> <out.json>

## Results (HTTP statuses of update_room posts)

| Beat | Game | Requests | Page errors |
|---|---|---|---|
| consume | 5574 | carry_object 200, consume_carried 200 | 0 |
| drop (suspend mid-carry) | 5575 | carry_object 200, put_down_object 200 | 0 |
| ko (KO while carrying) | 5576 | carry_object 200, update_npc_state 200, ko_drop_carried 200 | 0 |

Totals: every request 200, 0 remove_object, 0 x 422.

- consume: no mug in office, kitchen or Grace's hands after the consume; none after reload.
- drop: one `office_mugs` in the office after the put-down; after reload still exactly one, client at (144, 140).
- ko: Grace KO'd in the office; exactly one `office_mugs` on the office floor, none in Grace's hands or the kitchen; after reload still exactly one, client at (192, 223).

The KO position of Grace herself was not captured separately before and after the reload; the proof checks the dropped mug and that the NPC state call returned 200.
