# m09 Digital Archaeology: puzzle chains, round 3 review

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at 1e9e4a4e ("puzzle chains round 2 fixes"). Round 2 is `PUZZLE_CHAINS_REVIEW_R2.md`; its record is CONTRACT §15, "Puzzle chains round 2" (CONTRACT.md:837).

**Method.** Read the 1e9e4a4e diff. Recompiled `m09_phone_agent0x99.ink` with inklecate, and the output is identical to the committed JSON. Ran `room_depth.py`, the validator (`--skip-ink --no-graph`), `dialoguelint` and `reopencheck`. Traced the Tran topic against every `cage_bin` value it can see, against Tran's own ink and against room depth. No engine file and no erb has changed since d2fd06fe, so I re-ran R2's audit tables and spot-checked them instead of rebuilding them. I opened no VM plan, SecGen file or field guide. VM flags are treated as black boxes, and I took as settled that the H&L file number is reachable only through flag 2 and that no cage clue feeds flag 3. No browser run.

**Counts: 0 blockers, 0 majors, 2 minors.**

**Verdict: not yet complete.** R2's m1 and m2 are fixed, and so is the tier-2 reorder. The new Tran arms are correct, but the most common route never reaches them: the topic burns on a pre-hatch ask (m1). The letters arm also describes the lever wrongly (m2). Both fixes are in the unvoiced hub. Make them, then run a round 4 confirmation.

---

## 1. R2 m1, m2 and n3: confirmed fixed

| R2 item | Where now | Status |
|---|---|---|
| m1 Tran topic pointed at shredded letters | `m09_phone_agent0x99.ink:817-829`: shared first line at :818, then four arms on tidied / `derek_file` / `letters` / else | Fixed (but see R3 m1, m2) |
| m2 "No. It isn't." answered the old choice | `m09_phone_agent0x99.ink:609`, "No. It hasn't. He shredded everyone but himself." | Fixed |
| n3 tier 2 order | `m09_phone_agent0x99.ink:735-736`: "It's Vigenère." then the key | Fixed |
| Docs | CONTRACT row 5 (method first, noted R2 n3), row 17 (four arms), §15 R2 paragraph (:837) | Match the ink |

### The points the orchestrator asked about

**Every `cage_bin` × tidied state.** `cage_bin` can be `""`, `derek_file`, `letters` or `nightshade_copy` (hatch.ink:95, :103, :115; door.ink:53, :61, :73, :82, :93; erb:198). The topic is only offered `not cage_opened` (phone:813), so on the door route (B5, which runs after the gate) and the `handover` path the bin is always chosen after the topic has gone. Only the hatch values matter:

| State | Arm (phone) | True? |
|---|---|---|
| tidied, any bin | :821 "Nothing on him tonight that I can use…" | Yes. The letters button is hidden on tidied (hatch.ink:100), so no paper names him |
| not tidied, `derek_file` | :823 "The letters went in her feed…" | Yes. The other bin goes into the feed (hatch.ink:98; card erb:536) |
| not tidied, `letters` | :825 "You've got the letters. That's what he'd want back." | Lever is real; wording is off (m2) |
| not tidied, `""` (before the hatch) | :827 "You'd need something he wants…" | Yes, as a forward pointer |

`nightshade_copy` only occurs with tidied, so the first arm catches it. No state falls through wrongly.

**Does Tran accept the letters on that path?** Yes. His lever is `{cage_bin == "letters" and tran_outcome == "left"}` (jesse_tran.ink:52), with no inventory check. `cage_bin` is a declared VAR there (:14), so it syncs when the conversation opens. "[Go.]" sets `tran_outcome:talked` (:64). That completes `stop_the_tape_wipe` (erb:233; flag 1 is always in by the hatch) and hides him (erb:1423-1424). "[No deal.]" returns to his hub with the `+` choice still offered (:68-70).

**Is the letters line clear enough?** It says the right thing (go to Tran with the letters), and the letters themselves back it up: "Courier: J.T., server closet" (erb:1650, :1793). But "want back" describes a handover that never happens. See m2.

**Two-line split.** Each line is under the 25-word cap (dialoguelint: phone max 25, no new hits). The shared opener (:818) means the old else arm now arrives as two bubbles rather than one, which reads fine. Unvoiced: the hub is outside the four voiced HaX hosts (CONTRACT §15 voiced counts).

**Tier-2 reorder.** "It's Vigenère." / "The key is the salvage bay's word, on the chart by the keypad." (phone:735-736) gives method then key, which follows tier 1's "Look at the wall by that keypad" (:728) and leads into tier 3's tool line (:738). reopencheck `agent_0x99`: 0 problems.

---

## 2. Findings

### m1 (minor). The Tran topic burns before the hatch on the natural route, so the R2 arms rarely play

**Evidence.** Topic 17 is offered from the start: `not tran_topic_given and not cage_opened and tran_outcome == "left"` (phone:813). It sets `tran_topic_given = true` on the first ask (phone:814). The dock call names Jesse Tran in its last line (phone:171-180). The task "Stop the tape wipe in the server closet" turns active with the `restricted_series` aim, right after flag 1 (erb:651-663). The server closet is at depth 2 and the hatch is in `restricted_stacks` at depth 3 (`room_depth.py`). So the usual order is: meet Tran or see the task, ask HaX "[Tran.]", hear the `""` arm ("You'd need something he wants…", :827), then go to the hatch. After the bin there's no topic left to ask. The `derek_file` and `letters` arms (:823, :825) only play for a player who leaves the topic alone until after the hatch.

