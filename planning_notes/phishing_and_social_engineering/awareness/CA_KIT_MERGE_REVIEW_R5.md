# CA kit merge review, round 5 (delta of 51ef334fb, per-record hash in the ledger)

Read-only. Probes ran in the session scratchpad against a copy of the repo (h.py, p1-p5.py); scenarios/ and office_kits/ untouched.

Counts: Blocker 0, Major 0, minor 3.

## R4 M1 and m1: closed
Real ca02_cv_lures, ca05_signin_pages_defend (host) and ca02_cv_lures_defend (kit NPC kit_chidi_okeke):
- hand/kit swap: KitMergeError (hand record holds a stored kit record).
- ledger null where the kit expects `caught`: KitMergeError (hand record equals kit record). Same with the hash kept.
- kit/kit swap in the shell, and whole ledger entry swap: KitMergeError (record no longer matches the ledger).
- NPC list: shell record tampered, ledger hash wrong, ledger null: all KitMergeError.
- stale outdir kit_ledger.json: moved to <repo>/tmp/delete/ before the build, nothing left in outdir after a failed run (rc 1).
- hand record edit (idx 0): allowed. A hand record appended at the tail is a length error (loud).

## Normal kit changes: no false errors
Content edit, eventPattern edit, append, tail drop with --allow-drop, new kit NPC, all OK and a second pass over the output and new ledger is stable. Tail drop without --allow-drop raises WouldDropHandWrittenContent, mid drop, tail rename and mid rename raise KitMergeError (all correct). Bootstrap: infer_shell_ledger on all 42 shells equals the shipped ledger.

## Hash stability
Dict key order independent, unicode escape equal to the literal char, `_kitKey` stripped at any depth. An integral float and int differ (1.0 vs 1); 7 of 48 floats in mappings are integral, so a tool that normalised numbers would raise a loud error. Nothing in the repo does.

## Byte identity
`--kit` over the real repo: 42 shells, 0 diffs, no kit_ledger.json written.

## minor
- m1 (open item a). A swap of the `k` fields only is not detected. Probe on ca02_cv_lures: swap ledger host[3].k and [4].k, hashes kept: OK, and idx 3 (`kit_attack_done`) becomes `kit_defend_done`, idx 4 the reverse. Needs a hand edit of a generated ledger, since each entry is one line so git merges keep `k` and `h` together. Fix: hash the key with the record, `record_hash(rec, k)` (office_kit.py:1024, :1101, :1111, infer_ledger, prepare). Minor.
- m2 (open item b). office_kit.py:1031-1046: an old key-only ledger loads with no `_hashes` and the whole check is skipped (probe: strip `_hashes`, kit/kit swap in the shell passes and is rewritten). One bare-string list among dict lists also drops the check for every list in that ledger (probe b3). Reachable only by restoring a pre-51ef334fb ledger. Fix: in load_ledger raise KitMergeError naming --rebuild-ledger for any non-dict entry. Minor.
- m3. Moving a non-kit-looking hand mapping into the kit data gives a dead end. Probe: append a kit mapping equal to hand idx 0 on ca02_cv_lures: KitMergeError "run --rebuild-ledger", but the rebuilt ledger keeps idx 0 hand, and the next run raises the same error. The error is right (the append would fire twice) but the advice loops. Also the --kit WARNING "a hand edit made in the shell is reverted" is now unreachable for mapping records, which raise instead. Wording only.

## Tests
test_office_kit 154 OK, caught_verdicts + test_apply_training_room 19 OK, test_proof5 3 OK, test_kit_ledger 25 OK. Node: quiet-and-stub 64, fragment-erb-parity 20, office-kit 90, ca05-twin 4, 0 fail. check_mapping_index_drift main: 2 scenarios, 0 failures.
