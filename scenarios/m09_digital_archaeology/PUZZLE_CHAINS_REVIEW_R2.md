# m09 Digital Archaeology: puzzle chains, round 2 review

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at d2fd06fe ("puzzle chains round 1 fixes"). Round 1's plan is `PUZZLE_CHAINS_PLAN.md` (P1–P7); its record is CONTRACT §15, "Puzzle chains round 1" (CONTRACT.md:835).

**Method.** Read the commit diff, then traced each fix through the engine (`npc-manager.js`, `unlock-system.js`, `minigame-manager.js`, `npc-conversation-state.js`). Recompiled the three changed ink files with inklecate: each output is identical to the committed JSON. Ran `room_depth.py`, the validator (`--skip-ink --no-graph`, no graph rewrite), `dialoguelint` and `reopencheck` on m09. I opened no VM plan, SecGen file or field guide. VM flags are black boxes, and I took as settled that the H&L file number is reachable only through flag 2 and that no cage clue feeds flag 3. No browser run in this round.

**Counts: 0 blockers, 0 majors, 2 minors.** Six notes are listed after the findings. They are not counted.

**Verdict: not yet complete.** F1–F7 are all fixed and hold up. The two minors are one-line ink fixes, both unvoiced. Fix them, then run a short confirmation round.

---

## 1. F1–F7: confirmed fixed

| Finding | Fix | Where | Status |
|---|---|---|---|
| F1 keypad tier 1 gave the whole method | P1, three tiers on `keypad_topic_asks` | `m09_phone_agent0x99.ink:95` (VAR), `:718-740` (topic) | Fixed |
| F2 Torres' ring shut the opened H&L box | P2, `hl_box_opened` latch, second ring, split pointer | `scenario.json.erb:313` (latch), `:875-876` (rings), `:2539` (global); `m09_phone_torres.ink:16, 34-39` | Fixed |
| F3 two cage lines named the wrong room | P3 | `m09_phone_agent0x99.ink:523` (voiced), `:607` | Fixed (see m2 on the reply) |
| F4 tidied Tran topic pointed at a burned lever | P4, two-line arm | `m09_phone_agent0x99.ink:816-822` | Fixed (see m1: the same gap on another branch) |
| F5 Gary rang after the door was open | P5, synced `salvage_opened` | `m09_phone_gary.ink:13, 24-32` | Fixed |
| F6 route A dead door after telling Noor | P6, text A3-03c | `scenario.json.erb:316-317`; `texts/A_hax_texts.md:14` | Fixed |
| F7 Torres' fallback could shut the safe mid-read | P7, `room_exited` from the office | `scenario.json.erb:879` | Fixed |

### The points the implementer asked about

**P1 tier 1 and Gary's phrase.** "Archives key things to the shelves." (phone:728) sits close to Gary's "Archives key them to the shelf scheme." (gary.ink:29). It doesn't take anything from Gary's payoff. A non-Gary player never hears Gary, so for them it is just the nudge. On `m02_gary_protected`, Gary rings 1.5 s after the first keypad try (erb:899). He waits for the keypad to close (npc-manager.js:620-623), so his call opens before the player can reach HaX's hub, and `gary_called` is already true when tier 1 plays. Tier 1 then ends "Gary told you how." (phone:730): HaX picking up his framing and deferring to him. Gary's call still hands over tier 2's content (the cipher's name, the bay word as key, the chart) unasked, at the first try. A non-Gary player needs two asks to get there. That is the m02 reward, and it survives. No finding.

**P1 as a teaching ramp for Vigenère.** It works. Tier 1 (phone:728) points at the room and leaves the deduction to the player: "their own code" plus a chart on the wall. The chart sits on the tape room's north wall beside the keypad (room_m09_tape.json: legend gid 1324 at (82,52), keypad gid 1325 at (68,48); the salvage door is north, erb:2161). From there the player has to match "Salvage" to BONEYARD and read the house rule (erb:2209). Tier 2 (phone:735-736) names the bay word and the cipher. Tier 3 (phone:738) names the tool. A wrong key turns into visible nonsense in CyberChef before anything is typed, so the trial is cheap. The status ladder doesn't undercut the tiers ("The code's the catalogue line I sent you.", phone:918). The topic is a sticky choice gated on `not salvage_opened`, so it can't burn (S1), and reopencheck for `agent_0x99` gives 0 problems. On wording, see note n3.

