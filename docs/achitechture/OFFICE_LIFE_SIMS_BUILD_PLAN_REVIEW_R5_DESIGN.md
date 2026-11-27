B 0 / M 5 / m 12

Slices 1 to 5 alone: B 0 / M 4 / m 10

# Office life sims build plan: review round 5 (design, UX and engine)

Reviewed: `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` at ef9e308bc, read fresh against the code on `build/ol-sims` and the missions plan head (`plan/office-life-missions` 9defbd111, draft 13). Plan line numbers are given as `plan:N`. Engine paths are under `public/break_escape/js/`.

What holds up, checked in the code and not repeated below: the use-start coupling (`npc_use_started:<object>` with `npcId`, emitted on every use start at systems/npc-needs.js:3201 through `world.emit`, which reaches `eventDispatcher` at :5281); `needs.set` through `control` (:949, an unregistered NPC returns false at :951); mapping `cooldown` in wall ms with a 5000 default and `delayMs` re-checked at the end (systems/npc-manager.js:1202-1225, :915-935); `safeEvaluateCondition` handling `globalVars.x === true && globalVars.y !== true`, `data.npcId === 'keith'` and `.includes` on arrays (npc-manager.js:25-125); wildcard patterns such as `object_revealed:*` (systems/npc-events.js:45-58); `chatterCooldownMin` per NPC (npc-needs.js:2623); exchanges that wait for an audience, hold both uses up to 60 s and set `heard_<knot>` (:2681-2761, :3901-3930); object `requireGlobal` gates (:266); presets with authored fields winning and `officeType` (systems/office-presets.js:49-81); every staff-room and IT claim in 3.3 against the drawn layers of `room_hospital_staff.json` and `room_IT.json` (the first `office-misc-cup` in IT's table items is (6.69, 8.15); `notes6` (7.38, 1.12) is the first conditional note); both static seats and `NEAR_CHAIR` (systems/seating.js:206-210, :1732); seated frames on every cast sheet; the door layout (`check_door_alignment.py` on a mock of the planned connections: all six pairs OK, IT's and reception's south and north doors at x 48, the side doors at room row 2.5). Neil's numbers (60 / 6 / 45, restore 30, no jitter) give sips at 2:30 and about 7:34 as stated. A declared `neil_mug` with `takeable: false` is not turned into a player cup: only undeclared decor gets the cup treatment (core/rooms.js:2895-2903).

## Majors

### M1 (SIMS-4). The "first visit" mapping fires on every entry, so every cooler crossing chains a boiler break and trips the plan's own setup-failure rule

`plan:237` gives Keith `room_entered:staff_room` with only `cooldown: 120000` and `delayMs: 2000`. `room_entered:<room>` is emitted on every change of detected room (core/rooms.js:3178-3209; a doorway gap resets the current room, so a step back in re-emits it). Every crossing in proof steps 2 to 4 is "more than two minutes after the last start" (`plan:379-381`), so this mapping fires on each of them.

Failure: step 4 (`plan:381`, tour step 6 at `plan:563`). The player enters the private office (Jodie's thirst to 20), walks back across IT (about 320 px plus two door transits at `MOVEMENT_SPEED` 150 px/s, utils/constants.js:39, so 2.5 to 3 s) and enters the staff room; 2 s later Keith's caffeine is set to 20 while he is at the cooler with Jodie. That is a start on a different partner about 4.5 to 5.5 s after Jodie's, right on the 5 s line of the setup-failure rule (`plan:377`). Runs under 5 s are discarded; runs over 5 s produce a cooler break followed at once by a boiler break (Keith leaves the cooler for the boiler, his use start couples Jodie), so step 5's "after every break both NPCs return home" (`plan:382`) fails. In steps 2 and 3 the entry start lands on Keith while he is already at the boiler: harmless to the beat, but it resets his level mid-use (see M2). m02 has the same shape (Kim's close starts the domestic's cooler break, then the player walks through the staff room: OLMP 6.4 mappings 1 and 3), so this is OLMP feedback too.

Fix: decide in both plans what the staff-room entry mapping is. Default: make it a real first visit with `"condition": "data.firstVisit === true"` (the payload carries `firstVisit`, core/rooms.js:3200-3209; `revealRoom` does not mark discovery, :3081-3093), keep `delayMs: 2000`, and drop the cooldown. If every entry is meant to start a break, keep it but change step 4 and step 5 to expect the chained boiler break, exclude same-crossing entry starts from the setup-failure rule, and say so in the tour row and the README. Either way, send the finding to the OLMP owner for m02's mapping 1.

### M2 (SIMS-4). The break rhythm in 2.1, 3.5 and proof step 6 ignores that every event start resets the starter's phase; step 6 cannot be run as written

The staff room loads when its door first opens, so the first-visit start fires about 3 s after load in every game (including step 6's "own fresh game"). Keith's caffeine is then set to 20, restored by 40 with 10 % jitter (npc-needs.js:985-993, :3301-3303) to about 56 to 64, and comes back at 35 about five minutes later (about 4:47 to 6:23), not on the natural schedule of `plan:256-259` (2:00, then every eight minutes). Jodie's natural thirst comes at 6:00 plus or minus 1:18 (65 jittered by 10 %, initial jitter at :465). So Keith's second boiler break and Jodie's first cooler break can fall within seconds of each other: exactly the "two starts on different partners" overlap that `plan:122` warns sends the pair to different objects. After that the two main needs keep an eight-minute cycle each, so breaks come in pairs about a minute apart with seven-minute gaps, not "about every four minutes, alternating" (`plan:95`, `plan:259`, `plan:383`). Each later start that sets a level mid-use (M1's entry start, the Neil close) shifts the phase again. Step 6 also says "twenty minutes in the staff room with no entries" (`plan:383`), which cannot happen: being in the room needs an entry, and that entry fires the mapping.

Because the seed is fixed (`npcNeedsSeed`) and the restore jitter draws from the per-NPC rng in a fixed order, the schedule is deterministic per game and can be computed.

Fix: in step 1 of SIMS-4, log the jittered initials and compute the schedule from the first-visit start. Rewrite 3.5's staff-room rows from that start (Keith's boiler at about 0:03 and 5:00 to 6:00; Jodie's cooler; the microwave at 8:00; then the eight-minute cycles). Then either tune Jodie's initial thirst so her first cooler break lands about four minutes after Keith's second boiler break (for example, initial 80 gives about 9:00), or accept the paired rhythm and say so. Restate step 6 as "one entry, then twenty minutes without leaving" with the computed times as the pass. Send the arithmetic to OLMP, whose "every four minutes" rests on the same numbers.

### M3 (SIMS-5). V10's rule would flag the showcase's queue chatter, which is a real trigger path

`plan:394` says a chatter-object topic needs "an object of capacity 2 or more ... with that chatter value". The engine also pairs the user of a capacity-1 object with the first in its queue: `_tickQueueChats` and the `queue: true` chat (npc-needs.js:4487, :3888, :3899), and the schema says so ("With a chatter pool, the NPC using it chats with the first queuer", scripts/scenario-schema.json:3726). The showcase relies on it: the office coffee station is one-at-a-time with a queue and `chatter: "coffee"` (sims.erb:245-250), the Activity Board beat in the README. Exchanges also run through that chat (`_findExchange` is called for queue chats in `_tickChats`).

Failure: V10 reports the top-level `coffee` pool and every NPC's `coffee` lines as untriggerable; the node test (`plan:397`) then pins those false warnings for `test_needs_sims`, and the Scenario bullet (`plan:399`) tells the builder to remove flagged lines.

Fix: add the rule "or a capacity-1 object with that `chatter` value and a queue (not `queue: false`) that a compatible NPC may also queue at", apply it to exchanges as well, and add a fixture pair: a capacity-1 queued coffee with two compatible users does not warn; the same with `queue: false` warns.

### M4 (SIMS-5). The live proof counts heard lines from a staff-room run, so it cannot test V10 for most pools

`plan:401` counts "voiced lines heard per pool" from the SIMS-4 20-minute run plus SIMS-3's. In that run the player is in the staff room; `playerHears` needs the same room (npc-needs.js:4946), so no office pool can be heard, and SIMS-3 has no pools. Most pools would pass only through the escape clause ("or the report says why it was not"), and the grumble pools need levers nobody pulls in that run. Heard is also the wrong measure: V10 claims a pool can be triggered, and the engine spends a line whether or not anyone hears it (OLMP E7; `npc_chatted` carries `line` and `overheard: false` when nobody is there, npc-needs.js:3940-3961).

Fix: count lines spoken (non-null `line` on `npc_chatted`, `npc_announced`, grumble and call events), across all rooms, from a run that plays the README's office beats with their levers (deadline memo, Activity Board, sockets, cake, spare phone) plus the staff-room run. Pass: every pool V10 passes is spoken at least once, or the report names the lever it needs; every fixture pool that warns is never spoken in its scratch scenario over 10 minutes.

### M5 (SIMS-9). Siân's `call_supplier` knot collides with Tom's

Tom already has `phoneCalls: [{ "knot": "call_supplier" }]` (sims.erb:578), `heard_call_supplier` is already declared (sims.erb:43), and `hear_tom_call` completes on `npc_call_heard:call_supplier` (sims.erb:559). Knot state is global by name: `_chooseCall` skips any knot whose `heard_<knot>` holds (npc-needs.js:4171) and `_finishCall` sets `heard_${knot}` and emits `npc_call_heard:${knot}` (:4283-4290). Planned at `plan:229` and `plan:497`.

Failure: hearing either call silences the other for the session and after a reload, and Siân's call ticks Tom's task. The sync row (`plan:507`, and "two calls" in 6.5) counts a `heard_call_supplier` that already exists.

Fix: name Siân's knot `call_sian_supplier` (or similar), declare `heard_call_sian_supplier: false`, and add a validator note (V10 or validate_npc_needs.rb) that warns when two NPCs share a `phoneCalls` or `exchanges` knot name.

## Minors

### m1 (SIMS-2). Step 1's log fields are not available where the plan reads them

`plan:340` logs `arrival { moveId, pathLeft, dist }` in `onArrived` with `dist` to the behaviour's `_goToStayDest`. On the build as it stands there is no `moveId`, `pathLeft` is not in the payload, and `_triggerGoToStayArrival` nulls `_goToStayDest` before it emits (systems/npc-behavior.js:3070, emit at :3097). Fix: compute `dist` in `onArrived` from the payload's `x, y` (already sent, :3097-3102) against the needs system's own destination (`job.dest`, the queue cell, or `s.home`), and add `pathLeft` to the payload in the behaviour before the path is cleared.

### m2 (SIMS-2). The distance check turns an unreachable second-user cell into a failed job

Today a capacity-2 partner whose `besideCell` has no route (OLMP E8; the cell is chosen at npc-needs.js:3094-3101 without a path check) uses the object from where its path ended. Under SIMS-2 that is a far arrival, re-issued, then `arrival_far` and a walk home. That is the right behaviour, but it can change the kitchen cooler pair in the README's office beats. Fix: a node test for it, the kitchen cooler pair named in the regression outcomes, and a line to OLMP that E8 cells now fail visibly after SIMS-2 (so the pilot's hand-written cooler cell is required, not optional).

### m3 (SIMS-2). The natural reproduction loop has no bound

"In a loop with a fresh seed each time, until a `using` entry more than 48 px from its approach cell appears" (`plan:340`) can run forever, as the two earlier probes did not repeat it. Fix: cap it (for example 30 runs), and record that the stubbed short path (`plan:349`) is the reproduction if the cap is reached.

### m4 (all slices, so 1 to 5). The regression lists miss three files that read this scenario

`plan:134` and the standard node set (`plan:303`) list the 8a and 8c parity tests but not `test/js/format-8b-reader-parity.test.mjs` (its edit-proof check reads the live template, :24), `test/unit/format_8b_corpus_test.rb` (test_needs_sims-specific assertions at :260-283 on `tom_pc` and `sanjay_pc`) or `test/unit/format_8c_corpus_test.rb`. New owned desk PCs and phones go through exactly these readers. Fix: add all three to 3.1 and the standard set.

### m5 (SIMS-4). `see_shared_break` ticks on an unheard chat turn

`npc_chatted:staff_boiler` is emitted for every turn, picture or line, heard or not (npc-needs.js:3927, :3961), so the task can tick while the player is in the office. Fix: add `"condition": "data.overheard === true"` if the task means "see"; otherwise title it as `see_microwave` is described.

### m6 (SIMS-5). The rule set omits magnet `announce` pools

The cake announces from the scenario pool `news_cake` (sims.erb:81), spoken through `_pickBark` (npc-needs.js:853). It is not a chatter-object topic, a grumble, `greet` or a phone topic, so under `plan:394` it is "a topic the engine does not speak" and warns. Fix: name `magnet.announce` pools in the rule (triggerable when the magnet has an NPC who can see it and a room to tell it in).

### m7 (SIMS-5). The pinned V10 warnings go stale in SIMS-6 to SIMS-9

`plan:397` pins test_needs_sims's warnings to step 1's list, and SIMS-6 to SIMS-9 add pools (`tea`, Siân's grumble) and calls without listing `test/js/validator-office-life-v10.test.mjs` in their node tests. Fix: add it to each later slice's node tests, or move it to the standard node set.

### m8 (SIMS-5). Scenario-level pools need a defined meaning

A top-level pool joins every NPC's pool of that topic (`chatterPool`, npc-needs.js:242-252), so a per-NPC reading would warn on `coffee` or `grumble` for every NPC who never reaches a coffee or turns back (Neil, Keith, Jodie). Fix: say a scenario-level pool warns only when no NPC in the scenario can trigger that topic, and an NPC's own pool warns when that NPC cannot.

### m9 (SIMS-4). Ten seconds is shorter than the waiting exchange

Step 1 and tour step 4 have the player "stand within earshot ... for 10 s" (`plan:378`, `plan:561`). Five lines at `exchangeLineMs` (2.5 s plus 50 ms a character, up to 6 s) plus 0.5 s gaps (npc-needs.js:44-46, :209) take about 20 to 30 s, and pairing comes about 5.5 s after entry (OLMP 6.4 measured 3.25 to 3.5 s after the 2 s delay). The exchange completes whether or not the player stays, so the pass is read from `npc_exchange_heard` with `complete: true`; but a facilitator who leaves at 10 s misses most of it. Fix: "stand by the counter until the pair go back to their seats, about 40 s".

### m10 (SIMS-1). `check_solo_break` proves less than (g) claims

`npc_left_post:gil` with `fran_ko` (`plan:318`) ticks on any leave by Gil after Fran's knock-out, his own cooler trip included; it does not show "he never waits for her" (`plan:326`). Fix: in the probe, assert that after Break Time Gil enters `using` at the kettle within his walk time plus the wind-up, that no pairing forms, and that Fran's state stays `blocked`.

### m11 (section 3.2). The door rule is true for this layout only

`plan:161` says north and south doors sit at columns 1 to 2. `check_door_alignment.py` (and doors.js) put them at `w - 48` on odd grid parity (scripts/check_door_alignment.py `door`). The mock run puts every planned north and south door at x 48, so nothing here moves; the sentence should say "on this layout (checked)" so a later room added elsewhere is not placed by the rule.

### m12 (section 3.2). A paragraph splits the rooms table

`plan:156` sits between table rows, so the `reception` row at `plan:157` renders as a stray line in most viewers. Fix: move the `needsPrivateTo` sentence below the table.

## Rest of the plan, briefly

- The brief is covered: the open-plan floor and its print corner, the kitchen, the meeting room (lounge), the private office, reception, IT and the staff room; traits and schedules are answered in 5.10 and section 8 with sizes and sync rows; every built behaviour in 1.1 has a place in section 4 and a tour row.
- Casting follows the free-sprite rule and is honest about the four white newcomers and the existing cast's borrowed sheets (6.4). All cast sheets have seated frames.
- Props: the copier on IT's east wall, the boiler and cooler on drawn decor; orthogonal, no downscaling, no new art.
- Sync stays within fixed, authored counts, each a one-key delta; nothing grows with play time (apart from M5's miscounted call global).
- Tour rows 4 and 6 need the changes from M1, M2 and m9.
