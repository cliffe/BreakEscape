# m06 office life: build review, round 3 (static)

Target: tip `fc32a558c` on build/ol-m06. Delta `7887ac6f8..fc32a558c`: the three `"behavior": { "hostile": { "leash": true } }` lines (`scenario.json.erb:2001`, `:2045`, `:2085`) plus PLAN, BUILD_LOG and LIVE_FIX_R2. Whole-build pass over `0cacf33af..fc32a558c` (erb by grep, both new ink files read). No server started this round.

**Counts: B0 M1 m2**

## Delta (clean)

The leash lines match the R2 M1 fix, sit beside `globalVarOnKO` with no other `behavior` key on any of the three, and LIVE_FIX_R2 M1 shows the effect (games 8311, 8322). The leash anchor for a stationary NPC is `homeRoomId` (`npc-behavior.js:1113` to `:1119`) and the room test reads the player's room (`npc-chase-leash.js:25` to `:29`), so the label problem below does not reach the leash.

## The overlap: what it is

- Rooms stack north with their top 2 rows overlapping the room to the south (`utils/constants.js:29`, `core/rooms.js:1300`). The floor is 10 rows tall at world y -384, so the checkpoint starts at y -128 and the strip y -128 to -64 is inside both rooms' pathfinding bounds. The floor's last walkable row (local y 256 to 288) lies wholly in that strip.
- `updateCurrentRoom` (`npc-behavior.js:996` to `:1025`) takes the first `roomBounds` entry whose full map rectangle holds the NPC's body centre (feet, sprite y + 31). The checkpoint registers first, so feet at y >= -128 read `security_checkpoint`. The bodies in REVIEW_BUILD_R2 Observations (feet -119 and -128) and Dani queued (feet about -100) fit this exactly.
- `roomIdAtFeet` (`interaction-walls.js:88` to `:97`) skips the 2 back-wall rows and so answers `trading_floor` for the same points. That is why the KO room, the reload placement and click-to-talk are right.
- Measured cells (LIVE_S3:9): coffee use (84, -132), copier use (52, -132), fridge use (108, -124), queue cells (148, -100) and (180, -100). The fridge cell and both queue cells are inside the strip. The coffee and copier cells clear it by 4 px.

## What reads the behaviour roomId, and whether a story beat can change

| Reader | Effect when a floor NPC reads `security_checkpoint` |
|---|---|
| Chat background (`person-chat-background.js:118`) | Checkpoint picture (seen live, 8335) |
| Chatter and exchange overhearing, `playerHears` (`npc-needs.js:5597`) | A player on the floor never overhears that NPC: no bubble (`npc-world-bubbles.js:1045`), the line counts as unheard. A player in the checkpoint within 160 px with a clear line through the open door does overhear it |
| Chatter voice level (`npc-needs-chatter.js:303` to `:305`) | Door factor: 0.4 with the door open, 0 with it shut, with the speaker 2 m away |
| Barks (`npc-barks.js:29`, `npc-world-bubbles.js:821`) | Toast, not a bubble; a delayed bark is dropped as "NPC left" (`npc-manager.js:1368`, `:1380`) |
| Action icons (`npc-action-icons.js:593`) | Hidden |
| Use sound (`npc-office-visuals.js:325`) | Played as from another room |
| `npc_use_started` payload `roomId` (`npc-behavior.js:2406`) | Wrong, but no m06 mapping reads it (the two coupled breaks test `data.npcId` only) |
| Magnet sight, word of mouth, phone pickup, caught at post (`npc-needs.js:968`, `:991`, `:4714`, `:3407`) | Delayed by the seconds spent in the strip; nothing lost |
| Lockpick interrupt (`npc-manager.js:447`) | Not affected: reads the static `npc.roomId` |
| Checkpoint guard LOS, `challengeOnSight` | Not affected: the guard watches the player only, and the floor NPCs have no `los` and no `lockpick_used_in_view` mapping |
| `room_entered` mappings | Not affected: player events |
| KO room, reload placement, interaction | Not affected: `roomIdAtFeet` |
| Needs room leash (`npc-pathfinding.js:680`) | Not affected: `roomFloorRect`, not the label |

Verdict: no global, task, objective, guard sight or presence check reads this label, so no story beat changes. It is still visible to the player, and it hits the once-only exchanges (M1).

## Findings

### M1 (major): the coffee queue cells sit in the overlap strip, so a queued NPC, and the queuer who then steps up to the machine, reads as being in the checkpoint
`scenario.json.erb:2141` (`floor_coffee` `queue.cells` `{dx 2, dy 1}`, `{dx 3, dy 1}`).

Evidence:
- The queue is routine. The coupled breaks chain Dani to Tomasz (`:2101`) and Tomasz to Lerato (`:2056`), capacity is 2, so the third NPC often queues (LIVE_S3:9, game 7710).
- Queued: wrong chat background (LIVE_FIX_R2, 8335), no bubbles, a muffled or silent voice, as in the table above.
- Stepping up (inference, not seen live): the move to the use cell uses `arriveWithin: 6` (`npc-needs.js:3475`, `npc-behavior.js:1417` to `:1421`). Coming from the south it stops 6 px short, near feet y -126, which is back inside the strip, so the queuer can stay mislabelled for the whole use.
- That NPC is most often Lerato, and `ex_floor_after_irina` and `ex_floor_after_seizure` (`ink/m06_npc_lerato.ink:49` to `:63`) are between Lerato and Tomasz at this machine. A player standing by the coffee would see Tomasz answer lines nobody spoke ("I did. Two officers, very quiet."). Tomasz's overheard lines set `heard_<knot>` (`npc-needs.js:3100`), so the exchange never plays again.

