# L2a server half, review R1 (code against plan)

Commit reviewed: b0d5e98a8 on ops-logs. Reviewer read-only. Findings appended check by check below.

Files are cited at `b0d5e98a8` (read with `git show b0d5e98a8:<path>`). Short names: `gc.rb` =
`app/controllers/break_escape/games_controller.rb`, `ops_log.rb` = `app/models/break_escape/ops_log.rb`,
`game.rb` = `app/models/break_escape/game.rb`, `events.rb` = `lib/break_escape/ops_log_events.rb`,
`lrt` = `test/controllers/break_escape/log_rows_test.rb`, `olt` = `test/models/break_escape/ops_log_test.rb`,
plan = `docs/achitechture/OPS_LOG_ROWS_PLAN.md`.

Method: everything below was checked by reading the code and the plan. I ran no test (the builder's
counts are the builder's claim, not re-run here). Nothing in the tree was edited but this file.

## Check 1: the route against section 6

Walked `gc.rb:1904-1926`.

- Step 1 (plan 313): not a String, empty, or over 64 characters gives 400 `{success:false, reason:'invalid_object'}`. An array
  or hash param is not a String, so 400. Correct.
- Steps 2 and 3 (plan 314-336): one `unless` at `gc.rb:1916-1917`, one render at `:1918`. Every refusal (invented id, an object
  matched only by display name or by the client's generated id, wrong type, no `logSource`, undeclared source, not reached)
  leaves through that single line, so the 404 body, status and `Cache-Control: no-store` header are the same bytes on every
  path. Correct.
- No lock: `log_rows` is not in the `with_game_lock` list (`gc.rb:104-106`). No save and no row: `log_rows_for_client`,
  `log_rows_for`, `container_reach_refusal`, `session_admits?`, `path_unlocked?`, `room_unlocked?`, `folder_route_allowed?`
  only read. Correct (and `lrt:162` pins it for a desktop reader).
- Answer and `unchanged` (plan 337-340): as `keyring` does (`gc.rb:1889`). Correct.

Findings:

**m1 (minor). The rows are built before the reach check.** `gc.rb:1917`: `(answer = @game.log_rows_for_client(source_id)) &&
log_reader_reached?(located)`. Plan 312-336 gives the order: declared, then reached, then the answer. For a real but
unreached reader the server builds every row (an HMAC and several scenario walks per row, up to 150 rows) and then throws
them away; for an invented id it does none of that. The bodies are equal but the response time is not, which is a small
oracle for "this reader exists and has rows". Fix: test the declaration cheaply and build last, for example
`OpsLog.sources_for(@game.scenario_data).any? { |id, _s, _c| id == source_id } && log_reader_reached?(located)` in the
`unless`, then `answer = @game.log_rows_for_client(source_id)` after it (and 404 if that is nil).

**m2 (minor). The 400 carries no `no-store`.** `gc.rb:1911-1915`: the header is set after the 400 return. Plan 340 asks for
`no-store` on the route. Harmless in practice (an error answer), one line to move above the id check.

## Check 2: the extraction, and reach

Diff of `#container` walked line by line against `container_reach_refusal` (`gc.rb:3160-3187`) and
`render_container_refusal` (`:3190-3200`):

| Old branch | Old answer | New |
|---|---|---|
| resource scope, `!session_admits?` | 404 `Container not found: <container_id>` | `:not_found`, same render |
| resource scope, object is a sign-in PC | 403 `{error: "PC not reachable: <container_id>", reason: 'unreachable'}` | `:unreachable`, id chosen by scope type = `container_id` |
| resource scope, `!path_unlocked?` | 403 `Container not unlocked: <container_id>` | `:locked` |
| object is a sign-in PC (any non-resource scope, or none) | `render_login_desktop` | nil (`:3175`), then the same `elsif` |
| other scope, `!(session_admits? && path_unlocked?)` | 403 `Container not unlocked` | `:locked` |
| login_pc scope, `!folder_route_allowed?(scope id)` | 403 `PC not reachable: <scope id>`, reason | `:unreachable`, id = scope id |
| no scope | falls through to the unscoped code | nil at `:3161` |

Order of checks, the number of calls to each predicate, statuses and bodies are the same. The success renders are unchanged
lines. `#container` is byte-identical in behaviour by reading. Builder departure "extraction keeps a second private method
`render_container_refusal`": accept.

Reader reach (`log_reader_reached?`, `gc.rb:3204-3208`):
- Unscoped: `room_unlocked?(room_id) && path_unlocked?(path + [object])`, exactly plan 329-333.
- Resource scope: `session_admits?`, sign-in-object refusal, `path_unlocked?`; no route check, as plan 324-326.
- Profile scope: `session_admits?` and `path_unlocked?`, no route check, as plan 326-327.
- Sign-in PC scope: the same plus `folder_route_allowed?(scope id)` (`gc.rb:3276-3288`): `foothold=` and `from=` and
  `relay=1` are judged by `desktop_request_allowed?`, two routes conflict (false), no route is refused only at a relay
  session. That is the mechanism plan 327-328 names. Builder departure "`relay=1` is accepted as a route param though plan
  308 lists only `foothold` and `from`": accept (it comes with `folder_route_allowed?`, and it only ever refuses or
  matches a relay session).

**m3 (minor, needs a ruling). A no-route read under a foothold session answers 200.** `lrt:299-301` asserts it. Plan 327-328
and 334 (use `folder_route_allowed?`, "as `/container` does") give exactly this, so the code follows section 6. But plan 648
(section 11) asks for a test that "a reader through a foothold route answers with the route and 404 without it", and plan
344-345 says "readable only while a session admits it, over that session's route". Read literally those want a no-route
request refused. My judgement: the builder's reading is right (same rule as a folder on the same desktop, and the rows are
the player's own), and plan 648 should be reworded to "404 for a wrong route, for a relay request, and after the foothold
is unplugged". Until ruled, treat as accepted. Whichever way, see T3 (the route-down case is untested).

**m4 (minor). A reader that is itself a sign-in object skips the session check.** `gc.rb:3175` returns nil for any object
with `lockType: 'login'` outside a share, because in `/container` the next step is `render_login_desktop`, which makes its
own session check. `/log_rows` has no such next step: `log_reader_reached?` reads the nil as "reached". So an
`ops_log_terminal` authored with `lockType: "login"` and placed in a sign-in PC's contents or in a profile is readable
with no session at all (not even `session_admits?` runs). It needs odd authoring ("this log terminal needs a sign-in" is a
plausible thing to try), and in L2a the rows are the player's own, but with L2b seed rows it would show authored history
unearned. Fix, one line at the top of `log_reader_reached?`:
`return false if BreakEscape::Game.login_pc?(located[:object])` (a reader is never a desktop), plus a test; or a validator
error for `ops_log_terminal` with `lockType: login` (validator is the client builder's/another file, so the route line is
the smaller fix).

## Check 3: what a row sends

Walked `ops_log_client_row` and its helpers (`ops_log.rb:410-470`).

- Exactly seven symbol keys, built from an allow-list; `seq`, `serverMs`, `last`, `p`, `n` and any later stored key (`by`)
  cannot leave. Correct (plan 351-356, 13.6).
- `id`: `OpsLog.row_id(game id, source id, seq)` (`ops_log.rb:276-279`): HMAC-SHA256 under
  `key_generator.generate_key('ops_log_row_id')`, first ten hex, over the JSON of `[game id, source id, seq]`. Exactly plan
  360. Stable (a merged row keeps its `seq`; eviction does not renumber), per game and per source, not guessable without
  the app secret. The key generator is the caching one, so no per-row key derivation cost. Correct.
- `elapsedMs`: the stored first-occurrence game time as an Integer; the game time in `last` is not sent. Plan 361 and 13.4
  ask for nothing more. Correct.
- `event`: the label. An event no longer registered shows its stored name upper-cased and an empty detail: harmless.
- `as`: account through `normalise_username`; typed as stored, `~` when cut; npc and card by display name; else `-`. An
  account and a typed name render alike (plan 376-379; `lrt:200`, `olt` test 3). No row tells whether a typed name is an
  account. Correct apart from M1 below.
- `where`: display name through `KINDS`, `-` when the kind is unknown or the id no longer resolves. See m5.
- `result`: upper-case, ` xN` above 1, trailing `+` with `p`. Exactly plan 365.
- `detail`: only keys registered on the event; `show: false` dropped; id rules by display name, `-` unresolved. Correct.
- `rev` (`ops_log.rb:282-284`): MD5 over `[title, rows]` where `rows` are the rows as sent, six hex. It digests nothing the
  client was not sent, and it is compared only after the reach check, so it is no oracle. Correct (plan 337-340).

**m5 (minor). A thing with no authored name is shown by its raw id.** Plan 352 lists "raw ids" among what never reaches the
browser and plan 380-383 says a place "whose kind has no display name ... shows as `-`, never as the raw id". The reader
takes whatever `KINDS[...][:name]` answers, and those lambdas (L1a, `events.rb:57`, `:117`, `npc_named`, `card_item`) fall
back to the id when the room, object, NPC or card has no `name`. So `where` can be a raw object or room id and `as` a raw
NPC id (`ops_log.rb:437`, `:439`, `:449`, `:466`). The `:name` lambdas double as the existence check at write time
(`game.rb:4238`), so they cannot simply return nil. Options: (a) accept, and reword plan 382 (a room or object id is known
to a browser that has loaded the room; an NPC id of a card holder may not be); (b) add a `:label` lookup that answers nil
when no name is authored and have the reader use it; (c) a validator warning for an unnamed NPC that holds a card in a
scenario with `logSources`. I suggest (c) plus (a); the orchestrator should rule.

## Check 4: showCardHolder

What the plan wants (section 15 question 1, option d, plan 373-375, 624, 1178), per source:

| Swipe | Source with `showCardHolder` | Source without |
|---|---|---|
| holder's own keycard | holder | holder |
| one card sent (a copy) | holder | holder |
| several cards sent, a copy passes | holder | `-` |
| card with no single holder, one card sent | card name | card name |
| card with no single holder, several sent | card name | `-` |

What is stored (`game.rb:4224-4241`, L1b): the identity is kept when `own || one card || ANY source sets the flag`, as
`{npc:}` when the card has one holder, else `{card:}`. The row is shared, so it cannot say why it has an identity.

What the reader does (`ops_log.rb:389`, `:434-439`): in a source without the flag, when another source sets it, every
`badge_swipe` row with `{npc:}` shows `-`.

**M1 (major). The reader's holder rule both shows what it should hide and hides what it should show.**
- Shown that should not be: `ops_log.rb:438-439`, a `{card:}` row is never hidden. In a game where another source sets the
  flag, several cards sent at once with a holder-less card passing stores `{card: id}` (`game.rb:4241`), and the plain
  source prints that card's name. That is the exact thing option (d) and `rfid_unlock_card_answer` withhold (which of
  several held cards the lock admitted), in a source that did not opt in. This breaks the stream brief's 2026-11-23
  decision and plan 373-375.
