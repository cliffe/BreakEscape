# m10 Full Disclosure, stage 3: review round 3 (final check)

Reviewer: fresh read-only Opus, 2026-10-21. Target: `moral_choices.md` draft 3 (983 lines, "MC:n"). Read with `FINALE_BRIEF.md`, `REVIEW_R2.md`, and m09 stage 3 `moral_choices.md` (exports, double-cross). No VM material opened. Severity as R2: blocker breaks the brief or soft-locks; major is a dominated or misleading choice, or a state hole on a reachable save; minor is anything smaller.

## Verdict

**Not clean: 1 major, 4 minors.** The major is a one-sentence fix in the Tesseract knock-out fallback. Every R2 finding is fixed in substance. A few stale copies are left (R3-02).

## 1. R2 confirmation

| # | Status | Evidence |
|---|---|---|
| R2-01 | fixed | C9 has kill Zero Day's / kill Ghost's (bait only) / trace on every save (MC:271–279); §2 and §16 relabel it as a dilemma. Stale copies at MC:413, 596 and 739: R3-02 |
| R2-02 | fixed, with a new hole | The KO writes only `tesseract_ko`; the hand disarm sets `console_choice` and `partial_release`; the terminal pick sets `ending` (MC:328–334, 545, 548, 668, 712). The hole is a KO between C16 and C17: R3-01 |
| R2-03 | fixed | Each branch has a holder, a KO net and a walk-away resume (MC:59, 100). Stale cover cell at MC:680: R3-02 |
| R2-04 | fixed | The tether's two-form cost and Netherton's two lines (MC:97–98); D19; P47 |
| R2-05 | fixed | The trace and Imran's supplier are sources; each operation's cell is named; the fallback is conditional and ends on a buyer who always exists (MC:636, 654). Step number stale: R3-02 |
| R2-06 | fixed | "The ones nobody can patch go to the operators..." (MC:423); the valves by hand (MC:429). "Someone read" is gone |
| R2-07 | fixed | One wipe line, crediting only the wipe (MC:430) |
| R2-08 | fixed | "Both of them run through holes on that list" plus the hole for each operation (MC:422) |
| R2-09 | fixed | Rule 1.3 names three guard effects (MC:17); the code replaces the change-over (MC:122, 125); Arakawa's cost is the county road (MC:295). "change-over" survives only in history rows |
| R2-10 | fixed | Helena (MC:303); the glance at the service door (MC:342); m09's two lines placed (MC:348, 638). Agrees with m09 MC:400, 513, 725 |
| R2-11 | fixed | P45 (arc:426), P41 (m09's HaX line) |
| R2-12 | fixed | C8 is optional with a warned cost; the re-ring at the stair exit; Vos's own trade plays (MC:40, 229, 243) |
| R2-13 | fixed | One moment, the lock's unlock event (MC:271, 132, 193) |
| R2-14 | fixed | C15 is a gateway (MC:47); the counts add up to 17 (MC:53, 950) |
| R2-15 | fixed | 35-run test plan (MC:952–983) |
| R2-16 | fixed in §8.2, §11 and P54 | One residue of "two lines" at MC:618: R3-02 |
| Worst lines 1–5 | fixed | MC:68, 429, 430, 420, 122–123. Grep finds no "make him disappear", "Someone read", "before anyone can fix", "paid for early access" or "Good." texts. Residue at MC:651: R3-02 |

## 2. Walks

**The core.** On a cold start: rebuttals on every menu; Stop it / Show me; WREN if free; database; C17; `ending`. Every menu can be reached. `head_start_out` is set at the forced outer lock, `partial_release` on Stop it, and `media_story_ran` when `ending` is set; the rest have safe defaults. All six endings can be reached. On a rich save (shown Nightshade, kept Ghost, captured Voltage, recruited Victoria, full m09) the same holds, and the record pools and the Recruiter beat each pay once. On the double-cross save the opening differs and nobody is wounded; all six endings stay reachable. The Tesseract-KO path is sound when the KO lands before C16, but not after it (R3-01).

**The door.** Shown: Nightshade holds the choice, and the KO default is "stay". Not shown: Nightshade holds it, and the KO default is the plans. Arrested: Nightshade holds it, and the KO default is refuse (the first line has already written it). Silent: Netherton holds it, and the KO writes `false`. On a walk-away, each branch resumes at the closing choice and the breach stays shut. All four close. Two small gaps are in R3-05.

**C9's cost on every save.** Bait: three options, and each one gives up something. Kept, refused, talked-out and cold start: kill Zero Day's (the trace is lost) or trace it (Zero Day's share goes, and the gallery stays live). So every save pays a real cost. On non-bait saves, though, killing costs only a ledger cell, which shows up on the card and in the credits but nowhere in play (R3-03).

**Test plan coverage.** Endings: each at least twice (surrender 1/9/12/17/19, arrest 2/3/7/10/14/16, lethal 4/13, executed 6/15, scorched 5/11/18, joined 8/20). Database outcomes: each at least twice. Accusations: right face to face, right on the line, wrong recalled, wrong not recalled (all five officers), none, Kowalczyk knocked out, off on named, off on the double-cross. Nets: Nightshade, Netherton, walk-away, Ghost, Victoria, core reload, WREN reload, cold lowered, Tesseract KO. Some cases are missing: R3-04.

## 3. Findings

**R3-01 (major). A knock-out on Tesseract after the database pick but before C17 soft-locks the core.**
- *Location:* §6.1 (MC:328–334), rule 1.11 (MC:25), §12 `tesseract_ko` (MC:712), test 24 (MC:981).
- *Problem:* The fallback assumes the KO lands before C16. Rule 1.11 lets a player walk away from the C17 menu, and until engine 36 exists nothing stops them hitting him then. `database_outcome` is already set, so the terminal has no pick left to make. `ending`'s only remaining setter is C17, which lives in an unconscious man's conversation. The conclusion waits on `ending` (MC:540), so the run can't finish. A related gap: nothing says that resume skips his unset exchanges, or skips the disarm when "Stop it" has already been picked.
- *Fix:* add one sentence to §6.1: "With `tesseract_ko` true, the core resumes at the first unset of: the hand disarm (skipped if `console_choice` is set), the terminal's database menu (skipped if `database_outcome` is set), then the terminal's one-option '[Cuff him.]', which sets `ending = arrest`." Add "KO after secure" to test 24.

**R3-02 (minor). Stale copies.**
- MC:618, "His two lines are tonight's cost": this is the R2-16 residue. Change it to "His lines".
- MC:636, "this ledger's step 4", and MC:814 (P33), "its step 4": surrender is source (6). Change both to 6.
- MC:680: the KO cover for `door_scene_done` names only Nightshade. Add "Netherton's on the silent branch".
- MC:413, "the five who paid Ghost are already caught": that is true only when C9 was spent on Ghost's share. Add "where the console killed it".
- MC:596, "the console that can kill only one share", and MC:739 (D1), "the console does one share": change both to "kill one share, or trace one".
- MC:651, item 28, "he has to disappear afterwards": change to "relocated under a new name", as in MC:68.
- MC:53 counts C9 as optional and leaves it out of "every player meets", but MC:950 includes it. MC:53 says about 20 picks and MC:950 says 19. Make the two passages agree.

**R3-03 (minor). On non-bait saves, the trace is felt only on the card and in the credits, so the kill's cost isn't felt in play.**
- *Location:* C9 (MC:277), §8.2 (MC:560–562), rule 1.3 (MC:17).
- *Fix:* give the trace one 06:00 line from Netherton on every ending that reaches 06:00, for example "We followed Zero Day's share. Four buyers, and one of them was careless." A player who killed the share doesn't hear it, and that silence is the cost.

**R3-04 (minor). Test plan gaps and one wrong expectation.**
- Not covered: a line accusation of Kowalczyk with no Quintero (the player stops her, still `sleeper_caught`); HaX refusing a second accusation while an officer is out; a slot scene walked past (`avoided` via room exit; no profile does it); C9 skipped (`head_start_killed = ""`); C8 "[No deal.]"; Vos's secret kept; Voltage knocked out; and R3-01's KO after the database.
- Profile 17 expects disclose to burn "HashChain and Critical Mass". Its door branch ("not shown") means a triple agent with the file held, so operation 2 applies. Disclose burns Nightshade's channel and the HashChain tags.
- *Fix:* fold these cases into existing profiles. For example: profile 7's player also accuses Kowalczyk on the line, and is first refused while Quintero is out; profile 16 walks past Wendell and skips C9; profile 10 takes "No deal"; profile 14 keeps the secret. Correct profile 17.

**R3-05 (minor). Two knock-out loose ends at the door.**
- Netherton is the silent branch's holder, but he also speaks on the line at the database menu and at 06:00. Nothing covers a Netherton knocked out at the forward post. Fix: one line, "a knocked-out Netherton comes round in the van; his later lines stand", until engine 36 exists.
- Shown Nightshade hands over the override "on both options" (MC:63). His KO mapping writes the default and the done-flag, but doesn't say the player still gets the override. Fix: the mapping also gives the item, or he drops it.

## 4. Counts

0 blockers, 1 major (R3-01), 4 minors (R3-02 to R3-05). Fixing R3-01 takes the verdict to clean. The minors can be folded in without another round.
