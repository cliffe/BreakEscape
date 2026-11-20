# Friendface phone item: code review, round 2

Branch `build/ff-phone` against `main`, at b05d47108 (R1 fixes db4be19e9 and the build log).
Plan `FRIENDFACE_PHONE_ITEM_PLAN.md`, build log `FRIENDFACE_PHONE_ITEM_BUILD_LOG.md`, round 1
`FRIENDFACE_PHONE_ITEM_CODE_REVIEW_R1.md`.

Counts: 0 blocker, 1 major, 2 minor, 5 nit.

## What was checked

- The full diff again: route, `SocialFeed` phone methods, the bootstrap and `scenario_room_npc`
  merges, `add_item_to_room!`, the `npc` branch of `validate_item_collectible`, the client module,
  registry, interactions list and validator.
- Probes in a throwaway Rails test on the branch's fixture (removed, not committed). Results are
  quoted under each finding.
- Both full suites under the shared lock (results at the end).

What holds up since round 1: the open no longer restores posts, so R1 M2 is fixed (below). A
minted unsourced phone is refused. `phonesTaken` is written by `add_inventory_item!` on every route
that goes through it, and the server, the room bootstrap and the client agree on "taken" for a
give, a KO pickup, a remove and a reload. No id or name collision forges a phone (below).

## Round 1 majors, rechecked

### R1 M1 (gives): partly fixed; one route still open (see M1 below)

- **Is "the scenario offers the give" detected reliably?** For the forms the engine runs, yes.
  `GIVE_PHONE_RE` matches `give_item:phone_friendface` with or without a `|` or `:` selector
  (`chat-helpers.js` splits on either), and `GIVE_INVENTORY_RE` reads the comma filter the same way
  the client does (`showNPCInventory(npcId, filterTypes)`). Gaps are small and listed as nits
  (n1, n2).
- **Can a client trigger an offered give without running the ink?** Yes. Probe: player in the
  lobby, Jake met but never spoken to, `POST /inventory add {type: phone_friendface, id:
  jake_phone}` with `source_npc_id: jake`: 200. The server checks only that Jake is encountered
  and that his story contains the tag somewhere. See n5.
- **Does an offered phone the player never earned still slip through?** Yes, by the same probe.
  For Jake this costs nothing (his ink offers the phone with no condition), but a scenario that
  gates the give behind trust or a puzzle has no server-side gate. See n5.
- **Does an unoffered phone still slip through?** Yes, through the room-drop route. See M1.

### R1 M2 (the open race): fixed

`openFriendfacePhone` (`public/break_escape/js/systems/friendface-phone.js:130`) asks the route,
clears the count and launches; nothing in the module calls `restore`. A `/feed_post` answer that
lands after the open still reaches `SocialFeed._add` with `live: true` and emits `npc_posted`. The
JS test "review R1 M2: an open answered while a /feed_post is in flight..." covers the order that
used to lose the post. No other caller merges the route's `feedPosts`.

## Major

### M1. An unoffered NPC phone is still taken through an NPC-sourced room add

The R1 fix exempts a `room` location from the offer check because it assumes an `objects_added`
phone is a KO drop. `Game#add_item_to_room!` (`app/models/break_escape/game.rb:424` to `:429`)
does not require a KO: with `sourceNpcId` set it accepts the add when
`npc_in_room?(npc_id, room_id)` is true, whatever `sourceType` says. It then stores the NPC's own
held copy, `phoneOf` included. The inventory add with no source finds it at "Priority 0"
(`games_controller.rb`, `find_accessible_item`), the location is `room`, and the offer check in
the `npc` branch never runs.

Probe, `test_access_social` fixture, Lena met, not KO'd, never offering her phone:

- `POST /update_room {roomId: office, actionType: add_object, sourceNpcId: lena, data: {type:
  phone_friendface, id: lena_phone}}`: 200.
- `POST /inventory add {type: phone_friendface, id: lena_phone}` (no source): 200, stored with
  `phoneOf: lena`.
- `friendface_phone_taken?('lena')` true, `phonesTaken` `["lena"]`, `scenario_room_npc('lena')`
  `phone: false`, `npc_defeated?('lena')` false; `/feed_post` for Lena: `refused: true`;
  `/friendface_phone` for Lena: 200.

This is the outcome R1 M1 set out to stop: a tampered client steers an NPC the scenario never
offered to change.

Fix: in `add_item_to_room!`, accept an NPC-sourced `phone_friendface` only when
`source_type == 'npc_defeated' && npc_defeated?(npc_id)`, or else when
`friendface_phone_offered?(npc_id)` (a dropped give). Mirror it in the `room` branch of
`validate_item_collectible` if a pre-fix save can hold such an entry. Add a Rails test with the
probe above: the room add is refused and Lena keeps her phone.

Residual, pre-existing and outside this branch: `update_npc_state` permits `isKO` from the client
for any NPC in the room (`npc_state_params`, `Game#update_npc_state!`), so a client can still claim
a KO of Lena and then take her phone. Combat is client-side, so this is the existing trust limit
for every KO drop; flag it to the user rather than fix it here.

