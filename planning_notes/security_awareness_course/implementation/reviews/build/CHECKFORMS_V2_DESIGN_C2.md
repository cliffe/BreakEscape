# Check-forms confirmation design review C2: general_v2 and data_conduct

Date: 2026-10-30. Reviewer: Opus 4.8 (design review adapted to a measurement instrument), read-only except
this file. Scope: the two topic check pairs, eight shells
`awareness_{pre,post}_{general_v2,data_conduct}_{ab,ba}`.

This confirms the one fix from `CHECKFORMS_V2_DESIGN_C1.md` (P1-M1, the strictly alternating phish layout)
landed, and re-checks counterbalance and parity. Sources: the shipped `scenario.json.erb` shells, the
generator `gen_checks_v2_shells.py`, and the authoring fragments under `awareness/checks_v2/`.

**All screens judged from code and JSON**, not a render: the check shells carry no bridge job (correctly;
they are standalone `training` missions), and they add no custom rendering, reusing only the built card kinds.

## Fix confirmation

**P1-M1 (C1 major) is fixed.** `gen_checks_v2_shells.py:74-78` now carries scatter `PERMUTE` arrays, not the
alternating ones:
- `general_v2_form_a` / `data_conduct_form_a` = `[1, 0, 2, 3, 4, 5, 6, 8, 7, 9]`
- `general_v2_form_b` / `data_conduct_form_b` = `[0, 1, 3, 2, 4, 6, 5, 8, 9, 7]`

These are exactly the reviewer's suggested arrays. On the shipped shells the phish now land at ordinal slots
**A {1,4,6,9}** and **B {2,3,7,10}** (confirmed on all eight shells by parsing the built `messages` arrays),
matching the baseline forms' scatter shape and no longer the P,G,P,G... alternation C1 flagged. The slots stay
disjoint across A and B, so a learner's pre and post still place the phish at different positions.

I regenerated all eight shells into a scratch folder with the current generator: every `scenario.json.erb`,
`mission.json` and `.ink` is **byte-identical** to the shipped shells, so the generator remains the single
source of truth and the shells match it.

## Parity and counterbalance (re-checked on the shipped shells)

| Property | general_v2 | data_conduct |
|---|---|---|
| Items per form | 10 (A and B) | 10 (A and B) |
| Phish / genuine | 4 / 6 | 4 / 6 |
| Phish slots after PERMUTE | A {1,4,6,9} / B {2,3,7,10} (disjoint, scatter) | A {1,4,6,9} / B {2,3,7,10} (disjoint, scatter) |
| Scored-flag multiset, A | senderTrust 2, linkCredible 1, lookalike_domain 1, padlock_myth 1, unrequested_mfa_push 1 (6) | senderTrust 3, pretextRelevant 2, secrecy_or_bypass 2, vish_callback_pressure 1 (8) |
| Scored-flag multiset, B | **identical to A** | **identical to A** |
| channelTells | lookalike_domain, padlock_myth, unrequested_mfa_push | secrecy_or_bypass, vish_callback_pressure |
| Counterbalance | pre_ab=A, post_ab=B, pre_ba=B, post_ba=A | same |
| Verify | off | on (`verifyVerdict: true`) |
| Validator `--strict-social --no-graph --skip-ink` | 4/4 exit 0 | 4/4 exit 0 |

- **Ten items, 4 phish / 6 genuine, on every one of the eight shells.** Confirmed by parsing each built set.
- **Matched flag multisets between A and B**, for both pairs, confirmed identical (the table above). A gain
  reflects learning, not a lighter form.
- **True counterbalance confirmed**: for one learner pre and post are the two different forms; across the
  cohort each form serves as pre for half and post for half.
- **Validators 8/8 clean** this pass.

## The unfair-Secrecy class is absent

The only `secrecy_or_bypass` items are the four in data_conduct (`dca_login_favour`,
`dca_personal_email_push`, `dcb_approve_under_you`, `dcb_skip_dlp`). I read all four bodies: each quotes an
explicit spoken bypass line that the learner can see —
- dca_login_favour: "Keep it simple, don't bother raising a ticket for it."
- dca_personal_email_push: "Don't wait on a ticket for this one, we need it out today."
- dcb_approve_under_you: "No need to log it or ring anyone, I'll sort my login out later."
- dcb_skip_dlp: "don't flag it as sensitive this time".

Each is a FAIR tell (the bypass is in the item the learner reads), so the week's unfair-Secrecy class does not
appear here. general_v2 does not use the tell at all.

## C1 minors

- **P1-m1 (brief/spec reconciliation).** C1 recorded that the review task's topic list for data_conduct named
  E15, while the settled spec and the shipped forms put E15 in general_v2 and E14 in data_conduct, with the
  shipped mapping following the spec. BUILD_LOG confirms this was the task brief's error, not a form defect
  ("shipped follows the spec; my brief was wrong"). No change; noted closed.
- **P1-m2 (light, intended module overlap on core_13 and core_16).** A note, not a defect; unchanged and still
  intended.

## Verdict

**Approve.** The one C1 major (the alternating phish layout) is fixed: the generator now carries the scatter
`PERMUTE` arrays, the phish land at the baseline-shaped disjoint slots {1,4,6,9} / {2,3,7,10}, and the shipped
shells are byte-identical to a fresh generator run. Counterbalance and parity hold on re-check (10 items, 4
phish / 6 genuine, matched flag multisets between A and B for both pairs), the validators pass 8/8, and the
unfair-Secrecy class is absent (the four `secrecy_or_bypass` items each quote a visible bypass line). The two
C1 minors are a brief/spec reconciliation (confirmed a brief error, not a form defect) and a noted intended
overlap. No blocker, major or minor outstanding.

---

### Return (one line each)

- **Counts:** 0 blocker, 0 major, 0 minor. C1's one major (P1-M1 alternating phish) fixed and verified.
- **Fix confirmed:** `gen_checks_v2_shells.py` PERMUTE arrays are now the scatter pair; phish land at
  {1,4,6,9} / {2,3,7,10} on all eight shells; shipped shells byte-identical to a fresh generator run.
- **Parity/counterbalance:** 10 items, 4 phish / 6 genuine, flag multisets identical between forms A and B
  (general_v2 6-flag set, data_conduct 8-flag set), true pre/post counterbalance, validators 8/8 clean.
- **Unfair-Secrecy class:** absent; the four data_conduct `secrecy_or_bypass` items each quote a visible
  spoken bypass line, general_v2 does not use the tell.
- **Verdict:** approve, no outstanding findings.
