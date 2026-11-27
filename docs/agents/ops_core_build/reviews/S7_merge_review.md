# S7 merge review: `main` into `ops-crack` (commit 491a3a8a9)

Review only. Nothing was fixed. The merge joins S7 (hashes and cracking) with S8a (second sign-in step) and S6 (network view second look, realism catalog), all built from base `07314be8c`.

**Merge is faithful: yes**

**Feature interactions found: one in the client (MR-1, minor). None in the leak scanner. None in the server.**

Findings: 0 blocker, 0 major, 3 minor.

## Findings

### MR-1 (minor) A cracked password's lesson is lost at a PC with a second step

`public/break_escape/js/minigames/password/password-minigame.js:2733`

What is wrong. S7 teaches a line after a typed sign-in with a cracked password (line 2723, `teachAfter('cracked', ...)`). S8a moved the lesson of a first step to the end of the second step through `this.params.mfaTeach`, but it carries only `in_file` (lines 2733 to 2734); any other kind deletes `mfaTeach`. So on a PC that asks for a second step, a player who signs in with a cracked password passes the step and never sees the "A password can be worked out from a hash..." line (`utils/remote-host-text.js:221`). On a PC with no second step the line shows. Neither stage could see this alone: each side's line is right for its own base.

How to see it. Read lines 2719 to 2741: the `result.ok` branch has the `cracked` case, the `mfa_required` branch does not. The three places that teach after the step (lines 3076, 3159, 3204) read only `mfaTeach`.

Smallest fix. In the `mfa_required` branch, add the cracked case before the `else`:
`else if (chosen && Array.isArray(chosen.kinds) && chosen.kinds.includes('cracked')) this.params.mfaTeach = 'cracked';`
and one case in `test/js/mfa-signin-pane.test.mjs`.

### MR-2 (minor) No scenario or test has a hash record and a second-step PC together

`scenarios/test_ops_crack/scenario.json.erb`, `scenarios/test_ops_mfa/scenario.json.erb`

What is wrong. `test_ops_crack` has no second-step policy and `test_ops_mfa` has no hash record, so no test runs a cracked account through a second step, on the server, in the client or in the leak scanner. By reading, the merged code is right (see "Server" and "Leak scanner" below), but nothing pins it.

How to see it. `grep -l '"hash"' scenarios/test_ops_mfa/*` and `grep -l mfa scenarios/test_ops_crack/*` both print nothing.

Smallest fix. One Rails test over a small scenario with both: crack the account, type the cracked password at the step PC, expect `mfaRequired` and no session; pass the step; then scan the answers and expect no finding.

### MR-3 (minor, not caused by the merge) `capture-log.test.mjs` test 2 fails

`test/js/capture-log.test.mjs:200`

