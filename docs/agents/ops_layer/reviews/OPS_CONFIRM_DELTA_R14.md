# Ops layer plans: confirm delta R14 (R13 and R8 fixes, section 14 rewrite)

Scope: the fixes in `caa6640bd`, `9052beca8`, `332e2f005` (realism skin R13), `780b2cc95`
(cross-plan R8), and the section 14 rewrite in `b304bd2ce`, `338abecf5`, `087c91671`, read against
the current text of the seven plans in `docs/achitechture/`. Plan names are shortened: CORE, PRIV,
LOCK, SKIN, MFA, LOG, CRACK. Line numbers are the current ones. No plan was edited, no SecGen XML
or exploit-detail guide was opened, and no runtime LLM appears in any of the seven plans (grep for
LLM, language model, GPT, OpenAI, Gemini and generative found nothing).

## R13 findings (realism skin)

- **R13 m1 (append-only bypassed by the regenerate step): resolved.** SKIN:440-443 and 461-467: the
  command compares before it writes, an id removed or renamed or a changed form is an error, and
  the index is then not rewritten, so a rerun cannot erase the baseline. The catalog test makes
  the same comparison and asserts the index file is unchanged through the command line (SKIN:1637).
  The `--retire` flag and the base-branch read were not taken; the fix is a different route to the
  same result. See new nit N1.
- **R13 m2 (first segment not enforced): resolved.** SKIN:379 (Catalog row: first segment is one of
  `auxiliary`, `exploit`, `post`), SKIN:448 (index text), SKIN:1331 (validator Error row), SKIN:1637
  (test fragment with `shareserve`).
- **R13 m3 (index stale after a link edit, nobody regenerates): resolved.** SKIN:453-456 (the task
  that adds or changes a link runs the command and commits the index) and SKIN:470-478 ("Who opens
  it": a link author runs `scripts/validate_realism_catalog.rb` and commits the index, no catalog
  text in its output).
- **R13 m4 (same-file duplicate id, loader cannot see it): resolved.** SKIN:366-369 (the validator
  alone catches it), SKIN:1330 (row says so), SKIN:1831-1833 and CORE:1583 (three faulty folders:
  cross-file id, shared `module`, unparseable file). CORE:579-585 lists the loader's faults the same
  way.
- **R13 m5 (catalog error blocks every linked scenario with an error the fixer cannot clear):
  resolved.** SKIN:1300-1306: the error names the catalog file, says "catalog task: fix the
  catalog", tells scenario fixers to leave it, and states that an index mismatch or an append-only
  fault is a test failure only and not blocking.
- **R13 n1 (ids not checked against telltale and product lists): resolved.** SKIN:1339 (telltale
  row reads ids) and the product-names row beside it (id, `title`, `output`, with `_` counting as a
  word break).
- **R13 n2 (index scan exemption): resolved.** SKIN:451-452 and the separation-test row (index
  scanned as a scenario file, zero hits, `docs/...` paths pass the `public/` check).
- **R13 n3 (stale "changed from" clause in request 3): resolved.** SKIN:1822-1833 (request 3 now
  states the fail-closed loader as the contract, with "taken by the core"); CORE:579-589 carries
  the new text.

## R8 findings (cross-plan)

- **R8 m1 (G4 id-less warning misses the `ceo_exfil` carrier): resolved.** LOCK:930-935 (warning
  covers an NPC `itemsHeld` entry, a start item, a granted item and a `takeable` room object; the
  tablet is named as a `takeable` room object in `reception`); LOCK:1050-1051 (spec adds the room
  object). LOCK:764 gives the same four homes.
- **R8 m2 (SKIN request 3 stale): resolved.** SKIN:1822-1833: marked "taken by the core", the two
  "changed from" sentences are gone, and the loader text agrees with CORE:579-589.
- **R8 m3 (CRACK `crackSeconds` rule ignores the NPC grade): resolved.** CRACK:662-665 now reads
  `CrackDifficulty.resolve` with the record's `crack.difficulty`, else the NPC
  `passwordDifficulty`, else none, which matches CRACK:350 and the test beside it.
