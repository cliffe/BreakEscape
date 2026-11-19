# Ops layer plan: privilege, cached credentials, local and domain accounts

Stages S5a, S5b, S5c. Feature ids on landing: A18 (privilege levels), A19 (cached credentials),
A20 (local and domain accounts). Drafted for the ops layer (brief
`docs/agents/OPS_LAYER_BRIEF.md`, outline `docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md` S5).

## 1. What this adds and why, in play

Three stages that turn a foothold on a machine into a proper hold over an organisation's accounts.

**S5a: privilege on a session (A18).** Every session the player holds on a sign-in PC is either a
*user* session or an *admin* session. A user session sees what its own account is allowed: its own
desktop and the profiles made for it. An admin session on a PC can do three more things there: open
the profiles of the other accounts that use that PC, collect the credentials that PC has cached
(S5b), and, while the admin session is not locked, install a device the PC's USB policy would
refuse, as a real administrator can change a machine's device policy from wherever they sign in (a
device that types into the PC still needs someone signed in at its keyboard). Under S5a alone the accounts "that use the PC" are its
owner, so an unowned PC has no other profiles to open until S5b declares cached accounts.

The player gets admin in two ways: by signing in with an administrator account (one the scenario
marks `creds.admin`), or by a step up on a user session through a local weakness, which the core
plan (S3) defines. Teaches: least
privilege, that an ordinary account is a start and not an end, and that local privilege escalation
is a step of its own.

**S5b: cached credentials (A19).** A PC remembers the accounts that have signed in on it, as
hashes, never as passwords. Collecting them needs admin on that PC, as it does on a real machine.
Each collected account arrives in the keyring (A15) as a hash, which the player cracks with the
cracking minigame (S7) before reusing the password elsewhere; the collect panel and the keyring row
both offer the crack. An account can be cached from the start, or only once the server has seen that person
sign in at that PC (a borrowed session handed back). Borrowing happens only at a PC with no owner
(a hot desk, a shared terminal), so on those PCs watching who uses the desk, or making someone use
it, pays off; an owned PC's cached accounts are all there from the start. A borrower who hands
the desk back ends the player's session there and usually leaves their own signed in, so the
player collects the new account by signing back in as the administrator after they go.

A scenario that does not teach cracking does not declare cached accounts. Teaches: credential
caching, that a stored sign-in is a hash and not the password, offline cracking as the step that
turns it into one, reuse and lateral movement, and why admin on one machine is worth having.

**S5c: local and domain accounts (A20).** Some accounts exist only on named machines (local);
others work on every machine that belongs to the organisation's domain. The weak setup gives a set
of machines one shared local administrator account, so collecting it on one machine opens them all
with admin once its hash is cracked. The hardened setup gives each machine its own local
administrator, so what is collected and cracked on one machine opens only that machine. Usernames are unique across a scenario (`GM:3486` finds the
account from the username alone), so the hardened setup has a different username per PC
(`lab1-admin`, `lab2-admin`), where the real mitigation keeps one name and varies the password; the
lesson survives because what differs is still the secret the player collected.

Collecting and cracking a domain administrator's cached account opens every domain machine as
admin. Teaches: local against central identity, password reuse at scale,
and unique local administrator passwords as the mitigation.

Left out of this plan: a domain-wide lockout. Lockouts stay per PC and per username for every
account kind. The lockout key is read at every site in the MFA plan's list of lockout key sites;
that plan adds the key helpers (`AccessIdentities.lockout_key`, `lockout_key_parts`,
`Game#login_lockout_keys_for`), so a later slice on top of them needs only a rule for which PC's
`maxAttempts` counts and the NPC side updated. It waits until a mission needs it (backlog
`docs/IDEAS_BACKLOG.md:197`).

## 2. What the code does today

Verified against the code in the worktree. `GM` is `app/models/break_escape/game.rb`.

**A session has an identity, not a privilege.** `start_login_session!` (`GM:4388-4418`) is the one
writer of a session record: `{ 'id' => <npc id>, 'via' => 'password' | 'claim' | 'credential' }`
plus `credential`, `foothold`, `from`, `relay`. It builds a fresh record every time, so an unlock
(a fresh `POST /login`), a second sign-in, a keyring sign-in and a claim all rebuild it. One PC holds
one session. The core plan (S3) adds `via: "technique"` with `access` and `technique` keys, written
through new keyword arguments of the same method; a technique record is the only record that stores
`access`.

**Validity is judged in three places.** `session_identity(pc_id)` (`GM:3243-3249`) returns nil for
a locked session and is documented as the one predicate every read path uses (`GM:3236-3241`).
`session_route_up?` (`app/models/break_escape/network_access.rb:1158-1170`) is false for an expired
token session, a PC whose service is off, a relay whose invite ended, and a remote or `from` session
whose route no longer holds. `session_for_client` (`GM:3778-3792`) drops an expired token session.
`session_lockable?` (`GM:3824-3829`) is false for anything but a password session or a remote
credential session, so a claim, a relay and a technique session never lock.

