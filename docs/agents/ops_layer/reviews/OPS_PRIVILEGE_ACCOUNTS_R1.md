# OPS_PRIVILEGE_ACCOUNTS_PLAN.md: round 1 adversarial review

Plan: `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` (462 lines, S5a/S5b/S5c, A18-A20).
Standard: `docs/agents/OPS_LAYER_BRIEF.md` sections 2, 3, 5, 7, 8. Scope: outline S5, lines 97-105.
Grades: blocker, major, minor, nit. "Plan" line numbers are in the plan file; `GM` is
`app/models/break_escape/game.rb`.

Counts: 3 blockers, 12 majors, 9 minors, 3 nits.

Not checked: `workstation-state.js` (nothing in the design rests on it beyond the owner rule,
mirrored at `GM:3384`); how a new server-only state key is kept out of a sync body (the plan's
claim at line 268 is unverified either way); the keyring UI code that would list a harvested entry.

---

## Blockers

### B1. "Every profile on the PC" has no meaning in the code: admin on one PC would read every profile in the scenario

- Plan: lines 14, 88-90, 167-170, 339-340, open question 3 (451-454).
- Code: account profiles are one scenario-wide map, `accountProfiles`, each with a `for` ACL and no
  PC (`GM:3151-3154`; schema `scripts/scenario-schema.json:245-260`, "desktop contents that follow an
  account to any sign-in PC it may use"). `admitted_profiles(npc)` (`GM:3318-3333`) filters that
  global map by identity only. `session_admits?`'s profile branch (`GM:3270-3277`) is satisfied by a
  session **at any PC**, and takes no PC id.
- Effect: "return every account profile on the PC" can only be built as "return every profile in the
  scenario". An admin session on the least important desk PC then opens the director's and the
  domain admin's profile contents, from any PC, through `GET /container`. That removes the reason to
  move laterally and teaches the opposite of least privilege. Open question 3 asks "automatic or
  marked" without noticing the set is undefined.
- Fix: define the set of accounts "present on" a PC and reuse it for S5b: the owner plus
  `cachedAccounts` (or whatever S5b settles on). Admin on PC P reads the profiles whose `for`
  admits one of those accounts, and only through the session at P (`scope_admitted_by_session?`,
  `GM:3288-3307`, which does take a PC id). `session_admits?`'s any-PC profile branch must name the
  admin PC, not answer true globally. State this in sections 4, 5 and 7.

### B2. `localAdmin: "unique"` cannot be built as described

- Plan: lines 29-31, 155-158 ("the one it was taken from"), 193-195 ("only where its credential was
  originally valid"), 346-347.
- Code: an account is one room NPC with one `creds.username` and one `creds.password`
  (`scripts/scenario-schema.json:4399-4410`); usernames are unique across the scenario and
  `attempt_login!` resolves the account from the username alone (`GM:3486`, then one string compare
  at `GM:3488`). A typed sign-in carries no provenance: the server cannot know which PC the player
  "took" a password from, and a password learned from a sticky note or dialogue was never taken
  from a PC at all.
- Effect: there is no field or state from which "originally valid" can be computed. The headline
  mitigation of S5c has no definition a builder can implement or a test can assert.
- Fix (pick one and write it down): (a) under `unique`, a PC has its own local administrator
  secret, declared per PC (`localAdminPassword` on the PC, server-only) or derived from a seed, and
  the shared account's password is refused there; the harvest at that PC yields a keyring entry
  scoped to that PC (a `connectsTo`-style scope already exists, `credential_login.rb:38-41`).
  (b) Simpler: under `unique` the shared local admin password is refused on every `unique` PC
  except its declared home PC (`owner` or a `home` field on the account). (b) is cheap but must be
  described as "home PC", not "where it was taken from".

### B3. The technique and escalation shapes contradict OPS_CORE, which owns them

- Plan: lines 113-128 (a top-level `techniques` map with `matchesFinding`, `requiresSession:
  { host, access }`, `grants: { host, access }`), 174-176 (`elevate_session!` rewrites `access` in
  place), 284-285, 422-426.
- OPS_CORE: `docs/achitechture/OPS_CORE_PLAN.md:38-44` puts `needs.session: "user" | "admin"` and
  `grants: { "session": { "account": "<npcId>", "access": ... } }` on a **weakness**;
  `:46-51` writes a technique session with `via: "technique"`, `foothold`, `access`, `technique`;
  `:699-701` says a step up "replaces the record in place and keeps `foothold`" and asks S5a to
  "confirm it wants no other escalation route".
- Brief section 5: other plans "do not redefine" S3's shapes. The two plans cannot both be built:
  different field names, different nesting, different escalation semantics (rewrite one key against
  replace the record, which changes `via` and therefore `session_lockable?`, `GM:3824-3829`).
- Fix: delete the plan's `techniques` example and `requiresSession`; adopt core's `needs.session` /
  `grants.session.access` and say so. Answer core's request 2 explicitly (no other escalation
  route, or name the other one). Drop `elevate_session!` or reduce it to "core's grant handler
  writes the record; S5a reads it".

---

## Majors

### M1. A password, claim or credential session is always `user`, so S5c's reuse and S5b's harvest pay nothing

- Plan: lines 88-89, 164-166, 318-321 ("S3 is the only grant source"). OPS_CORE asks S5a to decide
  this (`OPS_CORE_PLAN.md:48-49`, `:696-698`); the plan's answer is only "absent means user".
- Effect: the player harvests the shared local administrator on PC 1, signs in with it on PC 2
  (`start_login_session!`, `GM:4400`, no `access`) and holds a *user* session as the administrator.
  No profile reads, no second harvest. Signing in as the domain admin gives the same. The lesson in
  lines 27-33 ("harvesting it once opens them all") does not happen in play.
- Fix: an opt-in, server-only marker for accounts that are administrators (for example
  `creds.admin: "local" | "domain"`, or reuse `sharedLocalAdmin`/`accountKind`), read at session
  write for password, credential and `from` sign-ins. Opt-in keeps existing scenarios unchanged; do
  not derive it from an existing role name. Decide claims (owner claim, guest claim) and relay
  sessions explicitly: recommend never admin. This is partly the user's call (see m8).

### M2. `session_admin?` reads the raw record: a locked, expired, route-down or relay session still counts as admin

- Plan: lines 165-166, 218-224 (check 3 "no session held", check 4 `session_admin?`).
- Code: the one shared live-identity predicate is `session_identity` (`GM:3243-3249`), which returns
  nil for a locked session; route loss and token expiry are judged by `session_route_up?`
  (`network_access.rb:1158-1168`); a relay session is the holder's own screen. The plan's predicate
  bypasses all three, against the comment at `GM:3236-3241` that every read path goes through
  `session_identity`.
- Effect: `POST /harvest_credentials` succeeds against a session whose screen has locked, whose
  foothold was unplugged but not yet pruned, or whose token ran out. Unplug and outage are handled
  for the record itself (`prune_unreachable_sessions!`, `network_access.rb:1446-1472`, deletes whole
  records, so `access` dies with them), but not between prunes.
- Fix: `session_admin?(pc_id)` = `session_identity(pc_id)` present, `session_route_up?(pc_id)`, not
  `relay_session?`, and `access == 'admin'`. Add route checks 3a (locked: the existing
  locked refusal), 3b (route down), and tests for each.

### M3. Whether `access` survives a record rebuild is not specified, and both answers are wrong somewhere

- Plan: lines 164, 259-264 ("an admin session survives a reload exactly as a user session does").
- Code: `start_login_session!` builds a fresh record every time (`GM:4400-4407`). Unlocking a locked
  session is a fresh `POST /login` that rebuilds it (`GM:3803-3814`, `:3820-3822`); so is signing in
  again with the same account, a keyring sign-in (`credential_login.rb:76`), a claim (`GM:3569`,
  `:3653`) and a borrow's displacement.
- Effect: as written, an admin session that locks (auto-lock, lock on leave) comes back as `user`
  after the password is typed, silently. If a builder "fixes" that by copying `access` from
  `previous`, then a different account signing in at the same PC (Switch user, `GM:4399`) inherits
  admin unless the copy is guarded on the same NPC id, which is the user-gets-admin hole this review
  was asked to look for.
- Fix: state the rule. Recommended: `access` is carried only when `previous['id'] == npc['id']`, the
  previous record was not expired, and the new sign-in is not a claim or relay; otherwise it is
  recomputed from the account (M1). Add tests: lock then unlock keeps admin for the same account;
  Switch user drops it; guest claim drops it. Note that `login_session_answer` (`GM:4433`) and
  `session_for_client` (`GM:3786-3788`) pass fields one by one, so `access` needs a parameter there.

### M4. The domain lockout key breaks every other reader of `loginLockouts`, and a keyring sign-in walks past it

- Plan: lines 197-199, 275-277, 325-326, 347-348.
- Code: the `"<pcId>|<username>"` format is parsed or rebuilt in five places besides
  `attempt_login!` (`GM:3483-3484`): `account_locked_out_at?` (`GM:3577-3581`), used by keyring
  sign-in step 7 (`credential_login.rb:59-62`); `lockout_pcs_for_client` (`GM:3587-3594`, splits on
  `|` and keeps only real PC ids); `AccessWork.locked_out_at?` (`lib/break_escape/access_work.rb:1390-1395`),
  which drives NPC frustration, feed posts and workarounds (`npc_frustration.rb:754-816`,
  `social_feed.rb:369`); and `account_login_key?` (`GM:4322-4324`).
- Effects: (1) a `saved_connection` for a domain account still signs in at every PC after the domain
  lockout, because step 7 looks for the PC key; (2) the locked-out NPC never notices (no frustration,
  no "falls back to its phone", which is what the backlog item at `docs/IDEAS_BACKLOG.md:197` is
  about); (3) the reload seed of "lockout seen" marks drops the domain entry, so the client shows no
  lockout anywhere after a reload; (4) the refusal text is "This account is locked on this PC"
  (`GM:3080`).
- Also unstated: the **failure counter** (`loginFailures`, `record_login_failure!`, `GM:4333-4353`)
  uses the same key. If only the lockout key is domain-scoped, the player gets `maxAttempts - 1`
  guesses at every PC in the domain. And `maxAttempts` is a per-PC policy value (`GM:3370-3373`):
  which PC's value governs a domain count?
- Also: the lockout check runs before the account lookup (`GM:3484` before `:3486`); the domain key
  needs the account first, so the order changes for every sign-in. Say so, and show that an unknown
  username still answers exactly as a wrong password does.
- Fix: one helper `lockout_key_for(pc, username_or_npc)` used by all six sites and by the failure
  counter; `lockout_pcs_for_client` expands a domain key to the domain's PCs; state which policy's
  `maxAttempts` applies (recommend the PC where the attempt is made). Deriving scope from account
  kind is a fair answer to the backlog item, but section 15 question 4 should say it also covers
  the NPC side, or that it does not.

### M5. The USB override names one of three places the policy is enforced

- Plan: lines 54-57, 171-172, 233-234, 383.
- Code: the refusal is enforced server-side twice: the implant path (`network_access.rb:507-513`)
  and the plant proof (`capture_proofs.rb:50-52`, "a plant the object's USB policy refuses is never
  recorded"). The client refuses first, from the same table, in `pc-policy.js:43-48` and the picker
  at `:67-73`, so a refused item is never posted.
- Effects: with only the `:509` bypass, an admin's device either never leaves the tray (client
  refusal) or installs without the `planted` proof that gates its capture. Separately, the implant
  path accepts only a keyboard session: it refuses a foothold, relay or `from` session
  (`network_access.rb:494-500`), and a technique session comes "through the existing remote sign-in
  desktop" with a `foothold` (`OPS_CORE_PLAN.md:46-47`). So the override is reachable only by
  escalating a keyboard password session, which the plan never says. The comment at
  `network_access.rb:501` records a ruling that a physical plant "needs no unlocked screen": the plan
  must say whether a locked admin session overrides (under M2's fix it would not).
- Fix: list all three sites; send the client an `access`-aware decision (the label is already
  planned) so `pc-policy.js` lets the item through; state the keyboard-only limit and the locked
  case; add the plant-proof test.

### M6. The harvest's "existing credential path" does not exist in the form described

- Plan: lines 71-75, 182-187, 384-385 ("harvest marks the implicit `<npcId>.password` entries
  serveable ... exactly as a capture does").
- Code: implicit entries are not marked; they are computed from the social-engineering capture
  record. `implicit_keyring_entries` (`credential_keyring.rb:266-287`) reads
  `account_capture_usernames` (`network_access.rb:1754-1776`), which requires an `seCaptures` row
  whose target id a capture route declares, whose evidence holds (`capture_revealable?`) and whose
  address matches an account; the password comes from `capture_secrets_for_client` (`GM:2547` on),
  gated by `reveal_capture_secret?` and authored on a landing page. A harvested account has none of
  that. Forging an `seCaptures` row would also feed the capture log's captures map
  (`credential_keyring.rb:247-259`) and anything keyed on captures.
- Effect: the builder has to invent the mechanism, and the plan never says whether the harvested
  **password text** reaches the browser (an implicit entry carries `password`,
  `credential_keyring.rb:283-284`; a registry password entry does not, `:330-343`).
- Fix: choose and specify. Either a registry credential with a new proof kind (add `harvested` to
  `CredentialModel::PROOF_KINDS`, `lib/break_escape/credential_model.rb:36`, proven by the
  `harvestedAccounts` entry in `credential_proof_holds?`, `credential_keyring.rb:21-36`), or a new
  implicit source `source: "harvest"` built from `harvestedAccounts`. OPS_CRACKING proposes the
  same family for `source: "cracked"` and asks which structure to share
  (`OPS_CRACKING_PLAN.md:328-330`): agree one. Section 7 must state when the password string is
  sent.

### M7. Dropping the routine from S5b: the reasoning is half right and a server-enforced middle exists

- Outline: `OPS_LAYER_PLAN_OUTLINE.md:100-101` ("when an NPC signs in at a PC on its routine, the
  server records it"). Plan: lines 59-64, 130-138, open question 1 (439-446).
- What is sound: the server has no record of an NPC using its own PC (D4 section 6.3), and a
  credential must not be granted on a bare browser claim (brief section 3). Option (c) as worded
  deserves rejection.
- What is lost: the cache is fixed at mission start. There is no reason to wait for someone to use
  a shared machine, no lever to make them use it, and harvesting early or late gives the same
  result. That was the play in the outline, and it is the office-life direction (player levers over
  routines).
- What the plan missed: the server already holds a validated record of one kind of NPC sign-in. A
  `borrow_session` workaround's "done" is accepted only with the hand-over token and after a dwell
  measured on server time (`npc_frustration.rb:181-191`), names a scenario-authored PC
  (`record_borrow_done!`, `npc_frustration.rb:391-394`) and writes `guestSessions`
  (`npc_frustration.rb:243-246`).
- Middle design: the scenario declares the **candidate** set per PC (owner, `cachedAccounts`, and
  the NPCs whose `borrow_session` workaround names the PC). The owner counts as cached from the
  start. A candidate becomes cached only when the server accepts an event for it: a borrow "done"
  at that PC, or a new small report for an own-PC judged use, checked the way borrow reports are
  (declared NPC, declared PC, pace floor). A forged report can at most bring forward an account the
  scenario already made harvestable there, and the harvest still needs an admin session, so the
  secret stays hard-enforced while the timing is best-effort with a sanity check, which is what the
  policy line in brief section 3 allows. Cost: one bounded, grow-only key (`cachedAt`), since
  `guestSessions` is wiped on reload (`npc_frustration.rb:250-259`).
- Fix: add this as option (d) in question 1 with the trade-off, and let the user choose. As drafted,
  the question offers the user only static options or an unsafe one.

### M8. `policies` are sent to the browser; the plan says they are server-only

- Plan: lines 248-249 ("policies are already server-only, D2 section 2.8"), 288-289.
- Code: `scripts/scenario-schema.json:261-263`: "named PC policies ... Not secret; sent in the
  bootstrap". The client reads them (`pc-policy.js:52-56`). Nothing in `game.rb` strips `policies`.
- Effect: `localAdmin: "unique"` on a policy ships in the bootstrap, telling a curious player which
  PCs the reuse will fail on. Brief section 3 requires a correct per-field statement.
- Fix: either strip `localAdmin` from the served policies (and add it to the payload scan), or put
  the setting somewhere server-only, or accept that it is visible and say so.

### M9. OPS_CRACKING's request is not answered, and cleartext harvest makes its admin dump pointless

- Brief section 5: "S5a says where a hash dump comes from when the player has admin".
  `OPS_CRACKING_PLAN.md:323-327` asks S5a to confirm the dump marker shape (it proposes a proof
  `{ dumped: { host, npc } }`) and the admin check.
- Plan: lines 431-434 answer with a question back to S7 and define no dump action, no marker and no
  proof shape. `harvestedAccounts` (`"<pcId>|<npcId>"`, line 266) could be that marker; the plan
  does not say so.
- Design gap: if the harvest hands over usable passwords, no player needs to crack a dumped hash.
  Whether a harvest yields a password, a hash, or one or the other per account is a mechanic the two
  plans must share, and probably the user's choice.
- Fix: state "the admin dump is the harvest", define the marker both plans read, add a per-account
  field (for example `cachedAs: "password" | "hash"`, owner S5b) and say what the default is. Add
  the default to open questions.

### M10. What `local` and `domain` do relative to the PC's ACL is left as three alternatives

- Plan: lines 154-158, 189-197.
- Code: `pc_admits_account?` (`GM:3376-3380`) admits every account when the PC has no `access`.
- Gaps: (1) `local` "signs in only on a PC in its home set (its `owner`ed PC, the PCs that admit it
  by ACL today, or an explicit list)": three different rules, and no field for the list in section
  4. Under the second, `local` is a no-op wherever an ACL exists and undefined where none does.
  (2) `domain`: does matching the domain widen past a PC's `access` ACL or narrow within it? Is a
  domain account refused at a PC with no `domain`? (3) `sharedLocalAdmin` "signs in on any PC":
  including PCs whose ACL excludes it? That is a widening and needs saying. (4) The check is in
  `pc_admits_account?`, which keyring sign-in also calls (`credential_login.rb:53-57`), good; say
  whether owner and guest claims are exempt (`GM:3527` on, `:3597` on), and that technique sessions
  skip it (core's request 3, `OPS_CORE_PLAN.md:702-704`).
- "Absent means today's behaviour" does hold for the sign-in check if the helper returns the ACL
  result untouched, and for the lockout key if M4's helper falls back to the PC key.
- Fix: one truth table (account kind by PC domain by ACL) in section 5, with the refusal for each
  cell, and tests per cell.

### M11. Trimming `harvestedAccounts` at 128 "oldest first" would take earned credentials away

- Plan: lines 266-273 ("capped like its siblings (128, matching `keyringGained`; trim oldest)").
- Code: `keyringGained` is not trimmed; it stops stamping at the cap
  (`credential_keyring.rb:210-216`, `:228`). The keyring is recomputed from state on every read
  (`credential_keyring.rb:74-85`), so if the harvest record is the proof (M6), dropping the oldest
  entry removes that credential from the keyring, and a second harvest then "newly" yields it again.
- Fix: bound the key by authorship instead: at most (sign-in PCs x cached accounts), with a
  validator cap on `cachedAccounts` per PC and in total; never trim. State the worst-case size.

### M12. S5a cannot be proved alone, despite "each stage ships and tests alone"

- Plan: lines 86, 93-94 ("the feature scenario seeds an admin session directly").
- A scenario file cannot seed `player_state.sessions`, and the project rule is that live proofs
  never edit a game row's state. Without S3 there is no route that writes `access: "admin"`, so the
  scripted playtest and the live proof (lines 361-370) cannot run.
- Fix: make S3 a hard prerequisite of S5a in sections 3 and 12, or (with M1) let an opt-in admin
  account give S5a a real path that needs no card.

---

## Minors

### m1. Line citations that are wrong, under a "verified against the code" heading

- `pc_admits_account?` is `GM:3376-3380`, not `3352-3357` (plan lines 82, 189); those lines are
  inside `find_login_item`. The stale number comes from digest D2 line 31.
- "`session_admits?`'s `profile` branch (`game.rb:3298-3300`)" (plan line 170) is
  `scope_admitted_by_session?`; `session_admits?`'s profile branch is `GM:3270-3277`. Both need the
  admin rule, and they differ (B1).
- `sessions_for_client` is `GM:3736-3756`, not `3725-3760` (line 261); `login_pc_owner` is
  `GM:3384`, not "3375 area" (line 63); `add_login_lockout!` is `GM:4366`, not `:4360` (lines 67,
  199); the lockout check is `GM:3484`.
- `owner_claim.rb` is `lib/break_escape/owner_claim.rb` (line 62 gives no directory).

### m2. The JSON examples would not validate

- A sign-in PC is an object with `lockType: "login"` (`lib/break_escape/access_identities.rb:140-142`);
  `"type": "login_pc"` (plan lines 135, 149) appears nowhere in the schema. Objects sit under
  `rooms.<id>.objects`, not a top-level `objects` (lines 134, 148). `creds` is
  `additionalProperties: false` (`scenario-schema.json:4409`) and `policies` entries likewise
  (`:266`), so the schema edits in section 9 are required, not optional polish; the list there is
  right. Brief section 7 item 4 asks for a minimal valid example per stage.

### m3. Client section is thin and one statement is backwards

- `keyring_changed` is emitted **by** the keyring after an answer whose rev moved
  (`keyring.js:786-791`); the harvest should call `refresh()` (`keyring.js:436`), not emit the
  event (plan lines 205-206).
- `publicSession` in `pc-sessions.js:186-209` is a field whitelist; `access` is dropped unless
  added there and to the bootstrap adopt path. Line 390 says only "read `access`".
- Find toasts skip capture-sourced entries (`keyring.js:774-778`) and the Sign-ins list needs a held
  capture log (`keyring.js:781-784`), so a harvest may show the player nothing. Say what feedback
  the harvest gives and where the result is listed.
- No mention of the pixel-art UI rule for the Administrator marker and harvest control (brief
  section 3), nor of a headshot for each harvested account.

### m4. Requests from other plans left unanswered

- OPS_MFA_HELPDESK asks whether a local account is subject to the PC policy's `mfa`
  (`OPS_MFA_HELPDESK_PLAN.md:565-567`). No answer. The proposed order (account kind, then second
  step, then session write, `:568-570`) matches plan lines 427-430; say "agreed" and note that the
  failure counter is cleared after the second step (`:245-247`), which interacts with M4.
- OPS_CORE request 3 (`OPS_CORE_PLAN.md:702-704`): say from this side that a technique session runs
  no account-kind check and no lockout.
- OPS_LOG_ROWS (`OPS_LOG_ROWS_PLAN.md:573-575`): "S5c says what `where` a domain sign-in records".
  No answer. Its events are checked against `OpsLog::EVENTS` with dotted families (`signin.ok`,
  `:154`, `:358`); the five names in section 13 are snake case with no family. Align them.

### m5. Accounts with no person behind them

- An account exists only as a room NPC with `creds` (`GM:3156-3160`, `session_for_client`
  `GM:3783-3784`). The examples add `svcBackup`, `localAdmin` and `domainAdmin` as NPCs in a room
  (lines 136, 145-146). Say how a service or built-in administrator account is authored without a
  walking character, or that it needs one, and what display name and headshot it shows.
- `cachedAccounts` "minus the session's own NPC" (line 181): say why, since a technique session's
  account password is not known to the player either.

### m6. The outline's "domain host" is gone without a reason

- `OPS_LAYER_PLAN_OUTLINE.md:102` lists "a domain host". The plan has only a `domain` string on PCs
  and accounts. If a domain needs no host in this abstraction, say so; if admin on a domain host is
  meant to yield every domain account (the natural S5b target), design it.

### m7. Unlisted state and locking

- `admin_profile_read` fires on the "first admin read" (line 412): knowing "first" needs a record,
  which section 8 does not list ("S5a adds no key").
- The harvest writes state: say it runs under the game lock like the other writing routes, and that
  a repeat after a lost response is answered from `harvestedAccounts` without a second log row.
- "An escalation sends the one changed session" (line 263): through which answer? It is S3's route;
  cross-reference it.

### m8. Choices made silently that belong in section 15

Brief section 8: a real choice goes to open questions. Missing: (1) whether signing in as an
administrator account gives admin (M1); (2) whether a harvest yields passwords or hashes (M9);
(3) whether a locked admin session keeps its override for a physical plant (M5); (4) whether a
shared local admin or a domain account overrides a PC's ACL (M10); (5) which profiles admin reads
(B1, which replaces question 3); (6) whether admin survives lock and unlock (M3).

### m9. Validator and graph changes are named but not located

- "Warn if a technique grants admin but nothing leads to it" and "no admin path to that PC" (lines
  301-303) depend on S3's data and reach model; say which plan's validator pass owns them.
- The dungeon graph paragraph (307-312) names `AccessIdentities.reach` only; it does not say where
  graph edges are emitted or what the new node is called. OPS_CRACKING cites its edge site
  (`OPS_CRACKING_PLAN.md:256`); do the same.
- The "golden-output" proof (328-332) is good; name the test file and how the "before" output is
  captured.

---

## Nits

- n1. `keyringRev` appears only in the non-empty success answer (lines 226-227); return it in both.
- n2. Section 12 calls S5c "independent" of S5b; with B2's fix (a) it is not.
- n3. `LOGIN_LOCKED_OUT` reads "locked on this PC" (`GM:3080`); a domain lockout needs its own line,
  which is player-facing engine text and so needs no voicing.

---

## What held up

- All 15 template sections are present and in order.
- `start_login_session!` is at `GM:4388-4418` as cited, and is the only writer of a session record
  (callers: `GM:3496`, `:3569`, `:3653`, `credential_login.rb:76`).
- Records are removed whole by logout (`GM:3660-3678`), reload (`GM:3689-3702`), borrow end
  (`npc_frustration.rb:391-394`) and the prune (`network_access.rb:1446-1472`), so a stale `access`
  cannot outlive its session.
- Sign-in order in section 2 matches `GM:3444-3503`.
- `check_access_model` (`validate_scenario.rb:7642`) and `check_credentials` (`:7304`) are where the
  plan says.
- No existing scenario changes under "admin reads all profiles", because no existing path writes
  `access`; that stays true only while M1's marker is opt-in.
- `reset_player_state!` (`GM:114-124`) does drop the new key, as claimed.
