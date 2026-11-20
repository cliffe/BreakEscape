# Gate D: Carrholme Services (P-KC)

Branch `feat/ca-living-office-w2`. Kit `AW/office_kits/carrholme_services.json`; stub `scenarios/_office_kit/ink/yusuf_demir_ambient.ink`. Live port :3004, throwaway detached worktree `.claude/worktrees/x-w2-kc` cut from this branch's HEAD. Carrholme has no pool (D12), so proof 3 does not apply here.

## Offline

- `office_kit.check_pool` accepts the kit (`pool: null`, non-empty `poolExempt`, no source carrying `chatter`). `room_objects` copies the cooler verbatim with `position {8.2, 5.6}` and no chatter; `room_npcs` gives Yusuf his `thirst` need and coordinate `needsHome` and no chatter.
- `python3 -m unittest test_office_kit`: 74 OK.
- `proof5.py`: the only diff from HEAD is the expected `scenarios/ca00_first_play/ink/anjali_rao.ink` (P-X0, pending integration); no Carrholme-related diff.
- Ink compiles clean (`bin/inklecate`); `yusuf_demir_ambient.json` fresh.
- Cross-package note: `test/js/social-awareness-office-kit.test.mjs` (P-TEST, not P-KC) test "pool exemption" asserts an exempt kit has **no sources** (line ~696), which contradicts brief v4 D12 (Carrholme declares a `kit_cooler` with a `position`). The test's own comment two lines on anticipates "Quayholt and Carrholme may gain a source". P-TEST / I must relax that assertion to match `office_kit.check_pool` (an exempt kit may carry a source that carries no `chatter`) and the brief 4.1 spec ("every Quayholt and Carrholme shell has exactly one `kit_cooler` with a tile `position`, and only Quayholt's carries `chatter`"). The gwen/agnieszka stub failures in the same suite come from other agents' uncommitted WIP in the shared worktree, not from P-KC.

## Proof 11 (Carrholme): plan and position check

Setup: in `x-w2-kc`, point the `test_ca_office_kit` fixture row at `company: carrholme_services`, `ep: ca11`, `ambient: ["yusuf_demir"]`, map `training_room -> room_aw_carrholme` in the fixture `mission.json`, regenerate with `apply_training_room.py`, start the keyless server on :3004, open the shell and drive with `window.__test.throttleFps(20)` for five thirst cycles.

Position check (D12 free cells): room_aw_carrholme floor is x1-9, y2-9. The cooler sprite (`water_cooler1`, 24x47) at top-left `(8.2, 5.6)` occupies x 8.2-8.95, y 5.6-7.07 (column 8, rows 5-7). The kiosk/desk prop drawn on the map ends about y5.7 at column 7-8; the linen cart is at rows 9+; the wall extinguisher is column 9. The cooler's top-left corner laps the kiosk prop's bottom-right by about 3 px, which is sprite dressing only (the kiosk has no bearing on the cooler, which has no collision body). Used from the front (south): approach cell about (8.6, 7.3), clear floor. Clear of the learner start (6, 6.2) to host (5.5, 3.8) and kiosk lines.

### Verdict

PENDING LIVE RUN (:3004, Haiku/foreground). To record: game id; the cooler is created at `(8.2, 5.6)` by the fallback (log shows `findMatchFor` null, no bind); it has no collision body (expected, D12); click-to-move routes round its footprint and no walker ends a step inside it; Yusuf leaves home, drinks at the cooler and sits again at `(3, 7)` for five cycles with no stuck walker; the learner's start-to-host and kiosk path is never blocked. If the position fails, move within column 8 rows 5-7 (e.g. `(8.2, 6.0)`) and record the new value here and in the kit.

## Proof 4 (Carrholme)

- `yusuf_demir_ambient.json` loads as a `storyPath` from `scenarios/_office_kit/ink/`.
- `scenarios/_office_kit/` stays skipped by the mission registry and by tests needing a `scenario.json.erb`.
- The ink-compiled staleness test covers the new `yusuf_demir_ambient.{ink,json}` pair.

### Verdict

PENDING: record the staleness-test result and that the folder stays skipped.
