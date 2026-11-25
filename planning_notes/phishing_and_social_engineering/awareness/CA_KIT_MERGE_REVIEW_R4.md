# CA kit merge review, round 4 (delta of fce115962, stored key ledger)

Read-only. Probe scripts are in the session scratchpad (p1-p4.py, w/), run against copies; scenarios/ and office_kits/ untouched.

Counts: Blocker 0, Major 1, minor 2.

## R3 findings: all closed
M1, M2, m1-m4 re-run on ca02_cv_lures, ca05_signin_pages_defend and kit NPC kit_chidi_okeke (apply_kit and kit_text agree): two siblings edited after a mid insert keep their contents (host and NPC); drop one plus add one on the same event raises "key renamed or removed"; content collision keeps keys at their indexes; eventPattern edit and global rename are in place; hand mapping reading a kit global untouched. Byte identity: `--kit` over all 42 shells, 0 diffs, no kit_ledger.json written.

## Outdir ledger choice: acceptable
Probe (p2.py): kit appends a mapping, copy only the shell, repo ledger stale. Next run: KitMergeError "ledger holds 11 entries but the shell's list holds 12", names --rebuild-ledger. Ledger-only copy is loud too. Tail drop plus add stays an error (index 10 would change). A length change cannot go silent.

## Major
### M1. A same-length drift between shell and ledger is not detected
office_kit.py `_ledger_keys` (about :1048-1062) checks only length and duplicates. Probe p3.py on ca02 with the real ledger:
- swap a hand record (idx 0) with a kit record (idx 2): hand record overwritten, the kit record kept as a hand duplicate. No error, no warning, in apply_kit and kit_text.
- ledger null where the kit expects `caught`: a second `caught` appended, the old one kept as hand (it fires twice).
- two kit records swapped in the shell, or two ledger entries swapped: silently rewritten by key (idx 3, 4).
Cause is a hand edit or stale ledger that keeps the length. Fix: store a per-record fingerprint (hash of the record as last written) in the ledger and verify before merging; mismatch means KitMergeError naming --rebuild-ledger.

## minor
- m1. apply_training_room.py:683-686: kit_ledger.json is written only when changed and never removed, so a reused outdir keeps an old one that can be copied over a good ledger. Delete or overwrite it each run.
- m2. gen_core00/gen_e3_e5 (and e1, e2_e4, e6_e7, e8_e17) call apply_kit with no ledger, but only on a fresh shell into an outdir and they refuse hand-authored rows, so they cannot misassign. Order equals kit order for all 42 ledgers now (p4.py). After a --kit append it would not, so copying a regenerated shell over a shipped one gives M1 (same length, reordered).

## Tests
test_office_kit 154 OK, caught_verdicts 7 OK, test_apply_training_room 12 OK, test_proof5 3 OK, test_kit_ledger 17 OK; node (office-kit, quiet-and-stub, fragment-erb-parity, ca05-twin) 90+64+20+4 pass, 0 fail; check_mapping_index_drift main: 3 scenarios, 0 failures.
