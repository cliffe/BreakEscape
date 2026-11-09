# Access model: identities, roles, logins, policy and networks

Status: **design, decided 2026-11-09** (the user's choices from the options page, plus orchestrator
decisions in section 2 that the user can overrule). Nothing here is built yet.
Background: CyberCIEGE (Irvine, Thompson and Allen, NPS) and its layered model of access, adapted to
Break Escape's physical, puzzle-led play.

How to read this plan: sections 3 to 5 describe what the first slice builds, section 6 lists every
server route it adds or changes with its checks in the order they run, and section 8 is the build
order. Section 9 covers the later slices (habits, work and social media, networks).

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

Not taken: probabilistic resolution of outcomes (puzzles stay deterministic, section 7) and a budget
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
| `staff` role | Every NPC with sign-in details has it implicitly. |
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
  "awareness": "low",                   // later slice, section 9.1
  "habits": { "writesDown": true },     // later slice, section 9.1
  "needsHome": "jake_pc"
}
```

- **Where.** `role` and `creds` are allowed only on room NPCs (`rooms.<id>.npcs[]`). The validator
  errors on them on any other NPC record (top-level `npcs`, `phoneNPCs`, headless `emailRecord`s
  under `social`), because those paths reach the browser unfiltered. Other fields called `role`
  (`social.awarenessEpisode.role`, mail `contacts[].role`) are not NPC records and are not checked.
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
  So an account holder carries no other capture secret: a PIN capture (like Len's `"secret": "4471"`
  in `lab_physical_pentest`) must sit on an NPC without an account.

## 4. ACLs on locks

One field, `access`, wherever a lock can stand:

```jsonc
"access": { "roles": ["finance", "it"], "people": ["dana"] }
```

A card or sign-in passes if its identity's roles intersect `roles`, or its identity is in `people`.
`access` holds role names and NPC ids, nothing secret, so it is sent to the client like `lockType`.
In the first slice only `rfid` locks (doors and objects) and the new `login` lock (section 5) read
it. Keys, PINs and passwords stay as they are.

### 4.1 RFID doors and objects

```jsonc
// rooms.finance_office
{ "locked": true, "lockType": "rfid",
  "requires": ["VISITOR-07"],                 // specific cards, as today (optional)
  "access": { "roles": ["finance"] } }        // plus anyone whose card resolves to finance
