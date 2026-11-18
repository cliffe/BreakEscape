# Vance phone call recheck (17 November 2026)

Verdict: harness problem, not a game bug. The call in game 7985 did not freeze. The `converse` command ended it.

## Evidence

- In the stuck run (seq 74 to 77 of `tools/playtest/m04_critical_failure-session-g7985.jsonl`) the harness sent `converse` with `["night crew","Not yet","Sound it","That.s everything"]`. It picked "The night crew in Hall 2" (`turns: 1`, empty transcript) and then closed: `closed: {stillOpen: true}`, `reason: still-open-after-close`. That close pressed End call. The thread then shows the call record "Outgoing call, 0:19" and the `start` stub's only choice, "(Close.)". The 0:19 was a finished call's duration, so it could not tick. `waitFor minigameClosed` timed out because the phone thread view stays open after a call.
- The HaX call at seq 64 to 67 ended the same way ("Incoming call, 0:33" in the HaX thread, `still-open-after-close`).
- Fresh game 8037, same route by manual steps (below): the Vance hub lists "The night crew in Hall 2. Can you get them out?" as option 3. After it, the cost speech ("Half an hour, maybe...") is followed by "1. Sound it. Get them out." and "2. Not yet." on screen, with the timer running (0:52, 0:55, 0:58). "Sound it" gives "Sounding it now. They're moving. Nine of them..."; globals `crew_warned_early` and `aes_staff_evacuated` are set. Matches `m04_phone_robert_vance.ink` (`support_hub` line for crew_offer, `crew_offer` then `crew_offer_choices`, `crew_sound`) and LIVE_PROOF_4 check 1.
- A second call placed with `converse ["How bad"]` kept re-picking the sticky "How bad is it?" hub choice for over two minutes (`cmd.sh` timed out at 120 s) and ended the call. `converse` is the wrong tool for phone calls.
- The ink needs no state beyond `anomaly_detected` (dial read) and `not crew_warned`. Nothing about the HaX call gates it.

Screenshots: `screenshots/vance_call_1_hub.png` (hub, six options), `vance_call_2_cost_offer.png` (cost speech with Sound it / Not yet), `vance_call_3_after_sound_it.png` (after Sound it), `vance_call_4_converse_ended_call.png` (after `converse`; thread back at the stub).

## Driving recipe for calls

Do not use `converse` on a phone call. Use `mg` and read the state between picks.

1. `{"cmd":"openInventoryItem","item":"phone"}`. After the dial in Hall 1, wait about 10 s for the HaX banner.
2. HaX: `{"cmd":"mg","action":"clickControl","args":["Answer"]}`, wait about 6 s, then `{"cmd":"mg","action":"clickText","args":["Then where do I start"]}` (the only option; it appears about 8 s after Answer). Wait about 6 s until `getState` text shows the contact list ("Incoming call, 0:48"). Do not close it.
3. Vance: `clickText ["Robert Vance"]` (opens the thread, which shows the Call button and "(Close.)"; that stub is normal), then `clickText ["Call"]`.
4. Poll `{"cmd":"mg","action":"getState"}` until `dialogue.choices` lists the hub (about 6 s). `clickText ["The night crew in Hall 2"]`. Poll again about 3 s later: the choices are "Sound it. Get them out." and "Not yet." (`controls` labels "1. Sound it..." and "2. Not yet.").
5. `clickText ["Sound it"]` (or `["Not yet"]`, which returns to the hub, then repeat step 4). End the call with `clickText ["everything for now"]`; the call record appears in the thread.
6. Rule: one `clickText`, then poll `getState` until `dialogue.choices` is non-empty or the text ends with a call record. Never batch picks.

## Other harness notes

- New game: `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3097 bin/rails runner tools/playtest/new-game.rb m04_critical_failure` (the bare `ruby` form fails with `uninitialized constant BreakEscape`).
- Tutorial modal: `{"cmd":"dismiss","label":"FIGURE IT OUT"}` (label is a substring of the button text; an apostrophe in the regex does not match). Dismissing it starts the guard conversation, so continue with `converse` without an `id`.
- Loop: Phaser TimeStep has no `setFPS`. Set `L=window.game.game.loop; L.fpsLimit=20; L.hasFpsLimit=true; L._limitRate=50`. Arcade `physics.world.fixedStep` stayed true (fps 60). Done in game 8037 via `eval`.
- The voiced call has no audio on the keyless server, but the call timer runs in real time and options appear after the line reveal, not instantly.

Game used: 8037 (made by new-game.rb for this check, session stopped). Server :3097 untouched. Nothing in scenarios or ink edited.
