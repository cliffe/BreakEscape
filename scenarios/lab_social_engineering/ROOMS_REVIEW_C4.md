# Lab rooms review, cycle 4: dressing and lighting (`lab_social_engineering`)

Written 2026-10-23. Review only: this file is the only repo file written, nothing committed, no images generated. Kind of game: a lab (education first, browser-only, one working day at Tarnside Assurance with its client Ledgerwell). Skills used: the review parts of `mission-room-dressing` and `mission-room-lighting`. Cycle 3 is `ROOMS_REVIEW_C3.md`; its fixes landed in a48a04a0e.

**Result: 0 blockers, 0 majors, 3 minors, 6 trivials.** Every C3 finding is closed. The rooms read well and the teal line ties them together. What is left is small. Blue Team's decor CCTV bank glows brighter than the interactive SOC board next to it. A padlocked, three-quarter-view filing cabinet in Blue Team suggests a lock puzzle that doesn't exist. Recon's info screen is dim in the dark but shows bright live-looking art once the lights strike, and tapping it does nothing.

## Evidence

Scratchpad: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-rooms-c4/`

- Map renders, 32px grid (`render_room_preview.py --grid --scale 2`): `prev/room_se_engagement.png`, `prev/room_se_recon.png`, `prev/room_se_ops.png`, `prev/room_se_blueteam.png`.
- Lighting tour, game 3854 on keyless :3001, all rooms unlocked (`lighting-tour.sh lab_social_engineering … --close-intro --check --restore-off`): `tour/engagement_office-a.png`, `tour/recon_room-a.png` (dark), `tour/recon_room-b.png` (lit), `tour/operations_room-a.png` (dark), `tour/operations_room-b.png` (lit), `tour/blue_team_room-a.png`. `--check`: Recon and Operations `motion` (off), hub and Blue Team `on`, light map redrawing every 300 to 333ms in all four.
- Close-ups: `ops_zoom.png`, `blue_zoom.png`, `blue_wall_zoom.png` (Blue Team back wall in game, CCTV glow). Sprite comparison for the swaps below: `candidates.png`.
- Static: `slot_audit.py --verbose --notes`: 0 problems, 0 notes prompts (hub report → `pc6` 214,204; OSINT → `pc6`; mail → `pc8`; page builder → `pc6`; desk phone → `phone3`; triage → `pc6` at 150,95; SOC board → `siem_dashboard`). `check_room_walls.py --scenario`: all four read 64. `generate_rooms.py --check` on the four maps: OK, with only the usual generic hints (wall items where a north door could be drawn on walls with no door, bottom-row feet in rooms with nothing to the south, the Ops extinguisher on the east wall strip, Recon "only one floor plant").
- **Not run:** a live tap check. I opened my own session on game 3854 to tap the triage PC and the OSINT PC, but `page.goto` timed out twice (the keyless server was busy with other sessions, 3864 and 3866). Session stopped and cleaned up. The C3 recheck item "triage tap opens directly, no pick-one menu" is therefore **unverified in game**. Statically the triage PC is the only claimed object on that desk, and `phone4` beside it is decor, so a menu is unlikely.

## C3 findings, closed or not

| C3 # | Outcome |
|------|---------|
| 1 Ops phone desk PC | Closed. `pc12` (#14) is drawn with a dark navy screen and no glow in the dark shot |
| 2 Blue Team triage PC | Closed visually: `pc6` at 150,95 is the bright screen on the monitoring desk; `as-type:pc` in the scenario. In-game tap not re-run (see Evidence) |
| 3 Decor screens glow | Closed for the three named: Blue Team `pc8` dark, Ops `laptop7` dark, Recon `info_screen` dim in the dark. Two decor screens it didn't name still glow or look live (findings 1, 3) |
| 4 Whiteboard copies | Closed. Recon #3 and Ops #33 are `whiteboard2`; only the hub has `whiteboard1` |
| 5 Recon leftover table | Closed. Table, dead plant and stray notes gone; shredder beside the bin |
| 6 Blue Team tea point | Closed. Table 204–236, fridge 240–262 at feet 250, both clear of the DVR rack (bottom 210); fridge blocker moved to 242,240 |
| T1 Recon lamp | Closed. The pool now falls on the desk, not the wall |
| T2–T5 | T2 (chair convention) and T5 (floor name) unchanged, as expected. T3 carried below as T5. T4 harness-only |

## Room by room

**Engagement Office (hub).** Still the best room. Logo, ENGAGEMENT plate, the interactive plan whiteboard and the Ledgerwell staff board sit together on the back wall; the boardroom table on its teal-bordered rug, the report desk, flip chart and fig fill the floor without crowding. The report PC is the one bright screen. Ruth and Fairbairn stand on clear carpet in the upper half, away from every interactable. The two back-view swivels at the front of the table still render as near-solid black shapes (T5).

**Recon Room.** Reads as a research office: working desk with the bright OSINT PC and lamp, a reading desk with binders and cups, bookcase, notice board, whiteboard, the RECON plate, shredder by the bin. In the dark the OSINT PC is what you see first, which is right. Once the motion lights strike, the `info_screen1` on the back wall shows a bright blue date-and-figures display beside the RECON plate. It looks like a live screen you should check, and tapping it gives nothing (finding 3). The right half of the room is open carpet with only the rack and plant (T6).

**Operations Room.** Clear story: mail workstation, phone desk with the interactive desk phone, page-builder desk, a kit workbench under the plate, year planner, copier and filing. In the dark, the mail and page-builder PCs are the two bright screens; the decor `pc12` and `laptop7` stay dark. The wall-mounted `comms_cabinet1` throws a large green halo beside the plate, the third-brightest thing in the dark room (T1). The cluster hugs the west wall and leaves the right third empty (T4).

**Blue Team Room.** Strong SOC story: threat map, eight CCTV feeds, the BLUE TEAM plate over the SOC board, rota board, DVR rack, tea point, Tomasz on clear floor. The triage PC is now the bright screen on the desk. Two things undercut it. The CCTV bank (`cctv_monitors1`, `cctv_monitors2`) matches the stock screen emitter, so the decor feeds cast a white glow across the back wall that outshines the SOC board, the room's interactive wall screen (finding 1). In the top-right corner, `filing_cabinet_locked1` is a three-quarter-view cabinet with a big brass padlock and locking bar. It is decor, but a padlock reads as a lock puzzle in this game, and it breaks the square-to-the-walls rule for kit that lines a wall (finding 2). The phone on the monitoring desk is squeezed between the two PCs (T2) and the DVR rack is also a three-quarter sprite (T3).

## Lighting

- Moods are right and unchanged: day-office hub, dark-on-entry Recon and Operations, slightly cooler Blue Team (`#b2b8c8`).
- Dark rooms are navigable. Doors, plates and every interactable read; the strike works in both motion rooms.
- "Only interactive screens glow" now holds everywhere except the Blue Team CCTV bank (finding 1).
- LED glows on racks and cabinets (Recon `servers4`, Ops `comms_cabinet1`, Blue Team `aes_dvr1`) were kept in C3 on purpose. That still holds for the racks; the Ops cabinet's halo is larger than it needs to be (T1).

