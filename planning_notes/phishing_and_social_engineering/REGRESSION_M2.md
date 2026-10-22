# M2 back-compat regression catch-up (m01 to m10), 22 October 2026

Run by a Sonnet agent against the working tree on the keyless :3001 server, headless, Node 24. Nothing in the game was edited and nothing was committed. Every browser it opened was closed (`session-stop.sh`). The sessions on games 3304, 3305 and 3307 belong to other agents and were left alone.

**What this covers:** the §2.4 R3 browser checks on the shipped missions, R4 on m01 and m05, R1 (`bin/test-js`) and the Rails suite. The §2.3 item 1 mapping audit and R0 are separate work and were not run here.

**Result in one line:** no regression caused by an SE change. Three missions have an item that is not a clean pass (m04, m09, and a transient m05 server error). None of the three traces to an SE commit. Details in "Findings".

## Caveats

1. **The working tree was not clean.** Other agents were editing during the run. At the end, uncommitted changes touched `app/models/break_escape/game.rb` and `games_controller.rb` (a new `pinLength` field for PIN pads), `public/break_escape/js/systems/doors.js` (same field), `npc-manager.js`, `lockpick-catch.js`, `core/game.js`, `core/player.js`, `scenarios/m02_ransomed_trust/scenario.json.erb`, and m10 scenario and room assets. Every result below is against that working tree, not against HEAD. One failure (m05) was caused directly by a half-written `game.rb`.
2. **The machine was loaded** (load average 10 to 21). Three `bootstrap` calls timed out at the 60 s `cmd.sh` limit and were re-issued. Timings are not representative.
3. **Console errors.** The keyless server answers TTS requests with 503, so every mission shows 503s. I counted a 503 as the expected TTS noise. The user's brief said "400"; no TTS 400 appeared. The m10 403s were checked in the server log and are all `POST .../tts` text-validation failures (`[TTS] Text validation failed for NPC ...`), so I grouped them with TTS.
4. **Harness limits.** `completeLockpick` is assisted (dexterity cannot be driven). `debugKO` was used on hostile NPCs, so combat was not played. Flags were supplied (`<flag:N>`, or `test:flag:1` for m10, which has no flags XML), so nothing past a flag station is earned. A bare `mg continue` loop was used in long cutscenes.
5. **Check 2 (plain "Requires key") is only observable where the player has no lockpick.** Only m01 starts without one. Every other mission hands over a Lock Pick Kit at the start, so a key door opens the lockpicking or key-selection minigame instead of the toast. I covered check 2 two ways: the exact toast in m01, and a static check that no shipped mission authors `lockedHint` (`grep -l lockedHint scenarios/*/scenario.json.erb` lists only `lab_social_engineering` and `test_social_docs_proof`). The wrong-key toast was also checked in m02 (see below).

## Suite results

| Id | Check | Result | Evidence |
|---|---|---|---|
| R1 | `bin/test-js` | PASS | `Files: 185 passed, 0 failed, 185 total`, exit 0 |
| R2 | `bin/rails test` | PASS | `737 runs, 2558 assertions, 0 failures, 0 errors, 1 skips`, exit 0 |
| R4 | `sync-state-regress.js` on m01 (game 3302) | PASS | no lost or changed globals across reload, notes kept, phone thread `agent_0x99: 1 -> 1`, idle 60 s: 0 page requests, one changed global sent as `{"regress_one":1}` only, first sync keys contain no `mailState` |
| R4 | same on m05 (game 3303) | PASS, one note | same results; phone count `agent_0x99_handler: 3 -> 4` across the reload (see F6); no `mailState` key |

R4 was run with a 60 s idle window (default is 120 s) and with an empty file in place of the server log. The script reads the whole log with `readFileSync`, and `tmp/keyless-3001.log` is 590 MB, so the first attempt (games 3299 and 3300) died with `ERR_STRING_TOO_LONG`. The "serverLogRequests" column is therefore 0 by construction and was not measured. Page-side request counts are real.

## Totals

Per mission, the four ordered checks, then the plan's named checks.

