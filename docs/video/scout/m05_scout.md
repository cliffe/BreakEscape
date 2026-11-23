# m05 "Insider Trading": 60 s trailer scout (partial, handed over at about 150k tokens)

Stage 1 for the m05 trailer. Method: `.claude/skills/video-scout/SKILL.md`; outline: `docs/video/edits/M05_TRAILER60_OUTLINE.md` (its "Decided lines" block wins). Nothing recorded, nothing voiced. Torres is left out of every table: no line of his is listed, and his lines are not in the pool tested. No PIN, code or flag value is copied here.

## 1. Headline

- **30 candidate lines tested live** on fresh game 12251 through the real `/tts` endpoint (keyless server, port 3032). Results: **25 x 200 audio/mpeg**, **1 x 503** (no cached clip), **4 x 403** (text not in that NPC's ink). Control line (`Zebra quartz waffle protocol zero seven.`) returned **403**, so the check is live.
- **Every decided line and fallback in the outline has a live result.** Four of them do not play as written:
  1. **Hook (Netherton).** The decided sentence is the second sentence of a three-sentence ink line. The substring is refused (403). The whole ink line plays (200, **13.18 s**). A 6 s hook slot needs either a 13 s clip or a new split in the ink.
  2. **Owen's bag line.** The outline quotes `Did your bag just beep? ...You read my badge. Fair.` That fragment is refused (403). The whole ink line (add "I did half of Finance on last year's pen test.") plays (200, **6.77 s**).
  3. **"I find people the week before they break..." (the outline's new ending line 1).** It is already in the ink (`m05_phone_recruiter.ink:110`, commit 7679ac1bf), with a `#delivery:` tag. The plain text returns **503**: it is in the ink but has no cached clip. The tagged text returns 403. This line needs one voicing, which the user must approve through AC0 with a line count of 1.
  4. **"Shame. I'd have placed you somewhere nobody would ever think to look."** (new ending line 2). Not in the ink (403). It needs authoring before any voicing.
- **Recruiter ending, decided line: "Everyone has a price, agent. I'm asking what yours is."** Plays (200, **5.50 s**). Its knot is `recruiter_deal` (ink:210). The passage before it names the insider, so film from the ring with those subtitles cut out, or use a later call (see section 3).
- **Hook fallback:** Agent HaX, "Someone on the inside is stealing it." Plays (200, 2.42 s).
- **Top picks per speaker (facts only, no pick made):**
  - Netherton: whole hook line 13.18 s (only fits as a long hook or after a cut).
  - HaX: "Every ambulance, fire and police call through it runs six to eleven minutes slower." (200, 4.85 s, 17 words, over the recipe's 12-word limit but in the outline).
  - Patricia: "All vetted. All trusted. One of them shouldn't be." (200, 4.42 s); "Go on, then. Who?" (200, 1.78 s); "Bring me a name when you have one. With proof." (200, 3.53 s).
  - Lisa: "Tense. The crypto team keep looking at each other like it's a game of Cluedo." (200, 4.90 s); "Hi. You're the security person, right? Everyone's been whispering." (200, 4.37 s).
  - Owen: "That's Halloran's spare on the server hallway. Odd. She's in that lab all day, but never at night." (200, 6.26 s); "Finally. Someone to fix our mess who isn't me." (200, 3.50 s); "Alright. You're the security consultant? Owen Gallagher, sysadmin." (200, 4.18 s).
  - Halloran: "Find whoever did this, and quickly. And I hope to God you're wrong about my team." (200, 5.74 s); "My team didn't do this." (200, 1.94 s); "My team are brilliant, and vetted to the hilt." (200, 3.70 s).
  - Recruiter: "Control? Nobody wants to run it. We want the minutes." (200, 5.30 s, behind a choice); "He was a line item, agent. There are more like him in the pipeline right now." (200, 5.78 s); "Still deciding? The offer doesn't improve with age, agent." (200, 5.33 s); "Agent. Or whatever they're calling you this week." (200, 4.42 s).
- **Set pieces.** Partial: the outline's beats are checked against the ink and the scenario's lock and light data. The minigame close-up inventory has not been played (section 5).

## 2. Environment

- **Postgres:** already online (`pg_lsclusters`: 16 main, online). The scout did not start or stop it.
- **Database role.** `BE_DB_USER=root` and the login user `cliffe` both fail with "role does not exist". The project's own default, `deploy` (`test/dummy/config/database.yml`), works. Game 12251 was made with it, and the server runs on it. No roles were created and no DB command other than new-game and the runner was run.
- **Blocked action (please read).** While looking for the DB role, one command tried `sudo -n -l` and a `psql -U postgres` connection. The permission check blocked it, and nothing ran. I did not retry it or try another route. If a superuser route is needed to set up the role, that is your call.
- **Bundler.** `BUNDLE_FORCE_RUBY_PLATFORM=true` fails on this machine (only platform gems are installed). Run without it. `RBENV_VERSION=$(cat .ruby-version)` and `BUNDLE_PATH=<main checkout>/vendor/bundle` were used.
- **Keyless server:** started on `127.0.0.1:3032` with `GEMINI_API_KEY` unset, `BREAK_ESCAPE_STANDALONE=true`, under `nice -n 19`. **Stopped at the end of this stage** (confirmed: nothing on 3032). Restart: `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3032 nice -n 19 bin/rails server -b 127.0.0.1 -p 3032` from the worktree, with `BUNDLE_PATH` set and `BE_DB_USER` unset.
- **Game:** `tools/playtest/new-game.sh m05_insider_trading`, fresh, no flags. **GAME_ID=12251.** The helper may have written a gitignored flags XML under `tools/playtest/`.
- **Ports not touched:** 3000 (listening, the user's), 3001, 3099, 3017, 3018, 3025, 3447.
- **Repo:** no tracked file changed except this report. `git status` shows only the existing `?? node_modules`.
- **Scratch** (`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/aa7bde54-8454-4f29-a091-6d65a3d0b927/scratchpad/video-scout-m05/`): `lines.json` and `lines.tsv` (dump of 363 lines, all speakers, 12 words or fewer), `picked.json` (the 30 tested lines), `tts-run1.txt` (the run's output), `clips/` (the 200 audio clips), and the server log.
- **Not run:** no headless browser, no video encode, no TTS generation.

## 3. Part A: voiced lines

Columns: ID, exact text (the whole ink line, speaker removed), ink file:line, knot, conversation path, cheapest entry state, words, spoken length, live result. Word counts are approximate.

### Hook and briefing (npc `director_netherton` and `opening_briefing`)

| ID | Exact text | Ink | Knot | Path and entry state | Words | Length | Live |
|---|---|---|---|---|---|---|---|
| N1 | Agent 0x00. This one is close to home in a way I dislike. Someone inside a Home Office contractor is handing ENTROPY the crown jewels. | opening.ink:34 | start | Fresh game, first line of the briefing, before any choice | 30 | 13.18 s | **200** |
| N2 | Someone inside a Home Office contractor is handing ENTROPY the crown jewels. (outline wording) | (fragment) | | Not an ink line | 13 | n/a | **403** |
| H1 | Someone on the inside is stealing it. (fallback) | opening.json start[0].g-0 | start | Fresh game, briefing, after the first gather | 7 | 2.42 s | **200** |
| H2 | Every ambulance, fire and police call through it runs six to eleven minutes slower. | opening.ink:142 | buyers_and_stakes | Fresh, a briefing choice that routes to buyers_and_stakes (ink:99, 114 or 130). Not played | 17 | 4.85 s | **200** |

### Patricia Morgan (`patricia_morgan`)

| ID | Exact text | Ink | Knot | Path and entry state | Words | Length | Live |
|---|---|---|---|---|---|---|---|
| P1 | All vetted. All trusted. One of them shouldn't be. | patricia_morgan.json suspects_overview[0] | suspects_overview | Patricia's office, hub choice "Who's on the suspect list?" (ask_suspects). Fresh | 9 | 4.42 s | **200** |
| P2 | Go on, then. Who? | patricia_morgan.ink:378 | share_findings | Hub choice "I think I know who it is." (ink:226-227), gated on `not torres_identified` only. Needs the evidence first in play, not confirmed | 4 | 1.78 s | **200** |
| P3 | Bring me a name when you have one. With proof. | patricia_morgan.json provide_access | provide_access | Patricia's office, the access hub. Fresh | 10 | 3.53 s | **200** |
| P4 | I have a feeling. A feeling isn't evidence. That's your job. | patricia_morgan.json suspects_overview | suspects_overview | As P1 | 11 | 5.02 s | **200** |

Note: P2 is also in `m05_phone_patricia.ink:175`. Test and use the in-person knot for the naming beat.

### Lisa Park (`lisa_park`)

| ID | Exact text | Ink | Knot | Path and entry state | Words | Length | Live |
|---|---|---|---|---|---|---|---|
| L1 | Tense. The crypto team keep looking at each other like it's a game of Cluedo. | lisa_park.ink:193 | ask_office_mood | Break room, hub choice "What have you noticed lately?" (ink:62-68, sets first_meeting false). Fresh | 15 | 4.90 s | **200** |
| L2 | Hi. You're the security person, right? Everyone's been whispering. | lisa_park.json start | start | Break room, first visit. Fresh | 9 | 4.37 s | **200** |

### Owen Gallagher (`owen_gallagher`)

| ID | Exact text | Ink | Knot | Path and entry state | Words | Length | Live |
|---|---|---|---|---|---|---|---|
| O1 | That's Halloran's spare on the server hallway. Odd. She's in that lab all day, but never at night. | owen_gallagher.ink:375 | give_door_log | Hub choice "Patricia's log has a crypto badge in the server hallway at 23:47. Whose?" gated on `found_incident_log and not found_door_log and not door_log_handed`. **Needs `found_incident_log` (Patricia's incident log first).** The outline's entry state (open_office_area) is not enough | 19 | 6.26 s | **200** |
| O2 | Did your bag just beep? ...You read my badge. Fair. I did half of Finance on last year's pen test. | owen_gallagher.ink:283 | owen_clone_debrief | After the cloner beat: hub choice "(Lean over his log screen...)" (ink ~165, gated `not server_badge_obtained`), then owen_clone. Entry: open_office_area, cloner in kit | 22 | 6.77 s | **200** |
| O2a | Did your bag just beep? ...You read my badge. Fair. (outline wording) | (fragment) | | Not an ink line | 9 | n/a | **403** |
| O3 | Finally. Someone to fix our mess who isn't me. | owen_gallagher.json start | start | Terminal, first visit. Fresh | 9 | 3.50 s | **200** |
| O4 | Alright. You're the security consultant? Owen Gallagher, sysadmin. | owen_gallagher.json start | start | As O3 | 8 | 4.18 s | **200** |

### Dr Ruth Halloran (`dr_halloran`)

| ID | Exact text | Ink | Knot | Path and entry state | Words | Length | Live |
|---|---|---|---|---|---|---|---|
| D1 | Find whoever did this, and quickly. And I hope to God you're wrong about my team. | dr_halloran.ink:74 | start | First meeting, after the opening narration, before any choice. Fresh, research lab | 16 | 5.74 s | **200** |
| D2 | You're the consultant. Ruth Halloran. I run Heisenberg. | dr_halloran.json start | start | As D1, the line before it | 8 | 4.54 s | **200** |
| D3 | My team didn't do this. | dr_halloran.json start | start | As D1 (not read in full) | 5 | 1.94 s | **200** |
| D4 | My team are brilliant, and vetted to the hilt. | dr_halloran.json defensive_response | defensive_response | Hub reply in the first meeting (route not read) | 9 | 3.70 s | **200** |

### Recruiter (`recruiter`, phone). No Torres lines are listed.

| ID | Exact text | Ink | Knot | Path and entry state | Words | Length | Live |
|---|---|---|---|---|---|---|---|
| R1 | Everyone has a price, agent. I'm asking what yours is. | phone_recruiter.ink:210 | recruiter_deal | Reached from recruiter_deal_offered's knot via confirms_casualties choices (ink:179, 183), or from **mid_mission_contact** (ink:301) when `recruiter_deal_offered` is unset. **Cheapest: a later call** (mid_mission_contact), which skips the casualty choices. Gate: `torres_identified` (start knot, ink:51-53). The lead-in names the insider | 10 | 5.50 s | **200** |
| R2 | Control? Nobody wants to run it. We want the minutes. | phone_recruiter.ink:155 | recruiter_reveals_target_choices c-1 | First call: start_choices, then introduction_choices "What were you actually after?" (ink:124), reveals_target, then the choice | 10 | 5.30 s | **200** |
| R3 | He was a line item, agent. There are more like him in the pipeline right now. | phone_recruiter.ink:130 | recruiter_line_item | First call: introduction_choices "You're talking about him like a receipt." (ink:121). "He" is the insider. This hints the insider is a man, as the outline notes. The outline's `:128` is ink line 130 | 16 | 5.78 s | **200** |
| R4 | I find people the week before they break, agent. Then I make them an offer. | phone_recruiter.ink:110 | recruiter_introduction | First call, first knot, no choice. In the ink with a `#delivery:` tag; the knot's next paragraph names Torres | 15 | n/a | **503** (no cached clip) |
| R4a | same, with the `#delivery:` tag appended | | | Tag text is not the ink text | | | **403** |
| R5 | Shame. I'd have placed you somewhere nobody would ever think to look. | (not in ink) | | Proposed for recruiter_deal_refused (outline). Not authored | 12 | n/a | **403** |
| R6 | Still deciding? The offer doesn't improve with age, agent. | phone_recruiter.ink:~297-302 (mid_mission_contact) | mid_mission_contact | Later call, offer not yet taken | 9 | 5.33 s | **200** |
| R7 | Agent. Or whatever they're calling you this week. | recruiter.json first_call | first_call | First call opener | 8 | 4.42 s | **200** |

### Extra spoiler-checked candidates for NPC and exchange slots

| ID | Exact text | Speaker, knot | Note | Live |
|---|---|---|---|---|
| T1 | Can I help? I'm only the office manager. | thandiwe_moyo, choices | Office life, route not read | **200** (3.70 s) |
| Ni1 | Is the security person still in? | niamh_doherty, ex_whispering | Office-life exchange, heard once, gated on office life | **200** (2.09 s) |
| B1 | You again. Do they pay you overtime? | bernadette_lyons, ex_late_again | Office-life exchange, heard once | **200** (3.26 s) |

### Excluded on purpose (not tested)

- All David Torres lines, the insider's office and mug texts, and the badge and reference card rows that name him (outline section 8).
- Lines with a code (Owen's lockbox line). Not copied.
- The debrief, the fate and deal menus, and the casualty lines (HaX `:148`, Recruiter `:165`).
- Lisa's "Has anyone seen David?" and the other lines naming David.
- Phone-only lines (`agent_0x99`, `m05_phone_patricia`) except the in-person duplicates above.

## 4. Part B: set pieces (partial)

- **Lock types in `scenario.json.erb`** (counts, not yet mapped to rooms): rfid x2 (line 2125), key x2 (2297), pin x1 (2236), password x1 (2166), biometric x1 (2556, not mapped; check it is not Torres's room).
- **Lighting** (`scripts/lighting_lookup.rb`): `server_room` motion, `offAfter` 60, dark ambient `#0a0f1c`, night variant `on` on the insider-named flag. `server_hallway` motion, `offAfter` 60. `main_corridor` motion, `offAfter` 75, with a night variant. `research_lab`, `patricia_office` and `reception_lobby` are `on`. The corridor is the night turn in the outline.
- **Answer on screen:** not checked on screen. The outline's no-answer rules hold for the lines in part A.
- **New mechanics (outline section 3):** the insider-naming (aim and reason menus, not played), the badge-log deduction, fingerprint matching (`fingerprintCandidateCount: 4`, dusting, `dusting-game.js:1136`), motion lights with `offAfter` as day-to-night, and the Bludit VM for real hacking (needs a VM, not possible here).
- **Card candidates (from the outline):** `Mission 5 / Insider / Trading`, `Name the / Insider`, `Real / Hacking`, `Before the / Final Upload`.
- **VM:** the research-portal and launcher shots need a SecGen VM and are marked "needs VM".

## 5. Not done

1. **Minigame inventory by play.** Not played. The inventory above comes from the scenario lock types only. The recipe needs one close-up for each type (lockpick, key, PIN, password, RFID, dusting, vault, flag station, phone, CyberChef if present).
2. **Full part B set-piece table** (room and object ids, answer on screen, visual judgement per shot). Not built.
3. **Music.** The outline's candidates (SpyAction "Midnight Double Agent", Noir "Encrypted Shadows", Noir "Midnight Exit Strategy") were not checked against `tools/video/edits/music/summary.json`, and the used-track list in `docs/video/recipes/README.md` was not read.
4. **SOLUTION_GUIDE.md** was not read. The spoiler list above follows the outline's section 8 instead.
5. **Recruiter path proof.** The routes above are from the ink. No call was played to check the gates.
6. **Lisa's, Owen's and Patricia's gating routes**, and Halloran's `defensive_response` route, were read only as far as the knot headers and the first gate. The full paths need a play-through in the take stage.
7. **Netherton's knot.** Line 34 is in `start`, read as the opener; not confirmed by play.

## 6. Decisions for the orchestrator (not made by the scout)

- **Hook.** Use the 13.18 s whole line, split the ink line for a shorter clip (voicing needed), or pick the HaX fallback (2.42 s, a weaker hook).
- **Owen's line.** Use the 6.77 s whole line, or re-cut the ink to the outline's fragment (voicing needed).
- **Recruiter line 1 ("week before").** Cached audio is missing. One line to voice, through AC0.
- **Recruiter line 2 ("Shame").** Not in the ink. It needs authoring, then voicing.
- **Ending.** R1 ("Everyone has a price") is clean and 5.50 s. Film it from a later call (mid_mission_contact), or from the first call with its lead-in cut.
- **Outline line numbers.** Two are off by two (`:128` is ink 130; `:153` is ink 155). The text matches, so use the ink numbers above.
