# m05 office life: build review, round 1

Build: branch `plan/ol-m05`, HEAD `9b7181245` (main merged). Slices 1 to 4 and 2A. Slices 5 (lines) and 6 (Bernadette) are not built and are reviewed only for blockers. Static review plus the build's own live results (`BUILD_REPORT.md`); no live run in this round. This round stopped at the context limit: see "Carried to R2".

Line numbers are in `scenarios/m05_insider_trading/scenario.json.erb` unless another file is named.

## Static checks run this round

| Check | Result |
|---|---|
| Validator | 0 errors, 34 warnings (same count as the build report) |
| Lock and key diff vs `baseline_locks.json` | empty |
| V1 summary diff vs base | only `lisa_park` (needs, leash), `thandiwe_moyo`, `niamh_doherty` changed; matches the plan |
| Object positions (recipe section 9, base render vs HEAD) | only three added rows: `break_espresso`, `qdc_fridge_milk`, `corridor_cooler`, all Tiled-claimed. No item, container or `itemsHeld` row moved; the pamphlet row is unchanged |
| Tiled twins | one each of `qdc_espresso1`, `qdc_fridge1`, `water_cooler1` in their maps, so no twin is hidden by a claim |
| Secrets on office-life objects | none: the three objects carry observations only, no readable text, item type, PIN or code |
| Owen, open office, pamphlet | untouched by the diff |
| Spoken lines | none added yet; the only new text is a credits line and ERB comments. No engine text spoken |
| Sync | new keys: 5 scalar globals, 6 handler `onceOnly` keys, 3 more `onceOnly` (Lisa 1, Thandiwe 2), `npcVisibility` for Thandiwe. All bounded scalars sent as per-key deltas (`state-sync.js:43`); the build's measured 6,892 bytes over 5 min with small deltas after the seed agrees |
| `bin/test-js` | still running at the context limit; carried to R2 |

## Findings

Counts: B 0, M 2, m 5, n 3.

### M1. Skip route: Thandiwe is seen in the break room, then vanishes on entry

`:1816` to `:1818` (her three hide mappings). On a route that reaches the server room before the break room, her mappings register only when the break room loads (door open from the corridor, `doors.js:883`), so she is drawn seated and visible from the corridor (`screenshots/e4-skip-route-corridor-view.png`) until `room_entered:break_room` hides her in the player's view. The build measured about 1 s at walking pace, but the time is however long the player stands in the corridor after opening the door: a player who opens it and turns away sees her the whole time, then sees her disappear on entry.

Ruling on known item 2: do not use the `initiallyHidden` fallback. Fix in data: add a fourth mapping on Thandiwe, `{ "eventPattern": "door_opened", "condition": "data.connectedRoom === 'break_room' && globalVars.server_room_entered === true && globalVars.thandiwe_ko !== true", "onceOnly": true, "setVisible": false }`. `door_opened` is emitted after the room's load promise resolves, so after her mappings are registered (`doors.js:951`, inside `processRoomDoors`, which waits on `loadRoom`). Visibility is saved (`npc-manager.js:2204` to `:2223`), so a reload keeps her hidden. Proof: rerun E4 on the real skip route, count her visible frames from door open, five tries; if any frame remains, the engine follow-up is a `hiddenWhen` global read at registration (`npc-manager.js:353` to `:356` is where saved visibility already wins). Re-count `onceOnly` keys in PLAN section 7 (one more).

### M2. Thandiwe and Niamh have no `storyPath`; clicking one shows "Failed to load conversation"

`:1790` to `:1850`. Both are person NPCs with no story. `person-chat-minigame.js:476` to `:499` loads `npc.storyJSON` or `storyPath`, and with neither shows `showError('Failed to load conversation')`. Interaction with them was never tested (`tmp/handover/M05_BUILD_HANDOVER.md`, session 1). Slice 5 adds their three-line conversations and closes this. Fix: this branch must not go to a train before slice 5 lands; slice 5's checklist should include an interact test on both, seated and at each machine. No placeholder ink as a stop-gap (skill rule).

