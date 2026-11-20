# Gate D: Tarrowby Logistics (P-KT)

Port :3002. Throwaway worktree `x-ca-w2-tarrowby` (never merged). Proofs 4 and 11 (+ proof 3 form), per WAVE2_BUILD.md 2.4 (v4, 208b39748).

Kit commit: `2eace7034` on `feat/ca-living-office-w2`.

## Proof 4 — PASS (done offline, no server)

- `kit_*` staff `storyPath` points at `scenarios/_office_kit/ink/<person>_ambient.json`; the three new `.json` compile clean from `.ink` via `bin/inklecate` (no warnings).
- Compiled-ink staleness test covers the new files: `bundle exec ruby -Itest test/unit/break_escape/ink_compiled_staleness_test.rb` → 2 runs, 4 assertions, 0 failures (BUNDLE_PATH=main checkout vendor/bundle).
- `scenarios/_office_kit/` is a non-scenario stub folder with no `scenario.json.erb`, already skipped by the mission registry and the scenario-needing tests (pre-existing; the new files only add ink to it). 
- QS stub test `test/js/office-kit-quiet-and-stub.test.mjs`: fatima_begum, chidi_okeke, zainab_hussain all PASS (ok 13-15, 22-24, 46-48) — committed `.json` loads, start opens on a sticky-exit line, start diverts on `kit_defend_done`+`kit_ep` to each episode knot, every knot ends on `+ [See you later.] #exit_conversation`, speaker prefix == kit displayName, no state-writing tag; and the row-coverage check (ok 49) passes with Chidi excepted in ca17.
  - NOTE: 2 unrelated failures in this suite (gwen_pritchard, agnieszka_duda) come from P-SBM's committed ca13 knots (20c9e44e5), not P-KT. Flagged to P-SBM / P-TEST.

## Proof 11 — TO RUN (live, :3002) — see PKT_HANDOVER.md

Kit staff in `room_aw_tarrowby` for five need cycles. Expected (D12):
- `kit_vending` binds to the drawn `drinks_vending1` prop at tile (6.94, 9.38) via `rooms.js findMatchFor` (no explicit position); the log should show the bind, not the fallback.
- No stuck walker; staff leave home, drink at the vending (`useFrom` north, cell (6.9, 8.4)), and sit again at their coordinate homes on supported `aw_chair_south_slate1` chairs.
- Staff homes are best-estimate seat tiles: Fatima (2,6), Chidi (3,6), Zainab (4,6), all facing south. **If a staff member does not visibly seat on the drawn south chair, adjust the home to the actual seat cell and record the new coords here, then re-commit the kit.**
- The learner's start→host→kiosk path is never blocked, queue cells included.
- Record whether the vending has a collision body (drawn prop; a body is expected here, unlike the KQ/KC cooler) and that click-to-move routes to the host/kiosk fine.

## Proof 3 form — TO RUN (live, :3002)

Two Tarrowby staff at the pool source (`kit_vending`, capacity 2): a `kit_tarrowby` pool line is heard with the kiosk closed, and none with the kiosk open (`requireGlobal: { kit_quiet: false }`).

## Verdict

Proof 4: PASS. Proofs 11 and 3: pending live run (handover). Game ids to be logged here after the run.

## Live run 1 (2026-11-20, :3002, partial)

Throwaway worktree `.claude/worktrees/x-w2-kt` (detached at c7ad4cc91, not merged). Fixture: scenarios/test_ca_office_kit/scenario.json.erb overwritten there with ca01_invoice_fraud_defend re-kitted by `office_kit.apply_kit` for `tarrowby_logistics` (Fatima, Chidi, Zainab) plus the Tarrowby room fields (script `mkfix.py` in the scratchpad). Keyless server on :3002, mission 278 via the app's new-game form. Driver: playtest-session.js, headless, throttle 20 fps. Game ids: 10905-10907 probes, **10908 run A** (natural thirst, 130 s). Evidence in scratchpad `w2_gateD/tarrowby/` (runA.out/.log, A_00..A_10.png, A_contact.png).

### Proof 11 (one natural cycle each; five cycles NOT yet done)

