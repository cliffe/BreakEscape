# m09 Digital Archaeology: puzzle chains, round 5 review

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at 6f115250 ("puzzle chains round 4 fixes"). Round 4 is `PUZZLE_CHAINS_REVIEW_R4.md`; its record is CONTRACT §15, "Puzzle chains round 4" (CONTRACT.md:841).

**Method.** Read the 6f115250 diff, then the whole of `scenario.json.erb` and every m09 ink file except the briefing and debrief, which I only searched. Recompiled all fifteen ink files with inklecate: every output is identical to the committed JSON. Drove HaX's hub in inkjs (the game's vendored `ink.js`) through the Tran topic on every route, re-entering `support_hub` after each state change as a phone reopen does. Ran `room_depth.py`, the validator (`--skip-ink --no-graph`), `dialoguelint` and `reopencheck`. Rebuilt the boss-key table from the erb rather than copying R2's. Traced the door scene's close path through `npc-manager.js` and `base-minigame.js`. I opened no VM plan, SecGen file or field guide. VM flags are black boxes, and I took as settled that the H&L file number is reachable only through flag 2 and that no cage clue feeds flag 3. No browser run. Scratch files are in the session scratchpad (`r5_m09/`).

**Counts: 0 blockers, 0 majors, 1 minor.**

**Verdict: not yet complete.** R4's m1 and m2 are fixed, and the Tran topic now gives a true line on every route. The window between the gate and the bin hides nothing a player needs on the hatch or handover routes. The fresh audit turned up one minor away from Tran, which four rounds of Tran work had not reached: on Victoria's route the door scene can be closed with Esc before a bin is chosen, which loses the mission's one in-cage choice, leaves the Tran topic hidden for the rest of the night and gives the closing card and m10 a file the player never held (m1). The fix is one field on one mapping. This is round 5, the AGENTS.md cap, so by the rules m1 is listed as open unless the orchestrator makes the one-line fix and runs a short confirmation.

---

## 1. R4 m1 and m2: confirmed fixed

| R4 item | Where now | Status |
|---|---|---|
| m1 topic retired on `cage_opened`, so the bin's line rarely played | `m09_phone_agent0x99.ink:815`: `not tran_topic_given and (bin_chosen or not cage_opened) and tran_outcome == "left"`; comment at :814 | Fixed |
| m2 pre-hatch arm said "something he wants" | `m09_phone_agent0x99.ink:836`: "You'd need paper with his name on it to talk him off it. Otherwise it's a fight." | Fixed |
| Docs | CONTRACT row 17 (CONTRACT.md:117: guard, closes cell, current-arms list with the R4 m2 line); §15 R4 paragraph (:841); FINALE_DEV_LOG line | Match the ink |

### The Tran topic on every route (inkjs, current build)

| Route | Sequence | What HaX says | Topic after |
|---|---|---|---|
| Hatch, Derek's file | ask, ask, choose Derek at the hatch, ask | warning + opener + "paper with his name…"; then that line alone; then "The letters went in her feed. It's a fight, or you leave him to it." | retired |
| Hatch, letters | ask, choose letters, open the gate, ask | warning + opener + "paper…"; then "You've got the letters. He's the J.T. in them. Show him." | retired |
| Handover | ask; open the gate with no bin (default `cage_bin` = `derek_file`, erb:198); enter, `handover` sets `bin_chosen` | "paper…"; **no button** in the window; then "The letters went in her feed…" | retired |
| Door (m03 Victoria recruited) | gate opened by the maintenance code; letters taken in the door scene | **no button** in the window; then warning + opener + "You've got the letters…" | retired |
| Tidied, asked early | ask | warning + opener + "Nothing on him tonight that I can use…" | retired at once |
| Tidied, first ask after the cage | gate, then bin | **no button**, then the tidied arm once | retired |
| Tran talked off or knocked out | any | no button (`tran_outcome`) | gone |

Every arm that can play is true at the moment it plays. The second pre-hatch ask repeats only the forward pointer (R4 judged that acceptable; I agree).

