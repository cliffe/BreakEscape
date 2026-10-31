# Lab rooms review, cycle 5 (final): dressing, lighting, taps (`lab_social_engineering`)

Written 2026-10-23. This is a review only. This file is the only repo file written. Nothing was committed and no images were generated. The game is a lab: education first, browser-only, one working day at Tarnside Assurance with its client Ledgerwell. Skills used: the review parts of `mission-room-dressing` and `mission-room-lighting`, plus the scoping part of `room-pov-background`. Cycle 4 is `ROOMS_REVIEW_C4.md`, and its fixes landed in 950b10f1d.

**Result: 0 blockers, 0 majors, 1 minor, 4 trivials.** Every C4 finding is closed. All 14 interactives (3 NPCs, 11 objects) open on the first tap at the centre of the sprite in a fresh game. One more problem showed up only in live play. In Operations, the swivel chairs along the upper desk row sit under the Mail Workstation's keyboard, and a normal walk to the desk phone pushes them together. A tap on the bottom of the mail PC then brings up a "Mail Workstation / chair" menu instead of the mail client.

**Verdict: the rooms stage can close.** This cycle found nothing above minor, which is the stop rule for design stages. The minor is one small map edit, and checking it needs a targeted tap test, not another review cycle. The POV stage can start after that. See the list at the end.

## Evidence

Scratchpad: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-rooms-c5/`

- Map renders, 32px grid (`render_room_preview.py --grid --scale 2`): `prev/room_se_engagement.png`, `prev/room_se_recon.png`, `prev/room_se_ops.png`, `prev/room_se_blueteam.png`.
- The maps as they were when the POV backgrounds were made (f2c562ab6), rendered for comparison: `oldprev/room_se_engagement.png`, `oldprev/room_se_blueteam.png`.
- Lighting tour, game 3917 on keyless :3001, all rooms unlocked server-side (`lighting-tour.sh … --close-intro --check --restore-off`): `tour/engagement_office-a.png`, `tour/recon_room-a.png` (dark), `tour/recon_room-b.png` (lit), `tour/operations_room-a.png` (dark), `tour/operations_room-b.png` (lit), `tour/blue_team_room-a.png`. The `--check` output matches C4: Recon and Operations on `motion` (off), hub and Blue Team `on`, Blue Team ambient `#b2b8c8`, light map redrawing every 300ms.
- Close-ups from the tour: `zoom_ops_east.png`, `zoom_recon_corner.png`, `zoom_blue_east.png`.
- Live walk-and-tap, my own fresh game 3920 on :3001, all four rooms unlocked server-side, Node 24. Every interactive was approached with `moveToNear`. Objects were then tapped with a raw `clickAt` on the sprite's visual centre, the way a player taps, and NPCs with `interact`. Points near the edges were tapped wherever another interactable was close. Screenshots are in `tap/`: `ruth.png`, `fairbairn.png`, `tomasz.png` (the conversation backgrounds in use), `report_workstation.png`, `recon_info_screen.png`, `recon_entry.png`, `recon_live.png`, `ops_entry.png`, `ops_chairs_pushed.png`, `blue_entry.png`, and one per object. The session was stopped afterwards. The page logged 13 console errors, all "Failed to load resource: 400". I didn't trace them, and none blocked a tap.
- Static checks: `slot_audit.py --notes` found 0 problems and 0 notes prompts. `check_room_walls.py --scenario` read 64 for all four rooms. `generate_rooms.py --check` on the four maps came back OK, with only the usual generic hints (wall items where a north door could be drawn, bottom-row feet in rooms with nothing to the south, the Ops extinguisher on the east wall strip, Recon "only one floor plant"). `validate_scenario.rb --no-graph --skip-ink --strict-social` reported no errors. Its three warnings are Ruth's `onceOnly` eventMappings, which are dialogue wiring and outside this stage.

## Live tap results

