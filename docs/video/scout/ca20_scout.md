# ca20 Working away from the office: trailer scout (DESK SCOUT, 23 Nov 2026)

Consequence-first (outline: tier T, Tarrowby Logistics, 15 min). Desk scout only: read from `scenarios/ca20_remote_and_mobile_working/` (`mission.json`, `scenario.json.erb`, `ink/zainab_hussain.ink`), `scenarios/_office_kit/ink/{chidi_okeke,fatima_begum}_ambient.ink` and the `tts_cache/ca20_remote_and_mobile_working/` sidecars, plus the episode-runner, flip-view and inbox-triage engine files. No server, take, render or TTS was run. Everything marked "to confirm" is for the dry run. Models: ca15 (consequence-first), with the batch 3 and 4 review lessons built in.

## Which scenario

Use the **full episode** `ca20_remote_and_mobile_working` (choice run, montage, then the sort). The `_defend` variant (8 min) is the sort alone, with no choices and no montage, so it cannot carry a consequence-first trailer. No trailer for it. Its tts_cache folder holds the same Zainab and kit clips, so nothing is lost.

## Headline

- Strip is **five steps**: Brief, Choices (stage `mistake`), Where it led (stage `flip`, a montage), Defend, Debrief. Tarrowby blue tab, as ca15.
- **Five beats**, none scored: the train screen, the café queue call (alarm code), the laptop left with a stranger, the café Wi-Fi (the montage headline, `flipBeat`), the lost tablet. The montage heading is "Later that day" (`strings.flipHeading`).
- **Defend** is one triage set, `e20_on_the_road_inbox`, six cards of mixed kinds: two Wi-Fi network lists, two web pages, two lost-device notices. Verbs Trust, Report, Delete, Verify. The key fake (the one that sets `kit_key_caught`) is `e20_wifi_page_fake`.
- No lock, keypad, call meter, OSINT browser or VM. Minigame types: episode runner (kiosk), choice run, montage, triage.
- Tier T: no step-away panel. The living-office beat is a silent ambient room shot, as the outline says. The training room holds Zainab (host, at 5.5, 3.8) and the ambient pair Fatima (2, 6) and Chidi (3, 6), with a drinks machine. Their needs (thirst) send them to the machine on their own.
- **Cast lines are all cached** (128 sidecars in the cache folder, 64 clips). No new line is needed. No narrator line is cached yet, by design.

## Set pieces and shots

| # | Shot | Entry state (how a take gets there) | Spoiler judgement |
|---|---|---|---|
| S1 | Zainab's welcome in person-chat (hook) | Fresh game, Skip tutorial, `interact('zainab_hussain')`, let lines 1 and 2 play, mark the audio start of line 3 (to confirm: lines auto-advance after their audio, as Thandiwe's did in ca04). **Fresh game only**: with `kit_defend_done` set she plays the done branch instead | Safe. The line lists topics, answers nothing. The bar prints the whole ink line (all four clauses), so crop it and burn a caption for the part used |
| S2 | Kiosk Brief | `__test.interact('training_kiosk')` | Frame on the blue tab, the heading and the five-step strip. The paragraph ("Only that last part is scored...") stays out of frame |
| S3 | Choice cards 1 to 3 (train, café call, laptop) | Start, `Make the choices`; options are elements (`pressEl`), not buttons; `Next` between beats | Safe before Next: card text and two unmarked options. Pick the **unsafe** option on every beat so the montage lines read as plain consequences (the safe-pick lines name the unsafe case). Never film beat 4's card for the trailer: its text says the stronger network's page asks for the work password, which is the key trap |
| S4 | Beat 4 (café Wi-Fi) and beat 5 (tablet) cards | Same run | Run through them for the montage; not used in the trailer. Beat 5 would echo Chidi's end line |
| S5 | Montage "Later that day" | After the last pick, `See where they led` (to confirm the button text in this runner; it is `finish` in `consequence-sandbox.js`) | **Hazards.** Each card carries "Your call" (unsafe) or "Your call: the safe route" (`.aw-montage-tag`): hide by DOM, with the safe/unsafe borders neutralised, as ca15. The headline card (`.aw-montage-headline`) is the Wi-Fi beat and is first in the DOM: its situation text spells out the work-password trap, so hide that whole card (PLACEHOLDER, see script questions). Show the train and café-call lines as the game writes them. Order after the headline: train, café call, laptop, tablet. **Round 1 review: frame on the train, café-call and laptop cards only** (a plain crop; they are contiguous below the headline), so neither the headline nor the tablet card is ever on screen; fall back to a DOM hide of the headline only if the crop cannot be made. Add a `led_laptop` punch-in (both sentences: "The stranger was lovely and touched nothing. The couple at the next table, though, could read your open inbox for the whole four minutes you were at the counter.") |
| S6 | Defend launch panel (the flip) | `Continue` from the montage. Or seed (below) | Frame on the heading and strip. `strings.defendIntro` ends "tell the safe networks and pages from the look-alikes": keep the paragraph out of frame |
| S7 | Triage list | Seed or play-through (below), then the launch button (to confirm: "Open the inbox" or "Open the pages"), `Start` | Rows show a kind label ("Wi-Fi networks", "Web page") and a subject. Row subjects include "From the Wi-Fi: 'Sign in to get online'" (the key fake) and "If you lose a work device, ring us straight away"; both are list rows before any verdict, accepted in earlier batches. Cursor off those rows, hold the list at most 5 s. Hide the badge "Traps stopped for the team: N" and the "0 of 6 sorted" tick if the frame is tight |
| S8 | An opened card | Click a `.mail-row` | **Genuine card only.** Open `e20_wifi_page_genuine` ("From the café Wi-Fi: accept and connect", https, padlock, one tick box "I accept the terms", button Connect). It shows no tell and no answer. Never open `e20_wifi_page_fake` (the key fake), `e20_wifi_eviltwin` (the note "the strongest network is already selected for you") or `e20_lost_device_fake` (the look-alike address). `e20_wifi_venue` shows the chalkboard note, which is its answer. Frame the page only; verbs and reason panel out of frame, never press one |
| S9 | Ambient room | `--set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true` on a fresh game, close the Brief | `--set` fires no events, so `kit_quiet` is set by hand. Chatter is therefore off. Staff are on needs: hold the room wide up to 40 s and take the window where one walks to the drinks machine, mark-driven (in = walk start minus 0.5 s, out = in + 3.8 s); fallback a static wide with Chidi at his desk (3, 6). Not verified: thirst config says Chidi about 20 s and Fatima about 30 s, ca15 found both seated for the first minutes |
| S10 | Chidi in person-chat (end) | Same three flags as S9, set by hand (`kit_defend_done`, `kit_attack_done`, `kit_quiet`), `interact('kit_chidi_okeke')` within about 15 s of game time (the same thirst clock can send him to the machine) | Colleague remark, no grade. With `kit_key_caught` unset the line is the "else" branch (not a verdict). Do not set `kit_key_caught` or `kit_caught`: that gives praise lines that name what was caught. Bar prints both sentences; they are both used, so keep the bar or burn the caption |
| S11 | Debrief | not used | Spoiler-only |

