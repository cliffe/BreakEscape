# m07 lighting, cycle 3 review

Reviewer: fresh Opus agent, read-only. Sources: the skill (step 5 checklist), `docs/agents/LIGHTING_LOG.md` (m05 and m06 lessons), `LIGHTING_PLAN.md` with the cycle 1 and 2 logs, `lighting_c1/review_c1.md`, `lighting_c2/review_c2.md`, `DECISIONS_PENDING.md` L1, the lighting blocks in `scenario.json.erb` (744, 752, 1632, 1733, 1912, 2055, 2128), the countdown's `spriteVariants` and `textVariants` (2014-2027), and `systems/lighting.js` (header, `configureRoom` building `extraLights` at 386-392, the draw loop at 906-915). I looked at every still in `lighting_c3/{base,armed,expired,saved}/` myself, set each against the same shot in `lighting_c2/` (pixel diff) and the unlit `dressing_c4/`, and measured regions with PIL. Screen positions are pixels on the 1400x1000 stills (2x zoom).

## Summary

Cycle 3 changed one room. The ops floor gained two room lights under the ends of the video wall, with a variant that turns them orange while the clock runs, and the wall's own glow came down from r 72 to r 60. The wall's light stays amber after step one has run. Nothing else changed: the other five rooms match their c2 shots apart from LED blinks, breathe phases and the blink of the ATS-1 lamp.

The two new lights do show. Under each end of the wall the floor's red channel went from 60 to 83 (+23) in base and saved, and from 60 to 85 in armed and expired. They are faint, though. They lift the floor to a pale, almost neutral grey-warm, well short of the centre pool (R 110-140 at start, 175-190 at the peak of the breathe), and short of the c2 target of R 95 or more. A scan along the floor under the wall shows three lobes with dips between them, not one band. The armed step at the ends is almost nil (amber 0.35 to orange 0.4 moves R by 2). So the "clock running" change still reads as a centre-only effect. Both are minors and both are config tweaks in the same block.

Nothing the player must find or read is hidden in any state, and no light claims anything the player hasn't been told or the lit prop doesn't show.

## Findings

### Blocker

None.

### Major

None.

### Minor

**m1. The wall-end lights show, but too faintly and too neutral to make the wall read as one lit band.**
Evidence: mean RGB, floor under the left end (x 615-660, y 330-380) and right end (x 880-925): c2 base (60, 71, 100) both; c3 base (83, 88, 107) and (81, 87, 107); c3 saved the same as base. The middle pool (x 700-830) is (110, 103, 103) in c3 base. Red-channel scan along y 335-375, every 20 px from x 560:

| x | 580 | 620 | 640 | 660 | 680 | 700 | 720 | 760 | 800 | 820 | 840 | 860 | 880 | 900 | 920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| c2 base | 60 | 59 | 62 | 66 | 75 | 92 | 119 | 143 | 111 | 86 | 71 | 65 | 60 | 59 | 60 |
| c3 base | 63 | 81 | 87 | 83 | 79 | 82 | 107 | 139 | 98 | 79 | 80 | 85 | 85 | 80 | 69 |

The end lobes peak at about 87 with dips of 79 between them and the centre, and the centre is still 50 or more above them. Colour at the ends is close to neutral (R-B −20 against −40 for bare floor), because `#ffa030` at 0.35 added to a blue lit ambient mostly brightens. In the crop it reads as two soft pale patches beside one warm pool. The rim strip is unchanged (x 610-925, y 200-222: 137-138 in c2 and c3), so there is room to push. The front-row monitor tops (x 460-590 and 780-910, y 410-430) are unchanged too.
Fix (config, `operations_floor` `lights`): keep the centres, widen and warm them.

```json
"lights": [
  { "x": 4.2, "y": 2.25, "color": "#ff9020", "radius": 52, "intensity": 0.55 },
  { "x": 7.9, "y": 2.25, "color": "#ff9020", "radius": 52, "intensity": 0.55 }
]
```

r 52 closes the dips at x 680-700 and 820-840. 0.55 should take the ends to about R 95-100, still under the centre. A centre at y 2.25 (world 72) with r 52 stops at world y 20, below the 0-16 top frame. Re-shoot ops in four states and check three numbers: the ends at R 95 or more, the rim strip at 137-141, and the monitor tops within 5 of the c3 values (40-45 R). If the monitors pick up amber, drop the radius to 48. If the rim rises, move y to 2.35.

**m2. While the clock runs, the ends barely change, so the wall still changes only in the middle.**
Evidence: the variant (`:1648-1653`) moves the end lights from `#ffa030` 0.35 to `#ff7a1a` 0.4. Measured at the left end: base (83, 88, 107), armed (85, 86, 105), expired (85, 85, 104). That is a 2-point change. Room lights can't breathe (`extraLights` has no `effect`; `lighting.js:386-392`, `:915`), so the breathe stays on the centre emitter. The colour and level step is the only way the ends can follow the clock. The change lands while the flag-submission screen covers the map (flag 3, `:993-1005`), the same cover as m05's lesson.
Fix (config, the variant): make the step visible.

