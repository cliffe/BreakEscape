# ca10 Fake downloads and checks: trailer scout

Scouted 23 Nov 2026 from the scenario (`scenarios/ca10_downloads_and_fake_checks/scenario.json.erb`, `mission.json`, `ink/niamh_doherty.ink`), the cached sidecars and the engine source, for the attack-first episode trailer (recipe `docs/video/recipes/course-trailer.md`, model `ca05_scout.md`: same Quayholt room, same kiosk, same builder engine). **Desk scout only**: no server, nothing recorded, so "Verified" means "read in source". Clip lengths are `ffprobe`, speech and sentence cut points are `ffmpeg silencedetect` (-35 dB, 0.18 s) on the cached mp3s; in game add 0.2 to 0.4 s. Selectors and button labels marked (confirm) need the take's dry run.

## Headline

- **One room, one kiosk, Quayholt Insurance (QI, purple `#6b4c9a`).** `training_room`: Niamh Doherty (host, `niamh_doherty`), Anjali Rao (`kit_anjali_rao`), Darren Price (`kit_darren_price`), the kiosk (`training_kiosk`), a cooler and Darren's workstation (`kit_ca10_pc`). No walks, locks or VM. Player sprite is `female_office_worker_v2` in the scenario itself (no BE_SPRITE needed; the ca05 `checkSprite` still guards it).
- **Strip:** Brief, Research, Build, Write, Flip, Defend, Debrief. Same as ca05.
- **The attack is a fake "verify you are human" check on a supplier's own portal ("borrowed trust").** Research finds that Quayholt orders catering through Fernside's order portal, bookmarked by the operations team (`blk_fernside_portal`, public page "Suppliers and ordering"). Build uses the landing-page builder (`pageType fakeCheck`, a model: authored chips, inert preview, no command ever shown). Send is one short email to Leo Brennan (operations colleague) from the operations address; there is no link, he opens the portal from his own bookmark.
- **Builder rows:** host (the real Fernside page "after someone has broken into it" / a look-alike / an unrelated page), pretext (3), urgency (calm / pushy), step wording (a smooth routine-looking check / a clumsy demand). The preview draws the host address bar, padlock, heading "Verify you are human", the chosen step label as inert text, and a reveal button for one authored harmless line. `tellCounter: true` prints "This page has N giveaways" and a Score checklist lists per-factor rows: **hide both** (as ca05).
- **Defend is a morning of seven web pages** (`e10_browser_morning`, feedbackMode immediate, three verdicts: Carry on / Close and report / Go the trusted way): a fake check on a bookmarked Fernside page, a genuine Fernside "I am not a robot" tick, a fake browser-update page, the browser's own genuine relaunch bar, a full-screen "computer locked, call" alarm, an extension permission page and a `.pdf.exe` download. Two of the seven are genuine.
- **Living-office moment is the step-away.** After the defend set the kiosk shows "Before the debrief" with Look up. Darren goes to his workstation and barks D1 about 1.5 s later; D2 (names the paste step, then a choice menu) follows about 7 s after Look up. A click opens a chat whose options are outcomes: **the take stops before any click**.
- **Cast diversity.** Niamh (Northern Irish, mid 20s), Anjali (Indian English, about 35), Darren (West Country, 50s). Leo Brennan is a `people` record, not an NPC, and has no voice (his reply is mail text).
- **Cached lines tested by sidecar and ffprobe, not live `/tts`.** 126 sidecars in `tts_cache/ca10_downloads_and_fake_checks` (and the same set again in `..._defend`). Audio plays only where the ink or JSON bark text matches a sidecar exactly.
- **ca05 take scripts are the model**: `tools/video/takes/ca05/` (`_ca05.mjs`, `t02_attack_run`, `t03_page_builder`, `t03b_page_builder_narrow`, `t04_niamh_flip`, `t05_pages_list`, `t05b_pages_list_narrow`, `t07_darren_prompt`). Copy to `tools/video/takes/ca10/` with the global keys renamed (`episode_e10_downloads_and_fake_checks_*`, `kit_ca10_*`).

## Part A: voiced lines (sidecars, ffprobe and silencedetect)

### Darren Price (`kit_darren_price`, world barks in the step-away)

