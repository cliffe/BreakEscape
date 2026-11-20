# m06 office life: live round 2 probe (partial)

Tip 660d0cfee, keyless server from the p-ol-m06 worktree on port 3096, puma PID 1468751 (stopped by PID; port 3096 now free). Fresh games from new-game.rb with the four `--unlock` flags. Headless, setFPS(20), fixed steps on, no globals set from the page. Scripts: build scratchpad `live/r2.mjs`. The run stopped at the context limit, so items 2 to 5 were not run (see the handover note).

Attack method: real punch. A right-button mousedown on the canvas at the NPC's world position, which `game.js` routes to `playerCombat.attack`. No `debugKO` was used. Each punch does 10 damage to a 100 HP NPC, and punches stop landing on some stalled runs (see below).

## Item 1, V4 attack probe

| Case | Game | Result | Globals after | Notes |
|---|---|---|---|---|
| (a) Tomasz mid-walk to coffee | 8218 | First punch landed at 34.6 s while his job was `caffeine/goto_target`. He turned hostile and the trip was cancelled. HP 90, then 30 by punch 6. No KO in 15 punches. | unchanged, no KO | Game 8235 (30-punch cap) reached HP 50 and stopped registering, no KO. |
| (b) Lerato seated | 8228 | KO by real punches (HP 10 at punch 10, KO on the next). She got up when hit and dropped at (210,-259). | `floor_staff_ko`, `lerato_ko` true; `cover_strained`, `trader_ko`, `tomasz_ko` false | Stayed at (210,-259) for 60 s, `ko` true. |
| (c) Extra leaving coffee point | 8241 | No KO in 30 punches (HP 60). Player 41 px from Lerato at punch 17, outside the 32 px reach. | unchanged | Not a clean case: reach failed. |
| (d) Dani at `using` floor_coffee, after first talk | 8245 | KO at punch 10 (HP 0). | `floor_staff_ko`, `cover_strained`, `trader_ko` true; `lerato_ko`, `tomasz_ko` false | Dani's sprite position read null from +10 s on. Not confirmed whether he stayed where he fell. |
| (e) One non-KO hit on Lerato | 8259 | One punch. She stayed hostile, moved to (265,-231) and stayed there from 76 s to 90 s. | unchanged | Did not walk home in 90 s. Hostile flag never cleared. |

Other observations:
- Game 8213 (Tomasz at the coffee point, 15 punches): Lerato, standing beside him, was also knocked out by the punch arc (`lerato_ko` and `floor_staff_ko` true). Punches hit every NPC in the cone. This needs a decision: it is the intended AOE, or the coffee pair should not stand together in the cone.
- The machines' `offWhen` condition is `floor_staff_ko` on all three (`floor_coffee`, `floor_fridge`, `floor_copier`). I checked the condition, not the sprites.
- `cover_strained` became true only in case (d), as PLAN 10.4 expects for Dani.

## Items 2 to 5

Not run: Dani talk three ways (2), Irina badge clone (3), three natural Tomasz trips (4), LIVE_S5 DOM-root check (5). The scripts are in `live/r2.mjs` (modes `talk mid|queue|use`, `irina`, `natural`, `s5`) and are untested. Case (d)'s chat opened with a gradient background, not a trading floor image, so the background check is unresolved.
