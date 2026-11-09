# Access model: identities, roles, logins, policy and networks

Status: **design, decided 2026-11-09** (user's choices from the options page, plus orchestrator
decisions listed in section 2 that the user can overrule). Nothing here is built yet.
Background: CyberCIEGE (Irvine, Thompson and Allen, NPS) and its layered model of access, adapted to
Break Escape's physical, puzzle-led play. First slice: section 10.

## 1. Why

Today access is decided lock by lock: hold the item whose id matches `requires`, know the secret, or
have a global set. A PC is either a password box styled as a desktop or a full SecGen VM. Nothing in
between models **who** someone is or **what they may do**.

This plan adds a middle tier without VMs:

- NPCs have a **role** and their own **sign-in details** (username, password, card).
- Locks and PCs carry an **access list (ACL)**: which roles and which people may pass.
- A set of sign-in details is evidence of an identity, so a copied or captured one gives the player **exactly
  its owner's access**.
- PCs show a **login prompt**; contents come from **profiles** (a shared staff desktop, Jake's own
  files) that follow the account to any PC it logs into.
- **Policies** (auto lock, attempt limits, USB, social media) apply to PCs by name.
- NPC **awareness** (a preset plus overrides) sets the habits that give access away.
- **Work resources** and a **social media** need make access matter to NPCs, and their workarounds give
  the player openings.
- **Networks** decide what can be reached at all.

### Lessons taken from CyberCIEGE

| CyberCIEGE | Here |
|---|---|
| Access is layered: physical zones, accounts, network, procedures | Doors (ACL), PC logins (ACL plus profiles), networks, policy and habits |
| Users need specific assets to be productive; denying access costs productivity | `workNeeds`: missing access raises frustration, which triggers insecure workarounds |
| Unhappy users become an insider risk | Frustration workarounds and the existing social engineering influence model |
| Hand-written scenario language was too heavy; they built a forms tool | Small schema with defaults, ACLs on the thing protected, validator checks from day one |
| Weak assessment record | Events for logins, sessions and workarounds, ready for logs and Hacktivity later |

Not taken: probabilistic resolution of outcomes (puzzles stay deterministic, section 9) and a budget loop
(defender missions are in the backlog).

## 2. Decisions

User decisions (2026-11-09):

| Area | Decision |
|---|---|
| Structure | **ACLs.** Role and sign-in details live on the NPC. Each lock, PC, profile or resource lists the roles and people it admits. No central grants table. |
| Doors | An RFID door accepts specific cards (`requires`, as now) **or** roles/people (`access`), or both. |
| Sign-in details | Cards resolve to their owner, so copies work too. Passwords captured any way work at any PC that account may use. Unlocked sessions give the owner's access. Legacy `requires` keeps working. |
| Awareness | Preset (`low`, `medium`, `high`) plus per-habit overrides. It expands into the existing social engineering blocks rather than running alongside them. |
| Habits | Locks screen, password strength (guessable from public posts), sticky note, password reuse, holds doors, falls for phishing or pretext calls, challenges strangers. |
| Workstations | `needsHome` is the preferred station. PC contents depend on who is logged in. |
| Policy | Named policies referenced by PCs: auto lock, attempt limit, USB blocked, social media blocked. |
| Work | Abstract resources plus physical objects. Work requirements by role. Frustration, workarounds and outages. |
| Social media | `social` need; phone or PC (if policy allows); posts appear in a readable feed and can reveal facts; blocking raises frustration. |
| Networks | Named networks with membership, Wi-Fi with a key, network jacks. |
| Determinism | Seeded rolls (the existing `NPCNeedsSystem.roll`). |
| Tooling | Validator: references exist, NPCs can reach their work, identities that skip locks are flagged. Identities appear in the dungeon graph. Player missions first. |
| Taking files | The player chooses Copy or Move in a desktop-themed dialog; items can restrict it. |
| Login prompt | Portrait account picker by default; showing only known people, or typing the username, is optional per PC. |
| `staff` role | Every NPC with creds has it implicitly. |
| Content release | A login PC's contents are sent only after a correct password, except unlocked-session claims, honoured only where the scenario makes one possible. |
| Backlog | Defender and investigator mission types, SecGen export (`docs/IDEAS_BACKLOG.md`). |

