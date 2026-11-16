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
