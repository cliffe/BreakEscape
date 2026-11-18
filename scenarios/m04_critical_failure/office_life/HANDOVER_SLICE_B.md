**Superseded:** the slice B work is finished; see `BUILD_LOG.md` (Slice B and Kettle fixes) and `LIVE_PROOF_1.md` to `LIVE_PROOF_5.md`. Kept for the measurements only.

# Handover, slice B (partial)

Nothing is edited in `scenario.json.erb` yet. All numbers below are measured live on the keyless :3097 server (headless, 20 fps fixed step, fresh games 7666 to 7693). Probe scripts are in the session scratchpad only (`lib.mjs`, `p2.mjs` posts, `p3.mjs` cooler, `p5.mjs` room switch, `p8.mjs` clock, `p9.mjs` kettle); rewrite them from the method below.

## Measured
- Sofa posts, two fresh loads, identical: Ibrahim body centre (215.0, 250.0), Joanne (239.0, 250.0) (sprite y is 22 px higher: 228 and 227). Scenario currently has 6.7,7.47 and 7.47,7.47 (home 214.4,239.04 and 239.04,239.04). To write: x 6.72 / 7.47, y 7.81 for both (215/32, 239/32, 250/32). After the edit re-check with a fresh game that both still sit at those points and that a returning NPC lands there.
- Cooler: Joanne (thirst forced to 5) walked from the sofa, was `using` at body centre (270.7, 212.8) from game time 2.0 s to 13.7 s, expectedAwayMs 13039. Guard body centre (233.6, 128): distance 92.7 px. Ibrahim stayed seated at (215,250). Speed gate is at about x 120, 150 px west of the cell; clear. Cooler sprite is at y 153 to 200, nobody inside it. `useFrom` dx 0, dy 1 resolves to that standing point, so it stays. Screenshot of Joanne at the cooler (behind the planter, readable): `screenshots/joanne_cooler.png`.
- Door: reception south door and ops north door are one doorway, world (48, 288), gap x 32 to 64 (feet 41 to 55). Ops office origin is world (0, 256); plan coordinates are room-local (kettle cells (210,117) are world y 373).
- currentPlayerRoom switch: entering ops from reception at player (47.8, 288.2); going back at player (47.7, 280.7) (player x,y, not feet; feet are about 30 px lower).
- Needs clock: 120 real s gave 120.0 clock s, ratio 1.00 (headless, 20 fps fixed step). Levels fell 0.5 per 20 s = 1.5 per minute. Initial levels are jittered (Ibrahim thirst 99.9, caffeine 76.6; Joanne thirst 96.3, caffeine 79.7), so the first natural trip is at least about 28 needs-minutes (caffeine, from 72 down to 30) and about 30 to 47 for caffeine/thirst as sampled. All above 10 minutes: decayPerMin 1.5 stays.
- Kettle geometry (world): kettle sprite (203,300) w15 h18; counter and sink (196,308) w47; Vance body centre (160, 480) (room-local (160,224), matches plan). Door to Vance 192 px.

## Not measured (open)
- Kettle `using` cells for first user and beside user, pair overlap (five uses), distances from those cells to the doorway and Vance, kettle pair screenshot. The probe stalled twice because the scripted Vance conversation did not start (interact too early); `ops_kettle_off` stays true until both `vance_met` and `vance_provided_keycard` are true.
- Working route to open the kettle in a fresh game: `enterRoom('operations_office')`, `moveToNear('robert_vance')`, `interact('robert_vance')`, then loop on `getState().dialogue`: pick `/Just doing the job/`, then `/cloner/`, else the first choice; when `activeMinigame.id === 'rfid'` wait 4 s and `minigame.clickText('Save')`. Both globals were true after about 18 steps (game 7666 run). Then `ops_kettle_off` was false. Park the player at (250,330) (clear of lanes), then `needs.set('ibrahim_diallo','caffeine',5)`; Joanne follows by mapping. Record body centres when `job.phase === 'using'` and `job.targetId === 'ops_kettle'`.
- Scenario edits, validator, lock_key_diff (revert dungeon_graph files), office summary diff, position diff, BUILD_LOG "Slice B" section.

## Gotchas
- `pgrep -f` inside a Monitor matches its own shell; use `kill -0 <pid>` instead. Piping a probe through `| tail` hides output until exit; redirect to a file.
- Another session runs `p9.mjs 7659` on this machine; leave it alone.
