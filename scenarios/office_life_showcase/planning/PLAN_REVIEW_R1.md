# office_life_showcase: plan review, round 1

Reviewed against PLAN.md and CAKE_ITEM.md at 64c2dc425, checked in the engine (`public/break_escape/js/`) and `scenarios/test_needs_sims/scenario.json.erb`. A first reviewer stopped at the context limit; a second continued from its "Not yet checked" list (m3 onwards, n2 onwards) and also stopped at the limit, so a short list remains at the end. Counts: B 1, M 3, m 7, n 3.

## Findings

### B1. The morning queue does not recur, and the first one lands inside the opening chat (section 3, section 4 Act 1, R3, R9)

Evidence:
- A use restores its need only at the end of the use (`npc-needs.js:3663-3665`), and decay pauses while using (`npc-needs.js:1552`). The coffee preset is `useSeconds 12`, capacity 1, `restores 70` (`data/office-presets.json`, `coffee`).
- Needs run for everyone during a conversation except the NPC being talked to (`npc-needs.js:1437-1446`; the needs update in `core/game.js:2707` is not paused for a minigame).

Failure: Chidi goes urgent at 0:21, Jun at 0:27. The viewer opens Ama's chat at 0:05 (row 1.2) and reads A1 to A4 while the first queue forms (0:21 to 0:40) and the bubbles play, so the first queue is likely missed. After it, Chidi tops out at 100 when his use ends (about 0:40) and Jun one use later (about 0:52). Both decay at 20 a minute, so their next urgency is 12 s apart, the length of one use: on the second run (about 3:40, not 3:20) Jun reaches the machine as Chidi finishes. No reliable queue means no `npc_queued` for Jun, so Zainab's caffeine is never set again, and no `npc_chatted:office_coffee`. The "queue recurs every three minutes" fallback for late viewers (line 60), `see_queue` and `hear_queue_chat` on a late run, and the "while they queue" state for row 1.9 all rest on it.

Fix: couple Jun to Chidi so every Chidi run brings Jun in behind him: a mapping on Jun, `npc_left_post:chidi_okeke` with `data.targetId === 'office_coffee'`, `needs.set.caffeine 10`, cooldown 30000 (the pattern sims uses for Sanjay after Marek, `test_needs_sims/scenario.json.erb`, Sanjay's `npc_left_post:marek` mapping). Zainab's existing coupling on Jun's queue then holds every run. Correct the second-run time to about 3:40, and have A1 or A3 tell the viewer to watch the coffee before reading on (or start Chidi's caffeine so the first queue forms after a typical opening chat, say urgent at 0:45).

### M1. B4 depends on the chime being heard (section 4 row 2.2, section 7d B4, R18)

Evidence: `workstation_lock_heard:<id>` is emitted only when the chime played at a volume above 0 (`npc-office-visuals.js:384-390`). `playAt` returns 0 when sound is disabled or muted, the audio is not loaded, the viewer is in another room (`ownRoomOnly`, `ownRoomHearing` at :116-118), more than 8 tiles away (`HEAR_TILES` :52), or the `chime` channel's 1 s limit is spent (:305-311).

Failure: a muted viewer, or any headless proof with sound off, never gets B4. B4 is also onceOnly and can be spent on a morning coffee run (R18), leaving row 2.2 unlabelled at lunch.

Fix: tick B4 on `workstation_screen_changed:chidi_pc` with `data.how === 'leave' && data.locked === true && globalVars.act_midday === true` (always emitted, `workstation-state.js:204-205`), and reword to not assume sound ("Chidi's locked his screen before lunch."), or keep the chime event and accept muted viewers miss it. The midday condition retires R18.

### M2. The cooler pair have too little time together for the exchange (section 2 kitchen objects, row 1.7)

Evidence: sims sets the cooler's `useSeconds 40` (`test_needs_sims/scenario.json.erb:806`), with a comment that the preset's 15 s gave a coupled pair 3 to 7 s together. Section 2 lists only `affordance.overhearRadius 360` for the cooler.

Failure: with the preset 15 s, Graham arrives after Agnieszka has nearly finished; the five-line exchange needs both at the machine, so `hear_cooler_exchange` may never tick.

Fix: carry `useSeconds 40` alongside `overhearRadius 360`.

