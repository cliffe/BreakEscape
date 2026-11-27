# OPS_LOG_ROWS_PLAN round 2 review

Plan: `docs/achitechture/OPS_LOG_ROWS_PLAN.md` (930 lines, revision after R1). Adversarial review,
round 2. All seven checks done. The plan was not edited.

Short names: `GM` = `app/models/break_escape/game.rb`, `GC` =
`app/controllers/break_escape/games_controller.rb`, `PLAN` = the plan, by section or line.

Totals: 0 blockers, 7 majors, 14 minors, 3 nits. R1 majors: 3 closed, 5 partly closed, 0 open.

The three that matter most:

1. **F2**: the line that stamps `opsLogClockAt` sits in `merge_scenario_clock!`, which runs only on
   the narrow sync row with no `scenario_data`, so "when the scenario has `logSources`" cannot be
   evaluated there. As written every row gets a stale time, or the sync raises.
2. **A2**: the helper never saves, and three kinds of call site have no save of their own (`GET
   /container` reads, the `notPermitted` and locked-out returns in `attempt_login!`). Those rows are
   lost, or each needs a new whole-state save.
3. **B1/B2**: 13.7 no longer matches the privilege plan (dotted names, different rows, results and
   bounds), and the "file read on a share" row the orchestrator gave this plan does not exist in it.

---

## Check 1. Closure of the round 1 majors

| R1 | Finding | State | Why |
|---|---|---|---|
| S1 | Size figure half the real one | partly closed | Rows are measured now (204 to 297 bytes, PLAN 13.1). The measurement assumes a 32-character typed username; `normalise_username` keeps 64 characters of any kind (`GM:2721-2723`), so the worst row is about twice the budget. See A4 |
| S2 | One global cap lets a noisy event erase the rest | partly closed | Per-source caps stop one source erasing another. Inside one source, alternating two different rows defeats the merge and pushes out every earlier row. See F1 |
| R1 | Reach check misses where a reader can be | partly closed | The chain walk is there (PLAN 6 step 3). A reader under a sign-in PC is specified with the wrong check, and the "readable for the rest of the game" claim is false for a session-gated reader. See V1 |
| H1 | Badge rows keyed on the request's `method` | closed | Rows key on the resolved lock, `already_open` is computed for every rfid request, refusals need reach. One stale reading of the code remains (F3, minor) |
| H2 | `start_login_session!` carries non-sign-ins | closed | `signin_ok` only for `password` and `credential`; a malformed call does not raise in production (PLAN 13.2 step 2) |
| T1 | Lag up to five minutes | partly closed | The design is right (server estimate, `seq` for order). The stamp cannot be written where the plan puts it (F2), and a reload leaves a gap (F4) |
| V1 | log-filter needs more than new columns | closed | Separate `ops-log` viewer; the reuse claims hold against the code (V4) |
| C1 | Helper cannot express the siblings' rows | partly closed | The shape can carry every row on paper. The siblings as revised do not use it the way 13.7 says (B1 to B5) |

The partly acted ones (`OPS_LOG_ROWS_DECISIONS.md`):

- **S1, keep `where` as `{ kind:, id: }`**: the reason holds. Ten kinds, a nil place and a per-event
  check need a structured value, and the cost is about 20 bytes a row.
- **C1, no `target:` or `n:` arguments**: holds. It follows an orchestrator ruling, and registered
  detail keys do carry the second thing, the count and the request number. The price is that
  detail is now where secrets can hide (A1).
- **C1, cracking writes no rows**: holds as a ruling. The cracking plan has not caught up
  (`OPS_CRACKING_PLAN.md` section 13 still lists `crack_run` and `crack_yield`); that is for its
  reviser, not this plan.
- **O3, no `actor` on seed rows**: holds. User decision 1 rules out an actor concept and 13.6 gives a
  later path with no migration.

---

## Check 2. The helper (13.1 to 13.6)

### A1 (major) Nothing but prose stops a secret going into `detail` or `as`

