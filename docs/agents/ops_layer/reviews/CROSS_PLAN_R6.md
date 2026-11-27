# Ops layer plans: cross-plan review, round 6

Scope: the seven plans at `47818a732` (`git log 185becfb7..HEAD -- docs/achitechture/`, 24
commits), joins between plans only. Short names: CORE, PRIV, LOCK, SKIN, MFA, LOG, CRACK,
OUTLINE. `MFA:951` means `docs/achitechture/OPS_MFA_HELPDESK_PLAN.md` line 951.

Counts: 0 blockers, 1 major, 8 minors, 10 nits.

## Checked and clean

- **R5 leftovers.** F3 (CORE:1549, first sweep passes no limit), F7 (CORE:1559, "device still
  held; the reason is the privilege plan's test"), F2 (CRACK:796-804 "None"; LOG:1158-1160,
  :1238; PRIV:1258-1259) are applied.
- **`FORGEABLE_ITEM_FIELDS`.** LOCK G3 appends `secondStep` (LOCK:762, :1157), CRACK C2 appends
  `revealsFacts` (CRACK:348, :756, :773, :842); both say additive. CORE adds nothing and needs
  nothing, since `technique_card` is read from the authored definition (CORE:342-344, :646). The
  table row is wrong in LOCK only (see m8).
- **Keyring proof kinds.** CORE S3 adds `technique_card` (CORE:218, :723, :1331), PRIV S5b adds
  `harvested` (PRIV:576-582, :1188, :1211); CRACK uses both and adds none (CRACK:160, :198-200).
  No other plan adds one. MFA's `<npcId>.reset` and CRACK's `<npcId>.cracked` are implicit entries
  with distinct ids.
- **`keyring_rev` members.** Only CRACK changes the digest (`crackFacts`, present only with a hash
  row, CRACK:420-429). PRIV and MFA ride the existing digest (PRIV:860-861, MFA:816). See m3 for
  the one reader outside `keyring_for_client`.
- **`cli` schema ownership.** CORE copies `cli` by named keys from S1/S2 and leaves the schema rows
  to SKIN K3 (CORE:218 S1 row, CORE:1333-1346, :1852); SKIN K3 declares them (SKIN:189, :1512,
  :1520). Until K3 the closed blocks refuse `cli` (CORE early-write table, SKIN:1569-1570).
- **`technique` / `technique_card`.** No `se_technique` anywhere. `technique_card` is the item
  field and proof kind in CORE, CRACK; `technique` stays the pretext key and the log detail key
  (LOG:1094, :1129-1130; CORE:1921-1922), which CORE request 13 calls out.
- **`write_log_row!` callers.** CORE, PRIV, MFA, LOCK and LOG write rows; CRACK and SKIN write
  none and say so (CRACK:796-804, SKIN:1531-1538, LOG:1158-1160).
- **player_state keys.** Seventeen new keys, no name used twice: CORE `opsDiscovered`,
  `opsFindings`, `opsUsed`; PRIV `cachedAt`, `harvestedAccounts`; LOCK `lockSteps`,
  `npcStepGrants`; MFA `mfaPending`, `mfaPrompts`, `mfaAccounts`, `accountResets`, `helpdeskTries`;
  CRACK `earnedFacts`, `crackRuns`, `crackStarted`, `crackedAccounts`; LOG `opsLog*` (outside
  `ACCESS_STATE_DEFAULTS`). All server-only, bounded, never in a sync body. LOCK's owners reuse
  MFA's `mfaPrompts`/`mfaAccounts` at one entry per owner, and both plans say so (LOCK:827-828,
  MFA:814-815, :821-823).
- **Stage order.** No stage reads code from a later one: S5b after S7 in PRIV:181-184,
  CRACK:150-152 and OUTLINE:145-147; SKIN K1-K2 use CORE's `perform`, `onSent` and `onEnded` from
  S1 (CORE:216, SKIN:186-187, :1555-1572); LOCK G1 needs only S8a (MFA:145, :1157-1170;
  OUTLINE:148), and the "re-enrolment ignored" subject rule it relies on is built in S8a, so S8b
  is not a dependency; LOG L1b's refused branch is edited by G1 later (LOG:238); L2a, L2b and L3
  after S5c (LOG:100); CRACK C1's technique-granted hash needs S3 only.
