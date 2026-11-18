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

## Attack probe diagnosis and route work (17 Nov 2026, part 3)

Server: keyless, port 3098, puma PID 2978371, stopped by PID; port 3098 confirmed closed. No scenario or engine change in this run.

### (a) Why Adaeze turned hostile when Gwen was struck seated (game 7889)

Cause: the player's own punch, not an ally or group rule. Engine search: nothing in `npc-hostile.js`, `npc-behavior.js` or `player-combat.js` propagates hostility to a friend or group member. Hostility starts only from `setNPCHostile` (called by the punch hit, `player-combat.js:457`, per NPC in the cone), influence, `startHostile` or ink. `needsCompany` groups are used for needs only. Our `npc_attacked` rows on `agent_0x99` set only `ops_staff_upset`.

Evidence: the probe now logs the player's feet, facing and the other operator's hostility after each punch (six fresh Gwen-seated runs). Adaeze stayed friendly in five (7909, 7914, 7918, 7921, 7924/7925/7926/7933/7939 all `otherHostile: false`, player feet about (374, 178) south-west of Gwen). In game 7930 Gwen, once hostile, pushed the player round to feet (410, 173), 38 px from Adaeze at (448, 160), facing up-left; after punch 7 Adaeze was hostile and the game-over screen followed. The seats are 64 px apart, and a punch has range 32 plus the target's body width, so a player standing in the gap clips both. Rate: 2 of 7 seated runs (7889, 7930).

Outcome: engine geometry, shared by any ambient pair seated about 64 px apart (not checked in m02 or m03). Not changed. For m07: the plan's "the other operator walks home" holds only when the player stays on the open side of the struck operator; a player who fights from the gap can turn both hostile. The KO of one still sets `ops_staff_upset`, and the second hostile operator is then a second fight with no harm to the credits logic. The seats are Tiled chairs and Adaeze and Gwen are new NPCs, but their posts were measured and fixed, so no data change was made. Decision for the orchestrator: accept, or move one seat apart (needs a Tiled and positions change).

### (b) Chase leash bound (game 7880)

`behavior.hostile.leash` bounds the player, not the NPC: `hostileMayChase` (`npc-chase-leash.js`) lets the NPC keep chasing while the player is within `chaseRange` of the NPC's post (`_chasePost`: the home position for a stationary NPC) and in the same room. `chaseRange` defaults to 400 px (`combat-config.js:74`); our data sets none. So a leashed operator follows the player anywhere in the ops floor within 400 px of her post, and gives up and walks home past that or when the player leaves the room. Her 150 px move to (537, 294) was her chasing the probe's player, who stood within 400 px of her post. She cannot leave the room. The plan says "stays near post"; 150 px (about the distance from her seat to the cooler plus a bit) is inside the floor. Not wrong as written, so no change. If the orchestrator wants a tighter fight, add `"chaseRange": 200` to both `behavior.hostile` blocks (data only, validator and lock diff rerun needed). The 10.4 steps were not re-run because nothing was fixed.

### Server-room route (new probe, not yet complete)

`tools/playtest/m07-ol-route.mjs` (new, exported `route(h, log)`): enter the ops floor, clear the HaX bark (retry `dismissBlockingUi` until `blockingUi` is null), read the Shift Handover Sheet, return to the checkpoint, use `badge_printer`, click 0616 then ENTER, wait for the container to list "Printed Contractor Badge", `minigame.take('Printed Contractor Badge')`, close, then `enterRoom` ops floor and `server_room`. Findings:
- The PIN is accepted ("PIN Correct! Access Granted.") and the container opens by itself afterwards; it first shows "Loading contents...", so the probe must wait for the badge text before `take` (fixed).
- The badge goes into the inventory (7945) and `badge_obtained` is true. The Shift Handover Sheet did not appear in `window.inventory.items` after the read in 7931 and 7945 (it opened as a note only); the PIN works regardless.
- The last step, `enterRoom('server_room')`, was not reached: in 7949 the return `enterRoom('operations_floor')` from the checkpoint failed after 2 attempts, and in 7943 the server door was `door-locked` because the badge was not yet taken. A retry loop for the ops-floor return was added after 7949 and is untested. Next step: run `route()` on a fresh game, confirm `enterRoom('server_room')` opens the RFID door with the badge.

