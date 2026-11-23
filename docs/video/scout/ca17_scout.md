# ca17 Acceptable use: trailer scout (DESK SCOUT, 23 Nov 2026)

Defend-only episode (variant `defendOnly`, tier S, Tarrowby Logistics). Nothing was run: no server, no browser, no TTS, no recorded take. Everything below is read from `scenarios/ca17_acceptable_use_defend/` (mission.json, scenario.json.erb, ink), the kit ink, the sort-drill and episode-runner code, the `tts_cache/ca17_acceptable_use_defend/` sidecars (clip lengths by ffprobe, silences by ffmpeg silencedetect at -35 dB, 0.12 s), and the ca15 scout and take scripts for the entry-state patterns. Cached means a sidecar with the exact text and an mp3 exist; no live `/tts` request was made, so "200" is not confirmed.

## Headline

- No attacker, no flip, no step-away, no debrief footage wanted. Strip is three steps (Brief, Defend, Debrief; stage ids `brief`, `defend`, `debrief`). The USP of the course (build the attack first) cannot be shown here, so the trailer sells what the episode has: the "can I?" sort, a short inbox, a living depot office, and a host whose line is "every rule here has a because".
- Content: a sort drill of 22 cards, 9 drawn per round (`drawCount 9`, one of each answer first), three bins (Allowed, Not allowed, Ask first), the reason showing straight after each pick. Then a six-message inbox (`e17_acceptable_use_inbox`; Trust, Report, Delete, Verify). Scoring "completion"; no clock.
- Cast: Nilesh Solanki (service desk, the host, standing at his desk), Fatima Begum and Chidi Okeke (both with a thirst need and chatter pools, at table positions, so the drinks-machine walk is the office life).
- The outline's end line ("Every rule here has a 'because'.", Nilesh) is host talk, so the script uses it as the cold open (its sentence 2 names the point, sentence 1 names the speaker) and ends on a depot moment instead.

## Set pieces

