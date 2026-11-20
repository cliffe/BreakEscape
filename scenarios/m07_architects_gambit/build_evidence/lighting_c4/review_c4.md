# m07 lighting, cycle 4 review (closing review)

Reviewer: fresh Opus agent, read-only. Sources: the skill (step 5 checklist and the rules), `docs/agents/LIGHTING_LOG.md` (m05 and m06 lessons), `LIGHTING_PLAN.md` with cycles 1-3, `review_c1.md` to `review_c3.md`, `DECISIONS_PENDING.md` L1, the seven lighting blocks in `scenario.json.erb` (744, 752, 1632, 1733, 1912, 2055, 2128), the countdown's `spriteVariants` and `textVariants` (2014-2027), and the four tour logs. I looked at every still in `lighting_c4/{base,armed,expired,saved}/` myself, diffed each against the same shot in `lighting_c3/`, set them against the unlit `dressing_c4/`, and measured regions with PIL. Positions are pixels on the 1400x1000 stills (2x zoom).

## Summary

Cycle 4 changed one block: the two room lights under the ends of the ops-floor video wall (`#ff9020`, r 52, 0.55, y 2.25) and their armed variant (`#ff6a10`, r 52, 0.65). The config in the file matches the plan. The `--check` lines give ops `variant=0` in armed and expired and `-1` in base and saved; every other room is `-1`. Outside the ops floor, every c4 shot matches c3 apart from LED blinks, breathe phases, sprite idle frames and the ATS-1 blink.

The wall now lights the floor across its whole width. The c3 scan showed three lobes with dips of 79 between them; c4 reads a flat 89-91 from x 600 to x 940 with the centre emitter's hump on top. In the crop it looks like one warm band under the screens, which was the aim of c2 m1.

One thing the c3 target missed: room `lights` draw into the MULTIPLY light map, so the most they can do is return the floor to its unlit colour. The unlit floor under the wall is (90, 104, 133). The c4 ends measure (90, 99, 109): red is at its ceiling of 90, and the warmth comes from blue held down by 24. "R 95 or more" could not be reached with a room light, and 90 is the best possible. Only `above` emitters and `floorTint` add light over the art, which is why the centre can reach 145. I count c3 m1 as closed on what it set out to do.

The armed step at the ends is still small (G −4, B −3) because red has nowhere to go. That is the one improvement left that I would still call worth doing, and it is minor. Nothing the player must find or read is hidden in any state, and no light claims something the player hasn't been told or the lit prop doesn't show.

## Cycle 3 findings

| id | sev | finding | fix applied | status | evidence |
|---|---|---|---|---|---|
| m1 | minor | Wall-end lights too weak and neutral; three lobes, not a band | `#ff9020`, r 52, 0.55, y 2.25 (`:1644-1647`) | **Closed** | Ends (615-660 / 880-925, y 330-380) base (90, 99, 109) both, from c3 (83, 88, 107). The dips are gone: scan along y 335-375, x 600-720 reads 83, 90, 89, 90, 90, 89, 100. The rim (610-925, y 200-222) is 138 in all four states, inside 137-141. Monitor tops (460-590 / 780-910, y 410-430) are (40, 55, 69) and (46-48, 59-60, 57), within 2 of c3. R 95 was not reached and cannot be: 90 is the unlit floor's red, the ceiling for a room light (see summary) |
| m2 | minor | While the clock runs the ends barely change | Armed variant `#ff6a10`, r 52, 0.65 (`:1648-1653`) | **Closed in part** | Left end base (90, 99, 109), armed (90, 95, 106), expired (90, 95, 106), saved back to (90, 99, 109). The variant resolves and the colour moves the right way, but by 3-4 points, not the "R up about 10" c3 asked for (red is capped). In the side-by-side crop the armed band does look a little more orange, mostly from the centre's breathe. Follow-up: m1 below |

Earlier cycles: cycle 1 M1, M2, m1-m3, m5-m7 and cycle 2 m1, m2 stay closed (rim, countdown faces, mimic lamps, no red on the wall in expired). Cycle 1 m4 (ATS-1 blink): the c4 dark saved still caught the off phase (lamp max (53, 39, 15)), the lit `-b` still shows it on (213, 167, 61). Together with c2's on-phase still, the blink is confirmed.

## Findings

### Blocker

None.

### Major

None.

### Minor

**m1. The ends still follow the clock only faintly, because the base lights already push red to its ceiling.**
Evidence: ends base (90, 99, 109), armed (90, 95, 106). The light map at the ends is about (1.00, 0.95, 0.82) in base. `#ff6a10` at 0.65 adds about the same green (+0.27 against +0.31) as the base light does, so the armed map only drops green by about 4%. The armed change on the ops floor is still carried by the centre emitter (r 60, breathe, floorTint 0.45) and by the flag-3 screen that covers the switch.
Fix (optional, config only, the variant at `:1648-1653`): make the armed light redder so it adds less green and blue, leaving red at its cap:

```json
{ "x": 4.2, "y": 2.25, "color": "#ff4a10", "radius": 52, "intensity": 0.7 },
{ "x": 7.9, "y": 2.25, "color": "#ff4a10", "radius": 52, "intensity": 0.7 }
```

