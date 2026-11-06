# m09 Digital Archaeology: puzzle chains, round 4 review

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at 4e5c5035 ("puzzle chains round 3 fixes"). Round 3 is `PUZZLE_CHAINS_REVIEW_R3.md`; its record is CONTRACT §15, "Puzzle chains round 3" (CONTRACT.md:839).

**Method.** Read the 4e5c5035 diff. Recompiled all fifteen m09 ink files with inklecate; every output is identical to the committed JSON. Drove HaX's hub in inkjs (the game's vendored `ink.js`) through each Tran ask sequence, re-entering `support_hub` after every state change as a phone reopen does. Ran `room_depth.py`, the validator (`--skip-ink --no-graph`), `dialoguelint` and `reopencheck`. `git log d2fd06fe..HEAD` touches no erb, engine or model file, so the boss-key table was spot-checked line by line against the erb rather than rebuilt. To test the fixes proposed below, I copied the phone ink into the session scratchpad, edited it there, compiled it and ran it. No game file was edited. I opened no VM plan, SecGen file or field guide. VM flags are black boxes, and I took as settled that the H&L file number is reachable only through flag 2 and that no cage clue feeds flag 3. No browser run.

**Counts: 0 blockers, 0 majors, 2 minors.**

**Verdict: not yet complete.** R3's m1 and m2 are fixed and correct as far as they go. But topic 17 still retires on `cage_opened`, so the post-bin line that R3 m1 exists to deliver gets only a few tiles of walking to play in on the hatch route, and none at all on the handover and door routes (m1). The pre-hatch arm, now the one most players hear, still says "something he wants", which R3 m2 showed is the wrong lever (m2). Both fixes are single lines in the unvoiced hub. Round 5 is the AGENTS.md cap, so it should be a confirmation of these two lines.

---

## 1. R3 m1 and m2: confirmed fixed

| R3 item | Where now | Status |
|---|---|---|
| m1 topic burned on a pre-hatch ask | `m09_phone_agent0x99.ink:817-819`: `tran_topic_given` is set only on `bin_chosen or m08_nightshade_tidied`. `:820-824`: warning and opener behind the new ink-local `tran_topic_heard` (declared `:88`) | Fixed. The retire rule works but its window is too narrow (R4 m1) |
| m2 letters arm misdescribed the lever | `m09_phone_agent0x99.ink:833`, "You've got the letters. He's the J.T. in them. Show him." | Fixed |
| Docs | CONTRACT row 17 (CONTRACT.md:117), §5.4 (`tran_topic_heard`, :421), §15 R3 paragraph (:839); FINALE_DEV_LOG line | Match the ink |

### The points the orchestrator asked about

**Every ask sequence, as run in inkjs (current build).**

