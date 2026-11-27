# office_life_showcase: plan

A new test scenario: a guided tour of office life in three acts, hosted by Ama Owusu. Plan only; the build follows in slices S1 to S5 (section 11). The cake item is specified in `CAKE_ITEM.md`. Engine paths below are under `public/break_escape/js/`.

## 1. Goals and audience

- A guided 5 to 10 minute tour of office life for colleagues who know Break Escape. Ama Owusu hosts; she may use engine terms (needs, affordance, capacity, exchange, lever, security window).
- Collection `test_scenarios`. Display name "Office Life Tour". `estimated_duration_minutes` 8. No firm is named in any spoken line.
- test_needs_sims stays unchanged as the regression fixture. One engine change was made during the build (S3): `exchanges[].topic`, which pins an exchange to one object's chatter pool so the cooler exchange no longer fires at the cake (`systems/npc-needs.js` `_findExchange`, schema and `docs/achitechture/NPC_NEEDS_SYSTEM.md`; three unit tests in `test/js/npc-exchange-heard.test.mjs`, plus a validator type-check in `scripts/validate_npc_needs.rb` check_exchanges). An entry with no `topic` is unchanged, so m01/m02/m03/m05 behave as before. Anything else needing an engine change is in section 14.
- Overlay off (`needsDebugOverlay` left out). `showPressingNeeds: true`, `npcThoughts` default (on), `officePresets: true`, `roomTone: true`, `lighting` on, scenario-level `disableAttacks: true` (so no KO cases).
- The viewer sets the pace. Nothing locks: both rooms are open from the start, and each act turn is a choice in Ama's hub.
- The tour never ends by itself. After the last task it stays open; Ama's recap is the close (section 6). Section 6 also says how the scenario is kept from concluding.

## 2. Rooms, map reuse and positions

Two rooms, both maps from test_needs_sims. No third room.

- `office` (`room_office`, `public/break_escape/assets/rooms/room_office.json`, 10 x 10 tiles of 32 px), start room, `startPosition` (5, 6) = px (160, 192). Connection `west: kitchen` only. A single west connection puts the door at local px (16, 80), tile (0.5, 2.5) (`systems/doors.js`, `placeWestDoorSingle`), so every trip to the kitchen leaves along the band between the bookcase and the desk tops (y 66 to 117 px).
- `kitchen` (`room_break`, `room_break.json`, 10 x 10), connection `east: office`.

How positions read. A scenario object's `position` is the top-left corner of its sprite in tiles (objects use origin (0, 0), `core/rooms.js:346`, `:694`; placed at `roomX + x * 32`, `core/rooms.js:598-599`); a value outside the room is ignored and the object lands at random (`:593-597`). An NPC's `position` is where its feet are: the sprite is shifted so the centre of the body (a 20 x 10 px box at the feet) lands on the position (`systems/npc-sprites.js:108-126`). The desk machines (`pc`, `laptop`) have no `position`: they claim the Tiled desk items in declaration order, so they are declared in the same order and types as sims.

Office map furniture (Tiled `tables` layer, top-left corner in tiles, each desk 78 x 39 px): desks at (0.94, 3.69) and (0.94, 5.19) on the west side, (6.56, 3.66) and (6.58, 5.19) on the east side; the middle aisle runs from x 3.4 to 6.5. Back wall items: bookcase (4.31, 0.5) 43 x 50 px, chalkboards at (2.0, 0.45) and (6.57, 0.41); a chair at (5.67, 1.87); a bin at (8.42, 4.27).

Office objects (positions copied from sims unless marked new):
- Desk machines in sims order: `chidi_pc` (pc, was amara_pc), `jun_pc` (pc, was tom_pc), `graham_pc` (pc, was sanjay_pc), `agnieszka_laptop` (laptop, `affordance: false`, was grace_laptop). The three PCs are written out as workstations, each with `"workstation": true` and its `owner` (`chidi_okeke`, `jun_watanabe`, `graham_whitfield`). `jun_pc` and `chidi_pc` carry no `lockChance`, `locksScreenOnLeave` or `lockType`, so the owner's `habits.screen` decides (`systems/workstation-state.js:131-160`); `graham_pc` adds only `autoLockSeconds 20`.
- `zainab_tool_roll` (m10_tool_roll1) at (2.0, 5.4) = px (64, 173), elevation 24, `useFrom (0,1)`: on the south-west desk.
- `jun_badge` (id_badge) at (1.75, 5.25) = (56, 168), `owner: "jun_watanabe"`, `leftBehindChance 0.7`, `revealOnGlobal jun_badge_left`: on the same desk.
- `office_coffee` (coffee_station1) at (8, 8) = (256, 256), `useFrom (-1,0)` (approach tile (7, 8)), queue cells (-1,0), (-2,0), `chatter "coffee"`, `overhearRadius 200`, `offWhen office_coffee_off`.
- `office_coffee_socket` (power_socket2) at (8.65625, 7.0625) = (277, 226), a named confirm each way setting `office_coffee_off`.
- `office_mugs` (dirty_mugs1, "Abandoned Mugs", needsTag `dirty_mugs`) at (4, 7) = (128, 224).
- `tour_notice` (notice_board1, wallMounted, readable "Things to try") at (8.1875, 0.6875) = (262, 22), where sims has its deadline memo; clear of the chalkboard to its left (ends at x 7.82). Its text gives the same steps as Ama's "What should I try next?" for all three acts.

