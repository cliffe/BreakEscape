# m01 First Contact: office-life analysis (Stage 1)

Base: `9baab9c32` on branch `plan/ol-m01` (Stage 0 commit `52e030e05`). Inputs: BASELINE.md, scenario.json.erb and the ink. Line numbers are `scenarios/m01_first_contact/scenario.json.erb` unless a file is named.

m01 is the production deploy-gate mission. Everything below is chosen to keep the critical path untouched, and the m01, sis01 and sis02 gate playtests run again before any release carries it.

## Setting and acts

A weekday at Viral Dynamics, city centre, "eight floors of glass" (ink/m01_opening_briefing.ink:233-234). The player arrives in the morning as the security-audit contractor. No clock time is ever stated.

There is no timetable field, so the acts are the globals that turn them:

| Act | Starts with | Notes |
|---|---|---|
| Morning arrival | game start; check-in with Sarah (`check_in_reception`, :161-167) | the main office is key-locked until Sarah hands over the key (:1239-1242) |
| Working day | first entry to `main_office_area` | HaX's first call rings 6 s after that entry (:763-769) |
| Evening | `entropy_reveal_read` turns true (`onPickup` at :2205, inside the server room archive safe) | Derek's confrontation opens only now (ink/m01_derek_confrontation.ink:33); his greeting is "Working late on the security audit?" (:39 of that file), so the climax is after hours |

When `entropy_reveal_read` turns, the player is in the server room, two rooms from the main office (server room, IT room, main office). The way back to Derek in the break room runs through the main office.

## Layout

Reception connects north to the main office, which is the hub: west to the break room, east to the IT room, north to both hallways (:1243-1248). The break room leads south to the conference room; the IT room leads south to the server room. The west hallway serves the manager's office and Kevin's office; the east hallway serves Maya's office, Derek's office and the storage closet.

## Cast audit

Classes are the skill's D78 classes (plan/ol-skill-movement SKILL.md:56-80). D84 option b is settled (that SKILL.md:75-80 and :286): an NPC whose conversation is always open may still be free and may take a short routine, at most two or three moved NPCs per mission, each found at post first, with scripted runs waiting until a moved NPC is back at post.

| NPC | Line | Room | Class | Deciding evidence |
|---|---|---|---|---|
| briefing_cutscene | 556 | reception (off-map) | cutscene | timedConversation on game_loaded (:571-578) |
| agent_0x99 | 631 | none (phone) | phone | itemsHeld :642; phone and text mappings :684-1144 |
| closing_debrief_person | 1147 | reception (hidden) | cutscene | `initiallyHidden` (:1183-1185) |
| sarah_martinez | 584 | reception | story-critical; holding, pinned | itemsHeld :609 (badge and main office key); she is the check-in |
| derek_lawson | 1406 | break room | story-critical; holding, plot-located | itemsHeld :1450 (the launch device, :1450-1472); the confrontation and fight happen where he stands (KO mapping :1425-1439) |
| kevin_park | 1602 | IT room | story-critical; holding, pinned by text | itemsHeld :1628 (lockpick kit, server keycard, notes); "He's been in the IT room all day." (:1836); Sarah: "usually in the IT room" (ink/m01_npc_sarah.ink:115) |
| maya_chen | 1893 | Maya's office | optional flavour; free under D84 b | see below |

Only Maya gains needs among existing NPCs: one short trip after her first talk (PLAN.md 4.9).

### Maya

Maya holds nothing (no `itemsHeld` in :1893-1919), has no line of sight (`challengeOnSight` appears nowhere in the scenario), and no ink line places her (only a comment at ink/m01_npc_maya.ink:3). Her task `talk_to_maya` is optional (:228-233). Her HaX texts are on attack and KO (:702-715). Her NPC record has no `chatBackground`. On the mechanical tests she is free.

Her conversation is the problem. She is the informant: "Are you really here for a security audit? Or are you here because of my message?" (ink/m01_npc_maya.ink:40), with ENTROPY details at :99-103. Her own office has no machine, so a routine takes her to the main office cooler, and a player who talked to her there would have that whispered exchange in the open-plan office beside two colleagues. D84's tests do not catch this, because nothing places her; it is a reading of the scene.

The settled answer (D88 c) is that she leaves her post only after the tip-off. The informant reveal ("I'm the one who contacted you") is reachable only in the first conversation, which always happens at her post. The marker is the global `discussed_operation`, set in her ink knot `operation_details` and on the "Tell me everything" choice; ink global writes sync before `conversation_closed:maya_chen` is emitted. Nothing else places her: Sarah's and HaX's lines, the briefing and the debrief name her office, her notes and voicemail do not need her there, and no cutscene moves or hides her. The residual is that her later hub topics (`derek_intel`, `patricia_story`, `tactical_advice`) can play away from post; her re-talk opener "Is it safe to talk?" is low and wary, which fits.

### Beats keyed on presence

