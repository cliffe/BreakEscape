# OPS_PRIVILEGE_ACCOUNTS_PLAN: round 2 review

Plan reviewed: `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` (revision after R1, 655 lines).
Status: complete. All four checks done. Not checked: OPS_CRACKING's side of the collect contract
(not in this round's scope), and every serialiser of `player_state` (taken from the
`seLandingPages` precedent, `GM:3031-3036`).

Grades: blocker, major, minor, nit. `GM` is `app/models/break_escape/game.rb`, `NA` is
`app/models/break_escape/network_access.rb`, `NF` is `app/models/break_escape/npc_frustration.rb`.
Plan references are section and line of the plan file.

Totals: 0 blockers, 5 majors, 9 minors, 5 nits.

---

## Check 1. Closure of round 1

| R1 | Subject | State | Note |
|---|---|---|---|
| B1 | "every profile on the PC" had no meaning | closed | Present accounts are the owner plus cached candidates (5, l.240-254). `pc['owner']` is a single NPC id (`GM:3384-3389`), `cachedAccounts` is new, `acl_admits?(profile['for'], npc)` exists. The data supports it. |
| B2 | `localAdmin: "unique"` unbuildable | closed | One `local` account per PC; no policy field. |
| B3 | technique and step-up shapes against the core | partly | The shape is the core's now. The session answer's `access` still disagrees with the core (M4 below). |
| M1 | password session always `user` | closed | `creds.admin`, pending question 1. |
| M2 | `session_admin?` read the raw record | partly | The helper is sound (check 2). The plant proof and the client use it without the keyboard condition (M2 below). |
| M3 | `access` across a record rebuild | closed | Computed on read; nothing carried. |
| M4 | domain lockout key | closed by removal | Question 6. |
| M5 | USB override named one place of three | partly | All four sites are named and correct. The "keyboard only, not locked" rule holds at one of them (M2 below). |
| M6 | harvest's credential path did not exist | closed | New row source and one row builder. |
| M7 | routine dropped from S5b | partly | Middle design adopted with the borrow only. It cannot work as exemplified (M3 below). |
| M8 | `policies` are sent | closed | No policy field added. |
| M9 | cracking's request | closed | `harvested` proof per ruling F. |
| M10 | account kind against the ACL | closed | Truth table; kinds only narrow. |
| M11 | trim at 128 | closed | No trim; bounded by declared pairs. |
| M12 | S5a not provable alone | closed | `creds.admin` gives a real admin session. One leftover contradiction (m7 below). |

Counts: 11 closed, 4 partly closed, 0 open.

**Declined suggestions.** All five reasons hold.

- M4 (lockout key): holds. Note that OPS_MFA_HELPDESK section 5.2 and its request 3 now add
  `login_lockout_key` and `login_lockout_keys_for`, which is the "one key helper" question 6 says
  is missing, so the later slice is cheaper than the plan states. Update question 6's cost.
- M7 (own-PC report): holds as a scope cut.
- M9 (`cachedAs`): holds; ruling F says no new field (`CROSS_PLAN_R1.md:142-156`).
- B2 option (a): holds. Cost to state in the plan: usernames are unique (`GM:3486`), so the
  hardened setup has a different username per PC, where the real mitigation keeps one name and
  varies the password. One sentence in section 1 is enough.
- M3: holds; computing on read removes the question.

---

## Check 2. The new designs against the code

### M1 (major). Sign-in tiles publish what section 7 says is withheld

