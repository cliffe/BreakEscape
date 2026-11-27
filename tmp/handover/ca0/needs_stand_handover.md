# Needs stand-point fix: handover (context limit reached)

## Root cause
npc-needs.js engine world approachCell(obj) aimed at the item's sprite CENTRE (findNearestWalkableWorldCell(obj.x,obj.y,3)) or a useFrom tile offset (dx*32, dy*32 from the centre). NPC feet = body.center (20x10 body at the sprite bottom). For tall items (coffee station 41px, cooler 47px, copier 46px) the centre is ~20px above the base, so feet ended 10-20px off (office_coffee useFrom west: feet 16px above base, 10px sideways; kitchen copier 17px below base). The world grid is 8px with a clearance ring, so a cell is never inside a collider; no final snap is needed.

## Fix (done, in working tree / committed see below)
- public/break_escape/js/systems/npc-needs.js: new exports approachTarget(obj, rect, elevation) and approachProbes(aim); spriteRect helper in createEngineWorld; approachCell uses them first (desk objects, magnets on tables, elevated+useFrom items, and window.__needsLegacyApproach keep the old path). floor base = sprite bottom + elevation (depth = bottom+0.5+elevation). useFrom now names a SIDE (larger of |dx|,|dy|), feet body bottom 2px past base line.
- test/js/npc-needs-approach-target.test.mjs: 12 tests, all pass.

## A/B (static, test_needs_sims, window.__needsLegacyApproach toggle; feetToBase = body bottom - floor base)
office_coffee (west) 10px side gap, -16 -> 2px gap, 0; kitchen copier 17 -> 1; water cooler 10 -> 2; office copier 11 -> 3; washing_up_tray -6 -> 2; kitchen_coffee (north, behind) gap 7 -> 0, still -40 (author's useFrom dy -1, behind the table); fridge, microwave, desks (overlap 1 = seated, unchanged), tom_phone, tool_roll unchanged by design. No overlaps, no doorway hits.

## Still to do
1. Live "using" before/after screenshots + gaps (scratchpad needs_stand/probe.mjs; before shots exist in needs_stand/before_sims and before_sims_k; run probe.mjs with ENTER=kitchen against game 13790 on port 3456 for after, tag after_sims_k). Server on :3456 is mine (start-keyless-server.sh 3456); games: test_needs_sims 13790, m02 13791, ca12_visitor_tailgater 13792. Run ab.mjs (same dir) on 13791 and 13792 (ENTER rooms needed; check scenarios for kitchen/office rooms) for coffee/cooler/printer/PC across m02 and CA.
2. Run bin/test-js (needs tests at least: test/js/npc-needs*.test.mjs, needs-*.test.mjs); look for golden/ops-unchanged fixtures that record NPC positions and re-record only those changed, list reasons.
3. grep tools/video/takes/ for needs-driven NPC positions (coffee/cooler/printer marks) and say whether a landed trailer take needs a retake (CA trailers: any take showing an NPC at a machine will shift by up to ~16px).
4. Kill my server on :3456 when done (only my PIDs).
