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