Plan: 7 l.386-387 ("display name of an `accountOnly` account, only in a session answer, a collect
answer or a keyring row"), 5 l.341-342 ("the client learns about account kinds only through the
existing `notPermitted` refusal"), 7 l.393 (`localTo` never reaches the browser).

Code: `login_account_tiles(pc)` (`GM:3868-3883`) builds a tile, `{ username, displayName,
portrait, avatar }`, for every account `pc_admits_account?` admits, and `loginPicker` absent means
`'accounts'` (`GM:3869`). `attach_login_accounts!` (`GM:4465-4478`) puts the list on every sign-in
PC in every room answer.

Effect once S5c lands, with no further change:
- `deskadmin` and its display name appear as a tile on `pc01`, `pc02` and `pc03`, and `lab1-admin`
  on `lab1`. `accountOnly` drops the NPC from the room but not from the tiles.
- Because the account-kind rule sits inside `pc_admits_account?`, the tile lists differ per PC, so
  the browser can read off `localTo` and domain membership without trying a sign-in. The payload
  scan (7 l.398-400) looks for the key name `localTo` and would pass.
- Before S5c, an unscoped `creds.admin` account is a tile on every PC with no `access` list.

Fix: decide and state it. Either (a) an `accountOnly` account never gets a tile (it is typed), and
section 7 says honestly that an ordinary local or domain account's tiles show where it may sign
in; or (b) tiles are intended for all of them and section 7 drops its two claims. Add the tile
list to the no-exposure test by value (the `accountOnly` usernames), not by key name. (a) also
fits the lesson: the shared local administrator is found by collecting, not by reading a tile.
This is a user-visible choice; put it in section 15.

### M2 (major). The USB override is keyboard-only at one of its four sites

Plan: 5 l.256-266 says the override "is reachable only by an admin session held at the
keyboard", a technique session "never overrides", and a locked admin session does not override.

Code:
- Implant path (`NA:494-513`): true as written. The session must have a blank `foothold` and must
  not be a relay or `from` session before the policy is read.
- Plant proof (`capture_proofs.rb:46-53`): there is no session condition at all. The plan's call,
  `admin: session_admin?(found[:object]['id'])`, is true for an admin password session opened
  through a foothold or `from` another desktop, and for a technique session with `access:
  "admin"`. So a remote admin session lets the player record a physical plant the policy refuses.
  That contradicts the three statements above.
- Client (`interactions.js:1056`, `pc-policy.js:71-79`): "passes `admin` from the session mirror
  for that PC" has the same gap, and one more. The mirror keeps a locked session with `locked:
  true` (`pc-sessions.js:198-200`); the server sends a locked session without `access` on reload
  (8 l.415-416), but a session locked during play keeps whatever `access` the mirror already
  held. If the client lets the item through and the server's plant proof then answers false
  (`capture_proofs.rb:52` returns false silently), the item may already have left the tray with
  no proof recorded. The plan does not say what the player sees.

Fix: one server predicate, for example `keyboard_admin?(pc_id)`: `session_admin?(pc_id)` and the
record has a blank `foothold` and is not a relay or `from` session (reuse `remote_route_session?`,
`NA:501`). Both server sites call it. The client mirrors it with one function: `access ===
'admin'`, not `locked`, not `remote`, not `relay`. Add tests: plant proof refused under a remote
admin password session and under a technique admin session; client refuses under a locked mirror
that still holds `access`. If the user would rather a remote admin could override (a defensible
reading), that is a question for section 15, and then the implant path's wording changes instead.

### M3 (major). An `after: "borrow"` candidate cannot be on an owned PC

Plan: 4 l.173-181 gives `hotDesk` an `"owner": "alexT"` and a candidate `samO` with `after:
"borrow"` and a `borrow_session` workaround naming `hotDesk`. The feature scenario repeats it
(11 l.537-538: "a hot desk with an owner, one start candidate and one `after: "borrow"`
candidate").

Code: `performable?` (`NF:353-355`) accepts a `borrow_session` only when
`login_pc_owner(pc).nil?`. `complete_npc_workaround!` answers 403 `unknown hand-over` for a
workaround that is not performable (`NF:161-162`), and `choose_run!` picks only from
`performed_workarounds`. A borrow of an owned PC is never handed over, so `samO` is never cached
and the scripted playtest's "wait for the borrow, collect again and get the new account" cannot
pass.

Fix: remove `owner` from the hot desk example and the feature scenario (an unowned hot desk with
start candidates and a borrow candidate; the owner case shown on a second PC). Validator: `after:
"borrow"` on a PC with an `owner` is an error. Section 2 l.76-82 should state the no-owner
condition, since it decides which PCs can ever gain a cached account in play. Consequence to state
in section 1: under S5a alone an unowned PC has an empty admin profile set.

### M4 (major). Two definitions of `pc_admits_account?`; the plan changes one

Plan: 3 l.143-145 and 12 l.561-562 put the account-kind call in `pc_admits_account?` in `game.rb`
"so the typed and keyring paths both apply it". 9 l.462-464 and 14 l.606-607 ask the core's
validator pass to "run `pc_admits_account?` with the account-kind rule".

Code: there are two. `Game#pc_admits_account?` (`GM:3376-3380`) and
`CredentialModel.pc_admits_account?` (`lib/break_escape/credential_model.rb:196`). The validator
uses the second (`scripts/validate_scenario.rb:7583`, `cm.pc_admits_account?`), and so does the
list of PCs a keyring entry opens (`credential_model.rb:178-191`). With only the `game.rb` copy
changed, the validator checks this plan specifies (9 l.452-457) and the one it hands to the core
run without the account-kind rule, and the keyring offers `deskAdmin`'s password on `lab1`, where
the server then refuses it.

Other callers of the `game.rb` copy the plan does not mention:
- owner claim (`GM:3552`) and guest claim (`GM:3624`). 5 l.309-310 says claims "skip" the account
  kind check; with the call inside `pc_admits_account?` they apply it. The validator rule (9
  l.457) makes the two agree in a valid scenario, so say "claims apply it too" and drop "skip".
- `account_password_opens_something?` (`capture_proofs.rb:198-201`), which gates capture proofs
  on the account opening some PC. A `local` account whose `localTo` PCs are all in rooms that
  exist is fine; state that this reader narrows too.
- `login_account_tiles` (`GM:3874`), see M1.

Fix: put `account_kind_admits?` in `AccessIdentities` as planned and call it from both
definitions, or make `Game#pc_admits_account?` delegate to the model copy. List all six callers in
section 5 with what changes for each. Add `credential_model.rb` to section 12.

### m1 (minor). The borrow "done" path is described more strictly than it is

Plan: 2 l.77-79 and 5 l.272-273 say a "done" is accepted "only with the hand-over token and after
a dwell on server time" and that "the dwell [is] already checked".

Code: `cut: true` sets the dwell to 0 for a `borrow_session` (`NF:187`), and the comment at
`NF:144-150` records that "a tampered client can send it at the hand-over and skip the floor"
(accepted, q43). The hand-over itself is issued by the server after a counted fail
(`choose_run!`, `NF:541-547`), and the NPC must be in `encounteredNPCs` (`NF:155`). So what the
server validates is: a real hand-over token for a declared workaround of a met NPC. It does not
validate that time passed or that the NPC walked there.

This does not break question 2's argument (a forged "done" only brings forward an account the
author declared), and the collect still needs admin. But:
- correct the two sentences, and say in question 2(d) that the dwell is not part of the guarantee;
- `cached_accounts_test.rb` (11 l.510-512) expects "a refused early done" to cache nothing: true
  only without `cut`. Add the `cut` case and assert it caches (accepted behaviour) so nobody
  "fixes" it later;
