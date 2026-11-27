# Lock second-step plan, review round 10

Plan: `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` at `0ec4379a9` (1184 lines). Scope: the
round 2 revision (`git diff 4ef605036 HEAD`), above all 5.5 Carried items, Rule D, G3, the new
tests and section 15. Code read in this worktree. No SecGen XML or exploit-detail guide opened.

Counts: 0 blocker, 5 major, 7 minor, 4 nit.

## Citation check

Spot-checked 24 of the audit's citations with grep and narrow reads. All point at the right
code, within a line or two:

- `FORGEABLE_ITEM_FIELDS` is at `item_identity.rb:28-32`. It is used in two places only:
  `Game::FORGEABLE_LOCK_FIELDS` (`game.rb:1215`, stripped from an unsourced `add_object`,
  `:1183-1196`) and the controller's `CLIENT_ITEM_FORBIDDEN_FIELDS` (`games_controller.rb:3304`,
  applied only in `canonical_inventory_item`'s non-Hash branch, `:3317-3318`, which covers
  always-allowed and decor items). Neither client filter (`filter_inventory_for_client!`,
  `game.rb:1902-1922`) nor any JS reads the list. No file under `scenarios/`, `public/`, `app/`,
  `lib/` or `test/` contains `secondStep`, so adding it to the list changes no shipped flow.
- `add_inventory_item!` (`game.rb:719`) and `inventory_includes?` (`:704-717`); `canonical_inventory_item`
  (`games_controller.rb:3315-3333`, clears `locked` by id, strips grant contents at `:3324-3327`).
- Start-item walk `game.rb:4909-4914`; `released_npc_containers` `:4945-4959` (no held test);
  `held_grant_items` `:4969-4980` (client-forged excluded at `:4975`); `find_container_in_scenario`
  `games_controller.rb:3000-3025`.
- Inventory `remove` `:1454-1460` with `remove_inventory_item!` `game.rb:845-850` (by id, no
  check); `hide` `:1462-1473` into `capture_proofs.rb:79`; plant `record_planted_item!`
  (`capture_proofs.rb:26`, records only when the object requires and consumes the item).
- Copy transfer `record_copied_item!` `game.rb:4258`, called at `games_controller.rb:1448`
  (only for `transfer == 'copy'`).
- Player drop `game.rb:1143-1167`; KO drop `:1077-1138`; priorities 0 and 0.5
  `games_controller.rb:3605-3640`; `DEFAULT_HEAL_BY_TYPE` `consumables.js:47-58`;
  `hiding_spots.rb:64-76`; `container-minigame.js:2302-2304`; `clone_card` `:1655`.
- `triggerOnInteract` can run `remove_item`: `interactions.js:1094` calls `applyActions` with
  `objectId`, and `apply-actions.js:274-293` removes the held match by type, id or name and posts
  the inventory `remove` with `used_on`. With no `requiresItem` on the courier box no plant is
  recorded. B13's beat is buildable.
- `PUT /sync_state` reads none of `inventory`, `unlockedObjects`, `room_states`, `lockSteps` or
  `npc_given_items` (`games_controller.rb:2735-2900`), so a forged sync cannot move a step.

## Findings

### MAJOR-1. A crafted re-add brings a removed carried item back (lines 26-28, 152, 661, 664, 685-686, 1053-1054)

Problem. Section 1 promises "once it has left the player's hands no crafted request opens it",
and G3's done-when says no route opens it once it has left. Rule D tests inventory membership,
and four add paths put a removed item back without any record that it left:
- a start item: `validate_item_collectible` accepts any start item, always
  (`games_controller.rb:3373-3382`), not only a held one as line 661 tests;