What is wrong. "the secret is masked until /capture_secrets answers, after the sync" fails with two `/capture_secrets` requests where one is expected. It failed six times out of six on the merged tree. It fails the same way on the S7 parent, on the `main` parent and on the merge base (each parent's `public/break_escape/js` and the test extracted with `git archive` and run with the same Node), so the merge did not cause it.

How to see it. `PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH node test/js/capture-log.test.mjs 2>&1 | grep '^not ok'`.

Smallest fix. Outside this merge: find which commit before the base added the second ask, then either allow it in the test or remove it.

## 1. Nothing lost

Method. For every file both sides changed (27 files), each parent's added lines against the base were looked up in the merged file, and the merged file was compared with a fresh three-way merge of that one file (`git merge-file`). For the seven files with conflicts, the merged file was also compared as "S7's change set applied on main" and "main's change set applied on S7"; both must match the other parent's own diff.

Result.

- The 20 files without a conflict are byte for byte what git's own merge gives. The builder edited none of them.
- No file outside the both-changed set differs from both parents (no stray edit in the merge commit).
- `app/controllers/break_escape/games_controller.rb`: one conflict, the `before_action :set_game` list. Main's line with the five `mfa_*` actions is kept; `:log_rows, :crack,` follows. Every added line of both sides is present once.
- `tools/playtest/lib/access_leak_scanner.rb`: two conflicts. Row loop: `scan_mfa` then `note_network_swept`. `RULE_TEXT`: main's three entries, then S7's five; only the trailing commas moved (`mfa_session` gained one, `fact_unearned` lost one). Every other added line of both sides is present once.
- `tools/playtest/verify-run.rb`: two conflicts. `rows.concat(mfa_rows(ps, game))` then S7's two `crack` lines; the `if ACCESS_KEYS.any? ...` line carries both terms.
- `test/support/ops_unchanged_cases.rb`: main's file with `.merge(cracking_cases)` and S7's block added after the `mfa_*` block. The set of lines added over main equals S7's own diff exactly, and the reverse.
- `docs/ACCESS_AND_NETWORKS.md`, `README_scenario_design.md`: A21 then A22 in the index table, the section body and the test matrix. One blank line was added between the two sections. Nothing dropped.
- `test/js/playtest-shellx-open-wait.test.mjs`: main's comment and list plus `ops-cracker`; the count is 18 (15 at the base, plus `ops-cracker` from S7, plus `authenticator-live` and `code-device` from main). The test passes against the real tree.

No missing line and no doubled line.

## 2. Files merged without a conflict that both sides changed

Read: `config/routes.rb` (five `mfa/*` routes and `post 'crack'`, all present), `app/policies/break_escape/game_policy.rb` (`crack?` and five `mfa_*?`), `app/models/break_escape/game.rb` (the two sides' hunks are far apart; the S7 state defaults and the S8a sign-in gate are both whole), `lib/break_escape/credential_model.rb` (`hash` is built and does not connect; `saved_connection` keeps main's `password: true`), `lib/break_escape/npc_habits.rb` and `scripts/validate_npc_habits.rb` (S7's `passwordDifficulty` parameter beside main's `mfa_model` require), `scripts/validate_scenario.rb` (separate lines), `scripts/generate_dungeon_graph.rb`, `public/break_escape/js/minigames/index.js` (export, import and `registerScene` for `ops-cracker`, `authenticator-live` and `code-device`: three entries each, none dropped), `public/break_escape/js/minigames/network-view/ops-model.js`, the password minigame (see MR-1), `tools/playtest/access-leak-check.rb`, the three JS tests, the docs.

- `scripts/scenario-schema.json` parses, and a parse that reports repeated keys in one object reports none.
- All merged Ruby files pass `ruby -c`.
- `ruby tools/check_mapping_index_drift.rb <ref>` against the base and each parent: `0 scenarios, 0 failures` (no `scenario.json.erb` was changed by both sides).
- `lib/break_escape/ops_log_events.rb`, `app/models/break_escape/credential_login.rb`, `minigame-starters.js` and `show.html.erb` were changed by main only, so they are main's files unchanged. S7 writes no ops log row from the cracker.

No silent bad merge found.

## 3. Interactions between the features

### Leak scanner: none found

- Order in the row loop does not matter. `note_network_swept` reads only the row and writes `@networks_swept`; `scan_mfa` and its helpers never read or write it. `scan_mfa` uses only its own `@mfa_*` state and the shared read-only `@priv_pcs` and `@priv_npcs`.
- S7 rules on honest S8a answers. `CRACK_NEVER_KEYS`, the `difficulty` rule, the `facts` rule (a `facts` key on a hash with a string `kind`, an `account` object or a `proof`) and the `kind: hash` and `source: cracked` rules match no key of the `mfaRequired` answer, the `mfa/device` answer, a `mfa/phone` request entry or a session answer. `scan_facts` reads strings of every answer, but only against the scenario's own award-fact text and labels.
- S8a rules on honest S7 answers. `MFA_NEVER_KEYS`, `code`, `numbers`, `number` and `mfaRequired` match no key of a `POST /crack` answer, a hash row or a cracked keyring entry. `mfa_note_inventory` needs only `success: true` on the inventory answer, so S7's new top-level `facts` does not disturb it.
- The lockout allowance for `mfa/verify` is tied to that route; `POST /crack` never sends `lockedOut`.
- Main did not change `credential_keyring.rb`, so the exact key lists `CRACK_ROW_KEYS` and `CRACK_ENTRY_KEYS` still match what the server sends.
- No server line main added uses a key S7 flags everywhere, and no server line S7 added uses a key S8a flags everywhere (grep of each side's added lines in `app` and `lib`).
- A sign-in with a cracked password is a typed sign-in (`via: password`), so `mfa_session` asks for the step exactly as the server does.

### Server: none found

A cracked password goes through the same gate as a typed one, because it is a typed one. The cracked keyring entry (`credential_keyring.rb:330`) is only a row that shows the password; the client never posts it as a credential (`mergeRemoteTiles`, `password-minigame.js:417`: "No file line, no fill"). The player types it, `POST /login` reaches `attempt_login!` (`game.rb:3630`), and `mfa_step_for` at line 3663 issues the challenge before any session is written. If a client posted `credential: "<npc>.cracked"`, `provable_connecting_credential` (`credential_login.rb:190`) refuses it: the id does not match `ID_PATTERN` (no dot allowed), it is not in the registry, and the `hash` kind does not connect. Step 8c (`credential_login.rb:85`) covers the kinds that stand in for a password.

### Client: MR-1

A tile tagged Cracked on a second-step PC signs in by typing, shows the second pane, and passes. Only the teaching line is lost (MR-1).

## 4. Runs

RUNS_PLACEHOLDER

## Not covered

- The full Rails suite on the merge (a train is running it in another tree).
- A browser run of a cracked account at a second-step PC (no scenario has both, MR-2).
- The look of the cracker scene under S6's network view skin. The cracker has no stylesheet of its own and main removed no CSS line, so nothing it uses went away.