- `record_borrow_done!` reaches its end for a borrower who is locked out at that PC, whom the code
  comment says "cannot have signed in there" (`NF:397-403`). Cache only when
  `!account_locked_out_at?(pc_id, npc)`; a careful guest and an auto-locking policy did sign in,
  so they still cache;
- `borrow_session` is a repeating kind (`NF:37`), so the same pair arrives again on a later
  borrow. "Add the pair" must be "add unless present";
- `w['pc']` is resolved through `find_login_pc` (`NF:388-389`, `borrow_pc_id` `NF:381-383`), so
  the validator's "workaround naming this PC" must resolve it the same way and the pair must use
  the resolved id.

### m2 (minor). The owner is always collectable, with no opt-out, and the "own account" line is unclear

Plan: 4 l.170-171 ("the PC's `owner` is always a candidate cached from the start"), 5 l.281-283
("the session's own account is included").

- Any scenario that adds one `creds.admin` account, or (after S3) one admin step-up, makes the
  owner's password collectable on every owned PC that admin reaches. That is a new route through
  an existing puzzle chain, added without touching the PC. It is defensible, and the graph shows
  it (9 l.470-475), but it is an authoring trap. Offer an opt-out (`cachedAccounts: []` cannot
  express it, since the owner is implicit; a `cacheOwner: false`, or list the owner explicitly and
  drop the implicit rule) or say plainly in section 4 that there is none, and add a validator info
  line per owned PC an admin path reaches.
- "The session's own account is included" reads two ways: not excluded when it is in
  `cached_accounts_at(pc)`, or added to the set. The second breaks the bound in section 8 (an
  administrator account signing in at any PC would add an undeclared pair). State the first.

