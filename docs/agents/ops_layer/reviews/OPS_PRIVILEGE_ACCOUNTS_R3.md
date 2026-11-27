# OPS_PRIVILEGE_ACCOUNTS_PLAN: round 3 review

Plan reviewed: `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` at `10aa30ea8` (929 lines).
Status: complete, with the gaps listed under "Not checked".

Grades: blocker, major, minor, nit. `GM` is `app/models/break_escape/game.rb`, `NA` is
`app/models/break_escape/network_access.rb`, `NF` is `app/models/break_escape/npc_frustration.rb`,
`CM` is `lib/break_escape/credential_model.rb`, `CK` is
`app/models/break_escape/credential_keyring.rb`, `GC` is
`app/controllers/break_escape/games_controller.rb`. Plan references are section and line.
Sibling plans were read from the working tree (OPS_CORE, OPS_LOG_ROWS and OPS_MFA_HELPDESK have
uncommitted edits there), so a mismatch with them may already be in hand.

Totals: 0 blockers, 1 major, 12 minors, 6 nits.

---

## Check 1. Closure of round 2

| R2 | Subject | State | Evidence |
|---|---|---|---|
| M1 | tiles publish withheld accounts | closed | `accountOnly` never gets a tile (5 l.419-420), section 7 states what tiles still show (l.514-519), by-value scan (l.534-540), question 5. Fits `login_account_tiles` (`GM:3868-3883`): one extra condition in the `select`. |
| M2 | USB override keyboard-only at one site of four | closed on the server, one gap on the client | `keyboard_admin?` (5 l.295-299) at the implant path and the plant proof, `keyboardAdmin` on the client, tests at both sites (11 l.670-673), question 6. Fits `NA:494-509`, `capture_proofs.rb:46-53`, `pc-sessions.js:186-209`. Gap: m2 below. |
| M3 | `after: "borrow"` on an owned PC | closed | Example and feature scenario use an unowned hot desk; validator error; sections 1 and 2 state the no-owner rule. Matches `NF:353-355`. One more unperformable case: m5. |
| M4 | two `pc_admits_account?` | closed, one wrong claim | Delegation to `CM:196-200`, six callers listed (5 l.382-389), `credential_model.rb` in section 12, agreement test. All six callers confirmed by grep. The `pcs_accepting` row is mislabelled: m3. |
| M5 | session answer `access` against the core | closed (declined, ruling) | OPS_CORE now carries the same rule (`OPS_CORE_PLAN.md:65-72`, `:891`, `:1469-1473`). The decline reason holds. |
| m1 | borrow "done" described too strictly | closed | 2 l.86-99 and 5 l.340-349: `cut`, locked-out borrower, add unless present, resolved id. Matches `NF:384-410`. |
| m2 | owner always collectable; "own account" | closed | Owner only when listed, info line, question 7; "never added when it is not" (5 l.356-357). Decline of `cacheOwner` holds. |
| m3 | three server readers of `accountOnly` | closed | One predicate at `filtered_room_data`, `hasPresentNpc` (`GM:2444-2448`), `hasNPCs` (`GC:527`) and the validator. Both lines confirmed. More places an `accountOnly` NPC can be named: m6. |
| m4 | `session_access` loose ends | closed | Step 8 added; tokens named in question 1; relay and claim feeding a step up stated and tested. |
| m5 | collect gaps | closed | Run-time bound stated, no route param explained, readers named in the route steps. |
| m6 | smaller cross-plan mismatches | closed here, open in the siblings | Build order, reset staleness and the keyring path are stated. OPS_MFA still says the session is written "at the level the account carries" (`OPS_MFA_HELPDESK_PLAN.md:1048-1049`); OPS_CRACKING still proposes `dumped` (`OPS_CRACKING_PLAN.md:325`). Requests are in section 14; nothing more for this plan to do. |
| m7 | unchanged proof corrections | closed | Stripped keys, first commit of S5a, frozen clock. Hand-overs use counters and `server_now` (`NF:543-545`), so a frozen clock is enough. One weakness: m10. |
| m8 | tests per stage | partly | Scenario and playtest are now per stage; the borrow trigger is stated; the file name is right. Unit tests are still listed by kind (m11), and the S5b playtest skips a step (m4). |
| m9 | open questions | closed | Two non-choices moved to defaults; three questions added. |
| n1 | repeated `admin_profile_read` | partly | Once per PC and profile, but by a lookup the log store cannot promise (M1 below). |
| n2 | one unit-test directory | declined, holds | Left as a request to all plans. |
| n3, n4, n5 | line range, row id wording, em dashes | closed | |

