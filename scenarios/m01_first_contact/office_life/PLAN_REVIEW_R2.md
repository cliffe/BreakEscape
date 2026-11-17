# m01 office-life plan review, round 2

Counts: B 0, M 2, m 5

Reviewed: PLAN.md, ANALYSIS.md, DIALOGUE_SAMPLE.md, SPOKEN_LINES.md at 6d2c2f8d1 (worktree p-ol-m01). Engine paths are under `public/break_escape/js/` in that worktree. Stopped at the context limit; "Not checked" lists what is left.

## R1 fixes verified

- B1 (pc claim): holds. `findMatchFor` takes the first unreserved item of the exact type, items layer first, then table_items (core/rooms.js:261-279). room_office.json has no `pc` in `items`; table_items order is pc8 (id 141), pc6 (142), pc11 (143). Images index as `pc8` etc., base `pc` (rooms.js:186-192, :506-511). Graham first claims pc8, Fatima second claims pc6. Unclaimed pc11 is still drawn as decor (its image name `pc11` is not in `usedItems`, rooms.js:2525-2530), so the one-sprite-per-PC assertion is right: three PCs, no extra.
- Spare-`pc` fallback: it claims pc6 at its Tiled spot, so it draws nothing extra, and it cannot reach a story PC (the pool is per room; main office declares no PC). It does turn pc6 into an examinable scenario object, so give it a `name` and plain `observations`.
- M1 leash: holds (npc-behavior.js:667-669, :1056-1061; `chaseRange` in px, npc-chase-leash.js:42-44).
- M2 cooler `offWhen`: holds. Object-level key is copied into the world object (npc-needs.js:5236-5240), read by `_isOff` (:829-837); `validate_npc_needs.rb:443-462` errors if undeclared and warns if nothing sets it, which the tier 2 `setGlobal` mappings cover.
- m1 stock profiles: holds. Room types: it_room `room_it` -> `it` (spots []), conference `room_meeting` -> `meeting`, server `room_servers` -> `server` (authored `ambientSound` :2123), halls `hall_1x2gu`, offices `small_office_room*_1x1gu` and closet `small_room_storage_1x1gu` -> null (office-room-tone.js:42-47; data/room-tones.json). Only `office` and `reception` carry spots, and both are mapped. No unmapped room can play a phone or copier spot.
- m2, m4, m5: the text is in place.
- Step 0 ink: the shape works with person-chat. A story that ran to `-> DONE` saves variables only (npc-conversation-state.js:86-97) and re-talk restarts at `currentKnot` (person-chat-minigame.js:536-545). The `#exit_conversation` / `-> DONE` tail is the m03 `upset` knot's own shape (m03_npc_yusuf_demir.ink). The `-> start` root divert matches the m03 files.

## M1. The extras' spawn positions are the chairs' Tiled bottom-left corners, which puts their feet in the wall and on a desk (PLAN.md:97, :122, :84; ANALYSIS.md:57)

Evidence: an NPC's tile position is its feet (body centre): npc-sprites.js:318-327 and :118-125. Tiled gid objects are anchored bottom-left, and the plan copies those numbers: chair-white-2-rotate6 is at (0.87, 5.41), 32x32, so its centre is about (1.37, 4.91); chair-white-2-rotate3 is at (6.81, 5.39), centre about (7.31, 4.89). Fatima's feet at (0.9, 5.4) are 28.8 px from the room edge, inside the west wall column (walls layer column 0, rows 2 to 8), and touch the south-west desk (desk1 x 30 to 108 px, y 166 to 205 px). Graham's feet at (6.8, 5.4), y 172.8 px, overlap the top of the south-east desk (desk1 at 6.58, 6.41: y 166 to 205 px). Step 0 also says "Add Fatima alone, seated" before any PC or `work` need exists, and the NPC JSON has no `seated` key (seating.js:1029-1045), so the plan never says what seats her in step 0.

