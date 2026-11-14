# Office life: the sims showcase day, audit and build plan

This plan grows `scenarios/test_needs_sims` (the neutral office-life showcase, no security narrative) into a believable small office day, and specifies the missing behaviours as small build slices. Its order follows the campaign: the showcase first proves what the m02 pilot needs, then what m06, m05 and m08 need, in the rollout order of the missions plan. Part 1 is the audit ("What exists"). Parts 2 to 8 are the plan.

Line numbers drift. Every engine reference gives the function name with the file:line where it starts on branch `build/ol-sims` at 69a77f696. Scenario references are to `scenarios/test_needs_sims/scenario.json.erb` (abbreviated `sims.erb`) at the same commit.

Related documents: `docs/achitechture/OFFICE_LIFE_PLAN.md` (the slices this builds on, abbreviated OLP), `docs/achitechture/NPC_NEEDS_SYSTEM.md` (the author contract), and the campaign plan `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` on branch `plan/office-life-missions` (abbreviated OLMP). OLMP's pilot is m02 ransomed_trust; its rollout is m02, m06, m05, m08, m01, m07, m04, m03, then m09 and m10 at Tier 0 (OLMP 6.11). Its engine gaps are E1 to E5 (OLMP 9): E1 is a live attack probe in its own `test_needs_attack` scenario, run before the pilot's design closes; E2 is a vending preset, landing straight after the pilot and before m06; E3 is a performance measurement above 6 needs NPCs; E4 is a design rule about room loading; E5 is a design rule (three protections) with a "summon to post" helper in the backlog only. Its sync table is OLMP section 7.

---

## 1. What exists

### 1.1 Behaviours

States: **shown** = built, shown in test_needs_sims; **not shown** = built, not shown in test_needs_sims; **unproved** = built, never proved live; **planned** = planned, not built; **not planned**.

