# ca00 takes (trailer, dry-run 23 Nov, not recorded)

Take scripts in `tools/video/takes/ca00/` (`_ca00.mjs` shared helpers; kiosk helpers come from `../ca12/_ca12b.mjs` via `../ca15/_ca15.mjs`). The montage (m_research, m_pretext, m_call, m_flip, m_sort) and the Delphine hook are reused from ca12 takes and have no ca00 script. Entry state for every take: a fresh game (`tools/playtest/new-game.sh ca00_first_play`, no flags). Run each as `BE_SPRITE=female_office_worker_v2 BE_PORT=<port> tools/video/takes/run-take.sh ca00_first_play <take> "" "--hide-hud --zoom-step 1"` with `FOOTAGE_ROOT=$HOME/video-takes-local`. **Player sprite must be `female_office_worker_v2`**: a dry run without BE_SPRITE gave the hooded hacker (as in ca15). The scripts throw on the hood unless `CA00_DRY=1` is set (dry runs only).

| take | entry state | actions | marks to log | used by | hides and hazards |
|---|---|---|---|---|---|
| t03_brief_cards | fresh game | interact `training_kiosk` (opens on card 1), mouse still, hold cards 1,3,4,6,7 for 7 s, card 2 for 9 s, card 5 for 2 s, `Next` between; stops on card 7 without pressing "Got it" | interact:training_kiosk, card1 to card7 (logged when "Card n of 7" is on screen; edit in point = mark + 0.2 s), end | welcome (card1), how (card2), real (card3), record (card4), habit (card6), report (card7) | no answers or grades on any card. Card 1 shows the scope note ("An authorised exercise at Quayholt Insurance...") under the text. The panel (bezel 760 px wide, centred at x 960 in the 1920 frame, over the dimmed room) changes height per card, so crop per shot. The strip shows one stage, "QUAYHOLT" chip plus "1 Brief" (resolves the scout's one-stage question). Button labels confirmed: Next, Back, Got it. The script's take times are estimates: re-time every in/out from the card marks (card n is about 7 to 9 s after card n-1, not the 8 s grid) |
| t03b_brief_cards_narrow | fresh game | same run as t03 with injected CSS (`NARROW_CSS`: `.epr-kiosk-bezel` width 560 px, inner containers fill it) | as t03, plus narrow-css, panel-width (560) | the same six card shots at 9:16 and 1:1 | bezel measured 560 px, centred at x 960 (683 to 1237), so a 607 px window centred on x 960 holds the whole panel with the text wrapped inside it. Heading of card 4 nearly fills the width: check the 1:1 crop |
| t01_room_wide | fresh game | no kiosk, no talk; hold 12 s at the spawn; watchBubbles | player-sprite, hold-start, bubble-start/end (none fired in 12 s), frame:hold-mid, frame:hold-end, hold-end | room | room occupies x 385 to 1343 of the frame (left of centre) with black either side, so crop to it. Darren seated left, Niamh beside, Anjali standing top, kiosk glow at right, cooler, player at the spawn (hood in the dry run only). No bubbles, no text on screen |
| t05_anjali_end | fresh game; setup() plays the brief off camera (kiosk, seven cards, Got it, closes the "Brief read" panel by bridge, Escape or the X) | interact `anjali_rao`; L4 plays; stop 0.34 s after it ends, before the reply menu | player-sprite, start-hold, line-start/line-end, frame:npc-portrait-up, l4_start, l4_end, chat-closed, end | anjali_end | refuses if the first line is not L4. Dry run: first line "That's you set. Start your first episode whenever you're ready, and report anything that doesn't sit right." voiced 2.28 to 8.88 s (6.60 s); portrait view with the game bar, Anjali's name and the Skip button; no "playtest" portrait. The kiosk's "Brief read" panel does not close with `minigame.close()` alone on the first try: the helper falls back to Escape and the X (the first dry run failed here, "minigame-active") |
| t02_darren_hello (fallback hook only) | fresh game | interact `kit_darren_price`; L1 plays; stop 0.3 s after | player-sprite, start-hold, frame:npc-portrait-up, l1_start, l1_end, chat-closed, end | hook, only if the owner picks Darren | dry run: "Welcome aboard. Good to have you on the floor with us." voiced 2.85 to 6.36 s (3.51 s). Cut in at l1_start - 0.2 |

## Dry-run results (headless, :3451, no capture)

- t03 and t03b ran to the end (about 49.6 s body): card marks at about 2.4, 9.6, 18.7, 25.9 s and on (the dry clock is slower than the capture's; use the recorded marks). Screenshots of cards 1 to 7 checked: correct panel, nothing spoiled.
- t01 ran to the end (12.0 s), no bubbles. t02 and t05 ran to the end; both lines played (the voice watcher saw TTS playback start and end, which needs a 200 answer with audio for the cached clip). The dry runs logged the hood sprite only because BE_SPRITE was not set.
- Scout open questions: one-stage strip is "QUAYHOLT" + "1 Brief" (fine); button names confirmed; no ambient bubble in 12 s; `--set` shortcut not needed (setup plays the brief for real, so the done flag is set by play).

## Plan changes and notes for the edit

- Hook: the cut from ca12 t06 is outside this script; confirm it by ear on the recorded clip, as the script says.
- 9:16 and 1:1 card shots use t03b, not t03; the montage shots stay as ca12's (flip chip crop is still open).
- Card 5 is held 2 s only and is not used.

## Recorded results

| take | length | drop % | key marks (trimmed s) | checked against frames / notes |
|---|---|---|---|---|
