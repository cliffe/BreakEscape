# OPS_LOG_ROWS_PLAN round 5 review (delta)

Delta: `git diff ceb248f83 c93305555 -- docs/achitechture/OPS_LOG_ROWS_PLAN.md`. Line numbers are
the plan at `c93305555` (PLAN:n). Code pointers are at the same commit.

## 1. Status of the round 4 items

| R4 | Status |
|---|---|
| N1 lifetime budget | Closed as a design: a fixed window from the first store, reset lazily, reclaim on a full map, validator warning on more than 256 keys, tests at `t + 300_000` and `t + 299_999` (PLAN:506-514). New issues in M2, m1, m2 below |
| N2 MFA blocked row | Closed: MFA plan lines 1027 and 1036-1037 match PLAN:1140 exactly |
| N3 secret list | Closed as a registry (PLAN:803-816). It introduced B1 below |
| m1 route codes | Closed (PLAN:773, PLAN:981) |
| m2 save key and `result` | Closed (PLAN:842-843, PLAN:1092-1093, test PLAN:511 and PLAN:582-586) |
| m3 `x10+` | Partly closed: see m1 |
| m4 reader with its own lock | Closed (PLAN:328, test PLAN:603) |
| m5 matcher | Closed as one matcher (PLAN:818-825); the typed rule it added is B1 |
| m6 error text | Closed (PLAN:827-830, test PLAN:545-546) |
| m7 clamp | Closed (PLAN:800, PLAN:996, test PLAN:533) |
| m8 lock rows | Closed in this plan (PLAN:924-928, PLAN:1064-1069); the lock plan disagrees (M3) |
| m9 `service_checked` | Closed (PLAN:1045) |
| Nits n1 to n8 | n3, n6, n7, n8 (typed `~`) closed; n4 closed (PLAN:908-911); others not rechecked |

## 2. Findings

### B1 (blocker) A typed username equal to a secret writes no row, so the log reader is an oracle for every registered secret

PLAN:751 ("Text equal to a registered secret writes no row"), PLAN:822-825 (`as.typed` compared
exactly "in every environment ... writes no row and answers nil"), PLAN:764-765, and the test that
fixes the behaviour, PLAN:548-549.

The rule is meant to keep a password out of a row. Its effect is that the row's presence tells the
player whether the text they typed is a secret:

1. `signin_fail` is written as `{ typed: }` on every failed sign-in, for real and made-up usernames
   alike, and saves with the method's own save (PLAN:1090).
2. A made-up username gets a fresh failure key and never locks out: `record_login_failure!`
   creates a new entry per key and trims non-account keys (`game.rb:4333-4342`), so the lockout at
   `:4346` never fires for distinct candidates. There is no bound on guesses.
3. The player types candidate strings into the username box at a PC whose source a reader shows,
   opens the reader (one `GET /log_rows`), and every candidate with no FAIL row is a secret. With
   the default `maxRows` of 50 they can test about 49 candidates per read.
4. "Secret" here is the whole union of `OpsLog.secret_values` (PLAN:803-812): every account and
   NPC password, every PIN and code-lock answer, wifi keys, and, once the MFA plan's H1 lands, every
   account's reset password (MFA plan line 1008), all before the player has earned any of them.
   The account lockout is bypassed because the guess goes in the username field, not the password
   field. A four-digit PIN falls to about 200 reads.
5. The same holds for the blocked `helpdesk_request` and blocked `signin_refused` rows, both
   `{ typed: }` (PLAN:1061, PLAN:1093), within their save limits.

A side effect: with an account whose password equals its username (a classic weak-password
lesson), typing that real username writes no FAIL row in any environment, so that account's
failures are never logged.

This breaks the brief's standing rule (OPS_LAYER_BRIEF.md:42-43, "the browser never receives a
secret it has not earned") through a rule the delta added, and it sits in L1a, so L1a cannot be
built as written.

**Fix.** Treat typed text the same whatever it equals. The player typed it, so echoing it back to
the same player reveals nothing; any branch on its value is the leak. Concretely: drop "Text equal
to a registered secret writes no row" from PLAN:751 and PLAN:764-765; in PLAN:822-825 say the
matcher never compares `as.typed`, in the guard, the helper, `assert_ops_log_holds_no_secret` and
`verify-run.rb --ops-log` alike (the leak scanner already skips the IDENTITY cell of a typed row,
PLAN:636); rewrite the test at PLAN:548-549 to "a typed username equal to the account password is
stored like any other typed text, and the response and stored row differ from a non-secret
candidate's only in the text". State in 13.3 "No secret, by type" that `as.typed` is the one place
a row may hold a secret, and only one the player typed. It is also an authentic lesson: real logs
catch passwords typed into the username box. The MFA plan's guard tests for M1a and M3 (its line
1012-1015, a `typed` value set after `note_issued_secret`) then need another vehicle or go; see m6.

