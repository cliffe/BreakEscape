# L2a server half, delta review R2 (plus first read of the scenario step)

Reviewer: read-only. Commits reviewed: `1bf1527c5`, `7874c1d2a` (server R1 fixes), `56bcadf16`
(scenario step). Started 2026-11-23. Findings are appended below as they are made.

Short names as in R1: `gc.rb` = `app/controllers/break_escape/games_controller.rb`, `ops_log.rb` =
`app/models/break_escape/ops_log.rb`, `game.rb` = `app/models/break_escape/game.rb`, `events.rb` =
`lib/break_escape/ops_log_events.rb`, `lrt` = `test/controllers/break_escape/log_rows_test.rb`, `olt` =
`test/models/break_escape/ops_log_test.rb`, plan = `docs/achitechture/OPS_LOG_ROWS_PLAN.md`. Line numbers are at
HEAD `09586fd4e` (read with `git show HEAD:<path>`). Method: reading only; I ran no test and no validator.

## Part 1: the R1 findings, checked in the code

| R1 id | Status | Checked at | Note |
|---|---|---|---|
| M1 | confirmed fixed | `game.rb:4206-4209`, `:4227-4255`; `events.rb:24`; `ops_log.rb:388-390`, `:425-441`, `:468-480` | details below; two residues N4, N7 (minor) |
| m1 | confirmed fixed | `gc.rb:1914-1920` | type, own id, `logSource` a String, declared (`sources_for ... any?`), `log_reader_reached?`, then `log_rows_for_client` last |
| m2 | confirmed fixed | `gc.rb:1907` (header set before the id check); `lrt` "every reader leaves the game untouched" asserts it on 400, 404, 200 | |
| m3 | accepted by ruling, no code change | `lrt:409-410` still asserts the 200 | nothing to check |
| m4 | confirmed fixed | `gc.rb:3206`; `lrt` "a reader that is itself a sign-in object is refused even while a session is held"; share form in `LogRowsShareTest` | authoring trap left, N5 |
| m5 | fixed, one fallback missed | `ops_log.rb:452-459`, used at `:436`, `:438`, `:447`, `:476` | see the KINDS table below and N1; test covers one kind only, N2 |
| m6 | confirmed fixed (placement accepted) | `lrt` "/container names the desktop for a refused folder route", and the last test of `LogRowsShareTest` | see "m6 placement" |
| T1 | confirmed fixed | `LogRowsShareTest` (two tests) | 404 no session, 200 with foothold, 404 after unplug, sign-in reader 404 |
| T2 | fixed in one class of three | `lrt:56-67` | N3 |
| T3 | confirmed fixed (route-down, conflict, relay) | `lrt` foothold test, the lines after `:410` | a lone wrong `from` and a good `from` are still not read, N6 |
| T4 | confirmed fixed | `olt` "one stored event in two sources has two different row ids" | asserts same `seq`, two ids: fails if the source leaves the HMAC input |
| T5 | confirmed fixed | `lrt` four "the holder rule" tests through `POST /unlock`; `olt` "a flagged badge row reads -" | heuristic test removed, as ruled |
| T6 | confirmed fixed | `lrt` "every reader leaves the game untouched, and every answer is no-store" | r_open, r_desktop, r_profile, r_vault, r_cabinet, an invented id, a 400 |
| T7 | accepted skip | - | still owed to the stage that adds `admin_profile_read` |

Test counts (`grep -c '^\s*test '`): `olt` 61 -> 63 (one renamed and rewritten: the heuristic test became the marker
test; two added); `lrt` 16 -> 24 (one removed: the heuristic controller test, replaced by four `/unlock` tests; nine
added in all). Nothing else deleted or loosened. The mis-indented `end` in `olt` is repaired.

### M1 in detail

