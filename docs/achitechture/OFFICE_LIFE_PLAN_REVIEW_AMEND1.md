# Office Life plan: review of amendment 1 (social compatibility and room leash)

Reviewer: fresh adversarial read, 2026-11-06. Scope: commit dca3117d1 only (section 7, slice 2a,
the social changes to slices 8 and 10, OQ20-25) and its knock-on effects, checked against the
working tree. EasyStar checked against the 0.4.4 build that `app/views/break_escape/games/show.html.erb:314`
loads.

**Count: 0 blockers, 4 major, 15 minor.** Verdict at the end.

## 1. Room leash pathing (7.2 "Routes")

**What holds.** One EasyStar instance serves every search (`npc-pathfinding.js:283-292`, the
player's too). `calculate()` runs every queued search to the end before it returns
(`iterationsPerCalculation` is `Number.MAX_VALUE`); only the callback is deferred, through
`setTimeout`, unless sync is on (EasyStar 0.4.4 `callbackWrapper`). So avoid points set just
before `calculate()` and removed just after it never reach the player's search or another NPC's:
JavaScript cannot run another search in between. Exact removal with `stopAvoidingAdditionalPoint`
is right; `stopAvoidingAllAdditionalPoints` would also drop the player's NPC-avoid set, which the
player's deferred callback clears (`npc-pathfinding.js:381`). If a ring cell coincides with a
lingering player avoid cell, exact removal deletes that one too, which is harmless because the
player's search has already run. Unloaded rooms: correct, they have no objects and sit behind
closed doors. Performance: a ring is about 160 avoid calls per loaded forbidden room, cheap next
to the search itself.

**M1 (major). The plan names the wrong walk call sites, and misses the main one.**
`goToAndStay` (`npc-behavior.js:2448-2490`) only writes a one-waypoint patrol; the path is planned
in `chooseWaypointTarget` at **1417**. Line 1053 is the collision-avoidance recalculation inside
`updatePatrol` (1040-1060), not "its waypoint code", and 1282 is the stuck recovery. A builder who
follows the plan constrains 1053 and 1282 and leaves 1417 alone, so `reachable` approves a target
by the permitted route and the walk then takes the short cut through the forbidden room. If the
NPC has `patrol.multiRoom` with a route, the waypoint goes through
`chooseWaypointTargetMultiRoom` (1546) instead. Fix: route all four (1053, 1282, 1417, 1546)
through one behaviour helper that adds `{ avoidRooms: this._moveAvoidRooms }`, and add a node test
that a needs `moveTo` followed by `chooseWaypointTarget` passes the rooms to `findWorldPath`.

**m1 (minor). The corner-cutting argument is wrong, though a full rectangular ring still holds.**
In EasyStar 0.4.4 the no-corner-cutting test calls `isTileWalkable`, which reads only the grid
and `directionalConditions`; avoid points are checked only in `checkAdjacentNode` for the cell
being entered. A diagonal step is therefore allowed past two avoided orthogonal neighbours. A
straight line still blocks, because every step changes x or y by at most one, so a path must land
on the line to cross it. The leak is at the corners: a ring made of the cells orthogonally next to
the floor, without the four corner cells, can be crossed diagonally at a corner. Fix: state that
the ring includes its corners and give the right reason. The proposed test in
`path-avoid.test.mjs`'s model (`test/js/path-avoid.test.mjs:35-66`) would hide the bug: its `free()`
is used for both the entered cell and the corner check, so adding avoid points to `free()` makes
the model stricter than EasyStar. Model avoid points on the entered cell only, and add a case with
a cornerless ring that must leak in the model, so the model is known to be faithful.

**m2 (minor). The ring lies outside the forbidden room, so "a ring never seals a destination" does
not follow from the candidate filter.** The floor rule (`core/rooms.js:3058-3069`) covers the
room's full width and its bottom wall row, so a ring "round the floor" sits in the neighbouring
rooms' edge cells and in the first row of the room below. Today that is mostly dead space between
two rooms' thin wall colliders (`systems/collision.js:60-110`: 8 px boxes on the inner edge of each
wall tile), plus the doorways, which is what the ring is for. A permitted target whose approach cell
lands in a neighbour's edge cell, or two rooms that meet without a wall (the plan's own risk line),
would be sealed off for leashed NPCs. Fix: use the floor's own outermost cells (an inner ring).
Any route into the room must still cross them, they can never hold a permitted target, and the
current-room exemption already covers an NPC standing inside.

