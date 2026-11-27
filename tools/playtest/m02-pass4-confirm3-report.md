# m02 Ransomed Trust: pass 4 round 3 confirmation playtest (C1-C5)

Question answered: plumbing + unexpected behaviour (round-3 design fixes and the latest engine fixes). Not a solvability pass: standalone, no VM, flags 1-4 come from the session flags XML (exercised, not earned).
Script: scenarios/m02_ransomed_trust/PASS4_PLAYTEST.md "Round 3 confirmation run" C1-C5, plus checks 6 and 7 from the task. Keyless server :3001, headless (load average 4 to 18, varying). Briefing driven by hand.
Scratch: scratchpad/m02-confirm3/.

## Games and logs

- Game 1437 (verify: tools/playtest/m02-confirm3-verify-1437.txt, log tools/playtest/m02-confirm3-1437-session.jsonl): C3, C4, check 6, Bed 4 reach (north, west, south), dash check. Fresh game, no Bernie sign-in, IT door picked.

## Step log (written as I go)

### Game 1437

**C3 Val met, then challenged: PASS.** Met Val before the burn (consultant line; `val_met` set), picked the IT door, Gary gave the card (burn), walked back to the corridor. Challenge opened unprompted: "Stay where you are." / "Control have just been on..." / "So whatever you told me an hour ago – start again." Not "Whoever you are". Options: "Somebody phoned that in..." / "Then we're doing this the hard way."

**C4 First catch visible on a real click: PASS.** After the challenge ("I'll get you something"), I stood at the Security Office door (-119,-285) and sent a real `pressKey e` the moment the in-page LOS gate was true (Val walking west at x -12). Drain shows exactly ONE `door_unlock_attempt`, then `val_caught_picking` set about 0.4 s later, then the scene "WHOA. Whoa whoa whoa. Away from the door." / "What in God's name have you got in your hands?" (screenshot c4-catch.png). No lockpicking minigame opened for this press. An earlier `e` press (gate true by sample, but Val had moved on) did open the lockpicking minigame and no catch; that is the legitimate out-of-cone case (one door_unlock_attempt, no val_caught_picking). The harness had no key in hand (Lock Pick Kit only).
After the reply the next menu opened with "Same question as before, and I'm still waiting on an answer." (repeat shorter).

**Check 6 reopening a person-chat in the same session: PASS.** Bernie: started the chat, chose one branch, ended the conversation mid-way, clicked her again: the box shows "Eleven years I've done this desk..." with the Bernie portrait (screenshot c6-reopen-bernie.png). Not blank. Mr Pryce (end, reopen) also showed a line ("His eyes track to you...", "*eyes open* ...still here.").
Observation: HaX toasts sit on the left over the bottom-left of the dialogue box and cover the start of the speaker name in the person-chat (see the screenshot).

**Check 7 dashes: PASS so far.** Briefing, Val, Gary and HaX toasts all show " – " (en dash with spaces), e.g. "Failing that – ask me your questions.", "Nobody can badge you through anything – the access control server...". No " -- " seen in any line read in game 1437.

**C1 Bed 4 reach, geometry only (no countdown yet): PASS.**
- North: `moveToNear patient_bed4` stops at (262,-97), plain distance 36.1 (as before), but `interact patient_bed4` (a real canvas click on the bed) now opens "Mr Pryce" directly (mode direct, no menu). A real `pressKey e` from the same spot also opens Mr Pryce's chat, not the ventilator panel.
- West side (228,-96): `interact` opens Mr Pryce. 
- Foot (south), reached by walking left/down/right to (261,9): `interact` approached and opened Mr Pryce.
- Before the countdown the chat is the plain "...still here." / paper chart / "I'll let you rest" hub.

### Game 1438 (full route, Ghost accepted, offline keys planned)

Route so far: honest Bernie (earned key and trust), plaque read (1987), Kim talk (boardroom code 0417 by asking her), Gary (card, then "Is there anything reused" for the sticky-note passwords), burn, corridor challenge, Bernie vouch, reload in the Security Office, server room, flags 1-4 (session flags), Ghost's deal accepted at the console.

