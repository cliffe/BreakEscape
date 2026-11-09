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
- A set of sign-in details is evidence of an identity, so a copied or captured one gives the player
  **exactly its owner's access**.
- PCs show a **sign-in screen**; contents come from **profiles** (a shared staff desktop, Jake's own
  files) that follow the account to any PC it signs in to.
- **Policies** (auto lock, attempt limits, USB, social media) apply to PCs by name.
- NPC **awareness** (a preset plus overrides) sets the habits that give access away.
- **Work resources** and a **social media** need make access matter to NPCs, and their workarounds
  give the player openings.
- **Networks** decide what can be reached at all.

### Lessons taken from CyberCIEGE

| CyberCIEGE | Here |
|---|---|
| Access is layered: physical zones, accounts, network, procedures | Doors (ACL), PC sign-in (ACL plus profiles), networks, policy and habits |
| Users need specific assets to be productive; denying access costs productivity | `workNeeds`: missing access raises frustration, which triggers insecure workarounds |
| Unhappy users become an insider risk | Frustration workarounds and the existing social engineering influence model |
| Hand-written scenario language was too heavy; they built a forms tool | Small schema with defaults, ACLs on the thing protected, validator checks from day one |
| Weak assessment record | Events for sign-ins, sessions and workarounds, ready for logs and Hacktivity later |

Not taken: probabilistic resolution of outcomes (puzzles stay deterministic, section 9) and a budget
loop (defender missions are in the backlog).

## 2. Decisions

User decisions (2026-11-09):

| Area | Decision |
|---|---|
| Structure | **ACLs.** Role and sign-in details live on the NPC. Each lock, PC, profile or resource lists the roles and people it admits. No central grants table. |
| Doors | An RFID door accepts specific cards (`requires`, as now) **or** roles/people (`access`), or both. |
| Sign-in details | Cards resolve to their owner, so copies work too. Passwords captured any way work at any PC that account may use. Unlocked sessions give the owner's access. Legacy `requires` keeps working. |
| Awareness | Preset (`low`, `medium`, `high`) plus per-habit overrides. It expands into the existing social engineering blocks rather than running alongside them. |
| Habits | Locks screen, password strength (guessable from public posts), sticky note, password reuse, holds doors, falls for phishing or pretext calls, challenges strangers. |
| Workstations | `needsHome` is the preferred station. PC contents depend on who is signed in. |
| Policy | Named policies referenced by PCs: auto lock, attempt limit, USB blocked, social media blocked. |
| Work | Abstract resources plus physical objects. Work requirements by role. Frustration, workarounds and outages. |
| Social media | `social` need; phone or PC (if policy allows); posts appear in a readable feed and can reveal facts; blocking raises frustration. |
| Networks | Named networks with membership, Wi-Fi with a key, network jacks. |
| Determinism | Seeded rolls (the existing `NPCNeedsSystem.roll`). |
| Tooling | Validator: references exist, NPCs can reach their work, identities that skip locks are flagged. Identities appear in the dungeon graph. Player missions first. |
| Taking files | The player chooses Copy or Move in a desktop-themed dialog; items can restrict it. |
| Sign-in screen | Portrait account picker by default; showing only known people, or typing the username, is optional per PC. |
| `staff` role | Every NPC with creds has it implicitly. |
| Content release | A sign-in PC's contents are sent only after a correct password, except unlocked-session claims, honoured only where the scenario makes one possible. |
| Backlog | Defender and investigator mission types, SecGen export (`docs/IDEAS_BACKLOG.md`). |

Orchestrator decisions (the user can overrule):

| Area | Decision |
|---|---|
| Copied cards | A copy counts toward an ACL door only if the **server recorded the copy** (section 4.3) or the card is a keycard item the server holds. The card copier's client-written `saved_cards` list never decides identity. |
| Account tiles | The default account picker is engineering, not an authoring choice: the server composes the tiles for each sign-in PC (section 5.3). |

## 3. Identities and sign-in details on the NPC

```jsonc
{
  "id": "jake",
  "displayName": "Jake Brooks",
  "role": "finance",                    // or ["finance", "staff"]; free strings
  "creds": {
    "username": "jbrooks",
    "password": "Biscuit2019",          // never leaves the server (section 5.6)
    "card": { "name": "Jake's badge", "card_id": "4F00A1C2", "rfid_protocol": "EM4100" }
  },
  "awareness": "low",                   // later slice, section 6
  "habits": { "writesDown": true },     // later slice, section 6
  "needsHome": "jake_pc"
}
```

