# Ops layer: multi-factor sign-in and helpdesk recovery (S8a, S8b)

Status: plan, not built. Base: `docs/ops-layer-plan`. Feature ids on landing: A22 (multi-factor
sign-in), A23 (helpdesk account recovery). Feature scenario: `test_ops_mfa`. This plan is
standalone: a builder needs this file, `docs/ACCESS_AND_NETWORKS.md` and the code it points at.

Pointers are `file:line` in the tree as read on 2026-11-19. Section 2.4 lists what was not read and
must be confirmed before the first edit.

## 1. What this adds and why, in play

**S8a, multi-factor sign-in (A22).** A sign-in policy can ask for a second step after a correct
password. Three kinds:

- `code`: the sign-in screen asks for a six digit code. The account's owner carries a **code
  device**, a real item. The player gets it the way any NPC item is got (handed over in
  conversation, picked up after a knock-out, found where a careless owner left it), opens it from
  the inventory and reads the code showing now. The code changes every minute. The server only
  shows a code to a player who holds the device.
- `push`: a sign-in request goes to the owner's phone. An owner with careless habits approves once
  enough requests have arrived (prompt fatigue); a careful owner never does. If the player holds
  the owner's phone, the request arrives there and the player approves it.
- `push_number_match`: as `push`, but the sign-in screen shows a two digit number that must be
  picked on the phone. The owner cannot see the player's screen, so pestering never works. Holding
  the phone still does.

What it teaches: a password alone stops being enough; a second factor is only as good as the
person or the object holding it; number matching removes the fatigue route; a session that is
already open, or a stolen session token, is not asked for a second factor at all.

**S8b, helpdesk recovery (A23, lower priority).** A helpdesk NPC can reset an account's password
or move its second factor to the caller, after checking who is asking under a rule the scenario
sets: `none`, `questions` (answers the player types, learned from feed posts, documents or
conversation) or `callback` (the desk rings the number on file, so the player must hold the
owner's phone). A grant puts a usable credential in the keyring. It teaches that the recovery
path is part of the sign-in, and that facts found online prove nothing about a caller.

Design rules both stages keep:

1. Every grant is a server decision from server-held state. Nothing the browser claims (a global,
   a pretext verdict) can stand in for it.
2. A secret reaches the browser only once earned: a code only while its device is held, a reset
   password only in the answer that grants it, recovery answers never.
3. No rolls. Whether an owner approves a request is a count against a threshold, so runs repeat.

## 2. What the code does today (verified)

### 2.1 Sign-in, policies, habits, items

| Area | Today | Where |
|---|---|---|
| Typed sign-in | Order: PC found; route branch (`from`, foothold, keyboard: reach, off, remote blocked); lockout key `pcId\|username` checked before the password; account lookup; password equals `creds.password`; PC admits account; failures cleared; `start_login_session!`; answer. Failure goes to `record_login_failure!` | `app/models/break_escape/game.rb:3444-3503` |
| Lockout count | `loginFailures[key]`, lockout at policy `maxAttempts`, never expires | `game.rb:4333-4378` |
| Session write | One place, record `{id, via, credential?, foothold?, from?, relay?}` | `game.rb:4388-4418` |
| Sign-in answer | `npcId, username, displayName, via, portrait, avatar` plus route fields | `game.rb:4433-4461` |
| Keyring sign-in | Nine ordered steps; `saved_connection` honours lockouts, `token` and `assist_invite` do not | `app/models/break_escape/credential_login.rb:22-89`; kinds at `lib/break_escape/credential_model.rb:21-27` |
| Claim of an open screen | Separate method, no password | `game.rb:3527` |
| Policy read | `effective_policy(pc)`: the PC's `policy`, else `defaultPolicy`; unknown name gives `{}`. No `mfa` key exists | `game.rb:3360`; schema `scripts/scenario-schema.json:261-280` (closed block) |
| Habits | `locksScreen`, `writesDown`, `password`, `holdsDoors`; presets from `awareness` set only `locksScreen` and `holdsDoors`. `phishable`, `pretextable`, `challengesStrangers` do not exist anywhere | `lib/break_escape/npc_habits.rb:18-38`, `:127-176` |
| Habits and the browser | Allow list: only `habits.screen` and `habits.print` ship. `creds`, `awareness`, `role`, `workarounds` are deleted from NPCs | `game.rb:7332-7344`, `:7376-7383` |
| Access state | Server-owned keys in `ACCESS_STATE_DEFAULTS`; none read from a sync body, none sent; a reset drops them | `game.rb:3021-3059` |
| Held item proof | Inventory entry whose `type`, `id` (and stored field) equal the authored definition, and not `client_forged?` | `app/models/break_escape/credential_keyring.rb:42-64` |
| NPC phone | Item `type: "phone_friendface"` with `owner` (format step 8b renamed `phoneOf`); `POST /friendface_phone` is refused unless the server's inventory holds that NPC's phone; `phonesTaken` records a phone leaving its NPC; an NPC hands one over only if its story offers it and the player has met it, or after a recorded knock-out | `games_controller.rb:1722-1730`; `app/models/break_escape/social_feed.rb:199-262`; `lib/break_escape/format_upgrade.rb:76-84` |
| Forged item fields | A client-built item may not carry `owner` | `games_controller.rb:3304-3306` |

### 2.2 Time

The server has no game clock. `scenarioClock` is reported by the browser and stored
(`games_controller.rb:2871`, `game.rb:5849-5898`); the needs clock runs only in the browser. The
server does use its own wall clock for things it must not take from the browser: session token
expiry in real minutes (`credential_keyring.rb:114-125`), the frustration floors
(`npc_frustration.rb:60-62`, `:367-378`), feed post floors (`social_feed.rb:67`) and record stamps
(`capture_proofs.rb:1037`). So a changing code is tied to server wall-clock time (section 5.1).

### 2.3 Existing minigames and the helpdesk scenario

- **`authenticator`** (`public/break_escape/js/minigames/authenticator/authenticator-minigame.js`,
  `authenticator-model.js`; registered `minigames/index.js:213`; starter
  `systems/minigame-starters.js:1310-1321`). An awareness course demonstration: a phone-shaped
  overlay that plays an authored list of sign-in requests on a timeline, or lets the learner pick
  when and how many, then shows the target approving. Its header says every combination lands and
  nothing is scored (`:1-17`). It talks to no server route and its result is `{approvedAt, sent,
  mode}` (`:445-452`). **S8a extends it** with a third mode for a phone the player holds (section
  5.3). The two existing modes are not touched.
- **`dual-auth`** (`minigames/dual-auth/dual-auth-minigame.js`). A two-person authorisation panel
  for one mission: two PIN pads, each PIN read from the lock's `minigameData` in the browser
  (`:15-18`), each correct PIN sets a global (`:203-209`). It is a lock on a room object, not a
  step in a PC sign-in, it has no account or device, and its secrets are in the browser. **S8a
  neither reuses nor changes it.**
- **`ca03_helpdesk_reset`** models the reset as a pretext call
  (`scenarios/ca03_helpdesk_reset/scenario.json.erb:640-790`): `social.pretextNpcs[]` with
  `knows`, `lines`, and an ask `reset_password` whose `verification` lists fact ids and whose
  grant is `setGlobal: { leila_reset_granted: true }` (`:760-772`). The verdict is computed in the
  browser by `public/break_escape/js/systems/pretext-judge.js` and the grant is a client global.
  No account changes on the server. **S8b keeps this pattern for the conversation** (it paces the
  call and voices the lines) and adds a server route for the grant, because a global cannot be
  what hands over a credential.

### 2.4 Confirm before the first edit (not read for this plan)

- The browser's handling of the `POST /login` answer (sign-in screen in
  `minigames/password/password-minigame.js`, session mirror in `systems/pc-sessions.js`): where a
  non-success answer is shown, so that an `mfaRequired` answer is not treated as a wrong password.
