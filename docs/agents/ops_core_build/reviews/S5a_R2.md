# S5a review R2: fixes to R1, unit 15 (feature scenario), unit 16 (leak scanner)

Reviewer: read-only. Range reviewed: `3034e2301..HEAD` (committed code only).
Findings are appended below as each check completes.

## Part A: the fix commits (`b3b352b3f`, `dc2860603`, `2bceabda2`, `5e262e79f`, `6be1b9d26`)

Node tests run at the head, all pass: `pc-sessions-admin`, `pc-sessions-access`, `pc-sessions`, `test-bridge-access`, `apply-actions-gated-remove`, `interactions-admin-plant`, `pc-policy-admin`, `pc-taskbar-admin`, `network-links-needs-console`, `dungeon-graph-admin`, `validator-privilege`, `validator-log-sources`, `ops-unchanged-validator` (no shipped scenario gains a validator or graph line from the `accountProfiles` id check or the Mermaid rule).

### Check 1: each R1 finding, closed or not

| R1 finding | State at the head | Verified at |
|---|---|---|
| F1 | closed (comment) | `app/models/break_escape/game.rb:3334` |
| F2 | closed | `game.rb:3485` walks `sessions_oldest_first` (`:3388`, order of `signedInPcs`, then key order for relay and token sessions) |
| F3 | closed | `games_controller.rb:649-650`: the call is inside `elsif located && located[:scope]`, after `container_reach_refusal` (`:640-641`), once per request; `record_admin_profile_read` (`:3276-3292`) still `once: true` and `save!` only when `row&.stored?` |
| F4 | declined, reason holds (record for unit 17) | none |
| F5 | closed | `capture_proofs.rb:55`, see check 2 |
| F6 | closed | `scripts/validate_log_rows.rb:486`; `validator-log-sources` passes; controller guard kept (`games_controller.rb:3281`) |
| F7 | declined, reason holds; not needed to land | see below |
| F8 | closed | brief section 4 item 5 |
| F9 | closed in part; the declined case should be added on the real scenario | see R2-B4 |
| F10, F11, F12 | closed (tests added) | `admin_usb_test.rb`, `privilege_profile_read_test.rb`, `privilege_inventory_remove_test.rb` |
| F13 | ruled (option 1), stated in brief O3 and in `PLAYTEST.md` | check 7 |
| Coordinator 1, 2, 3 | closed | checks 2 and 5 |
| C1-1 | closed | `pc-sessions.js:1087-1089`, check 3 |
| C2-1 | closed | `apply-actions.js:336-340`, `interactions.js:1171-1176`, check 3 |
| C1-2 | closed (test retitled) | `pc-sessions-admin.test.mjs` |
| C1-3 | closed, but the fix changes one more case than the finding named | R2-A1 |
| C2-3 | closed | `.catch` at `apply-actions.js:364`, `interactions.js:1168` |
| C2-2, C2-4 | declined as code, reason holds; the two docs lines are unit 17's and MUST be in its A18 section before landing | docs |
| C3-1, C5-1 | declined, reason holds; nothing to do before landing | none |
| C6-1 | part done (`title`, `pc-taskbar.js:247`); the narrow-width look is for the live proof and must be looked at there before landing | browser tester |
| V-1 | closed for a blank `pc` (three copies agree, check 2); the truthiness difference stays | R2-A2 |
| G-1 | closed | `generate_dungeon_graph.rb:2015-2028`, check 4 |
| G-2 | closed for `test_access_networks`; `m01_first_contact` graph left stale by rule (campaign missions are not edited here) | check 4 |
| T-1 | closed | tests named in the client outcomes table exist and pass |
| T-2 | part declined, reason holds; not needed to land | none |

Declined items that must still be done before landing: none in code. Two things outside code: the C2-2 and C2-4 sentences in unit 17's docs, and the C6-1 look at 360px in the live proof. F7 can stay declined: the three holes are covered by tests written after the change (`admin_profiles_test.rb`, `privilege_inventory_remove_test.rb`, `ops_access_scenario_test.rb` unmodified), which is weaker than a before-capture but the risk the review named was low.

### Check 2: server

- **F5, `plant_policy_refusal` and the room check.** `capture_proofs.rb:52-63`. A remove with `used_on` naming an object in a room not yet unlocked: `plant_policy_refusal` answers nil at `:55`, the controller goes on (`games_controller.rb:1463-1465`), `record_planted_item!` returns false (at the policy line `:34` or the room line `:35`, writing no row: the override row at `:37` is after both), the item is removed and the answer is `200 { success: true }`. That is byte-for-byte the answer before S5a (the remove branch was `record_planted_item!`, `remove_inventory_item!`, `render json: { success: true }`). Nothing else about the answer changed. With an admin session the same holds (no row, no `plantedItems` entry). Closed.
- **F2, `admin_profile_reader` order.** `game.rb:3475-3487`. The `own` test still walks `access_sessions.keys` (order does not matter for `any?`); the pick walks `sessions_oldest_first`. Closed.
- **F3.** The row call is in the scoped branch only, after admission, once, and saves only when a row was stored. A resource scope and a sign-in PC object never reach it. Closed.
- **`session_grant_pc` and a blank `pc`** (`lib/break_escape/capture_model.rb:414-416`, `pc-policy.js:93`, `validate_privilege.rb:189`). Case by case:

| Grant shape | Server | Client | Validator (c) |
|---|---|---|---|
| `pc` missing, nil, `""`, `"  "` | skipped, walk goes on | skipped, walk goes on | dropped before the count |
| `pc` a number or a list | skipped | skipped | counted as its `to_s` (warning text only; no engine effect) |
| `pc: " bay_pc"` (padded) | returned as written (no PC has that id, so no override) | returned as written (same) | stripped for the count |
| `needsSession: 0` or `""` | counts (Ruby truthiness) | does not count | counts |
| `needsSession: "false"` | counts | counts | counts |

  The server, client and validator agree on every shape the fix was about. One old difference is left: see R2-A2.
- **Validator `accountProfiles` id check.** One list entry; the existing error lines of `log_check_stored_ids` now see profile ids. Tested (41 characters, odd characters, clean). Closed.

**R2-A2 (minor). The three `needsSession` walks still differ on a non-boolean truthy-in-Ruby value.**
- Where: `lib/break_escape/capture_model.rb:414` (`action['needsSession']`), `pc-policy.js:93` (`action.needsSession`).
- Brief unit 08: "the same walk as the server's".
- What: `needsSession: 0` or `needsSession: ""` counts on the server and in the validator and not on the client. For `[grant(needsSession: 0, pc: A), grant(needsSession: true, pc: B)]` the server judges the override at A and the client at B. The direction is safe (the server is the authority and a wrong client guess only costs a refused request or a local refusal). Only matters if the schema lets a non-boolean through.
- Fix: compare with `== true` (Ruby) and `=== true` (JS) in all three, or have the validator refuse a non-boolean `needsSession`. Not needed to land.

### Check 3: client

- **C1-1, `PcSessions.settle`** (`pc-sessions.js:1078-1091`). The only caller is `container-minigame.js:1146`, and only when the answer has `session`; the only server answer with `session` is `render_login_desktop` (`games_controller.rb:3366`), which builds it for the PC it serves (`session_for_client(pc['id'])`). So:
  - a share or folder answer (`games_controller.rb:645`, `:651`) has no `session`: `settle` is not called, the level is untouched;
  - a relay desktop: `settle` returns at `:1082` before the level line, and a relay entry never has `access` (the server answers user for a relay);
  - a refused desktop (403 `off`, `not_responding`, `expired`, `no_session`) never reaches `:1146`; `noteDesktopRefused` handles the first two;
  - a locked session: the server sends no `access` for it (`session_access` is nil when `session_identity` is nil), and the client also refuses to set it on an entry it holds as locked (`s.locked !== true`). If the mirror says locked and the server does not, the level stays off until the next sign-in answer: the safe direction;
  - another PC's answer: the id is the one the desktop was fetched for and the server answers for that id.
  No shape found that wrongly sets admin. The one that "wrongly clears" is the intended one: an answer with no `access` clears it. Closed.
- **C2-1, the in-flight guard.** `apply-actions.js:336-340` sets `stopped = true`; `interactions.js:1171-1176` returns for a plain object in flight. Stuck states looked for: both sets are emptied in the `finally` of `sendGatedRemove` (`apply-actions.js:99-102`) on success, refusal, thrown fetch and the retried failure, before the toast and the event, so a throwing toast cannot leave them filled (and the callers now `catch`). `sendInventoryRemove` has at most two attempts. No path found where an item is never removed and never clickable again, with one limit: R2-A3.

