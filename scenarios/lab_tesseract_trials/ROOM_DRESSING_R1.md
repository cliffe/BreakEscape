# The Keyholder Trials: room dressing, round 1 of 3

Date: 2026-10-06. Method: `.claude/skills/mission-room-dressing/SKILL.md` (survey, critique, fix, verify). Nothing committed.

Scope this round: map layouts in the `room_uni_*` builders, three hand-drawn props and one PixelLab prop. No change to `scenario.json.erb`: no ids, locks, items, NPC positions or story logic were touched. Only this mission uses the `room_uni_*` maps, so no other scenario is affected.

Evidence is in `build_evidence/dressing_r1/`:
- `before/contact_sheet.png` and `before/grid-room_uni_*.png` (all 11 maps, 32 px grid at 2x);
- `after/contact_sheet.png` (final, all 11 maps) and `after/grid-room_uni_*.png` (the 8 changed maps);
- `hand-drawn-8x.png` (the new TV, certificate and portrait beside existing wall art);
- `pixellab/b1-contact.png`, `pixellab/b1-items.json` (the batch);
- `ingame/` (playtest screenshots, see Verify).

## Critique (survey before any change)

Checked against every point in the skill's critique list. Preview renders don't show NPCs or sprite overrides, so NPC placement was read from the Phase 3/4 in-game shots (`build_evidence/rooms/p3-after-*.png`, `p4-after-workshop.png`) and the rendered scenario's positions.

