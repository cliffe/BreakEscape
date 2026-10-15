# m06 Follow the Money: dialogue review, pass 5 cycle 3 (confirmation)

Reviewer: a fresh Opus agent, read-only apart from this file, 2026-10-13. Skill: `npc-dialog-review`. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M06_PASS_BRIEF.md`). Read beforehand: `AGENTS.md`, the skill, `DIALOGUE_REVIEW_P5_C2.md` and the log section "Phase 4 dialogue, cycle 2". I did not open the SecGen XML, the four listed field guides, or the exploit detail in `VM_INTEGRATION.md`.

What this tests: the ink as committed in 0356e009 (the ink folder has no uncommitted changes), and the erb's `minder_vouched` lines in the working tree. New finding ids continue from D6-67.

## Step 1: compile, routes, lint, reopencheck

- **Compile.** All nine files compiled with `bin/inklecate` into the scratchpad (`m06-dialogue-c3-review/json/`): no errors, no warnings. Each compiled file is byte-identical to the committed JSON.
- **Routes.** I ran a scratch copy of `route.js` with `DIR` pointed at the scratch compile (the driver hard-codes the repo's ink folder). **29 of 29 pass**, each ending `[result] all expectations met`, with no FAIL line anywhere. Every route asserts `maxRun` 9. The longest run is 9 (the debrief, on four routes). Satoshi peaks at 8 and the briefing at 8.
- **dialoguelint.** `Totals by rule: none`. Longest line: 30 words (an erb text). Longest ink line: 25 words (phone).
- **reopencheck** (all missions in `missions.json`): m06 HaX phone, 1800 reopens, 1366 re-runs, 0 problems. 0 walks replayed the opening. Every other mission is at 0 problems too.
- **Validator** (`--skip-ink --no-graph`): schema passed. The usual 20 duplicate-mapping notes on HaX, plus 14 issues and suggestions and 2 missing recommended fields, all as in cycle 2. No dialogue-facing errors.
- **`minder_vouched` wiring.** Declared in the erb `globalVariables` (:688) and in m06's block of `missions.json` (:913). `VAR`-declared in the minder, Satoshi and debrief inks. Set in `irina_vouches` (`minder:136-137`, after `minder_passed`), and read by the debrief (`:348`), Satoshi (`:76`) and both credits lines (erb `:212-213`). All three legs are present.

## Confirmation of cycle 2 (D6-45 to D6-66)

I checked each row against today's ink by reading the line and grepping for the old text. None of these old strings is left in the ink: "recruit better", "climbed down", "Just the letter", "knew what HashChain", "in the report too", "And you read her notes", "never heard", "never count yours", "Thorough", "guessed", "neither is the money", "goes stale", "same habit", "Not... this", "the mixer she wrote", "place to start" and "Dr. Volkova" (in choices). "got knocked down for it" is now left once (Dani, `debrief:373`), as intended.

| # | Sev. | Outcome in the log | Confirmed? | Evidence and note |
|---|---|---|---|---|
| D6-45 | major | fixed | **Yes** | `satoshi:377` keeps the argument and `:388` is the new one-liner. The two cut lines are gone. On r1 and r28(a) the point lands at :377 and again at the forum closer `:502`, and nowhere else. |
| D6-46 | minor | fixed | **Yes** | `debrief:405` "[I was there. Skip it.]". The letter is first mentioned at :420. |
| D6-47 | minor | fixed | **Yes** | `debrief:382` "None of them were in on it." |
| D6-48 | minor | fixed | **Yes** | `debrief:376`. r25 hears two different endings. |
| D6-49 | minor | fixed | **Yes** | `debrief:246` |
| D6-50 | minor | fixed | **Yes** | `debrief:575`. The credits keep the stinger. |
| D6-51 | minor | fixed | **Yes** | `debrief:289`. r24 and r25 now hear only one "And…" line. |
| D6-52 | minor | fixed | **Yes** | Kemal `minder:149`, Satoshi `:66`, debrief `:364`. The texts are unchanged. |
| D6-53 | minor | fixed | **Yes** | Dani `trader:39-55`, Priya `analyst:39-65`. `irina_news` is set to the matching level, and r29 confirms there's no second reaction on the reopen. Priya's new exit "[I'll leave you to it.]" keeps her first meeting closable. |
| D6-54 | minor | fixed | **Yes** | `trader:254` "like clockwork" |
| D6-55 | minor | fixed | **Yes** | The fund branch of `evidence_pivot` (`irina:438-443`) now ends on "They costed the deaths…". `reveal_identity:468-470` adds the payoff. r1 plays the run as proposed: costed → credentials → "I asked you not to tell me." → "My work. Used to kill people." r26 plays the direct version. The payoff can only fire after "Don't tell me yet." has been said, because `reveal_identity` can't run twice (`recruitment_offered`). |
| D6-56 | minor | fixed | **Yes** | `irina:419` |
| D6-57 | minor | fixed | **Yes** | `satoshi:155`. r29 asserts it. See D6-68 for a small echo the new line creates on that route. |
| D6-58 | minor | fixed | **Yes** | `satoshi:129, 151`. "Impressive." (:127) was rightly kept: it was never part of the finding. |
| D6-59 | minor | fixed | **Yes** | `satoshi:216-226`. The recruited case comes first, so a turned-then-KO'd Irina still gets the betrayal line. r29 plays the new case. |
| D6-60 | minor | fixed | **Yes** | `satoshi:325` |
| D6-61 | minor | fixed | **Yes** | `satoshi:424`. r28(b) plays both lines. |
| D6-62 | minor | fixed | **Yes** | `phone:671` "Try the password you already have." |
| D6-63 | minor | fixed | **Yes** | Wired as in Step 1. r28(a), talked past then strained: "you must have been convincing", "I'd like to hear what you said to him" and "Talked your way past him", with nothing crediting Volkova. r28(b), held cover with the picks caught: Satoshi's new opener, "took Volkova's word" and "Let you in on Volkova's word", and "Talked your way past him" is absent. Precedence (KO, hostile, vouched, passed, challenged) is the same in the debrief (`:342-354`), Satoshi (`:71-82`) and the credits. The vouch choice needs `irina_recruited and not irina_ko` (`minder:67, 83`), so "So that's where she's gone." is always true when it plays. |
| D6-64 | minor | fixed | **Yes** | `irina:203, 209`, and `trader:120`. The `Dr. Irina Volkova:` prefix is untouched. |
| D6-65 | minor | fixed | **Yes** | `r28_kemal_vouch_edges.json` and `r29_no_fund_satoshi_casualties.json` exist and pass. |
| D6-66 | minor | fixed | **Yes** | `debrief:155-160`. r25 (freeze) is unaffected. The watch route without `operation_disrupted` (r28(b)) keeps both lines. |

**All 22 are confirmed fixed.** No fix from cycle 2 left new debris behind, apart from the small echo in D6-68.

## Severity table (new findings)

Counts: **0 blockers, 1 major, 1 minor.**

| # | Sev. | File:line | Finding | Concrete fix |
|---|---|---|---|---|
| D6-67 | major | `m06_npc_irina_volkova.ink:574-578` (with `:472-478`) | **Irina's last line on a direct-reveal detention contradicts the line she has just said.** Since D6-1, a direct reveal shows her the casualty line, and she reacts with "*reads it twice* I wrote the mixer so nobody could see where money went. Not so nobody could see this." That branch never sets `moral_conflict_revealed`, which only `evidence_pivot` sets (`:450`). So when the player then detains her, at once or after a refusal, `detain_irina` takes the `else` and she says "This is the state overreach we warned people about." This is debris from cycle 1 that cycle 2 missed. It isn't an edge case: 9 of the 29 routes play exactly this pair (r2, r5, r7, r9, r12, r16, r17, r22, r26), and every route that reaches the defiant line reaches it straight after "reads it twice". Every path into `detain_irina` now runs through a scene where she has read the projection, so the defiant line can no longer play anywhere it fits. Coming two lines after her horror, it reads as if she hadn't seen the page. It also echoes Satoshi's "That's the state I've been warning people about" (`satoshi:377`). It's the last thing she says on a main moral branch. | In `reveal_identity`'s `else` branch (`:474-477`), add `~ moral_conflict_revealed = true` beside `~ shown_architects_fund = true`. Every detention then gets "*offers her wrists* I really did think I was building something good." / "All those papers. For this.", which is true on every route. The defiant `else` at `:576-577` becomes unreachable, so collapse the conditional to the wrists line. Her ideological voice survives in the refusal ("Financial privacy is a right. If people abuse it, that is on them."), where denial fits. `moral_conflict_revealed` is read nowhere else (it's declared in the erb at `:705`, and its only reader is `irina:574`), so nothing else changes. Update the route expectations on the nine routes, and add a `notSaid: "state overreach"` to r26. |
| D6-68 | minor | `m06_satoshi_confrontation.ink:129`, then `:155` and `:302` | No-fund route (r29). Within about ten lines Satoshi says "You haven't found my wallet. But you've seen enough of my exchange to guess.", then "You haven't seen the numbers. I have…", then "Though you don't know which wallet is mine. Do you?" That's two "You haven't…" openers three lines apart, and the wallet point twice. The pitch's line at :302 is the better place for it, because it sets up the deferral. | `:129` → `Satoshi Nakamoto II: You've seen enough of my exchange to guess.` |

