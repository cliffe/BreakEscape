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
(S5b), and, when the admin session is held at that PC's own keyboard and is not locked, install a
device the PC's USB policy would refuse. Under S5a alone the accounts "that use the PC" are its
owner, so an unowned PC has no other profiles to open until S5b declares cached accounts. The player gets admin in two ways:
by signing in with an administrator account (one the scenario marks `creds.admin`), or by a step up
on a user session through a local weakness, which the core plan (S3) defines. Teaches: least
privilege, that an ordinary account is a start and not an end, and that local privilege escalation
is a step of its own.

**S5b: cached credentials (A19).** A PC remembers the accounts that have signed in on it. With
admin on that PC, the player collects those accounts into the keyring (A15) and reuses them
elsewhere. An account can be cached from the start, or only once the server has seen that person
sign in at that PC (a borrowed session handed back). Borrowing happens only at a PC with no owner
(a hot desk, a shared terminal), so on those PCs watching who uses the desk, or making someone use
it, pays off; an owned PC's cached accounts are all there from the start. A cached account yields its password, or a hash record for the cracking
minigame (S7) when the scenario authors one. Teaches: credential caching, reuse and lateral
movement, and why admin on one machine is worth having.

**S5c: local and domain accounts (A20).** Some accounts exist only on named machines (local);
others work on every machine that belongs to the organisation's domain. The weak setup gives a set
of machines one shared local administrator account, so collecting it on one machine opens them all
with admin. The hardened setup gives each machine its own local administrator, so what is collected
on one machine opens only that machine. Usernames are unique across a scenario (`GM:3486` finds the
account from the username alone), so the hardened setup has a different username per PC
(`lab1-admin`, `lab2-admin`), where the real mitigation keeps one name and varies the password; the
lesson survives because what differs is still the secret the player collected. Collecting a domain administrator's cached account opens
every domain machine as admin. Teaches: local against central identity, password reuse at scale,
and unique local administrator passwords as the mitigation.

Left out of this plan: a domain-wide lockout. Lockouts stay per PC and per username for every
account kind (section 15, question 4 says why and what it would take).

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

**The USB policy is read in four player-side places.** Server: the implant path
(`network_access.rb:507-513`, `AccessWork.plant_refused?`, `lib/break_escape/access_work.rb:1198`)
and the plant proof (`app/models/break_escape/capture_proofs.rb:50-52`, a plant the policy refuses
is never recorded). Client: `plantRefusal` (`public/break_escape/js/systems/pc-policy.js:67-79`),
called from `interactions.js:1056`, so a refused item never leaves the tray. The NPC side reads the
same table (`access_work.rb:1265`, `npc-needs.js:321`) for NPCs' own sticks; a player's privilege
does not touch it. The implant path takes only a keyboard session: it refuses a foothold, relay or
`from` session (`network_access.rb:494-500`, through `remote_route_session?`) and, by ruling,
accepts a locked one (`:501`). The plant proof has no session condition at all: it records any plant
the policy accepts (`capture_proofs.rb:46-53`). The client's session mirror keeps a session locked
during play, with `locked: true` beside whatever else it already held (`pc-sessions.js:198-200`).

**The server sees one kind of NPC sign-in.** It records an NPC at a PC through a player sign-in or
claim, and through a borrowed session handed back. A `borrow_session` workaround is performable only
on a PC with no owner (`performable?`, `app/models/break_escape/npc_frustration.rb:353-355`:
`login_pc_owner(pc).nil?`); a hand-over for one that is not performable is refused (`:161-162`).
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
(`lib/break_escape/credential_model.rb:196-200`) serves `pcs_accepting` (`:173-191`), the list of
PCs a keyring entry opens, and the validator (`scripts/validate_scenario.rb:7583`). Both apply the
same rule today: no PC `access` list admits every account, else `AccessIdentities.acl_admits?`.

**Sign-in tiles list every admitted account.** `login_account_tiles(pc)` (`GM:3868-3883`) builds
`{ username, displayName, portrait, avatar }` for every account NPC that `pc_admits_account?`
admits on that PC (or only met ones when `loginPicker` is `"known"`, none when it is `false`; absent
means `"accounts"`), and `attach_login_accounts!` (`GM:4465-4478`) puts the list on every sign-in
PC in every room answer. So which accounts a PC admits is visible to the browser today.

## 3. Build stages in order

Each stage ships and tests alone. Size L overall, three M parts (outline S5). Order: S5a, then S5b
(it needs admin), then S5c (it needs S5b's collect for its lesson, though its sign-in check could
land alone).

**S5a: privilege levels (M).** One level helper, `session_access(pc_id)`, which answers `"admin"`,
`"user"` or nil (no live session) for every kind of session, read through the same validity checks
as every other reader. One opt-in account marker, `creds.admin: true`, so that signing in with an
administrator account gives admin (section 15, question 1). Two admin gates: the profiles of the
accounts that use the PC, and installing a device the USB policy refuses, at all four places the
policy is read (the override only for an unlocked admin session at the PC's own keyboard). The
answers to the client carry `access: "admin"` when the level is admin. The core plan's step up (a
weakness with `needs.session` and `grants.session.access`) reads the level through this helper.
S5a does not need S3: the feature scenario's administrator account gives a real admin session at
the keyboard, so every gate is proved through the real sign-in route. Whichever of S5a and S3 lands
first adds the `access:` keyword to `login_session_answer` and the client-answer rule (section 5);
the other finds it there. When S3 lands, the same tests run again on a technique session. The
first commit of S5a is the unchanged-scenario test and its golden files (section 10), recorded
before any engine change.

