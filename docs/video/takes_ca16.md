# ca16 takes (Quayholt Insurance, insider risk): scripts and dry runs, 23 Nov

Scripts in `tools/video/takes/ca16/` (`_ca16.mjs` holds the helpers, which are copied from ca03/ca11/ca15 so the folder stands alone). Nothing has been recorded: every take below was dry-run headless (`tools/video/takes/ca12/_dry.mjs`, no capture, no ffmpeg) on a keyless server on :3455 from this worktree, with frames checked by eye. Entry states are from `docs/video/scout/ca16_scout.md` and confirmed in the dry runs. Run each as `BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca16_insider_risk <take> "<flags>" "--hide-hud --zoom-step 1"`. **Set BE_SPRITE for the recording**: the dry runs had none and show the hooded default sprite.

Defend-form flags (t04, t05): `--set episode_e16_insider_risk_state={"done":["brief","mistake","flip"]}` (the kiosk opens on the Raise a concern launch panel, button `Open the form`).

Step-away flags (t06, t07; `STEP_AWAY_FLAGS` in `_ca16.mjs`): `--set episode_e16_insider_risk_state={"done":["brief","mistake","flip","defend"]} --set episode_e16_insider_risk_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true --set episode_e16_insider_risk_defend_percent=60` (keep the percent under 85).

Harness note: the dry harness takes each `frame:` screenshot late (async), so frame marks sit mid-hold, not at the end of one. Do the same in any recorded take that is frame-checked.

