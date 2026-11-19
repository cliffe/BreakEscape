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
  and a post's `fact` travels with it. These are the hooks for server-granted facts (section 5).
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
| C2 | `revealsFacts` on items and the server's earned-fact record; `POST /crack`; crack state; the cracked grant and its keyring entry; the `ops-cracker` scene and the Crack button on the hash row | M | `ops_crack_test.rb`: each class's outcome, refusals in order, the salted wait, the unsalted batch, a forged `se_intel_*` refused |

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

A social-feed post's existing `fact` field is the other server-visible source; it needs no new
field.

**The NPC `password` habit** is unchanged in shape. Its schema description changes from "No
run-time effect" to say the crack reads its class.

A scenario with no `hash` record and no `revealsFacts` is unchanged (section 10).

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

A `se_intel_*` global is never read. Per source, what an author does:

| Where the fact comes from today | Server-visible? | What the author does |
|---|---|---|
| An item the player takes, or a takeable file on a share or in a container | yes | add `revealsFacts` to the item |
| An item an NPC hands over (ink `give_item`, NPC `itemsHeld`) | yes, the inventory route checks the NPC held it | add `revealsFacts` to the held item |
| A flag reward | yes, if the reward is `give_item` | give an item carrying `revealsFacts` |
| A social-feed post with `fact` | yes (`feedRevealed`) | nothing |
| Ink dialogue, an object action or timer `grant_fact`, an OSINT browser page, a mail highlight | no, the browser grants it | for a fact a recipe needs: also have the NPC hand over an item carrying it, or put it on a takeable item or feed post. The dialogue grant may stay for the intel board |
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

## 6. Server route: `POST /crack`

Path `POST /games/:id/crack` (new route in `config/routes.rb`, new action
`games#crack`, new `crack?` policy method mirroring `sync_state?`).

**Params**: `hashId` (registry id of the held hash record); `candidate` — either
`{ facts: ["pet_name", "birth_year"] }` (fact ids only) or `{ reuseFrom: "<credId>" }` (a held
credential reference for the `reused` case). No words, no hash text, ever cross the wire inbound.

**Checks, in order** (refuse with a stable `reason`, never leaking the answer):

1. Policy + game load; else 403/404.
2. `hashId` is a `kind: "hash"` entry and its proof holds now; else `reason: "no_hash"` (same
   message as an unknown id, so holding is not probed).
3. Each submitted `facts[]` id is a fact the player holds (`se_intel_<factId>` true); any not held →
   `reason: "fact_not_held"`. A `reuseFrom` id must be a held credential; else `reason: "no_reuse"`.
4. Read the account's `password` habit. If `strong` → increment the run count, return
   `{ status: "nomatch", runs }` (a strong hash looks the same as a wrong guess on purpose; the
   lesson is delivered in the lab sheet and by never yielding).
5. If `guessable`: candidate matches iff the held facts cover `passwordPattern`. If they do not,
   return `{ status: "needMoreFacts", missingCount }` where `missingCount` is the count of pattern
   facts not yet held — never their ids. If they do, go to the salt gate.
6. If `reused`: candidate matches iff `reuseFrom` resolves (via `reuse_homes`) to the same source
   secret this account reuses. Match → salt gate; else `nomatch`.
7. **Salt gate**: increment the run count for this `hashId` in `player_state`. If `salted` and
   `runs < cost`, return `{ status: "running", runs, runsNeeded: cost }` (correct candidate, not yet
   released). Once `runs >= cost` (unsalted: `cost` is 1), grant and return
   `{ status: "cracked", account: {...}, credentialId }`.

**Responses**: `200` with one of `running | nomatch | needMoreFacts | cracked`. The `cracked`
body carries the account identity and the new keyring credential id, **not** the password string;
the password reaches the browser only afterwards through the keyring's normal serving, the same way
a captured password does.

**Grant on success**: the server adds an implicit-style keyring entry
`"<npcId>.password"`, `kind: "password"`, `source: "cracked"`, via the same builder family as
`implicit_keyring_entries` (`credential_keyring.rb:263-287`), so there is one password path.

## 7. What reaches the browser, and what never does

Reaches the browser:

- The hash **token** (opaque seeded string) once the record is held — it is not a secret, it is the
  puzzle input.
- Which facts the player holds (already shipped as `se_intel_*` globals).
- Per-run **result status** and, for `guessable`, a `missingCount` integer.
- After a successful crack, the recovered **password** — but only through the keyring, after the
  server has granted it, exactly as captured passwords are served today.