### m3 (minor). `accountOnly`: the client is fine, three server readers are missed

Client readers of a session's NPC, checked: the session mirror keeps `npcId`, `username`,
`displayName`, `portrait`, `avatar` from the server's answer (`pc-sessions.js:186-209`); the
taskbar reads those and already handles "an NPC whose room is not loaded"
(`utils/pc-taskbar.js:160-176`); `npcName` falls back to the id (`pc-sessions.js:143-147`);
event listeners (`keyring.js:361-366`, `workstation-state.js:223-224`, `objectives-manager.js:363`)
use `pcId`. Nothing dereferences a missing NPC. The build check in 5 l.319-321 can stay as a test,
not as an open risk.

Server readers that still see the NPC after `filtered_room_data` drops it:
- `hasPresentNpc` in the bootstrap (`GM:2444-2448`) counts any NPC that is not a phone NPC and not
  initially hidden, so a room whose only NPC is `accountOnly` is lit as occupied by a motion
  sensor;
- `hasNPCs` in the room layout (`games_controller.rb:527`);
- the validator's own checks on `npcType: "person"` (position, sprite). 4 l.212-213 says an
  `accountOnly` NPC needs none of them; section 9 lists a warning when it has them but no
  exemption from the checks that require them.

Fix: one predicate (`AccessIdentities.account_only?`) applied at those three places and listed in
section 5; a test that a room holding only an `accountOnly` NPC reports no present NPC.

### m4 (minor). `session_access`: sound, with three loose ends

Read against the code, the seven steps give no wrong admin:
- lock: `session_identity` is nil (`GM:3243-3249`); unlock is a fresh `POST /login` that rebuilds
  the record (`GM:4403-4409`), so the level is that of the account that typed the password;
- reload: password and credential records persist and are recomputed; claims and guest sessions
  end; an expired token is caught twice (`credential_session_expired?`, `NA:1158-1162`);
- outage: `session_route_up?` is false while the host is off (`NA:1164-1165`) and admin returns
  when it comes back, as every other session read does;
- relay is tested before `via`, which matters because a relay record is `via: "credential"`
  (`credential_login.rb:73-77`).

Loose ends:
- no final branch. A record with an unknown or missing `via` falls off the list. Say "anything
  else is `user`".
- 5 l.263-264 names "a keyboard credential". None exists: every connecting kind is routed
  (`credential_model.rb:23-25`: `foothold`, `from`, `relay`, `proof_foothold`), and a collected
  password is typed through `POST /login`, giving `via: "password"`. The only keyboard admin is a
  password session, or a remote one settled at the keyboard. Correct the sentence.
- step 7 gives admin to a `token` or `saved_connection` session of an administrator account.
  Question 1 says "typed or keyring sign-in"; name tokens there, since a token skips the password
  and (per OPS_MFA request 5) the second step is the thing a player expects to stand in the way.
- a step up's `needs.session: "user"` is met by any non-nil level (5 l.236-237), so a relay
  session or a guest claim can feed a step up to admin. Probably intended; say so and test it, or
  exclude them.

### m5 (minor). The collect: remaining gaps

- `harvestedAccounts` and `cachedAt` are bounded by the scenario's declared pairs, whatever the
  validator says, because the server only writes declared pairs. Say that; "the validator caps"
  (8 l.424-427) is an authoring limit, not a runtime one. If a scenario can reach a game without
  passing the validator, clamp in `cached_accounts_at` too.
- the collect route takes no route param. For a technique session the core plan requires a
  request to name the session's own foothold on a `remote: "blocked"` host (OPS_CORE 5.4,
  l.583-592). `session_route_up?` judges the record's own foothold, so the collect is safe
  without one, but say why in section 6 so the two plans do not look inconsistent.
- step 3 and 4 of the route (6 l.356-357) need the raw record and `session_locked?`; step 5 then
  uses `session_access`. Fine; name the readers so the order is buildable.
- `cachedAccounts` in `WITHHELD_OBJECT_FIELDS`: correct. That list is applied to every object sent
  (`GM:7262`), including nested contents.

### Line references taken on trust: both hold

- `credential_login.rb` (`app/models/break_escape/credential_login.rb`): `pc_admits_account?` at
  `:53-56`, as cited. Give the directory.
