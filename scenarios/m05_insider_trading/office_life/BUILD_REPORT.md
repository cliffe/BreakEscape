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
| Lisa return accuracy | within one tile (was 8 px; relaxed by R1 m1) | 22 to 32 px short, 5 of 5, accepted (see Known items) |
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
| E4 skip route | 7122 | scripted-run FAIL was a harness artefact | its enter() calls failed with door-locked, so `server_room_entered` never became true and a seated Thandiwe was correctly visible. Her x of -124 is the break room's world offset (break room x origin about -312), not a parked sprite |
| E4 skip route, real route | 7141, 7150, 7139 | partial, see Known items | hidden on entry (vis false, alpha 0, body off); but visible for 36 to 44 frames (about 1 s) in the corridor view before entry |
| E5, E6, E7 | | not built | Bernadette is slice 6 |
| Evening reload | 7175 | pass | Thandiwe hidden, Niamh reseated, 1 sprite each, no errors |
| Night reload | 7179 | pass | `torres_identified`, `qdc_cooler_off` survive; Niamh seated, Thandiwe hidden, 1 sprite each |
| Attack Niamh | 7100, rerun | pass; scripted-run FAIL was a misread | `isNPCHostile` stays true by design. She gave up the chase (`_gaveUpChase` true, state idle) 2 s after the player left, stood at (202,127), 34 px from her post (192,160), and stayed in the room 16 s. On re-entry she chases again, as the leash allows |
| Attack Lisa (no KO) | 7101 | expected | no leash is declared for Lisa in the baseline or the plan (leash only on newcomers), so a struck Lisa follows the player across rooms. Upset and cooler off set |
| KO Thandiwe | 7099, 7188 run | pass; scripted run "no walk home" is expected | a KO'd NPC stays down (idle, KO, 30 s) and keeps `thandiwe_ko`. Walk home applies to the unstruck staff |
| KO Lisa in front of pair | 7193, 7194 | pass | see section below |
| Live debrief trust check | 7216, 7212 | pass | `handler_trust` 40 after a Lisa KO and after a Niamh KO, 50 with no trouble; see section below |
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
Open checks: E3 ten-minute rerun on the final build.

## Live checks: KO Lisa and debrief (headless, setFPS 20, fixed steps on, keyless server :3092)

Probes: `tmp/handover/m05live/kolisa.mjs`, `kolisa2.mjs`, `deb.mjs` (gitignored). Games 7193 and 7194 (KO Lisa), 7214, 7216 and 7212 (debrief). Every KO is by real punches (`f` key), so `npc_attacked` fires.

### 1. KO Lisa Park with the break-room pair present: PASS

| Measure | Result |
|---|---|
| Punches | hostile after 1, KO after 10 (both games) |
| Events in order | `npc_hostile_state_changed`, `npc_attacked:lisa_park`, `qdc_staff_upset` true, `qdc_cooler_off` true, `npc_ko:lisa_park`, `lisa_ko` true |
| Globals after | `lisa_ko` true, `qdc_staff_upset` true, `qdc_cooler_off` true, `niamh_ko` false, `thandiwe_ko` false, `lisa_met` false (struck before the first talk) |
| Niamh and Thandiwe | stayed at their chairs, (196,136) and (196,195), not hostile, idle, for 12 s after the KO and again 8 s after leaving and re-entering. No flee, no barks, no walk to the espresso. This matches the plan: trouble is machines off and no `patrolOverride`; the plan adds no KO bark |
| Needs drive (game 7194) | `thandiwe_moyo` caffeine and `niamh_doherty` thirst and caffeine set low, 40 s watched: no `npc_use_started`, both stayed idle at their chairs. The levels read 31 and 81, not the 2 requested, and did not fall, so the test is weak. The controls that show the same set does send them when calm are L3 and the E-L1 table above |
| Lisa | KO body stays at (127,98), idle, hostile and KO flags both true |
| Progress | left to the corridor and back; `entropy_pamphlet` still active and interactable, pickup `found_pamphlet` true, notes in inventory. No console errors (`errs` empty) in either game |

