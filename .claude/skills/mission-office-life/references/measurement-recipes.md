# Measurement recipes

How to measure the numbers an office-life build depends on. Every figure below is from m03 and is a worked example, not a target: each mission re-measures on its own machines. Source docs are in `scenarios/m03_ghost_in_the_machine/office_life/` (named per item); the engine files are `systems/workstation-state.js`, `systems/npc-needs.js` and `core/rooms.js`.

## 1. Setup for every live measurement

- Keyless server from the branch worktree on its own port (m03 used :3091 and :3094). Copy this, with `<worktree>`, `<main checkout>` and `<port>` filled in:

  ```bash
  ss -ltn | grep ':<port>'    # must print nothing; never 3000, 3001, 3002, 3085 or 3086
  ```

  ```bash
  cd <worktree>
  env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 BUNDLE_PATH=<main checkout>/vendor/bundle \
    PLAYTEST_PORT=<port> BREAK_ESCAPE_STANDALONE=true nohup bin/rails server -b 127.0.0.1 -p <port> \
    -P <worktree>/tmp/server-<port>.pid > <worktree>/tmp/server-<port>.log 2>&1 &
  up=0; for i in $(seq 60); do curl -s --max-time 5 -o /dev/null http://127.0.0.1:<port>/ && up=1 && break; sleep 2; done
  [ "$up" = 1 ] || { echo "server did not come up: stop its PID from ss -ltnp if one is listed"; tail -n 30 <worktree>/tmp/server-<port>.log; }
  grep -q 'GEMINI_API_KEY environment variable is not set' <worktree>/tmp/server-<port>.log && echo keyless
  ss -ltnp | grep ':<port>'   # the puma PID is in this line; write it down
  ```

  - `env -u GEMINI_API_KEY` removes the environment key, but the app also reads a key from Rails credentials (`config/initializers/break_escape.rb:12` to `:13`, `tts_service.rb:181`), so it is not a guarantee: with a key from either source every uncached line played is generated and billed. Only the boot warning proves the server keyless. The initializer prints `[BreakEscape] Warning: GEMINI_API_KEY environment variable is not set. ...` only when neither source has a key, so the `grep` above must print `keyless`. If it does not: stop that PID (the one from `ss -ltnp`) at once, play nothing, and report it to the orchestrator. Never probe `/tts` to test keylessness: on a keyed server it generates and bills. Never read Rails credentials.
  - The pid file is given as an absolute path because `rails server` changes to the Rails root before writing it, so a relative `-P` lands in `test/dummy/tmp/pids/` in a worktree. The server runs in the background with a pid file so a second server from the same worktree does not hit "A server is already running". The wait loop stops after 120 s and prints the log tail; a boot failure (GemNotFound, schema) shows there.
  - A worktree has no `.bundle/config` and no `vendor/bundle`, so plain `bin/rails` fails there with GemNotFound. Set `BUNDLE_PATH=<main checkout>/vendor/bundle` for `bin/rails` and `bundle exec` commands, or run `new-game.rb` through `tools/playtest/new-game.sh`, which sets it for you. That covers the V6 rake (`app:break_escape:tts:office_lines[<m>]`) too, which needs `BUNDLE_PATH` set by hand.
  - Create games from the same worktree with `cd <worktree> && env RBENV_VERSION=2.7.8 PLAYTEST_PORT=<port> BREAK_ESCAPE_STANDALONE=true tools/playtest/new-game.sh <m>`. It renders the scenario into the game row at save, so run from the main checkout the game holds main's scenario.
  - Do not use `tools/playtest/start-keyless-server.sh` for a worktree proof. It is fixed to :3001, exits 0 with "Already listening" when :3001 is up, and has no `BUNDLE_PATH` in a worktree, so it fails there.
  - Stop only the PID from `ss -ltnp`. Record the **puma process PID**, not the PID of the shell that launched it. Never `pkill -f`, and never kill through a `ps | grep` pipeline whose pattern appears in the same command line (it killed the fixer's own shell twice, `R1_FIX_HANDOVER.md`, Gotchas). `./start_server.sh` runs `pkill -9 -f puma` and takes other servers with it (`playtest-scenario` skill). Killing the bash wrapper's PID in a real m03 run left puma holding the port.
- A **fresh game per run** from `tools/playtest/new-game.rb <m>`, after every scenario edit. Use the id it prints. Do not reuse a game after editing `scenario.json.erb` (`R2_FIX_HANDOVER.md`).
- `window.__test.throttleFps(20)` (the `fpsLimit` and `hasFpsLimit` fields alone do nothing in Phaser 3.60.0; the helper also sets `_limitRate` and does `sleep()`/`wake()`), with `physics.world.fixedStep` true. Re-measured over four 10 s throttled trips: scene time and physics time ran 55, 6, 10 and 12 ms off wall time (the first trip is the worst), so expect agreement to within about one throttled frame (50 ms), not 3 ms. The earlier 3 ms figure (`STAGE1_CHECKS.md`) came from runs that were not actually throttled.
- Force a need through the bridge so a trip does not wait for the natural rhythm: `__test.needs.set('<npc>', '<need>', 5)`. It stuck every time for Zainab (`SLICE3_4.md`, slice 4 results).
- Park the player clear of every lane, for example at the cell where the player reads the object. A probe parked in a door lane produced a 120 s "returning" stall that was the probe's own artefact (`SLICE3_4.md`, slice 3 results).
- Untracked `tools/playtest/*-flags-game*.xml`: leave them; older ones are tracked, so never `rm` the glob (`R1_FIX_HANDOVER.md`).
- A worktree has no `node_modules`; symlink the main checkout's (`ln -s <main checkout>/node_modules node_modules`) for the run and `unlink node_modules` at the end, never `rm -r` (`R2_FIX_HANDOVER.md`).

## 2. One machine, not two (the R1 blocker)

After declaring any Tiled-claimed machine, load the game twice and list every object of that type in the room.

- Expect one `reception_coffee` at the Tiled sprite's position and no second sprite of the same image. Compare against the Tiled JSON in `assets/rooms/`.
- If a declared object sits at a different spot on each load, it was placed at a random position: the `type` is wrong (see `gotchas.md`, "Base type names"). R1 caught (91,152) and (164,156) against the real (262,189), two coolers in the hallway, and a use cell in the doorway.
- The dressing check repeats it with all rooms loaded: one coffee, one cooler, one laptop (`SLICE6_DRESSING_LIGHTING.md`, Passes).

## 3. Trip timing and the laptop lock threshold

What the lock reads: `decideLocked` (`workstation-state.js:155` to `:157`) compares `expectedAwayMs` in the `npc_left_post` payload against `lockIfAwayOverSeconds`. It does not read real time. The estimate (`_expectedAwayMs`, `npc-needs.js:3326` to `:3359`) is route to the machine plus use time, plus queue wait only if the job is `queued`, plus the way home.

Measure **both** numbers for every trip type, five tries each, and keep them in a table:

| Column | Where it comes from |
|---|---|
| expectedAwayMs | `npc_left_post` event payload |
| real away | game seconds from `npc_left_post` to `npc_returned_post` |
| laptop state during the trip | `<id>_owner_away` and `<id>_screen_locked` globals |

Pick the threshold between the longest trip that must stay open and the shortest that must lock, **in expected time**, then confirm real time sits on the right side of what the player sees.

What m03 learned:

- The plan's 45 s threshold was wrong. Expected away was 14.6 s (coffee) and 23.1 s (cooler), so 45 s would leave the cooler trip open (`STAGE1_CHECKS.md`, Plan assumptions broken 1).
- Expected time moves with the start cell, the route, the use time and the machine position. Slice 3 figures stopped holding after the post moved, and again after the machines claimed their Tiled sprites (`SLICE3_4.md`; `M03_SLICES3_4_REVIEW_R1.md` finding 2). **Re-measure after every move of a post, machine, use time or lane.**
- Retune with the **use time** of the object, since that is the free lever: m03 settled at coffee use 16 s, cooler use 20 s, threshold 24 s. Coffee expected 18.6 s (real 22.0 to 22.4 s, 5 of 5 open, margin 5.4 s); cooler expected 28.7 s (real 32.2 to 33.0 s, 5 of 5 locked, margin 4.7 s). Target at least 3 s of margin each side so the start cell cannot flip the result (`M03_SLICES3_4_REVIEW_R1.md`, fix log).
- **Real time exceeds expected, and the gap is not small.** A pair that leaves together stalls on the walk home (`_watchReturn` re-issues a stalled return after 3 s, `return_resumed` in the log). Real away ran 4 to 12 s over the 18.6 s expectation: 30.4, 27.4, 22.3 s in the first fix run and 30.8, 27.3 s in the second (`COFFEE_PAIR_FIX.md`). The coffee pair is the real gap: a trip really away 22 to 30 s against an 18.6 s estimate and a 24 s threshold leaves the laptop open for the whole absence, because the decision is taken once at the leave (`M03_REVIEW_R7.md` M3). The cooler pair reached 50.9 to 58.5 s against a 28.7 s estimate, but that estimate is already over the threshold, so it locks and the stall is harmless. m03 filed the coffee case in `docs/IDEAS_BACKLOG.md` (capacity-2 walk-home stalls); either stagger the walk home or add the observed overshoot to `expectedAwayMs` for capacity-2 objects. Decide which you accept before you promise the player "long absence locks".
- An exchange stretches real time further (about 16 s for `ex_open_door`), after the decision, so the open window gets longer, which the plan wants (`M03_SLICES3_5_REVIEW_R2.md` finding 1).
- No `policies` block means no `lockAt` timer re-locks the laptop later (same finding).

## 4. Pair use of a capacity-2 machine

Set both needs low through `__test.needs.set` and watch `npc_use_started:<object>` for both ids.

- Verify both partners reach `using` together over **at least three breaks** in one game, and note which cell each takes. m03: three breaks, both using from 2.6 to 4.0 s after the leave, main cell (276) and side cell (244) every time (`COFFEE_PAIR_FIX.md`, Live proof); the follow-up run repeated it for two more breaks.
- The failure being excluded: the second claimant stops at the side cell on the first user's lane, the first waits behind until the walk's deadline passes (`npc_job_failed`), and only one person uses the machine. Seen in two of three runs before the engine fix (`SLICE6_DRESSING_LIGHTING.md`, minor 2; `COFFEE_PAIR_FIX.md`, Cause).
- The engine now swaps sides (`_sideBlocker` at `npc-needs.js:3445`, `pair_side_swap` in the needs log, `:3427`): the nearer NPC keeps the main cell and the farther is re-routed to the side cell. Check the log line appears when expected. It is skipped when the first user is already nearer, has arrived, is frozen in a conversation, or has no side cell of its own (`M03_REVIEW_R7.md`, `M03_REVIEW_R9.md`).
- Chatter and exchanges need the pair, so a machine that serves one at a time is a content bug, not a nicety.
- The cooler, in another room: set both thirsty with the player in that room. 2 of 2 used it together. The door gap between reception and hallway is one body wide, so the second user waits about 8 s going out and 9 s coming back (`SLICE3_4.md`). That is single file, not a stall.

## 5. Lazy-loaded rooms

Only loaded rooms simulate. m03's cooler is in `main_hallway`, which loads when the player first walks there, so before that visit thirst parks as `no_source` (`SLICE3_4.md`). Any trip measurement for such a machine needs the player to have entered the room once. The mapped cooler break therefore keys on `room_entered:<room>` with `previousRoom` equal to the hallway, which guarantees it has loaded (`M03_OFFICE_LIFE_PLAN.md` section 3).

## 6. Hide, reload and night

Run each in a fresh game:

1. Both staff visible and at posts at load.
2. After the act turn (see `mapping-patterns.md`, "Night hides"), hidden **before the player enters the next room**, with `hiddenMap` true and `vis` false on the sprite.
3. Reload at day: still at posts. Reload at night: still hidden.
4. **Render the night turn and look** (`SLICE6_DRESSING_LIGHTING.md`, finding 1). Do not trust `vis false`. Then dump the scene children within about 60 px of each seat (`g_probe.mjs` in m03, `SOFA_FIX.md` DUMP1) and expect only the hidden sprites and furniture, no Image from the NPC. A leftover seated breathing image drew a head and shoulders figure on the sofa after the turn and cleared only on reload.
5. To prove the engine fix covers the unlucky phase, hide while the breathing image is verified visible (`SOFA_FIX.md` DUMP3): the image should be gone and the sofa empty.
6. Show the NPC again (`setNPCVisible(id, true)` from the bridge). A needs NPC should sit back down within about a second at its usual seat (`SOFA_FIX.md`, R8 follow-up). A plain seated NPC comes back standing and stays standing (`SOFA_FIX.md:52` on `build/ol-m03`: it is marked `_seatTried`); that is intended, so check only that its chair is free and nothing is drawn on it. Play-sit on the freed sofa from the player side as well.

## 7. Send-home and trouble handling

m03 first built a `patrolOverride` send-home on Ffion's KO and then removed it (`M03_SLICES3_5_REVIEW_R3.md` finding 1, `R3_FIX_HANDOVER.md`). The rule that came out of it is in `gotchas.md`. To prove the replacement, test three states with a KO in each, polled to about 84 s and seated and still for the last 15 s:

- (a) at posts, 0 px from the seat origin;
- (b) mid-break with both at the machine: both end seated (one may take the other cushion of the same sofa, which is valid);
- (c) mid-break at the other room's machine.

Distances are against the **seated sprite**, which draws about 20 px above the feet. The R2 "20 px north" finding was that offset, not a wrong target (`M03_SLICES3_5_REVIEW_R2.md`, fix log and R3 table).

## 8. What to record

For every run: game id, port, the commit hash tested, the trip table, each PASS or FAIL with the reason. A pass on a lineage that predates a fix does not count: slice 5's live runs were on the pre-R1 branch (random duplicate machines, old timings), and the merged tip had never been played when R2 reviewed it (`M03_SLICES3_5_REVIEW_R2.md` finding 1). Run the **merged tip**, not the branch you built on.

## 9. Object position baseline

No validator flag prints object positions (`validate_scenario.rb -o` mixes the rendered JSON into its report), so render the scenario with `LockKeyDiff.render` (`scripts/lock_key_diff.rb:85`, the seeded render the lock and key diff uses) and print one sorted line per declared object, per item inside a container (its position is `in:<container id>`, at any depth) and per NPC `itemsHeld` entry. From the worktree root:

```bash
ruby -r ./scripts/lock_key_diff.rb -rjson -e 'j = LockKeyDiff.render(ARGV[0]); rows = []; walk = ->(r, o, at) { id = o["id"] || o["name"]; rows << [r, id, o["type"], at || o["position"] || [o["x"], o["y"]].compact].to_json; Array(o["contents"]).each { |c| walk.(r, c, "in:" + id.to_s) } }; (j["rooms"] || {}).each { |r, d| Array(d["objects"]).each { |o| walk.(r, o, nil) }; Array(d["npcs"]).each { |n| Array(n["itemsHeld"]).each { |i| rows << [r, "held:" + n["id"].to_s, i["type"], i["id"] || i["name"]].to_json } } }; puts rows.sort' scenarios/<m>/scenario.json.erb > scenarios/<m>/office_life/positions_base.txt
```

After each slice, run it again into a scratch file and `diff` the two. Only objects the plan adds or moves may differ. Tiled-claimed objects print an empty position (the map places them); a change there shows as a new or missing row. The static diff does not see where items land at runtime: a knock-out away from post is covered by the attack probe. On m03 it gives 37 rows: 19 objects, 8 container items and 10 `itemsHeld`.

## 10. Home dwell and the needs clock

Two numbers the planner measures before choosing `initial`, `decayPerMin`, `urgentAt` and a home `useSeconds` for a moved NPC (SKILL.md, "Found at post first"). Use a test scenario on the branch, never globals set in the page.

- **Does a newly urgent need cut a long home use short?** Give the NPC a home use of several minutes and a second need that crosses `urgentAt` part way through. Poll `window.__test.needs.state(<id>)` once a second: record when `job.need` and `job.targetId` change, against the use's start and its `useSeconds`. Five tries. If the use is cut short, the dwell is only as long as the time until the next need turns urgent; plan the decay rates for that.
- **How needs-clock minutes map to real time.** Read one need's level from `state(<id>).levels` twice, a known number of real seconds apart, while that need is not being met (its decay pauses during its own use). The fall divided by `decayPerMin` gives needs-clock minutes; divide by the real minutes elapsed. Run at the headless setting (`setFPS(20)`, fixed steps on) and note it, since the needs clock advances by the same frame step the walks use (`core/game.js:2704` to `:2707`; `npc-needs.js:651` to `:671`, clamped at 1000 ms), so a throttled loop runs the clock and the walks slower than wall time together. The clock stops while the VM is open (`npc-needs.js:666`): a gate set while the VM is open gives no lead time, so count lead time from when the player leaves the VM. Write the ratio in the plan and convert every "quiet for N minutes" claim with it.
