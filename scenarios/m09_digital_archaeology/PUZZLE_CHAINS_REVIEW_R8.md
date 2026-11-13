# m09 Digital Archaeology: puzzle chains, round 8 review

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at 3b59f50b ("puzzle chains round 7 fixes"). Round 7 is `PUZZLE_CHAINS_REVIEW_R7.md`, recorded in CONTRACT §15 "Puzzle chains round 7" (CONTRACT.md:848). The one later commit (6b76ffe8, SE awareness) touches no m09 or person-chat file.

**Method.** I read the 3b59f50b diff and the six person-chat inks it touches or depends on (hatch, cage, door, Tran, Noor, Old Coyote), plus the guard, the Alpha clip, the end of the debrief and HaX's Tran topic and status ladder. I rendered the erb to JSON, recompiled all fifteen inks with inklecate (each is identical to the committed JSON), and copied R7's `sim7.cjs` and the fixer's `drive.cjs` into my own scratch folder. I re-ran them on the current inks over the four entry paths: first open, in-session reopen, event start, and reload. I read the engine's give path (`chat-helpers.js`, `npc-game-bridge.js`, `inventory.js`, `game.rb`) to settle the Noor question, and the person-chat choice, advance and cleanup code (`person-chat-minigame.js`) for the Esc sweep. I ran `room_depth.py`, the validator (`--skip-ink --no-graph`), `dialoguelint` and `reopencheck`. I opened no VM plan, SecGen file or field guide; the VM flags are black boxes. I did no browser run. Scratch files are in the session scratchpad under `r8_review/` (`sim8.cjs`, `cage8.cjs`, `coyote8.cjs`, `fixtest.cjs`, and the patched inks in `fix8/`).

**Counts: 0 blockers, 0 majors, 3 minors.**

**Verdict: not yet complete.** R7's three fixes work on every path R7 named, and they introduce nothing new apart from the Noor toast (m2). The fresh sweep looked at a different moment: the gap right after a choice, before its first response line. It found that Sorensen's talk-down in the cage puts its fate tag on the second line of the response, after a local flag that hides the lever, so the outcome can be lost and can't be redone (m1). The same gap exists in the engine for every choice whose tags ride the first response line. In m09 the hatch bins are where it costs most (m3). m1 and m2 are small unvoiced ink edits that I tested in inkjs. m3 is an engine change.

---

## 1. R7 items: confirmed fixed

| R7 item | Where now | Status |
|---|---|---|
| m1, the hatch marked itself talked before its opening | `m09_sorensen_hatch.ink:33-42` (no flag in `start`); `#set_global:hatch_talked:true` at :76 above HaX's first bin line; `~ hatch_met = true` at :83 | **Fixed.** Simulated: Esc at the opening choices, reload, talk replays all three opening lines and both choices; an Esc mid-recognition then a reload does the same; after the full scene a reload goes to the hub ("Take your time. The shredder won't.") with the bins. The tag rides a visible line (`"…why he did what he did.  #set_global:hatch_talked:true"`) |
| m2, early met flags (cage, Tran, Noor) | `cage.ink:37`, `tran.ink:31`, `noor.ink:19, 34, 44, 52, 64, 69, 74` | **Fixed.** Cage on `m05_completed`: Esc after line 1, reload, talk replays all four lines including the Torres line. Tran on `tran_alerted`: replays "I already made a call…". Noor warned late: replays the October line. Noor not warned: Esc at the cover, reload, talk gives "We're closed…" and the three covers. A chosen cover survives a reload (`noor_cover` "auditor", hub "What now?"). **The warned-in-time replay has a visible side effect: m2 below** |
| m3, Old Coyote's walk-up | `m09_old_coyote.ink:83-86` | **Fixed.** Walk up, leave, spotted: "You again." with both covers and the plain truth button. A fresh first spot is unchanged ("Hold on, sis…"). Walking up again gives "What's up?". Edge: an Esc on the greeting line itself still leaves the count at 1 (inkjs commits the assignment), so a sighting after it is "You again." too |
| n1, erb:1288 comment | erb:1288 | **Half done.** The hostile timing is now right. The comment still ends "PLACEHOLDER art: security_guard (ASSET_LIST §1.2)", but his `spriteSheet` is `lyle_dillard` (erb:1295). Not player-visible: n3 |

### Every reader of `hatch_talked`, rechecked

