# Ops layer: multi-factor sign-in and helpdesk recovery (S8a, S8b)

Status: plan, not built. Base: `docs/ops-layer-plan`. Feature ids on landing: A22 (multi-factor
sign-in) and A23 (helpdesk account recovery). Feature scenario: `test_ops_mfa`. This plan is
standalone: a builder needs this file, `docs/ACCESS_AND_NETWORKS.md` and the code it points at.

Related plan: `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` (feature A25) puts the same second
step on a lock as an attribute of the thing it guards. It builds on the shared functions of
section 5.2 and the `/mfa/*` routes of section 6 and is built after M3.

Pointers are `file:line` in the tree as read on 2026-11-19.

## 1. What this adds and why, in play

**S8a, multi-factor sign-in (A22).** A sign-in policy can ask for a second step after a correct
password. Three kinds:

- `code`: the sign-in screen asks for a six digit code. The account's owner carries a **code
  device**, a real item. The player gets it the way any NPC item is got (handed over in
  conversation, picked up after a knock-out, found where a careless owner left it), opens it
  from the sign-in screen or the inventory and reads the code showing now. The code changes
  every minute and works once. The server only shows a code to a player who holds the device,
  and takes it from its owner only when the owner's story offers it or the owner is knocked out.
- `push`: a sign-in request goes to the owner's phone. An owner with careless habits approves once
  enough requests have arrived (prompt fatigue); a careful owner never does. If the player holds
  the owner's phone, the request arrives there and the player approves it.
- `push_number_match`: as `push`, but the sign-in screen shows a two digit number that must be
  picked on the phone. The owner cannot see the player's screen, so pestering never works. Holding
  the phone still does.

What it teaches: a password alone stops being enough; a second factor is only as good as the
person or the object holding it; number matching removes the fatigue route; a session that is
already open, a stolen session token, or access gained through a weakness in a service is not
asked for a second factor at all.

**Which ways in meet the second step.** A typed password does, wherever the player got it; a
way in that proves no password does not, and a saved connection is refused (the list is in section 5.2).

**S8b, helpdesk recovery (A23, lower priority).** A helpdesk NPC can reset an account's password
or move its second factor to the caller, after checking who is asking under a rule the scenario
sets: `none`, `questions` (answers the player types, learned from feed posts, documents or
conversation) or `callback` (the desk rings the number on file, so the player must hold the
owner's phone). A password reset puts a usable credential in the keyring and clears the
account's lockouts; a second-factor reset moves the account's second step to the player's own
phone. It teaches that the recovery path is part of the sign-in, and that facts found online
prove nothing about a caller.

Design rules every stage keeps:

1. Every grant is a server decision from server-held state. Nothing the browser claims (a global,
   a pretext verdict) can stand in for it.
2. A secret reaches the browser only once earned: a code only while its device is held, a reset
   password only in the answer that grants it, the desk's answer key never.
3. No rolls. Whether an owner approves a request is a count against a threshold, so runs repeat.
4. A policy's kind is public and its answers are not. Which PCs ask for a second step, and of
   which kind, ships with the scenario's policies; what satisfies the step never does
   (section 7).

## 2. What the code does today (verified)

### 2.1 Sign-in, policies, habits, items

| Area | Today | Where |
|---|---|---|
| Typed sign-in | Order: PC found; route branch (`from`, foothold, keyboard: reach, off, remote blocked); lockout key (`"<pcId>\|<username>"`, built inline) checked before the password; account lookup; password equals `creds.password`; PC admits account; failures cleared; `start_login_session!`; answer. Failure goes to `record_login_failure!` | `app/models/break_escape/game.rb:3444-3503` |
| Lockout count | `loginFailures[key]`, lockout at policy `maxAttempts`, never expires | `game.rb:4333-4378` |
| Lockout key | The string `"<pcId>\|<username>"`, with no shared builder. Built in `attempt_login!`, in `account_locked_out_at?` (asked by the keyring sign-in, the claim and the guest paths) and in `AccessWork.locked_out_at?` (NPC frustration and feed posts; plain Ruby with no `Game`). Split apart in `lockout_pcs_for_client` and `account_login_key?` | `game.rb:3483`, `:3580`, `:3591`, `:4323`; `lib/break_escape/access_work.rb:1393`; `normalise_username` at `lib/break_escape/access_identities.rb:54` |
| Session write | One place, record `{id, via, credential?, foothold?, from?, relay?}` | `game.rb:4388-4418` |
| Sign-in answer | `npcId, username, displayName, via, portrait, avatar` plus route fields | `game.rb:4433-4461` |
| Keyring sign-in | Nine ordered steps; `saved_connection` honours lockouts, `token` and `assist_invite` do not | `app/models/break_escape/credential_login.rb:22-89`; kinds at `lib/break_escape/credential_model.rb:21-27` |
| Policy read | `effective_policy(pc)`: the PC's `policy`, else `defaultPolicy`; unknown name gives `{}`. No `mfa` key exists | `game.rb:3360`; schema `scripts/scenario-schema.json:261-280` (closed block) |
| Policies and the browser | `policies` and `defaultPolicy` ship in the bootstrap as authored, on purpose ("hold no secrets"). Three client modules read `gameScenario.policies` | `game.rb:2471-2473`; `systems/pc-policy.js:33`, `systems/workstation-state.js:685`, `systems/npc-reports.js:334` |
| Habits | `locksScreen`, `writesDown`, `password`, `holdsDoors`; presets from `awareness` set only `locksScreen` and `holdsDoors`. `expand!` writes `PRESETS[level].merge(own)` back into each NPC of the saved scenario, and fixtures pin that output. `valid_parameter?` accepts only `passwordPattern`, as a non-empty string | `lib/break_escape/npc_habits.rb:18-38`, `:55-57`, `:103`, `:127-176`; `test/fixtures/format_8c/test_access_habits.old.loaded.json` |
| Habits and the browser | Allow list: only `habits.screen` and `habits.print` ship. `creds`, `awareness`, `role`, `workarounds` are deleted from NPCs | `game.rb:7332-7344`, `:7376-7383` |
| Access state | Server-owned keys in `ACCESS_STATE_DEFAULTS`; none read from a sync body, none sent; a reset drops them | `game.rb:3021-3059` |
| Held item proof | Inventory entry whose `type`, `id` (and stored field) equal the authored definition, and not `client_forged?` | `app/models/break_escape/credential_keyring.rb:42-64` |
| NPC phone | Item `type: "phone_friendface"` with `owner`. `held_friendface_phone(npc_id)` reads the server's inventory and counts only a phone the scenario declares with that owner; `phonesTaken` records a phone leaving its NPC | `app/models/break_escape/social_feed.rb:186-246`; `games_controller.rb:1722-1730` |
| Knock-out record | Claimed by the browser's sync; accepted only for a met room NPC that is neither `koImmune` nor `npcType: "phone"`. `disableAttacks` is the client's refusal to punch, not a server test | `game.rb:2008-2033` |

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
  `systems/minigame-starters.js:1310-1321`). An awareness course demonstration with attacker
  controls and no server route, extending `SocialOverlayScene` (`:65`). A phone the player
  approves on needs different cards and no attacker controls, so **S8a adds a subclass scene,
  `authenticator-live`** (section 5.3, which holds the line pointers; section 10 proof 5 names
  its one live caller).
- **`dual-auth`** (`minigames/dual-auth/dual-auth-minigame.js`). A two-person PIN panel for one
  mission: a lock on a room object, with no account or device, whose PINs are read in the
  browser (`:15-18`). **S8a neither reuses nor changes it.**
- **`ca03_helpdesk_reset`** models the reset as a pretext call
  (`scenarios/ca03_helpdesk_reset/scenario.json.erb:640-790`): an ask `reset_password` whose
  `verification` lists fact ids and whose grant is `setGlobal: { leila_reset_granted: true }`
  (`:760-772`). The verdict is computed in the browser by `systems/pretext-judge.js` and nothing
  changes on the server. **S8b keeps this pattern for the conversation** (it paces the call and
  voices the lines) and adds a server route for the grant, because a global cannot be what
  hands over a credential.

### 2.4 The sign-in client and the minigame manager

- **`api.login` throws only on a non-2xx answer.** A 200 answer with `success: false` reaches
  the last test in `PcSessions#signIn` (`public/break_escape/js/systems/pc-sessions.js:552-554`)
  and is drawn as an error (`minigames/password/password-minigame.js:2492-2495`);
  `signInWithCredential` has the same test (`pc-sessions.js:619-621`). The session mirror is
  written in one place per sign-in (`pc-sessions.js:555-562`). Section 5.3 says what changes.
- **One minigame runs at a time**, with one exception, the parent and child hand-over
  (`minigames/framework/minigame-manager.js:66-99`, `:540-566`, `:616-655`). Section 5.3 states
  the hand-over rules the sign-in screen relies on.

## 3. Build stages in order

Each stage ends tested and, from M1b on, playable. Letters M (multi-factor) and H (helpdesk).

