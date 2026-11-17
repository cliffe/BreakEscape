# m05 office life: build review, round 3

Build: branch `plan/ol-m05`, HEAD `760becd3c`. Full review of the office-life build against `PLAN.md` and the mission-office-life skill, read-mostly, no server run. Live evidence is the fixer's (games 7394 and 7401, BUILD_REPORT "R2 fixes") and the slice 6 table. Line numbers are in `scenarios/m05_insider_trading/scenario.json.erb` unless another file is named; engine paths are under `public/break_escape/js/`. No engine file differs from the merge base `9dc98ab6c`, and main has not touched `scenarios/m05_insider_trading/` since that merge, so the diff below is the whole build.

## Checks run this round

| Check | Result |
|---|---|
| Validator (`--no-graph`) | 0 errors, 29 warnings, the same set as R2. Office-life warnings: Bernadette's `room_entered:break_room` pair (indices 1 and 4, the `onceOnly` show and the evening break, intended), the two cooler-in-another-room warnings, the four V4 attack warnings |
| Lock and key diff (`lock_key_diff.rb` against `office_life/baseline_locks.json`) | "lock and key diff: empty" |
| `onceOnly` count | 14 `onceOnly` lines added against the merge base: Thandiwe 3 (`:1830` to `:1832`), Bernadette 3 (`:1915` to `:1917`), trouble 5 (`:1558` to `:1562`), cooler switch 2 (`:1563`, `:1564`), Lisa 1 (`:1789`). Matches PLAN section 7 (`PLAN.md:326`) |
| Trouble reorder | The whole trouble and cooler-switch block is new and sits after the ERB `hear_debrief` loop, which ended main's list (`:1548` to `:1555` in HEAD); `npc_attacked:bernadette_lyons` is now fifth of the five (`:1562`). No main-side index moved. The mappings fire on five different events and set the same monotonic global, so their order changes no behaviour; only once keys saved by dev games of earlier branch builds shift (BUILD_REPORT, R2 n1) |
| Lisa's mappings | Main's `lisa_park` has no `eventMappings`, so `conversation_closed:lisa_park` at index 0 moves nothing |
| KO guards (d) | All four Bernadette shows carry `globalVars.bernadette_ko !== true`: plain `room_entered:server_room` (`:1914`), `onceOnly` `room_entered:break_room` (`:1915`), `room_entered:main_corridor` (`:1916`), `door_opened` (`:1917`). Her fifth mapping (`:1918`) and Niamh's coupling (`:1875`) set needs only and never show her. No ink file sets her visibility (her ink and the debrief only read `bernadette_ko`). In the engine, `setNPCVisible` (`systems/npc-behavior.js:384`) is reached only from a mapping's `setVisible` (`systems/npc-manager.js:1655` to `:1659`); the other `setVisible(true)` calls in `core/rooms.js:3105` and `:3161` reveal objects, not NPC sprites. So there is no fifth show path |
| Cooler cells (a) | Pass, see below |
| Plot safety, VM flags, sync | Unchanged since R2, which covered them; the R2 fixes touched conditions, one `needs.set` and one mapping position only |

### (a) Corridor cooler `useFrom` cells

`:1731` to `:1739`, `useFrom { dx: 1, dy: 1 }`, `queue: false`; the preset gives capacity 2. `approachCell` asks for the nearest walkable cell within one cell of the object's centre plus (32,32) (`systems/npc-needs.js:5436` to `:5443`).

- Cooler (`room_qdc_hall.json`): sprite x 76 to 100, y 39 to 86, centre (88,62.5); collision rect x 78 to 98, y 78 to 86. The vending machine's collision is x 186 to 224, y 80 to 88. Those two rects are the only collision in the room's object layer.
- Grid marking (`systems/npc-pathfinding.js:354` to `:369`, step 8 from `utils/constants.js:37`): one extra cell on each side and 2 px up and down, so the cooler blocks cells x 64 to 112, y 72 to 88 (local).
- First user: target (120,94.5), cell centre (124,92). Second user: the cell at about (98,93). Both sit in row y 88 to 96, below the blocked band. A standing body (18 by 10) at (98,93) spans x 89 to 107, y 88 to 98: 2 px below the cooler's collision, with no overlap. The live pair in game 7121, Niamh (445,61) and Thandiwe (418,61), match these two cells if the corridor's world origin was (320,-32) in that game.
- Lanes: the west door is at (16,80), so its lane is x 0 to 32. The north and south doors are single doors at x 48 or x 272 (`systems/doors.js:195` to `:210` and the matching north function). A user occupies x 89 to 134, y 88 to 98, which is 25 px or more clear of the x 48 lane, and the room is open below row 3 for an east to west crossing. The vending machine is 50 px or more east of the first user.

No overlap and no door lane blocked. The carried item is closed.

## Findings

Counts: B 0, M 0, m 0, n 4.

### n1. Bernadette's espresso route keeps exactly 48 px from Lisa: accept, measure the walk back

`:1898` (`needsHome` (5,7)); BUILD_REPORT "R2 fixes", M1 row; `tools/playtest/m05-ol-l1a-bernadette.mjs`.

Judgement: the zero margin is acceptable, for these reasons.
- The route stays off the aisle in all five tries. Running up the aisle was the failure PLAN 2.3 was written to prevent.
- The probe samples every 60 ms, but at the closest approach the distance curve is flat, so a sample a few px either side of that point reads under 0.1 px high. The only error that matters is `Math.round`, worth half a pixel.
- Contact is impossible at this spacing. Bodies are 18 by 10, so 48 px between centres leaves about 30 px clear. A needs walk also routes round every standing body with a one-cell ring (`_avoidDynamicPositions`, `systems/npc-pathfinding.js:497` to `:530`), which works against any drift west towards Lisa.
- Niamh's route was accepted at 48 to 52 px in slice 2 (BUILD_REPORT, "Estimates, measured"), so Bernadette passes at the same spacing.
- When Lisa comes back from her fridge trip she stops 22 to 32 px short, on the west side, away from this route, which widens the gap.

