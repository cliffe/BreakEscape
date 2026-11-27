# Seating

Chairs the player and NPCs can sit on. Code: `public/break_escape/js/systems/seating.js`.
Test scenario: `scenarios/test_seating` (three rooms: placed NPCs, waiting chairs,
needs NPCs at their PCs with a coffee station). Unit test: `test/js/seating.test.mjs`.

## The player

| Input | On a swivel chair | On a static chair |
|---|---|---|
| E or a click on the chair | sit (a far chair: walk there, then sit) | sit |
| Arrow keys / WASD, click-to-move | roll the chair, no walk animation; the seat turns to the direction of travel, snapped to the chair's valid facings | hop off and walk |
| Space | stand up on the chair; Space again jumps off | same |
| F (punch), Q (block) | gets off | gets off |
| E near something else (a desk PC) | uses it, still seated | same |
| E with nothing else in reach | gets off | gets off |

An avatar whose atlas has no seated frames stands on the chair instead of sitting.
Chairs show the open hand and "Sit:" in the tap menu, and lose to anything else the
player is facing when E picks a target.

How it works: the player sprite stays the physics and movement driver but is hidden.
A separate sprite shows the pose on the chair. On a swivel chair the driver's body takes
the chair's footprint and the chair follows it; the chair's own body is off until the
player gets up. Footsteps stop while seated; rolling plays a looped stretch (1.5–7.5 s)
of `chair_roll.mp3`.

## Breathing and fidgeting

Anyone seated breathes: the head and shoulders (the top 42% of the figure) sink 1px for
part of a 3.6 s cycle, each sitter on its own phase. The sitter is cropped below the cut
and an image of the rows above it is drawn 1px lower, so no gap opens. The standing
breathing-idle frames can't be reused: they are redrawn frame to frame (faces change)
and drawn at another scale from the seated state. Breathing is off under reduced motion,
for a sprite with a glow (postFX), and while a needs NPC types (the typing bob moves the
whole figure instead).

A seated NPC on a swivel chair also rolls up to 3px sideways or 2px back (never forward
into the desk) every 4–11 s, and holds still while it faces the player or talks.

## Layering

From the 8-direction render tests: facing away (N, NE, NW) the chair is drawn over the
sitter, so the backrest hides the torso and the head shows above it; every other
facing draws the sitter over the chair. Exec and office armchairs facing south redraw
their armrests over the sitter. Exec chairs facing away lift the sitter 4px so the hood
clears the tall backrest.

## Chairs

| Chair | Kind | Facings |
|---|---|---|
| `chair-exec-rotate*`, `chair-darkgray-1`, `chair-grey-1`, `chair-grey-4`, `chair-white-1`, `chair-white-2` (and their `-rotate*` frames) | swivel | all 8 |
| `hospital_chair_south`, `aw_chair_south_*`, `exec_chair_black1`, `aw_studio_chair_s1` | static | south |
| `hospital_chair_north`, `hospital_chair_north2`, `aw_chair_north_*`, `exec_chair_back1`, `aw_studio_chair_n1` | static | north |
| `chair-waiting-left-1` / `chair-waiting-right-1` | static | west / east |
| `m10_steel_chair1`, `sofa1` (an armchair), `leather_chair1` | static | south |
| `club_chair_e1` / `club_chair_w1` | static | east / west |
| `leather_sofa1`, `uni_sofa2`, `hce_bench1` | static, two places each | south |

A sofa or bench has `places` instead of one `seat`: each place holds one person (three
sitters overlap at this scale, so two fit), and the free place nearest the player or NPC
is taken. A full sofa reads as `seatedBy: 'full'`.

Not seats (yet): lecture rows (in the ideas backlog), `m10_steel_bench1` (a workbench),
the wheelchair, trolleys and carts.

The rotation sheets don't share one frame order: `chair-exec` runs S, SE, E…, the grey,
darkgray and white-2 chairs S, SW, W…, and `chair-white-1` starts at north. The table
in `SWIVEL_SEATS` records each; the unit test pins them. Adding a chair: render it with
the sitter in all 8 facings first (the scratch tool that made the anchors composited the
PixelLab seated rotations onto each chair frame), read the seat point per facing, then
add it to `FAMILIES`/`SWIVEL_SEATS` or `STATIC_SEATS`.

## Seated frames

A character gets seated frames from a PixelLab state "sitting in an invisible chair"
(`create_character_state`, 10 generations for a 60px character). Import them with:

```
python3 tools/pixellab_pipeline.py import <key> --force --sit-from <state id or URL>
```

The 8 rotations become one-frame `sit_<direction>` animations; every other frame is
unchanged (the converter keeps them out of the standing feet-line sampling).
`tools/pixellab_characters.json` remembers `sit_from` for later re-imports. Each atlas's
hip point is measured once at runtime from its `sit_south` frame, because characters land
a pixel or two apart on the 80x80 canvas.

Which atlases have them: `sit_from` in `tools/pixellab_characters.json`. Since
2026-11-05 that is every PixelLab atlas a scenario uses and every selectable player
avatar; the few non-PixelLab atlases (legacy sheets such as `hacker`) stand.

## NPCs placed sitting

`"seated": true` (or an object, see README_scenario_design.md) on an NPC sits it on the
nearest free chair within `maxDistance` px (default 40) of its spawn. It doesn't patrol.
A scripted move (`goToAndStay`), hostility or a KO gets it up. On a swivel chair it
turns to face a player within its `facePlayerDistance` unless `facePlayer` is false.
Events: `npc_sat`, `npc_stood` (`{npcId, objectId, facing}`).

## NPCs with needs (npc-needs.js)

No field needed. A needs NPC that has stopped at an object (using it, or idle at its
post) sits on a free chair right there, square to the desk (back along the affordance's
`useFrom`). With none there it fetches a free swivel chair from the same room for work
or its own post: it walks over, rolls it back and sits (`npc_fetching_chair`). Elsewhere
(the coffee machine) it sits only if a chair is already there, otherwise it stands.
Chairs at another needs NPC's post are left alone. Leaving for coffee, it stands back
on its work spot and tucks the chair 12px in, so the chair doesn't block its way back.
At its own post it looks for the chair from its home cell, not its feet, when it is within
1.5 tiles of the cell (`needsSeatRef`): a walk ends anywhere within a tile of its target, so
an NPC back from coffee can stand ~32 px off the cell, and before 2026-11-06 a chair a little
over 36 px from its feet was missed and it worked standing for good.

Per object: `affordance.seat` = `"fetch"` (default for work and posts), `"stay"`
(only a chair already there) or `false` (always stand). Per NPC: `"seated": false`
always stands; `"seated": {"fetch": false}` never fetches.

The needs system is untouched: the behaviour update calls `seating.updateSeatedNPC`,
which reads `npcNeedsSystem.states`; fetch moves are issued with `owner: 'needs'` so
they don't suspend needs, and their arrivals are ignored while the job is in `using`.
