# S5a review R3 (delta): fixes to R2 and to the first browser playtest

Reviewer: read-only. Commits reviewed: `a5697e6c8`, `999b89684`, `5db0320ae`, `d37a6907e` (committed code only).
Findings are appended below as each check completes.

Method note: the scanner claims below were run, not only read. A scratch script (outside the tree) loaded `tools/playtest/lib/access_leak_scanner.rb` under `BREAK_ESCAPE_STANDALONE=true bin/rails runner`, built the scanner from the shipped `scenarios/test_ops_privilege/scenario.json.erb`, and scanned the two committed fixtures (`test/fixtures/files/ops_privilege_browser_run_1.jsonl`, `_2.jsonl`) whole, cut short, and with one synthetic row added. "FOLDER" below is a synthetic `GET container/olu_folder` 200 holding `olu_budget`; "DESK" is a copy of run 1 row 91 (the administrator's `GET container/bay_pc` 200, `session.access: "admin"`, Olu's items in `contents`). Row numbers are fixture line numbers.

## Check 1: `--signin <account>@<pc>#<n>` / `@<row time>`

What holds (run and read, `access_leak_scanner.rb:2785-2834`):

- One entry credits one row. The lookup key is `[account, :n, count]` or `[account, :t, row t]` (`:2798`), so an entry never applies to another account's row or to another row of the account. Nothing is earned before the row (the count is raised only at the row, `:2823`).
- An entry for a sign-in that never happened (`adel@bay_pc#9` added to the four real entries: still 0 findings, nothing more earned) earns nothing.
- A failed sign-in cannot be named: `note_privilege_signin` returns before the count and the lookup unless `success == true` (`:2821`). Run: a failed `POST /login` row with `t: "T1"` named `adel@bay_pc@T1`, then DESK: DESK is reported (4 `profile_admin_read`, 1 `ops:key:access`).
- A relay sign-in cannot be named to another PC: the answer carries a `host` label, and the label branch (`:2792-2796`) returns before the entry is looked up. Run: `uma@bay_pc#3` (run 1 row 164, relay, `host: RECS01`) added: no change. A relay never earns admin either way (`:2830`, `relay != true`), and a claim's `via` is not `password` or `credential`.
- The administrator's own sign-in named at the wrong PC is a finding (the fixture test's `wrong` case and the played-run test; both re-run by hand: the reads at the PC it really was are reported).
- Two entries for one row (`adel@store_pc#1` and `adel@bay_pc@<t of row 23>`): the `#n` one wins, one PC is credited, findings follow. Not a hole.
- `ops_steps: ["admin:<pc>"]` raises (`:456-458`). No other path puts an `admin:` step in `@ops_earned` at line 1: `@ops_start_steps` is built from footholds and cards only, and the three writers of `admin:` are the sign-in (`:2833`), the technique grant (`:2561`) and nothing else (grep `"admin:#{`).
- An unnamed keyboard sign-in with more than one admitting PC earns nothing and takes the account back at every admitting PC (`:2802`, `:2826-2829`); the 27 bare findings show it.

What does not hold:

### R3-C1 (major). A sign-in of an ORDINARY account named at the wrong PC keeps the administrator step at the PC it really displaced; a PC that does not even admit the account is accepted.

- `tools/playtest/lib/access_leak_scanner.rb:2798-2799` and `:2826-2829`.
- A named entry returns `[[named], true]` for any PC of the scenario. `note_privilege_signin` then takes the admin step back at the NAMED PC only and writes the account there. The unnamed path would have taken the step back at every admitting PC. So naming a sign-in takes back less than not naming it, and the scanner never checks that the named PC admits the account (it only skips the earning at `:2833`).
- Run that shows it (scenario copy where `store_pc` admits only `olu` and `adel`): run 1 rows 1 to 24 (Adel named at `bay_pc`, admin earned), then a copy of Uma's successful keyboard sign-in (row 17) as the next row, then FOLDER.
  - `uma@bay_pc#2` (the truth): FOLDER reported, `profile_admin_read item:olu_budget`.
  - no entry for it: FOLDER reported.
  - `uma@store_pc#2` (a PC that cannot admit Uma): **no finding**. `admin:bay_pc` and Adel's account stay earned at `bay_pc` although Uma now holds it, so a server that went on serving Olu's profile there passes.