Counts: 13 closed, 2 partly (m8, n1), 1 declined with a sound reason. No declined item is re-raised.

---

## New findings

### M1 (major). The log rows do not match OPS_LOG_ROWS, and the "once" rule rests on a lookup that plan rules out

Plan: 13 l.791-811, 14 l.854-857.

OPS_LOG_ROWS (working tree) registers event names in a closed list, `OpsLog::EVENTS`, "as the
owning plan's table writes it" (`OPS_LOG_ROWS_PLAN.md:815`), and its table for this feature
(`:957-961`) differs on every row:

| This plan | OPS_LOG_ROWS | Difference |
|---|---|---|
| `admin_profile_read`, detail "profile id", "never a username" | `admin_profile_read`, detail `profile` (account username) | detail content |
| `usb_override`, detail the `usbClass` | `usb_install_overridden`, detail none, merged repeats | name, detail, bound |
| `credentials_collected`, detail count plus per-account npc id and `password`/`hash`, no row on a repeat | `credentials_harvested`, detail `count` only, merged repeats | name, detail, bound |
| none | `hash_obtained` (S5) | this plan writes no such row |
| none (feature dropped, question 4) | `domain_account_locked_out` (S5) | stale row |
| `signin_refused` (l.811, l.857), as ruled | `signin_denied` (`:288`, `:292`, `:992`) | name |

A name that is not in the registry is a dropped row or an error, so the two tables have to be the
same text before either is built.

The "once" rule. 13 l.800-802 writes `admin_profile_read` "only when the log does not already
hold the same event, PC and profile" and promises "at most one save per admin-only profile per PC
per game". OPS_LOG_ROWS stores play rows in per-source lists capped at 10 to 150 rows
(`:180-185`) and says "nothing may gate on a play row" because rows are dropped by the cap
(`:565-566`). A scenario with no `logSources` stores nothing at all. So the lookup answers "not
held" after an eviction, and always in a scenario without log sources. Read literally ("this row
costs one extra `save!`"), every `GET /container` of an admin-only profile then rewrites the whole
`player_state` row.

