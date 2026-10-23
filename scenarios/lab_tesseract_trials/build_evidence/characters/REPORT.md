# Keyholder Trials staff: PixelLab character build

Four lecturers built with `tools/pixellab_pipeline.py` from the user-approved concepts (2026-10-06). Work files: `tmp/pixellab/<name>/`; frame overrides: `tools/pixellab_overrides/<key>/`. Boxes are in 128px bust coordinates (`x0,y0,x1,y1`; talk `--mouth` = `cx,cy,rx,ry`). Written by the orchestrator from the art agent's report.

## Wiring (done 2026-10-06)

| NPC (scenario id) | spriteSheet | spriteTalk / spriteVisemes / avatar |
|---|---|---|
| Dr Cliffe Schreuders (`cliffe_schreuders`, `cliffe_workshop`) | `cliffe_schreuders` | `assets/characters/cliffe_schreuders_{talk,visemes,headshot}.png` |
| Dr Tom Shaw (`tom_shaw`) | `tom_shaw` | `assets/characters/tom_shaw_{talk,visemes,headshot}.png` |
| Dr Sidhu Selvarajan (`sidhu_selvarajan`) | `sidhu_selvarajan` | `assets/characters/sidhu_selvarajan_{talk,visemes,headshot}.png` |
| Dr Oleg Illiashenko (`oleg_illiashenko`) | `oleg_illiashenko` | `assets/characters/oleg_illiashenko_{talk,visemes,headshot}.png` |

All four atlases are registered in `game.js` ("PixelLab API imports") and recorded in `tools/pixellab_characters.json`. Every portrait faces right.

## Generations

| Character | First pass | Bust redo (user picks) | Total |
|---|---|---|---|
| Cliffe Schreuders | 134 | 46 | 180 |
| Tom Shaw | 128 | 58 | 186 |
| Sidhu Selvarajan | 124 | none | 124 |
| Oleg Illiashenko | 122 | 52 | 174 |
| **Total** | **508** | **156** | **664** |

Balance 4888 → 4224. Cliffe's walk character failed three times (server error 5000, not charged).

## Picks

| Character | Bust | Talk | Visemes | Walk character |
|---|---|---|---|---|
| Cliffe | b01 (user) | t03 frames 2,4,7; face `60,25,80,40`, mouth `69,30,5.5,3` | mouth `63,27,76,32`, eyes `60,18,82,23`; base i03, teeth from i04 | c04 `6006155e-74f3-487c-847e-aec2dfa41512` (simplified description) |
| Tom | b02 (user) | t03 frames 1,4,6; face `54,25,72,38`, mouth `63,29,5.5,3` | mouth `58,27,69,31`, eyes `52,17,74,22`; base i03, small_open i04, round i05 | c01 `e0906801-40c7-4260-a098-c95dac9cdddc` |
| Sidhu | b04, mirrored to face right | built from viseme shapes i01 medium_open, round, teeth; face `62,33,80,46` | mouth `65,35,76,40`, eyes `57,26,78,30`; base i01, small_open i02 | c01 `683d2a03-378d-4e03-acf2-3f97b07741b5` |
| Oleg | b02 (user) | t03 frames 1,3,6; face `56,24,72,31`, mouth `64,27,5,2.5` | mouth `59,25,70,30`, eyes `54,16,76,21`; base i03, blink i05 | c01 `6bddfcaa-7589-4411-88b1-b2aaee551c0c` |

## QA fixes (summary)

- **Cliffe:** idle S and NE re-rolled; cross-punch N re-rolled (keeps the jacket), NW mirrored from NE, E mirrored from W; lead-jab N re-rolled + frame copy, NW mirrored; taking-punch N re-rolled, NW mirrored. Left: cross-punch N frames 3-4 turn to camera; blue tee shows more than the jumper in the N/NE/NW falls and the S taking-punch.
- **Tom:** walk SE mirrored from SW; cross-punch and taking-punch NW mirrored; taking-punch S and N re-rolled; fall NE mirrored from NW.
- **Sidhu:** the approved concept faces left (the raw render faced right and the reframe flipped it), so bust and talk frames were mirrored (originals in `tmp/pixellab/sidhu_selvarajan/replaced/leftfacing/`). The PixelLab character's east rotation shows a different man, so all six east animations are mirrored from west (`qa` keeps flagging east against that rotation). Idle S re-rolled (t04), idle NW frame copy, taking-punch NW mirrored, fall W re-rolled then east re-mirrored.
- **Oleg:** idle NE frame copies; cross-punch N re-rolled, NW mirrored; lead-jab N frame copy, NW mirrored; taking-punch NW mirrored; fall S re-rolled. Left: a faint yellow belt band on cross-punch E/W (only a 20-generation AI edit would fix it).
- **All:** the taking-punch S recoil turns sideways (stock template).

## Process notes

- Don't run two state-writing pipeline commands (bust, talk, visemes, character, pick) on one character at once: they overwrite each other's state.json (lost i02 records were rebuilt by hand, marked with a `note`).
- Not deleted from the PixelLab account (the skill forbids it): Cliffe's failed walk characters `568d58ca-1b43-41d4-bb37-ac2a2a769277`, `d7a8d498-9bb7-4d65-ab52-7c8ef7a9d483`, `c1086da2-65cb-408c-a7d6-67e9bd9de9f7`.

## Evidence here

`<name>_bust_candidates.png`, `<name>_talk_sheet.png`, `<name>_visemes_closeup.png`, one QA sheet per character, and `superseded/` (the b04 busts, talk and viseme sheets replaced after the user's picks).