- **Where.** `role` and `creds` are allowed only on room NPCs (`rooms.<id>.npcs[]`). The validator
  errors on them anywhere else (top-level `npcs`, `phoneNPCs`, headless `emailRecord`s under
  `social`), because those paths reach the browser unfiltered.
- `role` is a string or an array. Every NPC with `creds` implicitly also has the role `staff` unless
  `"staff": false` is set, so "all staff" ACLs need no extra typing.
- **Accounts and cards.** An NPC has an **account** when `creds.username` is set (a password is then
  required). Account tiles, sign-in and the "can sign in to its `needsHome` PC" check apply only to
  accounts. An NPC may have a card and no account (a guard, or any existing mission's `rfidCard`).
- `creds.card` replaces `rfidCard`. The loader treats an existing `rfidCard` as `creds.card`. The
  client still receives `rfidCard` on the NPC, equal to the card as authored (`name`, `card_id`,
  `rfid_protocol` and any protocol fields; a card is not secret, copying it is the game), so
  `clone_keycard`, the conversation's `card_name` variable and the RFID minigame keep working.
- **Identity resolution.** A card or sign-in maps to an identity by value: a card by `card_id`, a
  sign-in by `username`. Nothing on the item needs to name its owner, so a copy (same `card_id`)
  carries the same identity as the original. A keycard item may still say `"identity": "jake"` for
  readability; the validator checks it agrees with the `card_id`. A card whose `card_id` belongs to
  no NPC has no identity and passes only through `requires`.
- The player has no identity of their own. They act as whoever's sign-in details or session they use.
- **One home for a password.** `creds.password` is the only place an account password is authored.
  For an NPC with an account, `usePayload.address` and `usePayload.secret` are filled from
  `creds.username` and `creds.password` by the loader. The validator errors when the author writes a
  `usePayload.secret` that differs, or any `addCapture.secret` in that NPC's `eventMappings` (the
  capture takes its address and secret from the `usePayload` overlay, `npc-manager.js:1169-1177`).

## 4. ACLs on locks

One field, `access`, wherever a lock can stand:

```jsonc
"access": { "roles": ["finance", "it"], "people": ["dana"] }
```

A card or sign-in passes if its identity's roles intersect `roles`, or its identity is in `people`.
`access` holds role names and NPC ids, nothing secret, so it is sent to the client like `lockType`.

### 4.1 Doors (RFID)

```jsonc
// rooms.finance_office
{ "locked": true, "lockType": "rfid",
  "requires": ["VISITOR-07"],                 // specific cards, as today (optional)
  "access": { "roles": ["finance"] } }        // plus anyone whose card resolves to finance
```

Unlock rule: a card's id is in `requires`, **or** its identity passes `access`. At least one of the two
fields is required (validator error otherwise). A door with `requires` only behaves exactly as today.

