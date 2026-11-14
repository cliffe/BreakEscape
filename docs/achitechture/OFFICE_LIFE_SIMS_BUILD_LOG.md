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

## SIMS-2: an arrival counts only where the NPC is (OLMP E6)

Branch `build/ol-sims-2` (from `build/ol-sims` a734d5f57). Commit 11b563d51 (engine + node tests),
then the live-proof tool and docs.

Fault reproduced on the build as it stands. Thirty natural runs did not repeat the baseline
(game 3537) arrival by chance, so the stubbed short path is the reproduction, as the plan allows:
Grace's `_planMovePath` was stubbed through the test bridge to end ~35% along her office->lounge
route, and with the SIMS-2 distance check neutralised in-browser (the old "any arrival counts"
behaviour) the build enters `using lounge_sofa` 164 px from the sofa cell, out in the **office**
(`64 arrival  334`, `65 using lounge_sofa`; game 4178, `stub-legacy-4178.png`). With the real fix
and the same stubbed short path, the arrival is logged `arrival_far` and Grace does not use the
sofa there (`79 arrival 261`, `80 arrival_far lounge_sofa`; game 4178, `stub-fixed-4178.png`).

E-carry (SIMS-1's recorded fault): **different cause, left.** SIMS-1 recorded Ava's cross-room
carry failing in `goto_item`/`_failJob('timeout')` — she takes the job, never leaves her post and
times out after 20 s with no arrival ever firing. SIMS-2's fault is the opposite: an arrival that
*does* fire, at the wrong place, and is counted. The SIMS-2 fix guards arrivals that fire; it
cannot make a never-firing arrival fire, so it does not address E-carry. E-carry is a cross-room
path-planning failure (the goto-item move to the kitchen plans no usable path, so the behaviour
layer emits no `npc_arrived` and `_advanceJob`'s `goto_item` branch, npc-needs.js ~3225, hits its
`job.deadline` and `_failJob('timeout')`); left for its own slice, as the plan directs.

## Engine and server changes (every slice)

| Slice | File | Function | Change | Why | Branch |
|---|---|---|---|---|---|
| SIMS-1 | none | | | | |
| SIMS-2 | public/break_escape/js/systems/npc-needs.js | `onArrived` | now takes the arrival payload; logs `arrival {pathLeft,dist}` for a real behaviour-layer arrival; stores `{x,y,moveId,pathLeft}` in the `_arrivals` Map | step 1 diagnostic + carry the position/id the tick needs | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | `_phaseDest`, `_nextMoveId`, `_acceptArrival` (new) | distance-first + move-id check; a far arrival re-issues once then fails the job (returning re-issues once, never fails); synthetic own-post/home arrivals bypass | the fix: an arrival counts only within 48 px of the move's cell, and only for the current move | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | `_tickNpc` | consumes the stored arrival through `_acceptArrival` instead of a boolean Set membership | route every arrival through the distance/id guard | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | `_moveForPhase`, `_goHome` | stamp each issued move with a `moveId` (own-post/home shortcuts store a synthetic arrival) | give every move an id the arrival echoes | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | world `moveTo`, `installNpcNeeds` npc_arrived listener | pass `moveId` through; pass the whole payload to `onArrived` | wire the id and position end to end | build/ol-sims-2 |
| SIMS-2 | public/break_escape/js/systems/npc-behavior.js | `goToAndStay`, `_triggerGoToStayArrival`, `cancelMove` | store `opts.moveId`; add `moveId` and `pathLeft` to the `npc_arrived` payload; clear on cancel | the behaviour layer echoes the move id and the steps the path had left | build/ol-sims-2 |
| SIMS-2 | npc-behavior.js | `class NPCBehavior` | exported | reachable by the arrival unit test; the manager stays the only game constructor | build/ol-sims-2 |

## Prototypes not merged

E7, E8 and E9 (missions plan section 9) are approval items. Any prototype lives on its own branch
and is listed here with its tests and proof; nothing here is on `build/ol-sims`.