Not checked: the objective `talk_to_lisa` completing is moot here (Lisa is KO'd; the `lisa_ko` path is the baseline's).

### 2. Live debrief: PASS

Setup: `new-game.rb --start-room break_room --carry-npc closing_debrief_trigger` with `final_choice`, `torres_identified`, found flags and `server_room_entered` set, `--complete-task submit_flag1` to `4` (the `concludeRequires` list). Without the four tasks the server answers "Not Yet" and no credits show. `mission_complete` was written with `writeGlobal` (the HaX call-in path sets it in the ink; its event is what opens the debrief). A game that has already shown the debrief will not replay it, so each run used a fresh game.

| Run | Game | Debrief | Staff lines in the credits | `handler_trust` | Errors |
|---|---|---|---|---|---|
| No trouble | 7214 | played, 37 spoken lines | "Nobody on staff hurt" | 50 | none |
| Lisa KO'd | 7216 | played, adds "Lisa Park ran the collection for Elena. She's off work with a head injury." | "LISA PARK: off work with a head injury" (no "Nobody on staff hurt") | 40 | none |
| Niamh KO'd | 7212 | played | "A MEMBER OF STAFF: HURT, ON YOUR ACCOUNT" (no "Nobody on staff hurt") | 40 | none |

- The credits text was read from `#bv-cr-label` line by line; the rest of the credits (case, Torres family, recruiter, QDC) is identical across the three runs.
- Thandiwe's KO was not landed in the 7212 run (30 punches in the probe did not finish her), so only Niamh's KO is live-proved for the "member of staff" line and the -10. The two share the same ink and credits condition (`thandiwe_ko || niamh_ko`), so the Thandiwe path is covered by the static check and by game 7099's `thandiwe_ko` true.
- When optional objectives are open, the engine shows the "Before the mission ends" overlay (Keep going / End the mission now) before the debrief; it appeared in the Lisa run and had to be answered with "End the mission now". It is the engine's ending check, not an office-life change.
- Not exercised: the debrief's `player_approach == "diplomatic"` branch ("You said you'd read the room..."), because the probes did not play the briefing choice. The trust -10 does show live, and the static `friendly_kos()` check passed earlier.
- The `bernadette_ko` credits term from PLAN 2.11 is not in the scenario (slice 6 not built).

## R1 fixes (build review R1, `BUILD_REVIEW_R1.md`)