Kitchen objects (all copied from sims, `room_break`):
- `fridge` (qdc_fridge1) at (1, 2) and `microwave` (microwave1) at (5, 3), both on the office presets (`data/office-presets.json`: fridge restores 80, microwave 60), no affordance override. Built this way, not the planned `restores 40`: the natural lunch-then-cake beat was tuned and proven live on the presets (`cake` magnet `tempt 45`), with three tempted and one "Missed it." (see row 2.7 and CAKE_ITEM.md).
- `kitchen_coffee` (coffee_station1) at (3, 8), `useFrom (0,-1)`, queue (1,-1), (2,-1), `"offWhen": { "office_coffee_off": false }`, observations "The kitchen coffee machine. It shares a fuse with the office one, so only one of them runs at a time." The object form of `offWhen` is read by `_isOff` through `requiredGlobalsHold` (`systems/npc-needs.js:312-318`, `:832-840`), which compares with `===`: the kitchen machine is off exactly while the office one is on. `office_coffee_off: false` is declared in `globalVariables` (an undeclared key would leave the kitchen machine on). No off look: `coffee_station1` has no off sprite, and the sockets carry the off look in sims too; the observation text says why it is off in both states. Why this matters is in section 3, "One coffee at a time".
- `water_cooler` (water_cooler1) at (1, 7), `affordance: { "useSeconds": 40, "overhearRadius": 360 }`. The 40 s use gives a coupled pair time together for the exchange (the preset's 15 s leaves them 3 to 7 s); the radius covers the whole room, so the viewer need not stand anywhere special.
- `washing_up_tray` (mugs_tray1) at (3, 3), accepts `dirty_mugs`, `useSeconds 5`.

Dropped from sims: copiers and outputs, print queue, deadline memo, coffee notice, activity board, desk phones, kitchen rota, kitchen copier socket, parcel, player mugs, the east and north doors.

NPC start tiles (feet positions, tiles): Chidi (7, 3), Jun (3, 6), Graham (3, 4), Agnieszka (1, 5), Zainab (2.15, 6.65), all copied from the sims NPC each one replaces. Each NPC's post is its desk machine, not the start tile: Jun starts at (3, 6) = px (96, 192) and walks to `jun_pc`, where his feet rest at about px (92, 164).

Ama (new) at (5.5, 4.5) = px (176, 144): in the aisle, level with the north desk row, 48 px above the viewer's start and 24 px east of it, 24 px clear of Graham's chair and of the east desks, and off the door line. The aisle there runs from the west desks' east edge (x 108 px) to the east desks' west edge (x 210 px), so her body (x 166 to 186 px, y 139 to 149 px) leaves a physical lane of 58 px on her west and 24 px on her east. She is `immovable` (section 3), so the NPC pathfinding grid treats her body as an obstacle. The grid cell is 8 px (`utils/constants.js:37`), and the pathfinder rounds a body out to that grid and then pads it by one cell each side (`systems/npc-pathfinding.js:354-369`), which costs 8 to 15 px per side (the padding cell plus up to 7 px more from the rounding out), so the pathable lanes are narrower than the physical ones:

| Lane | Blocked cells (x px) | Free cells | Pathable width |
|---|---|---|---|
| West (desk edge 108 to Ama) | desk to 119, Ama from 152 | cells 15 to 18 (120 to 151) | 32 px, 4 cells (3 to 5 by grid alignment) |
| East (Ama to desk edge 210) | Ama to 199, desk from 200 | cell 25 (200 to 207), free at y 144 | 8 px, 1 cell |

A walker steps cell centre to cell centre, so the west lane takes two walkers side by side with a cell to spare. The east lane is open: one cell (x 200 to 207) is free at y 144, so a walker can pass down it in single file, 7 to 9 px from Ama's body. Chidi's office-coffee walk uses it. The spot (152, 144) was rejected because its west lane is only 1 cell (0 to 2, depending on grid alignment). Her drawn sprite reaches up to about y 64, level with the bookcase's lower edge, so it can overlap the door band on screen but not in the physics. She stays off the band at the top of the room: the straight line from Chidi's post (224, 96) to the west door (16, 80) crosses it at y 80 to 96, and every lunch walk, every kitchen trip and the mug run use it. The coffee routes run below her (Jun and Zainab from the west desks to the approach tile (7, 8), y 192 to 272) or down the east lane (Chidi). There is no free spot for a second NPC on the east side: (8.5, 4.5) = px (272, 144), for example, sits inside the north-east desk's footprint (x 210 to 288 px, y 117 to 156 px) and on the bin. S1 watches the first coffee walk and the first walk to the west door, and counts the free cells west of her (section 11).

Lighting: office `on`; evening variant `{ "condition": "globalVars.act_evening === true", "ambient": "#8f96b0", "lights": [warm lamp over Zainab's tool roll] }`. Kitchen `on`; evening variant `{ "condition": "globalVars.act_evening === true", "mode": "motion", "offAfter": 10 }`. A variant applies as soon as its global changes and is re-read on load (`systems/lighting.js:37-42`, `:788-805`). In motion mode a visible NPC on the floor switches the lights on (`:1159-1168`), but only the player leaving starts the off timer (`:1031-1044`); so the evening must send nobody but the viewer into the kitchen (section 4, row 3.1).

## 3. Cast

All from the awareness course, with full atlases (`sit_` frames), talk, visemes and headshot in `public/break_escape/assets/characters/`. Apart from the host, none is in demo_access_tour's cast. Voices and accents from VOICE_CAST.md. Ama reuses her ca18 art (`spriteSheet ama_owusu`, `spriteTalk assets/characters/ama_owusu_talk.png`, `spriteVisemes assets/characters/ama_owusu_visemes.png`) and her ca18 voice (Autonoe, same style string, `scenarios/ca18_credential_attacks_at_scale/scenario.json.erb:799`).

| Key | Who (VOICE_CAST) | Sims role copied | Needs (decayPerMin/urgentAt/initial) | Features carried |
|---|---|---|---|---|
| `ama_owusu` | Ama Owusu, 40s, Black British (Ghanaian heritage), London | none (host) | none | ink hub, act turns by `#set_global`, label barks, task mappings, `behavior`: `{ "facePlayer": true, "immovable": true }` (she stands in an aisle on walkers' routes and has no home to return to, so nothing may push her; `immovable` only fixes the body, and she still turns to the player and talks) |
| `chidi_okeke` | Chidi Okeke, 40s, Nigerian-British, West Yorkshire | Amara | caffeine 25/40/61 (urgent about 0:50), work 10/50/72, hunger 5/40/90 | leads every coffee run, `habits.screen.lockIfAwayOverSeconds 10` (locks for any trip he expects to take over 10 s, `systems/workstation-state.js:153-155`; a coffee run is about 17 s, walking plus the 12 s use, and lunch is longer, so he locks on every trip), lunch on cue |
| `jun_watanabe` | Jun Watanabe, early 20s, Japanese-British, southern English | Tom | caffeine 10/40/70, work 8/50/80, hunger 5/40/90 | follows Chidi to the coffee and queues (queue chat), `habits.screen.lockChance 0` (leaves his PC open), left-behind badge, caught bark, lunch on cue |
| `graham_whitfield` | Graham Whitfield, early 60s, white British, Halifax | Sanjay | work 15/50/65, social 12/40/72 (urgent about 2:40), hunger 4/40/90, caffeine 1/30/95 | `habits.screen.lockChance 0` (never locks by hand), so `graham_pc` locks itself 20 s after he leaves; cooler pair and the exchange |
| `agnieszka_duda` | Agnieszka Duda, 30s, Polish, lightly accented | Grace | thirst 15/40/80 (urgent about 2:40), hunger 4/40/90 | `interests` dirty_mugs (carries the Abandoned Mugs to the washing-up tray), cooler pair partner |
| `zainab_hussain` | Zainab Hussain, 30s, British Bangladeshi, northern English; field service engineer | Marek | caffeine 1/30/95, thirst 2/30/95 | `needsCompany.avoids ["*"]`, `avoidRadius 0` (queues, chats with nobody, never told about the cake); caffeine set to 10 whenever someone else queues at the office coffee; stays late |

Ages run early 20s to early 60s; three women, three men including the host.

Coupling mappings (the pattern sims uses for Sanjay after Marek and Marek after Tom, `scenarios/test_needs_sims/scenario.json.erb:727`, `:760`):
- On Jun: `npc_left_post:chidi_okeke`, `"condition": "data.targetId === 'office_coffee'"`, cooldown 30000, `needs.set.caffeine 10`. Every Chidi coffee run brings Jun in behind him. Chidi claims the machine first, since he selected first; Jun's select then finds it taken and joins the queue, which emits `npc_queued:office_coffee` at the select (`systems/npc-needs.js:3190`).
- On Zainab: `npc_queued:office_coffee`, `"condition": "data.npcId !== 'zainab_hussain'"`, cooldown 30000, `needs.set.caffeine 10`. She joins any queue third, whoever is second.
- On Graham: `npc_left_post:agnieszka_duda`, `"condition": "data.targetId === 'water_cooler'"`, cooldown 30000, `needs.set.social 10` (one-way: her drink pulls him).
- On Jun: `workstation_accessed:jun_pc`, `"condition": "globalVars.act_midday === true"`, cooldown 60000, `needs.set.work 5`. This pulls his work need down the moment the player uses his open PC. It shortens his trip only if he is still walking home when the selector next runs (a `returning` or `idle` NPC re-selects, `systems/npc-needs.js:1522-1525`); mid-meal at the fridge he finishes the use first, so it does not cut a meal short.

One coffee at a time. An NPC takes a free, reachable source first and queues only when there is none (`_useCandidate`, `systems/npc-needs.js:1733-1794`, queue fallback `:1778-1785`); off sources are left out of the candidates (`:1739`), and Chidi's walking claim counts as taking the office machine (`_free`, `:1580-1599`). With `kitchen_coffee` off while the office machine is on (section 2), the office machine is the only coffee in the building until the viewer switches it off. So:
- Jun and Zainab always queue behind Chidi, whether the kitchen has loaded or not; opening the kitchen early changes nothing in the queue beats.
- Switching the office coffee off brings the kitchen machine on in the same step (`onGlobalChanged` re-reads every `offWhen` naming the global and wakes parked needs, `:807-830`), so the turned-back NPCs go to the kitchen coffee. With the kitchen not yet loaded they park and go when it loads (`_wakeParked`, `:2016`).
- While the office coffee is off, runs go to the kitchen and no queue forms on later runs (the people turned back at the switch-off all pick the kitchen machine, so the second and third may queue there once, emitting `npc_queued:kitchen_coffee`, which nothing reads): Chidi's target is then `kitchen_coffee`, which the Jun coupling does not match. Switching it back on at the socket brings the queue back on the next run.
- The evening turn switches the office coffee on, which switches the kitchen machine off, so Zainab's evening coffee can only be in the office.

Coffee timing. A use restores its need only when it ends, and decay pauses while using (`systems/npc-needs.js:3663-3665`, `:1552`); the coffee preset is `useSeconds 12`, capacity 1, `restores 70`. Chidi goes urgent at about 0:50, so the first queue forms after a typical opening chat (A1, A2 point the viewer at the machine). His cup ends near 1:08 at the cap of 100; at 25 a minute he is urgent again after 2:24, so the second run is at about 3:35, with Jun and Zainab coupled in again. Jun's own caffeine (77 after his cup, 10 a minute) would not bring him back before about 5:00; the coupling, not his clock, sets his runs.

## 4. Tour, act by act

Times are from spawn for a viewer who follows Ama's hints; the viewer may be slower, and every beat waits or repeats (section 10 lists what is still to be measured). "Label" is the line that names the feature as it happens. Tasks are in section 5; all task mappings sit on Ama, who never hides.

Mapping conditions are `&&` joins of single terms only (no `||`, no parentheses; `safeEvaluateCondition`, `systems/npc-manager.js:25-130`). In a `global_variable_changed` mapping, `value` is the event's value (`{ name, value }`), so `value === true` and `data.value === true` both work.

Needs keep running for every NPC during a conversation except the one being talked to (`systems/npc-needs.js:1437-1446`). A bark raised while a conversation or minigame is open is held and shown after it closes, one every 2.5 s, re-checked before it shows (`systems/npc-barks.js:240-255`). A bark from Ama while the viewer is in the kitchen shows as a voiced toast (`systems/npc-barks.js:26-29`).

### Act 1, Morning (0:00 to about 4:00)

| # | Time | Viewer does | Viewer sees | Label | Task | Ticks on |
|---|---|---|---|---|---|---|
| 1.1 | 0:00 | Spawns in the office | Five staff at their posts; Ama in the aisle just above and east of the viewer | Ama bark B1 | none | `room_entered:office` (onceOnly, not office life) |
| 1.2 | 0:05 | Talks to Ama | A1, A2 (watch the coffee); the hub; "What am I looking at?" gives A3, A4 | Ama A1 to A4 | none | none |
| 1.3 | about 0:50 to 1:30 | Watches the coffee | Chidi walks to the office coffee; Jun follows and queues; Zainab queues third | Ama bark B2 | `see_queue` | `npc_queued:office_coffee` |
| 1.4 | about 0:55 to 1:10 | Stands within about six tiles of the queue | Chidi and Jun swap lines from the `coffee` pool; Zainab says nothing (avoids everyone) | the bubbles | `hear_queue_chat` | `npc_chatted:office_coffee` with `data.overheard === true` |
| 1.5 | about 1:30 | Opens the west door to the kitchen | Kitchen lit; its coffee machine is off (its observation explains); Ama's "Let's do lunch." now works | none | none | `room_entered:kitchen` sets `kitchen_seen` |
| 1.6 | about 1:30, as the kitchen first loads | Has noted the mugs on the floor (A8 comes before A7 in the hints) | Agnieszka gets up, picks up the Abandoned Mugs from the office floor and carries them into the kitchen behind the viewer, to the washing-up tray | Ama A8 (hint, in advance), Ama bark B11 | none | `npc_picked_up:office_mugs` |
| 1.7 | about 2:40 | Waits in the kitchen | Graham and Agnieszka meet at the cooler (her drink pulls him); the five-line exchange plays once; back in the office, Graham's screen locks itself 20 s after he left | the exchange; Ama A13, A14 if asked | `hear_cooler_exchange` | `npc_exchange_heard:exchange_cooler_chat` |
| 1.8 | about 3:35 | Back in the office, stands by the socket | Chidi's second coffee run; Jun and Zainab queue again | none | none | none |
| 1.9 | while they walk or queue | Switches the coffee off at the socket (confirm) | Those walking to it or queued turn back with a `grumble_off` line and head for the kitchen coffee, which has just come on; one already pouring finishes | Ama bark B3 | `see_coffee_off` | `npc_turned_back:*` with `data.reason === 'off'` |

Row 1.6: Agnieszka has `interests` and no work need, so she sits idle at her post and selects every tick (`systems/npc-needs.js:1524-1526`, `:1659`). The interest candidate needs the tagged item in her home room and a loaded object that `accepts` the tag (`_carryCandidate`, `:3105-3121`); the tray is in the kitchen, which loads when its door opens (`systems/doors.js:875-886`), and the load clears every back-off (`_onRoomsLoaded`, `:1270-1274`). Her flat interest weight beats any need that is not urgent (`:1717-1723`). So the mug run starts within a tick or two of the viewer opening the west door, whenever that is. A8 tells the viewer to look at the mugs before opening the kitchen, so the empty floor afterwards means something.

Late viewers. The coffee run repeats about every 2:25 while the office coffee is on, with Jun and Zainab queuing every time, before or after the kitchen opens (section 3, "One coffee at a time"); so 1.3, 1.4 and 1.9 can happen on any run, in any act. A viewer who switched the coffee off early sees no queue until it is back on; A6 puts the switch-off after the queue. If the kitchen is still unopened at 2:40, Graham and Agnieszka wait at their desks and go once it loads (`_wakeParked`, `systems/npc-needs.js:2016`); the mug run then starts at the same moment.

### Act 2, Midday (about 4:00 to 6:00)

| # | Time | Viewer does | Viewer sees | Label | Task | Ticks on |
|---|---|---|---|---|---|---|
| 2.1 | about 4:00 | Ama: "Let's do lunch." (only after `kitchen_seen`, and only with Chidi and Jun at their desks) | Conversation closes; Chidi and Jun hunger set to 20, Graham and Agnieszka to 62 | Ama A16, A30 | none | `global_variable_changed:act_midday` |
| 2.2 | about 4:00 to 4:10 | Stays in the office | Chidi leaves for the kitchen; his screen locks as he goes (a soft chime if sound is on; the same chime sounds on every coffee run, since each leave can lock, and B4 stays gated on `act_midday`) | Ama bark B4 | none | `workstation_screen_changed:chidi_pc` with `data.how === 'leave' && data.locked === true && globalVars.act_midday === true` |
| 2.3 | about 4:00 to 4:10 | Stays in the office | Jun leaves too; his screen stays open (white breathing dot); his badge may stay on the desk (70%) | Ama bark B5 | none | `npc_left_post:jun_watanabe` with `globalVars.act_midday === true` |
| 2.4 | about 4:15 | Uses Jun's PC | Jun's desktop | none | `use_open_screen` | `workstation_accessed:jun_pc` (the same event pulls his work need down; it shortens his return only if he is still walking, not mid-meal, section 3) |
| 2.5 | about 4:45 | Closes the PC and waits beside Jun's desk | Jun walks back into the office and finds the viewer at his desk | Jun bark B8, then Ama bark B6 (`delayMs 2500`) | `see_caught` | `npc_caught_at_post:jun_watanabe` |
| 2.6 | optional | Picks up Jun's badge before he returns (A16 has said to watch what people leave on their desks) | On his return Jun finds it gone; the event fires only for a badge the viewer took, so B9 can say so | Ama bark B9 | none | `npc_left_item_gone:jun_watanabe` |
| 2.7 | about 5:00, once all four are back and sitting | Drops the cake from the inventory in the office | Those who see it and are tempted walk over; two eat with `cake` pool lines; anyone still walking when the second slice goes turns back with "Missed it." | Ama bark B7 | `see_cake_eaten` | `magnet_finished:cake` |

Rows 2.1 to 2.3, the lunch gate. B4, B5 and the badge roll all hang on a fresh leave from the desk: `npc_left_post` is emitted only by an NPC at its post (`_leavePost`, `systems/npc-needs.js:3267-3281`, which also rolls the left-behind badge), and `workstation_screen_changed` fires only when that leave changes the lock (`systems/workstation-state.js:537-555`). An NPC finishing a coffee may pick its next job while still walking home (the selector runs for `returning` NPCs, `systems/npc-needs.js:1522-1525`), so if lunch were called while Chidi and Jun were out on a coffee run, both would go straight to the kitchen with no leave, no B4, no B5 and no badge. So "Let's do lunch." also waits until both are back: the workstation globals `chidi_pc_owner_away` and `jun_pc_owner_away` (published by `systems/workstation-state.js` `_publish`, cleared on return by `onReturned`, `:569-588`; sims reads the same kind in `observationVariants`) are declared in `globalVariables` so they sync into Ama's ink (`isGlobalVariable`, `systems/npc-conversation-state.js`), and while either is true she says A29 and returns to the hub. Their return also unlocks Chidi's screen, so his lunch leave locks it again and B4 fires.

If Chidi or Jun is part way through a desk use when lunch is called, he finishes it before looking for a target (`systems/npc-needs.js:1509-1513`). The desk preset's use is 10 s (`desk_pc`, `data/office-presets.json:4`), so his leave, B4 or B5 and the badge roll slip by at most 10 s. What the viewer sees: one of the two gets up at once and the other types on for a few seconds, then goes. A30, said as lunch is called, covers it: "Anyone in the middle of something finishes it first." B4 and B5 are tied to the leaves, not to a clock, so their wording holds in either order.

Row 2.5: `npc_caught_at_post` fires once per return while Jun walks back inside the office, if the viewer is within 1.5 tiles of his desk's approach cell or has his PC open (`systems/npc-needs.js:3371-3383`). A viewer who stays in the PC is caught too, but B8 and B6 then wait until the PC is closed (a delayed mapping that falls due while a minigame is open waits for it to close, `systems/npc-manager.js:921-925`). A10 therefore says to close the PC and wait by the desk, so both barks show as Jun walks up.

Row 2.7 (built values): Chidi and Jun eat at the fridge (restores 80) and microwave (restores 60) at lunch, so they come back fuller (measured live: Jun 98.3, Chidi 77.9); Graham and Agnieszka sit at 62. The cake magnet is `tempt 45`, so the tempt band is `urgentAt 40 < level <= 85`. At the natural drop that tempts Graham, Agnieszka and Chidi (three), not Jun at 98.3 (one "Missed it."); with `servings 2` two eat and the task ticks on `magnet_finished:cake`. This differs from the planned `restores 40`/`tempt 30`: the presets were kept and the cake tuned around them, tuned and proven live in a natural run. A cake dropped earlier in the morning still completes `see_cake_eaten` with no soft-lock: the `see_cake_eaten` mapping has no act gate, Graham is tempted by social (72, band 85) at spawn and the rest fall into the hunger band within about a minute as hunger decays from 90, so two servings are always consumed and `magnet_finished:cake` fires. An NPC part way through a desk use does not look for a target until the use ends (`systems/npc-needs.js:1509-1513`), and one that looks after both slices are claimed never sets off (`_magnetsFor`, `:931`). B7's wording holds for any count, and the task needs only the cake to be finished. Word of mouth plays only if the cake goes down in the kitchen with someone there (then as a picture bubble with no line, since the `news_cake` pool was dropped); it is not a task.

### Act 3, Evening (about 6:00 to 7:30)

| # | Time | Viewer does | Viewer sees | Label | Task | Ticks on |
|---|---|---|---|---|---|---|
| 3.1 | about 6:00 | Ama: "Call it a day.", then "Yes, call it a day." at the A31 confirm ("Not yet." returns to the hub) | A31 confirm, then A17, A18 play; as A18 ends (the `#set_global` runs after it) Chidi, Jun, Graham and Agnieszka vanish, the office ambient dims, the lamp over Zainab's tool roll comes on, and the office coffee is switched back on (the kitchen machine goes off with it) | Ama A31, A17, A18 | none | `global_variable_changed:act_evening` with `value === true` (one `setVisible false` mapping per hidden NPC; on Ama, `setGlobal { office_coffee_off: false }`) |
| 3.2 | 1.5 s after the conversation closes | Watches Zainab | Zainab speaks | Zainab bark B10 | none | same event, `delayMs 1500` |
| 3.3 | 8 s after close | Watches Zainab | Her caffeine is set to 10 and she goes to the office coffee | none | `see_who_stays` | `npc_left_post:zainab_hussain` with `globalVars.act_evening === true`, or `npc_used:*` with `need === 'caffeine'` (any coffee source) |
| 3.4 | about 6:30 | Walks into the kitchen | The dark kitchen lights on entry, and goes dark 10 s after the viewer leaves | Ama A15 (hint) | none | none |
| 3.5 | about 7:00 | Ama: "Give me the short version." | Recap of each feature in the order seen, then the close | Ama A19 to A25, A28 | none | none |

Switching the office coffee back on at the evening turn also switches the kitchen machine off, so Zainab cannot take her coffee in the kitchen and nothing but the viewer switches the motion lights on there. A viewer who switches the office coffee off again in the evening sends her to the kitchen instead; her walk switches the kitchen lights on and, since only the player leaving arms the off timer, they stay on until the viewer has been in and out. That is the viewer's own lever and costs no task.

## 5. Objectives

All three aims visible from the start (no `unlockAim`, so an early event never completes a task in a locked aim). No aim has `missionConclusion` (section 6). No task mapping uses `onceOnly` except the two that share a mapping with a bark, B2 (`see_queue`) and B3 (`see_coffee_off`); those tasks complete once anyway, so the single firing loses nothing. Every other task mapping stays without it, because `completeTask` returns early on a completed task (`systems/objectives-manager.js:742-744`).
- Aim `morning` "Morning": `see_queue` "Someone waits their turn for coffee"; `hear_queue_chat` "Two in the coffee line pass the time"; `see_coffee_off` "Switch the coffee off and watch them turn back"; `hear_cooler_exchange` "Overhear the conversation at the cooler".
- Aim `midday` "Midday": `use_open_screen` "Use a screen its owner left open"; `see_caught` "Get caught at someone's desk"; `see_cake_eaten` "Put the cake out and watch it go".
- Aim `evening` "Evening": `see_who_stays` "See who stays late".

`hear_queue_chat` carries `"condition": "data.overheard === true"`. Out of earshot a queue chat still runs, as a picture with no line, and still emits `npc_chatted:<objectId>` with `overheard: false` (`systems/npc-needs.js:4495-4527`); the condition stops the task ticking on chat the viewer did not hear. Earshot is the object's `overhearRadius` (200 px on `office_coffee`, `_chatRadius`, `:3006-3011`). Queue chat pairs the user with the front queuer, compatible pairs only, so it is always Chidi and Jun (`:5029-5058`).

## 6. Host and staff ink, and keeping the tour open

`ama_owusu.ink`, the reopen pattern from `scenarios/test_needs_sims/ink/neil.ink` (first talk: `start` plays A1, A2 and diverts to `hub.choices`; later talks: `met_ama` is true, so `start` diverts straight to `hub` for the reopen line A0; `hub` has a reopen line; `reopenRefreshesHub: true`). VARs mirrored from globals: `act_midday`, `act_evening`, `kitchen_seen`, `heard_exchange_cooler_chat`, `cake_servings`, `chidi_pc_owner_away`, `jun_pc_owner_away`. `met_ama` is an ink-local VAR (not a global), exported in `npcInkVariables`, so the opening plays once across re-talks and reloads.
- `start`: first talk A1, A2, then the hub choices; later talks divert to `hub` (A0).
- `hub`: reopen line A0, then choices (seven at most, under dialoguelint's hub limit of 10):
  - "What am I looking at?" (once): A3, A4.
  - "What should I try next?": by act, and within an act by progress globals.
    - Morning (`not act_midday`): A5, A6, then by kitchen and cooler state: `kitchen_seen and heard_exchange_cooler_chat` gives A32 ("You've seen the kitchen. Ask me about lunch when you're ready."); `kitchen_seen` alone gives A7 (points back at the cooler); else A8, A7, in that order (the mugs hint comes before the kitchen hint, section 4 row 1.6). So A32 only appears once the cooler exchange has been heard, not the moment the kitchen is entered.
    - Midday (`act_midday and not act_evening`): A9, A10, then by `cake_servings`: if above 0, A11 and A33 ("Once the cake is gone, tell me to call it a day."); if 0 (an early cake already eaten), A34 ("The cake's gone already. Tell me when to call it a day.") in place of A11 and A33.
    - Evening (`act_evening`): A12, A15.
  - "What was that at the cooler?" (only when `heard_exchange_cooler_chat`): A13, A14.
  - "Let's do lunch." (`not act_midday`): if `not kitchen_seen`, A26 and back to the hub; else if `chidi_pc_owner_away or jun_pc_owner_away`, A29 and back to the hub; else A16, A30, `#set_global:act_midday:true`, exit. Globals sync into the story when the conversation starts, so a viewer who keeps the conversation open while Chidi and Jun walk back hears A29 again until the conversation is closed and reopened. A29 already tells them to give it a minute, which in practice closes the conversation; S3 checks the reopen.
  - "Call it a day." (`act_midday and not act_evening`): the A31 confirm ("The staff won't be back once they've gone home. Seen everything you wanted?") with two sticky sub-choices. "Yes, call it a day." plays A17, A18, `#set_global:act_evening:true`, exit. "Not yet." returns to the hub choices with nothing set.
  - "Give me the short version." (`act_evening`): A19 to A25, A28, back to the hub.
  - "I'll have a look round.": A27, exit.
- Each staff NPC: a minimal five-line chat in its own ink file (start line; a hub reopen line; one flavour choice answered in two lines; a plain exit choice answered with one short reply). Graham's file also holds `exchange_cooler_chat` (Graham and Agnieszka, five lines). The exchange is declared on Graham: `"exchanges": [{ "with": "agnieszka_duda", "knot": "exchange_cooler_chat" }]`, and `heard_exchange_cooler_chat: false` is declared in `globalVariables`.
- `kitchen_seen`: a plain mapping on Ama, `{ "eventPattern": "room_entered:kitchen", "cooldown": 0, "setGlobal": { "kitchen_seen": true } }`, no condition and no onceOnly (setting true again is harmless). The event carries `{ roomId, previousRoom, firstVisit }` (`core/rooms.js:3231-3240`) and fires wherever Ama is, since she is always loaded; `setGlobal` is applied by `systems/npc-manager.js:1500-1506`. Sims uses the same shape for `staff_room_seen` (`scenarios/test_needs_sims/scenario.json.erb:633`).

Keeping the tour open. The server concludes a mission only through an aim with `missionConclusion`. Its two writers of `mission_concluded_at`, `status = 'completed'` and `completed_at` are `check_mission_conclusion`, which returns at once for any aim without the flag (`app/models/break_escape/game.rb:6791-6809`), and `conclude_mission!`, the target of the client's credits post, which returns `concluded: false` at once when no aim has `missionConclusion` (`:7626-7650`). With no such aim the server cannot conclude this scenario, whatever the client does. The only other ending the viewer could see is the credits screen, opened by a scenario `music` event that carries `credits` (`music/scenario-music-events.js:300-378`; the 'victory' playlist that auto-opens the visualiser is only reached through scenario music), so leaving out `music` keeps the credits away. Ink tags cannot conclude: `#ending_check` and `#ending_confirmed` only ask or record (`minigames/helpers/chat-helpers.js:475-497`). So the scenario:
- gives no aim `missionConclusion` (completing all three aims shows three "Aim completed" notices and nothing else, `systems/objectives-manager.js:1223-1270`);
- has no `music` block, so no credits entry and no victory playlist;
- uses no `#ending_check` tag, and leaves `scoring` out of `mission.json` (tasks mode; the validator warns only for the other modes, `scripts/validate_scenario.rb:446-461`).

The ending warning (`systems/ending-check.js`) has nothing to hold, since none of its triggers exists. T23 proves the game is still in progress after all eight tasks.

## 7. Spoken lines

Every line below lives in scenario data (ink, NPC `bark` fields or `chatter` pools), uses no variables and is written to be voiced. Host and staff lines are text only for the first pass; voicing follows a dialogue review (section 13). "Copied" marks a sims line reused word for word; it is still newly voiced, because the speaker and voice differ.

Caps, and how each kind is checked:
- Ink lines: at most 30 words (dialoguelint `CAPS.person`, `scripts/ink_runtime_check/dialoguelint.mjs:19`, an error over it); player choices at most 15 words (a warning). The longest ink line here is 16 words.
- Chatter pool lines and exchange lines: at most 40 characters, one bubble each (`CHAT_LINE_MAX`, `scripts/validate_npc_needs.rb:715`; pools `:739-740`, exchange knot lines `:940-941`, both errors).
- Barks: no tool caps them (dialoguelint reads ink and timed messages only; V7 warns on a bark repeated word for word, `scripts/validate_office_life.rb:742`). This plan keeps every bark at 50 characters or fewer and 12 words or fewer, so a bubble or toast holds it on two lines at most.

Character counts are the full text in the table, punctuation and spaces included; word counts follow dialoguelint's `countWords`.

### 7a. Ama ink

| Id | Choice / place | Text | Chars | Words |
|---|---|---|---|---|
| A0 | hub reopen | What can I help with? | 21 | 5 |
| A1 | start | Today you watch an office instead of breaking into one. | 55 | 10 |
| A2 | start | Everyone here is driven by something. Start with the coffee machine. | 68 | 11 |
| A3 | What am I looking at? | Each person has needs: coffee, water, food, company, work. They run down over time. | 83 | 14 |
| A4 | What am I looking at? | When one runs low, they go to whatever fills it. That's an affordance. | 70 | 13 |
| A5 | try next, morning | Wait for the coffee run. One person at a time; the rest queue. | 62 | 13 |
| A6 | try next, morning | They come back every few minutes. Switch the machine off at the wall socket while they queue. | 93 | 17 |
| A7 | try next, morning (kitchen unseen, after A8) | Then open the kitchen door and hang about by the water cooler. | 62 | 12 |
| A8 | try next, morning (said before A7) | Before you open the kitchen, note the mugs on the floor. Someone dislikes them. | 79 | 14 |
| A9 | try next, midday | Lunch takes people away from their desks. Some lock their screens; some don't. | 78 | 13 |
| A10 | try next, midday | Use an open one, then close it and wait by the desk for its owner. | 66 | 15 |
| A11 | try next, midday | When they're all back and sitting, drop the cake from your inventory here in the office. | 88 | 16 |
| A12 | try next, evening | Everyone's gone home but one. See where she goes. | 49 | 9 |
| A13 | What was that at the cooler? | That was an exchange. Two people at the same machine can have one set conversation. | 83 | 15 |
| A14 | What was that at the cooler? | They have it once, and only if you're close enough to hear. | 59 | 12 |
| A15 | try next, evening | Then walk into the kitchen. The lights there are on a motion sensor now. | 72 | 14 |
| A16 | Let's do lunch. | Good idea. Watch who goes, and what they leave on their desks. | 62 | 12 |
| A17 | Call it a day, after Yes | Right. Home time for nearly all of them. | 40 | 8 |
| A18 | Call it a day. | Have a wander if you like. | 26 | 6 |
| A19 | short version | Needs run down, and people go to whatever fills them. | 53 | 10 |
| A20 | short version | The coffee machine takes one at a time, so people queue and chat. | 65 | 13 |
| A21 | short version | Two at the cooler share a proper conversation, once. Stand close. | 65 | 11 |
| A22 | short version | Switch something off and they turn back. That's a lever. | 56 | 10 |
| A23 | short version | Some lock, some don't. An open screen is an opening, but owners come back. | 74 | 14 |
| A24 | short version | Cake tempts anyone peckish, until it runs out. | 46 | 8 |
| A25 | short version | In the evening the office dims, and the kitchen lights follow you. | 66 | 12 |
| A26 | Let's do lunch, kitchen unseen | Have a look in the kitchen first. That's where lunch happens. | 61 | 11 |
| A27 | I'll have a look round. | Go on. I'll be here. | 20 | 5 |
| A28 | short version, close | That's the tour. Stay and look round as long as you like. | 57 | 12 |
| A29 | Let's do lunch, Chidi or Jun away | Hang on, Chidi or Jun is still out. Give it a minute. | 53 | 12 |
| A30 | Let's do lunch, after A16 | Anyone in the middle of something finishes it first. | 52 | 9 |
| A31 | Call it a day (confirm) | The staff won't be back once they've gone home. Seen everything you wanted? | 75 | 13 |
| A32 | try next, morning (kitchen_seen and cooler heard) | You've seen the kitchen. Ask me about lunch when you're ready. | 62 | 11 |
| A33 | try next, midday (after A11, cake still out) | Once the cake is gone, tell me to call it a day. | 48 | 12 |
| A34 | try next, midday (cake already gone) | The cake's gone already. Tell me when to call it a day. | 55 | 12 |
| A35 | try next, morning (kitchen_seen, cooler not heard) | Hang about by the water cooler. | 31 | 6 |
| A36 | Call it a day, after Not yet | Take your time. | 15 | 3 |

Player choice text (not voiced): "What am I looking at?", "What should I try next?", "What was that at the cooler?", "Let's do lunch.", "Call it a day.", "Yes, call it a day.", "Not yet.", "Give me the short version.", "I'll have a look round."

R1 fixes (build review R1 and dialogue review): M1 guards each `start` with an ink-local VAR (`met_ama` and five `met_<staff>`), so the opening line plays once and a re-talk, after an ended story or a reload, opens at the hub reopen line (A0 and the staff reopen lines). M2 makes "Call it a day." confirm first with A31; A17 answers the Yes. Dialogue M2 adds A32 (morning pointer to lunch once the kitchen is seen) and A33 (midday pointer to the evening). A6 names the machine (was "it"); A13 is past tense ("That was"); A17 says "nearly all" (was "most").

R2 fixes (build review R2): spoken lines changed, so they need the user's yes before voicing. A31 rewritten to name the risk (unticked tasks); R3 m1 then reworded the question so "Yes" confirms it ("Seen everything you wanted?") and not echo A33's "Once" (was "Once they go home, they're gone for the day. Ready?") (m9). A32 now also gated on `heard_exchange_cooler_chat`, so it only replaces the cooler pointer once the cooler exchange has been heard, not the moment the kitchen is entered (m7, no text change). A34 added for the midday try-next when an early cake has already gone (`cake_servings` is 0), in place of A11 and A33 (m6). In the `cooler` pool "Not bad, you?" becomes "Quiet one today, isn't it?" (m8).

### 7b. Staff ink (five lines each)

| Id | Speaker | Place | Text | Chars | Words |
|---|---|---|---|---|---|
| C1 | Chidi | start | Hiya. Can't stop long, I've a report due. | 41 | 8 |
| C2 | Chidi | "Do you always lock your screen?" | If I'm away for more than ten seconds, yes. | 43 | 9 |
| C3 | Chidi | same | That's long enough for someone to have a nose. | 46 | 9 |
| C4 | Chidi | hub reopen | Still here, still busy. | 23 | 4 |
| C5 | Chidi | exit reply | Cheers. | 7 | 1 |
| J1 | Jun | start | Oh, hi. Sorry, I'm a bit swamped. | 33 | 7 |
| J2 | Jun | "Do you lock your screen when you go?" | Lock it? I'm only ever gone a minute. | 37 | 8 |
| J3 | Jun | same | Nobody here would touch it anyway. | 34 | 6 |
| J4 | Jun | hub reopen | Sorry, still swamped. | 21 | 3 |
| J5 | Jun | exit reply | No worries. | 11 | 2 |
| G1 | Graham | start | Now then. You'll be the visitor Ama mentioned. | 46 | 8 |
| G2 | Graham | "Do you get away from your desk much?" | Only for the cooler. It's where you hear things. | 48 | 9 |
| G3 | Graham | same | My screen locks itself, mind. IT set it to twenty seconds. | 58 | 11 |
| G4 | Graham | hub reopen | Go on, then. | 12 | 3 |
| G5 | Graham | exit reply | Right you are. | 14 | 3 |
| N1 | Agnieszka | start | Hi. Somebody has to keep this place tidy. | 41 | 8 |
| N2 | Agnieszka | "Why do you clear the mugs?" | Because nobody else will. | 25 | 4 |
| N3 | Agnieszka | same | If I see dirty mugs, I can't leave them. It's a habit. | 54 | 12 |
| N4 | Agnieszka | hub reopen | Yes? Just tidying. | 18 | 3 |
| N5 | Agnieszka | exit reply | See you. | 8 | 2 |
| Z1 | Zainab | start | Alright. I'm only in to service the kit. | 40 | 8 |
| Z2 | Zainab | "Do you ever join the others?" | I'm in a different office every day. | 36 | 7 |
| Z3 | Zainab | same | Easier to get the job done if I don't get chatting. | 51 | 11 |
| Z4 | Zainab | hub reopen | Still here. | 11 | 2 |
| Z5 | Zainab | exit reply | Right. | 6 | 1 |

Exit choice for each: "I'll let you get on." Each NPC answers it with one short exit reply (x5), and has a hub reopen line (x4) so a second talk does not open on a blank hub. The one topic choice per NPC is flavour: one topic each, no variable, no consequence. It is also the tour's hook (lock habit, cooler, mugs, avoiding people), so it is not a flat choice to fix.

### 7c. Exchange `exchange_cooler_chat` (in graham.ink, heard once)

In the ink, each line carries the speaker's full display name as its prefix: "Graham Whitfield:" for X1, X3 and X5, "Agnieszka Duda:" for X2 and X4. The Speaker column below is shorthand. The prefix is not shown in the bubble; the engine uses it to pick the speaker.

| Id | Speaker | Text | Chars |
|---|---|---|---|
| X1 | Graham | Not seen you at the cooler all week. | 36 |
| X2 | Agnieszka | I've been hiding at my desk, Graham. | 36 |
| X3 | Graham | Deadline? I'll not keep you long. | 33 |
| X4 | Agnieszka | You never do. Five minutes at most. | 35 |
| X5 | Graham | Then back to it. Same time tomorrow? | 36 |

### 7d. Barks (NPC `eventMappings`, `bark` field)

| Id | Speaker | Trigger | Text | Chars | onceOnly |
|---|---|---|---|---|---|
| B1 | Ama | `room_entered:office` | Morning! Come and find me when you're ready. | 44 | yes (not office life) |
| B2 | Ama | `npc_queued:office_coffee` | Look, a queue. They wait their turn. | 36 | yes |
| B3 | Ama | `npc_turned_back:*`, `data.reason === 'off'` | Machine's off, so they turn back. Your lever. | 45 | yes |
| B4 | Ama | `workstation_screen_changed:chidi_pc`, `data.how === 'leave' && data.locked === true && globalVars.act_midday === true` | Chidi's locked his screen before lunch. | 39 | yes |
| B5 | Ama | `npc_left_post:jun_watanabe`, `globalVars.act_midday === true` | Jun's left his screen open. Have a look. | 40 | yes |
| B6 | Ama | `npc_caught_at_post:jun_watanabe`, `delayMs 2500` | Caught! People notice who's at their desk. | 42 | yes |
| B7 | Ama | `magnet_finished:cake` | Two slices, then it's gone. Late ones miss out. | 47 | yes |
| B8 | Jun | `npc_caught_at_post:jun_watanabe`, cooldown 30000 | Er, that's my desk. Can I help you? | 35 | no |
| B9 | Ama | `npc_left_item_gone:jun_watanabe` | Jun's just found his badge gone. That was you. | 46 | yes |
| B10 | Zainab | `global_variable_changed:act_evening`, `value === true`, `delayMs 1500` | Quiet now. Time for a coffee in peace. | 38 | no (a global changes to true once) |
| B11 | Ama | `npc_picked_up:office_mugs` | There go the mugs. Agnieszka can't leave them. | 46 | yes |

B8 is copied word for word from sims Tom (the note lives here, not in the Text cell, so the S5 word-for-word script compares the whole cell). B9 fires only when Jun returns and finds a badge the viewer took (`_collectLeftItems`, `systems/npc-needs.js`), so "That was you." is always true; A16 primes the badge beforehand.

B4 uses `workstation_screen_changed`, which is emitted on every screen change whether or not sound plays (`systems/workstation-state.js:204-205`); the chime event (`workstation_lock_heard`) needs the chime to be audible and so would miss a muted viewer. The midday condition keeps a long morning trip from spending it. B11 is the interest pickup's own event, `{ npcId, itemId, tag }` (`systems/npc-needs.js:3520`); with the viewer elsewhere it shows as a toast, so the mug run is named wherever the viewer is.

### 7e. Chatter pools

Scenario-level pools copied from sims `scenario.json.erb:14-23` (all 40 or fewer; copied, newly voiced):
- `coffee` (6): "Go on, after you.", "Is there any milk left?", "This machine takes forever.", "Strong one today?", "Who keeps taking the mugs?", "Busy morning?"
- `cooler` (8): "Did you see the car park email?", "Friday drinks again?", "How was the weekend?", "Is it raining again?", "Train was late again.", "Any plans for lunch?", "Quiet one today, isn't it?", "Have you tried the new sandwich place?" (38 characters; new, in place of the sims printer line, since the tour has no printer. The seventh line replaced the earlier reply-style opener from R2 m8, because lines are drawn one at a time, so a reply opener could land first)
- `grumble_off` (3): "Who switched the coffee off?", "It's off. Typical.", "No coffee here, then."
- `grumble_gone` (1): "Missed it."
- `cake` (4): as `CAKE_ITEM.md`. The `news_cake` word-of-mouth pool and the magnet's `announce` were dropped (S3 fix): the tour drops the cake in the one room everyone shares, so every staff member sees it by sight and nobody is ever told, so the pool could never speak.

No `grumble` pool. It is spoken only on an avoidance turn-back, or an off or gone turn-back with no pool of its own (`systems/npc-needs.js:2283-2289`). Nobody here can turn back for avoidance: Zainab's `avoidRadius 0` returns from the recheck at once (`:2049`) and nobody declares her in `avoids`; `grumble_off` and `grumble_gone` have their own lines. V10 would flag the pool as never spoken.

Per-NPC pool extras (new):

| Id | Speaker | Pool | Text | Chars |
|---|---|---|---|---|
| P1 | Chidi | coffee | Report's due at four. Wish me luck. | 35 |
| P2 | Chidi | coffee | Someone's finished the biscuits. | 32 |
| P3 | Jun | coffee | Third one today. Don't judge. | 29 |
| P4 | Jun | coffee | Did you see that new rota? | 26 |
| P5 | Graham | cooler | How's tricks, then? | 19 |
| P6 | Graham | cooler | Nobody tells me anything up here. | 33 |
| P7 | Agnieszka | cooler | Someone's left mugs everywhere again. | 37 |
| P8 | Agnieszka | cooler | Are you going to the quiz? | 26 |

Zainab has no pool lines: she chats with nobody.

Totals: Ama 31 ink lines and 9 barks (40 clips); staff 25 ink lines (15 chat lines plus 5 reopen and 5 exit replies), 5 exchange lines, 2 barks, 8 pool extras (40 clips); 24 copied pool lines and 1 new scenario pool line (25 clips). 105 lines and about 105 clips in all, before V6 counts them per voice. V7 runs again on the pools at S5. V6 gives the clip count per voice before any voicing is asked for.

## 8. Sync budget

Caps from `scripts/validate_office_life.rb:766-800`. Planned counts; S5 replaces them with the validator's numbers.

| Row | Count | Cap | What counts |
|---|---|---|---|
| workstation globals | 9 | 24 | 3 each for `chidi_pc`, `jun_pc`, `graham_pc` (`workstation: true` plus `owner`) |
| heard_ globals | 1 | 8 | `heard_exchange_cooler_chat` |
| magnet servings | 1 | 2 | `cake_servings` |
| reveal and left-behind globals | 1 | 6 | `jun_badge_left` |
| dropped magnet items | 1 | 2 | the cake (carried, no room) |
| office-life onceOnly mappings | 8 | 10 | B2 `npc_queued`, B3 `npc_turned_back`, B4 `workstation_`, B5 `npc_left_post`, B6 `npc_caught_at_post`, B7 `magnet_`, B9 `npc_left_item_gone`, B11 `npc_picked_up` (all on the prefix list, `:50-58`) |
| office-life items | 2 | 4 | badge (takeable), cake (carried) |
| small keys (rows excluding items) | about 20 | 64 | |

The coupling mappings carry `needs` but no `onceOnly`, so they add nothing to the onceOnly row; B1 (`room_entered`) is not office life.

Other saved state, all bounded and sent as deltas through the keyed sections (`state-sync.js:43`):

| Section | Keys | Bound |
|---|---|---|
| `globalVariables` | `act_midday`, `act_evening`, `kitchen_seen`, `office_coffee_off` (booleans, all declared `false`); `cake_servings` (0 to 2); the rows above, of which `chidi_pc_owner_away` and `jun_pc_owner_away` are also declared (`false`) so they reach Ama's ink | fixed set, declared up front |
| `npcVisibility` | `chidi_okeke`, `jun_watanabe`, `graham_whitfield`, `agnieszka_duda`, each `false` after the evening turn (`systems/npc-manager.js:2207-2226`, sent at `state-sync.js:549-550`) | 4 entries, one boolean each, written once |
| `triggeredEvents` | fired onceOnly mappings: B1 to B7, B9, B11 | 9 entries |
| `npcInkVariables` | six one-per-NPC `met_*` booleans (`met_ama` plus `met_chidi`, `met_jun`, `met_graham`, `met_agnieszka`, `met_zainab`), the M1 re-talk guard; each stored under its own NPC id. Ama's six mirrored globals are excluded from this export (`systems/npc-conversation-state.js:258`, `:331`) and travel only in `globalVariables` | 6 |

Nothing grows `player_state`; every key is a boolean or a small bounded integer, written when it changes.

## 9. Ending and reload behaviour

- No conclusion, no credits, no ending warning (section 6). The objectives panel shows all three aims complete; the viewer can keep walking round, talking to Ama and replaying the recap.
- Reload keeps act globals, NPC visibility, lighting variants and fired onceOnly mappings; needs reset to each NPC's `initial` (accepted for a tour: Ama's hints still hold, and the coffee run restarts from spawn timing). The `met_*` re-talk guards persist (they export in `npcInkVariables`), so a reload does not replay the opening or the staff greetings. A reload in the 8 s window after the evening turn is covered by a second Zainab mapping, `room_entered:office` with `globalVars.act_evening === true` and `caffeine: 10` (spawn fires `room_entered`), so `see_who_stays` still has a low-caffeine Zainab heading for coffee rather than waiting on her reset caffeine. `see_who_stays` also ticks on her coffee use itself, by a widened `npc_used:*` mapping (`data.need === 'caffeine'`), so a kitchen-coffee fallback counts too. A dropped cake is covered by build check BC1 (section 10). Needs restart at 90 hunger, and the cake magnet tempts at `urgentAt 40 < level <= 85` (`tempt 45`), so a hunger of 90 falls into the band in about a minute; a viewer who reloads in midday and then drops the cake sees it sit untouched only for that short time.

## 10. Risks and points to measure

| # | Risk or point | How it is settled |
|---|---|---|
| R1 | Ama at (5.5, 4.5) crowds Graham's chair or the west lane | Placed off the door line from the door cell, with a 4-cell west lane (section 2). S1 render, the free-cell count and the first coffee and west-door walks |
| R2 | Parked needs wake when the kitchen loads | Settled by code: `_wakeParked` (`systems/npc-needs.js:2016`) retries every parked need when a room loads or a door opens. S2 still holds the kitchen shut past 2:40, then opens it; Graham and Agnieszka must go |
| R3 | Coffee timings (first queue near 0:50, second run near 3:35) are computed, not measured | S2 logs both runs' times; adjust Chidi's `initial` or decay if they drift by more than 20 s |
| R4 | Zainab queuing with `avoids ["*"]` and `avoidRadius 0` | S2: she reaches queue cell two and does not turn back |
| R5 | Hiding an NPC mid-use of a machine at the evening turn: a hidden NPC's job is aborted and a sitter unseated (`systems/npc-needs.js:1416-1424`, `systems/npc-behavior.js:427-435`) | S4: turn the evening during a cake or coffee use; no stuck image or held capacity |
| R6 | Reload resets needs to `initial`: midday hunger levels are lost | Accepted; S4 reload test records it |
| R7 | A dropped cake after a reload | Build check BC1 below |
| R8 | Desk claiming depends on declaring the four desk machines in sims' order | S1: each NPC sits at its own desk |
| R9 | Agnieszka's mug run | Settled by code (section 4, row 1.6): it starts as the kitchen first loads. S2 logs the pickup time against the door opening |
| R10 | The evening's `setGlobal office_coffee_off false` and the socket | Settled by code: the socket's two `confirm_action`s read the condition at click time from `window.gameState.globalVariables` (`systems/apply-actions.js:142-145`); a mapping's `setGlobal` writes that object and emits `global_variable_changed:<name>` (`systems/npc-manager.js:1500-1512`); sprite variants re-render on that event (`core/rooms.js:712-737`). S4 clicks the socket once after the turn: it offers "Switch off" and shows on |
| R11 | B1 on `room_entered:office` at spawn, and not again after a reload | S1: spawn, kitchen and back, reload; one B1 |
| R12 | The kitchen coffee's object-form `offWhen` | Read by `_isOff` through `requiredGlobalsHold` (section 2); the schema allows it (`scripts/scenario-schema.json:5481`) and `check_off_when` (`scripts/validate_npc_needs.rb:442-466`) passes with the key declared and set by the socket. S2 (T6b, T7) shows it off at load and on after the switch-off |
| R13 | The lunch gate reads stale VARs while Ama's conversation stays open | Accepted (section 6); S3 closes and reopens to check A16 then plays |
| R14 | The lamp over Zainab's tool roll reads cream rather than a warm evening glow (R1 m5) | Deferred to a later lighting pass; recorded here so the pass finds it. Cosmetic only; no task or beat depends on it |

Build check BC1, the cake after a reload (run in S3, recorded in the S3 commit message). From code: a drop is saved as a room object with `sourceType 'player_drop'` and its room-relative position, then removed from the server inventory (`persistDrop`, `systems/item-drop.js:16-18`, `:355-393`); on reload the room places it from the saved position and `scanMagnets` registers it again when the room loads (`systems/npc-needs.js:872-881`), with servings read from `cake_servings`. Four reloads, each on a fresh game:
1. Cake still held: it is in the inventory, nowhere in a room.
2. Cake down, untouched: it is at the same tile (and on the same table top, if dropped on one), `cake_servings` is 2, and, after the reload, one NPC's hunger is set to 60 with `__test.needs.set(npcId, 'hunger', 60)` (`systems/test-bridge/index.js:2220`, a test step, not tour content; see section 9), who then walks to it.
3. Cake down, one slice taken: `cake_servings` is 1, then after the reload one NPC's hunger is set to 60 the same way, that NPC eats, then `magnet_finished:cake` fires and `see_cake_eaten` ticks.
4. Cake finished: no cake in either room and none in the inventory; the task stays ticked.
Pass: all four as written. If 2 or 3 places the cake elsewhere but it still works as a magnet, that is accepted and noted in section 9. If 4 shows a finished cake again, or 2 or 3 shows a cake nobody can eat, the failing case goes to the engine backlog (no engine edits in this plan) and is recorded in section 9 as a known reload limit; a reload mid-cake is rare on a guided tour, and the three midday tasks still tick on a fresh run.

## 11. Build slices

Each slice ends with a commit on the branch and a live proof on a keyless server from the worktree on a free port (not 3000, 3001, 3002, 3085 or 3086), a fresh game per edit from `tools/playtest/new-game.rb office_life_showcase`, headless with `game.loop.setFPS(20)` and fixed steps on, driven through `window.__test`. Stop the server by PID only.

- S1, skeleton. `mission.json` (display name "Office Life Tour", no `scoring`), `scenario.json.erb` (rooms, objects, cast with needs, globals, objectives with no `missionConclusion`, no `music` block, Ama's art and voice fields), Ama's ink with start, hub and exit only, five-line staff inks, base lighting. Proof: validator clean; render both rooms; each staff NPC reports `atPost` at its own desk; watch the first coffee walk and the first walk to the west door past Ama's spot (R1, R8, R11). Three named checks at Ama's spot (5.5, 4.5) = px (176, 144), body x 166 to 186, west desk edge 108. W0, before any walk: read the NPC pathfinding grid row at y 144 and count the free cells west of Ama between the desk and her body; at least 2 are required (4 expected). W1 (the NPC grid treats Ama as an obstacle because she is immovable, so every lunch walk, kitchen trip and mug run routes round her, none clips her body, and no NPC stalls or takes a long detour). W2, Jun's walk back from the west door to his post, `jun_pc` (feet about px (92, 164); (3, 6) is only his start tile), reaches `atPost` without sliding along Ama's body or waiting. W1 also covers the east lane: Chidi's office-coffee walk passes down it, and no walker may overlap Ama or stall there. Jun's and Zainab's coffee walks run below Ama's rows, and every west-door walk runs along y 80 to 96 above the desks. To send anyone through the west door in S1, open the kitchen once (enter and leave), then switch the office coffee off at the socket; with the kitchen unloaded, coffee jobs park with `no_source`.
- S2, morning. Pools, per-NPC extras, coffee queue and both coffee couplings, the kitchen coffee's `offWhen`, socket lever, cooler coupling and exchange, mugs, B1 to B3, B11, `kitchen_seen`, Ama's hub hints. Proof: a timed run ticks all four morning tasks with no `__test.needs.set`; log the first and second queue times, the exchange time and the mug pickup against the door opening; log `chidi_pc_screen_locked` on Chidi's first coffee leave (expect the lock chime on every coffee run); a second run opens the kitchen at 0:30 (T6b); a third holds the kitchen shut until 3:30 (R2 to R4, R9, R12).
- S3, midday and cake. Midday mappings, the lunch gate and its two declared globals, A29, A30, B4 to B9, Jun's work coupling, cake item and pools. Proof: call lunch during the second coffee run (A29), then after both return; see B4 with sound off, use Jun's PC, close it, wait by the desk, get caught, wait for all four, drop the cake; three midday tasks tick; build check BC1 (R7, R13).
- S4, evening and lighting. Hide mappings, the coffee switch-on, lighting variants, B10, Zainab's delayed caffeine. Proof: screenshots of both rooms before and after the turn; no hidden NPC leaves a drawn image; Zainab goes to the office coffee and the task ticks; kitchen dark, then lit on entry, then dark 12 s after leaving; turn the evening with the coffee switched off and during a use, then click the socket once (R5, R10); reload after the turn keeps staff hidden and evening light (R6).
- S5, checks and full run. Validator with V6, V7, V8 and V10; a script that checks every line in section 7 against the scenario data and inks word for word, with the character and word caps; `dialoguelint.mjs`; then a full run from spawn to recap following Ama's hints, timed (target 5 to 10 minutes), with `tools/playtest/verify-run.rb` showing all eight tasks; `tools/playtest/train-check.sh` green on the hash.

## 12. Tests

| # | Test | Live proof |
|---|---|---|
| T1 | Scenario validates; V8 counts within caps and match section 8 | validator output saved in the S5 commit message |
| T2 | Each staff NPC starts at its own post; Ama does not block a lane | S1: `__test.needs.state(id).atPost` for five NPCs; screenshot of the first coffee walk and of the first walk to the west door past Ama; W0, W1 and W2 (section 11) |
| T3 | Intro bark plays once, not on re-entry or reload | S1: enter, leave to the kitchen, return, reload; one B1 |
| T4 | First coffee queue forms near 0:50 with Jun second and Zainab third | S2: `needs.log()` timestamps; `see_queue` ticks |
| T5 | Queue chat plays from the coffee pools, never from Zainab; the task ticks only with the viewer in earshot | S2: one run with the viewer in the kitchen during the first queue (no tick), then near the queue (tick) |
| T6 | Second run near 3:35 brings Jun and Zainab again, with the kitchen already open | S2: `needs.log()`; two `npc_queued:office_coffee` on the second run; nobody targets `kitchen_coffee` |
| T6b | Kitchen opened before the first run: the first queue still forms in the office | S2: a run that opens the west door at 0:30; at about 0:50 Jun and Zainab queue at `office_coffee`, `see_queue` and `hear_queue_chat` tick, and `kitchen_coffee` reports off |
| T7 | Switching the socket off turns walkers and queuers back with `grumble_off`; the kitchen machine comes on and they go to it | S2: first open the kitchen once (enter and leave), because before it loads coffee jobs park with `no_source` and nobody walks west; then `see_coffee_off` ticks; `kitchen_coffee` reports on in the same step; their next target is `kitchen_coffee`; switching the socket back on turns the kitchen machine off again and the next run queues in the office |
| T8 | Cooler pair meets and the exchange plays once | S2: `hear_cooler_exchange` ticks; a later cooler visit plays pool lines only |
| T9 | Kitchen opened late: the cooler pair goes once it loads | S2 second run, kitchen held shut to 3:30 |
| T10 | Agnieszka carries the mugs to the tray as the kitchen first loads; B11 shows | S2: her pickup within a few seconds of the west door opening; mugs object gone from the office, tray holds them, B11 in the bark log; the same on the run that holds the kitchen shut |
| T11 | "Let's do lunch." refuses before the kitchen is seen, and while Chidi or Jun is away from the desk; it works once both are back | S2/S3: choose it at spawn (A26, no global change); during the second coffee run (A29, no global change); after both return (A16, A30, `act_midday` true) |
| T12 | Chidi locks on his lunch trip, Jun leaves his PC open, both within 10 s of the call | S3, sound off: `workstation_screen_changed:chidi_pc` with `locked: true`; `jun_pc` unlocked; B4 and B5 seen; one forced run calls lunch while Jun is mid desk use and B5 still shows when he goes |
| T13 | Using Jun's PC ticks the task and brings him back; he catches the viewer waiting by the desk | S3: `use_open_screen` and `see_caught` tick; B8 then B6 as he walks up; a second run staying in the PC shows both after closing it |
| T14 | Badge bonus: taking Jun's badge draws B9 on his return | S3: forced by retrying until the 70% leave occurs |
| T15 | Cake: two servings taken, the cake finishes, anyone still walking turns back | S3: two `magnet_serving:cake`; zero to two `npc_turned_back` with reason `gone`; `see_cake_eaten` ticks; B7 |
| T16 | Cake after reload | Build check BC1 (section 10) |
| T17 | Evening turn hides four NPCs as A18 ends and dims the office | S4 screenshots before and after; no leftover drawn image |
| T18 | Zainab barks, then goes to the office coffee; task ticks | S4: B10 seen; target `office_coffee`; `see_who_stays` ticks |
| T19 | Kitchen is dark in the evening until entered, then dark 10 s after leaving | S4 screenshots at entry and 12 s after leaving |
| T20 | Evening turn during a use leaves no stuck NPC or held machine | S4 forced timing |
| T21 | Reload in each act: act globals, visibility and lighting persist; needs reset as expected | S4 |
| T22 | Every spoken line in section 7 is in the data word for word; caps from section 7 hold | S5 script and `dialoguelint.mjs` |
| T23 | Full tour from spawn to recap in 5 to 10 minutes, eight tasks ticked, and the game stays open | S5 timed run with `verify-run.rb`; after the last task `window.breakEscapeConfig.missionConcludedAt` is unset, the server reports the game `in_progress`, no credits or ending warning appear, and Ama's recap still plays |
| T24 | test_needs_sims unchanged | S5: `git diff main -- scenarios/test_needs_sims` empty |

## 13. Voicing

Text only for the first pass. After S5, run npc-dialog-review on the new lines; then ask for a yes to voice, giving V6's clip count. Ama uses Autonoe with her ca18 style string; staff voices from VOICE_CAST.md. Lines a review changes after voicing need their own yes.

## 14. Optional extras (need engine changes; not in this plan)

- A scenario global that drives the needs overlay, so Ama could switch it on for one beat.
- A day-clock HUD showing morning, midday and evening.
- A tour reset that restores needs and globals without a new game.

## 15. Decisions

Decided by the user (D102): display name "Office Life Tour"; Jun's left-behind badge stays as a bonus beat with no task and one Ama line (B9); the tour stays open after the last task, Ama's recap closes it, with no credits and no mission-complete ending.

Decided without asking:
- Staff get the five-line chats (start, reopen, two-line answer, exit reply).
- The coffee lever relies on the repeating coffee run rather than a new "send someone for coffee" choice.
- Only one coffee machine runs at a time: the kitchen machine is off while the office one is on, so the queue forms in the office whenever the viewer opens the kitchen, and switching the office machine off is what sends people to the kitchen. The observation on the kitchen machine gives the in-world reason (a shared fuse).
- "Let's do lunch." waits for the kitchen to be seen (one boolean) and for Chidi and Jun to be at their desks (two engine globals declared so ink can read them), so the lunch leaves, B4, B5 and the badge roll always happen.
- Ama stands in the middle of the aisle, off the line every kitchen trip takes to the west door.
- Graham's avoidance of Zainab is dropped because the two never share a machine in this tour, so it would never show.
- The mug run is named by Ama's hint and a bark (B11), not a task: it starts the moment the kitchen loads, usually behind the viewer, so a task would tick on something they did not watch.
- The evening switches the office coffee back on, so the kitchen machine is off and the kitchen's motion lights answer only to the viewer.
