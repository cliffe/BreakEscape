# Anjali Rao visemes, 2026-11-24

Replaces the row-shift fix (2bd5f8e9b, `apply_row_shifts.py`, owner found it still glitchy). Same recipe as Kevin Park (`b25aafe58`): `teeth`, `small_open`, `medium_open` and `wide_open` are new, made by editing the 128 px rest frame with PixelLab `inpaint_image_pro_flash` inside a rectangle mask over the mouth. `round` and `blink` are kept from the previous sheet (round sits within half a pixel of the rest mouth centre and differs from rest only in rows 26-35, inside the mask).

- Mask: x52-70, y25-37 inclusive (19x13) at 128 px. Rest mouth corners x57/x64 on row 27, lips x59-62 on row 28; the nose is above row 25.
- 11 calls, 1 image each, 6 generations each = 66 generations (balance 1809.75 before, 1743.75 after). Source uploaded once (`upload:` ref) so each call only sends a prompt, mask and seed.
- `before_sheet.png/.json`: the sheet before the row-shift commit (source of rest, round, blink).
- `rest.png`: rest frame sent to PixelLab.
- `candidates/`: raw outputs (full 128 px frames; only the mask is used). Names are `<shape>_s<seed>`. Pro Flash paints transparent areas white or skin, so `apply_visemes.py` pastes only where rest is opaque.
- `apply_visemes.py`: rebuilds `public/break_escape/assets/characters/anjali_rao_visemes.png` and `.json`, and prints the outside-mask check (0 differing pixels in every mouth frame).
- `make_strips.py`: x10 review strips (`contact`, `final`). `strips/`: round1/round2 contact sheets (x10), `mouth_zoom_x16.png` and `small_zoom_x16.png` (mask area at x16), `strip_all_x10.png` (final sheet), `strip_rest_viseme_rest_x10.png`.

## Picks
teeth `teeth_s12`, small_open `small_s23`, medium_open `med_s32`, wide_open `wide_s43`.

## Calls (prompt gist, seed)
- teeth: "eh, row of white upper teeth, lips parted" (11); "f sound, white upper teeth biting the lower lip" (12, picked).
- small: "slightly parted, thin dark gap, hint of upper teeth" (21, 22); "one pixel dark gap, no teeth" (23, picked); "barely parted, tiny hint of teeth" (24).
- medium: "relaxed ah, twice the height of closed lips, upper teeth visible" (31); "about three pixels tall" (32, picked).
- wide: "wide ah, tall open mouth" (41, rejected: mouth ran down to the chin); "oh, about four pixels tall" (42); "ah, five pixels tall, as wide as the lips" (43, picked).
No candidate had off-palette (bluish) pixels.

## Owner change, 24 Nov
wide_s43 was too wide. `round` is now candidate `wide_s42`, and `wide_open` is the earlier sheet's round frame (kept, darker). No new generations. apply_visemes.py: PICKS round=wide_s42, FROM_BEFORE wide_open=round. Out-of-mask check is 0 for every mouth frame.
