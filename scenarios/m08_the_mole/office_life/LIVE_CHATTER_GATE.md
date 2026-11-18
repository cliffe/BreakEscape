# m08 chatter-pool gate: live proof

Game 9325, made with `tools/playtest/new-game.rb m08_the_mole --start-room operations_floor` (a test-only head start on that game's own row). Keyless server on port 3094 from the worktree, killed by PID afterwards. Headless Chromium, `throttleFps(20)` with fixed steps on, TTS blocked by pathname. Probe: `tools/playtest/m08-chatter-gate-proof.mjs`. Each phase ran 150 s of game clock, with both officers' thirst level set to 5 every 40 s so trips repeat (the needs system's own `needs.set` lever).

## How each state was set

- Officers shown: `found_badge_audit` true, written to `gameState.globalVariables` with the `global_variable_changed` event (the same writes as a mapping `setGlobal`). Not earned by play.
- Upset: `ops_watch_upset` true by the same route. Not the real trigger (attacking an officer).
- KO: `julian_ko` true by the same route. Julian was not physically knocked out. This fires the new `agent_0x99` mapping that sets `ops_watch_ko`.

## Results

| Phase | upset | ko | cooler off | cooler uses | officer speech | npc_chatted |
|---|---|---|---|---|---|---|
| a not upset | false | false | false | 8 (4 each) | 5 lines | 5 |
| b upset | true | false | false | 8 (4 each) | 0 | 0 |
| d reload, upset kept | true | false | false | 8 (4 each) | 0 | 0 |
| c KO | true | true | true | 0 | 0 | 0 |

- (a) Lines heard: two exchange lines (`ex_relief_handover`), "Water. Coffee's in the wrong room." and "I wrote the time I came for water." (the gated cooler pools), plus one more exchange line. First trip began at 11 s, uses completed at 29 to 148 s.
- (b) Upset set at the start of the phase. Trips began at 161, 201, 241, 281 s and used completed through 299 s: the same cadence as (a), silently.
- (d) After a page reload the server kept `ops_watch_upset` and `found_badge_audit`. Trips continued (first at 15 s), nothing spoke.
- (c) After `julian_ko`, `ops_watch_ko` read true and `_isOff(ops_cooler)` returned true. No `npc_use_started` or `npc_used` in 150 s.

Caveat: phase c began with upset already true, so it shows the cooler switching off on `ops_watch_ko`, not upset-to-KO sequencing from a clean state. Upset alone left the cooler on (phases b and d), and `ops_watch_ko` alone is only ever set with the KO mapping.