**S5b: cached credentials (M).** A declared list of cache candidates on each sign-in PC
(`cachedAccounts`), withheld from the browser. A candidate is cached from the start, or once the
server accepts that NPC's borrowed-session "done" at that PC; the server records the second kind in
a new key, `cachedAt`. A collect route that, with an admin session on the PC, records each cached
account in `harvestedAccounts`. A new keyring row source built from `harvestedAccounts`, sharing one
password row builder with captures and with cracking (S7). Where the scenario authors a `hash`
record with a `harvested` proof for that PC and account, the collect yields the hash instead of the
password. Admin profile reads (S5a) widen to the accounts cached on the PC once S5b lands.

**S5c: local and domain accounts (M).** `creds.accountKind` (`local` or `domain`), `creds.localTo`
(the PCs a local account exists on), `creds.domain`, and `domain` on a sign-in PC. One sign-in
check, `AccessIdentities.account_kind_admits?`, called from both definitions of
`pc_admits_account?` (the game's and `CredentialModel`'s), so the typed sign-in, the keyring
sign-in, the claims, the keyring's "opens" list, the sign-in tiles and the validator all apply it.
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
when the list names it (section 15, question 7). `after: "borrow"` is allowed only on a PC with no
`owner`, because the engine performs a borrow only there (section 2); on an owned PC it is a
validator error.

```json
"rooms": { "office": { "objects": [
  { "type": "pc", "id": "hotDesk", "name": "Hot desk", "locked": true, "lockType": "login",
    "cachedAccounts": [ { "npc": "priyaN" }, { "npc": "samO", "after": "borrow" } ] },
  { "type": "pc", "id": "alexPc", "name": "Alex's PC", "locked": true, "lockType": "login",
    "owner": "alexT",
    "cachedAccounts": [ { "npc": "alexT" }, { "npc": "kemiA" } ] }
] } }
```

The hot desk has no owner: `priyaN` is cached from the start and `samO` only after a borrow, so
`samO` must carry a `borrow_session` workaround whose `pc` resolves (through `find_login_pc`, as the
engine resolves it) to `hotDesk`. Alex's PC shows the owned case: its owner and an administrator who
once signed in there are cached from the start. A cached account yields its password by default.
The registry decides otherwise, not this field: when a `hash` credential with `proof: {
"harvested": { "pc": "hotDesk" } }` exists for that account (S7's shape), the collect yields that
hash record instead (the cross-plan contract, section 14).

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
leaves an account unscoped, as today; absent `domain` on a PC puts it in no domain. The minimal room
and NPC fields (position, sprite) are left out of the examples for length; an `accountOnly` NPC needs
none of them, and the validator exempts it from the person checks that require them (section 9).

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
`saved_connection` session of an administrator account is admin too (section 15, question 1).

`account_admin_at?(npc, pc)` is `creds.admin == true` and `pc_admits_account?(pc, npc)` (which,
after S5c, includes the account-kind rule). `session_admin?(pc_id)` is `session_access(pc_id) ==
"admin"`. The level is read, never stored, for every session except a technique one, whose `access`
the core plan writes. So nothing writes or sends a default level, and a rebuilt record gets the level
of the account it now holds: the same account typing its password to unlock comes back at the same
level; Switch user, a guest claim or a borrow's displacement drops to whatever the new holder has;
a technique session cannot lock (`session_lockable?` is false for it), so it cannot lose its level
that way. The core plan's `needs.session: "user"` is met when `session_access` is not nil (user or
admin); `needs.session: "admin"` when it is `"admin"`. So a relay session or an owner or guest
claim can feed a step up to admin: a local weakness needs a foothold on the machine, and a shared
screen or a claimed desktop is one. The step-up's new account is whatever `grants.session.account`
names; this plan adds no condition on it.

`keyboard_admin?(pc_id)` is `session_admin?(pc_id)` and the record has a blank `foothold` and is not
a remote-route session (`remote_route_session?`, `network_access.rb:501`, which covers relay and
`from`). It is the one predicate for the USB override. A technique record always keeps its
`foothold` (OPS_CORE 5.4), so a technique session is never keyboard admin; a locked session has no
level, so it is not either.

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

**S5a: the USB override.** `AccessWork.plant_refused?(data, obj, item, admin: false)` returns false
when `admin` is true; every other caller is unchanged, so the NPC-side readers
(`access_work.rb:1265`) keep the policy. The two player-side server sites pass the same predicate:
- the implant path (`network_access.rb:509`): `admin: keyboard_admin?(pc_id)`;
- the plant proof (`capture_proofs.rb:52`): `admin: keyboard_admin?(found[:object]['id'])` when the
  target is a sign-in PC, else false.
