# OPS_LOG_ROWS_PLAN.md: round 1 adversarial review

Plan under review: `docs/achitechture/OPS_LOG_ROWS_PLAN.md` (615 lines, stage S9, feature A24).
Standard: `docs/agents/OPS_LAYER_BRIEF.md` sections 2, 3, 5, 7, 8.
Grades: blocker, major, minor, nit. "Plan :n" is a line in `OPS_LOG_ROWS_PLAN.md`. Code paths are
relative to the worktree root; `GM` is `app/models/break_escape/game.rb`, `GC` is
`app/controllers/break_escape/games_controller.rb`, `LF` is
`public/break_escape/js/minigames/log-filter/log-filter-minigame.js`.

Verified and correct, so not repeated below: the `/keyring` pattern (`GC:1862-1889`, rev at
`credential_keyring.rb:238-240`); every successful sign-in passes through `start_login_session!`
(callers `GM:3496`, `credential_login.rb:76`, `GM:3569`, `GM:3653`) and no refused sign-in does;
`sync_state` merges named sections only (`GC:2746-2881`), so a client cannot write `opsLog`; the
bootstrap copies named keys only (`GC:333-437`), so `opsLog` does not reach the browser;
`withhold_network_keys!` has one call site (`GM:2488`); log-filter table cells use `textContent`
(`LF:640`, `:718-726`, `:800`).

---

## Check 1. State

### S1 (major) The size figure is about half the real one
Plan :342 and :594 say 120 bytes a row, 36 KB at the cap. The plan's own stored row (:509-511)
serialises to 220 bytes; with a 32-character typed username and two sources it is 262 bytes
(measured with `to_json.bytesize`). 300 rows is 66 to 79 KB. The recommendation in question 2
rests on the 36 KB figure.
Fix: state the measured size. Shorten the stored row: drop `sources` (derive it on read from
`logSources`, which also lets a scenario edit take effect), drop `actor` when it is `'player'`,
store `where` as `"pc:reception_pc"`. That gets a row near 120 bytes for real.

### S2 (major) One global cap of 300, oldest dropped first, lets any noisy event erase the rest
Plan :218-219 caps the whole list; `maxRows` (:158) only limits what one source serves. Nothing
bounds how fast rows arrive:
- refused badge swipes are unlimited and forgeable (finding H1);
- sibling plans ask for per-attempt rows: `technique_refused` "every refused use"
  (`OPS_CORE_PLAN.md:841`), `crack_run` "each `POST /crack`" (`OPS_CRACKING_PLAN.md:316`),
  `mfa_prompt_sent` "each `POST /mfa/prompt`" (`OPS_MFA_HELPDESK_PLAN.md:553`).
So 300 refused swipes, or a prompt-bombing run, removes every earlier row from every source. The
MFA plan says the run of prompt rows "is the trace a defender would look for"
(`OPS_MFA_HELPDESK_PLAN.md:560`); the same run evicts the sign-in rows around it. The parked
defence debrief reads these rows, so a player can also wipe their own trail on purpose.
No puzzle in A24 loses its answer, because `anomaly.rowId` may name a seed row only (:192) and
seed rows live in the scenario. The plan should say that outright: nothing may gate on a play row
while storage is a ring.
Fix: cap per source or per event family, not globally; collapse a repeat of the previous row
(same event, place, identity, result) into a `count` on that row; say in section 13 that a plan
writing a per-attempt row must name its bound.

### S3 (minor) "Never synced" is true; "costs nothing" is not, and the table comparison is thin
Verified: nothing sends `opsLog` to the browser and no sync body can write it. But `player_state`
is one jsonb column (`test/dummy/db/schema.rb:43`) and every `save!` rewrites it whole. Saves
happen on every locked action (`GC:103-105`) and on every sync that changes anything; the clock
alone makes a sync at least every five minutes (`public/break_escape/js/state-sync.js:12`) and the
narrow sync load still reads the whole column (`GC:2442`). So 66 to 79 KB is read, parsed,
re-serialised and written on each of those, for the rest of the game, once the log is full.
That is in the same class as existing bounded keys (`MAX_NPC_INK_VARIABLES_BYTES` 128 KB
`GM:6142`, `MAX_PHONE_STATE_BYTES` 512 KB `GM:6209`), so it is acceptable, but section 8 should say
it and question 2 should compare honestly:

| | `player_state` list | new table |
|---|---|---|
| write cost | whole column rewritten per save | one small insert |
| atomic with the action | yes, same save | yes, same transaction under the row lock |
| cap | forced, 300 | none needed |
| reset / new session | dropped for free | needs a delete |
| defence debrief, investigator queries | Ruby scan of one game | SQL, across games if wanted |
| cost to land | none | a migration on the shared dev database (project rule: never run migrate from a worktree) |

Recommendation (a) stands for A24 if S1 and S2 are fixed. Put the migration risk in the question;
it is the real reason for (a).

### S4 (minor) The helper reads `scenario_data`, which the sync path does not load
Step 1 (:208) reads `logSources` from the scenario. `sync_state` loads `SYNC_STATE_COLUMNS` only
and reading another attribute raises `ActiveModel::MissingAttributeError` (`GC:2436-2442`). No L1
to L3 call site is on that path, but the contract in section 13 invites every plan to call the
helper "in the model method", and several model methods run from sync merges.
Fix: one line in 13.1 (never call from a sync merge), and a guard in the helper
(`return nil unless has_attribute?(:scenario_data)`), with a test.

### S5 (nit) Reload and reset
Reload is right (:351). Reset is right: `reset_player_state!` keeps six keys (`GM:120-122`) and
`new_session` slices the same way (`GC:269`). Say that `opsLogSeq` restarts at 1 after a reset, so
`r<seq>` ids repeat across resets; a client that kept a `rev` from before the reset could match by
accident if the rev stays a digest of `[source, last seq, count]`.

---

## Check 2. The read route

### R1 (major) The reach check does not cover where a reader can really be
Section 1 has the player "sit at the security office PC" (:10). A `log_filter_terminal` is a valid
item inside a container or PC desktop today
(`public/break_escape/js/minigames/container/container-minigame.js:2326-2331`), and
`find_scenario_object` walks nested contents and account profile items (`GM:4867-4880`). Check 3
(:299-301) tests only that the reader's room is unlocked and, if the reader itself is locked, that
it is unlocked. A reader inside a locked cabinet, or on a desktop behind a sign-in, is served to a
forged `GET` as soon as the room has been entered. With `showCardHolder: true` that log is a
reward (whose card got in), so this is an earned-secret question, not atmosphere.
Fix: for L2, a validator error unless an ops reader is a top-level room object (then the check as
written is complete); or apply the admission the container route applies to the parent. Say which.

### R2 (minor) What a forged request gets is not stated
There is no presence check: once the room is in `unlockedRooms` (grow-only), the log can be read
from anywhere, for the rest of the game, including rows written after the player left. That fits
the cheat policy (rows carry no secret by design) but section 6 should say so in a sentence, and
the controller test should assert it as intended behaviour.
Also: `find_scenario_object` returns the object, not its room (`GM:4867`); the room lookup the
route and the helper need is `login_scope_of(id)[:room_id]` (`GM:324`). A reader needs an `id`;
a minigame opened by an event mapping has no object at all
(`scripts/scenario-schema.json:5039-5047`), so the validator must refuse `logType: "ops"` there.

### R3 (minor) `seq` is listed as never sent, and is sent
Plan :311 puts `seq` on the never list; :319 makes a play row's id `r<seq>`. `seq` is global
across sources, so gaps between visible ids tell the player how many rows went to logs they cannot
read (for example that an action elsewhere was recorded).
Fix: id from a per-source ordinal, or a short digest of `[source, seq]`.

