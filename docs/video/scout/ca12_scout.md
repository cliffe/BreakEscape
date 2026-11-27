# ca12 Visitors and tailgating: trailer scout

Scouted 22 Nov 2026 for the first Cyber Aware episode trailer (recipe `docs/video/recipes/course-trailer.md`, theme `docs/video/CA_THEME_TWO_SEATS.md`). Nothing was recorded. Entry states are taken from the scenario and the ink and are "expected, not played" unless marked "seen".

## Headline

- **Lines:** 74 cached lines in `tts_cache/ca12_visitor_tailgater/` (every sidecar has its `.mp3`). 24 candidates were tested live: **24 of 24 returned 200**, and the control line was refused with 403.
- **Best end line:** Camila, "Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up." (4.58 s).
- **Best attack payoff:** Delphine, "Go on then, I'll buzz you through. Studio's up the stairs on your left." (4.42 s).
- **Best flip line:** Lorna, "You talked your way through that door just now. Here you're the one being asked, same visitors." (5.69 s).
- **Top set pieces:** the call with Delphine and its influence meter; the Friendface post being noted; the pretext card; the kiosk step strip ticking to Defend; the reception triage list before any verdict; the studio door scene with Camila.
- **Two rooms, both seen:** the training room (studio, with the kiosk) and the lobby (Delphine's desk). They sit side by side, so one wide frame shows both (screenshot `04_lobby`).

## Environment

- Server: keyless, from the main checkout, `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=.../vendor/bundle bundle exec rails server -b 127.0.0.1 -p 3446`. It was stopped by PID at the end of the scout.
- Games: 12040 and 12041 (ca12, demo user, made with `tools/playtest/new-game.sh`). No other game was touched and no game record was edited.
- Tools: `tools/video/scout/tts-test.mjs` (live line test), plus a headless Playwright script in the scratchpad for screenshots. Nothing in the repo was changed apart from the docs.
- The scout used no BE_SPRITE and made no avatar change.

## Part A: voiced lines

All results are live: 200 `audio/mpeg`, with the duration from the clip. NPC ids are the scenario's ids. "Spoiler" uses the CA rule: tells, check answers, grades and debrief verdicts stay off; the attack and the lure are shown.

### Delphine (`delphine_reception`, lobby desk; `ink/delphine_reception.ink`)

| ID | Text | Ink | Path | Len | Use |
|---|---|---|---|---|---|
| D1 | Go on then, I'll buzz you through. Studio's up the stairs on your left. | :107 `ask_reaction`, result 1 | the call, after the name-drop line, then "Any chance you can buzz me through to the studio?" | 4.42 s | **attack lands** (beat 5); also the programme cold open |
| D2 | For Catherine? She's away this week, though her boxes do come here. | :91 `reaction`, name_drop_partner | the call, "It's the sample box for Catherine Merrin..." (needs the Friendface fact noted) | 5.33 s | build-up line: the found fact landing |
| D3 | Morning. Can I help you? | :48 `start` | walk up to the desk | 2.21 s | opens the call; hook candidate |
| D4 | Right, a parcel for upstairs. Let me see who's expecting it. | :88 open_parcel | the call, first line | 4.49 s | spare |
| D5 | Before I open that door, who exactly is the parcel for? | :112 ask result 2 | ask before naming anyone | 4.34 s | spare: shows the check working |
| D6 | I can see your hands are full. Even so, I'd rather sign you in. | :93 hands_full | the call | 4.78 s | spare (defender-side voice) |
| D7 | I know you're pushed. Give me a moment and I'll do it the right way. | :95 double_parked | the call | 4.34 s | spare |
| D8 | Pop your name in the book and I'll let Yasmin know you're here. | kit (Camila at the desk) | defend or step-away scene | 3.98 s | spare |

### Camila (`kit_camila_ospina`, the visitor at the studio door; scenario JSON, `ca12_visitor` set piece)

| ID | Text | Source | Path | Len | Use |
|---|---|---|---|---|---|
| C1 | Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up. | kit set piece `ca12_visitor` | step-away panel, Look up, then the room beat sends Camila to the studio door | 4.58 s | **end line** (beat 10); programme close |
| C2 | Lovely, thanks. I'll find her myself. | same | the "let in" choice | 2.78 s | not used: it follows a choice and points at its outcome |

### Lorna (`lorna_easton`, training room host; `ink/lorna_easton.ink`)

| ID | Text | Ink | Path | Len | Use |
|---|---|---|---|---|---|
| L1 | You talked your way through that door just now. Here you're the one being asked, same visitors. | :53 | talk to Lorna after the call, with the door granted | 5.69 s | **flip** (beat 6), trimmed by picture, not by text |
| L2 | Welcome to the Merrin & Sallow exercise. Jo's set the red-team scope. I'll see you right. | :59 | fresh game, talk to Lorna | 5.69 s | spare hook |
| L3 | Try the front desk first in the hi-vis, then take the reception seat yourself. Nothing here leaves the game. | :60 | same, second line | 6.94 s | too long for a beat; good for a course trailer |
| L4 | Sign people in, walk them up, and if someone won't be checked, that's your answer. | :57 | after the call | 5.69 s | habit line; a 2.5 s "What you'll spot" card covers it better |
| L5 | Nobody's in trouble for slowing a pushy visitor down. | :49 | after the defend set | 3.29 s | tone (O4); the no-blame infographic |

Note: the ink at :59 reads "scope. I'll" and the sidecar reads "scope; I'll". Both returned 200, so the endpoint matches the line either way.

### Ambient staff (kit pools; heard as bubbles while staff move on their needs)

| ID | NPC | Text | Len | Use |
|---|---|---|---|---|
| A1 | kit_thandiwe_moyo | Right, five minutes on the sofa. The plans can wait. | 4.01 s | **hook** (beat 1): sets up her open screen |
| A2 | kit_thandiwe_moyo | Long morning on the plan sets. Bet the desk's been busy. | 3.65 s | spare hook |
| A3 | kit_thandiwe_moyo | Rev C or Rev D? | 2.30 s | ambient texture |
| A4 | kit_julian_sallow | That roof pitch still won't work. | 2.62 s | ambient texture; shared with ca04, ca14 and ca18 |
| A5 | kit_julian_sallow | Kettle's calling. Time for a brew, I think. | 3.46 s | coffee trip |
| A6 | kit_julian_sallow | Mind the model on the table. | 2.38 s | ambient |

Control: "Zebra quartz waffle protocol zero seven." for delphine_reception and for lorna_easton, refused with 403 both times.

### Lines kept off (not tested on purpose)

- Lorna's recap branch lines, "You kept the visitor with no badge at the gate.", "You sent Camila to Delphine's desk to sign in.", "Camila got in without signing in..." and the four "Camila's one of Jo's, by the way..." lines. They are grades, or they reveal the tester's brief.
- Delphine's "Right you are, leave it with me..." (the walk-away outcome) and the "reported" outcome line (a verdict on the learner's attack).
- Julian's "Pay before I land..." and "Good instinct..." lines. They are in this cache but belong to the ca04 kit content, and they are verdict praise.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer on screen? | Visual (2 s) |
|---|---|---|---|---|---|
| S1 | Ambient studio wide | `training_room`, Thandiwe, Julian, Lorna; kiosk, sofa | fresh game, Skip tutorial, `--hide-hud` (seen) | no | warm studio, three staff, plan table; good establishing shot |
| S2 | Two-room wide | doorway between `training_room` and `lobby` | fresh game, player at the doorway (seen) | no | studio left, Delphine's desk right: the two seats in one frame |
| S3 | Kiosk step strip | `training_kiosk`, EpisodeRunnerMinigame (seen) | fresh game, interact with the kiosk | no (brief text and scope box only) | brown Merrin & Sallow tab; Brief, Research, Write, The call, Defend, Debrief |
| S4 | OSINT browser | kiosk step 2, sites `merrin_site` and `merrin_social` (Friendface) | kiosk Start, Research | no tells. Shows the partner's post: pattern-level, the USP | Catherine's "On site all week again..." post clicked into notes |
| S5 | Pretext card | kiosk step 3, `pretextNpcs[0]` prep | after S4 with `merrin_partner_travel` noted | no. "Your aim: talk the front desk into buzzing you through..." heading | the found fact filling the card |
| S6 | The call with Delphine | `lobby`, person chat, costume `male_telecom_v2`, influence meter | after S5; walk to Delphine | partly: the live technique chips ("Borrowed authority", "Urgency") are pattern-level and fine; keep the tell **sentences** and the end-of-call tells panel off | courier in hi-vis at the desk, meter moving, D2 then D1 |
| S7 | The door opens | `#unlock_door:training_room` on D1 | end of S6 | no | the badge door unlocking behind Delphine |
| S8 | The flip | kiosk step 4 to 5, `flipHeading` "Now you're the one on the desk" | after S6 with the door granted | **yes, below the heading**: "the lines picked out below" mark what worked. Show the strip tick and the heading only | strip ticks to Defend |
| S9 | Reception triage | `defend.setId e12_reception_desk`, six call/visitor items | after S8 | **yes, once a verdict is picked** (result and tells). Show the list and one card before any verdict | mixed visitor cards on the desk |
| S10 | Step-away panel | "Before the debrief", Look up / Carry on | after S9 | no | panel over the studio |
| S11 | Open screen and Camila | `kit_ca12_pc` (Thandiwe's workstation), set piece `ca12_visitor` | S10, Look up; Thandiwe goes to the sofa (A1), Camila arrives (C1) | the door and screen choices are outcomes: cut before the choice menu | Thandiwe's unlocked screen, then Camila at the studio door |
| S12 | Debrief | kiosk step 6 | end | **yes**: verdicts, percentages, tells | not used |

Minigame types in this episode: the episode runner (kiosk), the OSINT browser, the pretext card, the in-person pretext call with the influence meter, the triage set, the step-away panel and the debrief. There are no locks, keypads or VM.

New mechanics to name on cards: **Pretext call** (the influence meter) and **Open-source research**. They are the USP shots. Each gets at least 3 s working from start to finish (S4 to S5, S6 to S7).

## Rooms with several NPCs visible

The training room shows Lorna, Thandiwe and Julian together, and the two-room wide adds Delphine. CA has several NPCs in one shot, unlike SAFETYNET, so the "one NPC plus the player" walking rule matters less. Walks are still straight lines.

## Entry-state notes

- Every take: Skip the movement tutorial (it overlays the top of the frame and survives `--hide-hud` unless skipped) and close the Mission Brief notes.
- S4 needs a click on the Friendface post to note `merrin_partner_travel`. Without it, `requireFact` blocks the call.
- S6 to S7: the "door granted" path is open_parcel (D4) or name_drop_partner (D2), then the buzz ask. Avoid urgency and deflect lines first (each costs 10 influence) or D1 may not come.
- S11 needs the defend set finished and Look up picked (`kit_defend_done`, then the step-away). `--set` shortcuts are untested: the take stage should try `--set kit_defend_done=true` first and fall back to playing the triage.
- The courier costume replaces the player's sprite during the call. Elsewhere the player shows the demo avatar, the hooded hacker (`female_hacker_hood_v2`), which reads as SAFETYNET. See the shot list on BE_SPRITE.

## Music

CA scenarios set no music in game, and every track in `public/break_escape/assets/music/` is a SAFETYNET set (Noir, SpyAction, SpyAgro, CutScene, Vocals). See the theme doc: a new CA track is recommended, and it needs the user's yes.

## Not verified

- S4 to S11 were driven in the browser on 22 Nov and are in the table above (S3 to S11 confirmed or corrected).
- Durations of lines in the game (with the visemes and the bar) may run 0.2 to 0.4 s past the clip length.
- Technique "chips": there are none. The technique name is a sentence under the meter (see the spoiler cuts above).

## Browser check of S4 to S11 (22 Nov 2026, headless, game 12049 and 12050 on :3446, keyless)

Screenshots in `docs/video/scout/ca12_play_shots/`. Load to a usable room took about 15 s (Resume the saved game, Skip tutorial, close the Brief). The training room is lit in day colours with no overlay (`s1_studio_day.png`). Spoiler rule held: the call, flip and triage frames saved here are only for entry-state work; the flip (S8) and the call's lower-left text are not for the trailer, see the cuts below.

| # | Result | Entry state | Action that brings it up | What the frame shows | Time from game load |
|---|---|---|---|---|---|
| S3 | confirmed | fresh | `__test.interact('training_kiosk')` (retry up to 3 times) | brown MERRIN & SALLOW tab, six-step strip, Start | about 5 s |
| S4 | **corrected** | kiosk, Start, then the stage button is **Open the browser** (not "Research") | click `Open the browser`; click the `Friendface` tab, then the `Catherine Merrin` link, then **Pin** on the first post | a **navy** "Browser" window (SAFETYNET dark chrome), two tabs, a cream page. Posts are pinned with a **Pin** button, and a green "Noted: Catherine Merrin, a partner, is often out at project sites..." line appears. Closing the browser (x) moves the strip to Write whether or not anything was pinned | about 10 s from the kiosk |
| S5 | **corrected** | after S4 | button `Prepare the call` | a **navy** card, heading "Your aim: talk the front desk into buzzing you through the badge door without a badge", "Calling: Delphine Arvanitis", "What you found", three pretext lines, a **Recipient: choose...** picker (a custom list, click the span `Catherine Merrin`), then `Approach` | about 3 s |
| S6 | **corrected** | after S5, press `Approach` | `Approach` **teleports the player to the lobby and opens the call directly** (no walk, no courier sprite is visible in the call) | a black ground (no chat background), Delphine's bust on the right, five numbered choices, the **Influence meter bottom-left** (bar, three markers, "Wary at -30 / Refuses at -50 / Reports at -70") and, once a line lands, **two lines of explanation text under the meter** | 4 s |
| S6 lines | confirmed | in the call | `minigame.choose(/sample box for Catherine/)`, then `choose(/buzz me through/)` | "Morning. Can I help you?" (D3), then D2, then D1, all as scripted. D1 shows a green `Door unlocked: Studio` toast and the meter reading -5. No technique chips as such: the technique is a sentence under the meter | about 12 s of play |
| S7 | confirmed | same | the toast on D1 | `Door unlocked: Studio` | at D1 |
| S8 | **corrected** | the call ends with **Done** (the last menu item, or `minigame.close()`); reload, then the kiosk opens at the flip, strip on "4 The call" | kiosk, then `Continue` | the flip screen (heading "Now you're the one on the desk", then a replay of the call with explanation text: **spoiler, crop to the heading and strip only**). The tick to **Defend** happens **on Continue**, with a clean "Take the calls" panel and button `Open the queue` (`s8_strip_defend.png`): use that frame for the tick | about 8 s from load |
| S9 | confirmed, with a step the scout missed | after S8, `Open the queue` | triage opens on a **navy Brief screen** with `Start`; Start shows "0 of 6 sorted" and the six visitor rows; clicking a row opens its card with four verdict buttons | list plus one card (use "Expected client" or "Unknown visitor"), before any verdict | about 10 s from the kiosk |
| S10 | confirmed (shortcut works) | `--set` below | kiosk | brown panel "Before the debrief" with `Look up` and `Carry on`, all five steps ticked | about 5 s |
| S11 | **confirmed** | S10, `Look up` | `Look up` (no further input) | the room beat runs on its own: Thandiwe leaves her open screen and says A1 at about 5 s (`s11_thandiwe_a1.png`), sits at about 20 s, Camila is already in the room and says C1 beside the kiosk at about 46 s (`s11_camila_c1.png`: she stands at the upper right, not at a studio door). The door and screen choices open at about 46 s and default to `silent` at about 91 s; the beat is done at about 96 s. A toast "The kiosk. Your place is saved." sits at the bottom of every frame | 46 s of game time after Look up for C1 |

**Cheapest entry states** (new-game.rb, all verified to load):

- S3 to S6: a plain fresh game. Reaching the call from a cold load is about 25 s: Resume, close Brief, kiosk, Start, Open the browser, close it, Prepare the call, pick Catherine Merrin, Approach. The pinned post is **not required** to progress here (the card still lists "What you found" only if pinned), so for the shot do pin it.
- S8 and S9: the call must have been finished once (Done). There is no `--set` shortcut tested for the flip, so replay the call (about 12 s) or reuse the same run.
- S10 and S11: `--set 'episode_e12_visitor_tailgater_state={"done":["brief","osint","write","flip","defend"]}' --set episode_e12_visitor_tailgater_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e12_visitor_tailgater_defend_percent=100`. The kiosk then opens straight on the step-away panel. (The bare `kit_defend_done=true` from the shot list is not enough; the kiosk reads the episode state.)

**Spoiler cuts to add.** The call screen puts the technique and tell sentences under the meter ("+5 CALM! ..." and "ASK OK needs ..."). Crop the call frame above them (Delphine, the toast, the choices and the first lines of the meter only), or hide them. The strip of the flip screen is safe, its body is not.

**Look notes for the theme.** Only the kiosk panels use the brand tab and cream (brown for Merrin & Sallow). The OSINT browser, the pretext card, the call and the triage are navy SAFETYNET-style windows. The theme's "ca-surface" cards will not match them inside a seat; frame them as footage.
