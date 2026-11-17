# m03 office life, round 7 delta review: coffee-pair side swap

Scope: commits 33a0355ee, 7e8533043, 93722e9aa (merged in 1ef98533f), diff `21efae5a0..1ef98533f` over `public/` and `test/`. Read-only review of `_sideBlocker` and the swap in `_moveForPhase` (`public/break_escape/js/systems/npc-needs.js`) and `test/js/npc-needs-pair-side-swap.test.mjs`. No servers or suites run (the fixer's JS 736/0 and Rails 3186/0 taken as given).

Verdict: no blockers, no majors. The swap is correct for the case it targets and nothing in it can strand a player or the mission. Three minors and two nits, none needed before merge; the first two are cheap guards worth taking if the file is touched again.

## What I checked and found sound

- **Order of bookkeeping.** `job.dest` of the new claimant is set (line 3423) before the recursive `_moveForPhase(swapWith, { noSwap: true })`, so the first user's `taken` list holds the new main cell and `besideCell` returns the side cell. `noSwap` stops any second-level swap, so recursion is one deep.
- **Stale arrival.** The re-routed first user gets a fresh `_nextMoveId()` (line 3434). `_acceptArrival` drops an arrival whose id differs (`arrival_ignored`, line 739 to 743). If the first user is already within `HOME_EPS` of the side cell it takes the synthetic-arrival branch, which overwrites any queued arrival in `_arrivals`. An arrival for the old move that is already queued is therefore never counted for the main cell. A user who has physically reached the main cell is never swapped: `dO` is about 0, so `dO > dMe` fails.
- **Events.** `pair_side_swap` goes to `_log` only (line 5041, ring buffer, no emit, nothing synced). `npc_left_post` (with `expectedAwayMs`) is emitted in `_leavePost` before `_moveForPhase`, so it is neither duplicated nor dropped for either NPC. `npc_use_started`/`using` are emitted on arrival, so one per user. The swapped NPC's original `npc_left_post` stays valid (side cell is 32 px from the approach cell, and `_expectedAwayMs` uses the approach cell), so lock decisions are unchanged.
- **Ping-pong.** After a swap the first user's `dest` is the side cell, so the new claimant never swaps with it again (`_sideBlocker` needs the other's dest to equal the main cell). The first user can swap back only from its own stall re-route (`_watchWalk` line 4308) and only if it has become nearer than the claimant, which the claimant's stall would have to cause. Each swap needs strict `dO > dMe`, so it converges; no loop found.
- **Both side cells free.** `alt` is the first free side (right, then left). A swap needs the first user to pass `alt` on its way to the main cell, so a user coming from the other side is left alone. Behaviour for that case is unchanged.
- **Three or more users.** Capacity caps claims (`_free`, line 1595), so a third NPC only exists on capacity 3 (test_needs_sims cake plate). `_sideBlocker` returns the first matching user in state order; the swapped user is re-routed with every other dest in `taken`, so it gets a different free cell or fails (see M2). The user already on the side cell is not re-checked, which is fine because it is not on the main-cell lane.
- **Queue cells.** `job.phase === 'goto_target'` only; queued users (`phase 'queued'`) and visits are excluded, so queue cells are unaffected. Coffee presets with `capacity 1` never reach the block.
- **Other missions and scenarios.** Capacity 2+ affordances: m03 reception coffee (`scenario.json.erb:651`), m03 preset cooler and sofa, m02 coffee and cooler (`:3649`, `:3654`, `queue: false`), test_needs_sims cake plate cap 3 and tea cap 2 (`:101`, `:1145`), test_needs_attack coffee cap 2 (`:309`), `office-presets.json` cooler and sofa. The swap fires only on the live adapter (needs `besideCell`) and only when two users approach the same main cell from the same side with the nearer one claiming second. That is the case that previously stalled one user until timeout, so the change is a fix there and a no-op elsewhere. No scenario data depends on the old assignment. I did not run these scenarios.
- **Player-state sync.** No new field on any synced object. `job.dest`, `moveId` and the log are local to the needs system.
- **Test pins the bug.** Test 1 asserts `mate.job.dest` equals the main cell and `clerk.job.dest` the side cell; before the fix the first claimant kept the main cell, so both asserts fail. Tests 2 and 3 pin the two no-swap guards.

## Findings

### M1 (minor): a swap can re-route a user who is frozen in a conversation