**m3 (minor). The cached "walkable cells only" ring misses a door opened since the cache was
built.** `doors.js` opens a doorway by editing the grid in place (`markSideDoorCorridor`,
`markDoorWalkable`, `npc-pathfinding.js:177-216, 603-610`) and rebuilds only 250 ms later
(`doors.js:821-829`). A ring cached while the door was shut has no cells in that doorway, and a
leashed search in that window can plan a path through it that the NPC then follows to the end.
Fix: do not filter by walkability (an avoid point on a blocked cell does nothing), or clear the
ring cache in `markWorldCellsWalkable` and `unmarkDoor` as well as in `rebuildWorldGrid`.

**m4 (minor). Say where cleanup runs.** The existing `avoidNPCs` path clears in the callback
(`npc-pathfinding.js:381`), and in async mode that runs a tick later. The rings must be removed
straight after `calculate()` in a `finally`, never in the callback, or they leak into every search
until the timeout fires. The early return when the grid is not ready (347-352) comes before any
marking, so it needs nothing.

**m5 (minor). The seating chair fetch is a needs-owned move with no rooms.** `seating.js:984-988`
(`moveNeeds`) calls `goToAndStay` with `owner: 'needs'` and nothing else. The plan clears
`_moveAvoidRooms` "on any `goToAndStay` not owned by needs", which leaves it unclear whether this
call keeps the previous value or overwrites it with `undefined`. The fetch stays in the NPC's own
room (`chairsNear(behavior.roomId, …)`, 949, 957), so either is safe in practice; say "a needs
move without `avoidRooms` keeps the current value" so the behaviour is defined.

**m14 (minor). Failed searches cost more under a leash.** When a target is cut off, EasyStar
floods the whole permitted region before it gives up, and `_nearestReachable` (`npc-needs.js:525-534`)
tries every candidate nearest first, so a leashed NPC with three cut-off candidates pays three
floods per select. Slice 1's back-off (`npc-needs.js:456-462`) caps this at one select a second,
which is acceptable. Make the leashed micro-benchmark include a cut-off candidate, so the cost is
measured rather than assumed.

## 2. Candidate filtering, owners, save (7.2 "Candidates", "Owners")

**What holds.** `_useCandidate` (`npc-needs.js:570-581`) and `_carryCandidate` (583-596) are the
two places to filter, and applying `_permitted` to the options before the home-object preference
keeps that preference intact. Seating fetches chairs only in `behavior.roomId`
(`seating.js:949, 957`; `FETCH_RANGE` 811), so seating never takes the NPC into a forbidden room.
Workstation state is untouched by `private`. Carry and item claims (`_itemClaimed` 497-502,
`_claims` 488-495) are unaffected. Nothing needs saving: the fields are authored data, and
`_moveAvoidRooms` is rebuilt by the next job after a reload.

**M2 (major). The home room is not known when the forbidden set is computed.** The plan computes
it "once per NPC at register" and exempts "the room of `needsHome`". But `register`
(`npc-needs.js:155-194`) sets `home: null`. The home is resolved on the first tick with a sprite,
and for an object home only once the object is loaded: until then it is provisional, at the spawn
point, with `objectId: null` (`_updateHome`/`_resolveHome` 791-815). Start-room NPCs register
before their room's objects (commit 6b602b2ff, README finding 1 in `scenarios/test_needs_sims/README.md:77`).
With `needsRooms` as an allow list ("the home room is always allowed"), a set built at register
either forbids the home room or has to be rebuilt later, and the plan says neither. Fix: take the
home room from scenario data, which is static and present from the start: the room whose
`objects` declare the `needsHome` id, or `needsHome.room`, or the NPC's spawn room when there is
no `needsHome`. Add a world-adapter call for it, or test the rooms with a per-room predicate
instead of a precomputed set. Add a node test with a provisional home and an allow list.

