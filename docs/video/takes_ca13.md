# ca13 takes (The AI assistant, Brightwell Foods): scripts and dry runs, 23 Nov

Take scripts for `docs/video/scripts/ca13_trailer_script.md` are in `tools/video/takes/ca13/` (`_ca13.mjs` holds the seeds and shared CSS; generic helpers come from `../ca07/_ca07.mjs`). All were dry-run headless (no capture) on a keyless server on :3454 from worktree b-ca-trailers-next, one game each, `--hide-hud --zoom-step 1`. Nothing recorded yet. Run each as `BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant <take> "<new-game flags>" "--hide-hud --zoom-step 1"` (the dry runs had no BE_SPRITE, so the player mark reads the hooded sprite; check the player in the room shots at recording). Fresh game per take, no flags unless listed. `--set` JSON has no spaces or single quotes.

Seeds (also `SEEDS` in `_ca13.mjs`):
- flip: `--set episode_e13_ai_assistant_state={"done":["brief","write"]} --set phish_assist_reader_attempts=1 --set phish_assist_reader_landed=true`
- defend: `--set episode_e13_ai_assistant_state={"done":["brief","write","flip"]} --set phish_assist_reader_attempts=1`
- step-away: `--set episode_e13_ai_assistant_state={"done":["brief","write","flip","defend"]} --set episode_e13_ai_assistant_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e13_ai_assistant_defend_percent=60 --set kit_quiet=true` (percent under 85; `kit_quiet=true` is needed or G1 never plays).

| take | entry state | actions | marks | feeds | hides and hazards |
|---|---|---|---|---|---|
| t01_attack_run (+ t01b narrow, mail client 560 px) | none | kiosk Start, "Open the mail client", Compose, Pretext drop-down set (selectOption) to "Brief with a hidden line", hold, Send (first Send is final), "It landed" panel, mail client closed 4.3 s after Send onto "Now it is aimed at you" | start 3.6, compose 7.5, pretext-set 9.7, hidden-lines, hidden-crop, address-line, build-held, send, landed (at once), mail-closed (4.5 s after Send), flip-up | build, lands, flip | CSS (`ATTACK_HIDE`): Red flags list, sub line, advisories, flip body under the heading. Never Continue, never the assistant's reply, never Show hidden text |
| t02_assist_window (+ t02b narrow, `.ac-root` 560 px) | flip seed | open kiosk, Continue opens the window, idle with the pointer drifting near "Summarise my emails", press, hold the reply | window-open 3.2, idle-start 3.5, summarise-click 11.65, reply-shown 11.66, reply-text, end 17.7 | topic, summary | CSS visibility:hidden: `.ac-empathy`, `.ac-hidden-btn` (the class is `ac-hidden-btn`, not `-bt`), `.ac-hidden-text`, `.ac-paste-line-text`, `.ac-done-badge`. Window `.ac-game-container` is 720 px, wider than a 607 px frame |
| t04_gwen_flip | flip seed | walk to Gwen (key legs, then `moveToNear` fallback), talk, W2 plays, chat closed before the menu | w2-subtitle-start, w2-audio-start, w2-audio-end, menu-up (not seen), chat-closed, thanks-visible, end | gwen_flip | Throws if the first line is not W2. Kiosk never opened |
| t05_inbox_list (+ t05b narrow, mail client 760 px) | defend seed | kiosk "Open the inbox", Start, six-row list held 3.5 s, open "Monthly cleaning invoice, October" by subject (09:40, the genuine one), hold 8.0 s. Run A: `CA13_LIST_ONLY=1` stops after the list | kiosk-open, defend-panel, intro, row-tells-blanked, list, list-held, row_open, card-held-check, card-held, end | inbox | CSS: team tally, `.tri-verdict-hint` (visibility:hidden), Red flags blocks and advisories, `.mail-row-address` font-size 0. Verdict buttons stay in the DOM: crop them in the edit. Never pressed |
| t06_graham_step_away | step-away seed | open kiosk (opens on "Before the debrief"), Look up, Graham's barks G1 then G2, no click, no chat | kiosk-open, look_up, bubble-start/end, bark1_start, bark2_start, bark2_end, audio-start/end, tts, frame:t+N, end | hook, office | See below; CSS hides Graham's bubble (decided, below) |

