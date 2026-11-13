# m09 Digital Archaeology: full-route playtest 1

Question answered: 1 (plumbing), plus a read of presentation (portraits, backgrounds, lighting, overlap, whether lines match what was done). Regression run, not blind: the route is known. Route source: WALKTHROUGH_R1.md, "Critical path, cold start, route B" (no imports, so no m01-m08 carry-over). Hatch route for the gate, bin choice = Social Fabric letters (non-default), Recruiter: refused her name, deck = Alpha tapes, notice sent.

- Game 3305 on :3001 (keyless, no TTS), headless (load ~21), fast speed, Node 24. Fresh game, no head start.
- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09_full/session.jsonl` (1688 lines, 1687 commands, 4 flag substitutions). Screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09_full/shots/` (62 files, numbered in play order).
- Deviation from the brief: I did not use the head-start tool for the four flags. `new-game.rb --submit-flag` only works at game creation, so it cannot mark a flag "when you reach the terminal". I typed `<flag:1..4>` into the real flag stations instead (session policy), which also fires the client-side rewards the head start skips. This did leave `tools/playtest/m09_digital_archaeology-flags-game3305.xml` (written by new-game.rb) untracked in the repo.
- Reload: once, mid Recruiter call (before an answer), `sync` then `location.reload()`, Resume clicked through the DOM. The call resumed at the same two choices, flags/globals/inventory intact, player respawned in the dock (expected per README). No overlay loop.
- Credits read from a MutationObserver on `#bv-cr-label`.

## verify-run.rb (game 3305)

