# Office life: the sims showcase day, audit and build plan

This plan turns `scenarios/test_needs_sims` (the neutral office-life showcase, no security narrative) into a believable small office day in which every built office-life behaviour can be seen, and it specifies the missing behaviours as small build slices. Part 1 is the audit ("What exists"). Part 2 is the plan.

Line numbers drift. Every engine reference gives the function name with the file:line where it starts on branch `build/ol-sims` at fc4b4d8a5. Scenario references are to `scenarios/test_needs_sims/scenario.json.erb` (abbreviated `sims.erb`) at the same commit.

Related documents: `docs/achitechture/OFFICE_LIFE_PLAN.md` (the slices this builds on, abbreviated OLP), `docs/achitechture/NPC_NEEDS_SYSTEM.md` (the author contract, NNS), the campaign plan `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` on branch `plan/office-life-missions` (abbreviated OLMP; its pilot is m06, then m05, m08, m02; its section 9 lists engine gaps E1 to E5).

---

## 1. What exists

### 1.1 Behaviours

States: **shown** = built, shown in test_needs_sims; **not shown** = built, not shown in test_needs_sims; **planned** = planned, not built; **not planned**.

| # | Behaviour | State | Engine evidence | Where it is shown |
|---|---|---|---|---|
| 1 | Needs decay, urgency, bounded selector, needs clock | shown | `NPCNeedsSystem.tick` npc-needs.js:1006, `_tickNpc` 1257, `_decay` 1383, `_select` 1490 | every NPC's `needs`, e.g. Amara sims.erb:481 onward; README "How to watch it" step 1 |
| 2 | Posts and home preference (`needsHome`, object or tile) | shown | `_resolveHome` npc-needs.js:3751, `_goHome` 3771, `_useCandidate` 1567 | `needsHome` sims.erb:496 (amara_pc), 575, 612, 634, 670 (tile home), 859 |
| 3 | Affordance presets by type (`officePresets`) | shown | `presetIdFor` office-presets.js:49, `resolveAffordance` 66; table office-presets.json:4-15; validator `expand_presets` validate_npc_needs.rb:627 | `"officePresets": true` sims.erb:10; fridge, microwave, cooler, sofa carry no affordance (sims.erb:693, 702, 720, 828) |
| 4 | Room leash (`needsRooms`, `needsAvoidRooms`) | not shown (sims uses only the private-room form) | `_roomForbidden` npc-needs.js:1197, `_avoidRooms` 1209; validator `leash_rule` 1086, `leash_reach` 1116 | test_needs_leash (Ravi, four rooms in a loop) |
| 5 | Private rooms and objects (`needsPrivateTo`, `affordance.private`, `owners`) | shown | `_owners` npc-needs.js:1218, `_permitted` 1229, `_notePrivate` 1243; validator `check_private` 1048 | lounge `needsPrivateTo` sims.erb:815; private PCs sims.erb:156 |
| 6 | Carry jobs for tagged items (`interests`, `needsTag`, `accepts`) | shown | `_carryCandidate` npc-needs.js:2799; world `pickUp` 5097, `consumeHeld` 5118 | parcel and mugs sims.erb:56, 65; Amara's interests 504; Grace's 618; washing-up tray 733 |
| 7 | Reveal slots: printouts placed and filed | shown | `_revealOutput` npc-needs.js:3512, `_reserve` 3612; world `placeHeld` 5149, `stowSlot` 5178; validator `check_slots` 1381 | copier slots sims.erb:361-436; `onUse.revealOutput` 582, 637 |
| 8 | Action icons over heads (16x16 `npc-*` set) | shown | `pickIconEntry` npc-action-icons.js:135, `update` 545; icons `assets/icons/npc-*.png` | all NPCs; one scenario override `actionIcons` sims.erb:24-26 |
| 9 | Pressing-need thought bubbles, `noticed`, `blocked` | shown | `pressingBubble` npc-action-icons.js:202, `_renderBubble` 523; `_pressing` npc-needs.js:4515, `_blockedNeed` 4528 | `"showPressingNeeds": true` sims.erb:7 |
| 10 | Item in hand | shown | `heldPlacement` npc-office-visuals.js:174, `followHeld` 277 | Grace with mugs, Amara with parcel and printouts |
| 11 | Seating: sit at desks, fetch and tuck in chairs | shown | `needsStop` seating.js:1738, `updateNeedsSeat` 1898, `tuckIn` 2006, `startFetch` 2018 | desk staff at their PCs (all office NPCs) |
| 12 | Typing bob | shown | `typingBob` seating.js:1779, `isTyping` 1251 | any seated `work` use (Tom, Sanjay, Amara) |
| 13 | Idle chair roll, rare swivel, look round at speech | shown | `fidgetOffset` seating.js:1169, `fidgetStep` 1192, `swivelFacing` 1268, `listenTarget` 1282, `swivelEnabled` 1293; validator `check_swivel` 576 | default on; task `see_look_round` (objectives list in sims.erb) |
| 14 | Own-desk use is not a leave; caught at the desk (`npc_caught_at_post`) | shown | `_atOwnPost` npc-needs.js:2949, `_checkCaught` 3066, `_expectedAwayMs` 3026 | task `see_caught` |
| 15 | Workstation lock decisions (`workstation`, `lockChance`, `locksScreenOnLeave`) | shown | `decideLocked` workstation-state.js:147, `onLeft` 541, `onReturned` 573 | tom_pc `lockChance` sims.erb:166; amara_pc and sanjay_pc `workstation` |
| 16 | Lock-screen habits, idle auto-lock, lock cues (chimes, flash, glyph) | shown | `habitOf` workstation-state.js:125, `autoLockMs` 183, `_checkAutoLock` 466; `lockCuePlan` npc-office-visuals.js:101, `onScreenChanged` 387, `playChime` 545; validator `check_lock_habits` 520 | `screenHabit` sims.erb:497, 635; `autoLockSeconds` 219; tasks `hear_screen_lock`, `see_auto_lock`, `use_open_screen` |
| 17 | Workstation indicators (open breathing dot, locked steady dot) | shown | lighting.js header 40-45, `INDICATOR_LOCKED`/`INDICATOR_OPEN` 115-116 | `"lighting"` sims.erb:12; task `spot_open_screen` |
| 18 | Left-behind items | shown | `_leaveItemsBehind` npc-needs.js:2983, `_collectLeftItems` 3004; world `leftBehindItems` 5225; validator `check_left_behind` 1429 | tom_badge sims.erb:175-184; task `see_left_behind` |
| 19 | Social chat at capacity-2 objects, with compatibility (`needsCompany`) | shown | `_maybePair` npc-needs.js:3863, `_tickChats` 3887, `_compatible` 3844, `_avoids` 3839; validator `check_social` 895 | cooler preset `chatter: cooler`; Marek `avoids: ["*"]` sims.erb:672; tasks `see_chat`, `see_outcast` |
| 20 | Queues at shared machines, queue chatter | shown | `_queueCandidate` npc-needs.js:4387, `_advanceQueued` 4408, `_tickQueueChats` 4466; validator `check_queues` 729 | office coffee `queue` sims.erb:243; kitchen coffee 716; Sanjay `maxQueue` 647; tasks `see_queue`, `see_queue_chat` |
| 21 | Avoidance at a distance, balking, parked needs | shown | `_avoidedAt` npc-needs.js:1764, `_balks` 1787, `_park` 1822, `_turnBack` 1897, `_wakeParked` 1851 | Sanjay `avoids: ["marek"]`, `needsDeferMin` sims.erb:645-646; task `see_turned_back` |
| 22 | Chatter pools (scenario and NPC), voiced through TTS | shown | `chatterPool` npc-needs.js:242, `_pickBark` 2641; npc-needs-chatter.js `say` 237; validator `check_pool_lines` 676 | scenario `chatter` sims.erb:13-22; NPC pools |
| 23 | Scripted exchanges in ink, heard once | shown | `_findExchange` npc-needs.js:2685, `_startExchange` 2711, `_finishExchange` 2751; `exchangeLinesFromStory` npc-needs-chatter.js:57; validator `check_exchanges` 826 | `exchanges` sims.erb:490, 630; tasks `hear_rota_exchange`, `hear_parcel_exchange` |
| 24 | Print and forget, the print-job lever | shown | `_tickPrints` npc-needs.js:3672, `_dueErrand` 3644, `_errandCandidate` 3656, `_recyclable` 3597; validator `check_print_habits` 346 | Tom `printHabit` sims.erb:583; tasks `see_uncollected`, `send_print_job` |
| 25 | Coffee off and printer power (`offWhen` switches) | shown | `_isOff` npc-needs.js:687, `onGlobalChanged` 662, `_deadStation` 2125, `_printBlocked` 3566; validator `check_off_when` 440 | `offWhen` sims.erb:244, 324, 743; sockets 248, 329, 748; tasks `see_coffee_off`, `keep_tom_away`, `see_printer_grumble` |
| 26 | Magnets (the cake): sight, temptation, servings, "Missed it." | shown | `_tickMagnets` npc-needs.js:915, `_tempting` 802, `_sight` 813, `_takeServing` 898; validator `check_magnets` 260 | cake sims.erb:72-83; tasks `see_cake_eaten`, `see_missed_it` |
| 27 | Word of mouth about a magnet (announce) | shown | `_tickNews` npc-needs.js:838, `_newsHearers` 865, `_announce` 882, `_wakeParkedFor` 1868; validator `check_magnet_news` 305 | `announce: "news_cake"` sims.erb:81; pool `news_cake` 21; task `hear_cake_news` |
| 28 | A magnet without an announce (seen only) | not shown | same code with no `announce` | nowhere; OLMP's m06 pilot needs exactly this |
| 29 | Magnet lands on a table | shown | world `settleMagnet` npc-needs.js:5303; test/js/table-drop.test.mjs | kitchen tables (room_break map) when the cake is dropped there |
| 30 | Desk-phone calls, colleague answers, rings out | shown | `onPhoneRing` npc-needs.js:4015, `_claimAnswerer` 4097, `_tickCalls` 4238, `_ringOut` 4137; `onPhoneRinging` npc-office-visuals.js:458; validator `check_phones` 146 | tom_phone sims.erb:187-197, spare_phone 199-210; Amara `answersPhones` 491; tasks `hear_tom_call`, `see_amara_answer`, `see_call_missed` |
| 31 | Room tone (beds, typing, one-shots, ducking) | shown | `profileForRoom` office-room-tone.js:56, `typingLevel` 57, `installOfficeRoomTone` 179; data room-tones.json; validator `check_room_tone` 84 | `"roomTone": true` sims.erb:11; task `hear_office` |
| 32 | Use sounds heard only from the player's room | shown | `useVolume` npc-office-visuals.js:135, `ownRoomHearing` 113 | tasks `hear_drink`, `hear_snack` |
| 33 | Conversation freeze; yield to the player | shown | `_talking` npc-needs.js:3979; behaviour chat-freeze guard and yield | README steps 6 and 7 |
| 34 | Debug overlay | shown | `barLayout` npc-needs-debug.js:43 | `"needsDebugOverlay": true` sims.erb:8 |
| 35 | Consumables for the player (pick up, always consumed from the inventory) | not shown | `consumableKind` consumables.js:67, `consumableHealAmount` 151 | test and campaign scenarios; sims has no takeable cup or snack |
| 36 | Work judged against resources, frustration, outage kick, check visits | not shown | npc-work.js (`useVerdict`), world `useVerdict` npc-needs.js:4992, `_countFailure` 2226, `_tickKick` 2333, `enqueueVisit` 2371; npc-reports.js | test_access_work; lab_physical_pentest |
| 37 | Workarounds (`writes_down`, `prop_door`, `emit`, `borrow_session`, `share_login`) | not shown | npc-workarounds.js `due` 119, `visitDone` 187; workstation-state.js `onBorrowedSession` 308 | test_access_work (Hall C, Hall D); lab_physical_pentest (wedged door) |
| 38 | `social_media` need, the phone `self` job, distracted | not shown | `_socialCandidate` npc-needs.js:2148, `_startSelfJob` 2905, `isDistracted` 4537 | test_access_social |
| 39 | Friendface feeds (posts, reactions, replies) | not shown | social-feed.js; server `/feed_post` | test_access_social |
| 40 | Awareness levels and habits (`locksScreen`, `writesDown`, `holdsDoors`) | not shown | workstation-state.js `habitOf` 125; door-gates.js:134 (`noHold`) | test_access_habits; test_gate_tailgate |
| 41 | USB habit and policy | not shown | `usbRefusedBy` npc-needs.js:258, `_usbAttempt` 3416 | lab_physical_pentest; test_access_work (U1 to U3) |
| 42 | Unlocked sessions and sign-in per account | not shown | workstation-state.js `guestOf` 286, `onSatAt` 337, `onSignedOut` 352 | test_access_sessions; test_access_signin |
| 43 | Traits (OLP slice 6) | planned | none | none |
| 44 | Routines: multi-step tasks (OLP slice 9, Part B) | planned | none (Part A slots are built, row 7) | none |
| 45 | Schedules, arrive and leave, preemption (OLP slice 12) | planned | none; the game clock exists (`game-clock.js`, `gameClock` with `rate` and `anchors`) | none |
| 46 | Consumables and refills for NPC sources (OLP slice 13) | planned | none | none |
| 47 | Per-NPC sessions at a locked screen (OLP 16b) | planned (superseded) | sign-in and unlocked sessions from the access model (rows 42) do this job | test_access_sessions |
| 48 | E1: attacked or knocked-out needs NPC, live | not shown, unproved live | registration skips `ko`/`hostile`/`hidden` (npc-needs.js:875; `isAvailable` 1086; world `npcStatus` 4800); `onKnockedOut` workstation-state.js:566; a unit test covers drop and walk home | nowhere live; `tools/playtest/needs-baseline-capture.js` knocks Tom out at 20 s for a log capture only |
| 49 | E2: vending preset | planned | sprites `vending_machine1.png`, `drinks_vending1.png` exist; no entry in office-presets.json | none |
| 50 | E3: more than 6 needs NPCs | unmeasured | tick-cost hygiene (OLP 2.0; test/js/npc-needs-tick-cost.test.mjs) | 6 NPCs only; baseline game 3537 ran at about 23 fps headless with the physics throttle |
| 51 | E4: lazy room loading | design rule (not an engine item) | OLP 1.2 constraint 1; `_onRoomsLoaded` npc-needs.js:1119 | the README's "open the doors" step |
| 52 | E5: an NPC at its post for a beat | planned | only the three protections in OLMP section 2 (no needs, needs confined to the post room, `patrolOverride.targetTile` on an earlier event) | none |
| 53 | Simulating unloaded rooms; persisting need levels | not planned | OLP 4.1 | none |

