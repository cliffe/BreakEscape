# m09 office-life plan review, round 3

Reviewer tier: planning (fresh, read-only). Plan reviewed: PLAN.md round 2 (commit b3273406d).

**Counts: B=0 M=1 m=5**

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | major | L8's gap after the debrief closes: the duck lifts up to 250 ms later, the rise takes 300 ms, and the visualiser pauses the scene and fades the hum from wherever it reached (`music/bond-visualiser.js:1856`, `:1863`), so "the full 0.6" may never happen | Fixed: section 4 and Q3 say it may rise towards full for under a second; L8 logs timestamps and the peak, with no assertion |
| 2 | minor | The music slider does not scale the hum (`sound-manager.js:25`); SFX and master sliders do, through the audio bus | Fixed: section 4 and Q3 |
| 3 | minor | Silence playlist citations are :589 and :602 | Fixed |
| 4 | minor | L7 reload before Sorensen's file is taken would reopen her chat and duck the reading | Fixed: reload after L6b, before leaving the cage |
| 5 | minor | Stage 5 items (persona run, frame time, five tries) not addressed; flags 3 and 4 must be typed in play in the salvage cage for L8 | Fixed: new 10.4; L8 states it |
| 6 | minor | L5's dock reading at step 1 comes under the briefing chat, so the volume is ducked | Fixed: reads `_ambientLevel`, volume 0.0025 noted |

Verified correct by the reviewer: every before/after row and rooms order; the volume formula and figures at defaults; the late scenes are phone-chats and the debrief a person-chat, all ducked; only the visualiser, game menu and preferences pause the scene; nothing else touches ambience (music playlists, VM and flag panels do not); no `room_m09_*` profile, so no office_ambient, typing or spot; validator 30 to 31; the dock-to-stacks door starts shut on every load; F1 and F2 run with real play only (lockpick and cloner in the start inventory); walkthrough step numbers in L1 and L3 to L8; no lone NPC can speak; no lock, key, VM flag or critical-path change.
