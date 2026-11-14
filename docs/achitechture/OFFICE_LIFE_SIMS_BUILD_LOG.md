# Office life sims showcase: build log

One section per slice: commits, what was built, review rounds, proof games and screenshots.
Engine and server changes are listed together at the end, because each one is an approval item for
the owner even where the plan names it.

## SIMS-1: test_needs_attack (attack and knockout probe)

Commits 782381513, e93a7a70e, d01a0b218, fa140496e (build), then this session: probe rewrite (load
the kitchen for cross-room needs, poll for mid-carry/mid-walk, real Eli conversation, real note
reads), one scenario fix (`ava_pc` no longer accepts `dirty_mugs`). No engine change.

Status: **live proof complete.** All ten beats pass (a 4145, b 4144, c 4120, d 4131, e 4126, f 4121,
g 4122, h 4123, i 4128, i2 4124) on a worktree keyless server on :3093. KO drops verified against the
server's `room_states.<room>.objects_added`. `test/js/npc-needs.test.mjs` and
`test/js/npc-needs-attack-scenario.test.mjs` pass; validator 0 errors, 4 intended warnings.

One engine fault recorded (not fixed — owner item): **E-carry**, intermittent cross-room carry —
Ava's carry to the kitchen tray fails on some seeds in `goto_item`/`_failJob` (npc-needs.js:3490;
`_moveForPhase` 3076-3112, own-post short-circuit at 3110), runs cleanly on others. The OLMP
in-room fallback applies until it is fixed. The `completeTask` question is settled as a probe timing
artifact, not an engine fault (details in `scenarios/test_needs_attack/README.md`).

## Engine and server changes (every slice)

| Slice | File | Function | Change | Why | Branch |
|---|---|---|---|---|---|
| SIMS-1 | none | | | | |

## Prototypes not merged

E7, E8 and E9 (missions plan section 9) are approval items. Any prototype lives on its own branch
and is listed here with its tests and proof; nothing here is on `build/ol-sims`.
