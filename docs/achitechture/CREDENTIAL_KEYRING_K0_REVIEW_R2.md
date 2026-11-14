# Credential keyring K0 (server half) — code review, round 2

Branch `build/keyring-k0` at `e4dc65764`, worktree `.claude/worktrees/p-k0`.
Scope: `app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/network_access.rb`,
`scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `README_scenario_design.md`,
`test/controllers/break_escape/network_remote_tiles_test.rb`, `test/js/validator-access-model.test.mjs`.
Plan: `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` section 5. Round 1: `CREDENTIAL_KEYRING_K0_REVIEW_R1.md`.
Client half (`utils/remote-host-text.js`, `systems/network-links.js`, uncommitted) excluded.

Counts: **B 0, M 2, m 1.**

## R1 fixes confirmed

- **B1** — `check_access_model` no longer uses `.presence`; the policy name is resolved with
  `p.is_a?(String) && !p.empty? ? p : defaultPolicy` (`validate_scenario.rb:6919-6924`). The mjs regression
  suite (`validator-access-model.test.mjs`, case that shells out and asserts ruby exits 0) now passes, so the
  crash that silently suppressed every access-model message is gone.
- **m1** — the info line is gated on `under.any?` (`:6940`); an unused `remoteScreen: "tiles"` policy draws
  nothing.
- **m2** — `next` after the blocked-policy warning (`:6934`); a `remote: "blocked"` policy gets the warning
  only, never warning plus info line.
- **m3/m4** — `network_remote_tiles_test.rb` adds the held-but-off-network case (`:54`, workshop foothold
  reaches `bench_pc`, 403s `sam_pc`) and the structured-`foothold[]` case (`:70`, coerced to a string, 403,
  never a 500 or the keyboard answer).
- **m5** — left alone and recorded, as agreed.

The request path is otherwise unchanged from R1's assessment: read-only (no `player_state` write, no `save!`),
reach judged server-side through a held foothold, no password / post-it / capture state in the answer, no-store
header set before the foothold dispatch so the remote 403/422 responses carry it too, and the keyboard answer
byte-unchanged.

## Priority question — off vs not_responding at `login_accounts` with a foothold

**Verdict: the code is correct (`not_responding` is intended); update the test, do not change the code. No new
information leak — `not_responding` reveals strictly less than `off`.**

The established design already splits exactly this way for the desktop path, and the server states the principle
in `network_access.rb:958-961` (`desktop_refusal`): "'not_responding': through a foothold that reaches the host,
whose own service is off. 'off': at the keyboard of a reachable PC that is off (q72). ... The power state is told
only where the PC itself could be reached." Plan 5.1 says a foothold request is "judged by reach through the
foothold, never at the keyboard." K0 applies the same split to `login_accounts`, and `network_remote_tiles_test.rb:88`
deliberately asserts `not_responding` for a service-off host reached over a foothold.

Leak analysis: a remote player cannot see the monitor, so `off` (power state) would be a leak over the network;
`not_responding` ("the host does not answer") is the information-correct remote answer and is already what the
network view shows for that host (`responding: false`). Moving from `off` to `not_responding` leaks *less*, so
K0 moves in the safe direction. The security property the stale assertions guard (no tiles, no password through
a foothold-named request) still holds: an unheld/forged foothold gets 403 reach, a held reaching foothold on an
off host gets 403 `not_responding`; neither yields tiles or the password (`refute_includes ... 'sokafor'` still
passes). Filed below as M1.

## M1 — `network_host_service_off_test.rb:145` encodes the pre-K0 `off` answer (stale test)

`test/controllers/break_escape/network_host_service_off_test.rb:141-146`

The q72 test "off is off at the keyboard too" sends `GET /login_accounts` with `foothold: OFFICE` (a held
foothold that reaches `sam_pc`, planted via `comms_port`) and `foothold: 'anything'`, asserting
`reason == 'off'` for each. It was added by `a9a4484f6` ("Net fixes R3 nit 3: GET /login_accounts refuses an off
PC whatever foothold it names") when the foothold param was inert on this route. K0 gives it meaning: a held
reaching foothold now routes to `remote_login_accounts`, which answers 403 `not_responding`.

Failure scenario (reproduced): the OFFICE iteration asserts `'off'`, gets `'not_responding'`, failing at line 145.
Fix: update the test to expect `not_responding` for the held `OFFICE` foothold and a 403 reach refusal (error
"PC not reachable", no `reason: off`) for the unheld `'anything'` foothold, keeping the `refute_includes ... 'sokafor'`
no-tiles/no-password guard. Code is correct per the verdict above.

## M2 — `npc_habits_postit_test.rb:164` encodes the same pre-K0 behaviour (stale test, NEW)

`test/controllers/break_escape/npc_habits_postit_test.rb:164-170`

Second instance of the same root cause, not covered by K0's own test run (the build-log run exercised only the
`access_model_*` / `network_*` globs, so this one was missed). The test "a request that names a foothold never
gets the note" sends `GET /login_accounts` with `foothold: 'jack_any'` — a foothold the player does not hold —
and asserts `assert_response :success` then no `postitNote`. Pre-K0 the inert foothold param returned the keyboard
screen; under K0 an unheld foothold routes to `remote_login_accounts` and gets 403 "PC not reachable: omar_pc".

Failure scenario (reproduced): line 167 expects 2XX, gets 403. The test's security intent (no post-it, no
`OMAR_PASSWORD` through a foothold-named request) is still honoured, and more strictly, since the request is
refused outright. Fix: update the test to expect the remote branch's 403 reach refusal for an unheld foothold
(still asserting no `postitNote` and `refute_includes ... OMAR_PASSWORD`), or point it at a genuinely held foothold
and assert the remote tiles answer with no post-it. Code is correct; the assertion is stale.

## m1 — stale comment in the keyboard branch says it judges "whatever foothold value it carries"

`app/controllers/break_escape/games_controller.rb:1406-1408`

The keyboard off-branch comment still reads "The route is judged at the keyboard whatever foothold value it
carries (review R3 nit 3)". K0 overrode this: the `params[:foothold].present?` branch at `:1388` intercepts first,
so the keyboard off-branch only runs when no foothold is present. The comment now describes behaviour the code no
longer has (and is the prose counterpart of the two stale tests above). The `note = params[:foothold].present? ? nil : ...`
ternary at `:1412` is likewise dead on the present-foothold side (noted but not filed in R1). Failure scenario: a
future reader trusts the comment and assumes a foothold request reaches the keyboard off-check. Fix: reword the
comment to say the keyboard off-branch applies only to a request with no foothold, and simplify the now-constant
ternary.

## Test results (run in the worktree at e4dc65764)

- `bin/rails test test/controllers test/integration`: **1411 runs, 12842 assertions, 2 failures, 0 errors, 1 skip.**
  The two failures are M1 (`network_host_service_off_test.rb:145`) and M2 (`npc_habits_postit_test.rb:167`), both
  stale assertions over the now-active foothold param; the shipping code is correct.
- `node test/js/validator-access-model.test.mjs`: **41 pass, 0 fail** (B1/m1/m2 regression guards green).

## Verdict

The K0 server branch is sound and the R1 findings are all resolved. The branch leaves the committed suite red
(2 failures), so it does not merge as-is: both failures are one-line test updates to retire the pre-K0
`foothold`-param-is-inert behaviour, plus the m1 comment tidy. No code change to the request path is warranted.
