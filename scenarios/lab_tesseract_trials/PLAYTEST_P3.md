# Keyholder Trials: playtest segment 3 (workshop and finale)

Date 2026-10-06. Server: keyless :3001, headless Chromium, `--speed fast`. Source of steps: `TESTING_WALKTHROUGH.md` steps 19-26 and the endings table (walkthrough, not a solution guide). Scratch folder: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-p3/`.

## Which question this answers

Plumbing (does each step fire) plus unexpected behaviour (early call close, reload in the decision window, send-then-warn, a player who skips the report). Not a solvability pass for steps 1-18: those were set up by typing answers read from the game record, marked "exercised, not earned" below. Game 1580 earned L10, the report decode, the hash check, the signature check and the beacon token in the in-game CyberChef, from inputs fetched in the world.

## Games and logs

| Game | Ending | Setup | Session log | Credits screenshot |
|---|---|---|---|---|
| 1580 | double (B) | steps 1-6 setup typed; L7 password, hole, IV, AES key, L8b passphrase, L10 and token all **decoded in-game** | `session-1580.jsonl` (839 commands) | `g1580-credits.png` |
| 1581 | sent (A) plus late warning | all locks typed from the DB (exercised, not earned); call closed at its first line | `session-1581.jsonl` | `g1581-credits.png` |
| 1582 | refused (C), in the call | as 1581 | `session-1582.jsonl` | `g1582-credits.png` |
| 1583 | blown (D) | as 1581; "I'll think about it", then HaX "It's a trap" | `session-1583.jsonl` | `g1583-credits.png` |

All logs are in the scratch folder above. Other screenshots: `g1580-call.png` (video call), `g1580-verify.png` (CyberChef), `g1580-reload.png` (title screen after reload), `g1581-device-offer.png`. Setup scripts: `setup.sh`, `start.sh`, `codes.rb`, `lib.sh` (CyberChef driver) in the same folder.

### verify-run.rb output (full)

Game 1580:
```
game            1580  (mission 79)
created         2026-10-06 02:30:57 UTC
last write      2026-10-06 02:48:37 UTC
played for      1060s of wall clock
current room    "foyer"
unlocked rooms  7: foyer, teaching_lab, common_room, corridor, library, sidhu_office, workshop
unlocked objs   9: cryptosecure_lockbox, candidate_locker_4, keyholder_guest_terminal, special_collections_safe, pigeonholes, lab_account_pc, cryptosecure_drop_box, relay_terminal, hacktivity_scoreboard
inventory       16: Your Phone, Notepad, Comms Discipline, Keyholder Leaflet, Lab Laptop (CyberChef), Field Note 1: Bits, Bytes, Bases, CyberChef, Field Note 2: Characters Are Numbers, Field Note 3: Hex and Binary, Trial II Card, Keyholder Device, Trial III Card, Tag on the Drop Box, Brass Key, Final Trial Card, Field Note 7: Hashes, Field Note 10: Signatures
NPCs met        10: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, tom_shaw, megan_oyelaran, cliffe_schreuders, sidhu_selvarajan, cliffe_workshop
flags submitted 0: 
globals set     31: briefing_played, comms_had, corridor_open, decision_made, drop_box_open, ending, engine_tutorial_declined, fn04_offered, fn05_offered, fn06_offered, fn07_had, fn07_offered, fn08_offered, fn09_offered, fn10_had, fn10_offered, ghost_greeted, ghost_offer_made, guest_terminal_open, library_open, lockbox_open, locker_open, megan_choice, pigeonholes_open, player_name, relay_opened, report_read_claimed, special_collections_open, start_debrief_cutscene, warned_out_of_band, workshop_open