| take | entry state | actions | marks to log | feeds | hides and hazards |
|---|---|---|---|---|---|
| t01_anjali_hook | none: fresh game, Skip tutorial, close the Brief; do not open the kiosk | walk to or `__test.interact('anjali_rao')`; her three-sentence line plays over the portrait; chat closes at about +7.7 s. First interact attempt reads `no-effect-confirmed` and the retry works (about 6.7 s of start-hold before the talk in the dry run) | h_audio_start, s2_in (+3.38 s), s2_out (+7.54 s), chat-closed, frame at s2 mid | hook | The bar (`.person-chat-dialogue-text`, x360 y950 w1000 h90) prints all three sentences, including the one kept off the trailer, so **crop everything below y about 890 in every format** (name plate at y920; the dark bar panel starts at about y895). Frame at s2 mid checked: nothing of the bar above y890. `/tts` 200 audio/mpeg. Use `lines[]` for the caption |
| t02_brief | none | open the kiosk (opens on the Brief panel), hold 5.5 s; Start is never pressed | kiosk-open, brief-boxes, para-box, para-visibility, frame:brief, end | brief | The advice sentence "Your job is not to solve anything..." sits **mid-paragraph in the single `P.epr-text`** (it starts "You're on an authorised exercise at Quayholt Insurance..."), so the script hides the whole `p.epr-text` by selector (visibility:hidden, layout kept; the first version's regex matched nothing). Frame checked: Quayholt tab, strip, heading "Quayholt Insurance", the dashed scope notice and Start remain. The scope notice ("... You are not being asked to investigate anyone.") is a second paragraph and stays visible: crop it or accept it. Boxes: bezel 580,257,760x565; strip 592,321,736x46; heading 608,385,704x40; scope notice 608,613,540x87; Start 608,727 |
| t02b_brief_narrow | none | same, `.epr-kiosk-bezel` at 560 px | same | brief (9:16, 1:1) | Dry run ok: bezel 680,212,560x655, strip wraps to two rows (692,276,536x112), heading 708,406; paragraph hidden |
| t03_choices_reveal | none | Start, `Make the choices`, five picks on the unsafe option by label, `Next` x4, `See where they led`, hold the montage page, `Continue` | per panel `tab:<heading>`, c3_shown, c3_pick, c4_shown, c4_pick, reveal, beat-boxes, trim-log, hidden-cards-proof, end | choices, led_page | Rumour, Samira and Reuben (shared login) `li.aw-montage-beat` cards hidden (display:none); proof mark all false. Both punch-in lines trimmed word for word in the DOM. Page: heading "A week later" y about 385, offer card x608 y440 w704 h152, export card y602 h128, Continue y about 732: **crop led_page at y <= 596** (the export card's top border is at 602, tight). Pick highlight is a yellow border (no marks). Strip chips are `1 Brief .. 5 Debrief` |
| t03b_choices_reveal_narrow | none | same at 560 px | same | 9:16, 1:1 | Narrow: offer card x708 y425 w504 h200 |
| t04_concern_form | defend-form flags | kiosk opens on the Raise a concern launch panel (strip on 4 Defend, three ticks): hold about 3.2 s (the **flip shot** is this panel, 0 to 2.6 s), `Open the form`, `Start`, the Build step with nothing picked, hold about 5.5 s. No separate Continue from the montage is needed: t03 never leaves the montage | kiosk-open, launch-boxes, frame:launch, launch-end, intro, form-open, build-boxes, frame:build, end | flip (0 to 2.6 s), concern | Hidden: the launch `p.epr-text` (it names Samira), `.cf-guidance`, and `.cf-conclusions` (display:none, so the report box rises into frame). Dry run: 6 fact chips, conclusions not visible, 0 chips pressed, report "Nothing picked yet." The Build step is a different modal (heading bar "Raise a concern", panel `.cf-root` 598,206,724x726 after the conclusions are gone; heading "What you noticed", What / When / Where / Who groups, Your report box 614,770, Check my report 614,860). Timeline in the dry run: kiosk-open +0, launch-end +3.2, form-open +5.9, end +11.4; the build is on screen from form-open. Plan the concern shot as form-open + 0.3 to +5.8 |
| t04b_concern_form_narrow | defend-form flags | same, bezel and `.cf-root` at 560 px | same | 9:16, 1:1 | `.cf-root` 680,206,560x726 (the modal header bar stays 724 wide: crop to the `.cf-root` box, x 680 to 1240; the dark gutters inside it are the console background). Launch strip wraps to two rows |
| t05_inbox_list | defend-form flags | setup (off camera): Open the form, Start, four fact chips, Check my report, `Done`; body: `Open the inbox`, `Start`, hold the list, click the Hana Novak row (found by text), hold the card; nothing pressed in it | kiosk-buttons, list (row texts), row_boxes, client-box, frame:list, row_hana, card-box, card-text, card-lines, frame:card, end | list, hana | **Row order is Opportunities, Reuben, Quayholt Sign-in, Ross, IT Service Desk, Hana: Reuben is the 2nd row and Hana the 6th (last)**, not the other way round as the script says. Cropping Reuben's row out is impossible; the take blanks his preview ("Can I use your login for ten minutes?") with font-size 0 (row height kept, name and time stay). Hidden: team tally, verbs, selected ring, focus outlines. Panel `.mail-client` 480,20,960x900; rows x522 w285 h52 from y180 (step 56). Hana card: the line-1 bubble ends y about 338 and line 2 starts y about 350, so **crop the card at y <= 342**; caller ID heading at y 230 to 250 |
| t05b_inbox_list_narrow | defend-form flags | same at 560 px | same | 9:16, 1:1 | `.mail-client` 680,20,560x900; rows x722 w200; the card wraps: caller ID 262 to 340, line 1 up to y about 545, line 2 starts about 565: **crop at y <= 548** |
| t06_lookup_panel | step-away flags | open the kiosk (opens on "Before the debrief"), hold 3.9 s, stop; Look up and Carry on are never clicked | kiosk-open, kiosk-buttons, panel-box, strip, heading, body-text, frame:panel, end | look_up | Panel 580,367,760x346; heading "Before the debrief", text "Look up from the kiosk and carry on in the room for a minute. Someone may ask you something. Your place is saved." (box 608,543,540x48), buttons `Look up`, `Carry on`; strip on 5 Debrief with four ticks. A head is faintly visible behind the dimmed room at about x815 y330 (Niamh at her PC): harmless |
| t06b_lookup_panel_narrow | step-away flags | same at 560 px | same | 9:16, 1:1 | Panel 680,334,560x412; both buttons in frame |
| t07_niamh_ask | step-away flags (includes `kit_quiet=true`) | open the kiosk, press `Look up`, hold until the ask has played plus 5.2 s | look_up, bark1 audio, niamh arrival, ask_start, end | niamh_end | Bark 1 audio "Hang on, my screen's thrown me out." starts +1.6 s (3.04 s). Niamh arrives beside the player (`kit_ca16_there`) +4.06 s. **Ask audio starts +6.0 to +6.4 s after the press, not the +8 to +10.5 s the script estimated** (same throttled and unthrottled); the ask is 4.36 s. In point for niamh_end = ask audio start - 1.3 s, about press + 4.8 s. Speech bubbles hidden (box.setVisible override). Frame at the ask: Niamh beside the player, amber "!" cue, no bubble. Panel text is `.epr-text` |

Script changes needed (the script itself is not edited here):
- t07: the ask starts +6.0 s after Look up, not +8 to +10.5 s; retime niamh_end and the look_up shot against this.
- t05: Reuben is the second row, not the last, and Hana the sixth. "Top five rows, Reuben's row at the foot cropped" does not hold: the list shot keeps all six rows with Reuben's preview blanked, or a different list crop is chosen. The Hana crop is the card to y 342 (wide) or 548 (narrow).
- t04: the flip shot (0 to 2.6 s) is the Defend launch panel seeded directly, with the strip on 4 Defend; there is no Continue click in t03 to chain from. The launch paragraph names Samira, so it is hidden.
- t02: the scope notice paragraph under the hidden advice stays on screen.

## Dry-run results (23 Nov, headless, no capture)

| take | result |
|---|---|
| t01_anjali_hook | ok; marks and bar box as above |
| t02_brief, t02b_brief_narrow | ok; paragraph hidden (visibility hidden, advice still in the DOM text), frame checked |
| t03_choices_reveal, t03b | ok; hidden-card proof all false; trim-log word for word |
| t04_concern_form, t04b | ok; both frames checked (launch with no paragraph, Build with report empty, no conclusions) |
| t05_inbox_list, t05b | ok; six rows, card frames checked (wide card and narrow card, focus ring gone) |
| t06_lookup_panel, t06b | ok; both buttons present, frame checked |
| t07_niamh_ask | ok; see timings above |

Not verified: any recording (capture, sync, dropped frames), the sprite (BE_SPRITE was not set in dry runs because the shared avatar is in use), the t01 and t07 takes with BE_SPRITE, and whether the 9:16 crops of the narrowed `.cf-root` look right in the edit.

## Recorded marks

### Captures (25 Nov, serial, display :147, keyless server :3456, `female_office_worker_v2`)

Thirteen takes, one attempt each, all `pass: true`, full frame (1920x1080), no retries. Output in `~/video-takes-local/ca16/takes/` (`video_out/ca16/takes` symlinked to it, as ca11). Gate figures are the constant-offset-corrected residuals (`residualStartMs`/`residualEndMs` in `check.json`). Sidecars are drafts (`_draft:true`): Step 6 was not in this brief.

t08 dry run (25 Nov): passed on the first run. The script imported `checkSprite`, which `_ca16.mjs` does not export (it exports `spriteCheck`). I renamed both uses before the dry run, so the dry run never failed. Scratch footage, 35.14 s, 0.27% dropped, residual +11 / -12 ms. Darren's trip: triggered at 1.5 s, at the cooler at 5.9 s, 214 px from his post, back at the post at 32.5 s.

| take | length (s) | drop % | residual A/V start / end (ms) | POST /tts | contact sheet and notes |
|---|---|---|---|---|---|
| t01_anjali_hook | 17.84 | 0.50 | -5 / +5 | 1 line, 200 audio/mpeg (`tts-proof` ok) | Anjali's line in the bar from 8.7 s; line pair 8668 to 16461 ms (durMs 7793). `s2_in` and `s2_out` are estimates (`est: true`), not playback edges: cut on the line pair |
| t02_brief | 9.93 | 0.28 | +12 / -13 | none (no voice) | Brief panel from 1 s; Start visible. Advice sentence hidden, not checked at full size |
| t02b_brief_narrow | 9.73 | 0.28 | -4 / +4 | none | Same at 560 px |
| t03_choices_reveal | 37.44 | 0.25 | -3 / +3 | none | Choice cards, the montage (23 to 36 s) and the led page. Frames read as the script says |
| t03b_choices_reveal_narrow | 37.27 | 0.25 | +14 / -14 | none | Same beats at 560 px |
| t04_concern_form | 16.43 | 0.54 | -14 / +14 | none | Launch panel 0 to 6 s, then the Build step with nothing picked, report empty |
| t04b_concern_form_narrow | 16.37 | 0.18 | -4 / +3 | none | Same at 560 px |
| t05_inbox_list | 13.23 | 0.65 | -4 / +4 | none | Full frame at 4.5 s read: Reuben's preview is blank, row height kept. **The Opportunities row still shows the approach text ("We pay people at firms li...")**: see open items |
| t05b_inbox_list_narrow | 13.27 | 0.65 | -3 / +2 | none | Same at 560 px |
| t06_lookup_panel | 8.33 | 0.93 | -4 / +4 | none | "Before the debrief" with Look up and Carry on in frame. Drop close to the 1% gate |
| t06b_lookup_panel_narrow | 8.34 | 0.96 | -15 / +15 | none | Same at 560 px. Drop close to the 1% gate |
| t07_niamh_ask | 16.80 | 0.53 | -6 / +5 | 2 lines, both 200 audio/mpeg: bark 1 "Hang on, my screen's thrown me out." and the ask "It won't take my password at all. Could I borrow your login for an hour?" | Niamh arrives beside the player at 4.2 s after the press; the ask starts at +6.39 s (the doc's +6.0 to +6.4 s). Amber cue, no bubble at the ask |
| t08_darren_cooler | 35.13 | 0.27 | -19 / +19 | none (quiet by design) | Darren walks to the cooler and back; the camera follows out and back, then returns to the player |

Seated NPCs: none of the thirteen takes shows an NPC that the scenario declares as seated. The ca16 scenario gives Darren a `needsHome` facing south at (2.5, 7) and no seat or pose. The contact sheets are too small to confirm stance, so this is unverified at full size. Niamh is "at her PC" before her ask (the dry-run note); her seated pose before the press was not checked at full size.

Open items for the edit and the orchestrator:
- **t05 spoiler check.** Only Reuben's preview is blanked. The Opportunities row shows the unknown contact's approach text in the list hold (frame at 4.5 s). Decide whether the list shot crops it, blanks it, or is used at all. The list mark also logs Reuben's preview text in the marks file (data only, not on screen).
- **t01 and t07 voice.** Both voiced lines in t07 return 200 with no `line-start` pair, so the lines are proved by `tts-response` and `audio-start`/`audio-end` marks, not by `watchVoice`. t01 has the pair.
- **Full-size checks.** Only the t05 frame was viewed at full size. The other twelve were judged from contact sheets. Trimmed `.mkv` files were not viewed at full size.
- **Sidecars.** The `.take.json` files are drafts and need Step 6.
- **Scout length.** The voiced line lengths were not compared with the scout's ffprobe values.


## Movement shots (25 Nov)

Survey: `docs/video/CA_MOVEMENT_B4.md`. Helper `tools/video/takes/lib/camlib.mjs`. **Proposed script written, not yet dry-run.** Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t08_darren_cooler (new, not yet dry-run) | fresh game, `--set kit_quiet=true`; `kit_ca16_out` not set | read his settled post (near (80,224)); `followNpc(kit_darren_price, lerp 0.08)`; `triggerNeed(thirst, 5)`; he walks to the water cooler (use point about (262,219), about 182 px), drinks 20 s, walks back; `followPlayer` | post-set, follow-on, need-set, walk-start, arrive, trip-distance, return-start, back, cam-summary, end | optional office insert before `look_up` (v11) or as a cutaway under `topic` | With `kit_quiet` true his chatter ("Just grabbing some water.") stays off, so the take is silent. After Look up his needs are suspended. Natural trip about 30 s after load: refuse if not near home. Trip length is an estimate from tiles |
