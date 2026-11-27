# Lock second-step plan, review round 11 (delta)

Plan: `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` at `9441dcce0` (1268 lines). Scope:
`git diff f2a0d0566 HEAD` on the plan, the R10 fixes (5.5 Rule D, `carried_step_chains`, the
take-route rule, Re-adds, the new rows, section 15 question 1). Code read in this worktree.
No SecGen XML or exploit-detail guide opened.

Counts: 0 blocker, 1 major, 4 minor, 3 nit.

## Findings

### MAJOR-1. The take-route form of Rule D never judges the item's own chain (plan 727-731, 1000)

Problem. At the take routes and the copy builder Rule D is called as
`carried_step_reachable?(path.last, path[0...-1])`: the parent becomes the object, and the
item being taken is not passed at all. The trigger reads only the object and its path, so a
gated item under an ungated carrier never triggers it.

Failure scenario: the "Innermost carrier" fixture (plan 1000). An ungated NPC briefcase
holds a takeable gated archive. The player is given the briefcase, takes the archive, and
then both are removed (case c). The plan says the archive now answers the invented-id 422.
A crafted `POST /inventory` add of the archive then runs:
- `find_accessible_item` finds it in `released_npc_containers` (`games_controller.rb:3688-3695`;
  the release is the give record, `game.rb:4932-4937`, which no remove clears);
- Rule D is judged on the path above, `[briefcase]`, and the briefcase is not in
  `carried_step_ids`, so the test is true;
- the container test passes, because the ungated briefcase is in `unlockedObjects` (opened
  once with `method: "unlocked"`, which a crafted `/unlock` can repeat at any time,
  `game.rb:4707-4711`).
The archive is back in the inventory and leg 1 then holds. With a passed record, its contents
ship again. No step is skipped, so the harm is the same class as the accepted re-adds. But it
is a fifth re-add route that "Re-adds" (plan 732-741) does not list, and it contradicts plan
731 ("an item inside a gone briefcase is refused") and case (c).

Fix. At the take routes and the copy builder, judge the item's own carrier chain minus the
item itself. The trigger is the item or any object on its path being in `carried_step_ids`;
take the chain of the deepest such id (the item included); drop the item's own entry; an empty
chain is true. A give, a start item and a grant item still pass, since their chain is just the
item. Add to row 1000 case (c): "a crafted take of the archive answers 'Item not found in
scenario'".

### MINOR-1. Section 15 option (b) misdescribes its own writes (plan 1252-1260)

Problem. Option (b) says the list is "written by the inventory `remove` (which a consumed
use, a plant and `remove_item` reach) and by `hide`; never by a drop". In the code:
- A player drop is an `add_object` followed by an inventory `remove`
  (`item-drop.js:356-389`). As described, (b) writes every dropped gated carrier to
  `carriedGone`. The pick-up of a dropped start item then hits the start-item branch first
  (`games_controller.rb:3373-3382`), and a dropped NPC or room carrier comes back through
  priority 0 as a room location (`:3605-3615`). (b) refuses both, so "the drop-and-pick-up row
  unchanged" is false.
- The fixer's unchecked assumption holds for three routes: a consumed use
  (`consumables.js:235-252`, only when the item has an id), an object plant
  (`interactions.js:1087`, `apply-actions.js:290` with `used_on`) and `remove_item`
  (`apply-actions.js:275-295`, only when the browser holds a match with an id). Two server
  routes take an item out of the inventory without `remove`: the network jack plant
  (`network_access.rb:262`) and the USB implant (`:516`). (b) misses both.
- "Read by Rule D (a listed carrier fails leg 2)" adds nothing. Leg 2 already fails for an
  `npc`, `start` or `grant` carrier that is neither held nor dropped, and for a `room`
  carrier whose id is in `objects_removed`. Only the `validate_item_collectible` read does
  any work.
The recommendation of (a) is right, and so is the description of (a). The costs listed for
(b) are understated.