**m6 (minor). The owners map cannot come from NPC records alone.** `screenOwner` belongs to the
object (`workstation-state.js:49-55`), not to the NPC record, and the needs adapter's `describe`
(`npc-needs.js:872-883`) exposes only `affordance`, `needsTag` and `pickable`. So `_permitted`
needs `describe` to carry `screenOwner` (or the resolved owners) as well as the needsHome map from
`registerAll`. The plan also says "the NPCs whose `needsHome` is the object" (plural), but `ownerOf`
returns the first match. Either is fine; pick one and match the validator to it.

**m7 (minor). `private` on accepting objects is a design choice the plan does not raise.** The
plan applies `_permitted` to carry targets (`_carryCandidate` 589). That suits a kettle, but a
desk that `accepts` deliveries is a drop point: slice 7's Amara delivers to her own desk (owner,
fine), whereas slice 9's Sanjay delivering a printout to `tom_pc` (plan, Part B tests) would be
refused once the showcase marks the PCs private in 2a. Add an OQ: "Does `private` stop deliveries
(`accepts`) or only uses (`satisfies`)?" The suggested default is uses only, with `owners` read
for `satisfies`. Slice 9 is not chosen, so this is not urgent, but slice 2a fixes the semantics
first.

**m8 (minor, slice 10).** "Queue cells are honoured by the leash because the machine itself is a
permitted object" is not quite true: a queue that runs through a doorway can put a cell in a
forbidden room. The ring then makes that cell unreachable and the queuer stalls until the job
times out. Add a validator check (a queue cell in a room forbidden to an NPC who needs the
machine) or skip forbidden cells when assigning queue places.

**m12 (minor).** The validator's T1/P report picks `nearest` from all targets
(`scripts/validate_npc_needs.rb:112`), so with a leash it can report timings through an object
the NPC may not use. Use the permitted targets once 2a exists.

**On the requested validator checks.** Both are planned: "a need made impossible by the leash"
(an error naming the rule that excludes each object) and "a private object with no owner"
(warning, "serves nobody"). The connectivity warning over `connections` is the right static check
for a cut-off corridor. Line references to the validator (107-110, 153-160) are correct.

## 3. Social compatibility (7.3)

**What holds.** The rules match the request: Derek gets `avoids: ["*"]`, nobody chats with him at
the cooler, and nobody shares it with him. Putting the sharing check in `_free` (`npc-needs.js:504-509`)
is the right place, since both candidate functions call it. `_claims` counts jobs still walking to
the object as well as those using it, so an avoided NPC on its way also keeps the other away,
which is the visible result the plan wants. Waiting on a `_free`-refused object searches nothing,
so it keeps the 250 ms check with no back-off (`npc-needs.js:456-462`), and the per-pair dedupe on
`npc_avoided` is needed and planned. "Declared one way, acts both ways" plus the group test gives
the semantics the user asked for. The `requireGlobal` form matches the sight challenge
(`npc-sight-challenge.js:130-138`). `npc_overheard:<speakerId>` was not requested, but it costs a
line and helps social-intel grants.

**m9 (minor). The name `social` on the NPC collides with the scenario-level `social` block.**
`scripts/scenario-schema.json:229` defines `social` as the closed social-engineering contract
(`scenario.social.characters`, linted by `validate_social.rb`, read by `social-influence.js`), and
the sims NPCs already have a need called `social`. A third meaning on the NPC invites mistakes in
schema descriptions, greps and authoring. Use a needs-prefixed name in line with `needsHome`,
`needsSpeed` and the new `needsRooms`, for example `needsCompany: { groups, avoids }`.