None of the listed levers is worth its cost. (6,7) lies on Thandiwe's chair and the bins. `needsDeferMin` sets how long a given-up need stays parked and has no effect on routing (`systems/npc-needs.js:101`, `:1914`). A new espresso `useFrom` would also move Niamh's and Thandiwe's use cells and break the measured L1c second-user cell. A post further south (5,8) would not help, because the closest approach comes on the stretch north of table 2, not at the post.

Residual: R2 asked for "out and back", and the probe measured only the walk out. It records from the moment caffeine is set until `phase === 'using'`. On the return the pathfinder could break ties differently. Failure scenario: the walk back runs closer than the walk out, and nobody has measured it.

Fix: extend the probe to track the return leg in each of the five tries, from the end of `using` until `mode === 'idle'`, with Lisa at her post. Record the minimum distance between Lisa's and Bernadette's `npcPos` and Bernadette's minimum x for each try. Pass if every try reads at least 47 px (48 minus the rounding) and minimum x stays at 159 or above, meaning she never enters the aisle. If any try fails, the cheapest fix is a needs `interests` or post change, which is a design decision and goes back to the plan. Expect a pass.

### n2. Replacement for "Still here? You'll wear that chair out."

`:1904`; `office_life/SPOKEN_LINES.md:65`; `DIALOGUE_REVIEW.md:193`. A pool line plays at the machine while the pair are using it, so Niamh is standing at the espresso whenever this line is heard, never sitting. The line is wrong every time it plays, not now and then. Nothing of Bernadette's is voiced yet, so swapping it costs nothing.

Fix: replace it with **"One cup, then I'm back on the hoover."** (37 characters). It fits the coffee pool, reads aloud cleanly, and matches her dry, workaday voice ("Last floor before I'm done.", "Just the bins, love."). It names no person, place, badge or plot item, and repeats no existing line in the mission. Alternative: "This thing's louder than my hoover." (35), which answers Niamh's "Is it meant to make that noise?" if the pair hear each other's pools. Change the line at `:1904` and in `SPOKEN_LINES.md:65` with its count. The V6 clip count is unchanged. Run `npc-dialog-review` on the new line before any voicing request.

### n3. Two stale notes on the KO guard and the reset

- `PLAN.md:196` still ends the `room_entered:break_room` bullet with "(no KO guard needed: a `onceOnly` cannot repeat)", while the same bullet adds the guard for R2 m1. The reason given is wrong: a guarded `onceOnly` is not spent while its guard is false, and that is why the guard is needed.
- The ERB comment at `:1878` to `:1879` says she is "shown on the evening turn ... by three mappings that also reset her needs". There are four shows now, and only the three `onceOnly` ones reset her needs (R2 m3).

Failure: a later editor reads either note and drops a guard or puts the reset back on the plain mapping. Fix: delete the parenthesis at `PLAN.md:196`; reword the comment to "shown on the evening turn (server_room_entered) by four mappings; the three onceOnly ones also reset her needs, so her timing starts at the reveal."

### n4. The engine follow-up for short parking is still not in the backlog

R1 m1 carry (R2 table: "Engine follow-up still to be logged in `docs/IDEAS_BACKLOG.md`"). Nothing in `docs/IDEAS_BACKLOG.md` covers the walk home ending within one tile of the goal (`systems/npc-behavior.js:1402` to `:1416`, no `arriveWithin` on the return, `systems/npc-needs.js:4139`). The 22 to 32 px short park affects Lisa, Bernadette (about 25 px, slice 6 table) and Niamh after a chase. Fix: add one backlog line with these references when the branch lands. The backlog is a shared file, so the line goes in through the train, not a separate commit on main.

## Round 2 findings

| R2 | Status |
|---|---|
| M1 route past Lisa, L1a unmeasured | Measured: 48 to 51 px, no aisle use, post kept. Zero margin accepted (n1 above). The return leg is still unmeasured, now a nit |
| m1 KO'd Bernadette re-shown | Fixed: guards on all four shows (`:1914` to `:1917`); live proof in game 7401 (body stays disabled, unmoved). No fifth show path exists |
| m2 slice 6 live checks and report section | Fixed: BUILD_REPORT "Slice 6" covers the reloads, the reception start, both diplomatic debriefs, the E3 reruns, `bin/test-js` 752 of 752, the validator and the lock and key diff |
| m3 needs reset on every server-room entry | Fixed: no `needs.set` on `:1914`; the three `onceOnly` shows keep it. Live in game 7401 (decay only on a repeat entry). On the usual route the reset now comes at the next corridor entry, which is still out of the player's sight |
| n1 trouble mapping mid-block | Done: moved to fifth of the five trouble mappings (`:1562`); safe, see the checks table |
| n2 provisional voice | Checked: `_comment` at `:1887`; carry to the voicing step |
| n3 chair line at the espresso | Replacement proposed (n2 above) |
| Carried: cooler cells | Pass (section (a)) |
| Carried: bins cell | Accepted on the slice 6 live measure (16 px clear of the vending machine); the cell resolved from `useFrom { dx: 1, dy: -1 }` lies below the vending machine's padded band (y 184 to 200), as measured |
| Carried: `onceOnly` count | 14, matches the data and PLAN section 7 |

Verdict: clean. No blocker, major or minor finding remains. The four nits are documentation, one line swap and one optional return-leg measurement, and none of them holds back the train.