- **Open questions.** CORE, PRIV and MFA have none open. LOCK Q1 (a), CRACK Q1 (a) and Q2 (a),
  LOG Q1 (d), Q2 (a), Q3 (a), Q4 and SKIN Q(b) option 1 are each written to their recommendation.
  None contradicts another: LOG Q3's "a hash file on a share still leaves a trace" matches CRACK
  section 13; LOG Q2 (a) and MFA's "NPCs do not react" both leave NPC reactions to the defence work;
  SKIN Q(a) keeps CORE's invented `product` under either option.

## Findings

### Major

**M1. A saved connection at an MFA PC: CORE and one MFA test row say `mfaRequired`, MFA's rule
refuses it.** CORE and MFA change.
- CORE:1972-1975 (request 4): "a saved connection granted by a technique, signed in at that PC,
  answers `mfaRequired`". MFA took the words as a test row: MFA:951.
- MFA's own rule (MFA:364-374) refuses every `saved_connection` at a PC where `mfa_step_for` is
  not `none` with 422 `{ success: false, typeToSignIn: "second_step" }`, no session, no pending
  record. MFA:953 (`mfa_keyring_test.rb`), MFA:1007 (beat F15) and M1a's done-when (MFA:126)
  assert that refusal.
- A technique-granted saved connection is a `saved_connection` like any other, so MFA:951 and
  MFA:953 cannot both pass. Under any reading, "signed in at that PC" by the saved connection
  gives the refusal, not `mfaRequired`.
- Fix: CORE:1974-1975 and MFA:951 read "a saved connection granted by a technique, used at that PC,
  answers 422 `typeToSignIn: "second_step"` with no session and no pending record; typing the same
  account's password then answers `mfaRequired`". MFA:1142-1143 (request 5) already says the
  password a card yields meets the step, so it needs no change.

### Minor

**m1. The scope of `ops_refusal_codes.json` is not settled: CRACK adds its codes, PRIV does not.**
CORE decides the scope; then PRIV or CRACK, and SKIN, change.
- CORE:1181-1187: "The ops routes send twelve ... the controller tests assert that no ops answer
  carries a code outside it". CORE:1841 lets later plans add codes.
- CRACK:493-498 and :835-838 add `no_recipe` and `fact_not_held` (for `POST /crack`, a scene
  outside the network view) and say the count becomes fourteen.
- PRIV:739-743 says the collect route "follows the ops convention" with `not_admin`, `locked`,
  `not_reachable`, `bad_request`, but adds none of them to the file or to `REFUSAL_TEXT`, and gives
  the collect panel no other table of words. If CORE's assertion covers every ops route, PRIV's
  collect tests break it; if it covers only the network routes, CRACK's two codes don't belong
  there.
- SKIN:630 ("for the twelve codes"), :1183 and :1278 ("twelve today") are true only until S7.
- Fix (recommended): the file holds every code an ops route sends in a `reason`. CORE:1181 says
  "twelve from the network routes; S7 adds two and S5b three"; PRIV S5b adds `not_admin`, `locked`
  and `not_reachable` to the file and to `REFUSAL_TEXT` and has the collect panel read
  `REFUSAL_TEXT`; SKIN's three places say "each code in the file". (Alternative: the file is the
  network view's list only, and CRACK keeps its two codes in its own scene table.)

**m2. CRACK's `password_held_for?` counts MFA's reset entry.** CRACK changes, and MFA notes it.
- CRACK:360-366: true when "the keyring lists a `password` entry for the account from any other
  source", naming capture and registry entries. MFA:532 adds an implicit `<npcId>.reset` entry of
  kind `password` at S8b, after S7.
- Under the CRACK text as written, a reset makes the hash row read `cracked` and the crack route
  answer `cracked` (CRACK:479), though the player never learnt the old password. It also makes a
  `reused` crack hit (CRACK:382-383) on another account whose password equals the reset account's
  *old* `creds.password`, which the player does not hold.
- Fix (CRACK:362-364): name the sources exactly, `crackedAccounts`, a capture entry and a
  registry `password` entry whose proof holds, and say the MFA plan's `<npcId>.reset` entry does
  not count (it holds the new password, not the one the hash was made from). Add a test row at
  S8b time in CRACK section 11 or MFA section 11.

**m3. PRIV's collect answer carries `keyringRev` with no rule for computing it, and CRACK has
changed the digest.** PRIV changes.
- PRIV:770-776 puts `keyringRev` in every collect success answer; nothing in the code sends it
  today (`keyring_rev` is called only inside `keyring_for_client`,
  `credential_keyring.rb:84`).
