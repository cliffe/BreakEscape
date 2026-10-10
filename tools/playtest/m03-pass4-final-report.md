# m03 pass-4 final confirmation playtest

Question answered: (1) plumbing plus the words on screen, new-player route, after the dialogue round fixes. Not a solvability pass: flags come from the session flags XML (no VMs here).

- Game 1427, keyless :3001, headless. Session log `tools/playtest/m03-final-session-1427.jsonl`. Flags `tools/playtest/m03_ghost_in_the_machine-flags-game1427.xml`. Scratch `scratchpad/m03-final/`. Player name in the harness is "Agent".

Session log: `tools/playtest/m03-final-session-1427.jsonl` (2839 commands), verify output `tools/playtest/m03-final-verify-game1427.txt`. Screenshots s01-s11 in `scratchpad/m03-final/`. Route: new player, afternoon then night, Sterling's card cloned, guard lied to (challenged), office entered by lockpick, drive read and decoded in real CyberChef, one reload (night, flags not yet in), four flags from the session XML, Danny "testify", Victoria arrest, full debrief, credits read from `#bv-credits-overlay`.

## verify-run.rb (game 1427)

```
game            1427  (mission 47)
created         2026-10-02 08:06:58 UTC
last write      2026-10-02 08:37:02 UTC
played for      1804s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway, executive_office, danny_office
unlocked objs   2: victoria_computer, executive_office_suitcase_2
inventory       10: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, Unsent email to the night team (raw source), Client Roster, Hidden USB Drive, CyberChef Workstation, Zero Day Transaction Log
NPCs met        10: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, night_transition, victoria_sterling, night_guard, danny_foster
flags submitted 4: flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_1_a60bc0}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_2_621f4f}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_3_43a2c3}, flag{m03_ghost_in_the_machine_ghost_in_machine_vm_network_4_1ed370}
globals set     33: briefing_played, called_it_murder, clone_call_done, danny_evidence_seen, danny_fate, debrief_played, directive_decoded, draft_seen, engine_tutorial_declined, exec_office_entered, exec_wing_entered, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, guard_challenged, knows_m2_connection, lockpicking_guide_offered, lore_directive_found, mission_phase, netexploit_guide_offered, night_confrontation_ready, pc_call_done, player_approach, reception_badge_cloned, revelation_heard, roster_seen, time_of_day, usb_seen, victoria_arrested, victoria_card_cloned, victoria_choice_made, victoria_fate

VERDICT: progress recorded — 6 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Reception badge | cloned | receptionist hub "Lean in to read the building directory." -> RFID flipper, dictionary + nested attack, Save | before conference door | yes |
| Sterling executive card | cloned | whiteboard conversation, Darkside, Save | before server-room door | yes |
| `Sterling2010` | typed | plaque 2010, receptionist "founded in 2010", post-it "Surname + year founded" | before opening the PC | yes (read plaque/receptionist/post-it text in earlier branches; the harness opened the PC on its first `lock` call) |
| Drive decode (From Base64, ROT13) | recipe | base64 read from the drive's own inventory viewer, pasted into the real CyberChef, output "PHASE 2 -- INFRASTRUCTURE... Winter." | before the HaX call answer | yes |
| Four flags | `<flag:1..4>` | session flags XML | at drop-site | **no** (no VMs). Everything after the flags (revelation call, all-flags text, confrontation, debrief, credits) was exercised, not earned. |

## Step table (the nine confirmations)

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Lie to the guard so he challenges; debrief opener and credits do not award Perfect Stealth | PASS | Guard stopped me ("A torch beam swings round and settles on you"), I lied ("Building maintenance" -> "Emergency call"), `guard_challenged` set, `guard_detection_count` stayed 0, office entered. Debrief opener: "Sit down before you fall down..." then "The guard stopped you and you lied your way on. He never caught you at a lock, but he'll remember your face." No "First thing I checked..." line. Credits (DOM, 3-4 s each): GHOST IN THE MACHINE / ZERO DAY SYNDICATE: EXPOSED / ST. CATHERINE'S LINK: PROVEN / ZERO DAY CATALOGUE: SEIZED WITH THE MARKETPLACE / DECISIONS / VICTORIA STERLING: ARRESTED / DANNY FOSTER: PROTECTED / THE ARCHITECT / ENTROPY. No PERFECT STEALTH line. `zero_detection` not in globals or verify output. |
| 2 | "Where do I stand?" changes with progress | PASS (8 distinct states) | (a) day, nothing: "Day one still. Reception's badge first, then Sterling's card in the meeting." (b) badge cloned: "You've got the staff badge. Conference room next: Sterling's card, at the whiteboard." (c) card saved: network line + "Sterling's office is still unread" + "The guard hasn't clocked you yet." (d) after the guard challenge: "The guard's had a look at you. He'll be watching now." (e) PC read, drive taken: "That drive's still unread. CyberChef workstation, two passes." (f) drive decoded: network + guard only (g) three flags: "Recon, FTP and pricing are in. Just distcc left..." (h) four flags: "Network's stripped and the case is made. Danny Foster's office first... Then Sterling." Not exercised: guard "told", "bribed", "caught at a lock". |
| 3 | Revelation call does not tell you to find a decoded drive | PASS | With drive decoded and roster taken: "...And it lines up with the directive you read me. Phase 2 has a supplier, and now a ledger." No "pull the rest" or "if you find the directive". |
| 4 | Guard's first excuse menu has the honest SAFETYNET option | PASS | First menu has four options, the fourth is "I'm with SAFETYNET. This is an active ENTROPY investigation." (the harness shows it without brackets). I did not take it. |
| 5 | "CyberChef workstation" and "drop-site terminal" match the objects | PASS (one note) | Room objects: "CyberChef Workstation", "Drop-Site Terminal". HaX drive call, laptop toast and hint topic all say "CyberChef workstation". Briefing says "drop-site terminal" and glosses it in the closing lines. Note: the laptop's own window title is "Crypto Workstation". |
| 6 | Receptionist clone choice short, not repeated by narrator | PASS | Choice "Lean in to read the building directory." Only narrator line: "The cloner's antenna lights up -- it detects a MIFARE signal from her staff badge. Read it, then crack the keys." Sign-in clipboard did not replay after the WhiteHat detour. "Midnight work sessions?" is answered. "She is. Goodnight." gets "Night, then. Don't let the guard scare you." |
| 7 | Receptionist hub and Victoria hub reopen with one in-character line, not blank | PASS for both | Receptionist: "What else can I help with?" (s01). Victoria afternoon: "Was there something else?" (s02). Victoria at night: reopening mid-confrontation resumes the last batch of her lines, not blank (s10); the "Sterling hasn't left..." variant was not reached. **Guard hub reopen is BLANK (fail, see below).** |
| 8 | First meetings vs return visits do not run into each other | PARTIAL | Receptionist day: clean. Victoria day: clean. Danny: first visit and return are distinct but the return replays "Everything. Yes. God, yes." Receptionist at night: "I'm just off, honestly." then "Oh! You made me jump." run together (see below). Guard: see below. |
| 9 | Previously flagged worst lines | PASS | Read clean: "Come back in one piece.", "Good answer. Evidence first.", "Did Zero Day sell Ghost the way in?" (now a question), "You'd be amazed how many people choke on that sentence.", "I know which I'd rather fund.", "Sorry about earlier. Freelance habit -- I test every client's story.", guard "Pays the mortgage...", "Signs my wages, never learnt my name.", "It's an office, mate.", "Like you, possibly.", debrief "You did the technical work and still saw the people in it. Keep doing both." Not reached: "Nothing in there is a toy" (a branch I skipped), the receptionist-KO and eager-recruit KO lines, "Ring Ms. Sterling if you like". |

## Fails and new awkward lines

1. **Guard hub reopens blank (FAIL, same class as the receptionist/Victoria fix).** Repro: night, executive wing. Talk to the guard, pick "Building maintenance" -> "Emergency call" -> "Long night ahead of you?" -> "Must be boring work" -> "What's Sterling like..." -> "Big place..." -> "Right. Thanks." The guard says nothing and the menu stays open with "Maybe we can work something out." / "I'll let you get on." Close, talk to him again: no speaker line, only those two buttons (s04-guard-reopen.png, log around the second `interact night_guard`). "I'll let you get on." then gets "I'm keeping an eye on you. Don't make me regret this." So "Right. Thanks." is also a choice that goes nowhere.
2. **Receptionist at night, first talk after the afternoon hub (minor).** Opens with "I'm just off, honestly." before the player speaks, then after "You're still here? It's late." she says "Oh! You made me jump. I only came back for my charger." The return-visit line and the first-night line contradict each other in order. The receptionist ink hub is at `m03_npc_receptionist.ink:123`.
3. **Danny return visit (minor).** Reopening him after the decision replays his last line "Everything. Yes. God, yes." with the single choice "Danny's on the phone to SAFETYNET. Leave him to it." (s08-danny-return.png).
4. **"Where do I stand?" in the afternoon after Sterling's card (minor).** The phase flips on the clone, so before the "eleven o'clock" cutscene fires (on entering the hallway) the phone already gives the night text "Nothing in from their network yet. VM terminal's in the server room. Start with a scan."
5. **Minor lines.** Briefing: "She's the CEO of the front and runs its operation for 0day, who leads the cell." (awkward). "Understood." then "That's everything. Let's talk approach." is still two clicks after the learning topic. After the revelation call's last choice: "I know you will. Go." is leftover mentor filler. The all-flags text and "Where do I stand?" (all four) both say "Danny Foster's office first... Then Sterling" back to back. Debrief says "Victoria Sterling is in custody" twice (in the arrest discussion and in the final status). The briefing topic "What am I looking for exactly?" uses "drop-site terminal" before the gloss in the closing lines. Laptop window title "Crypto Workstation" is a third name.

## Findings log (as I went)
### Briefing (hand-driven, all hub topics except "How do I clone" / "Who is Victoria", skipped by choice)
- (9) "Did Zero Day sell Ghost the way in?" now a question. Reads fine.
- (5) First "drop-site terminal" mention is in the "What am I looking for exactly?" topic (before the gloss). The gloss ("takes your flags and sends them straight to me") only comes in the closing lines, which a player who skips that topic gets and one who takes it gets too, so the gloss is always before the room. Minor: topic line says "drop-site terminal" without a gloss if the player reads it first.
- (9) "Come back in one piece." and "Good answer. Evidence first." read fine. "Understood." then "That's everything. Let's talk approach." still two clicks after "What will I actually learn from this?" (hub returns after the one-option "Understood.").
- Possible awkward line: "She's the CEO of the front and runs its operation for 0day, who leads the cell." (briefing, after the "murder with an invoice" beat).
- "Fine. Just don't leave the logs behind." (fast route) reads as a grumble after "Less time for things to go wrong." Acceptable.

### Receptionist (afternoon)
- (6) Clone option: "Lean in to read the building directory." Short. After choosing it the only narrator line is "The cloner's antenna lights up -- it detects a MIFARE signal from her staff badge. Read it, then crack the keys." No repeat of the action. PASS.
- (6) Sign-in clipboard/"I just need you to sign in" did not replay after the WhiteHat detour. PASS.
- (9) "Midnight work sessions?" -> "Some nights, yeah. The cleaners find her at her desk gone midnight." Answers it. PASS.
- (7) Hub reopen after "Thanks. I'll head through." / "Have a great visit!": one line "What else can I help with?" with the three choices (screenshot s01-recep-reopen.png). PASS.
- After the Save: "The badge is in the cloner." then "Ask away." then hub.

### Victoria (afternoon)
- (9) Lines checked: "You'd be amazed how many people choke on that sentence." (good), "I know which I'd rather fund." now ends the thought, hub lines "Go on." / "What else?" / "Ask." read as hub re-entry prompts. Walk-back choice "Sorry about earlier. Freelance habit -- I test every client's story." reads fine; answer "Does it. Well. Most people don't bother to walk it back." fine.
- Darkside narrator "about thirty seconds" matches menu "Darkside Attack (~30 sec)". PASS.
- (7) Reopen after the meeting: one line "Was there something else?" with the single "Thank her for her time" (screenshot s02-vic-reopen.png). PASS. "Thank her" then gets "We covered the main points. I'll be in touch about the training programme."
- (8) No greeting replays on any of these reopens.

### HaX "Where do I stand?" (2) so far
1. Afternoon, nothing done: "Day one still. Reception's badge first, then Sterling's card in the meeting."
2. Afternoon, badge cloned: "You've got the staff badge. Conference room next: Sterling's card, at the whiteboard."
3. Sterling's card saved, still in the conference room, before the turn cutscene: "Nothing in from their network yet. VM terminal's in the server room. Start with a scan." / "Sterling's office is still unread, if you want her paper as well as her servers." / "The guard hasn't clocked you yet. Keep it that way." Changes correctly, but it is the night text read in the afternoon (the phase flips on the clone, before the "eleven o'clock" cutscene fires on entering the hallway). Minor timing oddity, not a bug I'd classify.

### Night: receptionist and guard
- (8) Receptionist at night after the afternoon hub: first open shows "I'm just off, honestly." (a hub re-entry line she says before the player speaks), then after "You're still here? It's late." she says "Oh! You made me jump. I only came back for my charger." / "Is Ms. Sterling expecting you this late?". "I'm just off" then being startled reads out of order: the return-visit line and the first-night-meeting line run into each other. NEW AWKWARD (minor). "She is. Goodnight." now gets "Night, then. Don't let the guard scare you." (fix works). Reopening again repeats "I'm just off, honestly." + the same single choice.
- (4) Guard first excuse menu (4 options): "I work here...", "Sterling asked me...", "Building maintenance...", "[I'm with SAFETYNET. This is an active ENTROPY investigation.]" (shown without brackets in the harness text). PASS. Entered the executive wing, HaX's guard-warning text and "Sterling's office is keyed, not..." hint were already in the thread before reaching him.
- (1 setup) Took the lie route: "Building maintenance" -> "Emergency call" -> small talk -> "Right. Thanks." The guard challenged me ("A torch beam swings round and settles on you." / "Hey! What are you doing here?"), so `guard_challenged` should be set.
- (9) Guard lines read: "Double shift tonight. On till six.", "...anyone where they shouldn't be. Like you, possibly.", "Pays the mortgage. And nobody talks to me after nine, which suits me.", "Ms. Sterling? She's the boss. Signs my wages, never learnt my name.", "It's an office, mate." All read cleanly and give him some character.
- NEW AWKWARD / FAIL-ish: after "Right. Thanks." (from the exits menu) the guard gives no reply and the conversation stays open with "Maybe we can work something out." / "I'll let you get on." Reopening the guard afterwards shows a BLANK screen: no speaker line, only those two choice buttons (screenshot s04-guard-reopen.png). Same class of blank hub reopen that was fixed for the receptionist and Victoria, but the guard's hub was not on the fix list.

### Night: office, drive, CyberChef
- (2) "Where do I stand?" night, no flags, guard challenged: "Nothing in from their network yet. VM terminal's in the server room. Start with a scan." / "Sterling's office is still unread..." / "The guard's had a look at you. He'll be watching now." After the PC was read and the drive taken but undecoded: "That drive's still unread. CyberChef workstation, two passes." (+ guard line). After decoding: network line + guard line only (no office, no drive). Four distinct states seen at night, all correct for what I had done.
- (5) Object names: "CyberChef Workstation" and "Drop-Site Terminal" (room list). HaX drive call: "Run it through the CyberChef workstation and tell me what it says." Toast on opening the laptop: "That's their CyberChef workstation." Hint topic: "Take the CyberChef workstation in the server room." All match. Laptop window title is "Crypto Workstation" (screenshot s07-cyberchef.png), a third name for the same object; not wrong but not matching either.
- Drive earned in-game: base64 text read from the drive's own viewer (inventory), pasted into the real CyberChef (From Base64, ROT13), output "PHASE 2 -- INFRASTRUCTURE... Winter." Then picked the Winter answer in the HaX call: "...That's the Architect. Zero Day supplies, Critical Mass executes, and St. Catherine's was the rehearsal." / "Two layers, and you peeled both. We take it to Command tonight."
- Note: the harness `enter` cannot leave the executive office or the exec wing without manual `walk` (not a game finding; doorway-recording quirk).

### Reload (one, after the drive was decoded, night, flags not yet submitted)
- Sync, `location.reload()`: title screen, then "Mission Brief" note ("Somebody sold Ghost the way into St. Catherine's...") which reads fine. Player back at reception (160,144), inventory intact (drive, roster, email, laptop), globals intact (`guard_challenged`, `directive_decoded`, `exec_office_entered`). HaX thread intact (68 bubbles, all re-stamped to the reload minute, same as the earlier report). Walking into the main hallway: no night cutscene replay, no repeated "You're in" text. The server-room door showed `locked:false` but needed an interact to open before `enter` worked (harness-level, not a game finding).

### Flags, revelation call, Danny
- Flags 1-3 each get one short HaX line ("Scan's in...", "FTP's in...", "Price list's in..."). (2) "Where do I stand?" with three flags: "Recon, FTP and pricing are in. Just distcc left -- that's the logs, that's the case."
- (3) Revelation call (distcc last, drive already decoded, roster taken): "Agent, I've got the distcc logs you just submitted." ... after my choice: "That's the line a jury remembers. Keep it." / "And it lines up with the directive you read me. Phase 2 has a supplier, and now a ledger." Then "I know you will. Go." / "Finish up, then Sterling. And be careful -- reasonable as she sounds, she signed that invoice." NOT told to find the drive or the directive. PASS. Minor: "I know you will. Go." is a leftover mentor-style filler after the player's "I'll get everything".
- All-flags text arrives after the call: "Everything's off their network. Sterling's waiting in the conference room. Want a say in Danny Foster's fate? His office is in the executive wing -- go there first, then her." (the harness DOM read lagged behind the screen, order was right).
- (2) "Where do I stand?" with all four flags, drive decoded: "Network's stripped and the case is made. Danny Foster's office first, if you want a say in his end. Then Sterling." No drive line (correct, it was decoded). It repeats the all-flags text's Danny/Sterling advice back to back.
- (8) Danny first visit: opener ("The office is small and lived-in..." / "You're not one of ours. I'd know you." / "You're here about the hospital. Aren't you.") then choices; the "She lied to you about the client" branch reads well, and "Come in and testify" -> "*shakily* You'd do that." -> one-option "Sterling goes down for her part..." -> "Everything. Yes. God, yes." Return visit: opens with "Everything. Yes. God, yes." again (his last line of the first meeting replayed as the return-visit opener) plus the single choice "Danny's on the phone to SAFETYNET. Leave him to it." (screenshot s08-danny-return.png). Not blank and not the first-meeting opener; but it is a repeated line. NEW AWKWARD (minor).