- **Seats: PASS, no home change.** All three start seated (`sit_south_frame_000`) on the north-side `aw_chair_south_slate1` chairs. Sprite x equals the chair centre exactly (Fatima 60, Chidi 100, Zainab 140; dx 0) and feet y 215. After each drink they walk back and sit again on the same chair (Fatima t=25.4 s, Zainab 33.4 s, Chidi 50.6 s, same dx 0). Homes (2,6), (3,6), (4,6) snap to the chair centres. Screenshots A_contact.png (start, drinking, one back, all back).
- **Vending bind: PASS.** One `drinks_vending1` sprite, `kit_vending` at (222, 239), size 42x61, matching the drawn tile (6.94, 9.38) bottom edge (y 300); the kit source has no `position`. No second vending sprite, so no fallback. No collision body (`body` false), as the brief expects.
- **Thirst trip: PASS.** Zainab (55 start) left at 3.6 s, Fatima (45) was already using, Chidi (60) left at 19 s once a slot freed (capacity 2). Each: `npc_arrived` then `npc_use_started:kit_vending` then `npc_used` then `npc_returned_post`.
- **No stop in a prop footprint: PASS.** Standing stops (use cells) at (237,236), (269,235), (199,238), all outside vending (x 222-264, y 239-300) and stacked chairs (268-288, 255-300). Seated stops have feet on the table's top edge (y 215) and are the seat, not a stop.
- **Not yet run:** cycles 2-5 (force with `__test.needs.set(id,'thirst',10)`, about 50 s per cycle for three staff); the learner start (6,6.2) to host (5.5,3.8) and kiosk path with staff at the vending (`moveToNear` adaeze_okafor and training_kiosk) and click-to-move round the vending.

### Proof 3 form

- **Kiosk closed (kit_quiet false): PASS.** Pairs at `kit_vending` spoke three lines, all `npc_chatted:kit_vending`, topic `kit_tarrowby`, speakers in the pair: Zainab "Back off the road at last." (her own line), Fatima "Depot's heaving today." (pool), Chidi "Who's on the Shipley run?" (pool). Each also `npc_overheard`.
- **Kiosk open (kit_quiet true): NOT yet run.** Open `training_kiosk`, click `.epr-start` (state change sets kit_quiet), force two staff to thirst 10, expect no `npc_chatted:kit_vending`.
- **Stubs open/close on the sticky exit:** NOT yet run (click each colleague, check the start line and `+ [See you later.]` closes).

### Handover for the next agent

Re-create the fixture: `python3 <scratchpad>/w2_gateD/tarrowby/mkfix.py <x-w2-kt>/planning_notes/phishing_and_social_engineering/awareness <x-w2-kt>`; server from x-w2-kt (`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=.../vendor/bundle bundle exec rails server -b 127.0.0.1 -p 3002`); `run.sh <name> <jsonl>` and `mk.py` (monitor) are in the same scratchpad folder. Use a 300000 ms timeout and keep each route under 280 s.

Verdict so far: seats PASS (no kit change), bind PASS, one cycle PASS, footprints PASS, pool closed PASS. Pending: cycles 2-5, learner path, pool kiosk-open, stubs.

## Marginal failures: diagnosis and fix (20 Nov, both hits)

**Hit 1, Zainab's use stop at (248.8, 240.9), 1.9 px inside kit_vending (x 222-264, y 239-300): kit data, fixed.**
- The y 239-300 box is the drawn sprite's full extent (42x61, centre y 269.5). Its top rows are the part a walker passes behind. A stop at y 240.9 puts the feet on the top 2 px, so the body reads as standing north of the machine, but the checker rightly counts it as inside.
- Cause: `useFrom {dx 0, dy -1}` is added to the sprite centre (npc-needs.js `approachCell` ~5537), giving y 237.5, 1.5 px above the top edge. Use cells snap to the 8 px grid (centre y ~236). A third drinker on a capacity-2 machine is held beside a taken cell and arrives by the held-1.5 s, within-1-tile fallback (npc-behavior.js:1432-1444; `arriveWithin` is 6 px, npc-needs.js:3512), so it can stop up to a tile off the cell, towards the machine. 1.9 px is well inside that 1-tile tolerance. Other stops sat at y 233-236, outside by luck.
- Fix: `useFrom.dy` -1 to -1.25 in tarrowby_logistics.json (cell centre y ~228, 11 px clear of the top edge, so a wedge of up to ~10 px still clears).
- Re-test (fixture rebuilt, server :3002, games 10925 and 10927): cycles 2-5 all done in 50-54 s, 3 returns each, no stop in any footprint other than the seated-on-table stops. Use stops now sit at y 227-232.5 (x 197-273). The third drinker takes a west cell (198, 228).