- **`talk_at_the_hatch`** (erb:188): completes on HaX's first bin line, a few lines later than before. `cage_opened` also completes it (erb:194-195). Off the Victoria route the cage gate needs the cloned card, and the clone is a hub choice (`hatch.ink:132-143`), which can only be reached after `recognition`. So `cage_opened` can't come before `hatch_talked` there, and the task can't be skipped.
- **"She's still feeding it."** (erb:213, `room_entered`, once): it now fires for a player who walked off at the opening, which is accurate.
- **HaX status ladder** (`m09_phone_agent0x99.ink:947`): "Clone her card at the hatch if you haven't…" now waits for the real talk. Before it, the `stacks_entered` row says "The hatch. Talk to her across the counter…", which is right for a player who left at the opening.
- **Tran topic 17** (`phone:816, 820`): the guard `(bin_chosen or hatch_talked or not cage_opened)` and the retire behave as for a player who hasn't been to the hatch, which is now true.
- **Door/handover split** (erb:1810, 1819). On Victoria's route, an Esc at the opening leaves `hatch_talked` false, so the maintenance code gives the door scene with its own recognition and bins. A player who saw the whole hatch scene gets `handover`, as before. One narrow gap remains: an Esc on exactly the first HaX bin line (the tag's line), then the maintenance code without returning to the hatch. n1.

### Noor's `noor_opened` guard and the warned-in-time replay

Settled from the engine. After a reload, the replay can't give a second card. But it isn't silent, so R7's "harmless" ink comment (`noor.ink:31-33`) is wrong. That's m2.

---

## 2. Findings

### m1 (minor). Talking Sorensen down in the cage sets her fate on the second line of the response, after a local flag that hides the lever, so an Esc on the first line or a reload loses the outcome for good

**Evidence.**
- `m09_sorensen_cage.ink:61-68`: "[Your Architect kept his own papers off your list. Only yours burn.]" runs `~ talked_down = true` (:62), then "Narrator: She reads the label on the file in your hand, and sets the stamp down." (:63), and only then `#set_global:sorensen_fate:talked` above "Then I'll keep what's left. Give me a pencil…" (:64-65).
- The engine gives one line per continue (`ink-engine.js:45-60`), and the tags run when their line is shown (`person-chat-minigame.js:1122-1126`). `handleChoice` saves the story straight after the choice, with `talked_down` true (`person-chat-minigame.js:1070-1072`). Person-chat has no tag flush on close (`cleanup`, :1747-1800); the phone does (`phone-chat-minigame.js:743-770`).
- Simulated (`cage8.cjs`). Choose the lever, close on the narrator line: `talked_down` is true and no tag has run. An in-session talk resumes mid-knot and plays the tagged line, so that path recovers. After a **reload** the server has `sorensen_fate == "left"` and the restored local `talked_down == true`. The talk gives "She's writing in pencil, box by box. She doesn't look up." and only "[I'm done here.]". The lever is gone (its guard is `not talked_down`) and the fate is never set.
- The path with no reload depends on the advance mode. In click-through mode the next line waits for a click, so an Esc on the narrator line drops the tag unless the player talks to her again. A player has no reason to: the line reads as the end of the scene ("sets the stamp down"). In the default auto mode, `cleanup` doesn't clear `autoAdvanceTimer` (:399-435, :1747-1800), so the next line may still run after the close and apply the tag. That's traced in code only (§5).

**Why it matters.** `sorensen_fate == "talked"` is one of the mission's earned outcomes. It needs Nightshade's file and the inference about the plan chest (MC §4.3). It drives `stop_the_shredding` (erb:224), the debrief line (`debrief.ink:209`), the credits ("Wrote down every box she destroyed.", erb:504) and the m10 export (erb:2429). It also stops the cage's strips reading "Strips. She got to it." (erb:1903, 1908). Losing it while the screen says she put the stamp down is an earlier choice that silently doesn't count. It's minor because it needs click-through mode or a reload during that one line.

**Fix** (`m09_sorensen_cage.ink`, one tag moved; unvoiced, no spoken text changes). Move `#set_global:sorensen_fate:talked` from :64 to just above the narrator line at :63, so it rides the first line of the response. Checked in inkjs (`fix8/`): the first line now carries `set_global:sorensen_fate:talked`; the full scene and the hub after it are unchanged ("I'm done here." only); and a reload after that line gives the pencil re-entry with the fate already set. `stop_the_shredding` then completes as the narrator line appears, which fits it. Update CONTRACT §3.3 (:241) if it places the tag.

### m2 (minor). R7's Noor guard replays her card hand-over after a reload, and the engine shows "⚠️ NPC noor_haddad has no items to give"

