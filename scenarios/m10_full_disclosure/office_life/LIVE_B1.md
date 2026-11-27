# m10 live B1: measurements (handover, partial)

Server: keyless (boot warning seen), :3099, worktree p-ol-m10, puma PID 2234305, stopped at the end. Games used: 7690, 7696, 7697 (static), 7703 to 7745 (L1). Headless, setFPS(20), fixed steps on. `node_modules` in the worktree was already a symlink to `../p-9-2-h/node_modules` (untracked, not created by me), left in place.

## Done

1. **Kettle and crate** (games 7696, 7697): one `fp_kettle` per load, sprite `kettle1` at (265,266), 15x18, identical on both loads. Crate id 41 at (256,272), 32x20. Depth: kettle 292.51 > crate 292.5. No `[table group] ... overlaps no table` warning on either load (console filtered for table group and overlap). Cropped screenshot NOT yet taken.
2. **Cells** (engine `approachCell` and `besideCell`): approach (276,268) px = tile (8.625, 8.375), beside (308,268) px = tile (9.625, 8.375). Both are tiles (8,8) and (9,8), walkable, and 5.7 px from the old homes, inside HOME_EPS 12. Set `position` and `needsHome` to those tile values for both extras (commit c7ec42338). Posts on use cells work (no in-place failure), so **F1 not needed**. The engine home reads back (276,268) and (308,268) px. NPC sprite y is body centre minus 31 (sprite 237, body 268); probe uses the sprite, so subtract nothing when comparing cells in body terms: use `body.center`.
3. **L1 pair use**, five fresh games (7728, 7731, 7735, 7740, 7745), each: open the Netherton chat by playing it through (`settle()`), let the mapped brew finish, wait 33 s, force Darren caffeine 5. Identical every time: Darren urgent/job_start t, using t+1.0 s; Sofia urgent t+2.75 s; Sofia `using` 2.75 s after Darren `using` (1.5 s delay + 0.25 s tick + 1 s windup; her departure alone is about 1.75 s after his use starts). Both `using` at `fp_kettle` for about 19 s (samples at 276,268 and 308,268, apart 32 px). Pool line reported each time (Darren: "I've run the lamp off the spare cell."); the first brew of each game plays `ex_fp_kettle_on` (4 lines, `exchange_heard`, complete). 5 of 5 PASS. Doubt: "within about 2 s" is 1.75 s to leave and 2.75 s to `using`.
   Gotcha: closing the opening Netherton chat early only re-queues it, and Sofia's coupling (delayMs) waits while any minigame is open, so the chat must be played through (lib `settle`). Closing it also fires Darren's first mapped brew (L3 path), so an unforced L1 happens at about clock 31 s anyway.

## Not done

- 2 (Darren/Sofia home already set; nothing more).
- 4 L5 posts over ten needs-minutes and needs-minute to real seconds. Probe idea: after `settle()`, sample body centres every 1 s; ratio from Sofia's caffeine fall / 2.5 per min against wall minutes, and `clockMs` against wall. Observed so far: needs clock 45 s while 35 s wall in an early run (clock appears to run ahead of wall at 20 fps), unconfirmed.
- 5 distances: use `__test.moveToNear(id)` to the north-side table items (kit_table), `director_netherton`, `incident_file`, `gate_console`, `gate_terminal`, and enter the east door; read player x/y and measure to body centres (276,268) and (308,268). Then set `behavior.hostile.chaseRange` (currently provisional 64) below the smaller of the table and Netherton distances (both at scenario.json.erb lines near 2626 and 2660).
- 6 overhearRadius (320 now): confirm against console and terminal distance from Sofia.
- 7 lighting screenshot of the yard around the kettle (no change), and the cropped kettle/crate screenshot; folder `scenarios/m10_full_disclosure/office_life/screenshots/` exists, empty.
- Validator run (0 errors expected; the six over-40 exchange lines from BUILD_LOG are still unresolved, so expect 6 errors unless fixed), lock_key_diff vs baseline_locks.json (only `homes` changed, expected empty).

## Tools

`tools/playtest/m10-ol-lib.mjs` (committed c7ec42338): `start(gid)`, `settle()`, `probe()` (both extras: levels, mode, job, home, sprite px and tiles, apart, player), `setNeed`, `evs`, `shot`. Env `M10_PORT` (default 3099). Scratch scripts (not committed) in the session scratchpad: `newgame.mjs`, `l1.mjs`, `p2.mjs`.
