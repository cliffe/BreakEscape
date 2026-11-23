# L3b R1: the feature scenario, its tests, playtest beats, docs and the leak scanner change

Reviewed at `d32dbbf7f` (part B of stage L3). Read-only review; every file read with
`git show d32dbbf7f:<path>`, because a fixer is editing this worktree.

Method and limits:
- No Rails test was run (the tree under the tests is moving while the fixer works, so a run would
  not describe `d32dbbf7f`). The builder's "23 runs, 304 assertions" is not re-verified.
- No server, no browser. Selectors and strings in the beats were checked against the client source
  by grep only.
- The validator and graph generator were run on a `git archive` extract of the commit in a scratch
  directory (see check 6).

Counts: **0 blockers, 1 major, 14 minors.** Verdict at the end.

---

## Check 1: the leak scanner change

### S1 (MAJOR). The allowance is not tied to anything the run earned: any resource's name passes in any row's LOCATION cell

`tools/playtest/lib/access_leak_scanner.rb:1880-1883` and `:1893-1896` (`share_name?`).

The new line is

```ruby
next if ctx[:log_rows] && json_path.to_s.match?(/\.rows\[\d+\]\.where\z/) && share_name?(str)
```

and `share_name?` is true when the string equals the `name` of ANY entry of `resources`. The rule
looks at three things only: the route is `GET /log_rows`, the cell is `rows[n].where`, the text
equals some resource's name. It does not look at:

1. **the row's event.** A `BADGE`, `SIGN_IN` or `NET_LINK_UP` row whose LOCATION is a share's name
   passes. (The unit test never tries this: its negative cases put the host in `where` and the
   name in `detail`, never the name in `where` of a non-share row.)
2. **which share.** A share on a network the player has never reached, a listed-only share, a
   share behind an access list that admits nobody the player is signed in as: all pass.
3. **whether this run opened it.** Nothing is read from earlier lines of the log. The unit test
   itself shows this: its two passing cases are a lone `/log_rows` answer with no `/container` or
   `/network` line before it (`test/unit/access_leak_scanner_log_rows_test.rb:168-169`).

The comment gives the reason as "the row exists only after an admitted open of that share". That
is the engine property the scanner is there to CHECK, and the new line assumes it instead. Two
ways the engine can show a share name the player has not earned, both now missed:

- **A seed row.** `scripts/validate_log_rows.rb:262-277` (`log_check_seed_where`) accepts
  `"where": { "kind": "share", "id": "<any resource id>" }` on a `share_folder_opened` seed row
  (the event's `places` is `share`, `ops_log_events.rb:53`), and the reader shows a seed row's
  place through the same `KINDS['share']` name lookup (`ops_log_events.rb:130-131`, `:226-231`).
  So a reader in the start room can show the name of a share on a network the player never
  reaches, before any play. Before this commit the scanner reported that as
  `network_string resource:<id>`; now it says nothing. Whether an author may do that on purpose is
  a design question (a seed row is authored text), but the scanner should make the author decide,
  as it did, not wave it through. (Read from the validator and registry code; I did not build a
  scenario with such a seed row and run it.)
- **A row written on a branch that is not an admitted open.** This is not hypothetical for this
  stage: part A's review F1 (`reviews/L3a_R1.md`) found the share row being written for a request
  the plan gives no row (a forged file request). A like bug that wrote the row before
  `container_reach_refusal` (a 404 open of an unreached share) would put the unreached share's
  name in the player's log, and this scanner, the tool built to catch exactly that, would pass it.

Smaller effects of the same line:
- It is `next` for the whole string, so when the same text is also another owner's string (a
  second resource's `host` or `observations` equal to this share's name, or a network of the same
  name) those owners are skipped too.
- `share_name?` reads every `resources` entry whatever its `kind`, and does not apply the
  `usable` test (`:599`) the registration uses. Harmless today, but it is a second, looser list
  beside `@network_strings`.

The plan does not ask for this allowance: section 11 line 681 extends the check to `/log_rows` and
exempts only the IDENTITY cell of a typed row; nothing there or in 13.8 says a share's name may
appear. So this is also a plan gap that needs one sentence, whatever rule is chosen.

