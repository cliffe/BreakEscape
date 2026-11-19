# Live proof: an exchange is heard from its first overheard line

The proof ran on m04_critical_failure, not on test_needs_sims; the note sits here beside the other exchange proofs. Round 1 review fixes were proved separately (section at the end).

Branch fix/exchange-heard-on-first-line. Keyless server on port 3094, m04_critical_failure, headless browser at 20 fps with fixed steps, TTS blocked. Setup as in the office-life sweep probe: vance_met then vance_provided_keycard (kettle opens), player into operations_office with `__test.enterRoom`, thirst and caffeine of both staff set to 5 every 40 s. Exchange under test: `ex_not_on_the_rota` (4 lines, Ibrahim and Joanne). A fresh game for each case.

| Case | Game | Result |
|---|---|---|
| No reload | 9694 | `heard_ex_not_on_the_rota` was true at line 1. All four lines played. `npc_exchange_heard` fired once at the finish. (This row predates review round 1, which moved the event to the first overheard line; the line-1 event proof follows.) |
| Reload 1.5 s after line 1 | 9707 | Flag true before the reload and true after it (read back from the server). Over the next 200 s of game time no line of the exchange played again (a different exchange, `ex_stay_out_of_the_halls`, played instead). |
| Reload 1 s after line 4 began, before the finish | 9708 | All four lines had played, `npc_exchange_heard` not yet fired, flag true. After the reload the flag was true and the exchange did not play again in 200 s. |

An earlier attempt on game 9695 saw no exchange in 600 s of game time (the pair did not meet) and was discarded; no reload was done in it.

Sync: the flag goes through `world.setGlobal`, the existing scalar writer, once per knot (`_markExchangeHeard`, guarded by `_exPlayed`). A unit test pins one write of `heard_<knot>` per exchange, none at later lines, the finish or the next meeting. No list, set or array was added to player state.

The probe is not committed (tmp/exh/probe.mjs).
