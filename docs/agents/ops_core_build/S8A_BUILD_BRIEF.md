# S8a build brief: multi-factor sign-in (feature A22, steps M1a, M1b, M2, M3)

Written 2026-11-24 by the S8a designer. Read `docs/agents/OPS_CORE_BUILD_BRIEF.md` first; its rules
bind every builder here. Worktree `/data/be-ops-build`, branch `ops-mfa` (it holds S1 to S5a).

The design is `docs/achitechture/OPS_MFA_HELPDESK_PLAN.md` (cited as `P<line>`), stages M1a to M3
only. Builders do not need to read the plan: this brief carries what each unit needs. Where this
brief and the plan disagree on a name, a line number, a file or which stage holds a thing, THIS
BRIEF is right (checked against `ops-mfa` on the day). S8b (helpdesk, H1 and H2) is NOT built
here; section 2 lists the seams left for it.

Short names: `GM` = `app/models/break_escape/game.rb`, `GC` =
`app/controllers/break_escape/games_controller.rb`, `MA` = `app/models/break_escape/mfa_access.rb`
(new), `MS` = `app/models/break_escape/mfa_sign_in.rb` (new), `MM` = `lib/break_escape/mfa_model.rb`
(new), `JS` = `public/break_escape/js`. Line numbers are today's; re-find every anchor by name.

**No migration is needed.** All new state is keys inside `player_state`. If you find you need a
schema change, stop and report.

## 1. What S8a adds, in play

- A PC's policy may ask for a second step after a right password: `mfa: "code"`, `"push"` or
  `"push_number_match"`. An account is exempt only by `creds.mfa: false`.
