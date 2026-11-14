# Office life sims showcase: build log

One section per slice: commits, what was built, review rounds, proof games and screenshots.
Engine and server changes are listed together at the end, because each one is an approval item for
the owner even where the plan names it.

## SIMS-1: test_needs_attack (attack and knockout probe)

Commits 782381513, e93a7a70e, d01a0b218, fa140496e (build), probe rewrite + `ava_pc` fix (earlier
session), then round-1 review fixes (this session): mugs moved off Ben's row, a real `office_lockpick`
added, probe reworked to be deterministic and to poll for the right state before acting (real punch
path for (a), walking/using state for (d)/(f)/(c), real close for (i)/(i2)/(h2), reload-after-print
and KO-in-delay beats, kitchen-load and `completing` reporting), node-test pin, doc corrections. No
engine or server change.

Status: **live proof re-run on round-1 fixes** (fresh game per beat — see the README live-proof
table for ids and screenshots). `test/js/npc-needs.test.mjs` and
`test/js/npc-needs-attack-scenario.test.mjs` pass; validator 0 errors, 4 intended warnings
(`--skip-ink --no-graph`; 5 with ink, the extra being the dialogue lint). The `completeTask` question
stays settled (a probe timing artifact, not an engine fault).

Three engine/server faults recorded (not fixed — owner items, see the table below and
`scenarios/test_needs_attack/README.md`): **E-carry** (the original "intermittent cross-room carry /
blame `_moveForPhase` 3110" was wrong — it is a path collision with seated Ben inside the office,
timing out in `_advanceJob`/`_failJob`; the stuck watch does not route round NPC bodies); **E-reload-mugs**
(a carried world object is rebuilt on its authored tile after a reload); **E-reload-ko-pos** (a KO'd
NPC that fell outside its scenario room is restored at its spawn while its drop stays where it fell).
The OLMP in-room fallback applies to KO-able needs NPCs until E-reload-ko-pos is fixed.

## Engine and server changes (every slice)

| Slice | File | Function | Change | Why | Branch |
|---|---|---|---|---|---|
| SIMS-1 | none applied | | | | |

### SIMS-1 owner items (engine/server faults, not fixed here)

Raised with file:line for the owner. No edit applied; the probe measures each.

| Item | File:line | What | Owner fix |
|---|---|---|---|
| E-carry | `public/break_escape/js/systems/npc-behavior.js` `_checkPathStuck`/`_recoverFromStuck` (~1305-1335); surfaces as the timeout in `npc-needs.js:3149` → `_failJob` 3490 | A needs move re-paths through a seated NPC's immovable body/chair (not in the walk grid); stuck recovery re-paths to the same cells and never routes round the body. The probe sidesteps it by moving the mugs off Ben's row; not a `_moveForPhase` 3110 short-circuit (that only fires for a use/visit of the own post, never a carry). | Route stuck recovery round NPC bodies / add seated bodies to the grid. |
| E-reload-mugs | `app/models/break_escape/game.rb:2108-2111` (`apply_room_state_changes!`) | A world object an NPC picked up for a needs carry is rebuilt on its authored tile after a reload, because the carry records no `objects_removed`. Not lost, not duplicated. | Persist a needs carry pickup as `objects_removed` if "gone" is wanted. |
| E-reload-ko-pos | `app/models/break_escape/game.rb:1176-1177` and `:974` (save), `:2145-2151` (restore) | A KO saves only `isKO`/`currentHP`, keyed to the NPC's scenario room, with no position; on reload the body is restored at its authored spawn while its drop stays where it fell (an `objects_added` record at `:2108`). A cross-room KO leaves body and item in different rooms. | Persist the KO position and the room the NPC fell in. |

## Prototypes not merged

E7, E8 and E9 (missions plan section 9) are approval items. Any prototype lives on its own branch
and is listed here with its tests and proof; nothing here is on `build/ol-sims`.