- The same happens in the shipped scenario with a wrong but admitting PC (both PCs admit staff): any ordinary sign-in at the PC where the scanner holds admin, named at the other PC, keeps the step. The existing "wrong PC named is still a finding" tests cover only the administrator's own sign-in.
- So the answer to "can a tester make a leak pass by naming generously": yes, by one route. Not by naming the admin early, an n-th sign-in that did not happen, a failed one or a relay; but by naming the sign-in that ENDED an admin session at some other PC.
- Suggested fix, in order of cost:
  1. In `priv_signin_candidates`, an entry whose PC is not in `admitting` is an error (raise `ArgumentError`, as a malformed entry does) or at least returns `[admitting, false]`.
  2. Use the desktop answer as a cross-check: a 200 `GET /container/<pc id>` answer carries `session.npcId` (run 1 row 91: `{"npcId":"adel",...}`). When it differs from the account the scanner holds at that PC, call `end_priv_session([pc])` and set the account from the answer (earning no admin step). The client asks for the desktop straight after every sign-in (rows 17/18, 23/24, 40/41, 90/91), so a misnamed sign-in is corrected one row later in an ordinary run.
  3. Add a test: an ordinary account's sign-in named at the other PC after the administrator signed in, then the folder read, must be reported (after fix 2 it needs the desktop row in between; without one, document the limit in the header).

### R3-C2 (minor). Entries are parsed loosely and an unused entry is silent.

- `access_leak_scanner.rb:2806-2815`. `key.to_i` reads `#1x` as 1 (run: `adel@bay_pc#1x` credits row 23, 0 findings) and `#abc` or `#0` as 0, which never matches. A PC id that names no PC of the scenario is accepted and silently credits nothing (`:2799`, falls to `[admitting, false]`). A second entry with the same key overwrites the first without a word. An entry that matched no row (the n-th sign-in never happened, a mistyped time) is not reported.
- None of these earns anything it should not, so each fails closed, but a tester reading "27 findings" cannot tell a typo from a leak.
- Fix: require `\A[1-9]\d*\z` for `#n`; raise for a PC id not in `@priv_pcs`, for an account id not in `@priv_npcs`, and for a duplicate key; after the scan, print (leak check) or expose (`scanner.unused_signins`) the entries that matched no row, and make the leak check exit non-zero for them.

## Check 2: session ends

Each tracked end was run against the real capture (rows 1 to 24, the end row, then FOLDER and DESK) or read at its line:

| End | Where | Takes back | Verdict |
|---|---|---|---|
| later sign-in at the PC | `:2826-2829` | step and account at the PC (exact) or at every admitting PC (unnamed) | holds, except R3-C1 |
| `POST /lock_session` 200 `locked: true` | `:2847` | the PC in `pcId` | holds; the server always sends `pcId`. If it were absent nothing is taken back (run: lock answer without `pcId`, FOLDER and DESK pass). Cheap hardening: no `pcId` ends every PC, as sign-out does |
| desktop 403 | `:2849` | that PC, for every reason (`off`, `not_responding`, `expired`, `no_session`, `unreachable`: all are 403 at `games_controller.rb:3340-3360`) | holds |
| `endedPcIds` on a 200 answer | `:2848` | each PC named (run 1 row 84, `network/unplug`) | holds |
| `POST /logout` 200 | `:2846` | every PC | holds (fail closed; run 1 row 140 wipes `bay_pc` too) |
| bootstrap `sessions` | `:2862-2871` | PC absent, `locked`, or another account | takes back too little: R3-C3 |

### R3-C3 (major). A bootstrap entry that is present, unlocked, for the same account, but WITHOUT `access: "admin"` leaves `admin:<pc>` earned. The real capture has exactly this entry.

