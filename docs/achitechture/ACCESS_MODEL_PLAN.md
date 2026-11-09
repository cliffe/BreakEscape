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

User decisions (2026-11-09, clarifications):

| Area | Decision |
|---|---|
| Needs system | The needs system is in active development and this work is part of it. Changing its behaviour is acceptable, provided the change is folded into `scenarios/lab_physical_pentest` and that scenario is playtested. Section 5.4 states each change and what it touches there. |
| `lab_physical_pentest` | It is the first needs-based scenario and has not shipped. Converting `staff_pc_2` to a sign-in PC is fine; the plan says what its desktop holds, where its teaching text goes, and includes a browser playtest of that beat (section 8, step 7). |

Orchestrator decisions (the user can overrule):

| Area | Decision |
|---|---|
| Copied cards | A copy counts toward an ACL door only if the **server recorded the copy** (section 4.2) while the player still holds a card copier, or the card is a keycard item the server holds. The card copier's client-written `saved_cards` list never decides identity. |
| Account tiles | The default account picker is engineering, not an authoring choice: the server composes the tiles for each sign-in PC (section 5.3). |
| Access list refusal | A correct password at a PC whose access list does not admit that account answers "This account can't sign in on this PC", as real systems do; it teaches that access lists are separate from passwords. A wrong password, an unknown username and a locked account never reveal which of them applies: the answer depends only on how many times that username has failed at that PC (section 6, `POST /login`). |
| Shared cards | A `card_id` carried by several NPCs carries every holder's identity: it passes an ACL that admits any of them (section 3). |
| Claimed sessions on reload | A session claimed from an open screen ends on a reload, because the workstation state resets with every owner back at the desk (section 5.3). Password sessions survive a reload. |
| One workstation rule | The presence test, "knocked out at the desk counts as leaving", the unowned result and the auto lock apply to every workstation, not only sign-in PCs, so the workstation layer has one rule (section 5.4). A plain workstation differs from today only when its owner is knocked out at the desk, or its policy sets `autoLockMin`. |
| Tracked owners | An owner is tracked when the needs system registers it: at least one valid `needs` **or** `interests` entry. The client and the server's claim check use the same rule (sections 5.4 and 6). |
| When a claim ends | A claimed session ends when the owner returns, when the screen's auto lock fires (`autoLockMin` game minutes after the owner left), or on a reload. `autoLockMin: 0` locks the screen in the leave roll itself (section 5.5). |

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
- `creds.card` replaces `rfidCard`. The loader (section 8, step 1) treats an existing `rfidCard` as
  `creds.card`, and every server check reads `creds.card || rfidCard`, so a game created before the
  loader existed (its scenario data has `rfidCard` and no `creds`) still works. The client still
  receives `rfidCard` on the NPC, equal to the card as authored (`name`, `card_id`, `rfid_protocol`
  and any protocol fields; a card is not secret, copying it is the game), so `clone_keycard`, the
  conversation's `card_name` variable and the RFID minigame keep working.
- **Identity resolution.** A card or sign-in maps to an identity by value: a card by `card_id`, a
  sign-in by `username`. Nothing on the item needs to name its owner, so a copy (same `card_id`)
  carries the same identity as the original. A card whose `card_id` belongs to no NPC has no
  identity and passes only through `requires`.
- **Usernames are unique.** Usernames are compared trimmed and case-insensitively, as a sign-in
  screen does. The validator errors on two accounts with the same username.
- **Shared cards.** Several NPCs may carry the same `card_id` (in `m10_full_disclosure`, Imran
  Siddiqui and Gary Whitlock both carry `tg_power_room_card`). Such a card carries every holder's
  identity: it passes an ACL that admits any of them. A keycard item may say `"identity": "jake"`
  for readability; the validator checks it names an NPC that carries that `card_id`. The dungeon
  graph draws one key node per `card_id`, labelled with every holder.
- The player has no identity of their own. They act as whoever's sign-in details or session they use.
- **One home for a password.** `creds.password` is the only place an account password is authored,
  and `creds.username` the only place its address is. For an NPC with an account, the loader fills
  `usePayload.address` and `usePayload.secret` from `creds.username` and `creds.password`. The
  validator errors when, on that NPC, the author writes a `usePayload.address` or `usePayload.secret`
  that differs, any `addCapture.secret` in its `eventMappings` (the capture takes its address and
  secret from the `usePayload` overlay, `npc-manager.js:1169-1177`), or an `addCapture.address` that
  differs from `creds.username` (the capture answer in 5.6 matches on it). So an account holder
  carries no other capture secret: a PIN capture (like Len's `"secret": "4471"` in
  `lab_physical_pentest`) must sit on an NPC without an account.

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
  "access": { "roles": ["finance"] },         // plus anyone whose card resolves to finance
  "acceptsUIDOnly": false }                   // optional: whether a UID-only copy opens it