**P2 double-ring safety.** `onceOnly` is used up only when a handler actually fires. The condition is checked both when the ring is scheduled and when it fires (npc-manager.js:610-627, 762-790). Each path:
- *Right code.* The click schedules ring 1. The keypad ends with `endMinigame`, which calls `onComplete` → `unlockTarget` in the same tick (minigame-manager.js:269-275; unlock-system.js:298-302). `item_unlocked` is emitted inside `unlockTarget` (unlock-system.js:705-713), before the 500 ms auto-launch timer (:716-721). HaX's latch has no delay, so `hl_box_opened` is true before any retry can land in the gap. Ring 1 re-checks, finds `!hl_box_opened` false, and is dropped without being used up; later clicks fail the same term. Ring 2 waits out the open container and plays once. One call.
- *Click → cancel.* Ring 1 fires about 1.5 s after the click, or as soon as the keypad closes. Torres' first line sets `torres_called` (torres.ink:26). Ring 2 and the P7 fallback both need `!torres_called`. One call, on the "Their boxes take the ledger's file number" arm, which is right.
- *Click → cancel → come back later.* Ring 1 has already fired (as above). On the later visit, ring 1 is used up and ring 2 fails `!torres_called`. No second call. If the player comes back *within* 1.5 s and types the right code, ring 1 is still pending and is dropped in the gap as in the first case, and ring 2 plays. One call either way.
- *Click before flag 2.* Fails at scheduling. Nothing is pending or used up.

`forced: false` only removes `disableClose` (erb:89-103), so the call still opens and the first line still sets `torres_called`. The commit's browser proof (CONTRACT:835, games 3502/3505) covers the right-code path before and after. The cancel paths are traced, not seen (note n5).

**P6 and `roomId` on `door_unlock_failed`.** Confirmed. `doorAttemptData` carries `roomId` from `doorProperties` (unlock-system.js:115-120), and `emitDoorUnlockFailed` spreads it into the payload for both the plain and the `:<connectedRoom>` events (:125-131). The staff door is RFID. With the start-kit cloner and nothing saved, the reader refuses and emits `no_card` (:525-529). With a saved card the cloner opens, and a refused card emits through `onRefused` (:540). If Noor handed her card over (warned in time), the player holds a valid card and the door just opens, so no refusal fires. Noor really does leave: "goes for her coat" (noor.ink:130), and she is hidden (erb:1132-1133). "She took her card home" is true.

**P5's opened arm.** `salvage_opened` latches on `door_unlocked` (erb:270), which is emitted synchronously in `unlockTarget` (unlock-system.js:672-682). Gary's delayed ring waits while the keypad is open, so on a first-try correct code it fires after the latch. The VAR is a declared global (erb:2482), and `syncGlobalVariablesToStory` writes it into the story (npc-conversation-state.js:466-484). The opened line runs 17 words. "[Thanks, Gary.]" → "Go on, then. Somebody should read an archive properly for once." (gary.ink:37-39) still reads fine after "Didn't need me, then." The cameo is kept. Not seen in a browser (n5).

**P4's two-line split.** Both lines are under the 25-word cap (dialoguelint: phone max 25). "Leave him to it" is a real option, since `stop_the_tape_wipe` is optional. Tran's only talk-off lever is `cage_bin == "letters"` (jesse_tran.ink:52), so the tidied line is accurate. The same gap is still open on another branch: see m1.

**Superseded markers.** Both are in place: `stage_6/lore_fragments.md:336` and `stage_4/objectives_tasks.md:364` each say "Superseded (m09 puzzle chains R1 P1) … Do not restore". The old variable name survives in docs only (n2).

---

## 2. Findings

### m1 (minor). On the non-tidied branch, picking Derek's file at the hatch leaves HaX's Tran topic pointing at the letters that were just shredded

