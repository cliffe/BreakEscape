# OPS_LOG_ROWS_PLAN round 6 review (delta)

Delta: `git diff c93305555 3c25b21fe -- docs/achitechture/OPS_LOG_ROWS_PLAN.md`. Line numbers are
the plan at `3c25b21fe` (PLAN:n), unchanged at the worktree HEAD `8bd818814`. Code pointers are at
the same commit. Sibling pointers are at HEAD.

## 1. Status of the round 5 items

| R5 | Status |
|---|---|
| B1 typed oracle | Closed. PLAN:760 stores typed text "whatever it equals"; PLAN:843-845 says no user of the matcher reads `as.typed`; the "or a typed username equals a registered secret" nil case is gone from PLAN:771-773; the test at PLAN:553-556 fixes it (row written, response differs only in the text). 13.3 states the one exception (PLAN:961-962). Open question 4 records the defence-game consequence. No remaining route found where a row's presence depends on typed text equalling a secret (section 3) |
| M1 lock plan `by` | Closed in the sibling: `approver` at OPS_LOCK_SECOND_STEP_PLAN.md:568, :620 |
| M2 limit at the call | Closed. `save_limit` is a Boolean (PLAN:737, PLAN:749), the number lives in `EVENTS` (PLAN:1012, PLAN:1020-1022), the `EVENTS` spec checks the result and range (PLAN:1058-1059), the validator counts keys from `EVENTS` (PLAN:447-449), malformed without a registered limit or with `once:` (PLAN:812-813, test PLAN:514-515) |
| M3 lock plan `{ npc: }` | Closed in the sibling: OPS_LOCK_SECOND_STEP_PLAN.md:606 ("when the pane names the owner") |
| m1 `+` mark | Closed. `"p": 1` on every row the spending call stored or merged into, in every source (PLAN:909-915); survives the reset (test PLAN:509-511); `rowSeq` and the negative count gone (no hit for either); protection is time-based on the row (PLAN:889-891); identity caveat stated (PLAN:913-914). Bytes: rebuilt, see section 3 |
| m2 clock step back | Closed (PLAN:867-869, test PLAN:511) |
| m3 guard on a legal scenario | Closed for the raise (PLAN:839-842, fixture PLAN:541-543). The fix narrows the guard further than the collision needs: m2 below |
| m4 lock types | Closed (PLAN:819-825, test PLAN:537-538) |
| m5 S8 secret sources | Closed (PLAN:826-827, PLAN:1167-1169) |
| m6 MFA guard tests | Moved to section 14 item 5 (PLAN:1174-1176); the replacement test cannot reach the guard: m2 below |
| m7 lock `method` list | Met in the sibling (OPS_LOCK_SECOND_STEP_PLAN.md:615); this plan still asks for it: n2 |
| m8 raise in a `rescue` | Closed (PLAN:849-850, test PLAN:605-606) |
| n1 to n8 | All closed: Q1 "written to (d)" (PLAN:1201-1202); "eight" (PLAN:1112, PLAN:1182); `opsLogOnce`/`opsLogSaves` in "Never" (PLAN:339-341); `SAVE_WINDOW_MS` (PLAN:873); warnings moved (PLAN:446-449); `once:` with `save_limit:` malformed (PLAN:813); `Current.reset` (PLAN:540-541); "fixed window" (PLAN:873-874) |

## 2. Findings

### m1 (minor) The failed sign-in and lockout rows take the normalised key, not the text as typed

