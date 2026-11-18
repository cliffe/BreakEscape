# m08 chatter-pool gate: live proof

R4 rerun (after the console text fix and the added phases e and f): games 9393 (phases a to e) and 9394 (phase f), both fresh. The first run used game 9325 with the Julian-only phases; its numbers are superseded by the table below. Games made with `tools/playtest/new-game.rb m08_the_mole --start-room operations_floor` (a test-only head start on that game's own row). Keyless server on port 3094 from the worktree, killed by PID afterwards. Headless Chromium, `throttleFps(20)` with fixed steps on, TTS blocked by pathname. Probe: `tools/playtest/m08-chatter-gate-proof.mjs`. Each phase ran 150 s of game clock, with both officers' thirst level set to 5 every 40 s so trips repeat (the needs system's own `needs.set` lever).

## How each state was set

- Officers shown: `found_badge_audit` true, written to `gameState.globalVariables` with the `global_variable_changed` event (the same writes as a mapping `setGlobal`). Not earned by play.
- Upset: `ops_watch_upset` true by the same route. Not the real trigger (attacking an officer).
- KO: `julian_ko` true by the same route. Julian was not physically knocked out. This fires the new `agent_0x99` mapping that sets `ops_watch_ko`.

## Results (R4 rerun)

| Phase | game | upset | ko | cooler off | cooler uses | officer speech | npc_chatted |
|---|---|---|---|---|---|---|---|
| a not upset | 9393 | false | false | false | 8 (4 each) | 6 lines | 6 |
| b upset | 9393 | true | false | false | 8 (4 each) | 0 | 0 |
| d reload, upset kept | 9393 | true | false | false | 8 (4 each) | 0 | 0 |
| c `julian_ko` | 9393 | true | true | true | 0 | 0 | 0 |
| e reload, ko kept | 9393 | true | true | true | 0 | 0 | 0 |
| f `agnieszka_ko` from clean | 9394 | true | true | true | 0 | 0 | 0 |

- (a) Six lines heard: exchange lines plus the gated cooler pools ("Water. Coffee's in the wrong room.", "I wrote the time I came for water.", "Long night. They're all long on Red."). First trip began at 11 s.
- (b, d) Trips continued at the same cadence as (a), silently, before and after a reload. The server kept `ops_watch_upset` and `found_badge_audit`.
- (c) After `julian_ko`, `ops_watch_ko` read true and `_isOff(ops_cooler)` returned true. No `npc_use_started` or `npc_used` in 150 s.
- (e, n2) After a page reload with `ops_watch_ko` true, the server kept it (`ko` true, `upset` true), the cooler was still off, and there were no uses or speech in 150 s.
- (f, n3) On a fresh game: before the KO, upset false, ko false, cooler on. After `agnieszka_ko`, upset true, ko true, `julian_ko` false, cooler off. No uses or speech in 150 s. This is also the clean upset-to-KO sequence that phase c (which began upset) could not show.

## Duty console while upset (R4 m1)

The probe sampled the console every 5 s: its resolved read text, `julian_console_owner_away`, `julian_console_screen_locked`, and the claimable state (owner away and screen not locked, which is what the amber emitter and the pc-session claim read).

| Julian | upset | screen locked | claimable | read text starts |
|---|---|---|---|---|
| at post | true | false | no | "The console has been snapped to the lock screen." |
| at the cooler | true | false | yes | "NIGHT WATCH CONSOLE. Signed in: J. SALLOW, duty officer." |
| at the cooler | true | true | no | "J. SALLOW -- SESSION LOCKED." |

The three signals now agree in every sampled state (phase b showed the first two rows, phase d all three, 30 samples each). The upset lock-screen text no longer shows while Julian is away and the console can be claimed. With the officers at post and upset, the text says locked and the console is not claimable. Not exercised live: the actual sign-in click, which the unchanged pc-sessions code gates on the same two globals.

Caveats: all states are set by global writes, not by attacking or knocking down an officer. Julian and Agnieszka were not physically knocked out. Phase a on game 9393 followed an aborted earlier probe attempt that had already set `found_badge_audit` on that game.