**Evidence.** "[Pull Derek's file through.]" sets `cage_bin` to `derek_file`. Sorensen then "tips the other bin into the feed" (`m09_sorensen_hatch.ink:92-99`), and on this branch the other bin is the Social Fabric letters (erb:536, "Shredded: the Social Fabric letters"). The hatch comes before the cage gate, so HaX's topic 17 is still offered (gate `not tran_topic_given and not cage_opened and tran_outcome == "left"`, phone:813). Its non-tidied arm says "You'd need something he wants to talk him off it. Otherwise it's a fight." (phone:821). The only thing Tran wants is the letters (jesse_tran.ink:52). This is F4's defect on a second branch. A player who wants the non-violent route goes looking for paper they watched go into the shredder. HaX knows the letters are gone, because she reacts to the choice (hatch.ink:106).

**Why it matters.** It's the in-mission choice that should pay off at Tran, and right now it misleads instead. The reverse case misses a payoff too: a player who saved the letters hears the generic line rather than being told they already hold the lever.

**Fix** (`m09_phone_agent0x99.ink:817-822`, unvoiced; `cage_bin` is already a synced VAR at phone:24). Branch three ways after "He's wiping tapes from the server closet off the open stacks.":
- `m08_nightshade_tidied` → as now.
- `cage_bin == "derek_file"` → "The letters went in her feed. It's a fight, or you leave him to it."
- `cage_bin == "letters"` → "You've got the letters. That's what he'd want back."
- else → as now.

Update CONTRACT §2.1 row 17 (CONTRACT:117) and add a §15 line.

### m2 (minor). P3's new choice gets a reply that answers the old one

**Evidence.** The choice now reads "[Her schedule. His cage has no tick.]" (phone:607), but HaX still answers "No. It isn't. He shredded everyone but himself." (phone:609). "It isn't" answered the old "This room isn't on it." Against "has no tick" it doesn't parse. This is the big realisation beat of act 3, played as text (the hour read is unvoiced, erb:286-295).

**Fix.** phone:609 → "No. It hasn't. He shredded everyone but himself." Unvoiced, no tag change. Update the quote in CONTRACT §2 (CONTRACT:90).

---

## 3. Fresh audit (skill Steps 2–5) on the current build

**Room depth** (`room_depth.py`): 11 rooms, max depth 5 (`salvage_cage`), 11 lockType declarations. These match round 1. No lock, room or connection changed in d2fd06fe.

**Boss-key table.** Every verdict in PUZZLE_CHAINS_PLAN §3 still holds. Line numbers have moved; current ones:

| Lock | erb | Key / code from | Verdict |
|---|---|---|---|
| `front_desk` key | 1082 | lockpick (m01) or Old Coyote's ring | ✅ by design |
| `staff_passage` RFID | 1464 | Noor's EM4100 clone (m03), or her card; now with the A3-03c pointer if she's gone (317) | ✅ by design |
| `restricted_stacks` RFID | 1597 | flag 1 → HaX `unlockDoor` (166, 170-171) | ✅ |
| `restricted_cage` RFID | 1711 | Sorensen's MIFARE clone at the hatch, or Victoria's code (185-187) | ✅ by design; m03 recruited shortcut |
| `plan_cabinet` biometric | 1868 | print on the stamp (1674), one room back | ✅ boss-key |
| `sorensen_office` password | 1931 | story gate on `deck_choice_made` (253-255) | ✅ announced |
| `director_safe` PIN | 1945 | cracker feedback or "Lease start: 06/02/16" (2066) | ✅ by design |
| `tape_room` RFID | 2155 | key card in the safe (2044) | ✅ boss-key |
| `salvage_cage` password | 2265 | coded line from flag 1 + chart beside the keypad + CyberChef | ⚠️ split, kept (W1). The three beats are now carried by the hint tiers rather than the room, which was the point of P1 |
| `hl_box` password | 1348 | flag 2's file number | ✅ boss-key, optional |
| `enrolment_crate` key | 2368 | lockpick | ✅ by design, optional |

