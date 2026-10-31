# WP-12 core_17 annual edition — confirmation design + dialogue review, cycle 2

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes on the neutral corporate skin. No
VMs, no combat, no spy framing, no runtime language model.

Scope: `scenarios/awareness_core_17_annual_2027_defend/` — the `defendOnly` annual mixed edition, host
Graham Whitfield, drawing eight items from E1/E3/E5/E6/E7. This confirms the three C1 findings in
`WP12_DESIGN_C1.md` (fixed in 634f08eea) are present and the edition still looks fresh. core_00, reviewed
clean (0/0/0, bridge 10/10) in C1, is out of scope this round and is not re-reviewed.

**Judged from code and authored data.** core_17 has a bridge job now (`core17`, 8/8 per the log); I did not
run it (Node bridge not assumed, read-only). I re-ran both static checks, re-derived the item set, and
compared the eight reused items against their current E1/E3/E5/E6/E7 source fragments.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 1 | 0 | 0 | 1 |
| **Total** | **1** | **0** | **0** | **1** |

Shape confirmed: `variant: "defendOnly"`, stages `brief, defend, debrief`, set `annual_2027_mixed`, **8 items**
(5 phish / 3 genuine) across email ×2, push, call ×2, page, sms, voicemail; `verifyVerdict: true`;
`feedbackMode: "immediate"`; `passPercent: 0`. No `defend.calls` key; no `flip*` strings; mirror pair
(impostor Gordon → real Gordon) and bank pair (look-alike → confirmed) intact.

**Checks (this pass):**
- `validate_scenario.rb --strict-social --no-graph --skip-ink`: exit 0, schema clean, no social errors or
  warnings.
- `dialoguelint.mjs`: `graham_whitfield.ink lines=4 median=21 p90=24 max=24`, no rule hits (was 41 at C1).
- Em/en dash scan of the shell: **none** (was one at C1).

## C1 closure

| C1 finding | Ruling | Verified this pass |
|---|---|---|
| **MA1** Graham's 41-word welcome fails the 30-word cap | split in `gen_annual_shells.py` | **Closed.** The welcome is now two host lines, "Welcome to the year-end edition. It's a mixed run of this year's messages, across a few channels and a few companies." (21 words) and "Real ones are in there with the scams. Take them one at a time, and say why on each." (19 words). Dialoguelint clean, max 24. |
| **MI1** genuine call labels its speaker "Gordon", impostor "Caller" — a mirror-pair tell | normalise both to "Caller" | **Closed.** Both `e3_call_gordon_impostor` and `e3_call_gordon_real` transcripts now carry `who: "Caller"` on all three lines. The pair can no longer be sorted on the speaker label. |
| **MI2** E1 bank subject carries an em dash | fix in E1 and core_17 together | **Closed.** core_17's subject reads "Updated bank details, please action today"; the shell has no em/en dash. (E1 source normalisation is an E1 concern, outside this scope.) |

## What works (re-verified)

- **The edition is a fair, matched refresher.** Five phish / three genuine across six channels and three
  companies in eight items; the awkward genuine (real Gordon) sits right after its impostor twin, and the
  genuine bank confirmation right after the look-alike bank phish. Refusing everything is wrong on three of
  eight.
- **Neutral, no-blame copy, clean strings.** The brief is the three year-review beats plus "break the chain at
  the first link"; `defendIntro`, `defendOnly`, `noBlameLine` and `mondayCard` are all neutral; the
  conclusion screen reads "Year in review done" / "You've worked through the year's messages" with no success
  boast (end-screen sweep). No dead `flip*` strings in the shell.
- **Host voices as a calm colleague.** The split welcome and the 24-word done-line ("That's the year covered,
  thanks. Check another way, report what doesn't sit right, and leave the rest to the people whose job it
  is.") both read aloud well.
- **Seven of the eight items are byte-faithful to their current sources.** `e1_lookalike_bank`,
  `e1_bank_confirmed`, `e3_push_early`, `e3_call_gordon_real`, `e5_sso_lookalike`, `e6_shift_moved` and
  `e7_vm_ravinder_cloned` all carry the same `isPhish`/flag signature as their E1/E3/E5/E6/E7 fragments today
  (the two E3 calls reshaped from `tells`/`notes` into `truth.flags`/`perFlagNote`/`whyFine`, as C1
  recorded).
- **Bridge job exists.** `core17` is in `run-suite.sh` (the C1 "owed before ship" item), reported 8/8 in the
  build log.

## Findings

### MI-a — minor — needs-user (reconcile) — the impostor Gordon call now scores one more flag than its E3 source, for identical words
Since C1, the visible-tell fix (BUILD_LOG 90cf2fa64, "annual impostor call scores the skipped desk") added
`secrecy_or_bypass` to `e3_call_gordon_impostor` in core_17: its `truth.flags` are now
`["vish_callback_pressure", "borrowed_authority", "secrecy_or_bypass"]` with a fair per-flag note pointing at
the on-screen line "No sense ringing the desk". The E3 source call still scores only
`["vish_callback_pressure", "borrowed_authority"]` for the same transcript.

This is an improvement in isolation: the "skip the desk" tell is visible in the transcript, is offered as a
chip (`secrecy_or_bypass` is in the set `channelTells`), and was previously unrewarded. But it makes the
annual copy no longer a verbatim copy of its E3 source, which the WP-12 spec and the C1 "every reused item is
a verbatim copy ... the measurement matches the year's E3" note relied on. The same words now score three
tells in the annual and two in E3.

Fix (needs-user, pick one):
- **(consistency)** backport `secrecy_or_bypass` and its per-flag note to E3's `e3_call_gordon_impostor`
  source so both score the tell. E3 is a shipped E1–E7 episode outside the E8–E20 visible-tell audit's scope,
  so it was not swept; this closes the gap and keeps the year matched.
- **(or accept)** keep the annual's fuller scoring and record that the C1 "verbatim copy" statement is now
  stale for this one item, on the view that a visible tell ought to score and the annual is a separate sitting
  from E3, not a re-sit.

No `truth`/feedback change beyond the one added flag, so whichever way it goes the item stays fair; this is a
cross-copy consistency call, not a defect in either copy.

## Dialogue pass

Both Graham lines (the split welcome and the done-line) voice cleanly and sit under the cap. No change.

## Verdict

**Ship-ready; one needs-user reconcile.** All three C1 findings are closed and verified: the welcome is split
and lint-clean, both Gordon calls are labelled "Caller", and the em dash is gone. The edition validates clean,
lints clean, carries its bridge job, keeps its mirror pairs and three genuine items, and reads neutral and
no-blame. The one open item (MI-a) is a cross-copy consistency decision created by the post-C1 visible-tell
fix: the annual impostor call now scores a fair, visible `secrecy_or_bypass` tell that its E3 source leaves
unscored. Decide whether to backport it to E3 or accept the fuller scoring. No blocker or major.

---

### Return (one line each)

- **Counts:** 0 blocker, 0 major, 1 minor (0 episode-local, 0 engine, 1 needs-user); validator clean,
  dialoguelint clean (max 24, was 41), no em dash.
- **Blocker:** none.
- **Major:** none. All three C1 findings (MA1 41-word welcome, MI1 Gordon/Caller label, MI2 em dash) closed
  and verified in 634f08eea.
- **Minor MI-a (needs-user):** the annual impostor Gordon call now scores `secrecy_or_bypass` (three flags)
  that its E3 source leaves unscored (two), for identical words — the post-C1 visible-tell fix; backport to E3
  or accept the fuller scoring.
- **Verdict:** ship-ready; reconcile MI-a with the user.
