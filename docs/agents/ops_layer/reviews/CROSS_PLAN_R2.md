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
