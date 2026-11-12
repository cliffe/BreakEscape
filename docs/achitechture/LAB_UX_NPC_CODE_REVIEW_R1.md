# Lab UX, NPC half (q53 e, f, g): code review R1

Branch `build/lab-ux-npc` against `main`, 2026-11-12. Adversarial review of the keying window at the records reader (e), `noticeRadius` for NPC interests (f) and the player no longer pushing patrolling NPCs (g).

Counts: 0 blocker, 0 major, 7 minor, 5 nit.

## How this was checked

- Read the build log and the whole diff (engine, lab and test scenarios, schema, both validators, five JS test files, the Rails test file).
- Ran every changed JS test file (npc-needs 63, npc-player-push 6, npc-route-multiroom 25, validator-npc-leash 10, validator-patrol-catch-locks 12, all pass) and `lab_physical_pentest_secrets_test.rb` (36 runs, 0 failures). The validator reports no failures on either changed scenario.
- **Do the tests fail without the change?** Yes, every one. With main's `npc-behavior.js`, `npc-needs.js` and both validators swapped in, the 4 new route tests, 1 leash test and 2 patrol-lock tests fail, and npc-needs fails at import. Two narrower mutations also fail as they should: removing only the distance filter in `_carryCandidate` fails both radius tests, and removing only the `slide` return in `npc-sprites.js` fails the wall test.
- Ran it in a real browser: my own keyless server on :3049, headless Chromium, `game.physics.world.setFPS(20)` with fixed steps on (confirmed `[20, true]`). Games 1463, 1475 and later fresh lab games. Scripts are in the scratchpad (`pin_window.js`, `push_probe.js`, `tailgate_probe.js`).

## (e) Keying window: fairness, measured

I stood at the ledger shelves, watched the door the way a player would (polled every 50 ms), waited a reaction delay and then pressed a real `E` keypress.

| Cycle | Door opens | Keying starts | Keyed (done) | Window | Look |
|---|---|---|---|---|---|
| 1 | 15795 | 16594 | 19089 | 3294 ms | none |
| 2 | 33349 | 34055 | 36589 | 3240 ms | none |
| 3 | 49996 | 50671 | 53214 | 3218 ms | E at +3481 ms: refused, "Too late" toast |
| 4 | 66747 | | | | E at +834 ms: PIN read, `opt_pin` ticked |

- **Margin.** A player already at the shelves who presses E 0.8 s after the door goes dark has about 2.4 s to spare. The door is on screen from the shelves, the doorway goes dark and the reader plays `rfid_unlock`, so the cue is clear and one key does the look (the shelves are the nearest interactable at 25 px; Len is about 100 px away and never takes the E). Using the mouse is a single click on the shelves, also comfortable. Even a slow reaction of 1.5 s leaves more than 1.5 s. **Fair** for a student who is waiting there, as the observation text tells them to. A student who is still walking over loses that round and waits about 17 s.
- **"Too late" hint.** Clear, appears only after he has keyed, and says what to do next time. I'd keep it.
- **Cycle length.** Measured door to door: 17.6, 16.7 and 16.8 s. The gate now stays open 11.6 to 12.5 s, which is longer than the old 9 to 10 s, so the tailgate gets easier rather than harder. A tailgate run (courier_ready set, walk in on the first door open) succeeded: `kp_badge_tailgated` true and the task ticked. `enterRoom` needed 2 attempts, because Len now stands at (1, 2), right in front of the door gap (x 992 to 1024), for 2.5 s. No voiced line changed. Nothing timed in the lab broke that I could find.

### Minor E1. A second gate opening in one cycle re-arms the window with no keying

