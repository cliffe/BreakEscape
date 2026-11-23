# Handover S5a unit 16: the leak scanner's privilege rules and `verify-run.rb` levels

Done. Files: `tools/playtest/lib/access_leak_scanner.rb` (header block, `collect_privilege`, `note_privilege_signin`, `note_privilege_read`, `scan_privilege_keys`, `scan_privilege_log_rows`, the profile check in `scan_login_content`, owner fallbacks in `ops_session_owner`), `tools/playtest/verify-run.rb` (`computed_level`), `test/controllers/break_escape/access_leak_scanner_privilege_real_test.rb` (10), `test/models/break_escape/privilege_verify_run_test.rb` (4).

## The new rules (all run only in a scenario with a `creds.admin` account or an admin session grant)
1. `access: admin` is earned per PC a second way: a successful POST /login answer (typed or keyring, not a relay) for a `creds.admin` account at a PC that admits it earns `admin:<pc>`. The PC comes from the recorder's `login` tag (`row['login']['pcId']`), else the answer's `host` label, else the one PC that admits the account, else the caller's `ops_steps: ["admin:<pc>"]`; none of these: nothing earned (fail closed). A later sign-in at the PC takes the step back.
2. The sign-in answer and a keyboard desktop answer (`GET /container/<pc id>`, no host label) are judged against their own PC, so `ops:key:access` is reported there too; a host label that names no PC still fails closed. Mirror entries and host rows keep the existing per-PC owner (map key or row id).
3. `ops:key:admin` (rule `ops_string`): the key `admin` in any NPC record or any `creds` object, anywhere in an answer.
4. `profile_admin_read`: an account profile's item in a `GET /container` answer unless the session the run put at that PC is of an account the profile's `for` admits, or `admin:<pc>` is earned at a PC whose owner the profile admits (a folder answer names no PC: any such PC will do).
5. `log:admin_read:<pc id>` (rule `log_row`): an ADMIN_READ row in a /log_rows answer needs one earned admin read of a profile at the PC its `where` names (earned by a 200 folder-of-profile answer under an admin session with no admitted own session), one per row. The browser row says only "profile: profile" (the raw id is shown as its kind word), so the profile cannot be matched, only the PC.

`verify-run.rb --access`: each session line ends `, level admin|user|none` after the parenthesis (the stored `access` stays inside it, so older tests pass); `none` also on any error.

## Run the checks
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test test/unit/access_leak_scanner*_test.rb test/controllers/break_escape/access_leak_scanner*_test.rb test/models/break_escape/privilege_verify_run_test.rb test/models/break_escape/ops_*_verify_run_test.rb` (297 runs, 0 failures); then `bin/ops-golden-compare`. A browser run: `access-leak-check.rb <game_id> <capture files oldest first>`; the recorder does not tag sign-ins yet, so an untagged keyboard sign-in at a PC two accounts-admitting PCs share earns nothing: name it with `ops_steps`.

## Mutation proof (each rule removed once, its tests failed, restored)
Earn line (4 tests failed), admin key in NPC (1), admin key in creds (1), profile check (2), ADMIN_READ count (2), admin-read earn (3), login owner (2), keyboard desktop owner (3), verify-run level text (4).

## Findings (not fixed)
1. **Scenario clash (unit 15):** the card registry key `stale_build_notes` contains the finding's id part `stale_build`, so the S2 rule reports the lobby room answer's card item (`ops:finding:store_pc.records.stale_build`). The real test renames the key to `stale_notes` in its copy (one gsub, stated in the file). Fix in the scenario: rename the key or the finding id part.
2. The scenario has no log reader object, so `GET /log_rows` cannot be called on it; the test judges `log_rows_for_client` output in the route's answer shape.
3. No engine leak found: no answer in the recorded run carries an admin level, profile item, `admin` key or ADMIN_READ row the run had not earned.

## Known limits
Session ends are tracked only by a newer sign-in or technique grant at the PC (a lock, expiry, outage or sign-out leaves the earned step: lenient). Claim and relay sessions are not tracked as accounts, so a profile read under a claim in a privilege scenario reports (fail closed). A reload bootstrap does not re-earn: give every capture file. The admin-read rule credits every PC with an earned admin step whose owner the profile admits.