### R4 (minor) Keep `actor` out by allow-list, and test it that way
`actor` cannot reach the browser as designed. The test at :410 checks four named fields are absent.
Sibling plans will add stored fields (`by`, a target, a count: check 7). Build the client row from
an allow-list of the seven fields in section 7 and test "exactly these keys", so a new stored
field is withheld by default.
Not verified: the playtest reads `player_state['opsLog']` with `actor` "through the same
server-state check the `test_access_*` playtests use" (:444-445). I could not find that check by
name in `docs/test-bridge.md`. The plan should name it and confirm it is not a route a browser
can call in production.

### R5 (nit) The rev
A digest of `[sourceId, last seq, row count]` (:303) changes when another source's rows evict this
source's oldest (count drops), which is right. It does not change if `logSources` is edited on a
live game (title, `showCardHolder`, seed rows). Digest the client rows instead, as `keyring_rev`
digests its entries.

---

## Check 3. The helper and its call sites

### H1 (major) Badge rows are keyed on the request's `method`, not on the lock
Plan :239-244 writes a row when `method == 'rfid'`. `method` is a request parameter (`GC:1217`).
- `validate_unlock` returns true for any door already unlocked, "regardless of method"
  (`GM:4600-4604`). A replayed or forged `POST /unlock` with `method: rfid` at an open door, of any
  lock type, is a success and would write `badge.swipe ok`, without limit.
- The refusal at `GC:1252` is the shared return for every failed method. Nothing there is
  "counted" (plan :223, :241): no attempt counter exists for rfid. A forged request naming any room
  or object id, reached or not, with `method: rfid` lands there and would write
  `badge.swipe denied` whose `where` shows that room's display name (:323). That breaks the claim
  at :334 ("a place appears only because the player acted there") and feeds S2.
- For an already-open target the controller deliberately names no card (`GC:1219-1222`, `:1264`),
  so the row has no identity to record there either.
Fix: resolve the lock on the server; write only when the target exists, its `lockType` is `rfid`,
and the door is on a room the player has unlocked (or the object is in one). No row when
`already_open`. Collapse repeated denials (S2). Drop the word "counted" for badge rows.

### H2 (major) `start_login_session!` also carries things that are not sign-ins
The plan's rule is "a row unless via is `claim`" (:229-232). OPS_CORE S3 calls
`start_login_session!(pc_id, npc, 'technique', ...)` (`OPS_CORE_PLAN.md:321-323`) and lists its own
`technique_used` row. Under the plan's rule that call either writes a false `signin.ok` or, since
`technique` is not in the event's detail list, raises `ArgumentError` (:210-211) inside the route.
Fix: write `signin.ok` only for `via` in `password`, `credential`; every other value writes
nothing. And do not raise in production: an unknown event or detail should raise in test and
development and log-and-skip otherwise, or one typo in any plan's event name turns a core route
into a 500.

### H3 (minor) `detail` is one code; `signin.ok` needs two
:229-230 takes detail "from `via` (password, credential) and route (local, remote)"; :503 and :522
make `detail` a single string from one closed list. Either combined codes
(`password_remote`), or `detail` becomes a short array. Decide here: sibling rows need the same
(check 7).

### H4 (minor) The failure and lockout writers do not hold what the row needs
- `record_login_failure!(pc, key, account:)` (`GM:4333`) receives `key = "pcId|normalised"`
  (`GM:3481-3482`), not the typed text. The row will show the normalised username; say so, and
  drop "typed" cleaning that has nothing left to clean, or pass the raw text in.
- `add_login_lockout!(key, account:)` (`GM:4366`) has no PC argument; `where` must be parsed back
  out of `key`. Say so or change the signature.
- An attempt on an already locked-out username returns before anything is written (`GM:3484`), so
  the hammering after a lockout leaves no rows. A defender would see those.
- A correct password at a PC that does not admit the account answers `notPermitted: true`
  (`GM:3490-3493`). The plan gives it no row because "a row there would answer questions the
  refusal deliberately leaves open" (:224-225). The reply has already told the client; a
  `signin.denied` row would say nothing new and is the classic audit event.

### H5 (minor) `session.end` and `session.lock` branches are not pinned down
- `logout_session!` has no checks (`GM:3658-3663`); a forged `POST /logout` for a PC with no
  session must write nothing. State the branch: only when the deleted record is a Hash.
