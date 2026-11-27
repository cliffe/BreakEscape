# ca14 Social media and oversharing: trailer scout

Desk scout, 23 Nov 2026, for the episode trailer (recipe `docs/video/recipes/course-trailer.md`), attack-first, modelled on ca01. Nothing was recorded, no server was run, no TTS was generated, no game was touched. Everything below comes from `scenarios/ca14_social_media/` (scenario, mission.json, `ink/julian_sallow.ink`), the shared kit ink in `scenarios/_office_kit/ink/`, the 50 sidecars in `tts_cache/ca14_social_media/` (clip lengths by ffprobe, speech spans by ffmpeg silencedetect) and the engine files named in the notes. Entry states are "expected, not played" unless a line says a model episode verified the same mechanism. The room knowledge is ca12's (Merrin & Sallow), see `docs/video/scout/ca12_scout.md`.

## Headline

- **One room, one kiosk.** Everything happens in `training_room` at Merrin & Sallow (brown tab, same studio as ca12). Cast in the room: Julian Sallow (host, `julian_sallow`, partner, not Lorna as in ca12), Lorna Easton (`kit_lorna_easton`), Delphine Arvanitis (`kit_delphine_arvanitis`). Objects: kiosk, sofa, Lorna's PC (`kit_ca14_pc`), journal stack, project board (`kit_ca14_board`). No lobby, no walk, no lock, no VM.
- **Strip:** Brief, Research, Write, Your message, Defend, Debrief.
- **The attack:** the Friendface profile of Dani Fenwick (handle @dani.builds) with four public posts (new finance system advert, lanyard and whiteboard photo, "away all next week" countdown, the beagle "name a pet" post) plus a profile block (employer, team, manager Thandiwe Moyo). The learner pins facts, then builds one message to Yasmin Chaudhry (finance controller, covering while Dani is away) from templates: pretext (access request, three options), ask (two options), slots filled from pinned facts (`when`, `system`). A Red flags meter shows. One send only (`maxMessages 1`).
- **The defend half runs three scenes in order:** the Post / Tweak / Hold sort drill (7 draft-post cards, bins Post, Tweak, Hold, reason shown after each pick), the privacy panel (5 switches, each closes a found fact), then the DM inbox (6 messages, Trust / Report / Delete). Only the inbox is scored.
- **Living-office moment:** after the defend set, "Look up" from the kiosk starts a room beat. Lorna barks "Got a lovely one of the team for the studio page." and then asks "It's all of us at our desks. Fine to post?" Delphine follows up only after a photo choice (those lines are consequence lines and stay off).
- **Music:** the scenario sets the PeaceFolk playlist (D331), but the trailer's music question is the owner's, as for ca01.

## Part A: voiced lines (cached sidecars; not live-tested here)

Not tested with `tools/video/scout/tts-test.mjs` (no server). Each line below has a sidecar and an mp3 in `tts_cache/ca14_social_media/`. Texts match the ink or scenario JSON as read. The take stage should run the live `/tts` check before anything is cut. Speech spans are from silencedetect at -35 dB.

### Lorna (`kit_lorna_easton`, `scenarios/_office_kit/ink/lorna_easton_ambient.ink`, scenario eventMappings)

| ID | Text | Source and path | Len | Speech | Use |
|---|---|---|---|---|---|
| L1 | Got a lovely one of the team for the studio page. | bark, 1.5 s after `kit_ca14_out` goes true, needs `kit_quiet` true | 3.46 s | 0.33 to 3.05 s | **hook** |
| L2 | It's all of us at our desks. Fine to post? | bark at about 9.5 s after Look up (`kit_ca14_there` + 5.5 s), then the first line of knot `ca14_photo` when clicked | 3.29 s | 0.22 to 3.07 s | **end line** (outline's pick); portrait view by clicking her, cut before the choice menu |
| L3 | Well spotted. I'll crop it to just us. / Brilliant. It's up. | the two choice replies | 2.93 / 1.85 s | | off: replies to the choice menu, they are outcomes |
| L4 | Hiya. Grab five on the sofa if you need it. | fresh game, talk | 3.41 s | | spare |
| L5 | Good shout. A new account with a familiar name is worth a second look. / Turns out there's a fake account in a partner's name. Everyone's comparing notes. | after defend, caught or not | 5.09 / 5.30 s | | off (caught branch is a grade; the other reveals the outcome) |

### Julian (`julian_sallow`, `ink/julian_sallow.ink`)

