# Credential keyring K0 (server half) — code review, round 3

Branch `build/keyring-k0` at `b8eeea5b4`, worktree `.claude/worktrees/p-k0`.
Scope: `app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/network_access.rb`,
`scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `README_scenario_design.md`,
`test/controllers/break_escape/network_remote_tiles_test.rb`,
`test/controllers/break_escape/network_host_service_off_test.rb`,
`test/controllers/break_escape/npc_habits_postit_test.rb`, `test/js/validator-access-model.test.mjs`.
Plan: `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` section 5. Rounds 1/2: the R1 and R2 review files.
Client half (`utils/remote-host-text.js`, `systems/network-links.js`, uncommitted) excluded by instruction.

Counts: **B 0, M 0, m 2.**

## R2 fixes confirmed

- **M1** (`network_host_service_off_test.rb:141-153`): the two inert-foothold `off` iterations are retired.
  The held `OFFICE` foothold reaching the off `sam_pc` now asserts 403 `not_responding` (never the power
  state, never tiles); the unheld `'anything'` foothold asserts 403 "PC not reachable", `refute_equal 'off'`,
  `refute_includes ... 'sokafor'`. The no-foothold keyboard case above still asserts `off`.
- **M2** (`npc_habits_postit_test.rb:164-170`): the unheld `foothold: 'jack_any'` request now asserts 403
  (reach refusal), `assert_no_store`, no `postitNote`, and `refute_includes ... OMAR_PASSWORD`.
- **m1** (`games_controller.rb:1402-1416`): the keyboard off-branch comment now states it runs only for a
  request with no foothold, and the `note` ternary is simplified to the unconditional
  `note = @game.login_postit_for(info[:object])`. Behaviour unchanged: this branch is only reached with no
  foothold, since `params[:foothold].present?` is intercepted at `:1388` before it.

The request path is read-only (no `player_state` write, no `save!`), `Cache-Control: no-store` is set at
`:1385` before the foothold dispatch so every remote 400/403/422 response carries it, and the keyboard answer
is byte-unchanged (pinned by `network_remote_tiles_test.rb` "the keyboard answer carries no remote-only
fields").

## Security properties still pinned by the tests (not only the status codes)

- **No password over an unheld/unreaching foothold.** `network_host_service_off_test.rb:147,152` keep
  `refute_includes response.body, 'sokafor'` for both the reaching-but-off and the unheld foothold.
- **No post-it, no password over an unheld foothold.** `npc_habits_postit_test.rb:169-170` keep
  `refute ... key?('postitNote')` and `refute_includes ... OMAR_PASSWORD`, and
  `network_remote_tiles_test.rb` ("no postitNote through a foothold even when the owner writes their
  password down") proves the keyboard answer carries the note while the remote answer over the held OFFICE
  foothold does not.
- **No tiles over a held-but-off-network foothold.** `network_remote_tiles_test.rb:54` (R1 m3) holds a
  `workshop_lan` foothold, gets `WS-BENCH-01`'s tiles on its own network, and 403s `sam_pc` on `office_lan`,
  so reach — not mere possession — is what the branch judges.
- **Reach is judged before any host state is read.** In `remote_login_accounts` the reach gate
  (`network_access.rb:893`) precedes `remote_blocked?` (`:897`) and `host_service_off?` (`:899`), so a player
  with no reach gets a single 403 "PC not reachable" and cannot distinguish a blocked, off or normal host.
  The implant-source-off and down-network cuts are inherited for free: reach runs through `player_reach`
  (`:1111`), which returns an empty set for an implant whose source PC is off (`:1154`) and for down networks.

## m1 — the step-2 403 tests assert the error string, not the absence of tiles

`test/controllers/break_escape/network_remote_tiles_test.rb:47-67`

The two "step 2" cases (unheld foothold, and held-but-off-network foothold) assert the 403 status and the
`"PC not reachable: <id>"` error, but neither adds a `refute response.parsed_body.key?('loginAccounts')` or a
`refute_includes response.body, <a username>`. The no-tiles property on these paths rests on the 403 body
being only `{ error: ... }`, which the code guarantees, and the equivalent guard does exist in the
off/post-it suites. Failure scenario: a future refactor that let `remote_login_accounts` attach a partial
`loginAccounts` list to a 403 body would slip past these two cases. Belt-and-braces only; no current defect.

## m2 — 404-vs-403 still lets a no-reach player enumerate valid login-PC ids (pre-existing, unchanged)

`app/controllers/break_escape/games_controller.rb:1386-1394`

`find_login_pc` runs before the foothold dispatch, so a request naming an unknown `pc_id` gets 404
"Sign-in PC not found" while a real login host the player cannot reach gets 403 "PC not reachable". A no-reach
player can therefore tell which ids are real login hosts (headless network-only hosts included). This is
identical to the pre-K0 keyboard path (same `find_login_pc` ordering, same 404/403 split) and leaks no host
*state* (blocked/off/tiles all collapse to the same 403 without reach), so K0 adds no new surface. Noted for
completeness against the brief's "host existence" question; no change wanted.

## Observation (not filed) — blocked-before-off precedence differs across paths

`remote_login_accounts` returns 422 `remoteBlocked` before testing `host_service_off?` (`:897` before `:899`),
whereas `desktop_refusal` gates `not_responding` on `!remote_blocked?` (`:966`) and `host_row` short-circuits
an off host to `responding: false` with no `remoteSignIn` flag (`:1008`). A host that is both `remote:
"blocked"` and service-off therefore reports three different reasons across the three readers. All three are
served only to a player who already reaches the host, none leaks beyond what the network view shows, and the
real client never opens the remote screen on a blocked or off row (plan 5.2), so this is reachable only by a
tampered client and is cosmetic. Left as-is.

## Test results (run in the worktree at b8eeea5b4)

- `env -u GEMINI_API_KEY bundle exec rails test test/controllers test/integration test/models`:
  **1851 runs, 17604 assertions, 0 failures, 0 errors, 1 skip.**
- `node test/js/validator-access-model.test.mjs`: **41 pass, 0 fail** (B1/m1/m2 regression guards green).

## Verdict

**SHIP.** The R2 fixes are in place, the committed suites are green, and the security properties (no tiles,
password or post-it over an unheld or unreaching foothold; reach judged before any host state) are pinned by
tests rather than only by status codes. The two `m` items are a test-hardening suggestion and a pre-existing,
unchanged enumeration note; neither blocks merge.
