# test_gate_tailgate

A small neutral fixture for the gate-door family of engine features. Two rooms (open-plan office, staff room), one facilities worker (Sam Ellery) on a loop between them, a visitor lanyard and an RFID cloner on the office floor. Nothing to solve; the objective ("enter the staff room") only gives the browser runs a visible end state.

Before this existed the only user of these features was the full `lab_physical_pentest`.

## What each part tests

| Part | Config | Feature |
|---|---|---|
| Gate on the office's own `doors` entry | `gate: { openFor: ["sam"], openRadius: 56, holdMs: 2500, playerMayPassIf: "visitor_pass" }` (full room data only; bootstrap strips `doors`) | `systems/door-gates.js`: opens for Sam, holds, shuts, never traps |
| Multi-room route | `patrol.multiRoom`, `waypointMode: "sequential"`, two segments, `dwellTime: 6000` on the first waypoint, `action: { unlockRoom, useObject }` on the door-side waypoint | `npc-behavior.js` `_runRouteAction`, route dwell |
| Unlock permission | Sam's `{ "eventPattern": "sam_never_fires", "unlockDoor": "staff_room" }` mapping | Needed by `unlockRoom` (see "Findings") |
| Sight challenge | `los.challengeOnSight` with `near: { door }`, `cooldown`, `skipIfGlobal` as a **list**; mapping with `closeDoor: "staff_room"` | `npc-sight-challenge.js` plus NPC `closeDoor` |
| Pass rule | `playerMayPassIf: "visitor_pass"`, set by the lanyard hook (`triggerOnInteract`) | Player may follow Sam only with the lanyard |
| Clone entry | `rfidCard` on Sam, `# clone_keycard:test_staff_badge` in `ink/worker.ink`, door `requires: test_staff_badge` | `doors.js` click path, `playerOpen`, `door_gate_player_opened` |

Cycle: Sam dwells at (4,4) for 6 s, walks to (1,2) beside the door, unlocks and loads the staff room (first lap only), the gate opens as he nears, he walks the staff room and comes back; about 26 s a lap.

## Reproduce

```
bin/rails db:seed                      # registers the mission (adds rows only)
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_gate_tailgate
tools/playtest/session-start.sh --url http://127.0.0.1:3001/break_escape/games/<id> --speed fast --headless true
```

Use the `playtest-scenario` bridge. Install a recorder with `eval` (wrap `eventDispatcher.emit` for `door_gate_*`, `player_in_view_near*`, `card_cloned`, `room_entered`; wrap `window.loadRoom`; sample `npcManager.npcs.get("sam")._sprite` and `doorGates.state("staff_room")` every 100 ms). Use a fresh game for each of the three player routes, because the lanyard trigger fires once per game:

1. **No pass**: `interact` the door `door:office->staff_room`; also stand within about 50 px (feet) of the door.
2. **Lanyard**: `interact visitor_lanyard`, wait for the gate to open, `moveTo(48,-10)`; leave the same way on Sam's next lap.
3. **Clone**: take `kit_cloner`, stand near Sam while he dwells at (125,101) (`moveTo(170,120)` first; `moveToNear` is too slow), `interact sam`, choose "Mind if I have a look at your staff badge?", press Continue so the RFID reader opens, click Save, End Conversation, then `interact` the door and `moveTo(48,-10)`.

Gotchas for the driver: Sam's sight challenge opens a short person-chat; the bridge reports `minigame-active` until it ends, so wait for no minigame before the next `interact`. The player's body (feet) centre, not the sprite centre, is what `openRadius` is measured from.

## Results (browser, keyless :3001, headless, 2026-11-05)

Games 504, 506, 507, 509, 510 (mission 237). Screenshots in the scratchpad `lpp-gate/`.

