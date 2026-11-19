# Ops layer: multi-factor sign-in and helpdesk recovery (S8a, S8b)

Status: plan, not built. Base: `docs/ops-layer-plan`. Feature ids on landing: A22 (multi-factor
sign-in), A23 (helpdesk account recovery). Feature scenario: `test_ops_mfa`. This plan is
standalone: a builder needs this file, `docs/ACCESS_AND_NETWORKS.md` and the code it points at.

Pointers are `file:line` in the tree as read on 2026-11-19.

## 1. What this adds and why, in play

**S8a, multi-factor sign-in (A22).** A sign-in policy can ask for a second step after a correct
password. Three kinds:

- `code`: the sign-in screen asks for a six digit code. The account's owner carries a **code
  device**, a real item. The player gets it the way any NPC item is got (handed over in
  conversation, picked up after a knock-out, found where a careless owner left it), opens it
  from the sign-in screen or the inventory and reads the code showing now. The code changes
  every minute and works once. The server only shows a code to a player who holds the device,
  and hands the device over only when the owner's story offers it or the owner is knocked out.
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

**Which ways in meet the second step.** A typed password and a saved connection do. That
includes a password the player cracked from a hash or collected from a machine they control:
it is used through the ordinary typed or keyring sign-in. A session token, a help invite, a
claim of a screen someone left open, and a session granted by a technique card (N15) do not:
none of them runs the sign-in checks.

