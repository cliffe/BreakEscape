# Ops layer plan: privilege, cached credentials, local and domain accounts

Stages S5a, S5b, S5c. Feature ids on landing: A18 (privilege levels), A19 (cached credentials),
A20 (local and domain accounts). Drafted for the ops layer (brief
`docs/agents/OPS_LAYER_BRIEF.md`, outline `docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md` S5).

## 1. What this adds and why, in play

Three stages that turn a foothold on a machine into a proper hold over an organisation's accounts.

**S5a — privilege on a session (A18).** Every session the player holds on a sign-in PC is either a
*user* session or an *admin* session. A user session sees what its own account is allowed: its own
desktop and the profiles made for it. An admin session on a PC can do three more things there: open
the profiles of the other accounts that use that PC, collect the credentials that PC has cached
(S5b), and install a device the PC's USB policy would refuse. The player gets admin in two ways:
by signing in with an administrator account (one the scenario marks `creds.admin`), or by a step up
on a user session through a local weakness, which the core plan (S3) defines. Teaches: least
privilege, that an ordinary account is a start and not an end, and that local privilege escalation
is a step of its own.

**S5b — cached credentials (A19).** A PC remembers the accounts that have signed in on it. With
admin on that PC, the player collects those accounts into the keyring (A15) and reuses them
elsewhere. An account can be cached from the start, or only once the server has seen that person
sign in at that PC (a borrowed session handed back), so watching who uses a shared desk, or making
someone use it, pays off. A cached account yields its password, or a hash record for the cracking
minigame (S7) when the scenario authors one. Teaches: credential caching, reuse and lateral
movement, and why admin on one machine is worth having.

**S5c — local and domain accounts (A20).** Some accounts exist only on named machines (local);
others work on every machine that belongs to the organisation's domain. The weak setup gives a set
of machines one shared local administrator account, so collecting it on one machine opens them all
with admin. The hardened setup gives each machine its own local administrator, so what is collected
on one machine opens only that machine. Collecting a domain administrator's cached account opens
every domain machine as admin. Teaches: local against central identity, password reuse at scale,
and unique local administrator passwords as the mitigation.

Left out of this plan: a domain-wide lockout. Lockouts stay per PC and per username for every
account kind (section 15, question 6 says why and what it would take).

## 2. What the code does today

Verified against the code in the worktree. `GM` is `app/models/break_escape/game.rb`.

**A session has an identity, not a privilege.** `start_login_session!` (`GM:4388-4418`) is the one
writer of a session record: `{ 'id' => <npc id>, 'via' => 'password' | 'claim' | 'credential' }`
plus `credential`, `foothold`, `from`, `relay`. It builds a fresh record every time, so an unlock
(a fresh `POST /login`), a second sign-in, a keyring sign-in and a claim all rebuild it. One PC holds
one session. The core plan (S3) adds `via: "technique"` with `access` and `technique` keys, written
through new keyword arguments of the same method; no other session carries `access`.

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

**The USB policy is read in four player-side places.** Server: the implant path
(`network_access.rb:507-513`, `AccessWork.plant_refused?`, `lib/break_escape/access_work.rb:1198`)
and the plant proof (`app/models/break_escape/capture_proofs.rb:50-52`, a plant the policy refuses
is never recorded). Client: `plantRefusal` (`public/break_escape/js/systems/pc-policy.js:67-79`),
called from `interactions.js:1056`, so a refused item never leaves the tray. The NPC side reads the
same table (`access_work.rb:1265`, `npc-needs.js:321`) for NPCs' own sticks; a player's privilege
does not touch it. The implant path takes only a keyboard session: it refuses a foothold, relay or
`from` session (`network_access.rb:494-500`) and, by ruling, accepts a locked one (`:501`).

**The server sees one kind of NPC sign-in.** It records an NPC at a PC through a player sign-in or
claim, and through a borrowed session handed back: a `borrow_session` workaround's "done" is
accepted only with the hand-over token and after a dwell on server time
(`app/models/break_escape/npc_frustration.rb:181-191`), names a scenario-authored PC
(`record_borrow_done!`, `:391-394`) and writes `guestSessions`, which a reload wipes (`:250-259`).
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
session. Keyring sign-in (`attempt_credential_login!`, `credential_login.rb`) calls
`pc_admits_account?` too (`:53-57`). Nothing distinguishes a local account from a domain account.

## 3. Build stages in order

Each stage ships and tests alone. Size L overall, three M parts (outline S5). Order: S5a, then S5b
(it needs admin), then S5c (it needs S5b's collect for its lesson, though its sign-in check could
land alone).