`npc-needs.js:3450` (`_sideBlocker`) and `:3428`. `_sideBlocker` does not skip a user whose `mode === 'frozen'` (player chatting to it, froze at `:1434`, `cancelMove` called). Such a user keeps `job.phase === 'goto_target'` and its `dest`. Scenario: the player talks to Yusuf while he walks to the coffee machine, then Zainab claims the machine from the same side and is nearer. `_moveForPhase(yusuf, { noSwap: true })` runs on a frozen NPC: new `dest`, a new `deadline`, a `moveTo` and a fresh move id, all while the dialogue is open. The behaviour layer holds a needs NPC still during a chat (`npc-behavior.js:943`), so he does not visibly walk off, and `unfrozen` re-issues the move anyway (`:1456`), so the player sees nothing wrong. The cost is a deadline pushed out twice (once at swap, once by the freeze compensation) and a swap decision made while the other user cannot move. Every other `_moveForPhase` caller runs only for an unfrozen NPC, so this is the one new caller that breaks that assumption.
Fix: in `_sideBlocker` add `o.mode === 'frozen'` (or `this.world.inChatWith(o.npcId)`) to the `continue` conditions. A frozen user then keeps the main cell, and the claimant takes the side cell as before the fix.

### M2 (minor): the swapped user can be failed by its own `besideCell` check

`npc-needs.js:3428` with `:3409`. The claimant's `alt` is computed from the claimant's position, avoid rooms and leash. The re-routed user's `alt` is computed again from its own position and may be null (a leash or `avoidRooms` that cuts off the side cell for it, or a third user already holding the other side). The recursive call then runs `_failJob(swapWith, 'no_beside_cell')`: the first user, who was walking fine to the main cell, loses its break, takes the fail cooldown and walks home, while the claimant uses the machine alone. Before the fix both would have proceeded (with the original blockage). This needs an unusual geometry and I could not construct it from the m03 data, so minor.
Fix: before committing the swap, call `this.world.besideCell(cell, [...taken minus swapWith.job.dest, cell], { from: this.world.npcPos(swapWith.npcId), avoidRooms: this._avoidRooms(swapWith) })` and skip the swap when it is null.

### M3 (minor, pre-existing, answers the fixer's question): real away time 22 to 30 s against an expected 18.6 s

Not caused by this fix: the fixer saw the same stall unfixed, and the cause (both leave within a second along the same lane, `_watchReturn` re-issues after 3 s) is in the walk-home code, outside this diff. It is worth a minor for three reasons. The `lockIfAwayOverSeconds` decision uses the expected time, so a user who is really away 27 to 30 s (over the 24 s threshold) leaves the laptop open for the whole absence. That is a gap between what the mission teaches (a long absence locks the laptop) and what happens. A tight, short window at reception is also where a player is most likely to time the NPC's return. And it is likely to repeat for any pair that leaves together.
Do not fix it on this branch at round 7. File it in `docs/IDEAS_BACKLOG.md`: either stagger the pair's walk home by a second or two, or add the observed overshoot to `expectedAwayMs` for capacity-2 objects. Both are small, but each moves timings the other m03 pieces were tuned against.

### N1 (nit): the test's "fresh move id" assertion cannot fail

`test/js/npc-needs-pair-side-swap.test.mjs:57`. The stub records `moveId` at the top level of each move (`fixtures/needs-stub-world.mjs:30`), so `clerkMoves[0].opts?.moveId` is always `undefined` and `assert.notEqual(clerk.job.moveId, undefined)` passes whatever the code does. Use `clerkMoves[0].moveId` and compare against `clerkMoves.at(-1).moveId`. The tests also do not cover a frozen user, a third user on a capacity-3 object, or the stale arrival being ignored end to end.

### N2 (nit): swapped job keeps its old watch state

`npc-needs.js:3428`. The re-routed job keeps `walkWatch`, `stall` and `_farKey` from the first leg, and gets a new `deadline` each time it is swapped. A stale `walkWatch.since` can make `_watchWalk` count a stall a little early after the swap, and repeated swaps would keep refreshing the deadline (bounded by the geometry, see ping-pong above). Setting `swapWith.job.walkWatch = null; swapWith.job.stall = null; swapWith.job._farKey = null` before the recursive call keeps the first leg's history out of the second.

## Counts

Blocker 0, major 0, minor 3 (M1, M2, M3), nit 2 (N1, N2).