The same corner-for-centre error is in the `useFrom` values. The needs world measures from the sprite centre (npc-needs.js:5224-5228, approach at :5426-5430). pc8's centre is about (7.15, 3.74), so the offset to Graham's chair centre is about dx 0.16, dy 1.15, not dx 0, dy 1.3. pc6's centre (2.75, 5.15) to Fatima's chair gives about dx -1.38, dy -0.24, close to the plan's values only by chance.

Fix: spawn each extra at the chair's seat point, not its corner: Fatima about (1.37, 4.95), Graham about (7.3, 4.95), and confirm in the step 2 render. Recompute both `useFrom` values from sprite centres (Graham about dx 0.15, dy 1.15). In step 0, state how Fatima sits: `"seated": true` with the corrected position (nearest free chair, seating.js:1029-1036), removed or kept when step 2 adds the `work` need, and say which. Correct ANALYSIS.md:57 to label the coordinates as Tiled bottom-left anchors.

## M2. Tier 2 exchange globals do not match the knot names (PLAN.md:35, :211, :214, :247; SPOKEN_LINES.md:56-69)

Evidence: the engine sets `heard_<knot>` itself when an exchange is heard (npc-needs.js:2954, :3062, :5559). The knots are `exchange_interns` and `exchange_biscuits`, so the engine writes `heard_exchange_interns` and `heard_exchange_biscuits`. The plan declares `heard_ex_interns` and `heard_ex_biscuits`, which nothing will ever set, and the globals the engine writes are undeclared. A once-only exchange then depends on the in-session `_exPlayed` set and can replay after a reload, which breaks the "heard once" rule for spoken lines. m03 avoids this by naming knots `ex_*` and declaring `heard_ex_*` (m03 scenario.json.erb:839-841, :2254-2256). The first exchange entry also carries `"requireGlobal": null`; the engine tests `requireGlobal !== undefined` (npc-needs.js:2983), so a null key is passed to `_globalHolds` instead of being skipped.

Fix: rename the knots to `ex_interns` and `ex_biscuits` (in PLAN.md 4.8, SPOKEN_LINES.md and DIALOGUE_SAMPLE.md), keep `heard_ex_interns` and `heard_ex_biscuits` declared false, and drop the `requireGlobal` key. Consider gating both on `{ "fatima_ko": false, "graham_ko": false }` as m03 does.

## m1. Cooler at (5.4, 8.2): no door or clue blocked, but the use side and the stated stand point are off (PLAN.md:188, :201)

Settled from the map and doors.js. The south wall of room_office.json has no door tile; the door is placed at run time. main_office_area has one south connection (reception_area, which has a single `north`), so `placeSouthDoorSingle` takes its default branch and puts the door at x 1.5 or x 8.5 tiles by parity (doors.js:165-213). Both are clear of the cooler, so its x does not need resolving. East and west are single connections, so their doors are at y 2.5 (doors.js:243-296), not row 7. Scenario positions are top-left (origin 0,0, rooms.js:694, :598-599), so the 24x47 sprite covers x 5.4 to 6.15, y 8.2 to 9.67. The bottom overlaps the south wall row by 0.67 tile, in line with other maps (many stock maps place items to 9.4 to 9.68). No clue object, seat or desk is in that strip; the nearest are chairs at (3.1, 7.14) and (6.6, 7.0) bottom-left.

Problems: (a) the approach cell is computed from the sprite centre (npc-needs.js:5426-5430), about (5.78, 7.93), not "(5.4, 7.2)" as written; (b) the cooler sprite faces south, towards the camera, so against the south wall the extras stand behind it and use the back; (c) the only north-south passage through the room is the central aisle (x about 3.4 to 6.56 between the desk blocks), narrowed to about x 4.1 to 6.6 at y 6 to 7 by the two south chairs. Two users side by side at the cooler stand at the aisle's south mouth, on the route from reception to both hallways. The plan declares no `affordance.queue`, so its "queue cells" text describes nothing; the second user takes a beside cell (npc-needs.js:3395-3411).