| Check | Result | Evidence |
|---|---|---|
| Gate opens for Sam, holds, shuts; repeats | PASS | `door_gate_opened`/`closed` at 4.7/19.5/24.9/38.3 s (game 509); 4 opens, 3 closes in 60 s (a lap is open, hold, closed while Sam dwells) |
| Sam never trapped by the closing door | PASS | No samples (about 600) with Sam's feet in the door body band while the gate was shut, across 4 laps in both directions (game 509); Sam only ever waits on the open side |
| Multi-room route, `unlockRoom` then load then walk | PASS | `door_unlocked_by_npc` at 5.1 s, `loadRoom("staff_room")` once at 5.1 s, `Route action done` log, Sam crosses with no teleport (position samples) |
| `useObject` | PARTIAL | Action ran with no error; `_faceRouteObject` facing is not asserted |
| Waypoint `dwellTime` | PASS | Sam stationary at (125,101) from 12.4 s to 18.7 s (6.3 s) before the next leg |
| Room not reloaded on reopen | PASS | `loadRoom` called once in 4 laps; `rooms.staff_room` identity unchanged across laps (`same: true`) |
| Sight challenge near door | PASS | `player_in_view_near:sam` fired once per cooldown window (game 506: 33.5 s) |
| `closeDoor` behind the player | PASS | Same tick: `Event closeDoor: staff_room closed`; gate stayed shut with Sam beside it (about 17 px) for over 10 s while the player stayed close |
| `skipIfGlobal` as a list | PASS | With `visitor_pass` true (first list entry) and the player near the door, no `player_in_view_near` fired (game 509) |
| Player cannot open the door without the lanyard | PASS | Click gives `door_gate_denied`, player stays in `office`; `enter` at a shut gate returns `did-not-cross` (games 506, 507) |
| Player with no lanyard who waits at the door | NOT RECHECKED (should be kept out) | The 2026-11-10 result here (game 74: the gate opened for Sam after 5 s and the player followed him in) was for the guard-priority rule, which the merge of 2026-11-10 removed. Under the turn-back rule Sam gives up the crossing after 5 s and the gate stays shut. `test/js/door-gates.test.mjs` covers it; this row needs a browser recheck |
| Player can pass with the lanyard | PASS | Gate opens for Sam, `moveTo(48,-10)` reaches `staff_room`, `room_entered:staff_room`; leaves again behind Sam (`room_entered:office` at 34.3 s) (game 509) |
| Clone holder can open it | PASS | Conversation tag starts the RFID reader (`startRFIDMinigame` mode `clone`), Save sets `card_cloned` and `staff_clone_held`; door click: toast "Access granted: cloned staff badge accepted", `door_gate_player_opened`, player enters `staff_room`, objective completes, gate closes 2.5 s after the click (game 510) |
| Gate shuts after the clone window | PASS | `door_gate_closed` 2.5 s after the click (holdMs) |

## Findings

1. **`unlockRoom` needs an `unlockDoor` mapping on the NPC, and failure is silent.** Without `{ "eventPattern": "<anything>", "unlockDoor": "<room>" }` the route action retries every 5 s forever; Sam stood at the door for over 90 s (game 500) with only a console warning. Documented in the comment above `_runRouteAction` (`public/break_escape/js/systems/npc-behavior.js` around line 1610) but nowhere a scenario author looks, and the validator does not check it. Suggest a validator rule: any `route[].waypoints[].action.unlockRoom` needs a matching `unlockDoor` mapping on that NPC.
2. **A held guard turns back.** While an unpassed player stands within `openRadius` the gate stays shut, guard or no guard. A routed guard held there for 5 s (`GUARD_TURN_BACK_MS`) gives up that crossing (`turnBackFromGate`, event `door_gate_guard_turned_back`), carries on with his route on his own side and tries again next cycle, so his patrol never stops. The guard-priority open of early November 2026 (the gate opening for him after 5 s, with the player able to follow) was removed in the merge of 2026-11-10. Crediting entry on the pass global as well, as `lab_physical_pentest` does with `courier_ready`, is still good practice: the gate never shuts on a guard who is already in the doorway.
3. **`triggerOnInteract` on an object fires once per game**, so a "return the lanyard" toggle cannot reset `visitor_pass`. Not an engine bug; the fixture has no return tray.
4. Validator warning 16 ("no item declares card_id test_staff_badge") is a false positive: the card is on the NPC's `rfidCard`.
5. Minor: in game 506 the gate opened and shut again within 226 ms (60.78 s, 61.0 s) as the player stepped from just outside to inside `openRadius`. Harmless, but visible as a flicker.
