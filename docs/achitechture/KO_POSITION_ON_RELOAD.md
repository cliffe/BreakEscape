# KO position on reload

A knocked-out NPC should stay where it fell after a page reload, including when
it was knocked out in a room other than its home (scenario) room. Before this
change a KO saved only `isKO` and `currentHP`, so the NPC came back lying at its
spawn point, and a needs NPC knocked out on an errand reappeared KO in its home
room.

User decision (verbatim): "D5 KO position on reload: a. Save the KO position and
room as one small delta".

## Design (5 lines)

1. When an NPC falls, the client records the room it fell in and its `x`,`y` once,
   onto the same per-NPC hostility entry that already carries `ko` and `facing`.
2. That entry rides the existing `npcHostility` ring-keyed delta sync: one small
   delta, keyed per NPC, merged server-side, never a growing re-sent blob.
3. The server validates `koRoom`/`koX`/`koY` as untrusted input and stores only
   those three plain fields, first fall wins (like `facing`).
4. On a room fetch the server places the NPC at `koX`,`koY`: in its home room for a
   same-room KO, and for a cross-room KO it removes the NPC from its home room and
   injects it into `koRoom` at that spot.
5. Position only exists while `ko` is true; a revive/clear drops `ko`, so the
   position stops being written and the overlay stops.

## Data shape

Stored under `player_state['npcHostility'][npc_id]` beside the existing fields:

```
{ "hostile": true, "ko": true, "facing": "down-left",
  "koRoom": "break_room", "koX": 412, "koY": 268 }
```

`koRoom` is a scenario room id, `koX`/`koY` are the sprite's world pixel position
rounded to integers, written once at the moment of the KO.

## How it travels (the delta)

`npcHostility` is one of `RING_KEYED_SECTIONS` in the games controller, so the
sync ring records a per-NPC claim key and the server merges only the entries that
changed. The client's `exportHostility()` returns the per-NPC map; adding three
small fields to one entry does not make `player_state` grow per sync, because the
section is keyed and merged, bounded by the NPC count, and the position is written
exactly once (first fall wins both client and server). Repeated syncs carrying the
same entry are idempotent: `merge_npc_hostility!` rebuilds each record from known
keys only, so the stored size is stable. (Covered by a Rails test that syncs the
same KO twice and asserts `npcHostility` is unchanged.)

## Server-side validation (untrusted client input)

In `Game#merge_npc_hostility!`, only when `ko` is true and only these fields:

- `koRoom`: must be a `String` that is a real room id in this game's scenario
  (`scenario_room_ids`, read from `scenario_data` when loaded, else a narrow jsonb
  query like the existing `ko_claimable_room_npc_ids`). A wrong/unknown room is
  dropped. This also rejects another game's room id.
- `koX`, `koY`: must be finite `Numeric` within `-MAX_KO_COORD..MAX_KO_COORD`
  (+/-100000). Rejects strings, `NaN`/`Infinity` and huge numbers of either sign.
  The bound is symmetric because world coordinates are legitimately negative for
  rooms laid out left of or above the origin (test_needs_sims' kitchen is at
  x <= -260); an earlier `0` lower bound silently dropped those cross-room KOs.
- Extra keys: the record is built field by field from known keys, so any extra key
  the client sends is never stored.
- Another game's NPC: already gated by `known = scenario_npc_ids` and by
  `koRoom` having to be a room of this scenario.
- First fall wins: a stored valid `koRoom`/`koX`/`koY` is kept over a later
  incoming one (same rule as `facing`).

If any field is invalid the position is dropped but the KO itself is kept (an NPC
still comes back KO, just at its served spawn point, never worse than before).

## Restore on load

The server does the placement when a room is fetched (`filtered_room_data` ->
`apply_room_state_changes!` -> new `apply_ko_positions!`), so the client needs no
new position code; the NPC simply registers at the served `x`,`y`:

- Same-room KO (`koRoom == room_id`, NPC native to this room): set the NPC's
  `x`,`y` to `koX`,`koY`.
- Cross-room KO: when rendering the NPC's home room, drop the NPC (it is not here);
  when rendering `koRoom`, inject a copy of the NPC's scenario def at `koX`,`koY`
  with `isKO: true`, `currentHP: 0`.

Because rooms load lazily (`npc-lazy-loader.js` registers NPCs when their room
loads) and `restoreHostility` runs before any room loads, the per-NPC KO/facing is
already in place when the sprite is made, so the injected NPC shows its KO pose and
stays down. The needs system treats a KO'd NPC as unavailable, so it is not walked
home.

## Revive / KO cleared

The server never un-KOs (`ko` is sticky in `merge_npc_hostility!`), matching the
existing rule "once down, an NPC stays down". If a future path clears KO, the
client stops sending `ko: true`, the position fields are no longer written into the
record, and `apply_ko_positions!` ignores an entry whose `ko` is not true, so the
NPC returns to normal placement. koImmune NPCs never record a KO or a position.

## Files touched

- `public/break_escape/js/systems/npc-hostile.js` — capture `koRoom`/`koX`/`koY`
  at KO, carry them in `recordHostility`/`restoreHostility`.
- `app/models/break_escape/game.rb` — `merge_npc_hostility!` validation,
  `scenario_room_ids`, `apply_ko_positions!`, call in `apply_room_state_changes!`.

## Test results

- Rails: `test/controllers/break_escape/reload_persistence_test.rb` 76 runs, 291
  assertions, 0 failures (5 D5 tests: same-room placement, cross-room
  placement + not-at-home, hostile-input validation, first-fall-wins + no growth,
  negative-coordinate acceptance + huge-negative rejection);
  `forged_ko_drop_test.rb` + `game_test.rb` 109 runs, 480 assertions, 0 failures.
