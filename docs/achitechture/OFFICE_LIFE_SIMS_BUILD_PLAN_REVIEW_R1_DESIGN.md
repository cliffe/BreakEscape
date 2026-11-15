# Office life sims build plan: review round 1 (design, UX and engine)

B 3 / M 11 / m 11

Plan reviewed: `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` at df75423f0 (branch `build/ol-sims`). Every claim below was checked against the code at that commit; the missions plan was read at `plan/office-life-missions` head 1aaf57349. No live run was made: each finding rests on code or map data that a run would not change.

What holds up: the audit's file:line references are accurate. I checked about 120 of them (all the npc-needs.js, seating.js, workstation-state.js, npc-action-icons.js, lighting.js and validate_npc_needs.rb anchors in table 1.1) and every function starts on the cited line. Door alignment for the proposed layout is right: porting `scripts/check_door_alignment.py` by hand gives office north (48,32), office south (48,288), meeting east (304,-176), manager west (336,-176), reception west (16,336) and print room east (-16,336), all pairs matching. Hacktivity's fixtures (`test_objectives`, `test_simple_success`) are untouched. The spoken-line rules in 5.1 are sound.

Verdict: not ready to build. Three blockers (a leash that stops Howard walking, a cast sprite that is a recurring named character, a print room with nine floor tiles) and eleven majors, most of them beats that will not happen as specified.

---

## Blockers

### B1. Howard's leash forbids every walk SIMS-5 asks of him

Evidence: `_goHome` passes `avoidRooms: this._avoidRooms(s)` to `moveTo` (npc-needs.js:3781); `_avoidRooms` lists every loaded room that `_roomForbidden` refuses (npc-needs.js:1209-1212); with `needsRooms: ["manager_office"]` every room except his home is forbidden (npc-needs.js:1197-1205). The plan gives Howard exactly that leash (plan 2.4, Howard row) and then has him arrive at reception and walk "through the office and the meeting room to his office" (plan 2.5, 10:00 row), and leave via reception (SIMS-5 behaviour, "reusing the summon's clean stop and `_goHome`").

Failure: the path search avoids office, meeting_room and reception, so the arrival walk has no route and the leave walk cannot start. The SIMS-5 live proof ("a second run ... shows Howard's arrival") fails.

Fix: drop Howard's `needsRooms`. The private room (`needsPrivateTo: ["howard"]`) plus a private kettle and his own PC already keep every need target in his room, which is OLMP protection 2 in effect. If a leash is wanted for the showcase, state in SIMS-5's engine section that schedule walks (`arriveForDay`, `leaveForDay`) call `moveTo` with no `avoidRooms`, and add a node test with a leashed scheduled NPC.

### B2. Howard's sprite is Director Netherton

Evidence: `male_spy_v2` is the sprite of Director Magnus Netherton in m02 (the pilot), m03, m05 and m06 (`grep spriteSheet` in each `scenario.json.erb`, record `director_netherton`). AGENTS.md:61 says a named recurring character gets art of their own, "not a generic sprite another mission also uses", and memory note cast-diversity.md says the same. The plan states "none is a named recurring character's own key" (plan 2.4, under the sprite table) and its open question 2 recommends casting the spy sprite as Howard.

Failure: a facilitator who shows the showcase to students who then play m02 to m06 puts SAFETYNET's director in a coat-and-hat office-manager role with another name. The evidence behind the recommendation is wrong.

Fix: correct the claim, close open question 2 as "leave `male_spy_v2` unused", and cast Howard from an unused generic office sprite (check `assets/characters/*_headshot.png` for one with sit frames that no named character uses), or list a new character in 5.4. Note too that `female_security_guard_v2` is Val Okonkwo in the m02 pilot (record `security_guard_patrol`); she is named but used as a generic guard in m10 and tests, so Hannah may keep it, but the plan should say so.

### B3. The print room has a 3 x 3 floor

Evidence: `small_room_1x1gu` is 5 x 6 tiles; its walls layer leaves floor only at columns 1-3, rows 2-4 (nine tiles; dumped from `public/break_escape/assets/rooms/small_room_1x1gu.json`). The plan puts in it a copier with two output slots, a shredder, a filing cabinet, a wall switch, Kirsty's tile home, and Ollie fetching prints and checking the switch (plan 2.3, print_room; 2.4, Kirsty; 3, row 36). The copier and shredder presets each want a free `useFrom` cell below them (office-presets.json `copier`, `shredder`), and the east door's approach cell is also on that floor.

