# KO position on reload: code review R1

R1: 0/1/4

Reviewed `git diff f46ce65fc...HEAD` on `build/ol-ko-pos`, including commits
b1dd0e83d, 90bbeea09 and 46db39486. Files: `public/break_escape/js/systems/npc-hostile.js`,
`app/models/break_escape/game.rb` (`merge_npc_hostility!`, `merge_ko_position!`,
`ko_position_from`, `valid_ko_coord?`, `scenario_room_ids`, `apply_ko_positions!`,
`ko_positions`, `apply_room_state_changes!`), the two test files and
`tools/playtest/ko-pos-proof.mjs`.

Read-only review. No code changed.

## What holds up

- Delta sync is bounded. `npcHostility` is a `RING_KEYED_SECTIONS` member
  (games_controller.rb:2189); the record is rebuilt field by field from known keys
  and `merge_ko_position!` keeps a stored position over an incoming one, so a
  re-sent KO is byte-identical and `changed_hash_keys` (games_controller.rb:2372)
  records no change. The "no growth" and "one UPDATE" tests
  (reload_persistence_test.rb:843, :905) prove this over HTTP.
- Field-by-field rebuild drops extra keys. `koZ`/`evil` in the hostile-input test
  (reload_persistence_test.rb:828) are never stored. Good.
- Type/range/room-existence validation is real and HTTP-driven: wrong room,
  out-of-range, string coordinate are all dropped while the KO is kept
  (reload_persistence_test.rb:822).
- `apply_ko_positions!` runs at method scope, before `filter_requires_and_contents_recursive`
  and `strip_notes!` in `filtered_room_data`, so an injected NPC is filtered the
  same as a native one (game.rb:2083, 2096, 2205). No new leak of `requires`/locked
  `contents` or author notes.
- Same-room vs cross-room de-duplication is sound. `filter_map` moves a native KO'd
  NPC and the injection loop skips any id already present (game.rb:2109, 2121), so no
  duplicate or double-injection on either room fetch.
- The client coordinate frame round-trips. Capture stores the sprite anchor
  (`sprite.x`/`sprite.y`, npc-hostile.js:323) and the server restores the NPC's
  `x`/`y` to those values; `roomIdAtFeet` adds the foot offset itself
  (interaction-walls.js:88), so the stored room matches the feet. The "30 px question"
  is handled: the death-animation origin shift is visual only and does not move
  `sprite.y`.

## Findings

### M1 koRoom is accepted for any scenario room, with no reachability or ownership bound

`app/models/break_escape/game.rb:4267` (`ko_position_from`) validates `koRoom`
only as `scenario_room_ids.include?(room_id)`, i.e. any room that exists anywhere
in the scenario. A KO is a client claim gated only by `claimable`
(`ko_claimable_room_npc_ids` intersected with `encounteredNPCs`, game.rb:5057), which
is satisfied for any met room NPC the player has never actually fought. So a crafted
`sync_state` can set `ko: true` for a met NPC and place its `koRoom` at any scenario
room, plus arbitrary in-range `koX`/`koY`.

Failure scenario: a courier NPC carrying a keycard in room A has been met (room A was
served) but not fought. The player sends
`{ courier: { hostile: true, ko: true, koRoom: <their current room>, koX, koY } }`.
On reload `apply_ko_positions!` (game.rb:2119) injects `find_npc_in_scenario(courier)`
deep-duped, i.e. the full scenario def including `itemsHeld`, `eventMappings` and the
conversation block, into the player's room at the chosen spot, and strips the courier
from its home room.

Mitigations that stop this being a blocker, not a fix:
- GET /room is gated (games_controller.rb:554): a locked or gated `koRoom` cannot be
  fetched, so an NPC injected there is never served, and a KO'd NPC has collisions
  off so it cannot block a path. Injection also never unlocks a door. The "place an
  NPC behind a gate to open or block a path" case does not pay off today.
- A KO'd NPC is non-interactive, so the summoned `itemsHeld` is not directly
  collectable (see m4).

Residual risk: the server relocates an NPC and injects its full def on client say-so,
into any room the player can reach, undermining the "server hard-enforces forged items"
principle in AGENTS.md. It also lets a player strip any met NPC from its home room,
suppressing home-room `eventMappings`/barks keyed on the NPC being present.

Suggested fix: bound `koRoom` to rooms the player could have fought in, i.e.
`player_state['unlockedRooms']` (a KO only ever happens where the player has been),
in addition to the existing scenario-room check. That still supports the legitimate
needs-NPC cross-room case (the player is always in an unlocked room) while blocking
relocation into never-visited rooms. Drop the position (keep the KO) when the room is
not unlocked, matching the existing "invalid position, KO still kept" behaviour.