Orchestrator decisions (the user can overrule):

| Area | Decision |
|---|---|
| Copied cards | A copy counts toward an ACL door only if the **server recorded the copy** (section 4.3) or the card is a keycard item the server holds. The card copier's client-written `saved_cards` list never decides identity. |
| Account tiles | The default account picker is engineering, not an authoring choice: the server composes the tiles for each login PC (section 5.3). |

## 3. Identities and sign-in details on the NPC

```jsonc
{
  "id": "jake",
  "displayName": "Jake Brooks",
  "role": "finance",                    // or ["finance", "staff"]; free strings
  "creds": {
    "username": "jbrooks",
    "password": "Biscuit2019",          // never leaves the server (section 5.6)
    "card": { "card_id": "4F00A1C2", "rfid_protocol": "EM4100" }
  },
  "awareness": "low",
  "habits": { "writesDown": true },     // overrides of the preset, section 6
  "needsHome": "jake_pc"
}
```

- `role` is a string or an array. Every NPC with `creds` implicitly also has the role `staff` unless
  `"staff": false` is set, so "all staff" ACLs need no extra typing.
- `creds.card` replaces `rfidCard`. The loader treats an existing `rfidCard` as `creds.card`. The
  client still receives an `rfidCard` on the NPC (card id and protocol only, derived on the server), so
  `clone_keycard` and the RFID minigame keep working unchanged.
- **Identity resolution.** A card or login maps to an identity by value: a card by `card_id`, a login by
  `username`. Nothing on the item needs to name its owner, so a copy (same `card_id`) carries the same
  identity as the original. A keycard item may still say `"identity": "jake"` for readability; the
  validator checks it agrees with the `card_id`.
- The player has no identity of their own. They act as whoever's sign-in details or session they use.
- One home for a password. `creds.password` is the only place an account password is authored. For an
  NPC with `creds`, a capture beat's `usePayload.address` and `usePayload.secret` are filled from
  `creds.username` and `creds.password` by the loader, and the validator errors if the author writes a
  `usePayload.secret` that differs. A capture view and a login prompt therefore cannot disagree.

## 4. ACLs on locks

One field, `access`, wherever a lock can stand:

```jsonc
"access": { "roles": ["finance", "it"], "people": ["dana"] }
```

A card or login passes if its identity's roles intersect `roles`, or its identity is in `people`.

### 4.1 Doors (RFID)

```jsonc
// rooms.finance_office
{ "locked": true, "lockType": "rfid",
  "requires": ["VISITOR-07"],                 // specific cards, as today (optional)
  "access": { "roles": ["finance"] } }        // plus anyone whose card resolves to finance
```

Unlock rule: a card's id is in `requires`, **or** its identity passes `access`. At least one of the two
fields is required (validator error otherwise). A door with `requires` only behaves exactly as today.

