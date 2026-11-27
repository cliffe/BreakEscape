# OPS_LOG_ROWS_PLAN round 4 review

Plan reviewed: `docs/achitechture/OPS_LOG_ROWS_PLAN.md` at HEAD of `docs/ops-layer-plan` (1268
lines), against `4ff0372e6`. Plan lines are written `PLAN:n`. `GM` = `app/models/break_escape/game.rb`,
`GC` = `app/controllers/break_escape/games_controller.rb`. Sibling plans were read in their
working-tree state, log section only, plus greps for single facts (line numbers given).

Sections 11 and 13 were read end to end. Sections 1 to 10, 12, 14 and 15 were read once as well.

Counts: blocker 0, major 3, minor 9, nit 8.

## 1. Status of the round 3 items

| R3 | Grade | State | Note |
|---|---|---|---|
| M1 secret list is not the scanner's | major | closed, with a new gap | The list is the module's own, holds no names, matches exactly, L1a is sized M (PLAN:140, PLAN:895-910, PLAN:726-730). What it must hold for sibling secrets is unenforced (N3) |
| M2 `:integer` admits a PIN | major | closed, done differently, holds | `{ count: max }`, max 9, checked in production, spec fails anything else (PLAN:1050, PLAN:1081, PLAN:630-631). The privilege plan caps cached pairs at 8 per PC (its line 657), so 9 is enough. See m7 for what happens above 9 |
| M3 merge window does not bound saves | major | bound closed, done differently; new problem | Saves are now bounded: at most `save_limit` per key, at most 256 keys. The price is a place that goes dark for good (N1) |
| M4 `helpdesk_request` leaks account existence | major | closed here; sibling not updated | 13.7 is typed for every result with `save_limit: 10` per desk (PLAN:1117). The MFA plan still says `once: true`, which this plan now refuses (N2) |
| m1 class 1 evicts a first row | minor | closed | PLAN:932-937, test PLAN:608-609. Residual in m10 |
| m2 who pays for a global cap | minor | closed | Clamp at read (PLAN:180), guard evicts from the appended source (PLAN:943-945), section 8 points there (PLAN:494-495) |
| m3 when the once digest is added | minor | closed | Added in step 6 once stored; `once:` refused with typed (PLAN:822, PLAN:947). One wording slip (n2) |
| m4 no-scope reach rule | minor | closed, with a gap | Named as `/log_rows`'s own rule, symbol return, byte-identical check 6 (PLAN:395-409, PLAN:582-583). The reader's own lock is skipped (m4) |
| m5 sibling mismatches | minor | partly | Fixed in this plan: `mfa_code_locked`, `approver`, one route list, `admin_profile_read` bound, quiet `technique_refused`. Still open on the sibling side, and `service_checked` now disagrees the other way (section 4, m9) |
| m6 page-load clock claim | minor | closed | Claim dropped, ten-second skip (PLAN:1013-1017, PLAN:256) |
| m7 guard scans counters | minor | closed for the guard | PLAN:902-904. The test helper is not defined the same way (m5) |
| m8 share row decided silently | minor | closed | Question 3, `share_folder_opened`, oldest admitting session with a test (PLAN:1171-1178, PLAN:668-671) |
| m9 tests that pass on a wrong build | minor | closed | Rotation, evicted spent row, merged first row, two guard runs, two sessions, checks 5 and 6 (PLAN:598-629, PLAN:577-583) |
| n1 row id reversible | nit | closed | Ten hex characters of an HMAC over game id, source id and seq (PLAN:439). See section 3 |
| n2 `where.objects` missing in step 3 | nit | closed | PLAN:915 |
| n3 "L2" for L2a/L2b | nit | open | PLAN:181 and the 4.2 heading (PLAN:189) still say L2 |
| n4 lockout sits with successes | nit | closed | PLAN:936 |
| n5 "x10+" in one place only | nit | removed, not fixed | No "+" anywhere now; a spent row reads `DENIED x10` (m3) |
| n6 `service_checked` bound | nit | changed, now wrong | See m9 |