So the override needs an unlocked admin session held at that PC's own keyboard: an administrator
account signed in there by typed password or keyring sign-in (both give `via: "password"` or a
non-connecting credential with a blank `foothold`). Every connecting credential kind is routed
(`credential_model.rb:23-25`), so none of them, and no technique, relay or `from` session,
overrides the policy. A locked session still takes an implant the policy allows (the existing
ruling) but has no level, so a locked admin session does not override. Whether a remote admin
session should override is section 15, question 6.

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
Under a technique session the player may not know that account's password, so collecting it is
useful. Nothing is trimmed: a keyring proof reads the list. Both keys are bounded at run time by the
scenario's declared pairs, because the server writes only pairs the two readers above accept; the
validator's caps (section 9) are an authoring limit on top.

**S5b: keyring rows.** One helper beside `implicit_keyring_entries`, `account_password_rows`,
answers how each account's password was earned, and lists each row id once, so `<npcId>.password`
appears once per account with one `source`, in the order `capture`, `harvest`, `cracked` (S7 adds
its source to the same helper). The MFA plan's `<npcId>.reset` is a different id and lists beside
it. The row is built by one builder, `account_password_row(npc, source:, label:)`, extracted from
the current implicit builder, with the password text from `capture_secrets_for_client` for a capture
and from `creds.password` for a harvest. A harvest row goes stale after a password reset (S8b),
exactly like a capture or a post-it: it keeps the scenario's password, and the player earns the new
one only through the reset row. A collect after a reset does not tell the two apart.
A harvest row is built for an account with a pair in `harvestedAccounts` unless a `hash` credential
with a `harvested` proof for that PC and account exists; then no password row comes from that pair,
and the registry lists the hash record because its proof now holds (S7 owns that proof kind). The
row's label is `Cached on <PC name>`, `how: "harvested"`.

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
| `pcs_accepting` (`credential_model.rb:173-191`) | the keyring's "opens" list and the validator no longer offer a PC the server would refuse |

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

**S5c: accounts with no person.** One predicate, `AccessIdentities.account_only?(npc)`, read at four
places: `filtered_room_data` drops such NPCs, so they never walk, talk, ring or show in a phone
list; `hasPresentNpc` in the bootstrap (`GM:2444-2448`) does not count them, so a room holding only
an `accountOnly` NPC is not lit as occupied; `hasNPCs` in the room layout
(`app/controllers/break_escape/games_controller.rb:527`) does not count them; and the validator
exempts them from the person checks (section 9). The server still finds them for sign-in
(`account_for_username`, `scenario_room_npc`). Their session answer carries `displayName` and no
portrait, so the desktop shows its generic account picture. The client already copes with a session
whose NPC it has never loaded: the mirror keeps the answer's fields (`pc-sessions.js:186-209`), the
taskbar handles an NPC whose room is not loaded (`utils/pc-taskbar.js:160-176`), `npcName` falls
back to the id (`pc-sessions.js:143-147`), and event listeners use `pcId`. A JS test keeps it so.

**S5c: sign-in tiles.** `login_account_tiles(pc)` skips an `accountOnly` account: it never gets a
tile on any PC, so the player types its username, which they learn by collecting it or from a find.
An administrator account with a person behind it (`creds.admin` without `accountOnly`) keeps its
tile where it may sign in, like any account (section 15, question 5 asks whether it should). An
ordinary `local` or `domain` account also keeps its tiles, and because the tile list already
follows `pc_admits_account?`, a player who compares PCs can see where such an account may sign in.
That is the same exposure as an `access` list today and is accepted: the lesson is about the
password collected, and a hardened PC still shows only its own accounts. The tile list holds
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
  account with its headshot (the account's portrait, or the generic picture for an `accountOnly`
  one), its display name and "password" or "hash", and points to the keyring. A collect that adds
  nothing says so. The panel is the feedback, because the keyring's find toasts and Sign-ins list
  are not guaranteed to show a new row (`keyring.js:774-784`).

`plantRefusal(heldItems, objectData, scenario, { admin })` (`pc-policy.js:67`) lets every item
through when `admin` is true. `interactions.js:1056` passes `admin: keyboardAdmin(pcId)`, one
function in `pc-sessions.js` that mirrors the server predicate: the mirror entry has `access ===
"admin"` and is not `locked`, not `remote` and not `relay`. It is never wider than the server's
`keyboard_admin?`, so an honest client lets an item through only when the server will record the
plant. If the two still disagree (a tampered client, or an answer lost in flight), the server's
answer wins: the plant proof records nothing (`capture_proofs.rb:52` answers false without a
message) and nothing that reads the proof happens. The item has then left the tray with no plant
recorded, the same outcome a client that skips `plantRefusal` meets today; the plan adds no message
for it, because an honest client cannot reach it. No client code decides privilege. The client learns about account kinds
only through the existing `notPermitted` refusal and through which tiles a PC shows (above).

## 6. Server routes

Only S5b adds a route. S5a's gates ride existing routes (`GET /container` for profiles, the implant
action and the plant proof for USB); S5c's check rides `POST /login` and the keyring sign-in.

