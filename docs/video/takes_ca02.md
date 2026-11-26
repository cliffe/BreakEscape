# ca02 takes (CV lures, Tarrowby Logistics): scripts and dry runs, 23 Nov

Not recorded yet. Scripts in `tools/video/takes/ca02/` (`_ca02.mjs` holds the shared helpers; generic ones come from `../ca08/_ca08.mjs`). Dry runs on a keyless server, port 3452, worktree b-ca-trailers-next, headless, no capture, hooded avatar (no BE_SPRITE, so the dry frames show the hacker hood; a real recording sets `BE_SPRITE=female_office_worker_v2`). Entry states from `docs/video/scout/ca02_scout.md`. Run each as `tools/video/takes/run-take.sh ca02_cv_lures <take> "<new-game flags>" "--hide-hud --zoom-step 1"`.

Defend-seat flags (t04, t05 and t05n): `--set episode_e2_cv_lures_state={"done":["brief","osint","write","flip"]} --set phish_recruiter_contact_attempts=1` (t04 needs the attempts flag: without it Fatima says "Welcome to the Tarrowby exercise" and the take throws; the kiosk opens on the Defend panel).

After-defend flags (t07_zainab_hook): `--set episode_e2_cv_lures_state={"done":["brief","osint","write","flip","defend"]} --set episode_e2_cv_lures_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true`. Step-away flags (t07_chidi_prompt): the same plus `--set episode_e2_cv_lures_defend_percent=60` (keep it under 85).