- `authenticator-minigame.js:140-440`: that the request card builder can be called for cards that
  come from a server answer. If it cannot, move the card builder to a shared helper first.
- `held_friendface_phone` (`social_feed.rb`, above `:199`): the exact held-phone test, to call it
  unchanged.
- Where the "NPC-sourced add needs an offer or a knock-out" rule is keyed by item type, to add
  `code_device` to it.
- How the server stores a knock-out (the Friendface plan says the record is client-trusted).

## 3. Build stages in order

Each stage ends playable and tested. Letters M (multi-factor) and H (helpdesk) with a number.

| Stage | Adds | Ends playable when | Size |
|---|---|---|---|
| M1 | Policy `mfa: "code"`, the `code_device` item, the pending second step, `GET /mfa/device`, `POST /mfa/verify`, the sign-in screen's code pane, the `code-device` scene | A PC with a `code` policy refuses a right password until the code from the held device is typed | M |
| M2 | `mfa: "push"`, habit `approvesPrompts` with `promptPatience`, `POST /mfa/prompt`, the sign-in screen's waiting pane | Pestering a low-awareness owner signs the player in; a high-awareness owner never approves | S |
| M3 | `mfa: "push_number_match"`, `GET /mfa/phone`, `POST /mfa/approve`, the `authenticator` scene's `live` mode | A held phone approves a request; number matching defeats pestering but not a held phone | S |
| M4 | Keyring kinds: `saved_connection` takes the second step; `token` and `assist_invite` skip it | A saved connection to an MFA PC stops at the second step; a session token does not | S |
| H1 | `helpdesks`, `creds.recovery`, `creds.resetPassword`, `POST /helpdesk/request` for `what: "password"`, the `helpdesk-request` form, the keyring entry | The player wins a reset with typed answers and signs in with the issued password | M |
| H2 | `what: "mfa"` (re-enrolment) and `verify: "callback"` | A re-enrolled account's second step is answered from the player's own phone | S |

M1 to M4 are S8a. H1 and H2 are S8b and need M1 to M3 only for H2.

## 4. Scenario fields

### 4.1 S8a

```json
{
  "defaultPolicy": "office",
  "policies": {
    "office":  { "maxAttempts": 5 },
    "finance": { "maxAttempts": 5, "mfa": "code" },
    "remote":  { "mfa": "push" }
  },
  "rooms": {
    "finance_office": {
      "npcs": [{
        "id": "moira",
        "awareness": "low",
        "habits": { "promptPatience": 3 },
        "creds": { "username": "m.kerr", "password": "…" },
        "itemsHeld": [
          { "type": "code_device", "id": "moira_code_device", "name": "Code device",
            "owner": "moira", "takeable": true }
        ]
      }, {
        "id": "svc_backup",
        "creds": { "username": "svc.backup", "password": "…", "mfa": false }
      }],
      "objects": [{ "type": "pc", "id": "finance_pc", "lockType": "login", "policy": "finance" }]
    }
  }
}
```

