# ca07 takes (Cloned voices, Brightwell Foods): scripts and dry runs, 23 Nov

Six scripts in `tools/video/takes/ca07/` (`_ca07.mjs` holds the shared helpers and the hide/narrow CSS; kiosk, bubble and subtitle helpers come from `../ca05/_ca05.mjs`). Scenario folder `ca07_voice_ceo` (the `_defend` twin is not used). Dry-run only so far (headless, no capture, keyless server on :3452, worktree b-ca-trailers-next, player shows `female_hacker_hood_v2` because BE_SPRITE is not set in dry runs; the recording sets `BE_SPRITE=female_office_worker_v2`). Nothing recorded yet.

Step-away flags (t01), `kit_quiet=true` is needed: G1's mapping is gated on it and `--set` does not fire the mapping that sets it:
`--set episode_e7_voice_ceo_state={"done":["brief","osint","write","flip","defend"]} --set episode_e7_voice_ceo_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e7_voice_ceo_defend_percent=60 --set kit_quiet=true` (keep the percent under 85: 85 and over sets `kit_caught`).

Defend flags (t03, t04, t04b): `--set episode_e7_voice_ceo_state={"done":["brief","osint","write","flip"]} --set phish_ceo_voice_target_attempts=1` (the kiosk opens on the Defend panel; Agnieszka's first line is A1 only when the attempts global is above 0 and defend is not done).

t02 and t02b: fresh game, no flags.

Pass `--set` as separate words in the run-take command line (the JSON value has no spaces).

| take | entry state | actions | marks to log | used by | hides and hazards |
|---|---|---|---|---|---|
| t01_graham_call | step-away flags | open the kiosk (opens on "Before the debrief"), press `Look up`; never click in the room, never open the chat or examine the PC; hold to G2 end + 0.4 s (the ask is a world bubble, no menu appears) | look_up, bubble-start/end (text), bark1_start, bark2_start, bark2_end, audio-start/end per NPC, tts (status, bytes, content-length), end | hook (G1), office (G2) | World bubbles, not person-chat. Barks from the same NPC queue: G2 waits for G1 to finish. The bubble for G1 stays up until G2 starts. Graham sits at his desk (seated frame), the bubble is above him. The kit's ask opens no chat in the take; do not click or the choice menu ("Hang up" / "Go ahead", 45 s timer) opens |
| t02_attack_run | none | kiosk Start, `Open the browser`: note Ravinder on Leadership, Friendface, his profile, note the Leeds post, Our team (Tom noted), Finance update (payment noted), close; mail client, Compose, From slots (name, address), Pretext set with the drop-down closed, payment slot, Send, result panel, close the mail client about 4.4 s after Send; never press Continue, never open Tom's reply | start, browser-open, note-ceo, ff-open, ff-profile, note-post, note-tom, note-payment, browser-closed, mail-open, compose, slot1, slot2, pretext-set, slot3, redflags:n, build-held, send, landed, landed-held, mail-closed, flip-up, flip-held, end | research, build, lands, flip | CSS hides (ATTACK_HIDE): Red flags list, sub line, advice line and clean line (the counter box and number stay), the Ask row text ("keep it between us"), the result panel's Advisory line (it quotes the ask), the flip body under the heading. The script throws if "keep it between us" is visible at the build or landed marks. The closed pretext drop-down shows "I need the supplier payment due this week pushed through today while I'm off-site. It's signed off at my end, ..." (accepted: the drop-down is closed and the text is cut off). The result panel still shows "Their reply is on its way" and "In real life a reply to this would land in Ravinder Sandhu's own inbox": crop or accept |
| t02b_attack_run_narrow | none | t02_attack_run with NARROW_MAIL and NARROW_BROWSER (560 px) | same as t02 | 9:16 and 1:1 cuts of research, build, lands | Browser frame is `.osint-browser-game-container` (1100 px; `.ob-root` is the content inside it); narrowed to 560 px with `min-width: 0` and `max-width: 100%` on its children it stacks cleanly (site tabs, Friendface profile and post fit, noted banner visible). The mail client narrows with the ca05 recipe; the mail toolbar needs `flex-wrap` (otherwise the Compose button hangs outside the frame at the top right) and the X and `.se-overlay-close` are hidden (the X is placed against the 960 px frame and floats outside the 560 px one). The script closes with `bridge.minigame.close()`, so hiding the X changes nothing |
| t03_agnieszka_flip | defend flags | walk to Agnieszka (key legs), interact; A1 plays, the script stops and closes the chat before the menu; never opens the kiosk | start-hold, player-sprite, walk-start, leg:*, walk-end, talk, frame:npc-portrait-up, a1-subtitle-start, a1-audio-start, a1-audio-end, tts, chat-closed, end | agnieszka_flip | The script throws if the first line is not A1. The person-chat shows the full A1 text on screen from the start (both sentences), so the cut at +2.80 s into the audio still has sentence one on screen: frame it as audio only, or accept. The black background is the chat view with no room background in the headless run: look again in the real capture |
| t04_finance_line | defend flags | kiosk, `Open the voicemail`, Start. Run A (`CA07_LIST_ONLY=1`): hold the five-row list 8 s, open nothing. Run B (default): hold the list 3.5 s, click the genuine Ravinder 13:05 voicemail row, hold the card 5.5 s; press nothing | kiosk-open, defend-panel (buttons), intro, list (rows), row_open (cloned false), card-held, list-held, end | topic (run A), triage (run B) | Transcript hidden by CSS (`.tri-transcript` and `.tri-call-transcript`, plus a wildcard on "transcript"; the "Transcript" heading stays, the body is empty). The tally badge and the "Phish stopped for the team" text are hidden. The cloned row (07700 900771) and the "Need this paid today" email are never opened. The card shows the four verb buttons (Trust, Report, Delete, Verify) unpressed |
| t04b_finance_line_narrow | defend flags | t04 with NARROW_MAIL | same as t04 | 9:16 and 1:1 cuts of topic and triage | Stacks as list over card; all five rows fit, the card with the waveform and the four verb buttons fits. A faint empty box sits at the top right of the header (the old close-box position): crop or ignore |

## Dry-run results (23 Nov)

**t01_graham_call** (game 12393). G1 bubble at look_up + 1.59 s (look_up 3.35, bubble 4.94), audio start +1.81 s, ends +4.50 s (clip 2.68 s, not the 2.74 s the script assumed; the fixed 3.34 s hook window becomes G1 start - 0.3 to G1 end + 0.3 = 3.28 s). POST /tts 200, `audio/mpeg`, content-length 22773. G1's bubble stays up until G2 begins (bubble end at +6.75 s). G2 bubble at +7.13 s (10.48), clip 6.76 s, audio ends +13.87 s, bubble clears at about +15.0 s (18.35). POST /tts 200, content-length 55941. The ask bark is a world bubble (no person-chat, no person-chat-opened mark, no menu in the take); at the end `kit_ca07_asked=true` and `call_choice` is empty. Same-NPC barks queue (G2 starts 5.5 s after G1 as planned). Office in-point = G2 audio start - 2.1 s. Frames checked: Graham seated at his desk, bubble above him, Agnieszka and Brightwell room visible, no "playtest" portrait, no HUD.

**t02_attack_run** (fresh game). Ran clean after two script fixes (below). Marks, seconds from take start (run to run within about 1 s; the first two runs were within 0.5 s of this):

| mark | t | | mark | t |
|---|---|---|---|---|
| start | 3.6 | | compose | 23.3 (redflags 4) |
| browser-open | 5.1 | | slot1 (sender name) | 27.0 |
| note-ceo | 7.3 | | slot2 (address) | 30.2 (redflags 3) |
| ff-open | 8.9 | | pretext-set | 31.8 (redflags 4) |
| ff-profile | 10.2 | | slot3 (payment) | 34.9 (redflags 3) |
| note-post | 11.5 | | build-held | 37.1 |
| note-tom | 15.9 | | send | 37.8 |
| note-payment | 18.8 | | landed | 37.8 (2 to 4 ms after Send) |
| browser-closed | 20.1 | | landed-held | 40.8 |
| mail-open | 21.1 | | mail-closed | 42.3 (4.46 s after Send) |
| | | | flip-up | 42.3, flip-held 44.8, end 44.8 |

Research: note-ceo to note-post is 4.3 s (the script plan said about 3.5 s: cut at note-ceo + 3.5 s lands on the Friendface profile before the post is noted, so the v3b line "His post says he's in Leeds all week" has its picture at +4.3 s; cut there instead). Red flags counter: 4 on opening, 3 after the address (the From line forged flag drops out), 4 after the pretext, 3 after the payment slot; slot options were single entries ("Ravinder Sandhu", "ravinder.sandhu@brightwellfoods.example", "the supplier payment due this week"). The result panel appears at the moment of Send (no delay), so "Send click" and "He would take the call" are within 0.1 s. Tom's reply did not show before the close (no reply-seen mark). Hides proven in the frames: the Ask row empty, the Red flags box shows only the heading and the number, the result panel shows three green ticks and no Advisory line, the flip screen shows the Security Awareness frame, strip (Brief, Research, Write ticked, 4 Your message) and the heading "Now it lands on you" with nothing under it.

Script fixes made (in `_ca07.mjs`, committed with this doc): the Red flags line is `.mail-redflag-advice` (and `.mail-redflag-clean`), not only `.mail-redflag-list`; the result panel's Advisory (`.mail-checklist-advisory`) quotes "keep it between us" and had to be hidden (the first run tripped the script's own check).

