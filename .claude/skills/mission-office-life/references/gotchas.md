# Gotchas

Collected from m02 (the sims tidy) and the m03 build. Each item says what bites and what to do. Longer worked cases are in `measurement-recipes.md` and `mapping-patterns.md`; m03 doc names below are files in `scenarios/m03_ghost_in_the_machine/office_life/`.

## Declaring and placing

### Base type names
A Tiled-claimed machine is declared with the **base type name**, trailing digits stripped: `coffee_station`, `water_cooler`, `kettle`, `photocopier`. `coffee_station1` or `water_cooler1` matches nothing in the Tiled pool, so the object lands at a random position on every load while the real sprite stays drawn as decor (the m03 R1 blocker). The preset list carries both spellings, so the base name still takes the preset. A readable table-top object that is not a PC (`laptop1`) is the exception: it uses the exact sprite type and takes no preset. After declaring, load twice and list the objects of that type (`measurement-recipes.md` section 2).

### Doorway jams
Queue cells, `useFrom` cells, posts and chairs stay out of door gaps and the corridor a player walks in on (`SIMS_TIDY_LOG.md` about :35 to :140; the `chair_out_of_doorway` sweep, e131ef703). A player parked in a lane blocks NPCs too, so park probes clear of every lane.

### Door gap is one body wide
The m03 reception door gap is one body (feet x 41 to 55), so two staff going through wait single file: about 8 s out and 9 s back. That looks like a stall and is not one (`SLICE3_4.md`). Do not tune around it.

### Only loaded rooms exist
Need objects in a room the player has not opened are not live, and an NPC there is not simulated. m03's cooler loaded only after the first walk into the hallway, so thirst parked as `no_source` before then. Key a mapped break on `room_entered:<room>` with `data.previousRoom === '<that room>'`, which guarantees the room has loaded.

### Second user's cell
At each capacity-2 chatter object, check live that each partner can path to its cell. A cut-off cell shows as `npc_job_failed` with reason `no_beside_cell`. The engine swaps sides when the second claimant would stop on the first user's lane (`pair_side_swap` in the needs log); see `measurement-recipes.md` section 4.

## Timing and needs

### Real away time is not expected away time
`lockIfAwayOverSeconds` is compared with `expectedAwayMs` from the `npc_left_post` payload, once, at the leave. A pair that leaves together stalls on the walk home (`_watchReturn` re-issues a stalled return after 3 s), so real away runs 4 to 12 s over the estimate. Measure both and keep a margin of at least 3 s on each side. Re-measure after any move of a post, machine, use time or lane (`measurement-recipes.md` section 3).

### Pair walk-home stall
Two cases, one harmless and one real.

- Cooler pair: 50.9 to 58.5 s really away against a 28.7 s estimate. The estimate is already over the 24 s threshold, so that trip locks the laptop and the overshoot does no harm.
- Coffee pair: 22 to 30 s really away against an 18.6 s estimate and a 24 s threshold. The decision is taken once at the leave, on the estimate, so the laptop stays open for the whole absence even when the real trip is long. This is the open-laptop gap (`M03_REVIEW_R7.md` M3; `COFFEE_PAIR_FIX.md`).

m03 filed the coffee case in `docs/IDEAS_BACKLOG.md` (capacity-2 walk-home stalls). Decide whether to stagger the walk home or add the overshoot to `expectedAwayMs` for capacity-2 objects before promising the player that long absences lock.

### The 20 s needs-walk deadline
`max(20 s, 3 x distance / speed)` (`NPC_NEEDS_SYSTEM.md:474`). A long walk through traffic times out with `npc_job_failed`. Keep need targets close to posts.

### Coupling both ways
Both-way coupling of the same object holds a cooler for minutes and shuts out NPCs that avoid `*`. Couple one way each.

