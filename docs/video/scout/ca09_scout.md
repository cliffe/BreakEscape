# ca09 Passwords: trailer scout

Scouted 23 Nov 2026 from the scenario, ink, engine source and the TTS cache only. **No server was run and nothing was recorded**, so every "verified" below means read from code or the cache, not seen in a browser. The take stage must dry-run each entry state. Model: `docs/video/scout/ca01_scout.md`.

## Headline

- **One room, one kiosk.** `training_room` at Tarrowby Logistics (fictional haulier): Nilesh Solanki (host, `nilesh_solanki`), Fatima Begum and Chidi Okeke (kit staff), kiosk (`training_kiosk`, episode `e9_passwords`), drinks machine, Chidi's PC (`kit_ca09_pc`), clipboard. No walks, locks or VM. Player starts at (6, 6.2), Nilesh at (5.5, 3.8): a short walk.
- **Strip:** Brief, Look around (OSINT), Guess list, Your phone (flip), Defend, Debrief. Company accent `#3b5b8c`.
- **The attack is the password guesser** (`password-guesser` minigame, "Guess list"): rows "Built from what you found" (three made-up guesses from Colin Mather's public posts and the company's founding year), then "The same password somewhere else" (RiverReach Angling forum password opens the work account). Controls "Try the next guess (n to go)", "Run them all", "Switch the rig off". It is the USP shot.
- **The outline's hook exists** and is cached: Nilesh's welcome clip `e5e91f072a695441205efab69bc6e8a6` (7.90 s): "Welcome to the Tarrowby exercise. Most passwords aren't cracked. They're guessed, reused or handed over." One ink line, one clip, one subtitle. Silence detection (ffmpeg, -25 to -40 dB) puts the sentence breaks at: "...exercise." ends 2.07 s, pause to 2.61 s (so "Most" starts about 2.6 s), "...cracked." ends about 4.04 s, then a stepped delivery to "over." ending 7.56 s (clip ends 7.84 s). Trim: **in 2.55 s, out 7.65 s = 5.10 s.** No ASR tool is installed here (no whisper), so the word edges inside the second and third sentences are inferred from pauses; confirm by ear on the take.
- **Outline end line is a bark, cached:** Chidi (`kit_chidi_okeke`) "Right, sorted. New one's on a sticky note on my screen so I don't forget it. Owt I should flag?" 6.46 s, fires about 10 s after the step-away "Look up" (see S9).
- **Cache check without a server:** I recomputed the TTS cache key (normalised text, voice, style, language, model `gemini-3.8-flash-tts`) from the current scenario voice blocks for each used line; all match an existing sidecar. Sidecar wording uses a colon in two places where the ink has a full stop (the key ignores punctuation, so that is harmless). Not tested over live `/tts`.
- **Avatar:** scenario player is `female_office_worker_v2`; the take stage should pass `BE_SPRITE=female_office_worker_v2` as ca01 t05 did (the demo hooded hacker reads as SAFETYNET). Shots inside windows and the portrait view avoid the player; S9 shows the room, so it needs the avatar.

## Part A: voiced lines (cached; clip lengths by ffprobe; add 0.2 to 0.4 s in game)

### Nilesh (`nilesh_solanki`, `ink/nilesh_solanki.ink`; hub resting point)

| ID | Text | Len | When | Use |
|---|---|---|---|---|
| N1 | Welcome to the Tarrowby exercise. Most passwords aren't cracked. They're guessed, reused or handed over. | 7.90 s | first talk, fresh game | **hook**, trimmed 2.55 to 7.65 s |
| N1b | Start at the kiosk. I'll show you how, on a made-up colleague, then you shut it down on your own account. | 6.10 s | second line of the first talk | spare, off (too long) |
| N1c | Nothing you touch here is a real password. | 3.14 s | third line | spare card line |
| N2 | Good. One reused password opened his account, no clever cracking at all. | 5.86 s | talk after `guess_e9_landed`, defend not done, first line | on screen only if the take wants it; cut from the trailer |
| N3 | Now it's your turn in the seat: your phone's buzzing, and someone has a password of yours. | 5.33 s | same talk, second line | **flip line** |
| N4 | Both sides done. Use a different password for every account and keep them in a manager, with three random words for the few you have to remember. | 9.50 s | talk after `episode_e9_passwords_defend_complete`, first line (needs `kit_ca09_host_said` true, else a grade line first) | habit line, too long; spare |
| N5 | Deny anything you didn't start. Nobody's ever in trouble for reporting. | 4.58 s | same, second line | spare end line (no-blame tone) |
| N6 | Any time. | 1.10 s | "Thanks, Nilesh." | no |
| N7 | Right, Chidi. A password manager remembers it for you, so nothing goes on the screen. | 5.90 s | bark after Chidi is sent to the host (the "mention" branch only) | off (a branch outcome) |