Earlier items R3 left partly closed: A1 closed (N3 aside), A2 closed, F1 closed, B3 open on the MFA
plan's side only, B4 closed bar wording in the core plan.

**"Done differently" decisions.** M2, M4, the two m5 rulings, m8 and n1 hold. M3 holds as a bound
on saves and fails as a logging rule (N1). The trim was not applied in effect: the plan grew from
1249 to 1268 lines.

## 2. New findings

### N1 (major) `save_limit` is a lifetime budget, so ten cheap refusals switch a place's logging off for the rest of the game

PLAN:823, PLAN:919-922, PLAN:950-954. The count is per event and place, never reset, never evicted.
After ten stored calls every later call for that event at that place is dropped.

What that allows:

1. **A dark place.** Ten denied swipes at a door, and no later denied swipe there is ever recorded.
   Ten blocked sign-ins at a PC, the same. The count ignores `as`, so the ten can be spent on
   made-up usernames and a later blocked attempt under a real one leaves nothing.
2. **Erasing the evidence as well.** The spent row is a refusal with `n` above 1, which is eviction
   class 1, the first to go (PLAN:934), unless it happens to be the first row of its event. A
   sign-in source floods cheaply: each made-up username writes a fresh `signin_fail` row on a
   branch that already saves (PLAN:1159; failures are recorded for non-accounts, `GM:4333`). Fifty
   of those in a default source push the `BLOCKED x10` row out. The source then holds no blocked
   row for that PC and never will.
3. **No sign that anything was dropped.** The row stops at `x10` with a stale `last` time (m3).

Nothing gates on a play row today (PLAN:502-503), so no puzzle breaks. The cost is to what the
feature teaches ("failed attempts are visible", PLAN:18-19) and to the parked defence and
investigator work, which read these rows on the server (PLAN:26-32, PLAN:1004): a detection rule
over refusals can be blinded for ten requests.

**The 256-key map.** It cannot be filled cheaply. Keys come from validated places only, and only
four events use `save_limit` (denied `badge_swipe`, blocked `signin_refused`, quiet
`technique_refused`, blocked `helpdesk_request`), so the key count is at most rfid locks plus
sign-in PCs plus hosts plus desks. A player cannot invent a place. A scenario with more than 256
such pairs would lose rows silently, and nothing in section 9 counts them. So "drops new keys when
full" is a guard that should never fire, and the plan should say so and make the validator prove
it. The real exposure is per key, above.

**Fix.** Make it a budget over server time instead of a lifetime count:

- `opsLogSaves[digest] = [count, windowStartServerMs]`. A call past `save_limit` inside the window
  is dropped as now. When the window (say ten minutes of `serverMs`) has passed, the entry resets.
  The bound becomes "at most `save_limit` saves per event, place and result in any ten minutes",
  which still stops a save loop, and no place stays dark.
- A full map drops entries whose window has passed before it refuses a new key.
- Validator error in a scenario with `logSources` when limited events times their places exceeds
  256.
- Exempt a row at its `save_limit` from eviction classes 1 and 2 while its window is open, or
  accept the loss and say so.
- Tests: a spent key stores again after the window; a spent row survives the PLAN:608 flood.

If the lifetime budget is kept on purpose, state the blind spot in 13.3 and section 1, and tell
the defence outline that refusal counts past ten are not in the log.

### N2 (major) The MFA plan's blocked `helpdesk_request` is now a malformed call

PLAN:822 refuses `once:` with `as: { typed: }`. The MFA plan (its lines 1270 and 1239-1240) still
writes the blocked row with `once: true` and `as: { typed: }`, and still names `merge_limit:` in
the helper's signature. Built as written, that call raises in the MFA plan's own tests and, in
production, writes nothing and logs a warning on every request at a closed desk. The request is in
section 14 (PLAN:1226-1227); the finding is that both plans cannot be built as they stand. The full
list is in section 4.

