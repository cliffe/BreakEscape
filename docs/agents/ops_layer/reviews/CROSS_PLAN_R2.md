# Ops layer plans: cross-plan review, round 2

Status: PARTIAL. Stopped at the context limit. Plans read at HEAD `1b085176c`. What was checked
and what was not is listed at the end.

Short names: CORE, PRIV, SKIN, MFA, LOG, LOCK, CRACK. `LOG:744` means `OPS_LOG_ROWS_PLAN.md`
line 744.

Counts: 0 blockers, 1 major, 6 minors, 4 nits.

---

## 1. Findings

### Major

**X1. LOCK passes `save_limit: true` on every `mfa_*` call; the log contract makes that call
malformed.** LOCK should change.
LOCK:626-628 ("Every call passes `save_limit: true` (limits are registered per result in the log
plan's `EVENTS`), never a number and never `once:`").
Against:
- LOG:756 and LOG:818-819: `save_limit: true` is malformed when the result has no registered
  limit, and a malformed call raises in test and development (LOG:855-858).
- LOG:1097-1104 (13.7) registers no `save_limit` for any of the eight `mfa_*` events, and
  LOG:1108-1114 (the S8c note) adds only `places` and the `method` detail.
- LOG:950-955 (13.3): a branch that already saves passes `save_limit: false`. Every row in LOCK's
  own table (LOCK:615-622) names a save the branch already makes ("the save that stores the
  record", "the save that sets `passed`", "the save that drops the record").
- MFA:279 and MFA:1082-1089: the row is written by the shared `MfaAccess` functions with no
  limit. Because LOCK calls those same functions (LOCK:602-604), a per-subject flag would also
  have to be added to the functions, which LOCK request 1 says it does not change.

Fix: LOCK says every `mfa_*` call for a lock uses the default `save_limit: false`, because each
branch has its own save. If a lock branch exists whose only save is the row's, LOCK names it and
asks LOG to register a limit for that event and result.

### Minors

**X2. Badge row at a gated rfid lock: LOCK asks, LOG is silent.** LOG should change.
LOCK:628-630 and request 5 (LOCK:654-655): at an rfid lock with a second step, `badge_swipe` is
written by the final post only; the first right card writes `mfa_challenge` and no badge row.
LOG's `badge_swipe` ok row (LOG:1131) fires on "`#unlock`, rfid lock in force, target not open,
`validate_unlock` passed", which also holds on the first post at a gated lock. LOG request 6
(LOG:1190-1193) answers LOCK's other points and not this one. Fix: LOG's "When" for `badge_swipe`
ok adds "and the lock's second step, if any, has passed".

**X3. LOCK request 1 point 8 is unanswered by MFA.** MFA should change, or LOCK owns the edit.
LOCK:642-643 asks that the challenge function can answer again from a live record with no write.
MFA's request 11 (MFA:1131-1144) lists what it builds for the lock plan and does not include it;
grep of MFA for "live record" or "no write" finds nothing. Fix: MFA adds it to the subject rules
table (MFA:290-298), or LOCK states it adds that branch in its own stage.

**X4. LOCK request 7 is unanswered by CORE and PRIV.** CORE and PRIV should each add one line.
LOCK:658-661: a plan that opens an object by its own route uses `record_step_open!` and
`step_object_open?`, or the validator refuses `secondStep` on that object. Neither CORE nor PRIV
mentions either name or `secondStep` (grep, no hits). PRIV's `POST /harvest_credentials`
(PRIV:524-547) and CORE's `POST /network/technique` both act on a sign-in PC. Fix: each says
whether its route opens a lockable object; if a sign-in PC can carry `secondStep`, the route uses
the two functions; if not, LOCK's validator says so and the two plans say nothing more.

**X5. Refusal style (R1 m5) is still three styles.** PRIV and MFA should change or record a
decline.
CORE:955-958: every ops refusal is a `reason` code, including 400 `bad_request`. PRIV:531-546:
`400 Missing pc_id`, `{ error: "PC not reachable" }`, `{ error: "Sign in required", locked: true }`,
`{ error: "Administrator access required", notAdmin: true }`. MFA:712-713: `codeLocked: true,
retryIn` and "generic 422"; MFA:357-358 uses `typeToSignIn: <reason>` (a code, which fits). No
DECISIONS file records declining R1 m5. Fix: PRIV answers `{ success: false, reason: "not_admin" |
"locked" | "not_reachable" | "bad_request" }` (403 and 404 bodies may stay as the desktop's, since
they mirror it on purpose; say so); MFA either moves its booleans to `reason` codes or records in
its DECISIONS file that it keeps the `/login` boolean style because its routes extend sign-in.

**X6. Secret source for hash values has two or three owners.** LOG should state one.
LOG:832 ("hashes in S5b"); PRIV:892 (S5b registers the hash values a collect yields); LOG:1194-1195
(asks S7 to register any hash or cracked value it stores). LOG:827 says L1a already registers
"credential values", and a hash is a `credentials` entry of kind `hash` (CRACK's kind, built after
S5 in the outline's order). So the value may already be covered by L1a, and S5b runs before the
`hash` kind exists. Fix: LOG says whether L1a's credential source covers `hash` entries; if it
does, PRIV and LOG drop the S5b registration and CRACK registers only a cracked value it stores
outside the registry.

**X7. Lockout key sites counted three ways.** PRIV:1008-1009 ("read in six places"), MFA:329-331
(five sites listed), MFA:1017 ("the four lockout key sites"). Not a conflict of design, but the
builder of whichever of M1a and H1 lands first needs the list. Fix: MFA's file table matches its
own list of five; PRIV refers to MFA's list instead of its own count.

### Nits

**X8.** LOCK:653 "its text says seven" is stale: LOG:1108 and LOG:1193 now say eight. LOCK drops
the parenthesis.

**X9.** PRIV:558, PRIV:882 and PRIV:949 say "step 6" of sign-in, but PRIV's own order (PRIV:139-141)
puts `pc_admits_account?` fifth, and MFA:310-319 uses names (Route, Lockout, Password,
Admission, second step, Session). PRIV uses MFA's step names.

**X10.** MFA:318-319 says the session is written "at the access level the account carries".
PRIV request to MFA (PRIV:954-955) asked for "the level is computed by `session_access`; nothing
is written", which CORE:65-70 also states. MFA rewords to say no level is written.

**X11.** MFA:1139 and LOCK:641-642 name four `mfa_*` events emitted by `MfaClient` in the browser.
They share the prefix and some names with the log's `mfa_*` events. CORE:1596-1598 says its client
events are a separate thing that never reach the log; MFA should say the same in one line.

---

## 2. Checked and agreed

**Sign-in order.** PRIV:139-141, MFA:307-322 and `game.rb:3443-3497` agree: route branch (CORE's
discovery condition inside `host_reachable_through?` and `from_route_refusal`, CORE:486-492,
CORE:1621-1622) → lockout on `AccessIdentities.lockout_key` (MFA:324-334) → account and
`effective_password` → `pc_admits_account?` with `account_kind_admits?` (PRIV:399, PRIV:860) →
second step, between `game.rb:3493` and `:3495` (MFA:321) → clear failures, `start_login_session!`.
A technique session meets none of it (CORE:1617-1620, PRIV:424, MFA:347-352). R1 M3 is closed:
PRIV dropped the domain lockout (PRIV:51, PRIV:1008-1015).

**Log rows, CORE, PRIV, MFA.** CORE:1581-1589, PRIV:897-901 and MFA:1080-1091 match LOG 13.7
(LOG:1085-1106) event for event: names snake_case and unique across plans, `as` forms, `where`
kinds (`network`, `host`, `pc`, `desk`), results, details, bounds and saves. `technique_refused`
quiet and `helpdesk_request` blocked are the only `save_limit: true` callers and both have limits
registered (LOG:1092, LOG:1105, CORE:1588, MFA:1099-1102). `approver` replaces `by` (MFA:1087).
`helpdesk_request` takes `as: { typed: }` in normalised form (MFA:1049-1053, MFA:1076-1078,
LOG:766). A step up is one row (CORE:1591, PRIV:893, LOG:1115); `via: 'technique'` writes no
`signin_ok` (CORE:1592, LOG:1133).

**`player_state` keys.** No collisions, nothing synced, every default flat:
CORE `opsDiscovered`, `opsFindings`, `opsUsed`, `opsNoise` (CORE:1040-1045); PRIV `cachedAt`,
`harvestedAccounts`, grow-only, never trimmed, about 9 KB (PRIV:618-629, R1 m7 closed); MFA
`mfaPending`, `mfaPrompts`, `mfaAccounts`, `accountResets`, `helpdeskTries` (MFA:788-794, R1 M7
closed); LOCK `lockSteps` (LOCK:430-432), and lock owners add at most one entry each to
`mfaPrompts` and `mfaAccounts`, which MFA:791-798 already bounds; LOG `opsLog`, `opsLogSeq`,
`opsLogOnce`, `opsLogSaves`, `opsLogClockAt` (LOG:782-933, LOG:997). One size point:
`opsDiscovered.services` can reach about 41 KB (CORE:1042) and `opsLog` 120 KB (LOG:913), both
rewritten on every save of the game; neither is sent.

**Access level.** CORE:62-79 and PRIV:277-303, PRIV:917-931 agree: `access` stored only on a
technique record; `session_access` computes every other level from `creds.admin`; answers carry
`access: "admin"` only. R1 B1, M4 and ruling A, B are closed.

**Skin.** SKIN:10, :102, :122-123, :194, :204 use CORE's `ops-model.js` and `REFUSAL_TEXT`, the
server alias and the `itemId` on techniques; refusal codes counted alike (CORE:955-959,
SKIN:429, SKIN:746-750). R1 M9, M10 and ruling D, G are closed.

**Test scenario names.** The brief (OPS_LAYER_BRIEF.md:105-106) lists `test_ops_lock_step`, so
LOCK request 6's scenario half is met.

---

## 3. CRACK (held, unrevised): to-do, not graded

From R1 and the revised plans, CRACK must still: replace `dumped` with the `harvested` proof on
the sign-in PC id (PRIV:932-948); move `crackRuns` to a server-only key (R1 M6); name its token
and grant marker state with bounds (R1 M8); drop its rows (LOG:1121-1123); register any stored
cracked value as a secret source (LOG:1194-1195, see X6); widen CORE's `grants.credential`
validator rule to `hash` with a test (CORE:1633-1636); use `credential:` not `grants:` on a
`hash_file` content entry (R1 m3) and `hash_id`, `reuse_from` params (R1 m4); add `source:
"cracked"` through `account_password_rows` after capture and harvest (PRIV:944-946); and state
that a cracked password meets the second step (MFA:1118-1120, LOCK:658-659).

---

## 4. Not checked in this round

- R1 M2 (hash sources, beyond PRIV's side), M6 and M8 (CRACK), M11 (technique session on an MFA
  PC: tests owned), M12 (`localAdmin: "unique"` provenance), m2 (`needs` on helpdesks), m6
  (policy and lock per route), m8 (bootstrap additions), m9 (withheld lists; PRIV:862-863 has
  `cachedAccounts` in `WITHHELD_OBJECT_FIELDS`), m10 (stale passwords after reset, partly met at
  PRIV:955-957), m11 (graph session nodes), m12 (validator file placement), m13.
- R1 M1: whether SKIN's control list (SKIN:143, "the private control list and `offers()`") is
  scoped as the ruling asked.
- Shared-file clash detail beyond `attempt_login!`, `start_login_session!` and
  `ACCESS_STATE_DEFAULTS` (for example `games_controller.rb` `unlock`, edited by LOG and LOCK).
- Schema term use (`weakness`, `finding`, `technique`, `foothold`, `access`) and feature ids
  N13-N16, A18-A25 across plans.
- SKIN sections 13 and 14 in full; CORE request 6 against SKIN's K1 split.
- Build-order dependencies other than LOCK's (LOCK:584 is consistent with the outline).

---

## 5. Part 2

Covers section 4's list. LOCK read at HEAD (`git show HEAD:...`), line numbers from that.
Part 2 counts: 0 blockers, 1 major, 11 minors, 2 nits (X13 to X26). Running total with part 1:
0 blockers, 2 majors, 17 minors, 6 nits.

### 5.1 R1 items not checked in part 1

| R1 item | Status | Evidence |
|---|---|---|
| M1 (skin move table) | Closed | SKIN:17-21: the control list and offers are "private to the network-view folder", nothing outside reads them, the server never sees them, "no other feature registers with it". Renamed `CONTROLS` in `view-controls.js` (SKIN:196). |
| M2 (hash sources) | PRIV side closed, CRACK open | PRIV:185-186, 938-943: a `hash` credential with a `harvested` proof on the PC id makes the collect yield the hash. CRACK:112, :131 still has `grants: "dana_hash"` beside `proof` (section 3 to-do). |
| M6 (`crackRuns` synced) | Open, CRACK held | CRACK:228-233 still "synced state ... delta on `sync_state`". In section 3. |
| M8 (CRACK token and marker unnamed) | Open, CRACK held | CRACK:146, :235-238 still unnamed. In section 3. |
| M11 (technique session on MFA PC: tests) | Open | See X26. |
| M12 (`localAdmin: "unique"` provenance) | Closed | No `localAdmin` key in any plan. PRIV:194-195: a shared local administrator is one `local` account with several `localTo` PCs, the hardened setup one per PC; no "taken from" PC. |
| m1 (default `user`) | Closed | Part 1, ruling B. |
| m2 (`needs` two meanings) | Open | X21. |
| m3, m4 (CRACK `grants`, `hashId`) | Open, CRACK held | CRACK:131, :173. |
| m5 (refusal styles) | Open | X5. |
| m6 (policy, set_game, lock) | Open for PRIV | X23. LOG:300-301 and MFA:692-693 state theirs. |
| m7 (`harvestedAccounts` trim) | Closed | PRIV:623 "Neither is trimmed". |
| m8 (bootstrap additions) | Closed | MFA:871: each addition is read or sent only when its field is set; `mfaDeclared` is gone. SKIN:866: `networkView` absent without the field. |
| m9 (withheld lists) | PRIV closed, MFA open | PRIV:585 adds `cachedAccounts` to `WITHHELD_OBJECT_FIELDS`. MFA: X22. |
| m10 (stale passwords after reset) | Conflict between plans | X16. |
| m11 (graph session node) | Open | X19. |
| m12 (validator placement) | Open | X20. |
| m13 (wall-clock codes) | Left to the user | MFA:1159 keeps it as a question. The playtest reads a code through `GET /mfa/device` (MFA:418, :712), not by prediction. |

### 5.2 Findings

### Major

**X13. LOG requires L1b before S3, S5a, S5c and S8; the build order puts "the rest of S9"
after S7.** LOG should change (or the orchestrator reorders).
LOG:99 ("L1b lands before the stages that edit the sign-in methods (S3, S5a, S5c, S8) and before
L2a"), LOG:719 ("L1b lands first") and LOG:1170-1171 (request to the orchestrator). Against
`OPS_LAYER_PLAN_OUTLINE.md:143-145`: L1a, then S1, S2, S3, S5, S6, S8a, S7, "the rest of S9",
S8b, S8c. CORE, PRIV and MFA say only that L1a lands first (PRIV:891, MFA:1058), so none of
them plans around L1b. As written, a builder of S3 meets LOG's rule and the outline's order
in the same week and one of them loses. L1b is not a dependency of any sibling (they call
`write_log_row!`, which L1a ships); it is a second editor of `attempt_login!`,
`start_login_session!` and `#unlock` (LOG:197-199, :719). Fix: LOG says L1b may land at any
point after L1a, and that whichever of L1b and each of S3, S5a, S5c, S8a lands second merges
into the other's edit. LOG also states where `signin_ok` sits relative to MFA's second step
(MFA:321) and CORE's `via: 'technique'` skip (CORE:1592), so L1b is correct whichever order
it lands in.

### Minors

**X14. Stage ids `L1` and `L2` mean two things.** LOCK should change.
LOCK:144, :153, :584 and :594 (stages L1, L2 of the lock plan) against LOG:92-96 (L1a, L1b,
L2a, L2b, L3). LOCK:584 says "the log helper first; then L1; then L2", which a reader takes
for the log's stages. Fix: LOCK renames its stages (for example `K1` and `K2` are SKIN's; use
`T1` and `T2`), and says it needs the log's L1a and, for the badge rows it asks about in X2, L1b.

**X15. MFA puts `EVENTS` in the wrong file.** MFA should change.
MFA:1019 (`app/models/break_escape/ops_log.rb`: "this plan's entries in `OpsLog::EVENTS`")
against LOG:660-662, :718 and CORE:1531, :1563, which put `EVENTS` and `KINDS` in
`lib/break_escape/ops_log_events.rb`. Fix: MFA's shared-file row names `ops_log_events.rb`.

**X16. A reset password: MFA says the collect calls `effective_password`, PRIV says it keeps
`creds.password`.** MFA should change.
MFA:511-512 ("the privilege plan's collect action calls it too") and MFA:1119-1120 ("The collect
action calls `Game#effective_password(npc)` once H1 lands") against PRIV:390-392 ("A harvest row
goes stale after a password reset ... keeps the scenario's password"), PRIV:779 ("a harvest row
keeps `creds.password` after a reset") and PRIV:955-957 (the reply to MFA's request, agreed in
PRIV's test list). PRIV's tests will fail when H1's builder follows MFA. This also settles R1 m10:
the "stale on purpose" side is PRIV's. Fix: MFA drops both sentences and adds harvest to its
"readers keep the authored value on purpose" list (MFA:513-514). A cracked password (CRACK) joins
the same list once CRACK is revised.

**X17. LOG's `session_admitting(scope)` is a second predicate beside two that other plans edit.**
LOG should change.
LOG:1148 ("a new sibling of `session_admits?`") and LOG:711 (L3). PRIV:325-327 adds an admin
branch to `session_admits?` ("It names the admin PC") and CORE:691 adds a line to it; both land
before L3 under the outline's order. Two predicates over the same rule will drift. Fix: LOG
writes `session_admits?` as `!session_admitting(scope).nil?` in L3 (one rule, one place), or states
that `session_admitting` calls the same branches including S5a's admin branch, and adds a test
that the two answer alike over the access model suite.

**X19. Admin session node: CORE draws none, PRIV draws one.** CORE and PRIV should each add one
sentence. (R1 m11, still open.)
CORE:1180-1181 ("Grant of a session: no new node ... from the weakness to `lock_<pcId>`") against
PRIV:698-699 (new node `admin@<pcId>`, "with edges from ... the core plan's step-up weakness").
CORE has no edge to `admin@<pcId>`, so a step up is drawn as reaching `lock_<pcId>` and PRIV's
node has no incoming edge from it. Fix: CORE's table says a weakness whose grant has `access:
admin` ends at `admin@<pcId>` once S5a lands (and at `lock_<pcId>` before); PRIV says the same.

**X20. Validator check files: three patterns.** The orchestrator rules; MFA and PRIV or LOG
follow. (R1 m12, still open.)
CORE:1104-1106 (`scripts/validate_network_ops.rb`, called from `validate_scenario.rb`), SKIN:989
(uses CORE's), MFA:822 and :1010 (`scripts/validate_mfa.rb`, called from `validate_scenario.rb`),
PRIV:651 (inside `validate_scenario.rb`, `check_access_model`), LOG:419 and :672 (inside
`validate_scenario.rb`). CORE's own reason (an 800-line function, CORE:1106) applies to PRIV and
LOG too. Fix: one rule in the brief, a check file per feature hooked by one line (CORE:1545),
and PRIV and LOG follow it, or each records why not.

**X21. `needs` still means a map on a weakness and an integer on a helpdesk.** MFA should
change. (R1 m2, still open.)
CORE:38-41, :1127 (`needs` map on a weakness, `needs.session`) against MFA:190, :206 (`needs: 2`
on `helpdesks.<id>`). Fix: MFA renames its field `minCorrect` and updates MFA:748 and its
validator and schema entries.

**X22. MFA does not say how `helpdesks` leaves the bootstrap.** MFA should change. (R1 m9.)
MFA:748 and :816 mark `helpdesks` `x-serverOnly` with `x-servedBy: "bootstrap helpdeskForms"`.
CORE:178 and CORE:197 say there is no generic filter: `x-serverOnly` is a marker that
`payload_scan.rb` reads, and withholding is the named lists (`WITHHELD_SCENARIO_KEYS`,
`network_access.rb:18`). Fix: MFA adds `helpdesks` to `WITHHELD_SCENARIO_KEYS` in its file table
(MFA:1010-1030), with the hostile-input scan as its test.

**X23. PRIV's `POST /harvest_credentials` does not name its policy method or `set_game` entry.**
PRIV should change. (R1 m6.)
PRIV:524-531 names the route, params and the game lock; its file list (PRIV:846-875) has
`games_controller.rb` and `config/routes.rb` but not `game_policy.rb`, `DEVICE_ACTIONS` or the
`set_game` list, which CORE:1528-1530 and MFA:692-693 list. Without them the route is
unauthorised or has no game. Fix: PRIV adds both lines.

**X24. Three mechanisms for "an unchanged scenario answers as before".** The orchestrator
rules; PRIV and MFA follow. 
CORE:1225-1233 (JSON fixtures from main, `test/fixtures/files/ops_unchanged/`), MFA:878-882
(goldens captured on the base commit), PRIV:721-735 and :959-960 (`bin/ops-golden-compare`,
"one golden helper for every ops plan", landing in S5a, after CORE's S1 to S3 have shipped their
own). LOG, LOCK (LOCK:274, :503, :526) and SKIN (SKIN:637) each add a fourth way. Fix: PRIV's
helper adopts CORE's fixture folder for scenarios that declare `networks`, and the others name
whether they use it; or the brief picks one.

**X26. No plan owns the test for a technique session on an MFA PC. (R1 M11, still open.)**
MFA and CORE should change.
MFA:1116-1117 and CORE:1617-1620 state the rule (a technique session meets no second step; a
password or saved connection a card yields does). MFA's M1a proof (MFA:126) tests "a saved
connection to that PC is refused" but names no technique case, and CORE's S3 tests (CORE:1504)
name no MFA PC. Fix: MFA adds two controller tests once S3 exists: a technique session on a
`code` PC opens with no pending record; a saved connection granted by a technique, signed in
at that PC, answers `mfaRequired`. CORE's request 3 names them.

### Nits

**X18.** LOG:720 says S5a edits `GamesController#container`; PRIV's file list (PRIV:846-875) has
no such edit (its admin branches are in `game.rb`). LOG drops the clause.

**X25.** PRIV:880-881 ("Whichever of S5a and S3 lands first adds the answer parameter") is
settled by the build order: S3 is first, and CORE:1534 adds the parameter. PRIV says so.

### 5.3 Checked and agreed

**Neutral terms.** `weakness`, `finding`, `technique`, `foothold` and `fixedIf` are used alike
in CORE, PRIV, SKIN, MFA, LOG and LOCK. `fixedIf` appears only in CORE (28 uses) and in its graph
label; no plan writes `vulnerability` or `fixed_if`; `exploit` appears once, as a prohibition
(CORE:330). `access: "user"|"admin"` is used as the brief says (CORE:62-79, PRIV:277-303). PRIV
speaks of "a weakness with `needs: { "session": "user" }`" (PRIV:206), the same shape as CORE's.

**Feature ids and scenario names.** N13 to N15 (CORE:4, :210-212), N16 (SKIN:1), A18 to A20
(PRIV:3-4), A22 and A23 (MFA:3), A24 (LOG:1), A25 (LOCK:1, :705) match brief section 4. Every
`test_ops_*` name the plans use is on the brief's list (section 5); `test_ops_helpdesk` appears
once, as a decision not to make it (MFA:1129).

**SKIN sections 13 and 14.** Section 13 (no row, no event) is right: the seven rows it names
match CORE:1583-1589 and LOG:1087-1093, and `log_rows_for(source_id, compare: true)` exists
(LOG:244-245). Section 14 request 1 is met by LOG:1121 and LOG:1198. CORE request 6
(CORE:1623-1630) and SKIN K1 agree: CORE builds `perform` and the pending guard, SKIN reads the
pending set and `pendingKey` (SKIN:143, :976). SKIN's K1 starts after S3 (SKIN:970), which the
outline allows. Request 2 ("beats name actions") is a request to every plan; no other plan
answers it, which is harmless.

**Shared files, order.** `games_controller.rb` `set_game` and `with_game_lock` lists, `routes.rb`,
`game_policy.rb`, the schema and `validate_scenario.rb` are acknowledged as append-only
conflicts by CORE:1521-1547, LOG:716-724, MFA:1012-1028 and LOCK:594-601; none depends on an
order the build order forbids. `credential_keyring.rb`: PRIV's `account_password_row` builder
(S5b) comes first and MFA's `<npcId>.reset` beside it (S8b) is stated in both (PRIV:386-388,
MFA:514-515). `game.rb` sign-in methods: CORE (S3), PRIV (S5), MFA (S8a), LOG (L1b) and LOCK
(S8c) all edit them; the order is only a problem for L1b (X13). LOCK's `unlock` gate sits after
LOG's L1b rows under the outline (S9 before S8c), as LOCK:584 assumes.
