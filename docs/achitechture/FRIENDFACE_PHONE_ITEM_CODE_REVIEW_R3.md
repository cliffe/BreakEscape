# Friendface phone item: code review, round 3

Branch `build/ff-phone` against `main`, at c1201f365 (R2 fixes 6dd1a2498 and 0bc445880, build log
c1201f365). Plan `FRIENDFACE_PHONE_ITEM_PLAN.md`, build log `FRIENDFACE_PHONE_ITEM_BUILD_LOG.md`,
round 2 `FRIENDFACE_PHONE_ITEM_CODE_REVIEW_R2.md`.

Counts: 0 blocker, 0 major, 2 minor, 5 nit.

## What was checked

- Each R2 finding against the code.
- The whole branch diff again, with most weight on the wider M1 rule: every NPC-sourced
  `update_room add_object` now needs a recorded KO, or an offer from a met NPC
  (`Game#npc_room_drop_allowed?`).
- Every client route that can send an NPC-sourced room add, every ink tag handler, the JSON
  action gives, the office-life carry code and every mission with a KO-able NPC that holds items.
- The reload pruning against the gift-record filter, the room bootstrap, the scenario bootstrap
  and the leak scanner.
- The new validator warnings on `test_access_social`, against the user's direction (q35).
- What the branch adds to player state, against the new rule that synced state changes as a
  delta or stays bounded.
- Live proof on a keyless server at :3057 (stopped afterwards). Games created: 1536 (m01, unused
  after the room check) and 1539 (m01, start room `break_room`).
- Tests, affected files only, no lock:
  `test/controllers/break_escape/friendface_phone_test.rb`, `test/models/break_escape/game_test.rb`,
  `inventory_canonical_item_test.rb`, `game_state_locking_test.rb`, `wearable_test.rb`,
  `capture_proofs_test.rb`: 183 runs, 835 assertions, 0 failures, 0 errors.
  JS: `friendface-phone` 11/11, `minigame-launch-routes` 31/31, `validator-access-reactive`
  10/10, `validator-access-social` 23/23, `inventory-restore-no-revalidate` 5/5.

## The wider M1 rule: no intended route is blocked

The fixer's claim holds. The only client code that sends an NPC-sourced room add is the KO drop.

- `RoomStateSync.addItemToRoom` has two callers: `npc-hostile.js` `dropNPCItems` (with
  `npcId`, `sourceType: 'npc_defeated'`) and `item-drop.js` (a player drop, `sourceType:
  'player_drop'`, no NPC). No other file posts `add_object`; `room-state-sync.js` is the only
  sender of `update_room`.
- Gives never touch the room. `give_item` (`chat-helpers.js`, `NPCGameBridge.giveItem`) and
  `give_npc_inventory_items` (the container minigame) post `/inventory add` with
  `source_npc_id`, which reaches the `npc` branch of `validate_item_collectible`, unchanged for
  any item but the phone. The JSON action `give_item` (`apply-actions.js`, timers, flag
  stations) posts `/inventory add` with no NPC source.
- No other ink tag adds a room object: the handler list (`unlock_door`, `give_item`,
  `give_npc_inventory_items`, `remove_npc`, `hostile`, `clone_keycard` and the task and global
  tags) has no drop, place or throw.
- Office-life carrying (`npc-needs.js` `dropHeld`, `placeHeld`, `consumeHeld`) moves room
  objects on the client and only ever sends a remove; it never adds.
- `koImmune` NPCs drop nothing, as before.
- The KO drop waits for the KO sync: `damageNPC` keeps the `updateNpcState` promise and
  `dropNPCItems` sends the add after it settles. The KO is written to `npc.roomId`, the
  manager record's room, which stays the scenario room for a chaser (only a `multiRoom`
  patroller rewrites it, and no mission uses one), so `npc_in_room?` passes and
  `npc_defeated?` is true when the add arrives.

