# m03 pass-4 round-2 confirmation report

Script: scenarios/m03_ghost_in_the_machine/PASS4_PLAYTEST.md, "Round 2 confirmation run". Keyless server :3001. Headless browser (headed hung under load in the previous run).
Game 1382. Session log: tools/playtest/m03-pass4-confirm-session.jsonl

## Steps (written as I go)

Briefing driven by hand (took "Just brief me", "That's everything", "Read the room", "I'm ready"; HaX opener "Agent. Zero Day Syndicate. You heard of them?"). `bootstrap` timed out with the briefing's end-of-conversation card still up; `mg close` then the tutorial "No" button cleared it. Reception badge cloned and saved (Dictionary), conference door opened by emulating it, Victoria's card read at the whiteboard and cracked with Darkside, Saved. Harness gotchas: after a reload with progress the Resume overlay's own "Resume" button is not found by `dismiss` (it only lists "Load session #N"), I clicked it with eval; `enter` fails with no-known-doorway leaving the conference room, `moveTo` through the gap works.

### Step 1: night scene, presentation and mid-scene reload: PASS
- Walked conference room -> main hallway after saving Victoria's card. First narrated line on screen ("Sterling's card is saved in the cloner. You sign out at the front desk and walk out into the afternoon with the last of the visitors."), screenshot tools/playtest/m03-pass4-confirm-shots/c1-scene-before-reload.png. Reloaded at that moment.
- After reload (globals victoria_card_cloned, reception_badge_cloned intact, HaX thread had 3 messages, no "You're in"), walked reception -> main hallway: the scene played again from line 1 (recorder: line 1 at t=19.7 s, line 2 "Eleven o'clock that night, you're back. The staff entrance takes the receptionist's badge without a murmur." at 24.7 s, line 3 "The main hallway is on its night lights. Somewhere off to the east, a guard's footsteps go round, and round again." at 29.8 s; 5 s per line, closes itself).
- Portrait: the player character (hooded hacker in a dark hoodie), plain black background, no circuit-board/magenta frame. Screenshots c1-scene-before-reload.png, c1-scene-line2.png (actually line 3).
- HaX text: "You're in. Server room's at the north end of the main hallway: use Sterling's card at the reader. Mind the guard in the executive wing." Chat-history timestamp 01:53:27.4 UTC; scene close is about 01:53:26.1-26.7 (line 3 began by 01:53:21.6 per the screenshot log, plus 5 s), so it arrived about 1 s after the scene closed (estimate, I did not have a bark recorder running for this first scene). On screen as a green toast in c1-after-scene.png with a HaX portrait.
- Second reload then reception -> main hallway: no cutscene (recorder empty, brief shows no minigame), thread still exactly 4 messages, no resent "You're in".

### Step 2: guard warning timing: PASS
Entered executive_wing_hallway through the main-hallway door. The recorder caught the bark/toast about 1 s after the enter command returned (enter returned 01:55:17.9, recorder read 01:55:19.1 with the toast already up), with the player at x=332 and the guard at x=578 (about 245 px away, I had not spoken to him): "Agent HaX: Sterling's office is keyed, not carded, so it's your pick kit. There's a guard on this corridor. Wait until his back's turned before you kneel at that door; if he sees you picking, you're made. I've a lockpicking field guide if you want it." Screenshot tools/playtest/m03-pass4-confirm-shots/c2-exec-entry.png (toast on screen, guard with his green view cone to the east).

### Step 3: guard keeps his word after the honest route: PASS
Talked to the guard: "I work here - forgot something at my desk" -> "I must have left it at my desk" -> "Be honest - SAFETYNET investigation" -> "Show credentials" -> "Just continue your normal patrol. Pretend you didn't see me." -> "Done. I'll be on the other side of the building if anyone asks." (global guard_told_safetynet set). Then picked Sterling's door three times, each time from the same spot (573,-90) and the last two with a wrapper around `npcManager.shouldInterruptLockpickingWithPersonChat` logging the guard's position at the moment of the gate:
- Pick 1: guard heading west near the door, back turned (not a fair test, no catch).
- Pick 2: guard at (471,-27) west-bound: no catch.
- Pick 3: guard at (476,-59) east-bound (poll 458 -> 471 -> 476), 102 px from me, bearing about 18 degrees off his heading, so well inside his 150 px / 120 degree view cone. Gate log: "lockpick_used_in_view mapping won't fire now (cooldown, condition or limit) - pick goes ahead", result null. The lockpicking minigame opened, no "Oi. Away from the door" conversation. Assisted finish via completeLockpick (dexterity not machine-playable), door open. 
The cone geometry is my own calculation from the logged positions (heading taken from successive polls), not an engine LOS print, because the engine returns before it computes LOS once the mapping condition is false. Screenshots c3-at-door.png (guard cone), c3-picking2.png. The bribe route was not run (optional).

