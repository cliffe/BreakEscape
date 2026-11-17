# m07 office life: slice 3 live checks

Run 2026-11-17 on branch build/ol-m07 (worktree p-ol-m07). Headless Chromium, `game.loop.setFPS(20)`, fixed steps on, no manual clock, no globals or needs set in the page. Keyless server on port 3098 (boot warning "GEMINI_API_KEY environment variable is not set" confirmed in the log); puma PID 2217174, stopped at the end and port 3098 confirmed closed.

Probe: `tools/playtest/m07-ol-s3.mjs` (new in this run; modes `l1`, `trip`, `talk`, `ex`, `walk`). Output per game in the worktree's `tmp/s3/`, screenshots `tmp/m07-s3-<name>-<gameId>.png` (not committed).

Game 7687 is exploratory (dump probe and one smoke run). It is not counted for any check. Every other game below was created fresh with `tools/playtest/m07-ol-ng.sh`.

## Results

| Check | Result | Games |
|---|---|---|
| L1 first entry, seated 45 s | Pass, with a limit (see below) | 7689, 7692, 7698, 7702, 7707 |
| L2 natural cooler trip together | Partial: both reach `using` at the cooler, not together | 7711, 7717, 7725 |
| L2 after talking to Adaeze or Gwen | Not run: blocked (see Talk) | 7732, 7737, 7744, 7751 (not valid) |
| L3 exchanges | Not run | none |
| L4 talk lines | Not run: blocked | 7737, 7744, 7751 (blocked) |
| L5 walk west, desk, east | Not run (probe mode written, not run) | none |
| L6 server room, operators hidden | Not run | none |
| L8 coffee station | Partial: no coffee text in any probe output | all |
| 10.3 reload | Not run (the probe mode was dropped in the rewrite) | none |
| 10.4 attack probe | Not run | none |

## L1: first entry, seated 45 s (pass, with a limit)

Five fresh games (7689, 7692, 7698, 7702, 7707), each sampled once a second for 45 s from `enterRoom('operations_floor')`.

- Both operators `atPost: true` and `seat: true` (`npcBehaviorManager.getBehavior(id)._seat` set) in every sample. Adaeze at about (448, 160), Gwen at about (384, 160), with 1 to 3 px drift.
- No job, no `talking`, no minigame open in any sample.
- Needs log since entry: only `registered` for both at 28 s.

Limit: the probe enters through the bridge's `enterRoom`, which opens the checkpoint door directly. It does not take the walkthrough route. The HaX line, the Architect's call and the RFID text are triggered by that route, and this probe does not read phone or chat state, so those three items were not observed. "No chatter" is checked only as "no minigame and no job"; bubbles were not measured.

## L2: natural trip (partial)

Games 7711, 7717, 7725. No forced need: the trip starts on Adaeze's own thirst.

- 7725 (full log): Adaeze `job use, phase using` at (402, 244) at t85. Gwen starts `goto_target` at t87 and is `using` at (441, 241), her second cell east of the cooler, at t92. Gap about 7 s. Gwen did not walk alone, and Adaeze did not go twice without her.
- 7711 and 7717: Adaeze `using` at (402, 244) at t85. Gwen starts `goto_target` at t87 (2 s after Adaeze is using). Her arrival was not logged.
- `no_beside_cell` count 0 in all three games. Probe errors: none.

Verdict: both reach `using` at the cooler on the natural trip, but not together. The design target is together, so this is a partial pass. The 7 s gap is the number to look at.

## L2 and L4: talk (blocked, not run)

- 7732: the first `interact` returned `blocking-ui` at about 2 s, so the chat closed at 5 s with no lines. Not a valid first talk. A later `interact` succeeded, and the second chat showed an opener, a choice line ("1. Don't let me hold you up.") and a goodbye ("Thank you. I'll shut this down and go."). Not counted as L4 because the first talk did not happen.
- 7737 (Adaeze), 7744 (Gwen), 7751 (Adaeze): a blocking UI stayed up for the whole 240 s wait. `interact` kept returning `blocking-ui`. Dismissing with Enter and Escape did not clear it. The blocking value was not recorded.

Next step: print `window.__test.getState().blockingUi` once at 5 s and once at 120 s in a talk run, to name it. The likely cause is a scripted ops-floor beat, which the walkthrough route would clear, but that is not confirmed.

## L8: coffee station (partial)

No probe output contains "coffee", across all L1, trip and talk runs. The needs logs only ever show `registered`, so this is weak evidence. A full scan of the needs log is still to do.

## Not run

- L3: no run. The `ex` mode is written, but it was not reached in the time budget.
- L5: the `walk` mode is written, not run.
- L6: not scripted. It needs the walkthrough route through the checkpoint and the Contractor Badge, not `enterRoom`.
- 10.3 reload: the reload mode was dropped in the rewrite of the probe. Not run.
- 10.4 attack: no probe written.
- L2 after talk, L4 talk lines: blocked as above.

## Engine facts noted while probing

- `window.__test` has no `converse` or `room()`. Dialogue opens with `interact(id)`, then the minigame steps (the m01 lib's `converse`). `doorways(roomId)` gives door ids.
- `needs.state(id).job` has `objectId` null. The cooler is identified by position, not by target id.