No lint, route or reopen finding needed withdrawing: all of them were clean.

## Heard end to end

I read the debrief, Satoshi and Irina as a player would hear them on seven routes: r1 (cover held, turned, freeze), r24 (watch, strained cover, turned then knocked down, two KOs), r25 (freeze, three staff KOs, detained, Satoshi knocked down), r26 (direct reveal, detention), r27 (refusal, time, then the write-up turns her), r28 (both Kemal edges, freeze and watch), and r29 (no fund, Irina down early).

- **Debrief.** It holds up on every route. Each outcome line agrees with the credits, the staff block no longer reads like a mail merge, and the letter now arrives after the player has heard the word. The heavy-KO route (r25) runs 9 lines at its longest, and it earns them: KO, photo, van, then a player beat.
- **Satoshi.** He reads as a man with an argument on every route I walked. Each point lands once, and the closers ("Enjoy the map while it's fresh", "every forum by morning") no longer have a pre-echo. The vouch opener on r28(b) gives him a sharp, specific deduction early, and his later "That's why she betrayed us, isn't it?" turns rhetorical, which suits him. The only echo left is D6-68.
- **Irina.** The new payoff works. On r1, "I asked you not to tell me." between the credentials and "My work. Used to kill people." is the best four lines she has. r27's refusal-then-turn reads as a woman changing her mind over time, not flipping. The one fault is D6-67, at the end of the detention branch.

