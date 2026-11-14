# Office life: the sims showcase day, audit and build plan

This plan grows `scenarios/test_needs_sims` (the neutral office-life showcase, no security narrative) into a believable small office day: an open-plan floor with its print corner, a kitchen, a meeting room, an IT room, a facilities office, a reception and a private office, with thirteen people. It specifies the missing pieces as small build slices, each with engine work (where there is any), node tests, a scenario addition with an objective and a live proof. The order follows the campaign: the showcase first proves what the m02 pilot needs, then what m06, m05 and m08 need, in the rollout order of the missions plan. Part 1 is the audit. Parts 2 to 8 are the plan.

Line numbers drift. Engine references give the function name with the file:line where it starts on branch `build/ol-sims` at d28417369 (engine, server, validator, test and scenario files are byte-identical to 69a77f696). Scenario references are to `scenarios/test_needs_sims/scenario.json.erb` (`sims.erb`).

Related documents: `docs/achitechture/OFFICE_LIFE_PLAN.md` (OLP), `docs/achitechture/NPC_NEEDS_SYSTEM.md` (the author contract), and the campaign plan `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` on branch `plan/office-life-missions` at 2e0bca43f (OLMP). OLMP's pilot is m02 ransomed_trust, its rollout is in OLMP 6.14, its engine gaps are E1 to E6 in OLMP 9, and its sync table is OLMP 7. Section 2 quotes the parts this plan answers to.

---

## 1. What exists

### 1.1 Behaviours

States: **shown** = built and shown in test_needs_sims; **not shown** = built, not shown there; **unproved** = built, never proved live; **planned**; **not planned**. The last column names the slice that shows it.

| # | Behaviour | State | Engine evidence | Shown by |
|---|---|---|---|---|
| 1 | Needs decay, urgency, bounded selector, needs clock | shown | `tick` npc-needs.js:1006, `update` 606, `_tickNpc` 1257, `_select` 1490 | now |
| 2 | Posts and home preference (`needsHome`, object or tile) | shown | `_goHome` 3771, `_useCandidate` 1567 | now; tile homes at chairs in SIMS-3 |
| 3 | Presets by exact type or `officeType`; `affordance: false` | shown (by type only) | `presetIdFor` office-presets.js:49, `resolveAffordance` 66; office-presets.json; validator `expand_presets` validate_npc_needs.rb:627 | `officeType` on boilers, fridge, `pc5`, `pc12`, phones; `affordance: false` on an empty cooler (SIMS-3, SIMS-4) |
| 4 | Room leash, allow list and deny list | not shown | `_roomForbidden` 1197, `_avoidRooms` 1209; `npc_needs_leashed` with `skipped`; validator `leash_rule` 1086, `leash_reach` 1116 | allow: Neil, Keith, Jodie, Leila, Andrés, Siân; deny: Nisha (the first live use) |
| 5 | Private rooms and objects | shown | `_owners` 1218, `_permitted` 1229; validator `check_private` 1048 | now; every new room |
| 6 | Carry jobs for tagged items | shown | `_carryCandidate` 2799 | now |
| 7 | Reveal slots | shown | `_revealOutput` 3512, `_reserve` 3612; validator `check_slots` 1381 | now; the IT copier tray |
| 8 to 12 | Icons, pressing-need bubbles, item in hand, seating, typing bob | shown | npc-action-icons.js `pickIconEntry` 135, `pressingBubble` 202; npc-office-visuals.js `heldPlacement` 174; seating.js `needsStop` 1738, `typingBob` 1779 | now; seated tile homes in SIMS-3 |
| 13 | Idle roll, rare swivel, look round; `swivel: false` | shown | `fidgetOffset` seating.js:1169, `swivelFacing` 1268, the opt-out at 1295 | now; `swivel: false` on Neil |
| 14 | Own-post use is not a leave; caught at the desk | shown | `_atOwnPost` 2949, `_checkCaught` 3066 | now; Neil's mug (SIMS-3) |
| 15 to 17 | Lock decisions, lock-screen habits, idle auto-lock, cues, indicators | shown | workstation-state.js `decideLocked` 147, `habitOf` 125, `_checkAutoLock` 466; `lockCuePlan` npc-office-visuals.js:101 | now; Leila, Nisha, Siân |
| 18 | Left-behind items | shown | `_leaveItemsBehind` 2983 | now |
| 19 | Chat at a capacity-2 chatter object, compatibility | shown | `_maybePair` 3863, `_compatible` 3844, `_tickChats` 3887 | now; the facilities pair and the IT tea pair |
| 20, 21 | Queues, queue chatter, avoidance, balking, parked needs | shown | `_queueCandidate` 4387, `_tickQueueChats` 4466, `_avoidedAt` 1764 | now; the vending queue (SIMS-5) |
| 22 | Chatter pools, `hush` | shown (no `hush`) | `chatterPool` 242, hush on a chat 3895-3901, ended with reason `hushed` (`_endChat` 2784) | the IT tea pair (SIMS-4) |
| 23 | Exchanges heard once, `requireGlobal` | shown (ungated or string gate) | `_findExchange` 2685, `_startExchange` 2711, `_finishExchange` 2751 | gated both ways (SIMS-4); a pair's exchange (SIMS-3) |
| 24 | Print and forget, print-job lever | shown | `_tickPrints` 3672, `_dueErrand` 3644 | now; Leila (SIMS-4) |
| 25 | `offWhen` switches | shown | `_isOff` 687, `_deadStation` 2125 | now; the manager's printer (SIMS-7) |
| 26, 27, 29 | Magnets, word of mouth, table landing | shown | `_noteMagnets` 731, `_tickNews` 838; world `settleMagnet` 5303 | now (the cake) |
| 28 | A magnet seen only | not shown | same code, no `announce` | the pizza (SIMS-6) |
| 30 | Desk-phone calls | shown | `onPhoneRing` 4015, `_tickRings`, `_tickCalls` 4238 | now; reception and the private office |
| 31 | Room tone and `roomToneTypes` | shown (table types only) | `profileForRoom` office-room-tone.js:41 | `room_security` mapped (SIMS-3) |
| 32 to 34 | Use sounds by room, conversation freeze, debug overlay | shown | `useVolume` npc-office-visuals.js:135, `_talking` 3979, npc-needs-debug.js | now |
| 35 | Player consumables | not shown | consumables.js `consumableKind` 67, `useConsumable` emits `item_consumed` with `itemId` (216-218); map cups are drinkable (`DRINKABLE_CUPS` 80-88) | the kitchen cup (SIMS-4) |
| 36 | Work judged against resources, frustration, outage kick, check visits | not shown | `_plan` 2100, `_judged` 2106, `_countFailure` 2226, `_tickKick` 2333, `enqueueVisit` 2371 | the private office (SIMS-7) |
| 37 | Workarounds | not shown | npc-workarounds.js `due` 119 | kept out (1.2) |
| 38 | `social_media` need, the phone `self` job | not shown | `_socialCandidate` 2148 (own station first; the phone when there is none or it is `socialBlocked`), `_startSelfJob` 2905 | Andrés, who has no station (SIMS-5) |
| 39 to 42 | Friendface, awareness, USB, sessions and sign-in | not shown | social-feed.js; door-gates.js:134; `usbRefusedBy` 258; workstation-state.js `guestOf` 286 | kept out (1.2) |
| 43 | Traits (OLP slice 6) | planned | none | backlog SIMS-11 |
| 44 | Routines (OLP slice 9) | planned | none | not planned here (5.12) |
| 45 | Arrive and leave on the game clock (OLP slice 12) | planned | `game-clock.js` exists | backlog SIMS-8 |
| 46 | Stock and refills (OLP slice 13) | planned | none | backlog SIMS-10 |
| 47 | Per-NPC sessions (OLP 16b) | superseded by row 42 | none | none |
| 48 | E1: attacked and knocked-out needs NPCs, live | unproved | `isAvailable` 1086 and the block in `_tickNpc` 1273-1281, `_goHome` on `unblocked` 1282-1285; `onKnockedOut` workstation-state.js:566; server KO drop guard game.rb 486-523 and `find_npc_held_item` 1151 | `test_needs_attack` (SIMS-1) |
| 49 | E2: vending presets | planned | sprites `vending_machine1`, `drinks_vending1`; no preset | reception (SIMS-5) |
| 50 | E3: more than 8 needs NPCs | unmeasured | test/js/npc-needs-tick-cost.test.mjs; 6-NPC mean tick 0.19 ms | 13 needs NPCs (SIMS-5) |
| 51 | E4: lazy room loading | design rule | `_onRoomsLoaded` 1119 | the tour opens doors in order |
| 52 | E5: an NPC at its post for a beat | design rule; helper in the backlog | OLMP section 2, three protections | protections 1 (Neil) and 2 (every new NPC); backlog SIMS-9 |
| 53 | Simulating unloaded rooms | not planned | OLP 4.1 | none |
| 54, 57 | `maxUnmetMin`, `deferrable: false` | not shown | `_starved` 1410; `_useCandidate` 1580-1582 | kept out (1.2) |
| 55 | `printHabit.shareAfterSeconds` | not shown | `_tickPrints` 3691-3696 | Leila (SIMS-4) |
| 56 | `npc_print_gone` (taken before the due time; no walk) | not shown | `_tickPrints` 3676-3684 | Leila (SIMS-4) |
| 58 | A magnet that starts as a room object | unproved | `_noteMagnets` over `listObjects` at room load, `_shownMagnets` 751; validator warning validate_npc_needs.rb:272 | the pizza (SIMS-6) |
| 59 | An NPC whose only need is met by its own post object, printing by command | not shown | at-post jobs (`_atOwnPost` 2949); `control` 949 `print` with `forget`; seat mode `stand` (`seatPreference` seating.js:1794) | Neil (SIMS-3) |
| 60 | Coupled breaks: `npc_left_post` with `targetId` setting a partner's need | not shown | payload at npc-needs.js:2968; mapping `needs` through `control` (npc-manager.js:1581) | the facilities pair (SIMS-3) |
| 61 | `chatterCooldownMin` below the default of 5 | not shown | `CHATTER_COOLDOWN_MIN` 73, read at 2628 | the facilities pair (SIMS-3) |
| 62 | A `room_entered` mapping that starts a break | not shown | mapping `cooldown` in ms (npc-manager.js:1223) | the facilities pair (SIMS-3) |

### 1.2 Built behaviours the showcase leaves out, and why

- **Workarounds (row 37), Friendface (39), awareness, USB, sessions and sign-in (40 to 42).** Each is a security beat (a propped door, a written password, a borrowed session, a feed to mine). The showcase stays neutral; they keep their own floors (test_access_work, test_access_social, test_access_habits, test_access_sessions, test_access_signin, lab_physical_pentest).
- **`maxUnmetMin` and `deferrable: false` (rows 54, 57).** Story-need knobs with nothing to watch on a normal day; OLMP 2 says `deferrable: false` is not a protection. They stay in the author contract and the unit tests.

Work needs and the phone break (rows 36, 38) are ordinary office life and are shown (SIMS-5, SIMS-7).

### 1.3 The Grace overlay fault (baseline game 3537)

`base-05-office-later2-3537.png` shows Grace's overlay ("grace: using 12s lounge_sofa") and her `Z` icon over the office's west desks, with Grace's sprite under them. The decision log has `482 urgent rest`, `482 job_start rest lounge_sofa`, `482 windup` and `491 using rest lounge_sofa`. Nine ticks is 2.25 s of needs clock; the sofa's approach cell (540,244) is about 15 tiles from her desk. Two targeted probes on :3093 (games 3560, 3572) did not repeat it.

What the code allows:

- `_advanceJob` (3119) treats any queued `npc_arrived:<id>` whose owner is `needs` as the job's arrival (`onArrived` 630 queues every one), with no check of where the NPC stands.
- Seating's chair fetch moves the NPC with owner `needs` (`moveNeeds` seating.js:2029-2033), but only while `needsStop` (1738) returns a stop: an own-desk job, `returning` at the post, `using`, or `idle` at the post. An arrival that lands during a job's windup is taken off `_arrivals` (npc-needs.js:1318) and dropped when the windup branch returns (1342-1349), and `_leavePost`'s move then replaces the fetch's path (npc-behavior.js `goToAndStay` 2980). So a fetch arrival reaching the `goto_target` phase needs a path not yet identified.
- The behaviour layer fires the arrival whenever its current path runs out (npc-behavior.js:1236-1245, `_triggerGoToStayArrival` 3064), with no check against `_goToStayDest`. A path that ends short (an async path answer at 1722-1752, a planned path that stops at a door) carries the job's own move, so only a distance check can catch it.
- The baseline's other oddity, `return_resumed` at (116,156) every 12 ticks for 70 ticks on the way home, is `_watchReturn` (3791-3800) re-issuing a walk home that is not getting anywhere. It is a stalled return, not a chair fetch.

