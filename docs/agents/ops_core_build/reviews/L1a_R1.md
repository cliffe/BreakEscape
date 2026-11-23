# L1a review R1 (code against plan)

Reviewed: `31c406dcb..87f9e4208` on `ops-core`. Reviewer read-only. Findings appended per check.

Note on range: the reviewed range ends at `87f9e4208`, but the L1a validator tests
(`test/js/validator-log-sources.test.mjs`) and the "no scenario outside `test_ops_*` declares
`logSources`" test landed one commit later, in `e9be86ba4`. Both were read at that commit.

(Checks 1 to 8 read; findings below. No tests were run by this review: every claim is from reading.)

## Findings

Paths are at `87f9e4208` unless marked. Plan = `docs/achitechture/OPS_LOG_ROWS_PLAN.md`.

### Major

**M1. Lock-answer secret source misses the real answer of combination and cryptex locks, and door-entry answers.**
`app/models/break_escape/ops_log.rb:735-746`. Plan 13.2 step 2 (lines ~800-806: lock answers are "the fields
`filter_requires_recursive` and `strip_lock_answers!` strip") and section 11 ("a code-lock `requires`").
The source registers `requires` only when `lockType` is `pin` or `password`. For a `combination` or `cryptex`
lock the server's answer is `requires` (`lib/break_escape/capture_model.rb:179` `LOCK_ANSWER_TYPES`,
`game.rb:4563-4571` comment: "`requires` is the server's secret; these copies..."); the code registers only the
optional authored copies (`combination`, `cryptexConfig.answer`). A door entry in `rooms.*.doors[]` that carries
its own `requires` and inherits `lockType` from the connected room (`capture_model.rb:235-246`) is also missed.
The type rules still stand, so no leak path exists today; the guard (the second defence) is blind to these values.
The test fixture hides it: its "code answer" is a `password` lock (`test/models/break_escape/ops_log_test.rb:101`).
Fix: build the source from `CaptureModel.each_lock_answer(data)` filtered by `LOCK_ANSWER_TYPES` (raw value, plus
the joined forms for an Array), keep the `combination` / `cryptexConfig.answer` copies, and add a combination
lock, a cryptex lock and a door-entry `requires` to the `secret_values` test.

### Minor

**m1. `where: nil` is accepted for an event that has places.** `ops_log.rb:386-387`. Plan 13.2 step 2
("`where.kind` is one the event allows (or nil where it allows none)"). A sibling that forgets the place stores a
placeless row in any exact-name source. No test. Fix: refuse nil when `definition[:places]` is non-empty; add to
`malformed_calls`.

**m2. Guard is on in every environment except production.** `ops_log.rb:126-129` (`!Rails.env.production?`).
Plan 13.2: "runs the matcher in test and development". A staging or other named environment would raise 500s on a
malformed call. Fix: `Rails.env.test? || Rails.env.development?`.

**m3. "Never raises in production" covers only `Malformed`.** `ops_log.rb:314-324`. Plan 13.1 header comment.
`ops_log_store` and the lookups run outside any rescue; a corrupt stored value (a non-Array source, a non-Hash
row: `:634`, `:658`) or a lookup error raises into the game route. Fix: when the guard is off, rescue
`StandardError` around the whole call, warn one line (event only), answer nil.

**m4. `credentials` branch of the password source reads fields that do not exist.** `ops_log.rb:722-729`.
The registry entry is schema-closed (`kind account proof connectsTo foundIn endsOnGlobal label expiresMin`); none
of `password hash value secret token` exists, so the branch never fires on a valid scenario, and the test proves
it with an invented key (`ops_log_test.rb:111`; likewise the top-level `capture_holder`, `:112`). The plan's
"credential values" needs a ruling: either drop the branch and the fixture line, or name the real field. Not a
leak (passwords come from `creds.password`).

**m5. Authored collisions are recomputed on every call and every row, not "once at load".** `ops_log.rb:192-212`,
`:230-232`, `test/support/ops_log_assertions.rb:12-15`. Plan 13.2 ("computed once at load"). Each guarded call
walks the whole scenario about five times; the assertion helper does so per row. Dev and test only, but it will
slow every later suite. Fix: memoise per game instance (keyed on the scenario object), and compute once in the
assertion helper and pass the set to `find_secret_hit`.

**m6. `OpsLog.clock` ignores `travel_to`.** `ops_log.rb:107-112` (`Process.clock_gettime`). Plan 12 item 1: the
golden helper "freezes the clock (server times, token clocks)". `opsLogClockAt`, `serverMs` and the ten-second
bootstrap test are outside that freeze, so any later golden fixture or `travel_to` test on a `logSources` game
flaps unless it also wraps `with_clock`. Fix: `(Time.now.to_f * 1000).to_i`, or have `OpsGolden.play` wrap
`OpsLog.with_clock`.

