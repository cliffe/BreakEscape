# S1 server side, review R1 (steps 2 and 3)

Reviewed at `147f94bcd` (commits `046dff1ec`, `fb22fcedb`, `147f94bcd`), read by `git show`, against `OPS_CORE_PLAN.md`. Read-only review; no tests run unless stated.


## Findings (reconstructed by the orchestrator, 2026-11-23)

The reviewer reported its findings in its hand-back and wrote only the header above; the
orchestrator committed the file without checking it. This list is rebuilt from that report
(0 blockers, 2 majors, 7 minors; checks 1 to 7 passed; departures (b), (c), (d), (e), (g),
(h) accepted). It has no file:line pointers.

- **M1 (major).** A row's `from` is the built foothold id (`jack_<id>`, `wifi_<network>`,
  `implant_<pc>`); the log helper refuses ids over 40 characters; an object id that passes
  the validator can exceed that once prefixed, so the sweep is a 500 under the guard and the
  row is dropped in production.
- **M2 (major).** `network_discovery_display_test` leaves out three of the six routes the
  plan names (credential sign-in through a foothold, sign-in from a held desktop, the
  keyring's offered routes); its fixture has no `credentials`, so the keyring comparison
  cannot fail.
- **m1.** Departure (a): add the foothold id now as an unused optional argument of
  `network_rows` and `host_row` at all seven call sites.
- **m2.** Departure (f): the two `validate_network.rb` edits were in no step row.
- **m3.** `check_network_ops` does not return early for a scenario with none of the fields
  (plan section 10).
- **m4.** The `hosts` schema has no `propertyNames`, though `HANDOVER_core_2.md` says it
  has; the validator does hold the pattern. (A note correction.)
- **m5.** No test that a repeated sweep's save is bounded.
- **m6.** Weak tests: the refusal-code test sees only two answers; the "payload scan" test
  does not call the payload scan; nothing pins departure (b) (`ops` not sent on a down
  block).
- **m7.** `ops_bad_request` is unused; a down block carries `swept: false`, so the client
  must not offer Sweep on `route: "down"` (client side: tested in `7c3189229`);
  `OPS_AS_NIL_EVENTS` is a hand-kept list.

## R1 outcomes (fixer)

The findings text was not in this file when the fixer started (only the header above was committed). The fixer worked from the orchestrator's prompt, which restated M1, M2, m1, m2, m5, m6 and the rulings. m3, m4 and the body of m5, m6 and m7 could not be read, so they are open.

| Finding | Outcome | Commit |
|---|---|---|
| M1 validator | Fixed: with `logSources`, a jack, a Wi-Fi network (with a wifi block) or a PC named by a `grant_foothold` whose built id (`jack_`, `wifi_`, `implant_` plus id) is over 40 characters is an error in `scripts/validate_network_ops.rb`, beside the existing 40-character rules; one node test per prefix (over, edge, no logSources). Mutation checked | 50a325b76 |
| M1 route | Fixed: `ops_write_scan_row!` writes no row when the foothold id does not fit a row; the sweep or scan still answers 200 and records discovery (the guard would otherwise raise in test and development). Test with a 41-character foothold; mutation (guard removed) makes it fail | 1d58cf407 |
| M2 | Fixed: new test runs the keyring's offered routes (foothold and from), credential sign-in through a foothold, typed and credential sign-in from a held desktop, on open and on unswept scan, with a `credentials` fixture; answers equal (keyring `rev` normalised). Mutation: gating `keyring_pc_openable?` on discovery makes it fail | d735fefee |
| m1 | Fixed: `network_rows(network_id, foothold_id = nil)` and `host_row(pc, _foothold_id = nil)`, passed at all seven call sites (and `ops_host_row`, `ops_held_session_rows`), unused. Golden compare unchanged | 1d58cf407 |
| m2 | Already done by step 5 (`897d3e1bd`: `carries` counts devices; the label rule reads devices through `hosts_on`); confirmed, no change | 897d3e1bd |
| m5 (bounded save) | Fixed as far as the prompt states it: a test that repeated sweeps save once each up to the helper's limit and not after (counts `Game#save!`); mutation `save!` always makes it fail | 1d58cf407 |
| m3 | Fixed: `check_network_ops` returns at once unless the scenario has `hosts`, `techniques`, a `scan` network, `services` or `technique_card` on an object or item, or `logSources` (so the M1 foothold-id rule still runs). Node test: none of the fields gives `[]`, and with `logSources` only the id-length error. Mutation (logSources term removed) fails it | 6cc0efa9a |
| m4 | Fixed: `HANDOVER_core_2.md` now says the `hosts` map has no `propertyNames` or `patternProperties` and the validator holds the key pattern and the 40 limit | 6cc0efa9a |
| m6 | Fixed: refusal-code test hits the 404, 400, `not_needed` and `not_responding` and checks each code against the fixture (mutation: a misspelt `not_responding` fails it); the "payload scan" test now calls `PayloadScan.scan_body` on the bootstrap and every room (old string check kept, renamed); new test that a down block has no `ops` key while the up block has (mutation: `with_ops: true` on the down block fails it) | 6cc0efa9a |
| m7 | Fixed: unused `ops_bad_request` removed (the 400 is built only in the controller). `OPS_AS_NIL_EVENTS` stays hand-kept: the event registry holds no `as` rule to derive it from; a comment says so | 6cc0efa9a |
