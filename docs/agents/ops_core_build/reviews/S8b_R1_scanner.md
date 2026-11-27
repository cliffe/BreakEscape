# S8b review, round 1: leak scanner (second review)

Scope: `tools/playtest/lib/helpdesk_leak_rules.rb`, its hooks in `tools/playtest/lib/access_leak_scanner.rb`, and the three
`access_leak_scanner_helpdesk*` test files, at head `08d6d11c1` (after the R1 fixes `dadaca57f..1d8485498` and unit 24,
`f97b70fe7` and `08d6d11c1`). Review only; no code was changed.

How the evidence was made: scratch tests outside the repository
(`/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s8b-r1/scanner2_probe_test.rb`,
`scanner2_small_test.rb`, `scanner2_tags_test.rb`), run as `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <file>`.
Probes F1 and F2 play the real `test_ops_helpdesk` scenario through the real routes (the helpers of
`ops_helpdesk_scenario_test.rb`) and scan the answers the server gave. Probes G1, G2 and the small ones start from
`test/fixtures/files/ops_helpdesk_real_capture_rows.jsonl` and change the rows named.

Counts: 0 blocker, 3 major, 5 minor.

## Findings

### R1-SCANNER1 (major): an honest own-phone approval is reported when another step ended first

`helpdesk_leak_rules.rb:525-537` (`hd_note_own_close`), against `access_leak_scanner.rb:4117-4122`.

The helpdesk file keeps its own record of open own-phone steps (`@hd_own_steps`) and closes it by its own rule. That rule is
wider than the second-step rule beside it. On an answer with `cancelled`, `expired` or `lockedOut` and no PC tag it closes
EVERY own step (`:535`); the second-step rule closes only steps of the kind the route handles (`mfa/verify` closes code
steps, `mfa/prompt` and `mfa/approve` close push steps). The recorder writes no PC tag on these rows, so the tag is always
missing in a real capture. After an expired code step, a push step is still open on the server and in `@mfa_pending`, but
`@hd_own_steps` has lost it, so `hd_own_approval?` (`:549`) refuses the honest approval.

Probe F1, real routes, real scenario, no row edited. The server's own answers:

```
row 1  POST helpdesk/request        200 {"granted":true,"what":"mfa","npcId":"wim","deskId":"it_desk"}
row 2  POST inventory               200 {"success":true}                       (vera_phone, tagged)
row 3  POST helpdesk/request        200 {"granted":true,"what":"mfa","npcId":"vera","deskId":"id_desk"}
row 4  POST login                   200 {... "mfa":"push","pcId":"ops_pc","npcId":"wim","ownPhone":true}
row 5  POST login                   200 {... "mfa":"code","pcId":"vault_pc","npcId":"vera","ownPhone":true}
row 6-9 POST mfa/verify             422 {... "attemptsLeft":4..1,"mfaIncorrect":true}
row 10 POST mfa/verify              422 {... "attemptsLeft":null,"mfaIncorrect":true,"expired":true}
row 11 GET mfa/phone?own=1          200 {"requests":[{"pcId":"ops_pc","host":"OPS01","username":"w.duarte","n":0}]}
row 12 POST mfa/approve?own=1       200 {"success":true,"npcId":"wim",...,"approvedBy":"own_phone"}
```

Scanner: 1 finding, `mfa_session mfa:session:wim line 12 at $`. The run is honest (the server approved it). A player reaches
it by starting Wim's sign-in, then failing Vera's code five times, then approving Wim's.