**`POST /harvest_credentials`** (new; `config/routes.rb` beside the keyring routes, action beside
`keyring` in `app/controllers/break_escape/games_controller.rb`). Params: `pc_id` (string, at most
64 characters). Runs under the game lock, as the other writing routes do.

Checks in order:
1. `pc_id` missing, not a string or too long → 400 `Missing pc_id`;
2. not a sign-in PC in a room (`find_login_pc`) → 404 `Sign-in PC not found`;
3. no session record at the PC (`access_sessions[pc_id]`, the raw record) → 422
   `{ error: "Sign in required" }`;
4. the session is locked (`session_locked?(pc_id)`) → 422 `{ error: "Sign in required", locked:
   true }`;
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

The collect takes no route param, where the core plan's technique requests name the session's own
foothold on a `remote: "blocked"` host (OPS_CORE 5.4). It needs none: the collect acts on the
session already held at `pc_id`, and step 5's `session_route_up?` judges that record's own foothold,
so a technique session whose route is gone is refused there. Nothing here chooses a route.

`POST /login` gains no param; its step-6 refusal also covers an account-kind mismatch. The implant
action gains no param; it reads `keyboard_admin?` for the session it already checks.

## 7. What reaches the browser, and what never does

**Reaches the browser.**
- `access: "admin"` on an admin session's entry (sign-in answer, session mirror entries in the
  bootstrap and room answers, network host row); absent for every other session.
- The collect answer: account ids, display names and `password` or `hash`, for accounts the player
  has collected. No secret.
- A collected account's password, in its `<npcId>.password` keyring row, from the first
  `GET /keyring` after the collect. The player has earned it, as with a capture. A hash record's
  token reaches it as S7 defines.
- `domain` on a sign-in PC object. It is not secret: a real sign-in screen names its domain, and
  the desktop may show it. It tells a curious player which PCs a domain account may use, which the
  player could learn by trying.
- Sign-in tiles (`login_account_tiles`, unchanged shape): for an ordinary account, including a
  scoped `local` or `domain` one and an administrator with a person behind it, a tile on each PC
  where it may sign in. So the set of PCs showing a tile reveals where that account is admitted,
  as an `access` list does today (section 5).
- The username and display name of an `accountOnly` account, only in a session answer, a collect
  answer or a keyring row. It never has a tile.

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
the server already validates; the collect, the keyring rows and the account-kind decision are
server-side.

## 8. State and saved games

**S5a adds no key.** The level is computed on each read from the session record and the scenario;
only a technique session's record stores `access`, written by the core plan. Every client answer
about a session gains `access: "admin"` when `session_access` is admin, for any session kind, and
omits it otherwise; `login_session_answer` (`GM:4433`), `session_for_client` (`GM:3778-3792`) and
the network host row pass fields one by one, so `access` is a new parameter there, filled from
`session_access(pc_id)` and never from the record. A step up is answered by the core plan's
technique route with the one changed session. A reload rebuilds the level from the stored record,
so an admin session stays admin and a user session stays user. A locked admin session is sent
without `access` and gets it back in the unlock answer. An existing scenario's answers are
unchanged, because nothing in one can be admin: no account has `creds.admin` and no scenario has a
technique grant.

**S5b adds two server-only keys** to `ACCESS_STATE_DEFAULTS`, each with a flat empty default:
- `cachedAt`: grow-only array of `"<pcId>|<npcId>"`, written only by `record_borrow_done!` for a
  declared `after: "borrow"` candidate. It exists because `guestSessions` is wiped on reload.
- `harvestedAccounts`: grow-only array of `"<pcId>|<npcId>"`, written only by the collect.

Neither is trimmed, because a keyring row and a hash proof read `harvestedAccounts`, and losing a
`cachedAt` entry would un-cache an account. Both are bounded at run time by the scenario's declared
pairs, since the server writes only a pair `cached_accounts_at` or the borrow step accepts, and the
writers add a pair only when it is absent. On top, the validator caps `cachedAccounts` at 8 per PC
and the declared pairs at 64 per scenario, so in a valid scenario each list holds at most 64 strings
of under 140 bytes, about 9 KB at worst. A scenario that reaches a game without passing the
validator is still bounded by its own declared lists. Neither is read from a sync body or sent. What the player sees is the keyring row, which
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
- `cachedAccounts`: each `npc` is an account holder; no duplicates; the PC is a sign-in PC; the
  owner may be listed (that is how it becomes collectable). An `after: "borrow"` candidate on a PC
  with an `owner`, error (the engine never performs that borrow). An `after: "borrow"` candidate
  needs a `borrow_session` workaround whose `pc` resolves through `find_login_pc`'s rule to this
  PC's id, else error. At most 8 per PC and 64 declared pairs per scenario, else error.
- Info line for each owned PC an admin path reaches whose list does not name the owner: "owner not
  collectable here", so an author sees the choice.
- A cached account the PC cannot otherwise admit is allowed (info line: "collect-only on this PC").
- `local`: `localTo` present and every id a sign-in PC, else error; a `localTo` PC whose `access`
  list refuses the account, error (it could never sign in there). Info line for a `local` account
  with `creds.admin` and more than one `localTo` PC: "shared local administrator".
- `domain`: `creds.domain` present, and at least one sign-in PC with that `domain`, else error.
  Warn for a PC `domain` no account uses.
