# m09 Digital Archaeology: puzzle chains, round 6 review

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at 6529ff08 ("puzzle chains round 5 fixes"). Round 5 is `PUZZLE_CHAINS_REVIEW_R5.md`; its record is CONTRACT §15, "Puzzle chains round 5" (CONTRACT.md:844).

**Method.** I read the 6529ff08 diff, the Tran topic (phone:812-848), the cage, hatch, door, guard, Tran, Noor, Old Coyote and Alpha inks in full, and the erb around every person-chat mapping. I rendered the erb to JSON and listed every conversation-opening mapping with its `onceOnly` and `disableClose`. I recompiled all fifteen ink files with inklecate, and each matches the committed JSON. I drove HaX's hub in the vendored inkjs through the Tran topic on four routes. I ran the guard's ink and a reopen simulator (adapted from `m10_r9/reopen_sim.cjs`) in the same inkjs. I also ran `room_depth.py`, the validator (`--skip-ink --no-graph`), `dialoguelint` and `reopencheck`, and traced the person-chat close, reopen and hostile paths in the engine. I opened no VM plan, SecGen file or field guide, and treated the VM flags as black boxes. I did no browser run. My scratch files are in the session scratchpad, under `r6_review/`.

**Counts: 0 blockers, 0 majors, 3 minors.**

**Verdict: not yet complete.** R5's m1 and n1 are fixed, and neither causes a new problem on any route. The open question on the archive guard is settled: an Esc on his one line leaves him standing in the open stacks, visible but not hostile, until the player chooses to talk to him (m1). There is no soft-lock and no false line later. What it costs is the m01_maya_ko consequence, a guard who chases you through the hub room. The coordinator's reopen sweep found one real hit: closing Sorensen's hatch at its first choice and reopening it skips her recognition and HaX's description of the bins, so the bin choice is made without being told what the letters are (m2). The same mechanism gives Old Coyote's challenge a false "Same as before" line (m3). All three fixes are small ink edits. Two of them are tested in inkjs.

---

## 1. R5 items: confirmed fixed

| R5 item | Where now | Status |
|---|---|---|
| m1, door scene could be closed before the bins | erb:1807-1815, `"disableClose": true` on `sorensen_door`'s `door` mapping. In the rendered JSON it is the only change to that NPC: mapping 0 carries `disableClose` and mapping 1 (`handover`) does not | Fixed |
| n1, Tran topic on the hatch route once the gate is open | phone:815 guard `(bin_chosen or hatch_talked or not cage_opened)`; phone:819 retire `bin_chosen or m08_nightshade_tidied or (hatch_talked and cage_opened)` | Fixed |
| Docs | CONTRACT row 17 (:117), §3.3 B5 (:243), §6.2 two rows (:458-459), §15 R5 paragraph (:844) | Match the build |

**New problems from the fixes.** I found none.
- *The door scene is now forced.* All four buttons end in `#exit_conversation` (door.ink:51-87), and the tidied build swaps "[Take the letters.]" for "[Take Nightshade's copy.]", so every build has an exit. A reload mid-scene cannot strand the choice, because `onceOnly` is saved only when the conversation closes (`npc-manager.js:793-805`, `_persistTriggerOnClose` :1336). The mapping can therefore fire again on the next cage entry.
- *The Tran topic, in inkjs, on the current build:*

| Route | Step | What HaX says | Topic after |
|---|---|---|---|
| Hatch talked, no bin, gate opened, then a detour to HaX (m01_maya_ko) | before hatch / hatch talked / gate open / after handover | warning + opener + "paper with his name…" / that line again / "The letters went in her feed. It's a fight, or you leave him to it." / no button | retired at the gate |
| Hatch, letters | hatch talked / letters / gate | opener + "paper…" / "You've got the letters. He's the J.T. in them. Show him." / no button | retired |
| Door (Victoria recruited) | gate / letters taken at the door / again | no button / warning + opener + "You've got the letters…" / no button | retired |
| Tidied, hatch talked | hatch talked / gate / again | warning + opener + tidied arm / no button / no button | retired at once |

The n1 arm can only play when it's true. With the gate open and the hatch talked, Sorensen has left the counter: the hatch hides on `cage_opened`, erb (rendered) `sorensen_hatch` mapping 0. The `handover` scene can only give Derek's file ("The other one's already gone.", door.ink:95), and erb:198 has already set `cage_bin` to `derek_file`. A player who talked at the hatch and then used Victoria's maintenance code also gets `handover`, not the door scene (erb:1810 needs `!hatch_talked`), so the hatch-route arm is true there as well.

