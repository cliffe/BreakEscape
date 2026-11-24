# L3a R1: network and share rows, code against plan

Reviewed at `fee3415b0` (with `400e7fd35`). Read-only review.

Method: read from `git show fee3415b0:<path>` and `fee3415b0^:<path>`; nothing was run (no test
re-run, no golden compare: the builder's counts in HANDOVER_L3a.md are not re-verified). Findings
about requests are read from the code path, not driven live.

## Check 1: the rows of 13.8 against the call sites

| Row | Site (at fee3415b0) | Verdict |
|---|---|---|
| `net_link_up` | `network_access.rb:283`, `plant_device!`, after every refusal and the already-planted return, before the method's `save!` (`:284`) | as the plan: `as` nil, `where` `jack` with the id from the server's own jack record (`:246`), no detail, no `once`/`save_limit` (the route saves anyway) |
| `net_link_down` | `network_access.rb:319`, `unplug_device!`, after the unknown, not-planted and unreachable returns, before `save!` (`:320`) | as the plan |
| `net_wifi_join` | `network_access.rb:397`, `join_network!`, after unknown, unreachable, already-held (`:375-380`) and wrong-key (`:383-385`) returns, before `save!` | as the plan. A second access point of a held network answers `already` and writes none (it changes only `gainedFootholds`): accepted, "one per join" |
| `share_folder_opened` | `games_controller.rb:3204-3216` `log_share_folder_opened`, called at `:644` after `container_reach_refusal` (`:640-641`) | on the right branch; `once: true`; save only when stored. See F1 (what is served is not always a folder) |

No row is written on a refused or forged request: unknown jack, unreachable jack, port security,
no device, repeat plant, nothing planted, unknown or unreachable access point, wrong key, repeat
join; a share open that is not admitted (`:not_found`), a sign-in object in a share
(`:unreachable`), a locked path (`:locked`), an invented id. The plan gives no row for any of
these, so "nothing" is right in each. None doubled, none missing.

**F1 (minor, the top one). A forged `/container` request for a FILE in a share writes a row that
names the file.** `games_controller.rb:3209-3213`; breaks plan 13.8 lines 1194 and 1204-1206
("records opening a folder, never a file"; "Never in these rows: ... a file name"), 5.1 line 247
("`folder` the served folder's id") and question 3 (a). `login_scope_of` resolves ANY object in a
share, at any depth, by id or by name (`game.rb:4477-4480`, `network_access.rb:1712-1722`), and
`container_reach_refusal` passes a leaf whose path is unlocked. So
`GET /container/inbox_letter?foothold=jack_comms_port` (the test scenario's share `scanned_inbox`,
a planted foothold) answers 200 as it always did and now stores
`share_folder_opened` with `detail: { folder: 'inbox_letter' }`, which the reader shows as
`folder: <the file's name>`. The game's own client never asks `/container` for a file, so this
needs a hand-made request, the row is in the player's own log, and the name is one the same
request path already serves (the route answered such a request before this change), which is why
this is not a major. Second effect: every object in a share, not every folder, is now a distinct
`once` key (see F2). The handover says "A folder or item in it: its own id", so this was a choice,
not an oversight; it is not the plan's.
Fix: write the row only when the served object is the share record itself or has a `contents`
Array (a container); a leaf writes nothing. Add a test: `/container/<file id>` in an admitted share
answers as before and stores no row and does not save.
Also in F1's code: an object with no `id` reached by its `name` is logged with no `folder` key,
i.e. as "the share itself opened" (`:3212`, `folder_id.empty?`), and so shares the share's once
key. With the fix above, give a container with no id no row rather than the share's row.

**F2 (minor). Nothing bounds the number of distinct `once` keys the share row can make, and the
once-set forgets past 256.** `ops_log.rb:853-855` (`once.last(MAX_ONCE_KEYS)`), plan line 399 and
963; plan 13.3 lines 993-996 ("bounded by `once:`"). A key is (account or none, share, object).
In a scenario whose reachable shares hold more than 256 servable objects (with F1 unfixed: files
count; fixed: folders only), a client that walks them in a ring gets one stored row and one
`save!` per request for ever, because each key has been dropped from the set by the time it comes
round. No scenario today is near that. Fix F1 first (it cuts the count to folders); then either a
validator warning when shares in a `logSources` scenario hold more folders than the set can
remember (counted with the accounts that can admit them), or leave it and record it as a known
limit in the plan's section 9. This is as much a plan gap as a code one; flagged for a ruling.

## Check 2: the refactor of the share admission rule (an existing access check)

**Verdict: the boolean answer is identical for every input. No finding.**

Old `session_admits?` (`fee3415b0^:game.rb:3305-3329`) against new (`game.rb:3305-3336`):

| Input | Old | New `session_admitting` | New `session_admits?` |
|---|---|---|---|
| nil scope | `true` | `:unscoped` | true |
| `login_pc`, session Hash held, not locked, route up | true | the PC id (a String; `""` is truthy in Ruby too) | true |
| `login_pc`, no session / locked / route down (expired token, host off, lost foothold, ended relay invite, `from` source gone) | false | nil (`pc_id if ...`) | false |
| `profile`, unknown id | false | nil | false |
| `profile`, some held session whose live identity the `for` list admits and whose route is up | `keys.any?` true | the first such PC id in `sessions_oldest_first` | true |
| `profile`, none (locked sessions have no `session_identity`) | false | nil | false |
| `resource` | `resource_admits_player?(r)` | `resource_admitting(r)` | see below |
| any other type | `false` (the `else`) | nil (no `else`) | false |

The profile branch scans the same set: `sessions_oldest_first` (`game.rb:3342-3345`) is a pure
reorder of `access_sessions.to_a` (every pair kept, sort key `[Integer, Integer]`, no state
written; `signed_in_pcs` at `:3948` is a pure reader that answers `[]` for a missing key).

Old `resource_admits_player?` (`fee3415b0^:network_access.rb:1606-1651`) against new
`resource_admitting` (`network_access.rb:1619-1664`): the four early `return false` are
`return nil` in the same order (not a Hash; listed-only share; `resource_down?`; no network). The
session block is byte for byte the old block (not a Hash, locked, relay, PC or NPC unresolved,
route down, no host network, then reach and the access list). The one real change is ORDER: the
old code tried the foothold branch first and returned true, then the sessions; the new code scans
the sessions first, then the foothold. `a || b` against `b || a`: the truth value can differ only
if evaluating one side raises or writes. I read every method the block calls
(`session_locked?` `game.rb:3883`, `relay_session?` `network_access.rb:1560`, `find_login_pc`
`game.rb:3252`, `scenario_room_npc`, `session_route_up?` `network_access.rb:1180-1206`,
`object_network`, `networks_reachable_from`, `resource_acl_admits?` `:1600`): all are readers; the
only write is the `@reach_cache` memo, which holds no game state. The block already ran in the old
code for every state in which no foothold admitted, so it raises in no state the old code survived.

| Case | Old | New |
|---|---|---|
| open share, foothold reaches its network, no session | true (foothold) | `:foothold` |
| open share, foothold and a session both admit | true (foothold, sessions never scanned) | the session's PC id |
| open share, session on the same network only | true | PC id |
| open share on a linked network, session only (no pivot foothold) | false | nil |
| access-listed share, admitted session across up links | true | PC id |
| access-listed share, foothold only | false (the foothold branch needs `access` nil) | nil |
| locked session only | false | nil |
| expired token session, host off, lost route only | false | nil |
| relay session only | false | nil |
| share on an unreached network | false | nil |
| share on a down network, or its own `offWhen` holds | false (`resource_down?`; `player_reach` and `session_route_up?` refuse too) | nil |
| listed-only share | false | nil |
| unknown share id (`resources[id]` nil) | false | nil |

Callers and what each now gets:
- `GamesController#container_reach_refusal` `games_controller.rb:3230` (share branch) and `:3239`
  (sign-in PC and profile scopes; also behind `GET /log_rows` through `log_reader_reached?`):
  `session_admits?`, a strict true/false, same truth as before.
- `Game#unlock_scope_refused?` `game.rb:4404`: the same.
- `NetworkAccess#resource_item_for_add` `network_access.rb:1765` (an inventory add from a share):
  `resource_admits_player?`, now `!resource_admitting(r).nil?`, same truth.
- `Game#session_admits?`'s own resource branch (`game.rb:3334`).
- New: `Game#ops_share_as` `game.rb:3349-3353`, the only caller that reads the value rather than
  its truth; it takes an account only from a String that is a held session key.
- `scope_admitted_by_session?` (`game.rb:3355`) does not use either method and is untouched.
No other caller in `app/` or `lib/`.

Notes, not findings: an open share under a foothold now also runs the session scan on every call
(a few lookups per held session); `resource_admitting` and `sessions_oldest_first` are public
(needed: `session_admitting` is called from the controller).

## Check 3: `#container`

- The call sits after `container_reach_refusal` returned nil for a `resource` scope
  (`games_controller.rb:640-644`): admitted, not a sign-in object, path unlocked. An unadmitted,
  unknown, listed-only or down share still answers `Container not found` 404 and never reaches the
  call; a locked folder 403; both unchanged lines.
- `once: true`; `@game.save! if row&.stored?` (`:3215`); the route holds the game lock and has
  reloaded (`:630`), and nothing between the reload and the save writes state (the refusal check
  and `session_admitting` are readers), so the save carries only the row, `opsLogOnce`, `opsLogSeq`
  and the clock key.
- The share itself against a folder: `located[:object].equal?(share)` (`:3212`) holds because
  `NetworkModel.resources` returns the scenario's own entry objects and `resource_scope_of` returns
  the same one. Right, if fragile; it has a test.
- The row keys on the server-resolved object id, not on the request's `container_id`, so asking
  by name and by id makes one key. `foothold`, `from` and `relay` params do not reach the row.
- Unbounded saves: per state the keys are finite and authored; see F1 and F2 for the two ways the
  count is larger than the plan assumes.
- Byte-identical: `log_share_folder_opened` returns at its first line without `logSources`
  (`:3205`); the render line is unchanged; the non-share branches are untouched. Yes for both
  (by reading; the golden compare is the builder's claim).
- Note: `ops_share_as` and the `resources` lookup run outside the helper's production rescue. Both
  only repeat reads the refusal check has just made, so no finding.

## Check 4: what a row holds

- `as`: network rows nil. Share row: `{ account: }` of a session the player holds and that admits
  the share, or nil (foothold only, or a guest session). Never the PC, foothold, relay or source
  id. Which account when several admit: departure (b), F3.
- `where`: ids from server records; shown through `ops_log_client_thing`, which shows the authored
  name, else the kind word, never the raw id (`ops_log.rb:500-507`). `share_named`
  (`ops_log_events.rb:226-231`) falls back to the id as the other lookups do, and the reader turns
  that into `share`.
- Wi-Fi key: `net_wifi_join` has no detail rule and `as` nil, so the key has no field; the
  wrong-key branch returns before the call (`network_access.rb:383-385`); the typed key is never
  passed to the helper; `psk` is a registered secret source (`ops_log.rb:962`). Confirmed.
- No share content. A file name: only through F1. A folder name the player has not seen: only by a
  hand-made request naming a nested folder's id or name under an unlocked parent, which the route
  already answered with that folder's contents before this change; no finding beyond F1.

## Check 5: saves for plant, unplug and join

Each call is the line before the method's own `save!`; no save added; the already-planted and
already-joined returns are above the call and write nothing (the join's `record_gained_ap!` save is
old). A plant/unplug ring writes a row per real change on a route that saves anyway; rows are held
by the source cap. As 13.8.

## Check 6: registration

`ops_log_events.rb:50-53`: the four events match 13.8 (places, result `ok`, no detail on the net
rows, `folder` => `{ id: 'object' }`, no `save_limit`). `share` kind at `:130-133` with no room, as
4.3 says. In the walk (`ops_log_test.rb:568-570`), `net_*` as nil and `share_folder_opened` as an
account are both right (the call sites pass only those), and the ceiling row is still built with a
40-character `where` id and detail id; the limit is not loosened.

## Check 7: unchanged scenarios, browser, state

No answer gains a field; no new state key (`sessions_oldest_first` derives from `signedInPcs`); a
scenario without `logSources` does no new work beyond the two-line early returns. OK.

## Departure (b) and F3

**F3 (minor; accept the departure with the limit written down). "Oldest" is the order PCs were
first signed in at, not the order the held sessions began.** `game.rb:3338-3345`; plan line 1190
and 1194-1195 ("the session signed in first"). Where they differ:
1. Sign in at A as alice, at B as bob, sign out at A, sign in at A as carol (or switch user at A):
   held sessions are bob (older) and carol (newer); the row names carol.
2. A token sign-in (and a relay, though a relay is no share source) never enters `signedInPcs`
   (`game.rb:4637-4642`), so a token session ranks after every listed PC even when it is the
   oldest; among themselves such sessions fall back to stored key order (jsonb: shorter keys
   first), which is not time either.
What a reader is misled about: only WHICH of the player's own admitted accounts the open is put
under. The name is always an account the player holds a live session as and that the share
admits, so nothing unearned and no secret. But (i) an author who builds a puzzle or anomaly on
"the share was opened as X" gets Y in those sequences; (ii) because the once key includes the
account, a folder already logged under bob gains a second row under carol after the flip, which
reads as two people opening it when one player did, once. Both are small beside what the plan
itself already accepts (the row names the oldest session's account, not the desktop the player
opened the share from).
Acceptable for L3. Wanted: the plan's 13.8 wording changed to say what is built ("the session at
the PC first signed in at"), the two cases above noted, and one test that pins the edge so a later
change is deliberate. The exact fix (a `seq` on the session record, as footholds have) belongs to
whoever next edits `start_login_session!` and can update `network_technique_test` and
`network_ops_state_delta_test` with it.

## Check 8: tests

Present and able to fail: one row per plant, unplug, join with `as` nil and the right `where`, on a
re-read game; every refusal stores nothing; repeat plant and repeat share open do not save
(`updated_at`); foothold-only share row with `as` nil; another account's own row; folder row with
`folder` and no file id; refused opens; two sessions in both sign-in orders (this one would fail
under key order, since the two PC ids sort one way only); no foothold, jack or PC id in a share
row; the reader's shown form; implant and card copy write nothing; no-`logSources` runs.

**F4 (minor). The agreement test cannot fail.** `network_log_rows_test.rb:351-371`:
`assert_equal game.session_admits?(scope), !admitting.nil?` compares the method with its own
definition (`game.rb:3306`). Plan section 11 lines 628-630 wants the two to "answer alike ... over
that suite's cases", which is now true by construction; what needs pinning is that the answers did
not CHANGE, and that is carried only by the existing shares, session and access model suites
passing unmodified (the builder's run; not re-run here). The lines after the loop (`:367-370`) and
the `:foothold` test are real. Fix: replace the loop's assertion with the expected truth per scope
written out (the table in check 2), and add the reordered case: an open share with both a foothold
and a session admitting answers the session's PC id, and each alone answers true.

**F5 (minor). The "byte for byte" comparison drops a field without saying why.**
`network_log_rows_test.rb:193`: `plant('comms_port').except('first')`. `first` should be equal in
both runs (each builds a fresh game). Either it differs, which would be a real difference between
a logged and an unlogged scenario and needs explaining, or the `except` is not needed and should
go. Also this test opens only the share itself; add a folder open and a non-share container.

**F6 (minor). Gaps against section 11.**
- No test for F1's request (a file id, and an object reached by name).
- No test of the (b) edge (F3).
- Section 11's last bullet (a call site forced into a malformed call fails the route and leaves the
  game row unchanged) has no L3 case: none for plant, unplug, join or the share open. For the
  share open this matters most, because the route's only save is the row's.
- The failed-join secret check is by `assert_nothing_stored` (enough); the success-path key test
  (`:171-175`) is right.

## Check 9: merge readiness

`ops-core` and `ops-build` have no change to these five files beyond the merge base today, so
nothing conflicts yet. Hunks here that rewrite or move existing lines (the rest are pure adds):
- `game.rb` `session_admits?` (old `:3305-3329`): the whole body. `return true if scope.nil?`
  gone; the `login_pc` expression rejoined onto one line under `pc_id if`; `return false unless
  profile` -> `nil`; `access_sessions.keys.any? do` -> `sessions_oldest_first.map(&:first).find do`;
  the `resource` line; the `else false` removed. The core plan's added line and the privilege
  plan's admin branch both land in this method: a hand merge, into `session_admitting`.
- `network_access.rb` `resource_admits_player?` (old `:1606-1651`): four `return false` ->
  `return nil`; the foothold `if` block (old `:1615-1619`, with its comment) MOVED below the
  session block; `access_sessions.any? do |pc_id, session|` -> `session_pc =
  sessions_oldest_first.find do ...`; `end` -> `end&.first`; one comment word ("above" -> "below").
- `ops_log_events.rb:47`: a trailing comma added to the `technique_used` entry's last line (the
  end of `EVENTS`); any stage that appends an event conflicts here (keep both, mind the comma).
  `share` in `KINDS` and `share_named` are inserted between existing entries, no line changed.
- `ops_log_test.rb:568,570`: both hand-kept list lines rewritten; any stage adding an event to
  either list conflicts (keep both).
- `plant_device!`, `unplug_device!`, `join_network!`, `#container` and the new controller method:
  added lines only.

## Departures

- (a) `:foothold` and `:unscoped`: **accept.** The plan contradicts itself (nil for a foothold
  against `!nil?`); the build keeps the access answer and `ops_share_as` gives `as` nil. The plan's
  13.8 line 1195 ("returns the admitting PC id") should gain the two symbols, and the admin branch
  and core line that later join this method must return a truthy non-String or a held PC id.
- (b) oldest by `signedInPcs`: **accept with F3** (minor; wording, a pinning test, fix deferred).
- (c) one commit for the network calls and the share row: **accept.**
- (d) `implant_foothold!` and `clone_card` write nothing: **accept**; it is the plan's text (5.1
  line 244, 13.8 line 1208), and both have tests.
