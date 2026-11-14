# Office life sims showcase: build log

One section per slice: commits, what was built, review rounds, proof games and screenshots.
Engine and server changes are listed together at the end, because each one is an approval item for
the owner even where the plan names it.

## SIMS-1: test_needs_attack (attack and knockout probe)

Commits 782381513, e93a7a70e, d01a0b218, fa140496e (build), probe rewrite + `ava_pc` fix (earlier
session), then round-1 review fixes (earlier session): mugs moved off Ben's row, a real `office_lockpick`
added, probe reworked to be deterministic and to poll for the right state before acting (real punch
path for (a), walking/using state for (d)/(f)/(c), real close for (i)/(i2)/(h2), reload-after-print
and KO-in-delay beats, kitchen-load and `completing` reporting), node-test pin, doc corrections.

Round-2 review fixes (this session): Fran and Gil moved from `(6,6)`/`(7,6)` to `(6,8)`/`(7,8)` so
Ben's cross-room cooler route is clear and beats (c)/(d) reach phase `using` (the earlier "unreachable
cooler corner / E8" was the E-carry fault, Ben pinched by the two seated residents); beat (f)
reordered (walk the player to the drawer first, set Dee's caffeine after, poll at 120 ms) so it passes
in fresh games; (c) tightened to hard `phase === 'using'`, (d) recalls from the cooler, the probe
parks the player off the office door for the cross-room Ben beats; (a) listens for `npc_attacked:ava`
on the dispatcher; (g) requires `blocked === true`; (b)/(c) reload the kitchen before counting
takeables; an `i2r` recovery beat added (a second conversation after the i2-lost page reprints); Dee's
catch line reworded ("try to pick it", the pick is stopped before the cabinet opens). Owner items
re-cited: E-carry widened to seated residents in any room, E-reload-mugs's cause moved to the client
`dropHeld`, and the KO need bubble added as a fourth. No engine or server change.

Status: **live proof re-run on round-1 fixes**, a fresh game per beat (a 4183, b 4184, c 4208,
d 4211, e 4221, f 4212, g 4214, h 4222, h2 4215, i 4217, i2 4220), server keys dumped from
`player_state` (see the README live-proof table). `test/js/npc-needs.test.mjs` and
`test/js/npc-needs-attack-scenario.test.mjs` pass; validator 0 errors, 4 intended warnings
(`--skip-ink --no-graph`; 5 with ink, the extra being the dialogue lint). The `completeTask` question
stays settled (a probe timing artifact, not an engine fault).

Four engine/server faults recorded (not fixed — owner items, see the table below and
`scenarios/test_needs_attack/README.md`): **E-carry** (a needs move re-paths through a seated NPC's
immovable body and the stuck watch does not route round it; hits Ava against seated Ben in the office
and Ben's cooler errand against seated Fran/Gil in the kitchen, not a `_moveForPhase` 3110
short-circuit); **E-reload-mugs** (an aborted carry's world object is rebuilt on its authored tile
after a reload because the client `dropHeld` records no removal); **E-reload-ko-pos** (a KO'd NPC that
fell outside its scenario room is restored at its spawn while its drop stays where it fell); and the
**KO need bubble** (a knocked-out needs NPC still shows its thought bubble). The OLMP in-room fallback
applies to KO-able needs NPCs until E-reload-ko-pos is fixed.

## Engine and server changes (every slice)

| Slice | File | Function | Change | Why | Branch |
|---|---|---|---|---|---|
| SIMS-1 | none applied | | | | |

### SIMS-1 owner items (engine/server faults, not fixed here)

Raised with file:line for the owner. No edit applied; the probe measures each.

| Item | File:line | What | Owner fix |
|---|---|---|---|
| E-carry | `public/break_escape/js/systems/npc-behavior.js` `_checkPathStuck` (~1305), `_recoverFromStuck` (~1348); surfaces as the timeout in `npc-needs.js:3149` → `_failJob` 3490 | A needs move re-paths through a seated NPC's immovable body/chair (not in the walk grid); stuck recovery re-paths to the same cells and never routes round the body. It is wider than one room: besides Ava against seated Ben in the office, it stopped Ben's cross-room cooler errand when Fran and Gil sat in his path (beat c, game 4231: he wedges at ~(6,4.5) in the pinch between the east wall and the two residents, not an unreachable cooler corner). Mission-local sidesteps: mugs moved off Ben's row; Fran/Gil moved to `(6,8)`/`(7,8)` so (c)/(d) reach `using`. | Route stuck recovery round NPC bodies / add seated bodies to the grid. |
| E-reload-mugs | Cause: `public/break_escape/js/systems/npc-needs.js:5124-5140` (`world.dropHeld`, with `pickUp` at `:5094`); the rebuild is `app/models/break_escape/game.rb:2108-2111` (`apply_room_state_changes!`) | A world object an NPC was carrying when the carry **aborts** (a KO or any mid-carry block) is rebuilt on its authored tile after a reload. `dropHeld` moves the sprite client-side only and never records a removal, unlike `consumeHeld` (`:5115-5123`) on delivery. So only a delivered carry writes `objects_removed` (game 4208); any aborted carry (KO beat b game 4184, attack beat a game 4183) writes none, and the server correctly rebuilds the authored object. Not lost, not duplicated. | Record the pickup / drop refusal as `objects_removed` in `dropHeld` if "gone" is wanted after an aborted carry. |
| E-reload-ko-pos | `app/models/break_escape/game.rb:1176-1177` and `:974` (save), `:2145-2151` (restore) | A KO saves only `isKO`/`currentHP`, keyed to the NPC's scenario room, with no position; on reload the body is restored at its authored spawn while its drop stays where it fell (an `objects_added` record at `:2108`). A cross-room KO leaves body and item in different rooms. | Persist the KO position and the room the NPC fell in. |
| KO need bubble | `public/break_escape/js/systems/npc-action-icons.js` `thoughtBubble` `:218-222`, drawn from `update` `:563` | A knocked-out NPC still shows its pressing-need thought bubble: `thoughtBubble` checks `avoiding`/pressing/parked but not `isKO` or `blocked`, so a felled needs NPC keeps a need bubble over its body (`s1-fix-r1/c-c-down-4208.png`). | Guard `thoughtBubble` on `isKO`/`blocked`. |

## Prototypes not merged

E7, E8 and E9 (missions plan section 9) are approval items. Any prototype lives on its own branch
and is listed here with its tests and proof; nothing here is on `build/ol-sims`.

## Merges of main

- 2026-11-14: main 9e23e384b merged into build/ol-sims as f8e23f7a2, and on into build/ol-sims-2
  (69aa3c8ae). No conflicts. Main brought held barks and HUD lanes (`npc-barks.js`, `ui/hud-lanes.js`,
  `hud.js`, `npc-barks.css`); none of it touches `npc-needs.js` or `npc-behavior.js`, and
  npc-manager.js gained 2 lines. Full `bin/test-js` on build/ol-sims-2 after the merge: 648 files
  pass, 0 fail. Needs chatter still reaches the screen through the bark system, so SIMS-4's
  staff-room proof watches for chatter being held or laned by the new HUD code.
- 2026-11-14: main cb6d7feb4 merged into build/ol-sims as 1bf6ad046. No conflicts. Main brought the
  sync-stale-ring work (`games_controller.rb`, `sync_ring.rb`, `state-sync.js`, capture/merge tests);
  none of it touches `npc-needs.js`, `npc-behavior.js` or `npc-action-icons.js`. Slice node tests
  `npc-needs.test.mjs` and `npc-needs-attack-scenario.test.mjs` pass after the merge.