```

Unlock rule: a card's id is in `requires`, **or** its identity passes `access`. At least one of the
two fields is required (validator error otherwise). A lock with `requires` only behaves exactly as
today. The server's checks are in section 6 (`POST /unlock`).

**Getting `access` to the client.** The client builds a lock's requirements from fixed field lists,
so `access` is added to each of them:

- doors: the bootstrap's room allow list (`game.rb:819-821`), `doorProperties` (`doors.js:518-544`,
  from the door's lock properties or the connected room, like `requires`) and
  `getLockRequirementsForDoor` (`unlock-system.js:602-615`);
- objects: `getLockRequirementsForItem` (`unlock-system.js:681-691`, chosen at `:115-117`). Room
  data already keeps `access` on objects, because the room filter does not strip it.

**Client.** The `rfid` branch (`unlock-system.js:502-593`) runs in this order for doors and objects:

1. A held card or saved copy matches `requires` (`evaluateRfidCredential`): today's path, unchanged.
2. Otherwise, if the lock has `access`: send **every held `card_id`** (keycards in inventory and the
   card copier's `saved_cards`) as `card_ids` in one unlock request, and drive the UI from the
   server's answer: unlocked, "Access denied", or (reason `uid_only`) the minigame's existing "Reader
   requires full authentication" message. The client does not resolve cards to roles itself, because
   the admitted NPC may be in a room it has not loaded.
3. Otherwise today's "Requires RFID keycard" or card copier flow.

On a mixed lock a `requires` card keeps today's client-trusted rule, so the ACL is only as strong as
the absence of `requires`.

**Gate doors** (a door with a `gate` block, opened by `doors.js:658-670` from `requires` alone) do
not take `access` in the first slice; the validator errors on the combination.

### 4.2 Copying a card, recorded on the server

A card is saved to the card copier in one place: `handleSaveCard` (`rfid-minigame.js:280-300`)
calling `saveCardToCloner` (`rfid-data.js:286`). The `clone_keycard` ink action
(`chat-helpers.js:364-405`) and the keycard object interaction (`interactions.js:883-896`) only open
the minigame. At that save point the client also calls a new route, `POST /clone_card`, naming the
copy's source: `npc_id` (the ink action passes the conversation's NPC id in the minigame parameters)
or `object_id` (the keycard object passes its id). The client sends no `card_id`: the server
records the source's own card (the NPC's `creds.card` or the keycard object's), so a copy can only
ever carry an identity the scenario gave that source. The checks are in section 6.

The record is `player_state.serverClones[card_id] = { source: { npc | object: id }, uidOnly }`.
`uidOnly` is true for a `MIFARE_DESFire` card: the copier cannot recover a DESFire master key
(`rfid-data.js:63` sets `masterKeyKnown` false), so the copy is UID-only, as the minigame already
treats it (`rfid-minigame.js:192-214`). The ACL check refuses a UID-only copy at a lock without
`"acceptsUIDOnly": true`. A held keycard item is the real card and is never UID-only.

`serverClones` is keyed by `card_id` and records only cards the scenario defines, so it is bounded
by the scenario; the copier's 50-card limit (`rfid-data.js:18`, `game.rb:1817`) applies to the
client list only. Deleting a card from the copier's list does not remove the record. `serverClones`
is cleared by a game reset.

**What it proves.** `encounteredNPCs` is filled for every NPC in a room when the room loads
(`games_controller.rb:1608-1650`), so the NPC check means "the player has entered the NPC's room",
not "is talking to them"; the server cannot see positions. It is a tightening, not a genuine
identity check: a modified client can still call the route for any NPC whose room it has entered.
A puzzle that must not be possible to get past should rest on a fact the server checks itself: a
keycard item held, or a password or PIN typed and checked on the server. Captures (5.6) are
client-reported and do not count. The `saved_cards` list stays client-written and drives only the
card copier's UI.

## 5. PCs: sign-in, sessions and profiles

### 5.1 Profiles (desktop contents that follow an account)

Contents that belong to an account rather than a machine are declared once, at scenario level, under
`accountProfiles` (the name keeps it apart from the social media browser's social `profiles`):

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
- **Lookups and scope.** The four object lookups walk `accountProfiles` recursively as well as the
  rooms: `find_scenario_object` (`game.rb:1340`), `find_object_in_scenario` and
  `find_container_in_scenario` (`games_controller.rb:1676-1720`) and `find_accessible_item`
  (`games_controller.rb:1993`). Each found object reports its **scope** (the sign-in PC it sits
  under, the profile it belongs to, or none) and its **path** (the containers between that PC or
  profile and the object). One helper, `login_scope_of(object_id)`, returns both.
- **Who may reach a scoped object.** `session_admits?(scope)` holds when the scope is a sign-in PC
  with a current session, or a profile whose `for` admits the identity of any current session.
  `path_unlocked?(path)` holds when every container on the path that is `locked` in the scenario is
  in `unlockedObjects` (the sign-in PC itself is never on the path; its gate is the session). Every
  route that reaches a scoped object checks both (section 6).

**Taking files.** `takeable: false` items stay on the PC and open in place. Clicking a takeable
digital file opens a small **desktop-themed dialog** in the PC's window chrome: **Open**, **Copy to
inventory**, **Move to inventory**, **Cancel** (only **Open** once the file is held). A scenario can
restrict the choice per item (`"transfer": "copy" | "move" | "both"`, default `both`). This changes
`container-minigame.js:453-456`, where a `text_file` always opens the viewer.

- *Move*: as the engine does today; the file leaves the PC and its profile everywhere, because held
  items are dropped from container listings.
- *Copy*: the file stays on the PC and in its profile on every PC. The server records the id in
  `player_state.copiedItems` (a set of item ids). `filter_container_contents`
  (`games_controller.rb:1736-1762`) keeps a held item whose id is in `copiedItems`; the content
  compose step (5.3) uses that filter. Genuinely moved items are still filtered.

Today the inventory add (`inventory.js:445-470`, server `games_controller.rb:954-994`) carries only
`action_type`, `item` and `source_npc_id`, and `find_accessible_item` resolves a PC file to a
container that must be in `unlockedObjects` (`games_controller.rb:1884-1890`), which sign-in never
writes. So the add from a sign-in desktop also sends `source_pc_id` and `transfer`; with
`source_pc_id`, `find_accessible_item` searches that PC's own contents and every profile, giving
location `{ type: 'login_pc', pc_id, path }` or `{ type: 'profile', profile_id, path }`. Without it,
the generic search skips sign-in PCs' contents and profiles. The checks are in section 6.

### 5.2 The PC object

```jsonc
{ "id": "jake_pc", "type": "pc", "name": "Jake's PC",
  "locked": true, "lockType": "login",
  "access": { "roles": ["staff"] },          // who may sign in here (default: every account)
  "policy": "corp_default",
  "loginPicker": "accounts",                 // "accounts" (default) | "known" | false
  "lockChance": 0.5,                         // unattended screen rule, 5.4 (optional)
  "contents": [ /* local files, optional */ ] }