### N3 (major) The secret list names sibling secrets no stage can yet supply, and nothing fails when a sibling leaves one out

PLAN:895-900 lists hashes, MFA seeds, issued second-step codes, matching numbers and helpdesk
answers. PLAN:140 puts the list in L1a, and the L1a test (PLAN:619-621) wants the fixture to hold
"a hash, an MFA seed, an issued code and matching number, a helpdesk answer". L1a lands before S5b,
S7 and S8 (PLAN:146), so those scenario fields and state keys do not exist when the test is
written. PLAN:789 and PLAN:1200 hand the job to each sibling. None of the three sibling plans
mentions `secret_values` anywhere (grep: no match in the core, privilege or MFA plan).

Coverage by kind, as the plans stand:

| Secret | In the list as written | Problem |
|---|---|---|
| Passwords, credential values, PINs, code-lock `requires`, wifi keys | yes, from existing fields | none |
| Hashes (S5b, S7) | named | no field at L1a; the privilege and cracking plans do not add it |
| Second-step codes | named as "issued" | they are derived per time window, not stored (MFA plan line 289-291). A list built at one moment holds the current windows only, so `verify-run.rb --ops-log` after a run and the leak scanner over a saved body cannot know the codes that were live when a row was written |
| Matching numbers | named as "issued" | derived by HMAC from a nonce (MFA plan line 292-295); the list has to recompute them for every pending record and nonce so far |
| Helpdesk answers | named | no field at L1a; the MFA plan does not add it |
| A lock's first factor under S8c | covered by code-lock `requires` | none |

The type rules are the real defence and are tested with the guard off (PLAN:624-626), so this is
not a leak today. It is a second line that exists on paper for exactly the secrets added later.

**Fix.** (a) L1a builds and tests the list for the secrets that exist now, and says so in PLAN:140
and PLAN:619-621. (b) Give the list a registry: each plan adds one lambda to
`OpsLog::SECRET_SOURCES` beside its `KINDS` entries, and a spec fails when a schema field marked
secret (an `x-secret: true` annotation, or a fixed list of field names kept in
`ops_log_events.rb`) has no source. (c) Say that for derived values the source returns every code
and number the game could have issued so far, or drop derived values from the list and state that
`{ count: 9 }` and the absence of free text are their only defence. (d) Add the request to each
sibling in words they can act on (section 4).

### m1 (minor) Leftover `local` and `remote` route codes in section 13

PLAN:854 (stored row example, `"route": "local"`), PLAN:1033 (`'route' => %w[local remote]` in the
`EVENTS` example). 13.7 and 13.8 use the shared list `keyboard`, `foothold`, `from`, `relay`
(PLAN:1136-1137, PLAN:1158). The "204 bytes" at PLAN:859-860 was measured with `local`; with
`keyboard` the same row is 207. Fix the two examples and the number.

### m2 (minor) The save key leaves out `result`, and one unsaved branch is still bounded by merging

The key is event and `where` (PLAN:919-920). `signin_refused` has two branches at one PC: blocked
(`save_limit: 10`, PLAN:1162) and denied (PLAN:1161), which saves only on `r&.stored?` and is
bounded by "merged repeats". 13.3 says such a branch is bounded by `once:` or `save_limit:`, "never
by merging" (PLAN:972-974). A player with the right password for an account the PC does not admit
gets one save per request up to `n` 99999. That is no worse than wrong-password attempts, which
already save, but it breaks the plan's own rule, and giving the denied branch a `save_limit` today
would spend the blocked branch's budget, since both share a key. Fix: key on event, `where` and
`result`; give denied `save_limit: 10`; add a test with two results of one event at one place.

### m3 (minor) A spent row shows `x10` and nothing says more happened

R3 n5 asked for the "x10+" display to be stated in the viewer text. It was removed instead: PLAN:444
and PLAN:344 show `xN` only. Ten denied swipes and ten thousand read the same, with the time of the
tenth. Fix: when a call is dropped at a spent limit and its row is still in the window, show the
count as `x10+`. That needs no save: the helper can mark the row on the store that spends the
limit.

