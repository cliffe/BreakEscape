# m08 lighting, cycle 2: review

Fresh read-only reviewer, 2026-10-14. Inputs: the ten `lighting` blocks (`scenario.json.erb:542`, `548`, `1342`, `1473`, `1601`, `1725`, `1795`, `1856`, `1965-1988`, `2099`), the `make_hq_props.py` and `DECISIONS_PENDING.md` diffs, every PNG in `lighting_c2/{base,confront,after,triple}` and the four `.log` files, the matching c1 shots and `dressing_c5/interrogation_room-a.png` (unlit, same framing). Screen px are in the 1400x1000 shots, room at 2x. The logs show every shot redrawing (300-333 ms), with variants as expected: base -1, confront 0 (#8c929e), after and triple 1 (#c0c4cc).

## Cycle 1 closure

| c1 | status | evidence (c2) |
|---|---|---|
| M1 RECORDING lamp | **Interim acceptable, carried as L1; now minor (n2).** | The glow is centred on the box now: red-excess centroid y 240 against box y 228-245 (c1: 236). Letters in the middle go to (255,135,133) and the box ground there to (149-206,27,27), so the centre reads lit. The ends stay off. Box at x 522 = (47,13,16) and x 612 = (46,13,16) are *darker* than unlit (56,17,21), because the variant ambient drops, and the outer letters are (165,107,112). The wall rim above still turns pink: (568,214) = (225,158,167) against (190,194,202) in `after/`. Red reaches the top of the case-file screen: (560,258) = (105,33,41) against (12,19,33). It reads as a red light on the middle of a sign, not a lit sign. The tallies do work, steady and only in confront: camera (890,448) = (183,64,59) against (48,51,58), recorder (712,524) = (187,83,82) against (49,52,61). Together with Nightshade at the table, they carry "recording" well enough until L1 is decided. The crypto-lab bleed grew slightly: floor (567,708) is (170,178,206) against (161,177,203), +9 R (c1 +1). It's invisible at play scale. |
| M2 pool misses Nightshade | **Closed.** | Light at y 4.7, r 104 (`erb:1985`). Luma in confront: face 126 (c1 89), coat 141 (c1 92), floor beside him 117, open floor 77, table top 76 (c1 75). The face is above the pool floor, which was the target. The pool now centres on the subject, and the table and the player's chair sit at its lower edge. That works as staging. |
| m1 laptop | Closed. | Base-b: screen (109,131,197) (c1 125,152,218), desk top (173,116,77) against unlit (175,115,73) (c1 187,130,91). Confront: laptop luma 67 (c1 158), dark. The `laptop` prefix key matches only the one map laptop in the room. |
| m2 evidence-wall glow | **Moved, new problem (n1).** | The skirting smudge is gone: strip below (59,60,61), no blue cast. The glow now lands on the middle suspect card only (see n1). |
| m3 disposition glow | Closed. | Entry removed. The faces read in after/triple (HANDOVER, RETAINED). |
| m4 recording fallback | Closed. | Removed. |
| m5 door_sign | Open, deferred to user (L1 note). | `erb:1993` is still "Interrogation -- Recording In Progress". |
| m6 director window | Closed. | Removed (`erb:1342-1351`). |
| m7 director second light | Closed. | Removed. The desk lamp pool still reads (`base/director_office-a.png`). |
| m8 intel hq_console | Closed. | Removed. Only `threat_map` is left (`erb:1604`). |
| m9 hq_rack LEDs | Logged as E14. | `DECISIONS_PENDING.md` E14. The per-room `hq_rack` entry stays until the engine change lands. |
| m10 LIGHTING_PLAN / LOG | Open (due at close). | No `scenarios/m08_the_mole/LIGHTING_PLAN.md`, and no m08 entry in `LIGHTING_LOG.md`. |

## New findings

| id | room | sev | finding / evidence | fix |
|---|---|---|---|---|
| n1 | interrogation | minor | **The evidence-wall glow spotlights the middle of the three "?" suspect cards.** At r 24, offsetY 0 (`erb:1970`), a round glow on the 64x32 face peaks on the centre card. Card means, L / M / R: unlit `dressing_c5` (57,68,91) all three; `base-b` lit (44,54,75) / **(65,83,113)** / (44,54,76), ×1.5; `base-a` dark (4,6,15) / **(35,48,80)** / (4,6,16), ×8. In the dark, seen through the crypto-lab door, it is the only lit card. The cards are anonymous, so this carries no deduction, but it is emphasis on one suspect in a mole hunt, before the naming. Lit, it does nothing for the rest of the face: case-face ratio 0.91, floor 0.92. c1 had the same bias, weaker (dark M 16 against 5). | Delete the `hq_evidence_wall` emitter entry. The texture key matches no `EMITTERS` entry, so the wall then simply has no glow, and the room strikes on entry. |
| n2 | interrogation | minor | M1 remainder (see closure): lamp ends unlit, a pink rim above, red on the top of the case-file screen. | Real fix: L1 (scenario object + `spriteVariants` to `hq_recording_on1`, glow r 12 / 0.6 / offsetY 0). Until then, optional: radius 30→26, intensity 0.9→1.0. That trims the rim and the case-file spill. It doesn't fix the ends, which no single round glow can. |
| n3 | interrogation | minor | No-op config: `"darkAmbient": "#101424"` (`erb:1968`) equals the engine default `DEFAULT_DARK_AMBIENT` (`lighting.js` 0x101424). | Delete the line. |

Not lighting, for the orchestrator. `confront/cryptography_lab-a.png` still shows Nightshade in the lab and at the table at once. That is a tour artefact (globals set from the console, no events); check it in real play, as c1 noted. A large green circle with a vertical line over the break room (`base/break_room-a.png`, `base/cryptography_lab-a.png`) is an overlay, not the light map, and was identical in c1 (break-room diff 0). It looks like an NPC sight-cone debug draw, so confirm it doesn't render in normal play.

## Checked and passed

- **Deduction rule.** Break-room and crypto-lab configs are unchanged since c1. Break room is pixel-identical to c1 (mean diff 0.0), so the locker ratios (b 0.842 against a 0.857, c 0.837) hold. The crypto lab has only the badge reader entry, so pc5 still has only the built-in screen glow, the same as the other screens. The confrontation pool and tallies are keyed on `mole_identified`, so they come after the naming.
- **Story states.** Tally lights and the red lamp light only in variant 0 (`!fate_decided`) and are off in after and triple. The laptop is 0 in confront and 0.3 elsewhere. The disposition faces follow the textVariants order. The `fate_decided` variant keeps the room lit on reload.
- **Flash safety.** Nothing new animates. All new entries are `effect: null`. The only `breathe` is still the lobby alert screen.
- **Lit rooms.** Director, intel, ops, lobby, archives and servers look the same as c1 apart from NPC movement and rack blink. Director has the warm lamp pool only. Intel: threat-map light on Phantom's desk, no clue.

**Counts: 0 blockers, 0 majors, 3 minors** (n1-n3). Still open from c1: m5 (user, L1), m9 (E14), m10 (at close).
