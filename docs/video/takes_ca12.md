# ca12 takes (trailer pilot)

Recorded 2026-11-22, keyless :3447, display :147, `FOOTAGE_ROOT=$HOME/video-takes-local` (footage in `~/video-takes-local/ca12/takes`, outside the repo; not committed). 1920x1080 full frame, 30 fps, `--hide-hud --zoom-step 1`, `--music 0`. t10 dropped.

| take | trimmed s | drop % | A/V offset start/end ms | retakes | notes |
|---|---|---|---|---|---|
| t01_studio_wide | 12.94 | 0.66 | -78/-92 | 0 | |
| t02_two_rooms | 8.4 | 0.95 | -103/-90 | 0 | BE_SPRITE female_office_worker_v2 |
| t03_kiosk_strip | 11.0 | 0.25 | -43/-38 | 0 | |
| t04_osint_note | 11.0 | 0.77 | -73/-75 | 0 | |
| t05_pretext_card | 9.84 | 0.84 | -93/-93 | 0 | |
| t06_the_call | 23.5 | 0.39 | -97/-112 | 2 | D3 played in setup, unheard by the watcher; script now presses Approach in the take body. Pretext-card panel is on screen for the first moment (cut before frame:npc-portrait-up) |
| t07_flip | 24.3 | 0.38 | -93/-85 | 0 | player not the avatar (bust view) |
| t08_triage | 10.57 | 0.79 | -73/-70 | 0 | |
| t09_step_away | 54.94 | 0.18 | -85/-87 | 1 | BE_SPRITE; retake: the `--set` JSON must be passed without inner single quotes (run-take splits the flags unquoted) |
| t11_defend_queue | 16.8 | 0.53 | -88/-68 | 0 | `--set episode_e12_visitor_tailgater_state={"done":["brief","osint","write","flip"]}` (no inner quotes); no avatar; masks needed (real geometry in CA12_T11_MASKS.md); nothing pressed, no verdict on screen once masked |
| t12_tailgater_card | 18.97 | 0.47 | -88/-80 | 0 | same `--set` as t11; Unknown visitor (09:12) card open from 5.75 s (text readable at 1x), hold to 11.76 s, hover pass to 16.5 s, end 18.5 s; no masks (Cyber Aware), nothing pressed; "Let them in" shows a default highlight until the mouse moves |
| t13_lorna_flip | 10.34 | 0.8 | -77/-77 | 0 | no flags; setup plays the call, reloads (as t07). L1 bubble/subtitle from 2.69 s, audio 2.71 to 8.35 s (5.64 s); chat closed 8.87 s (L4 would start 0.5 s after L1, so it is never heard), last second is the studio wide (player and Lorna); no choice menu. Lead-in 0 to 2.69 s is the studio wide |
| t14_lorna_noblame | 16.7 | 0.53 | -110/-117 | 0 | `--set episode_e12_visitor_tailgater_state={"done":["brief","osint","write","flip","defend"]} --set episode_e12_visitor_tailgater_defend_complete=true` (kit_defend_done NOT set: it routes Lorna to the look-up recap). Her first line "That's the desk done..." plays 3.57 to 10.54 s, L5 audio 11.39 to 14.72 s (3.33 s), chat closed 15.23 s (the hub choice menu opens about 0.47 s after L5 ends), studio wide to 16.2 s. The lead-in before L5 is the tail of her first line (only 0.85 s gap); no verdict or debrief on screen |

Voice: every voiced line played (t06 D3/D2/D1, t07 L1); no 503s on the server. t06 shows the reply choice menu and "Last change" reason lines in the meter panel by design (script holds 1.1 s on the choices).