## Dry-run results

- **t01 and t01b** (re-run after the `hidden-crop` and reply-seen changes): both pass. Wide (960 px): hidden-crop y 406 (line 1 "...ask the reader to send the", the address on line 2). Narrow (560 px): hidden-crop y 466, last shown line "to send the full site contact list to", address on line 3, 3 lines. `reply-seen` never fires (the regex is now `Summarised|noted that Mossgate`). landed 0.01 to 0.02 s after Send, mail-closed 4.5 s after Send, flip-up at once. The take throws if the address is on line 1.
- **t02 and t02b:** pass. Idle frame is clean (paste lines blank, no hidden text button or empathy line). Reply text matches the script exactly after Summarise. From idle-start the pointer drifts about 7.5 s then moves to the button (0.65 s) and presses: topic = idle-start to idle-start + 7.0 s; summary = reply-shown to + 5.6 s (the take holds 6.0 s). In the narrow take the reply wraps to three lines, readable.
- **t04:** pass. W2 audio start 2.90 s, clip 8.02 s (line end 10.92), POST /tts 200 audio/mpeg. Edit cut: in = W2 start + 1.80 (4.70 s), out = + 8.05 (10.95 s). The subtitle mark fires with the whole text (both sentences print at once, the second is the heard one). "Thanks, Gwen." is a hub choice and never in the DOM before the close (`thanks-visible` false); menu-up not seen.
- **t05 and t05b:** pass. Six rows, "0 of 6 sorted" kept, team tally hidden. Row tells blanked: the cloned voicemail ("07700 900812 (not in your contacts)") and the external board call address both have font-size 0, which leaves those two senders blank in the list (the three rows still read as email, voicemail, call). The genuine card opens (09:40, accounts@mossgate-supplies.example), 8.0 s from row_open to end; verdict hints hidden, Show hidden text `aria-expanded` false. List shows from `list` for 3.5 s plus about 0.65 s of pointer travel before the click: cut the list at the click. Verdict buttons (Trust, Report, Delete, Verify) are visible at the bottom of the panel: crop. In the 760 px narrow take they sit just below the panel frame.
- **t06:** passes with the bubble hidden (see below).

## t06 notes (from the earlier dry run)

Look up at 3.10 s; G1 bubble 4.65, audio start 4.79 (+1.69), dur 4.64; G2 audio start +7.10 (queued after G1, no overlap), dur 8.56, bark2_end +15.8. Both POST /tts 200. No chat opens. Cached G1: first sentence ends 2.178 s, next speech 2.605 s (hook cut 2.45 s). The world bubble prints the whole G1 text at once, so the hook frame would show sentence 2 in writing. Decided and done: Graham's world bubble is hidden for the whole take. It is a Phaser container, not DOM, so CSS cannot reach it: `HIDE_BUBBLES` in t06 patches every bubble box (existing, and new ones via `_make`) to stay invisible with alpha 0; the says/pages state the marks read is untouched. Re-run with the patch: timings unchanged (Look up 3.08, G1 audio start 4.63, dur 4.64, G2 audio start 10.18, dur 8.56, bark2_end 18.82, both POST /tts 200). Proof: mark `bubble-hidden-check` at G1 start reads `visible:false, alpha:0, patched:true`, and the frame at G1 +1.4 s (`t06_..._04_t_6.png`, G1 audio playing) shows Graham with no text bubble. Only the small "..." talk icon beside the NPCs remains (the game's own marker, not text). The edit burns captions: G1 sentence 1 only, G2 in full.

## Script changes

