R3: 0 B / 0 M / 2 m

# KO position on reload, review R3 (delta 60ffaa6ca..9568a038a)

Scope: the harness (c7f2c86b9), the served `position` form (847ff0a8e), the JS body-centre
test stubs (6fc49b125) and the doc record (9568a038a). Read only; no servers started.

Verdict: the headline fix is sound. The client reads `position.px/py` and nothing that
runs for a KO'd NPC needs `position.x/y`. Two minors, both about proof rather than
behaviour.

## 1. Client readers of `npc.position` with px/py and no x/y: all safe

Grep of public/break_escape/js for `npc.position`, `.position.x`, `position?.x`,
`position.px`:

- `npc-sprites.js:304-325` `calculateNPCWorldPosition`: the one placement reader. `px/py`
  is checked first and returned as absolute world pixels; the tile branch is only for
  `x/y`. The body-centre shift at `npc-sprites.js:118-126` then lands the body centre on
  the point, which is the frame `koX/koY` was captured in (`npc-hostile.js:326-340`).
- `npc-los.js:212` and `npc-sight-occlusion.js:394`: the `position.x` branch is the last
  fallback, after the live body centre (sight-occlusion) or raw `npc.x/y` (los). A KO'd
  NPC never sights, and if it fell through it gets `null`/`undefined`, which both callers
  already handle.
- `person-chat-background.js:106` (`npcShareAcrossRoom`): uses `position.x * tile` only
  when there is no active sprite in the room. A KO'd sprite stays active, so the first
  branch applies. With px/py it would return `undefined`, which the function documents.
- Needs homes: `npc-behavior.js:430-435` derives `homePosition` from the sprite and body
  offsets, not from `npc.position`. `npc-needs.js:3950` keeps a provisional spot, not the
  position field. Not affected.
- NPC lazy loader and `npc-manager.js`: no read of `npc.position` beyond registration;
  `npc-manager.js:1759` reads `behavior.homePosition`.
- Ink and event code: no `position` read on an NPC object (grep of the remaining hits
  are `room.position`, `roomData.position`, `thread.position` for mail).
- Minimap or overlay: no NPC `position` reader found.
- Revive: there is no JS path that clears `isKO` (grep for `isKO = false`, `ko = false`,
  revive: none), and the server keeps `ko` sticky. If one is added, a revived NPC walks
  from a sprite whose `homePosition` is rebuilt from the sprite, so px/py is harmless.

## 2. Overwriting the whole `position` hash

Scenario NPC `position` objects carry only `x`/`y` or `px`/`py` (the extra-key positions
in the scenarios, such as `elevation`, belong to room objects, not NPCs). Server code
that touches `['position']` (game.rb:1004, 1023, 5815) is items and mail threads, not
NPCs. Nothing relies on a facing or room-relative flag in an NPC position. Safe.

## 3. `ko_room_reachable?` and `in_npc_route_room?` against forged input

game.rb:5167-5178, 152-155. `npc_route_rooms` reads `player_state['npcRouteRooms']`,
which the model documents as server-written and "never part of the client sync payload"
(game.rb:143-146). Grep shows `npcRouteRooms` is written only in game.rb (lines 160,
405, 547) and mentioned in games_controller.rb comments; it is not a sync_state section.
A client cannot add a room to it. A route room is a room GET /room already serves, so
accepting a KO position there reveals nothing new. The test at
reload_persistence_test.rb (route-room case) seeds the list server-side, which matches
reality. Sound.

## 4. Do the tests catch the bug returning

- Rails: the three assertions are `assert_equal({ 'px' => .., 'py' => .. }, npc['position'])`.
  If the server went back to top-level `x/y`, `position` would be the scenario tile hash
  and all three fail. Good. The new "entered room is reachable" test now also checks the
  served spot, closing the R2 name-versus-assertion gap.
- JS: the body-centre test is real. It supplies a body centre (382.6, 238.4) offset from
  the anchor (412.4, 268.6) and expects 383/238, so reverting to `sprite.x/y` fails it; a
  second test keeps the bodyless fallback. The stubs (`setVelocity`, `checkCollision`)
  match what `npc-hostile.js:368-370` calls.

## Findings

### m1. The 5 px y gap for Amara is explained by something the code does not do

Docs: KO_POSITION_ON_RELOAD.md ("the live death animation lowers her ~5 px further").
Code: `npc-sprites.js:210-220` and `npc-hostile.js` (the death path) change the sprite
origin, "texture down without changing sprite.y" (the comment at npc-hostile.js ~35-46 of
the death function). An animation or origin shift does not change `sprite.y`, and the KO
sets velocity to 0 (`npc-hostile.js:370`). Marek (cross-room) shows 0 px, so the capture
and restore frames agree. Amara is a needs NPC that the harness first moves off her desk;
a seated or needs-driven nudge in the 2.5 s after the KO is at least as likely as the
death pose. The 5 px is small and the placement is faithful to the stored `koY`
(koY - sprite.y = 31 after reload), so it is acceptable, but the stated cause is a guess.
Failure scenario: the doc is cited later for a real offset bug and the guess hides it.
Fix: have `tools/playtest/ko-pos-proof.mjs` read `sprite.y` and `body.center.y`
immediately after `debugKO` as well as at +2.5 s, then state the cause from the numbers
(or say it is unexplained and bounded at 5 px).

### m2. No client-side unit test for the px/py contract

The Rails tests pin the served shape and the JS test pins the capture, but nothing in
test/js asserts that `calculateNPCWorldPosition` returns `px/py` as world pixels (grep:
no test file references it). The earlier bug sat exactly in the gap between a server
shape and a client reader, and only the live harness now guards it.
Failure scenario: a later change to the reader (for example preferring tile `x/y`, or
adding a room offset to px) breaks every KO restore while all Rails and JS tests pass.
Fix: add a small node test importing `calculateNPCWorldPosition` that asserts
`{position:{px:-160,py:192}}` returns `{x:-160,y:192}` regardless of roomData, and that
`{x,y}` still offsets by the room origin. Add the module to the harness copy list if it
needs it.

## Outcome checklist

B 0, M 0, m 2. No change needed for merge; m1 and m2 are small follow-ups.

## Outcomes

- m1: documented. KO_POSITION_ON_RELOAD.md now calls the cause of Amara's 5 px y
  difference unverified, and `tools/playtest/ko-pos-proof.mjs` records `sprite.y` and
  `body.center.y` immediately after `debugKO` (`home.atKo`) as well as at +2.5 s. The
  harness has not been re-run.
- m2: fixed. `test/js/npc-world-position.test.mjs` (4 tests) covers `position.px/py` as
  world pixels for any room origin, tile `x/y` offset by the room origin times
  `TILE_SIZE`, and no position returning null.