```

Unlock rule: a card's id is in `requires`, **or** its identity passes `access`. At least one of the
two fields is required (validator error otherwise). A lock with `requires` only behaves exactly as
today. The server's checks are in section 6 (`POST /unlock`).

**Getting the lock fields to the client.** The client builds a lock's requirements from fixed field
lists. `access` and `acceptsUIDOnly` are added to each of them (the `rfid` branch already reads
`lockRequirements.acceptsUIDOnly`, `unlock-system.js:514`, and the minigame honours it,
`rfid-minigame.js:42, 197`, but nothing supplies it today):

- doors: the bootstrap's room allow list (`game.rb:819-821`), `doorProperties` (`doors.js:518-544`,
  from the door's lock properties or the connected room, like `requires`) and
  `getLockRequirementsForDoor` (`unlock-system.js:602-615`);
- objects: `getLockRequirementsForItem` (`unlock-system.js:681-691`, chosen at `:115-117`). Room
  data already keeps both fields on objects, because the room filter does not strip them.

**Client.** The `rfid` branch (`unlock-system.js:502-593`) runs in this order for doors and objects:

1. A held card or saved copy matches `requires` (`evaluateRfidCredential`): today's path, unchanged,
   including the minigame's own `acceptsUIDOnly` handling, which now receives the lock's value.
2. Otherwise, if the lock has `access`: send **every held `card_id`** (keycards in inventory and the
   card copier's `saved_cards`) as `card_ids` in one unlock request, and drive the UI from the
   server's answer: unlocked; a refusal carrying `reason: "uid_only"`, shown as the minigame's
   existing "Reader requires full authentication" message; or any other refusal, shown as "Access
   denied". The client does not resolve cards to roles itself, because the admitted NPC may be in a
   room it has not loaded.
3. Otherwise today's "Requires RFID keycard" or card copier flow.

On a mixed lock a `requires` card keeps today's client-trusted rule, so the ACL is only as strong as
the absence of `requires`.

**Gate doors** (a door with a `gate` block, opened by `doors.js:658-670` from `requires` alone) do
not take `access` in the first slice; the validator errors on the combination.

### 4.2 Copying a card, recorded on the server

A card is saved to the card copier in one place: `handleSaveCard` (`rfid-minigame.js:280-300`, from
the read screen's Save button, `rfid-ui.js:767`) calling `saveCardToCloner` (`rfid-data.js:286`).
The read screen and its Save button read only `cardToClone`, which only clone mode sets
(`rfid-minigame.js:45, 272`), and two things start clone mode:

- the `clone_keycard` ink action (`chat-helpers.js:340-405`, starting the minigame at `:398-402`),
  in a conversation;
- clicking a held keycard (`interactions.js:870-896`, which runs only for a keycard with
  `takeable: false`, that is, one already in the inventory, often one an NPC handed over to borrow).

Unlock mode does not save: its **Read** opens the tap screen (`rfid-ui.js:124-130`), and tapping a
held card or saved copy emulates it at the reader (`handleCardTap`, `rfid-minigame.js:101-122`).
Any save path added to unlock mode later must pass a source in the same way.

Each of the two passes the copy's **source** in the minigame parameters: the ink action the
conversation's NPC id (`npc_id`), the keycard click the keycard's object id (`object_id`). When
`saveCardToCloner` reports success (a new card or an update of one already saved), the client calls a
new route, `POST /clone_card`, with the source and the `card_id` it saved; a failed save calls
nothing. The server records **only the source's own card** (the NPC's `creds.card`, or
the keycard object's card) and only when the saved `card_id` equals it; otherwise it records nothing
and answers `recorded: false`. So a copy can only ever carry an identity the scenario gave that
source, and the copy the player sees and the copy the server holds never differ. (A `clone_keycard`
tag can name any card id, and the client saves a placeholder card for one that is not the speaking
NPC's, `chat-helpers.js:381-389`; such a copy works only through `requires`, as today. The validator
warns when the named card is another NPC's card, since the copy will not carry that NPC's identity.)
The checks are in section 6.

The record is `player_state.serverClones[card_id] = { source: { npc | object: id }, uidOnly }`.
`uidOnly` is true for a `MIFARE_DESFire` card: the copier cannot recover a DESFire master key
(`rfid-data.js:63` sets `masterKeyKnown` false), so the copy is UID-only, as the minigame already
treats it (`rfid-minigame.js:192-214`). The ACL check refuses a UID-only copy at a lock without
`"acceptsUIDOnly": true`. A held keycard item is the real card and is never UID-only.

A recorded copy lives on the card copier, so it counts at a lock only while the server inventory
holds an `rfid_cloner`; losing or handing over the copier suspends every recorded copy until the
player holds one again. `serverClones` is keyed by `card_id` and records only cards the scenario
defines, so it is bounded by the scenario; the copier's 50-card limit (`rfid-data.js:18`,
`game.rb:1817`) applies to the client list only. Deleting a card from the copier's list does not
remove the record. `serverClones` is cleared by a game reset.

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
  object, is what opens it. It never enters `unlockedObjects`. On the client a sign-in never calls
  `unlockTarget` and never sets the PC's `locked` to false, so the next click still reaches the
  sign-in path and never sends `method: "unlocked"` (which `/unlock` refuses, section 6).
- Every `lockType: "login"` object is a workstation: `isWorkstation(data)`
  (`workstation-state.js:46-49`) accepts it from the object alone, with no NPC list, so its callers,
  including `lighting.js:620`, are unchanged. An owned one has its owner's comings and goings
  tracked. For an unowned one `onInteract` returns `signin` (5.4), so it always opens the sign-in
  screen and never offers a claim, and the desk indicator stays off because `workstationIndicators`
  already requires an owner (`lighting.js:116`).
- A sign-in PC takes no `triggerOnInteract`: its interaction is the sign-in flow (5.4), which returns
  before that step runs. The validator errors on the combination; scenarios map the sign-in and
  workstation events instead.

### 5.3 Sessions and content

**State.** All in `player_state`. `initialize_player_state` (`game.rb:3076`) gives the new keys
empty defaults. None of them is on the reset's `preserved_keys` list (`game.rb:95-97`, the keys that
survive a reset), so `reset_player_state!` drops them all.

| Key | Shape | Meaning |
|---|---|---|
| `sessions` | `{ pcId: { id: identityId, via: "password" \| "claim" } }` | Who is signed in at each sign-in PC right now, and how |
| `signedInPcs` | set of PC ids | Every sign-in PC the player has ever signed in to (for tasks) |
| `loginFailures` | `{ "pcId\|username": { n, seq } }` | Failed sign-ins per PC and typed username (normalised, section 6), counted on the server. `seq` orders the entries (section 6), because a `jsonb` object keeps no key order |
| `loginLockouts` | `["pcId\|username", ...]` | Usernames locked out of that PC by `maxAttempts`, oldest first (a `jsonb` array keeps its order) |
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

**Client sessions.** One small client module, `systems/pc-sessions.js`, is the only place the client
signs in or out. It keeps the session list (`pcId -> { npcId, username, displayName, via }`, filled
from the server's answers, which carry all four) and the set of signed-in PCs, and wraps the
`api-client.js` calls for `/login` (password and claim) and `/logout`. Every sign-in and sign-out
passes through it: the password screen, the claim from an open screen, the desktop header's **Sign
out**, the end of a claim (the owner's return or the screen's auto lock, 5.4), a 403 from `container`
(the server holds no session, for example after a reset: the module drops it locally without a
request) and the reload rule below. It emits the events below, so they fire once per sign-in and
sign-out whatever caused them. When a session ends while that PC's desktop is open, the desktop
closes with a one-line message: "<owner's displayName> is back at the desk", "The screen locked", or
"Signed out".

**Sign-in screen.** The password minigame gains a sign-in mode: account tiles, **Other user** (type
a username) in every mode, and the PC object's own `postitNote` (as objects already do,
`unlock-system.js:341`). In sign-in mode it has no attempt limit of its own (today it defaults to
`maxAttempts || 3`, `unlock-system.js:340`): it shows the server's message and `attemptsLeft`, and
stops only when the server reports a lockout ("This account is locked on this PC") for the username
typed. It shows no letter-case hint: `/unlock`'s `caseMismatch` (`games_controller.rb:878-880`) is
not copied to `/login`, because it would tell the player which usernames are real accounts. Sign-in
goes through `pc-sessions.js`.

**Account tiles.** `loginPicker` sets which tiles the sign-in screen shows.

| `loginPicker` | Tiles |
|---|---|
| `"accounts"` (default) | Every account the PC's `access` admits |
| `"known"` | Admitted accounts whose NPC is in `encounteredNPCs` (the player has entered their room) |
| `false` | None: the player types the username, as on a hardened PC |

The server composes the tiles in `filtered_room_data` (`game.rb:909`), so every response that
carries room data has them: `GET /room/:id` and the room data a door unlock returns
(`games_controller.rb:888`). They sit on the sign-in PC's entry as `loginAccounts`, and
`GET /login_accounts` refreshes them every time the screen opens. The refresh is required, not an
optimisation: `known` changes as the player explores, and in both responses that carry room data
`filtered_room_data` runs before `track_npc_encounters` (`games_controller.rb:479, 488` and
`:888-892`), so a `"known"` PC's tiles in the first response for its room leave out the NPCs in that
same room. Each tile is `{ username, displayName, portrait, avatar }` and nothing else: `portrait`
is the talk image person-chat would use for that NPC (`spriteTalk`, else the path derived from its
sprite, `person-chat-portraits.js:375-387`), and `avatar` is the NPC's `avatar` or null. The client
cannot build this list itself because the admitted NPCs may be in rooms it has not loaded. The
client draws a tile as person-chat does: a square image of at least 256 pixels with even sides is a
2x2 talk sheet, so only its top-left frame (closed mouth) is shown (the `_isTalkSheet` rule,
`person-chat-portraits.js:523-528`); if the portrait fails to load it tries `avatar`, then shows the
display name's initials.

**Events and tasks.** `pc-sessions.js` emits `pc_signed_in:<pcId>` with
`{ pcId, npcId, username, via: "password" | "claim" }` on a sign-in and `pc_signed_out:<pcId>` with
`{ pcId, npcId }` on a sign-out. Scenarios map these like any other event. An `unlock_object` task
whose target is a sign-in PC is met when the PC is in `signedInPcs` (`complete_task!`,
`game.rb:1565-1568`). The objectives manager treats `pc_signed_in` like `item_unlocked` for that
task (`objectives-manager.js:303-306`), and its load-time reconcile (`objectives-manager.js:247-252`,
today `unlockedObjects` only) also completes it when the PC is in the restored `signedInPcs`, so a
completion request lost before a reload still lands.

**Reload.** Sessions live on the server. The scenario response (the controller's `scenario` action,
`games_controller.rb:267`, beside `savedGlobalVariables` at `:298`) carries `sessions` as
`{ pcId: { npcId, username, displayName, via } }` and `signedInPcs`. An NPC id is not secret (it
already appears in `access` lists the client receives). `core/game.js` hands both to
`pc-sessions.js` where it merges `savedGlobalVariables` (`core/game.js:1652-1654`). The module keeps
password sessions, and signs out every claimed session (`POST /logout`, emitting `pc_signed_out`),
because the workstation state resets on a reload with every owner back at the desk and its away map
empty (`workstation-state.js:93-116`), so the end rules for a claim (5.4) could no longer apply.
Opening a kept PC calls `container`; a 403 drops it back to the sign-in screen. The desktop header
shows the signed-in account (display name and username) with a **Sign out** button, above the PC's
`observations` with `observationVariants` resolved, as every container header shows them today
(`headerObservations`, `container-minigame.js:85`).

### 5.4 Unlocked sessions

The first slice drives unlocked sessions from the workstation fields a PC already has; the
`locksScreen` habit (section 9.1) later only fills those fields in. The presence, knock-out,
unowned and auto lock rules below live in `workstation-state.js` and apply to every workstation;
the claim and the sign-in screen apply only to sign-in PCs.

**Availability in the needs system.** One method, `NPCNeedsSystem.isAvailable(npcId)`, is true when
the sprite exists (`world.npcPos` not null) and `world.npcStatus` reports not `ko`, not `hostile`
and not `hidden` (`npc-needs.js:1510-1524`). `_tickNpc` (`npc-needs.js:557-578`) keeps its order:
decay; with no sprite, return (decay only: no block, no job abort, no home lookup); `_updateHome`;
then `if (!this.isAvailable(id))` replaces the inline status test, aborting the job and setting
`blocked`, and recovery still unblocks and calls `_goHome`. At that point the sprite exists, so the
call is exactly the old status test: the needs system's own behaviour does not change.

**Owner present.** The owner counts as present when all of these hold:

- the needs system tracks them: `npcNeedsSystem.getState(ownerId)` is not null
  (`npc-needs.js:1346`). The needs system registers an NPC with at least one valid `needs` entry
  (`decayPerMin` and `urgentAt` both above 0, `normaliseNeed`, `npc-needs.js:131-135`) **or** one
  valid `interests` entry (weight above 0, `normaliseInterest`, `:150-154`), `register`,
  `:225-241`;
- that state has `atPost: true`;
- `isAvailable(ownerId)`.

An owner removed from the scene (`#remove_npc`, which destroys the sprite), hidden, turned hostile or
knocked out is therefore not present, even though the needs system leaves `atPost` unchanged for
them. The workstation env gains `ownerPresent(id)`, which runs the three tests. `onInteract`
(`workstation-state.js:167-182`) uses it first: present returns `attended`. A stub env without
`ownerPresent` (unit tests) keeps today's rule, so the existing tests pass unchanged.