- JS: `node --test test/js/npc-hostility-persistence.test.mjs` 12 tests pass (4 new
  D5 tests); full `bin/test-js` 671 files passed, 0 failed.
- rubocop: `bin/rubocop app/models/break_escape/game.rb <test>` 0 offences.

## Live proof

Keyless server on 127.0.0.1:3095 from the worktree, headless Chromium at
setFPS(20), a real reload (navigate to about:blank so pagehide flushes, then back).
Games made in-run with `new-game.rb test_needs_sims`. The cross-room KO is set up
by moving marek's sprite into the `kitchen` through the test bridge and knocking
him out there (the needs errand to the kitchen does not fire headless); the kitchen
sits at world x <= -260, so this is also the case that exercised the negative-coord
fix above. The authoritative "where is the NPC served" check reads the room-fetch
endpoint directly (`GET .../room/<id>`).

### The 30 px question (measurement, not a bug)

The earlier run read `npcPos('amara')` as (224,124) at KO and (194,61) after the
reload and asked whether the 30 px x shift was real. It is a measuring artefact.
`world.npcPos` returns `sprite.body.center`, while the KO records `sprite.x`,
`sprite.y`. Measuring like with like (amara, game 5348, already KO'd and reloaded):

| quantity                     | before reload | after reload |
| ---------------------------- | ------------- | ------------ |
| `sprite.x`, `sprite.y`       | 224, 65       | 224, 65      |
| `sprite.body.center` (npcPos)| 194, 61       | 194, 61      |
| stored `koX`, `koY`          | 224, 69       | 224, 69      |

The sprite's own x,y are identical across the reload (pixel-identical in x, within
4 px in y from the death-pose origin), so the body lands in the same place on
screen. The 30 px is `sprite.x` (224) minus `body.center.x` (194), a constant body
offset, present before and after; it is not a placement change.

### Live proof table

| run | game | case       | stored koRoom/koX/koY | served after reload (room/x/y, isKO) | not at home | sent once |
| --- | ---- | ---------- | --------------------- | ------------------------------------ | ----------- | --------- |
| 1   | 5354 | same-room  | office / 224 / 69     | office / 224 / 69, isKO              | n/a         | yes       |
| 1   | 5354 | cross-room | kitchen / -238 / 132  | kitchen / -238 / 132, isKO          | office: absent | yes    |
| 2   | 5355 | same-room  | office / 224 / 69     | office / 224 / 69, isKO              | n/a         | yes       |
| 2   | 5355 | cross-room | kitchen / -262 / 127  | kitchen / -262 / 127, isKO          | office: absent | yes    |

"Sent once": the `sync_state` body carrying `koRoom` is seen exactly once per NPC;
syncs after the KO and after the reload carry no `amara`/`marek` entry (keyed delta).
Client render confirmed too: after the reload the kitchen loads with marek in its
`npcSprites`, visible and KO (games 5354 and 5355), and the office serves and renders
only amara, tom, grace, sanjay (marek dropped from his home room).

Pre-fix baseline: game 5348, cross-room, the server rejected the negative koX and
marek came back in the office (his home) at his spawn, not in the kitchen. The fix
in commit `f4149bfc3` (symmetric coordinate bound) is what makes runs 1 and 2 pass.

## R1 fixes (code review outcomes)

The five R1 findings are fixed in commit efd1cba7e; see
`KO_POSITION_REVIEW_R1.md` "Outcomes" for one line each. In short:

- M1: `ko_position_from` now also requires `koRoom` in `player_state['unlockedRooms']`
  (`ko_room_reachable?`), so a forged KO cannot relocate a met NPC into a
  never-entered room. The position is dropped, the KO kept.
- m1 and the y-offset share one root cause and one fix. The client used to store the
  sprite anchor (`sprite.x`/`sprite.y`) as `koX`/`koY`, but the server restores an
  NPC's `x,y` as its body centre: npc-sprites.js:118-126 explicitly shifts the sprite
  so `body.center` lands on the stored `x,y`, and `roomIdAtFeet` is documented to take
  the body centre. So the former capture was in the wrong frame, off by each NPC's
  anchor-to-centre offset (about 30 px for marek, 4 px for amara: the "30 px question"
  the earlier note waved away as a pure measuring artefact, which it is not for a
  live-fall-vs-reload comparison). The capture now reads `sprite.body.center`, matching
  both the server restore frame and the drop path, so the body lands where it fell.
- m2, m3, m4: see the review doc.

### Measurement caveat (why npcPos misleads for a reloaded KO)

A reloaded KO'd NPC has its physics body disabled (npc-sprites.js:195), so
`body.center` (what `world.npcPos` returns) goes stale and no longer tracks the
rendered sprite. The authoritative signals for a reloaded KO are the served `koX`/`koY`
and the sprite anchor `sprite.x`/`sprite.y`, plus the visual crop, not `npcPos`.

### Live re-proof status (R1)

- Same-room (amara, game 5379): valid. KO captured at body centre (224, 96), KO kept,
  position stored, served back in the office, isKO. bin/test-js (671 files), the Rails
  reload_persistence + forged_ko_drop suites (90 runs, 380 assertions) and rubocop all
  pass on efd1cba7e.
- Cross-room crop: OUTSTANDING. The committed harness drives marek to the kitchen via
  the needs system, which did not fire headless in this run (marek stayed in the office,
  game 5379), and a same-room crop retry was blocked by the title-screen minigame.
  The body-centre fix is correct by the npc-sprites.js:118-126 contract and is covered
  by the Rails cross-room injection test, but a before/after kitchen crop of marek
  should still be captured to close the visual proof. Run a crop script from inside the
  worktree (playwright resolves from the worktree node_modules, not the scratchpad), and
  force marek into the kitchen by a reliable route rather than the flaky needs walk.