**Check 6 and dashes after the reload:** after the reload the title screen needs a click on `.title-screen-container` (bootstrap not used), then a "Mission Brief" notes page opens and needs "Continue". That page, the Night Rota object and the console tile status lines still use " -- " (two hyphens): "consultant -- which buys you a paper badge", "SECURITY -- NIGHT ROTA, THIS WEEK", "30 MINUTES -- IF YOU PAY", "UNDER AN HOUR -- GHOST KEEPS A WAY IN". Dialogue, HaX texts and the Ghost chat use " – ".

**C3 variant (never met Val, Bernie trusted):** challenge opens with "So. Whoever you are – start talking." and offers "Ring Bernie..."; that is the expected line for a player who has not met her. Ring Bernie set `bernie_vouched`, `cover_restored`, `val_opened_office`; the office opens with no key or pick.

**C5 Ghost tile status: PASS.** Console tile reads "Ghost's Keys (Free, On Ghost's Terms)" with the status "UNDER AN HOUR -- GHOST KEEPS A WAY IN" before it is selected (screenshot console1.png). No toast was on screen while the console was open at that point (none due); I will recheck at the confirm.

**C5 naming: PASS.** HaX hub after flag 4 (11 buttons) has "I know whose badge SC-4471 is."; the names are Val, Gary, Graham Reeves, Dr Kim, "I'm not sure yet." Each name (all four tried) answers "<name>. Show me how you got there." with the reason options "They're on nobody's rota." / "They had the access and the motive." / "I'll come back with proof." Wrong reason gets pushback ("So did half the building tonight. What ties that badge to one person?", "That makes him odd. It doesn't make him SC-4471..." for Reeves). The duty-sheet reason is not offered before the post log (I had not read it). `insider_identified` not set.
**Press terminal before flag 4:** opened from the boardroom: contact list "Messages / Hospital Comms Terminal", then ">>> OUTGOING RELAY LOCKED <<<" with only "Step away from the terminal." Reeves before flag 4: two options ("What are you guarding in here, and why no uniform?", "Nothing for now.").

### Game 1438 (continued): Bed 4, terminal, naming, ending

**C1 Raval's save: PASS (game 1438).** Offline keys chosen (Ghost's deal accepted earlier but not used). Console confirm: countdown "BED 4 - CRITICAL 01:36" shown, barks from Ms Chen / Mr Pryce / Raval / Doyle. I walked server room to ward (about 40 s). Raval stood at the bedside (309,-53). `interact roaming_ward_nurse` raised the disambiguation menu (Raval / bed; chose Raval), then "Nurse Raval: *at Bed 4, working the circuit* He's fighting the vent. The bag's on the frame and I need both hands." Choice "Give me the bag. I'll breathe for him." set `bed4_manually_stabilised`, `patient_bed4_state=attended`, and the countdown HUD went away (screenshot bed4-saved.png). HaX's "That was you ... the boardroom has the hospital communications terminal" text arrived. Debrief: "you bagged him by hand until a nurse could take the bag off you"; credits PATIENT DEATHS: 6 (Pryce survives, so six others).
Note: the Raval click menu entry reads "Nurse RavalA second nurse moving bed to bed on manual obs rounds -- she hasn't noticed you yet." (name and description run together, stale "hasn't noticed you yet", " -- ").

**C1 Mr Pryce directly, from the north, distressed (game 1440, state set from the console so exercised, not earned):** set `patient_bed4_state=distressed` and `slow_path_window_open`, walked to (267,-97) (north of the bed, plain distance about 36). A real `pressKey e` opened Mr Pryce's chat ("The ventilator alarm is going..."), not the ventilator panel. Options "Switch to manual ventilation - bag him myself." / "Shout down the ward...". Choosing the first set `bed4_manually_stabilised`. So Mr Pryce can be saved before the countdown ends, from the north. (In game 1437, healthy state: north click via `interact`, west side and foot all open him; see above.)
Not tried: a mouse click on the bed from the north in the distressed state (the E key and the healthy-state click both work).

