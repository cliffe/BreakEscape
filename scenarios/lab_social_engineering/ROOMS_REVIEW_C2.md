# Lab rooms review, cycle 2: dressing and lighting (`lab_social_engineering`)

Written 2026-10-22. Review only: this is the only repo file written, nothing committed, no images generated. Kind of game: a lab (education first, browser-only, one working day at Tarnside Assurance, a small consultancy, with its client Ledgerwell). Skills used: the review parts of `mission-room-dressing` (survey, critique) and `mission-room-lighting` (lookup, render, review). Cycle 1 is `ROOMS_REVIEW_C1.md`; its group (a) and the POV backgrounds were built (`SE_BUILD_LOG.md`, "Lab rooms").

**Result: 0 blockers, 0 majors, 9 minors.** The rooms now read as a small consultancy. Each has its own map, a named plate, a theme that fits the stage, and lighting that suits it. What remains is findability polish (one decoy screen per room in two rooms, a hard-to-reach wall board), cohesion (wall colours) and small lighting tweaks.

## Evidence

Scratchpad: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-rooms-c2/`

- Map renders with a 32px grid (`render_room_preview.py --grid --scale 2`): `prev/room_se_engagement.png`, `prev/room_se_recon.png`, `prev/room_se_ops.png`, `prev/room_se_blueteam.png`.
- Lighting tour, game 3598 on keyless :3001, all rooms unlocked server-side (`lighting-tour.sh lab_social_engineering … --close-intro --check --restore-off`): `tour/engagement_office-a.png`, `tour/recon_room-a.png` (dark) and `-b.png` (lit), `tour/operations_room-a.png` and `-b.png`, `tour/blue_team_room-a.png`. `--check`: Recon and Operations `motion` (off on arrival), hub and Blue Team `on`; light map redrawing in every room.
- Static checks: `slot_audit.py --verbose --notes`: 0 problems, 0 notes prompts; every lab object claims a real fixture. `check_room_walls.py --scenario`: all four maps floor at 64. `generate_rooms.py --check` on the four maps: OK. The remaining warnings are generic hints (N-door corners on walls with no door there, bottom rows of the hub, which has no room to its south) except the Ops `fire_extinguisher1` side-wall hint, which is correct placement on the east wall strip.
- `lighting_lookup.rb`: no other scenario lights these four types.
- Earlier notes: `playtests/R7.md` F3 (decoy desk), F4 (SOC board), F5 (chairs), F6 (Recon dark on entry).

## Room by room

**Engagement Office (hub).** It reads well: TARNSIDE ASSURANCE logo and ENGAGEMENT plate on the back wall, the plan whiteboard and the Ledgerwell staff board beside them, a boardroom table on a rug with three chairs behind and two in front, a side desk for the report PC, and a flip chart. Ruth and Fairbairn stand on clear carpet in the upper half; neither 80x80 tap frame touches an interactable. The upper half is empty floor, but that is where people stand and talk, so it suits a meeting room. Props are square to the walls. The only angled sprites are the plant and the flip chart. Two small issues: the report PC (`pc8`) has a dark grey screen and looks switched off, while a decor `exec_laptop1` on the table glows from a room emitter (finding 5). The RoE sheet is a 16px paper at the table's left end. It is findable once Ruth points to it, and its tap is clear of the table phone (36px), so I have left it.

**Recon Room.** A believable research room for a consultancy: binder shelves, an org-chart whiteboard, pinned printouts, a wall screen with the date, a RECON plate, a desk lamp. Two things count against it. The lower desk's `pc6` is the brightest screen in the room and does nothing, while the real OSINT workstation (`pc8`, upper desk) has a dull grey screen. In the dark shot this is stark: the decoy glows cyan and the real PC sits in the lamp's wash (finding 1, C1 m10). The rest of the floor carries leftovers from the m03 seed: the black `mini_fridge1` stands loose in the middle of the floor next to a small table with a wilted plant, and the bottom-right kilim is a floor decal painted for Danny's camp bed, now under nothing but a plant (finding 7). The server rack against the east wall is plausible for a consultancy that keeps a lab box.

**Operations Room.** A working floor: three desks with PCs and chairs, the mail terminal (envelope screen, reads well), the desk phone on the second desk, the page builder on the lower desk, a photocopier and steel cabinet along the west side, a coffee station, a project planner and a comms cabinet. It fits "where the attempts are run". The photocopier is the one three-quarter sprite (allowed). R7 F5's chair pile-up is the swivel chairs being pushed, not the layout. Two issues. The decor `pc11` beside the phone has a bright blue screen and, in the dark, lights up just like the page builder; with `laptop1` that makes four lit screens for two interactive ones (finding 3). The `cable_tangle1` on the floor in front of the bench reads as mess in a room a client could walk into (finding 8). The floor's lighter strip down the right third is the `room_qdc_open` aisle; it lines up with nothing here (folded into finding 6).

**Blue Team Room.** The strongest room, and R7 says so too: threat map, eight CCTV feeds, BLUE TEAM plate over the SIEM board, rota board, a long monitoring desk, a locked cabinet, a DVR rack and a kettle tray. Tomasz stands two-thirds across on clear floor; his frame is clear of the triage monitor. One real problem: the SOC board (`siem_dashboard`, top-left 198,27) sits above `desk2` (x 182–226, top y 79). The only floor within reach is the 15px strip between the wall line and the desk, so the player is pathed onto the wall face (R7 F4, and `moveToNear tomasz` failed from there once) (finding 4). Tomasz's hi-vis placeholder still reads as a site guard (character pipeline, not this stage).

## Lighting

- **Mood fits.** Scenario `"lighting": { "enabled": true, "defaultMode": "on" }`, the engine's day-office ambient, matches the Monday 08:00 clock. The hub is plain daylight. Recon and Operations are dark through the door, and their screens read first. Blue Team is a shade cooler (`#b2b8c8`) with green and blue screen light. No flicker and no `offAfter`, which is right: the student stays a long time in every room.
- **Dark rooms are navigable.** In the dark shots the doors, plates and every interactable's screen show. Nothing the student needs is lost. R7 F6 (Recon near black for a second) is the motion strike working as designed.
- **No bleed.** The lit hub next to the dark Recon and Operations rooms does not spill through the side walls beyond the door frames.
- **Recon's desk lamp is too strong** (finding 9): the stock `lamp` emitter (radius 80, intensity 0.9) throws a white fan up the west wall and over the fire alarm, lit or dark.
- **Hub emitter on a decor prop** (finding 5): `exec_laptop` glows on a laptop nobody uses, drawing the eye from the report PC.