```json
{ "condition": "globalVars.cascade_armed && !globalVars.grid_saved", "lights": [
  { "x": 4.2, "y": 2.25, "color": "#ff6a10", "radius": 52, "intensity": 0.65 },
  { "x": 7.9, "y": 2.25, "color": "#ff6a10", "radius": 52, "intensity": 0.65 }
] }
```

The target is a clear orange shift at the ends in armed (R up about 10, G and B down) against base, with the centre's breathe still the brightest thing on the floor. This applies with m1. If L1 is taken (Option A), add a first variant for `countdown_expired && !grid_saved` with `#ff4a3a` at the same radius and intensity, as c2 proposed. Until then expired keeps the orange ends, as now.

## Cycle 2 findings

| id | sev | finding | status | evidence |
|---|---|---|---|---|
| m1 | minor | The video wall lit the floor as one spot, about 40% of its width | **Closed in part** | The lights are in (`:1644-1647`, tiles 4.2/7.9, y 2.2, r 40, 0.35) with the armed variant (`:1648-1653`), and `situation_board` is r 60 on all three entries (`:1637-1639`). They show: the ends went from R 60 to 81-85 in every state (the unlit floor next to them stays at 59). They fall short of the c2 target (R 95 or more), and the floor reads as three lobes. Rim unchanged (137-138). Follow-up: m1 and m2 above |
| m2 | minor | After step one, the wall's light went red while its art and text said amber and PENDING | **Closed (lighting side)** | Expired emitter `#ff7a1a`, 0.95, breathe, floorTint 0.5 (`:1637`). Centre pool in expired (140, 115, 99) against c2 (137, 89, 111): no red left, so the light no longer claims what the board doesn't show. The ops floor in expired now looks the same as armed (peak R 190 against 175, same hue), and the countdown room carries the change. The text-and-art option waits on L1 (`DECISIONS_PENDING.md`) |

Cycle 1's m4 (ATS-1 blink): the c3 `saved/generator_room-a.png` caught the off phase (lamp region max (53, 39, 23)), while c2's matching still caught it on ((255, 229, 42)). Same config, opposite phases, so the lamp is blinking. The lit `-b` still shows it on (164, 142, 80). No longer needs the browser check for this.

## Checked and fine

- **Security checkpoint** (base): front of house, a little cooler than unlit, counter, badge printer and visitor log clear. Same as c2.
- **Operations floor**, all states: no rim bloom (rim 137-138 in all four). The key and handover sheet sit in the supervisor laptop's pool. The desks and their screens read. Saved returns to the amber start look (centre (118, 110, 106), ends (83, 88, 107)), which is right because the remote-session incident is still on the board.
- **SCADA control**, all states: identical to c2 within LED and breathe noise. The faces read LOADED / ARMED / RUNNING / ABORTED in the order of the text. The red stays on the console desk (desk (52, 47, 57) armed against (45, 48, 59) base) with nothing over the rim (148-151 against 145 elsewhere). Mimic lamps all read, grey haze in expired. Green on the cascade control screen in saved. The signed projection beside Mercer is clear in every state.
- **Server room**: cool, readable with Elena in it, rack-4 note clear, sign and suppression panel steady.
- **Generator hall**: dark navy with the genset panel and ATS lamp as markers. Doorways faint but findable. Strikes to a clean lit hall with the plant log clipboard and ATS plate readable. The dark floor measures (8, 12, 21), which is m05's hallway dark as intended. It reads as near-black, but the strike on entry makes up for it.
- **Cable vault**: cool green-grey, the splice lamp and gas detector read, the printout is clear on the trestle. The flicker sits in a room whose reading and conversation happen in overlays.
- **Variants resolve as intended**: the `--check` lines give ops `variant=0` in armed and expired and `-1` in base and saved. Every other room is `-1`.

## Notes (not counted)

- Redraw ages in `--check` are again 300-367 ms, one sample per room, as in c1 and c2. The phase glows and faces rendered, so the shots are good.
- Still to do when the stage closes: the cycle 3 entry in `LIGHTING_PLAN.md` section 7, and the m07 entry in `docs/agents/LIGHTING_LOG.md` (step 6; there is no m07 section yet). One lesson worth logging there: a room `light` at r 40 and 0.35 on a blue lit ambient lifts the floor by about 23 in red and reads as pale rather than warm. To read as a coloured source next to a strong emitter, it needs about 0.55 and a more saturated colour.

## Counts and verdict

Blockers 0, majors 0, minors 2. Cycle 2: m2 closed; m1 closed in part (the lights work but are weak, and m1/m2 above carry the rest). Cycle 1 m4's blink is now confirmed from two stills.

Verdict: nothing above minor, so the loop can close. Both minors are worth taking. Together they are one config edit in the `operations_floor` block (the two `lights` entries and the variant's two entries) and one re-shoot of ops in four states, and they finish the job c2 m1 started: a wall of screens lighting the floor across its width and changing as a whole when the clock starts. L1 stays with the orchestrator.