In a run where the player stood mid-floor at about (1040, 95), inside the gate radius, the events were: `door_gate_opened` 51569, keying 52446 to 54979, **`door_gate_opened` again at 58822** (Len coming back out after the gate had closed behind him), then a keying at 65862 with the gate held shut. The `door_gate_opened` mapping sets `len_at_door: true, len_keyed: false`. That means the exit opening reopens the shoulder-surf window, and a look during it is credited although nobody is keying. With the player at the shelves the gate stayed open all cycle (one opening per cycle in four cycles), so a player has to bring this about (stand near the gate, then step to the shelves, about 1 s away). Still, the credit no longer matches the claim "read while he keyed". Fix: arm the window on `npc_used_object:badge_reader` rather than on the gate opening. For example, keep `len_at_door` from the gate, add `len_keying` true on `npc_used_object` and false on `_done`, `door_gate_closed` and `game_loaded`, and credit on `len_at_door && len_keying`. Alternatively, keep `len_keyed` true until `door_gate_closed` and drop it from the `door_gate_opened` mapping. Either way the window would then run from about +0.7 s to +3.2 s, so measure the margin again (about 1.7 s after a 0.8 s reaction), or count from the door opening only on the first opening after a done event.

### Minor E2. "About every 15 seconds" left in two texts that are not voiced

Only the `ruth_phone.ink` line is voiced. The task description (line 311) and the `hint_tailgate_now` toast (line 464) are plain text, and the cycle is now about 17 s. They could say "about every 17 seconds" or "every 15 to 20 seconds" without touching audio. The ink line can stay ("about every 15" is close enough when spoken).

### Nit E3. Validator and engine disagree on what counts as a route

The single-room warning tests `!patrol['route'].is_a?(Array)`, but the engine runs actions only when `multiRoom && route.length > 0`. A `route` with `multiRoom` false passes the validator, and its actions never run.

## (f) noticeRadius

- I checked every scenario's interests by grep. The needs-style interests are in `lab_physical_pentest` (lord), `test_access_work`, `test_capture_log`, `test_needs_sims` and `test_npc_needs`. `lab_social_engineering`, `test_ink_email` and `test_social_*` use `interests.topics`, which is social targeting and goes through a different code path, so they are unaffected. The builder's table is right: no notice room in use is wider than the 22.4-tile diagonal of a 20 x 10 room, so 24 tiles changes nothing for an NPC standing in its notice room. Live, game 1419 per the log, and the radius tests fail without the filter. **24 from the NPC's current position is sensible** and matches "quite wide".

### Minor F1. A future large room is silently cut down

The office-life work is heading into m01 to m10, where some rooms may be wider than 24 tiles. There the default quietly stops an NPC seeing the far end of its own notice room, and nothing reports it. The validator could warn when a notice room's diagonal is longer than the effective radius (default 24). Alternatively, the README could say that the default covers rooms up to about 20 x 12.

### Nit F2. A comment has moved to the wrong constant

In `npc-needs.js`, `AVOID_RADIUS_TILES = 2` has lost its trailing comment. The comment "needsCompany.avoidRadius default, only for an NPC that declares avoids" now sits on `NOTICE_RADIUS_TILES = 24`.

### Nit F3. Engine and validator take different inputs

The engine accepts `"4"` (it calls `Number()`) and treats `0` as the default, while the validator rejects both. The same goes for `useMs`. This is harmless because the validator is the gate, but a one-line note in the schema description would help. `_carryCandidate` also uses a bare `* 32` where `TILE_SIZE` exists.

## (g) Player against patrolling NPCs

