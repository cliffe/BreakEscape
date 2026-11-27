# KO position on reload: code review R2

R2: 0/0/4

Reviewed `git diff 669cee5be...HEAD -- app public test tools` on `build/ol-ko-pos`
(tip 83b37b0be), focused on the R1 fixes in `efd1cba7e` and `330c6d22f`. Files:
`app/models/break_escape/game.rb` (`apply_ko_positions!`, `ko_positions`,
`merge_ko_position!`, `ko_position_from`, `ko_room_reachable?`, `valid_ko_coord?`,
`scenario_room_ids`), `public/break_escape/js/systems/npc-hostile.js`,
`test/controllers/break_escape/reload_persistence_test.rb`,
`test/js/npc-hostility-persistence.test.mjs`, `tools/playtest/ko-pos-proof.mjs`,
checked against `app/controllers/break_escape/games_controller.rb` (the GET /room
gate) and `public/break_escape/js/systems/npc-sprites.js` (body placement).

Read-only review. No code changed.

## What holds up

- **M1 is the right notion and closes the forged relocation.** GET /room gates on
  start room, `unlockedRooms`, an awareness world room, or an NPC route room
  (games_controller.rb:544-557). `ko_room_reachable?` (game.rb:5161) checks
  `unlockedRooms`, which is seeded with the start room at creation
  (`initialize_player_state`, game.rb:6595, a `before_create`) and grows on every
  room access (games_controller.rb:562-567). So the start room is covered without a
  special case, and a world room is auto-promoted into `unlockedRooms` on its first
  fetch (the `!is_unlocked && !is_route_room` branch), so its KO survives. A forged
  KO naming a never-entered room has its position dropped and the KO kept; the test
  `a forged KO cannot relocate a met NPC into a never-entered room`
  (reload_persistence_test.rb:891) proves this over HTTP, including the 403 on the
  room itself. First fall wins is sound: `merge_ko_position!` (game.rb:5128) reads
  `ko_position_from(merged[npc_id])` (the prior stored record) before the incoming
  entry, and `ko_positions`/`ko_position_from` re-validate the stored room on every
  pass, so a stale stored room cannot leak.

- **m1 body-centre frame round-trips for both NPC kinds.** npc-sprites.js:118-126
  shifts a freshly made sprite so `body.center` lands on the served `x,y`, for every
  NPC. A same-room KO sets the native NPC's `x,y` to `koX,koY` (game.rb:2114); a
  cross-room KO injects a def with `x,y = koX,koY` (game.rb:2127). The client now
  captures `sprite.body.center` (npc-hostile.js:327), the same point, so the stored
  value and the restore frame agree. The capture is live, before the body is disabled
  on reload (npc-sprites.js:195), so a disabled body does not affect it; the stale
  `npcPos` caveat is placement-independent and already documented.

- **m2 removed-room handling is correct and defence-in-depth.** `ko_positions`
  re-checks `scenario_room_ids` (game.rb:2163) and `merge_ko_position!` would also
  drop a gone room on the next sync, so an NPC whose fall room was deleted is served
  at home, still KO'd, by two independent paths. Test at
  reload_persistence_test.rb:958.

- **m4 delivered-item strip is sound.** `delivered_item_ids` (game.rb:1465) covers
  room `objects_added`/`objects_removed` and inventory ids, which is exactly the set a
  real KO drop or a pickup produces. Ids are unique per scenario, so the strip cannot
  deny the player an item it did not receive: a stripped id is either in the player's
  hands or lying on the floor as a room object. It matches the suppression a native
  room NPC already gets, and shares its result with `koDropPending`
  (apply_ko_positions! runs at game.rb:2223, before `with_ko_drop_pending` at
  game.rb:2290), so the two do not double-drop.

- **Delta stays bounded and single.** The record is rebuilt field by field from known
  keys; the three new fields are written once client-side (`state.koRoom === undefined`
  guard, npc-hostile.js:329) and carried back unchanged by `restoreHostility`, so a
  re-sent KO is byte-identical. Tests
  `KO position is first-fall-wins and does not grow the state per sync`
  (reload_persistence_test.rb) and the JS `repeated exports do not grow` cover it.

## Findings

### m1 ko_room_reachable? is narrower than the GET /room gate for a route room

