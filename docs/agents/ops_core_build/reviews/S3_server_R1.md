# S3 server review, round 1 (steps 9 and 10), code against plan

Reviewer: read-only. Commits read: `a6f04bf8b`, `ee10c3860` (9a), `45388615c` (9b), `5f18daed2`,
`dd31d52a1` (10a), `73c9cd798`, `d6b9e4168` (10b), `13b8d9c76` (10c). Step 11 (`a756be26e`) is
out of scope; the branch head was read only for the current shape of `host_row` and the withheld
list. Plan: `docs/achitechture/OPS_CORE_PLAN.md` ("plan" below, with its line numbers).
File:line references to `network_ops.rb`, `game.rb` and the tests are at commit `13b8d9c76`
(which already holds step 11's fold of the two wrappers); validator and model lines are at
`a6f04bf8b` / `ee10c3860` as shown by their diffs.

How this was done: the engine diffs (`network_ops.rb`, `game.rb`, `credential_keyring.rb`,
`credential_model.rb`, `network_model.rb`, `validate_network_ops.rb`, the schema's S3 blocks,
`ops_log_events.rb`, controller, policy, routes) were read in full at their commits. The test
files were digested by a reader agent, test by test, and the test findings below come from that
digest; the test lines were not all re-opened by me, so a fixer should confirm a test gap at the
line before writing the missing test. **No test was run** by this review; every claim is from
reading.

Status: COMPLETE. All thirteen checks done.

## Verdict

**Pass with fixes: 0 blockers, 1 major, 12 minors.** The route does what sections 5.4 and 6 say:
the checks run in the plan's order, both 404s are built by the one `ops_not_found`, the card is
read from the authored definition and identity-strict, nothing in the request chooses the grant,
the record is exactly `id, via, foothold, access, technique`, `opsUsed` is flat, server-owned and
appended once, and the two events are section 13's lines word for word. The one major is in the
new `session` need: it counts a session record the rest of the server treats as not held (an
expired token session, a relay), so a step up can be had without a live session.

Severity count: blocker 0, major 1 (M1), minor 12 (m1 to m12).

## Findings

### M1 (major): the `session` need is met by an expired token session, and by a relay

- Where: `app/models/break_escape/network_ops.rb:383-389` (`ops_need_session`).
- Plan: 5.4 check 9 (about line 700), "`needs.session` asks for a session held at this PC, not
  locked, at the level named or above"; section 1, "grants nothing a player has not earned".
- What is wrong: the predicate is `session.is_a?(Hash) && !session_locked?(session)` and then the
  level. Every other reader of "a session held at this PC" also refuses an expired token session
  (`credential_session_expired?`, called "the one expiry predicate every reader of a held session
  uses", `credential_keyring.rb:179-185`; used at `game.rb:3781`, `:3841`, `network_access.rb:841`,
  `:1024`, `:1066`, `:1178`, `:1421`, `:1516`), and `session_held_at_keyboard?` (`game.rb:3779-3782`)
  also excludes a relay. An expired token record stays in `sessions` until a write path prunes it
  (`drop_expired_token_sessions!`), and the technique route prunes only after the grant.
- Shows it: state `sessions["sam_pc"] = { id, via: "credential", credential: "<a token id>",
  foothold: F }` with that token's clock run out (the desktop answers `expired`, the client is
  handed no session). `POST /network/technique { foothold: F, finding_id:
  "sam_pc.files.step_up", item_id: "card_factory" }` (the fixture's `needs.session: "user"`,
  `grants.session.access: "admin"`) answers 200 with a new admin technique session that never
  expires. Expected: 422 `need_unmet`, `need.kind: "session"`. The same holds for a relay record
  (`relay: true`), which is the account holder's own screen and not a session the player holds
  at that PC. The finding row's `met` tick is wrong in the same cases (one predicate).