The damage on each bin:
- *Derek's file.* The player was told to find "something he wants" and then watched the only such thing go into the feed without being told so. That is R2 m1's dead hunt, now on the common order. Nothing tells them the lever has gone: HaX's hatch lines (hatch.ink:70-75) don't mention Tran.
- *Letters.* The letters' own text says "Courier: J.T., server closet" (erb:1650), so a player who reads them finds the way. One who doesn't read them gets no prompt from HaX that the bin choice just paid off.

This is softlock pattern S1 (a first ask burns the topic before the state it branches on exists). The task is optional and nothing is blocked, so it's minor. It does matter to the user's priority, though: this is the arm where an in-mission choice is supposed to pay off.

**Fix** (`m09_phone_agent0x99.ink:814`, unvoiced). Only burn the topic once the answer can't change:

```ink
{bin_chosen or m08_nightshade_tidied:
    ~ tran_topic_given = true
}
```

`bin_chosen` is already a synced VAR at phone:45. Before the bin, a repeat ask replays the m01 warning and the forward pointer, which is harmless. After the bin, one more ask gives the bin's arm and retires it. Optionally, give the status ladder or a text a nudge on `cage_bin === 'letters' && tran_outcome === 'left'`, for players who never reopen the hub, e.g. an unvoiced `text_map` on `global_variable_changed:cage_bin`: "Courier J.T. in those letters. That's Tran." I'd take the one-line gate change on its own. Update CONTRACT §2.1 row 17's "Closes" column and add a §15 line.

### m2 (minor). The letters arm misdescribes the lever

**Evidence.** "You've got the letters. That's what he'd want back." (phone:825). In play, Tran never gets them back. The choice is a threat, "[You can explain these to Social Fabric, or to me.]", and the beat that follows is "He reads the courier line, J.T., and takes his hands off the keyboard." (jesse_tran.ink:52-53). The lever is that the letters name him, not that he wants them returned. A careful player may hold back, thinking the deal costs them the letters (and with them the Villanueva warning), and the line passes up a free teaching beat: the leverage comes from reading the evidence.

**Fix** (phone:825, unvoiced): "You've got the letters. He's the J.T. in them. Show him." (11 words). This points at the evidence, matches the narrator beat in Tran's ink, and says what to do. Update the quote in CONTRACT row 17.

---

## 3. Fresh audit (skill Steps 2–5) on the current build

**Room depth.** 11 rooms, max depth 5 (`salvage_cage`), 0 empty, 11 lockType declarations. Unchanged from rounds 1 and 2.

**Boss-key table.** No erb or engine change since d2fd06fe (`git log d2fd06fe..HEAD` touches only ink and docs), so R2's table (R2 §3) holds line for line. The verdicts still stand: boss-key for the plan cabinet, the tape room and the H&L box; by-design carry-over for the front desk, staff passage, cage gate and safe; an announced story gate on the office; the salvage keypad split and kept (W1), with the three beats carried by the hint tiers.

**Choices that matter.** These are intact: m02 Gary, m05 Torres, m03 Victoria, m08 tidied, and m01 Maya (the Tran warning, phone:136-143, and the guard text, erb:176-177). The hatch bin pays off on the card (erb:535-541), in HaX's margin-bet reply (erb:365-370) and at Tran (jesse_tran.ink:52). Only the Tran payoff's signposting is short (m1, m2). The settled rulings W1–W10 stand. I found no concrete play reason to reopen any of them.

**Engine bug classes.** No new mappings. Validator: the same 23 documented items (safe contents, cutscene `onceOnly`, `beta_crate`, `stacks_release`, office edge), and nothing new. dialoguelint: 5 `not-x-but-y` and 1 `you-after-choice`, all in unchanged lines from earlier passes. reopencheck: `agent_0x99` 0 problems. The four contact stubs replay "start" by design, as before. Ink: the recompiled phone JSON is identical to the committed file. No author notes, rename residue or stale geography in the changed lines. "Server closet off the open stacks" matches the connections.

**Pacing and layout.** Unchanged.

---

## 4. For phase 5 (browser checks, not findings)

- Tran topic, each arm in a live game: ask before the hatch, then after Derek's file, then after the letters (with m1's gate). Repeat on an `m08_nightshade_tidied` save.
- Letters path at Tran: the lever choice shows, "[Go.]" completes `stop_the_tape_wipe`, he's hidden, the closing card reads "Walked out and made a phone call." and "97 of 212 reels". Also "[No deal.]" then a return.
- Keypad topic: three asks give three tiers in order. Tier 2 shows as two bubbles, method first. Check once on a `m02_gary_protected` save ("Gary told you how.").
- The `realisation` choice and its "No. It hasn't." reply in the hour read.
- Carried from R2 n5: Torres click → cancel; Gary with a first-try correct code; tell Noor, then try the staff door; the late file on the alpha-tapes branch; the read-every-page safe check.

---

## 5. To close the phase

1. m1 (phone:814 gate) and m2 (phone:825 wording). Recompile, `tagdiff` against HEAD (text only, voiced delta 0), dialoguelint, reopencheck `agent_0x99`.
2. CONTRACT row 17 (the closes column and the letters quote), plus a §15 "Puzzle chains round 3" line.
3. Round 4 confirmation. At 0 majors and 0 minors, phase 2 is complete.

Measured against m01_first_contact and m02_ransomed_trust.