`app/models/break_escape/game.rb:5161`. The gate serves four kinds of room (start,
unlocked, world, route), but `ko_room_reachable?` accepts only `unlockedRooms`
(plus the seeded start room). An awareness world room is auto-promoted into
`unlockedRooms` on fetch, so it is fine, but an NPC route room is deliberately kept
out of `unlockedRooms` (it lives in `npcRouteRooms`, disjoint by design,
game.rb:242, 391). A player can stand and fight in a route room they slipped into
through a gated door.

Failure scenario: an NPC is legitimately knocked out in a route room the player is
standing in. `ko_position_from` drops the position (the room is not in
`unlockedRooms`), so on reload the NPC is served KO'd at its home spawn rather than
where it fell. Benign (never worse than pre-D5, the KO is kept) and only affects the
gated-door slip-in case, so minor.

Fix: widen the bound to match the served set, e.g.
`Array(player_state['unlockedRooms']).include?(room_id) || start_room?(room_id) ||
in_npc_route_room?(room_id) || awareness_world_room?(room_id)`, or reuse the same
predicate GET /room evaluates, so a reachable-and-served room and a storable KO room
are the same set. Keep dropping the position (not the KO) for anything else.

### m2 A forged KO can still strip a met NPC from its home room and relocate it into any visited room

`app/models/break_escape/game.rb:2109` (the `filter_map` strip) and `:2126` (the
inject), reached through `ko_position_from` (game.rb:5143). The reachability bound
blocks never-entered rooms, but the player controls `unlockedRooms` by visiting
rooms, so a crafted `sync_state` can still set `ko: true` for a met-but-unfought,
non-`koImmune` NPC and name any already-visited room as `koRoom`. The server then
strips that NPC from its home room (so home-room `eventMappings`/barks keyed on its
presence no longer fire) and injects a KO'd copy into the chosen room.

Failure scenario: a mission needs a home-room NPC present (a conversation that hands
an item, a bark that cues the next step). The player forges a KO for it; the NPC
leaves home and the cue never fires. The payoff is self-inflicted (the injected NPC
is non-interactive, its delivered items are stripped, no gate is unlocked and a KO'd
NPC already has collisions off), so this is griefing-yourself rather than a cheat,
hence minor and unchanged in severity from R1's residual note. It is not worsened by
the fixes.

Fix (hardening, optional): relocate and strip-from-home only for an NPC the server
itself recorded as defeated this session (a server-set defeat marker), not on a bare
client `ko` claim; or mark conversation/progression-critical NPCs `koImmune` so no
position or relocation is ever stored for them. Document the accepted residual in the
plan doc either way.

### m3 No JS unit test exercises the body.center capture branch

`test/js/npc-hostility-persistence.test.mjs` (the `a KO records its fall room and
x,y` test). The mocked sprite is `{ x: 412.4, y: 268.6, once: () => {} }` with no
`body`, so `sprite.body?.center` is undefined and the capture falls back to
`sprite.x`/`sprite.y`. The assertion (`koX: 412, koY: 269`) therefore proves the
fallback, not the headline m1 fix (reading `sprite.body.center`). The cross-room
visual crop was also still OUTSTANDING in the plan doc
(KO_POSITION_ON_RELOAD.md:198-205), so the body-centre choice rests on the
npc-sprites.js:118-126 contract and the Rails injection test alone.

Failure scenario: a regression that reverts the capture back to `sprite.x`/`sprite.y`
would pass every JS test, because none supplies a `body.center` that differs from the
anchor. Relatedly, `a KO in a legitimately entered room is still stored and placed`
(reload_persistence_test.rb:910) asserts only the stored `koRoom`, not placement, so
its name over-claims.

Fix: add a JS case whose mock sprite has `body: { center: { x, y } }` offset from
`x`/`y`, and assert the capture stores the centre, not the anchor; add a `room_npcs`
placement assertion to the "still stored and placed" Rails test; and capture the
cross-room kitchen crop the plan doc leaves open.

### m4 Old dev saves keep sprite-anchor koX/koY and render permanently offset after the frame change

`public/break_escape/js/systems/npc-hostile.js:327` (capture frame change). A KO
stored before this commit holds `koX`/`koY` in the sprite-anchor frame, but the
server now places `body.center` there, so such an NPC renders shifted by the
anchor-to-centre offset (about 30 px for a larger sprite). First fall wins means the
value is never rewritten, so the offset is permanent for that save.

Failure scenario: a pre-change dev game reloaded after this commit shows a KO'd NPC
nudged from where it fell. These saves are dev-only, so no migration is warranted;
record it as a known cosmetic effect rather than fixing it. Noted for completeness,
lowest severity.