**Evidence.**
- Warned in time, `#give_item:keycard:noor_staff_card` rides her first line (`noor.ink:40-41`), and `noor_opened` is set only after her third line (:44). A close on line 2 or 3, then a reload, replays the branch from `start` (simulated: the replay carries `#give_item:keycard:noor_staff_card` again).
- On a reload the server drops a given item from the NPC's `itemsHeld` (`game.rb:147-160` records the gift; `game.rb:895-909` filters it out). Noor holds only that card (erb:1115-1118). So `giveItem` returns `{ success: false, error: "NPC noor_haddad has no items to give" }` (`npc-game-bridge.js:224-228`). The tag handler shows that error as a warning toast in the conversation (`chat-helpers.js:113-118`; `person-chat-ui.js:693`). If the gift record were missing, the "already held" path would show "Already in inventory" and then "📦 Received" (`inventory.js:378-421`; `npc-game-bridge.js:285-313`).
- So the comment at `noor.ink:31-33` is right that no second card can come through, and wrong that the replay is harmless.

**Why it matters.** The player sees a yellow error naming an internal id while Noor hands over a card they already hold. That breaks the fiction for a player on the m05 warned-in-time route, which is one of the payoffs. It needs an Esc on her second or third line and a reload, so it's minor.

**Fix** (`m09_noor_haddad.ink`; unvoiced, the spoken text is identical in both arms, so there is no new clip). Add `VAR noor_card_given = false` (ink-local), and replace :40-41 with:

```
    {noor_card_given:
        Noor Haddad: You're the one they said would come. Here, my card. The staff door's around the side.
    - else:
        ~ noor_card_given = true
        #give_item:keycard:noor_staff_card
        Noor Haddad: You're the one they said would come. Here, my card. The staff door's around the side.
    }
```

Checked in inkjs (`fix8/`). A first play gives the card on line 1 as now, then the same three lines and the hub. Close on line 1, reload, talk: the three lines replay with only `#complete_task:meet_the_clerk` (already done, a no-op: `objectives-manager.js:553`) and no `#give_item`. The not-warned and warned-late forms are unchanged. Correct the comment at :31-33 and CONTRACT §3.2 (:226) to match. Run tagdiff and confirm that one tag moved under a condition, with no text change.

### m3 (minor; engine). An Esc or reload between clicking a choice and seeing its first response line loses or half-applies that line's tags. At the hatch it can cost the bin choice

**Evidence.**
- `handleChoice` (`person-chat-minigame.js:1036-1105`) calls `makeChoice`, which continues one line (with its tags) into `result` (`phone-chat-conversation.js:430-447`). It then **saves the story** past that line (:1070-1072) and schedules `displayAccumulatedDialogue(result)`, which is where the tags run, for 1.5 s later (:1089-1101). In click-through mode that callback waits for a click (:399-406).
- `cleanup` (:1747-1800) saves again, clears `window.currentConversationNPCId` and doesn't clear `autoAdvanceTimer` or `pendingContinueCallback`.
- A reopen resumes after that line, and the context re-show runs no tags (`person-chat-reopen.js:11-13`).
- Result: in click-through mode an Esc in that gap drops the tags. A reload (F5) in the gap drops them in any mode. In auto mode the stray timer may run them after the close, but with no NPC context, so a `#give_item` fails without a toast (`chat-helpers.js:100-106`) while `#set_global` still lands. That last part is traced in code, not seen.

**Where m09 pays.** The hatch bins (`hatch.ink:100-128`) set the local `bin_pulled` and then carry `#give_item`, `cage_bin` and `bin_chosen` on the first response line. Lose the tags and the bin buttons vanish for good (`bin_pulled` is restored on reload) with no file given. At the gate, `handover` hands over Derek's file with "You never chose…" (`door.ink:95`) to a player who chose the letters. In the auto-mode case `cage_bin` may read "letters" with no letters in the notepad. Other m09 choices in the same position recover, because nothing hides their button: Tran's "[Go.]" (`tran.ink:64-66`), Noor's "[Not tonight…]" (`noor.ink:136-138`) and Old Coyote's truth (`coyote.ink:62-70`) all offer the choice again. Cage m1 is the same kind of loss on its second line.

**Why minor.** The gap is 1.5 s in the default mode, and a deliberate choice is usually followed by watching the reply. But the cost is the mission's busiest choice, and the fix belongs in the engine, so it covers every mission.

