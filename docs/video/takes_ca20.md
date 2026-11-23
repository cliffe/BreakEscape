# ca20 takes (Working away from the office, take scripts and dry runs, 23 Nov; WIP)

Scripts in `tools/video/takes/ca20/` (`_ca20.mjs` holds helpers, seeds, HIDE_BUBBLES). Dry-run headless on a keyless server on :3452 (worktree b-ca-trailers-next), nothing recorded. BE_SPRITE not set (hooded sprite expected in dry runs). Real run line: `tools/video/takes/run-take.sh ca20 <take> "<flags>" "--hide-hud --zoom-step 1"`. Script retimed after voicing (ca0c574fc): blue_card 3.3, list 4.4, card 4.0, total 74.4.

Seeds (`SEEDS` in `_ca20.mjs`): defend = `--set episode_e20_remote_and_mobile_working_state={"done":["brief","mistake","flip"]}`; room and Chidi end = `--set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true` (never kit_key_caught or kit_caught).

## Take table (proven so far)

| take | entry state | actions | marks | used by | hides and hazards |
|---|---|---|---|---|---|
| t01_zainab_hook | fresh game | talk to `zainab_hussain`; lines 1 and 2 auto-advance (no Continue; only button "Skip [SPACE]"); line 3 is the hook; chat closed at l3 + 4.3 s | l1_start, l2_start, l3_start, h_in (l3 - 0.1), h_out (l3 + 3.89), bar-box, name-box, frame:hook-mid, tts-proof, chat-closed, end | hook | Bar prints the whole line 3 (box x360 y950 w1000 h90; dark band from y about 895): crop the picture to y 20 to 895 and burn the caption. POST /tts 200 audio/mpeg for all three lines. Chat opens with line 1 already playing (l1 start precedes the talk mark by about 1.3 s). |
| t02_brief (+ t02n narrow 560) | fresh game | open the kiosk, hold 7.2 s after kiosk-open | kiosk-open, brief-boxes, para-box, para-visibility (asserted hidden), frame:brief (+3 s), hold-end (+7.2 s), end | topic | Paragraph hidden (visibility). Frame: tab, heading, strip = bezel x580 y235 w760, crop to y 235 to 410. A dashed scope box ("Authorised exercise at Tarrowby Logistics, a fictional company...") sits at y 590 to 722, below the crop; Start at y 750 to 790. Narrow (560): the strip wraps to three rows ("5 Debrief" on its own row), heading y 373. Edit in = kiosk-open mark, out = +6.9 s. |

## Dry-run measurements (23 Nov)

- Strip labels: `1 Brief`, `2 Choices`, `3 Where it led`, `4 Defend`, `5 Debrief`. Tab: `TARROWBY` (blue). Brief buttons: `x`, `Start`.
- Zainab line starts (start to start): l1 to l2 7.0 s (l1 audio 6.44 s), l2 to l3 5.47 s (l2 audio 4.93 s), so l3 starts about 12.5 s after l1. Script estimate "about 12 to 13 s": matches. Line 2's game text is "Working on the road is normal and fine. It's the small things that catch people." (period, not semicolon).

## Still to write and dry-run

t03_choices_reveal (+ t03n narrow), t05_inbox_list (+ t05n), t06_room, t07_chidi_end. See the handover note in the scratchpad.
