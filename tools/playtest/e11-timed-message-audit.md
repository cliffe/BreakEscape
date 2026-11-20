# E11 audit: eventMapping `sendTimedMessage` delays now count from the event

Approval: `scenarios/PASS3_APPROVAL_LOG.md`, item E11.

## Engine change

`public/break_escape/js/systems/npc-manager.js`, `_handleEventMapping` (the `config.sendTimedMessage` branch).
The mapping now passes `triggerTime: (Date.now() - this.gameStartTime) + (msgConfig.delay || 0)`
instead of `delay: msgConfig.delay || 0`. `scheduleTimedMessage` reads `triggerTime` as ms from game start,
so the text arrives `delay` ms after the event. Before, it fired on the next 1 s tick once the game was
more than `delay` ms old, which in practice meant always.

Left unchanged:

- NPC-level `timedMessages` without `waitForEvent` (`registerNPC`, ~:220): still ms from game start.
- NPC-level `timedMessages` with `waitForEvent` (`_setupEventTriggeredMessage`): already counted from the event.
- `loadTimedMessages`: no callers anywhere in the repo, behaviour unchanged.
- `scheduleTimedConversation`: not touched. Its header comment still says "delay (ms from now)", which is
  only true with `waitForEvent`. I corrected the same wording on `scheduleTimedMessage` only.

Reload path: scheduled timed messages are not saved. `triggeredEvents` is (onceOnly / maxTriggers handlers,
saved on the 30 s sync and on `pagehide`), and a non-conversation handler is marked for saving the moment it
fires. If the player reloads after the event and before the text arrives, the handler counts as fired and the text never comes.
The window used to be at most 1 s. It is now the mapping's delay: 1 to 4 s for most, 6 to 11 s for a handful.
`game_loaded` is emitted once per page load and only re-fires mappings that listen for it (m05 `recruiter[3]`, deliberately repeatable).
Not fixed here. If it matters, the fix is to set `triggered.persist` for a text-only handler when its message is delivered, not when it fires.

Tests: two new cases in `test/js/npc-manager-triggers.test.mjs`. One fires a mapping ten minutes into a game and
checks the text is absent at +0 s and +7 s and present at +8 s. That test fails with the old line. The other checks that a plain
NPC `timedMessages` delay still becomes a from-game-start `triggerTime`. `node --test test/js/`: 33 pass, 0 fail (baseline 31).
`bin/rails test test/models/break_escape/ test/controllers/break_escape/`: 261 runs, 730 assertions, 0 failures, 0 errors.

## How the new timing interacts with conversations

- Person-chat open: the bark is deferred (`npc-barks.js` `showBark`) and drained one at a time, in arrival order,
  when the chat closes. The phone history entry is written on arrival regardless. Most texts triggered from inside a scene
  (task completions and globals set by ink) now arrive while the scene is still open, and are deferred, same as before.
- Phone-chat or any other minigame open: the bark shows straight away, on top of it.
- Several handlers on one event used to deliver in the same tick, in registration order. They now deliver in
  delay order. Where an author staggered the delays (m02 1800/3600, 1800/4200/5600; m08 2000/6000; sis02, sis03)
  that is what they intended. Where they did not, the order can flip. Those cases are listed below.
- Conditions are evaluated when the event fires, not when the text arrives. Mapping `sendTimedMessage` has no
  `skipIfGlobal`. Only NPC-level `timedMessages` pass it through.

Scenarios using mapping `sendTimedMessage`, rendered with `tools/pass2/render.rb`: m01 to m08, sis02, sis03 (233 mappings).
Every delay is 11 s or less. None of them looks like an absolute "from game start" time.

## m01_first_contact (42 mappings, all on `agent_0x99`, phone)

