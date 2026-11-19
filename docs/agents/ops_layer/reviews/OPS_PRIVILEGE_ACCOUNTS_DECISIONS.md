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

## R6 fixes (2026-11-19)

- **B1.** Fixed on the cracking side: a hash record may carry `crack: { password, passwordPattern }` for an account with no password habit; `accountOnly` keeps no habits; validator requires `crack` for such a candidate and refuses an NPC as its pattern source; S5c example, test scenario, playtest and harvest test show it; section 14 asks S7 to read `crack` and apply its habit rule only without one.
- **M1.** Proof is the string form `{ "harvested": "<pcId>" }` (checked: `proof_kind` at `credential_model.rb:62-67` reads only strings); every example, validator line, schema/file list and the S7 request updated.
- **M2.** Session-shaped implant stays keyboard-only: new `keyboard_admin?` / `keyboardAdmin` used for `needsSession` objects at the plant proof and in `plantRefusal`; implant path answers `needs_console` with a line instead of the quiet `not_ready` (checked `network-links.js:483-501`) for a live non-keyboard session; core plan asked to change its technique `needsSession: yes` cell; section 15 Q1 offers (a) keyboard only, recommended, (b) any admin session.
- **M3.** Checked: the inventory `remove` branch (`games_controller.rb:1454-1460`) removes even when `record_planted_item!` refuses, and the client removes before the answer. New `plant_policy_refusal` check at the top of that branch answers 422 `usb_refused` before anything is removed or recorded; the client waits for the answer on override plants and keeps the item; tests for token expiry, unplug and outage added.
- **m1.** Registry ids lowercased; note that hash ids need no fixed tie to PC or NPC ids.
- **m2.** `username` added to the collect answer and panel; S7 asked to show it on the hash row; section 7 corrected.
- **m3.** Second PC's record for an already-cracked account shows as cracked (S7 request); the collect still records the pair for the log row.
- **m4.** Separate 64-pair cap dropped; the registry's 64-entry cap is the only bound, stated in sections 8 and 9.
- **n1.** "password collected" now "hash collected and cracked".
- **n2.** `sessionAdmin` takes the object's id; a governed non-PC object has no mirror entry and answers false.
- **n2b.** Both "ruling" phrases replaced with "by design, the comment at `:502`".
- **n3.** S5a now says it is ordered after S3 so the `access:` answer parameter exists.

## R7 fixes (2026-11-19)

- **M1.** Checked `apply-actions.js:275-293` (sends `used_on` after removing, ignores the answer). Only a "gated remove" (governed object whose policy refuses the item with `admin: false`, `pcPolicy.gatedRemove`) waits; both `consumesItem` and `remove_item` then send first and act only on success; `remove_item` stops its list there and runs the rest on success, and picks the policy-accepted item of two matches; validator warns on a governed `remove_item` not first in its list; no shipped `remove_item` object (`wall_port`, `network_port`, bin) is governed, so shipped scenarios keep today's order; tests in sections 11 and 12 updated.
- **M2.** "Needs a session" now keyed on the grant's `pc` via a nested walk (`session_grant_pc` / `sessionGrantPc`, recursing `confirm_action` as `removes_item?` does); checked against `sam_dock`, `kiosk_dock`, `implant_socket`; client keeps reading the socket's own policy (none on shipped sockets), override judged at the grant's PC; `needs_console` toast stated as the normal feedback; Q1(a), playtest step and JS test rewritten.
- **m1.** Section 10 names `test_access_networks` and `demo_access_tour` as the one visible change (`test_author_notes` holds its grant only in a note); new Q2: (a) accept, recommended, (b) a `quietNeedsConsole` scenario opt-in.
- **m2.** Section 14 asks the core plan's `network_technique_session_test` to expect `needs_console` from S5a (or assert only "refused, device held").
- **m3.** `keyboardAdmin` defined on the mirror's real fields (`remote`, `footholdId`, `relay`, `fromPcId`); technique copy added to the JS test.
- **m4.** `plantsInFlight` guard per object; `withBody` resolves true / body / false; any non-success keeps the item with the server's line, else "That did not go through. Try again."; both in JS tests.
- **n1.** "authored" dropped from the USB refusal line (the Q1 text now describes the toast instead).
- **n2.** S9 request states the `usb_install_overridden` rule as it is.
- **n3.** `plant_policy_refusal` names `record_planted_item!`'s early returns (`capture_proofs.rb:32`, `:39`), with a server test.
