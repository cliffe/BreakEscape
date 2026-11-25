# ca11 takes (Misdirected data, Carrholme Services): scripts and dry runs, 23 Nov

Take scripts in `tools/video/takes/ca11/` (`_ca11.mjs` holds the shared helpers, which re-export the ca03 and ca15 ones). Dry-run headless on a keyless server (:3451, worktree b-ca-trailers-next), no capture. Nothing is recorded yet; the recorded-results table at the foot is empty. The dry-run player is the hooded default sprite (BE_SPRITE not set), expected; the real run sets `BE_SPRITE=female_office_worker_v2`.

Step-away flags (t07, t07b, t07c; percent under 85, 85 and over sets `kit_caught`; `kit_quiet` must be true):
`--set episode_e11_misdirected_data_state={"done":["brief","mistake","flip","defend"]} --set episode_e11_misdirected_data_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true --set episode_e11_misdirected_data_defend_percent=60`

Inbox flags (t06, t06b): `--set episode_e11_misdirected_data_state={"done":["brief","mistake","flip"]}` (the kiosk opens on the Defend intro; `Open the inbox`, `Start`).

Hook flag (t01): `--set kit_defend_done=true`. t03 and t03b: no flags.

| take | entry state | actions | marks to log | used by | hides and hazards |
|---|---|---|---|---|---|
| t01_yusuf_hook | `kit_defend_done=true`, fresh game, kiosk untouched (Yusuf's thirst sends him to the cooler about 30 s in, so walk at once) | walk to Yusuf, talk; line 1 "Handovers go out fast when it's busy." starts; close the chat at audio start + 2.61 s, before sentence 2 | start-hold, player-sprite, walk-*, talk, h1_audio_start, h1_cut, bar-box, chat-closed, end | hook | The dialogue bar prints BOTH sentences at once (box x360 y950 w1000 h90; skip button x1385-1555 y975-1035). The edit crops everything below y~905 in every format and burns sentence 1 as the caption. The name plate "Yusuf Demir" (y~915-940) sits inside the crop zone; the edit adds its own name plate, so nothing is done in the take (decision 4). |
| t03_choices_reveal | none (fresh game) | interact `training_kiosk`, Start, `Make the choices`; card 1 hold 3 s unpicked, pick the unsafe option by label, hold 3.2 s, Next; card 2 pick + Next; card 3 hold 1 s, pick, hold 2.5 s, Next; card 4 pick, `See where they led`; montage held 13.5 s, mouse still; Continue; Defend intro held 3 s | tab:*, c1_shown, c1_pick, c2_pick, c3_shown, c3_pick, c4_pick, reveal, continue_click, strip_defend, end | choices, led_caller, led_export, led_redaction | Montage: `li.aw-montage-beat[data-beat=overtime_sheet]` renders first and is hidden (display none), so the visible order is caller (y299-475), export (y485-661), redaction (y671-871), x608 w704; the "Your call" labels are hidden and card borders neutralised. The Defend intro body (the DPO rule, and "a new contact number is ordinary work: do it", which gives away the 11:15 card) is hidden by `hideLong`; only the heading and strip are framed (heading y~440-470, strip y~380-410, panel x583-1337). |
| t03b_choices_reveal_narrow | none | as t03, with `.epr-kiosk-bezel` and the montage panel capped at 560 px by injected CSS | as t03 | 9:16 and 1:1 | Same hides. Dry run: the montage shows caller, export and redaction cards at 545 px wide with the verdict labels blank at the top of each card. |
| t06_inbox_list | inbox flags | `Open the inbox`, `Start`; hold the six-row list 4.4 s (mouse parked bottom-right); click the 11:15 row (found by sender + subject, not position); hold 5.2 s (the edit uses 5.05 s) | tab:*, kiosk-buttons, list, row_boxes, row_1115, card-box, end | inbox | Hidden: `.aw-team-tally`; the selected ring and focus outline on the 08:52 row (it opens selected); the four verb buttons (Trust/Report/Delete/Verify) and the sticky `.tri-actions` bar behind them (visibility hidden); the 08:52 row preview "I think this wasn't meant for me?" (font-size 0, row height kept, sender and time stay; decision 3). The 10:48 row's attachment icon stays (decision 3). Row order: 08:52 Sam Whitlow, 09:20 DC Rowley (Call tag), 09:35 Carrholme Payroll, 10:04 Gareth Hale, 10:48 Wychbourne Court (attachment icon), 11:15 Sam Whitlow (last). Card 11:15: From, To, Time, body in frame. |
| t06b_inbox_list_narrow | inbox flags | as t06, with `.mail-client` capped at 560 px | as t06 | 9:16 and 1:1 | The title "Care Laundry desk inbox" truncates to "Care Laundry des..." and the chips wrap to two rows; the full body fits only because the `.tri-actions` bar is hidden (before that fix the bar's background faded the last body lines). |
| t07_printout_beat | step-away flags | open the kiosk (opens on the step-away panel), hold 1 s, press `Look up`; the printout appears at the press, Yusuf walks to the tray and barks; hold to bark start + 7 s. Nothing is clicked after Look up | player-sprite, bubble-hidden-on, kiosk-open, press, printout-visible, yusuf-pos, bubble-start/end, audio-start/end, bark_start, bark_minus_press, frame:t+N, bark2-blocked, audio-log, tts-proof, end | printout beat | Bark 1 "This printout isn't ours. It's a care home's resident list, with health notes on it. Someone sent it here by mistake." (8.56 s clip; the edit uses sentences 1 and 2, 0.27 to 5.86 s, plus 0.2 s). The game's bubble prints all three sentences, so it is hidden from the start (box.setVisible forced false) and sentences 1 and 2 are burned as captions. See "Bark 2" below. Yusuf walks (100,185) to (130,103) and is at the tray in the bark window; no cooler trip seen in 16 s. |
| t07b_stepaway_panel | step-away flags | open the kiosk, hold about 3.3 s, then stop; "Look up" and "Carry on" are never clicked | kiosk-open, kiosk-buttons, panel-box, strip, heading, body-text, frame:panel, end | stepaway panel | Panel box x580 y367 w760 h346. The edit's tab chip ("THE TRAINING ROOM" in the script) is its own overlay. The game's own names are below. Both buttons ("Look up", "Carry on") are in frame. |
| t07c_stepaway_panel_narrow | step-away flags | as t07b, `.epr-kiosk-bezel` capped at 560 px | as t07b | 9:16 and 1:1 | Wraps the strip to two rows; both buttons still in frame (Look up x708-805, Carry on x807-911, y650-693). |

## Plan changes and decisions (23 Nov)

1. Tab chips. The edit's chips are its own overlay labels, not game DOM; the takes change nothing. The game's real names, for reference: kiosk strip `Brief`, `Choices`, `Where it led`, `Defend`, `Debrief` (a tick and "(done)" on finished ones, the live one numbered); panel headings `Choices` (card 1), `Six months later` (montage), `Defend` (intro), `Before the debrief` (step-away). The script's "A BUSY MORNING", "SIX MONTHS LATER" and "YOUR TURN" do not exist in the DOM. The inbox panel is titled "Care Laundry desk inbox" with chips `1 Brief`, `2 Sort`, `3 Review`, `4 Result`.
2. Bark 2. See below.
3. 08:52 row preview blanked, 10:48 attachment icon kept (in t06 and t06b).
4. Hook name plate: inside the crop zone, the edit adds its own, nothing done in the take.
5. t06: the 5.2 s card hold is 0.15 s longer than the edit's 5.05 s; the edit trims.

## Bark 2 (t07)

Yusuf's second bark ("You'll want this today. In the wrong hands it's a shortlist of vulnerable people, with their addresses, handed over for free.", 7.6 s) is set 5000 ms after `kit_ca11_at_tray` and fires, re-measured with the throttle off (`--no-throttle`), 4.93 s after bark 1 starts (throttled dry run: 4.99 s). Bark 1's sentence 2 ends at 5.86 s, so bark 2 started 0.93 s too early. Both barks share one `TTSManager` audio element, and `play()` calls `stop()` first, so bark 2 does not just overlap bark 1: it cuts it off. Muting bark 2's audio (the ca03 t05 Darren method) would therefore not save sentence 2; bark 1 would still stop at 4.93 s.

Fix in the take: wrap Yusuf's `TTSManager.play` so a call with bark 2's text returns a resolved duration and never touches the audio element, and keep both bubbles hidden. Dry run, unthrottled, with a 50 ms sampler on the element: bark 1 plays to currentTime 7.1 s with no backwards jump (0 cuts), no second `audio-start`, no second `POST /tts` (one 200 audio/mpeg, 76437 bytes), `blocked` 1, element never muted (it is bark 1), bubble 2 hidden in the frame at bark + 5.7 s. The bark's other effects still run (`kit_ca11_done` is set by the same rule). Marks `bark2-blocked` and `audio-log` log this on every run. If the real run shows bark 1 still cut, fall back to ending the shot at 4.9 s.

Edit rule: in = the later of press and bark_start - 1.8 s; out = bark_start + 5.86 + 0.2. In the dry run the press came 2.45 s before bark start (unthrottled), so in = press + 0.65 s. The frame at press + 1.05 s (about bark - 1.4 s) shows the printout on the tray beside the copier and Yusuf walking up.

## Dry-run results (23 Nov)

- t01: ok (earlier agent). `/tts` 200 audio/mpeg for "Handovers go out fast..."; voice start to chat-closed 2.73 s (close lands 0.25 s before sentence 2 at 2.98). Not re-run this session.
- t03: ran ok (earlier agent). Tab names and montage geometry as in the table.
- t03b: ok, 22 marks, 39.7 s; frames 01 and 05 viewed (card 1 and the montage at 545 px wide). Frames 02 to 04, 06 and 07 not viewed.
- t06: ok after the edits (08:52 ring and preview gone, 11:15 card with From, To, Time, body, no verb buttons, no tally); list and card frames viewed.
- t06b: ok; card frame viewed (body fits after the `.tri-actions` hide).
- t07: ok unthrottled; bark 2 blocked, bark 1 plays through (above); frames at press + 1 s and bark + 5.6 s viewed. Marks: press 3.33 s, printout visible 3.39 s, bark start 5.78 s.
- t07b: ok; kiosk-buttons `["×","Look up","Carry on"]`; heading "Before the debrief"; strip Brief, Choices, Where it led, Defend (all done) and 5 Debrief; frame viewed.
- t07c: ok; frame viewed, both buttons in frame.

Unverified: no real-fps run of t01, t03 or the walking shots on the capture display; t07's printout position was only seen in the headless frame; `check-take.mjs` has not run (no capture).

## Recorded marks

| take | length | drop % | key marks (trimmed s) | checked against frames / notes |
|---|---|---|---|---|
| | | | | |

## Movement shots (25 Nov)

Survey: `docs/video/CA_MOVEMENT_B4.md`. Helper `tools/video/takes/lib/camlib.mjs`. **Proposed script written, not yet dry-run.** Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t08_yusuf_cooler (new, not yet dry-run) | fresh game, `--set kit_defend_done=true`; `kit_ca11_out` not set | read his settled post (near (96,224)); `followNpc(kit_yusuf_demir, lerp 0.08)`; `triggerNeed(thirst, 5)`; he walks to the water cooler (use point about (262,219), about 166 px), drinks 20 s, walks back; `followPlayer` | post-set, follow-on, need-set, walk-start, arrive, trip-distance, return-start, back, cam-summary, end | optional office insert near `panel` (v9); the existing `office` shot keeps his tray walk | His natural trip fires about 30 s after load, so a late start finds him mid-trip (the script refuses if he is not near home). After Look up his needs are suspended and he walks to the copier tray: record before the press. Trip length is an estimate from tiles |