- An owner or a borrower whose account kind refuses its own PC, error.
- `accountOnly` on an NPC with no `creds.username`, error; with an ink story, phone or position,
  warn (they are never used). Every person check that requires a position or sprite skips an NPC
  for which `AccessIdentities.account_only?` is true.
- Every check here that asks whether a PC admits an account uses `CredentialModel.pc_admits_account?`
  (`validate_scenario.rb:7583`), which carries the account-kind rule.
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
  from the `access` list as today, in both definitions. No NPC has `accountOnly`, so tiles,
  `hasPresentNpc` and `hasNPCs` are unchanged.

**Proof.** `test/integration/ops_privilege_unchanged_test.rb` replays fixed request sequences on
`test_access_signin`, `test_access_sessions`, `test_access_keyring` and `test_access_social` (sign-in,
lock, unlock, keyring sign-in, borrow "done", implant, `GET /container`, `GET /keyring`) and compares
the server state and every answer body with golden files under `test/fixtures/ops_privilege_golden/`.
The test and its golden files do not exist on `main`: they are the first commit of S5a, recorded
with `RECORD_GOLDEN=1` before any engine change, and no later stage re-records them. Three rules
keep the comparison honest:
- `ACCESS_STATE_DEFAULTS` is filled into every game's `player_state` (`GM:7576`), so the new empty
  keys appear in the server state. The comparison removes `cachedAt` and `harvestedAccounts` and
  asserts them separately as empty. One shared golden helper strips the empty new keys of every ops
  plan (section 14).
- Server times (`guestSessionsAt`, the hand-over `time`, `npc_frustration.rb:545`) and token clocks
  vary per run, so the test freezes the clock.
- Tile lists are part of every room answer, so they are compared too.

A validator snapshot over every shipped scenario shows no new error, warning or info line.

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
- `admin_usb_test.rb`: implant and plant proof both allowed under keyboard admin and refused under
  user; at both sites, refused under a locked admin session, a remote admin password session
  (through a foothold, and `from` another desktop), a relay session, and a technique admin session;
  NPC-side `usb_habit_refused?` unchanged under player admin.
- `cached_accounts_test.rb`: listed start candidates cached, an unlisted owner not; an `after:
  "borrow"` candidate cached only after an accepted "done" at that PC, not after a "done" at another
  PC, a dwell-refused early "done" or a resent one; a `cut: true` "done" does cache (accepted
  behaviour, kept so nobody removes it); a borrower locked out at the PC caches nothing; a careful
  guest caches; a second borrow by the same NPC adds no second pair; `cachedAt` survives a reload
  while `guestSessions` does not; a `cachedAt` pair for an undeclared candidate is ignored.
- `pc_admits_account_test.rb`: the two definitions answer alike over every PC and account of the
  shipped scenarios (before the delegation) and over every cell of the truth table (after S5c);
  the keyring's "opens" list never names a PC the server refuses.
- `session_access_test.rb` also: a relay session and a guest claim each feed a core step up to admin
  (once S3 lands); a `token` session of an administrator account is admin.
- `harvest_test.rb`: collect adds pairs once; a second collect adds nothing and writes no row; a
  later borrow then a second collect adds the new account; a password row appears in `GET /keyring`
  with `source: "harvest"`; an account both captured and collected is listed once as `capture`; a
  pair with an authored `harvested` hash proof yields no password row (once S7 lands).
- `account_kind_test.rb`: every cell of the truth table on both the typed and keyring paths, each
  refusal uncounted; the shared local administrator collected on `pc01` signs in as admin on `pc02`;
  `lab1Admin` is refused on `pc01`; the domain administrator signs in as admin on every domain PC and
  is refused on a PC without the domain.
- `account_only_test.rb`: an `accountOnly` NPC is absent from every room answer, has no tile on
  any PC, does not make its room report a present NPC (`hasPresentNpc`, `hasNPCs`), and signs in
  by typed username.
- `login_tiles_test.rb`: a `local` account has tiles only on its `localTo` PCs, a `domain` account
  only on its domain's PCs; an `accountOnly` account none; an existing scenario's tiles unchanged.
- `harvest_test.rb` also: a collected administrator password still meets the PC policy's second
  step (S8, OPS_MFA request 6); a harvest row keeps `creds.password` after a reset (S8b).

