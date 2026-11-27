# Ops layer plans: cross-plan review, round 1

Status: COMPLETE for the checks in the brief. Nothing remains unchecked, with these limits:

- `OPS_CORE_PLAN.md` was being rewritten during the review (620 lines at the start, 977 at the
  end). Sections 0 to 8 and 13 to 15 were read at the 977-line version. Sections 9 to 12 were not
  reviewed, as instructed. Core line numbers below are from the 977-line version and may have
  moved; the section number is the stable reference.
- Read by section only: scenario fields, routes, state, shared files, log rows, cross-plan
  requests, open questions. Each plan's "what the code does today", client detail and test beat
  tables were not read. No code was opened: whether a plan matches the code is the per-plan
  reviewers' job.

Short names: CORE, PRIV, SKIN, CRACK, MFA, LOG. `PRIV:116` means
`OPS_PRIVILEGE_ACCOUNTS_PLAN.md` line 116.

Counts: 2 blockers, 12 majors, 13 minors, 5 nits. 42 cross-plan requests, 26 not satisfied as
written (11 contradicted, 15 silent or partly met), 15 satisfied, 1 not a cross-plan matter.

---

## 1. Request ledger

Status: **OK** the other plan already does it; **PART** partly; **SILENT** the other plan says
nothing; **CONTRA** the other plan says something different.

### 1.1 Requests made by CORE (section 14, lines 901-932)

| # | Of | Asks | Status | Evidence |
|---|---|---|---|---|
| C1 | PRIV | Only a technique session carries `access`; S5a decides the level of the others and does not make S3 write it on them | OK | PRIV:88, PRIV:318-321 (absent reads as `user`). PRIV:164-165 "default `user`" should say "absent", see m1 |
| C2 | PRIV | A step up is a weakness with `needs.session: "user"` and `grants.session.access: "admin"`; the record is replaced in place | CONTRA | PRIV:116-128, :174-176, :284-285, :422-426 put `matchesFinding`, `requiresSession` and `grants: { host, access }` on the technique, and add `elevate_session!` |
| C3 | PRIV, MFA | Both say from their side that a technique session runs no lockout, `accepts`, account-kind check or second step | MFA OK (MFA:571-573). PRIV SILENT | PRIV has no sentence on it |
| C4 | SKIN | The four routes and `GET /network` fields are the whole surface; `reason` values are fixed strings to map | PART | SKIN:335, :572-575 follow the core's names. SKIN:355 and :580-582 expect `reason` to be printable plain text, not a code |
| C5 | CRACK | If a weakness should yield a hash, S7 asks for a third `grants` kind | CONTRA | CRACK:331-332 says "the same `kind: "hash"` credential; no new mechanism", but CORE 4.3 (:251-256) refuses any technique-proved credential that is not `saved_connection` |
| C6 | LOG | Helper takes a row with no NPC actor and does not save | OK | LOG:492-494, :501 (`as: nil`) |
| C7 | all | One id space for hosts, objects and resources; a new top-level map of things on a network joins it | OK | No other plan adds things on a network (`helpdesks`, `logSources`, `networkView` are not hosts). LOG:500 reserves `where.kind: "host"` for it |
| C8 | PRIV | Say what level a password sign-in has when it replaces a technique session; provide a level helper that `needs.session` reads, so a password session can feed a step up | PART | Level: absent is `user` (PRIV:88). Helper: only `session_admin?` exists (PRIV:165-166); no helper that answers `user` |
| C9 | PRIV, CRACK | Whichever plan first lets a `password` credential exist with no `foundIn` item also allows the `technique` proof on it | SILENT | Both use the implicit `<npcId>.password` entry (PRIV:183-184, CRACK:202-204), which is not a registry entry, so neither does it |
| C10 | PRIV, MFA | Their sign-in checks come after the discovery condition in `host_reachable_through?` | OK | MFA:243-245 (after the route branch; MFA:261-263 re-judges the stored route with the same helpers). PRIV:105-106 (step 6) |
| C11 | SKIN | The second renderer shares `getTestState` and `ops-model.js`; `ops: true` on a block tells a renderer that scanning applies | CONTRA | SKIN:162 defines its own `network-view-model.js` with `buildViewModel`, and `testState()` per renderer (SKIN:188-189). It does not know `ops-model.js` |
| C12 | all | A key added to `ACCESS_STATE_DEFAULTS` has a flat, empty default (shallow `dup`) | MFA CONTRA; others OK | MFA:401 `mfa` is `{ 'pending' => {}, 'prompts' => {} }`. PRIV:266 `[]`, CRACK:228 `{}`, LOG:345 not in the defaults |

### 1.2 Requests made by PRIV (section 14, lines 422-435)

| # | Of | Asks | Status | Evidence |
|---|---|---|---|---|
| P1 | CORE | `grants` carries `access`; a card form that raises an existing user session; expose `elevate_session!` | PART / CONTRA | `access` is in `grants.session` (CORE:42). The card form is contradicted (C2) |
| P2 | MFA | Second step runs after identity, permission and account-kind checks, before the session is written | OK | MFA:243-245, :568-570 propose the same order |
| P3 | CRACK | Confirm a harvest can produce a `hash` entry; agree the field that marks a cached account as hash-only | SILENT | CRACK never mentions `cachedAccounts`. It asks PRIV the mirror question (K1) |
| P4 | LOG | Accept its five rows | CONTRA | Rows do not fit the helper (section 2.6) |

### 1.3 Requests made by CRACK (section 14, lines 323-336)

| # | Of | Asks | Status | Evidence |
|---|---|---|---|---|
| K1 | PRIV | An admin-dump effect that writes a per-host, per-account marker a hash record's `proof` can read; confirm the marker shape | SILENT | PRIV's only admin action on credentials is the harvest, which yields cleartext passwords (PRIV:178-187). No dump, no marker for a proof |
| K2 | PRIV / A15 | Name the captured-accounts structure S7 writes its grant marker into; one path, one `MAX_ENTRIES` budget | SILENT | PRIV adds its own key `harvestedAccounts` (PRIV:266). Neither plan names an existing structure |
| K3 | CORE | A technique that yields a hash grants a `kind: "hash"` credential | CONTRA | Same as C5 |
| K4 | LOG | Accept `hash_obtained`, `crack_run`, `crack_yield` | CONTRA | LOG:542 and :576: offline cracking writes nothing |
| K5 | CORE / N4 | An unknown share content `kind` is inert, so `hash_file` degrades safely | Not a cross-plan matter | N4 is built code; CRACK's own reviewer checks it |

### 1.4 Requests made by MFA (section 14, lines 565-580)

