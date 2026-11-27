# ca18 takes (Password guessing at scale, take scripts and dry runs, 23 Nov)

Scripts in `tools/video/takes/ca18/` (`_ca18.mjs` holds the helpers, seeds and CSS). Dry-run headless on a keyless server on :3452 (worktree b-ca-trailers-next), nothing recorded. Player sprite in dry runs is the default hood sprite (BE_SPRITE not set because the shared avatar is in use); the real run sets `BE_SPRITE=female_office_worker_v2`. Run line for each: `tools/video/takes/run-take.sh ca18 <take> <flags> "" "--hide-hud --zoom-step 1"` (flags as separate `--set` words, JSON without spaces).

Seeds (`SEEDS` in `_ca18.mjs`):
- flip: `--set guess_e18_landed=true`
- defend (kiosk opens on Defend): `--set episode_e18_credential_attacks_at_scale_state={"done":["brief","osint","guess","flip"]} --set guess_e18_landed=true`
- step-away: `--set episode_e18_credential_attacks_at_scale_state={"done":["brief","osint","guess","flip","defend"]} --set episode_e18_credential_attacks_at_scale_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e18_credential_attacks_at_scale_defend_percent=60 --set kit_quiet=true` (percent under 85: 85 and over sets `kit_caught`; `kit_quiet` must be seeded by hand because `--set` does not fire the mapping that sets it).

| take | entry state | actions | marks to log | used by | hides and hazards |
|---|---|---|---|---|---|
| t01_ama_hook | fresh game, no flags | Skip tutorial, close the Brief, talk to `ama_owusu`. Line 1 (welcome, 5.33 s) plays; line 2 "Attackers rarely pick one person and crack them." follows by itself 0.6 s later, no Continue needed (the only button is "Skip [SPACE]"). Chat closes 0.2 s after line 2 | line1_start/end, continue (buttons), line2_start (autoAdvanced, gapS)/line2_end, rect:bar, frame:line2, chat-closed, end | hook | Crop: the game bar is the bottom band, y 940 to 1060 of the 1920x1080 frame (text rect y 995); picture area y 20 to 940. The close "x" sits top right (1890, 30). Line 3 "They scoop up..." is not heard. In = line2_start - 0.15, out = line2_end + 0.2 |
| t02_attack_run (+ t02b narrow) | fresh game | Start, "Open the browser" ("Our people" held, nothing pinned), five pins (team, pattern, project, strapline, street) each with a "Noted" line, browser closed, "Open the guesser", rosters build, four passes, result row, hidden passphrase and stuffing rows stepped fast, "Finish and see the results" onto the flip heading | kiosk-open, start, browser-open, topic_start, note-team/pattern/project/strapline/street, browser-closed, guesser-open, roster-built, words-built, pass-1..4, result, result-visible-early (false), stuffing-steps-done, final-step, switch, flip-up (flip-up-narrow in t02b), end | topic, research, words, build, spray, flip | GUESSER_HIDE_CSS: passphrase panel, live log line, and the queued result row's text (it printed "3 of 5 accounts opened" from the start while "waiting"). Asserted at every mark: "harbour", "ladder", "crimson" not showing. Flip: FLIP_HIDE_CSS keeps the heading and Continue only. Narrow variant at 560 px. Result row text: "3 of 5 accounts opened" |
| t03_ama_flip | `--set guess_e18_landed=true` | talk to `ama_owusu`; A4 and A5 play (auto-advance, no Continue), A6 is the line used; chat closes after A6 ends, before the menu | a4/a5/a6 start/end, a6-tts, chat-closed, end | ama_flip | A6 POST /tts answered 200 audio/mpeg, 45789 bytes, clip 5.91 s, on a keyless server, so the sidecar (colon for comma) hits the cache; no new key was made. A6 starts 0.5 s after A5 ends. In = a6_start - 0.15, out = a6_end + 0.2 |
| t04_defend_list (+ t04b narrow, 760 px) | defend seed | "Open the inbox", Start; six-row list held 4 s, cursor parked at (40, 40); click the 08:54 Fenlow Managed IT row ("Some accounts were briefly locked this morning"); hold 5 s; nothing pressed | kiosk-open, launch-panel, inbox-open, start, list-up (rows), chain, card-open, rect:subject, rect:hello, rect:body-clip, rect:advisory, rect:frame, card-state, card-end, end | alerts | DEFEND_HIDE_CSS hides `.aw-team-tally` (the "Fakes stopped for the team" badge), `.tri-progress` ("0 of 6 sorted"), `.tri-brief-text`, `.tri-flags`, `.tri-false-flags`, `.tri-live`, and sets `span.tri-verdict-hint` to visibility:hidden (asserted: all four hidden). The card's `.mail-body` is clipped to one 26 px line, so only "Hello," shows: the advisory shares a text block with sentence 1 and cannot be cropped. Asserted by Range rect that "You don't need..." and "We will never ask..." sit below the clipped body (wide: body bottom 250, advisory top 275 and 323; narrow: 282 against 331 and 379). Wide crop: x 480, y 114, w 960, h 131 (subject top to "Hello," bottom). Narrow crop: x 580, y 114, w 760, h 163 (the subject wraps to two lines). Verdict buttons are in the picture below the crop (labels only: Trust, Report, Delete, Verify). The row list prints the six subjects, including the fake-looking ones ("Your account is locked - act now", "breach-check-now.example", tag "Web page"): that is the game's list, not blanked. There are no body previews in the rows, so nothing else to blank |
| t05_lorna_reset (+ t05b narrow, 560 px) | step-away seed | open the kiosk (panel "Before the debrief": buttons Look up, Carry on), hold 0.8 s, press Look up; Lorna's bark L1 plays; stop 0.6 s after its audio ends, before L2. Lorna's world bubble hidden for the whole take (HIDE_BUBBLES, Phaser container patched) | kiosk-open, panel-hold, press, l1_bubble, l1_audio_start, l1_audio_end, lead, v10_clear, bubble-hidden-check, l2-before-end (false), tts, globals-end, end | lorna_end | Measured over four runs: press to bubble 1.53 to 1.60 s, press to L1 audio start 1.56 to 1.68 s, bubble to audio 0.0 to 0.1 s; audio clip 3.52 s, POST /tts 200 audio/mpeg 28677 bytes. Bubble hidden (visible false, alpha 0, patched). L2 not heard. Lorna is seated at her desk in frame, the player stands at the kiosk |