```
current room    "loading_dock"
unlocked rooms  10: loading_dock, open_stacks, reading_room, restricted_stacks, restricted_cage, sorensen_office, tape_room, salvage_cage, server_closet, front_desk
unlocked objs   2: plan_cabinet, director_safe
inventory       18 (7 start items + 11 notes/keycard: salvage catalogue line, Handoff 14, Candidate Assessment, Reading 1-4 + last page, Destruction Schedule, Key Card Tape Store, Lease Abstract)
NPCs met        21 (incl. old_coyote, sorensen_hatch, sorensen, alpha_recording, jesse_tran, noor_haddad, closing_debrief)
flags submitted 4 (catalogue_server_1, _2, tomb_beta_server_1, _2)
tasks           27 in objectivesState, 26 completed (cross_reference_wren, optional, still "active")
score           97
VERDICT: progress recorded: 9 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Catalogue flag 1 | `<flag:1>` | VM work (none in standalone). Prerequisite held: field laptop used, task open | step 9 | **no, flag supplied** |
| Catalogue flag 2 | `<flag:2>` | as above; ledger-guide text received | step 19 | **no, flag supplied** |
| Tomb Beta flags 3, 4 | `<flag:3>`, `<flag:4>` | as above; prerequisite (salvage cage, asset tag) held | steps 31, 33 | **no, flag supplied** |
| Stacks card (cage gate) | clone | RFID clone of Sorensen's MIFARE card at the hatch (Darkside 16/16) | step 14 | yes |
| Sorensen's print / plan cabinet | whorl, Sorensen card | Rubber stamp on the stacks shelf, dusted and lifted | step 16-18 | yes |
| Safe PIN | `060216` | Rent Ledger lease start 06/02/16 (office) and lease abstract | read before use | yes (the safe screen itself never points at the ledger) |
| Salvage keypad | `LEWISANDCLARK` | catalogue line `MSJMQAEGDZNVI` (notes) + Shelf Marks bay 12 BONEYARD + CyberChef Vigenere Decode | step 28-30 | yes |
| Alpha line | "Carry it yourself. Let it hurt afterwards." | annotation sheet, key ALPHA, CyberChef | after identity scene | yes |

Rows marked "no" are the boundary: the four flag steps were exercised, not tested, and everything downstream (identity scene, hour read, Tesseract call, debrief, credits) is proven reachable only given a flag.

## Route result (all steps passed unless noted)

1. Briefing (hand-driven, no bootstrap): Netherton, HaX, Lantern portraits and the Citadel background show. HaX bust is the coarse one (finding 2). PASS.
2. Dock call opens by itself after the briefing; shutter route; "Who else is inside?" delivers Tran line. PASS.
3. Dock to open stacks: first attempt via `enter` opened the front-desk lockpick (finding 3); walking north worked. Coyote challenges on sight, "Shredder contractor" passes ("Go on"). Chat background and portrait fine.
4. Reading room lit and legible. Field laptop: task done. Flag 1: accepted; HaX call rings at about 5 s with the stacks nudge. PASS.
5. Restricted stacks: hatch conversation (bin = letters), RFID clone with Darkside, stamp dusting (find, silver powder, lift, whorl, Sorensen card). Cage gate opens on the clone. PASS.
6. Cage: plan cabinet takes the lift, Candidate Assessment taken (notes), cage Sorensen conversation sets the stamp down (stop_the_shredding done). PASS (findings 7-9).
7. Notebook scan, HaX hub "The hand on his file": wrong answer ("Different hands") gives a retry nudge; "Same hand" completes the aim. PASS.
8. Flag 2: accepted; ledger call, WREN lines. Recruiter call rang on its own while I stood outside the cage. Reload here (see above). Call resumed; refused name, chose Alpha tapes. PASS.
9. Office (HaX had opened it): rent ledger, safe PIN, Reading pages, schedule, tape card, lease file. Tape room: Alpha deck before the identity scene plays "Empty/ turns... After" (by design); shelf marks, keypad, CyberChef, salvage cage open. PASS.
10. Asset tag, flag 3, identity scene (voiced call, no audio on :3001), flag 4, hour read, Tesseract call; `report_to_netherton` becomes the only open task and says "Tell HaX to bring you in". PASS.
11. Optional: Alpha annotation sheet decodes; Alpha deck now plays the recording with the Tesseract bust. Tran (server closet): "What are you wiping" chain, "Go" ends it, stop_the_tape_wipe done. Noor (front desk, lockpick assisted): Dearborn beat, phone face down. His notice sent. PASS.
12. Debrief: hub lines match choices (archive/Noor, WREN, Recruiter "did not let her set the price", notice "has gone, on your word"). Closing card and credits roll. PASS.

Credits as read (each line matched what I did): HaX "Given her own line back"; Kowalczyk "Thanked for her cracker, to her face"; Sorensen "Wrote down every box she destroyed"; Noor "A witness in Great Falls. Not allowed to ring her father"; Old Coyote "Walked the fence. Saw nothing"; Tran "Walked out and made a phone call"; Recruiter "Kept her name. You kept his tapes"; "Saved from the bins: the Social Fabric letters. Teresa Villanueva was warned"; "The deck: Tomb Alpha's tapes pulled, the rest wiped"; Albion line. The closing card string (read as one concatenated textContent, no separators) is "The Architect: Dr Adrian Tesseract. Proved ... WREN: one of four. Going into Montana with you. His vendor notice: sent tonight. The Montana order: signed."

## Checks you asked for

- New portraits and backgrounds: Netherton/HaX/Lantern briefing; Coyote, Sorensen (hatch and cage), Tran, Noor, Tesseract recording, Lantern debrief hangar. All present, right faces, backgrounds match their rooms. Exception: the HaX portraits (finding 1, 2).
- Lines true for what I did: yes everywhere I looked except findings 8, 9, 15.
- Always knew what to do next: yes. Objectives panel and HaX calls pointed at the next step each time; "Where do I stand?" gives a one-line nudge. After flag 4 only one task is open and it says what to do.
- Overlap: only the objectives panel over the west third of the map (finding 6) and toasts over the top of rooms.
- Lighting: every room was readable on entry (reading room, stacks, cage, office, tape room, salvage cage, closet, front desk, dock). I never met a room that was dark on arrival, so dark-until-motion states were not exercised.

## Findings

| # | Sev | Finding | Steps / evidence |
|---|-----|---------|------------------|
| 1 | minor | Agent HaX's phone avatar (`agent_hax_headshot.png`, dated March) is a fedora-and-trenchcoat figure, not the hooded HaX of the briefing and chat bust. It sits on every HaX phone header, including the identity scene and hour read | `shots/03_dock.png`, `45_identity.png` |
| 2 | minor | HaX's briefing/chat bust renders with much chunkier pixels than Netherton, Lantern or the other new busts in the same room | `shots/01_briefing_choice.png` vs `02_briefing_lantern.png`; also `38_alpha_chat.png` |
| 3 | minor | From the spot just inside the dock's north door, `enter open_stacks` (a real pointer click on the north door) opened the front-desk lockpick instead, twice. Suspect harness, but the two doors sit about two tiles apart. Walking north with the keys worked | `shots/05_dock_lockpick.png`, `06_dock_at_north.png` |
| 4 | minor | Closing the lockpick minigame without picking shows two toasts, "Failed to pick the lock" and "Pick Failed" | `shots/06_dock_at_north.png` |
| 5 | minor | Stage directions written with asterisks show literally (rendered as x-marks): "*to you*" in Coyote's first line, "*beat*" in the Recruiter's call | `shots/08_coyote_chat.png`, `31_recruiter3.png` |
| 6 | minor | The objectives panel (expanded by default) covers the west third of the map in most rooms, including Sorensen's office and the hatch area; it only shrinks if the player collapses it | `shots/33_office.png`, `19_cage.png` |
| 7 | minor | Cage Sorensen: after "Your Architect kept his own papers..." she sets the stamp down, but "It's over. Put the stamp down." is still offered and gets "She doesn't look up. When I've finished, dear" | adv output, step 6 |
| 8 | minor | Candidate Assessment ends "in a sloping hand you have seen tonight" (also the Reading pages: "same hand"), true only if the notebook scan was already read. I took the file before the scan | `shots/20_assessment.png` |
| 9 | minor | The Reading's last page, pencilled margin: "They will save Lawson's file." Unconditional; I saved the letters and nothing acknowledges the Architect being wrong | step 9, Reading last page |
| 10 | minor | Tomb Beta station says "Accepts flags from: tomb_beta_server" but its submitted-flags list also shows the two catalogue flags | `shots/44_flag3.png` (state text) |
| 11 | minor | Shelf Marks viewer starts "Shelf Marks Observations: MOUNTAIN STATES..." (the observation label runs into the text) | `shots/39_shelf_marks.png` |
| 12 | minor | Fingerprint compare: Jesse Tran's and Sorensen's reference cards are both near-identical concentric whorls at card size. I picked correctly (stamp is hers); a wrong pick was not tried, so I can't say what it costs | `shots/17_cards.png` |
| 13 | minor | `cross_reference_wren` (optional) opens after flag 2 and is still "active" at the end; nothing says how to complete it | verify-run tasks |
| 14 | minor | Noor's chat background sign reads "RETURNS FOR ENQUIRIES"; the room's sign says "RETURNS AND ENQUIRIES" | `shots/58_noor_chat.png` vs `57_front_desk.png` |
| 15 | minor | Hatch Sorensen opens with "The lease-holder's auditor. Of course." before the player has said who they are, and after telling Coyote "shredder contractor" | `shots/13_hatch_chat.png` |
| 16 | minor | Rubber stamp's dusting surface reads "Black glass and gloss plastic" | step 5, dusting state text |

0 blockers, 0 majors, 16 minors.

Not done: Route A (Noor clone, staff passage), Victoria's route, default bin, KO paths, wrong-order off-path run, hostile fights, `beta_crate`, Dillard, Field Kit Link launcher, audio (keyless server).
