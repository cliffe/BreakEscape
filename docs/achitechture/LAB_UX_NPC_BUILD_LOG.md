# Lab UX, NPC half (q53 e, f, g): build log

Branch `build/lab-ux-npc`, 2026-11-12. From the backlog section "Lab follow-up: screens, gates and hints". The other four q53 items are in the lab UX UI build.

## (e) A keying event at a badge reader

**Engine** (`systems/npc-behavior.js`). A route waypoint action with `useObject` now emits `npc_used_object:<id>` `{ npcId, objectId, roomId, useMs }` as the NPC starts. A new optional `useMs` (0 to 30000) makes him stand facing the object for that long, then emits `npc_used_object_done:<id>` and runs the rest of the action (the `unlockRoom`). Without `useMs`, both events fire at once. A retried unlock does not repeat the events, and each new arrival does. A timed use counts as route "work", so a leg cut short beside the spot still counts as the arrival, the same as an unloaded `unlockRoom`. Waypoint actions run only on multi-room routes, as before.

**Lab** (`lab_physical_pentest`). Len's reader waypoint has `useMs: 2500`. Ruth's mappings set a new global `len_keyed`: false when the gate opens for him or he starts keying, true on the done event, false on `game_loaded`. The shoulder-surf (`player_watched_reader`) now needs `len_at_door && !len_keyed`. That window runs from the gate opening to the moment he has keyed, about 3.1 s, where before it was the 9 to 10 s the gate stays open. The shelves have a new "too late" hint for a look after he has keyed, and the "nobody at the keypad" hint now says to look across while he keys. Hints are toasts, so no voiced line changed. His cycle grows by 2.5 s, to about 17 s. The texts that say "about every 15 seconds" (task description, hint, ruth_phone ink) were left alone, because the ink line is voiced.

**Validator and schema.** `useMs` is checked: an error if it is not a number from 0 to 30000, a warning if there is no `useObject`, and a warning for an action on a single-room patrol. The schema and `README_scenario_design.md` cover it.

**Is the window fair?** Measured live in game 1375, at setFPS(20) with fixed steps on, standing at the ledger shelves:
- Gate opens at t, keying starts at t+0.6 s, done at t+3.1 s (the same on two cycles: 3114 ms and 3074 ms).
- A look 1.5 s after the door opens is credited (PIN on the tablet, task ticked, screenshot taken).
- A look 0.6 s after he has keyed is refused with the "too late" hint.
A student who is already at the shelves, waiting for the door as the hints say, has about 3 s from the door going dark. A student who is still walking over when it opens misses that round and catches the next one, about 17 s later.

## (f) `noticeRadius` for NPC interests

**Engine** (`systems/npc-needs.js`, two small edits). `interests.<tag>.noticeRadius` is measured in tiles from where the NPC stands to the item, and it applies on top of `noticeRooms`. The default is `NOTICE_RADIUS_TILES = 24` (768 px). Values are clamped to 0.5 to 100, and anything else falls back to the default.

**Why 24.** Every scenario that uses NPC interests was checked by rendering its ERB:
- `lab_physical_pentest` lord: notices `open_plan` (room_lw_accounts, 20 x 10 tiles, 22.4-tile diagonal). Home desk at (2, 6.5); the far corner is 17.9 tiles away.
- `test_access_work` lena, priya, kofi: one 10 x 10 room each (12.7-tile diagonal).
- `test_capture_log` sofia; `test_npc_needs` finder: one 10 x 10 room.
- `test_needs_sims` amara: office, 10 x 10.
- `test_needs_sims` grace: office and kitchen, which sit side by side (20 x 10).

Any two points inside a 20 x 10 room are at most 22.4 tiles apart, so an NPC standing in its notice room sees exactly what it saw before. The only change comes when the NPC is outside its notice rooms and more than 24 tiles from the item. Two cases: lord on a coffee trip, or grace in the lounge with a mug at the far end of the kitchen. Such an NPC now notices the item once it comes back within range, a short delay rather than a missed beat. (The `ca*`, `lab_social_engineering` and `test_social_*` scenarios use `interests` for something else, social targeting, and are not affected.)

**Validator and schema.** An error if the value is not a number from 0.5 to 100, and a warning under 2 tiles. The schema and `NPC_NEEDS_SYSTEM.md` are updated.

**Test scenario beat.** In `test_npc_needs` the finder has `noticeRadius: 4`, and the brief says so. Dropping where you start (about 3 tiles from him) still works.