- **Written on exactly the flag-only swipes.** `game.rb:4208`: `as && ops_badge_flag_only?(card_id, ids)`.
  `ops_badge_flag_only?` (`:4253`) = not natural and a source sets the flag; natural (`:4244`) = the player holds the
  real keycard, or no id list, or one id. `ops_badge_as` (`:4231`) keeps the identity when natural or flag set, the
  same two predicates, so "identity kept" and "marked" cannot drift: identity kept = natural or flag; marked =
  identity kept and not natural. A swipe with no identity (`as` nil) carries no marker. The denied row
  (`:4221`) passes no detail. No other caller of `write_log_row!('badge_swipe'` exists in `app/`.
- **Reader.** `ops_log.rb:433`: for a `badge_swipe` row with a truthy stored `detail['flagged']` and `hide_holder`,
  `as` is `-`, tested before the npc and card branches, so both forms are covered. `hide_holder` is
  `!show_holder` of the source being read (`:388-390`), so two readers in one game differ as ruled. The account and
  typed branches come first, which is right: a badge row never has those forms.
- **The marker never leaves.** Detail: `ops_log_client_detail` (`:474`) drops a `show: false` rule, so `detail` is
  `""`. `rev` (`:282`, `:392`) digests only the title and the rows as sent. Row id (`:412`) is the HMAC of game,
  source and `seq`. `result` reads only `result`, `n`, `p`. Count of rows: the same number in both sources. `lrt`
  `as_shown` asserts the string `flagged` is in no body; `olt` asserts it for `to_json` of the answer.
- **Merging.** `detail` is in the merge identity (`ops_log.rb:715`), so a flagged row never merges with a natural
  one. That is right and leaks nothing: in the plain source they read differently anyway (`-` against the holder),
  and merging them would have to pick one. The one visible difference from a game with no flag is N4 below
  (unreachable today as far as I can find).
- **Cap.** A marked row adds 22 bytes (`"detail":{"flagged":1}`); the ceiling spec (`olt:569-589`) builds each
  event's detail from its rules and so now includes `flagged`; it stays far under 400.
- **Registration.** `{ count: 1, show: false }` passes `rule_problems` (`events.rb:231-238`: one rule type, `show`
  false, count 1 to 9); key `flagged` passes `CODE_PATTERN`; `olt:11` asserts the shipped table has no problems.
  `ops_log_check_detail_value` (`ops_log.rb:600-602`) stores `min(1, min(1, 9))` = 1. The secret matcher compares
  an Integer only against numeric secrets of 10 or more (`:233`), so the 1 can never trip the guard.
- **A game with no flagged source is unchanged.** `ops_badge_flag_set?` is false, so `detail` is nil and the row is
  byte-identical to L1b's; `lrt` "with no source setting the flag" and the first holder test assert `detail` nil.
- **`verify-run.rb --ops-log` prints the marker** (`tools/playtest/verify-run.rb:286-288`, the stored detail as
  JSON). Acceptable: it is a server-side developer dump of stored rows, it already prints `seq` and raw ids, and
  it is not a browser route. `test_ops_logs` sets no `showCardHolder`, so its playtest output holds no marker.
  No change asked.

### m5: every KINDS fallback

`ops_log_client_thing` (`ops_log.rb:452-459`) shows the kind word when the looked-up name equals the id or the id
without a leading `jack_`.

| Kind | Fallback in `events.rb` | Caught? |
|---|---|---|
| door | `:57` room name or `id` | yes |
| object, pc, jack, ap | `object_name` `:117` `id.to_s` | yes |
| account | `:77` the username (no fallback) | exempt at `:456`, right: the username is the display form |
| npc | `:144` `displayName`, `name`, then `npc['id']` | yes |
| card | `:85` `name` or the `id` passed (also when matched by `card_id`) | yes |
| network | `:170` | yes |
| host | `:175` | yes |
| foothold, `jack_<id>` or a bare jack, AP or PC id | `:179-181` `object_name(thing, raw)` | yes (the `jack_` strip) |
| foothold, `wifi_<network>` | `:184-185` `network_named(game, wifi)` falls back to the bare network id | **no: N1** |
| foothold, `implant_<pc>` | `:187-188` `object_name(pc, pc)` falls back to the bare PC id | **no: N1** |

