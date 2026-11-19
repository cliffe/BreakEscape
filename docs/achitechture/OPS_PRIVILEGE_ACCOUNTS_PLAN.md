# Ops layer plan: privilege, cached credentials, local and domain accounts

Stages S5a, S5b, S5c. Feature ids on landing: A18 (privilege levels), A19 (cached credentials),
A20 (local and domain accounts). Drafted for the ops layer (brief
`docs/agents/OPS_LAYER_BRIEF.md`, outline `docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md` S5).

## 1. What this adds and why, in play

Three stages that turn a foothold on a machine into a proper hold over an organisation's accounts.

**S5a — privilege on a session (A18).** When a technique card (S3) gives the player a session on a
host, that session is now either a *user* session or an *admin* session. A user session sees only
what its own account is allowed: its own desktop and profile, its own files. An admin session on a
machine can do three things a user session cannot: read every account's profile on that machine,
harvest the credentials the machine has cached for other accounts (S5b), and install a device the
machine's USB policy would otherwise refuse. Getting from a user session to an admin session is a
separate move the scenario places on a weakness or a technique card: a player who has signed in as
an ordinary user finds a local weakness, plays the matching card, and the session becomes admin.
Teaches: least privilege, that a normal account is a start and not an end, and that local privilege
escalation is its own step.

**S5b — cached credentials (A19).** A shared workstation keeps the accounts that use it. With admin
on that machine, the player can harvest those remembered accounts into the keyring (A15) and reuse
them elsewhere. Teaches: credential caching and reuse, lateral movement, and why admin on one box is
worth having.

**S5c — local and domain accounts (A20).** Some accounts are local to one machine; others are domain
accounts that work on every machine in the organisation. A convenient but weak setup gives every
machine the same local administrator password, so harvesting it once opens them all; a hardening
policy (`localAdmin: "unique"`) makes each machine's local administrator password different, so the
reuse fails. A domain account that is locked out is locked everywhere, not just at one machine.
Teaches: local versus central identity, password reuse at scale, and the unique-local-password
mitigation.

## 2. What the code does today

Verified against the code in the worktree.

**A session has an identity, not a privilege.** A session is written in one place,
`start_login_session!` (`app/models/break_escape/game.rb:4388-4418`), as `{ 'id' => <npc id>,
'via' => <'password'|'claim'|'credential'> }` plus route fields. There is no privilege field. What a
session may open is recomputed from the NPC id and the object's ACL: `session_identity`
(`game.rb:3243-3251`), `session_admits?` (`game.rb:3260-3307`), and `acl_admits?`
(`lib/break_escape/access_identities.rb:68-73`). `signedInPcs` (`game.rb:4404-4408`) is a grow-only
list of PC ids.

**Profiles are gated on the session's one identity.** `admitted_profiles(npc)`
(`game.rb:3318-3333`) returns only the account profiles whose `for` ACL admits that NPC;
`login_desktop_contents(pc, npc)` (`game.rb:3337-3344`) and `find_login_item`
(`game.rb:3348-3358`) build the desktop from the PC's own contents plus those admitted profiles. A
user signed in as one person therefore cannot see another person's profile on the same PC. This is
the hook S5a's "read other profiles" opens.

**The USB install hook is a single predicate.** A physical implant is refused when the PC's policy
rejects the device class: `BreakEscape::AccessWork.plant_refused?(scenario_data, object, entry)` in
`app/models/break_escape/network_access.rb` (around `:507`), which returns `usb_refused`. This is
the hook S5a's "install despite the USB policy" opens.

**The server does not see NPC presence.** The server records an NPC at a PC only through a player
sign-in or claim (`sessions[pcId].id`), guest records from finished borrows (`guestSessions`,
`npc_frustration.rb` `record_borrow_done!`), and owner claims. Whether an NPC uses its *own* PC on
its routine is known to the browser only (`owner_claim.rb:9-13` comment; D2 section 4). The server
does know, statically, who owns each sign-in PC (`login_pc_owner`, `game.rb:3375` area) and whether
that owner is tracked by needs. S5b builds on this static knowledge, not on live presence.

