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

## Talk failure: diagnosis and rerun (17 Nov 2026)

Cause of the 240 s `blocking-ui` in games 7737, 7744 and 7751: the probe, not the scenario or ink. Two separate things.

1. On first ops-floor entry the Agent HaX phone bark ("The checkpoint guard is bought...", class `npc-bark npc-bark--phone`) is the blocking UI at about 2 s. Expected. The probe dismissed it with Enter then Escape (`dismiss` in the m01 lib). Escape opens the pause menu, so `blockingUi` became `game-menu-overlay` ("PAUSED ... Resume"), and every later Enter/Escape pair toggled it open again for the rest of the 240 s. Game 7767 printed both values (bark at t2, pause menu from t9 on). Fix: the talk mode now clears the blocker with `__test.dismissBlockingUi()` only and prints `blockingUi` (tag, id, class, text) and the open minigame. With that, the bark clears by t4 (game 7774).
2. First talk not opening (7732, and Gwen in 7779 and 7789): `interact('gwen_pritchard')` returned ok with `targetUnverified: true`, confirmed only by the `architect_contact` global event, and the chat never opened; a screenshot showed the chair bark "A chair." Gwen's chair (`operations_floor_chair-grey-1_7`, 40 px box centred x 364, seatedBy gwen_pritchard) overlaps the bridge's aim point (383, 122), her sprite centre column; the chair box spans x 344 to 384 and wins the click at equal depth (165.5). Clicking her body at x 395 opens the chat (game 7793). Adaeze's aim point happened to clear her chair, so her talks worked. Fix in the probe: stand beside her and click 12 px right of her sprite centre (`talkTo`). Not changed in the scenario or engine.
   - Engine note, not changed: a seated NPC's chair hit box sits under the centre click, and the bridge's `aimPointFor` reported `clean: true` for a point on the chair. A player clicking a seated NPC's centre can get "A chair." instead of the chat. Worth a look when someone owns seating or click priority. Evidence: games 7779, 7789, 7793.

Probe also fixed: the both-using predicate stopped at x 420, but the second cooler cell is at x 448 (Gwen `using` at 448, 244), so it never matched. Now x 360 to 460. Two further probe changes: the chat background is read from `MinigameFramework.currentMinigame.background`.

### L4: talk to each

- Gwen, game 7795. Opener: "Hi there. I look after the systems on this floor, if something's playing up." then "Not that I'd be much use tonight. I'm just tidying up before I go." Choice "Carry on, I'll stay out of your way." Goodbye "Thanks. Take care." and the chat closed. Second talk gave the repeat line "Oh, you're still here. I'll be off in a minute." then the same choice and goodbye, closed. Background `assets/backgrounds/rooms/m07_operations_floor_blended.png` both times (ops floor). Pass.
- Adaeze, game 7802. Opener "Evening. I'm the grid scheduler, if you were looking for one." / "Last of the load figures, then I'm out of here like everybody else." Goodbye "Thank you. I'll shut this down and go." Closed. Second talk "Still here? I'm nearly done, I promise." then the same choice and goodbye, closed. Background the ops floor both times. Pass. (7774, run before the probe changes, gave the same lines.)

### L2 after talk

