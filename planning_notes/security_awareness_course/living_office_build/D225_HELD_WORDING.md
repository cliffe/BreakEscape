# D225 held wording: the legal-duty clauses removed from layer 1

> **APPLIED under D225 A, 2026-11-20.** The owner chose option A: accurate, plain UK GDPR
> duty wording in ca02, ca03, ca05, ca08 and ca11 only. Each duty line below was restored
> in place of its neutral replacement and framed for the UK ("Under UK GDPR, ..." / "In the
> UK, ..."), with "without delay" corrected to "without undue delay" for accuracy against
> UK GDPR Arts 33 and 34. The two older mentions (ca11's "wrote to the regulator" and the
> ca17 twin's DPA 2018 s.170 citation) were framed for the UK in the same pass. A UK-scope
> caveat is still to be added to the Hacktivity course description (owner's yes needed).
> The conceptPanel and mistake texts are read, not voiced, so no re-voicing is involved.
> See the subagent handback for the full before/after table.


W2 build review R1 M5 (the O1/D225 hold). The owner has not ruled on whether a legal
duty of report may be asserted in learner copy, so the ICO / regulator duty clauses were
stripped from the five fragments and ten shells before merge, per D5 (keep the wording
here, out of the learner copy). This file holds every removed clause word for word, with
the file it came from and the plain line that replaced it. Restore from here if D225 later
allows the duty wording.

Episode texts that carry the same point in two places (a fragment's layer 1 and the full
shell's hand-authored `conceptPanel`) are grouped. Line numbers are the pre-edit positions
and shift as the files change; the clause text is the stable anchor.

## e2 / ca02 (CV lures)

- `planning_notes/phishing_and_social_engineering/awareness/e2/defend.json` (layer 1, ~line 620)
- `scenarios/ca02_cv_lures/scenario.json.erb` (`conceptPanel.text`, cost paragraph)
- `scenarios/ca02_cv_lures_defend/scenario.json.erb` (twin, carried from the fragment)

Removed, verbatim:

> Because CVs are personal data, the organisation assesses the breach without delay and, where it has to report, tells the ICO within 72 hours; candidates are told where the risk to them is high.

Replaced with:

> Because CVs are personal data, a breach like this gets reported so the organisation can act, and the candidates affected are told.

## e3 / ca03 (helpdesk reset)

- `planning_notes/phishing_and_social_engineering/awareness/e3/defend.json` (layer 1)
- `scenarios/ca03_helpdesk_reset/scenario.json.erb` (`conceptPanel.text`, cost paragraph)
- `scenarios/ca03_helpdesk_reset_defend/scenario.json.erb` (twin)

Removed, verbatim:

> An insurer's accounts hold health and other special-category data, so the organisation assesses the breach without delay and, where it has to report, tells the ICO within 72 hours; claimants are told where the risk to them is high.

Replaced with:

> Because the account holds health and other special-category data, a breach like this gets reported so the organisation can act, and the people affected are told.

## e5 / ca05 (sign-in pages)

- `planning_notes/phishing_and_social_engineering/awareness/e5/defend.json` (layer 1)
- `scenarios/ca05_signin_pages/scenario.json.erb` (`conceptPanel.text`, cost paragraph)
- `scenarios/ca05_signin_pages_defend/scenario.json.erb` (twin)

Removed, verbatim:

> A claims account holds health and other special-category data, so the organisation assesses the breach without delay and, where it has to report, tells the ICO within 72 hours; claimants are told where the risk to them is high.

Replaced with:

> Because the account holds health and other special-category data, a breach like this gets reported so the organisation can act, and the people affected are told.

## e8 / ca08 (after the click)

- `planning_notes/phishing_and_social_engineering/awareness/e8/defend.json` (third `conceptPanel` array entry, "The minutes that matter")

Removed, verbatim:

> because client and claimant details sit there, the breach is assessed without delay and, where it must be reported, the ICO is told within 72 hours, with the people affected told where the risk to them is high.

Replaced with:

> because client and claimant details sit there, a breach like this gets reported so the organisation can act, and the people affected are told.

- `scenarios/ca08_after_the_click/scenario.json.erb` (third `conceptPanel` entry) and `scenarios/ca08_after_the_click_defend/scenario.json.erb` (twin)

Removed, verbatim:

> Because client and claimant details sit in that mailbox and on that drive, the organisation assesses the breach without delay and, where it must report, tells the ICO within 72 hours, with the people affected told where the risk to them is high.

Replaced with:

> Because client and claimant details sit there, a breach like this gets reported so the organisation can act, and the people affected are told.

## e11 / ca11 (misdirected data)

- `planning_notes/phishing_and_social_engineering/awareness/e11/defend.json` (layer 1)

Removed, verbatim:

> a breach like this is reported to the regulator unless it is unlikely to be a risk, and the people affected are told only where the risk to them is high.

Replaced with:

> a breach like this gets reported so the organisation can act, and the people affected are told.

- `scenarios/ca11_misdirected_data/scenario.json.erb` (`conceptPanel.text`, cost paragraph) and `scenarios/ca11_misdirected_data_defend/scenario.json.erb` (twin)

Removed, verbatim:

> A breach like this must be reported to the regulator unless it is unlikely to be a risk, and the people affected are told only where the risk to them is high.

Replaced with:

> A breach like this gets reported so the organisation can act, and the people affected are told.