VERDICT: progress recorded — 6 rooms beyond the first, 9 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```
Game 1581:
```
game            1581  (mission 79)
created         2026-10-06 02:49:10 UTC
last write      2026-10-06 02:55:47 UTC
played for      397s of wall clock
current room    "foyer"
unlocked rooms  6: foyer, teaching_lab, common_room, corridor, library, workshop
unlocked objs   8: cryptosecure_lockbox, candidate_locker_4, keyholder_guest_terminal, special_collections_safe, pigeonholes, cryptosecure_drop_box, relay_terminal, hacktivity_scoreboard
inventory       13: Your Phone, Notepad, Comms Discipline, Keyholder Leaflet, Lab Laptop (CyberChef), Field Note 1: Bits, Bytes, Bases, CyberChef, Field Note 2: Characters Are Numbers, Field Note 3: Hex and Binary, Trial II Card, Keyholder Device, Trial III Card, Brass Key, Final Trial Card
NPCs met        9: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, tom_shaw, megan_oyelaran, cliffe_schreuders, cliffe_workshop
flags submitted 0: 
globals set     30: briefing_played, comms_had, corridor_open, decision_made, drop_box_open, ending, engine_tutorial_declined, fn04_offered, fn05_offered, fn06_offered, fn07_offered, fn08_offered, fn09_offered, fn10_offered, ghost_greeted, ghost_offer_made, guest_terminal_open, late_warning, library_open, lockbox_open, locker_open, megan_choice, pigeonholes_open, player_name, relay_opened, report_read_claimed, special_collections_open, start_debrief_cutscene, warned_out_of_band, workshop_open

VERDICT: progress recorded — 5 rooms beyond the first, 8 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```
Game 1582:
```
game            1582  (mission 79)
created         2026-10-06 02:55:56 UTC
last write      2026-10-06 03:02:09 UTC
played for      374s of wall clock
current room    "foyer"
unlocked rooms  6: foyer, teaching_lab, common_room, corridor, library, workshop
unlocked objs   7: cryptosecure_lockbox, candidate_locker_4, keyholder_guest_terminal, special_collections_safe, pigeonholes, cryptosecure_drop_box, relay_terminal
inventory       13: Your Phone, Notepad, Comms Discipline, Keyholder Leaflet, Lab Laptop (CyberChef), Field Note 1: Bits, Bytes, Bases, CyberChef, Field Note 2: Characters Are Numbers, Field Note 3: Hex and Binary, Trial II Card, Keyholder Device, Trial III Card, Brass Key, Final Trial Card
NPCs met        9: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, tom_shaw, megan_oyelaran, cliffe_schreuders, cliffe_workshop
flags submitted 0: 
globals set     29: briefing_played, comms_had, corridor_open, decision_made, drop_box_open, ending, engine_tutorial_declined, fn04_offered, fn05_offered, fn06_offered, fn07_offered, fn08_offered, fn09_offered, fn10_offered, ghost_greeted, ghost_offer_made, guest_terminal_open, library_open, lockbox_open, locker_open, megan_choice, pigeonholes_open, player_name, refusal_reported, relay_opened, report_read_claimed, special_collections_open, start_debrief_cutscene, workshop_open

VERDICT: progress recorded — 5 rooms beyond the first, 7 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```
Game 1583:
```
game            1583  (mission 79)
created         2026-10-06 02:56:07 UTC
last write      2026-10-06 03:04:42 UTC
played for      515s of wall clock
current room    "foyer"
unlocked rooms  6: foyer, teaching_lab, common_room, corridor, library, workshop
unlocked objs   7: cryptosecure_lockbox, candidate_locker_4, keyholder_guest_terminal, special_collections_safe, pigeonholes, cryptosecure_drop_box, relay_terminal
inventory       13: Your Phone, Notepad, Comms Discipline, Keyholder Leaflet, Lab Laptop (CyberChef), Field Note 1: Bits, Bytes, Bases, CyberChef, Field Note 2: Characters Are Numbers, Field Note 3: Hex and Binary, Trial II Card, Keyholder Device, Trial III Card, Brass Key, Final Trial Card
NPCs met        9: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, tom_shaw, megan_oyelaran, cliffe_schreuders, cliffe_workshop
flags submitted 0: 
globals set     28: briefing_played, comms_had, corridor_open, decision_made, drop_box_open, ending, engine_tutorial_declined, fn04_offered, fn05_offered, fn06_offered, fn07_offered, fn08_offered, fn09_offered, fn10_offered, ghost_greeted, ghost_offer_made, guest_terminal_open, library_open, lockbox_open, locker_open, megan_choice, pigeonholes_open, player_name, relay_opened, report_read_claimed, special_collections_open, start_debrief_cutscene, workshop_open