- 7802 (talk to Adaeze): chat closed at t15. Adaeze started `goto_target` 2 s after the close and reached `using` at (403, 244); Gwen followed and was `using` at (448, 244). Both using together 10 s after the close (t25). `no_beside_cell` 0. Pass.
- 7795 (talk to Gwen): chat closed at t15. Adaeze `goto_target` at t19, `using` at t21 (403, 244). Gwen `goto_target` at t24, `using` at t27 (448, 244). Both using together from t27 to about t56. `no_beside_cell` 0. Pass (the probe's old predicate missed it; read from the sample log).
- Probe errors: none in any run.

Games used: 7767 (diagnosis, blocker values), 7774, 7779, 7789, 7792, 7793 (chair diagnosis), 7795, 7802.

## Slice 3 live checks, part 2 (17 Nov 2026, same server)

Server: keyless, port 3098, puma PID 2761755 (boot warning confirmed), stopped by PID at the end; port 3098 confirmed closed. Probe: `tools/playtest/m07-ol-s3.mjs`, modes `ex`, `walk`, `reload`, `atk`. The `ex` mode now forces no needs (the earlier version called `needs.set`, which the brief forbids); it prints world bubbles, needs-log exchange events and the ex/heard globals, and takes a screenshot on each exchange event. Times below are the needs-log game clock unless marked wall.

Probe results are one game per row. Anything marked "probe" is a probe fault, not a scenario result. Not run: L6, 10.3 (b), L3 `ex_going_now`, and the server-room step of 10.4.

| Check | Result | Games |
|---|---|---|
| L3 `ex_last_two` heard once, `heard_ex_last_two` true | Pass for 7805 (exchange_started 410, exchange_heard complete 504, global true at about 118 s wall). Not seen in 7826 | 7805, 7826 |
| L3 bubbles from both operators, no repeat | Not verified: no exchange line appeared in the world-bubble log, and no screenshot was taken in 7805 (the screenshot hook was added after it ran) | 7805 |
| L3 `ex_going_now` on a later trip | Not run: no second trip after the exchange (7805 ended at 420 s wall; 7826 had no exchange) | 7805, 7826 |
| L5 west, desk, east, seated | Probe fault: west door lookup `unknown-entity`, east door `blocking-ui` | 7865 |
| L5 west, desk, east, both at cooler | Probe fault: west door lookup `unknown-entity`; desk point not reached (feet at 440, 219); east door reached | 7870 |
| L8 coffee station never used | Pass so far: no coffee job or use in any run. One bubble line mentions the coffee machine as broken (chatter text only) | all |
| 10.3 (a) reload on ops floor, both at post, seated | Before reload both at post and seated (game 7876). After reload the run crashed in `snap()` (`needs.state` returned null), so the after-reload state is unproven | 7876 |
| 10.3 (b) reload after server room, walk back | Not run | none |
| 10.4 attack Adaeze while walking to cooler | Partial fail: KO after 11 punches, hostile, `ops_staff_upset` true, KO body still at (537, 294) from t129. She had left her post (448, 160) by about 150 px before the KO. Gwen stayed seated at post; no cooler job in the 60 s after | 7880 |
| 10.4 attack Gwen while seated | Fail: KO after 9 punches and `ops_staff_upset` true, but Adaeze also turned hostile and knocked the player out (game-over screen). Gwen's body moved from (384, 160) to (412, 201) | 7889 |
| 10.4 attack Adaeze while using the cooler | Pass on KO, hostile and body fixed: KO after 12 punches, body at (422, 201) from t130. Gwen went back to post (384, 160), no new cooler job. `ops_staff_upset` true in the globals | 7894 |

Notes on the evidence:

- Game 7805, needs log: `exchange_started` (ex_last_two, with Gwen) at 410 while both were `using` at the cooler. `exchange_heard` (complete true) at 504. Both `used` at 506, both `returned_post` at 514.
- Game 7826, needs log: trip 1 at 370 to 480 and trip 2 at 2150 to 2260 (the clock jumped about 1,600 between them, not checked further). No exchange started on either trip, and `heard_ex_last_two` stayed false. Whether the exchange is random or conditional is not known; the scenario was not read for this.
- The attack probe uses `window.playerCombat.attack({x, y})`, the same real punch path as the m01 music and barks probes. It does not use `debugKO`.
- The 10.4 "seated" run shows the other operator going hostile when the player is knocked out or attacks the seated one. This is not the plan's "the other walks home" and needs a look at the engine or the plan.

Probe changes still needed before the next run: the door lookup for `walk` (the doorway ids are `door:...`, and `moveToNear` returns `unknown-entity`), a reload that waits for the ops floor state before `snap()`, and a screenshot on the first exchange line in `ex`.
