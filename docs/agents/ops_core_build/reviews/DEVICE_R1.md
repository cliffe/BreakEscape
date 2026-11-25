# Device-in-use (S8b `device_in_use?` wired to S8c): review R1

Branch `ops-follow2` against merge base `9e5d56f70` (main has since moved to `0402ed2be`; the review reads
`git diff main...ops-follow2`). Plan: `DEVICE_PLAN.md` and its reviews R1 and R2 (scratchpad). Commits reviewed:
`481cd527b` (U1), `2c7ef0bb6` (U3), `27759fac3` (U2), `adc123eec` and `54c3257b2` (U4). No code was changed by this review.

## Verdict

**Clean.** There is no blocker and no major finding. The six minors below are about test strength, docs wording and branch
scope. None of them changes what the server serves or what the scanner excuses.

## The rule as built, against the plan and the owner's decisions

- `MfaSignIn#device_in_use?(npc_id)` now calls `live_lock_code_step?(npc_id)`. That is a new private helper in
  `LockSecondStep`, placed after `private`, so the public API stays the same.
- The helper reads `player_state['lockSteps']` directly. It does not call `lock_steps_map`, `tidy_pending!`,
  `mfa_account_for` or `save!`, and it does not read the scenario.
- The helper is true when a record meets all four parts of the plan's live-record rule:
  - `kind == 'code'`;
  - `npcId == npc_id`;
  - `passed != true`;
  - `now - at.to_i <= PENDING_SECONDS`.
- The age test mirrors `tidy_pending!` exactly. Tidy drops a record at `>`, and the helper counts a record as live
  at `<=`. A record with no `at` (`nil.to_i`) never counts as live.
- **Live record.** The owner chose this rule, and the static "any authored code lock" rule was not built. U2 case 2
  would fail under the static rule, because its scenario authors a sam code lock.
- **Shared `used` window.** This is kept, and `MfaAccess` is not edited. U2 case 13 pins it.
- **Inventory scene accepted.** There is no JS change, and the scene uses the same route.
- **Callers.** `grep device_in_use? app lib` finds only the definition and `mfa_sign_in.rb:87`, inside
  `mfa_device_answer`.
- **Other paths that remove a lock record.**
  - The flag-reward object path replaces the record with `{passed: true}`.
  - A door open deletes the record (`lock_step_requests.rb:132`, `:140`).
  - In both cases the device blanks, which is right. Neither path can make the device show more.

## Nothing reveals more than before: probe through the real routes

The probe was a scratch integration test, not committed. It used `HelpdeskReenrolScenario` plus a sam code lock, with
the fob held and time frozen. It covered 8 combinations: re-enrolled (by the desk route) or not, a live lock gate or not,
and a pending PC step (`POST /login` at `sam_pc`, `mfaRequired`) or not. In each, it read
`mfa/device?item_id=sam_fob`, `?item_id=jake_fob` and `?npc_id=sam`.

- **Never re-enrolled.** Every combination gives the same normal device answer (`deviceId, displayName, npcId, code,
  secondsLeft, used`). The own phone answers 403 `no such device`. The answers are the same as before this change.
- **Re-enrolled, no gate, with or without a pending PC step.** `sam_fob` answers `enrolled: false` and carries no `code`.
  So a pending PC step never turns the old device on. The PC login answers `ownPhone: true`.
- **Re-enrolled with a live code gate, with or without a pending PC step.** `sam_fob` answers with exactly the key set of
  the never-re-enrolled answer. Jake's device and the own phone are unchanged.
- The only answer that changed is the one the plan names (section 4). It reuses an existing shape, and it appears only
  after the gate answer has already told the player `kind: code` and `npcId: sam`.
- U2 case 10 shows that the device GET writes nothing. That holds on a game with a gate and on a legacy game with no
  `lockSteps` key.

## Scanner

`hd_live_code_gate?` decides whether a code from a re-enrolled owner's device is excused.

- **It is tied to proof.** It looks up the row's own game (`/games/<id>/`) in `@ls_games`, without calling
  `ls_select_game`, so the ordering trap the plan names is avoided. It needs a gate with `kind == 'code'` and
  `npc == owner`, and the gate must pass `ls_fresh?` against `ls_time(@hd_row)`. That is a `Time`, so the Float/Time
  mix-up cannot happen.
- **It fails closed.** It reports the code in each of these cases:
  - the lock rules are not active;
  - the row has no time, or an unparseable one (`ls_time` rescues the error and returns nil);
  - the row names no game;
  - there is no gate;
  - the gate is stale, already passed, or for push or for jake;
  - the gate belongs to another game, in either direction;
  - after a `codeLocked` answer. This is the stricter side, documented as limit (9) and pinned by a test.
- **Stale state from an earlier scan cannot leak in.** `ls_bind` runs late, inside the first `scan_lock_steps` call.
  Even so, a device row can only be judged after the grant row has passed through `scan_lock_steps` in the same scan.