**S8b, helpdesk recovery (A23, lower priority).** A helpdesk NPC can reset an account's password
or move its second factor to the caller, after checking who is asking under a rule the scenario
sets: `none`, `questions` (answers the player types, learned from feed posts, documents or
conversation) or `callback` (the desk rings the number on file, so the player must hold the
owner's phone). A password reset puts a usable credential in the keyring and clears the
account's lockouts; a second-factor reset moves the account's second step to the player's own
phone. It teaches that the recovery path is part of the sign-in, and that facts found online
prove nothing about a caller.

Design rules both stages keep:

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
| Session write | One place, record `{id, via, credential?, foothold?, from?, relay?}` | `game.rb:4388-4418` |
| Sign-in answer | `npcId, username, displayName, via, portrait, avatar` plus route fields | `game.rb:4433-4461` |
| Keyring sign-in | Nine ordered steps; `saved_connection` honours lockouts, `token` and `assist_invite` do not | `app/models/break_escape/credential_login.rb:22-89`; kinds at `lib/break_escape/credential_model.rb:21-27` |
| Claim of an open screen | Separate method, no password | `game.rb:3527` |
| Policy read | `effective_policy(pc)`: the PC's `policy`, else `defaultPolicy`; unknown name gives `{}`. No `mfa` key exists | `game.rb:3360`; schema `scripts/scenario-schema.json:261-280` (closed block) |
| Policies and the browser | `policies` and `defaultPolicy` ship in the bootstrap as authored, on purpose ("hold no secrets"). Three client modules read `gameScenario.policies` | `game.rb:2471-2473`; `systems/pc-policy.js:33`, `systems/workstation-state.js:685`, `systems/npc-reports.js:334` |
| Screen lock | A `via: 'password'` session can be locked because the password gets the player back in; the way back is `attempt_login!` again, which rebuilds the session without `locked` | `game.rb:3800-3830` |
| Habits | `locksScreen`, `writesDown`, `password`, `holdsDoors`; presets from `awareness` set only `locksScreen` and `holdsDoors`. `expand!` writes `PRESETS[level].merge(own)` back into each NPC of the saved scenario, and fixtures pin that output. `valid_parameter?` accepts only `passwordPattern`, as a non-empty string | `lib/break_escape/npc_habits.rb:18-38`, `:55-57`, `:103`, `:127-176`; `test/fixtures/format_8c/test_access_habits.old.loaded.json` |
| Habits and the browser | Allow list: only `habits.screen` and `habits.print` ship. `creds`, `awareness`, `role`, `workarounds` are deleted from NPCs | `game.rb:7332-7344`, `:7376-7383` |
| Access state | Server-owned keys in `ACCESS_STATE_DEFAULTS`; none read from a sync body, none sent; a reset drops them | `game.rb:3021-3059` |
| Held item proof | Inventory entry whose `type`, `id` (and stored field) equal the authored definition, and not `client_forged?` | `app/models/break_escape/credential_keyring.rb:42-64` |
| NPC phone | Item `type: "phone_friendface"` with `owner`. `held_friendface_phone(npc_id)` reads the server's inventory and counts only a phone the scenario declares with that owner; `phonesTaken` records a phone leaving its NPC | `app/models/break_escape/social_feed.rb:186-246`; `games_controller.rb:1722-1730` |
| NPC-sourced items | Three places decide whether an item leaves an NPC, and all three apply the "story offers it, or knocked out" rule to the phone type only: the direct add from `itemsHeld` (every other type needs only that the NPC was met), the pickup of a stored drop, and the room add with no source. `npc_room_drop_allowed?` and `npc_offers_item?` are generic over the type | `games_controller.rb:3442-3448`, `:3464-3475`; `game.rb:1169-1174`, `:2152-2158`; `social_feed.rb:257-259` |
| Knock-out record | Claimed by the browser's sync; accepted only for a met room NPC that is not `koImmune` | `game.rb:2008-2033` |
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
  nothing is scored (`:1-17`). It talks to no server route. `params.mode` is already a free
  role label (default `'attacker'`, `:77`) returned in its result `{approvedAt, sent, mode}`
  (`:445-452`); `init` always draws the attacker's controls and builds a timeline from params
  (`:106-170`); the card builder draws Approve and Deny as `aria-hidden` spans, not buttons
  (`:408-429`). Six scenarios use it (`ca06_texts_and_qr`, `ca06_texts_and_qr_defend`,
  `ca09_passwords`, `ca09_passwords_defend`, `ca_pre_general_v2_ab`, `ca_post_general_v2_ba`),
  and so does the episode runner (`minigames/episode-runner/episode-runner-minigame.js`). A
  phone the player approves on needs different `init`, `start` and cards, so **S8a adds a
  subclass scene, `authenticator-live`,** and leaves the shared scene's paths alone
  (section 5.3).
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

### 2.4 The sign-in client and the minigame manager

- **`api.login` throws only on a non-2xx answer.** A 200 answer with `success: false` reaches
  the last test in `PcSessions#signIn` (`public/break_escape/js/systems/pc-sessions.js:552-554`)
  and comes back as `{ ok: false, reason: 'error', message: 'Sign-in failed' }`, which the
  sign-in screen draws as an error (`minigames/password/password-minigame.js:2492-2495`).
  `signInWithCredential` has the same test (`pc-sessions.js:619-621`, screen at
  `password-minigame.js:2349-2370`).
- **The session mirror is written in one place per sign-in:** `_replace(pcId, session)` then
  `_dropEnded(body.endedPcIds, pcId, body.tokenExpiredPcIds)` (`pc-sessions.js:555-562`). The
  screen's own follow-up (`teachAfter`, `signInAccepted`) runs on `result.ok`
  (`password-minigame.js:2480-2485`, `:2353-2356`).
- **One minigame runs at a time.** `MinigameFramework.startMinigame` ends the running minigame
  before it starts another (`minigames/framework/minigame-manager.js:66-99`). The one exception
  is the parent and child hand-over: a parent sets `suspended: true` on its own params and
  starts a child with `returnTo: { sceneType, params }`. The parent is ended without its
  `onComplete`; when the child ends on a normal exit (success true, result not `{ aborted:
  true }`) the framework starts the parent's scene again with its original params and
  `returnTo.params` merged over them (`:14-30`, `:102-106`, `:540-566`, `:616-636`). The parent
  that comes back is a new instance, so anything it must remember travels in `returnTo.params`
  or lives outside the scene. If the child does not end normally the parent is released: its
  `onComplete` runs once and it does not reopen (`:641-655`).

## 3. Build stages in order

Each stage ends tested and, from M1b on, playable. Letters M (multi-factor) and H (helpdesk).

| Stage | Adds | Done when | Size |
|---|---|---|---|
| M1a (server) | Policy `mfa: "code"`, `MfaModel`, the `code_device` item and its gate (`OWNER_BOUND_TYPES` at the three NPC-item sites), the pending second step in `attempt_login!`, the route re-judge, `login_lockout_key`, `GET /mfa/device`, `POST /mfa/verify`, schema and validator | Controller tests: a `code` PC answers `mfaRequired` to a right password and opens a session only on a right code; the device cannot be pulled from an owner who has only been met | M |
| M1b (client) | `PcSessions` second-step handling and `completeSecondStep`, `mfa-client.js`, the sign-in screen's code pane, the `code-device` scene as a child of the sign-in screen, dungeon graph, scenario beats F1 to F6, live proof | A player signs in at a `code` PC with a device they were handed | M |
| M2 | `mfa: "push"`, habit `approvesPrompts` with `promptPatience` resolved at read time, `POST /mfa/prompt`, the waiting pane | Pestering a low-awareness owner signs the player in; a high-awareness owner never approves | S |
| M3 | `mfa: "push_number_match"`, `GET /mfa/phone`, `POST /mfa/approve`, the `authenticator-live` scene | A held phone approves a request; number matching defeats pestering but not a held phone | S |
| M4 | `credential_login_checks` factored out of `attempt_credential_login!`; `saved_connection` takes the second step; `token` and `assist_invite` skip it | A saved connection to an MFA PC stops at the second step; a session token does not | S |
| H1 | `helpdesks`, `creds.recovery`, `creds.resetPassword`, `POST /helpdesk/request` for `what: "password"`, lockouts cleared on a grant, the `helpdesk-request` form, the keyring entry | The player locks an account out, wins a reset with typed answers and signs in at the locked PC with the issued password | M |
| H2 | `what: "mfa"` (re-enrolment onto the player's own phone) and `verify: "callback"` | A re-enrolled account's second step is answered from the "My phone" button on the sign-in screen | S |

M1a to M4 are S8a. H1 and H2 are S8b; H1 needs none of S8a, H2 needs M1b to M3. M4 rests on the
route re-judge M1a builds: M1a writes it for typed routes, M4 adds the keyring branch.

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
- `enrolled?(npc)`: an account whose `creds.mfa` is not `false`. Nothing else is consulted.
- `OWNER_BOUND_TYPES = %w[phone_friendface code_device]`: item types an NPC gives up only when
  its story offers them or it is knocked out (section 5.2).
- `device_for(scenario, npc_id)`: the authored `code_device` whose `owner` is the NPC, found by
  the same walk the phone uses (room objects and their `contents`, NPC `itemsHeld`, start items;
  `social_feed.rb:201-221`).
- `code(key, game_id, device_id, generation, window)`: six digits from an HMAC-SHA256 over
  `"<game id>|<device id>|<generation>|<window>"`.
- `numbers(key, game_id, pc_id, npc_id, nonce)`: for number matching. One HMAC over those four
  values gives the right two digit number, two different wrong ones, and the order of the three
  on the phone. `nonce` is the count of second steps started for that account in this game
  (`mfaAccounts[npcId].started`, section 8), so nothing is drawn at random.
- `PROMPT_PRESETS = { 'low' => 'pestered', 'medium' => 'never', 'high' => 'never' }` and
  `prompt_habit(npc, scenario)`: the NPC's authored `habits.approvesPrompts` if valid, else
  `PROMPT_PRESETS[NpcHabits.level_of(npc, scenario)]`, else `never`. `prompt_patience(npc)`:
  the authored `habits.promptPatience` if an integer 2 to 9, else 3.
- `STEP_SECONDS = 60`, `PENDING_SECONDS = 300`, `PROMPT_GAP_SECONDS = 2`, `MAX_PROMPTS = 20`,
  `MAX_CODE_TRIES = 5`.

**Habits are resolved when read, not written at load.** `NpcHabits.expand!` writes each preset
into the saved scenario, and fixtures and tests pin that output for every NPC with an
`awareness` level. So `NpcHabits::PRESETS` is not touched. `NpcHabits` changes in two small ways
only: `HABITS` gains `approvesPrompts` with its three values and `PARAMETERS` gains
`promptPatience`, so an authored value validates and `expand!` carries it across as it does any
authored habit; and `valid_parameter?` (`npc_habits.rb:55-57`) becomes a per-parameter check
(`passwordPattern` a non-empty string as today, `promptPatience` an integer 2 to 9), mirrored in
`scripts/validate_npc_habits.rb`. An NPC that authors neither key expands to exactly what it
does today. `awareness` stays on the NPC in the saved scenario, so `level_of` can be asked at
request time. Neither key is in `SHIPPED_HABIT_KEYS`, so neither reaches the browser.

New `lib/break_escape/helpdesk_model.rb` (S8b): `desks(scenario)`, `desk_for_npc`,
`normalise_answer` (strip, collapse inner spaces, downcase, first 64 code points), `answers_right`.

**The code and time.** The window is `floor(server seconds / 60)`. The key comes from the
application's own secret (`Rails.application.key_generator.generate_key('break_escape/mfa')`), so
nothing secret is stored in the game row and the browser cannot compute a code. The server accepts
the current window and the one before it, so a code read at second 59 still works. This window
is the only place the feature's behaviour depends on real time: the pending record's expiry and
the gap between requests also read the server's clock, but only to tidy up and to slow a script,
and no outcome a player sees turns on them. Whether an owner approves is a count, never a roll,
and no outcome depends on a code's digits, so a scripted run repeats: it reads the code from the
device route as a player would. Unit tests fix the time. Nothing on the server pauses with the
game; a pending record that runs out while a menu is open costs the player nothing but typing
the password again.

### 5.2 Server

New concern `app/models/break_escape/mfa_access.rb`, included in `Game` as `NetworkAccess` and
`CredentialLogin` are.

**The sign-in order.** `attempt_login!` (`game.rb:3444`) runs, in the order agreed across the
ops plans:

1. PC found; the route branch (reach, off, remote blocked).
2. Lockout check, on the key from `login_lockout_key` (below).
3. Account lookup; the typed password equals `effective_password(npc)` (S8b; `creds.password`
   until a reset).
4. PC admission, `pc_admits_account?`. The privilege plan's account-kind check (A20) sits here.
5. **The second step.** If `mfa_step_for(pc, npc)` is not `none`, write the pending record and
   return the `mfaRequired` answer. No session exists yet and the failure counter is not
   cleared.
6. Failures cleared; `start_login_session!`, at the access level the account carries (the
   privilege plan owns the level); the answer.

Step 5 goes between today's lines 3492 and 3494. `start_login_session!` (`game.rb:4388`) stays
the only writer of a session.

**The lockout key.** Today the key is built inline as `"#{pc['id']}|#{normalised}"`
(`game.rb:3482`, and again in `account_locked_out_at?`, `:3576-3581`). M1a moves that into one
helper, `login_lockout_key(pc, username)`, returning the same string, plus
`login_lockout_keys_for(npc)` (every key held in `loginFailures` or `loginLockouts` for that
account). Every route in this plan calls the helpers and never builds the key itself, so the
privilege plan can change how a domain account's lockout is scoped in one place.

`mfa_step_for(pc, npc)` is `none` when:

- the policy kind is `none`, or the account is not enrolled (`creds.mfa: false`). Account kind
  plays no part;
- the PC already holds this account's own session and that session is locked. Unlocking a
  screen the player locked asks for the password only, because the session is already open; a
  player who has handed the device back can still get back to a PC they hold. A different
  account at that PC, or a session that has ended, meets the step as usual;
- (kind `code`) the scenario declares no device for the account and it has not been re-enrolled.
  The validator makes this an error, so it fails open only in a scenario that did not validate.

**Ways in that never reach step 5.** A claim (`claim_login_session!`, `claim_guest_session!`)
opens a session someone else signed in to, and both refuse a foothold, so neither can be used
remotely to skip the step. A session granted by a technique card runs none of the sign-in
checks. `token` and `assist_invite` skip the step as they skip lockouts
(`credential_model.rb:24-26`).

**Ways in that do.** A typed password from any source: read off a post-it, cracked from a hash,
collected from a machine, or issued by the helpdesk. The keyring's `password` kind is one of
these: it is `connects: false` (`credential_model.rb:22`), so the client types it into
`POST /login` and it needs no flag of its own. Of the connecting kinds only `saved_connection`
meets the step: its `CredentialModel::KINDS` entry gains `mfa: true`, and in
`attempt_credential_login!` the step sits after step 8b (ended or expired) and before step 9
(the session write).

**Pending record.** `player_state['mfaPending'][pcId] = { 'id' => npcId, 'kind', 'via' =>
'password' | 'credential', 'credential'?, 'foothold'?, 'from'?, 'relay'?, 'n' => 0, 'tries' =>
0, 'nonce', 'at' => server seconds, 'last' => 0 }`. One per PC; a new first step at that PC
overwrites it. It expires after `PENDING_SECONDS`; expired records are dropped whenever the map
is read or written, so abandoned attempts do not pile up. Writing one adds 1 to
`mfaAccounts[npcId].started`, which is the `nonce`.

**Every second-step route judges the first step's route again.** The player can unplug a
foothold, drop the planted device that proves a saved connection, or be removed from a PC's
access list between the two steps. `second_step_refusal(pc, pending)` returns the refusal the
first step would now give, or nil:

- `via: 'password'`: `typed_route_refusal(pc, foothold:, from:)`, which is the route branch of
  `attempt_login!` moved into a method both callers use, then `pc_admits_account?`.
- `via: 'credential'`: `credential_login_checks(pc, cred_id, route)`, which is steps 2 to 8b of
  `attempt_credential_login!` (`credential_login.rb:28-70`: a held and proven credential, its
  own PC, the route its kind allows, the policy accepts the kind, the access list, the lockout,
  ended, expired) moved into one method returning a refusal or the judged entry.
  `attempt_credential_login!` calls it too, so there is one copy, and it is where the privilege
  plan adds any account-kind check for the keyring path.

When the step passes, the session is written as the first step would have written it: `via:
'password'` with the stored foothold or `from`; or `via: 'credential'` with the credential id
and the stored route, and the answer carries `route` as today's does
(`credential_login.rb:83-87`). `stamp_token_clock!` never applies, since a token is never
pending.

**Getting the device: the server gate.** The code is only as well guarded as the device, so the
device enters the server's inventory under the same rule as an NPC's phone, enforced at every
place that rule lives today. All three places test `type == FRIENDFACE_PHONE`; M1a replaces that
test with membership of one list, `MfaModel::OWNER_BOUND_TYPES = ['phone_friendface',
'code_device']`, so the two item types cannot drift apart:

| Path | Today (phone only) | With the list |
|---|---|---|
| Direct add from an NPC's `itemsHeld` (`games_controller.rb:3464-3475`) | Refused unless the NPC's story offers the phone or the server holds the NPC as knocked out. Every other held type needs only that the NPC was met | A `code_device` is refused on the same test, asked as `npc_offers_item?(npc_id, 'code_device')` (the generic form `friendface_phone_offered?` already wraps, `social_feed.rb:257-259`) or `npc_defeated?(npc_id)` |
| Pickup of a stored room drop that names an `owner` (`games_controller.rb:3442-3448`) | Asks `npc_room_drop_allowed?` again, for saves made before the rule | Same question for a `code_device` |
| Room add with no source (`game.rb:1169-1174`) | A phone enters a room only as an NPC drop or a player drop | Same for a `code_device`, so no client can mint one in a room |

`npc_room_drop_allowed?` (`game.rb:2152-2158`) is already generic over the item type and needs no
edit. A client-built item cannot carry `owner` (`games_controller.rb:3304-3306`), so a device
cannot be forged in the inventory request either. A device the scenario places in a room object
or a container is not NPC-sourced: it is collected under the ordinary room and container rules,
and the container's lock is its gate.

So a player obtains a device in exactly four ways, each decided by the server: the owner's story
gives it (the give tag is in the story, and the owner has been met); the owner is recorded as
knocked out; the scenario left it somewhere the player can reach; or it is a start item. Meeting
the owner is not enough.

The knock-out record itself comes from the browser's sync (`game.rb:2008-2020`) and is accepted
only for a met room NPC that is not `koImmune` (`npc_ko_claimable?`, `game.rb:2029-2033`). Combat
runs in the browser, so "steal after a knock-out" is best-effort, as it already is for a phone. An
author who wants a device to be won only in conversation sets `koImmune` on its owner.

**Holding the device.** `held_code_device(npc_id)` is the proof every code route uses. It follows
`credential_held_proof_holds?` (`credential_keyring.rb:42-64`): an inventory entry, unwrapped from
`scenarioData`, whose `type`, `id` and `owner` equal an authored device, and not
`ItemIdentity.client_forged?`.

**Code.** `GET /mfa/device` serves the current code only while `held_code_device` holds for the
device asked about. `POST /mfa/verify` compares the typed code with the device's code for the
pending account in constant time. The server does not ask whether the player holds the device at
verify time: knowing the current code is the proof, and the only way a code reaches the browser
is the device route. Three limits apply to a typed code:

- **Used once.** A right code records `mfaAccounts[npcId].used = window`; a code from that window or an
  earlier one is then refused for that account, at every PC. One integer per account.
- **Five wrong codes per attempt.** `MAX_CODE_TRIES = 5` wrong codes (`tries` on the pending
  record) drop the record, and
  the password must be typed again. This cap does not depend on the policy, so a policy with no
  `maxAttempts` still cannot be guessed through.
- **The shared lockout counter.** A wrong code is also a failed sign-in: it goes through
  `record_login_failure!` on the account's `login_lockout_key`, so `maxAttempts` covers both
  steps.
  One exception keeps a slow typist from losing an account for the rest of the game (lockouts
  never expire, `game.rb:4344-4350`): a code equal to the code of either of the two windows
  before the accepted pair is answered `codeExpired: true`, counts towards neither limit, and
  the pane asks for the current code.

**Push.** `POST /mfa/prompt` sends one request and answers at once. In order: the pending record
is a push kind and live; at least `PROMPT_GAP_SECONDS` since `last` (else `tooSoon`); `n` below
`MAX_PROMPTS` (else the attempt ends); then `n += 1` and the first of these that applies:

1. The account was re-enrolled (S8b): the request is on the player's own phone; answer `waiting:
   "own_phone"`.
2. The player holds the owner's phone: answer `waiting: "held_phone"`. Nobody else can approve.
3. The owner's phone was taken and is not held (dropped, left in a room): nobody answers.
4. The owner is recorded as knocked out: nobody answers. The record comes from the browser, so
   it is used only to refuse here, never to grant.
5. The owner receives the request: `mfaPrompts[npcId] += 1`. Kind `push_number_match`: the owner
   never approves. Kind `push`: `always` approves; `pestered` approves when `mfaPrompts[npcId]
   >= prompt_patience`; `never` does not.

`mfaPrompts[npcId]` counts only requests the owner received (case 5), so a request the player
caught on a held phone tires nobody. It counts across attempts and across PCs and returns to 0
when a request for that account is approved by anyone. Fatigue therefore builds as the player
keeps trying, survives an expired attempt, and starts again after a success. An approval starts
the session exactly as a correct password does today.

`POST /mfa/approve` is the player approving on a phone: the pending record is a push kind; the
player holds the owner's phone (`held_friendface_phone(npc_id)`, called unchanged), or the
account was re-enrolled; for number matching the posted number equals the pending number. A
wrong number or a Deny cancels the attempt, as tapping the wrong number does, and is not counted
towards a lockout: the three choices leave nothing worth guessing, since a cancelled attempt
costs the password step again and a new attempt has new numbers.

**Helpdesk (S8b).** New concern `app/models/break_escape/helpdesk_access.rb`.
`request_helpdesk!(desk_id, username, what, answers)` checks, in order: the desk exists; its NPC
is in `encounteredNPCs` and is not recorded as knocked out; `what` is in the desk's `resets`; the
desk has not stopped serving this username (`helpdeskTries` at `maxTries`); the username is an
account; the rule holds (`none`: always; `questions`: at least `needs` normalised answers equal
the account's `creds.recovery` values; `callback`: the player holds the account owner's phone).
An unknown username and wrong answers take the same counted refusal with the same body, so the
route cannot be used to list accounts. The typed username is normalised with
`normalise_username`, stripped of control characters and cut to 64 code points before it is
used as a key; it is never echoed in an answer.

What is hard-enforced and what is not, under the cheat policy: the `questions` and `callback`
rules are decided from server state and cannot be passed by a crafted request. Being in the
conversation is not checked beyond "met and conscious": a player who has met the desk can post a
request from another room. That is the same best-effort footing as any step gated by dialogue.
A `none` desk grants to any request by design; it is the author's way to show a careless desk,
and the ink only paces it.

A grant writes `accountResets[npcId]` with `'password' => true` or `'mfa' => true`:

- **Password.** `effective_password(npc)` returns `creds.resetPassword` once reset, else
  `creds.password`. Only `attempt_login!` (`game.rb:3486-3487`) changes to call it. The old
  password then fails at sign-in. Other readers of `creds.password` keep the authored value on
  purpose: a post-it (`game.rb:3425`) and an earlier capture (`game.rb:2697`) are now out of
  date, as they would be. The keyring lists a new implicit entry `<npcId>.reset` (kind
  `password`) built beside the captured-account entries (`credential_keyring.rb:263-285`), so
  the credential arrives by the keyring path the other plans use.
- **A password reset unlocks the account.** Lockouts never expire, and a locked key is refused
  before the password is read (`game.rb:3483`), so without this the usual story (guess, lock
  the account, ring the desk) would end with a password that cannot be typed. The grant deletes
  every `login_lockout_keys_for(npc)` entry from `loginFailures` and `loginLockouts`, at every
  PC. The granting answer carries `lockoutPcIds`, the fresh `lockout_pcs_for_client` list
  (`game.rb:3586-3592`), and the client reseeds its "lockout seen" marks from it; a reload
  reads the same list.
- **Second factor.** The account's device generation goes from 0 to 1, so codes from the old
  device stop verifying, and the account's second step moves to the player's own phone:
  `GET /mfa/device` with `npc_id` serves the new code with no item, and push requests wait for
  `POST /mfa/approve` with no held-phone check. The player needs no phone item; section 5.3
  gives the screen. A second-factor reset does not clear lockouts.

### 5.3 Client

**Session mirror (`systems/pc-sessions.js`).** The mirror stays the only writer of client
session state.

- `signIn` and `signInWithCredential` test `body.mfaRequired === true` before their
  `success === false` test. They record the step in `MfaClient` and return `{ ok: false, reason:
  'mfa_required', mfa, number, ownPhone, pcId }`. No `pc_signin_failed` is emitted;
  `mfa_required` is.
- New public `completeSecondStep(pcId, body, via)`. The answers of `/mfa/verify`, an approved
  `/mfa/prompt` and `/mfa/approve` are the normal sign-in answer, and this method does with
  them exactly what `signIn` does with its own (`pc-sessions.js:555-562`): build the session
  (with the credential, token and route fields when `via` is `credential`), `_replace`,
  `_dropEnded(body.endedPcIds, pcId, body.tokenExpiredPcIds)`, and the same `pc_signed_in`
  event. No other module writes the mirror.
- A refused second step emits `pc_signin_failed` with a new reason: `mfa_wrong_code`,
  `mfa_code_expired`, `mfa_cancelled` or `mfa_expired`; `locked_out` as today.

**`systems/mfa-client.js` (new).** Calls the five `/mfa/*` routes and hands every sign-in answer
to `completeSecondStep`. It holds, in memory only, what a reopened sign-in screen needs:
`pendingFor(pcId)` (kind, number, `ownPhone`, the credential id if the first step was a keyring
sign-in, and which lesson to teach afterwards), `lastRead` (the code a device scene showed
last) and `takeCompleted(pcId)` (a session the second step just opened, handed out once).

**Sign-in screen** (the `password` scene on the PC monitor).

- On `reason === 'mfa_required'` it swaps to a second pane in the same monitor frame, with no
  error line and no reject sound. For `code`: one six digit field and Verify. For push kinds: a
  line saying a request was sent, the two digit number when there is one, the count sent, and
  "Send again" (`POST /mfa/prompt`). Failures show `attemptsLeft` as the password pane does.
- What runs today on `result.ok` runs when the second step succeeds and not before:
  `teachAfter` with the lesson noted at the first step (`in_file` for a typed sign-in from a
  file tile, the credential's kind for a keyring sign-in), then `signInAccepted(session)`.
- **Buttons to the thing the player holds.** The code pane shows "Use <item name>" for each
  `code_device` in the inventory. The push pane shows "Check <owner>'s phone" for each held
  `phone_friendface` that has an owner. Either pane shows "My phone" when the answer said
  `ownPhone: true`. The pane does not know which device belongs to the account; a wrong
  owner's device simply shows a code that fails.
- **Each button opens its scene as a child of the sign-in screen**, by the manager's parent and
  child hand-over (section 2.4): the screen sets `suspended: true` on its own params and starts
  the child with `returnTo: { sceneType: 'password', params: {} }`. A child started this way
  always ends as a normal exit, X included, so the sign-in screen always comes back.
- **The screen that comes back is a new instance.** Its `init` asks `MfaClient` first:
  `takeCompleted(pcId)` returns a session when the child approved the request, and the screen
  runs the accepted path at once; else `pendingFor(pcId)` puts it straight on the second pane,
  with the code field filled from `lastRead` (not submitted: the player presses Verify, and a
  stale code is answered "that code has expired"); else the password pane, with a "request
  cancelled" line if the child denied.
- **Closing the screen does not cancel the attempt.** X leaves the server's pending record to
  expire and `MfaClient` keeps its note, so opening the PC again within five minutes returns to
  the second pane. If the record has gone, the first verify or prompt is refused and the screen
  falls back to the password pane. The same holds when another minigame displaces the sign-in
  screen, for example the player opening the device straight from the inventory.

**`code-device` scene (new).** A small device frame from `device-frame.css`, the owner's headshot
and name, six digits in VT323 and a bar that drains to the end of the window. It calls
`GET /mfa/device` on open and when the bar empties, and notes each code in `MfaClient.lastRead`.
Opened from the sign-in screen's button (as a child) or from the inventory item (alone). With
`own: true` it draws the player's phone frame and asks by `npc_id`. New, because no existing
scene shows a value the server changes over time.

**`authenticator-live` scene (new, a subclass).** `AuthenticatorLiveMinigame extends
AuthenticatorMinigame`, registered under its own name. It overrides `init`, `start` and the card
builder: cards come from `GET /mfa/phone`, each with real Approve and Deny buttons (for number
matching, three number buttons), and a tap calls `POST /mfa/approve` through `MfaClient`. The
only edit to the parent class is to move the phone shell (`authenticator-minigame.js:129-149`)
into a method `_buildPhoneShell()` that both call, producing the same DOM as today. `mode`,
`choice`, the timeline, `_appendCard` and `closeResult` in the parent are not edited, and the
`authenticator` scene name keeps its meaning for the six awareness scenarios and the episode
runner. Opened three ways: from the push pane's phone button (child); from "My phone" (child,
`own: true`); and from a held NPC phone's own menu, as a "Sign-in requests" entry beside its
Friendface entry, drawn when any shipped policy has a push kind.

**Approving with no sign-in screen open.** A player may close the sign-in screen, walk off, and
approve later on the held phone. The approve answer still goes through `completeSecondStep`, so
the mirror has the session, and a toast names the PC that is now signed in.

**`helpdesk-request` scene (new, S8b).** A paper request form in the shared frame: username
field, a choice of what is asked for, one text field per `questionLabels` entry, Send. Opened by
an ink tag `#helpdesk_request:<deskId>` in the helpdesk NPC's conversation, or from a granted
pretext ask that names `helpdesk: "<deskId>"` (`systems/pretext-judge.js` starts it). The answer
sets the client global `helpdesk_<deskId>_result` (`granted`, `refused`, `blocked`) so the NPC's
ink can voice the matching authored line. That global is a mirror for dialogue only; nothing
reads it to grant.

**Events** (for scenario `eventMappings`, so barks stay in scenario files): `mfa_required`,
`mfa_prompt_sent` `{ npcId, pcId, n }`, `mfa_approved` `{ npcId, pcId, by }`, `mfa_failed`,
`helpdesk_answered` `{ deskId, result }`; each also as `<name>:<id>`. The owner's reaction to a
buzzing phone is a bark the scenario maps to `mfa_prompt_sent:<npcId>`.

All server and author text is set with `textContent`. The three new scenes use pixel fonts and
2px borders, close with X only, and go on every JS test harness copy list with `mfa-client.js`.

### 5.4 Determinism

No random draw is added. Owner approval is a threshold on a server count. The number to match,
its two decoys and their order come from one HMAC over ids and a per-account counter. Code
digits depend on server time and a server key, and decide nothing but equality.

### 5.5 Defaults this plan settles

| Point | Default | Why |
|---|---|---|
| A wrong code and the lockout | Counts on the same counter as a wrong password, plus the fixed cap of five per attempt | One rule to teach; the cap holds where a policy sets no `maxAttempts` |
| How a careless owner decides | A fixed count (`promptPatience`, default 3), never a chance | Runs repeat, and it is easy to author |
| Presets for the new habit | Low `pestered`; medium, high and no level `never` | Only clearly careless staff give in; an author sets `pestered` with a higher patience for a middling one |
| Fatigue across attempts | The count carries across attempts and PCs and resets on approval | The owner is one person with one phone; a per-attempt count would make the request cap decide instead of the habit |
| Old password after a reset | Stops working | It is what a reset is. The player always holds the new one, so it cannot strand them |
| Lockouts after a password reset | Cleared for that account at every PC | Otherwise a reset is useless at the PC that prompted it |
| Where a re-enrolled second step goes | The player's own phone, with no phone item needed | The desk enrols the caller's phone; an item would add an authoring step and nothing to learn |
| Unlocking the player's own locked screen | Password only | The session is already open; asking again could lock a player out of a PC they hold |
| A code device's read code | Carried back to the code pane, not submitted | Retyping six digits across a screen swap tests memory, not judgement |

## 6. Server routes

All under `/games/:id`, in `GamesController`. Each action name goes on the `set_game` list
(`games_controller.rb:27-29`) and gets its own `GamePolicy` method delegating to `show?`, as
`login?` and `friendface_phone?` do (`app/policies/break_escape/game_policy.rb:85`, `:121`):
`mfa_device?`, `mfa_verify?`, `mfa_prompt?`, `mfa_phone?`, `mfa_approve?`, `helpdesk_request?`.
"Locked" means inside `with_game_lock` (`games_controller.rb:2890`). Status codes follow the
existing rule: 404 unknown thing, 403 out of reach, 422 a refusal the player caused. Every
answer is `Cache-Control: no-store`. The generic refusal is the existing `Sign in required` body.

`POST /login` and the keyring sign-in keep their parameters. Their one new answer, when a second
step is due (locked, as today): status 200, `{ success: false, mfaRequired: true, mfa: "<kind>",
pcId, number?, ownPhone? }`. `number` is present only for `push_number_match`; `ownPhone` only
for a re-enrolled account. No session exists yet.

"Route still holds" below is `second_step_refusal` (section 5.2); it answers as the first step
would. "Lockout" is the account's `login_lockout_key` (422 `lockedOut`).

| Route | Params | Checks in order | Writes and answer |
|---|---|---|---|
| `GET /mfa/device` | `item_id`, or `npc_id` for a re-enrolled account | A policy declares an `mfa` kind (else 404). `item_id`: `held_code_device` holds for that item (else 403 `no such device`, the same body whether the item is unknown, not held, forged or another type). `npc_id`: `accountResets[npc].mfa` (else the same 403) | No write. `{ deviceId, displayName, code, secondsLeft }` |
| `POST /mfa/verify` (locked) | `pc_id`, `code` | PC found (404). Pending record for the PC, kind `code`, live (else generic 422). Route still holds. Lockout. `code` is six digits (else generic 422, not counted). Equals a code of the two windows before the accepted pair: 422 `codeExpired: true`, not counted. Window already used for this account, or not the current or previous window's code: wrong | Wrong: `tries += 1`; `record_login_failure!`; answer as a wrong password plus `mfaIncorrect: true`; at `MAX_CODE_TRIES` the record is dropped and the answer adds `expired: true`. Right: `mfaAccounts[npc].used` set, failures cleared, record dropped, session written, the normal sign-in answer |
| `POST /mfa/prompt` (locked) | `pc_id` | PC found. Pending record, push kind, live (else generic 422). Route still holds. Lockout. Gap since `last` (else 422 `tooSoon: true, retryAfterS`). `n < MAX_PROMPTS` (else record dropped, 422 `expired: true`) | Counts, then the decision in 5.2. Not approved: `{ success: false, approved: false, promptsSent, waiting? }`. Approved: `mfaPrompts[npc] = 0`, record dropped, session written, the normal sign-in answer plus `approvedBy: "owner"` |
| `GET /mfa/phone` | `npc_id` (that NPC's held phone), or `own=1` (the player's own) | `npc_id`: `held_friendface_phone(npc_id)` (else 403 `no such phone`). `own`: at least one account has `accountResets[...].mfa` (else the same 403) | No write. `{ requests: [{ pcId, host, username, n, numbers? }] }`: live push records for that owner's account, or for every re-enrolled account; at most one per PC. `numbers` is the three choices from `MfaModel.numbers`, in its order, none marked |
| `POST /mfa/approve` (locked) | `pc_id`, `number?`, `deny?` | PC found. Pending record, push kind, live (else generic 422). Phone held for the pending account, or account re-enrolled (else 403). Route still holds. `deny`, or a wrong or missing `number` for number matching: record dropped, `{ success: false, cancelled: true }` | Right: record dropped, `mfaPrompts[npc] = 0`, session written, the normal sign-in answer plus `approvedBy: "player"` |
| `POST /helpdesk/request` (locked, S8b) | `desk_id`, `username`, `what`, `answers` (map of question id to text; body refused over 4 KB before parsing; each answer cut to 64 code points) | The checks in 5.2. Desk unknown: 404. NPC not met or knocked out, `what` not offered: generic 422. Stopped serving: 422 `blocked: true`. Unknown username or rule not met: tries counted, 422 `refused: true, triesLeft` | Grant: `accountResets` written; for `password`, lockouts cleared. `{ granted: true, what, password?, lockoutPcIds? }`. A repeat of a granted request answers the same body again, so a lost answer can be retried |

A refused second step never says more than the first step already did: the `mfaRequired` answer
itself tells the player the password was right, as a real second prompt does.

## 7. What reaches the browser, and what never does

**The general rule: a policy's kind is public, its answers are not.** `policies` and
`defaultPolicy` ship in the bootstrap as authored, and three client modules read them (section
2.1). So `policies.<name>.mfa` reaches the browser at load with the rest of each policy, and a
player who reads the scenario data can see which PCs ask for a second step and of which kind
before typing anything. That is treated as public on purpose: it is what an organisation's
sign-in page or its published IT policy tells any visitor, it grants nothing, and in play the
sign-in screen still shows the second pane only when the server asks for it. Stripping the
field would mean a second, filtered copy of every policy for three readers and would protect
nothing a player could use. The same rule covers any other plan that adds a field to a policy:
the field may say what kind of check a PC makes; whatever satisfies the check stays on the
server until earned.

| Thing | Sent | Withheld |
|---|---|---|
| `policies.*.mfa` | In the bootstrap, as authored. Also in the `mfaRequired` answer for the PC being signed in to | Nothing; it is not a secret |
| Which accounts are enrolled (`creds.mfa`) | Never. `creds` is deleted from every NPC (`game.rb:7376`). The player learns an account is exempt by signing in with it | The whole field |
| A code | Only in `GET /mfa/device`, only while the device is held (or the account re-enrolled) | Not in the bootstrap, the item, the inventory answer, or any sign-in answer |
| The number to match | In the `mfaRequired` answer (the player's own sign-in screen) and, among three choices, in `GET /mfa/phone` to a player holding the phone | Never marked as the right one on the phone |
| `habits.approvesPrompts`, `promptPatience`, `awareness`, the `mfaPrompts` counts | Never. The client learns only `approved` true or false per request, and `promptsSent` for its own attempt | All of it |
| `creds.recovery`, `creds.resetPassword` | `resetPassword` once, in the granting answer and then as the keyring entry's secret | The `recovery` map is never sent, and a refusal does not say which answers were right. The facts themselves are in the world by design (a feed post, a document, a line of dialogue) and reach the browser when those do |
| `helpdesks` | `questionLabels`, `resets` and the desk's NPC id, as `helpdeskForms` in the bootstrap, only when a desk exists | `verify`, `needs`, `maxTries`, the `questions` ids |
| `code_device` item | Type, id, name, `owner` (an NPC id, as a phone carries) | Nothing secret is on the item |
| `mfaPending`, `mfaAccounts`, `accountResets`, `helpdeskTries` | Never | All of it |

**What the server hard-enforces, and what is best-effort.** Hard: a code is served only against
a held, authored, unforged device; the device leaves its owner only on a story offer or a
knock-out record; an approval needs the held phone or a re-enrolment; a helpdesk grant under
`questions` or `callback`; the reset password. Best-effort, as the cheat policy allows for
combat and dialogue: the knock-out record is the browser's claim (accepted only for a met,
non-`koImmune` room NPC), so a forged one yields that NPC's device or phone, as it already does
for a phone; and a helpdesk request can be posted without standing in the conversation. An
author who needs a device to be won in conversation sets `koImmune` on its owner; the validator
says so (section 9).

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
| `mfaPrompts` | `{ npcId => count }` | One integer per account | Never |
| `mfaAccounts` | `{ npcId => { 'started' => n, 'used' => window } }` | Two integers per account | Never |
| `accountResets` | `{ npcId => { 'password'?, 'mfa'? } }` | One per account | Never; the keyring answer lists the new entry through its existing `rev` digest, so an unchanged keyring is not re-sent |
| `helpdeskTries` | `{ "deskId\|username" => n }`, username normalised and at most 64 code points | Account keys bounded by authoring; non-account keys capped at 200, oldest dropped, as `loginFailures` does (`game.rb:4357-4364`) | Never; `triesLeft` rides on the refusal |

Nothing is added to synced client state, and no existing synced value grows. `MfaClient` holds
the pending kind, number and last read code in memory only. **Reload:** memory is lost, so the
sign-in screen opens on the password pane and the next password step overwrites the pending
record; `mfaPrompts`, `mfaAccounts`, `accountResets` and `helpdeskTries` persist, and cleared
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

**Validator.** New `scripts/validate_mfa.rb`, called from `validate_scenario.rb` beside the
habits check, reading `MfaModel` and `HelpdeskModel`. `scripts/validate_npc_habits.rb` gains the
two habit keys and the per-parameter check.

Errors: unknown `mfa` value; kind `code` on a policy whose PCs admit an enrolled account with no
`code_device`; two code devices for one owner; a `code_device` with no `owner`, or an owner that
is not an account; push kind where an admitted enrolled account's NPC has `phone: false`;
`approvesPrompts` or `promptPatience` invalid or on a non-room NPC; a helpdesk `npc` that is not a
room NPC or serves two desks; a `questions` id missing from any account's `recovery` that the desk
could be asked about; `needs` above the number of questions; `resets` naming `password` when no
account has `resetPassword`; a `resetPassword` value that appears in any ink (the rule
`creds.password` already has); `resetPassword` equal to the account's `password`; a pretext ask
naming a `helpdesk` that does not exist.

Warnings:

- every account at an MFA PC is exempt (the policy does nothing);
- a `code_device` in the `itemsHeld` of an NPC whose story offers no give of it and who is
  `koImmune`: the player has no way to get it. The offer test is `AccessWork.offers_item_text?`,
  the one the server's gate uses;
- a `code_device` held by an owner whose story does offer it and who is not `koImmune`: a note
  that a knock-out also yields it, and that `koImmune` closes that;
- push kind where every admitted owner resolves to `never` and holds no declared phone, and no
  other way through exists;
- `promptPatience` set on an NPC whose habit does not resolve to `pestered`;
- `verify: "questions"` where an answer appears in no readable text, feed post, document or ink
  line the player can reach (the reachability walk `npc_habits/clues.rb` does for password
  clues);
- `verify: "callback"` where the owner declares no phone item.

Information lines: per MFA PC, the kind and each admitted account's ways through or round the
second step. Round it: a session token for that PC, a help invite, a helpdesk that resets `mfa`,
a technique that grants a session on that host, and an owner whose open screen can be claimed.
The last is the cheapest way past a second step in any scenario that has one, so it is listed by
name.

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`). In scope for M1b and H1, not deferred:
a sign-in lock under an MFA policy gets a second key edge per admitted account: the `code_device`
item (code), the owner's phone item or the label "owner approves (pestered)" (push), the phone
item only (number matching). A helpdesk grant is a key source for the account's sign-in, with the
readable homes of its answers as its own requirements. `scripts/lock_key_diff.rb` output for a
scenario without the fields is unchanged. Tests: `test/js/dungeon-graph-mfa.test.mjs`.

## 10. Effect on existing scenarios

| Change | Effect when the new fields are absent |
|---|---|
| `attempt_login!` and `attempt_credential_login!` call `mfa_step_for` | Returns `none`: same path, same answer, same state writes |
| Route branch moved to `typed_route_refusal`; steps 2 to 8b moved to `credential_login_checks`; key built by `login_lockout_key` | Pure moves: same checks in the same order with the same answers and the same key string |
| `KINDS` gains an `mfa` flag | Read only when a policy sets `mfa` |
| `OWNER_BOUND_TYPES` replaces the phone-type test at three sites | A phone is judged as today. No existing scenario has a `code_device`, so nothing else is caught |
| `NpcHabits`: two accepted keys, per-parameter check; `PRESETS` untouched | `expand!` writes exactly what it writes today for every NPC that authors neither key. The preset for the new habit is never written; it is read at request time |
| `effective_password` | Returns `creds.password` unless `accountResets` names the account |
| `authenticator` scene: phone shell moved into `_buildPhoneShell()` | Same DOM. Every other path of the scene is unedited; the live scene is a separate registered name no existing scenario uses |
| `PcSessions`: `mfaRequired` test before the `success === false` test | An answer without `mfaRequired` takes today's path |
| Bootstrap `helpdeskForms` | Added only when a desk exists |
| Five `ACCESS_STATE_DEFAULTS` keys | Empty maps in every game; never sent |

Proof:

1. `test/controllers/break_escape/mfa_absent_test.rb` runs the existing sign-in and keyring
   controller cases against their fixtures and asserts byte-equal answers and that the five new
   keys stay empty.
2. The habits fixtures and tests pass unedited:
   `test/fixtures/format_8c/test_access_habits.old.loaded.json`, `test/unit/npc_habits_test.rb`
   and `test/models/break_escape/npc_habits_loader_test.rb`. A new case asserts that the saved
   scenario of `test_access_habits` after `expand!` is byte-equal to a copy stored before this
   feature.
3. A fixture test that the bootstrap of `test_access_signin`, `test_access_keyring` and
   `ca03_helpdesk_reset` equals a stored copy. `ca03_helpdesk_reset` has no `helpdesks` and no
   `helpdesk` on its ask, so its grant stays the client global it is today
   (`scenarios/ca03_helpdesk_reset/scenario.json.erb:760-772`).
4. The validator over every scenario shows no new error or warning line.
5. The authenticator is unchanged for its six users: the existing `authenticator` node tests and
   the episode-runner tests pass unedited; a new node test builds the scene with each of the six
   scenarios' authored params (`ca06_texts_and_qr`, `ca06_texts_and_qr_defend`,
   `ca09_passwords`, `ca09_passwords_defend`, `ca_pre_general_v2_ab`, `ca_post_general_v2_ba`)
   and asserts the container's HTML equals a snapshot taken before the shell was moved; and
   scripted reruns of `ca06_texts_and_qr` and `ca09_passwords` reach and finish the scene.
6. Controller cases for the existing phone rule (offer, no offer, knock-out, stored drop,
   sourceless room add) pass unedited after the type list replaces the type test.
7. Scripted reruns of `test_access_signin`, `test_access_keyring` and `test_access_habits`.

## 11. Tests

**Unit** (`test/unit/`): `mfa_model_test.rb` (kinds, enrolment, device lookup, code for a fixed
time and key, previous window accepted, the one before answered as expired, generation changes
the code, `numbers` gives three different values in a fixed order for fixed inputs,
`prompt_habit` per level and with an authored value, `prompt_patience` bounds);
`npc_habits_test` additions (the two keys validate, `promptPatience` bounds, expansion of an NPC
without them unchanged); `helpdesk_model_test.rb` (normalising, `needs`, code point caps).

**Controller** (`test/controllers/break_escape/`): `mfa_code_test.rb`, `mfa_device_gate_test.rb`,
`mfa_push_test.rb`, `mfa_phone_test.rb`, `mfa_keyring_test.rb`, `helpdesk_request_test.rb`,
`mfa_absent_test.rb`, and per-role access cases for each of the six policy methods.

- *Device gate:* an inventory add of a `code_device` from an owner who has been met but offers
  nothing is refused; accepted when the story offers it; accepted after a knock-out record;
  refused for a `koImmune` owner with a forged knock-out; a stored drop naming the owner is
  refused on pickup without offer or knock-out; a room add of a `code_device` with no source is
  refused; a client-built item with `owner` is refused; a device in a container is collected
  under the container's own rule.
- *Code:* device route refused without the item, with a forged item, with another type's id;
  another owner's device gives a code that fails; verify with no pending record; a right code
  opens the session; the same code is refused at a second PC; five wrong codes drop the record
  with no `maxAttempts`; wrong codes reach the policy lockout and a right code is then refused;
  a code two windows old answers `codeExpired` and counts nowhere; exempt account skips the
  step; unlocking the account's own locked session asks no second step, another account at
  that PC does.
- *Route re-judge:* typed sign-in over a foothold, then the foothold unplugged, then verify:
  refused as the first step would be. The account removed from the access list between steps:
  refused. Saved connection: pending, then the proving device dropped, then verify: refused;
  with the proof intact the session is `via: credential` and the answer carries `route`.
- *Push:* `pestered` approves on exactly the patience count and the count survives a new
  attempt; requests caught on a held phone do not raise the count; `never` at `MAX_PROMPTS`;
  number match never approved by an owner; a knocked-out owner approves nothing; `tooSoon`.
- *Phone:* approve refused without the phone; the three numbers are stable for one attempt and
  differ for the next; wrong number cancels; deny cancels; own-phone list refused with no
  re-enrolled account.
- *Ways round:* token skips, saved connection does not; claim skips.
- *Helpdesk:* unknown user and wrong answers give the same body; `maxTries`; retry of a granted
  request; old password refused and reset password accepted; an account locked out at two PCs
  is unlocked at both by a password grant and `lockoutPcIds` shrinks; a second-factor grant
  leaves lockouts alone; desk NPC not met refused; hostile text in `answers` and `username`
  (long, HTML, control characters) is cut and cleaned before any use, echoed in no answer, and
  never stored beyond the normalised 64 code point key.

**JS** (`test/js/`): `pc-sessions-mfa.test.mjs` (`mfaRequired` is not an error;
`completeSecondStep` writes the mirror, drops ended sessions and emits `pc_signed_in`),
`mfa-signin-pane.test.mjs` (pane swap, no reject sound, `teachAfter` only after the second
step, reopened instance resumes from `MfaClient`, completed session accepted on reopen),
`mfa-child-handover.test.mjs` (against the real minigame manager: the sign-in screen suspends,
the child ends by X, the screen reopens; both child scenes), `code-device.test.mjs`,
`authenticator-live.test.mjs`, the authenticator snapshot test of section 10, the existing
authenticator and episode-runner tests unedited, `helpdesk-request.test.mjs`,
`validator-mfa.test.mjs`, `dungeon-graph-mfa.test.mjs`.

**Feature scenario** `scenarios/test_ops_mfa/`: three rooms, six accounts, one foothold.

| Beat | What happens | Server record afterwards |
|---|---|---|
| F1 | Right password at a `code` PC | No session; `mfaPending` has the PC |
| F2 | Device route before holding the device; a crafted inventory add of the met owner's device | 403; add refused; no code in any captured answer so far |
| F3 | Owner hands the device over; "Use device" on the code pane; Verify | Session `via: password`; pending gone; `mfaAccounts.used` set |
| F4 | Same code typed at a second `code` PC within the minute | Refused; a fresh code after the window turns is accepted |
| F5 | Drop the device in the room; ask the device route again | 403 |
| F6 | Second owner's device found in a drawer; exempt service account at the same PC | Session after the code; exempt session with no second step |
| F7 | Lock the F3 session, then unlock with the password, device no longer held | Session unlocked; no pending record |
| F8 | Sign in to the `code` PC over the foothold; unplug the foothold; type a right code | Refused as out of reach; no session |
| F9 | `push` PC, low-awareness owner, three requests | Approved on the third; `mfaPrompts` back to 0 |
| F10 | `push` PC, high-awareness owner, requests to the cap | Never approved; attempt expired |
| F11 | Take the high-awareness owner's phone; "Check phone" on the pane; approve | Session; `approvedBy: player`; the pane's screen reopens signed in |
| F12 | Start a push sign-in, close the screen, open the held phone from the inventory, approve | Session; the browser's mirror shows it; toast |
| F13 | Number matching, owner holds phone | Never approved |
| F14 | Number matching with the held phone, wrong then right number | Cancelled, then session |
| F15 | Session token to an MFA PC; saved connection to it | Token session at once; saved connection stops at the step, then signs in `via: credential` |
| F16 | Guess an account's password to the lockout; helpdesk, wrong answers to `maxTries` for another account | `loginLockouts` has the key; `helpdeskTries` at the cap; `blocked` |
| F17 | Helpdesk, right answers found on a feed post and a document, for the locked account | `accountResets` password; lockout gone; keyring lists the entry; old password refused; sign-in at the once-locked PC |
| F18 | Helpdesk re-enrols a second factor (callback rule, phone held); "My phone" on the code pane | Old device's code refused; own-phone code accepted |

**Scripted playtest** through `window.__test`, each beat checked twice: what the browser was sent
(captured answers scanned for codes, the `recovery` map and passwords not yet earned) and what
the server recorded (the column above, read by the verify script). Codes are read from the
device route, so the run does not depend on the clock; F4's wait for the window is the one
place it reads the route's `secondsLeft`.

**Live proof** on the real client path with a keyless server on the builder's own port, a game
made in that run: F1 to F3, F8, F9, F11, F12, F14 and F17, by clicks and typed input, with
screenshots of the code pane, the device as a child of the sign-in screen, the phone, the
reopened sign-in screen and the request form, plus a reload in the middle of F9.

## 12. Build steps and shared files

Order: M1a, M1b, M2, M3, M4, then H1, H2. Each stage: model and unit tests, server and
controller tests, client and JS tests, validator, schema and graph, the scenario beats, scripted
run, live proof, then the two docs (`README_scenario_design.md` feature index rows A22 and A23,
and `docs/ACCESS_AND_NETWORKS.md`) in the same change as the stage that completes the feature.
M1a has no client, so its proof is its controller tests; the first live proof is M1b's.

New files: `lib/break_escape/mfa_model.rb`, `helpdesk_model.rb`;
`app/models/break_escape/mfa_access.rb`, `helpdesk_access.rb`; `scripts/validate_mfa.rb`;
`public/break_escape/js/minigames/code-device/`, `authenticator/authenticator-live-minigame.js`,
`helpdesk-request/`; `systems/mfa-client.js`; their CSS; the tests above; `scenarios/test_ops_mfa/`.

Shared files (re-read just before editing, own block only, explicit paths):

| File | This plan's edit | Also touched by |
|---|---|---|
| `app/models/break_escape/game.rb` | `attempt_login!` step 5, `typed_route_refusal`, `login_lockout_key`, `effective_password`, the sourceless room-add test (`:1171`), five state keys | S5a, S5c (sign-in order, lockout scope), S3 (sessions) |
| `credential_login.rb`, `credential_model.rb` | `credential_login_checks` factored out, the step before the session write; `mfa` flag on kinds | S5b, S7 (keyring), S5c (account kind on the keyring path) |
| `credential_keyring.rb` | implicit `<npcId>.reset` entry | S5b, S7 |
| `games_controller.rb`, `config/routes.rb`, `game_policy.rb` | six routes, `set_game` list, six policy methods, the two NPC-item gate sites (`:3443`, `:3470`) | every plan |
| `lib/break_escape/npc_habits.rb`, `scripts/validate_npc_habits.rb` | two accepted keys, per-parameter check | S7 (reads `password` habit) |
| `scripts/scenario-schema.json`, `validate_scenario.rb`, `generate_dungeon_graph.rb` | blocks named in section 9 | every plan |
| `minigames/password/password-minigame.js`, `systems/pc-sessions.js` | second pane, child hand-over, resume on reopen; `mfaRequired` handling, `completeSecondStep` | S5c if it changes the sign-in screen |
| `minigames/authenticator/authenticator-minigame.js` | `_buildPhoneShell()` extracted, nothing else | none |
| `systems/pretext-judge.js` | open the request form on a granted ask that names a desk | none |
| `minigames/index.js`, `minigame-starters.js`, JS harness copy lists | three scenes, `mfa-client.js` | S6, S7 |

## 13. Log rows this feature writes (for S9)

Columns as the log plan sets them: event, who, where, when, with optional result and detail.
"Who" is the account's NPC id and username. Detail values are short codes, never free text.

| Event | Who | Where | When | Result | Detail |
|---|---|---|---|---|---|
| `mfa_challenge` | account | PC id | A right first step meets a second step | | route code: `keyboard`, `foothold`, `from`, `credential` |
| `mfa_code` | account | PC id | `POST /mfa/verify` | `ok`, `wrong`, `expired` | |
| `mfa_prompt_sent` | account | PC id | Each `POST /mfa/prompt` | | request number |
| `mfa_prompt_approved` | account | PC id | Approval by either path | | `by`: `owner`, `held_phone`, `own_phone` |
| `mfa_prompt_denied` | account | PC id | Deny or wrong number on a phone | | |
| `mfa_expired` | account | PC id | Request cap or code cap reached | | `prompts` or `codes` |
| `helpdesk_request` | account asked about (none for an unknown username) | desk id | `POST /helpdesk/request` | `granted`, `refused`, `blocked` | `what`; desk NPC id |
| `account_password_reset`, `account_mfa_reenrolled` | account | desk id | A grant | | desk NPC id |

No row carries a code, a number to match, an answer, a password, or a typed username that is not
an account. A run of `mfa_prompt_sent` rows for one account in a short time is the trace a
defender would look for; up to 20 can be written per attempt, two seconds apart.

## 14. Cross-plan requests

1. **Sign-in order (S5a, S5c, S8), as agreed.** In `attempt_login!`: route, lockout, password
   match, PC admission (where the privilege plan's account-kind check sits), then the second
   step, then the session write at the level the account carries. This plan is written to that
   order (section 5.2).
2. **Account kind and the second step (S5c), as agreed.** Account kind does not change the
   second step. Every enrolled account meets the PC policy's `mfa`; `creds.mfa: false` is the
   only exception, and `MfaModel.enrolled?` reads nothing else.
3. **Lockout key (S5c).** This plan adds `login_lockout_key(pc, username)` and
   `login_lockout_keys_for(npc)` and calls them everywhere it touches a lockout (wrong codes,
   the second-step routes, the helpdesk's unlock). If the privilege plan scopes a domain
   account's lockout differently, it should change those two helpers and nothing in this plan
   needs to move. Whichever plan builds first adds the helpers.
4. **Keyring path (S5c, S5b, S7).** `credential_login_checks` becomes the one copy of steps 2
   to 8b of the keyring sign-in. Any account-kind check on that path belongs in it, so the
   second-step re-judge picks it up.
5. **Technique cards (S3).** A session granted by a technique card runs no sign-in checks, so
   it meets no second step. This plan relies on that and the core plan states it. A technique
   that yields a password, or a saved connection, puts a credential in the keyring, and using
   that credential does meet the step.
6. **Recovered passwords (S5b, S7).** A harvested or cracked password is used through the
   ordinary typed or keyring sign-in and meets the second step. Neither plan should start a
   session directly from a recovered password.
7. **Policy fields in the browser (S5a, S5c, any plan adding a policy field).** `policies` ship
   in the bootstrap as authored. The rule this plan follows, and asks the others to state for
   their own fields: a policy's kind is public, its answers are not.
8. **Log rows (S9).** The helper must accept a row written before any session exists (every row
   in section 13 up to the approval) and the detail codes listed there. S9 to say whether a run
   of `mfa_prompt_sent` rows should be stored as one row with a count.
9. **Hosts (S1).** A host with no sign-in has no policy and so no second step. A headless
   sign-in host is covered, since the pending record stores the route.
10. **Feature scenario names.** `test_ops_mfa` covers S8b too; no `test_ops_helpdesk` is asked
    for.

## 15. Open questions for the user

Each has a recommended answer, and the plan is written to it. Points with an obvious default
are settled in section 5.5.

1. **What clock does the code run on?** The server has no game clock, and the ops plans differ
   on time: most use none, the log plan stamps rows with the game time the browser reports, and
   this plan would use the server's real time for the code window, the one place it depends on
   real time at all.
   (a) Server real time: a new code every 60 real seconds, the previous one still accepted. It
   looks and behaves like the device people carry, and teaches that a code is short-lived.
   (b) No clock: the device shows a code bound to the sign-in attempt in progress, like a code
   sent by text message. It needs no time at all, is single use by construction and cannot be
   read in advance, but it teaches nothing about time-based codes and the device shows nothing
   until a sign-in is waiting.
   (c) Build a server game clock first and tick the code on game minutes.
   *Recommend (a).* The server already uses real time for token expiry, a stale code costs the
   player nothing (it is answered as expired, not wrong), and scripted runs read the code from
   the device so they do not depend on the clock. (b) is the fallback if the user wants no real
   time anywhere in the ops layer.
2. **Should a careful owner react to being pestered** (report it, lock the account, warn the
   desk)? (a) Not now: only the log rows are written. (b) A scenario-set reaction after N
   requests. *Recommend (a);* reactions belong with the parked defence work, and the event
   `mfa_prompt_sent:<npcId>` already lets a scenario voice a bark.
3. **Can the player talk an owner into reading out a code or tapping a number?** The pretext
   judge runs in the browser, so the server could not check it. (a) No: holding the device or
   the phone is the route. (b) Yes, best-effort, as a dialogue-gated step with a sanity check
   (owner met, not knocked out). *Recommend (a)* for S8a, since a code is a credential and the
   policy is to hard-enforce those; (b) could return with a server-checked pretext route.
4. **Borrowing: can the player give a device or phone back, and does the owner notice it is
   gone?** Today nothing hands an item from the player to an NPC; the player can only drop it
   in a room, after which the device route refuses (beat F5). (a) No engine rule: "borrowed"
   means the owner's story lends it, and putting it back is a drop. (b) Add an ink tag that
   returns an owner-bound item to its owner, so a scenario can script "hand it back before she
   notices". (c) As (b), plus the owner noticing after a set time. *Recommend (a) now and (b)
   as a small follow-up* if the first scenarios want it; (c) belongs with the defence work.
5. **Does the real owner react to being reset** (cannot sign in, grows frustrated, rings the
   desk)? (a) Not now. (b) The owner's next sign-in at their own PC fails and feeds the
   existing frustration model. *Recommend (a),* for the same reason as question 2.
6. **Is S8b worth a typed form?** (a) A typed form: the player types the answers they found,
   and the server checks them. (b) Choices picked in dialogue: easier to play, but the right
   answer is on screen among a few and can be found by trying within `maxTries`. *Recommend
   (a):* typing is what makes finding the facts matter.