The needs system registers every NPC with `atPost: true` (`npc-needs.js:264`), so an owner who
spawns away from the desk reads as "using this PC" until its first leave. Owners are authored at
their desk, and the validator warns when an owner is placed in a different room from its PC
(section 8, step 5).

**Owner not present.** `onInteract` then reads the away record:

- **Owner left their post** (`npc_left_post`, as today): the leave roll decides whether the screen
  locked (`decideLocked`, `workstation-state.js:65-74`). The PC's policy (5.5) is read first:
  `autoLockMin: 0` locks the screen in the roll itself. Otherwise `lockChance` (0 to 1, seeded roll)
  wins; without it, `locksScreenOnLeave` (default true, so a PC with neither field always locks, the
  safe default). `onInteract` returns `accessed` (open, emitting `workstation_accessed`) or `locked`
  (emitting `workstation_locked_attempt`), as today.
- **Owner knocked out at the desk**: the workstation layer listens for `npc_ko:<id>`
  (`npc-hostile.js:350-354`) and treats it as leaving, running the leave roll above, but only when
  the needs system tracks the owner and the owner has no current away record. A knock-out while
  already away changes nothing (it neither adds a leave nor re-rolls the screen), and a knock-out of
  an untracked owner sets no away record. A knocked-out NPC stays down (`resetHostilesForRespawn`
  skips it, `npc-hostile.js:112-115`), so the owner never returns; an open screen stays open until
  its auto lock.
- **No away record, or no owner** (the owner is untracked, was moved by a script,
  `npc-needs.js:333-344`, or was removed, hidden or turned hostile while at the desk; or the PC has
  no owner): `onInteract` returns a new value, `signin`, and emits nothing (no
  `workstation_locked_attempt`, which scenarios map to "she locked it while she was away" hints). At
  a sign-in PC the screen counts as locked: it opens the sign-in screen and offers no claim.

`onInteract` returns `accessed` or `locked` only for a tracked owner with an away record. The server
applies the same tracking rule (claim check 3, section 6) and the validator warns about an owned
sign-in PC whose owner is untracked (section 8, step 5).

**Auto lock.** When an owner leaves and the roll leaves the screen open under a policy with
`autoLockMin` above 0, the workstation layer records `lockAt` = the needs clock (`clockMs`) plus
`autoLockMin` game minutes. `NPCNeedsSystem` gains `onTick(fn)`, a listener list called at the end of
`tick()` (`npc-needs.js:378-393`); the workstation layer registers one that, for each open screen
whose owner is still away and whose `lockAt` has passed, sets `screenLocked`, publishes the globals
and emits `workstation_auto_locked:<id>` with `{ objectId, ownerId }`. `onInteract` runs the same
check before it answers, so a stub env with a manual clock behaves the same. The owner's return
clears `lockAt`. The needs clock stands still while a VM is open (`npc-needs.js:309`), and so does
the auto lock.

**What changes for existing scenarios.**

