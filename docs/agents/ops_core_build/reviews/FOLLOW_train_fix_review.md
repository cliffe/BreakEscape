# Ops follow-up review: train fixes (b53601b64..HEAD)

Verdict: clean

Six train-fix commits plus one rubocop commit. Tests and fixtures only; no app code, server output or access checks changed. Nothing needs Opus.

1. 7ed4698e3 (ops_log_test): the guard now allows `test_ops_*` and `demo_ops_*`. This is the owner's decision. The guard still scans every other scenario for `"logSources"` and still asserts more than 50 files. Not weakened beyond the decision.
2. 062535f71 (fixtures): `core_demo_ops_passwords.json` and `core_demo_ops_recon.json` were captured on today's code. They only guard against later drift. They cannot show these two scenarios were unchanged by the ops core, because they have no pre-ops baseline. Their description text still says "captured before any ops-core edit", which is now inaccurate (cosmetic). Intended and acceptable.
3. efa6e855c (lock-step scanner): the expected list is now `demo_ops_second_step` and `test_ops_lock_step`, compared with `.sort`. The new `assert_raises(ArgumentError)` on a gated lock with no id makes the test cover its "raises" half. This is a stronger guard.
4. 318ff0743 (telltale words): the count changes from 8 to 10. The test still checks the validator lines over each `test_ops_*` scenario, and the count assertion still catches a scenario added or lost.
5. b3d0fd02a: formatting only. The ternary/elsif alignment is unchanged in meaning.
6. cd6087477 (validator_and_graph.json): the one new line is the unopenable-container warning ("Crate has contents but no 'locked' key"). The warning count goes from 3 to 4, and issues from 25 to 26. It comes from the earlier commit d263e6fd5 (B7), so it is intended. The other lines only renumber.

No new faults found. I did not run the tests.