VERDICT: progress recorded — 5 rooms beyond the first, 7 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```
Server record for all four: `Game#status` = `completed` (checked with a Rails runner after the credits). verify-run.rb's "flags submitted 0" is correct: this scenario has no flag stations.

## Earned-secrets table

Game 1580 (the earned run). Setup typed from the DB before this point: L1 lockbox word, L2 PIN, L3 password, L4 corridor word, L5 library PIN, L6 safe word (steps 4-10). Those rows are **exercised, not earned**, and are owned by segments 1 and 2.

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| L1 to L6 answers (lockbox, locker, terminal, corridor, library, safe) | typed from DB | not fetched this segment | setup | **no (exercised, not earned)** |
| Vigenère key (L7) | `witness` | `ledger_whiteboard`, Sidhu's office, block 4 data | before L7 decode | yes |
| Pigeonhole password | `letterbox-<NN>` | `trial_vii.txt` (library safe) decoded in CyberChef with `witness` | L7 decode | yes |
| Pigeonhole number | four | same decode | L7 decode | yes |
| IV | 32 hex | same decode | L7 decode | yes |
| RSA private key | PEM | `private_key.pem` on `lab_account_pc` (teaching lab) | before L8a | yes |
| Envelope | Base64 | `Pigeonhole 4` in the opened pigeonholes | before L8a | yes |
| AES key | 32 hex | From Base64, RSA Decrypt in CyberChef | L8a | yes |
| Drop box passphrase (L8b) | `wardkey-70` | `drop_box_tag` ciphertext, AES Decrypt with the key and IV above | L8b | yes |
| Brass key | (item) | `cryptosecure_drop_box` | after L8b | yes |
| Workshop door (L9) | `brass_key` | drop box | step 20 | yes |
| Relay terminal (L10) | `32ca66ec` | SHA2-256 appended under AES Decrypt in the same recipe, first 8 hex | step 21 | yes |
| Report content, token | `kestrel-3710` | `report.b64` through From Base64 | step 23 | yes |
| Scoreboard (ending B) | `kestrel-3710` | the decoded token above | step 24 | yes |

Games 1581 to 1583: every lock answer, the L10 answer and (1581) the scoreboard token were typed from the game record. **All exercised, not earned.** Those games test the endings, the debrief and the credits only. In 1582 and 1583 the report was never opened.

Steps 1-18 are therefore unproven by this segment. Steps 19-26 are proven on the earned route in game 1580 only.

## Step results

