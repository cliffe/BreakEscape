# m09 Digital Archaeology: phase 5 playtest, the struggling first-time player

Plumbing plus unexpected-behaviour run (questions 1 and 2). :3001 keyless, headless (load ~22), fast speed. Persona: misses hints, tries wrong codes, wanders, backs out of things.

Scratch and logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09-struggler/` (session logs `*-session.jsonl`, screenshots in `shots/`, import files `imp_rich.json`, `imp_maya.json`).

## What was run, and on which commit

The tree moved under the run (another builder was editing m09 ink, and commits landed while I played). I did not pin a checkout. HEAD at each point:

| Run | Game | What | HEAD when started |
|---|---|---|---|
| Cold run | 3597 | no imports, briefing to debrief and credits, struggler | 3e2bad5d (plus the uncommitted m09 edits in the tree) |
| Noor cold check | 3649 | `--start-room front_desk` | 3e2bad5d or later, not re-read |
| Bin F5 | 3650 | `--start-room restricted_stacks`, flag 1 head-start | not re-read |
| Handover / Tran | 3652 | same head start | not re-read |
| Dillard | 3656, 3657 | imports with `m01_maya_ko`, start open_stacks | not re-read |
| Rich run (briefing, Noor, Victoria door, Tran door route) | 3659 | imports m01-m08, see below | ae7b51f4a |
| Torres ring | 3663 | rich imports, flags 1-2 head-started | 810a73520 |
| Gary first try | 3666 | rich imports, tape room start | e11098393 |

Treat the cold run and the early check games as tested on 3e2bad5d-or-slightly-later. If a finding below involves a line another builder has since edited, re-check it on HEAD.

Rich save (`imp_rich.json`): m01 `recruit`, m02 `gary_protected` true, m03 `victoria_fate` recruited, m05 `found_pipeline_list` true, `recruiter_deal_accepted` false, `torres_turned` true, m04-m08 plausible values, all eight `completed` true.

Flags: VM flags were submitted at the drop terminal and Tomb Beta link with the session `--flags` stand-ins, or head-started with `--submit-flag`. They are "exercised, not earned". Codes: the BONEYARD key and the 060216 PIN were earned in game from the Shelf Marks chart and the rent ledger (cold run). The CyberChef Vigenere decode was done in the in-game workstation iframe. I did know the answers from the static walkthrough, so "earned" here means read from the in-game clue, not discovered blind. HL2015-0477 came from HaX's call.

Harness notes: `bridge pressKey` is refused while a minigame is open, so every Esc below was a synthetic `keydown` Escape on `document` (what the minigame's own handler listens for). `lock` with the PIN cracker typed the code 40 times (harness artefact, not a game finding).

## Check list

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Noor's clone button, cold start: cancel, then save | PASS | Game 3649. Cover "Audit", then "Lean in over her list": EM4100 read opens. Cancel returns to Noor ("What now? I've got carts to load.") with the clone option still listed. Second pick, Save: option gone, `staff_card_cloned` true, staff passage opens with the cloned card. Shots `g2_a_flipper.png`, `g2_b_after_cancel.png`, `g2_c_after_save.png`; log `g2-session.jsonl`. |
| 2 | m05 warned-in-time route at Noor | PASS | Game 3659. Noor: "You're the one they said would come. Here, my card." Inventory then holds "Staff Card, N. Haddad"; no clone option; door opens "with Staff Card, N. Haddad". Log `rich-session.jsonl`. |
| 3 | Sorensen's hatch: Esc at the first choice, reopen | PASS | Game 3597. Esc at "That's right... / I'll stand." closed the chat; re-interact replays "The lease-holder's auditor. Of course. There's a chair on your side." and the same two choices. (The narrator beat before her line does not replay.) |
| 4 | Bin choice, then Esc at once | PASS | Game 3597. "Pull Derek's file through", Esc in the same call batch: `cage_bin: derek_file`, `bin_chosen` true, and "Asset File: D. Lawson" is in the notepad. |
| 5 | Bin choice, then F5 at about 1 s | PASS | Game 3650. Letters chosen, reload at 1 s: `cage_bin: letters`, `bin_chosen` true, notepad holds "Initiative to Social Fabric, Handoff 14". |
| 6 | Victoria's door scene can't be closed with Esc | PASS | Game 3659. Esc during HaX's lines and again at the three-way choice: chat stayed open both times. Shot `r_victoria_door_esc.png`. |
| 7 | Dillard: Esc on his line, he is still hostile | PASS | Game 3657. A poll armed before entering the closet sent Esc as soon as Dillard's chat showed. Events: `npc_hostile_state_changed archive_guard true`, no revert. Walking toward him later cost 10 HP (hp 100 to 90). Log `g4b-session.jsonl`. |
| 8 | Old Coyote: Esc on the first challenge, then spotted again, covers offered | PASS | Game 3597. Esc closed the challenge; about 5 s later "You again." with the same three covers. The audit cover passed ("Go ahead."). |
| 9 | Torres's ring after the H&L box: click, cancel, come back, open | PASS | Game 3663. Click box, Cancel: Torres rings 1.5 s later (phone chat "David Torres", gives the file-number clue). Closed it, left and returned, typed HL2015-0477 (hyphen accepted), box opens, Placement Record taken. |
| 10 | Gary's call on a first-try correct salvage code | PASS | Game 3666. Correct code first time; Gary rings: "HaX says you're through that keypad already. Didn't need me, then." The call rings on the unlock attempt, so the variant text is correct only because the attempt succeeded; fine. |
| 11 | Tran topic: hatch, handover, door routes | PASS (three routes) | Hatch (3597): "The letters went in her feed. It's a fight, or you leave him to it." after Derek's file. Handover (3652): "You never chose, so take Mr. Lawson's file", then Tran topic: same letters line. Door (3659): after "Take the letters": "You've got the letters. He's the J.T. in them. Show him." All three match the bin. |
| 12 | Keypad hint tiers | PASS | Game 3597. After three wrong tries ("BONEYARD", the raw cipher, "LEWIS") HaX hub "The keypad on the cage." gives tier 1 "Just the code, not the label... Look at the wall by that keypad.", tier 2 "The key is the salvage bay's word, on the chart by the keypad.", tier 3 "Vigenere Decode, on your workstation. Key: the salvage bay's word." |
| 13 | Reel deck before the identity scene shows neither Tesseract's name nor portrait | **FAIL** | Game 3597. The text is correct (speaker "Narrator", "A man clears his throat in a lecture hall"), but the chat shows the `adrian_tesseract` talk portrait of a grey-haired man in glasses. Shot `shots/c11_reeldeck.png`. After the identity scene the same portrait appears with "Dr Adrian Tesseract (recording)". See finding M-1. |

## Findings

### Blocker

None.

### Major

**M-1. The reel deck shows Tesseract's face before the identity scene (check 13 fails).** Repro: cold start, get into the tape room (Tape Store card from the safe), click the Reel Deck. Narrator line plays over the Architect's portrait. For a player who has played m07 the face is a spoiler for the Tomb Beta reveal. For a cold-start player it is a face with no name, which is a less serious tease. Cause: NPC `alpha_recording` in the ERB (line ~2199) always uses `adrian_tesseract_talk.png` as its portrait, and the first branch of `deck` (`not identity_scene_done`) is spoken by the Narrator. Fix idea: a second hidden NPC (or a textVariant on the avatar) with a neutral reel-to-reel image for the pre-identity knot. Evidence: `shots/c11_reeldeck.png`.

### Minor

**m-1. HaX warns "The notice is still on his box. Netherton will ask." right after the player sent it.** Repro: after the identity scene, HaX hub "His notice." then "Send it." (reply: "Vendor's acknowledged..."), then in the same call "Bring me in.": the warning shows. `ink/m09_phone_agent0x99.ink:1019` tests `not albion_notified`, but the send sets the global with a tag and a different local (`notice_sent_here`, line 873), so the ink VAR is stale until the phone is reopened. After closing and reopening the phone the warning is gone. Fix: `{not albion_notified and not notice_sent_here:`.

**m-2. Task, objective and unlock toasts fire twice.** Examples: "Get into the catalogue server and submit the flag", "Objective Complete: Get In And Set Up The Drop Terminal" and "New Objective" twice, 20 s apart (cold run, around the flag-1 submit and closing the station); "Talk to Sorensen at the cage hatch" twice; "Biometric Unlock Successful" twice; "Get inside the archive" three times in game 3663. The second copy appears after the minigame closes (the engine holds info and success toasts raised during a minigame), but the first copy was also shown, so the same toast is queued twice. Evidence: toast timestamps in `cold-session.jsonl` and `r2-session.jsonl`. Probably engine-wide rather than m09.

**m-3. A wrong VM flag at the drop terminal gives "Password Rejected / Failed to enter correct password."** There is no mention of flags. A player who mistypes a flag is told it's a password. Probably the engine's shared message.

**m-4. The Tomb Beta Drop Link lists the catalogue server's two flags under "SUBMITTED FLAGS".** The station says "Accepts flags from: tomb_beta_server" but the list shows `catalogue_server_1` and `_2` with ticks. Looks like a shared submitted list. Confusing at best.

**m-5. The briefing's Torres card says "Arrested" on a save where Torres was turned (`m05_torres_turned` true).** HaX in the rich-run briefing: "Quantum Dynamics. David Torres stole for the Recruiter... Arrested." Torres later phones as a live placement. If "turned" is meant to read differently on the wall, this is a missed variant.

**m-6. Noor is gone for good if the struggler picks "That bonus wasn't for filing."** Cold start, front desk: pick any cover, "How long have you worked for Sorensen?", then the warning line. She says she'll call her dad, HaX says she goes tonight, and she leaves the room at once. The clone option and the staff passage (route A) are lost, though HaX covers it ("She took her card home with her. The shutter's still up.") and route B stays open. Fine as story, but a struggler who was just chatting loses a route with no warning that the choice is final.

**m-7. Dictionary Attack on the RFID flipper gives no visible reply.** Menu "Crack keys first" then "Dictionary Attack (unlikely)": 6 s later the same menu, no failure line. The player can't tell whether it ran. (They can still pick Darkside.)

**m-8. The cage Sorensen's "Put the stamp down" option loops.** Option "It's over. Put the stamp down." returns "When I've finished, dear. You'll want the list to be complete." every time, and the option stays. There is no hint what unlocks it (it turns on once the plan-cabinet file is in hand, then the "Your Architect kept his own papers off your list" line appears). A struggler spends a couple of rounds here; HaX's "That box behind her... She gets to it when you pass her for the cabinet" does cover it.

### Nit

- HaX's thread timestamps all read the same minute (5:25 for the first three bubbles, 6:27 for the next six): fine, but the clock jumps on replies, so the thread reads out of order if sorted by time.
- `moveToNear sorensen_hatch` reports `arrived-but-outside-plain-range`, but `interact` works from there. Harness reading, not a player issue.
- Page text for the first dock call: the Tran bubble is the last line and the phone closes on it, as an earlier pass already noted. I saw the Tran text in the thread after, so it is in the history.
- HaX at the identity scene: "He was mine. I wanted the other thirteen." is cryptic on a cold start (no m07/m08 context).

## What passed without trouble (for the record)

Cold run reached the credits: briefing (HaX wall, choices), dock call, front desk lockpick, trolley list and box notes, Noor, open stacks and Old Coyote, H&L box wrong codes (three attempts closes the pad; reopening resets), reading room (Case File, notebook scan, drop terminal screen, laptop), flag 1 and the field-guide thread, hatch, RFID Darkside clone, stamp dusting (wrong powder allowed at lower quality, wrong pattern and wrong card each give feedback), cage gate with the clone, cage Sorensen scenes, plan cabinet via lifted print, Nightshade's file and the "same hand" match, flag 2, WREN reveal, the Recruiter call (deck choice), office opened by HaX, safe PIN 060216 (cracker feedback on wrong tries), the Reading, tape room, salvage keypad, flag 4 before flag 3 ("Owner first"), flag 3 and the identity scene, Tesseract's call, the Alpha tape clip after the identity scene (Tesseract named, as it should), optional Albion notice, the "Bring me in" warning ("Not yet. I want to finish something."), debrief, credits. Credits read from `#bv-cr-label` via a MutationObserver: Tesseract proved, WREN, notice sent, Haddad "Not allowed to ring her father", "Saved from the bins: Derek Lawson's file", "The Recruiter: Kept her name. You kept his tapes."

verify-run (game 3597): 8 rooms beyond the first, 4 flags submitted, tasks_completed 25, score 95, `report_to_netherton` complete.

## The struggler's narrative

**Briefing.** Clear and gripping. HaX walking the wall of cards is the best opening I have seen in this campaign, and the two blank cards earn the "Who are the last two?" click. The cold-start wall is thin on detail but it never leaves you lost. I said "Say nothing" to Kowalczyk and nothing happened, which felt right.

**Dock to the front desk (about 4 minutes).** HaX's call told me the office door and the shutter were the options, and picking the door put me at the lock-pick, which I can't do on a keyboard bot but a human can. The first time I wasn't sure what "set the laptop up in the reading room" meant for a few minutes, because the objective list says it but the first thing I did was the front desk. I read the run sheet and the box under the desk (nice texture) and then talked to Noor.

**Where I got stuck (the longest stretch, roughly 6 minutes).** I picked "That bonus wasn't for filing" because it sounded clever, and Noor walked out. I then spent time trying the staff door ("Access denied. No keycard, and nothing saved on the cloner." was a good message) before working out that the other route runs through the open stacks. Old Coyote's challenge took two tries with Esc to understand (he comes back, which is fine and a little funny). I tried to open the Harwick & Lowe box three times with guesses before I had anything to guess from. The pad closes after three tries, then you can try again, so it never punished me.

**Reading room and flag 1.** I clicked the Drop Terminal before the laptop, typed `flag{test}` and got "Password Rejected", a wrong-sounding message for a flag. The laptop panel tells you it's a VM, which is the point where a normal player goes to the lab sheet. The field guide thread is a bit of a wall of HaX text but it clearly said what to do next.

**The restricted stacks (the best part).** The hatch conversation, with the card reel swinging near my cloner, made me laugh. The RFID flipper steps are clear. I clicked Dictionary Attack and nothing visible happened for six seconds (m-7), so I wondered if it was broken, then Darkside worked. Cloning, then using the card on the gate, was satisfying. The rubber stamp dusting is a lovely little puzzle; I picked the wrong powder on purpose and the game just let me carry on with a worse lift, which is kind. Wrong pattern, wrong card, each gave a useful "no" with a reason.

**The cage and the file.** Sorensen putting the stamp down only after I held the file, and the line about the Architect keeping his own papers off her list, is a big moment. Before that I clicked "Put the stamp down" twice and got the same reply (m-8), and wasn't sure what I was missing. HaX's hub covered it, but only if you ask.

**Ledger, Recruiter and WREN.** The WREN beat is the reveal, and the Recruiter's call was clear: two buttons, then a deck pick. "Her file" or "The Alpha tapes" has no explanation of what each gets you, and I picked the tapes at random.

**Office, tape store, salvage keypad.** HaX opened the office door for me ("I'm on the door"), so the password pad there never appeared. The safe PIN needed the rent ledger: I got it, but only after trying 123456 and 111111 with the cracker's lights, which helped narrow nothing. The salvage pad was the real stuck point: I typed BONEYARD (wrong), the raw cipher (wrong), then LEWIS (wrong) and was locked out. Asking HaX about the keypad three times gave three increasing hints, and the third one told me the tool. That hint ladder is good; I would have wanted the first tier to arrive on its own after two failures.

**Flag 4 before flag 3.** I tried it in the wrong order and HaX said "Owner first." Then flag 3 produced the identity scene: well written, and "You should have told me" gave a reply with weight. I had to read it twice to understand "He was mine. I wanted the other thirteen."

**Ending.** "Bring me in" warned me ("Not yet. I want to finish something.") and I did the notice first. The debrief hub, Haddad in the hotel, the card with two names and then the credits all land. The only wobble was HaX telling me the notice was still on his box right after I sent it (m-1).

**Was it fun?** Yes. Was it clear what to do next? Mostly: HaX's hub and the objectives panel carried me through, and every wrong turn I took either recovered or told me why. The places I lost minutes were Noor (an irreversible choice with no cue), the flipper's silent dictionary attack, and the keypad (hint ladder only on request).

**What I learned.** Do the hatch before the gate, take the print off the stamp, take the file with Sorensen in the room, Tesseract's name is in HaX's credential line, and the order of the three late flags matters.
