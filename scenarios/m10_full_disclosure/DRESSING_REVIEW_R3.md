# m10 room dressing: review, round 3

## Verdict

**One more round before lighting.** No blockers. Three majors: the gallery's lock guard walks through the standing cluster every lap (G1), the hidden reinforcements' health bars draw over the LEVEL 2 sign and give the ambush away (G2, an engine fault), and the forward post's blast door doesn't read as a bunker entrance (F1). G1 and F1 are small layout jobs; G2 is a one-line engine fix that can run alongside. The minors are mostly short moves and text or sprite swaps.

Every room reads as its place at a glance, props sit square to the walls, no door mouth is blocked, and every object can be reached. Against m09's finished rooms the gap is in finish: empty marked-out boxes on three floors, a few stray-looking props, and the core and the lower half of the security office being barer than they need to be.

Counts: 0 blocker, 3 major, 20 minor.

Reviewer: fresh, read-only. Nothing edited apart from this file; nothing committed.

## What I looked at

- Standards: `.claude/skills/mission-room-dressing/SKILL.md`, `docs/agents/FINALE_BRIEF.md`, `ROOM_DRESSING.md` rounds 1–2, stage 5 `room_layout.md`, the square-to-the-walls rule, and m09's `ROOM_DRESSING.md` and `DRESSING_REVIEW_R4.md` as the bar.
- Map renders: `dressing_r2/maps/` (contact sheet) and the round-2 in-game shots `dressing_r2/ingame/`.
- My own browser session: game 3171, keyless :3001, fresh game, every room unlocked server-side. Shots and helpers are in the session scratchpad, `m10_dress_r3/`. These include `<room>_allnpc.png` with every story copy of every NPC made visible at once, to check NPC spots against furniture. The copies are mutually exclusive in play, so overlaps between copies don't matter; overlaps with furniture do.
- The round-1 and round-2 walk helpers' results, as passed on by the coordinator (`m10dress/pt1/`, `m10dress/pt2/`, games 3166, 3170 and 3178).

Positions are room pixels (x left edge, y feet) unless marked as tiles. NPC tiles are the scenario `position`. In game an NPC's feet land about 16 px above `y × 32`.

## Browser walk (round 2's, finished)

| Check | Result | Evidence |
|---|---|---|
| forward_post ↔ blast_tunnel | **pass**, both ways, twice | game 3171 |
| Other 12 crossings | pass (round 2 walk) | `m10dress/pt2/doors.txt`, coordinator |
| Reach: forward post (12 incl. mug) | all reached. Two notes: `van_two` can only be reached from the south, through a menu shared with Nightshade (`moveToNear` stops 48 px short from the north); the table mug shares a menu with Helena's plans | `m10_dress_r3/res_forward_post.json` |
| Reach: tunnel | panel, rota and ladder open directly; the desk mug shares a menu with the rota | `res_blast_tunnel.json` |
| Reach: security office | all 9 open directly: alarm board, shift notes, duty board, door log (on the desk), handset, records cupboard (PIN pad), fitter's locker (lockpick), duty screen. The door log opens through a menu with the duty board when approached from its west end | `res_security_office.json` |
| Reach: workshop | all 6. The casualty sheet and its margin strip share a menu (a pair, accepted) | `res_workshop_floor.json` |
| Reach: power room | load board, bypass panel and tool roll open. The shutter isolator opens, but as a toast into notes (P2) | `res_power_room.json` |
| Reach: hall, gallery, core | all, round 2 walk (plotting board 22 px, hatch 21 px, keypad plate 22 px, service door 24 px) | `m10dress/pt2/res_*.json` |
| Patrols | tunnel_guard, duty_guard and workshop_guard each reach both ends of their route in game 3171. All six cycle in round 2's walk, but see G1 for lock_guard | `m10_dress_r3/patrol_*.json` |
| Console | game 3171: 36 × 503 (TTS, keyless server), 3 × 403 (URL not logged; not dressing), 0 "No Tiled item found". Round 1 walk: two page errors in HaX's phone chat, `reading 'style'` and `reading 'storyJson'` (m09 saw the `style` one too). For an engine look, not dressing | drain at end of 3171 |
| Red bar over LEVEL 2 | **yes, and it is a fault**: see G2 | `gallery_allnpc.png`, `m10dress/pt2/gallery.png`, `dressing_r2/ingame/gallery-a.png` |

## Rooms, judged afresh