**C2 Press terminal after flag 4: PASS.** Opened in the boardroom before flag 4 (locked screen, "Step away"), submitted flag 4, chose the restore at the console (offline keys), came back and opened the terminal once: the contact preview still reads "Finish working the backup server. Recove..." but the opened thread shows the decision text and the three options ("I'm transmitting everything...", "I'm leaving this undisclosed...", "I'll step away...") on the first reopen. Cosmetic: the thread replays the old RELAY LOCKED text (twice) above the new menu, and a stepped-away option repeats as a player line on the next reopen.

**C5 Reeves before the post log: PASS.** After flag 4, Reeves offers three options: "What are you guarding in here, and why no uniform?", "What badge number do you carry on this post?", "Nothing for now." (two before flag 4). Badge question deflects ("the post has a duty log").
**C5 duty-sheet reason: PASS.** After reading the Night Security Post Log, HaX confirms the post with no name; naming Reeves now offers "The boardroom duty sheet puts badge SC-4471 on their post." Choosing it set `insider_identified`; HaX: "Badge SC-4471, the boardroom comms post, a man on nobody's rota..." The debrief and credits name him.

**C5 HaX texts not stacking over the console: NOT CONFIRMED.** The console screenshots (console1.png, console2.png, console3.png) show no toast over the console. I never had a toast arrive while the console was open: the Ghost and HaX texts for the opened safe arrived before I opened it, and the confirm closes the console at once. Toasts stay on screen for a long time (about 5 stacked at the left of the world view in console2.png and bed4-saved.png). Needs a run where a text lands during the open console.

