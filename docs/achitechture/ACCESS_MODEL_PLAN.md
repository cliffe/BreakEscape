# Access model: identities, roles, logins, policy and networks

Status: **design, decided 2026-11-09** (user's choices from the options page). Nothing here is built yet.
Background: CyberCIEGE (Irvine, Thompson and Allen, NPS) and its layered model of access, adapted to
Break Escape's physical, puzzle-led play. First slice: section 10.

## 1. Why

Today access is decided lock by lock: hold the item whose id matches `requires`, know the secret, or
have a global set. A PC is either a password box styled as a desktop or a full SecGen VM. Nothing in
between models **who** someone is or **what they may do**.

This plan adds a middle tier without VMs:

- NPCs have a **role** and their own **credentials** (username, password, card).
- Locks and PCs carry an **access list (ACL)**: which roles and which people may pass.
- A credential is evidence of an identity, so a stolen or cloned credential gives the player **exactly
  its owner's access**.
- PCs show a **login prompt**; contents come from **profiles** (a shared staff desktop, Jake's own
  files) that follow the account to any PC it logs into.
- **Policies** (auto lock, attempt limits, USB, social media) apply to PCs by name.
- NPC **awareness** (a preset plus overrides) sets the habits that leak access.
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

Not taken: probabilistic attack resolution (puzzles stay deterministic, section 9) and a budget loop
(defender missions are in the backlog).

## 2. Decisions (2026-11-09)

| Area | Decision |
|---|---|
| Structure | **ACLs.** Role and credentials live on the NPC. Each lock, PC, profile or resource lists the roles and people it admits. No central grants table. |
| Doors | An RFID door accepts specific cards (`requires`, as now) **or** roles/people (`access`), or both. |
| Credentials | Cards resolve to their owner, so clones work too. Passwords captured any way work at any PC that account may use. Unlocked sessions give the owner's access. Legacy `requires` keeps working. |
| Awareness | Preset (`low`, `medium`, `high`) plus per-habit overrides. It expands into the existing social engineering blocks rather than running alongside them. |
| Habits | Locks screen, password strength (guessable from OSINT), sticky note, password reuse, holds doors, falls for phishing or pretext calls, challenges strangers. |
| Workstations | `needsHome` is the preferred station. PC contents depend on who is logged in. |
| Policy | Named policies referenced by PCs: auto lock, attempt limit, USB blocked, social media blocked. |
| Work | Abstract resources plus physical objects. Work requirements by role. Frustration, workarounds and outages. |
| Social media | `social` need; phone or PC (if policy allows); posts appear in a readable feed and can leak facts; blocking raises frustration. |
| Networks | Named networks with membership, Wi-Fi with a key, network jacks. |
| Determinism | Seeded rolls (the existing `NPCNeedsSystem.roll`). |
| Tooling | Validator: references exist, NPCs can reach their work, identities that skip locks are flagged. Identities appear in the dungeon graph. Attacker missions first. |
| Backlog | Defender and investigator mission types, SecGen export (`docs/IDEAS_BACKLOG.md`). |

## 3. Identities and credentials on the NPC

```jsonc
{
  "id": "jake",
  "displayName": "Jake Brooks",
  "role": "finance",                    // or ["finance", "staff"]; free strings
  "creds": {
    "username": "jbrooks",
    "password": "Biscuit2019",          // stripped from the client payload
    "card": { "card_id": "4F00A1C2", "rfid_protocol": "EM4100" }
  },
  "awareness": "low",
  "habits": { "writesDown": true },     // overrides of the preset, section 6
  "needsHome": "jake_pc"
}
```

- `role` is a string or an array. Every NPC with `creds` implicitly also has the role `staff` unless
  `"staff": false` is set, so "all staff" ACLs need no extra typing (decided 2026-11-09).
- `creds.card` replaces `rfidCard`. The loader treats an existing `rfidCard` as `creds.card`, so
  `clone_keycard` and the RFID minigame keep working unchanged.
- **Identity resolution.** A credential maps to an identity by value: a card by `card_id`, a login by
  `username`. Nothing on the item needs to name its owner, so a clone (same `card_id` on the
  `rfid_cloner`) carries the same identity as the original. A keycard item may still say
  `"identity": "jake"` for readability; the validator checks it agrees with the `card_id`.
- The player has no identity of their own. They act as whoever's credential or session they use.

## 4. ACLs on locks

One field, `access`, wherever a lock can stand:

```jsonc
"access": { "roles": ["finance", "it"], "people": ["dana"] }
```

A credential passes if its identity's roles intersect `roles`, or its identity is in `people`.

### 4.1 Doors (RFID)

```jsonc
// rooms.finance_office
{ "locked": true, "lockType": "rfid",
  "requires": ["VISITOR-07"],                 // specific cards, as today (optional)
  "access": { "roles": ["finance"] } }        // plus anyone whose card resolves to finance
```

Unlock rule: the card's id is in `requires`, **or** its identity passes `access`. Both fields are
optional but at least one is required (validator error otherwise).

Server: today RFID unlocks are trusted from the client (`game.rb` `validate_unlock`). With ACLs the
client sends the `card_id` it used; the server checks the player holds it (a `keycard` in inventory
or a `saved_cards` entry on a held `rfid_cloner`) and resolves it against NPC `creds.card`. This is
tighter than today at no extra authoring cost.

### 4.2 Other lock types

`access` is defined generically, but only `rfid` (doors and objects) and the new `login` (section 5)
use it in the first slice. Keys, PINs and passwords stay as they are.

## 5. PCs: logins, sessions and profiles

### 5.1 Profiles (roaming desktop contents)

Contents that belong to an account rather than a machine are declared once, at scenario level:

```jsonc
"profiles": {
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
- Because profiles are keyed to the account, not the PC, the same files appear on any PC Jake can log
  into. That covers "works when the user logs into multiple PCs".
- Item ids are global, as now. A takeable file taken from a profile is gone from that profile on every
  PC (the server's existing "already held" filter does this).
- **Taking files** (decided 2026-11-09). `takeable: false` items stay on the PC and open in place
  (viewer, app). Clicking a takeable digital file opens a small **desktop-themed dialog** (styled as the
  PC's own window chrome): **Open**, **Copy to inventory**, **Move to inventory**, **Cancel**.
  - *Copy*: the file stays on the PC (and in its profile on every PC); the player gets a copy that reads
    the same. The server records it in `player_state.copiedItems` so the "already held" filter does
    not hide the original.
  - *Move*: as the engine does today; the file leaves the profile everywhere.
  - A scenario can restrict the choice per item (`"transfer": "copy" | "move" | "both"`, default
    `both`), for example when moving a file is the point (taking the only copy of evidence).
  This changes one rule in `container-minigame.js`: today a `text_file` always opens the viewer.
- A staff desktop used in several scenarios can be generated with an ERB helper later; nothing shared is
  needed for the first slice.

### 5.2 The PC object

```jsonc
{ "id": "jake_pc", "type": "pc", "name": "Jake's PC",
  "locked": true, "lockType": "login",
  "access": { "roles": ["staff"] },          // who may log in here (default: anyone with creds)
  "policy": "corp_default",
  "network": "corp_lan",                     // section 8 (not in the first slice)
  "contents": [ /* local files, optional */ ] }
```

`needsHome: "jake_pc"` on Jake makes it his preferred station (already the case for the needs
system). It also makes him the PC's **owner** for sessions (existing `ownerOf` in
`workstation-state.js`, or `screenOwner`).

### 5.3 The login prompt

`lockType: "login"` opens the password minigame in a new `mode: "login"`.

**Choosing the account** (decided 2026-11-09). By default the prompt shows an **account picker**: one
tile per account, with the NPC's portrait and username, as on a real login screen. The player picks a
tile, then types the password. `loginPicker` on the PC (or scenario-wide) sets what is shown:

| `loginPicker` | Prompt |
|---|---|
| `"accounts"` (default) | Tiles for every account the PC's `access` admits |
| `"known"` | Tiles only for NPCs the player has met or whose username they have found |
| `false` | No tiles: the player types the username, as on a hardened PC |

Usernames are not secret, so the picker sends no password information to the client.

The server checks:

1. the username belongs to an NPC with `creds`;
2. the password matches that NPC's `creds.password`;
3. the PC's `access` admits that identity.

On success the server records `player_state.sessions[pcId] = identityId` and the container endpoint
composes contents for that identity (5.1). Failed tries count **on the server** against the policy's
`maxAttempts` (today attempts are counted only in the client). A wrong username and a wrong password
give the same message.

Logging out (a button on the desktop) clears the session. Logging in as someone else at the same PC
replaces it, so the player can switch accounts to reach different profiles: privilege escalation by
moving to a stronger account.

### 5.4 Unlocked sessions

When the owner is at their post, the PC is "in use" (as now: `attended`). When they leave, the
existing workstation layer decides whether the screen locks (`lockChance`, `locksScreenOnLeave`, now
fed by the awareness habit `locksScreen`). Policy can force it (5.5).

If the screen is **not** locked when the player interacts, they get the owner's session: no login, the
owner's profiles shown, and the server records the session as the owner.

**Server rule** (decided 2026-11-09). Contents of a login PC are sent only after a correct password,
with one exception: an unlocked-session claim, which the server honours **only where the scenario
makes one possible**. It refuses the claim (and the player must log in) when:

- the PC has no owner (no `screenOwner`, and no NPC with it as `needsHome`);
- the owner's effective `locksScreen` is `always` (or the PC's `lockChance` is 1);
- the PC's policy has `autoLockMin: 0`;
- the session would be the owner's own and the owner has no `creds`.

Otherwise it is still a claim from the browser (the server cannot see NPC positions), so it is
limited to what the game allows anyway. The client sends the workstation globals
(`<id>_screen_locked`, `<id>_owner_away`) with the claim and the server logs them.

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
| `maxAttempts` | Server-counted failed logins before that account is locked out on that PC for the mission (first slice; the helpdesk route is in the backlog). |
| `usb` | `"blocked"`: USB-tagged items are not accepted at that PC (the needs system's `accepts` ignores them), so a BadUSB drop fails there. |
| `social` | `"blocked"`: the PC is not a `social` affordance (section 7.2). |

A PC with no `policy` uses `defaultPolicy`; with neither, everything is allowed and nothing auto locks
(today's behaviour).

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
| `writesDown` | bool | Puts the owner's password on a sticky note on their PC (the existing `postitNote` / `showPostit` fields, filled server-side from `creds.password`). |
| `password` | `strong`, `guessable`, `reused` | Authoring intent the validator checks. `guessable`: at least one intel fact or social media post must point at it (it suits the `password-guesser` scene's `patternSlots`). `reused`: the same password appears in another credential, lock or scene. |
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
those. When an NPC also appears in those blocks, the preset supplies **defaults** for fields the
author left out, and anything written explicitly wins. The SE systems still install only when
`social.characters` exists, so missions without them are unaffected. What awareness adds that SE has
no equivalent for is the physical and credential-hygiene layer: screen locking, sticky notes, holding
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
  resource's `access` admits the NPC, the PC's network reaches the resource's network (section 8;
  always true until networks exist), and the resource is not down (`downIf` global false).
- All met: work is restored as now. Any missing: `work` is **not** restored and the NPC's frustration
  rises.

### 7.2 Frustration and workarounds

Frustration is a per-NPC level (0 to 100), not a need: it rises on each failed work use
(`frustrationPerFail`, default 25) and falls slowly when work succeeds. Workarounds fire once each
when it crosses their threshold:

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
"posts": [
  { "text": "Biscuit turns 5 today! Best boy.", "intel": "jake_pet_name" },
  { "text": "Back from Crete, 300 emails waiting..." }
]
```

- **Where it is satisfied.** The NPC's own phone (always available, used where they stand; a phone-in-
  hand pose) or their PC if its policy allows `social`. Preference: PC if allowed, else phone. Using
  the phone at a desk still counts as away from work but keeps the owner at the post, so the screen
  stays attended.