| # | Event | Condition | Delay | Message starts | Reads well? |
|---|---|---|---|---|---|
| 0 | npc_attacked:sarah_martinez | | 1500 | "Unorthodox check-in. Her items will be on the floor…" | Yes |
| 1 | npc_ko:sarah_martinez | | 2000 | "Check-in resolved. Sarah's key and badge…" | Yes, always after #0 |
| 2 | npc_attacked:maya_chen | | 1500 | "That's the informant, Agent…" | Yes |
| 3 | npc_ko:maya_chen | | 2000 | "We may never know what Maya had to tell us…" | Yes |
| 4 | npc_attacked:kevin_park | | 1500 | "That's one way to get the lockpick…" | Yes |
| 5 | npc_ko:kevin_park | | 2000 | "Kevin's down. His items are on the floor…" | Yes |
| 6 | global_variable_changed:kevin_accused | value === true | 1500 | "Hold on — those logs pointing at Kevin were filed by Derek…" | Timing fine. Nothing in m01 ever sets `kevin_accused` true, so the mapping is dead (pre-existing) |
| 7 | door_unlock_attempt | connectedRoom === 'derek_office' | 1500 | "That door's locked…" | Yes |
| 8 | item_picked_up:lockpick | | 1000 | "Lockpick acquired…" | Yes (deferred if given in Kevin's chat) |
| 9 | room_entered:main_office_area | | 1500 | "You're in. Get a feel for the place…" | Yes |
| 10 | room_entered:server_room | | 1000 | "You're in the server room…" | Yes |
| 11 | object_interacted (vm-launcher) | | 800 | "That's your Kali terminal…" | Yes |
| 12 | item_picked_up:notes ("My Passwords") | | 1500 | "Derek's password list. Save those to a file…" | Yes. Improved: #12 sets `password_list_found`, which fires #13 synchronously, so #13 was queued first and used to arrive before #12. It now arrives after |
| 13 | global_variable_changed:password_list_found | | 3000 | "This password list could be useful… field guide…" | Yes |
| 14 | global_variable_changed:ssh_flag_submitted | | 2000 | "You have SSH access. I've pushed the privilege escalation guide…" | **Flag F1**: now arrives after #30 |
| 15 | room_entered:derek_office | | 1000 | "You're in Derek's office…" | Yes |
| 16 | global_variable_changed:derek_pc_unlocked | | 1000 | "You're in. Check his files carefully…" | Yes |
| 17 | item_picked_up:workstation | | 1500 | "Patricia's CyberChef workstation…" | Yes |
| 18 | global_variable_changed:whiteboard_cipher_seen | && !cyberchef_guide_offered | 1500 | "Those notes are encoded…" | Yes (same delay as #24, keeps array order) |
| 20 | derek_personal_safe_opened | | 1500 | "The Architect's Letter…" | Yes |
| 21 | derek_storage_safe_opened | | 1500 | "Derek decoded that note…" | Yes |
| 22 | derek_cabinet_opened | | 1000 | "Filing cabinet open…" | Yes |
| 23 | contingency_file_read | | 2000 | "You found a contingency plan…" | Yes |
| 24 | whiteboard_cipher_seen | | 1500 | "That text is encoded. Two quick rules…" | Yes |
| 25 | framing_evidence_seen | | 2000 | "You found something on the PC…" | Yes |
| 26 | entropy_reveal_read | && !derek_confronted | 2500 | "That's the full picture…" | Yes |
| 27 | entropy_reveal_read | && derek_confronted | 2500 | "That's the full picture — and Derek's already contained…" | Yes |
| 28 | objective_aim_completed:decrypt_entropy_intel | | 3000 | "All intelligence secured…" | Yes, after #26/#27 |
| 29 | room_entered:testing | | 1000 | "Mission complete. Return to HQ…" | Yes (test room) |
| 30 | global_variable_changed:ssh_flag_submitted | | 1500 | "ENTROPY archive decryption key confirmed…" | **Flag F1** |
| 31 | linux_flag_submitted | | 1500 | "Directory traversal evidence secured…" | Yes |
| 32–35 | sudo_flag_submitted (four exclusive variants on ssh/launch_code) | | 2000 | "Encoded deployment intel secured…" | Yes |
| 36 | item_picked_up:launch-device | | 1500 | "You have the launch device…" | Yes |
| 37 | attack_aborted | | 2000 | "Abort confirmed… Call me when you're ready to debrief." | Yes. Nothing auto-opens on this event |
| 38 | attack_launched | | 4000 | "...I'm seeing reports… Call me." | Yes. The 4 s pause works for the beat |
| 39 | sudo_flag_submitted | && !derek_confronted | 3000 | "All technical flags secured…" | Yes, after #32–35. The copy says "all flags" even when the SSH flag is still missing (pre-existing, not timing) |
| 40 | sudo_flag_submitted | && derek_confronted | 3000 | "All technical evidence secured. Derek is already contained…" | Yes |
| 41 | derek_confronted | && entropy_reveal_read | 1000 | "Derek is contained…" | Yes (deferred until the Derek scene closes) |
| 42 | derek_confronted | && !entropy_reveal_read | 1000 | "Derek is contained. You still need…" | Yes |

**F1 (m01, low).** `ssh_flag_submitted` drives #14 (2000, "You have SSH access… privesc guide") and #30 (1500,
"decryption key confirmed… archive is unlocked"). They used to arrive in the same tick in array order, #14 first. Now #30 comes first.
Both orders make sense, but the old one tells the story better: you're on the box, then the reward.
Proposal: raise #30 to 2500 (or lower #14 to 1000). The m01 erb was not edited.

## m02_ransomed_trust (47 mappings: 46 on `agent_0x99`, 1 on `ghost`)

| # | Event | Condition | Delay | Message starts | Reads well? |
|---|---|---|---|---|---|
| 0–3 | objective_task_completed:make_ransom_decision | advised_board_* × paid_ransom, !dr_kim_ko (exclusive) | 9000 | "Dr Kim just messaged the team…" / "Word from Dr Kim…" / "Dr Kim's noted…" / "Dr Kim clocked it…" | Yes. Arrives after #61 (2 s, "Decision logged") and #67 (3 s, comms terminal). The decision is made at the recovery console, so no scene is open. On the slow path the Bed 4 countdown is running at the same time, and three texts in 9 s is busy but tolerable |
| 4 | conversation_closed:opening_briefing_cutscene | | 6000 | "Reminder on the doors in there…" | Yes (deferred if the reception chat is already open) |
| 5 | noticed_struck_booking | | 2000 | "You've read that right — your booking…" | Yes |
| 6 | objective_task_completed:sign_in_at_reception | | 1500 | "Signed in. That paper badge…" | Yes |
| 7 | decoded_ransomware_note | | 1500 | "Note decoded — 'Ransomware Incorporated'…" | Yes |
| 8 | read_ransom_cto | | 4500 | "Read what they left on Kim's screen…" | Yes |
| 22 | room_entered:hospital_ward | | 1500 | "Those are the patients at risk…" | Yes |
| 23 | objective_task_completed:meet_dr_kim | | 1500 | "Kim's vouched for you…" | Yes (deferred until Kim's chat closes) |
| 24 | objective_task_completed:talk_to_gary | | 4000 | "Stop. Listen to me carefully. Two minutes ago someone rang…" | Yes. Fires mid-Gary-scene (ink `#complete_task`). Deferred, then drained after the guard's 1.2 s "Control just rang" bark |
| 25 | objective_task_completed:talk_to_gary | | 11000 | "This wasn't the board… Get something that stands up — a real staff lanyard…" | **Flag F2** |
| 26–28 | item_picked_up:id_badge (three lanyards) | itemId | 1200 | "Blank contractor pass…" / "Agency lanyard…" | Yes |
| 30 | read_handover_board | | 1500 | "Look at the times on that board…" | Yes |
| 31 | found_safe_pin_clue | && !escrow_safe_opened | 1400 | "Founding year on the escrow safe…" | Yes |
| 33 | read_operator_note | | 1500 | "That's their operator's own handwriting…" | Yes |
| 34 | password_hints_found | | 1200 | "Shared admin credential on a sticky note…" | Yes |
| 35 | cover_restored | | 1200 | "That'll hold. Now — whoever made that call…" | Yes on its own. See F2 |
| 36 | guard_knocked_out | | 1500 | "You've put a hospital security officer on the floor…" | Yes |
| 37 | room_entered:server_room | | 1000 | "Server room. This is the heart of it…" | Yes. The guard's `on_server_room_access` person-chat opens on the same event, so it is deferred |
| 38 / 39 | objective_task_completed:access_server_room | | 1800 / 3600 | "Before you go hot… recon field guide" / "Once you've mapped it… SSH… Hydra" | Yes. The author's stagger now works |
| 40 | object_interacted (vm-launcher) | | 1200 | "You're on the Kali terminal…" | Yes |
| 42 / 43 / 44 | objective_task_completed:submit_ssh_flag | | 1800 / 4200 / 5600 | vuln guide / ProFTPD guide / privesc guide | Yes. The stagger now works |
| 45 | objective_task_completed:submit_ghost_log_flag | | 1500 | "That's the full backdoor chain…" | Yes |
| 46 | item_picked_up:text_file (verified_restore_manifest) | | 6000 | "The drop-site's cut you a restore manifest… Read it." | Yes, after #52 (2.5 s). Can land during Ghost's phone-chat (F3) |
| 47 | item_picked_up:text_file (entropy_key_material) | | 1500 | "Ghost's own key material…" | Yes |
| 48 | gary_ko | | 2000 | "Gary is down…" | Yes |
| 50 | insider_evidence_partial | && !read_handover_board && !insider_badge_id_found | 1500 | "That goes in the file…" | Yes |
| 52 | objective_task_completed:submit_database_flag | | 2500 | "The backup logs show it — the planted device…" | **Flag F3** (low) |
| 53 | objective_task_completed:submit_ghost_log_flag | | 2600 | "Ghost's log names the badge — #SC-4471…" | Yes. Lands after #45 |
| 54 / 57 | insider_badge_id_found (set by #53's handler) | inspected_asset_post / insider_evidence_partial | 4200 | "Badge SC-4471 belongs to Graham Reeves…" | Yes. Order 1.5 → 2.6 → 4.2 s, as designed |
| 55 / 56 | inspected_asset_post / insider_evidence_partial | && insider_badge_id_found | 2000 | "That post log seals it…" / "That is the name…" | Yes |
| 58 | item_picked_up:notes (gary_vindication_email) | | 1500 | "That's Gary's proof…" | Yes |
| 59 | offline_keys_recovered | | 1000 | "The offline escrow keys…" | Yes. ghost[6] (3000) taunt follows it, as intended |
| 60 | pin_cracker_found | | 2000 | "Hold on — what you just pulled out of that case…" | Yes |
| 61 | ransom_decision_made | | 2000 | "Decision logged. Whatever the board chooses…" | Yes. Note that #67 opens with "Recovery decision logged" 1 s later (repetition, pre-existing) |
| 62 | board_coverup_email_found | | 2000 | "That email is damning…" | Yes |
| 67 | objective_task_completed:make_ransom_decision | | 3000 | "Recovery decision logged. One more thing…" | Yes |
| ghost[6] | offline_keys_recovered | | 3000 | "You found the physical keys. Clever…" | Yes |

**F2 (m02, medium).** `talk_to_gary` completes inside Gary's scene, at the moment he hands over the keycard. #25 is
"Practical problem first… Get something that stands up — a real staff lanyard, or somebody willing to vouch for you",
and it now arrives 11 s later. The same Gary scene offers the lanyard as soon as `cover_burned` is set (ink line 432/678 option).
If the player takes it within those 11 s, #35 ("That'll hold…") arrives at +1.2 s after the restore, which is before #25.
Both barks sit in the deferred queue in arrival order, so when the scene closes the player reads "That'll hold" and then
"go and get a lanyard". The same can happen after the scene if the player picks up a lanyard quickly.
Proposal (pick one):
- (a) Move #25's text to its own mapping on `conversation_closed:gary_whitlock` with condition
  `globalVars.cover_burned === true && !globalVars.cover_restored`, `onceOnly`, delay ~2500. Leave #24 where it is.
- (b) Engine: pass `skipIfGlobal: msgConfig.skipIfGlobal || null` through the mapping branch (one line), then give #25 `"skipIfGlobal": "cover_restored"`.
  This also gives later missions a general guard against stale texts. Not done here because it widens E11.

**F3 (m02, low, pre-existing).** `submit_database_flag` also opens Ghost's phone-chat (`ghost[4]`, `on_backup_located`).
Phone-chat does not defer barks, so #52 (2.5 s), and possibly #46 (6 s), pops up over Ghost's terminal. The old timing
did the same at about 1 s. Proposal if it reads badly in playtest: keep the `setGlobal`/`completeTask` on the flag event
and move the text to `conversation_closed:ghost` with condition `globalVars.insider_db_window_found === true`, `onceOnly`.

No m02 delay looks like an absolute time.

## m03–m08 (summary)

| Mission | Mappings | Delays used | Result |
|---|---|---|---|
| m03 | 6 | 1200–6000 | All fine. `night_confrontation_ready` 4000/6000 are exclusive variants |
| m04 | 16 | 0–6000 | Fine, one low note (below). `npc_hostile_state_changed` (voltage) has delay 0 and still arrives on the next tick. `conversation_closed:robert_vance`: Vance's own text (2500) arrives before 0x99's RFID offer (6000), as written |
| m05 | 28 | 1500–3000 | One flag (below). Door hints, flag acknowledgements and `conversation_closed:*` texts all read well. `recruiter[3]` on `game_loaded` is repeatable by design, and its relative and absolute timing are the same |
| m06 | 18 | 1200–4000 | All fine. `assets_decided`: "money settled" (2500) comes before the flags nag (4000) |
| m07 | 23 | 500–9000 | All fine. `room_entered:operations_floor` RFID hint (8000) lands after the Architect's 3000 text, which reads as deliberate. Its condition `!badge_obtained` can't realistically go stale in 8 s. `room_entered:server_room` lockpick hint (9000) comes after the recon offer (2500). The Architect's countdown taunts are at 500 |
| m08 | 15 | 1500–6000 | All fine. flag4 (2000) is followed by `all_flags_submitted` (6000), as designed |

**m04 (low, not changed).** flag 1 `submit_network_scan_flag` → "That FTP service. Same backdoored build…" at 4000.
flag 2 `submit_ftp_intel_flag` → "There's a legacy distccd…" at 2000. If both flags are submitted at the drop-site within 2 s
of each other, the distcc line arrives first. That's unlikely given the time it takes to enter a flag, so I didn't count it as clearly wrong.
If it shows up in playtest, set the FTP line to 1500.

**m05 (medium, not changed; can't be fixed with a delay).** `flag4_submitted` → "Final flag in… Call me. You need to hear this." (1500).
If `final_choice` is already made and flags 1–3 are in, the same event opens the closing debrief (`closing_debrief_trigger[5]`,
person-chat, after 500 ms). The text's bark is then held until the debrief closes and appears after the mission's end.
Under the old timing it either popped up just before the debrief or was deferred the same way, about half the time each.
Now it is always deferred. Proposal: add `&& globalVars.final_choice === ''` to its condition. The rare case of a choice made
with flags 1–3 still outstanding is already covered by the `conversation_closed:david_torres` nags. The same pattern
(flagN text plus debrief on the same event) is possible for flags 1–3, but only if they're submitted out of order.

No delays were edited in m03–m08: none of the new timings is clearly wrong.

## sis02 / sis03 (outside the edit scope, listed for the orchestrator)

- sis02 (12): staggered as designed (e.g. `jump_server_confirmed`: Priya 2000, Tom Hadley 9000). All fine.
- **sis03 (13), flag.** `policy_reviewed` fires `eleanor_vance[1]` (5000, "Good — you've confirmed the insuring clause… Next: verify the forensic chain")
  and, if the forensic chain is already verified, `[2]` (4000, "Policy and forensic checks complete. Evidence Archive access code: 6767").
  `forensic_chain_verified` has the mirror pair, `[4]` (5000) and `[5]` (4000). Whichever check the player does second, the
  "complete, here's the code" line now arrives a second before the "Next: verify…" line. Before the fix they arrived in array order.
  Proposal: raise `[2]` and `[5]` to 6500, or add `&& !globalVars.forensic_chain_verified` / `&& !globalVars.policy_reviewed` to `[1]` / `[4]`.
  The condition change is better, because `[1]`/`[4]` tell the player to do something they have already done.
  `[1]`/`[4]` also carry `completeTask`, though, so their text would have to move to a separate mapping first. Raising the delays needs no restructuring.
