# E9 "Passwords and password managers": design review C4 (confirmation)

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Fourth design pass, first since engine batch 12 landed and the batch-12 content pass ran. Judged the shipped files fresh: the C3 findings (F1 the critical penalty, F2 the self-praising choice labels) re-checked against the current files, and a new sweep for what batch 12 changed on screen (the team badge, the hidden "Verdict locked" banner, the weakest-skill line after "nothing to grade", the critical penalty). Kind of game: the awareness product "Incident Simulations: Critical Cases", short education-first episodes for non-technical staff on the neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. Method and standard: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, `modules/core_03_passwords_and_mfa/concepts.md` for facts, and the E9 C1/C2/C3/B1 files.

Scope read end to end: `scenarios/awareness_e9_passwords/{scenario.json.erb, ink/nilesh_solanki.ink}`; `scenarios/awareness_e9_passwords_defend/{scenario.json.erb, ink/nilesh_solanki.ink}`; the triage minigame and scoring engine (`inbox-triage/inbox-triage-minigame.js`, `triage-scoring.js`: `teamProtectedCount`, `isCriticalMiss`, `CRITICAL_PENALTY`) for the batch-12 behaviour, to judge the screens from code.

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (both pass; only the generic m01-style suggestions, which do not apply to an awareness episode). `dialoguelint.mjs` both folders (full lines=8 max=30, defend lines=3 max=30, `Totals by rule: none`; the two 30-word host lines sit on the ceiling, as C2/C3 recorded). No em or en dashes in any E9 scenario or ink file (the only hits are the auto-generated `dungeon_graph.*`). Not run (per brief): no ink compile (`--skip-ink`), no graph, no timed browser playtest, so timing and the on-screen percentage are judged from code and the earlier render, not a fresh image.

## Counts (this pass)

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 0 | 0 | 0 | 0 |
| **Total (new)** | **0** | **0** | **0** | **0** |

Episode shape unchanged: full = 6 stages (`brief, osint, guess, flip, defend, debrief`); defend-only = 3. Defend set `e9_lock_it_down`, 8 items: 1 genuine push, 1 real push phish, 1 fake-IT email, 5 password `choice` cards. One nit below.

## What works

- **C3 F1 is fixed, and fairly.** `e9_lock_it_down` now carries a `scoring` block in both shells: `{ "criticalPenalty": 5, "criticalPenaltyCap": 5 }` (full `scenario.json.erb:118`, defend `:97`-`:98`), from the cross-episode penalty pass (commit 8939d2bba). The two critical-kind items (`e9_push_unstarted` kind `push`, `e9_fake_it_number` kind `email`) now take -5 total across the round rather than the old -15 each with no cap, so a rushed, trusting run reads low but no longer floors at 0%. The exact value is a scoring-policy call; 5 with a cap of 5 keeps E9 in step with the softest cohort member (E16) and is defensible for a password episode where the two phish are the whole catch.
- **C3 F2 is fixed.** The two choice-card correct options no longer state their own virtue in the label (commit da29f84a1): `e9_passphrase` words option now reads "Three random words strung together (for example otter-ladder-crimson)" (full `:221`) and `e9_signup_password` unique option "A new password made up by your password manager when you sign up" (full `:244`). The "not reused / unique" justification moved into each `reportReply` ("A unique generated password means a breach of Fuelr can't open anything else", `:277`), so the options now read as plain statements of what you would do and no longer telegraph the answer off the label. Both reworded in the defend shell too (defend `:221`, `:244`).
- **Batch 12 team-badge wording applied.** The content pass (commit aade15788) moved E9's badge to the "reported or checked" form in both shells: `teamBadge` "Risks reported or checked for the team: {n}" (full `:86`, defend `:64`), matching the fact that the tally counts a Verify as well as a Report (`inbox-triage-minigame.js:574`; E9 does not set `teamBadgeCountsChecked: false`). Verify is the taught habit for the two phish prompts, so the word now matches the number.
- **Batch 12 engine changes land for free.** E9 is `feedbackMode` immediate, so the "Verdict locked" banner is now screen-reader-only (`inbox-triage-minigame.js:210`-`215`); and the weakest-skill line is suppressed when no flags were named (`:1598`-`1600`). E9 authors neither and inherits both.
- **Facts faithful to core_03, no-blame throughout.** Passkey first, the MFA ladder, made-up security answers, three random words over complexity rules, "no genuine IT asks you to type a number, read back a code or approve a prompt", the breach-check habit, the sticky-note/shared-login lesson. The genuine started-prompt item is first; under `scoringProfile: "awareness"` reporting or denying everything is not punished (by-design for the product). Nilesh voices as a calm colleague, "Nobody's ever in trouble for reporting."