| Step | Result | Notes |
|---|---|---|
| 19 Drop box contents (`brass_key`, `final_trial_card`) | pass | 1580. Card text matches the walkthrough recipe (SHA2, Size 256, append under AES). |
| 20 Workshop door, key lock (L9) | pass | 1580, 1581, 1582, 1583. `lock` selected "Brass Key" and inserted it. Task `open_workshop` done; `workshop_open` true. Door is labelled "Workshop (knock)". HaX and Keyholder texts arrived on entry. |
| 20 Cliffe in workshop, "Door was locked for a reason, mate..." | pass | First line in every game. Shows up in the conversation, not as a bark on entry. |
| 21 L10 relay terminal | pass | 1580 earned (`32ca66ec`, matches the game record). D1 persistence: closing and reopening the laptop kept recipe (AES Decrypt, SHA2), input and output. |
| 22 Ghost video call fires by itself on `relay_opened` | pass | All four games. Opens on its own, once. `ghost_offer_made` true. |
| 22 Call choices What's in it / Could I change it / What happens if no | pass | 1580, each loops back. Content as per walkthrough. |
| 22 "I'll think about it" exits; closing line "Your terminal's still open" | pass | 1580, 1583. |
| 22 Early close of the call at the first line | **fail (major M1)** | 1581, see findings. |
| 22 Reload in the decision window | pass | 1580, see below. |
| 23 Reopen terminal after the call | pass | Four files present in 1580. |
| 23 `report_b64` decode | pass | 1580, From Base64 gives the report ending in the 1x1 pixel `<img>`; token read from it. |
| 23 `report_sha256` check | pass | SHA2 (256) of the `report.b64` text equals `report.sha256`. |
| 23 `report_sig` check | pass | From Base64 on the signature, RSA Verify with `keyholder_public.pem`, Message = report text, Raw, SHA-256: "Verified OK". A trailing new line on the message: "Verification Failure". |
| 23 Sidhu, "I've been given something signed" | pass | 1580. "It verifies... It does not tell you whether you should send it." Choice stays on the hub afterwards (minor m4). |
| 23 Cliffe between call and decision | pass | 1580: "Scoreboard's been quiet today. Takes flags from anyone..." (step shown before decision). |
| 24 Ending A, send | pass | 1581. `ending=sent`; HaX texts "Received. Opening it now." and "My phone just did something it shouldn't"; Cliffe "Hope that was worth it." |
| 24 Ending B, double agent | pass | 1580. Token typed into scoreboard: `warned_out_of_band` true, `submission_accepted.txt` read; then send gave `ending=double`; Cliffe "Interesting choice of channel." |
| 24 Send then warn | pass with a gap | 1581. `ending` stayed `sent`, `late_warning` true. The debrief ignores it (m2). |
| 24 Ending C, refuse | pass | 1582, in the call. "CONTACT CLOSED." HaX "Your end's gone quiet. Talk to me." HaX hub then showed "I turned the Keyholder down." Jordan hidden (`visible:false`). Cliffe "Good. Some offers you hear out and still say no to." |
| 24 Ending D, blown | pass | 1583. Ghost "I did say it listens." HaX "Copy. Leave by the front. Don't run. Call me when you're clear." Cliffe "Phones. Never trusted them." |
| 24 Ghost device "Sending it now." | pass | 1581. Reply "Then send it. Your handler's phone, not this one." No ending set (as designed). |
| 25 Debrief opening matches the ending | pass | A, B, C, D each opened with its own text (see debrief table). |
| 25 `hear_debrief` on last line | pass | Game record `completed` in all four. |
| 26 Credits | pass | Read through a MutationObserver on `#bv-cr-label`. Titles: RECRUITED (sent, double), DECLINED (refused, blown). |
| Ghost's two Keyholder-device `the_offer_again` lines | pass | 1581. |

### Reload in the decision window (1580)

After the call closed, before deciding: `sync`, then page reload. The title screen showed "Continue?"; pressing Enter (via `mg pressKey`) resumed. Rooms stayed unlocked, `relay_opened`, `ghost_offer_made` and the tasks (`answer_the_keyholder`, `warn_handler (opt)`, `hear_debrief`) were intact, the inventory was intact, and the call did not replay. HaX's phone showed her full history, "I'm here. Careful what you say on this line.", and the choices "Sending you my report now." and "It's a trap. Don't open anything from me." Both endings stayed available (B was then completed). The player was put back at the foyer start position after the reload (see m5).

### Debrief against what happened in the run

| Game / ending | Debrief checks |
|---|---|
| 1580 double | Debrief mentions the flag ("Thank you for the flag"): the token was submitted. Decoy flat in Leeds matches the warned-then-sent route. Megan and Jordan lines are the no-choice defaults. Credits: "Decoy location live. Ghost is watching it." Correct. |
| 1581 sent, unread | Debrief asks "Did you read it before you sent it?" and the answer "No. I didn't decode it." is true here. Late warning (token submitted after sending) is **not mentioned**; the walkthrough says it adds "You tried. It was already open." That line does not exist in `closing_debrief.ink` (m2). Credits "REPORT: Sent unread." follows the player's answer. |
| 1582 refused | Opening "You said no to Ghost on their own terms" is correct. Pixel explanation is given although the player never opened the report (m3). |
| 1583 blown | "A clean no is worth something. It's also the last time they'll talk to you." is wrong here: the player never said no to Ghost (M2). "You were right about the report, mind. Nobody opened it." is fine. |

Common to all four: "You can read Base64 now. Most people who'd have opened that report can't." Fine in 1580. In 1581 to 1583 the harness never decoded anything, so this tests nothing about a real player. In 1581 it follows the player saying they didn't decode the report (m3).

## Findings

