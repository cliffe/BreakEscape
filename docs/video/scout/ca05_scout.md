# ca05 Fake sign-in pages: trailer scout

Scouted 23 Nov 2026 from the scenario, ink, cached sidecars and engine source, for the attack-first episode trailer (recipe `docs/video/recipes/course-trailer.md`, model `ca01_scout.md`). **Desk scout only**: no server was started, nothing was recorded or played, so every "Verified" column below means "read in source", not "seen". Clip lengths are real (`ffprobe` on the cached mp3s); in game add 0.2 to 0.4 s. Button labels and CSS hooks marked (confirm) need the take's dry run.

## Headline

- **One room, one kiosk, Quayholt Insurance (QI, purple tab `#6b4c9a`).** `training_room` holds Niamh Doherty (host, `niamh_doherty`), Anjali Rao (`kit_anjali_rao`), Darren Price (`kit_darren_price`), the kiosk (`training_kiosk`), a cooler and Darren's workstation (`kit_ca05_pc`). No walks, locks or VM.
- **Strip:** Brief, Research, Build, Write, Flip, Defend, Debrief (the Build step is the landing-page builder, the one new attack tool).
- **The builder is a model, not a working page.** `landing-page-builder-minigame.js` header: the preview is a tiny fake browser drawn from `<div>`s, holds no form control or link, the player types nothing, every choice is a chip from an authored list, every domain ends `.example`, nothing is sent or collected. Show it exactly as the game does (the chips and the inert preview). No extra "not real" overlay is needed, and no card says "working page" or "your phishing page is live".
- **Awareness profile edits three rows only:** which service (brand: Quayholt or Sharetide), the address (three look-alike domains), the padlock (on or off). Wording, purpose and fields are preset. The page title is "Quayholt single sign-on".
- **Defend is five pages behind links**, each opened in a small browser with a clickable address bar, padlock and certificate (two real, three look-alike). The address is the tell, so frame carefully (spoilers below).
- **Living-office moment is the step-away.** After the defend set the kiosk shows "Before the debrief" with Look up (`stepAway: true`). Then Darren goes to his workstation, says "Voicemail's come through by email. Signing in to hear it." and, about 4 s later, "Password's in, and now my phone wants me to approve it. Fine to say yes?" (the outline's end line). It is a world bark; a click opens a chat whose three options are outcomes (Deny, Approve, Say nothing), so the take **must stop before the menu or any click**.
- **One take gives the hook and the end line.** Both Darren barks come from the same step-away run. That also sets up the open loop: the hook is the voicemail link, the end line is where it leads.
- **Cached lines tested by sidecar, not live.** 60 sidecars in `tts_cache/ca05_signin_pages`, every needed line present with a matching mp3. Live `/tts` requests were not made (no server, per brief). Audio plays only for lines whose ink or JSON bark text matches the sidecar exactly.

## Part A: voiced lines (sidecars and lengths)

### Hook and end candidates (Darren, step-away barks)

| ID | NPC | Text | Len | Path | Use |
|---|---|---|---|---|---|
| D1 | kit_darren_price | Voicemail's come through by email. Signing in to hear it. | 4.70 s | bark at +1.5 s after Look up (needs `kit_ca05_out` true and `kit_quiet` true); source: `kit_darren_price` eventMapping in `scenario.json.erb` | **hook** (recommended). Not a tell, not a grade; sets the story |
| D2 | kit_darren_price | Password's in, and now my phone wants me to approve it. Fine to say yes? | 6.38 s | bark about 5.5 s after `kit_ca05_there` (so about 9 to 10 s after Look up); needs `kit_ca05_prompt_choice` empty and `whenPerceivable` (player in range) | **end line** (outline's pick). Stop before the choice menu |

### Niamh (`niamh_doherty`, `ink/niamh_doherty.ink`)

| ID | Text | Len | When | Use |
|---|---|---|---|---|
| N1 | Your email with the link has gone to Hana. Now take the other seat and check the pages that land behind links like yours. | 7.13 s | talk after the send (`phish_sso_staff_attempts > 0`), defend not done | **flip line**. Chat closes before the "Thanks, Niamh." choice |
| N2 | Welcome to the Quayholt exercise. Start at the kiosk: research us, build a sign-in page and send the link, then swap seats and check the pages yourself. | 10.18 s | first talk, fresh game | too long for a beat; spare for the course trailer |
| N3 | That's both seats done, thanks. Read the address bar before you type a password. A padlock doesn't make a page ours. | 7.73 s | talk after defend complete | **off**: names the tell |
| N4 | Read the address bar before you type a password. A padlock doesn't make a page ours. | 5.50 s | after-defend hub | **off**: names the tell |
| N5 | You read the address and didn't type your password into the copy... / You kept your password off the fake page... / Your password went into the copy... | 6.4 / 6.8 / 7.9 s | after-defend hub, branch-dependent | **off** (grades) |
| N6 | Any time. | 1.06 s | "Thanks, Niamh." choice | no |

### Anjali and Darren (kit ink, shared across episodes)

