# Handover S5a unit 16 (leak scanner privilege rules), updated after the R2 fix pass

Files: `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/access-leak-check.rb` (`--signin`), `tools/playtest/verify-run.rb`, tests `access_leak_scanner_privilege_real_test.rb` (24, including the real browser capture fixtures `test/fixtures/files/ops_privilege_browser_run_{1,2}.jsonl`) and `privilege_verify_run_test.rb`.

## How a sign-in is attributed to a PC
A real capture holds no request body and no PC id on a keyboard sign-in (only a remote one has a `host` label), and the recorder is not edited. Order: a recorder `login` tag if a log has one; the answer's host label (a label that names no PC earns nothing and never guesses); the `--signin` entry for THAT row (`<account>@<pc>#<n>`, the account's n-th successful sign-in answer, or `<account>@<pc>@<row time>`), credited from that row only, for that account only; else the one PC that admits the account; else nothing (fail closed). `ops_steps` can no longer name an admin session (ArgumentError).

## Session ends tracked (R2-C2)
Later sign-in at the PC, `POST /lock_session` (`pcId`), 403 desktop answer, `endedPcIds` on any answer, bootstrap `sessions` map (absent, locked, other account), successful `POST /logout` (every PC; the answer names none). NOT visible to any capture: token expiry and power cut between requests, a hand-back whose answer names no PC.

## Run the checks
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test test/unit/access_leak_scanner*_test.rb test/controllers/break_escape/access_leak_scanner*_test.rb test/models/break_escape/privilege_verify_run_test.rb test/models/break_escape/ops_*_verify_run_test.rb test/controllers/break_escape/ops_privilege*_test.rb` (340 runs, 0 failures); then `bin/ops-golden-compare`. A browser run: see `scenarios/test_ops_privilege/PLAYTEST.md` for the exact `--signin` command.

## Limits
The ADMIN_READ rule credits one earned read per profile and PC (two admin accounts reading one profile at one PC earn one: a false alarm). A reload does not re-earn: give every capture file. The logout takes back every PC's step, so a second still-held admin session elsewhere needs its sign-in to be earned again by a new sign-in.