| # | Of | Asks | Status | Evidence |
|---|---|---|---|---|
| M1 | PRIV | Is a local account subject to the PC policy's `mfa`? | SILENT | PRIV does not mention MFA outside the order question |
| M2 | PRIV, CORE | Order: account kind and admission (S5c), second step (S8), session write with level (S5a) | OK | PRIV:427-430 agrees. But see M3 below on the lockout key |
| M3 | CORE | State that a card session meets no second step | OK | CORE 5.4 table (:351) |
| M4 | PRIV, CRACK | Harvested or cracked passwords are typed sign-ins; neither starts a session directly | OK | PRIV:186-187, CRACK:197-204 both end at a keyring entry |
| M5 | LOG | Helper accepts a row with no session, and a `by` field | PART | No session needed (LOG:494). No `by` argument exists (LOG:494-504) |
| M6 | CORE | A host with no sign-in has no policy and no second step | OK | CORE 4.1 (:181-184): no lock on a `hosts` entry |
| M7 | orchestrator | `test_ops_mfa` covers S8b; no `test_ops_helpdesk` | OK | Brief section 5 lists no helpdesk scenario |

### 1.5 Requests made by LOG (section 15, lines 565-584)

| # | Of | Asks | Status | Evidence |
|---|---|---|---|---|
| L1 | all | Use the seven-column table of 13.3; add events to `OpsLog::EVENTS`; call before the model's `save!`; each `test_ops_*` declares `logSources` and asserts a row | CONTRA / SILENT | All four tables (CORE:892-899, PRIV:409-415, CRACK:313-317, MFA:549-558) use a four-column who/where/when form and flat event names. No other plan mentions `logSources` |
| L2 | CORE | Own `where.kind: "host"`; say whether a scan writes rows; a technique use logs as the session's account | PART | Rows are listed, but with network, finding and technique ids that LOG:312-313 forbids in any row |
| L3 | PRIV | Say what `where` a domain sign-in records; list a privilege-raise row | PART | `privilege_escalated` is listed. Domain sign-in `where` is not stated; the lockout row's `where` is "the domain" (PRIV:415), which is not a `where.kind` |
| L4 | CRACK | Offline cracking writes nothing; a dump on a host may | CONTRA | K4 |
| L5 | MFA | Prompt rows and a reset row; the caller's claimed identity in neither `as` nor detail | PART | Rows listed; `helpdesk_request` has two identities in "who" and a desk id as place (MFA:557) |
| L6 | SKIN | Writes no rows | OK | SKIN:560-564 |
| L7 | orchestrator | `actor` and `log_rows_for` stay reserved | OK | No plan uses them. MFA's `by` (M5) is close to `actor`; see ruling |

### 1.6 Requests made by SKIN (section 14, lines 568-587)

| # | Of | Asks | Status | Evidence |
|---|---|---|---|---|
| R1 | CORE | Add each move as a row in `MOVES` and an entry in the view-model; build K1 before S1 | SILENT / CONTRA | CORE 5.5 (:416-436) adds controls to the scene and its own pure module. See M1 on the registry question |
| R2 | CORE | Move names `scan_network`, `scan_host`, `check`, `confirm`, `use`; short unique names for host, service, finding, technique | PART | Service `name` is unique per host (CORE:27). A finding's only unique name is the three-part id. `POST /network/technique` takes a card `item_id`, not a technique (CORE:457), and one technique may sit on several items (CORE:249-250) |
| R3 | plans with a roll | Seeds do not depend on the game id | OK for the parity run | CORE has no rolls (5.6). CRACK's token seed is account plus a per-scenario salt (CRACK:103-104). MFA codes use wall time but are not in the network view |
| R4 | LOG | No skin in a row; no route parameter naming the skin | OK | LOG:581-582 |
| R5 | every plan | One answer body per move: an outcome, a plain-text `reason` on refusal, the changed items | PART | Four refusal styles across the plans (m5). Only CORE's moves are in the view, and CORE's `reason` is a code |
| R6 | every plan | Objectives, hints and lines in `test_ops_*` name moves and targets, never controls | SILENT | No other plan mentions it |
| R7 | PRIV, CRACK, MFA | A move in the network view goes in `MOVES`; a move on another screen has one skin | OK by absence | Harvest is on the desktop (PRIV:203-205), cracking in its own scene (CRACK:160), MFA on the sign-in screen. SKIN:185 still expects "S5 escalate, S7 dump" rows |

### 1.7 Recommended rulings for the unsatisfied requests

Each says which plan changes and to what.

**Ruling A (C2, P1, C8): the core's step-up shape stands. PRIV changes.**
Brief section 5 gives S3 the card and the host shape. In the core a technique is a generic
matcher (`worksOn`) and the grant sits on the weakness; PRIV's sample puts the grant and the host
on the technique, which would make `techniques` hold two incompatible shapes. PRIV deletes its
`techniques` sample (PRIV:116-128), `requiresSession`, `matchesFinding` and `elevate_session!`,
and refers to CORE section 0. PRIV adds one helper, `session_access(pc_id)`, answering `"admin"`
or `"user"` (absent reads `user`), with `session_admin?` built on it. CORE's `needs.session`
check calls that helper once it exists, so a password session can feed a step up. PRIV drops its
"same NPC" condition (PRIV:175-176): the weakness's `grants.session.account` names who the new
session is, and the validator can warn when it differs from every account the PC admits.

**Ruling B (C1 tidy, and who edits `start_login_session!`): S3 makes the edit, S5a reads it.**
CORE adds the `access:` and `technique:` keyword arguments and emits `access` in
`login_session_answer` and `host_row` (CORE:321-328). PRIV removes "writes `access` ... (default
`user`)" from its own file list (PRIV:164-165, :377, :381-382) and keeps only the readers
(`session_access`, the three gates) and `sessions_for_client` if CORE does not cover it. Nothing
writes or sends a default: a session without the key stays without it, or PRIV's own golden-output
proof (PRIV:328-330) fails.

**Ruling C (C3 for PRIV, M1): PRIV adds two sentences.**
(1) A technique session runs no account-kind check at run time; the validator applies
`pc_admits_account?` with the account-kind rule to `grants.session.account` (CORE:259-260), so an
author cannot grant a session as a domain account on a PC outside its domain. (2) Account kind
does not change the second step: every enrolled account meets the PC policy's `mfa`, and
`creds.mfa: false` is the only exception. MFA keeps `MfaModel.enrolled?` as written.

**Ruling D (C4, R5, the `reason` vocabulary): `reason` is a code; one client table turns it into
text.** CORE's refusal texts live in one pure module that both renderers import. SKIN changes
SKIN:355 and request 5 from "plain-text `reason`" to "a `reason` code and the shared text table".
No server answer carries display prose for a refusal.

**Ruling E (C5, K3, C9): no third `grants` kind. CRACK widens the core's rule when S7 lands.**
A weakness that yields a hash uses `grants: { "credential": "<hashCredId>" }`, and the hash entry
carries `proof: { "technique": "<findingId>" }`. CORE's validator rule "the kind must be
`saved_connection`" becomes "`saved_connection`, or `hash` once A21 is built". CRACK adds that
one-line validator edit and a test to its build steps. C9 (a `password` with a technique proof)
is not built by anyone: CORE question 9 answer (a) stands and the note about S5b or S7 picking it
up is removed from CORE:924-926 and CORE:971-972.