13.3 says "No secret". The helper cannot enforce it and no test would fail:

- `:text` accepts any 40 characters of `[A-Za-z0-9_.:@-]` (PLAN 13.1). Most passwords, a hash
  prefix and a PIN all fit.
- `:integer` accepts 0 to 99999. `mfa_prompt_sent` registers `request` as an integer (PLAN 13.5);
  the helper cannot tell a request counter from the number a push asks the user to match, which
  the MFA plan says must never be in a row (`OPS_MFA_HELPDESK_PLAN.md` section 13, last paragraph).
- `as: { typed: }` is free text with no rule at all.
- The only secret test is this plan's own controller test over its own fixture (PLAN 11, "no
  response body contains a password..."). It does not cover a sibling's rows, and it looks only at
  `/log_rows` answers, not at stored `show: false` keys that a later debrief will show.

Fix:
1. Drop `:text` as a detail rule. The one use (S2's `service`) becomes `{ id: 'service' }`, shown by
   name. Detail values are then closed codes, ids or integers.
2. Add one shared assertion, `assert_ops_log_holds_no_secret(game)`, that scans
   `player_state['opsLog'].to_json` and the client rows for every secret the scenario declares
   (passwords, PINs, credential values, hashes, MFA answers, lock `requires`). Section 14 request 1
   should require each plan's `test_ops_*` tests to call it.
3. Make `verify-run.rb --ops-log` run the same scan and exit 1 on a hit, so every scripted
   playtest checks it on the real path. `tools/playtest/access-leak-check.rb` already builds a
   secret list for responses; reuse it.
4. In test and development only, the helper can do the scan itself before storing and raise.

### A2 (major) "Never saves" loses rows wherever the caller has no save

The helper relies on "the caller's own `save!`" (PLAN 13.1, 13.2 step 7). Three kinds of call site
have none:

- **Reads.** `GET /container` is a controller action that never saves (`GC:626-693`). The privilege
  plan writes a row on "each `GET /container` of a profile opened only by admin"
  (`OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 13), and this plan's own share read row (B2) lands on the
  same route (`GC:639-652`). The route is under `with_game_lock` (`GC:103`), so a save is possible, but
  nobody is told to add one, and 13.3 says to call the helper "in the model method", which a read
  route does not have.
- **`signin_denied`, `notPermitted`.** That branch returns with no save (`GM:3489-3492`).
- **`signin_denied`, `blocked`.** The locked-out return is deliberately free: nothing counted,
  nothing saved (`GM:3484`).

PLAN 5.1 says "this path saves once" for the badge refusal only. For the other three the row
either vanishes at the end of the request or each attempt gains a whole-column write. For
`blocked` that turns a free refusal into a save per hammered request, with `n` rising each time.

Fix: state, per call site in 13.8 and 13.7, "has its own save" or "adds one save". Give read
routes a rule: the helper returns non-nil only when a row was appended, and the read route saves
only then (a merged repeat on a read is not worth a write; cap the read row at "once per
container" with merging). For `blocked`, either accept losing the count (write the first row,
do not save a merge) or drop the row; question 3 should say this cost. Every per-call-site test
must assert on a re-read game (`Game.find(id).player_state`), never on the in-memory object, or
the missing save passes the test.

### A3 (minor) Registration: two parts cost more than they need to

Per event a plan adds an `EVENTS` entry with label, places, results and detail rules. That part is
proportionate: about one line an event, and it is what lets the validator and the viewer work
without per-plan code. Two parts are not:

- **The schema enum.** `events` items are "an enum of the registered event names and their
  prefixes, generated from `OpsLog::EVENTS`" (PLAN 9). `scripts/scenario-schema.json` is a static
  file every plan already edits, so five plans adding about 30 events each re-generate a shared
  enum and conflict there. Put a name pattern in the schema and do the real check in
  `validate_scenario.rb`, reading the event list from a plain Ruby file with no Rails
  dependency (for example `lib/break_escape/ops_log_events.rb`, required by both the concern and
  the validator).
- **Kinds have no owner.** Ten place kinds and the `{ id: kind }` detail rule need, per kind, a
  display-name lookup and (for the `where` filter) a room lookup. `host`, `network`, `share`,
  `desk`, `domain`, `finding`, `technique` and `service` belong to plans that land after L1.
  13.5 does not say where a plan registers its kind's lookups, or what the reader shows when an
  id does not resolve (section 7 says raw ids never reach the browser, so it must be `-`).
  Add `OpsLog::KINDS` (kind to name lookup and room lookup), filled by the owning plan in its
  stage, with `-` as the fallback and a test for it.

### A4 (minor) `as` values are not bounded, so the row budget is low

`normalise_username` is `strip.downcase[0, 64]` (`GM:2721-2723`): 64 characters, any characters.
Sixty-four four-byte characters are 256 bytes; control characters escape to six bytes each in
JSON. A `signin_fail` row can be about 500 to 600 bytes, so the ceiling is nearer 170 KB than 90.
`{ account: }`, `{ npc: }` and `{ card: }` ids have no stated length either.
Fix: the helper checks `as` like detail (typed: at most 64 characters, stored as given; ids: at
most 64 characters from the id class) and section 8 re-measures with a 64-character multibyte
name. Better, add a byte cap on the whole `opsLog` value in the pattern of
`MAX_NPC_INK_VARIABLES_BYTES` (`GM:6142`), dropping oldest rows past it, so the size claim no longer
depends on row arithmetic. The helper should also clamp `maxRows` to 150 and the total to 300 at
run time: a stored scenario snapshot is not re-validated at game start.

### A5 (nit) Two small inconsistencies

- Badge rows are written from `GamesController#unlock`, which contradicts "call it in the model
  method" (PLAN 13.1 comment, 14.1). Say "in the request that holds the game lock".
- PLAN 13.2 step 3 cites `login_scope_of` at `game.rb:324`. That line is a caller
  (`object_in_unpromoted_route_room?`); the method is at `GM:3182`.

Inside the game lock with no second save: yes for every L1 site that already saves (`GM:3497`,
`GM:4348`, `GM:4352`, `logout_session!`, `lock_session!`, `unlock_room!` `GM:135-139`, `unlock_object!`
`GM:691-695`), and `opsLogSeq` is safe because `login`, `logout`, `lock_session` and `unlock` are all
on the lock list (`GC:103-105`). The exceptions are A2.

---

## Check 3. Every sibling row against 13.7

Sibling sections read as they stand now. Core's is unrevised (its section 13).

### B1 (major) 13.7 does not match the privilege plan as revised

`OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 13 now lists four rows. Against 13.7:

| Privilege plan now | 13.7 says | Problem |
|---|---|---|
| `admin.profile_read`, on each `GET /container`, detail profile id | `admin_profile_read`, once (caller), detail `profile` (account username) | dotted name fails the `snake_case` rule and the `_*` prefix match; "each" against "once"; profile id against username; no save on that route (A2) |
| `usb.override`, detail device class | `usb_install_overridden`, no detail | name; a detail key 13.7 does not register |
| `credentials.collected`, detail "count, password or hash per account"; a repeat writes no row | `credentials_harvested`, detail `count`, merged repeats | name; a per-account kind does not fit four keys of closed codes; bound differs |
| `signin.refused`, result `not_permitted`, detail `local` or `domain` | not in 13.7 | `not_permitted` is not a legal result word (letters only, PLAN 13.1); see B5 |
| (none) | `hash_obtained` for S5 | the privilege plan has no such row; the ruling gives it the row for its collect action, and its collect row is `credentials.collected` |
| (none) | `domain_account_locked_out` | no longer in the privilege plan ("Lockouts and the failure counter are unchanged by this plan", its section 14) |

The privilege plan took the dotted `family.name` form that round 1 of this plan used; this plan
moved to `snake_case` in the same round. One of them has to move, and that is an orchestrator call.
Fix: settle the name form once in the brief's shared contract; then 13.7 takes the privilege
plan's four rows as they are (one collect row with `count` and a `hashes` integer, no separate
`hash_obtained`), and drops `domain_account_locked_out`.

### B2 (major) The share file read row is not in the plan

Ruling: a hash obtained by reading a file on a share is this plan's own ordinary "file read on a
share" row, which does not say what the file was. The plan still has the earlier position:

- 13.7 lists `hash_obtained` with `where` "`pc`, `host` or `share`" and a bullet "or reading a hash
  file on a share (`where.kind: share`)".
- 14 request 5 says "by whichever plan owns share reads, which the orchestrator assigns".
- 13.8 has no share row. No stage builds one, 5.1 names no call site, 11 has no test.

What the row needs: an event (say `share_read`), `as` the account of the session that admits the
share, `where: { kind: 'share', id: }`, no detail (so it cannot say what was read), written on
the admitted branch of `GET /container` for a resource (`GC:639-652`). The server sees a share or
folder being opened, not a single file, so the honest name is "share opened". It needs a bound
(merge repeats, and per A2 save only on a new row), a stage (L3 fits, or a new L4 if shares wait
for S1), and a line in section 7. `hash_obtained` then loses the `share` kind.

### B3 (minor) MFA rows differ in five places

`OPS_MFA_HELPDESK_PLAN.md` section 13 against 13.7:

- One event `mfa_code` with results `ok`, `wrong`, `expired`; 13.7 has two events `mfa_code_ok` and
  `mfa_code_wrong` with `ok` and `fail`.
- `mfa_challenge` detail is one route code with four values (`keyboard`, `foothold`, `from`,
  `credential`); 13.7 splits it into `route` (three values) and a `credential` kind key.
- `mfa_prompt_approved` `by` has a third value, `own_phone`.
- `mfa_expired` carries a detail (`prompts` or `codes`); 13.7 says none.
- `helpdesk_request` has no identity for an unknown username (`as: nil`); 13.7 says `{ account: }`.
  The helper can write nil; the table should say so.

Also unanswered: the MFA plan's request 8 asks whether a run of `mfa_prompt_sent` rows should be
one row with a count. 13.7 keeps `request` (integer) in detail, which makes every row differ, so
nothing merges and "S8's request cap" (20 an attempt) bounds one attempt only. Three attempts
fill a default source. Fix: drop `request` from detail so the run merges into one row with `n`
(the count is the trace a defender wants), and answer request 8 in section 14.

### B4 (minor) Core and cracking rows

- `service_checked` detail `service` is `:text`, whose character class has no space (PLAN 13.1). A
  service called "File sharing" raises in test and is silently dropped in production. Use
  `{ id: 'service' }` (also A1).
- Core's table is unrevised: `technique_refused` is "every refused use" with a free `reason`;
  13.7 makes it merged repeats with a closed list. `finding_confirmed`'s Where is "finding id,
  status"; 13.7 uses the host, which core has to resolve from the finding. These are 14 request 3
  items core has not yet taken; list them as still open instead of as agreed.
- S1 rows store the foothold as `from`, shown by name, while 13.8 says this plan's own rows never
  hold "the foothold, relay or source PC id". Both can stand; say why they differ (a sweep's source
  is what a network log records; a sign-in's route would tell the player nothing new but is not
  needed) or make them agree.
- Cracking still lists three rows. The ruling leaves it none; 13.7 is right and the cracking plan
  is stale.

### B5 (minor) Two plans write the same branch

This plan writes `signin_denied` (result `denied`) on the `notPermitted` branch (`GM:3489-3492`).
The privilege plan writes `signin.refused` (result `not_permitted`, detail `local` or `domain`) on
an account-kind refusal, which its section 14 places "inside step 6", the same admission check. Its
request to S9 says "may already be yours; if so, add `detail` only". The plan does not answer.
Fix: one row. `signin_denied` gains an optional detail key `kind` (`local`, `domain`), registered by
the privilege plan in its stage; the privilege plan drops its own event.

---

## Check 4. Bounds and forgery

### F1 (major) Alternating two rows defeats the merge, so the cap is the only bound

Step 5 merges only into the source's **newest** row (PLAN 13.2). Send A, B, A, B and every request
appends:

- **Failed sign-ins.** Any made-up username writes `signin_fail` (`GM:3502`, `GM:4333-4353`).
  Lockout is per username, and new usernames are free (the 200-entry trim at `GM:4355-4362` bounds
  the failure map, not the calls). Two alternating names give unlimited distinct rows.
- **Denied swipes.** Two reachable access-list doors, alternated.
- **`signin_denied`, `technique_refused`, `helpdesk_request`**: the same, across two PCs, hosts or
  desks.

Each source keeps 50 rows by default, so about 50 forged requests push out every earlier row in
that source, including the player's own `signin_ok` and `badge_swipe ok` rows that the scripted
playtest, the teaching point and the parked debrief read. 13.3 says "the per-source `maxRows` is
the last line of defence, not the bound"; for these events it is the only bound.

Nothing gates on a play row, so this breaks no puzzle. It does let a player wipe their own
trail, which a real attacker also tries, but here it costs nothing and is not a designed move.

Fix: evict by class. When a source is over its cap, drop the oldest row whose result is not `ok`
or `granted` first, and drop an `ok` row only when no other kind is left. Refusal rows then compete
only with each other. Optionally merge into any matching row among the newest 10, not only the
newest. Rewrite 13.3's "merged repeats" bound to say what it does and does not bound, and add the
alternation case to the unit tests (PLAN 11 tests twenty swipes at one door only).

### F2 (major) The clock stamp cannot be written where the plan puts it

PLAN 5.1, 8 and 13.4: `merge_scenario_clock!` sets `opsLogClockAt` "when it stores a new `elapsedMs`
and the scenario has `logSources`". That method has one caller, `sync_state` (`GC:2871-2873`), which
loads the game with `SYNC_STATE_COLUMNS` only (`GC:875`, `GC:2442`): no `scenario_data`. The plan
knows this for the helper (13.2 step 1) and misses it here. On the only path where the line runs:

- reading `scenario_data` raises `ActiveModel::MissingAttributeError` (the comment at `GC:2436-2441`
  says so), or
- a `has_attribute?` guard makes the condition false, `opsLogClockAt` is never set, and every row
  is stamped with the last synced `elapsedMs` (up to five minutes stale: T1 again), or
- a lazy fetch reloads a 60 to 150 KB blob on every sync, which `GM:352-355` forbids.

The plan's unit test ("`elapsedMs` is the saved value plus the server time since `opsLogClockAt`",
PLAN 11) would call the method on a fully loaded game and pass.

Fix, following the memo pattern at `GM:352-358`: seed `opsLogClockAt` in `initialize_player_state`
when the scenario has `logSources`, and have the sync line run only when
`player_state.key?('opsLogClockAt')`. Section 8 then changes: the key is created at game start for
an opted-in scenario, not on first write, and a game started before L1 gets it on its first
helper write (which has `scenario_data`). Add a controller test through `PUT /sync_state` itself,
and make the L1 playtest assert that a row's time is within a few seconds of the on-screen clock
after a real sync.

### F3 (minor) An rfid lock without an access list is server-checked now

PLAN 5.1 says a lock with no access list "is client-trusted (`game.rb:4647-4649`)" and that an
access-list lock is "the only rfid lock the server can refuse". The code has moved:
`rfid_lock_passes?` requires a provably held card named in `requires` when there is no access
list (`GM:3992-4004`, comment `:3992-3996`). So:

- a refused swipe at a requires-only lock is a server-validated refusal and gets no row under the
  plan's rule;
- on success at such a lock the server knows which held card matches `requires`
  (`rfid_requires_held?`, `GM:4015`), so the row can name it from server state; the plan's "only when
  the request carried exactly one id" fallback is not needed there;
- an rfid object whose lock is not in force passes with no check (`GM:4754-4755`); "it was not
  open" should also require the lock to be in force, or a swipe that needed no card logs as one.

Also: the refusal row needs "card ids were sent", which is a request parameter. Require at least
one sent id to be a card the server holds for the player (`held_rfid_cards`, as
`rfid_passing_card_id` does at `GM:4054-4061`), or a player with no card at all can log denied
swipes. And place the success write after the route-room refusal at `GC:1270-1273` and inside the
transaction, so a refused request leaves no unsaved row behind.

### F4 (minor) After a reload the first rows are stamped ahead of the screen

The client resumes from the saved `elapsedMs` (`game-clock.js:79-80`). The server estimate is
`saved + (now - opsLogClockAt)`, capped at five minutes. If the page was closed for an hour, a row
written after reload and before the first sync is stamped five real minutes ahead. Game time runs
at `rate` game seconds per real second (`game-clock.js:81`, `:108-109`), so with a rate of 6 that is
30 game minutes, and the next row after a sync shows an earlier time than the one before it.
`seq` keeps the order right; the TIME column runs backwards.
Fix: also set `opsLogClockAt` where the saved clock is handed to a loading page
(`GC:399-402`), because that is the moment the client restarts from the saved value.

### F5 (minor) `signin_denied` with result `blocked` has the wrong identity shape

13.8 gives `signin_denied` `as: { account: }`. The `blocked` row is written at `GM:3484`, before the
account lookup at `GM:3486`, for any locked-out username, account or not. It must be `{ typed: }`
like `signin_fail` and `signin_lockout`. Section 7 should also say that an account's username and a
typed one render in the same normalised form; if `{ account: }` shows the authored case
(`J.Price`) and `{ typed: }` shows `j.price`, the two shapes tell an account from a non-account.

### F6 (nit) The two clock references taken on trust are right

- `game.rb:5835` is `MAX_SCENARIO_CLOCK_ELAPSED_MS = 7.days.in_milliseconds`; the clamp and the
  only-grows rule are at `GM:5853`. Cite both.
- `game-clock.js:79-80`: `startTime = now - savedElapsed`, so the client clock runs on wall time.
  Correct.
- `state-sync.js:12` (`CLOCK_ONLY_INTERVAL_MS`) is also right.

What held: a sign-in row cannot name an unreached PC (`attempt_login!` checks reach or route before
anything is read, `GM:3448-3478`); a forged `/logout` or `/lock` with no session writes nothing
(`GM:3664`, `GM:3840-3842`); a success row at a door is once only because the door is then open;
`seq` is assigned under the lock.

---

## Check 5. Storage

### G1 (minor) Keep rows in `player_state` for A24, with a byte cap

How often the column is rewritten: every route on the lock list that changes anything
(`GC:103-105`), every sync that changes anything, and at least every five minutes for the clock
(`state-sync.js:12`, `:724`). Each write rewrites the whole jsonb value. The plan says this
correctly (section 8).

The recommendation is sound:

- Each locked action already loads the whole row twice, with 60 to 150 KB of `scenario_data`
  (`GC:855-858`). Another 25 KB typical is small beside that.
- `player_state` already has keys capped at 128 KB and 512 KB (`GM:6142`, `GM:6209`). A log capped
  at 90 KB (or about 170 KB with A4's worst case) is the same class.
- Rows are never synced and never sent except on request, so the delta rule is met.
- A table costs a migration in the engine and in Hacktivity, with the worktree migration hazard
  the plan notes. Nothing in A24 needs SQL over rows.

Start with a table only if the orchestrator expects the defence debrief or an investigator
mission within the same release, because both want more than 300 rows. Two conditions on (a):
add the byte cap from A4 so the bound does not depend on row arithmetic, and keep all reads behind
`log_rows_for` and `log_rows_for_client` (as the plan does) so the later move touches one file.
This is a technical choice with a clear answer, so the plan can settle it and take it out of the
user's questions.

---

## Check 6. The viewer

### V1 (major) The reach check is wrong for a reader on a sign-in PC

Section 1's example is "sit at the security office PC". PLAN 6 step 3 says every locked object on
the chain, "a cabinet, a PC desktop container, the reader itself", must be `object_unlocked?`,
and gives a session check only for account profile items. In the code a sign-in PC is "opened by a
session, never by unlockedObjects" (`GC:635-637`), so `object_unlocked?` is the wrong test for it.
The container route already has the full rule:

- `login_scope_of(id)` returns `{ object:, room_id:, scope:, path: }` (`GM:3176-3204`): the chain the
  plan proposes to rebuild by a new walk;
- `session_admits?(scope)` covers a sign-in PC (session held, not locked, route up) and a profile
  (`GM:3260-3277`);
- `path_unlocked?(path + [object])` covers cabinets (`GM:3310-3313`);
- `folder_route_allowed?` judges the route the request names (`GC:660-669`).

Fix: specify step 3 as exactly those calls, in the order `GC:638-669` uses, plus `room_unlocked?`
and `object_in_unpromoted_route_room?`. That is less code and cannot drift from `/container`.

Two things follow:

- "A forged `GET` can read the log from anywhere for the rest of the game" (PLAN 6) is true only
  for a reader gated by rooms and unlocked objects. A session ends, locks or loses its route, and
  the read must then be refused. Say so and test both cases.
- A foothold or `from` session on a PC exists today, without S1 hosts. A reader on that PC's
  desktop is then readable remotely. That is probably wanted ("reading a log through a session"),
  but the plan says remote reading waits for S1. State which, and whether the request must carry
  the route as `/container` and `/keyring` requests do (`api-client.js:257`).

### V2 (minor) A new object type needs a sprite and a lighting entry

`log_filter_terminal` has its own texture (`public/break_escape/js/core/game.js:905`) and is in the
screen-glow type list (`public/break_escape/js/systems/lighting.js:434`). The plan adds
`ops_log_terminal` to the schema enum, `interactions.js` and the container list, and names neither.
A room object of the new type has no image. Fix: map the type to the existing
`log_filter_terminal` texture and add it to the lighting pattern (no new art, no PixelLab ask), or
make new art an open question. Also to confirm in the build: the container list at
`container-minigame.js:2326-2331` only marks an item as interactive; the plan should name the code
that starts the minigame for a container item and how the reader's `id` reaches
`ApiClient.logRows`.

### V3 (minor) Section 7 does not say what of the reader reaches the browser

The reader's `minigameData` (`logSource`, `anomaly.rowId`, `flagActions`, `completionActions`)
ships with the room or container contents, as log-filter's does, before the player has read a
row. The seed row to flag is therefore in the browser from room load, and the flag is checked on
the client (PLAN 5.2). That is the same best-effort standing log-filter has and section 15 defers
a server check, but the brief asks for every field (section 3, first rule). Add the reader's
fields to section 7 with "best effort, as log-filter" and note that the source id is a raw id
that does reach the browser.

### V4 (nit) Reuse and UI claims check out

- `lf-log-table` (`log-filter-minigame.css:292`), `lf-log-row` (`:320`), `lf-session-detail` (`:398`)
  exist and are not scoped under a log-filter container class; the stylesheet is linked on the
  game page for every scenario (`app/views/break_escape/games/show.html.erb:67`), so the viewer
  needs no CSS of its own.
- Pixel-art rules: font `VT323` (`css:24`), `border-radius: 0` (`:860`); `static consoleWindow =
  true` gives the shared frame and X (`log-filter-minigame.js:35`); no `showCancel` (log-filter's
  opener does pass one, `interactions.js:1592-1593`, so do not copy that branch whole).
- `textContent` only, and no `displayDashes` on player text: stated in 5.2 with a hostile-username
  test in 11.
- Harness copy lists: exactly two tests copy `minigames/index.js`
  (`test/js/patch-panel.test.mjs`, `test/js/social-authenticator-wiring.test.mjs`); the plan names
  both, and gives the new viewer test its own list.
- The `log_filter_terminal` schema entry is at `scripts/minigame-data-schemas.json:63` and
  requires `logEntries`, as the plan says.

---

## Check 7. Stages, ordering and open questions

### P1 (minor) `verify-run.rb --ops-log` is small; say so and give it teeth

The script is 361 lines. Flags are read with `ARGV.delete` (`tools/playtest/verify-run.rb:56-58`)
and each section is one function over `player_state` (`access_section(ps)`, `:73-144`). `--ops-log`
is one more flag line and a section of about 30 lines that prints, per source, `seq`, event, `as`,
`where`, result and `n`. Size S, well under an hour, no risk to L1. Two additions make it worth
having: exit 1 when a stored row holds a declared secret (A1), and extend
`tools/playtest/access-leak-check.rb` (the companion check run after every beat,
`scenarios/test_access_signin/PLAYTEST.md:26-33`) to cover `/log_rows` responses, instead of the ad
hoc check on network responses in PLAN 11.

### P2 (minor) L1's proof scenario contradicts section 10

L1 proves itself on "a copy of [a `test_access_*`] scenario with a `logSources` block" (PLAN 3).
Section 10 check 2 fails any scenario outside `test_ops_*` that declares `logSources`, and the
validator rejects `logSources` without a `gameClock` (PLAN 9). Fix: L1 creates `test_ops_logs` with
the door, the PC and a `gameClock` and no reader; L2a adds the reader. L1 is then provable alone on
the real path (playtest plus `verify-run.rb --ops-log`), which is enough for a stage that shows
nothing. Its playtest must include one real sync before a logged action and check the row's time
(F2 is invisible otherwise).

L2a, L2b and L3 are each shippable alone. L2b is a real S. L3 is S if the share row (B2) goes
elsewhere.

### P3 (minor) "L1 first" is a fair request; make it cheaper to grant

L1 is M and edits the sign-in methods three other plans edit, so asking for it first is right. The
stub is the weak part: it has no owner, and a sibling that lands before L1 has helper calls no
test has checked, which L1 must then register. Fix: split L1 into L1a (the concern, `EVENTS`,
merging, caps, the clock seed, the schema block, no call sites; S) and L1b (this plan's call sites
and rows). Ask only for L1a before the siblings; no stub is needed and each sibling's rows are
checked from its first commit. Request 1 should also tell siblings that a `logSources` block in
their `test_ops_*` scenario requires a `gameClock` there.

### P4 The five open questions

| Q | Verdict |
|---|---|
| 1. Copied card in the door log | A real user choice (teaching against an existing guarantee). Option (d) holds up: a door logs a success once, so a one-card request tells the player only what the door opening already told them. Keep |
| 2. Where rows are kept | The plan's to settle: (a), with the byte cap (G1). Remove from the user's list, record in the decisions file |
| 3. Not-permitted and post-lockout attempts | Not yet a clean question. It hides a cost (A2: two new saves, one on a path that is free today), a wrong identity shape (F5) and an overlap with the privilege plan (B5). Settle B5 with the orchestrator, then ask the user only "log attempts after a lockout, at the cost of a save each?" |
| 4. NPC and office-life rows | A real user choice, since office life is a stated direction, though user decision 1 (no actor) and the lack of a server NPC model nearly force (a). Keep, short |
| 5. A play row as the anomaly | A deferral, not a choice needed now. The plan can settle (a) and note (b) with the investigator work |

Missing from the questions: nothing that needs the user, provided V2 takes the existing sprite.

---

## Findings by grade

| Grade | Ids |
|---|---|
| blocker | none |
| major | A1, A2, B1, B2, F1, F2, V1 |
| minor | A3, A4, B3, B4, B5, F3, F4, F5, G1, V2, V3, P1, P2, P3 |
| nit | A5, F6, V4 |

Not done: the container-item launch path in `container-minigame.js` was not traced past the
interactive-type list (noted in V2). SecGen XML and the exploit-detail guides were not opened.