### M1 (major) The lock second-step plan writes the reserved key `by` as a detail

OPS_LOCK_SECOND_STEP_PLAN.md:545, `mfa_prompt_approved` detail `by`: `owner`, `held_phone`,
`own_phone`. This plan reserves `by` as a top-level stored key (PLAN:1030-1035) and registers the
detail as `approver` (PLAN:1058, PLAN:1144); the MFA plan uses `approver` (its line 1024). An
unregistered detail key is a malformed call (PLAN:796-801): a raise in test and development, no
row and a warning in production. The lock plan says its rows come "from the same shared
functions" (its line 528), so a builder following the MFA function writes `approver` and the lock
plan's table and tests disagree with the code; a builder following the lock plan's table writes
rows that never store. Same class as R4 N2.

**Fix.** Sibling lock-step must change `by` to `approver` at its line 545. This plan should list
the lock plan in section 14 (it has no request for it today).

### M2 (major) `save_limit` lives only at the call site, so the validator cannot count keys and two callers can disagree on `k`

PLAN:741 makes `save_limit` a call argument. PLAN:441-442 asks the validator to count possible
keys "for each event written with `save_limit:` and each of its limited results". The validator
reads `lib/break_escape/ops_log_events.rb` (PLAN:418), which per 13.5 (PLAN:979-1001) holds
`places`, `results`, `detail` and `label` and nothing about limits. The validator has no way to
know which events and results are limited, so the warning that the delta relies on to make "a full
map should never happen" true (PLAN:894-895) cannot be built from what the plan registers.

The same gap lets two call sites pass different `k` for one event, place and result: the key is
`k`-blind (PLAN:842-843), so a caller with `k = 5` meeting a count of 7 written by a `k = 10`
caller answers nil, and the reader's `xN+` (PLAN:887) cannot know which `k` the count was spent
against. Today the only shared key is quiet `technique_refused` (core plan line 621); a noisy
refusal passes none, which is fine.

**Fix.** Register the limit per result in `EVENTS`, for example `save_limit: { 'blocked' => 10 }`,
and have the helper take `save_limit: true` (or read the registered value when the caller passes
any limit). The validator then counts keys from the file it already reads, the `EVENTS` spec can
check the 1-to-99 range, and one `k` holds per key.

### M3 (major) The lock second-step plan writes `{ npc: ownerId }` on every row; this plan allows it only when the screen names the owner