### Step 4: flags, distcc last: PASS (flags exercised, not earned)
Opened the server room by emulating the saved Executive Keycard (cloned from Victoria at the whiteboard) at the reader, then the Drop-Site Terminal. Submitted <flag:1>, <flag:2>, <flag:3> then <flag:4> as scan, FTP, price list, distcc (same order as run B; stand-ins from the flags XML, "exercised, not earned"; I did not open the VM launcher or CyberChef). Per-flag HaX texts arrived once each: "Scan's in...", "FTP's in. The backdoor they sold Ghost...", "Price list's in. ROT13...".
The distcc submission opened HaX's call by itself (phone-chat). I read it live from the DOM and picked "We can prosecute this" then "I'll get everything". Lines in order: "Agent, I've got the distcc logs you just submitted." / "There it is. The ProFTPD backdoor. Line item on invoice ZDS-2024-0847..." / "Target line: St. Catherine's Regional. Sable's sign-off on the approval." / "Ghost's logs named Zero Day. This is Zero Day's own ledger saying it back..." / (choice) / "Direct chain. Zero Day to Ghost to St. Catherine's. That stands up." / "It does. ENTROPY procurement, in writing. Ironclad." / "Pull the rest while you're standing in it..." / "And Agent -- the logs point at a Phase 2..." / (choice) / "I know you will. Go." / "Finish up, then Sterling. And be careful -- reasonable as she sounds, she signed that invoice." The string "That's everything off their network" appears nowhere inside the call.
All-flags text: "That's everything off their network. Sterling hasn't left: she's in the conference room, off the phone now, and waiting for someone. If you want a say in what happens to Danny Foster, his office is in the executive wing: go there first. Then go and see her." It arrived after the last call line, as a toast (HaX portrait) over the still-open phone, and is in HaX's history. Timing from chat-history timestamps: "Finish up, then Sterling" 02:00:41.018, all-flags text 02:00:41.399, so about 0.4 s after that line (1.8 s after my click on "I'll get everything"), not the "about 2 s" in the script; either way it is after the call, not inside it. Note for the designer: the all-flags text is not appended to the open thread (it shows as a toast and in history), so a player with the phone open sees only the toast. Screenshots c4-call-start.png, c4-call-after.png.

### Step 5: debrief: PASS (credits partly observed)
Went to Victoria after the flags (skipped Danny's office and the receptionist, so no receptionist-KO line). Her opener now includes "And my night guard rang me earlier, terribly excited. SAFETYNET, he said. I expect he promised you he wouldn't." Took "SAFETYNET. And I know the name on your approvals. Sable." then "You're not walking out of here. Bag down." (arrest, victoria_fate arrested).
Debrief, in the order shown (my polling started after "Sit down before you fall down", checked against m03_closing_debrief.ink lines 52-64 that nothing in between is missing):
1. "The guard never logged you, because you'd talked your way past him. Effective. Not stealth."
2. "You told Sterling's own guard who you work for. He rang her."
3. "That's one reason she had her coat on when you walked in."
4. "The network first. You stripped their training lab and submitted the full set -- recon, FTP, pricing, and the distcc logs."
5. Phase 2: "You left the drive in her desk. The search team pulled it out this morning, and our people had it read in ten minutes. Base64 over ROT13..." (I did not open the drive or CyberChef, per the static cover note).
6. "For the report, here's what let you in." MIFARE line, then "Their records sat on the one box they knew was broken: a distcc daemon exploitable since 2004, left listening because it was useful to them." then "You left some of the paper behind" (cabinet, wall safe, the drive). No lockpick line even though I did pick the office door (assisted); no guard line.
Credits: the overlay shows one line at a time and I only caught "DANNY FOSTER: NEVER FOUND" and "ENTROPY: Still operational" (5 s sampling, then my rapid sampler started after it had finished). So the absence of the PERFECT STEALTH credit is **derived, not observed**: its condition in scenario.json.erb line 140 needs guard_told_safetynet !== true, and the game's globals read guard_detection_count 0, exec_office_entered true, guard_told_safetynet true, so it is false. Screenshot c5-credits.png (visualiser terminal state, as expected).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Staff badge (reception) | cloned card | Receptionist, "Lean across the desk" RFID read, Dictionary | before step 1 | yes |
| Victoria's executive card | cloned card, Darkside | Victoria at the whiteboard | before step 1 | yes; emulated at the server room reader in step 4 |
| Sterling's office door | lockpick | pick kit (starting kit), guard cleared by honest route | step 3 | assisted (`completeLockpick`, dexterity not machine-playable) |
| Four flags | `<flag:1>`..`<flag:4>` | none: stand-ins from the flags XML, no VM in standalone | step 4 | **no: exercised, not earned** (VM launcher not opened) |
| `Sterling2010`, directive answer | not used | | | not exercised this run |

Everything downstream of the flags (solvability of the VM part) is unproven by this run. CyberChef decode, Sterling's PC and the drive were not exercised (static cover only).

## verify-run.rb (game 1382)
```
game            1382  (mission 47)
created         2026-10-02 01:44:53 UTC
last write      2026-10-02 02:03:46 UTC
played for      1133s of wall clock
current room    "reception_lobby"
unlocked rooms  6: reception_lobby, main_hallway, conference_room_01, executive_wing_hallway, executive_office, server_room
unlocked objs   0: 
inventory       6: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Zero Day Transaction Log
NPCs met        9: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, night_transition, victoria_sterling, night_guard
flags submitted 4: flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_1_509cb4}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_2_351b39}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_3_bb3407}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_4_f98594}
globals set     23: briefing_played, clone_call_done, danny_fate, debrief_played, exec_office_entered, exec_wing_entered, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, guard_told_safetynet, lockpicking_guide_offered, mission_phase, netexploit_guide_offered, night_confrontation_ready, player_approach, reception_badge_cloned, revelation_heard, time_of_day, victoria_arrested, victoria_card_cloned, victoria_choice_made, victoria_fate

VERDICT: progress recorded — 5 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```
Session log: tools/playtest/m03-pass4-confirm-session.jsonl. Screenshots: tools/playtest/m03-pass4-confirm-shots/. Session stopped cleanly; no stray browsers of mine left.