**Lockouts are per PC and per username.** The lockout key is `"<pcId>|<normalised username>"`
(`game.rb:3482-3483`, `:4333`), stored in `loginLockouts` (`game.rb:4360-4372`), checked before the
password is compared (`game.rb:3482-3486`). A lockout lasts the mission. There is no scope field;
D2 section 2.7. The backlog's per-lockout `scope` idea is `docs/IDEAS_BACKLOG.md:197`.

**Credentials already have one path into the keyring.** The registry (`credentials` map, server-only,
`credential_model.rb:91-101`), implicit `<npcId>.password` entries per captured account
(`credential_keyring.rb:263-285`), and the registry entry builders
(`registry_keyring_entries` `:312`). S5b's harvest reuses this path (shared contract, brief
section 5) rather than inventing a second one.

**Sign-in check order** (`attempt_login!`, `game.rb:3444-3525`, D2 section 2.3): find PC → route →
lockout check → account lookup → password match → `pc_admits_account?` (step 6, 422 `notPermitted`,
uncounted) → write session. S5c adds a sub-check at step 6; S8 (MFA) extends the same order.

Nothing today distinguishes a local account from a domain account; `pc_admits_account?`
(`game.rb:3352-3357`) and the `access` ACL alone decide where an account signs in.

## 3. Build stages in order

Each stage ships and tests alone. Size L overall, three M parts (outline S5).

**S5a — privilege levels (M).** Add `access: "user" | "admin"` to the session record; treat an absent
value as `user`. Gate the three admin-only capabilities on it: read every profile on the PC,
install despite the USB policy, and (the entry point for S5b) offer the harvest. Define how a
scenario marks the user-to-admin step: a technique card (S3) whose grant names `access: "admin"`,
and an escalation card that requires an existing user session on the host and raises it to admin.
Shippable with S3; until S3 lands, the access value is set and read but no card grants admin, so the
feature scenario seeds an admin session directly to prove the gates.

**S5b — cached credentials (M).** Add, per sign-in PC, the set of accounts whose credentials the PC
has cached (the owner by default, plus any the scenario declares). Add one route that, given an
admin session on that PC, harvests those accounts into the keyring through the existing credential
path. Record the harvest server-side so it is idempotent and bounded.

**S5c — local and domain accounts (M).** Add an account kind (`local` or `domain`) and a domain
marker on hosts/PCs. A local account signs in only on its home machine(s); a domain account signs in
on any machine in its domain. Add the shared-local-admin case (one local account reused across PCs)
and the `localAdmin: "unique"` policy that breaks it. Make a domain account's lockout domain-wide by
scoping its lockout key to the domain. The sign-in sub-check sits at step 6 of the order
(`pc_admits_account?`).

## 4. Scenario fields

Industry-neutral names (brief section 2.3). Every field is optional; a scenario that sets none
behaves exactly as today (section 10).

**S5a.** No new top-level field. S5a defines the meaning of `access` on the grant of a technique card
(the card and its `grants` block are owned by S3, OPS_CORE; cross-plan request in section 14):

```json
"techniques": {
  "localEscalation": {
    "matchesFinding": "weakAgentService",
    "requiresSession": { "host": "deskHost", "access": "user" },
    "grants": { "host": "deskHost", "access": "admin" }
  }
}
```

A card with `grants.access: "admin"` and no `requiresSession` grants an admin session outright; one
with `requiresSession.access: "user"` is the escalation step, raising an existing user session on
that host to admin.

**S5b.** On a sign-in PC, an optional list of accounts the machine has cached, by NPC id. The PC's
`owner` is always included implicitly, so most scenarios set nothing:

```json
"objects": [
  { "type": "login_pc", "id": "deskPc01", "owner": "alexT",
    "cachedAccounts": ["priyaN", "svcBackup"] }
]
```

**S5c.** Account kind on the account-holder NPC's `creds`, a domain marker on the host/PC, and the
hardening policy:

```json
"rooms": { "it": { "npcs": [
  { "id": "domainAdmin", "creds": { "username": "dadmin", "password": "…", "accountKind": "domain", "domain": "northwind" } },
  { "id": "localAdmin",  "creds": { "username": "ladmin", "password": "…", "accountKind": "local", "sharedLocalAdmin": true } }
] } },
"objects": [
  { "type": "login_pc", "id": "pc02", "domain": "northwind" }
],
"policies": { "hardened": { "localAdmin": "unique" } }
```

`accountKind` defaults to unscoped (today's ACL behaviour) when absent. `domain` on an account and
on a PC must match for a domain account to sign in there. `sharedLocalAdmin: true` marks the one
local account whose password is reused across PCs; `localAdmin: "unique"` on a PC's policy stops a
harvested shared-local-admin credential from signing in on any PC other than the one it was taken
from.

## 5. Engine behaviour: server then client

### Server

**S5a.** `start_login_session!` (`game.rb:4388`) writes `access` into the session record, taken from
the technique card's grant (default `user`). A new predicate `session_admin?(pc_id)` reads
`sessions[pc_id]['access'] == 'admin'`. Three call sites consult it:
- `login_desktop_contents` / `admitted_profiles` (`game.rb:3318-3344`): when the session is admin,
  return every account profile on the PC, not only those whose `for` admits the session's NPC. Put
  the branch in `login_desktop_contents` and `find_login_item` so item lookup and display stay in
  step; `session_admits?`'s `profile` branch (`game.rb:3298-3300`) also returns true under admin.
- the USB implant path (`network_access.rb` ~`:507`): when the acting session on the PC is admin,
  skip the `plant_refused?` refusal.
- the harvest route (S5b).
Escalation (user→admin) is applied by S3's grant handler calling a small helper
`elevate_session!(pc_id, 'admin')` that rewrites `sessions[pc_id]['access']`; it requires an
existing non-relay session for the same NPC on that host.

**S5b.** A new server method `harvest_cached_credentials!(pc_id)`:
1. requires an admin session on `pc_id` (`session_admin?`), else refuse;
2. computes the cached set: the PC's `owner` plus `cachedAccounts`, each resolved to an
   account-holder NPC (`AccessIdentities.account?`), minus the session's own NPC;
3. for each not already harvested (`harvestedAccounts` set), records it and writes the credential
   into the keyring through the existing path — an implicit `<npcId>.password` entry
   (`credential_keyring.rb:263-285`) becomes serveable for that account, exactly as a capture does;
4. returns the list of newly harvested account display names.
The password itself is served to the browser only through the existing keyring/capture gate, never
in the harvest answer.

**S5c.** A new check in `pc_admits_account?` (`game.rb:3352-3357`) or a helper it calls,
`account_kind_admits?(pc, npc)`:
- `accountKind` absent → unchanged (ACL decides);
- `local` → the account signs in only on a PC in its home set (its `owner`ed PC, the PCs that admit
  it by ACL today, or an explicit list); a `sharedLocalAdmin` account signs in on any PC unless that
  PC's policy sets `localAdmin: "unique"`, in which case it signs in only where its credential was
  originally valid;
- `domain` → the account signs in on any PC whose `domain` equals the account's `domain`.
Refusal reuses the step-6 shape (422 `notPermitted: true`, uncounted). For a domain account the
lockout key becomes `"domain:<name>|<username>"` so a lockout is domain-wide; `add_login_lockout!`
and the pre-password lockout check both use the scoped key (`game.rb:3482`, `:4360`).

### Client

The session answer and the bootstrap carry a short `access` label per session (`user`/`admin`); the
desktop shows an "Administrator" marker and reveals the harvest affordance only when `access` is
`admin`. The harvest affordance posts to the new route and, on success, nudges the keyring to
refresh (`keyring_changed`, `keyring.js`). No client code decides privilege; it only reflects the
label. Account kind and domain stay inside server-only `creds` and never reach the browser; the
client learns a local/domain sign-in failed only through the existing `notPermitted` refusal.

## 6. Server routes

Only S5b needs a new route. S5a's gates ride existing routes (`GET container/:id` for profiles, the
existing implant action for USB); S5c's check rides `POST /login`.

