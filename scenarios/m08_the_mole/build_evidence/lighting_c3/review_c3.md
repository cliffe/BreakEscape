# m08 lighting, cycle 3: review

Fresh read-only reviewer, 2026-10-14. Inputs: the ten `lighting` blocks (`scenario.json.erb:542`, `548`, `1342`, `1473`, `1601`, `1725`, `1795`, `1856`, `1965-1990`, `2097`), `DECISIONS_PENDING.md` L1 and E14, every PNG in `lighting_c3/{base,named,confront,after,triple}` and the five logs, the c2 shots (pixel diff), and `dressing_c5/<room>-a.png` (unlit, same framing). Screen px are in the 1400x1000 shots, room at 2x. The logs show every shot redrawing (300-333 ms). Variants are as expected: base and named -1 (suite `off`, motion), confront 0 (#8c929e), after and triple 1 (#c0c4cc).

## Cycle 2 closure

| c2 | status | evidence (c3) |
|---|---|---|
| n1 evidence-wall glow on the middle card | **Closed.** | Entry deleted. Card means L / M / R: dark `base-a` (4,5,13) for all three (c2: M 35,48,79 against 4,7,16), lit `base-b` (44,54,75) for all three (c2: M 66,84,115). Unlit (59,70,94) for all three. The diff against c2 is confined to the card strip (bbox 572-748, y ≤ 304). |
| n2 RECORDING glow | **Trimmed as asked; the remainder rides on L1.** | r 26 / 1.0 / offsetY 5 (`erb:1971`). Rim (568,214): (201,154,164), was (225,158,167) in c2, (190,194,202) unlit. Centre letters (255,142,139). The box ends stay off and darker than unlit: (41,13,16) against (56,17,21). Case-file top (560,258) still red: (100,31,40) against (12,18,32). That spill is post-naming, so no deduction issue. The crypto-lab bleed is gone: floor (567,708) is (161,177,204) in both confront and named (c2 +9 R). The tallies still read. The real fix is still L1 (lamp as a scenario object with `spriteVariants` to `hq_recording_on1`). |
| n3 no-op `darkAmbient` | **Closed.** | Line removed from the suite block. The only remaining `darkAmbient`s are `#0a0f1c` (servers) and `#121828` (archives), neither of which is the default. |

Carried, not lighting-stage work: c1 m5 door sign "Interrogation -- Recording In Progress" (`erb:1995`, user, with L1); m9 `hq_rack1` LEDs (E14, open); m10 `LIGHTING_PLAN.md` and the m08 `LIGHTING_LOG.md` entry (neither exists yet; due at close).

## New findings

| id | room | sev | evidence | fix |
|---|---|---|---|---|
| — | — | — | None. | — |

**Counts: 0 blockers, 0 majors, 0 minors.** Open elsewhere: L1 (with m5), E14, m10.

## Whole-mission check (fresh eyes)

- **Each room reads as itself, at night.** Interior luma lit/unlit (base-a against dressing_c5): lobby 59/65, director 52/67 (warm lamp pool, the darkest "on" room: an office at night), ops 91/98, intel 66/73, crypto 152/167, break 113/124 (warm `#ccc4b8`, staff room). Server room dark 21 (racks, LEDs and both terminals carry it; the west reader LED marks the door), archives dark 17, suite dark 13. The lit rooms differ by art and ambient: navy lobby with the red LEVEL RED board breathing, blue ops floor with the red INVESTIGATION board, the intel room's screen wall, a pale crypto lab, a warm wood director's office, a warm break room. Level Red is told twice (lobby board, ops board) through faces that already say it. The rooms the player breaks into strike on entry: servers, archives, suite.
- **The suite's four states read.**
  - Before naming (`base-a`): dark and empty. The decoration laptop at 0.3 is the only glow; the cards are even.
  - Named (`named-a/-b`): still motion and dark, still empty. Wall face "0X47 PENDING", disposition blank.
  - Confrontation: lit from load (variant 0, `mode: on`), panels off, a white pool on Nightshade (face luma 129 = floor beside him 129; open floor 77). RECORDING lamp and two steady tallies red. Wall CONCLUSIVE, disposition AWAITING.
  - After: plain lit room at #c0c4cc, tallies and lamp off. Faces HANDOVER (`after/`) and RETAINED (`triple/`). That is the only difference between the two, which is correct.
- **Deduction rule.**
  - Break room pixel-identical to c2 (mean diff 0.00). Locker lit/unlit ratios a 0.859, **b 0.843**, c 0.838: nothing singles out `hq_locker_b1`.
  - Crypto lab: the west desk (pc5) region 1.02, east laptop desk 1.00, back-wall PC 1.11, floor 0.88-0.96. No change at naming (named vs base within 1 luma). The only crypto emitter is the badge reader.
  - The confrontation pool, the tallies and the lamp are all keyed on `mole_identified && all_flags_submitted`.
- **Flash safety.** Unchanged. No flicker, no pulses (suppression panel `effect: null`), one `breathe` (lobby alert screen), the rack `blink` is the non-`above` shimmer, and room variants change once with no strike.
- **No-op config.** None left. `fire_alarm_point` `intensity: 0` switches off a real `EMITTERS` match (`lighting.js:149`). `suppression_panel` overrides its built-in pulse. The suite's `laptop` entry dims a real match.
- **Tour validity.** All shots redraw. Diffs against c2 elsewhere are NPC movement and rack blink: server-room-a mean diff 1.92, all within the rack rows.

## Noticed, not lighting (for the orchestrator)

- `after/` and `triple/` still show Nightshade standing at the table after the fate. Globals are set from the console, so this may be a tour artefact. Confirm in play whether he should leave (arrested, handover) or stay (retained) before the lobby debrief.
- `confront/cryptography_lab-a.png` shows both Nightshade copies at once. This is the known tour artefact (no events fire from console globals).
- `db/seeds.rb` and `lib.sh` are in the working tree and have nothing to do with lighting. Keep them out of the lighting commit.
