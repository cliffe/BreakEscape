# Cyber Aware host art — PixelLab handover (agent A: gwen, nilesh, delphine, tomasz, zainab)

Date: 2026-11-02. My 5 hosts only. A second agent owns ama_owusu, lorna_easton, yusuf_demir — DO NOT touch those.

## What's done (all 5 of my hosts)

- Busts picked and installed (`<key>_talk_init.png`): gwen=b01, nilesh=b02, delphine=b02, tomasz=b03, zainab=b01. (committed in 1a80bdf28)
- Talk sheets generated (2 variants each, 4 gen/host) AND picked/built (`<key>_talk.png`):
  - gwen: `pick ... talk t02 --frames 2,4,8 --mouth 63,34,6,4`
  - nilesh: `talk t01 --frames 2,4,7 --mouth 65,33,6,4`
  - delphine: `talk t02 --frames 3,4,5 --mouth 65,28,6,4`
  - tomasz: `talk t01 --frames 2,5,8 --mouth 67,34,6,4`
  - zainab: `talk t02 --frames 2,3,6 --mouth 61,27,6,4`
- Viseme talk-frames generated for ALL 5 (`visemes --from-talk`, 15 gen/host = 75 gen). Contact sheets in `tmp/pixellab/<key>/visemes/talk_frames/contact_<shape>.png`.
- Blink inpaint generated for ALL 5 (`visemes --shapes blink`, i01) → `tmp/pixellab/<key>/visemes/i01/blink.png`.
  - delphine i01: both eyes closed, good. nilesh i01: reads closed behind glasses, frames kept, good. tomasz/zainab i01: NOT yet eyeballed — check close up before folding.
  - gwen: i01/i02/i03 ALL winked (far/right eye won't close on her 3/4 view, iris stays visible). Shipped WITHOUT a blink (`--blink none`). Post-reset fix: mirror the closed near-eye lid onto the far eye as an override, or try a few more seeds.
- IMPORTANT: a host's `_talk.png` fallback sheet is ALREADY BUILT on disk for all 5 (pick talk done). For the 4 remaining it is UNCOMMITTED — commit it alongside the visemes.

## Measured boxes (x0,y0,x1,y1) — reuse for --rebox/--blink, re-check on contact sheets

| host | mouth | eyes |
|---|---|---|
| gwen_pritchard | 57,30,70,37 | 49,21,72,27 |
| nilesh_solanki | 58,29,72,37 | 54,18,76,26 |
| delphine_arvanitis | 58,24,72,31 | 56,11,76,19 |
| tomasz_wisniewski | 60,30,74,37 | 56,14,80,22 |
| zainab_hussain | 55,24,68,30 | 51,16,70,23 |

## Per-host status

### gwen_pritchard — DONE & COMMITTED (talk + visemes, NO blink — see above)
Viseme pick: teeth=teeth_t02_f3, round=round_t03_f3, small_open=small_open_t02_f2, medium_open=medium_open_t02_f2, wide_open=wide_open_t03_f1 (--chin wide_open=3). Blink omitted (winked 3x).

### nilesh_solanki / delphine_arvanitis / tomasz_wisniewski / zainab_hussain — DONE & COMMITTED (talk + visemes + blink i01)
All four picked, blinks eyeballed close-up (all i01 good, no re-roll — 0 generations spent), sheets built with blink, JSON lists blink, committed (talk + visemes.png + visemes.json per host, explicit paths). Picks:
- nilesh: teeth=teeth_t01_f1, round=round_t01_f1, small_open=small_open_t01_f1, medium_open=medium_open_t01_f1, wide_open=wide_open_t03_f2 (--chin wide_open=3). Blink i01: eyes closed behind blue glasses, frames kept — good.
- delphine: teeth=teeth_t01_f1, round=round_t03_f2, small_open=small_open_t01_f1, medium_open=medium_open_t03_f2, wide_open=wide_open_t03_f1 (--chin wide_open=3). Blink i01: both eyes closed — good.
- tomasz: teeth=teeth_t03_f1, round=round_t02_f3, small_open=small_open_t03_f2, medium_open=medium_open_t03_f1, wide_open=wide_open_t01_f2 (--chin wide_open=3; avoided all "nose redrawn" frames — "upper lip moved" unavoidable with his moustache). Blink i01: both eyes closed, gold glasses frames kept — good.
- zainab: teeth=teeth_t03_f1, round=round_t02_f1, small_open=small_open_t03_f1, medium_open=medium_open_t01_f1, wide_open=wide_open_t01_f3 (--chin wide_open=3; all "ok" frames, eyes clear). Blink i01: both eyes closed, hijab/brows kept — good (no gwen-style wink).

<!-- superseded; original per-host instructions below kept for reference -->
Frames are generated; blink i01 generated. Next, per host:
1. Read the 5 contact sheets `tmp/pixellab/<key>/visemes/talk_frames/contact_<shape>.png`. Pick one frame per shape by eye (teeth=thin upper teeth on lip jaw closed; round=small forward rounded opening no teeth; small_open=lips just parted thin gap; medium_open=small dark opening, teeth edge; wide_open=chin drops ~2x, upper teeth). Favour frames with still/clear eyes.
2. Build + fold blink in one pick:
   `python3 tools/pixellab_pipeline.py pick <key> visemes talk --frames teeth=...,round=...,small_open=...,medium_open=...,wide_open=... --blink i01 [--chin wide_open=3 if the chosen wide_open frame drops the jaw]`
3. Check the blink close up (`tmp/pixellab/<key>/visemes/i01/blink.png` and the installed `<key>_visemes.png` blink cell): must sit exactly on the eyes, keep glasses/brows/skin, read as closed at 128px. If off, re-roll once: `visemes <key> --shapes blink --eyes <box>` → i02, then re-pick with --blink i02. (Bearded nilesh/tomasz: eyes are behind glasses — blink must keep the gold/blue frames.)
4. Commit (explicit paths, no globs, no attribution, don't push):
   `git commit -m "Cyber Aware host <Name>: lip-sync viseme sheet (talk frames + inpaint blink)" -- public/break_escape/assets/characters/<key>_talk.png public/break_escape/assets/characters/<key>_visemes.png public/break_escape/assets/characters/<key>_visemes.json`
   (nonpixelart/prompt/talk_init already committed in 1a80bdf28.)

## Still to do after the 2026-11-03 reset
- Walk sprites (stage 3 `character` + stage 4 `animate` + stage 6 `import`) for all 5 hosts. NOT started (do not run `character` now — it's 20-40 gen/host).
- Do NOT edit tools/pixellab_characters.json (coordinator reconciles it).
</content>