**S5a — privilege levels (M).** One level helper, `session_access(pc_id)`, which answers `"admin"`,
`"user"` or nil (no live session) for every kind of session, read through the same validity checks
as every other reader. One opt-in account marker, `creds.admin: true`, so that signing in with an
administrator account gives admin (section 15, question 1). Two admin gates: the profiles of the
accounts that use the PC, and installing a device the USB policy refuses, at all four places the
policy is read. The core plan's step up (a weakness with `needs.session` and
`grants.session.access`) reads the level through this helper. S5a does not need S3: the feature
scenario's administrator account gives a real admin session at the keyboard, so every gate is
proved through the real sign-in route. When S3 lands, the same tests run again on a technique
session.

**S5b — cached credentials (M).** A declared list of cache candidates on each sign-in PC
(`cachedAccounts`), withheld from the browser. A candidate is cached from the start, or once the
server accepts that NPC's borrowed-session "done" at that PC; the server records the second kind in
a new key, `cachedAt`. A collect route that, with an admin session on the PC, records each cached
account in `harvestedAccounts`. A new keyring row source built from `harvestedAccounts`, sharing one
password row builder with captures and with cracking (S7). Where the scenario authors a `hash`
record with a `harvested` proof for that PC and account, the collect yields the hash instead of the
password. Admin profile reads (S5a) widen to the accounts cached on the PC once S5b lands.

**S5c — local and domain accounts (M).** `creds.accountKind` (`local` or `domain`), `creds.localTo`
(the PCs a local account exists on), `creds.domain`, and `domain` on a sign-in PC. One sign-in
check, `account_kind_admits?`, called from `pc_admits_account?`, so the typed and keyring paths both
apply it. A shared local administrator is one `local` account whose `localTo` lists several PCs; the
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
cached from the start. The PC's `owner` is always a candidate cached from the start and is not
listed.

```json
"rooms": { "office": { "objects": [
  { "type": "pc", "id": "hotDesk", "name": "Hot desk", "locked": true, "lockType": "login",
    "owner": "alexT",
    "cachedAccounts": [ { "npc": "priyaN" }, { "npc": "samO", "after": "borrow" } ] }
] } }
```

