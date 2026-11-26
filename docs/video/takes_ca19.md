# ca19 takes (Malware, ransomware and updates, Quayholt Insurance): take scripts written and dry-run, not recorded

Status 23 Nov 2026: scripts in `tools/video/takes/ca19/` (helpers `_ca19.mjs`), each dry-run headless on a keyless server on :3451 (worktree b-ca-trailers-next) with nothing captured. Script: `docs/video/scripts/ca19_trailer_script.md`, scout: `docs/video/scout/ca19_scout.md`. Run each as `tools/video/takes/run-take.sh ca19_malware_and_updates <take> "<new-game flags>" "--hide-hud --zoom-step 1"` (new game per take, `--set` JSON without single quotes, FOOTAGE_ROOT as for ca15). The player sprite must be `female_office_worker_v2` (BE_SPRITE) in the real run: `sprite()` in `_ca19.mjs` throws on the hooded hacker unless BE_DRY=1 (the dry runs saw `female_hacker_hood_v2`, expected). Never talk to Niamh; no verdict is ever pressed.

Seeds (the same strings as `SEEDS` in `_ca19.mjs`; ST = `episode_e19_malware_and_updates_state`):
- flip: `--set ST={"done":["brief","mistake"]}` (the kiosk opens on the montage page, button `Continue`)
- defend: `--set ST={"done":["brief","mistake","flip"]}` (opens on the Defend panel, `Open the inbox`)
- stepAway: `--set ST={"done":["brief","mistake","flip","defend"]} --set episode_e19_malware_and_updates_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e19_malware_and_updates_defend_percent=60 --set kit_quiet=true` (`--set` fires no events, so `kit_quiet` is seeded by hand; percent under 85)

| take | entry state | actions | marks | feeds | hides and hazards |
|---|---|---|---|---|---|
| t01_anjali_hook | none (fresh game) | 5.2 s start-hold, `interact('anjali_rao')`, welcome plays, chat closed at start + 5.6 s | voice start (audio onset), bar boxes, tts | hook | Crop the bar above y850 (bar box x360 y905 w1000 h135; name box y875) and burn the caption "I'm the one who gets the call / when something looks wrong." plus the plate "Anjali, information security". The bar prints the whole first line, "Anjali Rao, information security. I'm the one ... miss something." Hook in = start + 2.48, out = start + 5.48 are ESTIMATES from the cached mp3 (headless gives voice-start only): measure the real audio onset at capture and re-check "and" (5.57) is clear, -40 dB, 30 to 40 ms fade out |
| t02_brief, t02b_brief_narrow | none | open kiosk, hold 6.3 s, `Start` never pressed | kiosk-open, brief-boxes, para-box, para-leak-check, frame:brief | topic (1 to 5.8 s) | Brief paragraph hidden (`visibility:hidden`, proven by textContent). **The dashed scope box ("Authorised exercise at Quayholt Insurance, a fictional company ... nothing here is real malware.") stays visible** at y about 625 to 735, below the tab, heading and strip: keep it out of the crop or accept it (it is the authorisation note and harmless). Strip text "1 Brief 2 Choices 3 Where it led 4 Defend 5 Debrief", tab QUAYHOLT purple, heading "Quayholt Insurance" [608,350,704,40]. **Narrow (560 px bezel [680,177,560,726]): the strip wraps to two rows (h 112), so 9:16 must cover y241 to y353** |
| t03_choices_reveal, t03b_choices_reveal_narrow | none | `Start`, `Make the choices`. Beat 1 pick "Remind me tomorrow" (filmed: c1_pick about 6.0 s), Next; beat 2 "Leave it, and report it" and beat 3 "Leave protection on and tell the service desk what it found" off camera; beat 4 pick "Leave it on the desktop" (filmed: c4_pick about 16.2 s); `See where they led`; hold the montage 13 s | c1_shown, c1_pick, c4_shown, c4_pick, reveal, beat-boxes, trim-log, labels-left-visible, hidden-cards-proof | pick_restart, pick_save, led_page, led_restart, led_save | Options are elements (`pressEl`). Montage: tags hidden, borders neutral, enable_content and security_alert `<li data-beat>` display:none (proved: no "credit note", "saved passwords", "Quayholt Protect caught" text visible), restart line trimmed in the DOM to its first sentence (trim-log shows before/after), save card left whole (both sentences visible: proof `saveBoth` true). Each montage card also shows its situation line (grey, "Your Quayholt laptop, mid-afternoon: ...") above the result line: the heading crop should include it or the punch-in crop to the result line only. Beat card DOM ids are `restart_prompt`, `enable_content`, `security_alert`, `save_location` |
| t04_flip, t04b_flip_narrow | flip seed | open kiosk, montage cards display:none, `Continue`; hold | kiosk-open, open, press (open + 1.5 s), after-press (boxes), intro-proof, frame:open, frame:flipped | flip (0 to 3.0 s) | Defend intro ("That's where the afternoon went. ... tell me.") hidden (proof visibility hidden). **The panel heading is "Defend", not "YOUR TURN"**; button `Open the inbox`; strip ticks "3 Where it led (done)", tab 4 Defend. The bezel recentres after Continue (box [580,355,760,370]): crop from the strip down |
| t05_inbox_list, t05b_inbox_list_narrow | defend seed | `Open the inbox`, `Start`; list held 3.4 s; mouse-click the 13:24 row by subject; hold 6.4 s | list (rows, boxes, progress), list-held, row_open, card-body-proof, card-held | inbox | **Row order is oldest first: Piledocs 13:20, Quayholt Apps 13:24, Leo Brennan 14:05, Fernside Catering 14:40 (attachment icon), Quayholt IT Support 15:10, Quayholt device management 15:30.** Progress "0 of 6 sorted". Piledocs row has the focus ring at first. Body, `.tri-actions`, verdict hints hidden (proof). Card shows From "Quayholt Apps <apps@quayholt.example>", To, Time 13:24 under the subject. 760 px narrow shows full subjects on the list, including 15:30 "Updates installed: restart within a day" and 15:10 "Action needed: allow the required update": for 9:16 crop to the 13:24 card and rows 1 to 2, or accept (script decision). The Leo row sits directly below the genuine row in both |
| t06_lookup_panel, t06b_lookup_panel_narrow | stepAway seed | open kiosk, hold 4.6 s, never press | kiosk-open, panel (boxes), globals-before, frame:panel, globals-end | look_up | **Heading is "Before the debrief", strip shows all four ticked, tab 5 Debrief; buttons `Look up` and `Carry on`** (both in frame, `Carry on` skips: harmless but visible). Text: "Look up from the kiosk to see how a case like this plays out here. It takes a few seconds, and your place is saved." Take throws if `kit_ca19_out` gets set |
| t07_niamh_end | stepAway seed | open kiosk, `Look up`, run to bark_start + 7 s | press, out, there, bark_start, darren_first_sound, frame:t+N each 1 s, mute-log, speech-bar-proof, tts, globals-end | niamh_end | Niamh's bubble and every world bubble hidden; Darren's audio muted (ca03 method); the DOM speech bar `#npc-speech-container` hidden by CSS |