**t02b_attack_run_narrow** (fresh game). Same marks as t02 (within 0.5 s). Browser narrowed to 560 px stacks cleanly with `NARROW_BROWSER` (new constant, wired into t02's narrow path); mail narrowed 560 px with the toolbar wrapped. Frames checked: Friendface profile with the noted post, composer with all slots filled (Ask empty, counter only), result panel (no Advisory), no stray close controls after the fix.

**t03_agnieszka_flip** (defend flags). A1 is the first line (walk 1.5 to 2.4 s, line starts 8.79 s, the first `interact` attempt reported `no-effect-confirmed` but the chat had opened: harmless). Audio 8.79 to 18.36 s (9.57 s). POST /tts 200, `audio/mpeg`, content-length 77181. In-point 2.80 s into the audio (a1-audio-start + 2.80 = 11.59 in the dry run). Sentence-2 subtitle mark is logged at the same time as sentence 1 (the whole text is on screen at once). The chat is closed at 18.8 s, before any menu, and the take ends at 19.8 s. Frame: Agnieszka's portrait on the right, name and the full A1 text, Skip button; no kiosk.

**t04_finance_line** (defend flags). Launch button is "Open the voicemail" (the panel has only the X and that button). After Start: five rows, "0 of 5 sorted": Ravinder Sandhu 13:05 Voicemail (0:24); 07700 900771 (not in your contacts) 14:48 Voicemail (0:38); Lindiwe Mokoena 15:20 Voicemail (0:31); Ravinder Sandhu 15:31 "Need this paid today"; Adaeze Okafor 15:44 "Marsh End Eggs: new bank details (confirmed by phone)". Run A (list only): kiosk-open 2.3, defend-panel 3.5, intro 5.7, list 6.9, held to 14.9 (8 s). Run B: row_open 11.1 (`cloned: false`), card at 12.6, card-held 16.6, end 16.6. The row selector was tightened to `/Ravinder Sandhu.*13:05.*Voicemail/i` (the old pattern matched the 15:31 email row too). The card is "VOICEMAIL / Ravinder Sandhu / Ravinder (mobile), in your contacts, 13:05, 0:24" with the waveform and an empty transcript area; the genuine card only. Verdict buttons are visible and untouched.

**t04b_finance_line_narrow** (defend flags). Same marks as t04 run B (within 0.1 s); list and card stack in the 560 px frame, five rows and the four verb buttons fit.

## Take plan changes

- Hook window: G1 clip is 2.68 s, so 3.28 s (not 3.34 s) if the window is G1 start - 0.3 to G1 end + 0.3.
- Research cut: note-ceo to note-post is 4.3 s, not about 3.5 s.
- Agnieszka's A1 clip is 9.57 s in the capture (the script doc says 9.62 s); the sentence-2 audio window 3.00 to 9.23 s assumes the cached clip, re-check against the real take.
- The result panel's "Their reply is on its way" and "In real life ..." lines stay on screen (they are not tells); the Advisory line is hidden.
- No game change needed for any take. Run the real capture with the BE_SPRITE avatar and re-check the t03 background and the t02b narrow frames at 1x.

## Recorded results

| take | length | drop % | key marks (trimmed s) | checked against frames / notes |
|---|---|---|---|---|
| t01_graham_call | | | | |
| t02_attack_run | | | | |
| t02b_attack_run_narrow | | | | |
| t03_agnieszka_flip | | | | |
| t04_finance_line (run A, list) | | | | |
| t04_finance_line (run B, card) | | | | |
| t04b_finance_line_narrow | | | | |