| # | Behaviour | State | Engine evidence | Where it is shown |
|---|---|---|---|---|
| 1 | Needs decay, urgency, bounded selector, needs clock | shown | `NPCNeedsSystem.tick` npc-needs.js:1006, `update` 606, `_tickNpc` 1257, `_decay` 1383, `_select` 1490 | every NPC's `needs`; README "How to watch it" step 1 |
| 2 | Posts and home preference (`needsHome`, object or tile) | shown | `_resolveHome` npc-needs.js:3751, `_goHome` 3771, `_useCandidate` 1567 | every NPC; Marek has a tile home |
| 3 | Affordance presets by type or `officeType`; `affordance: false` opts out | shown (by type only) | `presetIdFor` office-presets.js:49 (opt-outs at 52, `officeType` at 53), `resolveAffordance` 66; table office-presets.json; validator `expand_presets` validate_npc_needs.rb:627 | `"officePresets": true` sims.erb:10; no object uses `officeType` or `affordance: false` |
| 4 | Room leash (`needsRooms` allow list, `needsAvoidRooms` deny list) | not shown | `_roomForbidden` npc-needs.js:1197, `_avoidRooms` 1209; skips reported as `skipped` on `npc_needs_leashed` (1597, 2886); validator `leash_rule` 1086, `leash_reach` 1116 | test_needs_leash (allow lists only; no scenario uses `needsAvoidRooms`) |
| 5 | Private rooms and objects (`needsPrivateTo`, `affordance.private`, `owners`) | shown | `_owners` npc-needs.js:1218, `_permitted` 1229, `_notePrivate` 1243; validator `check_private` 1048 | lounge `needsPrivateTo` (Rosa, Grace); owned PCs |
| 6 | Carry jobs for tagged items (`interests`, `needsTag`, `accepts`) | shown | `_carryCandidate` npc-needs.js:2799; world `pickUp`, `consumeHeld` | parcel and mugs; washing-up tray |
| 7 | Reveal slots: printouts placed and filed | shown | `_revealOutput` npc-needs.js:3512, `_reserve` 3612; validator `check_slots` 1381 | office and kitchen copier slots (`revealOnGlobal`) |
| 8 | Action icons over heads (16x16 `npc-*` set) | shown | `pickIconEntry` npc-action-icons.js:135, `update` 545 | all NPCs |
| 9 | Pressing-need thought bubbles, `noticed`, `blocked` | shown | `pressingBubble` npc-action-icons.js:202; `_pressing` npc-needs.js:4515, `_blockedNeed` 4528 | `"showPressingNeeds": true` |
| 10 | Item in hand | shown | `heldPlacement` npc-office-visuals.js:174, `followHeld` 277 | Grace with mugs, Amara with parcel and printouts |
| 11 | Seating: sit at desks, fetch and tuck in chairs | shown | `needsStop` seating.js:1738, `updateNeedsSeat` 1898, `tuckIn` 2006, `startFetch` 2018 | desk staff |
| 12 | Typing bob | shown | `typingBob` seating.js:1779, `isTyping` 1251 | seated `work` uses |
| 13 | Idle chair roll, rare swivel, look round at speech | shown | `fidgetOffset` seating.js:1169, `swivelFacing` 1268, `listenTarget` 1282; validator `check_swivel` 576 | task `see_look_round` |
| 14 | Own-desk use is not a leave; caught at the desk | shown | `_atOwnPost` npc-needs.js:2949, `_checkCaught` 3066, `_expectedAwayMs` 3026 | task `see_caught` |
| 15 | Workstation lock decisions (`workstation`, `lockChance`, `locksScreenOnLeave`) | shown | `decideLocked` workstation-state.js:147, `onLeft` 541, `onReturned` 573 | tom_pc `lockChance`; amara_pc, sanjay_pc `workstation` |
| 16 | Lock-screen habits, idle auto-lock, lock cues | shown | `habitOf` workstation-state.js:125, `_checkAutoLock` 466; `lockCuePlan` npc-office-visuals.js:101; validator `check_lock_habits` 520 | tasks `hear_screen_lock`, `see_auto_lock`, `use_open_screen` |
| 17 | Workstation indicators | shown | lighting.js header 40-45, `INDICATOR_LOCKED`/`INDICATOR_OPEN` 115-116 | task `spot_open_screen` |
| 18 | Left-behind items | shown | `_leaveItemsBehind` npc-needs.js:2983; validator `check_left_behind` 1429 | tom_badge; task `see_left_behind` |
| 19 | Social chat at capacity-2 objects with a `chatter` topic, with compatibility | shown | `_maybePair` npc-needs.js:3863 (both NPCs must be using the object at once), `_tickChats` 3887, `_compatible` 3844; validator `check_social` 895 | kitchen cooler; Marek avoided; tasks `see_chat`, `see_outcast` |
| 20 | Queues at shared machines, queue chatter | shown | `_queueCandidate` npc-needs.js:4387, `_advanceQueued` 4408, `_tickQueueChats` 4466 | office coffee; tasks `see_queue`, `see_queue_chat` |
| 21 | Avoidance at a distance, balking, parked needs | shown | `_avoidedAt` npc-needs.js:1764, `_balks` 1787, `_park` 1822, `_turnBack` 1897 | Sanjay and Marek; task `see_turned_back` |
| 22 | Chatter pools (scenario and NPC), `hush`, voiced through TTS | shown (no `hush` pool) | `chatterPool` npc-needs.js:242 (pool form with `hush` 227-232), `_pickBark` 2641; npc-needs-chatter.js `say` 237; validator `check_pool_lines` 676 | scenario `chatter`; NPC pools |
| 23 | Scripted exchanges in ink, heard once, optional `requireGlobal` | shown (no gated exchange) | `_findExchange` npc-needs.js:2685 (gate at 2693, played only on a chat pair), `_finishExchange` 2751 (emits `npc_exchange_heard:<knot>` 2765); validator `check_exchanges` 826 | tasks `hear_rota_exchange`, `hear_parcel_exchange` |
| 24 | Print and forget, the print-job lever | shown | `_tickPrints` npc-needs.js:3672 (`npc_print_uncollected:<owner>` with `ownerId`, 3689), `_dueErrand` 3644; validator `check_print_habits` 346 | Tom `printHabit`; tasks `see_uncollected`, `send_print_job` |
| 25 | Coffee off and printer power (`offWhen` switches) | shown | `_isOff` npc-needs.js:687, `_deadStation` 2125, `_printBlocked` 3566; validator `check_off_when` 440 | sockets; tasks `see_coffee_off`, `keep_tom_away`, `see_printer_grumble` |
| 26 | Magnets (the cake): sight, temptation, servings, "Missed it." | shown | `_noteMagnets` npc-needs.js:731, `_shownMagnets` 751, `_tempting` 802, `_sight` 813, `_takeServing` 898, `_tickMagnets` 915; validator `check_magnets` 260 | cake in the start inventory; tasks `see_cake_eaten`, `see_missed_it` |
| 27 | Word of mouth about a magnet (announce) | shown | `_tickNews` npc-needs.js:838, `_announce` 882; validator `check_magnet_news` | task `hear_cake_news` |
| 28 | A magnet without an announce (seen only) | not shown | same code with no `announce` | nowhere |
| 29 | Magnet lands on a table | shown | world `settleMagnet` npc-needs.js:5303; test/js/table-drop.test.mjs | kitchen tables |
| 30 | Desk-phone calls, colleague answers, rings out | shown | `onPhoneRing` npc-needs.js:4015, `_tickCalls` 4238; validator `check_phones` 146 | tom_phone, spare_phone; three tasks |
| 31 | Room tone; `roomToneTypes` maps a type the table lacks | shown (table types only) | `profileForRoom` office-room-tone.js:41 (scenario map first, at 44); room-tones.json; validator `check_room_tone` 84 | `"roomTone": true`; task `hear_office` |
| 32 | Use sounds heard only from the player's room | shown | `useVolume` npc-office-visuals.js:135 | tasks `hear_drink`, `hear_snack` |
| 33 | Conversation freeze; yield to the player | shown | `_talking` npc-needs.js:3979 | README steps 6 and 7 |
| 34 | Debug overlay | shown | `barLayout` npc-needs-debug.js:43 | `"needsDebugOverlay": true` |
| 35 | Player consumables (pick up, consumed from the inventory) | not shown | `consumableKind` consumables.js:67, `useConsumable` emits `item_consumed` `{ itemId, itemType, itemName, healed }` (216) | campaign scenarios; sims has no cup or snack |
| 36 | Work judged against resources, frustration, outage kick, check visits | not shown | npc-work.js `useVerdict`; `_countFailure` npc-needs.js:2226, `_tickKick` 2333, `enqueueVisit` 2371 | test_access_work; lab_physical_pentest |
| 37 | Workarounds | not shown | npc-workarounds.js `due` 119 | test_access_work; lab_physical_pentest |
| 38 | `social_media` need, the phone `self` job | not shown | `_socialCandidate` npc-needs.js:2148 (the NPC's own workstation first, the phone only when none is free or it is `socialBlocked`), `_startSelfJob` 2905 | test_access_social |
| 39 | Friendface feeds | not shown | social-feed.js; server `/feed_post` | test_access_social |
| 40 | Awareness levels and habits | not shown | workstation-state.js `habitOf` 125; door-gates.js:134 | test_access_habits; test_gate_tailgate |
| 41 | USB habit and policy | not shown | `usbRefusedBy` npc-needs.js:258, `_usbAttempt` 3416 | lab_physical_pentest; test_access_work |
| 42 | Unlocked sessions and sign-in per account | not shown | workstation-state.js `guestOf` 286, `onSatAt` 337 | test_access_sessions; test_access_signin |
| 43 | Traits (OLP slice 6) | planned | none | none |
| 44 | Routines: multi-step tasks (OLP slice 9, Part B) | planned | none | none |
| 45 | Arrive and leave on the game clock (OLP slice 12) | planned; no OLMP mission asks for it | none; `game-clock.js` exists | none |
| 46 | Consumables and refills for NPC sources (OLP slice 13) | planned | none | none |
| 47 | Per-NPC sessions at a locked screen (OLP 16b) | superseded by row 42 | none | test_access_sessions |
| 48 | E1: attacked or knocked-out needs NPC, live | unproved | knocked-out, hostile and hidden NPCs stay registered and keep decaying; `isAvailable` npc-needs.js:1086 and the block in `_tickNpc` 1273-1281 stop them acting, and `_goHome` runs on `unblocked` (1282-1285); `onKnockedOut` workstation-state.js:566; server KO drop guard `game.rb` 486-523; a unit test covers drop and walk home | nowhere live |
| 49 | E2: vending preset | planned | sprites `vending_machine1.png`, `drinks_vending1.png`; no entry in office-presets.json | none |
| 50 | E3: more than 6 needs NPCs | unmeasured | test/js/npc-needs-tick-cost.test.mjs; 6-NPC mean tick 0.19 ms (OLMP 9) | 6 NPCs only |
| 51 | E4: lazy room loading | design rule | `_onRoomsLoaded` npc-needs.js:1119 | the README's "open the doors" step |
| 52 | E5: an NPC at its post for a beat | design rule; helper in the backlog | the three protections in OLMP section 2 | none |
| 53 | Simulating unloaded rooms; persisting need levels | not planned | OLP 4.1 | none |
| 54 | `maxUnmetMin`: a starved need overrides deferral | not shown | `_starved` npc-needs.js:1410 | nowhere |
| 55 | `printHabit.shareAfterSeconds`: an unclaimed print becomes anyone's | not shown | `_tickPrints` npc-needs.js:3630, 3691-3696 | nowhere |
| 56 | `npc_print_gone`: the owner finds the player took the print | not shown | `_tickPrints` npc-needs.js:3682 | nowhere; m02's paper openings rest on it |
| 57 | `deferrable: false` story needs | not shown | `_useCandidate` npc-needs.js:1580-1582 | nowhere |
| 58 | A magnet that starts as a room object and is picked up, then dropped | unproved | room objects with an `affordance.magnet` register at room load (`_noteMagnets` over `listObjects` 4817) and show while in a room (`_shownMagnets` 751); the validator warns that only a held droppable magnet is built (validate_npc_needs.rb:272) | nowhere; m06 needs it |

Counts: shown 32 (rows 1-3, 5-27, 29-34); not shown 14 (rows 4, 28, 35-42, 54-57); unproved 2 (48, 58); planned 5 (43-46, 49); superseded 1 (47); unmeasured 1 (50); design rule 2 (51, 52); not planned 1 (53).

### 1.2 Built behaviours the sims day leaves out, and why

- **Work needs, frustration, outages (row 36) and workarounds (row 37).** No campaign mission in OLMP 5 uses them; test_access_work and lab_physical_pentest show them. Workarounds are security beats and the showcase stays neutral.
- **`social_media` and the phone job (row 38), Friendface (row 39).** No campaign mission uses them. If the showcase ever adds the phone job, the NPC's own PC must block social media by policy (`policy: { social: "blocked" }`, read in `_socialCandidate`), or the NPC checks social media at the desk and never takes out the phone.
- **Awareness, USB, sessions, sign-in (rows 40-42).** Security material; they stay in their access test floors.
- **`maxUnmetMin` and `deferrable: false` (rows 54, 57).** Story-need knobs; m02 does not use them (OLMP 2 says `deferrable: false` is not a protection). They stay in the author contract and the unit tests.
- **The deny-list leash (row 4, second form).** Shown by Nisha in SIMS-3, which makes it the first live use anywhere.

### 1.3 The Grace overlay in the baseline run (game 3537)

`base-05-office-later2-3537.png` shows Grace's overlay panel ("grace: using 12s lounge_sofa") and her `Z` icon over the office's west desks, with Grace's own sprite under them. The decision log in `base-info-3537.json` has `482 urgent rest`, `482 job_start rest lounge_sofa`, `482 windup` and `491 using rest lounge_sofa`. Nine ticks is 2.25 s of the needs clock, and the sofa's approach cell (540,244) is about 15 tiles from her desk, so she cannot have walked there.

**A real fault.** The needs state entered `using` for an object in another room while the NPC stood at her own desk. Two targeted probes on :3093 did not repeat it (games 3560 and 3572: Grace walked the whole way and entered `using` 31 px and a few px from the cell). Probe scripts and samples are in the session scratchpad (`officelife-sims/probe-grace.mjs`, `probe-grace2.mjs` and their JSON).

**Cause.** `_advanceJob` (npc-needs.js:3119) treats any `npc_arrived:<id>` whose owner is `needs` as the job's arrival. Two moves produce such an event without the job's destination being reached:

1. **Seating's own moves.** A chair fetch or tuck-in moves the NPC with `goToAndStay(..., { owner: 'needs', fromSeating: true })` (`moveNeeds`, seating.js:2029-2033). Its arrival reaches `onArrived` (npc-needs.js:630), which queues every owner-`needs` arrival. A fetch that ends beside the desk just after a job starts is indistinguishable from the job's arrival. The baseline's other oddity fits this: on the way home after the mugs, Grace logged `return_resumed` at (116,156), beside her desk, every 12 ticks for 70 ticks, which is a fetch and the walk home taking turns.
2. **A path that ends early.** The behaviour layer fires the arrival when its current path runs out (npc-behavior.js, "Reached end of path", 1241-1245, calling `_triggerGoToStayArrival` 3064) with no check against the destination. A stale or cut path would do the same.

SIMS-2 tags every needs move so that only the arrival of the move the job is waiting for counts, and keeps a distance check as a second guard.

---

## 2. What the campaign needs from the showcase

| Mission (rollout order) | What it needs proved first | Where it is proved | Slice |
|---|---|---|---|
| m02 (pilot) | E1: a needs NPC attacked and knocked out outside its post room, KO globals, tasks and held-item drops once, reload; one hostile from the start; protection 3 (an event walks the NPC home); a needs NPC's sight catch and conversation-mode mapping firing while it walks in its own room (Gary's `on_cabinet_picked`) | `test_needs_attack` (new, its own scenario as OLMP 9 says) | SIMS-1 |
| m02 | Gary walks to his kettle and copier inside IT and must reach them, not "arrive" at his desk | the whole showcase and test_needs_leash | SIMS-2 |
| m02 | protection 2 on a desk NPC (leash of one room, every target in it); a kettle shared by two (capacity 2 and `chatter` written on the object); exchanges gated by `requireGlobal` in both the `false` and `true` forms; `officeType: "kettle"` on `hot_water_boiler1` and `officeType: "fridge"` on `undercounter_fridge1`; `affordance: false` keeping a declared object out of the preset list; print and forget on a reveal slot and the paper leak (`npc_print_gone`); a second NPC posted in another room whose leash reaches the first room through a door; `hush` pools; a group; `roomToneTypes` for a room type the tone table does not map | the IT room and the facilities office | SIMS-3 |
| E2 (after the pilot, before m06) | vending presets for snacks and drinks | the facilities office | SIMS-4 |
| m05, m08 | E3: frame cost with more than 8 needs NPCs; new ambient staff at new desks with screen and print habits; needs confined to one room (m05's Lisa, m08's off-duty agent) | measured on the showcase and a 12-NPC copy; Keith | SIMS-4 |
| m06 | a magnet seen rather than announced, from an in-world source (it starts in a room, the player carries it), with a servings global and a hunger source, drawing a desk NPC away and opening a screen-habit window; a reload keeps it where it was dropped | the leftover pizza and Nisha's screen | SIMS-5 |
| m01, m03, m04, m07 | coffee and cooler, cake, `avoids`, screen-lock habits, an exchange at a coffee point, a kettle with needs confined to one room | already shown, or shown by SIMS-3 (Neil) | none new |
| m09, m10 | Tier 0 | nothing | none |

OLMP lists no arrive-and-leave item, and its E5 is a design rule with the helper in the backlog. m05's "thinning evening office" is authored there with a small posted evening staff, so schedules (SIMS-6) and the summon (SIMS-7) wait in the backlog with refills (SIMS-8) until a mission's design asks for them.

---

## 3. The showcase: a small office day

### 3.1 What stays fixed