**m10 (minor).** The object form of an avoidance shows only `npc` with `requireGlobal`. Say
whether `{ "group": "contractors", "requireGlobal": … }` and `{ "npc": "*", … }` are allowed (they
should be: Derek's case keyed on `derek_exposed` is naturally `"*"`). `requiredGlobalsHold` is not
exported from `npc-sight-challenge.js`, and `createEngineWorld` lives in `npc-needs.js`, so
importing it would be a new static import (test harness copy lists). Copy the six lines into the
adapter, as the plan's "no static import" implies, and say so.

**Validator (social).** Unknown ids and groups, a `requireGlobal` naming an undeclared global, and
the "shares only with someone it avoids" info line are planned. That covers the risks. Nothing
missing for the chosen slices.

## 4. Placement, sizes, showcase

**Placement.** Slice 2a depends only on slice 1 (fixture, back-off), which is true. It is
independent of slices 3-11 in logic: slice 4 presets add affordances to objects in private rooms
and the room leash covers them; slice 7's delivery is to the owner's own desk; slice 8's `_free`
check sits beside `_permitted` in the same filters. Slice 2 has landed (b670d2fcd), and the working
tree has further uncommitted edits to `npc-needs.js`, `seating.js` and `workstation-state.js`;
build 2a after those are committed, since it edits the same functions. The only later knock-ons
are m7 (slice 9 deliveries) and m8 (slice 10 queue cells).

**Sizes.** The arithmetic checks out (chosen set 1,715 = 1,410 + 200 + 95 + 10). About 200 lines is
plausible for 2a. M1, M2, m3 and m6 add perhaps 25-30 lines; it stays M.

**M3 (major). No live proof that a route avoids a forbidden room.** In `test_needs_sims` the rooms
lie in a row, kitchen-office-lounge (`connections`: office west kitchen, east lounge), so no
permitted target's shortest path ever crosses the lounge. The showcase therefore exercises only
the candidate filter. The ring code, the riskiest part of 2a (M1, m1-m4), is proven only by a
recording stub and a grid model, and a model that differs from EasyStar is exactly how m1 would
slip through. The standing rule is that fix claims need live proof on the real path. Fix: add a
live case where the short way crosses a private room and a long way exists, for example a small
`test_needs_leash` scenario with four rooms in a loop (the sims scenario stays at "no new rooms").
Proof: the decision log and a screenshot of the NPC on the long route, and of the same NPC taking
the short route with the leash removed.

**m11 (minor). The showcase objective proves too little, and one README claim is stale.**
- `npc_needs_leashed:tom` fires whenever the leash removed a free option (7.2, "Why an NPC is not
  going"), that is, the first time Tom's caffeine goes urgent while the lounge is loaded,
  wherever he then goes. Key the objective on `npc_used:kitchen_coffee` by Tom (or Amara) after
  `leashed`, or keep `leashed` as a log check rather than the objective.
- The kettle is a candidate only once the lounge is loaded, and the kitchen-coffee outcome needs
  the kitchen loaded. The README's contention row (`README.md:63`) depends on the kitchen being
  unloaded at tick 241. The live run must open both doors first and say so, and the contention row
  needs re-checking.
- "README row '285 sanjay used work amara_pc' goes": that row (`README.md:62`, game 499) was already
  superseded by the home-preference fix; row 65 records `240 sanjay sanjay_pc`. Private PCs only
  change the fallback when one's own desk is taken. Reword: the row is already stale; 2a stops the
  fallback.

**m13 (minor).** The plan's status line still says "Nothing here is built, except … slice 0".
Slices 0, 1 and 2 have landed (b642594be, 5b1749a05, b670d2fcd).

## 5. Open questions 20-25

- **OQ20** (avoidance stops sharing and chat; a group mismatch stops chat only): sound.
- **OQ21** (one way written, both ways in effect): sound, and it is what the request needs.
  The schema description must say so (planned).
- **OQ22** (no `social`: compatible with everyone): sound; it keeps slice 8 byte-identical for
  scenarios that do not opt in.
- **OQ23** (scripts and route patrols ignore the leash): sound, consistent with `onExternalMove`.
- **OQ24** (static leash, no `requireGlobal` on `needsPrivateTo` yet): acceptable, but **m15
  (minor)**: the user wrote "sometimes leash an NPC to specific rooms". That may mean "only some
  NPCs" (the plan's reading) or "only at some times". Ask. If it means times, a `requireGlobal` on
  `needsPrivateTo` is a few lines once forbidden rooms are a per-select predicate (M2's fix), so it
  could join 2a.
- **OQ25** (presets never make objects private): sound.
- **Missing:** the m7 question (does `private` stop deliveries?).

## 6. R3's conditions

None of the three is recorded in the plan text. **M4 (major)**, so the planner can fold them in
before slices 4 and 11 are built:

1. **Slice 4, presets only on scenario-declared objects (R3-M1).** Section 2.1
   (`OFFICE_LIFE_PLAN.md:210-217`) lists the type rules and the "never preset" exclusions but
   says nothing about restricting presets to objects declared in the scenario, nothing about the
   decor test, and nothing about the live list of preset objects. Not recorded.
2. **Slice 2, `needsStop` covers `returning && atPost` (R3-M2).** It is built:
   `seating.js:822` returns the home stop for `ns.mode === 'returning' && ns.atPost`. But 2.11
   (`OFFICE_LIFE_PLAN.md:1069-1075`) still describes only the at-post job, and the status line
   still says slice 0 is "landing separately". Recorded in code, not in the plan.
3. **Slice 11, scoped without traits or routines (R3-M3).** The slice table
   (`OFFICE_LIFE_PLAN.md:1271`) still reads "left-behind items, piles, queue-aware
   `expectedAwayMs`" with dependencies "6, 7; 9 for `leaveCount`", and the left-behind roll
   (994) still uses `tidiness`. Slices 6 and 9 are not in the chosen set, so slice 11 as written
   cannot be built from the chosen slices. Not recorded.

## 7. Wrong claims in the amendment

| Claim | Where | Fact |
|---|---|---|
| The walk plans in "its waypoint code (1053)" | 7.1, 7.2 | 1053 is the collision-avoidance recalculation; the first path is at `npc-behavior.js:1417` (`chooseWaypointTarget`), and at 1546 for multi-room patrols (M1) |
| "A diagonal step needs both orthogonal neighbours free, so it cannot cross a one-cell line" | 7.2 Routes | EasyStar's corner check ignores avoid points; a line holds only because a step must land on it, and corners need their own cells (m1) |
| "Targets are never inside a forbidden room, so a ring never seals a destination" | 7.2 Routes | The ring is outside the floor, in neighbouring rooms' edge cells (m2) |
| Forbidden set "computed once per NPC at register" with the home room exempt | 7.2 Performance, Rules | The home is not resolved at register (M2) |
| Owners map built "from `world.getNpc` records" | 7.2 Owners | `screenOwner` is on the object (m6) |
| "Queue cells are honoured by the leash because the machine itself is a permitted object" | slice 10 text | A queue cell can lie in a forbidden room (m8) |
| Row "285 sanjay used work amara_pc" goes because of 2a | 7.2 Tests | Already superseded by the home-preference fix (m11) |

The other claims I checked hold: `findWorldPath` 347-386 with per-search avoid/cost and removal
after `calculate()`; corner cutting off at 291; `updatePlayerRoom` floor rule 3052-3080;
`updateCurrentRoom` 756; `ownerOf` 48-55; seating 943-950 and 811; validator lines; m01 ids
(`derek_lawson` in `break_room`, `derek_office`, `derek_computer`, `maya_chen` in `maya_office`);
the `requireGlobal` form; the size arithmetic.

## 8. Verdict

**Revise, then build.** The design is sound and answers the request. The room form
(`needsPrivateTo` on Maya's office) and `avoids: ["*"]` on Derek are the right shapes, and the
ring mechanism is safe with the shared EasyStar instance. The four majors are all edits to the
plan text, with no change of design: name the right walk call sites (M1), take the home room from
scenario data (M2), add a live route proof (M3), and fold in R3's three conditions (M4). Fold the
minors into slice 2a's brief (m1-m6, m11-m14), slice 8's (m9, m10) and slice 10's (m8), and add
m7 and m15 to the open questions. No further review round is needed if the planner makes these
edits.