OPS_LOCK_SECOND_STEP_PLAN.md:531-533 ("`{ npc: ownerId }` on every row, whether or not the owner
has an account. The owner's NPC id ships with the lock"). This plan, PLAN:926-928 and
PLAN:1066-1068: `{ npc: }` only when the lock's second-step screen names its owner, otherwise nil.
One of the two is wrong, and the reader shows the NPC's display name (PLAN:357), which is more
than an id in the bootstrap. If the owner's display name reaches the player only through the log
row, the row hands over something unearned.

**Fix.** The lock plan's editor states what each S8c screen shows about the owner, and either
adopts this plan's rule (nil when unnamed) or says the screen always names the owner, in which
case this plan's conditional can go. Add it to section 14.

### m1 (minor) The `+` mark is lost on reset, ambiguous across sources, and the byte reason for keeping it off the row does not hold

- **Lost on reset.** The `+` shows "while its entry is spent" (PLAN:887, PLAN:359). The entry is
  reset lazily on the next call after the window (PLAN:844-845) and its `rowSeq` then moves to a
  new row (PLAN:885). The old row, whose later calls really were dropped, loses its `+`. R4 m3's
  complaint returns for any place hit again after five minutes.
- **Two meanings of "spent".** Protection needs "spent and window open" (PLAN:866, test
  PLAN:522-524); the display needs only a negative count. A stale negative entry shows `+` while no
  longer protecting the row.
- **Which row.** `rowSeq` is "the `seq` of the row just stored or merged into" (PLAN:885). One call
  has one new `seq`, but a merge in source A raises A's older row (its own `seq`) while source B
  appends with the new one. With two sources taking the event the entry names two different rows.
- **Which identity.** The key ignores `as` (PLAN:843), so ten blocked sign-ins under ten made-up
  usernames are ten rows of `n` 1 and the named row is the tenth username's. It shows `BLOCKED`
  with a `+` the rendering rule does not define for `n` 1 ("`xN` when `n` is above 1", PLAN:359),
  and it attributes the dropped attempts to that one username.
- **Bytes.** The reviser's decision (OPS_LOG_ROWS_DECISIONS.md:44) kept the marker off the row
  because "a row key would push the 391-byte ceiling row past 400". Rebuilt here with every ceiling
  of PLAN:781-785 (`seq` 999999, typed text whose JSON form is 96 bytes plus `"cut":true`, a
  40-character PC id, `n` 99999, `last`, 9-digit `elapsedMs`, 13-digit `serverMs`, no detail), the
  blocked `signin_refused` row is 343 bytes by `to_json.bytesize`, and 347 with `"p":1`. Even at
  the plan's 391, `"p":1` gives 397.

**Fix.** On the store that spends the limit, set `"p": 1` on each row that call stored or merged
into, in every source. Show `x{n}+` (`x1+` allowed, or say `BLOCKED+`) from that flag alone; drop
the reader's lookup into `opsLogSaves`. Keep `rowSeq` only if protection still needs it, or protect
"a row with `p` whose source's entry window is open". Recompute the 391 figure or show how it was
measured.

### m2 (minor) A clock that steps back holds a place spent past five minutes

PLAN:844-845 resets an entry "whose window began five minutes or more ago". If `OpsLog.clock`
steps back (NTP correction, a second app server with a skewed clock), `windowStartMs` sits in the
future and the entry stays spent until real time passes it. Bounded saves are still bounded, but
the place is quiet for longer than the plan claims ("goes quiet only for minutes", PLAN:851).

**Fix.** Treat `windowStartMs > now` as a passed window, and add the case to the save-counter
tests.

### m3 (minor) A declared secret that equals a code word, an id or a username makes the guard raise on a legal, validated scenario

The matcher compares every string under `as` (not `typed`), `where` and `detail` exactly with every
secret (PLAN:818-821). Those fields hold only registered codes, resolved ids and account
usernames, which the type rules admit because they are not secret. A scenario whose password,
PIN or lock answer equals one of them (a password `password` against `method` `password`,
PLAN:981; a password equal to its own username, a classic weak-password lesson; a lock answer equal
to a room id) makes the guard raise on a clean row in development and test. Development is where
playtests run, so the route 500s on a scenario that validated: the validator only warns, and only
for usernames and ids, not codes (PLAN:438-439). PLAN:536's assertion that `secret_values` holds
"no display name, id or username" is then false for that fixture.

**Fix.** Either skip, in the matcher, any value the type rule admitted as a registered code, a
resolved id or a declared username (the guard then guards only what the types could let through),
or make the section 9 check an error in a scenario with `logSources` and extend it to every
registered code. The first is simpler and cannot block an author.

### m4 (minor) "Other code lock" is open, and two existing lock types keep a non-secret `requires`

PLAN:807-808 registers "the `requires` of every pin, password or other code lock (a key or rfid
lock's `requires` names an item, which a row may name)". The code keeps `requires` in the browser
for biometric, bluetooth and rfid because they name a fingerprint owner, a device MAC or card ids,
not answers (`games_controller.rb:2905-2909`). A biometric `requires` is a person's name. If a
builder reads "other code lock" as "every lock that is not key or rfid", those values enter the
registry and m3 bites on display names and ids.

**Fix.** Name the closed list of lock types whose `requires` is a secret (the ones
`filter_requires_recursive` and `strip_lock_answers!` strip: pin, password, and the combination and
cryptex answers), and say biometric and bluetooth are not registered. Replace "other key material"
(PLAN:809) with the field names.

### m5 (minor) This plan says S8 registers seeds and helpdesk answers; the MFA plan registers neither

PLAN:810 ("second-step seeds and helpdesk answers in S8") and PLAN:1150 ("S8 registers its seeds
and helpdesk answers as secret sources"). MFA plan lines 1008-1011: there is no seed field (the
code key comes from the application secret), the recovery answers are deliberately not
registered because they collide with ids and display names, and `creds.resetPassword` is
registered. The MFA plan's reason matches this plan's own rule at PLAN:815-816.

**Fix.** PLAN:810 and PLAN:1150 read "reset passwords in S8b (H1); S8 authors no seed; recovery
answers are not registered, since no row has a field for one". Most of request 5 (PLAN:1134-1152)
is now met by the MFA plan (its line 1058-1060 says nothing further is asked); cut it to what is
still open, if anything.

### m6 (minor) The MFA plan's guard tests rest on the typed rule

MFA plan line 1012-1015: for M1a and M3 the only vehicle for a guard test is "a `typed` value set
after `note_issued_secret`", and it "asserts the guard refuses it". Under this plan a typed match
is not a guard refusal (no raise, PLAN:823-825), and under B1's fix it is stored. Either way the
test does not test the guard for codes or matching numbers.

**Fix.** Sibling MFA: test the guard with a detail value forced to the issued code in a test-only
event (the walk of PLAN:538-543 already does this for every event), and drop the typed case.

### m7 (minor) The lock second-step plan's `method` detail is still not a closed list

OPS_LOCK_SECOND_STEP_PLAN.md:540, `method`: "the unlock method's name". PLAN:1147 asks for a
closed list of codes of at most 16 lowercase characters, and the Array rule (PLAN:995) refuses
anything else. Sibling lock-step must list the codes.

### m8 (minor) A guard raise inside a broad `rescue` commits the grant without its row

PLAN:827-828 raises `ArgumentError` in development and test. Under `with_game_lock`
(`games_controller.rb:2890-2891`, `@game.with_lock`) an escaped raise rolls the transaction back,
so the grant and the row go together: correct. But routes in this controller wrap work in
`rescue => e` (for example `inventory`, `games_controller.rb:1499`, which also renders
`e.message`), and a call site placed inside one would swallow the raise, render an error, and keep
any `save!` made earlier in the request. No call site in 13.7 or 13.8 is inside such a block today.

**Fix.** One sentence in 13.2 step 2: a guard error must reach `with_lock`; a call site inside a
broad `rescue` re-raises `ArgumentError` first. Add a controller test that a malformed call in
development leaves the game row unchanged on a re-read.

### Nits

- n1. Question 1 (PLAN:1161-1172) does not say the body is written to (d), while 2 and 3 do. The
  body is: PLAN:367-369, PLAN:1087. Add "This plan is written to (d)."
- n2. PLAN:1064 "the seven `mfa_*` events"; 13.7 lists eight (PLAN:1053-1060), and the lock plan
  says eight (its line 528).
- n3. Section 7's "Never" list (PLAN:344-347) names `opsLog`, `opsLogSeq` and `opsLogClockAt` but
  not `opsLogOnce` or `opsLogSaves`; section 8 (PLAN:393-394) says "never". Add them. The bootstrap
  is a named-key copy (`games_controller.rb:394-401`), so this is wording only.
- n4. The save window is justified by `CLOCK_ONLY_INTERVAL_MS` (PLAN:849-850). The value is right
  (`state-sync.js:12`, `5 * 60 * 1000`), but it is a client constant with another job. Give the
  helper its own `OpsLog::SAVE_WINDOW_MS` and drop the implied coupling.
- n5. PLAN:438-442: "Warnings:" sits inside a bullet of the errors list, while the real warnings
  list is PLAN:450-452. Move the three warnings there.
- n6. Neither 13.1 nor 13.2 says whether `once: true` with `save_limit:` is allowed. Make it
  malformed.
- n7. `OpsLog::Current` is reset by the Rails executor per request; model unit tests (PLAN:537-538,
  "gone in the next") run outside it, so the test needs `OpsLog::Current.reset` between calls.
  Say so.
- n8. The window is fixed from the first store (PLAN:884), so a burst at the edge allows `2k`
  saves inside a few seconds. Fine as a bound; PLAN:851 "at most `save_limit` extra saves per
  window" is right, but say "per fixed window" so nobody tests it as sliding.

## 3. Answers to the checks asked for

- **Map bound.** 256 entries, keys from validated places and registered results only (PLAN:893-
  894); the player cannot invent a key. Entries never leave except by reclaim on a full map, so
  the map holds its high-water mark, at most 42 bytes each (rebuilt here: 42 exactly; the
  decisions file says 41) and about 11 KB. Neither map reaches the browser or a sync body. No
  growth path found beyond the bound; the validator half of the bound is M2.
- **Real time and gains.** Real time decides only whether a row stores, which row is protected
  from eviction, and the `+` mark. Nothing gates on a play row (PLAN:407-408), and no caller in
  13.7 or 13.8 branches on the Result for anything but its save. Holds.
- **Negative count.** Sound across reload (server-only, server time) and eviction of the named row
  (a dangling `rowSeq` is harmless). The redundant "or `count` at `k` or more" (PLAN:845-846)
  matters only when `k` varies by caller (M2). Clock step-back is m2; the mark's lifetime is m1.
- **5 minutes = `CLOCK_ONLY_INTERVAL_MS`.** True, `public/break_escape/js/state-sync.js:12`, used at
  `:724`.
- **Secret to a row or `/log_rows`.** Typed rules hold for every non-typed field. `as.typed` is the
  only path, and the delta's rule for it is B1. `note_issued_secret` covers only the request that
  computes a code; across requests the type rules are the defence, as PLAN:813-814 says.
- **Guard on a non-secret.** Yes, when a declared secret equals a code, id or username (m3, m4).
- **Guard raise mid-route.** Rolls back cleanly under `with_lock`, unless swallowed (m8).
- **Numbers after the trim.** 256, 42 bytes, about 11 KB, 300 rows, 400 bytes, 120 and 128 KB, 30
  sources, ids 40, accounts 32, typed 32 characters and 96 bytes, count max 9, `save_limit` 1 to 99,
  window 300,000 ms: consistent everywhere they appear. The 391-byte ceiling is not reproducible
  (m1). Event names are snake_case throughout. Only n2 is a count error.
- **Open questions.** 1 does not say it is written to (d) (n1); 2 and 3 do.
- **Siblings.** Core: signature (its line 1561-1562), quiet `technique_refused` with
  `save_limit: 10` and noisy with none (its lines 619-625, 1588, 1641), newest-10 merge: agree.
  Privilege: `once: true` on `admin_profile_read`, `{ count: 9 }`, hash registration (its lines
  892-901): agree. MFA: signature, blocked desk call, `approver`, `route` without relay (allowed by
  R4's alternative), number range 10 to 99: agree; secret sources disagree with this plan (m5) and
  its guard tests (m6). Lock second step: `by` (M1), `as` (M3), `method` (m7), event count (n2).
- **Code claims in the delta.** Checked and right: `interactions.js:1585-1597` (log-filter
  terminal), `state-sync.js:12`, `games_controller.rb:2442` (`SYNC_STATE_COLUMNS`; the plan cites
  2436-2442, comments plus the constant), `game.rb:3182` (`login_scope_of`), `game.rb:323`
  (`object_in_unpromoted_route_room?`), `game.rb:2721-2723` (`normalise_username`),
  `container-minigame.js:2326-2331`. Not checked: `game-clock.js` lines, `game.rb:6142`, `:6209`,
  `validate_scenario.rb:902-950`.

## 4. Sibling change list

- **OPS_LOCK_SECOND_STEP_PLAN.md:** line 545 `by` to `approver` (M1); lines 531-533 the `as` rule
  (M3); line 540 a closed `method` list (m7).
- **OPS_MFA_HELPDESK_PLAN.md:** lines 1012-1015 guard tests for M1a and M3 (m6).
- **OPS_CORE_PLAN.md, OPS_PRIVILEGE_ACCOUNTS_PLAN.md:** none.
- **This plan:** B1, M2, m1 to m5, m8, nits; add the lock plan to section 14.

## 5. Not checked

- The diff hunk by hunk outside sections 5 to 15; sections 1 to 4 only where a grep hit.
- The cracking and realism skin plans.
- What the S8c screens show about a lock's owner (M3).
- Whether `opsLogSeq` is consumed by merged calls; if so it can pass 6 digits after a million
  calls and the byte ceilings move by one.

## 6. Verdict

One blocker, three majors, eight minors, eight nits. The blocker is in the delta and in L1a: the
rule meant to keep a typed password out of a row turns the reader into an unbounded oracle for
every registered secret. Its fix is a deletion. M2 is the one structural change (register limits
in `EVENTS`). M1 and M3 are sibling edits to the lock second-step plan, which section 14 does not
yet address. The save window itself is sound.

Not ready to build L1a until B1 and M2 are fixed. Round 6 can be a short delta on 13.1, 13.2 steps
2, 4 and 6, the save-counter and secret tests in section 11, and the lock plan's section 13.