## Part 1: new findings

**N1 (minor). m5 misses two foothold forms: a raw network id or PC id can still reach the browser.**
`ops_log.rb:458` compares the name with `id` and `id.sub(/\Ajack_/, '')` only. For a foothold id `wifi_<network>`
the lookup answers the bare network id when the network has no `name` (`events.rb:184-185`, `:170`), and for
`implant_<pc>` the bare PC id when the PC has no `name` (`:187-188`, `:117`); neither equals `id` nor the
`jack_`-stripped id, so the raw id is shown. It is reachable now: `network_swept` and `host_scanned`
(`events.rb:34-35`) carry the shown detail `from` with rule `{ id: 'foothold' }`, rendered at `ops_log.rb:476`.
Fix: `[id, id.sub(/\A(?:jack|wifi|implant)_/, '')].include?(name) ? kind : name`, and a model test with an unnamed
network swept from a `wifi_` foothold. (If the validator already requires a `name` on every network and sign-in PC
the case cannot be authored, but the ruling says "never", and the reader is the place that guarantees it.)

**N2 (minor). The m5 test covers one kind.** `olt` "a place with no authored name shows its kind word" checks `pc`
in `where` only. The `as` forms (`ops_log.rb:436`, `:438`: an unnamed NPC holder, an unnamed card) and an id detail
(`:476`) are the cases the R1 finding named as the more sensitive ones (an NPC id of a card holder) and have no
test: reverting `:436` to the old lookup fails nothing. Fix: add an unnamed NPC and an unnamed keycard to that
test (two more `write` lines and two assertions on `as`), plus the N1 case.

**N3 (minor). T2: the secret scan does not walk every response body, and it can fail falsely.**
- `lrt:56-60` scans inside `LogRowsTest#read` only. `LogRowsFootholdTest#read` (`lrt:389-392`) and
  `LogRowsShareTest#read` do not scan, nor does the direct `get` at `lrt:396`. That is about twelve `/log_rows`
  bodies, among them every body answered over a foothold route. Plan section 11 asks for every response body.
  Fix: move `assert_body_holds_no_secret` into a small module (or `test/support/ops_log_assertions.rb`) and call
  it from all three `read` helpers.
- The scan is a substring match over the raw body, which includes the ten-hex row ids, the six-hex `rev` and
  `elapsedMs`. A short digits-only secret (this scenario's own `r_own_lock` PIN `5555`, if `lock_answers` registers
  it, and any 4-digit PIN in the fixture) matches a random hex id about once in 9,000 rows and the ids change with
  the game's database id, so the suite can fail with no fault. Fix: scan the parsed answer's `title` and each
  row's `event`, `as`, `where`, `result`, `detail` (the text cells), not `id`, `rev` or `elapsedMs`.
- Nothing asserts the list scanned is non-empty. Add once: `assert_includes OpsLog.compared_secrets(@game),
  JAKE_PASSWORD`, so the scan cannot pass because no secret source answered.

**N4 (minor, no change asked now; record for L2b and for any re-lockable rfid lock).** Two marked rows at the same
place with different stored identities do not merge (`as` differs, `ops_log.rb:715`), and in a source without the
flag both read `- / place / OK`: two rows where a game with no flag stores one row `OK x2`. That would tell a plain
reader that the lock admitted a different card the second time. Likewise a marked row and an identity-less row
(`as` nil) at the same place. It needs two granted swipes at one lock, and `write_badge_swipe_ok!` is called only
for a lock in force and not open (`game.rb:4194-4195`); I found no path that re-locks an rfid door or object
(`git grep relock` finds only the PC screen lock), so it cannot happen today. If one is added, the fix is in the
reader: coalesce adjacent client rows that are equal in every sent field but `id` (sum their counts) for a source
without the flag. Not for this pass.