**Live proof.** Game 1397 (test_npc_needs): binder dropped 7.5 tiles away in the far corner, still lying there 15 s later, finder idle. Picked up and dropped 3.1 tiles away: fetched and used (`finder_used_item`). Game 1419 (lab, default radius): the USB stick dropped at the far east end of open_plan, 15.7 tiles from lord, and he took the job at once.

## (g) The player no longer shoves routed or patrolling NPCs

**Options considered.**
- *A heavier NPC* (immovable or high mass, all the time). Rejected. An NPC that cannot be moved presses a player who is against a wall into the 8 px wall boxes. It would also change NPC-to-NPC collisions.
- *Letting the player slide past everywhere.* Safe, but the player would walk through guards in open floor.
- *Walking the NPC back to his route after a push.* This is half there already, for routed guards. The push itself, and its wall risk for the NPC, would remain.

**Chosen: a hybrid, scoped to the player pair** (`systems/npc-sprites.js`). For an NPC with `patrol.enabled` that is not hostile or KO'd, the player-NPC process callback works as follows:
- With the player more than 12 px from every wall box in the player's room and the NPC's room, the NPC's body is made unpushable for that one separation. The player stops against him and he keeps his line. He goes back to pushable after every physics step (`worldstep`), so NPC-to-NPC collisions are unchanged.
- With the player within 12 px of a wall, the pair does not separate at all: the player slides past. 12 px is more than one 20 fps step of a 200 px/s NPC.
- Other NPCs (stationary, needs walkers, hostile) are pushed as before.
The existing "wall-aware" refusal (NPC already in a wall: no push) is unchanged.

**Live proof**, headless at setFPS(20) with fixed steps on (never fixedStep false):
- Lab, game 1375, Len dwelling at (4, 4), player walking into him for 1.5 s: before the change he was shoved 53 px; after it he moves 0 px in both directions.
- Lab, along the wall while Len keys at the reader (twice): the player slides past (81 to 41 px), Len moves 0 px, wall overlap 0 for both.
- Lab, the player standing on Len's reader spot, against the wall, as he arrives and keys (twice): the player stays put, wall overlap 0.
- test-npc-patrol, game 1409, 12 contacts each with three patrollers, from both sides and diagonally. Before: the narrow-horizontal patroller (in the top wall band) was shoved from y 51 to 20, the player reached a 7 px wall overlap with patrol_basic, and the largest move along a push was 82 to 87 px. After: the narrow patroller does not move, wall overlap is 0 for the player and every NPC, and the largest move along a push is 0, 25 and 38 px. That last figure includes the NPC's own walking (random patrol), so it is an upper bound.
- The test script teleports the player beside the NPC. Teleports that landed inside a wall are skipped (2 and 1 of 12), because they are a setup artefact.

## Tests

- `test/js/npc-route-multiroom.test.mjs`: four new tests (events with and without `useMs`, hold then done then unlock once, re-emit per arrival and not on retry, a cut-short timed leg counts as the arrival). 25 pass.
- `test/js/validator-patrol-catch-locks.test.mjs`: three new tests. 12 pass.
- `test/js/npc-needs.test.mjs`: three new tests (normalising, inside and outside the radius, the room-wide default). 63 pass.
- `test/js/validator-npc-leash.test.mjs`: one new test. 10 pass.
- `test/js/npc-player-push.test.mjs` (new): the rule, wall nearness and the real collider callback on a fake scene. 6 pass.
- Full suites under the shared lock: JS 508 of 508 files pass. Rails 1796 runs, 2 failures, both in `lab_physical_pentest_secrets_test.rb`, which pinned the old wiring (`len_at_door` alone, three shelf hints, "the window is the open door, not the keying"). Updated for the keying window; that file now passes, 36 runs, 0 failures. The full Rails suite was not rerun.

## Open

- The lab's "about every 15 seconds" (task description, `hint_tailgate_now`, `ruth_phone.ink`) is now about 17 s. Left alone: the ink line is voiced.
- The rule in (g) covers patrol NPCs only. A needs NPC walking an errand can still be shoved. Extending it is a one-line change in `keepsRouteAgainstPlayer`, but it overlaps the needs builds running in parallel.
- In test-npc-patrol the narrow-horizontal patroller stands at y 51, inside the top wall band. That is a scenario quirk, unrelated to this change.
