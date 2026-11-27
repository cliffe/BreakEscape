# Lab rooms review, cycle 3: dressing and lighting (`lab_social_engineering`)

Written 2026-10-23. Review only: this file is the only repo file written, nothing committed, no images generated. Kind of game: a lab (education first, browser-only, one working day at Tarnside Assurance with its client Ledgerwell). Skills used: the review parts of `mission-room-dressing` and `mission-room-lighting`. Cycle 2 is `ROOMS_REVIEW_C2.md`; its fixes landed in 364e4e2a9.

**Result: 0 blockers, 0 majors, 6 minors, 5 trivials.** The C2 fixes worked, and the teal line now ties the four rooms together. What is left is mostly the "bright screen means use me" rule. One C2 fix made a desk PC disappear. The Blue Team's interactive monitor still looks switched off. Three decor screens still glow, and three rooms show the same whiteboard art as the hub's interactive one. Two small layout leftovers remain.

## Evidence

Scratchpad: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-rooms-c3/`

- Map renders, 32px grid (`render_room_preview.py --grid --scale 2`): `prev/room_se_engagement.png`, `prev/room_se_recon.png`, `prev/room_se_ops.png`, `prev/room_se_blueteam.png`.
- Lighting tour, game 3812 on keyless :3001, all rooms unlocked (`lighting-tour.sh lab_social_engineering … --close-intro --check --restore-off`): `tour/engagement_office-a.png`, `tour/recon_room-a.png` (dark), `tour/recon_room-b.png` (lit), `tour/operations_room-a.png`, `tour/operations_room-b.png`, `tour/blue_team_room-a.png`. `--check`: Recon and Operations `motion` (off), hub and Blue Team `on`, light map redrawing every ~300ms in all four.
- Teal line close-up, all four back walls: `teal_strip.png`. Screen sprite contact sheet used for the fixes: `screens_sheet.png`.
- In-game object dump (texture, room x/y, visible) of all four rooms from my own session on game 3812, and a walk-and-tap of the SOC board: `blue_soc_approach.png`, log `session-3812b.jsonl`.
- Static: `slot_audit.py --verbose --notes` gives 0 problems and 0 notes prompts (osint → `pc6`, report → `pc6`, mail → `pc8`, page builder → `pc6`, triage → `security_monitor1`, SOC board → `siem_dashboard`). `check_room_walls.py --scenario`: all four read 64. `generate_rooms.py --check` on the four maps: OK; the warnings are the same generic hints as C2 (door corners on walls with no door, the hub's bottom rows). `validate_scenario.rb --skip-ink --no-graph`: no room or sprite warnings.

## C2 findings, closed or not

| C2 # | Outcome |
|------|---------|
| 1 Recon decoy desk | Closed. The OSINT PC is now the only bright PC in Recon; the lower desk reads as a reading desk |
| 2 Hub POV table | Deferred to the POV rerun, as planned |
| 3 Ops decor `pc11` | Glow gone, but the replacement PC is not drawn at all (finding 1) |
| 4 Blue Team SOC board | Closed. Floor under the board is open; `moveToNear soc_board` then `interact` opened the board first time (distance 24.6, in range) |
| 5 Hub report PC / laptop | Closed. Report PC glows, table laptop is dark and matches no emitter |
| 6 Wall treatments | Closed. Teal line on all four back walls (`teal_strip.png`), Ops aisle gone, walls match |
| 7 Recon fridge, kilim | Closed. The small table and its wilted plant were left behind, though (finding 5) |
| 8 Ops cable tangle | Closed |
| 9 Recon lamp | Better. A smaller warm fan still lands on the west wall (trivial T1) |

## Room by room

**Engagement Office (hub).** Still reads well: logo, ENGAGEMENT plate, plan whiteboard and Ledgerwell staff board on the back wall, the boardroom table on a rug with a teal border that picks up the new wall line, report desk, flip chart. The report PC is now the one bright screen, which is right. Ruth (room 112,93) and Fairbairn (208,105) stand on clear carpet in the upper half; Fairbairn's 80x80 frame ends at y 145, 29px above the report PC, so no menu. The planning whiteboard is the `whiteboard1` art, and the same art appears as decor in Recon and Operations (finding 4).

**Recon Room.** Much better than C2. In the dark the OSINT PC and its lamp are what you see first. Two leftovers. The info screen on the back wall is decor but glows as brightly as the PC (finding 3), and the small table with a dead plant still stands alone in the middle of the floor (finding 5). The whiteboard is a copy of the hub's interactive one (finding 4).

**Operations Room.** Teal line and plain carpet in place, cable tangle gone. In game the second desk has two chairs, a picture frame and the phone, but no PC. The `pc8` the fixer put there (#14) is never drawn. The mail workstation claims the other `pc8` (#8), and the engine hides an unclaimed decor sprite when a sprite with the same image name has been claimed. The in-game object dump has no `pc8` in the room at all (finding 1). In the dark the decor `laptop1` still glows beside the page builder (finding 3).

**Blue Team Room.** Still the strongest room. The fix worked: desk2 has gone, so there is open floor under the SOC board, and the board opens on the first tap. Tomasz (192,161) stands clear of every interactable. Two issues. The triage workstation, the room's main task, uses `security_monitor1`, which has a dark grey screen. It looks switched off, while the decor `pc8` next to it throws the brightest pool of light on the desk (findings 2 and 3; it only turns blue when the player is close enough for the hover tint). The kettle table stands in front of the DVR rack's lower face, with the fridge squeezed in beside it (finding 6).

## Lighting

- Mood is unchanged and right: day-office ambient in the hub, dark-on-entry Recon and Operations, a cooler Blue Team.
- The dark rooms can be navigated. Doors, plates and every interactable read.
- The rule C2 settled (only interactive screens glow) is not yet true in three rooms. The stock `pc`/`laptop`/`info_screen` emitters light decor kit too (finding 3).
- Decor racks and cabinets with LEDs (Recon `servers4`, Ops `comms_cabinet1`, Blue Team `aes_dvr1`) glow green. They are not screens and read as kit that is switched on, so I have left them.

## Findings

| # | Room | Severity | Finding | Change |
|---|------|----------|---------|--------|
| 1 | Operations | minor | C2 #3's decor PC on the phone desk is never drawn. `#14` is now `pc8`, the same image as the mail slot `#8`, and `rooms.js` hides an unclaimed decor sprite whose image name matches a claimed one. The desk shows two chairs, a frame and a phone, and no computer | `room_edit.py room_se_ops sprite 14 pc12` (31x24 with a dark navy screen; keep x 124, feet 155, clear of `picture13` at 158). Claim order is unchanged because #14 stays last in `table_items`. In `scenario.json.erb` `operations_room.lighting.emitters` (around line 1575) add `"pc12": [ { "intensity": 0 } ]` so the stock `pc` emitter doesn't light it |
| 2 | Blue Team | minor | The triage workstation (`security_monitor1`, #29) has a dark grey screen and looks switched off. It is the room's main task, and the decor `pc8` beside it reads as the live machine | Use the lab's "use me" PC: `room_edit.py room_se_blueteam sprite 29 pc6`, `move 29 150 95` (ends at x 182, the desk edge), `move 28 136 95` (phone, slight overlap with `pc8`'s keyboard; check in the render), `relayer 26 table_items` (moves decor `pc8` after #29). In `scenario.json.erb` change `triage_workstation` `"position": "as-type:security_monitor"` (line 1680) to `"as-type:pc"`. Rerun `slot_audit.py`: triage → `pc6` at 150,95 |
| 3 | Blue Team, Ops, Recon | minor (lighting) | Decor screens still glow. Blue Team: the decor `pc8` casts the brightest pool on the monitoring desk (`blue_soc_approach.png`). Ops: decor `laptop1` (#21) glows next to the page builder in the dark. Recon: decor `info_screen1` glows as brightly as the OSINT PC in the dark | `blue_team_room.lighting.emitters` (around line 1650): add `"pc8": [ { "intensity": 0 } ]`. Ops: `room_edit.py room_se_ops sprite 21 laptop7` (22x17, dark screen; keep x 166, feet 217) and add `"laptop7": [ { "intensity": 0 } ]` to `operations_room.lighting.emitters`. `recon_room.lighting.emitters` (around line 1540): add `"info_screen": [ { "intensity": 0 } ]`. Re-render Recon and Ops dark |
| 4 | Recon, Operations | minor | The hub's interactive Planning Whiteboard is `whiteboard1`, and the same art (org chart, red circle) hangs as decor in Recon (#3) and Operations (#33). A student who has just read the hub board taps the copies and gets nothing | `room_edit.py room_se_recon sprite 3 whiteboard2` and `room_edit.py room_se_ops sprite 33 whiteboard2` (same 44x28, a bullet list and bar chart, already preloaded). Nothing claims either slot |
| 5 | Recon | minor | Seed leftover: `smalldesk2` (#2) stands alone mid-floor holding `wilted_plant1` (#26) and an unclaimed conditional `notes1` (#25). It reads as dropped furniture, and the dead plant suggests neglect in a room the student works in | `room_edit.py room_se_recon delete 26`, `delete 25`, `delete 2`; then `add items shredder1 150 250` (18x24, beside the bin at the lower desk's end: a research room that handles printouts should shred them, a quiet nod to the lab's dumpster-diving point). Check `generate_rooms.py --check room_se_recon` |
| 6 | Blue Team | minor | The tea point's table (`smalldesk2` #13, x 236–268, top y 195) stands in front of the DVR rack's lower face (#24, x 252–288, bottom y 210), and the fridge (#19) is squeezed in to its left | Pull the tea point down and left, clear of the rack: `move 13 204 250`, `move 32 206 221` (kettle), `move 33 218 225` (mugs), `move 19 240 250` (fridge, under the rack, clear of it), and move the fridge's blocker rectangle in `Object Layer 1` (#20, now 214,228) to 242,240. Table top 209 stays below Tomasz's frame (bottom y 201). Re-render |

Trivial (fix if convenient, no recheck needed):

- **T1 Recon lamp.** The lamp (`office-misc-lamp4`, x 35) sits against the PC's left edge and still throws a small warm fan up the west wall onto the fire alarm call point, dark or lit (`tour/recon_room-a.png`, `-b.png`). Add `"offsetX": 10, "radius": 36` to the `office-misc-lamp` emitter at line ~1542 so the pool falls on the desk.
- **T2 Chair convention.** Recon and the hub put desk chairs north of the desk, behind the monitors. Operations and Blue Team put them south, in front. Both read fine on their own. If the POV rerun needs one rule, use Operations' rule.
- **T3 Hub chairs.** The table mixes three front-facing leather `exec_chair_black1` with two `exec_chair_back1` swivels that render almost solid black under daylight. Leave them, or swap the two front ones for the back view of the same leather chair if one exists.
- **T4 SOC board approach.** `moveToNear soc_board` still stops the player with their feet on the floor line, overlapping the CCTV feeds. This is the harness aiming at the board's top-left. The floor below is open, and a real tap from one tile out works. No map change.
- **T5 Blue Team floor.** `room_se_charcoal` renders as warm taupe, not charcoal. It does mark the SOC as a different space, and nothing needs changing. Name the sheet for what it is if the script is rerun.

Not raised:

- Green LED glows on racks and cabinets (see Lighting).
- `generate_rooms.py --check` hints: door corners on walls with no door, the hub's bottom rows (no room to the south), the Ops extinguisher on the east wall strip (correct).
- Validator warnings about Ruth's `eventMappings`: these are dialogue wiring, not rooms.

## Order for the fixer

1. Map edits with `room_edit.py` (findings 1, 2, 3's laptop, 4, 5, 6), one `Room(...).save()` per map. Then `slot_audit.py --notes` (triage → `pc6` at 150,95; everything else unchanged), `generate_rooms.py --check` on the four maps, `check_room_walls.py --scenario`.
2. Scenario edits (findings 1, 2's `as-type`, 3, T1). Re-read `scenario.json.erb` first, because other agents are editing it. Then `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --no-graph --skip-ink --strict-social`.
3. Lighting tour again (`--close-intro --check --restore-off`). Check: the Ops phone desk shows a dark PC; the only bright screens in the dark Ops room are mail and page builder; Recon's info screen is dim; Blue Team's triage PC is the bright one and the decor PC casts no pool.
4. A short in-game check of the triage workstation (`moveToNear triage_workstation`, `interact` opens the inbox triage, no pick-one menu with the phone) and the Recon desk (OSINT tap still direct).
5. **POV backgrounds are now out of date.** The teal line, Blue Team's missing desk2, and Recon's missing fridge and kilim all changed since they were made. Hold the POV rerun until this cycle's fixes land.

## Assumptions

- Assumption: "only interactive screens glow" (C2's lab-wide rule) still stands, so decor PCs and screens get zeroed emitters, not just dark art.
- Assumption: I traced the missing Ops PC to the same-image hiding rule (the in-game dump has no `pc8` in the room, and the skill documents the rule); I did not read the `rooms.js` line itself.
- Assumption: I chose `pc6` for the triage workstation (the lab's existing "use me" sprite) over drawing a lit `security_monitor` variant; drawing one would keep the security look but adds new art.
