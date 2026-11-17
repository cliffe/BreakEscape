# office_life_showcase: plan (DRAFT, partial; see Handover at the end)

Status: the design decisions below are settled by the planner; several required sections are still to write (listed in the Handover). The cake spec is complete in `CAKE_ITEM.md`.

## 1. Goals and audience

- A guided 5 to 10 minute tour of office life for colleagues who know Break Escape. Ama Owusu hosts; she may use engine terms (needs, affordance, capacity, exchange, lever, security window).
- Collection `test_scenarios`. Display name "Office Life: A Guided Day". `estimated_duration_minutes` 8. No firm is named in any spoken line.
- test_needs_sims stays unchanged as the regression fixture. Only existing engine features.
- Overlay off (`needsDebugOverlay` left out). `showPressingNeeds: true`, `npcThoughts` default (on), `officePresets: true`, `roomTone: true`, `lighting` on, scenario-level `disableAttacks: true` (so no KO cases).

## 2. Rooms and map reuse

Two rooms, both maps from test_needs_sims. No third room (the Keith/Jodie pair stays in the fixture).

- `office` (`room_office`), start room, `startPosition` (5, 6) = px (160, 192). Connection `west: kitchen` only.
- `kitchen` (`room_break`), connection `east: office`.

Objects kept, positions copied from sims (tiles; px = tiles x 32):
- Office: four desk machines declared in the same order and types as sims so the same Tiled desks are claimed: `chidi_pc` (pc, was amara_pc), `jun_pc` (pc, was tom_pc), `graham_pc` (pc, was sanjay_pc, `autoLockSeconds 20`), `agnieszka_laptop` (laptop, `affordance: false`, was grace_laptop). `zainab_tool_roll` (m10_tool_roll1) at (2.0, 5.4) = (64, 173), `useFrom (0,1)`. `jun_badge` (id_badge) at (1.75, 5.25) = (56, 168), `leftBehindChance 0.7`, `revealOnGlobal jun_badge_left`. `office_coffee` (coffee_station1) at (8, 8) = (256, 256), own `useFrom (-1,0)`, queue cells (-1,0),(-2,0), chatter `coffee`, `offWhen office_coffee_off`. `office_coffee_socket` (power_socket2) at (8.65625, 7.0625) = (277, 226), confirm both ways setting `office_coffee_off`. `office_mugs` (dirty_mugs1, "Abandoned Mugs", needsTag `dirty_mugs`) at (4, 7) = (128, 224). `tour_notice` (notice_board1, wallMounted, readable "Things to try") at (8.1875, 0.6875) = (262, 22), where sims has the deadline memo.
- Kitchen: `fridge` (qdc_fridge1) (1, 2) = (32, 64) with `restores 40`; `microwave` (microwave1) (5, 3) = (160, 96) with `restores 40`; `kitchen_coffee` (coffee_station1) (3, 8) = (96, 256), useFrom (0,-1), queue (1,-1),(2,-1); `water_cooler` (water_cooler1) (1, 7) = (32, 224), `affordance.overhearRadius 360` (whole room, so the viewer need not stand anywhere special); `washing_up_tray` (mugs_tray1) (3, 3) = (96, 96), accepts `dirty_mugs`.
- Dropped from sims: copiers and outputs, print queue, deadline memo, coffee notice, activity board, desk phones, kitchen rota, kitchen copier socket, parcel, player mugs.
- Host spot: Ama Owusu at (8.5, 4.5) = (272, 144), a guess clear of the desk-to-coffee lanes; Slice 1 renders the room and moves her if she blocks a lane.
- Lighting: office `on`; evening variant `{ "condition": "globalVars.act_evening === true", "ambient": "#8f96b0", "lights": [warm lamp over Zainab's desk] }`. Kitchen `on`; evening variant `{ "condition": "globalVars.act_evening === true", "mode": "motion", "offAfter": 10 }` so the kitchen goes dark when the viewer leaves and lights when they walk in (motion sensor shown with no third room).

## 3. Cast