**The hidden-button window.** The topic is hidden from the gate opening until a bin is chosen. Does a player in that window miss anything they need?

- *Hatch and handover routes.* No. The window normally lasts the walk through the gate, because `handover` fires on the first cage entry (`m09_sorensen_door.ink:89-96`; mapping erb:1815-1822) and says what the topic would have said: "The other one's already gone." The letters are already lost at the gate (erb:198), so there is no lever left to point at. A player who opens the gate and walks away without going in can reach Tran during the window and hears only the pre-hatch line from the last ask. That's a detour, the lever really is gone, and the cage has to be entered later anyway (Nightshade's file is needed for `hear_the_name`). Note n1 has a cheap optional improvement.
- *Door route.* Nothing is missed while the door scene is still to come: the letters are still on offer there (door.ink:59), and "The letters went in her feed" would be false. But the window can fail to close: see m1.

---

## 2. Findings

### m1 (minor). Victoria's door scene can be dismissed before the bin choice; the choice is lost and the night then reports a file the player never held

**Evidence.**
- The door scene opens on `room_entered:restricted_cage` with `cage_opened && !hatch_talked && !bin_chosen`, `onceOnly` and no `disableClose` (erb:1807-1814). `npc-manager.js:678` passes `disableClose: mapping.disableClose || false`, and an ordinary person-chat closes on Esc, the × or End Conversation (`base-minigame.js:20, 75-76`; `person-chat-minigame.js:1621-1623`).
- Every tag in the `door` knot sits under a choice (door.ink:51-87). Before the buttons there are only the narrator line, the m01 recognition line and HaX's two bin lines. So closing it there sets nothing.
- `onceOnly` is used up as the scene opens and is saved to the server (npc-manager.js:791, 1348-1375). `sorensen_door` is hidden (erb:1776) and nothing else offers the bins. The cage Sorensen's ink has no bin choice (`m09_sorensen_cage.ink`).

The result on that save:
- `bin_chosen` stays false for the rest of the mission, so the Tran topic's guard (phone:815) never passes again. Run in inkjs: no button after the gate, still none after Nightshade's file. HaX's "Two samples. One pen." (phone:896) can't play either.
- `cage_bin` stays at the default `derek_file` (erb:198), but no `#give_item` ran, so Derek's file isn't in the notepad. The card still says "Saved from the bins: Derek Lawson's file." (erb:535). The Reading's margin reply says "He bet on Derek's file. He was right." (erb:370-371). m10 imports `m09_cage_bin` and builds on it (`m10_tesseract.ink:460`, `~ temp derek = m09_cage_bin == "derek_file"`).
- CONTRACT §3.3 promises the opposite: "The default file now reaches the notepad on every route" (CONTRACT.md:245).

**Why it matters.** This is the one in-mission choice the cage asks for. It's the m03 Victoria payoff route, and nothing tells the player that closing the window gives the choice up. The hatch route can't fail this way: the hatch is re-talkable, and `handover` carries its tags above its first line (door.ink:89-96). It's minor because it needs one branch and one early Esc, and nothing is blocked. But on that save the ending and m10 both describe a choice the player never made, about a page they never held.

**Fix** (erb:1807-1814, one field). Add `"disableClose": true` to the door-scene mapping. All four buttons end on `#exit_conversation` (door.ink:51-87), and one of them is "[Walk past her.]", so forcing the scene costs the player nothing. It's the same treatment the forced calls get. *Alternative:* drop `onceOnly` (the condition's `!bin_chosen` already stops a repeat once any button is pressed), so a dismissed scene reopens on the next cage entry. That also covers a reload mid-scene, but the validator will flag the cutscene without `onceOnly`, and it adds a reopen to playtest. I'd take `disableClose`. Update CONTRACT §3.3 (B5 row) and §6.2, and add a §15 line. Unvoiced: no audio change.

---

## 3. Fresh audit (skill Steps 2–5) on the current build

### 3.1 Room depth