- Sessions also end by replacement, by Switch user, by pruning, by a guest session ending, by
  token expiry and by unplugging (`GM:4392-4418`). None writes `session.end`. Say that the event
  means an explicit sign-out only, or the log shows sign-ins that never end.
- A claimed session wrote no sign-in row. Locking or signing out of it would write a row naming
  the owner, with no sign-in before it. Say whether `via: 'claim'` sessions write these two rows.

### H6 (minor) The unlock path gains saves
The helper itself needs no second save and runs under the lock, which is what OPS_CORE asks
(`OPS_CORE_PLAN.md:857-858`). The badge call site is the exception: :242-243 adds
`@game.save!` after `unlock_room!`/`unlock_object!` have saved, and adds a save to the refusal
path, which today writes nothing (`GC:1228-1253`). Under the lock that is safe; it is one more
whole-column write per swipe. Write the success row before the unlock's own save, and say the
refusal path now saves.

### H7 (minor) A card's holder is not always one NPC
`as` is `{ npc: }`, `{ typed: }` or nil (:501). A card named in `requires` may belong to no NPC,
and "a shared card carries every holder" (`GM:3981-3989`). A lock with no access list is
client-trusted (`GM:4647-4649`) and `rfid_unlock_card_answer` returns nil for it (`GM:4071-4072`),
so "use `rfid_unlock_card_answer` to tell own from copy" (:240-241) does not work there; the plan's
fallback (:243-244) needs its own code. Add an `as: { card: id }` form shown as the card's name.

---

## Check 4. Time

### T1 (major) The lag is up to five minutes, not "a few seconds"
Question 4 (:600-603) says the saved clock "can lag a few seconds". The client sends the clock
with other changes, and on its own only every `CLOCK_ONLY_INTERVAL_MS = 5 * 60 * 1000`
(`public/break_escape/js/state-sync.js:12`). A swipe, three failed sign-ins and a lockout made
through their own routes with no synced change between them all take the same stale `elapsedMs`,
and after `HH:MM` formatting a longer run looks simultaneous and minutes old.
Fix without a new parameter on any route: stamp the server time when `merge_scenario_clock!`
stores a new `elapsedMs`, and have the helper use `saved elapsedMs + (now - that stamp)`, capped
at the five-minute interval. The client clock is wall-clock based (`game-clock.js:79-80`,
`:149-151`), so this is accurate while the page is open, and a client cannot hold it back.

