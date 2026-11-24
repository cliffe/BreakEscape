# Ray Hollis visemes

Method (owner, 2026-11-24, as for Netherton): every mouth frame is a PixelLab inpaint of the
rest frame (`rest.png`, 128x128, the old sheet's column 0, identical to `ray_hollis_talk_init.png`)
through a rectangular mask at x 64-74, y 24-31 (11x8: the lips and goatee, below the
moustache row). Pixels outside the mask are the rest frame's own. The face edge runs through
the mask's right side, so `build_sheet.py` also clips each paste to rest's opaque pixels: the
silhouette never changes.

- `cands/<shape>_s<seed>.png`: raw PixelLab outputs (MCP `inpaint_image`, 10 generations each).
- `build_sheet.py`: pastes the picked candidate's mask area onto rest and writes
  `public/break_escape/assets/characters/ray_hollis_visemes.png`. Picks are listed in it and
  in the sheet's json.
- `blink_frame.png`: the blink, kept from the earlier sheet (eyes only, y 14-18).

A re-import must rebuild with `build_sheet.py`, not overwrite the sheet.
`closed` (m b p) is not made; the engine falls back to `rest`.
Replaces the earlier talk-run composite (commit 80f99cab5), whose upper face shifted between frames.
- `contact_final.png`: face close-ups (8x) and full frames (3x) of the built sheet, for review.