- Hidden that should be shown: in the same mixed game the plain source shows `-` for the holder's own keycard and for a
  single copied card, which option (d) shows by default ("teaches the lesson by default", plan 1277-1278).
- L2b trap: the rule keys on `event == 'badge_swipe'` and an NPC identity only, so if L2b renders seed rows through the same
  helper, an authored seed swipe's holder is blanked in a plain source of a mixed game.
- The tests (`lrt:246`, `olt` last new test) pin the heuristic, write the row with the helper directly, and never go through
  `/unlock`, so none of the three cases above is exercised.

**Proposal (smallest correct design): a stored marker on the row, written only when the identity is there because of the
flag alone.** No change to the helper's signature or to the stored row's shape rules:
1. `lib/break_escape/ops_log_events.rb`: `badge_swipe` gains one hidden detail rule,
   `detail: { 'flagged' => { count: 1, show: false } }` (the existing `count` rule type; `show: false` keeps it out of the
   browser and out of `detail`; the 400-byte cap spec covers it automatically). Shared file with the core stream: one line
   edited in place, no rewrap.
2. `app/models/break_escape/game.rb`: `ops_badge_as` computes `natural = own || ids.nil? || ids.size <= 1` and the flag
   separately; when the identity is kept only because of the flag (`!natural && flag`), `write_badge_swipe_ok!` passes
   `detail: { 'flagged' => 1 }`; otherwise no detail. (Return the pair from `ops_badge_as`, or add a small
   `ops_badge_flag_only?(card_id, ids)`.) Detail is part of the merge identity, so a flag-only row never merges with a
   natural one.