Failure: three floor objects with their use cells, the door cell and two NPCs do not fit in nine tiles; the copier queue and the carry to the shredder block each other and the door, and the room reads as a cupboard.

Fix: use a 10 x 6 map for the print room. `room_lw_postroom` (10 x 6, a post room with a credenza and trolley; its only branding is the small `lw_sign_post1` sign) and `room_archive_1x2gu` are candidates; render each and pick. A 10 x 6 room west of reception keeps the door pair aligned (both west/east doors sit at y + 80). Re-run the alignment script and add the render to the slice's first step.

---

## Majors

### M1. SIMS-1 diagnoses half the cause and its live proof cannot fail

Evidence: seating's chair fetch moves the NPC with `goToAndStay(..., { owner: 'needs', fromSeating: true })` (seating.js:2029-2033, `moveNeeds`), and its comment says "its arrival is ignored while using", that is, not ignored at any other time. `_triggerGoToStayArrival` emits `npc_arrived:<id>` with the move's owner (npc-behavior.js:3064-3100), and `onArrived` adds any owner-`needs` arrival to `_arrivals` (npc-needs.js:630-633). So a chair fetch or tuck-in that ends near the desk is indistinguishable from a job arrival. The baseline oddity the plan itself records (Grace logging `return_resumed` at (116,156), beside her desk, every 12 ticks; plan 1.3) is what a fetch fighting the walk home looks like. The plan names only stale EasyStar paths (plan 1.3, last paragraph).

Failure: with a distance check plus "re-issue the move at most twice", a seating move that keeps re-issuing near the desk makes the job fail with `arrival_far` instead of reaching the sofa, which is a new visible fault. And the live proof (20 forced `rest` trips, plan SIMS-1) passed twice already in the plan's own probes (games 3560, 3572), so it can pass without the fix.

Fix: tag moves. `goToAndStay` takes a `moveId` (a counter from the needs system), echoes it in the `npc_arrived` payload, and `onArrived` keeps only the arrival whose id matches the current job phase's move; seating's moves carry none. Keep the 48 px check as a second guard and log `{ moveId, fetch: !!behavior._fetch }`. `moveDebug` is then unnecessary (the arrival payload already has x, y at npc-behavior.js:3094-3100). Live proof: first reproduce the fault on the unfixed build (start a needs job while `behavior._fetch` is active, through the test bridge), show the wrong `using`, then show the fixed build logging the rejected arrival and walking on.

### M2. Both leash beats show nothing the private rooms do not already show

Evidence: `_roomForbidden` treats a private room exactly like a leash (npc-needs.js:1199-1203), and `pick.leashed` and `_noteLeash` fire for any room-rule skip (npc-needs.js:1594-1596, 1603, 2886). The lounge is private to Rosa and Grace (sims.erb:815) and the manager's office would be private to Howard. Kirsty's deny list is `["lounge","manager_office"]`, both private (plan 2.4). Hannah's allow list excludes lounge, manager_office, meeting_room and print_room; the first two are private and the last two hold no source for any of her needs (plan 2.3).

Failure: `see_kept_out` (`npc_needs_leashed:kirsty`) ticks from the private-lounge rule with or without her deny list; Hannah's allow list never skips anything. Row 4 is shown in name only.

