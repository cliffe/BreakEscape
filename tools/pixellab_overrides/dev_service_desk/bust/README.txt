Dev (dev_service_desk) is bust-only, so no `import` rebuilds these files and the drift audit
does not cover them. They are reference copies of the hand-edited live assets
(public/break_escape/assets/characters/dev_service_desk_{talk_init,talk,visemes}.png).

2026-10-23 eye whites: the four eye pixels at (61,17) (63,17) (70,17) were 7c9cbb and (72,17)
was 6c89a7 (shirt blue). They are now e6dfd8, and d4cac2 for the shaded (72,17). Same offsets in
every 128px frame: talk_init, all 4 talk frames, visemes 0-5. The blink frame (viseme 6) and the
32px headshot had no blue eye pixels and are unchanged.

If `pixellab_pipeline.py pick dev_service_desk ...` or `visemes --from-talk` reinstalls any of
these, reapply the same recolour (or copy these files back).