**The tightest rule that still passes the real run.** In the real run (and in
`ops_logs_scenario_test.rb:489-505`) the order is `POST /network/plant`, `GET /network`,
`GET /container/scanned_inbox`, `GET /container/inbox_letters`, then `GET /log_rows`. So:

- In `scan`, keep a per-run set, for example `@shares_opened` (reset at the top of `scan` like
  `@ops_earned`). Add a resource id when a line is `GET .../container/<id>` with a 200 answer that
  is not an error answer, and `<id>` is that resource's id or the id of an item inside its
  `contents` (the scanner already maps item to resource and ancestors in `@share_items`,
  `:1726-1727`; `ctx[:container]` already holds the decoded id with the query string cut,
  `:866`). A `GET /network` listing does NOT earn it: a listing is not an open, and a row can
  exist only after an open.
- In `scan_network_strings`, on a `/log_rows` answer, for a string at `$.rows[n].where`: read
  `body['rows'][n]`; only when its `event` is `SHARE_OPEN`, drop from the owners to report exactly
  those `resource:<id>` whose id is in `@shares_opened` and whose `name` equals the string. Report
  every other owner of the string as before (so no `next`).
- Everything else stays a finding: the name in a row of another event, the name of a share not
  opened earlier in the same log, the name in any cell before the first admitted open, a host,
  observations text, a network name.

A seed row naming a share the player later opens is then clear only from the open onward, which is
right. A seed row naming an unopened share is a finding; if the user wants authors to be able to
do that, it needs its own ruling and its own rule (for example treating seed-row text as public
authored text), not this line.

Tests the fix needs (`test/unit/access_leak_scanner_log_rows_test.rb`):
- a lone `/log_rows` answer with a `SHARE_OPEN` row naming the share: `network_string
  resource:inbox` (the present test's first two assertions flip);
- a `GET /container/inbox` 200 line, then that answer: clean;
- the open line AFTER the log answer: a finding on the log answer;
- an open of share A, then a `SHARE_OPEN` row naming share B: a finding for B;
- an open of the share, then a `BADGE` row whose `where` is the share's name: a finding;
- a refused open (`/container/inbox` answered 404 or `success: false`), then the row: a finding;
- the existing host, detail and network-name cases, kept.
`ops_logs_scenario_test.rb:489-505` should pass unchanged, and gain one line: the same run with
the two `/container` lines left out of `lines` must report `network_string resource:scanned_inbox`
(so the test shows the rule is tied to the open).

### S2 (minor). The unit test asserts the wide behaviour and has no negative for it

`test/unit/access_leak_scanner_log_rows_test.rb:161-173`. Its title says "a share name alone in a
row LOCATION cell is no network_string finding", and that is all it proves: no case shows a share
name in LOCATION being refused under any condition. Closed by S1's test list; listed separately
because the test would have told a reviewer the rule was narrow when it is not.

**Verdict on the scanner change: not acceptable as built (major).** It is wider than "the share
named by a `share_folder_opened` row the same run earned": it is "any resource name in the
LOCATION cell of any row". The engine can show an unearned share name there (a seed row today; a
row-writing bug tomorrow) and the scanner would now miss both. It did not weaken any other rule:
the host, observations, network names, the name in IDENTITY or DETAIL, and every other route are
judged as before.

---

## Check 2: the scenario (`scenarios/test_ops_logs/scenario.json.erb`)

Read in full. What holds:
- **Solvable from the start, no hidden step.** The drop box (`kit_dropbox`, `:128-137`), the
  access point (`guest_ap`, `:138-148`) and the key card (`wifi_note`, `:149-159`) are in the
  start room; the jack and reader are in `comms_room` (`:187-218`), which has no `locked` key and
  no lock; the lobby sign (`:123`) names every step and where the key is.