- **Feed.** Each completed `social` use reveals that NPC's next post into a feed the player can read: a
  `social_feed` object or a phone app. This reuses the reveal-slot idea from the needs system. A post's
  `intel` grants the named `social.intelFacts` entry when read, linking OSINT to password guessing.
- **Awareness.** With `awareness: high` the validator warns if a post grants intel (high-awareness staff
  shouldn't overshare) unless the post is marked `"deliberate": true`.
- **Blocked.** If `social` is blocked on the PC and the NPC has no phone (`"phone": false`), a social
  use fails and frustration rises.

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
either fixes the habit or adds another route.

## 10. First slice

Chosen by the user: roles on NPCs, identity-bearing credentials with ACL doors, per-account PC
contents with unlocked sessions, named policy with auto lock, validator checks.

1. **Schema and loader**: NPC `role`, `creds` (with `rfidCard` read as `creds.card`); `access` on
   rooms and objects; top-level `profiles`, `policies`, `defaultPolicy`; `lockType: "login"`.
   Validator field lists updated (`validate_scenario.rb` 404-419, 484-510).
2. **Server**:
   - strip `creds.password` and profile contents from the client payload;
   - RFID ACL check (held card or cloner entry resolved to an identity);
   - login check and `sessions`, with server-side attempt counting;
   - the container endpoint composes local contents plus profiles for the session identity;
   - an unlocked-session claim honoured only where the scenario makes one possible (5.4), recorded as
     the owner;
   - copied files recorded in `copiedItems` (5.1).
3. **Client**:
   - login mode in the password minigame, with the portrait account picker;
   - the desktop-themed Open / Copy / Move dialog for takeable files;
   - desktop header showing who is logged in, with a log out button;
   - takeable files go to the inventory inside login desktops;
   - RFID unlock sends the `card_id` it used;
   - workstation sessions honour `autoLockMin` and the `locksScreen` habit.
4. **Validator**:
   - every `access` role is held by at least one NPC (warning), and every person, profile, policy and
     card reference resolves (error);
   - every NPC can log in to its `needsHome` PC;
   - a card that **skips** a lock is reported: for each NPC card, the doors its identity opens are
     listed, with a warning when that is earlier than the dungeon graph's intended route.
5. **Dungeon graph**: an identity appears as a key node (Jake's card, Jake's login) with edges to the
   locks it opens.
6. **Proof scenario**: `scenarios/test_access_model`, with three NPCs (finance, staff, IT), a finance
   door with a role ACL, three PCs, a staff profile and a personal profile, and `corp_default` with
   `autoLockMin: 5`. Then add one beat to `lab_physical_pentest`.

Later slices, in order: awareness presets and habits (section 6); work resources and frustration
(7.1, 7.2); social media (7.3); networks (8).

## 11. Open questions

All answered 2026-11-09:

- copy or move: the player chooses in a desktop dialog (5.1);
- choosing an account: portrait picker by default, typing optional (5.3);
- implicit `staff` role: yes (3);
- session trust: contents only after a correct password, except unlocked-session claims, honoured only
  where the scenario makes one possible (5.4).

None open. New questions from the review rounds go here.
