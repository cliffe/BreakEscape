# office_life_showcase: plan

A new test scenario: a guided tour of office life in three acts, hosted by Ama Owusu. Plan only; the build follows in slices S1 to S5 (section 11). The cake item is specified in `CAKE_ITEM.md`. Engine paths below are under `public/break_escape/js/`.

## 1. Goals and audience

- A guided 5 to 10 minute tour of office life for colleagues who know Break Escape. Ama Owusu hosts; she may use engine terms (needs, affordance, capacity, exchange, lever, security window).
- Collection `test_scenarios`. Display name "Office Life Tour". `estimated_duration_minutes` 8. No firm is named in any spoken line.
- test_needs_sims stays unchanged as the regression fixture. Only existing engine features; anything needing an engine change is in section 14.
- Overlay off (`needsDebugOverlay` left out). `showPressingNeeds: true`, `npcThoughts` default (on), `officePresets: true`, `roomTone: true`, `lighting` on, scenario-level `disableAttacks: true` (so no KO cases).
- The viewer sets the pace. Nothing locks: both rooms are open from the start, and each act turn is a choice in Ama's hub.
- The tour never ends by itself. After the last task it stays open; Ama's recap is the close (section 6). Section 6 also says how the scenario is kept from concluding.

## 2. Rooms, map reuse and positions

Two rooms, both maps from test_needs_sims. No third room.

- `office` (`room_office`, `public/break_escape/assets/rooms/room_office.json`, 10 x 10 tiles of 32 px), start room, `startPosition` (5, 6) = px (160, 192). Connection `west: kitchen` only.
- `kitchen` (`room_break`, `room_break.json`, 10 x 10), connection `east: office`.