- **In-world text.** No room text holds the host `OL-FS07`, the share name `Scanned-Inbox` or the
  network name `Harbour office LAN`. The SSID and the key are in room text on purpose (the note,
  and the SSID in the access point's `observations`), which the scanner's Wi-Fi rule treats as
  public (`access_leak_scanner.rb:634`, a substring test over room strings), so beats 24 and 27
  should not trip `wifi_secret`.
- **Source separation.** `network_log` (`:23-27`) takes `net_*` and `share_*` at
  `jack:comms_port`, `ap:guest_ap`, `share:scanned_inbox`: the four L3 events, and no other
  registered event starts with those prefixes. `door_controller` and `night_log` list
  `badge_swipe` only; `signin_audit` lists `signin_*`, `session_*` at `office_pc`. No source can
  take another's rows in either direction. `night_log`'s `where.rooms: ["lobby"]` now covers the
  room the access point is in, which does not matter because its events are `badge_swipe` only.
- **The reader is reachable** (`net_log_pc`, `:207-216`, an unlocked room, no `lockType`).

### C1 (minor). The brief still says the flag "is judged by the server"

`scenario.json.erb:2`, a line this commit rewrote. The stream brief's L2b decision ("THE FLAG GOES
BACK TO THE PLAN") makes the flag a client check. Fix: "flagging it is checked in the browser" or
drop the clause.

### C2 (minor, for the tester). Two solid objects were added at x = 8 in the lobby, on the side of the east door the earlier beats walk through

`scenario.json.erb:134` (drop box at 8,4) and `:144` (access point at 8,6); the room is 10 tiles
wide (`room_reception.json`) and beat 3 walks from the lobby east into the office. I could not
check the walk without a browser, and did not work out the door's tile. The handover and the "L3
gotchas" say beats 1 to 19 are unchanged; that is true of the rows but is not shown for movement.
Fix: the tester confirms beat 3's `enter office` works on the first attempt in the full run (1 to
27); if it is blocked, move the two objects to the west half of the lobby.

### C3 (minor). The helper change does hide whether the real room is open; nothing in the tests shows it

`test/controllers/break_escape/ops_logs_scenario_test.rb:29` now starts every game with
`comms_room` in `unlockedRooms`. A real game starts with the start room only
(`game.rb:7769`), and `GET /room/<id>` refuses a room that is neither the start room nor in that
list (`games_controller.rb:569-584`); the room is added when the client opens the unlocked door.
In the real scenario the room has no lock, so I found no problem. But if someone later adds
`"locked": true` to `comms_room`, every L3 test here still passes, and the test titled "the
network log reader is in the comms room, which is open" (`:411-420`) proves nothing about "open".
Fix: in that test, assert the rendered room carries no lock (`assert_nil room['locked']`,
`assert_nil room['lockType']`), and build one game with the default `%w[lobby]` that posts the
door open for `comms_room` the way the client does for an unlocked door and then reads
`net_log_pc`.

---

## Check 3: the tests (`ops_logs_scenario_test.rb:368-506`)

All five run on the real scenario file (`SCENARIO_PATH`, `:16`), through the routes, and read a
re-read game. Each can fail:
- reader open and empty (`:411-420`): fails if the source or reader goes or a row is seeded;
- the rows (`:422-449`): exact equality on the five shown rows, so a wrong kind word, name, count
  or identity fails; the wrong key is asserted to write nothing (`:428-429`);
- repeat open (`:451-462`): row count and `updated_at` both pinned, so a second row or a stray
  save fails;
- card copy and separation (`:464-485`): both directions asserted (network source empty after the
  badge and sign-in beats; the other three readers' counts unchanged after the network actions;
  no `NET_` or `SHARE_` text in them);
- the leak run (`:487-505`): see S1.

### T1 (minor). The raw-id check names three ids of seven

