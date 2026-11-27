# m05 Insider Trading: design re-review 2 (pass 4)

Reviewer: fresh adversarial re-review after the round-2 fixes, 2 October 2026. Read-only apart from this file. Line numbers are for the working tree on that date (uncommitted pass-4 changes).

## 1. Checks run

All static; no browser test. Output is in `scratchpad/m05-rereview2/`.

- `ruby scripts/validate_scenario.rb …/scenario.json.erb`: exit 0, no INVALID. The same three intended co-fire warnings (flag-3 pair, the `object_interacted` trio, the four Torres-close nags). The validator regenerates `dungeon_graph.*` as a side effect, as before.
- `python3 scripts/check_door_alignment.py`: 9/9 OK.
- `node scripts/ink_runtime_check/reopencheck.mjs … m05_insider_trading`: 0 problems (HaX 1800 reopens, Recruiter 1800, Patricia's phone 1800). `missions.json` carries `found_halloran_vetting`, `door_log_reasoned` and `it_notice_read` (:657-659).
- Every compiled `.json` is newer than its `.ink`.
- `tagdiff.mjs`: 529 structural differences against HEAD (87 + 31 + 11 + 20 + 82 + 130 + 100 + 68), matching the round-2 note. All 65 removals are the old single-path naming knots, the old `stop_upload` tail and the old ungated hub choices. The two removed `#exit_conversation` tags were moved: `name_to_hax`'s now sits in `hax_accuse_halloran` (`m05_phone_agent_0x99.ink:369`) and the `On my way.` choice (:402-404); `stop_upload`'s sits in `upload_stopped` (`m05_torres_confrontation.ink:502`). Nothing load-bearing lost.
- `dialoguelint.mjs`: 30 line-len, 77 you-after-choice, 1 banned word, 1 choice-len, 2 not-x-but-y, 1 transition, 1 text-len. The two I spot-checked (Owen's 18-word choice at :237, the debrief's 31-word line at :226) are in HEAD, so they predate this round. None of the round-2 lines I read is flagged. The rest belongs to the dialogue stage.
- Sprites: the recast files exist (`male_nerd_*` and `male_telecom_*` talk, visemes and headshot). Within m05 no two on-screen characters share a sheet.
- SecGen VM content before flag 3 does not name Torres. The manager account's username comes from the organisation dataset (`SecGen/scenarios/break_escape/safetynet/m05_insider_trading.xml:102-127`).

## 2. Round-2 fixes verified

| Fix | Status | Evidence |
|---|---|---|
| M1 files after the log | Done | `m05_npc_patricia_morgan.ink:269-272` refuses until `found_door_log or halloran_questioned`; task retitled (erb:295). But see F1: the files still set `torres_suspected` the moment they are handed over. |
| M1 untidy Halloran file | Done | erb:1544 (late report, no dates, own cancelled interview); sets only `found_halloran_vetting` (:1547). |
| M1 Halloran no longer sets suspicion | Done | `m05_npc_dr_halloran.ink:200-209` sets `halloran_questioned`, `found_halloran_alibi`, `door_log_reasoned` only. Stale comment at erb:924 still says otherwise (F11). |
| M2 reason choice, three routes | Done | Patricia `torres_why_log` (:366-383); phone `phone_torres_why` (:180-200, re-checks `patricia_ko` and `torres_identified`); HaX `hax_torres_why` (:427-449). Scripted log explanation gone; Patricia/HaX confirm after the right pick. Brute-forceable at no cost (F2). |
| Breadth | Done, nominal | Log adds Ben and Amara (erb:73); Ben on all three menus (Patricia :318-320, phone :133-135, HaX :351-353), free refusal; suspect list names eight (:232-233); Owen :156, Halloran :207. See F3. |
| m1 card names, relay vault line | Done | erb:1257-1263, :754-760; HaX :492-496. Task-title toasts still leak on an Owen KO (F6). |
| m2 vault lines | Done | Owen :257-261; HaX :692-696; erb bark :994. |
| m3 Halloran reinstatement | Done | HaX :378-380; Halloran :214-219. |
| m4 Owen's hours, "at night" | Done | Owen :156; Halloran :131. HaX still says "after midnight" (:366, F12). |
| m5 declared-approach line | Done | Debrief :286-288. |
| m6 badge-log credit | Partly | Gated on `door_log_reasoned` (debrief :245-248, erb:152), but Halloran's answer sets it with no reasoning by the player (F4). |
| m7 exposure resting line | Done | Torres :521-524. |
| m8 opener | Done | Torres :87-88. |
| m9 lint | Done | None of the three lines is flagged now. |
| Badge cut in half | Done | Halloran :194; Torres :76. |
| IT notice opens the password asks | Done | erb:1312; Owen :120; Patricia :288; phone :104. |
| Portal task on flag 1 | Done | erb `completeTask: access_bludit_vm` on `flag1_submitted`; title erb:376. |
| Torres recast | Done | erb Torres `male_nerd_v2`, Owen `male_telecom_v2`. Cross-mission note in F13. |
| Debrief praise | Done, one over-claim | Debrief :186-195. "the recruiter's calling card" can play without the leaflet (F10). |

## 3. The whodunnit, worked as a detective

### (a) Every way `torres_suspected` and "Find Out Why" can be reached

"Find Out Why" opens only on `torres_suspected` (erb:323, mapping :922-928). A task finished while the aim is hidden does not reveal it (`objectives-manager.js:646-656`), but its completion toast still shows (:590, :998). See F6.

| Route | Sets it | Earliest point |
|---|---|---|
| R1 Torres' vetting file from Patricia | latch erb:907-913 on `found_vetting_file`; a given note fires its `onRead` at once (`npc-game-bridge.js:17-30`) | Incident log on Patricia's desk, then Owen's badge ask (log), then Patricia "I need your help", then the files. That is four conversations, about five minutes in. **No reading or reasoning needed**: the hand-over alone sets it. HaX's advice sends the player there (`m05_phone_agent_0x99.ink:706-707`). |
| R2 Torres' file off the floor after a Patricia KO | same latch | Any time after the first meeting. Violent, off-path. |
| R3 Medical bills or journal | latch | Inside his office. Before suspicion only via an Owen KO (dropped card or the relayed copy). |
| R4 Flag 3 | latch erb:914-920 | Server room plus the VM up to user access. Possible before any suspicion. It is hard evidence ("Staged by: D. Torres"), so this one is fair. |
| R5 Manifest or schedule | latch | Data centre, behind his print (mug in his office). In practice after R1, R3, R4 or R6. |
| R6 Reasoned partial naming | Patricia :378-389, phone :194-203, HaX :440-443 | After the log, choosing the right reason. Two wrong reasons cost nothing (F2). |
| R7 Motive or exfil partial naming | same knots | Only after R1, R3 or R4, so it never comes first. |

Halloran's spare-badge answer no longer sets it (`m05_npc_dr_halloran.ink:200-209`).

So the earliest normal route is R1, straight after the log. R1 also short-circuits round-2 M2. The reason menu only runs when the log is the player's *only* support (`m05_npc_patricia_morgan.ink:347-360`). A player who takes HaX's advice and pulls the files first then has motive, so naming Torres goes through `has_motive()`. Patricia's "Neither one's tidy" sets up a choice between two files, and the HUD answers it before the player has read either file: "Find Out Why / Get a keycard for Torres' office". The Owen and Patricia office asks and HaX's "Torres is buried in debt he's hiding" topic appear at the same moment (F1).

### (b) Fair and solvable without hints

Yes, on the documents alone:

- The incident log's pencilled note sends the player to Owen (erb:1570).
- The log is legible. Ben's own pair of swipes (20:05 main entrance, 20:11 server hallway) quietly shows the six-minute walk, which makes the Torres-then-spare pattern readable.
- Halloran's primary never comes in. The lanyard covers 23 Sep, and so does her answer.
- The exfil proof names him (flag 3, manifest, schedule).

Every link can be found in-game and none needs outside knowledge. The server-room password now has two triggers (door or notice). One weak spot: Owen's odd-hours answer clears Halloran ("gone by seven") and Ben before the log is read, and names Torres (`m05_npc_owen_gallagher.ink:156-162`). That is a fair witness clue, but it takes the red herring apart before it has a chance to mislead.

### (c) Wider than "which of two"?

Only on paper. Ben and Amara are cleared on the same sheet that introduces them: the pencilled note at erb:73 says "Ben's Thursday was a test run, logged with me (ticket 2264). Amara stayed in the lab." Naming Ben costs nothing, and Patricia answers "It's pencilled on the sheet" (:319). The other four researchers never appear outside the directory and the suspect list. Patricia's hand-over line, "Two names on Owen's sheet have something in their files" (:277), narrows it back to two. A third menu name the player can pick at no cost and that the sheet clears outright doesn't widen the case (F3).

### (d) Leaks before suspicion

- **Item names.** Clean on the normal path. Owen's card is "IT Spare Office Card" and the relay copy "Spare Office Card (relayed copy)". The vault reader shows no owner (`fingerprint-reader-minigame.js:331-341`). The briefcase is named only inside his office. Patricia's KO drops "Vetting Aftercare File: D. Torres" (round-1 accepted, off-path).
- **Task titles.** Hidden behind the aim, but their completion toasts show on an Owen KO (F6).
- **HaX lines.**
  - The office-door bark names "Torres' office" and sends the player to an Owen ask that doesn't exist yet (erb:975-980, F5).
  - `topic_leverage` and the moral sounding board open on the vetting file, which counts only because of F1. `topic_leverage` also quotes $380,000 and Stage 3 from a file that says neither (:136, :219; F7).
  - General advice tells a Patricia-KO player to take the log to Patricia (:706-707, F8).
- **NPC menus.** Halloran offers "What can you tell me about David Torres?" on influence alone, before she has mentioned him (:128, F4b).
- **KO drops.** Owen KO: card, log and the HaX relay, with the vault line gated. Patricia KO: both files. Halloran KO: Research Badge. Only Patricia's Torres file names him, and that route was accepted in round 1.

### Wrong accusations and the reason gates

- **Halloran.** Penalised in all three routes:
  - Patricia: `halloran_accused`, influence -2 (:335-336).
  - Phone: `halloran_accused`, no influence var (:151; accepted in round 1).
  - HaX: (:367).
  - Then the 15 s nudge (erb:930-936), Torres' line (:75-77), debrief trust -10 and line (:165-167, :243-244), and the WRONG ACCUSATION credit (erb:153). Refused at no cost once `found_halloran_alibi` is known. Restored in all three Torres namings (Patricia :424-426, phone :233-235, HaX :378-380).
- **Ben.** Free in all three.
- **Reason gates.** Present in all three routes. Phone and HaX re-check their state at the top. Patricia's is in person, so no re-navigation applies.

### Endings: debrief and credits

Branches exist for turn, arrest with and without cooperation, fight non-lethal and lethal, and exposure, each with its Patricia-KO variant (debrief :379-383, :431-435, :457-461). The Recruiter credit matrix is unchanged from round 1 and still exclusive. "WRONG ACCUSATION … then cleared" is always true by the end, because every Torres naming restores her and the confrontation needs `torres_identified`. Two over-claims remain: the badge-log praise and BORROWED BADGE after Halloran's answer alone (F4), and "the recruiter's calling card" without the leaflet (F10).

## 4. Findings

No blockers.

**F1 [major] The vetting files still decide the case for the player.**
- **What happens.** `found_vetting_file` latches `torres_suspected` (erb:907-913). A given note fires its `onRead` on hand-over (`npc-game-bridge.js:17-30`). So the moment Patricia hands over both files, "Find Out Why / Get a keycard for Torres' office" opens, along with the Owen and Patricia office asks and HaX's "Torres is buried in debt" and "What ENTROPY did to him" (`m05_phone_agent_0x99.ink:136, :181`).
- **Why it matters.**
  - It happens straight after the log, before the player has read either file. Halloran's file carries the TalentStack approach, which on its face is the stronger ENTROPY link.
  - HaX's advice sends the player to the files (:706-707).
  - With motive in hand, naming goes through `has_motive()` and the round-2 reason menu never runs (`m05_npc_patricia_morgan.ink:347-352`).
  - Run A of the playtest took exactly this path.
- **Fix.**
  - Split the latch loop so `found_vetting_file` sets only `case_motive`. Leave `torres_suspected` on bills and journal (behind his office) and on the three exfil items.
  - The player then commits to Torres by naming him. With the file as motive, Patricia's `name_torres` already routes to `partial_naming`, which sets suspicion and authorises the office. Naming Halloran still costs.
  - Gate HaX's `topic_leverage` and `moral_sounding_board` on `torres_suspected` as well.
  - Add a `found_vetting_file and not torres_suspected` state to the reopencheck and inkcheck matrix.
  - No spoken lines change.

**F2 [minor] The reason choice can be guessed for free.**
- **What happens.** Two wrong reasons are refused at no cost and drop back to the hub (Patricia :371-376, phone :187-192, HaX :433-438). "Look at the main-entrance times." is the only log-based option and reads as a pointer, and Patricia or HaX then state the deduction.
- **Fix.**
  - Add a log-based decoy that a careless reader would pick: "His badge is on the server hallway those nights." It's false, because only the spare is.
  - Make each wrong reason end the conversation with its refusal (`#exit_conversation`), so a retry needs a re-talk. In person, optionally -1 influence.
  - About 2 new spoken lines.

**F3 [minor] Ben and Amara don't widen the case.**
- **What happens.** The pencilled note clears both on the same sheet (erb:73), and Ben's refusal points at it (:319).
- **Fix.** Cut "Ben's Thursday was a test run, logged with me (ticket 2264)." from the note, leaving Owen's odd-hours line and Patricia's "Ben does overnight test runs" as the ways to check it. Change the three refusals to "Thursday at eight? The transfers run two till four, and he logged it with Owen." (HaX: "Eight in the evening, logged with IT. The transfers run two till four. Look again."). Clearing Ben then means reading the log against the incident log. 3 spoken lines.
- **Optional.** Trim Owen's odd-hours answer (:156) to "Halloran practically lives in that lab. David Torres too, lately.", so the log does the clearing.

**F4 [minor] (a) Badge-log credit after Halloran's answer alone; (b) a Torres question before she names him.**
- **(a) What happens.** `spare_badge` sets `door_log_reasoned` (`m05_npc_dr_halloran.ink:204`). A player who only asks her the obvious question gets "You read the badge log properly…" (debrief :245-246) and BORROWED BADGE (erb:152). A player with both halves never sees the reason menu, so Halloran's answer is the only way such a player earns the credit.
- **(a) Fix.**
  - Drop the assignment from `spare_badge`.
  - In `significant_findings` (and the phone and HaX twins), when `found_door_log and not door_log_reasoned`, add one optional choice before the close: "[And the badge log: look at the main-entrance times.]", which sets `door_log_reasoned`.
  - Give the debrief a middle line for `halloran_questioned and not door_log_reasoned`: "Halloran told you where her spare hangs. The log had already said who carried it."
- **(b)** Halloran's "What can you tell me about David Torres?" (:128) opens on influence alone (20 is reached in the Heisenberg chat) before she has mentioned him. Add `topic_team` to the condition.

**F5 [minor] The office-door bark points at an ask that isn't there.** erb:975-980 fires on any attempt: "Torres' office. … Owen won't part with it without a reason." Before suspicion Owen has no office ask (:123). Split it into two mappings (&&-only rule):
- `&& globalVars.torres_suspected === true`: keep the line.
- `!== true`: "Office keycard. IT holds a spare for every office. You'd need a reason Owen can write in his log."

**F6 [minor] Owen-KO toasts name him.** The relayed and dropped cards complete `obtain_torres_keycard` while "Find Out Why" is hidden. The toast "✓ Get a keycard for Torres' office" still shows (`objectives-manager.js:590, :998`), and so does "Get into David Torres' office" on entry. Retitle them "Get IT's spare card for his office" and "Get into his office". They sit under "Find Out Why", where "his" reads naturally next to "Find whatever he has been writing". For the log: the engine toasts tasks in hidden aims.

**F7 [minor] HaX quotes the bills from the file.** `topic_leverage` (:219) gives "$380,000 … Stage 3" when only the vetting file is held. Neither figure is in it (erb:1534). Branch on `found_medical_bills`. Else: "Undeclared loans, a second charge on the house, and treatment abroad no insurer will cover. That's a target file." 1 spoken line.

**F8 [minor] HaX's log advice ignores a Patricia KO.** :706-707 says "Take it to Patricia, or ask her for the vetting files". Add a `patricia_ko` branch: "You've got a pattern on that sheet. Give me the name and the reason, or read her files. They're on her office floor." 1 spoken line.

**F9 [minor] Phone accusation of Halloran stays in the chat.** In person and HaX end with `#exit_conversation` (:338, :369). The phone knot returns to the hub (:153), so the player can carry straight on to "David Torres." in the same breath. Harmless, but add the exit for parity (the phone `hub` prints nothing first, so re-navigation is safe).

**F10 [minor] Debrief top praise over-claims the leaflet.** `case_strength() >= 8` (debrief :187) can be met without `found_pamphlet` (nine other counters), yet the line says "and the recruiter's calling card". Add `and found_pamphlet` to the branch, or end the line at "the Architect's signature".

**F11 [minor] Stale comment.** erb:924 says Halloran's answer sets `torres_suspected`. It no longer does.

**F12 [minor] HaX's accusation says "after midnight"** (:366). The first swipe is 23:47 (the m4 point). Use "at night".

**F13 [log, outside the mission]**
- The SecGen scenario description names Torres as the insider (`SecGen/scenarios/break_escape/safetynet/m05_insider_trading.xml:12, :19`). If Hacktivity shows it before play, it spoils the whodunnit.
- Torres' new sheet `male_nerd_v2` is also m08's Agent Cipher, a crypto specialist with odd hours who is m08's red herring (`m08_the_mole/scenario.json.erb:1105-1110`), and m01's Kevin Park. Within the rules, but the same face on m05's insider and m08's red herring will read as deliberate. That strengthens the backlog case for a bespoke Torres.

## 5. Verdict

**Another round needed**, a short one.

Every round-2 fix is in the code and the static checks are clean. One major is left: F1. Pulling the vetting files right after the log still sets suspicion and renames the to-do list around Torres, and it skips the new reason menu. That is the round-1 M1 and M2 problem coming back through a side door.

The F1 fix is a split latch plus two HaX gates, with no spoken lines changed. F2 to F12 are small, mission-local and can go in the same pass, at about 8 spoken lines in total. After that a confirmation run should be enough, plus one browser check of the F1 route: files first, then confirm "Find Out Why" stays hidden until the player names Torres.
