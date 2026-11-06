# m07 lighting, cycle 2 review

Reviewer: fresh Opus agent, read-only. Sources: the skill's step 5 checklist, `docs/agents/LIGHTING_LOG.md` (m05 and m06 lessons), `LIGHTING_PLAN.md` with its cycle 1 log, `lighting_c1/review_c1.md`, the lighting blocks in `scenario.json.erb` (744, 752, 1632, 1723, 1902, 2045, 2118), the countdown's `spriteVariants` (2005-2009) and `textVariants` (2015-2019), the three new faces in `public/break_escape/assets/objects/pnw_countdown_{armed,running,aborted}1.png` (all 76x32, the same size as `pnw_countdown1`), `systems/lighting.js` (header, `resolveRoomLighting`, `configureRoom`, `resolveRoomVariant`, the draw loop) and `core/rooms.js` (`createSpriteFromMatch`, `registerSpriteVariantListeners`). I looked at every still in `lighting_c2/{base,armed,expired,saved}/` myself, set them against `lighting_c1/` and the unlit `dressing_c4/`, and measured regions with PIL. Screen positions are pixels on the 1400x1000 stills (2x zoom).

## Summary

Cycle 2 fixed what cycle 1 asked for. The red and amber glows no longer reach the north rim of either control room. Measured on the rim strip, the SCADA frame above the countdown went from R 203-207 in armed and expired (c1) to R 148-151, against R 146 on a part of the same rim the glows don't reach. The ops rim above the wall went from R 192 in expired to R 141, level with the other states. The countdown now shows a different face in each state (SEQUENCE LOADED / ARMED / RUNNING / ABORTED), in the same order as its text, so its light no longer claims something the face doesn't show. The mimic lamps read in every state, the backup server's blink is gone, and the plan has its cycle log.

Nothing on the critical path is lost:
- **Ops floor:** the key and handover sheet sit in the supervisor laptop's pool (x 620-770, y 720-760) in all four states.
- **Checkpoint:** the badge printer and visitor log are clear on the counter (x 460-660, y 345-385).
- **Generator hall:** the plant log clipboard (x 350, y 290) and the ATS-1 plate and cover read once the hall strikes. In the dark, the ATS lamp and the genset panel mark the room.
- **SCADA control:** the countdown reads in every state, and the signed projection on the master desk beside Mercer (x 755, y 478) is clear in every state.

There are two minors, neither a blocker. The video wall's light is a single round pool under the middle of a wall of screens, and the wall's own art and text stay amber and "PENDING" after step one has run, while its light goes red.

## Findings

### Blocker

None.

### Major

None.

### Minor

**m1. The video wall lights the floor like a single spot, not like a wall of screens.**
Evidence: `situation_board` is one object 159 world px wide (Tiled x 114-273, bottom y 58, `room_pnw_ops.json`), and on screen it spans x 610-925. Its glow (r 72, offsetY 30, `scenario.json.erb:1637-1639`) makes one warm pool centred on x 765, y 340-380, about 130 px across, which is about 40% of the wall's width. The floor under each end of the wall does not change in any state. Mean RGB at x 615-660 and x 880-925, y 330-380, is (61, 72, 100) in base, armed, expired and saved alike. The centre pool, at x 700-830, goes (120, 109, 105) at start, (131, 105, 96) armed, (137, 89, 111) expired and (129, 119, 108) saved. One object carries only one glow, so the emitter alone can't spread this light.
Fix (config only): add two room `lights` under the ends of the wall, and give them the phase colours through room `variants`. Room variants rebuild `extraLights` and keep everything the variant doesn't name (`resolveRoomLighting` merges the variant over the block; `panels: false` and the emitters stay). The breathe and the floor tint stay on the emitter in the middle. Coordinates are room tiles: the wall runs from tile x 3.56 to 8.53, and the floor starts at y 2. In the `operations_floor` lighting block:

```json
"lights": [
  { "x": 4.2, "y": 2.2, "color": "#ffa030", "radius": 40, "intensity": 0.35 },
  { "x": 7.9, "y": 2.2, "color": "#ffa030", "radius": 40, "intensity": 0.35 }
],
"variants": [
  { "condition": "globalVars.countdown_expired && !globalVars.grid_saved",
    "lights": [ { "x": 4.2, "y": 2.2, "color": "#ff4a3a", "radius": 40, "intensity": 0.4 },
                { "x": 7.9, "y": 2.2, "color": "#ff4a3a", "radius": 40, "intensity": 0.4 } ] },
  { "condition": "globalVars.cascade_armed && !globalVars.grid_saved",
    "lights": [ { "x": 4.2, "y": 2.2, "color": "#ff7a1a", "radius": 40, "intensity": 0.4 },
                { "x": 7.9, "y": 2.2, "color": "#ff7a1a", "radius": 40, "intensity": 0.4 } ] }
]
```

Trim the emitter's radius from 72 to 60 on all three `situation_board` variants, so that the middle doesn't outshine the ends. A centre at y 2.2 with r 40 reaches up to world y 30, below the room's top frame (0-16), so the rim stays clean. Re-shoot ops in all four states. The target is the end regions above lifting towards the centre's warmth (R about 95 or more at start) with the rim strip x 610-925, y 200-222 unchanged. If the front-row monitor tops (screen y about 415) pick up too much amber, drop y to 2.1 or the radius to 36. Note that room-light colours change at once when the global flips, with no fade, which is what the emitter does too.

