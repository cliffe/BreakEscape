# OPS_CRACKING_PLAN.md: S7 hashes and offline cracking (feature A21)

Stage S7 of the ops layer (brief `docs/agents/OPS_LAYER_BRIEF.md`, outline
`docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md` S7). Two build stages, C1 (size S) and C2 (size M).
Planning only.

Everything here is fictional and abstract. A hash is an invented opaque token. The plan names no
real hash format, no real tool and no real procedure. The minigame is a game move, not a technique.

## 1. What this adds and why, in play

The player can obtain an account's **hash record**, an opaque token that stands for the stored,
scrambled form of someone's password, and then run an **offline cracking** minigame that tries to
recover the plain password from it using the **intel facts** the player has earned about that
person (a pet's name, a birth year, a sports team).

Three sources give a hash record, all through the existing keyring (A15):

- **A file on a share or in a container** (N4): a carelessly stored credentials file the player
  takes. It is an ordinary takeable `text_file` with the existing `credential` field.
- **A technique that yields one** (S3): a weakness whose `grants.credential` names a hash record.
- **Collecting cached sign-ins with admin on a PC** (S5b, which builds after this stage): every
  account the collect yields is a hash, never a password. A scenario that does not teach cracking
  declares no cached accounts.

The cracking minigame shows the hash token and the facts the player has earned, and lets the player
pick the facts they think the password is made from. The **server** decides the outcome from the
account's password class (the NPC's `password` habit, or a recipe on the hash record itself):

- A **strong** password never yields. After a couple of runs the cracker says so plainly. The
  lesson: a good password is not built from personal facts, so cracking is a dead end; go and
  phish, or find it reused.
- A **guessable** password yields once the server has seen the player earn every fact it is made
  from, and the player picks exactly those facts. While facts are still missing, a run says how
  many, never which. The lesson: personal facts are password material.
- A **reused** password yields when the player already holds an equal password from somewhere
  else. The lesson: reuse turns one leak into many.
- A **common** password (a recipe on a hash record only, for an account with no person behind it,
  such as a shared local administrator) yields on the first run. The lesson: a default or very
  common password falls at once.

**Salt** is shown, not just counted. Unsalted records of the same password show the same token,
and cracking one unsalted record cracks every held unsalted record with that token at once, as if
looked up in a precomputed list. A salted record shows its own token and, once the right facts
are picked, takes a short real-time wait on the server before it yields, alone. The lesson: salt
stops one piece of work from opening many hashes; it does not save a guessable password. Cracking
costs no game minutes.

When a crack succeeds the recovered password lands in the keyring as a `password` entry for that
account, so sign-in uses it exactly as a captured password, and it meets a second step (S8) like
any other first factor.

## 2. What the code does today (verified, `file:line`)

Short names: `CM` = `lib/break_escape/credential_model.rb`, `CK` =
`app/models/break_escape/credential_keyring.rb`, `VS` = `scripts/validate_scenario.rb`, `SCH` =
`scripts/scenario-schema.json`, `GAME` = `app/models/break_escape/game.rb`, `GC` =
`app/controllers/break_escape/games_controller.rb`.

- **`password-guesser` is browser-only and not reusable as is.** Scene
  `public/break_escape/js/minigames/password-guesser/password-guesser-minigame.js` and model
  `password-guesser-model.js`. Every row outcome is authored config decided in the browser, and
  `landedGlobal` is written client side with no server check. `slotGuess` (`model.js:101-104`)
  fills an authored template with an authored word, which the cracker must never ship before a
  grant. Its config is pinned by the awareness lint (`scripts/validate_social/awareness.rb:1296-1298`,
  `scripts/validate_social/exercises.rb:16,81`). S7 builds beside it and reuses only its row CSS
  classes and the `textFor` row renderer, by copying the pattern, not by importing the module.
- **The keyring reserves a `hash` kind.** `CM:26` `'hash' => { built: false }`. The validator
  refuses an unbuilt kind (`VS:7469`). `DEFAULT_ACCEPTS` (`CM:30`) lists the kinds a PC takes by
  default; `PROOF_KINDS` (`CM:36`) is `session planted dropped held foothold`; `proof_kind`
  (`CM:62-67`) counts a proof key only when its value is a present string; `MAX_ENTRIES = 64`
  (`CM:39`).
- **The registry entry shape is closed.** `SCH:281-310`: `credentials` is `x-serverOnly` (the
  bootstrap strips it, `GET /keyring` serves proven entries), each entry has
  `additionalProperties: false`, and `account` is a string, the NPC id of an account holder.
