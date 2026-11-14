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

Status: **live proof re-run on round-1 fixes**, a fresh game per beat (a 4183, b 4184, c 4208,
d 4211, e 4221, f 4212, g 4214, h 4222, h2 4215, i 4217, i2 4220), server keys dumped from
`player_state` (see the README live-proof table). `test/js/npc-needs.test.mjs` and
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
| E-reload-mugs | `app/models/break_escape/game.rb:2108-2111` (`apply_room_state_changes!`) | A world object an NPC was carrying when KO'd is rebuilt on its authored tile after a reload. Removal is recorded only on delivery (completed carry writes `objects_removed`, game 4208); a KO mid-carry never delivers (game 4184: office `objects_removed` empty, mugs back). Not lost, not duplicated. | Persist the pickup / drop refusal as `objects_removed` if "gone" is wanted after a KO mid-carry. |
| E-reload-ko-pos | `app/models/break_escape/game.rb:1176-1177` and `:974` (save), `:2145-2151` (restore) | A KO saves only `isKO`/`currentHP`, keyed to the NPC's scenario room, with no position; on reload the body is restored at its authored spawn while its drop stays where it fell (an `objects_added` record at `:2108`). A cross-room KO leaves body and item in different rooms. | Persist the KO position and the room the NPC fell in. |

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