The same over-closing is in the success branch (`:532`: a pass for an account closes that account's own steps at every PC,
where the second-step rule closes the one PC `mfa_pass_pc` names) and in the `endedPcIds` branch (`:526-528`: the
second-step rule's `mfa_end_pcs` does not touch `@mfa_pending`). Those two were read, not run.

Fix, in `tools/playtest/lib/helpdesk_leak_rules.rb`, `hd_note_own_close`: close exactly what the second-step rule closes on
the same row. For `cancelled`, `expired` or `lockedOut`: only the own steps whose `mfa_kind_at(pc, npc)` is in
`route == 'mfa/verify' ? %w[code] : MFA_PUSH_KINDS` (and the tagged PC when there is a tag). For a pass: only the PC that
`mfa_pass_pc(body, minfo, @hd_row)` returns, and nothing when it returns nil. For `endedPcIds`: read what the server does
with a pending step at an ended PC and make the two records agree. Add F1 as a test in
`access_leak_scanner_helpdesk_r1_test.rb` (clean), together with the test for R1-SCANNER2, in the same commit: fixing this
alone does not close SCANNER2, and fixing SCANNER2 alone does not clear this.

### R1-SCANNER2 (major): after any expiry row, the owner's approval for a re-enrolled account scans clean (R1-L3 is not fully closed)

`helpdesk_leak_rules.rb:518`. The rule that the first review's R1-L3 asked for ("a pass for a re-enrolled account other than
`approvedBy: own_phone` is a finding") is asked only while `@hd_own_steps` holds a step for the account. The over-closing in
R1-SCANNER1 empties that record while the step stays open in `@mfa_pending`, and the older rule then accepts an owner's
approval (`access_leak_scanner.rb:4061`) or a held-phone approval (`:4062`, first clause). The server never gives either
for a re-enrolled account.

Probe G1: the real capture, and the scenario with ONE field edited (`wim.habits.approvesPrompts = "pestered"`; in the
shipped test scenario Wim's habit is `never`, so the older rule refuses his owner approval for a different reason, and he
has no authored phone). Row 23 (the own approval) replaced by `POST mfa/prompt` 200 with the same body and
`approvedBy: "owner"`:

- control (that change alone): 1 finding, `helpdesk_secret helpdesk:own:pass line 23`;
- gap (one row put before it: `POST mfa/verify` 422 `{"success":false,"message":"Incorrect username or password","mfaIncorrect":true,"expired":true}`,
  the shape of F1 row 10 without `attemptsLeft`): **0 findings**;
- the unchanged real capture with the edited scenario: 0 findings.

Fix, in `tools/playtest/lib/helpdesk_leak_rules.rb`, `hd_judge_own_step`: replace the condition
`@hd_own_steps.value?(body['npcId'])` at `:518` with `hd_reenrolled?(body['npcId'])`. Re-enrolment is permanent on the
server, so the rule needs no open-step record: a 200 success on `mfa/prompt`, or on `mfa/approve` with `approvedBy` other
than `own_phone`, for an account a credited grant re-enrolled is always a finding. Add G1 (gap rows) as a test that reports.
The existing test "R1-L3: a pass for an account with no open own-phone step is judged by the older rules alone"
(`access_leak_scanner_helpdesk_r1_test.rb:128`) has no grant in it, so it stays true.

### R1-SCANNER3 (major, narrow precondition): the session rules stay switched off for a scenario whose only second step is one a re-enrolment creates

`access_leak_scanner.rb:3571` and `:3654`; `helpdesk_leak_rules.rb:121` (called at `access_leak_scanner.rb:515`, after
`mfa_begin_scan` at `:514`).

The new clause in `mfa_kind_at` makes a code PC owe a step to a re-enrolled account that has no authored device. But
`@mfa_active` is worked out once, in `mfa_begin_scan`, before any grant (and before `helpdesk_begin_scan` has even made
`@hd_mfa_earned`). If no PC owes any account a step at that moment, `@mfa_active` is false for the whole scan and
`mfa_judge_sessions` never runs (`:3596`), so the step the hook adds is never enforced.

Probe G2: the real scenario with `vera_device` removed and the `mfa` key removed from policy `ops` (so `vault_pc`, kind
`code`, is the only second-step PC and no account has a device). Rows from the real capture: the `vera_phone` hand-over,
Vera's `granted` `mfa` answer (`id_desk`), then `POST login` 200 at `vault_pc` with a plain session body for Vera (no step),
then her desktop showing that session:

- edited scenario: **0 findings**;
- control, the unedited scenario, same four rows: 2 findings (`mfa_session mfa:session:vera` at the sign-in and at
  `$.session`);
- the honest run in the edited scenario (grant, `ownPhone` sign-in, own device, verify pass): 0 findings.

`test_ops_helpdesk` and the shipped scenarios do not meet the precondition. It is the exact case the hook was added for
(first review, R1-L5 b), so the hook should hold in it.

Fix, in `tools/playtest/lib/helpdesk_leak_rules.rb`, at the end of `helpdesk_begin_scan`: turn the session rules on when a
re-enrolment could create a step, for example
`@mfa_active ||= @hd_mfa_reset_possible && @priv_pcs.any? { |_, pc| BreakEscape::MfaModel.kind(BreakEscape::CredentialModel.policy_for(@data, pc)) == 'code' && @hd_accounts.any? { |_, npc| BreakEscape::MfaModel.enrolled?(npc) && BreakEscape::CredentialModel.pc_admits_account?(pc, npc) } }`.
This only makes more rules run, is false for every scenario with no desk that resets `mfa`, and before the grant every PC
still owes nothing (`mfa_kind_at` answers `none`). Add G2's three cases as tests.

### R1-SCANNER4 (minor): a recovery answer one level below its question id is not caught

`helpdesk_leak_rules.rb:213`, `:236-244`. Small probes on the real capture, each put in the `service_desk` room answer:
`{"staff_no": {"value": "40517"}}`: 0 findings; `{"staff_no": [{"v": "40517"}]}`: 0 findings. Header limit (5) says only
"split across two keys or two arrays", which does not plainly cover these. Fix, in `hd_walk_keys`: under a key that is a
question id, judge every string anywhere in the value (hash or array, any depth) against that id's answers; or name these
two forms in limit (5).

### R1-SCANNER5 (minor): the old phone's list for a re-enrolled account passes when the query has a second parameter

`helpdesk_leak_rules.rb:575` uses `mfa_query_value`, which answers nil for two parameters. Probe: after Vera's re-enrolment,
`GET mfa/phone?npc_id=vera&x=1` 200 `{"requests":[{...}]}`: 0 findings; control `?npc_id=vera` 200 `{"requests":[]}`:
`helpdesk:old:phone`. The same holds for `mfa/device?item_id=…&x=1` only as far as the helpdesk rule goes (the older
`mfa:key:code` still reports there). Fix: in `hd_judge_old_forms` read the owner with a lookup that tolerates other
parameters (as `hd_query_names?` does), since this rule only reports.

### R1-SCANNER6 (minor): a test name claims more than the test checks

`access_leak_scanner_helpdesk_r1_test.rb:134-140`, "R1-L4: the honest own-phone approval is clean and holds the session".
The "holds the session" half scans a desktop row whose body is `{ "contents": [] }`. `mfa_judge_desktop_session`
(`access_leak_scanner.rb:3853-3854`) returns at once when the body has no `session`, so the assertion passes whether or
not the session is held. Fix: give that row the `session` hash for `cal` (`via: "password"`), as a real desktop answer
carries. (The real capture does prove the hold: its last bootstrap lists Wim's session at `ops_pc` and scans clean.)

### R1-SCANNER7 (minor): the header's count of touched places is wrong

`helpdesk_leak_rules.rb:48-50` says "touched in six places" and lists seven; lines `:7-9` still say "a handful of one-line
hooks" and list five. The diff of `access_leak_scanner.rb` against the merge base is seven changed lines (five added, two
existing rules given a clause). The S8c merge note should give the true list once. Fix: correct both passages.

### R1-SCANNER8 (minor): a reset password used as a hash KEY is not seen

`helpdesk_leak_rules.rb:418` walks with `each_string`, which yields values only. Probe: `{"Cobalt-Fenwick-58": true}` in a
room answer before the grant: 0 findings. The older password rules share this (same walker), so it is a limit of the
scanner as a whole; state it in the header's limits, or walk keys too in `hd_judge_passwords`.

## The first review's findings

- R1-L1 closed by order, not by rule: beats moved, the capture follows, the "stop first" test pins that the rule still
  reports. See "for the owner" 1.
- R1-L2, R1-L6 closed: every own form asks `hd_account_earned?` for the account the grant NAMED; tampers 2, 4, 8 and the
  P2, P4, P4b tests report.
- R1-L3 closed only while the helpdesk file's own step record is right: reopened as R1-SCANNER2.
- R1-L4 closed (hook clause; `own=1` now required, tampers 9 and 10), with the false alarm in R1-SCANNER1.
- R1-L5 (a) closed; (b) closed except R1-SCANNER3.
- R1-L7, R1-L8, R1-L9, R1-L11, R1-L12 closed (their tests pass and were read against the code). R1-L10 closed for the
  one-parameter query (R1-SCANNER5). R1-L13: see R1-SCANNER7.

## Checked and found sound

- **Grant echo.** One credited grant excuses only the account it names: own forms for a second account, a grant naming a
  desk that does not cover the reset, a callback grant with the phone taken later or never, a password another account
  owns, a missing echo: all reported (the 17 tampers, re-run). A repeat grant row is judged on its own each time. Credit
  for a second-step grant is kept for the rest of the scan, which matches the server (re-enrolment is never undone).
- **Own-phone approve rule.** Needs `approvedBy: own_phone`, the query exactly `own=1`, the open step, the list and the
  named grant. The list record is never cleared, so a second approval at the same PC needs no new list (probe: 0
  findings); the server does not require a list either, so nothing unearned passes.
- **The two hook clauses.** For an account no credited grant named, `hd_reenrolled?` and `hd_own_approval?` are both false,
  so `mfa_kind_at` and the approve branch give exactly their S8a answers.
- **Array recovery rule.** The five forms in tamper 16 and 17 report; ids alone, labels and a non-answer under an id are
  clean.
- **Recorder.** `response-capture.js` keeps `query`, no request body and no PC tag. The real capture carries `login` tags
  the recorder does not write; with every `login` tag removed it still reports 0 (`scanner2_tags_test.rb`), so the clean
  result does not lean on the planned recorder change.
- **Older real-capture tests and inertness.** `bin/rails test test/unit/access_leak_scanner*.rb
  test/controllers/break_escape/access_leak_scanner*_test.rb`: 447 runs, 4629 assertions, 0 failures, 0 errors (seed 6191).
  The S5a, S7 and S8a real-capture files pass unchanged. `scan_helpdesk` returns the same body object when the scenario has
  no desk, reset password or recovery (`:153`).
- **`AssociationTypeMismatch`.** Not seen: the `*_real_test` files alone, seeds 48617 (the first reviewer's failing seed)
  and 11: 123 runs, 0 errors each; nor in the full run above.
- **The three stated limits** are as stated: the stop rule (below), code values never checked, and a recovery answer split
  across places (with R1-SCANNER4 as the unstated part).

## For the owner

1. **The stop rule cannot be made order-free with what the recorder keeps.** A refusal row is `{reason, triesLeft}` or
   `{reason, retryIn}` on a path with no query; nothing in it or beside it names the desk or the username. Two ways to give
   the scanner the missing fact, both leaving every answer for an unknown username identical to one for a real account:
   (a) no answer changes: the client sends `desk_id` and `username` in the URL query of `POST helpdesk/request`, as it
   now sends `own=1`. Rails lets the query beat the body, so the query is what the server judged, and the scanner can hold
   a stop against `desk|normalised username` and credit a grant whose `deskId` and account differ. Cost: a typed username
   in URLs and server logs.
   (b) one opaque key on `refused` with `triesLeft: 0`, on `blocked` and on `granted`: for example `ref`, the first 12 hex
   digits of an HMAC of `HelpdeskModel.tries_key(desk_id, username)` under a per-game secret. It is computed from the
   typed text alone, so an unknown name gets one of the same shape; it is not a count and cannot be reversed. Cost: it
   breaks the brief's "a refusal carries nothing else".
   Until one is chosen, refusals must stay last in every scripted run.
2. **R1-SCANNER3's fix sets `@mfa_active` from the helpdesk file.** It is a write to a second-step rule's state from S8b's
   file (in the stricter direction). Say whether that is acceptable or whether the line belongs in `mfa_begin_scan`.