| take | entry state | actions | marks to log | used by | hides and hazards |
|---|---|---|---|---|---|
| t07_zainab_hook | after-defend flags, enable-content card NOT caught (do not set `kit_key_caught` or `kit_ca02_cv_choice`) | close nothing, walk to Zainab (left/down legs, then `moveToNear` fallback, distance 35), talk; her first line plays; chat closed before the choice menu | walk-start, talk, frame:npc-portrait-up, z1-subtitle-start, z1-audio-start/end, z1-sentence1-end (start + 2.65 measured by silencedetect, silence 2.65 to 3.04 s), chat-closed, end | hook | The person-chat bar shows BOTH sentences at once ("Heard HR had a scare with an application. Easy to click when the inbox is heaving."): crop or cover the bar and burn the caption. Crop out the Tarrowby sign's neighbours, the Skip button and the X. One-shot state: retake on a fresh game |
| t02_attack_run | none: fresh game, Skip tutorial, close the Brief | kiosk Start; `Open the browser`; click blocks blk_recruiter and blk_hiring_mgr on "Our people", the Careers link, blk_vacancy; close the browser; `Open the mail client`, `Compose`; pretext_application (closed select), the two blanks `vacancy` ("the Warehouse Operative role (WHO-114)") and `hiring_manager` ("Colin Mather") by real clicks on `button.mail-blank` then `.mail-picker-option`; ask_calm; attach `kit_cv` ("CV (Word document)"); To defaults to Fatima Begum (Recruitment Lead); Send; result panel; the take waits for the reply row (soft) up to 12 s, then closes the mail client onto the flip; hold 3 s; Continue (strip ticks to Defend) | start, browser-open, note-fatima, note-colin, careers-open, note-vacancy, browser-closed, mail-open, compose, redflags:n (2, 1, 0), pretext-set, slot1, slot2, ask-set, attach-set, to-line, send, landed, reply-in (or reply-missing), mail-closed, flip-up, continue, strip-defend, end, frames: careers-noted, builder-filled, landed-panel, reply, flip-heading | research, build, lands, flip | HIDE_MAIL hides `.mail-redflag-sub` (the "Fewer flags means harder to spot." line), the advice and clean lines, the checklist advisory and tallies; the red-flag COUNTER stays. Never the zip attachment. Result panel is pattern level (three ticks, "It landed. They acted on it.", "Their reply is on its way..."), no tell |
| t02n_attack_run_narrow | as t02 | same body, `.osint-browser-game-container` and `.mail-client` capped at 560 px, centred | as t02 | 9:16 and 1:1 versions of research, build, lands | The mail client's own "Close" button pokes out right of the panel at 560 px (fragment "ose" beside the X, around x 1207 to 1255): crop to the inner panel (about x 695 to 1225). The pretext select truncates ("...role (WHO-:"); slots and attach read fine. The browser view still shows the room behind it dimmed: crop to the panel |
| t04_fatima_flip | defend-seat flags | walk to Fatima (left leg then up, distance 38, in range), talk; F1 plays; chat closed before the choice | walk-start, talk, frame:npc-portrait-up, f1-subtitle-start, f1-audio-start/end (8.19 s), f1-sentence1-end (start + 2.85, est), chat-closed, end | fatima_flip | The bar shows the whole line at once, no tell. POST /tts 200 audio/mpeg (68949 B). The take throws if the first line is not F1 |
| t05_inbox_list | defend-seat flags; env `INBOX_RUN=A` or `B` (default A) | `Open the inbox`, `Start`; six rows. Run A: hold the list 7.5 s, cursor parked off the panel. Run B: list 4.1 s, then the Tendai Shava row (third; straight in from the right so the cursor never crosses Jordan Kerr's row below it) opens the card, held 8 s | kiosk-open, inbox-open, start, list (rows logged), card-open (B), card-text, end, frames | topic (A), inbox (B) | HIDE_CARD hides the "Phish stopped for the team: N" badge (`.aw-team-tally`), tallies, per-flag notes and verdict hints. "0 of 6 sorted" stays. In B the three verdict buttons (Trust, Report, Delete) are in the DOM below the body: the edit frames above them. Never press one, never Esc |
| t05n_inbox_narrow | defend-seat flags | run B body with `.mail-client` capped at 760 px (560 clips the buttons and wraps the card) | as t05 run B | 9:16 and 1:1 of topic and inbox | Card reads cleanly at 760 px: From line, subject and `Tendai_Shava_CV.pdf` label in frame, buttons below; row names truncate ("Tendai Sha...") |
| t07_chidi_prompt | step-away flags | open the kiosk (opens on "Before the debrief", buttons Look up / Carry on), hold, press `Look up`; hold to look_up + 20 s; no talk, no click | kiosk-open, look_up, kit_ca02_out, bark1 bubble and audio start, bark2 start, frames | office | The Look up panel body says "Look up from the kiosk ...": on-screen word kiosk, no tell. In the edit crop to the heading and the buttons. No choice menu appears; bark 2 starts at +7.05 s after the press |

## Dry-run results (23 Nov)

- t07_zainab_hook: ok. POST /tts 200 audio/mpeg, 42789 B, whole 5.42 s line. Audio start 2.28 s, subtitle 2.13 s. Sentence 1 ends 2.65 s into the clip (silence 2.65 to 3.04 s at -30 dB): cut at start + 2.65 + 0.15.
- t07_chidi_prompt: ok. Look up at 3.90, bark 1 bubble and audio at 5.45 (+1.55 after the press, 2.28 s long), bubble stays up until bark 2 at 10.95; Fatima's third bark at look_up + 16.0 s (outside the shot). `kit_quiet` false before Look up, true after. In = bark1_start - 2.8, out = bark1_start + 2.8. Frames checked: Chidi bubble over his desk, Zainab at left, correct panel.
- t02_attack_run: ok, 46.2 s body. Marks (s): start 3.7, browser-open 5.2, note-fatima 7.4, note-colin 9.4, careers-open 11.4, note-vacancy 13.6, browser-closed 16.9, mail-open 18.0, compose 20.2, pretext-set 22.6, slot1 25.8, slot2 29.1, ask-set 30.7, attach-set 32.0 (red flags 2, then 1, then 0), send 34.8 (landed on the same tick: the panel replaces the composer), reply row 41.7 (Send + 7.0; measured 6.7 to 7.0 s in two runs), mail-closed and flip-up 41.9, continue 44.9, end 46.2. Frames viewed: careers-noted, builder-filled, landed panel, flip heading (all clean).
- Fatima's reply (the earlier `/Thanks for your application/` never matched because the result panel covers the mail client and `innerText` skips hidden DOM, and the reply is a mail, not text on the panel). Real behaviour: the scenario's target has `emailReplyDelay` 6; the reply is a "Re: Application: Warehouse Operative (WHO-114)" row from Fatima Begum at 09:04, in the inbox 6.7 to 7.0 s after Send (6 s delay plus the 1 s scheduler tick). It sits behind the result panel. After `Done` and a click on the row the body is: "Thanks for your application. I'll open your CV and pass it to the hiring manager." (proved with a probe copy: Done, then the row, text read; frame saved). So the lands variant is possible but costs about 7 s of Send-to-reply plus a Done click and a row click; the default take does not press Done, so the shot shows the panel only: **lands variant off** unless the edit wants the extra take (add Done and the row open after `reply-in`; the sidebar of the take is otherwise unchanged).
- t02n_attack_run_narrow: ok, 46.2 s, same marks within 0.5 s (reply 41.2). Frames viewed: careers (centred, room visible behind), builder filled (slot buttons and counter readable, Close fragment at the right edge, see hazards), landed panel.
- t04_fatima_flip: ok, 18.1 s. Walk 1.0 to 1.9 s, interact 7.1 (an interact retry follows at 9.5, no skipped line), F1 subtitle 8.1, line start 8.4, line end 16.6 (8.19 s), chat closed 17.1. First line is F1, not the welcome line. Portrait frame viewed: Fatima, Tarrowby sign, Skip button and X (crop those).
- t05_inbox_list run A: ok. Kiosk Defend panel at 2.4, inbox-open 3.4, start 4.6, list 5.1 (six rows: Roseanne Wadsworth, Liam Baxter, Tendai Shava, Jordan Kerr, Darius Petrauskas, Colin Mather), end 12.65. Run B: card-open 10.05 (list held 4.7 s), end 18.6. Card text confirmed: From Tendai Shava, `Tendai_Shava_CV.pdf`, "Dear Fatima..." body. Button labels in the DOM: Start, Open the inbox (kiosk); Trust, Report, Delete (card). Frames viewed: list and card (the first card frame still showed the team badge: the HIDE_CARD selector list had a typo, fixed and rechecked in the narrow run, badge gone).
- t05n_inbox_narrow: ok, 18.5 s, card-open 9.94. Frame viewed at 760 px: clean.

## Script changes needed (edits to `docs/video/scripts/ca02_trailer_script.md`)

Take windows from the marks (these replace the script's research, builder, send and flip windows; trimmed-take seconds will shift by the slate, so retime from the logged marks after capture):

| shot | script window | new window (t02_attack_run, take seconds) |
|---|---|---|
| research (4.8 s) | 8 to 12.8 | 11.2 to 16.0 (Careers open 11.4, vacancy noted 13.6); the browser is open 5.2 to 16.9 |
| build (7.2 s) | 28 to 35.2 | 25.3 to 32.5 (pretext picked 22.6, vacancy slot 25.8, manager slot 29.1, ask 30.7, CV attached and counter at 0 at 32.0) |
| lands (4.2 s) | 40 to 44.2 | 34.2 to 38.4 (Send click 34.8, panel up from the same tick and static; the reply row arrives 41.7 behind it) |
| flip (2.4 s) | 52 to 54.4 | 41.9 to 44.3 (mail closes onto "Now it lands on you" at 41.9, Continue at 44.9) |
| topic (7.1 s) | t05 run A 3 to 10.1 | run A 5.3 to 12.4 (list on screen 5.1 to 12.65) |
| inbox (11.8 s) | run B list 3.8 s then card 8.0 s | run B in = card-open - 3.8, out = card-open + 8.0 (about 6.3 to 18.1; end at 18.6) |

Other changes:
- Lands variant (Fatima's reply in the inbox) is off: her reply is behind the result panel 6.7 to 7.0 s after Send and needs Done plus a row click. v6 "She opens the CV." drops, total stays 70.1 s.
- Hook: the person-chat bar shows both sentences at once, so crop or cover the bar and burn the caption; cut at start + 2.65 + 0.15 (the script says 2.69).
- Office: the Look up panel body contains the word "kiosk" (no tell). Crop the frame to the heading and the buttons in the edit.
- The narrow inbox cap is 760 px, not 560 (the verdict buttons clip at 560). The narrow attack run keeps 560 px, with the Close fragment cropped.
- Fatima F1 sentence gap 2.85 to 3.03 confirmed from the clip; no change.

## Recorded marks (trimmed-take seconds)

| take | length | drop % | key marks (trimmed s) | checked against frames / notes |
|---|---|---|---|---|

## Movement shots (25 Nov)

Owner note: the NPCs stand still on their spots. Helper `tools/video/takes/lib/camlib.mjs` (`followNpc`, `stopFollow`, `followPlayer`, `camState`, `triggerNeed`, `waitNpcMoved`), proved headless on keyless :3456: ca13 game 13362, Agnieszka forced to a coffee trip, camera scroll (-109,-104) to (-67,-4) as she walked (192,97) to (244,209), then back on the player at (-108,-2). Survey and scenario proposals: `docs/video/CA_MOVEMENT_B3.md`. All takes below are **proposed scripts, not written or run** (dry-run each; none recorded). Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t09_zainab_drinks (new) | fresh game or defend flags; `kit_ca02_out` NOT set | start on the player; `followNpc(kit_zainab_hussain, lerp 0.08)`; `triggerNeed(thirst, 5)` if she has not left (she leaves about 7.5 s after load on her own); hold on her walk to the machine (about (227,196)) and 20 s use; `followPlayer` before any kiosk action | follow-start, npc-left-post, at-machine, use-start, follow-end, camState rows each 0.5 s | office or cold open: a person crosses the room | Needs suspended after Look up, so record before the kiosk. Her chatter ("Could murder a cold drink.") plays only while `kit_quiet` is false: fine here. Lines 2 s apart may overlap Fatima. Existing t07_chidi_prompt gains movement only if she is mid-trip when Look up is pressed: unproven, dry-run first |

Dry run 25 Nov (keyless server on :3456, headless, BE_DRY=1, no BE_SPRITE): PASS on attempt 2, game 13372. Attempt 1 stopped at the sprite gate before any movement (hooded avatar; `spriteCheck` is strict unless BE_DRY=1). Zainab starts at (140,185) on her post, walks from (128,161) 0.6 s after the thirst trigger, reaches the machine at (238,197) 4.0 s later, leaves from (216,177) and is back at (140,185) about 30 s after the trigger. Camera: 112 samples while following, scroll start (-343,-89), end (-288,-72), range 99 by 24, back on the player at the end. Frames not looked at.

## Capture 25 Nov

Recorded 25 Nov on display :147, keyless server :3456 (worktree b-ca-trailers-next), `FOOTAGE_ROOT=$HOME/video-takes-local` (footage in `~/video-takes-local/ca02/takes`, outside the repo; not committed). 1920x1080 full frame (`fullFrame` true on every take), 30 fps, `--hide-hud --zoom-step 1`, `--music 0`, `BE_SPRITE=female_office_worker_v2`. Every take passed first time (0 retakes). Flags: DEF = defend-seat flags, AFT = after-defend flags, as in the table at the top of this file. Frames checked in a contact sheet at the listed marks. The t05 runs share one take id, so the files were renamed `t05_inbox_list_runA.*` and `t05_inbox_list_runB.*` (paths inside their `.check.json` and `.take.json` still say `t05_inbox_list`). Voice: t07_zainab_hook POST /tts 200 audio/mpeg (42789 B, line 5.36 s); t04 F1 and t07_chidi bark 1 and 2 played from cache (keyless server, no 503s logged by the takes).

| take | flags | trimmed s | drop % | A/V offset start/end ms | key marks (trimmed s) | frames checked / issues |
|---|---|---|---|---|---|---|
| t07_zainab_hook | AFT | 11.24 | 0.25 | -83/-98 | portrait up 3.51, subtitle 3.46, audio 3.83 to 9.19, sentence 1 ends about 6.52 (est, 3.83 + 2.69), chat closed 9.77, end 10.77 | frames at 3.7, 5.0, 6.0: Zainab portrait, Tarrowby sign, bar showing both sentences (crop it in the edit, as noted), no choice menu. Walk used the moveToNear fallback (distance 35) |
| t02_attack_run | none | 49.40 | 0.19 | -73/-83 | start 4.27, browser 5.87, Careers 12.44, vacancy noted 14.71, mail open 19.32, slot1 27.71, slot2 31.40, attach 34.42, send 37.43 (landed same tick), reply row 43.65, flip 44.59, continue 47.67, end 48.92 | frames at 16.0 (careers, vacancy noted), 35.5 (builder filled), 37.6 (green result panel), 44.7 ("Now it lands on you" heading). About 0.6 to 1.9 s later than the dry-run marks (use these, not the dry-run windows) |
| t02n_attack_run_narrow | none | 46.40 | 0.07 | -45/-32 | start 3.93, careers 11.50, vacancy noted 13.64, mail open 18.03, attach 31.82, send 34.56, reply row 40.95, flip 41.73, continue 44.74, end 45.95 | frames at 32.9 (builder, Close fragment at the right as expected) and 34.8 (result panel). 9:16 and 1:1 use |
| t04_fatima_flip | DEF | 19.20 | 0.47 | -78/-110 | portrait up 8.69, subtitle 8.65, F1 audio 8.91 to 17.13 (8.22 s), sentence 1 ends 11.76 (est), chat closed 17.72, end 18.72 | frames at 9.5, 12.0: Fatima portrait, full F1 text in the bar, Tarrowby sign; crop the sign neighbours, Skip and X |
| t05_inbox_list_runA | DEF, INBOX_RUN=A | 13.40 | 0.22 | -53/-35 | kiosk 2.71, inbox open 3.73, start 4.95, list 5.46 to end 12.96 | frames at 6.5, 10.0: six-row list, "0 of 6 sorted", nothing opened, cursor off the panel |
| t05_inbox_list_runB | DEF, INBOX_RUN=B | 19.74 | 0.45 | -83/-92 | kiosk 2.88, inbox open 4.07, start 5.33, list 5.90, card open 10.75, end 19.27 | frames at 6.5 (list), 12.5 (Tendai Shava card: From line, subject, label; Trust, Report, Delete buttons in frame, nothing hovered or pressed; edit frames above the buttons) |
| t05n_inbox_narrow | DEF | 19.27 | 0.47 | -68/-72 | kiosk 2.79, inbox open 3.91, start 5.16, list 5.68, card open 10.30, end 18.82 | frame at 11.5: card at 760 px, From line and attachment label in frame, buttons below. 9:16 and 1:1 use |
| t07_chidi_prompt | AFT + `--set episode_e2_cv_lures_defend_percent=60` | 25.17 | 0.37 | -95/-98 | kiosk 2.86, Look up panel 3.98, Look up pressed 4.40, bark 1 start 6.17, bark 2 11.74, bark 3 (Fatima) 20.79, end 24.69 | frames at 4.0 (panel: heading, Look up and Carry on buttons) and 6.7 (Chidi bubble "Got a CV in for the driver job.", Zainab and others in the room). Shot in = 6.17 - 2.8, out = 6.17 + 2.8 (ends before bark 2) |
| t09_zainab_drinks | none (fresh game) | 32.37 | 0.10 | -62/-30 | npc-start 0.43 at post (140,185), thirst forced 0.43, left post 1.06, at machine 5.02 (239,197), return-start 27.53, back at post 29.82, follow-off 30.63, end 31.94 | PASS. Camera followed 116 samples, scroll (-182,1) to (-128,18) (range 100 by 24), ended on the player (`following: player`). Frames at 0.5, 3, 6, 15, 31.5: Zainab on her post, mid-walk past the table with a bubble, at the machine, back on post. The room is small: the camera pans only a little (about 100 px at 1x) |

Not recorded: none of the ca02 take scripts were skipped. The script's lands variant (Fatima's reply) is off, so no Done-and-row-click take was made; the reply row arrives 6.2 s after Send in these takes (send 37.43, row 43.65). t09_zainab_drinks is not in the trailer script (it is the movement-shot candidate for the cold open or office slot).

## Render queue

Edit lists from the 25 Nov takes (round 1, 72.5 s, lint 0 errors): `tools/video/edits/ca02_trailer_r1.json` (16:9) and `ca02_trailer_r1_narrow.json` (9:16 and 1:1). Not rendered (machine busy). Takes are read from `video_out/ca02/takes`, a symlink to `~/video-takes-local/ca02/takes` (git-ignored; recreate it on a fresh checkout). Run one at a time, nothing else rendering or capturing (`pgrep -af 'remotion|render.mjs|render.sh'`, `free -g`):

```bash
cd <worktree>
export BE_VIDEO_SCRATCH=<scratchpad>/render-ca02_trailer_r1-16x9     # dedicated empty folder, deleted on success
nice -n 19 tools/video/remotion/render.sh tools/video/edits/ca02_trailer_r1.json 16:9
export BE_VIDEO_SCRATCH=<scratchpad>/render-ca02_trailer_r1_narrow-9x16
nice -n 19 tools/video/remotion/render.sh tools/video/edits/ca02_trailer_r1_narrow.json 9:16
export BE_VIDEO_SCRATCH=<scratchpad>/render-ca02_trailer_r1_narrow-1x1
nice -n 19 tools/video/remotion/render.sh tools/video/edits/ca02_trailer_r1_narrow.json 1:1
```

No `--final` (spoiler blocks are unreviewed, as for the other CA round-1 edits). Output: `video_out/ca02/renders/`.

Window table (output s, take, in-out in trimmed-take s; all inside their takes and clear of the hazards above):

| shot | out s | take | in-out | note |
|---|---|---|---|---|
| hook | 0-3.0 | t07_zainab_hook | 3.65-6.65 | speech 4.00-6.488, sentence 2 starts 6.83 |
| topic | 8.1-15.2 | t05 run A | 5.6-12.7 | narrow file uses the same wide take, zoomed out |
| research | 18.2-23.0 | t02 / t02n | 11.9-16.7 / 10.95-15.75 | ends before browser closes |
| build | 23.0-30.2 | t02 / t02n | 28.2-35.4 / 25.78-32.98 | attach lands about 6.2 s in |
| lands | 30.2-34.4 | t02 / t02n | 35.9-40.1 / 33.0-37.2 | reply row not in |
| flip | 34.4-36.8 | t02 / t02n | 44.6-47.0 / 41.8-44.2 | before Continue |
| fatima_flip | 36.8-45.2 | t04_fatima_flip | 8.9-17.3 | speech 9.12-16.584, menu not in |
| inbox | 47.2-59.0 | t05 run B / t05n | 6.95-18.75 / 6.5-18.3 | card opens 3.8 s in; 16:9 crop above the verdict buttons |
| office_life (PROPOSED) | 59.0-61.4 | t09_zainab_drinks | 1.0-3.4 | not in the script; Zainab leaves her post and walks to the drinks machine, silent, +2.4 s |
| office | 61.4-67.0 | t07_chidi_prompt | 3.37-8.97 | Look up panel for 1.03 s, then Chidi bark 1 (speech from 3.12 s in) |

Open issues for the render check: music is PeaceFolk Guitar Motif from 95.545 s (a choice; alternatives in the edit); chip is EMAIL BUILDER (script's name is 25 characters, limit 24); blue card text is 30 characters (lint warning, owner wording); VO v4 is 3.3 words/s (lint warning, the voiced file); Fatima sentence-2 caption split is estimated; framings for the hook, Fatima, office and office_life are from contact frames, check them in the render; 1:1 narrow build shows the Close fragment; 9:16 and 1:1 inbox show the verdict buttons unpressed.

### t09_zainab_drinks retake, 26 Nov (after the player-depth fix 2d64f6c40)

Live proof on the keyless server (:3456, display :147, fresh ca02_cv_lures game, player idle at (192,198), Zainab's thirst trip by `triggerNeed(thirst, 5)`; 676 samples at 100 ms over 70 s, two runs). The player never moved. Depth versus feet: `window.player.depth` equalled feet y + 0.5 in every sample (feet = y + displayHeight/2 - 6; maximum deviation 0.0, e.g. feet 232.4, depth 232.9). While Zainab was within 30 px of the player in x (2.4 to 3.0 s and 27.2 to 27.8 s after the trigger) her feet were 9 to 33 px north of theirs and her depth was lower in all 15 such samples (e.g. 2.6 s: hers 222.2, theirs 232.9): no order mismatch. PASS.

Side finding, not fixed: `NpcBehavior.updateDepth` (npc-behavior.js, line 3354) uses `y + displayHeight/2 + 0.5` with no atlas padding, while the player's depth subtracts `SPRITE_PADDING_BOTTOM_ATLAS` (6 px). An NPC's depth therefore reads 6 px deeper than its visual feet, so an NPC whose feet are 0 to 6 px north of the player's can still draw in front. It did not occur in this take (the closest pass was 9 px).

Retake: the old t09 files went to `tmp/delete/ca02_t09_old/`. New take `t09_zainab_drinks`: pass, 32.64 s trimmed, drop 0.19%, residual 10/-10 ms, player sprite `female_office_worker_v2`, no page errors. Frames at 2.9, 3.1 and 3.3 s of the trimmed take: Zainab walks past on the player's left (north-west) and, as she crosses to their north, she draws behind the player (head visible above theirs at 3.3 s). Stacking is correct. Marks are as in the first take; the edit's 1.0 to 3.4 s span for office_life is unaffected.
