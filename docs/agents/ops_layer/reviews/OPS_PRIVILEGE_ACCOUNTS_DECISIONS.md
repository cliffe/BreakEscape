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

## Round 4

- **m2 / N1 (`keyboard_admin?` on an off PC), corrected.** The round 3 reason was wrong: the client does see power, because an answer after power-off carries no `access`. Took the second option instead: `keyboard_admin?` keeps the power term (it is `session_admin?` plus the two route terms), so an admin cannot override on a PC whose service is off and client and server agree once the answer arrives; the stale-mirror gap is the accepted "client wider" case. Question 6 notes the off-PC case.
- **N3.** `accountOnly` NPCs take an allow-list of keys, and `NpcHabits.expand!` joins the readers that skip them (a role's `awareness` would otherwise give the account preset habits and door-gate `noHold` entries).
- **N2.** The grep-count guard became a checked-in manifest (`test/models/account_only_readers.yml`) read by the test.
- **N4, N5, N6, n1-n7.** Applied as wording: ids within the log caps where `logSources` is set (collect `pc_id` cap now 40), the same-name warning gated on an admin path, the golden-compare script's parent, test file and database rule stated.

## Round 5

- **M2 (comment keys).** Allowed every `_`-prefixed key on an `accountOnly` NPC, not only `_comment`, matching the schema's `patternProperties: {"^_": {}}` convention elsewhere (the `npc` definition declares neither `_comment` nor closed properties); `staff` is also made required, not just allowed, and the two `accountOnly` examples now say `"staff": false`.

## Picks 2026-11-19

- **SHARED-3 c (always a hash).** Applied: the collect yields only a `hash` record (one authored per candidate PC and account, validator error otherwise), S5b adds the `harvested` proof kind, the collect panel and keyring row offer S7's crack; the password-by-default path, the harvest password row and their tests are gone; S5b now builds after S5a and S7; cross-plan lines to S7, S8 and S9.
- **PRIV-7 b (any admin session overrides USB).** Applied: `keyboard_admin?` and the client `keyboardAdmin` replaced by `session_admin?` / `sessionAdmin` at the implant path, plant proof and `plantRefusal`; off-PC and locked sessions still never override; the implant path's own keyboard-session rule is unchanged; tests and the S5a playtest beat updated; S9 told.
- **SHARED-2 a (admin sign-in gives admin).** Already written; the question's rationale moved into section 5.
- **PRIV-2, 5, 6, 8, 9, 10 a.** Already written; each question's reasoning moved into the body (cache candidates and borrow, no game-minute cost, domain lockout in section 1, sign-in tiles in S5c, owner collectable only when listed) and section 15 left with defaults only.
