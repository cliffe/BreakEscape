# S1 server side, review R1 (steps 2 and 3)

Reviewed at `147f94bcd` (commits `046dff1ec`, `fb22fcedb`, `147f94bcd`), read by `git show`, against `OPS_CORE_PLAN.md`. Read-only review; no tests run unless stated.


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
| m3, m4, m6, m7 | Open: finding text unavailable (m7 is a client-side ruling) | none |
