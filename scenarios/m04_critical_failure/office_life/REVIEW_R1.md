# m04 office-life plan review, round 1

Reviewer tier: planning tier, read-only. Partial: the reviewer stopped at its context guard. The items it did not reach are carried to round 2 as full scope.

Counts: B 0 / M 3 / m 3

## Findings and outcomes

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | major | The kettle gate on `vance_met` alone does not keep the clone private. Both the cover route (`ink/m04_npc_robert_vance.ink:230` to `:240`, `:329` to `:334`) and the ally route (`:631` to `:634`) set `vance_met` before any clone; the clone can then come later from the hub safety net (`:308` to `:317`, `:380` to `:384`) with the kettle on. | Fixed: `ops_kettle_off` clears only when `vance_met` and `vance_provided_keycard` are both true (set by `card_cloned` or the card pickup, `scenario.json.erb:1272` to `:1285`), through two mappings, one on each global, each checking the other. |
| 2 | major | Exchanges never play for an NPC with no `storyPath`: `exchangeLines` reads the owner's story JSON (`systems/npc-needs-chatter.js:183` to `:187`) and `_findExchange` treats null as pending forever (`npc-needs.js:3001` to `:3002`). | Fixed: `ibrahim_diallo` gets `storyPath` outright. That makes him talkable, so both newcomers get a short talk (one line, plus a variant after trouble), listed in spoken lines and the voicing count. |
| 3 | major | The cooler's second cell does not fit: the coffee table's legacy desk box blocks (240,208); `besideCell` (`npc-needs.js:5663` to `:5673`) then falls to (272,176) inside the cooler sprite. | Fixed: the cooler is capacity 1 (a solo drink, no chat). All pair talk is at the kettle. Moving the planter so the cooler takes a pair is a new question (Q6, dressing change). |
| 4 | minor | Kettle cells (210,117) and (242,117) are open and about 118 px from Vance; the north door lane is clear only if the door is at the west corner (x 48, `doors.js:196` to `:206`). | Fixed: build confirms the door position before writing the cells (test plan). |
| 5 | minor | Post y should be about 7.47 (positions are tile times 32 with no centre offset, `npc-sprites.js:325`). | Fixed: posts written as (6.7,7.47) and (7.47,7.47) estimates, measured at build. |
| 6 | minor | A newcomer hidden mid-use has no update to release its machine (`npc-behavior.js:384` to `:430`). | Fixed: the machines are off by then; L6 checks the kettle is free after the hide. |

## Questions settled

1. `room_entered:*` works: prefix match at `npc-events.js:52` to `:57`; `onceOnly` is per handler (`npc-manager.js:1264`) and a failed condition is not a fire; `setVisible: false` hides, unseats at once and is restored on reload (`npc-manager.js:1665` to `:1668`, `game.js:1830`). Neither validator rejects it (start-room NPCs are skipped, `validate_scenario.rb:4659`, `:4729`). `data.previousRoom` is in the payload (`core/rooms.js:3231` to `:3240`). Fallback kept only as a contingency.
2. Cells: see findings 3 to 5.
3. Clone privacy: not safe as written; see finding 1. No other route takes the newcomers into the ops office before the gate.
4. Walkthrough: there is no `WALKTHROUGH.md`. The folder has `stale_TESTING_WALKTHROUGH.md`; the current walkthrough is the HacktivityLabSheets page (`mission.json:7`), with the route suite `scripts/ink_runtime_check/m04_routes/`. BASELINE.md corrected.

## Carried to round 2 (not reached)

Head-count lines; credits `||` syntax; section 7 sync recount; 40-character and voiceable line rules; the cooler pair and the guard's `challengeOnSight`; kettle `offWhen` at load with a declared-true global; hostile leash and KO.