**R2-A1 (minor). The repeat-grant change also swallows a REAL step up, which the old expectation covered.**
- Where: `public/break_escape/js/systems/pc-sessions.js:667-673`; `test/js/pc-sessions-access.test.mjs:89-92`.
- Brief section 4 ("nothing else" changes for existing scenarios); client R1 C1-3 asked only for the case "the level was dropped by `noteDesktopRefused` and the same grant is repeated".
- What is wrong: the client now treats "same account, same foothold, `via: technique`" as a repeat whatever the level. The server's repeat is keyed on the FINDING (`network_ops.rb:596-599`, `session['technique'] == finding_id`). In `scenarios/test_ops_access` (`scenario.json.erb:391-399`) `old_release` grants `ian` a user session on `vault01` and `old_release_admin` (needs `session: user`) grants `ian` admin there, through the same foothold: that second use is a new grant on the server (`ops_technique_grant!`, a new record, a `technique_used` row, `endedPcIds` if any) and the answer has no `already`. Before this fix the client ran `_replace` (a `pc_signed_out` reason `switch`, a `pc_signed_in`, `_armToken`, `_dropEnded(endedPcIds)`); now it sets `access` in place, emits nothing and ignores the answer's `endedPcIds` and `tokenExpiredPcIds` (`:673` returns before `:676`). The removed assertion ("a different access level is a change and is recorded") was the test of exactly that step up, so yes, the old expectation was a behaviour worth keeping for the rising case. The comment at `:668` ("a dropped `access` coming back") is not the only case.
- Effect: no access is gained (the level shown is the server's). Lost: the client event for a step up from a technique user session (any scenario `eventMappings` or objective on `pc_signed_in` would not fire for it; none ships today, checked in `test_ops_access` and `test_ops_privilege`), and any `endedPcIds` of that answer (for the same account `start_login_session!` ends only what `prune_unreachable_sessions!` finds, `game.rb:4749`, normally nothing).
- Fix: tell the two apart by the server's own word. `network-view-minigame.js:1474` passes `answer.already === true` to `noteTechniqueSession`; take the in-place branch only for `already`, otherwise `_replace` and `_dropEnded` as before. Or keep the in-place branch but still call `_dropEnded` and emit one event for a level that rose from none to `admin` on a non-repeat. Put back an assertion for the step up (user grant then admin grant, not `already`: one `pc_signed_in`), and keep the new one for `already`. Add the case to section 4 if the in-place behaviour is kept.

**R2-A3 (minor, note). A gated remove has no time limit, and the fix widened what waits on it.**
- Where: `apply-actions.js:44-73` (`fetch` with no abort), `interactions.js:1171-1176`.
- What: while the request is out the object does nothing on a click and the item is offered to no other object. With a connection that hangs without failing, that lasts until the browser gives up on the request (minutes). Before `5e262e79f` only `requiresItem` objects waited; now a plain `triggerOnInteract` object does too. Nothing is lost when the request ends. No change asked for S5a; an `AbortController` with the same limit other waits in the client use would bound it.

### Check 4: the graph

- Mermaid id rule (`generate_dungeon_graph.rb:2015-2028`): `taken` starts as every non-`@` node id of the diagram (after `hide_id`) plus the start node; an `@` id is mapped once per diagram (`mapped`), `_` is appended until free, and the result joins `taken`, so two `@` ids that map to the same text also get different ids. Edges use the same lambda, so both ends follow. The test adds a room `admin_at_desk_pc` and asserts both ids exist and no id is defined twice in a diagram. Closed.
- `scenarios/test_access_networks/dungeon_graph.*` (`6be1b9d26`): the diff holds no line with `admin` in any of the three files. It is the drift R1 described: four `lock_*` nodes (`bench_pc`, `bench_logs`, `it_pc`, `ops_pc`), two `pivot_*` nodes, `signin_*` and `exposes` edges to them, three implant labels, two capture-card nodes and renumbered `rc_*` ids, 46/81 to 52/101. No S5a line.

## Part B: unit 15 (`344aad0c0`, scenario edits in `dc2860603`)

Run under the lock at the head: `ops_privilege_scenario_test.rb`, `ops_privilege_no_exposure_test.rb`, `access_leak_scanner_privilege_real_test.rb`, `privilege_verify_run_test.rb`: 41 runs, 1317 assertions, 0 failures. Validator on the shipped file: 0 errors, 2 warnings (the owner who never leaves `bay_pc`; the grant to a PC whose policy refuses `hid`), both the intended ones; `check_privilege` adds none.

### Check 5: the scenario

- Solvable from the start: no door is locked, both typed logins are on notes in `store`, the cabinet states `locked: false`, the folder `olu_folder` states `locked: false`, the two sign-in PCs state `locked: true` with `lockType: login`. `audit_log_pc` is an `ops_log_terminal` in the start room with `minigameData.logSource: "priv_audit"` (the only source it can read; same authoring as the terminals of `test_ops_logs`, which also state no `locked`), and the Rails test reads it through `GET /log_rows?object_id=audit_log_pc` with no save.
- In-world text: no sign, note, name or observation holds `BAY01`, `RECS01`, `Tallowmere RecordKeep` or `4.2`. The card name ("Field note: records updates"), the technique name and the weakness summary name no product or version.
- Finding id parts (`store_pc`, `records`, `stale_build`): the technique key is now `field_release_notes` and the card id `card_stale`; no object, credential, profile, global or log-source key contains `stale_build`. One near miss, see R2-B6.

**R2-B1 (major, playtest script). Beat 6 has a deadline that starts in beat 5, is not stated at either beat, and cannot be retried.**
- Where: `scenarios/test_ops_privilege/scenario.json.erb:33` (`"expiresMin": 4`), `PLAYTEST.md` beats 5 and 6; `app/models/break_escape/credential_keyring.rb:156-166` (`started + minutes * 60 <= server_now`: real seconds), `:194-196` ("A re-plant never restarts a clock").
- Brief unit 15: solvable beats; review aim "solvable from the start with no hidden step".
- What is wrong: the token's clock starts when the drop box first gains the foothold (beat 5's plant) and runs four REAL minutes. Between that plant and beat 6's "connect with the token" the script asks for a sweep, a scan, a typed remote sign-in, closing the view, a walk to the bay, the socket, the toast and event reads, then a remote sign-out; any server check between the beats adds a Rails boot each. If that passes four minutes the token is dead before beat 6 starts, "the remote desktop opens as Adel with the marker" cannot happen, and nothing in that game brings the token back. The Layout section mentions the four minutes; neither beat does. Not run in a browser by this review: from the code and the beat text.
- Fix (either): move the token sign-in to straight after the plant in beat 5 (connect with the token first, read the marker, sign out, then do the typed remote sign-in and the socket), and say "within four minutes of plugging in the drop box" at that step; or raise `expiresMin` (15) and leave expiry to the Rails test, which already proves it with `travel_to`. Then state in beat 6 what the tester reports if the token has already run out.