Never reaches the browser, before or during a crack:

- The `password` habit, `passwordPattern`, or any fact id the player does not hold (`missingCount`
  is a bare count).
- The correct candidate, the reuse source, or the password string, until the server decides
  `cracked`.
- `cost` / `salted` are shippable (they are puzzle framing, not answers); the per-run gate is still
  enforced server side so the client cannot shortcut it.

## 8. State and saved games

New synced state: `player_state["crackRuns"]`, a map `{ hashId: integer }` holding the run count per
hash record. Bound: at most one key per `hash` record, and hash records share the `MAX_ENTRIES = 64`
registry cap, so `crackRuns` is at most 64 small integers — a few hundred bytes. It is sent as a
**delta** on the existing `sync_state` path (the server writes the incremented count and emits only
the changed key), never re-sending the whole map. The run count persists across reload, so a salted
crack in progress resumes. No large or growing field is added.

The recovered password is **not** stored in `player_state`; it is a computed keyring entry derived
from the grant marker the server writes (consistent with captured passwords, which are also
computed, not stored in `player_state`). The grant marker is one id in an existing captured-accounts
structure (cross-plan with A15/S5b, section 14), not new growing state.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`): extend the `credentials` entry schema so `kind: "hash"`
is accepted with `account.npc` (string, must be an NPC id), optional `salted` (boolean), optional
`cost` (integer ≥ 1). Add the `hash_file` `contents` entry shape on `file_share` with `id`, `grants`
(a `credentials` key of kind `hash`) and `label`.

**Validator** (`scripts/validate_scenario.rb`, alongside the `check_credentials` routine): refuse a
`hash` record whose `account.npc` is unknown; refuse one whose account NPC has no `password` habit
(nothing to crack); warn when a `guessable` account's `passwordPattern` references fact ids that no
clue path can ever source (dead puzzle); refuse a `hash_file` whose `grants` names a missing or
non-hash credential. Flip `credential_model.rb` `hash` to `built: true` and give it
`connects: false` (a hash cannot be used to sign in — no pass-the-hash in this abstract model), so
`DEFAULT_ACCEPTS` is unchanged and a hash never admits a PC.

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`): the generator already draws `password`
habit edges (`:427-450`). Add: an edge from each hash source (share file / admin dump) to the hash
record, and from the hash record + the required facts to the recovered `password` credential, so the
graph shows cracking as a real dependency. `reused` reuses the existing `reuse` edges.

## 10. Effect on existing scenarios, and the proof

No existing scenario has a `kind: "hash"` credential, a `hash_file` content entry or a `crackRuns`
field, so behaviour is unchanged. The checks that prove it:

- A scenario with no hash record never reaches the new validator branches (they are keyed on
  `kind == "hash"` / `kind == "hash_file"`).
- Flipping `hash` to `built: true` only **adds** an accepted kind; no previously valid scenario
  becomes invalid and no previously invalid one is newly rejected by that flip alone.
- `SHIPPED_HABIT_KEYS` is untouched, so the bootstrap payload for every existing scenario is
  byte-identical (assert in a test that the bootstrap for `test_simple_success` is unchanged).
- `DEFAULT_ACCEPTS` is untouched (`connects: false`), so no PC starts accepting a new kind.

## 11. Tests

- **Server unit** (`test/models/break_escape/`): token is seeded and stable across reloads; the four
  habits (`strong` never yields; `guessable` yields only when pattern facts held; `reused` yields
  from a reuse source; `salted` needs `cost` runs); `missingCount` is a count only; grant creates a
  `password` keyring entry with `source: "cracked"`.
- **Controller** (`test/controllers/break_escape/ops_crack_test.rb`): `POST /crack` refusals in
  order (no_hash, fact_not_held, no_reuse), the running→cracked progression under salt, the policy
  gate, and a leak check that no response body contains the password before `cracked`.
- **JS** (`test/js/ops-cracker.test.mjs`): the scene renders rows with the reused helpers, submits
  fact ids only, and renders each server status without deciding anything itself. Add the new module
  to every test-harness copy list (D3/D5 rule) so `node` does not `ERR_MODULE_NOT_FOUND`.
- **Feature scenario** `scenarios/test_ops_crack/`: one strong, one guessable, one reused account, a
  salted and an unsalted hash, a share file and (when S5a lands) an admin dump. Dungeon graph and
  validator run clean.