How positions read. A scenario object's `position` is the top-left corner of its sprite in tiles (objects use origin (0, 0), `core/rooms.js:346`, `:694`; placed at `roomX + x * 32`, `core/rooms.js:598-599`); a value outside the room is ignored and the object lands at random (`:593-597`). An NPC's `position` is the centre of its sprite (`systems/npc-sprites.js:325`, Phaser's default origin 0.5). The desk machines (`pc`, `laptop`) have no `position`: they claim the Tiled desk items in declaration order, so they are declared in the same order and types as sims.

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
- `fridge` (qdc_fridge1) at (1, 2) with `restores 40`; `microwave` (microwave1) at (5, 3) with `restores 40`.
- `kitchen_coffee` (coffee_station1) at (3, 8), `useFrom (0,-1)`, queue (1,-1), (2,-1).
- `water_cooler` (water_cooler1) at (1, 7), `affordance: { "useSeconds": 40, "overhearRadius": 360 }`. The 40 s use gives a coupled pair time together for the exchange (the preset's 15 s leaves them 3 to 7 s); the radius covers the whole room, so the viewer need not stand anywhere special.
- `washing_up_tray` (mugs_tray1) at (3, 3), accepts `dirty_mugs`, `useSeconds 5`.

Dropped from sims: copiers and outputs, print queue, deadline memo, coffee notice, activity board, desk phones, kitchen rota, kitchen copier socket, parcel, player mugs, the east and north doors.

NPC posts (sprite centres, tiles): Chidi (7, 3), Jun (3, 6), Graham (3, 4), Agnieszka (1, 5), Zainab (2.15, 6.65), all copied from the sims NPC each one replaces. Ama (new) at (4.75, 3.25) = px (152, 104): the top of the middle aisle, below the bookcase (its bottom edge is at y 66 px) and left of the chair (from x 182 px). The east side has no free spot: (8.5, 4.5) = px (272, 144), for example, sits inside the north-east desk's footprint (x 210 to 288 px, y 117 to 156 px) and on the bin. Chidi at (7, 3) reaches the coffee's approach tile (7, 8) round the east desks, by the aisle (passing about 40 px east of her) or by the gap along the east wall. S1 renders the room and watches the first coffee walk and the first lunch walk to the west door, and moves her if she blocks a lane.

Lighting: office `on`; evening variant `{ "condition": "globalVars.act_evening === true", "ambient": "#8f96b0", "lights": [warm lamp over Zainab's tool roll] }`. Kitchen `on`; evening variant `{ "condition": "globalVars.act_evening === true", "mode": "motion", "offAfter": 10 }`. A variant applies as soon as its global changes and is re-read on load (`systems/lighting.js:37-42`, `:788-805`). In motion mode a visible NPC on the floor switches the lights on (`:1159-1168`), but only the player leaving starts the off timer (`:1031-1044`); so the evening must send nobody but the viewer into the kitchen (section 4, row 3.1).

## 3. Cast

All from the awareness course, with full atlases (`sit_` frames), talk, visemes and headshot in `public/break_escape/assets/characters/`. Apart from the host, none is in demo_access_tour's cast. Voices and accents from VOICE_CAST.md. Ama reuses her ca18 art (`spriteSheet ama_owusu`, `spriteTalk assets/characters/ama_owusu_talk.png`, `spriteVisemes assets/characters/ama_owusu_visemes.png`) and her ca18 voice (Autonoe, same style string, `scenarios/ca18_credential_attacks_at_scale/scenario.json.erb:799`).

| Key | Who (VOICE_CAST) | Sims role copied | Needs (decayPerMin/urgentAt/initial) | Features carried |
|---|---|---|---|---|
| `ama_owusu` | Ama Owusu, 40s, Black British (Ghanaian heritage), London | none (host) | none | ink hub, act turns by `#set_global`, label barks, task mappings, `facePlayer` |
| `chidi_okeke` | Chidi Okeke, 40s, Nigerian-British, West Yorkshire | Amara | caffeine 25/40/61 (urgent about 0:50), work 10/50/72, hunger 5/40/90 | leads every coffee run, `habits.screen.lockIfAwayOverSeconds 20` (locks on a long trip), lunch on cue |
| `jun_watanabe` | Jun Watanabe, early 20s, Japanese-British, southern English | Tom | caffeine 10/40/70, work 8/50/80, hunger 5/40/90 | follows Chidi to the coffee and queues (queue chat), `habits.screen.lockChance 0` (leaves his PC open), left-behind badge, caught bark, lunch on cue |
| `graham_whitfield` | Graham Whitfield, early 60s, white British, Halifax | Sanjay | work 15/50/65, social 12/40/72 (urgent about 2:40), hunger 4/40/90, caffeine 1/30/95 | `habits.screen.lockChance 0` (never locks by hand), so `graham_pc` locks itself 20 s after he leaves; cooler pair and the exchange |
| `agnieszka_duda` | Agnieszka Duda, 30s, Polish, lightly accented | Grace | thirst 15/40/80 (urgent about 2:40), hunger 4/40/90 | `interests` dirty_mugs (carries the Abandoned Mugs to the washing-up tray), cooler pair partner |
| `zainab_hussain` | Zainab Hussain, 30s, British Bangladeshi, northern English; field service engineer | Marek | caffeine 1/30/95, thirst 2/30/95 | `needsCompany.avoids ["*"]`, `avoidRadius 0` (queues, chats with nobody, never told about the cake); caffeine set to 10 whenever someone else queues at the office coffee; stays late |

Ages run early 20s to early 60s; three women, three men including the host.

Coupling mappings (the pattern sims uses for Sanjay after Marek and Marek after Tom, `scenarios/test_needs_sims/scenario.json.erb:727`, `:760`):
- On Jun: `npc_left_post:chidi_okeke`, `"condition": "data.targetId === 'office_coffee'"`, cooldown 30000, `needs.set.caffeine 10`. Every Chidi coffee run brings Jun in behind him. Chidi claims the machine first, since he selected first; Jun's select then finds it taken and joins the queue, which emits `npc_queued:office_coffee` at the select (`systems/npc-needs.js:3190`).
- On Zainab: `npc_queued:office_coffee`, `"condition": "data.npcId !== 'zainab_hussain'"`, cooldown 30000, `needs.set.caffeine 10`. She joins any queue third, whoever is second.
- On Graham: `npc_left_post:agnieszka_duda`, `"condition": "data.targetId === 'water_cooler'"`, cooldown 30000, `needs.set.social 10` (one-way: her drink pulls him).
- On Jun: `workstation_accessed:jun_pc`, `"condition": "globalVars.act_midday === true"`, cooldown 60000, `needs.set.work 5` (he heads straight back after eating).

Coffee timing. A use restores its need only when it ends, and decay pauses while using (`systems/npc-needs.js:3663-3665`, `:1552`); the coffee preset is `useSeconds 12`, capacity 1, `restores 70`. Chidi goes urgent at about 0:50, so the first queue forms after a typical opening chat (A1, A2 point the viewer at the machine). His cup ends near 1:08 at the cap of 100; at 25 a minute he is urgent again after 2:24, so the second run is at about 3:35, with Jun and Zainab coupled in again. Jun's own caffeine (77 after his cup, 10 a minute) would not bring him back before about 5:00; the coupling, not his clock, sets his runs.

## 4. Tour, act by act

Times are from spawn for a viewer who follows Ama's hints; the viewer may be slower, and every beat waits or repeats (section 10 lists what is still to be measured). "Label" is the line that names the feature as it happens. Tasks are in section 5; all task mappings sit on Ama, who never hides.

Needs keep running for every NPC during a conversation except the one being talked to (`systems/npc-needs.js:1437-1446`). A bark raised while a conversation or minigame is open is held and shown after it closes, one every 2.5 s, re-checked before it shows (`systems/npc-barks.js:240-255`). A bark from Ama while the viewer is in the kitchen shows as a voiced toast (`systems/npc-barks.js:26-29`).

### Act 1, Morning (0:00 to about 4:00)

| # | Time | Viewer does | Viewer sees | Label | Task | Ticks on |
|---|---|---|---|---|---|---|
| 1.1 | 0:00 | Spawns in the office | Five staff at their posts; Ama at the top of the aisle | Ama bark B1 | none | `room_entered:office` (onceOnly, not office life) |
| 1.2 | 0:05 | Talks to Ama | A1, A2 (watch the coffee); the hub; "What am I looking at?" gives A3, A4 | Ama A1 to A4 | none | none |
| 1.3 | about 0:50 to 1:30 | Watches the coffee | Chidi walks to the office coffee; Jun follows and queues; Zainab queues third | Ama bark B2 | `see_queue` | `npc_queued:office_coffee` |
| 1.4 | about 0:55 to 1:10 | Stands within about six tiles of the queue | Chidi and Jun swap lines from the `coffee` pool; Zainab says nothing (avoids everyone) | the bubbles | `hear_queue_chat` | `npc_chatted:office_coffee` with `data.overheard === true` |
| 1.5 | about 1:30 | Opens the west door to the kitchen | Kitchen lit; Ama's "Let's do lunch." now works | none | none | `room_entered:kitchen` sets `kitchen_seen` |
| 1.6 | any time | Watches the mugs | Agnieszka, on a trip out of the office, picks up the Abandoned Mugs and takes them to the washing-up tray | Ama A8 (hint, in advance), Ama bark B11 | none | `npc_picked_up:office_mugs` |
| 1.7 | about 2:40 | Waits in the kitchen | Graham and Agnieszka meet at the cooler (her drink pulls him); the five-line exchange plays once; back in the office, Graham's screen locks itself 20 s after he left | the exchange; Ama A13, A14 if asked | `hear_cooler_exchange` | `npc_exchange_heard:exchange_cooler_chat` |
| 1.8 | about 3:35 | Back in the office, stands by the socket | Chidi's second coffee run; Jun and Zainab queue again | none | none | none |
| 1.9 | while they walk or queue | Switches the coffee off at the socket (confirm) | Those walking to it or queued turn back with a `grumble_off` line and head for the kitchen coffee; one already pouring finishes | Ama bark B3 | `see_coffee_off` | `npc_turned_back:*` with `data.reason === 'off'` |

Late viewers: the coffee run repeats about every 2:25 for as long as the office coffee is on, so 1.3, 1.4 and 1.9 can happen on any run, in any act. If the kitchen is still unopened at 2:40, Graham and Agnieszka wait at their desks and go once it loads.

### Act 2, Midday (about 4:00 to 6:00)

| # | Time | Viewer does | Viewer sees | Label | Task | Ticks on |
|---|---|---|---|---|---|---|
| 2.1 | about 4:00 | Ama: "Let's do lunch." (only after `kitchen_seen`) | Conversation closes; Chidi and Jun hunger set to 20, Graham and Agnieszka to 62 | Ama A16 | none | `global_variable_changed:act_midday` |
| 2.2 | about 4:05 | Stays in the office | Chidi leaves for the kitchen; his screen locks as he goes (a soft chime if sound is on) | Ama bark B4 | none | `workstation_screen_changed:chidi_pc` with `data.how === 'leave' && data.locked === true && globalVars.act_midday === true` |
| 2.3 | about 4:05 | Stays in the office | Jun leaves too; his screen stays open (white breathing dot); his badge may stay on the desk (70%) | Ama bark B5 | none | `npc_left_post:jun_watanabe` with `globalVars.act_midday === true` |
| 2.4 | about 4:15 | Uses Jun's PC | Jun's desktop | none | `use_open_screen` | `workstation_accessed:jun_pc` (the same event brings Jun back early, section 3) |
| 2.5 | about 4:45 | Closes the PC and waits beside Jun's desk | Jun walks back into the office and finds the viewer at his desk | Jun bark B8, then Ama bark B6 (`delayMs 2500`) | `see_caught` | `npc_caught_at_post:jun_watanabe` |
| 2.6 | optional | Picks up Jun's badge before he returns | On his return Jun misses it | Ama bark B9 | none | `npc_left_item_gone:jun_watanabe` |
| 2.7 | about 5:00, once all four are back and sitting | Drops the cake from the inventory in the office | Those who see it and are tempted walk over; two eat with `cake` pool lines; anyone still walking when the second slice goes turns back with "Missed it." | Ama bark B7 | `see_cake_eaten` | `magnet_finished:cake` |

Row 2.5: `npc_caught_at_post` fires once per return while Jun walks back inside the office, if the viewer is within 1.5 tiles of his desk's approach cell or has his PC open (`systems/npc-needs.js:3371-3383`). A viewer who stays in the PC is caught too, but B8 and B6 then wait until the PC is closed (a delayed mapping that falls due while a minigame is open waits for it to close, `systems/npc-manager.js:921-925`). A10 therefore says to close the PC and wait by the desk, so both barks show as Jun walks up.

Row 2.7: Chidi and Jun eat at the fridge and microwave (restores 40, so 20 becomes 60); Graham and Agnieszka sit at 62. The tempt band is at or below 70 (urgentAt 40 plus tempt 30), so all four are tempted. An NPC part way through a desk use does not look for a target until the use ends (`systems/npc-needs.js:1509-1513`), and one that looks after both slices are claimed never sets off (`_magnetsFor`, `:931`). So the number who turn back is anything from none to two; B7's wording holds for any count, and the task needs only the cake to be finished. Word of mouth plays only if the cake goes down in the kitchen with someone there; it is not a task.

### Act 3, Evening (about 6:00 to 7:30)

| # | Time | Viewer does | Viewer sees | Label | Task | Ticks on |
|---|---|---|---|---|---|---|
| 3.1 | about 6:00 | Ama: "Call it a day." | A17, A18 play; as A18 ends (the `#set_global` runs after it) Chidi, Jun, Graham and Agnieszka vanish, the office ambient dims, the lamp over Zainab's tool roll comes on, and the office coffee is switched back on | Ama A17, A18 | none | `global_variable_changed:act_evening` with `value === true` (one `setVisible false` mapping per hidden NPC; on Ama, `setGlobal { office_coffee_off: false }`) |
| 3.2 | 1.5 s after the conversation closes | Watches Zainab | Zainab speaks | Zainab bark B10 | none | same event, `delayMs 1500` |
| 3.3 | 8 s after close | Watches Zainab | Her caffeine is set to 10 and she goes to the office coffee | none | `see_who_stays` | `npc_left_post:zainab_hussain` with `globalVars.act_evening === true` |
| 3.4 | about 6:30 | Walks into the kitchen | The dark kitchen lights on entry, and goes dark 10 s after the viewer leaves | Ama A15 (hint) | none | none |
| 3.5 | about 7:00 | Ama: "Give me the short version." | Recap of each feature in the order seen, then the close | Ama A19 to A25, A28 | none | none |

Switching the office coffee back on at the evening turn keeps Zainab out of the kitchen, so nothing but the viewer switches the motion lights on there.

## 5. Objectives

All three aims visible from the start (no `unlockAim`, so an early event never completes a task in a locked aim). No aim has `missionConclusion` (section 6). No task mapping uses `onceOnly`: `completeTask` returns early on a completed task (`systems/objectives-manager.js:742-744`).
- Aim `morning` "Morning": `see_queue` "Someone waits their turn for coffee"; `hear_queue_chat` "Two in the coffee line pass the time"; `see_coffee_off` "Switch the coffee off and watch them turn back"; `hear_cooler_exchange` "Overhear the conversation at the cooler".
- Aim `midday` "Midday": `use_open_screen` "Use a screen its owner left open"; `see_caught` "Get caught at someone's desk"; `see_cake_eaten` "Put the cake out and watch it go".
- Aim `evening` "Evening": `see_who_stays` "See who stays late".

`hear_queue_chat` carries `"condition": "data.overheard === true"`. Out of earshot a queue chat still runs, as a picture with no line, and still emits `npc_chatted:<objectId>` with `overheard: false` (`systems/npc-needs.js:4495-4527`); the condition stops the task ticking on chat the viewer did not hear. Earshot is the object's `overhearRadius` (200 px on `office_coffee`, `_chatRadius`, `:3006-3011`). Queue chat pairs the user with the front queuer, compatible pairs only, so it is always Chidi and Jun (`:5029-5058`).

## 6. Host and staff ink, and keeping the tour open

`ama_owusu.ink`, the reopen pattern from `scenarios/test_needs_sims/ink/neil.ink` (`start` diverts to `hub.choices`; `hub` has a reopen line; `reopenRefreshesHub: true`). VARs mirrored from globals: `act_midday`, `act_evening`, `kitchen_seen`, `heard_exchange_cooler_chat`.
- `start`: A1, A2, then the hub choices.
- `hub`: reopen line A0, then choices (seven at most, under dialoguelint's hub limit of 10):
  - "What am I looking at?" (once): A3, A4.
  - "What should I try next?": by act. Morning (`not act_midday`) A5 to A8; midday (`act_midday and not act_evening`) A9 to A11; evening A12, A15. No progress globals.
  - "What was that at the cooler?" (only when `heard_exchange_cooler_chat`): A13, A14.
  - "Let's do lunch." (`not act_midday`): if `not kitchen_seen`, A26 and back to the hub; else A16, `#set_global:act_midday:true`, exit.
  - "Call it a day." (`act_midday and not act_evening`): A17, A18, `#set_global:act_evening:true`, exit.
  - "Give me the short version." (`act_evening`): A19 to A25, A28, back to the hub.
  - "I'll have a look round.": A27, exit.
- Each staff NPC: a minimal three-line chat in its own ink file (start line, one player choice answered in two lines, then a plain exit choice with no reply). Graham's file also holds `exchange_cooler_chat` (Graham and Agnieszka, five lines). The exchange is declared on Graham: `"exchanges": [{ "with": "agnieszka_duda", "knot": "exchange_cooler_chat" }]`, and `heard_exchange_cooler_chat: false` is declared in `globalVariables`.
- `kitchen_seen`: a plain mapping on Ama, `{ "eventPattern": "room_entered:kitchen", "cooldown": 0, "setGlobal": { "kitchen_seen": true } }`, no condition and no onceOnly (setting true again is harmless). The event carries `{ roomId, previousRoom, firstVisit }` (`core/rooms.js:3231-3240`) and fires wherever Ama is, since she is always loaded; `setGlobal` is applied by `systems/npc-manager.js:1500-1506`. Sims uses the same shape for `staff_room_seen` (`scenarios/test_needs_sims/scenario.json.erb:633`).

Keeping the tour open. A mission concludes in only two ways: the server sets `mission_concluded_at` when an aim with `missionConclusion` completes (`app/models/break_escape/game.rb:6792-6809`; it returns at once for any other aim), or a scenario `music` event that carries `credits` posts the conclusion and opens the credits (`music/scenario-music-events.js:300-378`; the 'victory' playlist that auto-opens the visualiser is only reached through scenario music). Ink tags cannot conclude: `#ending_check` and `#ending_confirmed` only ask or record (`minigames/helpers/chat-helpers.js:475-497`). So the scenario:
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
| A1 | start | Hello. Today you watch an office instead of breaking into one. | 62 | 11 |
| A2 | start | Everyone here runs on needs. Start by watching the coffee machine. | 66 | 11 |
| A3 | What am I looking at? | Each person has needs: coffee, water, food, company, work. They run down over time. | 83 | 14 |
| A4 | What am I looking at? | When one runs low, they go to whatever fills it. That's an affordance. | 70 | 13 |
| A5 | try next, morning | Watch the coffee machine. One person at a time; the rest queue. | 63 | 12 |
| A6 | try next, morning | They come back every few minutes. Switch it off at the wall socket while they're queued. | 88 | 16 |
| A7 | try next, morning | Then open the kitchen door and hang about by the water cooler. | 62 | 12 |
| A8 | try next, morning | And keep an eye on those mugs by the desks. Someone can't stand them. | 69 | 14 |
| A9 | try next, midday | Lunch takes people away from their desks. Some lock their screens; some don't. | 78 | 13 |
| A10 | try next, midday | Use an open one, then close it and wait by the desk for its owner. | 66 | 15 |
| A11 | try next, midday | When they're all back and sitting, drop the cake from your inventory here in the office. | 88 | 16 |
| A12 | try next, evening | Everyone's gone home but one. See where she goes. | 49 | 9 |
| A13 | What was that at the cooler? | That's an exchange. Two people at the same machine can have one written conversation. | 85 | 14 |
| A14 | What was that at the cooler? | They have it once, and only if you're close enough to hear. | 59 | 12 |
| A15 | try next, evening | Then walk into the kitchen. The lights there are on a motion sensor now. | 72 | 14 |
| A16 | Let's do lunch. | Good idea. Watch who goes, and what they leave behind. | 54 | 10 |
| A17 | Call it a day. | Right. Home time for most of them. | 34 | 7 |
| A18 | Call it a day. | Have a wander once we're done here. | 35 | 7 |
| A19 | short version | Needs run down, and people go to whatever fills them. | 53 | 10 |
| A20 | short version | Machines take one at a time, so people queue and chat. | 54 | 11 |
| A21 | short version | Switch something off and they turn back. That's a lever. | 56 | 10 |
| A22 | short version | Two at the cooler might have a conversation, once. | 50 | 9 |
| A23 | short version | A screen left open is a chance. Owners come back and notice. | 60 | 12 |
| A24 | short version | Cake tempts anyone peckish, until it runs out. | 46 | 8 |
| A25 | short version | And the lights follow the time of day. | 38 | 8 |
| A26 | Let's do lunch, kitchen unseen | Have a look in the kitchen first. That's where lunch happens. | 61 | 11 |
| A27 | I'll have a look round. | Go on. I'll be here. | 20 | 5 |
| A28 | short version, close | That's the tour. Stay and look round as long as you like. | 57 | 12 |

Player choice text (not voiced): "What am I looking at?", "What should I try next?", "What was that at the cooler?", "Let's do lunch.", "Call it a day.", "Give me the short version.", "I'll have a look round."

### 7b. Staff ink (three lines each)

| Id | Speaker | Place | Text | Chars | Words |
|---|---|---|---|---|---|
| C1 | Chidi | start | Hiya. Can't stop long, I've a report due. | 41 | 8 |
| C2 | Chidi | "Do you always lock your screen?" | Every time I get up. Habit from my last job. | 44 | 10 |
| C3 | Chidi | same | Twenty seconds is long enough for someone to have a nose. | 57 | 11 |
| J1 | Jun | start | Oh, hi. Sorry, I'm a bit swamped. | 33 | 7 |
| J2 | Jun | "Do you lock your screen when you go?" | Lock it? I'm only ever gone a minute. | 37 | 8 |
| J3 | Jun | same | Nobody here would touch it anyway. | 34 | 6 |
| G1 | Graham | start | Now then. You'll be the visitor Ama mentioned. | 46 | 8 |
| G2 | Graham | "Do you get away from your desk much?" | Only for the cooler. It's where you hear things. | 48 | 9 |
| G3 | Graham | same | My screen locks itself, mind. IT set it to twenty seconds. | 58 | 11 |
| N1 | Agnieszka | start | Hi. Mind the mugs, they've been there since Monday. | 51 | 9 |
| N2 | Agnieszka | "Why do you clear the mugs?" | Because nobody else will. | 25 | 4 |
| N3 | Agnieszka | same | If I see dirty mugs, I can't leave them. It's a sickness. | 57 | 12 |
| Z1 | Zainab | start | Alright. I'm only in to service the kit. | 40 | 8 |
| Z2 | Zainab | "Why do you keep to yourself?" | I'm in a different office every day. | 36 | 7 |
| Z3 | Zainab | same | Easier to get the job done if I don't get chatting. | 51 | 11 |

Exit choice for each: "I'll let you get on." (no reply).

### 7c. Exchange `exchange_cooler_chat` (in graham.ink, heard once)

| Id | Speaker | Text | Chars |
|---|---|---|---|
| X1 | Graham | Not seen you at the cooler all week. | 36 |
| X2 | Agnieszka | I've been hiding at my desk, Graham. | 36 |
| X3 | Graham | Deadline? I'll not keep you long. | 33 |
| X4 | Agnieszka | You never do. Five minutes, tops. | 33 |
| X5 | Graham | Then back to it. Same time tomorrow? | 36 |

### 7d. Barks (NPC `eventMappings`, `bark` field)

| Id | Speaker | Trigger | Text | Chars | onceOnly |
|---|---|---|---|---|---|
| B1 | Ama | `room_entered:office` | Morning! Come and find me when you're ready. | 44 | yes (not office life) |
| B2 | Ama | `npc_queued:office_coffee` | That's a queue. One at a time at the coffee. | 44 | yes |
| B3 | Ama | `npc_turned_back:*`, `data.reason === 'off'` | Machine's off, so they turn back. That's a lever. | 49 | yes |
| B4 | Ama | `workstation_screen_changed:chidi_pc`, `data.how === 'leave' && data.locked === true && globalVars.act_midday === true` | Chidi's locked his screen before lunch. | 39 | yes |
| B5 | Ama | `npc_left_post:jun_watanabe`, `globalVars.act_midday === true` | Jun's left his screen open. Have a look. | 40 | yes |
| B6 | Ama | `npc_caught_at_post:jun_watanabe`, `delayMs 2500` | Caught! People notice who's at their desk. | 42 | yes |
| B7 | Ama | `magnet_finished:cake` | Two slices, first come, first served. | 37 | yes |
| B8 | Jun | `npc_caught_at_post:jun_watanabe`, cooldown 30000 | Er, that's my desk. Can I help you? (copied from sims Tom) | 35 | no |
| B9 | Ama | `npc_left_item_gone:jun_watanabe` | Jun's noticed his badge is missing. | 35 | yes |
| B10 | Zainab | `global_variable_changed:act_evening`, `value === true`, `delayMs 1500` | Quiet now. Just me and the coffee. | 34 | no (a global changes to true once) |
| B11 | Ama | `npc_picked_up:office_mugs` | There go the mugs. Agnieszka can't leave them. | 46 | yes |

B4 uses `workstation_screen_changed`, which is emitted on every screen change whether or not sound plays (`systems/workstation-state.js:204-205`); the chime event (`workstation_lock_heard`) needs the chime to be audible and so would miss a muted viewer. The midday condition keeps a long morning trip from spending it. B11 is the interest pickup's own event, `{ npcId, itemId, tag }` (`systems/npc-needs.js:3520`); with the viewer elsewhere it shows as a toast, so the mug run is named wherever the viewer is.

### 7e. Chatter pools

Scenario-level pools copied from sims `scenario.json.erb:14-23` (all 40 or fewer; copied, newly voiced):
- `coffee` (6): "Go on, after you.", "Is there any milk left?", "This machine takes forever.", "Strong one today?", "Who keeps taking the mugs?", "Busy morning?"
- `cooler` (8): "Did you see the car park email?", "Friday drinks again?", "How was the weekend?", "Is it raining again?", "Train was late again.", "Any plans for lunch?", "Not bad, you?", "That printer jammed again."
- `grumble_off` (3): "Who switched the coffee off?", "It's off. Typical.", "No coffee here, then."
- `grumble_gone` (1): "Missed it."
- `cake` (4) and `news_cake` (3): as `CAKE_ITEM.md`.

No `grumble` pool. It is spoken only on an avoidance turn-back, or an off or gone turn-back with no pool of its own (`systems/npc-needs.js:2283-2289`). Nobody here can turn back for avoidance: Zainab's `avoidRadius 0` returns from the recheck at once (`:2049`) and nobody declares her in `avoids`; `grumble_off` and `grumble_gone` have their own lines. V10 would flag the pool as never spoken.

Per-NPC pool extras (new):

| Id | Speaker | Pool | Text | Chars |
|---|---|---|---|---|
| P1 | Chidi | coffee | Report's due at four. Wish me luck. | 35 |
| P2 | Chidi | coffee | Milk's on the turn again. | 25 |
| P3 | Jun | coffee | Third one today. Don't judge. | 29 |
| P4 | Jun | coffee | Did you see the team email? | 27 |
| P5 | Graham | cooler | Now then, how's tricks? | 23 |
| P6 | Graham | cooler | Nobody tells me anything up here. | 33 |
| P7 | Agnieszka | cooler | Someone's left mugs everywhere again. | 37 |
| P8 | Agnieszka | cooler | Are you going to the quiz? | 26 |

Zainab has no pool lines: she chats with nobody.

Totals: Ama 29 ink lines and 9 barks; staff 15 ink lines, 5 exchange lines, 2 barks, 8 pool extras; 25 copied pool lines. V6 gives the clip count per voice before any voicing is asked for.

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
| `globalVariables` | `act_midday`, `act_evening`, `kitchen_seen`, `office_coffee_off` (booleans); `cake_servings` (0 to 2); the rows above | fixed set, declared up front |
| `npcVisibility` | `chidi_okeke`, `jun_watanabe`, `graham_whitfield`, `agnieszka_duda`, each `false` after the evening turn (`systems/npc-manager.js:2207-2226`, sent at `state-sync.js:549-550`) | 4 entries, one boolean each, written once |
| `triggeredEvents` | fired onceOnly mappings: B1 to B7, B9, B11 | 9 entries |
| `npcInkVariables` | Ama's four mirrored VARs; staff inks declare none | 4 |

Nothing grows `player_state`; every key is a boolean or a small bounded integer, written when it changes.

## 9. Ending and reload behaviour

- No conclusion, no credits, no ending warning (section 6). The objectives panel shows all three aims complete; the viewer can keep walking round, talking to Ama and replaying the recap.
- Reload keeps act globals, NPC visibility, lighting variants and fired onceOnly mappings; needs reset to each NPC's `initial` (accepted for a tour: Ama's hints still hold, and the coffee run restarts from spawn timing).

## 10. Risks and points to measure

| # | Risk or point | How it is settled |
|---|---|---|
| R1 | Ama's spot (4.75, 3.25) blocks a lane on the live walk | S1 render and first coffee walk; move her if so |
| R2 | Parked needs wake when the kitchen loads (sims behaviour suggests yes) | S2: hold the kitchen shut past 2:40, then open it; Graham and Agnieszka must go |
| R3 | Coffee timings (first queue near 0:50, second run near 3:35) are computed, not measured | S2 logs both runs' times; adjust Chidi's `initial` or decay if they drift by more than 20 s |
| R4 | Zainab queuing with `avoids ["*"]` and `avoidRadius 0` | S2: she reaches queue cell two and does not turn back |
| R5 | Hiding an NPC mid-use of a machine at the evening turn: a hidden NPC's job is aborted and a sitter unseated (`systems/npc-needs.js:1416-1424`, `systems/npc-behavior.js:427-435`) | S4: turn the evening during a cake or coffee use; no stuck image or held capacity |
| R6 | Reload resets needs to `initial`: midday hunger levels are lost | Accepted; S4 reload test records it |
| R7 | Whether a dropped cake's position survives a reload | S3 reload with the cake down |
| R8 | Desk claiming depends on declaring the four desk machines in sims' order | S1: each NPC sits at its own desk |
| R9 | Agnieszka's mug pickup comes from her interest on a trip; its timing is not controlled | Accepted; A8 primes it and B11 names it wherever the viewer is; S2 records when it happens |
| R10 | The evening's `setGlobal office_coffee_off false` must leave the socket's confirm offering "switch off" again | S4: open the socket after the turn |
| R11 | B1 on `room_entered:office` at spawn, and not again after a reload | S1: spawn, kitchen and back, reload; one B1 |

## 11. Build slices

Each slice ends with a commit on the branch and a live proof on a keyless server from the worktree on a free port (not 3000, 3001, 3002, 3085 or 3086), a fresh game per edit from `tools/playtest/new-game.rb office_life_showcase`, headless with `game.loop.setFPS(20)` and fixed steps on, driven through `window.__test`. Stop the server by PID only.

- S1, skeleton. `mission.json` (display name "Office Life Tour", no `scoring`), `scenario.json.erb` (rooms, objects, cast with needs, globals, objectives with no `missionConclusion`, no `music` block, Ama's art and voice fields), Ama's ink with start, hub and exit only, three-line staff inks, base lighting. Proof: validator clean; render both rooms; each staff NPC reports `atPost` at its own desk; watch the first coffee walk past Ama's spot (R1, R8, R11).
- S2, morning. Pools, per-NPC extras, coffee queue and both coffee couplings, socket lever, cooler coupling and exchange, mugs, B1 to B3, B11, `kitchen_seen`, Ama's hub hints. Proof: a timed run ticks all four morning tasks with no `__test.needs.set`; log the first and second queue times, the exchange time and the mug pickup; a second run holds the kitchen shut until 3:30 (R2 to R4, R9).
- S3, midday and cake. Midday mappings, B4 to B9, Jun's work coupling, cake item and pools. Proof: take lunch, see B4 with sound off, use Jun's PC, close it, wait by the desk, get caught, wait for all four, drop the cake; three midday tasks tick; reload with the cake down (R7).
- S4, evening and lighting. Hide mappings, the coffee switch-on, lighting variants, B10, Zainab's delayed caffeine. Proof: screenshots of both rooms before and after the turn; no hidden NPC leaves a drawn image; Zainab goes to the office coffee and the task ticks; kitchen dark, then lit on entry, then dark 12 s after leaving; turn the evening with the coffee switched off and during a use (R5, R10); reload after the turn keeps staff hidden and evening light (R6).
- S5, checks and full run. Validator with V6, V8 and V10; a script that checks every line in section 7 against the scenario data and inks word for word, with the character and word caps; `dialoguelint.mjs`; then a full run from spawn to recap following Ama's hints, timed (target 5 to 10 minutes), with `tools/playtest/verify-run.rb` showing all eight tasks; `tools/playtest/train-check.sh` green on the hash.

## 12. Tests

| # | Test | Live proof |
|---|---|---|
| T1 | Scenario validates; V8 counts within caps and match section 8 | validator output saved in the S5 commit message |
| T2 | Each staff NPC starts at its own post; Ama does not block a lane | S1: `__test.needs.state(id).atPost` for five NPCs; screenshot of the first coffee walk |
| T3 | Intro bark plays once, not on re-entry or reload | S1: enter, leave to the kitchen, return, reload; one B1 |
| T4 | First coffee queue forms near 0:50 with Jun second and Zainab third | S2: `needs.log()` timestamps; `see_queue` ticks |
| T5 | Queue chat plays from the coffee pools, never from Zainab; the task ticks only with the viewer in earshot | S2: one run with the viewer in the kitchen during the first queue (no tick), then near the queue (tick) |
| T6 | Second run near 3:35 brings Jun and Zainab again | S2: `needs.log()`; two `npc_queued:office_coffee` on the second run |
| T7 | Switching the socket off turns walkers and queuers back with `grumble_off`, and they go to the kitchen coffee | S2: `see_coffee_off` ticks; their next target is `kitchen_coffee` |
| T8 | Cooler pair meets and the exchange plays once | S2: `hear_cooler_exchange` ticks; a later cooler visit plays pool lines only |
| T9 | Kitchen opened late: the cooler pair goes once it loads | S2 second run, kitchen held shut to 3:30 |
| T10 | Agnieszka carries the mugs to the tray; B11 shows | S2: mugs object gone from the office, tray holds them, B11 in the bark log |
| T11 | "Let's do lunch." refuses before the kitchen is seen and works after | S2/S3: choose it at spawn (A26, no global change), then after entering the kitchen |
| T12 | Chidi locks on his lunch trip, Jun leaves his PC open | S3, sound off: `workstation_screen_changed:chidi_pc` with `locked: true`; `jun_pc` unlocked; B4 and B5 seen |
| T13 | Using Jun's PC ticks the task and brings him back; he catches the viewer waiting by the desk | S3: `use_open_screen` and `see_caught` tick; B8 then B6 as he walks up; a second run staying in the PC shows both after closing it |
| T14 | Badge bonus: taking Jun's badge draws B9 on his return | S3: forced by retrying until the 70% leave occurs |
| T15 | Cake: two servings taken, the cake finishes, anyone still walking turns back | S3: two `magnet_serving:cake`; zero to two `npc_turned_back` with reason `gone`; `see_cake_eaten` ticks; B7 |
| T16 | Cake position after reload | S3 reload with the cake down |
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

Decided without asking: staff get the three-line chats; the coffee lever relies on the repeating coffee run rather than a new "send someone for coffee" choice; "Let's do lunch." waits for the kitchen to be seen (one boolean); Graham's avoidance of Zainab is dropped because the two never share a machine in this tour, so it would never show; the mug run is named by Ama's hint and a bark (B11), not a task, because its timing is not controlled; the evening switches the office coffee back on, so the kitchen's motion lights answer only to the viewer.

## Handover

Plan text is complete. Not settled from code, and left to the build: the west door's exact cells on `room_office` (so Ama's lane check stays an S1 render, R1); whether the socket confirm follows `office_coffee_off` when a mapping sets it (R10); the coffee timings (R3). demo_access_tour should take the two drift notes at the end of `CAKE_ITEM.md`'s minimal variant.