- The kiosk strip tab is "Your message" (the flip take shows "3 Your message"), not YOUR TURN.
- "INVOICE EMAIL BUILDER" is not visible: the mail client panel has no title. Drop the tab name from the build shot.
- Graham's bubble is hidden, with burned captions (above). G1: "Assistant's done the inbox for me." only.
- The flip panel heading reads "Now it is aimed at you"; its body stays out of frame (CSS).
- The topic idle shot: the inbox pointer and the assistant paste panel need the CSS above or the child's allergy and password lines show.
- Inbox list: two senders show blank (tells hidden); keep v8a "Emails, voicemails, video calls." (still true, rows have tags and voicemail durations).
- The assistant's "Show hidden text" class is `ac-hidden-btn`; the inbox card's is `tri-hidden-btn`.
- The victim reply (arrives as inbox mail at Send + emailReplyDelay) is behind the result panel; not needed (see takes_ca06.md).

## Recorded results

| take | length | drop % | key marks | notes |
|---|---|---|---|---|

## Movement shots (25 Nov)

Owner note: the NPCs stand still on their spots. Helper `tools/video/takes/lib/camlib.mjs` (`followNpc`, `stopFollow`, `followPlayer`, `camState`, `triggerNeed`, `waitNpcMoved`), proved headless on keyless :3456: ca13 game 13362, Agnieszka forced to a coffee trip, camera scroll (-109,-104) to (-67,-4) as she walked (192,97) to (244,209), then back on the player at (-108,-2). Survey and scenario proposals: `docs/video/CA_MOVEMENT_B3.md`. All takes below are **proposed scripts, not written or run** (dry-run each; none recorded). Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t07_graham_coffee (replaces t07_agnieszka_coffee; dry run PASS 25 Nov) | step-away seed with `kit_quiet=true`; `kit_ca13_out` not set | `followNpc(kit_graham_whitfield, lerp 0.08)`; `triggerNeed(caffeine, 5)`; he walks from his settled post (100,187) to the coffee station (arrive 240,214, 143 px), hold; back to his post; `followPlayer` | post-set, follow-on, need-set, walk-start, arrive, trip-distance, return-start, back, cam-summary, end | office or cold open | After `kit_ca13_out` her `patrolOverride` returns her to tile (6,3): record the trip before Look up. t06_graham_step_away: start the camera on Agnieszka for the first 2 s (her recall walk), then `followPlayer`: unproven |

Dry run 25 Nov (step-away seed with kit_quiet=true, headless, BE_DRY=1): FAIL after 2 attempts. Attempt 1 (game 13378, committed script): `Agnieszka is not on her post at take start: {x:276,y:209}`; the surveyed post (192,97) was never seen. Attempt 2 (game 13379, post taken from her settled start point): she starts at (277,208), walks to (249,213), arrives 1.1 s later, waits about 33 s, walks back towards (235,176) and settles at (214,79). Error: `Agnieszka did not get back to her post: {x:214,y:79}`. No camera summary was logged. Her start point is 33 px from the station (244,209), so the trip reads as a short step, and her routine takes her well away from that point afterwards. The take needs a decision on her post and her entry state before a third run. The committed script is restored (no net change).

Dry run 25 Nov, t07_graham_coffee (step-away seed with kit_quiet=true, headless, BE_DRY=1, keyless :3456, game 13380, attempt 1 of 3): PASS. Graham's start and post (100,187); target the coffee station, arrive (240,214), trip 143 px (minimum 120); return-start (210,187); back on the post (100,187). Camera start (-381,-87) (first followed sample), end (-269,-155) after the glide back to the player; scroll covered 128 px in x and 32 px in y while following. Agnieszka's take is replaced: the kit's needsHome for her is the training room, and the take proved only that she leaves her post, not that she returns.

Repeat dry runs 25 Nov, t07_graham_coffee (same entry state, fresh game each time): run 2 PASS (game 13381) and run 3 PASS (game 13385). Post (100,187) both times. Arrive (238,213), trip 140 px (run 2); arrive (237,213), trip 139 px (run 3). Return-start (205,182) and (217,194); back on the post (100,187) both times. Scroll range while following: x 126 and 125, y 29 on both; camera back on the player at the end, no errors.

## Capture 25 Nov