**Hit 2, click-to-move leg 2 stood at (256,250): harness staging plus a cost-only footprint, no kit data involved.**
- The pointer staging point came from the harness, not the pathfinder. The target (260,226) is within an interactable's gather radius (Zainab or Fatima standing at the machine), so `moveTo` takes the keyboard route and first clicks `clearClickPointNear` (test-bridge/index.js:186-207, used at :1017). That function accepts any walkable grid cell with no interactable nearby. The machine has no body, so its footprint cells are walkable and (256,250) qualified.
- The pathfinder then did what it is designed to do: `crossesAvoidRect` ignores a rect that holds the route's end (path-avoid.js:134-139), and the footprint is only a cost of AVOID_CELL_COST 20 per cell (path-avoid.js:30, 95-117; applied at npc-pathfinding.js:773). Walking to a point inside the box walks through the box.
- Re-run on the fixed kit staged at about (247,254) this time (the NPC that triggered the avoidance changed), same result: 5 samples in the footprint. It is deterministic in kind, so not a kit fault. Kit data cannot change it (no staff home or useFrom is involved; staff homes are chair cells at y 196-200).
- Proposed fix, harness (test-bridge/index.js:186): in `clearClickPointNear`, also reject points inside a `collectAvoidRects` rect (path-avoid.js:77). One line in `walkable`.
- Proposed fix, engine (only if a player must not be able to stand in a machine): in rooms.js, the static-body branch at ~2806 is `type === 'table'` only. Add a body-less-source branch: when `scenarioData.affordance` is set (or `prefersAvoid(sprite)` is true) and the sprite has no body, add a static body (`physics.add.existing(sprite, true)`) with a floor box, the bottom ~25 % of the sprite as `applyTableBody` does (rooms.js:2814, 1940). rebuildWorldGrid already pads solid bodies, so NPC and click paths then route round it without the cost-only rule. Cost-only was a deliberate choice (walk-behind effect on the top rows), so the floor box, not the whole sprite, is the right size. Needs a unit test plus a live check that the use cell stays walkable.

### Quayholt and Carrholme (same class, a coordinator-reported hit)

- Cooler `water_cooler1` is 24x47 and is placed with its top-left at tile (8.2, 5.6) in Quayholt, so the drawn box is x 262-286, y 179-226 (centre y 202.7). The "footprint (8,5)-(8,7)" is the tile estimate, not the drawn box: the sprite ends at y 226, 2 px into row 7 (y 224-256).
- `useFrom dy 1` gives y 234.7, 8.7 px below the drawn bottom, so the stand cell (observed y 230-239) is outside the drawn box. Niamh's transit at (257.9, 219.2) is x 4 px west of the box. The click-to-move stop (279, 238.5) is 12 px below it. By drawn box neither is inside. They are inside only by the tile footprint.
- If the tile footprint is the standard: a stand cell clear of row 7 needs y >= 256, so dy 1.75 (centre + 56 = 258.7). That is a 32 px gap below the cooler and runs into Quayholt's desk row 8, so I do not recommend it.
- Recommended exact change, same margin as Tarrowby (stand ~16-18 px clear of the drawn edge, so a one-tile wedge stays outside): in `quayholt_insurance.json` and `carrholme_services.json`, change the cooler affordance `"useFrom": { "dx": 0, "dy": 1 }` to `"useFrom": { "dx": 0, "dy": 1.25 }`. Generic rule: dy = (sprite height / 2 + ~18 px) / 32 away from the sprite, from the centre. For a 3-tile (96 px) sprite that is dy 2.06. Check live that (8, 7.6) is walkable in Quayholt (desk row 8 begins y 256) before routing it. Carrholme's cooler is the same sprite, same rule.
- Whether a body-less placed object can be routed round: only by cost. Both the NPC route (`avoidCells`) and the player's click route add cost, never a block, and a route end inside the rect is ignored. A hard route-round needs the static floor-box proposed above (rooms.js ~2806, one new branch for sources with an affordance), which is the smallest engine fix. It would cover all three kits.
