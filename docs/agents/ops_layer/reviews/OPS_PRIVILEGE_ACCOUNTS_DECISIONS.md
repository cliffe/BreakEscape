# OPS_PRIVILEGE_ACCOUNTS_PLAN.md: decisions after round 1

Findings not acted on as suggested, one line each.

- **M4 (domain lockout key).** Dropped from the plan rather than fixed: a correct design needs one key helper across six readers, a `maxAttempts` rule and NPC-side changes; recorded as open question 6 for a later slice (orchestrator allowed either).
- **M7 (own-PC-use report).** The middle design is adopted with the borrow "done" event only; the new own-PC report route is left as a later widening (question 2) to keep S5b's cost to one key.
- **M9 (`cachedAs` field on `cachedAccounts`).** Not added: the cross-plan ruling F lets the registry decide (a `hash` entry with a `harvested` proof means hash); the default is in question 3.
- **B2 option (a) (per-PC local admin password).** Not used: the plan models the hardened case as one `local` account per PC, which needs no second password store and keeps `creds.password` the only authored password.
- **M3 (carry `access` across rebuilds with a same-NPC guard).** Not needed: the level of password, credential and claim sessions is computed from the account on each read, so nothing is carried; ruling A also drops the same-NPC condition.
- **n1-n3.** All three applied (keyringRev in every answer; S5c order stated; no domain lockout line needed since domain lockout is dropped).