3. `app/models/break_escape/ops_log.rb`: `log_rows_for_client` passes `hide_holder: !show_holder`; `ops_log_client_as`
   answers `-` for a `badge_swipe` row whose stored `detail['flagged']` is present when `hide_holder`, for both the `npc`
   and the `card` form; everything else shows. Drop `other_shows_holder`.
4. Tests: model tests for the five rows of the table above in a two-source game; one controller test through `/unlock`
   with two held copies (plain source `-`, flagged source the holder) and with one copy (both show the holder).
Rows already stored by a game started before the marker have no `flagged`, so they show in every source; only
`test_ops_logs` games can hold such rows, and that scenario sets no `showCardHolder`. Before building, confirm at
`ops_log_check_call` that a `count` rule accepts 1 and that a registered detail key may be absent.

## Check 5: sources

- A terminal reads only `minigameData.logSource`, which must be a declared source (`ops_log.rb:383-384`, the same
  `sources_for` list the writer uses: first 30, no `_` ids). Rows come from `player_state['opsLog'][that id]` only. Two
  sources cannot bleed. Row ids differ per source for one stored event. Correct.
- Protected rows show only the trailing `+`. Correct.
- Order: `seq` ascending (`log_rows_for`). Caps: enforced at write; the reader adds none, which the plan does not ask for.
- Seed rows are not listed; no `seedRows` is read. Right for L2a (plan 95). No finding.

