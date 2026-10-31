# E9 "Passwords and password managers": design review C3 (confirmation)

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Third design pass, first since the engine batches 9 to 11 landed. Judged the shipped files fresh: the C1 and C2/DIALOG_C1 findings re-checked against the current files, the BLIND_B1 minors re-checked, and a new sweep for anything batches 9 to 11 changed on screen (result counts, debrief recaps, the "Episode finished" panel, critical penalties). Kind of game: the awareness product "Incident Simulations: Critical Cases", short education-first episodes for non-technical staff on the neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. Method and standard: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, `modules/core_03_passwords_and_mfa/concepts.md` for facts, and the E9 C1/C2/B1 files.

Scope read end to end: `scenarios/awareness_e9_passwords/{scenario.json.erb, ink/nilesh_solanki.ink}`; `scenarios/awareness_e9_passwords_defend/{scenario.json.erb, ink/nilesh_solanki.ink}`; the triage scoring engine (`inbox-triage/triage-scoring.js`, `isCriticalMiss`/`CRITICAL_PENALTY`) and the debrief view, to judge the batch 10 critical-penalty and recap behaviour from code.

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (both pass; only the generic m01-style suggestions, which do not apply to an awareness episode). `dialoguelint.mjs` both folders (full lines=8 max=30, defend lines=3 max=30, `Totals by rule: none`; the two 30-word host lines sit on the ceiling, as C2 recorded). No em or en dashes in any E9 file. Not run (per brief): no ink compile (`--skip-ink`), no graph, no timed browser playtest, so timing and the on-screen percentage are judged from code and the earlier render in C2, not a fresh image.

## Counts (this pass)

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 0 | 0 | 1 |
| Minor | 1 | 1 | 0 | 0 |
| **Total (new)** | **2** | **1** | **0** | **1** |

Episode shape unchanged: full = 6 stages (`brief, osint, guess, flip, defend, debrief`); defend-only = 3. Defend set `e9_lock_it_down`, 8 items: 1 genuine push, 1 real push phish, 1 fake-IT email, 5 password `choice` cards.

## What works

- **C2 polish (D1, D2) is applied.** The flip no longer doubles its recap: `flipGuessIntro` (full `:488`) carries "the other end: your own phone", and `flipAftermath.intro` is now the non-overlapping "No clever cracking, just a password that worked. A few minutes later, this is what your phone starts showing." (`:458`); the old `flipAftermath.line` is gone. The full "both sides done" host line reads "three random words for the few you must remember by heart" (`ink:25`), the smoother D2 wording.
- **BLIND_B1 minors addressed.** The end card is path-neutral ("guessed or reused", full `:54`), so it no longer claims a landing that did not happen; `run_the_guesser` now closes on a defend-done safety-net mapping as well as on `guess_e9_landed` (full `:729`-`:747`), so it does not sit open when the guesser never lands; the fake-IT email's external domain is now a scored tell (`senderTrust` in `flags` with its `perFlagNote`, full `:216`/`:218`); OSINT uses `pinHints: true` / "Click to note" (full `:664`). The common-guess list is kept deliberately (it teaches).
- **Facts faithful to core_03.** Passkey first, the MFA ladder, made-up security answers, three random words over complexity rules, "no genuine IT asks you to type a number, read back a code or approve a prompt", the HIBP breach check, the sticky-note/shared-login lesson. Unchanged since C2.
- **No-blame register throughout** the brief, the per-item feedback, `noBlameLine` and Nilesh's "Nobody's ever in trouble for reporting." The genuine item (the started prompt) is first; under `scoringProfile: "awareness"` reporting or denying everything is not punished (by-design for the product, carried from C1/C2).
- **Choice cards are recapped correctly.** The five `choice`-kind cards are scored on the 100 scale, stay out of the phish tally, and each wrong pick draws its own debrief review card (the better option and the `ifTrusted` consequence), so no separate `sandboxRecap` hook is needed; the consequence-sandbox "everyday choices" stage does not apply to E9.

## Findings

### F1 — the defend set was never given the batch 10 critical-penalty tuning its sibling episodes got, so a rushed run still drops to 0%. Major, needs-user (scoring policy).

`e9_lock_it_down` sets no `scoring` block in either shell (full `scenario.json.erb:117` region; defend `:95` region), so the two critical-kind items fall back to the engine default of `CRITICAL_PENALTY = 15` per miss with no cap (`triage-scoring.js:57`, `:396`-`:399`). Both are critical by default under `isCriticalMiss` (awareness + phish + Trust, kind in `['push','call','email']`, no `truth.critical` override, `triage-scoring.js:157`-`:160`):

- `e9_push_unstarted` (kind `push`, full `:167`);
- `e9_fake_it_number` (kind `email`, full `:190`).

