# Handover: scanner hardening U1a (modes, refusals, the `pc` tag in the privilege rules)

Base commit: `97414316c` (branch `ops-hardening`, after U5). Files: `tools/playtest/lib/access_leak_scanner.rb`,
`test/unit/access_leak_scanner_tags_mode_test.rb` (new), the two `recorder_tags_scanner_{mfa,crack}_test.rb` rewrites.

## API as built (scanner)
- `AccessLeakScanner::PC_TAG_ROUTES`, `CRACK_TAG_ROUTES` (pinned to `response-capture.js` by a test that reads it).
- `AccessLeakScanner.tag_route_kind(row)` (`:pc`, `:hash`, nil), `.tag_route_name(row)`, `.tag_value_ok?(value, id_key)`.
- `AccessLeakScanner.tag_problem(files, mode = :auto)` -> problem string or nil. `files` is `{label => rows}` or `[[label, rows]]`.
  `mode` is `:required`, `:absent` or `:auto`. `.tag_analysis(files, mode)` -> `{problem:, run: :tagged|:untagged|:none}`.
  `hand_tag_problem` was removed at review R1 (R1-m5); use `tag_problem`.
- `scan(lines, ..., tags: :auto)`: raises `ArgumentError` with the problem; also when `signins:` or `logouts:` is non-empty on a tagged run
  (`resumes:` allowed). Sets `@tags_on` (false at construction).
- Readers (private): `row_pc_tag_raw(row)` (the id as written), `row_pc_tag(row)` (only a sign-in PC of the scenario; nil when `@tags_on` is
  false), `row_hash_tag(row)` (nil when off; not validated against records, U2's job), `mfa_row_pc_tag(row)` calls `row_pc_tag`.
- `pc_tag_state(body, row)` -> `[:none, nil] | [:accepted, pc] | [:rejected, nil]` for a 200 PC-route row. Rejected: id not a scenario PC;
  a successful sign-in at a PC that does not admit `npcId`, or whose `host` label maps to another PC; a lock answer whose `pcId` differs.
- `scan_tags(body, row, add)` raises the `ops_tag` finding (owner `tag:<route>`, json path `$`, no value) for a rejected tag on any 200
  PC-route row, whatever rule sets are active. `ops_tag` is in `RULE_TEXT`.
- Privilege rules: `priv_signin_candidates` (accepted -> exact; rejected -> `[admitting, false]`), `priv_logout_pcs(row, body)` (accepted tag
  ends that PC; else every PC), the lock end in `note_privilege_ends` (accepted tag, else answer `pcId`, else every PC).

## Not done here (U1b / later)
- The second-step side of the rejected-tag rule (`mfa_place_signin` still places at any scenario PC the tag names, not only an admitting one;
  `mfa_note_signin` clearing), the tag refutation rule (T6, T6c to T6m, T7), `mfa_required_answer_ok?` mismatch as `ops_tag`, the
  `mfa_verify_lockout_proved?` tag use, `@mfa_placed` on the tag path. A tagged logout aimed at a PC the account was not at is not
  refuted yet (T7).

## Failures for U7 (a hand-set `login` key is now refused, `ArgumentError ... holds a `login` tag`)
All pass under `:auto` otherwise. Failing classes (counts of failing tests): `access_leak_scanner_harvest_test.rb` (13),
`access_leak_scanner_harvest_review_test.rb` (12), `access_leak_scanner_helpdesk_real_test.rb` (20), `access_leak_scanner_mfa_fix_test.rb` (15),
`access_leak_scanner_mfa_real_test.rb` (10). Not failing though they hold `'login' =>` strings: `access_leak_scanner_mfa_r2_test.rb`,
`access_leak_scanner_helpdesk_r1b_test.rb` (they use `hand_tag_problem` or tag no row the scan reaches), the rest are route or method names.
Also failing, not U1a's: `test/unit/access_leak_check_cli_tags_test.rb` (U5) two tests, because its `--resume`/entry examples name `omar`,
which the scenario fixture does not hold, so `parse_priv_*` raises `omar is not an account of this scenario` before the unused-entry message.