| Room | Reads as its place | Key objects easy to spot | Clutter / empty | Repetition | Square | Doors, taps, routes | Findings |
|---|---|---|---|---|---|---|---|
| forward_post | mostly: fence, rock, vans, table under a lamp, hut. The blast door itself is just a side door in the fence | table items, gate kit and hut clear | the SE middle is open floor (raid spots); the hatched apron is an empty box | brown table as the gate terminal's stand | vans side-on, cones, both fine | E door clear; van two's step crowded | F1–F5 |
| blast_tunnel | yes: caged bulbs, FALLOUT SHELTER, post desk, ladder, drain | yes | right for a corridor | none | yes | both doors clear; the player can get behind the desk | T1 |
| security_office | yes at the back wall; the lower half is bare | yes | back wall full, floor below y 150 nearly empty | brown table for the handset | yes; the wheelie bin is the angled piece | W and S lanes clear; guard B wedged on the cabinet | S1–S3 |
| workshop_floor | yes: pegboard, tool chest, drawers, benches, cable drum, cracker bay | yes | balanced; middle is the guard's beat | cream office `desk1` ×2 as benches | yes | N and E doors clear | W1, W2 |
| power_room | yes: Bakelite wall, dials, switchgear, battery bay | yes, but the isolator wears an emergency-stop sprite | balanced | none | yes | doors clear | P1–P5 |
| server_hall | yes: plotting board, console row, racks, sealed hatch | yes | the middle is open on purpose (two beats, Asante or Mercer, raid copies); two empty marked boxes | cream `desk1` console row (fine for a refit) | one office chair angled | both lanes clear | H1–H3 |
| gallery | yes: tread plate, slit windows, rail, keypad plate | yes | crowded by NPCs, not props | none | yes | lock guard's beat cuts through the cluster | G1, G2 |
| core | bare by design, but barer than it needs to be: no caged lamps, the only room without them | key console, readout, host terminal all clear | sparse | brown table for the host terminal | yes | doors and service door clear | C1 |

## Findings

