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

---

# Agent B — walk sprites for ama_owusu, lorna_easton, yusuf_demir, zainab_hussain (2026-11-03)

My 4 hosts only (ama, lorna, yusuf, zainab). All DONE, imported and committed. Nothing left to do.

Per host (stage 3 character --variants 2 -> pick -> stage 4 animate -> qa -> stage 6 import):

- lorna_easton: picked c02 (character ccf1e354-4b1a-4252-a41b-7341bf74e054; brighter on-model blonde, clean maroon jacket/grey top/lanyard). qa clean (walk + idle), combat FACING flags were false positives / stock-template back-recoils. No overrides. Committed 211d81f00.
- zainab_hussain: picked c01 (f38987a8-6de9-4e8b-b1f1-84a96ff5f5fd; consistent teal hijab, white ID lanyard, tool-belt pouch). animate needed one backfill (4 breathing-idle dirs). qa clean. No overrides. Committed 031524462.
- yusuf_demir: picked c01 (97cf73a0-aa09-479b-ab4d-57d3111381ae; clear blue lanyard+white ID, beard, olive sweater). REPAIRED breathing-idle south frame_002 (flipped to back view) via `fix yusuf_demir breathing-idle south 2 --use frame:1`; override committed. Committed 1233bdaf7.
- ama_owusu: picked c01 (c1eb7a48-8af5-4eac-8a00-bec01a6a06e0; fuller afro, glasses, gold lanyard). animate needed one backfill. REPAIRED walk north-east (gold lanyard smeared into a yellow back/arm panel) via `fix ama_owusu walk north-east all --use mirror` (6 override frames from clean NW); committed. Committed 5f8016744.

Shared files: each commit staged only my hunk of tools/pixellab_characters.json (via `git apply --cached` of my hunk) plus my asset/override files. game.js preload was NOT modified by import for these keys. Imports run under flock on the shared lock; no conflicts with Agent A's concurrent commits (delphine/nilesh landed between mine).

Generations: ~270-280 of my share (shared-account balance went 10000 -> 9470 across both agents).
Contact sheet (8 idle dirs + walk-south strip per host): /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/hosts_contact.png
Sprites NOT wired into any scenario (as instructed).