### m4 (minor) A reader with no scope is judged without its own lock

PLAN:405-409: `room_unlocked?`, not in an unpromoted route room, `path_unlocked?(path)` over the
containers above. The scoped branches use `path + [object]` (PLAN:401-402, `GC:650`, `GC:657`).
`path_unlocked?` tests each element's `locked` flag against `unlockedObjects` (`GM:3310-3313`), so
leaving the reader out means an `ops_log_terminal` that carries its own lock in a room answers
`/log_rows` to a direct request without being unlocked. Nothing in section 9 forbids a lock on a
reader. Fix: use `path_unlocked?(path + [object])` in the unscoped rule too, add the case to the
controller test list (PLAN:674-680), or make a lock on an `ops_log_terminal` a validator error.

The rest of the reach rule matches the code read (`GC:638-679`): resource scope first, then the
sign-in PC and profile branch with `folder_route_allowed?`, then the unscoped path, which
`/container` judges with `check_container_unlocked`.

### m5 (minor) The secret tests are not written to the guard's own match rule

- PLAN:621-623 sets `as` to each secret. In the `{ typed: }` form that is a legal call, and the row
  stores the secret as the typed username, so "stores a row in which no secret appears"
  (PLAN:625) fails on a correct build, or the walk has to skip `typed` without saying so.
- `assert_ops_log_holds_no_secret` runs over `opsLog.to_json` (PLAN:627). The guard skips `seq`,
  `n` and the times (PLAN:903-904); the helper's rule is not given. A token scan of the JSON hits
  a short numeric secret in `seq` or `serverMs`.
- `verify-run.rb --ops-log` "exits 1 if any stored row holds a declared secret" (PLAN:701-702) and
  the leak scanner reads `/log_rows` bodies (PLAN:707-708). A player who types a password into the
  username box, which blind playtesters do, fails both on a correct build.

Fix: define one matcher (string values under `as` other than `typed`, `where`, `detail`, exact) and
use it in the guard, the helper and `verify-run`. For the scanner over response bodies, state that
the IDENTITY cell of a typed row is skipped. Say in the walk that `typed` is exercised separately:
it stores the text, cut, and nothing else.

### m6 (minor) The guard's error text is not specified, and it can carry the secret

PLAN:904-905: "a hit raises `ArgumentError`". An obvious message is the value that matched. In
development that goes to the browser in the error page of a game route and to the log; in CI to the
test output. Fix: the message names the event, the key path and the kind of secret, never the
value, and a test asserts the raised message contains none of the fixture's secrets. The
production warning line (PLAN:906-907) should be held to the same rule; it "names the event" only,
which is right.

### m7 (minor) A count above its maximum drops the whole row

PLAN:1050: a value above `max` is a malformed call, so nothing is written. For
`credentials_harvested` that loses the row for the largest harvest. It cannot happen while the
privilege plan caps pairs at 8 per PC (its line 657), but the two numbers live in two plans.
Fix: the helper clamps a count to `max` and marks it (shown `9+`); a negative or non-integer value
stays malformed. No sibling row needs a number above 9: the only counts registered are `count` and
`hashes` on `credentials_harvested`. A second point for the guard: counts are compared with
numeric secrets (PLAN:903), so a fixture with a one-digit PIN raises on a clean harvest row. Say
that numeric secrets under 10 are not compared, or make a one-digit secret a validator warning.

### m8 (minor) S8c rows put the lock owner's account username on a door or object row

The MFA plan's S8c text (its lines 1283-1284) writes `as: { account: username }` when the lock's
owner has credentials, `{ npc: ownerId }` otherwise. 13.7 mentions only the NPC form
(PLAN:1120-1122). At a sign-in the player typed the username. At a lock the player presented a
PIN or card and the server looked the owner up, so the log row hands the player a username they
never entered. The "nothing unearned" rule (PLAN:986-989) covers accounts "because the player
reaches the row only by acting on that thing"; here they acted on a lock. The MFA plan sends the
browser the lock's display name only (its line 843).