- CRACK:420-424 makes the digest `[digested, captures, crackFacts]` when a hash row is listed,
  which is always so after a collect. A collect that called `keyring_rev(entries, captures)`
  directly would send a rev that never equals `GET /keyring`'s.
- Fix (PRIV:776): "`keyringRev` is `keyring_for_client(...)[:rev]`, the one builder, so it
  includes the cracking plan's `crackFacts` member", with a test that it equals the next
  `GET /keyring` rev.

**m4. MFA still says the collect yields a password.** MFA changes (part of PRIV's request to MFA
not yet taken).
- MFA:529-531: "the privilege plan's harvest collect (`creds.password`) are out of date ... A
  collect after a reset therefore yields the old password". MFA:1144-1146 (request 6): "The
  collect action keeps reading `creds.password` after a reset".
- PRIV:1306-1307 and PRIV:1342-1345 (request to MFA): the collect never yields a password; the
  password comes only through CRACK's grant, which reads `creds.password` (CRACK:408-411).
- Fix (MFA:529-531 and :1144-1146): "the cracking plan's crack of a collected hash reads
  `creds.password`, so a crack after a reset yields the old password, which no longer signs in".

**m5. PRIV's text mixes the habit enum and the recipe classes.** PRIV changes.
- They are two lists. The habit enum is `strong guessable reused` (`npc_habits.rb:24`,
  CRACK:91-92). The recipe class enum is that plus `common` (CRACK:204-207, schema at CRACK:608).
  CRACK Q2 recommends (a), recipe only, and CRACK:207 is written to it.
- PRIV:279-281: "carries its own crack recipe, `crack`, with the habit's class key, `password`
  (`strong`, `guessable`, `reused` or `common`; ...)". This reads as if `common` were a habit
  value. The meaning is right (the record's class key); the attribution is wrong.
- Fix (PRIV:279-280): "with the recipe's class, `password` (the cracking plan's classes: the
  habit's `strong`, `guessable`, `reused`, plus `common`, which only a recipe takes)".

**m6. PRIV keeps a validator rule on `crack` that duplicates CRACK's and differs from it.** PRIV
changes.
- PRIV:888-891: an account with no `habits.password` "needs `crack` on its hash record, else
  error". PRIV:281-283 and CRACK request 1 (CRACK:822-824) say CRACK owns every rule on `crack`
  and PRIV adds none.
- CRACK:556-557 already errors when the class does not resolve, and tests `crack.password`, not
  `crack`. A record with `crack: { facts: [...] }` and no habit passes PRIV and fails CRACK; a
  record with no `crack` gets two errors for one fault.
- Fix: drop the PRIV:888-891 sentence; PRIV:892 points to CRACK's "class resolves" rule.

**m7. Nobody passes the `kind` detail on `signin_refused`.** PRIV changes.
- LOG:1154 and :1173: `signin_refused` gets an optional `kind` (`local`, `domain`) registered in
  S5c. PRIV:1266-1268: "this plan writes none, and S5c registers that row's optional `kind`
  detail".
- The `signin_refused` call is L1b's (LOG:213), and registering a detail does not fill it. No
  build step says that S5c's account-kind refusal passes `detail: { 'kind' => ... }` at that
  call, or how a kind mismatch is told from an ACL refusal at that point.
- Fix (PRIV section 12 and section 11): S5c adds `kind` to L1b's `signin_refused` call when
  `account_kind_admits?` is what refused, with a row test for each kind and one for an ACL refusal
  carrying no `kind`.

**m8. The shared-file tables disagree on who edits what.** LOCK, PRIV, MFA change.
- LOCK:1166: `item_identity.rb` "none in the ops plans". CRACK C2 edits the same constant
  (CRACK:773-774). Fix: "the cracking plan (C2, `revealsFacts`)".
- LOCK:1162, `games_controller.rb` "MFA plan, log plan". LOG:758 says `#container` is edited by
  PRIV S5a, L3 and LOCK, and every plan touches the `set_game` and `with_game_lock` lists
  (CORE:1830). Fix: add the privilege plan (`#container` profile branch, the collect action),
  the core and cracking plans (action lists).
- PRIV:1203-1205 edits `#container`, but its "Shared with other ops plans" list (PRIV:1218-1240)
  does not name it. Fix: add "`#container`: the log plan's L3 (`share_folder_opened`) and the lock
  plan (Rules C and D) edit the same action; agree the order".
- MFA:1043, `network_access.rb`: "S1, S5a". LOG L1a adds `logSources` to the same
  `WITHHELD_SCENARIO_KEYS` line (LOG:705) and lands first. Fix: add "L1a".

### Nits

**n1.** SKIN:1517: "the privilege feature may add session badges" to the network view, while
CORE:1945 says S5a "adds no badge of its own to the network view". SKIN drops the clause.

**n2.** SKIN:175: "the real-product list applies to them only if question 15(a) is answered with
option 2". SKIN:1112 uses the core's product list under option 1 too (banner and title product
check). SKIN:175 becomes "applies under either option, in the forms row 15(a) of section 9 gives".