Fix: give each leash something to refuse. For example, a `kettle1` in the meeting room (open to everyone, nearer to reception than the office coffee) that Hannah's allow list skips, and a kitchen in Kirsty's deny list so the kitchen cooler (nearest after reception's) is passed over. Make the task conditions check `data.skipped` contains that object id, so a private-room skip does not tick them.

### M3. Zara will check social media at her laptop, not on her phone

Evidence: `_socialCandidate` adds the NPC's own workstation as a `social_media` source before the phone and returns it when free (npc-needs.js:2148-2170); a desk is any object with `workstation: true` (`isDeskData`, npc-needs.js:4632-4637); `zara_laptop` is `workstation: true` and her `needsHome` (plan 2.3, 2.4). The phone is used only when no station candidate exists or the station is `socialBlocked`.

Failure: `see_phone_break` (`npc_used_phone:zara`) rarely or never ticks; the tour's "Zara on her phone (phone icon)" does not happen.

Fix: block social media at her laptop by PC policy (`policy: { social: "blocked" }` on the object or the room's default policy, as test_access_social does at scenario.json.erb:41, read at npc-needs.js:4679), and say so in the object's `_comment`. A node test: Zara with a blocked laptop takes the `self` job.

### M4. The juniors' chat and exchange cannot start

Evidence: exchanges are played only on a chat pair (`_findExchange` is called from `_tickChats`, npc-needs.js:3907), and a pair forms only when two compatible NPCs use one object with `capacity` 2 or more and a `chatter` topic (`_maybePair`, npc-needs.js:3863-3867). Queue chats play no exchanges (npc-needs.js:4466-4512). Zara's needs are social_media, caffeine, hunger; Ollie's work, caffeine, hunger (plan 2.4): neither ever uses a cooler, and the meeting room has no shared object. `leftover_lunch` has no `capacity` or `chatter` (plan 2.3).

Failure: `hear_juniors` never ticks; plan 3 row 19 ("reception cooler; Zara and Ollie as a group") and row 22 ("once, near the meeting table") describe beats that cannot occur.

Fix: either give the leftover lunch `capacity: 2, chatter: "lunch"` and a `lunch` pool, so the exchange plays when both eat it (tying it to the player's lever and the meeting table), or give both a `thirst` need and put a capacity-2 cooler in the meeting room. State which in 3 and the tour.

### M5. The newcomers crowd the office coffee inside the README's proof window

Evidence: Ollie's caffeine is 20/40/60 and Zara's 15/40/75 (plan 2.4), so Ollie is urgent about a minute after the meeting room loads and Zara about two and a half; Hannah (8/35/70) a few minutes after reception loads. Their caffeine sources are the office coffee or the kitchen (plan 2.2, table). The tour opens the north door at 1:00 (plan 6). The office coffee is already the contended source for the README's queue, outcast and turned-back beats (sims.erb tasks `see_queue`, `see_turned_back`, Amara 20/40/58 at sims.erb:499-501).

Failure: SIMS-3's regression rule ("the first two minutes in the office must log the same beats as game 3537 apart from new NPC lines") breaks whenever a tester follows the new tour: Ollie joins the queue that `see_queue` describes as "Marek joins the line behind Tom".

Fix: give the meeting room its own kettle (which also serves M2) and reception its own drinks (SIMS-6 vending, or a kettle behind the desk), so the newcomers do not draw on the office coffee in the first minutes; or start their caffeine at 90. Re-run the README's queue beats with all doors open as a SIMS-3 regression.

### M6. The regression lists miss tests that break and cite uses that do not exist

Evidence:
- `test/js/validator-office-presets.test.mjs:84-93` asserts the exact list of preset objects in test_needs_sims; SIMS-3 adds eight.
- `test/js/inventory-menu.test.mjs:30-60` scans test_needs_sims for `"droppable": true` and compares with a fixed list; SIMS-3 adds `old_rota` and `leftover_lunch`.
- `test/js/npc-voiced-chatter.test.mjs:22` reads this scenario's ink; plan 2.1 does not list it.
- SIMS-4 says lab_physical_pentest "uses `needs: suspend/resume` mappings"; no scenario uses a string `needs` mapping (grep over `scenarios/*/scenario.json.erb`). SIMS-5 says lab_physical_pentest "uses `gameClock`"; it has none.

Failure: SIMS-3 lands with two red node tests; SIMS-4 and SIMS-5 regressions run a scenario that does not exercise the changed path.

Fix: add the three tests to 2.1 and to SIMS-3's node-test list, with the updated expected lists. For SIMS-4, the regression for `suspend`/`resume` is a node test on `control()` (npc-needs.js:949-965); for SIMS-5, the `gameClock` regressions are m05 (scenario.json.erb:609) and any test of `game-clock.js`.

### M7. The slice order follows a superseded missions plan

Evidence: the missions plan at 1aaf57349 says "Pilot: m02 ransomed_trust (the user's choice, 2026-11-14)" (section 6), then m06, m05, m08 (6.11); "The vending preset (E2) lands as its own item straight after the pilot, before m06" (6.11, 14 item 7); E5 is "a design rule plus V2 ... A 'summon to post' helper is backlog only" (section 9); E1 runs "in a small `test_needs_attack` scenario" (section 9). The sims plan names m06 as pilot (plan line 7, 4 "Campaign needs"), marks vending optional and late (SIMS-6), builds the summon fourth for m05 and m08 (SIMS-4), and puts the E1 probe into the neutral showcase as a "Checks" aim plus `test_npc_needs` (SIMS-2).

Failure: the build order spends effort on a summon no mission plan asks for before the vending preset the next mission does, and adds combat tasks to a showcase meant to stay neutral.

Fix: re-anchor "Campaign needs" and the needed-by column on m02 then m06. Order: SIMS-1, SIMS-2 (in `test_needs_attack`, as the missions plan says, with the hostile-from-start NPC there too), SIMS-3, SIMS-6 (before m06), SIMS-5 (m05's evening), then SIMS-4 and SIMS-7 as optional backlog. Check what m02 needs from the showcase: print and forget on a copier (built), protection 2 (shown in test_needs_leash), a group (`night_staff`), and `roomToneTypes` for hospital rooms (not shown anywhere; consider one mapped room type in the showcase).

### M8. Hidden NPCs are registered and keep decaying; SIMS-5 assumes the opposite

Evidence: `register` has no hidden test (npc-needs.js:443-470) and install registers every NPC (npc-needs.js:539); `_tickNpc` decays every need first (npc-needs.js:1259) and only then blocks an unavailable NPC (1273-1281); on becoming available again it logs `unblocked` and calls `_goHome` (1282-1285). Row 48's evidence "registration skips `ko`/`hostile`/`hidden` (npc-needs.js:875 ...)" cites `_newsHearers`, not registration. SIMS-5 says "Before `arrive` (game time) it is hidden and unregistered with the needs system".

Failure: Joe, hidden for 26 minutes, appears at 17:15 with every need at 0 and goes straight for food and coffee instead of the night desk; Howard likewise at 10:00. The engine section does not name the change that prevents it.

Fix: in SIMS-5's engine section, `arriveForDay` resets levels to their jittered initials and `lastSatisfiedAt` to now (reuse the code in `register`, 461-466), and `_tickNpc` skips `_decay` while a schedule holds the NPC out. Correct row 48's evidence to `isAvailable` (1086) and the block at 1273-1281. Node test: an NPC hidden for 20 minutes arrives with its initial levels.

### M9. Reception has no staff side and no way in from outside

Evidence: in `room_reception` the counter (`reception_table1`, x 76-250, y 43-90) stands against the back wall, whose wall rows are 0-1 (walls layer dump); there is no gap behind it and no desk chair, only four `chair-waiting` seats at y 5.7-6.7 facing east and west. Its only doors are the ones the plan adds (north to the office, west to the print room). The SIMS-5 example uses `arriveFrom: { room: "reception", x: 1, y: 1 }`, a wall tile, which is also where the north door to the office is drawn (door at local (48,32)).

Failure: Hannah stands on the visitors' side facing the wall, so the "front desk" reads as a visitor at the counter; the SIMS-4 proof ("seated at the desk with the bubble hidden") cannot be met; arriving staff appear in the office doorway, so they seem to come out of the office; the plan's own validator rule ("the tiles are floor in their rooms") rejects its example.

Fix: give Hannah a desk object with a swivel chair below the counter facing south (or render other reception maps such as `room_hospital_reception`, `room_zds_reception`, `room_aes_reception` for one with a staff side and no story branding). Add a decor street door on reception's south wall, set `arriveFrom` and `leaveVia` to the floor tile in front of it (for example (5,8)), and keep SIMS-5's validator floor check.

### M10. Zara and Ollie wear player avatars

Evidence: `female_hacker_hood_down_v2` and `male_hacker_hood_down_v2` are player sprite choices (`app/models/break_escape/player_preference.rb:14`, `:21`); `male_hacker_hood_down_v2` is Agent 0x00 in m02, m03, m05, m07, m08, m09 and m10 (`player.spriteSheet`); the default player is the near-identical `male_hacker_hood_v2` (core/player.js:217).

Failure: a player who picked either avatar, or anyone who knows the campaign, sees a copy of the player working at a laptop; screenshots for the README are confusing.

Fix: cast the juniors from generic office sprites with sit frames, or list two new characters in 5.4 with stand-ins. Update the sprite table's "used by" facts (the plan lists them as unused generic extras).

### M11. The tour promises beats that will not happen as written

Evidence and failures, each against plan 6 or 2.5:
- 2:20 "Howard at his desk": after SIMS-5 he is hidden until 10:00 game time, 4:30 real (2.5).
- 3:00 "a third turns back with Missed it": only Zara and Ollie see the lunch in the meeting room, and nobody hears of it (no announce); no third hungry NPC is there.
- 2.5 row "from about 10:30: lunch: fridge and microwave queues ... built": hunger runs on the needs clock (wall time); nothing ties meals to the game clock, and at hunger 6/min people eat several times in a 26-minute "day".
- 1:00 Zara on her phone (M3), and the juniors' chat (M4).
- Two rows at 4:30; the buzzer step needs Hannah away, which the facilitator cannot arrange without the debug bridge.

Fix: rewrite the tour after the fixes above, as one ordered list with a "how to force it" column for each lever-dependent beat (the levers that exist: the notes set needs through `needs.set` mappings, as the Activity Board does at sims.erb:520). Remove the lunch row or make the leftover lunch the lunch beat. Put Howard's room after 4:30 once SIMS-5 lands, or open his door later in the tour.

---

## Minors

### m1. Consumables already emit an event

`useConsumable` emits `item_consumed` with `itemId` (consumables.js:216-218). SIMS-3's only engine change ("`consumables.js` emits no event today ... about 3 lines") is not needed. Fix: task `drink_a_coffee` on `item_consumed` with `data.itemId === 'kitchen_cup'`; SIMS-3 engine size 0.

### m2. Print-room uncollected task: wrong field and wrong default

`npc_print_uncollected` carries `ownerId`, not `npcId` (npc-needs.js:3689), so `data.npcId === 'ollie'` never matches; and `print_copier` sets no `uncollectedAfterSeconds`, so the default 60 s applies (npc-needs.js:3629-3635), below Ollie's `fetchAfterSeconds` upper bound of 150. Fix: pattern `npc_print_uncollected:ollie` with `data.forgotten`, and `uncollectedAfterSeconds: 180` on `print_copier`, as the office copier does (sims.erb, office_copier `_comment`).

### m3. Eight sit frames, not 24

Each of the six sprites has one `sit_<direction>` frame per direction, eight in all (`<key>.json` `frames`; animations `sit_east` ... `sit_west`). Fix the sentence under the sprite table.

### m4. The print room is silent

`room-tones.json` maps no profile for `small_room_1x1gu` (or a replacement map); an unmapped type stays quiet. Fix: scenario `roomToneTypes` entry for the print room's map (for example `office`), and say so in 3 row 31.

### m5. Two objects need fields the plan leaves out

The `filing` preset has no `satisfies` (office-presets.json `filing`), so Kirsty's `work` at `print_filing` has no source; add `affordance: { satisfies: "work" }`. `project_board` is a "whiteboard" type with no sprite (`assets/objects` has none); use `chalkboard` like the Activity Board, or the meeting map's `smartscreen`.

### m6. Some built behaviours are missing from the audit

Not in table 1.1: `maxUnmetMin` (a starved need overrides deferral, npc-needs.js:1410-1413), `printHabit.shareAfterSeconds` (an unclaimed print becomes anyone's, 3691-3696), `npc_print_gone` (the owner finds the player has taken the print, 3682), `deferrable: false` story needs (1580-1582). None is shown in test_needs_sims. `npc_print_gone` is the paper-leak beat the m02 pilot's openings rest on. Fix: add rows, and a task "Take a printout before its owner fetches it" on `npc_print_gone:tom`.

### m7. The E3 comparison measures rooms as well as NPCs

The 11-NPC run has four more rooms loaded (sprites, lighting emitters, room tone) than the 6-NPC run. Fix: run both on the seven-room scratch copy, once with the five newcomers given no `needs` and once with needs, so the delta is the needs cost.

### m8. Sync list misses the dropped lunch

5.5 counts "up to 3 `objects_added` entries (the rota, the dropped mugs or notebook on a KO)"; the player's dropped `leftover_lunch` is one more, as the missions plan's own sync table counts a dropped magnet (OLMP section 7). Fix the count.

### m9. Unconnected rooms overlap by a wall

By the engine's placement (stack = height minus 2 tiles), manager_office spans y -256 to 64 above the lounge (0 to 320) at x 320, and the print room (y 256 up) sits under the kitchen (y 0 to 320) at x -160 to 0, each overlapping by two tile rows with no door. Fix: add both pairs to SIMS-3's render check (walls drawn, behind-wall fade, no cross-room interaction through the overlap).

### m10. Leave times are not all after 25 minutes

SIMS-5 says "Leave times are after 25 minutes"; Kirsty leaves at 16:00 (22:30 real) and Howard at 16:30 (24:00). Fix the sentence, and check the longest README proof window against 22:30.

### m11. The in-world magnet path needs its own proof

The validator warns that a magnet not held by the player "draws nobody" (validate_npc_needs.rb:272-273); the m06 need is precisely an in-world source (OLMP section 5, m06 row). The plan's proof eats the lunch but does not reload. Fix: SIMS-3 live proof picks the lunch up, drops it, eats one serving, reloads, and checks the lunch is where it was dropped with one serving left; add a node test for pick up then drop of a room-placed magnet.