Games used: 7909, 7914, 7918, 7921, 7924, 7925, 7926, 7930 (hostile clip reproduced), 7933, 7939 (attack runs); 7928, 7929, 7931, 7934, 7935, 7943, 7945, 7949 (route work, not counted as checks).

### Not run

L6, the server-room step of 10.4, 10.3 (a) and (b), L3 `ex_going_now`, L5. None needs a scenario change; all wait on the route above, a reload that waits for needs.state before `snap()`, and the L5 door ids (`door:security_checkpoint->operations_floor` east at (304, 80), `door:operations_floor->server_room` east at (624, 80), `door:operations_floor->security_checkpoint` west at (336, 80)).

## Slice 3 live checks, part 4 (18 Nov 2026)

Server: keyless, port 3098, puma PID 3204557, stopped by PID, port confirmed closed. Headless, setFPS(20), fixed steps on, no globals or needs set in the page, no scenario or engine change. Probes: `m07-ol-route.mjs` (route to server_room), `m07-ol-s3.mjs` modes `l6`, `ko`, `pre`, `ex` (env `PARK=x,y`), `walk2` (env `DESK=x,y`).

### Route (check 1): PASS, game 7972 (repeat 7975, 7980, 7990, 7993)
Cause of the earlier failures: `enterRoom('server_room')` refuses a locked door, and the badge alone does not open it. The RFID door opens when the player interacts with the door (`interact('door:operations_floor->server_room')`) with the Printed Contractor Badge held (events door_unlock_attempt, door_unlocked, door_opened). The route now does that, then enters. The ops-floor return retry loop was not needed (first try each time). `server_hall_reached` becomes true on entry.

### L6, check 2: PASS, game 7972
In server_room both adaeze_okafor and gwen_pritchard: sprite visible false, not seated. Back on the ops floor: both still visible false (needs state idle, atPost true), screenshot `tmp/m07-s3-ops-after-server-7972.png` shows the two chairs empty, no seated sprite. Repeat in 7975 and 7990 identical.

### 10.3 (b), check 3: PASS, game 7990
After the server room a reload shows the Resume Session overlay (a real reload needs the Resume click; `skip_resume` is only for the first load); clicked Resume, respawn in security_checkpoint, walked to the ops floor: both vis false, no seated sprite (screenshot `tmp/m07-s3-ops-after-reload-7990.png`, empty chairs). Neither appears 8 s later.

### 10.4 server-room step, check 4: PASS, game 7993
Gwen KO'd with `playerCombat.attack` from the west side (player feet (342, 80), 14 punches), Adaeze never hostile. Then route: in server_room Gwen visible (stays, KO), Adaeze hidden. Back on the ops floor: Gwen on the floor (`death-right`, (362,205)), Adaeze hidden.

### 10.3 (a), check 5: PASS, game 8002
Reload on the ops floor before the server room, Resume, walked back. Entering the room, both visible, seated at post (446,134 and 383,134) with needs.state non-null; 5 s later `idle`, atPost, seated, thirst 42.2 and 58.3.

### L3 second half, check 6: PASS, game 8089 (player parked at (520,248))
Wall seconds from entry: both at the cooler at 90 s, `ex_last_two` started about 1 s later, heard at 118 s. Second trip both at the cooler at 548 s, `ex_going_now` started right after, heard by 571 s. Globals heard_ex_last_two and heard_ex_going_now both true; each exchange_started and exchange_heard appears once through 720 s, no repeat. Second trip is about 458 s after the first (note: the earlier "needs clock about 3.9 times wall" is wrong; the measured needs-clock to wall ratio is 1.0, see BUILD_LOG).
Notes: in 8004 (first trip only, 330 s) the same exchange played; in 8018 (no park, player at the west door, about 180 px from the cooler) no exchange and no chatter played in either trip, so the earshot gate is real: a player who does not stay within earshot hears neither. Gwen logged `seat_move_end mount_stuck` (stage mount) at the cooler in 8004, 8018 and 8089; she still returned to post each time (needs log `returned_post`), so not a failure, but she logs it once per trip. Not investigated.