**m7. Protected-row warning skips a source with no `maxRows`.** `scripts/validate_log_rows.rb:240`. Plan 9
(warning: `maxRows` below events plus limited places). The default 50 is never checked. Fix: use
`LOG_DEFAULT_SOURCE_ROWS` when absent.

**m8. "Limited places" approximation over-counts (builder approximations 1 and 2).**
`validate_log_rows.rb:215-230`, `:173-187`. `pc` counts every object id and every NPC id (not sign-in PCs);
`where.rooms` narrows doors only, so a room-scoped sign-in source counts every object in the scenario;
`where.places` narrows only when no rooms or objects are given. Result: false "protected row" and "save-counter
keys" warnings on ordinary scoped sources in the `test_ops_*` scenarios to come. Fix: `pc` = objects with a login
lock; apply `where.rooms` by the holding room for `object` and `pc`; union, not conditional, for `places`.

**m9. Secret-collision warning uses the wrong secret set (builder approximation 3).**
`validate_log_rows.rb:288-289`. Plan 9: the warning is for a secret the guard leaves out. `hard_access_raw_values`
includes rfid and biometric `requires` (card ids, owner names: not registered secrets) and `flags`, and omits
combination and cryptex answers and capture secrets. An rfid lock whose `requires` equals a card item's `id` (the
normal badge-log scenario) warns falsely. Fix: pin, password, combination and cryptex answers
(`each_lock_answer` + `LOCK_ANSWER_TYPES`), psk, capture secrets, NPC passwords.

**m10. `where.places` existence check will refuse later kinds.** `validate_log_rows.rb:135-141`. Any kind other
than `door` or `account` must be an object or NPC id, so `network:<id>`, `host:<id>`, `share:<id>` (the only way
those places match, plan 4.1) and `foothold:jack_<id>` error as soon as their kind is added to `KINDS`. Fix: a
per-kind lister table in the validator, with an explicit entry each stage must add.

**m11. `_` author-note keys inside `logSources`.** Schema allows `^_` keys on the block and on a source;
`OpsLog.sources_for` (`ops_log.rb:243`) treats a Hash-valued `_note` as a source and counts it toward the 30, and
the validator (`validate_log_rows.rb:51`) errors on it. Fix: skip keys starting `_` in both.

**m12. Stored-id check is wider than the plan's list.** `validate_log_rows.rb:156-171`, `:190-199`. Every `id`
anywhere in the scenario (objective, task, message ids) must fit 40 characters of `[A-Za-z0-9_.:-]`; plan 9
lists rooms, objects, NPCs, items, hosts, networks, shares, desks, footholds and access points. Stricter is safe,
but it can refuse a scenario for an id no row can hold. Accept or narrow; orchestrator's call.

**m13. Event-name patterns disagree.** `lib/break_escape/ops_log_events.rb:34` allows a one-character name;
schema and validator need two (`{1,39}`). Fix: `{1,39}` in `EVENT_PATTERN`.

**m14. Source matching by `where.objects` and `where.rooms` ignores kind.** `ops_log.rb:554-559`. Plan 13.2
step 3: "a host, network or share matches only `where.places`". A host or network whose id equals a listed
object id would match. Fix: admit by rooms or objects only for kinds with a room lookup (door, object, pc, jack,
ap), or only when `room` is non-nil.

**m15. `verify-run.rb --ops-log` prints `as.typed` in full.** `tools/playtest/verify-run.rb:274-277`. Typed text
may be a password the player typed into the username box (plan 13.1 allows storing it). The tool's output goes
into agent and CI logs. Fix: print typed text masked (length and `cut` only) unless `--show-flags`-style opt-in.

**m16. `OPS_GOLDEN_ONLY` with a misspelt name passes green.** `test/lib/ops_unchanged_replay_test.rb:11-19`,
`bin/ops-golden-compare:35`. No fixture test is defined and "there are fixtures to replay" still passes. Fix:
fail when a named fixture does not exist. Also: `OpsGolden.answer_for` (`test/support/ops_golden.rb:65-69`)
supports only GET and POST; a later plan's fixture through `PUT /sync_state` needs PUT added.

**m17. Test gaps (section 11 bullets with no test that would fail).**
- Secret walk cannot fail on a weak count rule: no two-digit numeric secret is in the walk, so `count: 99` would
  clamp 4821 to 99 and pass (`ops_log_test.rb:597-622`; plan: "fails on ... a `count` maximum of 99"). Add a
  two-digit issued or registered secret and a walk value equal to it.
- `assert_ops_log_holds_no_secret` has no negative test in the model suite (only verify-run plants a secret row,
  `ops_log_verify_run_test.rb:51-59`). Add one: plant a row, expect the assertion to fail.