**R2-B2 (minor). `PLAYTEST.md` expectations that do not match what the browser shows, and lines that are out of date.**
- Beat 2b (`PLAYTEST.md`, "one row of kind `ADMIN_READ`, by the account `adelwick`, at `bay_pc`, for the profile `olu_files` (... no raw id ...)") contradicts itself: the reader row names the PC by its display name ("Bay desk PC") and shows only the word `profile` for the profile (unit 16 handover, rule 5; the scanner matches `where` to `pc['name']`, `access_leak_scanner.rb:2852`). Write the row as the reader prints it.
- Setup section: "before unit 16 lands read the stored line only" and "Until unit 16 lands the leak check may report the administrator's `access`" are stale now that unit 16 is in; replace with what R2-C1 leaves true.
- Beat 6: "A reopen of the desktop is then refused with "sign in again"": the client's line for an expired token is `tokenExpiredMessage(label)` (`container-minigame.js:1062-1070`), "<label> has expired." wording; check and correct the quoted text.
- Beat 6: `window.__test.getState().gameClock` is hedged ("if the bridge shows it") and is not in `docs/test-bridge.md`; drop it and say real time.

**R2-B6 (minor). The policy key `records` is the service-name part of the finding id.**
- Where: `scenario.json.erb:16` (`"records": { "remote": "allowed" }`), service `"name": "records"` at `:374`.
- The scan of the real run reports nothing today (policies are not sent, and the S2 rule keys on the whole finding id and its strings), so this is not a live clash; it is the same pattern as the `stale_build_notes` key that was renamed. Rename the policy (`records_policy`) so a later rule on id parts cannot trip on it.

### Check 6: the tests

Each behaviour of the brief's unit 15 list has a test on the real file that would fail if it broke: user and admin desktops and the folder (`:116-146`), the audit reader with no save (`:149-169`), the owner's own read (`:171-177`), admin at the other PC (`:179-185`), the keystroke device under user, keyboard admin, locked admin, remote admin, token expiry, power off (`:189-265`), the stick port (`:269-281`), the step up, the relay and the claim (`:354-396`), unearned and refused requests writing nothing (`:400-427`), no-exposure at each step and the forged sync body. The three things with no browser path are covered by real code, not stubs: the stick under admin and the lapsed override run the real controller and `plant_policy_refusal` on a one-edit copy of the scenario (`with_pc_stick_target`, `:286-292`: the bay PC is given `requiresItem` and a `remove_item`); token expiry uses `travel_to` on the real token; the claim test writes the session record by hand (`:389`) and then runs the real `use_technique!`. The hand-written claim record is acceptable (a claim needs the owner to leave), and the result is checked on a re-read game.

**R2-B3 (minor). The no-exposure "locked administrator session" step cannot fail for the thing it is named for.**
- Where: `test/controllers/break_escape/ops_privilege_no_exposure_test.rb:85-86`.
- The lock is on the admin session at `store_pc`, a PC with no owner and so no owner profile to show; the owner strings would be absent with or without the lock rule. `:105` locks the admin session at `bay_pc` but then reads only the bootstrap for `"access":"admin"`. And `answers` (`:37-54`) never asks for `GET /container/olu_folder`, the one route the admin profile branch widened.
- Fix: add `container olu_folder` (and `keyring`) to `answers`; add a step "administrator at the bay PC, then locked" and a step "then signed out" with `assert_world_clean`, so a locked or ended admin session that still opened the owner's profile would fail here on the real scenario.