## Script changes the dry runs need

- Real labels: the kiosk window is titled "Security Awareness" and the browser window "Browser" (there is no "OPEN-SOURCE RESEARCH" or "PASSWORD GUESSER" tab). The strip runs Brief, Research, Campaign, Your inbox, Defend, Debrief. Replace the take-plan tab names (topic, research and words shots: "Research"; build and spray: the guesser; alerts: "Defend").
- Flip heading: "Now it's your inbox." (strip with Research and Campaign done; body and aftermath hidden).
- Result row: its text "3 of 5 accounts opened" shows from the first pass while queued ("waiting"); hidden by CSS until the row opens. Proven in the narrow frame (pass 1 shows an empty row) and `result-visible-early` is false in the wide run. v6 is placed from the `result` mark plus 0.2 s.
- Alerts card: it is framed on the subject, From, To, Time and "Hello," (the body is clipped to the greeting by CSS). The script's "From, subject and Hello" holds; "Time 08:54" and "To you@merrinsallow.example" also sit in the crop, which is fine.
- v10: press to L1 audio start is 1.56 to 1.68 s, so v10 ("Then, at Lorna's desk.", ends at press + 1.44 s) clears L1 by only 0.12 to 0.24 s (rule: at least 0.2 s). Use the fallback "At Lorna's desk." (3 words, ends about press + 0.9 s) in the edit.
- Hook: line 2 follows line 1 by itself after 0.6 s; no Continue press, no click on camera.
- Lorna's bubble: hidden in the take, so the edit burns the caption; the bark text and audio are unchanged.
- Guesser narrow frame: the "Try the next guess" and "Run them all" buttons are visible at the foot of the console; keep them out of the crop or accept them.

## Left unverified

- Nothing recorded: audio sync and drop checks come with the recording.
- The `female_office_worker_v2` sprite was not set in dry runs (the default hood sprite appears).
- Whether v10's lead holds with the unthrottled game (the dry run throttles physics to 20 fps; the lead is a timer plus audio load, so it should not move much).
- The t02 timings come from a throttled headless run (about 1.6 s per pass).

## Recorded marks

### Dry runs (26 Nov, no capture)

Headed Chromium on Xvfb :147, keyless server :3456, no ffmpeg. The runner is a scratch script outside the repo: launchGame, title pass, `setup`, then the take, with each mark logged and a screenshot taken.

| take | game | result | notes |
|---|---|---|---|
| t02b_attack_run_narrow | 13510 | pass, 44 marks, no page errors | pass_4: passphrase panel hidden, queued result row text blank. flip-up-narrow: heading and strip inside the 560 px panel |
| t05b_lorna_reset_narrow | 13511 | pass, 30 marks | POST /tts 200 audio/mpeg, 28677 bytes. bubble-hidden-check: visible false, alpha 0. press to bubble 1.66 s, press to L1 audio 1.90 s, v10_clear ok at 0.46 s |
| t06_delphine_sofa | 13512, 13513 | FAIL after 2 tries (1 script fix) | trip 144 to 145 px (minimum 120), arrive about (244,217). Return: try 1 settled on a pause at (165,134); the script now waits for the post. Try 2: she stops at (164,133) and stays, 28 px from the post (144,113), so the 24 px check fails. The post is her settled start point, which appears to be patrol and not her needsHome (tile 4.5,4.5 = 144,144). Open decision: take the post from the settle point, or widen the check to about 40 px. Not decided, not captured. |

