# Handover: core step 10 part B (S3, N15): POST /network/technique and use_technique!

Done, committed; nothing open in my files. No client, no change to existing access checks (step 11).

## Route
`POST /games/:id/network/technique`, params `foothold`, `finding_id`, `item_id` (strings, 1..200 chars, else one 400 `bad_request`, no row). Controller `network_technique` (in both the `set_game` and `with_game_lock` lists), policy `network_technique?` (+ `DEVICE_ACTIONS`), route line after `network/confirm`.

## Checks in order (`use_technique!`, `network_ops.rb`)
1. finding held and its host listed through the foothold (`ops_finding_reach`, the lifted preamble `confirm_finding!` also uses) else 404 `not_found`.
2. card: `ops_card_technique(item_id)`: authored definition is type `technique_card`, its `technique_card` is a registry key, and `ops_item_held?` (unforged inventory entry, id and type equal the definition). Else the same 404. The technique is read from the scenario, never the inventory copy.
3. host off: 403 `not_responding` + `technique_refused` row.
4. repeat (`ops_technique_repeat`): session grant = `sessions[pc]` is `via technique`, `technique == finding id`, `foothold == foothold named` (and its account exists); credential grant = `technique_finding_used?`. Answers `already: true` with the live session (`login_session_answer`) or `keyringChanged: false`, writes `technique_used` with `save_limit: true`, saves only if `stored?`.
5. 422 `not_confirmed` (status `u`), `false_positive` (`f`); 6. `no_grant` (`ops_grant_of` nil: no grants, session on a non-PC, unknown account, access not user/admin, credential not in registry); 7. `fixed`; 8. `wrong_class`, `wrong_product`, `wrong_version` (`ops_technique_mismatch`, decided by `NetworkModel.technique_matches?`, then named in that order); 9. `need_unmet` with `need: { kind, label }`.
Every refusal past the 404s (403 included): `technique_refused` row, `as` nil, `where` pc/host, `save_limit: true`, saved only when `stored?` (`ops_technique_refusal`). Refusal bodies hold `success, reason` (+ `need`).

## Grants (`ops_technique_grant!`)
- Session: `start_login_session!(host, npc, 'technique', foothold:, access:, technique: finding_id)`; answer `{ success, grant: 'session', session: login_session_answer(...), endedPcIds? }` (`access: 'admin'` inside `session` when admin). The step up (`needs.session`) is just this call: it replaces the record, keeps the foothold named.
- Credential: finding id appended to `player_state['opsUsed']` once; answer `{ success, grant: 'credential', keyringChanged: true }`.
- Both append to `opsUsed` once; row `technique_used` (`as` `{account:}` for a session, nil for a credential; detail finding alias, technique id, grant, access for a session); new grant saves.

## One needs predicate
`ops_needs_rows(needs, host_id)` is now the only reader; order credential, item, itemType, session, global. `ops_unmet_need` = first row with `met` false, used by `use_technique!`, so the tick and the refusal agree. New `session` row: `{ kind: 'session', label: <host_label of the PC>, met }`; met = a LIVE session at that PC (S3 server R1 M1: not a relay record, `relay_session?`, and not an expired token session, `credential_session_expired?`), not locked, `user` any / `admin` only if stored `access` is admin (`client_access_level`; S5a points that at `session_access`). Existing finding rows are unchanged for scenarios without `needs.session`.

## What `GET /network` now lists
Top-level `techniques: { id => { name, summary?, worksOn, itemId } }` for held, unforged cards naming a registry key; first held item in id order is `itemId`; key absent when none (body is then byte-identical). Done by wrapping `network_view` in `NetworkOps` (included after `NetworkAccess`).

## Wrappers in my file that touch NetworkAccess behaviour (I may not edit `network_access.rb`)
- `withhold_network_keys!` now also deletes `techniques` (the registry reached the bootstrap otherwise). Cleaner: add `techniques` to `WITHHELD_SCENARIO_KEYS` (`network_access.rb:18`) and delete my override.
- `host_row(pc, foothold_id)` wrapper adds `access: 'admin'` to a held `session` on the row. Step 11 edits `host_row` itself (`openHere`); it can keep or fold this in.
- `network_view` wrapper (above).

## Events and kind (`lib/break_escape/ops_log_events.rb`)
`technique_refused` and `technique_used` verbatim from plan 13; kind `technique` (`technique_named`: registry name else id). `ops_refusal_codes.json` already held every code. `ops_log_test.rb`: `OPS_AS_NIL_EVENTS` + `technique_refused`; new `OPS_AS_ACCOUNT_EVENTS` (`technique_used`, worst case `{account: 32}`), because the typed worst case puts it at 465 bytes.

## Tests
`network_technique_test.rb`: 26 runs, 371 assertions, 0 failures (400s, every 404 case with no row/save, authored-definition read, 403, every 422 and its row, need order and labels, both grants, repeats, credential in keyring, sync body cannot set opsUsed, step up from technique and password sessions, locked session, second foothold, grant after session ended, different account ends `from` sessions, `GET /network` techniques, forged card, no logSources). Fixture: `NetworkOpsScenario.techniques_scenario` + `techniques_game`/`ops_technique`/`card_entry` in `test/support/network_ops_scenario.rb` (max 4 weaknesses per service: sam_pc has web, files, mail). Proof runs: S1/S2/keyring/access_model controller files + `ops_log_test` + `technique_session_record_test` + keyring + `policy_test`: 724 runs, only the ceiling-row failure (fixed after); `ops_log_test` 55 runs 0 failures after; `bin/ops-golden-compare` 12 runs 0 failures; rubocop clean.

## For the hostile-test builder
Forged `clientAdded` card; inventory copy with a changed `technique_card`; card matched by name only; a finding of another host; foothold not held; a sync body carrying `opsUsed`/`opsFindings`/a technique session; non-string params; a `technique` weakness id with a non-pattern card key. Also: a refusal-limit run (11 refusals at a host in a window; the eleventh does not save) is in `network_ops_free_test`, not mine.

## For step 11
`host_row` has my `access` wrapper; `settle_session_at_keyboard!`, `desktop_request_allowed?`, `folder_route_allowed?` untouched. A technique record is `{ id, via: 'technique', foothold, access, technique }`. A session need counts any unlocked session at the PC (password through a foothold included), as the plan says.

## Departures
The session need row's label is the PC's host label (plan fixes none). The `host_row`, `withhold_network_keys!` and `network_view` changes are wrappers in `network_ops.rb`, not edits to `network_access.rb`.

## S3 server R1 changes of contract (fixer)

- A `session` need is met only by a live session (relay and expired token records do not meet it); a `credential` need is met only by a keyring row that is neither `expired` nor `ended` (`ops_keyring_serves?`). The finding row's tick uses the same predicate.
- `GET /network` `techniques[id].worksOn` is built by named keys only (`class`, `product`, `versions`); a technique whose `worksOn` is not a Hash with a class is not listed.
- The keyring serves a `technique_card` proof only for a `saved_connection` entry.
- Validator: `needs.session` on a `hosts` entry is an error; the loop warning says only a same-host credential connection is tested.
