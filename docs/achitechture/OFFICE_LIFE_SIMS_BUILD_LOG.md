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

Status: **round-2 re-runs pass**, a fresh game per touched beat (a 4281, b 4282, c 4270, d 4271,
f 4278/4279/4280 three fresh games, g 4287, i2r 4288); the untouched beats keep round-1 proof
(e 4221, h 4222, h2 4215, i 4217, i2 4220). Beat (c)/(d) now reach phase `using` at the cooler, (f)
passes 3/3, (a) shows `npc_attacked:ava`, (g) proves Fran down (`isKO`/idle), and (i2r) shows the
i2-lost page is recoverable by a second conversation. Server keys dumped from `player_state`.
`test/js/npc-needs.test.mjs` and `test/js/npc-needs-attack-scenario.test.mjs` pass; validator 0
errors, 4 intended warnings (`--skip-ink --no-graph`; 5 with ink, the extra being the dialogue lint).
The `completeTask` question stays settled (a probe timing artifact, not an engine fault).

Four engine/server faults recorded (not fixed — owner items, see the table below and
`scenarios/test_needs_attack/README.md`): **E-carry** (a needs move re-paths through a seated NPC's
immovable body and the stuck watch does not route round it; hits Ava against seated Ben in the office
and Ben's cooler errand against seated Fran/Gil in the kitchen, not a `_moveForPhase` 3110
short-circuit); **E-reload-mugs** (an aborted carry's world object is rebuilt on its authored tile
after a reload because the client `dropHeld` records no removal); **E-reload-ko-pos** (a KO'd NPC that
fell outside its scenario room is restored at its spawn while its drop stays where it fell); and the
**KO need bubble** (a knocked-out needs NPC still shows its thought bubble). The OLMP in-room fallback
applies to KO-able needs NPCs until E-reload-ko-pos is fixed.

## SIMS-2: an arrival counts only where the NPC is (OLMP E6)

Branch `build/ol-sims-2` (from `build/ol-sims` a734d5f57). Commit 11b563d51 (engine + node tests),
then the live-proof tool and docs. Review R1 (design/engine 0B/2M/4m, server 0B/0M/2m) fixes in a
later commit: Design M1 (gate the arrival check to needs-issued moves), m1 (returning logs once per
return), m2 (far guard keyed by phase+cell), m3 (node tests, rewritten capacity-2 test), and the
corrected natural-run live evidence (Grace 16 of 20 real clock, game 4232; Tom's kitchen trips with
a working office-coffee switch-off). The earlier "30 natural runs did not repeat the baseline" claim
is dropped (no saved artefacts for 30 baseline runs).

Fault reproduced on the build as it stands. The baseline (game 3537) arrival did not repeat in
natural play, so the stubbed short path is the reproduction, as the plan allows:
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
| SIMS-1 | none applied | | | | |
| SIMS-2 | public/break_escape/js/systems/npc-needs.js | `onArrived` | now takes the arrival payload; logs `arrival {pathLeft,dist}` for a real behaviour-layer arrival; stores `{x,y,moveId,pathLeft}` in the `_arrivals` Map | step 1 diagnostic + carry the position/id the tick needs | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | `_phaseDest`, `_nextMoveId`, `_acceptArrival` (new) | distance-first + move-id check; a far arrival re-issues once then fails the job (returning re-issues once, never fails); synthetic own-post/home arrivals bypass | the fix: an arrival counts only within 48 px of the move's cell, and only for the current move | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | `_tickNpc` | consumes the stored arrival through `_acceptArrival` instead of a boolean Set membership | route every arrival through the distance/id guard | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | `_moveForPhase`, `_goHome` | stamp each issued move with a `moveId` (own-post/home shortcuts store a synthetic arrival) | give every move an id the arrival echoes | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | world `moveTo`, `installNpcNeeds` npc_arrived listener | pass `moveId` through; pass the whole payload to `onArrived` | wire the id and position end to end | build/ol-sims-2 |
| SIMS-2 | public/break_escape/js/systems/npc-behavior.js | `goToAndStay`, `_triggerGoToStayArrival`, `cancelMove` | store `opts.moveId`; add `moveId` and `pathLeft` to the `npc_arrived` payload; clear on cancel | the behaviour layer echoes the move id and the steps the path had left | build/ol-sims-2 |
| SIMS-2 | npc-behavior.js | `class NPCBehavior` | exported | reachable by the arrival unit test; the manager stays the only game constructor | build/ol-sims-2 |
| SIMS-2 R1 | npc-needs.js | `_acceptArrival` | gate the distance/id check to `returning`, `goto_item`, `goto_target`, `queued` only; an arrival in any other phase is dropped silently | review R1 Design M1: a seating chair fetch during `using` (owner needs, no move id) was going through the check and cutting the use short with a spurious `arrival_far` + mid-use re-issue at a non-own work object; drop it as before the slice | build/ol-sims-2 |
| SIMS-2 R1 | npc-needs.js | `_acceptArrival` | the job far guard is keyed by `${phase}:${dest cell}` (`job._farKey`), was `job._farPhase === phase` | review R1 m2 (both reviews): queue steps all share `queued`; a far arrival at a later queue cell (or after a freeze re-issue) was read as a repeat far arrival and failed the job on two different cells | build/ol-sims-2 |
| SIMS-2 R1 | npc-needs.js | `_tickNpc` (unfreeze), `_advanceQueued` (queue step) | clear `job._farKey` on the post-freeze re-issue and the step to a new queue cell | review R1 m2: a re-issue after a freeze or a queue-cell step is a fresh move, not a repeat far arrival | build/ol-sims-2 |
| SIMS-2 R1 | npc-needs.js | `_acceptArrival` (returning branch), `_watchReturn` | log `arrival_far` once per return (gated on `!returnFarReissued`); `_watchReturn` re-plans with `keepFarFlag: true` so the flag persists | review R1 Design m1 / server minor 2: an unreachable home logged `arrival_far` and re-issued twice per `_watchReturn` cycle; now once per return, re-planned quietly | build/ol-sims-2 |

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
- 2026-11-14: main `cb6d7feb4` merged into `build/ol-sims-2` as `5af54d887` before the review R1 fixes, to
  carry the latest shared-tree changes (sync-ring build review R3). No conflicts in the SIMS-2 files.
- 2026-11-14: main d69c29089 (sync-ring follow-up, keyring server half) merged into both branches, then
  build/ol-sims-2 merged into build/ol-sims so SIMS-3 builds on the arrival check. Only this log conflicted.