## Verdict on closing the phase

**Close the dialogue phase once D6-67 is fixed. It doesn't need a fourth review cycle.** Cycle 3 found 0 blockers, 1 major and 1 minor, against cycle 2's 0, 1 and 21. All 22 cycle-2 findings are confirmed closed. The one major is a single-variable fix in one knot, and it's debris from cycle 1's D6-1, not a new class of problem. The orchestrator can confirm it without a reviewer:
1. Apply D6-67 and D6-68.
2. Recompile, then update the nine routes' expectations and add `notSaid: "state overreach"` to r26.
3. Re-run all 29 routes, dialoguelint and reopencheck, and run tagdiff against HEAD. The only expected difference is the new assignment in `reveal_identity` and the collapsed conditional in `detain_irina`.

After that, what's left is taste, not faults. Then run the browser checks below, which have been owed since cycle 1, and close the phase.

**Spoken lines this review would change** (no audio exists yet): cut Irina's "This is the state overreach we warned people about." (it becomes unreachable). Satoshi: "You haven't found my wallet. But you've seen enough of my exchange to guess." → "You've seen enough of my exchange to guess."

## Browser checklist before closing

Use the keyless server on :3001 with a Sonnet tester and the checked-in scripts. Plan short runs of 10 to 15 minutes, each with at least one page reload. Each item below names what to read on screen.

1. **Irina, direct reveal, then detain (D6-67, after the fix).** Fund found, the executive badge taken first. Expect "Don't tell me yet." at the badge, then "I asked you not to tell me." at the reveal, then "*reads it twice*…", then "*offers her wrists* I really did think…". "State overreach" must not appear.
2. **Irina, the evidence route (D6-55).** With the write-up and the fund, after the badge scene: "They costed the deaths…" → credentials → "I asked you not to tell me." → "My work. Used to kill people." Then a reload, and the turned re-entry line.
3. **Dani and Priya after Irina's fate (D6-5, D6-53).** (a) Detain Irina, then meet Dani and Priya for the first time: the "Is this about Irina?" and "If you're here about Irina…" openers. (b) Talk to them both, then detain, collect (leave the floor and come back) and knock her down: each one reacts once, and a reopen after a page reload doesn't react again.
4. **Kemal's vouch (D6-63).** Cover held, Irina turned. Let Kemal catch the picks on Satoshi's door, then pick "Dr Volkova sent me up". Expect the call narration and "Na gut. Go in.". Satoshi then opens with "Kemal rang Irina, and she vouched for you." The debrief says "took Volkova's word", and the credits say "Let you in on Volkova's word". For the other edge, talk past Kemal with the FCA line, then knock Dani down: the credits must say "Talked your way past him".
5. **Satoshi's return (D6-21, D6-60).** Defer without the fund, reload, and come back: one line ("Found my wallet yet? No?"), not the pitch. Defer again with the fund but no keys, and expect "The money is, in three days.".
6. **HaX's first call after a catch, and after a guard KO** (D6-33): the opener branches on each.
7. **The debrief's watch route via "What's left of that clock?"** (D6-66): HaX says "They don't know we're watching…", and doesn't say "Every cell that took a payout…". This is the one place the debrief relies on a knot visit count in the engine.

Record each check with a screenshot of the line, and confirm progress with `verify-run.rb`.