| Sequence | What HaX says | Topic after |
|---|---|---|
| Ask before the hatch | m01 warning (`tran_warning`, phone:136-145), "He's wiping tapes…", "You'd need something he wants…" | stays |
| Second ask before the hatch | "You'd need something he wants to talk him off it. Otherwise it's a fight." alone | stays |
| Ask after Derek's file (hatch, cage still shut) | "The letters went in her feed. It's a fight, or you leave him to it." | retired |
| Ask after the letters (hatch, cage still shut) | "You've got the letters. He's the J.T. in them. Show him." | retired |
| First ask after the bin, none before | warning, opener, then the bin's line | retired |
| `m08_nightshade_tidied`, first ask | warning, opener, "Nothing on him tonight that I can use…" | retired at once |
| `m01_maya_ko` | "Maya Chen would have flagged him…" in place of Maya's list | as above |
| Hatch bin chosen, then the gate opened | (button gone, `not cage_opened`) | gone |
| `handover` (gate opened with no bin; Derek's file on cage entry) | (button gone before the bin exists) | gone |
| Door route (Victoria's maintenance code; bin chosen in the cage) | (button gone before the bin exists) | gone |
| Tran talked or knocked out | (button gone, `tran_outcome`) | gone |

No arm says anything false. The trouble is which arms can be reached (m1).

**`tran_topic_heard`.** It's correct. It is set after the warning block on every ask (phone:824), so the warning and "He's wiping tapes…" play exactly once whichever ask comes first. It doesn't collide with any global or any other file's VAR (grep over `scenarios/`). The FINALE_ARC cross-file locals note (FINALE_ARC.md:597) lists examples, not every local, so no edit is needed there.

**The repeated "You'd need something he wants…" on a second pre-hatch ask.** It reads acceptably. It's one bubble that answers "[Tran.]" directly, "him" is clear from the button, and nothing in it has gone stale. A sticky topic that repeats its last line is the same pattern as the keypad topic's tier 3 (phone:739). The wording is a separate problem (m2).

**The letters line against Tran's ink.** It matches. Tran's lever choice is "[You can explain these to Social Fabric, or to me.]", followed by "Narrator: He reads the courier line, J.T., and takes his hands off the keyboard." (`m09_jesse_tran.ink:52-53`). The letters read "Courier: J.T., server closet, Mountain States." (erb:1650, :1793). "Show him" fits a choice that is literally putting the paper in front of him, and "He's the J.T. in them" is the same fact the narrator line pays off. The lever is gated on `cage_bin == "letters" and tran_outcome == "left"` (tran.ink:52) with no inventory check, and `cage_bin` is a VAR in his story (:14), so it agrees with HaX's arm on every route.

---

## 2. Findings

### m1 (minor). The Tran topic still retires on `cage_opened`, so the bin's line rarely gets a chance to play

**Evidence.** Topic 17's guard is `not tran_topic_given and not cage_opened and tran_outcome == "left"` (phone:814). The bin and the gate fall close together on every route:
- *Hatch route.* The bin choice, the clone and the gate all happen at the counter. Sorensen's hatch scene offers both bins and the clone in one hub (`m09_sorensen_hatch.ink:92-139`), and the gate is beside her ("The gate's beside her", status ladder phone:945). The R3 m1 arms (phone:830-833) play only if the player opens HaX's phone between leaving the hatch scene and badging the gate.
- *Handover.* A hatch-route player who opens the gate without choosing gets Derek's file on cage entry (`m09_sorensen_door.ink:89-96`), after `cage_opened` has already removed the topic.
- *Door route* (m03 Victoria recruited). The bin is chosen in the cage at the door scene (door.ink:51-87), again after `cage_opened`. The letters can be saved here, and HaX never says they're the lever.

So, on the most common order (ask early, then hatch, then gate), the player hears "You'd need something he wants…", watches one bin go into the feed, and gets nothing more from HaX. On Derek's file that is R2 m1's dead hunt, which R3 m1 was meant to close. Sorensen's handover line, "The other one's already gone.", says the letters went but not that they were the lever. This retire rule dates from before the topic carried the bin's payoff. Alignment R6 called it "a pacing call; no change" (ALIGNMENT_REVIEW_F_R6.md:64), when the topic was a single generic line. R2 and R3 have since made it the place where the hatch choice pays off at Tran, which is a concrete play reason to look at it again. The task is optional and nothing is blocked, so this stays minor. It's still the in-mission choice the user's priority asks to matter.

**Fix** (phone:814, unvoiced). Keep the topic open past the gate until the post-bin ask:

```ink
+ {not tran_topic_given and (bin_chosen or not cage_opened) and tran_outcome == "left"} [Tran.]
```

`(bin_chosen or not cage_opened)` rather than dropping the cage test altogether. Between the gate opening and the bin, `cage_bin` already reads `derek_file` (the default-bin mapping, erb:198), but on the door route the player hasn't chosen yet, and "The letters went in her feed" would be false. Tested on a scratch copy: hatch then gate gives the bin's line on the next ask; handover gives "The letters went in her feed…" once Derek's file is handed over; the door route with the letters gives the warning, opener and "You've got the letters…"; tidied after the cage gives its arm once; talked or knocked out shows no button. Update CONTRACT §2.1 row 17's guard and "Closes" cells and add a §15 line. Run reopencheck for `agent_0x99` afterwards.

### m2 (minor). The pre-hatch arm still says the lever is "something he wants"

**Evidence.** The else arm reads "You'd need something he wants to talk him off it. Otherwise it's a fight." (phone:835). R3 m2 showed that the lever is paper that names him, not something he wants: "He reads the courier line, J.T." (tran.ink:53). R3 changed only the letters arm. Since R3 m1, the else arm is the line nearly every non-tidied player hears, often twice. It's the cue for the hatch choice, and "something he wants" doesn't point at either bin. A player would think of a bribe or a trade. A player who wants the talk-down has to pick the letters at the hatch without ever having read them, and the only fair way there is: Tran is on Maya's list (Social Fabric's people, dock and phone:136-145), the letters are Social Fabric's, so they probably name him. "Something he wants" breaks that chain. The derek and tidied arms ("The letters went in her feed", "Nothing on him tonight") already treat the lever as paper about him.

**Fix** (phone:835, unvoiced): "You'd need paper with his name on it to talk him off it. Otherwise it's a fight." (16 words). It also calls back to Tran's opening line, "Paper. You people break into buildings at night for paper." (tran.ink:27), and it teaches the actual idea: the leverage comes from evidence. It doesn't say which bin. Compiled and run on the scratch copy. Update the quote in CONTRACT row 17.

---

## 3. Fresh audit (skill Steps 2–5) on the current build

**Room depth** (`room_depth.py`): 11 rooms, max depth 5 (`salvage_cage`), 0 empty, 11 lockType declarations. Unchanged.

**Boss-key table.** No erb or engine change since d2fd06fe. The lock lines still match R2 §3 exactly: `front_desk` key erb:1082, `hl_box` password :1348, `staff_passage` RFID :1464, `restricted_stacks` RFID :1597, `restricted_cage` RFID :1711, `plan_cabinet` biometric :1868, `sorensen_office` password :1931, `director_safe` PIN :1945, `tape_room` RFID :2155, `salvage_cage` password :2265, `enrolment_crate` key :2368. The verdicts stand: boss-key for the plan cabinet, the tape room and the H&L box; by-design carry-over for the front desk, staff passage, cage gate and safe; an announced story gate on the office; the salvage keypad split and kept (W1). I re-checked the salvage chain myself: MSJMQAEGDZNVI under BONEYARD decodes to LEWISANDCLARK (erb:53), and the chart says "Bay 12 … Salvage … BONEYARD" and "House rule: cage and keypad codes use the bay word." (erb:2209). That is a fair deduction from tier 1's "Archives key things to the shelves. Look at the wall by that keypad." (phone:728).

**Chain depth and kit.** Unchanged. All five start-kit classes are used, the cloner twice (EM4100, then MIFARE with custom keys). The game's one new technique is the Vigenère keypad, taught by a three-tier hint ladder, and then reused with an inferred key on the Alpha sheets.

**Choices that matter.** These payoffs are intact: m01 (Sorensen's recognition line, the Tran warning, Derek's file remarks, erb:352-355), m02 Gary, m03 Victoria (the maintenance code and the door scene), m05 Torres, m06 Irina, m07 dossier, m08 tidied and named-on-evidence. The in-mission hatch bin pays off on the closing card, the afterwards call (phone:264-301), the Reading's bet (erb:365-371), the hand (phone:895) and Tran. Only the Tran signpost is short (m1, m2). W1–W10 stand. I found no play reason to reopen any of them.

**Bug sweep.** No new `item_picked_up` mappings; the existing ones key on `notes` with `data.itemId`. No tasks without a completion route: `concludeRequires` is the four flag submissions (erb:722). No author notes, rename residue or stale geography in the changed lines. "Server closet off the open stacks" matches the connections. Validator: the same 23 documented items (safe-content suggestions, cutscene `onceOnly`, `beta_crate`, `stacks_release`, office edge, the salvage two-source warning), nothing new. dialoguelint: 5 `not-x-but-y` and 1 `you-after-choice`, all in lines unchanged since earlier passes; phone max 25 words. reopencheck: `agent_0x99` 0 problems over 1,617 reopens. The four contact stubs (Recruiter, Nightshade, Torres, Gary) replay "start" by design, as in every round. Ink: all fifteen recompiled files are identical to the committed JSON.

**Pacing and layout.** Unchanged. With m1's fix, the "stacks → closet with the letters" return (plan §8) gets its pointer on every route, not only the hatch.

---

## 4. Notes (not counted)

- **n1.** If m2 lands, the plan's §5 P4 text and CONTRACT row 17's history cell still quote the old else line as it was. Leave them as history; update only the current-arms list.
- **n2.** On tidied, m1's guard means a player who never asked before the cage sees "[Tran.]" appear after it. That's intended (the arm is true and retires on one ask).

---

## 5. For phase 5 (browser checks, not findings)

- Tran topic live, after m1 and m2: ask before the hatch twice (second ask is the one line); choose Derek's file, open the gate, ask again ("The letters went in her feed…", then gone). Repeat with the letters ("You've got the letters…") and walk to the closet: the lever choice shows, "[Go.]" completes `stop_the_tape_wipe`, he's hidden, the card reads "Walked out and made a phone call." and "97 of 212 reels". Also "[No deal.]", then a return.
- Handover: open the gate without choosing, take Derek's file on entry, then ask HaX.
- Door route on an `m03_victoria_fate == "recruited"` save: maintenance code, take the letters at the door, ask HaX, then Tran.
- `m08_nightshade_tidied` save: one ask, the tidied arm, button gone.
- Carried from R3: keypad tiers in order (tier 2 as two bubbles, method first; "Gary told you how." on `m02_gary_protected`); the `realisation` reply "No. It hasn't."
- Carried from R2 n5: Torres click → cancel; Gary with a first-try correct code; tell Noor, then try the staff door; the late file on the alpha-tapes branch; the read-every-page safe check.

---

## 6. To close the phase

1. m1 (phone:814 guard) and m2 (phone:835 wording). Recompile, `tagdiff` against HEAD (one choice condition and one text line; voiced delta 0), dialoguelint, reopencheck `agent_0x99`.
2. CONTRACT row 17 (guard, closes and the else quote) and a §15 "Puzzle chains round 4" line.
3. Round 5 confirmation, which is the AGENTS.md cap. At 0 majors and 0 minors, phase 2 is complete. Anything left above that is listed as open.

Measured against m01_first_contact and m02_ransomed_trust.