**Getting `access` to the client.** The client knows a door's lock from three fixed field lists, so
`access` is added to each: the bootstrap's room allow list (`game.rb:819-821`), `doorProperties`
(`doors.js:518-544`, from the door's lock properties or the connected room, like `requires`), and
`getLockRequirementsForDoor` (`unlock-system.js:602-615`). Objects keep `access` in room data,
because the room filter does not strip it.

**Client.** The `rfid` branch (`unlock-system.js:502-593`) runs in this order:

1. A held card or saved copy matches `requires` (`evaluateRfidCredential`): today's path, unchanged.
2. Otherwise, if the lock has `access`: send **every held `card_id`** (keycards in inventory and the
   card copier's `saved_cards`) as `card_ids` in one unlock request, and drive the UI from the
   server's answer: unlocked, or "Access denied". The client does not resolve cards to roles itself,
   because the admitted NPC may be in a room it has not loaded.
3. Otherwise today's "Requires RFID keycard" or card copier flow.

**Server.** `validate_unlock` (`game.rb:1156-1161` for doors, `:1245-1248` for objects) handles an
`rfid` lock with `access` like this:

- **With `card_ids`:** each card is checked in turn and the first that passes unlocks. A card passes
  when it is **held** (a keycard item in the server's inventory whose scenario definition carries that
  `card_id`, or a key of `player_state.serverClones`, 4.3) **and** its id is in `requires` or equals
  some NPC's `creds.card.card_id` whose identity passes `access`.
- **Without `card_ids`** (today's trusted claim): accepted only when the lock has `requires`, as
  today; refused when it has `access` alone.

So on a mixed door a `requires` card keeps today's client-trusted rule, and the ACL is only as strong
as the absence of `requires`. A door with `requires` only is untouched.

**Gate doors** (a door with a `gate` block, opened by `doors.js:658-670` from `requires` alone) do
not take `access` in the first slice; the validator errors on the combination.

### 4.2 Other lock types

`access` is defined generically, but only `rfid` (doors and objects) and the new `login` (section 5)
use it in the first slice. Keys, PINs and passwords stay as they are.

### 4.3 Server-recorded card copies

A card is saved to the card copier in one place: `handleSaveCard` (`rfid-minigame.js:280-300`) calling
`saveCardToCloner` (`rfid-data.js:286`). The `clone_keycard` ink action (`chat-helpers.js:364-405`)
and the keycard object interaction (`interactions.js:883-896`) only open the minigame. At that save
point the client also calls a new endpoint, `POST /clone_card`, with the copy's source: `npc_id`
(the ink action passes the conversation's NPC id in the minigame parameters) or `object_id` (the
keycard object passes its id). The server records `player_state.serverClones[card_id] = { npc |
object: id }` only if all of these hold:

1. the player's server-side inventory holds an `rfid_cloner`;
2. for an NPC: it is a room NPC with `creds.card`, it is in `player_state.encounteredNPCs`, and it is
   not marked `"cloneable": false`;
3. for an object: it is a keycard with that `card_id` in a room the player can reach (unlocked, or
   never locked), and not marked `"cloneable": false`.

That is all it checks. `encounteredNPCs` is filled for every NPC in a room when the room loads
(`games_controller.rb:1608-1650`), so step 2 means "the player has entered the NPC's room", not "is
talking to them"; the server cannot see positions. It is a tightening, not a genuine identity check: a
modified client can still call the endpoint for any NPC whose room it has entered. A puzzle that must
not be possible to get past should rest on a fact the server checks itself: a keycard item held, or a
password or PIN typed and checked on the server. Captures (5.6) are client-reported and do not count.
The `saved_cards` list stays client-written and drives only the card copier's UI. `serverClones` is
cleared by a game reset.

## 5. PCs: sign-in, sessions and profiles

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

- Signing in as X shows, in order: the PC's own `contents` (local files anyone signed in sees), then
  every profile whose `for` admits X (role profiles first, then personal ones, in declaration order).
- Profiles are keyed to the account, not the PC, so the same files appear on any PC Jake can sign in to.
- **Item ids.** Ids are global and every held-item filter and lookup keys on them.
  `stamp_scenario_object_ids!` (`game.rb:3059`) is extended to walk `accountProfiles`, giving any
  profile item without an id one (`<profile>_content_<n>`, nested items as today). The validator
  errors on a profile item id shared with another profile item or a room object.
- **Lookups.** The four object lookups learn the sign-in scope: `find_scenario_object`
  (`game.rb:1340`), `find_object_in_scenario` and `find_container_in_scenario`
  (`games_controller.rb:1676-1720`) and `find_accessible_item` (`games_controller.rb:1993`) walk
  `accountProfiles` (recursively), and each found object reports its **scope**: the sign-in PC it sits
  under, or the profile it belongs to, or none. One helper, `login_scope_of(object_id)`, gives the
  scope; one more, `session_admits?(pc_id, scope)`, gives the rule in 5.3.
- **Taking files.** `takeable: false` items stay on the PC and open in place. Clicking a takeable
  digital file opens a small **desktop-themed dialog** in the PC's window chrome: **Open**, **Copy to
  inventory**, **Move to inventory**, **Cancel** (only **Open** once the file is held). A scenario
  can restrict the choice per item (`"transfer": "copy" | "move" | "both"`, default `both`). This
  changes `container-minigame.js:453-456`, where a `text_file` always opens the viewer.
  - *Move*: as the engine does today; the file leaves the PC and its profile everywhere, because held
    items are dropped from container listings.
  - *Copy*: the file stays on the PC and in its profile on every PC. The server records the id in
    `player_state.copiedItems` (a set of item ids). `filter_container_contents`
    (`games_controller.rb:1736-1762`) keeps a held item whose id is in `copiedItems`; the session
    compose step (5.3) uses that filter. Genuinely moved items are still filtered.

**The take request.** Today the add (`inventory.js:445-470`, server `games_controller.rb:954-994`)
carries only `action_type`, `item` and `source_npc_id`, and `find_accessible_item` cannot find a
profile item and resolves a PC file to a container that must be in `unlockedObjects`
(`games_controller.rb:1884-1890`), which sign-in never writes. So:

- The add from a sign-in desktop also sends `source_pc_id` and `transfer: "copy" | "move"`.
- With `source_pc_id`, `find_accessible_item` searches that PC's own contents (recursively) and every
  profile, giving location `{ type: 'login_pc', pc_id }` or `{ type: 'profile', profile_id }`. Without
  it, the generic search skips sign-in PCs' contents and profiles.
- `validate_item_collectible` accepts these locations only when the PC is `lockType: "login"`,
  `sessions[source_pc_id]` is set, `session_admits?` holds for the item, the item is takeable, and its
  `transfer` allows the choice.
- On `copy`, the same locked request adds the id to `copiedItems`.

### 5.2 The PC object

```jsonc
{ "id": "jake_pc", "type": "pc", "name": "Jake's PC",
  "locked": true, "lockType": "login",
  "access": { "roles": ["staff"] },          // who may sign in here (default: every account)
  "policy": "corp_default",
  "loginPicker": "accounts",                 // "accounts" (default) | "known" | false
  "lockChance": 0.5,                         // unattended screen rule, 5.4 (optional)
  "network": "corp_lan",                     // section 8 (not in the first slice)
  "contents": [ /* local files, optional */ ] }
```

`needsHome: "jake_pc"` on Jake makes it his preferred station and the PC's **owner** for sessions
(`ownerOf`, `workstation-state.js:52-58`, or an explicit `screenOwner`). A sign-in PC stays
`locked: true` in every room response for the whole game: the session, not the object, is what opens
it. A `lockType: "login"` PC is a workstation by default (`isWorkstation`, `workstation-state.js:46-49`,
learns it), so its owner's comings and goings are tracked.

### 5.3 Sessions: the content gate, sign-out, switching, reload

**State** (all in `player_state`, so all dropped by `reset_player_state!`, which keeps only its allow
list of keys, `game.rb:89-107`; `initialize_player_state` gives the new keys empty defaults):

| Key | Shape | Meaning |
|---|---|---|
| `sessions` | `{ pcId: identityId }` | Who is signed in at each sign-in PC right now |
| `loginFailures` | `{ "pcId\|identityId": n }` | Failed password tries, counted on the server |
| `loginLockouts` | `["pcId\|identityId", ...]` | Accounts locked out of that PC by `maxAttempts` |
| `copiedItems` | set of item ids | Section 5.1 |
| `serverClones` | `{ card_id: { npc \| object: id } }` | Section 4.3 |

**The gate is the session, never `unlockedObjects`.** The generic unlock path (`unlock_object!`,
`games_controller.rb:901`; container gate `check_container_unlocked`, `:1727-1734`) records an id
permanently, so it cannot sign out, cannot make a second account supply its own password, and would
keep serving the first identity's desktop. Sign-in therefore has its own routes and never touches
`unlockedObjects`:

- `POST /login` with `pc_id`, `username`, `password`. Handled outside `validate_unlock` (like `npc`
  and `unlocked`), because it carries two values; `login` is not added to
  `UNLOCK_METHODS_BY_LOCK_TYPE` (`game.rb:1035-1044`), so a `login` PC can never be opened through
  `/unlock`. The check:
  1. the PC exists, is `lockType: "login"`, and its room is unlocked or never locked;
  2. the username belongs to an account (section 3);
  3. the account is not in `loginLockouts` for that PC;
  4. the password equals that NPC's `creds.password`;
  5. the PC's `access` admits that identity (no `access`: every account).

  Any failure of 2 to 5 gives one message ("Incorrect username or password") and, if the username was
  valid, increments `loginFailures`. When the count reaches the policy's `maxAttempts`, the account
  joins `loginLockouts`. Success sets `sessions[pcId] = identityId` and clears that account's failures.
- `POST /login` with `pc_id` and `claim: "owner"` is the unlocked-session claim (5.4).
- `POST /logout` with `pc_id` deletes `sessions[pcId]`. Signing in as someone else at the same PC
  replaces the session, but only after that account's own password (or a valid claim), so switching
  accounts is never free: moving to an account with more access is the step that matters.
- Both routes join the actions wrapped in `with_game_lock`.

**Session scope.** `session_admits?(pc_id, scope)` holds when `sessions[pc_id]` is set and the scope is
that PC itself, or a profile whose `for` admits the session's identity. It guards every request that
reaches something inside a sign-in PC or a profile:

- `container` for the PC itself, or for a folder nested in its contents or in a profile;
- `/unlock` of any object whose scope is a sign-in PC or a profile (a locked archive in Jake's files):
  the request carries `pc_id`, and it is refused without a session that admits the object, even with
  `method: "unlocked"` (otherwise `game.rb:1199-1203` would record a nested folder from its
  predictable stamped id and return its contents);
- the take request (5.1).

**Content.** `container` (`games_controller.rb:513`) looks the PC up with `find_object_in_scenario`
(`:1688`), not `find_container_in_scenario`, because a PC holding only profiles has no `contents` of
its own (`:1676-1677, 1719`). For an object with `lockType: "login"` it ignores `unlockedObjects`,
returns 403 when `sessions[pcId]` is unset, and otherwise composes the response for that identity:
the PC's own `contents`, then each admitted profile (5.1), through `filter_container_contents`. A
sign-in PC's `contents` are left out of every room response unconditionally (not only when `locked`),
so the "unlocked containers keep their contents" rule cannot ship them, and the room data marks it
`hasContents: true` so the client routes it as a container (`interactions.js:1524-1534`); the
`login` case in `unlock-system.js` then opens the sign-in screen, or the desktop when the client
holds a session for it.

**Account tiles.** `loginPicker` sets which tiles the sign-in screen shows. Every mode also offers
**Other user**, to type a username.

| `loginPicker` | Tiles |
|---|---|
| `"accounts"` (default) | Every account the PC's `access` admits |
| `"known"` | Admitted accounts whose NPC is in `encounteredNPCs` (the player has entered their room) |
| `false` | None: the player types the username, as on a hardened PC |

The server composes the tiles, sent in the sign-in PC's room response entry as `loginAccounts` (and
refreshed by `GET /login_accounts?pc_id=` when the screen opens, because `known` changes as the player
explores): for each admitted account, `{ username, displayName, portrait }` and nothing else, where
`portrait` is the image person-chat shows for that NPC (`spriteTalk`, else the portrait derived from
its sprite, else `avatar`). No password, role list, card or other `creds` field is ever in it. The
client cannot build this list itself because the admitted NPCs may be in rooms it has not loaded.

**Reload.** Sessions live on the server, so they survive a reload. The scenario response carries
`sessions` as `{ pcId: { username, displayName } }` (as it carries `savedGlobalVariables`). On load
the client marks those PCs as signed in; opening one calls `container`, and a 403 (for example after a
reset) drops it back to the sign-in screen. The desktop header shows the signed-in account with a
**Sign out** button.

### 5.4 Unlocked sessions

The first slice drives unlocked sessions from the workstation fields a PC already has; the
`locksScreen` habit (section 6) later only fills those fields in.

- **Owner present** (`onInteract` returns `attended`): the client shows "Jake is using this PC" and
  opens nothing.
- **Owner leaves.** The workstation layer decides whether the screen locks (`decideLocked`,
  `workstation-state.js:65-74`): `lockChance` (0 to 1, seeded roll) wins; without it,
  `locksScreenOnLeave` (default true, so a PC with neither field always locks, the safe default).
  Policy `autoLockMin` (5.5) then locks an open screen after that many game minutes.
- **Owner away, screen open** (`onInteract` returns `accessed`): the client sends the claim, and on
  success opens the owner's desktop. When the owner returns (`workstation_owner_returned:<pcId>`),
  the client ends the claimed session with `POST /logout`.

The claim is `POST /login` with `claim: "owner"`. The server honours it **only where the scenario makes
one possible**, and refuses (the player must sign in) when:

- the PC has no owner (no `screenOwner`, and no NPC with it as `needsHome`);
- the owner has no account, or the PC's `access` does not admit the owner;
- the PC always locks: `lockChance` is 1, or `lockChance` is unset and `locksScreenOnLeave` is not
  `false`;
- the PC's policy has `autoLockMin: 0`.

Otherwise it is a client claim, because the server cannot see NPC positions or the seeded roll. The
client sends the workstation globals (`<id>_screen_locked`, `<id>_owner_away`) with the claim and the
server logs them. A modified client can therefore claim a session wherever the scenario allows one,
so the validator warns (section 9) about any owned sign-in PC whose session rests on a roll.

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
| `autoLockMin` | Game minutes (the needs system's clock) after the owner leaves before an open screen locks, **whatever `lockChance` or the habit say**. Teaches that a technical control beats a human habit. `0`: the screen locks at once, so no claim is possible. The client also signs the player out of a session after this long away from that PC (a game rule the server does not enforce). `null`: no auto lock. |
| `maxAttempts` | Server-counted failed sign-ins (5.3) before that account is locked out on that PC for the mission (the helpdesk route is in the backlog). |
| `usb` | `"blocked"`: USB-tagged items are not accepted at that PC (the needs system's `accepts` ignores them), so dropping a USB-tagged item there fails. Later slice. |
| `social` | `"blocked"`: the PC is not a `social` affordance (section 7.3). Later slice. |

A PC with no `policy` uses `defaultPolicy`; with neither, everything is allowed and nothing auto locks
(today's behaviour). Policies hold no secrets and are sent in the bootstrap.

### 5.6 What the client never receives

Every path by which an NPC's `creds` could reach the browser, and what is withheld on each. The
withholding lives in the server code that ships the data, so every route inherits it.

| Path | Withheld |
|---|---|
| Lazy room data, `GET /room/:id` (`filtered_room_data`, `game.rb:909`) | NPCs are reached by the `obj['npcs']&.each` loop of the generic `filter_requires_and_contents_recursive` (`game.rb:3011`). A helper, `withhold_npc_secrets!(npc)`, called on each NPC in that loop before it recurses, deletes `creds`, `awareness`, `habits`, `role` and `workarounds`, and for an NPC with an account `usePayload.secret` and every `addCapture.secret` in its `eventMappings`; it sets the derived `rfidCard` (section 3). Non-NPC hashes are untouched. |
| NPC recursion | The same loop recurses `npcs`, `itemsHeld`, `tableItems` and `contents`, so NPCs nested in any of them are covered. NPCs added by `update_room` (`room_states.npcs_added`, `game.rb:957-960`) are merged before the filter runs, so they are covered too. |
| Bootstrap, `GET /scenario` (`filtered_scenario_for_bootstrap`, `game.rb:794`) | Rooms are already reduced to an allow list with no room NPCs. Add: delete the top-level `accountProfiles`; ship `policies`, `defaultPolicy` and `sessions`. `creds` and `role` cannot appear in the parts it ships as authored (top-level `npcs`, `phoneNPCs`, `social` email records), because the validator allows them on room NPCs only (section 3). |
| Sign-in PC contents and profiles | Left out of room responses unconditionally and served only by `container` against a session (5.3). |
| Ink, `GET /ink` (`games_controller.rb:547`) | Serves compiled ink verbatim, so a password written in ink text is public. The validator errors when any NPC's `creds.password` appears in any compiled ink file of the scenario. A character who gives a password away does so through a capture, not ink text. |
| Captures, `GET /capture_secrets` (`games_controller.rb:1043`) | See below. |
| Account tiles | `{ username, displayName, portrait }` only (5.3). |
| Events | `npc_used` events carry the NPC's `usePayload`; with the withholding above, an account holder's `usePayload` holds the address and host only. |

**Captures.** A capture entry in `se_captures` is client-reported: the client writes it into globals
and the server persists it (`game.rb:863-876`). `capture_secrets_for_client` (`game.rb:869`) is
extended so that, under the same `social.captures.revealSecret` switch, it also answers for an
account holder, but only one the scenario gives a **capture route**: an `eventMappings[].addCapture`
on that NPC, or a `usePayload` the loader filled from `creds`. An earned entry whose `address` equals
that NPC's `creds.username` is answered with `creds.password`, keyed by the entry's `targetId` like
landing-page captures. No other NPC's password is ever served, and the existing single-secret fallback
counts landing-page captures only. The client's capture views already take the served map
(`displaySecret`, `captures.js:83-110`). A modified client can still read the password of an NPC with
a capture route by forging an entry; that is why captures do not count as server-established facts
(4.3).

**Deliberate clues.** A note, document or `postitNote` an author writes on purpose ships like any other
clue; the withholding covers `creds`, not clues. The sign-in screen reads the PC object's own
`postitNote` (as objects already do, `unlock-system.js:341`). The server fill of that note from
`creds.password` belongs to the `writesDown` habit, in the habits slice (section 6).

A server test asserts that for a scenario with an account-holding NPC (with `usePayload`, an
`eventMappings` capture, a profile and a sign-in PC, and no authored note holding the password), no
response from `/scenario`, `/room/:id`, `/container/:id` (signed out), `/login_accounts` or
`/capture_secrets` (with no entry, and with a forged entry for an NPC that has no capture route)
contains the password string.

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
| `locksScreen` | `never`, `sometimes`, `always` | Fills the owned PC's `lockChance` when the PC sets none: `never` = 0, `sometimes` = 0.5 (seeded), `always` = 1. An explicit `lockChance` on the PC wins. Policy `autoLockMin` still applies. The claim rules and validator warning (5.4, 9) then work unchanged. |
| `writesDown` | bool | The server fills the owned sign-in PC's `postitNote` (and `showPostit`) from `creds.password` in room data. This deliberately ships the password, so the no-password test (5.6) runs on a scenario without it. |
| `password` | `strong`, `guessable`, `reused` | Authoring intent the validator checks. `guessable`: at least one intel fact or social media post must point at it (it suits the `password-guesser` scene's `patternSlots`). `reused`: the same password appears in another sign-in, lock or scene. |
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
| `borrow_session` | For the next work use the NPC picks another PC they may sign in to and leaves it unlocked when they go |
| `writes_down` | Turns on `writesDown` from now on |
| `prop_door` | Sets the door open (gate behaviour) until a global or timer closes it |
| `share_login` | Reveals their username and password as an intel fact the player can overhear (an `npc_used`-style event the scenario maps to a capture) |
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
the same way. No puzzle-critical opening may depend on a roll alone. The validator cannot tell which
route is the only one, so it warns about every owned sign-in PC whose effective `lockChance` is between
0 and 1 (authored, or from `locksScreen: "sometimes"` once habits exist): the unlocked session there
depends on a roll, and the author either fixes the chance or makes sure another route exists. This
check ships in the first slice (section 10, step 5), because unlocked sessions do.

## 10. First slice

Chosen by the user: roles on NPCs, identity-bearing sign-in details with ACL doors, per-account PC
contents with unlocked sessions, named policy with auto lock, validator checks. The first slice has no
awareness or habits: unlocked sessions run on the PC's `lockChance` / `locksScreenOnLeave` (5.4), and a
sticky note is authored by hand if wanted. Build in this order; each step is testable before the next.

1. **Schema and loader.**
   - Files: `scripts/validate_scenario.rb` (top-level keys `:390-394`, rooms `:405-409`, NPC fields
     `:412-419`, items `:484-510`), `app/models/break_escape/game.rb` (scenario load,
     `stamp_scenario_object_ids!`).
   - Add NPC `role`, `creds` (reading `rfidCard` as `creds.card`; filling `usePayload` from an
     account), `access` on rooms and objects, top-level `accountProfiles`, `policies`,
     `defaultPolicy`, object `lockType: "login"`, `loginPicker`, `policy`, `transfer`, `cloneable`.
     (`lockChance`, `locksScreenOnLeave` and `screenOwner` are workstation fields already.)
   - Extend `stamp_scenario_object_ids!` to walk `accountProfiles`.
2. **Server withholding first**, before any content is authored with a password.
   - Files: `game.rb` (`withhold_npc_secrets!` called from the NPC loop of
     `filter_requires_and_contents_recursive`; `filtered_scenario_for_bootstrap` drops
     `accountProfiles` and ships `policies`, `defaultPolicy` and `access` in the room allow list;
     sign-in objects lose `contents` unconditionally and gain `hasContents`; `capture_secrets_for_client`
     for capture routes), `test/models` and `test/controllers`.
   - Tests: the no-password assertion from 5.6 across `/scenario`, `/room/:id`, `/container/:id`,
     `/capture_secrets` (a forged entry for an NPC with no capture route gets nothing; one with a
     route is served); `update_room` with an added NPC; a card-only NPC keeps its full `rfidCard`.
3. **Server: sessions, sign-in, scope, take, card copy, ACL doors.**
   - Files: `config/routes.rb` (`login`, `logout`, `login_accounts`, `clone_card`),
     `app/controllers/break_escape/games_controller.rb` (new actions; `container` login branch via
     `find_object_in_scenario`; `with_game_lock` list; `unlock` passes `card_ids` and `pc_id`;
     inventory add takes `source_pc_id` and `transfer`; `find_accessible_item`,
     `validate_item_collectible`, `find_object_in_scenario`, `find_container_in_scenario` and
     `filter_container_contents`), `game.rb` (`initialize_player_state` keys, `validate_unlock` ACL
     branch and scope refusal, `find_scenario_object` walks profiles, `login_scope_of`,
     `session_admits?`, session and lockout helpers, tile composer, scenario response carries
     `sessions`).
   - Tests: sign-in success; wrong username gives the wrong password message; lockout after
     `maxAttempts`; sign-out then 403; switching account needs the second password; `/unlock` refuses
     a sign-in PC; reset clears every new key; each claim refusal condition; `/clone_card` conditions
     for an NPC and for a keycard object; role-ACL door with a held keycard, a server-recorded copy, a
     `saved_cards`-only copy (refused) and no `card_ids` (refused); mixed door with a `requires` card
     (today's rule); a PC holding only profiles opens; Copy and Move of a profile file and of a
     PC-local file, each signed in (accepted) and signed out (refused); Move refused where
     `transfer: "copy"`; a copied file still listed on reopening, a moved one gone; a nested folder in
     a sign-in PC refused by `/unlock` and `container` without a session.
4. **Client.**
   - Files, all under `public/break_escape/js/`: `api-client.js` (new calls); `systems/doors.js` (copy
     `access` into `doorProperties`); `systems/unlock-system.js` (return `access` from
     `getLockRequirementsForDoor`; the three-step `rfid` order of 4.1; the `login` case opens the
     sign-in screen or the desktop); `systems/interactions.js` (the keycard object passes its id to
     the minigame; a sign-in PC routes as a container; owner present shows "in use");
     `minigames/password/password-minigame.js` (sign-in mode: account tiles, **Other user**, the
     object's `postitNote`); `minigames/container/container-minigame.js` (Open / Copy / Move dialog;
     header with account and **Sign out**; passes `pc_id` for nested folders);
     `systems/inventory.js` (send `source_pc_id` and `transfer`);
     `minigames/helpers/chat-helpers.js` (pass the NPC id to the minigame);
     `minigames/rfid/rfid-minigame.js` and `minigames/rfid/rfid-data.js` (call `clone_card` from the
     save point); `systems/workstation-state.js` (`isWorkstation` accepts `lockType: "login"`;
     `autoLockMin` timer; send the claim on `accessed`; sign out a claimed session when the owner
     returns or after `autoLockMin` away).
5. **Validator checks** (`scripts/validate_scenario.rb`).
   - Errors: an unresolved person, profile, policy, card or network reference; a profile item id
     shared with another profile item or a room object; `role` or `creds` outside room NPCs; a
     `creds.username` with no password; a `creds.password` in any compiled ink file of the scenario;
     a differing `usePayload.secret` or any `addCapture.secret` on an account holder; an `rfid`
     lock with neither `access` nor `requires`; `access` on a gate door.
   - Warnings: an `access` role no NPC holds; an account whose `needsHome` sign-in PC does not admit
     it; an owned sign-in PC with `lockChance` between 0 and 1 (section 9); a capture route on an
     account holder in a scenario without `social.captures.revealSecret`.
   - Identity reach: for each NPC card and account, list the doors and PCs its identity opens.
     Ordering against the intended route is not computed in this slice (the validator has no
     per-lock depth); that earlier-than warning waits until the dungeon graph exposes a reachable
     order.
6. **Dungeon graph** (`scripts/generate_dungeon_graph.rb`): an identity appears as a key node (Jake's
   card, Jake's sign-in) with edges to the locks it opens.
7. **Proof scenario**: `scenarios/test_access_model`, with three NPCs (finance, staff, IT), a finance
   door with a role-only ACL, three PCs (one with `lockChance: 0`, one with `lockChance: 1`, one
   holding only profiles), a staff profile and a personal profile with a takeable file,
   `corp_default` with `autoLockMin: 5`, and one cloneable card. Then convert one beat of
   `scenarios/lab_physical_pentest/scenario.json.erb`: give Pierce (`pierce`) a role and `creds`, remove
   the inline `usePayload.secret` and `addCapture.secret` (`:829, :835`), and make `staff_pc_2` a sign-in
   PC whose unlocked session the existing capture beat rides on.

Later slices, in order: awareness presets and habits (section 6, including the `locksScreen` fill of
`lockChance` and the `writesDown` note); USB and social media policy fields with work resources and
frustration (5.5, 7.1, 7.2); social media (7.3); networks (8).

## 11. Open questions

None.