**Fix** (engine, all missions; needs a browser check and the usual engine sign-off). In `handleChoice`, run `processGameActionTags(result.tags, …)` straight after `makeChoice`, while `currentConversationNPCId` is still set, then pass on a copy of `result` without those action tags (keep `exit_conversation` for the close logic). In `cleanup`, clear `autoAdvanceTimer` and `pendingContinueCallback`, so a closed conversation stops advancing. Once the stray timer is gone, m1's tag move is what keeps the talk-down safe in auto mode too. I found no clean m09-only workaround for the bins: moving `bin_pulled` later still leaves the tags behind the same gap.

---

## 3. The Esc, reopen and reload sweep (every m09 person-chat and phone ink)

New this round: the **post-choice gap** column (m3), and a scan of every person-chat ink for action tags that ride a later line than the first one after a choice or knot start. The scan found six. Two are findings (cage :64, m1; and the Noor replay that R7's change exposed, m2). The other four are fine: hatch :76 is deliberate (R7 m1); the clone tags at `hatch.ink:140` and `noor.ink:107` sit on sticky retry choices; and the debrief's `report_done` (:305) is in a `disableClose` scene with its own backstop.

| Ink | Esc / early close | In-session reopen | Reload | Post-choice gap | Result |
|---|---|---|---|---|---|
| Sorensen hatch | opening; mid-`recognition` | `opening` re-entered; mid-knot continues | opening replays (R7 fixed) | bins lose their tags, buttons gone | **m3** |
| Sorensen door (`door`) | `disableClose` | n/a | mapping re-fires (R6) | `disableClose` blocks Esc; an F5 in the gap is unproven (§6) | Phase 5 check |
| `handover` | tags above its line | none | same | no choice | Clean |
| Sorensen cage | mid-opening; the lever's narrator line | continues | opening replays (R7 fixed); **lever lost** | lever tags on line 2 | **m1** |
| Tran | mid-opening; `deal` | continues; `deal` re-entered | opening replays; `deal` → hub → lever again | "[Go.]" recoverable | Clean |
| Noor | mid-opening; `cover`; `reach` | continues; re-entered | warned-in-time replay shows a toast | "[Not tonight…]" recoverable | **m2** |
| Old Coyote | `challenge`; walk-up | `challenge` count 2; hub "What's up?" | count and cover restored | truth recoverable | Clean (R7 m3 fixed) |
| Archive guard | the line | n/a | hostile on display (R6) | no choice | Clean |
| Alpha clip | mid-recording | repeatable (`triggerOnInteract`, erb:2217-2229; `apply-actions.js:37-47` emits every time) | same | no choice | n2 |
| Briefing, debrief | `disableClose` | n/a | debrief backstops on `room_entered` (by design) | `disableClose` | Clean |
| HaX phone | tags processed before the type-out (`phone-chat-minigame.js:743-770`) | reopencheck: 0 problems over 1,362 reopens | voiced calls re-ring on `game_loaded` | phone processes tags first | Clean |
| Recruiter, Nightshade, Torres, Gary | same | the four stubs replay `start` by design | as R2–R7 | same | Clean |

---

## 4. Fresh audit (skill Steps 2–5) on the current build

**4.1 Room depth and boss keys.** `room_depth.py`: 11 rooms, maximum depth 5 (`salvage_cage`), 0 empty rooms, 11 lockType declarations. My own listing from the rendered JSON gives the same eleven locks as the plan's §3 table: `front_desk` key, `hl_box` HL2015-0477, `staff_passage` RFID, `restricted_stacks` `stacks_release`, `restricted_cage` `stacks_card`, the biometric `plan_cabinet`, the office password, the safe PIN 060216, `tape_room_reader`, LEWISANDCLARK and `beta_crate`. Every verdict there still holds. No erb logic has changed since R6.

**4.2 Choices that matter (3a).** `concludeRequires` is the four flags. The m01–m08 payoffs at the hatch, the door scene, Noor, Tran, Old Coyote and HaX are intact on first play, and now through an Esc at an opening plus a reload. What's left is about the moments *after* a choice: the talk-down's record (m1) and the bin's tags (m3).

**4.3 Capability, chain depth, "would it exist anyway" (3b–3d).** No change, and I agree with the plan and R5–R7:
- all five start-kit classes get used;
- the cloner is used on an easy card, then a hard one;
- Vigenère is taught in three tiers, then reused with an inferred key;
- the safe is built for the cracker;
- every encoding has an author with a motive.

**4.4 Bug sweep (Step 4).**

| Check | Result |
|---|---|
| Ink | All fifteen recompiled files identical to the committed JSON |
| `item_picked_up` keyed on id | None: eight `item_picked_up:notes` mappings, all by type |
| Author notes in text or observations | None (`[LORE`, `[NOTE`, TODO, FIXME: 0 hits) |
| Observations stating a code | None of 060216, HL2015-0477, LEWISANDCLARK, clerk-of-the-county |
| Stale comments | erb:1288 art note (n3) |
| Validator (`--skip-ink --no-graph`) | The same 23 documented items as R2–R7, plus the 13 known wiring warnings and 6 missing-field notes |
| dialoguelint | 5 `not-x-but-y`, 1 `you-after-choice`, all in lines unchanged since earlier passes |
| reopencheck | `agent_0x99`: 0 problems over 1,362 reopens; the four contact stubs replay `start` by design |

**4.5 Layout and pacing (Step 5).** No change, and sound.

---

## 5. Notes (not counted)

- **n1. Victoria's route, Esc on exactly HaX's first bin line.** That line carries `hatch_talked`, so a player who Escs on it, never goes back to the hatch, and uses the maintenance code gets `handover` ("You never chose…") having heard only one of the two bin lines. It needs an Esc on one specific line plus a choice not to return, and the hatch is still there to go back to. Moving the tag to the second HaX line in both arms of :78-82 would close it, at the cost of R7 n3's advice to keep it on the first. Leave it unless m1 is reopened for another reason.
- **n2. Alpha clip.** `#set_global:alpha_clip_played:true` rides HaX's line after both Tesseract lines (`alpha_recording.ink:23-26`), so an Esc during the recording leaves the credits line and the export unset. The deck replays on every use, so a player who wants to hear it will. Optional: put the tag above Tesseract's second line.
- **n3. Doc drift.** CONTRACT §3.4 (:250-251) doesn't mention that the walk-up greeting sets the count, and §3.2 (:226) doesn't mention `noor_opened`. R7 asked for §3.4; both are recorded only in §15 (:848). The erb:1288 `_comment` still says "PLACEHOLDER art: security_guard". None of this is player-visible.

---

## 6. For phase 5 (browser checks, not findings)

- **m3, the engine gap.** In auto mode, click "[Pull the letters through.]" at the hatch and press Esc within a second. Check `cage_bin`, `bin_chosen` and the notepad. Repeat in click-through mode. Then confirm whether a closed person-chat's auto-advance timer keeps running the story (console: "Processing action tags" after the close).
- **m1 after the fix.** Talk Sorensen down with Nightshade's file and Esc on "She reads the label…". `sorensen_fate` should be `talked`, `stop_the_shredding` done, and after a reload she should still be writing in pencil.
- **m2 after the fix.** On an m05 warned-in-time save, close on Noor's second line, reload and talk. There should be no toast, and the staff card should be held once.
- **Door scene and F5.** On Victoria's route, choose a bin in the door scene and reload within a second. Does the scene come back on the next cage entry, or is the default bin all that's left?
- **Forced calls over a person-chat.** Can a HaX call ring while the cage lever's lines are on screen, and does it close the chat the way an Esc does?
- **Carried from R7.** R6 m1–m3 live, and R7 m1–m3 live: hatch Esc and reload replays the opening, Victoria's Esc at the opening gives the door scene, the cage Torres line replays, Tran's call line replays, Old Coyote's walk-up then spotted gives "You again.". Also carried: the Tran topic on each route, the keypad tiers, the Torres click then cancel, Gary with a first-try code, telling Noor then trying the staff door, the late file on the alpha-tapes branch, and the read-every-page safe check.

---

## 7. To close the phase

1. m1: move the cage's `#set_global:sorensen_fate:talked` above the narrator line. Recompile and run tagdiff (one tag moved).
2. m2: guard Noor's `#give_item` with an ink-local `noor_card_given`, using the same line in both arms. Fix the ink comment and CONTRACT §3.2. Recompile and run tagdiff.
3. m3: the engine change in `handleChoice` and `cleanup`. It needs a browser check, and since it touches every mission, run it through the engine path with its own regression (any mission's choice that gives an item, and an exit choice). If the user would rather not change the engine now, record m3 as deferred with that reason. The m09 risk is a 1.5 s window on the bin choice.
4. n3 doc touches with the above. Voiced delta 0. Add a CONTRACT §15 "Puzzle chains round 8" paragraph. Run the validator (expect the same 23 items) and dialoguelint.
5. This is round 8. Every finding since R5 has come from closing a scene at an awkward moment, and the moment has moved each round: before the choice (R5), at the line (R6), at the opening plus a reload (R7), and now in the gap after a choice. m3 covers that last class in the engine. With m1 and m2 in, round 9 should re-run `fixtest.cjs`, and if m3 lands, prove the post-choice gap in a browser.

Measured against m01_first_contact and m02_ransomed_trust.
