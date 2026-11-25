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
| t11_defend_queue | 15.97 | 0.19 | -52/-60 | 0 | 2026-11-22 recaptured after visitor-tag fix (rows tagged Visitor, heading VISITOR AT RECEPTION; old take in old_call_tags/; re-check CA12_T11_MASKS.md geometry); card1 5.64, courier click 7.45 / card2 8.35, colleague click 10.18 / card3 11.08, hover 12.30 to 15.1, end 15.5; `--set episode_e12_visitor_tailgater_state={"done":["brief","osint","write","flip"]}` (no inner quotes); no avatar; masks needed (real geometry in CA12_T11_MASKS.md); nothing pressed, no verdict on screen once masked |
| t12_tailgater_card | 18.27 | 0.32 | -103/-107 | 0 | 2026-11-22 recaptured after visitor-tag fix (old take in old_call_tags/); same `--set` as t11; Visitor card (09:12) open from 5.63 s (text readable at 1x), hold to 11.63 s, hover pass to 15.8 s, end 17.8 s; no masks (Cyber Aware), nothing pressed; "Let them in" shows a default highlight until the mouse moves |
| t13_lorna_flip | 10.34 | 0.8 | -77/-77 | 0 | no flags; setup plays the call, reloads (as t07). L1 bubble/subtitle from 2.69 s, audio 2.71 to 8.35 s (5.64 s); chat closed 8.87 s (L4 would start 0.5 s after L1, so it is never heard), last second is the studio wide (player and Lorna); no choice menu. Lead-in 0 to 2.69 s is the studio wide |
| t14_lorna_noblame | 16.7 | 0.53 | -110/-117 | 0 | `--set episode_e12_visitor_tailgater_state={"done":["brief","osint","write","flip","defend"]} --set episode_e12_visitor_tailgater_defend_complete=true` (kit_defend_done NOT set: it routes Lorna to the look-up recap). Her first line "That's the desk done..." plays 3.57 to 10.54 s, L5 audio 11.39 to 14.72 s (3.33 s), chat closed 15.23 s (the hub choice menu opens about 0.47 s after L5 ends), studio wide to 16.2 s. The lead-in before L5 is the tail of her first line (only 0.85 s gap); no verdict or debrief on screen |

Voice: every voiced line played (t06 D3/D2/D1, t07 L1); no 503s on the server. t06 shows the reply choice menu and "Last change" reason lines in the meter panel by design (script holds 1.1 s on the choices).


## Re-capture 24 Nov (visemes / Lorna facing)

Lorna's portrait sheets were mirrored (commit 0f9fb5843), so t13 and t14 were re-recorded 24 Nov on display :147, keyless :3456 (worktree b-ca-trailers-next, served `lorna_easton_visemes.png` md5 9bf2b324e7748ac655ba11c42f8939e4, identical to the commit's file), player `female_office_worker_v2`. Old files are in `~/video-takes-local/ca12/takes/pre_visemes_2411/`. **Lorna now faces LEFT on screen** (portrait on the right of the frame, turned towards the dialogue text and the player side; before she faced right, off screen). Checked in frames at 5 s (t13) and 12 s (t14). No verdict or debrief on screen. Same flags as the first capture (t13 none; t14 as in its row). Delta = new minus old.

| take | file | length | check | dropped % | A/V offset (ms) | marks (new, old, delta) |
|---|---|---|---|---|---|---|
| t13_lorna_flip | `t13_lorna_flip.trimmed.mkv` | 10.30 s (old 10.34) | pass, fullFrame | 0.27 | -12 / -18 | line-start/L1 2.65 (2.71, -0.06); frame:npc-portrait-up 2.71 (2.69); line-end 8.29 (8.35, -0.06); chat-closed 8.84 (8.87, -0.03); end 9.84. Speech by silencedetect 2.85 to 8.01. Essentially the same timing |
| t14_lorna_noblame | `t14_lorna_noblame.trimmed.mkv` | 21.77 s (old 16.70) | pass, fullFrame | 0.14 | -58 / -62 | first line "That's the desk done..." start 8.96 (3.56, **+5.39**), end 15.97 (10.54); L5 start 16.51 (11.39, +5.12), L5 end 19.75 (14.72, +5.03); chat-closed 20.30 (15.22, +5.08); end 21.30. Speech: first line 9.27 to 15.65, L5 16.58 to 19.42. Gap first line to L5 is 0.54 s (old 0.85). The lead-in is 5.4 s longer this time (the chat opened later), so the edit's in point for L5 moves by about +5.1 s |

In-game live proof (read-only `page.evaluate` at +0.4 s and +1.5 s into the line, via a temporary wrapper take, same server, same flags, not committed): `portraitRenderer.visemeSheet.image.src` = `http://127.0.0.1:3456/break_escape/assets/characters/lorna_easton_visemes.png`, natural size 896x128 (7 columns of 128 px); `ttsManager.lipSync.timeline` set (41 entries, `lipSync.text` equals the spoken line); `portraitRenderer.flipped` = true (engine flips per speaker, as the portrait convention says). Note: `visemeSheet` is a plain object `{image, frameSize, columns, columnFor}`, so the src is under `.image`.
Probe values for Lorna (t13): `npc` lorna_easton, src `.../lorna_easton_visemes.png`, 896x128, timeline 41 entries, flipped true. The engine flips per speaker, so the sheet orientation fixed in 0f9fb5843 decides which way she faces.
