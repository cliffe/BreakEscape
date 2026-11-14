B 1 / M 11 / m 10

# Office life sims build plan: review round 3 (design, UX and engine)

Reviewed: `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` at 168875583 (PLAN below), read fresh. Evidence is from the engine, server, map and asset files on `build/ol-sims` at the same commit. Engine paths are under `public/break_escape/js/`. No live game was run. The door layout was checked with `scripts/check_door_alignment.py` on a scratch copy of the scenario with the four rooms and connections added. All six pairs are OK and the script exits 0, so section 3.2's door coordinates hold.

What holds up: the file:line audit in 1.1 is accurate (about 60 function starts spot-checked against `npc-needs.js`, `workstation-state.js`, `seating.js` and `game.rb`; every one matched or was within a few lines). The fixture (`test/js/fixtures/needs-sims-world.mjs`) is hand-copied, so new scenario NPCs do not disturb `GOLDEN_SIMS_DAY`. Every object sprite named in 3.3 exists. All seven cast sheets have walk frames and eight sit frames. The plan reads the exchange, chat, print, magnet and phone code correctly in most places. The findings below are where it does not.

---

## Blocker

### B1. Siân's work never fails: the resource has no `offWhen` (SIMS-7)

PLAN:434 declares `resources.manager_printer` as `{ kind: "printer", object: "manager_printer" }` and puts `offWhen: "manager_printer_off"` on the printer object only (PLAN:223). A work plan resource is down only through its own `offWhen`:

- client: `systems/npc-work.js:73` (`r.offWhen != null && offWhenHolds(r.offWhen, get)` gives `why: "down"`), and `planGlobals` (121-126), which feeds the outage kick (`_tickKick`, npc-needs.js:2333), reads only resource `offWhen` and route globals;
- server: `lib/break_escape/access_work.rb:455` and 514 read `resources(data)[id]['offWhen']`; 1156-1157 copy the resource's `offWhen` and `object` into the plan sent to the browser.

The object's `offWhen` only switches the copier affordance off. Switching the socket off therefore never fails her work use, so the grumble, the frustration, the kick and the check visit never happen, and `see_work_fail` and `see_printer_checked` never tick. Row 36 (the brief's "work judged against a resource") stays unshown. test_access_work, which the plan copies, sets the resource's own `offWhen` (`scenarios/test_access_work/scenario.json.erb:2805-2810`).

**Fix.** Declare the resource as `{ "name": "Manager's printer", "kind": "printer", "object": "manager_printer", "offWhen": "manager_printer_off" }` and keep the object's `offWhen`. Add a node test with the real `npcWork.failures` and a plan built the way the server builds it: a resource whose only `offWhen` is on its object never fails. Make the validator expectation in 5.7 "the resource reads the socket global".

---

## Majors

### M1. SIMS-4 gives Neil a second caffeine source in his own room, which undoes Gary (a)

The IT boiler (PLAN:210) is a kettle preset with `capacity: 2` and no `private` or `owners`. The IT room is private to `["neil", "leila", "nisha"]` (PLAN:177), so from SIMS-4 on, `it_boiler` is a permitted caffeine source for Neil. `_useCandidate` (npc-needs.js:1620-1623) prefers the home object only while it is free and reachable. Any cooldown on `neil_mug` (`_free`, 1449-1450) or a reachability miss sends him to the boiler. OLMP 6.2 (a) makes the room kettle `affordance: false` for exactly this reason ("so IT has no other caffeine source and no fallback walk"). PLAN:373's expected validator output ("Neil's leash with his only target his own post object") is true in SIMS-3 and false after SIMS-4. Neither the standard live set nor SIMS-4's proof re-runs Neil's 2 px stillness check.

**Fix.** Give `it_boiler` `private: true, owners: ["leila", "nisha"]` (Leila's and Nisha's tea are unchanged). Add Neil's 10-minute stillness run and the validator line to SIMS-4's regressions and to the standard live set, since every later slice touches the showcase.

### M2. The paper-leak lever's page lands on a slot the player cannot take (SIMS-4, tour 4:40 and 5:20)