### M3. Jun's PC either locks half the time or stops being a workstation (section 2 office objects, section 3 Jun, rows 2.3 and 2.4)

Evidence: sims `tom_pc` sets `lockChance 0.5` on the object (`test_needs_sims/scenario.json.erb:218`) and has no `workstation: true`. An object lockChance wins over the owner's habit (`workstation-state.js:131-160`). `isWorkstation` needs `workstation: true`, `locksScreenOnLeave`, `lockChance` or `lockType: 'login'` (`workstation-state.js:109-113`).

Failure: copied as is, Jun locks on half his leaves and row 2.4 fails at random. With `lockChance` simply dropped, `jun_pc` is no longer a workstation: no `workstation_accessed:jun_pc`, no owner-away globals, and `use_open_screen` never ticks.

Fix: write `jun_pc` explicitly as `workstation: true`, `owner: "jun_watanabe"`, no `lockChance` or `locksScreenOnLeave`, so Jun's `habits.screen.lockChance 0` decides. Section 8's three workstation globals for `jun_pc` then hold.

### m1. B6 waits for Jun's PC to close (row 2.5, R12)

Evidence: a delayMs mapping is scheduled with a timer whether or not a conversation is open (`npc-manager.js:907-938`), but when the delay is up while any minigame is open it waits and retries (`npc-manager.js:921-925`). `npc_caught_at_post` fires with `inMinigame` when the viewer is in the PC (`npc-needs.js:3365-3383`).

Failure: the viewer is told to "stay put" in Jun's PC, so B8 shows (if barks show over a minigame) and B6 appears only when the viewer closes the PC, not 2.5 s later. No overlap, but the timing in the table is wrong.

Fix: state that B6 follows the viewer closing the PC; or reword A10 to "use it, close it, and wait by the desk".

### m2. Section 13 lists an engine change that is not needed (section 6 last line, section 13, R17)

Evidence: an interest pickup emits `npc_picked_up:<itemId>` with `{ npcId, itemId, tag }` (`npc-needs.js:3520`).

Fix: drop the fourth extra in section 13. A bark or task on `npc_picked_up:office_mugs` is possible; whether it is worth an onceOnly is the planner's call (the row has room: 7 of 10).

### n1. Row 3.1 timing wording

`#set_global` emits `global_variable_changed` when the tag runs (`minigames/helpers/chat-helpers.js:552-605`), after A17 and A18 have shown, so the four vanish as A18 ends, not "while Ama speaks A17, A18". Reword.

### m3. The cake's "two eat, two turn back" needs all four to set off before the second serving goes (section 4 row 2.7, B7, T15, R13)

Evidence: an NPC selects only when idle or returning; one in a job (a 10 s desk use, `desk_pc` preset) does not look until the job ends (`npc-needs.js:1509-1513`, select at :1526). A magnet with no servings left is skipped at selection (`_magnetsFor`, :931), and a turn-back with `gone` happens only to a walker or queuer already on its way (:3496-3498, :1502).

Failure: if one of the four is mid-use at its desk when the cake drops, or reaches the select after two others have started eating, it never walks and never says "Missed it.". T15 expects exactly two `npc_turned_back` with reason `gone`, and B7 says "four takers". Jun is the likeliest late one: his work is set to 5 at row 2.4, so he works on his return.

Fix: word B7 so it holds for any count ("Two slices, first come, first served."), let T15 accept zero to two `gone` turn-backs with two `magnet_serving:cake`, and have A11 say "when they're all back and sitting".

### m4. `hear_queue_chat` ticks on chat the viewer did not hear (section 4 row 1.4, section 5)

Evidence: out of earshot a chat turn still runs, as a picture with no line taken, and still emits `npc_chatted:<objectId>` with `overheard: false` (`npc-needs.js:4495-4527`). Queue chat on a capacity 1 machine is real: the user pairs with the front queuer within 1.5 tiles of the approach cell, compatible pairs only, so Zainab (avoids `*`) queues in silence (`npc-needs.js:5029-5058`, `QUEUE_CHAT_RADIUS` :94). The office coffee has no `overhearRadius`, so earshot is the pool's or 160 px (:84, `_chatRadius` :3006-3011).

Failure: the task "Two in the coffee line pass the time" ticks while the viewer is in the kitchen or reading Ama's chat. Row 1.4's "stands near the queue" is not required.