| Mission | 1 console | 2 plain locked text | 3 phone and person reopen | 4 reload | Verdict |
|---|---|---|---|---|---|
| m01 | PASS | PASS | PASS | PASS | PASS |
| m02 | PASS | PASS | PASS | PASS | PASS |
| m03 | PASS | not observable | PASS | PASS | PASS |
| m04 | FAIL (unreproduced) | not observable | PASS | PASS | FAIL on run A, clean on rerun (F2) |
| m05 | FAIL once (external) then PASS | not observable | PASS | FAIL once (external) then PASS | PASS on rerun (F3) |
| m06 | PASS | not observable | PASS | PASS | PASS |
| m07 | PASS | not observable | PASS | PASS | PASS |
| m08 | PASS | not observable | PASS | PASS | PASS |
| m09 | FAIL (422) | not observable | PASS | PASS | FAIL on check 1 (F1) |
| m10 | PASS (TTS 403s) | not observable | PASS | PASS | PASS |

**Missions: 7 clean PASS (m01, m02, m03, m06, m07, m08, m10), 1 PASS after a transient external failure (m05), 2 with an open item (m04, m09). Regressions attributable to an SE change: 0.**

"Not observable" means no key-locked door could show the toast because the player holds a lockpick; the static check in caveat 5 stands in for it.

## m01 First Contact

Games: 3244 (opening, doors, phone, Sarah, Kevin hostile, reload), 3298 (full Derek route). Logs: `tools/playtest/m2reg-m01_first_contact-game3244.jsonl`, `...-game3298-derek.jsonl`. Verify-run: both "progress recorded" (4 rooms beyond the first; 3298 also 1 flag submitted).