The world reveals "the producer's first free slot, by id" (`revealOutput`, npc-needs.js:5196-5199). Only `it_out_a` and `it_out_b` are takeable (PLAN:214), and the plan's own `_reserve` marks the others `readInPlace` (3630). In the tour, Neil's page lands at 3:30 (slot a; `forget: true`, so it stays). Leila's first natural work use comes at IT load plus 3:00, which is 4:00 on the tour, and every work use prints (`onUse ... revealOutput`), so that page takes slot b. The IT Print Queue print at 4:40 therefore lands on slot c, which can only be read in place. The player cannot take it, so `npc_print_gone:leila` never fires and `take_leilas_page` never ticks. `leila_print_gone` stays false, so `exchange_leila_page_gone` never plays and `hear_page_gone` (5:20) never ticks either.

The pool also runs short over SIMS-4's 15-minute proof. Leila and Nisha each print about every five minutes (work 10 a minute, desk_pc restores 60), and shared pages leave `_prints` (3693-3696), so they can never be recycled.

**Fix.** Make all four IT slots takeable (they carry neutral text) or add two more. Have the SIMS-4 proof assert which slot the lever's page landed on before the player takes it. In the README, note that the tray fills and later prints become cosmetic copies.

### M3. Two task conditions use syntax the condition evaluator does not support

`see_kept_to_it` and `see_kept_out` (PLAN:393) use `Array.isArray(data.skipped) && data.skipped.includes('office_coffee')`. `safeEvaluateCondition` (systems/npc-manager.js:25-123) accepts `data.`, `globalVars.`, `value` and `name` operands, comparisons, negation and `.includes('x')`. Any other term logs "unsupported condition term" and returns false (119-120). Both tasks would never tick. Its `.includes` already tests array membership (102).

**Fix.** Use `data.skipped.includes('office_coffee')` alone. Add a node test that runs every new task condition through the real evaluator, the way the scenario uses it.

### M4. Siân never locks her screen with `lockIfAwayOverSeconds: 20` (SIMS-7, `see_sian_locks`)

The habit does not mean "locks after 20 s away" (PLAN:296). `decideLocked` (workstation-state.js:160-163) decides at the leave from the expected absence: an expected absence of 20 s or less leaves the screen open for the whole trip. Siân's only trips are her coffee station in her own room and the check visit to her printer. `_expectedAwayMs` (npc-needs.js:3046-3058) is both legs at 80 px/s plus the use. From the laptop's cell to the coffee station's cell (PLAN:223) is about five tiles, so the estimate is about 4 s of walking plus the coffee preset's 12 s, roughly 16 s. A check visit is shorter still. `workstation_owner_left:sian_laptop` would never carry `screenLocked: true`.

**Fix.** Set `lockIfAwayOverSeconds: 10`, or read her trips' `expectedAwayMs` from the log in step 1 and pick a threshold that splits them (the visit stays open, the coffee locks). Then the habit shows both outcomes. Correct the wording in sections 4 and 3.4.

### M5. Both "rings out" beats are a race the player will rarely win

The owner answers once it is back at its post (`_ownerCanAnswer`, npc-needs.js:4061-4071), and the phone rings out after `RINGS` 4 rings of `RING_MS` 3 s (171-173), about 12 s after the first ring. Andrés' vending trip is about 2 s out, 8 s (snack) or 6 s (drink) of use and 2 s back, so the ring would have to start the moment he leaves. Siân's coffee trip is about 16 s, so the ring must start within the first couple of seconds of a trip that comes about every ten minutes (caffeine 40 + 70 restored, at 6 a minute). Her lever, the Call Facilities note, is in another room (PLAN:223, 592), so the player cannot even see when she leaves. PLAN:410 and PLAN:439 make these live-proof passes, and tour rows 10:00 and 11:00 promise them to a facilitator.

**Fix.** Make the ring-out deterministic. For Andrés, use his phone break: an owner on its own phone (a `self` job) does not answer (4063-4071, the comment at 4068), and a self job lasts long enough. Put that in the tour ("ring while he is on his phone"). For Siân, either set `"rings": 2` on `sian_phone` and add a mapping on `npc_left_post:sian` with `data.targetId === 'sian_coffee'` that rings her phone after about 3 s (`delayMs`), or move the lever into her office and accept a race that is shown on screen. Keep `desk_phone_unanswered` as the proof.

