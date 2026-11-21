# P-KT handover (Tarrowby Logistics)

Branch `feat/ca-living-office-w2`, worktree `.claude/worktrees/b-ca-lo-w2`. Kit commit `2eace7034` (+ gate-D/handover commit, see git log).

## Done
- `AW/office_kits/tarrowby_logistics.json` — kit: pool `kit_tarrowby` (3 lines), source `kit_vending` (drinks_vending, thirst, capacity 2, chatter pool, useFrom north {0,-1}), staff Fatima/Chidi/Zainab each with one thirst need + coordinate desk-chair home + 2 chatterLines. Loads clean through `office_kit.load_kit` (check_pool OK); room_npcs/room_objects/scenario_fields verified in-process.
- `scenarios/_office_kit/ink/{fatima_begum,chidi_okeke,zainab_hussain}_ambient.{ink,json}` — start knot + wave-2 episode knots branching on `kit_key_caught`, sticky exit. Fatima: ca06/ca09/ca15/ca17/ca20. Chidi: ca02/ca09/ca15/ca20. Zainab: ca02/ca06. Compiled with `bin/inklecate`.
- `W2_LINES_tarrowby.md` — 23 lines (budget 23): shared 12, stub 11. Self npc-dialog-review (2l): 0/0/0.
- `GATE_D_tarrowby.md` — proof 4 PASS; proofs 11 and 3 pending.

## Checks passed
- `bin/inklecate` compile: clean (3 files).
- `ink_compiled_staleness_test.rb`: 2 runs, 0 failures (proof 4).
- `test_office_kit.py`: OK (no regression).
- QS `office-kit-quiet-and-stub.test.mjs`: my 3 files PASS (ok 13-15, 22-24, 46-48, 49). The 2 suite failures (gwen, agnieszka) are P-SBM's committed ca13 knots (20c9e44e5), NOT P-KT.

## Open / in progress (for a fresh agent)
Gate D live proofs on :3002, throwaway worktree `x-ca-w2-tarrowby`:
1. Create the worktree: `git worktree add --detach .claude/worktrees/x-ca-w2-tarrowby 2eace7034` (from this branch HEAD; or a later HEAD that has the kit).
2. Copy the Tarrowby kit into `test_ca_office_kit` with a fixture row (as gates B/C did — see GATE_B.md / GATE_C.md for the exact `test_ca_office_kit` row + override pattern; registered rows 278/279).
3. Keyless server on :3002 from the worktree, `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle`, `bundle exec`. Headless browser, `window.__test.throttleFps(20)`, fixed steps on. Never touch :3000. Kill only PIDs you start.
4. Proof 11: five need cycles in `room_aw_tarrowby`. Confirm vending bind (not fallback), staff leave/drink/sit on the drawn south chairs, no stuck walker, start→host→kiosk path clear. **Adjust staff homes if they don't seat** (current best-estimate tiles Fatima (2,6)/Chidi (3,6)/Zainab (4,6) south — the drawn south chairs are at object tiles 1.62/2.88/4.12, y 6.78; the seat cell may be off by a tile). Record game ids + any home changes in GATE_D_tarrowby.md and re-commit the kit if homes change.
5. Proof 3 form: two staff at `kit_vending`, a pool line heard kiosk-closed, none kiosk-open.

## Gotchas
- Staff homes are UNVERIFIED seat tiles — proof 11 is the check. Brightwell's deployed homes ({3,3}/{6,3}) do NOT match its drawn chairs, so don't copy those; use room_aw_tarrowby's actual south-chair cells.
- `useFrom` north = {dx:0, dy:-1}; vending is on the bottom wall so approach is from above. Verify the approach cell (≈6.9, 8.4) is free floor in proof 11.
- Other agents (P-SBM, P-H*) commit in this same worktree concurrently — stage explicit paths only.