| # | Severity | Finding | Evidence |
|---|---|---|---|
| M1 | **major** | **Closing the video call at its first line means the offer is never made.** `ghost_offer_made` is set when the call starts, so the Keyholder device then opens at "Back. So you've decided." with choices Sending it now / No / Still thinking. The player never hears the offer, the price of each route or that the report is signed. The walkthrough edge case says the device's `route` knot delivers the offer instead. It does not. The HaX hub's send / trap choices are available, so the game can still finish, but the choice is made blind. | 1581: `End Conversation` after two lines, then device. `g1581-device-offer.png`, `session-1581.jsonl` |
| M2 | **major** | **Blown debrief says "A clean no is worth something."** The branch for `refused` and `blown` shares `why_you`. In `blown` the player said "I'll think about it" (or heard nothing) and then warned HaX. They never said no to Ghost. Contradicts what happened. | 1583 `g1583-debrief.txt`; `closing_debrief.ink` `why_you` |
| m1 | minor | **Stale or mis-timed texts after the decision.** In 1582 (refused) HaX's old nudge "If you want to check a signature, I have a field note." arrives after "CONTACT CLOSED." and after "Your end's gone quiet." Same in 1583 (blown) just before Ghost's "I did say it listens." | `session-1582.jsonl`, `session-1583.jsonl` barks |
| m2 | minor | **Late warning has no payoff.** `late_warning` is read only inside `opening_double`, where it can never be true (warning comes first in `double`). Sent-then-warned (1581) gets the plain `sent` debrief and no thanks for the token, although the player submitted it and the scoreboard accepted it. The walkthrough's "You tried. It was already open." is not in the ink. Same for refuse/blown plus warning: the debrief tail exists in ink (`warned_out_of_band`) but was not run this segment. | 1581 `g1581-debrief.txt` |
| m3 | minor | **Debrief assumes the report was read.** The pixel explanation ("fetched from Ghost's server the moment anyone opens the report") and "You can read Base64 now. Most people who'd have opened that report can't." play for every ending, including a player who refused or sent the report unread and said so. | 1581, 1582, 1583 |
| m4 | minor | **Sidhu's hub repeats.** After the signed-report scene, "I've been given something signed. Will you look?" is still offered and replays the scene verbatim; the hub line "You have the look of someone holding a document." repeats. | 1580 transcript in `session-1580.jsonl` |
| m5 | minor | **Position is not restored on reload.** After the reload in 1580 the player was back at the foyer start point (160,144), not in the workshop. State, rooms and inventory were fine. Probably engine-wide rather than this scenario. | `g1580-reload.png`, `session-1580.jsonl` |
| m6 | minor | **Text-file viewer opened from a container claims `returnsToContainer: true` but closing it (x or Close) returns to the world**, not the container. Seen in the safe, the lab PC, the relay terminal and the guest terminal. Notes viewers (cards) do return. Not a blocker: a player reopens the container. Suspect engine or harness; not ruled out. | 1580 `mg close` results (`returnedToContainer:false`) |
| m7 | minor | **Keyholder device chat opens late.** Taking the device from the lockbox returns control, and the Ghost chat appears a moment later over the main world, which refused movement until closed ("minigame-active"). A player who walks off at once is interrupted mid-walk. | 1580 first lockbox sequence |
| m8 | minor | **Jordan's and Sidhu's hub prompts show up twice in transcripts** ("Any questions? I get a referral bonus", "Owt else?"). Likely a harness double-read of the same line, not a game fault. Not counted. | n/a |
| m9 | minor | **Not verified:** Cliffe in the common room after `workshop_open`. `room` still lists `cliffe_schreuders` as `visible:true` there, while the walkthrough says he is hidden. I could not walk there (path stopped at the workshop door), so I could not tell whether the sprite is gone. Please check by eye. | 1582 `room common_room` |

Counts: 0 blockers, 2 majors, 8 minors (m8 is a harness note, not counted: 0/2/8 excludes it, 0/2/9 includes it).

## What was not tested

- Reload during the debrief (walkthrough edge case).
- Megan side aim and `megan_choice` variants in the debrief and credits.
- Refuse via the Keyholder device (`the_offer_again`) rather than in the call.
- Refuse or blown with a prior scoreboard warning (debrief "And you sent me the token" lines).
- Leaving the Keyholder device in the lockbox (`ghost_greeted` false path).
- Real audio: all runs on :3001 (no TTS).
- Cliffe's `cliffe_build_screen` variants.