**N5 (minor). A reader authored with `lockType: "login"` is now always 404, and nothing tells the author.**
`gc.rb:3206` is the right server rule (R1 m4). But the validator has no check for it (no rule on
`ops_log_terminal` beyond the `minigameData` schema), so "this log terminal needs a sign-in" fails closed and
silently in play. Fix: a validator error in the block the client fixer is editing ("an ops_log_terminal cannot
have lockType login: put it in a sign-in PC's contents or a profile"), with a test; or record it for L2b's
validator work. Not a server-code change.

**N6 (minor). T3 residue.** `lrt` after `:410`: the comment says "two routes conflict, and a wrong `from` is
refused" but the only `from` request is the conflict (`foothold` plus `from`). A lone `from: 'no_such_pc'` (404)
and a `from` that is right (200; needs a second session in the pivot fixture) are not read. One line for the
first; the second can wait for L3 if the fixture has no pivot source ready.

**N7 (minor). The "own keycard" term of the marker rule has no test in a game with the flag.** Every natural case
in `lrt` sends one card, so `ids.size <= 1` alone satisfies `ops_badge_holder_natural?` (`game.rb:4245`).
Deleting `held_keycard_ref_ids.include?(card_id.to_s) ||` from that line would mark (and so hide, in the plain
source) the holder's own keycard sent with a second card, and no test in the two reviewed files fails. Fix: in
the first holder test, also swipe with `[ 'VISITOR-07', JAKE_CARD_ID ]` while holding `jake_spare` and
`visitor_badge`, and assert the holder in both sources and `detail` nil.

### m6 placement

Enough. Both asserts go through the real `GET /container` and the shared `render_container_refusal`
(`gc.rb:3191-3200`): the refused-route case requests `lena_log` and must name `lena_pc` (the scope id), the share
case requests `share_kiosk_log` inside `scanned_inbox` and must name the container id, so swapping the two ids at
`gc.rb:3196` fails both. The golden fixture is never re-recorded, so it could not take them. They sit in a file
named for `/log_rows`; a one-line comment is there. No change asked.

## Part 2: the scenario step, first read (commit `56bcadf16`)

Note on HEAD: while this review ran the branch moved from `09586fd4e` to `140aef76e` (client fixer commits
`e262b6848`, `5f07c654b`, `140aef76e`). Part 1's server line numbers are unchanged by them. Part 2 cites the
scenario, playtest, docs and viewer at `140aef76e`. The validator's sprite error is not reported (exempted in
`5f07c654b`).

### What is right

- `scenarios/test_ops_logs/scenario.json.erb:120-147`: room `security` east of `office`, an rfid door for `finance`,
  two `ops_log_terminal` objects each with an `id`, a `name` and `minigameData.logSource` naming a declared source
  (`door_controller`, `signin_audit`); `minigameData.title` is gone (client ruling m12, `e262b6848`). Nothing of
  L2b (no `seedRows`, `anomaly`, `flagActions`) or L3 (no jack, access point, share, network) is present.
- `test/controllers/break_escape/ops_logs_scenario_test.rb:147-254`: six new tests, all through `GET /log_rows`
  (so each reads the game as the server re-loads it) or `Game.find`. Each can fail: the 404 set (`:170`), seven keys
  and the holder (`:180`), the merged rows and labels (`:200`), `rev` and `unchanged` (`:220`), the security swipe
  (`:234`). Weak spots are S4.
- The viewer hooks the playtest names exist at `140aef76e`: `.ol-wrapper[data-ops-log="viewer"]`,
  `table[data-ops-log="table"]`, `tr.ol-row[data-row-id]`, `td[data-col]`, `[data-filter="time|event|where|result"]`
  (selects) and `[data-filter="as"]` (text input), `[data-ops-log="detail-grid"] [data-field=...]` with the six labels,
  `[data-ops-log="count"]`, `button[data-action="refresh"]`, scene name `ops-log`
  (`ops-log-minigame.js:163-171`, `:220`, `:238`, `:282`, `:316-332`, `:385-389`; `minigames/index.js:239`). TIME
  option values `morning` and `evening` exist (`ops-log-rows.js:18-22`).