**Ruling F (P3, K1, K2): the harvest is the dump. One marker, one new proof kind.**
- PRIV owns the action and the marker: `harvestedAccounts` entries `"<pcId>|<npcId>"`.
- CRACK owns a proof kind `harvested`: `proof: { "harvested": { "pc": "<pcId>" } }` on a `hash`
  entry holds when `harvestedAccounts` has `"<pcId>|<account.npc>"`. This replaces CRACK's
  tentative `dumped` (CRACK:325).
- No new field on `cachedAccounts`. The registry decides: when a `hash` entry with a `harvested`
  proof exists for that PC and account, the harvest yields the hash record and not the cleartext
  `<npcId>.password` entry. Otherwise it yields the password as PRIV has it. PRIV adds that one
  branch to `harvest_cached_credentials!`; the validator requires the account to be in the PC's
  cached set.
- Because a proof now reads `harvestedAccounts`, it must not be trimmed (m7).
- K2: each plan keeps its own marker (PRIV `harvestedAccounts`, CRACK a named key, MFA
  `accountResets`), and CRACK names its key (M8). One helper beside `implicit_keyring_entries`
  answers "how was this account's password earned" so that `<npcId>.password` is listed once with
  one `source`, in the order captured, harvested, cracked.

**Ruling G (C11, R1, R2): one view-model module, K1 before S1, and the `MOVES` question goes to
the user.** If the user allows the table (M1), K1 lands first and CORE puts its row merging, need
labels and refusal texts into `network-view-model.js` entries instead of a second module
`ops-model.js`; `ops: true` on a block is the flag the view-model reads. If the user refuses the
table, SKIN keeps a renderer split with no table and CORE's `ops-model.js` is the shared module.
Either way there is one module, not two. For R2: Terminal targets are ids (host id, service
`name`, technique id); findings get a short per-view alias as well as the full id; CORE's `GET
/network` `techniques` entries carry the held card's `itemId` so the client can turn a technique
id into the `item_id` the route needs, taking the first held card in id order.

**Ruling H (C12): MFA uses flat keys.** `mfa` becomes two keys, `mfaPending` and `mfaPrompts`,
each `{}` by default. The nested default would be shared between games by the shallow `dup`.

**Ruling I (L1, L2, L3, L5, P4, M5, K4, L4): the log contract is extended once, then every plan
rewrites its table.** See B2 for the detail. In short: LOG adds `where.kind` values `desk` and
keeps `host`; ids of findings, techniques, networks and services never go in a row; `by` becomes
a detail code; CRACK writes no rows; PRIV's escalation row merges into CORE's technique row.

**Ruling J (R6): orchestrator adds the wording rule to the build brief.** No plan changes.

**Ruling K (R7 tidy): SKIN drops "S5 escalate, S7 dump" from SKIN:185.** Escalation is the
core's `use` move already; harvest is on the desktop.

---

## 2. Conflicts

### Blockers

**B1. Two shapes for a technique and for the step up to admin.**
CORE section 0 (:28-44), 4.2 (:225), 4.3 (:229-262), 14.2 (:906-908) against PRIV:116-128,
:174-176, :284-285, :301, :422-426. In CORE a `techniques` entry is `{ name, summary?, worksOn }`
and the grant, the needs and the host all belong to a weakness. In PRIV a `techniques` entry is
`{ matchesFinding, requiresSession: { host, access }, grants: { host, access } }` and a helper
`elevate_session!` rewrites the level. S5a cannot be built against S3 as S3 is written. PRIV's
validator warning (PRIV:301) and its dungeon graph edge (PRIV:307-309) also assume its own shape.
Fix: ruling A.

**B2. No other plan's log rows can be written through the helper.**
LOG:494-504 and :516-542 against CORE:892-899, PRIV:409-418, CRACK:313-317, MFA:549-558. The
helper raises `ArgumentError` on an unknown event, result or detail (LOG:210-211), so these are
build failures, not style.

| Mismatch | Where | Fix |
|---|---|---|
| Event names are flat (`network_swept`, `mfa_challenge`, `credentials_harvested`); the helper wants `family.name` | all four | Families: CORE `scan` and `technique`; PRIV `privilege` and reuse `account.lockout`; MFA `mfa` and `helpdesk`. Suggested names in the table below |
| `where` is a network id, a finding id, a domain, a desk id, a share, "the hash record's account" | CORE:894-899, PRIV:415, MFA:557-558, CRACK:315-317 | `where` is always `{ kind, id }` from LOG:500. LOG adds `desk` (id is the `helpdesks` key; the room is the desk NPC's room). A sweep's place is the foothold's own attachment (`jack` or `ap`), as `net.link_up` uses. Everything on a host uses `host` or `pc` |
| Rows carry finding ids, technique ids, service names, a network id, a refusal reason | CORE:894-899 against LOG:312-313 ("no row ever carries a network id or name, a weakness or a finding") | `detail` is a closed code list only. Ids stay out. If the parked debrief needs them, that work adds a server-only field |
| A `by` field | MFA:554, :576-577 | A detail code: `owner`, `held_phone`, `own_phone` |
| Two identities in one row | MFA:557-558 ("account asked about, desk NPC") | `as` is the account; the desk is `where`. This also meets LOG:578-580 |
| Cracking rows | CRACK:313-317 against LOG:542, :576 | CRACK writes none and says so in one line. Obtaining a hash by harvest is already PRIV's `privilege.harvest` row |
| Privilege raise logged twice | PRIV:411 and CORE:899 for the same `use_technique!` call | One row, CORE's, with detail `step_up`. PRIV drops `privilege_escalated` |
| Domain lockout logged twice | PRIV:415 and LOG:552 (`account.lockout` in `add_login_lockout!`) | One row, LOG's, with a new detail code `domain`; `where` stays the PC |
| "Until S9 lands, the helper is a no-op stub, matching the other ops plans" | PRIV:417-418; no other plan says so | L1 is built first (section 2.10), so nobody stubs |
| Table format | all four | Seven columns per LOG:535 |

Suggested event names, for the plans to adopt or change: `scan.sweep`, `scan.host`,
`scan.service`, `scan.confirm`, `technique.use` (results `ok`, `denied`; details `session`,
`credential`, `step_up`, and the refusal codes), `privilege.profile_read`,
`privilege.usb_override`, `privilege.harvest`, `mfa.challenge`, `mfa.code` (`ok`, `fail`),
`mfa.prompt`, `mfa.approve` (`ok`, `denied`), `mfa.expired`, `helpdesk.request` (`ok`, `denied`;
details `password`, `mfa`, `blocked`).

Two questions inside this that need the user, listed in part 3: whether scans and technique uses
appear in in-world logs at all (LOG:569-571 hopes so; CORE writes them "first time only"), and
whether an `mfa.prompt` run is something a player can read.

### Majors

**M1. The skin's `MOVES` table against user decision 1.**
Brief section 2.1 ("No shared registry of moves, no single 'act' route, no actor concept")
against SKIN:169-186, :198-206, :568-571, :585-587. `MOVES` is "the single source for both
skins"; "a move that is not in the table cannot be drawn by either renderer"; later plans "add a
row here"; and `scene.dispatch(intent)` is one client entry point for every move. The server side
obeys the decision (no route knows the table, SKIN:337-338). The client side is a registry of
moves in all but name, and it is the same idea as the parked "moves as data" outline. My reading
is that it is acceptable only if scoped, and the user should say so. Suggested fix: keep it as
the network view's own control table (label, verb, target kind, handler), rename it
(`VIEW_CONTROLS`), state in SKIN that it is presentation data for one screen with no server
mirror and no use by any other screen, and remove the requirement that other plans register
(R7 already limits it to the network view, where only CORE adds anything).

**M2. Hash sources: three plans, three mechanisms, and the admin source is undefined.**
Brief section 5 ("S5a says where a hash dump comes from when the player has admin") against
PRIV:178-187 and :431-434 (harvest gives cleartext; asks CRACK for the field), CRACK:91-92,
:117-119, :323-327 (asks PRIV for the marker; ships share-only until then), CORE:42-44 and
:251-256 (a technique-proved credential must be `saved_connection`) against CRACK:331-332. The
share source also has two mechanisms for one fact: the content entry `grants: "dana_hash"`
(CRACK:131) and the entry's own `proof: { held: ... }` (CRACK:112). Fix: rulings E and F, and say
in CRACK that the `proof` is what earns the record; `hash_file.grants` is a validator cross-link
only, as CORE requires a weakness and its credential to name each other.

**M3. Lockout key: S5c changes it, S8 hard-codes the old one.**
PRIV:197-199, :380 (`"domain:<name>|<username>"` for a domain account, used by
`add_login_lockout!` and the pre-password check) against MFA:268-269 ("the same `pcId|username`
key") and the "Lockout key" checks in MFA:369-370. A wrong code for a domain account would count
on a different key from a wrong password, so `maxAttempts` would not cover both steps and a
domain lockout would not stop the second step. Fix: one helper, `login_lockout_key(pc,
username)`, owned by whichever of S5c and S8 lands first (today's string until S5c); every caller
in both plans uses it. MFA's pending record stores the key or recomputes it through the helper.

**M4. A password sign-in can never be admin.**
CORE:903-905 leaves the level of password, claim and credential sessions to S5a; PRIV:88 and
:318-321 answer "always `user`". Then PRIV's own S5c content does not connect to S5a and S5b: a
harvested shared local admin password (PRIV:103-104, :155-158) signs in on the next PC as `user`,
cannot harvest there, and the chain a player expects from that lesson stops after one hop. The
same holds for a cracked (S7) or reset (S8b) password of an administrator account. This is a
design gap at the seam, and it is the user's call (part 3, N1). Suggested fix if the user wants
it: a per-account marker read by `session_access` (for example `creds.admin: true`, or a list on
the PC of accounts that are administrators there), so the level of a password session comes from
who signed in and where.

**M5. `start_login_session!` writes a `signin.ok` row with a detail the log does not know.**
LOG:229-232 (detail from `via`, values `password` and `credential`; unknown detail raises) against
CORE:321-326 (`via: "technique"`). With L1 and S3 both built, a technique grant raises, or
silently logs a sign-in that CORE says never happened (CORE:909-911). Fix: LOG states that
`via: "technique"` writes no `signin.ok`, as `claim` does not; CORE's `technique.use` row is the
record. LOG also says what a session started by `POST /mfa/verify` or `/mfa/approve` logs
(`signin.ok`, detail `password`, plus MFA's own row).

**M6. `crackRuns` is the only ops key described as synced.**
CRACK:228-233 ("New synced state ... sent as a delta on the existing `sync_state` path") against
CORE:491-493, PRIV:266-269, MFA:396-397, LOG:310-311, all server-only and never read from a sync
body. If the key sits in a sync section, a client can write `runs` up to `cost` and skip the salt
gate, which the brief's cheat rule forbids for anything that yields a credential. Fix: `crackRuns`
joins `ACCESS_STATE_DEFAULTS` as a server-only key; the route answer already carries `runs`
(CRACK:193), which is all the client needs.

**M7. `mfa` has a nested default in `ACCESS_STATE_DEFAULTS`.** CORE:931-932 against MFA:401.
Fix: ruling H.

**M8. CRACK has two pieces of state with no name.**
CRACK:146-148 (the token, "memoised in server state") and CRACK:235-238 (the grant marker, "one
id in an existing captured-accounts structure", unnamed, and K2 asks PRIV to name it while PRIV
adds a different key). Neither appears in CRACK's state section with a bound. Fix: CRACK names
both. Suggested: no stored token at all (it is a pure function of account and scenario salt, so
recompute it), and one key `crackedAccounts: [npcId]`, bounded by the number of `hash` entries
(64), server-only.

**M9. Two pure view-model modules for the same screen.** CORE 5.5 (:429-432, `ops-model.js`:
"row merging, the works-on line, need labels and refusal texts") and CORE:929-930 against
SKIN:162 (`network-view-model.js`: `buildViewModel`, `availableIntents`). Both would be on every
harness copy list and both would merge rows. Fix: ruling G.

**M10. The Terminal's `use <technique> <finding>` cannot be sent as the route is defined.**
SKIN:177, :572-575 against CORE:457 (`item_id`) and CORE:249-250 (several items may carry one
technique), CORE:477 (`techniques` sent for held cards, keyed by technique). The view answer does
not say which held item carries which technique. Fix: in ruling G; CORE adds `itemId` to each
sent technique.

**M11. A step up and a technique session on an MFA or account-kind PC have no owner for the
test.** CORE:909-911 and MFA:571-573 both rely on "no sign-in is attempted", and CORE says a
technique-granted `saved_connection` is an ordinary credential sign-in, which MFA stage M4 stops
at the second step (MFA:121, :248-250). No plan's feature scenario lists either case (PRIV:357-366
and MFA:493 as far as read; CORE section 11 not reviewed). Fix: MFA adds two controller tests
once S3 exists (a technique session on a `code` PC opens with no pending record; a
technique-granted saved connection to that PC returns `mfaRequired`), and CORE names them in its
request 3.

**M12. `localAdmin: "unique"` needs to know where a typed password came from.**
PRIV:155-158 and :193-195 ("signs in only where its credential was originally valid", "the one it
was taken from") against the sign-in model every other plan uses: a typed password has no
provenance, and CRACK:202-204 and MFA:311-313 add two more ways to hold the same account's
password (cracked, reset) with no "taken from" PC. Fix: PRIV defines the rule without provenance,
for example the account's home PC is its `owner`ed PC and `unique` refuses it everywhere else,
and says what a cracked password of that account does (the same).

### Minors

**m1. "Default `user`" is written two ways.** PRIV:164-165 ("writes `access` ... default `user`")
and PRIV:203 (the bootstrap carries a label per session) against PRIV:318-321 and CORE:48-49 (no
key on other sessions). Fix: ruling B; the client shows the marker only when the key is `admin`.

**m2. `needs` means two things.** CORE:38-41 (`needs` on a weakness: a map of conditions) against
MFA:181, :199 (`helpdesks.<id>.needs`: an integer count). Fix: MFA renames its field, for example
`minCorrect`.

**m3. `grants` means three things.** CORE:42 (an object with `session` or `credential`),
CRACK:131 (a string naming a credential), PRIV:121 (`{ host, access }`, removed by ruling A). Fix:
CRACK's content entry uses `credential: "<id>"`.

**m4. Parameter style.** `foothold`, `finding_id`, `item_id`, `host_id` (CORE:454-457), `pc_id`
(PRIV:216, MFA:369), `desk_id`, `npc_id` (MFA:368-373), `object_id` (LOG:290), against CRACK:173
`hashId` and `candidate.reuseFrom`. Fix: CRACK uses `hash_id` and `reuse_from`.

**m5. Four refusal styles on new routes.** CORE:449, :457 (`{ success: false, reason, need? }`);
PRIV:219-223 (`{ error: "...", notAdmin: true }`, and 400 for a missing param); MFA:369-373
(boolean flags `tooSoon`, `expired`, `refused`, `blocked`, `cancelled`); CRACK:177-197 (`reason`
codes for refusals, `status` for outcomes, no `success`); LOG:295-297 (`{ error }`). Fix: every
new ops route answers a player-caused refusal as `{ success: false, reason: "<snake_code>" }` plus
extras; boolean flags stay only on the existing `/login` answers (`mfaRequired`, `lockedOut`,
`notPermitted`). PRIV: `reason: "not_admin"`, `"no_session"`. MFA: `too_soon`, `expired`,
`refused`, `blocked`, `cancelled`. CRACK adds `success` and keeps `status`.

**m6. Authorisation and locking are stated three ways.** MFA:357-358 (`show?`, `with_game_lock`
per route), CORE:447-448 (`set_game`, `with_game_lock`), CRACK:170-171 (a new policy method
`crack?` "mirroring `sync_state?`", no lock stated though the route increments a counter),
PRIV:215-224 (no policy or lock stated; calls `save!` itself), LOG:292-293. Fix: one line in each
plan: authorised as `show?`, in `set_game`, writers in `with_game_lock`. CRACK drops `crack?`
unless its reviewer finds a reason for it.

**m7. `harvestedAccounts` trims its oldest entry.** PRIV:266-268 (cap 128, "trim oldest") against
PRIV:182-184, where the entry is what makes a keyring entry serveable, and ruling F, where a
proof reads it. Trimming would take a credential away. Fix: bound it by authoring (the validator
caps PCs times cached accounts) and never trim.

**m8. Bootstrap additions against other plans' byte-for-byte proofs.** MFA:382 ("the bootstrap
gains one boolean, `mfaDeclared`") against MFA:458 ("added only when true or non-empty") and the
unchanged-bootstrap proofs in CRACK:269-270, PRIV:328-330 and CORE section 10. MFA:458 is the
right rule; MFA:382 should say it. The same rule applies to `networkView` (SKIN:344) and to
`access` on a session (m1).

**m9. `WITHHELD_SCENARIO_KEYS` and `WITHHELD_OBJECT_FIELDS` are edited by several plans, and two
plans do not say how their fields are withheld.** CORE:187, :196 (`hosts`, `techniques`,
`services`), LOG:458 (`logSources`), MFA:387, :417 (`helpdesks`, by `x-serverOnly`), PRIV:244
(`cachedAccounts` and `domain` on a room object are "server-only", with no mechanism named).
Fix: PRIV adds both object fields to `WITHHELD_OBJECT_FIELDS`; MFA says by which list `helpdesks`
is removed.

**m10. A password that a reset has made stale.** MFA:307-311 (`effective_password`; the old
password fails; post-it and capture go stale "on purpose") against PRIV:183-184 and CRACK:202-204,
which serve `creds.password` as `<npcId>.password` after a harvest or a crack. After a reset the
keyring shows two passwords for one account, and a hash cracked after the reset yields the old
one. This is defensible (a cache and a dump are old data) but no plan says it. Fix: MFA adds
harvest and crack to its "stale on purpose" list, and the keyring marks `<npcId>.password` as
superseded when `accountResets[npc].password` is set.

**m11. One session node or two in the dungeon graph.** CORE (old outline text, section 9.3 not
reviewed) sends a weakness's edge "to the host's session node"; PRIV:307-309 wants "a new
node/edge pair" for admin. Fix: CORE's reviewer and PRIV agree that a host with any admin grant
draws a second session node, and PRIV hangs harvest edges from it. Flagged only so that both
graph changes are designed together.

**m12. Three places for validator checks.** CORE (old section 12 text): `scripts/
validate_network.rb`. MFA:420, :529: a new `scripts/validate_mfa.rb`. PRIV:291, CRACK:247,
LOG:362: inside `validate_scenario.rb`. SKIN:389, :555: "the ops check file". Fix: orchestrator
picks one pattern (a check file per feature, hooked from `validate_scenario.rb`) and SKIN names
the file it means.

**m13. `prompts`/`promptsSent` and wall-clock codes in a deterministic game.** MFA:586-590
recommends server wall time for codes while brief section 3 says "deterministic: seeded rolls
only", and SKIN:576-578 asks that fresh games behave the same. It is outside the parity run, so
it only matters for MFA's own scripted playtest. Fix: MFA says how the playtest reads a code
(through `GET /mfa/device`, never by predicting it) and keeps question 1 for the user.

### Nits

**n1.** PRIV:135, :149 write a sign-in PC as `"type": "login_pc"`; CORE:173 and MFA:154 write
`"type": "pc", "lockType": "login"`. PRIV's reviewer will have this; listed because PRIV's schema
text (PRIV:286-288) also says "`login_pc`/host object", and "host object" is not a thing in CORE.

**n2.** SKIN:490-492 uses `check files01 web`; CORE's samples name services `files`, `print`,
`admin_page` (CORE:163-175). `test_ops_skin` should reuse the ids of the core scenarios.

**n3.** State key prefixes: `opsDiscovered`, `opsFindings`, `opsUsed`, `opsLog`, `opsLogSeq`
against `harvestedAccounts`, `crackRuns`, `mfa`, `accountResets`, `helpdeskTries`. No clash. An
`ops` prefix on all of them would make them easy to drop and to grep; optional.

**n4.** CORE question 5 and CORE:351 say S8 "states this from its side"; it does (MFA:571-573),
so CORE:909-911 can drop MFA from the request.

**n5.** SKIN:552 lists privilege as touching `network-view-minigame.js`; PRIV:390-391 touches
`pc-sessions.js` and the desktop only.

### 2.1 The session record, field by field

| Field | Added by | Written where | Meaning owned by | Read by |
|---|---|---|---|---|
| `id`, `via`, `foothold`, `credential`, `from`, relay | built | `start_login_session!` | built | all |
| `via: "technique"` (new value) | CORE:46-48 | CORE's call, CORE:321-326 | CORE | `desktop_request_allowed?`, `session_lockable?`, `settle_session_at_keyboard!` (CORE 5.4); LOG must skip it (M5) |
| `access` | CORE writes; PRIV reads | `start_login_session!` keyword (ruling B) | PRIV (S5a) | `session_access`, three gates, `needs.session` |
| `technique` (finding id) | CORE:47-48 | same call | CORE | nothing outside CORE |
| MFA pending record (not a session) | MFA:258-259 | `attempt_login!`, before the session | MFA | `/mfa/*` routes; copies `via`, `credential`, `foothold`, `from` and must copy nothing else |

No two plans give one field two meanings once ruling A is applied. One gap: the pending record
has no slot for `access` and needs none, because only a technique session carries it and a
technique session never has a pending record.

### 2.2 Sign-in order, merged

`attempt_login!` as the three plans would leave it:

1. PC found; route branch (reach, off, remote blocked). CORE adds the discovery condition inside
   `host_reachable_through?` and `from_route_refusal` (CORE:927-928).
2. Lockout check, on the key from `login_lockout_key` (S5c scopes it for a domain account; M3).
3. Account lookup; password equals `effective_password(npc)` (S8b, MFA:307-308).
4. `pc_admits_account?`, including `account_kind_admits?` (S5c, PRIV:189-197).
5. Second step (S8a): write the pending record and return `mfaRequired` (MFA:243-247).
6. Clear failures; `start_login_session!` (no `access` key for a password session); LOG's
   `signin.ok`.

Who passes through what:

| Way in | Steps met |
|---|---|
| Typed password, including a harvested (S5b), cracked (S7) or reset (S8b) one | all six |
| `saved_connection` from the keyring, including one granted by a technique | `attempt_credential_login!`: its own checks, then the second step after its step 8 (MFA:248-250). PRIV does not say whether the account-kind check runs on this path; it should |
| `token`, `assist_invite` | no second step (MFA:121) |
| Technique session (S3) | none of 2 to 5; only reach, discovery, host on, and the checks of `use_technique!` |
| Claim of an open screen | none; no row (LOG:231-232) |

The order itself is agreed by PRIV:427-430 and MFA:568-570. The open points are M3 (key), M4
(level) and the credential path's account-kind check.

### 2.3 Keyring kinds and proof kinds

| Change | Plan | Constant or method |
|---|---|---|
| Proof kind `technique` | CORE:330-334 | `PROOF_KINDS`, `credential_proof_holds?` |
| Kind `hash` turned on, `connects: false` | CRACK:251-253 | `KINDS` |
| Proof kind `harvested` (ruling F), replacing the tentative `dumped` | CRACK | `PROOF_KINDS`, `credential_proof_holds?` |
| `mfa: true` flag on `saved_connection` | MFA:248-250 | `KINDS` |
| Implicit `<npcId>.password`, earned by harvest | PRIV:182-184 | beside `implicit_keyring_entries` |
| Implicit `<npcId>.password`, `source: "cracked"` | CRACK:202-204 | same |
| Implicit `<npcId>.reset` | MFA:311-313 | same |

Three plans edit `KINDS` or `PROOF_KINDS` and three extend the implicit-entry builder. None
clashes on a name. The shared points are the single `<npcId>.password` id reached three ways
(ruling F gives the precedence) and the `MAX_ENTRIES = 64` budget, which CRACK:229-230 shares
between hash records and everything else: the validator should count registry entries of every
kind against it once.

### 2.4 `player_state` keys

| Key | Plan | Shape | Bound | Synced or sent |
|---|---|---|---|---|
| `opsDiscovered` | CORE:499 | `{ networks: [], hosts: [] }` | networks, 64 hosts | no |
| `opsFindings` | CORE:500 | `{ findingId: "u"/"c"/"f" }` | 128 | no (rides on rows) |
| `opsUsed` | CORE:501 | `[findingId]` | number of weaknesses | no |
| `sessions[pc].access`, `.technique` | CORE, PRIV:259-264 | two short strings per session | sign-in PCs | `access` on the session answer; `technique` not stated |
| `harvestedAccounts` | PRIV:266 | `["pc\|npc"]` | 128, trimmed (m7) | no |
| `crackRuns` | CRACK:228 | `{ hashId: n }` | 64 | **yes as written (M6)** |
| token memo, grant marker | CRACK:146-148, :235-238 | unnamed (M8) | unstated | unstated |
| `mfa` (`pending`, `prompts`) | MFA:401 | nested (M7) | one per PC, one per account | no |
| `accountResets` | MFA:402 | `{ npcId: { password?, mfa? } }` | one per account | no |
| `helpdeskTries` | MFA:403 | `{ "desk\|username": n }` | accounts, plus 200 others | no |
| `opsLog` | LOG:342 | 300 rows | about 36 KB | no; read by `GET /log_rows` with `rev` |
| `opsLogSeq` | LOG:343 | integer | one | no |
| (none) | SKIN:359-365 | `localStorage` only | | |

No name clashes. After M6, nothing new is synced. Total growth is about 36 KB for the log and a
few KB for everything else, all server-side. One thing for LOG's reviewer: `player_state` is
saved whole on every write, so the 36 KB is rewritten on every save of a game that has
`logSources`, including the frequent sync saves. `technique` on the session record should be
stated as not sent (it is a finding id the player already holds, so this is tidiness).

### 2.5 Scenario fields and id spaces

| Top-level key | Plan | Reaches the browser |
|---|---|---|
| `hosts`, `techniques` | CORE | never whole |
| `networks.<id>.discovery` | CORE | no |
| `credentials` (kind `hash`, new proofs) | CRACK, CORE | by keyring only |
| `resources.<id>.contents[]` kind `hash_file` | CRACK | by container route |
| `policies.<name>.mfa` | MFA | no |
| `policies.<name>.localAdmin` | PRIV | no |
| `helpdesks` | MFA | `helpdeskForms` only |
| `logSources` | LOG | no |
| `networkView` | SKIN | yes |

Fields on a sign-in PC object: `services` (CORE), `cachedAccounts`, `domain` (PRIV). On `creds`:
`accountKind`, `domain`, `sharedLocalAdmin` (PRIV); `mfa`, `recovery`, `resetPassword` (MFA). On
`habits`: `approvesPrompts`, `promptPatience` (MFA); CRACK reads `password`, `passwordPattern`.
No two plans add the same field name on the same object. Same word, different place: `needs`
(m2), `grants` (m3), `domain` (on `creds` and on a PC, both PRIV, same meaning), and `access`,
which already names the admission list on a PC and a resource (CORE:259, CRACK:129) and now also
the level on a session. The brief fixed `access: "user" | "admin"`, so this stays; the schema
descriptions should say which is which.

Id spaces: hosts, objects and resources share one (CORE:918-919). `techniques`, `helpdesks`,
`logSources` and `policies` are each their own map and are never used as a `where` or a target of
a network route, so they need not join. Two ids do cross: a `hash_file` content `id` is also the
held item id a proof names (CRACK:112, :131), so it must be unique among items; and LOG's
`where: { kind: "host", id }` must accept both a `hosts` key and a sign-in object id.

### 2.6 Routes

| Route | Plan | Params | Lock |
|---|---|---|---|
| `POST /network/scan`, `/check`, `/confirm`, `/technique` | CORE:454-457 | `foothold`, `network_id` or `host_id`, `service`, `finding_id`, `item_id` | yes |
| `POST /harvest_credentials` | PRIV:215 | `pc_id` | not stated |
| `POST /crack` | CRACK:170 | `hashId`, `candidate` | not stated |
| `GET /mfa/device`, `GET /mfa/phone`, `POST /mfa/verify`, `/mfa/prompt`, `/mfa/approve`, `POST /helpdesk/request` | MFA:368-373 | `item_id`, `npc_id`, `pc_id`, `code`, `number`, `deny`, `desk_id`, `username`, `what`, `answers` | writers yes |
| `GET /log_rows` | LOG:290 | `object_id`, `rev` | no |

No two plans claim one route name. Thirteen routes join the `set_game` and `with_game_lock`
lists in `games_controller.rb`, which LOG:473-475 already names as the place every merge meets.
Style differences are m4 to m6. Status codes agree where stated (404 unknown, 403 out of reach,
422 player-caused), except PRIV's 400 for a missing parameter and LOG's 400 for a bad one, which
is fine if both keep it.

### 2.7 Shared files, merged

| File | CORE | PRIV | SKIN | CRACK | MFA | LOG |
|---|---|---|---|---|---|---|
| `game.rb` `ACCESS_STATE_DEFAULTS` | 3 keys | 1 key | | 1 to 2 keys | 3 keys (flat, ruling H) | none |
| `game.rb` `start_login_session!` | keywords `access`, `technique` | reads only (ruling B) | | | called from `/mfa/*` | `signin.ok` call |
| `game.rb` `attempt_login!` | | step 4 sub-check, lockout key | | | step 3 `effective_password`, step 5 | |
| `game.rb` lockout methods | | key helper | | | uses helper | `signin.fail`, `account.lockout` calls |
| `game.rb` desktop contents, profiles | | admin branch | | | | |
| `network_access.rb` | `network_rows`, `host_reachable_through?`, `desktop_request_allowed?`, withheld lists | USB bypass, withheld object fields | | | | withheld key, L3 calls |
| `credential_model.rb` | `PROOF_KINDS` | | | `KINDS`, `PROOF_KINDS` | `KINDS` flag | |
| `credential_keyring.rb` | proof `technique` | implicit entry | | implicit entry, proof `harvested` | implicit entry | |
| `credential_login.rb` | | account-kind check (to state) | | | second step | |
| `games_controller.rb`, `routes.rb` | 4 routes | 1 | none | 1 | 6 | 1, plus badge rows in `unlock` |
| `ops_log.rb` `EVENTS` | adds | adds | | none | adds | owns |
| `scenario-schema.json` | yes | yes | yes | yes | yes | yes |
| validator | own file | `validate_scenario.rb` | hook plus warnings | `validate_scenario.rb` | own file | `validate_scenario.rb` |
| `generate_dungeon_graph.rb`, `access_identities.rb` | weakness and card nodes | admin and harvest edges, `reach` | no change | hash edges | (section 9, not read) | (section 9, not read) |
| `network-view-minigame.js` | controls, panel | | split (K1) | | | |
| view-model module | `ops-model.js` | | `network-view-model.js` | | | |
| `api-client.js` | 4 calls | harvest call | | crack call | `mfa-client.js` | `logRows` |
| `pc-sessions.js`, sign-in screen | | `access` label | | | `mfaRequired`, code pane | |
| `npc_habits.rb`, `validate_npc_habits.rb` | | | | reads | one habit | |
| `minigames/index.js`, starters | | | | one scene | two scenes | |
| JS harness copy lists | 1 module | any new module | 6 modules | scene and model | 3 modules | none |
| `README_scenario_design.md`, `ACCESS_AND_NETWORKS.md` | N13-15 | A18-20 | N16 | A21 | A22-23 | A24 |

### 2.8 Build order that avoids rework

1. **L1** (`ops_log.rb`, the helper, the sign-in and badge rows). Everyone calls the helper, so
   building it first removes the stubs PRIV:417-418 assumes. It is small and touches the sign-in
   methods before three other plans do.
2. **K1** (the scene split), if the user allows the table (M1). It moves every control in
   `network-view-minigame.js`, so doing it before S1 means CORE's controls are written once.
3. **S1, S2, S3.** S3 adds the `start_login_session!` keywords and emits `access`.
4. **S5a** (reads `access`; `session_access`), then **S5c** (the `attempt_login!` sub-check and
   the lockout key helper).
5. **M1 to M4.** They insert into the lines S5c has just changed and use its key helper. If MFA
   must land before S5c, MFA creates the helper with today's key.
6. **S5b** (harvest), then **S7** (needs `harvestedAccounts` for the `harvested` proof and S3 for
   the `technique` proof; the share source needs neither, so S7 step 1 and the share path can
   start any time after L1).
7. **H1, H2**, **K2 to K4** (K3 needs S1 to S3; K4's parity run needs their scenarios), **L2,
   L3**.

Per file, the single-writer points to agree before step 3: `games_controller.rb` action lists
(one line per route, rebase before each landing), `ACCESS_STATE_DEFAULTS`, `KINDS` and
`PROOF_KINDS`, `OpsLog::EVENTS`, the schema's top-level `properties`, and the harness copy lists.

### 2.9 Feature test scenarios

| Overlap | Plans | Ruling |
|---|---|---|
| The step up to admin | CORE's `test_ops_access` (it owns the mechanism) and PRIV:357-362 ("a local weakness and an escalation card to admin") | `test_ops_access` proves the record is replaced with `access: "admin"`; `test_ops_privilege` uses the same shape to reach admin and proves what admin allows |
| PRIV:93-94 "the feature scenario seeds an admin session directly" until S3 lands | PRIV, and the standing rule against editing game rows | With S3 built first (2.8) this is not needed; remove it |
| Harvest, then reuse a credential on a second PC | PRIV:362-363 and CRACK:285-292 ("an admin dump", "the recovered password then signs in at a PC (ties to S5c)") | Cleartext harvest stays in `test_ops_privilege`; the harvested hash and its crack go in `test_ops_crack` |
| Scan, check, confirm, use | `test_ops_scan`, `test_ops_findings`, `test_ops_access` and `test_ops_skin` beats T2 to T6 (SKIN:490-494), plus the parity run on all four (SKIN:108) | `test_ops_skin` copies a small part of the core scenarios with the same ids (n2); CORE must not rename ids in its three scenarios without telling SKIN |
| A row assertion and a `logSources` block in every `test_ops_*` | LOG:565-568; no other plan has it | Each plan adds one source and one row assertion in the stage that adds its events |
| Technique session against MFA and account kind; domain lockout against a wrong code; harvested password against the second step | nobody | M11, and one beat in `test_ops_mfa` for the last two once S5c exists |

---

## 3. Open questions for the user, merged

Marks: **[R]** a ruling in part 1 settles it unless the user objects; **[DIFF]** two plans answer
it differently; **[NEW]** raised by this review, in no plan.

### 3.1 Questions several plans share

1. **Game time and clocks. [DIFF]** CORE q6, PRIV q5, CRACK q2 all recommend "no time cost, no
   server clock". MFA q1 recommends server wall-clock time for codes (a new code every 60 real
   seconds). LOG q4 uses the client-reported game time already stored in
   `player_state['scenarioClock']` to stamp rows. So three notions of time are in play: none,
   wall time, and the client's game clock. One answer is needed: is the client-reported game
   clock good enough for display only (LOG), and is wall time acceptable for MFA codes in a game
   that is otherwise deterministic?
2. **Noise, detection and NPC reactions.** CORE q4 (does a wrong card cost anything), PRIV q5
   (does a harvest or escalation risk detection), MFA q5 (does a careful owner react to being
   pestered), MFA q9 (does the owner react to a reset), LOG q6 (rows from NPCs). All recommend
   "not now; log it and leave reactions to the parked defence work". One yes covers all five.
3. **Build order. [R, if M1 is allowed]** SKIN q8: K1 before S1. Section 2.8 gives the full
   order.

### 3.2 New questions from the seams

4. **[NEW] Is the network view's client-side moves table allowed under decision 1?** (M1.)
   Options: (a) yes, as a control table for that one screen, renamed and with no registration by
   other plans; (b) no table: two renderers each wired to the same handlers. Recommend (a).
5. **[NEW] Can a password sign-in be admin?** (M4.) Options: (a) no, only a technique grants
   admin, as PRIV has it; (b) an account can be marked an administrator, on the account or per
   PC, and signing in as it gives an admin session. Recommend (b): without it the shared local
   admin lesson stops after one hop.
6. **[NEW] Do scans and technique uses show up in in-world logs?** (B2.) LOG hopes a noisy scan
   being seen is a lesson; CORE writes these rows once only. Options: (a) rows on every scan and
   every use, readable at a log reader that takes the `scan` family; (b) first time only; (c)
   none in play, kept for the debrief. Recommend (a) for sweeps and uses, (b) for the rest.
7. **[NEW] A harvest gives a password or a hash?** Ruling F makes it the author's choice per
   account (a `hash` entry with a `harvested` proof turns that account's harvest into a hash).
   The user may prefer one fixed rule. **[R]**

### 3.3 Core (S1 to S3)

8. Where a host with no sign-in is declared (q1). Recommend the top-level `hosts` map. No other
   plan depends on the alternative.
9. Is discovery enforced or display only (q2). Recommend enforced. MFA and PRIV already place
   their checks after it.
10. What a technique card is (q3). Recommend a tray item. SKIN and PRIV both assume it.
11. Does a technique session ignore `remote: "blocked"` and lockouts (q5). Recommend yes. MFA
    already assumes a technique session meets no second step, so "honour both" would need MFA
    to change. **[R]** in the sense that the other plans are written to (a).
12. Does a sweep need a tool (q7). Recommend no.
13. Does a technique session count as signed in for proofs and tasks (q8). Recommend yes.
14. Can a technique yield a password, or only a saved connection (q9). **[R]** Ruling E: saved
    connection, plus a hash once S7 lands; nobody builds the password case.
15. A sign-in replaces a technique session (q10). Recommend keep the one-slot rule. Bears on
    question 5: with (b) there, a password sign-in as an administrator keeps admin.

### 3.4 Privilege and accounts (S5)

16. How the server learns an account is cached at a PC (q1). Recommend owner plus a
    `cachedAccounts` list.
17. Default account kind when absent (q2). Recommend unscoped.
18. Admin reads every profile automatically, or only marked ones (q3). Recommend automatic.
19. A general per-lockout `scope` field (q4). Recommend no; derive from account kind. M3 must be
    fixed either way.

### 3.5 Realism skin (S6)

20. May a scenario force a skin (q1). Recommend no.
21. An event organiser's setting (q2). Recommend not now.
22. How close to real tools (q3). Recommend invented names, real-looking tables.
23. One line per move, or a staged console (q4). Recommend one line first.
24. Names and default: "Panels / Terminal", default Panels (q5).
25. Quick commands visible by default (q6). Recommend visible.
26. Scope: the network view only (q7). Recommend yes.

### 3.6 Cracking (S7)

27. Hash record as the reserved keyring kind, or a separate map (q1). **[R]** Brief section 5,
    CORE, PRIV and MFA all assume the keyring kind.
28. Should a failed guessable run show a count of missing facts (q3). Recommend yes.
29. A strong hash: silent dead end or an explicit "infeasible" after a few runs (q4). Recommend
    explicit.

(CRACK q2, salt as runs or minutes, is in question 1.)

### 3.7 MFA and helpdesk (S8)

30. Does a wrong code count towards the account lockout (q2). Recommend yes. Depends on M3 for
    domain accounts.
31. How a careless owner decides: fixed count or seeded chance (q3). Recommend fixed count.
32. Awareness presets for the new habit (q4).
33. Can the player talk an owner into reading out a code (q6). Recommend no for now.
34. Borrowing: does the owner notice, can the player give it back (q7). Recommend no engine rule.
35. After a helpdesk reset, does the old password stop working (q8). Recommend yes. See m10 for
    what a later harvest or crack then yields.
36. Re-enrolment target: the player's own phone with no item (q10). Recommend the simpler rule.
37. Is S8b worth a typed form (q11). Recommend yes.

(MFA q1 is in question 1; q5 and q9 are in question 2.)

### 3.8 Log rows (S9)

38. A copied card in the door log (q1). Recommend hidden unless the source opts in.
39. Where rows are kept: `player_state` or a table (q2). Recommend `player_state`; see the save
    size note in 2.4.
40. Refused badge swipes logged (q3). Recommend yes.
41. Reading a log remotely through a session on a host (q5). Recommend later, after S1.
42. Server-side check of an investigator's flagged row (q7). Recommend not in A24.

(LOG q4 is in question 1; q6 is in question 2.)

Of the 45 questions the six plans list, 10 fold into questions 1 to 3 and 35 stay single. With
the 4 new ones that makes 42 here. Five carry **[R]** (3, 7, 11, 14, 27), so 37 need the user,
most with a recommendation no other plan disputes. One is answered differently by different
plans (question 1).