`samO` must carry a `borrow_session` workaround with `"pc": "hotDesk"`. Whether a cached account
yields its password or a hash is decided by the registry, not here: when a `hash` credential with
`proof: { "harvested": { "pc": "hotDesk" } }` exists for that account (S7's shape), the collect
yields that hash record; otherwise it yields the password.

**S5c.** On `creds`: `accountKind` (`local` or `domain`), `localTo` (array of sign-in PC ids,
required for `local`), `domain` (string, required for `domain`). On a sign-in PC: `domain`. On a
room NPC: `accountOnly: true` for an account with no person behind it.

```json
"rooms": { "it": {
  "npcs": [
    { "id": "deskAdmin", "displayName": "Desk administrator", "npcType": "person", "accountOnly": true,
      "creds": { "username": "deskadmin", "password": "Winter2026", "admin": true,
                 "accountKind": "local", "localTo": ["pc01", "pc02", "pc03"] } },
    { "id": "lab1Admin", "displayName": "Lab 1 administrator", "npcType": "person", "accountOnly": true,
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

`deskAdmin` is the weak setup: one shared local administrator on three PCs, so its password
collected on `pc01` opens `pc02` and `pc03` as admin. `lab1Admin` is the hardened setup: `lab1` has
an administrator of its own, and what is collected there opens nothing else. Absent `accountKind`
leaves an account unscoped, as today. The minimal room and NPC fields (position, sprite) are left
out of the examples for length; an `accountOnly` NPC needs none of them.

## 5. Engine behaviour: server then client

### Server

**S5a: the level helper.** `session_access(pc_id)` in `game.rb`, beside `session_identity`:

1. no session record at the PC → nil;
2. `credential_session_expired?(session)` → nil;
3. `session_identity(pc_id)` nil (locked, or the account is gone) → nil;
4. `session_route_up?(pc_id)` false (route lost, PC off, relay ended) → nil;
5. a relay session or `via: "claim"` (owner or guest claim) → `"user"`;
6. `via: "technique"` → `"admin"` when the record's `access` is `"admin"`, else `"user"`;
7. `via: "password"` or `"credential"` → `"admin"` when `account_admin_at?(npc, pc)`, else `"user"`.

`account_admin_at?(npc, pc)` is `creds.admin == true` and `pc_admits_account?(pc, npc)` (which,
after S5c, includes the account-kind rule). `session_admin?(pc_id)` is `session_access(pc_id) ==
"admin"`. The level is read, never stored, for every session except a technique one, whose `access`
the core plan writes. So nothing writes or sends a default level, and a rebuilt record gets the level
of the account it now holds: the same account typing its password to unlock comes back at the same
level; Switch user, a guest claim or a borrow's displacement drops to whatever the new holder has;
a technique session cannot lock (`session_lockable?` is false for it), so it cannot lose its level
that way. The core plan's `needs.session: "user"` is met when `session_access` is not nil (user or
admin); `needs.session: "admin"` when it is `"admin"`. The step-up's new account is whatever
`grants.session.account` names; this plan adds no condition on it.

**S5a: profiles.** Under S5a alone the admin set of a PC is its `owner`. Once S5b lands it is
`pc_present_accounts(pc)`: the owner plus the candidates in `cached_accounts_at(pc)` (S5b below).
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

**S5a: the USB override.** `AccessWork.plant_refused?(data, obj, item, admin: false)` returns false
when `admin` is true; every other caller is unchanged, so the NPC-side readers
(`access_work.rb:1265`) keep the policy. The two player-side server sites pass it:
- the implant path (`network_access.rb:509`): `admin: session_admin?(pc_id)`;
- the plant proof (`capture_proofs.rb:52`): `admin: session_admin?(found[:object]['id'])` when the
  target is a sign-in PC, else false.
The implant path still accepts only a keyboard session, so the override is reachable only by an
admin session held at the keyboard: an administrator account signed in by password or a keyboard
credential. A technique session always comes through a foothold and never overrides the USB policy.
A locked session still takes an implant the policy allows (the existing ruling) but has no level, so
a locked admin session does not override.

**S5b: the cached set.** `cached_accounts_at(pc)` answers the account NPCs cached at the PC now: the
owner; each `cachedAccounts` candidate without `after`; and each `after: "borrow"` candidate whose
`"<pcId>|<npcId>"` is in `cachedAt`. `record_borrow_done!` (`npc_frustration.rb:391`) gains one
step: when the borrower is an `after: "borrow"` candidate on that PC, add the pair to `cachedAt`
(grow-only, never trimmed). It runs inside the existing accepted-"done" path, so the hand-over token,
the dwell and the authored PC are already checked, and a resent "done" answered from `lastSpent`
writes nothing. A candidate that is not an account holder is ignored.

**S5b: the collect.** `harvest_cached_credentials!(pc_id)`, under `with_game_lock`:
1. requires `session_admin?(pc_id)` (the route checks why not, section 6);
2. for each account in `cached_accounts_at(pc)`, in that order, skips a pair already in
   `harvestedAccounts`, else appends `"<pcId>|<npcId>"`;
3. returns the new pairs and every pair held for this PC.
The session's own account is included: under a technique session the player does not know its
password, and under a password session the extra row is harmless. Nothing is trimmed: a keyring
proof reads the list.

**S5b: keyring rows.** One helper beside `implicit_keyring_entries`, `account_password_rows`,
answers how each account's password was earned, and lists `<npcId>.password` once per account with
one `source`, in the order `capture`, `harvest`, `cracked` (S7 adds its source to the same helper).
The row is built by one builder, `account_password_row(npc, source:, label:)`, extracted from the
current implicit builder, with the password text from `capture_secrets_for_client` for a capture and
from the account's password (the MFA plan's `effective_password(npc)` once S8b lands) for a harvest.
A harvest row is built for an account with a pair in `harvestedAccounts` unless a `hash` credential
with a `harvested` proof for that PC and account exists; then no password row comes from that pair,
and the registry lists the hash record because its proof now holds (S7 owns that proof kind). The
row's label is `Cached on <PC name>`, `how: "harvested"`.

**S5c: the account-kind check.** `account_kind_admits?(pc, npc)` in `AccessIdentities`, called first
by `pc_admits_account?`. Kinds only narrow; the PC's `access` list still applies afterwards.

| Account kind | PC `domain` | Admitted when | Refusal |
|---|---|---|---|
| absent (unscoped) | any | the PC's `access` list admits it (today) | 422 `notPermitted` |
| `local` | any | `pc.id` is in `creds.localTo` and the `access` list admits it | 422 `notPermitted` |
| `domain` | equal to `creds.domain` | the `access` list admits it | 422 `notPermitted` |
| `domain` | absent or different | never | 422 `notPermitted` |

The refusal is the existing step-6 answer, uncounted, so a wrong-kind sign-in with a right password
tells the player the password was right and the account does not belong there. Both sign-in paths
apply it (typed password, `attempt_login!`; keyring sign-in, `attempt_credential_login!`, which
calls `pc_admits_account?`). An owner claim and a guest claim are not sign-ins and skip it; the
validator makes sure an owner or a borrower is admitted at its own PC. A technique session runs no
account-kind check at run time: the validator applies `pc_admits_account?` with the account-kind
rule to `grants.session.account`, so an author cannot grant a session as a domain account on a PC
outside its domain. Account kind does not change the second sign-in step (S8): every enrolled
account meets the PC policy's `mfa`, and `creds.mfa: false` stays the only exception.

**S5c: accounts with no person.** `filtered_room_data` drops room NPCs with `accountOnly: true`, so
they never walk, talk, ring or show in a phone list. The server still finds them for sign-in
(`account_for_username`, `scenario_room_npc`). Their session answer carries `displayName` and no
portrait, so the desktop shows its generic account picture. The build checks that the client's
session mirror and the sign-in screen accept an `npcId` the client has no NPC for, and fixes either
if not.

### Client

The session answer and the bootstrap's sessions carry `access: "admin"` only when
`session_access` is admin; a user session carries no key. `publicSession`
(`public/break_escape/js/systems/pc-sessions.js:186-209`) is a field whitelist, so `access` is added
there and to the bootstrap adopt path. The desktop then shows:
- an Administrator marker on the taskbar beside the account name, in the pixel-art UI rule (2px
  border or the `ui-themes.css` 9-slice skin, pixel font);
- a "Cached accounts" control, only for admin. It posts to the collect route, then calls the
  keyring's `refresh()` (`keyring.js:436`). Its result opens a small panel listing each collected
  account with its headshot (the account's portrait, or the generic picture for an `accountOnly`
  one), its display name and "password" or "hash", and points to the keyring. A collect that adds
  nothing says so. The panel is the feedback, because the keyring's find toasts and Sign-ins list
  are not guaranteed to show a new row (`keyring.js:774-784`).

`plantRefusal(heldItems, objectData, scenario, { admin })` (`pc-policy.js:67`) lets every item
through when `admin` is true; `interactions.js:1056` passes `admin` from the session mirror for that
PC. The client only mirrors the server's decision so the item leaves the tray; the server checks
again. No client code decides privilege. The client learns about account kinds only through the
existing `notPermitted` refusal.

## 6. Server routes

Only S5b adds a route. S5a's gates ride existing routes (`GET /container` for profiles, the implant
action and the plant proof for USB); S5c's check rides `POST /login` and the keyring sign-in.

**`POST /harvest_credentials`** (new; `config/routes.rb` beside the keyring routes, action beside
`keyring` in `app/controllers/break_escape/games_controller.rb`). Params: `pc_id` (string, at most
64 characters). Runs under the game lock, as the other writing routes do.

Checks in order:
1. `pc_id` missing, not a string or too long → 400 `Missing pc_id`;
2. not a sign-in PC in a room (`find_login_pc`) → 404 `Sign-in PC not found`;
3. no session record at the PC → 422 `{ error: "Sign in required" }`;
4. the session is locked → 422 `{ error: "Sign in required", locked: true }`;
5. `session_access(pc_id)` nil for any other reason (expired, route down, PC off) → 403
   `{ error: "PC not reachable" }`;
6. `session_access(pc_id)` is `"user"` → 422 `{ error: "Administrator access required",
   notAdmin: true }`;
7. `harvest_cached_credentials!(pc_id)`; `save!` only when a pair was added.

Answer: `200 { success: true, harvested: [ { npcId, displayName, as } ], held: [ ... same shape ],
keyringRev }`, where `harvested` is what this call added, `held` is every account collected at this
PC so far, and `as` is `"password"` or `"hash"`. A repeat (for example after a lost answer) returns
`harvested: []` with the same `held`, writes nothing and writes no log row. `keyringRev` is in every
success answer. The answer never contains a password or a hash token; those arrive through
`GET /keyring`. `Cache-Control: no-store`, as the keyring route.

`POST /login` gains no param; its step-6 refusal also covers an account-kind mismatch. The implant
action gains no param; it reads the level of the session it already checks.

## 7. What reaches the browser, and what never does

**Reaches the browser.**
- `access: "admin"` on an admin session's entry (session answer and bootstrap); absent for user.
- The collect answer: account ids, display names and `password` or `hash`, for accounts the player
  has collected. No secret.
- A collected account's password, in its `<npcId>.password` keyring row, from the first
  `GET /keyring` after the collect. The player has earned it, as with a capture. A hash record's
  token reaches it as S7 defines.
- `domain` on a sign-in PC object. It is not secret: a real sign-in screen names its domain, and
  the desktop may show it. It tells a curious player which PCs a domain account may use, which the
  player could learn by trying.
- Display name of an `accountOnly` account, only in a session answer, a collect answer or a keyring
  row.

**Never reaches the browser.**
- `cachedAccounts` on a PC: added to `WITHHELD_OBJECT_FIELDS` (`network_access.rb:21`), so it is
  deleted from every object sent. The player learns a PC's cache only by collecting with admin.
- `cachedAt` and `harvestedAccounts`: server-written, never read from a sync body, never sent.
- `creds.admin`, `accountKind`, `localTo`, `domain` on an account: inside `creds`, already withheld
  (`WITHHELD_NPC_KEYS`, `GM:7332`).
- An `accountOnly` NPC's room entry: dropped from every room answer.
- This plan adds nothing to `policies`, which are sent in the bootstrap.

The payload scan of the no-exposure test covers `cachedAccounts`, `cachedAt`,
`harvestedAccounts` and `localTo` over the bootstrap, every room and `GET /container`, and checks
that no room answer holds an `accountOnly` NPC.

The server stays the only authority that grants a credential or a privilege (brief section 3). The
level is computed from server state; the cache is a server-declared list that grows only on an event
the server already validates; the collect, the keyring rows and the account-kind decision are
server-side.

## 8. State and saved games

**S5a adds no key.** The level is computed on each read from the session record and the scenario;
only a technique session's record carries `access`, written by the core plan. The session answer
gains `access: "admin"` for an admin session; `login_session_answer` (`GM:4433`) and
`session_for_client` (`GM:3778-3792`) pass fields one by one, so `access` is a new parameter there,
filled from `session_access(pc_id)`. A step up is answered by the core plan's technique route with
the one changed session. A reload rebuilds the level from the stored record, so an admin session
stays admin and a user session stays user. A locked admin session is sent without `access` and gets
it back in the unlock answer.

**S5b adds two server-only keys** to `ACCESS_STATE_DEFAULTS`, each with a flat empty default:
- `cachedAt`: grow-only array of `"<pcId>|<npcId>"`, written only by `record_borrow_done!` for a
  declared `after: "borrow"` candidate. It exists because `guestSessions` is wiped on reload.
- `harvestedAccounts`: grow-only array of `"<pcId>|<npcId>"`, written only by the collect.

Neither is trimmed, because a keyring row and a hash proof read `harvestedAccounts`, and losing a
`cachedAt` entry would un-cache an account. Both are bounded by authorship: an entry must be a
declared pair, and the validator caps `cachedAccounts` at 8 per PC and the declared pairs (owners
included) at 64 per scenario, so each list holds at most 64 strings of under 140 bytes, about 9 KB at
worst. Neither is read from a sync body or sent. What the player sees is the keyring row, which
rides the existing `rev` digest, so nothing growing is re-sent. A reset drops both with the other
access keys (they are not on `reset_player_state!`'s preserved list, `GM:114-124`), which is right:
it also drops the sessions that earned them.

**S5c adds no key.** Account kind, `localTo` and domains are scenario-static. Lockouts are
unchanged.

## 9. Validator, schema and dungeon graph changes

**Schema** (`scripts/scenario-schema.json`). `creds` and sign-in PC objects are closed
(`additionalProperties: false`, `:4409`), so each field must be added:
- `creds.admin` (boolean), `creds.accountKind` (enum `local`, `domain`), `creds.localTo` (array of
  strings, at least one), `creds.domain` (string); all under the existing `x-serverOnly` `creds`.
- On a room NPC: `accountOnly` (boolean).
- On a sign-in PC object: `cachedAccounts` (array, at most 8, of `{ npc: string, after?: "borrow" }`,
  `x-serverOnly`) and `domain` (string, sent).
- Nothing on `policies`.

**Validator** (`scripts/validate_scenario.rb`). This plan's checks go in `check_access_model`
(`:7642`) except the hash pairing, which goes in `check_credentials` (`:7304`):
- `cachedAccounts`: each `npc` is an account holder; no duplicates; not the owner; the PC is a
  sign-in PC; an `after: "borrow"` candidate has a `borrow_session` workaround naming this PC, else
  error. At most 8 per PC and 64 declared pairs (owners included) per scenario, else error.
- A cached account the PC cannot otherwise admit is allowed (info line: "collect-only on this PC").
- `local`: `localTo` present and every id a sign-in PC, else error; a `localTo` PC whose `access`
  list refuses the account, error (it could never sign in there). Info line for a `local` account
  with `creds.admin` and more than one `localTo` PC: "shared local administrator".
- `domain`: `creds.domain` present, and at least one sign-in PC with that `domain`, else error.
  Warn for a PC `domain` no account uses.
- An owner or a borrower whose account kind refuses its own PC, error.
- `accountOnly` on an NPC with no `creds.username`, error; with an ink story, phone or position,
  warn (they are never used).
- A `hash` credential with a `harvested` proof: the PC is a sign-in PC and `account.npc` is in its
  cached set, else error (S7 adds the proof kind; this check lands with it).
- Owned by the core plan's validator pass, not this one: a step-up weakness whose
  `grants.session.account` no account on the PC would be admitted as (core runs
  `pc_admits_account?` with the account-kind rule on it).
- Solvability warning, here: a PC with `cachedAccounts` that no admin path reaches (no account with
  `creds.admin` admitted there and no step-up weakness on its host).

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`, beside the `password` habit edges at
`:427-450`; reach input `AccessIdentities.reach`, `lib/break_escape/access_identities.rb:291-306`).
New node `admin@<pcId>` for each PC with an admin path, with edges from each administrator account
admitted there and from the core plan's step-up weakness. New edges `admin@<pcId>` → `<npcId>
password` (or the hash record) for each cached account, labelled "collect", and, for `after:
"borrow"`, a second input from the borrow workaround. `reach` treats a collected account like a
captured one, so a shared local administrator or a domain administrator shows every PC it opens. No
password text in any label.

## 10. Effect on existing scenarios

A scenario that sets none of the new fields behaves exactly as before:
- **S5a.** No account has `creds.admin` and no technique session exists, so `session_access` never
  answers admin, no session answer gains `access`, and every admin branch is a guard not taken.
- **S5b.** No `cachedAccounts` and no admin, so the collect route answers 422 `notAdmin` and
  `cachedAt`, `harvestedAccounts` stay empty. `record_borrow_done!` adds nothing without a declared
  candidate. The keyring row helper lists the same capture rows, in the same order, with the same
  fields, so `rev` is unchanged.
- **S5c.** No `accountKind`, so `account_kind_admits?` returns true and `pc_admits_account?` answers
  from the `access` list as today. No NPC has `accountOnly`.

**Proof.** `test/integration/ops_privilege_unchanged_test.rb` replays fixed request sequences on
`test_access_signin`, `test_access_sessions`, `test_access_keyring` and `test_access_social` (sign-in,
lock, unlock, keyring sign-in, borrow "done", implant, `GET /container`, `GET /keyring`) and compares
the server state and every answer body with golden files under `test/fixtures/ops_privilege_golden/`,
recorded from `main` before the build starts by the same test run with `RECORD_GOLDEN=1`. A validator
snapshot over every shipped scenario shows no new error, warning or info line.

## 11. Tests

**Server unit** (`test/models/`).
- `session_access_test.rb`: every row of the helper in section 5, one test each, with sessions made
  through the real routes: password user, password admin, credential admin, owner claim of an admin
  account (user), guest claim (user), relay (user), locked (nil), expired token (nil), route down
  (nil), PC off (nil); lock then unlock keeps admin; Switch user to a user account drops it; a borrow
  displacement drops it; a technique session with `access: "admin"` (once S3 lands).
- `admin_profiles_test.rb`: admin at P lists the owner's profiles (S5a) and the cached accounts'
  profiles (S5b), each once; a user session lists only its own; `GET /container` of another PC's
  owner's profile through the admin session at P is refused; `session_admits?` names the admin PC.
- `admin_usb_test.rb`: implant and plant proof both allowed under admin and refused under user; a
  locked admin session is refused by the policy; a foothold session never overrides; NPC-side
  `usb_habit_refused?` unchanged under player admin.
- `cached_accounts_test.rb`: owner and start candidates cached; an `after: "borrow"` candidate cached
  only after an accepted "done" at that PC, not after a "done" at another PC, a refused early "done"
  or a resent one; `cachedAt` survives a reload while `guestSessions` does not.
- `harvest_test.rb`: collect adds pairs once; a second collect adds nothing and writes no row; a
  later borrow then a second collect adds the new account; a password row appears in `GET /keyring`
  with `source: "harvest"`; an account both captured and collected is listed once as `capture`; a
  pair with an authored `harvested` hash proof yields no password row (once S7 lands).
- `account_kind_test.rb`: every cell of the truth table on both the typed and keyring paths, each
  refusal uncounted; the shared local administrator collected on `pc01` signs in as admin on `pc02`;
  `lab1Admin` is refused on `pc01`; the domain administrator signs in as admin on every domain PC and
  is refused on a PC without the domain.
- `account_only_test.rb`: an `accountOnly` NPC is absent from every room answer and signs in.

**Controller** (`test/controllers/harvest_credentials_test.rb`): each refusal of section 6 in order,
each asserting nothing was written; the success answer with `keyringRev`, no password and
`Cache-Control: no-store`; the repeat answer; hostile `pc_id` values (non-string, 10 KB, another
game's PC id).

**No exposure** (extend `network_ops_no_exposure_test.rb`): the list in section 7 at each step of a
full run of `test_ops_privilege`.

**JS unit** (`test/js/`): `pc-sessions` keeps `access` through `publicSession` and the bootstrap
adopt; the desktop shows the marker and the collect control only for admin; the collect calls
`keyring.refresh()`; `plantRefusal` with `admin`; hostile display names rendered as text. A new
module is added to every copy list that copies the module importing it (grep `test/js` for the
importer's name before finishing).

**Feature scenario** `test_ops_privilege`: an ordinary user and an administrator account; a hot desk
with an owner, one start candidate and one `after: "borrow"` candidate with its borrow workaround;
three PCs sharing `deskAdmin`; `lab1` with its own administrator; a domain with its administrator
and two domain PCs; one PC with `usb: "blocked"`; one profile per account. With `mission.json`, a
generated graph and `PLAYTEST.md`.

**Scripted playtest** through `window.__test`: sign in as the user, see no other profile and no
collect; sign in as the administrator, see the owner's profile and collect; wait for the borrow,
collect again and get the new account; use `deskAdmin`'s collected password on `pc02` as admin; fail
on `lab1` with `deskAdmin`; implant a refused stick under admin. Assert both sides: `access` and
keyring rows in the browser, and `sessions`, `cachedAt`, `harvestedAccounts` on the server.

**Live browser proof** on the real path (sign-in screen, collect control, keyring panel, a second PC)
in a headless browser, per the fix-claims-need-live-proof rule.

## 12. Build steps and shared files

Order: S5a, S5b, S5c. Each step commits its own files before its tests run.

Files this plan changes:
- `app/models/break_escape/game.rb`: `session_access`, `session_admin?`, `account_admin_at?`,
  `admin_profiles_at`, `pc_present_accounts`; the admin branches in `login_desktop_contents`,
  `find_login_item`, `session_admits?`, `scope_admitted_by_session?`; `access` parameter in
  `login_session_answer` and `session_for_client`; `cached_accounts_at`,
  `harvest_cached_credentials!`; two `ACCESS_STATE_DEFAULTS` keys; `pc_admits_account?` calling
  `account_kind_admits?`; `filtered_room_data` dropping `accountOnly` NPCs.
- `lib/break_escape/access_work.rb`: `admin:` keyword on `plant_refused?`.
- `app/models/break_escape/network_access.rb`: implant call site; `cachedAccounts` in
  `WITHHELD_OBJECT_FIELDS`.
- `app/models/break_escape/capture_proofs.rb`: plant proof call site.
- `app/models/break_escape/npc_frustration.rb`: `record_borrow_done!` writes `cachedAt`.
- `app/models/break_escape/credential_keyring.rb`: `account_password_rows`, `account_password_row`,
  the harvest source.
- `lib/break_escape/access_identities.rb`: `account_kind_admits?`; `reach` for collected accounts.
- `app/controllers/break_escape/games_controller.rb`, `config/routes.rb`: the collect route.
- `scripts/scenario-schema.json`, `scripts/validate_scenario.rb`, `scripts/generate_dungeon_graph.rb`.
- Client: `pc-sessions.js`, `pc-policy.js`, `interactions.js`, the desktop view, `keyring.js` call.
- `docs/ACCESS_AND_NETWORKS.md` and the `README_scenario_design.md` feature index (A18 to A20).

**Shared with other ops plans** (agree edit order):
- `start_login_session!` and `login_session_answer`: the core plan adds `access:` and `technique:`;
  this plan only reads `access` and adds the answer parameter after core lands.
- `attempt_login!` and `attempt_credential_login!`: S8 adds the second step after step 6; this plan
  changes only `pc_admits_account?`.
- `credential_keyring.rb` row helper: S7 adds `source: "cracked"` and the `harvested` proof kind.
- `ACCESS_STATE_DEFAULTS`, `AccessIdentities.reach`, the dungeon graph and the validator.

## 13. Log rows this feature writes

Storage and reading are S9's. Rows go through S9's one helper; until it lands the call is a no-op.
A step up is the core plan's technique row and is not listed here.

| event | who | where | when | result | detail |
|---|---|---|---|---|---|
| `admin.profile_read` | the session's account | the PC | each `GET /container` of a profile opened only by admin | `ok` | profile id |
| `usb.override` | the session's account | the PC | an implant the policy would refuse, installed under admin | `ok` | device class |
| `credentials.collected` | the session's account | the PC | a collect that adds at least one pair | `ok` | count, password or hash per account |
| `signin.refused` | the account named | the PC | an account-kind refusal | `not_permitted` | `local` or `domain` |

No row carries a secret. A domain sign-in records the PC as `where`, like any sign-in. A repeat
collect writes no row.

## 14. Cross-plan requests

- **To OPS_CORE (S3).** Agreed: the step up is your weakness shape; this plan adds no other route to
  admin except signing in with an administrator account. Your `needs.session` check calls
  `session_access(pc_id)`: `"user"` is met by any live session, `"admin"` by an admin one. You write
  `access` on technique sessions only; this plan reads it and writes no default. A password sign-in
  that replaces your technique record takes the level of the account signed in with. A technique
  session runs no account-kind check; please run `pc_admits_account?` with the account-kind rule on
  `grants.session.account` in your validator pass.
- **To OPS_CRACKING (S7).** The admin dump is the collect. The marker is `harvestedAccounts`
  (`"<pcId>|<npcId>"`, never trimmed). Your proof kind `harvested`: `proof: { "harvested": { "pc":
  "<pcId>" } }` on a `hash` entry holds when `"<pcId>|<account.npc>"` is in `harvestedAccounts`; add
  it to `CredentialModel::PROOF_KINDS` and `credential_proof_holds?`. When such an entry exists the
  collect yields the hash and no password row. Your cracked password goes through
  `account_password_rows` with `source: "cracked"`, listed after capture and harvest; keep your own
  marker key for it.
- **To OPS_MFA_HELPDESK (S8).** Agreed order: account-kind check inside step 6, then your second
  step, then the session. Account kind does not change the second step: every enrolled account
  meets the PC policy's `mfa`, `creds.mfa: false` is the only exception, and a local account is not
  exempt. Lockouts and the failure counter are unchanged by this plan.
- **To OPS_LOG_ROWS (S9).** The four rows in section 13. `signin.refused` with result
  `not_permitted` may already be yours; if so, add `detail` only.

## 15. Open questions for the user

1. **Does signing in with an administrator's password give an admin session?** Options: (a) yes,
   for a typed or keyring sign-in with an account marked `creds.admin`; claims and relays never;
   (b) no, only a technique step up gives admin, and a collected administrator password is just a
   sign-in. **Recommend (a)**, which this plan is written under: without it collecting a shared or
   domain administrator gains nothing, and S5a could not be proved before S3. Under (b), `creds.admin`
   goes, S5a waits for S3, and S5c teaches only reach, not privilege.
2. **How does the server learn which accounts are cached on a PC?** (a) static: owner plus a
   declared list, cached from the start; cheapest and fully server-held, but nothing to wait for or
   cause. (b) derived from the NPC's routine; the server cannot see routines, so it would need a
   server-side routine simulation, a large build. (c) reported by the browser with a sanity check;
   live and cheap, but a forged report could cache any account, and the collect then hands over a
   real password, which the cheat-resistance policy forbids. (d) the scenario declares candidates and
   the server caches one only on an event it already validates (the borrow "done"); a forged event
   can at most bring forward an account the author already made collectable, and the collect still
   needs admin. **Recommend (d)**, which this plan is written under; it costs one key (`cachedAt`).
   Under (a), `after` and `cachedAt` go. A later step could add a small own-PC-use report checked
   like borrow reports, widening (d) to routine use.
3. **Default for a cached account: password or hash?** This plan yields the password unless a hash
   record with a `harvested` proof is authored. **Recommend keeping that default** so S5b works
   without S7; missions that teach cracking author the hash.
4. **Default account kind.** **Recommend unscoped when absent**, so every scenario is unchanged.
5. **Does a collect or an admin action cost game minutes or risk detection?** No server clock is
   assumed. **Recommend no cost now**; detection belongs to the defence work.
6. **Domain-wide lockout.** Left out: the lockout key is read in six places (sign-in, keyring
   sign-in, the client's lockout marks, NPC frustration, feed posts, the failure counter), and a
   domain scope would need one key helper for all of them, a rule for which PC's `maxAttempts`
   counts, and the NPC side updated. Options: (a) leave per-PC lockouts (this plan); (b) a later
   slice that builds that helper (backlog `docs/IDEAS_BACKLOG.md:197`). **Recommend (a) now, (b)
   when a mission needs it.**
7. **Locked admin session and a physical plant.** This plan: a locked session takes an implant the
   policy allows but never overrides the policy. **Recommend keeping that**; the alternative lets a
   locked screen grant a privilege.