- `code`: the player types the six digits shown on the owner's `code_device`, which they must
  hold (handed over in the owner's story, taken after a knock-out, found loose, or a start item).
- `push`: a request goes to the owner. A careless owner (`approvesPrompts: "pestered"`, the
  default at low awareness) approves on the third request; a careful one never does. A player
  holding the owner's phone approves it themselves.
- `push_number_match`: the owner never approves. Only a held phone works, by tapping the number
  the sign-in screen shows.
- A session token and a help invite skip the step. A saved connection to such a PC is refused
  with "type the password to sign in". Unlocking one's own locked session asks for the password
  only.

## 2. Plan drift and rulings

Checked at the plan line and the code. "Drift" means find by name; the design is untouched.

| # | Plan | Code on `ops-mfa` | What builders do |
|---|---|---|---|
| D1 | `attempt_login!` at `GM:3444-3503`; second step "between lines 3492 and 3494" | `GM:3615` to about `:3690`. Order today: route branch (three arms: `from_given`, `foothold`, keyboard), lockout (`:3655`), password compare (`:3660`), `pc_admits_account?` (`:3662`), `login_failures.delete(key)`, `start_login_session!` (`:3672`) | The second step goes after the `pc_admits_account?` refusal and BEFORE `login_failures.delete(key)` |
| D2 | `typed_route_refusal` "moved into a method" | Does not exist. The route judgement is inline, with a `from_given` arm (uses `from_route_refusal`) the plan does not mention | Unit 08 extracts all three arms into `typed_route_refusal(info, foothold:, from:, from_given:)`, answers unchanged. The pending record stores `fromGiven` as well as `from` |
| D3 | Lockout key "built inline in four places and split in two" (seven sites; `GM:3483, 3580, 3591, 4323`, `access_work.rb:1393`) | Built at THREE sites (`GM:3654`, `GM:3762`, `lib/break_escape/access_work.rb:1397`); split NOWHERE | `lockout_key` replaces the three. `lockout_key_parts` is still built and tested (S8b's `login_lockout_keys_for` needs it) |
| D4 | `effective_password(npc)` in the password step | Not built (S8b H1) | Leave `npc['creds']['password']`. Do not add `effective_password` |
| D5 | Account-kind check (A20, S5c) at admission | S5c is not built | Nothing. The step sits after `pc_admits_account?`, so S5c's check lands before it |
| D6 | `mfa_absent_test.rb` replays fixtures "captured from main" | The built mechanism is ONE replay test (`test/lib/ops_unchanged_replay_test.rb`) fed by `test/support/ops_unchanged_cases.rb`, captured by `lib/tasks/ops_unchanged.rake`; `privilege_*` fixtures already pin sign-in, lock, unlock and keyring sign-in for four scenarios | Unit 01 adds `mfa_*` cases and captures them from `ops-mfa` BEFORE any engine edit (a first capture, not a re-record). No `mfa_absent_test.rb`, no second replay test |
| D7 | Phone test "at three sites": `GC:3464-3475`, `GC:3442-3448`, `GM:1169-1174` | `GC:3671` (direct add from an NPC), `GC:3644` (room pickup), `GM:1179` (room add with no source). All test `SocialFeed::FRIENDFACE_PHONE` | Find by that constant |
| D8 | `OpsLog::EVENTS` | `BreakEscape::OpsLogEvents::EVENTS` (`lib/break_escape/ops_log_events.rb:24`); `write_log_row!` at `app/models/break_escape/ops_log.rb:332`; `note_issued_secret` at `:173` | Name only |
| D9 | `SHIPPED_HABIT_KEYS` in `npc_habits.rb` | `GM:7692` (`%w[screen print]`) | Do not add the two new keys to it |
| D10 | `start_login_session!` `GM:4388`; `claim_login_session!` `:3527`; `effective_policy` `:3360`; `ACCESS_STATE_DEFAULTS` `:3021`; `WITHHELD_NPC_KEYS` `:7376`; `npc_defeated?` `:2008`; `npc_room_drop_allowed?` `:2152`; `with_game_lock` `GC:2890`; client-item `owner` ban `GC:3304`; `credential_held_proof_holds?` `:42` | Now `GM:4709`, `:3709`, `:3524`, `:3056`, `:7680`, `:2023`, `:2176`; `GC:2982`; `GC:3504-3509` (`CLIENT_ITEM_FORBIDDEN_FIELDS`); `credential_keyring.rb:54` | Drift only |
| D11 | Keyring sign-in checks at `credential_login.rb:59-70` | `attempt_credential_login!` at `:32`; lockout `:70`, ended invite `:76`, expired token `:81`, session write `:87` | The refusal goes after `:81` and before `:87` |
| D12 | `signIn` at `pc-sessions.js:552-562`; `credentialRefusalReason` `:598-612`; password minigame error `:2492-2495` | `signIn` `:601` (422 mapping `:612-615`, `pc_signin_failed` `:620`); `credentialRefusalReason` `:153`; minigame `signIn` calls `:2693-2695`, error helper `signInErrorMessage` `:345` | Drift only |
| D13 | `authenticator` registered `minigames/index.js:213`; starter `minigame-starters.js:1310` | `:215`; `:1312`. `init` `:106`, `_appendCard` `:408`, `requestClose` `:437` hold | Drift only |
| D14 | Unit tests in `test/unit/` | Exists and is used | Pure-Ruby tests there; model tests in `test/models/break_escape/` |
| D15 | Technique-session cases "added once S3 exists" | S3 is on this branch | Built now (unit 17) |
| D16 | The log stream reader (L2, L3) | On main, not here. Rows are still written and guarded on this branch | Assert rows in `player_state`, not through a reader view |
| D17 | Plan file list has one concern, `mfa_access.rb` | n/a | This brief splits it in two files so builders do not collide: `MA` holds the subject functions (P286-315), `MS` holds what belongs to sign-in alone. Both are included in `Game` by unit 13 |
| D18 | Each of M1b, M2, M3 "ends playable" with its own beats | n/a | The feature scenario is built once (unit 22) after all server and client units, so the first scripted run covers all three kinds. Each unit's own tests are its proof until then |

### Seams left for S8b (do not build, do not block)

- `MS#mfa_reenrolled?(npc_id)`: one private predicate that answers `false`. Every place the plan
  says "re-enrolled" asks it. H2 changes its body.
- `accountResets` and `helpdeskTries` state keys, `effective_password`, the `password_changed`
  refusal on the server, the `npc_id` and `own=1` route forms, "My phone", `helpdesks`,
  `creds.recovery`, `creds.resetPassword`: NOT built. The validator fails loudly on the scenario
  fields (unit 10).
- The client already words both `typeToSignIn` reasons (unit 07), and the `mfa_prompt_approved`
  event already lists `own_phone` (unit 05), so S8b edits neither.
- `target_type` and `target_id` on the routes belong to the lock plan (S8c). Until then a request
  with them, or with no `pc_id`, gets the generic 422.

## 3. Constraints, in plain words

**Never sent to the browser.** `creds` (so `creds.mfa`); a code, except in `GET /mfa/device`
while that device is held; the three number choices, except in `GET /mfa/phone` to a player
holding that phone (the right one is never marked); `habits.approvesPrompts`,
`habits.promptPatience`, `awareness`; the state keys `mfaPending`, `mfaAccounts`, `mfaPrompts`.
Sent on purpose: `policies.*.mfa` (which PCs ask, and of which kind), a `code_device` item's
`type`, `id`, `name`, `owner`, and on the `mfaRequired` answer the account's `npcId` and, for
number matching, the one right number (it is what the sign-in screen displays). A refused second
step never says more than the first step did. Every `/mfa/*` answer is `Cache-Control: no-store`.

**Every grant is a server decision from server-held state.** No global, event or client claim
opens a session. The knock-out record is the browser's claim: it may let a device leave its
owner (best effort, as for the phone) and may REFUSE a push, never grant one.

**Determinism.** No random draw anywhere (`rand`, `SecureRandom`, `Math.random` are all out).
Codes and numbers are HMAC-SHA256 with the key
`Rails.application.key_generator.generate_key('break_escape/mfa')`; nothing secret is stored in
the game row or a scenario. Owner approval is a count against a threshold. No runtime LLM
decides or words anything.

**Time.** The server has no game clock; it uses its own wall clock through ONE seam,
`MS#mfa_now` (`Time.current.to_i`). Code window = `floor(mfa_now / 60)`; the current and
previous windows are accepted. Only the code window and the five-minute closure decide a
player-visible outcome from real time; the 300 s pending expiry and the 2 s prompt gap only
tidy and slow scripts. Nothing pauses with the game. Rails tests freeze time (`travel_to`); JS
tests inject a clock; a scripted run reads codes from the device, never computes one and never
sleeps except the one wait in beat 4.

**Constants** (all in `MM`): `STEP_SECONDS = 60`, `PENDING_SECONDS = 300`,
`PROMPT_GAP_SECONDS = 2`, `MAX_PROMPTS = 20`, `MAX_CODE_TRIES = 5`,
`MAX_CODE_WRONG_TOTAL = 30`, `CODE_CLOSED_SECONDS = 300`. (`DESK_STOP_SECONDS` is S8b's.)

**No exploit content.** Abstract, invented mechanics and product names. Do not open SecGen XML
or any exploit-detail field guide.

**Existing scenarios unchanged.** With no `mfa` value in any policy, every answer and write is
byte-for-byte as before. After any engine Ruby edit run `bin/ops-golden-compare` with NO outer
`flock` (it takes the lock itself). A diff is a bug to report, never a reason to capture again.
`node test/js/ops-unchanged-validator.test.mjs` must show no new line for any shipped scenario.
Campaign missions (m01 to m10, sis*) and every existing scenario are not edited;
`ca03_helpdesk_reset` keeps its client-global grant and its authenticator scene.

**Database.** Shared development database, no backup: never `db:create`, `db:schema:load`,
`db:migrate`, `db:reset`, `db:drop`, `db:setup`, `db:seed`. Rails tests:
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>`; never `ruby -Itest`.

**Event mappings.** A new `eventMappings` entry goes LAST in its list;
`ruby tools/check_mapping_index_drift.rb` must pass.

**New static JS imports** go on every harness copy list that copies the importing module. This
stage is designed to add exactly one: `systems/pc-sessions.js` imports the new leaf
`systems/mfa-client.js` (which imports nothing). The lists that copy `pc-sessions.js` today, all
in `test/js/`: `access-remote-signin.test.mjs`, `access-from-desktop.test.mjs`,
`container-note-toast.test.mjs`, `container-items-keyboard.test.mjs`,
`clock-note-followups.test.mjs`, `compromise-marks.test.mjs`, `capture-log.test.mjs`,
`interactions-admin-plant.test.mjs` (a swap), and the S5a files `pc-sessions-admin.test.mjs` and
`pc-taskbar-admin.test.mjs` if they copy it. Re-grep `pc-sessions.js` under `test/js` before
editing: the grep is the authority, not this list. If a unit adds any other static import (for
example into `password-minigame.js`, copied by `signin-short-username.test.mjs`,
`password-join-mode.test.mjs`, `unlock-route-room-retry.test.mjs`,
`engine-fixes-round6.test.mjs`), it does the same for that importer and lists each file touched.

**Leak scanner.** `tools/playtest/lib/access_leak_scanner.rb` only ever gains rules. It is never
loosened, and no rule is skipped, to make a run pass. A scanner hit is a finding to report.

**State.** The three new keys are server-owned: no sync body may write them, and they are not a
sync section (delta sync rule).

**Text.** UK English. All server and author text reaches the DOM through `textContent`.

**Every unit.** Edit only the files in your list; a needed change elsewhere is reported, not
made. Commit only when your prompt says, by explicit path, no attribution lines. "Unmodified"
means you do not edit that test file.

## 4. Units and waves

| Wave | Units (side by side) | Waits for |
|---|---|---|
| 0 | 01 unchanged fixtures, 02 authenticator snapshot | nothing; BEFORE any engine edit |
| 1 | 03 model, 04 lockout key functions, 05 log events, 06 MFA client, 07 session mirror | wave 0 |
| 2 | 08 `game.rb` preparation, 09 subject functions (code), 10 schema and validator, 11 dungeon graph, 12 code-device scene | 03 (08, 09, 10, 11), 04 (08), 05 (09), 06 (12) |
| 3 | 13 sign-in second step, 14 subject functions (push, approve), 15 sign-in screen code pane | 08, 09 (13); 09 (14); 06, 07, 12 (15) |
| 4 | 16 controller (gate, device, verify), 17 saved connections, 18 sign-in callers (push, approve, phone), 19 live authenticator | 13 (16, 17, 18); 14 (18); 02, 06, 12 (19) |
| 5 | 20 controller (prompt, phone, approve), 21 sign-in screen push pane | 16, 18 (20); 15, 19 (21) |
| 6 | 22 feature scenario and its tests | all above |
| 7 | 23 leak scanner and `verify-run`, 24 docs | 22 |
| after | scripted playtest, then live proof (testers, section 6) | 23 |

Plan stage of each unit: M1a = 01, 03, 04, 05, 08, 09, 10, 13, 16, 17. M1b = 06, 07, 11, 12, 15.
M2 = the push halves of 14, 18, 20, 21. M3 = 02, 19 and the approve and number halves of 14, 18,
20, 21. Stage-wide = 22, 23, 24.

Single owners of shared files: `ops_log_events.rb` unit 05; `scenario-schema.json`,
`validate_scenario.rb`, `validate_npc_habits.rb`, `npc_habits.rb` unit 10;
`ops_unchanged_cases.rb` unit 01; `game.rb` units 08 then 13; `GC`, `config/routes.rb`,
`game_policy.rb` units 16 then 20; `minigames/index.js` and `minigame-starters.js` units 12 then
19; `password-minigame.js` units 15 then 21; `MA` units 09 then 14; `MS` units 13 then 18.

### Unit 01: unchanged fixtures (wave 0)

- **Files:** `test/support/ops_unchanged_cases.rb` (add cases), new
  `test/fixtures/files/ops_unchanged/mfa_*.json`.
- **Build:** read the header of `lib/tasks/ops_unchanged.rake` and the `privilege_*` cases as the
  model. Add cases for what the `privilege_*` and `core_*` fixtures do not already pin (say in
  your report what they do pin): (a) the bootstrap of `test_access_signin`, `test_access_keyring`
  and `ca03_helpdesk_reset`; (b) on `test_access_signin`, wrong passwords up to a lockout, the
  locked-out answer, and a right password after it; (c) a typed sign-in over a foothold and one
  with `from`, where a scenario has them; (d) the phone rule on a scenario that has an NPC phone:
  direct add offered, direct add not offered, add after a knock-out record, pickup of a stored
  NPC drop, a room add with no source; (e) a saved-connection keyring sign-in; (f) the stored
  scenario of `test_access_habits` after `expand!`. Capture with
  `ONLY=<name> bin/rails app:ops:unchanged:capture`.
- **Do NOT:** edit an engine file; touch an existing fixture; add a second replay test.
- **Done when:** `bin/ops-golden-compare` passes with the new names; `git status` shows only
  your files. Hand on the fixture names and their step ids.

### Unit 02: authenticator snapshot (wave 0)

- **Files:** `test/js/authenticator-snapshot.test.mjs`, `test/js/fixtures/authenticator_snapshot.json` (new).
- **Build:** a test that runs the real `AuthenticatorMinigame` `init` and compares the
  container's HTML with a stored snapshot for three parameter sets: the `mfa` block of
  `ca03_helpdesk_reset`'s episode (decision mode, phone hidden); a timeline set
  `{ pushes, approvesAt }`; the fixtures of `test/js/social-reuse-authenticator.test.mjs`.
  Record the snapshot from the code as it stands and commit both.
- **Done when:** the test passes on unedited code. Unit 19 must keep it green without touching
  the snapshot.

### Unit 03: `MfaModel` (wave 1)

- **Files:** `lib/break_escape/mfa_model.rb`, `test/unit/mfa_model_test.rb` (new). No Rails in
  the model (as `credential_model.rb`).
- **Build:**
  - `KINDS = %w[none push push_number_match code]`; `kind(policy)` answers a valid kind or `none`.
  - `enrolled?(npc)`: an account whose `creds.mfa` is not the literal `false`.
  - `OWNER_BOUND_TYPES = %w[phone_friendface code_device]`.
  - `device_for(scenario, npc_id)`: the authored `code_device` whose `owner` is the NPC, by the
    walk the phone uses (`social_feed.rb:190-221`): room objects and their `contents`, NPC
    `itemsHeld`, start items.
  - `held_item_sources(scenario)`: an array of `{ type:, id:, via: }`, `via` one of `:object`,
    `:start`, `:offer`, `:knock_out`. A room NPC's `itemsHeld` item counts only when its story
    offers that type (`AccessWork.offers_item_text?`) or the NPC can be knocked out (not
    `koImmune`, not `npcType: "phone"`, no scenario `disableAttacks`). Headless records and
    declared grants never count.
  - `code(key, game_id, device_id, window)`: six digits (zero padded) from the HMAC over
    `"<game id>|<device id>|<window>"`. `device_id` is any string (S8b passes `own:<npcId>`).
  - `code_state(typed, codes, used_window, window)`: `:right` for the current or previous
    window's code when that window is later than `used_window`; `:stale` when it equals a code
    of any of the last four windows but is not right; else `:wrong`. Also say which stale
    (`used` or `expired`).
  - `numbers(key, game_id, subject_key, npc_id, nonce)`: one HMAC gives the right two-digit
    number (10 to 99), two different wrong ones, and the order of the three.
  - `PROMPT_PRESETS = { 'low' => 'pestered', 'medium' => 'never', 'high' => 'never' }`;
    `prompt_habit(npc, scenario)`: authored `habits.approvesPrompts` if one of `never`,
    `pestered`, `always`, else the preset for `NpcHabits.level_of`, else `never`;
    `prompt_patience(npc)`: authored `habits.promptPatience` if an integer 2 to 9, else 3.
  - The constants of section 3.
- **Tests:** kinds; enrolment (`"false"` and `0` do not exempt); device lookup in each home;
  `held_item_sources` (a device held only by a headless record, a declared grant, or the
  `itemsHeld` of a `koImmune` NPC with no offer, a `phone` NPC, or any NPC under
  `disableAttacks` is NOT listed; the same item as a room object, a start item, or an offering
  NPC's is); a code for a fixed key and time; `code_state` for each of the four windows with and
  without a used window; a different device id changes the code; `numbers` gives three different
  values in a fixed order and changes with subject key and nonce; `prompt_habit` per level and
  authored; `prompt_patience` bounds.
- **Done when:** your file passes. Hand on every signature.

### Unit 04: lockout key functions (wave 1)

- **Files:** `lib/break_escape/access_identities.rb`, `lib/break_escape/access_work.rb` (line
  `:1397` only), `test/unit/access_identities_lockout_key_test.rb` (new).
- **Build:** beside `normalise_username`: `lockout_key(pc_id, username)` answers exactly the
  string built today (`"<pcId>|<normalised username>"`); `lockout_key_parts(key)` answers
  `[pc_id, username]` or nil for a malformed key. `access_work.rb:1397` calls `lockout_key`.
- **Tests:** equals today's string for odd inputs; round trip; malformed keys.
- **Done when:** your file and `bin/ops-golden-compare` pass.

### Unit 05: log events (wave 1)

- **Files:** `lib/break_escape/ops_log_events.rb`, `test/unit/mfa_log_events_test.rb` (new).
- **Build:** eight entries after the last, all `places: %w[pc]`, labels within the label pattern:

  | Event | Results | Detail |
  |---|---|---|
  | `mfa_challenge` | `ok` | `route`: `keyboard`, `foothold`, `from` |
  | `mfa_code_ok` | `ok` | none |
  | `mfa_code_wrong` | `fail` | none |
  | `mfa_code_locked` | `locked` | none |
  | `mfa_expired` | `expired` | none |
  | `mfa_prompt_sent` | `ok` | none |
  | `mfa_prompt_approved` | `ok` | `approver`: `owner`, `held_phone`, `own_phone` |
  | `mfa_prompt_denied` | `denied` | none |

  Repeats merge (the helper's default). No `once`, no `save_limit`. If a result word is not in
  the registry's allowed results, report it rather than widening the list silently.
- **Tests:** the table's self-check passes (`test/models/break_escape/ops_log_test.rb`
  unmodified); each entry accepts its detail and refuses another value.
- **Hand on:** names, results and detail keys exactly, and how existing tests exercise the
  secret guard (grep `secret in` under `test/`), for units 16 and 20.

### Unit 06: `mfa-client.js` (wave 1)

- **Files:** `JS/systems/mfa-client.js`, `test/js/mfa-client.test.mjs` (new).
- **Build:** a leaf module with NO imports. `configure({ request, onSession, emit, now })` gives
  it the request function, the session sink, the event emitter and a clock. State in memory
  only, keyed by subject key (`pc:<pcId>`; any other kind as `<kind>:<id>`):
  - `noteRequired(subject, body)` stores `{ kind, npcId, number?, ownPhone?, n }` and emits
    `mfa_required`;
  - `pendingFor(subject)`, `clear(subject)`;
  - `readDevice({ itemId })` calls `GET /mfa/device`; a code that is not `used` and not
    `enrolled: false` goes to `lastRead = { npcId, code, source: 'item', deviceId }`; an
    `enrolled: false` answer clears a `lastRead` from that device;
  - `codeFor(pending)` answers the last read code only when its `npcId` equals the pending
    one and `source === 'own'` exactly when `pending.ownPhone` is true; else null;
  - `verify(subject, code)`, `prompt(subject)`, `phone({ npcId })`, `approve(subject, { number, deny })`
    call the routes. A passing answer for a `pc` subject goes to `onSession(pcId, body)`
    (unit 07 wires `completeSecondStep`); for any other kind it is kept and handed out once by
    `takeCompleted(subject)`. `takeCompleted` for a `pc` subject answers the session once when
    a child scene approved it.
  - Events, each plain and as `<name>:<npcId>`: `mfa_required`, `mfa_prompt_sent`
    `{ npcId, pcId, n }`, `mfa_approved` `{ npcId, pcId, by }`, `mfa_failed`. A non-PC subject
    carries `targetType` and `targetId` in place of `pcId`.
- **Tests:** notes per subject key; `codeFor` for each mismatch; a pass for `pc` reaches
  `onSession`, one for a test-only kind is handed out once and never reaches it; every event in
  both forms; no `pc_signin_failed` from here for a test-only kind.
- **Hand on:** the API, for units 07, 12, 15, 19, 21.

### Unit 07: session mirror (wave 1)

- **Files:** `JS/systems/pc-sessions.js`, `test/js/pc-sessions-mfa.test.mjs` (new), and the
  harness copy lists of section 3 (list each in your report).
- **Build:** import `mfa-client.js` statically and `configure` it (request function, emitter,
  `onSession: completeSecondStep`), and expose it wherever `pcSessions` is exposed. In `signIn`,
  test `body.mfaRequired === true` BEFORE `success === false`: call `noteRequired`, emit no
  `pc_signin_failed`, return `{ ok: false, reason: 'mfa_required', mfa: {...} }`.
  `completeSecondStep(pcId, body)` does everything `signIn` does with a session answer (mirror
  write, ended sessions dropped, `tokenExpiredPcIds`, `pc_signed_in`). `credentialRefusalReason`
  learns `typeToSignIn`: reason `type_to_sign_in`, `why` the server's value, message "This PC
  asks for a second step. Type the password to sign in." for `second_step` and "This password
  has been changed. Type the new one to sign in." for `password_changed`; shown as a notice.
  A refused second step emits `pc_signin_failed` with reason `mfa_wrong_code`,
  `mfa_code_locked`, `mfa_cancelled` or `mfa_expired`; a stale code emits nothing (give
  `mfa-client` a small exported helper here, or do it in the `onSession` wiring; say which).
- **Tests:** `mfaRequired` is not an error; `completeSecondStep` writes the mirror, drops ended
  sessions, emits `pc_signed_in`; a 422 `typeToSignIn` gives `type_to_sign_in` with its `why`,
  never the wrong-password fallback.
- **Done when:** your file; unmodified `pc-sessions.test.mjs`, `pc-sessions-access.test.mjs`,
  `pc-sessions-admin.test.mjs`, `test-bridge-access.test.mjs`, and every harness you touched.

### Unit 08: `game.rb` preparation, no behaviour change (wave 2)

- **Files:** `app/models/break_escape/game.rb`, `test/unit/no_inline_lockout_key_test.rb` (new).
- **Build:** (a) extract the route branch of `attempt_login!` into
  `typed_route_refusal(info, foothold:, from:, from_given:)` answering the refusal Hash or nil,
  same answers in the same order (D2). (b) `GM:3654` and `GM:3762` call
  `AccessIdentities.lockout_key`. (c) State keys `mfaPending`, `mfaPrompts`, `mfaAccounts`,
  default `{}`, declared the way `loginFailures` is and made server-owned the same way; if
  declaring them changes any golden fixture or bootstrap, use lazy accessors instead and say so.
  (d) `GM:1179`: the type test becomes `MfaModel::OWNER_BOUND_TYPES.include?(item['type'])`.
- **Do NOT:** add the second step (unit 13); include `MA` or `MS` (they do not exist yet).
- **Tests:** the grep test: no file under `app/` or `lib/` builds or splits a lockout key
  outside `AccessIdentities`.
- **Done when:** `bin/ops-golden-compare` passes including unit 01's cases; unmodified the
  existing sign-in controller tests (`grep -l attempt_login\\|/login test/controllers`).

### Unit 09: subject functions, code (wave 2)

- **Files:** `app/models/break_escape/mfa_access.rb`, `test/models/break_escape/mfa_access_code_test.rb` (new).
- **Build:** a concern (shape of `CredentialLogin`). Functions take an owner (NPC id) and a
  subject `{ kind:, id: }` and a record map, and read nothing about the subject but its kind and
  id. Until unit 13 includes it, your test includes it into `Game` itself.
  - `tidy_pending!(map)`: drops records older than `PENDING_SECONDS`, except one marked
    `'passed' => true`. Run on every read and write of a map.
  - `issue_second_step!(map, key, npc_id, kind, extra = {})`: adds 1 to
    `mfaAccounts[npcId]['started']`, writes
    `{ 'id', 'kind', 'n' => 0, 'tries' => 0, 'nonce' => started, 'at' => now, 'last' => 0 }`
    merged with `extra`; one record per key, a new one overwrites.
  - `code_device_code(device_id)`: the model's code for the current window; calls
    `OpsLog.note_issued_secret(code)` every time one is computed.
  - `verify_second_step_code(map, key, subject, typed, device_id)` answers one of `:passed`,
    `[:stale, 'used' | 'expired']`, `:wrong`, `:expired` (the fifth wrong try: record dropped),
    `[:closed, retry_in]`, `:malformed` (not six digits: counted nowhere). Compare in constant
    time. Right: set `mfaAccounts[npcId]['used'] = window`. Wrong: `tries += 1` and
    `mfaAccounts[npcId]['wrong'] += 1`; at `MAX_CODE_WRONG_TOTAL` set `closedAt` and report
    that this call closed it (so the caller writes ONE `mfa_code_locked` row). The first read
    after `CODE_CLOSED_SECONDS` removes `closedAt` and sets `wrong` to 0. For a `pc` subject the
    CALLER adds the lockout failure and drops the record on a pass; for another subject the
    function marks nothing and the caller marks `passed`.
  - Time only through `mfa_now` (define it here if unit 13's file is not in yet; one definition
    in the end, in `MS`).
- **Tests:** every answer above with time frozen; a code works once per account; thirty wrong
  codes across two maps close the step, a right code is then refused with `retryIn`, and after
  300 s it is accepted with the count at 0; a `passed` record survives the tidy and an unpassed
  one does not; a test-only subject kind touches no lockout key.
- **Hand on:** signatures and return values, for units 13 and 14.

### Unit 10: schema, validator, habit keys (wave 2)

- **Files:** `scripts/scenario-schema.json` (your blocks only), `scripts/validate_mfa.rb` (new),
  `scripts/validate_scenario.rb` (one `require_relative` near `:46` and one `run.call` beside
  the habits check), `scripts/validate_npc_habits.rb`, `lib/break_escape/npc_habits.rb` (only if
  a key list there must learn the two keys; `PRESETS` is NOT touched),
  `test/js/validator-mfa.test.mjs`, `test/unit/npc_habits_mfa_keys_test.rb` (new).
- **Build:**
  - Schema: `mfa` enum (`none`, `push`, `push_number_match`, `code`) in the closed policy block
    (`:264-280`); `creds.mfa` boolean, `x-serverOnly`, beside `admin` (`:4517`); habit keys
    `approvesPrompts` (enum) and `promptPatience` (integer 2 to 9); item type `code_device` with
    `owner` (`x-ref: "npc"`), documented the way `phone_friendface` is (`:5563`; there is no
    item type enum).
  - Errors: unknown `mfa` value; kind `code` where an admitted enrolled account has no
    `code_device`; two code devices for one owner; a `code_device` with no `owner` or an owner
    that is not an account; a push kind where an admitted enrolled NPC has `phone: false`;
    invalid `approvesPrompts` or `promptPatience`, or either on a non-room NPC; `creds.mfa`
    other than `false`.
  - "Not built yet", each an ERROR with the fixed line
    `"<field>" is not built yet (MFA plan stage S8b)`: top-level `helpdesks`, `creds.recovery`,
    `creds.resetPassword`, `helpdesk` on a pretext ask. Follow `scripts/validate_privilege.rb:47`.
  - Warnings: the policy does nothing (every admitted account exempt); a `code_device` nobody
    can get (`held_item_sources` does not list it); a `code_device` that is not gated (its
    owner's story has `give_npc_inventory_items` with no type filter); a loose owned phone
    (`phone_friendface` with `owner` in room `objects` or container `contents`); a code step
    that can lock for good (`mfa: "code"` with `maxAttempts`: see ambiguity A1 for the exact
    S8a rule); a saved connection that must be typed (to an MFA PC, for an enrolled account); a
    push step nobody passes (every admitted owner resolves to `never`, no holdable phone, no
    other way through); patience with no effect.
  - Information lines: per `code_device`, the routes to it; per MFA PC, its kind and each
    admitted account's ways through or round the step (token, help invite, a technique session
    on that host, an owner's open screen that can be claimed, named as such).
  - `validate_npc_habits.rb`: the two keys are valid, with the per-parameter check.
- **Tests:** a fixture per error, warning and "not built yet" line, and a clean one; a scenario
  with none of the fields gets no line from the new check; habits expansion of an NPC without
  the keys is unchanged; neither key is in `SHIPPED_HABIT_KEYS`.
- **Done when:** your files; unmodified `node test/js/ops-unchanged-validator.test.mjs` (NO new
  line for any shipped scenario: the loose-phone warning included; if one appears, report and
  stop), `test/unit/npc_habits_test.rb`, `test/models/break_escape/npc_habits_loader_test.rb`.

### Unit 11: dungeon graph (wave 2)

- **Files:** `scripts/generate_dungeon_graph.rb`, `test/js/dungeon-graph-mfa.test.mjs` (new).
- **Build:** a sign-in lock under an MFA policy gets a second key edge per admitted enrolled
  account: for `code`, the account's `code_device` item; for `push`, the owner's phone item
  when one is declared, or the label "owner approves (pestered)" when the habit resolves to
  `pestered` or `always`; for `push_number_match`, the phone item only. Exempt accounts get no
  edge. Model on the S5a `admin@` block (`:1814-1854`). No code, number or password in a label.
- **Done when:** your file; unmodified every `test/js/dungeon-graph-*.test.mjs`;
  `scripts/lock_key_diff.rb` output and the validator snapshot unchanged for every scenario
  without the fields.

### Unit 12: `code-device` scene (wave 2)

- **Files:** `JS/minigames/code-device/code-device-minigame.js`, its CSS file (new, linked
  where the authenticator's CSS is linked; that one link line is yours), `JS/minigames/index.js`,
  `JS/systems/minigame-starters.js`, `test/js/code-device.test.mjs`.
- **Build:** `CodeDeviceMinigame extends SocialOverlayScene`
  (`JS/minigames/framework/social-overlay.js:33`), started with `socialOverlayParams()`, its own
  steel X wired to `requestClose()` with the default `closeMode` (so as a child it returns to
  the sign-in screen, alone it just closes). The small device frame from
  `public/break_escape/css/device-frame.css`, the owner's headshot and name, six digits in
  VT323, a bar that drains to the end of the window. It reads through `MfaClient.readDevice` on
  open and when the bar empties. `used`: greyed, "Wait for the next code", not noted.
  `enrolled: false`: "No longer in use", no digits. A 403: "This device shows nothing." Opened
  from the inventory item (alone) and, by unit 15, as a child. Reach `MfaClient` the way this
  folder reaches `pcSessions` today; a new static import follows the copy-list rule.
- **Tests:** a `used` code is greyed and not noted; `enrolled: false` shows no digits; a hostile
  display name renders as text; the read repeats when the injected clock passes the window.
- **Done when:** your file; `node test/js/ops-log-viewer.test.mjs` and any other test that
  reads `minigames/index.js` or `minigame-starters.js`, unmodified.

### Unit 13: the sign-in second step (wave 3)

- **Files:** `app/models/break_escape/mfa_sign_in.rb` (new), `app/models/break_escape/game.rb`,
  `test/models/break_escape/mfa_sign_in_code_test.rb` (new).
- **Build:**
  - `GM`: include `MfaAccess` and `MfaSignIn`. In `attempt_login!`, after the
    `pc_admits_account?` refusal and before `login_failures.delete(key)`: when
    `mfa_step_for(pc, npc)` is not `none`, issue the record in `mfaPending[pcId]` with
    `foothold`, `from`, `fromGiven` as given, write `mfa_challenge` (`as: { account: username }`,
    detail `route`), `save!`, and answer 200
    `{ success: false, mfaRequired: true, mfa: <kind>, pcId, npcId, number? }` (`number` only
    for `push_number_match`; registered with `note_issued_secret`). No session; the failure
    counter is not cleared.
  - `MS`: `mfa_now`; `mfa_kind_for(pc)` (`MfaModel.kind(effective_policy(pc))`);
    `mfa_reenrolled?(npc_id)` (false; S8b seam);
    `mfa_step_for(pc, npc)`: `none` when the kind is `none`, the account is not enrolled, the
    PC already holds this account's own LOCKED session, or the kind is `code` and no device is
    declared; `second_step_refusal(pc, pending)`: `typed_route_refusal` with the stored route,
    then `pc_admits_account?`, answering what the first step would now answer;
    `held_code_device(npc_id)`: an inventory entry, unwrapped from `scenarioData`, whose `type`,
    `id` and `owner` equal the authored device, and not `ItemIdentity.client_forged?` (follow
    `credential_held_proof_holds?`, `credential_keyring.rb:54`);
    `mfa_device_answer(item_id)`: `:not_found` when no policy declares an `mfa` kind,
    `:no_device` unless held, else `{ deviceId, displayName, npcId, code, secondsLeft, used? }`;
    `verify_sign_in_code!(pc_id, code)`: PC found; a live `code` record (else the generic
    refusal); `second_step_refusal`; the account's lockout; then `MA`'s verify. On `:passed`:
    drop the record, `login_failures.delete(key)`, `start_login_session!` as `via: 'password'`
    with the stored route, `mfa_code_ok`, `save!`, the normal sign-in answer. On `:wrong`:
    `record_login_failure!` on the lockout key, `mfa_code_wrong`, `mfaIncorrect: true` with
    `attemptsLeft`. On `:expired`: also `mfa_expired`, `expired: true`. On the closing call: one
    `mfa_code_locked`. Stale, malformed, a refused route and a verify against a closed step
    write NO row.
  - Claims, technique sessions, `token` and `assist_invite` sign-ins never reach the step:
    confirm by test, change no code for it.
- **Tests (model level, time frozen):** the order of section 2 D1; `mfa_step_for` for each
  `none` case (unlock of one's own locked session needs no step; a different account at that PC
  does); the pending record's fields; a new first step overwrites; the route re-judge (foothold
  unplugged, account removed from the access list between steps); the session is written with
  the stored route; the rows above and the rows NOT written.
- **Done when:** your file; `bin/ops-golden-compare`; unit 08's proof list again.

### Unit 14: subject functions, push and approve (wave 3)

- **Files:** `app/models/break_escape/mfa_access.rb`, `test/models/break_escape/mfa_access_subject_test.rb` (new).
- **Build:**
  - `send_second_step_prompt(map, key, subject, reenrolled: false)`: needs a live push record;
    `PROMPT_GAP_SECONDS` since `last` (else `[:too_soon, retry_after]`); `n < MAX_PROMPTS` (else
    drop the record, `:expired`). Then `n += 1`, `last = now`, and the first case that applies:
    (1) `reenrolled` and a `pc` subject: `[:waiting, 'own_phone']`; (2) the player holds the
    owner's phone (`held_friendface_phone(npc_id)`, `social_feed.rb:190`, called unchanged):
    `[:waiting, 'held_phone']`; (3) the owner's phone was taken and is not held: `:nobody`;
    (4) the owner is recorded as knocked out: `:nobody` (refuse only); (5) the owner receives
    it: `mfaPrompts[npcId] += 1`, then `push_number_match` never approves, and `push` approves
    for `always`, or for `pestered` when `mfaPrompts[npcId] >= prompt_patience`. On approval
    set `mfaPrompts[npcId] = 0` and answer `:passed`.
  - `second_step_numbers(subject_key, pending)`: `MfaModel.numbers` with the record's nonce;
    registers all three with `note_issued_secret`.
  - `approve_second_step(map, key, subject, number:, deny:, reenrolled: false)`: needs a live
    push record and the held phone (or `reenrolled` for a `pc` subject), else `:no_phone`. Deny
    or a wrong number: drop the record, `:cancelled`, nothing counted towards a lockout. Right
    (number matching: the posted number equals the right one): `mfaPrompts[npcId] = 0`,
    `:passed`.
  - `second_step_requests(maps)`: the waiting push requests for an owner, one per key, with
    `n` and, for number matching, the three numbers in model order, none marked.
- **Tests:** each of the five cases; the count survives a new attempt and resets on any
  approval; requests caught on a held phone do not raise it; a knocked-out owner approves
  nothing; `tooSoon`; the cap; `pestered` at patience 3 and at an authored patience; number
  matching never approved by the owner; the three numbers stable within an attempt and
  different for the next. With a test-only subject kind and its own map: `:passed` leaves the
  record, `numbers` differ from a PC's with the same owner and nonce, `started`, `wrong` and
  `mfaPrompts` move on the shared per-owner entries, and with `reenrolled: true` case 1 is
  skipped and approve still needs the held phone.

### Unit 15: sign-in screen, code pane (wave 3)

- **Files:** `JS/minigames/password/password-minigame.js`, the sign-in screen's CSS (the new
  pane's rules only), `test/js/mfa-signin-pane.test.mjs`, `test/js/mfa-child-handover.test.mjs` (new).
- **Build:** on `reason === 'mfa_required'` swap to a second pane in the same monitor frame: no
  error line, no reject sound. Code pane: one six-digit field and Verify; failures show
  `attemptsLeft` as the password pane does; stale shows "That code has been used. Wait for the
  next one." or "That code has expired."; `codeLocked` shows the wait. What runs today on
  `result.ok` (`teachAfter` with the lesson noted at the first step, then `signInAccepted`)
  runs when the second step succeeds and not before. A button "Use <item name>" only for a held
  `code_device` whose `owner` is the answer's `npcId`; it sets `suspended: true` on the screen's
  own params and starts `code-device` with `returnTo: { sceneType: 'password', params: {} }`
  (`minigame-manager.js:19-24`, `:555-558`, `:616`, `:641`). The screen that comes back is a new
  instance: `init` asks `MfaClient` first (`takeCompleted`, then `pendingFor` with the field
  filled from `codeFor`, never submitted for the player, else the password pane). A child
  forced shut releases the screen once as `(false, { aborted: true, viaChild: true })`: quiet
  close, no toast, no reject sound, no `pc_signin_failed`, the `takeCompleted` note cleared.
  Closing with X does not cancel: reopening within five minutes returns to the second pane; if
  the record has gone the first verify falls back to the password pane. A `typeToSignIn`
  keyring refusal shows its line as a notice. Build the pane swap so unit 21 adds a push pane
  without restructuring.
- **Tests:** pane swap with no reject sound; `teachAfter` only after the second step; a reopened
  instance resumes from `MfaClient` and accepts a completed session; the field is filled after
  a read of the pending account's device and empty after a read of another account's device or
  one that answered `enrolled: false`; each `typeToSignIn` reason shows its own line; against
  the real minigame manager, the screen suspends, the child ends by X, the `password` scene
  reopens on the second pane; a forced close releases once with no failure event.
- **Done when:** your files; unmodified `signin-short-username.test.mjs`,
  `password-join-mode.test.mjs`, `password-lockout-persist.test.mjs`, `keyring-client.test.mjs`,
  `unlock-route-room-retry.test.mjs`, `engine-fixes-round6.test.mjs`.

### Unit 16: controller, M1a (wave 4)

- **Files:** `GC`, `config/routes.rb`, `app/policies/break_escape/game_policy.rb`,
  `test/controllers/break_escape/mfa_code_test.rb`, `mfa_device_gate_test.rb` (new).
- **Build:** routes `GET mfa/device` and `POST mfa/verify` in the member block
  (`routes.rb:20`, beside `login` at `:38`); both actions in the `set_game` list (`GC:27`);
  `mfa_device?` and `mfa_verify?` delegating to `show?` as `login?` does; `mfa_verify` inside
  `with_game_lock`. Status: 404 unknown (`{ success: false, error: "not found" }`), 403 out of
  reach (`{ success: false, error: "no such device" }`), 422 a refusal the player caused; every
  answer `Cache-Control: no-store`. A request with no `pc_id`, or with `target_type`, is the
  generic 422. Device gate: at `GC:3671` the test becomes membership of
  `MfaModel::OWNER_BOUND_TYPES`, asked as `npc_offers_item?(npc_id, found_item['type'])` or
  `npc_defeated?`; at `GC:3644` the test applies only to a STORED NPC DROP
  (`find_accessible_item` marks an item it found in `objects_added` as
  `location: { type: 'room', added: true }`) and is skipped when the id is in `droppedItems`.
- **Tests:** a `code` PC answers `mfaRequired` to a right password and opens a session only on a
  right code; a code used once is `stale: "used"` at a second PC; two windows old is
  `stale: "expired"` and counts nowhere; verify with no pending record; five wrong codes drop
  the record with no `maxAttempts`; wrong codes reach the policy lockout; thirty wrong codes
  across attempts and PCs close the step, one `mfa_code_locked` row, reopened after 300 s; the
  device route refused before the device is held, with a forged item, and with another type's
  id; another owner's device gives a code that fails; the device cannot be pulled from an owner
  who has only been met; accepted after an offer and after a knock-out record; refused for a
  `koImmune` owner with a forged knock-out; a dropped device picked up again; a stored NPC drop
  the owner does not offer refused on pickup; a room add with no source refused; a client-built
  item with `owner` refused; a device in a container follows the container's rule; the
  existing phone cases unmodified; per-role access for both policy methods; each action's log
  rows; the secret-guard case (a row holding the code just issued is refused with the guard's
  `secret in` error); no code in any answer except the held device route's.
- **Done when:** your files; `bin/ops-golden-compare`.

### Unit 17: saved connections (wave 4)

- **Files:** `app/models/break_escape/credential_login.rb`,
  `lib/break_escape/credential_model.rb`, `test/controllers/break_escape/mfa_keyring_test.rb` (new).
- **Build:** `KINDS['saved_connection']` gains `password: true` (`credential_model.rb:23`). In
  `attempt_credential_login!`, after the expired-token check and before the session write: for
  a kind with that flag, when `mfa_step_for(pc, npc)` is not `none`, answer 422
  `{ success: false, typeToSignIn: "second_step" }` with no session, no pending record, nothing
  counted and no row. `token` and `assist_invite` are untouched.
- **Do NOT:** build `password_changed` (S8b).
- **Tests:** refused at a `code`, a `push` and a number-matching PC and over a foothold, with no
  session, pending record or counter moved; a locked-out account still answers `lockedOut`; an
  exempt account's saved connection signs in; a token signs in at once; a technique session on
  a `code` PC opens with no pending record; a saved connection granted by a technique is
  refused the same way and typing that account's password then answers `mfaRequired`; at a PC
  with no `mfa` a saved connection is unchanged.
- **Done when:** your file; unmodified the keyring controller tests; `bin/ops-golden-compare`.

### Unit 18: sign-in callers for push, approve, phone (wave 4)

- **Files:** `app/models/break_escape/mfa_sign_in.rb`, `test/models/break_escape/mfa_sign_in_push_test.rb` (new).
- **Build:** `prompt_sign_in!(pc_id)`: PC found, live push record, `second_step_refusal`, then
  `MA`'s prompt. Each counted request writes `mfa_prompt_sent`; the cap writes `mfa_expired`.
  On `:passed` write the session exactly as unit 13's pass does, `mfa_prompt_approved` with
  `approver: 'owner'`, and answer the normal sign-in body with `approvedBy: "owner"`. Not
  approved: `{ success: false, approved: false, promptsSent, waiting? }`. Too soon: 422
  `tooSoon: true, retryAfterS`. Ended: 422 `expired: true`.
  `approve_sign_in!(pc_id, number:, deny:)`: re-judge, then `MA`'s approve; `:passed` writes the
  session, `mfa_prompt_approved` with `approver: 'held_phone'`, answer with
  `approvedBy: "player"`; cancelled writes `mfa_prompt_denied` and answers
  `{ success: false, cancelled: true }`; no phone is `:no_phone`.
  `mfa_phone_answer(npc_id)`: `:no_phone` unless `held_friendface_phone(npc_id)`; else
  `{ requests: [{ pcId, host, username, n, numbers? }] }`.
- **Tests:** F9 to F14 of section 6 at model level, with rows; the route re-judge on prompt
  and approve; approve refused without the phone; deny cancels and counts nothing.

### Unit 19: live authenticator (wave 4)

- **Files:** `JS/minigames/authenticator/authenticator-minigame.js`,
  `JS/minigames/authenticator/authenticator-live-minigame.js` (new), `JS/minigames/index.js`,
  `JS/systems/minigame-starters.js`, `test/js/authenticator-live.test.mjs` (new).
- **Build:** split the body of `init` (`:106-170`) into `_buildPhoneShell()` and
  `_buildAttackerParts()`, called in today's order, and change NOTHING else in the parent
  (`mode`, `choice`, the timeline, `_appendCard`, `closeResult` untouched).
  `AuthenticatorLiveMinigame extends AuthenticatorMinigame`, registered as `authenticator-live`:
  `super.init()`, `_buildAttackerParts()` draws nothing, cards come from `MfaClient.phone`, each
  with real Approve and Deny buttons (number matching: three number buttons), a tap calls
  `MfaClient.approve`. Opened as a child of the sign-in screen (unit 21) or from the held phone.
- **Done when:** unit 02's snapshot test passes with the snapshot untouched; unmodified
  `social-reuse-authenticator.test.mjs`, `social-authenticator-decision.test.mjs`,
  `social-gap-episode-runner.test.mjs`, `social-phone-ui-partd.test.mjs`; your test (cards from
  a stubbed list; approve, deny, a wrong number; hostile host and username as text).

### Unit 20: controller, M2 and M3 (wave 5)

- **Files:** `GC`, `config/routes.rb`, `app/policies/break_escape/game_policy.rb`,
  `test/controllers/break_escape/mfa_push_test.rb`, `mfa_phone_test.rb` (new).
- **Build:** `POST mfa/prompt` (locked), `GET mfa/phone`, `POST mfa/approve` (locked), with
  `set_game` entries and `mfa_prompt?`, `mfa_phone?`, `mfa_approve?`. `GET mfa/phone` takes
  `npc_id` (403 `{ success: false, error: "no such phone" }` unless held); `own=1` is S8b's and
  answers the same 403. Same status and `no-store` rules as unit 16.
- **Tests:** pestering a low-awareness owner signs in on the third request and the count
  returns to 0; a high-awareness owner is never approved and the attempt ends at the cap;
  `tooSoon`; a held phone approves; number matching: the owner never approves, a wrong number
  cancels, the right one signs in; approve refused without the phone; the numbers appear only
  in the held phone's list; per-role access; rows; the secret-guard case for a number.

### Unit 21: sign-in screen, push pane (wave 5)

- **Files:** `JS/minigames/password/password-minigame.js`, its CSS,
  `test/js/mfa-signin-push-pane.test.mjs` (new).
- **Build:** for push kinds the second pane shows "A request was sent to <owner>'s phone.",
  the two-digit number when the answer carried one, the count sent, and "Send again"
  (disabled for the server's `retryAfterS`). The first request is sent when the pane opens.
  "Check <owner>'s phone" only for that NPC's held `phone_friendface`; it opens
  `authenticator-live` as a child exactly as unit 15 opens the device. On return,
  `takeCompleted` signs the screen in; a denial returns to the password pane with "Request
  cancelled."; `expired` returns to the password pane.
- **Tests:** the pane per kind; send again and its wait; the button only with the right phone;
  child hand-over for the phone scene (X returns to the pane, approval returns signed in,
  forced close releases once).

### Unit 22: feature scenario and its tests (wave 6)

- **Files:** `scenarios/test_ops_mfa/` (new: `scenario.json.erb`, `mission.json`, `PLAYTEST.md`,
  generated `dungeon_graph.*`, any `ink/`), `test/controllers/break_escape/ops_mfa_scenario_test.rb`,
  `ops_mfa_no_exposure_test.rb` (new).
- **Build:** three rooms, one foothold, five sign-in PCs: two under a `code` policy with
  `maxAttempts`, one `push`, one `push_number_match`, one with `maxAttempts` and no `mfa`. Six
  accounts: code owner A (`code_device` in `itemsHeld`, offered in her story; a session token
  and a saved connection to her PC exist); code owner B (`code_device` loose on a desk); a
  service account (`creds.mfa: false`) at B's PC; push owner at low awareness (no phone item);
  push owner at high awareness (phone offered in his story); number-matching owner (phone,
  knock-out allowed). `logSources` so rows can be read. Take `scenarios/test_ops_privilege/` as
  the model. Invented products, no real tool names. S8b will append two accounts and two desks:
  leave ids free of `desk`, and put any `eventMappings` last. Validator clean of errors (state
  every warning; the A1 warning is expected on the two `code` PCs). `PLAYTEST.md` holds the
  beats of section 6 with what the player sees and what `verify-run.rb` prints; no hand-built
  or forged request in it.
- **Tests:** `ops_mfa_scenario_test.rb` plays every beat through the real routes on the real
  file, time frozen, asserting answers, state and rows. `ops_mfa_no_exposure_test.rb`: at each
  step no answer (bootstrap, room answers, sync, `GET /container`, `GET /network`, sign-in
  answers) holds a code, the three numbers, `approvesPrompts`, `promptPatience`, `awareness`,
  a `creds` key, or `mfaPending`, `mfaAccounts`, `mfaPrompts`; a forged sync body carrying those
  keys changes nothing.
- **Done when:** your tests; `ruby scripts/validate_scenario.rb scenarios/test_ops_mfa/scenario.json.erb`;
  `ruby tools/check_mapping_index_drift.rb`; `bin/ops-golden-compare`. Hand on the game-making
  command (`swap-scenario-game.rb`, shared brief) and any beat a headless run cannot do.

### Unit 23: leak scanner and `verify-run` (wave 7)

- **Files:** `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/verify-run.rb`,
  `test/controllers/break_escape/access_leak_scanner_mfa_real_test.rb`,
  `test/models/break_escape/mfa_verify_run_test.rb` (new).
- **Build:** rules are ADDED, structural, and earned PER THING. A `code` key is a leak unless
  it is in a `GET /mfa/device` answer for a device the run has earned (the item's add answer
  was seen). A `numbers` key is a leak outside a `GET /mfa/phone` answer for a phone earned the
  same way. The key names `approvesPrompts`, `promptPatience`, `mfaPending`, `mfaAccounts`,
  `mfaPrompts`, and `mfa` inside a `creds` object, are a leak wherever they appear. A session
  answer for an MFA PC is a leak unless that PC's second step was passed in the run (or the
  account is exempt, or the way in was a token, invite, claim or technique). `verify-run.rb`
  prints per account `started`, `wrong`, `used`, `closed yes/no`, per owner the prompt count,
  and per PC `pending <kind>` or `pending none`: words, counts and ids only, never a code.
- **Tests:** a real captured run of `test_ops_mfa` reports nothing; the same run doctored each
  way reports each; device earned for owner A used for owner B is reported; existing real tests
  unmodified.

### Unit 24: docs (wave 7)

- **Files:** `README_scenario_design.md` (row A22), `docs/ACCESS_AND_NETWORKS.md` (an A22 section).
- **Build:** the fields, the three kinds, the four ways to hold a device, what is best effort
  (story offer, knock-out record), the author's advice (to keep a device with its owner offer
  no give and set `koImmune`), the ways round a second step (a claimed open screen first), the
  validator lines, the graph edges, the "not built yet" S8b fields. A "plan corrections" list
  in your REPORT (not in the plan): D1 to D7, D17, D18 and the rulings of section 5.

## 5. The eight ambiguities

Builders build the recommendation. Each row says what changes if the owner rules otherwise.

| # | Ambiguity | Recommended | If the owner chooses otherwise |
|---|---|---|---|
| A1 | P881: "a code step that can lock for good" is in the warning table but its text says error when the graph marks the sign-in required and the account its only key | S8a builds it as a WARNING, raised for a `code` policy with `maxAttempts` (no desk can exist yet, so the test is just those two fields). The error half lands with H1, when a desk can lift the lockout and the graph has a helpdesk key source to judge by | Error now: unit 10 must compute "required and only key" (from the graph's data or its own walk), and unit 22's two `code` PCs must drop `maxAttempts` or gain another key. One more test fixture each |
| A2 | Which stage owns beats F7 to F18 | By kind: code beats F1 to F8 and F15 (token, saved connection) and the device half of F12 are M1's; F9, F10 are M2's; F11, F13, F14 and the phone half of F12 are M3's (F11 needs the phone and approve routes, which are M3's); F16 to F18 are S8b's. All S8a beats are scripted in one run after unit 22 (D18) | Per-stage playable checkpoints: unit 22 splits in three (the scenario file touched in three waves) and a scripted run follows each; about three more tester runs, no engine change |
| A3 | Stage of the `NpcHabits` keys | Unit 10 (with the validator), read first by unit 14. `PRESETS` untouched; resolved at read time by `MfaModel.prompt_habit` | None in substance; only which unit owns `validate_npc_habits.rb` |
| A4 | Stage that creates `scenarios/test_ops_mfa/` | Unit 22, once, with the S8a accounts only (six of eight, no desks) | Created at M1b: same as A2's alternative |
| A5 | `own:<npcId>` (re-enrolment) appears in M1a's code function but is H2 work | `MfaModel.code` takes any device id (a unit test shows a different id changes the code); `MA` functions take `reenrolled:`; `MS#mfa_reenrolled?` answers false. No route form, no `accountResets`, no "My phone", no `password_changed` on the server | Build the branches now behind the absent state: units 13, 16, 18, 20 gain the `npc_id` and `own=1` forms and their tests, with nothing able to reach them until H1; more untested-in-play surface, so not recommended |
| A6 | Which stage completes A22 and edits the docs | Unit 24, at the end of S8a (M3 completes A22). A23 is S8b's | Docs per stage: three small doc units, each owning the same two files in different waves |
| A7 | Gate-site line numbers differ inside the plan | Neither holds. Today: `GC:3671` (direct add), `GC:3644` (room pickup), `GM:1179` (sourceless room add). Find by `FRIENDFACE_PHONE` | n/a (fact, not choice) |
| A8 | `mfa_prompt_approved` names H2 as a writer | The entry lists all three `approver` values now; S8a writes `owner` (unit 18, M2) and `held_phone` (unit 18, M3); `own_phone` is written only by H2 | Register two values now: H2 then edits `ops_log_events.rb`, which is harmless but one more shared-file edit |

## 6. Playtest outline

Run by a scripted browser player through `window.__test` on a fresh game of `test_ops_mfa`, from
unit 22's `PLAYTEST.md`. Every beat is checked twice: what the browser was sent (the leak
scanner over captured answers) and what the server recorded (`verify-run.rb`). Codes are read
from the device on screen; the run never computes one. No hand-built or forged request: the
plan's F2 (device route before holding, crafted inventory add) and every hostile case are Rails
tests (units 16, 17, 20), named in `PLAYTEST.md` in one line.

1. **Password, then the pane.** Right password for owner A at code PC 1. The sign-in screen
   swaps to the code pane with no error. Server: no session, `pending code`.
2. **No device, no button.** The pane shows no "Use" button. A wrong six digits shows the
   attempts left. Server: one `mfa_code_wrong`.
3. **Handed the device.** Talk to owner A; she hands the device over. Reopen the PC: the pane
   is back (not the password pane). "Use Code device" opens the device over the screen; close
   it; the field is filled; Verify. Server: session `via password`, pending none, `used` set.
4. **One code, one use.** At code PC 2, same account, same minute: "That code has been used."
   and no counter moves. Wait for the device's bar to empty (the one wait, from
   `secondsLeft`), then the fresh code is accepted.
5. **Drop it.** Drop the device in the room and open it from the pane: no button. Pick it up
   again: the button returns.
6. **Loose device and the exempt account.** Take owner B's device from the desk without meeting
   her; sign in at her PC with it. Then the service account at the same PC: signed in at once,
   no pane.
7. **Unlock needs no device.** Lock the beat 3 session, drop the device, unlock with the
   password. Server: unlocked, pending none.
8. **Route re-judged.** Sign in to code PC 1 over the foothold as far as the pane; unplug the
   foothold; type a right code. Refused as out of reach; no session.
9. **Token and saved connection.** Use owner A's session token at her PC: in at once. Use the
   saved connection: the notice "This PC asks for a second step. Type the password to sign
   in."; no session, pending none. Typing the password reaches the pane.
10. **Pestering.** Push PC, low-awareness owner: the pane says a request was sent; "Send again"
    twice. Approved on the third. RELOAD the page after the second request and before the
    third: the screen opens on the password pane, and the owner's count survived (after the
    password, one more request is approved). Server: prompt count back to 0.
