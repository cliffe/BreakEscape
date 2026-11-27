# m09 Digital Archaeology, confirmation playtest 1

Scope: the seven fix-round items from `PLAYTEST_R1_A/B`. Fresh games on the keyless server (:3001), session name tag `m09c1` (the harness keys sessions on the game id, so the main run was game 2972; 2974, 2975 and 2977 were short re-runs of the dock call only). No VM files opened, no game files edited.
Scratch, screenshots and session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09c1/` (`session.jsonl` is the main log).
Result: 6 PASS, 1 FAIL (item 1, second half). One minor new finding.

## Results

| # | Item | Result |
|---|------|--------|
| 1a | Dock call shows its lines once | PASS |
| 1b | Tran line comes before the phone closes | FAIL |
| 2 | Reload with the dock call unanswered: it rings again at the same choice | PASS |
| 3 | "[Where do I stand?]" after laptop setup, before flag 1 | PASS |
| 4 | North shutter from the dock | PASS |
| 5 | Noor's clone: reply, narrator line, cloner; cancel and retry; HaX witness line after the tell | PASS |
| 6 | Reading room's three doors, incl. the staff passage | PASS |
| 7 | Old Coyote's and Tran's sight cones drawn | PASS |

### 1a. PASS
After the briefing the dock thread holds "That noise is a cross-cut shredder", "Shutter's his round", "Night guard", and the Quintero line (I answered "Quintero's right" in the briefing), once each. No second copy an hour later. Shot: `01.png`.

### 1b. FAIL (same as R1 m1)
Game 2977, office door then "Who else is inside?", polling the open phone every 0.5 s. Messages arrive "Margaret Sorensen runs the place...", then "A clerk's on tonight, and an IT contractor, Jesse Tran.", then the phone minigame closes. The next line, "Viral Dynamics' staff files have a Tran in them.", is only in the thread when the phone is reopened (game 2972 shows it, then the hub choices). The ink now has the Tran line inline before `#exit_conversation`, so the close is happening on or just after the "A clerk's on tonight" line, before the Tran line is shown. The `#set_global:dock_done:true` tag sits on the line before the conditional block, and `dock_done` was already true at that first close. Looks like the exit fires from the earlier tag or the phone closes when the story stops at the tag line. The Tran warning is still unseen unless the player reopens the phone, and there is no badge.
Severity: minor (the information is in the thread and the hub's "Tran." topic repeats it).

### 2. PASS
Game 2972: reload with the choice unanswered, Resume, Enter on the title, closed the Mission Brief note. The HaX phone opened by itself at the same two choices ("The office door", "The shutter") with the same four bubbles and no duplicates. Shots: `02_reload.png`, `05.png`. (The tutorial prompt appears afterwards on the dock, as before.)

### 3. PASS
After the field laptop was set up (`set_up_drop_terminal` done, `catalogue_guide_offered` set, objective list showing only `submit_catalogue_flag`), HaX's "Where do I stand?" answered "The laptop's live. Get into the catalogue server, then bring what you find to the drop terminal." Not the old "Get inside, set up the laptop" line. Shot: `13_stand.png`.

### 4. PASS
The dock reply on the shutter branch ("It's up on the north side, in the corner. His torch crosses the far end of the floor. Go when it's gone.") now matches the map: the door in the north-west corner under the exit sign leads to Open Stacks and is unlocked. Walked through it (`moveTo` 48,40) into `open_stacks`; `get_inside` completed. Shot: `07_dock.png`.

### 5. PASS
Noor, cover "Shredder service": the hub now offers "Lean in over her list, close to the card on her belt." Order observed: player line, Noor answer ("It's in the cage..." came first in her reply before the option), narrator "You lean in to read the list. Her staff card hangs at her belt, a hand's width from the cloner in your jacket.", then the RFID cloner opened. Cancel returned to Noor's "What now? I've got carts to load." with the option still there. Retry opened the cloner again, Save stored "Staff Card, N. Haddad", Noor's opener became "Still here? Peg's going to notice.". On the "That bonus wasn't for filing" branch: Noor's tell ("My dad's on dialysis in Dearborn. I never told her that.") then the narrator line, then HaX "She's a witness now. She goes tonight, and she doesn't ring her dad for a while." then "Don't let her ring from here." Order is correct. `noor_told` and `noor_met` set.

### 6. PASS
Reading room doors: east to Open Stacks (unlocked, walked both ways); south staff passage (`door:reading_room->staff_passage`, RFID, opened by emulating the cloned Noor card, walked in and across); north Restricted Stacks (RFID, "Card not accepted" with the staff card, as expected before the stacks card). From the staff passage the door to the front desk is a key lock on that side (needed `completeLockpick`), then walked front desk to passage to reading room. No stuck positions.

### 7. PASS
Old Coyote's cone is drawn in Open Stacks (green wedge plus range circle, `09_coyote_cone.png`) and it works: he challenged me twice on sight. Tran's cone is drawn in the server closet (`12_tran.png`; his challenge needs `m01_maya_ko`, not set, so no challenge as designed).

## New findings

**N1 (minor). Walking up the west side of the dock to the north door pops the front-desk lockpick.**
Steps: from the dock, `enter open_stacks` (or a click path to the corner door at 48,32). The path passes within about 37 px of the front-desk door at (16,80), and the front desk's lockpicking minigame opens on its own (shot `06_stacks.png`, "Locked Front Desk"), blocking the crossing. Closing it and clicking straight to (48,40) from further east works. A player heading for the shutter will meet an unrequested lock minigame first. May be engine door-proximity behaviour rather than m09 layout.

**N2 (note, not a defect).** `room` lists `door:loading_dock->open_stacks` as `locked:false` and the dock reply calls it "the shutter"; the shutter art itself is still not clickable. The reply now points at the right door, so I counted item 4 as a pass.

## Not covered
Flag 1 onward, the cage, the hatch clone, debrief. TTS 503s on the keyless server are expected.