All from the awareness course, full atlases with `sit_` frames, talk, visemes and headshot. None is in demo_access_tour's cast (ama_owusu, delphine_arvanitis, thandiwe_moyo, yasmin_chaudhry, julian_sallow, lorna_easton, nilesh_solanki), apart from the host Ama, who is meant to recur. Voices and accents from VOICE_CAST.md.

| Key | Who (VOICE_CAST) | Sims role copied | Needs (decayPerMin/urgentAt/initial) | Features carried |
|---|---|---|---|---|
| `ama_owusu` | Ama Owusu, 40s, Black British (Ghanaian heritage), London; voice Autonoe with the same style string as ca18 | none (host) | none | ink hub, act turns by `#set_global`, labelling barks, `facePlayer` |
| `chidi_okeke` | Chidi Okeke, 40s, Nigerian-British, West Yorkshire | Amara | caffeine 20/40/47 (urgent about 0:21), work 10/50/72, hunger 5/40/90 | coffee queue (first at the machine), `habits.screen.lockIfAwayOverSeconds 20` (locks with a chime at lunch), lunch on cue |
| `jun_watanabe` | Jun Watanabe, early 20s, Japanese-British, southern English | Tom | caffeine 20/40/49 (urgent about 0:27), work 8/50/80, hunger 5/40/90 | first in the queue (pair chat with Chidi), `habits.screen.lockChance 0` (leaves his PC open), left-behind badge, `npc_caught_at_post` bark, lunch on cue |
| `graham_whitfield` | Graham Whitfield, early 60s, white British, Halifax | Sanjay | work 15/50/65, social 12/40/72 (urgent about 2:40), hunger 4/40/90, caffeine 1/30/95 | never locks but `autoLockSeconds 20` on his PC locks it; `needsCompany.avoids ["zainab_hussain"]`; cooler pair and the once-only exchange |
| `agnieszka_duda` | Agnieszka Duda, 30s, Polish, lightly accented | Grace | thirst 15/40/80 (urgent about 2:40), hunger 4/40/90 | `interests` dirty_mugs (carries the Abandoned Mugs to the washing-up tray), cooler pair partner |
| `zainab_hussain` | Zainab Hussain, 30s, British Bangladeshi, northern English; field service engineer (tool roll fits) | Marek | caffeine 1/30/95, thirst 2/30/95 | `needsCompany.avoids ["*"]`, `avoidRadius 0` (queues, chats with nobody); caffeine set to 10 when Jun queues (sims pattern); stays late in the evening |

Ages run early 20s to early 60s; three women, three men including the host.

## 4. Tour outline (decided; detailed table still to write)

Act 1, Morning (0:00 to about 3:00)
- Intro bark from Ama on `room_entered:office` (onceOnly). Viewer talks to her (hub).
- 0:21 to 0:30: Chidi at the office coffee, Jun queues (task `see_queue`), Zainab queues behind (caffeine set 10 on `npc_queued:office_coffee` with `data.npcId === 'jun_watanabe'`). Chidi and Jun chat from the `coffee` pool (task `hear_queue_chat`, on `npc_chatted:office_coffee`).
- Lever: the coffee socket. Switched off, walkers turn back with `grumble_off` (task `see_coffee_off`, on `npc_turned_back:*` with `data.reason === 'off'`).
- Viewer opens the kitchen (west door). Kitchen objects become targets. About 2:40 Graham (social) and Agnieszka (thirst) meet at the cooler; one-way coupling: `npc_use_started:water_cooler` with `data.npcId === 'agnieszka_duda'` sets Graham's social to 10 (cooldown 30000). The exchange `exchange_cooler_chat` (in graham.ink) plays once (task `hear_cooler_exchange`, on `npc_exchange_heard:exchange_cooler_chat`). Agnieszka also carries the Abandoned Mugs to the tray (no task; Ama labels it).