11. **A careful owner.** Push PC, high-awareness owner: send to the cap. Never approved; the
    attempt ends and the password pane returns. Server: `mfa_expired`.
12. **His phone.** Get the high-awareness owner's phone from his story. Password again; "Check
    <owner>'s phone"; Approve. The sign-in screen reopens signed in. Server: `approver
    held_phone`.
13. **X is not cancel.** On the code pane open the device and close it with X; on the push pane
    open the phone and close it with X. The second pane is back both times, pending still
    live, no failure recorded.
14. **Number matching, owner holds the phone.** The pane shows a number; send again several
    times. Never approved.
15. **Number matching with the phone.** Take the phone after a knock-out. Tap a wrong number:
    "Request cancelled.", password pane. Again, tap the number the pane shows: signed in.

**Live proof** (real clicks and typing, keyless server on the tester's own port, a game made in
that run): beats 1 to 3, 8, 10 (with the reload), 12, 13 and 15, with screenshots of the code
pane, the device as a child of the sign-in screen, the phone with a request card, and the
reopened sign-in screen.

## 7. Security review points

1. No code reaches the browser except through the held, authored, unforged device; verify does
   not ask about holding, so check nothing else returns or logs one.
2. Guessing is bounded three ways (5 per attempt, the PC's lockout, 30 per account then five
   minutes) and stale codes count nowhere.
3. A device or phone leaves its owner only by offer or knock-out; `OWNER_BOUND_TYPES` is the one
   list at all three sites; the narrowed pickup test changes no existing phone case.
4. The knock-out record only ever refuses a push.
5. The right number is on the sign-in screen by design; the three choices, unmarked, only on a
   held phone.
6. A saved connection cannot skip the step; a token and an invite can (by design); a claim and
   a technique session never reach it.
7. The route is judged again at every second-step call.
8. `mfa_step_for` is `none` for an undeclared device only in a scenario the validator refuses.
9. No state key is writable by sync; no answer grew a list re-sent whole.
10. `config/routes.rb` and `game_policy.rb` gain five routes and five methods and nothing for
    S8b or the lock plan.

## 8. Open items

1. **Not verified by running anything.** This brief is from reading the plan and the code; no
   test was run. `player_state` holding new keys without a migration is inferred from every
   earlier stage doing so.
2. **Unit 08 (c):** whether declaring the three keys in `ACCESS_STATE_DEFAULTS` moves a golden
   fixture is not known; the unit has a fallback and reports which it used.
3. **Unit 01:** what the `privilege_*` and `core_*` fixtures already pin was not read case by
   case; the unit reports it and adds only the rest.
4. **Result words** `fail`, `locked`, `expired`, `denied` (unit 05) are the plan's; whether the
   registry already allows each was not checked.
5. **How the folder's scenes reach `pcSessions`** (global or import) decides whether units 12,
   15, 19 and 21 add static imports; each reports the copy lists it touched.
6. **Beat 5** assumes the client can drop an inventory item into a room in this scenario
   (`droppedItems` exists on the server); if it cannot be scripted, the Rails test carries it.
7. **D18** trades the plan's per-stage playable checkpoints for fewer scenario edits (A2). The
   orchestrator may prefer the alternative.