- **R8 n1 (CRACK request 4 status and pointer): resolved.** The old "requests" block was removed in
  the section 14 rewrite; CRACK:955-958 lists the habit parameter as item 4 of the privilege plan's
  rules with no stale section number or line range. No `L280-296` remains in any plan.
- **R8 n2 ("band warning above"): resolved.** CRACK:672 says "below".
- **R8 n3 (CRACK overview names only the record grade): resolved.** CRACK:53-54 adds the NPC's
  `passwordDifficulty` and "the record's grade wins".
- **R8 n4 (SKIN `test_ops_skin` defaults beside "every finding linked"): resolved.** SKIN:1659-1660:
  those hosts keep default service and address output and hold no findings.

## Section 14 against the fixes

- **No contradiction with R13 or R8.** SKIN 14 (1794-1892) item 3 restates the fail-closed loader
  and item 5 the 9.1 summary exactly as CORE:579-589 and CORE 9.1 hold them. CORE 14 item 6
  (CORE:2044-2073) says the loader is the core's at S2 and the link id is never sent, which agrees
  with SKIN:361 and 499-508. CRACK 14 keeps `crackSeconds` and `passwordDifficulty` text that
  matches CRACK:662 and PRIV:285. LOCK 14 does not restate the G4 warning, so nothing there can
  disagree with LOCK:930.
- **"Relies on" items name something the other plan provides.** Checked by section and heading:
  CORE 14 items 1 to 5 against PRIV S5a ("the level helper", PRIV:334) and PRIV 14; CORE item 7
  against CRACK section 9; CORE item 8 against LOG 13.5 and 13.7 (LOG:1055, 1124); CRACK 14
  against PRIV sections 4 and 9, CORE sections 6 and 9, LOCK `FORGEABLE_ITEM_FIELDS` (LOCK:808), and
  SKIN:603 (crack scene sits outside the network view); LOCK 14 against MFA 5.2, 6 and 9 (MFA:744
  "The lock subject", MFA:974 test row, MFA:177 `code_device` owner) and LOG L1b and 13.8; MFA 14
  against PRIV sections 1, 3, 5, 7 and 12, CORE 4.1, 4.3 and 5.4, CRACK sections 1 and 11, LOG
  13.2 to 13.7; PRIV 14 against CORE sections 0 and 5.4, CRACK sections 4, 5, 9 and 14, MFA 5 and
  14, LOG 13 and L1a (LOG:504-505, 690-691); LOG 14 against CORE 13, PRIV 13, MFA 13, LOCK 5.1 and
  13, CRACK 13, SKIN 11 and each plan's section 10. Counts agree (twelve network refusal codes,
  two from S7, three collect codes from S5b; eight `mfa_*` events; `save_limit` numbers in CORE 8
  and LOG 3).
- **Order claims agree.** L1a and L1b before S1 (LOG item 2, PRIV 14 last bullet), S5b after S7
  (CRACK 14, PRIV 14), S5a after S3 (PRIV 14, CORE item 1), the S2 loader before the K3 folder
  (CORE:586-588).

## New findings

**Nit**

- **N1. SKIN:461-467 and 1339, an id added in error can never leave the index.** Append-only plus
  the new id-level telltale and product checks mean an id that is wrong (it holds a banned word, or
  was committed by mistake before any scenario linked it) cannot be renamed or removed, and the
  comparison would block the fix. Fix: one sentence allowing a review-approved removal of an id
  that no scenario links and that is not yet on `main`, with the comparison reading the base
  branch's index (`git show origin/main:docs/REALISM_CATALOG_INDEX.md`) as R13 m1 suggested.
- **N2. LOCK:1308, heading quoted wrongly.** It cites CRACK section 14 as "Second-step and lock
  plans"; the CRACK heading is "Second-step and lock plan" (CRACK:971). Fix: drop the final "s".
- **N3. CORE:2044, skin sections cited without 4.3.** Item 6 names skin sections "4.2, 5.2, 5.3 and
  9" but also depends on the catalog and `realism` link in SKIN 4.3 (loader contract). Fix: add
  "4.3".

No blocker, major or minor findings.

Counts: 0/0/0/3

Verdict: settled
