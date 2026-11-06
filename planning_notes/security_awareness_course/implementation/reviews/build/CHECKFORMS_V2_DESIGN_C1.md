# Check-forms design review C1: general_v2 and data_conduct

Reviewer: opus48 (design review, adapted to a measurement instrument). Date: 2026-10-29.
Scope: the two new topic check pairs, eight shells:
`awareness_{pre,post}_general_v2_{ab,ba}` and `awareness_{pre,post}_data_conduct_{ab,ba}`.
Read-only except this file. Sources of truth used: the shipped `scenario.json.erb` shells, the
authoring fragments `awareness/checks_v2/{general_v2,data_conduct}.json`, the generator
`gen_checks_v2_shells.py` and its notes, `10_CHECK_FORMS.md`, `SECRECY_TELL_AUDIT.md`.

All screens judged from code and JSON, not from a render: these check shells carry no bridge job
(correctly: checks are standalone `training` missions, not in `tools/playtest/se/run-suite.sh`), and
Node 24 for a bridge is not assumed present. The triage card rendering (address font, text size) is
the shared inbox-triage renderer; these forms add no custom rendering and reuse only the built card
kinds `email`, `page`, `push`, `call`.

## Counts per form pair

Confirmed by regenerating both pairs into a scratch folder: every shipped `scenario.json.erb`,
`mission.json` and `.ink` is **byte-identical** to a fresh `gen_checks_v2_shells.py` run, so the
generator is the single source of truth and the shells match it.

| Property | general_v2 | data_conduct |
|---|---|---|
| Items per form | 10 (A and B) | 10 (A and B) |
| Phish / genuine | 4 / 6 | 4 / 6 |
| Difficulty mix (author-rated, `_formPairing`) | 5 easy / 4 medium / 1 hard, identical A and B | 5 easy / 4 medium / 1 hard, identical A and B |
| Card kinds | 8 email, 1 page, 1 push | 9 email, 1 call |
| Scored-flag multiset (identical A and B) | senderTrust 2, linkCredible 1, lookalike_domain 1, padlock_myth 1, unrequested_mfa_push 1 (6) | senderTrust 3, pretextRelevant 2, secrecy_or_bypass 2, vish_callback_pressure 1 (8) |
| channelTells | lookalike_domain, padlock_myth, unrequested_mfa_push | secrecy_or_bypass, vish_callback_pressure |
| Verify | off (matches built `general`) | on (`verifyVerdict: true`; call item needs ring-back) |
| Counterbalance | pre_ab=A, post_ab=B, pre_ba=B, post_ba=A | same |
| Phish slots after PERMUTE | A {1,3,5,7} / B {2,4,6,8} (disjoint) | A {1,3,5,7} / B {2,4,6,8} (disjoint) |
| Validator `--strict-social --no-graph --skip-ink` | 4/4 pass | 4/4 pass |
| Balance lint (scratch pair scenario) | no pass-but-bad / fail-but-fine / same-message error | same |
| Registry + rule-of-thumb test | registered in CHECK_ROLES; test green (73 shells) | registered; green |
| missions.json | all 4 shells registered | all 4 shells registered |
| Blocker / Major / minor | 0 / 1 / 2 | 0 / 0 / 1 (shared) |

## What works

- **Parallel pre/post, true counterbalance.** For one learner, pre and post are the two different
  forms (A then B, or B then A), matched item-for-item on kind, phish/genuine, scored-flag multiset
  and difficulty, with entirely different senders, subjects and bodies. A gain reflects learning, not
  easier items or memory of the first sitting. Across the cohort each form serves as pre for half and
  post for half, cancelling any residual form-difficulty difference. This is a correct counterbalance.
- **Disjoint phish slots confirmed by hand on the shipped shells** (A phish at ordinal {1,3,5,7}, B at
  {2,4,6,8}; no slot is a phish in both, no slot shares a flag signature). Pre and post for one learner
  therefore place the phish at different positions, so no positional strategy carries across sittings.
- **No unfair "invisible" tell.** Every scored flag is surfaced in the item the learner sees: page
  URL and padlock on the `page` item, the odd-hour unknown-location on the `push`, the external
  `from.address` for every `senderTrust`, the over-broad request for `pretextRelevant`, and the
  spoken "don't log it / don't raise a ticket" for `secrecy_or_bypass` and `vish_callback_pressure`.
  Nothing is scored on a header field the collapsed header hides.
- **The week's unfair-Secrecy-tell class does not appear here.** `SECRECY_TELL_AUDIT.md` rates all
  four `secrecy_or_bypass` items in data_conduct (dca_login_favour, dca_personal_email_push,
  dcb_approve_under_you, dcb_skip_dlp) FAIR, each quoting an explicit bypass line; general_v2 does not
  use the tell. Verified against the shipped bodies.
- **The P1-M1 / C2-M6 ruling is implemented.** general_v2 item 8 scores `senderTrust` only (not
  `reply_to_differs`), and data_conduct item 8 scores `senderTrust` + `secrecy_or_bypass` (not
  `reply_to_differs`). In both, the reply-to point lives in `headerNote` as a "you could also see"
  line, and `reply_to_differs` is absent from `channelTells`. Consistent with the headerPanel-off
  decision.
- **Balance items present and correct.** Each form carries one pass-but-bad phish (item 8, all auth
  pass, tell in the body/address) and one fail-but-fine genuine item (general_v2 item 5, data_conduct
  item 9; DKIM fail with a `whyFine` that a failed check is a clue, not proof). The balance lint fires
  clean on a scratch pair scenario for both pairs.