| Check | Result | Evidence |
|---|---|---|
| Main Office door with no key and no lockpick | PASS | toast `Locked / Requires key`, no hint text appended (3244) |
| Door 1: Main Office (Sarah's key) | PASS | `lock` selected the key, `enter main_office_area` crossed |
| Door 2: IT room PIN 2468 | PASS | PIN earned from the reception voicemail first |
| Opening phone: reception desk phone, Kevin voicemail | PASS | contact opened, transcript read, closed, reopened: unread badge gone, same single message |
| Person chat reopen (Sarah) | PASS | second open starts at "Good luck with the audit!", hub works |
| Kevin `#hostile:kevin_park` | PASS | after reading Kevin's workstation log (`framing_evidence_seen`), the `ENTROPY` choice set Kevin `hostile: true` and the player took damage (100 to 40, then KO screen) |
| Derek `#hostile` then `#influence:-100` | PASS | game 3298: archive opened with the supplied flag, ENTROPY Network Architecture taken (`entropy_reveal_read`), "I'm taking you down" gave `Derek hostile: true`, `derek_fight_triggered`; `debugKO` then set `derek_confronted`. No influence popup appeared, as expected for a non-social NPC. Combat not played |
| Save and reload | PASS | after `location.reload()` and Resume: inventory (Main Office Key, Lock Pick Kit, Server Room Keycard), tasks and Main Office door state intact, phone voicemail still readable |
| Console | PASS | only 503s |

## m02 Ransomed Trust

Game 3245. Log `tools/playtest/m2reg-m02_ransomed_trust-game3245.jsonl`. Verify-run: 8 rooms beyond the first.

| Check | Result | Evidence |
|---|---|---|
| Door 1: IT department (Bernie's override key) | PASS | `lock` picked the override key |
| Door 2: Boardroom PIN 0417 | PASS (PIN supplied, not earned) | |
| Wrong-key toast on the Security Office door | PASS | selecting the IT override key gave `Wrong Key / The selected key doesn't work with this lock.`, no hint text |
| Phone chat (player phone, Agent HaX, story declares `EXTERNAL player_name`) | PASS | opened, took "What should I know going in?", closed and reopened mid-thread: identical transcript, unread badge cleared; after reload the thread was identical plus one timed line |
| Person chat reopen (Bernie) | PASS | reopened with "Back already. What's broken now?" |
| Guard not turned hostile (Val Okonkwo, 40-turn conversation) | PASS | `hostile: false` afterwards |
| Ward nurse Doyle conversation | NOT RUN | |
| Bark from an `EXTERNAL` story | NOT RUN | |
| Save and reload | PASS | `open_it_department` stayed complete, `it_door_open` and `val_met` globals present |
| Console | PASS | no errors at all |

## m03 Ghost in the Machine

Game 3246. Log `tools/playtest/m2reg-m03_ghost_in_the_machine-game3246.jsonl`. Verify-run: 4 rooms beyond the first.

| Check | Result | Evidence |
|---|---|---|
| Door 1: conference room (RFID) | PASS | Ffion "Lean in" opened the cloner; Crack keys, Dictionary Attack, Save; emulated the saved badge; door sprite `locked: false` |
| RFID reader with nothing saved | PASS | toast `Access denied. No keycard, and nothing saved on the cloner.` (not the key text) |
| Door 2: executive office (key lock) | PASS (assisted) | `completeLockpick`; entered |
| Phone (Agent HaX, `EXTERNAL` story) | PASS | thread read, "Where do I stand?" chosen, reopened: same text, no duplicate lines; again after reload |
| Person chat reopen (Ffion) | PASS | "Still here? I don't mind." |
| Bark from an `EXTERNAL` story | NOT RUN | |
| Save and reload | PASS | `exec_wing_entered`, `reception_badge_cloned` globals and the cloner's saved card ("Saved" entry) survived |
| Console | PASS | none |

First `bootstrap` timed out under load and left a stale "Agent HaX conversation ended" chat open; `mg close` and `dismiss` cleared it. Harness, not game.

## m04 Critical Failure

Games 3264 (run A) and 3270 (run B, with an `error` listener that records stacks). Logs `...-game3264.jsonl`, `...-game3270.jsonl`. Verify-run: 4 rooms beyond the first for both.

| Check | Result | Evidence |
|---|---|---|
| Door 1: engineering workshop (RFID) | PASS | Vance's Level 1 clone read and saved; emulate gave "Card not accepted. The clone works, but this reader doesn't take Level 1 Facility Card." Door stayed locked, as designed |
| Door 2: Battery Hall 2 (RFID) | PASS | Level 1 card emulated, door `locked: false`, entered |
| Vance person chat plus spaced-form popup | PASS | `+ Influence: Robert Vance` appeared (three popups on the first chat in run B) |
| Person chat reopen (Vance) | PASS | "Something else?" then new cloner option |
| Phone (Agent HaX; m04 declares `EXTERNAL`s, not checked which story) | PASS | after Relay's KO the "pushed you a copy" message arrived; reopened: identical; after reload identical |
| Cipher and Relay scenes | PASS | Cipher went hostile after "Albion contracted me"; Relay challenged on entering Hall 2; cloned Relay's card (`Workshop Card Level 2` saved). Both set to KO with `debugKO` |
| Vance phone contact (second half of "the Vance pair") | NOT RUN | not offered in the visited route |
| Save and reload | PASS | `Workshop Keycard (relayed copy)` in inventory, tasks and globals intact, cloner still lists "Saved" |
| Console | **FAIL on run A, PASS on run B** | run A: one `Cannot read properties of undefined (reading 'style')` besides the 503s. Run B: none, after repeating the whole route with a stack-recording listener. See F2 |

## m05 Insider Trading

Games 3265 (main), 3303 (R4), 3309 (phone probe). Log `...-game3265.jsonl`. Verify-run: 5 rooms beyond the first.

| Check | Result | Evidence |
|---|---|---|
| Door 1: server hallway (RFID) | PASS | Owen's badge cloned via "Lean over his log screen", emulated |
| Door 2: server room (password) | PASS (password supplied: typed `quantum2024` without reading Owen's note first) | |
| Owen popup, unspaced form | PASS | `+ Influence: Owen Gallagher` |
| Patricia, Lisa, Halloran popups | NOT RUN / not observed | the popup observer was installed after Patricia's first conversation; Lisa and Halloran were not visited |
| Phone (Patricia mobile) | PASS | opened, "Just checking in" sent, reply "Still here. Ring me..." arrived; reopen and post-reload both show the same three lines |
| Person chat reopen (Patricia, Owen) | PASS | hub reopens with "What now?" / "What else?" |
| Save and reload | **FAIL once, PASS on retry** | first reload: browser console `Failed to load starting room: 500 Internal Server Error`, empty inventory. Server log: `undefined method 'set_pin_length!' for #<Class:...>` at `game.rb:2739`. Second reload a minute later: full state back (see F3) |
| Console | FAIL once, then PASS | the 500 above; otherwise 503s |

## m06 Follow the Money

Game 3266. Log `...-game3266.jsonl`. Verify-run: 3 rooms beyond the first.

| Check | Result | Evidence |
|---|---|---|
| Door 1: trading floor (key) | PASS (assisted) | |
| Door 2: server room password `bitcoin2025` | PASS | earned: read the IT New Starter Checklist, got the wordlist from Irina first |
| Person chat reopen (Irina) | PASS | second open: "Go on." |
| Phone (Agent HaX) | PASS | transcript identical on reopen and after reload |
| `global_variable_changed` chain | PASS | `server_passphrase_known` and `found_password_lists` set; HaX's follow-up text arrived |
| Irina popups | NOT RUN / not observed | observer not installed |
| Save and reload | PASS | |
| Console | PASS | 503s only |

## m07 The Architect's Gambit

Game 3285. Log `...-game3285.jsonl`. Verify-run: 3 rooms beyond the first, 1 object unlocked.

| Check | Result | Evidence |
|---|---|---|
| Door 1: server room (RFID) | PASS | `Door opened with Printed Contractor Badge`; the badge came from the Contractor Badge Station PIN 0616 (typed, not earned) |
| Door 2: generator room (key) | PASS (assisted) | |
| Person chat reopen (Hollis) | PASS | "Still here. Say it or go." |
| Phone (Agent HaX plus The Architect contact) | PASS | reopened identically, and after reload |
| `global_variable_changed` chain | PASS | `inside_reached` produced the Architect contact; HaX hub updated |
| Save and reload | PASS | `badge_obtained`, `inside_reached` kept; Printed Contractor Badge in inventory |
| Console | PASS | 503s only |

## m08 The Mole

Game 3286. Log `...-game3286.jsonl`. Verify-run: 6 rooms beyond the first, 1 object unlocked.

| Check | Result | Evidence |
|---|---|---|
| Door 1: server room (RFID) | PASS | printer PIN 0311 and the badge: earned, post-it read first |
| Door 2: security archives (password) | PASS | `TrustNoOne`, earned from the same post-it |
| Person chat reopen (Netherton) | PASS | "Agent. What do you need?" |
| Phone (Agent HaX) | PASS | |
| Mapping chain | PASS | `brief_taken` produced HaX's "Three names, three rooms" text |
| Spaced-form popups | PASS | Vector: two `+ Influence` and two `- Influence` popups |
| Save and reload | PASS | |
| Console | PASS | 503s only |

## m09 Digital Archaeology

Games 3293 (route) and a second session on 3293 to check inventory after reload. Logs `...-game3293.jsonl`, `...-game3293-resume.jsonl`. Verify-run: 4 rooms beyond the first, 1 flag.

| Check | Result | Evidence |
|---|---|---|
| Door 1: front desk (key) | PASS (assisted) | |
| Door 2: restricted stacks (RFID) | PASS | opened by HaX after flag 1 (`<flag:1>` supplied) |
| Person chat reopen (Sorensen at the hatch) | PASS | "You have your file. I have my boxes." |
| Phone (Agent HaX) | PASS | |
| Save and reload | PASS | server inventory has 9 entries including the letters note; the client shows notes in the Notepad (4 pages: Notepad, salvage line, letters, Mission Brief), not as inventory slots |
| Console | **FAIL** | `422 Unprocessable Content` on every load after the hatch conversation (F1) |

## m10 Full Disclosure

Game 3296. Log `...-game3296.jsonl`. Verify-run: 3 rooms beyond the first, 1 flag. No flags XML exists for this mission, so the station was driven with `test:flag:1`.

| Check | Result | Evidence |
|---|---|---|
| Door 1: blast tunnel (RFID) | PASS | opened by HaX after flag 1 |
| Door 2: security office | PASS | inner door open on entry |
| Person chat reopen (Netherton) | PASS | |
| Phone (duty handset, Ghost) | PASS | call took the "last job" branch; examine afterwards reads "quiet now" |
| Save and reload | PASS | `flag1_submitted`, `ghost_call_done`, blast door state kept |
| Console | PASS with note | 503s plus 4 `403`s, all `POST /tts` text validation failures (`quintero_post`, `kowalczyk_post`, `nightshade_table: "Manual."`) |

## Findings

| # | Severity | Mission | Finding | SE cause? |
|---|---|---|---|---|
| F1 | minor | m09 | `422 Unprocessable Content` in the console on every page load after the hatch conversation. Server log: `inventory validation failed: NPC not encountered: sorensen_door` for the `letters` note ("Initiative to Social Fabric, Handoff 14"). The item still reaches the server inventory and the Notepad. | No. See below |
| F2 | unrated | m04 | One `Cannot read properties of undefined (reading 'style')` in run A. Not reproduced in run B (identical route, error listener installed, drained after every stage, plus a repeat of the reload, phone and cloner steps). | Unknown, probably not. See below |
| F3 | n/a | m05 | First reload returned a 500 for the starting room. | No. Another agent's half-saved edit to `game.rb` |
| F4 | tooling | R4 | `tools/playtest/sync-state-regress.js` cannot take a 590 MB log. | No |
| F5 | minor | m10 | TTS text-validation 403s for lines whose text does not match the scenario (`Manual.`, Quintero's and Kowalczyk's post lines). | No. m10 is being edited in the working tree; re-run the voice check after it settles |
| F6 | observation | m05 | R4 phone count `3 -> 4` across the reload. | Probably not. See below |
| F7 | harness | m02 | `enter staff_room` from the Main Corridor repeatedly opened the Security Office lockpicking minigame instead, because the doorway click lands nearer the Security Office door. `walk left` then `walk up` crossed. | No |

### F1 (m09, 422)

- **What happens.** `inventory` action `add` for the `letters` note is refused with "NPC not encountered: sorensen_door". The note is listed under `sorensen_door`'s `itemsHeld`, but the player had only met `sorensen_hatch`. The 422 shows after each reload (the client re-posts the add), not during the conversation itself, and the server inventory (`verify-run.rb`, and `/scenario` `playerInventory`) already holds the note.
- **Is it an SE change?** The check (`games_controller.rb` around line 1793, `unless @game.player_state['encounteredNPCs']&.include?(npc_id)`) is the one from commit `a9458597`. SE commit `6dce0c9b` ("SE Phase 1b ... headless give") only added `&.` and a `headless_email_record?` branch, and the old line (`6dce0c9b^`) rejected the same way. Nothing in m09 or the `give_item` path was changed by SE.
- **What I did not establish.** Whether this also happens on a clean checkout of the pre-SE tree, and which client path re-posts the add on load. A human should rule on whether it needs a fix (probably yes: the owner id for `letters` should be the NPC the player actually met, or the scenario should list the note under `sorensen_hatch`).

### F2 (m04, `style` error)

Run A hit it somewhere between the Vance conversation and the post-reload drain; the log cannot say where (the harness drain returns messages without timestamps). Run B repeated the route with a `window.addEventListener('error')` hook and drained after every stage with no hit. It involved no SE-changed file that I could tie it to. Needs a human to run m04 once more if it recurs; the hook (`window.__errs`) will give a stack.

### F3 (m05, 500)

Server log at the time: `[BreakEscape] room error: undefined method 'set_pin_length!'` raised from `app/models/break_escape/game.rb:2739` while that file was mid-edit (the helper is defined at line 1209 in the file now on disk, and `git diff` shows the `pinLength` change as uncommitted). A second reload a minute later succeeded and restored state (inventory, tasks, the Patricia thread). This is a hazard of testing on a shared dev server while the tree changes; it is not a regression.

### F6 (m05, phone count)

The R4 script counts phone messages per thread and found 3 before the reload, 4 after. I looked for a duplicate on a fresh m05 game (3309): the HaX thread was 17 text fragments at open, 25 s later, and after a reload, identical each time. So the extra message in R4 is most likely a timed message arriving between the snapshot and the reload. Not confirmed; the R4 baseline from the 0.0 run was not available to compare.

## Plan checks not run

- m02: Doyle (ward nurse) conversation, and a bark from an `EXTERNAL` story.
- m03 and m04: a bark from an `EXTERNAL` story; m04 Vance phone contact.
- m05: Patricia, Lisa and Halloran popups (Owen's was seen).
- m06: Irina popups.
- `lab_scanning` instructor and one sis01 popup check (outside m01 to m10).
- §2.4 R0 (static old-versus-new engine diff) and the §2.3 item 1 `global_variable_changed` audit.

## Earned-secrets summary

| Secret | Mission | Earned? |
|---|---|---|
| IT room PIN 2468 | m01 | yes, from the reception voicemail |
| Server room keycard | m01 | yes, from Kevin |
| `<flag:1>` at the drop-site (m01 3298), m09, m10 | m01, m09, m10 | no, supplied. Everything downstream is exercised, not tested |
| Boardroom PIN 0417 | m02 | no, supplied |
| Staff badge, Victoria not attempted | m03 | badge: yes (cloned from Ffion) |
| Vance and Relay cards | m04 | yes (cloned in conversation) |
| Server room password `quantum2024`, Owen's badge | m05 | badge yes; password no (typed without reading the sticky note) |
| `bitcoin2025` | m06 | yes (checklist and wordlist) |
| Badge station PIN 0616 | m07 | no, supplied |
| `TrustNoOne`, printer PIN 0311 | m08 | yes (break room post-it) |
| Front desk and generator room picks | m02 to m09 | assisted |

## Files and logs

All under `tools/playtest/` (git-ignored): `m2reg-<mission>-game<id>.jsonl` session logs (14 files), plus `m01_first_contact-flags-game3244.xml` and the other generated flag files. Scratch helpers and the raw suite output are in the session scratchpad, not in the repo.
