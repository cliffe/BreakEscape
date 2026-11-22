# CA12 trailer round 2 (48.1 s): selects

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
| 9 | defend | 26.4 | 5.0 | t08 5.1-10.1 | defend, VISITOR QUEUE | cut | list rows 836,410 562x176 (4 rows) and 850,352 548x28 (1 row), whole shot |
| 10 | queue_slot | 31.4 | 6.0 | t11 0.0-6.0 (PLACEHOLDER until captured) | defend, VISITOR QUEUE | cut | empty until the t11 dry-run is read; see `CA12_T11_MASKS.md` |
| 11 | away | 37.4 | 3.4 | t09 21.0-24.4 | full | cut | none. Thandiwe A2, voice 21.73-24.27 |
| 12 | end | 40.8 | 4.3 | t09 47.3-51.6 | full | cut in | none. Camila C1, voice 47.51-51.45. Framing keeps the crop inside the game view |
| 13 | close | 45.1 | 3.0 | ca-close preset | | seam | none |

Start times are the sum of durations (seam joins overlap by 7 frames, so the timeline in the render is slightly tighter than this column). Total 48.1 s.

Chapter card text:

- Red, "You play the attacker": Research the firm from what it posts in public / Build a story that fits what you found / Talk your way past the front desk.
- Blue, "Then you take the desk": Sort today's visitors and calls / Decide who gets in, and who gets checked.

Dropped from round 1: "What you'll spot" card, Lorna L1 (t07 9.0-14.6). Attack footage cut from 4.0/4.5/4.6 s to 3.0/3.0/4.6 s.

Never in frame: reply menus, tells, verdicts, debrief, Lorna's recap lines, the Unknown visitor card's detail (it shows the tell).

Open: the t11 take (placeholder slot, lint warning), music (none yet), the owner questions listed in the log.