| Field | Values | Meaning | Reader |
|---|---|---|---|
| `policies.<name>.mfa` | `"none"` (default), `"push"`, `"push_number_match"`, `"code"` | The second step for every enrolled account signing in at a PC under this policy | `Game#mfa_kind_for` |
| `creds.mfa` | `false` | This account is not enrolled: no second step anywhere. Models the service account left outside the policy. Absent means enrolled | `MfaModel.enrolled?` |
| item `type: "code_device"` with `owner` | NPC id | The account's code device. In the owner's `itemsHeld`, or in a room object or container if the owner leaves it lying about. One per account at most | `MfaModel.device_for` |
| `habits.approvesPrompts` | `"never"`, `"pestered"`, `"always"` | What the owner does with a sign-in request it did not start. Preset from `awareness`: low `pestered`, medium `never`, high `never`. An authored value wins, as for every habit | `NpcHabits`, `Game#mfa_owner_approves?` |
| `habits.promptPatience` | integer 2 to 9, default 3 | For `pestered`: the request number at which the owner approves. A parameter like `passwordPattern`, in no preset | same |

For `push` kinds the owner's phone is the `phone_friendface` item whose `owner` is the account's
NPC, when the scenario declares one. An owner with no declared phone item still receives
requests (it cannot be taken, so only the habit decides).

### 4.2 S8b

```json
{
  "helpdesks": {
    "it_desk": {
      "npc": "leila",
      "verify": "questions",
      "questions": ["staff_id", "manager"],
      "needs": 2,
      "maxTries": 3,
      "resets": ["password", "mfa"],
      "questionLabels": { "staff_id": "Staff number", "manager": "Line manager" }
    }
  },
  "rooms": { "claims": { "npcs": [{
    "id": "gordon",
    "creds": { "username": "g.mcleish", "password": "…", "resetPassword": "…",
               "recovery": { "staff_id": "QH-4471", "manager": "Moira Kerr" } }
  }]}}
}
```

| Field | Values | Meaning |
|---|---|---|
| `helpdesks.<id>.npc` | room NPC id | Who the desk is. One NPC may serve one desk |
| `verify` | `"none"`, `"questions"`, `"callback"` | The rule. `none` grants to anyone who asks. `questions` compares typed answers. `callback` grants only while the player holds the account owner's phone |
| `questions`, `needs` | ids, integer | Which `creds.recovery` keys the desk asks, and how many must be right (default: all) |
| `maxTries` | integer 1 to 9, default 3 | Refused requests for one account before the desk stops serving that account for the rest of the game |
| `resets` | subset of `["password", "mfa"]` | What this desk will do |
| `questionLabels` | plain text, at most 40 code points each | Field labels on the request form. Not secret |
| `creds.recovery` | map of id to plain text, at most 64 code points | The right answers. Server only |
| `creds.resetPassword` | string | The password the desk issues. Authored so that runs repeat. Server only |

The helpdesk's spoken lines stay where ca03 has them: the NPC's ink or its pretext call block.

## 5. Engine behaviour

### 5.1 Shared model (plain Ruby, usable by the validator and graph)

New `lib/break_escape/mfa_model.rb`, no Rails, like `CredentialModel`:

- `KINDS = %w[none push push_number_match code]`; `kind(policy)` returns a valid kind or `none`.
- `enrolled?(npc)`: an account whose `creds.mfa` is not `false`.
- `device_for(scenario, npc_id)`: the authored `code_device` whose `owner` is the NPC, found by
  the same walk the phone uses (room objects and their `contents`, NPC `itemsHeld`, start items).
- `code(key, game_id, device_id, generation, window)`: six digits from an HMAC-SHA256 over
  `"<game id>|<device id>|<generation>|<window>"`.
- `number(key, game_id, pc_id, nonce)`: two digits for number matching, same construction.
- `STEP_SECONDS = 60`, `PENDING_SECONDS = 300`, `PROMPT_GAP_SECONDS = 2`, `MAX_PROMPTS = 20`.

`NpcHabits` gains `approvesPrompts` in `HABITS`, its three preset values, and `promptPatience` as
a parameter beside `passwordPattern` (`npc_habits.rb:21-36`). `expand!` writes the preset into
the saved scenario as it does for the others. Neither key is in `SHIPPED_HABIT_KEYS`, so neither
reaches the browser.

New `lib/break_escape/helpdesk_model.rb` (S8b): `desks(scenario)`, `desk_for_npc`,
`normalise_answer` (strip, collapse inner spaces, downcase, first 64 code points), `answers_right`.

**The code and time.** The window is `floor(server seconds / 60)`. The key comes from the
application's own secret (`Rails.application.key_generator.generate_key('break_escape/mfa')`), so
nothing secret is stored in the game row and the browser cannot compute a code. The server accepts
the current window and the one before it, so a code read at second 59 still works. Whether an owner
approves is a count, never a roll, and no outcome depends on a code's digits, so a scripted run
repeats: it reads the code from the device route as a player would. Unit tests fix the time.

### 5.2 Server

New concern `app/models/break_escape/mfa_access.rb`, included in `Game` as `NetworkAccess` and
`CredentialLogin` are.