`--set` shortcuts (not run; ids follow the ca15 pattern):
- To land on the defend panel: `--set 'episode_e20_remote_and_mobile_working_state={"done":["brief","mistake","flip"]}' --set kit_quiet=true`. The `kit_quiet` mapping fires on a state change, and `--set` fires no events, so it is set by hand. Keep any `..._defend_percent` under 85 (85 and over sets `kit_caught`).
- Stage ids: `brief`, `mistake`, `flip`, `defend`, `debrief`.
- A game that has been through the kiosk saves its stage: one fresh game per take.

## Cached lines usable

All clips in `tts_cache/ca20_remote_and_mobile_working/`, found by sidecar text. Lengths by ffprobe, speech windows by silencedetect at -30 dB, d=0.12 (to re-check against a real take mark).

| Line | NPC | Key | Length | Speech windows | Use |
|---|---|---|---|---|---|
| "A screen someone reads, a call someone hears, a bag left for a minute, a password typed into the wrong Wi-Fi page." | zainab_hussain | e961b33f | 8.688 s | "A screen someone reads," 0.23 to 1.98; "a call someone hears," 2.21 to 3.69; "a bag left for a minute," 4.08 to 5.45; "a password typed into the wrong Wi-Fi page." 5.83 to 8.38 | **Hook**, cut after "hears" (below). The full line is the outline's end line; it is a host summary of the episode and names the beats, so it is better as an opener |
| "Half my week's out of the van. You forget what's sat on that tablet if you leave it somewhere." | kit_chidi_okeke | 2405c659 | 5.568 s | s1 0.32 to 1.98; s2 2.47 to 5.23 | **End**, both sentences (plays only after `kit_defend_done`, and only while `kit_key_caught` is false) |
| "So much of the job's on the move now. Easy to drop your guard on a train or in a cafe." | kit_fatima_begum | 6dc62c4a | 5.448 s | s1 0.32 to 2.35; s2 2.80 to 5.11 | Spare hook or end. Sentence 2 leans towards advice |
| "Working on the road is normal and fine; it's the small things that catch people." | zainab_hussain | 5d06e7ba | 4.968 s | 0.27 to 2.41; 2.64 to 4.53 | Spare hook. "Normal and fine" can read as an approving half-line, so it is the second choice |
| "Welcome to the Tarrowby exercise. I'm out of the office more than I'm in it, so this one's close to my heart." | zainab_hussain | 3b5bed69 | 6.504 s | 0.27 to 1.97; 2.62 to 4.54; 4.76 to 6.05 | Not used (too long and a welcome) |
| "Fleet's all out today." / "Parched after that yard run." / "Depot's heaving today." / "Another pallet backlog." / "Who's on the Shipley run?" | chidi, zainab, fatima | various | 1.9 to 2.5 s | n/a | Ambient bubbles, 5-minute cooldown, seeded bags and `kit_quiet`: none proven in 240 s on ca15. Not planned |