**n3.** SKIN Q(a) recommends option 1 provided the user first changes the brief's rule 4, and
section 9 carries both branches. Say which branch K3 builds if the brief is unchanged when K3
starts (recommended: option 2, the rule as it stands).

**n4.** CRACK:779: `validate_scenario.rb` "(one hook line)". CRACK:549-552 adds two (a
`require_relative` and a `run.call`), as CORE:1853 does. CRACK:779 says "the require and the run
line".

**n5.** PRIV:1211-1213: "`crack` on a `hash` entry if the cracking plan has not added it". S7
lands before S5b (PRIV:181-184), so it always has. Drop the clause.

**n6.** LOG calls the lock plan "S8c" (LOG:231, :238, :1145, :1233), as OUTLINE:147 does. LOCK
uses only A25 and G1-G3. LOCK section 3 adds "outline stage S8c (after S8b)".

**n7.** PRIV:876: the `cachedAccounts` entry `{ npc, after? }` does not say it is closed. The
registry names the same NPC `account` (CRACK:168, PRIV:245-249). Keep `npc` (it reads well beside
`after`), and add "closed: `additionalProperties: false`, `^_` notes allowed".

**n8.** CRACK:417-418: `crackFacts` (up to 64 ids) rides in every keyring answer whose `rev`
changed, whole. It is bounded and follows the keyring's existing whole-list pattern, so no delta
rule is broken. The "Sync deltas" line (CRACK:853) should name it beside the four keys, so the
growth table lists it.

**n9.** MFA:1177-1178 (decision 1): "an open session at that PC (any kind)". MFA:502 says "open,
unlocked". Add "unlocked" to the decision.

**n10.** LOG:1224 (request 5) says "Two changes remain in that plan". MFA:1067, :1097-1101 and
:1116-1126 now carry both (the `save_limit: true` switch on the blocked call; the test-only event
forcing a `detail`). LOG says "taken", and MFA names the `{ id: 'test_any' }` kind at MFA:1099.

## Section 14 requests