| ID | Text | Len | Speech | When | Use |
|---|---|---|---|---|---|
| D1 (72cfd0ee) | Supplier portal's asking me to prove I'm human now. | 4.10 s | 0.35 to 3.59 | bark 1.5 s after Look up (`kit_ca10_out`, needs `kit_quiet` true) | **hook** (recommended). A set-up with no tell and no grade; the attack half builds that exact page. The outline names it as the end line: see owner question 1 |
| D2 (dd36fb9c) | It says press Windows and R, then paste and press Enter. It's off my bookmarks. Shall I? | 9.53 s | 0.33 to 9.09 | about 7 s after Look up; the choice menu follows | **off**: it is the tell, and the menu is outcomes |
| D3 (08097618) | Password's in, and now my phone wants me to approve it. Fine to say yes? | 6.38 s | | the ca05 line, same cache | not this episode's story |
| after-choice lines (33750c94 "Pasted. The box has gone.", 4ae9f0ba "Done. That's me in.", f16a4b63 "Closing it. I'll ring security.", 43bf51a1, 7d64147e, 3cd49648 ...) | | | | the outcome of the pick | **off**: outcomes, grades or the tell named |
| ambient (30767534 "Busy on the awareness side.", 834726e9 "Just grabbing some water.", 66914b7e "Claims backlog's easing off.") | | 2.1 to 3.0 s | | chatter before Start only (`kit_quiet` false) | spares; cooler and ambient shots only |

### Niamh Doherty (`niamh_doherty`)

| ID | Text | Len | Speech and cut points | When | Use |
|---|---|---|---|---|---|
| N1 (3ab8ba65) | Good, the email's away to Leo. Now take the other seat and sort a morning of the web the way it really turns up. | 7.97 s | "Good," ends about 0.6; sentence one 1.16 to 2.17; sentence two 3.43 to 7.97 ("Now" 3.43, "take the other seat" 4.01 to 4.80, "and sort a morning of the web the way it really turns up" 5.14 to 7.97) | talk after the send (`phish_order_colleague_attempts > 0`), defend not done | **flip line**. Whole line in the shot (the game's bar shows the whole text), chat closes before the "Thanks, Niamh." choice |
| N2 (4954c179) | Welcome back to the Quayholt exercise. Last time it was sign-in pages; this time it's the whole web. | 6.41 s | s1 0.26 to 2.31, s2 2.67 to 6.16 | first talk, fresh game | spare hook only if D1 goes to the end (first sentence alone, a 2.4 s hook); "Last time" points at an episode the viewer has not seen |
| N3 (c3f31de5) | The kiosk takes you through a morning of fake downloads, 'verify you are human' boxes and pop-ups that want you to call. | 7.97 s | one run 0.26 to 7.62 | second line of the first talk | spare for a topic slot (no narrator over it); one sentence, no clean cut |
| N4 (a2b3123b) | And if you ever slip, tell us straight away. Nobody's in trouble for it. | 5.21 s | s1 0.32 to 3.28 (gap 1.75 to 2.04 after "slip"), s2 3.73 to 4.79 | second line after the defend set, when `kit_ca10_host_said` is true or `kit_defend_done` is false | **end line** (recommended, no grade, no tell, sets the O4 tone). First line of that talk, "That's both sides done. Get your software from Quayholt Apps, read the address, and never let a page drive your computer." (b135a777, 8.81 s), plays before it and **names the tell**: cut in after it |
| N5 (b135a777) | That's both sides done. Get your software from Quayholt Apps, read the address, and never let a page drive your computer. | 8.81 s | gaps 1.59 to 2.12, 4.18 to 4.70, 5.79 to 6.00 | defend complete | **off**: "read the address" and "never let a page drive your computer" are the tell list |
| N6 | You closed that page... / You treated that check as the trap it was... (5fcacb7a, a894a46c); "To whoever built that page..." (70583369, 7d749414); "Follow a page like that and the machine is gone..." (0ad8ba44) | 5.7 to 8.8 s | | after the step-away, by choice | **off**: grades and outcomes |
| N7 | Any time. | 1.34 s | | "Thanks, Niamh." | no |

### Anjali Rao (`kit_anjali_rao`)

Ambient only before Start ("Phones haven't stopped today." 2.02 s, a scenario-level pool line, so Anjali, Darren or Niamh may speak it (sidecars 2.02, 2.69 and 2.54 s); used as the hook in the round-1 script; "Queue's moving along." 1.78 s, "Need a proper break." 1.70 s). Her ca10 story lines are consequence barks ("Your account's being used from somewhere we've never seen, Darren. That's not you, is it?" 5.62 s) and after-defend reactions (cfe54628 "Nicely done. Those fake security checks are built to look completely routine." names the verdict of the pick): **off**.

### Uncached