- Selectors the client rulings change: none of those the playtest uses. The RESULT select's values are already the
  base words (`FAIL`, `OK`; `ops-log-rows.js:101-111`), and the playtest never sets the RESULT filter. If a RESULT
  beat is added (worth one line in beat 10: set RESULT to `FAIL`, expect the `FAIL x2` row), it must use the word.

### Findings

**S1 (major). Both door rows now read LOCATION `door`: the scenario's rooms have no `name`.** The door lookup
reads `rooms[id]['name']` and falls back to the id (`events.rb:57`); since the m5 fix (`ops_log.rb:458`) an
unnamed place shows its kind word. `office` and `security` carry `door_sign` only (`scenario.json.erb:97`, `:122`),
so the door reader shows `Dana Reyes | door | OK` twice. `PLAYTEST.md:197` expects "LOCATION naming the office door
and then the security door", which a tester cannot see; the handover's "Rows by `where` names" was true only
before `1bf1527c5`. `ops_logs_scenario_test.rb:194` asserts only `where != '-'`, so nothing failed.
Fix (scenario): add `"name": "Finance office"`, `"name": "Security office"` and `"name": "Lobby"` to the three
rooms (the room schema allows `name`), and assert `['Finance office', 'Security office']` for the two rows'
`where` in the test at `:180`. For a ruling, not this pass: real missions author `door_sign` on most rooms and
may have no `name`, so every BADGE row would read `door`; the lookup could take `name`, then `door_sign` (text the
player already sees on the door), then the kind word. That is one line in a file shared with the core stream.

**S2 (major, not server code; owner to be assigned). The validator's reader checks of plan section 9 are not
built, and the docs say they are.** Plan line 446: an error for "an `ops_log_terminal` with no `id`, no
`logSource` or one naming an undeclared source". At `140aef76e` the only mention of the type in `scripts/*.rb` is
the sprite exemption (`validate_scenario.rb:3361`); `scripts/validate_log_rows.rb` never reads an object's
`logSource`. The minigame schema covers a missing `logSource` only. So a reader with a typo in its source, or with
no `id`, validates clean and shows NO ACCESS for ever in play (the route's single 404, by design silent).
`docs/ACCESS_AND_NETWORKS.md` A24 read side, "Validator." says "An `ops_log_terminal` needs an `id` and a
`logSource` that is declared", which is not checked. Fix: in `validate_log_rows.rb`, walk room objects, container
and desktop contents, profiles and shares for the type and report the three errors, plus N5's
(`lockType: "login"` on a reader), with a fixture each in `test/js/validator-log-sources.test.mjs`. Until built,
the docs line must say what is checked.

**D1 (major, docs). The read-side text states the card holder rule wrongly.** `docs/ACCESS_AND_NETWORKS.md:719`:
"the card holder for a badge swipe only when some source sets `showCardHolder` (a source without the flag shows
`-`)". Built (and asserted by this step's own test at `ops_logs_scenario_test.rb:193`, in a scenario where no
source sets the flag): the holder is named in every source when the swipe used the holder's own keycard or the
request carried one card; when several cards were sent, only a source with `showCardHolder: true` names the holder
(or the card), and a source without it shows `-`. A card with no single holder is named by the card under the
same rule. Replace the sentence with that.

**D2 (minor, docs). "What a row never shows" overstates two things.** `docs/ACCESS_AND_NETWORKS.md` A24 read side:
- "A row that holds a registered secret is refused when written": the guard runs in test and development only
  (`ops_log.rb:124-130`, plan 13.2); in production no check runs at write time. Say: rows are built from ids and
  registered codes only, and the test and development guard, the suite and `verify-run.rb --ops-log` fail on a row
  holding a registered secret.