Not dry-run in this pass: t01, t03, t04, t04b, t05 (the 23 Nov dry runs predate the current code). Only t06 was dry-run on 26 Nov (below).

### Dry run, t06 (26 Nov, after commit 5a0ed566d)

Game 13518, `--set kit_quiet=true`. Passed first time: 16 marks, no errors. Trip 143 px (minimum 120). Return: she settled at (163,132), within the 40 px radius of her post (144,113). Result in the scratch folder, not the repo.

### Captures (26 Nov, serial, display :147, keyless server :3456, `female_office_worker_v2`)

Nine takes, one attempt each. None failed, so no retries. Every take is `pass: true`, full frame (1920x1080, canvas edge to edge), no page errors. Output in `~/video-takes-local/ca18/takes/`, with `video_out/ca18/takes` symlinked to it (`video_out/` is gitignored, as for ca13). Sync residual after the constant-offset correction is the gate figure; the raw `offsetOk*` flags in `check.json` read false before correction and are not the gate.

| take | length (s) | drop % | residual A/V start / end (ms) | POST /tts | contact sheet and notes |
|---|---|---|---|---|---|
| t01_ama_hook | 14.97 | 0.58 | -1 / +1 | 2 lines, 200 audio/mpeg (welcome, "Attackers rarely...") | Line 1 reads in the bar, line 2 follows by itself at 9.8 s. Clean. |
| t02_attack_run | 62.87 | 0.15 | +1 / -2 | none (no voiced lines) | Browser, pins, guesser, flip heading. Passphrase panel and queued result text hidden as the script says. |
| t02b_attack_run_narrow | 63.44 | 0.05 | +5 / -5 | none | Same beats in the 560 px panel. Buttons in the console foot are in frame, as the dry-run note allowed. |
| t03_ama_flip | 32.77 | 0.29 | +4 / -5 | 3 lines, 200 audio/mpeg (A4, A5, A6 "Now it's your seat...") | Three lines at the bar, then chat closes. Clean. |
| t04_defend_list | 16.40 | 0.54 | -7 / +7 | none | Defend list, card opens. Verdict hint and progress badges hidden. |
| t04b_defend_list_narrow | 16.57 | 0.53 | -6 / +6 | none | Same at 760 px. |
| t05_lorna_reset | 11.14 | 0.75 | +12 / -13 | 1 line, 200 audio/mpeg (L1 "Fenlow have made me reset my password...") | Kiosk panel, then the room with Lorna's bubble hidden. |
| t05b_lorna_reset_narrow | 10.87 | 0.76 | -6 / +6 | 1 line, 200 audio/mpeg (same L1) | Same at 560 px. |
| t06_delphine_sofa | 20.70 | 0.44 | 0 / 0 | none | Delphine walks to the sofa and back, followed by the camera. |

Marks: each take has its `.markers.json` and trimmed `.trimmed.markers.json`. Frames were checked against the contact sheets, not at each key mark, so the marks-to-frame check in Step 4 of the skill is still open for the minigame marks (t02, t04). Sidecars (`*.take.json`) are drafts with `_draft:true`, since this run's brief did not include Step 6.

Assumption lines: the 40 px return radius is taken from 5a0ed566d as written. The narrow variants used the same seeds as their wide parents. Dry runs for t01, t03, t04, t04b and t05 were not repeated, as the brief asked for t06 only.

| take | length | drop % | key marks (trimmed s) | checked against frames / notes |
|---|---|---|---|---|

## Movement shots (25 Nov)

Survey: `docs/video/CA_MOVEMENT_B4.md`. Helper `tools/video/takes/lib/camlib.mjs`. **Proposed script written, not yet dry-run.** Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t06_delphine_sofa (new, not yet dry-run) | fresh game, `--set kit_quiet=true`; `kit_ca18_out` not set | read her settled post (near tile (4.5,4.5) = (144,144)); `followNpc(kit_delphine_arvanitis, lerp 0.08)`; `triggerNeed(rest, 5)`; she walks to the sofa, sits about 8 s, walks back; `followPlayer` | post-set, follow-on, need-set, walk-start, arrive, trip-distance, return-start, back, cam-summary, end | optional office insert before `lorna_end` (v10) | The sofa has no `position` in the scenario: the trip length is unknown and the take throws under 120 px (then the scenario needs a sofa position, a proposal in the survey). After Look up her needs are suspended and she returns to (4.5,4.5): record the trip before the press |
