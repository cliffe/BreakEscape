# OPS_PRIVILEGE_ACCOUNTS_PLAN.md: decisions after round 1

Findings not acted on as suggested, one line each.

- **M4 (domain lockout key).** Dropped from the plan rather than fixed: a correct design needs one key helper across six readers, a `maxAttempts` rule and NPC-side changes; recorded as open question 6 for a later slice (orchestrator allowed either).
- **M7 (own-PC-use report).** The middle design is adopted with the borrow "done" event only; the new own-PC report route is left as a later widening (question 2) to keep S5b's cost to one key.
- **M9 (`cachedAs` field on `cachedAccounts`).** Not added: the cross-plan ruling F lets the registry decide (a `hash` entry with a `harvested` proof means hash); the default is in question 3.
- **B2 option (a) (per-PC local admin password).** Not used: the plan models the hardened case as one `local` account per PC, which needs no second password store and keeps `creds.password` the only authored password.
- **M3 (carry `access` across rebuilds with a same-NPC guard).** Not needed: the level of password, credential and claim sessions is computed from the account on each read, so nothing is carried; ruling A also drops the same-NPC condition.
- **n1-n3.** All three applied (keyringRev in every answer; S5c order stated; no domain lockout line needed since domain lockout is dropped).

## Round 2

- **M5 (send `access` also for every technique record).** Declined in favour of the orchestrator's ruling: answers carry `access: "admin"` only when the computed level is admin, for any session kind, and omit it otherwise; the stored value is never passed through. OPS_CORE is asked to adopt the same rule (section 14).
- **m2 (`cacheOwner: false` opt-out).** Not used: the plan takes the stricter option, the owner is collectable only when listed, with a validator info line; the choice is question 7.
- **n2 (one unit-test directory).** Not settled here: left as a cross-plan request to all ops plans; this plan keeps `test/models/`.

## Round 3

- **m8 (whose profiles an admin sees).** No server-built folder per account: the flat merge is kept (it is how admitted profiles show today and `find_login_item` already agrees); authors wrap a profile in a named folder, and the validator warns on same-name top-level items.
- **m2 (`keyboard_admin?` on an off PC).** Took the reviewer's first option: the override skips the power term, so client and server agree; the narrower settled-session case is stated with what the player sees.
- **Plan length.** Grew from 929 to about 1000 lines: the `accountOnly` reader sweep, the stage-tagged tests and the collect gate needed text that no existing repetition could absorb.