PLAN:203-204: `signin_fail`, `as: { typed: }` "from the key's username part (`key =
"pcId|normalised"`, `game.rb:3481-3483`)". PLAN:205-206: `signin_lockout`, `where` parsed from the
key, and 13.8 gives it `{ typed: }` too (PLAN:1123). The key's username is
`normalise_username(username)`, which is `value.to_s.strip.downcase[0, 64]` (`game.rb:2721-2723`),
and `record_login_failure!(pc, key, account:)` (`game.rb:4333`) and `add_login_lockout!(key,
account:)` (`game.rb:4366`) receive only the key, so the raw text is not available where the plan
writes these rows.

That contradicts the typed rule: "text as the player entered it ... stripped of control
characters (case kept)" (PLAN:760) and "stored as typed, cut and marked by the helper, normalised
only when shown" (PLAN:374-375). The blocked `signin_refused` at `:3484` and the MFA plan's
`helpdesk_request` can pass the raw `username`, so as written two rows of one field hold two
forms. A builder has to pick one.

No security effect: normalisation does not depend on what the text equals, so neither form is an
oracle. Display is the same either way (the reader normalises, PLAN:353, PLAN:366-369). The
difference is merging: raw storage makes `J.Price` and `j.price` two FAIL rows that render
identically, while the failure counter (`loginFailures[key]['n']`, the attempts left) counts them
as one.

Sibling reliance: none on the row's form. The privilege plan uses the normalised form only for the
lockout key (OPS_PRIVILEGE_ACCOUNTS_PLAN.md:113). The MFA plan normalises the helpdesk username
before it is used as a key (OPS_MFA_HELPDESK_PLAN.md:499-501) and its test at :931 treats the
row's `typed` field as separate from that key, which reads as raw; it does not depend on either
form.

**Fix.** Preferred: define `typed` as the `normalise_username` form (trimmed, lower case, 64 code
points) before the helper's control-character strip and cuts. Change PLAN:760 "case kept" to
"in the `normalise_username` form, the form the route keys on" and PLAN:374-375 "normalised only
when shown" to "normalised as the route keys it". Then PLAN:203-206 stand as written, a FAIL row's
`n` matches the attempts counted, no signature changes, and the blocked sign-in and helpdesk rows
pass the normalised value (one line in section 14 item 5 for the MFA plan). Open question 4 still
holds (the password is shown lower-cased). Alternative: keep raw storage, add a `typed:` keyword
to `record_login_failure!` and `add_login_lockout!`, pass `username` from `attempt_login!`
(`game.rb:3502`), and say in 13.2 step 5 that rows differing only in case do not merge.

### m2 (minor) The skip rule leaves the guard almost nothing to compare, so the sibling guard tests pass for the wrong reason

PLAN:835-842: the matcher compares only values "that its type rule did not resolve (an alias,
and any later rule ...)"; codes, ids and usernames are skipped, and `as.typed` is never read. In
L1a that leaves aliases (`^[a-z][0-9]{1,3}$`, PLAN:1030) and counts (at most 9, against numeric
secrets of 10 or more, PLAN:838-839), so no well-typed L1a row can ever trip the guard.

Is it a hole? Not a leak. A secret slips past the guard only when it equals the resolved value, and
then what reaches the browser is a display name (ids are never shown raw, PLAN:370-373), a public
code word, or an account username. The last is the one exposure, and only where an author made a
password equal to a username, which the validator warns on (PLAN:446-447). So the type rules stay
the defence, as PLAN:831 and PLAN:962 say.

The consequences sit in tests and the sibling contract:

1. Section 14 item 5 (PLAN:1174-1176) asks the MFA plan to test the guard with "a `detail` value
   forced to the issued value in a test-only event", and the MFA plan has adopted it
   (OPS_MFA_HELPDESK_PLAN.md:1072-1076, for H1 "a row holding `creds.resetPassword`"). Any field
   that could hold a six-digit code, a 10 to 99 number or a reset password is a code, an id or a
   username (skipped once it passes its rule) or a count or alias (refused by the type rule
   first). The type refusal also raises `ArgumentError` in test (PLAN:847-848), so the test
   passes, but it is testing the type rule, not the guard.
2. Run 2 of the walk (PLAN:548-550) can no longer differ from Run 1.
3. The skip is wider than the collision it fixes: it drops every resolved field against every
   secret, including request-scoped issued codes and later siblings' hashes and reset passwords,
   none of which an author can make collide.

**Fix.** Subtract colliding secrets, not resolved fields. At load, compute the authored
collisions: registered secret values equal to a declared username, a scenario id or a code in
`EVENTS` (the same set the validator warning at PLAN:446-447 reports; extend that warning to
codes). The matcher compares every non-typed value against `secret_values` minus those
collisions, and always against `note_issued_secret` values. A weak-password scenario still
validates and never raises; an issued code or a reset password that a builder routes into any
field is still caught. Give the guard's message a fixed prefix distinct from the type checks' (for
example "secret in"), and have the MFA tests assert that prefix and use a test-only event with an
`{ id: 'test_any' }` kind whose lookup resolves any string, so the value passes its type rule and
reaches the matcher. If the reviser keeps the current skip, section 14 item 5 should drop the
guard tests for M1a, M3 and H1 instead of asking for ones that cannot reach the guard.

### Nits

- n1. The `badge_swipe` limit is said to be registered (PLAN:229, PLAN:1118 "10 per door") but no
  line shows its `EVENTS` entry; only `signin_refused` is written out (PLAN:1012). Add
  `save_limit: { 'denied' => 10 }` for `badge_swipe` to the code block, since this plan owns it.
- n2. Section 14 item 6 (PLAN:1179-1182) still asks the lock plan for the closed `method` list;
  OPS_LOCK_SECOND_STEP_PLAN.md:615 now lists it (eleven codes, all within 16 lowercase
  characters). Mark it met.
- n3. A noisy `technique_refused` (`save_limit: false`) shares the event, place and result with
  quiet ones and can merge into a row with `p`, moving its `last` and so its protection window
  (PLAN:889-891) on indefinitely. Bounded by classes 4 and 5, so harmless; say that only a
  `save_limit: true` merge refreshes the protection, or accept it in one clause.
- n4. Section 14 item 3 (PLAN:1162) and the core plan (OPS_CORE_PLAN.md:621) say a noisy refusal
  "passes none"; the default is `false` (PLAN:737), so it is the same call. "passes none (the
  default `false`)" removes the doubt.
- n5. Open question 4 (PLAN:1217-1220) has no lettered options and no "This plan is written to"
  line, unlike 1 to 3. Add "This plan is written to accepting it."

## 3. Answers to the checks asked for

- **Typed text, B1.** Stored whatever it equals; the matcher never reads it (PLAN:843-845); the
  nil list no longer has a typed case (PLAN:771-773). Routes checked for a presence oracle:
  `signin_fail` (always written, method's own save), blocked `signin_refused` and blocked
  `helpdesk_request` (`save_limit` keyed without `as`, PLAN:865-866, so the drop does not depend
  on the text), helpdesk granted and refused (same shape for account and non-account,
  PLAN:1092), `signin_lockout` (fires on `maxAttempts`, not on the text). In development the guard
  can now raise only on an alias equal to a secret, which is server-made, not typed. None found.
- **5.1 normalised key.** m1. Graded minor: a contradiction a builder must resolve, no leak; no
  sibling relies on the row's form.
- **`EVENTS` limits.** Sound. One `k` per key; the validator reads it from the file it already
  loads; the spec rejects 0, 100 and an unknown result.
- **`"p": 1` and bytes.** Rebuilt with `to_json.bytesize` at the ceilings of PLAN:790-794 (typed
  96 characters plus `"cut":true`, 40-character ids, `seq` 999999, `n` 99999, `last`, 9-digit
  `elapsedMs`, 13-digit `serverMs`): blocked `helpdesk_request` with `p` 382, blocked
  `signin_refused` 343 and 349 with `p`, `technique_used` at a host 388 (account 32 characters,
  `grant` `credential`, `access` `admin`), all matching PLAN:794-796. Quiet `technique_refused`
  with `p` and a 16-character reason is 340, below the stated largest. Counter entry
  `"0123456789ab":[10,1763550000000],` is 34 bytes; 256 entries are 8,704 bytes, "about 9 KB"
  holds.
- **Skip rule a hole?** No leak path found; m2 grades the loss of guard coverage and the tests
  that no longer reach it.
- **Numbers and counts.** 256, 34 bytes, about 9 KB, 300 rows, 400 bytes, 120 and 128 KB, 30
  sources, `save_limit` 1 to 99, window 300,000 ms, eight `mfa_*` events: consistent wherever they
  appear. No stale `rowSeq`, negative count, 391, 386, 42 bytes, 11 KB or `save_limit: 10`. The
  one `CLOCK_ONLY_INTERVAL_MS` left (PLAN:985) is the game-clock sync, its proper use.
- **References to reviews.** None in the plan.
- **Open questions.** 1 to 3 say which option the plan is written to; 4 does not (n5).
- **Siblings.** Core: `save_limit: true`, registered for `refused` (OPS_CORE_PLAN.md:621-624),
  agrees. MFA: signature with `save_limit: false` (:1033), blocked call and registration (:1088,
  :1097-1099), agree; its guard tests are m2. Lock second step: `approver`, `{ npc: }` and the
  `method` list now agree (n2).

## 4. Sibling change list

- **OPS_MFA_HELPDESK_PLAN.md:** lines 1072-1076, the guard tests, per m2's fix (or dropped);
  under m1's preferred fix, the blocked and other `helpdesk_request` calls pass the normalised
  username.
- **OPS_CORE_PLAN.md:** optional wording at line 621 (n4).
- **OPS_LOCK_SECOND_STEP_PLAN.md, OPS_PRIVILEGE_ACCOUNTS_PLAN.md:** none.
- **This plan:** m1, m2, n1 to n5.

## 5. Not checked

- The delta outside sections 5, 7, 9, 11, 13 to 15, except where a grep hit.
- `technique_used` ceilings at a `pc` place and the MFA events' ceilings (the spec in PLAN:796-798
  covers them at build time).
- The cracking and realism skin plans.

## 6. Verdict

No blocker, no major, two minors, five nits. B1 and M2 are closed properly, and the save counter,
the `p` mark and the byte figures check out. m1 is a one-line choice about which form a typed
sign-in username is stored in. m2 is about tests and guard coverage, not a leak. Ready to build
L1a once m1 is settled; m2 can be fixed in the same revision without another full round. Round 7
can be a short check of those two edits and the MFA plan's guard tests.