## Summary

The R1 fixes land correctly: the reachability bound matches GET /room's main notion,
the body-centre capture round-trips, the removed-room and delivered-item cases are
handled with defence in depth, and the delta stays bounded and single. No blocker or
major. The four minors are a route-room gate gap, the acknowledged forged-home-strip
residual, a JS test that misses the body-centre branch, and a cosmetic old-save
offset.

## Outcomes (D5 fix round after R2)

The R2 review found the four minors above and, separately, the coordinator confirmed
from the code the headline bug the whole feature turned on: the client never reads the
served position. Both are addressed here.

### Headline bug: the client never read the served KO position (now fixed)

`apply_ko_positions!` wrote a top-level `'x'`/`'y'` on the served NPC, for both the
same-room merge and the cross-room injection. `createNPCSprite` places a sprite with
`calculateNPCWorldPosition(npc, roomData)` (npc-sprites.js:303), which reads only
`npc.position`: `{px, py}` as absolute world pixels or `{x, y}` as tiles from the room
origin. The top-level `x`/`y` were dropped on the client, so every KO'd NPC came back
at its scenario spawn after a reload (live games 5395, 5396: Amara and Marek back on
their spawn tiles). The Rails tests asserted the top-level `x`/`y`, so they passed while
the live path broke, the "fix claims need live proof" pattern.

Fix (smallest, server-side): serve the position in the form the client reads,
`'position' => { 'px' => kx, 'py' => ky }`, and drop the unused top-level `x`/`y`.
`px`/`py` are absolute world pixels; createNPCSprite shifts the new sprite so its
`body.center` lands on that world point (npc-sprites.js:118-126), which is the exact
frame `koX`/`koY` was captured in (R1 m1, `sprite.body.center`). So the stored value and
the restore frame agree and the body lands where it fell. Other `npc.position` readers
(npc-los.js:212, npc-sight-occlusion.js:394) prefer the live sprite/body and only fall
back to `position.x`/`.y`; a KO'd NPC has its body disabled and never sights, so serving
`px`/`py` without `x`/`y` does not affect them. The same-room merge overwrites the
scenario tile `position` wholesale; the cross-room injection overwrites it on the dup.
Rails tests now assert `position.px`/`py`; a JS test supplies a `body.center` offset from
the anchor and asserts the capture stores the centre.

### m1 (route-room gate gap): fixed

`ko_room_reachable?` (game.rb ~5161) now also accepts an NPC route room
(`in_npc_route_room?`), so it matches the set GET /room serves. Start and awareness
world rooms need no special case: the start room is seeded into `unlockedRooms` at
creation and a world room is auto-promoted into `unlockedRooms` on first fetch, so both
are already covered; only a gated route room is kept out of `unlockedRooms` by design.
`in_npc_route_room?` reads `player_state['npcRouteRooms']` alone, so the predicate stays
correct under the narrow sync load that has no `scenario_data`. A legitimate KO in a
route room the player is standing in is now stored and served there. Test:
`a KO in a gated NPC route room the player is standing in is stored and placed`.

### m2 (forged home-strip residual): accepted as it stands

A crafted `sync_state` can still set `ko: true` for a met-but-unfought, non-`koImmune`
NPC and name any already-visited room, stripping that NPC from its home room and
injecting a non-interactive KO'd copy. The payoff is self-inflicted (no gate unlocked,
delivered items stripped, collisions off on a KO'd body), so this is griefing-yourself,
not a cheat, and is unchanged in severity from R1's residual note. Accepted. A mission
that needs a specific home-room NPC present for a cue should mark it `koImmune`, which
blocks any position or relocation being stored for it.

### m3 (JS test missed the body.center branch): fixed

The capture test's mock sprite had no `body`, so it proved only the sprite-anchor
fallback. The mock now carries a `body.center` offset from the anchor and asserts the
stored `koX`/`koY` are the centre, not the anchor; a second test keeps the bodyless
fallback covered. The "still stored and placed" Rails test now also asserts the served
`position.px`/`py`, not just the stored `koRoom`.

### m4 (old dev saves offset): accepted, cosmetic

A KO stored before the R1 body-centre capture holds `koX`/`koY` in the sprite-anchor
frame; first-fall-wins never rewrites it, so such a save renders a KO'd NPC shifted by
the anchor-to-centre offset. These are dev-only saves, so no migration is warranted.
Recorded as a known cosmetic effect, lowest severity.
