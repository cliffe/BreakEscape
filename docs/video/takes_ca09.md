# ca09 takes (Passwords, Tarrowby Logistics): scripts written and dry-run, not yet recorded

Scripts in `tools/video/takes/ca09/` (`_ca09.mjs` holds the shared helpers, hides and the narrow CSS). Dry runs headless on a keyless server (:3454, worktree b-ca-trailers-next), no capture, `BE_SPRITE` unset (so the dry-run player is the hooded `female_hacker_hood_v2`; the real recording sets `BE_SPRITE=female_office_worker_v2` and the scripts throw if the sprite key is anything else). Screenshots of every mark in the dry-run folder (scratchpad `dry_ca09/`). Source plan: `docs/video/scripts/ca09_trailer_script.md`; scout `docs/video/scout/ca09_scout.md`.

Run each as `BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca09 <take> "<new-game flags>" "--hide-hud --zoom-step 1"`, new game per take (a used game opens on its saved stage). Pass `--set` JSON without single quotes.

Flags:
- Defend entry (t04, t04b): `--set episode_e9_passwords_state={"done":["brief","osint","guess","flip"]} --set guess_e9_landed=true`
- Step-away entry (t05): `--set episode_e9_passwords_state={"done":["brief","osint","guess","flip","defend"]} --set episode_e9_passwords_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e9_passwords_defend_percent=100` (no `kit_quiet` needed; C2 barked and C1 followed)
- t03: `--set guess_e9_landed=true`