| ID | Text | Path | Len | Speech | Use |
|---|---|---|---|---|---|
| J1 | That's how little it takes to build a convincing message out of a colleague's posts. | hub after the send (`phish_df_cover_attempts > 0`), defend not complete; first line | 5.14 s | 0.24 to 4.85 s | **flip line** (beat 9). It is a statement about the pattern, not a grade |
| J2 | Now you spot the same moves in a feed and an inbox, and we close the gaps, on Dani's profile and on yours. | same hub, second line | 9.86 s | | too long; close the chat after J1 |
| J3 | Welcome to the Merrin & Sallow exercise. Everyone here is fictional, and nothing you do leaves this room. | fresh game | 8.33 s | | spare, too long |
| J4 | Start at the kiosk: see what one colleague's public posts give away, then close the gaps, on his profile and on yours. | fresh game, second line | 9.29 s | | spare (course-trailer use) |
| J5 | That's the lot. A well-made message is built from scraps anyone could find. | after defend complete | 6.10 s | | spare |
| J6 | The fix is a setting and a pause. Nobody's in trouble for what they've posted. | after J5 | 6.82 s | | spare, the no-blame tone line (O4) |
| J7 | You checked the new contact... / You stopped the one worth stopping... / It knew real details and wore a trusted name... / A new contact gets checked by a route you already know... | after-defend branches | 7.8 to 9.7 s | | off: grades and outcomes (the last one is a habit line, 7.78 s, only after the grades) |

### Delphine and ambient (all cached)

| ID | NPC | Text | Len | Use |
|---|---|---|---|---|
| D1 | delphine | Odd. Catherine's got a new account. It's just liked Lorna's photo and asked to connect with me. | 7.49 s | off: the consequence of the photo choice, a verdict on it |
| D2 | delphine | Someone's set up a profile pretending to be a partner. Cheeky. / Good eye. Those public posts are exactly what they build on. | 5.62 / 4.06 s | off (after-defend outcome lines; the second is a grade) |
| A1 | kit_merrin chatter | Deadline on the Harbour job. / Printer's warm again. / Client's in this morning. | about 2 s each | ambient texture only, before Start (`kit_quiet` false) |

Not cached: nothing the script needs. No cast line is invented.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer on screen? | Visual |
|---|---|---|---|---|---|
| S1 | Studio room wide | `training_room`, Lorna, Delphine, Julian, kiosk, sofa | fresh game, Skip tutorial, close Brief, `--hide-hud` | no | warm studio, three staff |
| S2 | Kiosk Brief and strip | `training_kiosk` | `interact('training_kiosk')`, retry up to 3 | no | brown MERRIN & SALLOW tab, six steps |
| S3 | OSINT browser, Friendface | button `Open the browser`; site `friendface`, profile Dani | after Start | no tells; the posts are the pattern-level material (USP). `pinHints` shows a pin affordance on each block | Dani's profile card (employer, team, manager) and four posts, one or two pinned |
| S4 | Mail template filling | `Open the mail client`, `Compose`; To Yasmin; templates `df_pretext_*`, `df_ask_*`, slots `when` and `system` | S3 done with the leave post and the system post pinned | the finished body is a worked lure: frame on the pickers and the Red flags counter, body only partly legible | pretext chosen, slots filling, Red flags counter dropping |
| S5 | The send and landed panel | `Send` (first Send is final) | S4 filled | green checks "She would open it", "It reads as Dani", "Fits a week she knows Dani is away"; pattern level. Yasmin's reply ("No problem, Dani. I'll get your access set up...") arrives about 6 s after Send (`emailReplyDelay 6`) | green panel |
| S6 | The flip | closing the mail client opens the kiosk on "Now you're Yasmin" | after S5 | **yes below the heading** (the sent message with lines picked out, a defender line). Heading and strip only | strip ticks to Defend on Continue |
| S7 | Julian's flip line | talk to `julian_sallow` after the send | `--set phish_df_cover_attempts=1` is enough for the hub line | no | Julian's portrait, bar with J1 |
| S8 | Post / Tweak / Hold drill | defend launch, button `Open the cards` (default copy; `sortDrill.strings` may override) | kiosk on Defend: `--set episode_e14_social_media_state={"done":["brief","osint","write","flip"]} --set phish_df_cover_attempts=1` (the ca01 pattern, verified there) | the **reason** after each pick is the answer: off. Card text itself is fine | card 1 (lanyard selfie) with three bins, no pick |
| S9 | Privacy panel | launch button `Open the settings` | after the drill; seed a drill record or play the seven cards off camera | the "Why it matters" lines (`leaveOff`) and the fact names are tells: frame on the five switches only | five switches, default open, one flicked to tight |
| S10 | DM inbox | after the panel; `Start`; six rows | after the panel | **yes**: the bracketed account notes in the message bodies ("[New account, created last week, no other posts.]") are tells, and the verdict panels. Show the list, hide previews or crop, and no verdict | "x of 6 sorted" and six rows |
| S11 | Room beat | Look up from the kiosk | `--set episode_e14_social_media_state={"done":["brief","osint","write","flip","defend"]} --set episode_e14_social_media_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true --set episode_e14_social_media_defend_percent=100`, kiosk opens on the step-away panel, press `Look up` | L1 and L2 are not answers. The choice menu and everything after it are outcomes: cut before it | Lorna at her PC, bubble; later her portrait |
| S12 | Debrief | kiosk step 6 | end | **yes** (verdicts, percentages, tells, the debrief cost story) | not used |

Minigame types in this episode: episode runner (kiosk), OSINT browser (Friendface), mail composer with template slots and Red flags meter, result panel, sort drill, privacy panel, DM triage, step-away panel, debrief. No locks, keypads, calls or VM.