**What I checked live** (lab, setFPS 20, fixed steps):
- **Is the pin always undone?** I sampled `len.body.pushable` on every animation frame: 2645 frames standing in his path and 549 frames walking into him with arrow keys (six 1.5 s pushes). It was false in **0** frames, so the `worldstep` unpin runs after the colliders, as intended. Wall overlap for the player stayed 0 in both runs.
- **The player standing still in his path in open floor.** Len stops, then gets round: the closest he came was 18 px, he keyed and went in, and the player was moved 4 px. In an earlier run with the player 3 px further north, Len stood about 40 px off for at least 10 s before my observation window ended (see G4).
- **Hostile and KO'd NPCs:** `keepsRouteAgainstPlayer` excludes both, so they are pushed as before. The unit test covers this. **Conversation:** the player cannot move while talking, so there is no contact to resolve.
- **Can an NPC be stuck on the player for ever?** Not through the physics. Near a wall the pair do not collide at all ("slide"), so a one-tile corridor or a doorway cannot wedge them. In open floor the NPC is unpushable and the player is pushed. If the player is pushed to within 12 px of a wall, it becomes a slide. Tunnelling through the 8 px wall boxes: none seen, and the margin (12 px) is more than one step of the fastest patroller.

### Minor G1. Slide means the player walks through a patrolling NPC by any wall, doorway or narrow corridor

That follows from the design, and I found no lock bypass: gates and doors are separate bodies. But the player now passes straight through a guard in every doorway, and the lab task text says "Don't stand in the doorway: he has to squeeze past you", which is no longer what happens. Either change that sentence, or note in `README_scenario_design.md` that a patrolling NPC cannot body-block the player (or be body-blocked) near walls, so designers do not build a "guard blocks the corridor" beat on it.

### Minor G2. Only wall boxes count as "near a wall"

`wallRectsFor` reads `wallCollisionBoxes` for two rooms. It does not read desks, cabinets, chairs or closed door bodies. In open floor a pinned NPC that walks the player into a desk presses the player between an unpushable body and a static one. I did not reproduce a tunnel (Len's avoidance mostly stops him first, and desk bodies are thicker than 8 px), but this case was not tested by the builder or by me. Either add the room's static object bodies to the nearness check, or run the probe once against a desk in a patroller's path (test-npc-patrol has open floor and furniture).

### Minor G3. The test-npc-patrol upper bound was not separated out

The build log's "largest move along a push ... 38 px" mixes Len's own walking with any push, so it is an upper bound and does not show the push is 0. The frame sampling above settles it for Len. A second probe, with the patrollers frozen (patrol speed 0 or their behaviour paused) during the contacts, would settle it for test-npc-patrol.

### Minor G4. A still player can hold Len up for 10 s or more (cause not pinned down)

In run one (game 1475, player standing at 1043, 91, 40 px from Len, no contact), Len stood still for the whole 14 s window and no keying event fired. In run two, from nearly the same spot, he got round and keyed. This is the avoidance system (`_handleBlockerAhead`, `NPC_STUCK_PLAYER_PX`), which this branch does not change. The useMs change does make a cut-short reader leg count as "work" on every lap (`_keepRouteLeg` puts it back when he stopped more than 1.5 tiles short), whereas before it did so only until secure_area was loaded. So a player loitering by the reader can now make Len retry the leg every lap instead of skipping it. Run once on main and once on the branch with the player parked at (1043, 91) for 60 s to see whether this is new.

### Nit G5. The pin lasts until the end of the physics step, not "that one separation"

Any NPC-NPC collider that runs later in the same step sees the pinned NPC as unpushable. The effect is one step at most and harmless, but the build log and code comment say NPC-NPC collisions are "unchanged" or "untouched".

## The Rails test file

`lab_physical_pentest_secrets_test.rb` is updated correctly: it pins the new `setGlobal` shapes and extends the one-toast-per-outcome check to four globals (16 cases, including "too late"). It fails on main's scenario. It now passes.

### Nit R1. The guard against misleading text is weaker

The old line refused any hint, timer or note text mentioning "keying", so that texts could not describe the wrong window. It now refuses only `\bclick` and asserts "keying his PIN" and "Too late" are present. Nothing now checks that no text still describes the window as "while the door is open". A refute on something like `/before it shuts|while (it|the door) is open/` would restore that guard.

## Housekeeping

- Server on :3049 stopped (own PID). No repository files changed apart from this review.
