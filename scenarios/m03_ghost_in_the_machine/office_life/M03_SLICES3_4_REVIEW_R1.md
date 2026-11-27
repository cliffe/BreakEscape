# m03 office life slices 3 and 4: review round 1

Range 0841f2789..7ae250186 (non-merge commits 41100e95a, fd2174da1, 647a20785, d3c2f556d, 5448871c8, 7b1759067, 7ae250186), read in the detached worktree `.claude/worktrees/p-ol-m03-s3check`. Plan read from `.claude/worktrees/p-ol-m03/docs/achitechture/M03_OFFICE_LIFE_PLAN.md` (it is not in the reviewed tree). One live probe on :3095 (keyless, game 6536 from new-game.rb, two loads, setFPS(20)); server stopped, no files edited. Stopped at the context limit, so some checks below are marked not done.

## Severity table

| # | Severity | Finding |
|---|---|---|
| 1 | blocker | `reception_coffee` and `hallway_cooler` never claim their Tiled sprites; each is a second machine at a random spot that moves on every load |
| 2 | major | Every trip measurement and the 23 s threshold were taken against the random machines, so none of them hold |
| 3 | major | Hide timing differs from the plan: staff stay visible until the night cutscene closes, so a staffer at the cooler is in the hallway when the player walks in |
| 4 | major | Mapped breaks (plan section 3) are not built and not recorded as deferred; the cooler trip, and so the locked-laptop half of the lever, rarely happens in a normal day act |
| 5 | major | Placeholder ink "(placeholder line)" is reachable by talking to either staffer; must not reach main before slice 5 |
| 6 | minor | Night re-hide mappings are not `onceOnly`: two update_room POSTs on every reception or hallway entry at night |
| 7 | minor | Ffion-KO-by-day reaction, attack globals and witnessed credits line not built, not recorded as deferred |
| 8 | minor | Coffee preset capacity 1 (plan: 2); pair coffee trips queue |
| 9 | minor | Credits line "A COLLEAGUE OF HERS STRUCK BY DAY": "hers" has no referent when Ffion's line is not shown |
| 10 | minor | Observations text contradicts the build and the plan's character notes |
| 11 | minor | Laptop sprite looks open at night and on the trouble variant while the text says the lid is shut |
| 12 | minor | Build notes misreport the validator warnings |

## Findings

### 1. blocker: the coffee station and the cooler are duplicated at random positions

`scenario.json.erb:646-651` declares `"type": "coffee_station1"` and `:1533-1536` declares `"type": "water_cooler1"`, both with no `position`. The Tiled pool indexes items by base type with trailing digits stripped (`core/rooms.js:186-193`, `indexByType` at `:229-241`), so the Tiled sprites sit under `coffee_station` and `water_cooler`. `findMatchFor` looks up `itemsByType[scenarioObj.type]` (`:262-268`), finds nothing under `coffee_station1`, and the object falls to `createSpriteAtRandomPosition` (`:2496-2500`), which uses unseeded `Math.random()` (`:680-684`). The Tiled sprite is not in `usedItems`, so it is also drawn as plain decor (`:2521-2551`).

Live proof (game 6536, two loads of the same game):

| load | `reception_coffee` | Tiled coffee decor | `hallway_cooler` | Tiled cooler decor |
|---|---|---|---|---|
| 1 | (164,156) | (262,189) | (256,-63) | (192,-101) |
| 2 | (247,106) | (262,189) | (124,-64) | (192,-101) |

The builder saw (91,152) and the live checker saw the cooler at (33,-64). The screenshot of load 2 shows two water coolers in the hallway, one free-standing mid-floor. m02 uses the base type for the same pattern (`m02_ransomed_trust/scenario.json.erb:3651` `"water_cooler"`, sis01 `:2899` `"coffee_station"`), and the preset list carries both names (`data/office-presets.json:5`), so `"type": "coffee_station"` and `"type": "water_cooler"` should claim the drawn sprites and still take the presets. Re-check `--office-summary` after the change.

So the brief's question about (91,152) against (262,189) has a firmer answer than "mismatch": the NPCs drink from a duplicate machine that lands somewhere new every load, can land by Ffion (load 2, beside her at tile 7.5,4.9 = (240,157)) or by the hallway door, and can block a lane. It also explains validator warnings 14 and 15 (queue cells "outside the room"), which the build notes put down to the sprite being Tiled-claimed.