Fix: lock rows take `{ npc: }` always, shown as the display name, and 13.7 says why that is earned
(the second step names its owner to the player, if it does) or the row takes nil. Not checked:
what the S8c screens show about the owner, and whether any NPC's display name is withheld until
met.

On the other parts of this check: `door` and `object` places and the `folder` detail only ever name
the thing the request acted on, after validation, so they reveal nothing new. `{ npc: }` on a badge
row follows `rfid_unlock_card_answer` and question 1. `{ card: }` names a held item.

### m9 (minor) `service_checked` bound in 13.7 no longer matches the core plan

PLAN:1101: "one per check that adds a finding; findings per service are capped by the scenario".
Core plan line 1550: written "when the service is newly added to `opsDiscovered.services`,
whatever the check found", bound "once per service". The core plan is the owner and its rule is a
real bound. Fix here: "once per service (caller)".

### Nits

- n1. PLAN:181 and the heading at PLAN:189 say "L2"; the stages are L2a and L2b (R3 n3).
- n2. PLAN:604 "the digest is added only when a row was appended"; PLAN:947 "when any source
  stored". Pick "stored".
- n3. `save_limit` has no stated range; PLAN:483 and PLAN:951 assume under 100. Say 1 to 99 in
  13.1 and refuse anything else.
- n4. PLAN:967-970 ("Bounded") lists once, merged repeats and feature caps, not `save_limit`.
  PLAN:662 says a lock "logs granted"; the result is `ok`.
- n5. PLAN:1016-1017 is one over-long line. PLAN:1021 lists S7 among plans that pass no time; S7
  writes no rows.
- n6. PLAN:180: the clamp is defined for at most 30 sources. A stored snapshot is not re-validated,
  so say the helper ignores sources past the thirtieth.
- n7. PLAN:439: "keyed from `secret_key_base`". Derive a purpose key
  (`key_generator.generate_key('ops_log_row_id')`) instead of using the base secret directly.
- n8. PLAN:465 says the typed username is "normalised"; PLAN:833 does not lower-case it and adds a
  trailing `~` that section 7 (PLAN:442) omits. First-row protection is per event, not per event
  and result, so the first `denied` badge row after an `ok` one is unprotected; PLAN:940-941 could
  say so.

## 3. Answers to the checks not covered above

- **Caps and counts across sections 8, 11 and 13.** 400 bytes per row, 128 KB guard over a 120 KB
  ceiling, 300 rows, ids 40, accounts 32, typed 32 characters and 96 bytes, `opsLogOnce` 256,
  `opsLogSaves` 256, count max 9, 30 sources: the same everywhere they appear. A ceiling-filled
  `technique_used` row recomputed here is 388 bytes against the plan's 386, an S8c
  `mfa_prompt_approved` row 360; both under 400. No `merge_limit`, `share_file_read`, `:integer`
  or detail key `by` is left in this plan. Leftovers found: m1 only.
- **Play row ids.** 40 bits over at most 150 rows in a reader: a collision chance near one in ten
  billion per reader. The input holds no content, and without the key the browser cannot recover
  `seq`; rows arrive in `seq` order anyway, so order is not a secret. Ids repeat after a reset by
  design (PLAN:491-493). Holds.
- **First-row protection and the cap.** A source holds at most one first per event, so with
  `maxRows` at least the number of events it takes, class 4 is reached only when every row is a
  first, which cannot be over the cap. The claim at PLAN:938-941 is right. With `maxRows` equal to
  that number and every first present, each new row is evicted in the call that appended it, the
  call answers `stored?` and its `save_limit` count goes up for a row that no longer exists. The
  minimum `maxRows` of 10 makes that a corner; the validator warning (PLAN:535-536) could ask for
  a margin.