- a declared grant: "can be claimed at any time" (`:3384-3400`, the code's own note);
- an NPC give: a post with `source_npc_id` needs only an encountered NPC
  (`:3449-3462`), so the same briefcase can be "given" again, and before the ink give too;
- a `takeable` room object: priority 1 and 2 of `find_accessible_item` (`:3642-3666`) never
  read `objects_removed`.
After the re-add Rule D holds again. A step that had passed is open, so the contents ship. A
live record is not skipped (the owner still has to approve), so this does not bypass the step
itself. The promise and B13e/B13f still overstate what holds.

Fix. Recommended: keep the plan stateless and say what is true, in line with the
cheat-resistance policy (server enforces secrets and keys; ink-gated gives are best-effort).
Line 26-28: "...wherever the player carries it, and no crafted request skips the owner's
approval." Line 152: "once it has left the inventory and every open room, a crafted request
opens it only after a re-add, and a re-added item still needs both checks unless its step had
already passed." In 5.5 add a sentence under Rule D naming the four re-add paths as known,
existing best-effort routes. Change line 664's "no record can start early" to "no record can
start before a give, and a give is the browser's word (an encountered NPC is enough)". Add a
controller row: after `remove`, a crafted re-add of a gated start item with a live record
re-answers from the record and opens nothing without the approval.
Alternative, if the user wants removal enforced: a server-only list `carriedGone` (ids from
`carried_step_ids` and their carried ancestors only, so bounded by the scenario, never synced or
echoed, dropped by `reset_player_state!`), written by `remove`, `hide` and a consumed use,
read by Rule D and by `validate_item_collectible` to refuse the re-add as "Item not found in
scenario". This needs a user decision, since it adds state.

### MAJOR-2. Rule D tests only the target id, not what sits inside a carried gated object (lines 678-693, 935, 1053)

Problem. Rule D runs "only for ids in `carried_step_ids`" (line 691-692), the gated objects
themselves. `board_minutes` in `gordon_briefcase` has no step, so it is not in the set. After
B13d opens the briefcase and B13e removes it, a crafted `/unlock` for `board_minutes` resolves
through `released_npc_containers`; Rule C passes (the briefcase is open by Rule B); Rule D is
not read. A take of `board_minutes` passes the same way (`:3688-3695`, the container is in
`unlockedObjects`). B13e expects 422 and nothing shipped, and row 935 asserts the same for "an
opened archive". The tests will fail against the rule as written.

Fix. Make Rule D a path rule beside Rule C: "`carried_step_unreachable?(path, object)` is true
when the target or any object on its path has an id in `carried_step_ids` and fails the reach
test; an object for which it is true is refused as an invented id." Run it at every exit of
5.2's table where Rule C runs (`/unlock`, `GET /container` all branches, the take searches, the
inventory copy builder) and in the `/mfa/*` lock form. Say in line 691-693 that an object with
no step and no gated carried object above it resolves as today.

### MAJOR-3. "The outermost carried object" is the wrong object to test once an inner one is taken out (lines 638-639, 679)

Problem. Rule D tests the outermost carried object above or at the gated one. Take an
ungated NPC briefcase (an `itemsHeld` entry) holding a takeable gated archive, a G1 placement.
The player is given the briefcase and takes the archive into the inventory. (a) A courier box
removes the briefcase: the outermost carried object is gone, so the archive the player is
holding is refused. (b) A courier box removes the archive instead: the briefcase is still held,
so the archive counts as reachable from wherever it went. The rule fails both ways.

Fix. Test the innermost carried object at or above the target that the player holds or has
dropped (`held_in?` by id, or an `objects_added` copy in an open room). Only when no carried
object on the path is held or dropped, fall back to the authored-place leg for the outermost
one. Memoise the list of carried ids on the path (from the scenario), not a single outermost
id. Add a G1 row with both cases (a) and (b).

### MAJOR-4. A nested takeable that leaves the inventory is back in its container, so row 935 contradicts Rule D (lines 684-685, 935)

Problem. Nothing records a take from a container. `filter_container_contents`
(`games_controller.rb:3242-3258`) hides a container's item only while it is in the inventory,
and `find_accessible_item` finds it again (`:3660-3666`). After an inventory `remove`, the
item is listed in its container again and can be re-taken, exactly as Rule D's in-place leg
says ("a nested `takeable` neither held nor dropped whose containers above are all open"). Row
935 says the same archive, after a `remove`, gets the invented-id 422, the take routes "Item not
found in scenario" and `/mfa/*` 404. Rule D as written makes that row fail.

Fix. Keep the engine's model: an item that leaves the inventory goes back to its container.
Rewrite row 935's nested-takeable half: "after a `remove`, the archive is listed in its open
container again; a crafted `/unlock` with the right password re-answers from the live record;
nothing opens without the approval". Keep the 422/404 assertions for the archive inside the
NPC's briefcase only, once the briefcase itself has gone. Say this in 5.5's table, row
"Removed, consumed, planted, hidden": "a nested takeable returns to its container (as today);
a top-level one does not". The validator could warn when a `remove_item` action names a gated
nested takeable, since the author probably expects it gone.

