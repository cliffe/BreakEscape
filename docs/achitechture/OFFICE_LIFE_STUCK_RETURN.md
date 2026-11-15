# Office life: stuck needs walks and re-routing

## Handover (2026-11-15, second budget stop)

Earlier: slice 1 (`0a5cdfd98`, `5a6525cf9`), slice 2 grumble earshot (`6c2eb2d6b`), proof driver (`9620e78f1`).

This run:
- `c11767214`, `74508d9e2`: mutters follow the grumble earshot rule. `_sayMutter` passes `always` only for `PRIORITY_MUTTERS` (`login_aloud`, the line the player is meant to overhear; its listening window opens when it is said). The workaround start lines (`wk_writes_down`, `wk_prop_door`, `wk_borrow`, `wk_share_login`, called from `npc-workarounds.js` `due()`) are now a picture out of earshot. The q42 test's premise was updated (Mei's chatter must be heard to hold the lock) and a new test covers both cases.
- Cause of Marek's wedge at (111-116, 138), found with a stall dump in game 5347: seated Sanjay's body (immovable, 85-107 x 122-133) touching Marek's top-left corner, and a loose swivel chair (`chair-white-2-rotate3`, a dynamic body, never in the world grid) north-east of Sanjay's seat. `handleNPCCollision` (npc-sprites.js) settled the walker for 300 ms on every collision; touching a body that never moves re-collides every frame, so velocity stayed 0 and `pathIndex` stayed 0 while a valid `includeHeld` path (13 waypoints, north round Sanjay) was loaded. Not a grid bug: the desk and seated chair were in the grid.
- `2608540fa`: no settling against a held (immovable) NPC body. `873504ef6`: the `includeHeld` search also avoids every chair body (`window.chairs`), with a node test.
- `873504ef6` (scenario): Sanjay's caffeine follows `npc_left_post:marek` only during the Coffee Notice beat (global `coffee_notice_beat`, set by reading the notice, cleared by Marek's cup). Row 1's queue used to set it, and with Marek queued Sanjay parked the need for two minutes without any turn-back, so row 2 found it parked (5347: parked tick 283, notice tick 403).
- `3681252d1`: the driver reads the notice only once Marek is idle at his post (a notice read while he walks home sends him straight back with no `npc_left_post`, so Sanjay never sets off).

Live proof so far (port 3093, keyless, headless setFPS(20)):

| Game | Driver | Notice closed | see_turned_back | see_look_round | Marek home after coffee (s) |
|---|---|---|---|---|---|
| 5349-5352 | old wait, before the settle fix | yes | no | no | never in 100 s, wedged at (108-113, 138) |
| 5358, 5359, 5360, 5362 | old wait, settle fix | yes | no | no | 6, 6, 6, 6 |
| 5361 | old wait, settle fix | yes | no | no | 45 (wedged on the player at the stand point, 172,196) |
| 5363, 5366 | new wait | yes | no | no | 80, 83 |
| 5364, 5365 | new wait | yes | yes | no | not measured (no cup in the window) |
| 5367 | new wait | yes | no | no | not measured |

Still open:
- **Wedge on the player.** The driver stands the player at the midpoint between Sanjay and the coffee (about 176, 192), on Marek's route. 5361 stalled there; 5363 and 5366 probably too (not yet confirmed from their JSON in `tmp/stuck-proof/`). The NPC-player collision handler (npc-sprites.js, the second "ALWAYS trigger settling" block, about line 1590) still settles every frame, the same loop as the seated body. Next: decide whether a stationary player counts as held for settling, or move the stand point off the route (README row 2 says "mid-office"), then re-run.
- **see_look_round 0 of 5, see_turned_back 2 of 5.** Not diagnosed. Read `sanjay_grumble` and `events` in the per-game JSON, and the needs log for Sanjay (`parked` with no `turned_back` means he chose no job because Marek already held the claim or queue: a park at candidate selection emits no `npc_turned_back`).
- No node test for the settle guard (`handleNPCCollision` is not exported).
- Train smoke on m01 and m02 not run this round (games 5356 and 5357 were made for it and not driven). Games 5341, 5343 and 5347 were diagnostic runs; 5353 failed to boot under load.
- The grumble earshot pair (one picture out of earshot, one spoken) was not re-proved live this round.

