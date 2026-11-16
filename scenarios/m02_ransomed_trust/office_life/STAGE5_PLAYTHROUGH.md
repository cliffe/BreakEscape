# m02 stage 5 natural playthrough: stopped part-way (2026-11-16)

Branch `build/ol-m02`, tip 931044ef4. Keyless server on port 3090 (own pidfile, stopped at the end), headless browser, `setFPS(20)` with fixed steps on (`fixedStep` read true). Game 5801, fresh from `tools/playtest/new-game.rb` with no `--unlock` and VM flags seeded (`--flags`, 4 valid). Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/m02-play/session-5801.jsonl` (313 commands). Machine load average was about 45, so timings are slow, not representative.

## Result

Completion: **NO. The run stopped at the context guard, about 8 minutes of wall time and 465 s of game clock in, with the player in the CTO office.** The mission was not finished and no debrief was reached. This file does not show that office life leaves the mission finishable; it only covers the first stretch. A fresh agent must continue game 5801 (the server is stopped; restart a keyless one on 3090, the game state is in the database).

## Route taken so far (all by real play, no seeding, no `--unlock`)

1. Opening briefing with Netherton and HaX played through `converse` (nine questions asked, the mission brief note closed, tutorial declined).
2. Reception: read the visitor log, the crisis notice and the founding plaque (1987). Talked to Bernie: said "security consultant Dr. Kim called in", then "check your log". She wrote me in and handed over the IT Department Override Key. `bernie_gave_key`, `bernie_trusts_player` set.
3. Hopped room by room: vestibule, approach, ward. Talked to Sister Doyle ("What am I looking at", "Four minutes", "How long can you keep this up"); she gave the safe hint (founding year). Walked the ward link to the main corridor (Val seen at distance, not yet spoken to).
4. Night Handover (staff room): read the handover board and snag list (`found_safe_pin_clue`, `read_handover_board`, `insider_evidence_partial`), picked up the Ward Clerk's Laptop (it opened the crypto workstation overlay and went into the inventory) and the Wrapped Contractor Lanyard. Opened the IT door with the override key.
5. IT: Gary by the rapport route ("Seven times. I know." then "Six months ignored…"). He gave the Server Room Keycard and the credential hints; `staff_lanyard_obtained`. Read the infected terminal (`decoded_ransomware_note`). Tried to pick the filing cabinet: the override key does not fit (Wrong key), Switch to Lockpicking opened Gary's catch ("That's my filing cabinet."), I answered "It is. Your warnings are in it", then opened the cabinet with `completeLockpick` (assisted, the pick minigame is not drivable blind). The container's items could not be taken through `mg clickText`; the three documents were not collected (optional).
6. Staff room again, then the CTO office. Talked to Dr Kim through `converse` (how they got in, Gary, the escrow safe, the drill, the boardroom code). The run hit its turn limit there because my regex kept re-matching the repeated "The boardroom code again?" option (a harness artefact, but see problem P3).

Not yet done: Val and the cover-burn gate, the Security Office, the Server Room, all four VM flags, the recovery console, the Boardroom, Reeves, the comms terminal, the debrief and credits. Open tasks at the stop: `regain_freedom_of_movement`, `access_server_room`, `unmask_db_window`, `locate_safe`, `crack_safe_pin`.

Earned secrets so far: IT override key (Bernie, earned), IT door (key, earned), Server Room Keycard (Gary, earned), safe PIN hint 1987 (plaque, Doyle and snag list, all read before use; the safe itself not yet opened). No flags used (`flagsUsed: 0`). The cabinet pick was assisted.

## Office-life timeline (game clock seconds, from the event hook)

| Clock | Where I was | Event |
|---|---|---|
| 162-165 | staff room, just entered | Ernesto and Hodan both hit `npc_need_urgent`, walk to `staff_boiler`, `npc_use_started` (163, 165) |
| 165 | staff room | `coffee:0` exchange line, heard (overheard true) |
| 170, 176, 181, 185 | staff room | `night_watch_paper` lines 0 to 3 in order, alternating Ernesto, Hodan, Ernesto, Hodan; all heard; `heard_night_watch_paper` set |
| 190 | staff room | `npc_exchange_heard:night_watch_paper`, then pool chatter continues |
| 190-210 | staff room | `picture:caffeine`, `coffee:3`, `picture:social`, `picture:work` lines every 3 s while I stood in the room (about ten lines in 20 s) |
| 213-220 | staff room | both `npc_used`, `npc_use_heard`, then each `npc_arrived`, `npc_returned_post`, `npc_sat` (Ernesto 217-218, Hodan 219-220). A full break took about 50 s |
| 253 | entered IT | `room_entered:it_department` |
| 295-299 | in IT, Gary's conversation just closed | both NPCs urgent again, stood, left post, walked, `npc_use_started:staff_boiler`; Hodan's `picture:caffeine` chatter logged with `ov=false` while I was in IT (not overheard, correct) |
| `it_copier_page_shown` | IT | set during the IT visit, copier page appeared without being clicked |
| 465 | CTO office | clock at stop |

No porter (Ernesto) hostility, no walk-in on another NPC use, no printer, phone or coffee-cup use by an NPC outside the boiler was seen in this stretch. The porter was never a threat: he was at the boiler or his seat each time I passed.

## Problems

| # | Severity | What | Evidence |
|---|---|---|---|
| P1 | none for blocking | Office life did not block or slow anything up to the stop. Doors, dialogue, key use and pickups all worked while both staff-room NPCs ran boiler breaks. | session log, commands 1 to 313 |
| P2 | minor | After taking the Ward Clerk's Laptop the crypto workstation overlay opened over the room and blocked every move and interact (`blocking-ui`, buttons "↑" and "×") until dismissed with `dismiss "×"`. A player might not realise the laptop moved into the inventory. Several of my commands failed on it before I read the block text. | commands around the laptop interact |
| P3 | minor, check | Dr Kim's hub kept offering "The boardroom code again?" after the code was given; a player can re-ask it forever. This may be intended (re-ask line) but it is a hub entry that never retires. | converse `chose` list ends with six repeats |
| P4 | minor, harness | `mg clickText` cannot take items from the filing cabinet container (`no-control-matching`), and `lock` loops on the key list instead of switching to pick mode. Not a game fault. | commands on the cabinet |
| P5 | note | Picking the cabinet with the override key in hand opened Gary's `on_cabinet_picked` catch even though I held a key, consistent with the walkthrough ("Switch to Lockpicking" skips the LOS gate). | walkthrough step 18 |

No page errors were observed in the commands I read; I did not run the verifier (`verify-run.rb`) before the stop, so the server's own record is not attached. Run `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 5801` first when continuing.

## Handover for the next agent

- Game 5801 is part-played and synced. Resume with `session-start.sh` (url `http://127.0.0.1:3090/break_escape/games/5801`, flags `tools/playtest/m02_ransomed_trust-flags-game5801.xml`, untracked, do not commit) after starting a keyless server on 3090 with `-P` to your own pidfile.
- Helper functions used: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/m02-play/h.sh`. The event hook (`window.__cx`) must be re-installed after a reload.
- Next steps: close Kim's conversation if open; Dr Kim's diary for the boardroom code (0417); talk to Val (claim consultant, then the cover-burn challenge will follow because Gary's card is already given, so `cover_burned` should be true); get past Val by a lanyard or Bernie's vouch; Security Office; Server Room; VM flags 1 to 4 with `<flag:N>`; recovery console (Ghost's offer); Boardroom terminal; Reeves; take the debrief and read the credits.
- Pitfalls seen: `enter` only crosses adjacent rooms; read-note objects often open as a `game-display-dialog` overlay, not a minigame, and need `dismiss "×"` before any move; `converse` stops at unnamed choices, so name an exit (`^I should get on`).

## Continuation (second agent, 2026-11-16): reached the debrief gate, debrief did not start

Completed: **NO (not finished).** Game 5801, same keyless server on 3090 (stopped at the end), session log `scratchpad/m02-play/session-5801b.jsonl`. After a page reload the player respawns in reception and the game clock restarts (19 s at reload), so the times below are a new clock. I did not edit any state.

### Route (real play, no seeding)
1. Reload, walked reception to ward vestibule, approach, ward, ward link, corridor (clock 38 to 49).
2. Val opened the cover-burn challenge on her own at the corridor (no walk-up needed). Showed the contractor lanyard from the handover room; she took it as "could be anybody's", then "Deal". She unlocked the security office. `regain_freedom_of_movement` done.
3. Security office: read Night Rota and CCTV bank, picked up the tray of coffee and drank it from the inventory (item_consumed). Server room door opened by the keycard (the `lock` helper reports lock-never-became-actionable; the interact alone unlocked it). `access_server_room` done at clock 164.
4. Server room: Field Console read; four flags typed at the drop-site from the seeded XML (`<flag:1..4>`): all accepted, rewards fired (restore manifest, entropy cache open). Took key material, manifesto and affiliate note from the cache.
5. Recovery console: first use opened Ghost's video offer; asked for the price, answered "I need time to think". Walked to the safe, PIN 1987 (plaque, Doyle), took the offline keys. Back to the console and chose Combined Recovery (4 hours, nothing paid), confirmed. A Ghost video-link popup showed "End of conversation"; I closed it with `mg close` (clock 479), so I may have skipped a line.
6. Boardroom: door PIN 0417, read proposal, liability email, post log, budget papers, whiteboard. Reeves: named badge SC-4471, heard him out, chose "Quietly. You're under arrest." Press terminal: transmit everything, confirmed. `decide_hospital_exposure` done; `mission_complete` true, `exposed_hospital` true.

### Where it stopped
Only `hear_debrief` is open, plus optional `learn_about_scapegoating`. `mission_complete` is true but `debrief_played` and `debrief_ready` are false and no debrief person-chat opened, about 100 s after the confirm (clock 573 and after), player standing in the boardroom, no minigame. The scenario maps `global_variable_changed:mission_complete` (value true) on `closing_debrief_trigger` to a person-chat. The global was set before or without that mapping firing for me. No "warning before the debrief" appeared either. Not resolved: verify-run shows 26 of 27 tasks completed, 4 flags, score 89.

Candidate cause to check first (not tested): the NPC is `initiallyHidden` and the mapping is `onceOnly`; after my reload the closing_debrief_trigger NPC may not have been loaded in the room when `mission_complete` flipped (NPCs load per room), or the `endingCheck` gate is waiting on a condition. Try: leave the boardroom and re-enter any room, wait, and read `brief` for a dialogue; if still nothing, report it as a blocker (severity high: the mission cannot end) with the globals above.

### Office-life timeline (new clock)
| Clock | Event |
|---|---|
| 326-339 | staff room as I passed: both porters urgent, boiler use started 328/330, `coffee:0`, then the post-burn exchange `night_watch_burned` lines 0 to 2 (334, 339, 344), overheard true, exchange heard at 348 |
| 349-373 | `picture:*` chatter every 3 s, overheard false while I was in the boardroom |
| 378-380 | both `npc_used` (a boiler break took about 50 s, as before) |
| 492-495 | second break: urgent, use started, chatter; `npc_used` at 543 and 545 |

### Problems
| # | Severity | What |
|---|---|---|
| P6 | high, unresolved | Debrief did not start after `mission_complete` (see above). Mission not finished. |
| P7 | minor | After a reload the player respawns at reception and the clock restarts at about 19 s; the old office-life state is not carried (known, intended per the reload note). |
| P8 | minor, harness | `lock` on an already-unlocking RFID door and on an already-open safe returns ok:false though the door/safe opened. `mg chooseIndex` on the phone-chat terminal is 1-based (0 is out of range). |
| P9 | note | Ghost's video call popped up after the Combined Recovery confirm and showed only "End of conversation"; I closed it, which may have cut a closing line. |

Handover: restart a keyless server on 3090, `session-start.sh` for game 5801, re-install the `__cx` hook (command 2 of the log), `bootstrap` with resume, then walk to the boardroom and look for the debrief as above. Then run `verify-run.rb 5801`.

## P6 diagnosis (third agent, 2026-11-16)

**Verdict: not a game bug and not a regression. The debrief was held, not lost.** The "Before the mission ends" warning did fire and was answered "Keep going" by the harness, so the ending sat in the held state the engine designs for that answer. I resumed game 5801 on a keyless server on 3090 and drove only that game. No state was edited or seeded.

### What the live game showed
- After a reload and `bootstrap` with resume: `mission_complete` true, `debrief_played` false, `debrief_ready` false, `awaiting_ambush` false, `insider_confronted` true, and the saved global `__ending_held` present: `{npcId: closing_debrief_trigger, reason: mapping, eventPattern: global_variable_changed:mission_complete, handlerIndex: 0}`.
- `window.endingCheck.hasHeld()` true, `needsAnswer()` true, no overlay on screen, `breakEscapeConfig.endingCheck` true, `missionConcludedAt` null.
- Open optional tasks the player can see: `learn_about_scapegoating` and `investigate_gary_office` (both in the completed aim `access_it_systems`). The objectives panel carried an "End the mission" button.
- Re-entering a room and waiting 60 s did nothing, as designed: a held ending auto-runs only when no optional task is open, and two are. A reload restored the hold (npc-manager `_rebuildHeldMapping`) but does not re-ask.
- Clicking the panel's "End the mission" button ran the held mapping: person-chat opened with the Narrator line "SAFETYNET headquarters. Forty-eight hours after St. Catherine's." (the debrief). So the trigger, the NPC mapping and the ink entry all work.

### Root cause
`closing_debrief_trigger` carries `"endingCheck": true` on its `global_variable_changed:mission_complete` mapping (scenario.json.erb:1513-1520). With optional objectives open, `_handleEventMapping` (public/break_escape/js/systems/npc-manager.js:1389-1405) shows the ending-check overlay first and runs nothing until it is answered. Escape resolves it as "Keep going" (public/break_escape/js/systems/ending-check.js:376-382, Keep going is also the focused default). That answer holds the ending (`__ending_held`) and the debrief opens only from the panel button or once nothing optional is open. In the earlier run:
1. The transmit confirm set `mission_complete`, the overlay opened over the press terminal, and the harness `brief` does not list it (`blockingUi` stays null).
2. The next harness commands (`mg close`, the second close at seq 424) were Escape-style closes, which answered "Keep going". The first close replied `stillOpen: true`, which fits the overlay having taken the key. I cannot prove which command answered it, but the saved `__ending_held` record is only written when the overlay is shown, so it did appear.
3. The session then looked for a debrief and a warning, found neither, and reported a stall.

The earlier hypothesis (NPC not loaded, onceOnly mapping missed) is wrong: the mapping fired, and onceOnly is marked on purpose so the warning does not ask twice (npc-manager.js:1389-1395).

### Regression check
`git diff main...HEAD` shows no change to ending-check.js, npc-manager.js, the music events or the closing_debrief_trigger mapping on this branch. The optional tasks are unchanged from main. The same sequence on main gives the same result. Not a regression.

### Smallest fix (harness and docs, nothing in the game)
1. In the playtest harness `brief`, report the ending overlay as `blockingUi` (it already has an `endingOverlay` command at playtest-session.js:586), and make `mg close` refuse or warn while `#ending-check-overlay` exists, so Escape cannot answer it silently.
2. In the m02 playthrough route, after the press terminal confirm run `{"cmd":"endingOverlay"}`, then `{"cmd":"endingOverlay","action":"end"}` (or finish the two optional tasks).
3. Optional game polish (not needed): none. The hold, the panel button and the reload restore all behaved as written.

Header correction for the earlier sections: P6 is closed as a harness mishap; the mission's debrief reaches the player.