| Stage | Adds | Done when | Size |
|---|---|---|---|
| M1a (server) | Policy `mfa: "code"`, `MfaModel` with `held_item_sources`, the `code_device` item and its gate (`OWNER_BOUND_TYPES` at the three NPC-item sites), the pending second step in `attempt_login!`, the route re-judge, the lockout key functions, the five-minute closure of the code step after thirty wrong codes (`closedAt`, the `codeLocked` refusal, the `mfa_code_locked` row), the refusal of a saved connection at an MFA PC, `GET /mfa/device`, `POST /mfa/verify`, schema and validator | Controller tests: a `code` PC answers `mfaRequired` to a right password and opens a session only on a right code; the thirtieth wrong code closes the step for five minutes of server time; the device cannot be pulled from an owner who has only been met; a saved connection to that PC is refused | M |
| M1b (client) | `PcSessions` second-step handling and `completeSecondStep`, `mfa-client.js`, the sign-in screen's code pane, the `code-device` scene as a child of the sign-in screen, dungeon graph, scenario beats F1 to F6, live proof | A player signs in at a `code` PC with a device they were handed | M |
| M2 | `mfa: "push"`, habit `approvesPrompts` with `promptPatience` resolved at read time, `POST /mfa/prompt`, the waiting pane | Pestering a low-awareness owner signs the player in; a high-awareness owner never approves | S |
| M3 | `mfa: "push_number_match"`, `GET /mfa/phone`, `POST /mfa/approve`, the `authenticator-live` scene | A held phone approves a request; number matching defeats pestering but not a held phone | S |
| H1 | `helpdesks`, `creds.recovery`, `creds.resetPassword`, `POST /helpdesk/request` for `what: "password"`, lockouts cleared on a grant, the `helpdesk-request` form, the keyring entry | The player locks an account out, wins a reset with typed answers and signs in at the locked PC with the issued password | M |
| H2 | `what: "mfa"` (re-enrolment onto the player's own phone) and `verify: "callback"` | A re-enrolled account's second step is answered from the "My phone" button on the sign-in screen | S |

M1a to M3 are S8a. H1 and H2 are S8b; H1 needs none of S8a, H2 needs M1b to M3. Each stage
registers its own log events and secret sources and writes and asserts its own rows
(section 13).

**Later slices** (named here, not designed):

- *The second step for saved connections.* A saved connection to an MFA PC would stop at the
  second step and finish as a keyring sign-in, in place of the refusal in section 5.2.
- *Approving from the phone with no sign-in screen open.* A held phone's own menu would list
  waiting sign-in requests.

**Related plan.** The second step on a lock (a locked PC, an archive, a door) is
`OPS_LOCK_SECOND_STEP_PLAN.md`, feature A25, built after M3.

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
  "rooms": { "finance_office": {
    "npcs": [
      { "id": "moira", "awareness": "low", "habits": { "promptPatience": 3 },
        "creds": { "username": "m.kerr", "password": "…" },
        "itemsHeld": [{ "type": "code_device", "id": "moira_code_device",
                       "name": "Code device", "owner": "moira", "takeable": true }] },
      { "id": "svc_backup",
        "creds": { "username": "svc.backup", "password": "…", "mfa": false } }
    ],
    "objects": [{ "type": "pc", "id": "finance_pc", "lockType": "login", "policy": "finance" }]
  }}
}
```

| Field | Values | Meaning | Reader |
|---|---|---|---|
| `policies.<name>.mfa` | `"none"` (default), `"push"`, `"push_number_match"`, `"code"` | The second step for every enrolled account signing in at a PC under this policy. Public: it ships with the policy | `Game#mfa_kind_for` |
| `creds.mfa` | `false` | This account is not enrolled: no second step anywhere. Models the service account left outside the policy. Absent means enrolled. This is the only exception: an account's kind (local or domain, A20) does not change the second step | `MfaModel.enrolled?` |
| item `type: "code_device"` with `owner` | NPC id | The account's code device. In the owner's `itemsHeld` (then the owner's story must offer it, or the owner must be open to a knock-out), or in a room object or container if the owner leaves it lying about. One per account at most | `MfaModel.device_for` |
| `habits.approvesPrompts` | `"never"`, `"pestered"`, `"always"` | What the owner does with a sign-in request it did not start. When not authored, read from `awareness` at the moment of the request: low `pestered`, medium `never`, high `never`, no level `never` | `Game#mfa_owner_approves?` through `MfaModel.prompt_habit` |
| `habits.promptPatience` | integer 2 to 9, default 3 | For `pestered`: the owner approves once it has received this many requests | same |

For `push` kinds the owner's phone is the `phone_friendface` item whose `owner` is the account's
NPC, when the scenario declares one. An owner with no declared phone item still receives
requests (it cannot be taken, so only the habit decides).

### 4.2 S8b

```json
{
  "helpdesks": { "it_desk": {
    "npc": "leila", "verify": "questions", "questions": ["staff_id", "manager"], "minCorrect": 2,
    "maxTries": 3, "resets": ["password", "mfa"],
    "questionLabels": { "staff_id": "Staff number", "manager": "Line manager" }
  }},
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
| `questions`, `minCorrect` | ids, integer | Which `creds.recovery` keys the desk asks, and how many must be right (default: all) |
| `maxTries` | integer 1 to 9, default 3 | Refused requests for one account before the desk stops serving that account for five minutes of server time |
| `resets` | subset of `["password", "mfa"]` | What this desk will do |
| `questionLabels` | plain text, at most 40 code points each | Field labels on the request form. Not secret |
| `creds.recovery` | map of id to plain text, at most 64 code points | The right answers. Server only |
| `creds.resetPassword` | string | The password the desk issues. Authored so that runs repeat. Server only |

The helpdesk's spoken lines stay where ca03 has them: the NPC's ink or its pretext call block.

## 5. Engine behaviour

### 5.1 Shared model (plain Ruby, usable by the validator and graph)

New `lib/break_escape/mfa_model.rb`, no Rails, like `CredentialModel`:

- `KINDS = %w[none push push_number_match code]`; `kind(policy)` returns a valid kind or `none`.
- `enrolled?(npc)`: an account whose `creds.mfa` is not `false`. Nothing else is consulted.
- `OWNER_BOUND_TYPES = %w[phone_friendface code_device]`: item types an NPC gives up only when
  its story offers them or it is knocked out (section 5.2).
- `device_for(scenario, npc_id)`: the authored `code_device` whose `owner` is the NPC, found by
  the same walk the phone uses (room objects and their `contents`, NPC `itemsHeld`, start items;
  `social_feed.rb:201-221`).
- `held_item_sources(scenario)`: returns an array of `{ type:, id:, via: }` entries (one per way
  to hold an item; `via` is `:object`, `:start`, `:offer` or `:knock_out`), so a caller asks for
  a type or an id by filtering it. It is M1a's one walk for "can the player come to hold this item", the
  same walk as `device_for` and `held_friendface_phone` (`social_feed.rb:190-221`): room objects
  and `contents`, start items, and a room NPC's `itemsHeld` only when its story offers that type
  (`AccessWork.offers_item_text?`) or the NPC can be knocked out (not `koImmune`, not
  `npcType: "phone"`, no scenario `disableAttacks`: the server's knock-out gate,
  `game.rb:2045-2059`, excludes the first two; `disableAttacks` is the client's refusal to punch,
  `player-combat.js`, mirrored in `owner_claim.rb:73-74`). Headless records and declared grants are
  never counted. The validator's "nobody can get" and "push step nobody passes" checks and the lock plan's `lock_step_never_passes?` call it.
- `code(key, game_id, device_id, window)`: six digits from an HMAC-SHA256 over
  `"<game id>|<device id>|<window>"`. `device_id` is the item's id, or `own:<npcId>` for an
  account re-enrolled onto the player's own phone (S8b).
- `code_state(typed, codes, used_window, window)`: `:right` when the typed code is the current or
  previous window's and that window is later than `used_window`; `:stale` when it equals the code
  of any of the last four windows but is not right (already used, or too old); else `:wrong`.
- `numbers(key, game_id, subject_key, npc_id, nonce)`: for number matching. One HMAC over those
  four values gives the right two digit number (10 to 99), two different wrong ones, and the
  order of the three on the phone. `subject_key` is the key of the subject's pending record: the
  PC id for sign-in, so sign-in numbers are exactly those an HMAC over the PC id gives; for any
  other subject, the key its caller files the record under (for a lock, the object or room id
  with its kind). `nonce` is the count of second steps started for that owner in this game
  (`mfaAccounts[npcId].started`, section 8), so nothing is drawn at random.
- `PROMPT_PRESETS = { 'low' => 'pestered', 'medium' => 'never', 'high' => 'never' }` and
  `prompt_habit(npc, scenario)`: the NPC's authored `habits.approvesPrompts` if valid, else
  `PROMPT_PRESETS[NpcHabits.level_of(npc, scenario)]`, else `never`. `prompt_patience(npc)`:
  the authored `habits.promptPatience` if an integer 2 to 9, else 3.
- `STEP_SECONDS = 60`, `PENDING_SECONDS = 300`, `PROMPT_GAP_SECONDS = 2`, `MAX_PROMPTS = 20`,
  `MAX_CODE_TRIES = 5`, `MAX_CODE_WRONG_TOTAL = 30`, `CODE_CLOSED_SECONDS = 300`, `DESK_STOP_SECONDS = 300`.

**Habits are resolved when read, not written at load.** `NpcHabits.expand!` writes each preset
into the saved scenario, and fixtures pin that output, so `NpcHabits::PRESETS` is not touched.
`NpcHabits` changes in two small ways: `HABITS` gains `approvesPrompts` and `PARAMETERS` gains
`promptPatience`, so an authored value validates and `expand!` carries it across; and
`valid_parameter?` (`npc_habits.rb:55-57`) becomes a per-parameter check (`passwordPattern` a
non-empty string as today, `promptPatience` an integer 2 to 9), mirrored in
`scripts/validate_npc_habits.rb`. An NPC that authors neither key expands to exactly what it
does today. `awareness` stays on the NPC in the saved scenario, so `level_of` can be asked at
request time. Neither key is in `SHIPPED_HABIT_KEYS`, so neither reaches the browser.

New `lib/break_escape/helpdesk_model.rb` (S8b): `desks(scenario)`, `desk_for_npc`,
`normalise_answer` (strip, collapse inner spaces, downcase, first 64 code points), `answers_right`.

**The code and time.** The window is `floor(server seconds / 60)`. The key comes from the
application's own secret (`Rails.application.key_generator.generate_key('break_escape/mfa')`), so
nothing secret is stored in the game row and the browser cannot compute a code. The server accepts
the current window and the one before it, so a code read at second 59 still works. The code
window and the five-minute closure of section 5.2 are the only places a player-visible outcome
depends on real time; the pending record's expiry and the gap between requests read the clock
only to tidy up and to slow a script. A scripted run reads the code from the device route as a
player would, so it repeats, and unit tests fix the time. Nothing on the server pauses with the
game; a pending record that runs out while a menu is open costs the password step again.

### 5.2 Server

New concern `app/models/break_escape/mfa_access.rb`, included in `Game` as `NetworkAccess` and
`CredentialLogin` are.

**The second step is not welded into sign-in.** `MfaAccess` is written as functions that take an
owner (the account's NPC id) and a subject, a reference to what is being opened (`{ kind: 'pc',
id: }` here): issue a challenge, send a prompt to the owner's phone, verify a code, verify an
approval, count a wrong attempt against its limits, and write the log row. `attempt_login!` and
the `/mfa/*` routes are callers that pass the PC as the subject and add what belongs to sign-in
alone (the route re-judge, the lockout key, the session write). Sign-in is one caller, and the
only one this plan builds. The functions read nothing about the subject beyond its kind and id,
so a second caller with another kind of subject needs no change to them; the `/mfa/*` routes
accept a subject that is not a PC only once the lock plan (A25) lands.

M1a builds the functions to these rules, so that a second caller adds its subject and its
record home and changes nothing here. For a `pc` subject each rule gives exactly the sign-in
behaviour the rest of this section describes; sign-in is unchanged by them.

| Rule | A `pc` subject (sign-in) | Any other subject |
|---|---|---|
| Where the record lives | `mfaPending[pcId]` | A map the caller owns, under its own key; the same fields, plus `'passed' => true` once passed |
| The expiry tidy, `tidy_pending!(map)`, run on every read and write of a record map | Drops records older than `PENDING_SECONDS` | The same, except that a record marked `passed` is kept: the caller spends it or drops it. A sign-in record is never marked `passed`, so the tidy acts on `mfaPending` as before |
| On a pass (right code, owner approval, player approval) | The function returns `:passed`; the sign-in caller drops the record, clears failures and writes the session in the same locked write | The function returns `:passed` and drops nothing; the caller marks the record `passed` |
| Route re-judge (`second_step_refusal`, below) | Run by the sign-in caller before the step | Skipped: the caller judges reach itself |
| A wrong code adds to | `tries`, `mfaAccounts[npcId].wrong`, the lockout key | `tries` and `mfaAccounts[npcId].wrong` only |
| `numbers` subject key (5.1) | The PC id | The caller's record key |
| Where the step goes | Re-enrolment is honoured: `own:<npcId>` for a code, the player's own phone for push | Re-enrolment is ignored: the owner's authored `code_device` (`device_for`) and `phone_friendface`; `ownPhone` is never set |

**Re-enrolment belongs to sign-in.** A helpdesk second-factor reset (S8b) moves the account's
sign-in and nothing else. A step on any other subject keeps using the phone and device the
scenario names for its owner, so resetting someone's work sign-in leaves their other locks as
authored. Push case 1 below, the re-enrolled branch of `POST /mfa/approve`, the `npc_id` and
`own=1` forms of the device and phone routes, and `own:<npcId>` in verify apply to `pc`
subjects only.

**The sign-in order.** `attempt_login!` (`game.rb:3444`) runs, in the order agreed across the
ops plans:

- **Route.** PC found; the route branch (reach, off, remote blocked).
- **Lockout.** On the key from `AccessIdentities.lockout_key` (below).
- **Password.** Account lookup; the typed password equals `effective_password(npc)` (S8b;
  `creds.password` until a reset).
- **Admission.** `pc_admits_account?`. The privilege plan's account-kind check (A20) sits here.
- **The second step, after admission.** If `mfa_step_for(pc, npc)` is not `none`, write the
  pending record, save, and return the `mfaRequired` answer. No session exists yet and the
  failure counter is not cleared.
- **Session.** Failures cleared; `start_login_session!`, which writes no access level (the level
  is computed by `session_access`, which the privilege plan owns); the answer.

The second step goes between today's lines 3492 and 3494. `start_login_session!`
(`game.rb:4388`) stays the only writer of a session.

**The lockout key.** M1a adds two module functions to `AccessIdentities`
(`lib/break_escape/access_identities.rb`, plain Ruby, beside `normalise_username`), so code with
a `Game` and code without one call the same thing: `lockout_key(pc_id, username)` returns
`"<pcId>|<normalised username>"`, the string built today, and `lockout_key_parts(key)` returns
`[pc_id, username]`, or nil for a malformed key. Every site changes to call them, and none
builds or splits the string itself: `attempt_login!` (`game.rb:3483`), `account_locked_out_at?`
(`:3580`), `AccessWork.locked_out_at?` (`access_work.rb:1393`), `lockout_pcs_for_client`
(`:3591`), `account_login_key?` (`:4323`) and the log plan's L1b sites, `record_login_failure!` (its `as: { typed: }`) and `add_login_lockout!` (its PC). `Game#login_lockout_keys_for(npc)` (every key in
`loginFailures` or `loginLockouts` whose username part is that account's) is built on
`lockout_key_parts`. H1 uses the functions too, so whichever of M1a and H1 is built first adds
them.

`mfa_step_for(pc, npc)` is `none` when:

- the policy kind is `none`, or the account is not enrolled (`creds.mfa: false`);
- the PC already holds this account's own session and that session is locked. A
  `via: 'password'` session can be locked because the password gets the player back in
  (`game.rb:3800-3830`), and that unlock asks for the password only: the session is already
  open, and a player who has handed the device back can still return to a PC they hold. A
  different account at that PC, or a session that has ended, meets the step as usual;
- (kind `code`) the scenario declares no device for the account and it has not been re-enrolled.
  The validator makes this an error, so it fails open only in a scenario that did not validate.

**Ways in that never reach the second step.** A claim (`claim_login_session!`, `game.rb:3527`, and
`claim_guest_session!`) refuses a foothold, so it cannot skip the step remotely. A session
granted by a technique card runs none of the sign-in checks. `token` and `assist_invite` skip
the step as they skip lockouts (`credential_model.rb:24-26`). A typed password always meets it,
wherever it came from; the keyring's `password` kind is `connects: false`
(`credential_model.rb:22`), so the client types it into `POST /login`.

**A saved connection must be typed again in two cases.** `saved_connection` is the one
connecting kind that stands for a password, so its `CredentialModel::KINDS` entry gains
`password: true`. In `attempt_credential_login!`, after the lockout, ended and expired checks and
before the session write (`credential_login.rb:59-70`), a kind with that flag is refused with
422 `{ success: false, typeToSignIn: <reason> }`, no session, no pending record and nothing
counted, when either holds:

- `typeToSignIn: "second_step"`: `mfa_step_for(pc, npc)` is not `none`. Because the test is
  `mfa_step_for`, an exempt account's saved connection and the unlock of the player's own locked
  session still work. This stops the keyring being a way round the step until the later slice
  gives a saved connection a second step of its own.
- `typeToSignIn: "password_changed"`: the helpdesk has reset the account's password
  (`accountResets[npcId].password`) and the player has not yet signed in by typing the new one
  (`accountResets[npcId].typed` is not set). `attempt_credential_login!` never compares a
  password (`credential_login.rb:22-89`), so without this a connection saved before the reset
  would outlive the old password. The **Session** step of `attempt_login!` sets `typed: true`
  when it opens a session for an account with a password reset; from then on every saved
  connection for that account works again. The flag is per account, not per connection: a saved
  connection stands for "the password the player knows", and a typed sign-in proves they know
  the new one.

The body carries the reason code and no text. Section 5.3 gives the client mapping and the two
lines the screen shows.

**Pending record.** `player_state['mfaPending'][pcId] = { 'id' => npcId, 'kind', 'foothold'?,
'from'?, 'n' => 0, 'tries' => 0, 'nonce', 'at' => server seconds, 'last' => 0 }`. One
per PC; a new first step at that PC overwrites it. It expires after `PENDING_SECONDS`;
`tidy_pending!` drops expired records whenever the map is read or written, so abandoned attempts
do not pile up. Writing one adds 1 to `mfaAccounts[npcId].started`, which is the `nonce`; the
issue function adds that 1 for every subject, so the count, and with it the numbers, never
repeats for an owner whichever caller started the step.

**Every sign-in second step judges the first step's route again.** The player can unplug a
foothold or be removed from a PC's access list between the two steps.
`second_step_refusal(pc, pending)` returns the refusal the first step would now give, or nil:
`typed_route_refusal(pc, foothold:, from:)`, which is the route branch of `attempt_login!` moved
into a method both callers use, then `pc_admits_account?`. When the step passes, the session is
written as the first step would have written it: `via: 'password'` with the stored foothold or
`from`.

**Getting the device: the server gate.** The code is only as well guarded as the device, so the
device leaves its owner under the same rule as an NPC's phone. Three places test
`type == FRIENDFACE_PHONE` today; M1a replaces that test with membership of one list,
`MfaModel::OWNER_BOUND_TYPES = ['phone_friendface', 'code_device']`, so the two item types
cannot drift apart. The rule is about an item leaving an NPC, so each site applies it only to an
item that came from one:

| Path | Today (phone only) | With the list |
|---|---|---|
| Direct add from an NPC's `itemsHeld` (`games_controller.rb:3464-3475`) | Refused unless the NPC's story offers the phone or the server holds the NPC as knocked out. Every other held type needs only that the NPC was met | A `code_device` is refused on the same test, asked as `npc_offers_item?(npc_id, 'code_device')` (the generic form `friendface_phone_offered?` already wraps, `social_feed.rb:257-259`) or `npc_defeated?(npc_id)` |
| Pickup of a room item that names an `owner` (`games_controller.rb:3442-3448`) | Asks `npc_room_drop_allowed?` again, for saves made before the rule. Runs on every room item with an `owner` | Asked only of a **stored NPC drop**: `find_accessible_item` marks an item it found in `objects_added` (`location: { type: 'room', added: true }`), and the test is skipped when the item's id is in `droppedItems` (the player dropped it). An authored room object and the player's own drop fall under the ordinary room rule |
| Room add with no source (`game.rb:1169-1174`) | A phone enters a room only as an NPC drop or a player drop | Same for a `code_device`, so no client can mint one in a room. Correct as it stands: an authored room object never passes through this method, and a player drop is already let through |

`npc_room_drop_allowed?` (`game.rb:2152-2158`) is generic over the item type and needs no edit;
an NPC drop is checked with it when it is stored (`game.rb:1122`), so skipping the pickup test
for an authored object or a player drop loses nothing. A client-built item cannot carry `owner`
(`games_controller.rb:3304-3306`), so a device cannot be forged in the inventory request. Section
7 lists the four ways a player comes to hold a device and which of them are best-effort.

**Holding the device.** `held_code_device(npc_id)` is the proof every code route uses. It follows
`credential_held_proof_holds?` (`credential_keyring.rb:42-64`): an inventory entry, unwrapped from
`scenarioData`, whose `type`, `id` and `owner` equal an authored device, and not
`ItemIdentity.client_forged?`.

**Code.** `GET /mfa/device` serves the current code only while `held_code_device` holds for the
device asked about, with `used: true` when the owner's account has already used that window, so
the device can say "wait for the next code". `POST /mfa/verify` compares the typed code with the
device's code for the pending account in constant time. The server does not ask whether the
player holds the device at verify time: knowing the current code is the proof, and the only way
a code reaches the browser is the device route. `MfaModel.code_state` sorts a typed code three
ways:

- **Right.** The current or previous window's code, from a window not yet used. It records
  `mfaAccounts[npcId].used = window`, so a code works once for that account, at every PC.
- **Stale.** A code that was right once: already used, or from one of the two windows before the
  accepted pair. Answered `stale: "used"` or `stale: "expired"` and counted nowhere, so a slow
  typist, or a player signing in at two PCs within a minute, never walks towards a lockout
  (lockouts never expire, `game.rb:4344-4350`). The pane asks for the next code.
- **Wrong.** Anything else. Three counts bound guessing:
  - per attempt: `MAX_CODE_TRIES = 5` (`tries` on the pending record) drops the record, and the
    password must be typed again;
  - per PC: a wrong code goes through `record_login_failure!` on the account's lockout key, so
    a policy's `maxAttempts` covers both steps;
  - per account: `mfaAccounts[npcId].wrong` counts every wrong code at any PC, which covers a
    policy with no `maxAttempts` and several PCs that each give their own allowance. At
    `MAX_CODE_WRONG_TOTAL = 30` the account's code step **closes for five minutes**: the server
    records `closedAt` (server seconds) and writes one `mfa_code_locked` row, and `/mfa/verify`
    answers 422 `{ codeLocked: true, retryIn: <seconds left> }` whatever is typed. The first
    read of the entry after `CODE_CLOSED_SECONDS` removes `closedAt` and returns `wrong` to 0. A
    second-factor reset at a helpdesk (S8b) does the same at once. The closure runs on the
    server's clock, like the code itself, so no scenario can be stranded by it whatever desks
    it authors; thirty guesses in five minutes against a million codes is no way in.

The per-PC lockout is the one count here that never clears by itself: only a helpdesk password
reset lifts it (below), as for a wrong password today. The validator warns where a lock the
scenario needs sits behind such a PC and no desk can lift it (section 9).

For a re-enrolled account the server compares a sign-in code against the own-phone code
(`device_id` `own:<npcId>`). The account's old device no longer signs it in: `GET /mfa/device`
answers `{ enrolled: false }` for it, with no code, and the scene says so, unless a step on
another subject still names that owner's device (`device_in_use?(npc_id)`, which asks each
registered non-sign-in subject kind). No such kind exists in this plan, so here the answer
depends on the re-enrolment alone; the lock plan registers its kind and the device keeps showing
its code for the owner's locks. The once-per-window rule is per owner (`mfaAccounts[npcId].used`)
whatever the subject.

**Push.** `POST /mfa/prompt` sends one request and answers at once. In order: the pending record
is a push kind and live; at least `PROMPT_GAP_SECONDS` since `last` (else `tooSoon`); `n` below
`MAX_PROMPTS` (else the attempt ends); then `n += 1` and the first of these that applies:

1. The subject is a sign-in and the account was re-enrolled (S8b): the request is on the
   player's own phone; answer `waiting: "own_phone"`. Any other subject skips this case.
2. The player holds the owner's phone: answer `waiting: "held_phone"`. Nobody else can approve.
3. The owner's phone was taken and is not held (dropped, left in a room): nobody answers.
4. The owner is recorded as knocked out: nobody answers. The record comes from the browser, so
   it is used only to refuse here, never to grant.
5. The owner receives the request: `mfaPrompts[npcId] += 1`. Kind `push_number_match`: the owner
   never approves. Kind `push`: `always` approves; `pestered` approves when `mfaPrompts[npcId]
   >= prompt_patience`; `never` does not.

`mfaPrompts[npcId]` counts only requests the owner received (case 5), so a request the player
caught on a held phone tires nobody. It counts across attempts, PCs and subjects (an owner
pestered about a sign-in and a lock is one tired owner) and returns to 0 when a request to that
owner is approved by anyone, so fatigue survives an expired attempt
and starts again after a success. An approval starts the session as a correct password does
today.

`POST /mfa/approve` is the player approving on a phone: the pending record is a push kind; the
player holds the owner's phone (`held_friendface_phone(npc_id)`, called unchanged), or, for a
sign-in only, the account was re-enrolled; for number matching the posted number equals the
pending number. A wrong number or a Deny cancels the attempt and is not counted towards a lockout: a cancelled
attempt costs the password step again and a new attempt has new numbers, so three choices
leave nothing worth guessing.

**Helpdesk (S8b).** New concern `app/models/break_escape/helpdesk_access.rb`.
`request_helpdesk!(desk_id, username, what, answers, pc_id = nil)` checks, in order: the desk exists; its NPC
is in `encounteredNPCs` and is not recorded as knocked out; the player is signed in
where the request says it is made (a request made over a PC is made from that PC's desktop and
carries its id as `pc_id`: the server needs an open, unlocked record in `access_sessions[pc_id]`
of any kind, keyboard, remote or technique, since all three are served that desktop; a `pc_id`
that is not a sign-in PC, or has no such record, is `unavailable`, the same answer for a real and
an invented id; a request made to the NPC in person sends no `pc_id` and needs no session);
`what` is in the desk's `resets`; the
desk has not stopped serving this username (`helpdeskTries` at `maxTries` records `stoppedAt`,
server seconds, and the stop lifts after `DESK_STOP_SECONDS = 300`: the first read of the entry
after that removes `stoppedAt` and returns the count to 0, as for `closedAt` on the code step;
a blocked answer carries `retryIn`, so no scenario can be stranded by it); the
username is an account; the rule holds (`none`: always; `questions`: at least `minCorrect` normalised answers equal
the account's `creds.recovery` values; `callback`: the player holds the account owner's phone).
An unknown username and wrong answers take the same counted refusal with the same body, so the
route cannot be used to list accounts. The typed username is normalised with
`normalise_username`, stripped of control characters and cut to 64 code points before it is
used as a key; it is never echoed in an answer.

The `questions` and `callback` rules are decided from server state and cannot be passed by a
crafted request. Being in the conversation is not checked beyond "met and conscious" (section
7). A `none` desk grants to any request by design: it is the author's way to show a careless
desk, and the ink only paces it.

A grant writes `accountResets[npcId]` with `'password' => true` or `'mfa' => true`:

- **Password.** `Game#effective_password(npc)`, a public reader defined in `helpdesk_access.rb`,
  returns `creds.resetPassword` once `accountResets[npcId].password` is set, else
  `creds.password`. `attempt_login!` (`game.rb:3486-3487`) changes to call it, so the old
  password fails at sign-in. Readers of things written before the reset keep the authored value
  on purpose: a post-it (`game.rb:3425`), an earlier capture (`game.rb:2697`) and the cracking
  plan's crack of a collected hash (which reads `creds.password`) are out of date, as they would
  be. A crack after a reset therefore yields the old password, which no longer signs in. A
  collected cached account is always a hash; the collect itself yields no password.
  The keyring lists a new implicit entry `<npcId>.reset` (kind `password`) built beside the
  captured-account entries (`credential_keyring.rb:263-285`).
- **A password reset unlocks the account.** Lockouts never expire, and a locked key is refused
  before the password is read (`game.rb:3483`), so without this the usual story (guess, lock
  the account, ring the desk) would end with a password that cannot be typed. The grant deletes
  every `login_lockout_keys_for(npc)` entry from `loginFailures` and `loginLockouts`. The
  granting answer carries `lockoutPcIds`, the fresh `lockout_pcs_for_client` list, and the
  client reseeds its "lockout seen" marks from it.
- **Saved connections wait for the new password.** After a password grant the account's saved
  connections are refused until a typed sign-in with the new password sets
  `accountResets[npcId].typed` (the saved-connection rule above).
- **Second factor.** The account's second step moves to the player's own phone:
  `GET /mfa/device` with `npc_id` serves the own-phone code with no item, verify compares
  against it, and push requests wait for `POST /mfa/approve` with no held-phone check. The
  player needs no phone item; section 5.3 gives the screen. It returns `mfaAccounts[npcId].wrong`
  to 0, removes `closedAt` and does not clear lockouts.
- **A request for something already granted** passes the same checks and gets the same body
  again, so a lost answer can be retried. It writes nothing and clears nothing: lockouts earned
  after a reset stay, and `typed` is not unset.

### 5.3 Client

**Session mirror (`systems/pc-sessions.js`).** The mirror stays the only writer of client
session state.

- `signIn` tests `body.mfaRequired === true` before its `success === false` test. It records
  the step with `MfaClient.noteRequired({ kind: 'pc', id: pcId }, body)` and returns `{ ok:
  false, reason: 'mfa_required', mfa, npcId, number, ownPhone, pcId }`. No `pc_signin_failed`
  is emitted; `noteRequired` emits `mfa_required`.
- `signInWithCredential` handles a 422 in its own branch (`pc-sessions.js:598-612`), which maps
  the body through `credentialRefusalReason(b)` and otherwise falls back to `b.message ||
  'Incorrect username or password'` (`:606`). `credentialRefusalReason` learns `typeToSignIn`
  and returns the reason `type_to_sign_in` with `why: b.typeToSignIn`, ahead of that fallback,
  so the player is never told the password is wrong. The sign-in screen holds the two lines:
  for `second_step`, "This PC asks for a second step. Type the password to sign in."; for
  `password_changed`, "This password has been changed. Type the new one to sign in." It draws
  them as a notice, not an error, and puts the cursor in the password field.
- New public `completeSecondStep(pcId, body)`. The answers of `/mfa/verify`, an approved
  `/mfa/prompt` and `/mfa/approve` are the normal sign-in answer, and this method does with
  them exactly what `signIn` does with its own (`pc-sessions.js:555-562`): build the session,
  `_replace`, `_dropEnded(body.endedPcIds, pcId, body.tokenExpiredPcIds)`, and the same
  `pc_signed_in` event. No other module writes the mirror.
- A refused sign-in second step emits `pc_signin_failed` from the mirror (`MfaClient` hands it
  the refusal) with a new reason: `mfa_wrong_code`, `mfa_code_locked`, `mfa_cancelled` or
  `mfa_expired`; `locked_out` as today. A stale code emits nothing: it is not a failure. A
  subject that is not a sign-in never reaches the mirror and emits no `pc_signin_failed`.

**`systems/mfa-client.js` (new).** Calls the five `/mfa/*` routes. Every note it keeps is filed
under a subject key (`pc:<pcId>` for sign-in, `<kind>:<id>` for any other subject), and every
call takes the subject `{ kind, id }`; the sign-in screen's calls below pass `{ kind: 'pc', id:
pcId }`. A passing answer is routed by subject kind: for `pc` it is the normal sign-in answer
and goes to `completeSecondStep`; for any other kind it is `{ success: true, stepPassed: true,
... }`, never reaches the mirror, and is kept for that subject's caller. It holds, in memory
only, what a reopened screen needs: `pendingFor(subject)` (kind, `npcId`, number, `ownPhone`,
and which lesson to teach afterwards), `takeCompleted(subject)` (handed out once: for `pc`, the
session a child scene just opened; for any other kind, the pass answer a child scene received,
which the subject's caller spends, so there is no second method) and `lastRead`:
one record `{ npcId, source, code }` for the last code a device scene showed that was not marked
`used`, where `source` is the device's item id or `'own'` for the player's own phone.
`codeFor(pending)` returns that code only when the device it was read from is the one enrolled
for the pending account: `npcId` equal, and `source` `'own'` exactly when the pending answer
said `ownPhone: true`. Otherwise it returns nothing.

**Sign-in screen** (the `password` scene on the PC monitor).

- On `reason === 'mfa_required'` it swaps to a second pane in the same monitor frame, with no
  error line and no reject sound. For `code`: one six digit field and Verify. For push kinds: a
  line saying a request was sent, the two digit number when there is one, the count sent, and
  "Send again" (`POST /mfa/prompt`). Failures show `attemptsLeft` as the password pane does.
- What runs today on `result.ok` runs when the second step succeeds and not before:
  `teachAfter` with the lesson noted at the first step (`in_file` for a typed sign-in from a
  file tile), then `signInAccepted(session)`.
- **Buttons to the thing the player holds.** The `mfaRequired` answer names the account's
  `npcId` (the player has just proved its password, so this tells them nothing new). The code
  pane shows "Use <item name>" only for a held `code_device` whose `owner` is that NPC; the push
  pane shows "Check <owner>'s phone" only for that NPC's held `phone_friendface`. Either pane
  shows "My phone" instead when the answer said `ownPhone: true`. So the pane never leads the
  player to a device whose code would count as wrong.
- **Each button opens its scene as a child of the sign-in screen**, by the manager's parent and
  child hand-over: the screen sets `suspended: true` on its own params and starts the child with
  `returnTo: { sceneType: 'password', params: {} }`. The manager ends the parent without its
  `onComplete`, and when the child ends on a normal exit (success true, result not `{ aborted:
  true }`) starts the parent's scene again with its original params and `returnTo.params` merged
  over them (`minigame-manager.js:14-30`, `:102-106`, `:540-566`, `:616-636`).
- **Which X is a normal exit.** The framework's own X and Esc call `closeByPlayer()`, which
  completes with success false (`framework/base-minigame.js:125-133`, `:319-341`) and would
  release the parent. Both child scenes are `SocialOverlayScene`s, which turn that X off
  (`disableClose`, `framework/social-overlay.js:24-27`) and draw their own; with the default
  `closeMode` it calls `close()`, which completes with success true (`:127-142`), so the sign-in
  screen comes back.
- **The screen that comes back is a new instance**, so what it must remember lives in
  `MfaClient`. Its `init` asks there first, with the subject `{ kind: 'pc', id: pcId }`:
  `takeCompleted` returns a session when the child approved the request, and the screen runs
  the accepted path at once; else `pendingFor` puts it straight on the second pane, with the code field filled from
  `codeFor(pending)` when that returns a code and left empty when it does not (never submitted:
  the player presses Verify); else the password pane, with a "request cancelled" line if the
  child denied.
- **A child that is forced shut** (a hit, a knock-out, a forced conversation) does not end
  normally, so the framework releases the sign-in screen: its `onComplete` runs once, as
  `(false, { aborted: true, viaChild: true })`, and it does not reopen
  (`minigame-manager.js:641-655`). The screen's starter treats that as a quiet close: no toast,
  no reject sound, no `pc_signin_failed`. It clears the PC's `takeCompleted` note, so a session note
  can never be picked up by a later visit to the PC; the mirror already holds any session the
  child opened.
- **Closing the screen does not cancel the attempt.** X leaves the server's pending record to
  expire and `MfaClient` keeps its note, so opening the PC again within five minutes returns to
  the second pane; so does another minigame displacing the screen. If the record has gone, the
  first verify or prompt is refused and the screen falls back to the password pane.

**`code-device` scene (new).** `CodeDeviceMinigame extends SocialOverlayScene`, started with
`socialOverlayParams()`, drawing the steel X of its device frame wired to `requestClose()` with
the default `closeMode`: as a child it returns the player to the sign-in screen, and alone it
just closes. The frame is the small device from `device-frame.css`, with the owner's headshot
and name, six digits in VT323 and a bar that drains to the end of the window. It calls
`GET /mfa/device` on open and when the bar empties. A code marked `used` is drawn greyed with
"Wait for the next code" and is not noted. An `enrolled: false` answer draws "No longer in
use" with no digits, notes nothing and clears a `lastRead` that came from this device. Any
other code goes to `MfaClient.lastRead` with the owner's `npcId` and this device as its source.
Opened from the sign-in screen's button (as a child) or from the inventory item (alone). With
`own: true` it draws the player's phone frame and asks by `npc_id`. New, because no existing
scene shows a value the server changes over time.

**`authenticator-live` scene (new, a subclass).** `AuthenticatorLiveMinigame extends
AuthenticatorMinigame`, registered under its own name. Today the parent's `init`
(`authenticator-minigame.js:106-170`) always draws the attacker's controls and builds a timeline
from params, and its card builder draws Approve and Deny as `aria-hidden` spans, not buttons
(`:408-429`). `init` stays the one entry, and its body is split into two methods it calls in
today's order: `_buildPhoneShell()` (the phone, `:129-149`) and `_buildAttackerParts()` (the
intro, the choice panel, Send and the controls row). The subclass calls `super.init()`,
overrides `_buildAttackerParts()` to draw nothing, and overrides `start` and the card builder:
cards come from `GET /mfa/phone`, each with real Approve and Deny buttons (for number matching,
three number buttons), and a tap calls `POST /mfa/approve` through `MfaClient`. The parent
produces the same DOM as today in every mode; `mode`, `choice`, the timeline, `_appendCard` and
`closeResult` are not edited. The live scene has no `choice`, so the parent's `requestClose`
lock (`:437-441`) never applies. Opened as a child of the sign-in screen, from the push pane's
phone button or from "My phone" (`own: true`).

**`helpdesk-request` scene (new, S8b).** A paper request form in the shared frame: username
field, a choice of what is asked for, one text field per `questionLabels` entry, Send. Opened by
an ink tag `#helpdesk_request:<deskId>` in the helpdesk NPC's conversation (a request in person:
no `pc_id` is sent), from a helpdesk form on a PC's desktop (a request over a PC: the scene is
given that PC's id and sends it as `pc_id`), or from a granted
pretext ask that names `helpdesk: "<deskId>"` (`systems/pretext-judge.js` starts it). The answer
sets the client global `helpdesk_<deskId>_result` from the route's answer (`granted`; `refused`
and `blocked` as named; `unavailable` as `unavailable`; `bad_request` and `not_found` as `error`;
`helpdesk_answered` carries the same `result`) so the NPC's
ink can voice the matching authored line. That global is a mirror for dialogue only; nothing
reads it to grant.

**Events** (for scenario `eventMappings`, so barks stay in scenario files): `mfa_required`,
`mfa_prompt_sent` `{ npcId, pcId, n }`, `mfa_approved` `{ npcId, pcId, by }`, `mfa_failed`,
`helpdesk_answered` `{ deskId, result }`. `MfaClient` emits the four `mfa_*` events for every
subject: `mfa_required` from `noteRequired`, the other three when a route answers. It emits
through `window.eventDispatcher` as the mirror's `_emit` does (`pc-sessions.js:335-341`), each
also as `<name>:<npcId>`. For a sign-in the payload carries `pcId`; for any other subject it
carries `targetType` and `targetId` in its place, and the rest is the same, so an owner's bark is
mapped the same way for both. The owner's reaction to a buzzing phone is a bark the scenario
maps to `mfa_prompt_sent:<npcId>`. `helpdesk_answered` comes from the `helpdesk-request` scene,
also as `helpdesk_answered:<deskId>`. In this plan the only caller of `noteRequired` is
`signIn`. The subject keys, the routing of a pass by kind, `takeCompleted` for any kind and the
event payloads are built here; the lock plan (A25) adds the lock caller (its entry from the
unlock request and the lock pane) on top of them and changes none of what sign-in does.

All server and author text is set with `textContent`. The three new scenes use pixel fonts and
2px borders, close with X only, and go on every JS test harness copy list with `mfa-client.js`.

### 5.4 Determinism and the defaults this plan settles

No random draw is added. The number to match, its two decoys and their order come from one HMAC
over ids and a per-account counter. Code digits depend on server time and a server key, and
decide nothing but equality.

| Point | Default | Why |
|---|---|---|
| Talking an owner into reading out a code or tapping a number | Not possible. Holding the device or the phone is the only route | A code and an approval are credentials, and the cheat policy has the server hard-enforce those. The pretext judge runs in the browser, so the server could not check such a conversation |
| How a careless owner decides | A fixed count (`promptPatience`, default 3), never a chance | Runs repeat, and it is easy to author |
| Presets for the new habit | Low `pestered`; medium, high and no level `never` | Only clearly careless staff give in; an author sets `pestered` with a higher patience for a middling one |

## 6. Server routes

All under `/games/:id`, in `GamesController`. Each action name goes on the `set_game` list
(`games_controller.rb:27-29`) and gets its own `GamePolicy` method delegating to `show?`, as
`login?` and `friendface_phone?` do (`app/policies/break_escape/game_policy.rb:85`, `:121`):
`mfa_device?`, `mfa_verify?`, `mfa_prompt?`, `mfa_phone?`, `mfa_approve?`, `helpdesk_request?`.
"Locked" means inside `with_game_lock` (`games_controller.rb:2890`). Status codes follow the
existing rule: 404 unknown thing, 403 out of reach, 422 a refusal the player caused. Every
answer is `Cache-Control: no-store`. The `/mfa/*` generic refusal is the existing `Sign in required` body.

`POST /login` keeps its parameters. Its one new answer, when a second step is due (locked, as
today): status 200, `{ success: false, mfaRequired: true, mfa: "<kind>", pcId, npcId, number?,
ownPhone? }`. `number` is present only for `push_number_match`; `ownPhone` only for a
re-enrolled account. No session exists yet. The keyring sign-in keeps its parameters too; its
one new answer is the 422 `{ success: false, typeToSignIn: "second_step" | "password_changed" }`
refusal of a saved connection (section 5.2). The `/mfa/*` routes keep the sign-in route's
boolean refusal style (`codeLocked`, `stale`, `refused`) because they extend `/login`. `POST /helpdesk/request` extends no sign-in route, so it answers `{ success: false, reason: "<code>" }` with the closed list in its row.

"Route still holds" below is `second_step_refusal` (section 5.2); it answers as the first step
would. "Lockout" is the account's lockout key at that PC (422 `lockedOut`).

| Route | Params | Checks in order | Writes and answer |
|---|---|---|---|
| `GET /mfa/device` | `item_id`, or `npc_id` for a re-enrolled account | A policy declares an `mfa` kind (else 404 `{ success: false, error: "not found" }`). `item_id`: `held_code_device` holds for that item (else 403 `{ success: false, error: "no such device" }`, the same body whether the item is unknown, not held, forged or another type). `npc_id`: `accountResets[npc].mfa` (else the same 403) | No write. `{ deviceId, displayName, npcId, code, secondsLeft, used? }`. `used` is true when the device's account has already used this window. The `item_id` form for a held device whose account has been re-enrolled, and which no other subject still uses (`device_in_use?`, 5.2), answers `{ deviceId, displayName, npcId, enrolled: false }` with no code; the player caused the re-enrolment, so this tells them nothing new |
| `POST /mfa/verify` (locked) | `pc_id`, `code` | PC found (404). Pending record for the PC, kind `code`, live (else generic 422). Route still holds. Lockout. Account's code step closed (422 `codeLocked: true, retryIn`; a closure older than `CODE_CLOSED_SECONDS` is lifted first). `code` is six digits (else generic 422, not counted). Then `MfaModel.code_state` | Stale: 422 `stale: "used"` or `"expired"`, no write. Wrong: `tries += 1`; `mfaAccounts[npc].wrong += 1`, and at `MAX_CODE_WRONG_TOTAL` `closedAt` is set and the `mfa_code_locked` row written; `record_login_failure!`; answer as a wrong password plus `mfaIncorrect: true`; at `MAX_CODE_TRIES` the record is dropped and the answer adds `expired: true`. Right: `mfaAccounts[npc].used` set, failures cleared, record dropped, session written, the normal sign-in answer |
| `POST /mfa/prompt` (locked) | `pc_id` | PC found. Pending record, push kind, live (else generic 422). Route still holds. Lockout. Gap since `last` (else 422 `tooSoon: true, retryAfterS`). `n < MAX_PROMPTS` (else record dropped, 422 `expired: true`) | Counts, then the decision in 5.2. Not approved: `{ success: false, approved: false, promptsSent, waiting? }`. Approved: `mfaPrompts[npc] = 0`, record dropped, session written, the normal sign-in answer plus `approvedBy: "owner"` |
| `GET /mfa/phone` | `npc_id` (that NPC's held phone), or `own=1` (the player's own) | `npc_id`: `held_friendface_phone(npc_id)` (else 403 `{ success: false, error: "no such phone" }`). `own`: at least one account has `accountResets[...].mfa` (else the same 403) | No write. `{ requests: [{ pcId, host, username, n, numbers? }] }`: live push records for that owner's account, or for every re-enrolled account; at most one per PC. `numbers` is the three choices from `MfaModel.numbers`, in its order, none marked |
| `POST /mfa/approve` (locked) | `pc_id`, `number?`, `deny?` | PC found. Pending record, push kind, live (else generic 422). Phone held for the pending account, or account re-enrolled (else 403). Route still holds. `deny`, or a wrong or missing `number` for number matching: record dropped, `{ success: false, cancelled: true }` | Right: record dropped, `mfaPrompts[npc] = 0`, session written, the normal sign-in answer plus `approvedBy: "player"` |
| `POST /helpdesk/request` (locked, S8b) | `desk_id`, `username`, `what`, `answers` (map of question id to text; body refused over 4 KB before parsing; each answer cut to 64 code points), optional `pc_id` (the PC whose desktop the form is on; a string of at most 64 code points) | The checks in 5.2. Refusals are `{ success: false, reason }` from a closed list: 400 `bad_request` (missing params, body over 4 KB, a `pc_id` that is not a string or is too long), 404 `not_found` (desk unknown), 422 `unavailable` (a `pc_id` with no open session at that PC, NPC not met or knocked out, `what` not offered), 422 `blocked` (stopped serving, with `retryIn`), 422 `refused` with `triesLeft` (unknown username or rule not met; tries counted) | Grant: `accountResets` written; for `password`, lockouts cleared. `{ granted: true, what, password?, lockoutPcIds? }`. A request for something already granted passes the same checks, answers the same body with the current `lockoutPcIds`, writes nothing and clears nothing. Each outcome writes at most one `helpdesk_request` row (section 13) |

A refused second step never says more than the first step already did: the `mfaRequired` answer
itself tells the player the password was right, as a real second prompt does.

**The lock subject.** The four step routes (`GET /mfa/device`, `POST /mfa/verify`,
`POST /mfa/prompt`, `POST /mfa/approve`) and `GET /mfa/phone` take one subject: a PC by `pc_id`,
or a lock by `target_type` (`object` or `door`) with `target_id` in place of `pc_id`, the subject
`OPS_LOCK_SECOND_STEP_PLAN.md` (A25) defines in its section 6. A request naming both a PC and a
lock, or neither, is the generic 422. `target_id` is resolved by id only: an object id must be in
`second_step_ids` and a door id must name a room with `secondStep`; the name-matching finder is
never used. The lock form's checks and answers are that plan's section 6 table; this plan's
routes leave one hook in the lock form's subject check, before the record is read, which that
plan fills with its reach test (`carried_step_reachable?`, its 5.5) and answers 404 when it
fails. `GET /mfa/device` also answers when no policy declares an `mfa` kind but a lock carries
`kind: "code"`. `GET /mfa/phone` lists a lock request only for a named lock (`target_type` and
`target_id`), never in its `own=1` form or a form with no lock named. The `object` form lands
with the lock plan's G1 and the `door` form with its G2; before G1, `pc_id` is the only subject
and a request without it is the generic 422.

The table above is the `pc` column of the subject rules in 5.2. The record drop and the session
write on a pass, "Route still holds", "Lockout", `record_login_failure!`, and every re-enrolled
form (`npc_id` on the device route, `own=1` on the phone route, the re-enrolled branch of
approve) are sign-in's alone; the shared functions behind each route return their outcome and
leave those to the caller.

## 7. What reaches the browser, and what never does

**The general rule: a policy's kind is public, its answers are not.** `policies` and
`defaultPolicy` ship in the bootstrap as authored (`game.rb:2471-2473`), so a player who reads
the scenario data can see which PCs ask for a second step and of which kind. That is what an
organisation's sign-in page tells any visitor, and it grants nothing. Stripping the field would
mean a filtered copy of every policy for three client readers and would protect nothing. The
same rule covers any plan that adds a field to a policy: the field may say what kind of check a
PC makes; whatever satisfies the check stays on the server until earned.

| Thing | Sent | Withheld |
|---|---|---|
| `policies.*.mfa` | In the bootstrap, as authored. Also in the `mfaRequired` answer for the PC being signed in to | Nothing; it is not a secret |
| Which accounts are enrolled (`creds.mfa`) | Never. `creds` is deleted from every NPC (`game.rb:7376`). The player learns an account is exempt by signing in with it | The whole field |
| A code | Only in `GET /mfa/device`, only while the device is held (or the account re-enrolled) | Not in the bootstrap, the item, the inventory answer, or any sign-in answer |
| The number to match | In the `mfaRequired` answer (the player's own sign-in screen) and, among three choices, in `GET /mfa/phone` to a player holding the phone | Never marked as the right one on the phone |
| `habits.approvesPrompts`, `promptPatience`, `awareness`, the `mfaPrompts` counts | Never. The client learns only `approved` true or false per request, and `promptsSent` for its own attempt | All of it |
| `creds.recovery`, `creds.resetPassword` | `resetPassword` once, in the granting answer and then as the keyring entry's secret | The `recovery` map is never sent, and a refusal does not say which answers were right. The facts themselves are in the world by design (a feed post, a document, a line of dialogue) and reach the browser when those do |
| `helpdesks` | `questionLabels`, `resets` and the desk's NPC id, as `helpdeskForms` in the bootstrap, only when a desk exists | `verify`, `minCorrect`, `maxTries`, the `questions` ids |
| `code_device` item | Type, id, name, `owner` (an NPC id, as a phone carries) | Nothing secret is on the item |
| `mfaPending`, `mfaAccounts`, `accountResets`, `helpdeskTries` | Never | All of it |

**How a player comes to hold a device, and what is hard-enforced.** Four ways: the owner's story
gives it (a give tag for the type is in the owner's story, and the owner has been met); the
owner is recorded as knocked out; the scenario left it loose in a room, a room object or a
container, where the ordinary room and container rules apply whether or not the owner has been
met; or it is a start item. Meeting the owner is not enough, and a player who drops a device
can pick it up again.

Hard: a code is served only against a held, authored, unforged device; a device cannot be
minted or forged; a typed code is checked on the server and guessing is bounded per attempt,
per PC and per account; an approval needs the held phone or a re-enrolment; a saved connection
cannot skip the step or outlive a reset; a helpdesk grant under `questions` or `callback`; the
reset password. Best-effort, as the cheat policy allows for combat and dialogue, and on the
same footing as a phone today:

- *The story offer.* `npc_offers_item?` (`social_feed.rb:265-273`) passes when a give for the
  type appears anywhere in the owner's story. The server does not know whether the player
  reached the line, so a crafted inventory request can take an offered device as soon as the
  owner is met. It cannot take one the story never offers.
- *The knock-out record* is the browser's claim (`game.rb:2008-2020`), accepted only for a met
  room NPC that is not `koImmune` and not `npcType: "phone"` (`npc_ko_claimable?`,
  `ko_claimable_room_npc_ids`, `game.rb:2029-2059`). A scenario `disableAttacks` stops the
  client's punch (`player-combat.js`) and the reachability walk counts it (`held_item_sources`).
- *A helpdesk request* can be posted without standing in the conversation.

An author who needs a device to stay with its owner offers no give of it and sets `koImmune` (or `npcType: "phone"`, or the scenario's `disableAttacks`);
the validator's note says which routes each device has (section 9).

No-exposure tests (section 11) assert each row against captured answers, and the leak scanner
(`tools/playtest/lib/access_leak_scanner.rb`) gains lines for a code, a `recovery` map and a
reset password appearing anywhere before they are earned.

## 8. State and saved games

Five server-owned keys join `ACCESS_STATE_DEFAULTS` (`game.rb:3021`). Each is a flat top-level
key whose default is `{}`: the defaults are copied shallowly, so a nested default would be one
object shared between games. None is read from a sync body, none is sent, and a reset drops
them.

| Key | Shape | Bound | Sent |
|---|---|---|---|
| `mfaPending` | `{ pcId => record }` | One record per sign-in PC. Expired records are dropped on every read and write of the map | Never. Route answers carry only the one changed value (`promptsSent`, `approved`) |
| `mfaPrompts` | `{ npcId => count }` | One integer per step owner: an NPC whose account has a second step, or who owns a step on another subject (a lock, A25). At most one entry per NPC in the scenario, so bounded by authoring; about 20 bytes each | Never. A route answer carries only `promptsSent` |
| `mfaAccounts` | `{ npcId => { 'started' => n, 'used' => window, 'wrong' => n, 'closedAt'? } }` | Four integers per step owner, as above: at most one entry per NPC in the scenario, about 80 bytes each. `started` and `wrong` count sign-in and lock steps together | Never. A route answer carries only the changed value (`retryIn`, `used`) |
| `accountResets` | `{ npcId => { 'password'?, 'mfa'?, 'typed'? } }` | Three booleans per account | Never; the keyring answer lists the new entry through its existing `rev` digest, so an unchanged keyring is not re-sent |
| `helpdeskTries` | `{ "deskId\|username" => n }`, or `{ 'n' => n, 'stoppedAt' => seconds }` once the desk has stopped; username normalised and at most 64 code points | Account keys bounded by authoring; non-account keys capped at 200, oldest dropped, as `loginFailures` does (`game.rb:4357-4364`) | Never; `triesLeft` rides on the refusal |

Nothing is added to synced client state, and no existing synced value grows. A step on another
subject keeps its record in its caller's own key, which that plan bounds; `mfaPrompts` and
`mfaAccounts` gain at most one entry per owner from it, never one per lock or per attempt, and
`mfaPending` gains nothing. `MfaClient` holds
the pending kind, number and last read code in memory only. **Reload:** memory is lost, so the
sign-in screen opens on the password pane and the next password step overwrites the pending
record. `mfaPrompts`, `mfaAccounts`, `accountResets` and `helpdeskTries` persist, and cleared
lockouts stay cleared. **Old games:** a game made before this feature has no `mfa` policy
value, so `mfa_step_for` is `none` everywhere, every `/mfa/*` route answers 404 or 403, and
`/helpdesk/request` answers 404 for want of a desk.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`), each property with a description naming its reader:

- `policies.<name>.mfa` (enum) in the closed policy block (`:261-280`), described as public,
  shipped with the policy.
- `creds.mfa`, `creds.recovery` (id map of strings), `creds.resetPassword`, all `x-serverOnly`.
- Habit keys `approvesPrompts` (enum) and `promptPatience` (integer 2 to 9).
- Item type `code_device`, with `owner` (`x-ref: "npc"`).
- Top-level `helpdesks` (`x-id-map`, closed entries, `x-serverOnly` with `x-servedBy: "bootstrap
  helpdeskForms"`, `npc` with `x-ref: "npc"`). `ScenarioSchema::STARTS` gains the `helpdesks`
  pointer if a walker asks for it.
- `helpdesk` (a desk id) on a pretext ask, in `#/definitions/socialPretextAsk` (reached from
  `:3725-3729`).

**Validator.** New `scripts/validate_mfa.rb` holds every check of this plan, hooked into
`validate_scenario.rb` by one line beside the habits check, reading `MfaModel` and `HelpdeskModel`. `scripts/validate_npc_habits.rb` gains the
two habit keys and the per-parameter check.

Errors: unknown `mfa` value; kind `code` on a policy whose PCs admit an enrolled account with no
`code_device`; two code devices for one owner; a `code_device` with no `owner`, or an owner that
is neither an account nor the owner of a lock's `secondStep` (the owner `MfaModel.lock_step`
resolves: `secondStep.owner`, or the object's single `owner` id when that is left out; this
widening lands with the lock plan's G1, and a door's `secondStep.owner` counts from its G2); push kind where an admitted enrolled account's NPC has `phone: false`;
`approvesPrompts` or `promptPatience` invalid or on a non-room NPC; a helpdesk `npc` that is not a
room NPC or serves two desks; a `questions` id missing from any account's `recovery` that the desk
could be asked about; `minCorrect` above the number of questions; `resets` naming `password` when no
account has `resetPassword`; a `resetPassword` value that appears in any ink (the rule
`creds.password` already has); `resetPassword` equal to the account's `password`; a pretext ask
naming a `helpdesk` that does not exist.

| Warning | Raised when |
|---|---|
| The policy does nothing | every account at an MFA PC is exempt |
| A `code_device` nobody can get | `MfaModel.held_item_sources` does not list it: it is in the `itemsHeld` of an NPC whose story offers no give of it and who cannot be knocked out (`koImmune`, `npcType: "phone"`, or `disableAttacks` in the scenario), or it is only a headless record or a declared grant (never counted as held). The offer test is `AccessWork.offers_item_text?`, the one the server's gate uses |
| A `code_device` that is not gated | its owner's story has a `give_npc_inventory_items` tag with no type filter |
| A loose owned phone | a `phone_friendface` with an `owner` sits in room `objects` or container `contents`, so it is takeable without its owner. This is the standing check behind section 10's pickup row; it runs on the rendered scenario, so it sees generated objects too |
| **A code step that can lock for good** | a policy has `mfa: "code"` and `maxAttempts`, and an enrolled account it admits is covered by no desk whose `resets` include `password`: wrong codes count towards that PC's lockout and nothing in the scenario lifts it. An error when the dungeon graph marks that PC's sign-in as required and that account as its only key |
| A saved connection that must be typed | a `saved_connection` to a PC whose policy sets `mfa`, for an enrolled account |
| A push step nobody passes | every admitted owner resolves to `never` and `held_item_sources` lists no phone the player can hold, and no other way through exists |
| Patience with no effect | `promptPatience` on an NPC whose habit does not resolve to `pestered` |
| Answers the player cannot find | `verify: "questions"` where an answer appears in no readable text, feed post, document or ink line the player can reach (the reachability walk `npc_habits/clues.rb` does for password clues) |
| A callback nobody can take | `verify: "callback"` where the owner declares no phone item |

Information lines: per `code_device`, the routes to it (story offer, knock-out where the owner can be knocked out (section 5.2), or loose and takeable without its owner). Per MFA PC, the kind and each
admitted account's ways through or round the second step. Round it: a session token for that
PC, a help invite, a helpdesk that resets `mfa`, a technique that grants a session on that host,
and an owner whose open screen can be claimed. The last is the cheapest way past a second step
in any scenario that has one, so it is listed by name.

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`). Each stage adds its own edges, none
deferred: a sign-in lock under an MFA policy gets a second key edge per admitted account, the
`code_device` item in M1b, the owner's phone item or the label "owner approves (pestered)" in
M2, the phone item only for number matching in M3. H1 makes a helpdesk grant a key source for
the account's sign-in, with the readable homes of its answers as its own requirements; H2 adds
it as a source for the second step. `scripts/lock_key_diff.rb` output for a scenario without
the fields is unchanged. Tests: `test/js/dungeon-graph-mfa.test.mjs`.

## 10. Effect on existing scenarios

| Change | Effect when the new fields are absent |
|---|---|
| `attempt_login!` and `attempt_credential_login!` call `mfa_step_for` | Returns `none`: same path, same answer, same state writes |
| Route branch moved to `typed_route_refusal`; the lockout key built and split by the two `AccessIdentities` functions at seven sites | Pure moves: same checks in the same order with the same answers and the same key string |
| The `password` flag on `saved_connection` in `KINDS`; `effective_password`; the `mfaRequired` test in `PcSessions` before its `success === false` test; bootstrap `helpdeskForms`; five `ACCESS_STATE_DEFAULTS` keys | Each is read or sent only when its field is set (a policy `mfa`, an `accountResets` entry, a desk). Without one: today's path, `creds.password`, no `helpdeskForms`, and five empty maps that are never sent |
| `OWNER_BOUND_TYPES` replaces the phone-type test at three sites | A phone held by an NPC, dropped by one or added with no source is judged as today. No existing scenario has a `code_device` |
| The pickup test runs only on a stored NPC drop | The one case that changes is a phone with an `owner` authored loose in a room, or dropped by the player, whose owner neither offers it nor is knocked out: it becomes takeable. No shipped scenario authors a loose owned phone (the validator warning of section 9, proof 4), and a player holds a phone only after an offer or a knock-out, which already pass the test |
| `NpcHabits`: two accepted keys, per-parameter check; `PRESETS` untouched | `expand!` writes exactly what it writes today for every NPC that authors neither key. The preset for the new habit is never written; it is read at request time |
| `authenticator` scene: `init` body split into `_buildPhoneShell()` and `_buildAttackerParts()` | Same DOM in every mode, proved by snapshot (proof 5). The live scene is a separate registered name no existing scenario uses |

Proof:

1. `test/controllers/break_escape/mfa_absent_test.rb` replays the existing sign-in and keyring
   controller cases against their fixtures with time frozen and asserts each answer is
   byte-equal to its fixture in `test/fixtures/files/ops_unchanged/`, compared by
   `bin/ops-golden-compare`, and that the five new keys stay empty. The fixtures are captured
   from main and committed before any change of this plan; this plan builds no golden mechanism
   of its own and uses the log plan's stage L1a one.
2. The habits fixtures and tests pass unedited
   (`test/fixtures/format_8c/test_access_habits.old.loaded.json`, `test/unit/npc_habits_test.rb`,
   `test/models/break_escape/npc_habits_loader_test.rb`), and a new case asserts the saved
   scenario of `test_access_habits` after `expand!` is byte-equal to a copy stored beforehand.
3. A fixture test that the bootstrap of `test_access_signin`, `test_access_keyring` and
   `ca03_helpdesk_reset` equals a stored copy. `ca03_helpdesk_reset` has no `helpdesks` and no
   `helpdesk` on its ask, so its grant stays the client global it is today.
4. The validator over every scenario shows no new error or warning line. That includes the
   loose owned phone warning, so the narrowed pickup test changes no scenario, now or later
   without an author seeing it.
5. The authenticator is unchanged for its one live caller, `ca03_helpdesk_reset`, which drives
   it through the `mfa` block of its episode (`scenario.json.erb:160`, `:174`; runner
   `episode-model.js:518-547`). `authenticator-snapshot.test.mjs` is committed **before** `init`
   is split and asserts the container's HTML after `init` equals a stored snapshot for three
   sets of params: that `mfa` block (decision mode, phone hidden); a timeline set `{ pushes,
   approvesAt }`; and the fixtures of `test/js/social-reuse-authenticator.test.mjs`. The
   existing authenticator and episode-runner node tests pass unedited, and a scripted rerun of
   `ca03_helpdesk_reset` reaches and finishes the scene.
6. Controller cases for the existing phone rule (offer, no offer, knock-out, stored NPC drop,
   sourceless room add) pass unedited.
7. Scripted reruns of `test_access_signin`, `test_access_keyring` and `test_access_habits`.

## 11. Tests

**Unit** (`test/unit/`): `access_identities_test.rb` additions (`lockout_key` equals the string
built today; `lockout_key_parts` round trip and malformed keys); `mfa_model_test.rb` (kinds,
enrolment, device lookup, `held_item_sources` (a device held only by a headless record, a declared grant, or the `itemsHeld` with no offer of a `koImmune` NPC, a `phone` NPC or any NPC in a `disableAttacks` scenario is not listed; the same item in a room object, a start item or an offering NPC's `itemsHeld` is), code for a fixed time and key, `code_state` for each of the four
windows with and without a used window, an own-phone device id changes the code, `numbers` gives three different values in a fixed order for fixed inputs,
`prompt_habit` per level and with an authored value, `prompt_patience` bounds);
`npc_habits_test` additions (the two keys validate, `promptPatience` bounds, expansion of an NPC
without them unchanged); `helpdesk_model_test.rb` (normalising, `minCorrect`, code point caps).

**Controller** (`test/controllers/break_escape/`): `mfa_code_test.rb`, `mfa_device_gate_test.rb`,
`mfa_push_test.rb`, `mfa_phone_test.rb`, `mfa_keyring_test.rb`, `helpdesk_request_test.rb`,
`mfa_absent_test.rb`, and per-role access cases for each of the six policy methods. Each file
also asserts the log rows its actions write (section 13).

The feature scenario's beats are each asserted in a controller case too. Cases no beat covers:

| Group | Cases |
|---|---|
| Device gate | Accepted after a knock-out record; refused for a `koImmune` owner with a forged knock-out; a dropped device picked up again; a stored NPC drop of a device its owner does not offer refused on pickup; a room add with no source refused; a client-built item with `owner` refused; a device in a container collected under the container's own rule |
| Code | Device route refused with a forged item and with another type's id; another owner's device gives a code that fails; verify with no pending record; a code two windows old answers `stale: "expired"` and counts nowhere; five wrong codes drop the record with no `maxAttempts`; wrong codes reach the policy lockout; a re-enrolled account's old device answers `enrolled: false` with no code |
| Code step closure | Thirty wrong codes across attempts and PCs close the step; a right code is then refused with `retryIn`; one `mfa_code_locked` row exists; with time moved on `CODE_CLOSED_SECONDS` a right code is accepted and the count starts from 0; a second-factor grant reopens it at once |
| Route re-judge | The account removed from the access list between steps is refused |
| Technique sessions (`mfa_keyring_test.rb`, added once S3 exists) | A technique session on a `code` PC opens with no pending record. A saved connection granted by a technique, used at that PC, answers 422 `typeToSignIn: "second_step"` with no session and no pending record; typing the same account's password then answers `mfaRequired` |
| Withheld key | The hostile-input scan finds no `helpdesks` key, desk NPC id or `maxTries` in the scenario sent to the browser |
| Saved connection (`mfa_keyring_test.rb`) | Refused with `typeToSignIn: "second_step"` at a `push` and a number matching PC and over a foothold, with no session, pending record or counter moved; a locked-out account answers `lockedOut`; an exempt account's saved connection signs in; at a PC with no `mfa`, a saved connection is unchanged before a password reset, refused with `typeToSignIn: "password_changed"` after it, and works again once the new password has been typed at any PC |
| Push | The count survives a new attempt; requests caught on a held phone do not raise it; a knocked-out owner approves nothing; `tooSoon` |
| Phone | Approve refused without the phone; the three numbers are stable for one attempt and differ for the next; deny cancels; own-phone list refused with no re-enrolled account |
| Helpdesk | Unknown user and wrong answers give the same body and rows of the same shape (section 13); `maxTries` refusals stop the desk with `retryIn`, and with time moved on `DESK_STOP_SECONDS` the same account is served again with the count at 0; a request over a PC with a `pc_id` is granted with a keyboard session, a remote session and a technique session at that PC (one case each), and is `unavailable` with no session held, with a session held only at another PC, with a locked session, and with a `pc_id` that is not a sign-in PC (the last two bodies equal); the same request in person, with no `pc_id` and no session, passes the check; a non-string or 65-code-point `pc_id` is `bad_request`; a blocked desk posted to twenty times inside five minutes, with one username or twenty, stores and saves ten times and no more, and stores again once the window has passed; retry of a granted request gets the same body and leaves a lockout earned since the grant in place; an account locked out at two PCs is unlocked at both and `lockoutPcIds` shrinks; a second-factor grant leaves lockouts alone; desk NPC not met refused; hostile text in `answers` and `username` (long, HTML, control characters) is cut and cleaned before any use, echoed in no answer, and stored only as the normalised 64 code point key and the log row's capped `typed` field |
| Subject rules (`test/models/break_escape/mfa_access_subject_test.rb`) | The `MfaAccess` functions called with a test-only subject kind and its own map, since no route takes a non-PC subject before the lock plan's G1: a `passed` record survives the tidy past `PENDING_SECONDS` and an unpassed one does not; a right code, an owner approval and a player approval each return `:passed` and leave the record; no route re-judge and no lockout key is touched; `numbers` for that subject differs from a PC's with the same owner and nonce; `started`, `wrong` and `mfaPrompts` move on the shared per-owner entries; with the owner re-enrolled, push case 1 is skipped, approve needs the held phone, verify compares against the authored device, and `device_in_use?` keeps the old device's code live. The same calls with a `pc` subject give exactly the sign-in results above |
| Lock subject (lands with the lock plan's G1; the `door` cases with its G2) | Each step route takes `target_type: "object"` with a `target_id` in `second_step_ids` in place of `pc_id`; a request naming both a PC and a lock, or neither, is the generic 422; an object id not in `second_step_ids`, or a lock the reach hook refuses, is 404; a target named by display name is 404, never matched; `GET /mfa/device` answers for a lock owner's `code_device` in a scenario where no policy declares an `mfa` kind; `GET /mfa/phone` with `own=1`, or with no lock named, lists no lock request. With G2, `target_type: "door"` naming a room with `secondStep` is taken, and one naming a room without it is 404 |
| No inline key | A unit test greps `app/` and `lib/` for a lockout key built or split outside `AccessIdentities` and fails on any hit |

**JS** (`test/js/`), beside the existing authenticator and episode-runner tests, which pass
unedited, and `authenticator-live`, `authenticator-snapshot` (section 10), `helpdesk-request`,
`validator-mfa` and `dungeon-graph-mfa` (each `.test.mjs`):

| File | Asserts |
|---|---|
| `pc-sessions-mfa.test.mjs` | `mfaRequired` is not an error; `completeSecondStep` writes the mirror, drops ended sessions and emits `pc_signed_in`; a 422 `typeToSignIn` gives reason `type_to_sign_in` with its `why`, never the wrong-password fallback |
| `mfa-signin-pane.test.mjs` | Pane swap with no reject sound; `teachAfter` only after the second step; a reopened instance resumes from `MfaClient` and accepts a completed session; the code field is filled after a read of the pending account's device, and empty after a read of another account's device, of an item device when the answer said `ownPhone`, and of a device that answered `enrolled: false`; each `typeToSignIn` reason shows its own line |
| `mfa-child-handover.test.mjs` | Against the real minigame manager, for each child scene: the sign-in screen suspends, the child ends by X, the `password` scene reopens on the second pane; a forced close releases the screen once, with no failure event and no completed note left behind |
| `code-device.test.mjs` | A `used` code is greyed and not noted; an `enrolled: false` answer shows no digits |
| `validator-mfa.test.mjs` (the lock owner cases land with the lock plan's G1) | A `code_device` whose owner has no `creds` but is the owner `MfaModel.lock_step` resolves for an object's `secondStep` (by `secondStep.owner`, and by the object's single `owner` id) raises no owner error; one whose owner is neither an account nor a lock's step owner still raises it |
| `mfa-client.test.mjs` | Notes are kept per subject key; a passing answer for `pc` goes to `completeSecondStep`, and one for a test-only kind is handed out once by `takeCompleted` and never reaches the mirror; `noteRequired` and each route answer emit the matching `mfa_*` event, plain and as `<name>:<npcId>`, with `pcId` for a PC and `targetType`, `targetId` for the test kind; no `pc_signin_failed` for the test kind |

**Feature scenario** `scenarios/test_ops_mfa/`: three rooms, one foothold, five sign-in PCs
(two under a `code` policy with `maxAttempts`, one `push`, one `push_number_match`, one with
`maxAttempts` and no `mfa`), two desks and eight accounts:

| Account | Set up as | Beats |
|---|---|---|
| Code owner A | `code_device` in `itemsHeld`, offered in her story | F1 to F5, F7, F8, F15 |
| Code owner B | `code_device` loose on a desk; phone offered in her story | F6, F18 |
| Service account | `creds.mfa: false` | F6 |
| Push owner, low awareness | no phone item | F9 |
| Push owner, high awareness | phone offered in his story | F10, F11, F12 |
| Number matching owner | phone, knock-out allowed | F13, F14 |
| Locked account | `recovery` answers on a feed post and a document, `resetPassword` | F16, F17 |
| Refused account | `recovery` answers the player never finds | F16 |

Desk 1 is `questions`, `resets: ["password"]`, `maxTries: 3`; desk 2 is `callback`, `resets:
["mfa"]`, each with its own NPC.


| Beat | What happens | Server record afterwards |
|---|---|---|
| F1 | Right password at a `code` PC | No session; `mfaPending` has the PC |
| F2 | Device route before holding the device; a crafted inventory add of the met owner's device | 403; add refused; no code in any captured answer so far |
| F3 | Owner hands the device over; "Use device" on the code pane; Verify | Session `via: password`; pending gone; `mfaAccounts.used` set |
| F4 | Same code typed at a second `code` PC within the minute | Answered as used; no counter moves; a fresh code after the window turns is accepted |
| F5 | Drop the device in the room; ask the device route again | 403 |
| F6 | Second owner's device left loose on a desk, its owner never met; exempt service account at the same PC | Session after the code; exempt session with no second step |
| F7 | Lock the F3 session, then unlock with the password, device no longer held | Session unlocked; no pending record |
| F8 | Sign in to the `code` PC over the foothold; unplug the foothold; type a right code | Refused as out of reach; no session |
| F9 | `push` PC, low-awareness owner, three requests | Approved on the third; `mfaPrompts` back to 0 |
| F10 | `push` PC, high-awareness owner, requests to the cap | Never approved; attempt expired |
| F11 | Take the high-awareness owner's phone; "Check phone" on the pane; approve | Session; `approvedBy: player`; the pane's screen reopens signed in |
| F12 | On the code pane, open the device and close it with X; on the push pane, open the phone and close it with X | Sign-in screen back on its second pane both times; pending record still live; no failure recorded |
| F13 | Number matching, owner holds phone | Never approved |
| F14 | Number matching with the held phone, wrong then right number | Cancelled, then session |
| F15 | Session token to an MFA PC; saved connection to it | Token session at once; saved connection refused with `typeToSignIn: "second_step"`, no session and no pending record; typing the same account's password reaches the second step |
| F16 | Guess an account's password to the lockout; helpdesk, wrong answers to `maxTries` for another account | `loginLockouts` has the key; `helpdeskTries` at the cap; `blocked` with `retryIn`, and served again after five minutes |
| F17 | Helpdesk, right answers found on a feed post and a document, for the locked account; a saved connection for it, then the new password typed | `accountResets` password; lockout gone; keyring lists the entry; old password refused; saved connection refused as `password_changed`; sign-in at the once-locked PC sets `typed` |
| F18 | Helpdesk re-enrols a second factor (callback rule, phone held); the old device; "My phone" on the code pane | Old device answers `enrolled: false` and the code field stays empty; own-phone code accepted |

**Scripted playtest** through `window.__test`, each beat checked twice: what the browser was sent
(captured answers scanned for codes, the `recovery` map and passwords not yet earned) and what
the server recorded (the column above and the beat's log rows from section 13, read by the
verify script). Codes are read from the
device route, so the run does not depend on the clock; F4's wait for the window is the one
place it reads the route's `secondsLeft`.

**Live proof** on the real client path with a keyless server on the builder's own port, a game
made in that run: F1 to F3, F8, F9, F11, F12, F14 and F17, by clicks and typed input, with
screenshots of the code pane, the device as a child of the sign-in screen, the phone, the
reopened sign-in screen and the request form, plus a reload in the middle of F9.

## 12. Build steps and shared files

Order: M1a, M1b, M2, M3, then H1, H2. The log plan's helper lands before M1a. Each stage: model
and unit tests, server and controller tests, client and JS tests, validator, schema and graph,
the scenario beats, scripted run, live proof, then the two docs (`README_scenario_design.md`
feature index rows A22 and A23, and `docs/ACCESS_AND_NETWORKS.md`) in the same change as the
stage that completes the feature. M1a has no client, so its proof is its controller tests; the
first live proof is M1b's.

New files: `lib/break_escape/mfa_model.rb`, `helpdesk_model.rb`;
`app/models/break_escape/mfa_access.rb`, `helpdesk_access.rb`; `scripts/validate_mfa.rb`;
`public/break_escape/js/minigames/code-device/`, `authenticator/authenticator-live-minigame.js`,
`helpdesk-request/`; `systems/mfa-client.js`; their CSS; the tests above; `scenarios/test_ops_mfa/`.

Shared files (re-read just before editing, own block only, explicit paths):

| File | This plan's edit | Also touched by |
|---|---|---|
| `app/models/break_escape/game.rb` | `attempt_login!` second step, `typed_route_refusal`, the lockout key sites (`attempt_login!`, `account_locked_out_at?`, `lockout_pcs_for_client`, `account_login_key?`, `record_login_failure!`, `add_login_lockout!`; `AccessWork.locked_out_at?` is in `access_work.rb`), `login_lockout_keys_for`, the sourceless room-add test (`:1171`), five state keys | S5a, S5c (sign-in order, lockout scope), S3 (sessions) |
| `app/models/break_escape/network_access.rb` | `helpdesks` added to `WITHHELD_SCENARIO_KEYS` (`:18`), so the scenario sent to the browser never carries it; the desk reaches the client only as `helpdeskForms`. Test: the hostile-input scan | S1, S5a, the log plan's L1a (adds `logSources` to the same line, and lands first) |
| `lib/break_escape/access_identities.rb`, `access_work.rb` | `lockout_key`, `lockout_key_parts`; `locked_out_at?` calls them | S5c if a later slice rescopes lockouts |
| `lib/break_escape/ops_log_events.rb` | this plan's entries in `OpsLog::EVENTS` | every plan that writes rows |
| `credential_login.rb`, `credential_model.rb` | the two saved-connection refusals before the session write; `password` flag on the kind | S5b, S7 (keyring), S5c (account kind on the keyring path) |
| `credential_keyring.rb` | implicit `<npcId>.reset` entry | S5b, S7 |
| `games_controller.rb`, `config/routes.rb`, `game_policy.rb` | six routes, `set_game` list, six policy methods, the two NPC-item gate sites (`:3443`, `:3470`), the `added` mark in `find_accessible_item` | every plan |
| `lib/break_escape/npc_habits.rb`, `scripts/validate_npc_habits.rb` | two accepted keys, per-parameter check | S7 (reads `password` habit) |
| `scripts/scenario-schema.json`, `validate_scenario.rb`, `generate_dungeon_graph.rb` | blocks named in section 9 | every plan |
| `minigames/password/password-minigame.js`, `systems/pc-sessions.js` | second pane, child hand-over, resume on reopen, the two type-to-sign-in notices; `mfaRequired` handling, `completeSecondStep`, `credentialRefusalReason` | S5c if it changes the sign-in screen |
| `minigames/authenticator/authenticator-minigame.js` | `init` body split into `_buildPhoneShell()` and `_buildAttackerParts()`, nothing else | none |
| `systems/pretext-judge.js` | open the request form on a granted ask that names a desk | none |
| `minigames/index.js`, `minigame-starters.js`, JS harness copy lists | three scenes, `mfa-client.js` | S6, S7 |

## 13. Log rows this feature writes

Every row goes through the log plan's helper, `write_log_row!(event, as:, where:, result: 'ok',
detail: nil, once: false, save_limit: false)`, which lands before M1a. Its contract is the log
plan's sections "The helper" and "What the helper does, in order". What a builder of these rows
must hold to:

- **It never saves, and it says whether anything was stored.** It returns a result whose
  `stored?` is true when a row was appended or merged, and nil when nothing could change (no
  `logSources`, no source takes the event, `once: true` found the row already written, or the
  `save_limit` is spent). A branch with no save of its own calls `save!` only when `r&.stored?`.
- **`save_limit: true`** is a switch, never a number. The limit is registered with the event in
  `OpsLog::EVENTS`, per result: at most that many calls for one event, place and result may
  store in each five-minute window of server time, whatever `as` holds. It is the bound for a
  branch whose only save would be the row's. `once:` is refused with `as: { typed: }`, so
  this plan never passes `once:`.
- **Merging** is the log plan's merge step: if one of a source's 10 newest rows has the same
  event, `as`, `where`, `result` and `detail`, the helper adds 1 to that row's `n` instead of
  appending. Refusals sent in turn (A, B, A, B) therefore leave two rows, each with a count.
- **`as`** is `{ account: username }` on every `mfa_*` and `account_*` row. A `helpdesk_request`
  row is `as: { typed: username }`, the helper's capped free-text form, for every result and
  whether or not the username is an account, so a row for a real account and a row for a
  made-up one have the same shape and the desk's log tells a reader no more about which
  usernames exist than the desk's answers did.
- **`where`** is `{ kind: 'pc', id: }` or `{ kind: 'desk', id: }`.
- **Details are closed codes or ids.** No row of this plan carries a number. If one is ever added it
  is a `count` of at most 9, which also keeps it clear of a matching number (10 to 99).

Each stage registers its events in `OpsLog::EVENTS` and asserts its rows in its controller
tests and scenario beats. "When" names the model method and branch, inside the game lock.

**Secret sources.** Each stage registers the secrets it adds with the log module, beside its
`EVENTS` entries, so the helper's guard refuses a row that holds one:

| Stage | Secret | Registered how |
|---|---|---|
| M1a | A six digit code | Derived, never stored: `MfaAccess`'s code function calls `OpsLog.note_issued_secret(code)` each time it computes one (the device route and verify), which holds for the length of the request |
| M3 | The matching number | The same call, by the function that issues the number (the pending-record write, the phone list and `POST /mfa/approve`, which computes them to judge a tap) |
| H1 | `creds.resetPassword` | Scenario field: `OpsLog.register_secret_source(:helpdesk) { \|game\| ... }` returns every account's reset password. The recovery answers are not registered: they can be public facts, such as a name from a feed post, and would collide with ids and display names. No helpdesk row stores a typed answer; the detail records the result only |

This plan authors no second-step seed: the code key comes from the application's secret and is
in no scenario or game row, so there is no seed field to register. Each stage's controller
tests include one case that tries to write a row holding its secret and asserts the guard
refuses it with the guard's own `secret in` error, not the type check's. The case uses a
test-only event whose `detail` kind is `{ id: 'test_any' }` (its lookup resolves any string, so
the value passes its type rule and reaches the matcher): for H1 its value is forced to a
`creds.resetPassword` that equals no username, id or code; for M1a and M3, to the code or number
just passed to `note_issued_secret`, since no row of this plan has a field that could hold either. Typed text in `as.typed` is the
normalised username (section 6), stored whatever it equals and never checked against secrets,
so it cannot serve as the guard case.

| Event | Where | When | Result | Detail | Bound | Saved by | Stage |
|---|---|---|---|---|---|---|---|
| `mfa_challenge` | pc | `attempt_login!`, the second-step branch | `ok` | `route`: the shared codes `keyboard`, `foothold`, `from` (a typed sign-in never carries a relay) | merged repeats | the save that stores the pending record | M1a |
| `mfa_code_ok` | pc | `MfaAccess` verify, right code | `ok` | none | one per sign-in | the save that writes the session | M1a |
| `mfa_code_wrong` | pc | verify, wrong code | `fail` | none | merged repeats; the three code caps | the save that stores the counts | M1a |
| `mfa_code_locked` | pc | verify, the wrong code that reaches `MAX_CODE_WRONG_TOTAL` | `locked` | none | merged repeats; at most one per thirty wrong codes and five minutes | the save that stores `closedAt` | M1a |
| `mfa_prompt_sent` | pc | prompt, each counted request | `ok` | none | merged repeats; 20 per attempt | the save that stores `n` | M2 |
| `mfa_prompt_approved` | pc | prompt (owner approves) or approve (player) | `ok` | `approver`: `owner`, `held_phone`, `own_phone` | one per sign-in | the save that writes the session | M2, M3, H2 |
| `mfa_prompt_denied` | pc | approve, Deny or a wrong number | `denied` | none | one per attempt | the save that drops the record | M3 |
| `mfa_expired` | pc | verify or prompt, the per-attempt cap reached | `expired` | none | one per attempt | the save that drops the record | M1a, M2 |
| `helpdesk_request` | desk | `request_helpdesk!`, after the desk, its NPC and `what` are checked | `granted`, `refused`, `blocked` | `what`: `password`, `mfa` | granted, refused: merged repeats, `maxTries`. Blocked: `save_limit: true`, 10 per desk, registered in `EVENTS` as `{ 'blocked' => 10 }` | granted and refused: the save that stores the grant or the tries. Blocked changes nothing else: `save!` only when `r&.stored?`, at most ten times per desk in each five-minute window, whatever username is typed | H1 |
| `account_password_reset`, `account_mfa_reenrolled` | desk | `request_helpdesk!`, the first grant of each | `ok` | `agent`: the desk NPC's id | once per account | the save that stores the grant | H1, H2 |

A run of `mfa_prompt_sent` to one owner at one PC is one row with a count, which is why the
row carries no request number; that run is the trace a defender would look for.
`helpdesk_request` carries no `agent`: one NPC serves one desk, so the desk id names the agent,
and the typed username needs the room. A stale code, a refused route, a verify against a code
step already closed and a repeat of a granted request change nothing and write no row.

The blocked call, exactly: `write_log_row!('helpdesk_request', as: { typed: username }, where:
{ kind: 'desk', id: desk_id }, result: 'blocked', detail: { 'what' => what }, save_limit: true)`,
saving only when `r&.stored?`. The limit of 10 is the `helpdesk_request` entry's
`save_limit: { 'blocked' => 10 }` in `OpsLog::EVENTS`, which H1 registers.

No field holds a code, a number to match, an answer or a password. The only free text is
`as.typed` on `helpdesk_request`, which the helper strips and caps.

## 14. What this plan relies on from other plans

Each entry names what this plan needs from another plan and the section of that plan that provides it.

1. **Sign-in order.** The account-kind check sits inside the Admission step, then the second
   step, then the session, and the level of the session is computed by `session_access`, never
   written. Provided by `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 3 (S5a) and section 12
   (`attempt_login!` and `attempt_credential_login!`). Section 5.2 is written to it.
2. **Account kind.** Kind does not change the step; `creds.mfa: false` is the only exception.
   Provided by `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 5 (S5c).
3. **Lockout key.** `AccessIdentities.lockout_key` is the one place a later slice changes the
   key. The privilege plan keeps per-PC lockouts, so nothing changes for it
   (`OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 1).
4. **Keyring path.** One refusal with two reasons is added to `attempt_credential_login!`; the
   privilege plan's change to `pc_admits_account?` is unaffected
   (`OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 5, S5c, and section 12).
5. **Technique cards.** A session a card grants meets no second step; a password or saved
   connection a card yields goes to the keyring, and using it does meet the step. Provided by
   `OPS_CORE_PLAN.md` section 4.3 (a technique yields a saved connection, never a password) and
   section 5.4 (the table of how a technique session differs from a password session).
6. **Recovered passwords.** A harvested or cracked password is typed at sign-in and meets the
   step; neither plan starts a session from one. The cracking plan's crack of a collected hash
   keeps reading `creds.password` after a reset, on purpose (section 5.2). Provided by
   `OPS_CRACKING_PLAN.md` section 1 (a recovered password is a first factor) and section 11
   (the hash row after a reset), and `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 5 (S5b: a
   collected account is a hash, never a password).
7. **Policy fields in the browser.** A policy's kind is public, its answers are not (section 7);
   any plan that adds a policy field must state the same for it. `OPS_PRIVILEGE_ACCOUNTS_PLAN.md`
   section 7 adds nothing to `policies`.
8. **Log rows.** Section 13 is written to the log plan's helper and to its registration of
   these rows (`approver`, the shared `route` codes, `save_limit: true` on the blocked desk row
   with its limit registered in `EVENTS`, guard tests that force a `detail` value, secret
   sources registered per stage). Provided by `OPS_LOG_ROWS_PLAN.md` sections 13.2 to 13.5 and
   13.7 (the S8 rows).
9. **Hosts.** A host with no sign-in has no policy and so no second step. A headless sign-in
   host is covered, since the pending record stores the route. Provided by `OPS_CORE_PLAN.md`
   section 4.1 (S1: a host with no sign-in has no policy field).
10. **Feature scenario names.** No other plan provides a helpdesk scenario: `test_ops_mfa`
    covers S8b too, and no `test_ops_helpdesk` is built.
11. **The lock plan.** `OPS_LOCK_SECOND_STEP_PLAN.md` sections 5.2, 6 and 8 call the section 5.2
    functions with their own subject and widen the `/mfa/*` routes to take it. This plan
    builds, in S8a, what that caller relies on, so the lock plan changes none of it: the subject rules of 5.2 (the record in the caller's own map, a
    `passed` record kept by the expiry tidy, no drop on a pass, no route re-judge, no lockout
    key, re-enrolment ignored so the step goes to the owner's authored phone and device, and
    `device_in_use?` keeping that device's code live); `numbers` taking the subject's record
    key (5.1); `mfaPrompts` and `mfaAccounts` counted per step owner across subjects (5.2,
    section 8); and in `MfaClient` the subject keys, `takeCompleted` handing out a pass answer
    for any kind, and the four `mfa_*` events emitted from `MfaClient` (browser events that never reach the log, apart from the log's own `mfa_*` rows) with `targetType` and
    `targetId` in place of `pcId` (5.3). The lock plan uses these names, keeps its lock records
    in its own key, registers its subject kind with `device_in_use?`, and drops `ownPhone` from
    its lock answer. A change to those functions' signatures, to the
    pending record's fields or to the counts is checked against
    `OPS_LOCK_SECOND_STEP_PLAN.md` before it is made.

## 15. Decisions

No question is open. Points with an obvious default are settled in section 5.4. Three settled
answers that shape later work follow.

- **A helpdesk request over a PC needs a session there; in person it needs none.** As written in
  section 5.2: a request made from a PC's desktop needs an open, unlocked session at that PC (any kind),
  and a request in person at the desk needs none. There is no desk field for it.

- **NPCs do not react to what the player does to their account.** Only the log rows are
  written, and the event `mfa_prompt_sent:<npcId>` lets a scenario voice a bark. Reactions
  (a careful owner reporting repeated prompts, an owner ringing the desk after a reset) belong
  with the parked defence work (`ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`).
- **Borrowing has no engine rule:** "borrowed" means the owner's story lends the device; the
  player can only drop it, after which the device route refuses (beat F5). An ink tag that
  returns an owner-bound item to its owner is a small follow-up after S8b; the owner noticing a
  missing device belongs with the defence work.