## Open questions, settled

1. **Brand-line wall colours.** All four rooms are on Tarnside's floor: every room plate is drawn in Tarnside's navy-and-teal, and Tomasz is a visitor like Fairbairn. So the wall treatment should match. Hub and Recon already share the zds walls (cool white, graphite skirting, cyan line `(38,168,190)`, close to the plates' teal rim). Operations has QDC's lilac walls and violet line; Blue Team has AES's cream walls and green line. Decision: **one teal line in all four**, done as a lab tileset (finding 6). It is minor: the rooms read correctly without it, and the change is free (PIL) but touches four map tilesets and `game.js`.
2. **Engagement Office table running front to back.** Keep the map as it is (table left to right, three chairs behind, two in front). No front-to-back conference table sprite exists in `catalog.json` (the only portrait-shaped table is `smalldesk2`, 32x41), a 126px side-on table suits a 10-tile room seen top-down, and the chairs face it correctly. The mismatch is in the POV background, so fix it there when the POV stage reruns after this cycle: one Gemini edit of `lab_se_engagement_office_nonpixelart.png` turning the table side-on with three chairs on the far side and the west door added, then re-pixelate and re-blend both views (finding 2). Until then it stays an accepted flaw, as the build log says.
3. **C1 m10, the Recon decoy desk.** Fix it in this stage (finding 1), together with a lab-wide rule that **interactive PCs have a bright screen and decor PCs a dark one**: the same `pc6` art the page builder already uses for "click me", and dull `pc8` for background kit. Findings 1, 3 and 5 apply the rule in each room.

## Findings

| # | Room | Severity | Finding | Change |
|---|------|----------|---------|--------|
| 1 | Recon | minor | Decoy desk (C1 m10, R7 F3): the lower desk's bright `pc6` (#31) does nothing; the real OSINT PC (`pc8`, #22) looks switched off | `python3 scripts/room_gen/room_edit.py room_se_recon sprite 22 pc6` (keeps x 41, feet y 153; the OSINT object still claims it, being first in `table_items`); `room_edit.py room_se_recon delete 31`; `room_edit.py room_se_recon add table_items binders1 50 223` so the lower desk reads as a reading desk beside the coffee cups. Recheck `slot_audit.py` (osint → `pc6`) and the tap clearance from chair #10 (top-left 88,118, about 48px) |
| 2 | Engagement | minor | POV background shows the table front to back and lacks the west door | No map change. In the POV rerun: Gemini edit of the hub concept (table side-on, three chairs on the far side, west door), `pixelate_background.py` at the strengths that were kept (600; left view seed 7), `blend_backgrounds.py --only`, then re-patch the sign lettering as before |
| 3 | Operations | minor | Decor `pc11` (#14) beside the desk phone glows like an interactable, so the dark room shows four lit screens for two working PCs | `room_edit.py room_se_ops sprite 14 pc8`, then `room_edit.py room_se_ops move 14 124 155` (pc8 is 3px wider; this keeps it clear of `picture13` at x 158). Claim order is unchanged: mail takes #8, page builder #20. Leave `laptop1` (#21): its top-left is 40px from the page builder's, so no menu |
| 4 | Blue Team | minor | SOC board unreachable except from a 15px strip between wall and `desk2`; player clips onto the wall face (R7 F4) | Open floor under the board: `room_edit.py room_se_blueteam delete 8` (desk2), `room_edit.py room_se_blueteam move 29 158 95` (triage `security_monitor1` to the right end of desk1, top-left 158,66, about 52px from the decor `pc8`), `room_edit.py room_se_blueteam delete 27` (the hidden conditional `notes1` that would sit under it). The wall art is unchanged, so the POV background still matches apart from a shorter desk low in frame. Re-tap the SOC board and run `moveToNear tomasz` from it in a playtest |
| 5 | Engagement | minor | Report PC (`pc8`, #26) looks off; a decor `exec_laptop1` on the table has a room emitter glow | `room_edit.py room_se_engagement sprite 26 pc6` (x 214, feet y 204 kept; the chair at x 258 stays clear). In `scenario.json.erb` `engagement_office.lighting.emitters`, delete the `"exec_laptop": {…}` entry; the stock `pc` emitter then lights the report PC |
| 6 | Ops, Blue Team | minor | Wall treatments differ: lilac walls with a violet line (Ops), cream walls with a green line (Blue Team), against the hub and Recon's white walls with a cyan line. Ops also has a lighter carpet aisle that lines up with nothing | New `scripts/room_gen/make_se_tileset.py`, modelled on `make_zds_tileset.py`: zds walls (`brand=(38,168,190)`, graphite skirting) on every sheet, floors `room_se_ops` = zds carpet (no aisle) and `room_se_blueteam` = the AES charcoal carpet repainted under zds walls. Register with `this.load.image` in `game.js`. Point each map's room6-layout tileset image at its sheet. `room_edit.py floor` only accepts `room6` or `room_hospital*` names (`room_edit.py:333`), so widen that regex to `room6|room_(hospital|zds|qdc|aes|se)(_[a-z]+)*` first, or edit the two maps' tileset `image` and `name` directly. Then run `check_room_walls.py --scenario` (must read 64) |
| 7 | Recon | minor | Seed leftovers: `mini_fridge1` (#11) stands loose mid-floor; the bottom-right kilim is a decal painted for Danny's camp bed and now sits under nothing | `room_edit.py room_se_recon delete 11` (a consultancy research room has no need of a fridge; the hub and Ops have drinks). For the kilim: in finding 6's script, give Recon a plain zds carpet sheet (`room_zds_carpet` has no kilim) and point the map at it; if finding 6 waits, leave the rug, which passes for a rug |
| 8 | Operations | minor | `cable_tangle1` (#6) on the floor in front of the bench reads as mess | `room_edit.py room_se_ops delete 6` |
| 9 | Recon | minor (lighting) | Desk lamp throws a large white fan up the west wall and over the fire alarm | In `scenario.json.erb` `recon_room.lighting.emitters` add `"office-misc-lamp": { "color": "#ffd9a0", "radius": 44, "intensity": 0.55, "effect": null }` (stock: radius 80, intensity 0.9). Re-render Recon dark and lit |

Not raised, with reasons:

- R7 F5 (Ops chairs pile up): swivel chairs pushed by the player. The placed layout is two chairs per desk, which is normal.
- The RoE sheet's size (16px paper): Ruth's opening sends the student to it, and its tap is clear. If a blind playtest shows students missing it, swap `notes1` for a clipboard sprite at the table's front edge.
- The Ops photocopier is the room's one angled prop (allowed). The hub's plant and flip chart are free-standing and fine.
- `generate_rooms.py --check` warnings: generic hints for door positions these maps don't use, and the hub's bottom rows (no room to its south, so they are visible).
- Tomasz's hi-vis placeholder: character pipeline.

## Order for the fixer

1. Findings 1, 3, 4, 5, 7 (deletions and moves), 8: map edits with `room_edit.py`, one `Room(...).save()` per map. Then `slot_audit.py --notes` (0 problems, and osint → `pc6`, report → `pc6`), `generate_rooms.py --check` on the four maps, and `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --no-graph --skip-ink --strict-social`.
2. Findings 5 and 9: the two emitter changes in `scenario.json.erb`. Re-read the file first, because other agents are editing it.
3. Finding 6 (and 7's kilim): the tileset script, if the orchestrator agrees to the `game.js` and `room_edit.py` touches.
4. Lighting tour again (`--close-intro --check --restore-off`), then a short Sonnet playtest: tap each of the 13 targets at its centre and walk Blue Team's SOC board approach.
5. Finding 2 goes to the POV rerun, which comes after this stage.

## Assumptions

- All four rooms are Tarnside's premises (going by the plate style), so they should share one wall treatment.
- "Bright screen means interactive" is a convention worth making lab-wide. Playtest R7 shows students already read it that way.
- Severity follows R7 and DESIGN_REVIEW_C1 (decoy desk and SOC board were minor there); nothing here stops a student finishing.