### MAJOR-5. The in-place leg refuses a gated file on a sign-in desktop, in a profile or in a share (lines 198-200, 684-685, 941)

Problem. G1 allows a step "under a sign-in PC, in a profile, a share", and a desktop or share
file is takeable (the transfer route requires it, `games_controller.rb:3494-3496`), so a gated
file there is carried. Rule D's in-place leg requires "containers above are all open by id".
A sign-in PC is reached by a session, not by an `unlockedObjects` entry, and a profile or share
has no container object at all. So the in-place file is refused whenever no copy is held: G1's
own placement breaks, and after the copy in row 941 leaves the inventory, the desktop copy is
refused although it is still on the desktop.

Fix. Define the in-place leg as "still in its authored place, where the route's existing reach
test and Rule C already decide": the room test for a room object, Rule B for each gated
container above, `session_admits?` or the foothold test for a sign-in PC, profile or share (the
`GET /container` scope branches at `:641-669` and the transfer routes already apply these).
Add a G1 row: a takeable gated archive on a sign-in desktop opens in place through both checks
with a session and nothing held, and after a copy is taken and removed, the desktop copy still
opens.

### MINOR-1. A dropped declared-grant item resolves nowhere (lines 152, 665, 681-682)

Problem. `held_grant_items` exists only while the grant is held (`game.rb:4969-4980`), and
`find_scenario_object` and `find_container_in_scenario` never read `objects_added`. A
`droppable` gated grant item on the floor passes Rule D (an `objects_added` copy in an open
room) yet `/unlock` finds nothing. G3's done-when "after dropping it in reach" fails for it.

Fix. Either the validator refuses `droppable: true` on a gated declared-grant item, or 5.5 says
"a dropped grant item opens only once picked up" and row 938 asserts it. Recommend the
validator error: no shipped grant needs it.

### MINOR-2. Rule D's order against the 403 answers is not stated (lines 686-690, 711-713)

Problem. `GET /container`'s plain branch answers 403 "Container not unlocked" for a found,
locked container (`check_container_unlocked`, `:3119-3126`), and the take route answers
"Container not unlocked: <id>" (`:3424-3430`). If Rule D runs after those, a gone, unopened
briefcase answers 403 rather than 404, which tells the player it exists. B13f tests only
`/unlock` and `/mfa/prompt`.

