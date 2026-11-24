# Kevin Park visemes, 2026-11-24

Teeth added to `teeth`, `small_open`, `medium_open` and `wide_open` by editing the rest frame with PixelLab `inpaint_image_pro_flash` (rectangle mask x58-77, y30-40 at 128px, 6 generations per call, 13 calls, about 78 generations). `round` and `blink` are the previous sheet's frames.

- `before_sheet.png/.json`: the sheet before this change (source for round, blink and rest).
- `rest.png`: the rest frame sent to PixelLab.
- `candidates/`: raw PixelLab outputs (full 128px frames; only the mask is used). Picks: teeth_s43, small_s51, med_s31, wide_s62.
- `apply_visemes.py`: rebuilds `assets/characters/kevin_park_visemes.png`. Pastes each pick onto rest inside the mask, opaque pixels only (Pro Flash paints transparent areas white).
- `strips/`: x10 review strips and contact sheets.

Prompts: shape-specific ("mouth saying eh ... edge of upper teeth", "f sound, bright white upper teeth biting the lower lip", "slightly parted ... hint of upper teeth", "relaxed ah, twice the height of closed lips, upper teeth visible").