Real captures, 1920x1080 30 fps, display :147, keyless server :3456, `BE_SPRITE=female_office_worker_v2` (every take logged `player-sprite` = that key), seeds as above (none for t01 and t01b, flip for t02, t02b, t04, defend for t05 and t05b, step-away for t06 and t07), `--hide-hud --zoom-step 1`. Footage in `~/video-takes-local/ca13/takes/` (not in git), each file `<id>.trimmed.mkv` with `.trimmed.markers.json`, `.check.json`, `.contact.jpg`. All 10 passed the check first time (both slates found, A/V offset corrected as a constant, `fullFrame` true, no problems); no retakes, no dry runs needed (all had passed). Marks are in trimmed seconds, taken from the scripts; no frames were looked at beyond the check's first-frame test. t05 run A is `CA13_LIST_ONLY=1` (list held), run B is the full take with the card; the video, trimmed markers, check and contact files were renamed `_runA` and `_runB` straight after each run (the untrimmed `.markers.json`, `.record.json` and `.take.json` carry run B's content under the plain name).

| take (file) | length s | drop % | A/V offset start/end ms | key marks (trimmed s) |
|---|---|---|---|---|
| t01_attack_run | 21.04 | 0.14 | -32 / -30 | start 4.13, mail-open 5.76, compose 7.94, pretext-set 10.08, hidden-lines/crop/address-line 10.11, build-held 12.62, send 13.60, landed 13.64, landed-held 16.64, mail-closed 18.07, flip-up 18.07, flip-held 20.58, end 20.58 |
| t01b_attack_run_narrow | 20.40 | 0.15 | -20 / -47 | start 3.94, mail-open 5.46, compose 7.57, pretext-set 9.71, hidden-crop 9.72, build-held 12.22, send 12.96, landed 12.97, landed-held 15.97, mail-closed 17.42, flip-up 17.42, end 19.93 |
| t02_assist_window | 18.40 | 0.16 | -38 / -25 | kiosk-open 2.47, window-open 3.48, idle-start 3.79, summarise-click 11.95, reply-shown 11.95, reply-text 13.16, end 17.96 |
| t02b_assist_window_narrow | 18.80 | 0.16 | -38 / -43 | kiosk-open 2.64, window-open 3.66, idle-start 3.98, summarise-click 12.30, reply-shown 12.32, reply-text 13.54, end 18.34 |
| t04_gwen_flip | 14.20 | 0.21 | -62 / -30 | walk-start 2.07, walk-end 2.84 (moveToNear fallback used), w2-subtitle-start 3.51, w2-audio-start 4.04, talk 4.97, w2-audio-end 12.17, chat-closed 12.78, end 13.78 |
| t05_inbox_list_runA | 10.20 | 0.80 | -58 / -75 | kiosk-open 2.58, defend-panel 3.84, intro 4.84, list 6.20, list-held 9.73 |
| t05_inbox_list_runB | 18.60 | 0.16 | -50 / -37 | kiosk-open 2.55, defend-panel 3.75, intro 4.67, list 5.89, row_open 10.16, card-held-check 11.66, card-held 18.16 |
| t05b_inbox_list_narrow | 18.47 | 0.16 | -58 / -38 | kiosk-open 2.50, defend-panel 3.70, intro 4.62, list 5.84, row_open 10.03, card-held-check 11.53, card-held 18.03 |
| t06_graham_step_away | 20.20 | 0.15 | -20 / -40 | kiosk-open 2.47, look_up 3.49, bark1_start 5.08, bark2_start 10.58, bark2_end 19.32, end 19.72 |
| t07_graham_coffee | 43.57 | 0.07 | -48 / -62 | post-set (100,187) 1.44, follow-on 1.44, need-set 1.49, walk-start 2.87, arrive 5.46 at (238,213), trip 140 px (min 120), return-start 38.06, back 40.79 at (100,187), follow-off 41.60, cam-summary 43.05 (154 samples, scroll range 126 by 32, back on the player) |

Drop is 0.07 to 0.80 % (run A of t05 is the highest at 0.80 %, still under the 1 % gate). Edit retime: t07 Graham stands about 33 s at the station between arrive (5.46) and return-start (38.06), so cut the wait. Sidecars are still drafts.

## Retake 26 Nov (owner: player aside)

