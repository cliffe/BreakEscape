# m09 stage 3, review round 3 (final check)

Reviewer: fresh read-only reviewer, round 3, 2026-10-21. Target: `moral_choices.md` ("MC") after round 2 (its §14). Read: `docs/agents/FINALE_BRIEF.md`, MC in full, `REVIEW_R2.md`, stage 1 `story_arc.md` ("SA") Beat 2.4 and §11. No VM material opened.

Severity as round 2: **major** breaks one of MC's five tests or contradicts canon; **minor** is wording or a stale reference.

## Round 2 confirmation

Grepped MC for: Great Falls, patch, went dark, goes dark, writing in it, lose the name, plane did, hasn't left, smelter, never heard, Warmer, only one that spares. Stale copies in SA and stage 2 are expected, because MC §11 lists them as changes.

| ID | Status | Note |
|---|---|---|
| R2-01 | fixed | Clean core on `double_crossed` (MC:136), dominance line against refuse-her-file (MC:146), changes 5 and 27. One leftover in the take-against-tapes line (R3-02) |
| R2-02 | fixed | Call in the air, off the apron at Helena (MC:136, :399); identity scene unchanged; spine and last-image forms keyed first on `double_crossed` (MC:401–404, change 19). Stale "Great Falls" left in §12 (R3-03) |
| R2-03 | fixed | `sleeper_named` set on the naming line (MC:94, :129, :561); two resume points (MC:96–97, change 31) |
| R2-04 | fixed | Teaching paragraph (MC:223); HaX before the button (MC:221), Netherton (MC:233), the after-send lines (MC:239), §1, §5, §8 all use the clock framing, and SAFETYNET chooses to pull the watch. One wording slip (R3-04) |
| R2-05 | fixed | The flaw is in the controller, outside m04's battery-site audit (MC:213, :217) |
| R2-06 | fixed | MC:117, with the gloss at MC:119 |
| R2-07 | fixed | Player's "[Not tonight. Not from here.]" (MC:294) |
| R2-08 | fixed | Copper mine, her quoted line, Beat 2.7 confirmation (MC:77) |
| R2-09 | fixed | MC:333; change 33 |
| R2-10 | fixed | MC:511 |
| R2-11 | fixed | Change 17 adds Beat 3.6; "§1 change 8" (MC:260); `schedule_read` inside the table (MC:585) |
| R2-12 | fixed | MC:127. It also sends the hang-up through that line (R3-01) |
| R2-13 | fixed in part, as ruled | MC:166; change 17 |
| Worst lines 1–5 | fixed | MC:117, :126, :136, :239, :136/:399 |

## Recruiter call, every route

| Route | Cost said before the button | State | Verdict |
|---|---|---|---|
| Take, leave it | price, threat, invoice, HaX's file/tapes line, all on the call | `taken`/`none`; `sleeper_named` on her line | works |
| Take, pull her file | her threat before the answer; HaX's "She warns the rest, and Kowalczyk runs." before the button | `double_crossed`/`her_file` | works; trade with take and with refuse-her-file now stated |
| Refuse, her file | "Say no and I wipe it myself"; HaX's file/tapes line | `named`/`her_file` | works |
| Refuse, the tapes | as above; payoff real (clip, service-door warning) | `refused`/`alpha_tapes` | works |
| Own it | honesty; HaX heard it | `told`, then the offer | works |
| Deny | the lie's risk is plain | `denied`, then the offer | works |
| Hang up | the call and its offer end, but **the tape choice that follows is unpriced** | `kept` + `refused`/`alpha_tapes`, then tape choice | **R3-01** |
| Closed before the name (after "yes") | Recruiter re-rings with the name | `taken`/`none`, `sleeper_named` false until her line | works |
| Closed after the name, or at the tape choice | HaX re-rings: "I've paused the deck." | legal pair throughout | works |

No route is dominated. Take keeps WREN in custody and the player's word. The double-cross trades those for half a network and a clean core. Refuse-her-file gets the whole network but leaves a whodunit that can go wrong, and refuse-the-tapes gets his voice and the service-door warning.

## Disclosure teaching

Realistic everywhere in MC now. A notice starts a clock: the vendor acknowledges, aims for a fix in about ninety days, and the rollout takes a year, with some sites never patched. The watch comes down because SAFETYNET chooses to pull it, so the cost is SAFETYNET's own decision. The Hold row (MC:240) and §5, §7 and §8 agree. The one imprecision is R3-04.

## Findings

No blockers.

**R3-01 (major). The hang-up route reaches the tape choice with nothing priced, and her line can't be heard.**
- **Location:** MC:127 (step 3, "After a no (or the hang-up of §3.3)"), MC:168.
- **Problem:** H is the call's first beat, before the offer. A player who hangs up never hears the price, her "Say no and I wipe it myself", or HaX's "Her file is her network, all of it. The Alpha tapes are him teaching…". Step 3 then has the Recruiter say "Then I'll tidy my own desk… Goodnight, agent." after the player has hung up on her. The player faces **[Her file.] / [The Alpha tapes.]** with labels only, which breaks test 3. SA Beat 2.4 had this right (HaX "says the wipe has started, prices the two tapes, and asks which"), and MC, as the newer document, drops it.
- **Fix:** Give the hang-up its own step-3 form, with no Recruiter line. Narrator: "The deck's counter starts running." Then HaX's "She's wiping it. She thinks it's gone." and her file/tapes line from §3.2, then "One of them. Now." Add the form to change 11.

**R3-02 (minor). A stale "only" in the dominance list.**
- **Location:** MC:144, "the only one that spares Quintero when WREN is free at the core".
- **Problem:** After R2-01, nobody is wounded on `double_crossed` either.
- **Fix:** "…and the only refusal that spares Quintero at the core."

**R3-03 (minor). Great Falls survives in the user note.**
- **Location:** MC:659 (§12 item 2). Also MC:673 (§13 C-02), which is history but reads as current.
- **Fix:** "walks off the apron at Helena". In §13, add "(Helena since R2-02)".

**R3-04 (minor). "The vendor starts fixing four hundred sites."**
- **Location:** MC:221 (HaX), MC:233 (Netherton).
- **Problem:** The vendor fixes the controller, and the site operators apply the fix. The lines blur the two, while the paragraph at MC:223 keeps them apart.
- **Fix:** "the vendor starts on a fix for four hundred sites".

## Verdict

**Not clean: one major (R3-01), three minors.** Every round-2 finding is fixed, with no stale copies apart from R3-02 and R3-03. The disclosure teaching is now sound. R3-01 is a two-line fix on the sold-and-lied branch. Once it's in, the document is clean for stage 4, and a further round isn't needed for it alone.
