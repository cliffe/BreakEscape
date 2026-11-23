# ca20 takes (Working away from the office, take scripts and dry runs, 23 Nov)

Scripts in `tools/video/takes/ca20/` (`_ca20.mjs` holds helpers, seeds, HIDE_BUBBLES). Dry-run headless on a keyless server on :3452 (worktree b-ca-trailers-next), nothing recorded. BE_SPRITE not set (hooded sprite expected in dry runs). Real run line: `tools/video/takes/run-take.sh ca20 <take> "<flags>" "--hide-hud --zoom-step 1"`. Script retimed after voicing (ca0c574fc): blue_card 3.3, list 4.4, card 4.0, total 74.4.

Seeds (`SEEDS` in `_ca20.mjs`): defend = `--set episode_e20_remote_and_mobile_working_state={"done":["brief","mistake","flip"]}`; room and Chidi end = `--set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true` (never kit_key_caught or kit_caught).

## Take table (proven so far)

| take | entry state | actions | marks | used by | hides and hazards |
|---|---|---|---|---|---|
| t01_zainab_hook | fresh game | talk to `zainab_hussain`; lines 1 and 2 auto-advance (no Continue; only button "Skip [SPACE]"); line 3 is the hook; chat closed at l3 + 4.3 s | l1_start, l2_start, l3_start, h_in (l3 - 0.1), h_out (l3 + 3.89), bar-box, name-box, frame:hook-mid, tts-proof, chat-closed, end | hook | Bar prints the whole line 3 (box x360 y950 w1000 h90; dark band from y about 895): crop the picture to y 20 to 895 and burn the caption. POST /tts 200 audio/mpeg for all three lines. Chat opens with line 1 already playing (l1 start precedes the talk mark by about 1.3 s). |
| t02_brief (+ t02n narrow 560) | fresh game | open the kiosk, hold 7.2 s after kiosk-open | kiosk-open, brief-boxes, para-box, para-visibility (asserted hidden), frame:brief (+3 s), hold-end (+7.2 s), end | topic | Paragraph hidden (visibility). Frame: tab, heading, strip = bezel x580 y235 w760, crop to y 235 to 410. A dashed scope box ("Authorised exercise at Tarrowby Logistics, a fictional company...") sits at y 590 to 722, below the crop; Start at y 750 to 790. Narrow (560): the strip wraps to three rows ("5 Debrief" on its own row), heading y 373. Edit in = kiosk-open mark, out = +6.9 s. |
| t03_choices_reveal (+ t03n narrow 560) | fresh game | Start, "Make the choices"; five picks by label (unsafe each); beats 1 to 3 held (unpicked 0.9 s, pick, picked frame at +1.0 s, +1.3 s more), beats 4 and 5 picked and run through; hide CSS; "See where they led"; hold; "Continue"; Defend launch held | c1_shown, cN_shown, frame:cN-unpicked, cN_pick, frame:cN-picked (mid-hold), cN_card (option box), reveal, beat-boxes, led-crop, hidden-cards-proof, labels-left-visible, continue_click, flip, strip-box, para-visibility, defend-launch, frame:flip, end | pick_train, pick_call, pick_laptop, led_page, led_train, led_call, led_laptop, flip | Pick cards show BOTH options unmarked (the safe option of beat 3 reads "Thank them, and take the laptop and tablet with you": names the tablet; a viewer reads it, accept or crop). Montage: cafe_wifi (headline) and lost_tablet cards and .aw-montage-headline display:none; the tags hidden; borders neutral; the three cards are contiguous. Paragraph on the Defend launch hidden (visibility). Beats 4 and 5 never held. The Choices panel is the dark skin and is not the bezel: the 560 cap changes nothing on the pick cards, only the montage and flip panel. |
| t05_inbox_list (+ t05n narrow 560) | seed `defend` plus kit_quiet | open kiosk (Defend launch "Open the pages"), Start, list held, DOM click on the Wi-Fi page row, card held | kiosk-open, launch-panel, inbox-open, start, list-up, row-boxes, row-style, hidden-proof, frame:list, row_click, card-open, card-box, card-text, card-lines, card-state, frame:card, card-end | list, card | Team tally, progress, brief text, flags, verdict hints, .tri-actions hidden; pointer parked at (40,40), no hover. Row 0 had a focus background: neutralised by CSS (:focus background transparent). Frame the page card only (https bar, Padlock/Certificate buttons are visible, "I accept the terms", Connect). Fake, evil twin, hotel list and lost-device rows never opened. |
| t06_room | seed `room`, no kiosk | hold up to 40 s, mark the first walk to the drinks machine, stop 6 s after | player-start, bubbles-hidden-on, npc-home, walk_start (who), frame:walk-in/mid/out, pos-track, vending-box, mute-log, end | room | HIDE_BUBBLES on, all bark audio muted (none played: kit_quiet). Chidi walks first (thirst), Fatima did not within the 6 s tail. Hazard (open, see Script changes): the player stands in Chidi's path, the engine talk icon "..." (NPCTalkIconSystem) shows over him within 64 px of the player and he squeezes past the player. |
| t07_chidi_end | seed `room` | interact('kit_chidi_okeke') at once; line plays; closed about 5.6 s after | player-sprite, chidi-pos, talk-start, l_start, s1_est, s2_est, bar-box, frame:mid, chat-end, tts-proof, end | chidi_end | Else branch plays (kit_key_caught unset); the line is one game entry "Half my week's out of the van. You forget what's sat on that tablet if you leave it somewhere." (bar box x360 y950 w1000 h90; crop and burn timed captions). The line starts before the interact mark (about 1.3 s, as t01). |

## Dry-run measurements (23 Nov)