## Findings

| # | Room | Severity | Finding | Change |
|---|------|----------|---------|--------|
| 1 | Blue Team | minor (lighting) | The decor CCTV bank glows. `cctv_monitors` matches the stock screen emitter (`lighting.js:179`), so both banks throw a white halo across the back wall (`blue_wall_zoom.png`) that is brighter than the interactive SOC board beside them. A student scanning for "the screen to use" sees the feeds first | `scenario.json.erb`, `blue_team_room.lighting.emitters` (line ~1678): add `"cctv_monitors": [ { "intensity": 0 } ]`. Re-shoot Blue Team: the SOC board's green glow should be the only glow on the back wall |
| 2 | Blue Team | minor | `filing_cabinet_locked1` (#10, x 240, feet 122) is decor but has a padlock and locking bar, which in this game says "lock to open", and it is drawn three-quarter view against the east wall | `room_edit.py room_se_blueteam sprite 10 qdc_filing_steel1` (straight-on, three drawers, no lock; the same cabinet Ops uses), then `move 10 240 112` so it stands against the back wall's floor line, and move its blocker rectangle `Object Layer 1` #11 from 242,110 to 242,100. Re-render; check it stays clear of the rota board above and the DVR rack below (top 154) |
| 3 | Recon | minor | `info_screen1` (#28, x 186, feet 58) is dim in the dark but, once the lights strike, shows a bright blue date-and-numbers display right under the RECON plate (`tour/recon_room-b.png`). It reads as a live screen to check, and a tap gives nothing | Make it a flavour object rather than dead decor. In `scenario.json.erb`, `recon_room.objects` add `{ "type": "info_screen", "id": "recon_info_screen", "name": "Wall Display", "position": "as-type:info_screen", "takeable": false, "interactable": true, "observations": "Today's date and the team's engagement hours. Nothing about Ledgerwell here.", "addToNotes": false }` (wording to taste, unvoiced). Keep the zeroed `info_screen` emitter. Rerun `slot_audit.py --notes` (expect `info_screen1` claimed). If the fixer would rather not add an object, swap the art for a dark screen instead |

Trivial (fix if convenient, no recheck needed):

- **T1 Ops comms cabinet halo.** `comms_cabinet1` (#4) on the back wall takes the stock rack emitter (radius 40, intensity 0.45), so in the dark its green halo spreads across the plate and workbench (`tour/operations_room-a.png`). Add to `operations_room.lighting.emitters` (line ~1602): `"comms_cabinet": { "color": "#6dffb0", "radius": 16, "intensity": 0.3, "effect": "blink", "leds": 1 }`. Keeps the LEDs, loses the floodlight.
- **T2 Blue Team desk phone.** Decor `phone4` (#28, x 136–150) overlaps decor `pc8`'s tower (ends x 140) and butts against the triage PC (x 150). `move 28 66 176` puts it on the lower desk (#12) beside the binders, where the unclaimed conditional `notes3` is never drawn. Keeps the triage PC's surroundings clear for the tap.
- **T3 Blue Team DVR rack.** `aes_dvr1` (#24) is three-quarter view too. With finding 2 fixed it is the room's one angled wall item, which the rule allows. If the fixer wants it straight on, `pnw_switch_cabinet1` (33x59, dark, cables) fits; rename the `aes_dvr` emitter key to `pnw_switch_cabinet` and move blocker #25 to match.
- **T4 Ops balance.** Desks, copier and cabinet all sit in x 40–198; the right third is empty bar the coffee station, and the copier and filing cabinet stand free on the floor rather than against a wall. Nothing is wrong to play. If the POV rerun wants a fuller room, shift the copier (#25, blocker #26), cabinet (#27, blocker #28) and bin (#29) to the east wall below the extinguisher.
- **T5 Hub back-view chairs** (C3 T3, carried). The two `exec_chair_back1` (#11, #12) render as almost solid black shapes at the front of the table. No back view of the leather chair exists in `assets/objects/`; leave, or move them to x 78/152, feet 300 so less of the black seat crosses the rug's lower border.
- **T6 Recon right half.** The right half of Recon is open carpet with the rack and plant. It doesn't hurt the room's story (one researcher, one PC), so leave it unless the POV background needs more to frame.

Not raised:

- Preview render quirk: `render_room_preview.py` draws Ops' `qdc_filing_steel1` 60px tall because the map's tile entry says 29x60 while the PNG is 29x47. In game it draws at 47px (`tour/operations_room-b.png`). No map change.
- `generate_rooms.py --check` hints listed under Evidence.
- Chair conventions (C3 T2) and the Blue Team floor name (C3 T5): unchanged and harmless.

## Order for the fixer

1. Map edits with `room_edit.py` (finding 2; T2, T3, T4 if taken), one `Room(...).save()` per map. Then `slot_audit.py --notes`, `generate_rooms.py --check room_se_blueteam room_se_ops room_se_recon`, `check_room_walls.py --scenario`.
2. Scenario edits (findings 1 and 3; T1). Re-read `scenario.json.erb` first, because other agents edit it. Then `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --no-graph --skip-ink --strict-social`.
3. Lighting tour again (`--close-intro --check --restore-off`). Check: Blue Team's back wall has only the SOC board's glow; Ops' cabinet glow is small; Recon's display still dim in the dark.
4. The live tap check this cycle couldn't run: `moveToNear triage_workstation` then `interact` opens the inbox triage directly; `moveToNear` the Recon wall display then `interact` shows its observation; the OSINT tap is still direct.
5. **POV backgrounds are still out of date** (C3 note 5). Once this cycle's fixes land, the rooms stage looks ready to close and hand to `room-pov-background`.

## Assumptions

- Assumption: the lab-wide rule "only interactive screens glow" (C2) still stands, so the CCTV feeds get a zeroed emitter even though CCTV in a SOC would really be lit.
- Assumption: I graded the Recon display as minor because it looks live only after the strike; turning it into a flavour object (rather than darkening the art) keeps the room's look and gives the tap a reply.
- Assumption: the in-game filing cabinet draws at the PNG's natural 47px (measured about 45px in the tour shot), so the 60px tile size in the Ops map is a preview artefact only.
