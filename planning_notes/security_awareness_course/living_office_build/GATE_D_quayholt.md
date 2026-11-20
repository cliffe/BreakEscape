# Gate D: Quayholt Insurance (wave 2, P-KQ)

Kit `office_kits/quayholt_insurance.json`; stubs `_office_kit/ink/{darren_price,niamh_doherty,anjali_rao}_ambient.ink`.
Committed in 542b1b495 (swept into integrator commit 9df9d0c05, byte-identical).

## Offline (done, passing)

- `python3 AW/test_office_kit.py`: 74 OK.
- `bin/test-js test/js/office-kit-quiet-and-stub.test.mjs`: 1 passed (all stub/ca00 cases over
  darren/niamh/anjali). Needed `{ kit_ep == "ca00": -> ca00 }` added to Darren's and Niamh's
  `start` (QS test treats every `caNN` knot, ca00 included, as a divert target; ca00 still opens
  directly, no branch).
- `social-awareness-office-kit.test.mjs`: the one failure is `carrholme_services.json` (P-KC /
  P-TEST, stale exempt-source assertion vs D12). Integrator resolved it in 9df9d0c05. Not a
  Quayholt file.
- `load_kit('quayholt_insurance')`: `check_pool` passes (pool present, no poolExempt); cooler
  carries `position` (8.2,5.6) and `affordance.chatter: "pool"` → office_kit maps to `kit_quayholt`.
- Word cap: every spoken line ≤ 30 words (max 16). No `{var}` in any voiced line.
- Ink staleness test: the failures it lists (ca02–ca08 host inks) are sibling H-package files
  modified in the shared working tree, NOT the `_office_kit` ambient files; mine are in sync.

## Proof 11 — static geometry pre-check (offline, deterministic)

room_aw_quayholt walls layer: floor is x1–8, y2–8 (x0,x9 and y0,y1,y9 are wall). Cooler
top-left (8.2,5.6), water_cooler1.png 24x47 → occupies tiles **(8,5),(8,6),(8,7)** — all free
floor, matching D12's "column 8, rows 5–7". Staff homes (Darren 2.5,7 → tile (2,7); Niamh 4,7
→ (4,7); Anjali 7.4,8.3 → (7,8)) are all free floor and OUTSIDE the footprint. Learner path
start (6,6.2), host (5.5,3.8), kiosk (~7,3) are all free floor and clear of the footprint.
**Open for the live run:** the south `useFrom` stand cell. Column 8 is the easternmost floor
column (x9 is wall); a south-facing use should stand at ~(8,8) (free floor, outside footprint),
but the engine's approachCell rounding near the east wall must be confirmed live; if a walker
lands inside the footprint or against the wall, move the cooler west within rows 5–7 (e.g.
(7.2,5.6) → footprint col 7) and record the new position here.

## Live proofs — OUTSTANDING (hand over to Haiku, :3003)

Not yet run (agent hit the 200k context hard stop). Procedure, in a throwaway detached worktree
`x-w2-kq` cut from this branch's HEAD (`git worktree add --detach`), keyless server on :3003,
`BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle`,
`window.__test.throttleFps(20)`, fixed steps on; kill only PIDs started; never :3000; no db tasks;
no game-record edits.

Setup: the `test_ca_office_kit` fixture uses `room_aw_brightwell`. For proof 11 to exercise the
Quayholt map, in the THROWAWAY worktree only, add a fixture row (company `quayholt_insurance`,
tier E, `ambient:["darren_price","niamh_doherty"]`, `setPiece:null`, modelled on the
`test_ca_office_kit` row but with an `override` to shorten `useSeconds` and pin the cooler
position if needed) and point the fixture scenario's `training_room` tilemap at room_aw_quayholt
(gates B/C repointed the fixture per company — confirm how in GATE_B/GATE_C scratch). Register
rows 278/279 as gates B/C did.

- **Proof 11 (Quayholt):** staff for five need cycles. Pass: cooler created at (8.2,5.6) by the
  fallback (log shows findMatchFor null → createSpriteAtRandomPosition → applyScenarioObjectPosition,
  no bind); verdict records it has NO collision body (expected, D12, as Tarrowby's vending machine);
  click-to-move routes round it and no walker ends a step inside tiles (8,5)/(8,6)/(8,7); staff
  leave home, drink, sit again at (2,7)/(4,7)/(7,8); learner start→host→kiosk path never blocked.
  In ca00 (if run) staff stay clear of the learner while the brief is open.
- **Proof 3 (Quayholt):** two staff (Darren+Niamh) at the cooler (capacity 2); a `kit_quayholt`
  pool line heard with the kiosk closed, none with it open.
- **Proof 4 (Quayholt):** each ambient `storyPath` in `_office_kit/ink/` loads; the folder stays
  skipped by the registry and tests; staleness test covers the new files.

Record game ids here per proof.

## Verdict: Anjali never sat after the cooler (Quayholt, 2026-11-20)

Cause: kit data, not the engine and not the cooler useFrom. Anjali's `needsHome.facing` was `north`, but her chair (`aw_chair_south_charcoal`, foot at about (245,265), home (237,266)) is a south-facing static chair, drawn north of the desk. In seating.js the post seat only accepts a static chair when `staticFacesToward(seat, feet, toward)` holds (within 67 degrees), and `toward` comes from the coordinate home's `facing`. North against a south chair fails, so `near` was empty, a static chair is never fetched, and the try ended with "work standing" (no `seat_gave_up` line, `_seatRetries` 0). Meanwhile the walk home accepted arrival within 1 tile (npc-behavior.js ~1432) and `_acceptArrival` within ARRIVAL_NEAR_PX 48, so `returned_post` fired 28 px short of the home, at about (262,253). Darren and Niamh face `south`, which matches their south chairs.

Fix: `needsHome.facing` for Anjali `north` to `south` in quayholt_insurance.json (commit 08fad620f). Any ca shell that bakes the Quayholt kit needs a re-splice. Engine: no change. (Possible hardening, not needed: log `seat_no_chair` when the chair is rejected on facing, since the failure left no log line.)

dy 1 control (game 10992, useFrom dy 1, facing north): Anjali stood after both returns, so the failure predates the dy 1.25 change and is independent of it.

Re-test with the fix (dy 1.25, facing south), games 10975, 10989, 10990, 10991, 10998, 10999, 11007, 11008, five 270 s sessions plus extras: Anjali 9 of 9 returns sat (sit_south at (245,263)), Darren 8 of 8 sat, Niamh 14 of 14 sat. Game ids 10931 to 10938 (before) and 10992 (control) show the failure.
