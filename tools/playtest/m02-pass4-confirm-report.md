# m02 Ransomed Trust: pass 4 round 2 confirmation playtest

Question answered: plumbing + unexpected behaviour (round-2 fixes and this pass's engine fixes). Not a solvability pass: standalone, no VM, flags 1-4 supplied from the session flags XML, so exercised, not earned. Script: scenarios/m02_ransomed_trust/PASS4_PLAYTEST.md, "Round 2 confirmation run" R1-R10. Server :3001 keyless (headless, machine load average about 27). Briefing driven by hand. Scratch: scratchpad/m02-confirm/ (helpers, screenshots, debrief transcripts).

Games / logs (session logs tools/playtest/m02-confirm--session.jsonl, verifier output tools/playtest/m02-confirm-verify-.txt):

- Game 1409: R1, R2, R5, R6, R7, reload in the Security Office (Ghost's keys ending).
- Game 1417: R3, Gary's cabinet catch, no cross-fire into the corridor catch (no key, IT door picked).
- Game 1419: R4 (Bernie vouch from the desk, reload, Val), R8, R9 (offline keys, Bed 4 countdown, reload during it, walk-out ambush, wrong suspect).
- Game 1428: clean first catch by Val (no previous catch), repeat catches.
- Game 1429: R10 (punch Val).

## Earned-secrets table (game 1409)

| Secret                             | Value used             | In-game source                          | Obtained at          | Earned?                                                      |
| ---------------------------------- | ---------------------- | --------------------------------------- | -------------------- | ------------------------------------------------------------ |
| IT Department Override Key         | item                   | Bernie, after the honest log lines      | 1409 briefing/step 1 | yes                                                          |
| Server Room Keycard                | item                   | Gary, "I need into the server room"     | 1409 step 3          | yes                                                          |
| SSH password `Hospital1987`        | not typed (no VM)      | Gary's dialogue                         | 1409 step 3          | source reached, VM work not possible                         |
| Boardroom PIN `0417`               | `0417`                 | Dr Kim's Desk Diary                     | read before the door | yes                                                          |
| `hospital_backup_server:flag_1..4` | `<flag:1>`..`<flag:4>` | VM challenge                            |                      | **no** (no VM in standalone)                                 |
| Ghost's deal                       | decision               | Ghost's call at the console             |                      | n/a                                                          |
| Insider identity (Reeves)          | HaX naming             | Post Log duty sheet + badge from flag 4 | after the Post Log   | yes (the evidence was read before the right reason appeared) |

Rows marked "no": flags 1-4 were exercised, not earned. Everything downstream of them (manifest, staging cache, badge SC-4471) was reached on session-supplied flags.

## Step log

(written as I go)

### Game 1409

**R1 Val dwells before the burn: PASS**

- In-page sampler of Val's sprite x every 200 ms (office_corridor, pre-burn, Bernie trust set). One continuous trace: still at the west end x -64 for about 2.8 s (sampler started mid-dwell), walk east -64 to 77 in about 3.4 s, still at 77 for 4.0 s (6.4-10.4 s), walk west in about 3.4 s, still at -55 for 4.0 s (13.8-17.8 s), then off east again. So dwell about 4 s each end, walk about 3.4 s each way (script says about 3.6), loop about 14.8 s. I saw one and a half loops, not two full ones.
- Val's first line after the consultant choice: "Consultant. Right. ... Bernie's signed you in, has she? Then go and have a word with Dr Kim." Her very first line is "Alright. Stop there a sec." and the Bernie line comes in her answer to the consultant option. Not "signed in properly at reception". PASS.
- Screenshot r1-val-cone.png: cone drawn as a translucent green sector, spills over the corridor walls into the south room (cosmetic, as before).

**R2 Ring Bernie: PASS**

- Bernie honest route, Gary keycard via "I need into the server room" without taking the lanyard gift, walked onto the corridor. `cover_challenge` opened unprompted ("Stay where you are.").
- Options: "Ring Bernie on reception. She signed me in. She'll vouch for me." / "Somebody phoned that in..." / "Then we're doing this the hard way." Chose the first: Val radios, "She's named herself as vouching officer...", "She unlocks the office door and stands aside." `bernie_vouched`, `cover_restored`, `val_opened_office` all set; the office door opens with no key or pick and entry works.
- Note: with `bernie_trusts_player` and a prior Val chat, the challenge's first line was still "So. Whoever you are -- start talking." not "whatever you told me an hour ago". I had spoken to Val before the burn (first_encounter sets `warned_player` in the ink), so by R3's rule the "an hour ago" line was expected. See open items.
- HaX texts at that point: "Bernie's put her name against yours. Val will have heard by now -- ask her to open her office." and "That'll hold. Now -- whoever made that call is still in the building...".

**Reload (mid-mission, in the Security Office): PASS (with the known respawn)**

- Synced, `location.reload()`. Title screen, then bootstrap. Player respawns in reception_lobby (known engine behaviour). Inventory, tasks and globals intact. No briefing or cutscene replay.
- Walked back: office door still open, no new challenge. Talking to Val: "Still with us, then." (friendly return), no first-meeting scene.
- Server room via the keycard (opened first try). One new HaX text on entry: "Server room. The Kali terminal is your attack box..." then the next text at the first flag. No Val scene.

**R5 HaX hub at flag 2: PASS with an order note**

- Buttons at flag 2 after "Understood": Remind me where we are. / Send me a field guide. / "Who pulls a consultant's booking in the middle of a ransomware incident?" / Where do I start? / I need help with encoding and decoding. / I'm good for now. That is 6, under the 10 limit. "Send me a field guide." opens a list (lockpicking, recon, SSH, vulnerability analysis, ProFTPD, privesc, "Not now.").
- Note: the "Who pulls a consultant's booking" story button sits below the field-guide button, not above "Remind me where we are." The script says story items at the top. After Ghost's deal the hub was 9 buttons with the Ghost items first ("I have Ghost's decryption keys -- does that change things?", "Can you help me think through the ransom decision?") then Remind me / guide. With the naming button (flag 4) it is 11 buttons, naming first.

**R7 Ghost's keys trade-off: PASS**

- Console click with the manifest: console closed, Ghost's video call opened ("Before you touch that console -- look up."), `ghost_offer_made`. "Nothing from you is free. Name it." then "I accept..." set `ghost_deal_accepted`.
- Console tile reads "Ghost's Keys (Free, On Ghost's Terms) / UNDER AN HOUR -- GHOST'S TERMS". On selection the assessment panel reads "CAUTION: FASTEST -- AND GHOST KEEPS A WAY IN" and "Cost: £0 -- but the keys are Ghost's. Whatever they unlock, Ghost can reach again: the attacker keeps a foothold in this network." So the foothold is named on selection, not on the tile's own status line (screenshot r7-ghost-tile.png). HaX toasts stack over the left of the console in the screenshot and hide part of the tiles.
- HaX hub shows "I have Ghost's decryption keys -- does that change things?" before confirming.
- Used it: about 7 s after CONFIRM the HaX text "Ghost's keys are running the restore, ward first. The other half: the keys are Ghost's, so whatever they decrypt, Ghost can reach again. We'll be weeks getting them out." arrived (after "Restore's running. One more thing...").
- Debrief (deb1409.txt): "One died in the night, and she was critical before any of this started." and "And Ghost is still in that network...". The "not sure" reflection reads "You paid ENTROPY nothing, had the wards back inside the hour, and kept your promise to Ghost. Ghost is still in that network." (transmitted, so it matches).
- Credits: sampled at 8 s intervals, I caught PATIENT DEATHS: 1 (cardiac event before ward monitoring returned), GHOST'S FOOTHOLD, COVER RE-ESTABLISHED, GHOST: At large, ENTROPY. I missed the GHOST'S KEYS and Gary lines in the sampling gaps. `exposed_hospital` true and `gary_protected` unset, so the "Sacked, then rehired..." condition held; not read on screen (see open items).

**R6 Naming needs a reason: PASS**

- Flag 4: HaX gave the badge and "find the duty sheet", no name.
- Reeves before the post log: options were "What exactly are you guarding in here?", "No uniform. Why plainclothes?", "What badge number do you carry on this post?", "Nothing for now." (so not only the badge question). Badge question: "The one security issued me, same as everybody's. Why do you ask? ... the post has a duty log." He deflects.
- HaX names in the order Val, Gary, Graham Reeves, Dr Kim, "I'm not sure yet." Val: pushback "Val's on the security rota every night this week. Ghost's badge sits on a particular post. Who stands it?" (no reason step). Reeves: "Reeves. Show me how you got there." with reasons "He's on nobody's rota." / "He wouldn't sign Bernie's book." / "He's security, and Ghost's badge is a security badge." / "I'll come back with proof." and no duty-sheet reason. Wrong reasons: "So is Val. What ties that badge to him and nobody else?", "That makes him odd. It doesn't make him SC-4471...", "Rude isn't proof."
- After reading the Night Security Post Log (PIN 0417 earned from Kim's diary) the reason "The boardroom duty sheet puts badge SC-4471 on the comms post. That's his post." appeared. Choosing it: "That's how I read it." plus the phone-call line; `insider_identified` set. HaX after the post log: confirms the post, gives no name.
- Not checked on screen: the task "Name badge SC-4471's holder, with your reason..." (open-task list in `brief` is capped); `insider_identified` global confirmed.

### Game 1417 (no key, burned, no lanyard, never spoke to Val)

**R3 Repeats are shorter: PASS**

- Burned, no Bernie, no lanyard, and I never spoke to Val: the challenge speech played in full once, first line "So. Whoever you are -- start talking." Options: "Somebody phoned that in..." / "Then we're doing this the hard way." (no "ring Bernie", correct without `bernie_trusts_player`). First "I'll get you something. Don't go anywhere." -> "I'm stood in a corridor at four in the morning guarding a door. Where am I going?"
- Catch: "Again? Seriously?" / "I gave you the benefit. I don't hand that out twice." (see note on the hidden first catch below). "Then log it. I've got work to do." -> "Oh, I'm logging it." -> "Same question as before, and I'm still waiting on an answer." -> "Somebody phoned that in..." -> "We've done this. A pass, a name on a log, or somebody on a phone. Not a theory." -> "I'll get you something." -> "Still here." All three expected lines seen.
- Hidden first catch (open item): in this game three pick attempts (separate `interact` commands about 0.5-1 s after my in-page LOS sampler read true) opened the pick minigame and no Val scene. I closed the minigame each time. Afterwards `val_caught_picking` was set, and the 4th attempt (the page dispatching the interact in the same task as the gate check) opened "Again? Seriously?". So a catch had run on an earlier attempt without its scene showing, or the scene opened under the pick minigame and my `mg close` dismissed it. I cannot tell which. The same flow in game 1428 (below) caught correctly first time, with the scene on screen, and also with separate pipeline commands on the second catch. Not reproduced; reported as unexplained.

**Corridor catch no longer triggers Gary: PASS**

- Gary's room had been visited and Gary was alive and loaded when Val caught me four times in the corridor. No "Behind you, a chair creaks round" scene (zero hits in the session log), `gary_influence` unchanged at 27, no Gary trigger in `npcManager.triggeredEvents`. Val's scene always won.

**Gary's cabinet catch fires in the IT office: PASS**

- Later in the same game: IT door picked (no key), Gary conscious at (361,-485), `moveTo` (195,-425) so the cabinet is at plain distance 31 (north-side approach stops at 41.8, outside the 32 gather radius, `no-effect-confirmed`), `interact it_filing_cabinet` opened `person-chat`: "Behind you, a chair creaks round. Gary is watching you work the lock." / "That's my filing cabinet." Reply "Sorry. I should have asked first." -> "You should have. ...Third pin sticks. Go on." `gary_influence` 27 -> 32. The next `interact` opened the lockpicking minigame. Once only, as designed.

### Game 1428 (clean first catch)

**First Val catch visible, and repeat catches short: PASS**

- Same set-up as 1417 (IT door picked, Gary's card, burned, challenge, "I'll get you something"), then one page-side pick attempt when the LOS gate turned true (Val walking west at x -11). Result: the full first-catch scene ("You hear her before you see her... WHOA. Whoa whoa whoa. Away from the door. / What in God's name have you got in your hands?"), `val_caught_picking` set, `gary_influence` unchanged. Reply 1 -> "I'll let that go the once..." -> straight into "Same question as before, and I'm still waiting on an answer." (the walk-up narration is not replayed). Second catch through separate pipeline commands: "Again? Seriously?". Both catches used the `lockpick_used_in_view` mapping with cooldown 250.

### Game 1419 (R4, R8, R9)

**R4 Vouched, then reload: PASS**

- Bernie honest, Gary's card (burned), walked onto the corridor (challenge: with `bernie_trusts_player` the options were "Ring Bernie..." first time; after "Ask yourself who benefits" Val's reply screen offered "Then ring Bernie. She'll put her name to me." and "I'll get you something."). Took the second, walked on. Sync + reload landed me in reception (known). Talked to Bernie: hub option "I need you to say that to security control. Out loud, on the record, under your own name." -> `bernie_vouched`, `cover_restored`. HaX: "Bernie's put her name against yours. Val will have heard by now -- ask her to open her office." Reloaded again, walked to the corridor: no challenge. Val: "Control rang back. Bernie Nwosu's put her own name against you, in writing." / "Eleven years and she's never done that for anybody. That'll do me." / "She unlocks the office door and stands aside." Not her first meeting. PASS.
- Harness note: on this reload the resume overlay ("Resume / Restart / New Session / Other sessions" with 34 pages of "Load session #N") was showing. `bootstrap` with `resume:"resume"` dismissed "OTHER SESSIONS" by clicking "Prev" repeatedly and took 6.5 minutes before returning. I clicked "Resume" through a DOM eval (exact text match, one button). The other reload (game 1409) was fine. Do not click anything else in that overlay.

**R8 Bed 4: FAIL from the north; reload part PASS**

- Safe PIN 1987 typed, the offline keys taken (`escrow_safe_opened`, `offline_keys_recovered`). The PIN's in-game source: the Estates Snag List says "STILL SET TO THE HOSPITAL FOUNDING YEAR" (read) and the year is on the reception plaque (not read in this game) so the PIN is exercised, not fully earned.
- Console: refused Ghost first (`ghost_deal_refused`-path, "No deal"), then Offline Backup Keys, CONFIRM. About 3 s later HaX texted the Bed 4 alarm ("The ward's just radioed. Bed 4 is alarming..."). No boardroom text. `slow_path_window_open`, `patient_bed4_state=distressed`, "BED 4 -- CRITICAL" countdown shown (it was at 01:07 about 35 s after the confirm because the reload took that long).
- Reload during the countdown: reload takes you to reception, the countdown continued and was still shown after resume. HaX hub after "Understood": "Bed 4. What do I do?" / "I've made the recovery decision -- what's left?" / "Remind me where we are." ... "Remind me where we are." -> "Bed 4 is alarming and nobody's coming for him. Patient ward, now -- talk to Mr Pryce and bag him by hand." PASS.
- North approach to Bed 4: `moveToNear patient_bed4` stops at (261,-104), plain distance 36.1 (engine distance 20.1), outside the 32 px gather radius; `interact patient_bed4` -> `no-effect-confirmed` (plain 45.6 from the other stop at (265,-130)); `pressKey e` also did nothing. So Bed 4 is still not clickable from the north side (same 36 px as the first report). I did not reach the west side in time: the countdown reached 00:07 while I was trying the west side with `moveTo`, which refused to walk (`keyboard(avoids-click-trigger)`), and then expired (`bed4_critical`, `patient_bed4_state=critical`).
- Consequence in the debrief: "Six people died in that window\... One of the six was the ventilated gentleman in Bed 4. Mr Pryce." Credits PATIENT DEATHS: 6.
- Not tested: the conversation opening from the west side, `bed4_manually_stabilised` and HaX's boardroom pointer (done in the first report, game 1392).

**R9 Walk-out with a reply: PASS (plus wrong suspect)**

- Never named Reeves. Flag 4 had to be submitted first: the press terminal otherwise says ">>> OUTGOING RELAY LOCKED <<< ... Finish working the backup server." (`backdoor_fully_exploited` is the gate).
- Stale terminal (finding): I opened the terminal before flag 4 (locked screen), stepped away, submitted flag 4 in the server room, came back and opened it again: it still showed the locked screen with only "Step away from the terminal." After "Step away" and opening it a second time it showed the decision menu. `backdoor_fully_exploited` was true throughout. Repro in this game; not checked against the earlier games (they opened the terminal only after flag 4).
- Terminal: "I'm leaving this undisclosed" -> "CONFIRM: Do not transmit?" -> "Confirmed. Keep it internal." Scene opened with "You close the terminal without sending anything. Behind you, unhurried, the courteous supervisor steps between you and the door." (the first line is seen if you poll every 200 ms; lines auto-advance about every 5 s), Reeves: "I'm sorry. I can't let you leave here believing that was only careless budgeting." / "Who are you?" / "The man who made sure it happened on schedule. Badge SC-4471..." / "And the telephone call at ten to four..." then three replies: "You won't get far." / "Go for the door." / "Say nothing." `mg close` and the x button leave the scene open (`stillOpen: true`), Escape is refused (`minigame-active`). I chose "You won't get far." -> "I don't need far. I need the next hour..." / "You should have looked harder." / narrator "...by the time you reach the corridor it is empty." Debrief started straight after, uncut.
- Wrong suspect: before the terminal I accused Gary (read the Ransomware Incorporated Proposal for `insider_evidence_partial`, then Gary's "The affiliate who confirmed ENTROPY's timing. Was that you?" -> "You had the access, the knowledge and six months of grievance." -> `accused_wrong_suspect`, Gary hostile and hit me to 70 hp). Debrief: "And you spent your suspicion on the wrong person first. The evidence pointed where he wanted it to." Credits (read from `#bv-credits-overlay` with a MutationObserver): MISSION COMPLETE / PATIENT DEATHS: 6 / RANSOM REFUSED: Offline backup keys used / QUIET RESOLUTION / OFFLINE BACKUP KEYS RECOVERED / GARY WHITLOCK: Scapegoated -- Position lost / COVER RE-ESTABLISHED / BERNIE NWOSU: Vouched for the agent when the paperwork vanished / GRAHAM REEVES (badge SC-4471): Walked out of the boardroom -- no trace / WRONG SUSPECT: The agent accused a member of staff who had done nothing / GHOST: At large / ENTROPY. All expected lines present. The debrief did not offer "Nobody vouched for you" (correct, Bernie vouched).

### Game 1429 (R10)

**R10 Punching Val: PASS for `attacked_guard`; the chat part only partly tested**

- Fresh game, never spoke to Val. Jab mode set with `playerCombat.setInteractionMode("jab")` (console, not the glove icon), faced Val while she dwelt at the east end, `pressKey e`. `attacked_guard` true at once. Afterwards `interact security_guard_patrol` opened no conversation (hostile Val, `player_hp_changed` events only). Val then beat me to 0 hp ("KNOCKED OUT / You have been defeated", screenshot r10.png) before I could try the door pick or the burn, so "no catch or challenge chat afterwards" is confirmed only for direct talking, not for a pick or the burn challenge.

## Step table (R1-R10 plus the priority checks)

| #   | Check                                                                                                                   | Result                                                                                                      | Game       |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| R1  | Val dwells before the burn (about 4 s each end, about 3.4 s walks); first line                                          | PASS (1.5 loops timed, not two)                                                                             | 1409       |
| R2  | "Ring Bernie" in the challenge sets `bernie_vouched`, `cover_restored`, `val_opened_office`                             | PASS                                                                                                        | 1409       |
| R3  | "Again? Seriously?", "Same question as before", "Still here.", "Whoever you are -- start talking." (never met Val)      | PASS (hidden first catch unexplained, see open items)                                                       | 1417, 1428 |
| R4  | Vouch from desk, reload, Val opens the office with the vouch line; HaX text                                             | PASS                                                                                                        | 1419       |
| R5  | HaX hub at flag 2: 6 buttons, single field-guide button, guide list                                                     | PASS; story button sits below Remind/Field guide                                                            | 1409       |
| R6  | Naming needs a reason; duty-sheet reason only after the Post Log; wrong names/reasons pushed back; `insider_identified` | PASS                                                                                                        | 1409       |
| R7  | Ghost keys: foothold named on selection, HaX text about 7 s later, debrief, credits                                     | PASS (credits: GHOST'S FOOTHOLD and PATIENT DEATHS: 1 seen; GHOST'S KEYS and Gary lines missed by sampling) | 1409       |
| R8  | Bed 4 from the north, reload during countdown, "Remind me" gives the Bed 4 line                                         | North approach FAIL (plain 36.1 > 32); reload and HaX line PASS                                             | 1419       |
| R9  | Walk-out ambush: three replies, can't be closed, debrief follows; wrong suspect line and credit                         | PASS                                                                                                        | 1419       |
| R10 | Punch Val: `attacked_guard`, no chat                                                                                    | PASS for flag and for direct talk; pick/burn untested (killed)                                              | 1429       |
| P1  | Gary's cabinet catch fires in the IT office                                                                             | PASS                                                                                                        | 1417       |
| P2  | Security office door pick in Val's view opens Val's scene, not Gary's                                                   | PASS (5 catches in 2 games)                                                                                 | 1417, 1428 |
| P3  | Reload mid-mission                                                                                                      | PASS (respawn in reception) x3                                                                              | 1409, 1419 |

## Fails and open items (repro)

1. **Bed 4 is still not clickable from the north.** Repro: game 1419, in `hospital_ward` `moveToNear patient_bed4` from the north stops at (261,-104): plain distance 36.1 (32 needed), engine distance 20.1; `interact patient_bed4` gives `no-effect-confirmed`; `e` does nothing. Suspect layout: the Bed 4 ventilator panel (278,-67) or the bed sprite blocks the player from getting closer.
2. **Press terminal shows a stale locked screen** after the gate has opened. Repro: open the terminal before flag 4 (shows RELAY LOCKED), step away, submit flag 4, reopen: still RELAY LOCKED with only "Step away from the terminal."; step away and reopen: decision menu. Suspect engine: the object conversation resumes at the knot its pending choices belong to.
3. **Hidden first catch (unexplained).** Repro attempt in game 1417 (see R3): `val_caught_picking` got set without her scene being seen. Game 1428 caught first time with the scene on screen. Suspect timing/race with the pick minigame opening; evidence in `tools/playtest/m02-confirm-1417-session.jsonl` around the first three `interact door:office_corridor->security_office` calls.
4. **R3 expectation vs ink for "an hour ago":** In game 1409 I had met Val (first_encounter, which sets `warned_player`) before the burn, yet the challenge opened with "So. Whoever you are -- start talking." not "So whatever you told me an hour ago -- start again." The line shown is the one the script reserves for never having met her. Possible cause: ink variable `warned_player` not carried into the challenge conversation (not checked further).
5. **R5 order:** "Who pulls a consultant's booking..." and "Where do I start?" sit below the Remind/Field-guide buttons. Not a break; the Ghost, ransom and naming buttons are at the top as intended (hub sizes 6 / 9 / 11).
6. **R7 wording:** the tile's own status line still reads "UNDER AN HOUR -- GHOST'S TERMS"; "FASTEST -- AND GHOST KEEPS A WAY IN" and the foothold sentence appear in the assessment panel when the tile is selected. HaX toasts overlap the left of the console in the screenshot (r7-ghost-tile.png).
7. **R6 detail:** Reeves' hub before the post log has four options (guarding, plainclothes, badge number, nothing), not only the badge question. Val's name has no reason step (direct pushback).
8. **R7 credits not fully read:** the 8 s polling missed the GHOST'S KEYS and Gary lines in game 1409 (conditions held: `ghost_keys_used`, `exposed_hospital`, no `gary_protected`). Game 1419 used a MutationObserver and caught every line.
9. Harness: `bootstrap resume:"resume"` can loop on "Prev" in the resume overlay (see game 1419); `enter` fails with `no-known-doorway` when the door was unlocked before a `room` call listed it (walk through with `moveTo` + `walk` instead); `moveTo` into another room's coordinates can walk you back through a door.

## verify-run summaries

- 1409: progress recorded, 11 rooms beyond the first, 1 object unlocked, 4 flags submitted. Globals include ghost_keys_used, insider_identified, exposed_hospital, mission_complete, bernie_vouched, val_opened_office, debrief_played.
- 1417: progress recorded, 7 rooms beyond the first, 0 objects unlocked, 0 flags submitted (picked IT door, cabinet scene, no VM stages by design). Globals: cover_burned, gave_keycard, val_caught_picking, val_challenged, gary_trusts_player.
- 1419: progress recorded, 12 rooms beyond the first, 2 objects unlocked, 4 flags submitted. Inventory includes Offline Backup Encryption Keys.
- 1428: progress recorded, 7 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
- 1429: progress recorded, 5 rooms beyond the first, 0 objects unlocked, 0 flags submitted (R10 only).

Full output of each is in tools/playtest/m02-confirm-verify-.txt.

## What this run proves and does not

Plumbing and unexpected-behaviour checks only. Flags 1-4 in games 1409 and 1419 were supplied from the session XML (exercised, not earned); the VM stages were not played. Picks used `completeLockpick` (assisted), so pick skill is untested. The 1987 PIN in 1419 was typed after reading the snag list but not the reception plaque (exercised). Boardroom PIN 0417 was read from Kim's diary in both games (earned). No safety check blocked any action.