Counts: shown 32 (rows 1-3, 5-27, 29-34); not shown 10 (rows 4, 28, 35-42); unproved live 1 (row 48); planned 7 (rows 43-47, 49, 52; row 47 is superseded); unmeasured 1 (row 50); design rule 1 (row 51); not planned 1 (row 53).

### 1.2 Built behaviours that the sims day does not show, and why

- **Room leash, allow and deny lists (row 4).** Shown in test_needs_leash. The new rooms in section 2 give two NPCs a `needsRooms` list, so the sims day shows it too.
- **A magnet with no announce (row 28).** The m06 pilot uses this form. Section 2 adds a second magnet with no announce.
- **Player consumables (row 35).** Cheap to show: a takeable cup on the kitchen counter. Added in section 2.
- **Work needs, frustration, outages, check visits (row 36).** Neutral office behaviour (a printer or network outage that annoys people), but it needs top-level `roles` and `resources` and the server's frustration records. Section 2 brings in one outage with no workaround (the print-room network switch), so the frustration bar and the grumble can be seen. The security workarounds stay in the access test floors.
- **Workarounds (row 37).** Writing a password down, sharing a login and borrowing a session are security beats. The sims day stays neutral (standing direction for this showcase), so they stay in test_access_work and lab_physical_pentest. Only the neutral `emit` form could appear, and it shows nothing on its own, so it is left out.
- **`social_media` and the phone `self` job (row 38).** Neutral and visible (a phone icon, an NPC who stays at the desk). Section 2 gives the junior designer this need with `"phone": true`. No Friendface feed (row 39): a feed needs a browsable site object and server feed records, and no m01 to m10 mission has one (OLMP section 2).
- **Awareness habits, USB, sessions, sign-in (rows 40-42).** Security material. They stay in their test floors.

### 1.3 The Grace overlay in the baseline run (game 3537)