New mechanics to name on cards: **Open-source research** (S3) and **Look-alike message builder** (S4). Each gets at least 3 s from start to finish; S3 to S5 runs as one continuous take.

## Entry-state notes

- **Verified elsewhere, expected here:** the done-list seed for the Defend panel (ca01 verified `episode_e1_invoice_fraud_state={"done":[...]}` plus the attempts global; ca12 verified the step-away seed). The ca14 names above are taken from `social.awarenessEpisode.id` (`e14_social_media`) and the globals list. Not tried on ca14.
- **`kit_quiet` is not set by a seed.** It is set by an eventMapping when the episode state changes. L1 needs `kit_quiet` true, so the S11 seed includes `--set kit_quiet=true`. If the bark does not fire, try writing it with the bridge or play Start once.
- **Drill and panel records:** the runner skips the drill and the privacy panel when their records are held (`state.drill.done`, `state.privacy.done`). The records' exact shape is in `cleanDrill` and `cleanPrivacy` in `episode-model.js` (counts plus `done: true`). Try seeding `"drill":{"done":true}` and `"privacy":{"done":true}` inside the state for the inbox shot; if it is refused, play the seven cards and five switches off camera in `setup()`. S8 and S9 need them unseeded.
- **Fresh game per take.** A used game reopens on its saved step. The first kiosk interact is sometimes swallowed (retry up to 3). Use Skip tutorial and close the Mission Brief. The brief popup reappearing after a reload is intentional, not a finding.
- **L2 portrait:** the bark carries `targetKnot ca14_photo`, so clicking Lorna while the ask cue is up opens the chat on L2. The choice menu follows: close before it (the ca01 `closeBeforeMenu` helper pattern). `kit_ca14_seen` is not needed for the first line. Never click a choice: the outcome lines (Delphine's follow-up) fire 8 s after a choice. The 45 s `kit_ca14_t_tail` timer sets "silent" if nobody answers, so the take must end well inside that.
- **Closing the mail client after Send opens the flip body at once** (spoiler flash). The landed shot must end on the green panel before the close.
- **Yasmin's reply:** about 6 s after Send, so a 4 s `lands` shot cannot include it. The script shows the panel only.

## Spoiler judgements

- **Show:** S3 Dani's public profile and posts with one or two pinned (public, pattern-level, fictional); S4 the pickers filling (the finished body never fully legible: a readable "I'm off all next week... set up my access to the new finance system" note is a liftable template, rule A2); S5 the green panel; S6 heading and strip; S7 J1; S8 the lanyard card before a pick; S9 five switches, one tightened; S10 the list with previews cropped or hidden.
- **Off:** the Red flags body lines under the counter; the lure's full body; S6 below the heading; every drill reason; "Why it matters" lines and fact names in the privacy panel; the bracketed account notes in the DM bodies and any verdict, tick or result panel; Lorna's choice menu and replies; Delphine D1 and D2; all Julian after-defend branch lines; the debrief and its story panel.
- Note on S8: the card text names a badge in shot. It is the situation, not the answer, but it is a pattern the viewer can read. If the owner wants no readable pattern, use the second card ("Buried in the new finance system this week...") instead. PLACEHOLDER (owner question): card 1 is used because it is first in order and needs no Next press.

## Hazards the take stage should know

- **Player in frame** at the hook (S11 room beat). The scenario names `female_office_worker_v2` but the demo avatar is the hooded hacker, which reads as SAFETYNET: run S11 with `BE_SPRITE=female_office_worker_v2` (avatar window per `course-trailer.md`).
- **L1 and L2 need the player in earshot** (`whenPerceivable`).
- **Barks:** if the take wants the L1 bubble readable in 16:9, the game's own bar may not show for a bark; the script puts a burned caption on the hook as ca15 did.
- **DM previews** carry the account-note brackets. Hide them by CSS or crop in the take (selectors found at the dry run).
- **Drill card reason and privacy "Why it matters"** appear only after an action. The takes press nothing, so they never show.
- **9:16 and 1:1.** The panels are wide (the OSINT browser is two columns, the mail composer has pickers and a Red flags box, the drill has a card and three bins, the privacy rows are label plus switch, the inbox rows are sender left and tag right). A 607 px window cuts them. Plan **narrowed-panel takes**: for S3, S4, S5, S8, S9 and S10 record a second pass with injected CSS (`max-width: 560px` on the panel root, text wraps inside) in the same take run. The hook, Julian, Lorna and the flip heading are centred and need a `cx` check only.
- No chapter-card bullets: title-only cards (batch 1 lesson).

## Not verified

- Live `/tts` status of the cited lines (the sidecars exist).
- The exact kiosk button names for the drill and panel launches (defaults from `episode-model.js` are "Open the cards" and "Open the settings"; ca14 sets no launch overrides in the scenario copy read).
- That `--set kit_quiet=true` and the done-list seed together start L1.
- Whether the OSINT pin shows a "Noted" line like ca12's.
