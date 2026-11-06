# m10 room dressing: review, round 4

## Verdict

**Ready for lighting.** All three R3 majors hold up. The gallery guard now walks the east half behind the lock party, the hidden reinforcements' health bars no longer show, and the forward post has a concrete portal with TG-1 on it. Of the twenty R3 minors, sixteen are fixed, one was accepted with a reason (F2), and three are fixed with something left over (W2, P1, and W1/R1, whose new benches brought a side effect). Nothing above minor remains.

All eight rooms read as their places, the story object in each is easy to find, props sit square to the walls, and no door mouth, tap area or route is blocked. Against m09's finished rooms the remaining gaps are small: a sign half hidden, a bench sprite with a PC tower built in that now appears seven times, and a few NPC copies standing into furniture. None of them changes a room sheet or the furniture plan, so lighting can start now and these can go in alongside it.

The new finale character art reads well on every floor. Two NPC sprites stand out for the wrong reasons (Quintero's walk sprite reads as a man; the gate minder wears an old generic sprite). Both belong to the character owner rather than to dressing.

Counts: 0 blocker, 0 major, 8 minor.

Reviewer: fresh, read-only. Nothing edited apart from this file; nothing committed.

## What I looked at

- Standards: `.claude/skills/mission-room-dressing/SKILL.md`, `docs/agents/FINALE_BRIEF.md`, `ROOM_DRESSING.md` rounds 1–3, `DRESSING_REVIEW_R3.md`, stage 5 `room_layout.md` (NPC spots), the user's rule that props sit square to the walls (one or two angled per room), and m09's `DRESSING_REVIEW_R4.md` as the bar.
- Map renders: a fresh `render_room_preview.py 'room_m10_*' --grid --scale 2` and contact sheet. All nine images are pixel-identical to `dressing_r3/maps/`, so those renders are current.
- In game: `dressing_r3/ingame/` (game 3187, the start-of-mission NPCs), plus my own tour of all eight rooms with every NPC copy made visible at once (game 3215, `lighting-tour.sh --close-intro --show-npc <all 76 ids>`). The copies in a room are mutually exclusive in play, so I only judge copies against furniture, not against each other.
- A short live session (game 3222, fresh, rooms unlocked server-side) to sample patrols for 25 s and catch console warnings with an in-page hook.
- Object lists from `room_edit.py room_m10_<room> list`; NPC fields from the rendered `scenario.json.erb`.

Positions are room pixels (x left edge, y feet) unless marked as tiles. NPC tiles are the scenario `position`.

## R3 findings: resolved?

| # | R3 sev | Status | Evidence |
|---|---|---|---|
| G1 | major | **resolved** | lock_guard shuttles between world x 2442 and 2486 at y 333 (tiles 7.9 ↔ 6.2, y 3.4) in game 3222; one "No path found" in 25 s, none from Farah, the monitor guard or anyone else. In the 3187 shot he stands behind the lock party, clear of the slit window. Farah's chair sits under her, not in her feet. |
| G2 | major (engine) | **resolved** | 3187 gallery shot: no bars with the reinforcements hidden. My all-NPC tour forced them visible and their bars appeared with them, so the bar follows the sprite as intended. A visible reinforcement_a's bar sits over LEVEL 2; that is correct for a hostile on screen. |
| F1 | major | **resolved**, small residue | `m10_portal_head1` (x 544, feet 58) with TG-1 on the lintel, the open steel leaf on the east wall below the doorway (x 610, feet 192), a threshold plate and a drain in the apron. The NE corner now says "way in". The door itself is still the pale interior side door set in chain-link: see F6. |
| F2 | minor | accepted | Van two's step stays at its door, reached from the east through a menu with Nightshade. Fine. |
| F3 | minor | resolved | Step under van one's lit door. |
| F4 | minor | resolved | Generator now bottom-left beside the incident-file crate. In the all-NPC shot nightshade_table, phantom_post, kowalczyk_van and nightshade_blast all stand on clear gravel. |
| F5 | minor | resolved | No mugs on the forward table, tunnel desk or security desk. |
| T1 | minor | resolved | Kettle copy stands in front of the desk and kettle; the round-3 walk confirmed the floor behind the desk is blocked. |
| S1 | minor | resolved | duty_guard_b at (7.3, 4.5) on open floor below the desk's east end; no "stuck in wall" logged in 3222. |
| S2 | minor | resolved | Black Bakelite wall phone on the east wall above the duty screen; the stray side table is gone. |
| S3 | minor | resolved | Hooks with a hi-vis and a tin hat on the west strip; two fire buckets east of the S door's lane. |
| W1 | minor | resolved, side effect | Steel benches in place of the cream office desks. The bench sprite (`zds_desk3`) has a PC tower drawn under it: see R2. |
| W2 | minor | **partly** | kowalczyk_ws moved to (6.6, 3.4), but her feet still land on the tool chest's base line and her body covers its drawers: see W3. |
| P1 | minor | **partly** | The mesh post no longer cuts the plate, but the battery racks in front now hide its lower half: see P6. |
| P2 | minor | resolved | `m10_key_isolator1` reads as a key switch and breaker row; opens in place. Its notes copy (`addToNotes`) is still the puzzle owner's call. |
| P3 | minor | resolved | Tool roll on a steel bench by the switchgear. |
| P4 | minor | resolved | Hatched keep-clear box in front of the load board and panels. |
| P5 | minor | resolved | kowalczyk_pr (2.6, 6.4) stands clear of the switchgear cabinet. |
| H1 | minor | resolved | Dais reads as a lighter slab with a shadowed front edge under the plotting board; the hatched stand-off is gone. Subtle, but it no longer looks like an empty box. |
| H2 | minor | resolved | Cable tray removed. |
| H3 | minor | resolved | Schedule terminal stands in the gap in the south rack run. |
| C1 | minor | resolved | Two caged bulbs, a CORE plate, a floor cable from the key console to the host desk. Bare on purpose now looks deliberate. |
| R1 | minor | resolved, side effect | The brown table survives only as the tunnel's post desk, where it fits. Its replacement repeats instead: see R2. |

## Rooms, judged afresh

Against m09's finished rooms, the tunnel, security office, power room and core now sit at the same level. The forward post, workshop, server hall and gallery are close behind, held back only by the minors below. Every back wall carries two to five fixtures, and the open floor in the big rooms is where patrols and NPC copies stand, which is right.

| Room | Reads as its place | Key objects easy to spot | Clutter / empty | Repetition | Square | Doors, taps, routes | Findings |
|---|---|---|---|---|---|---|---|
| forward_post | yes: rock face, fence, two vans, trestle table under a work lamp, gate kit, sodium lamp, hut, TG-1 portal | table items, gate terminal, hut and portal all clear | busy NW (vans, crates, cast); SE open for the raid copies | none | vans side-on and cones (accepted angled pieces) | E door and both vans' steps clear | F6 |
| blast_tunnel | yes: caged bulbs, FALLOUT SHELTER, post desk and kettle, ladder, drain | panel, rota, ladder | right for a corridor | none | yes | both doors clear | none |
| security_office | yes: alarm board, duty board, monitor desk, cabinet, cupboard, locker, wall phone | yes | balanced now; lower floor kept for the raid trio and the guard's beat | none | yes; wheelie bin the one angled piece | W and S lanes clear | none |
| workshop_floor | yes: pegboard, tool chest, drawers, steel benches, cable drum, cracker bay | yes | balanced | four `zds_desk3` with four PC towers | yes | N and E doors clear | W3, R2 |
| power_room | yes: Bakelite panel, dial board, switchgear, isolator, battery bay | yes | balanced | none | yes | doors clear | P6, R2 |
| server_hall | yes: plotting board on the dais, console row, racks, sealed hatch, camera | yes | middle open on purpose (two beats, Asante or Mercer, raid copies) | cream `desk1` console row (fine for a refit) | one office chair angled | both lanes clear | H4, R2 |
| gallery | yes: tread plate, slit windows, rail, keypad plate | yes | crowded by NPCs, not props | none | yes | beat no longer crosses the standing row | R3 |
| core | yes: bare on purpose, but finished: caged bulbs, CORE, file screen, readout, cable | key console, readout, host terminal, service door | sparse by design | none | yes | W door and service door clear | R3 |

Tile faults: none found. All eight maps read 64 on `check_room_walls.py`. No wall item crosses the frame in the renders, and no floor prop stands in a door mouth.

## NPCs against the rooms

The sixteen finale characters are all in (every `spriteSheet` used in m10 has its atlas). On every floor, from the forward post's gravel to the hall's slate and the gallery's tread plate, they stand out cleanly: dark jackets and suits read against the lighter floors, and nobody vanishes into a wall colour. Tesseract in his chair behind the key console is the strongest image in the mission.

Copy by copy against furniture (all-NPC tour, game 3215):

- Clear: every forward post copy (after R3's moves), both tunnel copies, all six security office copies, every power room copy, all hall copies except one patrol end, every gallery copy, all four core copies.
- Into furniture: kowalczyk_ws over the workshop tool chest (W3); hall_guard_b's west turn tucked into the east rack's corner (H4).
- Standing in front of furniture, which is normal for a top-down room and not a finding: gary_consultant (3, 4) in front of the parts drawers, the workshop guard's west turn in front of the bench chair, arakawa_ws (5, 7) in front of Imran's bench, the tunnel kettle copy in front of the post desk.

Two sprites read badly. Neither is a dressing fault; both go to the character owner (N1, N2 below):

- **Quintero** (`marisol_quintero`, seven copies from the forward post to the core). At walk-sprite size the short swept-back grey hair, square shoulders and navy jacket read as a man; I took her for one in the first shots. The portrait prompt describes her this way, and the bust may well read as a woman, but the 64 px walk sprite doesn't, and everyone in the script calls her "she".
- **The gate minder** (`minder_blast`, `female_blowse`). A bright blue top and red trousers in the older generic style, among a cast in muted field kit. At the gate it is the brightest thing in the room.

## Findings

| # | Sev | Room | Where | Finding | Fix |
|---|---|---|---|---|---|
| P6 | minor | power_room | `m10_sign_batteries1` (x 98–141, top 231, feet 242) on the mesh run (y 216–240); `pnw_batteries1` ×2 in front (tops y 237, feet 290) | The battery racks draw over the plate's bottom five rows, so it reads as the top half of a word (`dressing_r3/maps/room_m10_power.png`; same in game). R3 P1's mesh-post fault is gone; this replaced it. | Lift the plate to feet 236 or less (top about 225), so it sits wholly on the mesh above the rack tops. No depth change needed. |
| R2 | minor | workshop_floor, power_room, server_hall, core | `zds_desk3` ×7: workshop x 34, 85, 158, 213 (feet 196–200); power x 34 feet 296; hall x 40 feet 262; core x 36 feet 170 | This sprite has a PC tower drawn under its top. Seven towers in four rooms: under the tool roll in a 1962 plant room, under the uplink printer, under benches holding a battery and a cable bundle. They read as office desks again, which is what W1 set out to fix, and the same sprite now repeats more than the brown table did. | Hand-draw a towerless steel bench at the same 51×39 (same top and frame, legs and a low shelf or open space beneath) and swap it in everywhere except the workshop bench at x 34 under the bench terminal and the core host desk, where a tower makes sense. Slots and table items stay where they are. |
| W3 | minor | workshop_floor | kowalczyk_ws (6.6, 3.4); `aes_tool_chest1` (x 182–230, y 52–100) | Her feet land on the chest's base line and her body covers its drawers (all-NPC tour). Raid copy, so it shows only after the raid. | (6.6, 4.0): she stands in front of the chest, not in it, and stays out of Imran's and Gary's benches (tops y 157). Story-owned field; the orchestrator's call. |
| F6 | minor | forward_post | E door (x 608–640, rows y 64–128); east side strip | The concrete portal is on the north wall, west of the corner. The door is the same pale interior side door as every other room, set in a chain-link strip, so the two don't join up. | Repaint the east strip from the corner down to the door's foot (x 608–640, y about 40–140) as the portal's concrete reveal, so the door sits in the concrete mass. A dark steel door sprite for this doorway alone, if the engine allows per-door art, would finish it. Optional. |
| H4 | minor | server_hall | hall_guard_b west turn (13, 8), world x 2017 at its west end; `hq_rack1` at x 380–412, top 230, feet 290 | At her west turn she is tucked into the east rack's corner with her legs over its top edge (3187 shot and the all-NPC tour). Patrol still cycles (x 2017–2142 in 3222). | Move the west waypoint and her start to (13.6, 8), or to (13, 7) above the rack tops. Story-owned field; leave it if the orchestrator prefers. |
| R3 | minor | gallery, core, workshop_floor | `hospital_chair_north`: Farah's chair (gallery, scenario slot), the empty chair facing the key console (core x 196, feet 214), the bench chair (workshop x 52, feet 222) | A teal moulded plastic chair from the hospital set. In a 1962 bunker it reads as a waiting-room chair, most of all in the core, where it is the chair the player is offered opposite Tesseract. | Hand-draw a grey steel folding or canteen chair at 16×26 (north-facing) and swap the three. Farah's is a scenario `as-type` slot, so register the new sprite under a base type and point her chair at it. Optional. |
| N1 | minor (character art) | all rooms with Quintero | `marisol_quintero` walk sprite | Reads as a man at game scale (see "NPCs against the rooms"). | Character owner: look at the walk sprite against the bust. One clear cue at 64 px would settle it: longer hair at the back, a different silhouette, or a lighter collar. Hand edits go in `tools/pixellab_overrides/`, per CLAUDE.md. |
| N2 | minor (character art) | forward_post | minder_blast (15, 8), `female_blowse` | Old generic sprite in bright blue and red among the finale cast. | Character owner: give the ENTROPY minders a muted sprite (dark field kit), or reuse the `male_spy_v2` minder's style for a woman. |

Not findings, noted for the record:

- The Hashchain guards (`male_security_guard`, `_v2`, `security_guard`) wear peaked caps, white shirts and red epaulettes, closer to police than to a private guard force. They also repeat between the tunnel, security office, hall and gallery. That fits generic guards, so I've left it out of the findings.
- R3's open item, "vos stuck in wall at (5, 3)", did not show up in 3222, but Vos was hidden at the start there, so it isn't proven gone.
- The isolator still copies a snapshot to notes; `addToNotes: false` is the puzzle owner's call (round 3, open item 1).
- The tunnel rota shares a menu with the patrolling guard at his first waypoint (round 1 trade-off).
- The console row in the hall is still the cream `desk1`; for the refit's control desk that is fine.

## Top five

1. **R2, the bench with a PC tower, seven times.** Draw a towerless steel bench and swap five of them. It undoes most of what W1 and R1 aimed for.
2. **P6, BATTERIES plate half hidden by the racks.** Lift it to feet 236 or less.
3. **N1, Quintero's walk sprite reads as a man.** Character owner; she appears in seven rooms and the script calls her "she".
4. **W3, Kowalczyk's workshop copy standing in the tool chest.** (6.6, 4.0).
5. **F6, the blast door is still an interior side door in chain-link.** Concrete reveal on the east strip around the door rows.

## Checks run

All read-only for the repo; no repo file was changed by them.

- `render_room_preview.py 'room_m10_*' --grid --scale 2` and `--sheet`: pixel-identical to `dressing_r3/maps/` (all nine images).
- `lighting-tour.sh m10_full_disclosure <scratch>/allnpc --close-intro --show-npc <all 76 ids>`: game 3215, all eight rooms shot, session stopped by the script. Node 24 from the Playwright cache on PATH.
- Live session, game 3222 (fresh, rooms unlocked server-side): console hook for warnings, then 25 s of patrol sampling for hall_guard_a/b, workshop_guard, lock_guard, duty_guard (all cycling; tunnel_guard and vos hidden at start). Warnings apart from TTS 403/503: one "No path found" from lock_guard. No "stuck in wall", no "No Tiled item found", no page errors. Stopped with `session-stop.sh 3222`.
- `slot_audit.py --notes`: 0 problems, 0 notes prompts. `check_room_walls.py --scenario`: all eight read 64.
- Not re-run: per-object reach checks and door crossings. Round 3's walk (game 3188) covered them, and nothing on the maps has changed since.
- Scratch (session scratchpad, `m10_dress_r4/`): `maps/`, `allnpc/`, crops, `session-3222.jsonl`, `m10.json` (rendered scenario).

## Assumptions

- Assumption: the maps and scenario are unchanged since round 3's renders. The pixel-identical renders show this for the maps; for NPC fields I used the current `scenario.json.erb`.
- Assumption: forcing every NPC visible in one shot is a fair test against furniture, since copies are mutually exclusive in play; I didn't judge copies against each other.
- Assumption: N1 is judged from the walk atlas and in-game shots; I didn't open Quintero's bust or talk sheet in a conversation.
- Choice: R2 is rated minor, not major. It is a single sprite swap, and every room still reads as its place with it.
- Choice: the guard uniforms are noted, not filed: generic guards, outside dressing.
