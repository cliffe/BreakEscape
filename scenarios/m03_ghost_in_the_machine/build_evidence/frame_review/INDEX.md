# m03 cast frame repairs (2026-10-12)

Characters: `victoria_sterling`, `danny_foster`, `ffion_rees`, `terry_mott`. Every frame of every animation in all 8 directions was checked (4 x 256 = 1,024 frames) on zoomed sheets in `_review/` (`<key>_<anim>_N.png` / `_S.png` are the pre-fix sheets; `*_final.png` are after).

**Images.** Each changed frame has a 4x viewing copy here named `<key>_<anim>_<dir>_f<N>.png` (rotation | before | after). 182 frames changed: 92 by hand (mirror, copy, recolour), 90 by AI.

**Override file.** For every row the override is `tools/pixellab_overrides/<key>/<anim>/<dir>/frame_00N.png`, one file per frame. All 234 override frames for the four keys were checked pixel for pixel against the rebuilt atlases (`public/break_escape/assets/characters/<key>.png/.json`): no mismatches.

**How to revert one change.**
1. Delete its override file(s). Where the row says *replaced an earlier override*, copy the old file back from `_orig_overrides/<key>/<anim>/<dir>/` instead.
2. Rebuild with either `python3 tools/pixellab_pipeline.py import <key> --force` (re-downloads the ZIP and reapplies the remaining overrides; free) or by copying the frame back from `_orig_export/<key>/Idle/animations/<anim>/<dir>/` and running `import <key> --offline --force`. `fix` writes into the export folder too, so a bare `--offline` rebuild after deleting an override would keep the edited frame.
3. **Dependencies:** each NW row marked "mirror of AI NE" copies the NE row above it. If you reject that NE row, reject or redo the NW row with it.

Kept for comparison, not installed: rejected AI takes in `_ai_rejected/`, and reroll takes in `tmp/pixellab/_qa/<key>/reroll/` (every reroll repeated the turn to camera).

## Victoria Sterling

| Anim | Dir | Frames | What was wrong | What I did | Confidence |
|---|---|---|---|---|---|
| falling-back-death | north | f2-f6 | Turns to camera mid-fall: face and a bright red shirt. **The user's request.** | AI, `edit_with_reference` against the north rotation. Back of the head and long hair, navy suit, no red, poses kept. | High |
| falling-back-death | north-east | f0-f6 | f0-f1 side profile with red collar; f2-f6 face the camera with a bright red shirt. **The user's request.** | AI, `edit_with_text` (back three-quarter view, long dark hair, navy jacket, no red shirt or face). | High |
| falling-back-death | north-west | f0-f6 | f0 a full front view (face, red shirt, belt); f2-f6 face the camera with a red shirt. **The user's request.** | Mirror of AI NE (above). A reference-mode AI pass was tried first and failed (face kept); it is in `_ai_rejected/`. | High |
| falling-back-death | south-west | f0-f6 | f4 shows the back of her head and jacket; f0-f1 turned to a west profile. | Mirror of south-east (clean). | High |
| cross-punch | north | f0-f5 | Whole strip turned to a right profile with her face; f4 shows her front and shirt. | AI, `edit_with_text` (facing straight away). | High |
| cross-punch | north-east | f0-f5 | Profile face throughout; f4 front with shirt. | Mirror of north-west (clean back views). One gold collar pixel comes across from NW. | High |
| taking-punch | north-east | f0-f5 | Side profile with face and a red face/cuff patch on every frame. | AI, `edit_with_text`. f4's free arm is now extended rather than bent. | Medium-high |
| taking-punch | north-west | f0-f5 | Same as NE (it was an earlier mirror of NE). *Replaced an earlier override.* | Mirror of AI NE. | Medium-high |

## Danny Foster

| Anim | Dir | Frames | What was wrong | What I did | Confidence |
|---|---|---|---|---|---|
| falling-back-death | north | f2-f6 | Turns to camera: face, beard, white shirt, lanyard and red badge. | AI, `edit_with_text` (back of head, parka with hood, no lanyard). A reference-mode pass kept the face and is in `_ai_rejected/`. | High |
| falling-back-death | north-east | f0-f6 | f2-f6 face the camera with the lanyard and badge. | AI, `edit_with_text`. | High |
| falling-back-death | north-west | f0-f6 | Face and lanyard, f2-f6 (an earlier mirror of NE). *Replaced an earlier override.* | Mirror of AI NE. | High |
| cross-punch | north-east | f0-f5 | Profile face throughout; lanyard and shirt front on f3-f4. | AI, `edit_with_text`. | High |
| cross-punch | north-west | f0-f5 | Same (an earlier mirror of NE). *Replaced an earlier override.* | Mirror of AI NE. | High |
| taking-punch | north-east | f0-f5 | Profile face with blue lanyard on every frame. | AI, `edit_with_text`. | High |
| taking-punch | north-west | f0-f5 | Same (an earlier override). *Replaced an earlier override.* | Mirror of AI NE. | High |
| lead-jab | north | f0, f1 | Front lanyard strap and badge drawn on his back. | Hand recolour: the strap and badge pixels set to the surrounding parka green (`coatfill.py`, boxes in the script log). | High |
| lead-jab | north-west | f0 | Blue lanyard loop and badge on his back. | Hand recolour, the same way. The fill also removed part of the hood's collar line under the lanyard. | High |
| lead-jab | north-east | f0, f1, f2 | Small badge and strap on the parka's hem/side. | Hand recolour. On f2 a sleeve fold line is slightly softer. | Medium-high |