## Check 6: unchanged scenarios

- No `logSources`: `log_rows_for_client` answers nil, so every read is the 404; nothing is written (`lrt:237`).
- No terminal: the route is never called; `#container` is unchanged by reading (check 2).

**m6 (minor). The golden fixture does not cover either `unreachable` refusal.** `test/fixtures/files/ops_unchanged/
log_container_cases.json` holds one 404 `Container not found`, four 403 `Container not unlocked`, and the sign-in desktop's
`no_session` answers; it has no `PC not reachable` case. The two `:unreachable` renders (`gc.rb:3194-3196`: a sign-in
object in a share, id = the container id; a folder by a refused route, id = the PC id) are the only place the extraction
chooses between two ids, and the existing suites assert only `reason` there
(`test/controllers/break_escape/network_shares_test.rb:292`, `keyring_folder_route_test.rb:72`). By reading they are
identical to the old lines; nothing would fail if the two ids were swapped. Fix: add `assert_equal 'PC not reachable:
share_kiosk', body['error']` and `'PC not reachable: jake_pc'` to those two tests (the fixture is never re-recorded).

## Check 7: lists, route, policy

- `set_game` entry on its own added line (`gc.rb:29`), no rewrap: merge-friendly. Not in `with_game_lock`. Correct.
- `config/routes.rb:61`, directly above `get 'keyring'`. Correct.
- `GamePolicy#log_rows?` = `show?`; `policy_test.rb:125` adds it to `DEVICE_ACTIONS`, whose tests check owner, other user,
  nil user and the roles. Correct. No finding.