**Controller** (`test/controllers/harvest_credentials_test.rb`): each refusal of section 6 in order,
each asserting nothing was written; the success answer with `keyringRev`, no password and
`Cache-Control: no-store`; the repeat answer; hostile `pc_id` values (non-string, 10 KB, another
game's PC id).

**No exposure**: the list in section 7 at each step of a full run of `test_ops_privilege`, added to
`test/controllers/break_escape/network_no_exposure_test.rb`, the file on `main`, or to the core
plan's `network_ops_no_exposure_test.rb` if that has landed first.

**JS unit** (`test/js/`): `pc-sessions` keeps `access` through `publicSession` and the bootstrap
adopt, and drops it when the mirror locks a session; `keyboardAdmin` is false for a locked mirror
entry that still held `access`, and for remote and relay entries; the desktop shows the marker and
the collect control only for admin; the collect calls `keyring.refresh()`; `plantRefusal` with
`admin`; a session with an `npcId` the client never loaded renders; hostile display names rendered
as text. A new module is added to every copy list that copies the module importing it (grep
`test/js` for the importer's name before finishing).

**Feature scenario** `test_ops_privilege`, grown per stage (the schema is closed, so each stage
adds only its own fields):
- S5a: an ordinary user and an administrator account (`creds.admin`); an owned PC with the owner's
  profile; one PC with `usb: "blocked"`; one profile per account.
- S5b adds: an unowned hot desk with one start candidate and one `after: "borrow"` candidate whose
  `borrow_session` workaround names it; the owned PC listing its owner as a candidate.
- S5c adds: three PCs sharing the `accountOnly` `deskAdmin`; `lab1` with its own `accountOnly`
  administrator; a domain with its administrator and two domain PCs.
Each stage ships `mission.json`, a regenerated graph and `PLAYTEST.md`.

**Scripted playtest** through `window.__test`, per stage:
- S5a: sign in as the user, see no other profile and no collect; sign in as the administrator, see
  the owner's profile; plant a refused stick at the keyboard under admin; lock the screen and see
  the same stick refused.
- S5b: collect on the owned PC and on the hot desk; make the borrow candidate's need fail until
  its frustration reaches the workaround's `at` level (the counted fails after which `choose_run!`
  hands a workaround over, `npc_frustration.rb:526-547`), using the same steps as the borrow in
  `test_access_social`'s playtest; wait for the "done", collect again and get the new account.
- S5c: use `deskAdmin`'s collected password on `pc02` as admin, typed (no tile); fail on `lab1` with
  it; sign in as the domain administrator on both domain PCs.
Assert both sides: `access` and keyring rows in the browser, and `sessions`, `cachedAt`,
`harvestedAccounts` on the server.

**Live browser proof** on the real path (sign-in screen, collect control, keyring panel, a second PC)
in a headless browser, per the fix-claims-need-live-proof rule.

## 12. Build steps and shared files

Order: S5a, S5b, S5c. Each step commits its own files before its tests run.

Files this plan changes:
- `app/models/break_escape/game.rb`: `session_access`, `session_admin?`, `account_admin_at?`,
  `admin_profiles_at`, `pc_present_accounts`; the admin branches in `login_desktop_contents`,
  `find_login_item`, `session_admits?`, `scope_admitted_by_session?`; `access` parameter in
  `login_session_answer` and `session_for_client`; `cached_accounts_at`,
  `harvest_cached_credentials!`; `keyboard_admin?`; two `ACCESS_STATE_DEFAULTS` keys;
  `pc_admits_account?` delegating to `CredentialModel`; `login_account_tiles` skipping
  `accountOnly`; `filtered_room_data` and `hasPresentNpc` (`GM:2444-2448`) reading
  `account_only?`.
- `lib/break_escape/credential_model.rb`: `pc_admits_account?` calling `account_kind_admits?`.
- `lib/break_escape/access_work.rb`: `admin:` keyword on `plant_refused?`.
- `app/models/break_escape/network_access.rb`: implant call site; `cachedAccounts` in
  `WITHHELD_OBJECT_FIELDS`.
- `app/models/break_escape/capture_proofs.rb`: plant proof call site.
- `app/models/break_escape/npc_frustration.rb`: `record_borrow_done!` writes `cachedAt`.
- `app/models/break_escape/credential_keyring.rb`: `account_password_rows`, `account_password_row`,
  the harvest source.
- `lib/break_escape/access_identities.rb`: `account_kind_admits?`, `account_only?`; `reach` for
  collected accounts.
- `app/controllers/break_escape/games_controller.rb`, `config/routes.rb`: the collect route;
  `hasNPCs` (`games_controller.rb:527`) reading `account_only?`.
- The network host row's serialiser (the core plan's), for the `access` rule.
- `scripts/scenario-schema.json`, `scripts/validate_scenario.rb`, `scripts/generate_dungeon_graph.rb`.
- Client: `pc-sessions.js`, `pc-policy.js`, `interactions.js`, the desktop view, `keyring.js` call.
- `docs/ACCESS_AND_NETWORKS.md` and the `README_scenario_design.md` feature index (A18 to A20).

**Shared with other ops plans** (agree edit order):
- `start_login_session!`: the core plan adds the stored `access:` and `technique:` for a technique
  record; this plan reads `access` only through `session_access`.
- `login_session_answer`, `session_for_client` and the host row: the `access` rule of section 5.
  Whichever of S5a and S3 lands first adds the answer parameter; the other finds it there.
- `attempt_login!` and `attempt_credential_login!`: S8 adds the second step after step 6; this plan
  changes only `pc_admits_account?`.
- `credential_model.rb`: S7 and S8 may read `pcs_accepting`; this plan changes only its admission.
- The unchanged-scenario golden helper (section 10), shared by every ops plan's unchanged test.
- `credential_keyring.rb` row helper: S7 adds `source: "cracked"` and the `harvested` proof kind.
- `ACCESS_STATE_DEFAULTS`, `AccessIdentities.reach`, the dungeon graph and the validator.