**Off (grades or verdicts):** "You spotted the reused one and shut it down, so there was nothing on that account for anyone to walk into." (6.38 s), "You moved on the weak password, which is the one habit that quietly blunts most of this." (4.90 s), "Reuse a password and a work account opens for free..." and "To whoever's buying leaked passwords..." (the post-defend host recap in all its branches), plus every Fatima/Chidi `ca09` "Good work/Nice" branch and `ca09_react` line (it names the number-read-back tell).

### Chidi (`kit_chidi_okeke`, kit ink)

| ID | Text | Len | Where | Use |
|---|---|---|---|---|
| C1 | Right, sorted. New one's on a sticky note on my screen so I don't forget it. Owt I should flag? | 6.46 s | step-away bark (`kit_ca09_note_up`, ask cue) | **end line** |
| C2 | That's me booted out. Wants a brand new password, of course. | 4.54 s | bark about 1.5 s after Look up, needs `kit_quiet` true | lead-in; use if C1 alone feels abrupt |
| C3 | We still share a login or two on the fleet desk. Nobody could say who did what, mind. | 5.38 s | talk after defend, not caught | spare |
| C4 | Fair point, that. I'll have it down and ask Nilesh about a password manager. | 5.45 s | answer to "I'd take that note down" | **off** (the answer) |
| C5 | Depot's heaving today. / Who's on the Shipley run? / Another pallet backlog. / Fleet's all out today. | 1.9 to 2.4 s | ambient chatter before the kiosk Start (`kit_quiet` false) | spare hook ambience |

### Fatima (`kit_fatima_begum`): "Half the office still uses the same password everywhere. Scary when you think about it." (6.29 s, talk after defend, not caught). Spare. Her ambient chatter: "CVs stacking up again." (2.33 s), "Need some water." (1.58 s).