**`POST /harvest_credentials`** (new; `config/routes.rb` beside the other session routes, controller
beside `keyring`, `games_controller.rb` ~`:1862`). Params: `pc_id` (required).

Checks in order:
1. no `pc_id` → 400 `Missing pc_id`;
2. PC not a sign-in PC in a room (`find_login_pc`) → 404 `Sign-in PC not found`;
3. no session held at the PC for the acting player → 422 `Sign in required`;
4. the held session is not admin (`session_admin?` false) → 422 `{ error: "Administrator access
   required", notAdmin: true }`;
5. otherwise `harvest_cached_credentials!(pc_id)`, `save!`.

Response on success: `200 { success: true, harvested: [ {account, displayName} … ], keyringRev:
<new rev> }`. When nothing new is cached: `200 { success: true, harvested: [] }`. The response never
contains a password; the player reads harvested accounts from the keyring (`GET /keyring`), which
serves the secret under its existing earned-capture gate. `Cache-Control: no-store`, matching the
keyring route.

The existing `POST /login` gains no new param. Its step-6 refusal is reused for a local/domain
mismatch (S5c). The existing implant action gains no new param; its admin bypass (S5a) reads the
session already in hand.

## 7. What reaches the browser, and what never does

**Reaches the browser.** The session's `access` label (`user`/`admin`): a capability name, not a
secret, so the desktop can show the Administrator marker and the harvest affordance. The harvest
answer: the list of account ids and display names that were just harvested (no secret). Harvested
credentials appear afterwards through the keyring, which already sends only what the player has
earned (the `rev` digest, `credential_keyring.rb:74-85`).

**Never reaches the browser.** The cached-account list on a PC (`cachedAccounts`) is server-only; the
player learns it only by harvesting with admin. `accountKind`, `domain`, `sharedLocalAdmin` live
inside `creds`, already withheld (`WITHHELD_NPC_KEYS`, `game.rb:7332`), and never go out. A harvested
account's password is served only through the existing capture/keyring gate, never in the harvest
answer. The `localAdmin` policy value is server-only (policies are already server-only, D2 section
2.8). The domain lockout key is internal; the client still sees only the PC-id "lockout seen" marks
it sees today (`lockout_pcs_for_client`, `game.rb:3587-3594`).

The server stays the only authority that grants a credential or a privilege (brief section 3): admin
is written by the server from a card grant it validated; the harvest reads a server-held cached set;
the local/domain decision and the domain lockout are server-side. The browser receives no secret it
has not earned.

## 8. State and saved games

**S5a adds no key.** `access` is one short enum string inside each entry of the existing `sessions`
map (`ACCESS_STATE_DEFAULTS`, `game.rb:3021-3065`), which is already bounded by the number of
sign-in PCs. It rides the existing session delta: `sessions_for_client` (`game.rb:3725-3760`) and
`login_session_answer` (`game.rb:4433-4460`) include `access`; an escalation sends the one changed
session, not the map. Reload rebuilds the label from the stored session, so an admin session
survives a reload exactly as a user session does.