## Check 8: tests

Plan 643-652 item by item:

| Plan item | Test | Would fail if broken? |
|---|---|---|
| 400 for a bad id | `lrt:66` | yes |
| same 404: missing, wrong type, undeclared | `lrt:79` (`no_such_object`, `plain_note`, `r_undeclared`, all in the start room) | yes |
| unreached room | `lrt:79`, `:115` | yes |
| locked cabinet, own lock | `lrt:123` | yes |
| desktop without a session | `lrt:135` | yes |
| **share without a session** | none | **gap, T1** |
| held, then 404 after lock or sign-out | `lrt:135` | yes |
| foothold route | `lrt:282` | partly, T3 |
| any position, rows written later | `lrt:99` | yes |
| `rev` unchanged, `no-store` | `lrt:209` | yes |
| `assert_ops_log_holds_no_secret` over every response body | `lrt:196` once, over the stored log | **gap, T2** |
| profile reader, no `admin_profile_read` | skipped | accept, T7 |

**T1 (minor).** No reader on a share: plan 646 names "a reader on a share without one", and the resource branch of
`container_reach_refusal` is the one scoped branch `/log_rows` never exercises (refused without a foothold or session,
answered with one, sign-in-object refusal). Add a share fixture reader (the `network_shares_test` scenario has shares).

**T2 (minor).** `assert_ops_log_holds_no_secret` takes a game and checks the stored log, not a response body, and it is
called in one test. Plan 650 wants every response body checked. Add a small helper in `lrt` that, after each successful
read, asserts no value of `OpsLog.compared_secrets(game)` appears in `response.body`, and call it from `read`.

**T3 (minor).** Foothold test: no `from=` case, no two-routes (conflict) case, and no route-down case (unplug the drop box,
then the read with the right `foothold` is 404). The last is the one that shows a session whose route is gone stops
admitting a reader.

**T4 (minor).** `olt:905` is named "keyed per game and source" but asserts only per game. Add: one event stored in two
sources has two different ids (plan 360, "cannot count rows in other sources").

**T5 (minor).** The holder tests pin the heuristic (see M1) and bypass `/unlock`. Replace with the M1 tests.

**T6 (minor).** `lrt:162` (reading writes nothing) covers only the desktop reader. Add `r_open` and `r_profile` to the loop.
The 404 and 400 answers' `Cache-Control` are not asserted (m2).

**T7.** Skipping the `admin_profile_read` test: accept. The event is not registered anywhere in `app`, `lib` or `test` at
this commit, so the plan's assertion cannot be written. The stage that adds the event must add the test (profile reader
read writes none; `/container` on the same profile writes one); T6's `r_profile` addition holds the "writes nothing" half
until then. Note it in the handover so it is not lost.

Tests that cannot fail: none found. Weak ones: `lrt:91` repeats a case already in `lrt:79`; `'jake_pc'` in `lrt:79` sits in
a locked room, so it does not isolate the wrong-type check (`plain_note` does); the last assertion of `lrt:237` checks
keys a GET could never add.

Style: `olt` new test 2 ends with a mis-indented `end` (ten spaces); cosmetic.

## Check 9: Ruby 2.7, Rails 7.0, later stages

- `filter_map`, `&.[]`, keyword arguments, `response.parsed_body`: all fine on Ruby 2.7 and Rails 7.0. No finding.
- L2b: seed rows go in at the top of `rows` in `log_rows_for_client` before the digest (the handover says so); they carry
  `at` in place of `elapsedMs`, so the seven-key assertions (`lrt:14`, `olt`) must allow either. The current holder rule
  would blank seed holders (M1). A seed row's `as` for a `signin_*` row is a bare username, not a stored `as` hash, so it
  needs its own builder rather than `ops_log_client_as`.