**Client.** `evaluateRfidCredential` and `playerHoldsRfidCredentialFor` (`unlock-system.js:69-94`, the
branch at `:502-593`) currently match held cards against `requires` alone, so an `access`-only door
would refuse with "Requires RFID keycard". For a door with `access`, the client offers **every held
`card_id`** (keycards in inventory, and the card copier's `saved_cards`) in one unlock request and drives its
UI from the server's answer: unlocked, or access denied. It does not try to resolve cards to roles
itself, because the admitted NPC may be in a room it has not loaded.

**Server.** `validate_unlock` (`game.rb:1107`) receives the list. For an `access` door each `card_id`
is checked in this order, and the first that passes unlocks:

1. it is held: a keycard item in the server's inventory whose scenario definition carries that
   `card_id`, or a card recorded by a server-recorded copy (4.3);
2. it is in `requires`, or it equals some NPC's `creds.card.card_id` whose identity passes `access`.

Doors with `requires` only keep today's behaviour (trusted from the client), so existing missions are
untouched.

### 4.2 Other lock types

`access` is defined generically, but only `rfid` (doors and objects) and the new `login` (section 5)
use it in the first slice. Keys, PINs and passwords stay as they are.

### 4.3 Server-recorded card copies

When the player copies a card, the client calls a new endpoint, `POST /clone_card` with `npc_id`
(both the `clone_keycard` ink action and the RFID minigame's copy step call it). The server records
`player_state.serverClones[card_id] = npc_id` only if all of these hold:

1. the NPC exists in the scenario and has `creds.card`;
2. the NPC is in `player_state.encounteredNPCs` (the player has met them);
3. the player's server-side inventory holds an `rfid_cloner`;
4. the NPC is not marked `"cloneable": false`.

That is all it checks. The server cannot see positions, so "in conversation range" is not tested; step 2
is the nearest fact it holds. It is a tightening, not a genuine identity check: a modified client can still call
the endpoint for any NPC it has met. A puzzle that must not be possible to get past should rest on a fact the
server established independently (a keycard item physically held, a capture earned), not on a copied card.
The card copier's `saved_cards` list stays client-written and drives only the copier's UI. `serverClones` is
cleared by a game reset.

## 5. PCs: logins, sessions and profiles

### 5.1 Profiles (roaming desktop contents)

Contents that belong to an account rather than a machine are declared once, at scenario level, under
`accountProfiles` (the name keeps it apart from the social-media browser's social `profiles`):

```jsonc
"accountProfiles": {
  "staff_desktop": {
    "for": { "roles": ["staff"] },
    "contents": [
      { "id": "staff_handbook", "type": "text_file", "name": "Staff handbook.pdf",
        "takeable": false, "text": "..." },
      { "id": "staff_mail_app", "type": "email_client", "name": "Mail", "takeable": false }
    ]
  },
  "jake_files": {
    "for": { "people": ["jake"] },
    "contents": [
      { "id": "jake_budget", "type": "text_file", "name": "Q3 budget.xlsx", "takeable": true, "text": "..." }
    ]
  }
}
```

- Logging in as X shows, in order: the PC's own `contents` (local files anyone logged in sees), then
  every profile whose `for` admits X (role profiles first, then personal ones, in declaration order).
- Profiles are keyed to the account, not the PC, so the same files appear on any PC Jake can log into.
- **Item ids.** Ids are global and every held-item filter and container lookup keys on them.
  `stamp_scenario_object_ids!` (`game.rb:3059`) is extended to walk `accountProfiles`, giving any
  profile item without an id one (`<profile>_content_<n>`), and `find_container_in_scenario` /
  `find_object_in_scenario` learn to find profile items. The validator errors on a profile item id
  shared with another profile item or a room object.
- **Taking files.** `takeable: false` items stay on the PC and open in place. Clicking a takeable
  digital file opens a small **desktop-themed dialog** in the PC's window chrome: **Open**, **Copy to
  inventory**, **Move to inventory**, **Cancel**. A scenario can restrict the choice per item
  (`"transfer": "copy" | "move" | "both"`, default `both`). This changes `container-minigame.js:454-456`,
  where a `text_file` always opens the viewer.
  - *Move*: as the engine does today; the file leaves its profile everywhere.
  - *Copy*: the file stays on the PC and in its profile on every PC. The server records the id in
    `player_state.copiedItems` (a set of item ids). Every place that drops an item because it is already
    held must skip a copied id: `filter_container_contents` (`games_controller.rb:1736-1762`),
    `apply_room_state_changes!` (`game.rb:976-978`), the inventory add short-cut (`inventory_includes?`,
    `games_controller.rb:973`), and the session compose step (5.3). Genuinely moved items are still
    filtered. Test: copy a profile file, reopen the PC, the original still shows.

### 5.2 The PC object

```jsonc
{ "id": "jake_pc", "type": "pc", "name": "Jake's PC",
  "locked": true, "lockType": "login",
  "access": { "roles": ["staff"] },          // who may log in here (default: anyone with creds)
  "policy": "corp_default",
  "loginPicker": "accounts",                 // "accounts" (default) | "known" | false
  "network": "corp_lan",                     // section 8 (not in the first slice)
  "contents": [ /* local files, optional */ ] }
```

`needsHome: "jake_pc"` on Jake makes it his preferred station and the PC's **owner** for sessions
(`ownerOf` in `workstation-state.js:52`, or `screenOwner`). A login PC stays `locked: true` in every room
response for the whole game: the session, not the object, is what opens it.

### 5.3 Sessions: the content gate, log out, switching, reload

**State** (all in `player_state`, so all dropped by `reset_player_state!`, which keeps only its allow
list of keys, `game.rb:89`; `initialize_player_state` gives the new keys empty defaults):

| Key | Shape | Meaning |
|---|---|---|
| `sessions` | `{ pcId: identityId }` | Who is logged in at each login PC right now |
| `loginFailures` | `{ "pcId\|identityId": n }` | Failed password tries, counted on the server |
| `loginLockouts` | `["pcId\|identityId", ...]` | Accounts locked out of that PC by `maxAttempts` |
| `copiedItems` | set of item ids | Section 5.1 |
| `serverClones` | `{ card_id: npcId }` | Section 4.3 |

**The gate is the session, never `unlockedObjects`.** The generic unlock path
(`unlock_object!`, `games_controller.rb:901`; container gate `check_container_unlocked`,
`games_controller.rb:1727-1734`) records an id permanently, so it cannot log out, cannot make a second
account supply its own password, and would keep serving the first identity's desktop. Login therefore
has its own routes and never touches `unlockedObjects`:

- `POST /login` with `pc_id`, `username`, `password`. Handled outside `validate_unlock` (like `npc` and
  `unlocked`), because it carries two values; `login` is not added to `UNLOCK_METHODS_BY_LOCK_TYPE`
  (`game.rb:1035`), so a `login` PC can never be opened through `/unlock`. The check:
  1. the PC exists, is `lockType: login`, and the player can reach its room;
  2. the username belongs to an NPC with `creds`;
  3. the account is not in `loginLockouts` for that PC;
  4. the password equals that NPC's `creds.password`;
  5. the PC's `access` admits that identity.

  Any failure of 2 to 5 gives one message ("Incorrect username or password") and, if the username was
  valid, increments `loginFailures`. When the count reaches the policy's `maxAttempts`, the account joins
  `loginLockouts`. Success sets `sessions[pcId] = identityId` and clears that account's failures.
- `POST /login` with `pc_id` and `claim: "owner"` is the unlocked-session claim (5.4).
- `POST /logout` with `pc_id` deletes `sessions[pcId]`. Logging in as someone else at the same PC
  replaces the session, but only after that account's own password (or a valid claim), so account
  switching is never free: moving to an account with more access is the step that matters.
- Both routes join the actions wrapped in `with_game_lock`.

**Content.** `container` (`games_controller.rb:513`) branches first: for an object with
`lockType: login` it ignores `unlockedObjects`, returns 403 when `sessions[pcId]` is unset, and
otherwise composes the response for that identity: the PC's own `contents`, then each admitted profile
(5.1), dropping items genuinely moved into the inventory but keeping `copiedItems`. A login PC's
`contents` are left out of every room response unconditionally (not only when `locked`), so the
"unlocked containers keep their contents" rule cannot ship them. Taking an item whose source is a login
PC or a profile (the inventory add, `games_controller.rb:973` area) requires the session to admit it;
the implementer confirms the add path's source lookup before building.

**Account tiles.** `loginPicker` sets what the prompt shows:

| `loginPicker` | Prompt |
|---|---|
| `"accounts"` (default) | A tile for every account the PC's `access` admits |
| `"known"` | Only accounts whose NPC is in `encounteredNPCs`, or whose username the player has found as an intel fact |
| `false` | No tiles: the player types the username, as on a hardened PC |

The server composes the tiles, sent in the login PC's room response entry as `loginAccounts` (and
refreshed by `GET /login_accounts?pc_id=` when the prompt opens, because `known` changes as the player
meets people): for each admitted identity, `{ username, displayName, portrait }` and nothing else. No
password, role list, card or other `creds` field is ever in it. The client cannot build this list itself
because the admitted NPCs may be in rooms it has not loaded.

**Reload.** Sessions live on the server, so they survive a reload. The scenario response carries
`sessions` as `{ pcId: { username, displayName } }` (as it carries `savedGlobalVariables`). On load the
client marks those PCs as logged in; opening one calls `container`, and a 403 (for example after a
reset) drops it back to the prompt. The desktop header shows the logged-in account with a **Log out**
button.

### 5.4 Unlocked sessions

When the owner is at their post, the PC is "in use" (as now: `attended`). When they leave, the
workstation layer decides whether the screen locks (`lockChance`, `locksScreenOnLeave`, fed by the
awareness habit `locksScreen`). Policy can force it (5.5). If the screen is **not** locked when the
player interacts, they get the owner's session.

The claim is `POST /login` with `claim: "owner"`. The server honours it **only where the scenario makes
one possible**, and refuses (the player must log in) when:

- the PC has no owner (no `screenOwner`, and no NPC with it as `needsHome`);
- the owner has no `creds`;
- the owner's effective `locksScreen` is `always`, or the PC's `lockChance` is 1;
- the PC's policy has `autoLockMin: 0`.

Otherwise it is a client claim, because the server cannot see NPC positions or the seeded roll
(`decideLocked`, `workstation-state.js:65-73`). The client sends the workstation globals
(`<id>_screen_locked`, `<id>_owner_away`) with the claim and the server logs them. A modified client can
therefore claim a session wherever the scenario allows one, so the validator warns (slice 1, section
10.4) when a puzzle-critical route rests on a session whose owner has `locksScreen: "sometimes"`.

### 5.5 Policies

```jsonc
"policies": {
  "corp_default": { "autoLockMin": 5, "maxAttempts": 5, "usb": "blocked", "social": "allowed" },
  "lax":          { "autoLockMin": null, "maxAttempts": null, "usb": "allowed", "social": "allowed" }
},
"defaultPolicy": "lax"
```

| Field | Effect |
|---|---|
| `autoLockMin` | Game minutes after the owner leaves (or the player stops using a session) before the screen locks, **whatever the owner's habit**. Until then the habit decides. Teaches that a technical control beats a human habit. `null`: no auto lock. |
| `maxAttempts` | Server-counted failed logins (5.3) before that account is locked out on that PC for the mission (the helpdesk route is in the backlog). |
| `usb` | `"blocked"`: USB-tagged items are not accepted at that PC (the needs system's `accepts` ignores them), so dropping a USB-tagged item there fails. |
| `social` | `"blocked"`: the PC is not a `social` affordance (section 7.3). |

A PC with no `policy` uses `defaultPolicy`; with neither, everything is allowed and nothing auto locks
(today's behaviour).

### 5.6 What the client never receives

Everything an NPC's `creds` could reach the browser through, and what is withheld for each. The withholding lives in
the server code that ships the data, so every route inherits it; none relies on the author.

| Path | Withheld |
|---|---|
| Lazy room data, `GET /room/:id` (`filtered_room_data`, `game.rb:909`) | In the NPC branch of `filter_requires_and_contents_recursive` (`game.rb:3011`) delete `creds`, `awareness`, `habits`, `role` and `workarounds` from every NPC hash, and `usePayload.secret` when the NPC has `creds`. Ship the derived `rfidCard` (card id and protocol) only. This is the path that matters: the bootstrap already drops NPCs. |
| NPC recursion | The same branch already recurses `npcs`, `itemsHeld`, `tableItems` and `contents`, so NPCs nested in any of them inherit the withholding. NPCs added by `update_room` (`room_states.npcs_added`, `game.rb:957`) are merged before the filter runs, so the withholding reaches them too. |
| Bootstrap, `GET /scenario` (`filtered_scenario_for_bootstrap`, `game.rb:794`) | Rooms are already reduced to an allow list with no NPCs. Add: delete the top-level `accountProfiles`; ship `policies` (no secrets) and `sessions`. |
| Login PC contents | Left out of room responses unconditionally (5.3) and served only by `container` against a session. |
| Ink, `GET /ink` (`games_controller.rb:547`) | Serves compiled ink verbatim, so a password written in ink text is public. The validator errors when any NPC's `creds.password` appears in a compiled ink file. A character who gives a password away does so through a capture, not ink text. |
| Captures, `GET /capture_secrets` (`games_controller.rb:1043`) | The only route for a captured secret. `capture_secrets_for_client` (`game.rb:869`) is extended to answer for a `creds` NPC from the server's earned `se_captures` record, keyed by capture target. |
| Account picker | `{ username, displayName, portrait }` only (5.3). |
| Sticky note | The `writesDown` fill puts `creds.password` into the login PC object's `postitNote` in the server's room data, only when the habit is on, and the login prompt reads the object's note (today the password minigame reads `postitNote` from room fields for doors, `game.rb:820-821`). |
| Events | `npc_used` events carry the NPC's `usePayload` to the client; with the withholding above a `creds` NPC's `usePayload` holds the address and host only. |

A server test asserts that for a scenario with a cred-bearing NPC, no response from `/scenario`,
`/room/:id`, `/container/:id` (logged out) or `/login_accounts` contains the password string.

## 6. Awareness and habits

### 6.1 Shape

```jsonc
{ "id": "jake", "awareness": "low", "habits": { "writesDown": true, "password": "guessable" } }
```

The preset fills every habit; `habits` overrides any of them. The validator can print the expanded
habits for each NPC so authors see what they got.

### 6.2 Habits

| Habit | Values | Effect, using existing systems where possible |
|---|---|---|
| `locksScreen` | `never`, `sometimes`, `always` | Sets the workstation layer: `never` = `lockChance: 0`, `always` = 1, `sometimes` = 0.5 (seeded). An explicit `lockChance` on the PC still wins. Policy `autoLockMin` caps it. |
| `writesDown` | bool | Puts the owner's password on a sticky note on their PC (the existing `postitNote` / `showPostit` fields, filled server-side from `creds.password`; see 5.6). |
| `password` | `strong`, `guessable`, `reused` | Authoring intent the validator checks. `guessable`: at least one intel fact or social media post must point at it (it suits the `password-guesser` scene's `patternSlots`). `reused`: the same password appears in another login, lock or scene. |
| `holdsDoors` | bool | The NPC lets the player through gate doors they open (`door-gates.js` `openFor` plus the tailgate beat). |
| `phishable` | `low`, `medium`, `high` | Expands into the NPC's `social.phishTargets` defaults: how many `requiredFactors`, how broad `primedFor.trusts`, `runsExecutable`. Only applies if the NPC is also a phish target. |
| `pretextable` | `low`, `medium`, `high` | Expands into `social.pretextNpcs` defaults: `susceptibility` deltas per technique, whether asks have `verification`, `tuning.maxRefusals`. |
| `challengesStrangers` | bool | Expands into influence thresholds (how soon they go `wary`, `refuses`, `reports`), plus a physical beat later (asking an unbadged player for ID). |

### 6.3 Presets

Proposed defaults, to tune in the first scenario that uses them:

| Habit | `low` | `medium` | `high` |
|---|---|---|---|
| `locksScreen` | `never` | `sometimes` | `always` |
| `writesDown` | true | false | false |
| `password` | `guessable` | `reused` | `strong` |
| `holdsDoors` | true | true | false |
| `phishable` | `high` | `medium` | `low` |
| `pretextable` | `high` | `medium` | `low` |
| `challengesStrangers` | false | false | true |

**Social engineering fit.** The SE lab already expresses susceptibility per NPC through
`social.characters.*.influence` thresholds, `social.pretextNpcs[].susceptibility` / `knows` / ask
`verification`, and `social.phishTargets[]` factors and `runsExecutable`. Awareness does not replace
those. When an NPC also appears in those blocks, the preset supplies **defaults** for fields the author
left out, and anything written explicitly wins. The SE systems still install only when
`social.characters` exists, so missions without them are unaffected. What awareness adds that SE has no
equivalent for is the physical and sign-in hygiene layer: screen locking, sticky notes, holding
doors and password reuse across systems.

## 7. Work, frustration and social media

### 7.1 Work resources

```jsonc
"resources": {
  "finance_share": { "kind": "file_share", "network": "server_net",
                     "access": { "roles": ["finance"] }, "downIf": "server_net_down" },
  "email":         { "kind": "email", "network": "server_net" },
  "printer_2f":    { "kind": "printer", "object": "office_printer" }
},
"roles": {                                   // defaults for NPCs with that role, not grants
  "finance": { "workNeeds": ["finance_share", "email"] },
  "staff":   { "workNeeds": ["email"] }
}
```

- `roles` holds **defaults only** (`workNeeds`, optionally `awareness` and `workarounds`). Grants stay in
  ACLs. An NPC can add or remove: `"workNeeds": ["+printer_2f", "-email"]`.
- A resource can be abstract (on a network) or tied to a physical object (`object`).
- When an NPC completes a `work` use at a PC, the needs system checks each work need. It is met if the
  resource's `access` admits the NPC, the PC's network reaches the resource's network (section 8; always
  true until networks exist), and the resource is not down (`downIf` global false).
- All met: work is restored as now. Any missing: `work` is **not** restored and the NPC's frustration
  rises.

### 7.2 Frustration and workarounds

Frustration is a per-NPC level (0 to 100), not a need: it rises on each failed work use
(`frustrationPerFail`, default 25) and falls slowly when work succeeds. Workarounds fire once each when
it crosses their threshold:

```jsonc
"workarounds": [
  { "at": 50, "do": "borrow_session" },      // works at a colleague's PC instead
  { "at": 75, "do": "writes_down" },         // sticks their password on the monitor
  { "at": 90, "do": "prop_door", "door": "finance_office" }
]
```

| `do` | Effect |
|---|---|
| `borrow_session` | For the next work use the NPC picks another PC they may log into and leaves it unlocked when they go |
| `writes_down` | Turns on `writesDown` from now on |
| `prop_door` | Sets the door open (gate behaviour) until a global or timer closes it |
| `share_login` | Reveals their username and password as an intel fact the player can overhear (an `npc_used`-style event the scenario maps) |
| `emit` | Any event name, for scenario-specific beats |

Every workaround also emits `npc_workaround:<npcId>` with `{do}`, for objectives, HaX's comments and
later logs.

**Outages.** Any resource or network can name a `downIf` global. A player who cuts a network or jams the
printer sets it, work fails, frustration rises and NPCs leave their desks: a distraction tool.

### 7.3 Social media need

```jsonc
"needs": { "social": { "decayPerMin": 4, "urgentAt": 40 } },
"feed": [
  { "text": "Biscuit turns 5 today! Best boy.", "intel": "jake_pet_name" },
  { "text": "Back from Crete, 300 emails waiting..." }
]
```

(`feed` is the NPC's own posts, kept distinct from the social-media browser's `social.landingPages[].profiles[].posts`.)

- **Where it is satisfied.** The NPC's own phone (always available, used where they stand; a phone-in-hand
  pose) or their PC if its policy allows `social`. Preference: PC if allowed, else phone. Using the phone
  at a desk still counts as away from work but keeps the owner at the post, so the screen stays attended.
- **Feed.** Each completed `social` use reveals that NPC's next post into a feed the player can read: a
  `social_feed` object or a phone app. This reuses the reveal-slot idea from the needs system. A post's
  `intel` grants the named `social.intelFacts` entry when read, linking public posts to password guessing.
- **Awareness.** With `awareness: high` the validator warns if a post grants intel (high-awareness staff
  shouldn't overshare) unless the post is marked `"deliberate": true`.
- **Blocked.** If `social` is blocked on the PC and the NPC has no phone (`"phone": false`), a social use
  fails and frustration rises.

## 8. Networks

```jsonc
"networks": {
  "corp_lan":   { "name": "Office LAN" },
  "guest_wifi": { "name": "Guest Wi-Fi" },
  "server_net": { "name": "Servers", "downIf": "server_net_down" }
},
"networkLinks": [ ["corp_lan", "server_net"] ]      // undirected reach; no per-service rules
```

- PCs, devices and resources carry `network`. A room may set `network` as a default for its objects.
- **Reach**: same network, or joined through `networkLinks`. Rights still come from ACLs; reach is the
  second gate. Firewall rules per service are deliberately left out for now.
- **Wi-Fi**: a `wifi_ap` object with `network` and `psk`. Learning the PSK (a sticky note, a post, a
  pretext call) lets the player's laptop join that network.
- **Jacks**: a `network_jack` object with `network` accepts a rogue device item (tag `rogue_device`);
  plugging one in gives the player reach to that network.
- **What player reach unlocks**: a resource or a VM launcher can require reach (`"requiresReach":
  "server_net"`), so the player must get onto the right network before the next step. This is the hook
  for a later bridge to SecGen VMs.

## 9. Determinism

All chance uses the needs system's seeded `roll` (as `lockChance` does), so a given seed always plays
the same way. No puzzle-critical opening may depend on a roll alone: the validator warns when the only
route past a lock is an unlocked session whose owner has `locksScreen: "sometimes"`, and the author
either fixes the habit or adds another route. This check ships in the first slice (10.4), because
unlocked sessions do.

## 10. First slice

Chosen by the user: roles on NPCs, identity-bearing sign-in details with ACL doors, per-account PC contents
with unlocked sessions, named policy with auto lock, validator checks. Build in this order; each step is
testable before the next.

1. **Schema and loader.**
   - Files: `scripts/validate_scenario.rb` (top-level keys `:390-394`, rooms `:405-409`, NPC fields
     `:412-419`, items `:484-510`), `app/models/break_escape/game.rb` (scenario load).
   - Add NPC `role`, `creds` (reading `rfidCard` as `creds.card`; filling `usePayload` from `creds`),
     `access` on rooms and objects, top-level `accountProfiles`, `policies`, `defaultPolicy`,
     `lockType: "login"`, `loginPicker`, `transfer`, `cloneable`.
   - Extend `stamp_scenario_object_ids!` to walk `accountProfiles`.
2. **Server withholding first**, before any content is authored with a password.
   - Files: `game.rb` (NPC branch of `filter_requires_and_contents_recursive`;
     `filtered_scenario_for_bootstrap`; unconditional contents removal for login objects),
     `test/models` and `test/controllers`.
   - Tests: the no-password assertion from 5.6 across `/scenario`, `/room/:id`, `/container/:id`;
     `update_room` with an added NPC.
3. **Server: sessions, login, card copy, ACL doors.**
   - Files: `config/routes.rb` (`login`, `logout`, `login_accounts`, `clone_card`),
     `games_controller.rb` (new actions; `container` branch; `with_game_lock` list; `unlock` passes the
     card list), `game.rb` (`initialize_player_state` keys, `validate_unlock` ACL branch, session and
     lockout helpers, `copiedItems` in `filter_container_contents` and `apply_room_state_changes!`,
     `capture_secrets_for_client` for `creds` NPCs, scenario response carries `sessions`).
   - Tests: login success, wrong username equals wrong password message, lockout after `maxAttempts`,
     logout then 403, switch account needs the second password, `/unlock` refuses a login PC,
     reset clears every new key, claim refusal conditions, copy endpoint conditions, role-ACL door with
     held, copied (server-recorded) and faked (`saved_cards` only) cards.
4. **Client.**
   - Files: `public/break_escape/js/api-client.js` (new calls), `systems/unlock-system.js` (send every
     held `card_id` for `access` doors; open `login` locks), `minigames/password/password-minigame.js`
     (login mode, account tiles, `postitNote` from the object), `minigames/container/container-minigame.js`
     (Open / Copy / Move dialog; takeable files into the inventory inside login desktops; header with
     account and **Log out**), `minigames/helpers/chat-helpers.js` and the RFID minigame
     (`rfid-data.js`) (call `clone_card`), `systems/workstation-state.js` (honour `autoLockMin` and
     `locksScreen`; send the claim).
5. **Validator checks** (`scripts/validate_scenario.rb`).
   - Every `access` role is held by at least one NPC (warning); every person, profile, policy, card and
     network reference resolves (error); profile item ids unique and not shared with a room object
     (error); every NPC can log in to its `needsHome` PC; a `creds.password` appearing in an NPC's
     compiled ink is an error; a differing `usePayload.secret` is an error.
   - Identity reach: for each NPC card and login, list the doors and PCs its identity opens. Ordering
     against the intended route is not computed in this slice (the validator has no per-lock depth);
     that earlier-than warning waits until the dungeon graph exposes a reachable order.
   - Warn when a puzzle-critical route rests on an unlocked session whose owner has
     `locksScreen: "sometimes"` (section 9).
6. **Dungeon graph** (`scripts/generate_dungeon_graph.rb`): an identity appears as a key node (Jake's
   card, Jake's login) with edges to the locks it opens.
7. **Proof scenario**: `scenarios/test_access_model`, with three NPCs (finance, staff, IT), a finance
   door with a role-only ACL, three PCs, a staff profile and a personal profile, `corp_default` with
   `autoLockMin: 5`, and one cloneable card. Then add one beat to `lab_physical_pentest`.

Later slices, in order: awareness presets and habits (section 6); work resources and frustration
(7.1, 7.2); social media (7.3); networks (8).

## 11. Open questions

None.