- Fix: in `ops_need_session`, require `!credential_session_expired?(session)` and
  `!relay_session?(session)` (or call one existing "live session" reader) before the level test.
  Add tests: an expired token session and a relay session each leave `step_up` at 422
  `need_unmet` kind `session`, `met: false` on the row, state unchanged. The orchestrator's S2 R2
  note N5 (a credential need met by an expired token) is the same family and is still open for
  `ops_keyring_serves?`; check it in the same pass.

### m1 (minor): `worksOn` is copied whole, so an author note under it reaches the browser

- Where: `network_ops.rb:473` (`row['worksOn'] = entry['worksOn'].deep_dup`).
- Plan: section 7 (about line 1295), the technique row sends `name`, `summary`, `worksOn`,
  `itemId`; S2 server R1 ruling m2 (copy by type so no `_` key rides along).
- What is wrong: the schema's `worksOn` block allows `^_` pattern keys and `_comment`
  (`scenario-schema.json`, `properties.techniques`), so `"worksOn": { "class": ..., "_note":
  "matches the print server only" }` is sent to the client once the card is held. An unvalidated
  `worksOn` that is not a Hash is sent as `null`.
- Fix: build `worksOn` by named key: `class` (string), `product` (string, when present),
  `versions` (array of strings, when present); skip the technique when `worksOn` is not a Hash
  with a `class`. Test: a registry entry with `_note` keys at both levels, none in `GET /network`.

### m2 (minor): the schema's proof pattern refuses a finding id on a sign-in PC with a long id

- Where: `scripts/scenario-schema.json`, `credentials.<id>.proof.technique_card` pattern
  `^[a-z][a-z0-9_]{0,39}\.[a-z][a-z0-9_]{0,39}\.[a-z][a-z0-9_]{0,39}$` (commit `a6f04bf8b`).
- Plan: section 0 (lines 21-30): a sign-in host's object id keeps its pattern (up to 64
  characters, and the existing id pattern, which is not this one); only `hosts` keys, service
  names and weakness ids are capped at 40.
- What is wrong: the first part of a finding id can be a room object's id. A PC whose id is 41 to
  64 characters, or holds a character the object id pattern allows and this one does not, cannot
  be named by a granted credential's proof, with a schema error that does not say why.
- Fix: give the first part the object id pattern (`{0,63}`), or state in the description and the
  validator that a host that grants a credential must have an id of at most 40 characters.

### m3 (minor): the keyring serves a `technique_card` proof for any built kind

- Where: `app/models/break_escape/credential_keyring.rb:33-34` (the `when 'technique_card'`
  branch) and `registry_keyring_entries` (about `:355-357`).
- Plan: 4.3 (about line 437), "The entry's kind must be `saved_connection`"; "A technique yields
  a saved connection, never a password".
- What is wrong: only the validator enforces the kind. `opsUsed` also holds the ids of
  session-grant findings (5.4, "Both add the finding id"), so in a scenario that was not
  validated a `password` or `token` entry whose proof names any used finding is served. Not
  reachable in a validated scenario (the mutual naming rule and the kind rule refuse it).
- Fix (hardening): in the `technique_card` branch also require `entry['kind'] ==
  'saved_connection'` (S7 widens it to `hash`), with a model test for a `password` entry.

### m4 (minor): the loop warning reads only a credential need (departure b)

- Where: `scripts/validate_network_ops.rb`, `network_ops_check_session_grant`, `cred_loop`.
- Plan: 9.2 warnings (about line 1460), "a weakness that grants a session on a host whose only
  other way in is also that weakness's own need (a loop)".
- What is wrong: the code warns when `needs.credential` connects to the same host, whether or
  not there is another way in, and never for `needs.session` or an item found only on that
  host's desktop. As a warning it is harmless; the reading is accepted (see departures) but the
  message should say what it tests ("needs a credential that connects to this same host") and
  the handover should record that "only other way in" is not computed.
- Fix: none required beyond the wording; optional later: skip the warning when the PC has a
  typed sign-in the player can earn elsewhere.

### m5 (minor): no S3 fixture has an `itemType` need, and three need orders are untested

- Where: `test/support/network_ops_scenario.rb:136-152` (the S3 web list replaces the S2 one that
  held `open_listing` with `itemType`); `network_technique_test.rb:162`;
  `network_technique_hostile_test.rb:609-647`.