Fix. In (b): "written by the inventory `remove` only when no room's `objects_added` holds a
copy with that id (a drop's `add_object` lands first, `game.rb:1202`), by `hide`, and by the
jack plant and the implant; cleared by a pick-up of a dropped copy". Drop "Read by Rule D";
say it is read by `validate_item_collectible` only. Change "(b) can follow in G3 without
changing anything else here" to name the drop rule.

### MINOR-2. The take route's "Item is not takeable" test sits before the tests the plan lists (plan 720-726, 1123-1124)

Problem. "Where it runs" puts Rules C and D before `check_container_unlocked`, the scope 403s
and "the take route's 'Container not unlocked' and room tests (`:3424-3437`)". In
`validate_item_collectible` the takeable test comes between the finder and those tests
(`games_controller.rb:3416-3421`), and it answers 422 "Item is not takeable: <name>". If the
implementer places Rule D beside the tests the plan names, a take of a non-takeable object
inside a gone or closed gated briefcase returns its name. B13e/B13f then fail if
`board_minutes` is not takeable.

Fix. Plan 723: "before the take route's takeable, 'Container not unlocked' and room tests
(`:3416-3437`)". Say in the feature scenario whether `board_minutes` is takeable, and add a
non-takeable object inside the briefcase to the "Refusal order" row (1003).

### MINOR-3. The "out-of-reach drop" in the Drop and pick up row cannot be built (plan 1005)

Problem. The row says a crafted `player_drop` can name a room the player has not opened,
because `add_item_to_room!` does not test the room. That model method doesn't, but its only
caller, `update_room`, refuses `add_object` with 403 "Room not accessible" unless
`room_unlocked?` holds (`games_controller.rb:1087-1089`, before `:1104`). The R10 NIT-4
premise was wrong, so no request can create that case.

Fix. Drop the clause, or turn it into a model test that writes the `objects_added` copy
directly: "a fixture copy in a room not in `unlockedRooms` is out of reach". State that no
route reaches it.

### MINOR-4. A carrier with no id breaks leg 1 (plan 638-645, 693-700)

Problem. `carried_step_chains` holds "the ids of every carrier", and leg 1 tests `held_in?` by
id. Section 9 requires an id only on the gated object. An ungated NPC bag or a takeable room
bag with no id can still be a carrier: the take route and `npc_container_released?` match it
by name (`games_controller.rb:3424-3430`, `game.rb:4936`). Leg 1 then never sees it held, and
leg 2 (`npc`) answers false. So a gated archive inside a bag the player is holding is refused
as an invented id, which wrongly refuses a legitimate give. No shipped NPC container lacks an
id today (1 of 1 in the 177 scenarios that parse), so this is a validator gap.

Fix. Section 9: "every carrier at or above a `secondStep` object has an `id`", an error.

### NIT-1. A fetched awareness world room does count (plan 697-698)

`GET /room` adds a world room to `unlockedRooms` on its first fetch, since it is neither already
unlocked nor a route room (`games_controller.rb:581-591`). After that, `room_unlocked?` is true for it.
"An awareness world room ... does not count" holds only before the first fetch. Say "a route
room in `npcRouteRooms` does not count" and drop the world-room clause, or say it counts once
entered.

### NIT-2. Row 998's take of the note tests nothing (plan 998)

The note sits inside the archive inside the briefcase, two levels down. `find_accessible_item`
looks only one level into a released container (`games_controller.rb:3690-3694`), so "Item not
found in scenario" is certain with or without Rule D. Take an object that sits directly in the
briefcase instead, or the archive itself once MAJOR-1 is fixed.

### NIT-3. The removal row omits the network plant and the implant (plan 677)

The "Removed, consumed, planted, hidden" row lists `remove` and `hide`. The jack plant and the
implant also take an item out of the inventory (`network_access.rb:262`, `:516`), and the
validator refuses neither a gated `rogueDevice` nor an item an implant's `needsHeld` names.
Rule D still holds, since it reads membership. Name both routes in the row, or add both to
section 9's carried-item errors beside `usb`.

## Checked and found sound

- Rule D closes the gone-carrier routes at `/unlock`, `GET /container` and `/mfa/*`. It covers
  a dropped, given-away, consumed, planted or `remove_item`-removed carrier, since it reads
  inventory membership and `objects_added`, not the route that removed the item. A drop's
  copy is removed from `objects_added` on pick-up (`game.rb:1235-1259`), so no stale "dropped"
  copy outlives a pick-up through the client's normal path. A crafted `player_drop` of an item
  no longer held is refused (`game.rb:1143-1152`). A crafted NPC re-drop after a give is a
  no-op (`npc_held_item_delivered?`, `game.rb:1112`, `:2085-2100`).
- Legitimate flows pass: a give, a start item and a grant item (empty path); a dropped item in
  an opened room (leg 1); an item in a nested container inside a held briefcase (leg 1 on the
  briefcase); a sign-in desktop, profile or share file in place (`nested`, scope branches
  decide, `games_controller.rb:638-669`); the Move case (`filter_container_contents` hides only
  while held, `:3242-3258`).
- Refusal order and leaks. Leg 2's 403 or 404 split depends only on the scenario and the
  player's own history. An unreleased NPC item, an unclaimed grant and a gone `npc`, `start`
  or `grant` carrier all answer the invented-id body. A `room` carrier in place in an unopened
  room meets today's room answer, as any room object does now. No new existence signal,
  provided MINOR-2's order holds.
- Delta sync: `carried_step_ids` and `carried_step_chains` are derived and memoised on the
  instance, nothing is added to `player_state`, and the bootstrap copies named keys only.
  Option (b), if picked, stays server-only as written.
- Regressions: no file under `scenarios/`, `app/`, `lib/` or `public/break_escape/js/` contains
  `secondStep`, so every Rule D trigger is empty. The shipped `remove_item` users
  (`test_remove_item`, `test_capture_log`, `test_wearable`) are untouched. The unrouted
  `api/games_controller.rb` inventory action is dead code.
- Section 15 question 1 is fair. Option (a) is described correctly, the recommendation fits
  the cheat-resistance policy, and only (b)'s cost text needs MINOR-1.

## Verdict

Not settled: one major (MAJOR-1). Its fix is the one-line change to the take-route form of
Rule D plus a case (c) assertion. The minors are text and test-row corrections.