- `access_leak_scanner.rb:2862-2871`.
- The server lists a session whose level is now nothing (PC off, route down) and leaves `access` out: `session_for_client` (`game.rb:3964-3977`) drops only an expired token session, and `login_session_answer` adds `access` only when `client_access_level` says admin (`game.rb:4778`); `session_access` is nil when the route is down or the PC is off (`game.rb:3300-3307`). Run 2 row 1 is that case: `"sessions":{"bay_pc":{"npcId":"adel","via":"password",...}}`, no `access`, after the power cut of beat 8 (`verify-run`: `bay_pc = adel (password), level none`).
- Run that shows it: run 1 rows 1 to 98 (Adel's keyboard sign-in at row 90 named, `admin:bay_pc` earned), then run 2 row 1, then FOLDER and DESK: **no finding**. The server's own answer said the session is not admin, and the scanner still accepts Olu's profile and `access: "admin"` at `bay_pc`.
- It did not show in the fixture test only because an unrelated sign-out at `store_pc` (row 140) had already wiped every PC. The repeat playtest, with the second switch and a reload, can hold the step across a bootstrap.
- Fix: in `note_privilege_bootstrap`, `@ops_earned.delete("admin:#{pc}")` for every PC whose entry does not carry `access == "admin"` (keep the account: the session is still that account's). Test: the admin step earned, a bootstrap with the entry as run 2 row 1 has it, then the folder and desktop rows must be reported.

### The two ends no capture can show, and what a cheap rule would close

**(a) A token running out, a power cut or a dropped route between requests.** The scanner learns an end only from an answer of the server. So the leak that passes is exactly: the server fails to notice the end. After the token's deadline, or after the PC lost power, a server that still (i) answers `GET /container/<profile folder>` with the owner's items (the folder answer names no PC and carries no `access`, so nothing contradicts the earned step), (ii) answers the desktop 200 with `access: "admin"` and the other profile's items, (iii) puts `access: "admin"` on the mirror entry or the host row, or (iv) writes and shows an `ADMIN_READ` row for such a read, passes clean. Run: run 1 rows 1 to 79 (the token sign-in is row 72 at 00:10:46.937, `expiresInS: 149`, so it lapsed at about 00:13:16; row 79 is at 00:13:46), then FOLDER and DESK: no finding.

The rule proposed in the task ("an `access: admin` is accepted only when that answer or an earlier one after the last end shows the session live") does not close this: the scanner already has such an answer (the sign-in), and what is missing is the end, not the start. Three rules that do close most of it, all from data already in the capture:

1. **Token deadline.** A `via: "credential"` sign-in answer with `kind: "token"` carries `expiresInS` (run 1 row 72; `credential_login.rb:109`). Keep `row t + expiresInS` per PC; at any later row whose `t` is past it, `end_priv_session([pc])` before judging. This closes token expiry completely for (i) to (iv), with no reliance on the server noticing. (Caveat to check when building it: that the token clock is wall time and not paused with the game; the playtest's expiry at 149 s of wall time says it is.)
2. **A host row that shows no admin session.** `GET /network` is polled every 5 s while the view is open. After the power cut the `bay_pc` row has `responding` and `heldAs` and no `session` (run 1 row 108); before it, `session: {..., "access": "admin"}` (row 98). Rule: for a host row of a sign-in PC, no `session`, or a `session` without `access == "admin"`, takes `admin:<pc>` back (no `session` takes the account back too).
3. **A desktop or bootstrap answer that shows the session without admin** (R3-C3 for the bootstrap; the same for a 200 desktop answer whose `session` lacks `access: "admin"` or names another `npcId`, see R3-C1 fix 2).

What stays open after all three: a power cut or dropped route, with no network view open and no desktop or reload before the leaking request, on a server that fails to notice on that one route. That needs the request body or a server-side signal and is fair to leave documented.

**(b) A hand-back whose answer names no PC.** A handed-back session is a claim or relay session: it is level `user` on the server (`game.rb:3308`) and never earns `admin:` in the scanner (`:2830`). So what stays behind is the ACCOUNT at that PC (`@ops_session_accounts`), plus the step and account of any session that hung from it and was pruned with it. The leak that passes: after the hand-back, the server still serves that account's OWN profile items at the PC or in a folder answer (`priv_profile_read_earned?`, `:2905-2906`, `own.any?`), or still serves an admin session reached onward from the ended one. Rules 2 and 3 above close both at the next host row, desktop answer or bootstrap. I did not find the hand-back's route to check whether its answer could be made to name the PC; if it is cheap on the server (it already computes the ended ids for `endedPcIds`), that is the exact fix.

## Check 3: the fixture test, R2-C3 to C6, nothing loosened

- The four entries are the sign-ins the run made. Run 1's successful `POST /login` rows: 17 (uma, password, no host), 23 (adel, no host), 40 (adel, no host, the unlock after the lock at row 36), 59 (adel, `host: BAY01`), 72 (adel, credential token, `host: BAY01`), 90 (adel, no host), 129 (uma, `host: RECS01`), 164 (uma, relay, `host: RECS01`); run 2 row 11 (uma, `host: RECS01`). So Adel's 1st, 2nd and 5th and Uma's 1st are the four with no label, and each is followed by `GET container/bay_pc` (rows 18, 24, 41, 91) and preceded by a `login_accounts` answer with no `host` (rows 15, 21, 38, 88). `BROWSER_SIGNINS` (`access_leak_scanner_privilege_real_test.rb:183`) matches.
- Re-run by hand: 0 findings with the four entries, 27 without (17 `profile_admin_read`, 10 `ops:key:access`). All 27 checked against their rows, not a sample: row 18 (`uma_todo` on Uma's own desktop after her unnamed sign-in), rows 23, 40, 90 (`access` on Adel's unnamed sign-in answers), rows 24, 35, 41, 91 (four profile items and `access` on the bay desktop under those sign-ins), rows 95, 97, 98 (`access` on the `bay_pc` host row of `GET /network` after row 90). Every one is of the unnamed-sign-in kind; none is a leak.
- R2-C3 closed: `:1731` judges a profile item in an `/unlock` answer by the any-PC form; test at `real_test.rb:291`.
- R2-C4 closed: `:2700` needs `@priv_active`; test at `real_test.rb:375`.
- R2-C5 closed: `:2792-2796`; tests at `real_test.rb:152` and `:161`. Accounts are taken back at the admitting PCs.
- R2-C6 closed: header (`:167-180`), `verify-run.rb:82-89` prints `error`.
- Diff against `26ba01c60` read in full (scanner, leak check, `verify-run`): every change adds a finding or removes an earning, with one exception, R3-C1 (a named entry takes back less than the unnamed path did; the old `ops_steps` branch had the same fault, so it is not new, but it is the one place where the new option is looser than no option).
- R2-C1 closed as designed (no recorder tag is possible: the capture has no request body), R2-C2 closed for the six ends listed, with R3-C3 the one that takes back too little.

### R3-C4 (minor). The leak check's usage line and the header do not say what an entry cannot do.

- `tools/playtest/access-leak-check.rb:6-10`, `:57`. The usage error prints only the `#n` form. The comment should state the two limits a tester must know: n counts every successful `POST /login` answer of the account, remote and relay ones included (in the fixture Adel's keyboard sign-ins are 1, 2 and 5, not 1, 2, 3), and a sign-in of an ordinary account must be named too when it is at a PC where an administrator was signed in (R3-C1). `PLAYTEST.md` should carry the worked example.

## Check 4: client R2-A1 (`999b89684`)

Closed. Read at `public/break_escape/js/systems/pc-sessions.js:659-684` and `network-view-minigame.js:1471-1475`; node tests `pc-sessions-access`, `pc-sessions-admin`, `network-view-techniques` run at the head, all pass.

- Only `already === true` sets `access` in place with no event (`pc-sessions.js:671-677`). The one caller passes `answer.already === true` (`network-view-minigame.js:1474`), and the server sets `already: true` only in `ops_technique_repeat_answer` (`network_ops.rb:609`).
- A real step up (same copy, not `already`, a different `access`) falls through to `_replace` and `_dropEnded`: the sign-in event fires and `endedPcIds` are dropped (new test "R2-A1: a step up ...").
- The m2 expectation is the original one: `named('pc_signed_in').length === 1` (the value before `5e262e79f`), with one added assertion on `access`.

### R3-A1 (minor, older than this round). A fresh grant of the same copy at the same level ignores its `endedPcIds`.

- `pc-sessions.js:678`: `if (now.access === held.access) return publicSession(pcId, now);` for an answer that is NOT `already`. The server answers so when its own record was pruned and granted again while the client still held the stale copy; the `endedPcIds` and `tokenExpiredPcIds` of that answer are then not applied, and the mirror keeps sessions the server ended until the next refetch or refusal. The early return for a same copy predates this round (it is the m2 rule); the round only made it visible by splitting the branch.
- Fix when next touched: in that branch call `this._dropEnded(endedPcIds, pcId, tokenExpiredPcIds)` before returning (no sign-in event).

## Check 5: scenario and PLAYTEST (`5db0320ae`)

**`olu_folder` as a folder: the click reaches the hooked request (traced by reading, no browser).**
- Client: the desktop answer carries the item with `type`, `locked: false` and its `contents` (fixture run 1 row 24 shows the shape, there still as `zip_archive`). `isInteractiveItem` is now true for it (`container-minigame.js:2467`, `type === 'folder'` with contents), so the icon gets its click listener (`:2053-2055`); `handleInteractiveItem` hands a temp sprite to `handleObjectInteraction` (`:2633-2640`), which opens a container (`interactions.js:1913`, `:2332-2346`); the new container minigame reloads from the server because `scenarioData.locked === false` (`container-minigame.js:1445-1447`) with `GET /break_escape/games/<id>/container/olu_folder` (`:983`).
- Server: `GET /container/olu_folder` is located in a profile scope, passes `container_reach_refusal`, and calls `record_admin_profile_read` (`games_controller.rb:639-651`, `:3276`).
- Tests write the row through that same request: `ops_privilege_scenario_test.rb` and the scanner's real-run test both use `get game_path('container/olu_folder')`; `ops_privilege_no_exposure_test.rb` now asks it in `answers`.
- Not checked here: that nothing between `handleObjectInteraction`'s entry and `interactions.js:1913` turns a non-takeable `folder` child of a desktop away. The comment at `container-minigame.js:2464-2466` says this path is the existing one for an unlocked desktop folder. The repeat playtest is the proof.

**`bay_breaker_on`.** `scenario.json.erb:304-316`: a `type: "pc"` object with `triggerOnInteract` `set_global bay_off false` and a `hint`, the same shape as `bay_breaker` (`:291-303`); both actions are existing ones (`apply-actions.js:205-215`). It gives back only what the first switch took: an off PC keeps its session record and only reads level nil (`game.rb:3300-3307`, `network_access.rb:1008`). A session the server ended (sign-out, displaced, expired token, lock) is not touched by the global: expiry is by time (`credential_session_expired?`), a lock is on the record, an ended record is gone. No way found to regain an ended session with it. Its name, observation and hint name no host, product or finding.

**R2-B4 (declined) holds.** Every profile item is still `takeable: false` (`scenario.json.erb:60-107`).

**Keys and in-world text.** `records_policy`, `bay_breaker_on`, `olu_folder`: none equals a finding-id part. `records_policy` still contains the service name `records` as a substring; the scanner reports nothing for it in a bootstrap (the fixture's bootstrap has the old key `records` and scans clean), and "Records PC" is the PC's in-world name anyway.

**PLAYTEST against the client source.** Checked and found present: `.pc-start-btn`, `#pc-start-lock`, `#pc-start-signout` (ids built in `pc-taskbar.js:282`, asserted in `test/js/pc-taskbar.test.mjs:288-297`), `.pc-taskbar-admin` (`pc-taskbar.js`), `desktop-remote-line`, `.desktop-icon` with `aria-label` (`container-minigame.js`), `.network-check`, `.network-confirm`, `.network-finding-select`, `.network-technique-select`, `.network-use`, `[data-action="sweep"]` (`network-view-minigame.js`); toast texts "USB devices are disabled on this PC." (`pc-policy.js`, `network_access.rb`), "Nobody is signed in at this keyboard." (`network-links.js`), "Something this needs is still missing" (`ops-model.js`), "Session token captured", "let you into the session", "Connect with" (`remote-host-text.js`), "Locked. Sign in again" (`pc-sessions.js`), "This PC is off" (`lock-scope-refusal.js`); bridge calls `access.sessions()` (`docs/test-bridge.md:439`) and `access.compromiseMarks()` (`:444`); `inventoryAct` and `openInventoryItem` in `.claude/skills/playtest-scenario/scripts/playtest-session.js`. `gameClock` is no longer used. The token deadline is stated where a tester needs it: in "Not played in the browser", in Layout (credentials), as the title and a bold line of beat 5 with what is seen if it lapsed, and in beat 6.

### R3-B1 (major, playtest script). Beat 8 as written cannot give a clean leak check, and its second half tells the tester to do something the client will not offer.

- `scenarios/test_ops_privilege/PLAYTEST.md` beat 8 ("sign in again as Adel at the keyboard (the old session may have ended with the power; type the password)").
- The session does not end with the power: the server keeps the record (level nil while off) and the client keeps its entry, dropping only `access` (`pc-sessions.js:483-493`, `noteDesktopRefused`). After `bay_breaker_on` a click on `bay_pc` opens the desktop of the surviving session at once: `GET container/bay_pc` 200 with `access: "admin"` and Olu's items. There is no sign-in screen and no `POST /login` row.
- The scanner took `admin:bay_pc` and Adel's account back at the 403 `off` answer of the first half of the beat (`access_leak_scanner.rb:2849`; the test "a desktop answer refusing with off ..." asserts exactly that the next desktop answer is then reported). So the first desktop answer after power-on is reported: 4 `profile_admin_read` and 1 `ops:key:access` on that row, more on each later `bay_pc` answer and host row. No `--signin` entry can clear them, because there is no sign-in row to name. The run cannot be "0 findings" as the script stands, and a tester cannot tell these from a leak.
- This is the proof the first playtest could not make ("marker after power off and on"), so it should stay in the run.
- Fix, one of:
  1. Script only: say what the browser really does (the desktop opens with the marker, no sign-in), and state the exact false alarms the leak check prints for that row, to be subtracted by row number. Weak: a stated allowance in a leak check.
  2. Script only: make the power-on proof the LAST use of `bay_pc`, then sign out and sign in again there before the end if anything else needs it, and give the leak check an expected count for that one row.
  3. Scanner: a tester-named resume, the same trust as `--signin`: `--resume <account>@<pc>@<row time>` naming one 200 desktop row after a 403 `off` or `not_responding` at that PC, accepted only when the row's `session.npcId` is the account that was held when the 403 came, and no other end was seen in between. It restores the step from that row only. Do NOT let a 200 desktop answer restore the step by itself: that is exactly the power-cut leak of check 2.
- Whichever is chosen, correct the sentence: the old session does not end with the power.

### R3-B2 (minor). PLAYTEST says a wrong PC named is always a finding.

- `PLAYTEST.md`, the paragraph after the `--signin` example: "A wrong PC named is a finding at the next answer for the real PC." True for the administrator's own sign-in only (R3-C1). Until R3-C1 is fixed, say: name every keyboard sign-in, an ordinary account's too, at the PC it was really at. The same paragraph should say that n counts remote and relay sign-ins too (R3-C4); the example's `adel@bay_pc#5` only makes sense once that is said.

### R3-B3 (minor). The capture fixtures are of the scenario before this commit's own edits.

- `test/fixtures/files/ops_privilege_browser_run_1.jsonl` row 1 has the policy key `records`, and row 24 has `olu_folder` as `zip_archive`; the run has no `container/olu_folder` request, no `ADMIN_READ` row and no power-on. The fixture test therefore proves the sign-in naming on a real capture, and nothing about the admin folder read, the audit row or beat 8 in a real capture. Replace both fixtures with the repeat playtest's captures when it is clean, and update `BROWSER_SIGNINS` and the 17/10 counts.

## Check 6: docs

Ten and more claims of `docs/ACCESS_AND_NETWORKS.md` A18 (`:708-741`) checked at their lines, all true at the head: `session_access` `game.rb:3300`; `account_admin_at?` `:3323`; `keyboard_admin?` `:3333`; `session_admits?` `:3350`; `admin_profiles_at` `:3455`; `WITHHELD_NPC_KEYS` `:7680` (holds `creds`); `needs_console` only for a live session `network_access.rb:507-511`; the keyboard-admin override `:525-527`; `plant_policy_refusal` `capture_proofs.rb:52` called at `games_controller.rb:1457`; `record_admin_profile_read` `games_controller.rb:3276`; `ADMIN_TAG_TEXT` `pc-taskbar.js:55` and the marker `:247`; the `needs_console` toast `network-links.js:498`; `ops_need_session` `network_ops.rb:388`; "no `access` for an off session" (fixture run 2 row 1 shows it). The C2-2 and C2-4 sentences are in "Known limits"; O1 and O3 are stated (limits list, the `needs.session` paragraph, Known limits); "What changes for existing scenarios" says five things and lists five, item 5 included. `README_scenario_design.md:1029` (the A18 index row) agrees with the section.

### R3-D1 (minor). Two sentences of "Check from the server" are not quite the code.

- `docs/ACCESS_AND_NETWORKS.md` A18, "Check from the server": `verify-run` is said to end each line with `level admin`, `level user` or `level none`; since `a5697e6c8` it can also print `level error` (`verify-run.rb:84-89`; PLAYTEST says so). And "a bootstrap without the session takes the earned step back" should gain, after R3-C3, "or without `access`"; "credited ... for that account only" should carry the R3-C1 limit until it is fixed.

## Check 7: declined in this round

- R2-A2 (three `needsSession` walks differ on a non-boolean truthy value): holds. Nothing in this round touches the walks; no shipped scenario has such a value; not needed to land.
- R2-A3 (no time limit on a gated remove): holds. A limit is a design change to `sendGatedRemove`; A18 "Known limits" carries the C2-2 sentence about the pending remove.
- R2-B4 (profile items not takeable): holds, see check 5.

## Check 8: answers of existing scenarios, new things sent to the browser

- `a5697e6c8`: tools and tests only. `999b89684`: two client files and three node tests. `5db0320ae`: docs, `scenarios/test_ops_privilege/*`, tests, fixtures. `d37a6907e`: docs. No file under `app/` or `lib/` is in any of the four, so no server answer changes and `bin/ops-golden-compare` has nothing new to compare (not run by this review).
- The one behaviour change for an existing scenario is client-only and is the one R2-A1 asked for: in `test_ops_access`, a step up from a technique user session to admin fires `pc_signed_in` again (as before `5e262e79f`).
- New to the browser, in `test_ops_privilege` only: the object `bay_breaker_on` in the `bay` room answer, the policy key `records_policy` in the bootstrap's `policies`, and `type: "folder"` on `olu_folder`. None is a secret or a finding part.
- The fixtures hold the two typed passwords inside the note texts of the `store` room answer; they are the test scenario's own invented strings, already in `scenario.json.erb`.

## R2 findings: closed or not

| R2 finding | State |
|---|---|
| R2-C1 (major) | closed as redesigned (`--signin`, no `ops_steps` admin, unnamed earns nothing); one hole in the new option: R3-C1 |
| R2-C2 | closed for six ends; the bootstrap end takes back too little: R3-C3; untracked ends answered in check 2 |
| R2-C3, C4, C5, C6 | closed |
| R2-B1 (major) | closed: the deadline is stated at beat 5 and the order changed |
| R2-B2, B3, B5, B6 | closed |
| R2-A1 | closed |
| R2-A2, A3, B4 | declined, reasons hold |
| first playtest: folder not opening | closed by reading (type `folder`); proof is the repeat playtest |
| first playtest: no power-on control | control added; the beat that uses it is R3-B1 |

## Count

- Blockers: 0
- Majors: 3 (R3-C1, R3-C3, R3-B1)
- Minors: 6 (R3-C2, R3-C4, R3-A1, R3-B2, R3-B3, R3-D1)

## Not done, and limits

- No Rails test file was run (a train held the shared lock). The fixture test's two numbers (0 with the four entries, 27 without) and every scanner claim above were reproduced by running the scanner itself over the committed fixtures; the six session-end tests were read, not run.
- No browser and no server: the folder click path and beat 8's "desktop opens with no sign-in" are from the client source.
- `HANDOVER_S5a_17.md` was not read line by line; `HANDOVER_S5a_16.md` was, and agrees with the code apart from the limits above.
- The hand-back route was not located (check 2 b answers from the scanner side only).

## Verdict

Fix first, then playtest and train. All three majors are small and in the test tool or the script, none in the engine or the client:
- R3-C3: one line in `note_privilege_bootstrap` plus a test. Do the host-row and token-deadline rules of check 2 in the same pass if the scanner is meant to guard lapsed sessions; they are the cheap structural rules asked about.
- R3-C1: refuse a named PC that does not admit the account, and cross-check the held account against each 200 desktop answer's `session.npcId`.
- R3-B1: decide how beat 8's power-on row is judged before the scripted run is repeated, or the run cannot come out clean.
The engine, client and scenario changes of this round are ready: R2-A1 is closed, no server answer changed, and the two playtest blockers (folder, power-on control) are closed by reading.

## Fix pass outcomes (fixer, after the orchestrator's rulings)

Files: `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/access-leak-check.rb`, `test/controllers/break_escape/access_leak_scanner_privilege_real_test.rb` (35 tests, 12 new), `scenarios/test_ops_privilege/PLAYTEST.md`, `HANDOVER_S5a_16.md`. No file under `app/`, `lib/`, `public/`.

| Finding | Outcome |
|---|---|
| R3-C1 (major) | Fixed. A named sign-in at a PC that does not admit the account raises `ArgumentError` (exit 2, "<pc> does not admit <account>"). Any successful keyboard sign-in takes the step and held account back at the named PC (named) or every admitting PC (unnamed), as before. The reviewer's run is two tests: in the scenario copy where `store_pc` admits only Olu and Adel the entry is refused; in the shipped scenario (both PCs admit Uma) the entry is accepted, and the step at `bay_pc` goes at the next 200 desktop answer for `bay_pc` (it shows Uma, no admin) so the folder read after it is a finding. With no desktop row in between, a sign-in named at the other admitting PC still leaves the step: documented limit (the client asks for the desktop straight after every sign-in). |
| R3-C3 (major) | Fixed. A bootstrap `sessions` entry present, unlocked, same account, without `access: "admin"` takes the step back (account kept); the review's run is a test (folder and desktop rows then reported). |
| R3-B1 (major) | Fixed (option 3). `--resume <account>@<pc>@<row time>` / `scan(resumes:)`. At a 403 `off` or `not_responding` the scanner remembers the account held, whether the step was held, and a token deadline. The resume applies to ONE 200 desktop row at that PC, of that time, whose `session.npcId` is that account, and restores the step only if the row shows `access: "admin"`. Any other end at the PC (sign-in, lock, logout, `endedPcIds`, bootstrap, 403 of another kind, a desktop or host row showing no admin) drops it. A 200 answer never restores by itself. Tests: right resume clears the row and what follows; another account, another PC, a row before the 403, after a bootstrap end, after a lock: all reported and the entry is listed in `unused_entries`. PLAYTEST beat 8 corrected (the session survives the power; the desktop opens with the marker and no sign-in; exact `--resume` usage). |
| Check 2 rule 1 (token deadline) | Done. The sign-in answer's `expiresInS` plus the row time is a deadline per PC for an earned step; at the first later row with a later `t`, the step and account are gone (before that row is judged). Tests: held at +30 s, reported at +90 s of a 60 s token. |
| Check 2 rule 2 (host row, desktop, bootstrap) | Done, applied BEFORE the answer is judged (a desktop that serves a profile to a non-admin session is reported on that row). A `GET /network` host row of a sign-in PC with no `session` takes step and account back; with a `session` lacking `access: "admin"`, the step. A 200 desktop answer with no session ends the PC; another account's session ends it and takes that account; a session without admin takes the step. Tests for each. |
| Real captures | Stay clean: 0 findings with the four `--signin` entries, 0 unused entries; 17 and 10 bare findings unchanged. No weakening was needed. |
| R3-C2 (minor) | Fixed. `#n` must be `[1-9]\d*`; unknown PC or account, a duplicate key and a bad resume are `ArgumentError`; `scanner.unused_entries` lists entries that matched no row and the leak check exits 2 on them. |
| R3-C4 (minor) | Fixed. Usage text and header say n counts every successful sign-in answer of the account (remote and relay too); header says to name every keyboard sign-in. PLAYTEST carries the worked example. |
| R3-A1 (minor) | Out of scope for S5a (older client behaviour, `pc-sessions.js:678`). To be listed for the owner. |
| R3-B2 (minor) | Fixed: the sentence is replaced; says to name every keyboard sign-in at its real PC, and that n counts remote and relay sign-ins. |
| R3-B3 (minor) | Left, as ruled: the fixtures predate the scenario edits; a comment in the test says so. A fresh capture will be added after the replay. |
| R3-D1 (minor) | NOT done: it is an edit to `docs/ACCESS_AND_NETWORKS.md` A18 ("Check from the server": `level error`; the bootstrap "or without `access`"; the R3-C1 limit), a file outside this fixer's list. Left for the orchestrator. |

Also: `POST /lock_session` whose answer names no `pcId` now ends every PC (the review's cheap hardening). Ends the check still cannot see: a power cut or token lapse with no network view, desktop or reload before the leaking request (the token deadline covers the token case), and a hand-back whose answer names no PC when no desktop, host row or bootstrap follows.