- **Keyring rows.** `CK:77` lists `implicit_keyring_entries + registry`. `registry_keyring_entries`
  (`CK:312-328`) has two branches: `password` and everything else, which goes to
  `registry_connecting_entry` (`CK:345-383`); a built `hash` would land there with no token and
  empty routes, so it needs its own branch. `implicit_keyring_entries` (`CK:266-287`) builds
  `"<npcId>.password"` only from accounts in `player_state['seCaptures']`, attaching the password
  only when `social.captures.revealSecret` allows; it cannot carry a cracked password and has no
  place to record one.
- **Client keyring readers.** `public/break_escape/js/minigames/capture-log/signin-rows.js:30,184`
  keeps only `CONNECTING_KINDS` in the Sign-ins list, so a hash row needs new code there.
  `public/break_escape/js/systems/keyring.js:55` tags any non-capture password `in_file`, which
  hides it until a `foundIn` file is opened (`:344-348`) and treats it as a find waiting
  (`:458`); `:774` `FIND_KINDS` has no `hash`. `keyring.js:752-771` `screenEntries` ignores an
  unknown kind, and `credential_login.rb:180-181` refuses a non-connecting kind, so a hash can
  never sign in. `tools/playtest/lib/access_leak_scanner.rb:1270` checks only `registry` entries.
- **The `password` habit has no runtime reader.** `lib/break_escape/npc_habits.rb:24` allows
  `strong guessable reused`; `passwordPattern` (`:29`, `:55-57`, `SCH:4422`) is **one object id**,
  the readable clue that gives the pattern, not a list of fact ids. `SCH:4420` describes `password`
  as "No run-time effect". The habit is read at authoring time only (`scripts/validate_npc_habits.rb`,
  `scripts/generate_dungeon_graph.rb:427-450`, `lib/break_escape/npc_habits/clues.rb`, whose header
  at `:9-13` says it is never used by the server). Habits are not shipped to the browser. Nothing
  in the habit links a password to fact ids, so S7 adds that list (section 4) and does not call
  `clues.rb` at runtime.
- **Intel facts are browser-claimed today.** `public/break_escape/js/systems/social-intel.js`
  `grantFact` writes `se_intel_<id> = true` through the client global writer; callers are the
  `grant_fact` action (`systems/apply-actions.js:159-164`, reached from ink, object actions and
  timers), mail highlights and the OSINT browser. `GAME:3067` `SERVER_OWNED_GLOBAL_NAMES` is only
  `se_captures`, so the server stores any `se_intel_*` a sync sends. A crack cannot rest on them.
- **Events the server already sees.** Every server-side inventory add goes through
  `add_inventory_item!` (`GAME:719`): the inventory route (`GC:1441`), flag-reward items
  (`process_item_reward`, `GC:4006`) and NPC gives checked against `npc_given_items`. Served
  social-feed posts are recorded in `player_state['feedRevealed']` (`app/models/break_escape/social_feed.rb:8-11`),
  and a post's `fact` travels with it. A flag the server accepts runs its station's `flagRewards`
  through `process_flag_rewards` (`GC:3948-3992`), reached from `games#submit_flag` (`GC:2094`,
  `:2179-2182`, after `Game#submit_flag`, `GAME:7764`, checks the flag against the scenario's own
  list) and from a flag-locked object's unlock (`GC:1335-1355`, after the lock's own server check).
  It appends the flag to `player_state['flag_rewards_claimed']` (`GC:3987-3988`). Of its reward
  types, `give_item` goes through `add_inventory_item!` (`GC:3994-4008`); `set_global`,
  `unlock_object` and `hint` are forwarded to the browser untouched (`GC:3969-3971`). These are the
  hooks for server-granted facts (section 5).
- **Items already prove a credential.** An item's `credential` field (`SCH:5158`) is stamped by
  the server on take from its own definition (`GAME:772-773`); the `held` proof matches it
  identity-strict (`CK:42-63`); `VS:7537-7558` checks the cross-reference. A share file is taken
  through the same path (`lib/break_escape/network_access.rb:1735-1745`). A hash on a share needs no
  new content kind.
- **Time.** No game-minute clock exists. The server has real time: `server_now`
  (`app/models/break_escape/npc_frustration.rb:60`), used by `credentialClock` and token expiry
  (`CK:97-137`). `GET /keyring` sets `Cache-Control: no-store` (`GC:1879`). Server routes take a row
  lock for read-modify-write (`CK:76`).

## 3. Build stages

