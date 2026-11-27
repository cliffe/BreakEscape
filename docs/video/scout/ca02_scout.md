# ca02 CV lures: trailer scout

Scouted 23 Nov 2026 from `scenarios/ca02_cv_lures/` (scenario, mission.json, `ink/fatima_begum.ink`, the shared kit ink knots it points at), the 104 sidecars in `tts_cache/ca02_cv_lures`, and the ca01 and ca05 scouts and take scripts as models. **Desk scout only**: no server, no recording, no TTS, no commit. "Verified" below means read in source. Clip lengths and the cut points for the three cast lines used are real (`ffprobe` and `silencedetect -35 dB` on the mp3s); in game add 0.2 to 0.4 s. Scenario folder: `ca02_cv_lures` (full episode, 15 min). `ca02_cv_lures_defend` is the inbox-only 8 minute variant (no attack half, its own sidecars) and is not the trailer source.

## Headline

- **One room, one kiosk, Tarrowby Logistics (TL, blue accent `#3b5b8c`).** `training_room` holds Fatima Begum (host, `fatima_begum`, recruitment lead), Chidi Okeke (`kit_chidi_okeke`, at `kit_ca02_pc`) and Zainab Hussain (`kit_zainab_hussain`), the kiosk (`training_kiosk`, episode `e2_cv_lures`), a drinks machine and a clipboard. No walks, locks, calls or VM.
- **Strip:** Brief, Research, Write, Flip, Defend, Debrief (`stages`). There is **no page builder**: the attack tool is the OSINT browser and then the **mail template** (pretext picker with two slots, ask picker, an attachment picked from two labels, a red-flag meter), as in ca01. First Send is final (`maxMessages 1`). The attachment is a label, not a file.
- **The attack** is one job application to Fatima, built from public facts: the careers page gives the vacancy (WHO-114) and the hiring manager (Colin Mather), the team page gives Fatima's address, a Friendface post of hers invites CVs by email. Pick the "application" pretext (`pretext_application`, slots vacancy and hiring manager), the calm ask, attach "CV (Word document)" (the other label is "Portfolio (zip archive)", which the scorer marks as wrong-type). Send. The result panel shows ticks ("Ties to the vacancy she is recruiting for", "A CV is exactly what she expects to receive"). Fatima's reply is mail text only, about 6 s after Send (`emailReplyDelay 6`): "Thanks for your application. I'll open your CV and pass it to the hiring manager."
- **Defend** is six messages in a triage set (`e2_recruitment_inbox`): Trust, Report or Delete (`verifyVerdict false`), tick what you noticed, `feedbackMode immediate` so a press shows a verdict at once. Two real CVs (a PDF from Tendai Shava, a Word CV from Darius Petrauskas), an agency shortlist, Colin's interview note, a look-alike portfolio mail with a sign-in link, and the **enable-content CV** (Jordan Kerr, `CV_JKerr_protected.doc`, "click Enable Editing and then Enable Content"). That last one is the episode's tell; it must not be on screen as a readable card.
- **Living-office moment is the step-away.** After the defend set the kiosk shows "Before the debrief" with Look up. Then Chidi, at his PC, says "Got a CV in for the driver job." about 1.5 s after (bark, needs `kit_quiet` true and `kit_ca02_out` true) and about 7 s after, "Blank page, just a box saying enable editing and content. Do I click?" (bark, `whenPerceivable`, 5.5 s after `kit_ca02_there`, which Chidi's own mapping sets 1.5 s after `kit_ca02_out`). The second bark opens a chat on a click or an amber ask cue (`askCue`), whose options are outcomes (the `kit_ca02_cv_choice` values); a 45 s timer defaults the choice to `silent`. **The take must stop before any click.** Same two-bark shape as ca05, so one take gives the hook and the end line.
- **The outline's end line is a consequence line.** "Chidi, IT have just cut your machine off. The driver applications are all on there." is Fatima's bark 8 s after the player picks anything except Report, so it is the outcome of an "enable" choice (a grade in effect, and the take would have to make the wrong pick). Not used. Chidi's question is the end line instead (owner question Q2 in the script).
- **Avatar.** The scenario names `female_office_worker_v2` and the recordings set `BE_SPRITE=female_office_worker_v2` (the hooded demo avatar reads as SAFETYNET). The player is in frame in the two room shots only; the minigame shots have no player.

## Part A: voiced lines (sidecars, ffprobe, silencedetect)

60 sidecars with a matching mp3 were read; every line below has both. Live `/tts` was not requested (no server). A line plays only where the ink or bark text equals the sidecar exactly.

### Used in the script

| ID | NPC | Text | Clip | Speech (silencedetect) | When | Use |
|---|---|---|---|---|---|---|
| C1 | kit_chidi_okeke | Got a CV in for the driver job. | 2.33 s | 0.22 to 2.04 | world bark about 1.5 s after Look up (`kit_quiet`, `kit_ca02_out`) | **hook** |
| C2 | kit_chidi_okeke | Blank page, just a box saying enable editing and content. Do I click? | 6.58 s | 0.27 to 6.21 (pauses 1.32 to 1.77 and 5.16 to 5.70) | world bark about 7 s after Look up (`kit_ca02_there` + 5.5 s, `whenPerceivable`) | **end line** |
| F1 | fatima_begum | Your application has gone to the recruitment inbox. Now take the other seat at the kiosk and sort the inbox the way it would land on a normal day. | 8.26 s | 0.23 to 7.69 (sentence gap 2.85 to 3.03) | talk to her after the send (`phish_recruiter_contact_attempts > 0`), defend not done | **flip line**. Chat closes before the "Thanks, Fatima." choice |

### Spares and rejected

| NPC | Text | Clip | Status |
|---|---|---|---|
| kit_chidi_okeke | Recruitment inbox never stops. All sorts of attachments land in there from folk we've never met. | 6.10 s | spare hook or topic line, but over the 5.0 s cold-open limit and its trigger (Chidi's ambient talk knot) is not read; needs a desk check of `chidi_okeke_ambient.ink` |
| kit_zainab_hussain | Heard HR had a scare with an application. Easy to click when the inbox is heaving. | 5.42 s | after-defend talk only (else-branch, `kit_key_caught` false, `kit_ca02_moved` false, `kit_ca02_out` false); mild, not a grade. **Used as the hook** (round-1 review): first sentence only, "Heard HR had a scare with an application.", speech 0.20 to 2.69 s, silence 2.69 to 3.04 s (silencedetect on 6da7c03365d3b480b1cc2363f8b0d353.mp3) |
| scenario chatter | Fleet's all out today. / Another pallet backlog. / Depot's heaving today. / Who's on the Shipley run? | 1.9 to 2.5 s | before Start only (`kit_quiet` false); cold-open spares paired with a card |
| fatima_begum | Welcome to the Tarrowby exercise. Start at the kiosk: research the vacancy and the recruiter... | 12.22 s | too long; spare for a course trailer |
| fatima_begum | IT have asked anyone who opened that careers link to change their password today. | 4.70 s | **off**: consequence bark (fires 9 s after the ask unless the choice was enable or silent) |
| fatima_begum | Chidi, IT have just cut your machine off. The driver applications are all on there. | 6.02 s | **off** (outcome of a wrong pick; see headline) |
| fatima_begum | You stopped the one that wanted enabling... / You spotted the one that wanted a second click... | 7.5 / 6.3 s | **off** (grades) |
| fatima_begum | A CV that wants content switched on is after a foothold... / A real CV opens in the viewer. Anything that asks you to switch something on first is the one to flag. / A real CV just opens in the viewer. Anything that wants more than that... | 6.1 to 8.5 s | **off**: they name the tell |
| kit_chidi_okeke | Good spot. That "enable content" box is the whole trick... / Good one, spotting that dodgy application... / Grand. Clicked it. | 2.0 to 8.0 s | **off** (verdicts and outcomes) |
| kit_zainab_hussain | Nice catch on that CV. One file that wants a second click to open, and you're off the road for a week. | 6.62 s | **off** (grade, names the tell) |

