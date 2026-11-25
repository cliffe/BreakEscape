# S8b build brief: helpdesk recovery (feature A23, steps H1 and H2)

Written 2026-11-24 by the S8b designer. Read `docs/agents/OPS_CORE_BUILD_BRIEF.md` first; its rules
bind every builder here. Worktree `/data/be-ops-build`, branch `ops-helpdesk` (cut from `main`; it
holds every earlier stage, S8a and S6 included).

The design is `docs/achitechture/OPS_MFA_HELPDESK_PLAN.md` (cited as `P<line>`), stages H1 and H2
only. Builders do not need to read the plan: this brief carries what each unit needs. Where this
brief and the plan disagree on a name, a line number, a file or a rule, THIS BRIEF is right (checked
against `ops-helpdesk` on the day). Line numbers are today's; re-find every anchor by name.

Short names: `GM` = `app/models/break_escape/game.rb`, `GC` =
`app/controllers/break_escape/games_controller.rb`, `MA` = `app/models/break_escape/mfa_access.rb`,
`MS` = `app/models/break_escape/mfa_sign_in.rb`, `MM` = `lib/break_escape/mfa_model.rb`, `HM` =
`lib/break_escape/helpdesk_model.rb` (new), `HA` = `app/models/break_escape/helpdesk_access.rb`
(new), `JS` = `public/break_escape/js`, `SHAPES` = `test/fixtures/files/helpdesk_answer_shapes.json`
(new).

**No migration is needed.** All new state is two keys inside `player_state`. If you find you need a
schema change to the database, stop and report.

## 1. What S8b adds, in play