## What goes wrong

Needs walks (out to a coffee machine or cooler, and home again) move with `goToAndStay`. Three gaps let them wedge.

1. **False arrivals from a collision.** `npc-sprites.js` ends any `goToAndStay` walk whose NPC bumps another NPC or the player within two tiles of the destination, measured from the sprite's origin (about 16 px above the feet). The needs layer only accepts an arrival within `ARRIVAL_NEAR_PX` (48 px) of the destination by body centre, so a bump 49 to 64 px short is an `arrival` the needs layer rejects as far. On a walk home it re-issues once, then ignores the rest. The NPC stands still, `_watchReturn` re-issues after 3 s, the walk bumps the same colleague, and the loop runs for minutes (game 5260: Marek, `pathLeft 8, dist 52`, Tom standing beside him).
2. **Held and seated NPCs are invisible to re-routing.** A seated NPC (or one held still while using an object) has an immovable body. The world grid is built only on room load and door open, so it doesn't include them. The local avoidance (`_dynamicBlockers`) and the detour search (`_avoidDynamicPositions`) both skip immovable bodies. So every re-plan, from the stuck watch, a detour or a needs re-issue, returns the same path straight into the seated colleague or their chair (games 4232, 5060, 5061).
3. **Nothing gives up.** The behaviour layer's stuck watch re-plans the same path for ever. The needs layer re-issues the walk home every 3 s (`return_resumed`), and an outbound walk waits for the job deadline (`timeout`).

## The fix

**Re-route option (chosen): block other NPCs' bodies, seated and held ones included, in the walker's own search.** A needs walk that has stalled plans its next path with `avoidDynamic: { exceptSprite, includeHeld: true }`. That marks every other NPC body, the immovable ones as well, plus the player, as avoided cells for that one search, and never the walker's start or goal cell. If that search finds nothing (the only way through is past the body), it falls back to the plain search, as now. Blocking the bodies is better than picking a side cell first. A side cell is a guess about which way round is clear, and it needs a second leg, whereas the grid search already knows the walls and desks, so it finds the real way round or reports that there isn't one. The avoid points live only for the one search (EasyStar's additional points, cleared in the callback), so nobody else's paths change.

Where it applies, needs moves only (`_moveOwner === 'needs'`), so patrols and scripted moves are unchanged:

- the behaviour layer's stuck recovery (`_recoverFromStuck` re-plan) and the local detour (`_requestDetour`);
- a needs re-issue that asks for it (`moveTo(..., { reroute: true })`, stored as `_moveReroute`, used by the first plan of that move).

**No false arrivals for needs walks.** The collision handlers end a needs walk early only when its body centre is within `ARRIVAL_NEAR_PX` (48 px) of the destination, the radius the needs layer accepts. A bump further out leaves the walk going, so the avoidance and stuck watch can route round the body. Other moves keep the two-tile rule.

**Stall watch in the needs layer, both directions.** Every tick of a walk home, and of a `goto_item` or `goto_target` leg, the needs layer records the NPC's position.

- No movement of `RETURN_STILL_PX` for `RETURN_YIELD_MS` (3 s): re-issue the walk with `reroute: true` (`return_resumed` home, `walk_rerouted` out). The outbound re-issue keeps the job's deadline.
- A re-issue that leaves the NPC within `STUCK_SAME_PX` (24 px) of where the last one did counts as a try in the same place. After `STUCK_TRIES` (3) tries in the same place:
  - home: log `return_stuck { x, y, tries }` once for this return, then stand for `RETURN_STUCK_BACKOFF_MS` (15 s) before trying again (the colleague may have stood up or walked off);
  - out: fail the job with `stuck`, which walks the NPC home as any failed job does.
- Moving more than 24 px from the place clears the count.

## What stays the same

- Patrols, scripted `goToAndStay` moves and seating's chair fetch: no `reroute`, no `includeHeld`, the two-tile collision arrival.
- m01 to m10: their needs NPCs, where they have any, only behave differently where a walk is wedged now.
- The node stub world never stalls, so the sims-day log is unchanged.
