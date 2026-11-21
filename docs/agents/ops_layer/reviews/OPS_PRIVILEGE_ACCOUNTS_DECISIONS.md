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

## R8 fixes (2026-11-19)

- **m1.** "Item not held" added to `plant_policy_refusal`'s nil cases, so a retried gated remove answers success and records nothing more; server test (two identical gated removes) and JS test (both attempts fail, then success fires `triggerOnInteract` once); reload-before-retry stated as a known limit; no new synced state.
- **m2.** In-flight guard now holds the object id and the item id; the item is left out of `requiresItem` matching and the `remove_item` pick until the answer; JS test for a second object asking for the same item.
- **m3.** `objectData` passed in the opts from both `interactions.js` calls and threaded through `confirm_action`; admin choice in one helper, `plantAdmin(objectData)` in `pc-sessions.js`, used by both callers; listed in section 12; JS test that both callers agree on a `sam_dock`-shaped object.
- **m4.** Validator test goes in `test/js/validator-privilege.test.mjs`, the repo's convention for `scripts/validate_*.rb` (cf. `validator-capture-log.test.mjs`); rows for the `remove_item` warning (governed second, governed first, ungoverned second), the two-PC warning, and one per section 9 error.
- **n1.** S5a build row now lists the five places the policy is read.
- **n2.** Client reads only `error`; the route's `message` refusals and 500 `rescue` text never reach a toast; a 5xx after the retry is the generic network line.
- **n3.** First grant stated as depth-first in list order, conditions ignored as in `removes_item?`; took the optional validator warning for one object whose grants name two different PCs, with server and validator tests.
- **n4.** One clause: `give_item` promises from a resumed list never reach the first call's `gives`, and the timer dispatcher (the only reader) never makes a gated remove.

## Round 2 picks (2026-11-19)

- R2-7 a: Q1 removed from section 15; keyboard-only session-type implants stated as a decision there.
- R2-8 a: Q2 and the `quietNeedsConsole` option removed; section 15 states the accepted "Nobody is signed in at this keyboard." change in `test_access_networks` and `demo_access_tour`, and section 10 now says "accepted" in place of "needs the user's yes". Section 15 is now "Decisions".
- R2-11 a: the plan mentions neither existing-code bug, so no change.

## Cracking plan requests (2026-11-19)

- Request 1: every hash example and the `account.npc` wording in sections 6, 9 and 14 now use `"account": "<npcId>"` (a string, as `scripts/scenario-schema.json` requires); `cachedAccounts` entries keep their `{ "npc": ... }` form.
- Request 2: the `deskadmin_pc01` recipe example now carries `crack.facts` (`it_rota_poster_seen`, illustrative id), and the recipe text in sections 6 and 14 names `facts` (1 to 4 intel fact ids, required for `guessable`).
- Answers to the S7 requests: the section 14 S7 entry now says each is answered in the cracking plan's section 14.

## Cracking requests applied (2026-11-19, part 2)

- Request 1: the validator no longer requires `passwordPattern` on a guessable `crack`; section 6 and the validator rule point to `validate_cracking.rb`, which owns every rule on `crack`. Recipe class list now includes `common` and says `password` is required on a habitless record.
- Request 2: no `reused` check of its own; the validator rule and section 6 point to the cracking plan's warning in `validate_cracking.rb`.
- Request 3: the S5c poster example is now a takeable `notes` item with `revealsFacts: ["it_rota_poster_seen"]`; the recipe example drops `passwordPattern`; stage and playtest lines say "take" the poster. The S7 request text calls `passwordPattern` optional.
- `cachedAccounts` check: entries are `{ npc }` on the PC only; the cracking plan reads hash records from the registry (`account` is an NPC id string), never `cachedAccounts`, so no change was needed.