`base-05-office-later2-3537.png` shows Grace's overlay panel ("grace: using 12s lounge_sofa") and her `Z` icon over the office's west desks, with Grace's own sprite under them. The decision log in `base-info-3537.json` has `482 urgent rest`, `482 job_start rest lounge_sofa`, `482 windup` and `491 using rest lounge_sofa`. Nine ticks is 2.25 s of the needs clock, and the sofa's approach cell (540,244) is about 15 tiles from Grace's desk, so she cannot have walked there.

**Finding: a real fault.** The panel and icon are drawn at Grace's sprite (no misreading). The needs state entered `using` for an object in another room while the NPC stood at her own desk. It did not happen again in two targeted probes on :3093:

- game 3560: Grace from the kitchen, `rest` forced to 5; she walked the whole way and entered `using` at (545,215), 31 px from the cell;
- game 3572: Grace idle and seated at her post, `rest` forced to 5; job start at tick 257, the behaviour layer got a 71-step path, and `using` came at tick 319 at (537,213).

Probe script and samples: the session scratchpad `officelife-sims/probe-grace.mjs`, `probe-grace2.mjs`, `probe-grace-3560.json`, `probe-grace2-3572.json`.

Cause, not yet proved: `_advanceJob` (npc-needs.js:3119) treats any `npc_arrived:<id>` with owner `needs` as arrival, without checking where the NPC is. The behaviour layer fires that event when its current path runs out (`npc-behavior.js` path following, the "Reached end of path" branch, about 1240-1245, calling `_triggerGoToStayArrival` 3064) with no distance check against `_goToStayDest`. A path that ends early (a stale or short EasyStar answer arriving after the new `goToAndStay`, or a path cut at a door) would produce exactly this log. The same probe also caught a smaller oddity: on the way home after the mugs, Grace logged `return_resumed` at (116,156) every 12 ticks for 70 ticks before `returned_post`. Slice SIMS-1 adds the arrival check and a log entry that will name the cause the next time it happens.

---
## 2. The showcase: a small office day

### 2.1 What stays fixed