SIMS-2 therefore instruments every owner-`needs` arrival first, runs until the fault repeats, and fixes it with a distance check as the main guard and move ids as the second.

---

## 2. What the campaign needs from the showcase

### 2.1 The missions plan, quoted

OLMP 6.14, "Rollout":

> 1. m02 (pilot)
> 2. m06
> 3. m05
> 4. m08
> 5. m01, then the m01, sis01 and sis02 gate playtests again
> 6. m07
> 7. m04
> 8. m03
> 9. m09 and m10: the analysis stage runs, is expected to recommend Tier 0, records that and stops.
>
> One mission is in implementation at a time. The next mission's analysis and design can run while the previous one is in review, as AGENTS.md's mission loop allows. Lessons from each mission go into the skill's references before the next one starts. The vending preset (E2) lands as its own item straight after the pilot, before m06.

OLMP 9, the proposal for each gap:

> **E1** A live probe run in the showcase as slice SIMS-2 (`test_needs_sims`, with the hostile-from-start case in `test_npc_needs`), **before the pilot's design closes**, because the result decides which NPCs may move. If it fails, those NPCs keep needs inside their own room only, and the fix goes to the user as an engine item.
>
> **E2** A vending entry in `office-presets.json` (hunger and thirst, a short use, a coin sound). Only test scenarios set `officePresets` today, so it changes no deployed game, but it is shared data and an approval item. It lands straight after the pilot, as its own item (the user's decision). Toilets: not planned.
>
> **E3** Measure frame time with all of the pilot's needs NPCs active, at normal frame rate, before review. Measure first for any mission that would have more than 8.
>
> **E4** A design rule, not engine work. Need targets sit in rooms that load with the NPC's own room, or the plan accepts that the kitchen comes alive once the player opens it.
>
> **E5** A design rule plus V2: the three protections in section 2. A "summon to post" helper is backlog only.
>
> **E6** Fixed in the showcase stream (slice SIMS-2 of `OFFICE_LIFE_SIMS_BUILD_PLAN.md`, move ids for arrivals, about 50 lines) before the pilot's stage 5 playtests. Not a pilot change: it lands on main through the integrator with its own tests, and the pilot rebases over it.

OLMP 9, "Alignment with the showcase":

> - **Before the pilot's design closes:** SIMS-1, the E1 probe, in its own `test_needs_attack` scenario. Its result decides whether the staff-room pair keep their walks (they are the pilot's only walking NPCs).
> - **Before the pilot's stage 5:** SIMS-2, the arrival check (E6).
> - **Patterns the pilot uses that the showcase should show first** (scenario work, no engine change): an NPC whose only need is met by its own post object, so it takes part without moving, and which prints through the `needs: { print: { producer, forget: true } }` command from a mapping (Gary, option (a)); a coupled break, where a mapping on `npc_left_post:<a>` with a `targetId` condition sets `<b>`'s matching need low so the two meet at one capacity-2 chatter object; and one pool line per speaker per break with `chatterCooldownMin: 2`, to confirm the rhythm in 6.4 reads as conversation rather than noise; and the `room_entered` break with a 120 s cooldown.
> - **Not needed by the pilot:** SIMS-4 (E3, vending and Keith; vending is E2 and lands after the pilot), SIMS-5 (the leftover pizza, for m06), and the backlog SIMS-6 to SIMS-8.
> - **Showcase rows to retire.** The showcase plan's m02 rows (its section on what each mission needs) describe an earlier pilot: Gary walking to a kettle and copier, `officeType: "fridge"` on the undercounter fridge, `hush` pools, and a second NPC reaching IT through a door. This pilot uses none of these with Gary option (a), so SIMS-3 need not prove them for m02; Neil's walking pattern stays as evidence for Gary option (b) and for later missions.

### 2.2 Where this plan departs from the quoted text, and why

- **E1 runs in `test_needs_attack`, as SIMS-1.** OLMP's alignment list says so; its E1 row still says "SIMS-2 (`test_needs_sims`, ...)". The showcase is a neutral office with no combat beats, so the probe gets its own scenario, and its hostile-from-start NPC lives there too rather than in `test_npc_needs`. Request to the OLMP owner: make the E1 row read "SIMS-1, in its own `test_needs_attack` scenario".
- **E6 is SIMS-2, about 75 lines, not 50.** The distance guard, the move ids through the world's `moveTo` and `cancelMove`, and checks in three arrival paths need more than the earlier estimate (5.2).
- **Slice numbers after SIMS-2 differ from OLMP's "Not needed" list.** Here SIMS-5 is E3, vending and the reception, SIMS-6 the pizza, SIMS-7 the private office, and the backlog is SIMS-8 to SIMS-12. Request to the OLMP owner: renumber that bullet when OLMP is next touched.
- **The retired m02 rows stay in the showcase.** Allow and deny leashes, `officeType: "fridge"`, `hush` and print and forget are built behaviours the showcase must show (the brief: every built behaviour visible), and Leila's walking pattern is OLMP's "evidence for Gary option (b) and for later missions". They move to SIMS-4 and are not counted as m02 proof.

### 2.3 What each mission needs, and where it is proved

