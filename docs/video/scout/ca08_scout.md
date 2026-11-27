# ca08 After the click: trailer scout

Written 23 Nov 2026 for the attack-first trailer (recipe `docs/video/recipes/course-trailer.md`), modelled on ca01. **Desk scout only**: no server was started, nothing was recorded, no TTS was run. Everything below comes from `scenarios/ca08_after_the_click/` (mission.json, scenario.json.erb, `ink/anjali_rao.ink`), the shared kit ink in `scenarios/_office_kit/ink/`, the `tts_cache/ca08_after_the_click/` sidecars (text, npc, mp3 length by ffprobe), the ca01 and ca12 take scripts, and the episode runner source. Cached-ness here means "sidecar and mp3 exist with matching text"; the live `/tts` check that ca01 ran is still to do (Part D).

## Headline

- **One room, one kiosk, Quayholt Insurance (tier O).** `training_room` holds Anjali Rao (host, `anjali_rao`), Darren Price (`kit_darren_price`, security awareness lead) and Niamh Doherty (`kit_niamh_doherty`, comms officer). No locks, no calls, no VM, no walking between rooms.
- **Attack half is email plus research, as in ca01.** Open-source research (company site "Our people", "Signing in", "Company news", plus Friendface), then the look-alike email builder (From name and address slots, which sign-on system, pretext and ask drop-downs, Red flags meter), one Send (`maxMessages 1`), then the flip. The pretext is "the IT service desk asks you to sign in again while single sign-on moves".
- **The defend half is not an inbox of lures.** It is "Ayaan's inbox after the click": six items, **every one a sign of a taken-over account or an everyday item** (a Sent-folder email he did not write, a genuine-address password-changed notice he did not ask for, a sign-in prompt from abroad, a colleague's honest slip, a "your files are locked" note, a planned-maintenance notice). The learner is Ayaan and sorts them Trust, Report, Delete, Verify. The list is spoiler-safe before any verdict; the card bodies are the tells.
- **Living-office moment is a real set piece** (`ca08_machine_out`): after the defend set, the kiosk's step-away panel ("Look up from the kiosk...") fires, Darren's workstation goes to the locked sprite (`pc1_locked`), he walks to Anjali and barks a cached line, then Anjali answers with a cached bark.
- **The outline's end line is a host line in the not-caught branch** (Anjali, second line after "Left to run..."). Verified in the ink: reachable unseeded after defend with `kit_key_caught` false. It is 9.74 s, the longest end line of the three trailers so far.
- **No uncached line is needed.** Every beat in the script has a sidecar and an mp3.

## Part A: voiced lines (sidecar-checked, lengths from ffprobe; in game add 0.2 to 0.4 s)

### Hook candidates (kit talk, after defend, `kit_ep` is "ca08" by default, `kit_key_caught` unset)

| ID | NPC | Text | Len | Path | Use |
|---|---|---|---|---|---|
| H1 | kit_niamh_doherty | Half the floor was locked out of a system earlier. Proper pain when it happens. | 5.21 s | `--set kit_defend_done=true --set kit_attack_done=true`, talk to Niamh | **hook (recommended)**: mild, not a verdict, sets up the consequence. Same trick as ca01's Gwen G2 |
| H2 | kit_niamh_doherty | Could murder a cuppa. | 1.85 s | ambient chatter, before the kiosk Start | spare, too thin alone |
| H3 | scenario chatter (Niamh, Anjali, Darren) | Phones haven't stopped today. | 2.0 s | ambient, before Start | spare |
| H4 | scenario chatter | Claims backlog's easing off. | 2.4 s | ambient, before Start | spare; echoes Ayaan's "backlog" post |
| H5 | kit_niamh_doherty | Newsletter's nearly done. | 1.73 s | ambient | spare |

### Anjali Rao (`anjali_rao`, hub in `ink/anjali_rao.ink`)

| ID | Text | Len | When | Use |
|---|---|---|---|---|
| A1 | Welcome to the Quayholt exercise. Everyone clicks something eventually, so today is about the ten minutes after, and how one quick report changes the ending. | 10.22 s | first talk, fresh game | spare, too long. Sets the humane tone |
| A2 | Start at the kiosk. Write the email first, then switch sides and play the colleague who clicked, sorting what turns up. | 7.90 s | second line of first talk | spare |
| A3 | Good. The email's gone, and your colleague signed in, the way most people eventually do. Now take their seat and see what someone else is doing with their account. | 10.22 s | after the send (`phish_takeover_victim_attempts > 0`), defend not done | **flip line** (long; see script) |
| A4 | Left to run, an account like that costs a colleague his week, and the drive has to be rebuilt from backup before the team can work. | 8.14 s | after defend, not-caught branch, **first** line | **off** (consequence of the verdict; it must be played through and cut) |
| A5 | To whoever's inside, a trusted account is one its own colleagues won't question, and the quiet between the click and the report is when they spend it. | 9.74 s | after defend, not-caught branch, **second** line | **end line** (outline's pick): the attacker's view, not a grade |
| A6 | You reported it while it was still just a bad feeling, and that is exactly the call that keeps a quiet morning quiet. | 7.49 s | caught branch, first line (`kit_caught` false) | **off** (grade) |
| A7 | The faster someone says this looks wrong, the less there is for anyone to clean up, and you did say it. | 6.77 s | caught branch, `kit_caught` true | **off** (grade) |
| A8 | To whoever was inside that account, every unreported minute is another message colleagues trust and another password reset, and you took those minutes away. | 9.94 s | caught branch, second line | **off** ("you took those minutes away" is a grade); use A5 instead |
| A9 | That's both sides done. Whatever the sign, report it and let the team act. Nobody's ever in trouble for reporting. | 7.78 s | repeat talk | spare end line (tone, no verdict) |
| A10 | Thank you. We can shut that account down before it gets past your machine. | 4.30 s | the **bark** after Darren reports (below) | spare for the living-office beat |
| A11 | Any time. | 1.18 s | "Thanks, Anjali." | no |

### Darren Price (`kit_darren_price`)

| ID | Text | Len | Path | Use |
|---|---|---|---|---|
| D1 | My screen's locked me out and a shared folder won't open. If someone's in my account, they'll be sending as me. Reporting it now. | 8.93 s | **bark** on arrival at Anjali (`ca08_machine_out`, needs `kit_ca08_out` and `kit_quiet`) | **living-office line**. Mild tell-adjacent (locked out, shared folder, sending as me), but it is the room's story, not a checklist |
| D2 | One of the machines went down earlier. Always a scramble when a shared system drops. | 6.02 s | talk after defend, not caught | spare |
| D3 | Good call flagging that one fast. A quick shout saves us a lot of grief later. | 5.62 s | talk after defend, caught | **off** (grade) |
| D4 | A sign-in from abroad right after a click is them already inside. The sooner it's reported, the less they reach. | 8.09 s | `ca08_react`, not caught (defend twin only) | **off** (names the push prompt) |
| D5 | Someone flagged that one quick. Once they're in an account they send as you, so a fast shout boxes them in. | 8.09 s | `ca08_react`, caught | **off** (grade) |
| D6 | Busy on the awareness side. / Just grabbing some water. | 1.7 to 2.0 s each | ambient | spare |

### Niamh Doherty (`kit_niamh_doherty`)

H1 above (not caught). Off: "Lovely work flagging that quick. The sooner it's reported, the sooner we're back up." (caught; a grade).

### Not in this episode (do not pick)

The other cached lines in the folder (the ca03, ca05, ca10, ca16, ca19 kit lines: "Password's in, and now my phone wants me to approve it...", "It won't take my password at all...", the verify-box lines) belong to other episodes' knots. They sidecar-match a ca08 game's NPC ids because the kit ink is shared, but they never play here unless `kit_ep` is seeded to another episode. Do not use them.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Cheapest entry state | Tell or answer on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Ambient room | `training_room`: Anjali (5.5, 3.8), Darren (2.5, 7.0), Niamh (4.0, 7.0), kiosk, water cooler | fresh game, Skip tutorial, close Brief | no | not run. Player starts at (6, 6.2), next to Niamh, so the hook walk is short |
| S2 | Kiosk Brief and strip | `training_kiosk`, `minigameData.episodeId e8_after_the_click` | `__test.interact('training_kiosk')` (first try can be swallowed, retry up to 3) | no | not run (same runner as ca01) |
| S3 | OSINT browser | button "Open the browser". Site Quayholt Insurance: pages "Our people" (`blk_staff`, Ayaan Warsame, claims handler), "Signing in" (`blk_itdesk`, the service desk address), "Company news" (`blk_news`, single sign-on move); site Friendface (`post_ayaan`, "Flat out clearing the claims backlog this week, roll on Friday.") | after Start. Block ids are selectors: `.ob-block[data-id="blk_staff"]` etc., click the block to note it | public facts only. The "Signing in" block shows the service desk address in full: fine, it is a fictional `.example` address and the fact is the appeal | ids from the scenario, not run |
| S4 | Look-alike email builder | button "Open the mail client", Compose. Slots: `sender_name` and `sender_address` (From part, `e8_from`), `portal` (pretext). Pretext drop-down options: `e8_pretext_reauth` (urgent), `e8_pretext_reauth_calm`, `e8_pretext_newsletter`; ask `e8_ask` / `e8_ask_calm`. To is Ayaan once `blk_staff` is noted (else "Nobody to write to yet") | S3 done with Ayaan, the service desk and the single sign-on news noted | the finished body is a worked lure (sign in again, single sign-on move): crop, never hold the whole body readable. Red flags box lower line carries a tell sentence ("The From line carries the service desk's real address ... but it was forged") | not run. Option values assumed to be the template ids as in ca01 (`pretext_bank_change`); the take script reads the option list and throws if missing |
| S5 | The send and "It landed" | `button.mail-compose-send`, first Send is final | S4 filled | green checks: "He would open it", "From the IT service desk he acts on", "Matches the single sign-on move he was told about", an advisory about pressure | strings from `factorStrings`; panel not seen |
| S6 | The flip | closing the mail client opens the kiosk on "Now it lands on you" | after S5 | **yes, off**: it replays the sent email, the "lines picked out" and `flipDefenderLine` ("The service desk never sends sign-in requests by email, ... that is the one thing that would have given it away"), then the aftermath block ("Now you are Ayaan, and it is just gone three", the Sent-folder item with "Ayaan did not write this", the push prompt). Heading and strip only; cut before the body | strings read, not run |
| S7 | "Ayaan's inbox after the click" triage | button "Open the inbox", then Start. Six rows: "Your settlement payment" (Sent), "Your password was changed" (Quayholt IT), a push card "Are you trying to sign in?", Reuben Ofori's "I think I've sent something to the wrong client", "Your files are locked", "Planned maintenance on the claims system" | `--set episode_e8_after_the_click_state={"done":["brief","osint","write","flip"]} --set phish_takeover_victim_attempts=1` (the ca01 pattern; kiosk opens on "Defend") | list: no. Open card: the Sent item and the files-locked note are the strongest tells, the password-changed card is the mildest. Choose the password-changed card (From the real IT address, body asks nothing) or hold on the list only | not run |
| S8 | Step-away panel and the machine going out | after the defend set the kiosk shows "Look up from the kiosk to see how a case like this plays out here..." (`strings.stepAway`), button "Look up" | `--set episode_e8_after_the_click_state={"done":["brief","osint","write","flip","defend"]} --set episode_e8_after_the_click_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e8_after_the_click_defend_percent=100` (ca12's t09 list); add `--set kit_quiet=true` if the dry run shows Darren never moves (the mapping that sets it fires on a state change, which `--set` may not raise) | no. Visual: Darren's workstation swaps to `pc1_locked`, he walks to (4.5, 4.0) beside Anjali | not run |
| S9 | Darren's bark, then Anjali's | world bubbles (D1 then A10) | S8 | D1 is mild (see table). A10 follows 4.5 s after Darren arrives, while D1 (8.93 s) is still playing: **overlap hazard** | not run |
| S10 | Anjali end line | talk to `anjali_rao` | `--set kit_defend_done=true --set kit_attack_done=true` (not `kit_key_caught`; `kit_ca08_host_said` stays false) | A4 plays first (off), then A5 | ink read, not run |
| S11 | Debrief | kiosk step 6 | after defend | **yes** (costs, verdicts, the "Monday" card) | not used |

Minigame types: episode runner (kiosk), OSINT browser, mail composer with slots and the Red flags meter, result panel, triage (six items, four verdicts), step-away, debrief.

## Tool cards

"Open-source research" over S3 and "Look-alike email builder" over S4 (ca01's names; the outline's "Look-alike page builder" is for ca05). Each at least 3 s from start to finish.

## Spoiler judgements

- **Show:** S3 (public facts, two noted), S4 filling (closed pretext drop-down, slots, Red flags number only), S5 green panel, the strip tick, the triage list before any pick, the room beat.
- **Off:** S6 body and aftermath, the Red flags tell sentence, any card after a verdict, the "The signs most often missed" copy, the debrief, A4 (played through, cut), A6 to A8, D3 to D5, Niamh's caught line.
- The attack landing is a result panel, not a person giving way (as ca01). Pair with the flip line and the end line so the human reaction comes from Anjali.

### CSS hides the takes will need

As ca01: hide `.mail-` Red flags body lines (keep `.mail-redflag-count`), keep the pretext drop-down closed (`selectOption` on `select.mail-compose-template[data-part="pretext"]`), flip screen below the heading hidden, HUD CSS from `tools/video/capture/launch.mjs`, no Mission Brief popup, Skip tutorial.

## Avatar

Scenario player is `female_office_worker_v2` (the ca01 takes pass `BE_SPRITE=female_office_worker_v2`); same hazard as ca01 and ca12 (the demo avatar reads as SAFETYNET). The hook (Niamh talk view) and Anjali's lines are person-chat portraits, so the player is not in frame. The room beat (S8, S9) is the only wide shot with the player in it; use BE_SPRITE and agree the avatar window with VID1 and AC0, or crop.

## Hazards

- A used game reopens on its saved step: fresh game per take, no mid-run reload.
- Ambient chatter stops once the kiosk Start fires (`kit_quiet`); the H1 hook is a talk line so it is unaffected, but any ambient hook must be filmed before Start.
- **Bark overlap (S9):** A10 fires 4.5 s after Darren arrives (`delayMs 4500`), inside D1's 8.93 s. If the engine plays both, the editor cuts the take at the end of D1 or uses A10 alone. The dry run decides.
- The hook, flip-line and end-line takes need fresh games each; they differ only in `--set`.
- Closing the mail client after Send opens the flip body at once (spoiler flash): cut before it, as ca01.
- The step-away panel can be skipped by Carry on; the take presses Look up.
- Throttle with `window.__test.throttleFps(20)`; never `fixedStep=false`.

## Not verified (everything, because nothing ran)

Item order in the triage list; the exact Red flags counter values in ca08; the "It landed" panel wording for this episode; whether D1 plays as a voiced bubble or only a world-bubble caption (ca12's C1 was a world bubble); `kit_quiet` under `--set`; pretext option values; Darren's arrival time; live `/tts` 200s for H1, A3, A5, D1.

## Part D: live check still to do (needs a keyless server, not run here)

`tools/video/scout/tts-test.mjs --server <url> --game <id>` for H1, A3, A5, D1 and A10. Restart recipe and game recipe as in `ca01_scout.md`: `PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca08_after_the_click [--set name=json ...]`.
