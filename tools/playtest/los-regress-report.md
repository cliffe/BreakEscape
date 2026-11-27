# LOS regression: `down-left` 225 -> 135 in `getNPCFacingDirection`

Question answered: plumbing / unexpected behaviour for the one engine line changed. Not a solvability run.

- Change under test: `public/break_escape/js/systems/npc-los.js`, behaviour-manager table, `'down-left': 135` (was 225, same as `up-left`).
- m02 game id **1219**, session log `tools/playtest/los-regress-m02-session.jsonl` (145 commands). Flags XML `tools/playtest/m02_ransomed_trust-flags-game1219.xml`.
- m01 game id **1220**, session log `tools/playtest/los-regress-m01-session.jsonl` (bootstrap, one failed eval, drain). Flags XML `tools/playtest/m01_first_contact-flags-game1220.xml`.
- Headless. Rails server left alone.

## verify-run.rb (m02, game 1219)

```
game            1219  (mission 46)
last write      2026-10-01 10:24:47 UTC
played for      98s of wall clock
unlocked rooms  7: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, security_office
unlocked objs   0
inventory       3: Your Phone, Lock Pick Kit, Notepad
flags submitted 0
VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

## Earned-secrets table

No secrets (PIN, key, flag) were used. Nothing to earn; the run only walked to the Security Office.

## Which NPCs have detection

| Mission | NPC | Detection config | Affected by the fix? |
|---|---|---|---|
| m01 | none | No `los`, no `patrol`, no `lockpick_used_in_view` mapping anywhere in `scenario.json.erb`. The four `behavior` blocks are `hostile` chase settings or `initiallyHidden`. | **No.** `shouldInterruptLockpickingWithPersonChat` skips any NPC without a `lockpick_used_in_view` + `person-chat` mapping. |
| m02 | Val Okonkwo (`security_guard_patrol`, Security Office) | `los` range 150, angle 140; patrol (2,3)->(7,3)->(7,7)->(2,7), speed 40; `lockpick_used_in_view` -> `person-chat` (`on_lockpick_used`, cooldown 30 s) | **Yes.** The only NPC that can interrupt a pick. |
| m02 | Bernie Nwosu (reception) | `los` 170/150, stationary; `lockpick_used_in_view` mapping has no `conversationMode` | No. Static, and the gate ignores it. |
| m02 | Nurse Raval | `los` range 16, angle 360, patrols; no lockpick mapping | No. |

Callers of `getNPCFacingDirection`/`isInLineOfSight`: only `npc-manager.js` (the lockpick gate) and `npc-los.js`' own cone drawing.

## 1. Cone direction per facing (m02, Val)

Method: in the Security Office, polled Val every 120 ms while she patrolled. For each tick, took her `behavior.direction` and called the real gate `npcManager.shouldInterruptLockpickingWithPersonChat(roomId, pos)` (the exact call `unlock-system.js` makes before a pick) for 8 points 80 px from her, one per compass bearing (screen angles, 0 = east, 90 = south). Samples 27 to 74 per facing, all in the same run (session log seq 78-ish). Val's own patrol produces all 8 facings.

Facing angle used by the engine, and bearings detected (140 degree cone, so +/-70; bearings are 45 degrees apart so none sit on an edge):

| Facing | Engine angle | Detected bearings (80 px) | Not detected | Result |
|---|---|---|---|---|
| right | 0 | 315, 0, 45 | all others | detect in front, none behind (180) |
| down-right | 45 | 0, 45, 90 | 135 to 315 | detect in front, none behind (225) |
| down | 90 | 45, 90, 135 | 180 to 0 | detect in front, none behind (270) |
| **down-left** | **135** | **90, 135, 180** | 225 to 45 (incl. behind, 315) | **detect in front (33/33 samples at each of three bearings), none behind** |
| left | 180 | 135, 180, 225 | rest | detect in front, none behind (0) |
| up-left | 225 | 180, 225, 270 | rest | detect in front, none behind (45) |
| up | 270 | 225, 270, 315 | rest | detect in front, none behind (90) |
| up-right | 315 | 270, 315, 0 | rest | detect in front, none behind (135) |

Down-left sample count 27, every one hit at 90/135/180 and none elsewhere. Before the fix the down-left row would have been the up-left cone (180/225/270), so a guard walking down-left looked up-left. The other seven rows are unchanged by the edit.

Real-player confirmation (player standing at real positions, gate called with `window.player.x/y`, Val on her normal patrol):

| Player at | Val facing | Samples | Gate hit | Bearing from Val | Meaning |
|---|---|---|---|---|---|
| (-317,-182) | down-left | 126 | **124** | 56 to 133 | in front: detected (2 misses at bearing 56, outside the 70 degree half-angle) |
| (-210,-216) | down-left | 8 | **0** | 12 to 22 | behind: not detected |
| (-210,-216) | down-right | 132 | 132 | 51 | in front of down-right: detected |
| (-206,-340) | up-right | 201 | 201 | 305 | in front: detected |

A genuine pick could not be started in any of these positions (section 2), so "start a lockpick" was exercised through the gate it calls, not the minigame.

## 2. Stealth beat

**m01:** nothing to preserve. No NPC sees picks, so lockpicking near any NPC is unaffected, same as before.

**m02:** no change, and Val is not part of any lockpick beat as the scenario stands.
- Val's gate checks NPCs in the room of the lock being picked (`doorProperties.roomId`, else `currentRoomId`). She stays in `security_office`.
- The only lock in that room is the Server Room door, `rfid` / `server_room_keycard`. Standing at it with the lock pick kit, `interact` fired `door_unlock_attempt` and opened no minigame (session log, `interact door:security_office->server_room`). So there is nothing to pick near her.
- The picks the walkthrough names (IT door, IT filing cabinet, Sealed Equipment Case) are in other rooms and are never seen by Val. The TESTING_WALKTHROUGH itself says her cutscene fires only "if she sees any pick".
- Harder, easier or the same: **the same** for every pick the missions call for. Only a pick attempted in the Security Office would see the difference, and none exists.

Observed in passing, not acted on:
- Val's patrol visits down-left for about 1 s per lap (from about (-253,-217) to (-283,-189)), so even a hypothetical pick would rarely hit that window.
- Val stops when the player stands on her patrol line; I held the player there in three of my own trials (she resumed once I moved).
- `npc-los.js` still has a second direction table (the `npc.direction` string fallback, about line 160) with `'down-left': 225`. It is only reached when the behaviour manager has no entry for the NPC, which was not the case for Val. Same typo class; not touched.
- Bernie's `seen_picking_by_bernie` mapping can only fire if some other NPC's gate emits `lockpick_used_in_view`; nothing here changed that. Unrelated to this fix.

## 3. Console errors

- 404 `Failed to load resource` x10 (m02) and x8 (m01), during load. The harness does not report the URL; same count pattern in both missions, unrelated to LOS code.
- A flood of `Cannot read properties of undefined (reading 'getCenter')`: **my own** page-side sampler, which read `window.player.sprite.getCenter()` (undefined) before I switched to `window.player.x/y`. Not from the game.
- No errors from `npc-los.js`, `npc-manager.js` or `unlock-system.js`.

## Verdict

The fix does what it says: a guard facing down-left now watches down-left and not up-left. All eight facings give a symmetric 140 degree cone, detect in front, no detect behind. m01 has no LOS NPCs, so it is untouched. m02's only person-chat NPC is Val, who has no pickable lock in her room, so no designed stealth beat changed. **No regression found.**

Limits: no real lockpick minigame was started (none exists near Val), m01 was confirmed by scenario grep plus the gate's code, not by a runtime NPC listing (my runtime eval failed on `eventMappings.filter` and I stopped that session), and nothing past the Security Office was played.