None needed. Leo's reply "Thanks, I'll put the order in now." (`replies.landed`) is mail text, unvoiced, about 6 s after Send (`emailReplyDelay 6`). The narrator covers the landing. Nothing is blocked on new cast audio.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Ambient room wide | `training_room` | fresh game, Skip tutorial, close Brief | no | source only |
| S2 | Kiosk Brief and strip | `training_kiosk` | `__test.interact('training_kiosk')` (first try can be swallowed, retry up to 3) | no | source only |
| S3 | Open-source research | "Open the browser", tabs Quayholt Insurance (`quayholt_site`: pages "Suppliers and ordering", "Our people") and Fernside Catering (`fernside_site`) | after Start. Note by clicking `.ob-block[data-id=blk_fernside_portal]` (Fernside's portal, bookmarked by the operations team); `blk_leo` (Leo Brennan, operations colleague) is on "Our people" | public facts only. Do not film the `blk_leo` note text ("What lets you write to him is the supplier portal...") | source only |
| S4 | Fake-check builder (the USP shot) | kiosk Build step; engine `landing-page-builder`, `landingPageId fake_check_fernside`, `targetId order_colleague` | after S3 (the Pretext card needs the facts noted: `se_intel_quayholt_fernside_portal`, `se_intel_fernside_small_site`) | **partly**: `p.lpb-tell-counter` ("This page has N giveaways") and `ul.lpb-checklist` (Score rows) name the tells: hide. The preview shows the chosen step label as inert text: pick the "smooth, routine-looking" label and frame on the host chips, address bar and heading; no command is ever drawn | source only; selectors (confirm) |
| S5 | Send the email | mail client, account `analyst`, To Leo Brennan; closed pickers for pretext and ask; maxMessages 1 | after S4 built and scored (`landing_fake_check_fernside_built`); first Send is final | the composed mail is a worked pretext: keep to the closed pickers, never a readable body | source only |
| S6 | It landed | mail result panel (green) then Leo's reply about 6 s later | after S5 if the page clears `linkThreshold 70` (`check.points`: borrowedTrust 35, pretext 25, stepWording 25, urgency 15). Recommended picks: host "real Fernside page", pretext "Confirm you are human to continue to the order portal", urgency "One quick step to continue", step "smooth": best case 100. Not computed in a run | the panel's check lines are pattern level ("From the operations address he acts on"); fine | source only |
| S7 | The flip | closing the mail client opens the kiosk on "Now it lands on a colleague" (`flipHeading`) | after S6 | **yes**: the body names "the parts picked out below" and a defender line ("the page still had to tell him to paste and run something..."). Frame the heading and strip only | source only |
| S8 | Pages list | "Open the inbox" then Start (confirm labels), set `e10_browser_morning`, seven pages | **seed**: `episode_e10_downloads_and_fake_checks_state={"done":["brief","osint","build","write","flip"]}` plus `phish_order_colleague_attempts=1`; kiosk opens on Defend | list: no (subjects only: "From a bookmark: Fernside Catering order portal", "A page that took the whole screen", "A download that started from a link" and so on) | source only |
| S9 | One page opened (defend) | same set, `e10_genuine_captcha` ("From a bookmark: Fernside Catering order portal", 09:20): url `orders.fernside.example/login`, padlock, heading "Order portal sign-in", a tick "I am not a robot", button Continue | S8, click the second row | **no tell and no answer**: it is the genuine page, and it looks like the page the viewer just built. Carry on / Close and report / Go the trusted way sit under it, **nothing pressed** (`feedbackMode: immediate` shows the verdict at once) | source only |
| S10 | The fake-check page opened | `e10_fake_check` (09:12) | | **yes**: the body is "Press Windows + R. Press Ctrl + V. Press Enter." Never film it opened (the steps are the tell, and a readable instruction list is the lure itself) | not used |
| S11 | Step-away panel (Look up) | kiosk "Before the debrief" | **seed**: state `done` through `defend`, `episode_e10_downloads_and_fake_checks_defend_complete=true`, `kit_defend_done=true`, `kit_attack_done=true`, `episode_e10_downloads_and_fake_checks_defend_percent=100`, as in ca05 `t07_darren_prompt` | no (the panel is "Look up from the kiosk and carry on in the room for a minute") | source only |
| S12 | Darren and D1 | `kit_darren_price` bark, workstation `kit_ca10_pc` | S11, press Look up (sets `kit_ca10_out`); `kit_quiet` is set by the game itself (ca05 dry run) | none before the chat opens: **never click**. The workstation hint text "shows a 'Verify you are human' box. It says press Windows and R, then paste and press Enter" is observation text only, never interact with the PC | source only |
| S13 | Niamh's flip line | talk to `niamh_doherty` | S8's state without `defend`, close the kiosk (`bridge.minigame.close()`), walk or `moveToNear` to her | no | source only |
| S14 | Niamh's no-blame line | talk to `niamh_doherty` | S11's state plus `kit_ca10_host_said=true` (stops the consequence lines taking the hub first; confirm in the dry run) so the hub says N5 then N4 | N5 shown for its whole length as the game's subtitle: cut in **after** it; the bar must not show N5 | source only; two-line sequence (confirm: does advancing cut N5 and start N4 cleanly) |
| S15 | Debrief | kiosk step 7 | | **yes** (verdicts, "What the pasted line did", the cost) | not used |

Minigame types: episode runner, OSINT browser, landing-page builder (fake-check model), mail composer with templates, flip view, inbox triage with page cards, step-away, debrief. Tool names for cards if any: **Open-source research** (S3), **Fake-check builder** (S4). Each at least 3 s start to finish.

## Spoiler judgements

- **Show:** S3 (public facts, one noted), S4 (host chips, preview with address bar, padlock, heading; counter and Score hidden), S5 closed pickers and the To line, S6 the green landed panel, the strip tick, the seven-row list before any pick, S9 the genuine page opened with the verdict buttons unpressed, S11 the Look up panel, S12 Darren at his desk, N1 and N4.
- **Off:** the "N giveaways" line, the Score rows, S7 body, S10 (the fake check opened: it prints the keystroke steps), S15, every verdict panel (any press), the debrief "What the pasted line did" text, N5, N6, D2 and the choice menu, Anjali's consequence bark, the flip's "picked out below" body, the Pagewrangle/Quayholt Apps replies, the clipboard reveal text.
- **The pages that tell:** the fake-check, fake-update, alarm, extension and download pages all carry their tell in their body. Only the list and the genuine tick page are filmed.
- Never put a worked step list on screen (rule A2). The builder shows an authored label, never keys.

### CSS hides the takes will need (confirm in dry run)

- Builder: `p.lpb-tell-counter`, `ul.lpb-checklist`; keep chips, the preview and the Score button. Hide the reveal button's text if it shows the clipboard line.
- Flip screen: hide everything under the heading "Now it lands on a colleague".
- Triage: nothing to hide on the list; on the opened genuine card hide any feedback panel only if a take shows one (it must not).
- Always: the HUD CSS from `tools/video/capture/launch.mjs`, no Mission Brief popup, Skip tutorial.

## Barks and queueing

Only Darren barks in the step-away: D1 at about +1.5 s, D2 at about +7.0 s (`kit_ca10_there` is set by Darren's own 1.5 s mapping, then 5.5 s). Same-NPC barks queue behind each other, so the step-away is a one-shot take: the window runs from Look up to D1's end plus 0.4 s and stops. D1 sits in the hook; the same take cannot also give a silent office shot, because D1 plays from +1.5 s. The Look up panel is filmed separately and stops before the click.

## Avatar

Player appears in the room shots (hook, Niamh's portrait is a talk view). Hook crop for 9:16: upper two thirds with Darren and the player, cx check. All minigame shots have no player.

## Hazards

- Fresh game for every take; a used game reopens on its saved step.
- Chatter stops after Start (`kit_quiet`): film any chatter before Start.
- First Send is final (`maxMessages 1`); closing the mail client after a send opens the flip at once.
- Whether the default picks clear `linkThreshold 70` is unconfirmed; read the result before Send and retry on a fresh game if it fails.
- The 45 s `kit_ca10_t_tail` timer (from `kit_ca10_asked`) and 85 s `kit_ca10_t_done` run in the step-away: the take stops at D1's end plus 0.4 s.
- Throttle: `window.__test.throttleFps(20)`; never `fixedStep=false`.
- Two takes of the list (topic and pages) from separate runs so the same seconds are not shown twice.

## Music

CA scenarios set the PeaceFolk playlist on `game_loaded` (D331). The take hides it in the capture; the edit lays the bed.

## Not verified (needs the take dry run)

- Everything above, as a desk scout. In particular: builder CSS classes and chip labels, the strip tick on Continue, the page-card layout in triage, whether the barks play voiced audio in a capture, `kit_quiet` under `--set`, Niamh's two-line sequence in S14, and the fit of the builder and inbox in a 607 px 9:16 crop (narrowed-panel takes below).