**R2-B4 (minor). The case declined under F9 has no test on the real scenario either.**
- Brief unit 05 tests: "an inventory add from the owner's profile at P works under admin and is refused under user"; R1 F9 asked for the add through a USER session at another PC while admin is held at the owner's PC. Declined because the unit fixture has two accounts. The real scenario has three (`uma`, `adel`, `olu`) and two PCs, but its profile items are `takeable: false`, so the add cannot be shown there as it stands.
- By reading, the code is right: `scope_admitted_by_session?` judges the profile by the PC the request names (`game.rb:3417`, `admin_session_opens_profile?(pc_id, ...)`), so an admin session at `bay_pc` gives a session at `store_pc` nothing. Not needed to land. Fix when next touched: a third account in the `admin_profiles_test.rb` fixture, or one takeable item in `olu_files` and the case in `ops_privilege_scenario_test.rb`.

**R2-B5 (minor). Three refusals accept either of two statuses.**
- Where: `ops_privilege_scenario_test.rb:123`, `:184`, `:423` (`assert_includes [403, 404], response.status`).
- Brief unit 15: "refused and unearned requests answer as the brief says"; unit 05: "refused exactly as today". A change of the refusal from one status to the other (the kind of change that tells a client whether a folder exists) would pass. Pin the status and the `reason` each one has today.

### Check 7: `PLAYTEST.md`

- `window.__test` calls: `access.sessions()` (`docs/test-bridge.md:439`), `access.compromiseMarks()` (`:444`), `getState().inventory` are documented by those names. `getState().gameClock` is not (R2-B2).
- No beat sends a request of the script's own making: every beat is `interact`, `mg`, `dismiss`, `toasts`, `sync` or a read-only `eval`. The forged and hand-built checks are named as Rails tests at the top.
- Selectors exist in the client: `.pc-start-btn`, `#pc-start-lock`, `#pc-start-signout`, `.pc-taskbar-admin` (`public/break_escape/js/utils/pc-taskbar.js`), `[data-network-id] [data-action="sweep"]` (`minigames/network-view/network-view-minigame.js`); "Something this needs is still missing." is `ops-model.js:33`.
- O3 is stated plainly, first bullet under "Not played in the browser": "A stick the policy refuses, accepted under admin: no path in a validator-clean scenario today", with the reason and the Rails tests that carry plan beats 5 and 8.

## Part C: unit 16 (`26ba01c60`)

### Check 8: the five rules

Read `collect_privilege`, `priv_signin_candidates`, `note_privilege_signin`, `note_privilege_read`, `priv_profile_read_earned?`, `scan_privilege_keys`, `scan_privilege_log_rows`, the profile line in `scan_login_content` and the new tail of `ops_session_owner` (`tools/playtest/lib/access_leak_scanner.rb:1713`, `:2671-2682`, `:2722-2857`).

What holds. Runs tried by reading the code against each shape:
- an admin answer for another PC: a mirror entry and a host row are owned by their map key or `id`; the sign-in answer by the tagged or labelled PC; each needs `admin:<that pc>`. Reported (also tested).
- a sign-in that failed: nothing is earned or taken back without `success == true` and an `npcId` (`:2781`).
- a relay sign-in: takes the step at that PC back, never earns (`body['relay'] != true`, `:2789`).
- a later sign-in by a user at that PC (through `POST /login`, typed, keyring, claim or relay): takes `admin:<pc>` back and replaces the account the run holds there (`:2785-2788`).
- a profile of an account not present at that PC: reported unless the session account at that PC is admitted, or `admin:<pc>` is earned AND that PC's owner is admitted by the profile (`:2819-2828`); the administrator at `store_pc` (no owner) earns nothing of `olu_files` (tested), and `uma_files` on the admin's desktop at `bay_pc` would be reported.
- a row naming another PC: an ADMIN_READ row needs an earned read at the PC its `where` names; a `where` that names no PC or two PCs is reported (`:2850-2855`).
- the key `admin` under an NPC record or a `creds` object: reported anywhere (`:2831-2840`).

Where it does not hold:

**R2-C1 (major). Rule 1 cannot name the PC of a keyboard sign-in in a real browser capture of the shipped scenario, and the only escape is an option the leak check does not have.**
- Where: `access_leak_scanner.rb:2762-2775` (`priv_signin_candidates`); `tools/playtest/access-leak-check.rb:95` (`scanner.scan(lines)`, no `ops_steps`); `.claude/skills/playtest-scenario/scripts/response-capture.js` (tags `inv` and `npcId` only; the word `login` does not occur); `test/controllers/break_escape/access_leak_scanner_privilege_real_test.rb:29-41` (the test adds `'login' => { 'pcId' => pc }` to each sign-in row by hand).
- Brief unit 16 tests: "the scanner over a real captured run of `test_ops_privilege` reports nothing".
- What is wrong, in three parts:
  1. A keyboard sign-in answer has no `host` label (`game.rb:4764-4793`: `host` is added only for a relay, `from` or foothold sign-in) and no recorder writes the `login` tag. Both PCs of `test_ops_privilege` admit every staff account, so the fallback finds two candidates, earns nothing and forgets the session account at both. A browser run then reports, falsely: `ops:key:access` on Adel's keyboard sign-in answer (beats 2 and 7), `ops:key:access` again on the `bay_pc` desktop answer, `profile_admin_read` for `olu_notes` and the folder's `olu_budget`, and `log:admin_read:bay_pc` for the audit row in beat 2b (no admin read was earned). The run that "reports nothing" exists only with tags written by the test. The direction is fail closed, but a leak check that fails every correct run is one the tester learns to wave through.
  2. The handover's answer ("name it with `ops_steps`") is not reachable from `access-leak-check.rb`, which takes no such option.
  3. Used through the class, `ops_steps: ["admin:bay_pc"]` credits the wrong PC. `named` (`:2773`) is chosen for ANY account's untagged sign-in, admin or not, so with that step supplied: (a) the step is in `@ops_earned` from the first line of the run (`:445`), so until the first sign-in a `bay_pc` mirror entry with `access: admin`, or Olu's profile items in a `bay_pc` desktop answer, pass with no admin sign-in at all; (b) Adel's untagged keyboard sign-in at `store_pc` is credited to `bay_pc`: `admin:bay_pc` is earned and the account held at `bay_pc` becomes `adel` although Uma is the one signed in there, so a later answer that shows Uma's session at `bay_pc` Olu's profile, or `access: admin` for `bay_pc`, passes; (c) Uma's untagged sign-in at `store_pc` takes back the step at `bay_pc` and leaves an earned `admin:store_pc` (from a technique grant) standing, so a later `access: admin` on `store_pc`'s mirror entry under Uma's session passes. This is close to the whole-run step the brief forbids ("Do NOT make one whole-game admin earned step").
- Fix: make the recorder tag the sign-in, as it tags `/inventory`: in `response-capture.js` add `login: { pcId }` read from the `POST /login` request body's `pc_id` (null when the body cannot be read), with a recorder test. In the scanner: when the answer has a `host` string that resolves to no PC, earn nothing (do not fall through to the admitting PCs, see R2-C5); drop the `named` branch, or keep it only for an account in `@priv_admins`, never put a supplied `admin:<pc>` in `@ops_earned` at the start, and still take the step back at every admitting PC. Add a test that scans a run recorded WITHOUT hand-added tags and one with the recorder's own tag shape.