Fix:
- Change the cells to the use cell's own row, east of the fridge: `"queue": { "cells": [ { "dx": 2, "dy": 0 }, { "dx": 3, "dy": 0 } ] }`. The targets are (148, -132) and (180, -132). (148, -132) is 27 px past the fridge's right edge and 30 px from Dani's home cell (160, -160). (180, -132) may snap to nothing beside the trading station (x 194). Snapping is exact (radius 0, `npc-needs.js:5718`), so a cell on a blocked spot is dropped. One cell is enough: only three NPCs may use this machine (`needsRooms`), and two are at it.
- With the queue on the same row, the step to the machine goes west along y -132 and the arrival from the north stops near -138. Both stay out of the strip.
- Rejected: cells north of the machine (dy -1). At (148, -164) the queuer stands on Dani's seated spot (body near (161, -155)).
- Live check (the fixer): `npcNeedsSystem.world.queueCells(world.getObject('floor_coffee'), [{dx:2,dy:0},{dx:3,dy:0}])` must return y -132 cells with `roomId` `trading_floor`. Force the three-way break and poll `npcBehaviorManager.getBehavior(id).roomId` for the queuer while it is queued and while it uses the machine: it must stay `trading_floor`. Then talk to it while queued and check the floor background.

### m1 (minor): the fridge's preset use cell is in the strip, so every fridge user reads as in the checkpoint
`scenario.json.erb:2152` (`floor_fridge`, no `affordance`). The preset gives `useFrom {dx 0, dy 1}` (`data/office-presets.json:8`), which puts the use cell at (108, -124) (LIVE_S3:9). The cell north of it is blocked by the fridge body. Lerato and Tomasz use it on hunger, which has the same effects as M1 but with no exchange at the fridge.

Fix: add `"affordance": { "useFrom": { "dx": 1, "dy": 0 } }` to `floor_fridge`. The target is (142, -156) with a 1-cell snap, beside the fridge's right side. Two things need a live check. First, that the object's `affordance` merges with the preset per key and does not replace it: `getObject('floor_fridge').affordance` must still show `satisfies: "hunger"`, `capacity: 1` and `useSound`. Second, that the snapped cell is clear of Dani's seated body near (161, -155). If it is not, try `{dx 1, dy -0.25}`. Re-measure, and the cell must read y < -136.

### m2 (minor): the coffee and copier use cells clear the strip by only 4 px
The coffee cell (84, -132) and the preset copier cell (52, -132), `office-presets.json:11`, are bounded by the props above them. There is no row further north to move them to. They hold when the NPC arrives from the north or along the row (the M1 fix ensures that), but a push between NPC bodies at the capacity-2 machine can shift a body 4 px. Under M1's live check, also poll the label for the second coffee user (at its beside cell, `npc-needs.js:5691`) and for Tomasz at the copier on his print errand.

The cure for this, and for every mission with a walkable bottom row, is in the engine. `updateCurrentRoom` should keep the current room while the NPC is still inside it, or skip the back-wall rows the way `roomIdAtFeet` does. Raise this with the integrator as an engine note; it is outside this build.

## Other new use cells (static)

- `lerato_desk` dy 2 (about y -222), `lerato_phone` dy 1 (about y -246), `tomasz_laptop` dy 1 (about y -245): well north of the strip.
- `floor_spare_phone`: player-triggered only, with no NPC use cell.
- Pizza: it is in the lab to the east. Side-by-side rooms share only the wall line at x 320, which is not walkable. The mid-floor drop (164, -196) is clear of the strip.
- Beside cell for the second coffee user: right (116, -132) if it snaps, otherwise left (52, -132), the copier's use cell (`npc-needs.js:5691`). Both are outside the strip. A coffee pair on the copier cell could hold up Tomasz's one print errand until his job times out. That is an observation, not counted, and needs a live look.

## Whole-build pass

Both new ink files are fine on a reread: once-only choices, an exit that stays open, and exchanges with no PLAN 3.3 item. The new globals are all declared. The `floor_staff_ko` mappings are appended after the KO loop, and nothing writes `cover_strained`. Nothing else was found that R1 and R2 missed.

## Fix outcomes (live, LIVE_FIX_R3.md, commit 4ed61aa0d)
- M1: fixed. Queue cells now (148, -132) and (180, -132), both `trading_floor`; queued and using samples read `trading_floor` in game 8405; game 8406 shows a one-second `security_checkpoint` reading at the step-up only. Exchange 1 heard true.
- m1: fixed. Merged fridge affordance keeps hunger, capacity 1 and sound; two users one after the other, `trading_floor`.
- m2: engine note only, recorded in BUILD_LOG.md.
- Open observation (copier cell blocking the print errand): not exercised, the errand did not fire in the run.
- Closed in round 4: the print is immediate with `forget: true` (no errand), so the copier cell cannot block it (REVIEW_BUILD_R4.md item 2).
