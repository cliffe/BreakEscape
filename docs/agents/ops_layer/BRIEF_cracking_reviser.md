# Brief: revise the cracking plan (S7, A21)

Break Escape is an educational Cyber Security game (a Rails engine with a Phaser client) used in
university teaching. This task is game design: a planning document for an abstract, simulated
"crack a stored hash" puzzle. No real tool, command, algorithm parameter or attack procedure goes
in the plan; the game simulates the idea. Do not open SecGen XML or any exploit-detail field guide.

Work only in the worktree
`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/ops-plan`
(absolute paths). Do not commit.

## Read first

1. `docs/agents/OPS_LAYER_BRIEF.md` (all of it; section 5 is the shared contract, section 7 the
   plan template).
2. `docs/achitechture/OPS_CRACKING_PLAN.md` (the plan, 357 lines, first draft).
3. `docs/agents/ops_layer/reviews/OPS_CRACKING_R1.md` (its first review: act on every blocker,
   major and minor, or record why not).
4. `docs/agents/ops_layer/reviews/CROSS_PLAN_R2.md` section 3 (its conflicts with the other plans).
5. `docs/agents/ops_layer/USER_PICKS_2026-11-19.md` (the user's rulings).
6. Where the plan touches them, the sibling plans' relevant sections only (grep, read in ranges
   under 200 lines): `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` (cached accounts, S5b),
   `OPS_LOG_ROWS_PLAN.md` (the log helper `write_log_row!` and the secret registry
   `OpsLog.register_secret_source`, `note_issued_secret`), `OPS_CORE_PLAN.md` (keyring use).

## Rulings to apply

- **A collected cached account is always a hash** (SHARED-3). Collecting needs admin on that PC.
  The collected hash offers a crack action from where it is shown. A scenario that does not
  teach cracking does not enable cached credentials. S5b builds after S7.
- **Facts the cracker reads are server-granted** (BLOCK-2, orchestrator's reading of the user's
  words "the server side cracker should only find the password if the right information was
  collected"). The server records a fact only when it sees the event that reveals it (a flag
  reward, a collected item or read document the server already tracks); a fact the browser claims
  is ignored by the cracker. A crack also needs the server-held proof that the hash was collected.
  Say per fact source which existing server-visible event grants it, and what an author must do
  for a fact that today only comes from dialogue.
- Proof renamed `dumped` to `harvested`, in the string form `"harvested": "<pcId>"` (as
  `CredentialModel.proof_kind` and `check_credentials` accept), keyed by the sign-in PC id.
- A hash record whose account has no password habit (an `accountOnly` account such as a shared
  local admin) carries its own crack recipe on the record (the facts or weak-password class
  that crack it). The "account needs a password habit" validator rule applies only to a hash
  record with no recipe. Read the privilege plan's section 14 requests to S7 and answer each.
- Delete the plan's own log row list. Cracking writes no log rows: an offline crack leaves
  nothing on the target (the log rows plan says so at its cracking lines). Collecting the hash is
  the privilege plan's row. Section 13 states this in one short paragraph, with no table.
- Follow brief section 5: own validator file `scripts/validate_cracking.rb` hooked by one line;
  unchanged-scenario fixtures in `test/fixtures/files/ops_unchanged/` through
  `bin/ops-golden-compare` (built in the log rows plan's stage L1a); new routes refuse with
  `{ success: false, reason: "<code>" }` from a closed list.
- Register with the log module (`OpsLog.register_secret_source`) only cracked values stored
  outside the keyring.
- CRACK-1 a: use the reserved hash kind in the keyring. CRACK-3 a: a wrong attempt reports a bare
  count of missing facts. CRACK-4 a: a distinct status after a couple of runs.
- BLOCK-3 a: the mix of time models stays; cracking costs no game minutes.

## How

- Edit tool only, section by section; never shell heredocs, `sed -i` or scripts. Start editing
  within ten tool calls. The plan stays standalone: no mention of reviews, rounds or picks.
- Answered questions leave section 15; anything still open stays there with options and a
  recommendation.
- Record each R1 finding's outcome, one line each, in
  `docs/agents/ops_layer/reviews/OPS_CRACKING_DECISIONS.md` (create it).
- At about 150k tokens, write `docs/agents/ops_layer/HANDOVER_OPS_CRACKING_PLAN_reviser.md`
  (done, open, files touched) and stop.
- Report in at most 12 lines: status, line count, R1 outcomes by severity, questions for the user.