`room_depth.py`: 11 rooms, max depth 5 (`salvage_cage`), 0 empty by the script's count (`staff_passage` has no objects or NPCs but is a lock carrier; plan W5), 11 lockType declarations. Depths: dock 0; front desk, open stacks 1; reading room, closet, staff passage 2; restricted stacks 3; cage, office, tape room 4; salvage cage 5.

### 3.2 Boss-key table, rebuilt from the erb

"Seen" is the depth of the room the player stands in when they first meet the lock; "key" is where its key or code first becomes available.

| Lock | erb | Seen | Key / code from | Key depth | Verdict |
|---|---|---|---|---|---|
| `front_desk` door, key | 1081-1085 | 0 | lockpick (start kit, 577-583); Old Coyote's ring on a knock-out (1226-1235) | 0 / 1 | ✅ by design (m01 grant). Route A |
| `staff_passage`, RFID `reading_staff_door` | 1463-1465 | 1 | Noor's EM4100, cloned at the desk (noor.ink:214-221), or handed over if warned in time (:159); A3-03c if she has gone home with it (316-317) | 1 | ✅ by design (m03 grant, the easy card). Route B never meets it |
| `restricted_stacks`, RFID `stacks_release` | 1596-1598 | 2 | flag 1 → HaX `unlockDoor` (166, 170-171); refusal says so (152) | 2 (VM) | ✅ The VM opens the physical path, announced at the door |
| `restricted_cage`, RFID `stacks_card` | 1710-1712 | 3 | Sorensen's MIFARE custom-keys card, cloned across the hatch (hatch.ink:124-133); Victoria's maintenance code (phone:793-797; erb:185-187) | 3 | ✅ by design (the hard clone); the m03 recruited shortcut is the earned skip |
| `plan_cabinet`, biometric | 1867-1869 | 4 | her print on the stamp at the hatch shelf (1672-1689); pointers at the hatch (hatch.ink:129), on cage entry (211), topic 14 and the ladder (phone:943, 946) | 3 | ✅ boss-key, one room back |
| `sorensen_office`, password | 1930-1932 | 3 | none; HaX opens it on `deck_choice_made` (253-255); first try says "There's no code to find for it" (157-158) | story | ✅ announced story gate (W2) |
| `director_safe`, PIN 060216 | 1944-1947 | 4 | Kowalczyk's cracker (start kit, 609-617); or "Lease start: 06/02/16" on the rent ledger (2066), cross-checked by the lease's "June 2, 2016" (2081) | 0 / 4 | ✅ by design (cracker deduction; same-room ledger is the observant player's second route) |
| `tape_room`, RFID `tape_room_reader` | 2154-2156 | 3 | key card in the safe (2042-2052); refusals before and after the deck (159-161) | 4 | ✅ boss-key |
| `salvage_cage`, password LEWISANDCLARK | 2264-2266 | 4 | the coded line at flag 1 (phone:196, 207; note 795-805; screen 1545) + BONEYARD on the chart by the keypad (2209), matched through the door sign "Salvage -- Bay 12" (2263) + CyberChef | 2 + 4 | ⚠️ split, kept (W1). The hint ladder carries the three beats (phone:719-741). The decoded phrase echoes the county on the certificate and the lease (2139, 2081), so the player knows the decode worked before typing it |
| `hl_box`, password HL2015-0477 | 1347-1349 | 1 | flag 2's file number (ledger_read, phone:244-245; screen 1540-1544; pointer text 373-374) | 2 (VM) | ✅ boss-key, optional |
| `enrolment_crate`, key `beta_crate` | 2367-2371 | 5 | lockpick | 0 | ✅ by design, optional |

**Soft gates (not locks), same test.**

| Gate | Encounter | Key | Verdict |
|---|---|---|---|
| Tran talk-off | closet, depth 2, from act 1 (topic 17's pre-hatch line names the kind of lever) | the letters, from the hatch at depth 3 (hatch.ink:100-111) or the door scene | ✅ boss-key: meet him, hunt the paper, walk back. Broken on one save by m1 |
| Legacy box | cage, depth 4 (texts 199-208; topic 13) | a knock-out before the clock (217) | ✅ announced, timed, settled (W3) |
| Sorensen talk-down | cage, depth 4 | Nightshade's file from the cabinet in the same room (cage.ink:300) | ✅ by design: the lever is the file you just took |
| Noor told | front desk, depth 1 | the bonus question (noor.ink:225-233) or the printed ledger read after flag 2 in the cage (234; erb:243) | ✅ the ledger route is a walk back from depth 4 |
| The hand | phone topic 11 | file in the cage (4) + scan in the reading room (2) | ✅ two rooms, optional; the identity scene completes it (phone:376-380) |

No lock is key-before-lock and no same-room pair collapses a required beat. The verdicts agree with R2 §3. I reached them independently, and the line numbers above are today's.

### 3.3 Choices that matter (Step 3a)

`concludeRequires` is the four flag tasks only (erb:722); every story thread is optional and carries its weight through consequence and score, as the skill asks. Checked as built:

- **m01**: Sorensen's recognition line (hatch.ink:54-67; door.ink same), the Tran warning (phone:136-145, 171-181), Derek's file remarks (erb:352-355), the Reading page 1 (1960-1967).
- **m02**: Gary at the keypad, with an opened arm (gary.ink:74-81); the Reeves sheet (244-248, 360-361); the refit ledger (330, 2112).
- **m03**: Victoria's maintenance code and door scene (phone:793-797; erb:1807-1814; see m1); Danny's note (331-339, 2094-2098).
- **m04**: the Albion lines (phone:499-520) and Reading page 3.
- **m05**: Torres (now reliable on every box path, 875-879); Noor warned in time (noor.ink:156-163; erb:199-200, 1170-1174); the ledger's Torres row (1541-1544).
- **m06**: Irina (329), the HashChain case file (375-376, 1562), Aydin (phone:587-589).
- **m07**: the dossier line (phone:241-243), Reading page 4.
- **m08**: tidied (the third bin and the Tran arm), triple agent (Nightshade's call and file), named on evidence or by accusation (phone:249-254).

In-mission choices pay off on the closing card (erb:471-556), in HaX's later lines and in the m10 exports (2425-2430). The hatch bin is the busiest: the card, the afterwards call (phone:268-290), the Reading's bet (366-371), the hand (phone:896), Tran (jesse_tran.ink:52) and m10. That is why m1 matters even though it needs one branch to reach.

### 3.4 Capability earned (Step 3b) and chain depth (3c)

All five start-kit classes are used; the cloner twice, easy then hard (EM4100, then MIFARE custom keys with Nightshade's tip on the triple-agent branch). The mission's new technique is Vigenère, met once with the key in the room and taught in three hint tiers, then once with an inferred key (the Alpha sheets, "Key: the series.", erb:2246). The safe is designed for the cracker, and the US-format lease date is a small, fair second route for the observant. No over-redundancy: the salvage key has one source (the chart), the print has layered pointers (W7), and the PIN has two.

### 3.5 Would every object exist anyway (Step 3d)

Unchanged and sound. The encoded line is the archive's own house code ("Never write a code down. M.S.", 2209); the Alpha line is the teacher's exercise; the printed ledger's cipher rows are hers. No decode puzzle sits on an innocent party's material.

### 3.6 Bug sweep (Step 4)

| Check | Result |
|---|---|
| Hard-coded ids in shared minigames | None touched by m09's lock types |
| `item_picked_up` keyed on id | None. All are `item_picked_up:notes` with `data.itemId` in the condition (323-328, 352-355) |
| Tasks with no completion route | None. `concludeRequires` is the four flags (722); `stop_the_tape_wipe` closes on talk-off or KO with flag 1 either order (233-234) |
| Author notes in text, observations or ink | None |
| Observations that state a code | None ("takes a file number", "six-digit keypad") |
| Rename residue | None |
| Stale geography | None in lines changed since R4. "server closet off the open stacks" (phone:823) matches erb:1201 |
| One-shot choice scenes that can be dismissed | **New check this round.** Of the mappings that open a scene holding a mission choice, the identity scene, hour read, Recruiter and Tesseract calls and the debrief are all forced (`call_map` default, erb:97; debrief 1026, 1050). The hatch and Noor are re-talkable. The door scene is the only one-shot choice scene left closable: m1 |
| Validator | The same 23 documented items as R2–R4 (13 overlap warnings, cutscene `onceOnly`, the salvage two-source warning, the office graph edge, `beta_crate`, `stacks_release`, biometric `item_unlocked`, already withdrawn in the plan §4.6) |
| dialoguelint | 5 `not-x-but-y`, 1 `you-after-choice`, all in lines unchanged since earlier passes; phone max 25 words |
| reopencheck | `agent_0x99` 0 problems over 1,617 reopens. The four contact stubs (Recruiter, Nightshade, Torres, Gary) replay `start` by design, as in every round |
| Ink | All fifteen recompiled files identical to the committed JSON |

### 3.7 Layout and pacing (Step 5)

Unchanged and sound. Act 1 ends at depth 2 (flag 1); act 2's hub is the restricted stacks at depth 3, with its turn (the Recruiter) on stepping out of the depth-4 cage; act 3's turn, the name, lands at depth 5 or, on the late-file order, depth 4 (plan §8). Returns with a reason: cage → stamp → cage; stacks → open stacks for the H&L lid; cage → reading room for the scan; hatch → closet with the letters. Act 3 has no traversal.

---

## 4. Notes (not counted)

- **n1. The hatch-route window could show the Derek arm.** On the hatch route, once the gate is open with no bin chosen, `handover` is certain to hand over Derek's file and the letters are already gone (erb:198; door.ink:95). Widening the guard to `(bin_chosen or hatch_talked or not cage_opened)` would let a player who opens the gate and detours to Tran hear "The letters went in her feed…" before going in. The door route keeps its hidden window, because there `hatch_talked` is false. The cost is a possible second identical ask after the handover, since `tran_topic_given` still waits for `bin_chosen`. Optional; the detour is rare and the player is told nothing false.
- **n2. "paper with his name on it" and "J.T."** The letters carry initials, not a name (erb:1650). The letters arm resolves it ("He's the J.T. in them."), and "his name" is fair shorthand for a courier line that identifies him. No change.

---

## 5. For phase 5 (browser checks, not findings)

- **m1 after the fix:** on an `m03_victoria_fate == "recruited"` save, use the maintenance code, enter the cage, try Esc and the × in the door scene (they should be inert), take the letters, then ask HaX "[Tran.]" and walk to the closet: the lever choice shows.
- Tran topic, live: ask twice before the hatch; choose Derek's file; ask (feed line, then gone). Repeat with the letters ("You've got the letters…"), then Tran: "[Go.]" completes `stop_the_tape_wipe`, he's hidden, the card reads "Walked out and made a phone call." and "97 of 212 reels". Also "[No deal.]", then a return.
- Handover: open the gate without choosing, confirm the "[Tran.]" button is absent at the gate, enter (Derek's file in the notepad), ask HaX.
- `m08_nightshade_tidied` save: one ask, the tidied arm, button gone.
- Carried from R3/R4: keypad tiers in order (tier 2 as two bubbles, method first; "Gary told you how." on `m02_gary_protected`); the `realisation` reply "No. It hasn't."
- Carried from R2 n5: Torres click → cancel; Gary with a first-try correct code; tell Noor, then try the staff door; the late file on the alpha-tapes branch; the read-every-page safe check.

---

## 6. To close the phase

1. m1: add `"disableClose": true` to the door-scene mapping (erb:1807-1814). Validator `--skip-ink --no-graph` (expect the same 23 items); no ink change, so no recompile or tagdiff needed. CONTRACT §3.3, §6.2 and a §15 "Puzzle chains round 5" line.
2. This is round 5, the AGENTS.md cap. If the orchestrator applies m1 now, a short targeted check of that one mapping (the rendered JSON carries `disableClose` on `sorensen_door`'s first mapping and nothing else moved) is enough to record phase 2 as 0/0/0. Otherwise list m1 as open, carried to phase 3 or 5.

Measured against m01_first_contact and m02_ransomed_trust.