---

## 2. The archive guard's ambush (the open question from CONTRACT §15 R5)

**The question.** `archive_guard`'s only conversation is opened by a `onceOnly` mapping on `global_variable_changed:tran_alerted`, which also sets him visible (erb:1312-1319). His ink is one line, then `#hostile:archive_guard` and `#exit_conversation` on separate lines (`m09_archive_guard.ink:9-11`). Can an Esc on that line leave him visible but not hostile, and does that matter?

**The trace. Yes, an Esc on that line leaves him visible and not hostile.**
1. *Where the tags are.* In ink, a tag on its own line after a line of text belongs to the next output. Running the compiled `m09_archive_guard.json` in the vendored inkjs gives two Continues. The first is `"Lyle Dillard: Dillard, Statewide Security. Stay where you are."`, with tags `[]` and `canContinue` true. The second is `""`, with tags `["hostile:archive_guard","exit_conversation"]`. `InkEngine.continue()` (`systems/ink/ink-engine.js:45-62`) stops at the first line with text, so the person-chat shows the line with no tags. The hostile tag is only processed when the player advances (`person-chat-minigame.js:1381-1396`).
2. *Visible first.* `setVisible` runs synchronously in the handler (`npc-manager.js:918-922`), and the person-chat opens 500 ms later (:1067-1087). He is on the floor before the line appears.
3. *Closable.* The mapping has no `disableClose`, so `false` is passed (`npc-manager.js:1087`), and Esc, the × or End Conversation close the scene (R5 cited `base-minigame.js:20, 75-76`).
4. *Never fires again.* `onceOnly` is persisted when the conversation closes (`npc-manager.js:803-805`). The catch-up mapping (erb:1320-1325) only sets him visible on room entry. He has no `los.challengeOnSight`, so nothing else re-engages him.
5. *A reload mid-line ends in the same state.* `tran_alerted` is already true, so the `global_variable_changed` mapping can't fire again, and the catch-up mapping only shows him. Hostility is saved only once set (`npc-hostile.js:136-172`), so there is nothing to restore.