- `network_access.rb:1754-1776`: `account_capture_usernames`, as cited.
- Also checked and correct: `NA:494-513`, `NF:181-191` (dwell, at `:186-190`), `NF:250-259`,
  `capture_proofs.rb:50-52`, `pc-policy.js:67-79`, `interactions.js:1056`, `GM:3778-3792`,
  `GM:3824-3829`, `GM:4388-4418`, `credential_keyring.rb:266-287`, `credential_model.rb:36`.

---

## Check 3. Other plans

### M5 (major). The session answer's `access` disagrees with OPS_CORE

- OPS_CORE section 0 (l.55-58), 5.4 (l.458-461), 7 (l.696) and 10 (l.872): `access` is passed
  "only when the record has it, and only a technique grant writes it"; `session_for_client`
  "passes the record's `access` through"; "no other session carries `access`" in any answer; the
  host row carries it too. So a technique user session is sent `access: "user"`, and a technique
  admin session keeps `access: "admin"` in the answer whatever its route.
- This plan, 5 l.325-326 and 8 l.409-416: the answer carries `access: "admin"` only when
  `session_access` is admin, "a user session carries no key", and the parameter is "filled from
  `session_access(pc_id)`". So a password admin session carries `access`, a technique user session
  carries none, and the value is the computed level.

Both plans edit `login_session_answer` and `session_for_client` with different rules, and each
plan's "unchanged" proof assumes its own. This plan says nothing about the host row, so a password
admin session would show admin on the desktop and not in the network view.

Fix (for the orchestrator to rule): the answer and the host row carry the computed level from
`session_access`, sent as `access: "admin"` or `access: "user"` only where a level is worth
showing. Simplest rule that keeps both proofs: send `access` when the level is admin, or when the
record is a technique one. OPS_CORE then changes "no other session carries `access`" to "no
session of a scenario without `creds.admin` or a technique grant carries `access`".

### m6 (minor). Smaller mismatches

- **Core, build order.** 3 l.128-131 says S5a does not need S3. 12 l.577-578 says this plan "adds
  the answer parameter after core lands". One of them is wrong; if S5a can land first it adds the
  `access:` keyword itself and the core finds it there (ruling B gave the edit to S3, written
  before `creds.admin` existed).
- **Core, technique session at the keyboard.** OPS_CORE 5.4 (l.506-516): a technique record always
  keeps `foothold` and its desktop at the PC's own keyboard is refused. That supports 5 l.264 on
  the implant path, and is the reason M2's plant-proof gap matters.
- **MFA, the session write.** OPS_MFA 5.2 step 6 (l.310-311) and request 1 (l.938-941) say the
  session is written "at the access level the account carries". This plan stores no level. MFA
  should say "the level is computed by the privilege plan's helper; nothing is written".
- **MFA, reset passwords.** 5 l.289-290 builds a harvest row from `effective_password(npc)` once
  S8b lands. OPS_MFA 5.2 (l.476-482) keeps earlier sources stale on purpose (a post-it and an
  earlier capture show the old password) and lists the new one as `<npcId>.reset`. A harvest row
  that silently updates to the reset password is the opposite rule. Pick one: the harvest row
  shows `creds.password` and goes stale like a capture (no new state), and a collect after the
  reset is not distinguishable, so say that it stays stale until the player earns the reset row.
- **MFA, keyring path.** OPS_MFA 5.2 (l.362-368) and request 4 say an account-kind check for the
  keyring path "belongs in `credential_login_checks`". This plan puts it inside
  `pc_admits_account?`, which that method calls, so the second-step re-judge picks it up. The
  plans agree in effect; say so in section 14 so MFA drops the "adds any check" wording.
- **MFA, lockout helpers.** See the note on M4 under declined suggestions.
- Sign-in order itself (route, lockout, password, admission with account kind, second step,
  session): this plan 14 l.615-618 and OPS_MFA 5.2 l.300-311 agree.

---

## Check 4. State, browser, unchanged proof, tests, open questions

### State, deltas and what reaches the browser

Two server-only grow-only keys, bounded by declared pairs, never sent and never read from a sync
body; the keyring row rides the existing `rev`. S5a and S5c add none. That meets brief section 3.
Exposure problems are M1 (tiles) and m3 (`hasPresentNpc`, `hasNPCs`). `domain` on a PC being sent
is fine and stated.