| Room | Interactive | First tap (centre) | Edge taps |
|------|-------------|--------------------|-----------|
| Hub | Rules of Engagement (`notes1` on the table) | Intel board opens | 2 edge points: direct |
| Hub | Planning Whiteboard | Intel board opens | 3 edge points: direct (the harness `interact`, which clicks the top-left, raised a menu; a player's tap does not) |
| Hub | Case File (staff board) | Intel board opens | 3 edge points: direct |
| Hub | Report Workstation | Toast "Nothing to write up yet…" (gated, as designed) | 3 points, including next to its chair: toast, no menu |
| Hub | Ruth, Fairbairn | Person-chat opens, room background behind | – |
| Recon | OSINT Workstation | OSINT browser opens | 3 points next to the desk chair: direct |
| Recon | Wall Display (C4 #3) | Examine modal with the new line | – |
| Ops | Mail Workstation | Mail client opens | **Bottom strip (y 155–158): menu with "chair"** (finding 1) |
| Ops | Page Builder | Builder opens | 5 points including the keyboard row: direct |
| Ops | Desk Phone | Pretext prep opens | 3 points: direct |
| Blue Team | Triage Workstation | Inbox triage opens | 3 points: direct (C3/C4 recheck closed) |
| Blue Team | SOC Board | Intel board opens | 2 points: direct |
| Blue Team | Tomasz | Person-chat opens | – |

Motion lights struck on entry in both dark rooms (`recon_live.png`). Ruth, Fairbairn and Tomasz stayed on their spots throughout. With them now immovable, no push can cover a tap target.

## C4 findings, closed or not

| C4 # | Outcome |
|------|---------|
| 1 Blue Team CCTV glow | Closed. The feeds are dark, and the SOC board's green glow is the only light on the back wall (`tour/blue_team_room-a.png`) |
| 2 Padlocked angled cabinet | Closed. `qdc_filing_steel1` is straight on, has no lock, and sits in the top-right corner under the rota board, in line with the desk's depth |
| 3 Recon wall display | Closed. It is now a flavour object and gives its line on the first tap. It stays dim in the dark |
| T1 Ops comms cabinet halo | Closed. One small blinking LED |
| T2 Blue Team phone | Closed. `phone4` is on the lower desk with the binders, and the triage PC stands clear |
| T3 DVR rack angled | Left as it is, as allowed: it is the room's one angled item |
| T4 Ops balance | Closed. The copier, cabinet and bin are against the east wall, and the right third now has something in it |
| T5 Hub back-view chairs | Unchanged, carried below as T1 |
| T6 Recon right half | Closed by the reading corner (sofa, glass coffee table with takeaway coffees). The rack stays against the east wall |
| Recheck: triage tap | Closed, verified live (table above) |

## Room by room

**Engagement Office (hub).** It is unchanged and still the strongest room. On the back wall are the logo, the ENGAGEMENT plate over the interactive plan whiteboard, the Ledgerwell staff board and the window. The boardroom table sits on its teal-bordered rug, with the report desk, flip chart and fig. The report PC is the one bright screen. Ruth and Fairbairn stand on clear carpet in the upper half, away from every interactable, and all four objects open on the first tap. The two back-view chairs at the front of the table still read as black shapes (T1).

**Recon Room.** It now reads as a research office with somewhere to sit and read. At the working desk are the bright OSINT PC and the lamp. Next comes a second desk with binders, then the bookcase, whiteboard, notice board, the RECON plate over the wall display, and the window. The sofa and coffee table fill the open middle, the rack stands against the east wall, and the shredder sits by the bin. In the dark, the OSINT PC is the first thing you see, the rack's LEDs second and the display a dim third, which is the right order. The OSINT desk chair is pushable, and a walk to the door can shove it across the room until it rests against the back wall over the notice board (T2).

**Operations Room.** The room tells a clear story: the mail workstation (the envelope on screen is a good touch), the phone desk with the interactive desk phone, the page-builder desk, the kit workbench under the plate, and the year planner. The coffee station is in the back-right corner, and the filing cabinet, copier and bin stand against the east wall below the alarm point and extinguisher. In the dark, the two interactive PCs are the bright screens, and the comms cabinet is now a single LED. The one problem is the upper desk row's four swivel chairs (finding 1).

**Blue Team Room.** The SOC story comes through well: the threat map, eight dark CCTV feeds, the BLUE TEAM plate over the glowing SOC board, the rota board, the straight-on cabinet, the DVR rack, the tea point, and Tomasz on clear floor in the middle. The triage PC is the only bright screen. Nothing decor reads as interactive any more.

## Lighting

- The moods are right and unchanged: a day-office hub, Recon and Operations dark until you walk in, and a slightly cooler Blue Team.
- The rule "only interactive screens glow" now holds in all four rooms. The only other glows are the LEDs on the racks (Recon `servers4`, Blue Team `aes_dvr1`), the hub power panel and the Ops comms cabinet, all small and kept on purpose since C3.
- The teal wall line runs along the foot of the back wall in all four rooms, dark and lit, and matches the hub rug's border.

## Findings

| # | Room | Severity | Finding | Change |
|---|------|----------|---------|--------|
| 1 | Operations | minor | Swivel chairs overlap the Mail Workstation's tap area. Chairs `chair-darkgray-1` #11 and #12 (`room_se_ops`, feet y 190) draw with their tops at world y 151. The mail terminal's bounds run down to y 158, so a tap on its keyboard row gathers a chair. At the map positions, a tap at world (391,155) gave "Mail Workstation / chair / chair". The upper row's four chairs (#11, #12, #17, #18) also stand in the line the player walks to reach the mail PC and the desk phone. After ordinary play they were pushed into a bunch under the mail desk (`tap/ops_chairs_pushed.png`), and taps at (372,156) and (385,157) gave "Mail Workstation / chair". A centre tap still opens the mail client directly | `public/break_escape/assets/rooms/room_se_ops.json` and `.tmj`, with one `Room(...).save()`: `delete 12`, `delete 18` (one chair per desk on the upper row, which also clears the walking line), `move 11 54 198` and `move 17 134 198`, so the chair tops (about y 159 in game) clear the mail terminal and `pc12`. Re-render, then tap the mail terminal at world (372,156), (385,157) and (391,155) in a fresh game and walk to the desk phone and back. Expect the mail client each time. **Engine option, for the user to approve** (it touches every mission): in the tap router, drop swivel chairs (`noInteractionHighlight`) from the pick-one menu whenever another interactable is gathered (`public/break_escape/js/core/rooms.js` marks them at about line 2736; the menu is built by the main scene's pointerdown handler) |

Trivial (fix if convenient, no recheck needed):

- **T1 Hub back-view chairs** (carried from C3 T3 and C4 T5). The two `exec_chair_back1` (#11, #12) at the front of the table render as almost solid black shapes. No back view of the leather chair exists. Leave them, or move them to x 78/152, feet 300 so less of the seat crosses the rug's lower border.
- **T2 Recon OSINT chair drifts.** The pushable `chair-grey-1` #10 (x 88, feet 156) gets shoved across the room by ordinary walking, and in this run it ended up against the back wall, drawn over the notice board (`tap/blue_entry.png`, top left). It didn't cover a tap target (OSINT taps stayed direct). This is the same engine behaviour as finding 1. If the engine option there is taken, nothing else is needed. Otherwise leave it.
- **T3 Wall Display wording.** The new line says Tarnside keeps client names "off anything a visitor could read", but the hub's back wall shows the Ledgerwell staff board with photos. Both rooms are staff-only, so this is a nit. If wanted, change `recon_room` → `recon_info_screen.observations` in `scenario.json.erb` to "Today's date and the team's booked hours. Client work stays on the boards in the Engagement Office." (unvoiced).
- **T4 Decor desk phones.** `phone4` on the hub table and in Blue Team is decor and gives nothing on a tap, while the Ops `phone3` is the phone you use. Leave them. Making the hub one a flavour object would put its top-left about 30px from the Rules of Engagement sheet's centre and turn that tap into a menu.

Not raised:

- The decor boards (Recon whiteboard and notice board, Ops whiteboard and year planner, Blue Team threat map and rota board) don't respond to a tap. That is the game's convention for decor, and making the Recon notice board a flavour object would put it within 32px of the Wall Display and cause a menu.
- The Wall Display shows its line twice, in the modal and in the caption bar under it. That is how the engine's examine view works, not this room.
- Opened side and north doorways draw as black gaps on both sides (`tap/recon_entry.png`, `tap/blue_entry.png`). That is engine-wide.
- The `generate_rooms.py --check` hints listed under Evidence. The preview draws the Ops cabinet 60px tall where the game draws 47 (C4 note).

## POV conversation backgrounds

`chatBackground` is set for two rooms. The images in `public/break_escape/assets/backgrounds/rooms/` date from 2026-10-22 08:22–08:28, made from the maps at f2c562ab6, before cycles 2–4. No ink pins a `Background[...]`, and no conversation sets its own `background`.

| Room | Files | State | What it should show |
|------|-------|-------|---------------------|
| Engagement Office (Ruth on the left half, Fairbairn on the right) | `lab_se_engagement_office_left_blended.png`, `lab_se_engagement_office_blended.png` (sources `…_nonpixelart.png`, `….png`) | **Current.** The only map changes since then are the report PC sprite (still a monitor on the desk in the picture) and the floor tileset rename that brought the teal line, which the picture already has. In live play, Ruth's crop shows the north door and logo, and Fairbairn's shows the ENGAGEMENT whiteboard, staff board, window and power panel (`tap/ruth.png`, `tap/fairbairn.png`). The one drift is that the table chairs are drawn as grey mesh chairs, not the black leather ones. Not worth a redo | No change |
| Blue Team (Tomasz) | `lab_se_blue_team_blended.png` (sources `lab_se_blue_team_nonpixelart.png`, `lab_se_blue_team.png`) | **Slightly out of date.** The layout matches today's room well: the threat map, eight CCTV feeds, the BLUE TEAM plate over the SOC board, the rota board, the back desk with two PCs, a plain cabinet, the rack, the tea point with fridge, and the lower desk with binders (`tap/tomasz.png`). Two things differ. The skirting has no teal line, which the room has had since 364e4e2a9. The cabinet is drawn as a tall four-drawer unit right beside the desk, while the room has a three-drawer cabinet in the top-right corner under the rota board | One Gemini edit of `lab_se_blue_team_nonpixelart.png`: a thin teal line along the foot of the back wall, and the cabinet shortened to three drawers and moved right, under the rota board. Then one PixelLab conversion and a re-blend. About 1–2 Gemini calls plus 1 generation |
| Recon Room | none | **Missing.** No person-chat happens here today, but the POV skill asks for a background for every room | Camera at the south wall looking north, lit (ambient `#c4cad8`), navy carpet tiles, teal line at the skirting. Back wall, left to right: a grey bookcase of binders and archive boxes standing in the left corner, a whiteboard with a bar chart, a cork notice board with pinned notes, the RECON plate above a blue wall display showing the date "23", and a window with blinds. A red fire alarm point on the left wall. On the floor: the OSINT desk on the left with a bright monitor, desk lamp, small framed photo and a chair behind it, and a second desk nearer with blue binders. Centre right: a black three-seat leather sofa with two grey cushions facing the camera, and a low glass coffee table with takeaway coffees in front of it. A blue server rack with green LEDs against the right wall. A blue bin and a black shredder in the near middle, and a tall plant in a terracotta pot near right |
| Operations Room | none | **Missing.** Dev, the only NPC, talks by phone, so this is the lowest priority | Camera at the south wall looking north, lit, navy carpet, teal skirting line. Back wall, left to right: a whiteboard with a chart, the OPERATIONS plate over a metal kit workbench (a small monitor and tools on top, boxes underneath), a wall-mounted comms cabinet with one green LED, and a colour-coded year planner. A small table with a coffee machine in the back-right corner. A wall dispenser on the left wall. A red alarm point above a red extinguisher on the right wall, with a grey three-drawer filing cabinet and a photocopier standing against that wall below them, plus a metal bin. On the floor: an upper row of two grey desks end to end (the left with a monitor showing a mail envelope, a small plant and a cup; the right with a dark monitor, a framed photo and a desk phone), black swivel chairs in front, then a nearer desk with a bright monitor, a laptop and a small plant. Take the chair count from the map after finding 1 is fixed |

Order: fix finding 1 first, because the Ops background copies the chairs. Then do the Blue Team edit, Recon and Operations, each Gemini call one at a time, with the user's sign-off before any PixelLab conversion.

## Assumptions

- Assumption: a player's tap lands near the sprite's middle, so I graded the mail-PC menu as minor. It needs a tap on the keyboard strip or chairs that have been pushed, and the menu still offers the right entry.
- Assumption: phone conversations (Dev in Operations) don't draw the room's `chatBackground`, so Recon and Operations are listed as missing rather than urgent. I took this from the POV skill and did not test it.
- Assumption: the 13 console "400 Bad Request" errors in my session are not room-related (most likely keyless-server requests). I didn't trace them.
- Assumption: I recommended deleting two of the four upper-row chairs rather than only nudging them down, because nudged chairs still get pushed back under the mail PC in play.