| take | entry state | actions | marks to log | used by | hides and hazards |
|---|---|---|---|---|---|
| t01_nilesh_hook | none: fresh game, Skip tutorial, close the Brief | `interact('nilesh_solanki')`; the welcome plays in full; chat closed 0.2 s after it ends | welcome_start, welcome_end, n1b_start (only if it began), chat-closed, tts-response, end | hook | in = welcome_start + 2.55, out = + 7.65 (from silence detection: listen). The first interact is swallowed once (retried by `talkTo`). Crop the game subtitle bar; burn the two-part caption. The portrait shows Nilesh with no player portrait |
| t02_attack_run | none: fresh game | kiosk, Start, `Open the browser`, Friendface tab, People, Colin Mather (profile held 7 s, nothing noted); note team post, dog post, forum post (each with its "Noted: ..." line); About us, note the founding year; close browser; `Open the guesser`; step the four hidden common rows fast, the three pattern rows slowly, the reuse row until it opens; one extra hidden step (the passphrase row); `Switch the rig off` | kiosk-open, start, browser-open, friendface-tab, topic_start, note-team, note-pet, note-forum, about-open, note-about, browser-closed, guesser-open, hidden-steps-done, build_start, pattern-1..3, lands_start, reuse-opens, lands_end, final-step, switch, flip-up, end | topic, research, build, lands, flip | `GUESSER_HIDE_CSS` hides `[data-panel=common]` (prints 123456, qwerty), `[data-panel=passphrase]` (the answer) and `.epr-gs-live` (echoes every guess). The hidden rows still step. The take asserts at every guesser mark that none of that text is showing and throws if it is. Do NOT examine anything else in the room |
| t02b_attack_run_narrow | as t02 | as t02 with `NARROW_CSS(560)` (guesser card capped at 560 px) | as t02 | 9:16 and 1:1 versions of build and lands | the "did not work" status stays whole at 560 px (checked on the frames). The browser frame is NOT narrowed by the CSS (it stays about 1090 px wide); the Friendface text and "Click to note" buttons are whole in the wide frame, so crop the wide browser take for 9:16 with a cx check, not the narrowed one |
| t03_nilesh_flip | `--set guess_e9_landed=true` | `interact('nilesh_solanki')`; N2 plays (cut), then N3; chat closed after N3, before the choice menu | n2_start, n2_end, n3_start, n3_end, tts-response (one per line), chat-closed, end | nilesh_flip | the take throws if the first line is not N2 or N3 never follows. The first interact is swallowed once. No "playtest" portrait showed in the frame |
| t04_defend_list | Defend entry | `Open the inbox`, `Start`; list held 8 s (all eight rows, none sorted); pointer hovers down the five password-choice rows, no card open; click the first Sign-in prompt row, card "Are you trying to sign in?"; hover Approve, Deny, Deny and report (never pressed) | inbox-open, start, list-up, list-held-end, rows_hover_start, hover-row:1..5, rows_hover_end, click-prompt, card-open, verbs, hover-approve, hover-deny, hover-deny-report, end | triage | `DEFEND_HIDE_CSS` hides the team tally ("Risks reported or checked for the team: N"; the take asserts it is not showing). See the plan change below |
| t04b_defend_list_narrow | as t04 | as t04 with `NARROW_CSS(560)` (mail client capped at 560 px, verdict buttons stacked) | as t04 | 9:16 and 1:1 versions of triage | at 560 px the three verbs side by side clipped their words ("Approve", "password"), so `NARROW_CSS` now stacks them in a column (the game's own phone layout), checked on the frame. List rows are truncated to "Which pa..." and the account email wraps ("you@tarrowby.exa / mple"): acceptable, but the rows read less well than in the wide take |
| t05_chidi_note | step-away entry | open the kiosk (opens on the step-away panel), hold 1 s, press `Look up`; watch Chidi's barks; end 1.2 s after C1's bubble clears | kiosk-open, look_up, bubble-start/end:kit_chidi_okeke (both barks), other_bark_seen, c1_start, c1_end, frame:t+N every 2 s, tts-response, end | chidi_end | NEVER examine or interact with Chidi's PC (`kit_ca09_pc`): its examine text is the note's password. The sticky note on the screen is a tiny yellow square in the room frame, no readable text. The ask-cue menu comes later (timers run to 45 s): not reached |

## Plan changes (the script must follow these)

1. **t04 order and the card.** A card cannot be closed: a second click on the row keeps it open, and Esc closes the whole minigame. The take is therefore recorded in the order list held (a), password rows hovered with no card open (c), then the sign-in prompt card opened and hovered (b). The edit cuts these segments out of order: (a) then (b) then (c), taking (c) from the no-card segment. Only the Sign-in prompt card is shown (three verbs: Approve, Deny, Deny and report), not the four-verb lure card. The password rows do not need scrolling: all eight rows fit (list scrollHeight equals clientHeight), so "list scrolled to the password rows" is replaced by the pointer hovering down them.
2. **Hidden final step before "Switch the rig off".** `Switch the rig off` does nothing until every row has run, including the hidden passphrase row. t02 does one extra hidden step (`final-step`) first. The button first reads "Try the next guess (9 to go)": 4 hidden common rows, 3 patterns, reuse, passphrase.
3. **The flip is an overlay, crop it.** After the switch, the flip is a "Security Awareness" overlay, not the kiosk: heading "Now it's your phone." and the strip (Brief to Debrief) sit at y 100 to 240 of 1080, but the IT text and the tell ("deny what you didn't start") begin at about y 320. The edit must crop to y under about 300 (heading and strip only).
4. **Cards and Esc.** Do not try to close a card in any take (Esc ends the minigame).
5. **N3 length.** N3 plays 5.25 s here (the script says 5.33 s); N2 plays 5.79 s (script 5.86 s). Retime to the recorded marks.
6. **t04 hover length.** The password-rows hover ran about 6.0 s (the script plans about 4.5 s) and the card hover about 3.1 s (plan 2.5 s): the edit trims, or shorten the dwell in the script.
7. **Chidi.** The first bark is C2 ("That's me booted out. Wants a brand new password, of course.") 1.6 s after Look up; C1 follows at +6.0 s (bubble up 9.36 to 17.52 in the dry run, 8.2 s on screen; the voice clip is 6.46 s). The recorded window (look_up to C1 end) is about 14.4 s; cut C1 alone with the room frame. `watchVoice` does not see barks (its line list stays empty): use the bubble marks and `tts-response`.

## Dry-run results (24 Nov, headless, keyless :3454)

| take | result | what it proved |
|---|---|---|
| t01_nilesh_hook | passed | welcome voiced (line 7.86 s), POST /tts 200 audio/mpeg 68421 bytes; portrait up with both sentences in the subtitle; no player portrait, no "playtest" |
| t02_attack_run | passed, 48.8 s | marks: kiosk-open 2.34, start 3.55, browser-open 5.08, topic_start 7.81, note-team 16.0, note-pet 18.3, note-forum 20.55, about-open 22.71, note-about 24.68, guesser-open 27.57, hidden-steps-done 32.12, build_start 33.4, pattern 34.44/36.54/38.71, lands_start 39.77, reuse-opens 40.27, lands_end 43.53, final-step 45.15, switch 45.83, end 48.85. Hide proof held at every guesser mark. Topic frame: Colin's four posts, none noted |
| t02b_attack_run_narrow | passed | guesser at 560 px: rows and "did not work" status whole, the "Switch the rig off" button whole. The browser frame was not narrowed (see above); nothing clipped in it |
| t03_nilesh_flip | passed, 21.6 s body | N2 "Good. One reused password..." plays first (n2 8.55 to 14.34, 5.79 s), N3 "Now it's your turn in the seat..." follows (n3 14.88 to 20.13, 5.25 s); POST /tts 200 audio/mpeg for both (47709 and 47349 bytes); chat closed at 20.58 before any menu. Portrait frame: Nilesh, subtitle, no player portrait |
| t04_defend_list | passed, 19.8 s body | 8 rows, tally hidden; list-up 1.43, list held to 9.46, rows hover 9.46 to 15.45, card open 16.17 with verbs [Approve, Deny, Deny and report], hovers 16.72/17.63/18.59, end 19.75. No card during the row hover (asserted) |
| t04b_defend_list_narrow | passed (after the NARROW_CSS verdict-stack fix) | at 560 px the verbs are whole and stacked; list text truncated, see above |
| t05_chidi_note | passed, 19.1 s body | kiosk-open 2.33, look_up 3.33, C2 bubble 4.92 to 9.36 (POST /tts 200, 35949 bytes), C1 bubble 9.36 to 17.52 (POST /tts 200 audio/mpeg, 51165 bytes, "Right, sorted. New one's on a sticky note..."), end 19.07. Frame at +6 s: Chidi's bubble in the room, PC with a tiny sticky note, no readable password. Chidi's PC never touched |

No answer, grade, tell or real-looking password was visible on the key frames: the common-passwords and passphrase panels and the live log are hidden, the defend tally is hidden, the list shows no sorted state, the card shows only hovered verbs, and the flip frame heading and strip are cropped above the IT text.

## Recorded results

| take | length | drop % | key marks (trimmed s) | checked against frames / notes |
|---|---|---|---|---|
| t01_nilesh_hook | | | | |
| t02_attack_run | | | | |
| t02b_attack_run_narrow | | | | |
| t03_nilesh_flip | | | | |
| t04_defend_list | | | | |
| t04b_defend_list_narrow | | | | |
| t05_chidi_note | | | | |