- The three rooms (`office`, `kitchen`, `lounge`), the six NPCs (`amara`, `tom`, `grace`, `sanjay`, `rosa`, `marek`), every object id, every global and every task id stay as they are, with their needs numbers, seed (`npcNeedsSeed: "test_needs_sims"`) and positions, so the README's live-proof tables and the node fixture (`test/js/fixtures/needs-sims-world.mjs`, `GOLDEN_SIMS_DAY`) hold. Nothing is renamed.
- The new NPCs never use a source in the office, kitchen or lounge (section 3.4), and the two new rooms are private to their own staff, so no office NPC walks to the new kettle, fridge or vending machines. The README's office beats (coffee contention, the kitchen fallback, the queue, the outcast, the cake) therefore log the same with every door open.
- Files that read this scenario and must keep passing: `test/js/npc-left-behind.test.mjs` (validator run, Tom's badge), `test/js/npc-needs-slots.test.mjs` (validator run, copier pool, `GOLDEN_SIMS_DAY`), `test/js/npc-needs.test.mjs`, `test/js/npc-needs-tick-cost.test.mjs`, `test/js/npc-desk-phone.test.mjs`, `test/js/table-drop.test.mjs`, `test/js/validator-office-presets.test.mjs` (asserts the exact preset object list, 84-93: updated in SIMS-3 and SIMS-4), `test/js/inventory-menu.test.mjs` (asserts the scenario's droppable items, 30-60: updated in SIMS-5), `test/js/npc-voiced-chatter.test.mjs` (reads this scenario's compiled ink, 22), `test/unit/format_8a_corpus_test.rb` and `test/js/format-8a-reader-parity.test.mjs` (frozen renders in `test/fixtures/format_8a/`, so an edit does not break them), and `tools/playtest/needs-baseline-capture.js` (its visit list stays valid; new NPC lines in a fresh capture are expected and recorded). Hacktivity's tests load `test_objectives` and `test_simple_success`, not this scenario.
- The scenario stays ERB-free (the format corpus test relies on a deterministic parse).
- The office keeps its needs-free levers (the spare phone, the sockets, the notes); new levers sit beside them.

### 3.2 Rooms

Two rooms are added, both on registered maps (`core/game.js`: `room_it` at line 120 loads `rooms/room_IT.json`; `room_security` at 138). `python3 scripts/check_door_alignment.py` passes for this layout, run on a scratch render of the current scenario with the two rooms and connections added: office north (48,32) matches IT south (48,32); IT east (304,-176) matches facilities west (336,-176); the kitchen and lounge pairs are unchanged.

```
               it_room (room_it, 10x10) ── east ── facilities_office (room_security, 10x10)
                    │ south door at office (48,32)
 kitchen (room_break) ── office (room_office, start) ── lounge (room_meeting)
```

| Room id | Map | Connections | Private to | Role |
|---|---|---|---|---|
| `office` (start) | room_office | west kitchen, east lounge, **north it_room** | nobody | open-plan floor, unchanged inside |
| `kitchen` | room_break | east office | nobody | unchanged, plus one cup |
| `lounge` | room_meeting | west office | Rosa, Grace (now) | unchanged, plus the leftover pizza on the table (SIMS-5) |
| `it_room` (new) | room_it | south office, east facilities_office | `["neil", "nisha"]` | IT support: Neil's desk, the hot-water boiler, a copier with four printout slots, an undercounter fridge, an empty water cooler |
| `facilities_office` (new) | room_security | west it_room | `["nisha", "keith"]` | facilities: two desks with PCs, filing cabinets on the back wall, later the vending machines |

Why these maps. `room_it` is the generic IT room used by m01, sis02 and test_access_signin; its drawn furniture is desks, servers, a chalkboard and a smart screen, and its lock pick, keys, safes and VM launchers sit in conditional layers that appear only when a scenario object claims them. `room_security` is a plain two-desk office (desks at tiles (2,5) and (6,5), chairs below them, filing cabinets and a chalkboard on the back wall) with no sign or logo, so it reads as a facilities office. A reception was considered and left out: `room_reception`'s counter stands against the back wall with no staff side, and every reception map with a counter in the room (`room_zds_reception`, `room_qdc_lobby`, `room_aes_reception`, `room_hq_lobby`) carries a mission's logo.

**Overlaps.** By the engine's stacking, the facilities office spans y -256 to 64 at x 320 to 640, so its bottom two tile rows overlap the lounge's top wall rows with no door between them. Walking "behind" the lounge's back wall is the intended 3D effect and stays open; the render check in SIMS-3 confirms the walls draw, the behind-wall fade works and nothing can be used across the overlap.

**Room tone.** `room_it` maps to the `it` profile in room-tones.json. `room_security` is not in the table, so the scenario adds `"roomToneTypes": { "room_security": "quiet_office" }`, the same mechanism m02 uses for its hospital rooms.

**How the player meets each room, and when its life starts.** Only loaded rooms exist (E4). Every room loads when the player opens its door and stays loaded.

| Room | First reachable | Life starts |
|---|---|---|
| office | at load | Amara, Tom, Grace, Sanjay, Marek |
| kitchen, lounge | one door | when opened; Rosa registers with the lounge |
| it_room | one door (north) | when opened; Neil registers |
| facilities_office | two doors (north, then east) | when opened; Nisha registers (and Keith from SIMS-4). IT is always loaded by then, so all of Nisha's targets exist from her first tick |

### 3.3 Objects added

Positions are tile starting points, square to the walls (one or two angled props per room at most). The first step of SIMS-3 renders both rooms and moves any object that overlaps the map's furniture or a doorway; queue and approach cells stay out of all doorways.

**it_room (SIMS-3):**

| Id | Type | Fields | Purpose |
|---|---|---|---|
| `neil_pc` | pc3 (claims the map's conditional PC on the upper desk) | `workstation: true`, `screenOwner: "neil"`, `lockChance: 1` | Neil's post; desk_pc preset |
| `neil_chair` | chair-white-1-rotate3 (claims the conditional chair at the desk) | none | so seating has a chair at his desk |
| `it_boiler` | hot_water_boiler1, about (7.5,1.6) on the back wall | `officeType: "kettle"`, `affordance: { capacity: 2, chatter: "tea" }` | the shared kettle and exchange spot; m02's pattern exactly |
| `it_fridge` | undercounter_fridge1, about (7.5,7) | `officeType: "fridge"` | hunger for Neil (and for Nisha until SIMS-4) |
| `it_copier` | photocopier1, about (1.5,6.5) | copier preset, `uncollectedAfterSeconds: 180` | Neil's and Nisha's prints |
| `it_out_a` to `it_out_d` | notes1 on the copier tray | `outputOf: "it_copier"`, `revealOnGlobal: "it_out_<x>_shown"`, `needsTag: "printout"`, readable, neutral IT text (a toner order, a patch note, a desk move list, a training reminder; no account, address, password or code); `a` and `b` takeable | the paper-leak beat |
| `it_cooler_empty` | water_cooler1, about (1.2,2.2) | `affordance: false`, name "Empty Water Cooler", observations "The bottle has been empty for a week." | proves a declared preset type kept out |
| `tea_round_note` | notes1 | readable, name "Tea Round" | lever: Neil and Nisha want a tea now |
| `it_print_queue` | notes1 | readable, name "IT Print Queue" | lever: Neil prints now and fetches it in 20 to 30 s |

**facilities_office (SIMS-3, SIMS-4):** `nisha_pc` (pc5, claims the left desk's PC; `workstation: true`, `screenOwner: "nisha"`, `lockChance: 0`, `autoLockSeconds: 90`); from SIMS-4 `keith_pc` (pc5, the right desk; `workstation: true`, `screenOwner: "keith"`, `lockChance: 1`), `facilities_vending` (vending_machine1, back-wall corner, vending_snack preset), `facilities_drinks` (drinks_vending1, the other back-wall corner, vending_drinks preset), `vending_note` (notes1, "Vending Restocked", the lever).

**kitchen (SIMS-3):** `kitchen_cup` (office-misc-cup2, "Mug of coffee", takeable, on a kitchen table): a player consumable.

**lounge (SIMS-5):** `leftover_pizza` (pizza_boxes1 on the meeting table; `takeable: true`, `droppable: true`, `affordance: { satisfies: "hunger", restores: 60, useSeconds: 15, magnet: { tempt: 30, servings: 2, perPerson: 1 } }`, no `announce`, no `needsTag`). Nobody who uses the lounge (Rosa, Grace) has a hunger need, so it draws nobody until the player moves it.

### 3.4 Cast

**Which sprites are free.** A new NPC may not wear a player avatar (the 14 starter sprites in `app/models/break_escape/player_preference.rb`, `AVAILABLE_SPRITES`) or a named character's own art. Every character sprite with sit frames was checked against every scenario's `spriteSheet` values. All non-starter keys belong to a named character (for example `bernie_nwosu`, `female_nurse1_v2` as Sister Doyle and `female_nurse2_v2` as Nurse Raval in m02, the lab_physical_pentest cast), except four that are only ever cast as unnamed roles:

| Sprite key | Used elsewhere as | Concept (from `<key>_nonpixelart_prompt.txt`) | Art |
|---|---|---|---|
| `offduty_agent` | m08 "Off-Duty Agent" (unnamed background) | white Geordie man about 46, thinning sandy hair, reading glasses, green jumper over a checked shirt, lanyard | walk, 8 sit frames (one per direction), headshot, talk sheet, visemes |
| `junior_analyst` | m08 "Junior Analyst" (unnamed background); a test seat | British-Indian woman about 25, long black hair in a high ponytail, maroon sweatshirt over a white collar, lanyard, takeaway cup | same |
| `security_guard` | m04 and m10 "Guard" | white man from Bristol, mid 50s, grey beard, hi-vis vest with radio over a navy uniform jumper | same |
| `hashchain_guard` | m06 and m10 "Checkpoint Guard" | British-Colombian man about 45, shaved head, greying goatee, black bomber jacket, radio, clipboard | same |

`male_spy_v2` (Director Netherton's look in m02 to m06) and the two hood-down hacker sprites (player avatars, and Agent 0x00's look) are not cast. The cast is sized to what is free: three new NPCs in the main slices and the fourth sprite kept for the night officer in the backlog (SIMS-6). Each sprite appears once in the showcase. All four have talk art, so no character art is requested.

| Id | Name, role | Sprite | Post | Leash | Needs (decay/min, urgent at, initial; jitter 0) | Habits and other fields | Shows |
|---|---|---|---|---|---|---|---|
| `neil` (SIMS-3) | Neil Robson, IT support engineer, Geordie, mid 40s | offduty_agent | `neil_pc` | `needsRooms: ["it_room"]` | caffeine 8/40/70 (`it_boiler`), work 10/50/80 (`neil_pc`), hunger 3/40/75 (`it_fridge`) | `printHabit: { fetchAfterSeconds: [30, 90], forgetChance: 0.5 }`; `onUse: { neil_pc: { revealOutput: "it_copier" } }`; `needsCompany: { groups: ["it_tea"] }`; exchanges `exchange_neil_tea` (`requireGlobal: { "neil_print_gone": false }`) and `exchange_neil_page_gone` (`requireGlobal: { "neil_print_gone": true }`), both `with: "nisha"` | protection 2 (every target in his room), the allow-list leash, print and forget, the paper leak; the m02 Gary pattern |
| `nisha` (SIMS-3) | Nisha Kapoor, facilities coordinator (apprentice), early 20s | junior_analyst | `nisha_pc` | `needsAvoidRooms: ["office", "kitchen", "lounge"]` | caffeine 8/40/72 (`it_boiler` only), work 10/50/85 (`nisha_pc`), hunger 3/40/60 (`it_fridge`; the vending machine from SIMS-4; the pizza in SIMS-5) | `printHabit: { fetchAfterSeconds: [20, 60], forgetChance: 0 }`; `onUse: { nisha_pc: { revealOutput: "it_copier" } }`; `needsCompany: { groups: ["it_tea"] }`; pools with `hush: true` | a second room reached through a door (m02's N1), the deny-list leash, print errands, a careless screen habit (m06) |
| `keith` (SIMS-4) | Keith Dando, facilities officer, from Bristol, mid 50s | security_guard | `keith_pc` | `needsRooms: ["facilities_office"]` | hunger 3/40/62 (`facilities_vending`), thirst 4/40/72 (`facilities_drinks`), work 8/50/85 (`keith_pc`) | none beyond `lockChance: 1` on his PC | vending, needs confined to one room (m05's Lisa, m08's off-duty agent), a careful screen habit |
| `andres` (SIMS-6, backlog) | Andrés Mejía, night security officer, mid 40s | hashchain_guard | tile home at the facilities office's west wall | `needsRooms: ["facilities_office"]` | hunger, thirst at the vending machines | `schedule` (SIMS-6) | the night desk |

Why Nisha's leash is a deny list. Neil shows the allow form; Nisha shows the deny form, the first live use of it. Both run through `_roomForbidden` (npc-needs.js:1197), so m02's N1 (an allow list of two rooms) behaves the same. Nisha's list names every room that holds a source of one of her needs outside her two rooms (the office coffee, the kitchen coffee, fridge and microwave, the lounge kettle), so each leash refuses a real, non-private object: the `npc_needs_leashed` events carry `skipped` lists that include `office_coffee`, which only the leash can refuse (the lounge is private, so a lounge skip proves nothing). A room added later and not named would be open to her; the validator's `leash_reach` lists her reachable rooms, and SIMS-3's node test pins them.

Why Keith appears in SIMS-4. His needs are hunger and thirst inside his own room; before the vending machines there is nothing there for them.

Cast mix across the nine: four women and five men; heritage Nigerian, English, Swedish, Indian, Hispanic, Polish (the six), Geordie, British-Indian, West Country (the three); ages from early 20s to mid 50s. The new heritages follow the concept prompts; names are the author's choice and can change without touching an id. Every new NPC gets a `voice` (a male or female voice with a style line matching the prompt) and chatter pools of its own.

### 3.5 The day on the needs clock

There is no game clock in the main slices. Times below are needs-clock minutes from load. The needs clock advances with each frame's delta, capped at 1 s per frame (`update` npc-needs.js:606, `MAX_FRAME_MS` 1000, one tick per 250 ms), so it keeps pace with wall time headless as long as the frame rate stays above 1 fps; the live proofs read `npcNeedsSystem.clockMs` and never assume wall time. Initial levels have no jitter (`jitterPct` defaults to 0), so the times below are exact apart from walk lengths.

| Needs time | What happens without levers | Slice |
|---|---|---|
| 0:00 to 2:00 | the current office beats, unchanged | built |
| IT opened (the tour opens it at 1:00) | Neil at his desk. Work urgent 3:00 later, so his first work use and print come about 4:00; he fetches it 30 to 90 s later or forgets it (half the time), and a forgotten page logs `npc_print_uncollected:neil` 180 s after it lands. Caffeine urgent 3:45 after IT opens: a tea at the boiler, with a `leashed` event skipping the office coffee | SIMS-3 |
| facilities opened (the tour opens it at 1:20) | Nisha at her desk. Work urgent 3:30 later (about 4:50): a work use, a print to the IT copier, and a walk into IT 20 to 60 s later to fetch it (`npc_print_fetched:nisha`). Caffeine urgent 4:00 later: a tea at the IT boiler. Hunger urgent 6:40 later | SIMS-3 |
| facilities opened, from SIMS-4 | Keith at his desk. Hunger urgent 7:20 later, thirst 8:00 later, at the vending machines | SIMS-4 |

The levers bring each beat forward (section 7), so the README tour never waits on these times.

---

## 4. Every built behaviour, where and when

Rows refer to table 1.1. "Now" means it is already in the scenario and stays.

| Row | Behaviour | Where | When, and the lever |
|---|---|---|---|
| 1, 2, 3 | needs, posts, presets; `officeType` and `affordance: false` | every room; `it_boiler`, `it_fridge`, `it_cooler_empty` | all day |
| 4 | leash, allow and deny | Neil (allow), Nisha (deny), Keith (allow) | each new NPC's first caffeine or hunger job emits `npc_needs_leashed` with `office_coffee` or another office source in `skipped` |
| 5 | private rooms | lounge (now), it_room, facilities_office | all day |
| 6 | carry jobs | parcel, mugs (now) | player drops them |
| 7, 24, 56 | reveal slots, print and forget, the paper leak | office and kitchen copiers (now); `it_copier` | the IT Print Queue note, then take the page before Neil comes for it |
| 8 to 13 | icons, bubbles, items in hand, seating, typing, swivel | every NPC in the player's room | all day |
| 14 | caught at the desk | any owned workstation | the player stands at a desk as its owner returns |
| 15 to 17 | lock decisions and cues | office PCs (now); Neil and Keith always lock; Nisha never locks and her PC auto-locks after 90 s | every leave |
| 18 | left behind | Tom's badge (now) | any leave |
| 19, 22, 23 | chat at a capacity-2 object, `hush`, exchanges gated both ways | kitchen cooler (now); `it_boiler` with Neil and Nisha (group `it_tea`) | the Tea Round note sends both at once; the first time plays `exchange_neil_tea`, the first time after the paper leak plays `exchange_neil_page_gone`. Nisha's pools go quiet when the player stands close |
| 20, 21 | queues, avoidance | office and kitchen coffee (now); the vending machines (SIMS-4) | Activity Board, Coffee Notice (now); Vending Restocked note |
| 25 | offWhen | sockets (now) | player lever |
| 26, 27, 29 | cake with announce, table landing | now | player drops the cake |
| 28, 58 | magnet seen only, starting in a room | `leftover_pizza` | carry it from the lounge to the facilities office (SIMS-5) |
| 30 | desk phones | now | player lever |
| 31 | room tone, including `roomToneTypes` | every room; facilities office through the scenario's map | all day |
| 32 to 34 | heard use sounds, freeze and yield, overlay | everyone | all day |
| 35 | player consumable | `kitchen_cup` | pick it up, use it from the inventory |
| 48 | E1 | test_needs_attack (SIMS-1) | the probe |
| 49 | vending | facilities office (SIMS-4) | Keith, Nisha |
| 50 | E3 | measured in SIMS-4 | the perf tool |

Rows 36 to 42, 54 and 57 stay in their test floors (1.2). Rows 45 and 52's helper are in the backlog (SIMS-6, SIMS-7).

---

## 5. Build slices

Order: SIMS-1, SIMS-2, SIMS-3, SIMS-4, SIMS-5, then the backlog (SIMS-6, SIMS-7, SIMS-8) only when a mission's design or the user asks. SIMS-1 changes no engine file and can run beside SIMS-2; from SIMS-2 on they run one at a time, because each touches `npc-needs.js` or the showcase.

**Every slice ends the same way.** Node tests, run with `bin/test-js`; `ruby scripts/validate_scenario.rb` 0 errors on every scenario the slice touches; ink compiled; the scenario README's annotated example and live-proof table; the slice's own files committed (explicit paths, `git diff --cached --stat` checked) before any live run, with fixes as follow-up commits; then the live proof on a keyless server, headless, with `setFPS(20)` and fixed steps on (never `fixedStep=false`), switching Phaser's rAF to setTimeout mode if `loop.actualFps` drops below 10. The E3 measurement is the one exception: it runs at the normal frame rate under a virtual display (xvfb), never in a visible window. A live proof that fixes a fault first reproduces the fault on the build as it stands. Sizes count engine, validator and schema lines, without tests or scenario data. A new static import in an engine module is added to each JS test harness copy list.

**The standard node set**, run by every slice: `test/js/npc-needs.test.mjs`, `test/js/npc-needs-slots.test.mjs`, `test/js/npc-needs-tick-cost.test.mjs`, `test/js/npc-room-leash.test.mjs`, `test/js/npc-magnet.test.mjs`, `test/js/npc-left-behind.test.mjs`, `test/js/npc-desk-phone.test.mjs`, `test/js/npc-coffee-off.test.mjs`, `test/js/npc-expected-away-route.test.mjs`, `test/js/table-drop.test.mjs`, `test/js/seating.test.mjs`, `test/js/workstation-state.test.mjs`, `test/js/office-presets.test.mjs`, `test/js/validator-office-presets.test.mjs`, `test/js/validator-npc-leash.test.mjs`, `test/js/inventory-menu.test.mjs`, `test/js/npc-voiced-chatter.test.mjs`, `test/js/consumables.test.mjs`, `test/js/format-8a-reader-parity.test.mjs`, and `ruby test/unit/format_8a_corpus_test.rb`. **The standard live set**: test_needs_leash (its leashed and unleashed runs), lab_physical_pentest (its three beats), test_access_work (judged uses end through the same arrival code).

### SIMS-1: E1, attacked and knocked-out needs NPCs, in `test_needs_attack`

- **Purpose.** OLMP E1, run before m02's design closes, because the answer decides which NPCs may move in missions that allow attacks. It also proves protection 3 and the sight catch on a walking needs NPC that m02's Gary relies on (OLMP 6.9 step 4).
- **Scenario** `scenarios/test_needs_attack/` (new; mission.json, scenario.json.erb with no ERB, ink, README). Rooms: `office` (room_office, start), `kitchen` (room_break, west; the pair is the same as test_needs_sims's and aligned), `back_room` (room_meeting, east). `officePresets: true`. NPCs, each with a short ink story (a greeting, two choices, a parting line) and a `voice`:
  - `ava` (junior_analyst): post `ava_pc` in the office; interest `dirty_mugs` (weight 3) carrying `office_mugs` to the kitchen's `washing_up_tray`; `globalVarOnKO: "ava_ko"`, `taskOnKO: "check_ko_drop"`.
  - `ben` (offduty_agent): post `ben_pc`; thirst 20/40/60 at the kitchen's `water_cooler` (the office has no thirst source, so every drink is outside his post room); `itemsHeld: [{ "id": "ben_notebook", "type": "notes1", "name": "Ben's Notebook", "takeable": true }]`; `globalVarOnKO: "ben_ko"`, `taskOnKO: "check_held_drop"`; protection 3: a mapping on `object_interacted` with `data.objectName === 'Meeting Note'` and `patrolOverride.targetTile` set to his post tile, `completeTask: "check_called_home"`, and a `"needs": "resume"` mapping on `object_interacted` with `data.objectName === 'Meeting Over'`.
  - `cal` (hashchain_guard): in `back_room`, `behavior.hostile: true` from the start, with a `needs` block and a `needsHome`.
  - `dee` (security_guard): post `dee_pc` in the office, `needsRooms: ["office"]`, caffeine 20/40/60 at `office_coffee` (an office coffee station declared in this scenario only), `los: { "enabled": true, "range": 400, "angle": 360, "visualize": false, "occlusion": false }` (Gary's settings), and a mapping on `lockpick_used_in_view` with `targetKnot: "on_drawer_picked"`, `conversationMode: "person-chat"`, condition `data.lockable.scenarioData.id === 'dee_drawer'`, `onceOnly: true`, `completeTask: "check_caught_walking"`. `dee_drawer` is a key-locked, pickable `filing_cabinet` in the office.
  - Notes `meeting_note`, `meeting_over`, and a "Break Time" note that sets Ben's thirst and Dee's caffeine to 10 (`needs.set`, cooldown 30 s).
  - Aim `checks` with tasks `check_ko_drop`, `check_held_drop`, `check_called_home`, `check_caught_walking`. The calm-down and walk-home are checked from the decision log, not a task.
- **Behaviour under test.** (a) Ava attacked in the kitchen mid-carry: she turns hostile (`player-combat.js:456`, `setNPCHostile`), the needs system blocks her (`isAvailable` 1086, the abort in `_tickNpc` 1273-1281 drops the carried mugs as an abort does), she chases or stands, calms down, and on `unblocked` walks home and resumes. (b) Ava knocked out there mid-carry: the job ends once, the mugs drop once where she fell, `ava_ko` and `check_ko_drop` fire once, `workstation-state.onKnockedOut` (566) runs; after a reload she stays down and the mugs are not duplicated. (c) Ben knocked out at the kitchen cooler: the notebook drops once where he fell; the server accepts that drop outside his scenario room only once the defeat is recorded (`game.rb` 486-523); after a reload he stays down and the notebook is there once. (d) Ben at the kitchen cooler when the Meeting Note is read: the patrol override walks him home and suspends needs; the Meeting Over note resumes them. (e) Cal never acts on a need: he is registered but blocked from the first tick and never starts a job. (f) Dee walking to the office coffee when the player picks `dee_drawer`: the catch fires, her conversation opens, she freezes for it, and afterwards she finishes or restarts her coffee and returns to her post; her conversation can be opened again.
- **Engine.** None. If a check fails, the result goes to the user as an engine item with its file:line; the likely places are `_abortJob` (npc-needs.js:3700) on a KO mid-carry and world `dropHeld`. Until it is fixed, missions keep needs NPCs inside their own post room (OLMP's fallback).
- **Schema and validator.** None new. The validator must report 0 errors; its existing warning on a needs NPC that is hostile from the start (if it gives one) is recorded in the README as intended.
- **Node tests.** `test/js/npc-needs.test.mjs` gains: an NPC whose `npcStatus` is hostile from tick 0 never starts a job and logs `blocked` once; `test/js/npc-needs-attack-scenario.test.mjs` (new) runs the validator on `test_needs_attack` (0 errors) and checks that Ben's cooler and Ava's tray are outside their post rooms, so the probe exercises the case E1 names.
- **Live proof.** `tools/playtest/needs-attack-probe.mjs` (new, about 180 lines): for each of (a) to (f), drive the beat through the test bridge, sample state, behaviour, hostility and position every 250 ms for 60 s, dump the server's game state (`npcHostility`, KO records, room `objects_added`), reload, dump again. Screenshots: before, hostile, down with the dropped item, after the reload, Dee's conversation opening mid-walk.
- **Regressions.** The standard node set; the standard live set.
- **Size.** 0 engine lines; scenario about 300 lines, 3 ink files, probe tool about 180.
- **Sync.** Existing records only: one `npcHostility` entry per attacked NPC (at most 4), one KO record each for Ava and Ben, `ava_ko` and `ben_ko` (two booleans), at most two `objects_added` entries (the mugs, the notebook), deduplicated by id, and four `triggeredEvents` keys for the `onceOnly` task mappings, each sent once as a delta. Nothing grows with play time; a reload replays nothing.

### SIMS-2: only the job's own move counts as its arrival

- **Purpose.** Remove the fault in 1.3: a needs NPC entering `using` for a target it never reached, from a seating move or a path that ended early.
- **Behaviour.** Every move the needs system issues carries a `moveId` (a counter on the system). The behaviour layer echoes it in its `npc_arrived` payload. A needs arrival counts only when its `moveId` matches the move the NPC's current job phase (or walk home, or queue step) is waiting for; arrivals from seating's fetch and tuck-in moves carry none and are ignored by the needs system (seating tracks its own fetch phases). As a second guard, a matching arrival more than 48 px (one and a half tiles) from the move's destination is logged `arrival_far { phase, target, x, y, dest, moveId }` and the move re-issued. A job phase whose move is no longer the behaviour's active move (another move replaced it) and has not arrived re-issues its move; after three re-issues in one phase the job fails with `move_lost`. Own-desk shortcuts, where `_moveForPhase` queues the arrival itself, are unchanged.
- **Engine.** `npc-behavior.js`: `goToAndStay` (2980) stores `opts.moveId` as `this._moveId`; `_triggerGoToStayArrival` (3064) adds `moveId` to the `npc_arrived` payload and clears it; a getter `activeMoveId()` for the needs world. `npc-needs.js`: the world's `moveTo` takes and passes a `moveId`; `onArrived` (630) takes the payload's `moveId` and drops a non-matching one with a log line `arrival_ignored { moveId, want, fetch }` (`fetch` from `behavior._fetch`); `installNpcNeeds` passes `data.moveId` from the `npc_arrived:*` listener; `_advanceJob` (3119) and `_advanceQueued` (4408) check distance and the active move; the walk-home branch of `_tickNpc` does the same. `seating.js`: no change (`moveNeeds` keeps passing no `moveId`). Scenario mappings on `npc_arrived:<id>` see one extra payload field and nothing else.
- **Schema and validator.** None.
- **Node tests.** `test/js/npc-needs.test.mjs`: an arrival with another move's id is ignored; one with no id (a seating move) is ignored; the matching one counts; a matching arrival 200 px off is re-issued, then counts when near; a replaced move is re-issued at most three times, then `move_lost`; a seated own-desk work job still starts at once. `test/js/npc-behavior-arrival.test.mjs` (new): `goToAndStay` with a `moveId` echoes it once and clears it. `GOLDEN_SIMS_DAY` in `test/js/npc-needs-slots.test.mjs` and the sims-day digest are byte for byte the same.
- **Scenario.** No new data. The existing task `see_rest` (Grace on the sofa) is the objective this slice keeps ticking. The README gains a line under "Engine findings".
- **Live proof.** `tools/playtest/needs-arrival-proof.mjs` (new). First, on the build before the slice, reproduce: open the lounge, wait for Grace idle at her post, force `rest` to 5, and while she walks emit a synthetic `npc_arrived:grace` with owner `needs` through the test bridge (what a seating move sends); the unfixed build enters `using lounge_sofa` far from the sofa (screenshot and log). Then 20 natural runs: force `rest` to 5 each time Grace starts a chair fetch (`npc_fetching_chair`), and 20 times force Tom's caffeine with the office coffee switched off (the kitchen trip). On the fixed build: the synthetic arrival is logged `arrival_ignored` and she walks on; every `using` entry is within 48 px of its cell; any `arrival_far` or `move_lost` lines are recorded. Screenshots: Grace on the sofa with her overlay, once per run.
- **Regressions.** The standard node set; the standard live set.
- **Size.** About 50 lines (npc-behavior.js about 10, npc-needs.js about 40).
- **Sync.** Writes nothing; move ids live only in the browser.

### SIMS-3: the IT room and the facilities office (m02's patterns)

- **Purpose.** Everything in section 2's m02 rows that the showcase does not show yet, in neutral office form: Neil (the Gary pattern) and Nisha (the N1 pattern), plus the player cup.
- **Step 1, render.** Add the two rooms with no NPCs; render both with `tools/playtest/room-snapshot.mjs`, list every drawn item, place the objects of 3.3, check the doorways, the facilities-over-lounge overlap (walls, behind-wall fade, no interaction across it) and that Neil's chair sits at his PC. Re-run `check_door_alignment.py`.
- **Step 2, data.** Rooms, objects and the two NPCs as in 3.2 to 3.4. Top level: `"roomToneTypes": { "room_security": "quiet_office" }`. New globals declared in `globalVariables`: `it_out_a_shown` to `it_out_d_shown` (false), `neil_print_gone` (false), `heard_exchange_neil_tea`, `heard_exchange_neil_page_gone` (false). Neil's mappings: the Tea Round note sets his caffeine to 10 (cooldown 30 s); the IT Print Queue note sends `"needs": { "print": { "producer": ["it_copier"], "fetchAfterSeconds": [20, 30], "forget": false } }` (cooldown 60 s, as Tom's Print Queue mapping); `npc_print_gone:neil` sets `neil_print_gone` and barks a line from his JSON (`onceOnly`). Nisha's: the Tea Round note sets her caffeine to 10. Ink: `neil.ink` (a short hub, plus the two exchange knots `exchange_neil_tea` and `exchange_neil_page_gone`, about 6 lines each, neutral office talk; neither repeats a pool line) and `nisha.ink` (a short hub).
- **Spoken lines.** Neil: pools `tea` (5), `grumble` (3); the print-gone bark (1). Nisha: pools `tea` (5) and `greet` (3), each `{ "lines": [...], "hush": true }`. One line each, 40 characters at most, no `{ }`, no speaker prefix. About 50 lines in all with the ink.
- **Schema and validator.** No new fields. Expected validator output: presets listed for `neil_pc`, `nisha_pc` (desk_pc), `it_boiler` (kettle, through `officeType`), `it_fridge` (fridge, through `officeType`), `it_copier` (copier); not for `it_cooler_empty`; T1/P lines for Neil and Nisha; Neil's leash with every target in his room; Nisha's reachable rooms `facilities_office` and `it_room`; both exchanges found with both speakers voiced; no impossible need.
- **Node tests.** `test/js/validator-office-presets.test.mjs`: the sims list gains `it_boiler`, `it_copier`, `it_fridge`, `neil_pc`, `nisha_pc`. `test/js/npc-needs-sims-validator.test.mjs` (new): the validator run above, line by line. `test/js/npc-room-leash.test.mjs`: a deny-list NPC whose only caffeine source is in its second room goes there through the door, and its `leashed` event lists the first room's source in `skipped`. `test/js/npc-needs.test.mjs`: an exchange with `requireGlobal: { x: false }` plays only while `x` is false, and its `true` twin only after. `test/js/inventory-menu.test.mjs` unchanged (no new droppable). `test/js/npc-voiced-chatter.test.mjs` passes with the two new ink files compiled. The three-room fixture `needs-sims-world.mjs` is not changed.
- **Objectives** (new tasks in `watch_the_office`, with `onceOnly` mappings on Neil or Nisha): `see_it_tea` (`npc_used:it_boiler`), `see_kept_to_it` (`npc_needs_leashed:neil`, condition `Array.isArray(data.skipped) && data.skipped.includes('office_coffee')`), `see_kept_out` (`npc_needs_leashed:nisha`, same condition), `hear_tea_round` (`npc_exchange_heard:exchange_neil_tea`), `take_neils_page` (`npc_print_gone:neil`), `hear_page_gone` (`npc_exchange_heard:exchange_neil_page_gone`), `see_print_errand` (`npc_print_fetched:nisha`), `see_it_fridge` (`npc_used:it_fridge`), `drink_a_coffee` (`item_consumed`, condition `data.itemId === 'kitchen_cup'`; `useConsumable` already emits it, consumables.js:216).
- **Live proof.** Drive the tour rows for this slice (section 7) with all doors open, to 10 minutes of needs time. Pass: every new task ticks; the README's earlier office rows log the same beats as game 3537 apart from new NPC lines (re-run the queue, outcast and kitchen-fallback beats with every door open); no office NPC uses an IT or facilities object; Nisha says nothing while the player stands beside her; the facilities office plays the quiet office bed. Screenshots: each new room with its people, the tea round pair at the boiler, the empty tray after the page is taken, Nisha fetching in IT.
- **Regressions.** The standard node set; the standard live set; the README's earlier tables as above.
- **Size.** 0 engine lines; scenario about 400 lines, 2 ink files.
- **Sync.** New scalars, each a one-key delta when it changes: 6 workstation booleans (2 new owned workstations x 3), 4 slot globals (set once each), `neil_print_gone` (once), 2 `heard_` booleans (once each), about 9 `triggeredEvents` keys (once each). The taken page and the cup go through the existing inventory echo, the cup leaving it when drunk. Worst case 13 globals and 9 event keys. None grows with play time; a reload restores the saved values and replays no beat.

### SIMS-4: E3 measured, the vending presets (E2) and Keith

- **Purpose.** E3 before the cast passes 8 (m05, m08 and any Tier 3); E2, which OLMP lands straight after the pilot and before m06; Keith, the ambient desk NPC with needs confined to his room.
- **Step 1, E3.** `tools/playtest/needs-perf.mjs` (new, about 140 lines) at the normal frame rate under xvfb, no rAF switch and no physics throttle, on a quiet machine (load under 4): wrap `npcNeedsSystem.tick` and the action-icon `update` with `performance.now`, record frame intervals from `requestAnimationFrame`, for 180 s after opening every door. Three runs, all on the five-room scenario after SIMS-3, so loaded rooms are the same in each: A, Neil and Nisha with their `needs` removed (6 needs NPCs); B, as shipped (8); C, a scratch copy with Keith and three extra office clones (new ids, same needs as Tom, Sanjay and Grace) for 12. Pass: tick mean at most 1.0 ms and p95 at most 3 ms in C; frame-interval p95 in B and C within 10 % of A. The numbers go in the README's engine findings and to the missions plan owner for its E3 row. If C fails, profile, keep Keith out (the showcase stays at 8), and raise an engine item.
- **Step 2, presets.** `office-presets.json` gains `vending_snack` (`types: ["vending_machine1"]`, hunger, restores 50, 8 s, capacity 1, `useFrom: { dx: 0, dy: 1 }`, `useSound: "eat_snack"`, `queue: { cells: [{ dx: -1, dy: 1 }] }`) and `vending_drinks` (`types: ["drinks_vending1"]`, thirst, restores 60, 6 s, `useSound: "drink_gulp"`, same use cell and queue). No `startSound` until a coin sound exists (6.4). The machines' footprints are checked in the render and `useFrom` adjusted if a machine is taller than one tile. Shared data: only test scenarios set `officePresets` today, so no deployed game changes; the user took this decision on 2026-11-14 (OLMP 14, item 7).
- **Step 3, data.** `keith_pc`, `facilities_vending`, `facilities_drinks` and `vending_note` (3.3); Keith (3.4) with a short `keith.ink` hub and a `voice`; the Vending Restocked note sets Keith's hunger and thirst and Nisha's hunger to 30 (cooldown 30 s). Nisha's hunger now goes to the vending machine (nearer than the IT fridge); the IT fridge keeps Neil.
- **Spoken lines.** Keith: pools `vending` (4), `grumble` (3), about 12 ink lines.
- **Schema and validator.** No schema change; `preset_table` reads the file, so the validator lists the two machines.
- **Node tests.** `test/js/office-presets.test.mjs` (`presetIdFor` for both types, and that a takeable vending machine gets none); `test/js/validator-office-presets.test.mjs` (the preset table test, and the sims list gains `facilities_drinks`, `facilities_vending`, `keith_pc`).
- **Objectives.** `see_vending_snack` (`npc_used:facilities_vending`), `see_vending_drink` (`npc_used:facilities_drinks`), `see_keith_locks` (`workstation_owner_left:keith_pc`, condition `data.screenLocked === true`).
- **Live proof.** Read the Vending Restocked note with the player in the facilities office: Keith and Nisha at the snack machine, one queuing; Keith at the drinks machine; the use sounds heard in the facilities office and not from the IT room; Keith's screen locks each time. Screenshots: the queue at the machine, Keith's locked screen.
- **Regressions.** The standard node set; the standard live set; the README's drink and chat rows re-run with every door open (Grace keeps the kitchen cooler; the facilities office is private).
- **Size.** About 4 lines of shared data; 0 engine lines; perf tool about 140; scenario about 120.
- **Sync.** 3 workstation booleans for `keith_pc`, 3 `triggeredEvents` keys. The showcase then has at most six owned workstations, under OLMP's cap of 8.

### SIMS-5: the leftover pizza, a magnet from the world, and an open screen (m06)

- **Purpose.** m06's beat: a magnet seen rather than announced, from an in-world source, drawing a desk NPC away and opening a screen-habit window, with the servings kept across a reload.
- **Step 1, reproduce.** On the build as it stands, add `leftover_pizza` (3.3) and `leftover_pizza_servings: 2`, run the validator (it warns that the magnet "is not a droppable item the player holds", validate_npc_needs.rb:272), and run the live proof below. Two outcomes: the engine path works and the warning is the only fault (expected, since `_noteMagnets` reads room objects at load and `_shownMagnets` shows any magnet lying in a room), or a step fails and the fix is sized then, in `_noteMagnets` (731) or `onItemDropped` (705).
- **Behaviour.** The pizza lies on the lounge table, seen by Rosa and Grace, who have no hunger. The player picks it up (it stops showing; everyone forgets it), carries it through the office and IT and drops it in the facilities office. Nisha and Keith, if their hunger is inside the tempt band (above 40, at most 70), see it and come; each takes one serving; the second serving ends it. Nisha's PC stays open while she is away (`lockChance: 0`); Keith's locks. Dropped in the office instead, it draws whoever there has hunger (Tom, Sanjay, Amara).
- **Validator.** `check_magnets` (260): a magnet that is a room object with `takeable: true` and `droppable: true` is accepted with no warning, and an info line names the room it starts in and the NPCs who can see it there and have the need it satisfies (none for the lounge, which tells the author it waits for the player); a room magnet the player cannot take keeps the warning. About 20 lines.
- **Schema.** None (the fields exist).
- **Node tests.** `test/js/npc-magnet.test.mjs`: a magnet registered from a room object at room load is seen in its room; picked up, it is forgotten; dropped in another room, it is learnt again by sight there and not before; servings restored from the global after a simulated reload. The validator section of `test/js/npc-magnet.test.mjs` (from line 300): the takeable room magnet gives no warning and the info line; a fixed one warns. `test/js/inventory-menu.test.mjs`: the sims droppable list gains `leftover_pizza`.
- **Objectives.** `see_pizza_spotted` (`npc_saw_magnet:nisha`, condition `data.magnetId === 'leftover_pizza' && data.roomId === 'facilities_office'`), `see_pizza_eaten` (`magnet_serving:leftover_pizza`), `see_nisha_screen_open` (`workstation_owner_left:nisha_pc`, condition `data.screenLocked === false`; it ticks on her first leave, so a tea or print trip may tick it first), `use_nishas_screen` (`workstation_accessed:nisha_pc`: the player uses her open screen while she is away).
- **Spoken lines.** A `pizza` pool on Nisha and Keith (3 lines each), heard while they eat.
- **Live proof.** Pick the pizza up in the lounge, carry it to the facilities office and drop it there; sample positions and states every 250 ms: both see it, both eat one serving, the servings global reads 1 then 0 and the box is removed; Nisha's screen open while she eats; sit at her desk and use it. A second run: drop it, let one serving go, reload; the box is in the facilities office with one serving, and the next hungry NPC who sees it takes the last. Screenshots: the box in the lounge, both NPCs at the box, Nisha's open screen with its breathing indicator, after the reload.
- **Regressions.** The standard node set; the standard live set; the README's cake rows (the cake shares the magnet code).
- **Size.** About 20 validator lines; engine 0 unless step 1 fails; scenario about 40.
- **Sync.** `leftover_pizza_servings` (one integer, changes twice), one `objects_added` entry when dropped (deduplicated by id) and the lounge's removal of it, both existing room-state records; 4 `triggeredEvents` keys. Nothing grows with play time; a reload restores where it lies and the servings left.

### Backlog SIMS-6: arrive and leave on the game clock (about 300 lines)

Built only if m05's design, another mission, or the user asks for it. It is not in OLMP's engine list, so a mission that adopts it adds a sync row to OLMP section 7 first (below).

- **Behaviour.** NPC `schedule: { "arrive": "HH:MM", "leave": "HH:MM", "arriveFrom": { "room", "x", "y" }, "leaveVia": { "room", "x", "y" } }` (either time optional). Before `arrive` (game time) the NPC is hidden; while hidden it is registered but its needs do not decay. At `arrive`, its levels reset to their initials and `lastSatisfiedAt` to now (the code in `register`, npc-needs.js:461-466), it appears at `arriveFrom` if that room and its post's room are loaded and walks home, otherwise it is at its post when its room loads. At `leave`, once it is not in a conversation, it ends its job cleanly, says a line from its `leaving` pool, walks to `leaveVia` (or its room's nearest door), the workstation layer records a leave for the day with an unbounded expected absence (so `lockIfAwayOverSeconds` habits lock and `lockChance` rolls), a left-behind roll runs, and it is hidden. Schedule walks call `moveTo` with no `avoidRooms`, so a leashed NPC can cross rooms its needs may not use. An anchor jump past several leave times sends the leavers off one at a time, 8 s apart, in time order.
- **Reload.** The state is reconciled from the saved game clock, `npcVisibility` and the saved workstation globals, never re-run: an NPC whose leave time has passed is hidden with its saved lock globals; no `leaving` line, `npc_left_for_day` event or left-behind roll fires again (only the last is server-protected, by the drop dedup in `game.rb`).
- **Engine.** New `systems/npc-schedule.js` (about 150): `installNpcSchedule`, a 1 s check against `window.gameClock` (`gameSecondsAt` game-clock.js:99), `setNPCVisible` for hide and show. `npc-needs.js` (about 60): `arriveForDay`, `leaveForDay`, the decay skip in `_tickNpc`, events `npc_arrived_for_day:<id>`, `npc_left_for_day:<id>`. `workstation-state.js` (about 25): `onLeft(npcId, { forDay: true })` (541) and `resetGlobals` (497) keep a gone owner away after a reload. Server: `filtered_scenario_for_bootstrap`'s `hasPresentNpc` (`game.rb:1323`) skips NPCs with a `schedule`, so a motion-sensor room's door-spill light does not treat a scheduled room as occupied. The new module goes in each JS test harness copy list.
- **Schema and validator.** NPC `schedule`; times parse and arrive is before leave; `gameClock` present; `arriveFrom` and `leaveVia` are floor tiles; NPC has `needsHome` and no patrol; a warning on an NPC with tasks, `taskOnKO` or a required conversation; a warning when `arriveFrom` is in a room that does not load with the post (E4).
- **Scenario.** `"gameClock": { "start": "Tue 08:30", "rate": 20, "anchors": [ { "condition": "globalVars.clock_home_time === true", "time": "17:40" } ] }`; a street door on the office's south wall (decor, stand-in 6.4) with `arriveFrom` and `leaveVia` at the floor tile in front of it, (1,8); leave times 17:00 to 17:30 for the day staff, so the anchor at 17:40 is after every leave and one pull of the `office_clock` lever (wall_clock1, confirm "Wind the clock on to home time?", sets `clock_home_time`) sends everyone; Andrés arrives 17:45. At rate 20, 17:00 is 25:30 of play, after every README proof window. Tasks `see_leave` (`npc_left_for_day:*`), `see_night_desk` (`npc_arrived_for_day:andres`), `see_left_open_overnight` (`workstation_owner_left:*` with `data.forDay && data.screenLocked === false`).
- **Node tests.** `test/js/npc-schedule.test.mjs` (new): fake clock; hidden before, with no decay; arrival with initial levels after 20 hidden minutes; leave during a use; leave held by a chat; lock decision per habit; left-behind at leave; anchor jump with three leavers; a leashed NPC's leave walk crosses a forbidden room; reload before, during and after the day, asserting the saved lock globals and `npcVisibility` are unchanged and no leave side effect re-fires. `test/js/game-clock-rate.test.mjs` unchanged.
- **Live proof.** Pull the clock lever with all rooms open; screenshot the office every 10 s until it is empty; log the order and each lock decision; Andrés sits at the night desk; reload at 17:50 and check hidden staff, Andrés present, globals unchanged.
- **Regressions.** The standard node set; m05's walkthrough smoke run (it has a `gameClock` and no schedules, scenario.json.erb:609); test_access_sessions (the workstation leave path).
- **Sync.** `npcVisibility`: one boolean per scheduled NPC, sent as a delta on each arrive or leave (at most 10 here); the game clock's elapsed time and reached anchors (existing). The schedule state is derived and never sent. **Request to the missions plan owner:** OLMP section 7 has no row for this; before any mission adopts schedules it needs "Scheduled NPC visibility (`npcVisibility.<id>`), engine-owned, one key each as a delta on arrive and leave, one boolean per scheduled NPC, cap N", with N in the worst-case count.

### Backlog SIMS-7: summon to post (about 95 lines)

OLMP keeps E5 as a design rule and this helper in the backlog; it is built only when a mission's design needs it.

- **Behaviour.** An eventMapping `"needs": { "summon": { "holdSeconds": 20 } }`: the NPC ends what it is doing cleanly (a use cut short with no restore, a carried item dropped as an abort does, out of any queue, chat or call), walks home without yielding, emits `npc_at_post:<id>` `{ summoned: true }` on arrival, and picks no need for `holdSeconds` or until `"needs": { "release": true }` or `"resume"`. A player conversation during the hold extends it to the chat's end. Knocked-out, hostile or hidden NPCs ignore it. Not persisted.
- **Engine.** `npc-needs.js`: `control` (949) gains `summon` and `release`; `_tickNpc` skips `_select` while held; the walk reuses `_abortJob` (3700), `_leaveQueue`, `_endChat`, `_hangUp` and `_goHome` (3771, `yieldToPlayer: false`); `getState` (4542) shows `summoned`; `_pressing` (4515) hides the bubble while held.
- **Schema and validator.** eventMapping `needs` object form gains `summon: { holdSeconds: 1-600 }` and `release: true`; `check_npc`: a summon on an NPC with no `needs`, no `needsHome` or a patrol is an error.
- **Scenario.** `facilities_buzzer` (phone3 stand-in, 6.4) on Nisha's desk emits `facilities_buzz`; Nisha's mapping summons her with a voiced `bark`; task `see_summoned` (`npc_at_post:nisha` with `data.summoned`). The player presses it while she is at the IT boiler or copier.
- **Node tests.** `test/js/npc-needs-summon.test.mjs` (new): from a use, a carry, a queue, a chat pair, a call; already at post; KO ignored; hold length; release; player chat extends; and `control()`'s existing `suspend` and `resume` unchanged (no scenario uses the string form, so the node test is the regression).
- **Live proof.** Force Nisha's caffeine so she is at the IT boiler, press the buzzer: back at her desk, held 20 s with caffeine urgent and the bubble hidden, then off again.
- **Regressions.** The standard node set; the standard live set.
- **Sync.** Writes nothing; an author's `onceOnly` on the mapping is one `triggeredEvents` key.

### Backlog SIMS-8: consumables and refills (about 170 lines)

Built only if a mission or the user asks; no OLMP mission does.

- **Behaviour.** `affordance.stock: { max, perUse, lowAt }` on a source; each completed use takes `perUse`; at 0 the source is empty and walkers and queuers turn back with reason `empty` (grumble topic `grumble_empty`); parked needs wake on refill. An NPC with `restocks: [ids]` gets a refill visit (`enqueueVisit` kind `restock`, npc-needs.js:2371) when a listed source reaches `lowAt`; the visit restores `max`. Stock is client-only and resets on reload, like need levels.
- **Engine.** `npc-needs.js`: `_useCandidate` (1567) skips empty sources; `_completeJob` (3219) takes stock; `_turnBack` reason `empty`; a watch for `lowAt`. Icon `restock` in npc-action-icons.js (stand-in 6.4).
- **Schema and validator.** `affordance.stock`, NPC `restocks`; restock targets have stock and the restocker's leash reaches them; `grumble_empty` lines exist.
- **Scenario.** Both vending machines get `stock: { max: 6, perUse: 1, lowAt: 1 }`; Keith `restocks: ["facilities_vending", "facilities_drinks"]` (both in his room); task `see_refill`.
- **Node tests.** Empty source turn-back; refill visit; reload resets; sims-day digest unchanged without stock.
- **Live proof.** Force six vending uses, see the turn-back and Keith's refill.
- **Regressions.** The standard node set; the README's vending rows.
- **Sync.** None (client-only stock).

### Cut, and why

- **Traits (OLP slice 6).** Every habit they would bundle is already a per-NPC field (`screenHabit`, `printHabit`, `needsCompany`, `leftBehindChance`), and no mission in OLMP needs them.
- **Routines (OLP slice 9).** Print and deliver, fetch the post and file are covered by reveal slots, carry jobs and the print errand; about 450 lines for no mission's need.
- **Per-NPC sessions (OLP 16b).** The access model's sign-in PCs and unlocked sessions do this.
- **Schedule preemption, stand-ups and fire drills.** No mission asks for gathering or escorting.
- **A reception, a meeting room, a manager's office and a print room.** No free sprite fits a front-desk officer's missing staff side, a manager or a junior pair; the 5x6 print-room map has only nine floor tiles; the two rooms above carry every beat the campaign needs.
- **Work outages and frustration in the showcase.** No campaign mission uses them (1.2).
- **An outdoor or smoking area.** No existing map.

| Slice | Size (engine, validator, schema) | Needed by |
|---|---|---|
| SIMS-1 E1 in test_needs_attack | 0 (scenario about 300, probe about 180) | m02 before its design closes, then every mission without `disableAttacks` |
| SIMS-2 move ids for arrivals | about 50 | every needs scenario; m02 first |
| SIMS-3 IT room and facilities office | 0 (scenario about 400, 2 ink files) | m02, then m04, m07, m08 (protection 2 and the kettle pattern) |
| SIMS-4 E3, vending, Keith | about 4 lines of shared data (perf tool about 140) | E2 before m06; E3 for m05, m08 |
| SIMS-5 leftover pizza | about 20 (engine 0 unless the probe fails) | m06 |
| SIMS-6 arrive and leave (backlog) | about 300 | only if m05 or the user asks |
| SIMS-7 summon to post (backlog) | about 95 | only if a mission asks |
| SIMS-8 refills (backlog) | about 170 | nobody yet |

---

## 6. Rules for every slice

### 6.1 Spoken lines

- Every bark, chatter line, exchange and call is scenario data: single-speaker lines in the NPC's (or the scenario's) `chatter` pools or eventMapping `bark` fields, multi-speaker exchanges in ink knots. Each is voiceable: one line, 40 characters at most, no `{ }`, no printed variables, no speaker prefix. The validator's pool and exchange checks (`check_pool_lines` 676, `check_exchanges` 826) run on every new pool.
- The engine never carries spoken words; its fallbacks are pictures only (`PICTURE_CHATTER`, npc-needs.js:213). New topics in the backlog (`summoned`, `arriving`, `leaving`, `grumble_empty`) get a picture fallback.
- Each slice's report lists its new spoken lines so the voice cost is known before any audio work. Audio is made last, with the user's agreement.
- Every new NPC who speaks has a `voice`.

### 6.2 Server and cheat resistance

- Nothing in these slices guards a secret, key, password or forged item. Levers, magnets, prints and (in the backlog) schedules, summons and stock move NPCs or change client-side choices, which the policy allows as best-effort client behaviour. No printout or note carries an account, address, password or code.
- Every new global (`it_out_*_shown`, `neil_print_gone`, `heard_*`, `leftover_pizza_servings`, the KO globals in test_needs_attack) completes optional tasks only; forging one ticks an optional task.
- Anything the player can take is a declared scenario object (the page, the cup, the pizza, the notebook). A player drop is rebuilt from the server's held copy and refused unless the item is `droppable: true` (`game.rb` 541-554); a KO drop requires that the NPC held the item, records the KO and dedups by id (486-523).
- New NPC and object fields reach the client because `filtered_room_data` (`game.rb:1603`) strips only named keys (`requires`, locked `contents`, author notes, networks, `WITHHELD_NPC_KEYS`), not an allow list.
- All new fields are author content checked by the validator; no end-user or organisation text is involved.

### 6.3 Art, UI and layout

- Reuse existing art only; nothing here plans image generation. Anything new goes in 6.4 with a stand-in.
- UI follows the pixel-art rule (2 px borders or the `ui-themes.css` 9-slice skin, pixel fonts only, no radius) and the UI design language (X closes, no Cancel; the backlog clock lever keeps the existing `confirm_action` pattern; one look per concept; NPC headshots in conversations).
- Props are square to the walls, top-down, one or two angled per room at most.
- Walking "behind" a back wall is the intended effect; never seal it. Cross-room interaction is blocked instead.
- Pixel art is never scaled down; icons and props are used at native size.

### 6.4 Art and sound requests for the user

| Item | Kind | Needed by | Stand-in meanwhile |
|---|---|---|---|
| A vending coin and drop sound | MP3 one-shot (`startSound`) | SIMS-4 | none: the use sound only |
| A plain street door for an office's outside wall | object sprite, sized from the catalogue | SIMS-6 (backlog) | `exit_sign1` on the wall above the tile |
| A desk bell or buzzer | object sprite | SIMS-7 (backlog) | `phone3` named "Facilities Buzzer" |
| A restock icon (`npc-restock`, 16x16, in one sheet with any other icon) | icon | SIMS-8 (backlog) | the `npc-file` icon |

No character art is requested: the three new NPCs and the backlog night officer use the four free sprites, which all have walk, sit, headshot, talk and viseme art.

### 6.5 Sync, all slices together

Needs state, positions, queues, move ids, chats and magnet knowledge live in the browser and are never synced. What the showcase adds to player_state or the server, each sent as a one-key delta when it changes:

| Piece | Count | Changes |
|---|---|---|
| Workstation booleans for `neil_pc`, `nisha_pc`, `keith_pc` | 9 | on each leave and return |
| IT slot globals | 4 | once each |
| `neil_print_gone`, 2 `heard_` booleans | 3 | once each |
| `leftover_pizza_servings` | 1 integer | twice |
| `triggeredEvents` keys for new `onceOnly` mappings | about 16 | once each |
| `objects_added` (the dropped pizza) | 1 | once, deduplicated by id |

test_needs_attack adds, in its own games, up to 4 `npcHostility` entries, 2 KO records, 2 KO globals, 2 `objects_added` and 4 `triggeredEvents` keys. The backlog adds at most 10 `npcVisibility` booleans (SIMS-6) and nothing else. Every count is fixed by the authored content; nothing grows with play time, and a reload restores saved values without replaying a beat.

The showcase is a test floor, so it is already above OLMP's per-mission caps for reveal globals and `onceOnly` mappings (the office and kitchen copiers have seven slots and the existing tasks each use one mapping); each is still one boolean set once. With the three new desks it has at most six owned workstations, under the cap of 8, and two magnets, at the cap of 2.

---

## 7. What to watch for: a guided tour for the README

Times are needs-clock minutes from load (3.5). Levers are in bold. Each row says what to do if the beat does not come by itself.

| Time | Where | Lever | What should happen | Slice |
|---|---|---|---|---|
| 0:00 to 1:00 | office | none | Amara and Tom at the coffee station: one waits, then goes; icons and bubbles over heads; typing bob | built |
| 1:00 | office, then north | **open the north door** | the IT room: Neil seated at his desk, typing; the empty water cooler shows no use icon ever | SIMS-3 |
| 1:20 | IT, then east | **open the facilities door** | Nisha at her desk (and Keith from SIMS-4); the room has its own quiet office tone | SIMS-3, 4 |
| 1:40 | IT | **read the Tea Round note** | within about 10 s Neil and Nisha are both at the boiler and chat; the first time, the tea exchange plays (`hear_tea_round`). Every tea job start logs a `leashed` event; when the office coffee is free at that moment its id is in `skipped`, which ticks `see_kept_to_it` and `see_kept_out` within a few teas | SIMS-3 |
| 2:20 | IT | **read the IT Print Queue note**, then **take the page from the copier tray** before Neil gets up (he waits 20 to 30 s) | Neil walks to the copier, finds nothing, says so (`take_neils_page`) | SIMS-3 |
| 3:00 | IT | **read the Tea Round note again** (its cooldown is 30 s) | the second exchange plays, about the missing page (`hear_page_gone`) | SIMS-3 |
| 3:30 | IT | stand beside Nisha when she comes in | she says nothing while you are close (her pools hush); at about 5:20 to 6:00 she walks in to fetch her own print (`see_print_errand`); this beat has no lever, it comes on its own | SIMS-3 |
| 4:00 | lounge | **pick up the pizza boxes from the table**, carry them through the office and IT, **drop them in the facilities office** | no announcement: Nisha and Keith see them and come; Nisha leaves her screen open, Keith locks his; two servings, then the box is gone. **Sit at Nisha's desk** while she eats (`use_nishas_screen`). Do this before the Vending Restocked note: a fresh snack takes them out of the tempt band for about three minutes | SIMS-5 |
| 5:00 | facilities | **read the Vending Restocked note** | Keith and Nisha at the snack machine, one queuing; Keith at the drinks machine; the sounds only in this room | SIMS-4 |
| any | kitchen | **pick up the mug of coffee, use it from the inventory** | you drink it, with a sound (`drink_a_coffee`) | SIMS-3 |
| any | office | the earlier levers: notes, sockets, spare phone, cake, parcel, mugs | as the README lists | built |
| any | everywhere | the debug overlay and `window.__test.needs.log()` | every beat above has a log line and, where listed, a task tick | built |

Without levers the IT and facilities beats still come, on the times in 3.5. The attack checks are in test_needs_attack's own README, not here.

---

## 8. Open questions (recommended default in bold)

1. The facilities office uses `room_security`, which `core/game.js` describes as a dual-desk security office but which carries no sign or logo. Use it, or `room_ceo` (one large desk, quiet)? **`room_security`: two desks fit Nisha and Keith, and it renders as a plain back office.**
2. Make the IT room and the facilities office private to their own staff (room-level `needsPrivateTo`)? **Yes: it keeps every office NPC off the new boiler, fridge and vending machines, so the README's office beats stay as they are.**
3. Only four sprites are free of player avatars and named characters. Cast three now and keep `hashchain_guard` for the backlog night officer, or commission new characters for more roles? **Cast three; the campaign needs no more people in the showcase.**
4. The six existing NPCs wear starter avatar sprites (`female_office_worker_v2`, `male_office_worker_v2`, `female_blowse_v2`, `male_nerd_v2`, `male_telecom_v2`, `female_scientist_v2`). Recast them later with art of their own? **Keep them: their ids, records and README proofs stay as they are; recasting is a separate art task if wanted.**
5. Nisha's leash as a deny list, so the showcase shows both forms (m02's N1 uses an allow list, which runs through the same rule)? **Yes.**
6. Start the pizza on the lounge table, where nobody with hunger goes? **Yes.**
7. Build the backlog slices (schedules, summon, refills) only when a mission's design or the user asks? **Yes.**
8. If schedules are built: should leave times read the game clock (saved) rather than the needs clock (reset on reload)? **Game clock, so a reload never replays the evening.**
9. If the summon is built: a fixed hold or until released? **20 s by default, extended by a player conversation; a `release` mapping ends it early.**
10. If refills are built: should stock survive a reload? **No: client-only, reset to full like need levels.**
