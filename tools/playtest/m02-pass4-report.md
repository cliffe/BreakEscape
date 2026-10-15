# m02 Ransomed Trust: pass 4 playtest report

Question answered: plumbing + unexpected behaviour (pass-4 changes). Not a solvability pass (standalone, no VM; flags 1-4 supplied via session flags, so exercised, not earned).
Script: scenarios/m02_ransomed_trust/PASS4_PLAYTEST.md (steps 1-15). Server :3001 keyless, shared with other playtests running at the same time (page load was slow, ~60 s ready timeout on first game).
Engine fix for "Switch to Lockpicking" LOS gate: PRESENT in the working tree (uncommitted): tool-manager.js `beforeSwitchToPickMode` gate, minigame-starters.js:415, systems/lockpick-catch.js. So step 9 is expected "with fix".
Note: bootstrap auto-picked the briefing choices (choice 1 each), as the brief said it would.

Games / logs:
- Run A: game 1386, log tools/playtest/m02-pass4-A-session.jsonl

## Earned-secrets table
| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key (run A, C) | item | Bernie, dialogue reward after the honest log lines | A step 1, C setup | yes |
| Server Room Keycard | item | Gary Whitlock, "I need into the server room" | A step 3, B step 8 setup, C | yes |
| Wrapped Contractor Lanyard (run A) | item | Night Handover room side table | A step 2 | yes |
| Spare Contractor Lanyard (run B) | item | Gary's option 3 (gift) | B | yes (never used) |
| Security Office Key (run C) | item | Val's drop after `debugKO` | C step 13 | no, KO was assisted (debugKO) |
| SSH password `Hospital1987` | not typed (no VM) | Gary's dialogue ("I'd try the middle one") | A step 3 | source reached; VM work not possible |
| Boardroom PIN `0417` (A, B step 12) | `0417` | Dr. Kim's Desk Diary ("Boardroom keypad 0417") | A step 6, B before step 12 | yes |
| Boardroom PIN `0417` (C) | `0417` | not read in run C | | **no** (exercised) |
| Emergency safe PIN `1987` (B step 11) | `1987` | plaque / snag list not read in that game | | **no** (exercised) |
| `hospital_backup_server:flag_1..4` (A, B, C) | `<flag:1>`..`<flag:4>` | VM challenge | | **no** (no VM in standalone; prerequisite SSH password was obtained in A and B, rest of the chain not possible) |
| Ghost's deal acceptance (A) | choice | Ghost call at console | A step 5 | n/a (decision) |
| Insider identity (A step 6) | Reeves via HaX button | Post Log + badge from flag 4 | A | partly: the Reeves button carries the evidence text, see notes |

Rows marked "no" are exercised, not tested: everything downstream of the flags (the manifest, key material, staging cache, badge SC-4471) was reached with flags supplied by the session, so VM solvability is unproven. The pick steps use `completeLockpick` (assisted), so pick skill is untested. KOs in runs B/C use `debugKO` (assisted) except the patient punch in C, which was a real `e` jab.

## Step log (written as I go)

Harness note: first game (1386) was started headed; the backgrounded Wayland window throttled the game loop to near-standstill (moveTo moved 7 px in 9 s, ready timed out at 60 s). Abandoned (no progress past Bernie). Game 1388 started with `--headless` ran at normal speed. Both games share log m02-pass4-A-session.jsonl (1386 lines first). Server was being used by m03/m04 playtests at the same time.

### Run A (game 1388, headless)