### m7 (minor). The unchanged proof needs three corrections

Plan: 10 l.489-494.

- `ACCESS_STATE_DEFAULTS` is filled into every game's `player_state` (`GM:7576`), so the two new
  keys appear in the "server state" the golden files compare. Either compare state with the new
  empty keys removed, or assert them separately as empty. The same applies to the keys OPS_MFA and
  OPS_CORE add; agree one golden helper across the plans.
- The test file does not exist on `main`. Say that the test and its golden files are the first
  commit of S5a, recorded before any engine change, and never re-recorded by a later stage.
- Server times (`guestSessionsAt`, hand-over `time`, `NF:545`) and token clocks vary per run;
  freeze the clock or mask them.

The four scenarios named exist. The validator snapshot is a good second check.

### m8 (minor). Tests per stage

- Section 11 lists tests by kind, not by stage. `test_ops_privilege` as described uses S5b and S5c
  fields, which the closed schema rejects until those stages land. Say what the scenario and the
  playtest contain at S5a, at S5b and at S5c.
- The scripted playtest says "wait for the borrow". A borrow is handed over only after counted
  fails raise the NPC's frustration (`NF:526-547`); say what the script does to cause it, and fix
  the owned hot desk (M3).
- "extend `network_ops_no_exposure_test.rb`": that file is the core plan's new one (OPS_CORE 11.4,
  l.949). If S5a lands first it does not exist; the existing file is
  `test/controllers/break_escape/network_no_exposure_test.rb`.
- Missing cases: tiles for `accountOnly` and scoped accounts (M1); plant proof under a remote and
  a technique admin session, and the client under a locked mirror (M2); `cut` borrow and a
  locked-out borrower (m1); both `pc_admits_account?` definitions agreeing over the truth table
  (M4); a collected administrator password meeting the MFA second step (OPS_MFA request 6); a
  relay or guest claim feeding a step up (m4); `hasPresentNpc` (m3).
- Present and good: every `session_access` row through real routes, each route refusal asserting
  nothing written, hostile `pc_id`, hostile display names, both-sides assertions in the playtest,
  the live proof.

### m9 (minor). Open questions

| Q | Real user choice? | Note |
|---|---|---|
| 1 administrator sign-in gives admin | yes | Add the sub-cases it hides: a token or saved connection of an administrator account (m4), and an owner claim of an administrator's unlocked desktop (user under this plan, which a player may find odd). |
| 2 how an account becomes cached | yes | Correct (d)'s guarantee (m1). |
| 3 password or hash by default | no | Settled by ruling F. State it as a default in section 4. |
| 4 default account kind | no | Forced by the unchanged rule. Remove. |
| 5 cost in game minutes | yes | Required by brief section 5. |
| 6 domain-wide lockout | yes | Update the cost (MFA's helpers). |
| 7 locked admin session and a plant | plan's to settle | Fold into the M2 question. |

Missing, and real choices: whether administrator and `accountOnly` accounts show as sign-in tiles
(M1); whether a remote admin session overrides the USB policy for a physical plant (M2); whether a
PC's owner is always collectable or the author opts in (m2).

---

## Nits

- n1. `admin.profile_read` writes a row on every `GET /container` of an admin-only profile (13
  l.591). Ask OPS_LOG_ROWS whether its store caps or folds repeats; otherwise reopening a folder
  grows the log.
- n2. Unit tests are placed in `test/models/` here and `test/unit/` in OPS_CORE 11.1. Both
  directories exist; pick one across the plans.
- n3. `record_borrow_done!` is cited at `:391-394`; the method runs to `:410`, and the new step
  belongs after the lock-out branch at `:402`.
- n4. `account_password_rows` lists `<npcId>.password` once per account; OPS_MFA adds
  `<npcId>.reset` as a second row for the same account. Mention it so the "once per account"
  rule is read as once per id.
- n5. Section 1 uses spaced em dashes in the three stage headings; the house style prefers a
  colon or full stop there.

## What held up

`session_access` as a computed level (no state, no default, correct through lock, reload and
outage); the four USB sites; the account-kind truth table and its uncounted refusal; the collect
route's refusal order and idempotent repeat; `cachedAccounts` withheld through
`WITHHELD_OBJECT_FIELDS`; the client's tolerance of a session with no loaded NPC; both
line references taken on trust.