`:444-447` refuses `inbox_letters`, `letter.txt`, `comms_port` and the key in the answer body.
Not refused: `guest_ap`, `scanned_inbox`, `kit_dropbox`, `jack_`, `wifi_`, `OL-FS07`,
`Harbour office LAN`. The exact-equality assertion covers the five shown cells, but not the row
`id` or anything added to the answer later. Fix: one loop over all of them (the same list beat
25's `eval` uses, plus the host and the network name).

### T2 (minor, needs a ruling). "OK x2 and five rows" is what the engine does, but 13.8 does not say it, and the result reads oddly

The builder's claim is right about the engine and wrong about where the plan says it. Plan 13.8
line 1188 gives the bound for `net_link_up` and `net_link_down` as "one per plant or unplug",
which is a count of writes; it does not say "merged repeats" as the badge and sign-in lines do.
The merge comes from the general rule in 13.2 step 5 (lines 933-937): a row identical in event,
`as`, `where`, `result` and `detail` to one of the source's ten newest rows raises that row's
count. A plant has no identity and no detail, so every replant at one jack is identical. The test
(`:429-430`, `:437`) and beat 26 pin that.

What the player then reads after plant, unplug, plant is `NET_LINK_UP OK x2` followed by
`NET_LINK_DOWN OK`: the last link row says down while the box is plugged in. For a pair of events
that describe a state, merging across the opposite event loses the order that gives them meaning.
For a ruling, not a builder error: either (a) accept it and say so in 13.8's bound cell and in the
A24 text ("replants at one jack merge; the row order is by first occurrence"), or (b) stop
`net_link_*` merging (a registry flag, or merge only into the source's newest row for that
place), which is a plan change and an engine edit. Until ruled, the test's expectation matches
the code.

### T3 (minor). A stale test title

`ops_logs_scenario_test.rb:62`: "the scenario declares two sources ..." now asserts four. Reword.

Not a finding: an implant writing no row is asserted in part A's file, as the handover says,
because this scenario has no USB device. Acceptable.

---

## Check 4: `PLAYTEST.md` beats 20 to 27

Checked against the client source: `[data-resource-id]` with `[data-action="open"]`
(`network-view-minigame.js:61`), `[data-unplug]` (`:454`, `:1138`), the label `Plug it in`
(`network-links.js:60`), "That key was not accepted." and the "Network key" field
(`password-minigame.js:1375`, `:941`), `.desktop-icon` (`container-minigame.js:2015`),
`.ol-message` with `data-state` (`ops-log-minigame.js:351`), the count wording "N rows"
(`ops-log-rows.js:142`), the foothold ids `jack_comms_port` and `wifi_<network>`
(`network_access.rb:337`). No beat sends a request of its own making. Every expected result is
something the page, `verify-run.rb --ops-log` or the capture file shows. The row counts add up
beat by beat (1, 3, 4, 5, then 5 with `OK x2`), and the order in beat 25 is the append order the
server test pins. The leak-check command matches the tool's usage (`access-leak-check.rb:42-48`:
every file named, oldest first, no glob) and the `verify-run.rb` command is the one at line 34.

### P1 (minor). The three browser-untested points are not marked as untested in the file the tester reads

