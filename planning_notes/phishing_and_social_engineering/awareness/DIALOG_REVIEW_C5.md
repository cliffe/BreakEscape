# Awareness dialogue review — formal cycle 5 (final)

Fresh reviewer, read-only (`npc-dialog-review` run in full). **No content files changed; this review
file is the only thing committed.** Baseline: `main` at `2951963f6` (P6 data follow-up pt2).

Scope: the 7 full episodes (`scenarios/awareness_e{1..7}_*/` ink + `scenario.json.erb`) and their
`awareness/e*/` fragments, the defend-only shells, the 24 pre/post checks (incl. Joanne Pell's finance BA
ink), and the `mission.json` "about 15 minutes" wording. Read first: the skill, AGENTS.md
("Kinds of game…", "Iterating"), `DIALOG_REVIEW_C4.md`, everything in `DIALOG_LOG.md` since C4
(cycle-4 fixes parts one and two, P6 data fixes, the two P6 data follow-ups), and `DESIGN_LOG.md`
"E3 MFA decision". Closed C1–C4 and P5/P6 items are not re-raised.

This is an **education-first** awareness course (no spy framing, no VMs, no combat): the bar is correct
security advice, a warm non-blaming voice, plain UK English, and feedback that matches what the learner
did. Under the round-5 stop rule, only minor nitpicks remain in play; nothing here rises above trivial.

## Severity counts

| Severity | Count |
|---|---:|
| Blocker | 0 |
| Major | 0 |
| Minor | 0 |
| Trivial | 2 |

**Voiced-line impact: none.** No finding touches a spoken line, and awareness carries no TTS cache.

## Phase 1 — compile / lint / validate (clean)

- **Compile:** all seven full-episode ink sets compile, `Failed: 0`. The lone `-> END` warning is E3's
  legitimate call hang-up in `leila_servicedesk.ink`. All 24 check inks compile `Failed: 0`.
- **dialoguelint** across all seven full episodes: `Totals by rule: none`. No `line-len`, `choice-len`,
  `you-after-choice`, `not-x-but-y`, `exit-no-reply`, `blank-reentry`, `choice-fallthrough`,
  `tag-on-narrator`, `phone-self-prefix`.
- **Validator** `--strict-social --no-graph` on all seven full erbs: **exit 0**, 0 errors. The 24 lines
  per episode are the pre-accepted generic m01 scaffolding suggestions (VM launchers, PC files, patrols,
  lock-type variety) that do not apply to a kiosk training room — the same set C4 recorded as accepted.
  No new set-but-never-read globals.
- **Defend + check shells:** `--strict-social --no-graph --skip-ink` on all 7 defend-only shells and all
  24 pre/post checks — **31/31 clean, 0 errors.**
- **Parity / unit:** `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` —
  **1843/1843 pass**, fragment↔erb parity green.
