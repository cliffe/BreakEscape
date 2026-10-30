# E14 "Social media and oversharing": design review C4 (+ dialogue)

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no runtime language model. E14 is the
one attack-first episode: an OSINT-then-write attack half, a built defender-inbox flip keyed by the chosen
pretext, then a defend half (6-item SMS/DM set + the unscored "Post or Not?" sort drill + the ENG-13
privacy panel). Company Merrin & Sallow Architects; host the co-founder Julian Sallow; module core_12.
Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review`/`npc-dialog-review` skills adapted to
this kind, and the C1/C2/C3 reviews plus the P1 persona report in this folder.

Confirmation round. I judged the files fresh and paid particular attention to the C3 fix wave (55e307fa7:
the plain-word swaps and the dropped catch-up flip line) and the engine batch-12 changes (confirm prompt
copy, the hidden "Verdict locked" banner, the weakest-skill suppression after "nothing to grade"). I did
**not** run a new bridge this pass; I judged the screens from the authored data, the erbs and the engine
code, and leaned on the C2 render (game 4883, 19/19) for the flip. Where a finding turns on on-screen
behaviour I say so.

Ran (all E14-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema and strict-social
  pass. No SOCIAL warning on either shell; only the generic m01-shaped SUGGESTION noise and the one
  "no timedConversation" recommended-field note every one-room awareness kiosk draws.
- `dialoguelint.mjs` both shells: full `lines=7 median=17 p90=23 max=23`; defend `lines=3 median=28 p90=28
  max=28`. No rule hits; every host line under the 30-word guide.
- `social-awareness-fragment-erb-parity.test.mjs` + `social-awareness-rule-of-thumb.test.mjs`: **22/22
  pass** (E14 fragment↔full-erb parity among them; rule of thumb byte-identical across the set).
- No em or en dashes in any learner-facing E14 copy, both shells. No raw printed variables.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** |

Two nits are carried from C3 and marked as nits below; neither is a fresh defect.

## C3 closure

| Item | What was wrong | Verified now | Status |
|---|---|---|---|
| **C3 D1** (minor, needs-user) | attack-half jargon "red team" / "pretext message" / "reconnaissance" not first-read words | 55e307fa7 applied the recommended swaps. `scenario_brief`/`strings.brief` now "First you play the attacker's side..." (full erb `:4`/`:462`); `endGoal` and task title now "the test message" (`:5`/`:33`); the two `recon_request` reasons say "scouting" (`:178`/`:247`); defend-only carries the same ("scouting" at erb `:154`/`:223`/`:296`). `grep` for all three terms across both shells returns nothing in learner copy. "pretext" survives only in internal ids (`taskId`, flag/part ids, the composer field chrome), not on screen. | **Closed** |
| **C3 D2** (minor, episode-local) | dead `flipDefenderLineByChoice.df_pretext_catchup` line (the catch-up decoy never lands) | dropped from both the fragment (`full_only.json`, no `catchup` key) and the full erb (`:475-478` now holds only the two landing pretexts). Nothing to voice in a later TTS pass. | **Closed** |
| **C3 D3** (minor, episode-local, defensible) | `pp_security_answer` neutralises rather than hides the pet fact | unchanged; still defensible (core_12 favours the made-up answer, and `pp_posts` also covers the pet post). Carried as a nit. | **Carried (nit)** |

All three C3 opens are resolved as recommended, the two that were actionable fully closed. The two C1
majors and C2's one live validator warning stayed closed.

## Batch-12 engine changes, judged for E14

- **Hidden "Verdict locked" banner.** E14's set is `feedbackMode: "immediate"`, so it is in scope for
  item 1: the engine adds `tri-live-sr` to the live region in immediate mode
  (`inbox-triage-minigame.js:215`), hiding the accent "Verdict locked: …" notice visually while keeping
  it for screen readers, because the review card is the visible confirmation. Correct for E14; the review
  card carries the per-item feedback.
- **Weakest-skill line suppressed after "nothing to grade".** The result screen prints the per-factor
  breakdown and the "Weakest skill" pointer only when the learner named at least one flag (or chose
  "Nothing looks wrong"); a no-tick round shows only `noFlagsLead` + `noFlags`
  (`:1550-1601`). E14 supplies both (`:112-113`), so a refuse-everything round reads "You didn't tick
  anything you noticed, so there's nothing to grade skill by skill. Next time, tick what looks off…" with
  no contradictory skill line. Correct.
- **Confirm prompt copy.** E14 does **not** set `set.confirmPrompt` (`verifyVerdict: false`, no
  confirm-prompt UI), so batch-12 item 17's reworded default does not surface here. No impact.

## Result screen without the batch result-count keys (brief's question)

E14 did not adopt `caughtBreakdown` / `handledRightLabel` / `confirmPrompt`. It **does** carry the
de-phished `labels.teamBadge`/`teamBadgeTitle`/`phishCaughtLabel`, `resultCopy.reportedPct`/`criticalLead`
and the band headlines. The result grid reads clearly without the batch keys:

- The three messages are `kind: "sms"`, so `_queueInfo` returns the sms branch: `phishCaughtLabel`
  overrides the catch line to "Fakes caught N of M"; the second grid line is "Reported rather than just
  deleted: N of M"; the third is "Real messages handled right: N of M" (default `{real}` noun "Real
  messages"). Nothing reads as "phish".
- The "Reported rather than just deleted" line already splits reported from deleted, which is the exact
  gap `caughtBreakdown` was added to close for E11/E16. E14's `verifyVerdict:false` means no Verify to
  fold in, so the key would add nothing here. Not needed.
- The C3-carried headline tension (E14-m8: "Getting there: a few signs slipped past" at a score below 85
  while "Fakes caught 3 of 3") reads coherently once judged from the copy, not as a contradiction: "signs"
  are the tells the learner failed to tick, which is what the sub-85 score reflects, and the per-skill
  breakdown directly below lists "caught X of Y" per tell. A learner reads "I got the verdicts right but
  missed naming some of the signs." I would not wire `caughtBreakdown` for E14; the screen is clear as is.

**Answer:** yes, E14's result screen reads clearly without the batch-11/12 result-count keys.

## What works

- **One clear lesson a clerk can repeat on Monday**, matching core_12: public posts add up to a map of
  your firm; small details do the damage; a real recruiter never needs your systems or org chart; tighten
  settings and use a made-up security answer. The plain-word swaps keep the attack half readable for the
  stated audience without losing the teaching.
- **The flip pays off the attack** (C2 render): a careful, tell-free message that lands replays itself in
  Yasmin's seat and names the facts that made it fit the week, keyed to the chosen pretext.
- **The defend set is fair and matched.** 3 report + 3 trust, so refusing everything is not the win; the
  mirror pair is clean; the genuine agency recruiter (row 3) sits right after the fake one as the matched
  genuine item after the likely miss; `recon_request` is the consistent teachable tell, named plainly in
  the per-item reasons (now "scouting").
- **Advice stays proportionate.** The sort drill weights Tweak/Hold with two clean Post cards; the privacy
  panel is "connections only", and the no-blame line says the fix is a setting and a pause, not shame.
- **No-blame register throughout**; both shells validate with no social warnings; parity and
  rule-of-thumb suites green; the defend-only shell is self-contained (no Dani, no board) and carries the
  same plain words.

## Dialogue pass (voiced host lines)

Julian's ink reads as spoken in both shells, unchanged since C3 and not touched by this wave: full-shell
lines ≤23 words, defend-only three lines at the 28-word ceiling (the same borderline the other defend-only
hosts sit on; leave them). Calm-colleague register, no printed variables, UK English, no em/en dashes. No
host line needs a change; the C3 copy fixes were all on-screen episode text, not spoken lines.

## Notes (not findings)

- **The rule of thumb is phishing-flavoured** and sits loosely on a social-media set; byte-identical
  across the 20 episodes by design (§17), the core_12 habit carried by the Monday card. Product decision,
  as elsewhere.
- **Timing over target.** P1 estimated ~18 min full against a 15-minute budget, the two unscored
  activities the main sink. Product-level pacing note across the wave; no fresh timed run this pass.
- **Queued engine items** (per the standing brief, not re-raised or counted): OSINT pin cue, "Post or
  Not?" summary marks, address font on `.tri-phone-number` handles, privacy-panel live-region stray text.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass (plain-word swaps landed) | pass |
| osint | pass | — |
| write | pass (3 pretexts + 2 ask tails; catch-up decoy reads as English) | — |
| flip | pass (C2 render) | — |
| defend | pass (6-item set fair and matched; result grid clear without batch keys; sort drill + privacy panel self-contained) | pass |
| debrief | pass | pass |

**Ship-ready.** Every C3 open is closed (D1 plain words, D2 dead line dropped), the batch-12 engine
changes behave correctly for E14's immediate-feedback no-confirm set, and the result screen reads clearly
without the batch result-count keys. What remains is the two accepted nits (the security-answer mapping,
the phishing-flavoured rule of thumb). None blocks ship; a fresh timed playtest is still owed for the
budget check.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 0 minor (2 carried nits).
- Closure: C3 D1 (jargon) closed via 55e307fa7 — "the attacker's side"/"test message"/"scouting", no
  stale term in either shell; C3 D2 (dead `df_pretext_catchup` line) dropped from fragment and erb; C3 D3
  (security-answer mapping) carried, defensible.
- Batch-12: hidden "Verdict locked" banner correct (E14 is immediate-mode); weakest-skill line suppressed
  after "nothing to grade"; E14 sets no `confirmPrompt`, so item 17 does not apply.
- Result screen without batch keys: reads clearly — labels de-phished, "Reported rather than just deleted"
  already splits reported/deleted (no Verify to fold in), and the "a few signs slipped past" headline is
  coherent with "Fakes caught 3 of 3" (signs = unticked tells).
- Blockers: none.
- Majors: none.
- Verdict: ship-ready. Validators/parity/dialoguelint green; flip judged from the C2 render, everything
  else from code and the erbs; a timed playtest still owed.