- Plan: 5.4 check 9, "each need in the order credential, item, session, global"; 11.2,
  `network_technique_test` "every refusal in its fixed order".
- What is wrong: the only order pair tested is credential before item. Nothing tests `itemType`
  through the technique route at all (refused, then met by an unforged held item of that type,
  never by a card), item before session, or session before global. A reorder of
  `ops_needs_rows` would pass every test.
- Fix: one weakness with `credential`, `item`, `session` and `global` all unmet, used four times
  as each is met in turn, asserting `need.kind` each time; one weakness with an `itemType` need.

### m6 (minor): `no_grant` before `fixed` is untested

- Where: `network_technique_hostile_test.rb:609` (the order table); `network_technique_test.rb:126`.
- Plan: 5.4 checks 6 and 7.
- What is wrong: no fixture weakness is both without `grants` and fixed, so swapping the two
  lines of `use_technique!` passes. (A fixed weakness found before the fix and confirmed is the
  case.)
- Fix: add a weakness with no `grants` and a `fixedIf`, confirmed, then fixed: expect `no_grant`.

### m7 (minor): no test that the long finding id is absent from rows, and `technique_used` rows do not assert the alias

- Where: `network_technique_test.rb:122` asserts `detail.finding` matches `/\Af\d+\z/` on the
  refused row only; the grant rows (`:190-216`, `:248-261`) assert `grant`, `access`,
  `technique`, `as`, `where`, not `finding`.
- Plan: section 13 (lines 1935-1937), the row carries the alias, never the finding id.
- Fix: on a grant row and a repeat row assert `detail.finding == "f<n>"` and that the whole
  `opsLog` JSON does not include the finding id string.

### m8 (minor): hostile tests that assert too little

Each is a real case with a weak assertion; none hides a defect found by reading.
- `network_technique_test.rb:236` part (d), repeat after the card is dropped: asserts the parsed
  body only. Add status 404, raw bytes, the session record kept unchanged and no row.
- `network_technique_hostile_test.rb:309`, another player's game: asserts "not successful" only,
  and the other game is a copy holding the same footholds and card, so the title's "a foothold
  held only in their own game" is not what is tested. Assert the exact status and body, and add
  the case where the foothold and card are held in the caller's own game and not in the target.
- `network_technique_hostile_test.rb:417`, extra parameters: `credential`, `credential_id`,
  `pc_id` and `level` are not among the extras; add them (they are the words a forged request
  would try for a credential grant). Also run the extras against a credential-grant finding and
  assert the exact body `{ success, grant, keyringChanged }`.
- `network_technique_hostile_test.rb:195` and `:529` assert `status < 500` for the forged
  inventory and other-route posts; the state assertions carry the test, but assert the expected
  status of each route so a route that starts accepting the body is seen.
- `network_technique_hostile_test.rb:564`, the credential repeat sent 25 times: no save count is
  asserted (the session one at `:543` does). Assert saves `[1] + [1]*10 + [0]*14`.
- `network_technique_test.rb:154` asserts `n >= 10`; the bound is exactly 10
  (`network_technique_hostile_test.rb:577` has the exact form).
- `network_technique_test.rb:315`, `:321`, `:345` assert `need_unmet` without `need.kind`;
  add `kind: "session"` and the label.
- `network_technique_test.rb:412`: the title says a refusal carries no grant or account; only
  the bootstrap is searched. Search the refusal body too, or retitle.
- `network_technique_test.rb:270`: no status assertion on the `PUT`.

### m9 (minor): the plan's shared test files hold no S3 cases

- Where: `network_ops_indistinguishable_test.rb` and `network_ops_state_delta_test.rb` have no
  technique case (0 mentions at `13b8d9c76`); `network_ops_no_exposure_test.rb` has one line.
- Plan: 11.2 rows for those three files ("S1 to S3": the technique route byte for byte against
  an invented id and a stale id; each route's answer holds only what it changed; a technique not
  held is never named; a `no_grant` refusal carries `reason` and nothing else).