- Production warning line: asserted by count only (`:492-506`); plan wants "contains the event and key path and
  none of the fixture's secrets".
- `p` set on a row the tenth call *merged into* (only stored rows tested, `:265-273`).
- Step 7 at run time: no test that a built row over 400 bytes is not written (`:442-459` builds a Hash by hand).
- Eviction classes 3 to 5 order is not asserted (`:372-387` title says "an ok row last", no assertion).
- Bootstrap "writes nothing under ten seconds": `ops_log_clock_test.rb:111` asserts `updated_at >= stamp`, which
  cannot fail. Assert `updated_at` equal across the 9,999 ms and 15,000 ms loads.
- No controller test that `PUT /sync_state` carrying `opsLog`, `opsLogSeq`, `opsLogOnce`, `opsLogSaves` or
  `opsLogClockAt` leaves them unchanged (section 7 "never read from a sync body"; true by reading, unguarded).
- `ops_log_test.rb:426` is a tautology and `:408` has dead `.first(0)` noise; remove.

## Checks, by number

1. `write_log_row!` against 13.2: steps 1, 3 to 8 match. Step 2: m1. Caps, eviction order, clamp (150/140/10,
   thirty-first ignored), window edges (299,999 / 300,000, future start), full map reclaim, no-`scenario_data`
   game: all correct by reading. Class 4 always picks row 0 and class 5 is unreachable; harmless. A new row can be
   evicted by its own append when every older row is protected (Result still says appended): as the plan orders.
2. Registry and guard: no path found for a registered secret through `as`, `where` or `detail` (codes, resolved
   ids, aliases, counts to 9 only). Registry gap M1; dead branch m4. Guard switch m2; hit raises `SecretInRow`
   (ArgumentError, "secret in <event> <path>", no value). The assertion helper walks every source and row through
   the one matcher over `as`, `where`, `detail`, skipping `as.typed` and `as.cut`: as claimed (m5, m17).
3. State: keys are server-owned; bootstrap ships named keys only (`games_controller.rb:303-420`),
   `savedScenarioClock` does not carry the top-level clock key; sync merges named sections only; none is in
   `ACCESS_STATE_DEFAULTS` or the reset list. Bounds as section 8. `logSources` is in `WITHHELD_SCENARIO_KEYS`
   and is top level, so no room answer carries it. Delta sync rule holds: no new sync section.
4. Clock: seed, sync refresh (key-gated, no `scenario_data` load), bootstrap refresh at ten seconds, first-write
   seed all present. A client can hold the stamp by resending an old `elapsedMs` (same effect as the reload the
   plan accepts) and cannot move time back. m6.
5. Unchanged scenarios: every path is gated on `logSources` or on the clock key. Golden compare catches a changed
   body, status, answer count and state value; its normalisations are the plan's two, plus the game-id scrub
   (needed, accept). m16.
