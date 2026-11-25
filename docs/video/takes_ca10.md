# ca10 takes (Fake downloads and checks): scripts and dry runs, 23 Nov 2026

Scripts in `tools/video/takes/ca10/` (`_ca10.mjs` shared helpers). Dry-run only (headless, throttled 20 fps, keyless server :3455, `--hide-hud --zoom-step 1`, no BE_SPRITE, so the player shows the hooded hacker in dry frames); nothing recorded. Game id comes from `tools/playtest/new-game.sh`; run each take on a fresh game. Recorded-results table at the foot is empty.

Step-away flags (t01, t07, t07b, t07c):
`--set episode_e10_downloads_and_fake_checks_state={"done":["brief","osint","build","write","flip","defend"]} --set episode_e10_downloads_and_fake_checks_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e10_downloads_and_fake_checks_defend_percent=100`

Defend flags (t04, t05, t05b): `--set episode_e10_downloads_and_fake_checks_state={"done":["brief","osint","build","write","flip"]} --set phish_order_colleague_attempts=1`

## Hook decision (script file not edited)

PLACEHOLDER (owner question): hook. The cooler chatter `kit_quayholt` never fires (`npc-needs.js _maybePair` needs two NPCs at the cooler; a lone drinker is silent) and NPC needs are not changed for a trailer. Replacement: **Anjali Rao** (`kit_anjali_rao`), person-chat opener, first sentence only: **"Had a device pulled for a dodgy download today."** (cached clip a7b76e87..., 6.17 s, speech 0.26 to 3.27 s by silencedetect, pause to 3.65 s; hook = audio start - 0.3 s, 3.4 s, so it ends at the sentence end plus 0.13 s, inside the 5.0 s limit). Sentence two ("The fake check looked genuine enough.") is a tell: never in the cut. Mild, true, no answer, no permission, not D1. Plays: POST /tts 200 audio/mpeg 47853 B, line voiced about 0.15 s after the portrait opens, chat opens via `__test.interact` (about 2 s after the take starts, no walk-up needed). Needs `kit_defend_done` (step-away flags) so the ink's ca10 knot runs. Take: `t01_anjali_hook` (old `t01_chatter_hook` moved to tmp/delete, removal staged).
Runner-up: Darren (`kit_darren_price`) "Had a laptop out of action this week." (first sentence of the same ink knot, cached a0f64bc..., speech 0.26 to 2.52 s of 5.33 s). Darren is also the end speaker, hence second. Weak alternatives: Niamh "Welcome back to the Quayholt exercise." (0.1 to 2.45 s).
Script changes: hook row text and speaker (Anjali), in = audio start - 0.3 s, 3.4 s (was 3.0 s); `t07c_room_chatter` becomes `t01_anjali_hook`; note that the hook is in the person-chat view (portrait and the game's text), not the room wide.

## Takes

| take | entry state | actions | marks to log | used by | hides and hazards |
|---|---|---|---|---|---|
| t01_anjali_hook | step-away flags; kiosk never opened | `interact kit_anjali_rao`, portrait up, line voiced; close the chat after the first sentence (closeBeforeMenu) | player-sprite, start-hold, npc_portrait_up, hook_start (audio start), hook_end (full line, 6.12 s), tts, chat-closed | hook | never click in the chat (choice "See you later."); cut at hook_start - 0.3, 3.4 s |
| t02_attack_run | none (fresh) | kiosk Start; `Open the browser`; Fernside tab (`.ob-site[data-site=fernside_site]`, block `blk_fernside_site`) noted first; back to the Quayholt tab (landing page is "Suppliers and ordering"), `blk_fernside_portal` noted last; close; `Open the page builder`; chips real-Fernside host, "Confirm you are human to continue to the order portal", "One quick step to continue", "A smooth, routine-looking accessibility check"; Score (read from the DOM, then hidden); `button.lpb-attach-btn` ("Attach to email"); `Open the mail client` (button label confirmed by the dry run), Compose; To "Leo Brennan (Operations colleague)"; From slots "Quayholt Operations" and operations@quayholt.example; pretext `e10_pretext_order_calm`; subject `s_order`; Send; "It landed" panel; Done; Re: row; close onto "Now it lands on a colleague" | start, browser-open, note-fernside, note-portal, research-portal frame, builder-open, host/pretext/urgency/step-chosen, scored (score 100, 4 passes), attached, mail-open, compose, to-line, slot1, slot2, pretext-set, subject-set, send, landed, reply-in, done, reply-open, mail-closed, flip-up, flip-held, end | research, build (as a second capture), lands, flip | HIDE: giveaway counter, Score rows, red-flag meter/advice/clean, checklist advisory, tallies, flip body (strip kept). Never Continue. First Send is final. No ask select exists (the composer's Ask is a fixed line) and no attachment or link |
| t02b_attack_run_narrow | none | t02 with the builder at 560 px (as t03b) and the mail client at 560 px | as t02 | 9:16 and 1:1 | same |
| t03_fake_check_builder | none | setup: both Fernside facts noted, close. Body: hold 1.5 s, `Open the page builder`, hold 2.2 s, the four chips as t02, hold 3 s. Never Score or Attach | start-hold, builder-open, host/pretext/urgency/step-chosen, hold-end, end | build | counter and Credibility rows hidden by CSS and checked at the end |
| t03b_fake_check_builder_narrow | none | t03 at 560 px, panes stacked | as t03 | 9:16, 1:1 | same |
| t04_niamh_flip | defend flags | `interact niamh_doherty` (the first interact reported no-effect, retry fine), N1 voiced, close before the menu | n1_start (audio), n1_end (7.93 s), tts, chat-closed | niamh_flip | throws if the first line is not N1; never click in the chat |
| t05_pages_list | defend flags | `Open the pages`, `Start`; 7 rows; hold the list 2.5 s; open the **09:20** row (genuine "I am not a robot" page at /login); hold 5 s. env CA10_LIST_ONLY=1 for a list-only run | kiosk-open, defend-panel, intro, list (7 rows), row_open, card, card-held, end | pages | HIDE .tri-verdicts and .tri-verdict-hint (CSS, so the buttons are not in shot), team tally. **Two rows read "From a bookmark: Fernside Catering order portal": 09:12 is the fake (keystroke steps), 09:20 is the genuine page; the take picks by time and throws if the card shows Press Windows/Ctrl+V.** The card's own Continue button is page content, not a verdict |
| t05b_pages_list_narrow | defend flags | t05 with `.mail-client` at 760 px, panes stacked | as t05 | 9:16, 1:1 | same |
| t07b_lookup_panel | step-away flags | open the kiosk (step-away panel, buttons "Look up", "Carry on"), hold 3.2 s; no click | kiosk-open, panel (buttons, text), hold-end | step_away | never click; tally hidden |
| t07c_lookup_panel_narrow | step-away flags | t07b at 560 px | as t07b | 9:16, 1:1 | same |
| t07_darren_prompt | step-away flags | open the kiosk, hold 1 s, `Look up`, wait for D1's bubble, end on a timer at D1 start + 4.5 s | look_up, d1_start (sSinceLookUp), d1_end (timer), tts, frame:t+N, globals | darren_end | D1's bubble stays up until D2 starts, so the take stops on a timer before D2; never click in the room |

## Dry-run results

- Kiosk button labels (DOM): Start; `Open the browser`; `Open the page builder`; `Attach to email` (`button.lpb-attach-btn`); `Open the mail client`; Done; defend panel `Open the pages`; step-away panel `Look up` and `Carry on`. Builder chips by label as in the scenario.
- Research: Quayholt landing page already is "Suppliers and ordering" with only `blk_fernside_portal`; the Fernside tab shows `blk_fernside_site`; no page links. Order used: Fernside first, portal last.
- Build score: all four picks give **Credibility 100 / 100**, four Pass rows, against linkThreshold 70 (read before Send; t02 throws below 70). The host pick is the genuine orders.fernside.example (preview address bar shows it); the genuine tick page opened in t05 sits on orders.fernside.example, so v8b "Same site as the page you built." holds.
- Mail: To "Leo Brennan (Operations colleague)" visible on the compose frame; Ask is fixed text "Place the order through the Fernside portal you've got bookmarked, as you always do."; "It landed" shows within 25 ms of Send.
- Leo's reply: `emailReplyDelay` 6 (CA0: the reply is an inbox mail behind the result panel, 1 s scheduler tick). Measured row in DOM at 6.5 s and 6.97 s after Send; after Done the "Re: This week's Fernside order" row opens and reads "Thanks, I'll put the order in now." **Lands variant off**: over the 6 s limit. Default lands = Send then the green panel with v5 only.
- t04: N1 voiced 7.93 s, POST /tts 200 (63573 B). t07: D1 starts 1.54 to 1.57 s after Look up (POST /tts 200, 32637 B), D2 audio request 5.4 s after D1 start; globals kit_quiet true, kit_ca10_out true after Look up. t01: hook plays 200 (47853 B).
- Frames looked at: composer (To line, no meter), flip heading, build picks (no counter or score), genuine card wide and narrow, hook portrait up. Not looked at: t07b and t07c frames, t02b composer, the hook frame closely (portrait text), the t03b narrow frame.

## Unverified

- Narrow takes (t02b, t03b, t07c) ran clean but only the 760 px t05b frame was inspected.
- No real-recording sprite check (BE_SPRITE) or A/V sync; the dry runs are throttled.
- t07b panel text beyond the first 200 characters; the "Carry on" button must stay out of any click.

## Recorded results

| take | length | drop % | key marks (trimmed s) | checked against frames / notes |
|---|---|---|---|---|

## Movement shots (25 Nov)

Owner note: the NPCs stand still on their spots. Helper `tools/video/takes/lib/camlib.mjs` (`followNpc`, `stopFollow`, `followPlayer`, `camState`, `triggerNeed`, `waitNpcMoved`), proved headless on keyless :3456: ca13 game 13362, Agnieszka forced to a coffee trip, camera scroll (-109,-104) to (-67,-4) as she walked (192,97) to (244,209), then back on the player at (-108,-2). Survey and scenario proposals: `docs/video/CA_MOVEMENT_B3.md`. All takes below are **proposed scripts, not written or run** (dry-run each; none recorded). Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t09_anjali_cooler (new) | step-away flags, kit_ca10_out not set | `followNpc(kit_anjali_rao)`; `triggerNeed(thirst, 5)`; she walks from (7.4,8.3) to the cooler (tile 8.2,5.6, drinks 20 s); `followPlayer` | follow-start, left-post, at-cooler, follow-end | hook (her chat is the current hook: this is a movement lead-in) | Trip not observed in the survey (estimated 40 s unforced); forced trip not proved here, only the ca13 equivalent. The cooler chatter never fires for a lone drinker (see Hook decision). After Look up, a `patrolOverride` sends her back to (7.4,8.3): a trip in progress ends with a walk home, a second movement shot (unproven) |

Dry run 25 Nov (step-away flags, headless, BE_DRY=1): PASS on attempt 3, game 13377. Attempts 1 and 2 (games 13375, 13376) stopped at the post check: Anjali stood at (245,233) on both fresh games, not at the surveyed (237,266). The take now uses her settled start position as her post (settle, 8 s limit) and logs `post-set`. Attempt 3: she walks from (245,233) 1.7 s after the thirst trigger, stops at (269,213) 1.1 s later, about 35 px short of the cooler tile (262,179), waits about 23 s and is back at (245,233). Camera: 102 samples while following, scroll start (-236,-38), end (-288,-72), range 21 by 20, back on the player at the end. The trip is a short step, not a walk to the cooler: check the cooler point before recording. Frames not looked at.

## t09 swap: Darren replaces Anjali (25 Nov)

`t09_anjali_cooler` is replaced by `t09_darren_cooler` (old script in `tmp/delete/ca10_t09_anjali_cooler.mjs`). Reason: Anjali settles at (245,233), about 30 px from the cooler's use point (262,219), so her drink trip is a step. The only other ca10 NPC with needs is Darren Price (thirst, `needsHome` `kit_ca10_pc`); Niamh has none. Darren's post is (100,185), 170 px or more from the use point.

Dry runs (headless, step-away flags, `BE_DRY=1`, keyless :3456, fresh game each): PASS on both, games 13440 and 13441. Post (100,185) both times; walk-start (131,204) and (128,201); arrival (269,213) and (271,213), 9 and 11 px from the use point; trip 171 and 173 px; back on the post (100,185); camera followed 118 and 120 samples (scroll range x 157 and 159, y 29), then back on the player; no errors. The script accepts arrival only within 48 px of the use point, so a mid-route pause cannot count as arrival (the ca06 t10 failure), and it requires a trip of at least 120 px. Take ids in the "Movement shots" table above that read `t09_anjali_cooler` now mean `t09_darren_cooler`. Run before pressing Look up: after `kit_ca10_out` Darren is in the D1 scene.

## Capture 25 Nov

Real captures, 1920x1080 30 fps, display :147, keyless server :3456, `BE_SPRITE=female_office_worker_v2` (every take logged `player-sprite` = that key), flags as in the seeds above (step-away for t01, t07, t07b, t07c, t09; defend for t04, t05, t05b; none for t02, t02b, t03, t03b), `--hide-hud --zoom-step 1`. Footage in `~/video-takes-local/ca10/takes/` (not in git), each file `<id>.trimmed.mkv` with `.trimmed.markers.json`, `.check.json`, `.contact.jpg`. All 13 passed the check (both slates found, A/V offset corrected as a constant, `fullFrame` true, no problems). Marks are in trimmed seconds. t05 run A is `CA10_LIST_ONLY=1` (list held), run B is the full take with the card; both renamed `_runA` and `_runB` straight after each run. Sidecars are still drafts. No frames were looked at beyond the check's own first-frame test; marks come from the scripts.

| take (file) | length s | drop % | A/V offset start/end ms | key marks (trimmed s) |
|---|---|---|---|---|
| t09_darren_cooler | 34.17 | 0.09 | -52 / -40 | walk-start 2.88, arrive 5.63 at (272,213), 12 px from the use point, trip 174 px, return-start 28.31, back 31.53 at (100,185), cam 121 samples, scroll range 160 by 31, back on player 33.72 |
| t01_anjali_hook | 10.30 | 0.27 | -40 / -37 | hook_start 2.47, portrait up 3.73, hook_end 8.59, chat-closed 9.04, end 9.84 |
| t07_darren_prompt | 10.80 | 0.26 | -62 / -48 | kiosk-open 2.89, look_up 3.90, bubble 5.49, d1_start 5.58, d1_end 10.20, end 10.33 |
| t07b_lookup_panel | 7.04 | 0.37 | -30 / -45 | kiosk-open 2.75, panel 3.36, hold-end 6.56 |
| t07c_lookup_panel_narrow | 7.07 | 0.36 | -43 / -47 | as t07b |
| t04_niamh_flip | 18.90 | 0.48 | -85 / -62 | n1_start 9.30, portrait up 10.62, n1_end 17.22, chat-closed 17.66, end 18.46 |
| t02_attack_run | 58.60 | 0.16 | -88 / -90 | start 4.16, browser-open 5.81, note-fernside 9.40, note-portal 12.95, browser-closed 15.69, builder-open 16.71, scored 28.35, attached 29.91, mail-open 30.97, compose 33.33, slot1 37.02, slot2 39.83, pretext-set 41.40, send 43.73, landed 43.77, reply-in 50.80, done 51.37, reply-open 53.67, flip-up 55.34, end 58.14 |
| t02b_attack_run_narrow | 58.14 | 0.17 | -93 / -93 | as t02 |
| t03_fake_check_builder | 15.04 | 0.58 | -62 / -70 | builder-open 2.12, host 6.17, pretext 7.85, urgency 9.51, step 11.56, hold-end 14.56 |
| t03b_fake_check_builder_narrow | 15.10 | 0.19 | -40 / -35 | as t03 |
| t05_pages_list_runA | 15.30 | 0.57 | -75 / -82 | kiosk-open 2.94, intro 5.53, list 6.84, list held to 14.84 (8.0 s) |
| t05_pages_list_runB | 17.17 | 0.17 | -53 / -37 | kiosk-open 2.97, intro 5.53, list 6.84, row_open 10.21, card 11.72, card-held 16.73 |
| t05b_pages_list_narrow | 17.14 | 0.52 | -77 / -62 | as t05 run B |

Findings: the t09 swap passed first time on the real capture. Anjali's t01 hook mark: hook_start is 2.47 but the portrait is up at 3.73, so cut from hook_start - 0.3 as the hook decision says and check the portrait frame. The t02 reply arrives 7.0 s after send (reply-in 50.80 vs send 43.73), over the 6 s limit noted for the lands variant; use the default lands cut.