- What is wrong: the behaviour is tested, but in other files (`hostile:223`, `:280`, `:323`,
  `:652`; `technique_test:126`, `:388`). The step 10 row does not list these files, so this may
  be meant for step 13; it needs an owner. Not covered anywhere: the technique answer "holds
  only what it changed" (a grant answer carries no finding rows, no `opsUsed`), and the
  no-exposure walk over every room answer after a grant.
- Fix: add the technique cases to the three files, or record in the plan which file holds them.

### m10 (minor): the session need label is the host label even for an unlisted way of reading it; and an empty label is possible

- Where: `network_ops.rb:388`: `'label' => pc ? host_label(pc).to_s : ''`.
- Plan: section 7, a need's label is a name the scenario already shows.
- What is wrong: nothing leaks (the finding's host is listed before any confirmed row exists, so
  its label is on the row already). But a `needs.session` on a `hosts` entry (refused by the
  validator) gives `label: ""` and a need that can never be met, silently. Accepted as built;
  the ruling of 2026-11-23 fixes the label.
- Fix: none needed; optionally a server warning as the catalog loader gives for a bad link.

### m11 (minor): notes for the privilege plan (S5a) so it does not trip here

- `ops_technique_repeat_answer` (`network_ops.rb:575-580`) writes the row's `access` from
  `client_access_level(record[:id])`, and `ops_need_session` reads the same helper. When S5a
  points that helper at `session_access`, the repeat row for a technique session still reads the
  stored level (same value), so no change; but the repeat row should read the record's own
  `access` to stay independent of what S5a's helper returns for other kinds.
- Departure (e): the two claim callers (`game.rb:3627`, `:3711`) call `login_session_answer`
  with no `pc_id`, so a claim answer can never carry `access`. Right for S3 (a claim record has
  no level). Plan section 14 item 1 says the sign-in answer carries `access: "admin"` for any
  session kind once `session_access` exists; if a claimed session can be admin under S5a, those
  two calls must pass `pc_id:`. Record it in the S5a hand-off.
- `login_session_answer` reads the level of whatever record is in the slot at `pc_id`, not of
  the session it was asked to describe. Every caller today writes the record first
  (`game.rb:3552-3554`, `credential_login.rb:87-92`, `network_ops.rb:595-599`), so it is right;
  a future caller that builds an answer before the write would report the old record's level.
  A one-line comment at `game.rb:4638` would keep that from happening.

### m12 (minor): the validator table still says N15 is not built (departure i)

- Where: `scripts/validate_network_ops.rb:26`, `NETWORK_OPS_BUILT = { ..., 'N15' => false }`.
- Plan: section 3 (lines 236-245), "Each stage flips its own entries when it lands".
- What is wrong: nothing yet; accepted for the build. But with the entry false, every S3
  validator rule is off for a real run (`network_ops_check_techniques` runs only `if
  built['N15']`), and `test_ops_access` cannot validate. The flip, and the test
  `validator-network-ops.test.mjs:125` that pins `N15: false`, must change in the landing step;
  name the step that owns it.

## What was checked and found right (so a fixer does not re-open it)

Check 1, the route against section 6.
- `network_technique` is in `set_game` and `with_game_lock`, has `network_technique?` returning
  `show?`, is in `DEVICE_ACTIONS`, and builds the one 400 from `ops_ids_well_formed?` before the
  model. No row and no save on a 400 or 404 (the model returns before any write).
- Order in `use_technique!` (`network_ops.rb:494-523`): finding held and host listed through the
  foothold (`ops_finding_reach`, 404); card (`ops_card_technique`, 404); host off (403, row);
  repeat; `not_confirmed`; `false_positive`; `no_grant`; `fixed`; `wrong_class`, `wrong_product`,
  `wrong_version`; `need_unmet`. That is 5.4's order and section 1's refusal order. Both 404s
  come from `ops_not_found` (a `dup` of one frozen body); no branch adds a key.
- `ops_technique_mismatch` names the first differing part and `technique_matches?` decides.

