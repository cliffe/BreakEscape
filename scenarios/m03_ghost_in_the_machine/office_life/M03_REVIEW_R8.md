# m03 office life, review round 8 (delta)

Scope: `git diff 4cc0cf43a 5056217fd -- public/ test/` (the instant unseat on hide, answering R6 minor and nits 1 to 3). Read-only review of code; no servers or suites run (the fixer's results taken as given: JS 736/0, Rails 3186/0).

Verdict: no blockers, no majors. 3 minors, 2 nits. The instant unseat itself is sound for the case it was written for (a plain sitter on a sofa, m03 Zainab at the act-2 hide). The needs-NPC show path it also claims to support does not work as described.

## What was checked and is fine

- Order inside `unseatNPC` (seating.js:1631-1695): the standing collider is restored and `moveFeetTo` runs while `sprite.body.enable` is still true. `setNPCVisible` disables the body only after the call returns (npc-behavior.js:428-435). No ordering problem. On show the body is re-enabled and re-syncs from the game object.
- Breath image, crop, `officeTypists`, `_seat`, the chair place and `chair.seatedBy` are all released (seating.js:1640-1646). `releasePlace` deleting `seatedBy` is harmless because only 'full' or a single occupant is ever stored there.
- Stand spot: same `npcStandSpot` / `standAt` as the normal stand-up, so the same box, line and grid checks apply. No new furniture or wall risk beyond the existing stand-up.
- No listener consumes `npc_stood` (only emitters found), so emitting it on hide has no side effect. `npc_sat_at` / workstation state is not touched by unseat in either mode.
- Player seating: the freed place (`_places`, `seatedBy`) is the same data the player's sit reads (seating.js:271-272, 1060), so the player can sit in it.
- Reload: nothing about seats is synced. Only `recordNpcVisibility` is saved (npc-manager.js:2205). After a reload a hidden NPC has no `_seat` and a fresh chair, so seat state and places agree.
- Shipped callers: `setVisible` is reached only from npc-manager.js:1658 (mappings). Plain `seated` NPCs exist only in lab_physical_pentest and test_seating, neither of which hides or shows one. m03's Zainab is a needs NPC and is only ever hidden (scenario lines 847-891), never shown again.

## Findings

### R8-m1 (minor) A needs NPC does not re-sit on show: `_seatTried` is not what gates it

- seating.js:1644 (`_seatTried = !(opts.instant && needsStop)`), npc-behavior.js comment and SOFA_FIX.md say the needs routine "can re-sit it on show".
- `_seatTried` is read only on the plain-seated branch (seating.js:1947), which a needs NPC never reaches (it returns from `updateNeedsSeat` at 1944). The needs gate is `_seatStopKey` plus `_seatTriedAt` (seating.js:2336-2340). After the hide, `_seatStopKey` still equals the current stop key, so `retry` is true and `postSeatRetryDue` (seating.js:2218) returns false for any stop that is not a post: the NPC stays standing at that stop until the stop changes. At a post stop it waits `POST_SEAT_RETRY_MS` and spends a retry from `_seatRetries` (`postRetryAllowed`), and `_seatGaveUp` may also be set.
- Failure: any scenario that hides then shows a needs NPC mid-stop (not m03 today, but the office-life skill is meant to spread this) gets a standing worker at a seat stop with no retry, or a long delay.
- Fix: in the instant branch for `needsStop`, clear `behavior._seatStopKey = null`, `_seatGaveUp = false`, `_seatRetries = 0` (the "new stop" reset at seating.js:2342-2349 then runs on show). Leave `_seatTried` alone for needs NPCs, or drop that line's needs special case. Correct the write-up.

### R8-m2 (minor) The tests do not exercise the instant landing or the needs branch

- test/js/npc-hide-seated-breath.test.mjs:49-62, 105-116.
- `mkSeated` gives no `pathfindingManager`, so `npcStandSpot` returns null and `moveFeetTo(sprite, spot...)` (seating.js:1666) never runs. Test 4 only asserts the collider restored and `_seatTried === true`. Nothing asserts the NPC ends at the stand spot, that `_seatMove` is not created, that a swivel chair is not pushed (velocity), or that a needs seat (`needsStop`) resets re-sit state. The R8-m1 defect would have been caught by a needs test.
- Fix: add a stub `pathfindingManager`/`standAt` case asserting the feet equal `standAt` and `behavior._seatMove` is unset; a swivel case (chair with a body) asserting no chair velocity; a needs case asserting the NPC re-sits after show (or, per R8-m1, that the re-sit state is reset).

### R8-m3 (minor) A hidden NPC mid-fetch still holds a chair reservation

- seating.js:1631-1636 only handles `_seat` and a non-step `_seatMove`; `startFetch` (seating.js:2428) sets `chair.seatedBy = npcId` and `_fetch`, and the fetch only times out inside the NPC's own update, which does not run while hidden.
- Failure: a needs NPC hidden while fetching a chair leaves that chair reserved (and unusable by the player or others) until the NPC is shown again. Same class as the sofa bug this change fixes, one state over.
- Fix: in the hide branch, also end `behavior._fetch` (clear `chair.seatedBy` if it equals the NPC, stop any glide) and `_seatMove` of stage 'step' (restore `savedImm`).

### R8-n1 (nit) Hide then show differs from reload then show for a plain seated NPC

- After the hide the NPC has `_seatTried = true` and stands on show (test 4 pins this). After a reload the fresh behaviour has `_seatTried` unset, so the same NPC sits again on show (seating.js:1947-1959). The same mapping gives different results by reload. Unreachable in shipped missions (see above). If standing is the intent, persist nothing and accept it; if sitting is, set `_seatTried = false` for plain seated NPCs too. Pick one and say so in the write-up.

### R8-n2 (nit) Edge cases left as the normal stand-up leaves them

- A hostile or KO sitter (`halt`, seating.js:1651) or a null stand spot lands at the seat centre, so a shown NPC overlaps the sofa until the ghost pair ends. A swivel chair keeps its last facing rotation and no roll-back on instant unseat (seating.js:1672). Both match the existing stand-up behaviour and affect only a hidden-then-shown seated NPC. No action needed.

## Counts

blocker 0, major 0, minor 3, nit 2.