- A scenario may declare `helpdesks`: a room NPC who will reset an account's password, or move its
  second sign-in step to the player's own phone, after checking the caller under one rule:
  `none` (anyone who asks), `questions` (typed answers compared with the account's recovery
  answers) or `callback` (granted only while the player holds the account owner's phone).
- The player asks on a paper request form (`helpdesk-request` scene): a username, what is wanted,
  one field per question.
- A password reset hands over the account's authored `resetPassword`, lists it in the keyring,
  makes the old password fail and clears that account's lockouts at every PC. The account's saved
  connections are refused ("This password has been changed. Type the new one to sign in.") until
  the new password has been typed once.
- A second-factor reset ("re-enrolment") moves that account's sign-in step to "My phone": the code
  pane and the push pane show a "My phone" button, and the old code device says "No longer in use".
- The desk stops serving a username for five minutes of server time after `maxTries` refusals.
- The lesson: the recovery path is part of the sign-in, and facts found online prove nothing about
  a caller. This is a game abstraction. The engine holds no persuasion script and no pretext text;
  the only spoken lines are the short authored ones the test scenario needs (section 3).

## 2. Plan drift and what S8a left

| # | Plan says | Code on `ops-helpdesk` | What builders do |
|---|---|---|---|
| D1 | `attempt_login!` at `GM:3444-3503`, password read at `:3486` | `attempt_login!` at `GM:3620`; the password is read at `:3640` (`npc['creds']['password']`), compared at `:3641`; the second step gate at `:3654-3657` | Unit 11 changes line `:3640` only |
| D2 | `effective_password`, `login_lockout_keys_for`, `accountResets`, `helpdeskTries`, `HM`, `HA`, the route, the form | None exists. `lockout_key` and `lockout_key_parts` do (`lib/break_escape/access_identities.rb:59`, `:64`); `lockout_pcs_for_client` does (`GM:3789`) | Built here |
| D3 | Five keys in `ACCESS_STATE_DEFAULTS` | Three are there (`GM:3062`) | The two new keys are NOT added to that Hash: `HA` reads them through lazy accessors (see A9), so `game.rb` and the golden fixtures do not move |
| D4 | One concern `mfa_access.rb` holds the re-enrolled forms | S8a split it: `MA` (subject functions) and `MS` (sign-in only). `MS#mfa_reenrolled?` is a private stub answering false (`MS:222`), asked at `MS:147, 179, 186`. `MA` already takes `reenrolled:` (`MA:97`, `:130`) and answers `[:waiting, 'own_phone']` (`MA:112`). No `own:` device id, no `ownPhone` in an answer, no `device_in_use?` | Unit 14 edits `MS` only. `MA` is NOT edited in this stage (S8c edits it) |
| D5 | `mfa_step_for` is `none` for kind `code` with no device "and not re-enrolled" | The re-enrolled half is not there (`MS:24`) | Unit 14 |
| D6 | Implicit keyring entries at `credential_keyring.rb:263-285` | `implicit_keyring_entries` at `:308-336`, called from `keyring_for_client` (`:119`) | Unit 12 |
| D7 | Server refusal `typeToSignIn: "password_changed"` | Only `second_step` exists (`credential_login.rb:86`). The client already words both (`JS/systems/pc-sessions.js:172`) | Unit 12 adds the server half; no client edit |
| D8 | `GET /mfa/device` takes `npc_id`; `GET /mfa/phone` takes `own=1` | `mfa_device` reads `item_id` only (`GC:1572`); `mfa_phone` answers 403 whenever `own` is present (`GC:1624`). The MFA actions call `with_game_lock` inline; they are not on the `around_action` list (`GC:104`) | Unit 18 |
| D9 | The validator gains helpdesk errors | `scripts/validate_mfa.rb:55-75` (`mfa_not_built`) REFUSES `helpdesks`, `creds.recovery`, `creds.resetPassword` and `helpdesk` on an ask with "is not built yet (MFA plan stage S8b)". The lock-for-good warning is at `:233-234` | Unit 05 removes `mfa_not_built` and adds a new file `scripts/validate_helpdesk.rb` |
| D10 | `socialPretextAsk` reached from schema `:3725` | `scripts/scenario-schema.json:3788` | Find by name |
| D11 | `pretext-judge.js` starts the form on a granted ask | `pretext-judge.js` only judges (`:412-414`); its header says the binding applies grants: `JS/minigames/person-chat/person-chat-pretext.js` | Unit 21 owns both files and edits the one that applies grants |
| D12 | "a helpdesk form on a PC's desktop" | The plan names no authored field for it | This brief adds one: a desktop item of type `helpdesk_form` (A3) |
| D13 | The feature scenario is `test_ops_mfa`, extended by two accounts and two desks; "no `test_ops_helpdesk` is built" | `test_ops_mfa` is S8a's finished scenario, with real-capture fixtures pinned on it | A NEW scenario `scenarios/test_ops_helpdesk/` (A1). `test_ops_mfa` is not edited |
| D14 | `mfa-client.js` handles the own phone | `noteRequired` copies `ownPhone` (`:99`) and `codeFor` tests `source === 'own'` (`:161`), but nothing sets that source: `readDevice` takes `itemId` only (`:140`), `phone` takes `npcId` only (`:271`). The sign-in screen has no "My phone" button | Units 09 and 19 |
| D15 | `OpsLog::EVENTS`; `OpsLog.register_secret_source` | `BreakEscape::OpsLogEvents::EVENTS` (`lib/break_escape/ops_log_events.rb:24`; MFA entries `:62-69`); `register_secret_source` defined at `app/models/break_escape/ops_log.rb:152`, existing sources registered at `:919-978` | Name only |
| D16 | The pinned overlay-scene list | `test/js/playtest-shellx-open-wait.test.mjs:149-151` pins 17 names on this branch (it may be 18 once `main` is merged). Count it on the day | Unit 07 |
| D17 | `device_in_use?(npc_id)` "asks each registered non-sign-in subject kind" | No such kind is on this branch; S8c (locks) is on its own branch | Unit 14 builds one seam method answering false (A8) |

**S8a decisions this stage inherits.** The lock-for-good validator rule was left "warning now, error
half with H1": unit 05 builds the error half (A2). Re-enrolment was left as "one false seam, no
branches": unit 14 fills it. `mfa_reenrolled?` stays private; nothing outside `MS` calls it. The
`mfa_prompt_approved` log entry already lists `own_phone`, so `ops_log_events.rb` gains no MFA edit.

**`ca03_helpdesk_reset` is not edited, at all.** The plan lets this stage change nothing in it
(P101-107, P926-928): it has no `helpdesks` and no `helpdesk` on its ask, so its grant stays the
client global `leila_reset_granted` and its bootstrap stays byte-equal (fixture
`mfa_bootstrap_ca03_helpdesk_reset`). The same holds for `ca03_helpdesk_reset_defend` and the four
`ca_*_helpdesk_*` scenarios. Everything new is proved on `test_ops_helpdesk`.

## 3. Constraints, in plain words

**Never sent to the browser.**
- `creds` of any NPC, so `creds.recovery` (the right answers) and `creds.resetPassword`.
- `helpdesks` itself, and its `verify`, `questions`, `minCorrect`, `maxTries`.
- The state keys `accountResets` and `helpdeskTries`, and (as before) `mfaPending`, `mfaAccounts`,
  `mfaPrompts`.
- A code or the three number choices, outside the routes below.
- Which answers were right. A refusal carries `reason` and `triesLeft` or `retryIn` and nothing
  else. An unknown username and wrong answers get the same status, body and row shape.
- The typed username: it is never echoed in any answer.

**Sent on purpose, and only here.**
- `helpdeskForms` in the bootstrap, only when a desk exists: per desk id, `npc`, `resets`,
  `questionLabels` (A4). Nothing else.
- `resetPassword`, once, in the answer that grants it (`password`), and after that as the secret of
  the keyring entry `<npcId>.reset`.
- The own-phone code, in `GET /mfa/device?npc_id=` and only for an account whose second factor a
  desk has reset. The own-phone request list in `GET /mfa/phone?own=1`, only when at least one
  account is re-enrolled.
- `ownPhone: true` on the `mfaRequired` answer of a re-enrolled account.
- Every `/helpdesk/*` and `/mfa/*` answer is `Cache-Control: no-store`.

**Every grant is a server decision from server-held state.** The client global
`helpdesk_<deskId>_result` is a mirror so ink can voice a line; nothing reads it to grant. The
`questions` and `callback` rules cannot be passed by a crafted request. The knock-out record is the
browser's claim and is used only to REFUSE (a knocked-out desk NPC serves nobody).

**Determinism.** No random draw (`rand`, `SecureRandom`, `Math.random` are all out). The reset
password is authored. The own-phone code is `MM.code` with device id `own:<npcId>`. The desk's
decision is a comparison or a held-item test; the stop is a count against `maxTries`. No runtime
LLM decides or words anything.

**Time.** The server has no game clock. All server time comes through the ONE existing seam,
`MS#mfa_now`; do not add a second. Real time decides exactly one new player-visible outcome: the
desk's five-minute stop (`HM::DESK_STOP_SECONDS = 300`). Nothing pauses with the game. Rails tests
freeze time (`travel_to`); JS tests inject a clock; a scripted run never sleeps for the stop (the
lift after five minutes is a Rails test) and never computes a code.

**No exploit content.** This is a game abstraction of talking a helpdesk into a reset. Build the
rule check, the form and the state. Do not write persuasion scripts, pretext wording, caller
personas or "how to" text, in code, comments, tests, docs or the scenario. The test scenario's desk
lines are one short neutral sentence per result ("That matches our records.", "I can't verify
you.", "I can't take more requests for that account just now."). Recovery questions are invented
office facts (a staff number, a line manager's name). Products and people are invented. Do not open
SecGen XML or any exploit-detail field guide.

**Existing scenarios unchanged.** With no `helpdesks` key and no `creds.resetPassword`, every answer
and write is byte-for-byte as before. After any engine Ruby edit run `bin/ops-golden-compare` with
NO outer `flock` (it takes the lock itself; wrapping it deadlocks every session's queue). A diff is
a bug to report, never a reason to capture again. `node test/js/ops-unchanged-validator.test.mjs`
must show no new line for any shipped scenario. Campaign missions (m01 to m10, sis*, ca*) and every
existing scenario, `test_ops_mfa` included, are not edited.

**Database.** Shared development database, no backup: never `db:create`, `db:schema:load`,
`db:migrate`, `db:reset`, `db:drop`, `db:setup`, `db:seed`. Rails tests:
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>`; never `ruby -Itest`.

**Tests must not change shared classes.** No test may `prepend` to, `alias`, `define_method` on,
reopen or `include` into an application class or module (`Game`, `GamesController`, `OpsLog`,
`MfaModel` and the rest) unless it restores the original in an `ensure` block in the same test. A
stub is `Minitest`'s block-scoped `stub`, or a subclass made inside the test. A test-only log event
is registered and unregistered in `ensure`. Reason: an S8a test changed a shared class and broke
another file only in a full run. Because of this rule no unit tests a concern by including it into
`Game` from a test: unit 10 owns the one `include` line in `GM`.

**Answer shapes come from one file.** `SHAPES` (unit 04) is the contract for every server answer
this stage adds or changes. Controller tests assert the real answers against it. EVERY client test
of this stage reads its server answers from it through `test/js/helpers/helpdesk-answers.mjs`. No
client test may contain a hand-written stand-in for a server answer; unit 04's lint test enforces
it. If a builder finds the contract wrong, the fix is to `SHAPES` (reported to the orchestrator,
who has unit 04's owner change it), never a local literal.

**Event mappings.** A new `eventMappings` entry goes LAST in its list;
`ruby tools/check_mapping_index_drift.rb` must pass.

**New static JS imports** go on every harness copy list that copies the importing module. S8a's one
import reached 35 files. This stage is designed to add NONE into an existing module: the two new
leaf modules (`helpdesk-client.js`, the scene) are reached the way `code-device` reaches
`MfaClient` today, or through `window`. If a unit cannot avoid a static import into an existing
module, it re-greps `test/js` for that module, edits every list, and names each file in its report.

**Overlay scene list.** `test/js/playtest-shellx-open-wait.test.mjs` pins the scenes with no
framework X. Whichever unit adds a scene updates it; here that is unit 07 only.

**Leak scanner.** `tools/playtest/lib/access_leak_scanner.rb` and the new
`access_leak_scanner_helpdesk.rb` are never loosened. Every allowance is tied to proof in the
capture (a row the run really produced), per thing, and the scanner fails closed: a missing,
malformed or ambiguous proof earns nothing. No existing rule is edited to make a run pass. A hit is
a finding to report. Do not depend on the planned recorder change (sign-in and sign-out rows tagged
with their PC); do not edit `.claude/skills/`.

**Merging with S8c.** S8c (a second step on any lock) is being built on another branch and edits
`GM`, `GC`, `MA`, the schema, `validate_mfa.rb` and the scanner. So S8b's additions to shared files
are single lines pointing at S8b's own files:

| Shared file | S8b's whole edit | Owner |
|---|---|---|
| `GM` | one `include HelpdeskAccess` line (unit 10); line `:3640`, one call before `start_login_session!`, one call in the bootstrap filter (unit 11) | 10 then 11 |
| `app/models/break_escape/network_access.rb` | the word `helpdesks` in `WITHHELD_SCENARIO_KEYS` (`:18`) | 11 |
| `GC` | one `include BreakEscape::HelpdeskActions`, one name in the `set_game` list (unit 13); the `npc_id` and `own` branches of two existing actions (unit 18) | 13 then 18 |
| `config/routes.rb`, `app/policies/break_escape/game_policy.rb` | one route, one method | 13 |
| `lib/break_escape/ops_log_events.rb` | three entries, appended last under an `# S8b` comment | 03 |
| `scripts/scenario-schema.json` | its own blocks only | 05 |
| `scripts/validate_scenario.rb` | one `require_relative`, one `run.call`, the form type in the known-type list | 05 |
| `scripts/validate_mfa.rb` | remove `mfa_not_built`; one guard on the `:233` warning | 05 |
| `scripts/generate_dungeon_graph.rb` | one new block after the MFA block (`:1861-1908`) | 06 |
| `tools/playtest/lib/access_leak_scanner.rb` | one `require_relative`, one `include`, one call beside `scan_mfa` (`:570`), one hook call where the device answer is judged | 17 |
| `tools/playtest/verify-run.rb` | one new printing block | 17 |
| `test/support/ops_unchanged_cases.rb` | cases appended under an `# S8b` comment | 01 |
| `app/views/break_escape/games/show.html.erb` | one CSS link line after `:102` | 07 |

Never reformat or reorder a shared file. A stage lands only after `main` is merged INTO this branch
and the merged tree passes the train; the merge rule for every row above is "keep both".

**State.** `accountResets` and `helpdeskTries` are server-owned: no sync body may write them, they
are not a sync section, and no answer carries either whole (delta sync rule).

**Text.** UK English. All server and author text reaches the DOM through `textContent`.

**Every unit.** Edit only the files in your list; a needed change elsewhere is reported, not made.
Commit only when your prompt says, by explicit path, no attribution lines. "Unmodified" means you do
not edit that test file. Never edit `.claude/skills/`.

## 4. The contract

### 4.1 Scenario fields

```json
{
  "helpdesks": { "it_desk": {
    "npc": "ria", "verify": "questions", "questions": ["staff_no", "manager"], "minCorrect": 2,
    "maxTries": 3, "resets": ["password", "mfa"],
    "questionLabels": { "staff_no": "Staff number", "manager": "Line manager" }
  }}
}
```

| Field | Values | Meaning |
|---|---|---|
| `helpdesks.<id>.npc` | a room NPC id | One NPC serves at most one desk |
| `verify` | `none`, `questions`, `callback` | The rule |
| `questions`, `minCorrect` | ids; integer, default all | Which `creds.recovery` keys count, and how many must be right |
| `maxTries` | integer 1 to 9, default 3 | Refusals for one username before the five-minute stop |
| `resets` | subset of `["password", "mfa"]` | What the desk will do |
| `questionLabels` | id to plain text, 40 code points each at most | The form's field labels. Sent to the browser |
| `creds.recovery` | id to plain text, 64 code points each at most | The right answers. Server only |
| `creds.resetPassword` | string | The password the desk issues. Server only |
| item `type: "helpdesk_form"`, `desk: "<id>"` | in a sign-in PC's contents | A desktop icon that opens the form for that desk, as a request over that PC (A3) |
| `helpdesk: "<id>"` on a pretext ask | a desk id | A granted ask opens the form for that desk |
| ink tag `#helpdesk_request:<deskId>` | in the desk NPC's story | Opens the form, as a request in person |

### 4.2 State (inside `player_state`, read only through `HA`'s accessors)

- `accountResets`: `{ npcId => { 'password' => true?, 'mfa' => true?, 'typed' => true? } }`.
- `helpdeskTries`: `{ "<deskId>|<normalised username>" => { 'n' => integer, 'stoppedAt' => seconds? } }`
  (always a Hash, A6). Keys for usernames that are not accounts are capped at 200, oldest dropped,
  the way `loginFailures` is capped (find the cap beside `record_login_failure!`, `GM:4660`).

### 4.3 `POST /games/:id/helpdesk/request` (inside `with_game_lock`)

Params: `desk_id`, `username`, `what` (`password` or `mfa`), `answers` (question id to text),
optional `pc_id`. Checks, in this order; the first that fails answers:

| # | Check | Fails as |
|---|---|---|
| 1 | Body at most 4 KB (by `request.content_length`, the pattern at `GC:2561`); `desk_id`, `username`, `what` are non-empty strings; `answers` absent or a map of strings; `pc_id` absent or a string of at most 64 code points | 400 `bad_request` |
| 2 | The desk exists | 404 `not_found` |
| 3 | The desk's NPC is in `encounteredNPCs` and not recorded as knocked out | 422 `unavailable` |
| 4 | With `pc_id`: it is a sign-in PC with an open, UNLOCKED record in `access_sessions[pc_id]` of any kind (keyboard, remote, technique). Without `pc_id`: no session needed | 422 `unavailable` (same body for a real and an invented id) |
| 5 | `what` is in the desk's `resets` | 422 `unavailable` |
| 6 | The desk has not stopped serving this username. A stop older than `DESK_STOP_SECONDS` is lifted first (entry deleted) | 422 `blocked` with `retryIn` |
| 7 | The username is an account (and, for `password`, has a `resetPassword`); the rule holds | 422 `refused` with `triesLeft`; `n += 1`; at `maxTries` set `stoppedAt` (that answer is still `refused` with `triesLeft: 0`) |

The username is normalised (`AccessIdentities.normalise_username`), stripped of control characters
and cut to 64 code points before any use. Each answer is cut to 64 code points, then normalised
(`HM.normalise_answer`: strip, collapse inner spaces, downcase, first 64 code points).

Rules: `none` always holds. `questions`: at least `minCorrect` of the desk's `questions` have a
normalised answer equal to the normalised `creds.recovery` value. `callback`: the player holds the
account owner's phone (`held_friendface_phone(npc_id)`, called unchanged).

A grant writes `accountResets[npcId][what] = true` and deletes the tries entry (A7). Then:
- `password`: delete every `login_lockout_keys_for(npc)` entry from `loginFailures` and
  `loginLockouts`. Answer 200 `{ granted: true, what: "password", password, lockoutPcIds }`
  (`lockoutPcIds` is the fresh `lockout_pcs_for_client`).
- `mfa`: set `mfaAccounts[npcId]['wrong']` to 0 and remove `closedAt`, through the map accessor `MA`
  already has (`mfa_accounts_map`), not a second path. Lockouts are NOT cleared. Answer 200
  `{ granted: true, what: "mfa" }`.
- A request for something already granted passes checks 1 to 7 and gets the same body again (with
  the current `lockoutPcIds`). It writes nothing, clears nothing and logs nothing.

Log rows (`write_log_row!`; the caller saves when `stored?`):

| Event | When | `as` | `where` | Result | Detail |
|---|---|---|---|---|---|
| `helpdesk_request` | each outcome from check 6 on (never for `bad_request`, `not_found`, `unavailable`, nor a repeat of a grant) | `{ typed: username }` | `{ kind: 'desk', id: desk_id }` | `granted`, `refused`, `blocked` | `what` |
| `account_password_reset` | the first password grant for an account | `{ account: username }` | desk | `ok` | `agent`: the desk NPC id |
| `account_mfa_reenrolled` | the first second-factor grant for an account | `{ account: username }` | desk | `ok` | `agent` |

`blocked` rows pass `save_limit: true`; the entry registers `save_limit: { 'blocked' => 10 }`. No
row holds a typed answer. `creds.resetPassword` values are a registered secret source
(`:helpdesk`); recovery answers are not (they are public facts and would collide with names).

### 4.4 Changes to S8a's answers (H2)

- `POST /login` at an MFA PC, re-enrolled account: the `mfaRequired` answer gains `ownPhone: true`.
- `GET /mfa/device?npc_id=<id>`: 403 `no such device` unless `accountResets[id].mfa`; else
  `{ deviceId: "own:<id>", displayName, npcId, code, secondsLeft, used? }` (`displayName` is the
  fixed text "My phone").
- `GET /mfa/device?item_id=` for a held device whose owner is re-enrolled (and `device_in_use?` is
  false): `{ deviceId, displayName, npcId, enrolled: false }`, no code.
- `POST /mfa/verify` for a re-enrolled account compares against the `own:<npcId>` code.
- `POST /mfa/prompt` for a re-enrolled account answers `waiting: "own_phone"` (already in `MA`).
- `GET /mfa/phone?own=1`: 403 `no such phone` unless some account is re-enrolled; else the live push
  requests of every re-enrolled account, the same entry shape as today.
- `POST /mfa/approve` for a re-enrolled account needs no held phone; the row's `approver` is
  `own_phone`; the answer's `approvedBy` is `"player"`.
- Keyring sign-in with a saved connection: 422 `{ success: false, typeToSignIn: "password_changed" }`
  when `accountResets[npcId].password` is set and `.typed` is not; checked after the `second_step`
  refusal (`credential_login.rb:86`) and before the session write; nothing counted, no row.

### 4.5 The form, the client module and the click paths

`helpdesk-request` is the only new screen. "My phone" is a new button on two existing panes. The
exact click path to each (unit 15 authors them; units 19 to 22 build them; section 6 plays them):

| Screen | Click path in `test_ops_helpdesk` |
|---|---|
| Form, in person | Walk to Ria (the `it_desk` NPC) in the Service Desk room, press E to talk, choose "Ask for an account reset". The line is read, then the form opens over the chat. Closing it returns to the chat, where Ria voices the result |
| Form, over a PC | Click `front_pc` in the Front Office, sign in as `s.okoro` (password on the note beside it), click the desktop icon "IT request form" |
| Form, from a call | Open the player's phone, ring "IT service line", choose the one ask "Request a reset"; when it is granted the form opens |
| "My phone" on the code pane | After Vera's second factor is reset: click `vault_pc`, type her username and password, the code pane shows "My phone"; click it |
| "My phone" on the push pane | After Wim's second factor is reset: click `ops_pc`, type his username and password, the push pane shows "My phone"; click it |
| Old device, no longer in use | After Vera's reset: open the inventory, click "Code device" |

## 5. Units and waves

| Wave | Units (side by side) | Waits for |
|---|---|---|
| 0 | 01 unchanged fixtures | nothing; BEFORE any engine edit |
| 1 | 02 model, 03 log events, 04 answer shapes | wave 0 |
| 2 | 05 schema and validator, 06 dungeon graph, 07 request form scene, 08 helpdesk client, 09 MFA client own forms, 10 server concern | 02 (05, 06, 10); 03 (10); 04 (07, 08, 09) |
| 3 | 11 `game.rb` wiring, 12 keyring and saved connections, 13 controller request route, 14 sign-in re-enrolment, 15 scenario files, 16 own-phone scenes, 17 leak scanner rules and `verify-run` | 10 (11, 12, 13, 14); 05, 06 (15); 09 (16); 04 (13, 17) |
| 4 | 18 controller own forms, 19 "My phone" buttons, 20 ink tag opener, 21 pretext opener, 22 desktop opener | 13, 14 (18); 09, 16 (19); 07, 08, 15 (20, 21, 22) |
| 5 | 23 scenario tests | 11 to 14, 18 |
| 6 | 24 scanner on real answers, 25 docs | 17, 23 |
| after | review, merge `main` in, train, scripted playtest, live proof | 24 |

Plan stage: H1 = 01 to 08, 10 to 13, 15, 20 to 22 and the password halves of 17, 23. H2 = 09, 14, 16,
18, 19, the `callback` and `mfa` halves of 05, 06, 10, 17, 23. Stage-wide = 24, 25.

The scenario (15) is written BEFORE any click path is built (20, 21, 22, 19), and each of those
units tests against the real scenario file. The scanner (17) is reviewed after wave 3 and again
after wave 6 (24); if the first review finds a blocker, 24 waits for the fix.

No two units in one wave share a file. Single owners in order: `GM` 10 then 11; `GC` 13 then 18;
`test/controllers/break_escape/helpdesk_answer_shapes_test.rb` 13 then 18; `mfa-client.js` 09;
`password-minigame.js` 19; `code-device-minigame.js` and `authenticator-live-minigame.js` 16;
`minigames/index.js`, `minigame-starters.js`, `minigame-registry.js` 07; the scanner files 17 then
24; `SHAPES` and its helpers 04 (later changes go back to 04's owner).

### Unit 01: unchanged fixtures (wave 0)

- **Files:** `test/support/ops_unchanged_cases.rb` (append), new
  `test/fixtures/files/ops_unchanged/helpdesk_*.json`.
- **Build:** read the header of `lib/tasks/ops_unchanged.rake` and the `mfa_*` cases (from `:431`) as
  the model. Say in your report what the `mfa_*`, `privilege_*` and `core_*` fixtures already pin.
  Add only what they do not, from this list: (a) `GET /keyring` on `test_access_keyring` before and
  after a captured account; (b) a saved-connection sign-in on a scenario with no `mfa`; (c) the
  bootstrap of `test_ops_mfa`; (d) on `test_ops_mfa`, a right password at a `code` PC, the held
  device answer's KEYS (not its code), a `push` prompt answer and the phone list; (e) a lockout on
  `test_access_signin` followed by a right password (refused), if not pinned. Capture with
  `ONLY=<name> bin/rails app:ops:unchanged:capture`.
- **Do NOT:** edit an engine file; touch an existing fixture; add a second replay test.
- **Done when:** `bin/ops-golden-compare` passes with the new names; `git status` shows only your
  files. Hand on the fixture names.

### Unit 02: `HelpdeskModel` (wave 1)

- **Files:** `lib/break_escape/helpdesk_model.rb`, `test/unit/helpdesk_model_test.rb` (new). No Rails
  in the model (as `mfa_model.rb`).
- **Build:** `DESK_STOP_SECONDS = 300`; `VERIFY = %w[none questions callback]`;
  `RESETS = %w[password mfa]`; `ANSWER_MAX = 64`; `LABEL_MAX = 40`; `TRIES_CAP = 200`.
  - `desks(scenario)`: the `helpdesks` map with defaults applied (`verify` invalid or absent is
    treated as `questions` with every question required, the strictest reading; `maxTries` an
    integer 1 to 9 else 3; `minCorrect` an integer 1 to the question count else the count;
    `resets` filtered to `RESETS`). `{}` when absent or not a Hash.
  - `desk_for_npc(scenario, npc_id)`: `[desk_id, desk]` or nil.
  - `normalise_answer(text)`; `clean_username(text)` (control characters out, first 64 code
    points; the caller applies `normalise_username`); `tries_key(desk_id, username)`.
  - `answers_right(desk, recovery, answers)`: the count of the desk's `questions` whose normalised
    answer equals the normalised recovery value; a missing or empty recovery value never matches,
    and an empty answer never matches. `rule_met?(desk, recovery, answers)` for `questions`.
  - `forms(scenario)`: the browser's `helpdeskForms`: per desk exactly `npc`, `resets`,
    `questionLabels` (labels cut to 40 code points). `nil` when there is no desk.
  - `covers?(desk, npc, what)`: whether this desk could ever grant `what` for this account (in
    `resets`; for `password` a `resetPassword`; for `questions` every asked id in `recovery`). The
    validator and the graph use it.
- **Tests:** defaults and bounds; normalising (case, inner spaces, code point cut, a non-string);
  `minCorrect` below, at and above; an empty answer against an empty recovery value is wrong;
  `forms` carries the three keys and nothing else, for a hostile desk Hash with extra keys;
  `covers?` per rule.
- **Done when:** your file passes. Hand on every signature.

### Unit 03: log events (wave 1)

- **Files:** `lib/break_escape/ops_log_events.rb`, `test/unit/helpdesk_log_events_test.rb` (new).
- **Build:** three entries appended last under `# S8b helpdesk`, the table of 4.3:
  `helpdesk_request` (`places: %w[desk]`, results `granted refused blocked`,
  `save_limit: { 'blocked' => 10 }`, detail `what`: `password`, `mfa`), `account_password_reset` and
  `account_mfa_reenrolled` (`places: %w[desk]`, result `ok`, detail `agent`: an NPC id, typed the
  way an existing entry types an NPC id). If the place kind `desk`, a result word or an `as` of
  `{ typed: }` is not something the registry or the guard allows today, REPORT it with the line
  that refuses it; do not widen a shared list silently.
- **Tests:** the table's self-check (`test/models/break_escape/ops_log_test.rb` unmodified); each
  entry accepts its detail and refuses another value.
- **Hand on:** names, results, detail keys, and how S8a's tests exercise the secret guard (grep
  `secret in` under `test/`), for unit 13.

### Unit 04: answer shapes (wave 1)

- **Files (all new):** `test/fixtures/files/helpdesk_answer_shapes.json`,
  `test/support/helpdesk_answer_shapes.rb`, `test/js/helpers/helpdesk-answers.mjs`,
  `test/js/helpdesk-answer-shapes.test.mjs`, `test/js/helpdesk-no-handwritten-answers.test.mjs`.
- **Build:** `SHAPES` is one JSON object: name to `{ "status", "body" }`, where `body` is a full
  example answer with realistic invented values. A sibling key `"vary"` lists the body paths whose
  VALUE differs per run (`code`, `secondsLeft`, `retryIn`, `password`, `lockoutPcIds`, ids); every
  other value must be equal. Entries, from 4.3 and 4.4:
  `helpdesk.granted_password`, `helpdesk.granted_mfa`, `helpdesk.refused`,
  `helpdesk.refused_last` (`triesLeft: 0`), `helpdesk.blocked`, `helpdesk.unavailable`,
  `helpdesk.not_found`, `helpdesk.bad_request`, `bootstrap.helpdesk_forms` (the `helpdeskForms`
  value), `keyring.reset_entry` (one entry of `GET /keyring`: `id` `<npcId>.reset`, `kind`
  `password`, `source` `helpdesk`, `label` `Reset`, plus the keys a captured entry has today,
  `credential_keyring.rb:316-323`), `keyring.password_changed`, `login.mfa_required_own_code`,
  `login.mfa_required_own_push`, `device.own`, `device.own_used`, `device.unenrolled`,
  `device.no_device`, `prompt.waiting_own`, `phone.own`, `phone.own_number_match`,
  `phone.no_phone`, `approve.own_passed`, `approve.cancelled`, `verify.own_passed`. For the
  S8a-shaped entries copy the key sets S8a's controller tests assert
  (`test/controllers/break_escape/mfa_*_test.rb`); do not invent keys.
  - Ruby helper: `assert_answer_shape(name, response)` checks the status, the exact key set at
    every level, and equal values except at `vary` paths (there: same type). It records each name
    it was asked for, so a test can assert every entry was produced.
  - Node helper: `answer(name)` returns a deep copy of `{ status, body }`; `answerWith(name, patch)`
    lets a test change ONLY `vary` paths and throws on any other path.
  - `helpdesk-answer-shapes.test.mjs`: the file parses, every entry has a status and body, every
    `vary` path exists, the helper's guard works.
  - `helpdesk-no-handwritten-answers.test.mjs`: reads each S8b client test file (the `.test.mjs`
    files named in units 07, 08, 09, 16, 19, 20, 21, 22; a missing file is skipped until it exists)
    and fails if it does not import the helper, or if its text contains any of the answer keys
    (`granted`, `triesLeft`, `retryIn`, `lockoutPcIds`, `ownPhone`, `enrolled`, `typeToSignIn`,
    `mfaRequired`, `promptsSent`) as an object-literal key.
- **Done when:** both node tests pass. Hand on the entry names. You are also the owner of later
  corrections to `SHAPES`.

### Unit 05: schema and validator (wave 2)

- **Files:** `scripts/scenario-schema.json` (your blocks only), `scripts/validate_helpdesk.rb` (new),
  `scripts/validate_scenario.rb` (the lines in section 3's table), `scripts/validate_mfa.rb`
  (remove `mfa_not_built` and its call; add one guard so the `:233` warning is skipped when the
  scenario has a `helpdesks` key), `test/js/validator-helpdesk.test.mjs` (new),
  `test/js/validator-mfa.test.mjs` (remove ONLY its "not built yet" cases).
- **Build:**
  - Schema: top-level `helpdesks` (`x-id-map`, closed entries, `x-serverOnly`,
    `x-servedBy: "bootstrap helpdeskForms"`, `npc` with `x-ref: "npc"`); `creds.recovery` (map of
    strings) and `creds.resetPassword`, both `x-serverOnly`, beside `creds.mfa`; `helpdesk` on
    `#/definitions/socialPretextAsk` (`:3788`); the item type `helpdesk_form` with `desk`,
    documented the way `code_device` is.
  - Errors: a desk `npc` that is not a room NPC, or serves two desks; an unknown `verify` or
    `resets` value; `maxTries` or `minCorrect` out of range; `minCorrect` above the number of
    questions; `verify: "questions"` with no questions; a `questions` id with no `questionLabels`
    entry (the form could not ask it); a label over 40 or a recovery value over 64 code points; a
    `questions` id missing from the `recovery` of an account that has a `resetPassword` or sits
    under an MFA policy; `resets` naming `password` when no account has a `resetPassword`; a
    `resetPassword` equal to that account's `password`; a `resetPassword` value that appears in
    any ink (reuse the rule `creds.password` has: find it by its message); a pretext ask, an ink
    tag `#helpdesk_request:` or a `helpdesk_form` item naming a desk that does not exist; a
    `helpdesk_form` item that is not in a sign-in PC's contents; the ink tag in a story that is
    not that desk NPC's.
  - The lock-for-good rule, error half (A2), only in a scenario with `helpdesks`: for a policy
    with `mfa: "code"` and `maxAttempts`, each admitted enrolled account that no desk covers for
    `password` (`HM.covers?`) raises the WARNING; it is an ERROR when that account is the PC's
    only admitted account and the PC has no way round (no session token, help invite, saved
    connection of an exempt account, technique session, or claimable owner screen: the list
    `validate_mfa.rb` already prints as information lines; call its helper, do not copy it).
  - Warnings: answers the player cannot find (`verify: "questions"` where a recovery value of a
    covered account appears in no readable text, feed post, document or ink line the player can
    reach: the walk `lib/break_escape/npc_habits/clues.rb` does for password clues); a callback
    nobody can take (the owner declares no phone item, or `MM.held_item_sources` does not list
    it); a desk that resets `mfa` when no account is under an MFA policy; a `none` desk (stated
    as "grants to anyone who asks", so an author sees it).
  - Information lines: per desk, its rule, what it resets and which accounts it covers; and the
    MFA "ways round" line gains "a helpdesk that resets mfa" where one covers the account.
- **Tests:** one fixture per error, warning and information line, and a clean one; a scenario with
  none of the fields gets no line from the new check; `test_ops_mfa` validates exactly as before.
- **Done when:** your files; unmodified `node test/js/ops-unchanged-validator.test.mjs` with no new
  line for any shipped scenario (if one appears, report and stop).

### Unit 06: dungeon graph (wave 2)

- **Files:** `scripts/generate_dungeon_graph.rb`, `test/js/dungeon-graph-helpdesk.test.mjs` (new).
- **Build:** one block after the MFA block. For each desk and each account it covers
  (`HM.covers?`): a node for the desk grant, labelled with the desk NPC's name and "resets
  password" or "resets second step". A `password` grant is a key source for every sign-in lock
  that admits the account. An `mfa` grant is a source for that account's `second step` edge
  (beside the device or phone edge at `:1892-1905`). The grant's own requirements: for
  `questions`, the readable homes of the answers (the objects or posts unit 05's walk finds; share
  the lookup through `HM` or the clues module, not a copy); for `callback`, the owner's phone
  item. No answer, password or code in any label.
- **Done when:** your test; unmodified every `test/js/dungeon-graph-*.test.mjs`;
  `scripts/lock_key_diff.rb` output unchanged for every scenario without the fields.

### Unit 07: request form scene (wave 2)

- **Files:** `JS/minigames/helpdesk-request/helpdesk-request-minigame.js`,
  `public/break_escape/css/helpdesk-request-minigame.css` (new), the one link line in
  `app/views/break_escape/games/show.html.erb`, `JS/minigames/index.js`,
  `JS/systems/minigame-starters.js`, `JS/systems/minigame-registry.js`,
  `test/js/helpdesk-request.test.mjs` (new), `test/js/playtest-shellx-open-wait.test.mjs`.
- **Build:** `HelpdeskRequestMinigame`, modelled on `JS/minigames/concern-form/concern-form-minigame.js`
  (a paper form that extends `SocialOverlayScene` and shows the framework X). Registered as
  `helpdesk-request`; a starter registered for object type `helpdesk_form`, taking
  `{ deskId, pcId? }`. Fields: username; a choice of what is asked for, only when the desk's
  `resets` has both; one text field per `questionLabels` entry; Send. It reads the desk's form
  from `HelpdeskClient.formFor(deskId)` and sends through `HelpdeskClient.send` (unit 08's API,
  given there; reach the module the way `code-device` reaches `MfaClient`). Results on the form:
  granted password: "Password reset. New password:" and the password, with "It is in your
  sign-ins."; granted second step: "Sign-in approvals now come to your phone."; refused: "The desk
  could not verify you. Tries left: N."; blocked: "The desk is not taking requests for that
  account. Try again in N minutes." (minutes rounded up); unavailable: "The desk cannot take
  this request now."; anything else: "The request could not be sent." A desk with no form shows
  the last line. Maximum field length 64. Closing is a normal close (so a chat it was opened from
  returns).
  - Overlay list: with the framework X the scene is NOT on the pinned no-X list. Add one assertion
    that `helpdesk-request` is not on it, and leave the count alone. If you find the scene must
    hide the framework X, add the name, raise the count by one from whatever it is that day, and
    say so.
- **Tests:** every answer comes from `SHAPES`. The fields drawn for a form with one and with two
  resets; each result line; the password is shown only for `helpdesk.granted_password`; hostile
  labels and a hostile password render as text; `pcId` is passed through when given and absent
  when not; nothing is sent with an empty username.
- **Done when:** your tests; unmodified `node test/js/ops-log-viewer.test.mjs` and every other test
  that reads `minigames/index.js`, `minigame-starters.js` or `minigame-registry.js`.

### Unit 08: helpdesk client (wave 2)

- **Files:** `JS/systems/helpdesk-client.js`, `test/js/helpdesk-client.test.mjs` (new).
- **Build:** a leaf module with NO imports, shape of `mfa-client.js`.
  - `configure({ request, emit, setGlobal, forms, onGranted })`; with nothing configured it finds
    its defaults lazily on `window` (the request function `mfa-client` was given, the event
    dispatcher, the globals setter, `window.gameScenario.helpdeskForms`). Say in your report
    exactly which globals you used.
  - `formFor(deskId)`: `{ npc, resets, questionLabels }` or null.
  - `send({ deskId, username, what, answers, pcId })`: `POST helpdesk/request`; resolves
    `{ result, body }` where `result` is `granted`, `refused`, `blocked`, `unavailable` (as named)
    or `error` (for `bad_request`, `not_found`, a network failure or an unreadable answer). It
    then sets the global `helpdesk_<deskId>_result` to `result`, emits `helpdesk_answered`
    `{ deskId, result }` plainly and as `helpdesk_answered:<deskId>`, and on a grant calls
    `onGranted(body)`. The default `onGranted` refreshes the keyring and, when the body has
    `lockoutPcIds`, reseeds the "lockout seen" marks (`reports.seedLockouts`,
    `JS/systems/npc-reports.js:343`) through whatever `window` handle those have. The password is
    never stored by this module and never put in a global or an event.
- **Tests (answers from `SHAPES`):** each result; the global and both event forms; no password in
  the global, the event payload or module state; `onGranted` only on a grant; `lockoutPcIds`
  reseeded; `pcId` omitted from the body when not given.
- **Hand on:** the API and the globals, for units 07, 20, 21, 22.

### Unit 09: MFA client own forms (wave 2)

- **Files:** `JS/systems/mfa-client.js`, `test/js/mfa-client-own.test.mjs` (new).
- **Build:** `readDevice({ npcId })` calls `GET /mfa/device?npc_id=` and stores
  `lastRead = { npcId, code, source: 'own', deviceId }`; `readDevice({ itemId })` is unchanged
  except that an `enrolled: false` answer already clears a `lastRead` from that device (keep it).
  `phone({ own: true })` calls `GET /mfa/phone?own=1`. `approve` is unchanged. An approval whose
  pending note says `ownPhone` emits `mfa_approved` with `by: 'own_phone'`.
- **Tests (answers from `SHAPES`):** `codeFor` answers the own code only for a pending note with
  `ownPhone` and the same `npcId`; an item read never fills an `ownPhone` pane and an own read
  never fills an item pane; `device.unenrolled` clears the item read; the own phone list.
- **Done when:** your test; unmodified `mfa-client.test.mjs`, `pc-sessions-mfa.test.mjs`,
  `code-device.test.mjs`, `authenticator-live.test.mjs`.

### Unit 10: server concern (wave 2)

- **Files:** `app/models/break_escape/helpdesk_access.rb` (new), `GM` (ONE line:
  `include HelpdeskAccess`, after `include MfaSignIn` at `:16`),
  `test/models/break_escape/helpdesk_access_test.rb` (new).
- **Build:** a concern (shape of `MfaSignIn`).
  - Accessors: `account_resets` and `helpdesk_tries` (`player_state[key] ||= {}`; a non-Hash is
    replaced); `account_reset?(npc_id, what)`.
  - `effective_password(npc)` (public): `creds.resetPassword` once `account_reset?(id, 'password')`,
    else `creds.password`. Nothing calls it yet (unit 11).
  - `login_lockout_keys_for(npc)`: every key in `loginFailures` and `loginLockouts` whose
    `AccessIdentities.lockout_key_parts` username is this account's normalised username.
  - `note_typed_sign_in!(npc_id)`: sets `typed` when the account has a password reset; no-op
    otherwise. Nothing calls it yet (units 11, 14).
  - `request_helpdesk!(desk_id, username, what, answers, pc_id = nil)`: checks 2 to 7 of 4.3,
    the writes, the rows and `save!`, answering `{ status:, body: }` (check 1 is the
    controller's). Time through `mfa_now`. The tries cap for non-account usernames.
  - `helpdesk_forms_for_client` (`HM.forms(scenario_data)`); `helpdesk_keyring_entries` (one
    entry per account with a password reset, the `keyring.reset_entry` shape).
  - Secret source `:helpdesk`: every account's `creds.resetPassword`. Register it from this file
    if the existing sources' pattern allows it at load; if it must sit with the others in
    `ops_log.rb`, report the one line instead of editing that file.
- **Tests (model level, time frozen):** each check in order (an earlier failure wins over a later
  one); unknown username and wrong answers give equal bodies and rows of the same shape; the
  stop at `maxTries`, `blocked` with `retryIn`, served again after 300 s with the count at 0; a
  grant deletes the tries entry; a password grant clears the account's lockout at two PCs and
  leaves another account's; a second-factor grant zeroes `wrong`, removes `closedAt` and leaves
  lockouts; a repeat of a grant writes and logs nothing and leaves a lockout earned since;
  `callback` with and without the held phone; `none`; a knocked-out or unmet desk NPC; the
  `pc_id` cases at model level (open, locked, none, not a sign-in PC); a blocked desk asked twenty
  times stores ten rows; hostile `username` and `answers` (long, HTML, control characters) are
  cut and cleaned, echoed nowhere, stored only as the normalised key; the non-account cap.
- **Done when:** your test; `bin/ops-golden-compare` (the `include` must change nothing).

### Unit 11: `game.rb` wiring (wave 3)

- **Files:** `GM`, `app/models/break_escape/network_access.rb`,
  `test/models/break_escape/helpdesk_sign_in_test.rb` (new).
- **Build:** (a) `GM:3640` reads `effective_password(npc)`. (b) In `attempt_login!`, immediately
  before `start_login_session!`, call `note_typed_sign_in!(npc['id'])`. (c) In
  `filtered_scenario_for_bootstrap` (`GM:2427`), one line adding `helpdeskForms` when
  `helpdesk_forms_for_client` is not nil. (d) `helpdesks` joins `WITHHELD_SCENARIO_KEYS`.
- **Do NOT:** touch `ACCESS_STATE_DEFAULTS`; change any other reader of `creds.password` (a
  post-it, an earlier capture and a cracked hash keep the authored value on purpose).
- **Tests:** after a reset the old password is refused and counted, the new one signs in and sets
  `typed`; before a reset the `resetPassword` is refused; a lockout cleared by a grant lets the
  new password in at the once-locked PC; the bootstrap has `helpdeskForms` with exactly three
  keys per desk and no `helpdesks`; a scenario with no desk has neither key; a forged sync body
  carrying `accountResets` or `helpdeskTries` changes nothing (if it does, report which list the
  two names must join; do not guess).
- **Done when:** your test; `bin/ops-golden-compare`; unmodified the sign-in controller tests
  (`grep -l "attempt_login\|/login" test/controllers`).

### Unit 12: keyring and saved connections (wave 3)

- **Files:** `app/models/break_escape/credential_keyring.rb`,
  `app/models/break_escape/credential_login.rb`,
  `test/controllers/break_escape/helpdesk_keyring_test.rb` (new).
- **Build:** `keyring_for_client` also lists `helpdesk_keyring_entries` (one line beside the
  `implicit_keyring_entries` call at `:119`). In `attempt_credential_login!`, after the
  `second_step` refusal and before the session write: for a kind flagged `password: true`
  (`saved_connection`), when the account has a password reset and `typed` is not set, answer 422
  `{ success: false, typeToSignIn: "password_changed" }`: no session, nothing counted, no row.
  `token` and `assist_invite` are untouched.
- **Tests (assert `keyring.reset_entry` and `keyring.password_changed` with the Ruby helper):** the
  entry appears after a grant and not before; the keyring `rev` changes with it; a saved
  connection works before a reset, is refused after it, and works again once the new password
  has been typed at ANY PC; at an MFA PC the answer stays `second_step`; a token still signs in.
- **Done when:** your test; unmodified the keyring controller tests and `mfa_keyring_test.rb`;
  `bin/ops-golden-compare`.

### Unit 13: controller, request route (wave 3)

- **Files:** `app/controllers/concerns/break_escape/helpdesk_actions.rb` (new), `GC` (two lines),
  `config/routes.rb` (`post 'helpdesk/request'` beside the `mfa/*` routes, `:38-42`),
  `app/policies/break_escape/game_policy.rb` (`helpdesk_request?` delegating as `mfa_verify?`
  does, `:97`), `test/controllers/break_escape/helpdesk_request_test.rb`,
  `test/controllers/break_escape/helpdesk_answer_shapes_test.rb` (new).
- **Build:** the action lives in the new concern (`BreakEscape::HelpdeskActions`), so `GC` gains
  only the `include` and the action's name in the `set_game` list (`:27-28`). `no-store` on every
  answer; check 1 of 4.3 (size before anything is read from the body); then
  `with_game_lock { @game.request_helpdesk!(...) }`. If the engine does not autoload
  `app/controllers/concerns/break_escape/`, report it before choosing another home.
- **Tests:** the plan's helpdesk cases through the real route: a request with a `pc_id` granted
  with a keyboard session, a remote session and a technique session at that PC (one case each);
  `unavailable` with no session, a session only at another PC, a locked session, and a `pc_id`
  that is not a sign-in PC (the last two bodies equal); in person with no session; a non-string
  or 65-code-point `pc_id` and a body over 4 KB are `bad_request`; per-role access for the policy
  method; the rows; the secret-guard case (a test-only event, registered and removed in `ensure`,
  whose row holds a `resetPassword` is refused with the guard's `secret in` error).
  `helpdesk_answer_shapes_test.rb` produces every `helpdesk.*` entry of `SHAPES` through the real
  route and asserts it with `assert_answer_shape`, then asserts none was missed.
- **Done when:** your tests; `bin/ops-golden-compare`.

### Unit 14: sign-in re-enrolment (wave 3)

- **Files:** `MS`, `test/models/break_escape/mfa_sign_in_reenrol_test.rb` (new).
- **Build:** `mfa_reenrolled?(npc_id)` answers `account_reset?(npc_id, 'mfa')` and stays private.
  `mfa_step_for`: kind `code` with no device declared is no longer `none` when re-enrolled. The
  `mfaRequired` answer (built in `issue_mfa_challenge!`, `MS:281`) gains `ownPhone: true` when
  re-enrolled. `verify_sign_in_code!` passes device id `"own:#{npc_id}"` when re-enrolled.
  `mfa_device_answer(item_id)`: for a held device whose owner is re-enrolled and
  `device_in_use?(owner)` is false, answer the `enrolled: false` shape with no code (and compute
  none). New `mfa_own_device_answer(npc_id)`: `:no_device` unless re-enrolled (and unless some
  policy declares `mfa`: `:not_found`, as today); else the `device.own` shape. New
  `mfa_own_phone_answer`: `:no_phone` unless any account is re-enrolled; else the requests of
  every re-enrolled account. An approval by a re-enrolled account writes `approver: 'own_phone'`.
  `device_in_use?(_npc_id)`: one private method answering false, with the comment "S8c seam: a
  lock step that still names this owner's device" (A8). Call `note_typed_sign_in!` in the two
  pass functions (`mfa_code_passed!` `:304`, `mfa_push_passed!` `:250`) before the session write.
- **Do NOT:** edit `MA`; add a second clock.
- **Tests (time frozen):** each change above; an own code works once per window like any code and
  counts wrong codes the same way; the old device's code no longer signs in; a re-enrolled push
  account waits as `own_phone` and is approved with no phone held; a re-enrolled number-matching
  account needs the right number; an account that is NOT re-enrolled is refused the own forms;
  the route re-judge still runs first; a password reset at an MFA PC sets `typed` only when the
  second step passes.
- **Done when:** your test; unmodified `mfa_sign_in_code_test.rb`, `mfa_access_*_test.rb` and the
  five `mfa_*` controller tests; `bin/ops-golden-compare`.

### Unit 15: scenario files (wave 3)

- **Files:** `scenarios/test_ops_helpdesk/` (new: `scenario.json.erb`, `mission.json`, `ink/`,
  `PLAYTEST.md`, generated `dungeon_graph.*`), `test/js/helpdesk-scenario-click-paths.test.mjs` (new).
- **Build:** take `scenarios/test_ops_mfa/` as the model. Invented products and people.
  - Rooms: Front Office (start), Service Desk, Records.
  - Policies: `strict` (`maxAttempts: 3`, no `mfa`), `vault` (`mfa: "code"`, no `maxAttempts`),
    `ops` (`mfa: "push"`).
  - PCs: `front_pc` (Front Office; account `s.okoro`, whose password is on a readable note beside
    it; its contents hold `{ "type": "helpdesk_form", "id": "front_form", "name": "IT request form", "desk": "it_desk" }`);
    `records_pc` (Records, policy `strict`, admits Tess and Ugo); `vault_pc` (Records, policy
    `vault`, admits Vera); `ops_pc` (Service Desk, policy `ops`, admits Wim).
  - Accounts: Tess (the locked account: `recovery` answers readable, one on a feed post and one on
    a document in Records; `resetPassword`; a `saved_connection` credential to `records_pc` the
    player starts with); Ugo (the refused account: `recovery` answers written nowhere;
    `resetPassword`); Vera (code owner; her `code_device` loose on a Records desk; her phone
    handed over in her story; `recovery` not findable); Wim (push owner, high awareness, never
    approves, no holdable phone; `recovery` answers readable on the same two sources' pattern).
  - Desks: `it_desk` (NPC Ria, `verify: "questions"`, two questions, `minCorrect: 2`,
    `maxTries: 3`, `resets: ["password", "mfa"]`); `id_desk` (NPC Omar, `verify: "callback"`,
    `resets: ["mfa"]`).
  - Ria's ink: one choice "Ask for an account reset" whose line carries
    `#helpdesk_request:it_desk`, then a knot that reads the global `helpdesk_it_desk_result` and
    says the one matching line of section 3. Omar's the same for `id_desk`.
  - A phone contact "IT service line" with ONE pretext ask, no verification, whose grant names
    `helpdesk: "it_desk"` (the smallest block the validator accepts; model its keys on the
    structure of `ca03_helpdesk_reset`'s block without copying its lines). If a minimal block
    cannot be made to validate, leave the call out, say so, and unit 21's own test carries it.
  - `logSources` so rows can be read. One `eventMappings` entry, LAST: `helpdesk_answered:it_desk`
    to a one-line bark.
  - `PLAYTEST.md`: the beats of section 6, each with its click path, what the player sees and
    what `verify-run.rb` prints; no hand-built or forged request in it.
- **Tests:** `helpdesk-scenario-click-paths.test.mjs` reads the rendered scenario and its ink and
  asserts, for every row of the table in 4.5, that the authored hook exists (the tag in the right
  NPC's story, the form item in `front_pc`, the ask naming the desk, the note with the password,
  the loose device, the phone give).
- **Done when:** `ruby scripts/validate_scenario.rb scenarios/test_ops_helpdesk/scenario.json.erb`
  shows no error (state every warning: "answers the player cannot find" is expected for Ugo and
  Vera); `ruby tools/check_mapping_index_drift.rb`; your node test. Hand on the game-making
  command (`swap-scenario-game.rb`, shared brief).

### Unit 16: own-phone scenes (wave 3)

- **Files:** `JS/minigames/code-device/code-device-minigame.js`, its CSS,
  `JS/minigames/authenticator/authenticator-live-minigame.js`, `test/js/own-phone-scenes.test.mjs` (new).
- **Build:** `code-device` started with `{ own: true, npcId }` draws the player's phone frame
  (not the small device), titled "My phone", and reads through `MfaClient.readDevice({ npcId })`;
  everything else as today. `authenticator-live` started with `{ own: true }` lists
  `MfaClient.phone({ own: true })`. Neither is a new scene, so the overlay list does not change.
  `authenticator-minigame.js` (the parent) is NOT edited; S8a's snapshot test stays green.
- **Tests (answers from `SHAPES`):** `device.own` shows six digits and notes the read as `own`;
  `device.own_used` greyed and not noted; `device.unenrolled` on the ITEM form shows "No longer
  in use" with no digits; the own phone lists `phone.own` and `phone.own_number_match` cards;
  Approve and a wrong number.
- **Done when:** your test; unmodified `code-device.test.mjs`, `authenticator-live.test.mjs`,
  `authenticator-snapshot.test.mjs`.

### Unit 17: leak scanner rules and `verify-run` (wave 3)

- **Files:** `tools/playtest/lib/access_leak_scanner_helpdesk.rb` (new),
  `tools/playtest/lib/access_leak_scanner.rb` (the four lines of section 3's table),
  `tools/playtest/verify-run.rb` (one block),
  `test/controllers/break_escape/access_leak_scanner_helpdesk_test.rb`,
  `test/models/break_escape/helpdesk_verify_run_test.rb` (new).
- **Build:** a module included into `AccessLeakScanner`, with `scan_helpdesk(body, row, add)`.
  Rules are ADDED, structural, earned PER THING, and fail closed:
  1. Key names that are a leak wherever they appear in any answer: `recovery`, `resetPassword`,
     `helpdesks`, `accountResets`, `helpdeskTries`, `minCorrect`, `maxTries`.
  2. `helpdeskForms` may appear only at the top level of the bootstrap; each entry may hold only
     `npc`, `resets`, `questionLabels`; any other key (`verify`, `questions` included) is a leak.
  3. A `POST helpdesk/request` answer may hold only the keys of its `SHAPES` entry for its status
     and `reason`; any other key is a leak (so "which answers were right" cannot ride along).
  4. A reset password VALUE (every account's `creds.resetPassword`, read from the scenario) is a
     leak anywhere, except: (a) as `password` in a 200 `helpdesk/request` answer with
     `granted: true` and `what: "password"`; that row EARNS the one account whose reset password
     it equals (a value shared by two accounts earns neither); (b) after that row, as the secret
     of the `GET /keyring` entry whose id is `<that npcId>.reset`. Before the earning row, or for
     another account, or in any other answer, it is a leak.
  5. The own-phone forms (`deviceId` starting `own:`, `ownPhone: true`, a `GET mfa/phone` row whose
     query has `own`) are a leak unless a 200 `helpdesk/request` answer with `granted: true` and
     `what: "mfa"` was seen earlier in the capture. Check what the capture holds for a POST's
     request body: if it carries the username, tie the allowance to that account; if it does not,
     keep the weaker "an earlier mfa grant exists" rule and WRITE THE LIMIT in the file header
     and in your report. Never assume the planned recorder change.
  6. The one hook in the main file: where S8a judges a `GET mfa/device` answer, an `own:` device
     answer and an `enrolled: false` answer are handed to this module (which allows exactly their
     `SHAPES` key sets under rule 5); the S8a rule for item devices is not changed.
  - `verify-run.rb`: per account with an entry, `reset password yes/no`, `reset second step yes/no`,
    `new password typed yes/no`; per tries entry, the desk id, the count and `stopped yes/no`.
    Words, counts and ids only: never a password, an answer or a username that is not an account.
- **Tests:** rows built from `SHAPES` (clean run reports nothing); then each rule broken one way
  at a time is reported: a reset password in the bootstrap, in a refusal, in the keyring before
  the grant, in the keyring under another account's entry; a `recovery` key; an extra key in a
  form entry and in a refusal; an own code with no earlier grant; a grant row with status 422 or
  with `granted: "true"` (a string) earns nothing. Every existing scanner test unmodified.
- **Done when:** your tests and the five `access_leak_scanner_mfa_*` tests pass. This unit is
  reviewed straight after wave 3.

### Unit 18: controller, own forms (wave 4)

- **Files:** `GC` (`mfa_device` `:1568`, `mfa_phone` `:1619` only),
  `test/controllers/break_escape/helpdesk_reenrol_test.rb` (new),
  `test/controllers/break_escape/helpdesk_answer_shapes_test.rb`.
- **Build:** `mfa_device` takes `npc_id` when `item_id` is absent (`mfa_own_device_answer`); both
  given is the 404. `mfa_phone` with `own=1` (and no `npc_id`) answers `mfa_own_phone_answer`;
  both given is the 403. Statuses and bodies as today.
- **Tests:** the plan's cases: a re-enrolled account's old device answers `enrolled: false` with no
  code; the own code signs in at a `code` PC; a second-factor grant reopens a closed code step at
  once; a second-factor grant leaves lockouts alone; the own phone list is refused with no
  re-enrolled account; approve with no phone held for a re-enrolled account, refused for another;
  the secret-guard case for an own code. The shapes test gains every remaining `SHAPES` entry
  (`login.*`, `device.*`, `prompt.*`, `phone.*`, `approve.*`, `verify.*`, `bootstrap.*`,
  `keyring.*`) through the real routes, so by the end of this unit every entry has been produced.
- **Done when:** your tests; unmodified the five `mfa_*` controller tests; `bin/ops-golden-compare`.

### Unit 19: "My phone" buttons (wave 4)

- **Files:** `JS/minigames/password/password-minigame.js`, its CSS (the button's rules only),
  `test/js/mfa-signin-my-phone.test.mjs` (new).
- **Build:** when the pending note says `ownPhone`, the code pane (`showCodePane`, `:2844`) shows
  "My phone" INSTEAD of "Use <item>", and the push pane (`showPushPane`, `:2945`) shows it INSTEAD
  of "Check <owner>'s phone". It starts `code-device` or `authenticator-live` with `own: true` as
  a child, exactly as `useCodeDevice` (`:2917`) and `useLivePhone` (`:3107`) do. On return the
  field is filled from `codeFor` (never submitted for the player), or `takeCompleted` signs in.
  Also close R5-3 while here: one test that the push pane's back button ("Use a different
  account", `:2983`) returns to the password pane.
- **Tests (answers from `SHAPES`):** the button per pane and never both buttons; child hand-over
  for both scenes (X returns to the pane; approval returns signed in; a forced close releases
  once with no failure event); the field filled only from an own read.
- **Done when:** your test; unmodified `mfa-signin-pane.test.mjs`, `mfa-signin-push-pane.test.mjs`,
  `mfa-child-handover.test.mjs` and the files unit 15 of S8a listed.

### Unit 20: ink tag opener (wave 4)

- **Files:** `JS/minigames/helpers/chat-helpers.js`, `test/js/helpdesk-ink-tag.test.mjs` (new).
- **Build:** a `helpdesk_request` case beside `trigger_minigame` (`:242`): it asks
  `window.inkMinigameLaunch` to open the `helpdesk_form` starter with `{ deskId }` and no `pcId`,
  with `trigger_minigame`'s timing (after the line is read; the chat returns on a normal close).
  An unknown desk warns and opens nothing.
- **Tests:** using Ria's real compiled story from `scenarios/test_ops_helpdesk/ink/`: the choice
  produces the tag, the launcher is asked for the right type and desk, no `pcId`; after
  `HelpdeskClient` sets the global from a `SHAPES` answer the story's next line is the matching one.

### Unit 21: pretext opener (wave 4)

- **Files:** `JS/systems/pretext-judge.js`, `JS/minigames/person-chat/person-chat-pretext.js`,
  `test/js/helpdesk-pretext-open.test.mjs` (new).
- **Build:** where a granted ask's grants are applied (D11), an ask with `helpdesk: "<deskId>"`
  also opens the form for that desk (no `pcId`) through the same launcher. The verdict stays the
  client's and grants nothing by itself: the server decides when the form is sent. An ask without
  the key behaves exactly as before.
- **Tests:** a granted ask with the key opens the form once; a pending or refused one does not; an
  ask without the key opens nothing; `ca03_helpdesk_reset`'s real ask (read from its scenario
  file) still sets its global and opens nothing. Unmodified the existing pretext tests
  (`grep -l pretext test/js`).

### Unit 22: desktop opener (wave 4)

- **Files:** `JS/minigames/container/container-minigame.js`, `test/js/helpdesk-desktop-form.test.mjs` (new).
- **Build:** on a PC desktop, clicking an icon whose item type is `helpdesk_form` opens the form
  with `{ deskId: item.desk, pcId: <this PC> }` as a child that returns to the desktop (the way a
  desktop note opens `text-file`; find `returnTo` in this file). The item is not takeable. If the
  desktop already opens any item whose type has a registered starter, the build may be a few
  lines: say what you found.
- **Tests:** with `front_pc`'s real contents from the scenario file: the icon is drawn with its
  name; a click starts the scene with the desk and the PC id; closing returns to the desktop; the
  item cannot be taken. Unmodified the `container-*.test.mjs` files.

### Unit 23: scenario tests (wave 5)

- **Files:** `test/controllers/break_escape/ops_helpdesk_scenario_test.rb`,
  `test/controllers/break_escape/ops_helpdesk_no_exposure_test.rb`,
  `test/fixtures/files/ops_helpdesk_real_capture_rows.jsonl` (new).
- **Build:** `ops_helpdesk_scenario_test.rb` plays every beat of section 6 through the real routes
  on the real file, time frozen, asserting answers, state and rows, and the five-minute lift.
  It also WRITES the answers it really received, in the capture row format the scanner reads
  (model: how `ops_mfa_real_capture_rows.jsonl` was made), when run with `CAPTURE=1`; the
  committed fixture is that output. `ops_helpdesk_no_exposure_test.rb`: at each step no answer
  (bootstrap, room answers, sync, `GET /container`, `GET /network`, `GET /keyring`, sign-in and
  helpdesk answers) holds a `recovery` key, a recovery map, a reset password not yet granted,
  `verify`, `minCorrect`, `maxTries`, a desk's `questions` list, `accountResets` or
  `helpdeskTries`; a forged sync body carrying the two state keys changes nothing; the typed
  username is echoed in no answer.
- **Done when:** your tests; `bin/ops-golden-compare`; hand on any beat a headless run cannot do.

### Unit 24: scanner on real answers (wave 6)

- **Files:** `test/controllers/break_escape/access_leak_scanner_helpdesk_real_test.rb` (new), and
  the two scanner files of unit 17 for fixes only.
- **Build:** the "real answers" test: the scanner over unit 23's real capture reports NOTHING;
  the same capture doctored each way of unit 17's list reports each; the grant row removed makes
  the later keyring entry and own-phone rows leaks (fails closed). If the clean run reports
  something, decide which is wrong: the engine (report it) or a rule too narrow for a real,
  proved answer (fix the rule by tying it to the proof in the capture, never by skipping it), and
  list every such change with its proof row. Apply the first review's findings.
- **Done when:** your test, unit 17's tests and the five `access_leak_scanner_mfa_*` tests.

### Unit 25: docs (wave 6)

- **Files:** `README_scenario_design.md` (row A23), `docs/ACCESS_AND_NETWORKS.md` (an A23 section;
  correct the A22 lines that say the S8b fields are "not built yet").
- **Build:** the fields of 4.1, the three rules, what a password reset and a second-factor reset
  change, the five-minute stop, the three ways to open the form, what is hard (the rule, the
  reset password) and what is best effort (being in the conversation is not checked beyond "met
  and conscious"; a `none` desk grants to anyone, by design), the validator lines, the graph
  nodes. Game-design level only. A "plan corrections" list in your REPORT (not in the plan):
  D1 to D17 and the rulings of section 7.

## 6. Playtest outline

Run by a scripted browser player through `window.__test` on a fresh game of `test_ops_helpdesk`
(made with `swap-scenario-game.rb`), from unit 15's `PLAYTEST.md`. Every beat is checked twice:
what the browser was sent (the leak scanner over captured answers) and what the server recorded
(`verify-run.rb`). No hand-built or forged request; the hostile cases are Rails tests (units 10,
13, 18), named in `PLAYTEST.md` in one line. The run never waits five minutes and never computes a
code.

| # | Beat | Click path | Expect |
|---|---|---|---|
| 1 | Lock the account | Records: click `records_pc`; type Tess's username and a wrong password three times | "Locked out" on the third. Server: lockout held for Tess at `records_pc` |
| 2 | Refused, then stopped | Service Desk: talk to Ria (E); "Ask for an account reset"; on the form type Ugo's username, "Password", two wrong answers; Send; repeat twice | "Tries left: 2", then 1, then 0; Ria's refusal line on closing. A fourth Send: "not taking requests for that account". Server: tries 3, stopped yes |
| 3 | An unknown name looks the same | Same form, a username nobody has, any answers | The same refusal line and count as beat 2's first try |
| 4 | Find the answers | Records: click the staff file on the desk and read it; open the phone, open the feed, read the team post | Two facts on screen (they are public by design) |
| 5 | The reset | Talk to Ria; the form; Tess's username, "Password", the two answers; Send | "Password reset. New password:" and the password; Ria's matching line. The keyring (K) lists a "Reset" sign-in for Tess. Server: reset password yes, lockout gone, typed no |
| 6 | The saved connection is stale | Click `records_pc`; on the sign-in screen choose Tess's saved connection | Notice "This password has been changed. Type the new one to sign in."; no session |
| 7 | Old out, new in | Same screen: type the OLD password (refused, one attempt counted), then the new one | Signed in at the once-locked PC. Server: typed yes. Sign out; the saved connection now signs in |
| 8 | Asking twice is harmless | Talk to Ria; the form; the same request again | The same granted form; server state unchanged |
| 9 | Over a PC | Front Office: read the note; click `front_pc`; sign in as `s.okoro`; click the "IT request form" icon; Wim's username, "Second step", his two answers (from the same file and post); Send | "Sign-in approvals now come to your phone." Server: reset second step yes for Wim |
| 10 | My phone, push | Service Desk: click `ops_pc`; Wim's username and password; on the push pane click "My phone"; Approve | The sign-in screen reopens signed in. Server: `approver own_phone` |
| 11 | No phone, no callback | Talk to Omar; "Ask for an account reset"; Vera's username; Send | Refused; Omar's refusal line |
| 12 | With her phone | Talk to Vera until she hands over her phone; talk to Omar; the same request | Granted. Server: reset second step yes for Vera |
| 13 | My phone, code | Records: click `vault_pc`; Vera's username and password; the code pane shows "My phone" and no "Use" button; click it; close the phone; the field is filled; Verify | Signed in. Server: `used` set for Vera |
| 14 | The old device | Take the code device from the Records desk; open the inventory; click it | "No longer in use", no digits |
| 15 | From a call | Open the phone; ring "IT service line"; "Request a reset" | The form opens when the ask is granted (close it without sending) |
| 16 | Checks | Run the leak check and `verify-run.rb` | No leak. The per-account and per-desk lines match beats 2, 5, 7, 9, 12 |

**Live proof** (real clicks and typing, keyless server on the tester's own port, a game made in
that run): beats 1, 2, 5, 6, 7, 9, 10 and 13, with screenshots of the empty form, the refused
form, the granted form with its password, the stale saved-connection notice, the desktop icon,
"My phone" on each pane and the phone showing the code; plus a reload after beat 5 (the keyring
entry and the cleared lockout survive).

## 7. Ambiguities and rulings

Builders build the recommendation. Each row says what changes if the owner rules otherwise.

| # | Question | Recommended | If the owner chooses otherwise |
|---|---|---|---|
| A1 | The plan extends `test_ops_mfa` and says no `test_ops_helpdesk` is built | A new `test_ops_helpdesk`, self-contained (it has its own `code` and `push` PCs). S8a's scenario, its tests and its real-capture fixture stay untouched, and S8c's branch cannot collide with it | Extend `test_ops_mfa`: unit 15 edits S8a's file, units 23 and 24 re-record S8a's capture fixture and re-prove its 15 beats, and S8a's `PLAYTEST.md` grows by 16 beats. More risk, no gain in coverage |
| A2 | The lock-for-good rule: warning in the table, error in the text "where the graph marks the sign-in required and the account its only key" | In a scenario with `helpdesks`: warning when no desk covers the account for `password`; ERROR when that account is also the PC's only admitted account and the validator's own "ways round" list for it is empty. "Required" is not computed: such a PC is treated as required. In a scenario with no `helpdesks`, S8a's warning stands unchanged | Use the graph's "required" mark: the validator must run or share the graph walk; one more unit after 06, owning both scripts, and a slower validator |
| A3 | How a "helpdesk form on a PC's desktop" is authored (the plan names no field) | A desktop item `type: "helpdesk_form"` with `desk`, in a sign-in PC's contents; clicking it opens the form with that PC's id | Leave the desktop path out: drop unit 22 and beat 9's first half; the server still takes `pc_id` (Rails-tested) but nothing in the client sends one |
| A4 | The plan withholds the `questions` ids, yet `questionLabels` is keyed by them | `questionLabels` is sent as authored (its keys are the ids; they are field names). Withheld: the `questions` LIST (which fields count), `minCorrect`, `verify`, `maxTries`. An author may add labels for fields that do not count | Send labels as an ordered list with opaque indexes: `HM.forms`, the form and `SHAPES` change; the server maps index to id. One extra day, little gained |
| A5 | A password request for an account with no `resetPassword` | Refused and counted, the same body as a wrong answer (fails closed; the validator already errors when NO account has one) | Validator error per account under a `password` desk: every covered account must carry one; simpler server, stricter authoring |
| A6 | `helpdeskTries` value: an integer, or a Hash once stopped | Always a Hash `{ 'n', 'stoppedAt'? }` | The plan's two shapes: two more branches in `HA`, no visible difference |
| A7 | Whether a grant clears the tries for that username | Yes: the entry is deleted (a caller who proved themselves starts clean) | Keep the count: a later wrong request can stop the desk sooner; one line and one test change |
| A8 | `device_in_use?` asks "each registered non-sign-in subject kind", which only S8c has | One private seam in `MS` answering false. Whoever merges the second of S8b and S8c makes it ask the lock subject and adds the plan's test ("`device_in_use?` keeps the old device's code live") | Build a registry now: an untested hook with no caller on this branch |
| A9 | Where the two state keys are declared | Lazy accessors in `HA`; `ACCESS_STATE_DEFAULTS` untouched, so `GM` and the golden fixtures do not move and S8c's edit to that Hash cannot conflict | Declare them in `ACCESS_STATE_DEFAULTS` as S8a did: one more `GM` line for unit 11, and a possible golden fixture change to explain |
| A10 | The form's base class and the overlay list | Modelled on `concern-form`, framework X shown, so NOT on the pinned list | A frame with its own X: the name joins the list and the count rises by one (unit 07 says which it built) |
| A11 | A second-factor reset for an account under no MFA policy | Granted and recorded (the rule decides, not the policy); it changes nothing in play; the validator warns about such a desk | Refuse as `unavailable`: one more check in 4.3 and a `SHAPES`-neutral test |
| A12 | Which stage completes A23 and edits the docs | Unit 25, at the end (H2 completes A23) | Docs after H1 too: a second doc unit owning the same two files in an earlier wave |
| A13 | Whether `mfa_reenrolled?` becomes public | Stays private (S8a's ruling); `HA` exposes `account_reset?` and `MS` asks it | Public: nothing else changes |

## 8. Security review points

1. `creds.recovery` and `creds.resetPassword` reach no answer except the granting one and the
   keyring entry it creates; the bootstrap carries three keys per desk and nothing else.
2. An unknown username and wrong answers are indistinguishable (status, body, row shape, timing of
   the count); the typed username is echoed nowhere.
3. The stop is per desk and username, bounded for non-accounts (200), and cannot strand a scenario
   (`retryIn`, five minutes).
4. The `questions` and `callback` rules read only server state; the client global grants nothing.
5. A password reset clears only that account's lockouts; a second-factor reset clears none.
6. The old password fails after a reset; a saved connection cannot outlive a reset.
7. The own-phone code and list are served only for a re-enrolled account, and re-enrolment moves
   the SIGN-IN step only.
8. `request_helpdesk!` and every `/mfa/*` write run inside `with_game_lock`.
9. No state key is writable by sync; no answer grew a list re-sent whole.
10. `config/routes.rb` and `game_policy.rb` gain one route and one method.

## 9. Open items

1. **Not verified by running anything.** This brief is from reading the plan, the S8a reviews and
   the code; no test was run.
2. **Unit 03:** whether the registry accepts the place kind `desk`, `as: { typed: }` and the result
   words was not checked; the unit reports rather than widening.
3. **Unit 10:** whether a secret source can be registered from the concern file at load is not
   known; the fallback is one reported line in `ops_log.rb`.
4. **Unit 11:** how a sync body is kept from writing a state key (S8a's three keys are protected
   somehow) was not traced; the test finds out and the unit reports.
5. **Unit 13:** engine autoloading of `app/controllers/concerns/break_escape/` is assumed (the
   folder `app/controllers/concerns/` exists and is empty).
6. **Unit 15:** a minimal pretext call block may not validate in a small scenario; the unit has a
   fallback (beat 15 then becomes unit 21's node test only).
7. **Unit 17, rule 5:** whether the capture holds a POST's request body decides how tightly the
   own-phone allowance is tied; the limit, if any, is written down. S8a's recorded limits (R5-1,
   R5-2, the sign-out then second sign-in limit) are not this stage's to fix.
8. **Unit 22:** how a desktop icon of a registered type opens today was not read; the unit reports.
9. **A8** needs one follow-up at merge time, whichever of S8b and S8c lands second.
10. **The overlay list count** is 17 on this branch; the orchestrator's note says 18 on `main`
    after another stage. Unit 07 changes no count under A10.