| # | Sev | Room | Where | Finding | Fix |
|---|---|---|---|---|---|
| G1 | **major** | gallery | lock_guard patrol (7, 4) → (2, 4), dwell 20 s at the west end; standing at y 4.5: monitor_guard (3), farah_guard (5), nightshade_lock (6), quintero_lock and minder_lock (7); Vos and Victoria's copies at (5, 3) | The beat runs 16 px above the standing row, through Farah, Vos and the monitor guard every lap (world y ≈ 388, x 2308–2468). Round 1's walk logged about 34 "No path found to waypoint" warnings per 100 s from farah_guard and a bogus avoidance waypoint (4576, 576) inserted by lock_guard's bump. Round 2's shots show the player at the slit window half hidden by the row in front. | Pick one (story-owned NPC fields; the orchestrator's call). (a) Shorten the beat to the east half, behind the lock party: waypoints (8.4, 3.4) ↔ (6.2, 3.4). It then stays 32 px or more from Vos at (5, 3) and never reaches the monitor guard. (b) Leave the beat and open a gap in the row: monitor_guard to (1.8, 4.5), Farah and her chair one tile west, so x 3.5–4.5 is clear under the slit window for the player. Either way, check why Farah has a waypoint she can't reach: her feet (about y 128) sit on her chair's collision. Move the chair 8–10 px south or give her a static position with no waypoint. |
| G2 | **major** (engine) | gallery | reinforcement_a (3, 3), reinforcement_b (4, 3), both `initiallyHidden` hostiles | Their two red health bars draw over the LEVEL 2 plate while both NPCs are hidden. This shows in every gallery shot since round 1, and it tells the player an ambush is waiting. Cause: `systems/npc-health-bar.js` `updateHealthBar()` moves the bar and sets its depth each frame but never follows `npc.sprite.visible`. `ui/npc-health-bars.js` checks visibility only when the bar is created (line ~193). | Engine: in `updateHealthBar`, `barData.graphics.setVisible(npc.sprite.visible !== false)`, or create the bar only when the NPC is revealed. No map change. Check m01–m09 for the same leak (any hidden hostile). |
| F1 | **major** | forward_post | E door (x 608–640, rows y 64–128); hatched apron (about x 540–598, y 54–112) | The whole mission is about getting into this bunker, and its door is the same small grey side door as every interior room, set in the chain-link, with an empty hatched box in front. Nothing says "blast door into a hillside". | Hand-draw a concrete portal for the east strip around the door rows: a headwall face with a lintel, stencilled "TG-1" or "BLAST DOOR 1", and a heavy steel leaf drawn open beside the frame (keep the door mouth clear). Fill the apron with a rubber door-seal kerb or drain grate, so it stops reading as an empty box. KEEP CLEAR and FALLOUT SHELTER stay over it. |
| F2 | minor | forward_post | `m10_van_step2` slot (106, 234); nightshade_van (3.6, 7.9); malhotra_post (2, 8) | The step is reachable only from the south, through a menu shared with Nightshade; the pathfinder heads north and stops 48 px short. Malhotra and Nightshade crowd the open door. | Move the step slot to the van's rear bumper (about x 136, feet 238) and Nightshade to (3.0, 7.6), so his frame (x 56–136) no longer covers the step and the step faces open floor to the east. Or accept it as a flavour object and leave it. |
| F3 | minor | forward_post | van one: open door (lit interior x ≈ 77–97), `m10_van_step1` (116, 106) | The step sits 20 px east of the door, under the rear wheel, so it reads as dropped kit, not a door step. | Redraw the van's lit door 20 px east, or accept it (round 2 tried a mirror and dropped it). |
| F4 | minor | forward_post | generator (≈ 228–260, feet 90); nightshade_table (8, 4); phantom_post (7, 4) over the kit crates; kowalczyk_van (2, 4) over van one's bonnet; nightshade_blast (18, 6) on the barrier (`forward_post_allnpc.png`) | Round 2's generator went onto nightshade_table's spot, so that copy stands in the generator. Three other copies stand on crates, the van and the barrier. | Move the generator south of the table's west end (about x 120–150, feet 300, still "cable to the work lamp"). Nudge phantom_post to (7, 4.6), kowalczyk_van to (2.2, 4.6) and nightshade_blast to (18, 7), or move the props where the story fixes the NPC. |
| F5 | minor | forward_post | mug `office-misc-cup3` on the table (272, 197); same in the tunnel (844, 46) and security (1198, 67 world) | Each table mug is its own "Mug of coffee" interactable. On the table it shares a menu with Helena's plans (20 px). In the tunnel it is 14 px from the rota. | Make the mugs non-interactable decor, or move the table mug onto a kit crate. |
| T1 | minor | blast_tunnel | post desk (≈ 187–235, y 33–71); tunnel_guard_kettle (7, 2.5) | The desk's collision covers only its legs, so the player can walk behind it (round 1 walk). The kettle copy's feet (≈ 64) are inside the desk sprite. | Add a collision rect over the desk's whole footprint to the wall. Move the kettle copy to (7, 2.9) so he stands in front of the kettle. |
| S1 | minor | security_office | duty_guard_b (8, 4); filing cabinet (≈ 248–275, y 30–90) | Engine log: "stuck in wall at (1216, 97)". Her home tile is against the desk end and the cabinet. | Move her to (7.3, 4.5). Her frame then still misses the door log's top-left (186, 47). |
| S2 | minor | security_office | duty_handset on a brown side table, open floor (≈ 166–198, y 112–152) | A phone on a lone table in mid-floor reads as a stray. | Wall-mount it: a 1960s Bakelite wall phone on the east wall above the duty screen (about x 292, top-left y ≈ 100, 40 px or more from the screen's slot). Remove the table. |
| S3 | minor | security_office | floor below y 150, west of the locker | Bare next to m09's offices. The raid copies (y 7) and duty_guard's beat to (6, 8) need the middle. | Wall-side only: a row of coat hooks with a hi-vis and a tin hat on the west strip under the cupboard; a fire bucket and sand by the S door frame (not in its lane). |
| W1 | minor | workshop_floor | west bench and Imran's bench (cream office `desk1`) | Office desks read wrong on a workshop floor (m09 R4 H5 made the same point). | Swap for steel workbenches (`zds_desk3`, as in m09's salvage cage), keeping the slots. |
| W2 | minor | workshop_floor | kowalczyk_ws (6.6, 3); tool chest (≈ 175–215, y 45–88) | That copy stands into the tool chest's front. | (6.6, 3.4). |
| P1 | minor | power_room | BATTERIES plate on the mesh | A mesh post draws over the plate, so it reads "BATT RIES". | Fit the plate within one mesh panel, or draw it above the post's depth. |
| P2 | minor | power_room | shutter_isolator `as-type:aes_esd_station` | The text says "a key switch and a breaker row, labelled GALLERY SHUTTER". The sprite is m04's yellow emergency-stop box with a red mushroom button, which a player may avoid pressing. It also has no `readDisplay`, so it opens as a toast into notes and copies its live `textVariants` there. | Hand-draw `m10_key_isolator1`: a key switch, a breaker row, a GALLERY SHUTTER label. Add `readDisplay: "gameDisplay"` and `addToNotes: false` if the puzzle owner agrees. |
| P3 | minor | power_room | static_kit `aes_toolbox` on the floor by the switchgear | Says "a tool roll on the bench"; it is a red toolbox on the floor, and there is no bench. | Change the text to "on the floor by the switchgear", or draw a tool roll on top of the switchgear's ledge. |
| P4 | minor | power_room | yellow line mid-floor (≈ x 86–270, y 104) | A lone stripe across open floor reads as a stray mark. | Turn it into a hatched keep-clear box in front of the load board and switch panel, or remove it from the sheet. |
| P5 | minor | power_room | kowalczyk_pr (2, 7); switchgear cabinet (≈ 24–56, y 125–248) | That copy stands into the cabinet's east edge (`power_room_allnpc.png`). | (2.6, 6.4). |
| H1 | minor | server_hall | gold outline under the plotting board (≈ 82–206, y 54–100); hatched stand-off in front of the hatch | Both read as empty boxes (round 1 walk noted them too); "the old dais" doesn't come across. | Paint the dais as a raised step: a lighter slab with a front edge and a short step at one end, as a floor decal. Stencil KEEP CLEAR inside the stand-off, or swap the hatching for a chain on two posts. |
| H2 | minor | server_hall | the long low blue bench along the SE (≈ x 410–560, y 278–292) | Its purpose is unclear: it reads as a park bench. | Swap it for a cable trough that reads as one (grey, lid ajar, cables showing), or remove it. |
| H3 | minor | server_hall | schedule terminal (≈ 316–334, y 200–224) | A lone terminal on open floor between the console row and the racks. | Stand it against the end of the south rack run, or give it a small plinth with a cable to the racks. |
| C1 | minor | core | whole room | Bare is right, but the core is the one room with no caged lamps and only two things on its back wall. On the walk in from the gallery it looks unfinished rather than bare on purpose. | Two caged bulbs (needed for lighting anyway), a stencilled LEVEL 3 or CORE plate, and a floor cable run from the key console to the west wall. Keep the floor otherwise clear. |
| R1 | minor | several | the brown wooden table: tunnel desk, security handset table, workshop east bench end, hall printer table, core host table, forward post gate terminal stand | Six uses, all the same art. | Steel trestle for the gate terminal (it is outdoors), a steel desk for the core host. S2 removes the security one. |

Not findings, noted for the record:

- Round 1's walk saw two page errors in HaX's phone chat, `reading 'style'` and `reading 'storyJson'`, and m09 saw the `style` one too. For an engine look; not dressing.
- Game 3171 logged 3 × 403 with no URL. Probably the keyless server's VM or flag endpoints; not traced.
- The van steps, slit windows and Farah's chair stay inside NPC frames by design (rounds 1–2).
- An older session (game 3166, pid 2656053) from round 2's helper was still running when I started. I left it alone because I didn't start it.

## Top five

1. **G1, gallery beat through the cluster.** Shorten lock_guard's beat to the east half at y 3.4, or open a gap in the standing row; settle Farah's unreachable waypoint.
2. **G2, hidden reinforcements' health bars over LEVEL 2.** One-line engine fix in `npc-health-bar.js` (follow sprite visibility). It gives the ambush away.
3. **F1, no blast door at the forward post.** A concrete portal on the east strip, and something in the hatched apron.
4. **P2, isolator wears an emergency-stop sprite.** Hand-draw a key switch and breaker row, and make it read in place.
5. **F4 and S1, NPCs in furniture.** Move the generator off nightshade_table's spot; move duty_guard_b off the cabinet; nudge the other copies listed.

## Checks run

All read-only for the repo.

- Browser: game 3171 on the keyless :3001 server, fresh, rooms unlocked with `unlock-all-rooms.rb`; Node 24 via the Playwright cache on PATH. Session stopped at the end (`session-stop.sh 3171`). Log: `m10_dress_r3/session-3171.jsonl`.
- Reach probes (`moveToNear` then `interact`) for the forward post, tunnel, security office, workshop and power room; patrol sampling (500 ms for 24–26 s) for tunnel_guard, duty_guard and workshop_guard; all-NPC-visible shots of all eight rooms.
- Not re-run: the hall, gallery and core reach checks and the six-patrol cycle; round 2's walk covered them.

## Assumptions

- Assumption: the coordinator's summary of the round 1 and round 2 walks (pt1, pt2, game 3178) is accurate; I did not re-read those logs.
- Assumption: the NPC copies in each room are mutually exclusive in play, so I only flagged copies that overlap furniture, not each other.
- Assumption: G2 is the hidden reinforcements' bars. They line up exactly with reinforcement_a and _b when revealed, and appear with both hidden; I did not trace the engine call order further.
- Choice: I rated F1 major rather than minor, because the forward post is the first room and its door is the mission's goal; another reviewer could reasonably call it minor.
- Choice: the gallery fix is offered as two options because the NPC fields are story-owned.