- "A password": the typed username is stored as typed (cut to 32 characters) and never compared with the secrets
  (`ops_log.rb:309`), so a player who types a password into the username box sees it in IDENTITY. It is the
  player's own text and plan section 7 says so; the docs line should make the exception ("except what the player
  typed into a username box").
Also add what is built and not said: a thing with no authored name shows its kind word (`door`, `pc`, `npc`,
`card`), and a room needs a `name` for LOCATION to name its door (S1).

**D3 (minor, docs). `title` on the reader is still documented.** After client ruling m12 (`e262b6848`) the schema
entry has no `title` (`scripts/minigame-data-schemas.json:63-73`), the server never read it (the answer's title is
the source's, `ops_log.rb:387`) and the frame title is the object's `name`. Three places still list an "optional
`title`": `docs/ACCESS_AND_NETWORKS.md:55` (index row) and `:717` (Key fields), `README_scenario_design.md:1030`.
An author who follows them gets a schema error. Remove the three mentions; `PLAYTEST.md:162` ("title "Sign-in
audit"") should say it is the source's title.

**S3 (minor, playtest). `tr.ol-row` also matches the message row.** The LOADING, NO ACCESS and empty rows are
`tr.ol-row.ol-message` (`ops-log-minigame.js:316`). So `PLAYTEST.md:194` "wait until `tr.ol-row` exists" is
satisfied by the LOADING row at once, the "rows as text" read (`:177`) returns one empty string for a message row,
and `mg clickSelector 'tr.ol-row'` (`:201`) can click it. Use `tr.ol-row[data-row-id]` in all three. The message
states listed at `:171` omit `nosignal` (`ops-log-minigame.js:303`).

**S4 (minor, tests).** `ops_logs_scenario_test.rb`:
- `:194` `assert_not_equal '-', row['where']` passes for `door`, a raw id or anything else: assert the names (S1).
- `:246` "the readers answer nothing on a forged route and leave no row of their own": both readers are unscoped
  room objects, so `foothold: 'x'` is ignored and the read answers 200 with the rows; the test asserts no status
  and no body. The name claims a refusal that does not happen. Rename to "a read writes no row, with or without a
  route param" and assert `:success` on both, or drop the route param. (The refusal by route is covered in `lrt`.)
- `:180` and `:200` do not run the body secret scan; `:216-217` check two literals. Fine once N3's helper is
  shared: call it here too.

**S5 (minor, playtest text).** `PLAYTEST.md`:
- `:7-9` ("has **no reader**: nothing in the game shows a row"), `:135` ("Nothing in the browser shows these
  rows") and `:144-145` are L1b text now false for the same file's beats 8 to 13; mark them "beats 1 to 7".
- `:198` "The count text reads 2 of 2": the viewer prints `2 rows` unfiltered and `2 of 4 rows` filtered
  (`ops-log-rows.js:143-146`). State the exact strings so a scripted tester can compare.
- `:197`: see S1.
- Beat 10 could prove client rulings F4 and m9 with one line (RESULT `FAIL` shows the `FAIL x2` row).

**S6 (minor, unowned plan item).** Plan lines 679-680 (L2a playtest): "`tools/playtest/access-leak-check.rb`,
extended to cover `/log_rows` responses and skipping the IDENTITY cell of a typed row". The script has no mention
of `log_rows`; `PLAYTEST.md:243-244` makes the check conditional ("if its coverage has been extended ... not part
of this build item"). No L2a builder owns it. Assign it before the L2a scripted playtest, or the playtest's leak
check is skipped.

## Counts

R1 findings (14 ids): confirmed fixed 10 (M1, m1, m2, m4, m6, T1, T3, T4, T5, T6); fixed in part 2 (m5: N1, N2;
T2: N3); accepted with no change 2 (m3, T7); not fixed 0; fixed wrongly 0.

New findings:
- Blocker: 0
- Major: 3, all in Part 2 (S1 scenario rooms unnamed so LOCATION reads `door`; S2 validator reader checks unbuilt
  and claimed in docs; D1 docs state the holder rule wrongly). None in server code.
- Minor: 12 (server half N1, N2, N3, N4 (no action), N5, N6, N7; scenario step S3, S4, S5, S6, D2, D3).

## Verdict

**Server half: one more fix pass, small.** No blocker or major; M1 is right in every respect asked. The list:
N1 (two foothold forms still show a raw id: one regex and a test), N2 (m5 test for npc, card, detail), N3 (scan
all three test classes, scan text cells not hex ids, assert the secret list holds the password), N6 (lone wrong
`from`), N7 (own keycard among several, in a game with the flag). N4 needs nothing now. N5 goes with S2. If the
orchestrator prefers, N2, N6 and N7 can be accepted as they are and the pass is N1 plus N3.

**Scenario step: one more fix pass.** S1 (room names, exact `where` assertion, playtest line), S2 (validator
reader checks: needs an owner; at the least correct the docs line now), D1 (holder rule text), then S3, S4, S5,
D2, D3, and assign S6.

## Checks not completed

- No test, validator or browser run was made by this review (reading only; the shared lock was not needed for any
  claim). The builder's and fixer's test counts and mutation proofs are their claims.
- `scenarios/test_ops_logs/dungeon_graph.*` were not read.
- Whether the validator already requires a `name` on every network and sign-in PC (which would make N1
  unauthorable) was not checked.
- Whether real missions' rooms carry `name` (the S1 ruling question) was checked only as far as the schema
  allowing it and m01, m02 using `door_sign`.
- `access-leak-check.rb` was only grepped for `log_rows` (S6), not read.

## R2 outcomes

| Id | Outcome | Commit |
|---|---|---|
| S1 (scenario half) | Fixed: no new field, the rooms keep `door_sign`; `ops_logs_scenario_test` asserts `['Finance office', 'Security office']` exactly, and passes against the server fixer's door_sign fallback (in the working tree when run) | 3ed1f9667, 549dcd14f |
| S3 | Fixed: `tr.ol-row[data-row-id]` in the three places, `nosignal` state listed | 549dcd14f |
| S4 | Fixed: renamed, asserts `:success` on both reads, row counts and no new row; text-cell secret scan added to the door and sign-in tests | 3ed1f9667 |
| S5 | Fixed: L1b text marked beats 1 to 7; `2 rows` and `2 of 4 rows` stated | 549dcd14f |
| S6 | Built: rule `log_row` in `access_leak_scanner.rb` (answer and row keys, stored-only keys, registered log secrets from `OpsLog.compared_secrets`, raw scenario ids; SIGN_IN identity cell skipped); 8 unit tests and a real-answer test | c587d49c4 |
| D1, D2, D3 | Fixed in `docs/ACCESS_AND_NETWORKS.md` and `README_scenario_design.md` | 9ad9caee6 |
| A24 validator line | True (server fixer's validator errors are committed, c956f2f73); kept and extended with the `lockType: login` error | 9ad9caee6 |
| N1 | Fixed: kind-word rule strips `jack_`, `wifi_` and `implant_`; model test covers wifi, implant and jack foothold ids (fails with the old regex) | 896e832d1 |
| N2 | Fixed: the test covers an unnamed PC, NPC holder, card and the foothold `from` detail | 896e832d1 |
| N3 | Fixed: one scan module for all three classes, on text cells (title, event, as, where, result, detail), not ids; asserts the secret list holds the password | 83b549392 |
| N4 | No action (ruled) | - |
| N5, S2 | Built in `scripts/validate_log_rows.rb`: reader with no `id`, undeclared `logSource`, `lockType: login`, each with a node test (runs with or without `logSources`) | c956f2f73 |
| N6 | Fixed: a lone wrong `from` reads 404 (the good-`from` case waits for a pivot fixture) | 83b549392 |
| N7 | Fixed: own keycard among several cards, in a game with the flag, names the holder in both sources, no marker | 83b549392 |
| S1 (server half) | Fixed: door name is room `name`, then `door_sign`, then the kind word; test for each step | 896e832d1 |
