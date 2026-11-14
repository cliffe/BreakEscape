# Credential keyring K0 (server half) — code review, round 1

Branch `build/keyring-k0` at `695d1c6dd`, worktree `.claude/worktrees/p-k0`.
Scope: `app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/network_access.rb`,
`scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `README_scenario_design.md`,
`test/controllers/break_escape/network_remote_tiles_test.rb`. Plan: `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` section 5.

Counts: **B 1, M 0, m 5**.

The server branch itself (`remote_login_accounts`, `remote_screen`, the controller dispatch) is sound:
read-only (no `player_state` write, nothing synced grows), reach judged server-side through a held
foothold, no password/post-it/capture in the answer, the keyboard branch byte-unchanged. The one serious
problem is in the validator, not the request path.

---

## B1 — validator rule crashes on every scenario that uses the feature

`scripts/validate_scenario.rb:6920`

```ruby
used = (pc['policy'].presence || json_data['defaultPolicy']).to_s
```

`validate_scenario.rb` never requires ActiveSupport (confirmed: `ruby -e '"x".presence'` →
`NoMethodError`, and this is the only `.presence` in `check_access_model`). So `String#presence`
(and `NilClass#presence`) are undefined in the validator's runtime. The `tiles_pc_under` lambda is
called only from the new `policies.each` loop, which runs only when a policy carries `remoteScreen`.
The whole of `check_access_model` is wrapped in a rescue that downgrades any exception to a single
`❌ ERROR: check_access_model could not run: NoMethodError`, so when the crash fires it **silently
suppresses every other access-model error and warning for that scenario**.

Failure scenario (reproduced): copy `scenarios/test_access_networks`, set
`"hardened": { "remote": "blocked", "remoteScreen": "tiles" }`, validate →
`❌ ERROR: check_access_model could not run: NoMethodError: undefined method 'presence' for "counted":String`,
and the access-model section (shares, ACLs, policy references, reach) produces nothing. This is exactly
the input K0 exists to validate: the K0 scenario half (plan 5.4) adds `remoteScreen` to
`test_access_networks`. The build log's "Ruby syntax checked on validate_scenario.rb" did not exercise
the branch; it was never run against a scenario that sets `remoteScreen`, so both intended messages
(the `remote: blocked` warning and the `tiles` info line) are currently unverifiable in practice.

Fix: resolve the policy name without `.presence`, matching the idiom used a few lines below at
`:6905` (`e[:object]['policy'].to_s` + `policies.key?`), e.g.
`p = pc['policy']; used = (p.is_a?(String) && !p.empty? ? p : json_data['defaultPolicy']).to_s`.
After the fix, re-run the validator on a `remoteScreen` scenario to confirm the warning and info line
actually emit (they cannot be observed today) and re-check m1/m2 below.

---

## m1 — info line fires for an unused `remoteScreen: "tiles"` policy (false positive)

`scripts/validate_scenario.rb:6927-6935` (behaviour after B1 is fixed)

`tiles_pc_under.call(policy_name)` returns false when *no* PC uses the policy, so a policy that declares
`remoteScreen: "tiles"` but is attached to no sign-in PC draws
`policy '<x>' ... every PC under it has loginPicker false or is headless, so no PC tiles show`, which is
false (there are no PCs under it at all). Failure scenario: a scenario defines a spare `"kiosk_nla"`-style
policy with `remoteScreen: "tiles"` not yet wired to a PC → a misleading info line. Minor because it is an
info line and an unused policy is itself odd, but the wording claims something untrue. Consider
distinguishing "no PC uses this policy" from "PCs use it but none can show tiles".

## m2 — a `remote: "blocked"` policy with `remoteScreen: "tiles"` gets both messages

`scripts/validate_scenario.rb:6929-6935` (behaviour after B1 is fixed)

The two `if`s are independent, so a `{ "remote": "blocked", "remoteScreen": "tiles" }` policy whose PCs
are all blocked/headless emits the warning *and* the info line about the same policy, doubling the noise
for one condition that the warning already fully explains. Failure scenario: `hardened` above with a PC
attached. Minor; gate the info line on `policy['remote'] != 'blocked'`.

## m3 — no test for a held foothold that reaches a different host but not this one

`test/controllers/break_escape/network_remote_tiles_test.rb:47` (step 2)

Step 2 exercises the 403 with `jack_not_held` — a foothold id the player does not hold at all. The other
half of `host_reachable_through?` (a foothold that *is* held but whose `player_reach` does not include this
PC's network) is never hit. Failure scenario: a regression that made `host_reachable_through?` return true
for any held foothold regardless of network would pass the whole suite. Add a held-but-off-network case
(e.g. the workshop PC from the office foothold).

## m4 — `remote_login_accounts` is untested on a non-string `foothold` param

`app/models/break_escape/network_access.rb:888`, `app/controllers/.../games_controller.rb:1394`

`params[:foothold].present?` passes an array/hash param (`?foothold[]=x`) into the branch; the controller
sends `params[:foothold].to_s`, so the string guard and the `network_footholds` lookup handle it (verified
by reasoning: `"[\"x\"]"` is a short string, not a held key → 403). It is safe, but there is no test
pinning that a structured `foothold` param can never reach a 500 or fall through. One request-level test
would lock it down.

## m5 — remote branch caps foothold ids at 64 chars; the keyboard branch has no such cap

`app/models/break_escape/network_access.rb:888`

`foothold.length <= 64` 400s a legitimately held foothold whose id exceeds 64 characters
(`jack_<jackId>`, `implant_<pcId>`, `wifi_<networkId>`). Real ids are short, so this is theoretical, but a
scenario with a long jack/PC/network id would make its own remote sign-in screen unreachable (400) while
the keyboard still works. Matches the plan's "at most 64 characters" wording, so flagged only as a latent
asymmetry, not a deviation.

---

## Checks that passed

- **Access rights.** The remote answer carries only `login_account_tiles` (username, displayName, portrait,
  avatar) — the same non-secret enumeration the keyboard shows — plus `pc_id`, `host`, `headless`,
  `loginPicker`, `remoteScreen`. No password, no `postitNote`, no capture state (test "no postitNote through
  a foothold"). Reach is gated by `host_reachable_through?` reading server-held `network_footholds` and
  `player_reach`; a client-sent foothold that is not held → 403. `remote_blocked?` precedes the tile build.
  K0 does not touch bootstrap, so nothing new reaches it.
- **Synced state does not grow.** `remote_login_accounts` performs no `player_state` write and no `save!`.
- **Expiry predicate consistency.** K0 adds no session or expiry logic, so `credential_session_expired?`
  is not in play for this slice — no divergence introduced.
- **Keyboard branch unchanged.** The foothold dispatch returns before the keyboard path; the `no-store`
  header is set above the branch and still applies. (Nit, not filed: line 1413's
  `params[:foothold].present? ? nil : ...` ternary is now dead on the present-foothold side, harmless.)

## Test results (run in the worktree)

- `test/controllers/break_escape/network_remote_tiles_test.rb` — 12 runs, 64 assertions, 0 failures.
- `test/models/break_escape/{access_model_rules,access_model_withholding,network_withholding}_test.rb`
  and `test/controllers/break_escape/{network_remote_signin,network_no_exposure,network_notes_not_live,access_model_login}_test.rb`
  — 109 runs, 2605 assertions, 0 failures.
- Validator on `test_access_networks`, `lab_physical_pentest`, `m01_first_contact` — 0 errors each (none
  sets `remoteScreen`, so the new branch is dormant on shipped scenarios; the crash surfaces only on a
  `remoteScreen` scenario, see B1).