Fix: add `"condition": "data.overheard === true"` to the task mapping, and give `office_coffee` an `overhearRadius` (say 200) so "near" is generous. The capacity 1 versus 2 question does not arise: queue chat needs capacity 1 with a queue, as planned.

### m5. Graham's habit and the desk machines' workstation fields are not stated (section 2, section 3 Graham, section 8)

Evidence: with no lock field on the PC and no `habits.screen` on the owner, the screen locks on every leave (`workstation-state.js:142-160`, "With no habit either, the screen locks"). Sims gives Sanjay `habits.screen.lockChance 0` (`test_needs_sims/scenario.json.erb:711`) and his PC `workstation: true` with `owner` (:278-288); Amara's PC likewise (:193-203). V8 counts 3 globals only for an object with `workstation: true` (or a lock field) and an `owner` (`validate_npc_needs.rb:504-512`, `validate_office_life.rb:786`).

Failure: copied without the habit, Graham locks at once on every leave with a chime, so "locks itself 20 s after he leaves" (row 1.7, G3) never shows; without `workstation: true` and `owner`, `chidi_pc` or `graham_pc` is no workstation and section 8's count of 9 falls.

Fix: section 3, Graham: `habits.screen.lockChance 0`. Section 2: write `workstation: true` and `owner` on `chidi_pc`, `jun_pc` (M3) and `graham_pc`.

### m6. The evening kitchen can be lit before the viewer walks in (section 2 lighting, section 4 rows 3.3 and 3.4, T19, R14)

Evidence: motion rooms switch on for a visible NPC on the floor (`lighting.js:1159-1168`, `npcInRoom` :1179-1192), but the off timer is armed only when the player leaves the room (`onRoomExited`, :1031-1044). The variant applies at once on the global, dark unless someone is in the room (:788-805), and is re-read at load (header :37-42), so a reload keeps it.

Failure: if the office coffee is still switched off at the evening turn, Zainab goes to the kitchen coffee (row 3.3). She lights the kitchen and, with the viewer in the office, nothing turns it off. Row 3.4 and T19 ("dark until entered") fail.

Fix: on Ama's `global_variable_changed:act_evening` mapping, also set `office_coffee_off` to false, so Zainab always uses the office coffee (check in S4 that the socket object follows the global); or have A12 say to switch the coffee back on. R14 itself is settled: NPCs do trigger the sensor.

### m7. CAKE_ITEM.md: magnet placement wording, and the access tour has drifted from the minimal variant (CAKE_ITEM.md Item and Minimal variant)

Evidence: any loaded object with `affordance.magnet` is registered on a room load (`scanMagnets`/`_noteMagnets`, `npc-needs.js:866-881`), so a cake lying in a room at the start is a live magnet there. DEMO_ACCESS_TOUR_PLAN.md (branch `plan/demo-access-tour`, lines 179, 223, 229) starts the cake in the kitchen and gives Thandiwe caffeine, work and hunger, against CAKE_ITEM's "held from the start" and "one need only".

Failure: "there is no other way to place a magnet" is wrong; with the access tour's kitchen start, anyone in the kitchen with hunger learns of it before the drop. With caffeine and work, Thandiwe may be away when the cake goes down; she learns by sight on her return (:1416, :958-970), so the cue still works, only later.

Fix: correct the sentence in CAKE_ITEM.md ("a magnet that starts in a room is known to anyone in that room at once") and send the access tour the two differences. The variant's numbers hold: band 30 to 60, initial 50 is inside it, urgent after 40 minutes; `servings 2`, `perPerson 1`, capacity 3 lets both eat; the `<id>_servings` read takes the declared global (`npc-needs.js:884-889`) and the schema requires it to equal `servings` (`scenario-schema.json:3981`). CAKE_ITEM's line references all check out.

### n2. Barks from Ama are toasts out of the room and wait for an open conversation or minigame (R10)

`routeBark` shows a bubble only with the NPC in the player's room, on camera, lit and no minigame open; otherwise a voiced toast (`npc-barks.js:26-29`). A bark during a person chat or minigame is held and released after it closes, one every 2.5 s, re-checked by `stillValid` (`npc-barks.js:240-255`). So B2 during the opening chat (B1) shows after the chat, and B8 and B6 in Jun's PC both show after the viewer closes it (m1). Note this in section 9 and the T13 expectation.