| Item | Fix | Proof |
|---|---|---|
| M1 | Fourth mapping on `thandiwe_moyo`: `door_opened`, condition `data.connectedRoom === 'break_room' && globalVars.server_room_entered === true && globalVars.thandiwe_ko !== true`, `onceOnly`, `setVisible: false`. Payload fields checked in `systems/doors.js:951` (`roomId`, `connectedRoom`, `direction`). No `initiallyHidden`. PLAN lazy-load gap paragraph and section 7 updated (Thandiwe now has three `onceOnly` keys, total 13) | Live, skip route (server room first, then open the break room door from the corridor and stay there): games 7229 to 7233, every animation frame sampled from door open for about 3.5 s (209 to 223 frames each with her sprite present), visible frames 0 in all five tries. Day route (no server room), game 7234: visible 211 of 211 frames. Screenshots `screenshots/e4-r1-skip-route-door-open.png` (Lisa and Niamh in view, Thandiwe's chair empty) and `screenshots/e4-r1-day-route-door-open.png`. No page errors |
| M2 | None, by decision. Thandiwe and Niamh have no `storyPath`, so clicking either shows "Failed to load conversation". **This branch must not go to a train before slice 5 lands**; slice 5's checklist must interact with both, seated and at each machine | n/a |
| m1 | Pass mark relaxed: Lisa stopping 22 to 32 px short of her post is accepted (table row above, PLAN E-L1). `_goHome` passes no `arriveWithin` (`npc-needs.js:4144`), so the walk-end guard (`npc-behavior.js:1408` to `:1420`) ends the walk within one tile. The engine change (`arriveWithin: HOME_EPS` from `_goHome`, with unit tests and m02/m03 re-measures) is logged separately, not done here | Static |
| m2 | PLAN 2.2 and the people table corrected: a struck newcomer stays hostile and standing about 34 px off her chair; she does not walk back to her post. PLAN section 10.4 (attack and KO check) text matches | Static |
| m3 | `fireOnlyWhenLoaded: true` on the five mappings of validator warnings 11 to 15 (Lisa's two trip triggers, Thandiwe's corridor hide, Niamh's corridor break, Niamh's `server_badge_obtained` seed). The seed's miss when the badge is taken before the first break-room visit is accepted and noted in PLAN 2.7 | Validator: 0 errors, 29 warnings (was 34); the five are gone and no other warning changed |
| m4 | The ERB loop over the four trouble events is written out as four JSON mappings in the same order, so no saved once index moves | Validator and lock/key diff clean |
| m5 | `positions_base.txt` saved: the object position recipe (`measurement-recipes.md` section 9, `LockKeyDiff.render`) run on `scenario.json.erb` as it was on the main side of the merge (`9b7181245^2`, no office life), 40 rows | Diff against the current render: three added rows only (`break_espresso`, `qdc_fridge_milk`, `corridor_cooler`), matching the review |
| n1 | Stale "one kettle trip" comment now reads "one fridge trip" | Static |

Server for the proof: keyless (boot log warning present), :3092, puma PID 3378834, stopped at the end. Headless, `setFPS(20)`, fixed steps on, no `/tts` request. Games used, all printed by `new-game.rb` in this run: 7229 to 7234. No game row edited.

## Slice 5 (spoken lines and conversations), partial

Commit 8bd7d2c93. Scenario data and ink only; no engine change.

- Conversations: `ink/m05_npc_thandiwe_moyo` and `ink/m05_npc_niamh_doherty` (`storyPath`, `currentKnot: start`). Opener, one optional line behind a choice, goodbye. A `hub_quiet` flag skips the opener once after the exit tag so a reopen prints it again. Both lines of text come from `SPOKEN_LINES.md`; two player choice labels per conversation are new (no voiced clip).
- Pools: 8 lines each (coffee and cooler), as written. Exchanges `ex_whispering`, `ex_collection`, `ex_heading_home` on Niamh in plan order; globals `heard_ex_*` declared `false`.
- Validator 0 errors, 27 warnings (was 29: the two "chatter has no lines" warnings cleared). Lock and key diff empty.
- V6: 27 clips (Niamh 13, Thandiwe 14), all uncached. Plus 6 conversation lines, which V6 does not count: 33, which is SPOKEN_LINES.md's 42 minus Bernadette's 9 (slice 6).
- Live (keyless :3092, game 7241): both seated chats open with no "Failed to load conversation", show the same break-room background (n2 reads fine), and reopen cleanly; no page errors.
- Open: chat at each machine, exchange once-only, pool lines at both machines, reload mid-day, full `bin/test-js`.

## Slice 5 checks and dialogue fixes

Live runs on a keyless server at :3092, headless, setFPS(20), fixed steps on, fresh games (7262 aborted by a probe bug, 7263 for the results). No /tts request.

### Pool bubble verdict: probe mistake, not a gap

The earlier "fail" (checks 3a and 3b) read `npcNeedsSystem.states.get(id).saying` and listened for `npc_mutter` and `npc_announced`. Neither is where pair chatter goes. `saying` holds a lone grumble (`_pickBark` for mutters); a pair's lines live in the chat record (`_chats`, `c.current`) and are emitted as `npc_chatted:<objectId>`. The `npcThoughts: false` gate only removes picture chat (`chatterPool(...).pictures`); spoken pool lines are untouched. Read with `npcNeedsSystem._talking(id)` and `npc_chatted:*` events, both pools play:

- Espresso, first meeting: Thandiwe "I'll descale this tomorrow. Probably." (pool, heard), then `ex_whispering` in full.
- Espresso, later meeting after a reload: Thandiwe "I'll descale this tomorrow. Probably.", Niamh "Is it meant to make that noise?" (pool, heard). No exchange.
- Cooler, first meeting: `ex_collection` in full. After a reload: Thandiwe "Facilities never fixed that blind.", Niamh "Tomorrow's all-staff won't write itself." (pool, heard).

No scenario or engine change was needed. At the first cooler meeting the exchange took the whole overlap, which is why a single 75 s window there showed no pool line.

### Check 2e: pass

After a reload (all three `heard_` globals persisted), both staff were using the espresso together for the full window (`both` true, chat events logged) and `needs.log()` held no exchange entries. Pool lines played instead.

### Dialogue fixes applied (DIALOGUE_REVIEW.md M1, m1 to m4)

| Id | Was | Now |
|---|---|---|
| M1 | Lisa says they don't send just anyone. | Apparently they don't send just anyone. |
| m1 | Who keeps leaving the jug empty? | Who keeps leaving the milk jug empty? |
| m2 | Ten more minutes, then the deadline. | Nearly there with this deadline. |
| m3 | Right, that's me after this one. | Right, I'm off once I've finished this. |
| m4 | Excuse me, I've a parcel to chase. | Thanks. These parcels won't chase themselves. |

m5, m6 and n1 to n4 not applied, as briefed. Ink recompiled. Validator 0 errors, 27 warnings. lock_key_diff empty. V6: 27 clips, all uncached.

## Slice 6: Bernadette Lyons, live checks and close-out

Build commits 7c4adf286 onwards (see git log). Live runs on a keyless server on :3092 (boot log shows the missing-key warning), headless, setFPS(20), fixed steps on, one fresh game per run, ids printed by `new-game.rb`. The engine asks for `/tts` whenever a line shows and the keyless server answers 503, so the scripts abort `/tts` at the network layer (`tools/playtest/m05-ol-lib.mjs`) and nothing requested it by hand. No game row edited. Scripts: `tools/playtest/m05-ol-*.mjs`.

| Check | Games | Result | Evidence |
|---|---|---|---|
| E5 skip route, no pop-in after the `door_opened` show | 7287 | PASS | `screenshots/s6-skip-entry-300ms.png`, `s6-skip-evening-break.png` |
| Day: Bernadette hidden before `server_room_entered`, visible after | 7288, 7366 | PASS | `s6-day-break-room.png`, `s6-day-bpost.png` |
| Seat: stands at her post (`"seated": false`) | 7298 | PASS | feet (170,225), home (160,224); parks about 25 px short after a trip, the same engine tolerance as other standing NPCs |
| E7 bins trip: cell (7,6), clear of the vending machine and Lisa's tile | 7300 | PASS | `s6-bernadette-bins.png`; trip at about +150 s, 10 s use, walks back |
| Talk at post, bins, espresso (no "Failed to load conversation", visemes png and json 200) | 7307 | PASS | `s6-talk-post.png`, `s6-talk-bins.png`, `s6-talk-espresso.png` |
| `ex_late_again` heard once, persists over a reload | 7308 | PASS | espresso pair, `s6-bernadette-niamh-espresso.png` |
| Goodbye line reads "Right you are. Mind how you go." (commit 9d1cf74ea) | 7378 | PASS | transcript: opener "Just the bins, love. Don't mind me.", choice "Carry on, I'll stay out of your way.", then the goodbye; `s6-bernadette-choice.png` |
| KO with a real punch: trouble reaction, credits line | 7316 | PASS | credits "A MEMBER OF STAFF: HURT, ON YOUR ACCOUNT"; `s6-bernadette-ko.png` |
| Diplomatic debrief with the KO | 7363 | PASS | "You said you'd read the room. Then you put people in it on the floor." Trust 65 after the briefing, 55 at the end (10 lower) |
| Diplomatic debrief without the KO | 7325, 7354 | PASS | "You said you'd read the room. You did." Trust 65 at the end |
| Reload, evening (start in break room, `server_room_entered` true) | 7374 | PASS | Bernadette at her post (160,193), visible from the first sampled frame; Niamh at her chair; Thandiwe hidden; 0 page errors; `s6-evening-before-reload.png`, `s6-evening-after-reload.png` |
| Reload, night (`torres_identified` true) | 7368 | PASS | same positions; Bernadette on her bins/coffee job a few seconds later; Thandiwe hidden; `s6-night-before-reload.png`, `s6-night-after-reload.png` |
| Reception-start game: Bernadette at (-160,65) in the break room | 7370 | PASS (no pop) | The break room origin is (-320,-128) in that game; (-160,65) is her post (160,193) plus the origin, her `home` is (-160,96) on the same basis. She is visible while the player is still in the corridor because the `door_opened` show fires at the door (5 of 36 samples), at her post, not at the origin |
| E3 ten needs-minutes, torres set before the break room | 7377 | PASS | 60 steps of 10 s (clock 620 s): Niamh and Bernadette 120 of 120 samples in the break room and visible; corridor sightings 0 of 60; `qdc_cooler_off` true; frame delta mean 17.2 ms; 0 console and page errors |
| E3, torres set while Niamh was already walking back from a cooler trip | 7376 | PASS with a note | Niamh was in the corridor (x 419 to 341) for the first 5 of 60 samples, finishing a trip that began before the turn, then 55 of 55 in the break room. Bernadette 60 of 60 in the break room. The corridor was empty from then on |
| Sync request bodies during E3 | 7376 | PASS | PUT sync_state max 6334 bytes (3 puts), POST update_room 125 bytes, unlock 84 bytes; no growth |
| `bin/test-js` | n/a | PASS | 752 passed, 0 failed, 752 total |
| Validator | n/a | PASS | 0 errors, 29 warnings (the 4 V4 attack-probe warnings and the onceOnly/plain `room_entered:break_room` pair on Bernadette are expected) |
| Lock/key diff | n/a | PASS | "lock and key diff: empty" |

Notes
- Reload within a few seconds of a global change loses it. Games 7366 and 7367 (4 s between `server_room_entered` / `torres_identified` and the reload) came back with both globals false while Bernadette stayed visible; with a 20 s wait (7368, 7374) both globals persisted. This is the synced-state debounce in the engine, not a scenario fault, but a player who reloads straight after the server room can see Bernadette before the flag is back. The next room entry corrects it. No fix proposed here.
- Knock-out by punch is not deterministic in headless runs: 7354 (31 punches) and 7362 (61) left her hostile but standing, 7316, 7337 and 7363 took 10 to 30. The test script re-approaches every six punches.
- The first KO attempt of this session (7335, 7337, 7343) never reached the briefing: a game started in the break room does not carry the briefing NPC. Runs that need it use `--carry-npc opening_briefing`.
- `dungeon_graph.md` and `.html` were regenerated by the validator and kept: the graph in HEAD lacked Bernadette and the bins, so the diff is real (two nodes and their edges, ids renumbered).
- Games this session: 7335, 7337 (no result), 7343, 7346, 7352, 7353, 7354, 7355, 7362, 7363, 7366 to 7370, 7374, 7376 to 7378.

## R2 fixes (build review round 2)

Live runs on a keyless server on :3092 (boot log shows the missing-key warning), headless, setFPS(20), fixed steps on, `/tts` aborted at the network layer, one fresh game per run from `new-game.rb`. Probes: `tools/playtest/m05-ol-l1a-bernadette.mjs` (L1a for Bernadette) and `tools/playtest/m05-ol-r2-ko-show.mjs` (m1, m3). Games: 7390 (probe aborted, route not unlocked), 7393 (route debug), 7394 (L1a), 7401 (m1, m3).

| Finding | Status | Evidence |
|---|---|---|
| M1 post under table 2 | Measured, post kept at (5,7) | Five evening-break trips from the post, 60 ms samples, minimum distance to Lisa: 51, 50, 48, 50, 49 px (all samples; excluding the last tile 52, 50, 48, 50, 49). The plan's limit is at least 48 px. The route does not use the aisle: it leaves the post (about (155,193)) east of table 2's west end, via (172,160) or (170,166), then north on x 180 to the espresso cell (180,107 to 115). Try 3 sits exactly on the limit, so there is no margin; try 5 began from the bins. (6,7) would put her on Thandiwe's chair footprint (x 188 to 204, y 192 to 222) and the bins' west end, so it is not a usable post; no move made, no "after" run |
| m1 KO'd show | Fixed | `&& globalVars.bernadette_ko !== true` added to the `room_entered:break_room` and `room_entered:main_corridor` shows (the `door_opened` show and the plain server-room show already had it). Live (7401): real KO after 10 punches; then a server-room entry, corridor, break room, corridor and a `door_opened` event left her `body.enable` false, KO'd, unmoved at (169,206) every time |
| m3 needs reset | Fixed | `needs.set` removed from the plain server-room show; the three `onceOnly` shows keep the reset. Live (7401): needs set to caffeine 77 and tidy 88, a second server-room entry left them at 76.9 and 87.8 (decay only) |
| onceOnly count | 14 | Thandiwe 3, Bernadette 3, trouble 5, cooler switch 2, Lisa first-talk 1. PLAN section 7 corrected from 13. The validator's own V8 line counts only the mappings that carry a needs command: 3/10, small keys 7/64, unchanged |
| n1 trouble mapping order | Done | `npc_attacked:bernadette_lyons` moved to the end of the five trouble mappings (after `npc_ko:lisa_park`). This reorders saved once keys (`npcId:eventPattern:index`) for the mappings after it on `agent_0x99_handler`; the branch is unreleased, so only dev games from earlier builds of this branch are affected |
| n2 provisional voice | Checked | `Vindemiatrix` carries its `_comment` in the scenario and `SPOKEN_LINES.md` says her voice needs its own yes before any clip is made. No change |
| n3 "Still here? You'll wear that chair out." | Open | The engine has no post-only pool: pools are keyed by the topic of the object she is using (`coffee`, `cooler`, plus grumble topics), and she has no seated or idle topic. Moving the line to `cooler` would make it unreachable (she has no thirst need). Left in `coffee`; a fit needs either a replacement line (a spoken-line change, so a decision) or an engine post pool |
| Validator | PASS | 0 errors, 29 warnings (unchanged); dungeon graph unchanged, nothing to commit |
| Lock/key diff | PASS | "lock and key diff: empty" |
| `bin/test-js` | PASS | 752 passed, 0 failed, 752 total |

Caveat on the m1 proof: it was run on a game started in the break room with the server-room entry emitted as the engine's own `room_entered:server_room` event (the server hallway door is locked in a fresh game), so the mappings were registered and the corridor `onceOnly` unspent, which is the skip-route state. There was no run of the old build as a negative control.

No reload check was part of the R2 fixes, so the `page.reload()` rule did not come into play; `browser.close()` appears only at the end of each probe.

## R3 fixes (build review round 3)

Edits: n2 (Bernadette's coffee pool line is now "One cup, then I'm back on the hoover.", 37 characters, `scenario.json.erb` and `SPOKEN_LINES.md`; checked against her other lines, no clash, so the alternative was not needed), n3 (`PLAN.md` parenthesis removed; ERB comment now says four mappings, the three `onceOnly` ones reset needs), n4 (backlog entry for the short park on the walk home).

Live check (n1, return leg): keyless server on :3092 (boot log shows the missing-key warning, PID 2114538, stopped by PID afterwards), headless, setFPS(20), fixed steps on, `/tts` aborted by the harness. Probe `tools/playtest/m05-ol-l1a-bernadette.mjs` now also samples the return leg (end of `using` until idle). Games, both printed by `m05-ol-ng.sh` in this run: 7414 and 7416. Positions are world coordinates; the break room origin is about (-320,-127) here, so her post (-165,66) is local (155,193). Lisa stays at (-192,0) throughout.

| Try | Out leg min to Lisa (7416) | Return min to Lisa, 7414 | Return min to Lisa, 7416 | Return min x, 7414 | Return min x, 7416 |
|---|---|---|---|---|---|
| 1 | 52 | 58 | 36 | -169 | -165 |
| 2 | 52 | 36 | 31 | -165 | -165 |
| 3 | 52 | 36 | 37 | -165 | -165 |
| 4 | 52 | 33 | 36 | -165 | -165 |
| 5 | 52 | 41 | 38 | -151 | -154 |

Result: FAIL on distance. The return leg runs 31 to 41 px from Lisa in nine of ten tries (one 58 in 7414 try 1), against the 47 px limit. In game 7416 the closest point is Bernadette at about (-156,1) and Lisa at (-192,0): on the way home she walks straight down x of about -156 past Lisa's row, on the east side, where the out leg sits at about 52 px. Try 5 in both games detoured (218 samples, to about (-75,84) and back) before settling, so its figure is from the first stretch. Minimum x is -165 to -154 world, which is local 155 to 166; the post itself is local 155, so the "159 or more" limit reads as unmeasurable in this frame and was not met on the post alone. Bodies are 18 by 10, so 31 px still leaves 13 px clear and no contact was seen. No fix applied: a post, `interests` or route change is a design decision for the plan.

Validator: 0 errors, 29 warnings (unchanged). Lock/key diff: "lock and key diff: empty". `bin/test-js`: 752 passed, 0 failed. No ink changed, nothing recompiled.

## R4 fixes (build review round 4)

Edit: Bernadette's `position` and `needsHome` moved from (6,7) to (7,4), body centre (224,128) in the break room's frame (scenario.json.erb); the comment above her entry updated. Thandiwe's entries are unchanged. `tools/playtest/m05-ol-l1a-bernadette.mjs` now passes at 48 px on both legs (out leg on all samples). PLAN.md updated for the new post (table row, post paragraph, bins routine, skeleton, check L1a). No engine change.

Planning probe (`tools/playtest/m05-ol-r4-route.mjs`, game 7438) for (7,4): out 56 px, back 56 px, bins out 68, bins back 100, no hits against NPC bodies.

Live check (keyless server on :3092, boot log shows the missing-key warning, stopped by its recorded PID afterwards, headless, setFPS(20), fixed steps on, `/tts` aborted by the harness): game 7439 from `m05-ol-ng.sh`, five tries, local frame.

| Post | Out leg min to Lisa | Return leg min to Lisa | Result |
|---|---|---|---|
| (5,7) before | 48 to 52 | 31 to 41 | return fails |
| (6,7) before | 20, 20, 20, 20, 20 | 58, 54, 62, 54, 54 (min x 179 to 190) | out leg fails (bump into Niamh, detour past Lisa) |
| (7,4) after | 58, 57, 57, 57, 57 | 58, 57, 57, 57, 57 | pass |

(7,4) live detail: aisle samples 0 in all legs; rest points (193,114) then (193,121) four times, so the live hops run between the rest point and the machine at (182,110); try 5's return continued to the bins trip without a detour. No bump with Niamh or any other NPC was seen in the sampled paths.

Validator: 0 errors, 29 warnings. Lock/key diff: "lock and key diff: empty". `bin/test-js`: 752 passed, 0 failed, 752 total.