## Ffion Rees

| Anim | Dir | Frames | What was wrong | What I did | Confidence |
|---|---|---|---|---|---|
| falling-back-death | north | f2-f6 | Turns to camera: face, green shirt and tie. | AI, `edit_with_text`. The face is gone, but her hair reads as a round bun/disc rather than a ponytail on f4-f6 (her original f0-f3 already had a bun). A reference-mode pass kept the face and is in `_ai_rejected/`. | Medium |
| falling-back-death | north-east | f0-f6 | f2-f6 face the camera with the green tie and badge. | AI, `edit_with_text`. Ponytail kept. | High |
| falling-back-death | north-west | f0-f6 | Same (an earlier mirror of NE). *Replaced an earlier override.* | Mirror of AI NE. | High |
| cross-punch | north | f0-f5 | **Whole strip is a front view** (face, belt, shirt). | AI, `edit_with_text` (facing straight away). Back view, ponytail. | High |
| cross-punch | north-east | f0-f5 | Profile face; tie front on f3-f4. | AI, `edit_with_text`. | High |
| cross-punch | north-west | f0-f5 | Same (an earlier mirror of NE). *Replaced an earlier override.* | Mirror of AI NE. | High |
| taking-punch | north-east | f0-f5 | Profile face with green tie on f2-f5. | AI, `edit_with_text`. f2's arm is now raised higher (the QA hint flags f2 as FACING; on the sheet it reads as a back view). | Medium-high |
| taking-punch | north-west | f0-f5 | **Whole strip was a front view** (face, tie, badge). | Mirror of AI NE. I first mirrored the old NE; this replaced that. | High |
| taking-punch | south | f2, f3 | Back of her head and jacket in the middle of a front-facing strip. | Copy: f2 = f1, f3 = f4, so the recoil holds instead of flipping. Two AI tries were rejected: reference mode left the back view, and text mode gave a front view drawn larger and upright, so it jumped. Both are in `_ai_rejected/`. | Medium |
| lead-jab | north-west | f0-f2 | Back of her head over a shirt front with green tie and badge. | Mirror of north-east (clean back views). | High |

## Terry Mott

| Anim | Dir | Frames | What was wrong | What I did | Confidence |
|---|---|---|---|---|---|
| falling-back-death | north-west | f2-f6 | Turns to camera: face profile, and on f5-f6 his front and badge. | Mirror of north-east (his NE is a clean back-view fall). f0-f1 kept: they were fine back views, and mirrored NE starts were thinner side poses. | High |
| falling-back-death | south-west | f0-f6 | f2 shows the back of his jacket; f0-f1 a west profile; body turned away on f3-f4. | Mirror of south-east. The chest badge and radio swap sides. | Medium-high |
| cross-punch | north-west | f0-f4 | Back view, but the white chest badge (and belt buckle) drawn on his back. | Hand recolour of the badge/buckle pixels to the jacket navy (`recolour.py`). | High |
| cross-punch | north-east | f0-f5 | Profile face; f4 front with white shirt. | AI, `edit_with_text`. | High |
| taking-punch | north-east | f0-f5 | Profile face throughout. | AI, `edit_with_text`. Only a small gain: a sliver of face still shows on f4-f5. Fine to reject. | Medium |

## Looked at and left alone

- Danny and Ffion `falling-back-death` south-west f0-f1: they start in a west profile (a 90-degree turn, not a front/back flip), and the rest of the strip faces correctly.
- Victoria `breathing-idle` north: red cuffs (colour, not facing). Victoria `falling-back-death` north f0: a red speck by her head.
- Ffion's north lead-jab and taking-punch: short hair or a bun instead of the ponytail (missing detail, not a flip).
- Terry `lead-jab` north-west: a few cyan pixels at the shoulder. Danny `walk` NE/NW: belt visible under the parka.
- Victoria `walk` west: the QA FACING hints are on the earlier agent's override; that strip looks right.
- Punch north strips for Danny, Terry and Victoria's lead-jab: the slight turn to the punching side is the stock template pattern the skill says to leave.