- **Tests against the rule they test.** PLAN:597 (A, B twenty times, `n: 10` each), PLAN:598-602,
  PLAN:608-611 (clamp 150, 140, 10), PLAN:657-659 and PLAN:664 agree with 13.2 and 13.8.
  Mismatches: m5, n2, n4.
- **Open questions.** All three are real choices with options and a recommendation. Question 1 has
  four options and the body is written to (d); question 3 says the body is written to (a);
  question 2 should say the same of its (a). The lifetime budget in N1 is an engineering call, not
  a user question, unless the orchestrator wants the blind spot kept as a teaching point.

## 4. Sibling change list

One line each, for the next editor of that plan.

**OPS_MFA_HELPDESK_PLAN.md (section 13, lines 1237-1291)**

- sibling MFA must change the helper signature at 1239-1240 from `merge_limit:` to `save_limit:`.
- sibling MFA must change the blocked `helpdesk_request` bound (1270) from `once: true` to
  `save_limit: 10` per desk, and its Saved by cell from "one time per desk, typed username and
  `what`" to "at most ten times per desk".
- sibling MFA must change the `mfa_prompt_approved` detail key (1267) from `by` to `approver`.
- sibling MFA must change the `mfa_challenge` `route` codes (1262) from `keyboard`, `foothold`,
  `from` to the shared list `keyboard`, `foothold`, `from`, `relay`, or state that a challenge is
  never started over a relay.
- sibling MFA must change the S8c `method` detail (1285-1286) from "`password`, `pin`, `rfid` and
  so on" to a closed list of codes, each at most 16 lowercase characters.
- sibling MFA must change the S8c `as` rule (1283-1284) to match whatever m8 settles (this plan
  proposes `{ npc: }` for every lock row).
- sibling MFA must add: each stage that adds a secret (seed, code, matching number, helpdesk
  answer) registers it with `OpsLog.secret_values`; and state the matching number's range as 10
  to 99.
- sibling MFA must change the bullet at 1243-1246 to add "or `save_limit` is spent" to the cases
  that answer nil.

**OPS_CORE_PLAN.md (section 13, lines 1524-1563)**

- sibling core must change the `technique_refused` bound (1553) from "up to the log plan's bound
  per event and place" to "merged repeats; a quiet refusal is written with `save_limit: 10`; a
  noisy one has no limit and keeps the route's save".
- sibling core must change 1558-1559 from "An exact repeat of a source's newest row merges" to
  "a repeat of one of a source's 10 newest rows merges".
- sibling core must change the signature at 1526-1527 to include `once:` and `save_limit:`.
- No change needed, now met: `from` as kind `foothold` (1538-1540), `pc` as a place, the alias,
  service names on the id pattern at most 40 (its lines 282, 1049), host keys at most 40 (its
  line 1086).

**OPS_PRIVILEGE_ACCOUNTS_PLAN.md (section 13, lines 881-900)**

- sibling privilege must change the `admin_profile_read` bound (890) from "one per PC and
  profile" to "one per PC, profile and account".
- sibling privilege must change the `credentials_harvested` detail (892) from "integers" to
  "`{ count: 9 }` each; a collect adds at most 8 pairs (section 9 cap)".
- sibling privilege must add: S5b registers hash values with `OpsLog.secret_values`.
- sibling privilege must change 883 from "until it lands the call is a no-op" to "the helper
  lands first (L1a)", since L1a precedes every sibling stage (PLAN:146).

**OPS_CRACKING_PLAN.md (section 13, lines 311-319)**, not one of the three asked for, seen in
passing: it still lists `hash_obtained`, `crack_run`, `crack_yield`. Sibling cracking must change
that table to one line, "S7 writes no rows", and add that S7 registers cracked and hash values
with `OpsLog.secret_values`.

**This plan must change:** PLAN:1101 (m9), PLAN:1120-1122 (m8), the two route examples (m1).

## 5. Trim list

Target under 1150 from 1268. The fixes above add about 15 lines, so cut about 135.