### n3. V10 will flag the `grumble` pool (section 7e, R11)

`grumble` is spoken only on an avoidance turn-back, or an off or gone turn-back with no pool of its own (`npc-needs.js:2283-2289`, `validate_office_life.rb:1490-1495`, :1580). Zainab's `avoidRadius 0` makes `_recheck` return at once (`npc-needs.js:2049`), nobody else declares `avoids` (radius 0, :1899-1904), and `grumble_off` and `grumble_gone` have lines. Drop the `grumble` pool in S2 rather than waiting for V10.

### V8 recount (section 8)

From `validate_office_life.rb:766-800`: workstation globals 9 (after m5 and M3); heard_ globals 1 (:781, one exchange on Graham); magnet servings 1 and dropped magnet items 1 (the inventory cake is collected with no room, :128, and `carried?` :368-370); reveal and left-behind 1 (:791-793); office-life items 2 (badge takeable, cake carried, :795). onceOnly mappings count when `onceOnly` is true and the event is on the prefix list or the mapping has `needs` (:797-799, prefixes :50-58): B2 `npc_queued`, B3 `npc_turned_back`, B4 `workstation_` (also under M1's `workstation_screen_changed`), B5 `npc_left_post` (on the list, :54), B6 `npc_caught_at_post`, B7 `magnet_`, B9 `npc_left_item_gone`: 7 of 10. B1 (`room_entered`) is not counted. B1's fix mapping (Jun coupling) has `needs` but no `onceOnly`, so it adds nothing. Small keys 19, as planned.

## Risks checked

| Risk | Result | Evidence |
|---|---|---|
| R3 needs clock during a conversation | Does not hold in the plan's favour: everyone but Ama keeps going | `npc-needs.js:1437-1446`, `core/game.js:2707`; see B1 |
| R5 hiding an NPC mid-use | Likely holds: a hidden NPC's job is aborted with cancel and a sitter is unseated; S4 still proves it | `npc-needs.js:1416-1424`, `npc-behavior.js:427-435` |
| R6 reload keeps visibility | Holds for visibility (saved and applied on register); lighting not checked | `npc-manager.js:353-356`, `2204-2240` |
| R9 second coffee run near 3:20 | Does not hold: about 3:40, and Jun may not queue | B1 |
| R10 Ama's barks with the viewer in another room | Holds: shown as a voiced toast; held during a chat or minigame | `npc-barks.js:26-29`, `240-255`; n2 |
| R11 unused `grumble` pool | Settled: never spoken, V10 will flag it; drop it | n3 |
| R12 B6 delayMs with no conversation open | Holds for the no-conversation case; waits while the PC is open | m1 |
| R14 motion sensor for NPCs | Holds: NPCs switch it on; but only the player's exit turns it off | `lighting.js:1159-1168`, `1031-1044`; m6 |
| R15 ending when every task completes | Still unknown | not reached |
| Turn-back `off` for walkers and queuers | Holds: applies in `goto_target` and `queued`; one already pouring finishes | `npc-needs.js:3485-3491` |
| Lighting variant on `act_evening`, and after a reload | Holds: applied at once, re-read at load | `lighting.js:37-42`, `788-805` |
| R16 `needs` on a `global_variable_changed` mapping | Holds: the mapping's `needs` runs whatever the event (`npc-manager.js:1639-1640`), and `#set_global` emits the event on every call | `chat-helpers.js:552-605` |
| R17 mug pickup event and timing | Event exists (`npc_picked_up:office_mugs`); timing still uncontrolled | m2 |
| R18 Chidi locking on a morning run | Retired by M1's midday condition | M1 |

## Not yet checked (for round 2)

- R15: `objectives-manager.js` all-complete path and `ending-check.js` with no conclusion configured.
- Positions as tile corners on the reused maps; Ama's spot (R1 stays an S1 render check).
- Line caps for barks and ink lines against `dialoguelint.mjs`; every spoken line checked against the planned data (section 7 counts were read, not recounted).
- The `kitchen_seen` mapping (`room_entered:kitchen` data shape).
- player_state: the NPC visibility map (four entries) is not in section 8's table; bounded, but list it.