- `room_entered:main_office_area` (:763): HaX's first call, 6 s after the first entry, once.
- `global_variable_changed:entropy_reveal_read` (:952, :961): HaX texts sending the player to Derek.
- Derek: the confrontation in the break room and the fight there; derek_confronted on KO (:1423-1424). His conversation is open all game (the `insufficient_evidence` knot, ink/m01_derek_confrontation.ink:66-90).
- No `npc_arrived` mapping, no line-of-sight challenge, no mapping that counts who is in the main office.
- Music: `npc_hostile_state_changed` switches to the threat playlist (:89-95) and `all_hostiles_ko` back to noir (:96-101). Any NPC turning hostile, a new one included, triggers it.

## The main office is empty

The hub has four desks and six chairs (room_office.json `tables` and `items` layers: desks at (0.9, 6.4), (1.0, 4.9), (6.6, 4.9), (6.6, 6.4); chairs at (3.1, 7.1), (3.2, 3.6), (5.7, 2.9), (6.6, 7.0), (6.8, 5.4), (0.9, 5.4); all of these are Tiled bottom-left anchors, and the two seated chairs have centres at (7.31, 4.89) and (1.37, 4.91)) and a scenario `npcs` list that is empty (:1250). On a working morning that reads as a building with nobody in it. Every other room either has its story NPC or is a private office, a store, a corridor or a locked technical room.

The chairs are the `chair-white-*-rotate*` family, which seating.js treats as seats (seating.js:135-145).

## Rooms and machines

Room types are stock maps shared with other scenarios. room_office.json alone is the map for 85 scenarios, including the Hacktivity fixtures `test_objectives` and `test_simple_success`, so office life must not edit a shared Tiled map.

| Room | Type | Machines placed | Notes |
|---|---|---|---|
| reception_area | room_reception | none | reception_desk_phone is a scenario object (:1190-1208) without `deskPhone: true` |
| main_office_area | room_office | none | motion lighting (:1231-1238); chatBackground (:1230) |
| break_room | room_break | none | text mentions a coffee machine (:1487) and a "Sticky Note on Fridge" (:1518-1534, a bin item); neither appliance is placed |
| it_room | room_it | none | appliance images exist in the tileset only |
| server_room | room_servers | none | authored `ambientSound` (:2123-2124) |
| conference, hallways, small offices, storage | room_meeting, hall_1x2gu, small_* | none | |

No coffee machine, kettle, fridge, cooler, vending machine, copier or printer is placed anywhere in m01. In the main office, desk PCs are Tiled decor and none is declared; story PCs and desk phones are declared in other rooms (derek_computer, Kevin's Workstation, the IT Monitoring Station, patricia_desk_phone, reception_desk_phone).

A placed object does not need a map edit. A scenario object with its own `position` lands there whatever the map holds: the filing cabinet does it in this room (:1252-1262, position (5.49, 0.72)), and test_needs_leash declares a `water_cooler1` with a position and a hand-written affordance inside a room_office map (scenarios/test_needs_leash/scenario.json.erb:95-101). The art is `assets/objects/water_cooler1.png`.

### officePresets would spill

With `officePresets: true`, every declared object of a preset type gets an affordance (office-presets.js:48-60). The scenario declares story PCs across the building, so the plan leaves presets off and hand-writes each affordance. With presets off, an object's own affordance is used as written (office-presets.js:66-69).

## Secrets

Every PIN, password, key, card and flag in m01 stays where it is. The main office holds two of them: the filing cabinet's PIN lock (:1252-1262) and the recycling bin with the IT room checklist (:1312-1331). Office life adds no item, printout or readable text, so nothing new can carry a secret. The new objects (two desk PCs and a cooler) carry no text beyond a one-line observation.

## Sound today

Room tone is off. Turned on with stock types, reception gets the `reception` profile and the main office the `office` profile, and both include `distant_phone` spots (public/break_escape/js/data/room-tones.json). Distant rings are suppressed only by a declared object with `deskPhone: true` in the room (office-room-tone.js:107-113), and reception_desk_phone has none. m01 has two phone clues (the reception voicemail phone and Patricia's desk phone, :1786-1801), so a phone ringing in the distance would send players looking for a phone to answer.

Typing plays only for a needs NPC in the `using` phase of a `work` job (seating.js:1192-1196). Seated people with no `work` need are silent.

The break room's stock profile is `kitchen` (a fridge hum) in a room with no fridge.

## Barks today

No m01 NPC has a bark. Outside conversations and phone texts the building makes no human sound.

## npcThoughts

The key is absent at base and nothing on this base reads it. D77 gives m01 `"npcThoughts": false`; that key comes from the separate npcThoughts branch, not from this plan.

## Tier

Tier 2, settled (D88 a): tier 1 is the first build stage. The main office gets two awareness-cast extras at desks, which fixes the one room that looks wrong and touches no story NPC, lock or required step. At tier 1 they sit and type, with one once-only bark each. With a water cooler placed as a scenario object (tier 2) they also take short breaks in the main office, talk at the cooler and have two exchanges. Both tiers add room tone with no phone rings, and nobody in any other room.