### m1. Lisa returns 22 to 32 px short of her post (known item 1)

`:1778` (`needsHome`). Cause confirmed: `_goHome` passes no `arriveWithin` (`npc-needs.js:4144`), so the 1-tile guard ends the walk (`npc-behavior.js:1408` to `:1420`), and `_acceptArrival` accepts it within `ARRIVAL_NEAR_PX` (`npc-needs.js:751`). Ruling: accept for m05. She ends nearer the counter and kettle, which is still where the ink places her ("by the kettle", "by the break room counter"), the short spot does not drift (each return aims at the post again), a reload puts her back on the tile, she is standing not seated, and the chat background is the same left half of the split break-room image at both spots (`:1746` to `:1749`, x below 0.6). Her conversation and post-fate lines name no tile. Engine follow-up, outside this pass because it changes every mission's walk home: pass `arriveWithin: HOME_EPS` from `_goHome`, which keeps the existing 1.5 s held-cell fallback; it needs unit tests and m02/m03 re-measures. Log it in `docs/IDEAS_BACKLOG.md` or the engine queue, and correct PLAN 2A's "within 8 px" pass mark to "within one tile".

### m2. A struck newcomer stays hostile, standing off her post, for the rest of the game

PLAN people table and 2.2 say a struck newcomer "gives up the chase at the leash and walks back to her post". Built behaviour (BUILD_REPORT known item 3): hostile stays true, so `isAvailable` blocks the needs layer (`npc-needs.js:1237` to `:1240`, `:1418` to `:1426`) and she stands about 34 px from her chair, unseated, and chases again on re-entry. It is the cost of the player's own attack and matches the existing hostile model, so accept, but the plan text is wrong. Fix: correct PLAN 2.2 and the people table to the measured behaviour; if a reseat is wanted, that is an engine change (a leashed NPC dropping hostility after a time out of reach) for another pass.

### m3. Relay warnings on four new mappings