Every mission m01 to m10 except m08 has KO-able NPCs holding items on an intended route (m01
Derek's launch device, m01 Kevin's lockpick and keycard, m04 Relay's master card, and others).

Live proof, game 1539 (m01, `break_room`): Derek made hostile and knocked out through
`npcHostileSystem.damageNPC`. Requests in order: `update_npc_state {isKO: true}` 200,
`add_object entropy_launch_device` (sourced from Derek, `npc_defeated`) 200, pickup
`/inventory add` 200, `remove_object` 200. The launch device ended in the inventory.

## Round 2 findings, rechecked

| R2 | Status |
|---|---|
| M1 unoffered phone through an NPC-sourced room add | Fixed. `add_item_to_room!` asks `npc_room_drop_allowed?`; the room branch of `validate_item_collectible` asks it again for a stored phone with `phoneOf`. Tests cover the refusal, the KO drop, the offered drop and an old save. |
| m1 phone still in `itemsHeld` after a KO pickup and reload | Fixed. `apply_room_state_changes!` drops a phone whose `phoneOf` is the NPC once `friendface_phone_taken?`. |
| m2 validator silent when nothing offers the phone | Fixed, but noisy (m1 below). |
| n1 compiled-only offer read | Fixed: `.ink` source fallback in the server and the validator. |
| n2 headless records cannot offer | Documented in plan section 3. |
| n3 `friendface_phone_taken?` walks the scenario | Partly: the early return helps only while the inventory holds no Friendface phone (n3 below). |
| n4 shared phone ids | Fixed: validator error. |
| n5 offered give claimable without the conversation | Documented in plan section 3 and the backlog (server-checked knock-outs), as accepted under the cheat policy. |

## Minor

### m1. The "only a KO drop" warning fires for every phone that is meant to be taken by a KO

`check_friendface_phones` (`scripts/validate_access_work.rb`) now warns for Lena, Priya, Nadia
and Greg in `test_access_social`. Under q35 a carried phone is an item the player obtains, and a
KO drop is one way to obtain it, so for these four NPCs the warning says what the author
intended. The validator also makes the phone required (an error) for every social NPC with a
feed and a phone, so an author following the rules gets one warning per such NPC they did not
script a give for. Warnings that are always present get ignored, which hides the case that does
matter: an NPC with `"koImmune": true` and no give holds a phone no route can ever hand over.

Fix: make that case an error ("no give offers this phone and the NPC is koImmune, so the player
can never obtain it"), and downgrade the rest to an info line, or drop it.

### m2. A KO drop now depends on the KO sync succeeding

Before the branch an in-room KO drop was accepted by `npc_in_room?` alone. Now it needs the
`update_npc_state` request before it to have landed. `dropNPCItems` sends the add whatever that
request returned (`Promise.resolve(afterSync).catch(...).then(...)`), and nothing retries. If
the KO sync fails once (network blip, server error), the drop is refused. The item still lies on
the floor in that session and a non-phone item can still be picked up (the `npc` branch only
needs the NPC met, and a fight usually starts in conversation), but after a reload before the
pickup the item is gone from the room. For m01 Derek's launch device that is a critical item.
The window is small (one failed request, then a reload before walking over), so minor.

Fix: in `dropNPCItems`, when the KO sync answered false, retry it once before the add, or have
the server accept `source_type == 'npc_defeated'` from an NPC in the room and record the KO
itself (it would then mirror what the client already trusts in `update_npc_state`, so no new
trust).

## Nit

- n1. **Offer text the engine accepts but the patterns miss.** `chat-helpers.js` trims around
  the first colon, so `#give_item : phone_friendface` gives the phone, but
  `AccessWork.give_item_re` (`give_item:\s*`) does not match it and the server refuses the give
  with a 422. A tag built from an ink variable (`#give_item:{t}`) cannot match either. No
  scenario writes either form today (grep of every `.ink`). Allow `\s*` before the colon; say in
  plan section 3 that the item type must be literal.
- n2. **JSON action gives are not offers.** An `{"type": "give_item", "item": {...}}` action in
  an NPC's `eventMappings` (`apply-actions.js`) is not read by `offers_item_text?`, and it posts
  with no NPC source. For a phone it cannot work anyway (an inline item is not a declared phone),
  but nothing tells the author. One line in plan section 3: phones are given by ink tags only.
- n3. **The held-phone fallback in `friendface_phone_taken?` still walks the scenario.** Every
  NPC phone that reaches the inventory is now in `phonesTaken`, so the `held_friendface_phone`
  fallback only serves saves made on this branch before R1. The R2 early return skips it only
  while the inventory has no Friendface phone; a player holding their own phone (the spare in
  the `test_access_social` lobby) brings back a scenario walk on every `scenario_room_npc` call
  for an NPC that still has its phone. Drop the fallback, or skip phones with no `phoneOf`.
- n4. **The validator's `.ink` fallback does not follow `INCLUDE`.** When a story has never been
  compiled, a give tag in an included file is missed and the m1 warning fires wrongly. The server
  has the same gap only before the first `/ink` compile. Rare; note it beside the warning.
- n5. **The open route returns posts the client throws away.** `/friendface_phone` sends
  `feedPosts` (for the player's own phone, every revealed post of every NPC) on each open, and
  `openFriendfacePhone` ignores them by design (R1 M2). Bounded by the authored feeds and sent
  only when the player opens a phone, so no breach of the state-size rule, but the payload is
  dead weight. Send it only when a test asks (a `posts=1` flag), or drop it.

## Player state size (new standing rule)

| Added | Where | Bound | Sent |
|---|---|---|---|
| `phonesTaken` | `player_state`, server only | NPC ids, deduplicated on insert, at most one per declared NPC phone | Never sent to the client and not a `sync_state` section; written only on an inventory add |
| Unread badge counts | Client memory (`FriendfacePhones.unread`) | One entry per held phone | Never saved or synced; a reload clears them (plan question 4) |
| Hold poll | Client `setInterval` (300 ms) while a blip waits | One timer, cleared on release | Local only, no request |
| Gift records | `npc_given_items`, existing | Deduplicated, at most the NPC's `itemsHeld` | Unchanged by this branch |
| Open route answer | `/friendface_phone` | Revealed posts, bounded by the authored feeds | Only on an open, never polled (n5) |

No new state grows without limit, and no sync or poll re-sends anything whole.

## Reload agreement

- The gift-record filter and the new `phoneOf` filter both run in `apply_room_state_changes!`,
  which serves every room NPC the client gets (`/room`); the scenario bootstrap strips room NPCs
  entirely, so there is no second copy to disagree.
- After a KO pickup and reload: server `phonesTaken`, bootstrap `phone: false`, phone gone from
  `itemsHeld`, NPC restored as KO'd (no second drop). The NPC's other held items stay listed, as
  on `main`, and a KO'd NPC does not drop them again.
- Old saves: a phone held from before `phonesTaken` still counts as taken through the held-phone
  fallback (n3); saves from before the branch hold no Friendface phones at all.
- Leak scanner: `access_leak_scanner.rb` walks `itemsHeld` as a child list; the phone carries no
  secret field, so pruning it changes nothing there. Capture (`/capture_secrets`) does not read
  phones.

## Cheat policy

- Forged items: hard-enforced. `phoneOf` is a forbidden client field, a held phone must match a
  declared phone by id and owner, an unsourced room add of the type is refused, and an NPC-sourced
  add stores the server's held copy.
- Client-flow steps: an offered give can be claimed without the conversation, and a claimed KO
  hands over any held item. Both are best effort with the NPC sanity check (met, offers, or
  recorded KO), as the policy allows, and both are written up for authors and the backlog.
- Intended route: no mission route found that the wider rule refuses; the m01 KO drop proven live.