| Change | Before | After | In `lab_physical_pentest` |
|---|---|---|---|
| Needs ticks | Inline status test in `_tickNpc` | `isAvailable`, same result | None |
| Owner removed, hidden or hostile at the desk | `attended`, no event | `signin`, no event; a plain workstation's click runs the generic flow as before (`interactions.js:792-795` ignores the result) | None: no NPC there is removed, hidden or hostile |
| Owner knocked out at the desk | `attended` for ever | Counts as a leave: the screen is rolled, `workstation_owner_left` fires, the globals are set, and a click emits `workstation_accessed` or `workstation_locked_attempt` | None: `"disableAttacks": true` (`scenario.json.erb:8`). In `test_needs_sims` and `test_npc_needs`, which allow attacks, a knocked-out owner now leaves the screen as rolled |
| Unowned workstation | `attended` | `signin`; both emit nothing | None |
| `autoLockMin` | Did not exist | Locks an open screen on any workstation under a policy | None: it defines no `policies`, so nothing auto locks |
| `lockType: "login"` | Not a workstation | Always a workstation | `staff_pc_2` becomes a sign-in PC (section 8, step 7); `staff_pc` (Chris, the keylogger beat) stays a plain workstation |

**Desk indicators.** An owner removed, hidden or hostile at the desk has no away record, so the
desk's indicator shows "attended" (`lighting.js:116-122`). This is cosmetic and is left as it is
unless a playtest finds it misleading.

**The interaction at a sign-in PC.** `interactions.js` handles a `lockType: "login"` PC in its own
branch where it calls `onInteract` today (`interactions.js:788-796`), and returns from it without
running the rest of the generic flow:

1. Owned and the owner present (`ownerPresent`, no events): show "<owner's displayName> is using
   this PC", followed by the PC's resolved `observations` when it has any, and stop. This holds for
   any session too: nobody can use a PC its owner is sitting at.
2. The client holds a session for this PC: open the desktop (`handleUnlock`, whose `login` case
   fetches `container`).
3. Call `onInteract`. On `accessed`, wait for the claim's answer from `pc-sessions.js`; on success
   open the owner's desktop, on refusal the sign-in screen. On anything else (`locked`, `signin`,
   `attended` from a race with step 1, or `null`), open the sign-in screen.