- (e) tests in a new file: **accept**; it leaves the shares and Wi-Fi files unmodified, which
  helps the check-2 claim that old answers are pinned by unedited suites.

## Count and verdict

Blocker 0, major 0, minor 6 (F1 to F6).

Verdict: **pass with minors.** The refactor of the admission rule is boolean-identical for every
input (check 2); no row is written on an unvalidated branch; no secret or unearned id reaches a
row. Fix F1 (rows for folders only) and F4/F5/F6 (tests) in one tidy pass; F2 and F3 need a
ruling and a plan wording change rather than code now. All nine checks were completed, by reading;
no test was run in this review.

## Outcomes (fixer)

| Finding | Outcome | Commit |
|---|---|---|
| F1 | Row only for the share itself or an object with `contents` and an id; a file or nameless folder writes nothing, `/container` answer unchanged; tests with a file id request (by-name request answers 404 in the fixture, so not tested) | 3bc64aa3f |
| F2 | Validator warning over 200 shares plus share folders (`validate_log_rows.rb`), node test, one sentence in plan 13.8 | 3bc64aa3f |
| F3 | Plan 13.8 wording says what is built; edge pinned by a test; `seq` deferred in HANDOVER_L3a.md | 3bc64aa3f |
| F4 | Table of literal answers for `session_admitting` and `session_admits?` over nil, each scope type, held, locked, relay, route down, foothold only, both | 3bc64aa3f |
| F5 | `except('first')` removed; the byte-equal comparison passes | 3bc64aa3f |
| F6 | Tests added: F1 request, F3 edge, malformed share call leaves the game unchanged (plant, unplug, join not added) | 3bc64aa3f |