Owner (25 Nov): "The opening scene has 3 characters standing too close together. Have the player stand aside." Frames at 5.5, 7.0 and 12.0 s of the 25 Nov t06 show the trio at the top of the room: Agnieszka (red hair, left), Gwen (middle) and the player (right, white shirt, beside the kiosk). The player sits on the scenario's `resumeSpawn` (6.6, 3.6 tiles), Gwen is at (5.5, 3.8), Agnieszka at (6, 4). Graham is the seated man at the desk (3, 6), not part of the trio. Only t06 shows this: the hook (source 5.10 to 7.55) and the office shot (10.56 to 19.04).

**Change (take script only, `tools/video/takes/ca13/t06_graham_step_away.mjs`).** The kiosk opens only within 1 tile (32 px), so the player cannot move first, and the camera is locked on the player (everything scrolls with it). So: (1) `stopFollow` freezes the camera at take start while the player is still at the spawn, which keeps the 25 Nov framing exactly (the edit's 16:9 crop cx 0.411 cy 0.537 zoom 2 still fits); (2) kiosk opens and Look up are untouched; (3) right after Look up and once the panel has gone, the player walks straight down 64 px (2 tiles, about 190 px on screen), 3x screen scale. Old position: (6.6, 3.6) tiles, about 1 tile from Gwen. New: about (6.6, 5.6), about 2.5 tiles from Gwen, in open carpet below the kiosk (desk 4 tiles left, chairs lower right), inside the crop (feet about y 810 of 850). G1 plays about 1.6 s after Look up and the walk takes about 0.5 s, so the player is still before the hook's source in-point.

**Marks kept:** kiosk-open, look_up, bubble-start/end, bark1_start (about 5.08), bark2_start (about 10.58), bark2_end, audio-start/end, tts, frame:t+N, end. **New marks:** cam-before-freeze, cam-freeze, aside-start, aside-end (x, y, movedPx, camera scroll, atS), frame:aside. The take throws if the player moved less than 48 px.

**Dry run** (keyless server, as the 25 Nov takes; machine unlocked, display :147):

```
BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant t06_graham_step_away \
  "--set episode_e13_ai_assistant_state={\"done\":[\"brief\",\"write\",\"flip\",\"defend\"]} --set episode_e13_ai_assistant_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e13_ai_assistant_defend_percent=60 --set kit_quiet=true" \
  "--hide-hud --zoom-step 1"
```

Dry-run checks before the real capture: (a) `aside-end` movedPx 60 to 66, atS under 1.4 and scrollX/scrollY equal to `cam-before-freeze` (frame did not scroll); (b) `look_up` to `bark1_start` about 1.6 s and `bark2_start` minus `bark1_start` about 5.5 s as on 25 Nov (look_up 3.49, bark1 5.08, bark2 10.58, bark2_end 19.32 in trimmed seconds); (c) frames at 5.5, 7.0 and 12.0 s: player clearly apart from Gwen and Agnieszka, fully in the 16:9 crop (x 310 to 1270, y 310 to 850) and in the 9:16 window; (d) no chat or menu opened, `bubble-hidden-check` still `visible:false`. If the player's feet are cut at the crop's bottom edge, reduce `ASIDE_DOWN_PX` to 48. Then capture as for 25 Nov (record, trim, check, marks), replace `t06_graham_step_away.trimmed.mkv` and markers in `~/video-takes-local/ca13/takes/`, and re-measure the edit cues if any mark moved more than 0.1 s (G1 speech 5.257, G2 10.858 on 25 Nov).

**Other takes with the same opening:** none need it. There is no narrow t06. t01, t02, t04, t05 and their narrow versions show the kiosk or chat panels, not the room trio (t04 walks to Gwen on purpose). t07_graham_coffee starts from the same spawn but its camera follows Graham, so the player is only in frame if he is near the trio at 2.87 to 5.46 s: check that shot once and recapture only if so. Recapture: t06 only.

**Retake results, 26 Nov (display :147, keyless :3456, BE_SPRITE=female_office_worker_v2).** Three scratch dry runs (real recorder, scratch FOOTAGE_ROOT), then the real capture. The camera freeze and its marks pushed every later mark about 0.47 s late (look_up 3.91 against 3.49), so the pre-Look-up hold was cut from 1000 ms to 750 ms (550 overshot 0.4 s early; run-to-run spread of the pre-kiosk part is about 0.4 s). Commits fcf1ce06f, b53046b9e. Aside walk: movedPx 62 to 65, atS 0.51 to 0.65, scroll (-109, -65) unchanged (frame did not scroll). Frames at 5.1, 7.5 and 12 s: the player stands about 2 tiles below Gwen and Agnieszka (screen x 925 to 995, feet y about 815), inside the 16:9 crop (y to 850), the 1:1 crop (y to 840) and the 9:16 window. Both edit lists use the same crops for t06 (16:9 cx 0.411 cy 0.537 zoom 2; 9:16 cy 0.528 zoom 1.125; 1:1 cy 0.528 zoom 2). The bubble stays hidden, no chat or menu opened.

Real capture: pass, dropPct 0.45, A/V offset -75/-70 ms (constant, corrected), fullFrame true, length 20.14 s. Marks (trimmed s), 25 Nov then 26 Nov: look_up 3.489 / 3.351; bark1_start 5.082 / 5.007; G1 audio-start 5.094 / 5.113; bark2_start 10.583 / 10.457; G2 audio-start 10.559 / 10.461; audio-end 19.109 / 19.048; bark2_end 19.316 / 19.193. G1 speech (5.257 on 25 Nov) is now about 5.28 and G2 (10.858) about 10.76: the edit list needs no shift (G1 +0.02, G2 -0.10; the in-point 10.56 now sits 0.2 s before G2 instead of 0.3, out 19.04 still 0.3 s past the speech end). Old files are in tmp/delete/ca13_t06_old/.

**t07_graham_coffee needs the same fix.** Frame at its edit in-point (2.95 s): the player stands shoulder to shoulder with Gwen (right of her, same row), the same crowding the owner flagged, in the open office view. The t06 setup does not carry over (t07 is a separate fresh game and its script has no walk-aside). Not recaptured in this slot.

**t07 (prepared, not yet captured).** Script `tools/video/takes/ca13/t07_graham_coffee.mjs`. Used span: source 2.95 to 5.35 s in both edit lists. The 16:9 and 1:1 crops (cy 0.75, zoom 2) start below the trio (frames at 2.95 and 5.35 s show the trio at the top, outside the crop), so only the 9:16 window (cx 0.443, cy 0.556, zoom 1.125) shows the player beside Gwen. The camera follows Graham, so the player can move without scrolling the frame. Change: right after `triggerNeed` the player walks down 44 px (clears the kiosk) then right 32 px, to about (7.6, 5.0) tiles, about 2 tiles from the pair and 1.5+ tiles above Graham's route to the coffee station (straight down would cross it). The walk takes about 0.6 s inside Graham's 1.4 s start-up, so walk-start (2.87 s on 25 Nov) and the 2.95 in-point should not move. New marks: aside-start, aside-end, frame:aside. The take throws if the player moved less than 40 px.

Dry run (keyless server, display :147, fresh game; do not run while another session uses the machine):

```
BE_DRY=1 BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca13_ai_assistant t07_graham_coffee \
  "--set episode_e13_ai_assistant_state={\"done\":[\"brief\",\"write\",\"flip\",\"defend\"]} --set episode_e13_ai_assistant_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e13_ai_assistant_defend_percent=60 --set kit_quiet=true" \
  "--hide-hud --zoom-step 1"
```

Capture: the same command without `BE_DRY=1`. Checks: (a) `aside-end` movedPx 50 to 56, durS under 1.0; (b) `walk-start` within 0.15 s of 2.87 and `arrive` near 5.46, trip at least 120 px; (c) frames at 2.95, 4.0 and 5.35 s: player clearly apart from Gwen and Agnieszka, not on Graham's route, and Graham's path unblocked; (d) player inside the 9:16 window. If Graham stalls on the player, shorten ASIDE_RIGHT_PX. Then replace `t07_graham_coffee.trimmed.mkv` and markers in `~/video-takes-local/ca13/takes/` and re-measure the cue if walk-start moved more than 0.1 s.
