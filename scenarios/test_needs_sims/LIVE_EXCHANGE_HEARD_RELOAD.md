# Live proof: an exchange is heard from its first overheard line

The proof ran on m04_critical_failure, not on test_needs_sims; the note sits here beside the other exchange proofs. The line-1 event after the round 1 fixes was proved separately (section at the end, "Round 2 proof").

Branch fix/exchange-heard-on-first-line. Keyless server on port 3094, m04_critical_failure, headless browser at 20 fps with fixed steps, TTS blocked. Setup as in the office-life sweep probe: vance_met then vance_provided_keycard (kettle opens), player into operations_office with `__test.enterRoom`, thirst and caffeine of both staff set to 5 every 40 s. Exchange under test: `ex_not_on_the_rota` (4 lines, Ibrahim and Joanne). A fresh game for each case.

| Case | Game | Result |
|---|---|---|
| No reload | 9694 | `heard_ex_not_on_the_rota` was true at line 1. All four lines played. `npc_exchange_heard` fired once, then at the finish. (This row predates review round 1. The event now fires at the first overheard line, line 1, not at the finish; the "Round 2 proof" section below records that.) |
| Reload 1.5 s after line 1 | 9707 | Flag true before the reload and true after it (read back from the server). Over the next 200 s of game time no line of the exchange played again (a different exchange, `ex_stay_out_of_the_halls`, played instead). |
| Reload 1 s after line 4 began, before the finish | 9708 | All four lines had played, `npc_exchange_heard` not yet fired, flag true. After the reload the flag was true and the exchange did not play again in 200 s. |

An earlier attempt on game 9695 saw no exchange in 600 s of game time (the pair did not meet) and was discarded; no reload was done in it.

Sync: the flag goes through `world.setGlobal`, the existing scalar writer, once per knot (`_markExchangeHeard`, guarded by `_exPlayed`). A unit test pins one write of `heard_<knot>` per exchange, none at later lines, the finish or the next meeting. No list, set or array was added to player state.

The probe is not committed (tmp/exh/probe.mjs).

## Round 2 proof: the event at line 1

Exchange `ex_not_on_the_rota` (m04_critical_failure, 4 lines). Branch HEAD at the runs: `ae1e17409`. Keyless server on port 3094, a fresh game per case, TTS blocked.

| Case | Game | Events | Line showing at emit | Flag `heard_<knot>` | Replay | Console errors other than /tts |
|---|---|---|---|---|---|---|
| 1, no reload | 9785 | 1, at clock 110250 | `ex_not_on_the_rota:0` (line 1) | true at emit and at the end (154750) | None. All 4 lines played (0 at 110250, 1 at 115000, 2 at 119750, 3 at 124750) | 0 |
| 2, reload 1.5 s after line 1 | 9790 | 1 before the reload (clock 106500); 0 after it, over 200 s of game clock (reached 206000) | `ex_not_on_the_rota:0` (line 1) | true at emit, after the reload and at the end | None. No lines and no event after the reload | 0 |
| 3, reload during line 4 | 9800 | 1 before the reload (clock 109500); 0 after it, over 200 s of game clock (reached 206250) | `ex_not_on_the_rota:0` (line 1); the reload came with lines 1 to 4 already shown (line 4 started at clock 124000) | true at emit, after the reload and at the end | None. No lines and no event after the reload | 0 |

All three cases pass: exactly one emit per game, at line 1, with the flag already true, and nothing replays after a reload.

Notes:

- The only failed request that was not TTS was the music file `Midnight%20Cipher%20Beta.mp3`, aborted by the page reload (seen by `requestfailed`, not a console error).
- `new-game.rb` regenerates the m04 and m07 dungeon-graph files (`scenarios/m04_critical_failure/dungeon_graph.{html,md}` and `scenarios/m07_architects_gambit/dungeon_graph.{html,md}`) on every game creation. The runner restored them with `git checkout` after each creation. Regenerated graph files are not committed.
- After the reloads the exchange did not resume. That is what the probe saw; it was not checked against the engine.
- The probe is not committed (`tmp/exh/probe3.mjs`).