### T2 (minor) What a tampered time can do; whether `seq` is enough
`elapsedMs` only grows and is clamped to seven days (`GM:5835`, `:5854`). A client can jump it
forward once, as far as seven days, and every later row carries that time for good; it can also
never send the clock so rows stay at an old time. It cannot reorder rows: `seq` is assigned under
the row lock. So `seq` is enough for order among play rows. It is not enough for anything that
reasons about intervals (the MFA plan's "short time", a lockout window, a later detection rule);
those must use `serverMs`. Section 13 should carry one rule for every plan: `elapsedMs` is for
display, `seq` for order, `serverMs` for any server-side interval, and no server check reads
`elapsedMs`. Seed rows have neither `seq` nor a comparable time, so "seeds first, then play rows"
is by fiat.

### T3 (minor) Scenarios without `gameClock`, and seed times
With no `gameClock`, `timeParts` formats the browser's wall clock from `startTime + elapsedMs`
(`game-clock.js:157-160`), and `startTime` is recomputed on load (`:79-80`), so every play row's
time changes after a reload. Seed `at` values are then unrelated to play times.
Seed `at` is `HH:MM` with no day (:180); an investigator trail over several days cannot be
written, and a seed at 08:41 in a mission starting 07:30 is listed before play rows at 07:35.
Fix: validator error for `logSources` without `gameClock`; allow an optional day on `at`
(`formatStamp` already prints "Tue 07:42", `game-clock.js:173-177`); validator checks seed rows
ascend and end at or before the start time.

---

## Check 5. The viewer

### V1 (major) log-filter needs more than new columns and derived filters
The existing `vpn` and `ics_rdp` types can stay untouched if every change is guarded by type, and
the snapshot test at :397-398 is the right proof. But the ops type does not drop in:
- `_applyFilters` is a fixed list of category ids and returns true for any other (`LF:729-746`).
  EVENT, IDENTITY and LOCATION filters would be shown and do nothing until it is rewritten.
- The TIME filter reads the hour from characters 11 to 13 of a dated stamp (`LF:749-757`). An
  `HH:MM` value gives NaN and matches everything. ":273 the existing TIME ranges" do not work.
- The row tint uses its own inline matcher, not `_isAnomalyEntry` (`LF:650-656`). With
  `anomaly: { rowId }` it compares `entry.account === this._anomaly.account`, both undefined, so
  every row is tinted. The plan changes `_isAnomalyEntry` only (:280-281).
- The detail panel is headed SESSION DETAIL and always shows LOOK UP IP and INVESTIGATE ACCOUNT
  (`LF:812-831`); the flag button is always shown (`LF:834-850`), where the plan says it is hidden
  without an anomaly (:193).
- Selection is tracked by row index into `_logEntries` (`LF:764-768`); REFRESH replaces the list.
- `stateOverrides` are applied in `_resumeStateFromGlobals` before the fetch (`LF:245-264`), so
  they never touch fetched rows; say they are not supported for ops.
- Flag state is one boolean and one anomaly (`LF:266-269`); fine for A24, a limit for investigator
  missions (several rows to flag).
Fix: list these in 5.2 and re-size L2 (M to L), or give ops its own table, filter and detail
methods inside the minigame, sharing only the frame, tabs and flag overlay.

### V2 (minor) log-filter does have a schema entry, and an ops reader fails it
Plan :116-117 and :359-360 say `log_filter_terminal` has no schema entry and no validator checks.
`scripts/minigame-data-schemas.json:63-87` has one, loaded at `scripts/validate_scenario.rb:902-911`,
with `logEntries` required and no `logSource`. The example at :187-189 fails today's validator.
Fix: update that entry (`logEntries` not required when `logType` is `ops`; add `logSource`) and
list the file in section 12.

### V3 (minor) A new import, so the harness lists do change
log-filter imports two modules (`LF:30-31`) and makes no server call. Calling `ApiClient.logRows`
needs a new static import (or a global). Two tests already load the module:
`test/js/log-filter-selected-row.test.mjs`, `test/js/log-filter-wording.test.mjs`. Plan :284 ("the
test harness copy lists are unchanged") is wrong if the import is static. Say which, and list the
harness edits.

### V4 (nit) Text handling and the Cancel point
Cells are `textContent` (verified). The detail panel passes values through `displayDashes`
(`LF:800`), which rewrites `--`, so a typed username can differ between table and panel. The
source `title` arrives in the answer after the frame is drawn from `scenarioData.title`
(`public/break_escape/js/systems/interactions.js:1591`); say where it is shown. The opener passes
`showCancel: true, cancelText: 'Close'` (`interactions.js:1592-1593`); the plan rejects siem partly
for a Cancel button (:66, :263), so confirm log-filter does not render one.

---

## Check 6. Opt-in

### O1 (minor) The proof test is not practical as written
:393-396 creates a game for every scenario, plays six actions on each and compares with "the
`OpsLog` include stubbed out". Many scenarios need VM context to build, and an include cannot be
stubbed per test without reloading the class.
Fix: (1) a unit test that the helper returns nil and leaves `player_state` identical when
`logSources` is absent, called once per event; (2) a test that no scenario under `scenarios/`
outside `test_ops_*` declares `logSources`; (3) the existing access model suites pass unchanged;
(4) the JS snapshot; (5) the validator diff. That proves the same thing.

### O2 (minor) Opt-in is per scenario, but the default source is "everywhere"
With no `where`, a source takes the event anywhere (:161). A scenario that adds one source for a
puzzle starts recording every sign-in in the mission, which changes state size for the whole game.
That is opt-in, but the validator should warn on a source with a family wildcard and no `where`.

### O3 (nit) Seed rows cannot carry `actor`
Section 1 (:29-31) says seed rows let a mission plant an insider's trail and that `actor` is the
ground truth for the investigator idea. The seed row schema is closed (:356-357) and has no
`actor`. Not needed for A24, but adding an optional server-only `actor` later means a schema
change; add it now or say it is deferred.

---

## Check 7. The shared contract (section 13)

### C1 (major) The helper cannot express most of the rows the other plans list
None of the five plans uses the 7-column table; all use the brief's Event, Who, Where, When
(`OPS_LAYER_BRIEF.md:97-98`). Demanding "exactly these columns" (:533) changes the brief's
contract, so it is a cross-plan request for the orchestrator, not only request 1 at :565.
Rows and requests the signature at :494 cannot carry:

| Plan | Row | What does not fit |
|---|---|---|
| all | every event name | flat `snake_case` names; the helper wants `family.name` (:499) |
| CORE `:837` | `network_swept` | `where` is a network id plus a foothold id: no `network` kind, two places, and :312-313 forbids a network id in any row |
| CORE `:838` | `host_scanned` | host plus foothold: source and target, one `where` |
| CORE `:839` | `service_checked` | host plus service name: no slot for the service |
| CORE `:840` | `finding_confirmed` | finding id and status: :313 says no row ever carries a finding |
| CORE `:841` | `technique_refused` | finding, technique, free `reason`; "every refused use" breaks the success-or-counted rule (:223) and the cap |
| CORE `:842` | `technique_used` | finding, technique and host; "as account or for credential" |
| CORE, PRIV | "first time only", "first admin read" | the helper has no once-only rule; say the caller owns it |
| PRIV `:412` | `admin_profile_read` | the PC "and profile id": a second identity (whose profile) |
| PRIV `:414` | `credentials_harvested` | a count of accounts: `detail` is a closed code list, no number |
| PRIV `:415` | `domain_account_locked_out` | where is "the domain": no kind |
| CRACK `:316-317` | `crack_run`, `crack_yield` | where is an account, not a place; an offline action has no place and `where:` is required; "with status" is outside `ok/fail/denied`. The log plan says cracking writes nothing (:576): the two plans disagree |
| CRACK `:315` | `hash_obtained` | "host/share": no `share` kind |
| MFA `:551` | `mfa_challenge` | PC plus route (keyboard, foothold, from, credential kind): fits `detail` only if H3 is settled |
| MFA `:553` | `mfa_prompt_sent` | a request number: no numeric slot |
| MFA `:554` | `mfa_prompt_approved` | `by` owner or held phone (also asked for at `:576-577`): no field; using `actor` would break :583-584 |
| MFA `:557` | `helpdesk_request` | two identities (account asked about, desk NPC); where is a desk; `what` plus a result of granted, refused or blocked |
| MFA `:558` | `account_password_reset`, `account_mfa_reenrolled` | account plus the desk NPC who did it |

Met as written: OPS_CORE's "no NPC actor, callable inside the lock without a second save"
(`OPS_CORE_PLAN.md:857-858`), MFA's "no session" (`as:` is explicit), the skin's "no skin in a row".
Fix: add `target: { kind:, id: }` (optional second thing: the account, service or profile acted
on), `by:` (an identity code), a small integer `n:`, `where: nil` for a placeless event, and the
kinds `network`, `share`, `desk`, `domain`; widen results or map them in a published table
(granted to ok, refused to denied). Then rule on the conflicts: whether a finding id or network id
may be stored when only a display word is served, and whether cracking writes rows.

### C2 (minor) `actor` against user decision 1
Brief section 2.1 says "no actor concept". The helper has an `actor:` argument that is `'player'`
at every call site in all six plans. It costs bytes in every row (S1) and reads as the thing the
user ruled out. Either drop it until the defence work needs it (an absent field can default to
`'player'` on read) or put it to the user as an open question.

### C3 (minor) The skin plan's parity run needs a stable server read
`OPS_REALISM_SKIN_PLAN.md:464` compares "the S9 log rows with their times removed" across three
games. `log_rows_for` returns `elapsedMs`, `serverMs` and `seq`; name the comparison form (event,
as, where, result, detail, in order) so that plan has something fixed to call.

---

## Check 8. Completeness, testability, open questions

### P1 (minor) Section numbers no longer line up with the other plans
All five siblings have 13 Log rows, 14 Cross-plan requests, 15 Open questions. This plan puts the
contract at 13 and shifts the rest to 14, 15, 16, so "section 13" means two things and "section 14"
and "15" point at the wrong heading here.
Fix: 13 "Log rows" with 13.1 to 13.3 the contract and 13.4 this plan's own table; 14 and 15 as in
the template.

### P2 (minor) Build stages
- L1 "rows are stored but nothing reads them" is testable by model tests only. The brief asks for
  a scripted playtest and live proof per engine feature (`OPS_LAYER_BRIEF.md:56-59`); say L1's
  proof is deferred to L2 or give L1 a server-state assertion in an existing `test_access_*` run.
- L1 edits `start_login_session!`, which S3, S5a and S8 also change (:473). "L1 should land early"
  (:478) is the only ordering statement; make it a request in section 15 with the stage it must
  precede.
- L3 says "every other ops feature adds its own events in its own build stage" (:127): that is not
  part of L3 and cannot be tested by it. Move the sentence to section 13.
- Missing from section 12: `scripts/minigame-data-schemas.json` (V2), the JS harness lists (V3).
- Dungeon graph: a note node per source is fine; say what the graph shows when a reader's
  `flagActions` gate a door, since that edge exists only for a seed anomaly.

### P3 (minor) The teaching claims against the recommended defaults
Lesson 1 (:16-17) is "a cloned card ... logs under the victim's name". Recommended default (a) in
question 1 shows `-` for a copy and the holder's name for the real card, so by default the log
tells a copy from an original, which no door controller can, and the headline lesson is off unless
the author opts in. Put that cost in the question.

### P4 The seven open questions
| Q | Real user choice? | Comment |
|---|---|---|
| 1 copied card identity | yes | add the cost in P3; add option (d): name the holder only when the request carried one card |
| 2 storage | yes, mostly | the plan should fix the numbers (S1) and name the migration risk; then recommend |
| 3 refused swipes | plan should settle | once H1 and S2 are fixed, log them; no real choice left |
| 4 time | plan should settle | T1's server-side estimate removes both options' drawbacks |
| 5 remote reading | plan should settle | (a) now is forced by build order; keep as a note, not a question |
| 6 NPC rows | yes | it sets how lived-in a log looks and touches the office-life direction |
| 7 server check of an investigator's answer | defer | not an A24 decision; move to a "left for later" note |

Missing questions that are real choices: whether to keep `actor` (C2); whether `notPermitted` and
post-lockout attempts leave rows (H4); whether a play row may ever be an anomaly (V1, S2).

---

## Summary

| Grade | Count | Ids |
|---|---|---|
| blocker | 0 | |
| major | 8 | S1, S2, R1, H1, H2, T1, V1, C1 |
| minor | 21 | S3, S4, R2, R3, R4, H3, H4, H5, H6, H7, T2, T3, V2, V3, O1, O2, C2, C3, P1, P2, P3 |
| nit | 4 | S5, R5, V4, O3 |

P4 is the open-questions table and carries no grade.

Most serious:
1. C1: the helper signature and the 7-column table cannot express most of the rows the other four
   plans list, and two of the plan's own "never in a row" rules conflict with OPS_CORE's rows.
2. H1 with S2: badge rows are keyed on a request parameter, so forged or replayed `/unlock` calls
   write unlimited rows, name unreached rooms, and push every earlier row out of the 300-row ring.
3. V1: log-filter's filters, time parsing, tint, detail panel and selection are all fixed to the
   two authored types; the ops type is a larger change than section 5.2 and stage L2 allow.