- L3: a reader on a share runs the resource branch, untested here (T1). `share_folder_opened` is written in `#container`
  after the three checks; the extraction leaves that spot intact (`gc.rb:643-644`).

## Builder departures

| Departure (handover) | Ruling |
|---|---|
| `render_container_refusal` as a second private method | accept |
| `relay=1` accepted as a route | accept |
| No-route read under a foothold session answers | accept, pending ruling m3 |
| `showCardHolder` by "another source sets it" heuristic | M1 |
| `detail` is `""` when empty | accept (plan 366 does not give an empty form; the client must treat `""` as empty) |
| `where` is `-` when none | accept (plan 364) |
| `admin_profile_read` test not written | accept, T7 |
| Display-name match refused by `reader['id'] == object_id` | accept (stricter than the plan, and it keeps an id-less reader out) |
| `title` falls back to `Log` | accept |

## Counts and verdict

- Blocker: 0
- Major: 1 (M1)
- Minor: 12 (m1, m2, m3, m4, m5, m6, T1, T2, T3, T4, T5, T6); T7 is an accepted skip, not a finding.

Verdict: **not yet clean; one fix round.** The route, the extraction and the row allow-list match the plan and
`#container` is unchanged by reading. M1 must be fixed (it touches `game.rb` and `ops_log_events.rb`, outside the server
builder's file list, so the orchestrator has to assign it). m3 and m5 need a ruling. m1, m2, m4, m6 and T1 to T6 are small
and can go in the same round.

Checks not completed: none. Not done: no test was run by this review.

## R1 outcomes

Fix round commits: 1bf1527c5 (model, event line, badge writer, model tests) and 7874c1d2a (controller, controller tests). Handover updated in HANDOVER_L2a_server.md.

| Finding | Outcome |
|---|---|
| M1 | Fixed in 1bf1527c5 and 7874c1d2a: stored hidden marker `flagged`, reader shows `-` for a flagged row (npc or card), heuristic and its tests removed. Tests drive /unlock: own card, single copy, several cards with a copy (npc form) and a holder-less card (card form), a source with the flag and one without in the same game, and a game with no flag. Marker never in a response. |
| m1 | Fixed in 7874c1d2a: declaration checked, then reach, rows built last. |
| m2 | Fixed in 7874c1d2a: no-store set before the id check; test asserts it on 400, 404 and 200. |
| m3 | Accepted per ruling; no code change (handover notes it). |
| m4 | Fixed in 7874c1d2a: `log_reader_reached?` refuses a sign-in object; test with a locked sign-in reader under a held session. |
| m5 | Fixed in 1bf1527c5: kind word instead of raw id for where, as (npc, card) and id details; model test. |
| m6 | Fixed in 7874c1d2a in log_rows_test.rb (not in network_shares_test / keyring_folder_route_test, which are outside this fixer's file list): /container asserts `PC not reachable: lena_pc` (refused folder route) and `PC not reachable: share_kiosk_log` (sign-in object in a share). |
| T1 | Fixed in 7874c1d2a: LogRowsShareTest (404 without a session, answer with foothold, 404 after unplug, sign-in reader refused). A wrong route name on a resource is not refused by design (no route check on a resource scope). |
| T2 | Fixed in 7874c1d2a: every `read` scans the body for every compared secret. |
| T3 | Fixed in 7874c1d2a: wrong from=, from= plus foothold conflict, relay, route-down after unplug. |
| T4 | Fixed in 1bf1527c5: one event in two sources has two ids. |
| T5 | Fixed (see M1). |
| T6 | Fixed in 7874c1d2a: loop over reader ids with no-store and no state or updated_at change (r_open, r_desktop, r_profile, r_vault, r_cabinet, invented id). |
| T7 | Accepted skip; owed to the stage that adds admin_profile_read (in handover). |

Mutation proofs: marker never written (2 failures), reader ignores the marker (3), login-reader guard removed (1), no-store removed (2), reach check for scoped readers removed (5, covers T1 and T3).