- **Gates the scanner keeps longer than the server.** A gated door or object opened by a flag reward drops or replaces
  the server record while the scanner keeps the gate. That direction is lenient, but the open itself is already
  reported as "an open with no pass" (`lock_step_content`), and the server then serves `enrolled: false`, so there is
  no code to excuse.
- **The probe with a real inventory take row is clean.** The rows were take, desk grant, device, gate and device. The
  full scan returned `[]`. Without the gate it is also `[]`, because the device answered `enrolled: false`.

## Golden, tests, docs

- **Golden.** `bin/ops-golden-compare` gave 41 runs, 0 failures, run outside flock. No fixture under `test/fixtures` is
  changed, and `lock_step/answers.json` is untouched. No new `SHAPES` entry was added.
- **Rails tests,** run under the tests lock, 617 runs, 0 failures, 0 errors:
  - the new U2 and U3 files;
  - the three gate-less `helpdesk:old:code` tests (r1, r1b, r2);
  - `mfa_sign_in_reenrol`, `helpdesk_reenrol`, every `lock_step_*`, `ops_lock_step_no_exposure`,
    `ops_helpdesk_no_exposure`, `ops_mfa_no_exposure` and `demo_ops_second_step_scenario` (its M12 case passes);
  - every `access_leak_scanner_helpdesk*` and `access_leak_scanner_lock_step*` file.
- **The U2 tests drive the real routes,** with the desk re-enrolment going through `POST /helpdesk/request` in cases 3,
  11, 12 and 14.
  - Each part of the rule is pinned by a case that fails if the part is dropped: kind is case 7, owner is case 8,
    passed is case 4, the `<=` boundary is case 5 (shown at `PENDING`, gone at `+1`), and the drop on the fifth wrong
    code is case 6.
  - Cases 12a and 12b close A10, with `approvedBy` checked against the shared fixture through `lock_shape`. That
    justifies the `PLAYTEST.md` edit for M17.
- **Docs.** `ACCESS_AND_NETWORKS.md` (lines 877, 911 and the S8c known limits), `OPS_LOCK_SECOND_STEP_PLAN.md:843` and
  `PLAYTEST.md:156` match the code. The S8B and S8C build briefs are left alone, as the plan says.

## Findings

### m1 (minor): the real-run scanner test asserts one rule, not "clean"
- The plan (U3) says to assert that the recorded flow is clean. `access_leak_scanner_helpdesk_device_in_use_real_test.rb`
  only asserts that `helpdesk:old:code` is absent.
- The test's rows start with the fob already held and have no take row. A scan of those rows therefore carries other
  findings (`lockstep:key:code`, `mfa:key:code`, `helpdesk:own:unenrolled`). The probe found these same findings
  whenever no take row was recorded, gate or no gate, so they come from the setup, not from this change.
- The probe with a real `POST /inventory` take row scans to `[]`.
- **Fix:** take the fob through the inventory route, record that row with its `inv` metadata, and assert
  `scan_with(rows, scenario)` is empty.

### m2 (minor): the both-test "real rows" case is neither real nor new
- The last test in `access_leak_scanner_helpdesk_lock_step_both_test.rb` builds synthetic rows. Its
  `rows.map { |r| r.merge('t' => r['t']) }` changes nothing, so the test repeats the first two assertions.
- **Fix:** delete it (the `_real_test` file covers the real run), or rename it to say what it checks.

### m3 (minor): the shared `used` window is not in the docs
- The owner chose to keep it (plan, owner question 2), and U2 case 13 pins it. `ACCESS_AND_NETWORKS.md` does not say
  that passing a lock with the old device's code marks the own phone's code as used for that window.
- **Fix:** add one clause after the line 877 sentence: "using it at the lock uses up that minute's code on the own
  phone too".

### m4 (minor): docs wording
- At `:877`, "until that step passes, fails or expires" reads as if a `codeLocked` closure blanks the device. It does
  not. Only the fifth wrong code drops the record.
- At `:911`, "the code wins over the re-enrolment" can be misread next to the paragraph's other phrase, "the code is
  right".
- **Fix:** at `:877`, say "passes, is dropped after five wrong codes, or expires". At `:911`, say "a lock's code is
  always the owner's authored device".

### m5 (minor): comment reflow in `mfa_sign_in.rb:70-74`
- The edited comment breaks as "...still needs it. The only / places a code reaches the browser."
- **Fix:** rewrap the comment.

### m6 (minor): the branch carries unrelated commits
- `77bba9f6a` and `9fdc6de7e` (disk-clean, wt-clean, safe-rm, clean.conf, `AGENTS.md`, `.gitignore`,
  `test/js/disk-clean.test.mjs`) are tooling commits. This review did not cover them.
- **Fix:** land them as their own train item with their own review, or say in the landing note that they were
  reviewed elsewhere.

## Not run

- JS tests were not run. The local `node` lacks `--test`, and nothing under `public/` changed.
- The optional demo browser check and the train were not run (no servers, per the brief).