## 13. Log rows this feature writes

Storage and reading are S9's. Rows go through S9's one helper; until it lands the call is a no-op.
A step up is the core plan's technique row and is not listed here.

| event | who | where | when | result | detail |
|---|---|---|---|---|---|
| event | who | where | when | result | detail |
|---|---|---|---|---|---|
| `admin_profile_read` | the session's account | the PC | the first `GET /container` of a profile opened only by admin, per PC and profile | `ok` | profile id |
| `usb_override` | the session's account | the PC | an implant or a plant proof the policy would refuse, accepted under keyboard admin | `ok` | the device's `usbClass` |
| `credentials_collected` | the session's account | the PC | a collect that adds at least one pair | `ok` | the number added, and per account its npc id and `password` or `hash` |

Saving, row by row (the log helper never saves by itself):
- `admin_profile_read`: `GET /container` does not save, so this row costs one extra `save!`. It is
  written only when the log does not already hold the same event, PC and profile, so reopening a
  folder adds neither a row nor a save; at most one save per admin-only profile per PC per game.
- `usb_override`: written inside the implant action and the plant proof, which already save when
  they record the device or the plant. No extra save.
- `credentials_collected`: written inside the collect route's `save!`, which runs only when a pair
  was added. No extra save; a repeat collect writes no row.

No `detail` can hold a secret: a profile id, a `usbClass` from the scenario, a count, npc ids and
the words `password` or `hash`. Never a username typed by the player, a password, a hash token or a
code. An account-kind refusal is an ordinary refused sign-in (422 `notPermitted`) and is the log
rows plan's `signin_refused` row; this plan writes no row of its own for it.

## 14. Cross-plan requests

- **To OPS_CORE (S3).** Agreed: the step up is your weakness shape; this plan adds no other route to
  admin except signing in with an administrator account. Your `needs.session` check calls
  `session_access(pc_id)`: `"user"` is met by any live session (relay and claims included),
  `"admin"` by an admin one. You store `access` on technique records only; nothing else stores it.
  Please change your answer rule to this one: the sign-in answer, `session_for_client` and the host
  row carry `access: "admin"` when `session_access` is admin, for any session kind, and omit the key
  otherwise; the record's stored value is never passed through, so a technique user session sends no
  key. "No other session carries `access`" becomes "no session of a scenario without `creds.admin` or
  a technique grant carries `access`". Whichever of S5a and S3 lands first adds the answer
  parameter. A password sign-in that replaces your technique record takes the level of the account
  signed in with. Please run `CredentialModel.pc_admits_account?` (which carries the account-kind
  rule) on `grants.session.account` in your validator pass, and confirm that a technique record
  always keeps its `foothold`, which `keyboard_admin?` relies on.
- **To OPS_CRACKING (S7).** Your draft asks for an admin-dump marker "per host, per account" with a
  proof such as `{ dumped: { host, npc } }`. This plan's side of the contract, exactly:
  - the dump is the collect route of section 6, on a sign-in PC, not a host: the marker is keyed by
    the sign-in PC's object id;
  - the marker is `player_state.harvestedAccounts`, an array of `"<pcId>|<npcId>"`, server-written
    only by the collect, grow-only, never trimmed, never sent;
  - the proof form is `proof: { "harvested": { "pc": "<pcId>" } }` on a `hash` registry entry whose
    `account.npc` names the account; it holds when `"<pcId>|<account.npc>"` is in
    `harvestedAccounts`. You add `harvested` to `CredentialModel::PROOF_KINDS` and to
    `credential_proof_holds?`; the validator check of section 9 lands with it;
  - when such an entry exists, the collect answer says `as: "hash"` for that account and no
    password row comes from that pair; the registry lists the hash because its proof holds;
  - your cracked password goes through `account_password_rows` with `source: "cracked"`, listed
    after capture and harvest, sharing `account_password_row`; the marker for a crack is your own
    key, not `harvestedAccounts`.
  Please replace `dumped` with `harvested` and "host" with the sign-in PC id in your plan, or say
  why a host-level marker is needed.
- **To OPS_MFA_HELPDESK (S8).** Agreed order: account-kind check inside step 6, then your second
  step, then the session. The account-kind check lives in `pc_admits_account?`, which
  `credential_login_checks` already calls, so your second-step re-judge picks it up: please drop
  "adds any check" from request 4. Account kind does not change the second step: every enrolled
  account meets the PC policy's `mfa`, `creds.mfa: false` is the only exception, and a local account
  is not exempt. The session write stores no level: please change 5.2 step 6 and request 1 to "the
  level is computed by `session_access`; nothing is written". A harvest row keeps `creds.password`
  and goes stale after a reset, like your earlier sources; the new password comes only through your
  `<npcId>.reset` row. Lockouts and the failure counter are unchanged by this plan.
- **To OPS_LOG_ROWS (S9).** The three rows in section 13, snake_case. `admin_profile_read` needs a
  lookup "does the log already hold this event, PC and detail" (or a fold of repeats) so that a
  read route saves at most once per profile and PC. An account-kind refusal is your
  `signin_refused`; if you want to tell it apart, a `detail` of `account_kind` holds no secret.