## Dry-run results (23 Nov, :3451, headless, not recorded)

- t01, t02, t02b: proved earlier (commit bb6a8f470); t02b narrow frame not viewed, strip wrap noted above.
- t03 and t03b: ran clean (20 marks); frames c1-picked and reveal viewed. Picks highlight, montage shows the two trimmed cards with tags hidden and neutral borders, `Continue` present. The "Where it led" strip step is active.
- t04 (flip) clean; the intro is hidden and the "Defend" panel with `Open the inbox` frame viewed. t04b (follow-up, flip seed then Continue) ran clean, 10 marks: Defend panel with `Open the inbox`, bezel 560 px, strip wraps to two rows at y386 to y498 (9:16 must cover the strip, about y386 to y498), intro box hidden (intro-proof hidden), no portrait, nothing spoiled; frames open and flipped viewed.
- t05, t05b clean; list and card frames viewed (narrow card viewed).
- t06 clean; the wide frame viewed; t06b ran and its frame was viewed (follow-up): "Before the debrief" panel, bezel 560 px, strip two rows, `Look up` and `Carry on` shown, never pressed (kit_ca19_out and there stayed false), no portrait.
- t07: POST /tts 200 audio/mpeg for both barks. Timing from the press: `out` +0.05 s, `there` (Niamh arrived) +1.92 to 1.95 s, `bark_start` +1.92 to 2.09 s, so bark_minus_press is about 2.0 s and the shot in = max(bark - 1.3, press + 0.1) is about press + 0.7 s (the walk is mostly in the shot; she is at her stop by +2 s). Niamh's audio is 5.12 s. **Darren's first sound is 4.4 to 4.5 s after Niamh's bark start**, 0.4 to 0.5 s BEFORE the script's out point (bark + 4.92) and the script's estimate (4.82); his audio is on a different element from Niamh's (no clipping, no play() wrap needed). The mute holds (maxVolWhilePlaying 0, peak 0, allMuted true in the second run). **Finding: Darren's bark also draws the DOM speech bar at the bottom ("Darren Price: Mine's still running ...") about 0.6 s before the cut.** The world-bubble hide does not touch it; the take now hides `#npc-speech-container` by CSS (proof `speech-bar-proof` visibility hidden). Niamh's bark did not draw that bar in frames t+2 to t+6. Niamh's position samples returned null (my accessor, not measured); in frames she stands at her stop beside Darren's desk by t+2, so the "walks back during her last 1.8 s" claim is not confirmed in frame (checked to t+9: still standing there, Darren walking at t+7). Her `needs: resume` fires 3 s after arrival, which is after the cut at bark + 4.92 only by about 1 s; re-check in the real run.