A learner who approves the 02:40 prompt and trusts the fake-IT email takes -30 off the round mean, which clamps a rushed, trusting run to 0%. BLIND_B1 saw exactly this ("Score 0 percent ... two answers flagged ... 15 points off each", B1 timeline) but did not flag it, because that run predated the decision. In engine batch 10 the team ruled this unfair and re-tuned the cohort: E8 and E15 to `criticalPenalty: 10`, E16 to `5` with a cap of `10` (BUILD_LOG 269, 272, 281, 283), moving rushed E8 from 3%/0% up to 13%. E9 was not in that wiring and is the one episode in its cohort left on the untuned default, so its rushed run is harsher than E8's by design-of-omission. The brief asks for a defend set that is fair; this is the critical-penalty item it names.

Fix (both shells): match E8. Add to the set, after `scoringProfile`:
`"scoring": { "criticalPenalty": 10 },`
(full `scenario.json.erb:117`, defend `:95`). Optionally pair with `resultCopy.caughtBreakdown` / `clampedNote` so the on-screen total explains itself, as the siblings now do. This is a scoring-policy change, so it is the user's call on the exact value; 10 keeps E9 in step with E8.

### F2 — a few choice-card correct options still state their own virtue, mildly telegraphing the answer. Minor, episode-local, content.

BLIND_B1 (#3) found all five password choices "given away by wording and by order (the right option is first, longer, and states the safe habit)". Order is now varied (correct option is 2nd, 1st, 2nd, middle, 2nd across the five), which blunts the "always first" tell. The wording tell is softer but not gone: two correct options describe why they are safe inside the label itself, while their wrong partner does not:

- `e9_passphrase` words option (full `:238`): "Three random words **you don't use anywhere else** ...";
- `e9_signup_password` unique option (full `:240`): "A new password made up by your password manager, **kept only for this portal**".

A trained eye reads the virtue off the label without weighing the choice. Low impact, since the wrong partners are genuine real-world temptations ("Tarrowby2026!", "your usual password", "real maiden name so it is easy to remember", "use the note just this once") and the exercise is a teach, not a trap; C2 did not re-raise it. Optional fix: move the "unique / not reused" justification out of the label and into the `reportReply`, so the two options read as plainer statements of what you would do, e.g.
old (`:238`) `"Three random words you don't use anywhere else (for example otter-ladder-crimson)"`
-> new `"Three random words strung together (for example otter-ladder-crimson)"`
old (`:240`) `"A new password made up by your password manager, kept only for this portal"`
-> new `"A new password made up by your password manager"`.

## Notes (not findings)

- **"Phish caught 0 of 2" over an 8-item round.** The result tally counts the two real phish items and leaves the five `choice` cards out (C1 MI2, by design). It reads a little oddly against an eight-decision round; batch 11's `resultCopy.caughtBreakdown` / `handledRightLabel` were added to self-describe exactly this kind of count and wired into E11/E12/E13/E15/E16, not E9. Optional cohort-parity improvement, best paired with the F1 fix.
- **Duplicate event mapping is intentional.** `episode_e9_passwords_defend_done` completes both `run_the_guesser` and `lock_the_account` (full `:737`-`:747`); the first is the B1 safety net that closes the guesser task when it never lands. Not a bug.
- **Secrecy tell is a declared decoy.** `secrecy_or_bypass` stays in `channelTells` (full `:125`) as a tick decoy with no item requiring it, per the secrecy-tell audit ruling (BUILD_LOG 209). Not a defect.
- **Defend-only global prefix `episode_e9_passwords_defend_defend_`** (double "defend") is internal only and consistent across the shell; same pattern the generator produces (C2 note).
- **Timing still unverified.** No timed playtest (carried from C1/C2); ~15 min full / ~8 min defend is plausible but unconfirmed.

## Verdict

- **Design: one major, one minor.** The C2 polish and the B1 minors are genuinely closed in the current files, and the facts stay faithful to core_03. The open item is F1: E9 missed the batch 10 critical-penalty tuning, so a rushed run still zeroes where its siblings were deliberately softened. F2 is optional polish.
- **Dialogue: clean.** dialoguelint no rule hits, attribution resolves, the hub/`hub_quiet` structure is intact, host lines are within the cap (two on the 30-word ceiling) and voice as a calm colleague, no-blame throughout, no em or en dashes.

Not ship-clean until F1 is decided: it is a one-line scoring addition, non-blocking for progression (the product passes on completion, not percent) but a real fairness gap against the cohort. Recommend applying F1 (and F2 if a wording pass is cheap) and running one timed full-episode playtest.

### Return (one line each)

- Counts: 0 blocker, 1 major, 1 minor (2 total; 1 needs-user, 1 episode-local).
- Blockers: none.
- F1 (major, needs-user): `e9_lock_it_down` has no `scoring.criticalPenalty`, so the two critical items take the default -15 each (no cap) and a rushed run drops to 0%, the fairness gap the team tuned to 10 for E8/E15/E16 in batch 10 — add `"scoring": { "criticalPenalty": 10 }` to both shells (full `scenario.json.erb:117`, defend `:95`).
- F2 (minor, episode-local): two choice-card correct options state their own virtue in the label ("you don't use anywhere else", "kept only for this portal") — full `scenario.json.erb:238`/`:240`.
- Verdict: not ship-clean until F1 is decided (non-blocking for progression); apply F1/F2 and run one timed playtest.