- **To all ops plans.** One golden helper for the unchanged-scenario tests that strips each plan's
  new empty `ACCESS_STATE_DEFAULTS` keys and freezes the clock; and one test directory for unit
  tests (this plan uses `test/models/`).

## 15. Open questions for the user

**Defaults this plan settles** (not user choices):
- A cached account yields its password unless a `hash` record with a `harvested` proof is authored
  for that PC and account: S5b then works without S7, and the cracking plan's own shape decides the
  rest.
- An account with no `accountKind` is unscoped, as every account is today: any other default would
  change existing scenarios.
- A locked admin session takes an implant the policy allows but never overrides the policy: a
  locked screen has no level, and letting it override would grant a privilege to nobody signed in.

**Questions.**

1. **Does signing in with an administrator's password give an admin session?** Options: (a) yes,
   for a typed or keyring sign-in with an account marked `creds.admin`, including a `token` or
   `saved_connection` session of that account (a token skips the password, and the MFA second step
   is what stands in the way); claims and relays never, so an owner claim of an administrator's
   unlocked desktop is a user session, which a player may find odd; (b) no, only a technique step up
   gives admin, and a collected administrator password is just a sign-in. **Recommend (a)**, which
   this plan is written under: without it collecting a shared or domain administrator gains
   nothing, and S5a could not be proved before S3. Under (b), `creds.admin` goes, S5a waits for S3,
   and S5c teaches only reach, not privilege.
2. **How does the server learn which accounts are cached on a PC?** (a) static: a declared list,
   cached from the start; cheapest and fully server-held, but nothing to wait for or cause. (b)
   derived from the NPC's routine; the server cannot see routines, so it would need a server-side
   routine simulation, a large build. (c) reported by the browser with a sanity check; live and
   cheap, but a forged report could cache any account, and the collect then hands over a real
   password, which the cheat-resistance policy forbids. (d) the scenario declares candidates and the
   server caches one only on an event it already validates (the borrow "done"). What the server
   proves is a real hand-over of a declared workaround of a met NPC; the dwell is not part of the
   guarantee, since `cut: true` skips it. A forged or early "done" can at most bring forward an
   account the author already made collectable, and the collect still needs admin. The engine
   performs a borrow only on a PC with no owner, so (d) adds play only on hot desks and shared
   terminals; owned PCs get (a)'s static list. **Recommend (d)** all the same, which this plan is
   written under: shared desks are where caching by others happens, and it costs one key
   (`cachedAt`). If owned PCs matter, a later step could add a small own-PC-use report checked like
   borrow reports. Under (a), `after` and `cachedAt` go and S5b shrinks a little.
3. **Does a collect or an admin action cost game minutes or risk detection?** No server clock is
   assumed. **Recommend no cost now**; detection belongs to the defence work.
4. **Domain-wide lockout.** Left out: the lockout key is read in six places (sign-in, keyring
   sign-in, the client's lockout marks, NPC frustration, feed posts, the failure counter), and a
   domain scope would need one key helper for all of them, a rule for which PC's `maxAttempts`
   counts, and the NPC side updated. The MFA plan already adds the key helpers
   (`AccessIdentities.lockout_key`, `lockout_key_parts`, `Game#login_lockout_keys_for`), so the
   remaining cost is the `maxAttempts` rule and the NPC side. Options: (a) leave per-PC lockouts
   (this plan); (b) a later slice on top of those helpers (backlog `docs/IDEAS_BACKLOG.md:197`).
   **Recommend (a) now, (b) when a mission needs it.**
5. **Does an administrator account show as a sign-in tile?** An `accountOnly` account (no person
   behind it) never has a tile in this plan, so a shared local administrator is found by
   collecting, not by reading the sign-in screen. For an administrator with a person behind it:
   (a) a tile wherever it may sign in, like any account (this plan); (b) no tile, typed only, as a
   real sign-in screen rarely lists an admin account; (c) the author chooses per account. **Recommend
   (a)**: the person is in the office and talks to the player, so hiding the tile hides nothing, and
   `loginPicker: "known"` or `false` already lets an author narrow tiles per PC. (b) costs one
   condition in `login_account_tiles`; (c) a new field.
6. **Can a remote admin session override the USB policy for a physical plant?** This plan: no, the
   override needs an unlocked admin session at that PC's keyboard, at all four sites. Option (b):
   any admin session on the PC overrides, which matches a real admin changing device policy
   remotely; then `keyboard_admin?` becomes `session_admin?` at the four sites. **Recommend (a)**:
   the plant is physical, a remote admin session is often a technique session, and (b) would let a
   foothold quietly disarm every USB lesson in a scenario.
7. **Is a PC's owner always collectable, or must it be declared?** (a) the owner is always cached
   from the start: no field, but any scenario that adds one administrator account or one admin step
   up makes every reached owner's password collectable, a new route through an existing puzzle
   chain; (b) the owner is collectable only when `cachedAccounts` lists it (this plan), with a
   validator info line per reached owned PC that does not list it; (c) always, with a
   `cacheOwner: false` opt-out. **Recommend (b)**: nothing becomes collectable that the author did
   not write down, and it keeps one rule for every account.