Never used: every "You stopped...", "You treated...", Zainab's done-branch lines (`c91f0179`, `fbea9a9c`, `b0828f65`, `948b640e`, `6e7e46e6`, `4c270711`, `96ea4933`: they are grades, rules or both), Chidi's "Good eye. No wifi page needs your work password..." and "A café wifi page wanting your work password is the trap..." (both name the tell), Chidi's "Nice one. Report a lost device the minute it's gone..." and Fatima's "Good. A work password typed on some lookalike cafe wifi..." (praise that names the item caught).

## Cut points (hook and end)

- **Hook.** Zainab e961b33f. Start at clip start minus 0.1 s; end at clip start + 3.89 s (speech ends at 3.69, the next word starts at 4.08, so the cut sits in the 0.39 s gap, 0.2 s after "hears" and 0.19 s before "a bag"). Length 3.99 s. Caption: "A screen someone reads, / a call someone hears,". Cutting after "minute" (5.45 + 0.2) would run 5.5 s, over the 5.0 s cold-open limit.
- **End.** Chidi 2405c659. Start at clip start minus 0.1 s; end at clip start + 5.43 s (speech ends 5.23; the file runs to 5.568). Length 5.53 s. Caption in two timed entries: 0.32 to 1.98 "Half my week's out of the van." (30), and 2.47 to 5.23 "You forget what's sat on that / tablet if you leave it / somewhere." (29 / 22 / 10)
- Both lines are talks (person-chat), not barks, so the bark rules (overlap, queue, cut at chat open) do not apply. Re-measure both with ffprobe and silencedetect on the real take.

## 9:16 and 1:1 (narrowed-panel takes)

Every wide panel gets a narrowed variant recorded in the same run (`max-width: 560px` on the panel, text wrapping inside, as ca04 and ca16):
- `t02n_brief` (tab, heading, strip),
- `t03n_choices_reveal` (cards, montage page with the headline card hidden, flip panel),
- `t05n_inbox` (list and the opened page card).

Person-chat hook and end, the title and close cards, and the room are cx checks only. Where the bar is cropped, set `caption` from `lines[]`.

## Hazards and blocks for takes

- **Montage layout is unmeasured.** The page is a crop on the train, café-call and laptop cards; if the headline card cannot be dropped by that crop, the take hides `.aw-montage-headline` by DOM. Note every element hidden in the take script.
- **Zainab line 3 timing.** Lines 1 and 2 play first (about 11 s). Mark line 3's real audio start; do not use 0.
- **Defend launch button and tab names** are unverified (the strip labels, the montage tab and the inbox tab), as in ca02 and ca15.
- **Opened card layout** (padlock, certificate line, Connect button, verbs) is unverified: confirm that the frame can drop the verbs.
- **Ambient room.** No proof that a staff member walks to the drinks machine in the first minute. Fallback: hold the wide with Zainab at the kiosk end and cut to the end line.
- **Avatar.** Check the player sprite (`BE_SPRITE=female_office_worker_v2`); the ca15 scout saw the hooded sprite in a headless run. Only the room shot can show it.
- **Chidi at the end.** If he is walking to the machine at the click, the talk can fail to open: record the room wide first, then re-seed for the Chidi take.
- No VM, no secrets, no exploit content in this episode.

## Not verified

S1 line advance, S5 montage layout and button text, S6 and S7 panel labels, S8 card layout, S9 drinks-machine walk, the narrator VO (not voiced).

## Round 1 review changes (23 Nov 2026)

Shots and entries that changed after the Opus (sell and truth) and Sonnet (timing) reviews; the script's "Changes from review (round 1)" has the full list.

- S5 montage: crop on the train, café-call and laptop cards; new `led_laptop` punch-in with v5d. Total now 74.4 s.
- S8 opened card: a time window of 6.3 to 10.7 s of `t05_inbox_list` (in = the row click); the list is 2 to 6.3 s.
- S9 room: mark-driven, with a static Chidi wide as the fallback.
- S10 end: seeded with three flags by hand, interact within about 15 s; caption in timed entries.
- S1 hook: caption ends with "…"; line 3 starts about 12 to 13 s in, mark-driven, take at least 25 s.
- Red card "Make the everyday calls"; v10 "At the depot, Chidi stops by."
- Correction: ca20's safe-pick lines name the trap or the habit (not "The version where..."); the all-unsafe conclusion stands.