Act 2, Midday (host choice sets `act_midday`)
- Mappings on `global_variable_changed:act_midday`: Chidi hunger 20, Jun hunger 20 (both go to lunch: fridge and microwave, restores 40, so both end at 60, inside the cake's tempt band); Graham hunger 62, Agnieszka hunger 62 (in band, not urgent).
- Chidi locks with a chime (`workstation_lock_heard:chidi_pc`, `how === 'leave'`); Jun leaves his PC open (white breathing dot). Viewer uses it (task `use_open_screen`, on `workstation_accessed:jun_pc`). That mapping also sets Jun's work to 5 (cooldown 60000) so he heads straight back after eating; he catches the viewer (task `see_caught`, on `npc_caught_at_post:jun_watanabe`, Jun's bark).
- Cake: Ama asks the viewer to put it down in the office. Four tempted (Chidi, Jun, Graham, Agnieszka), two servings: two eat, two say "Missed it." (task `see_cake_eaten`, on `magnet_finished:cake`). Word of mouth plays only if dropped in the kitchen with someone there; not a task.

Act 3, Evening (host choice sets `act_evening` during the conversation, so the change happens behind the dialogue)
- `setVisible: false` on `global_variable_changed:act_evening` (condition `value === true`) for Chidi, Jun, Graham and Agnieszka (plain mappings, saved visibility restores on reload).
- Office lights dim, Zainab's desk lamp, kitchen on motion sensor.
- Zainab: `delayMs 1500` bark on the turn; `delayMs 8000` sets her caffeine to 10. Task `see_who_stays` on `npc_left_post:zainab_hussain` with `globalVars.act_evening === true` (ticks whether she goes to the office coffee or, if it is still off, the kitchen).
- Ama's recap choice after the turn.

## 5. Objectives (decided)

All three aims visible from the start (no `unlockAim`, so an early event never completes a task in a locked aim). No task mapping uses `onceOnly`.
- Aim `morning` "Morning": `see_queue` "Someone waits their turn for coffee"; `hear_queue_chat` "Two in the coffee line pass the time"; `see_coffee_off` "Switch the coffee off and watch them turn back"; `hear_cooler_exchange` "Overhear the conversation at the cooler".
- Aim `midday` "Midday": `use_open_screen` "Use a screen its owner left open"; `see_caught` "Get caught at someone's desk"; `see_cake_eaten` "Put the cake out and watch it go".
- Aim `evening` "Evening": `see_who_stays` "See who stays late".

## 6. Host ink (decided shape)