### m1 Drop path and KO-capture resolve the fall room from different sprite points

`damageNPC` captures the room with `roomIdAtFeet(sprite.x, sprite.y)`
(npc-hostile.js:325), while `dropNPCItems` resolves it with
`roomIdAtFeet(bc.x, bc.y)` where `bc = sprite.body.center` (npc-hostile.js:733). The
capture matches `roomIdAtFeet`'s contract (it adds the foot offset), so it is the more
correct of the two, but the two call sites can disagree near a door or a back wall, so
a KO right on a boundary could record a different room than the one its dropped items
land in. Suggest using one helper (the sprite anchor) for both. Benign today.

### m2 ko_positions trusts store-time validation and is not re-checked against the scenario

`app/models/break_escape/game.rb:2133` (`ko_positions`) re-checks only types, not
`scenario_room_ids`. If a scenario is edited mid-game and a room is removed, a stored
`koRoom` pointing at the gone room never matches any fetched `room_id`, so the NPC is
stripped from its home room (game.rb:2110) but never injected anywhere: the NPC is
lost. Edge case (scenario edits on a live game). Suggest re-validating `koRoom` against
`scenario_room_ids` in `ko_positions`, or only stripping from home when the target room
still exists.

### m3 Tests prove placement coordinates but not that the injected def is complete

`reload_persistence_test.rb:803` asserts only `x`, `y`, `isKO`, `currentHP` on the
injected cross-room NPC. Nothing asserts that `itemsHeld`, `eventMappings`, the
conversation block or the needs/office-life fields survive the `deep_dup.merge`
(concern 3, bullet 1), and nothing covers a `koRoom` the player cannot fetch (the
access gate) or the home-room strip when `koRoom` is never served. Suggest a test that
injects an NPC with `itemsHeld`/`eventMappings` and asserts they come through, and one
that a locked `koRoom` serves nothing while the NPC still leaves its home room.

### m4 Injected NPC carries itemsHeld that a real KO already dropped (defence in depth)

The injected def keeps the scenario `itemsHeld` (game.rb:2127), but in real play those
items were dropped as room objects at the moment of KO (npc-hostile.js:379), so the
reloaded NPC "holds" items that also exist on the floor. This display duplication
pre-dates D5 for the home-room case, but D5 lets a forged relocation (see M1) summon a
KO'd, key-carrying NPC into the player's own room. It is not collectable today only
because there is no "search body" pickup path; the safety rests on that absence rather
than on a server check. Fixing M1 (bounding `koRoom`) removes the summon vector;
separately, suppressing already-delivered ids from an injected NPC's `itemsHeld` (via
the existing `delivered_item_ids`, game.rb:1465) would make it robust.

## Outcomes

- M1 (fixed): `ko_position_from` now also requires `koRoom` in `player_state['unlockedRooms']`
  (`ko_room_reachable?`), the same "the player has been here" notion GET /room gates on, and
  needs no `scenario_data` (which the narrow sync load omits). A forged KO claim for a
  never-entered room has its position dropped, the KO kept; the met NPC is not relocated.
- m1 (fixed): the client now captures the body centre (`sprite.body.center`) for
  `koRoom`/`koX`/`koY`, the same point the drop path resolves its room from, so capture and
  drop agree. This is `roomIdAtFeet`'s documented input (the body centre), unlike the former
  sprite anchor; the sprite-anchor choice the review preferred would have left the placement
  off by the anchor-to-centre offset, so the body-centre choice was taken instead and
  documented here and at the call site.
- m2 (fixed): `ko_positions` re-checks `koRoom` against `scenario_room_ids`. A stored room
  that a mid-game scenario edit removed is skipped, so the NPC is served at home, still KO'd,
  rather than stripped and lost.
- m3 (fixed): new Rails tests assert the full injected definition (`itemsHeld`,
  `eventMappings`, `conversation`, `needs`) survives the `deep_dup`, plus the reachability
  bound (never-entered and entered rooms), the access gate on the unreachable room, and the
  removed-room home serving.
- m4 (fixed): the cross-room injection strips `itemsHeld` whose id is in `delivered_item_ids`
  (dropped to the floor or in the player's hands), so a summoned KO'd body never re-carries a
  key a real KO already dropped. The same-room duplication the review notes pre-dates D5 and
  stays benign (a KO'd NPC is non-interactive); the injected copy is hardened because M1's
  former summon vector made it worth it.
- y-offset (fixed, same root cause as m1): the 30 px cross-room / 4 px same-room gap was the
  sprite-anchor vs body-centre offset, which differs per NPC (marek larger than amara). With
  the body centre captured, the stored position is in the same frame the server restores and
  the sprite body is placed in, so the gap closes to the KO-pose origin shift alone. Live
  crops before and after the reload confirm it.