**m2. In the expired state the video wall's light goes red while its art and text still say amber and pending.**
Evidence: `expired/operations_floor-a.png`: the pool under the wall is red (137, 89, 111), but the sprite is unchanged (amber panels, "REMOTE SESSION / REBAL OFF / 8.41M SERVED"). `situation_board` (`scenario.json.erb:1667-1675`) has no `textVariants`. Its observation still says "Every panel on it is amber", and its text still lists "SCHEDULED SEQUENCE -- PENDING / 01 SEATTLE METRO open critical breakers" after step one has run. The light does repeat what HaX has said ("Seattle's dark. Step one ran."), so it is honest towards the player. But the prop that seems to give off the red says the opposite if the player reads it. This is the same class as cycle 1's M2, though milder, because the countdown and HaX carry the beat.
Fix (content or art owner, not lighting): add a `textVariants` entry on `situation_board` for `globalVars.countdown_expired && !globalVars.grid_saved` ("SCHEDULED SEQUENCE -- RUNNING / 01 SEATTLE METRO -- EXECUTED / 02-04 PENDING", and the served-population line down by Seattle's share), and change the observation to match ("One panel on the left has gone red."). If there's time, add a sprite variant with one red panel, drawn the same way as the countdown faces in `make_pnw_props.py`. Otherwise keep the expired light amber and let the countdown room carry the red. I prefer the text variant, since the red wall is the strongest image of the failure state.

## Cycle 1 findings

| id | sev | finding | status | evidence |
|---|---|---|---|---|
| M1 | major | Red and amber glows bloom over the north rim of both control rooms | **Closed** | SCADA rim x 470-570, y 330-350: armed R 203 → 151, expired 207 → 151 (unlit part of the rim: 146). Ops rim x 700-790, y 200-222: expired R 192 → 141, the same as the other c2 states. No pink on either frame in any c2 still. Config at `:1637-1639` (r 72, offsetY 30) and `:1907-1910` (r 46/44, offsetY 14/12) |
| M2 | major | The countdown face said AWAITING HOST in every state | **Closed** | The four c2 SCADA stills, x 440-590, y 355-420, read SEQUENCE LOADED / --:-- / AWAITING HOST; SEQUENCE ARMED / PENDING / CLOCK RUNNING; SEQUENCE RUNNING / STEP 01 / 01 EXECUTED (first lamp grey, matching "one region has gone grey"); SEQUENCE ABORTED / --:-- / STOPPED (dim). `spriteVariants` at `:2005-2009` are in the same order as `textVariants` at `:2015-2019`. The emitter still matches by id, so the texture swap doesn't affect it |
| m1 | minor | Armed barely differs from the start on the ops floor | **Closed** | Pool x 700-830, y 330-380: base (120, 109, 105) → armed (131, 105, 96), visibly more orange in the still and breathing in play. m1 above would make it read across the whole wall |
| m2 | minor | The expired mimic glow was a pink smudge | **Closed** | `expired/scada_control-a.png`: the mimic has a faint grey-white haze, no pink, and lamps 1-10 are clear. `:1914` `#c8ccd4`, 0.12 |
| m3 | minor | Mimic and historian glows washed out lamps 4-7; the post-abort green blended in | **Closed** | All four states: every mimic lamp reads (checked at 4x). In `saved`, the green sits on the cascade control screen's face (x 615-700, y 410-485) and reads as the screen. `:1918-1919` r 26, offsetY 2; `:1915` r 24, 0.2 |
| m4 | minor | ATS-1 amber blink not caught; green lamp out during the fault | **Closed for the stills; blink to confirm live** | `saved/generator_room-a.png` (dark) shows a clear amber lamp at x 295, y 313, and `-b.png` (lit) a small amber point in the same place, so both stills caught the on phase. The green lamp going out is accepted (the fault replaces ARMED, as the text says). Whether it really blinks is for the browser check |
| m5 | minor | Backup server blink reads as "interact here" | **Closed** | No `scada_backup_server` entry in the server room block (`:1723-1732`). BKP rack in `base/server_room-a.png` (x 895-950, y 430-540) shows no glow |
| m6 | minor | The checkpoint is barely moodier than the unlit baseline | **Closed (as asked), small effect** | `:753` `#bcc2ce`. Floor x 445-950, y 440-690: unlit (153, 167, 155), c1 (137, 153, 147), c2 (135, 152, 147). The c2 change moved it about 2 per channel. It already sat about 15 below unlit, which is enough for a front-of-house room that should stay the brightest. No further change asked |
| m7 | minor | Cycles section empty | **Closed** | `LIGHTING_PLAN.md` section 7 has the cycle 1 table. Cycle 2's entry (tours 2451-2456) is still to add after this review |

## Checked and fine

- **Ops floor, all states:** darker and bluer than baseline, desks and consoles readable, the supervisor's desk in its laptop pool, no rim bloom. Expired red is clearly different from armed orange in the stills (pool G 105 → 89).
- **SCADA control, all states:** the room is plum and moody, not grey. The countdown's glow lands on the console desk below it (x 460-590, y 430-520) with no spill above the display. Armed and expired look alike in the stills apart from the face, and the steady-against-breathing difference only shows in play. The face carries the difference, and that is enough. After the abort, a dim red glow from a dim red "STOPPED" face matches "Nobody has thought to switch it off." The projection is clear in every state.
- **Generator hall, dark:** navy, not black. Gensets, racks and both doorways are findable. The ATS lamp (green at start, amber in `saved`) and the genset panel read as indicators. Lit: the room looks like itself, a little warmer.
- **Server room:** cool and readable with Elena present. The rack-4 cabling note is clear, the sign and suppression panel are steady, there's no rim bloom, and it doesn't bleed into the dark hall below.
- **Cable vault:** cool green-grey, splice lamp and gas detector read, the printout is on the trestle table. The flicker is in a room where reading and the Park conversation happen in overlays.
- **Faces:** the three new PNGs are the same size as the base face, so the swap doesn't move the sprite. The on-demand load (`rooms.js` `createSpriteFromMatch` at load time, `registerSpriteVariantListeners` on a change) worked in the tours.

## Evidence notes

- The `--check` lines again report redraw ages of 300-400 ms (one sample per room, the same as c1). The phase glows and faces rendered, so the map drew after the globals were set. A second sample was asked for in c1 and still hasn't been taken. This isn't a finding, but the browser check should look at a live frame.
- Breathe and blink stills catch a random phase. The ATS blink and the armed breathe need watching in play.

## Counts and verdict

Blockers 0, majors 0, minors 2. All nine cycle 1 findings are closed (m4's blink still needs a look in the browser check).

Verdict: nothing above minor, so the review loop can close. I'd take m1 now: it's a config edit in one block, it answers the question about the video wall's width, and it needs one re-shoot of ops in four states. m2 goes to the content or art owner as a text variant, or is logged as a decision. Then run the browser check (ATS blink, armed breathe, strike in the generator hall) and record cycle 2 in `LIGHTING_PLAN.md`.