| ID | NPC | Text | Len | Path | Use |
|---|---|---|---|---|---|
| H1 | kit_anjali_rao | The alerts keep flagging lookalike sign-in pages. They're getting harder to tell apart. | 5.62 s | `ca05` knot, after defend, **not caught** (`kit_key_caught` unset), talk to her; pattern level, not a grade | hook spare (needs a seeded defend-done entry; over the 5 s cold-open lint) |
| H2 | kit_darren_price | Seen a few lookalike login pages doing the rounds. Hard to tell from the real thing now. | 6.02 s | Darren `ca05` knot, after defend, not caught | spare |
| H3 | scenario chatter | Phones haven't stopped today. | 2.02 s (Anjali) to 2.69 s (Darren) | ambient before kiosk Start only (`kit_quiet` false) | cold-open spare, pairs with a card |
| H4 | scenario chatter | Claims backlog's easing off. / Cooler's cold for once. | 1.94 to 2.98 s | same | spares |
| H5 | kit_darren_price | Busy on the awareness side. / Just grabbing some water. | 2.45 / 2.09 s | Darren chatter, before Start | spares |
| H6 | kit_anjali_rao | Darren, have you just sent me a sign-in link? It's gone to the whole claims team. | 5.93 s | bark after "approve" or "say nothing" | **off** (consequence of the choice, a grade) |
| H7 | kit_darren_price | Nice catch on that fake sign-in page... / Saw you clock that lookalike sign-in. The address gave it away... / Those copied sign-in pages are catching folk out all week. The address bar's where they slip. | 5.7 to 6.8 s | after defend | **off** (grade or tell) |
| H8 | kit_darren_price | Right, denied. I'll report it now and change my password. / Done. That's me in. | 5.38 / 2.26 s | the choice | **off** (outcome) |

### Uncached

None needed. The attack landing has no person giving way: Hana Novak is a `people` record (mail target), not an NPC in the room. Her reply "Thanks, I'll sign in through that link." is mail text only (arrives after about 6 s, `emailReplyDelay`). Narrator covers that beat.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Ambient room wide | `training_room`: Niamh, Anjali, Darren, kiosk, cooler | fresh game, Skip tutorial, close Brief | no | source only |
| S2 | Kiosk Brief and strip | `training_kiosk` EpisodeRunnerMinigame | `__test.interact('training_kiosk')` (first try can be swallowed, retry up to 3 as in ca01) | no | source only |
| S3 | Open-source research | button "Open the browser", then tabs Quayholt Insurance (`quayholt_site`: team, IT, news) and Friendface (`quayholt_social`) | after Start; noting is a click on the block (`.ob-block[data-id=...]`) as in ca01 | public facts only. Block ids: `blk_staff` (Hana Novak, claims handler), `blk_sso` (single sign-on page), `blk_itdesk` (IT service desk address), `blk_news` (SSO moves to a new provider this month) | source only |
| S4 | Landing-page builder (the USP shot) | kiosk Build step; engine `landing-page-builder` with `landingPageId sso_login`, `targetId sso_staff` | after S3 (the Pretext card needs facts noted; `se_intel_quayholt_sso_portal` and `..._sso_migration` feed `pretext.facts`) | **partly**: the "This page has N giveaways: ..." line (`p.lpb-tell-counter`, `tellCounter: true`) names the tells, and the Score panel lists per-factor rows (e.g. "The address is X, not Y"). Hide both. Chips (service, address, padlock) and the inert preview are fine | source only; selectors (confirm) |
| S5 | Send the link | mail client, `Compose`, payload kit item "Sign-in page" (`kit_sso_page`), pretext and ask pickers, subject "Action needed: sign in again" | after S4 built and scored (`landing_sso_login_built`); first Send is final (`maxMessages 1`) | the composed mail is a worked pretext (pattern only: keep to the closed pickers, never a readable full body) | source only |
| S6 | It landed | mail result panel plus Hana's reply (about 6 s after Send): "Thanks, I'll sign in through that link." | after S5, if the chosen address passes (`linkThreshold 55`, `brandGate true`) | pattern level; no worked lure | source only. Which of the three domains clears 55 was not computed |
| S7 | The flip | closing the mail client opens the kiosk on "Now it lands on you" (`flipHeading`) | after S6 | **yes**: the page is redrawn with "the parts picked out below are what make it believable" and a defender narrative naming the address. Frame the heading and strip only | source only |
| S8 | Pages behind links (defend) | `Open the inbox`, then `Start` (confirm label); set `e5_links_inbox`, five pages (`e5_sso_lookalike` 08:47, `e5_sso_real` 09:02, `e5_calendar_misspelt` 10:15, `e5_mailbox_support` 11:30, `e5_password_real` 13:05) | **seed**: `episode_e5_signin_pages_state={"done":["brief","osint","build","write","flip"]}` plus `phish_sso_staff_attempts=1`; kiosk opens on "Defend" | list: no. Opened page: the address, padlock and certificate are the answer. Subjects ("Your mailbox is 98% full", "shared a calendar") are lures; the page body for `e5_mailbox_support` reads "please use this page rather than ringing the service desk" (secrecy tell). `feedbackMode: immediate`, so a pick shows the verdict at once: press nothing | source only |
| S9 | Darren and the prompt | `kit_darren_price` bark, workstation `kit_ca05_pc` | **seed**: `episode_e5_signin_pages_state={"done":["brief","osint","build","write","flip","defend"]}`, `episode_e5_signin_pages_defend_complete=true`, `kit_defend_done=true`, `kit_attack_done=true`, `episode_e5_signin_pages_defend_percent=100`, and `kit_quiet=true` (the quiet flag normally comes from the state mapping; confirm it is set by the seed). Open kiosk, wait for "Look up", press it. The step-away mapping (`episode_step_away`, needs `kit_defend_done`) sets `kit_ca05_out` | none until the chat opens, so never click | source only |
| S10 | Niamh's flip line | talk to `niamh_doherty` | seed S8's state without `defend`, then close the kiosk (`bridge.minigame.close()`) and walk or `moveToNear` to her | no | source only |
| S11 | Debrief | kiosk step 7 | after defend | **yes** (verdicts, the UK GDPR cost panel) | not used |