### Scripts win over needs
A scripted walk suspends needs. A bare `suspend` freezes an NPC where it stands, possibly in another room. A `patrolOverride` send-home ends within 32 px of its target (`goToAndStay` arrival), so it stops a tile short and leaves needs suspended. Send staff home with `offWhen` on the machines instead (`mapping-patterns.md` section 5). Both suspensions are lost on reload (`scriptSuspended` starts `false`, `npc-needs.js:582`, and nothing restores it; the event that fired a `patrolOverride` does not fire again), so no needs NPC gets a `patrolOverride` recall, and a story NPC with needs that a beat needs at post is held by a global read by `offWhen` (SKILL.md, protection 3 and "Story-safe movement").

### One `offWhen` per machine, and it is off for everyone
`offWhen` takes one condition; an object form needs every key to match exactly (`npc-needs.js:830` to `:837`). A machine with a trouble gate or a breaker cannot take a second gate, and an AND of the two holds only when both are set. Use a derived global (`<machine>_off`) where a machine has two or more causes, set and cleared by one appended mapping per cause (`references/mapping-patterns.md` section 5). The gate also stops ambient pairs, exchanges and away-time windows at that machine. On a sign-in PC (a `lockType: "login"` PC, or any PC that is a network host for a remote sign-in, a share or a pivot) it refuses the player's sign-in too (403 "This PC is off"), so never gate one.

### The test bridge reports a moved NPC's spawn room
The bridge finds an NPC in any loaded room's `npcSprites` and reads the live sprite position (`test-bridge/state.js:466` to `:468`; `test-bridge/index.js:497` to `:512`), but the `room` it reports is the room whose list holds the sprite, the one it spawned in (`core/rooms.js:3362`; `state.js:415`). `roomContents(<home>)` lists a moved NPC standing in the kitchen, with kitchen coordinates. Do not read its `room` as where it stands; compare its position with the room bounds, or poll `__test.needs.state(<id>).atPost`.

### Story room collisions
Do not let a needs walk or a new `room_entered` mapping collide with a cutscene trigger room or a fixed-spot beat.

## Seats, poses and hiding

### Seated sprite draws about 20 px above the feet
Measure a seated NPC against the seated sprite, not the post's foot point. m03's "20 px north of the post" finding was this offset, not a wrong target (`M03_SLICES3_5_REVIEW_R2.md`).

### Hiding a seated NPC
A seated NPC hidden at the act turn kept a seated breathing image drawn on the sofa until reload, although `vis false` and `hiddenMap true` held. The engine now unseats instantly on hide (R6 to R9, `SOFA_FIX.md`). Every mission with seated staff who vanish: render the night turn and look, dump the scene children within about 60 px of each seat, hide while the breathing image is visibly up, then show the NPC again. A needs NPC re-sits through its routine within about a second; a plain seated NPC comes back standing and stays standing, which is intended (`SOFA_FIX.md` on `build/ol-m03`, "A plain seated NPC is marked `_seatTried`"). Do not log the standing story NPC as a bug (`measurement-recipes.md` section 6).

### Seated pose checks
Not yet measured. Seated pose checks follow plan slice 7 (`docs/achitechture/M03_OFFICE_LIFE_PLAN.md`); the results will be in `SLICE7_SEATS_POSES.md` in the mission's `office_life/` folder. Until then, use the seated-offset note above and the night-turn render check above.

## Mappings and conditions

### The validator rejects `||`
Write "A or B" as two mutually exclusive mappings, each with its own once key. Do not rely on two overlapping mappings both firing.

### First-frame `previousRoom`
The start room's first `room_entered` fires with `previousRoom` null and NPCs already registered. The evaluator has no `==`: `== null` did not fire in 5 of 5 fresh games, `=== null` did. A mapping with no `previousRoom` term already matches the first frame, so an extra first-frame mapping only double-writes (`STAGE1_CHECKS.md`).

### Toast spacing
Timed toasts need at least 4 s between them. 2500 ms then 2500 ms landed together, 6000 left 3.5 s, 6500 gave 4.0 s.