**Claimed sessions end** when the owner returns (`workstation_owner_returned:<pcId>`), when the
screen's auto lock fires (`workstation_auto_locked:<pcId>`), or on a reload (5.3): `pc-sessions.js`
sends `POST /logout`. The absence that counts is the owner's: the auto lock runs from the owner's
leave, and where the player is does not matter. A password session is ended by neither; step 1
simply blocks the PC while the owner sits at it.

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
| `autoLockMin` | Game minutes (the needs system's clock) after the owner leaves before an open screen locks, **whatever `lockChance` or the habit say** (5.4, "Auto lock"). Teaches that a technical control beats a human habit. When it fires, a claimed session at that PC ends (a game rule the server does not enforce). `0`: the leave roll itself locks the screen, so no click ever finds it open and no claim is possible (claim check 7). `null`: no auto lock. Applies to every workstation under the policy. |
| `maxAttempts` | Server-counted failed sign-ins before that username is locked out on that PC. The lockout is per PC and username, and lasts until a game reset (a helpdesk recovery route is in the backlog). `null`: no limit. |
| `usb` | `"blocked"`: USB-tagged items are not accepted at that PC. Later slice (9.2). |
| `social` | `"blocked"`: the PC is not a `social` affordance. Later slice (9.2). |

A PC with no `policy` uses `defaultPolicy`; with neither, everything is allowed and nothing auto locks
(today's behaviour). Policies hold no secrets and are sent in the bootstrap; the workstation env
reads a PC's effective policy from `gameScenario.policies`.

### 5.6 What the browser never receives

The withholding lives in the server code that ships the data, so every route inherits it.

| Path | Withheld |
|---|---|
| Room data, `filtered_room_data` (`game.rb:909`), which serves `GET /room/:id` and the room data a door unlock returns (`games_controller.rb:888`) | NPCs are reached by the `obj['npcs']&.each` loop of `filter_requires_and_contents_recursive` (`game.rb:3011`). A helper, `withhold_npc_secrets!(npc)`, called on each NPC in that loop before it recurses, deletes `creds`, `awareness`, `habits`, `role` and `workarounds`, and for an NPC with an account `usePayload.secret` and every `addCapture.secret` in its `eventMappings`. When the NPC has `creds.card` it sets `rfidCard` from it (section 3); an NPC with no `creds.card` keeps any `rfidCard` it already has. The same loop recurses `npcs`, `itemsHeld`, `tableItems` and `contents`, so nested NPCs are covered, and NPCs added by `update_room` (`room_states.npcs_added`, `game.rb:957-960`) are merged before the filter runs. |
| Bootstrap, `GET /scenario` (`filtered_scenario_for_bootstrap`, `game.rb:794`) | Rooms are already reduced to an allow list with no room NPCs. Delete the top-level `accountProfiles`. `creds` and `role` cannot appear in the parts it ships as authored, because the validator allows them on room NPCs only (section 3). |
| Sign-in PC contents and profiles | Left out of room responses unconditionally and served only by `container` against a session (5.3). |
| Ink, `GET /ink` (`games_controller.rb:547`) | Serves compiled ink verbatim, so a password written in ink text is public. The validator errors when any NPC's `creds.password` appears in any compiled ink file of the scenario. A character who gives a password away does so through a capture, not ink text. |
| Captures, `GET /capture_secrets` | Only for an NPC with a capture route; see below. |
| Account tiles | `{ username, displayName, portrait, avatar }` only (5.3). |
| Events | `npc_used` events carry the NPC's `usePayload`; with the withholding above, an account holder's `usePayload` holds the address and host only. |

**Captures.** A capture entry in `se_captures` is client-reported: the client writes it into globals
and the server persists it through `sync_state`, which merges `globalVariables`
(`games_controller.rb:1485-1486`). `capture_secrets_for_client` (`game.rb:869`) is extended so that,
under the same `social.captures.revealSecret` switch, it also answers for an account holder, but only
one the scenario gives a **capture route**: an `eventMappings[].addCapture` on that NPC, or a
`usePayload` the loader filled from `creds`. An earned entry whose `address` equals that NPC's
`creds.username` is answered with `creds.password`, keyed by the entry's `targetId` like
landing-page captures. Section 3 keeps every authored capture address on an account holder equal to
its username, so the match always holds. Today the method returns `{}` when no landing page carries a
secret (`game.rb:896`); that return becomes "skip the landing-page pass", so a scenario with no
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

**Usernames at `/login`** are normalised (trimmed, lower case, at most 64 characters) before any
check, and failure and lockout keys use the normalised form. Failures and lockouts are counted for
**any** typed username, an account's or not, so the answer never shows whether a username exists.
To keep `player_state` bounded, `loginFailures` and `loginLockouts` each keep at most 200 entries for
usernames that are not accounts; entries for real accounts are never dropped, so spamming invented
names cannot reset an account's count. `player_state` is a Postgres `jsonb` column
(`db/migrate/20251120155358_create_break_escape_games.rb:24`), which keeps no object key order, so
the order is stored explicitly. A new `loginFailures` entry gets `seq` one more than the largest
`seq` in the hash (1 when empty); a further failure raises `n` and leaves `seq` alone. When a new
non-account entry would make 201, the non-account entry with the smallest `seq` is dropped.
`loginLockouts` is an array, which `jsonb` keeps in order: a new key is appended, and the first
non-account key is dropped when a 201st would be added.

**Who has an account, who is tracked.** An account is an NPC with `creds.username` (section 3). An
owner is tracked by the needs system when it has at least one valid `needs` entry (`decayPerMin` and
`urgentAt` both numbers above 0) or one valid `interests` entry (a number above 0, or an object
whose `weight` is above 0): the same rule as `register` and its normalisers on the client
(`npc-needs.js:131-159, 225-241`). One server helper, `needs_tracked?(npc)`, applies it.

| Route | Parameters | Checks, in order | Writes and answer |
|---|---|---|---|
| `POST /login` (new, locked) | `pc_id`, `username`, `password` | 1. PC reachable. 2. The username is not in `loginLockouts` for this PC; otherwise answer `lockedOut: true`, "This account is locked on this PC", whatever the password (a correct one included). 3. The username belongs to an account (section 3) **and** the password equals that NPC's `creds.password`. 4. The PC's `access` admits that identity (no `access`: every account). | Success: `sessions[pcId] = { id, via: "password" }`, add to `signedInPcs`, delete that username's `loginFailures` entry for this PC; answer `{ npcId, username, displayName, via: "password" }`. Check 3 fails (unknown username or wrong password, never said which): increment `loginFailures`; at the policy's `maxAttempts` add the username to `loginLockouts` and answer `lockedOut: true`; otherwise "Incorrect username or password" with `attemptsLeft` (`maxAttempts` minus that username's failures here; null without a limit). Check 4 fails: "This account can't sign in on this PC", `notPermitted: true`; failures unchanged. |
| `POST /login` with a claim (new, locked) | `pc_id`, `claim: "owner"`, the two workstation globals | 1. PC reachable. 2. The PC has an owner (`screenOwner`, or an NPC with it as `needsHome`). 3. The owner is tracked by the needs system (`needs_tracked?`: a valid `needs` or `interests` entry; without one the client never offers a claim, 5.4). 4. The owner has an account. 5. The PC's `access` admits the owner. 6. The PC does not always lock: refused when `lockChance` is 1, or `lockChance` is unset and `locksScreenOnLeave` is not `false`. 7. The PC's policy does not have `autoLockMin: 0`. A lockout of the owner's username does not stop a claim: an open session needs no password. | Success: `sessions[pcId] = { id: ownerId, via: "claim" }`, add to `signedInPcs`, log the globals; answer `{ npcId, username, displayName, via: "claim" }` for the owner, so a `loginPicker: false` PC's header and events still name the account. Failure: "Sign in required"; the client shows the sign-in screen. |
| `POST /logout` (new, locked) | `pc_id` | None. | Delete `sessions[pcId]`. |
| `GET /login_accounts` (new) | `pc_id` | 1. PC reachable. | The tiles for the PC's `loginPicker` (5.3). |
| `POST /clone_card` (new, locked) | `npc_id` or `object_id`, and `card_id` | 1. The server inventory holds an `rfid_cloner`. 2. For an NPC: a room NPC with a card (`creds.card || rfidCard`), in `encounteredNPCs`, not `"cloneable": false`. For an object: a keycard with a `card_id`, not `"cloneable": false`, that the server inventory holds, or that sits in a room that is unlocked or never locked with `path_unlocked?` true for the containers above it. 3. `card_id` equals the source's own card's `card_id`. | Checks 1 and 2 fail: 403. Check 3 fails: `recorded: false`, nothing written. Success: `serverClones[card_id]` from the source's own card, with `uidOnly` (4.2); `recorded: true`. |
| `POST /unlock` (changed, locked) | as today, plus `card_ids` for an `rfid` lock with `access` | 1. **Before any other check**, including the "already in `unlockedObjects`" return (`game.rb:1186-1189`) and the `npc` and `flag_reward` methods (`:1210-1213`, `:1223-1227`): refuse a `lockType: "login"` object for every method; refuse an object with a scope (5.1) unless `session_admits?(scope)` holds and `path_unlocked?` holds for the containers above it. 2. An `rfid` lock with `access` (doors `game.rb:1156-1161`, objects `:1245-1248`): with `card_ids`, each card in turn, and the first that passes unlocks. A card passes when it is **held** (a keycard item in the server inventory whose scenario definition carries that `card_id`, or a key of `serverClones` while the server inventory holds an `rfid_cloner`), is not a UID-only copy at a lock without `acceptsUIDOnly: true`, **and** its id is in `requires` or equals the card `card_id` (`creds.card || rfidCard`) of any NPC whose identity passes `access`. Without `card_ids` (today's trusted claim): accepted only when the lock has `requires`; refused on `access` alone. 3. Everything else as today. | As today; a door unlock's room data comes from `filtered_room_data`, so it carries the withholding and `loginAccounts` (5.3, 5.6). A refusal for a UID-only copy answers `{ success: false, message: "Invalid attempt", reason: "uid_only" }`: `validate_unlock` still returns a boolean (`game.rb:1107`), and on a refusal of an `rfid` lock with `card_ids` the controller asks a new predicate, `@game.uid_only_refusal?(target_type, target_id, card_ids)` (true when some held card would have passed but for being a UID-only copy), beside the existing `pin_cracker_feedback` and `password_case_mismatch?` calls (`games_controller.rb:868-881`). |
| `GET /container/:id` (changed, locked) | as today | A sign-in PC: 1. PC reachable. 2. `sessions[pcId]` is set (otherwise 403); `unlockedObjects` is ignored. An object with a scope (a folder in a PC or profile): 1. `session_admits?(scope)`. 2. `path_unlocked?` for its path and itself. Anything else: as today. | A sign-in PC: its own `contents`, then each profile admitted for the session's identity, through `filter_container_contents`. A scoped folder: its contents, through the same filter. |
| `POST /inventory` add (changed, locked) | as today, plus `source_pc_id` and `transfer: "copy" \| "move"` from a sign-in desktop | With `source_pc_id`: 1. The PC is `lockType: "login"` and `sessions[source_pc_id]` is set. 2. The item is found in that PC's own contents or in a profile. 3. `session_admits?` for the item's scope, through that PC's session. 4. `path_unlocked?` for the item's path. 5. The item is takeable. 6. Its `transfer` allows the choice. Without `source_pc_id`: as today, and the search skips sign-in PCs' contents and profiles. | The item joins the inventory; on `copy`, its id joins `copiedItems` in the same request. |
| `POST /complete_task` (changed, locked) | as today | An `unlock_object` task whose target is a sign-in PC: the PC is in `signedInPcs`. Otherwise as today. | As today. |
| `GET /scenario` (changed) | as today | As today. | `filtered_scenario_for_bootstrap` adds `policies`, `defaultPolicy`, and `access` and `acceptsUIDOnly` in the room allow list, and drops `accountProfiles` (5.6). The `scenario` action adds `sessions` and `signedInPcs` (5.3). |
| `GET /room/:id` (changed) | as today | As today. | Through `filtered_room_data`: NPC withholding (5.6); a sign-in PC loses `contents` and gains `hasContents: true` and `loginAccounts`. |
| `GET /capture_secrets` (changed) | as today | As today, then the account-holder pass (5.6). | The served map. |

`login` is not added to `UNLOCK_METHODS_BY_LOCK_TYPE` (`game.rb:1035-1044`); check 1 of `/unlock` is
what keeps a sign-in PC shut there.

**No-password test.** A server test asserts that for a scenario with an account-holding NPC (with
`usePayload`, an `eventMappings` capture, a profile and a sign-in PC, and no authored note holding the
password), no response from `/scenario`, `/room/:id`, a door `/unlock`, `/container/:id` (signed
out), `/login_accounts` or `/capture_secrets` (with no entry, and with a forged entry for an NPC that
has no capture route) contains the password string. Step 2 builds it over the routes that exist then;
step 3 adds `/login_accounts` and the signed-out `container` case. Its fixture scenario never has a
`writesDown` habit (that later slice ships the password on purpose, 9.1), and it is run after every
step that changes what the server sends.

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
- `app/models/break_escape/game.rb`: a loader method, `normalise_access_model!`, and a public
  `prepare_scenario_data!` that runs it and then `stamp_scenario_object_ids!` (`:3059`, private).
  `generate_scenario_data` (`game.rb:3022`) calls `prepare_scenario_data!` where it calls
  `stamp_scenario_object_ids!` today (`:3051`), so the result is persisted once with the scenario
  data. Both steps are idempotent.
- `test/test_helper.rb`: a helper, `create_access_game(mission:, player:, scenario:, player_state: {})`,
  that builds the game, calls `prepare_scenario_data!` and saves it. `generate_scenario_data` returns at once when
  `scenario_data` is already set (`game.rb:3023-3024`), which is how tests build games
  (`Game.create!(scenario_data: ...)`), so without the helper a hand-written test scenario would run
  without the loader, and a test relying on `usePayload` being filled from `creds` would pass or
  fail for the wrong reason. Every access model test with a hand-written scenario uses the helper.

Work:
- Accept NPC `role` and `creds`. The loader copies `rfidCard` into `creds.card` when `creds.card` is
  absent, and fills `usePayload.address` and `usePayload.secret` from an account. Server code reads
  `creds.card || rfidCard`, for games whose scenario data predates the loader.
- Accept `access` and `acceptsUIDOnly` on rooms and objects; top-level `accountProfiles`,
  `policies`, `defaultPolicy`; object `lockType: "login"`, `loginPicker`, `policy`, `transfer`,
  `cloneable`. (`lockChance`, `locksScreenOnLeave` and `screenOwner` are workstation fields already.)
- Extend `stamp_scenario_object_ids!` to walk `accountProfiles`.

Tests (`test/models`): the loader fills `creds.card` and `usePayload` once and a second run changes
nothing; a scenario with only `rfidCard` keeps working; a game created with `Game.create!` and
hand-set `scenario_data`, without the helper, is left untouched (the guard is unchanged).

### Step 2. Server withholding

Before any content is authored with a password.

Files:
- `app/models/break_escape/game.rb`: `withhold_npc_secrets!` called from the NPC loop of
  `filter_requires_and_contents_recursive`; `filtered_scenario_for_bootstrap` drops
  `accountProfiles` and ships `policies`, `defaultPolicy`, `access` and `acceptsUIDOnly` in the room
  allow list; sign-in objects lose `contents` unconditionally and gain `hasContents`;
  `capture_secrets_for_client` moves its landing-page early return and adds the account-holder pass.
- `test/models`, `test/controllers`.

Tests:
- The no-password test (section 6) over `/scenario`, `/room/:id`, a door `/unlock` and
  `/capture_secrets`.
- `/capture_secrets` serves an account holder with a capture route in a scenario with no
  `landingPages`; a forged entry for an NPC with no capture route gets nothing.
- `update_room` with an added NPC is withheld; a card-only NPC keeps its full `rfidCard`; an NPC from
  scenario data without `creds` keeps its `rfidCard`.

### Step 3. Server routes

Files:
- `config/routes.rb`: `login`, `logout`, `login_accounts`, `clone_card`.
- `app/controllers/break_escape/games_controller.rb`:
  - the new actions, and `login`, `logout`, `clone_card` in the `with_game_lock` list;
  - `container`: the sign-in branch via `find_object_in_scenario`, and the scoped-folder checks;
  - `unlock` passes `card_ids`, and on a refusal of an `rfid` lock with `card_ids` asks
    `uid_only_refusal?` and answers `reason: "uid_only"` when it holds;
  - inventory add takes `source_pc_id` and `transfer`;
  - `find_accessible_item`, `find_object_in_scenario`, `find_container_in_scenario` walk profiles
    and return scope and path;
  - `validate_item_collectible` gains the `login_pc` and `profile` checks;
  - `filter_container_contents` keeps `copiedItems`;
  - the `scenario` action adds `sessions` and `signedInPcs`.
- `app/models/break_escape/game.rb`:
  - `initialize_player_state`: empty defaults for the six new keys (they stay off `preserved_keys`);
  - `validate_unlock`: the scope and `login` refusal first, then the `rfid` `access` branch with
    `serverClones` (copier held) and `acceptsUIDOnly`; `uid_only_refusal?` beside
    `pin_cracker_feedback` (`game.rb:1275`);
  - `needs_tracked?(npc)` (section 6);
  - `find_scenario_object` walks profiles;
  - `login_scope_of`, `session_admits?`, `path_unlocked?`;
  - session, username normalising, failure and lockout helpers (with the 200-entry bound kept in
    `seq` order, section 6);
  - the tile composer, called from `filtered_room_data` and `/login_accounts`;
  - `complete_task!`: `unlock_object` on a sign-in PC reads `signedInPcs`.

Tests (every hand-written scenario through `create_access_game`):
- The rest of the no-password test: `/login_accounts`, and `/container/:id` signed out.
- Sign-in answers: success; an unknown username and a wrong password give the same message and the
  same `attemptsLeft` sequence; the right password for an account the PC's `access` does not admit
  answers "This account can't sign in on this PC" and leaves the count alone; a username locked out
  answers `lockedOut: true` with the right password, a wrong one and for an invented username locked
  the same way; usernames match trimmed and case-insensitively; a password right apart from letter case
  answers exactly as a wrong one (no `caseMismatch`); spamming 300 invented names, with
  `game.reload` between attempts so the order survives the `jsonb` round trip, leaves a real
  account's count and lockout in place, keeps 200 non-account entries in each key, and drops the
  earliest ones first.
- Sessions: sign-out then 403; switching account needs the second password; a PC holding only
  profiles opens; reset clears every new key; the password and claim answers and each `sessions`
  entry in the scenario response carry `npcId`, `username`, `displayName` and `via`, and the
  response carries `signedInPcs`.
- `/unlock` refuses a sign-in PC for `unlocked`, `npc` and `flag_reward`; a locked archive in a
  profile, unlocked while signed in, is refused by `/unlock` and `container` after sign-out; a
  UID-only refusal answers `reason: "uid_only"`, and other refusals carry no reason.
- Each claim refusal condition, including an unreachable or unowned PC, an owner with neither
  `needs` nor `interests`, and an owner whose only entries are invalid (`decayPerMin: 0`); a claim
  for an owner with `interests` only succeeds.
- `/clone_card`: an NPC source; a keycard held in the inventory; a keycard in a reachable room; a
  keycard inside a locked container (refused); a `card_id` that is not the source's own
  (`recorded: false`); no copier (refused).
- Role-ACL door with a held keycard, a server-recorded copy, the same copy after the copier is
  removed from the inventory (refused), a `saved_cards`-only copy (refused) and no `card_ids`
  (refused); a UID-only DESFire copy refused without `acceptsUIDOnly` and accepted with it; mixed
  door with a `requires` card (today's rule); a shared `card_id` passing for either holder's role;
  the same for an `rfid` object with role-only `access`.
- Copy and Move of a profile file and of a PC-local file, each signed in (accepted) and signed out
  (refused); Move refused where `transfer: "copy"`; a copied file still listed on reopening, a moved
  one gone; a file inside a locked archive in a profile refused before the archive is unlocked and
  accepted after.
- An `unlock_object` task on a sign-in PC completes after a sign-in and not before.

### Step 4. Client

Files, all under `public/break_escape/js/`:
- `api-client.js`: the new calls (`login`, `logout`, `loginAccounts`, `cloneCard`).
- `systems/pc-sessions.js` (new): the session list and signed-in set, sign-in and sign-out through
  `api-client.js`, each session keeping `{ npcId, username, displayName, via }` from the server's
  answer; the `pc_signed_in` and `pc_signed_out` events; the end of a claim on
  `workstation_owner_returned:*` and `workstation_auto_locked:*`; closing an open desktop when its
  session ends; the reload rule (keep password sessions, sign out claimed ones); the local drop on a
  `container` 403 (5.3).
- `core/game.js`: hand the scenario response's `sessions` and `signedInPcs` to `pc-sessions.js`
  where `savedGlobalVariables` is merged (`:1652-1654`).
- `systems/doors.js`: copy `access` and `acceptsUIDOnly` into `doorProperties`.
- `systems/unlock-system.js`: return `access` and `acceptsUIDOnly` from `getLockRequirementsForDoor`
  and `getLockRequirementsForItem`; the three-step `rfid` order (4.1), showing "Reader requires
  full authentication" for an answer with `reason: "uid_only"` and "Access denied" for any other
  refusal; the `login` case opens the desktop when `pc-sessions.js` holds a session, else the
  sign-in screen, and never calls `unlockTarget`; sign-in mode passes no attempt limit.
- `systems/interactions.js`: the sign-in branch at the `onInteract` call (5.4: present, session,
  then `onInteract`, where only `accessed` leads to a claim and every other result, `null`
  included, opens the sign-in screen), returning before the generic flow; a sign-in PC routes as a
  container; the held-keycard click passes its object id to the minigame. Plain workstations keep
  the generic flow.
- `systems/npc-needs.js`: `isAvailable(npcId)`, called by `_tickNpc` after its no-sprite return
  and by the workstation env (5.4); `onTick(fn)`, the end-of-tick listener list.
- `systems/workstation-state.js`: `isWorkstation(data)` also accepts any `lockType: "login"`
  object, with no new argument, so `lighting.js:620` is unchanged; the env gains
  `ownerPresent(id)` and `policyFor(data)` (5.4, 5.5); `onInteract` tests presence first and
  returns `signin` for no owner, or an absent owner with no away record; `npc_ko:*` counts as
  leaving only for a tracked owner not already away; `decideLocked` locks at once under
  `autoLockMin: 0`; the auto lock (`lockAt`, checked from `onTick` and in `onInteract`, emitting
  `workstation_auto_locked:<id>`). These rules apply to every workstation (5.4).
- `minigames/password/password-minigame.js`: sign-in mode (tiles drawn as in 5.3, **Other user**,
  the object's `postitNote`, the server's message, `attemptsLeft` and lockout); signs in through
  `pc-sessions.js`.
- `minigames/container/container-minigame.js`: the Open / Copy / Move dialog; header with account
  and **Sign out** (through `pc-sessions.js`) above the resolved observations; closes with the
  session's end message when `pc-sessions.js` ends its session.
- `systems/inventory.js`: send `source_pc_id` and `transfer`.
- `systems/objectives-manager.js`: `pc_signed_in` meets an `unlock_object` task on that PC; the
  load-time reconcile also reads `signedInPcs`.
- `minigames/helpers/chat-helpers.js`: pass the NPC id to the minigame as the copy's source.
- `minigames/rfid/rfid-minigame.js`: in `handleSaveCard`, once `saveCardToCloner`
  (`rfid-data.js:286`) reports success, call `clone_card` with the source from the minigame
  parameters and the saved `card_id`. The two sources are the ink action and the held-keycard
  click (4.2); unlock mode saves nothing.

Nested folders need no new client parameter: the server admits a scoped object when any current
session admits its scope (5.1), so `notifyServerUnlock` (`unlock-system.js:25-45`) and the password
minigame's server check send what they send today.

Client tests (`test/js/`, run with the existing node test runner):
- `workstation-state.test.mjs`: `isWorkstation` accepts a `lockType: "login"` object with or
  without an owner, and an unowned one returns `signin` with no event; owner at the desk returns
  `attended` with no event; owner away with the screen open returns `accessed` and emits
  `workstation_accessed`; owner away with the screen locked returns `locked` and emits
  `workstation_locked_attempt`; a tracked owner knocked out at the desk rolls the screen once, on a
  plain workstation as on a sign-in PC, and a second `npc_ko` while away changes neither `leaves`
  nor the screen; an untracked owner knocked out returns `signin`; an owner removed (no sprite),
  hidden, hostile, untracked or moved by a script returns `signin` and emits nothing; an env without
  `ownerPresent` keeps today's results (the existing tests pass unchanged); `autoLockMin: 0` locks
  in the leave roll, so the first click after the leave returns `locked`; with `autoLockMin: 5` an
  open screen locks and emits `workstation_auto_locked` once the clock passes five game minutes,
  not before, and the owner's return cancels it.
- `npc-needs.test.mjs`: `isAvailable` is false with no sprite and for `ko`, `hostile` and `hidden`;
  with no sprite `_tickNpc` only decays (no `blocked`, no home), and with a sprite it blocks
  exactly when `isAvailable` is false; an NPC with `interests` only is registered, so `getState`
  is not null for it. The whole needs suite (`npc-needs*.test.mjs`,
  `npc-pressing-needs.test.mjs`) and `lighting-workstation-indicators.test.mjs` pass unchanged.
- `pc-sessions.test.mjs` (new): a password sign-in and a claim each emit one `pc_signed_in` with the
  right `npcId` and `via`; every sign-out route emits one `pc_signed_out` with `npcId`, including
  the reload sign-out of a claimed session restored from `sessions`; a claim ends on the owner's
  return and on the auto lock, and a password session on neither; on load, password sessions are
  kept and claimed ones signed out; a `container` 403 drops the session without a request.
- An objectives test: an `unlock_object` task on a sign-in PC completes on `pc_signed_in`, and on
  load when the PC is in `signedInPcs`.

### Step 5. Validator checks

In `scripts/validate_scenario.rb`.

Errors:
- an unresolved person, profile, policy or card reference;
- a profile item id shared with another profile item or a room object;
- `role` or `creds` on an NPC record other than a room NPC;
- a `creds.username` with no password; two accounts with the same username (trimmed,
  case-insensitive);
- a keycard `identity` that names no NPC carrying its `card_id`;
- a `creds.password` in any compiled ink file of the scenario;
- on an account holder: a `usePayload.address` or `usePayload.secret` that differs from `creds`, any
  `addCapture.secret`, or an `addCapture.address` that differs from `creds.username`;
- an `rfid` lock with neither `access` nor `requires`; `access` on a gate door;
- an NPC `unlockable` list or an `unlock_object` flag reward naming a sign-in PC;
- `triggerOnInteract` on a sign-in PC.

Warnings:
- an `access` role no NPC holds;
- an account whose `needsHome` sign-in PC does not admit it;
- an owned sign-in PC with `lockChance` between 0 and 1 (section 7);
- an owned sign-in PC whose owner has neither a valid `needs` nor a valid `interests` entry (the
  rule in section 6: no unlocked session is ever possible there);
- an owner (`screenOwner`, or `needsHome` naming a workstation) placed in a different room from that
  workstation: the needs system starts every NPC at its post (5.4), so the PC would read as in use
  until the owner's first leave;
- a sign-in PC under a policy with a `maxAttempts`, because a lockout lasts the mission: the author
  confirms another route exists;
- a capture route on an account holder in a scenario without `social.captures.revealSecret`;
- a `#clone_keycard:<card_id>` tag in an NPC's ink whose card is another NPC's card, not the
  speaking NPC's (the copy will not carry that identity, 4.2);
- a `card_id` carried by several NPCs and used at an `access` lock (it opens what any holder may).

Identity reach: for each NPC card and account, list the doors and PCs its identity opens. Ordering
against the intended route is not computed in this slice (the validator has no per-lock depth); an
"opens a lock earlier than intended" warning waits until the dungeon graph exposes a reachable order.

### Step 6. Dungeon graph

`scripts/generate_dungeon_graph.rb`: an identity appears as a key node (Jake's card, Jake's sign-in)
with edges to the locks it opens; a shared card is one node naming every holder.

### Step 7. Proof scenario, the converted beat and playtests

**`scenarios/test_access_model`** (new; a test scenario, kept small):
- a start room with a card copier (`rfid_cloner`) on a table, so `/clone_card` check 1 can pass;
- an office with three NPCs, each with `needs`, an account, and placed at their desk: Dana (role
  `finance`, an EM4100 `creds.card`, ink whose conversation offers to scan her badge with
  `#clone_keycard:<her card_id>`), Sam (role `staff` only) and Ian (role `it`);
- a finance office behind an `rfid` door with role-only `access` (`finance`), holding an `rfid`
  cabinet with role-only `access`;
- three sign-in PCs: Dana's, owned, `lockChance: 0`, under `corp_default`; Ian's, owned,
  `lockChance: 1`; and an unowned hot desk with no `contents`, holding only profiles;
- `policies.corp_default` with `autoLockMin: 5` and `maxAttempts: 5` (the validator's lockout
  warning is expected here);
- a staff profile (`for: { roles: ["staff"] }`) with a handbook that gives the archive's password,
  and a personal profile for Ian with a takeable file, a file with `"transfer": "copy"` and a
  password-locked archive;
- Ian's password on a hand-written note in a drawer in his room (a deliberate clue, 5.6);
- an `unlock_object` task on Ian's PC.

**`scenarios/lab_physical_pentest/scenario.json.erb`**, the Melanie Pierce beat:
- Pierce (`pierce`, `:813-840`) gains `"role": "finance"` and `creds` with `username: "m.pierce"`
  (the address its capture already uses, `:829, :835`) and the password its capture carries today.
  The inline `usePayload.secret` and `addCapture.secret` are removed (the loader fills `usePayload`
  from `creds`, and `/capture_secrets` serves the password through the account-holder pass, since
  the scenario sets `social.captures.revealSecret`, `:48`). The capture mapping on
  `workstation_accessed:staff_pc_2` is unchanged, so `kp_unlocked_screen`, `opt_unlocked` and
  Ruth's debrief lines keep working.
- `staff_pc_2` (`:923-951`) becomes `"locked": true, "lockType": "login"`, keeping
  `workstation: true`, `locksScreenOnLeave: false` (so the claim is allowed), `screenOwner` and its
  `affordance`. It has no `contents`; its desktop is Pierce's profile. The scenario defines no
  `policies`, so nothing auto locks and there is no attempt limit; the only account is Pierce's.
- A new `accountProfiles.pierce_desktop` (`for: { people: ["pierce"] }`) holds one
  `takeable: false` text file, "Saved logins": the browser's saved sign-ins for `LW-OPEN-07`
  (`m.pierce` on the finance portal and webmail, passwords shown as dots), then the lesson: an
  unattended, unlocked session hands over everything saved in it; on a real engagement you screenshot
  that it was reachable and stop; the control is Win+L every time you stand up, with an auto lock
  policy as the backstop.
- The teaching text in `observationVariants` (`:936-949`) moves to where the player now sees it.
  Variants resolve first match (`conditional-text.js`), and the desktop header shows them (5.3).
  The `staff_pc_2_accessed` variant goes first and carries the merged lesson now shown in the
  desktop header: Melanie walked off without locking her screen, you were straight into her live
  session and its saved logins, no keylogger and no device were needed, the clean-desk and
  lock-screen rule is the whole fix, and on a real job you screenshot that it was reachable and
  stop. The `staff_pc_2_owner_away` and `staff_pc_2_screen_locked` variants are removed: the claim
  sets `staff_pc_2_accessed` before the desktop opens, so the away text would never show, and the
  screen never locks. The base `observations` ("watch for the moment she leaves the desk") stays and
  is shown under "Melanie Pierce is using this PC" while she is at the desk (5.4, step 1).
- `staff_pc` (Chris, the keylogger beat) and `usb_target_pc` are unchanged.

**Static checks.** Validator clean on both scenarios (the expected `maxAttempts` warning aside), ink
compiles, dungeon graphs regenerated, and the no-password test passing.

**Browser playtests** (the `playtest-scenario` skill; draft runs on the keyless server on :3001 with
`tools/playtest/new-game.rb` and `PLAYTEST_PORT=3001`; Haiku for the scripted runs, Sonnet to check
any "stuck" report; `tools/playtest/verify-run.rb` must show progress on the server; every secret is
fetched from its in-game source first, with the earned-secrets table).

`test_access_model`:
1. Claim: wait for Dana to leave her desk; click her PC: the desktop opens on her account (staff and
   personal profiles, header naming her). Copy a file and reopen: it is still listed. When Dana
   returns the desktop closes with "<Dana's displayName> is back at the desk", and a click shows
   "<Dana's displayName> is using this PC".
2. Auto lock: claim again and wait five game minutes: the desktop closes with "The screen locked",
   and the next click opens the sign-in screen.
3. Password: read Ian's note; at his PC (it always locks) the sign-in screen shows the tiles; sign in
   as Ian; the `unlock_object` task completes. Open the archive with the handbook's password; Move
   the takeable file (it leaves the PC); the copy-only file offers Copy only. Sign out.
4. Hot desk: the unowned PC shows every account's tile and **Other user**; a wrong password shows
   `attemptsLeft`; signing in as Sam shows the staff profile and none of Ian's files.
5. Card copy: take the card copier, talk to Dana and scan her badge; the finance door opens through
   its role list, and so does the cabinet.
6. Reload during a claim: the claimed session is gone (the PC opens the sign-in screen), the password
   session at Ian's PC is kept, and the task stays complete.

`lab_physical_pentest`:
1. The Pierce beat: wait for Melanie to leave for coffee; click her PC: the desktop opens on her
   session with the lesson in the header and the "Saved logins" file; the capture is added,
   "opt_unlocked" completes and the captures view shows the password. When she returns the desktop
   closes, and a click shows she is using the PC with the base observation.
2. The keylogger beat at Chris's PC plays as before.
3. Reload during the claim: the claim ends, and the capture and task are kept; Ruth's debrief still
   credits the unlocked screen.

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
