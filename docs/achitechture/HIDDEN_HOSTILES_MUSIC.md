# Hidden hostiles and the fight music

## Problem

`anyHostilesAlive` (`public/break_escape/js/music/scenario-music-events.js`) decides when the `all_hostiles_ko` music event may fire. It counted every hostile, conscious NPC, including ones a scenario had hidden with a `setVisible: false` mapping. A hidden NPC cannot attack (`npc-behavior.js`), and hostility survives a reload, so a mission that hides a conscious hostile (m03 will hide its day staff at the night turn) kept the fight music going for good.

## Rule chosen

Skip an NPC only when its recorded `setVisible` state is `false`.

- `NPCManager._npcVisibility` (npcId to bool) is written by `recordNpcVisibility`, which `setNPCVisible` calls for every mapping. It is saved by `exportNpcVisibility` (state-sync `npcVisibility`) and put back by `restoreNpcVisibility` on load, so the record survives a reload.
- New `NPCManager.isHiddenByMapping(npcId)` returns `_npcVisibility.get(npcId) === false`.
- `anyHostilesAlive` calls it and skips those NPCs. No new import, so no harness copy list changes.

Why not skip every hidden NPC: an NPC that starts hidden (`behavior.initiallyHidden`) has no record, so it keeps counting, exactly as on main. A reveal records `true`, so it counts as before; hiding it again records `false`.

## m10 check

m10 hostiles are `initiallyHidden`. Only `reinforcement_a` and `reinforcement_b` have `startHostile: true`; the rest (Arakawa, the minders, Vector, Phantom, Nightshade) turn hostile only when attacked or made hostile in play.

- The two reinforcements start hidden with no record, so they still count until revealed (gallery, after Victoria is trusted). Unchanged.
- The only m10 `all_hostiles_ko` entry is `spy-action` while `!hax_jammed && !outer_lock_open`. The behaviour that changes is intended: a hostile that a mapping hid again (for example Arakawa at `breach_open`) no longer holds that entry back.

## Tests

`test/js/hostiles-hidden-music.test.mjs` (real `scenario-music-events.js` and `NPCManager` methods in jsdom). Against the old source, two of the four fail:

- a hostile hidden by `setVisible: false` no longer holds the fight music (fails on old code)
- the hidden state after export, restore on a fresh manager (reload) (fails on old code)
- a hostile revealed again counts again (passes on both, guards the new rule)
- a hostile that starts hidden with no record still counts (passes on both, guards the old behaviour)

## Live proof (keyless server, port 3093, headless, setFPS(20))

Scenario `scenarios/test_hidden_hostiles` (validated, 0 errors) and `tools/playtest/hidden-hostiles-music-proof.mjs`. Two guards start hostile, music `threat`. Trying the vault door (real door path) sets `night`, whose own mapping hides the day guard. `debugKO` (combat not played) knocks out the other guard.

Fresh game 6332:

| Step | Playlist | Day guard |
| --- | --- | --- |
| Start | threat | hostile, visible |
| After the vault door attempt (night true) | threat | hostile, conscious, hidden, `hiddenByMapping` true |
| After the other guard is KO'd | noir (fight ended) | still hostile, conscious, hidden |
| After a reload | | still `hiddenByMapping` true, sprite hidden |

Control, game 6331 (before the door attempt, which the title screen blocked): KO of one guard with the other visible left the playlist on `threat`.

m10, fresh game 6333 (`tools/playtest/m10-opening-music-read.mjs`, read only): opening playlist `noir`, no hostile NPCs, visibility record holds only `nightshade_van` and `kowalczyk_post`, so the opening is untouched by the change. The first hidden-hostile reveal (the reinforcements in the gallery) was not reached live: it needs the earlier stages of the mission played through real paths, which I did not drive. It rests on the unit tests and the analysis above.