### Credits wording
A credits warning must not name a place or person that may not be there. "A COLLEAGUE OF HERS" had no referent and "IN RECEPTION" was wrong for a hit at the cooler. Use a neutral phrase ("SOMEONE STRUCK BY DAY") and exclude the KO lines by condition.

### Appending keeps once keys stable
`onceOnly` keys are `<npc>:<pattern>:<handlerIndex>`. Append new mappings at the end of an NPC's list so no saved key moves.

## Content

### Placeholder ink must not reach main
Slice 3 and 4 placed "(placeholder line)" ink on talkable NPCs. Reviewers rated it a major. Keep the branch off main until slice 5 replaces it, or write the approved lines in the first place.

### Wording must match the approved sample
Text variants written ahead of `DIALOGUE_SAMPLE.md` drifted from what the user approved; the review caught it. Copy approved wording exactly.

### Voicing
The game client voices eventMapping barks: `npc-barks.js` `_speakBark` calls `TTSManager.play(npcId, text)`, which posts to `/tts`, and the endpoint accepts bark texts (`TtsLineResolver` through `ScenarioBarkValidator.canonical`). Only a person NPC with a `voice` speaks a bark. On a keyless server the endpoint answers 503 for an uncached line (a cached bark still plays); the phone beep then plays only when the bark is a toast, not a bubble (`beep: !handle`, `npc-barks.js:470`). Barks are generated by the normal tts-audio batch, V6 counts them, and the voicing yes states the clip count including barks. Agents never start a keyed server or play through to voice a line; list each bark in `SPOKEN_LINES.md` (a new bark needs a reason, otherwise use a chatter pool or ink knot) and let the batch voice it. Interim route: until build/tts-barks is on main, the batch skips barks and V6 does not count them. Count barks by hand in the voicing yes and hold them (and the release) until that branch lands, then voice them with the batch. No agent voices barks by any other route; if the user wants them sooner, how is the user's call. A line a review changed after voicing needs the user's own yes before re-voicing.

## Git, servers and tests

### Merging main
`git merge main` into `build/ol-m03` hit an add/add conflict in `tools/playtest/npc-pose-live-proof.mjs` (both sides added it). The fixer aborted and asked the owner. Expect it on any branch that predates the pose work; do not resolve it blind, and re-run the suites after the merge.

### Stop servers by PID
Record the puma process PID at start and stop that PID. Never `pkill -f` and never `ps | grep ... | kill` where the pattern is in the same command line (it killed the fixer's shell twice). `./start_server.sh` runs `pkill -9 -f puma` and takes other servers down.

### Leave the flags XML alone
Do not `rm tools/playtest/*-flags-game*.xml`: older files are tracked.

### Suites one after the other
When debugging by hand, run `bin/test-js`, then the Rails suite, never together. The merge gate is `tools/playtest/train-check.sh` through the integrator, not these. `LabPhysicalPentestSecretsTest` is a known flake; re-run it alone before calling a failure real.

### Fresh game per scenario edit
A game row keeps the scenario it was created with. Make a new game after every edit to `scenario.json.erb`.

### Run the merged tip
A live pass on a lineage that predates a fix does not count. Play the merged tip, with main merged in, before the final review.

## Smaller items

- `requireGlobal` is a strict `===` test (`npc-needs.js:310` to `:314`, build/ol-m03). A global used in a `requireGlobal` false-check must be declared in `globalVariables`, or the exchange silently never plays (`references/mapping-patterns.md` section 6).

- `player_state` delta sync: every new value is a bounded key sent as a delta, never a growing list re-sent whole.
- `scenario.json.erb` holds ERB comments with `%>`; edit with `str.replace`, never a Python `%` format.
- Run V6 from the worktree root so it reads the branch's scenario.
- A worktree has no `node_modules`; symlink the main checkout's for the run and `unlink node_modules` after (never `rm -r`).