**R2-C2 (minor by the brief's wording; it does let a real leak through). A session that ends any way but a newer sign-in keeps its earned step and its account.**
- Where: `access_leak_scanner.rb:2780-2792` (the only place a step or an account is taken back, besides a technique grant at `:2539-2541`); handover "Known limits".
- Brief unit 16: "A new session at that PC takes the step back, as now" (so this is as specified), but the review asked whether a limit lets a leak through. It does: after Adel signs OUT of `bay_pc` (`POST /logout`, in the test's own run), or the session is locked, the token runs out, the PC is switched off, the route drops, or an NPC's hand-back displaces it, `admin:bay_pc` and "account at `bay_pc` = adel" both stand. A later `GET /container/olu_folder` answered 200 with `olu_budget`, or a `sessions.bay_pc.access: "admin"` in a reload, passes the scanner although no admin session exists. Those are exactly the lapses S5a is about (brief section 5 points 4, 6 and 9); today only the Rails tests guard them.
- Fix, from things already in the capture: take the step and the account back for a PC named in a sign-in or technique answer's `endedPcIds`; on a `GET /container/<pc id>` answered 403; and on every bootstrap (`GET /scenario`), where the `sessions` map says which PCs hold a session and whether it is locked (a PC absent or `locked` loses `admin:<pc>`; a PC present with another `npcId` replaces the account). With the recorder tag of R2-C1 extended to `POST /logout` and `POST /lock_session` (`pc_id`), those two are exact as well. Expiry and outage between requests stay untracked: say so in the header.

**R2-C3 (minor). Rule 4 does not judge the `/unlock` answer.**
- Where: `access_leak_scanner.rb:1712-1716`: the profile check runs only when `ctx[:container]` is set; a profile folder's contents in a `POST /unlock` answer are allowed by `folder_unlock_answer?` (`:1750-1752`) with no check of who holds the session.
- Brief section 2b item 1 names the unlock path as one the admin profile branch widens. A locked folder inside the owner's profile, opened through `/unlock` by a user session, would pass. The older rule had the same blind spot (its comment says so); the new rule inherits it. `test_ops_privilege` has no locked folder in a profile, so nothing shows it today.
- Fix: for an `/unlock` answer, apply `priv_profile_read_earned?(profile, nil)` (the any-PC form used for a folder), and add a locked folder to the test's doctored cases.

**R2-C4 (minor). The new owner fallbacks in `ops_session_owner` are not limited to privilege scenarios.**
- Where: `access_leak_scanner.rb:2676-2681`. `@priv_pcs` is filled for every scenario (`:2731`), so in an older scenario a keyboard desktop answer (`GET /container/<pc id>`, no `host`) carrying `via: "technique"` or `access` is now judged against that PC's `session:<pc>` and `admin:<pc>` steps, where before it had no owner and was always reported. The header (`:175`) says the privilege rules run only in a scenario with an admin account or grant.
- This is the only existing rule whose outcome this commit changes for an older log. It stays tied to a per-PC earned step, so it is a narrowing of a false alarm and not a hole; but say so in the header, or gate the fallback on `@priv_active`.

**R2-C5 (minor). A `host` label that names no PC falls through to the guess.**
- Where: `access_leak_scanner.rb:2766-2774`. An answer whose `host` is a string that resolves to no PC (unknown, or shared by two PCs) is treated like an answer with no label, so with exactly one admitting PC that PC is credited. The test at `access_leak_scanner_privilege_real_test.rb:144-149` (`NOWHERE01`) passes only because two PCs admit Adel. The comment at `:2680` says "a label that names no PC still fails closed"; here it does not.
- Fix: `return [[], false] if label.is_a?(String)` after the label lookup fails.

**R2-C6 (minor). Small things.**
- `access_leak_scanner_privilege_real_test.rb:11-12`: the class comment still says the scenario has no log reader and the rows are read through the model; `audit_answer` (`:64-68`) now uses the route.
- `verify-run.rb` `computed_level` rescues every error to `none`: a raise inside `session_access` would print the same word as a locked session. Print `level error` for a rescue.
- Rule 5 counts earned reads per PC from a Set of `admin_read:<profile>@<pc>`: two admin accounts reading one profile at one PC write two rows and earn one (a false alarm, fail closed). Note it in the header.

**Rule 1, "the one PC that admits the account" (the question asked).** With a correct server it cannot credit the wrong PC: a successful sign-in can only be at a PC that admits the account, and the guess is used only when there is exactly one. It can credit the wrong PC in two cases: a `host` label that fails to resolve (R2-C5), and the `ops_steps` branch (R2-C1 part 3). If the server itself signed an admin account in at a PC that does not admit it, the sign-in answer would be credited to the admitting PC and pass, and the fault would show only on the next mirror entry or host row for the real PC.

**The builder's limits (the question asked).** "Lock and expiry not tracked" lets a real leak through (R2-C2), not only a false alarm. "Claim and relay sessions not tracked as accounts" is not quite what the code does: any successful `POST /login` answer with an `npcId` and a resolved PC, a claim or a relay included, sets the account at that PC and takes the admin step back, which is the safe direction; where the PC cannot be resolved the account is forgotten and a profile read reports (false alarm only). "A reload does not re-earn" is false-alarm only.

### Check 9: nothing loosened; the real-run test

- `26ba01c60` adds findings everywhere except `ops_session_owner` (R2-C4). No allowance was added to `scan_passwords`, the share, network, ops-string or log-row rules.
- The merge `cc0f968d7` left `access_leak_scanner.rb` identical to its second parent (main): against the first parent it adds only log plan L3's share-name allowance in a SHARE_OPEN row's `where` (tied to an earlier successful open of that share, reviewed in L3 R1 and R2) and removes no line of an S3 rule.
- The real-run test builds from `scenarios/test_ops_privilege/scenario.json.erb` as shipped (`:16`, `:24-26`); no `gsub` or rename is left, and the audit rows come through `GET /log_rows?object_id=audit_log_pc`. The caveat is R2-C1: its sign-in rows carry a tag a real capture does not.

## Count

- Blockers: 0
- Majors: 2 (R2-B1, R2-C1)
- Minors: 13 (R2-A1, R2-A2, R2-A3, R2-B2, R2-B3, R2-B4, R2-B5, R2-B6, R2-C2, R2-C3, R2-C4, R2-C5, R2-C6)

R1 findings: every one marked fixed is closed by its diff (table in check 1); the one fix that went further than its finding is R2-A1. Declined items: all reasons hold; none needs code before landing; unit 17's docs must carry the C2-2 and C2-4 sentences, and the live proof must look at the marker at phone width (C6-1).

## Checks not completed

None skipped. Limits: no browser and no server were started, so R2-B1 (the four-minute window), the beat 2b row text and the false alarms of R2-C1 are from reading the code, the recorder and the test, not from a run. `bin/ops-golden-compare` was not run by this review (no engine file was edited by it). The scanner's S2 finding-id rule was not re-read in full; "no other id clash" rests on the real-run scan reporting nothing plus a read of every key in the scenario.

## Verdict

Fix first, small: R2-C1 (the recorder's sign-in tag, the label fall-through, the `ops_steps` branch), because until then the leak check of the browser run of this scenario reports false leaks at every keyboard admin beat and cannot be trusted either way; and R2-B1 (one reorder or one number in the scenario and `PLAYTEST.md`) before the scripted run is repeated. The engine, client, validator and graph code is ready to land after the playtest and the train: no client reaches a profile, plant or grant it has not earned by any path found, and no existing scenario changes beyond section 4, with one client-only exception to rule on (R2-A1: the step up from a technique user session in `test_ops_access` no longer emits `pc_signed_in`). R2-C2 should be done in the same pass if the scanner is to guard the lapsed-session cases at all.

## Fix pass outcomes (fixer, after the orchestrator's rulings)

| Finding | Outcome |
|---|---|
| R2-C1 (major) | Fixed. A real capture holds no request body and no PC id in a keyboard `POST /login` row (checked on the S5a capture, `responses-68.jsonl`; only a remote sign-in carries a `host` label). So: no tag is read for attribution beyond a log that has one; where more than one PC admits the account an unnamed keyboard sign-in earns nothing. `access-leak-check.rb --signin <account>@<pc>#<n>` (or `@<row time>`) / `scan(signins:)` names the PC of ONE sign-in row, credited from that row only and for that account only. An `ops_steps` `admin:` entry is refused (ArgumentError); it no longer earns from line 1. Tests: right PC credited, wrong PC still a finding, another account's sign-in not credited, nothing before the row, malformed entry refused, and the real browser capture (fixtures `ops_privilege_browser_run_1/2.jsonl`): 0 findings with four `--signin` entries, 27 (17 `profile_admin_read`, 10 `ops:key:access`) without; each of the 27 is at an unnamed sign-in of Adel at `bay_pc` or Uma's own item, none a real leak. |
| R2-C2 | Fixed for: successful sign-out (every PC: the answer names none, fail closed), `POST /lock_session` (`pcId`), a later sign-in at the PC, a desktop answer 403 (off, not_responding, expired, no_session), `endedPcIds` on any answer (displacing grant, claim, hand-back that names PCs), a bootstrap `sessions` map lacking the PC, locked, or holding another account. One test per case. Not shown by any answer, so not tracked: a token running out between requests, a power cut or dropped route between requests, a hand-back whose answer names no PC. Header says so. |
| R2-C3 | Fixed: a profile item in an `/unlock` answer is judged by the any-PC form; test. |
| R2-C4 | Fixed: the keyboard-desktop owner fallback runs only when the privilege rules are active (older scenario outcome restored); test. Header says so. |
| R2-C5 | Fixed: a host label naming no PC earns nothing and takes accounts back at the admitting PCs; test on a copy where one PC admits the account. |
| R2-C6 | Fixed: class comment; `verify-run` prints `level error` on a rescue (test); the two-admins-one-read false alarm noted in the header. |
| R2-B1 (major) | Fixed in PLAYTEST: beat 5 now plants and connects with the token first, stating the four real minute deadline (first plant, a re-plant does not restart it) and what is seen if it lapses; beat 6 does the typed remote sign-in and the `needs_console` toast, then the lapse. |
| R2-A1 | Fixed: `noteTechniqueSession(..., already)`; only the server's `already: true` sets `access` in place; a step up fires the sign-in and honours `endedPcIds`. Old m2 expectation restored, new tests for the step up and the same-level repeat; `network-view-minigame.js` passes `already`. |
| R2-A2 | Declined: three copies (Ruby, JS, validator) and a non-boolean `needsSession` the schema should refuse; not needed to land. |
| R2-A3 | Declined: an abort limit is a design change to the gated remove; not asked for S5a. |
| R2-B2 | Fixed in PLAYTEST (2b row as the reader prints it, stale unit 16 lines, expiry wording "has expired", `gameClock` dropped). |
| R2-B3 | Fixed: `answers` asks `GET /container/olu_folder`; new test for admin at the bay PC then locked and then signed out. |
| R2-B4 | Declined: profile items are `takeable: false`; fix when next touched. |
| R2-B5 | Fixed: the three refusals pinned to 403 and `Container not unlocked: olu_folder`. |
| R2-B6 | Fixed: policy renamed `records_policy`. |
| Playtest 1 (folder) | `olu_folder` is now `type: "folder"`, `locked: false`. The click opens the folder window, which fetches `GET /container/olu_folder` (`container-minigame.js:983`); `record_admin_profile_read` is hooked on that request (`games_controller.rb:650`), and the scenario tests make the same request. No engine gap. Graph files regenerated. |
| Playtest 2 (power) | A second switch `bay_breaker_on` sets `bay_off` false; beat 8 uses it; Rails test asserts the level returns. |
| Playtest 3 | Beats 5, 6, 9, 10 corrected as listed (lock screen has no tile; token wording; `.network-check`/`.network-confirm`; inventory Connect; events not in `drain`, node tests named; `needs_console` toast read before the power-off). |
| Docs | C2-2 and C2-4 sentences added to A18 Known limits; the leak-check line gives `--signin`. |