### M6. The pair's exit test is misquoted, and m02's "break one room earlier" pattern is not proved (SIMS-3)

PLAN:378 passes "a shared break starts in at least one of any three 30-second windows" over 20 minutes. With breaks about every four minutes (the plan's own 3.5 row), a 90-second stretch with no break is normal, so this fails by design. It is also not OLMP 6.4's exit test. OLMP fires the entry break from the room before the crossing (`room_entered:office_corridor` and `room_entered:it_department` on the porter; two other rooms on the domestic, setting thirst). It keeps `room_entered:staff_room` only as a fallback, because a break triggered on entering the staff room "would start too late" (a tick, a 0.7 s wind-up and two walks). The pass is "the pair are at the boiler or the cooler as the player passes, and in at least half of such crossings a voiced pool line or an exchange line is heard". The showcase carries only the fallback (PLAN:259), so the pilot's main pattern goes unproved.

**Fix.** Add Keith `room_entered:it_room` (caffeine 20, 120 s cooldown) and, for the cooler, Jodie on a room the player passes before IT (`room_entered:office` would fire constantly, so prefer `room_entered:reception` or `manager_office`, setting thirst 20). Keep `room_entered:facilities_office` as the fallback. Replace the pass with OLMP's: enter IT, walk straight into the facilities office within 25 s; the pair are at the boiler on arrival; a voiced line or exchange line is heard in at least half of 10 such entries; and the decision log shows the two main needs about four minutes apart.

### M7. "Claims the conditional X" does not work for exact sprite types (Leila's PC and chair, Siân's phone)

The room item pool indexes Tiled items by base type, with trailing digits stripped (`core/rooms.js:186-206`, `indexByType` 229-242). `findMatchFor` looks the scenario type up in that index and takes the first unreserved item: items, then table items, then conditional items, then conditional table items (261-283). The effects:

- `leila_pc` as `pc12` (PLAN:215) finds no `pc12` key. As `pc`, it takes `pc3` on the upper desk at (5.6, 3.3), the first `pc` in room_IT's conditional table layer, not `pc12` at (5.5, 5.3).
- `leila_chair` as `chair-white-1-rotate6` (PLAN:216): the key is `chair-white-1-rotate`, and the first one is `rotate3` at (3.8, 4.9), between the desks.
- `sian_phone` as `phone3` (PLAN:223): as `phone`, it takes the wall `phone4` at (9.1, 1.6) in conditional items before `phone3` on the desk.

`nisha_pc`, `reception_phone` and `sian_laptop` land where the plan wants them only because their target is first in layer order.

**Fix.** Give each of these objects an explicit `position` (with `elevation` for desk items, as the office PCs at sims.erb:192 and 202 have) and its exact sprite, and stop calling them claims. Step 1's render should list each object's final layer and coordinates against 3.3.

### M8. Planned positions block the IT room's only door and put two vending machines where they do not fit

Scenario positions are the sprite's top-left in tiles. The office coffee at (8, 8) has its fixture centre at x 269 (needs-sims-world.mjs:46), so x is 8 tiles plus half its 26 px width. The North and south doors sit at tile column 1 (x 32 to 64), on the bottom row for IT (`check_door_alignment`: it_room south door (48, 32) in office coordinates, IT row 9).

- `it_copier`, photocopier1 at 35x46 placed at (0.9, 7.6) (PLAN:213), spans x 29 to 64 px and rows 7.6 to 9.0. That is the doorway column directly above the door, and its use cell (dy 1) is the door's approach. PLAN:213 says it is "clear of the south door's approach (columns 1 to 2)". It is not, and IT has no other way in from the office.
- `reception_snacks` and `reception_drinks`, 42x60 and 42x61 placed at (8.9, 6.2) and (8.9, 7.6) (PLAN:221), overlap each other (6.2 + 1.9 > 7.6) and run past x 10 into the east wall. room_reception's large plants fill that corner: `plant-large12-top-ani3` at bottom-left (7.0, 7.5) is 64x75, so it spans x 7.0 to 9.0 and rows 5.2 to 7.5, and `plant-large11-top-ani1` at (7.1, 9.5) spans rows 7.2 to 9.5. The snack machine's preset use cell (dy 1) is inside the drinks machine. A front-facing machine on a side wall also breaks props-orthogonal-topdown. The east wall between the counter's end and the plants (rows about 3.2 to 5.2) has room for one machine, and that is where Andrés' home is (8.4, 3.2).

**Fix.** Move the IT copier to the west wall above the waiting chairs, or to the east wall's free stretch between the door (row 2.5) and the plant (row 4.5), with its queue cells clear of both doors. In 3.3, show that reception can hold two south-facing machines with their use and queue cells, for example side by side against the back wall with Andrés' post moved to the front of the counter, or choose another plain map. If it cannot, cut to one machine with a hand-written two-need affordance and test the second preset in node tests only. Step 1 then confirms the positions rather than finding a new layout. Fix the smaller collisions under m3 at the same time.

### M9. SIMS-2's "an arrival with no id is ignored" breaks the stub world, so the golden day cannot stay byte-identical as planned

The node stub world moves an NPC and calls `sys.onArrived(id, 'needs')` with no move id (`test/js/fixtures/needs-stub-world.mjs:27-29`). Ten more direct `onArrived(` calls sit in `npc-needs.test.mjs`, `npc-magnet.test.mjs`, `npc-coffee-off.test.mjs`, `npc-avoidance.test.mjs`, `npc-desk-phone.test.mjs` and `workstation-state.test.mjs`. Under PLAN:356 and its node test "one with no id is ignored" (PLAN:360), every stub arrival is dropped, every job stalls, and `GOLDEN_SIMS_DAY` changes. Yet PLAN:360 says it stays "byte for byte the same". Neither the stub change nor the other test files appear in the slice.

**Fix.** Have the stub's `moveTo` echo `opts.moveId` into `onArrived`, and list `needs-stub-world.mjs` and the six test files in SIMS-2's engine and test scope. Decide whether a missing id is ignored (only once every caller passes one) or treated as the current move (a transitional rule), and test that choice. Count the stub change in the size estimate.

### M10. One speech lock serves every room, so back-room chats will take voiced lines from the office

`_speak` sets the global `_speechUntil` for every line, overheard or not (npc-needs.js:2650-2657). `_pickBark` and the exchange path both wait on `_speechFree()` (2637-2640; `_tickChats` 3920, 3953). With the facilities pair breaking about every four minutes (more often with entry breaks, at `chatterCooldownMin: 2`) and the IT tea pair, lines the player cannot hear will hold the lock while the office and kitchen chats wait. A waiting chat gives up when its overlap runs out (3966). PLAN:156 says the README's office beats "log the same with every door open", and SIMS-5's E3 run measures time, not lost lines. m02 has the same pairs-in-many-rooms shape.

**Fix.** In SIMS-3's regression, count voiced versus picture lines at the office coffee and kitchen cooler over 15 minutes, with the back rooms closed and then open. If the count drops, make the lock apply only to overheard lines (a few lines in `_speak` and `_speechFree`, with node tests), as an engine item for the user, and record it for OLMP.

### M11. The brief asks for traits and schedules; the plan's defaults leave both out

The brief asks for "a varied cast with traits and schedules" and for gaps to be "built in small slices". Open questions 2 and 4 (PLAN:605, 607) default both to the backlog, citing the user's picks of 2026-11-06 (traits unmarked, "timetabled schedules maybe later"). Those picks came before this brief. Traits are about 60 lines of names for existing fields (SIMS-11), with no new behaviour and no sync. That is the cheapest gap in the plan, and leaving it unbuilt is a narrowing the code does not force. Schedules are bigger (about 300 lines), but the brief names them.

**Fix.** Default open question 2 to building SIMS-11 after SIMS-7, assigning the new staff the bundles that match their current fields (Leila careful, Nisha scatty, and so on) so the day plays the same. Default open question 4 to "ask the user now, with SIMS-8's size and sync row", not "backlog until m05 asks". If the user still says later, the brief's gap is then the user's call and stated as such.

---

## Minors

### m1. Two cast sheets have no talk art

PLAN:231 says all nine free sheets have "a talk sheet or visemes". `female_telecom_v2` (Jodie) and `female_security_guard_v2` (Siân), and `male_security_guard_v2` (not cast), have only a walk sheet and a headshot (`assets/characters/`). README_scenario_design.md:2788 asks for `spriteTalk` and `spriteVisemes` on every speaking character, and the validator flags missing art. **Fix:** say so, accept headshot-only talk for these two as the existing office cast already does, and list visemes for them in 6.4.

### m2. room_ceo has no tone entry of its own

`js/data/room-tones.json` maps `room_ceo` to `quiet_office`, and the facilities office is mapped to the same bed (PLAN:188). The private office and the facilities office will sound the same. **Fix:** correct the text, or map `room_security` to `office` so the two quiet rooms differ.

### m3. Smaller collisions in 3.3

`it_boiler` at (8.4, 6.0) sits on the IT plant (`plant-large12-top-ani5`, bottom-left (7.7, 6.8), 64x75, so x 7.7 to 9.7 and rows 4.5 to 6.8). `it_cooler_empty` at (9.0, 8.6) with a 47 px height runs below row 10. `facilities_microwave` at (7.6, 1.8) overlaps the filing cabinet at (7.1, 2.1) (27 px wide), and room_security has no counter, so a floor-standing microwave reads oddly. The pair's homes at x 7.0 are about 45 px from the waiting-chair seat (`chair-waiting-left-1` seat x 24 px, seating.js:218), beyond `NEAR_CHAIR` 36 (1732). **Fix:** move them in 3.3 now, and set the pair's homes about one tile west of the seat.

### m4. "Log the same" is too strong for the old beats

`_chatSeq` is one counter across all rooms and salts each chat's first-speaker and chattiness rolls (npc-needs.js:3870-3871, 3942). `door_opened` clears back-offs and retries parked needs (652, listener 5333). New rooms' chats and door openings will change the office's log, though not its beats. **Fix:** reword PLAN:156 to "the same beats", and have each regression compare beat outcomes and task ticks, not log bytes.

### m5. `see_microwave` will not tick in any planned window

Keith's hunger (70, 2 a minute, urgent at 30) first comes due 20 minutes after the facilities office loads, and the tour's pizza at 7:30 feeds him 60. Neither the tour nor SIMS-3's 20-minute proof reaches it reliably. **Fix:** start his hunger at 50, or add a lever.

### m6. Exchanges need the player within 160 px

An exchange starts only with the player in earshot (`_audience`, OVERHEAR_RADIUS 160, npc-needs.js:2737-2740, 3916). The facilities boiler sits about eight tiles from the west door, and PLAN:582 says only "stay". The Tea Round note's position is not tied to the IT boiler. **Fix:** place both notes within five tiles of `it_boiler`, and tell the facilitator to stand by the boiler.

### m7. Tour rows overlap in time

Tour row "1:30 to 4:00, facilities, stay" overlaps the 3:30 IT row (talk to Neil). **Fix:** make the facilities row 1:30 to 3:20, or move Neil to 4:20 and shift the later rows.

### m8. E2's timing is not gated

OLMP 14 item 7 says the vending preset is "added straight after the pilot as its own item". The slice order (PLAN:315) runs SIMS-5 straight after SIMS-4 with no gate. **Fix:** state that SIMS-5's `office-presets.json` commit merges only after the pilot's merge, or that the user agreed otherwise.

### m9. test_needs_attack uses m01's named characters' sheets

Eli, Fran and Gil (PLAN:329-330) wear `male_office_worker_v2`, `female_office_worker_v2` and `male_nerd_v2`, which m01 uses for Derek Lawson, Sarah O'Brien and Kevin Park. Derek recurs by name in m09 and m10. That is against the plan's own "not free" rule in 3.4. **Fix:** use the generic sheets with no named recurring wearer (`male_security_guard_v2`, `courier_hivis` for a standing role), or record it as an accepted test-floor exception.

### m10. Wrong reasons and bands in a few lines

PLAN:408 says Andrés' phone rings out "with no colleague claim (the room is private)". `_claimAnswerer` (npc-needs.js:4089-4110) skips colleagues because nobody has `answersPhones: true`, not because the room is private. PLAN:419 gives the tempt band as "above 40, at most 70" for both Nisha and Keith. Keith's band is above 30 and at most 60 (urgentAt 30 plus tempt 30, `_tempting` 802-809). His level at 7:30 on the tour is about 58, so the beat still holds. **Fix:** correct both.