**Where the step sits in the sign-in order.** In `attempt_login!` (`game.rb:3444`): after the
route branch, the lockout check, the password match and `pc_admits_account?`, and before
`login_failures.delete` and `start_login_session!` (between today's lines 3492 and 3494). If
`mfa_step_for(pc, npc)` is not `none`, the method writes a pending record and returns the
`mfaRequired` answer instead of starting a session. The failure counter is not cleared until the
second step passes. In `attempt_credential_login!` the same call sits after step 8 (ended or
expired) and before step 9, for kinds whose `CredentialModel::KINDS` entry carries `mfa: true`
(`saved_connection` only). A claim (`claim_login_session!`, `claim_guest_session!`) is never asked:
the session is already open.

`mfa_step_for(pc, npc)` is `none` when the policy kind is `none`, the account is not enrolled, or
(kind `code`) the scenario declares no device for the account and it has not been re-enrolled; the
validator makes the last case an error, so at run time it fails open only for a scenario that did
not validate.

**Pending record.** `player_state['mfa']['pending'][pcId] = { 'id' => npcId, 'kind', 'via',
'credential'?, 'foothold'?, 'from'?, 'n' => 0, 'nonce', 'at' => server seconds, 'last' => 0 }`.
One per PC; a new first step at that PC overwrites it. It expires after `PENDING_SECONDS`. It
carries the route the first step was judged on, and every later route re-judges that route (reach,
off, remote blocked) with the same helpers `attempt_login!` uses, so unplugging a foothold between
the steps ends the attempt.

**Code.** `GET /mfa/device` serves the current code only to a player whose inventory holds the
device (type `code_device`, id and `owner` equal to an authored device, not `client_forged?`).
`POST /mfa/verify` compares the typed code with the device's code for the pending account in
constant time. A wrong code is a failed sign-in: it goes through `record_login_failure!` on the
same `pcId|username` key, so `maxAttempts` covers both steps. The server does not ask whether the
player holds the device at verify time: knowing the current code is the proof, and the only way a
code reaches the browser is the device route.

**Push.** `POST /mfa/prompt` sends one request and answers at once. In order: the pending record
is a push kind and live; at least `PROMPT_GAP_SECONDS` since `last` (else `tooSoon`); `n` below
`MAX_PROMPTS` (else the attempt ends); then `n += 1`, `prompts[npcId] += 1`, and the decision:

1. The account was re-enrolled (S8b): the request is on the player's own phone; answer `waiting:
   "own_phone"`.
2. The player holds the owner's phone: answer `waiting: "held_phone"`. Nobody else can approve.
3. The owner's phone was taken and is not held (dropped, left in a room): nobody answers.
4. Kind `push_number_match`: the owner never approves.
5. Kind `push`: `always` approves; `pestered` approves when `prompts[npcId]` has reached
   `promptPatience`; `never` does not.

`prompts[npcId]` counts across attempts and across PCs, and resets to 0 when a request is
approved, so fatigue builds up as the player keeps trying and starts again after a success. An
approval starts the session exactly as a correct password does today.

`POST /mfa/approve` is the player approving on a phone: the pending record is a push kind; the
player holds the owner's phone, or the account was re-enrolled; for number matching the posted
number equals the pending number. A wrong number cancels the attempt (as tapping the wrong number
does) and is not counted towards a lockout.

A knocked-out owner: the server's knock-out record is trusted from the browser, so it is used
only to refuse (an owner recorded as knocked out approves nothing), never to grant.

**Helpdesk (S8b).** New concern `app/models/break_escape/helpdesk_access.rb`.
`request_helpdesk!(desk_id, username, what, answers)` checks, in order: the desk exists; its NPC is
in `encounteredNPCs`; `what` is in the desk's `resets`; the desk has not stopped serving this
username (`helpdeskTries` at `maxTries`); the username is an account; the rule holds (`none`:
always; `questions`: at least `needs` normalised answers equal the account's `creds.recovery`
values; `callback`: the player holds the account owner's phone). An unknown username and wrong
answers take the same counted refusal, so the route cannot be used to list accounts.

A grant writes `accountResets[npcId]` with `'password' => true` or `'mfa' => true`:

- **Password.** `effective_password(npc)` returns `creds.resetPassword` once reset, else
  `creds.password`. Only `attempt_login!` (`game.rb:3487`) changes to call it. The old password
  then fails at sign-in. Other readers of `creds.password` keep the authored value on purpose: a
  post-it (`game.rb:3425`) and an earlier capture (`game.rb:2697`) are now out of date, as they
  would be. The keyring lists a new implicit entry `<npcId>.reset` (kind `password`) built beside
  the captured-account entries (`credential_keyring.rb:263-285`), so the credential arrives by
  the keyring path the other plans use.
- **Second factor.** The account's device generation goes from 0 to 1. Codes from the old device
  stop verifying; `GET /mfa/device` with `npc_id` serves the new code with no item (the player's
  own phone is the device); push requests wait for `POST /mfa/approve` with no phone check.

### 5.3 Client

- **Sign-in screen** (the `password` scene on the PC monitor). On an `mfaRequired` answer it swaps
  to a second pane in the same monitor frame: for `code`, one six digit field and a Verify button;
  for push kinds, a line saying a request was sent, the two digit number when there is one, the
  count sent, and a "Send again" button that calls `POST /mfa/prompt`. X closes the screen and
  abandons the attempt. Failures show `attemptsLeft` as the password pane does.
- **`code-device` scene (new).** Opened from the inventory item. A small device frame from
  `device-frame.css`, the owner's headshot and name, six digits in VT323 and a bar that drains
  to the end of the window. It calls `GET /mfa/device` on open and when the bar empties. New,
  because no existing scene shows a value the server changes over time; the `authenticator` scene
  is a phone and the device is not one.
- **`authenticator` scene, `live` mode (extension).** When `params.mode === "live"` the request
  cards come from `GET /mfa/phone` instead of the authored timeline, each card carries Approve
  and Deny (for number matching, three number buttons), and Approve calls `POST /mfa/approve`.
  The phone shell, status bar and card look are the existing ones. With no `mode: "live"` the
  scene behaves as today, so the awareness course's uses are unchanged. A held NPC phone opens
  this from a "Sign-in requests" entry beside its Friendface entry; the entry is drawn only when
  the bootstrap says `mfaDeclared`.
- **`helpdesk-request` scene (new, S8b).** A paper request form in the shared frame: username
  field, a choice of what is asked for, one text field per `questionLabels` entry, Send. Opened by
  an ink tag `#helpdesk_request:<deskId>` in the helpdesk NPC's conversation, or from a granted
  pretext ask that names `helpdesk: "<deskId>"`. The answer sets the client global
  `helpdesk_<deskId>_result` (`granted`, `refused`, `blocked`) so the NPC's ink can voice the
  matching authored line. That global is a mirror for dialogue only; nothing reads it to grant.
- **Events** (for scenario `eventMappings`, so barks stay in scenario files): `mfa_required`,
  `mfa_prompt_sent` `{ npcId, pcId, n }`, `mfa_approved` `{ npcId, pcId, by }`, `mfa_failed`,
  `helpdesk_answered` `{ deskId, result }`; each also as `<name>:<id>`. The owner's reaction to a
  buzzing phone is a bark the scenario maps to `mfa_prompt_sent:<npcId>`.
- All server and author text is set with `textContent`. Both new scenes use pixel fonts and 2px
  borders, close with X only, and go on every JS test harness copy list.

### 5.4 Determinism

No random draw is added. Owner approval is a threshold on a server count. Code digits depend on
server time and a server key, and decide nothing but equality.

## 6. Server routes

All under `/games/:id`, in `GamesController`, each added to the `set_game` list and authorised as
`show?`. "Locked" means inside `with_game_lock` (`games_controller.rb:2890`). Status codes follow
the existing rule: 404 unknown thing, 403 out of reach, 422 a refusal the player caused. Every
answer is `Cache-Control: no-store`. The generic refusal is the existing `Sign in required` body.

`POST /login` keeps its parameters. Its one new answer, when a second step is due (locked, as
today): status 200, `{ success: false, mfaRequired: true, mfa: "<kind>", pcId, number? }`.
`number` is present only for `push_number_match`. No session exists yet.

| Route | Params | Checks in order | Writes and answer |
|---|---|---|---|
| `GET /mfa/device` | `item_id`, or `npc_id` for a re-enrolled account | Scenario declares an MFA policy (else 404). `item_id`: an authored `code_device`, held in the server's inventory, not forged (else 403 `no such device`). `npc_id`: `accountResets[npc].mfa` (else 403) | No write. `{ deviceId, displayName, code, secondsLeft }` |
| `POST /mfa/verify` (locked) | `pc_id`, `code` | PC found (404). Pending record for the PC, kind `code`, not expired (else generic 422, record dropped). Stored route still holds (403 as sign-in gives). Lockout key (422 `lockedOut`). `code` is six digits and equals the current or previous window's code | Wrong: `record_login_failure!`, answer as a wrong password plus `mfaIncorrect: true`; the pending record stays until it expires or the key locks out. Right: failures cleared, record dropped, `start_login_session!`, the normal sign-in answer |
| `POST /mfa/prompt` (locked) | `pc_id` | PC found. Pending record, push kind, live (else generic 422). Stored route still holds. Lockout key. Gap since `last` (else 422 `tooSoon: true, retryAfterS`). `n < MAX_PROMPTS` (else record dropped, 422 `expired: true`) | Counts, then the decision in 5.2. Not approved: `{ success: false, approved: false, promptsSent, waiting? }`. Approved: the normal sign-in answer plus `approvedBy: "owner"` |
| `GET /mfa/phone` | `npc_id` (string: that NPC's phone; null: the player's own) | Held phone test as `POST /friendface_phone` uses (403 `no such phone`); own phone lists re-enrolled accounts only | No write. `{ requests: [{ pcId, host, username, n, numbers? }] }`, at most one per PC. `numbers` is three two digit choices, one of them right, for number matching |
| `POST /mfa/approve` (locked) | `pc_id`, `number?`, `deny?` | PC found. Pending record, push kind, live. Phone held for the pending account, or account re-enrolled (403). Stored route still holds. `deny`, or a wrong `number`: record dropped, `{ success: false, cancelled: true }` | Right: record dropped, `prompts[npcId] = 0`, `start_login_session!`, the normal sign-in answer plus `approvedBy: "player"` |
| `POST /helpdesk/request` (locked, S8b) | `desk_id`, `username`, `what`, `answers` (map of question id to text; body refused over 4 KB before parsing) | The six checks in 5.2. Desk unknown: 404. NPC not met, `what` not offered: generic 422. Stopped serving: 422 `blocked: true`. Unknown username or rule not met: tries counted, 422 `refused: true, triesLeft` | Grant: `accountResets` written; `{ granted: true, what, username, password? }` (`password` only for `what: "password"`). A repeat of a granted request answers the same body again, so a lost answer can be retried |

A refused second step never says more than the first step already did: the `mfaRequired` answer
itself tells the player the password was right, as a real second prompt does.

## 7. What reaches the browser, and what never does

| Thing | Sent | Withheld |
|---|---|---|
| `policies.*.mfa` | Never as a field. The kind appears only in the `mfaRequired` answer for the PC being signed in to. The bootstrap gains one boolean, `mfaDeclared` | The policy map stays server only, as today |
| A code | Only in `GET /mfa/device`, only while the device is held (or the account re-enrolled) | Not in the bootstrap, the item, the inventory answer, or any sign-in answer |
| The number to match | In the `mfaRequired` answer (the player's own sign-in screen) and, among three choices, in `GET /mfa/phone` to a player holding the phone | Never marked as the right one on the phone |
| `habits.approvesPrompts`, `promptPatience`, `prompts` counts | Never. The client learns only `approved` true or false per request | All of it |
| `creds.mfa`, `creds.recovery`, `creds.resetPassword` | `resetPassword` once, in the granting answer and then as the keyring entry's secret | `creds` is deleted from every NPC (`game.rb:7376`); `recovery` is never sent; right and wrong answers are not told apart per question |
| `helpdesks` | `questionLabels`, `resets` and the desk's NPC id, as `helpdeskForms` in the bootstrap | `verify`, `needs`, `maxTries`, `questions` order beyond the labels |
| `code_device` item | Type, id, name, `owner` (an NPC id, as a phone carries) | Nothing secret is on the item |

No-exposure tests (section 11) assert each row against captured answers, and the leak scanner
(`tools/playtest/lib/access_leak_scanner.rb`) gains lines for a code, a recovery answer and a
reset password appearing anywhere before they are earned.

## 8. State and saved games

Three server-owned keys join `ACCESS_STATE_DEFAULTS` (`game.rb:3021`). None is read from a sync
body, none is sent, and a reset drops them.

| Key | Shape | Bound | Sent |
|---|---|---|---|
| `mfa` | `{ 'pending' => { pcId => record }, 'prompts' => { npcId => count } }` | One record per sign-in PC, one count per account. Expired records are dropped when read | Never. Route answers carry only the one changed value (`promptsSent`, `approved`) |
| `accountResets` | `{ npcId => { 'password'?, 'mfa'? } }` | One per account | Never; the keyring answer lists the new entry through its existing `rev` digest, so an unchanged keyring is not re-sent |
| `helpdeskTries` | `{ "deskId\|username" => n }` | Account keys bounded by authoring; non-account keys capped at 200, oldest dropped, as `loginFailures` does (`game.rb:4357-4364`) | Never; `triesLeft` rides on the refusal |

Nothing is added to synced client state. The client holds the pending kind and number in memory
only. **Reload:** the sign-in screen is closed by a reload, and the next password step overwrites
the pending record; `prompts`, `accountResets` and `helpdeskTries` persist. **Old games:** a game
made before this feature has no `mfa` policy value, so `mfa_step_for` is `none` everywhere, every
`/mfa/*` route answers 404, and `/helpdesk/request` answers 404 for want of a desk.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`), each property with a description naming its reader:
`policies.<name>.mfa` (enum) in the closed policy block (`:261-280`); `creds.mfa`,
`creds.recovery` (id map of strings), `creds.resetPassword`, all `x-serverOnly`; habit keys
`approvesPrompts` and `promptPatience`; item type `code_device`; top-level `helpdesks`
(`x-id-map`, closed entries, `x-serverOnly` with `x-servedBy: "bootstrap helpdeskForms"`, `npc`
with `x-ref: "npc"`). `ScenarioSchema::STARTS` gains the `helpdesks` pointer if a walker asks for it.

**Validator.** New `scripts/validate_mfa.rb`, called from `validate_scenario.rb` beside the
habits check, reading `MfaModel` and `HelpdeskModel`.

Errors: unknown `mfa` value; kind `code` on a policy whose PCs admit an enrolled account with no
`code_device`; two code devices for one owner; a `code_device` with no `owner`, or an owner that
is not an account; push kind where an admitted enrolled account's NPC has `phone: false`;
`approvesPrompts` or `promptPatience` invalid or on a non-room NPC; a helpdesk `npc` that is not a
room NPC or serves two desks; a `questions` id missing from any account's `recovery` that the desk
could be asked about; `needs` above the number of questions; `resets` naming `password` when no
account has `resetPassword`; a `resetPassword` or `recovery` value that appears in any ink (the
rule `creds.password` already has); `resetPassword` equal to the account's `password`.

Warnings: every account at an MFA PC is exempt (the policy does nothing); push kind where every
admitted owner is `never` and holds no declared phone (no route through the second step, unless a
token, claim or helpdesk exists); `promptPatience` set on an NPC whose habit is not `pestered`;
`verify: "questions"` where an answer appears in no readable text, feed post or document the
player can reach (the same reachability walk `npc_habits/clues.rb` does for password clues);
`verify: "callback"` where the owner declares no phone item; `maxAttempts` absent on a `code`
policy (the code can be guessed without limit).

Information lines: per MFA PC, the kind and each admitted account's way through the second step.

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`). In scope for M1 and H1, not deferred:
a sign-in lock under an MFA policy gets a second key edge per admitted account: the `code_device`
item (code), the owner's phone item or the label "owner approves (pestered)" (push), the phone
item only (number matching). A helpdesk grant is a key source for the account's sign-in, with the
readable homes of its answers as its own requirements. `scripts/lock_key_diff.rb` output for a
scenario without the fields is unchanged. Tests: `test/js/dungeon-graph-mfa.test.mjs`.

## 10. Effect on existing scenarios

| Change | Effect when the new fields are absent |
|---|---|
| `attempt_login!` and `attempt_credential_login!` call `mfa_step_for` | Returns `none`: same path, same answer, same state writes |
| `KINDS` gains an `mfa` flag | Read only when a policy sets `mfa` |
| `NpcHabits` preset gains `approvesPrompts` | `expand!` writes one more habit key into every NPC that has `awareness`. It is withheld from the browser and read only by `/mfa/prompt`. Saved scenarios made earlier lack the key and read as `never` |
| `effective_password` | Returns `creds.password` unless `accountResets` names the account |
| `authenticator` scene | `live` mode is entered only by `mode: "live"`; its other branches are not edited |
| Bootstrap `mfaDeclared`, `helpdeskForms` | Added only when true or non-empty |
| Three `ACCESS_STATE_DEFAULTS` keys | Empty maps in every game; never sent |

Proof: (1) `test/controllers/break_escape/mfa_absent_test.rb` runs the existing sign-in and
keyring controller cases against their fixtures and asserts byte-equal answers and no `mfa`,
`accountResets` or `helpdeskTries` content; (2) a fixture test that the bootstrap of
`test_access_signin`, `test_access_keyring` and `ca03_helpdesk_reset` equals a stored fixture
copy (the new habit key is withheld, so nothing in it changes); (3) the validator over every scenario shows no new
error or warning line; (4) the existing `authenticator` node tests pass unedited; (5) scripted
reruns of `test_access_signin`, `test_access_keyring`, `test_access_habits` and the two awareness
scenarios that open the authenticator.

## 11. Tests

**Unit** (`test/unit/`): `mfa_model_test.rb` (kinds, enrolment, device lookup, code for a fixed
time and key, previous window accepted, the one before refused, generation changes the code);
`npc_habits_test` additions (preset per level, authored value wins, `promptPatience` bounds);
`helpdesk_model_test.rb` (normalising, `needs`, code point caps).

**Controller** (`test/controllers/break_escape/`): `mfa_code_test.rb`, `mfa_push_test.rb`,
`mfa_phone_test.rb`, `mfa_keyring_test.rb`, `helpdesk_request_test.rb`, `mfa_absent_test.rb`.
Cases include: device route refused without the item, with a forged item, with another owner's
device; verify with no pending record; verify after the foothold is unplugged; wrong codes reach
the lockout and a right code is then refused; exempt account skips the step; `pestered` approves
on exactly the patience count and the count survives a new attempt; `never` at `MAX_PROMPTS`;
number match never approved by an owner; approve refused without the phone; wrong number cancels;
token skips, saved connection does not; claim skips; helpdesk unknown user and wrong answers give
the same body; `maxTries`; retry of a granted request; old password refused and reset password
accepted; hostile text in `answers` and `username` (long, HTML, control characters) stored
nowhere and echoed nowhere.

**JS** (`test/js/`): `mfa-signin-pane.test.mjs`, `code-device.test.mjs`,
`authenticator-live.test.mjs` (plus the existing authenticator tests unedited),
`helpdesk-request.test.mjs`, `validator-mfa.test.mjs`, `dungeon-graph-mfa.test.mjs`.

**Feature scenario** `scenarios/test_ops_mfa/`: three rooms, six accounts.

| Beat | What happens | Server record afterwards |
|---|---|---|
| F1 | Right password at a `code` PC | No session; `mfa.pending` has the PC |
| F2 | Device route before holding the device | 403; no code in any captured answer so far |
| F3 | Owner hands the device over; read it; type the code | Session `via: password`; pending gone |
| F4 | Second owner's device found in a drawer | As F3 |
| F5 | Exempt service account at the same PC | Session with no second step |
| F6 | `push` PC, low-awareness owner, three requests | Approved on the third; `prompts` back to 0 |
| F7 | `push` PC, high-awareness owner, requests to the cap | Never approved; attempt expired |
| F8 | Take the high-awareness owner's phone, approve on it | Session; `approvedBy: player` |
| F9 | Number matching, owner holds phone | Never approved |
| F10 | Number matching with the held phone, wrong then right number | Cancelled, then session |
| F11 | Session token to an MFA PC; saved connection to it | Token session at once; saved connection stops at the step |
| F12 | Helpdesk, wrong answers to `maxTries` for one account | `helpdeskTries` at the cap; `blocked` |
| F13 | Helpdesk, right answers found on a feed post and a document | `accountResets` password; keyring lists the entry; old password refused |
| F14 | Helpdesk re-enrols a second factor (callback rule, phone held) | Old device's code refused; own-phone code accepted |

**Scripted playtest** through `window.__test`, each beat checked twice: what the browser was sent
(captured answers scanned for codes, answers and passwords not yet earned) and what the server
recorded (the column above, read by the verify script). Codes are read from the device route, so
the run does not depend on the clock.

**Live proof** on the real client path with a keyless server on the builder's own port, a game
made in that run: F1 to F3, F6, F8, F10 and F13, by clicks and typed input, with screenshots of
the code pane, the device, the phone and the request form, plus a reload in the middle of F6.

## 12. Build steps and shared files

Order: M1, M2, M3, M4, then H1, H2. Each stage: model and unit tests, server and controller
tests, client and JS tests, validator, schema and graph, the scenario beats, scripted run, live
proof, then the two docs (`README_scenario_design.md` feature index rows A22 and A23, and
`docs/ACCESS_AND_NETWORKS.md`) in the same change as the stage that completes the feature.

New files: `lib/break_escape/mfa_model.rb`, `helpdesk_model.rb`;
`app/models/break_escape/mfa_access.rb`, `helpdesk_access.rb`; `scripts/validate_mfa.rb`;
`public/break_escape/js/minigames/code-device/`, `helpdesk-request/`; `systems/mfa-client.js`;
their CSS; the tests above; `scenarios/test_ops_mfa/`.

Shared files (re-read just before editing, own block only, explicit paths):

| File | This plan's edit | Also touched by |
|---|---|---|
| `app/models/break_escape/game.rb` | `attempt_login!` insert, `effective_password`, three state keys | S5a, S5c (sign-in order), S3 (sessions) |
| `credential_login.rb`, `credential_model.rb` | step before session start; `mfa` flag on kinds | S5b, S7 (keyring) |
| `credential_keyring.rb` | implicit `<npcId>.reset` entry | S5b, S7 |
| `games_controller.rb`, `config/routes.rb` | six routes, `set_game` lists | every plan |
| `lib/break_escape/npc_habits.rb`, `scripts/validate_npc_habits.rb` | one habit, one parameter | S7 (reads `password` habit) |
| `scripts/scenario-schema.json`, `validate_scenario.rb`, `generate_dungeon_graph.rb` | blocks named in section 9 | every plan |
| `minigames/password/password-minigame.js`, `systems/pc-sessions.js` | second pane, `mfaRequired` handling | S5c if it changes the sign-in screen |
| `minigames/authenticator/authenticator-minigame.js` | `live` mode | none |
| `minigames/index.js`, `minigame-starters.js`, JS harness copy lists | two scenes | S6, S7 |

## 13. Log rows this feature writes (for S9)

| Event | Who | Where | When |
|---|---|---|---|
| `mfa_challenge` | account username | PC id, route (keyboard, foothold, from, credential kind) | A right first step meets a second step |
| `mfa_code_ok`, `mfa_code_wrong` | account | PC id | `POST /mfa/verify` |
| `mfa_prompt_sent` | account | PC id, request number | Each `POST /mfa/prompt` |
| `mfa_prompt_approved` | account, `by` owner or held phone | PC id | Approval by either path |
| `mfa_prompt_denied` | account | PC id | Deny or wrong number on a phone |
| `mfa_expired` | account | PC id | Request cap reached |
| `helpdesk_request` | account asked about, desk NPC | desk id, `what`, result (granted, refused, blocked) | `POST /helpdesk/request` |
| `account_password_reset`, `account_mfa_reenrolled` | account, desk NPC | desk id | A grant |

Rows never carry a code, a number, an answer or a password. A run of `mfa_prompt_sent` rows for
one account in a short time is the trace a defender would look for.

## 14. Cross-plan requests

1. **S5c (accounts):** say whether a local account is subject to the PC policy's `mfa`. This plan
   assumes every enrolled account is, and offers `creds.mfa: false` for exceptions. If S5c makes
   local accounts skip it by kind, `MfaModel.enrolled?` should read S5c's account kind.
2. **S5a, S5c and this plan** all insert into `attempt_login!` between the password match and
   `start_login_session!`. Proposed order: account kind and PC admission (S5c), then the second
   step (S8), then the session write with its access level (S5a). The orchestrator to confirm.
3. **S3 (technique cards):** a session granted by a card does not pass through sign-in, so it
   meets no second step. This plan relies on that; S3 to state it. A card that yields a password
   into the keyring does meet the step when the password is typed.
4. **S5b and S7:** harvested or cracked passwords are typed sign-ins and meet the second step. No
   change asked, only that neither starts a session directly.
5. **S9 (log rows):** the helper must accept a row with no session (every row in section 13 up to
   the approval is written before one exists) and a `by` field.
6. **S1 (hosts):** a host with no sign-in has no policy and so no second step. A headless sign-in
   host is covered, since the pending record stores the route.
7. **Feature scenario names:** `test_ops_mfa` covers S8b too; no `test_ops_helpdesk` is asked for.

## 15. Open questions for the user

Each has a recommended answer, and the plan is written to it.

1. **What clock does the code run on?** The server has no game clock. (a) Server wall-clock time,
   a new code every 60 real seconds, the previous one still accepted. (b) No clock: a new code
   each time the device's button is pressed. (c) Build a server game clock first. *Recommend (a):*
   it behaves like the real thing and needs no new clock; (b) is the fallback if a ticking code
   proves awkward in play.
2. **Does a wrong code count towards the account lockout?** (a) Yes, same counter as a wrong
   password. (b) Separate counter. (c) Not counted. *Recommend (a):* one rule to teach, and a six
   digit code cannot be guessed past `maxAttempts`.
3. **How does a careless owner decide?** (a) A fixed count: approves on request number
   `promptPatience` (default 3). (b) A seeded chance per request. *Recommend (a):* repeatable and
   easy to author; (b) adds little.
4. **Awareness presets for the new habit.** *Recommend* low `pestered`, medium `never`, high
   `never`. The option is medium `pestered` with a patience of 6.
5. **Should a careful owner react to being pestered** (report it, lock the account)? *Recommend
   not now:* only the log rows are written; reactions belong with the parked defence work.
6. **Can the player talk an owner into reading out a code or tapping a number?** The pretext
   judge runs in the browser, so the server could not check it. *Recommend no* for S8a; holding
   the device or the phone is the route. It could return with a server-checked pretext route.
7. **Borrowing:** does the owner notice the device or phone is gone, and can the player give it
   back? *Recommend:* no engine rule in S8a; a scenario scripts it with existing give and event
   tools.
8. **After a helpdesk password reset, does the old password stop working?** (a) Yes. (b) Both
   work. *Recommend (a):* it is what a reset is. The player always holds the new one, so it cannot
   strand them; a post-it or earlier capture showing the old one becomes stale on purpose.
9. **Does the real owner react to being reset** (cannot sign in, grows frustrated, rings the
   desk)? *Recommend not now*, for the same reason as question 5.
10. **Re-enrolment target.** After the helpdesk moves a second factor, the plan treats the
    player's own phone as the device without requiring a phone item in the inventory. The option
    is to require the scenario to give the player a phone. *Recommend* the simpler rule.
11. **Is S8b worth a typed form?** Typed answers are what let the server check them without
    trusting the browser. The option is choices picked in dialogue, which is easier to play and
    can be brute-forced within `maxTries`. *Recommend* the typed form.