**Ending and credits (MutationObserver on the document watching #bv-cr-label, attached before the terminal):** captured every line: MISSION COMPLETE / RANSOMED TRUST / ST. CATHERINE'S REGIONAL: CLINICAL SYSTEMS RESTORED / PATIENT DEATHS: 6 (ventilator and dialysis complications — extended downtime) / DECISION: RANSOM REFUSED: Offline backup keys used — ENTROPY denied funding / HOSPITAL EXPOSED... / PERSONNEL: OFFLINE BACKUP KEYS RECOVERED / GARY WHITLOCK: Sacked, then rehired when his warnings went public / COVER RE-ESTABLISHED / BERNIE NWOSU: Vouched for the agent when the paperwork vanished / GRAHAM REEVES (badge SC-4471): Named by the agent — picked up by SAFETYNET / GHOST: At large... / ENTROPY: Still operational. Six cells remain. (Credits use " — ", the debrief uses " – ".) Debrief picked up "You shook on Ghost's deal and then never used their keys." and the Bernie and Val lines; `mission_complete` and `debrief_played` set.

### Game 1440 (Bed 4 north, exercised)

See C1 above. Fresh game, briefing by hand, ward only. Globals set from the console (exercised).

## Step table

| # | Check | Result | Game |
| --- | --- | --- | --- |
| 1a | Bed 4 from the north: click the bed, healthy state | PASS (`interact` opens Mr Pryce directly; no menu, the E key also opens him, not the ventilator panel) | 1437 |
| 1b | Bed 4 from the west side and the foot (south) | PASS | 1437 |
| 1c | Bed 4 from the north, distressed, E key, and the save | PASS (exercised via console globals) | 1440 |
| 1d | Raval's new save at the bedside | PASS (menu then "Give me the bag. I'll breathe for him.") | 1438 |
| 2 | Press terminal after flag 4 shows the decision menu on first reopen | PASS (old locked text replayed above it) | 1438 |
| 3 | Met Val before the burn: not "Whoever you are" | PASS ("whatever you told me an hour ago – start again"); never-met player still gets "Whoever you are – start talking" | 1437, 1438 |
| 4 | Val's first catch on a real `e` press | PASS (one `door_unlock_attempt`, catch scene "WHOA...", no lockpicking minigame) | 1437 |
| 5a | Ghost tile status shows the foothold | PASS ("UNDER AN HOUR -- GHOST KEEPS A WAY IN") | 1438 |
| 5b | HaX texts don't overlap the console | NOT CONFIRMED (no toast arrived while the console was open) | 1438 |
| 5c | Every HaX naming option goes through the reason step | PASS (Val, Gary, Reeves, Kim) | 1438 |
| 5d | Reeves has three options before the post log | PASS | 1438 |
| 6 | Reopening a person-chat shows a line | PASS (Bernie, Pryce) | 1437 |
| 7 | Dashes as " – " | PARTIAL: dialogue, HaX, Ghost and terminal text PASS; still " -- " in the Mission Brief note, object texts (Night Rota, Post Log), console tile lines, interaction-menu NPC description | 1437, 1438 |
| R | One reload | PASS (Security Office, 1438: title click, Mission Brief page, respawn in reception, state intact, Val "Still with us, then.") | 1438 |

## Open items and fails (repro)

1. **Check 5b not shown.** See above; needs a toast timed over an open console.
2. **Check 7 residue.** Repro: reload and read the Mission Brief note ("...consultant -- which buys you a paper badge..."); read Night Rota in the Security Office ("SECURITY -- NIGHT ROTA, THIS WEEK", "...every night this week -- and somebody..."); Night Security Post Log ("ST. CATHERINE'S -- NIGHT SECURITY POST ASSIGNMENT", "SHIFT: 22:00 -- 06:00"); console tiles ("30 MINUTES -- IF YOU PAY"); NPC disambiguation menu description for Raval. These are object/UI strings in scenario.json.erb, not ink.
3. **Mission Brief note reappears after every reload** (needs "Continue" before play). Not new; check it is intended.
4. **Terminal thread replays the old locked screen** above the decision menu (cosmetic).
5. **Raval menu entry** runs her name into the description ("Nurse RavalA second nurse...").
6. **HaX toasts sit over the left edge of person-chat dialogue** (cover the start of the speaker name; c6-reopen-bernie.png).
7. Harness notes: `bootstrap` was not used; after a reload the title screen needs a click on `.title-screen-container` through `eval` (pressKey/mg pressKey did nothing). `enter` needs two calls when a door walk-up is needed and fails with `no-known-doorway` for doors whose sprite has gone; `moveTo` + `walk` works. `moveToNear patient_bed4` aims at different sides depending on Raval's position.

## Earned-secrets table (game 1438)

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | item | Bernie, honest sign-in | 1438 step 5 | yes |
| Server Room Keycard | item | Gary ("I need into the server room") | 1438 step 9 | yes |
| Hospital1987 SSH password | not typed (no VM) | Gary's hub "Is there anything reused..." | step 9 | source reached; VM work not possible |
| Boardroom PIN | `0417` | Dr Kim, "What's the code for the boardroom?" | before the door | yes |
| Safe PIN | `1987` | Hospital Founding Plaque (read), "Founded 1987" | before the safe | yes |
| Ghost's deal | decision | Ghost's call at the console | | n/a |
| `hospital_backup_server:flag_1..4` | `<flag:1>`..`<flag:4>` | VM challenge | | **no** (no VM in standalone) |
| Insider identity (Reeves) | HaX naming | Night Rota, Post Log with badge SC-4471 from flag 4 | after the Post Log | yes |
Game 1437 and 1440: nothing secret used beyond Gary's card (1437, earned); 1440 set globals from the console (exercised).

Rows marked "no": flags 1-4 exercised, not earned; everything downstream (manifest, staging cache, badge SC-4471) reached on session-supplied flags.

## verify-run summaries

- 1437: progress recorded, 7 rooms beyond the first, 0 objects unlocked, 0 flags submitted (tools/playtest/m02-confirm3-verify-1437.txt).
- 1438: progress recorded, 12 rooms beyond the first, 2 objects unlocked, 4 flags submitted; `mission_complete`, `debrief_played`, `bed4_manually_stabilised`, `insider_identified`, `ghost_deal_accepted` set (m02-confirm3-verify-1438.txt).
- 1440: progress recorded, 3 rooms beyond the first, 0 objects unlocked, 0 flags submitted; Bed 4 geometry only (m02-confirm3-verify-1440.txt).

Session logs: tools/playtest/m02-confirm3-1437-session.jsonl, -1438-, -1440-.
Assumptions: the "menu" in check 1 is the disambiguation menu, which appeared for Raval but not for the bed; "before the countdown" read as before the countdown ends.
