# Room backgrounds: decisions (2026-10-11)

ANSWERED 2026-10-11: all four approved as recommended. Tesseract common room feedback: remove the green half-wall; the lockers stand out on the floor in front of the back wall, not against it; prompts should say which things hang on the back wall and which stand away from it, at what depth. sis02 Helen change is done in the sis02 run (last in order).

## 1. Sign off The Tesseract Trials' university style

Concept for the common room (the busiest room: Megan and Cliffe): `<session scratchpad>/tesseract/common_room/concept_v2_real.png`, with the in-game tour shot beside it in `tesseract/compare.png`. Matches the map: noticeboard, SEC and CTF posters, TV, boiler, vending machine, four blue lockers, kitchenette, foosball, dartboard, coffee table. Known faults: the left door sits near the camera instead of by the back corner (a known Gemini limit; only a regeneration can move it), and the edit that removed a stray pipe also took the red fire alarm call point (hidden behind the NPC's portrait). Recommendation: approve, and do the other ten rooms in this style.

## 2. Sign off sis02's energy-site style

Concept for the SCADA control room (Helen and Priya): `<session scratchpad>/sis02/scada_control_room/concept.png`, compared with the tour shot in `sis02/compare.png`. Matches the map: video wall, red-edged console, wallpaper monitor, stop buttons, alarm panel, table, two chairs, lavender walls, purple carpet, lit by screen glow. Known faults: the network-diagram board moved to the right wall, and the east door is nearer the camera (both hidden behind the NPC's portrait). Recommendation: approve; sis02 stays last in the order.

## 3. sis02: Helen's opening briefing uses `Background[none]`

`scenarios/sis02_energy/ink/npc_helen_marsh.ink:70` brings Helen in on a plain frame for her whole opening briefing, the mission's most-seen scene, so the control room background won't show there. Options: change it to the room's background, remove the line (the engine then keeps the last background, the battery hall exterior), or leave it. Changing ink touches a finished mission's dialogue structure but no spoken text. Recommendation: point it at the control room background once that exists.

## 4. Tesseract: the closing debrief in the foyer pins hq4.png / hq5.png

`scenarios/lab_tesseract_trials/scenario.json.erb:524-525`. These are SAFETYNET HQ images, used for the debrief with the handler, so they look deliberate (the briefing cutscene at :410 is the same). Recommendation: keep them.

## 5. m01: sign off the corporate-office style (IT room, Kevin)

Concepts: `<session scratchpad>/m01/it_room/v3_vs_v4.png` (left v3: daytime, right v4: relit), side-by-side with the tour shot in `m01_it_room_side_by_side.png`. Both match the map: landscape screen, two wooden server cabinets around the blue rack, desk with monitor and fan, easel, chairs, plant, door near the back-left. Faults: the back desk sits about 20% right of the map's, the cabinets are single-door, and there's an extra bin. v4's relight used the evening wording and greyed the periwinkle walls and the rack; m01 is a day office. Options: (a) v3 plus a daytime relight edit (shafts and haze, daytime colours kept; 1 Gemini call), (b) v3 as it is (little haze), (c) v4 as it is. Recommendation: (a), and the other twelve rooms in that daytime style.

## 6. Retrofit volumetric lighting on m02 and sis01 (15 rooms)

One lighting-only edit plus one PixelLab conversion per room, using each mission's own time of day. Recommendation: yes, after sis02.