S7 lands after S3 and before S5b (S5b's collect yields only hashes, so it needs this stage). Each
stage is shippable and tested alone.

| Stage | What | Size | Named test that proves it |
|---|---|---|---|
| C1 | `hash` kind built (`connects: false`); `crack` recipe on the record; schema; `scripts/validate_cracking.rb`; the hash keyring row (server and client, no Crack button yet); the token; the dungeon graph node and edges; the core plan's `grants.credential` rule widened to `hash` | S | `cracking_row_test.rb`: taking the share file lists a hash row with token, username and `status: "ready"`, and no password; a technique grant lists the same row |
| C2 | `revealsFacts` on items, the `grant_fact` flag reward, and the server's earned-fact record; `POST /crack`; crack state; the cracked grant and its keyring entry; the `ops-cracker` scene and the Crack button on the hash row | M | `ops_crack_test.rb`: each class's outcome, refusals in order, the salted wait, the unsalted batch, a forged `se_intel_*` refused |

After C1 a scenario can hold a hash with no way to crack it (inert, visible). After C2 it can be
cracked. The S5b collect is the privilege plan's stage and adds only its `harvested` proof kind;
this plan's row, scene and route serve it unchanged.

## 4. Scenario fields

**The hash record** is a `credentials` entry of kind `hash`. Fields: `kind`, `account` (the
account holder's NPC id, a string, as every registry entry), `proof` (exactly one string-valued
proof, as today), optional `salted` (boolean, default false), optional `crackSeconds` (integer 10
to 600, salted only, default 60: the server-timed wait), and `crack` (the recipe, below). The
token shown to the player is **not authored**: the server derives it (section 5). C1 example, a
file on a share:

```json
"credentials": {
  "dana_hash": {
    "kind": "hash",
    "account": "dana",
    "salted": true,
    "proof": { "held": "dana_hash_file" },
    "crack": { "facts": ["dana_dog_name", "dana_birth_year"] }
  }
},
"resources": {
  "ops_share": {
    "kind": "file_share",
    "host": "fileserver",
    "contents": [
      { "type": "text_file", "id": "dana_hash_file", "name": "backup.creds", "takeable": true,
        "credential": "dana_hash", "text": "Exported sign-in records. Do not share." }
    ]
  }
}
```

The file's `text` is authored flavour; it never holds the token (authors cannot know it). The token
shows on the hash row and in the cracking scene. A technique source writes `"proof":
{ "technique_card": "<findingId>" }` (the core plan's proof kind) and the weakness names the record
in `grants.credential`. A collect source writes `"proof": { "harvested": "<pcId>" }` (the privilege
plan's proof kind, S5b).

**The recipe, `crack`.** An object with up to three keys:

- `password`: the class, one of `strong`, `guessable`, `reused`, `common`. Optional when the
  account NPC has a `password` habit (the habit's class is used); **required** when it has none (an
  `accountOnly` account, which carries no habits). `common` exists only here, not on the habit.
  When both are present and differ, the record's class wins for the crack and the validator warns.
- `facts`: for `guessable`, the `social.intelFacts` ids the password is made from (1 to 4, no
  repeats, order not significant). Required for `guessable`, refused on other classes.
- `passwordPattern`: optional, the same meaning as the habit's parameter (the object id of the
  readable pattern clue), so the habit validator's backing check can run on a record with no
  habit.

A record with no `crack` at all is allowed only when its account has a `password` habit whose
class is not `guessable` (a guessable crack needs `facts`). C2 example, an `accountOnly` shared
administrator:

```json
"deskadmin_pc01": { "kind": "hash", "account": "deskAdmin", "proof": { "harvested": "pc01" },
                    "crack": { "password": "common" } }
```

**Facts the server can see: `revealsFacts` on an item** (C2). An optional array of
`social.intelFacts` ids on any item definition (`definitions.item`). When the server adds that item
to the inventory (taken, given by an NPC, or a flag reward), it records the facts as earned, and
the client grants them through `grantFact` so the intel board agrees.

```json
{ "type": "notes", "id": "dana_vet_card", "name": "Vet reminder card", "takeable": true,
  "text": "Biscuit is due a booster.", "revealsFacts": ["dana_dog_name"] }
```

A social-feed post's existing `fact` field is a second server-visible source; it needs no new
field.

**Facts the server can see: a `grant_fact` flag reward** (C2). A new server-handled entry in a
flag station's `flagRewards`, `{ "type": "grant_fact", "fact": "<intelFactId>" }`, the same shape
as the `grant_fact` action. It counts once the server has accepted that flag (a VM flag the server
checks against the scenario's list, or a flag lock's server-checked answer). The server forwards it
to the browser as it forwards `set_global`, so the intel board shows the fact too.

```json
"flagRewards": [
  { "type": "grant_fact", "fact": "dana_birth_year", "label": "HR record recovered" }
]
```

Nothing else grants a fact the crack reads. A fact granted in ink dialogue, by an object action or
timer, by an OSINT page, by a mail highlight, or by a `set_global` reward writing `se_intel_<id>`
is reported by the browser, and the crack ignores it.

**The NPC `password` habit** is unchanged in shape. Its schema description changes from "No
run-time effect" to say the crack reads its class.

A scenario with no `hash` record, no `revealsFacts` and no `grant_fact` reward is unchanged
(section 10).

## 5. Engine behaviour (server then client)

### Server

New module `app/models/break_escape/ops_cracking.rb` (a concern on `Game`, as `CredentialKeyring`
is). It reads only `scenario_data`, `player_state` and the server clock.

**The token.** Derived on each answer, never stored: an HMAC (key derived from the app's
`secret_key_base` with a fixed purpose string, never sent) over the game id plus, for an unsalted
record, the account's `creds.password`, or, for a salted record, the record id. The output is 24
characters from a 32-letter alphabet, shown in groups of four. It carries no information a client
can use: it cannot be inverted or recomputed without the server key, and it differs between games.
Two unsalted records whose passwords are equal show the same token in the same game; salted
records never match. This is the visible meaning of salt.

**Earned facts.** A fact counts for a crack only when the server has seen the event that reveals
it. The set is the union of:

1. `player_state['earnedFacts']`: ids stamped by `add_inventory_item!` from the item definition's
   `revealsFacts` (the server's own definition, found as `restamp_item_credential!` finds it,
   `GAME:749-773`, never the client's item body). This covers a take, an NPC give and a flag
   reward's item.
2. The `revealsFacts` of items in the inventory now, read from their definitions (covers start
   items that never passed through `add_inventory_item!`).
3. The `fact` of every social-feed post the server has served (`feedRevealed`).
4. The `fact` of every `grant_fact` entry in the `flagRewards` of a flag in
   `player_state['flag_rewards_claimed']`, read from the server's own station definition (as
   `find_flag_rewards`, `GC:3897`, finds it). Only `process_flag_rewards` writes that list, and only
   after the server has accepted the flag, so nothing new is stored for this source.

So exactly three kinds of server event grant a fact: an item entering the inventory through
`add_inventory_item!` (take, NPC give, `give_item` flag reward) or held from the start; a feed post
the server serves; a flag the server accepts whose rewards include `grant_fact`. A `se_intel_*`
global is never read, and no outcome the browser reports (ink, object actions, timers, a
`set_global` reward) counts. Per source, what an author does:

| Where the fact comes from today | Server-visible? | What the author does |
|---|---|---|
| An item the player takes, or a takeable file on a share or in a container | yes | add `revealsFacts` to the item |
| An item an NPC hands over (ink `give_item`, NPC `itemsHeld`) | yes, the inventory route checks the NPC held it | add `revealsFacts` to the held item |
| A flag reward | yes, once the server accepts the flag | add a `grant_fact` reward, or give an item carrying `revealsFacts`; a `set_global` reward of `se_intel_<id>` does not count |
| A social-feed post with `fact` | yes (`feedRevealed`) | nothing |
| Ink dialogue, an object action or timer `grant_fact`, an OSINT browser page, a mail highlight | no, the browser grants it | for a fact a recipe needs: also have the NPC hand over an item carrying it, or put it on a takeable item, a feed post or a flag reward. The dialogue grant may stay for the intel board |
| A read-only poster or notice the player cannot take | no (reads are not recorded) | make it takeable, or add a takeable copy |

The validator refuses a recipe fact with no server-visible source (section 9), so this is found at
authoring time.

**The class.** `crack.password` if present, else the account NPC's `habits.password`. Fails
closed: no class (an old or hand-edited game row whose habit is gone), an unknown value, or an
account with no `creds.password` answers `no_recipe` and records nothing.

**One run** (inside `with_lock`, in `games#crack`):

- **Already cracked** (the account is in `crackedAccounts`, or the keyring already serves a password
  for it from any source): answer `cracked` again, change nothing.
- **strong**: increment `crackRuns[hashId]` up to 2. Answer `nomatch` on the first run and
  `infeasible` from the second.
- **common**: yields on this run.
- **guessable**: if the earned set does not cover `crack.facts`, answer `needMoreFacts` with
  `missingCount` = how many recipe facts are not yet earned; the submitted pick is not compared, so
  the answer says nothing about which earned facts matter. If the earned set covers the recipe, the
  pick must equal `crack.facts` as a set: equal yields; any other pick answers `nomatch`.
- **reused**: the pick is ignored. Yields when some password the keyring serves the player now
  (capture secrets, `registry` password entries whose proof holds, cracked accounts), resolved to
  its account's `creds.password`, equals this account's `creds.password`. Else `nomatch`.

**Salt.** A yield on an unsalted record grants at once and also grants every other held, unsalted
`hash` record whose password is equal (the same token). A yield on a salted record stamps
`crackStarted[hashId] = server_now` (first time only) and answers `running` with
`readyInSeconds`; a later run answers `running` until `crackSeconds` have passed, then grants that
record alone. Repeats before the time change nothing, so replaying the request gains nothing. A
salted wait, once started, does not need a new pick.

**The grant.** Appends the account id to `player_state['crackedAccounts']`. A new builder,
`cracked_keyring_entries`, beside `implicit_keyring_entries` (`CK:266`), lists one entry per
cracked account: id `"<npcId>.cracked"`, `kind: "password"`, `source: "cracked"`, the account
block with username, label "Cracked", and `password` from the scenario's `creds.password`, always
attached (a crack recovers the plain text; there is no `revealSecret` equivalent). Where the
capture builder already serves a password for the same account, the cracked entry is left out, so
an account has one password row. The distinct id means the two builders never clash on
`keyringGained` or the client's row keys. After a password reset (S8b) the crack still yields the
scenario's password, stale on purpose: the hash was of the old one.

**The hash row** (a new branch in `registry_keyring_entries`): `id`, `kind: "hash"`, `source:
"registry"`, the account block (display name and username), `label`, `token`, `salted`, and
`status`: `ready`, `running` (with `readyInSeconds`), `infeasible`, or `cracked`. No routes, no
`connectsTo`, no password. When at least one hash row is listed, the keyring answer also carries
`crackFacts`: the earned fact ids (section 7).

### Client

- **The scene `ops-cracker`** (`public/break_escape/js/minigames/ops-cracker/ops-cracker-minigame.js`,
  a `SocialOverlayScene` subclass, `framework/social-overlay.js:33`) and a pure model
  `ops-cracker-model.js`. It shows the account's headshot or an account icon, the token, the salt
  marker, and the earned facts as pickable chips labelled from `social.intelFacts` (or the served
  post). The player picks one to four and presses Crack. It renders the server's status only: a
  progress bar while `running`, "N facts still missing", "No match", the in-fiction infeasible line,
  or "Cracked" with the password from the keyring answer. It never decides an outcome and never
  holds a password before the grant. All words come from scene strings or the scenario; no NPC
  speaks.
- **Launch points.** The hash row's Crack button in the Sign-ins list
  (`capture-log/signin-rows.js`), and the privilege plan's collect panel (S5b), both calling
  `window.MinigameFramework.startMinigame('ops-cracker', { hashId })`. No inventory tool item.
- **Keyring.** `keyring.js` tags a `cracked` password `cracked` (not `in_file`), shows it at once
  (no `foundIn`), and gives a hash entry a find toast ("Hash collected"). `signin-rows.js` draws hash
  rows in their own group with the account's username, token and status, and a Crack button only
  when `status` is `ready` or `running`; a `cracked` row shows the account's password row beside it.
- **`revealsFacts` on the client.** When an item carrying `revealsFacts` enters the inventory, the
  client calls `grantFact` for each id, so the intel board and notes match what the server stamped.
  `processRewardEvents` in the flag station (`minigames/flag-station/flag-station-minigame.js:1023`)
  gains a `grant_fact` case that calls `grantFact`; the server, not that call, makes it count.

## 6. Server route: `POST /crack`

Path `POST /games/:id/crack`: a new route in `config/routes.rb`, action `games#crack`, policy
method `crack?` mirroring `sync_state?`.

**Params** (snake_case): `hash_id`, the registry id of a hash record; `facts`, an array of 0 to 4
strings, each matching the registry id pattern. The body is capped at the route's size limit. There
is no reuse parameter: a `reused` run ignores the pick. No password, word or token ever travels
inbound.

**Checks, in order.** Each refusal is `{ success: false, reason: "<code>" }`:

1. Policy and game load: 403 or 404, as every game route does today.
2. `bad_request` (400): a missing `hash_id`, `facts` not an array, more than 4 entries, or an entry
   that is not a matching string.
3. `no_hash` (404): an unknown id, an id that is not a `hash` record, or a hash record whose proof
   does not hold now. All three answer the same body, so holding cannot be probed.
4. `no_recipe` (422): the class does not resolve (section 5).
5. `fact_not_held` (422): any picked id is not in the earned set. An id that names no fact at all
   answers the same.
6. The run (section 5), inside `with_lock`.

**Success** is `200 { success: true, status, runs?, missingCount?, readyInSeconds?,
credentialIds? }`, with `status` one of `nomatch`, `infeasible`, `needMoreFacts`, `running`,
`cracked`. `runs` comes with `strong`; `missingCount` with `needMoreFacts`; `readyInSeconds` with
`running`; `cracked` carries the account id and the new keyring ids (`"<npcId>.cracked"`, more than
one for an unsalted batch), never the password, which the browser reads afterwards from
`GET /keyring` as it reads any other. Every answer sets `Cache-Control: no-store`.

The refusal codes are a closed list: `bad_request no_hash no_recipe fact_not_held`. Where the
shared refusal-code list (`ops_refusal_codes.json`) exists, they are added to it.

## 7. What reaches the browser, and what never does

Reaches the browser, on the hash row in `GET /keyring` or in a `POST /crack` answer:

- The token, `salted`, the account's display name and username, and `status`.
- `missingCount`, a bare count of recipe facts not yet earned.
- `readyInSeconds` while a salted crack runs.
- `crackFacts`: the ids of facts the server counts as earned, so the scene offers only those.
- The password, only after the grant, as the `password` of the `"<npcId>.cracked"` keyring entry.

Never reaches the browser:

- The recipe: `crack.facts`, `crack.passwordPattern`, and which earned facts the recipe uses.
- The class before any run.
- `creds.password` before the grant.
- The token key, or anything a client could use to recompute or invert a token.

The class is not a secret in play. After runs, `infeasible` shows the password is strong and
`needMoreFacts` shows it is guessable. That is the lesson, and it names no fact.

## 8. State and saved games

Four new keys, all in `ACCESS_STATE_DEFAULTS`, all written only by the server. None is a sync
section, so a sync that sends one is ignored, and none is sent to the browser as state.

| Key | Shape | Written when | Bound |
|---|---|---|---|
| `earnedFacts` | array of fact ids, grow-only | `add_inventory_item!` adds an item with `revealsFacts` | ids from authored `revealsFacts` only; at most 64 |
| `crackRuns` | `{ hashId => integer }` | a `strong` run | value capped at 2; keys only registry hash ids |
| `crackStarted` | `{ hashId => server ms }` | the first correct run on a salted record | at most 64 |
| `crackedAccounts` | array of NPC ids, grow-only | a grant | at most 64 |

Feed-post facts and flag-reward facts are not copied in: the server reads them from
`feedRevealed` and `flag_rewards_claimed`, which it already keeps. The token is never stored. The
password is never stored: the cracked keyring entry reads `creds.password` from the scenario each
time.

On reload the hash row comes back with its status from these keys, so a salted wait in progress
resumes. A saved game from before S7 has none of the keys and reads them as empty. The sync deltas
plan's growth table gains these four rows when it is built. `bin/ops-golden-compare` strips the new
keys while empty, so unchanged scenarios compare equal.

## 9. Validator, schema and dungeon graph

**Validator.** A new file, `scripts/validate_cracking.rb`, hooked by one line in
`scripts/validate_scenario.rb` beside `require_relative 'validate_network'` (`VS:24-28`). Its rules,
each an error unless marked:

- A hash record's `account` names an account holder.
- The class resolves: `crack.password`, or the account's `password` habit. The rule "the account
  needs a `password` habit" applies only to a record with no `crack.password`.
- A `guessable` crack has 1 to 4 `facts`, no repeats, each a `social.intelFacts` id with a
  server-visible source. Otherwise the error reads: "fact `<id>` must come from a takeable item, a
  feed post or a flag reward". A source is an item with `revealsFacts` naming it, a feed post whose
  `fact` is it, or a `grant_fact` entry in some station's `flagRewards`.
- `facts` on a class other than `guessable` is refused.
- Warning: the record's `crack.password` differs from the account's habit.
- `crackSeconds` only with `salted: true`, and within 10 to 600.
- `connectsTo` on a hash record is refused, and so is `accepts: ["hash"]` on a sign-in policy.
- Every `revealsFacts` id and every `grant_fact` reward's `fact` names a `social.intelFacts` id.

Inside `check_credentials`, only two changes: the unbuilt-kind message at `VS:7469` no longer
fires for `hash`, because `CM:26` becomes `'hash' => { built: true, connects: false }`, and the
comments there say so. `connects: false` keeps `DEFAULT_ACCEPTS` as it is: a hash never signs in.
The core plan's `grants.credential` rule (a technique grant names a `saved_connection`) widens to
`saved_connection` or `hash`, with a test; S7 makes that change.

**Schema** (`scripts/scenario-schema.json`). The hash fields (`salted`, `crackSeconds`, `crack`) go
in the closed registry entry (`SCH:281-310`), with `crack` a closed object of `password` (enum
`strong guessable reused common`), `facts` and `passwordPattern`. `revealsFacts` (array of strings)
goes in `definitions.item`. `grant_fact` joins the `flagReward` type enum (`SCH:5750`) with a `fact`
string. The habit's `password` description (`SCH:4420`) says the crack reads its class.

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`). A built hash record already draws a key
node (`:1626-1634`). Add edges from the source (the share file item, the technique, or the
privilege plan's `admin@<pcId>` node) to the hash node; and from the hash node plus each recipe
fact's source (item, feed post or flag station) to the `<npcId> password` node, labelled "crack".
No password text appears in any label.

## 10. Effect on existing scenarios, and the proof

No existing scenario has a `hash` record, a `revealsFacts` field or a `grant_fact` reward, so
nothing it does changes. `DEFAULT_ACCEPTS` and the shipped habit keys are untouched.

The proof runs through `bin/ops-golden-compare` (built in the log rows plan's stage L1a), with
fixtures in `test/fixtures/files/ops_unchanged/cracking_<scenario>.json`, captured before C1 and
compared after C1 and after C2:

- `GET /keyring` for `test_access_networks` (a scenario with registry entries).
- The bootstrap payload for `test_simple_success`.
- The full validator output for every scenario.

Two existing tests may assert that `hash` is unbuilt: `test/unit/credential_model_test.rb` and
`test/models/break_escape/credential_keyring_test.rb`. They change with C1, and are the only
existing tests that should.

## 11. Tests

**C1, `test/models/break_escape/cracking_row_test.rb`.** Taking the share file lists a hash row
with token, username and `status: "ready"`, and no password; a technique grant lists the same row;
the token is stable across reloads, differs between games, and is equal for two unsalted records
whose passwords are equal; a salted record's token matches nothing; a hash never signs in.

**C2, `test/controllers/break_escape/ops_crack_test.rb`.**

- Each class: `strong` answers `nomatch` then `infeasible`; `guessable` answers `needMoreFacts`
  with the right count, then `nomatch` for a wrong pick, then yields for the exact set; `reused`
  yields only while an equal password is held; `common` yields on the first run.
- Refusals in order (`bad_request`, `no_hash` for unknown, non-hash and unheld alike, `no_recipe`,
  `fact_not_held`), each with the closed `{ success: false, reason }` body.
- Fact sources: `revealsFacts` stamped on a take, an NPC give and a `give_item` flag reward; a
  start item's facts counted; a served feed post's fact counted; a `grant_fact` reward counted
  after the flag is accepted through `submit_flag` and through a flag lock, and not before.
- Forgeries ignored: a synced `se_intel_*` global, a synced `earnedFacts`, `crackRuns`,
  `crackedAccounts` or `flag_rewards_claimed`, a `set_global` reward of `se_intel_<id>`, a
  client-reported ink `grant_fact`.
- The salted wait with a frozen clock (`running` with a falling `readyInSeconds`, then the grant);
  the unsalted batch (one yield grants every held record with the same token); two parallel posts
  grant once; a game whose habit has gone answers `no_recipe`.
- A captured and then cracked account shows one password row. No answer body holds the password.
- The leak scanner (`tools/playtest/lib/access_leak_scanner.rb:1270`) learns the `cracked` entries
  and passes on them.

**JS, `test/js/ops-cracker.test.mjs`.** The model renders each server status, offers only
`crackFacts`, sends fact ids only, and decides nothing. The new modules join the harness copy lists
(`test/js/exercise-station.test.mjs:31` and any harness that copies `minigames/index.js`), or plain
`node` fails with `ERR_MODULE_NOT_FOUND`.

**Feature scenario `scenarios/test_ops_crack/`.** One `strong`, one `guessable` (one fact from an
item, one from a feed post, one from a `grant_fact` flag reward), one `reused`, one `common` recipe
on an `accountOnly` account, and a salted record beside two unsalted records with equal passwords.
The validator and dungeon graph run clean.

**Scripted playtest and live proof.** Through `window.__test`: collect a hash, run the cracks,
check that the browser saw only statuses and counts before the grant. Then the real path in a
browser: crack the guessable account and sign in with the cracked password.

## 12. Build steps and shared files

C1, in order: `CM:26` flips `hash` to built; schema fields; `scripts/validate_cracking.rb` and its
hook line; the hash branch in `registry_keyring_entries` with the token; the client row in
`keyring.js` and `signin-rows.js` (no Crack button yet); graph node edges; the core rule widened;
`cracking_row_test.rb`; the golden compare.

C2, in order: `revealsFacts` stamping in `add_inventory_item!` and the earned set; the `grant_fact`
case in `process_flag_rewards` (forwarded as `set_global` is) and in the flag station's
`processRewardEvents`; the four state keys; `games#crack`, its route and policy; the grant and
`cracked_keyring_entries`; the `ops-cracker` scene and model, registered in `minigames/index.js`;
the Crack button; the scanner rule; the tests, feature scenario, playtest and live proof.

Files other plans also touch (agree the order with their owners):

- `lib/break_escape/credential_model.rb`, `app/models/break_escape/credential_keyring.rb`
- `app/models/break_escape/game.rb` (`add_inventory_item!`, `ACCESS_STATE_DEFAULTS`)
- `app/controllers/break_escape/games_controller.rb` (`games#crack`, `process_flag_rewards`),
  `config/routes.rb`, `app/policies/break_escape/game_policy.rb`
- `scripts/scenario-schema.json`, `scripts/validate_scenario.rb` (one hook line)
- `scripts/generate_dungeon_graph.rb`
- `public/break_escape/js/systems/keyring.js`,
  `public/break_escape/js/minigames/capture-log/signin-rows.js`, the remote-host text helper
  (`remote-host-text.js`) where it lists keyring kinds
- `public/break_escape/js/systems/social-intel.js` callers, the flag station minigame,
  `public/break_escape/js/minigames/index.js`
- `tools/playtest/lib/access_leak_scanner.rb`
- the test harness copy lists
- `README_scenario_design.md` (feature index) and `docs/ACCESS_AND_NETWORKS.md`

S7's own new files: `app/models/break_escape/ops_cracking.rb`, `scripts/validate_cracking.rb`, the
`ops-cracker` scene and model under `public/break_escape/js/minigames/ops-cracker/`,
`scenarios/test_ops_crack/`, and the three test files.

## 13. Log rows this feature writes

None. Cracking happens on the attacker's own machine, so it leaves nothing on the target to log.
Getting the hash is logged where it happens, by the plan that owns that move
(`credentials_harvested`, `share_folder_opened`). S7 stores no secret value outside the keyring:
the cracked password is read from `creds.password`, which the log module already registers as a
secret source, and the token is not a secret and is never stored. So S7 calls no
`OpsLog.register_secret_source`. A later change that stores a cracked value elsewhere registers
it.

## 14. Cross-plan requests

**Privilege and accounts plan (S5b).** Answers to its requests to S7:

- The `harvested` proof, a string keyed by the sign-in PC id (`"harvested": "<pcId>"`): agreed; S7
  reads it through `proof_kind` like any other proof.
- A record's `crack` is read when present, the account's habit otherwise: done (section 4).
- The username on the hash row: done (section 5).
- A second record of an account already cracked shows `cracked` with no Crack button: done.
- S5b builds after S7: agreed.
- The scene opens for any `hashId`, so the collect panel can launch it: yes.
- The graph edge from `admin@<pcId>` to the hash node, continuing to the password: yes (section 9).
- After a password reset the crack yields the scenario's password: confirmed (section 5).

Two requests to the privilege plan:

1. Its hash examples write `"account": { "npc": "<npcId>" }` (its lines 246-249 and 288). A
   registry entry's `account` is a string (`SCH:290`, and the credential model's account lookup),
   so these fail the schema. Please change them to `"account": "<npcId>"`.
2. Its guessable recipe example (line 289) gives `passwordPattern` only. A `guessable` crack needs
   `crack.facts`, 1 to 4 intel fact ids with server-visible sources, or the validator refuses it.
   Please add `facts` to that example and to its text at line 1302.

**Core plan.** S7 widens the `grants.credential` rule to accept `saved_connection` or `hash`, with a
test.

**Second-step and lock plans.** A cracked password is a first factor and meets a second step as any
other password does. It joins the second-step plan's list of credentials that keep the authored
value.

**Log rows plan.** S7 writes no rows and registers no secret source (section 13).

**Skin plan.** The crack scene sits outside the network view and has one look. If a crack ever
shows in the simulated command-line output, the skin plan should say what it wants. S7 can offer,
per run, from the `POST /crack` answer only: the record label and token, the fact labels picked, a
progress line while `running`, and the status.

**Sync deltas plan.** Add the four state keys of section 8 to its growth table when it is built.

**Intel and scenario authors.** A recipe fact that today comes only from dialogue, an object
action, an OSINT page or a mail highlight needs a second, server-visible source: a takeable item
with `revealsFacts`, a feed post, or a `grant_fact` flag reward (section 5 table).

## 15. Open questions for the user

1. **How should salt show in play?** The plan is written to (a).
   - (a) A salted record, once the right facts are picked, takes a real-time wait on the server
     (`crackSeconds`, default 60) and yields alone; unsalted records with equal passwords share a
     token and crack together. Shows both halves of the lesson: salt costs the attacker per record
     and stops one piece of work opening many.
   - (b) A run count: a salted record needs several Crack presses before it yields. No clock, but
     pressing a button again is a weak picture of extra work, and it says nothing about shared
     tokens.
   - (c) Batch only: no wait or count; salt shows only as unsalted records cracking together.
     Simplest, but a lone salted hash then looks no different from an unsalted one.

   **Recommendation: (a).**
2. **Should `common` also be a value of the NPC `password` habit?** Today it exists only on a hash
   record's recipe, for accounts with no person behind them. Options: (a) recipe only; (b) add it
   to the habit enum so a person can have a common password too. **Recommendation: (a)**: `strong`
   and `guessable` already cover people, and widening the habit touches the habit validator and
   every habit consumer for little teaching gain.