`ama_owusu.ink`, Neil's reopen pattern (`start` diverts to `hub.choices`; `hub` has a reopen line; `reopenRefreshesHub: true`). VARs mirrored from globals: `act_midday`, `act_evening`, `heard_exchange_cooler_chat`.
- `start`: greeting, two lines.
- `hub` choices: "What am I looking at?" (once: needs and affordances in two lines); "What should I try next?" (text per act, lists that act's beats; no progress globals); "What was that at the cooler?" (only when `heard_exchange_cooler_chat`); "Let's do lunch." (`not act_midday`: `#set_global:act_midday:true`, exit); "Call it a day." (`act_midday and not act_evening`: `#set_global:act_evening:true`, two lines, exit); "Give me the short version." (`act_evening`: recap naming each feature in the order seen); "I'll have a look round." (exit).
- Each staff NPC gets a small ink: start line, one choice where they explain their habit in character, exit. Graham's also holds `exchange_cooler_chat`.

## 7. Sync budget (planned counts; validator not yet run)

Caps from `scripts/validate_office_life.rb:766-770`.

| Row | Count | Cap |
|---|---|---|
| workstation globals (3 per owned workstation: chidi_pc, jun_pc, graham_pc) | 9 | 24 |
| heard_ globals (one exchange) | 1 | 8 |
| magnet servings | 1 | 2 |
| reveal and left-behind globals (jun_badge) | 1 | 6 |
| dropped magnet items (cake) | 1 | 2 |
| office-life onceOnly mappings (Ama's label barks: queue, coffee off, open screen left, lock chime, caught, cake gone; Jun's badge-gone bark) | 7 | 10 |
| office-life items (badge, cake) | 2 | 4 |
| small keys (rows excluding items) | about 19 | 64 |

Other bounded keys: `act_midday`, `act_evening`, `office_coffee_off` (booleans), `cake_servings` (0 to 2), `jun_badge_left` (counted above), one non-office onceOnly (Ama's intro bark). Nothing grows player_state.

## 8. Still to write

Full act-by-act table with timings and the label line per beat; full spoken-line table with character counts; risks and unchecked list; build slices with live proofs; numbered test list; user questions. See Handover.

## Handover (planner, 2026-11-17)

Stopped at the context guard. Done: reading (DIGEST, DEMO_AUDIT section 5 and addendum, AGENTS.md test/demo and spoken-line rules, the access tour's plan v0 on `plan/demo-access-tour`), the decisions above, `CAKE_ITEM.md` (complete).

Facts checked this session that the next planner should rely on:
- `completeTask` returns early on a completed task (`public/break_escape/js/systems/objectives-manager.js:742-744`), so task mappings need no `onceOnly`.
- V8 counts as office-life onceOnly any `onceOnly: true` mapping whose eventPattern starts with an office-life prefix (`npc_used`, `npc_queued`, `npc_turned_back`, `workstation_`, `magnet_`, `item_dropped`, `npc_caught_at_post`, `npc_left_item_gone` and others, `validate_office_life.rb:50-58`) or that carries a `needs` command. `room_entered`, `global_variable_changed` and `setVisible` do not count.
- Mapping `skipIfGlobal` is video-call only (`scripts/scenario-schema.json`, eventMapping `skipIfGlobal`); use `condition` for barks.
- Mapping `delayMs` waits for an open conversation to close; `barkDelay` is dropped if the NPC is hidden first.
- Lighting room `variants` support `mode` (`on`, `motion`, `dark`), `ambient`, `lights`, `offAfter` (`lighting.js:12-46`).
- Ink pattern: `#set_global:name:true`, `#exit_conversation`, `# speaker:npc` or `Name: line`; VARs sync from scenario globals on load (`scenarios/test_needs_sims/ink/neil.ink:1-60`). Ama's existing manner: short, plain, warm sentences (`scenarios/ca18_credential_attacks_at_scale/ink/ama_owusu.ink:29-47`).
- Ama's NPC art fields: `spriteSheet ama_owusu`, `spriteTalk assets/characters/ama_owusu_talk.png`, `spriteVisemes assets/characters/ama_owusu_visemes.png` (ca18 :808-810). Voice Autonoe, style string at ca18 :799.
- All five staff keys have atlas, talk, talk_init, visemes and headshot files in `public/break_escape/assets/characters/`.

Open, for the next planner:
1. Write section 4 as the full table (time, viewer action, what they see, label line, task, event) and the spoken-line table: every Ama line, each staff ink line, the exchange (5 lines), barks (Ama's 7 labels, Jun's caught bark and badge bark, Zainab's evening bark), per-NPC pool extras, plus the copied sims pools (`coffee`, `cooler`, `grumble`, `grumble_off`, `grumble_gone`, `cake`, `news_cake`), marked copied but newly voiced. Pool lines 40 characters or fewer, no variables.
2. Risks and unchecked: Ama's spot vs lanes; whether parked needs wake when the kitchen loads (sims rows 3 and 9 suggest yes); whether the needs clock runs during a conversation; Zainab queueing with `avoids ["*"]`; hiding an NPC mid-use of a machine; reload resets needs to `initial` (midday levels lost, act globals and visibility kept); whether a dropped cake's position survives a reload; desk claiming depends on declaring the four desk machines in sims' order.
3. Build slices with live proof each (suggested: S1 rooms, cast, host ink skeleton, render; S2 morning beats; S3 midday and cake; S4 evening turn and lighting, render both; S5 validator V8 run, spoken-line table check, full timed run). Test list numbered, each with its live proof (keyless server on a free port, `new-game.rb`, `__test` bridge, `verify-run.rb`).
4. User questions, short. Candidates: (a) display name "Office Life: A Guided Day" or another; (b) keep Jun's left-behind badge as an untasked bonus (recommended) or cut it; (c) staff ink: minimal three-line chats (recommended) or no conversations for staff.
5. Optional extras (engine changes, not in the plan): a scenario global that drives the needs overlay; a day-clock HUD; a tour reset.
6. Then commit and run the 5 review rounds.
