# CA12 trailer round 2 (50.5 s): selects

Edit list `tools/video/edits/ca12_trailer_r2.json` (theme `ca`, mission `ca12`, branch `video/ca-trailer-r2`). Takes in `/home/cliffe/video-takes-local/ca12/takes` (set `BE_TAKES_DIR`). Round 1 is `CA12_TRAILER45_SELECTS.md`. Log: `docs/video/logs/ca12_VIDEO_LOG.md`.

Structure: hook, title, **red chapter card**, short attack footage, flip, **blue chapter card**, defend gameplay, queue take, room beat, end line, close.

| # | id | start | dur | source (take, in-out) | seat / chip | join in | masks (1920x1080 source space) |
|---|---|---|---|---|---|---|---|
| 1 | hook | 0.0 | 3.8 | t09 8.2-12.0 | full | cut | none. Thandiwe A1, voice 8.62-11.97 |
| 2 | open | 3.8 | 2.0 | ca-open preset | | seam | none. Visitors and tailgating / Merrin & Sallow Architects; stacked DEFENDER tab at the bottom edge |
| 3 | red_card | 5.8 | 4.5 | chapter card | ATTACKER | seam | none |
| 4 | research | 10.3 | 3.0 | t04 5.4-8.4 | attack, OPEN-SOURCE RESEARCH | seam | none |
| 5 | build | 13.3 | 3.0 | t05 5.8-8.8 | attack, PRETEXT CALL | cut | three pretext lines, 670,344 590x88 (3 bars), whole shot |
| 6 | lands | 16.3 | 4.6 | t06 16.2-20.8 | attack, FRONT DESK CALL | cut | "Last change" row, 360,852 340x26, whole shot. Delphine D1, voice 16.57-20.56; out before the third reply menu at 21.0 |
| 7 | flip | 20.9 | 2.0 | t07 21.9-23.9 | defend, YOUR TURN | flip | none. Kiosk tick to Defend; the single flip; DEFEND tab on the seam |
| 8 | blue_card | 22.9 | 3.5 | chapter card | DEFENDER | seam | none |
| 9 | defend | 26.4 | 5.0 | t08 5.1-10.1 | defend, VISITOR QUEUE | cut | "Today's list" line only, 850,352 548x28 (1 row), whole shot. Action buttons left visible (owner decision: same four generic labels on every card; the "how the game plays" beat) |
| 10 | queue_slot | 31.4 | 8.4 | t11 7.0-15.4 (real capture) | defend, VISITOR QUEUE | cut | Today's list / Staff list line only, 848,374 (real-capture geometry): card 1 548x78 3 rows 0-0.8 s, card 2 548x54 2 rows 0.6-3.52 s, card 3 548x30 1 row 3.31-8.4 s (shot-local). Buttons unmasked. Courier opens at 0.67 s, colleague at 3.41 s, mouse passes over the four buttons from about 5.5 s (Let them in, Report, Turn away lit in turn), nothing pressed. Card 1 shows for the first 0.67 s only |
| 11 | away | 37.4 | 3.4 | t09 21.0-24.4 | full | cut | none. Thandiwe A2, voice 21.73-24.27 |
| 12 | end | 40.8 | 4.3 | t09 47.3-51.6 | full | cut in | none. Camila C1, voice 47.51-51.45. Framing keeps the crop inside the game view |
| 13 | close | 45.1 | 3.0 | ca-close preset | | seam | none |

Start times are the sum of durations (seam joins overlap by 7 frames, so the timeline in the render is slightly tighter than this column). Total 50.5 s (lint, 13 shots, 0 errors).

Chapter card text:

- Red, "You play the attacker": Research the firm from what it posts in public / Build a story that fits what you found / Talk your way past the front desk.
- Blue, "Then you take the desk": Sort today's visitors and calls / Decide who gets in, and who gets checked.

Dropped from round 1: "What you'll spot" card, Lorna L1 (t07 9.0-14.6). Attack footage cut from 4.0/4.5/4.6 s to 3.0/3.0/4.6 s.

Never in frame: reply menus, tells, verdicts, debrief, Lorna's recap lines, the Unknown visitor card's detail (it shows the tell).

Open: music (none yet), the owner questions listed in the log.

## Render results (22 Nov)

All three aspects: 50.50 s, loudnorm -14.0 LUFS, peak -1.5 dBFS (ebur128 peak). One shared `ca12_trailer_r2.srt` (4 cues: A1, D1, A2, C1). Renders live in `/home/cliffe/video-takes-local/ca12/renders/` (not committed).

| aspect | file | size |
|---|---|---|
| 16:9 | `ca12_trailer_r2_16x9.mp4` | 4.86 MB (re-render after framing change; first render was 4.59 MB) |
| 9:16 | `ca12_trailer_r2_9x16.mp4` | 5.82 MB |
| 1:1 | `ca12_trailer_r2_1x1.mp4` | 3.98 MB |

Checks (contact sheet plus a frame every 3 s, all three): no "Today's list" or "Staff list" text, verdicts, scores, reason panels, reply menus, tells or recap lines; chapter cards legible; captions inside the frame; DEFENDER tab on the opening card; closing lock-up present. Known and kept: 9:16 crops the kiosk heading; the debrief popup slides in during the lands-to-flip join (about 20 s in 16:9).

16:9 framing change: the defend (t08) and queue_slot (t11) shots showed the kiosk panel at about a third of the frame width. They now use zoom 1.6, cx 0.5, cy 0.33 (was 1.2 / 0.435), so the panel, the list, the open card and the four buttons fill the frame. Masks are in source pixels and followed the crop; stills at first, middle and last frames show no list lines. The attack shots (t04, t05, t06) already fill their frames and were left alone. 9:16 and 1:1 framing unchanged.

Render note: render.sh takes the aspect as `16:9`, `9:16` or `1:1` (not `1x1`).