Fix: take the log plan's existing pattern for `share_file_read` (`:338-346`): call the helper with
`once: true` and `save!` only when the helper appended a row. Drop the "at most one save per game"
sentence, or say "one save per stored row". Settle the six table differences with OPS_LOG_ROWS in
one direction and tell the orchestrator that `signin_refused` (the ruling) and `signin_denied`
(the log plan's text) still disagree. `GET /container` is already on the game-lock list
(`OPS_LOG_ROWS_PLAN.md:344`), so a save there is safe.

### m1 (minor). The collect route tells a client with no session whether a PC id exists

Plan: 6 l.474-483. Check 2 answers 404 for an id that is not a sign-in PC; check 3 answers 422
`Sign in required` for one that is. A browser holding nothing can walk ids and learn which are
sign-in PCs. `GET /container` avoids exactly this: an unknown id and an unadmitted one get the
same 404, "so a browser with no foothold or session cannot tell it exists" (`GC:641-644`), and
OPS_CORE hides PCs on an unswept network from every route
(`OPS_CORE_PLAN.md:1162`).

The route also checks only that a session exists at `pc_id`, not that the player could open that
desktop now. OPS_CORE adds terms to `desktop_request_allowed?` (keyboard branch and foothold
route, `OPS_CORE_PLAN.md:634-657`) that the collect would bypass. Nothing unearned leaks through
that (the session is the player's), but the two gates will drift.

Fix: answer the same 404 for "no such PC" and "no session record"; keep 422 only for a locked or
user-level session the player really holds. State whether the collect reuses the desktop's reach
gate, and if not, why. Add the controller test: an unknown id and a real PC id with no session
give byte-identical answers.

### m2 (minor). An honest client can still lose a stick: `keyboard_admin?` is false while the PC is off

Plan: 5 l.455-461 ("never wider than the server's", "an honest client cannot reach it").

Code: `session_access` step 4 uses `session_route_up?`, which answers false for every session,
local ones included, while the PC's own service is off (`NA:1164-1165`, comment at `:1152-1154`:
"off is off at the keyboard too"). So `keyboard_admin?` is false on an off PC. The implant path
and the plant proof do not check power today, so a plant the policy allows still works there.
The client's `keyboardAdmin` (mirror has `access`, not locked, not remote, not relay) knows
nothing about power and no server answer clears `access` when a host goes off. Result: an honest
player with a keyboard admin session on a PC that has gone off is let through by the client and
refused silently by the plant proof, which is the "item left the tray, nothing recorded" case the
plan says cannot happen.

Fix: pick one. Either `keyboard_admin?` judges the session without the power term (the plant is
physical, like the locked-session ruling at `NA:502`), or `keyboardAdmin` also reads the host's
off state the client already holds for the network view, and section 5 says what the player is
told. Add the case to `admin_usb_test.rb` and to the JS test. Also test the settled case: a
password session opened through a foothold and then served at the keyboard loses `foothold`
(`NA:1556-1565`) and is keyboard admin on the server while the mirror may still say `remote`
(narrower, so safe, but the stick is then refused by the client with no reason shown).

### m3 (minor). `pcs_accepting` is not the keyring's run-time list; the keyring still offers every password row on every screen

Plan: 2 l.139-141, 5 l.389 ("the keyring's 'opens' list and the validator no longer offer a PC
the server would refuse"), 11 l.682.

Code: `pcs_accepting` (`CM:173-191`) has two callers, both offline: the validator
(`scripts/validate_scenario.rb:7607`) and the dungeon graph
(`scripts/generate_dungeon_graph.rb:1655`). The run-time keyring scopes a row to a screen in
`keyring_scope_to_pc` (`CK:479-492`): a password row is `forThisPc: true` on every screen and
`accepted` reads the policy's kinds only; the comment says admission "is not pre-judged here (the
sign-in answers admission)". So after S5c the keyring still offers `deskAdmin`'s password on
`lab1` and the server answers `notPermitted`.

That behaviour is the better one for the lesson (the player tries the shared password on the
hardened PC and is refused) and it keeps `localTo` out of the keyring payload. The plan should say
so. Fix: correct the two descriptions (validator and graph, not the keyring), drop or reword the
test at l.682 (it has no run-time subject), and add one sentence to section 7: a keyring row does
not say where its account is admitted.

### m4 (minor). S5b playtest and `harvest_test` skip the sign-in the borrow forces

Plan: 11 l.685-686, l.732-735 ("wait for the 'done', collect again and get the new account").

Code: `record_borrow_done!` ends the player's session at that PC (`NF:387`) and, unless the
borrower is a careful guest, leaves a guest session open (`NF:406-407`). A click then reaches the
guest's session, which is a claim and so a user session. The second collect needs the player to
sign in again as the administrator past the guest session (Switch user). As written the step
answers 422.

Fix: write the step out in both tests, and say it in section 1: the account a borrower leaves
behind is collected by signing back in as admin after they go. Assert the 422 `notAdmin` under
the guest claim on the way, which is a useful both-sides check.

### m5 (minor). `after: "borrow"` on a headless host is also never performed

Plan: 4 l.211-213, 9 l.594-597. `performable?` needs `!NetworkModel.headless?(pc)` as well as no
owner (`NF:354-355`). A headless host is a sign-in PC (`find_login_pc` finds it; OPS_CORE's
`files01`, `OPS_CORE_PLAN.md:255`) and a likely collect target under a technique admin session.
Fix: validator error for `after: "borrow"` on a headless PC; say in section 4 that a headless host
takes start candidates only, and that its collect control is on the remote desktop.

### m6 (minor). An `accountOnly` NPC can still be named where a person is expected

Plan: 9 l.607-609 warns for ink, phone or position. Missing: a PC `owner` naming it (owner claim
`GM:3552`, the client's `ownerOf`), `workarounds` on it (`NF:345-358`), `needsHome`, a
`share_login` `with`, a `borrow_session` borrower. Each expects an NPC that walks and has been
met; an `accountOnly` NPC is never in `encounteredNPCs`, because encounters are tracked from the
room answer that drops it (`GC:2943-2964`). Fix: validator errors for those references. It may be
listed in `cachedAccounts` and in `grants.session.account`; say so.

### m7 (minor). The collect answer cannot draw the panel it feeds

Plan: 5 l.445-448 shows each collected account "with its headshot"; 6 l.486 sends `{ npcId,
displayName, as }`. The client has no NPC record for an `accountOnly` account or for an account in
a room not yet loaded, so it has no portrait key. Tiles send `portrait` and `avatar`
(`GM:3876-3881`). Fix: add both to the collect rows, list them in section 7, and add `username`
if the panel is meant to tell the player what to type for an account with no tile (the keyring
row may already cover that; say which).

### m8 (minor). How an admin sees the other accounts' profiles is not designed

Plan: 5 l.305-309. `login_desktop_contents` appends each profile's `contents` to one flat list
(`GM:3337-3344`). With admin, the owner's and every cached account's items join that list with
nothing saying whose they are, and two profiles with a folder of the same name sit side by side.
The client section lists the marker and the collect control only. Fix: say what the desktop
shows (for example one folder per other account, named by display name, built on the server so
the item lookup in `find_login_item` agrees), with its test, or state that the flat merge is
intended.

### m9 (minor). The `domain` string and collected display names need the org-text rule stated

Plan: 7 l.511-513 sends `domain` and "the desktop may show it"; the collect panel shows display
names. Brief section 3 requires server validation, plain text and `textContent`. 11 l.714 tests
hostile display names; nothing covers `domain`. Fix: schema pattern and length for `domain`, a
hostile-value JS test, and one line in section 7.

### m10 (minor). "Never re-recorded" will not survive unrelated work

Plan: 10 l.646-647. The golden files compare every answer body of four scenarios. Any later
change on `main` that touches a room answer for an unrelated reason breaks them, and the only way
forward is to re-record, which is what the rule forbids. Fix: make the proof a comparison between
two commits: record at the stage's parent commit, compare at the stage's commit, in one script
the stage's review runs. The checked-in golden files can then be refreshed by unrelated work
without weakening the proof.

### m11 (minor). Tests: stage tags, one vacuous assertion, missing cases

- Unit tests are listed by file, not stage. `admin_usb_test.rb` (l.670-673) needs a technique
  session (S3); `admin_profiles_test.rb` mixes S5a and S5b; `harvest_test.rb` mixes S5b, S7 and
  S8. Tag each case with the stage that can first run it.
- `pc_admits_account_test.rb` "the two definitions answer alike ... over every cell of the truth
  table (after S5c)" (l.680-681): after the delegation there is one body, so the comparison cannot
  fail. Keep the before-delegation comparison; after it, assert the truth table against the one
  body (already in `account_kind_test.rb`).
- Missing, each would catch a wrong build: `access` absent from the mirror entry after the route
  drops or the PC goes off (level computed, not cached); `access` on the host row for a password
  admin session; the collect answer's `as: "hash"` for an authored pair; `admin_profile_read`
  causing no save in a scenario without `logSources` and none on a reopen (M1); the off-PC and
  settled-session USB cases (m2); identical answers for unknown and unsessioned PC ids (m1); a
  collect under a guest claim after a borrow (m4).

### m12 (minor). Open questions: two choices are still made in passing

- "An `accountOnly` account never has a tile" is stated as fixed in question 5's preamble. R2
  asked for it as a user choice; it changes how the shared local administrator is found. Fold it
  into question 5 as its own option pair with the recommendation.
- A guest claim or a relay feeding a step up to admin (5 l.289-293) is decided in the body. It is
  defensible, but it means sitting down at a desktop someone left open is enough to start a step
  up. One line in question 1, with the alternative (password, credential and technique sessions
  only).

All seven questions listed are real choices with options and a recommendation.

---

## Nits

- n1. Section 13's table has its header and rule twice (l.791-794).
- n2. `remote_route_session?` is cited as `network_access.rb:494-500` (2 l.81) and `:501`
  (5 l.296). The call is at `NA:501`, the definition at `NA:1544-1546`, the locked ruling at
  `NA:502`.
- n3. "All four places/sites" (3 l.160, 15 l.918): section 2 names three call sites (implant
  path, plant proof, client `plantRefusal`) and the shared helper. Say three, or name the fourth.
- n4. 5 l.326-327 "both give `via: "password"` or a non-connecting credential with a blank
  `foothold`": say which sign-in writes which record, from `credential_login.rb:73-77`.
- n5. Pair strings are `"<pcId>|<npcId>"`. If either id may contain `|`, say how the pair is
  split, or forbid it in the validator.
- n6. Paragraph breaks are missing where a sentence was appended to a block (1 l.17, l.28, l.39;
  5 l.461; 8 l.572), which leaves lines far over the wrap width.

---

## Orchestrator rulings (check 7)

| Ruling | State |
|---|---|
| answers carry `access: "admin"` only when the computed level is admin | met (5 l.432-437, 8 l.551-554); OPS_CORE agrees |
| sign-in order: password, admission with account kind, second step, session write | met (14 l.845-846) |
| a technique session meets no sign-in checks | met (5 l.401-403); the validator-only check matches `OPS_CORE_PLAN.md:1483-1484` |
| snake_case events; log plan owns `signin_refused` | met here; the log plan's text says `signin_denied` (M1) |
| collect action and `harvestedAccounts` here; `harvested` proof kind to cracking | met (14 l.828-844) |
| no shared moves registry, no actor concept | met |

## What held up

`keyboard_admin?` at both server sites against the real code; the technique record keeping its
`foothold` (OPS_CORE refuses the keyboard desktop and never settles the record,
`OPS_CORE_PLAN.md:636-657`); the delegation, since the two bodies differ only in which
`acl_admits?` they call (`GM:3107-3114`, `access_identities.rb:68-73`); the `accountOnly` drop
from tiles and room answers; both new state keys (server-only, bounded by declared pairs, never
sent, correct after a reload); the collect answer holding no secret.

## Not checked

- The 34 places in `game.rb` and the others in `games_controller.rb` that walk a room's `npcs`
  on the server, for what an `accountOnly` NPC does in each (only `hasPresentNpc`, `hasNPCs`,
  encounter tracking and tiles were read).
- `session_for_client`, `login_session_answer` and the bootstrap adopt path line by line; the
  host row serialiser.
- `reset_player_state!`'s preserved list (`GM:114-124`) and `ACCESS_STATE_DEFAULTS` (`GM:7576`).
- Whether a keyring password sign-in at the keyboard writes `via: "credential"` with a blank
  foothold (n4).
- The validator and dungeon graph line references in section 9.
- OPS_CRACKING and OPS_MFA beyond a grep for the names this plan asks them to change.

## Verdict

No blocker and one major, which is a table to agree with OPS_LOG_ROWS and a save rule to copy
from it. The design of this round (keyboard admin, no-tile rule, delegation, borrow limits,
occupied-room readers) fits the code. A delta review is enough for round 4, covering M1, m1 to m5
and whatever the user's answers to questions 5 to 7 change.