**S5b adds one bounded server-only key.** `harvestedAccounts`: a grow-only list of `"<pcId>|<npcId>"`
strings, added to `ACCESS_STATE_DEFAULTS`, capped like its siblings (128, matching `keyringGained`;
trim oldest). It is never read from a sync body and never sent to the browser (same rule as
`plantedItems`). What the player sees is the keyring entry the harvest unlocks, which rides the
existing keyring `rev` delta (`keyring_rev`, `credential_keyring.rb:238-240`) — no growing payload is
re-sent. A reset drops `harvestedAccounts` with the other access keys (it is not on
`reset_player_state!`'s preserved list), which is correct: a reset also drops the sessions that
earned it.

**S5c adds no key.** Account kind and domain are scenario-static. A domain account's lockout reuses
the existing `loginLockouts` list with a domain-scoped key; the list is already capped (200
non-account entries, `game.rb:3077`) and already survives reload.

Size budget: S5a adds ~16 bytes per live session; S5b at most 128 short strings server-side (never
sent); S5c adds nothing. No synced structure grows unboundedly and none is re-sent whole.

## 9. Validator, schema and dungeon graph changes

**Schema** (`scripts/scenario-schema.json`). Add: `access` enum (`user`, `admin`) on a technique
card's grant and `requiresSession` block (coordinated with S3, which owns the card schema);
`cachedAccounts` (array of NPC-id strings) on a `login_pc` object; `creds.accountKind` enum
(`local`, `domain`), `creds.domain` string, `creds.sharedLocalAdmin` boolean; `domain` string on a
`login_pc`/host object; `localAdmin` enum (`unique`) on a policy. All `x-serverOnly` where they sit
under `creds` or `policies`.

**Validator** (`check_access_model`, `scripts/validate_scenario.rb:7642`; `check_credentials`
`:7304`). New checks:
- `cachedAccounts` entries must be account-holder NPCs that exist; a cached account the PC cannot
  otherwise reach is allowed (that is the point) but noted as an info line.
- a `domain` account must have at least one `login_pc` with the same `domain`, else error (the
  account can never sign in); warn if a `login_pc` sets `domain` but no account uses it.
- `sharedLocalAdmin: true` is meaningful on exactly one local account; warn if set on a domain
  account or on more than one account.
- `localAdmin: "unique"` on a policy with no shared-local-admin account anywhere: warn (the policy
  does nothing).
- warn if a technique card grants `access: "admin"` but no weakness or escalation card leads to it
  (an unreachable admin), and if a PC declares `cachedAccounts`/harvestable content but no admin
  path to that PC exists (an unharvestable cache) — both solvability warnings.
- the existing "a lockout lasts the mission" warning (doc:A8) extends to note that a domain account's
  lockout is domain-wide.

**Dungeon graph** (`AccessIdentities.reach`, `access_identities.rb:291-306`, the graph's identity
input). Admin escalation is an edge: a user session on a host plus the named weakness yields an admin
session (a new node/edge pair). A harvested account is a key that unlocks the PCs that account is
admitted to; `reach` extends so a harvested domain or shared-local-admin account shows the extra PCs
it reaches. The graph tools must see the cached-account relation so a mission that depends on harvest
for progression is drawn as a dependency, not a dead end.

## 10. Effect on existing scenarios

A scenario that sets none of the new fields behaves exactly as before:

- **S5a.** No technique card grants admin (S3 is the only grant source), so every session is written
  without `access` and read as `user`. The three admin branches are `if session_admin?` guards that
  are simply not taken, so profile reads, USB installs and harvest behave as today. A session with no
  `access` key reads as `user` everywhere.
- **S5b.** With no admin path, the harvest route returns `{ harvested: [] }` and writes nothing; no
  existing scenario calls it. `harvestedAccounts` starts empty and stays empty.
- **S5c.** With no `accountKind`, `account_kind_admits?` returns the ACL result unchanged, so sign-in
  is decided by `pc_admits_account?` as today; the lockout key stays `"<pcId>|<username>"` because the
  domain-scoped key is used only for `domain` accounts.

**Proof.** Run the existing feature scenarios (`test_access_signin`, `test_access_sessions`,
`test_access_keyring`) through the full server flow before and after the change and assert the
server state and the client deltas are byte-identical (a golden-output test, added to the suite).
The schema additions are all optional, so existing scenarios still validate with no new errors or
warnings; a validator snapshot over the shipped scenarios proves no new diagnostic appears.

## 11. Tests

**Server unit.**
- S5a: a grant with `access: "admin"` writes an admin session; an escalation card raises a user
  session for the same NPC and refuses one for a different NPC or a relay session; `session_admin?`
  reads it; a reload preserves it. Admin `login_desktop_contents`/`admitted_profiles` returns every
  profile while a user session returns only the admitted ones; the USB implant path skips
  `plant_refused?` under admin and refuses under user.
- S5b: `harvest_cached_credentials!` harvests owner plus `cachedAccounts`, excludes the session's own
  NPC, is idempotent (second call harvests nothing), is bounded, and makes each harvested account's
  keyring entry serveable only through the existing gate. Refuses without an admin session.
- S5c: a local account signs in on its home PC and is refused elsewhere (`notPermitted`, uncounted);
  a domain account signs in on any PC in its domain; a shared-local-admin credential reused on a
  second PC works without `localAdmin: "unique"` and is refused with it; a domain account's lockout
  key is domain-scoped so a lockout at one PC blocks sign-in at another in the domain.

**Controller.** `POST /harvest_credentials`: 400 no `pc_id`; 404 unknown PC; 422 no session; 422 not
admin; 200 with the harvested list and no password in the body; `Cache-Control: no-store`.

**JS unit.** The desktop shows the Administrator marker and the harvest affordance only when the
session `access` is `admin`; the harvest post refreshes the keyring; no client path infers privilege.
Add any new JS module to every test harness copy list (brief section 3).

**Feature scenario** `test_ops_privilege`: a user session on a desk PC, a local weakness and an
escalation card to admin, a PC with cached accounts to harvest, a local admin reused across two PCs,
a domain account, and the `localAdmin: "unique"` policy on one PC.

**Scripted playtest** through `window.__test`: sign in as a user, confirm no other profile and no
harvest; escalate to admin, confirm the extra profiles and the harvest; harvest and reuse a cached
account on a second PC; sign in with the domain account on a second domain PC; trip the domain
lockout and confirm it blocks a second domain PC. Assert both sides: the `access` label and keyring
entries that reached the browser, and `sessions[pc].access`, `harvestedAccounts` and the
domain-scoped `loginLockouts` key the server recorded.

**Live browser proof** on the real path: escalate, harvest and reuse in a real browser, confirming
the harvest route and keyring refresh over the wire (not only a helper), per the fix-claims-live
rule.

## 12. Build steps and shared files

Order: S5a, then S5b (needs admin), then S5c (independent, can land either side of S5b).

Files this plan changes:
- `app/models/break_escape/game.rb`: `start_login_session!` (write `access`), `session_admin?` and
  `elevate_session!` (new), `login_desktop_contents`/`admitted_profiles`/`find_login_item`/
  `session_admits?` (admin branch), `harvest_cached_credentials!` (new), `pc_admits_account?` /
  `account_kind_admits?` (new), the lockout key builder and check (domain scope),
  `ACCESS_STATE_DEFAULTS` (`harvestedAccounts`), `sessions_for_client` / `login_session_answer`
  (emit `access`).
- `app/models/break_escape/network_access.rb`: admin bypass at the `plant_refused?` call (~`:507`).
- `app/models/break_escape/credential_keyring.rb`: harvest marks the implicit `<npcId>.password`
  entries serveable (reuse `:263-285`).
- `lib/break_escape/access_identities.rb`: `account_kind`, domain and home-set helpers; `reach`
  extension for harvested and domain accounts.
- `app/controllers/break_escape/games_controller.rb` and `config/routes.rb`: the harvest route.
- `scripts/scenario-schema.json`, `scripts/validate_scenario.rb`: schema and validator.
- client `public/break_escape/js/systems/pc-sessions.js` (read `access`), the desktop view and a
  small harvest affordance, `keyring.js` refresh; test harness copy lists.
- `docs/ACCESS_AND_NETWORKS.md` and `README_scenario_design.md` feature index (A18–A20) on landing.

**Shared files other ops plans also touch** (coordinate edit order, memory "shared-file order"):
- `start_login_session!` and the session record: S3 (writes the `access` on grant) and S8 (MFA step
  before the session is written).
- `attempt_login!` check order: S8 inserts the MFA step; S5c inserts the account-kind sub-check at
  step 6. Agree the relative position (section 14).
- `AccessIdentities.reach`: S1–S3 add hosts, services and technique reach; S5 adds escalation and
  harvested-account reach.
- `ACCESS_STATE_DEFAULTS`: several plans add bounded keys; each adds its own.
- the keyring credential path: S3 (a card that yields a credential), S7 (a cracked hash), S5b
  (harvest) all write through it.

## 13. Log rows this feature writes

Storage and reading are S9's (brief section 5). This feature writes, through S9's one helper:

| event | who | where | when |
|---|---|---|---|
| `privilege_escalated` | the session's account | the host | on a user→admin escalation |
| `admin_profile_read` | the session's account | the PC (and profile id) | first admin read of another account's profile |
| `usb_install_overridden` | the session's account | the PC | an implant installed despite the USB policy under admin |
| `credentials_harvested` | the session's account | the PC (count of accounts) | on a harvest that yields at least one account |
| `domain_account_locked_out` | the locked username | the domain | when a domain account crosses `maxAttempts` |

Each row records event name, actor, place and game-time stamp only (no secret). Until S9 lands, the
helper is a no-op stub, matching the other ops plans.

## 14. Cross-plan requests

- **To OPS_CORE (S3, Fable).** S5a needs the technique card's `grants` block to carry `access:
  "user" | "admin"`, and a card form that elevates an existing user session on a host to admin
  (a `requiresSession: { host, access: "user" }` with `grants.access: "admin"`). S3 owns the card
  schema and the grant handler; S5a owns what `admin` then means. Please expose `elevate_session!`
  as the grant handler's call for the escalation case, or call S5a's helper.
- **To OPS_MFA_HELPDESK (S8, Fable).** Both S5c and S8 extend the `attempt_login!` order. S5c's
  account-kind sub-check sits at step 6 (`pc_admits_account?`). Recommend the MFA step runs after the
  identity, permission and account-kind checks all pass and before the session is written, so MFA
  never fires for a sign-in that would be refused anyway. Please confirm the order.
- **To OPS_CRACKING (S7, Opus).** A cached credential a machine holds may be a hash, not a cleartext
  password. S5b writes whatever it harvests through the shared keyring path; when the cached item is
  a hash it should land as S7's `hash` kind for offline cracking. Please confirm the harvest can
  produce a hash entry and agree the field that marks a cached account as hash-only.
- **To OPS_LOG_ROWS (S9, Opus).** The five rows in section 13.

## 15. Open questions for the user

1. **How the server learns an account is cached at a PC (S5b).** The server cannot see an NPC use its
   own PC (section 2). Options: (a) derive the cached set from the PC's owner only; (b) owner plus a
   scenario `cachedAccounts` list; (c) let the browser report that an NPC signed in, with a server
   sanity check. **Recommend (b):** it is server-authoritative, deterministic and satisfies the
   cheat-resistance rule (the harvest yields a real credential, so it must not rest on browser
   claims). Live "recently signed in" flavour on the client is fine as long as the harvest itself
   reads only the server's declared set. Option (c) is rejected for the harvest because a harvested
   credential is a secret.
2. **Default account kind (S5c).** When `accountKind` is absent, treat the account as unscoped
   (today's ACL behaviour) rather than defaulting to local or domain. **Recommend unscoped** so every
   existing scenario is unchanged; authors opt in where the local/domain distinction teaches
   something.
3. **Admin reading other profiles: automatic or marked?** Should admin see every profile on the PC
   automatically, or only profiles a scenario marks readable? **Recommend automatic** (admin reads
   all on that machine) as the truthful model and the simpler rule, with an optional per-profile
   opt-out if a mission needs a profile that even admin cannot read.
4. **Per-lockout `scope` (backlog `docs/IDEAS_BACKLOG.md:197`).** This plan gives a domain account a
   domain-wide lockout by scoping its lockout key to the domain, which needs no new field.
   **Recommend not adding the general `scope` field now;** derive scope from account kind. Revisit the
   general field only if a mission needs a non-domain account locked across several specific PCs.
5. **Does a harvest or an escalation cost game minutes or risk detection?** No ops plan assumes a
   server clock (brief section 5). **Recommend no time cost and no detection for now;** if a later
   mission wants harvest to take time or raise an alert, that rides the actors/defence work that is
   out of scope here.