All other cached sidecars in `tts_cache/ca09_passwords` and `_defend` belong to other episodes' kit knots (ca02, ca06, ca15, ca20) and are not used.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Nilesh's welcome (hook) | person-chat with `nilesh_solanki` | fresh game (`PLAYTEST_PORT=... tools/playtest/new-game.sh ca09_passwords`), Skip tutorial, close Brief, key-walk up to Nilesh, interact | no | from ink (hub: all three globals false gives the welcome). Wait the full 7.9 s |
| S2 | Kiosk Brief and strip | `training_kiosk` | `interact('training_kiosk')`; the brief is `strings.brief` | no | from source |
| S3 | OSINT browser | button "Open the browser"; sites Tarrowby Logistics (Our people, About us) and Friendface (Colin's feed) | after Start | public facts only. A block is noted by clicking ("Click to note"); facts needed for the guesser: team post, pet post, about page (1994), forum post | from scenario `osint` block; ca01 notes the click-to-note interaction and the "Noted: ..." line |
| S4 | Password guesser | button "Open the guesser" after the browser closes | S3 done with those four facts noted (otherwise rows read "A guess you could not build") | panels: common list (**real-world passwords: 123456, password, qwerty, tarrowby; hide**), patterns (three made-up guesses), reuse, passphrase (**the answer: three unrelated words holds; end the shot before it**). The live log line prints each tried guess, including the common ones: hide it | from `password-guesser-minigame.js` and `-model.js`; classes `.epr-gs-panel[data-panel]`, `.epr-gs-row`, `.epr-gs-live`, buttons `.epr-gs-step/.epr-gs-all/.epr-gs-off` |
| S5 | The flip | closing the guesser after "Switch the rig off" writes `guess_e9_landed` and opens "Now it's your phone." | S4 finished | **yes** below the heading: flip intro, push flood and an "IT" text asking to read back a number (the tell). Frame on heading and strip | from `strings` and `flipAftermath`; not seen |
| S6 | Nilesh after the landing | talk to `nilesh_solanki` | **`--set guess_e9_landed=true`** on a fresh game (hub reads it directly) | no | from ink |
| S7 | Defend list | kiosk Defend stage | `--set 'episode_e9_passwords_state={"done":["brief","osint","guess","flip"]}' --set guess_e9_landed=true` (the ca01 pattern; kiosk should open on Defend) | the list: no. Cards: push at 02:40 "Unknown location, outside the UK, Windows PC" and the "IT" email show their tells on the card; the choice cards show their options (answer visible to a reader). Show the list and at most one card, nothing pressed | from `triageSets`; the defend panel button label depends on the set kind (likely "Open the inbox"; confirm). Eight items: own push, 02:40 push, "IT" email, five password and sign-in choices |
| S8 | Triage verdict screens, debrief | after a verdict, kiosk step 6 | n/a | **yes** (reasons, percentages, grades) | not used |
| S9 | Step-away and Chidi's note | panel "Look up", then the room | **`--set 'episode_e9_passwords_state={"done":["brief","osint","guess","flip","defend"]}' --set episode_e9_passwords_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e9_passwords_defend_percent=100`** (the ca12 list; add `--set kit_quiet=true` if C2 does not bark). Open the kiosk, press "Look up" | the sticky-note PC sprite `pc1_locked_note` appears at `kit_ca09_note_up`; its text ("Tarrowby2468") appears only on examine, so never examine | timers: C2 about 1.5 s, note up at about 6 s or on Chidi's failed login, C1 about 3.5 s later (about 10 s after Look up). `kit_ca09_note_choice` timers run to 45 s, so end the take as C1 ends and before the ask-cue menu |

Minigame types: episode runner (kiosk), OSINT browser, password guesser, flip view, triage (eight items: push prompts, an email, choices), step-away panel, debrief. No locks, keypads, calls or VM.

## Tool cards

"Open-source research" over S3, "Password guesser" over S4 (outline wording). The MFA push stream in the outline is the flip and the defend prompts, not an attack tool here: no attacker push-firing stage in ca09.

## Spoiler judgements

- **Show:** S3 (public posts, one noted), S4 up to the reuse row opening (the pattern guesses are made up: team plus year, pet plus a symbol, company plus year), the flip heading and strip, the defend list, one card at most.
- **Off:** S4 common-list panel and live log (real passwords); S4 passphrase panel (the answer); S5 body (the "IT" text with the number tell); S7 option labels read as a worked answer; S8 and the debrief; every grade, "Good" and "You spotted" line; N4 and N5 unless the owner picks them; C4; the note's examine text.

## Hazards

- Fresh game for every take; a used game reopens on its saved step.
- The first kiosk `interact` is sometimes swallowed (retry up to 3 times).
- `kit_quiet` flips true on the first state change, so ambient chatter is only available before the kiosk Start.
- Chidi's bark needs the player in earshot (`whenPerceivable`); the room is one screen, so keep the player in it. The ca12 take records bark bubbles with `watchBubbles`; confirm the clip is audible in the capture with `watchVoice`.
- A real use of the `kit_ca09_pc` by the player is gated (`requiresItem`); do not interact with it.
- `Tarrowby2468` and the other guess strings must stay as authored (made up); never type a real-looking password on camera.
- Throttle with `window.__test.throttleFps(20)`; never `fixedStep=false`.

## Not verified

Everything on screen (nothing was run). In particular: the kiosk opening on Defend and on the step-away panel from the `--set` lists; the defend button label; the real word edges of the hook; C2/C1 timing and audibility; the CSS selectors for the hides.

## Restart (for the take stage)

`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=<main>/vendor/bundle bundle exec rails server -b 127.0.0.1 -p <port> -P <pidfile>`; games from `PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca09_passwords [--set name=json ...]`.