| Room | Reads as | Problems found |
|---|---|---|
| Foyer | An atrium with one recruiter's stand and a heritage table | Only one freshers' stall: no fair. The glass case of old tapes was decor beside the heritage table, so two museum pieces and one stall. The usable floor is only y 64-256 (the lecture theatre's wall covers the bottom rows), and the spawn, W-E lane and south lane take most of it, so there's room for one more floor piece at most. Walls, doors and spacing fine. |
| Teaching lab | A small IT office with two benches | Two benches of four PCs but only four chairs, all at the west desks, so half the seats were empty, including both claimed PCs. The four chairs were wheeled `chair-*` sprites, which are pushable and join taps: one pushed against a claimed PC would raise a pick-one menu. No chair at the lecturer's desk. The bottom third of the room was bare floor (nothing south covers it). |
| Lecture theatre | Tiered theatre | Three rows, then 80 px of empty carpet at the back with the tier lines still painted on it. Otherwise right: seats face the front, lectern and bench, Tom clear of furniture. |
| Common room | Student common room | Megan (2.4, 7.6) stood inside the sofa: her body covered its front (`p3-after-common_room.png`). Back wall had a gap over the lockers; no TV, the one thing every common room has. The lower floor is where both NPCs stand, so there's no room for a games table without moving them. |
| Corridor | Corridor with lockers, noticeboard, pigeonholes | Fine. Two floor rows only; everything is wall-hung or recessed. The two known wall-overlap warnings are deliberate pairs. |
| Library | Issue desk | A conditional floor safe still sat in the library map. It's unclaimed, so hidden in game, but it's a leftover from before the safe moved to Special Collections, and the preview showed it. The right half of the visible strip was empty. Only two floor rows, so no free-standing stacks fit. |
| Special Collections | Archive reading room | The docstring calls the wall picture "the founder's portrait", but it was `picture11`, a landscape. Otherwise right. |
| Sidhu's office | An office | No chair at the desk. The conditional `whiteboard1` slot is unclaimed since Sidhu's board moved to the seminar room, leaving a blank stretch of wall. |
| Seminar room | Seminar room | Fine. The bean bags are a little casual for a seminar room but read as a reading corner; left. |
| Workshop | Maker space | Fine. Cliffe's spot is clear; screens on the back wall, machines on the west wall. |
| Staff office | Open-plan staff office | Two bags lay loose in the middle of the floor (x 280 and 440, feet 252), reading as dropped clutter in the space kept for later staff. |

No room has a wall item over the frame or skirting (`--check`), every map reads 64 (`check_room_walls`), no object blocks a door, and every scenario object has a slot (`slot_audit`: 0 problems).

## Changes, per room

**Foyer** (`room_uni_foyer`)
- The decor glass case (`display_case1`) is replaced by a society's freshers' fair stall (`freshers_stall1`, new, purple cloth, leaflets, sweet jar) at the same spot (222, 253). The foyer now has two stalls and the heritage table. The stall is in the tables layer, so it collides like the case did.

**Teaching lab** (`room_uni_lab`)
- Three benches instead of two (feet 124, 196, 268; previously 132 and 220), so the room reads as rows of PCs and the back third is used.
- A chair in front of every PC (12), all static `hospital_chair_north`, the same teal chair as the lecture theatre, seminar room and staff office. The wheeled chairs are gone: they could be pushed into a claimed PC and raise a pick-one menu.
- A chair behind the lecturer's desk, facing the class.
- The photocopier and bin move down 14 px with the room.
- The two claimed PCs keep their place in the slot order (first in `table_items`), on the aisle end of benches 1 and 2.

**Lecture theatre** (`room_uni_lecture`)
- A fourth row of seats with its ledge (feet 266), filling the empty tier at the back. A walkway stays behind it (y 274-308).

**Common room** (`room_uni_common`)
- Sofa and low table move 24 px up (feet 214 to 190), so Megan stands in front of the sofa rather than in it. Cliffe's spot is still clear.
- A wall TV (`uni_tv1`, new, hand-drawn) above the lockers.

**Library** (`room_uni_library`)
- The stale conditional safe is removed.
- A self-service issue and returns kiosk (`checkin_kiosk1`, existing art) stands where the safe was, clear of the E-to-N walk.

**Sidhu's office** (`room_uni_office`)
- His chair in front of the desk and a visitor's chair facing it (both static).
- A framed certificate (`uni_certificate1`, new, hand-drawn) on the wall, in place of the unclaimed conditional whiteboard slot, which is removed. Sidhu is a certified Hyperledger expert.

**Special Collections** (`room_uni_special`)
- The landscape picture becomes the founder's portrait (`uni_portrait1`, new, hand-drawn, gilt frame).

**Staff office** (`room_uni_staff`)
- One loose bag removed; the other moves beside the east pod (500, 205). Oleg's bag by his desk stays. The six staff slots are unchanged.

**Corridor, seminar room, workshop:** no change.

## New assets

| Name | How | Size | Registered | Used in |
|---|---|---|---|---|
| `uni_tv1` | hand-drawn, `make_uni_props.py` | 40x26 | `--wall` | common room |
| `uni_certificate1` | hand-drawn | 18x14 | `--wall` | Sidhu's office |
| `uni_portrait1` | hand-drawn | 22x28 | `--wall` | Special Collections |
| `freshers_stall1` | PixelLab batch b1, frame #4, trimmed only | 61x59 | no `--wall` | foyer |

`make_uni_props.py` gained an `--only name1,name2` switch, so new props can be drawn without rewriting the existing sprites.

**PixelLab spend:** one batch, 20 generations. Balance 4224/5000 before, 4204/5000 after. Canvas 64, refs `uni_sofa1` and `display_case1`, ten descriptions (two phrasings each of a foosball table, a pool table, a society stall, a wall TV and armchairs). Kept #4 only. Rejected:
- foosball (#0, #1) and pool table (#2, #3): good art, but nowhere to put them. The common room's spare floor is where Megan and Cliffe stand, and moving them is out of scope.
- TVs (#6, #7): drawn at an angle; a wall item must face front-on, so the TV was drawn by hand instead.
- armchairs (#8, #9): 56-61 px wide, bigger than the two-seat sofa (60 px).
- #5 (teal stall) is a usable alternative to #4. #10-15 are off-brief extras.

The foosball tables, pool tables and the teal stall could go into a room later without new spend: the raw frames are kept, untrimmed and not registered, as `pixellab/b1_frame00.png`-`03` and `b1_frame05.png`. Install with `import_pixellab_objects.py` (trims only) and `register_object.py`.

## Checks

| Check | Result |
|---|---|
| Builders vs maps before editing | all 11 identical (no hand edits to lose) |
| `generate_rooms.py` (8 rooms) and `--check` (all 11) | no bad gids. Warnings: the 2 known corridor wall pairs; the deliberate ledge/seat-row overlaps (now 18 rather than 14, for the fourth row); and new "foot in bottom 2 rows" hints in the lab (third bench, its chairs, photocopier) and the lecture theatre (fourth row). Those two rooms have nothing south of them (lab at world y 0-320 with no room below; the theatre is the bottom row), so their bottom rows are visible floor, not covered. |
| `check_room_walls.py --scenario` | 0 maps off the standard (all 64) |
| `slot_audit.py --verbose --notes` | 0 problems, 0 notes prompts |
| `check_door_alignment.py` | 10/10 OK |
| `validate_scenario.rb --skip-ink --no-graph` | exit 0, no errors, 8 warnings, room layout geometry OK. The warnings are the scenario's existing ones and don't concern maps. |
| `game.js` | `node --check` OK; `diff` against a copy taken just before `register_object.py` shows only the four new `this.load.image` lines |

## Verify (in game)

(Filled in from the Sonnet playtest below.)

## What's left, and why

- **Foosball or pool table:** no room in the common room without moving Megan or Cliffe, whose positions the story owns. Proposal for round 2: if the orchestrator agrees to move Megan's standing spot (e.g. to stand at the end of a foosball table), the common room can take one.
- **Library stacks:** the library shows only two floor rows (the teaching lab's wall covers the rest), so free-standing stacks don't fit. A deeper library would need a map size change and a layout change in the scenario's grid, which is a puzzle-graph-neutral but layout-wide change. Proposal only.
- **Foyer freshers' fair** could go further with wall dressing (bunting, a second society pull-up banner on the NE wall), all free hand-drawn art.
- **Seminar room bean bags:** kept; a judgement call.
- **E7 (collision rectangles):** not used; the ledges still make the seat rows solid.

## Assumptions

Assumption: the brief's "no image generation" rule is superseded for this round by the orchestrator's note that the user cleared about 60 PixelLab generations; 20 were used.
Assumption: map-only changes (moving decor, adding decor, removing unclaimed conditional slots) don't touch the puzzle graph, because no scenario object's slot type or order changed and the slot audit still lands every object on the same named sprite.
Assumption: the bottom rows of the teaching lab and lecture theatre are visible floor, inferred from the world layout in `check_door_alignment.py` (no room south of either); if a room is ever added south of them, the third bench and fourth row would be covered.
Assumption: static teal chairs suit a teaching lab better than leaving half the PCs without seats; wheeled chairs would look more like a real lab but bring back the push-into-a-PC menu risk.
Assumption: `scenario.json.erb`, `game.js` and the engine files show as modified in git from other agents' work, not mine; my game.js change is only the four preload lines.