Fix. Say that Rule D (with Rule C) runs straight after the finder at each exit, before
`check_container_unlocked`, the scope 403s and the take route's container test. Add `GET
/container` and a take to B13f's crafted calls.

### MINOR-3. Who adds Rule D to the `/mfa/*` lock form is unclear (lines 1079, 1135-1137)

Problem. Section 12 says this plan edits "the lock form in the `/mfa/*` actions", and G1
needs Rule D there, yet section 14 asks the MFA plan to call it "or take a hook". If MFA's M3
lands first without the call, G1 depends on another plan for its own refusal.

Fix. Section 14 request 2: "the lock form's subject check leaves one hook before the record is
read; this plan's G1 puts `carried_step_reachable?` (the path form of MAJOR-2) in it."

### MINOR-4. A flag station's `itemsHeld` is a carried home the audit misses (5.5 table, section 9 walk at lines 783-786)

Problem. A flag-station reward is handed over on a flag and re-collected through the
`flag_station` location (`games_controller.rb:3476-3485`). Neither the `second_step_ids` walk
(line 232-234) nor the validator's walk covers `flag-station` `itemsHeld`, so a `secondStep`
there is silently ignored: the item opens with no step and no error.

Fix. Add the path to 5.5's table and the validator error list: "`secondStep` on a flag
station's `itemsHeld` entry or inside one" (an error, not a G3 placement).

### MINOR-5. The consumable rule needs a Ruby copy of a JS regex list (lines 805-807)

Problem. The validator is Ruby; `DEFAULT_HEAL_BY_TYPE` lives only in `consumables.js:47-58`
and has no Ruby mirror. A hand copy drifts.

Fix. Either read the list from the JS file in the validator (as a pattern list parsed once),
or move it to a shared JSON both read. Otherwise add a spec that compares the two lists.

### MINOR-6. Section 15: all six questions are already answered (lines 1161-1184, 211, 348, 395, 622, 762, 1135)

Round 1's LOCK-n ids map to the round 1 numbering (checked at `a7b31abad`), so:

| Now | Question | Answered by | Decision to state |
|---|---|---|---|
| 1 | Hard-enforce a door's step against a propped door? | LOCK-2 a | Accepted; an author who needs it gives the door no `prop_door` workaround |
| 2 | Which lock types take a typed code? | LOCK-3 a | `password` and `pin` only; other types take the push kinds. The user's keyring question is answered at lines 140-145 |
| 3 | Can a held phone show lock requests with no prompt open? | LOCK-4 a | No; only from the pane the attempt opened |
| 4 | Does a passed approval lapse? | LOCK-5 a | No; it waits for a right first factor |
| 5 | Stages | LOCK-6 a (G3 from R2-5 b) | G1, then G2; G3 after G1, either side of G2 |
| 6 | Re-enrolment reaches the owner's locks? | LOCK-8 a | No; the lock always uses the scenario's phone and code device |

Fix. Delete all six and write "None." under section 15 (or delete the section). Replace each
"(open question N)" or "(question 3)" reference at lines 211, 348, 395, 622, 762 and 1135 with
the plain decision above. Nothing goes back to the user from this plan.

### MINOR-7. "Copies share one step" includes `transfer: both`, but only `copy` keeps the desktop copy listed (lines 695-698, 848-849)

Problem. `record_copied_item!` runs only for `transfer == 'copy'` (`games_controller.rb:1448`);
a `both` file is copied or moved by the player's choice. After a move, the desktop listing
hides it while held (`filter_container_contents`), so the "one copy in place" claim holds for
`copy` and for a `both` file the player chose to copy.

Fix. Line 696: "(`transfer` `copy`, or `both` when the player picks Copy)". The validator
warning text stays as written.

### NIT-1. Name the room predicate (line 681)

"In `unlockedRooms`, or the start room" is `Game#room_unlocked?` (`game.rb:141-143`). Name it,
and say that an awareness world room and a route room do not count, so the reach test cannot
drift from the other room checks.

### NIT-2. `find_container_in_scenario` does not walk profiles or shares (line 651)

It walks rooms, grants, sticks, released NPC containers and start items (`:3000-3025`);
profiles and shares go through the scope branches at `:641-669`. Change "walks the same homes"
to "walks the same homes except profiles and shares, which the scope branches find".

### NIT-3. B13e's `GET /container` on `board_minutes` tests nothing (lines 1023, 1053)

`board_minutes` is a note, not a container, so 404 is certain. Use `GET /container` for the
briefcase and `/unlock` plus a take for `board_minutes`. Give `remove_item` the briefcase's id,
not its type, so another briefcase in the inventory cannot match first.

### NIT-4. Row 937's "a room the player then cannot enter" (line 937)

Rooms never lock again. The case is reachable only by a crafted `player_drop` naming a room
the player has not opened (`add_item_to_room!` does not test the room). Say so in the row.

## Checked and found sound

- Drop and pick-up, reload and bootstrap: no path writes `lockSteps`; the request count and
  `nonce` survive (B13c, rows 937 and 939 are right).
- Knock-out: the drop keeps the authored id; `npc_held_item_delivered?` blocks a duplicate drop
  of a given item.
- Give to an NPC and take back: there is no player-to-NPC give route; taking from an NPC is the
  add route with `source_npc_id` (see MAJOR-1 on its weakness).
- Client-built object: the fresh `_cadd_` id and the `clientAdded` marker already stop a
  borrowed id; `held_in?` by id with forged items excluded keeps a same-named twin out of Rule D.
- Leaks: every Rule D refusal reuses an invented id's body, and an unreleased NPC item already
  resolves to nothing, so no answer tells a hidden item from a missing one (subject to MINOR-2's
  ordering).
- Delta sync: `carried_step_ids` is derived and memoised; no new synced key; the sync route
  cannot write any state Rule D reads.
- Shipped scenarios: no shipped item or flow carries `secondStep`; the `FORGEABLE_ITEM_FIELDS`
  addition strips nothing today.
- G1 build rows: the stage table (line 150), section 12 order (lines 1071-1072) and the shared
  file rows (1078-1079) put `carried_step_ids` and Rule D in G1; rows 935-936 test it. MAJOR-2
  to MAJOR-5 change what those rows assert, not where they sit.