## Script changes needed

- Tab names in the script: Defend panel heading is "Defend" (not "YOUR TURN"); the step-away panel heading is "Before the debrief" with `Look up` and `Carry on` buttons (not "THE TRAINING ROOM").
- Inbox list order is oldest first (Piledocs 13:20 on top), not newest first; the genuine 13:24 row is second.
- niamh_end: Darren's first sound is about 4.45 s after Niamh's bark start, so the cut at bark + 4.92 would include 0.45 s of his (muted) bubble: hidden in the take, so only the audio mute matters. Keep the mute.
- Montage cards show the situation line above the result line; decide whether the punch-in crops it.
- 9:16 list view shows full subjects (including the 15:30 one); crop or accept.

## Unverified

- Real audio onsets (hook in/out, Niamh bark_start, Darren first sound) under capture with live audio.
- Niamh's walk-back timing and her screen position (probe returned null).
- t01 hook caption crop not recorded.

## Recorded results

Captured 25 Nov, serial, display :147, keyless server :3456, `BE_SPRITE=female_office_worker_v2`, `--hide-hud --zoom-step 1`. Footage in `~/video-takes-local/ca19/takes/` (`video_out/ca19/takes` symlinked, gitignored). Full scenario id `ca19_malware_and_updates`. Every take passed on the first attempt, no retries. Residuals are the constant-offset-corrected A/V values from `check.json`. Sidecars are drafts (Step 6 not done).

| take | length (s) | drop % | residual A/V start / end (ms) | /tts | contact sheet and notes |
|---|---|---|---|---|---|
| t01_anjali_hook | 20.00 | 0.45 | -9 / +9 | 1 request, 200 audio/mpeg | Portrait from about 13 s. The bar prints the whole line (edit crops or captions it). The `interact` mark logged `ok: false` (no-effect-confirmed) at attempt 0, but the portrait came up 0.9 s later. |
| t02_brief | 10.50 | 0.26 | +5 / -5 | none | Brief. The dashed scope box sits below the crop; keep it out or accept. |
| t02b_brief_narrow | 10.47 | 0.80 | -4 / +3 | none | Narrow bezel, strip wraps to two rows. |
| t03_choices_reveal | 34.04 | 0.09 | +2 / -3 | none | Picks, montage, "Later that afternoon". |
| t03b_choices_reveal_narrow | 34.07 | 0.09 | +9 / -9 | none | Same at narrow width. |
| t04_flip | 11.70 | 0.24 | +10 / -10 | none | Montage then Defend panel. |
| t04b_flip_narrow | 11.97 | 0.24 | +6 / -6 | none | Same at narrow width. |
| t05_inbox_list | 17.44 | 0.51 | -10 / +10 | none | Inbox list and card. |
| t05b_inbox_list_narrow | 17.80 | 0.50 | +1 / -1 | none | Narrow. Full subjects show on the list (see open items). |
| t06_lookup_panel | 8.00 | 0.33 | -5 / +4 | none | "Before the debrief", not pressed. |
| t06b_lookup_panel_narrow | 8.14 | 0.98 | -3 / +2 | none | Passes, but 0.98% dropped is close to the 1% gate. |
| t07_niamh_end | 13.97 | 0.62 | +8 / -9 | 2 requests, both 200 audio/mpeg | Niamh and Darren's barks (Darren's bubble and speech bar hidden per script). Niamh stands at her desk in the frames. |

**Open items**
- t06b drop is 0.98%, under the 1% gate but close. Re-record only if the edit needs it.
- Seated NPCs: Niamh is shown standing at her desk in t07. Not confirmed at full size. Darren not checked. No other take shows an NPC who should sit.
- On-screen text: the t01 subtitle bar prints the full hook line (crop or caption at the edit, as the script says). The t02 scope box is visible below the crop. The t05 and t05b lists show full subjects, including "Updates installed: restart within a day" in the 9:16 view. Decide crop or accept at the edit.
- Sidecars (`.take.json`) need Step 6. Full-size frame checks for stance and text not done; contact sheets only.
- No script changes. The `checkSprite` and `spriteCheck` imports resolve in both ca19 and ca20 (every take module links).