**Step 1 Meet Val before the burn: PASS (with notes)**
- Bernie: chose "Dr. Kim requested emergency incident response... Check your log" then "Leave it exactly as it is" -> Bernie says "you told me the truth when you could've fed me something easier. I've clocked that." Globals after: bernie_gave_key, bernie_trusts_player. IT Department Override Key in inventory. (Earned in-game: the key.)
- Corridor: Val (`security_guard_patrol`) at about (-7,-300), cone drawn as a translucent green circle sector with a facing line (screenshots tools/playtest/m02-pass4-s1-val-cone.png, ...-cone-east.png). Security Office door `office_corridor->security_office` locked `L`. I did not catch her turn points at x 3 / 7.5 tiles by timing this step (not measured here; see step 7/8 for timing).
- Talk: first_encounter -> "Emergency security consultant..." -> Val: "Server room's through my office, and it's card-only. There's one card left in this building that opens it -- Gary's, in IT. Come back with it and I'll open the office for you." Matches the expected pointer to Gary's card.
- Cone spill: the circle sector visibly draws through the corridor walls into the room south of the corridor (the sink/wheelchair room) and into the black void north of the building. It does not reach into the Security Office (office is west of the blue door, beyond the cone's edge when she faces west). Cosmetic, but a player sees a green circle over rooms Val cannot see into.
- Reads badly: Val says "Get yourself signed in properly at reception" although the player was signed in by Bernie (task sign_in_at_reception already complete, trust set). Reads as if Bernie's sign-in did not count. Suggest a `bernie_gave_key`/signed-in branch.

**Step 2 Lanyard before the burn: PASS**
- Picked up Wrapped Contractor Lanyard (`contractor_lanyard`) in staff_room at (-76,-429). `staff_lanyard_obtained` = true, `cover_restored` = false (checked full globals).
- HaX text (phone history, agent_0x99): "Blank contractor pass, real hospital stock, no name on it. ... Hang on to it." No "That'll hold" text arrived (checked last 6 messages after pickup and again after the burn).

**Step 3 Burn lands on the corridor: PASS**
- Gary (IT) conversation: "Seven times. I know. I've read them." -> "It isn't pathetic..." -> "I need into the server room." Gary hands over Server Room Keycard (`gave_keycard`) and reads out three candidate SSH passwords (Emma2018 / Hospital1987 / StCatherines, "try the middle one"). gary_influence 27.
- After leaving the conversation: `cover_burned` set, task `cover_burned_notified` done. HaX text 1 ("Stop. Listen to me carefully. Two minutes ago someone rang St. Catherine's security desk...") and text 2 (names "Val on the main corridor" and "a real staff lanyard, or somebody willing to vouch for you out loud") both arrived.
- Walked staff_room -> office_corridor: Val's `cover_challenge` opened by itself (no click) after about 2 s, opening line "Stay where you are." Choices offered: "Show her the lanyard." / "Somebody phoned that in... Ask yourself who benefits." / "Then we're doing this the hard way." There was NO "ring Bernie" option even though bernie_trusts_player was true (it may be gated on something else; worth confirming it is meant to be hidden here).
- "Show her the lanyard." -> narration "She unlocks the office door and stands aside."; `val_opened_office` and `cover_restored` set. Door entry: `office_corridor->security_office` became unlocked (no key, no pick). Entered security_office: task `regain_freedom_of_movement` ("Get past Val at the security office") complete, `reached_security_office` true.
- Dialogue note: Val calls the pass "blank, no photograph, could have come out of anybody's drawer" and lets you in anyway. Reads fine as a judgement call, the next line ("you come past me on your way out and tell me what you found") sells it.

**Step 4 Reload, then server room: PASS (one thing to look at)**
- Synced, then `location.reload()` while in the Security Office. After reload: no cutscene/briefing replay; only the normal "Mission Brief" Notes popup re-opened (closed it). Inventory, tasks and globals intact (cover_restored, val_opened_office, reached_security_office all still true); phone thread intact (11 messages, "That'll hold" still there).
- **Player respawned in reception_lobby (160,144)**, not the Security Office. Four-room walk back. Same thing m06's pass-4 report saw, so probably the engine's normal reload behaviour, but it contradicts the script's "reload in the Security Office". Not a fail for this mission.
- Walking back: Security Office door `office_corridor->security_office` still unlocked (shut, one `enter` retry opened it). Entering the corridor: Val did not challenge again (no cover_challenge). Val stood at (~32,-299) patrolling normally.
- Server Room: door opened with the Server Room Keycard from inventory on the first `interact` (no extra step), task flow ok. Exactly ONE new HaX text on entry ("Server room. The Kali terminal is your attack box, the drop-site takes the flags. Map the backup server first... Two field guides ready when you want them: recon and network mapping, and SSH access with Hydra. Ask."). Phone thread went 11 -> 12. No Val "Footsteps behind you" scene (expected: she opened the office).
- HaX hub "Got any general advice?" (reached after "Understood") -> "You're in the server room. Map the backup server from the Kali terminal, then get an SSH session with Gary's shared credential. Each flag goes in the drop-site." Server-room branch, not "Gary is your route". PASS.
- Unclear moment: the HaX hub shows "Understood" first, and the advice question only appears after you press it. Fine, but a player who opens HaX after the entry text sees only 3 buttons.

**Step 5 Ghost before the choice: PASS**
- Flags 1-3 submitted at `flag_station_dropsite` with `<flag:1..3>` (EXERCISED, not earned: no VM in standalone; the SSH password Hospital1987 was earned from Gary's dialogue, the rest of the VM chain was not). Ghost phone-chat opened after flag 2 and flag 3 (old behaviour, unchanged). Flag 3 reward: Verified Restore Manifest in inventory; HaX texts about the manifest arrived.
- First console click (`hospital_recovery_console`, `interact` returned ok:false because the console never opened): the person-chat opened with Ghost: "Before you touch that console -- look up." `ghost_offer_made` = true. Video-call narration reads well ("a hooded figure, backlit, the face held in deliberate shadow").
- Chose "Nothing from you is free. Name it." (Ghost asks for the board liability email, the budget docs and Gary's six months of warnings uploaded to the press terminal), then "I accept. I'll upload the evidence. Give me the keys." -> `ghost_deal_accepted` = true, `ghost_deal_refused` = false.
- Reopened console: four tiles. Fourth: "[G] Ghost's Keys (Free, On Ghost's Terms) UNDER AN HOUR -- GHOST'S TERMS", not greyed (classes `backup-recovery-tile`, no `is-unavailable`), selectable. Assessment panel: "CAUTION: A DEAL WITH THE ATTACKER ... Cost: £0 -- the price is the promise you made Ghost to publish the evidence. Prerequisite: the verified restore manifest, and Ghost's offer, accepted." Confirm button enabled. Closed without confirming.
- HaX hub now contains BOTH "I took Ghost's deal -- free keys for publishing the evidence" and "I have Ghost's decryption keys -- does that change things?" (the expected one). The latter gives three HaX lines: "No ransom paid. No ENTROPY funding. Recovery in under an hour." / "The cost is the agreement: publish the evidence at the press terminal." / "Make sure you understand what you're agreeing to before you initiate recovery." 
- Player-experience note: the hub is now 15 buttons long (field guides, ransom decision, offline keys, two Ghost items, advice), so the useful ones sit below the fold. The two Ghost buttons overlap in meaning. Both appear while keys have not yet been used.

**Step 6 Name the insider: PASS (with wording notes)**
- Flag 4 (`<flag:4>`, exercised): HaX texts: "That's the full backdoor chain... their staging cache in the rack has just opened. Ghost's own key material should be in there. Take it." and "Ghost's log names the badge -- #SC-4471 ... Somewhere in this building there's a duty sheet for the post that badge sits on. Find it, then put a name to it." No name given. Tasks `unmask_db_window`, `unmask_ghost_badge` done.
- Earned: Boardroom PIN 0417 read from Dr. Kim's Desk Diary (`dr_kim_office_notes_1`, "Boardroom keypad 0417 (CHANGE THIS)") before using it on the door (lock minigame, `lock code 0417`).
- Boardroom objects read: Conference Table Budget Papers, Board Liability Email (HaX: "That email is damning... Talk to Dr. Kim"), Ransomware Incorporated Proposal (insider_evidence_partial; HaX: "You've got a name in your notes now and a number off their log. The post that badge sits on will have a duty sheet. Go and read it."), then Night Security Post Log -> HaX: "There it is. Badge SC-4471 is the supervisor on this post -- the comms watch in this room... When you're sure of the name, message me -- or say it to his face." Confirms post, no name. PASS.
- Naming via HaX hub "I know whose badge SC-4471 is." -> four buttons: Reeves / Val / Gary / "I'm not sure yet." Val -> pushback "Val's on the rota every night of the week, and she's the one who's been logging the man nobody put on it. The badge belongs to whoever stands the boardroom post." (`insider_identified` still false). Gary -> "Gary's been at his desk in IT since half ten. Ghost's badge is on the boardroom post log. Who stands that post?" (still false). Reeves -> `insider_identified` true, task `unmask_identify` done, HaX: "That's how I read it. Badge SC-4471, the boardroom comms post, a man on nobody's rota -- and the call that pulled your booking came from the internal phone on his post." + "He's still standing next to that terminal. Your call how you handle him." PASS.
- Reads badly / unclear:
  1. The Reeves button is listed first and carries the evidence in its label ("The night supervisor who's stood on the boardroom post all night"). The "you name him" moment is a multiple-choice with the answer written on one option; Val's and Gary's labels are generic. A player who has read the post log will click the first button without thinking about it.
  2. HaX's "You've got a name in your notes now" after the Proposal document: the player has no name for the insider at this point (the Proposal names Ghost/affiliate programme). Reads as if a name was handed over.
  3. HaX's Val pushback mentions "the man nobody put on it" (Val's rota logging), which the player only knows if they asked Val about Reeves. Reads as a reference to something unseen.
  4. HaX phone hub is now 20 buttons long at this point (11 field-guide/advice items plus the story ones). Hard to find "I know whose badge...".
  5. After I clicked "I have Ghost's decryption keys" earlier, reopening the HaX thread later showed a stale follow-up pair ("The keys are real -- Ghost transmitted them" / "I haven't decided what to do with Ghost's deal yet") instead of the hub. Picking the second one gave HaX: "Then decide before you walk into the recovery console. Don't go in uncertain." Not a bug, but the stale node is surprising after fifteen minutes.
- Also seen: Dr. Kim's Patient Status Report text ends with "Reinforces the stakes -- 47 real patients at risk" in the player-facing note (design annotation leaked into in-game text). The paging shows "4 / 4".

**Step 6 (finish): PASS**
- Console: selected Ghost's Keys, CONFIRM -> `ghost_keys_used`, `backup_restore_initiated`; HaX: "Restore's running. One more thing before this is over -- the boardroom has the hospital communications terminal..." (no ransom text).
- Press terminal ("Hospital Communications Terminal", a phone-chat UI): 4 documents listed incl. "Gary Whitlock security advisory archive (May-November 2024, 7 formal warnings)" even though this run never opened Gary's filing cabinet. "I'm transmitting everything" -> "Confirmed. Send it all." -> `mission_complete` true, `awaiting_ambush` false, debrief started immediately.
- Debrief (read in full, branches taken: Derek, cover-burn question, "what it cost", right thing, What happened to Kim/Gary, "Ghost escaped", What's next): has the Ghost's-keys outcome ("And you took Ghost's keys. Free, on Ghost's terms... Two died in the night, both critical before any of this started"), the named-insider outcome ("You identified Ghost's inside asset -- Graham Reeves... SAFETYNET moved on the intel and picked him up"), and Val's notebook line. The cover-burn branch for a restored cover has no "Nobody vouched for you" line (correct for this run).
- Credits (read from `#bv-credits-overlay`): "CLINICAL SYSTEMS RESTORED", "PATIENT DEATHS: 2 (cardiac events during system transition)", "GHOST'S KEYS: Wards restored on the attacker's terms -- no money paid, the evidence promised in return", "HOSPITAL EXPOSED", "GARY WHITLOCK: Scapegoated -- Position lost, career damaged", "COVER RE-ESTABLISHED: Access regained without incident", "GHOST: At large...", "ENTROPY: Still operational. Six cells remain." No COVER BURNED line. Matches the script's expected credits.
- Inconsistency: credits say Gary "Scapegoated -- Position lost, career damaged" while the debrief says he was rehired as IT Security Director after his emails ran. Also the credits have no line for the named/arrested insider although the debrief covers it.
- Debrief reads: after "Eleven words on an internal telephone..." the Reeves-call reference works as intended with the HaX naming nudge.

### Run A verify-run (game 1388) — saved at tools/playtest/m02-pass4-verify-1388.txt
```
game            1388  (mission 46)
created         2026-10-02 02:13:57 UTC
last write      2026-10-02 02:33:55 UTC
played for      1198s of wall clock
current room    "reception_lobby"
unlocked rooms  12: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, it_department, security_office, server_room, dr_kim_office, conference_room
unlocked objs   1: entropy_staging_cache
inventory       9: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Wrapped Contractor Lanyard, Server Room Keycard, Verified Restore Manifest, Patient Status Report, Board Liability Email
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, security_guard_patrol, gary_whitlock, dr_sarah_kim, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_2f81d7}, flag{m02_ransomed_trust_hospital_backup_server_2_65625f}, flag{m02_ransomed_trust_hospital_backup_server_3_482037}, flag{m02_ransomed_trust_hospital_backup_server_4_71acea}
globals set     44: backdoor_fully_exploited, backup_recovery_source, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, board_coverup_email_found, briefing_played, cover_burned, cover_restored, debrief_played, exploitation_guide_offered, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, found_boardroom_code, gary_trusts_player, gave_keycard, ghost_deal_accepted, ghost_keys_used, ghost_offer_made, insider_badge_id_found, insider_db_window_found, insider_evidence_partial, insider_identified, inspected_asset_post, lockpicking_guide_offered, mission_complete, network_isolated, patient_bed2_state, patient_bed4_state, player_name, privesc_guide_offered, ransom_decision_made, ransomware_deployed, reached_security_office, restore_manifest_obtained, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained, val_opened_office, vulnerability_guide_offered, ward_recovering

VERDICT: progress recorded — 11 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Run B (game 1392, headless; log tools/playtest/m02-pass4-B-session.jsonl)

Setup: skipped Bernie (inventory: Notepad, Phone, Lock Pick Kit only, no `key`). Picked the IT door via the lockpicking minigame (`completeLockpick`, PASS assisted).

**Step 15 Gary's cabinet catch: FAIL (suspect engine, evidence below)**
- No key held, Gary conscious at (361,-485) in the same room, player at (201,-425) next to `it_filing_cabinet`. `interact` opened the lockpicking minigame straight away. No `on_cabinet_picked` conversation, `gary_influence` unchanged (0).
- Rule-outs: (1) in range, engineDistance 24.6 < 32; (2) minigame did open (so a real click); (3) one earlier pair of `interact` calls from out of range produced `no-effect-confirmed`, no events in the drain log, no Gary trigger in `npcManager.triggeredEvents`, so the once-only mapping was not consumed earlier.
- Evidence it is the gate's room id: `lockpick-catch.js` uses `lockable?.doorProperties?.roomId || window.currentRoomId`. For a cabinet there is no `doorProperties`, and in this page `window.currentRoomId` is `undefined` (the live room is in `window.currentPlayerRoom` = "it_department"). `catchLockpickInView` returns null on `!roomId`. Calling `window.npcManager.shouldInterruptLockpickingWithPersonChat("it_department", {x:player.x,y:player.y})` by hand returns `gary_whitlock`, so LOS/mapping/once-only conditions would all allow the catch. The same applies to any non-door lock (cabinets, safes, cases), so Gary's `on_cabinet_picked` cannot fire as built. (Doors work because they carry `doorProperties.roomId`: step 8 below.)
- Repro: new game, skip Bernie, pick the IT door, walk into IT, `moveToNear it_filing_cabinet` (approach from the south, y about -425, the north side stops 44px short), `interact` -> lockpicking minigame, no conversation.

**Step 8 Caught picking, no key: PASS for the catch itself, FAIL for a side effect (Gary's cabinet scene fires in the corridor)**
Setup: Gary talk (card + lanyard from his option 3 "Someone's phoned security and pulled my booking...": he gives a "Spare Contractor Lanyard", so the player ends up holding one; this run never used it). `cover_burned` set. Walked into the corridor: `cover_challenge` opened by itself ("Stay where you are."). Chose "Ask yourself who benefits" -> Val: "Give me something I can hold. A pass. A name on a log..." -> "I'll get you something. Don't go anywhere." (`cover_restored` stayed false, `val_opened_office` false). Note "whatever you told me an hour ago -- start again" reads oddly here, the player never spoke to Val in this game.
- Timing method: in-page sampler (tools/playtest/ ... scratchpad val.js) reading Val's sprite x every 100 ms and the engine's own gate `npcManager.shouldInterruptLockpickingWithPersonChat('office_corridor', playerPos)` with the player standing at the door (-119,-310); the interact is fired from the page at the chosen instant (about 390 ms from trigger to the minigame/chat opening).
- **Before the burn Val does not dwell at all.** Sprite x oscillates between about -48 (W1) and +70 (W2) at about 40 px/s, turning round immediately, period about 5.9 s (config says 4 s dwells at x 3 and 7.5 tiles = world -64 / 80). The gate said SEEN only on the west leg between x of about -15 and -47 (0.9 s of each 5.9 s loop, ~15%). `patrolTarget` was `{x:84,y:-268,dwellTime:4000}` and `pathFollowingActive` was true. Not examined further. (Step 1/Run A: she also looked continuously in motion.)
- **After the burn she does dwell**: W1 about x=-55, 1.6 s still, W2 about x=79, 1.8 s still, speed about 62. Loop about 7.8 s. SEEN from x=-10 on the west leg through the W1 dwell until she sets off east: about 2.6 s per loop (t=3.3 to 5.8 s). Safe about 4.7 s (east leg + W2 dwell + first part of west leg). That matches the script's "4.7 s safe, 2.6 s seen after".
- Attempt 1 (Val dwelling at x=-54.7, facing west, gate true): the engine opened **Gary's `on_cabinet_picked` person-chat** ("Behind you, a chair creaks round. Gary is watching you work the lock." / "That's my filing cabinet.") in the corridor, with Gary's corridor background (screenshot tools/playtest/m02-pass4-gary-in-corridor.png). `val_caught_picking` was set, but Val's own `on_lockpick_used` conversation did NOT open: Gary's replaced it. After "Sorry. I should have asked first." -> "You should have. ...Third pin sticks. Go on." the conversation ended and no Val scene followed. `gary_influence` moved (to 37). Cause (suspect engine/scenario): `lockpick_used_in_view` is a global event and Gary's mapping (los range 400, 360 deg, onceOnly) has no npc or room filter, so any pick anywhere fires it once. The same event does not reach Gary for the cabinet itself (step 15). Repro: no key held, Gary still in IT, burned, pick the Security Office door while Val dwells at W1.
- Attempt 2 (Val at x=-52.8, dwelling, 14 s later): Val's `on_lockpick_used` opened: "You hear her before you see her. The torch beam arrives about a second before she does." / "WHOA. Whoa whoa whoa. Away from the door." / "What in God's name have you got in your hands?" Choices: Reception key... / Every second on that door... / Dropped something... / Turn round and walk away. After "Reception key's not working on this one. I'm improvising." -> two Val lines -> straight into "Control have just been on. There is no external consultant booked... So whatever you told me an hour ago -- start again." with the same three options. The walk-up narration was NOT replayed after the catch. PASS.
- Attempt 3 (Val at x=-53.9, dwelling, about 25 s after attempt 2): caught again, same scene. Cooldown is not holding the pick off. PASS. The "You hear her before you see her..." narration replays on every catch, and the "Control have just been on" speech replays on every catch too (3 times in a row on the same burn). Reads repetitive.
- During the dwell Val stands at W1, facing the door; she is not at the door (about 90 px east of it); the player is at (-119,-310).

**Step 7 Blind-spot pick, no key: PASS**
- Fired the pick when Val was walking east at x=-28 (gate false before the call). The lockpicking minigame opened (no conversation). `completeLockpick` (PASS assisted, assisted lockpick only; pick skill not tested). Door opened, entered `security_office`: task `regain_freedom_of_movement` complete, `reached_security_office` true, `cover_restored` false (credits check not done in this game, see step 12).
- I did not test "picking at the exact end of the safe window" or whether Val can interrupt a pick already in progress (the harness's completeLockpick is instant).

**Step 10 After-the-fact catch: PASS**
- Server room first entry after picking in (no `val_opened_office`): person-chat "Footsteps behind you. Val has followed you in through her own office, and she does not look pleased about the state of her door." -> "Hang on -- server room's authorised IT personnel only. That's not a badge thing, that's a rule thing." Choices: Gary's card and blessing / come in with me and watch / say nothing. Chose the first: "Go on. I'm logging it with your description and the time." Plays once on that entry. HaX text on entry: one orientation text (same as run A) preceded by an extra "Blank contractor pass, real hospital stock -- however you came by it. If anybody on the corridor asks what you are, that's the thing to show them." (lanyard pickup text, fired late because it was a Gary gift).

**Step 11 Bed 4 slow path: PASS (two route notes)**
- Flags 1-3 submitted with session flags (exercised). Console first use -> Ghost's call; chose "Nothing from you is free. Name it." then "No deal. We don't negotiate with ENTROPY." -> Ghost: "Noted. Then you'll do it the long way..." `ghost_deal_refused` true. After refusing, the console's Ghost's Keys tile is greyed (`is-unavailable`), as expected.
- Escrow keys: Emergency Storage safe, PIN 1987 typed WITHOUT having read the plaque or the snag list in this game (exercised, not earned). Took "Offline Backup Encryption Keys" (opens a viewer on top of the container; two closes needed). `offline_keys_recovered` true. HaX text about the escrow keys arrived ("twelve hours on their own, four if you can pair them...").
- Console: manifest [x], escrow keys [x], ENTROPY key material [ ]. Selected Offline Backup Keys (Physical Safe), CONFIRM. HaX text (`Date` stamps): confirm at 1790909498.8 s, text at 1790909501.7 s = about 2.9 s later: "The ward's just radioed. Bed 4 is alarming -- Mr Pryce's ventilator has gone out of sync, there's no relay to the desk, and the nurses are pinned at Bed 2. Twelve hours of restore means nobody's coming for him. You're the nearest pair of hands. Get to the ward. Now." No boardroom text at that point. Also barks from Doyle, Raval, Ms Chen and Mr Pryce at the same moment (five toasts stacked, tools/playtest/m02-pass4-bed4-countdown.png). A "BED 4 -- CRITICAL" timer appeared top-centre at 01:23 about 15 s after the confirm (the countdown starts at roughly 1:40; 52 s left when I reached the ward, i.e. ~48 s of walking with `run`). Tight but fair from the server room; a player who stops to read the toasts could miss it.
- Bagging: `patient_bed4` could NOT be clicked from the north side: the player stops at (260,-98), 36 px plain from the bed (gather radius 32), `interact` reports `no-effect-confirmed` (engineDistance 20 < 32). `hospital_ward_notes_1` (278,-67) is next to the bed. Approaching from the west (player at (232,-62)) worked. Lost about 20 s of the countdown finding this. Suspect layout/collision, not a script error. Repro: from the ward's west door walk straight down column x=260 to the bed.
- Conversation: "Switch to manual ventilation -- bag him myself." -> `bed4_manually_stabilised` true, `patient_bed4_state=attended`. HaX boardroom pointer arrived about 1 s after the scene closed (1790909606.6 s vs scene end 1790909605.7 s); the `bed4_manually_stabilised` global was set during the scene, so the delay from the global is a few seconds: consistent with ~4 s. Text: "The ward says he's breathing and a nurse has the bag. That was you. When you're ready -- the boardroom has the hospital communications terminal, and what goes out on it is your call." PASS.

**Step 12 The ambush (never named): PASS (first narration line not observed on screen)**
- Flag 4 (exercised), Boardroom PIN 0417 read from Kim's Desk Diary first (earned in this game), HaX's naming nudges deliberately not followed (no post log read, no naming). Press terminal: "I'm leaving this undisclosed" -> "CONFIRM: Do not transmit?" text types out -> "Confirmed. Keep it internal."
- Right after the confirm: `awaiting_ambush` = true, `insider_ambushed` = true, `mission_complete` = false. Reeves' scene: first line I could read was "I'm sorry. I can't let you leave here believing that was only careless budgeting." The scene auto-advances between my polls, so I did NOT see the opening Narrator line "You close the terminal without sending anything..." on screen (it is in `m02_npc_asset.ink:339`). Then: "Who are you?" / "The man who made sure it happened on schedule. Badge SC-4471. A fire drill six weeks ago..." / "...the telephone call at ten to four..." / "You should have looked harder." / "...He is already through the door, and by the time you reach the corridor it is empty." No fight. `insider_asset_escaped` and `mission_complete` set as the scene closed.
- Debrief started right after, ran in full, not cut off. Items seen: "I never did get it back. I worked the rest of that night as a trespasser." choice present; "Six people died in that window"; "It would have been seven. The ventilated man in Bed 4 -- Mr Pryce -- ... you bagged him by hand"; "Nobody vouched for you. You finished that job as an unidentified man in a hospital corridor"; "Val Okonkwo's incident log has you in it, crouched at her office door with a pick set"; "Graham Reeves ... When you closed the terminal, he told you who he was and walked out."
- Credits: "PATIENT DEATHS: 6 (ventilator and dialysis complications -- extended downtime)", "RANSOM REFUSED: Offline backup keys used", "QUIET RESOLUTION", "GARY WHITLOCK: Scapegoated", "COVER BURNED: Booking pulled from the visitor system mid-operation", "SECURITY OFFICER V. OKONKWO: Caught the agent picking a lock -- logged it", "GRAHAM REEVES (badge SC-4471): Walked out of the boardroom -- no trace", "GHOST: At large...". All four expected items present.
- Debrief reads: the walkthrough of the offline path says Mr Pryce "bagged by hand until a nurse could take the bag off you"; consistent with the scene. One slip in the keep-quiet branch: "Gary Whitlock... fired quietly" and credits say "Scapegoated: Position lost", consistent in this branch (unlike run A where the debrief said he was rehired but the credits said position lost).

### Run B verify-run (game 1392) — tools/playtest/m02-pass4-verify-1392.txt
```
game            1392  (mission 46)
created         2026-10-02 02:36:01 UTC
last write      2026-10-02 02:58:41 UTC
played for      1360s of wall clock
current room    "reception_lobby"
unlocked rooms  13: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, it_department, security_office, server_room, emergency_equipment_storage, dr_kim_office, conference_room
unlocked objs   2: emergency_storage_safe, entropy_staging_cache
inventory       7: Your Phone, Lock Pick Kit, Notepad, Server Room Keycard, Spare Contractor Lanyard, Verified Restore Manifest, Offline Backup Encryption Keys
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, security_guard_patrol, gary_whitlock, dr_sarah_kim, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_ebef14}, flag{m02_ransomed_trust_hospital_backup_server_2_b89a9b}, flag{m02_ransomed_trust_hospital_backup_server_3_7e2af2}, flag{m02_ransomed_trust_hospital_backup_server_4_9c4fde}
globals set     44: awaiting_ambush, backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bed4_critical, bed4_manually_stabilised, briefing_played, cover_burned, debrief_played, escrow_safe_opened, exploitation_guide_offered, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, found_boardroom_code, gary_trusts_player, gave_keycard, ghost_deal_refused, ghost_offer_made, insider_ambushed, insider_asset_escaped, insider_badge_id_found, insider_confronted, insider_db_window_found, lockpicking_guide_offered, mission_complete, network_isolated, offline_keys_recovered, patient_bed2_state, patient_bed4_state, player_name, privesc_guide_offered, ransom_decision_made, ransomware_deployed, reached_security_office, restore_manifest_obtained, scanning_guide_offered, slow_path_window_open, ssh_guide_offered, staff_lanyard_obtained, val_caught_picking, vulnerability_guide_offered

VERDICT: progress recorded — 12 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Run C (game 1398, headless; log tools/playtest/m02-pass4-C-session.jsonl)

Setup: Bernie "honest" route as in run A, so inventory has the IT Department Override Key.

**Step 9 Caught picking with the IT key in inventory: PASS (engine fix is in the tree, so this is the "with fix" result)**
- Engine fix present (uncommitted): `tool-manager.js` `switchToPickMode` calls `params.beforeSwitchToPickMode`, wired in `minigame-starters.js:415` to `catchLockpickInView`.
- Test: `interact` on the Security Office door opens the key-selection minigame (lockpicking, `keyMode:true`, one key: IT Department Override Key). Clicked "Switch to Lockpicking" (dispatched in-page the instant the engine's own gate returned true, Val at x=-54 at the west end). Result: the key minigame closed and Val's `on_lockpick_used` person-chat opened: "You hear her before you see her. The torch beam arrives about a second before she does." / "WHOA. Whoa whoa whoa. Away from the door." / "What in God's name have you got in your hands?" `val_caught_picking` true. No pick minigame.
- Control: second attempt with the gate false (Val at x=-55 but just turned east): "Switch to Lockpicking" switched to pick mode normally (`keyMode:false`, no chat). So the gate is not over-blocking.
- The IT key does not open the security office: selected it and clicked the key target; the minigame stayed on "Inserting key..." with no unlock; door still `L` (locked) afterwards.
- Note: here Gary's `on_cabinet_picked` did NOT cross-fire (Gary's room had not been visited, so his mapping was not loaded). That supports the step-8 diagnosis in run B (loaded NPCs with a `lockpick_used_in_view` mapping all react).
- Pre-burn Val branch after the catch: "...I'll let that go the once. But not in my office and not where I can see you." then a hub (What have you been told / anyone who shouldn't be / I'll let you get on).

**Step 13 KO Val: PASS (assisted, `debugKO`, combat not played)**
- Game 1398, burned, no lanyard held. Corridor `cover_challenge` opened by itself with an extra narrator beat ("She is not ambling any more. She crosses the corridor at a pace that closes the distance before you have decided what to do with it, and plants herself squarely between you and her office...") and only TWO options without a lanyard ("Somebody phoned that in..." / "Then we're doing this the hard way"); after "Ask yourself who benefits" her only reply option was "I'll get you something. Don't go anywhere." There was no "ring Bernie" option although `bernie_trusts_player` was true (also absent in run A and B), so that route is not discoverable as played; the script mentions it for `cover_challenge`.
- `debugKO security_guard_patrol` (peaceful NPC converted to hostile, `guard_knocked_out` true; `attacked_guard` stayed FALSE, which is what a debug KO would leave but means the "attacking her sets attacked_guard" path was not tested). HaX text: "You've put a hospital security officer on the floor. That solves your corridor problem and creates about four others. Her office key will be on her. Move fast -- when she's found, this building locks down." Dropped: Security Office Key (`dropped_security_guard_patrol_...`) and `val_notebook`. Picking up the key merges IT key + Security Office Key into a "Key Ring"; the door's key selection then lists both keys; selecting "Security Office Key" opened it. `reached_security_office` true, task `regain_freedom_of_movement` done, `cover_restored` false.
- Credits: "SECURITY OFFICER V. OKONKWO: Neutralised on shift", "COVER BURNED: Booking pulled from the visitor system mid-operation", no COVER RE-ESTABLISHED. Debrief: "Val Okonkwo, security officer, north corridor. Concussion, four days off, and a written statement that she was assaulted by an intruder. She'd spent eight weeks logging Graham Reeves and getting told to drop it. She was the closest thing you had to an ally in that building and you put her on the floor." (The player never learned about Val logging Reeves in this game.)

**Step 14 Raval and a patient: PASS (Raval assisted, patient by a real punch)**
- `debugKO roaming_ward_nurse` (Nurse Raval, peaceful, converted): `raval_ko` true, `ward_nurse_ko` false (Sister Doyle's barks therefore not disabled by this logic; I did not see a Doyle bark in the ~20 s I watched, so "Doyle's barks still work" is NOT observed, only the globals).
- `debugKO patient_bed5` (Ms Chen): `patient_bed5_ko` true but `patient_assaulted` stayed false and HaX sent nothing: `debugKO` bypasses `npc_attacked:*`, which `player-combat.js:316` only emits on a real punch. So I made a REAL punch instead: set jab mode with `playerCombat.setInteractionMode("jab")` (console, not the UI glove icon), faced Mrs Hargreaves (`patient_bed2`) and pressed `e`. `patient_assaulted` true; HaX once: "What are you doing? That is a patient in a hospital bed. Whatever you think you saw, stop. Now." Not checked: a second punch (to confirm it fires once only).
- Finished from the console quickly (EXERCISED: flags 1-4, Ransom Payment, Boardroom PIN 0417 typed without reading the diary in this game). Press terminal: transmit; insider never named, so `awaiting_ambush` true then Reeves' walk-out, then debrief. Opening narration lines of the ambush again advanced before I could read them.
- Debrief (read): "Nobody vouched for you...", "Nurse Raval, on manual obs rounds. You put her down between the beds, and six patients went longer than fifteen minutes without anybody checking them.", "And you struck a patient. In a hospital bed, on a ward running on paper. I've read the statement from the bed opposite. I'm not going to read it out to you.", Val line above. Credits: "RANSOM PAID: GBP150,000 to Ransomware Incorporated -- ENTROPY funded", "WARD STAFF: Nurse assaulted mid-shift", "PATIENT ASSAULTED: A ward patient struck by the agent", "SECURITY OFFICER V. OKONKWO: Neutralised on shift", "COVER BURNED", "GRAHAM REEVES: Walked out of the boardroom". Credits show PATIENT DEATHS: 2 although the ward was knocked about; consistent with the ransom path.

### Run C verify-run (game 1398) — tools/playtest/m02-pass4-verify-1398.txt
```
game            1398  (mission 46)
created         2026-10-02 03:00:20 UTC
last write      2026-10-02 03:12:00 UTC
played for      699s of wall clock
current room    "reception_lobby"
unlocked rooms  11: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, it_department, security_office, server_room, conference_room
unlocked objs   1: entropy_staging_cache
inventory       8: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Server Room Keycard, Security Office Key, Val's Pocket Notebook, Verified Restore Manifest
NPCs met        16: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, security_guard_patrol, gary_whitlock, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_46d5bd}, flag{m02_ransomed_trust_hospital_backup_server_2_a44b88}, flag{m02_ransomed_trust_hospital_backup_server_3_ffe9b6}, flag{m02_ransomed_trust_hospital_backup_server_4_b85943}
globals set     46: awaiting_ambush, backdoor_fully_exploited, backup_recovery_source, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, debrief_played, exploitation_guide_offered, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, gary_trusts_player, gave_keycard, ghost_deal_refused, ghost_offer_made, guard_knocked_out, insider_ambushed, insider_asset_escaped, insider_badge_id_found, insider_confronted, insider_db_window_found, insider_evidence_partial, lockpicking_guide_offered, mission_complete, network_isolated, paid_ransom, patient_assaulted, patient_bed2_state, patient_bed4_state, patient_bed5_ko, player_name, privesc_guide_offered, ransom_decision_made, ransomware_deployed, raval_ko, reached_security_office, restore_manifest_obtained, scanning_guide_offered, ssh_guide_offered, val_caught_picking, vulnerability_guide_offered, ward_recovering

VERDICT: progress recorded — 10 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Step table (15 steps)

| # | Step | Result | Game | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Meet Val before the burn | PASS (notes) | 1388 | cone screenshots m02-pass4-s1-val-cone*.png; Val points to Gary's card; "sign in properly" line mismatch |
| 2 | Lanyard before the burn | PASS | 1388 | `staff_lanyard_obtained` true, `cover_restored` false, "Hang on to it" only |
| 3 | Burn lands on the corridor | PASS | 1388 | challenge opens unprompted; "Show her the lanyard" -> office opens, `val_opened_office` + `cover_restored` |
| 4 | Reload, then server room | PASS (respawn in reception) | 1388 | no replays; one HaX text; advice branch = server room |
| 5 | Ghost before the choice | PASS | 1388 | "Before you touch that console -- look up."; fourth tile selectable; HaX hub item present |
| 6 | Name the insider | PASS (wording notes) | 1388 | HaX no name; post log confirms post; Val/Gary pushback; Reeves sets `insider_identified`; credits incl. GHOST'S KEYS, PATIENT DEATHS: 2, COVER RE-ESTABLISHED |
| 7 | Blind-spot pick (no key) | PASS (assisted pick) | 1392 | picked while Val walked east at x=-28; entered office; `cover_restored` false |
| 8 | Caught picking (no key) | PASS for the catch; FAIL side effect | 1392 | caught at 3 attempts, repeat catch ok; but first catch opened Gary's `on_cabinet_picked` in the corridor and swallowed Val's scene (see fails) |
| 9 | Caught with IT key ("Switch to Lockpicking") | PASS (with fix) | 1398 | switch click caught by Val; control not caught when unseen; IT key does not open the door |
| 10 | After-the-fact catch | PASS | 1392 | "Footsteps behind you..." once on first server-room entry |
| 11 | Bed 4 slow path | PASS (notes) | 1392 | HaX text 2.9 s after confirm, no boardroom text; countdown shown; boardroom pointer after bagging |
| 12 | The ambush | PASS (first line not seen) | 1392 | `awaiting_ambush` not `mission_complete`; walk-out; debrief; credits "Walked out of the boardroom", COVER BURNED, 6 deaths, Val catch line |
| 13 | KO Val | PASS (assisted) | 1398 | HaX KO text mentions key; key + notebook drop; `cover_restored` false; credits "Neutralised on shift" |
| 14 | Raval and a patient | PASS (Raval assisted; patient real punch) | 1398 | `raval_ko` true, `ward_nurse_ko` false; `patient_assaulted` + HaX text; debrief and credits lines |
| 15 | Gary's cabinet catch | FAIL | 1392 | no `on_cabinet_picked`; lockpick minigame opens |

Step 15 was run in game 1392 (run B) rather than run C because it needs a game without any key (B skipped Bernie). Step 9 needs the IT key so it ran in C.

## Fails and suspected engine faults (repro)

1. **Step 15: Gary's `on_cabinet_picked` never fires for the cabinet.** Suspect engine: `lockpick-catch.js` reads `window.currentRoomId`, which is undefined in the page (the live room is `window.currentPlayerRoom`), and for a cabinet there is no `doorProperties.roomId`, so the gate returns null on `!roomId`. Repro in step 15 above (game 1392). Calling `npcManager.shouldInterruptLockpickingWithPersonChat("it_department", pos)` by hand returns `gary_whitlock`.
2. **Step 8 side effect: Gary's cabinet scene fires in the corridor and replaces Val's catch.** Burned player, Gary's room already visited, pick the Security Office door in Val's cone: the first catch opened Gary's "Behind you, a chair creaks round. Gary is watching you work the lock." with the corridor background, set `val_caught_picking`, but never showed Val's scene; Gary's mapping is `onceOnly`, so the next catch showed Val's normal scene. Suspect: `lockpick_used_in_view` is a global event and every loaded NPC with that mapping reacts. Not seen in game 1398 where Gary's room was unvisited.
3. **Val's pre-burn patrol has no dwell.** Config says 4 s dwells at x 3 and 7.5 tiles. Measured: continuous motion between about x=-48 and x=+70, period about 5.9 s, no stop (game 1392 pre-burn, and Run A visually). After the burn she does dwell (1.6 s at W1, 1.8 s at W2). `patrolTarget.dwellTime`=4000, `pathFollowingActive` true in the pre-burn sample. I have not isolated why.
4. **Bed 4 cannot be clicked from the north** (plain distance 36 > 32); reachable from the west (player (232,-62)). Cost about 20 s of a roughly 100 s countdown.
5. **Reload respawns the player in reception** (also seen by the m06 report). The script expected the Security Office.
6. Minor reads: Val: "Get yourself signed in properly at reception" after Bernie signed you in (step 1); "whatever you told me an hour ago" when you never spoke to her (run B); "ring Bernie" option never offered in `cover_challenge` even with `bernie_trusts_player`; credits "Gary scapegoated, position lost" vs debrief "rehired as IT Security Director" (run A); Kim's Patient Status Report ends with a design note "Reinforces the stakes -- 47 real patients at risk"; HaX "You've got a name in your notes now" after the Proposal (no name yet); the first narration line of the ambush scene advanced before I could read it; on a first Gary pick the press terminal lists "Gary Whitlock security advisory archive" even when the cabinet was never opened.

## Open items from the script
- Val window seen vs computed: post-burn matches (about 2.6 s seen, 4.7 s safe per 7.8 s loop). Pre-burn does not (no dwell, about 0.9 s seen of a 5.9 s loop, roughly 15%). The cone drawn in the corridor is a translucent circle sector with a facing line.
- Cone spill: the circle sector draws through the corridor's walls into the south room and the void north of the building; it does not reach into the Security Office when she faces the door (screenshots m02-pass4-s1-val-cone.png / -east.png). Not checked from inside the Security Office.
- Step 9: result is "with fix" (the engine fix is in the working tree, uncommitted). The catch happens at the Switch click, not when the key minigame opens.

## Top player-experience notes
1. Naming the insider is a four-button multiple choice with the answer attached to the first button, so it does not feel like deduction.
2. The HaX hub grows to 20 buttons; the three that matter ("I know whose badge...", Ghost, ransom decision) are buried and two Ghost buttons overlap.
3. Val's pre-burn patrol never stops, so the cone hardly matters before the burn; after it, a 2.6 s seen window per loop makes the blind-spot pick learnable and fair.
4. The Bed 4 sprint (about 100 s countdown, the bed unreachable from the north) is the sharpest moment in the mission, but the unreachable-from-the-north bed and the stacked toasts make it feel like a layout fight rather than a dilemma.
5. Ghost's video call, the Ghost's Keys tile and the debrief/credits variants all read well and match what the script predicted; the burn and Val's corridor stop are the strongest new beat.