| Mission (rollout order) | Needs proved first | Where | Slice |
|---|---|---|---|
| m02 (pilot), before its design closes | E1: a needs NPC attacked and knocked out outside its post room, KO globals, tasks and held-item drops once, reload; hostile from the start; protection 3; a sight catch on a walking needs NPC (Gary's `on_cabinet_picked`); a knocked-out partner whose partner's next coupled break goes ahead alone (OLMP 6.11 step 2); a Gary (a) NPC knocked out before its print, which prints nothing (step 3) | `test_needs_attack` | SIMS-1 |
| m02, before its stage 5 | E6: an arrival counts only where the NPC is | every needs scenario | SIMS-2 |
| m02, the patterns | Gary (a): one need met by the own post object, `seat: "stand"`, `swivel: false`, a command print with `forget: true` from `conversation_closed` with `delayMs`, the room kettle `affordance: false`, a 2 px stillness proof; the staff-room pair: tile homes at table chairs, coupled breaks, `chatterCooldownMin: 2`, the boiler (`officeType: "kettle"`, `useSeconds: 30`, `restores: 40`, `queue: false`) and cooler (`useSeconds: 25`, `restores: 40`), the `room_entered` break with a 120 s cooldown, an exchange on the lower id's list, OLMP 6.4's exit test; `roomToneTypes` | Neil in the IT room; Keith and Jodie in the facilities office | SIMS-3 |
| E2 (after the pilot, before m06) | vending presets | reception | SIMS-5 |
| m06 | a magnet seen, not announced, from an in-world source, drawing a desk NPC away and opening a screen-habit window; servings across a reload; print and forget with fetch errands from real desks; a pair whose chatter happens in a working office | the pizza and Nisha; Leila and Nisha | SIMS-4, SIMS-6 |
| m05, m08 | E3 above 8 needs NPCs; needs confined to one room (m05's Lisa, m08's off-duty agent) | 13 needs NPCs; Andrés, Siân, the pair | SIMS-5 |
| m01, m03, m04, m07 | coffee and cooler, cake, `avoids`, screen-lock habits, an exchange at a coffee point, a kettle with needs confined to one room | shown now, or by SIMS-3 and SIMS-4 | none new |
| m09, m10 | Tier 0 | nothing | none |

---

## 3. The showcase: a small office day

### 3.1 What stays fixed

- The three rooms (`office`, `kitchen`, `lounge`), the six NPCs (`amara`, `tom`, `grace`, `sanjay`, `rosa`, `marek`), every object id, global and task id keep their numbers, seed (`npcNeedsSeed: "test_needs_sims"`), positions and the start position (5,6). The README's live-proof tables and the node fixture (`test/js/fixtures/needs-sims-world.mjs`, `GOLDEN_SIMS_DAY`) hold. Nothing is renamed.
- Every new room is private to its own staff (`needsPrivateTo`), and every new NPC is leashed away from the office, kitchen and lounge, with every source of its needs inside rooms it may use. No office NPC can walk to a new source and no new NPC to an old one, so the README's office beats (coffee contention, the kitchen fallback, the queue, the outcast, the cake) log the same with every door open. Each slice re-runs them.
- Files that read this scenario and must keep passing: `test/js/npc-left-behind.test.mjs`, `test/js/npc-needs-slots.test.mjs` (`GOLDEN_SIMS_DAY`), `test/js/npc-needs.test.mjs`, `test/js/npc-needs-tick-cost.test.mjs`, `test/js/npc-desk-phone.test.mjs`, `test/js/table-drop.test.mjs`, `test/js/validator-office-presets.test.mjs` (asserts the exact preset object list at 84-93; updated in SIMS-3, 4, 5 and 7), `test/js/inventory-menu.test.mjs` (the droppable items at 30-60; updated in SIMS-6), `test/js/npc-voiced-chatter.test.mjs` (reads the compiled ink, 22), `test/unit/format_8a_corpus_test.rb` and `test/js/format-8a-reader-parity.test.mjs` (frozen renders in `test/fixtures/format_8a/`), and `tools/playtest/needs-baseline-capture.js` (its visit list stays valid). Hacktivity's tests load `test_objectives` and `test_simple_success`, not this scenario.
- The scenario stays ERB-free (the format corpus test needs a deterministic parse).

### 3.2 Rooms

`python3 scripts/check_door_alignment.py` passes for this layout, run on a scratch copy of the current scenario with the four rooms and connections added: office south (48,288) = reception north (48,288); IT south (48,32) = office north (48,32); IT west (16,-176) = private office east (-16,-176); facilities west (336,-176) = IT east (304,-176); the kitchen and lounge pairs are as now.

```
 manager_office (room_ceo) ── west ── it_room (room_it) ── east ── facilities_office (room_security)
                                         │ south door
           kitchen (room_break) ── office (room_office, start) ── lounge (room_meeting)
                                         │ south door
                                    reception (room_reception)
```

| Room id | Map | Connections | Private to | Role |
|---|---|---|---|---|
| `office` (start) | room_office | west kitchen, east lounge, **north it_room, south reception** | nobody | the open-plan floor and its print corner (the office copier, five slots, the Print Queue note), as now |
| `kitchen` | room_break | east office | nobody | as now, plus a mug of coffee for the player |
| `lounge` | room_meeting | west office | Rosa, Grace | the meeting room, which Rosa uses as her team room; plus the leftover pizza on the table (SIMS-6) |
| `it_room` (new) | room_it | south office, east facilities_office, west manager_office | `["neil", "leila", "nisha"]` | IT support: Neil at his bench, Leila at her desk, the boiler, the copier with four slots, a fridge, an empty cooler |
| `facilities_office` (new) | room_security | west it_room | `["keith", "jodie", "nisha"]` | facilities: Nisha's desk; Keith and Jodie waiting for jobs on the radio on the waiting chairs; their own boiler, cooler and microwave |
| `reception` (new) | room_reception | north office | `["andres"]` | the front desk: Andrés standing at the counter, the reception phone, the courtesy phone, the vending machines (SIMS-5) |
| `manager_office` (new) | room_ceo | east it_room | `["sian"]` | the head of facilities' private office: her laptop, desk phone, own coffee station and own printer (SIMS-7) |

Why these maps. `room_it` is the generic IT room (m01, sis02, test_access_signin); its lock pick, keys, safes and VM launchers are conditional and appear only when claimed. `room_security` is a plain two-desk office with filing cabinets, a chalkboard and six waiting chairs, no sign or logo. `room_reception` and `room_ceo` carry no logo and are both in `js/data/room-tones.json`. Rejected: `room_zds_reception`, `room_qdc_lobby`, `room_aes_reception` and `room_hq_lobby` carry a mission's wordmark; `small_room_1x1gu` has nine floor tiles.

**Reception has no staff side.** Its counter (`reception_table1`, tiles 2.4 to 7.8, row 2.8) stands against the back wall. Andrés is a front-of-house officer who stands at the counter's east end facing the waiting chairs, which reads as a guard at a front desk, not a visitor.

**Overlaps.** The facilities office (x 320 to 640, y -256 to 64) overlaps the lounge's top two tile rows, and the private office (x -320 to 0) overlaps the kitchen's, with no door between them. Walking "behind" a back wall is the intended 3D effect and stays open; step 1 of SIMS-3 and SIMS-7 confirms the walls draw, the fade works and nothing is usable across the overlap.

**Room tone.** `room_it` maps to `it`, `room_reception` to `reception`, `room_ceo` to its own entry. `room_security` is not in the table, so SIMS-3 adds `"roomToneTypes": { "room_security": "quiet_office" }`, the mechanism m02 uses for its hospital rooms.

**When each room's life starts.** Only loaded rooms exist (E4); a room loads when its door is first opened and stays loaded.

| Room | Reached | Life starts |
|---|---|---|
| office | at load | Amara, Tom, Grace, Sanjay, Marek |
| kitchen, lounge, reception | one door | when opened; Rosa with the lounge, Andrés with reception |
| it_room | one door (north) | when opened; Neil and Leila |
| facilities_office, manager_office | two doors (north, then east or west) | when opened; Keith, Jodie and Nisha, or Siân. IT is always loaded first, so every target of Nisha's exists from her first tick |

**Not built, and why.** An outside or smoking area: no outdoor map without mission branding (`room_m09_dock` carries Mountain States bay signs, `room_m10_forward` is a military gravel yard) and no ashtray, bench or shelter sprite exists; it is an art request (6.4). A separate print room: the office copier corner already carries the print beats, and the only 10 by 6 candidate, `room_lw_postroom`, has Ledgerwell signage.

### 3.3 Objects added

Positions are starting tiles, square to the walls, one or two angled props per room at most. Step 1 of each room's slice renders the room with `tools/playtest/room-snapshot.mjs`, lists every drawn item and moves any object that sits on furniture or within two tiles of a doorway's approach. Queue and approach cells stay out of all doorways. Doors on 10 by 10 rooms: north and south at tile column 1.5, east and west at row 2.5.

**it_room (SIMS-3 and SIMS-4):**

| Id | Type | Fields | Purpose |
|---|---|---|---|
| `neil_mug` | office-misc-cup3, on the middle south-wall bench (smalldesk2, about (4.6, 9.0)) | not takeable; observation "Cold. Nobody has drunk from it since lunch."; `affordance: { satisfies: "caffeine", restores: 30, useSeconds: 4, capacity: 1, useSound: "drink_gulp", seat: "stand", private: true, owners: ["neil"], useFrom: <the cell Neil's tile home snaps to> }` | Neil's post (Gary (a)) |
| `it_boiler` | hot_water_boiler1, east wall below the door, about (8.4, 6.0) | `officeType: "kettle"`, `affordance: { capacity: 2, chatter: "tea" }` | the IT tea point (SIMS-4) |
| `it_fridge` | undercounter_fridge1, about (8.4, 7.5) | `officeType: "fridge"` (the fridge preset lists only `qdc_fridge1`) | Leila's and Nisha's hunger |
| `it_cooler_empty` | water_cooler1, east wall south end, about (9.0, 8.6) | `affordance: false`, name "Empty Water Cooler", observation "The bottle has been empty for a week." | a declared preset type kept out (Gary's kettle in m02) |
| `it_copier` | photocopier1, west wall below the waiting chairs, about (0.9, 7.6), clear of the south door's approach (columns 1 to 2) | copier preset, `uncollectedAfterSeconds: 180` | all IT prints |
| `it_out_a` to `it_out_d` | notes1 on the copier tray | `outputOf: "it_copier"`, `revealOnGlobal: "it_out_<x>_shown"`, `needsTag: "printout"`, readable, neutral IT text (a toner order, a patch note, a desk move list, a training reminder; no account, address, password or code); `a` and `b` takeable | Neil's command print, the paper leak |
| `leila_pc` | pc12 (claims the lower desk's conditional PC at (5.5, 5.3)) | `officeType: "desk_pc"` (pc12 has no preset), `workstation: true`, `screenOwner: "leila"`, `lockChance: 1` | Leila's post |
| `leila_chair` | chair-white-1-rotate6 (claims the conditional chair at (5.5, 6.8), below that desk) | none | her seat |
| `tea_round_note`, `it_print_queue` | notes1 | readable, names "Tea Round", "IT Print Queue" | levers (SIMS-4) |

**facilities_office (SIMS-3, SIMS-4, SIMS-6):** `facilities_boiler` (hot_water_boiler1 on the back wall's east end, about (8.5, 1.6); `officeType: "kettle"`; hand-written `affordance: { capacity: 2, chatter: "tea", queue: false, useSeconds: 30, restores: 40, private: true, owners: ["keith", "jodie"], useFrom: <floor cell below> }`); `facilities_cooler` (water_cooler1 on the east wall, about (9.0, 4.2); cooler preset with `useSeconds: 25`, `restores: 40`, `private: true`, `owners: ["keith", "jodie"]`); `facilities_microwave` (microwave1 on the back wall west of the boiler, about (7.6, 1.8); microwave preset, same owners); `nisha_pc` (pc5, claims the left desk's PC at (2.8, 3.8); `officeType: "desk_pc"` (pc5 has no preset), `workstation: true`, `screenOwner: "nisha"`, `lockChance: 0`, `autoLockSeconds: 90`); `facilities_print_queue` (notes1, "Facilities Print Queue", the lever for Nisha's print, SIMS-4). The right desk's PC stays unclaimed (the conditional `pc5` at (6.1, 3.8) is not drawn).

**reception (SIMS-5):** `reception_phone` (phone1, claims the drawn phone on the counter; `officeType: "desk_phone"`, `phoneOwner: "andres"`); `courtesy_phone` (phone2 by the waiting chairs, about (1.0, 6.0); name "Courtesy Phone"; an `emit_event` of `desk_phone_ring:reception_phone`, as `spare_phone` does at sims.erb:199-205); `reception_snacks` (vending_machine1) and `reception_drinks` (drinks_vending1) on the east wall at about (8.9, 6.2) and (8.9, 7.6); `vending_note` (notes1, "Vending Restocked", the lever).

**manager_office (SIMS-7):** `sian_laptop` (laptop, claims the conditional `laptop6` on the executive desk at (4.3, 3.4); `workstation: true`, `screenOwner: "sian"`, `screenHabit: { lockIfAwayOverSeconds: 20 }`); `sian_phone` (phone3, claims the conditional phone at (5.6, 3.3); `officeType: "desk_phone"`, `phoneOwner: "sian"`); `sian_coffee` (coffee_station1 on the west wall below the sofa, about (0.9, 7.0)); `manager_printer` (photocopier1 on the back wall's west end, about (1.6, 2.2), clear of the east door; `offWhen: "manager_printer_off"`); `manager_printer_socket` (wall_socket1 beside it; toggles `manager_printer_off`, as `office_copier_socket` does); `call_facilities_note` (notes1 in the IT room, "Call Facilities", emits `desk_phone_ring:sian_phone`).

**kitchen (SIMS-4):** `kitchen_cup` (office-misc-cup2, "Mug of coffee", takeable, on a kitchen table): a player consumable. The map cups in the new rooms (three in room_IT, two in room_security) are drinkable too (`DRINKABLE_CUPS`, consumables.js:80-88); nobody reacts, and the README says so.

**lounge (SIMS-6):** `leftover_pizza` (pizza_boxes1 on the meeting table; `takeable: true`, `droppable: true`, `affordance: { satisfies: "hunger", restores: 60, useSeconds: 15, magnet: { tempt: 30, servings: 2, perPerson: 1 } }`, no `announce`, no `needsTag`). Rosa and Grace have no hunger, so it draws nobody until the player moves it.

### 3.4 Cast

**Which sprites are free.** The project's rules (AGENTS.md "Characters", `README_scenario_design.md` "Every speaking character has their own art"): no two characters in one scenario share a sheet, and a named recurring character keeps its own art. A generic sprite worn by a one-off character elsewhere, or one players can pick, is free. Not free: `male_spy_v2` (Director Netherton in m02, m03, m05, m06), `male_hacker_hood_down_v2` (Agent 0x00 across the campaign), and the six sheets already in this scenario. `female_hacker_hood_v2` and `male_hacker_hood_v2` are free by the rule but are the player's own stand-ins (m01's "Agent", the labs' "Consultant", the default avatar), so they are not cast. That leaves nine, each with walk, 8 sit frames (one per direction), a headshot and a talk sheet or visemes:

| Sprite key | Worn elsewhere by | Look | Cast as |
|---|---|---|---|
| `offduty_agent` | m08 "Off-Duty Agent" (unnamed) | white Geordie man about 46, reading glasses, green jumper, lanyard | Neil |
| `junior_analyst` | m08 "Junior Analyst" (unnamed) | British-Indian woman about 25, maroon sweatshirt | Nisha |
| `female_hacker_hood_down_v2` | lab_tesseract_trials Megan Oyelaran (one-off); a player avatar | young woman with light olive skin, mustard hoodie, hood down | Leila |
| `security_guard` | m04, m10 "Guard" | white Bristol man, mid 50s, grey beard, hi-vis vest and radio | Keith |
| `female_telecom_v2` | sis02 Helen Marsh (one-off); a player avatar | young woman, brown ponytail, orange hi-vis utility vest | Jodie |
| `hashchain_guard` | m06, m10 "Checkpoint Guard" | British-Colombian man about 45, shaved head, bomber jacket, radio, clipboard | Andrés |
| `female_security_guard_v2` | m02 Val Okonkwo (one-off); a player avatar | woman in a dark uniform jumper | Siân (open question 1) |
| `male_security_guard_v2` | unnamed guards in test scenarios; a player avatar | man in a dark uniform | not cast |
| `courier_hivis` (walk only, no sit frames) | lab_physical_pentest's courier disguise | British South Asian man, early 30s, courier's hi-vis | not cast (backlog SIMS-12) |

A player who picked the same starter avatar as a cast member sees a twin; the six existing NPCs already carry that chance and it is accepted.

| Id | Name, role | Post | Leash | Needs (initial / decay per min / urgent at) | Other fields | Shows |
|---|---|---|---|---|---|---|
| `neil` (SIMS-3) | Neil Robson, IT support engineer, Geordie, mid 40s | `neil_mug`, standing at the south-wall bench | `needsRooms: ["it_room"]` | caffeine 60 / 6 / 45 (`neil_mug` only) | `swivel: false`; a mapping on `conversation_closed:neil` (below); `globalVarOnKO: "neil_ko"` | Gary (a): protection 1 in effect, a command print |
| `keith` (SIMS-3) | Keith Dando, caretaker, Bristol, mid 50s | tile home at the east waiting chairs' north seat, about (7.0, 5.9), facing west | `needsRooms: ["facilities_office"]` | caffeine 45 / 5 / 35, `jitterPct: 10`; thirst 95 / 3 / 30; hunger 70 / 2 / 30 (OLMP 6.4's porter) | `chatterCooldownMin: 2`; group `facilities_radio`; coupling and `room_entered` mappings | the staff-room pair |
| `jodie` (SIMS-3) | Jodie Kerr, maintenance engineer, Glaswegian, mid 20s | tile home at the east waiting chairs' middle seat, about (7.0, 6.7) | `needsRooms: ["facilities_office"]` | thirst 65 / 5 / 35, `jitterPct: 10`; caffeine 95 / 3 / 30 (OLMP 6.4's domestic) | `chatterCooldownMin: 2`; group `facilities_radio`; exchange `exchange_radio_wait` with `keith` (her id sorts first) | the staff-room pair |
| `leila` (SIMS-4) | Leila Haddad, IT service desk analyst, British-Lebanese, late 20s | `leila_pc` | `needsRooms: ["it_room"]` | caffeine 70 / 8 / 40 (`it_boiler`), work 80 / 10 / 50 (`leila_pc`), hunger 75 / 3 / 40 (`it_fridge`) | `printHabit: { fetchAfterSeconds: [30, 90], forgetChance: 0.5, shareAfterSeconds: 240 }`; `onUse: { leila_pc: { revealOutput: "it_copier" } }`; group `it_tea`; `tea` pool with `hush`; exchanges `exchange_leila_tea`, `exchange_leila_page_gone` with `nisha` | protection 2 on a walker, allow leash, print and forget, the paper leak, gated exchanges, `hush`; Gary (b) evidence |
| `nisha` (SIMS-4) | Nisha Kapoor, facilities coordinator (apprentice), early 20s | `nisha_pc` | `needsAvoidRooms: ["office", "kitchen", "lounge"]` | caffeine 72 / 8 / 40 (`it_boiler`), work 85 / 10 / 50 (`nisha_pc`), hunger 70 / 3 / 40 (`it_fridge`, first urgent 10:00 after her room loads, so she is inside the pizza's tempt band until then; the pizza in SIMS-6) | `printHabit: { fetchAfterSeconds: [20, 60], forgetChance: 0 }`; `onUse: { nisha_pc: { revealOutput: "it_copier" } }`; group `it_tea`; `tea` pool with `hush` | deny leash, a second room through a door, print errands, a careless screen (m06) |
| `andres` (SIMS-5) | Andrés Mejía, front-of-house officer, mid 40s | tile home at the counter's east end, about (8.4, 3.2), standing (`seated: false`) | `needsRooms: ["reception"]` | hunger 62 / 3 / 40 (`reception_snacks`), thirst 72 / 4 / 40 (`reception_drinks`), social_media 70 / 6 / 40 (the phone) | `answersPhones` not set; `phoneCalls: [{ "knot": "call_front_desk" }]` | vending, a phone break, a voiced call, needs in one room (m05, m08) |
| `sian` (SIMS-7) | Siân Pryce, head of facilities, Welsh | `sian_laptop` | `needsRooms: ["manager_office"]` | work 80 / 8 / 50 (`sian_laptop`, judged), caffeine 70 / 6 / 40 (`sian_coffee`) | `workNeeds: ["+manager_printer"]`, `frustration: { perFail: 34 }`, as test_access_work's staff; `phoneCalls: [{ "knot": "call_supplier" }]` | a private office, work against a resource, frustration, the outage kick, a check visit, a call answered or rung out |

Neil's print mapping: `{ "eventPattern": "conversation_closed:neil", "condition": "globalVars.neil_print_asked === true && globalVars.neil_ko !== true", "onceOnly": true, "delayMs": 6000, "needs": { "print": { "producer": "it_copier", "forget": true } } }`. `neil_print_asked` is set in his ink when the player asks for the change log. A command print with `forget: true` reveals a slot at once and is never fetched (OLMP 2, "Staying put while taking part").

The pair's mappings, as OLMP 6.4: on Jodie, `{ "eventPattern": "npc_left_post:keith", "condition": "data.targetId === 'facilities_boiler'", "needs": { "set": { "caffeine": 20 } } }`; on Keith, `{ "eventPattern": "npc_left_post:jodie", "condition": "data.targetId === 'facilities_cooler'", "needs": { "set": { "thirst": 20 } } }` and `{ "eventPattern": "room_entered:facilities_office", "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }`. None is `onceOnly`, so none writes anything.

Groups. `facilities_radio` and `it_tea` mirror the pilot's `night_staff`. The two groups never meet at one object (every chatter object is private to one pair), so no pairing is refused by group; the showcase shows a refused pairing through `avoids` (Sanjay and Marek), which runs through the same `_compatible` (3844).

Cast mix across thirteen: seven women and six men; heritage Nigerian, English, Swedish, Indian, Hispanic, Polish (the six), Geordie, West Country, Scottish, Welsh, British-Indian, British-Lebanese, British-Colombian (the seven); ages early 20s to mid 50s. Four of the seven new people are white, which is what the free art allows; a new character from the art request list (6.4) would widen it. Names and heritage follow the concept prompts and can change without touching an id; Siân's age is set from her sprite at step 1. Every new NPC gets a `voice` with a style line, and a short ink story (a greeting, two choices, a parting line).

### 3.5 The day on the needs clock

There is no game clock in the main slices. Times are needs-clock minutes after the NPC's room loads. The clock advances with each frame's delta, capped at 1 s per frame (`update` 606), so it keeps pace with wall time headless above 1 fps; proofs read `npcNeedsSystem.clockMs`. Initial levels have no jitter except Keith's caffeine and Jodie's thirst (10 %, fixed by the seed).

| After the room loads | Without levers | Slice |
|---|---|---|
| IT, 0:00 to 2:30 | Neil stands at his bench; at 2:30 he sips from his mug without a step (cup icon, quiet sound), then every 5:00 (60 restored to 75, back to 45 at 6 a minute) | SIMS-3 |
| facilities, about 2:00 (1:06 to 2:54 by jitter) | Keith's tea: he leaves for the boiler; the coupling sets Jodie's caffeine to 20 and she follows; 30 s at the boiler, so the second arrival overlaps the first by 20 s or more; the first time, `exchange_radio_wait` plays; afterwards one pool line each per break. A shared break about every four minutes, alternating boiler and cooler | SIMS-3 |
| IT, 3:00 | Leila's first work use at her desk: a print lands on the tray; she fetches it 30 to 90 s later or forgets it (half the time); a forgotten page logs `npc_print_uncollected:leila` at 180 s and becomes anyone's at 240 s | SIMS-4 |
| IT, 3:45 | Leila's tea at the IT boiler, with a `leashed` event | SIMS-4 |
| facilities, 3:30 and 4:00 | Nisha's work use and print (she walks to IT 20 to 60 s later to fetch it); her tea at the IT boiler | SIMS-4 |
| reception, 4:00 to 8:00 | Andrés checks his phone at the desk (5:00), buys a snack (7:20) and a drink (8:00) | SIMS-5 |
| private office, 3:45 | Siân's work use at her laptop; caffeine at 5:00 | SIMS-7 |

The levers (section 7) bring each beat forward, so the README tour never waits on these times.

---

## 4. Every built behaviour, where and when

Rows refer to table 1.1. "Now" means already in the scenario.

| Row | Behaviour | Where | When, and the lever |
|---|---|---|---|
| 1, 2, 3 | needs, posts, presets, `officeType`, `affordance: false` | every room; boilers, fridge, `pc5`, `pc12`, phones; `it_cooler_empty` | all day |
| 4 | leash, allow and deny | Neil, Keith, Jodie, Leila, Andrés, Siân (allow); Nisha (deny) | each new NPC's first source search away from its post emits `npc_needs_leashed`; `skipped` names office sources whenever they are free |
| 5 | private rooms and objects | lounge (now), the four new rooms, the pair's boiler and cooler | all day |
| 6, 18 | carry jobs, left-behind | now | the parcel, the mugs, Tom's badge |
| 7, 24, 55, 56 | slots, print and forget, sharing, paper leak | office and kitchen copiers (now); `it_copier` | the IT Print Queue note, then take Leila's page before her fetch is due |
| 8 to 13 | icons, bubbles, items in hand, seating, typing, swivel | every NPC in the player's room; the pair seated on waiting chairs from tile homes | all day |
| 14, 59 | own-post use; caught at the desk; an NPC that takes part without moving | any owned desk; Neil's mug | the player stands at a desk as its owner returns; Neil sips at his bench |
| 15 to 17 | lock decisions and cues | office PCs (now); Leila always locks; Nisha never does and her PC auto-locks after 90 s; Siân locks after 20 s away | every leave |
| 19, 22, 23, 60, 61, 62 | chat, pools, `hush`, exchanges, coupled breaks, cooldown, the entry break | kitchen cooler (now); facilities boiler and cooler (the pair); `it_boiler` (Leila and Nisha) | breaks on their own; walk into the facilities office; the Tea Round note |
| 20, 21 | queues, avoidance | office and kitchen coffee (now); the vending machines | Activity Board, Coffee Notice (now); Vending Restocked |
| 25, 36 | `offWhen`; work judged against a resource, frustration, kick, check visit | sockets (now); the manager's printer | switch off `manager_printer_socket` |
| 26 to 29, 58 | cake with announce, table landing; a magnet seen only, starting in a room | now; `leftover_pizza` | drop the cake; carry the pizza to the facilities office |
| 30 | desk phones | now; reception; private office | the spare phone (now), the courtesy phone, the Call Facilities note |
| 31 | room tone and `roomToneTypes` | every room | all day |
| 32 to 34 | heard use sounds, freeze and yield, overlay | everyone | all day |
| 35 | player consumable | `kitchen_cup`, map cups | pick up, use from the inventory |
| 38 | social media on the phone | Andrés | on its own, about every 5:00 |
| 48 | E1 | test_needs_attack (SIMS-1) | the probe |
| 49, 50 | vending; E3 | reception; the whole showcase (SIMS-5) | Vending Restocked; the perf tool |

Rows 37, 39 to 42, 54 and 57 stay in their own floors (1.2).

---

## 5. Build slices

Order: SIMS-1 and SIMS-2 (both before the pilot's dates in 2.1), SIMS-3, SIMS-4, SIMS-5, SIMS-6, SIMS-7; then the backlog only when a mission's design or the user asks. SIMS-1 touches no engine file and can run beside SIMS-2; from SIMS-2 on, slices run one at a time, because each touches `npc-needs.js` or the showcase.

**Every slice ends the same way.** Node tests through `bin/test-js`; `ruby scripts/validate_scenario.rb` with 0 errors on every scenario it touches; ink compiled; `check_door_alignment.py` on any new door; the scenario README's annotated example, live-proof table and tour rows; the slice's own files committed (explicit paths, `git diff --cached --stat` checked) before any live run, with fixes as follow-up commits; then the live proof on a keyless server, headless, after dismissing popups: if `loop.actualFps` is below 10, switch Phaser's rAF to setTimeout mode; then `g.loop.smoothStep=false; g.loop.minFps=1; world.setFPS(20)` with fixed steps on (never `fixedStep=false`). The E3 measurement is the exception: normal frame rate under a virtual display (xvfb), never a visible window. A proof that fixes a fault first reproduces it on the build as it stands. Sizes count engine, validator and schema lines, not tests or scenario data. A new static import in an engine module goes in each JS test harness copy list. Each slice's report lists its new spoken lines.

**The standard node set**, run by every slice: `test/js/npc-needs.test.mjs`, `npc-needs-slots.test.mjs`, `npc-needs-tick-cost.test.mjs`, `npc-room-leash.test.mjs`, `npc-magnet.test.mjs`, `npc-left-behind.test.mjs`, `npc-desk-phone.test.mjs`, `npc-coffee-off.test.mjs`, `npc-expected-away-route.test.mjs`, `table-drop.test.mjs`, `seating.test.mjs`, `workstation-state.test.mjs`, `office-presets.test.mjs`, `validator-office-presets.test.mjs`, `validator-npc-leash.test.mjs`, `inventory-menu.test.mjs`, `npc-voiced-chatter.test.mjs`, `consumables.test.mjs`, `format-8a-reader-parity.test.mjs` (all under `test/js/`), and `ruby test/unit/format_8a_corpus_test.rb`. **The standard live set**: test_needs_leash (leashed and unleashed runs), lab_physical_pentest (its three beats), test_access_work (judged uses end through the same arrival code), and the README's office beats in test_needs_sims with every door open.

### 5.1 SIMS-1: E1, attacked and knocked-out needs NPCs, in `test_needs_attack`

- **Purpose.** OLMP E1 before m02's design closes: the answer decides which NPCs may move in missions that allow attacks. It also proves protection 3, a sight catch on a walking needs NPC (Gary's `on_cabinet_picked`), and OLMP 6.11 steps 2 and 3.
- **Scenario** `scenarios/test_needs_attack/` (new; mission.json, ERB-free scenario.json.erb, ink, README). Rooms: `office` (room_office, start), `kitchen` (room_break, west), `back_room` (room_meeting, east). `officePresets: true`. Each NPC has a short ink story and a `voice`; sprites are one per NPC.
  - `ava` (junior_analyst): post `ava_pc`; interest `dirty_mugs` (weight 3) carrying `office_mugs` to the kitchen's `washing_up_tray`; also `itemsHeld: [{ "id": "ava_folder", "type": "notes1", "name": "Ava's Folder", "takeable": true }]`; `globalVarOnKO: "ava_ko"`, `taskOnKO: "check_ko_drop"`.
  - `ben` (offduty_agent): post `ben_pc`; thirst 60 / 20 / 40 at the kitchen `water_cooler` (no thirst source in the office); `itemsHeld: [{ "id": "ben_notebook", "type": "notes1", "name": "Ben's Notebook", "takeable": true }]`; `globalVarOnKO: "ben_ko"`, `taskOnKO: "check_held_drop"`; protection 3: a mapping on `object_interacted` with `data.objectName === 'Meeting Note'` and `patrolOverride.targetTile` at his post tile, `completeTask: "check_called_home"`, and `"needs": "resume"` on `data.objectName === 'Meeting Over'`.
  - `cal` (hashchain_guard): in `back_room`, `behavior.hostile: true` from the start, with `needs` and `needsHome`.
  - `dee` (security_guard): post `dee_pc`, `needsRooms: ["office"]`, caffeine 60 / 20 / 40 at an office coffee station, `los: { "enabled": true, "range": 400, "angle": 360, "visualize": false, "occlusion": false }`, and a mapping on `lockpick_used_in_view` with `targetKnot: "on_drawer_picked"`, `conversationMode: "person-chat"`, condition `data.lockable.scenarioData.id === 'dee_drawer'`, `onceOnly: true`, `completeTask: "check_caught_walking"`. `dee_drawer` is a key-locked, pickable `filing_cabinet` in the office.
  - `eli` (male_office_worker_v2), Gary (a): `needsHome: "eli_mug"` (a mug affordance as `neil_mug`), one need, `swivel: false`, the print mapping on `conversation_closed:eli` with `condition: "globalVars.eli_ko !== true"`, `delayMs: 6000`, `forget: true`, to an office copier with one slot `eli_page`; `globalVarOnKO: "eli_ko"`.
  - `fran` (female_office_worker_v2) and `gil` (male_nerd_v2): tile homes at the kitchen table chairs, `needsRooms: ["kitchen"]`, coupled breaks at a kitchen kettle (`capacity: 2`, `chatter: "tea"`) and the cooler, with the OLMP 6.4 mappings; `globalVarOnKO: "fran_ko"` and `"gil_ko"`.
  - Notes `meeting_note`, `meeting_over`, and "Break Time" (sets Ben's thirst, Dee's caffeine and Gil's caffeine to 10; cooldown 30 s).
  - Aim `checks` with tasks `check_ko_drop`, `check_held_drop`, `check_called_home`, `check_caught_walking`, `check_solo_break` (`npc_left_post:gil` with condition `globalVars.fran_ko === true`). The calm-down and walk home are read from the decision log.
- **Behaviour under test.**
  (a) Ava attacked in the kitchen mid-carry: she turns hostile (`player-combat.js:456`), the needs system blocks her (`isAvailable` 1086, the abort in `_tickNpc` 1273-1281 drops the mugs as an abort does), she calms down and on `unblocked` walks home and resumes.
  (b) Ava knocked out there mid-carry: the job ends once; `ava_ko` and `check_ko_drop` fire once; `onKnockedOut` (566) runs; the folder drops once where she fell. The carried mugs are not in her `itemsHeld`, so the server's KO-drop gate (`add_item_to_room!` game.rb:489 calling `find_npc_held_item` 1151) is expected to refuse them: after a reload the folder is there once and the mugs are gone. That is recorded as the expected E1 result for carry-job items ("a carried world object does not survive a knock-out"), not a failure; if the mugs persist, how is recorded.
  (c) Ben knocked out at the kitchen cooler: the notebook drops once where he fell; the server accepts it outside his scenario room only once the defeat is recorded (game.rb 486-523); after a reload he stays down and the notebook is there once.
  (d) Ben at the cooler when the Meeting Note is read: the patrol override walks him home and suspends needs; Meeting Over resumes them.
  (e) Cal never starts a job: registered, blocked from the first tick.
  (f) Dee walking to the coffee when the player picks `dee_drawer`: the catch fires, her conversation opens, she freezes for it, then finishes or restarts her coffee and returns to her post; her conversation opens again later.
  (g) Fran knocked out mid-walk to the cooler: `fran_ko` once; Gil's next coupled break (Break Time) goes ahead alone (`check_solo_break`), and he never waits for her.
  (h) Eli knocked out before the player has talked to him: no conversation closes, `eli_page` is never revealed, and a reload reveals nothing.
- **Engine.** None. A failing check goes to the user as an engine item with its file:line (likely `_abortJob` 3700 on a knock-out mid-carry, or world `dropHeld`). Until it is fixed, missions keep needs NPCs inside their own post room (OLMP's fallback).
- **Schema and validator.** Nothing new. 0 errors; any warning on Cal (hostile from the start with needs) is recorded in the README as intended.
- **Node tests.** `test/js/npc-needs.test.mjs`: an NPC hostile from tick 0 never starts a job and logs `blocked` once; a coupled partner of a knocked-out NPC starts its break alone. `test/js/npc-needs-attack-scenario.test.mjs` (new): the validator on `test_needs_attack` gives 0 errors; Ben's cooler and Ava's tray are outside their post rooms; Eli's only need target is his own post object.
- **Live proof.** `tools/playtest/needs-attack-probe.mjs` (new): for each of (a) to (h), drive the beat through the test bridge, sample state, behaviour, hostility and position every 250 ms for 60 s, dump the server's game state (`npcHostility`, KO records, room `objects_added`), reload, dump again. Screenshots: before, hostile, down with the dropped item, after the reload, Dee's conversation opening mid-walk, Gil alone at the kettle.
- **Regressions.** The standard node set; the standard live set.
- **Size.** 0 engine lines; scenario about 400 lines, 7 ink files, probe about 220.
- **Sync.** Existing records only: up to 7 `npcHostility` entries (one per attacked NPC); KO records and KO globals for Ava, Ben, Eli, Fran and Gil (5 booleans); at most two `objects_added` entries (the folder and the notebook always; the mugs only if a carry-job KO drop is accepted), deduplicated by id; 5 `triggeredEvents` keys for the `onceOnly` task mappings and 1 for Eli's print. Each is sent once as a delta. Nothing grows with play time; a reload replays nothing.

### 5.2 SIMS-2: an arrival counts only where the NPC is

- **Purpose.** Remove the fault in 1.3: a needs NPC entering `using` for a target it never reached.
- **Step 1, find the path.** Add one log line on every owner-`needs` arrival in `onArrived` (630): `arrival { moveId, fromSeating, pathLeft, dist }`, with `dist` to the behaviour's `_goToStayDest` and `fromSeating` from the move's options. Run `tools/playtest/needs-baseline-capture.js` on the build as it stands, in a loop with a fresh seed each time, until an `using` entry more than 48 px from its approach cell appears, and record which arrival caused it. This line stays (it is cheap and the next fault will want it).
- **Behaviour.**
  1. **Distance first.** A needs arrival counts for a job phase, a queue step or a walk home only if the NPC is within 48 px (one and a half tiles) of that move's destination. A farther arrival is logged `arrival_far { phase, target, x, y, dest, moveId }` and the move is re-issued once; a second far arrival in the same phase fails the job with `arrival_far` and the NPC walks home.
  2. **Move ids second.** Every move the needs system issues carries a `moveId` (a counter on the system); the behaviour echoes it in `npc_arrived`; an arrival whose id is not the current phase's is logged `arrival_ignored { moveId, want }` and dropped. Seating's moves carry none and are dropped by the needs system (seating tracks its own fetch phases).
  3. Own-desk shortcuts, where `_moveForPhase` (3080) queues the arrival itself, are unchanged. The returning branch (`s.mode === 'returning' && arrived`, npc-needs.js:1326) gets the same distance check, so an early arrival never sets `atPost` away from the post.
- **Engine.** `npc-behavior.js`: `goToAndStay` (2980) stores `opts.moveId` as `this._moveId`; `_triggerGoToStayArrival` (3064) adds `moveId` to the payload and clears it; `cancelMove` (3038) clears it. `npc-needs.js`: the world's `moveTo` (5088) passes `opts.moveId` into the options it builds; `onArrived` (630) takes the payload's `moveId` and the NPC's position; `installNpcNeeds` passes `data.moveId` from the `npc_arrived:*` listener; `_advanceJob` (3119), `_advanceQueued` (4408) and the returning branch of `_tickNpc` check distance and id. `seating.js`: none.
- **Schema and validator.** None. Scenario mappings on `npc_arrived:<id>` see one extra payload field.
- **Node tests.** `test/js/npc-needs.test.mjs`: a matching arrival 200 px off is re-issued, then counts when near; two far arrivals fail with `arrival_far`; an arrival with another move's id is ignored; one with no id is ignored; an early arrival while returning does not set `atPost`; a seated own-desk work job still starts at once. `test/js/npc-behavior-arrival.test.mjs` (new): `goToAndStay` with a `moveId` echoes it once; `cancelMove` clears it. `GOLDEN_SIMS_DAY` and the sims-day digest stay byte for byte the same.
- **Scenario.** No new data. The existing task `see_rest` (Grace on the sofa) is the objective this slice keeps ticking; the README gains a line under "Engine findings".
- **Live proof.** `tools/playtest/needs-arrival-proof.mjs` (new). First, on the build before the slice: reproduce the early path end by stubbing the behaviour's `_planMovePath` through the test bridge to return a path that ends at the lounge door for Grace's sofa move; the unfixed build enters `using lounge_sofa` at the door (screenshot and log). If step 1 found a natural path, reproduce that too. Then 20 natural runs forcing Grace's `rest` low each time she starts a chair fetch (`npc_fetching_chair`), and 20 of Tom's kitchen trips with the office coffee switched off. On the fixed build: the stubbed short path logs `arrival_far` and Grace walks on; every `using` entry is within 48 px of its cell. Screenshots: Grace on the sofa with her overlay, once per run.
- **Regressions.** The standard node set; the standard live set.
- **Size.** About 75 lines (npc-behavior.js about 10, npc-needs.js about 65).
- **Sync.** Writes nothing; move ids live only in the browser.

### 5.3 SIMS-3: the IT room and the facilities office, m02's patterns

- **Purpose.** OLMP's three patterns and the `room_entered` break (2.1), in neutral office form: Neil is Gary (a), Keith and Jodie are the staff-room pair.
- **Step 1, render.** Add both rooms with no NPCs; render with `tools/playtest/room-snapshot.mjs`; place `neil_mug`, `it_cooler_empty`, `it_copier` with its four slots, the facilities boiler, cooler and microwave; check doorways, the facilities-over-lounge overlap, and that the waiting chairs are reached from the pair's home cells (seating finds a chair from the home cell; if seating fetches one instead, set `seated: { fetch: false }`, which `seatPreference` (seating.js:1794) reads as `near`). Read Neil's snapped home cell through `window.__test.needs` and set `neil_mug`'s `useFrom` to it.
- **Step 2, data.** Rooms, the objects above, Neil, Keith and Jodie (3.4). Top level: `"roomToneTypes": { "room_security": "quiet_office" }`. Globals declared false: `it_out_a_shown` to `it_out_d_shown`, `neil_print_asked`, `neil_ko`, `heard_exchange_radio_wait`. Ink: `neil.ink` (hub; a choice asking for the change log sets `neil_print_asked`), `keith.ink`, `jodie.ink` (hub plus `exchange_radio_wait`, about 5 lines: waiting for the radio, a job called and not yet come through; neutral).
- **Spoken lines.** Keith: `tea` (4), `cooler` (4). Jodie: `tea` (4), `cooler` (4). No `hush` (their own room, their own break). Exchange about 5 lines; conversations about 10 lines each for Neil, Keith and Jodie. One line each, 40 characters at most, no `{ }`, no speaker prefix. About 51 lines.
- **Schema and validator.** No new fields. Expected output: presets for `it_copier` (copier), `facilities_boiler` (kettle through `officeType`), `facilities_cooler` (cooler), `facilities_microwave` (microwave); none for `it_cooler_empty`; Neil's leash with his only target his own post object; the pair's leash with every target in their room; the exchange found with both speakers voiced; no pool without a pair at a chatter object.
- **Node tests.** `test/js/validator-office-presets.test.mjs`: the sims list gains `facilities_boiler`, `facilities_cooler`, `facilities_microwave`, `it_copier`. `test/js/npc-needs-sims-validator.test.mjs` (new): the validator run above, line by line. `test/js/npc-needs.test.mjs`: an NPC whose only need target is its own post object never issues a move over 30 minutes of needs clock; the print command with `forget: true` reveals a slot and schedules no fetch; a coupled mapping sets the partner's need only when `targetId` matches; `chatterCooldownMin: 2` allows a pool line two minutes after the last.
- **Objectives** (new aim `watch_the_back_office`, `onceOnly` task mappings): `see_neil_sip` (`npc_used:neil_mug`), `get_neils_page` (`object_revealed:*`, condition `data.producerId === 'it_copier' && data.npcId === 'neil'`; emitted at npc-needs.js:5207), `see_shared_break` (`npc_chatted:facilities_boiler`; the event is keyed on the object), `hear_radio_wait` (`npc_exchange_heard:exchange_radio_wait`), `see_microwave` (`npc_used:facilities_microwave`).
- **Live proof.** `tools/playtest/needs-sims-back-office.mjs` (new).
  1. Neil: with the player in IT for 10 minutes of needs clock, his sprite stays within 2 px of his snapped home cell; his conversation opens at once at five random moments, including mid-sip; after the conversation in which he is asked, the copier runs about 6 s after the close and one slot is revealed; no fetch is ever scheduled.
  2. The pair, OLMP 6.4's exit test: with the player in the facilities office for 20 minutes, a shared break starts in at least one of any three 30-second windows, the two needs about four minutes apart in the decision log; on entry more than two minutes after the last shared break, a shared break starts within 10 s, and a pool line or exchange line is heard before the pair sit down again. Record whether the first entry (when the room loads and both register) starts one.
  3. Each sits on a waiting chair at home; the facilities office plays the quiet office bed.
  Screenshots: Neil sipping, the page on the tray, the pair at the boiler, the pair seated.
- **Regressions.** The standard node set; the standard live set.
- **Size.** 0 engine lines; scenario about 350 lines, 3 ink files, proof script about 200.
- **Sync.** 4 slot globals (at most one set in this slice), `neil_print_asked`, `neil_ko`, `heard_exchange_radio_wait` (each once), 5 `triggeredEvents` keys and 1 for Neil's print mapping. The coupling and entry mappings are not `onceOnly` and write nothing. Worst case 7 globals and 6 event keys; nothing grows with play time; a reload restores them and replays no beat.

### 5.4 SIMS-4: Leila and Nisha, leashes, print and forget, the paper leak, gated exchanges, `hush`

- **Purpose.** The built behaviours OLMP retires from m02 but keeps as evidence for Gary (b), m06 and later missions; the player cup.
- **Step 1, render.** Place `it_boiler`, `it_fridge`, `leila_pc` with its chair (the lower desk's `pc12` and `chair-white-1-rotate6`), `nisha_pc`, both notes, `facilities_print_queue`, and `kitchen_cup`; check that Leila's chair sits at her PC and that the boiler's use and queue cells are clear of the east door.
- **Step 2, data.** Leila and Nisha (3.4). Globals declared false: `leila_print_gone`, `heard_exchange_leila_tea`, `heard_exchange_leila_page_gone`. Leila's exchanges: `exchange_leila_tea` (`requireGlobal: { "leila_print_gone": false }`) and `exchange_leila_page_gone` (`requireGlobal: { "leila_print_gone": true }`), both `with: "nisha"`. Mappings: the Tea Round note sets Leila's and Nisha's caffeine to 10 (cooldown 30 s); the IT Print Queue note sends Leila `"needs": { "print": { "producer": ["it_copier"], "fetchAfterSeconds": [20, 30], "forget": false } }` (cooldown 60 s, as Tom's Print Queue mapping); the Facilities Print Queue note sends Nisha the same; `npc_print_gone:leila` sets `leila_print_gone` and barks one line from her JSON (`onceOnly`). Ink: `leila.ink` (hub plus the two exchange knots, about 6 lines each, neutral, no pool line repeated), `nisha.ink` (hub).
- **Spoken lines.** Leila: `tea` pool (4, `{ "lines": [...], "hush": true }`); the print-gone bark (1, written for someone sitting at her desk, for example "Who's had my printout?"; an eventMapping bark is voiced live, so the voicing step lists it by hand). Nisha: `tea` pool (4, with `hush`). Exchanges about 12; conversations about 10 each. About 41 lines.
- **Schema and validator.** No new fields. Expected output: presets for `leila_pc` and `nisha_pc` (desk_pc through `officeType`), `it_boiler` (kettle), `it_fridge` (fridge); Leila's leash with every target in IT; Nisha's reachable rooms `facilities_office` and `it_room` (the others are denied or private); both exchanges found with both speakers voiced; no impossible need.
- **Node tests.** `test/js/validator-office-presets.test.mjs`: the sims list gains `it_boiler`, `it_fridge`, `leila_pc`, `nisha_pc`. `test/js/npc-needs-sims-validator.test.mjs`: the new lines. `test/js/npc-room-leash.test.mjs`: a deny-list NPC whose only caffeine source is in its second room goes there through the door, and its `leashed` event lists the first room's free source in `skipped`. `test/js/npc-needs.test.mjs`: an exchange with `requireGlobal: { x: false }` plays only while `x` is false and its twin only after; a `hush` chat ends with reason `hushed` when the player comes within range and plays no further line; a print shared after `shareAfterSeconds` logs `print_shared`, loses its owner (`setPrintedBy(id, null)`), and whether its slot takes a later print is asserted as the code does it (if it does not, the README says the tray fills after four forgotten prints and later prints become cosmetic copies, the slots test's "pool exhausted" case). `test/js/npc-voiced-chatter.test.mjs` passes with the new ink.
- **Objectives** (new aim `watch_it`): `see_it_tea` (`npc_used:it_boiler`), `see_kept_to_it` (`npc_needs_leashed:leila`, condition `Array.isArray(data.skipped) && data.skipped.includes('office_coffee')`), `see_kept_out` (`npc_needs_leashed:nisha`, same condition), `hear_tea_round` (`npc_exchange_heard:exchange_leila_tea`), `take_leilas_page` (`npc_print_gone:leila`), `hear_page_gone` (`npc_exchange_heard:exchange_leila_page_gone`), `see_print_errand` (`npc_print_fetched:nisha`), `see_print_forgotten` (`npc_print_uncollected:leila`; the later share at 240 s is a log line, `print_shared`, read from the overlay, not a task), `drink_a_coffee` (`item_consumed`, condition `data.itemId === 'kitchen_cup'`).
- **Live proof.** `tools/playtest/needs-sims-it.mjs` (new), all doors open, to 15 minutes. Pass: every new task ticks; Leila stays in IT and Nisha never enters the office, kitchen or lounge; the `hush` beat: after both exchanges are heard, read the Tea Round note a third time, wait for a pool line at the boiler, walk the player up, and the log shows the chat ending `hushed` with no further line; the paper leak: read the IT Print Queue note, take the page within 20 s, and at the due time Leila, still at her desk, says her line (no walk); the errand: read the Facilities Print Queue note and watch Nisha walk into IT 20 to 30 s later. Screenshots: the tea pair at the boiler, Leila at her desk beside the empty tray, Nisha fetching in IT, the hushed pair.
- **Regressions.** The standard node set; the standard live set.
- **Size.** 0 engine lines; scenario about 300 lines, 2 ink files.
- **Sync.** 6 workstation booleans (2 owned PCs x 3), up to 3 more slot globals, `leila_print_gone`, 2 `heard_` booleans, 9 `triggeredEvents` keys and 1 for the bark mapping, each once. The page and the cup go through the existing inventory echo. Nothing grows with play time.

### 5.5 SIMS-5: reception, vending (E2), the phone break, a call, and E3 measured

- **Purpose.** E2 straight after the pilot and before m06; E3 before the cast passes 8 (m05, m08); needs confined to one room on an NPC with no desk; the phone `self` job; a voiced desk-phone call carried by a single NPC.
- **Step 1, render.** Add reception; render; place the phones and vending machines; check each machine's footprint (42 by 60 px, about 1.3 by 2 tiles) and set `useFrom` if the default cell is inside it; check that Andrés' home cell is not in the north door's approach.
- **Step 2, presets.** `office-presets.json` gains `vending_snack` (`types: ["vending_machine1"]`, hunger, restores 50, 8 s, capacity 1, `useFrom: { dx: 0, dy: 1 }`, `useSound: "eat_snack"`, `queue: { cells: [{ dx: -1, dy: 1 }] }`) and `vending_drinks` (`types: ["drinks_vending1"]`, thirst, restores 60, 6 s, `useSound: "drink_gulp"`, same cells). No `startSound` until a coin sound exists (6.4). Only test scenarios set `officePresets`, so no deployed game changes; the user took this decision on 2026-11-14 (OLMP 14, item 7).
- **Step 3, data.** Reception (private to Andrés), its objects, Andrés (3.4) with `andres.ink` (hub plus `call_front_desk`, about 6 lines: a caller asking whether a visitor has signed in; neutral). The Vending Restocked note sets Andrés' hunger and thirst to 30 (cooldown 30 s).
- **Spoken lines.** The call (about 6) and a conversation (about 10). No pools: Andrés is alone, so a pool would never play.
- **Step 4, E3.** `tools/playtest/needs-perf.mjs` (new) at the normal frame rate under xvfb, no rAF switch, no physics throttle, on a quiet machine (load under 4): wrap `npcNeedsSystem.tick` and the action-icon `update` with `performance.now`, record frame intervals from `requestAnimationFrame` for 180 s after opening every door. Both runs on the scenario after this slice, so the loaded rooms are the same: A, every NPC added since SIMS-3 with `needs` removed (6 needs NPCs); B, as shipped (12, and 13 after SIMS-7, when it is re-run). Pass: in B, tick mean at most 1.0 ms and p95 at most 3 ms; frame-interval p95 within 10 % of A. The numbers go in the README's engine findings and to the OLMP owner for the E3 row. If B fails: profile, and raise an engine item; the showcase keeps its cast.
- **Schema and validator.** No schema change; `preset_table` reads the file, so the validator lists both machines.
- **Node tests.** `test/js/office-presets.test.mjs`: `presetIdFor` for both types, and none for a takeable vending machine. `test/js/validator-office-presets.test.mjs`: the preset table test; the sims list gains `reception_drinks`, `reception_snacks`, `reception_phone`. `test/js/npc-needs.test.mjs`: an NPC with a `social_media` need and no workstation takes the phone `self` job at its post, issues no move and emits no `npc_left_post`. `test/js/npc-desk-phone.test.mjs`: the owner at a tile post answers; away within its room, the phone rings out (`desk_phone_unanswered`) with no colleague claim (the room is private).
- **Objectives** (new aim `watch_reception`): `see_vending_snack` (`npc_used:reception_snacks`), `see_vending_drink` (`npc_used:reception_drinks`), `see_phone_break` (`npc_used_phone:andres`), `hear_front_desk_call` (`desk_phone_answered:reception_phone`).
- **Live proof.** Read Vending Restocked with the player in reception: Andrés at the snack machine, then the drinks machine; the use sounds heard in reception and not from the office. Use the courtesy phone while he is at his post: he answers standing, the call plays. Use it while he is at a machine: it rings out. Wait for his phone break: phone icon, no step. Then the E3 runs. Screenshots: at the machine, on the phone, mid-call.
- **Regressions.** The standard node set; the standard live set; the README's office beats with the reception door open (reception is private, so the office's hungry staff keep the kitchen).
- **Size.** About 4 lines of shared data; 0 engine lines; perf tool about 140; scenario about 200; 1 ink file.
- **Sync.** 4 `triggeredEvents` keys; `heard_call_front_desk` if the call is heard-once (1). No workstation. Nothing grows with play time.

### 5.6 SIMS-6: the leftover pizza, a magnet from the world, and an open screen (m06)

- **Purpose.** m06's beat: a magnet seen rather than announced, from an in-world source, drawing a desk NPC away and opening a screen-habit window, with servings kept across a reload.
- **Step 1, reproduce.** On the build as it stands, add `leftover_pizza` (3.3) and `leftover_pizza_servings: 2`; run the validator (it warns that the magnet "is not a droppable item the player holds", validate_npc_needs.rb:272) and the live proof below. Either the engine path works and the warning is the only fault (`_noteMagnets` reads room objects at load and `_shownMagnets` shows any magnet lying in a room), or a step fails and the fix is sized then, in `_noteMagnets` (731) or `onItemDropped` (705).
- **Behaviour.** The pizza lies on the lounge table, seen by Rosa and Grace, who have no hunger. The player picks it up (it stops showing; everyone forgets it), carries it through the office and IT and drops it in the facilities office. Nisha and Keith (hunger from 70, falling at 3 and 2 a minute), inside the tempt band (above 40, at most 70; `_tempting` 802-809), see it and come; each takes one serving; the second ends it and removes the box. Nisha's PC stays open while she is away (`lockChance: 0`). Dropped in the office instead, it draws whoever there has hunger (Tom, Sanjay, Amara).
- **Validator.** `check_magnets` (260): a room-object magnet with `takeable: true` and `droppable: true` passes with no warning and an info line naming its starting room and the NPCs there who can see it and have its need (none for the lounge, which tells the author it waits for the player); a room magnet the player cannot take keeps the warning. About 20 lines.
- **Schema.** None (the fields exist).
- **Node tests.** `test/js/npc-magnet.test.mjs`: a room-object magnet registered at room load is seen in its room; picked up, it is forgotten; dropped in another room, it is learnt by sight there and not before; servings restored from the global after a simulated reload; the validator section (from line 300): the takeable room magnet gives the info line and no warning, a fixed one warns. `test/js/inventory-menu.test.mjs`: the sims droppable list gains `leftover_pizza`.
- **Objectives** (aim `watch_the_back_office`): `see_pizza_spotted` (`npc_saw_magnet:nisha`, condition `data.magnetId === 'leftover_pizza' && data.roomId === 'facilities_office'`), `see_pizza_pulls_nisha` (`npc_left_post:nisha`, condition `data.targetId === 'leftover_pizza'`), `see_pizza_eaten` (`magnet_serving:leftover_pizza`), `use_nishas_screen` (`workstation_accessed:nisha_pc`).
- **Spoken lines.** None. Eating at a magnet is not a chat, so a pool there would never play.
- **Live proof.** Pick the pizza up in the lounge, carry it to the facilities office, drop it; sample every 250 ms: both see it, both eat one serving, the servings global reads 1 then 0 and the box is removed; Nisha's screen is open while she eats; sit at her desk and use it. A second run: drop it, let one serving go, reload; the box is in the facilities office with one serving, and the next hungry NPC who sees it takes the last. Screenshots: the box in the lounge, both at the box, Nisha's open screen with its indicator, after the reload.
- **Regressions.** The standard node set; the standard live set; the README's cake rows (the cake shares the magnet code).
- **Size.** About 20 validator lines; engine 0 unless step 1 fails; scenario about 50.
- **Sync.** `leftover_pizza_servings` (one integer, changes twice); room-state records through the existing `add_object` and `remove_object` actions: the lounge's removal on pickup, one `objects_added` in the facilities office on the drop (deduplicated by id), and the facilities office's removal on the last serving (`_finishMagnet`, npc-needs.js:939). 4 `triggeredEvents` keys. Nothing grows with play time; a reload restores where it lies and the servings left.

### 5.7 SIMS-7: the private office, work against a resource, and a call that rings out

- **Purpose.** The brief's private office, and row 36 (work judged against a resource, frustration, the outage kick, a check visit) as ordinary office life.
- **Step 1, render.** Add the private office; render; claim the laptop and phone on the executive desk; place the coffee station, printer and socket; check the kitchen overlap and the east door.
- **Step 2, data.** Room private to Siân; her objects (3.3); Siân (3.4); a top-level `resources` entry `manager_printer` (`kind: "printer"`, `object: "manager_printer"`), as test_access_work declares its printer (scenario.json.erb:2790 on). Her `workNeeds: ["+manager_printer"]` makes each work use judged: with the printer off, the use fails (`_countFailure` 2226), her frustration rises by `perFail`, she grumbles, the outage kick fires when the socket global turns on (`_tickKick` 2333 reads the plan's globals), and a check visit walks her to the printer (`enqueueVisit` 2371, `npc_checked:manager_printer`). The Call Facilities note in IT rings her phone. `sian.ink`: hub plus `call_supplier` (about 6 lines).
- **Spoken lines.** The call (about 6); the failure grumble pool (2 lines, under the topic `_failTopic` picks for a failed resource, which step 2 reads from the code and names); a conversation (about 10).
- **Schema and validator.** No new fields; the validator's work checks (roles, resources, `workNeeds`) run as for test_access_work, 0 errors.
- **Node tests.** `test/js/validator-office-presets.test.mjs`: the sims list gains `sian_coffee`, `sian_laptop`, `sian_phone`, `manager_printer`. `test/js/npc-needs-sims-validator.test.mjs`: Siân's leash and work lines. `test/js/npc-desk-phone.test.mjs`: a private-room phone rings out when its owner is at another object in the room.
- **Objectives** (new aim `watch_the_manager`): `see_work_fail` (`npc_use_failed:sian`), `see_printer_checked` (`npc_checked:manager_printer`), `hear_supplier_call` (`desk_phone_answered:sian_phone`), `see_call_rang_out` (`desk_phone_unanswered:sian_phone`, npc-needs.js:4141), `see_sian_locks` (`workstation_owner_left:sian_laptop`, condition `data.screenLocked === true`).
- **Live proof.** Read Call Facilities while Siân is at her desk: she answers seated and the call plays; again while she is at her coffee station: it rings out. Switch off the printer socket and force her work low: the use fails, the grumble plays, the kick and the check visit follow; switch it on and her next use succeeds. Re-run SIMS-5's E3 run B with all 13. Screenshots: on the phone, at the printer on her check visit, her locked screen.
- **Regressions.** The standard node set; the standard live set; test_access_work's walkthrough (the same work code).
- **Size.** 0 engine lines; scenario about 220; 1 ink file.
- **Sync.** 3 workstation booleans; `manager_printer_off` (one boolean, on each switch); `sian_frustration` (one integer, sent as a delta on the 30-second sync) and the server's `npcFrustration` record for one NPC (about 450 bytes, frustration reports batched at most 20); 5 `triggeredEvents` keys; `heard_call_supplier` if heard-once. Nothing grows with play time: the frustration record holds one NPC's fixed fields, not a log.

### 5.8 Backlog SIMS-8: arrive and leave on the game clock (about 300 lines)

Built only if m05's design, another mission or the user asks. It is not in OLMP's engine list, so a mission that adopts it adds a sync row to OLMP 7 first.

- **Behaviour.** NPC `schedule: { "arrive": "HH:MM", "leave": "HH:MM", "arriveFrom": { "room", "x", "y" }, "leaveVia": { "room", "x", "y" } }` (either time optional). Before `arrive` the NPC is hidden; hidden, it stays registered with no decay. At `arrive`, its levels reset to their initials and `lastSatisfiedAt` to now (the code in `register`, npc-needs.js:461-466); it appears at `arriveFrom` if that room and its post's room are loaded and walks home, otherwise it is at its post when its room loads. At `leave`, once out of any conversation, it ends its job cleanly, says a line from its `leaving` pool, walks to `leaveVia`, the workstation layer records a leave with an unbounded expected absence (so `lockIfAwayOverSeconds` habits lock and `lockChance` rolls), a left-behind roll runs, and it is hidden. Schedule walks pass no `avoidRooms`, so a leashed NPC can cross rooms its needs may not use. An anchor jump past several leave times sends leavers one at a time, 8 s apart, in time order.
- **Reload.** Reconciled from the saved game clock, `npcVisibility` and the saved workstation globals, never re-run: an NPC past its leave time is hidden with its saved lock globals; no `leaving` line, `npc_left_for_day` or left-behind roll fires again.
- **Engine.** New `systems/npc-schedule.js` (about 150): `installNpcSchedule`, a 1 s check against `window.gameClock` (`gameSecondsAt` game-clock.js:99), `setNPCVisible`. `npc-needs.js` (about 60): `arriveForDay`, `leaveForDay`, the decay skip, events `npc_arrived_for_day:<id>`, `npc_left_for_day:<id>`. `workstation-state.js` (about 25): `onLeft(npcId, { forDay: true })` (541) and `resetGlobals` (497). Server: `filtered_scenario_for_bootstrap`'s `hasPresentNpc` (game.rb:1323) skips NPCs with a `schedule`. The new module goes in each JS test harness copy list.
- **Schema and validator.** NPC `schedule`; times parse and arrive is before leave; `gameClock` present; `arriveFrom` and `leaveVia` are floor tiles; `needsHome` and no patrol; a warning on an NPC with tasks, `taskOnKO` or a required conversation; a warning when `arriveFrom` is in a room that does not load with the post (E4).
- **Scenario.** `"gameClock": { "start": "Tue 08:30", "rate": 20, "anchors": [ { "condition": "globalVars.clock_home_time === true", "time": "17:40" } ] }`; a street door on reception's south wall (decor; stand-in 6.4) with `arriveFrom` and `leaveVia` on the floor tile in front of it, about (5, 8); leave times 17:00 to 17:30, so one pull of an `office_clock` lever (wall_clock1, confirm "Wind the clock on to home time?", sets `clock_home_time`) sends everyone. At rate 20, 17:00 is 25:30 of play, after every proof window. Tasks `see_leave`, `see_left_open_overnight`.
- **Node tests.** `test/js/npc-schedule.test.mjs` (new): hidden before with no decay; arrival with initial levels; leave during a use; leave held by a chat; lock decision per habit; left-behind at leave; anchor jump with three leavers; a leashed leave walk crossing a forbidden room; reload before, during and after, asserting the saved globals and `npcVisibility` and that no leave side effect re-fires.
- **Live proof.** Pull the clock lever with all rooms open; screenshot the office every 10 s until it is empty; log the order and each lock decision; reload after the last leave and check.
- **Regressions.** The standard node set; m05's walkthrough smoke run (it has a `gameClock` and no schedules); test_access_sessions.
- **Sync.** `npcVisibility`: one boolean per scheduled NPC, a delta on each arrive or leave (at most 13 here); the game clock's elapsed time and reached anchors (existing). **Request to the OLMP owner:** before any mission adopts schedules, OLMP 7 needs "Scheduled NPC visibility (`npcVisibility.<id>`), engine-owned, one key each as a delta on arrive and leave, one boolean per scheduled NPC, cap N".

### 5.9 Backlog SIMS-9: summon to post (about 95 lines)

OLMP keeps E5 as a design rule and this helper in the backlog.

- **Behaviour.** An eventMapping `"needs": { "summon": { "holdSeconds": 20 } }`: the NPC ends what it is doing cleanly (a use cut short with no restore, a carried item dropped as an abort does, out of any queue, chat or call), walks home without yielding, emits `npc_at_post:<id>` `{ summoned: true }`, and picks no need for `holdSeconds` or until `"needs": { "release": true }` or `"resume"`. A player conversation during the hold extends it. Knocked-out, hostile or hidden NPCs ignore it. Not persisted.
- **Engine.** `npc-needs.js`: `control` (949) gains `summon` and `release`; `_tickNpc` skips `_select` while held; the walk reuses `_abortJob` (3700), `_leaveQueue`, `_endChat` (2784), `_hangUp` and `_goHome` (3771, `yieldToPlayer: false`); `getState` (4542) shows `summoned`; `_pressing` (4515) hides the bubble while held.
- **Schema and validator.** The mapping `needs` object gains `summon: { holdSeconds: 1-600 }` and `release: true`; a summon on an NPC with no `needs`, no `needsHome` or a patrol is an error.
- **Scenario.** A `facilities_buzzer` (stand-in `phone3`, 6.4) on Nisha's desk emits `facilities_buzz`; Nisha's mapping summons her with a voiced `bark`; task `see_summoned`.
- **Node tests.** `test/js/npc-needs-summon.test.mjs` (new): from a use, a carry, a queue, a chat pair, a call; already at post; KO ignored; hold length; release; player chat extends; `suspend` and `resume` unchanged.
- **Live proof.** Nisha at the IT boiler, press the buzzer: back at her desk, held 20 s with the bubble hidden, then free.
- **Sync.** Writes nothing; an `onceOnly` on the mapping is one `triggeredEvents` key.

### 5.10 Backlog SIMS-10: stock and refills (about 170 lines)

- **Behaviour.** `affordance.stock: { max, perUse, lowAt }`; each completed use takes `perUse`; at 0 walkers and queuers turn back with reason `empty` (topic `grumble_empty`); parked needs wake on refill. An NPC with `restocks: [ids]` gets a `restock` visit (`enqueueVisit` 2371) at `lowAt`, which restores `max`. Client-only, reset on reload like need levels.
- **Engine.** `_useCandidate` (1567) skips empty sources; `_completeJob` (3219) takes stock; `_turnBack` reason `empty`; a `lowAt` watch; icon `restock` (stand-in 6.4).
- **Schema and validator.** `affordance.stock`, NPC `restocks`; targets have stock and the restocker's leash reaches them; `grumble_empty` lines exist.
- **Scenario.** Both vending machines `stock: { max: 6, perUse: 1, lowAt: 1 }`; Andrés `restocks` both; task `see_refill`.
- **Node tests, proof.** Empty turn-back, refill visit, reload reset, sims-day digest unchanged without stock; live: six forced uses, the turn-back, the refill.
- **Sync.** None.

### 5.11 Backlog SIMS-11: traits as named bundles (about 60 lines)

- **Behaviour.** Top-level `traits: { "<name>": { screenHabit, printHabit, chattiness, leftBehindChance, needsCompany } }` and NPC `traits: ["<name>"]`, merged into the NPC record at registration, the NPC's own fields winning. No new behaviour: each trait is a name for fields that already exist.
- **Engine.** The merge where needs NPCs register (`register`, npc-needs.js:461 on, and the workstation habit reader `habitOf` workstation-state.js:125 reading the merged record). About 30 lines; validator and schema about 30.
- **Scenario.** `careful` (locks at once, never forgets a print), `scatty` (never locks, forgets half), `chatty`; assigned to the new staff in place of their own fields, so the day plays the same.
- **Node tests.** Merge order, unknown trait error, sims-day digest unchanged. **Live proof.** The SIMS-4 and SIMS-7 lock and print beats unchanged with traits.
- **Sync.** None.

### 5.12 Backlog SIMS-12: a visitor at reception (data only)

A courier (`courier_hivis`, no sit frames, standing only) hidden at start (`behavior.initiallyHidden`), shown by a lever ("Delivery Due" note) through `setVisible`, walked from reception's south wall to the counter by `patrolOverride.targetTile`, with a short ink story and a bark; Andrés' `call_front_desk` gains a gated knot. No needs (a patrol or scripted walk excludes them). Proof: visible, walks, talks, hides again on a second lever; reload keeps `npcVisibility`. Sync: one `npcVisibility` boolean. Built after SIMS-8's street-door stand-in exists, or with an `exit_sign1` stand-in.

### 5.13 Not planned, and why

- **Routines (OLP slice 9: a multi-step tea round, fetch the post and file).** About 450 lines; reveal slots, carry jobs and print errands already show the steps; the user's 2026-11-06 picks left routines unmarked (open question 3).
- **Per-NPC sessions (OLP 16b).** The access model's sign-in PCs and unlocked sessions do this.
- **Schedule preemption, stand-ups, fire drills.** No mission asks for gathering or escorting.
- **An outside or smoking area.** No unbranded outdoor map and no ashtray, bench or shelter sprite (3.2; art request 6.4).

| Slice | Size (engine, validator, schema) | Needed by |
|---|---|---|
| SIMS-1 E1 in test_needs_attack | 0 (scenario about 400, probe about 220) | m02 before its design closes |
| SIMS-2 arrivals by distance and move id | about 75 | every needs scenario; m02 before stage 5 |
| SIMS-3 IT and facilities: Gary (a) and the pair | 0 (scenario about 350, 3 ink files) | m02's patterns |
| SIMS-4 Leila and Nisha | 0 (scenario about 300, 2 ink files) | m06; Gary (b) evidence; m04, m07 |
| SIMS-5 reception, vending, E3 | about 4 lines of shared data (perf tool about 140) | E2 before m06; E3 for m05, m08 |
| SIMS-6 leftover pizza | about 20 (engine 0 unless step 1 fails) | m06 |
| SIMS-7 private office, work and frustration | 0 (scenario about 220, 1 ink file) | the brief; later missions with work needs |
| SIMS-8 arrive and leave (backlog) | about 300 | only if m05 or the user asks |
| SIMS-9 summon to post (backlog) | about 95 | only if a mission asks |
| SIMS-10 stock and refills (backlog) | about 170 | nobody yet |
| SIMS-11 traits (backlog) | about 60 | the user's answer to open question 2 |
| SIMS-12 visitor (backlog) | 0 | the brief, after SIMS-8 or with a stand-in |

---

## 6. Rules for every slice

### 6.1 Spoken lines

- Every bark, chatter line, exchange and call is scenario data: single-speaker lines in the NPC's or the scenario's `chatter` pools or eventMapping `bark` fields; multi-speaker exchanges and calls in ink knots. Each is voiceable: one line, 40 characters at most, no `{ }`, no printed variables, no speaker prefix. The validator's pool and exchange checks (`check_pool_lines` 676, `check_exchanges` 826) run on every new pool.
- Only lines that can play are written: a pool needs a pair at a capacity-2 chatter object, `grumble` plays only on a turn-back (`_grumbleTopic` 2089), `greet` only at an object with `chatter: "greet"`. Andrés, Siân and Neil have no pools for that reason.
- eventMapping barks (Leila's print-gone line) are voiced live, outside the pool batch, so each slice's report lists them by hand.
- The engine carries no spoken words; its fallbacks are pictures only (`PICTURE_CHATTER`, npc-needs.js:213). Backlog topics (`summoned`, `leaving`, `grumble_empty`) get picture fallbacks.
- Audio is made last, with the user's agreement. Every new speaking NPC has a `voice`.

### 6.2 Server and cheat resistance

- Nothing here guards a secret, key, password or forged item. Levers, magnets, prints, phones and work failures move NPCs or change client choices, which the policy allows as best-effort client behaviour. No printout or note carries an account, address, password or code.
- Every new global (`it_out_*_shown`, `neil_print_asked`, `neil_ko`, `leila_print_gone`, `heard_*`, `leftover_pizza_servings`, `manager_printer_off`, the KO globals in test_needs_attack) completes optional tasks only; forging one ticks an optional task.
- Anything the player can take is a declared scenario object (the pages, the cup, the pizza, the folder and notebook). A player drop is rebuilt from the server's held copy and refused unless `droppable: true` (game.rb 541-554); a KO drop must match an authored `itemsHeld` entry (`find_npc_held_item` 1151), records the KO and dedups by id (486-523).
- New NPC and object fields reach the client because `withhold_npc_secrets!` removes only `WITHHELD_NPC_KEYS` (game.rb:5620, 5656) and `filtered_room_data` (1603) strips named keys only; none of the fields used here is withheld.
- All new fields are author content checked by the validator; no end-user or organisation text is involved.

### 6.3 Art, UI and layout

- Existing art only; nothing here plans image generation. New art is in 6.4 with a stand-in.
- UI follows the pixel-art rule (2 px borders or the `ui-themes.css` 9-slice skin, pixel fonts only, no radius) and the UI design language (X closes, no Cancel; the backlog clock lever keeps the `confirm_action` pattern; one look per concept; NPC headshots in conversations).
- Props square to the walls, top-down, one or two angled per room at most; pixel art never scaled down.
- Walking "behind" a back wall is intended; never sealed. Cross-room interaction is blocked instead.

### 6.4 Art and sound requests for the user

| Item | Kind | Needed by | Stand-in meanwhile |
|---|---|---|---|
| A vending coin and drop sound | MP3 one-shot (`startSound`) | SIMS-5 | none: the use sound only |
| An office manager or team lead, a person of colour, office clothes | character (concept, bust, visemes from four talk inits, walk, sit) | optional for SIMS-7 (open question 1) and a more varied cast | Siân on `female_security_guard_v2` |
| An outdoor smoking shelter: a small unbranded yard map with a bench, an ashtray bin and a shelter | room map plus 2 to 3 props, sized from the catalogue | a smoking area (3.2) | none; not built |
| A plain street door for an outside wall | object sprite | SIMS-8, SIMS-12 | `exit_sign1` above the tile |
| A desk bell or buzzer | object sprite | SIMS-9 | `phone3` named "Facilities Buzzer" |
| A restock icon (`npc-restock`, 16x16) | icon | SIMS-10 | the `npc-file` icon |

### 6.5 Sync, all slices together

Needs state, positions, queues, move ids, chats, magnet knowledge and stock live in the browser and are never synced. What the showcase adds to player_state or the server, each sent as a one-key delta when it changes:

| Piece | Count | Changes |
|---|---|---|
| Workstation booleans for `leila_pc`, `nisha_pc`, `sian_laptop` | 9 | on each leave and return |
| IT slot globals | 4 | once each |
| `neil_print_asked`, `neil_ko`, `leila_print_gone` | 3 | once each |
| `heard_` booleans (three exchanges; two calls if heard-once) | at most 5 | once each |
| `leftover_pizza_servings` | 1 integer | twice |
| `manager_printer_off` | 1 | on each switch |
| `sian_frustration` and its server record | 1 integer, about 450 bytes | as a delta on the 30-second sync |
| `triggeredEvents` keys for new `onceOnly` mappings | about 30 | once each |
| Room-state records for the pizza (two removals, one add) | 3 | once each, through `add_object` and `remove_object`, not `sync_state` |

test_needs_attack adds, in its own games, up to 7 `npcHostility` entries, 5 KO records and globals, 2 `objects_added` and 6 `triggeredEvents` keys. The backlog adds at most 13 `npcVisibility` booleans (SIMS-8). Every count is fixed by the authored content; nothing grows with play time; a reload seeds the sync's confirmed state from the saved blocks, so it sends only what changes, and replays no beat.

The showcase is a test floor, so it sits above OLMP 7's per-mission caps for reveal globals and `onceOnly` mappings (the office and kitchen copiers have seven slots and every task uses one mapping); each is still one boolean set once. It has six owned workstations (under the cap of 8), two magnets (at the cap of 2) and one NPC with frustration (under the cap of 6).

---

## 7. What to watch for: a guided tour for the README

Times are needs-clock minutes from load. Levers are in bold. Each row says what to do if a beat does not come by itself.

| Time | Where | Lever | What should happen | Slice |
|---|---|---|---|---|
| 0:00 to 1:00 | office | none | Amara and Tom at the coffee station: one waits, then goes; icons and bubbles; typing | built |
| 1:00 | office, then north | **open the north door** | IT: Neil standing at his bench; Leila typing at her desk; the empty cooler never shows a use icon | SIMS-3, 4 |
| 1:20 | IT, then east | **open the facilities door** | Keith and Jodie sitting on the waiting chairs, Nisha at her desk; the room has its own quiet tone | SIMS-3, 4 |
| 1:30 to 4:00 | facilities | stay | Keith gets up for tea and Jodie follows; at the boiler they talk; the first time, the radio exchange plays (`hear_radio_wait`). If nothing comes in two minutes, **walk out to IT and back in** after two minutes: a shared break starts within 10 s | SIMS-3 |
| 3:30 | IT | **talk to Neil, ask for the change log**, close | about 6 s later the copier runs and a page lands; Neil never moves (`get_neils_page`); he sips from his mug where he stands (`see_neil_sip`) | SIMS-3 |
| 4:00 | IT | **read the Tea Round note** | within about 10 s Leila and Nisha are at the boiler and chat; the first time, the tea exchange plays (`hear_tea_round`); `leashed` events tick `see_kept_to_it` and `see_kept_out` within a few teas | SIMS-4 |
| 4:40 | IT | **read the IT Print Queue note**, then **take the page from the tray** within 20 s | at the due time Leila, still at her desk, asks who has had her printout (`take_leilas_page`) | SIMS-4 |
| 5:20 | IT | **read the Tea Round note again** (30 s cooldown) | the second exchange plays, about the missing page (`hear_page_gone`) | SIMS-4 |
| 6:00 | IT | **read it a third time**, wait for a line at the boiler, **walk up to them** | they stop talking as you arrive (the chat ends `hushed`) | SIMS-4 |
| 6:30 | facilities | **read the Facilities Print Queue note**, go back to IT | 20 to 30 s later Nisha walks in and takes her page (`see_print_errand`) | SIMS-4 |
| 7:30 | lounge | **pick up the pizza boxes**, carry them through the office and IT, **drop them in the facilities office** | no announcement: Nisha and Keith see the box and come; Nisha leaves her screen open; two servings, then the box is gone. **Sit at Nisha's desk** while she eats (`use_nishas_screen`) | SIMS-6 |
| 9:00 | office, then south | **open the south door**, **read Vending Restocked** | Andrés at the snack machine, then the drinks machine; the sounds only in reception | SIMS-5 |
| 10:00 | reception | **use the courtesy phone** while Andrés is at the desk | he answers standing and the call plays; try again while he is at a machine and it rings out. Now and then he checks his own phone without a step | SIMS-5 |
| 11:00 | IT, then west | **open the west door**, **read Call Facilities** in IT, go in | Siân answers at her desk; read it again while she is at her coffee and it rings out | SIMS-7 |
| 12:00 | private office | **switch off the printer socket**; wait for her next work turn | her work fails, she grumbles, kicks out at the outage and walks over to check the printer; switch it back on | SIMS-7 |
| any | kitchen | **pick up the mug of coffee, use it from the inventory** | you drink it, with a sound (`drink_a_coffee`); the map cups in the new rooms drink the same, and nobody minds | SIMS-4 |
| any | office | the earlier levers: notes, sockets, spare phone, cake, parcel, mugs | as the README lists | built |
| any | everywhere | the debug overlay and `window.__test.needs.log()` | every beat has a log line and, where listed, a task | built |

Without levers the new beats still come on the times in 3.5. The order above keeps each beat clear of the next: the pizza comes while Nisha's and Keith's hunger is still inside the tempt band, and Vending Restocked touches only Andrés. The attack checks are in test_needs_attack's own README.

---

## 8. Open questions (recommended default in bold)

1. The private office's occupant: no free sprite looks like a manager. Cast Siân on `female_security_guard_v2` (a uniformed head of facilities, the caretakers' boss), or commission a manager character (6.4) and leave the office without its occupant until the art lands? **Cast Siân on the free sprite now; swap her sheet later if the manager is commissioned. Her id and records stay.**
2. Traits. The brief asks for a cast with traits; the user's picks of 2026-11-06 left traits unmarked and built every habit as a per-NPC field. Build SIMS-11 (about 60 lines, names for existing fields, no new behaviour) after SIMS-7, or keep it in the backlog? **Keep it in the backlog until the user says; it adds names, not behaviour, and the per-NPC fields already vary the cast.**
3. Routines. The brief asks for routines; the same picks left them unmarked; OLP slice 9 is about 450 lines. **Not planned; reveal slots, carry jobs and print errands show the steps a routine would chain.**
4. Schedules. The brief asks for them; the picks said "timetabled schedules maybe later" and preferred player levers. **Backlog (SIMS-8) until m05's design or the user asks.**
5. A smoking or outside area needs a new map and props (6.4). **Not built until the art exists.**
6. Make every new room private to its own staff? **Yes: it keeps the README's office beats as they are and makes each room's life its own.**
7. Andrés standing at the counter's end, since `room_reception` has no staff side? **Yes.**
8. Nisha's leash as a deny list, so the showcase shows both forms? **Yes.**
9. Start the pizza on the lounge table, where nobody with hunger goes? **Yes.**
10. Build the backlog (SIMS-8 to SIMS-12) only when a mission's design or the user asks? **Yes.**
11. If schedules are built: leave times on the game clock (saved) rather than the needs clock (reset on reload)? **Game clock, so a reload never replays the evening.**
12. If the summon is built: a fixed hold or until released? **20 s, extended by a player conversation; a `release` mapping ends it early.**
13. If refills are built: should stock survive a reload? **No: client-only, reset to full like need levels.**