**Chain depth and carry-over kit.** Unchanged. All five start-kit classes are used: picks, the cloner twice (easy then hard), the fingerprint kit, the cracker, CyberChef. The salvage keypad is the mission's one new technique, and its hint ladder now leaves the key-finding step to the player.

**Choices that matter.** Round 1's payoffs are intact and better wired: m02 Gary (the opened arm keeps the cameo), m05 Torres (now reliable on every box path), m03 Victoria (the maintenance code), m08 tidied (the hatch's third bin, and the Tran arm), m01 Maya (the Tran warning and the guard text). The one in-mission choice I found still wired against the player is the hatch bin at Tran (m1). The settled rulings (W3, W4, the legacy box) stand. I found no concrete play reason to reopen them.

**Engine bug classes.**
- `item_picked_up` keyed on an id: none new.
- Delayed rings against containers: the new rings are covered above. P7's ring can, in principle, land while the player is reading pages in a container in `restricted_stacks` in the 1.5 s after leaving the office (n6). That's the class the plan's engine backlog item covers, and it isn't counted.
- Tasks: unchanged. Author notes, rename residue, stale geography: none in the changed lines. "In the tape room" is right from both the cage and the bench.
- Validator: no new warnings. The 23 items are the documented ones (stacks_release, beta_crate, office edge, cutscene `onceOnly`, safe-content suggestions).
- dialoguelint: no new rule hits in the changed files.
- reopencheck: `agent_0x99` 0 problems. The four "replays the opening of start" problems are the phone contacts' home stubs ("The number rings out."), which are unchanged and intended.
- Ink: all three recompiled files match the committed JSON exactly.

**Pacing and layout.** Unchanged since round 1.

---

## 4. Notes (not counted)

- **n1. CONTRACT says P7 replaced "the room-entry fallback"** (CONTRACT:316 and :835). It replaced the `global_variable_changed:reading_found` ring with an 8 s delay (old erb:866). It's a doc-only error, but it could mislead a later pass looking for a room-entry mapping.
- **n2. Stale variable name `keypad_topic_asked`** in `stage_4/objectives_tasks.md:234, :860` and `planning_notes/overall_story_plan/mission_initializations/finale/FINALE_ARC.md:597`. FINALE_ARC's list exists so m10 avoids local-name collisions, so update it to `keypad_topic_asks`. The ink comment at phone:94 is fine.
- **n3. Tier 2 order** (phone:735-736). The key comes first and "It's Vigenère." second. For a learner, method then key reads more naturally ("It's Vigenère. The key is the salvage bay's word, on the chart by the keypad."). Optional. The dialogue phase can decide.
- **n4. The guide is offered twice in a row.** The A3-20 text (erb:271-272) and tier 1's last line (phone:732) both say "If the cipher's new to you…". The text can easily be missed, so the repeat is defensible. Leave it.
- **n5. Live proof is partial.** CONTRACT:835 records browser runs for P2's right-code path and for P7 only. PUZZLE_CHAINS_PLAN §12 also asks for: Torres click → cancel; Gary with a first-try correct code (P5); tell Noor, then try the staff door (P6); the late file on the alpha-tapes branch (P3); and the read-every-page safe check. My static traces say each works. Put them in the phase-5 playtest script so they are seen, per the "fix claims need live proof" rule.
- **n6. P7's 1.5 s window.** Leaving the office drops the player into `restricted_stacks`. A player who opens a multi-page container there within 1.5 s could have the ring land in a page-to-container gap. It's unlikely, and the container reopens. Covered by the engine alternative under P7 (backlog, needs approval).

---

## 5. To close the phase

1. m1 and m2: ink only, unvoiced. Recompile, `tagdiff` against HEAD (text only), dialoguelint, reopencheck `agent_0x99`.
2. CONTRACT: row 17 and the §2 quote, a §15 line, and n1's wording.
3. A confirmation round (round 3) on those two edits. If it finds 0 majors and 0 minors, phase 2 is complete. Carry n5's checks into phase 5.

Measured against m01_first_contact and m02_ransomed_trust.