### Uncached

None needed. The target reply is mail text (Fatima's "Thanks for your application...") and the trailer shows them only as a screen, never voiced.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Room and kiosk | `training_room`, kiosk `training_kiosk` | fresh game, Skip tutorial, close Brief, `interactRetry` (first interact can be swallowed, retry up to 3) | no | source only |
| S2 | Open-source research | button "Open the browser"; sites `tarrowby_site` (Our people, Careers) and `tarrowby_social` (Friendface) | after Start; a fact is noted by clicking its block (`.ob-block[data-id=...]`). Block ids: `blk_recruiter` (Fatima), `blk_hiring_mgr` (Colin), `blk_vacancy` ("Now hiring: Warehouse Operative (ref WHO-114), reporting to Warehouse Manager Colin Mather"), `post_cv_request` | public facts only; the `reduceNote` texts ("A public vacancy reference gives a fraudster the exact role to quote") are advice lines: keep them out of frame | source only |
| S3 | Application email builder | "Open the mail client", then Compose; pretext `pretext_application` with slots vacancy and hiring manager, ask `ask_calm`, attachment "CV (Word document)", To Fatima | needs `blk_recruiter` noted (else "Nobody to write to yet"), and `blk_vacancy` and `blk_hiring_mgr` noted for the slots | the finished mail is a worked lure: keep to the closed pickers filling and never a readable full body (rule A2); the red-flag meter and its lines may carry tell wording (confirm in dry run; hide the lines, keep the counter) | source only |
| S4 | It landed | green result panel after Send; Fatima's reply about 6 s later | after S3; the vacancy slot and CV attachment must pass the scorer (`requiredFactors pretextRelevant, attachmentPlausible`) | pattern level; the ticks are fine | source only. Not computed: whether the `ask_calm` pick matters to "landed" |
| S5 | The flip | closing the mail client after the send opens the kiosk on "Now it lands on you" | after S4 | **yes**: the flip body names what "makes it believable" and a defender narrative; frame the heading and strip only. The strip ticks to Defend on Continue | source only |
| S6 | Recruitment inbox (defend) | "Open the inbox", then Start (confirm labels); set `e2_recruitment_inbox` | **seed**: `episode_e2_cv_lures_state={"done":["brief","osint","write","flip"]}` plus `phish_recruiter_contact_attempts=1`; kiosk opens on "Defend" | list row: sender name, subject, time and, per the brief ("attachments show as labels"), probably the attachment labels. The enable-content row's label is `CV_JKerr_protected.doc` and its sender `jordan.kerr.cv@hastypost.example`: confirm in the dry run what the row shows and frame so neither is the subject of any line. Opened card: the genuine PDF mail from Tendai Shava is safe (plain request, `Tendai_Shava_CV.pdf`); never open Jordan Kerr's or Liam Baxter's. `feedbackMode immediate`: a verdict press shows the answer, so press nothing | source only |
| S7 | Chidi at his PC | `kit_chidi_okeke` barks, `kit_ca02_pc` | **seed**: `episode_e2_cv_lures_state={"done":["brief","osint","write","flip","defend"]}`, `episode_e2_cv_lures_defend_complete=true`, `kit_defend_done=true`, `kit_attack_done=true`, `episode_e2_cv_lures_defend_percent=100`. Open kiosk, wait for "Look up", press it. `kit_quiet` should come from the state mapping (ca05 dry run, 23 Nov, found the same kit mapping sets it; confirm here) | none until the chat opens: never click | source only |
| S8 | Fatima's flip line | talk to `fatima_begum` | seed S6's state, close the kiosk (`bridge.minigame.close()`), walk or `moveToNear` to Fatima, talk | no | source only |
| S9 | Debrief | kiosk step 6 | after defend | **yes** (verdicts, cost panel) | not used |

Tool names for cards: **Open-source research** (S2) and **Application email builder** (S3; "look-alike" is not used because nothing in this lure is look-alike). Each needs at least 3 s start to finish.

## Spoiler judgements

- **Show:** the careers page with the vacancy noted, the email builder filling with the vacancy, manager and CV label, the green result panel, the strip tick and the flip heading, the six-row inbox list before any verdict, one **genuine** card (Tendai Shava) opened on its header and file label, Chidi at his desk.
- **Off:** Jordan Kerr's row opened (body: "click Enable Editing and then Enable Content"), Liam Baxter's card (portal sign-in), any verdict panel, the tick chips ("It asks me to turn on editing or content to see it" is the tell chip: never in frame), the flip body, the debrief, Fatima's lines about "a real CV opens in the viewer", Chidi's and Zainab's after-defend praise, the `reduceNote` advice lines.
- **Chidi's end line names the pattern** ("a box saying enable editing and content"). It is the same shape as ca05's Darren line ("my phone wants me to approve it"), the outline's own pick there, and it ends on an open question with no answer. Kept; owner question Q2.
- **The list row** may show the attachment label of the enable-content mail. A caption or narrator line must not point at any row. If the dry run shows the label is readable at 1080p, narrow the frame to the left of the row or accept it as unpointed-at (recommended: accept, the row is one of six and carries no explanation).

### CSS hides the takes will need (confirm in dry run)

- Mail composer: hide the red-flag lines below the counter if they carry tell wording; keep the counter.
- Flip screen: hide everything under the heading "Now it lands on you".
- Triage: if a take ever shows a card after a pick, hide the feedback panel (it must not); hide the verdict row's hover states by not hovering.
- Always: the HUD CSS from `tools/video/capture/launch.mjs`, no Mission Brief popup, Skip tutorial, the kiosk "Close with X" bar if it shows.

## Hazards

- **Fresh game for every take.** A used game reopens on its saved step.
- **Barks from two NPCs overlap, they do not queue.** Here only Chidi barks in the window (Zainab's needs are suspended while `kit_ca02_out`, and her chatter needs `kit_quiet` false). Fatima's third bark ("IT have asked anyone who opened that careers link...") fires 9 s after the ask unless the choice is `enable` or `silent`; with the seed it can start about 16 s after Look up. The office window ends before that (about 14 s after Look up), but the dry run must prove the margin.
- **The choice menu and ask cue.** `askCue` opens an amber cue near Chidi at the same moment as bark 2 (`kit_ca02_asked`). Confirm it is not an outcome and that it does not cover the bubble; the shot stops at the line's end plus 0.4 s. Never click; the 45 s `kit_ca02_t_tail` defaults the choice to `silent`.
- `kit_ca02_there` is set 1.5 s after Look up by Chidi's mapping (the 4 s scenario timer is a fallback), and bark 2 needs the player in earshot: staff stand still for the first seconds of a load; the player starts near the kiosk.
- If bark 1 starts later than 1.5 s after Look up the hook still fits (it is a fixed 3.0 s window), but note the real mark: the hook is cut from the take's `bark1_start`, and the office window is a separate window of the same capture starting at `bark2_start` minus 1.8 s, so the two never overlap.
- The mail client has no recipient unless Fatima's team card was noted; the first Send is final; closing the mail client after a send opens the flip at once.
- Throttle: `window.__test.throttleFps(20)`; never `fixedStep=false`.

## Take plan (names follow ca05; scripts not written)

| Take | Content | Cut points |
|---|---|---|
| `t02_attack_run` | one run: Start, research (careers page, Colin and Fatima noted), email builder filling, Send, result panel, mail client closes onto the flip heading | marks for each: research window (about 4.5 s), builder window (about 7.2 s), Send click plus 3.4 s on the green panel, flip window 2.0 s; the closing click must come right after the panel hold |
| `t02n_attack_run_narrow` | the same run with injected CSS `max-width: 560px` on the browser, mail client and result panels, for 9:16 and 1:1 | frame on the vacancy block, the slot pickers with the CV label, and the result ticks |
| `t04_fatima_flip` | S8: Fatima F1 after the send | in = F1 audio start minus 0.15 s, 8.4 s; chat closes before the choice |
| `t05_inbox_list` | S6, two runs: run A the list held (3.4 s); run B the list 3 s then the Tendai Shava card opened (7 s, framed on header and file label, button row out of frame) | each run its own capture so the topic shot and the inbox shot never show the same seconds twice; also the list for the `topic` shot |
| `t05n_inbox_narrow` | S6 with the narrowed panel (560 px): list and the opened genuine card, header and file label in a 607 px crop | cx check on the From line |
| `t07_chidi_prompt` | S7: one capture, two windows: hook (bark 1) and end line (bark 2) | hook in = `bark1_start` minus 0.15 s, 3.0 s; end in = `bark2_start` minus 1.8 s, 8.6 s |

Room shots (hook, office) and the Fatima portrait need only a cx check at 607 px; confirm the world-bark bar sits inside the crop.

## Music

CA scenarios set the PeaceFolk playlist on `game_loaded` (D331); the edit decides, the take records with game audio. Nothing to add here.

## Not verified (needs the take dry run)

- Everything above (desk scout). In particular: the email builder's CSS hooks and tab text, what the list row shows for attachments, which pretext and ask picks make Fatima's reply arrive, whether the barks play voiced audio in a capture, `kit_quiet` under `--set`, the ask cue's look.