Fix: correct the stand point, drop the queue wording or add a `queue` block, and add to the dressing render a check with both extras at the cooler that the aisle mouth keeps a clear one-tile path. Name the facing as a known compromise in Q1, or offer an east-wall spot as option a2.

## m2. DIALOGUE_SAMPLE.md section 3 timing does not match the mapping (DIALOGUE_SAMPLE.md:35; PLAN.md:216-224)

The mapping sets Fatima's thirst to 20 (below `urgentAt` 30) 2 s after a non-reception entry, so she leaves almost at once, not "thirty seconds after". Fix the stage direction.

## m3. ANALYSIS.md contradictions (ANALYSIS.md:70, :74, :76)

- :70 gives the IT room type as `room_IT`; it is `room_it` (scenario.json.erb:1584), which is why it takes the stock `it` profile.
- :74 says "Desk phones and PCs are Tiled decor; none is declared", but :67 and :80 and positions_base.txt show declared PCs and desk phones elsewhere (derek_computer, Kevin's Workstation, IT Monitoring Station, patricia_desk_phone, reception_desk_phone). Limit the sentence to the main office.
- :76 gives the cooler art as `objects/hospital_extras/water_cooler1.png`; the file is `assets/objects/water_cooler1.png`, and no `hospital_extras` folder exists under assets/objects in this worktree. Check Q1 b's coffee-station art path too (PLAN.md:287).

## m4. Credits and HaX are fine; D88 options are coherent

Q1 to Q5 (the D88a to D88e questions) each have a default that tier 1 builds alone: no new object, no machine, no Maya change, Fatima and Graham, break room `quiet_office`. Tier 1 does not depend on any tier 2 key. Q1 a carries the cooler issues in M2 and m1; Q3 b's use of "the main office machine" means nothing under Q1 c and should say it needs Q1 a or b.

## m5. Fallback `pc` needs a name

If the spare `pc` is used (PLAN.md:84), it becomes an examinable object at pc6. Give it a `name` and a plain `observations` line in the plan so it does not show a bare type.

## Not checked

- `needsCompany` groups `vd_office_staff` declared and validator-clean.
- Whether `facePlayer` on a seated swivel-chair extra fights the work facing.
- Re-hide mappings: `setVisible: false` on a seated NPC releases its chair and PC reservation (test 9 covers it live).

## Outcomes

- M1: fixed. Spawns moved to the chair sprite centres, Fatima (1.37, 4.91) and Graham (7.31, 4.89); `useFrom` recomputed from sprite centres (Graham dx 0.16, dy 1.15; Fatima dx -1.38, dy -0.24); step 0 uses `"seated": true`, removed in step 2 when `work` is added; ANALYSIS.md labels the chair coordinates as bottom-left anchors with centres.
- M2: fixed. Knots renamed `ex_interns` and `ex_biscuits`; `requireGlobal: null` dropped; both exchanges gated on `fatima_ko` and `graham_ko` false; `heard_ex_*` declared false.
- m1: fixed. Stand point (5.78, 7.93) from the 24x47 sprite centre; facing named as the accepted compromise; queue wording dropped; dressing render checks a one-tile path from the south door with two users at the cooler; position stays as settled (D88 a).
- m2: fixed. DIALOGUE_SAMPLE.md section 3 now says about two seconds.
- m3: fixed. ANALYSIS.md has `room_it`, the main-office-only PC sentence with the declared story PCs and phones named, and the art path `assets/objects/water_cooler1.png`.
- m4: fixed. The machine question is settled as the cooler (tier 2), so the Maya and machine dependence is gone; the D88 answers are in PLAN.md section 10.
- m5: fixed. The fallback spare `pc` carries `"name": "Desk PC"` and `"observations": "A spare desk PC, switched off."`.