| Lines | What | Cut to | Saves |
|---|---|---|---|
| PLAN:26-36 | parked readers, sibling rows | 5 lines | 6 |
| PLAN:44-71 | log-filter and siem internals | 8 lines: client-side, authored, fixed types, siem is a timed game | 20 |
| PLAN:95-97 | copied-card guarantee | a pointer to section 7 | 3 |
| PLAN:99-124 | game time, server-only state, rev, schema | 14 lines; 13.4 and section 6 hold the detail | 9 |
| PLAN:126-132 | log-filter fixed paths, harness copy lists | cut; 5.2 and section 12 step L2a.4 hold both | 7 |
| PLAN:146-150 | stage order | 3 lines | 2 |
| PLAN:226-230 | why `rowId` is a seed row | 3 lines | 2 |
| PLAN:247-260 | clock stamp | the three call sites, 7 lines; 13.4 holds the rule | 7 |
| PLAN:283-302 | `#unlock` branches | 12 lines; bounds and saves are in 13.8 | 8 |
| PLAN:327-333, 376-377 | why not extend log-filter | 3 lines | 6 |
| PLAN:362-374 | opening from a container | 9 lines | 4 |
| PLAN:418-425 | presence paragraph | 4 lines | 4 |
| PLAN:494-501 | byte caps, where rows live | 3 lines | 5 |
| PLAN:710-712 | `verify-run` sizing | cut; section 12 L1a.6 names it | 3 |
| PLAN:862-881 | cap calculation | the field ceilings, two table rows, the spec sentence | 8 |
| PLAN:938-954 | step 6 prose | 12 lines; section 8 has the sizes | 5 |
| PLAN:1084-1091 | 13.6 | 4 lines | 4 |
| PLAN:1133-1148 | why `from`, S6, S7 | 7 lines | 9 |
| PLAN:1171-1178 | folder row | 4 lines; question 3 has the reasoning | 4 |
| PLAN:1194-1202 | request 1 | 6 lines | 3 |
| PLAN:1205-1214 | request 3, core | 3 lines: `save_limit: 10` on the quiet refusal, the newest-row wording, the signature. Met and to drop: `pc` kind, `network_alerted`, alias, closed lists, `from` and its kind, 40-character ids, service id charset, the `KINDS` entries | 7 |
| PLAN:1215-1223 | request 4, privilege | 3 lines: bound wording, `{ count: 9 }` wording, `secret_values`. Met and to drop: both renames, `signin_refused` and `kind`, `once: true`, no cutting, `device` list, doubled header | 6 |
| PLAN:1232-1237 | requests 6 to 8 | 3 lines; the reserved `by` is already in 13.6 | 3 |

About 135 lines. Request 5 (MFA) stays whole: none of it is met yet.

## 6. Not checked

- Byte figures in the ceiling table other than the two recomputed.
- Code behind `logout_session!`, `lock_session!`, the `rfid_*` helpers, `session_admits?`,
  `check_container_unlocked`, the sync key filter and the bootstrap key list.
- Client line references in 5.2 and the validator and graph references in section 9.
- Sibling plans outside their log sections, apart from the single lines cited. The realism skin
  plan was not opened.
- What the S8c screens tell the player about a lock's owner (m8).
- The raw diff was not read hunk by hunk; the plan at HEAD was read whole and compared with the
  R3 line references.

## 7. Verdict

No blocker. Three majors: one design choice in the new save counter (N1), one cross-plan
contradiction that stops the MFA plan's blocked row from being written at all (N2), and a secret
list whose sibling half exists only as a sentence (N3). None moves a stage or a route. The R3
majors are closed as bounds; the reviser's alternative for M3 needs one more turn.

Not ready to build L1a until N1 and N3 are settled, because both change the helper's stored state
and its L1a tests. Round 5 can be a short delta on 13.1 to 13.3, the save-counter and secret
tests in section 11, PLAN:405-409, and the three sibling tables after their editors apply
section 4.