- **Topic coverage maps to the course.** general_v2 covers core_04 (reporting loop), core_03 (MFA,
  password manager), core_07/08 (updates, fake pages), core_15 (deepfake/AI), core_13 (tools,
  removable media) and one core_10 pretext; data_conduct covers core_05/06 (data protection and
  handling), core_12 (oversharing, fake recruiters/journalists), core_14 (insider risk, "your login is
  you") and core_16 (acceptable use). Each item cites a `concepts.md` section in `_formPairing`.
- **No name sits on both sides of the phish/genuine line.** Impostor names (Wesley Tan, Dale Ferris,
  Priya Nadar, Helen Achterberg-as-impostor, Grant Faulkner, Trevor Oakes, Kenny Dolan, Deborah Vale,
  Carla Mendes, Neil Garrity, Gavin Shaw, Rhona Baxter) are impostor-only; genuine senders are a
  separate set. Addresses are all `.example`; no real brand.
- **Register is fair and no-blame.** Briefs state "reporting when you're unsure is always fine and
  never marked down"; every genuine item has a `whyFine`, every phish a `perFlagNote`, `ifTrusted` and
  `reportReply`. One defensible answer per item, including the "Trust or Verify both fine" genuine
  data asks (data_conduct items 3, 9) and the awkward genuine (manager/access-review) that stops a
  blanket refuse.

## Findings

### MAJOR

**P1-M1 (major, generator-local). The PERMUTE arrays make both new forms strictly alternate
phish/genuine, a positional regularity the built forms deliberately avoid.**
`gen_checks_v2_shells.py:74-79`. The shipped shells place phish at ordinal slots A {1,3,5,7} and B
{2,4,6,8}: form A runs P,G,P,G,P,G,P,G,G,G and form B runs G,P,G,P,G,P,G,P,G,G. The built baseline
forms scatter the phish instead (`general_form_a` {1,4,6,9}, `general_form_b` {2,3,7,10};
`finance_form_a` {1,4,6,9}), precisely so a test-wise learner cannot infer "every other item is the
suspicious one." Under the `awareness` scoring profile the four unsafe items are the only
discriminating items, so a learner who games the alternation lands the discriminating answers for the
wrong reason, inflating the score and biasing the pre/post gain. The arrays satisfy the audit's
disjointness check but not its intent of an unpredictable layout; the parity audit (step 2) only tests
disjointness, so this slipped through. The generator notes present these exact arrays as the worked
example, but the worked example illustrates disjointness, not scatter.
*Fix (parity-neutral, changes no counts, flags or difficulty):* choose disjoint **scatter** arrays
that match the baseline shape, e.g.
`general_v2_form_a` / `data_conduct_form_a` = `[1, 0, 2, 3, 4, 5, 6, 8, 7, 9]` (phish at slots
{1,4,6,9}) and `..._form_b` = `[0, 1, 3, 2, 4, 6, 5, 8, 9, 7]` (phish at slots {2,3,7,10}); then
re-run the audit disjointness check and regenerate. Any disjoint non-alternating pair is acceptable.
Judgement call bordering major/minor: the instrument is otherwise valid and the bias hits pre and
post alike, but it regresses the anti-gaming standard the baseline set across all four new forms for a
one-line fix, so I log it as a major.

### minor

**P1-m1 (minor, needs-user, reconcile). The task brief's data_conduct topic list differs from the
shipped (settled) scheme.** The review task says data_conduct should cover E11, E15, E16, E17. The
settled scheme in `10_CHECK_FORMS.md` and the shipped forms cover E11 (core_05/06), **E14** (core_12),
E16 (core_14) and E17 (core_16); **E15** (shadow IT, core_13) is measured in general_v2 (items 7-8),
not data_conduct. The shipped mapping follows the settled spec, so this is a brief/spec wording
mismatch to confirm with the orchestrator, not a form defect.

**P1-m2 (minor, note only). Two modules are touched by both forms, by design.** core_13 appears in
general_v2 (items 7-8: free converter, posted USB) and in data_conduct (item 8: personal email as a
data-exfil route); core_16 appears in general_v2 (item 9B survey/policy ack) and is a data_conduct
core topic (item 7). The framing differs each time (a tool/device threat in general_v2 vs a
data-handling bypass in data_conduct), which matches the spec's broad-vs-conduct split, so the overlap
is light and intentional. Flagged only so the organiser knows the two pairs are not perfectly
orthogonal on those two modules.

## Notes for the user (not defects)

- **Measurement power.** Under the `awareness` profile a genuine item scores full marks whether the
  learner Trusts, Reports or Verifies, so discrimination rests entirely on the four unsafe items per
  form. This is the settled, baseline-matching design (reporting when unsure is deliberately never
  penalised), but it means each pair's sensitivity comes from four items; the two-broad-pairs
  trade-off (no per-topic pre/post figure) compounds this. Raised for awareness, not for change.
- **Difficulty is author-rated, not machine-checked.** The 5/4/1 mix lives in `_formPairing` prose;
  the validator does not enforce it. I confirmed it reads 5/4/1 identically in A and B for both pairs
  from those rows, but it is a human rating, as in the baseline.
- **Item-to-module citations taken from the spec table, not re-derived from each `concepts.md`.** The
  mapping is coherent on the item text; I did not re-open all ten module `concepts.md` files.
- **No bridge jobs exist for these eight shells, and none should** — checks are standalone `training`
  missions, not members of either seeded course and not listed in `run-suite.sh`. Confirmed by grep.

## Verdict

**Approve with one major to fix.** The two pairs are well-matched, correctly counterbalanced, validate
clean, register and pass the rule-of-thumb guard, and carry no unfair or invisible tell (the week's
Secrecy-tell class is absent). The one major is the strictly alternating phish layout in the PERMUTE
arrays, which drops below the baseline's scatter standard and is fixable in one line of the generator
with no parity cost. The two minors are a brief/spec reconciliation and a noted, intended module
overlap. No blocker.
