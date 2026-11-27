# B4/B5 pre-flight, round r1 (no renders; frames pulled from takes with ffmpeg)

## Fixed in the edits (need re-render)
- ca17 16:9, "Can I?" cards (shots topic, card_1..card_5, about 14-19 s and the topic shot at ~10 s): panel sits at source y 0.34-0.66 (static, no slide) but cy was 0.285-0.296 at zoom 2, cutting the buttons. cy set to 0.5 (wide and narrow file). FIXED.
- ca17 9:16 and 1:1, same cards plus the bins shot (narrow file): panel is about 614 px wide in source, wider than the zoom 1.125 (9:16) and zoom 2 (1:1) windows (540 px), so "Can I?" and the side buttons were clipped. Now 9:16 zoom 0.5625 and 1:1 zoom 1, cy 0.5. Flat white button patches (masks) removed so Allowed / Not allowed / Ask first show. FIXED (panel is smaller in frame, black bars top and bottom in 9:16 are the dark room).
- ca19 16:9 closing walk shot (t07, ~5-11 s of take): the blonde walker's head was above the crop edge. cy 0.657 to 0.583 (wide and narrow file). Niamh caption area unchanged. 9:16 and 1:1 windows do not contain her (x 930+), so unchanged. FIXED.

## Not fixed in the edit (need owner call or a retake)
- All narrow episodes (ca11, ca16, ca18, ca19, ca20), 9:16 zoom 1.125 and 1:1 zoom 2: the narrow-panel takes have the "Security Awareness" window about 560 px wide, the view window is 540 px. Left edge ("ecurity Awareness"), tabs and "Close with X" clip in the Brief / Where it led / Defend / Debrief shots and in the "Later that ..." result panels (1:1 loses tab labels). Whole-number rule leaves only zoom 0.5625 / 1 (panel half the frame). Better fix: retake the narrow panel at 520 px or less.
- Same shots, captions sit over the result text ("Ransomware locked the machines..." ca19, "A reply brought pressure" ca16, "Three families complained" ca11, "The student behind read..." ca20), and over the email header ("Is this one real?" ca19 about 49 s). Caption is fixed-position; needs per-shot caption placement or a retake.
- Small choices panels (dark, "Choices" window) in 9:16 are about 65 percent of the frame width at zoom 1.125; zoom 1.6875 would fit but untested without a render. Not changed.
- ca17 inbox shots (12, 13) in 1:1 zoom 2: top header and right tab ("3 Review") clipped. Not changed.
- ca18 seam join into the open card (~3.6 s, 9:16/1:1): a white panel grows over the portrait while the card caption is already up; it is the designed seam, but the caption box over blank white reads as a ghost. Check the join in the re-render; no ghosting of text found at card cuts in the other episodes (frame-checked only ca18; others from contact sheets).
