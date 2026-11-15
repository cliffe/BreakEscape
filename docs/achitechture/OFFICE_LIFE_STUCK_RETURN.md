# Office life: stuck needs walks and re-routing

## Handover (2026-11-15, budget stop)

Done and committed: slice 1 engine and node tests (`0a5cdfd98`, `5a6525cf9`), slice 2 grumble earshot (`6c2eb2d6b`), this note and the proof driver `tools/playtest/needs-stuck-return-proof.mjs`. bin/test-js 673 files passed, 0 failed; `tts_office_lines_test.rb` 9 runs, 0 failures; bin/rubocop no offences. m01 (game 5337) and m02 (5338) pass train-smoke, but their start-room NPCs didn't move in 25 s in either game (receptionists and cutscene triggers, so no walkers to test), so the "NPCs walk" half of the regression check is still open.

Still open:
- **Marek still wedges on the walk home** (game 5336). After his coffee he stalled at about (111-113, 138), roughly where Tom stood in game 5260. The new watch did what it should: `return_resumed` three times, one `return_stuck`, a 15 s back-off, then retries. But the re-routed searches didn't get him past, and he got home after 82.5 s (the target is under 20 s). So either the `includeHeld` search finds no way round, because the blocker sits in the only gap to his desk and the search falls back to the plain path, or the blocker isn't an NPC body at all (a chair, or the desk corner). Next step: in a live game, log which body is within 24 px of Marek at the stall (NPC id, `immovable`, seated or not), and whether the `includeHeld` search returned a path. If the gap really is the only way, the fix has to move the blocker (a standing NPC in a needs walk's way could step aside) or accept an arrival at the closest reachable cell.
- **Row 2 didn't fire in game 5336.** Sanjay never turned back, and only `idle` swivels happened. The run read the notice about 97 s in, once row 1's queue had cleared, and Marek went for his coffee. Check whether Sanjay set off at all (his caffeine after row 1 may be too high), then the 5-of-5 runs.
- Live proof table still to do: row 2 5 of 5, Marek home in under 20 s 5 of 5, one wedge now routing round.
- The proof driver closes the notice's gameDisplay dialog with `dismissBlockingUi`. Its first version left the dialog open, which pauses the needs clock (games 5331 and 5335 were wasted that way). Games 5328 to 5330 were created by this run and never driven.

Status: built on branch build/ol-stuck-return. Owner items 5 and 5a in `scenarios/test_needs_sims/README.md`.

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
