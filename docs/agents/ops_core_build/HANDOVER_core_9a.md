# Handover core step 9, part A (S3, N15): schema, helpers, validator. Done

No route, no server behaviour, no client. `NETWORK_OPS_BUILT` still has N15 false (the stage's last step, 13, flips it); node tests pass a built table.

## Helpers (`lib/break_escape/network_model.rb`, before `present_string?`)
- `techniques(data)` -> `{ id => entry }`, hashes only, `_` notes skipped.
- `technique_matches?(technique, service, weakness)`: all three raw hashes (the registry entry, the service, the weakness entry). Class equal; `product` equal to `service['product']` when `worksOn` has the key; `service['version']` in `versions` when the key is there (a non-list `versions` never matches). No `worksOn` or a nil argument -> false.
- `technique_items(data)` -> `[{ item:, home:, path: }]`, `home` one of room, container, start, npc, share, grant. Items of a `technique_card` carrying key `technique_card` only; walks container and item `contents`, a share's (`resources.<id>.contents`), NPC `itemsHeld`, start items, declared `give_item` grants. Items on a sign-in PC's desktop are NOT listed.

## Schema (`scripts/scenario-schema.json`)
Top-level `techniques` (before `roles`): `x-id-map`, `x-serverOnly`, `x-servedBy ["GET /network"]`, `maxProperties 32`, no `patternProperties`; closed entry `name` (1-40), `summary` (<=200), `worksOn` (closed; `class` enum required, `product`, `versions` 1-8 strings); item `technique_card` (after `credential`, id pattern, max 40); `credentials.<id>.proof.technique_card` (three dotted ids pattern). Proof description list updated. `grants` and `needs.session` were already declared in S2 and are unchanged.

## Validator (`scripts/validate_network_ops.rb`): `network_ops_check_techniques`, runs only when N15 is built
Errors (all start `network ops:`): `N entries in `techniques`; at most 32`; registry key longer than 40 / not matching the id pattern; entry "is carried by no item"; entry needs `worksOn` with a `class`; `worksOn.product` equals no service's product; `worksOn.versions` entry equals no version of that product (or of any service when no product; the plan's rule is literal: every listed version must exist, so a list of "3.0","3.1" needs services at both); item "has `technique_card` but its type is ..."; item "is of type technique_card but has no `technique_card`"; item key "is not a key of the technique card registry"; `grants.session` on a `hosts` entry; account not an account holder; account not admitted (`pc_admits_account?`); `grants.credential` naming no entry; entry's proof must be `{technique_card: <finding id>}`; credential kind not `saved_connection`; credential granted by two weaknesses; granted credential's connectsTo PC blocks remote / does not accept `saved_connection` / does not admit the credential's account; credential `proof.technique_card` names no weakness or a weakness whose `grants` does not name it; weakness with `grants` that no registry entry matches; `needs.session` without `grants.session`; `needs.session: admin` with a `user` grant.
Warnings: registry key holds a word (3+ letters) of a service product; entry fits only decoys; weakness with no `grants`, and (separately) `needs` on one, only when the scenario has a card item; session grant on a PC a `unlock_object` task, a `captureProof` session or a keyring `proof.session` names; session grant needing a credential that connects to the same host (the loop).
Wiring: hook after `network_ops_check_findings` (`check_network_ops`), `require_relative` of `credential_model`, constant `NETWORK_OPS_MAX_TECHNIQUES`. Existing not-built table untouched.

## Tests
`test/js/validator-network-ops.test.mjs`: 58 pass (was 38; the S3 block at the end, fixture `s3()`); `validator-declared-top-level` +1 (`techniques`); `test/unit/network_model_test.rb` 35 (+3). Passing: `scenario_schema_test` (with network_model: 48 runs), `ops-unchanged-validator`, `pretext-verdicts-unchanged`, golden compare 12 runs, `test_ops_findings` 0 errors, `test_ops_scan` 0 errors, rubocop clean.

## Gotchas for the route builders
- `check_credentials` (`validate_scenario.rb`, builder 9b's `PROOF_KINDS`) must accept the `technique_card` proof; until it does, a full `validate_scenario.rb` run of a scenario holding such a credential may report an error that `check_network_ops` does not.
- Registry keys use the 40-char id pattern, so the card item's `technique_card` value does too.
- `needs.itemType: "technique_card"` stays refused (S2); `needs.item` naming a card item is allowed.
- The "credential account not admitted" error is a small addition beyond the plan's two connectsTo checks.
- `technique_matches?` takes raw hashes; with `NetworkModel.weaknesses` records pass `rec[:service]` and `rec[:entry]`.