Validator warnings 11 to 15: `:1783`, `:1784` (Lisa's trip triggers), `:1818` (Thandiwe's corridor hide), `:1845` (Niamh's corridor break), `:1847` (`server_badge_obtained` goodbye seed) listen for events that can fire before the break room loads. Missing them is correct in each case (Lisa's need `lisa_met`, which needs the break room; Thandiwe's corridor hide is backed by the break-room hide and by M1's fix; Niamh's breaks only matter once she is loaded). Fix: add `"fireOnlyWhenLoaded": true` to each so the warnings clear and the intent is in the data. Exception: the goodbye seed on `server_badge_obtained` loses its point if the badge is taken before the first break-room visit; that is acceptable (the exchange is optional), but say so in PLAN 2.7.

### m4. The trouble mappings are generated by an ERB loop

`:1553` to `:1555` (the `%w[...].each` loop). The skill's after-slice check says "office-life keys never inside an ERB loop or tag". The validator renders the ERB, so nothing is broken today, but the loop hides four mappings from text search and from anyone reading the source for `npc_attacked:lisa_park`. Fix: write the four mappings out as literal JSON lines, in the same order, so no saved once index moves (they are appended last either way).

### m5. No `positions_base.txt` was saved at stage 0

`office_life/` has no `positions_base.txt` (skill stage 0). This round rebuilt it from the merge base (render of the base file, recipe section 9) and the diff is clean (above), so nothing is lost. Fix: save `positions_base.txt` from the merge-base render into `office_life/` so later rounds and slice 6 (Bernadette's bins) diff against a committed file.

### n1. Stale comment: "one kettle trip"

`:1775` to `:1777` (Lisa's ERB comment) still says "one kettle trip"; the trip is to `qdc_fridge_milk`. Fix the comment. Same in ANALYSIS section 1, Lisa's row ("one fridge trip" is right there, but the "Beats" bullet still says "talkable at the kettle" in the PLAN people table).

### n2. Chat background boundary at the newcomers' seats

The break-room `chatBackground` splits at x 0.6 (`:1746` to `:1749`), which is x 192, the column of both newcomers' posts (6,5) and (6,7). A chat with Niamh or Thandiwe at her seat may take the right image and at the espresso (x about 180) the left one. Harmless, since both halves are the same room, but slice 5 should check which half each seated chat shows and that it reads correctly.

### n3. Debrief and credits coverage (known item 4)

Static: `friendly_kos()` and the trust penalties count `thandiwe_ko` and `niamh_ko` the same way (`m05_closing_debrief.ink:99` to `:104`, `:177` to `:182`), and the credits line reads `thandiwe_ko || niamh_ko` (`:290`). The two branches share every line, so Niamh's live KO plus game 7099's `thandiwe_ko` true is enough evidence for Thandiwe. The `player_approach == "diplomatic"` branch is reached only through `friendly_kos() > 0`, which the -10 live result already proves is counting the newcomers; the remaining gap is only that the line was not seen on screen. Fix: no extra probe now; add one diplomatic-briefing debrief run to the slice 6 live set, which must re-run the debrief for `bernadette_ko` anyway.

## Rulings on the known items

1. Lisa short of post: accept for m05, engine follow-up logged (m1).
2. E4 skip route: data fix with a `door_opened` hide (M1), not `initiallyHidden`.
3. "Not sent while upset" after Lisa's KO: enough, on static grounds. Every source the three can use is off on `qdc_staff_upset` (`break_espresso` `:1854`, `qdc_fridge_milk` `:1868`) or on `qdc_cooler_off`, which is set by the same event (`:1556`, cooler `:1724`); every mapped break is conditioned `!globalVars.qdc_staff_upset`; `officePresets` gives no preset to undeclared Tiled machines (both vending machines and the kettle are undeclared). With no source, an urgent need parks, so the 31/81 levels in game 7194 do not weaken the result. No rerun needed.
4. Debrief coverage: enough for now; carry the diplomatic line to slice 6 (n3).
5. E3 ten-minute rerun: still open. It must run on the build after M1 and slice 6, since Bernadette changes the night break room; run it once then, not twice.

## Checked and clean

- Hidden Thandiwe takes no trips and cannot be pulled by Niamh's cooler coupling (`:1815`), because a hidden NPC is unavailable (`npc-needs.js:1395`, body disabled) and is blocked before any job. So no invisible partner at the cooler or espresso in the evening.
- Night: `qdc_cooler_off` on `torres_identified` keeps Niamh out of the dark corridor; she can still use the espresso alone.
- Trouble globals are monotonic, so `qdc_cooler_off` needs no clearing rule; the two set mappings live on the phone NPC registered at game start and are appended last.
- Thandiwe's evening hide is saved in `npcVisibility` and survives a reload (`npc-manager.js:353` to `:356`), matching the evening and night reload passes.
- Whodunnit names and voices (ANALYSIS section 1): Thandiwe Moyo (Pulcherrima) and Niamh Doherty (Leda) clash with no suspect, family or CEO name and no voice already in m05.
- No `patrolOverride`, `interests`, `workarounds` or `npc_arrived` mapping on any needs NPC; Lisa's need is met only in her own room and her trips wait for `lisa_met`, so she is found at post first.

## Carried to R2

- `bin/test-js` result (run started this round; output in the scratchpad `m05-r1/testjs.txt`, may be cleared).
- A closer read of PLAN 2.13 and section 10 against the slice 6 plan for blockers (only the parts that touch built data were checked: `offWhen` on the espresso, the credits condition and debrief VARs need `bernadette_ko` added in slice 6).
- `useFrom`/`queue` cells at the corridor cooler against the door and the vending machine (built from the cooler pair positions only).
- Re-check M1's fix live (E4, five tries) and the `fireOnlyWhenLoaded` edits once applied.