Minigame types: episode runner, OSINT browser, landing-page builder (model page), mail composer with payload kit and template slots, flip view, inbox-triage with page cards, step-away, debrief. Tool names for cards: **Open-source research** (S3) and **Look-alike page builder** (S4), the outline's phrase, each at least 3 s start to finish.

## Spoiler judgements

- **Show:** S3 (public facts, one noted), S4 chips and preview with the page title and brand, but with the giveaway counter and score rows cropped or hidden, S5 closed pickers only, S6 the green landed state, the strip tick, the five-row list before any pick, one page opened with the verdict buttons unpressed, Darren at his desk.
- **Off:** the "This page has N giveaways" line, the Score per-factor rows, S7 body and S11, `feedbackMode: immediate` verdict panels (any press), the domain explanation notes, Niamh N3 to N5, Darren H7 and H8, Anjali H6, the debrief "What the approval let in" text, the UK GDPR cost panel.
- **The address bar is the tell (decision for owner).** Opened in the defend browser, a look-alike address reads plainly (`quayho1t.example`, `quayholt-sso.example`). The owner's settled rule since ca01 is "spoilers fine, no masks", and ca01's script reads the lure address. Recommendation: frame on the two real pages' headings and the list, and let one look-alike page open with the address bar visible but not commented on. Marked PLACEHOLDER (owner question) in the script.
- Never put a readable "full email body plus the link" on screen (rule A2): the link text is `quayholt-sso.example` and the page has a reusable look.

### CSS hides the takes will need (confirm in dry run)

- Builder: hide the giveaway line (`p.lpb-tell-counter`) and `ul.lpb-checklist` (per-factor result). Keep the chips, the preview and the Score button.
- Flip screen: hide everything under the heading "Now it lands on you".
- Defend browser: hide the verdict buttons' feedback panel only if a take shows one (it must not).
- Always: the HUD CSS from `tools/video/capture/launch.mjs` and the "Close with X" bar if it shows; no Mission Brief popup; Skip tutorial.

## Avatar

The player appears as the hooded hacker unless `BE_SPRITE=female_office_worker_v2` is set (the scenario names that sprite). The player is in frame in the room shots (hook S9 and the end line), so those two need the avatar window agreed with VID1 and AC0, or a crop to the upper two thirds as in ca01. All minigame shots (S3 to S8) have no player.

## Hazards

- **Fresh game for every take.** A used game reopens on its saved step (kiosk).
- The first `interact` on the kiosk is sometimes swallowed (retry up to 3).
- Ambient chatter stops (`kit_quiet`) after Start; film any chatter hook before Start. The Darren barks need `kit_quiet` true and run only from the step-away.
- **The choice menu:** the chat opens by click (or by the ask cue) and offers outcomes; the 45 s `kit_ca05_t_tail` timer then sets `silent`. The take must stop at D2's end plus 0.4 s and never click. `askCue` may open a visual cue near Darren (confirm it is not an outcome).
- `kit_ca05_there` must be true for D2: the timer sets it 4 s after `kit_ca05_out`; barks need `whenPerceivable`, so the player must be within earshot. Staff stand still for the first seconds of a load.
- **Unconfirmed in source:** which of the three look-alike domains (and brand and padlock settings) clear `linkThreshold 55` so Hana replies "I'll sign in". The take should try `d_word` (`quayholt-sso.example`) first and read the result before Send.
- First Send is final (`maxMessages 1`), and closing the mail client after a send opens the flip at once.
- Throttle: `window.__test.throttleFps(20)`; never `fixedStep=false`.

## Music

CA scenarios set no music; the PeaceFolk bed is applied at edit time (D331), as for ca01 and ca15.

## Not verified (needs the take dry run)

- Everything above, as a desk scout. In particular: builder CSS classes and button labels ("Open the page builder", "Score", "Attach"), the strip tick on Continue, the page card layout in triage, whether the barks play voiced audio in a capture, `kit_quiet` under `--set`.
- Heights: whether the builder and inbox panels fit the 9:16 crop (700 px panels, zoom 1.4 as in ca15).