The cooler at (33,-64) in the live check sits right above the reception door gap (feet x 41 to 55); its use cell (`useFrom` 0,1) then lands in the door mouth. That is a likely cause of the 54 s cooler returns and the 120 s wait "just inside the door" in SLICE3_4.md. Not proven, but it should be re-measured after the fix before any door-lane change is made.

### 2. major: the trip times and the 23 s threshold need re-measuring

`decideLocked` compares `expectedAwayMs` against `lockIfAwayOverSeconds` (`systems/workstation-state.js:155-157`), and `_expectedAwayMs` is route length start to target to home over speed, plus `useSeconds` (`systems/npc-needs.js:3326-3359`). The route length depends on where the machine is, which (finding 1) changes every load. The margins in SLICE3_4.md are about 1.2 s each side (coffee 20.5 to 21.8 s, cooler 24.2 s, threshold 23). At about 80 px/s, one extra 50 px each way moves the estimate by 1.25 s, so in the current build a far coffee spot can lock the coffee trip and a near cooler spot can leave the cooler trip open.

Once the machines claim their Tiled sprites the coffee station is at (262,189), use cell about (275,246), roughly 127 px from her post at (148,253), against about 70 px to the (91,152) spot the builder measured. Rough arithmetic puts the coffee estimate near 22 to 23 s, at or over the threshold. Re-measure both trips five times each, then set the threshold. If the margin stays this thin, widen it (lower coffee `useSeconds` and raise the cooler's, or the reverse of what the gap needs) so normal variance in the start cell does not flip the result.

Use times: coffee 19 s and cooler 18 s are fine to watch. m02's boiler is 50 s, and a 19 s pod-machine wait reads as a break. Keep them unless the re-measure forces a change.

Paired-trip stalls: the live checker's "Zainab idle 24 px short of her post at (148,241)" ran at fd2174da1, before slice 4's `useFrom`. The checker measured against her spawn (172,241); without `useFrom` her post fell to the nearest walkable cell near the laptop, and (148,241) fits that. It reads as the checker's reference point, not a stall, which agrees with the builder's "does not reproduce". The one-body door gap is real, so paired cooler trips should be re-run (five paired trips, both thirsty, player out of the lane) after finding 1 is fixed, with `npc_job_failed` and `npc_turned_back` logged.

### 3. major: staff are hidden at `clone_call_done`, not at the card clone

Plan section 2 hides on `objective_task_completed:clone_rfid_card`, on `global_variable_changed:mission_phase` (act2), and on `clone_call_done` (none `onceOnly`), and plan check 5 wants both staff gone "before the player reaches the hallway". The build has only `global_variable_changed:clone_call_done` (`scenario.json.erb:833`, `:860`), which is set when the night cutscene closes, and that cutscene opens on the first hallway entry in act 2. Between the clone (or Victoria's KO) and the end of the cutscene the staff stay live: needs keep ticking, and a staffer at or walking to `hallway_cooler` is standing in the hallway when the player walks in and while the night scene plays, then vanishes on close. The live run 3 check passed because neither was in the hallway at the time. SLICE3_4.md lists the four mappings without calling this a deviation. Add the plan's mappings 1 and 2, or record why not.

### 4. major: mapped breaks are missing

Plan section 3 sets two mapped breaks (`conversation_closed:ffion_rees` coffee for Yusuf with Zainab coupled, and `room_entered:reception_lobby` from `main_hallway` thirst for Zainab with Yusuf coupled). Neither is in the scenario (no `needs.set` or `npc_use_started` mapping). The validator's own figures put natural thirst at 13.3 min (Zainab) and 15 min (Yusuf) to first use, and only once the hallway has loaded. The needs numbers also differ from the plan table (Zainab caffeine 60/5/35 against 80/8/30), which the plan allows as tuning but the notes do not record. The live measurements forced trips through the bridge, so nothing here shows a normal player sees either trip. Build them, or record the deferral and its effect on the lever.

### 5. major: placeholder ink is player-visible

`ink/m03_npc_zainab_hussain.ink:3` and `m03_npc_yusuf_demir.ink:3` say "(placeholder line)" and both NPCs are talkable person NPCs with `storyPath` set (`scenario.json.erb:818`, `:845`). Fine on the branch; it must not merge to main before slice 5 replaces it. On a keyed server the line would also be sent to TTS.

### 6. minor: night re-hides post every entry

`room_entered:reception_lobby` and `room_entered:main_hallway` with `clone_call_done === true` (`:834-835`, `:861-862`) are not `onceOnly`. `setNPCVisible` posts `update_room` every call (`systems/npc-behavior.js:445-452`) whether or not the state changed. Two POSTs per entry at night. The value is one bounded key, so state does not grow, but the plan made these `onceOnly` for this reason. Saved visibility already restores on reload (`npc-manager.js:353`), so `onceOnly` loses nothing.

### 7. minor: Ffion-KO and attack handling partly built

Built: `wh_staff_upset` from a hit, either KO, and Ffion's KO before `clone_call_done` (`:1332-1336`), appended last on `agent_0x99`. Good, and the order rule is kept. Not built and not listed as deferred: `zainab_attacked`, `yusuf_attacked`, `wh_staff_attacked`, `wh_staff_witnessed`, the `patrolOverride` send-home on Ffion's KO, and the witnessed credits line. Barks and HaX texts belong in slice 5 (spoken lines in scenario data); the globals and the send-home do not. Record them in SLICE3_4.md.

### 8. minor: coffee capacity

Plan section 3 says capacity 2 for `reception_coffee`; the preset gives 1 (`office-presets.json:5`) and the object does not override it. Pairs then queue, which lengthens real time away but not the lock decision (the estimate is taken at leave). Decide and record.

### 9. minor: credits wording

`scenario.json.erb:229`: "WHITEHAT STAFF: A COLLEAGUE OF HERS STRUCK BY DAY" shows only when Ffion was not knocked out, so the line above it (Ffion's) is absent and "hers" points at nobody. Suggest "WHITEHAT STAFF: SOMEONE STRUCK IN RECEPTION BY DAY" or name the person hit, which needs the attack globals from finding 7.

### 10. minor: observations

Zainab (`:837`): "laptop on her knee"; the laptop is on the glass table (`:654`). "Analyst" against the plan's field service engineer; Yusuf (`:864`) "engineer ... waiting on a call" against the plan's senior consultant waiting for a client. Swap or align with plan section 2.

### 11. minor: laptop art at night

The night and trouble variants (`:665-666`) say the lid is shut, but `laptop1` still draws an open laptop. A `spriteVariants` entry on the same conditions, or softer text ("Zainab has gone home; the laptop is asleep"), would match. Low priority.

### 12. minor: validator notes

Re-run here: 0 errors. The office-life warnings are 13, 14, 15, 18, 21, 22, 23 (cooler chatter, two coffee queue cells, cooler in another room twice, V4 attack probe twice); the rest are older (dialogue lint, cutscene `onceOnly`, objective wiring). SLICE3_4.md says all 12 are new from the two NPCs and blames 14 and 15 on Tiled claiming. 13, 18 and 21 are expected for now; 22 and 23 clear when the attack probe passes; 14 and 15 come from finding 1 and should be re-checked after it.

## Checked and fine

- Laptop text (`:663-668`): no password, PIN, code, flag, server-room detail or route; calendar, Victoria's data-handling reminder and the unsent message match plan section 4. UK English. No spoken content in it. Variant order is night, trouble, locked, away, then base text, as planned.
- No note on a read: `addToNotes: false` skips `addNote` on the `gameDisplay` path (`systems/interactions.js:1947-1953`), and the text is HTML-escaped (`:2132-2138`), so "Marlowe & Pike" and the quotes render safely. Not proven live.
- Habit: `lockChance 1`, `lockIfAwayOverSeconds 23` (`:822`), read by `decideLocked` as the build notes say. `useFrom {-0.75,-1.06}` puts her post at about (148,253) from the laptop at (160,278) (live position confirmed).
- `data.previousRoom === null` (`:836`, `:863`): the evaluator parses `null` as a literal and has no `==`, which matches STAGE1_CHECKS (a). `value === true` resolves to `eventData.value` (`npc-manager.js:25-60`).
- Cheat resistance: the laptop unlocks and grants nothing, the new globals only switch machines off or pick text, and nothing server-side reads them. Lock and key structure unchanged (no new lock, key or item).
- Sync: three declared globals plus the three runtime workstation globals and per-NPC visibility and hostility, all bounded scalars sent per key; V8 reports 3/24 and 3/64. Nothing grows.
- Night turn, music and KO route: live run 3 shows both staff hidden after the night scene, still hidden after reload, and the fight music returning to the night playlist after Terry's KO with the staff hidden. The Ffion KO badge route still works (live run 2 route facts).

## Not done

Live checks after the fix, the laptop read in the browser (each variant, and no note toast), paired cooler trips, the player reaching the laptop from beside the table, a baseline validator run at 0841f2789 to confirm which warnings are new.

## Verdict

Not ready. Finding 1 is a blocker: change both types to the base names (`coffee_station`, `water_cooler`), confirm one sprite each at the Tiled spots, then redo the slice 3 and 4 measurements and pick the threshold from the new figures (finding 2). Decide findings 3 and 4 against the plan, or record the deviations, and keep the branch off main until the placeholder ink is replaced.

## Fix log (branch fix/ol-m03-r1)

Live runs on :3094, games 6583 (trips), 6587 and 6589 (mapped breaks and hide), setFPS(20), fixed steps on.

| # | Status | What was done |
|---|---|---|
| 1 | fixed | Types are `coffee_station` and `water_cooler`; one Tiled sprite each (game 6561, two loads). |
| 2 | fixed | Re-measured on the Tiled machines. Coffee use 16 s, cooler use 20 s, threshold 24 s. Game 6583, player parked at (157,253), clear of the door lane: coffee expectedAwayMs 18626 in 5 of 5, real away 22.0 to 22.4 s, 5 of 5 left the laptop open (margin 5.4 s below the threshold). Cooler expectedAwayMs 28724, real 32.2 to 33.0 s on three clean trips, 50.9 and 58.5 s when Yusuf joined, 5 of 5 locked (margin 4.7 s above). Both margins exceed the 3 s target, so no further retune. |
| 3 | fixed | Mappings on `clone_rfid_card`, `mission_phase` act2 and `clone_call_done`, plus `onceOnly` night re-hides. Game 6589: staff visible before the clone, both hidden once the phase turned and before any hallway entry, still hidden after a reload, after the night scene on re-entering reception, and after a reload at night. |
| 4 | fixed | Mapped breaks built. Game 6589: closing the chat with Ffion sent Yusuf to the coffee (left post 2.9 s later) and Zainab followed, laptop open; coming back from the hallway sent Zainab to the cooler (use started, laptop locked), Yusuf followed. |
| 5 | left to slice 5 | Placeholder ink is theirs on another branch; do not merge this branch to main before it lands. |
| 6 | fixed | Night re-hides are `onceOnly`. |
| 7 | fixed, send-home partly proved | `zainab_attacked`, `yusuf_attacked`, `wh_staff_attacked`, `wh_staff_witnessed` declared and set; Ffion KO by day sets upset and witnessed (game 6589). Send-home `patrolOverride` fired: Zainab moved (148,241) to (148,221) and Yusuf (111,268) to (106,249) after the KO, and both stayed idle and visible. I did not confirm the exact destination tile against the mapping, so treat the destination as unproved. Barks and HaX text left to slice 5. |
| 8 | fixed | Coffee capacity 2 on the object. |
| 9 | fixed | Credits line reads "SOMEONE STRUCK IN RECEPTION BY DAY", with a witnessed line. |
| 10 | fixed | Observations match plan section 2. |
| 11 | deferred | Text now says the screen is dark; closed-lid art not generated (low priority). |
| 12 | explained | See below. |

Validator (0 errors): one new warning against the base, `npc_ko:ffion_rees` on `agent_0x99`, onceOnly handlers at indices 6 and 59. Index 6 is the day "Sterling will notice" timed message and 59 sets `wh_staff_witnessed` and `wh_staff_upset`. Both run on the same day condition by design and do different things, each firing once. Index 7 is the night variant and is disjoint by `mission_phase`. The validator text says to ignore the warning when firing together is intended, so it is left.