| From → to | Request | Status |
|---|---|---|
| CORE 1 → PRIV | access contract, `session_access`, answers (a)-(d) | taken (PRIV 5, 14) |
| CORE 2 → PRIV | step up is the weakness shape, no second route | taken (PRIV:1274-1275) |
| CORE 3 → PRIV | one session per PC; technique route opens no object | taken |
| CORE 4 → PRIV, MFA | technique session runs no sign-in checks; MFA's two tests | PRIV taken (PRIV:614-616); MFA took it verbatim (MFA:359, :951), but the second test conflicts with MFA's rule (M1) |
| CORE 5 → PRIV, MFA | reach checks unchanged | taken |
| CORE 6 → SKIN | surface, hooks, drop evidence/probe/noise | taken (SKIN 14) |
| CORE 7 → CRACK | `grants.credential` widened to `hash` by S7 | taken (CRACK:597-604, :832-835) |
| CORE 8 → LOG | rows, limits, events | taken (LOG req 3, 13.7) |
| CORE 9 → all | one id space with `hosts` | taken (SKIN network id rule); no other plan adds a network map |
| CORE 10 → all | flat empty defaults | taken (PRIV, LOCK, MFA state it; CRACK's four keys are flat but their defaults are not written out) |
| CORE 11 → all | unearned id answers as invented | taken (CRACK:473-476, PRIV:747-750, MFA:503-504) |
| CORE 12 → defence | parked | n/a |
| CORE 13 → CRACK, PRIV, LOG | `technique_card`, never `technique` | taken |
| PRIV → CORE | answer rule, `needsSession` keyboard only, test row, `desktop_request_allowed?` | taken (CORE:1943-1958, :1559) |
| PRIV → CRACK | `harvested` string proof, `crack` read first, username, cracked row, S5b after S7, scene by `hashId`, graph edge, post-reset yield | taken (CRACK 14) |
| PRIV → MFA | drop "adds any check"; Session step writes no level; no harvest password row | first two taken (MFA:328-329, :1140-1141); third not taken (m4) |
| PRIV → LOG | `count` only; override from any admin session | taken (LOG:1133, req 4) |
| PRIV → all | one fixture folder and `bin/ops-golden-compare` | taken (LOG L1a, CRACK:542) |
| LOCK 1 → MFA | shared functions and state | taken (MFA 14.11) |
| LOCK 2 → MFA | lock form of `/mfa/*`, owner rule | taken; LOCK builds it (LOCK:779-797, :889; MFA:294, :744) |
| LOCK 3 → LOG | `door`/`object` places, `method`, `{ npc: }`, `badge_swipe` rfid, `behind_closed_step?` | taken (LOG:231-238, :1145-1146, req 6) |
| LOCK 4 → orchestrator | A25 id, feature list, D6 line | outside the plans |
| LOCK 5 → CORE, PRIV, CRACK | own-route opens use `record_step_open!` | CORE and PRIV taken (CORE:1966-1968, PRIV:762-764); CRACK states the first-factor half only (CRACK:840); `/crack` opens nothing, so no conflict |
| SKIN 1 → LOG | parity compares `log_rows_for(..., compare: true)` | taken (LOG req 8) |
| SKIN 2 → all | beats name actions | taken (CORE:1610); no other plan has network-view beats |
| SKIN 3 → CORE | `cli` serving by stage, named keys | taken (CORE S1/S2 rows, 14.6) |
| SKIN 4 → CORE | `perform` echo and hooks | taken (CORE 5.3, 14.6) |
| SKIN 5 → CORE | 9.1 summary of skin rules | taken (CORE:1346) |
| MFA 1-4 → PRIV | sign-in order, kind, lockout key, keyring path | taken (PRIV:1338-1345, :614-618) |
| MFA 5 → CORE | technique session meets no step | taken |
| MFA 6 → PRIV, CRACK | recovered passwords | the request itself is stale (m4) |
| MFA 7 → PRIV, any | policy fields public | n/a: PRIV adds no policy field (PRIV:878) |
| MFA 8 → LOG | rows, helper | taken (LOG req 5; wording nit n10) |
| MFA 9-10 | hosts; scenario names | statements, no conflict |
| MFA 11 → LOCK | use names, own key, `device_in_use?`, drop `ownPhone` | taken (LOCK 14.1, :796, :308-area) |
| LOG 1 → all writers | 13.7 shape, registrations, secret sources | taken (CORE, PRIV, MFA, LOCK 13; CRACK and SKIN write none) |
| LOG 2 → orchestrator | L1a, L1b first; L2a-L3 after S5c | matches the build order |
| LOG 3 → CORE | limits and save rules | taken |
| LOG 4 → PRIV | `admin_profile_read` bound, `count` | taken |
| LOG 5 → MFA | `save_limit: true` call, guard tests | taken (n10) |
| LOG 6 → LOCK | gated `badge_swipe`, places, eight events | taken |
| LOG 7 → CRACK | no rows | taken |
| LOG 8 → orchestrator, SKIN | `log_rows_for` compare | taken |
| LOG 9 → CORE, PRIV, MFA, LOCK | fixtures before first edit | taken |
| CRACK → PRIV 1-3 | recipe ownership, `reused` check, takeable poster | taken in substance; PRIV keeps one duplicate rule (m6) and mislabels the classes (m5) |
| CRACK → CORE | S7 widens the rule; codes 12 → 14 | rule taken; code count left implicit in CORE, and the file's scope is open (m1) |
| CRACK → LOCK | both append to `FORGEABLE_ITEM_FIELDS` | conflicting: LOCK's table says no other plan edits it (m8) |
| CRACK → LOG | no rows, no secret source | taken |
| CRACK → SKIN | crack output offer | taken (SKIN:419-420: crack scene has one look) |

## Verdict

The plans join up. The one major (M1) is a test that cannot pass beside MFA's own saved-connection
rule; the fix is two sentences, in CORE request 4 and MFA:951. The minors are wording and
bookkeeping across the joins. m1 (refusal list scope) needs an orchestrator call, with the
recommended reading being every ops route's codes. m2 and m3 are small behaviour gaps between CRACK
and the later S8b/S5b stages, worth fixing before S7 is built. Once M1 and the minors are applied,
no further cross-plan round is needed. A delta check of those edits will do.