The handover lists them (folder icon click, exact count wording, the view after a join). In
`PLAYTEST.md` two of them read as known facts: the notes are headed "Notes for the tester from
earlier runs" (there has been no L3 run), with "a folder opens by clicking its icon" stated flat,
and beat 25 says "The count text reads `5 rows`". Only the empty join view is hedged ("it may list
nothing"). Beat 22 also gives no selector for the folder icon. Fix: head the list "from the code,
not yet run in a browser", mark those three points "unverified: report what you see", and give the
tester a way to find the icon (for example an `eval` that lists the `.desktop-icon` labels first,
then `mg clickSelector` on the one labelled Letters).

### P2 (minor). "Every bridge call is in `docs/test-bridge.md`" is not exact

The list in the L3 header names `enter` and `sync`. `docs/test-bridge.md` has `enterRoom`
(`:373`) and no `sync` entry that I could find; both are session commands (`{"cmd":"sync"}` is in
`.claude/skills/playtest-scenario/SKILL.md`). `moveToNear`, `interact`, `waitFor`, `dismiss`,
`mg clickSelector`, `mg type`, `eval`, `access.footholds()` (`:442`) and `access.networkView()`
(`:443`) are there. Earlier beats use the same two commands, so this is wording: say "in
`docs/test-bridge.md` or the session command list of the playtest skill".

### P3 (minor). Beat 27's sentence about the leak check follows S1

"for a share row, allows the share's name in the LOCATION cell only" describes the wide rule.
After S1: "allows, in a `SHARE_OPEN` row, the name of a share this run opened earlier". Add to
the beat: the capture files must include the `/container` answers of beat 22 (they do when every
file is named).

### P4 (minor). Beat 19's text says `verify-run.rb` prints three sources; it now prints four

`PLAYTEST.md` line 297 (beat 19, a beat this commit calls unchanged). The scenario now declares
four sources from the start of the game. One word.

---

## Check 5: docs (`docs/ACCESS_AND_NETWORKS.md` A24, the two index rows)

The section matches the code for: the four events and their codes, what writes and what does not
(wrong key, held access point, refused plant, implant, card copy), the kind-word fallback (the
reader replaces a name equal to the id by the kind word, part A's review, `L3a_R1.md:154`), `-`
for the network rows, the detail text, and "never shows". The two index rows agree with it.

### D1 (minor). "the account of the oldest session" contradicts part A's ruling

A24, "What each shows". Part A's ruling and plan 13.8 lines 1196-1202: the row names the account
of the FIRST admitting session in `signedInPcs` order, which "may not be the oldest by time". Fix:
"the account of the first session, in sign-in-list order, that admits the share".

### D2 (minor). "Never a file: a file opens in the browser with no request"

True of the game's own client. At this commit a hand-made `/container/<file id>` request does
write a row naming the file (part A F1, being fixed). Once fixed, say what the server does:
"a request for a file writes no row".

### D3 (minor). The "Known limits" line follows S1

"the leak check allows a share name in that cell only (every other network string stays a finding
there)" describes the wide rule. Reword with S1's rule.

---

## Check 6: graph files and validator

- **Graph files.** Regenerated from a `git archive` extract of `d32dbbf7f` (scripts, lib, the
  scenario) in a scratch directory: `dungeon_graph.html`, `.json` and `.md` come out byte for byte
  the same as the committed ones. They are current.
- **Validator.** In that extract the run ends "2 errors, 4 warnings". Both errors come from the
  extract, not the scenario: the ink compile of `dana.ink` and the sprite sheet
  `female_blowse_v2` (the extract holds no character assets). The access-model lines are as the
  handover says: the one `maxAttempts` warning, and "Network reach: jack 'comms_port' on
  'office_lan' lists no hosts; resources 'scanned_inbox'". No log-rows error or warning for
  `network_log` (no prefix warning, because it has a `where`). I did not run the validator in the
  worktree itself (it writes the graph files, and the fixer is editing the validator), so "0
  errors" in the full tree is the builder's figure: consistent with what I saw, not independently
  confirmed.

---

## Summary

| Id | Severity | Where (at `d32dbbf7f`) | One line |
|---|---|---|---|
| S1 | major | `tools/playtest/lib/access_leak_scanner.rb:1880-1883`, `:1893-1896` | any resource name passes in any row's LOCATION; not tied to event, share or an earlier open |
| S2 | minor | `test/unit/access_leak_scanner_log_rows_test.rb:161-173` | the test asserts the wide rule; no refusal case for a share name in LOCATION |
| C1 | minor | `scenarios/test_ops_logs/scenario.json.erb:2` | brief says the flag is judged by the server |
| C2 | minor | `scenario.json.erb:134`, `:144` | two solid objects at x = 8 on the east-door side; beat 3's walk unverified |
| C3 | minor | `ops_logs_scenario_test.rb:29`, `:411-420` | helper pre-opens `comms_room`; nothing asserts the real room is open |
| T1 | minor | `ops_logs_scenario_test.rb:444-447` | raw-id check names three ids of seven |
| T2 | minor (ruling) | `ops_logs_scenario_test.rb:429-430`, plan 13.8 line 1188 | `OK x2` comes from 13.2 step 5, not 13.8; UP x2 then DOWN reads wrong while planted |
| T3 | minor | `ops_logs_scenario_test.rb:62` | title says two sources |
| P1 | minor | `PLAYTEST.md` L3 notes, beats 22 and 25 | untested points stated as facts "from earlier runs"; no folder icon selector |
| P2 | minor | `PLAYTEST.md` L3 header | `enter` and `sync` are not in `docs/test-bridge.md` by those names |
| P3 | minor | `PLAYTEST.md` beat 27 | leak sentence follows S1 |
| P4 | minor | `PLAYTEST.md` line 297 | beat 19 says three sources |
| D1 | minor | `docs/ACCESS_AND_NETWORKS.md` A24 | "oldest session" against the part A ruling |
| D2 | minor | A24 | "a file opens ... with no request" against part A F1 |
| D3 | minor | A24 Known limits | leak sentence follows S1 |

S2, P3 and D3 are closed by S1's fix.

**Count: 0 blockers, 1 major (S1), 14 minors.**

**Verdict: not passed.** The scenario, the five tests, the beats and the docs are sound apart from
minors, and the graph files are current. The scanner change must be narrowed as S1 gives before
this stage is accepted: as built it removes a check for every share name in a log row, where only
the name of a share the same run opened, in a `SHARE_OPEN` row, has been earned. T2 (merging of
link rows) needs a ruling.

Checks not completed: none skipped. Not done by choice: no Rails test run, no validator run in
the live worktree, no browser.

## Outcomes (fixer)

| Finding | Outcome |
|---|---|
| S1 | Scanner tightened as the review's tightest rule: a share's name passes in a `SHARE_OPEN` row's LOCATION only for a share with an earlier successful `GET /container/<share or item in it>` in the run, and only that owner is dropped (no `next`); a `/network` listing earns nothing. Seven unit cases added, the scenario run gains the bare-run case; plan section 11 gains one line |
| S2 | Closed by the S1 tests |
| C1 | Brief now says the flag is checked in the browser |
| C2 | Not an engine or layout change: PLAYTEST asks the tester to confirm beat 3's walk on the first attempt, with the move-to-west-half fallback |
| C3 | New test: the real comms room has no lock keys; a game starting with only the lobby is refused the room, opens it by the unlock call, then reads `net_log_pc` |
| T1 | The raw-id check loops over all seven ids plus the host, the network name and the key |
| T2 | Done in the call, helper untouched: `net_link_up` and `net_link_down` carry a stored-only, never shown detail `step` (registry `{ count: 9, show: false }`), a 0 to 9 counter taken from `player_state['netLinkSteps']` (written only when the scenario declares log sources). A plant after an unplug is its own row: up, down, up. Docs, plan 13.8 cell, tests and PLAYTEST updated |
| T3 | Test title says four sources |
| P1 | PLAYTEST: "from the code, not yet seen in a browser", three points marked UNVERIFIED, folder icon selector `.desktop-icon[aria-label="Letters"]` (client source) |
| P2 | Bridge names as in `docs/test-bridge.md` (`enterRoom`), `enter` and `sync` named as session commands |
| P3 | Beat 27 follows the S1 rule and says the `/container` answers must be in the capture files |
| P4 | Beat 19 says four sources |
| D1, D2, D3 | A24: "first session in sign-in-list order", "a request for a file writes no row", the S1 rule |

## Outcomes: browser playtest items (fixer)

| Item | Outcome |
|---|---|
| Beat 22 FAIL: "Letters" could not be opened | Scenario only: the folder was authored `type: "safe"`, unlocked, which `isInteractiveItem()` (`container-minigame.js:2437`, folder rule at `:2462`) gives no handler. Now `type: "folder"` with contents, the unlocked-folder case the client opens by click (`:2462-2465`); `locked` key dropped. The test_access_networks folder is a PIN-locked safe, which opens through a lock; this one needs no PIN. The scenario test still writes the folder row through `GET /container/inbox_letters`; validator 0 errors, graph files unchanged. Not re-run in a browser |
| PLAYTEST: "Cancel" | Cancel button is "Leave it" (harness note and beat 21) |
| PLAYTEST: `enter` adjacency | Beat 20 gives the route office, lobby, comms; beat 27 says one room at a time |
| PLAYTEST: verify-run prints only sources with rows | Beats 19, 20 and 27 reworded |
| PLAYTEST: beat 26 | Already six rows, replant its own `NET_LINK_UP` (T2); the tester saw this |
| PLAYTEST: beat 27 sign-in log | Says its five rows exist only if beats 4 to 7 were played in the game, else the empty state |