- The three rooms (`office`, `kitchen`, `lounge`), the six NPCs (`amara`, `tom`, `grace`, `sanjay`, `rosa`, `marek`), every object id, every global and every task id stay as they are. Their needs numbers, seed (`npcNeedsSeed: "test_needs_sims"`) and positions stay too, so the README's live-proof tables and the node fixture (`test/js/fixtures/needs-sims-world.mjs`, `GOLDEN_SIMS_DAY`) hold. Nothing is renamed.
- Files that read this scenario and must keep passing: `test/js/npc-left-behind.test.mjs` (validator run, Tom's badge), `test/js/npc-needs.test.mjs`, `test/js/npc-needs-tick-cost.test.mjs`, `test/js/npc-desk-phone.test.mjs`, `test/js/table-drop.test.mjs` (the kitchen tables), `test/unit/format_8a_corpus_test.rb` and `test/js/format-8a-reader-parity.test.mjs` (both compare frozen renders in `test/fixtures/format_8a/`, so a scenario edit does not break them), `tools/playtest/needs-baseline-capture.js` (its `test_needs_sims` visit list stays valid; the new NPCs add lines to a fresh capture, which is expected and recorded). `test_needs_leash` names `test_needs_sims` only in a comment. Hacktivity's tests load `test_objectives` and `test_simple_success`, not this scenario.
- The scenario stays ERB-free (the format corpus test relies on a deterministic parse).
- The office keeps its three needs-free levers (the spare phone, the sockets, the notes). New levers are added beside them.

### 2.2 Rooms

All maps exist in `public/break_escape/assets/rooms/` and are registered in `core/game.js`. `python3 scripts/check_door_alignment.py` passes for this layout (checked on a scratch render of the current scenario with these connections added): every pair OK.

```
                    meeting_room (room_meeting, 10x10) ── east ── manager_office (room_ceo, 10x10)
                         │ south door at office (48,32)
 kitchen (room_break) ── office (room_office, start) ── lounge (room_meeting)
                         │ south door at office (48,288)
 print_room (small_room_1x1gu, 5x6) ── west of ── reception (room_reception, 10x10)
```

| Room id | Map | Size | Connections | Door pixels (checked) | Role |
|---|---|---|---|---|---|
| `office` (start) | room_office | 10x10 | west kitchen, east lounge, **north meeting_room, south reception** | north (48,32), south (48,288), west (16,80), east (304,80) | open-plan floor, unchanged inside |
| `kitchen` | room_break | 10x10 | east office | (-16,80) | kitchen, unchanged plus one cup |
| `lounge` | room_meeting | 10x10 | west office | (336,80) | Rosa's and Grace's private lounge, unchanged |
| `meeting_room` (new) | room_meeting | 10x10 | south office, east manager_office | (48,32) to the office; (304,-176) to the manager | the project room: two hot-desk laptops at the long table, used for the junior pair and the leftover-lunch magnet |
| `manager_office` (new) | room_ceo | 10x10 | west meeting_room | (336,-176) | Howard's private office |
| `reception` (new) | room_reception | 10x10 | north office, west print_room | (48,288) | front desk, visitors' entrance, later the night desk |
| `print_room` (new) | small_room_1x1gu | 5x6 | east reception | (16,336) and (-16,336) | print and copy corner: copier, shredder, filing, the network switch |

The meeting room reuses the lounge's map. That is the generic meeting room with a long table, and it suits a project room; a different map is open question 1. There is no outdoor or smoking-area map among the existing rooms, so that room is not planned.

The new north and south doors sit at the office's west end (x 48, tiles 1 to 2). Nothing the scenario declares stands there: Grace's desk is at tile (1,5), the abandoned mugs at (4,7), Marek's spot at (3,8), the copier at (4.4,2). The implementer checks the doorways against the office map's own furniture in a screenshot before writing anything else, and moves only new objects if anything clashes.

**How the player meets each room, and when its life starts.** Only loaded rooms exist (OLP 1.2 constraint 1; `_onRoomsLoaded` npc-needs.js:1119). Every room loads when the player opens its door, and stays loaded.

| Room | First reachable | Life starts |
|---|---|---|
| office | at load | at load: Amara, Tom, Grace, Sanjay, Marek |
| kitchen, lounge | one door from the start | when opened; Rosa registers with the lounge |
| reception | one door (south) | when opened; Hannah registers. Hannah's thirst source (the reception cooler) is in her own room, so she has a beat at once |
| meeting_room | one door (north) | when opened; Zara and Ollie register. Their coffee is in the office (always loaded) |
| print_room | two doors (south, then west) | when opened; Kirsty registers. Ollie's network switch and print slots live here, so his outage beat waits for it |
| manager_office | two doors (north, then east) | when opened; Howard registers. His kettle is private to him and in his own room |

The README tour (section 6) opens every door in the first two and a half minutes, as the current README does for the kitchen and lounge.

### 2.3 Objects added

Positions are tile starting points, square to the walls (props orthogonal; at most one or two angled per room). Each is checked in a screenshot against the map's furniture and moved if it overlaps. Every object id below is new.

**reception:** `reception_pc` (pc, on the counter, `workstation: true`, owner Hannah, `screenOwner: "hannah"`); `reception_cooler` (water_cooler1, cooler preset, capacity 2); `front_desk_buzzer` (phone3 as a stand-in for a desk bell, the E5 lever, slice SIMS-4); `leftover_lunch` (pizza_boxes1, takeable, droppable, a magnet with **no** announce: `satisfies: ["hunger","social"]`, `magnet: { tempt: 30, servings: 2, perPerson: 1 }`; it lies on the counter as a takeable item, the player picks it up and drops it where it should draw people, and the validator's "magnet starts in a room" warning is recorded as justified in the README); `reception_coat_stand` (coat_stand1, decor). Later slices add `reception_vending` (SIMS-6) and `night_desk_spot` (SIMS-5, a tile home for Joe).

**meeting_room:** `zara_laptop`, `ollie_laptop` (laptop, desk_pc preset, `workstation: true`, owners Zara and Ollie); `project_board` (whiteboard decor, readable, neutral sprint notes).

**print_room:** `print_copier` (photocopier1, copier preset, `offWhen: "print_room_switch_off"`); `print_out_a`, `print_out_b` (notes1 slots, `outputOf: "print_copier"`, `readDisplay: "gameDisplay"`, non-takeable, neutral text); `print_shredder` (shredder1, shredder preset, accepts `to_shred`); `print_filing` (filing_cabinet, `officeType: "filing"`, Kirsty's work); `print_switch` (wall_socket1, the network switch lever with the 18a confirm pattern, setting `print_room_switch_off`).

**manager_office:** `howard_pc` (pc, `workstation: true`, owner Howard); `howard_kettle` (kettle1, kettle preset; the room is `needsPrivateTo: ["howard"]`); `manager_coat_stand` (coat_stand1).

**kitchen:** `kitchen_cup` (coffee_cups1, takeable, a player consumable; row 35).

**office:** nothing in SIMS-3. SIMS-5 adds `office_clock` (wall_clock1, the "wind on to home time" lever).

**Player items:** `old_rota` (notes1, droppable, `needsTag: "to_shred"`): drop it anywhere Kirsty notices and she takes it to the shredder.

### 2.4 Cast

The six sprites with sit frames that test_needs_sims does not use, checked by their `_headshot.png`:

| Sprite key | What the headshot shows | Talk art present |
|---|---|---|
| `female_telecom_v2` | white woman, brown hair to the shoulders, orange hi-vis waistcoat over a work shirt | headshot and walk only: no `_talk.png`, no visemes |
| `female_security_guard_v2` | East Asian woman, black hair in a bun, white uniform shirt with tie and badge | headshot and walk only |
| `female_hacker_hood_down_v2` | young woman with brown skin and dark hair tied up, yellow hoodie | `_talk.png`, `_talk_init.png`, visemes |
| `male_security_guard_v2` | man with tan skin and dark hair, peaked cap, white uniform shirt and tie | headshot and walk only |
| `male_spy_v2` | man in a brown fedora, dark glasses and a trench coat over shirt and tie | headshot and walk only |
| `male_hacker_hood_down_v2` | young white man with black hair, dark hoodie over a grey top | `_talk.png`, `_talk_init.png`, visemes |

All six have 24 `sit_*` frames. Four are used by other scenarios as generic extras (security guards, the spy look), which is allowed for unnamed generic roles; none is a named recurring character's own key. Named characters from other missions keep their own keys and are not reused.

The cast becomes twelve NPC records: the six current staff and six new ones. **At most eleven are present at once** (Joe arrives as the others leave), and before SIMS-5 lands only the five daytime newcomers are added (eleven present).

| Id | Name, role, look | Sprite | Post | Needs (decay/min, urgent at, start) and other fields | What they show |
|---|---|---|---|---|---|
| `hannah` | Hannah Cho, front-desk officer, Korean-British, mid 40s | female_security_guard_v2 | `reception_pc` | thirst 6/35/80 (reception cooler), caffeine 8/35/70 (office or kitchen coffee), work 6/50/90; `needsRooms: ["reception","office","kitchen"]`; `screenHabit: { lockIfAwayOverSeconds: 10 }`; chatter `reception`, `summoned` | the room leash allow list (row 4), the E5 summon (SIMS-4), a careful screen habit |
| `zara` | Zara Haddad, junior designer, Lebanese-British, early 20s | female_hacker_hood_down_v2 | `zara_laptop` | social_media 12/40/70 (phone, the `self` job), caffeine 15/40/75, hunger 6/40/70; `needsCompany: { groups: ["juniors"] }`; exchange with Ollie | the phone `self` job (row 38), the leftover-lunch magnet, a compatible pair |
| `ollie` | Ollie Brennan, developer, Irish, late 20s | male_hacker_hood_down_v2 | `ollie_laptop` | work 12/50/70 judged against `dev_network`, caffeine 20/40/60, hunger 6/40/72; `screenHabit: { lockChance: 0 }`; `printHabit: { fetchAfterSeconds: [40,150], forgetChance: 0.6 }`; `onUse.ollie_laptop.revealOutput: "print_copier"`; `needsCompany: { groups: ["juniors"] }` | work outage and frustration (row 36), print and forget in the print room, stays late (night crew) |
| `kirsty` | Kirsty Moffat, facilities engineer, Scottish, 30s | female_telecom_v2 | tile spot in `print_room` | work 5/50/85 at `print_filing`, thirst 8/35/80, caffeine 6/35/80; interest `to_shred` weight 3, `noticeRooms` office, reception, print_room; `needsAvoidRooms: ["lounge","manager_office"]` | the deny-list leash (row 4), carry to the shredder, later the refill round (SIMS-7) |
| `howard` | Howard Pike, office manager, white English, early 60s, never takes his coat and hat off | male_spy_v2 | `howard_pc` | caffeine 10/40/60 (his own kettle only: `needsRooms: ["manager_office"]`), work 8/50/80; `screenHabit: { lockChance: 1 }` | a private office with a private kettle, a careful lock habit, arrives late and leaves early (SIMS-5) |
| `joe` (SIMS-5) | Joe Tanaka, night security officer, Japanese-British, mid 50s | male_security_guard_v2 | tile spot `night_desk_spot` in reception | caffeine 8/35/60, hunger 5/40/60 (the vending machine once SIMS-6 lands, else the kitchen fridge); `needsRooms: ["reception","office","kitchen"]` | the night crew: arrives as Hannah leaves |

Across the twelve: six women and six men; heritage Nigerian, English, Swedish, Indian, Hispanic, Polish, Korean, Lebanese, Irish, Scottish and Japanese; ages from early 20s to early 60s. The ethnicities of the new six follow their headshots; names and backgrounds are the author's choice and can change without touching any id.

Every new NPC who speaks gets a `voice` (male or female TTS voice, with a style line) and `chatter` pools of its own. The four sprites without talk art speak through the static headshot until talk art exists (art requests, section 5.4).

### 2.5 The day on the game clock

```jsonc
"gameClock": { "start": "Tue 08:30", "rate": 20,
  "anchors": [ { "condition": "globalVars.clock_home_time === true", "time": "16:45" } ] }
```

At rate 20 one real minute is twenty game minutes: 10:00 comes at 4:30 of play, lunch (12:00 to 13:30) from about 10:30, and 16:45 at about 24:45. The anchor lets the player jump to home time at once with the office clock (SIMS-5). The needs clock is unchanged (wall time, reset on reload); only arrive and leave times read the game clock, so a reload does not replay them (OLP 1.2 constraint 3). Before SIMS-5 the clock is shown nowhere and drives nothing; the `gameClock` block lands with SIMS-5.

| Game time | Real time | What happens | Slice |
|---|---|---|---|
| 08:30 | 0:00 | the current office beats unchanged (coffee contention, Sanjay's work, Grace and the mugs) | built |
| any | when opened | reception: Hannah at the desk, drinks at the reception cooler, may be summoned; meeting room: Zara on her phone, Ollie working and printing | SIMS-3, 4 |
| 10:00 | 4:30 | Howard arrives at the reception door, walks through the office and the meeting room to his office (if those rooms are loaded; otherwise he is simply at his desk when his room loads) | SIMS-5 |
| from about 10:30 | | lunch: fridge and microwave queues; the leftover lunch, if the player has put it out | built, SIMS-3 |
| any | | Ollie's prints wait on the print-room copier; the switch takes his network down and his frustration bar rises | SIMS-3 |
| 16:00 | about 22:30 | Kirsty leaves (her round done) | SIMS-5 |
| 16:30 | 24:00 | Howard leaves, screen locked | SIMS-5 |
| 17:00 to 17:15 | 25:30 to 26:15 | Hannah, Amara, Tom, Grace and Zara leave, one at a time; screens lock or are left open by habit; Tom's badge may stay on his desk | SIMS-5 |
| 17:15 | 26:15 | Joe arrives for the night desk | SIMS-5 |
| 17:45 to 18:00 | 27:45 to 28:30 | Sanjay and Rosa leave; Ollie and Marek stay: the night crew is Ollie, Marek and Joe | SIMS-5 |

---

## 3. Every built behaviour, where and when

Rows refer to the table in 1.1. "Now" means it is already in the scenario and stays.

| Row | Behaviour | Where | When, and the lever |
|---|---|---|---|
| 1, 2, 3 | needs, posts, presets | every room | all day |
| 4 | leash: allow list; deny list | Hannah (`needsRooms`), Howard (own room only), Joe; Kirsty (`needsAvoidRooms`) | Hannah's coffee trip goes to the office or kitchen, never the lounge; Kirsty's `npc_needs_leashed` when the lounge kettle is nearest |
| 5 | private room and objects | lounge (now), manager_office, every PC | all day |
| 6 | carry jobs | parcel, mugs (now); `old_rota` to the shredder | when the player drops them |
| 7 | reveal slots | office and kitchen copiers (now); print-room copier | Ollie's prints |
| 8, 9, 10 | icons, bubbles, item in hand | every NPC in the player's room | all day |
| 11, 12, 13 | seating, typing bob, idle roll and swivel | every desk; Zara and Ollie at the meeting table | all day |
| 14 | caught at the desk | any owned workstation | the player stands at a desk as its owner comes back |
| 15, 16, 17 | lock decisions, habits, cues, indicators | office PCs (now); Hannah (locks after 10 s), Howard (always), Ollie (never, no auto-lock) | every leave; at home time each leaver's habit decides (SIMS-5) |
| 18 | left behind | Tom's badge (now) | any leave, and at home time |
| 19 | chat with compatibility | kitchen cooler (now), reception cooler; Zara and Ollie as a group, Marek avoided by all | after the meeting room opens |
| 20 | queues | office and kitchen coffee (now) | lunchtime fills them further |
| 21 | avoidance, balking, parking | Sanjay and Marek (now) | Coffee Notice lever (now) |
| 22, 23 | chatter, exchanges | pools for every new NPC; exchange `exchange_juniors_standup` (Zara and Ollie, ink) | once, near the meeting table |
| 24 | print and forget, print lever | Tom (now); Ollie in the print room | all day |
| 25 | offWhen | sockets (now); `print_switch` | player lever |
| 26, 27, 29 | cake magnet with announce, table landing | now | player drops the cake |
| 28 | magnet with no announce | `leftover_lunch` | player carries it from reception and puts it down in the meeting room or kitchen; only people who see it come |
| 30 | desk phones | Tom's phone and the spare (now) | player lever |
| 31, 32 | room tone, heard use sounds | every room; new rooms take the defaults by room type from room-tones.json, and the print room's copier is a one-shot | all day |
| 33, 34 | freeze, yield, overlay | everyone | all day |
| 35 | player consumable | `kitchen_cup` | pick up, use from the inventory |
| 36 | work judged, frustration, outage kick, check visit | Ollie, resource `dev_network` with `offWhen: "print_room_switch_off"` | player switches the print-room network off: Ollie's work fails at his laptop, the bar rises, he grumbles from his own `work_fail` pool and walks to check the switch |
| 38 | phone `self` job | Zara | all day: she stays at her laptop with the phone icon |
| 48 | E1 probe | Grace in the kitchen, Ollie in the office (SIMS-2, optional "Checks" aim) | player attacks |
| 49 | vending | reception (SIMS-6) | Joe and Hannah |
| 52 | summon to post | Hannah (SIMS-4) | front-desk buzzer |
| 45 | arrive and leave | Howard, Kirsty, the day staff, Joe (SIMS-5) | game clock, or the office clock lever |

Rows 37, 39, 40, 41, 42 stay in their access test floors (1.2).

---

## 4. Build slices

Order: SIMS-1, SIMS-2, SIMS-3, SIMS-4, SIMS-5, SIMS-6, SIMS-7. One at a time: all of them touch `npc-needs.js` or the showcase.

Every slice ends the same way: node tests; validator 0 errors on test_needs_sims; the README's annotated example and live-proof table; live proof on a keyless server with screenshots; the regressions listed; a commit of the slice's own files before any live run (shared tree), with fixes as follow-up commits. Live runs are headless, with `setFPS(20)` and fixed steps on (never `fixedStep=false`), except the E3 measurement, which needs the normal frame rate. Sizes are engine, validator and schema lines, without tests or scenario data.

**Campaign needs.** The m06 pilot uses no runtime engine change (OLMP section 9) but needs the E1 answer before its design closes (SIMS-2), and the seen-only magnet and the night crew proved in the showcase (SIMS-3, then SIMS-5 for the night desk). m05 needs the thinning evening office (SIMS-5) and benefits from the summon (SIMS-4). m08 benefits from the summon for its suspects. m02 needs nothing new: kettle and cooler presets, grumble pools and an exchange are all built and shown.

### SIMS-1: an arrival must be at the destination (about 35 lines)

- **Purpose.** Remove the fault in 1.3: a needs NPC entering `using` for a target it never reached.
- **Behaviour.** An `npc_arrived` with owner `needs` counts only when the NPC stands within `ARRIVE_FAR_PX` (48 px, one and a half tiles) of `job.dest` (or of its queue cell, or its home on a return). Otherwise the system logs `arrival_far { phase, target, x, y, dest, pathLen }`, re-issues the move (at most twice per job phase) and only then fails the job with `arrival_far`. Own-desk shortcuts (`_moveForPhase` adds the arrival itself when `dist <= HOME_EPS` or at the own post) are unchanged: their distance is under the threshold by construction.
- **Engine.** `npc-needs.js`: `_advanceJob` (3119), the `arrived` branch for `goto_item`/`goto_target`; `_advanceQueued` (4408) for queue cells; the `returning` branch in `_tickNpc` (around 1318-1330) for the walk home. A new world method `moveDebug(id)` in `createEngineWorld` (4599) returns the behaviour's `{ dest, pathLen, pathIndex }` for the log only. No change to `npc-behavior.js` in this slice: the log names the cause, and a behaviour-layer fix (a distance check at "Reached end of path", `_triggerGoToStayArrival` 3064) is a follow-up only if the log shows stale paths.
- **Schema and validator.** None.
- **Node tests** (`test/js/npc-needs.test.mjs`): a stub arrival 200 px from the cell is not an arrival, re-issues `moveTo`, and fails on the third; an arrival 30 px off counts; the seated own-desk work job still starts at once; `GOLDEN_SIMS_DAY` in `npc-needs-slots.test.mjs` and the sims-day digest are byte for byte the same.
- **Scenario.** None; there is no behaviour to tick. The README gains a line under "Engine findings".
- **Live proof.** `tools/playtest/needs-arrival-proof.mjs`: open all doors, then 20 times wait for Grace idle at her post and force `rest` to 5 (as probe 3572), and 20 times force Tom's caffeine with the office coffee switched off (kitchen trip). Sample every 250 ms. Pass: every `using` entry within 48 px of its cell; record any `arrival_far` lines. Screenshots: Grace on the sofa with her overlay, one per run.
- **Regressions.** test_needs_leash (leashed and unleashed runs), lab_physical_pentest (its three beats), test_access_work (judged uses end through the same arrival).
- **Sync.** Writes nothing.

### SIMS-2: the E1 probe, attacked and knocked-out needs NPCs (about 0 engine lines; probe tool about 150)

- **Purpose.** OLMP E1, needed before the m06 design closes: which NPCs may move in missions that allow attacks.
- **Behaviour under test.** (a) Grace attacked in the kitchen while carrying the office mugs (outside her post room): she turns hostile (`player-combat.js:453`), the needs system drops her (`isAvailable` npc-needs.js:1086 returns false; `_abortJob` with the carry), she chases or stands, calms down, and walks home with needs resuming. (b) Grace knocked out there: her job ends once, the mugs drop where she fell, `globalVarOnKO` and `taskOnKO` fire once, `workstation-state.onKnockedOut` (566) runs, and after a reload she stays down and the mugs are not duplicated. (c) Ollie, holding an `itemsHeld` notebook, knocked out in the office (outside his post room): the notebook drops once where he fell; reload keeps it there and keeps him down; the server accepts the drop only once the defeat is recorded. (d) Protection 3 from OLMP section 2: Ollie at the office coffee when the player enters the print room; a mapping on `room_entered:print_room` with `patrolOverride.targetTile` set to his post walks him home and a `needs: "resume"` mapping on `room_entered:reception` lets him go again.
- **The hostile-from-start case** goes in `scenarios/test_npc_needs` (the minimal fixture), not the neutral showcase: one NPC with `behavior.hostile` and needs, which must never register with the needs system.
- **Scenario.** A second, optional aim "Checks" with tasks `check_calm_walkback`, `check_ko_drop`, `check_ko_reload`, `check_summoned_by_event`; Grace gets `globalVarOnKO: "grace_ko"` and `taskOnKO: "check_ko_drop"`; Ollie gets `itemsHeld: [{ id: "ollie_notebook", type: "notes1", name: "Ollie's notebook", takeable: true }]` and the two protection-3 mappings. These fields change no earlier beat (no KO happens unless the player attacks).
- **Live proof.** `tools/playtest/needs-attack-probe.mjs`: punch Grace in the kitchen mid-carry, sample her state, behaviour, hostility and position each 250 ms for 60 s; KO her; dump server game state (`npcHostility`, KO record, room objects); reload; dump again. Same for Ollie. Screenshots: before, hostile, down with the dropped item, after the reload.
- **If it fails.** The finding goes to the user as an engine item with its file:line; the likely places are `_abortJob` (3700) on a KO mid-carry and world `dropHeld` (5127). Until it is fixed, missions keep needs NPCs inside their own post room (OLMP's fallback).
- **Regressions.** lab_physical_pentest, test_needs_leash, test_npc_needs.
- **Sync.** Existing records only: one KO and hostility entry per NPC (bounded by the cast); `grace_ko` one boolean; one dropped item each in `objects_added`, deduplicated by id. Nothing grows with play time.

### SIMS-3: the bigger day, and E3 measured (about 3 engine lines; scenario about 650 lines, ink 6 files, perf tool about 140)

- **Purpose.** Section 2 as data: four new rooms, five daytime NPCs (Hannah, Zara, Ollie, Kirsty, Howard), the seen-only magnet, the player consumable, Ollie's outage and frustration, Zara's phone. Measure performance above 6 needs NPCs first (OLMP E3).
- **Step 1, E3.** `tools/playtest/needs-perf.mjs` at the **normal frame rate** (no raf switch, no physics throttle) on a quiet machine (load under 4): wrap `npcNeedsSystem.tick` and the action-icon `update` with `performance.now`, record frame intervals from `requestAnimationFrame`, for 180 s after opening every door. Run on the current scenario (6 NPCs) and on a scratch copy with the five new NPCs (11). Pass: tick mean at most 1.0 ms and p95 at most 3 ms; frame-interval p95 within 10 % of the 6-NPC run. Record the numbers in the README and send them to the missions plan owner for its E3 row. If it fails, profile, and ship SIMS-3 with Kirsty and Howard posted but without needs (still present, so the day still has people), raising it as an engine item.
- **Step 2, data.** Rooms, objects and cast as in 2.2 to 2.4. Top level: `roles: { developer: { workNeeds: ["dev_network"], frustration: { perFail: 20, easePerSuccess: 10 } } }`, `resources: { dev_network: { kind: "network", object: "print_switch", offWhen: "print_room_switch_off" } }`, Ollie's role `developer`, no `workarounds`. New globals declared in `globalVariables`: `print_room_switch_off`, `print_out_a_shown`, `print_out_b_shown`, `leftover_lunch_servings: 2`, `heard_exchange_juniors_standup`. Ink: `hannah.ink`, `zara.ink`, `ollie.ink`, `kirsty.ink`, `howard.ink` (a short hub each, neutral office talk) with the exchange knot in `zara.ink`.
- **Spoken lines.** Pools per NPC in their JSON: `reception`, `summoned` (Hannah; used by SIMS-4), `juniors` (Zara, Ollie), `work_fail` and `station_fail` (Ollie), `facilities` (Kirsty), `grumble` for the leftover lunch (`Missed it.` exists in the scenario pool). All one line, no `{ }`.
- **Schema and validator.** No new fields. `validate_scenario.rb` 0 errors; warnings recorded: the leftover lunch "magnet starts in a room" (justified: the player is meant to move it).
- **Node tests.** `test/js/npc-needs-sims-validator.test.mjs`: the validator run lists the new presets (`reception_pc`, `zara_laptop`, `ollie_laptop`, `howard_pc` as desk_pc; `reception_cooler` as cooler; `howard_kettle` as kettle; `print_copier` as copier; `print_shredder` as shredder), prints T1/P lines for the five NPCs, reports Hannah's and Kirsty's leash with no impossible need, and reports `leftover_lunch` as a magnet with no announce. The three-room fixture `needs-sims-world.mjs` is not changed.
- **Objectives** (new tasks in `watch_the_office`): `see_front_desk_drink` (`npc_used:reception_cooler`, `data.npcId === 'hannah'`), `see_phone_break` (`npc_used_phone:zara`), `see_leftovers` (`npc_used:leftover_lunch`), `see_print_room_forgotten` (`npc_print_uncollected:*` with `data.npcId === 'ollie'`), `see_network_down` (`npc_use_failed:ollie`), `see_shredded` (`npc_used:print_shredder`), `see_private_kettle` (`npc_used:howard_kettle`), `see_kept_out` (`npc_needs_leashed:kirsty`), `hear_juniors` (`npc_exchange_heard:*` on the knot), `drink_a_coffee` (`player_consumed:kitchen_cup`). `consumables.js` emits no event today, so this slice adds one emit where an item is consumed from the inventory (about 3 lines, the slice's only engine change; a node test in the consumables tests checks it fires once).
- **Live proof.** Drive the tour (section 6) to 10 minutes; screenshots of each room with its people; the switch off and Ollie's bar; the leftover lunch eaten in the meeting room with no announce line; log excerpts per task.
- **Regressions.** The README's earlier tables (the first two minutes in the office must log the same beats as game 3537 apart from new NPC lines), test_needs_leash, lab_physical_pentest, test_access_work (shared work code).
- **Sync.** New scalars, each sent as a one-key delta when it changes: 12 workstation booleans (4 new owned workstations x 3), 2 slot globals, 1 servings integer, 1 switch boolean, 1 `heard_` boolean, `ollie_frustration` (one integer) plus the server's `npcFrustration` record for Ollie (about 450 bytes, answers only), 1 `objects_added` entry when the player drops the rota. Worst case 18 new keys. None grows with play time.

### SIMS-4: summon to post for a beat (E5; about 95 lines)

- **Purpose.** OLMP E5: a story mapping can bring a needs NPC back to its post and keep it there for a beat, without patrol overrides and without freezing it in another room.
- **Behaviour.** An eventMapping `"needs": { "summon": { "holdSeconds": 20 } }` on an NPC: the NPC ends what it is doing cleanly (a use is cut short with no restore; a carried item is dropped where it stands, as an abort already does; it leaves any queue and ends any chat; a call it is on hangs up), walks home with no yield to the player, and on arrival emits a new event `npc_at_post:<id>` with `{ summoned: true }`. It then stays at its post (seated, screen attended) and picks no need for `holdSeconds`, or until a mapping sends `"needs": { "release": true }` or `"resume"`. A conversation the player has with it during the hold extends the hold to the chat's end. A knocked-out, hostile or hidden NPC ignores it. A summon while already at the post starts the hold at once. Not persisted: a reload starts everyone at their posts anyway.
- **Engine.** `npc-needs.js`: `control` (949) gains `summon` and `release`; `_tickNpc` (1257) skips `_select` while `s.summon` holds; the walk reuses `_abortJob` (3700, reason `summoned`), `_leaveQueue` (4449), `_endChat` (2784), `_hangUp` (4303) and `_goHome` (3771, `yieldToPlayer: false`); the hold starts in the `returned_post` path; `getState` (4542) shows `summoned`. The pressing bubble is hidden while held (`_pressing` 4515). `npc-action-icons.js` shows the existing `noticed` icon on arrival for 2 s.
- **Schema and validator.** `scripts/scenario-schema.json`: eventMapping `needs` object form gains `summon: { holdSeconds: 1-600 }` and `release: true`. `validate_npc_needs.rb` `check_npc` (1152): a summon on an NPC with no `needs` or no `needsHome` is an error; on a patrol NPC an error.
- **Node tests** (`test/js/npc-needs-summon.test.mjs`): from a use, a carry (item dropped where it stood, as an abort does today), a queue, a chat pair (partner carries on alone), a call; already at post; KO ignored; hold length; release; player chat extends; the sims-day digest unchanged when no summon is sent.
- **Scenario.** `front_desk_buzzer` with `triggerOnInteract: [{ type: "emit_event", event_name: "front_desk_buzz" }, { type: "hint", title: "Front desk", message: "You press the buzzer." }]`; Hannah's mapping on `front_desk_buzz` with `needs: { summon: { holdSeconds: 20 } }`, `cooldown: 30000` and a `bark` from a voiced line in her JSON. Task `see_summoned` (`npc_at_post:hannah` with `data.summoned`).
- **Live proof.** Force Hannah's thirst so she is at the reception cooler, press the buzzer, sample her position and state: back at the desk, held 20 s with thirst urgent, then off to the cooler. Repeat with her at the office coffee (cross-room). Screenshots: buzzer press, Hannah walking back, seated at the desk with the bubble hidden, leaving after the hold.
- **Regressions.** test_needs_leash, lab_physical_pentest (it uses `needs: suspend/resume` mappings, which must behave as before), test_access_work.
- **Sync.** Writes nothing. A mapping's `onceOnly` key, if an author adds one, is the existing `triggeredEvents` record.
- **Cheat resistance.** Moves an NPC on a client event; no secret or access depends on it.

### SIMS-5: arrive and leave on the game clock (about 280 lines)

- **Purpose.** The thinning evening office for m05 and the night crew for m06's look; Howard's late arrival.
- **Behaviour.** An NPC with `schedule: { "arrive": "10:00", "leave": "16:30", "arriveFrom": { "room": "reception", "x": 1, "y": 1 }, "leaveVia": { "room": "reception", "x": 1, "y": 1 } }` (either time optional). Before `arrive` (game time) it is hidden and unregistered with the needs system. At `arrive`: if `arriveFrom`'s room and its post's room are loaded, it appears there, says a line from its `arriving` pool, and walks home; otherwise it is at its post when its room loads. At `leave`: once it is not in a conversation, it ends its job as for a summon, says a line from `leaving`, walks to `leaveVia` (or its room's nearest door if that room is not loaded), then the workstation layer records a leave for the day (the habit's lock decision with an unbounded expected absence: `lockIfAwayOverSeconds` habits lock, `lockChance` rolls, `lockChance: 0` leaves it open), a left-behind roll runs, and the NPC is hidden. An anchor jump past several leave times sends them off one at a time, 8 s apart, in time order. After a reload the state follows the game clock: before arrival hidden, between at the post, after leaving hidden with its workstation globals as they were saved.
- **Engine.** New `systems/npc-schedule.js` (about 150): `installNpcSchedule`, a 1 s check against `window.gameClock` (`gameSecondsAt` game-clock.js:99, `timeParts` 158), `setNPCVisible` for hide and show (its visibility is already saved as `npcVisibility`). `npc-needs.js` (about 45): `arriveForDay(id, at)` and `leaveForDay(id, via)` reusing the summon's clean stop and `_goHome`; events `npc_arrived_for_day:<id>`, `npc_left_for_day:<id>`. `workstation-state.js` (about 25): `onLeft(npcId, { forDay: true })` (541) and `resetGlobals` (497) keeps a gone owner away after a reload. Static import added to the JS test harness copy lists.
- **Schema and validator.** NPC `schedule` object (arrive, leave as `HH:MM`, arriveFrom, leaveVia, `_comment`). `validate_npc_needs.rb`: times parse and arrive is before leave; `gameClock` present; the tiles are floor in their rooms; NPC has `needsHome` and no patrol; a warning on an NPC with tasks, `taskOnKO` or a required conversation (story NPCs should not leave); a warning when `arriveFrom` is in a room that does not load with the post (OLMP E4).
- **Node tests** (`test/js/npc-schedule.test.mjs`): fake clock; hidden before; arrival walk; leave during a use; leave held by a chat; lock decision per habit; left-behind at leave; anchor jump with three leavers; reload before, during and after the day.
- **Scenario.** The `gameClock` block of 2.5; `schedule` on howard, kirsty, hannah, amara, tom, grace, zara, sanjay, rosa (times in 2.5) and joe (arrive 17:15); `office_clock` (wall_clock1, confirm "Wind the clock on to home time?", sets `clock_home_time`); pools `arriving`, `leaving` per NPC (voiced). Tasks `see_arrive` (`npc_arrived_for_day:howard`), `see_leave` (`npc_left_for_day:*`), `see_night_desk` (`npc_arrived_for_day:joe`), `see_left_open_overnight` (`workstation_owner_left:*` with `data.forDay && data.screenLocked === false`). Leave times are after 25 minutes, so every earlier proof's window is untouched.
- **Live proof.** Pull the clock lever with all rooms open; screenshot the office every 10 s until empty; log the order and each lock decision; check Joe arrives and sits at the night desk; reload at 17:30 and check hidden staff, Joe present, globals unchanged. A second run without the lever at the normal rate to 10:05 shows Howard's arrival.
- **Regressions.** test_needs_leash, lab_physical_pentest (it uses `gameClock`), test_access_sessions (workstation leave path), m05's walkthrough smoke run (it has a `gameClock` from 16:30 and no schedules, so nothing changes).
- **Sync.** `npcVisibility`: one boolean per scheduled NPC that changed, sent as a delta (at most 10 here); workstation globals as already counted in SIMS-3; the game clock's elapsed time and reached anchors (existing). The schedule state itself is derived from the clock and never sent. No growth with play time.

### SIMS-6: vending preset (E2; about 12 lines plus tests)

- **Behaviour.** `office-presets.json` gains `vending_snack` (`vending_machine1`: hunger, restores 50, 8 s, capacity 1, `useFrom` below, `useSound: "eat_snack"`) and `vending_drinks` (`drinks_vending1`: thirst, restores 60, 6 s, `useSound: "drink_gulp"`). No `startSound` until a coin sound exists. Shared data: only test scenarios set `officePresets` today, so no deployed game changes; it is still an approval item for the user.
- **Validator, schema.** `preset_table` reads the file; no schema change.
- **Node tests.** `test/js/office-presets.test.mjs` (`presetIdFor` for both types), `validator-office-presets.test.mjs`.
- **Scenario.** `reception_vending` (vending_machine1) in reception; task `see_vending` (`npc_used:reception_vending`). Joe's hunger uses it at night; Hannah's thirst still prefers the cooler.
- **Live proof.** Joe or Hannah at the machine, with the `eat_snack` sound heard in reception and not from the office.
- **Regressions.** test_needs_sims earlier tables, lab_physical_pentest.
- **Sync.** None.

### SIMS-7: consumables and refills (optional; about 170 lines)

- **Purpose.** Longer days: the coffee runs out and the facilities engineer refills it. No mission in OLMP asks for it, so it is built last, only if a mission or the user wants it.
- **Behaviour.** `affordance.stock: { max, perUse, lowAt }` on a source. Each completed use takes `perUse`. At 0 the source is `empty`: walkers and queuers turn back with reason `empty` (the 18a turn-back table, grumble topic `grumble_empty`), and parked needs wake on refill. An NPC with `restocks: [objectIds]` gets a refill visit (`enqueueVisit` kind `restock`, npc-needs.js:2371) when a listed source drops to `lowAt`; on `npc_visit_done` the stock returns to `max`. Stock is client-only and resets to `max` on reload, like need levels.
- **Engine.** `npc-needs.js`: `_free`/`_useCandidate` skip empty sources; `_completeJob` (3219) takes stock; `_turnBack` reason `empty`; `_tickKick`-style watch for `lowAt`. Icon `restock` in npc-action-icons.js with a stand-in (5.4).
- **Schema and validator.** `affordance.stock`, NPC `restocks`; validator: `restocks` targets have stock, `grumble_empty` lines exist.
- **Node tests.** Empty source turn-back; refill visit; reload resets; sims-day digest unchanged without stock.
- **Scenario.** `office_coffee` gets `stock: { max: 6, perUse: 1, lowAt: 1 }`; Kirsty `restocks: ["office_coffee", "reception_vending"]`; task `see_refill`.
- **Live proof.** Force six coffees, see the turn-back and Kirsty's refill walk.
- **Regressions.** test_needs_leash, lab_physical_pentest, the README tables (the office coffee now runs dry after six uses, so the README's coffee-contention row is re-run).
- **Sync.** None, if stock stays client-only (open question 4).

### Cut, and why

- **Traits (OLP slice 6).** The user left them unpicked on 2026-11-06; every habit they would bundle is already a per-NPC field (`screenHabit`, `printHabit`, `needsCompany`, `leftBehindChance`), and no mission in OLMP needs them.
- **Routines (OLP slice 9).** Print and deliver, fetch the post and file are already covered by reveal slots, carry jobs and the print errand. About 450 lines for no mission's need.
- **Per-NPC sessions (OLP 16b).** The access model's sign-in PCs and unlocked sessions do this (test_access_signin, test_access_sessions).
- **Schedule preemption, stand-ups and fire drills (rest of OLP slice 12).** Only arrive and leave are needed (m05). A stand-up would need gathering and escorting, which no mission asks for.
- **A separate night-crew scenario.** The evening of SIMS-5 is the night crew.
- **An outdoor or smoking area.** No existing map.
- **Friendface feeds and the security workarounds in the showcase.** See 1.2.

| Slice | Size (engine, validator, schema) | Needed by |
|---|---|---|
| SIMS-1 arrival check | about 35 | every needs scenario |
| SIMS-2 E1 probe | 0 (probe tool about 150; a fix, if any, sized then) | m06 before its design closes, then all |
| SIMS-3 the bigger day, E3 | about 3 (one consumable event; scenario and ink otherwise; perf tool about 140) | m06 (seen-only magnet), m05 and m08 (cast size) |
| SIMS-4 summon to post | about 95 | m05, m08 |
| SIMS-5 arrive and leave | about 280 | m05; m06's night look |
| SIMS-6 vending preset | about 12 | optional, all |
| SIMS-7 consumables and refills | about 170 | nobody yet |

---
## 5. Rules for every slice

### 5.1 Spoken lines

- Every bark, chatter line, announce, exchange and call is scenario data: single-speaker lines in the NPC's (or the scenario's) `chatter` pools or eventMapping `bark` fields, multi-speaker exchanges and calls in ink knots. They must be voiceable by the TTS: one line each, no `{ }`, no printed variables, no speaker prefix that the call parser would split. The validator's pool and exchange checks (`check_pool_lines` 676, `check_exchanges` 826) run on every new pool.
- The engine never carries spoken words. Its fallbacks are pictures only (`PICTURE_CHATTER`, `pictureIcons` npc-needs.js:213). The new topics in these slices (`summoned`, `arriving`, `leaving`, `grumble_empty`) get a picture fallback, not a sentence.
- New spoken lines are listed in each slice's report so the voice cost is known before any audio work. Audio is made last, with the user's agreement (tts-audio skill).
- Every new NPC who speaks has a `voice`.

### 5.2 Cheat resistance

- Nothing in these slices guards a secret, key, password or forged item. Summons, schedules, stock and the outage lever move NPCs or change client-side choices; they are best-effort client behaviour, which the policy allows.
- Anything the player can take stays a declared scenario object (OLP 1.2 constraint 2): the leftover lunch, the cup, the rota, Ollie's notebook. The engine invents nothing takeable.
- Workaround and `onUse` `setGlobal`s are client-writable, so no required step reads them. Office-life events complete optional tasks only.
- If a later mission hangs access on any of this (a screen left open overnight that leads to a credential), the server must be able to refuse access that honest play could never reach, as the policy says; that check belongs to that mission's plan.

### 5.3 Art, UI and layout

- Reuse existing art only. Nothing here plans image generation. Anything new goes in 5.4 with a stand-in.
- UI follows the pixel-art rule (2 px borders or the `ui-themes.css` 9-slice skin, pixel fonts only, no radius, no smooth fonts) and the UI design language (X closes, no Cancel button on panels; the confirm dialogs for the switches and the clock keep the existing `confirm_action` pattern from slice 18a; one look per concept; NPC headshots in conversations).
- Props are square to the walls, top-down; at most one or two angled per room.
- Walking "behind" a back wall is the intended effect; never seal it. Cross-room interaction is blocked instead.
- Pixel art is never scaled down; icons and props are used at native size.

### 5.4 Art and sound requests for the user

| Item | Kind | Needed by | Stand-in meanwhile |
|---|---|---|---|
| Talk sheets and visemes (`--from-talk`) for `female_telecom_v2`, `female_security_guard_v2`, `male_security_guard_v2`, `male_spy_v2` (four talk inits each to choose from first) | character art | SIMS-3, SIMS-5 (Kirsty, Hannah, Joe, Howard speak) | the static headshot in conversation |
| A front-desk bell | object sprite, sized from the catalogue | SIMS-4 | `phone3` named "Front desk buzzer" |
| A vending coin and drop sound | MP3 one-shot | SIMS-6 | none (the use sound only) |
| A restock icon (`npc-restock`, 16x16, made in one sheet with any other icon) | icon | SIMS-7 | the `npc-file` icon |
| A coat-on, coat-off look for leaving | not requested: leaving reads from the walk and the line | none | none |

### 5.5 Sync, all slices together

Needs state, positions, queues, summons, stock and schedules live in the browser and are never synced. What reaches player_state or the server: workstation globals (12 new booleans), slot and switch globals (3), servings (1 integer), `heard_` (1), `grace_ko` (1), `ollie_frustration` (1) and Ollie's server frustration record (about 450 bytes), up to 10 `npcVisibility` entries, and up to 3 `objects_added` entries (the rota, the dropped mugs or notebook on a KO). Each is sent as a one-key delta when it changes. All are bounded by the authored content. Nothing grows with play time.

---

## 6. What to watch for: a guided tour for the README

Times are real minutes from load. The game clock (from SIMS-5) shows the matching office time. Levers are in bold.

| Time | Where | Look at | Lever | What should happen |
|---|---|---|---|---|
| 0:00 to 1:00 | office | Amara and Tom at the coffee station; Sanjay starts work; the bars on the overlay shrink | none | contention: one waits at the desk, then goes; icons and bubbles over heads; typing bob |
| 1:00 | office, then north | the meeting room comes alive | **open the north door** | Zara on her phone at her laptop (phone icon, she never gets up for it); Ollie working |
| 1:20 | south | reception | **open the south door** | Hannah at the front desk; later a drink at the reception cooler |
| 1:40 | reception, then west | the print room | **open the print-room door** | Kirsty at the filing cabinet; Ollie's prints start to land on the print-room copier and some are never collected |
| 2:00 | west and east | kitchen and lounge, as before | **open both doors** | Grace spots the mugs and carries them to the kitchen; Rosa appears in the lounge |
| 2:20 | meeting room, then east | Howard's office | **open the manager's door** | Howard at his desk; his kettle is his alone; his screen locks every time he gets up |
| 3:00 | reception | the leftover lunch on the counter | **pick it up, put it down in the meeting room** | no announcement: only people who see it come (Zara, Ollie); two servings, so a third turns back with "Missed it." |
| 3:30 | print room | the network switch | **switch it off** | Ollie's next work use fails: his frustration bar rises, he grumbles and walks to check the switch; switch it back on and he settles |
| 4:00 | anywhere | the old rota | **drop it in reception** | Kirsty notices it, picks it up and shreds it |
| 4:30 | reception | the buzzer | **press it while Hannah is away from the desk** | she comes straight back, sits, and stays for 20 seconds even if thirsty (SIMS-4) |
| 4:30 | (SIMS-5 without the lever) | the reception door | none | 10:00: Howard arrives in coat and hat and walks to his office |
| 5:00 | kitchen | the cup on the counter | **pick it up, use it from the inventory** | you drink it, with a sound |
| any | office | the earlier levers: notes, sockets, spare phone, cake, parcel, mugs | as the README lists | as before |
| 6:00 | office | the office clock | **wind it on to home time** (SIMS-5) | the office empties one by one: each says goodnight, walks out through reception; screens lock or are left open by habit; Tom's badge may stay behind; Joe arrives for the night desk; Ollie, Marek and Joe are left |
| any | everywhere | the debug overlay and the decision log (`window.__test.needs.log()`) | none | every beat above has a log line and, where listed, a task tick |

Checks aim (SIMS-2, optional): punch Grace while she carries the mugs in the kitchen and watch her calm down and walk home; knock her out and see the mugs drop where she fell; reload and she is still down.

---

## 7. Open questions (recommended default in bold)

1. The meeting room reuses `room_meeting`, the lounge's map. Use it, or `room_hospital_meeting` after a render check? **Use `room_meeting`; it reads as a project room with a long table.**
2. `male_spy_v2` (fedora, dark glasses, trench coat) may read as a spy in a neutral showcase. Cast him as the office manager who never takes his coat off, or leave him unused? **Cast him as the manager; his lines make the coat a running joke, and he is the one NPC who arrives and leaves in daytime, so the coat makes sense.**
3. Summon hold default: fixed seconds, or until a release mapping? **20 s by default, extended by a player conversation; a `release` mapping ends it early.**
4. Should stock (SIMS-7) survive a reload? **No: client-only, reset to full like need levels.**
5. Build SIMS-7 at all? **Only once a mission or the user asks for it.**
6. Put the E1 hostile-from-start case in `test_npc_needs` rather than the showcase? **Yes, to keep the day neutral.**
7. Ollie's outage brings a server frustration record into a showcase that had none. Keep it? **Yes, for Ollie only, with no workarounds.**
8. Leave times read the game clock (saved) rather than the needs clock (reset on reload). **Game clock, so a reload never replays the evening.**
