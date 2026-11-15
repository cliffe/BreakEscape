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
- `koX`, `koY`: must be finite `Numeric` within `0..MAX_KO_COORD` (100000). Rejects
  strings, `NaN`/`Infinity`, negatives and huge numbers.
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

- Rails: `test/controllers/break_escape/reload_persistence_test.rb` 75 runs, 287
  assertions, 0 failures (4 new D5 tests: same-room placement, cross-room
  placement + not-at-home, hostile-input validation, first-fall-wins + no growth);
  `forged_ko_drop_test.rb` + `game_test.rb` 109 runs, 480 assertions, 0 failures.
- JS: `node --test test/js/npc-hostility-persistence.test.mjs` 12 tests pass (4 new
  D5 tests); full `bin/test-js` 671 files passed, 0 failed.
- rubocop: `bin/rubocop app/models/break_escape/game.rb <test>` 0 offences.

## Live proof

Keyless server on 127.0.0.1:3095 from the worktree, headless Chromium at
setFPS(20), a real reload (navigate to about:blank so pagehide flushes, then back).

- Game 5339 (test_needs_sims):
  - Home-room KO: amara knocked out in the start room `office`; after the reload she
    comes back knocked out at the same x,y. (results below)
  - Cross-room KO: marek driven into the `kitchen` by a need, knocked out there;
    after the reload he comes back KO in the kitchen at that spot and is not also
    standing in his home room `office`. (results below)
  - Network: the sync carrying marek/amara `koRoom` is sent once; later syncs do not
    re-send the entry (keyed delta, `buildChanges`).

(detailed run output pasted below once the proof completes)