**Profiles follow an account, not a PC.** `accountProfiles` is one scenario-wide, server-only map
(`GM:3151-3154`; `scripts/scenario-schema.json:245-260`, "desktop contents that follow an account to
any sign-in PC it may use"), each with a `for` access list. `admitted_profiles(npc)` (`GM:3318-3333`)
filters it by identity only. `login_desktop_contents(pc, npc)` (`GM:3337-3344`) adds those profiles
to the PC's own `contents`. Two predicates admit a profile scope: `session_admits?` (`GM:3270-3277`)
is satisfied by a live session at *any* PC whose identity the `for` admits, and
`scope_admitted_by_session?(scope, pc_id)` (`GM:3288-3307`) only through the session at one PC.

**The USB policy is read in three player-side places.** Server: the implant path
(`network_access.rb:507-513`, `AccessWork.plant_refused?`, `lib/break_escape/access_work.rb:1198`)
and the plant proof (`app/models/break_escape/capture_proofs.rb:50-52`, a plant the policy refuses
is never recorded). Client: `plantRefusal` (`public/break_escape/js/systems/pc-policy.js:67-79`),
called from `interactions.js:1056`, so a refused item never leaves the tray. The NPC side reads the
same table (`access_work.rb:1265`, `npc-needs.js:321`) for NPCs' own sticks; a player's privilege
does not touch it. The implant path takes only a keyboard session: it refuses a foothold, relay or
`from` session (`network_access.rb:498`, and `:501` through `remote_route_session?`, defined at
`:1544-1546`) and, by design (the comment at `:502`), accepts a locked one. The plant proof has no session condition at all: it records any plant
the policy accepts (`capture_proofs.rb:46-53`). The client's session mirror keeps a session locked
during play, with `locked: true` beside whatever else it already held (`pc-sessions.js:198-200`).

**The server sees one kind of NPC sign-in.** It records an NPC at a PC through a player sign-in or
claim, and through a borrowed session handed back. A `borrow_session` workaround is performable only
on a PC with no owner that is not headless (`performable?`,
`app/models/break_escape/npc_frustration.rb:354-356`: `!NetworkModel.headless?(pc) &&
login_pc_owner(pc).nil?`); a hand-over for one that is not performable is refused (`:161-162`).
The server issues the hand-over itself, after counted fails raise the NPC's frustration
(`choose_run!`, `:526-547`), and accepts a "done" for an NPC the player has met (`:155`) with that
hand-over's token. It checks a dwell on server time (`:186-190`), except that `cut: true` sets the
dwell to 0 for a borrow, which a tampered client can send at once (accepted, `:144-150`, `:187`). So
the server proves a real hand-over of a declared workaround of a met NPC, not that time passed.
`record_borrow_done!` (`:384-410`) resolves `w['pc']` through `find_login_pc` (`:381-389`), ends the
player's session there, and writes `guestSessions` unless the borrower is a careful guest, is
locked out at that PC, or the policy locks a guest outright (`:402`); a reload wipes it
(`:250-259`). A `borrow_session` is a repeating kind (`:37`), so the same NPC can hand back the same
PC more than once.

Whether an NPC uses its own PC on its routine is known only to the browser
(`lib/break_escape/owner_claim.rb:9-13`). `login_pc_owner` (`GM:3384`) gives the static owner.

**Lockouts are per PC and per username.** The key is `"<pcId>|<normalised username>"`, checked
before the account lookup (`GM:3484`, then `:3486`), written by `add_login_lockout!` (`GM:4366`).
The same key format is read by `account_locked_out_at?` (`GM:3577-3581`, used by keyring sign-in),
`lockout_pcs_for_client` (`GM:3587-3594`), `AccessWork.locked_out_at?`
(`access_work.rb:1390-1395`, which drives NPC frustration and feed posts) and
`account_login_key?` (`GM:4322-4324`), and the failure counter uses it (`GM:4333-4353`). This plan
leaves all of it as it is.

**Passwords reach the keyring from captures only.** Implicit entries are not stored; they are
computed on every read. `implicit_keyring_entries` (`app/models/break_escape/credential_keyring.rb:266-287`)
builds `<npcId>.password` entries, with the password text, from `account_capture_usernames`
(`network_access.rb:1754-1776`), which needs a proven `seCaptures` row. Registry entries
(`registry_keyring_entries`, `credential_keyring.rb:312-328`) list when their proof holds
(`credential_proof_holds?`, `:21-36`; proof kinds in `lib/break_escape/credential_model.rb:36`:
`session planted dropped held foothold`); a registry `password` entry sends no password text
(`:330-343`). `keyring_for_client` (`:74-85`) joins both and digests them into `rev`. Nothing today
can put a password in the keyring for an account the player has not captured or found written down.

**Accounts are room NPCs.** An account is a room NPC with `creds.username` (`GM:2373-2378`); one
username, one password (`scenario-schema.json:4399-4410`, `creds` closed to other keys); usernames
are unique and `attempt_login!` finds the account from the username alone (`GM:3486`). `creds`,
`role` and `workarounds` never reach the browser (`WITHHELD_NPC_KEYS`, `GM:7332`). Object fields
removed from every object sent are listed in `WITHHELD_OBJECT_FIELDS`
(`network_access.rb:21`). `policies` *are* sent in the bootstrap (`scenario-schema.json:261-263`)
and read by the client (`pc-policy.js:52-56`).

**Sign-in order** (`attempt_login!`, `GM:3444-3503`): PC found → route branch → lockout check →
account lookup and password compare → `pc_admits_account?` (`GM:3376-3380`; no PC `access` list
admits every account; a refusal is 422 `notPermitted`, uncounted) → clear failures → write the
session. Keyring sign-in (`attempt_credential_login!`,
`app/models/break_escape/credential_login.rb`) calls `pc_admits_account?` too (`:53-56`). Nothing
distinguishes a local account from a domain account.

**There are two `pc_admits_account?`.** `Game#pc_admits_account?` (`GM:3376-3380`) serves the typed
sign-in, the keyring sign-in, the owner claim (`GM:3552`), the guest claim (`GM:3624`),
`account_password_opens_something?` (`capture_proofs.rb:198-201`, which gates capture proofs on the
account opening some PC) and `login_account_tiles` (`GM:3874`). `CredentialModel.pc_admits_account?`
(`lib/break_escape/credential_model.rb:196-200`) serves `pcs_accepting` (`:173-191`) and the
validator (`scripts/validate_scenario.rb:7583`). `pcs_accepting` has two callers, both offline: the
validator (`:7607`) and the dungeon graph (`scripts/generate_dungeon_graph.rb:1655`). Both
definitions apply the same rule today: no PC `access` list admits every account, else
`AccessIdentities.acl_admits?`; the run-time keyring judges no admission (section 7).

**Sign-in tiles list every admitted account.** `login_account_tiles(pc)` (`GM:3868-3883`) builds
`{ username, displayName, portrait, avatar }` for every account NPC that `pc_admits_account?`
admits on that PC (or only met ones when `loginPicker` is `"known"`, none when it is `false`; absent
means `"accounts"`), and `attach_login_accounts!` (`GM:4465-4478`) puts the list on every sign-in
PC in every room answer. So which accounts a PC admits is visible to the browser today.

## 3. Build stages in order

Each stage ships and tests alone. Size L overall, three M parts (outline S5). Order: S5a (after the
core plan's S3), then S5b, then S5c. S5b needs S5a (the collect needs admin) and the cracking plan's
S7 (every collected account is a hash record, and the crack is how its password is earned), so S5b
builds after both. S5c needs S5b's collect for its lesson, though its sign-in check could land
alone.

**S5a: privilege levels (M).** One level helper, `session_access(pc_id)`, which answers `"admin"`,
`"user"` or nil (no live session) for every kind of session, read through the same validity checks
as every other reader. One opt-in account marker, `creds.admin: true`, so that signing in with an
administrator account gives admin. Two admin gates: the profiles of the accounts that use the PC,
and installing a device the USB policy refuses at the five places the policy is read (implant
path, plant proof, the inventory `remove` check `plant_policy_refusal`, client `plantRefusal` and
the client's `remove_item` pick), for any unlocked admin session on that PC whose service
is on (a device that needs a session still takes only a session at the PC's own keyboard).
Answers carry `access: "admin"` when the level is admin; the core
plan's step up reads the level through this helper. S5a does not need S3 to work: the administrator
account gives a real admin session through the real sign-in route. It is ordered after S3 so that
the `access:` keyword the core plan adds to `login_session_answer` already exists (section 5). The first commit of S5a is the
unchanged-scenario test (section 10).

**S5b: cached credentials (M).** A declared list of cache candidates on each sign-in PC
(`cachedAccounts`), withheld from the browser. A candidate is cached from the start, or once the
server accepts that NPC's borrowed-session "done" at that PC; the server records the second kind in
a new key, `cachedAt`. A collect route that, with an admin session on the PC, records each cached
account in `harvestedAccounts`. Each candidate has one authored `hash` record (S7's registry kind)
with a new proof kind, `harvested`, which holds once the collect has recorded that PC and account,
so the keyring lists the hash and S7's crack action opens on it. The collect never yields a
password. Admin profile reads (S5a) widen to the accounts cached on the PC once S5b lands.

**S5c: local and domain accounts (M).** `creds.accountKind` (`local` or `domain`), `creds.localTo`
(the PCs a local account exists on), `creds.domain`, and `domain` on a sign-in PC. One sign-in
check, `AccessIdentities.account_kind_admits?`, called from both definitions of
`pc_admits_account?` (the game's and `CredentialModel`'s), so the typed sign-in, the keyring
sign-in, the claims, the sign-in tiles, the validator and the dungeon graph all apply it.
A shared local administrator is one `local` account whose `localTo` lists several PCs; the
hardened setup is one `local` administrator per PC. No policy field is added. An account with no
person behind it (a built-in administrator, a service account) is a room NPC with `accountOnly:
true`, which the server keeps for sign-in and leaves out of every room answer.

## 4. Scenario fields

Industry-neutral names (brief section 2.3). Every field is optional; a scenario that sets none
behaves exactly as today (section 10).

**S5a.** One field, on an account's `creds`: `admin: true` makes the account an administrator
wherever it may sign in. Absent is `false`. The step up from user to admin is the core plan's shape
(OPS_CORE section 0): a weakness on the host with `needs: { "session": "user" }` and `grants: {
"session": { "account": "<npcId>", "access": "admin" } }`. This plan adds nothing to it.

```json
"rooms": { "office": { "npcs": [
  { "id": "kemiA", "displayName": "Kemi Adeyemi", "npcType": "person",
    "creds": { "username": "kadeyemi", "password": "harbour-7", "admin": true } }
] } }
```

**S5b.** On a sign-in PC object (`"type": "pc"`, `"lockType": "login"`), an optional list of cache
candidates. Each names an account NPC and, optionally, `after: "borrow"`: the account is cached
only once the server accepts that NPC's `borrow_session` "done" at this PC. Without `after` it is
cached from the start. Only listed accounts are ever cached: the PC's `owner` is collectable only
when the list names it, so nothing becomes collectable that the author did not write down, and the
validator notes each reached owned PC that does not list its owner (section 9). `after: "borrow"` is allowed only on a PC with no
`owner` that is not headless, because the engine performs a borrow only there (`performable?`,
section 2); on an owned or headless PC it is a validator error. A headless host takes start
candidates only, and its collect control is on its remote desktop.

```json
"rooms": { "office": { "objects": [
  { "type": "pc", "id": "hotDesk", "name": "Hot desk", "locked": true, "lockType": "login",
    "cachedAccounts": [ { "npc": "priyaN" }, { "npc": "samO", "after": "borrow" } ] },
  { "type": "pc", "id": "alexPc", "name": "Alex's PC", "locked": true, "lockType": "login",
    "owner": "alexT",
    "cachedAccounts": [ { "npc": "alexT" }, { "npc": "kemiA" } ] }
] } },
"credentials": {
  "hotdesk_priyan": { "kind": "hash", "account": "priyaN", "proof": { "harvested": "hotDesk" } },
  "hotdesk_samo":   { "kind": "hash", "account": "samO",   "proof": { "harvested": "hotDesk" } },
  "alexpc_alext":   { "kind": "hash", "account": "alexT",  "proof": { "harvested": "alexPc" } },
  "alexpc_kemia":   { "kind": "hash", "account": "kemiA",  "proof": { "harvested": "alexPc" } }
}
```

Registry ids follow the registry's id pattern (lowercase letters, digits and `_`,
`credential_model.rb:40`); a hash id needs no fixed relationship to the PC or NPC ids, and the
names above only make the example readable. The proof is a string like the registry's other proof
kinds (`session`, `foothold`): its value is the PC id, and the account comes from the entry's
`account` string (an NPC id).

The hot desk has no owner: `priyaN` is cached from the start and `samO` only after a borrow, so
`samO` must carry a `borrow_session` workaround whose `pc` resolves (through `find_login_pc`, as the
engine resolves it) to `hotDesk`. Alex's PC shows the owned case: its owner and an administrator who
once signed in there are cached from the start.

A cached account is always a hash. Each candidate needs exactly one `hash` record in the
`credentials` registry (the cracking plan's record kind, with whatever other fields that plan
defines) whose `account` is the candidate and whose proof is `{ "harvested": "<that PC's id>"
}`; a candidate without one, or with two, is a validator error (section 9). An account cached on
several PCs (a shared local administrator) has one record per PC: collecting on any one of them is
enough, and cracking that record gives the one password. Once that password is held, a second
record for the same account counts as already cracked (section 14 relies on the cracking plan showing it
so), so collecting the shared administrator on a second PC adds a row that reads as cracked, never a
second puzzle for a password the player already has. The collect still records the second PC,
because the log row reports which PCs the player harvested. The proof kind `harvested` holds once
the collect has recorded that PC and account. `cachedAccounts` is valid only in a build that has
S7; a scenario that does not teach cracking leaves it out.

**How a cached hash is cracked.** The cracking plan cracks a hash from its account's `password`
habit. A person's account has one; an `accountOnly` account (S5c) has no habits at all, so its hash
record carries its own crack recipe, `crack`, with the recipe's class,
`password` (the cracking plan's classes: the habit's `strong`, `guessable` and `reused`, plus
`common`, which only a recipe takes; required here, since the account has no
habit to supply it), and `facts` for `guessable` (the cracking plan's recipe shape). The cracking
plan owns every rule on `crack`, in its `validate_cracking.rb` (facts count and reachability, the
optional `passwordPattern` and its backing check, the `reused` source check, and the optional NPC
habit parameter `passwordDifficulty`: `easy`, `medium` or `hard`, which a record's own
`crack.difficulty` overrides); this plan adds none of them. The cracking plan reads `crack` on the record when it is present and the habit otherwise.
The facts a recipe needs come from takeable items, share or container files, a feed post or a flag
reward, never from a conversation or a read-only poster, because nobody stands behind the account
and the server does not see a read. The S5c example below collects `deskAdmin` on `pc01` through
this record; the rota poster is a takeable item that carries the fact:

```json
"deskadmin_pc01": { "kind": "hash", "account": "deskAdmin", "proof": { "harvested": "pc01" },
                    "crack": { "password": "guessable", "facts": ["it_rota_poster_seen"] } }
```

with the item in the IT room: `{ "type": "notes", "id": "it_rota_poster", "name": "Rota poster",
"takeable": true, "revealsFacts": ["it_rota_poster_seen"] }`.

**S5c.** On `creds`: `accountKind` (`local` or `domain`), `localTo` (array of sign-in PC ids,
required for `local`), `domain` (string, required for `domain`). On a sign-in PC: `domain`. On a
room NPC: `accountOnly: true` for an account with no person behind it.

```json
"rooms": { "it": {
  "npcs": [
    { "id": "deskAdmin", "displayName": "Desk administrator", "npcType": "person", "accountOnly": true, "staff": false,
      "creds": { "username": "deskadmin", "password": "Winter2026", "admin": true,
                 "accountKind": "local", "localTo": ["pc01", "pc02", "pc03"] } },
    { "id": "lab1Admin", "displayName": "Lab 1 administrator", "npcType": "person", "accountOnly": true, "staff": false,
      "creds": { "username": "lab1-admin", "password": "q8-Fen-31", "admin": true,
                 "accountKind": "local", "localTo": ["lab1"] } },
    { "id": "domAdmin", "displayName": "Ravi Menon", "npcType": "person",
      "creds": { "username": "rmenon-adm", "password": "Tidewater!4", "admin": true,
                 "accountKind": "domain", "domain": "northwind" } }
  ],
  "objects": [
    { "type": "pc", "id": "pc02", "name": "Desk PC", "locked": true, "lockType": "login", "domain": "northwind" }
  ]
} }
```

`deskAdmin` is the weak setup: one shared local administrator on three PCs, so its hash collected
on `pc01` and cracked opens `pc02` and `pc03` as admin. `lab1Admin` is the hardened setup: `lab1`
has an administrator of its own, and what is collected and cracked there opens nothing else. Absent `accountKind`
leaves an account unscoped, as today; absent `domain` on a PC puts it in no domain. The minimal room
and NPC fields (position, sprite) are left out of the examples for length; an `accountOnly` NPC needs
none of them, and the validator refuses them on it (section 9).

## 5. Engine behaviour: server then client

### Server

**S5a: the level helper.** `session_access(pc_id)` in `game.rb`, beside `session_identity`:

1. no session record at the PC → nil;
2. `credential_session_expired?(session)` → nil;
3. `session_identity(pc_id)` nil (locked, or the account is gone) → nil;
4. `session_route_up?(pc_id)` false (route lost, PC off, relay ended) → nil;
5. a relay session or `via: "claim"` (owner or guest claim) → `"user"`;
6. `via: "technique"` → `"admin"` when the record's `access` is `"admin"`, else `"user"`;
7. `via: "password"` or `"credential"` → `"admin"` when `account_admin_at?(npc, pc)`, else `"user"`;
8. anything else (an unknown or missing `via`) → `"user"`.

Step 5 runs before step 7 because a relay record is `via: "credential"`
(`credential_login.rb:73-77`). Step 7 covers every credential kind, so a `token` or
`saved_connection` session of an administrator account is admin too: a token skips the password,
and the MFA second step is what stands in the way. Claims and relays are never admin, so an owner
claim of an administrator's unlocked desktop is a user session.

`account_admin_at?(npc, pc)` is `creds.admin == true` and `pc_admits_account?(pc, npc)` (which,
after S5c, includes the account-kind rule). `session_admin?(pc_id)` is `session_access(pc_id) ==
"admin"`. The level is read, never stored, for every session except a technique one, whose `access`
the core plan writes. So nothing writes or sends a default level, and a rebuilt record gets the level
of the account it now holds: the same account typing its password to unlock comes back at the same
level; Switch user, a guest claim or a borrow's displacement of a keyboard session drops to
whatever the new holder has (a borrow ends only keyboard sessions: a remote or technique session,
and its server record, stays and keeps its level);
a technique session cannot lock (`session_lockable?` is false for it), so it cannot lose its level
that way. The core plan's `needs.session: "user"` is met when `session_access` is not nil (user or
admin); `needs.session: "admin"` when it is `"admin"`. So a relay session or an owner or guest
claim can feed a step up to admin: a local weakness needs a foothold on the machine, and a shared
screen or a claimed desktop is one. The step-up's new account is whatever `grants.session.account`
names; this plan adds no condition on it.

`session_admin?(pc_id)` is also the one predicate for the USB override. Any admin session on the
PC overrides the policy: one at the keyboard, a remote one through a foothold, a technique step up,
a `from` session. Step 4 (power and route) is part of it, so a PC whose service is off never
overrides, and the client, whose `access` comes from the same `session_access`, agrees once the
next answer or the desktop's `off` refusal arrives. A locked session fails step 3, so a locked
admin session never overrides.

**S5a: profiles.** Under S5a alone the admin set of a PC is its `owner` (empty on an unowned PC).
Once S5b lands it is `pc_present_accounts(pc)`: the owner plus the accounts in
`cached_accounts_at(pc)` (S5b below), each once. The owner opens profiles whether or not it is
listed as collectable: a profile is a desktop, not a credential.

An admin session at PC P opens, besides its own admitted profiles, every profile whose `for` admits
at least one account present on P, each once, in `accountProfiles` order. Changes:
- `login_desktop_contents(pc, npc)` and `find_login_item` take the extra profiles when
  `session_admin?(pc['id'])`, through one helper `admin_profiles_at(pc)`, so the listing and the
  item lookup agree.
- `scope_admitted_by_session?(scope, pc_id)`, profile branch: also true when
  `session_admin?(pc_id)` and the profile is in `admin_profiles_at(pc)`.
- `session_admits?(scope)`, profile branch: also true when some PC P has `session_admin?(P)` and
  the profile is in `admin_profiles_at(P)`. It names the admin PC; it never answers true for a
  profile no present account would open.

What this gives up: admin on a PC does not open every profile in the scenario, nor the profile of
an account that never used that PC. A role profile opens when any present account has the role.

The extra profiles join the desktop's one flat list, as admitted profiles do today
(`login_desktop_contents`, `GM:3337-3344`); `find_login_item` already searches every profile, so the
listing and the lookup need no new structure. An author who wants the player to see whose items
these are wraps a profile's `contents` in one folder named for the person ("Priya's documents").
The validator warns on same-name top-level items that only an admin session brings together
(section 9).

**S5a: the USB override.** `AccessWork.plant_refused?(data, obj, item, admin: false)` returns false
when `admin` is true; every other caller is unchanged, so the NPC-side readers
(`access_work.rb:1265`) keep the policy. The player-side server sites pass:
- the implant path (`network_access.rb:509`): `admin: keyboard_admin?(pc_id)` (only a keyboard
  session reaches that line, so this equals `session_admin?` there);
- the plant proof (`capture_proofs.rb:52`) and the remove check below: `admin:
  session_admin?(found[:object]['id'])` when the target is a sign-in PC, `keyboard_admin?(pc)`
  for the grant's PC when the object needs a session (next paragraph), else false.
So the override needs an unlocked admin session on that PC whose service is on, however it was
reached: a typed or keyring sign-in with an administrator account, a remote credential session of
one, or a technique step up to admin. A relay session and a claim are never admin (step 5), so
they never override. A locked session still takes an implant the policy allows (by design, the
comment at `network_access.rb:502`) but has no level, so a locked admin session does not override.

**A device that needs a session takes only the keyboard.** The implant path keeps its own rule
about which session takes a session-shaped implant (a blank `foothold`, not a relay or `from`
session, `network_access.rb:498-501`); that rule is about the implant, not the policy, and this plan
keeps it. A device that types into a PC reaches whoever is signed in at that keyboard, and a remote
or technique session is not at that console. An object needs a session when its
`triggerOnInteract`, at any depth of `confirm_action` `onConfirm` lists, holds a `grant_foothold`
action with `needsSession` (`apply-actions.js:441-449`); the PC it judges is that grant's `pc`, not
the object itself. Every shipped BadUSB is a separate socket whose grant sits inside a
`confirm_action` and names another PC: `sam_dock` names `sam_pc` and `kiosk_dock` names `kiosk_pc`
(`scenarios/test_access_networks/scenario.json.erb:770-787`, `:885-901`), `implant_socket` names
`reception_pc` (`scenarios/demo_access_tour/scenario.json.erb:455-475`). One walk finds it on each
side: `CaptureModel.session_grant_pc(obj)` on the server and `sessionGrantPc(objectData)` in
`pc-policy.js`, both recursing into `confirm_action` `onConfirm` as `CaptureModel.removes_item?`
does (`capture_model.rb:400-414`), and answering the first such grant's `pc`, or nil. "First" is
depth-first in list order on both sides, and a grant with a `condition` counts, as `removes_item?`
ignores conditions (the client skips an action whose condition is false, `apply-actions.js:142-145`;
the walk does not). The validator warns on one object whose `needsSession` grants name two
different PCs. Such a
device is satisfied only by a session at that PC's own keyboard, and the policy override for it
comes only from a keyboard admin session there. One helper states this, `keyboard_admin?(pc_id)`:
`session_admin?(pc_id)` and the session has a blank `foothold` and is not `remote_route_session?`.
The plant proof's predicate (above) is `keyboard_admin?(session_grant_pc(obj))` for a
`needsSession` object and `session_admin?` for any other. The policy read stays where it is today:
the client's `plantRefusal` reads the object's own policy (a shipped socket has none, so
`usb_governed?` is false for it, `access_work.rb:1181-1187`, and the client lets the stick
through), and the implant path reads the grant's PC policy with `keyboard_admin?(pc_id)`
(`network_access.rb:507-512`). The client and the implant path therefore judge the same PC for the
override, and an existing socket still opens its confirm exactly as today.

Today a remote session meets that rule as `implant_not_ready` (`:498`, `:501`), which
`network-links.js:498-501` keeps quiet. S5a gives it a reason of its own: when the PC has a live
session that is a foothold, relay or `from` session and so cannot take the device, the implant path
answers `{ success: false, reason: "needs_console", error: <line> }`, the line being "Nobody is
signed in at this keyboard." `not_ready` keeps every other case (no session at all, as for a
dropped device whose save has not yet arrived). `network-links.js` handles `needs_console` beside
`usb_refused` (`:483-487`): a toast with the server's line and a `network_device_refused` event with
that reason, never the quiet path. The item stays in the tray, because the implant path refuses
before it copies the device. This toast is the normal feedback for a player who holds only a remote
or technique session on the PC and plugs a BadUSB into its socket: the socket is ungoverned, so the
client opens the confirm, and the implant path answers `needs_console` after it.

Any other plant takes the override from any admin session. A remote admin session's override
shows at the plant proof and in the client: a stick the policy refuses leaves the tray and the
plant is recorded while the player holds remote admin on that PC. This matches a real administrator
changing device policy from wherever they sign in, and it means a foothold with admin disarms that
PC's USB lesson for non-session devices: an author whose USB lesson must hold gives that PC no admin
path, and the dungeon graph's `admin@<pcId>` nodes (section 9) show which PCs have one.

**A lapsed override never costs the item.** A remote admin session can end with no client event: a
token session expires on the server clock (step 2), an NPC unplugs a foothold, an outage drops a
route. A player at the PC with a stale mirror then plants a stick the policy refuses. Today the
inventory `remove` action (`games_controller.rb:1454-1460`) calls `record_planted_item!`, which
answers false for a policy refusal (`capture_proofs.rb:52`), and then removes the item anyway. S5a
puts a check in that branch before both calls: when `used_on` is present, a new
`Game#plant_policy_refusal(item_id, used_on)` finds the held item and the target object as
`record_planted_item!` does, early returns included (a hideable item, a client-forged item,
`capture_proofs.rb:32`, `:39`, an object that does not take the item, and an item the server no
longer holds, `:43`, which is the retry of a remove it already did), so it never refuses a
remove that the plant proof would not have judged. A retried gated remove therefore answers
success, removes nothing and records nothing more, which is what lets the retry after a lost
answer heal the tray. It answers the USB refusal line when the object
takes the item, the policy refuses it, and the admin predicate above is false; otherwise nil. A line
means the action answers `422 { success: false, reason: "usb_refused", error: <line> }` and returns,
so nothing is removed and nothing is recorded.

Two client paths send a plant remove (a `used_on`), and both today drop the item from the tray
before the answer and ignore it: the `consumesItem` branch of `interactions.js:1081-1088`, which
also fires `triggerOnInteract` first, and the `remove_item` action (`apply-actions.js:271-293`),
which removes the first held match by its own list (`:276-279`) then sends the remove (`:290`), the
documented way to consume an item only once a `confirm_action` is confirmed (`:267-274`). The
server counts both as a plant (`CaptureModel.object_takes_item?`, `capture_model.rb:419-439`, takes
a `consumesItem` object and one whose `triggerOnInteract` removes the item at any `confirm_action`
depth). S5a changes both the same way, and only for a **gated remove**: one whose target object is
USB-governed and whose policy refuses the item being removed with `admin: false`. The caller knows
by one call, `pcPolicy.gatedRemove(item, objectData, scenario)`, true exactly when
`usbRefused(usbPolicyFor(objectData, scenario), classOf(item))`; these are the only removes the
server's new check can refuse on an honest client. Every other remove keeps today's order and its
fire-and-forget send.

- **`consumesItem`.** For a gated remove, the client sends the remove first and waits, and fires
  `triggerOnInteract` and removes the item from the tray only on success.
- **The admin value and the object's data.** `applyActions` receives only `source`, `gameId` and
  `objectId`, and the client has no lookup from a scenario id to object data. Both `interactions.js`
  calls (`:1080`, `:1095`) therefore pass `objectData` (the sprite's `scenarioData`) in the opts, and
  the `confirm_action` branch threads it on to `onConfirm` (`apply-actions.js:425`). The `admin`
  value comes from one helper in `pc-sessions.js`, `plantAdmin(objectData)`: `keyboardAdmin` of
  `sessionGrantPc(objectData)` when a grant is found, else `sessionAdmin(objectData.id)`.
  `interactions.js` (for `plantRefusal` and `gatedRemove`) and `apply-actions.js` (for the pick and
  `gatedRemove`) both call it, so the two cannot drift.
- **`remove_item`.** It first picks the item: among held matches of its own list, not in
  `plantsInFlight` (below), the first one the
  object's policy accepts under `plantAdmin(objectData)`, else the first match (so a
  player holding two matching items, one refused and one accepted, spends the accepted one, the one
  `plantRefusal` let through, `pc-policy.js:71-78`). When that remove is gated, `applyActions`
  stops the list at that action: it sends the remove and waits, and on success removes the item from
  the tray and runs the rest of the list (`applyActions(rest, opts)`, a new call, so a `give_item`
  promise from the rest never reaches the first call's returned `gives`; only the timer dispatcher
  reads those, and a timer passes no `objectId`, so it never makes a gated remove). Actions before it have already
  run, so the validator warns when a `remove_item` on a USB-governed object is not the first action
  of its list. An object with no `policy` and no workstation fields is never gated, so the
  `remove_item` order is unchanged for it.
- **The answer.** `sendInventoryRemove` gains an option, `withBody: true`, that resolves `true` on
  success, the refusal body on a refusal that has one, and `false` after the retried network failure
  or a refusal with no body; its other callers are unchanged. The client reads only `error` from a
  refusal body: the route's other refusals carry `message`, and its `rescue` answers 500 with
  `message: "Inventory error: ..."`, so raw exception text never reaches a toast, and a 5xx after
  the retry counts as a network failure (the generic line), not as a refusal that has one. On
  anything other than success the
  item stays in the tray and nothing after it runs: on `usb_refused` the client shows the server's
  line through `gameAlert` and emits `usb_refused:<objectId>` as the local refusal does; on another
  refusal it shows the server's `error` when there is one; on a network failure it shows "That did
  not go through. Try again." The player can try again at once, because the item is still held.
  The server side of that retry is safe: `sendInventoryRemove` already retries once on a network
  error or 5xx (`apply-actions.js:42-63`), and a remove of an item the server no longer holds
  answers `{ success: true }` (`games_controller.rb:1454-1460`; `remove_inventory_item!` is a
  `reject!`, `game.rb:845-850`) and records nothing, because `record_planted_item!` answers false
  for an item not held (`capture_proofs.rb:43`).
  **Known limit.** If the answer to a remove the server did process is lost twice and the player
  reloads before trying again, the item is gone from the server and the plant may be recorded, but
  the object's `triggerOnInteract` (a `set_global`, a `grant_foothold`) never ran. This needs two
  lost requests in a row and then a reload before the retry, and no new `player_state` is added for
  it.
- **One request at a time.** From the send until the answer, both the object's id and the item's
  id are in client sets (`plantsInFlight` for objects and a sibling for items). A further interact
  with that object, and a `remove_item` for it, does nothing (a console line only). While the item
  id is in its set, it is left out of `requiresItem` matching (`interactions.js:1050-1053`) and out
  of the `remove_item` pick, so another object that takes the same item sees the "not held" path
  and sends nothing: one server plant never runs two objects' actions. Both leave their sets on
  every answer, failure included.

No shipped scenario has a gated remove: the `remove_item` objects (`wall_port` in
`test_capture_log`, `network_port` in `test_remove_item`, the bin in `test_wearable`) carry no
`policy` and no workstation fields, and a `consumesItem` object whose policy refuses every held item
is refused by `plantRefusal` before any remove. So every existing scenario keeps today's order.

**S5b: the cached set.** `cached_accounts_at(pc)` answers the account NPCs cached at the PC now, in
`cachedAccounts` order: each candidate without `after`, and each `after: "borrow"` candidate whose
`"<pcId>|<npcId>"` is in `cachedAt`. It reads only the PC's declared list, so it can never answer an
undeclared account, and it ignores a `cachedAt` pair that no longer matches a declared `after:
"borrow"` candidate (a saved game from an edited scenario). A candidate that is not an account
holder is ignored.

`record_borrow_done!` (`npc_frustration.rb:384-410`) gains one step after the lock-out branch at
`:402`: when the borrower is an `after: "borrow"` candidate on the resolved PC id (`pc_id`, from
`find_login_pc`) and `!account_locked_out_at?(pc_id, npc)`, add the pair to `cachedAt` unless it is
already there (a borrow repeats). A careful guest and a policy that locks a guest outright still
cache: the borrower did sign in, it only left no open session. A locked-out borrower caches
nothing, since the code already holds that it cannot have signed in there. The step runs inside
the existing accepted-"done" path, so what is proved is a real hand-over of a declared workaround
of a met NPC at a PC with no owner; the dwell is not part of that guarantee (`cut: true` skips it,
accepted), and a forged early "done" only brings forward an account the author declared. A resent
"done" answered from `lastSpent` writes nothing.

**S5b: the collect.** `harvest_cached_credentials!(pc_id)`, under `with_game_lock`:
1. requires `session_admin?(pc_id)` (the route checks why not, section 6);
2. for each account in `cached_accounts_at(pc)`, in that order, skips a pair already in
   `harvestedAccounts`, else appends `"<pcId>|<npcId>"`;
3. returns the new pairs and every pair held for this PC.
The session's own account is collected when it is in `cached_accounts_at(pc)`, like any other, and
never added when it is not: an administrator signing in at a PC does not make itself cached there.
Under a technique session the player may not know that account's password, so collecting its hash
is useful. Nothing is trimmed: a keyring proof reads the list. Both keys are bounded at run time by the
scenario's declared pairs, because the server writes only pairs the two readers above accept; the
validator's caps (section 9) are an authoring limit on top.

**S5b: the `harvested` proof.** S5b adds `harvested` to `CredentialModel::PROOF_KINDS`
(`credential_model.rb:36`) and one branch to `credential_proof_holds?` (`credential_keyring.rb:21-36`):
`{ "harvested": "<pcId>" }` on a registry entry whose `account` names the account holds when
`"<pcId>|<account>"` is in `harvestedAccounts`. The value is a string, so `proof_kind`
(`credential_model.rb:62-67`, which accepts only string values) reads it unchanged and
`check_credentials` (`validate_scenario.rb:7523-7525`) sees a known kind; the schema adds
`harvested` (string) to the proof properties (`scenario-schema.json:293-305`). Nothing else in the keyring changes:
the registry already lists an entry once its proof holds (`registry_keyring_entries`,
`credential_keyring.rb:312-328`), and the hash record's row, its token and its crack affordance are
the cracking plan's. S5b adds no password row and no keyring row source. The password reaches the
keyring only when S7's crack succeeds, through S7's own grant. A hash collected after a password
reset (S8b) is the hash of the scenario's password, like a capture or a post-it from before the
reset; the player earns the new password only through the reset row.

**S5c: the account-kind check.** `account_kind_admits?(pc, npc)` in `AccessIdentities`, called first
by both definitions of `pc_admits_account?`; `Game#pc_admits_account?` becomes a call to
`CredentialModel.pc_admits_account?`, so there is one body. Kinds only narrow; the PC's `access`
list still applies afterwards. Every caller narrows:

| Caller | What changes |
|---|---|
| typed sign-in, `attempt_login!` (`GM:3444-3503`) | refuses a wrong-kind account, 422 `notPermitted` |
| keyring sign-in, `credential_login.rb:53-56` | the same, and the second-step re-judge (S8) picks it up |
| owner claim (`GM:3552`), guest claim (`GM:3624`) | apply it too; the validator makes the owner and every borrower admitted at their PC, so a valid scenario never meets a refusal here |
| `account_password_opens_something?` (`capture_proofs.rb:198-201`) | a `local` account opens only its `localTo` PCs; a capture proof holds when one of them exists |
| `login_account_tiles` (`GM:3874`) | a tile only where the account may sign in (and see the tile rule below) |
| `pcs_accepting` (`credential_model.rb:173-191`) | the validator and the dungeon graph no longer count a PC the server would refuse; the run-time keyring is unchanged (section 7) |

| Account kind | PC `domain` | Admitted when | Refusal |
|---|---|---|---|
| absent (unscoped) | any | the PC's `access` list admits it (today) | 422 `notPermitted` |
| `local` | any | `pc.id` is in `creds.localTo` and the `access` list admits it | 422 `notPermitted` |
| `domain` | equal to `creds.domain` | the `access` list admits it | 422 `notPermitted` |
| `domain` | absent or different | never | 422 `notPermitted` |

The refusal is the existing step-6 answer, uncounted, so a wrong-kind sign-in with a right password
tells the player the password was right and the account does not belong there. The delegation
lands only with a test that the two bodies agree today on every PC and account of the existing
scenarios (`Game.acl_admits?` and `AccessIdentities.acl_admits?`). A technique session runs no
account-kind check at run time: the validator applies `pc_admits_account?` with the account-kind
rule to `grants.session.account`, so an author cannot grant a session as a domain account on a PC
outside its domain. Account kind does not change the second sign-in step (S8): every enrolled
account meets the PC policy's `mfa`, and `creds.mfa: false` stays the only exception.

**S5c: accounts with no person.** One predicate, `AccessIdentities.account_only?(npc)`. The server
walks room NPCs in about 120 places in `app` and `lib`; they fall into four groups.
- *Readers that ask whether a person is in the world* skip an `accountOnly` NPC:
  `filtered_room_data` (so it never walks, talks, rings or shows in a phone list), `hasPresentNpc`
  in the bootstrap (`GM:2444-2448`, so a room holding only one is not lit as occupied), `hasNPCs`
  and the NPC count in the room layout (`games_controller.rb:527`, `:603`), `npc_in_room?`
  (`GM:2160-2166`, which the talk routes use), `ko_claimable_room_npc_ids` (`GM:2040-2049`) and
  `character_sprite_keys` (`GM:2232-2239`), and `NpcHabits.expand!`
  (`lib/break_escape/npc_habits.rb:131-143`). The last takes `awareness` from the NPC or from its
  role (`level_with_source`, `:60-70`), and a role cannot be refused on the NPC: for an account
  with no workstation it would otherwise write the role preset's `habits` onto the NPC and, with
  `holdsDoors`, count it in the door gates' `noHold` fills; only the screen fill stops
  (`:no_workstation`). Encounter tracking (`games_controller.rb:2944-2969`) reads the filtered
  room answer, so it never sees one.
- *Readers that ask about an account or identity* keep it: `scenario_room_npcs` and its account
  readers (sign-in, `account_for_username`, captures at `GM:2642-2694`, `rfid_identity_passes?` at
  `GM:3982-3986`).
- *Readers of what an NPC holds* (the `itemsHeld` searches in `games_controller.rb:3612-4300`,
  `GM:3902`, the phone walk in `social_feed.rb:208-218`) and *readers of other person fields*
  (habit sticks, feed posts, `voice` and barks, clue sources) find nothing, because the validator
  accepts only an allow-list of keys on an `accountOnly` NPC (section 9).

`test/models/account_only_readers.yml` lists, as `file#method: group`, every method in `app` and
`lib` whose body matches `['npcs']`, `scenario_room_npcs`, `room_npcs` or `each_room_npc`. A
method runs from its `def` to the next `def` at the same or a lesser indent (or the file's end),
and a match outside any method is listed as `file#(top)`.
`account_only_readers_test.rb` scans those files in plain Ruby and fails when a matching method is
missing from the manifest or an entry no longer matches, so a new loop gets a decision. It puts an
`accountOnly` NPC in a room with a PC and asserts that each first-group reader leaves it out, each
second-group reader still finds it, and an NPC whose role has `awareness` gets no habits. Their
session answer carries `displayName` and no
portrait, so the desktop shows its generic account picture. The client already copes with a session
whose NPC it has never loaded: the mirror keeps the answer's fields (`pc-sessions.js:186-209`), the
taskbar handles an NPC whose room is not loaded (`utils/pc-taskbar.js:160-176`), `npcName` falls
back to the id (`pc-sessions.js:143-147`), and event listeners use `pcId`. A JS test keeps it so.

**S5c: sign-in tiles.** `login_account_tiles(pc)` skips an `accountOnly` account: it never gets a
tile on any PC, so the player types its username, which they learn by collecting it or from a find:
the account has no person to meet, so a tile would name something the player has no way to have
learnt, and the collect is the lesson. An administrator account with a person behind it
(`creds.admin` without `accountOnly`) keeps its tile where it may sign in, like any account: the
person is in the office and talks to the player, so hiding the tile hides nothing, and
`loginPicker: "known"` or `false` already narrows tiles per PC. An
ordinary `local` or `domain` account also keeps its tiles, and because the tile list already
follows `pc_admits_account?`, a player who compares PCs can see where such an account may sign in.
That is the same exposure as an `access` list today and is accepted: the lesson is about the
hash collected and cracked, and a hardened PC still shows only its own accounts. The tile list holds
nothing the room answer does not already allow (no `accountKind`, `localTo`, `domain` or
`admin`).

### Client

Every answer that describes a session to the client (the sign-in answer from
`login_session_answer`, the session mirror's entries from `session_for_client` in the bootstrap and
in room answers, and the network view's host row) carries `access: "admin"` when `session_access`
for that PC is admin, for any session kind, and omits the key otherwise. The stored `access` on a
technique record is read only through `session_access`; it is never copied into an answer as it
stands, so a technique user session sends no key and nothing sends a default. `publicSession`
(`public/break_escape/js/systems/pc-sessions.js:186-209`) is a field whitelist, so `access` is added
there and to the bootstrap adopt path. When the mirror marks a session locked during play
(`locked: true`, `:198-200`) it deletes `access` in the same step, and every fresh server answer
replaces the entry, so a lock, an expired token or a lost route never leaves admin on the client.
The desktop then shows:
- an Administrator marker on the taskbar beside the account name, in the pixel-art UI rule (2px
  border or the `ui-themes.css` 9-slice skin, pixel font);
- a "Cached accounts" control, only for admin. It posts to the collect route, then calls the
  keyring's `refresh()` (`keyring.js:436`). Its result opens a small panel listing each collected
  account with its headshot (the answer's `portrait`, or the generic picture when it is null, as
  for an `accountOnly` one), its display name, its username, the word "hash", and a Crack button
  that opens the cracking plan's scene for that record (`hashId` from the answer), the same scene
  the keyring's hash row opens. The username is earned by the collect (a cached account is listed
  under its username), so the panel is where the player learns how to type an `accountOnly`
  account; section 14 relies on the cracking plan showing it on the hash row too, so it stays in the
  keyring after the panel closes. The panel says the password comes from the crack. A collect that adds nothing says so. The panel is the feedback: the
  keyring's find toasts and Sign-ins list may not show a new row (`keyring.js:774-784`).

`plantRefusal(heldItems, objectData, scenario, { admin })` (`pc-policy.js:67`) lets every item
through when `admin` is true. `interactions.js:1056` has no PC id in hand, only the object's id
(`sprite.scenarioData.id`), so it passes `admin: sessionAdmin(objectId)`, one function in
`pc-sessions.js` that mirrors the server predicate: the mirror entry for that id has `access ===
"admin"` and is not `locked`. A governed object that is not a sign-in PC has no mirror entry, so the
answer is false, matching the server's "else false". It covers remote, relay and technique entries
alike, since only the server decides which carry `access`. For an object that needs a session
(section 5: `sessionGrantPc(objectData)` finds a `needsSession` grant at any `confirm_action`
depth), `interactions.js` passes `admin: keyboardAdmin(sessionGrantPc(objectData))` instead, the
grant's PC rather than the object. `keyboardAdmin(pcId)` is `sessionAdmin(pcId)` and the mirror
entry has none of `remote === true`, a non-empty `footholdId`, `relay === true` or a non-empty
`fromPcId` (the fields the mirror carries, `pc-sessions.js:8`, `:20`, `:30`, `:183`, `:256`; a
technique copy carries `remote` and `footholdId`). For a shipped socket this changes nothing in the
client, since the socket is ungoverned and `plantRefusal` lets the stick through whatever `admin`
is; a player holding only a remote or technique session on the PC opens the confirm and gets the
implant path's `needs_console` toast, "Nobody is signed in at this keyboard." (section 5). If an
author gives the socket a `policy` of its own, the client override is judged at the grant's PC, as
the implant path judges it. Power reaches the client through `access`: an answer that
follows power-off has no `access`, so the entry is cleared, and the desktop's 403, which carries no
session, also drops `access` from that PC's entry when its `serverReason` is `'off'` or
`'not_responding'` (`pc-sessions.js:509-547`, `:665-667`).

When the two disagree (a tampered client, or a mirror not yet updated after a session ended, such
as a borrow hand-over, an expired token or a lost route) the server wins and the player keeps the
item: the inventory `remove` action refuses with `usb_refused` before it removes or records
anything, and the client, which waited for that answer because the remove was gated, keeps the
item in the tray and shows the server's line (section 5, "A lapsed override never costs the item"),
whether the remove came from `consumesItem` or a `remove_item` action. The next room answer
corrects the mirror.

No client code decides privilege. The client learns about account kinds only through the existing
`notPermitted` refusal and through which tiles a PC shows (above).

## 6. Server routes

Only S5b adds a route. S5a's gates ride existing routes (`GET /container` for profiles, the implant
action and the plant proof for USB); S5c's check rides `POST /login` and the keyring sign-in.

**`POST /harvest_credentials`** (new; `config/routes.rb` beside the keyring routes, action beside
`keyring` in `app/controllers/break_escape/games_controller.rb`). Params: `pc_id` (string, at most
40 characters, the log row id cap of section 13) and the desktop's route params (`relay`,
`foothold`, `from`, read by `desktop_route_params`), sent exactly as for the desktop it is on.
Runs under the game lock, as the other writing routes do.

Refusals follow the ops convention: `{ success: false, reason: "not_admin" | "locked" |
"not_reachable" | "bad_request" }`, and the 404 of check 2, which is `GET /container`'s own body
and not a reason on this list. It mirrors that route on purpose (so a real and an invented id look
alike) and stays as that route gives it; a test that walks the closed list accepts it by name.
S5b adds `not_admin`, `locked` and `not_reachable` to `test/fixtures/files/ops_refusal_codes.json`
(`bad_request` is already there) and gives each a line in `REFUSAL_TEXT` (`ops-model.js`), and the
collect panel turns a refusal's `reason` into words with `REFUSAL_TEXT`, with no table of its own.

Checks in order:
1. `pc_id` missing, not a string or too long → 400 `{ success: false, reason: "bad_request" }`;
2. not a sign-in PC in a room (`find_login_pc`), or no session record at it
   (`access_sessions[pc_id]`, the raw record) → 404 `Container not found: <pc_id>`, the answer
   `GET /container` gives an invented id (`render_error`, `games_controller.rb:641-644`). A browser
   with no session gets the same answer for a real and an invented PC id, the echoed id aside;
3. the route params conflict, or `desktop_request_allowed?(info, route)` (`network_access.rb:1495`)
   refuses → 403 `{ success: false, reason: "not_reachable" }`, one body where the desktop gives
   one per reason (`GC:3149-3162`; the desktop's own bodies stay as they are). This is the desktop's own reach gate, which already refuses an expired token
   and a dead route, so terms the core plan adds to it apply here too; a headless host is collected
   through its remote desktop's route;
4. the session is locked (`session_locked?(pc_id)`) → 422 `{ success: false, reason: "locked" }`;
5. `session_access(pc_id)` nil for any other reason (the account is gone) → 403
   `{ success: false, reason: "not_reachable" }`;
6. `session_access(pc_id)` is `"user"` → 422 `{ success: false, reason: "not_admin" }`;
7. `harvest_cached_credentials!(pc_id)`; `save!` only when a pair was added.

The route opens no lockable object (it acts on a sign-in PC's session, not on a container or
item), so it does not call `record_step_open!` or `step_object_open?`; S5 opens objects by no route
of its own.

Policy and game lookup: `GamePolicy#harvest_credentials?` (the same rule as `keyring?`), the action
name added to `DEVICE_ACTIONS`, and `harvest_credentials` added to the `before_action :set_game`
list in `games_controller.rb`, so the route is authorised and finds its game.

Answer: `200 { success: true, harvested: [ { npcId, displayName, username, portrait, avatar, hashId } ],
held: [ ... same shape ], keyringRev }`, where `harvested` is what this call added, `held` is every
account collected at this PC so far, `portrait` and `avatar` are built as `login_account_tiles`
builds them (`GM:3876-3881`; null for an `accountOnly` account, which the allow-list leaves no
sprite), and `hashId` is the registry id of that pair's `hash` record, the id the keyring row and
the crack route use. A repeat (say after a lost answer) returns `harvested: []` with the same
`held`, writes nothing and writes no log row. `keyringRev` is in every success answer and is `keyring_for_client(...)[:rev]`, the one builder,
so it includes the cracking plan's `crackFacts` member; a test asserts it equals the next
`GET /keyring` rev. The answer
never contains a password or a hash token; the token arrives through `GET /keyring` as the cracking
plan defines, and a password only through a successful crack. `Cache-Control: no-store`, as the
keyring route.

`POST /login` gains no param; its step-6 refusal also covers an account-kind mismatch. The implant
action gains no param; it reads `keyboard_admin?` for the PC it already checks, and adds one reason,
`needs_console`, to its closed list (section 5). The inventory `remove` action gains no param; it
adds the refusal `422 { success: false, reason: "usb_refused", error }` for a plant the USB policy
refuses with no admin override, in place of today's silent removal.

## 7. What reaches the browser, and what never does

**Reaches the browser.**
- `access: "admin"` on an admin session's entry (sign-in answer, session mirror entries in the
  bootstrap and room answers, network host row); absent for every other session.
- The collect answer: account ids, display names, usernames, `portrait` and `avatar` keys, and each
  pair's `hashId`, for accounts the player has collected. No secret: a username is what the
  collected cache is listed under, and the player needs it to type an account that has no tile. On a PC with `loginPicker: "known"`
  or `false` this is by design the first place an unmet account's name and picture appear.
- A collected account's hash record, in the keyring from the first `GET /keyring` after the
  collect, with its token as the cracking plan defines. Never its password: that reaches the
  keyring only through a successful crack (S7).
- A keyring row says nothing about where its account is admitted: a cracked password is offered on
  every sign-in screen, and a PC that does not admit the account answers `notPermitted`, which is
  the lesson of the hardened setup. `localTo` never reaches the keyring payload.
- `domain` on a sign-in PC object. It is not secret: a real sign-in screen names its domain, and
  the desktop may show it. It tells a curious player which PCs a domain account may use, which the
  player could learn by trying. It is author text: the schema limits it to a pattern of letters,
  digits, `.` and `-`, at most 32 characters, the validator applies the same rule, and the client
  shows it, like every display name in the collect panel, through `textContent` only.
- Sign-in tiles, unchanged shape, on each PC where the account may sign in (section 5); an
  `accountOnly` account's display name only in a session answer, a collect answer or a keyring row,
  and its username only in a collect answer or (once the cracking plan shows it) its hash row.

**Never reaches the browser.**
- `cachedAccounts` on a PC: added to `WITHHELD_OBJECT_FIELDS` (`network_access.rb:21`), so it is
  deleted from every object sent. The player learns a PC's cache only by collecting with admin.
- `cachedAt` and `harvestedAccounts`: server-written, never read from a sync body, never sent.
  No code serialises `player_state` whole: every client answer (bootstrap, room, sync, keyring,
  the API inventory route) picks named keys, and `seLandingPages` and `sePhishSends` stay
  server-only the same way (`GM:3030-3035`). The two new keys sit beside them in
  `ACCESS_STATE_DEFAULTS` and are named by no answer; the payload scan below proves it by value.
- `creds.admin`, `accountKind`, `localTo`, `domain` on an account: inside `creds`, already withheld
  (`WITHHELD_NPC_KEYS`, `GM:7332`).
- An `accountOnly` NPC's room entry: dropped from every room answer.
- This plan adds nothing to `policies`, which are sent in the bootstrap.

The payload scan of the no-exposure test covers the key names `cachedAccounts`, `cachedAt`,
`harvestedAccounts`, `localTo`, `accountKind` and `accountOnly`, and by value (in a game where the
player has not yet collected or signed in as them) the usernames and display names of every
`accountOnly` account and every collect pair string, over the bootstrap,
every room answer (including every PC's tile list), the sync answer and `GET /container`. It also
checks that no room answer holds an `accountOnly` NPC and that `hasPresentNpc` is false for a room
holding only one.

The server stays the only authority that grants a credential or a privilege (brief section 3). The
level is computed from server state; the cache is a server-declared list that grows only on an event
the server already validates; the collect, the hash proof and the account-kind decision are
server-side.

## 8. State and saved games

**S5a adds no key.** The level is computed on each read (section 5); `login_session_answer`
(`GM:4433`), `session_for_client` (`GM:3778-3792`) and the network host row pass fields one by one,
so `access` is a new parameter there, filled from `session_access(pc_id)`. A reload rebuilds the
level from the stored record. A locked admin session is sent without `access` and gets it back in
the unlock answer.

**S5b adds two server-only keys** to `ACCESS_STATE_DEFAULTS`, each with a flat empty default:
- `cachedAt`: grow-only array of `"<pcId>|<npcId>"`, written only by `record_borrow_done!` for a
  declared `after: "borrow"` candidate. It exists because `guestSessions` is wiped on reload.
- `harvestedAccounts`: grow-only array of `"<pcId>|<npcId>"`, written only by the collect.

Neither is trimmed, because the `harvested` hash proof reads `harvestedAccounts`, and losing a
`cachedAt` entry would un-cache an account. Both are bounded at run time by the scenario's declared
pairs, since the server writes only a pair `cached_accounts_at` or the borrow step accepts, and the
writers add a pair only when it is absent. On top, the validator caps `cachedAccounts` at 8 per PC,
and every declared pair has its own `hash` record in the credentials registry, which already allows
at most 64 entries (`MAX_ENTRIES`, `credential_model.rb:39`). So in a valid scenario the declared
pairs number at most 64 less the scenario's other registry entries, and each list holds at most 64
strings of under 140 bytes, about 9 KB at worst. A scenario that reaches a game without passing the
validator is still bounded by its own declared lists. Neither is read from a sync body or sent.

What the player sees is the hash record's keyring row, which
rides the existing `rev` digest, so nothing growing is re-sent. A reset drops both with the other
access keys (they are not on `reset_player_state!`'s preserved list, `GM:114-124`), which is right:
it also drops the sessions that earned them.

**S5c adds no key.** Account kind, `localTo` and domains are scenario-static. Lockouts are
unchanged.

## 9. Validator, schema and dungeon graph changes

**Schema** (`scripts/scenario-schema.json`). `creds` and sign-in PC objects are closed
(`additionalProperties: false`, `:4409`), so each field must be added:
- `creds.admin` (boolean), `creds.accountKind` (enum `local`, `domain`), `creds.localTo` (array of
  strings, at least one), `creds.domain` (string, pattern `^[A-Za-z0-9.-]{1,32}$`); all under the
  existing `x-serverOnly` `creds`.
- On a room NPC: `accountOnly` (boolean).
- On a sign-in PC object: `cachedAccounts` (array, at most 8, of `{ npc: string, after?: "borrow" }`, closed:
  `additionalProperties: false`, `^_` notes allowed; `x-serverOnly`) and `domain` (string, same pattern, sent).
- Nothing on `policies`.

**Validator** (new file `scripts/validate_privilege.rb`, one function `check_privilege(json_data)`,
required and run from `scripts/validate_scenario.rb` by one line beside the core plan's
`check_network_ops` call; the checks read through `CredentialModel` and do not edit
`check_access_model` or `check_credentials`):
- `cachedAccounts`: each `npc` is an account holder; no duplicates; the PC is a sign-in PC; the
  owner may be listed (that is how it becomes collectable). Each candidate has exactly one `hash`
  credential whose `account` is the candidate and whose proof is `{ "harvested": "<this PC's
  id>" }`, else error ("cached accounts are hashes: author one hash record per PC and account").
  Those records count toward the registry's existing cap of 64 entries, which is the only cap on
  declared pairs. This plan checks nothing on `crack`: whether the recipe's class resolves (a
  candidate with no `habits.password`, such as an `accountOnly` account, needs the recipe's
  `password` class), the facts, an optional `passwordPattern` and a `reused` source are all
  checked by `validate_cracking.rb`, by the cracking plan's "class resolves" rule. An `after: "borrow"` candidate on a PC
  with an `owner` or on a headless PC, error (the engine never performs that borrow,
  `performable?`). An `after: "borrow"` candidate
  needs a `borrow_session` workaround whose `pc` resolves through `find_login_pc`'s rule to this
  PC's id, else error. At most 8 per PC, else error.
- Info line for each owned PC an admin path reaches whose list does not name the owner: "owner not
  collectable here", so an author sees the choice.
- A cached account the PC cannot otherwise admit is allowed (info line: "collect-only on this PC").
- `local`: `localTo` present and every id a sign-in PC, else error; a `localTo` PC whose `access`
  list refuses the account, error (it could never sign in there). Info line for a `local` account
  with `creds.admin` and more than one `localTo` PC: "shared local administrator".
- `domain`: `creds.domain` present, and at least one sign-in PC with that `domain`, else error.
  Warn for a PC `domain` no account uses.
- An owner or a borrower whose account kind refuses its own PC, error.
- `accountOnly` on an NPC with no `creds.username`, error. An `accountOnly` NPC may carry only
  `id`, `displayName`, `npcType`, `creds`, `role`, `staff`, `accountOnly` and `_`-prefixed comment
  keys (the NPC schema leaves extra properties open). `staff` (`true` or `false`) is required, else
  error, because `identity_roles` makes every NPC with `creds` staff unless it says `false`
  (`access_identities.rb:63-64`). Any other key (`itemsHeld`, a story, a phone, `habits`,
  `awareness`, `voice`, a position or sprite) is an error, which the server readers of section 5
  rely on. Naming one where a person who walks and is met is expected
  is an error: a PC `owner`, an NPC with `workarounds` or `needsHome`, a `share_login` `with`, a
  `borrow_session` borrower or an `after: "borrow"` candidate. It may be listed in
  `cachedAccounts` (start candidate) and named by `grants.session.account`. Every person check
  that requires a position or sprite skips it, and so does `awareness_level` in
  `scripts/validate_access_work.rb:1520-1526`, which calls `NpcHabits.level_of` directly.
- A `|` in the id of a PC or NPC that `cachedAccounts` names, error: the pair strings of section 8
  are `"<pcId>|<npcId>"` and are split on that character.
- `domain` on a PC or in `creds` outside the schema pattern, error.
- Two profiles with top-level items of the same name that meet on a PC only through an admin
  session (a `creds.admin` account or an admin technique grant that can hold that PC), warn. A
  scenario with neither gets no such warning; the validator snapshot of section 10 checks it.
- A `remove_item` that is not the first action of its list (a `triggerOnInteract` or an `onConfirm`)
  on a USB-governed object, warn: a gated remove stops its list there and waits (section 5), so the
  actions before it run even when the server refuses the plant. No shipped `remove_item` object is
  governed, so no shipped scenario gets it.
- One object whose `needsSession` grants (found by the walk of section 5) name two different PCs,
  warn: the engine judges only the first.
- Every check here that asks whether a PC admits an account uses `CredentialModel.pc_admits_account?`
  (`validate_scenario.rb:7583`), which carries the account-kind rule.
- A `hash` credential with a `harvested` proof: the PC is a sign-in PC and `account` is in its
  `cachedAccounts`, else error. A `harvested` proof on any kind other than `hash`, error.
- Owned by the core plan's validator pass, not this one: a step-up weakness whose
  `grants.session.account` no account on the PC would be admitted as (core runs
  `pc_admits_account?` with the account-kind rule on it).
- Solvability warning, here: a PC with `cachedAccounts` that no admin path reaches (no account with
  `creds.admin` admitted there and no step-up weakness on its host).

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`, beside the `password` habit edges at
`:427-450`; reach input `AccessIdentities.reach`, `lib/break_escape/access_identities.rb:291-306`).
New node `admin@<pcId>` for each PC with an admin path, with edges from each administrator account
admitted there and from every weakness whose grant has `access: admin` (the core plan's step-up;
before S5a lands, the core plan ends such a weakness at `lock_<pcId>`). New edges `admin@<pcId>` →
the hash record node for each cached account, labelled "collect", and, for `after: "borrow"`, a
second input from the borrow workaround. The cracking plan's edge from a hash record to `<npcId>
password` carries on from there, so `reach` treats a collected and cracked account like a captured
one, and a shared local administrator or a domain administrator shows every PC it opens. No
password text in any label.

## 10. Effect on existing scenarios

A scenario that sets none of the new fields behaves exactly as before:
- **S5a.** No account has `creds.admin` and no technique session exists, so `session_access` never
  answers admin, no session answer gains `access`, and every admin branch is a guard not taken.
  Two refusals are new in every scenario. The inventory `remove` action refuses a plant the USB
  policy refuses (today it removes the item silently). An honest client sends such a remove only as
  a gated remove (section 5), and no shipped scenario has one: no `remove_item` or `consumesItem`
  object that could take a refused item is USB-governed, so the two-items case (one refused, one
  accepted) cannot arise in one, and every shipped remove keeps today's order and timing. The
  implant path answers `needs_console` where it answered `not_ready` for a live non-keyboard
  session. **This is the one visible change in an existing scenario**, and it is accepted
  (section 15): in `test_access_networks` (`sam_dock`, `kiosk_dock`) and `demo_access_tour`
  (`implant_socket`), the only shipped scenarios besides `test_author_notes` with a `needsSession`
  grant, a player who holds only a remote session on the PC and plugs the BadUSB into its socket
  now sees "Nobody is signed in at this keyboard." where today nothing happens. It grants and
  records nothing, the device stays held, and the unchanged test expects `needs_console` in place of
  `not_ready` for that one answer and nothing else. `test_author_notes` holds its grant only inside
  a note, which no path runs. The golden sequences add one plant the policy allows, which must
  answer and record as before.
- **S5b.** No `cachedAccounts` and no admin, so the collect route answers 422 `reason: "not_admin"` and
  `cachedAt`, `harvestedAccounts` stay empty. `record_borrow_done!` adds nothing without a declared
  candidate. No registry entry has a `harvested` proof, so the keyring lists the same rows, in the
  same order, with the same fields, and `rev` is unchanged.
- **S5c.** No `accountKind`, so `account_kind_admits?` returns true and `pc_admits_account?` answers
  from the `access` list as today, in both definitions. No NPC has `accountOnly`, so tiles,
  `hasPresentNpc` and `hasNPCs` are unchanged.

**Proof.** `test/integration/ops_privilege_unchanged_test.rb` replays fixed request sequences on
`test_access_signin`, `test_access_sessions`, `test_access_keyring` and `test_access_social` (sign-in,
lock, unlock, keyring sign-in, borrow "done", implant, `GET /container`, `GET /keyring`) and compares
the server state and every answer body with JSON fixtures in the shared folder
`test/fixtures/files/ops_unchanged/` (built in the log rows plan's L1a), named `privilege_<scenario>.json`,
captured from `main` before any engine change and compared by the one shared helper
`bin/ops-golden-compare` (the log plan's L1a builds it and owns its spec). This plan builds no golden
mechanism of its own. The test is the first commit of S5a, before any engine change. Three rules
keep the comparison honest:
- `ACCESS_STATE_DEFAULTS` is filled into every game's `player_state` (`GM:7576`), so the new empty
  keys appear in the server state. The comparison removes `cachedAt` and `harvestedAccounts` and
  asserts them separately as empty. The shared helper strips the empty new keys of every ops plan
  (its spec is in the log plan's L1a).
- Server times (`guestSessionsAt`, the hand-over `time`, `npc_frustration.rb:545`) and token clocks
  vary per run, so the shared helper freezes the clock (log plan's L1a).
- Tile lists are part of every room answer, so they are compared too.

A validator snapshot over every shipped scenario shows no new error, warning or info line.

## 11. Tests

**Server unit** (`test/models/`). Each case is tagged with the first stage that can run it.
- `session_access_test.rb`. S5a: every row of the helper in section 5, sessions made through the
  real routes: password user, password admin, credential admin, `token` session of an administrator
  (admin), owner claim of an admin account (user), guest claim (user), relay (user), locked (nil),
  expired token (nil), route down (nil), PC off (nil); lock then unlock keeps admin; Switch user to a
  user account drops it; a borrow's displacement of a keyboard session drops it, and a remote or technique admin session keeps `access` (and its plant override) through a borrow; `access` present on the mirror entry, the
  sign-in answer and the host row for a password admin session, and absent from the next answer
  after the route drops or the PC goes off. S3: a technique session with `access: "admin"`; a relay
  session and a guest claim each feed a step up to admin.
- `admin_profiles_test.rb`. S5a: admin at P lists the owner's profiles once; a user session lists
  only its own; `GET /container` of another PC's owner's profile through the admin session at P is
  refused; `session_admits?` names the admin PC; `admin_profile_read` stores one row and one save on
  the first open, none on a reopen, and no save at all in a scenario without `logSources`; with
  `logSources`, the validator refuses a 41-character profile id. S5b: the
  cached accounts' profiles are listed, each once.
- `admin_usb_test.rb`. S5a: implant and plant proof both allowed under a keyboard admin session and
  refused under user; the plant proof allowed under a remote admin password session (through a
  foothold, and `from` another desktop); at both sites refused under a locked admin session and a
  relay session; refused under any admin session on a PC whose service is off; a session-shaped
  implant refused with `needs_console` and its line for a remote or technique session, admin or
  not, with the device still held, and `not_ready` kept for a PC with no session at all; the plant
  proof for a `needsSession` object refused under a remote admin session and allowed under a
  keyboard one, with the grant nested in a `confirm_action` and naming another PC, and judged by
  that PC's session (`session_grant_pc` finds it there and answers nil for no grant, and answers
  the first grant's PC, depth-first in list order, when two name different PCs); a
  `plant_policy_refusal` of nil for a hideable item, a client-forged item, an object that does
  not take the item and an item not held; two identical gated removes under an admin session
  (the retry of a remove whose answer was lost): the first answers 200 and records one
  `plantedItems` entry, the second answers 200, removes nothing and leaves one entry; the same lapsed-override refusal through an object that takes the item by a
  confirm's `remove_item`; NPC-side `usb_habit_refused?` unchanged under player admin. Lapsed override: a
  token admin session past its expiry, a foothold admin session after the foothold is unplugged, and
  one whose route an outage drops each plant a blocked stick through the inventory `remove`
  action and get 422 `usb_refused` with the policy's line, the item still in the inventory and no
  `plantedItems` entry; a plant the policy accepts is removed and recorded as today. S3: the plant
  proof allowed under a technique admin session and refused under a technique user session.
- `cached_accounts_test.rb`. S5b: listed start candidates cached, an unlisted owner not; an `after:
  "borrow"` candidate cached only after an accepted "done" at that PC, not after a "done" at another
  PC, a dwell-refused early "done" or a resent one; a `cut: true` "done" does cache (accepted
  behaviour, kept so nobody removes it); a borrower locked out at the PC caches nothing; a careful
  guest caches; a second borrow by the same NPC adds no second pair; `cachedAt` survives a reload
  while `guestSessions` does not; a `cachedAt` pair for an undeclared candidate is ignored.
- `harvest_test.rb`. S5b: collect adds pairs once; a second collect adds nothing and writes no row;
  after a borrow "done" a collect answers 404 until the guest claim at the desk writes the
  borrower's session record, then 422 `reason: "not_admin"`, and
  after signing back in as the administrator (Switch user) it adds the new account; each collected
  pair's `hash` record appears in `GET /keyring` with the answer's `hashId`, and no
  `<npcId>.password` row appears for it; the `harvested` proof holds for the collected PC and not
  for another PC listing the same account; an account both captured and collected keeps its one
  capture password row beside the hash record; a crack through S7's route on a collected hash
  grants the password (the real path end to end); a hash record with `crack` on an `accountOnly`
  account cracks from that recipe; the shared local administrator collected on a second PC after
  its password is held adds a pair whose hash row reads as cracked. S8: a cracked administrator
  password still meets the PC policy's second step.
- `pc_admits_account_test.rb`. S5c, before the delegation: the two definitions answer alike over
  every PC and account of the shipped scenarios. After it, the truth table is asserted against the
  one body in `account_kind_test.rb`.
- `account_kind_test.rb`. S5c: every cell of the truth table on both the typed and keyring paths,
  each refusal uncounted; the shared local administrator collected and cracked on `pc01` signs in as admin on
  `pc02`; `lab1Admin` is refused on `pc01`; the domain administrator signs in as admin on every
  domain PC and is refused on a PC without the domain. Row tests: a `local` and a `domain`
  account refused by kind each write one `signin_refused` row whose detail has that `kind`; an
  account refused only by the PC's `access` list writes a row with no `kind`.
- `account_only_readers_test.rb` (S5c, section 5): the reader cases and the manifest check there;
  the NPC signs in by typed username.
- `login_tiles_test.rb`. S5c: a `local` account has tiles only on its `localTo` PCs, a `domain`
  account only on its domain's PCs; an `accountOnly` account none; an existing scenario's tiles
  unchanged.

**Controller** (`test/controllers/harvest_credentials_test.rb`, S5b): each refusal of section 6 in
order, each asserting nothing was written; an unknown id and a real PC id with no session give
the same status and body once the echoed id is replaced; a route the desktop would refuse is
refused alike; the success answer with `keyringRev`, `username`, `portrait`, `hashId`, no password, no hash
token and `Cache-Control: no-store`; the repeat answer; hostile `pc_id` values (non-string, 41 characters, 10 KB, another
game's PC id).

**No exposure**: the list in section 7 at each step of a full run of `test_ops_privilege`, added to
`test/controllers/break_escape/network_no_exposure_test.rb`, the file on `main`, or to the core
plan's `network_ops_no_exposure_test.rb` if that has landed first.

**JS unit** (`test/js/`): `pc-sessions` keeps `access` through `publicSession` and the bootstrap
adopt, and drops it when the mirror locks a session; `sessionAdmin` is false for a locked mirror
entry that still held `access`, true for a `remote` entry with `access: "admin"`, and false for a
relay entry (which never carries it); a later answer for the same PC with no `access` (the PC gone
off) clears it from the entry and `sessionAdmin` is then false; after a desktop 403 with reason
`off` for that PC, `sessionAdmin` is false and a refused stick stays in the tray; a stick refused
for a `remote` user entry shows the policy's refusal message and stays in the tray; `keyboardAdmin`
is false for an admin entry with `remote: true`, a `footholdId`, `relay: true` or a `fromPcId`, and
for a technique copy (`remote` and `footholdId`), and true for a keyboard admin entry;
`sessionGrantPc` finds the grant's `pc` inside a `confirm_action` `onConfirm` (the `sam_dock` shape)
and at top level, and answers null for an object with no `needsSession` grant; for a `sam_dock`-shaped
socket with a policy of its own, the client override follows `keyboardAdmin` of the grant's PC, not
of the socket's id; `sessionAdmin` takes the object's id and is false for a governed object with no
mirror entry; `gatedRemove` is true only for a governed object whose policy refuses the item; a
gated `consumesItem` plant waits for the remove answer, and a 422 `usb_refused` keeps the item,
shows the server's line, emits `usb_refused:<objectId>` and fires no `triggerOnInteract`; a gated
`remove_item` inside a confirm's `onConfirm` under a lapsed override keeps the item and runs none of
the actions after it, and on success removes the item and runs them; with two matching items, one
refused and one accepted, `remove_item` removes the accepted one; another refusal and a network
failure each keep the item with their line (the server's `error`, else "That did not go through.
Try again."); a second interact, and a second `remove_item`, while the object is in
`plantsInFlight` sends nothing and fires nothing, and the object leaves the set on a failure; a
second object asking for the same item while it is in flight sees the "not held" path and sends
nothing; when both attempts fail the item stays and the next try succeeds and fires
`triggerOnInteract` once; `plantAdmin` gives the same answer to `interactions.js` and
`apply-actions.js` for a `sam_dock`-shaped object (a grant inside a confirm naming another PC) and
for an object with no grant; a
remove that is not gated (an ungoverned `wall_port`-style object) keeps today's order and
fire-and-forget send; `network-links.js` shows a toast and emits
`network_device_refused` for `needs_console`; the desktop
shows the marker and the collect control only for admin; the collect calls `keyring.refresh()`,
the panel uses the answer's `portrait`, shows the username, "hash" and a Crack button that opens
the cracking scene with the answer's `hashId`; `plantRefusal` with `admin`; a
session with an `npcId` the client never loaded renders; hostile display names and a hostile
`domain` value rendered as text. A new module is added to every copy list that copies the module
importing it (grep `test/js` for the importer's name before finishing).

**Validator** (`test/js/validator-privilege.test.mjs`, new). The repo tests each `scripts/validate_*.rb`
file from `test/js/validator-<name>.test.mjs` (for example `validator-capture-log.test.mjs` for
`validate_capture_log.rb`): it runs `check_privilege` through `ruby -e` on a fixture scenario and
asserts on the returned lines. One fixture per error and warning of section 9, and a clean one.
For the `remove_item` warning: a governed object with `remove_item` second in an `onConfirm`
(warn), the same object with it first (no warning), and an ungoverned object with it second (no
warning). For the two-PC warning: an object whose `needsSession` grants name two different PCs
(warn) and one whose grants name the same PC twice (no warning).

**Feature scenario** `test_ops_privilege`, grown per stage (the schema is closed, so each stage
adds only its own fields):
- S5a: an ordinary user and an administrator account (`creds.admin`); an owned PC with the owner's
  profile; one PC with `usb: "blocked"`; one profile per account; beside that PC, a BadUSB socket
  whose `needsSession` grant sits inside a `confirm_action` and names the PC (the shipped socket
  shape), and a governed port that takes a stick through a confirm's `remove_item` listed first.
- S5b adds: an unowned hot desk with one start candidate and one `after: "borrow"` candidate whose
  `borrow_session` workaround names it; the owned PC listing its owner as a candidate; one `hash`
  record with a `harvested` proof per candidate, each crackable through the cracking plan's
  facts, which the scenario places for the player to find.
- S5c adds: three PCs sharing the `accountOnly` `deskAdmin`, each listing it in `cachedAccounts`
  with a `hash` record per PC that carries `crack` (a `guessable` recipe whose fact is on a takeable
  rota poster item the player finds in the IT room); `lab1` with its own `accountOnly` administrator, cached and
  recorded the same way with a `strong` recipe; a domain with its administrator and two domain PCs.
Each stage ships `mission.json`, a regenerated graph and `PLAYTEST.md`.

**Scripted playtest** through `window.__test`, per stage:
- S5a: sign in as the user, see no other profile and no collect; sign in as the administrator, see
  the owner's profile; plant a refused stick at the keyboard under admin; lock the screen and see
  the same stick refused; sign in to the same PC remotely as the administrator from another
  desktop, walk to it and plant a second refused stick, which is accepted; plug a BadUSB into the
  PC's separate socket (a `sam_dock`-shaped object whose grant, inside a confirm, names the PC) under
  the same remote admin session, confirm, and see "Nobody is signed in at this keyboard." with the
  device still held; sign in at the keyboard as the administrator and see the same socket take it;
  let a token admin session expire without a client update, plant a refused stick through a
  confirm's `remove_item` and see the server's refusal with the stick still in the tray and the
  confirm's later actions not run; turn the PC's service off and see a third refused.
- S5b: collect on the owned PC and on the hot desk; make the borrow candidate's need fail until
  its frustration reaches the workaround's `at` level (the counted fails after which `choose_run!`
  hands a workaround over, `npc_frustration.rb:526-547`), using the same steps as the borrow in
  `test_access_social`'s playtest; wait for the "done" (a collect now answers 404), open the desk
  so the guest claim writes the borrower's session, see no collect control (a collect answers 422
  `not_admin`), Switch user, sign in as the
  administrator, collect again and get the new account as a hash; press Crack in the collect panel,
  crack it with the facts found, and sign in as that account elsewhere.
- S5c: take the IT room poster, collect `deskAdmin`'s hash on `pc01` (its username shows in the
  collect panel), crack it from its keyring row with the poster's facts, use the password on
  `pc02` as admin, typed (no tile); collect on `pc02` and see its row already cracked; fail on
  `lab1` with it; sign in as the domain administrator on both domain PCs.
Assert both sides: `access`, hash records and cracked password rows in the browser, and no
password in any collect answer; `sessions`, `cachedAt`, `harvestedAccounts` on the server.

**Live browser proof** on the real path (sign-in screen, collect control, keyring panel, a second PC)
in a headless browser, per the fix-claims-need-live-proof rule.

## 12. Build steps and shared files

Order: S5a (after S3), S5b (after S5a and S7), S5c. Each step commits its own files before its
tests run.

Files this plan changes:
- `app/models/break_escape/game.rb`: `session_access`, `session_admin?`, `keyboard_admin?`,
  `plant_policy_refusal`, `account_admin_at?`,
  `admin_profiles_at`, `pc_present_accounts`; the admin branches in `login_desktop_contents`,
  `find_login_item`, `session_admits?`, `scope_admitted_by_session?`; `access` parameter in
  `login_session_answer` and `session_for_client`; `cached_accounts_at`,
  `harvest_cached_credentials!`; two `ACCESS_STATE_DEFAULTS` keys;
  `pc_admits_account?` delegating to `CredentialModel`; `login_account_tiles` skipping
  `accountOnly`; the first-group readers of section 5 (`filtered_room_data`, `hasPresentNpc`,
  `npc_in_room?`, `ko_claimable_room_npc_ids`, `character_sprite_keys`) reading `account_only?`.
- `test/fixtures/files/ops_unchanged/privilege_<scenario>.json`: this plan's unchanged-scenario
  fixtures, compared by the log plan's `bin/ops-golden-compare` (section 10).
- `scripts/validate_privilege.rb` (new): this plan's validator checks (section 9), required and run
  from `scripts/validate_scenario.rb` by one line.
- `lib/break_escape/credential_model.rb`: `pc_admits_account?` calling `account_kind_admits?`;
  `harvested` added to `PROOF_KINDS`.
- `lib/break_escape/access_work.rb`: `admin:` keyword on `plant_refused?`.
- `app/models/break_escape/network_access.rb`: implant call site; the `needs_console` refusal in
  place of `implant_not_ready` at `:498` and `:501` when a live non-keyboard session is there;
  `cachedAccounts` in `WITHHELD_OBJECT_FIELDS`.
- `app/models/break_escape/capture_proofs.rb`: plant proof call site, with `keyboard_admin?` of the
  grant's PC for a `needsSession` object.
- `lib/break_escape/capture_model.rb`: `session_grant_pc(obj)`, the nested walk beside
  `removes_item?`.
- `app/models/break_escape/npc_frustration.rb`: `record_borrow_done!` writes `cachedAt`.
- `app/models/break_escape/credential_keyring.rb`: the `harvested` branch in
  `credential_proof_holds?`.
- `lib/break_escape/access_identities.rb`: `account_kind_admits?`, `account_only?`; `reach` for
  collected accounts. `lib/break_escape/npc_habits.rb`: `expand!` skips `account_only?`.
- `app/controllers/break_escape/games_controller.rb`, `config/routes.rb`: the `plant_policy_refusal`
  check at the top of the inventory `remove` branch (`games_controller.rb:1454-1460`), before
  `record_planted_item!` and `remove_inventory_item!`; the collect route;
  `harvest_credentials` added to the `set_game` list and to `with_game_lock`; `hasNPCs` and the NPC
  count (`games_controller.rb:527`, `:603`) reading `account_only?`; `#container` writes
  `admin_profile_read` in its profile branch, after the reach check passes and the contents are served.
- `app/policies/break_escape/game_policy.rb`: the `harvest_credentials?` method;
  `test/unit/break_escape/policy_test.rb` adds the action to `DEVICE_ACTIONS`.
- The network host row's serialiser (the core plan's), for the `access` rule.
- `scripts/scenario-schema.json` (the section 9 fields, `harvested` (string) in the credential
  proof properties at `:293-305`), `scripts/generate_dungeon_graph.rb`; `scripts/validate_scenario.rb` gains one
  `require_relative` and one call line only.
- Client: `pc-sessions.js` (`sessionAdmin`, `keyboardAdmin`, `plantAdmin`), `interactions.js`
  (`objectData` in the opts of both calls, the predicate per object via `plantAdmin`, the wait on a
  gated `consumesItem` plant and the `plantsInFlight` and item guards), `pc-policy.js`
  (`sessionGrantPc`, `gatedRemove`), `apply-actions.js`
  (`objectData` threaded through `confirm_action`; `sendInventoryRemove`'s `withBody` option; the
  `remove_item` action's item pick and its wait on a gated remove), `network-links.js` (`needs_console`), the desktop
  view and collect panel, `keyring.js` call, and a call that opens the cracking plan's scene for a
  `hashId`.
- `docs/ACCESS_AND_NETWORKS.md` and the `README_scenario_design.md` feature index (A18 to A20).

**Shared with other ops plans** (agree edit order):
- `start_login_session!`: the core plan adds the stored `access:` and `technique:` for a technique
  record; this plan reads `access` only through `session_access`.
- `record_borrow_done!`: shared with the core plan, which makes it delete only a keyboard record
  (a record with `foothold` or `from` stays); this plan writes `cachedAt` after the lock-out
  branch. Agree the edit order with the core plan.
- `login_session_answer`, `session_for_client` and the host row: the `access` rule of section 5.
  S3 lands first, and the core plan adds the answer parameter; S5a finds it there.
- `attempt_login!` and `attempt_credential_login!`: S8 adds the second step after the Admission
  step (`pc_admits_account?`); this plan changes only `pc_admits_account?`.
- `credential_model.rb`: S7 and S8 may read `pcs_accepting`; this plan changes only its admission.
- The unchanged-scenario fixture folder and `bin/ops-golden-compare` (section 10), built in the log
  plan's L1a and shared by every ops plan's unchanged test.
- `GamesController#container`: the log plan's L3 (`share_folder_opened`) and the lock plan (Rules
  C and D) edit the same action as this plan's profile branch; agree the order.
- `credential_keyring.rb` and `credential_model.rb`: S7 lands first with the `hash` kind, its
  crack grant and its keyring row; S5b then adds only the `harvested` proof kind.
- `ACCESS_STATE_DEFAULTS`, `AccessIdentities.reach`, the dungeon graph and the validator.

## 13. Log rows this feature writes

Storage and reading are S9's. Rows go through S9's one helper, which lands first (L1a), before any stage of this plan.
S5b registers no secret source of its own: the log rows plan's L1a credential source covers keyring entries, including `hash` entries, so no row can show a hash value.
A step up is the core plan's technique row and is not listed here.

Event names and details are as the log rows plan's section 13.7 writes them (`OpsLog::EVENTS`).

| Stage | Event | `as` | `where` | `result` | `detail` | Bound | Saved by |
|---|---|---|---|---|---|---|---|
| S5a | `admin_profile_read` | `{ account: }` (the session's) | `pc` | ok | `profile` (`{ id: 'profile' }`) | `once: true`: one per PC, profile and account | `GET /container`, which saves nothing of its own: `save!` only when `r&.stored?` |
| S5a | `usb_install_overridden` | `{ account: }` | `pc` | ok | `device` (the closed list of `usbClass` values the schema allows) | merged repeats | the implant action and the plant proof, which already save |
| S5b | `credentials_harvested` | `{ account: }` | `pc` | ok | `count` (integer: hashes added, `{ count: 9 }`; a collect adds at most 8, the cap of section 9) | one per collect that adds a pair; a repeat adds none and writes nothing | the collect route, which saves when a pair is added |

Nothing in this feature reads a log row back. Every collected pair is a hash, so `count` is the
number of hashes obtained; there is no separate hash row. Cracking writes no row: it is offline and leaves nothing on the
target, so collecting the hash (the row above) is this plan's own and the only one.
No `detail` holds a secret: an authored id, a `usbClass`, a count; never a password, a hash token
or a code. The helper cuts nothing: a PC or profile id over
40 characters, or an account username over 32, makes the call malformed (no row, a raise in test
and development). So every PC id, profile id and account username these rows carry must be within
those limits in a scenario that declares `logSources`, and the log rows plan's validator check
enforces it there. The collect route caps `pc_id` at 40 in every scenario, so this plan's validator
also makes an id over 40 on a PC with `cachedAccounts` an error whatever `logSources` says. An
account-kind refusal is an ordinary refused sign-in (422 `notPermitted`) and is the log rows plan's
`signin_refused` row; this plan writes none, and S5c registers that row's optional `kind` detail
(`local`, `domain`). S5c also adds `detail: { 'kind' => <the account's accountKind> }` to the log
plan's L1b `signin_refused` call, only when `account_kind_admits?` is what refused. `pc_admits_account?` returns only a boolean,
so when it returns false the sign-in caller calls `account_kind_admits?(pc, npc)` itself: false
there is the kind refusal and passes `kind`; true means the PC's `access` list refused, and passes
no `kind`. A controller test covers each of the two refusals.

## 14. What this plan relies on from other plans

Each entry names what this plan needs from another plan and the section of that plan that provides it.

- **OPS_CORE_PLAN.md, sections 0 and 5.4 (S3).** The step up is the core's weakness shape; this plan
  adds no other route to admin except signing in with an administrator account. The core's
  `needs.session` check calls `session_access(pc_id)`: `"user"` is met by any live session (relay and
  claims included), `"admin"` by an admin one. The core stores `access` on technique records only;
  nothing else stores it. The details this plan builds on:
  - The answer rule: the sign-in answer, `session_for_client` and the host row carry
    `access: "admin"` when `session_access` is admin, for any session kind, and omit the key
    otherwise. The record's stored value is never passed through, so a technique user session sends
    no key. No session of a scenario without `creds.admin` or a technique grant carries `access`.
    S3 lands first and this plan adds the answer parameter.
  - A password sign-in that replaces a technique record takes the level of the account signed in
    with.
  - The core's validator pass runs `CredentialModel.pc_admits_account?` (which carries the
    account-kind rule) on `grants.session.account`.
  - A technique admin session overrides a PC's USB policy for a plant like any other admin session
    on that PC (section 5). A session-shaped implant (`needsSession`) takes only a session at the
    PC's own keyboard: a device that types into a PC reaches whoever is signed in at that console,
    and the technique record keeps its `foothold`, so the implant path refuses it with
    `needs_console` ("Nobody is signed in at this keyboard."). The core's session-kinds table and
    its section 0 therefore say a technique session does not count for `needsSession`
    ("no (keyboard sessions only)").
  - The core's `network_technique_session_test` row for a refused implant does not assert the
    reason, so the S5a commit does not break it; the reason is asserted in this plan's
    `admin_usb_test.rb`. Before S5a that refusal answers `not_ready`; from S5a it is
    `needs_console`.
  - The core's `desktop_request_allowed?` terms let a technique admin session on a
    `remote: "blocked"` headless host through its own foothold only; the collect (section 6,
    step 3) passes only because they do.
- **OPS_CRACKING_PLAN.md, sections 4, 5, 9 and 14 (S7).** The cracking plan owns the `hash` record
  kind and the crack route and scene. This plan's side of the contract, exactly:
  - The dump is the collect route of section 6, on a sign-in PC, not a host: the marker is keyed by
    the sign-in PC's object id.
  - The marker is `player_state.harvestedAccounts`, an array of `"<pcId>|<npcId>"`, server-written
    only by the collect, grow-only, never trimmed, never sent.
  - The proof form is `proof: { "harvested": "<pcId>" }` (a string, like `session` and `foothold`,
    so `CredentialModel.proof_kind` reads it) on a `hash` registry entry whose `account` names the
    account; it holds when `"<pcId>|<account>"` is in `harvestedAccounts`.
  - A hash record whose account has no `password` habit (an `accountOnly` account, which carries no
    habits) carries its own crack recipe, `crack: { password, facts }`: the habit's class key, plus
    `facts` (1 to 4 intel fact ids with server-visible sources, required for `guessable`;
    `passwordPattern` is optional and the cracking plan checks it). The cracking plan reads `crack`
    when present and the habit otherwise, has `crack` in its `hash` entry schema, applies its
    "account needs a `password` habit" validator rule only to a record with no `crack`, and applies
    its fact-reachability warning to the recipe's pattern as to a habit's.
  - The hash row shows the account's username (as a password row does), so an account with no
    sign-in tile stays typeable after the collect panel closes.
  - An account cached on several PCs has one hash record per PC. A hash row whose account's
    `<npcId>.password` row the player already holds as cracked shows as cracked with no Crack
    button, so a shared administrator collected on a second PC is not a second puzzle.
  - A collected cached account is always a hash: the collect never yields a password, and every
    `cachedAccounts` candidate must have one such `hash` record (validator error otherwise), so a
    scenario that does not teach cracking declares no cached accounts.
  - S5b builds after S7. The cracking plan lands the `hash` kind, the crack route and scene, its
    crack grant and its keyring row with its Crack affordance first; S5b then adds `harvested` to
    `CredentialModel::PROOF_KINDS` and to `credential_proof_holds?`, with its validator check. This
    plan adds no password row builder for the cracking plan to share: the grant builder is the
    cracking plan's own.
  - The collect answer carries each pair's `hashId`, and the collect panel's Crack button opens the
    cracking plan's scene for that id, the same entry point as its keyring row. The scene can be
    opened for a given hash id from outside the keyring.
  - The dungeon graph gives a hash record an edge to `<npcId> password` through the crack, so the
    `admin@<pcId>` to hash record edge of section 9 carries on to the PCs the password opens.
  - A hash collected after a password reset (S8b) is of the scenario's password, and the crack grants
    that password, as for a capture from before the reset.
  - The cracking plan owns every rule on a hash record's `crack`, including `passwordPattern`, and
    its optional NPC habit parameter `passwordDifficulty` (`easy`, `medium`, `hard`) for an NPC
    whose account this plan collects as a hash; the `account` string and `crack.facts` are as
    sections 4 and 6 here describe them.
- **OPS_MFA_HELPDESK_PLAN.md, sections 5 and 14 (S8).** The order is the account-kind check inside
  the Admission step, then the second step, then the session. The account-kind check lives in
  `pc_admits_account?`, which `credential_login_checks` already calls, so the second-step re-judge
  picks it up. Account kind does not change the second step: every enrolled account meets the PC
  policy's `mfa`, `creds.mfa: false` is the only exception, and a local account is not exempt. The
  session write stores no level: the level is computed by `session_access`, and nothing is written.
  This plan writes no password row: a collected account is a hash, and its password comes only
  through the cracking plan's grant, and the new password after a reset comes only through the MFA
  plan's `<npcId>.reset` row. Lockouts and the failure counter are unchanged by this plan.
- **OPS_LOG_ROWS_PLAN.md, section 13 (S9).** `credentials_harvested` carries `count` only: every
  collected pair is a hash, so `count` says how many hashes a collect added. `usb_install_overridden`
  comes from any admin session on the PC, keyboard or remote, except for a session-shaped implant,
  which only a keyboard admin session at the grant's PC overrides; its fields are unchanged. A plant
  the server refuses (`usb_refused` from the inventory action, `needs_console` from the implant path)
  writes no row. The log plan's 13.7 carries both rules.
- **All ops plans.** One fixture folder, `test/fixtures/files/ops_unchanged/`, and one helper,
  `bin/ops-golden-compare` (section 10), both built by the log plan's L1a (OPS_LOG_ROWS_PLAN.md,
  sections 11 and 12), which strips each plan's new empty `ACCESS_STATE_DEFAULTS` keys and freezes
  the clock; and one test directory for unit tests (this plan uses `test/models/`).

## 15. Decisions

No question is open. Two choices shape later work:

- **A session-type implant takes a keyboard session only.** Any admin session overrides the USB
  policy for an ordinary plant, but a session-shaped implant gives a foothold through whoever is
  signed in. A device that types into a PC reaches whoever is signed in at that keyboard, and a
  remote or technique session is not at that console. A player holding only remote or technique
  admin on the PC who plugs a BadUSB into its socket opens the confirm (the socket itself carries
  no policy) and then sees the implant path's `needs_console` toast, "Nobody is signed in at this
  keyboard.", with the device still held. The implant path's session rule
  (`network_access.rb:498-501`) is not widened.
- **The new toast is accepted in two shipped scenarios.** Today a player who holds only a remote
  session on a PC and plugs a BadUSB into its socket sees nothing happen: the implant path answers
  a quiet `not_ready`. Now it answers `needs_console` and the player sees the toast; nothing is
  granted or recorded and the device stays held. The scenarios that show it are
  `test_access_networks` (`sam_dock`, `kiosk_dock`) and `demo_access_tour` (`implant_socket`),
  both test and demo scenarios, and there is no scenario option to keep the old silence. Every
  other existing behaviour is unchanged (section 10).

**Defaults this plan settles:**
- An account with no `accountKind` is unscoped, as every account is today: any other default would
  change existing scenarios.
- A locked admin session takes an implant the policy allows but never overrides the policy: a
  locked screen has no level, and letting it override would grant a privilege to nobody signed in.
- A collect and an admin action cost no game minutes and carry no detection risk; no server clock
  is assumed, and detection belongs to the parked defence work.
- Any live user session may start a step up, guest claims and relays included, so sitting down at
  a desktop someone left open is enough to try one (the lesson of an unlocked screen).

