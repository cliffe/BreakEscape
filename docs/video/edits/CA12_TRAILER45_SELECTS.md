# CA12 trailer pilot (45 s): selects

Edit list `tools/video/edits/ca12_trailer45.json` (theme `ca`, mission `ca12`). Takes in `/home/cliffe/video-takes-local/ca12/takes` (set `BE_TAKES_DIR`).

| # | id | dur | source (take, in-out) | seat / chip | join in | notes |
|---|---|---|---|---|---|---|
| 1 | hook | 3.8 | t09 8.2-12.0 | full | cut | Thandiwe A1 (voice 8.62-11.97); bubble in game |
| 2 | open | 2.0 | ca-open preset | | seam | Visitors and tailgating / Merrin & Sallow Architects |
| 3 | research | 4.0 | t04 4.4-8.4 | attack, OPEN-SOURCE RESEARCH | seam | profile page, noted detail at 7.96 |
| 4 | build | 4.5 | t05 4.3-8.8 | attack, PRETEXT CALL | cut | mask: three pretext lines (670,344,590x88, 3 bars) for the whole shot |
| 5 | lands | 4.6 | t06 16.2-20.8 | attack, FRONT DESK CALL | cut | Delphine D1 (voice 16.57-20.56); mask: "Last change" row (360,852,340x26) whole shot; out before the third reply menu at 21.0 |
| 6 | lorna | 5.6 | t07 9.0-14.6 | attack | cut | Lorna L1 (voice 9.19-14.38) |
| 7 | flip | 2.0 | t07 21.3-23.3 | defend, YOUR TURN | flip | kiosk tick to Defend at 21.81; the single flip |
| 8 | defend | 5.0 | t08 5.1-10.1 | defend, VISITOR TRIAGE | cut | list then one card, four buttons, no verdict |
| 9 | away | 3.4 | t09 21.0-24.4 | full | cut | Thandiwe A2 (voice 21.73-24.27) |
| 10 | spot | 2.8 | CA card | | dissolve 16 px (pinned) | "What you'll spot" |
| 11 | end | 4.3 | t09 47.3-51.6 | full | seam | Camila C1 (voice 47.51-51.45) |
| 12 | close | 3.0 | ca-close preset | | seam | |

Total 45.0 s. The earlier plan's shot 8a (t09 4.4-6.4) was dropped so A2 and C1 play to the end of the voice.

Never in frame: reply menus, tells, verdicts, debrief, Lorna's recap lines.

MUSIC SLOT: none yet. `music.none` is set; a CA track (attack cut, defence cut, flip on the change) is still to be chosen. Game room sound and voiced lines only.

Captions: 16:9 relies on the game's subtitle bar and bubbles. 9:16 and 1:1 burn Source Sans 3 captions on voiced shots (`caption.<aspect>`), which duplicates the world bubbles on the t09 shots. The `.srt` is written by render.sh.