- Strip labels: `1 Brief`, `2 Choices`, `3 Where it led`, `4 Defend`, `5 Debrief`. Tab: `TARROWBY` (blue). Brief buttons: `x`, `Start`.
- Zainab line starts (start to start): l1 to l2 7.0 s (l1 audio 6.44 s), l2 to l3 5.47 s (l2 audio 4.93 s), so l3 starts about 12.5 s after l1. Script estimate "about 12 to 13 s": matches. Line 2's game text is "Working on the road is normal and fine. It's the small things that catch people." (period, not semicolon).


## Dry-run measurements (continued, 23 Nov)

- t03 buttons: Brief `x`, `Start`; then `Make the choices`; pick panel buttons `Next choice` (regex /^Next/ works); montage `Continue` (the montage's "See where they led" button was pressed from the last pick card and the heading is "Later that day"); flip panel button `Open the pages` (heading "Defend", strip ticks Brief, Choices, Where it led, then 4 Defend current). Timeline of one dry run: c1 pick at 6.1 s, c2 at 11.2, c3 at 16.2, reveal at 23.4, Continue at 29.4, end at 33.0.
- t03 montage layout (1920x1080 dry): the three cards at x 608 w 704, y 347 / 509 / 671, h 152 each, 10 px gaps; crop rect x 608, y 347, w 704, h 476. Narrow (560): x 708 w 504, y 344, h 548. Laptop card shows both consequence sentences ("The stranger was lovely and touched nothing. The couple at the next table, though, could read your open inbox for the whole four minutes you were at the counter."), tag hidden, no "Your call" left (asserted), no tablet or Wi-Fi-trap words visible (asserted). Each card also prints its situation question above the consequence in lighter text: the punch-in must crop to the dark consequence lines or accept the question (it matches the card "On the 07:42, you open the client list... Where do you work on it?").
- Strip on the flip panel: box x 592 y 407 w 736 h 46 (wide); narrow x 692 y 374 w 536 h 112 (wraps to three rows at 560 px: Brief, Choices, Where it led, Defend on two rows, Debrief on the third). Paragraph hidden asserted.
- t05: launch button `Open the pages`, then `Start`; list-up 4.3 to 4.6 s into the take, list held 5.15 s to the row click, card held 4.6 s from the click (frame mid-card at +2.4 s). Panel `.mail-client` x 480 y 20 w 960 h 900; narrow x 680 w 560. Row boxes x 522 w 285 h 52 at y 114, 170, 226, 282, 338, 394 (the Wi-Fi page row is the 4th). The page card: Padlock/URL/Certificate bar y 135 to 189, title y 218, text y 254, "I accept the terms" y 313, Connect y 344 to 384, all inside x 836 to 1358, y 120 to 397. Edit windows: list in = list-up (4.4 s fits in the 5.15 s hold), card in = row_click (4.0 s fits in the 4.6 s hold).
- t06: Chidi starts walking at about 15 to 16.5 s after the take starts (thirst 60 at 30/min, urgent at 50: 20 s on paper, observed about 15 to 16 s; headless, unthrottled), reaching the machine about 5 s later. In = walk_start - 0.5, out = in + 3.8. Fatima did not leave within the 6 s tail. Machine at room px (222, 239). Moving the player to a corner (tried: bridge.moveTo(60, 62), pointer false) shifts the camera and cuts the vending machine out of frame, so the player stays at its start (192, 198).
- t07: TTS 200 audio/mpeg (44565 bytes), line start 0.73 s into the take, line end 6.24 s (durMs 5515): in = l_start - 0.1, out = l_start + 5.43 holds. Sentence estimates (0.32 to 1.98, 2.47 to 5.23) not separately measured: the game and the bar carry one entry.

## Crops (for the edit)

- t01: crop y 20 to 895 (bar band dark from y about 895 hidden below), hook at about +12.5 s after line 1; see the t01 row.
- t02: crop y 235 to 410 (tab, heading, strip); the dashed scope box sits below at y 590 to 722; narrow: strip wraps to three rows at 560 px, heading y 373.
- t03 led page: crop x 608 y 347 w 704 h 476 (all three cards); per-card punch-ins at y 347 to 499, 509 to 661, 671 to 823 (x 608 w 704); narrow 560: x 708 w 504, y 344 h 548.
- t05 card: page card x 836 to 1358, y 120 to 397; list: x 512 to 816, y 105 to 440.

## Script changes

1. t06 room: the player starts in Chidi's route to the drinks machine and inside talk-icon range, so a "..." talk icon shows over Chidi and he walks through the player. Options for the edit or a retake: (a) accept, (b) hide the talk icon (it is not an npcWorldBubbles box; the class is NPCTalkIconSystem in npc-talk-icons.js, no global handle found), (c) move the player after finding a camera-safe park point (a corner shifts the camera). The shot's window still works (Chidi's walk from his desk). Unresolved: to be decided before the recording.
2. t03: the Choices panel and the pick cards are not the narrow bezel, so t03n differs from t03 only on the montage and flip panel (this is expected).
3. Montage cards print their situation question above the consequence: the punch-in crops to the dark consequence lines or keeps both. v5b to v5d match the consequence text.
4. Timings: blue_card 3.3, list 4.4, card 4.0 are met by the take holds (list 5.15 s, card 4.6 s). Chidi's line 5.52 s measured (script 5.43 + 0.1 in): fits.
5. Otherwise none.

## Recorded-results table

(empty; filled at the recording block)

## Unverified

- A real recording with BE_SPRITE (the dry runs use the hooded sprite); Fatima's first walk; the room shot's static fallback (Chidi walked every time); t05n and t03n were dry-run once (t05n before the row-0 focus fix, same code path).