6. Schema closed on a source and on `where` (with the project's `^_` note pattern, m11). Every L1a error and
   warning has a fixture test (at `e9be86ba4`). Approximations: m7 to m10, m12.
7. Tests: m17.
8. Ruby 2.7 / Rails 7.0: nothing 3.x-only found (`filter_map`, `to_h {}`, `delete_suffix`, `clamp` are fine;
   host Ruby is 2.7.0). Later-stage hazards: m6, m10, m11, and this note: `register_secret_source` state lives on
   a reloadable module, so a sibling must register in a file loaded whenever `Game` is (its own included concern
   or `ops_log.rb`), never an initializer, or development reloads drop the source silently.
   Out of plan, for a ruling: scenario `flags` values and top-level `npcs` / `phoneNPCs` are not in the registry
   or the `npc` kind (room NPCs only, as `account_npcs` does).

## Builder departures

| Departure | Verdict |
|---|---|
| Thread-local test overlay for `EVENTS` / `KINDS` | accept |
| One switch `with_guard` for guard and raise-on-malformed | accept (m2 on its default) |
| Placeless row not taken by a source with a `where` filter | accept (4.1 wording) |
| `cut: true` when control characters were stripped | accept (the plan's test needs it) |
| Plain merge into a `p` row does not refresh `last` | accept (13.2 step 6) |
| Account `as` stored as the declared username | accept |
| `include OpsLog` first in `Game` | accept |
| Clock key refreshed on any valid incoming `elapsedMs`, equal or stale included | accept (right for a paused clock; costs one save on a sync that would otherwise not save) |
| Bootstrap refresh in `run_bootstrap_writers!` | accept |
| Schema: no `seedRows` yet, event pattern only | accept (L2b) |
| Reader, seed-row, terminal and graph checks absent | accept (L2) |
| Validator "limited places" and save-key count approximations | m7, m8 |
| Secret-collision warning from `hard_access_raw_values` | m9 |
| Wider collision set in the helper (place kinds, `KINDS` keys) | accept (those words can only sit in `where.kind`) |

## Counts and verdict

| Severity | Count |
|---|---|
| blocker | 0 |
| major | 1 |
| minor | 17 |

Verdict: **fix-and-delta-review**. Fix M1 and m1, m2, m3, m6, m7, m9, m10, m11, m17 before siblings build on the
helper; m4 and m12 need a one-line ruling; the rest can ride with the delta. All eight checks completed; no test
was run by this review.

## R1 outcomes

Fixer pass. Commits: A `d727f8fc2` (validator), B `fdc2b42a2` (engine, helper, verify-run, model tests), C `a278ac2e5` (golden helper, clock tests). Line numbers moved; places re-found by name.

| Id | Outcome | Commit | Note |
|---|---|---|---|
| M1 | fixed | B | `lock_answers` source built from `CaptureModel.each_lock_answer` filtered by `LOCK_ANSWER_TYPES` (raw value, joined forms of an Array), plus the authored `combination` / `cryptexConfig.answer` copies. Tests: combination (string and array), cryptex, door-entry `requires` on an inherited lock. Proved by narrowing the types back to pin/password: `secret_values` test failed. |
| m1 | fixed | B | nil `where` refused when the event has places; `write(game, 'tst_signin')` added to `malformed_calls`. |
| m2 | fixed | B | guard on only in test and development; test stubs `Rails.env` (test, development on; production, staging, demo off). |
| m3 | fixed | B | with the guard off, `write_log_row!` rescues `StandardError` around the whole call, one warning line (event and error class only), nil. Test injects a raise in the store. |
| m4 | fixed (ruling) | B | invented `password/hash/value/secret/token` branch removed; the credentials source now reads the real field `account` and registers that holder's `creds.password`. Fixture credential uses real keys (`kind account foundIn`); invented `capture_holder` replaced by a real `capture.secret` on an object. NPC passwords registered from every `creds` hash (room npcs, top-level `npcs`, `phoneNPCs`); scenario `flags` values registered (new source `scenario_flags`). |
| m5 | fixed | B | `authored_collisions` kept on the game, keyed on scenario, events and kinds content; assertion helper computes the secret set once per game. Registered secrets are still read per call (not part of the finding). Proved by removing the cache: the same-object test failed. |
| m6 | fixed | B | `OpsLog.clock` uses `Time.now`; test with `travel_to`. The golden replay already uses `travel_to`, so it now freezes the clock. |
| m7 | fixed | A | no `maxRows` uses the default 50 (JS test). |
| m8 | fixed | A | `pc` is a login-lock object; `where.rooms` applies by holding room to object and pc; rooms, objects and places are a union. Proved by reverting the filter and the pc rule: the m8 test failed. |
| m9 | fixed | A | warning uses pin, password, combination and cryptex answers, psk, capture secrets, NPC passwords and flags. An rfid card id no longer warns. Proved by dropping the type filter: the m9 test failed. |
| m10 | fixed | A | `LOG_PLACE_LISTERS` table (door, object, pc, npc); a kind with no entry is not existence-checked (comment says each stage adds its lister). |
| m11 | fixed | A, B | `_` keys skipped in `OpsLog.sources_for` and the validator (not counted toward 30). |
| m12 | fixed (ruling) | A | stored-id check narrowed to map keys under rooms, networks, resources and every `id` inside rooms and resources; objective, task and message ids no longer refused. |
| m13 | fixed | B | `EVENT_PATTERN` `{1,39}`; spec test for a one-character name. |
| m14 | fixed | B | rooms and objects admit only when the place has a room lookup; test with a room-less kind. |
| m15 | fixed | B | `verify-run --ops-log` prints typed text as `[N chars]` unless `--show-flags`; test. |
| m16 | fixed | C | a named `OPS_GOLDEN_ONLY` fixture that does not exist fails (proved with a misspelt name); `OpsGolden.answer_for` plays PUT and PATCH. |
| m17 | fixed | B, C | two-digit secret in the walk (proved by setting `MAX_COUNT` to 99: walk failed); `assert_ops_log_holds_no_secret` negative test; production warning lines checked for event and path and no secret; `p` on a merged row (proved by marking appended rows only); run-time step 7 test (proved by removing the size check); class 2 and 3 eviction order asserted (classes 4 and 5 not reachable, unchanged); bootstrap asserts `updated_at` equal under ten seconds and after a fresh refresh (proved with a zero refresh interval); sync-body test (proved by a temporary line that reads `opsLogSeq` from the body); tautology and `.first(0)` removed. |

Withdrawn: none. Open: none.