| # | Set piece | Entry state | Status |
|---|---|---|---|
| S1 | Training room wide, staff at their places, drinks machine, kiosk glow | fresh game via `tools/playtest/new-game.sh`, Skip tutorial, close Brief, `--hide-hud --zoom-step 1`, BE_SPRITE=female_office_worker_v2 (the scenario names it, so the hooded sprite should not appear, but ca15 saw it once headless: check) | not seen |
| S2 | Nilesh talk, first visit | fresh game, `interactRetry(bridge,'nilesh_solanki')` then `waitNpcPortrait`, as `tools/video/takes/ca15/t08_nilesh_ask.mjs` (`watchVoice` marks `n1_start`/`n1_end`) | pattern proven on ca15 |
| S3 | Kiosk Brief card | `__test.interact('training_kiosk')` (the ca15 `openKiosk` helper). ca15's Brief shows a blue TARROWBY tab, the strip, the heading "Tarrowby Logistics", the brief paragraph, a dashed scope box and Start | pattern proven on ca15 (`ca15_play_shots/s2_kiosk_brief.png`); ca17 text unseen |
| S4 | Sort drill card (one card, three bins) | Start from the Brief, then the launch panel button "Open the cards", then the intro panel (button "Start sorting"). Or `--set 'episode_e17_acceptable_use_defend_state={"done":["brief"]}'` to open on the defend panel (ca15 pattern, ids by analogy, **not verified for ca17**). Selectors: `.sd-card`, `.sd-situation`, `.sd-bin-btn` (three), `.sd-feedback` | code read only |
| S5 | Inbox list, then one opened card | needs the sort finished: nine picks with `.sd-feedback` hidden, then the summary's `.sd-finish` button, then the inbox launch, `Start`. Rows are `.mail-row` (ca15) | code read only; the way through the sort is **not verified** |
| S6 | Room beat with a bark | fresh game, `kit_quiet` false (it is false at start and only turns true when the kiosk first changes the episode state), wait for a chatter bark, mark the audio start | **not verified** (ca15 saw no Chidi or Fatima bubble in 240 s; ca17's `needsHome` and thirst needs differ, urgent after about 20 s for Chidi and 30 s for Fatima, so a drinks-machine walk is likely) |

The step-away, debrief, "Where the cards went" board and every after-pick panel are deliberately unused.

## Cached lines usable

Text, NPC, length (ffprobe) and speech windows (silencedetect). All sidecars carry the exact text.

| Use | NPC | Text | File length | Speech |
|---|---|---|---|---|
| Cold open, then format | nilesh_solanki (bb496db7) | "Nilesh, service desk. Every rule here has a 'because'. Sort the cards into Allowed, Not allowed and Ask first, then a short inbox. If you're not sure, ask." | 13.49 s | sentence 1 0.27 to 1.47; sentence 2 2.55 to 3.87; sentence 3 4.02 to 9.93 (commas pauses near 5.08, 7.14 to 7.57, 8.46 to 8.65); sentence 4 10.42 to 13.16 |
| End line (first choice) | kit_chidi_okeke (69042c8a) | "Parched after that yard run." | 2.54 s | 0.33 to 2.23 |
| End line (spare) | kit_chidi_okeke (ffb3868c) | "Fleet's all out today." | 2.02 s | 0.24 to 1.57 |
| End line (spare) | kit_fatima_begum (868b36d9) | "Need some water." | 1.58 s | 0.28 to 1.14 |
| Spare room lines | Nilesh 76b1408e "Depot's heaving today." (2.02 s, 0.28 to 1.72), 7052d127 "Who's on the Shipley run?" (1.85 s, 0.29 to 1.43); Chidi 04bd03c2 (1.94 s, 0.21 to 1.52); Fatima 732b3bc9 "CVs stacking up again." (2.33 s, 0.13 to 2.02) | | | |

The pool lines are random draws (scenario-level `kit_tarrowby` pool plus each NPC's own pool, 5-minute cooldown), so the take marks speaker and audio start and retakes until the wanted line and speaker.

Lines refused:
- Fatima `ca17_react` (8287eea6, 9c6c170a): both name the tell ("install their app first") and one is "Good call".
- Fatima 68b13da2 "Nicely sorted..." (a grade) and 56408f11 "The acceptable-use stuff feels dry, but it's worth knowing where the line sits before you cross it." (host advice, and calls the course dry).
- Nilesh 047d7772 (completion line, advice and "report it").
- Nilesh sentence 4, "If you're not sure, ask." (advisory; the format cut stops at 9.93 s).

## Spoiler judgement per shot

| Shot | Show | Off screen |
|---|---|---|
| Sort card | the card situation text only (nine are enough: S01 football at lunch, S03 free PDF editor, S04 borrowed badge, S09 public chatbot, S11 supplier USB stick, S16 colleague's login) | the intro panel (it is the rules in one line each, i.e. the answers), the bin hint "Not sure which bin? Choose this one." (intro legend only), the feedback line and reason after a pick, the running board and the summary "Where the cards went", the score line |
| Bins | three bin buttons, hovered left to right with equal dwell, nothing pressed | any chosen state |
| Brief (cut from the trailer in round 1) | heading, first sentence, the strip | the rest of the paragraph ("When you're not sure, ask first." is advisory), the scope box ("Not sure? Ask first.") |
| Inbox list | six rows, "0 of 6 sorted" | the green badge "Requests handled the right way: N" (hide it), any tick |
| Opened card | the genuine "What we monitor and why" notice (Tarrowby intranet, 08:30; reads like a warning, is genuine): From, subject, body | the four verb buttons (out of frame, nothing pressed), any after-verdict panel. Never open the key fake `e17_meeting_app` (it is `messageGlobals` `kit_key_caught`), and no other fake (`e17_data_lookup`, `e17_shared_login`, `e17_free_tool`): each body is its own tell. Not the HR "reasonable personal use" reminder either: it states the answer to the football and bank cards |
| Nilesh talk | portrait, game bar cropped, burned captions timed per sentence | the choice menu (the chat is closed before it), sentence 4 |
| Room end | the depot, one bark | the Fatima `ca17_react` (it only fires after the sort) |

## Hazards and take notes

- **The card draw is random** (`Math.random`, `drawCards`). Plan: open the sort, read `.sd-situation`, and if it is not the wanted card, close and retake (a game that has been through the kiosk saves its stage, so a fresh game each run), or advance with arbitrary picks and `.sd-feedback` hidden by a CSS interval (`hideText` pattern in `_ca15.mjs`) until the wanted card is on screen. Do not seed the game. Fresh game per take.
- The sort intro panel is the rules text (spoiler): press through it before the take window opens and mark `card1`; the edit crops from the mark.
- `sd-feedback` appears at once after a pick. Hide it with injected CSS before any pick so a stray frame cannot show a reason.
- Inbox: hide the "Requests handled the right way" badge with the same interval. First pick never pressed.
- Chatter needs `kit_quiet` false; the Nilesh mapping sets it true on the first state change, so chatter and any kiosk run never co-occur in one game. For the `room` shot (no bark in the VO window) set `--set kit_quiet=true`; for the room-end bark leave it false.
- Barks: two NPCs' barks overlap, one NPC's queue. For the end shot only Chidi may speak in the window (retake if Fatima draws one); the take marks audio start and the edit cuts from the mark.
- BE_SPRITE: avatar check on every room take (ca15 once showed the hooded sprite headless).
- Nilesh's sprite is in `tools/pixellab_overrides/nilesh_solanki`; the ink header calls it a placeholder, but ca15 already uses him in the same trailer family. Confirm the portrait in the first frame check.

## Narrowed 9:16 takes

The sort panel, the brief card and the inbox are wider than a 607 px window. One extra run each with CSS `max-width: 560px` on the panel: `t04b_sort_narrow` (card and the bins, bins visible for the bins shot; the holiday card S12 is one of the cards), `t05b_inbox_narrow` (list, and the opened card framed on From, subject and body). Room shots, Nilesh and the end bark are a cx check (Chidi and Fatima sit on the left of the room, near x 2 to 3).

## Blockers and open items

1. The way from the sort to the inbox is unverified for ca17 (nine picks, then Done). If it fails, the inbox shots need a `--set` state; ask AC0 only if a game-row edit is the only route (no game-record edits).
2. S6 chatter or drinks-machine barks are unverified. Fallback if no Chidi or Fatima bark appears within about 90 s: the spare room lines above, and failing that a new cast line (owner question, in the script).
3. Cold-open cut: only 0.15 s separates sentence 2 from sentence 3 in the file, so the tail is 0.08 s. Confirm by ear (see the script).

## Round 1 review changes (24 Nov)

The Brief shot is cut and `t03b_brief_narrow` is dropped. A fifth montage card is added: S12 "Take your work laptop on holiday abroad" (an Ask first, "Some countries and some data need extra care; ask your manager, then the service desk." is its reason and stays off screen). The end bark may be any of Chidi's five chatter lines, chosen by game seed (S6 is still unverified); the hook and format takes run with `kit_quiet=true`. See the script's "Changes from review (round 1)".