- **Scripted playtest** through `window.__test`: obtain a hash, run crack attempts, assert what
  reached the browser (status + missingCount only, no password early) and what the server recorded
  (`crackRuns` incremented; keyring entry created on success).
- **Live browser proof** on the real path: obtain from a share, crack a guessable account, confirm
  the recovered password then signs in at a PC (ties to S5c).

## 12. Build steps and shared files

Files S7 touches that other plans also touch (coordinate order):

- `lib/break_escape/credential_model.rb` — flip `hash` built flag (also read by S5b/S3).
- `app/models/break_escape/credential_keyring.rb` — new grant builder beside `implicit_keyring_entries`
  (S5b touches the same file).
- `scripts/scenario-schema.json`, `scripts/validate_scenario.rb` — `credentials`/`resources` shapes
  (S1, S5a, S5b, S5c all edit these; serialise edits).
- `config/routes.rb`, `app/policies/break_escape/game_policy.rb`, the games controller — every ops
  stage adds a route + policy method here.
- `scripts/generate_dungeon_graph.rb` — shared with every habit/credential stage.
- Test-harness copy lists — shared with every stage adding a JS module.

S7-only new files: the `ops-cracker` scene + model under `public/break_escape/js/minigames/`, the
`test_ops_crack` scenario, and the three test files.

## 13. Log rows this feature writes (for S9)

| Event | Who | Where | When |
|---|---|---|---|
| `hash_obtained` | player identity | host/share the record came from | on grant of the hash record |
| `crack_run` | player identity | the hash record's account | each `POST /crack`, with status |
| `crack_yield` | player identity | the hash record's account | on the `cracked` result |

S7 calls the one shared log helper (S9); it does not own storage or reading.

## 14. Cross-plan requests

- **S5a (privilege / dump source).** S7 needs an admin-dump effect that grants a `hash` record. S7
  proposes: S5a's admin-on-host action writes a server-side marker (per host, per account) that a
  hash record's `proof` can read (a new proof form, e.g. `{ dumped: { host, npc } }`, or reuse an
  existing capture proof). Please confirm the marker shape and the admin check so S7's `proof`
  reads it. Until settled, S7 ships with the share-file source only.
- **A15 / S5b (keyring).** S7 grants a recovered password through the implicit-entry family with a
  new `source: "cracked"`. Please confirm the captured-accounts structure S7 writes the grant marker
  into, so the two password sources share one path and one `MAX_ENTRIES` budget.
- **S3 (technique cards).** If a technique is to yield a hash record, it grants the same
  `kind: "hash"` credential; no new mechanism. Flag if S3 wants a different shape.
- **S9 (log rows).** The three rows above.
- **S1 / N4 (shares).** S7 adds a `hash_file` `contents` entry on a `file_share`; it must pass the
  existing admission gate (`games#container`, 404 when not admitted). Please confirm N4 treats an
  unknown content `kind` as inert rather than erroring, so the new entry degrades safely.

## 15. Open questions for the user

1. **Hash record store: reserved `hash` keyring kind, or a separate top-level map?**
   Options: (a) activate the already-reserved `hash` keyring kind (`connects: false`) so the hash
   is a held credential and reuses the registry, cap and proofs; (b) a new top-level `hashes` map.
   **Recommendation: (a)** — it uses machinery that already exists and was reserved for exactly this,
   and keeps one registry. (b) duplicates the registry for no gain.
2. **Does salt cost game minutes, or only runs?** No server clock exists (D4 3.3). Options: (a) a run
   count, salted needs more runs (this plan); (b) wait for a game-time stage and charge minutes.
   **Recommendation: (a)** now; revisit if a clock lands. It is deterministic and needs no new
   subsystem.
3. **Should a failed `guessable` run reveal `missingCount`, or nothing at all?** Options: (a) a bare
   count (this plan) — nudges the player to gather more intel without naming which fact; (b) a plain
   fail with no count. **Recommendation: (a)** — it teaches the facts→password link without handing
   over the answer.
4. **Is "cracking never yields for strong" acceptable as a silent dead end, or should a strong hash
   give explicit feedback** ("this looks computationally infeasible")? Options: (a) silent `nomatch`,
   taught in the lab sheet; (b) a distinct `status: "infeasible"` after N runs. **Recommendation:
   (b)** — a distinct status after a couple of runs teaches the lesson in-game without revealing the
   password, at the cost of confirming the habit is strong (acceptable: strength is not a secret).