### L5, check 7: PASS with a note, games 8055 (seated), 8062 (both at the cooler), 8059, 8066
Route: west door (342,80), supervisor's desk (desk 3, east of the swivel chair; world about (540,190)), east door. Seated (8055 to a desk point (440,230), 8066 to (540,190)): all legs ok. Both at the cooler (8062, to (540,190)): all legs ok, never blocked.
Note: the earlier probe's waypoint (440,230) is the cooler approach, not the supervisor's desk. With both at the cooler (8059) `moveTo(440,230)` stopped 47 px short at (487,229) because Adaeze (402,244) and Gwen (445,241) stand there; the east door leg then still succeeded. Not a blocked route, the waypoint was in the pair's cell.

### Games used (do not reuse)
7959, 7961, 7964, 7968, 7972, 7975, 7980, 7986, 7990, 7993, 8002, 8004, 8018, 8049, 8050, 8055, 8059, 8062, 8066, 8069, 8089. Exploratory or failed: 7959 to 7968 (route and door), 7975 to 7986 (reload without Resume), 8004 and 8018 (L3 first attempts), 8049 and 8050 (walk with bark open, door id), 8059 (desk waypoint), 8069 (probe bug).

## R1 fixes (2026-11-18, build review R1, commit f0440a469 data)

Server keyless on :3098, puma PID 1039641, stopped by PID, port confirmed closed. Headless, setFPS(20), fixed steps on, no globals or needs set in the page. Probes: `m07-ol-r1m1.mjs` (cooler trip), `m07-ol-r1m4.mjs` (attack), `m07-ol-r1chairs.mjs`.

### M1 (cooler `seat: "stand"`): PASS, games 8180, 8186
Natural trip, player parked at (520,248). Game 8186: both `using` at 88 s after entry (8180: 107 s in its log clock after the first 'using' polling, same order); needs-log shows `using`, `returned_post` for each and no `seat_move*`, no `mount_stuck`, no `no_beside_cell`. Chair sprites in the ops floor before and after the trip: `(344,219)`, `aes_office_chair1 (556,150)` and `pnw_office_chair_m1 (406,252)` unchanged to the pixel. The two operator chairs `(364,125)` and `(428,125)` roll out when they rise and are back at the same positions within about 20 s of the return (+2 s: (364,185),(448,153); +20 s: (364,125),(429,126)), both seated again. Gwen's long walk home was not re-timed. Game 8180's trip printed only the tail of its output, so 8186 carries the before/after comparison.

### m4 (`chaseRange` 200): PASS with a limit, games 8202, 8206, 8210
Punch from the west side with `window.playerCombat.attack`: Adaeze hostile at once, `ops_staff_upset` true, Gwen not hostile. Player kept within about 120 px: she left her seat and chased (81 to 98 px from post, game 8210). Player retreated 270 to 300 px: she was back within 11 px of her post (game 8206, 8202), still hostile, mode idle, at post. The leash now bounds her near her post. Not shown cleanly: the single frame at which she gives up between 120 and 200 px.

### m5 (walkthrough route, L1): superseded
Run later the same day; see "R1 m5 walkthrough run" below.

## R1 m5 walkthrough run (2026-11-18)

Games 8225 and 8229, each fresh from `m07-ol-ng.sh`, keyless server on :3098 (boot warning seen), probe `tools/playtest/m07-ol-r1m5.mjs` (headless, setFPS(20) fixed steps, no globals or needs set, no `enterRoom` past a locked door). Route: start in `security_checkpoint`, `enterRoom('operations_floor')` through the open checkpoint door (first entry), stay 45 s, then Shift Handover Sheet, back to the checkpoint, Contractor Badge Station with PIN 0616, take the Printed Contractor Badge, ops floor again, interact with the RFID door (badge held; `door_unlocked`), `enterRoom('server_room')`. Times are seconds on the page clock; entry is the first sample in the ops floor (8225 at 4.1, 8229 at 3.1).

