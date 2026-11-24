# Netherton visemes

Method (owner, 2026-11-24): every mouth frame is a PixelLab inpaint of the rest frame
(`rest.png`, 128x128) through `mask.png` (x 57-72, y 32-40, the lips and chin top).
Pixels outside the mask are the rest frame's own.

- `cands/<shape>_s<seed>.png`: raw PixelLab outputs (inpaint_image, seeds 12-13, 21-23, 31-33, 41-42, 51-52). wide_open_s11 failed on a policy error and was not kept.
- `build_sheet.py`: pastes the picked candidate's mask area onto rest and writes `public/break_escape/assets/characters/netherton_visemes.png`. Picks are listed in it and in the sheet's json.
- `blink_frame.png`: the blink, kept from the earlier sheet.
- `strip_*.png`: 10x face strips used for review.
- `apply_row_shifts.py`: the superseded row-shift fix, kept for history.

A re-import must rebuild with `build_sheet.py`, not overwrite the sheet.
`closed` (m b p) is not made; the engine falls back to `rest`.