- **Hub/exit structure:** the standard `hub_quiet` re-entry pattern with one unconditional sticky `+`
  exit throughout (host inks and Joanne's pre/post); no starved knots.

## Phase 2 — items changed since C4

### E3 MFA choice, outcome, defenderNote, conceptPanel — OK
`mfa.choice` (`awareness_e3_helpdesk_reset/scenario.json.erb:176`) now authors a real decision (timing
×count). Every combination lands, as designed; each timing `outcome` (:186/:192/:198) and each count
`note` (:209/:215/:221) teaches which condition carried the attack, without blaming the target. The
`defenderNote` (:232) and both conceptPanels (full erb :409 technique-general; defend fragment
`e3/defend.json:583` defender-framed, deliberately distinct per DESIGN_LOG m-4/m-5) name the three
controls — number matching, report-don't-approve, rate limit — and read correctly whether the call
landed or was refused. "impostor" spelling consistent (t-4 closed); no "imposter" survives. UK English,
no-blame voice throughout.

### E1 / E2 whyFine teaching notes — OK
`e1_ceo_wire.whyFine.pretextRelevant` (`awareness_e1_invoice_fraud/scenario.json.erb:281`) and E2's
`e2_portfolio_lookalike.whyFine.pretextRelevant` (:200) and `e2_enable_content.whyFine.attachmentPlausible`
(:281) turn a ticked non-flag on a phish into a short teaching line instead of the generic "wasn't one of
this message's tells". Each names the cover and redirects to the real tells. Correct security content,
warm tone, UK English.

### E4 "Stuck?" pointer — OK
`ms_from` slot `stuck` (`awareness_e4_exec_whaling/scenario.json.erb:446`) names a source ("the events and
speaker pages for the address she uses while she's travelling"), never the value. Resolves the
researched-only-"Our people" dead end. Reads cleanly.

### E5 per-cause Hana replies and meter text — OK
`sso_staff.replies` (`awareness_e5_signin_pages/scenario.json.erb:911–914`): `missNoPage`,
`missWrongService` (names Fileharbour — closes P5-8), `missWrongAddress`, each true to its cause, with the
generic `missed` as fallback. `missWrongAddress` and the fallback share their closing clause, which is
fine — they are mutually exclusive branches. Meter `urgencyCalibrated` text (:899 fail / :901 redFlag) is
now pretext/ask-agnostic and still teaches the deadline lesson. OK.

### E6 pressure note and "Real texts and notices" — OK
`e6_parking_permit.truth.flags` now carries `urgencyCalibrated` with a perFlagNote
(`awareness_e6_texts_and_qr/scenario.json.erb:184`: "'Vehicles not set up may be clamped', from Monday, is
there to make you scan now rather than stop to check where the code goes"). `realLabel: "Real texts and
notices"` (:94) replaces the mixed-queue default for the set's genuine text + QR notice. Both read
accurately for the channel. OK.

### E7 critical voicemail — OK
`e7_vm_ravinder_cloned.truth.critical: true` (`awareness_e7_voice_ceo/scenario.json.erb:165`). The three
perFlagNotes (:172–174) teach callback-pressure, secrecy/bypass and borrowed authority on the cloned-voice
voicemail; `ifTrusted` names the £18,400 loss and that Ravinder never made the call. Pairs correctly with
the CEO-name email. OK.

### Renamed Joanne Pell (finance BA host) — OK, one trivial residue (see T1)
`id: joanne_pell`, `displayName: Joanne Pell` resolve exactly; her pre/post ink
(`awareness_pre_finance_ba/ink/joanne_pre.ink`, `awareness_post_finance_ba/ink/joanne_post.ink`) uses the
`hub_quiet` pattern with one sticky exit and reads warmly. No stale "Farah"/"Qureshi" string reaches any
learner-facing field or the generators (the only `Farah` hits are m10's own character, the clash reason).
The finance brief's "ten messages" matches the set. Her displayName and lines are clean.

## Fresh consistency pass (all seven episodes)

- **UK English:** clean. The only US-spelling grep hits are `"color"` engine/CSS keys, not learner text.
- **"Cyber Security":** term not used in any awareness scenario, so the two-word rule does not arise.
- **No-blame voice:** present and distinct in all seven. C4-2's verbatim E1/E3 repeat is closed — E3's
  non-critical tail now reads "A miss just shows which call to slow down next time." and its critical line
  dropped the "built to A, not to B" shape (C4-T1 closed). The shared "where to look next time" motif is
  deliberate (echoes the critical default) and each sentence is now worded distinctly.
- **Shared stock lines:** the "Reporting when you're unsure is always fine and never marked down…" brief
  line appears exactly once per full erb and is the intended shared line; `ruleOfThumb` / `mondayCard` are
  per-episode. No unintended cross-episode verbatim sentence repetition found.
- **mission.json wording:** E1–E5 "about 15 minutes", E6/E7 "about 16 minutes", defend-only "about 8
  minutes" — exactly per the DESIGN_LOG q_timing decision.

## TRIVIAL (no blocker to closing; both are housekeeping, not learner-facing)

### C5-T1 — Joanne Pell's ink header comment is stale from Farah Qureshi
`joanne_pre.ink` and `joanne_post.ink` both describe her as *"early 30s, British Pakistani, from
Leicester"*, which contradicts the canonical record (`BRAND_SET.md:197` and `gen_e1_shells.py:31`:
*"late 40s, white British, from Leicester"*). This is a leftover from the Farah Qureshi bio that the
rename didn't update. Comment-only, invisible to the learner (displayName and lines are correct), so it
does not block closing — but per the standing "rename ids with NPCs" rule the two ink comments should be
brought into line with the canonical bio when E3/E1 ink is next touched.

### C5-T2 — perFlagNote sentence-ending punctuation is mixed (pre-existing)
Across the triage `perFlagNote` strings, some multi-sentence notes end on a full stop and some don't
(e.g. `awareness_e2_cv_lures/scenario.json.erb:193–195` have no closing period; `:205` and E7 `:172`
do). Pre-existing, not introduced since C4, and the engine renders them as self-contained panel lines, so
it is cosmetic. Worth a one-pass normalisation if an editor is in these files anyway; not a cycle-5
finding to act on under the stop rule.

## Checks run
- `./scripts/compile-ink.sh` on all 7 full episodes + 7 sampled check shells: `Failed: 0`.
- `dialoguelint.mjs` on all 7 full episodes: `Totals by rule: none`.
- `validate_scenario.rb --strict-social --no-graph` on all 7 full erbs: exit 0, 0 errors.
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on 7 defend + 24 check shells: 31/31 clean.
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: 1843/1843 pass, parity green.

## Verdict

**The dialogue stage can close.** Phase 1 is clean on every surface (compile, lint, validator, parity).
Every item changed since C4 — the E3 MFA decision beat, the E1/E2 whyFine notes, E4's Stuck? pointer,
E5's per-cause replies and meter text, E6's pressure note and "Real texts and notices", E7's critical
voicemail, and the Joanne Pell rename — is correct, teaches the right lesson, and holds the warm
no-blame voice in plain UK English. The two prior editorial open items (C4-2, C4-T1) are closed. Only two
trivial housekeeping notes remain (a stale ink-header comment and mixed note punctuation), neither
learner-facing and neither a reason to hold the stage open.