Check 2, the card. `ops_card_technique` (`:483-489`) reads the authored definition
(`CredentialModel.item_definition`), requires its type `technique_card`, requires
`ops_item_held?` (unforged entry, id and type equal to the definition; never by name) and a
registry key read from the definition. A minted entry is marked `clientAdded` and skipped by
`ops_held_items`; a dropped card is no longer in the inventory; the inventory is per game, so
another player's card is not nameable. `technique_matches?` (`network_model.rb`) is equality
only: class equal, product equal when the key is present, version a member of the list when the
key is present.

Check 3, the grant. Account and level come from `ops_grant_of(entry, record)`, which reads the
authored weakness only; the request supplies foothold, finding and card ids and nothing else.
The record is written by `start_login_session!` with the keywords and is exactly `id, via,
foothold, access, technique`. `opsUsed` is appended `unless used.include?`. The step up is the
same call: it replaces the slot and carries the foothold of the request, which is the plan's
rule (section 0: same foothold in place, or a new record carrying the other foothold). A
password session at `user` feeding a `needs.session: "user"` step up is the plan's (5.4 check
9). `needs.session: "admin"` is met only by a stored `access: "admin"`. See M1 for the one hole.

Check 4, the repeat. Tested after reach, card and host-off, before status; a session repeat needs
`via: technique`, `technique ==` this finding and `foothold ==` this foothold; a credential
repeat needs `opsUsed`. It answers `already: true` with `login_session_answer` of the live
record (or `keyringChanged: false`), writes `technique_used` with `save_limit: true` and saves
only when `stored?`. No second session, no second `opsUsed` entry. Departure (j) is the plan's
order (5.4 check 4 before check 7; "A repeat is answered even when `fixedIf` has since come
true", about line 737). It reveals nothing: the player already holds the session or the
credential, and `fixed: true` is on the confirmed row anyway.

Check 5, one needs predicate: `ops_needs_rows` is the only reader; `ops_unmet_need` is its first
`met: false` row. A global's name is never in a row (the label is the authored one).

Check 6, what reaches the browser. `techniques` is added only when `ops_held_techniques` is
non-empty, for held unforged cards, with `name`, `summary` (when set), `worksOn`, `itemId` (first
in id order). Nothing links a card to a finding before Use. Refusal order tells nothing unearned:
an unconfirmed decoy and an unconfirmed weakness both answer `not_confirmed` with the same row;
`false_positive`, `fixed`, class, product, version and the need are all on screen already by the
time their refusal can be reached; `no_grant` is the one new fact and the plan gives it there.
`techniques` is in `WITHHELD_SCENARIO_KEYS` at the head (`network_access.rb:18`). `access` is
sent only as `"admin"`.

Check 7, state. `opsUsed` default `[]` in `ACCESS_STATE_DEFAULTS`, written only by
`ops_technique_grant!`, bounded by the number of weaknesses, in no answer. `sync_state` merges
named sections only; the hostile tests at `:468`, `:493`, `:513` pin that a sync body changes
neither `opsUsed` nor a session record, and that a synced global named `opsUsed` is separate.

Check 8, rows. The two `EVENTS` lines equal section 13's. `technique_refused`: `as` nil, result
`refused`, `save_limit: true`, save only when `stored?`. `technique_used`: `as` the account for a
session, nil for a credential; no limit on a new grant, `save_limit: true` on a repeat. Detail
carries `f<n>`. Departure (h) is right: the row never has a typed name.

Check 9, 10a. The two keywords default to nil and write nothing; the three other callers are
unchanged; `signin_ok` is written only for `password` and `credential`; `signedInPcs` gains the
PC for `technique` as the plan's table says.

Check 10, the proof holds exactly when `opsUsed` is an Array holding the non-empty string id;
other proof kinds are untouched (see m3 for the kind).

Check 11, schema and validator. `techniques` is a closed entry in a 32-entry map with
server-only marks; `worksOn` closed; the item key and the proof kind are declared. Every S3 row
of 9.2 has a rule and a named node test (`validator-network-ops.test.mjs:454-633`), including the
mutual naming both ways, two weaknesses on one credential, `pc_admits_account?`, the
`connectsTo` policy checks and the silence of existing scenarios. The pretext key `technique` is
not read by any new code (`network_ops_card_items` keys on `technique_card` and on `type`).

Check 13. No Ruby above 2.7 or Rails above 7.0 was seen (`filter_map`, `to_h` with a block and
`then` are 2.7). Existing scenarios: every new branch needs a `techniques` key, a held card or a
`via: technique` record.

## Departures

| | Departure | Ruling |
|---|---|---|
| a | 9a's extra error: a granted credential whose account the `connectsTo` PC does not admit | accept: it is the plan's "a grant that could never be used" (4.3) applied to the account |
| b | "the way in needs the way in" read as a credential need connecting to the same host | accept as a warning; wording note m4 |
| c | `technique_items` does not list cards on a sign-in PC's desktop | accept: a card is a tray item; the validator's "no item carries" rule uses its own full walk, so it is not misled. The graph builder (step 12) should know |
| d | the keyring proof reads `player_state['opsUsed']` as an Array of finding ids | accept: section 8's shape |
| e | claim answers never carry `access` | accept for S3; note for S5a in m11 |
| f | one needs predicate with a `session` need labelled by the host label | accept (ruling of 2026-11-23); the predicate's hole is M1 |
| g | `GET /network` top-level `techniques` only for held cards | accept: section 7; m1 on what `worksOn` carries |
| h | `OPS_AS_ACCOUNT_EVENTS` in `ops_log_test.rb` | accept |
| i | the validator table keeps N15 "not built" | accept until landing; m12 |
| j | a repeat on a since-fixed finding answers `already: true` | accept: the plan's order and its own sentence |

## Checks not completed

None. Limits of this review: no test was run; test findings m5 to m9 rest on a reader's digest of
the test files; step 11's commit was not reviewed.

## R1 outcomes (fixer)

| Finding | Outcome |
|---|---|
| M1 | fixed, `7d535ab24`: `ops_need_session` also requires `!relay_session?` and `!credential_session_expired?`; `ops_keyring_serves?` excludes keyring rows marked `expired` or `ended` (the credential need, S2 R2 N1). Five route tests; each new condition removed in turn and the matching test failed |
| m1 | fixed, `5ec3da98c`: `worksOn` built by named keys (`ops_works_on`); two tests |
| m2 | fixed, `a40087041`: the host part of the proof pattern allows 64 characters (the existing id pattern) |
| m3 | fixed, `4b6d16199`: the `technique_card` branch requires `kind == saved_connection`; model test for token, assist_invite, password |
| m4 | fixed, `eac3f42fe` (landed inside the step 13a commit by the other builder, whole files): the warning says what it tests; node test asserts the wording |
| m5 | fixed, `e3e288f0d`: four-need order test, itemType test (a held card never meets a `technique_card` itemType) |
| m6 | fixed, `e3e288f0d`: no_grant before fixed |
| m7 | fixed, `e3e288f0d`: refusal, grant and repeat rows carry `f<n>` and the log holds no finding id |
| m8 | fixed, `e3e288f0d` and `d7543d0a2`: exact statuses and bodies for the other-player case (plus a second case: foothold and card held in the caller's other game), extras `credential`, `credential_id`, `pc_id`, `level` and a credential-grant extras test, exact statuses for the forged inventory and other-route posts, credential repeat save counts, `n == 10`, need kind and label, refusal body searched, PUT status. The unfixed item: none |
| m9 | fixed, `b030bff6d`: technique cases in the indistinguishable, state delta and no-exposure files. Question noted: a room answer carries a card object's own `technique_card` registry key (authored field), so the no-exposure test forbids the registry's content, not that key |
| m10 | fixed, `eac3f42fe` and `c53363233`: `needs.session` on a `hosts` entry is a validator error; node test |
| m11 | noted for S5a |
| m12 | step 13a (the N15 flip landed in `eac3f42fe`) |