## Findings

None at the severity bar for this round.

### Nit — the team-badge tooltip says "and choices", but choice cards are excluded from the count. Nit, episode-local, content.

The badge hover title reads "Risky sign-in prompts **and choices** you reported or checked this round rather than going along with" (full `:85`, defend `:63`). The count itself only includes non-`choice` phish items: `teamProtectedCount` skips `kindOf(m) === 'choice'` (`inbox-triage-minigame.js:573`), so the five password `choice` cards never feed `{n}` — only the push and the fake-IT email do. A learner who made all five good password choices but did not report the two phish would still see 0, which the "and choices" in the tooltip mildly overclaims. Tooltip-only and low-visibility, so a nit, not a finding. Optional fix: drop "and choices" from the title, e.g. "Risky sign-in prompts you reported or checked this round rather than going along with".

## Notes (not findings)

- **"Phish caught 0 of 2" over an 8-item round.** The result tally counts the two real phish and leaves the five `choice` cards out (C1 MI2, by design). Batch 11's `resultCopy.caughtBreakdown` / `handledRightLabel` were added to self-describe this kind of count and wired into E10-E16, not E9; the batch-12 content pass touched E9's badge but not these. Still an optional cohort-parity improvement, not required.
- **Duplicate event mapping is intentional.** `episode_e9_passwords_defend_done` completes both `run_the_guesser` and `lock_the_account` (B1 safety net that closes the guesser task when it never lands). Not a bug.
- **Secrecy tell is a declared decoy.** `secrecy_or_bypass` stays in `channelTells` as a tick decoy with no item requiring it, per the secrecy-tell audit ruling (BUILD_LOG 209). Not a defect.
- **Defend-only global prefix `episode_e9_passwords_defend_defend_`** (double "defend") is internal only and consistent across the shell; same pattern the generator produces (C2 note).
- **Timing still unverified.** No timed playtest (carried from C1/C2/C3); ~15 min full / ~8 min defend is plausible but unconfirmed.

## Verdict

- **Design: clean, one nit.** Both C3 findings are genuinely closed in the current files: F1 (the missing critical penalty) by `criticalPenalty: 5` with a cap of 5 in both shells, so a rushed run no longer zeroes; F2 (the self-praising choice labels) by moving the "unique / not reused" justification out of the labels and into the `reportReply`. The batch-12 team-badge wording is applied and matches the count, and the batch-12 engine changes land without authored keys. Facts stay faithful to core_03.
- **Dialogue: clean.** dialoguelint no rule hits, attribution resolves, the hub/`hub_quiet` structure is intact, host lines are within the cap (two on the 30-word ceiling) and voice as a calm colleague, no-blame throughout, no em or en dashes.

E9 is ship-clean this round. The only open item is a tooltip nit (optional) and the standing cohort-parity options (`caughtBreakdown` / `handledRightLabel`). Recommend one timed full-episode playtest before final close.

### Return (one line each)

- Counts: 0 blocker, 0 major, 0 minor (0 findings; 1 nit).
- Blockers: none.
- Majors: none.
- Nit (episode-local): team-badge tooltip says "and choices" but the five `choice` cards are excluded from the count (`teamProtectedCount` skips kind `choice`) — full `scenario.json.erb:85`, defend `:63`.
- Verdict: ship-clean; C3 F1 (penalty 5/cap 5) and F2 (choice labels) both fixed, batch-12 badge applied; optional tooltip tweak and one timed playtest, no further correctness pass needed.