By the same arithmetic that should give about (90, 91, 102) at the ends, a step of G −8 and B −7 from base, and it stays on the orange side of the wall's own armed glow (`#ff7a1a`). Don't go to `#ff3000` or redder: that starts to read as the red the board doesn't show (L1). Re-shoot ops in armed only, check the end G drops 6 or more against base, and that the rim stays at 137-141. If the orchestrator would rather close now, leaving it as it is costs little.

**m2. Step 6 records are not written yet.**
Evidence: `LIGHTING_PLAN.md` section 7 stops at cycle 3's table (no cycle 4 heading or outcome), and `docs/agents/LIGHTING_LOG.md` has no m07 section (`grep m07` finds nothing). The skill's step 6 asks for both, and the mood table in `SKILL.md` gains nothing new (m07 uses the night `#b8bfce`).
Fix: add the cycle 4 entry (games 2464-2467, this review's counts and outcomes), then an m07 section in `LIGHTING_LOG.md` with the room modes from plan section 3, the phase table from section 2, and these lessons:
- A room `light` sits in the MULTIPLY light map, so it can only bring the art back up to its unlit colour. On a blue lit ambient it reads warm only by holding blue down. To brighten past the art, use an emitter with `above` and `floorTint`.
- Under that ceiling, a room-light variant changes colour through green and blue only. Pick the variant's colour by what it adds to G and B, not by its hue.
- A sprite face per state (`spriteVariants` in the `textVariants` order) is what lets a screen's light change with the story without claiming something the face doesn't show (c1 M2).
- A light on a wall of screens needs room lights under its ends, or it lights the floor as one spot (c2 m1).

## Checked and fine (every room, every state)

- **Security checkpoint** (base): front of house, a touch cooler than unlit; counter, badge printer, visitor log, signs and the evacuation board all clear. The diff with c3 sits only on the ops floor's part of the frame and the sprites. The new end lights don't bleed west through the wall (24 changed pixels in the checkpoint region of the ops shot, all sprite noise).
- **Operations floor**, all four states: one warm band under the screens with the centre brightest; no bloom over the rim (138 in every state, unlit rim 207 is the wall face). The plant key and handover sheet sit in the supervisor laptop's pool, (118, 125, 138) in every state. Desks and screens read. Saved returns to the start look (centre (120, 113, 107), ends (90, 99, 109)), which is right because the board still shows the remote-session incident. In expired the floor looks like armed; that is L1's choice and the lighting is right not to claim the red the board doesn't show.
- **SCADA control**, all four states: unchanged from c3 within breathe phase (the armed still caught a trough: glow above the console (91, 59, 70) against c3's peak (113, 67, 77); expired (113, 67, 77)). Faces read LOADED / ARMED / RUNNING / ABORTED in textVariants order. Rim 155-157 in every state, no red over it. Mimic lamps all read; grey haze in expired (mimic (118, 120, 126) against (118, 124, 126)) matches "One region of the map has gone grey". The cascade control screen goes green in saved. The signed projection on the desk beside Mercer is clear in every state.
- **Server room** (base, Elena present so lit): cool, rack-4 note and the sign readable, suppression panel steady.
- **Generator hall**: dark navy with the genset panel, ATS lamp and battery-rack LEDs as markers, the west door findable, the plant log clipboard visible as a shape. Strikes to a clean lit hall with clipboard, ATS plate and genset labels readable. Saved state shows the amber fault lamp in place of the green one, matching the object text.
- **Cable vault**: cool green-grey, splice lamp and gas detector read, the printout clear on the trestle. The flicker is in a room whose reading and talk happen in overlays.
- **Rules**: no new flashing effects; the only blink is ATS-1's fault lamp, which is gated on the same condition as its text and is a 1 Hz small-area lamp. No puzzle depends on the lighting. No engine change this cycle.

## Notes (not counted)

- SCADA (`#aaa4b6`) and ops (`#aab0c2`) sit at or just under the skill's muddy line in green and blue (`#a8b0c0`). With `panels: false` and the screens as the light, the art still reads in every shot, so I'd keep them; it was a deliberate call in cycle 1 and none of the reviews found muddiness.
- Redraw ages in `--check` are 300-367 ms, one sample per room, the same as earlier cycles; the phase glows and faces rendered, so the shots are valid.
- ATS-1's blink uses `above` + `blink`, which m06 logged as reading "interact here". Here it is literal (the text says the lamp is blinking amber) and points at an object the player does need, so it fits.
- L1 is still open with the orchestrator. If Option A is taken, add a first ops variant for `countdown_expired && !grid_saved` with red end lights and turn the wall's expired emitter red, then re-shoot ops in expired.

## Counts and verdict

Blockers 0, majors 0, minors 2 (m1 optional polish, m2 housekeeping). Cycle 3: m1 closed (its R 95 target was out of reach of a room light; the band it was after is there); m2 closed in part, carried as m1 above.

Verdict: nothing above minor remains, so the lighting stage can close once m2's records are written and the separate browser check confirms that the variants and phase glows come back after a reload. m1 is a two-line config change and one armed re-shoot, worth doing if there is a spare turn, but not needed to close.