```

- **Owner.** `needsHome: "jake_pc"` on Jake makes it his preferred station and the PC's **owner**
  (`ownerOf`, `workstation-state.js:52-58`, or an explicit `screenOwner`). A PC may have no owner (a
  shared or hot-desk PC).
- A sign-in PC stays `locked: true` in every room response for the whole game: the session, not the
  object, is what opens it. It never enters `unlockedObjects`.
- A `lockType: "login"` PC **with an owner** is a workstation (`isWorkstation`,
  `workstation-state.js:46-49`, learns it), so its owner's comings and goings are tracked. A PC with
  no owner is not a workstation: it always opens the sign-in screen and never offers a claim.

### 5.3 Sessions and content

**State.** All in `player_state`, so all dropped by `reset_player_state!`, which keeps only its allow
list of keys (`game.rb:89-107`); `initialize_player_state` (`game.rb:3076`) gives the new keys empty
defaults.

| Key | Shape | Meaning |
|---|---|---|
| `sessions` | `{ pcId: identityId }` | Who is signed in at each sign-in PC right now |
| `signedInPcs` | set of PC ids | Every sign-in PC the player has ever signed in to (for tasks) |
| `loginFailures` | `{ "pcId\|identityId": n }` | Failed password tries, counted on the server |
| `loginLockouts` | `["pcId\|identityId", ...]` | Accounts locked out of that PC by `maxAttempts` |
| `copiedItems` | set of item ids | Section 5.1 |
| `serverClones` | `{ card_id: { source, uidOnly } }` | Section 4.2 |

**The gate is the session, never `unlockedObjects`.** The generic unlock path (`unlock_object!`,
`games_controller.rb:901`; container gate `check_container_unlocked`, `:1727-1734`) records an id
permanently, so it cannot sign out, cannot make a second account supply its own password, and would
keep serving the first identity's desktop. Sign-in therefore has its own routes (`/login`,
`/logout`, section 6) and `/unlock` refuses a sign-in PC for every method. Signing in as someone
else at the same PC replaces the session, but only after that account's own password (or a valid
claim), so switching accounts is never free: moving to an account with more access is the step that
matters.

**Content.** `container` (`games_controller.rb:513`) looks a sign-in PC up with
`find_object_in_scenario` (`:1688`), not `find_container_in_scenario`, because a PC holding only
profiles has no `contents` of its own (`:1676-1677, 1719`). With a session it composes the response
for that identity: the PC's own `contents`, then each admitted profile, through
`filter_container_contents`. A sign-in PC's `contents` are left out of every room response
unconditionally (not only when `locked`), so the "unlocked containers keep their contents" rule
cannot ship them, and the room data marks it `hasContents: true` so the client routes it as a
container (`interactions.js:1524-1534`). The `login` case in `unlock-system.js` then opens the
sign-in screen, or the desktop when the client holds a session for it.

**Sign-in screen.** The password minigame gains a sign-in mode: account tiles, **Other user** (type
a username) in every mode, and the PC object's own `postitNote` (as objects already do,
`unlock-system.js:341`). In sign-in mode it has no attempt limit of its own (today it defaults to
`maxAttempts || 3`, `unlock-system.js:340`): it shows the server's `attemptsLeft` and stops only
when the server reports a lockout ("This account is locked on this PC").

**Account tiles.** `loginPicker` sets which tiles the sign-in screen shows.

| `loginPicker` | Tiles |
|---|---|
| `"accounts"` (default) | Every account the PC's `access` admits |
| `"known"` | Admitted accounts whose NPC is in `encounteredNPCs` (the player has entered their room) |
| `false` | None: the player types the username, as on a hardened PC |

The server composes the tiles, sent in the sign-in PC's room response entry as `loginAccounts` and
refreshed by `GET /login_accounts` when the screen opens (because `known` changes as the player
explores). Each tile is `{ username, displayName, portrait, avatar }` and nothing else: `portrait`
is the talk image person-chat would use for that NPC (`spriteTalk`, else the path derived from its
sprite, `person-chat-portraits.js:375-387`), and `avatar` is the NPC's `avatar` or null. The client
cannot build this list itself because the admitted NPCs may be in rooms it has not loaded. The
client draws a tile as person-chat does: a square image of at least 256 pixels with even sides is a
2x2 talk sheet, so only its top-left frame (closed mouth) is shown (the `_isTalkSheet` rule,
`person-chat-portraits.js:523-528`); if the portrait fails to load it tries `avatar`, then shows the
display name's initials.

**Events and tasks.** On a successful sign-in the client emits `pc_signed_in:<pcId>` with
`{ pcId, npcId, username, via: "password" | "claim" }`, and on sign-out `pc_signed_out:<pcId>` with
`{ pcId, npcId }`. Scenarios map these like any other event. An `unlock_object` task whose target is
a sign-in PC is met when the PC is in `signedInPcs` (`complete_task!`, `game.rb:1565-1568`), and the
objectives manager treats `pc_signed_in` like `item_unlocked` for that task
(`objectives-manager.js:303-306`), so "get into Jake's PC" works as authors will write it.

**Reload.** Sessions live on the server, so they survive a reload. The scenario response carries
`sessions` as `{ pcId: { username, displayName } }` (as it carries `savedGlobalVariables`). On load
the client marks those PCs as signed in; opening one calls `container`, and a 403 (for example after
a reset) drops it back to the sign-in screen. The desktop header shows the signed-in account with a
**Sign out** button.

### 5.4 Unlocked sessions

The first slice drives unlocked sessions from the workstation fields a PC already has; the
`locksScreen` habit (section 9.1) later only fills those fields in. All of this applies only to a
sign-in PC with an owner.

**Owner present.** The owner counts as present when all of these hold: the needs system tracks them
(`npcNeedsSystem.getState(ownerId)` is not null, `npc-needs.js:1346`), that state has `atPost: true`,
and they are not knocked out (`npcHostileSystem.isNPCKO`, `npc-hostile.js:90`). Then the client shows
"<owner's displayName> is using this PC" and opens nothing. `onInteract` (`workstation-state.js:167-172`)
gains this test before its away record check, and returns `attended` only when it holds.

**Owner not present.**

- **Owner left their post** (`npc_left_post`, as today): the workstation layer decides whether the
  screen locks (`decideLocked`, `workstation-state.js:65-74`): `lockChance` (0 to 1, seeded roll)
  wins; without it, `locksScreenOnLeave` (default true, so a PC with neither field always locks, the
  safe default). Policy `autoLockMin` (5.5) then locks an open screen after that many game minutes.
- **Owner knocked out**: the workstation layer also listens for `npc_ko:<id>` (`npc-hostile.js:352-354`)
  and treats it as leaving, so the same screen rule applies.
- **Owner never tracked or moved by a script** (no needs, or needs suspended by a script,
  `npc-needs.js:333-344`, with no away record): the screen counts as locked. The PC opens the
  sign-in screen and offers no claim.

**Owner away, screen open** (`onInteract` returns `accessed`): the client sends the claim, and on
success opens the owner's desktop. When the owner returns (`workstation_owner_returned:<pcId>`), or
after `autoLockMin` game minutes away from that PC, the client ends the claimed session with
`POST /logout`.

**The claim** is `POST /login` with `claim: "owner"` (section 6). The server honours it **only where
the scenario makes one possible**. Beyond that it is a client claim, because the server cannot see
NPC positions or the seeded roll. The client sends the workstation globals (`<id>_screen_locked`,
`<id>_owner_away`) with the claim and the server logs them. A modified client can therefore claim a
session wherever the scenario allows one, so the validator warns (section 7) about any owned sign-in
PC whose session rests on a roll.

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
| `autoLockMin` | Game minutes (the needs system's clock) after the owner leaves before an open screen locks, **whatever `lockChance` or the habit say**. Teaches that a technical control beats a human habit. `0`: the screen locks at once, so no claim is possible. The client also signs the player out of a claimed session after this long away from that PC (a game rule the server does not enforce). `null`: no auto lock. |
| `maxAttempts` | Server-counted failed sign-ins before that account is locked out on that PC. The lockout is per PC and account, and lasts until a game reset (a helpdesk recovery route is in the backlog). `null`: no limit. |
| `usb` | `"blocked"`: USB-tagged items are not accepted at that PC. Later slice (9.2). |
| `social` | `"blocked"`: the PC is not a `social` affordance. Later slice (9.2). |

A PC with no `policy` uses `defaultPolicy`; with neither, everything is allowed and nothing auto locks
(today's behaviour). Policies hold no secrets and are sent in the bootstrap.

### 5.6 What the browser never receives

The withholding lives in the server code that ships the data, so every route inherits it.

| Path | Withheld |
|---|---|
| Lazy room data, `GET /room/:id` (`filtered_room_data`, `game.rb:909`) | NPCs are reached by the `obj['npcs']&.each` loop of `filter_requires_and_contents_recursive` (`game.rb:3011`). A helper, `withhold_npc_secrets!(npc)`, called on each NPC in that loop before it recurses, deletes `creds`, `awareness`, `habits`, `role` and `workarounds`, and for an NPC with an account `usePayload.secret` and every `addCapture.secret` in its `eventMappings`; it sets the derived `rfidCard` (section 3). The same loop recurses `npcs`, `itemsHeld`, `tableItems` and `contents`, so nested NPCs are covered, and NPCs added by `update_room` (`room_states.npcs_added`, `game.rb:957-960`) are merged before the filter runs. |
| Bootstrap, `GET /scenario` (`filtered_scenario_for_bootstrap`, `game.rb:794`) | Rooms are already reduced to an allow list with no room NPCs. Delete the top-level `accountProfiles`. `creds` and `role` cannot appear in the parts it ships as authored, because the validator allows them on room NPCs only (section 3). |
| Sign-in PC contents and profiles | Left out of room responses unconditionally and served only by `container` against a session (5.3). |
| Ink, `GET /ink` (`games_controller.rb:547`) | Serves compiled ink verbatim, so a password written in ink text is public. The validator errors when any NPC's `creds.password` appears in any compiled ink file of the scenario. A character who gives a password away does so through a capture, not ink text. |
| Captures, `GET /capture_secrets` | Only for an NPC with a capture route; see below. |
| Account tiles | `{ username, displayName, portrait, avatar }` only (5.3). |
| Events | `npc_used` events carry the NPC's `usePayload`; with the withholding above, an account holder's `usePayload` holds the address and host only. |

**Captures.** A capture entry in `se_captures` is client-reported: the client writes it into globals
and the server persists it (`game.rb:863-876`). `capture_secrets_for_client` (`game.rb:869`) is
extended so that, under the same `social.captures.revealSecret` switch, it also answers for an
account holder, but only one the scenario gives a **capture route**: an `eventMappings[].addCapture`
on that NPC, or a `usePayload` the loader filled from `creds`. An earned entry whose `address` equals
that NPC's `creds.username` is answered with `creds.password`, keyed by the entry's `targetId` like
landing-page captures. Today the method returns `{}` when no landing page carries a secret
(`game.rb:896`); that return becomes "skip the landing-page pass", so a scenario with no
`landingPages` (like `lab_physical_pentest`) still gets the account-holder pass. No other NPC's
password is ever served, and the existing single-secret fallback counts landing-page captures only.
The client's capture views already take the served map (`displaySecret`, `captures.js:83-110`). A
modified client can still read the password of an NPC with a capture route by forging an entry;
that is why captures do not count as server-established facts (4.2).

**Deliberate clues.** A note, document or `postitNote` an author writes on purpose ships like any
other clue; the withholding covers `creds`, not clues. The server fill of a sticky note from
`creds.password` belongs to the `writesDown` habit, in a later slice (9.1).

## 6. Server routes

Every route the first slice adds or changes, with its checks in the order they run. A failed check
stops the request. Routes marked "locked" are in the `with_game_lock` list
(`games_controller.rb:84`).

**Shared check, "PC reachable":** the PC exists, is `lockType: "login"`, and its room is unlocked or
never locked.

| Route | Parameters | Checks, in order | Writes and answer |
|---|---|---|---|
| `POST /login` (new, locked) | `pc_id`, `username`, `password` | 1. PC reachable. 2. The username belongs to an account (section 3). 3. That account is not in `loginLockouts` for this PC. 4. The password equals that NPC's `creds.password`. 5. The PC's `access` admits that identity (no `access`: every account). | Success: `sessions[pcId] = identityId`, add to `signedInPcs`, clear that account's failures; answer `{ username, displayName }`. Any failure of 2 to 5: one message, "Incorrect username or password", with `attemptsLeft` (an unknown username reports the policy's full allowance, so it reads the same as a known one). For a known username, increment `loginFailures`; at the policy's `maxAttempts` add the account to `loginLockouts` and answer `lockedOut: true`. |
| `POST /login` with a claim (new, locked) | `pc_id`, `claim: "owner"`, the two workstation globals | 1. PC reachable. 2. The PC has an owner (`screenOwner`, or an NPC with it as `needsHome`). 3. The owner has an account. 4. The PC's `access` admits the owner. 5. The PC does not always lock: refused when `lockChance` is 1, or `lockChance` is unset and `locksScreenOnLeave` is not `false`. 6. The PC's policy does not have `autoLockMin: 0`. | Success: `sessions[pcId] = ownerId`, add to `signedInPcs`, log the globals. Failure: "Sign in required"; the client shows the sign-in screen. |
| `POST /logout` (new, locked) | `pc_id` | None. | Delete `sessions[pcId]`. |
| `GET /login_accounts` (new) | `pc_id` | 1. PC reachable. | The tiles for the PC's `loginPicker` (5.3). |
| `POST /clone_card` (new, locked) | `npc_id` or `object_id` | 1. The server-side inventory holds an `rfid_cloner`. 2. For an NPC: a room NPC with `creds.card`, in `encounteredNPCs`, not `"cloneable": false`. For an object: a keycard with a `card_id`, in a room that is unlocked or never locked, not `"cloneable": false`. | `serverClones[card_id]` from the source's own card, with `uidOnly` (4.2). |
| `POST /unlock` (changed, locked) | as today, plus `card_ids` for an `rfid` lock with `access` | 1. **Before any other check**, including the "already in `unlockedObjects`" return (`game.rb:1186-1189`) and the `npc` and `flag_reward` methods (`:1210-1213`, `:1223-1227`): refuse a `lockType: "login"` object for every method; refuse an object with a scope (5.1) unless `session_admits?(scope)` holds and `path_unlocked?` holds for the containers above it. 2. An `rfid` lock with `access` (doors `game.rb:1156-1161`, objects `:1245-1248`): with `card_ids`, each card in turn, and the first that passes unlocks. A card passes when it is **held** (a keycard item in the server's inventory whose scenario definition carries that `card_id`, or a key of `serverClones`), is not a UID-only copy at a lock without `acceptsUIDOnly: true`, **and** its id is in `requires` or equals the `creds.card.card_id` of an NPC whose identity passes `access`. Without `card_ids` (today's trusted claim): accepted only when the lock has `requires`; refused on `access` alone. 3. Everything else as today. | As today. A refusal for a UID-only copy carries reason `uid_only`. |
| `GET /container/:id` (changed, locked) | as today | A sign-in PC: 1. PC reachable. 2. `sessions[pcId]` is set (otherwise 403); `unlockedObjects` is ignored. An object with a scope (a folder in a PC or profile): 1. `session_admits?(scope)`. 2. `path_unlocked?` for its path and itself. Anything else: as today. | A sign-in PC: its own `contents`, then each profile admitted for the session's identity, through `filter_container_contents`. A scoped folder: its contents, through the same filter. |
| `POST /inventory` add (changed, locked) | as today, plus `source_pc_id` and `transfer: "copy" \| "move"` from a sign-in desktop | With `source_pc_id`: 1. The PC is `lockType: "login"` and `sessions[source_pc_id]` is set. 2. The item is found in that PC's own contents or in a profile. 3. `session_admits?` for the item's scope, through that PC's session. 4. `path_unlocked?` for the item's path. 5. The item is takeable. 6. Its `transfer` allows the choice. Without `source_pc_id`: as today, and the search skips sign-in PCs' contents and profiles. | The item joins the inventory; on `copy`, its id joins `copiedItems` in the same request. |
| `POST /complete_task` (changed, locked) | as today | An `unlock_object` task whose target is a sign-in PC: the PC is in `signedInPcs`. Otherwise as today. | As today. |
| `GET /scenario` (changed) | as today | As today. | Adds `policies`, `defaultPolicy`, `sessions` (5.3) and `access` in the room allow list; drops `accountProfiles` (5.6). |
| `GET /room/:id` (changed) | as today | As today. | NPC withholding (5.6); a sign-in PC loses `contents` and gains `hasContents: true` and `loginAccounts`. |
| `GET /capture_secrets` (changed) | as today | As today, then the account-holder pass (5.6). | The served map. |

`login` is not added to `UNLOCK_METHODS_BY_LOCK_TYPE` (`game.rb:1035-1044`); check 1 of `/unlock` is
what keeps a sign-in PC shut there.

**No-password test.** A server test asserts that for a scenario with an account-holding NPC (with
`usePayload`, an `eventMappings` capture, a profile and a sign-in PC, and no authored note holding the
password), no response from `/scenario`, `/room/:id`, `/container/:id` (signed out),
`/login_accounts` or `/capture_secrets` (with no entry, and with a forged entry for an NPC that has
no capture route) contains the password string.

## 7. Determinism

All chance uses the needs system's seeded `roll` (as `lockChance` does), so a given seed always plays
the same way. No puzzle-critical opening may depend on a roll alone. The validator cannot tell which
route is the only one, so it warns about every owned sign-in PC whose effective `lockChance` is
between 0 and 1 (authored, or from `locksScreen: "sometimes"` once habits exist): the unlocked
session there depends on a roll, and the author either fixes the chance or makes sure another route
exists. This warning ships in the first slice (section 8, step 5), because unlocked sessions do.

## 8. First slice

Chosen by the user: roles on NPCs, identity-bearing sign-in details with ACL doors, per-account PC
contents with unlocked sessions, named policy with auto lock, validator checks. The first slice has
no awareness or habits: unlocked sessions run on the PC's `lockChance` / `locksScreenOnLeave` (5.4),
and a sticky note is authored by hand if wanted. Build in this order; each step is testable before
the next.

### Step 1. Schema and loader

Files:
- `scripts/validate_scenario.rb`: top-level keys (`:390-394`), rooms (`:405-409`), NPC fields
  (`:412-419`), items (`:484-510`).
- `app/models/break_escape/game.rb`: scenario load, `stamp_scenario_object_ids!`.

Work:
- Accept NPC `role` and `creds`; read `rfidCard` as `creds.card`; fill `usePayload.address` and
  `usePayload.secret` from an account.
- Accept `access` on rooms and objects; top-level `accountProfiles`, `policies`, `defaultPolicy`;
  object `lockType: "login"`, `loginPicker`, `policy`, `transfer`, `cloneable`, `acceptsUIDOnly`.
  (`lockChance`, `locksScreenOnLeave` and `screenOwner` are workstation fields already.)
- Extend `stamp_scenario_object_ids!` to walk `accountProfiles`.

### Step 2. Server withholding

Before any content is authored with a password.

Files:
- `app/models/break_escape/game.rb`: `withhold_npc_secrets!` called from the NPC loop of
  `filter_requires_and_contents_recursive`; `filtered_scenario_for_bootstrap` drops
  `accountProfiles` and ships `policies`, `defaultPolicy` and `access` in the room allow list; sign-in
  objects lose `contents` unconditionally and gain `hasContents`; `capture_secrets_for_client` moves
  its landing-page early return and adds the account-holder pass.
- `test/models`, `test/controllers`.

Tests:
- The no-password test (section 6).
- `/capture_secrets` serves an account holder with a capture route in a scenario with no
  `landingPages`; a forged entry for an NPC with no capture route gets nothing.
- `update_room` with an added NPC is withheld; a card-only NPC keeps its full `rfidCard`.

### Step 3. Server routes

Files:
- `config/routes.rb`: `login`, `logout`, `login_accounts`, `clone_card`.
- `app/controllers/break_escape/games_controller.rb`:
  - the new actions, and `login`, `logout`, `clone_card` in the `with_game_lock` list;
  - `container`: the sign-in branch via `find_object_in_scenario`, and the scoped-folder checks;
  - `unlock` passes `card_ids`;
  - inventory add takes `source_pc_id` and `transfer`;
  - `find_accessible_item`, `find_object_in_scenario`, `find_container_in_scenario` walk profiles
    and return scope and path;
  - `validate_item_collectible` gains the `login_pc` and `profile` checks;
  - `filter_container_contents` keeps `copiedItems`.
- `app/models/break_escape/game.rb`:
  - `initialize_player_state` and the reset allow list: the six new keys;
  - `validate_unlock`: the scope and `login` refusal first, then the `rfid` `access` branch with
    `serverClones` and `acceptsUIDOnly`;
  - `find_scenario_object` walks profiles;
  - `login_scope_of`, `session_admits?`, `path_unlocked?`;
  - session, failure and lockout helpers; tile composer; the scenario response carries `sessions`;
  - `complete_task!`: `unlock_object` on a sign-in PC reads `signedInPcs`.

Tests:
- Sign-in: success; a wrong username gives the wrong password message and the same `attemptsLeft`;
  lockout after `maxAttempts`; sign-out then 403; switching account needs the second password; a PC
  holding only profiles opens; reset clears every new key.
- `/unlock` refuses a sign-in PC for `unlocked`, `npc` and `flag_reward`; a locked archive in a
  profile, unlocked while signed in, is refused by `/unlock` and `container` after sign-out.
- Each claim refusal condition, including an unreachable or unowned PC.
- `/clone_card` for an NPC and for a keycard object, each condition; the recorded `card_id` is the
  source's own.
- Role-ACL door with a held keycard, a server-recorded copy, a `saved_cards`-only copy (refused) and
  no `card_ids` (refused); a UID-only DESFire copy refused without `acceptsUIDOnly` and accepted with
  it; mixed door with a `requires` card (today's rule); the same for an `rfid` object with
  role-only `access`.
- Copy and Move of a profile file and of a PC-local file, each signed in (accepted) and signed out
  (refused); Move refused where `transfer: "copy"`; a copied file still listed on reopening, a moved
  one gone; a file inside a locked archive in a profile refused before the archive is unlocked and
  accepted after.
- An `unlock_object` task on a sign-in PC completes after a sign-in and not before.

### Step 4. Client

Files, all under `public/break_escape/js/`:
- `api-client.js`: the new calls.
- `systems/doors.js`: copy `access` into `doorProperties`.
- `systems/unlock-system.js`: return `access` from `getLockRequirementsForDoor` and
  `getLockRequirementsForItem`; the three-step `rfid` order (4.1), including the `uid_only` message;
  the `login` case opens the sign-in screen or the desktop; sign-in mode passes no attempt limit.
- `systems/interactions.js`: the keycard object passes its id to the minigame; a sign-in PC routes as
  a container; an `attended` answer shows "<name> is using this PC" and stops the interaction.
- `systems/workstation-state.js`: `isWorkstation` accepts a `lockType: "login"` PC with an owner;
  `onInteract` tests owner presence first (5.4); `npc_ko:*` counts as leaving; the `autoLockMin`
  timer; send the claim on `accessed`; sign out a claimed session when the owner returns or after
  `autoLockMin` away.
- `minigames/password/password-minigame.js`: sign-in mode (tiles drawn as in 5.3, **Other user**,
  the object's `postitNote`, `attemptsLeft` and lockout from the server); emit `pc_signed_in` and
  `pc_signed_out`.
- `minigames/container/container-minigame.js`: the Open / Copy / Move dialog; header with account
  and **Sign out**.
- `systems/inventory.js`: send `source_pc_id` and `transfer`.
- `systems/objectives-manager.js`: `pc_signed_in` meets an `unlock_object` task on that PC.
- `minigames/helpers/chat-helpers.js`: pass the NPC id to the minigame.
- `minigames/rfid/rfid-minigame.js`, `minigames/rfid/rfid-data.js`: call `clone_card` from the save
  point.

Nested folders need no new client parameter: the server admits a scoped object when any current
session admits its scope (5.1), so `notifyServerUnlock` (`unlock-system.js:25-45`) and the password
minigame's server check send what they send today.

### Step 5. Validator checks

In `scripts/validate_scenario.rb`.

Errors:
- an unresolved person, profile, policy or card reference;
- a profile item id shared with another profile item or a room object;
- `role` or `creds` on an NPC record other than a room NPC;
- a `creds.username` with no password;
- a `creds.password` in any compiled ink file of the scenario;
- a differing `usePayload.secret`, or any `addCapture.secret`, on an account holder;
- an `rfid` lock with neither `access` nor `requires`; `access` on a gate door;
- an NPC `unlockable` list or an `unlock_object` flag reward naming a sign-in PC.

Warnings:
- an `access` role no NPC holds;
- an account whose `needsHome` sign-in PC does not admit it;
- an owned sign-in PC with `lockChance` between 0 and 1 (section 7);
- an owned sign-in PC whose owner has no `needs` (no unlocked session is ever possible there);
- a sign-in PC under a policy with a `maxAttempts`, because a lockout lasts the mission: the author
  confirms another route exists;
- a capture route on an account holder in a scenario without `social.captures.revealSecret`.

Identity reach: for each NPC card and account, list the doors and PCs its identity opens. Ordering
against the intended route is not computed in this slice (the validator has no per-lock depth); an
"opens a lock earlier than intended" warning waits until the dungeon graph exposes a reachable order.

### Step 6. Dungeon graph

`scripts/generate_dungeon_graph.rb`: an identity appears as a key node (Jake's card, Jake's sign-in)
with edges to the locks it opens.

### Step 7. Proof scenario and one converted beat

`scenarios/test_access_model`:
- three NPCs (finance, staff, IT), each with `needs`;
- a finance door with a role-only ACL, and an `rfid` cabinet with a role-only ACL;
- three sign-in PCs: one owned with `lockChance: 0`, one owned with `lockChance: 1`, one unowned
  holding only profiles;
- a staff profile, and a personal profile with a takeable file and a password-locked archive;
- `corp_default` with `autoLockMin: 5`;
- one cloneable card;
- an `unlock_object` task on one sign-in PC.

Then convert one beat of `scenarios/lab_physical_pentest/scenario.json.erb`: give Pierce (`pierce`,
who has `needs` and `screenOwner` on `staff_pc_2`) a role and `creds`, remove the inline
`usePayload.secret` and `addCapture.secret` (`:829, :835`), and make `staff_pc_2` a sign-in PC whose
unlocked session the existing capture beat rides on. Its `locksScreenOnLeave: false` (`:925-935`)
means the claim is allowed.

## 9. Later slices

In order: awareness presets and habits (9.1, including the `locksScreen` fill of `lockChance` and the
`writesDown` note); USB and social media policy fields with work resources and frustration (9.2);
social media (9.2); networks (9.3).

### 9.1 Awareness and habits

```jsonc
{ "id": "jake", "awareness": "low", "habits": { "writesDown": true, "password": "guessable" } }
```

The preset fills every habit; `habits` overrides any of them. The validator can print the expanded
habits for each NPC so authors see what they got.

| Habit | Values | Effect, using existing systems where possible |
|---|---|---|
| `locksScreen` | `never`, `sometimes`, `always` | Fills the owned PC's `lockChance` when the PC sets none: `never` = 0, `sometimes` = 0.5 (seeded), `always` = 1. An explicit `lockChance` on the PC wins. Policy `autoLockMin` still applies. The claim rules and validator warning (5.4, 7) then work unchanged. |
| `writesDown` | bool | The server fills the owned sign-in PC's `postitNote` (and `showPostit`) from `creds.password` in room data. This deliberately ships the password, so the no-password test (section 6) runs on a scenario without it. |
| `password` | `strong`, `guessable`, `reused` | Authoring intent the validator checks. `guessable`: at least one intel fact or social media post must point at it (it suits the `password-guesser` scene's `patternSlots`). `reused`: the same password appears in another sign-in, lock or scene. |
| `holdsDoors` | bool | The NPC lets the player through gate doors they open (`door-gates.js` `openFor` plus the tailgate beat). |
| `phishable` | `low`, `medium`, `high` | Expands into the NPC's `social.phishTargets` defaults: how many `requiredFactors`, how broad `primedFor.trusts`, `runsExecutable`. Only applies if the NPC is also a phish target. |
| `pretextable` | `low`, `medium`, `high` | Expands into `social.pretextNpcs` defaults: `susceptibility` deltas per technique, whether asks have `verification`, `tuning.maxRefusals`. |
| `challengesStrangers` | bool | Expands into influence thresholds (how soon they go `wary`, `refuses`, `reports`), plus a physical beat later (asking an unbadged player for ID). |

Presets, proposed defaults to tune in the first scenario that uses them:

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
those. When an NPC also appears in those blocks, the preset supplies **defaults** for fields the
author left out, and anything written explicitly wins. The SE systems still install only when
`social.characters` exists, so missions without them are unaffected. What awareness adds that SE has
no equivalent for is the physical and sign-in hygiene layer: screen locking, sticky notes, holding
doors and password reuse across systems.

### 9.2 Work, frustration and social media

**Work resources.**

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

- `roles` holds **defaults only** (`workNeeds`, optionally `awareness` and `workarounds`). Grants stay
  in ACLs. An NPC can add or remove: `"workNeeds": ["+printer_2f", "-email"]`.
- A resource can be abstract (on a network) or tied to a physical object (`object`).
- When an NPC completes a `work` use at a PC, the needs system checks each work need. It is met if
  the resource's `access` admits the NPC, the PC's network reaches the resource's network (9.3;
  always true until networks exist), and the resource is not down (`downIf` global false).
- All met: work is restored as now. Any missing: `work` is **not** restored and the NPC's
  frustration rises.

**Frustration and workarounds.** Frustration is a per-NPC level (0 to 100), not a need: it rises on
each failed work use (`frustrationPerFail`, default 25) and falls slowly when work succeeds.
Workarounds fire once each when it crosses their threshold:

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

**Outages.** Any resource or network can name a `downIf` global. A player who cuts a network or jams
the printer sets it, work fails, frustration rises and NPCs leave their desks: a distraction tool.

**Policy fields.** `usb: "blocked"`: the needs system's `accepts` ignores USB-tagged items at that
PC, so dropping one there fails. `social: "blocked"`: the PC is not a `social` affordance.

**Social media need.**

```jsonc
"needs": { "social": { "decayPerMin": 4, "urgentAt": 40 } },
"feed": [
  { "text": "Biscuit turns 5 today! Best boy.", "intel": "jake_pet_name" },
  { "text": "Back from Crete, 300 emails waiting..." }
]
```

(`feed` is the NPC's own posts, kept distinct from the social media browser's
`social.landingPages[].profiles[].posts`.)

- **Where it is satisfied.** The NPC's own phone (always available, used where they stand; a
  phone-in-hand pose) or their PC if its policy allows `social`. Preference: PC if allowed, else
  phone. Using the phone at a desk still counts as away from work but keeps the owner at the post, so
  the screen stays attended.
- **Feed.** Each completed `social` use reveals that NPC's next post into a feed the player can read:
  a `social_feed` object or a phone app. This reuses the reveal-slot idea from the needs system. A
  post's `intel` grants the named `social.intelFacts` entry when read, linking public posts to
  password guessing.
- **Awareness.** With `awareness: high` the validator warns if a post grants intel (high-awareness
  staff shouldn't overshare) unless the post is marked `"deliberate": true`.
- **Blocked.** If `social` is blocked on the PC and the NPC has no phone (`"phone": false`), a social
  use fails and frustration rises.

### 9.3 Networks

```jsonc
"networks": {
  "corp_lan":   { "name": "Office LAN" },
  "guest_wifi": { "name": "Guest Wi-Fi" },
  "server_net": { "name": "Servers", "downIf": "server_net_down" }
},
"networkLinks": [ ["corp_lan", "server_net"] ]      // undirected reach; no per-service rules
```

- PCs, devices and resources carry `network`. A room may set `network` as a default for its objects.
  The validator then errors on an unresolved network reference.
- **Reach**: same network, or joined through `networkLinks`. Rights still come from ACLs; reach is
  the second gate. Firewall rules per service are deliberately left out for now.
- **Wi-Fi**: a `wifi_ap` object with `network` and `psk`. Learning the PSK (a sticky note, a post, a
  pretext call) lets the player's laptop join that network.
- **Jacks**: a `network_jack` object with `network` accepts a rogue device item (tag `rogue_device`);
  plugging one in gives the player reach to that network.
- **What player reach unlocks**: a resource or a VM launcher can require reach (`"requiresReach":
  "server_net"`), so the player must get onto the right network before the next step. This is the
  hook for a later bridge to SecGen VMs.

## 10. Open questions

None.