| Check | 8225 | 8229 |
|---|---|---|
| L1: Adaeze and Gwen seated at post (`atPost`, `_seat`, visible, no job), 44 one-second samples from entry to entry + 45 s | 0 of 44 bad | 0 of 44 bad |
| HaX text ("You're inside, and the team's still over Denver ... Let it hurt afterwards") | bark 4.4, popup on screen 5.1 to 8.3 | bark 4.5, popup 5.1 to 8.2 |
| Architect's call | 5000 ms timer set 3.2, ring offer `ringing` at 8.2 (`phone_ringtone`), phone chat for the_architect opened at 28.5 (`architect_echo_heard` set) | timer 3.0, ring 8.0, chat opened 28.3 |
| RFID text (HaX: "Server hall door, far side of this floor, wants a server-zone badge ...") | bark 13.4 | bark 13.5 |
| Pool chatter during the call (ring to 45 s) | none: no bubble or chatter console line, `needs.log` since entry has only `registered` (t 31), `blocked`, `urgent` (t 358 to 361, after the window, in the checkpoint and server legs) | same (`registered` t 30, `blocked` t 354, `urgent` t 360) |
| Later route steps | sheet note opened 52.9, PIN 0616 accepted 65.8, container 66 to 68, badge in inventory, HaX PIN text 69.3 | sheet 53.3, PIN done about 65, HaX PIN text 68.5 |
| Server room reached; both operators hidden on arrival (`sprite.visible` false, `atPost`, mode idle) | `door_unlocked` and `door_opened` at the door interaction, server room at 83.6, `server_hall_reached` true, both hidden | server room 83.1, both hidden |
| Page errors | none | none |

Result: m5 passes on both games for L1, the three texts and the hidden-on-arrival check.

Limits and slips:
- The call was not answered by the probe. The phone chat opened by itself about 20 s after the ring (28.5 and 28.3); the probe did not observe it end. "No chatter" covers the whole 45 s window, so it includes the ring and the open chat.
- Chatter was judged from the barks recorder, the console and `needs.log`, not from bubble pixels.
- Seeded flags (`session-start.sh --flags`) were not used. The route has no VM step and the probe lib drives the page directly. The opening state after load had no briefing minigame open (the lib's load dismisses any blocking UI), and the team was not committed, which the route does not need.
- The probe's own `route()` first step `enter ops` returns `no-doorway` when already on the ops floor (harmless; the run continues).
- The first 2 s of sampler output before entry (checkpoint) are not counted in L1.

## R2 m1: frame time on the ops floor (2026-11-18)

Games 8239, 8247, 8260, each fresh from `m07-ol-ng.sh`, keyless server on :3098 (boot warning seen), probe `tools/playtest/m07-ol-r2.mjs`. Headless, physics world fixed at 20 steps per second (the lib's `setFPS(20)`), fixed steps on, render loop target 60 (headless actual about 36 fps in 8239), no globals or needs set. Frame time is the `requestAnimationFrame` interval in ms (the game loop `delta` read the same). Windows: 30 s in the start room (security checkpoint), then 30 s seated on the ops floor right after entry, then the natural trip.

| Game | Checkpoint 30 s mean / p95 | Ops seated 30 s mean / p95 | Both operators away from post (window) mean / p95 |
|---|---|---|---|
| 8239 | 25.4 / 50.0 | 40.7 / 66.7 | 40.0 / 66.7 (23.0 s) |
| 8247 | 35.0 / 66.6 | 49.3 / 83.4 | 59.2 / 100.1 (33.9 s) |
| 8260 | 50.7 / 100.0 | 81.6 / 216.6 | 62.9 / 150.0 (38.4 s) |

Limits: the machine was shared and its load rose between games, so absolute numbers differ by game; compare within a game. The ops floor reads 1.4 to 1.6 times the checkpoint within each game. Operators away (both walking, using or returning) against seated: 0.98, 1.20, 0.77 times, with no consistent direction across three loaded runs. The "both at the cooler" window is as long as both are off post (23 to 38 s), not a clean 30 s: they overlap for the use time only, and needs cannot be forced. What was measured is the `requestAnimationFrame` interval and `loop.delta` (means and p95 per game, above). No reading was taken without the two operators (a game with both removed, or main at the same commit), so this build's own frame cost is not isolated and no claim is made about the operators' trips. Physics steps were not recorded. Page errors: none in all three.