## Minor

### m1. On reload an NPC still lists a phone taken without a gift record

`apply_room_state_changes!` (`game.rb`, the `npc_given_items` filter) trims `itemsHeld` by the
gift record only. A phone taken by a KO pickup (or by the M1 route until it is fixed) has no gift
record, so after a reload the NPC's record in the room bootstrap still holds the phone while the
server says it is taken. Harmless while the NPC stays KO'd; a later `give_npc_inventory_items`,
a revived NPC or another drop would offer a phone the server already counts as gone, and after a
remove the add would store a second copy. Fix: in the same filter, also drop a `phone_friendface`
whose `phoneOf` is in `phonesTaken`; extend the bootstrap test.

### m2. The validator does not mirror the server's offer rule

`check_friendface_phones` (`scripts/validate_access_work.rb`) requires an NPC with a feed to hold
its phone, but says nothing when no give offers it. In `test_access_social` Lena, Priya, Nadia and
Greg hold phones the server will never hand over, so the only route is a KO. That is fine as a
test, but an author who meant the phone to be given gets no hint. Fix: a warning when an NPC
phone's owner has no `give_item:phone_friendface` and no unfiltered or phone-naming
`give_npc_inventory_items` in its story or record (reuse the server's two patterns so the two
cannot drift), worded "only a KO drop hands this phone over".

## Nit

- n1. `friendface_phone_offered?` (`social_feed.rb`) reads only the compiled JSON
  (`InkStoryFile.find(..., compile: false)`). A story never compiled, or edited since its last
  compile, is read stale or not at all. The game compiles on the first `/ink` request, which comes
  before any give, so this bites only tools and tests; scanning the `.ink` source as a fallback
  would close it.
- n2. A headless email record (00 S8) can give items (`find_accessible_item`, Priority 0.5), but
  `friendface_phone_offered?` looks only at `scenario_room_npcs`, so it can never offer a phone.
  Fine while phones belong to room NPCs; say so in the plan or the validator.
- n3. `scenario_room_npc` now calls `friendface_phone_taken?` on every call (21 call sites), and
  for an NPC not yet in `phonesTaken` that walks every room's objects, contents and `itemsHeld`
  (`declared_friendface_phones`). Cheap per call but repeated in the report and needs paths.
  Return early when the inventory holds no `phone_friendface`.
- n4. No validator rule says Friendface phone ids are unique. The server pairs a held phone with a
  declared one by id and owner, so a clash cannot forge one, but `find_accessible_item` resolves an
  add to the first matching id, so two phones sharing an id would hand over the wrong one.

- n5. An offered give can be claimed from any room, at any time, without the conversation
  (probe B: Jake's phone from the lobby, never spoken to: 200). The server checks
  `encounteredNPCs` and `friendface_phone_offered?`, so the NPC really can give the phone. Under
  the project's cheat-resistance rule (ink-gated steps stay best effort while the server checks the
  NPC can give the item) this is an accepted risk. Note it in plan section 3 ("do not gate a phone
  give behind a condition the server must enforce") and the ideas backlog; a cheap extra would be
  requiring the player in the NPC's current room.

## Collisions: no forge found

The question from a parallel review: can a forged item whose id equals a real reference pass a
bare-id match? Here it cannot.

- `held_friendface_phone` (`social_feed.rb`) needs the type, an id equal to a declared phone's
  id, and the same owner as that declared phone. A bare id is not enough.
- The owner is `phoneOf`, which only server copies carry: `canonical_inventory_item` stores the
  scenario's copy or strips `phoneOf` (`CLIENT_ITEM_FORBIDDEN_FIELDS`); an NPC-sourced room add
  stores `held_item.deep_dup`; a player drop stores the held copy and needs `droppable`.
- Probe C: `update_room add_object` sourced from Jake with `{id: player_phone, name: "Jake's
  phone"}`: stored as `jake_phone` with `phoneOf: jake` (the held copy's id wins), not as the
  player's own phone.
- A client-built `phone_friendface` with the own phone's id cannot reach the inventory: the type
  is not always-allowed or decor, and an unsourced room add of the type is refused.
- `/friendface_phone` takes only `nil` or a non-empty String; arrays and hashes are 403.

## Phone-taken agreement

| Route | Server (`friendface_phone_taken?`) | Client live record | After reload |
|---|---|---|---|
| Ink give | `phonesTaken` and gift record | `syncOwners` on `inventory_changed` | bootstrap `phone: false`, phone trimmed from `itemsHeld` |
| KO pickup | `phonesTaken` | `syncOwners` | bootstrap `phone: false`; phone still in `itemsHeld` (m1) |
| Remove after taking | stays taken (`phonesTaken`) | stays false (never reset) | bootstrap `phone: false` |
| Phone on the floor after a KO, not picked up | not taken | not taken | not taken |

## Suite results (b05d47108, both under the shared lock)

- Rails `bin/rails test`: 1808 runs, 25632 assertions, 0 failures, 0 errors, 1 skip.
- JS `bin/test-js -j 3`: 508 passed, 0 failed, 508 total.