**What follows.**
- *Soft-lock: none.* He stands at (3.5, 8), clear of the shutter's mouth (x 32-64; DRESSING_REVIEW_R4 S5), so no door is blocked. No task, aim or `concludeRequires` names him (`archive_guard_ko` is read only by his catch-up mapping, erb:1323).
- *False line later: none.* The only later mention is Tran's "Somebody from Statewide is on his way…" (`m09_jesse_tran.ink:28-30`), which stays true. A3-04 ("Tran's just sent the guard to your door.", erb:177) is about Old Coyote.
- *Skipped fight: yes.* He says "Stay where you are." and then stands idle while the player walks past him on every crossing of the open stacks. The m01_maya_ko consequence (Maya's names lost, Tran recognises you, a guard hunts you through the hub room) disappears on one Esc, or on a reload during his line. If the player talks to him, he turns hostile: the saved mid-knot state resumes into the tag (`person-chat-minigame.js:505-533`), or a fresh start replays the line. So the fight is only lost for a player who leaves him alone. That's minor: m1.

---

## 3. Findings

### m1 (minor). An Esc on Dillard's one line, or a reload during it, leaves him idle instead of hostile, so the m01_maya_ko ambush can be skipped

**Evidence.** §2 above: `m09_archive_guard.ink:9-11`; erb:1312-1319; inkjs output for the compiled JSON.

**Why it matters.** This is the only physical consequence of the m01 Maya knock-out in m09, and the user's test for this phase is that earlier choices matter. An Esc is a natural reflex here: the line comes from a man the player can't see yet, 500 ms after Tran spots them in the closet. The threat then turns into furniture, and nothing tells the player that.

**Fix** (`m09_archive_guard.ink`, move one tag). Put `#hostile:archive_guard` on the line *above* his line, and leave `#exit_conversation` below it:

```
=== start ===
#hostile:archive_guard
Lyle Dillard: Dillard, Statewide Security. Stay where you are.
#exit_conversation
-> DONE
```

Checked in inkjs on a scratch copy: Continue 1 now returns the line with `["hostile:archive_guard"]`, and Continue 2 returns `["exit_conversation"]`. The person-chat processes a line's action tags before showing its text (`person-chat-minigame.js:1122-1126`), so he is hostile, and his hostility is saved, the moment the line appears. That covers an Esc and a reload. m03 already uses the same order: `#hostile:terry_mott` above "Terry Mott: Right. I warned you." (`m03_npc_terry_mott.ink:126-127`). The spoken text is unchanged, so there's no audio change. Recompile, run tagdiff (one tag moved), and update CONTRACT §3.6 (:261), whose order "then `#hostile`…" will be stale.

*Alternative:* add `"disableClose": true` to the mapping (erb:1312-1319), the same treatment as R5 m1. That stops the Esc, but not a reload mid-line, so I'd take the ink move.

### m2 (minor). Closing Sorensen's hatch at its first choice and reopening it skips her recognition and HaX's bin lines; the bin choice is then made without being told what the letters are

**Evidence.**
- The hatch's opening choices sit in knot `start` (hatch.ink:41-46), below its re-entry guard `{hatch_met: -> hub}` (hatch.ink:33), which comes after `~ hatch_met = true` and `#set_global:hatch_talked:true` (:34-35).
- On a reopen, the engine restores the saved state and, at a choice point, re-navigates to the knot that owns the choices (`person-chat-minigame.js:546-566`). Here that is `start`, whose guard now sends the player to `hub`.
- Reopen simulator (inkjs, the committed JSON). The first open shows the narrator, "The lease-holder's auditor…" and the stamp line, then the two choices. Close there and reopen: the owner knot is `start`, the text is "Take your time. The shredder won't.", and the choices are "[Pull Derek's file through.]", "[Pull the letters through.]", the clone line and the exit.

**What is lost.** Everything in `recognition` (hatch.ink:50-76):
- the m01 recognition line, one per `m01_final_choice` (the mission's m01 payoff at the hatch);
- "You're not from the lease-holder. You're the one he writes about." (the scene's turn);
- HaX's two bin lines: Derek's file as "the only place anyone wrote down why he did what he did", and the letters as being "about a union rep in Butte they're about to bury" (or, on tidied, Nightshade's own words).

Those two lines are the only place the hatch says what each bin holds and what's at stake. Without them, the in-cage choice the whole night turns on (the card, the afterwards call, the Reading's bet, Tran, m10) becomes two labels. The door scene (door.ink:27-48) and `handover` don't have this problem: the first is `disableClose` and has no early choice, and the second has no choice at all.

**Why minor.** It needs an Esc at the first choice of the hatch's first talk. That's plausible (it's the first beat of a scene the player walked up to, and the buttons are flavour), but it isn't the default path, and nothing is blocked. On that save, though, an earlier choice (m01) and the mission's own central choice both lose their framing.

**Fix** (hatch.ink, a knot split; Noor already does this, `m09_noor_haddad.ink:52, 55-70`). End `start` with `-> opening` after the stamp line, and move the two choices into a new knot `=== opening ===` that prints nothing before them:

```
Narrator: She stamps a box DESTROYED and slides it back toward the noise.
-> opening

=== opening ===
+ [That's right. They want tonight's run checked against the schedule.]
    ...
    -> recognition
+ [I'll stand.]
    ...
    -> recognition
```

Checked in inkjs on a scratch copy. After a close at the first choice, the owner knot is `opening` and the reopen shows the same two choices with no text; the D9 reopen helper re-shows her last line (`person-chat-reopen.js`). Picking either choice plays `recognition` in full, then the hub. The first open is unchanged. No spoken line changes. Recompile, run tagdiff (one new knot, one divert), and run dialoguelint (check that the blank re-entry on `opening` is accepted, as it is for Noor's `cover`).

### m3 (minor). After an Esc on Old Coyote's first challenge, he challenges again with "You again." and the player can only answer "[Same as before. Carry on.]", though they never gave a cover

**Evidence.**
- `challenge` increments `coyote_challenges` on entry (`m09_old_coyote.ink:23`). The cover buttons need `coyote_challenges == 1` (:36, :41), and "[Same as before. Carry on.]" needs `> 1` (:46).
- Both ways back into `challenge` re-run that increment. One is his `player_spotted` mapping (`cooldown 0`, targetKnot `challenge`; rendered JSON). The other is a reopen by walking up to him, since the restored choices belong to `challenge` (`person-chat-minigame.js:546-566`).
- Simulator: first challenge, close, reopen. The reply is "You again.", and the choices are "[Same as before. Carry on.]" and the truth line.

**Why it matters.** The player is made to say "Same as before" about a cover story they never told. The auditor and contractor covers are also lost for the rest of the night, and they set the wording of his later greeting (:28-33) and of the truth buttons (:52-57, 100-105). It's flavour, nothing is blocked, and the truth button still works. It's a false line in the player's mouth, though, and a small loss of choice.

**Fix** (`m09_old_coyote.ink:36, 41, 46`). Key the buttons on the cover rather than the count: `{coyote_cover == ""}` on the two cover buttons, and `{coyote_cover != ""}` on "[Same as before. Carry on.]". With no cover yet, a second challenge then reads "You again." and offers the two covers and the plain truth button again, which is true. No spoken line changes.

---

## 4. The coordinator's reopen sweep (every m09 person-chat ink)

The rule: within a session, a reopen at a choice point re-enters the knot that owns the choices (`person-chat-minigame.js:546-566`), so an entry-knot guard is skipped. A save that ran to `DONE` restarts at `start` instead (:521-525).

| Ink | Choice-owning knots reachable on a reopen | State-changing choices and their guards | Result |
|---|---|---|---|
| Sorensen hatch | `start` (opening choices), `hub` | bins: `not bin_chosen and not bin_pulled` in `hub` (:92, 100, 112); clone: `not stacks_card_cloned` (:124); NPC hidden on `cage_opened` | **m2**: `start`'s re-entry guard skips `recognition` |
| Sorensen door | `door` | all four buttons exit; `disableClose` (R5 m1) | Clean |
| `handover` | none | tags above the line | Clean |
| Sorensen cage | `hub` | talk-down: `nightshade_file_held and sorensen_fate == "left" and not talked_down` in `hub` (:60) | Clean: every guard is in `hub`, and a knock-out ends talk |
| Tran | `hub`, `deal` | lever in `hub` on `cage_bin == "letters" and tran_outcome == "left"` (:53); `deal`'s "[Go.]" can't go stale (only a knock-out changes `tran_outcome`, and that ends talk); hidden on `talked` | Clean |
| Noor | `cover`, `hub`, `reach` | `cover` is its own knot (the pattern m2 needs); `reach` has one button and nothing in the world can make it stale; hidden on `noor_told` | Clean |
| Old Coyote | `challenge`, `hub` | truth buttons on `not old_coyote_told`; hidden once told | **m3**: the cover/"same as before" split keys on the count |
| Archive guard | none (no choices) | see §2 | **m1** (a close, not a reopen) |
| Alpha clip | none | repeatable, ends `DONE` | Clean |
| Closing debrief | n/a | `disableClose` on both mappings | Clean |

**One-shot closable scenes (R5's sweep, redone).** These are the conversation-opening mappings with `onceOnly` and no `disableClose`, from the rendered JSON:
- *Dillard:* m1.
- *`handover`:* its tags sit above its line. Clean.
- *HaX phone calls `flag1_read`, `ledger_read`, `afterwards` and the dock:* each sets or gives what matters on or before its first line, or on the line a close can't skip. The salvage note comes on line 1 (phone:194-195); `ledger_read_heard` is set on line 1 (:220); `afterwards_heard` is set on the last line, and hub topic 7 restores the call (:297, 748); `dock_done` sits on the last line (:173-179).
- *The ledger's file number:* it also appears on the flag-2 screen (erb:1540-1544) and in HaX's pointer text (erb:373-374).
- *Nightshade, Torres and Gary:* contact stubs that replay `start` from the phone (reopencheck, as in every round). Clean.

---

## 5. Fresh audit (skill Steps 2-5) on the current build

### 5.1 Room depth and boss keys
`room_depth.py`: 11 rooms, maximum depth 5 (`salvage_cage`), 0 empty, 11 lockType declarations. The depths are unchanged from R5. I rebuilt the lock table from the erb lines R5 cites and found no change in 6529ff08 (the commit touches only erb:1807-1815 and phone:812-822). Every lock keeps R5's verdict: boss-key, by design, or the kept split on LEWISANDCLARK (plan W1). There is no key-before-lock and no same-room collapse.

Soft gates:
- The Tran talk-off is a boss-key on every route now that R5 m1 is fixed.
- Dillard is an avoidable hazard by design, but m1 lets an Esc remove him rather than the player's skill.

### 5.2 Choices that matter (3a)
`concludeRequires` is still the four flags (erb:722). The m01-m08 payoffs listed in R5 §3.3 are intact, with two weak spots found this round, both on rare paths:
- the m01 recognition at the hatch (m2);
- the m01_maya_ko guard (m1).

The hatch bin is still the mission's busiest choice. m2 matters because it removes that choice's framing, not the choice itself.

### 5.3 Capability (3b), chain depth (3c) and "would it exist anyway" (3d)
No change since R5, and I agree with R5's reading:
- all five start-kit classes are used;
- the cloner is used easy, then hard;
- Vigenère is taught in three tiers and then reused with an inferred key;
- the safe is designed for the cracker, with a fair second route through the lease date;
- every encoding has an author with a motive.

### 5.4 Bug sweep (Step 4)

| Check | Result |
|---|---|
| `item_picked_up` keyed on id | None. All four are `item_picked_up:notes` with `data.itemId` in the condition (erb:323-326, 354) |
| Author notes | None in text, observations or ink |
| Observations stating a code | None. The certificate's "LEWIS AND CLARK COUNTY" is the settled confirmation echo (plan W1; R5 §3.2), not a stated code |
| Tasks with no completion route | None |
| Rename residue, stale geography | None in the lines changed since R5 |
| One-shot dismissable scenes | §4: m1 |
| Reopen into a menu past its entry guard (new this round) | §4: m2, m3 |
| Validator (`--skip-ink --no-graph`) | The same 23 documented items as R2-R5 |
| dialoguelint | 5 `not-x-but-y` and 1 `you-after-choice`, all in lines unchanged since earlier passes |
| reopencheck | `agent_0x99`: 0 problems over 1,614 reopens. The four contact stubs replay `start` by design |
| Ink | All fifteen recompiled files identical to the committed JSON |

### 5.5 Layout and pacing (Step 5)
No change, and sound (R5 §3.7).

---

## 6. Notes (not counted)

- **n1. A blank reopen on `opening` after m2's fix.** The reopen shows no new text before the two choices. The D9 helper re-shows her last line (the stamp beat), as it does for Noor's `cover`. Check it in the browser rather than adding a line.
- **n2. Dillard turning hostile while his line is still on screen (m1's fix).** This is the m03 Terry Mott order, already shipped. Confirm in the browser that he doesn't land a hit while the dialogue is open (`pauseToAttack` is set, erb:1310).

---

## 7. For phase 5 (browser checks, not findings)

- **m1 after the fix.** On an `m01_maya_ko` save, let Tran spot you in the closet and press Esc on Dillard's line: he should be hostile and chase in the open stacks. Repeat with a reload during the line: still hostile after Resume. Before the fix, the same Esc should leave him idle (to confirm the trace).
- **m2 after the fix.** At the hatch, press Esc at "[That's right…]" / "[I'll stand.]", then reopen: the same two choices, then the m01 line, "You're the one he writes about." and HaX's two bin lines. Before the fix, the reopen should go straight to "Take your time. The shredder won't." and the bin buttons.
- **m3 after the fix.** Press Esc on Old Coyote's first challenge and let him spot you again: "You again." with the two covers and the truth button, and no "Same as before".
- **Carried from R5.** The door scene can't be closed (done on :3001, game 3512, per CONTRACT §15). Tran topic, live, on the hatch, letters, handover and tidied routes. Keypad tiers in order. The `realisation` reply. Torres click then cancel. Gary with a first-try correct code. Tell Noor, then try the staff door. The late file on the alpha-tapes branch. The read-every-page safe check.
- **New from R5 n1.** Talk at the hatch without choosing, open the gate, don't enter, ask HaX "[Tran.]": "The letters went in her feed…", then the button is gone. Enter: `handover` gives Derek's file.

---

## 8. To close the phase

1. m1: move `#hostile:archive_guard` above Dillard's line. Recompile, run tagdiff, update CONTRACT §3.6.
2. m2: split the hatch's opening choices into `=== opening ===`. Recompile, run tagdiff and dialoguelint, and add a line to CONTRACT §3.3 (B3).
3. m3: key Old Coyote's cover buttons on `coyote_cover`. Recompile, run tagdiff, update CONTRACT §3.4.
4. All three are unvoiced edits with no change to spoken text (voiced delta 0). Add a CONTRACT §15 "Puzzle chains round 6" paragraph, and run the validator `--skip-ink --no-graph` (expect the same 23 items).
5. This is round 6, past the AGENTS.md cap of five, run under the user's rule that the phase ends only on a 0/0/0 round. All three findings are new classes that earlier rounds didn't reach (a dropped tag on a close, and a reopen past an entry guard). None is a regression, so the rounds are still narrowing. After the fixes, a short round 7 that checks these three edits and re-runs the §4 sweep should be enough to reach 0/0/0.

Measured against m01_first_contact and m02_ransomed_trust.
