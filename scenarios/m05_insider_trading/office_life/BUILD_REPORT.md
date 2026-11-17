# m05 office life: build report (slices 1 to 4 and 2A)

Branch plan/ol-m05. Data only: every change is in `scenario.json.erb` and the debrief ink. No engine change. Live runs headless, setFPS(20), fixed steps on, one fresh game per probe, server on :3092.

## What was built

- Slice 1, machines and presets: `officePresets`; `break_espresso`, `corridor_cooler` objects; globals `qdc_staff_upset`, `qdc_cooler_off`, `thandiwe_ko`, `niamh_ko`, `lisa_met`.
- Slice 2, the day pair: Thandiwe Moyo (seat tile (6,7)) and Niamh Doherty (6,5) at table 2, seated, leashed, with caffeine and thirst needs, a `qdc_staff` group, break mappings (Lisa's conversation sends Thandiwe for coffee, Niamh follows), cooler walks to the corridor, the goodbye seed on `server_badge_obtained`.
- Slice 3, the turns: Thandiwe hides on `room_entered:server_room` (plain) and again on the next break room and corridor entries (two `onceOnly`); Niamh stays at night; `qdc_cooler_off` set by `qdc_staff_upset` or `torres_identified`.
- Slice 4, trouble: six mappings on `agent_0x99_handler` (five trouble, two cooler switch, appended last); credits conditions and the "A MEMBER OF STAFF" line; debrief VARs, `friendly_kos()` and a 10 point trust cost for each newcomer KO; ink recompiled.
- Slice 2A, Lisa: one `tea` need, `lisa_met` first-talk gate, two trip mappings (`room_entered:open_office_area` and `reception_lobby`).

## Deviations from the plan

1. Espresso `useFrom` changed from (-1,1) to (0,1) (`scenario.json.erb`, about line 1859). With (-1,1) the first user stood in Lisa's column and every route from the seats ran up the aisle past her (closest approach 21 px); the second user fell to the kettle cell. Now first user (180,115), second (212,111).
2. Lisa's tea trip goes to the staff fridge (`qdc_fridge_milk`, Tiled item `qdc_fridge1`), not the kettle. The kettle cell is 25 px from her post, so a kettle trip was barely visible and she never walked back. `kettle1` is no longer declared.
3. Seat tiles moved: needsHome is the tile corner (x*32, y*32), so Thandiwe (6,7) and Niamh (6,5), not (6,6) and (6,4).

## Estimates, measured

| Estimate | Plan | Measured |
|---|---|---|
| Thandiwe leaves after Lisa's conversation closes | about 4 s | 2.8 to 3.0 s (5 of 5) |
| Thandiwe starts using espresso | within about 4 s | 4.5 to 4.9 s after close |
| Pair both at the espresso | yes | 5 of 5: Thandiwe 44 to 47 px from the machine centre, Niamh 67 to 71 px (5 of 5); Niamh (212..215, 81..84), Thandiwe (179..180, 80..84) |
| Route clearance from Lisa | at least 48 px | Niamh 48 to 52 px, Thandiwe 79 to 96 px (all samples, last tile included) |
| Lisa trip: leave, use, return | about 1 s walk | left post 4.8 to 7.9 s after the player left, use 0.8 to 1.3 s later, back 12.7 to 13.9 s after use start |
| Lisa walk-out distance | visible | 82 to 86 px from post |
| Lisa return accuracy | within 8 px | 22 to 32 px short, 5 of 5 (see Known items) |
| Break length, pair | about 30 s | 30 s away, 5 breaks |
| Sync budget | small | 4 flushes in 5 min, 6,892 bytes: 6,170 first (full seed), then 448 and two small deltas |
| Night reload | posts reset | see table |

## Checks

Games: 6975, 6989, 7093, 7099, 7100, 7101, 7102, 7121, 7122 (earlier runs, see handover) and, this run, 7135, 7139, 7141, 7146, 7150, 7184, 7186, 7187, 7188, 7190 plus the atk/KO/evening/night runs below.

| Check | Game | Result | Measured |
|---|---|---|---|
| Validator | | pass | 0 errors, 34 warnings |
| Lock and key diff vs baseline | | pass | empty |
| L1a route clearance | 7093 and earlier | pass | above |
| L1b Lisa talkable with pair using | | pass | 4 of 4 |
| L1c second user cell | | pass | (212,111) 5 of 5, never the kettle cell |
| L2 pamphlet with pair at espresso | | pass | try 1 |
| L3 five tries | 7184, 7186, 7187, 7188, 7190 | pass 5 of 5 | leaves 2.8, 2.9, 3.0, 2.9, 3.0 s; use starts 4.5, 4.7, 4.7, 4.9, 4.7 s |
| E-L1 trip and talk | various | pass | 5 of 5 each, talk at fridge and mid-walk 10 of 10 |
| E-L2 reload mid-trip | | pass | 5 of 5, one sprite, at post |
| E1 hidden on entry | 7141, 7175 | pass | Thandiwe vis false after server room, unseated |
| E2 no sprite on chair | 7175 | pass | seated false, alpha 0 |
| E3 night, Niamh stays | 7179 | pass (static); ten needs-minutes in ev.log | Niamh seated in break room, corridor empty, `qdc_cooler_off` true |
| E4 skip route | 7122 | Haiku FAIL was a harness artefact | its enter() calls failed with door-locked, so `server_room_entered` never became true and a seated Thandiwe was correctly visible. Her x of -124 is the break room's world offset (break room x origin about -312), not a parked sprite |
| E4 skip route, real route | 7141, 7150, 7139 | partial, see Known items | hidden on entry (vis false, alpha 0, body off); but visible for 36 to 44 frames (about 1 s) in the corridor view before entry |
| E5, E6, E7 | | not built | Bernadette is slice 6 |
| Evening reload | 7175 | pass | Thandiwe hidden, Niamh reseated, 1 sprite each, no errors |
| Night reload | 7179 | pass | `torres_identified`, `qdc_cooler_off` survive; Niamh seated, Thandiwe hidden, 1 sprite each |
| Attack Niamh | 7100, rerun | pass; Haiku FAIL was a misread | `isNPCHostile` stays true by design. She gave up the chase (`_gaveUpChase` true, state idle) 2 s after the player left, stood at (202,127), 34 px from her post (192,160), and stayed in the room 16 s. On re-entry she chases again, as the leash allows |
| Attack Lisa (no KO) | 7101 | expected | no leash is declared for Lisa in the baseline or the plan (leash only on newcomers), so a struck Lisa follows the player across rooms. Upset and cooler off set |
| KO Thandiwe | 7099, 7188 run | pass; Haiku "no walk home" is expected | a KO'd NPC stays down (idle, KO, 30 s) and keeps `thandiwe_ko`. Walk home applies to the unstruck staff |
| KO Lisa in front of pair | | not run | |
| Live debrief trust check | | not reached | needs the mission end (`mission_complete`); static check passed: both KO VARs count in `friendly_kos()` and cost `handler_trust` 10 |
| Cooler pair | 7121 | pass | two cooler uses; Niamh (445,61), Thandiwe (418,61) |
| Sync budget | 7121 | pass | above |
| Espresso pair screenshot | 7184 | pass | `screenshots/espresso-pair.png`, both at the machine, Lisa at post |
| Evening break room, Thandiwe gone | 7175 | pass | `screenshots/evening-break-thandiwe-gone.png` |

Note on `debugKO`: the test bridge KO does not emit `npc_attacked`, so it leaves `qdc_staff_upset` false. Use real punches (game 7099) for the trouble chain.

## Known items for review

1. Lisa's return stops 22 to 32 px short of her post (128,128). The engine ends a walk once within one tile of its goal (`npc-behavior.js:1402-1416`), and the walk home has no `arriveWithin` (`npc-needs.js:4139`). Data cannot fix it; options are an engine arrive tolerance or moving her post. Niamh after a chase stops the same distance short.
2. Skip route (server room before the break room): the break room is drawn from the corridor through the west door as soon as it loads, and Thandiwe is created visible there for about 1 s before `room_entered:break_room` hides her (`screenshots/e4-skip-route-corridor-view.png`). PLAN 2.10 gives the fix (`initiallyHidden` plus a `setVisible: true` reveal on first entry while `server_room_entered !== true`). Not applied: it would make her appear from nothing for every player on the usual first visit. Needs a decision.
3. A struck Niamh or Thandiwe stays hostile and standing, not reseated, after giving up the chase.
4. Lisa has no leash (baseline); a struck Lisa chases across rooms.
5. Two `onceOnly` keys on Thandiwe, none on Niamh; re-counted in section 7.

## To do

Slice 5 (needs the user's yes on `DIALOGUE_SAMPLE.md`): `storyPath` for Thandiwe and Niamh, chatter pools, exchanges `ex_whispering`, `ex_collection`, `ex_heading_home`, `heard_` globals, TTS (about 42 clips), walkthrough note.
Slice 6: Bernadette Lyons (NPC, art, bins, mappings, `bernadette_ko`, credits, debrief, trouble), Niamh's espresso coupling to her, `ex_late_again`, room tone, checks E5 to E7.
Open checks: KO Lisa in front of the pair, live debrief trust, E3 ten-minute rerun on the final build.
