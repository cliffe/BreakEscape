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
looked up in a precomputed list. A salted record shows its own token, and every complete pick
against it takes a short real-time wait on the server before the answer, right or wrong; a right
pick then yields that record alone. The wait defaults to 60 seconds of real time per guess. The
lesson: salt makes each guess cost work per record and stops one piece of work from opening many
hashes; it does not save a guessable password. Cracking costs no game minutes. A real-time wait
is used because the two simpler pictures fall short: a count of extra Crack presses is a weak
picture of work and says nothing about shared tokens, and showing salt only through unsalted
records cracking together makes a lone salted hash look like an unsalted one.

An author can grade a hash record `easy`, `medium` or `hard` (section 4) or, for every record of
a person's account, through the NPC's `passwordDifficulty`; the record's grade wins. The grade sets the
record's salt and wait and how many facts a guessable recipe is expected to use, and any field the
author writes overrides it. It never lets a password fall without the right facts.

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
  unknown kind, and `app/models/break_escape/credential_login.rb:180-181` refuses a non-connecting kind, so a hash can
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
  `add_inventory_item!` (`GAME:719`): the inventory route (`GC:1441`) and flag-reward items
  (`process_item_reward`, `GC:4006`). The inventory route's checks are best-effort sanity checks:
  an NPC give passes when the NPC has been met and holds the item (`GC:3449-3475`;
  `npc_given_items` records gifts afterwards, `GC:1444-1446`, and gates nothing), a room item in an
  unlocked room passes without a visit (`GC:3431-3438`), and a **declared grant** (a `give_item`
  run by a timer or an object action, `lib/break_escape/declared_grants.rb:7-21`) passes with no
  trigger check at all (`GC:3384-3399`). A notepad or decor cup passes at once and is stored with
  the client's own `id` (`GC:3361-3371`, `GC:3315-3333`). Served
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
  the server on take from its own definition (`GAME:772-773`), found by `restamp_item_credential!`
  (`GAME:749-773`), which skips notepads and decor cups and then looks the definition up by the
  stored item's `id`, keeping it when the type agrees; it has no check for an id the client chose.
  `item_definition` (`CM:210-250`) alone matches on id only and returns the first match. One stored
  copy can carry a client-chosen id: an NPC drop (`add_object` with `sourceNpcId`) of a held item
  that has no id keeps the client's id (`GAME:1135-1137`, held item found by type and name at
  `GAME:2268-2283`), and a later take of that id is stored as that object (`GC:3606-3614`). The `held`
  proof matches the stamp identity-strict (`CK:42-63`); `VS:7537-7558` checks the cross-reference.
  A share file is taken through the same path (`app/models/break_escape/network_access.rb:1735-1745`).
  A hash on a share needs no new content kind. `lib/break_escape/item_identity.rb:28-32`
  `FORGEABLE_ITEM_FIELDS` is the single list of fields stripped from a client-built inventory item
  and an unsourced room add.
- **Time.** No game-minute clock exists. The server has real time: `server_now`
  (`app/models/break_escape/npc_frustration.rb:60`), used by `credentialClock` and token expiry
  (`CK:97-137`); it returns float seconds (`npc_frustration.rb:60-62`). `GET /keyring` sets
  `Cache-Control: no-store` (`GC:1879`). Server routes take a row lock for read-modify-write
  (`CK:76`).
- **The keyring digest.** `keyring_rev` (`CK:238-241`) digests `entries` and `captures`, leaving
  out a token's `expiresInS` so a running token does not change it. When the client's `rev`
  matches, `GET /keyring` answers `{ rev, unchanged: true }` plus the live `expiresInS` values from
  `keyring_live_expires` (`CK:89-95`, `GC:1880-1885`).
- **The flag-lock answer.** A flag-locked object's unlock answer carries `response[:rewards]`
  (`GC:1354`), but no client code reads it; only the flag station handles rewards
  (`flag-station-minigame.js:625-626`, `:926-930`, `:1023`).

## 3. Build stages

S7 lands after S6 and S8a and before S5b, in the outline's order S6, S8a, S7, S5b, S5c (S5b's
collect yields only hashes, so it needs this stage). S7 depends on no later stage; it uses S3's
`technique_card` proof and the core refusal list. Each stage is shippable and tested alone.

| Stage | What | Size | Named test that proves it |
|---|---|---|---|
| C1 | `hash` kind built (`connects: false`); `crack` recipe on the record, with `difficulty` and its table `lib/break_escape/crack_difficulty.rb`, and the optional NPC habit parameter `passwordDifficulty`; schema; `scripts/validate_cracking.rb` and `validate_cracking_test.rb`; the hash keyring row (server and client, no Crack button yet); the token; the dungeon graph node and edges; the core plan's `grants.credential` rule widened to `hash` | S | `cracking_row_test.rb`: taking the share file lists a hash row with token, username and `status: "ready"`, and no password; a technique grant lists the same row |
| C2 | `revealsFacts` on items, the `grant_fact` flag reward, and the server's earned-fact record; `POST /crack`; crack state; the cracked grant and its keyring entry; the `ops-cracker` scene and the Crack button on the hash row | M | `ops_crack_test.rb`: each class's outcome, refusals in order, the salted wait, the unsalted batch, a forged `se_intel_*` refused |

After C1 a scenario can hold a hash with no way to crack it (inert, visible). After C2 it can be
cracked. The S5b collect is the privilege plan's stage and adds only its `harvested` proof kind;
this plan's row, scene and route serve it unchanged. The `harvested` proof, and the
`accountOnly` NPC field of S5c, do not exist at S7 time; this plan's examples and feature scenario
use neither, and mention them only to describe those later stages.

## 4. Scenario fields

**The hash record** is a `credentials` entry of kind `hash`. Fields: `kind`, `account` (the
account holder's NPC id, a string, as every registry entry), `proof` (exactly one string-valued
proof, as today), optional `salted` (boolean, default false or the difficulty's), optional
`crackSeconds` (integer 10 to 600, salted only, default 60 or the difficulty's: the server-timed
wait per guess), and `crack` (the recipe, below). The
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

**The recipe, `crack`.** An object with up to four keys:

- `password`: the class, one of `strong`, `guessable`, `reused`, `common`. Optional when the
  account NPC has a `password` habit (the habit's class is used); **required** when it has none (an
  account holder with no `password` habit, such as a shared administrator; S5c's `accountOnly`
  accounts will be one such case). `common` exists only here, not on the habit: `strong` and
`guessable` already cover people, and widening the habit would touch the habit validator and every
habit reader for little teaching gain. When both are
  present and differ, the record's class wins for the crack and the validator warns.
- `facts`: for `guessable`, the `social.intelFacts` ids the password is made from (1 to 4, no
  repeats, order not significant), written as the bare id, never with the `se_intel_` prefix.
  Required for `guessable`, refused on other classes.
- `passwordPattern`: optional, the same meaning as the habit's parameter (the object id of the
  readable pattern clue). This plan's validator runs the habit's backing check on it (section 9),
  so a record with no habit is checked as a habit would be. This plan owns every rule on the
  `crack` recipe.
- `difficulty`: optional, `easy`, `medium` or `hard` (below).

**Difficulty, `crack.difficulty`.** An author's shorthand that grades one stored copy of a
password, so missions across a campaign grade cracking the same way. Each value sets defaults; a
field the author writes on the record wins.

| Difficulty | `salted` default | `crackSeconds` default | Guessable `facts` expected |
|---|---|---|---|
| `easy` | false | none (unsalted) | 1 |
| `medium` | true | 60 | 2 |
| `hard` | true | 120 | 3 or 4 |

- **It never makes a crack easier to win.** It supplies no facts and does not change the class: a
  `strong` record is a dead end at every difficulty, and a `guessable` one still needs every fact
  in `crack.facts`, each earned through a server-visible source, and an exact pick. The fact count
  is an authoring expectation, checked by a validator warning (section 9); the server reads only
  the authored `crack.facts`.
- **Resolution.** The grade is the record's own `crack.difficulty` when written, else the account
  NPC's `passwordDifficulty` (below), else none. `salted` is the record's own value when written,
  else the grade's, else false. `crackSeconds` is the record's own value when written, else the
  grade's when the record resolves salted, else 60. One table,
  `lib/break_escape/crack_difficulty.rb`, with `CrackDifficulty.resolve(record, npc)` returning
  `{ salted, crack_seconds }` (`npc` is the account's NPC, or nil for an `accountOnly` account),
  serves the server and the validator, so they cannot disagree. For an unknown grade (from the
  record or from the NPC), `resolve` returns nil: the keyring row lister lists no hash row for
  that record (no token, no `salted` marker) and `POST /crack` answers `no_recipe`, so a
  hand-edited row never shows a shared unsalted token.
- **Where it lives.** Two places, both author-side. On the hash record's recipe, `crack.difficulty`
  grades that one stored copy, and two records of one account (an old unsalted export and a salted
  store) can differ. A person's account is graded through its hash record like any other: a
  `strong` or `reused` habit needs nothing else, and a `guessable` habit also needs `facts` on the
  recipe; an `accountOnly` account also needs `crack.password`. To grade a person's password once,
  for every record of that account, write `passwordDifficulty` (`easy`, `medium` or `hard`) in the
  NPC's `habits` beside `passwordPattern`. It is a habit **parameter**, not a habit: it joins
  `NpcHabits::PARAMETERS` (`lib/break_escape/npc_habits.rb:29`, now `%w[passwordPattern]`), which
  `NpcHabits.sources` already skips (`:114`), so no habit reader changes and the list of habits
  (`strong`, `guessable`, `reused`) stays as it is. A record's own `crack.difficulty` wins over
  the NPC's `passwordDifficulty`. Neither supplies facts: they come only from the authored
  `crack.facts`. The record's recipe is also what adds `common`.
- **It stays server-side.** `credentials` is stripped from the bootstrap and no answer carries the
  value. The player meets its effects: the salt marker, the wait, and how many facts are missing.

```json
"dana_hash": { "kind": "hash", "account": "dana",
               "proof": { "held": "dana_hash_file" },
               "crack": { "difficulty": "hard",
                          "facts": ["dana_dog_name", "dana_birth_year", "dana_team_name"] } }
```

This record is salted with a 120-second wait per guess and needs three facts. Writing
`"salted": false` on it keeps the three facts and removes the wait.

A record with no `crack` at all is allowed only when its account has a `password` habit whose
class is not `guessable` (a guessable crack needs `facts`). C2 example, a shared administrator
account with no person behind it and no `password` habit, its hash yielded by a technique:

```json
"deskadmin_hash": { "kind": "hash", "account": "deskAdmin",
                    "proof": { "technique_card": "desk_backup_finding" },
                    "crack": { "password": "common" } }
```

**Facts the server can see: `revealsFacts` on an item** (C2). An optional array of
`social.intelFacts` ids (bare ids, no `se_intel_` prefix) on an item definition (`definitions.item`).
When the server adds that item to the inventory through a server-checked path (taken from a room,
container or share, given by an NPC that holds it, or given as a flag reward), it records the facts
as earned, and the client grants them through `grantFact` so the intel board agrees. A start item's
facts count from the first frame. An item that a timer or an object action hands over (a declared
grant) earns nothing, because the server accepts it with no trigger check; the validator refuses
`revealsFacts` on such an item, and on a notepad or decor cup, whose ids the client chooses.

```json
{ "type": "notes", "id": "dana_vet_card", "name": "Vet reminder card", "takeable": true,
  "text": "Biscuit is due a booster.", "revealsFacts": ["dana_dog_name"] }
```

A social-feed post's existing `fact` field is a second server-visible source; it needs no new
field.

**Facts the server can see: a `grant_fact` flag reward** (C2). A new server-handled entry in a
flag station's `flagRewards`, `{ "type": "grant_fact", "fact": "<intelFactId>" }`, the same shape
as the `grant_fact` action. It counts once the server has accepted that flag (a VM flag the server
checks against the scenario's list, or a flag lock's server-checked answer): `process_flag_rewards`
writes the fact into `player_state['earnedFacts']` at that moment. The server also forwards the
reward to the browser as it forwards `set_global`. The flag station then calls `grantFact`, so the
intel board shows the fact. A flag lock's unlock answer is not read by any client code today, so a
fact from a flag lock shows only as a chip in the cracking scene (served in `crackFacts`), not on
the intel board; the crack works the same either way.

```json
"flagRewards": [
  { "type": "grant_fact", "fact": "dana_birth_year", "label": "HR record recovered" }
]
```

Nothing else grants a fact the crack reads. A fact granted in ink dialogue, by an object action or
timer (directly, or on an item it hands over), by an OSINT page, by a mail highlight, or by a
`set_global` reward writing `se_intel_<id>` is reported or claimed by the browser, and the crack
ignores it.

**The NPC `password` habit** is unchanged in shape. Its schema description changes from "No
run-time effect" to say the crack reads its class. The one addition is the optional habits
parameter `passwordDifficulty` (section 4), which is not a habit and is read only to grade a crack.

A scenario with no `hash` record, no `revealsFacts` and no `grant_fact` reward is unchanged
(section 10).

## 5. Engine behaviour (server then client)

### Server

New module `app/models/break_escape/ops_cracking.rb` (a concern on `Game`, as `CredentialKeyring`
is). It reads only `scenario_data`, `player_state` and the server clock. It calls no controller
code: facts from flags are stamped by the controller when the flag is accepted, and the module
reads the stamp.

**The token.** Derived on each answer, never stored: an HMAC (key derived from the app's
`secret_key_base` with a fixed purpose string, never sent) over the game id plus, for an unsalted
record, the account's `creds.password`, or, for a salted record, the record id. The output is 24
characters from a 32-letter alphabet, shown in groups of four. It carries no information a client
can use: it cannot be inverted or recomputed without the server key, and it differs between games.
Two unsalted records whose passwords are equal show the same token in the same game; salted
records never match. This is the visible meaning of salt. "Salted" here and below always means the
value `CrackDifficulty.resolve` gives (section 4), never the raw field alone.

**Earned facts.** A fact counts for a crack only when the server has seen the event that reveals
it. The set is the union of:

1. `player_state['earnedFacts']`, written in two places:
   - by `add_inventory_item!`, from the item definition's `revealsFacts`, only when the caller
     passes `fact_source: true`. The keyword defaults to false, so a new caller stamps nothing until
     it opts in. The inventory route passes true unless the add was accepted as a declared grant
     (`@collectible_location[:type] == 'grant'`), `process_item_reward` passes true, and so does the
     playtest seeder's replay of a flag's `give_item` reward (`tools/playtest/new-game.rb:416`).
     The facts are read from the copy the add stores, `(item['scenarioData'] || item)['revealsFacts']`,
     by a type check of its own (the stamp refuses `ALWAYS_ALLOWED` and `DECOR_CUPS` types itself;
     the existing skips for them sit inside `restamp_item_credential!` and cover only the
     credential). The stamp runs inside the not-already-held branch of `add_inventory_item!`,
     before its existing `save!`, so one save covers the item and its facts and a rejected duplicate
     add earns nothing. It never looks a definition up by the item's `id`. That copy is always one the server built: the scenario object
     (`canonical_inventory_item`, `GC:3315-3333`), an NPC's held item (`GAME:1135`), the player's
     held copy (`GAME:1154`) or a station's item (`GC:4003`); every client body loses
     `revealsFacts` on the way in (`FORGEABLE_ITEM_FIELDS`, below). So an NPC drop stored under a
     client-chosen id carries only the facts of the item the NPC really held. This covers a take,
     an NPC give and a flag reward's item. The same drop path can re-stamp a `credential` through
     the id lookup; this rule does not depend on that being fixed.
   - `Api::GamesController#inventory` is unrouted and passes no `fact_source`, so it stamps nothing.
   - by `process_flag_rewards`, for each `grant_fact` reward of a flag the server has just accepted
     (section 4), under the save it already makes (`GC:3987-3989`), through one model method,
     `Game#stamp_earned_facts!(ids)`, which writes only ids that name a `social.intelFacts` entry.
     The playtest seeder (`tools/playtest/new-game.rb:410-437`), which replays a seeded flag's
     rewards by hand, calls the same method for a `grant_fact` reward instead of listing it as
     client-only, so a flag-seeded playtest earns the fact. On the flag-lock path a transient
     Hacktivity error rolls the unlock back before rewards run (`GC:1340-1344`, rewards at
     `:1350-1354`), so that case leaves no stamp.
2. The `revealsFacts` of every `startItemsInInventory` definition, read from `scenario_data` alone,
   with no inventory read. A start item is the player's from the first frame, so it needs no proof
   of holding, and a client-built item can never stand in for one.
3. The `fact` of every social-feed post the server has served (`feedRevealed`), with a leading
   `se_intel_` removed once, since feed posts may carry either form.

So exactly three kinds of server event grant a fact: an item entering the inventory through a
server-checked path (take, NPC give, `give_item` flag reward) or held from the start; a feed post
the server serves; a flag the server accepts whose rewards include `grant_fact`. A `se_intel_*`
global is never read, and no outcome the browser reports or claims (ink, object actions, timers,
items they hand over, a `set_global` reward) counts.

These are the server's existing checks, and some are sanity checks rather than proof. An NPC give
passes when the player has met the NPC and the NPC holds the item; the conversation that hands it
over is not seen. A room item in an unlocked room passes without a visit. That is the cheat policy's
allowance for dialogue-gated steps. An author who needs a hard gate puts the fact on an item in a
container behind a lock, on a share file, or on a flag reward. Per source, what an author does:

| Where the fact comes from today | Server-visible? | What the author does |
|---|---|---|
| An item the player takes, or a takeable file on a share or in a container | yes; a room item passes the existing room check, a locked container or a share is a hard gate | add `revealsFacts` to the item |
| An item an NPC hands over (ink `give_item`, NPC `itemsHeld`) | best effort: the inventory route checks the NPC has been met and holds the item, not that the conversation happened; the item must be takeable | add `revealsFacts` to the held item and make it takeable |
| A start item (`startItemsInInventory`) | yes, read from the scenario | add `revealsFacts` to the start item |
| A flag reward | yes, once the server accepts the flag | add a `grant_fact` reward, or give an item carrying `revealsFacts`; a `set_global` reward of `se_intel_<id>` does not count |
| An item a timer or object action hands over (`give_item` outside ink: a declared grant) | no, the browser claims it and the server checks no trigger | the validator refuses `revealsFacts` here; put the fact on a takeable item, a takeable NPC held item or a flag reward |
| A notepad or decor cup | no, the client chooses its id | the validator refuses `revealsFacts` here |
| A social-feed post with `fact` | yes (`feedRevealed`) | nothing |
| Ink dialogue, an object action or timer `grant_fact`, an OSINT browser page, a mail highlight | no, the browser grants it | for a fact a recipe needs: also have the NPC hand over an item carrying it, or put it on a takeable item, a feed post or a flag reward. The dialogue grant may stay for the intel board |
| A read-only poster or notice the player cannot take | no (reads are not recorded) | make it takeable, or add a takeable copy |

`revealsFacts` joins `FORGEABLE_ITEM_FIELDS` (`lib/break_escape/item_identity.rb:28-32`), so a
client-built inventory item and an unsourced room add both lose it. The stamp reads the stored
copy, so this strip is what keeps a client body from carrying facts in. The change is additive: the list keeps its
current fields and any other plan's additions (the lock plan adds `secondStep`).

The validator refuses a recipe fact with no server-visible source (section 9), so this is found at
authoring time.

**The class.** `crack.password` if present, else the account NPC's `habits.password`. Fails
closed: no class (an old or hand-edited game row whose habit is gone), an unknown value, an
unknown `crack.difficulty`, or an account with no `creds.password` answers `no_recipe` and records
nothing.

**Who holds a password.** One predicate, `password_held_for?(npcId)`, answers "the player already
holds this account's password" everywhere this plan asks it. It is true when the account is in
`crackedAccounts`, or the keyring lists, for the account, a capture entry (whether or not
`revealSecret` attaches the value) or a `registry` `password` entry whose proof holds (these never
carry a value, `CK:330-343`). The MFA plan's implicit `<npcId>.reset` entry does not count: it
holds the new password, not the one the hash was made from, so a reset neither marks the old hash
`cracked` nor makes a `reused` crack hit on another account whose password equals the old one. A
test row at S8b time (section 11) asserts both. It is used by the already-cracked
test, by the `reused` comparison, by the hash row's `cracked` status, and by the one-row rule of
the grant. Holding is the test, not seeing the value.

**One run** (inside `with_lock`, in `games#crack`):

- **Already cracked** (`password_held_for?` the account): answer `cracked` again, change nothing.
  This is checked before the class and before the pick (section 6), so a request for a held
  account answers `cracked` whatever it picks.
- **strong**: increment `crackRuns[hashId]` up to 2. Answer `nomatch` on the first run and
  `infeasible` from the second. Salt does not change this: a salted `strong` record answers at once,
  so its first press shows the class one press before a salted record of another class would. That
  tell is accepted, since the class is not a secret in play (section 7).
- **common**: a hit.
- **guessable**: if the earned set does not cover `crack.facts`, answer `needMoreFacts` with
  `missingCount` = how many recipe facts are not yet earned; the submitted pick is not compared, so
  the answer says nothing about which earned facts matter. If the earned set covers the recipe, the
  pick is complete and is compared: equal to `crack.facts` as a set is a hit, any other pick a miss.
- **reused**: the pick is ignored. A hit when, for some other account that `password_held_for?`,
  its `creds.password` equals this account's `creds.password`. Else a miss.

**Salt.** On an unsalted record the verdict is given at once: a hit grants this record and every
other held, unsalted `hash` record whose password is equal (the same token); a miss answers
`nomatch`. On a salted record every complete run waits, hit or miss, so the instant answer never
tells the player whether the pick was right. The run stores `crackStarted[hashId] = { "at":
server_now, "hit": true|false }` (the outcome, never the pick) and answers `running` with
`readyInSeconds`. While the wait runs, further posts answer `running` and change nothing; a new
pick is not read. Once the resolved `crackSeconds` have passed, the next post gives the verdict: a hit grants
that record alone; a miss answers `nomatch` and deletes the `crackStarted` entry, so the next pick
starts a fresh wait. Each wrong guess against a salted record costs a full wait, which is the cost
salt puts on the attacker. Replaying a request gains nothing, and a reload resumes the wait from
the stored time.

When `readyInSeconds` reaches 0 the record stays `running` with `readyInSeconds: 0` until the next
post. The open scene posts once by itself when its countdown ends and shows the verdict; the
Sign-ins row reads "Ready to finish" and keeps its Crack button, which posts with no pick.

**The grant.** Appends the account id to `player_state['crackedAccounts']`. A new builder,
`cracked_keyring_entries`, beside `implicit_keyring_entries` (`CK:266`), lists one entry per
cracked account: id `"<npcId>.cracked"`, `kind: "password"`, `source: "cracked"`, the account
block with username, label "Cracked", and `password` from the scenario's `creds.password`, always
attached. A crack recovers the plain text; there is no `revealSecret` equivalent (section 7). One
password row per account: when a capture entry for the same account carries the `password` value,
the cracked entry is left out; when the capture entry carries none (`revealSecret` not true), the
capture entry is left out and the cracked entry, which carries the value, is listed. The distinct
id means the two builders never clash on `keyringGained` or the client's row keys. After a password
reset (S8b) the crack still yields the scenario's password, stale on purpose: the hash was of the
old one.

**The hash row** (a new branch in `registry_keyring_entries`): `id`, `kind: "hash"`, `source:
"registry"`, the account block (display name and username), `label`, `token`, `salted`, and
`status`: `ready`, `running` (with `readyInSeconds`), `infeasible`, or `cracked`. `cracked` comes
from `password_held_for?` the account, so a row whose password the player holds from any source
reads `cracked`. No routes, no `connectsTo`, no password. When at least one hash row is listed, the
keyring answer also carries `crackFacts`: the earned fact ids (section 7).

**The keyring digest.** `crackFacts` is part of what `keyring_rev` digests, so a newly earned
fact changes `rev`. It is added only when the answer carries it: `keyring_rev` digests
`[digested, captures]` exactly as today (`CK:238-241`) when there is no `crackFacts`, and
`[digested, captures, crackFacts]` when there is. A third element, even `nil` or `[]`, would change
the digest, so this keeps `rev`, and the golden `GET /keyring` compare, unchanged for every
scenario without a hash row. A hash row's `readyInSeconds`
is left out of the digest, as a token's `expiresInS` is, so a running wait does not change `rev`
every second. A sibling of `keyring_live_expires`, `keyring_live_crack_waits(entries)`, returns
`{ hashId => readyInSeconds }` for each `running` row, and the `unchanged` answer carries it as
`readyInSeconds` when it is not empty. A change of `status` still changes the digest.

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
  when `status` is `ready` or `running` (a `running` row at `readyInSeconds: 0` reads "Ready to
  finish"); a `cracked` row shows the account's password row beside it. The client counts a
  running row down from `readyInSeconds`, refreshed from the `unchanged` answer.
- **`revealsFacts` on the client.** When an item carrying `revealsFacts` enters the inventory, the
  client calls `grantFact` for each id, so the intel board and notes match what the server stamped.
  `processRewardEvents` in the flag station (`minigames/flag-station/flag-station-minigame.js:1023`)
  gains a `grant_fact` case that calls `grantFact`; the server, not that call, makes it count.

## 6. Server route: `POST /crack`

Path `POST /games/:id/crack`: a new route in `config/routes.rb`, action `games#crack`, policy
method `crack?` mirroring `sync_state?`.

**Params** (snake_case): `hash_id`, the registry id of a hash record (a string matching the
registry id pattern, `CM:40`); `facts`, an array of 0 to 4 strings, each 1 to 64 characters. Fact
ids are not held to the registry pattern (the schema puts none on `social.intelFacts` keys, and
shipped scenarios use ids such as `staffId`); check 6 does the rest. A fact id is compared exactly,
so an `se_intel_`-prefixed id answers `fact_not_held`. The body is capped at the route's size limit. There
is no reuse parameter: a `reused` run ignores the pick. No password, word or token ever travels
inbound.

**Checks, in order.** Each refusal is `{ success: false, reason: "<code>" }`:

1. Policy and game load: 403 or 404, as every game route does today.
2. `bad_request` (400): a missing `hash_id`, one that is not a string or is longer than 200
   characters, `facts` not an array, more than 4 entries, or an entry that is not a string of 1 to
   64 characters.
3. `not_found` (404, the core list's code for a 404): a `hash_id` that is a string but not of the
   id form, an unknown id, an id that is not a `hash` record, or a hash record whose proof does not
   hold now. All answer the same body, so holding cannot be probed; this is the core plan's rule
   for every ops route.
4. Already cracked (`password_held_for?` the account): `200` with `status: "cracked"`, whatever the
   pick, and nothing changes.
5. `no_recipe` (422): the class does not resolve (section 5).
6. `fact_not_held` (422): any picked id is not in the earned set. An id that names no fact at all
   answers the same.
7. The run (section 5), inside `with_lock`.

**Success** is `200 { success: true, status, runs?, missingCount?, readyInSeconds?,
credentialIds? }`, with `status` one of `nomatch`, `infeasible`, `needMoreFacts`, `running`,
`cracked`. `runs` comes with `strong`; `missingCount` with `needMoreFacts`; `readyInSeconds` with
`running`; `cracked` carries the account id and the new keyring ids (`"<npcId>.cracked"`, more than
one for an unsalted batch), never the password, which the browser reads afterwards from
`GET /keyring` as it reads any other. Every answer sets `Cache-Control: no-store`.

The refusal codes are a closed list: `bad_request not_found no_recipe fact_not_held`. The core
plan builds the shared list `test/fixtures/files/ops_refusal_codes.json` and the client's
`REFUSAL_TEXT` table before S7. S7 adds `no_recipe` and `fact_not_held` to the file and gives each
a line in `REFUSAL_TEXT` ("This hash can't be cracked." and "You haven't learned that yet.");
`bad_request` and `not_found` are already there. The core plan's node test, which checks that
every listed code has a `REFUSAL_TEXT` line, then covers them.

## 7. What reaches the browser, and what never does

Reaches the browser, on the hash row in `GET /keyring` or in a `POST /crack` answer:

- The token, `salted`, the account's display name and username, and `status`.
- `missingCount`, a bare count of recipe facts not yet earned.
- `readyInSeconds` while a salted crack runs.
- `crackFacts`: the ids of facts the server counts as earned, so the scene offers only those.
- The password, only after the grant, as the `password` of the `"<npcId>.cracked"` keyring entry.
  A crack always shows the plain text, even in a scenario whose `social.captures.revealSecret` is
  not true. A `reused` crack can therefore show a password equal to one a capture holds hidden;
  the validator warns when that can happen (section 9).

Never reaches the browser:

- The recipe: `crack.facts`, `crack.passwordPattern`, `crack.difficulty`, and which earned facts
  the recipe uses.
- On a salted record, whether a pick was right, until its wait ends.
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
| `earnedFacts` | array of fact ids, grow-only | `add_inventory_item!` adds, with `fact_source: true`, an item with `revealsFacts`; or a flag the server accepts with a `grant_fact` reward | ids from authored `revealsFacts` and `grant_fact` only; at most 64 |
| `crackRuns` | `{ hashId => integer }` | a `strong` run | value capped at 2; keys only registry hash ids |
| `crackStarted` | `{ hashId => { "at": seconds, "hit": boolean } }`, `at` in `server_now` float seconds | a complete run on a salted record with no wait running; deleted when a miss's wait ends | at most 64; keys only registry hash ids |
| `crackedAccounts` | array of NPC ids, grow-only | a grant | at most 64 |

Feed-post facts and start-item facts are not copied in: the server reads them from
`feedRevealed` and `scenario_data`. `crack.difficulty` adds no key: it is resolved from
`scenario_data` on each answer, and so is the NPC's `passwordDifficulty`. A saved game from before C2 has no flag facts stamped, which
loses nothing, since no shipped scenario has a `grant_fact` reward. The token is never stored. The
password is never stored: the cracked keyring entry reads `creds.password` from the scenario each
time.

On reload the hash row comes back with its status from these keys, so a salted wait in progress
resumes. A saved game from before S7 has none of the keys and reads them as empty. The four keys
follow the sync deltas plan's state rules (`SYNC_DELTAS_PLAN.md` section 11; section 14 here).
`bin/ops-golden-compare` strips the new
keys while empty, so unchanged scenarios compare equal.

## 9. Validator, schema and dungeon graph

**Validator.** A new file, `scripts/validate_cracking.rb`, defining `check_cracking(json_data)`.
It is hooked by two lines in `scripts/validate_scenario.rb`, as the core plan hooks its own file: a
`require_relative 'validate_cracking'` beside `require_relative 'validate_network'` (`VS:26`), and
`run.call('check_cracking') { check_cracking(json_data) }` beside `check_credentials` (`VS:8968`).
Its rules, each an error unless marked:

- A hash record's `account` names an account holder.
- The class resolves: `crack.password`, or the account's `password` habit. The rule "the account
  needs a `password` habit" applies only to a record with no `crack.password`.
- A `guessable` crack has 1 to 4 `facts`, no repeats, each a `social.intelFacts` id with a
  server-visible source. Otherwise the error reads: "fact `<id>` must come from an item the server
  sees the player get (a takeable item, a share or container file, a takeable NPC held item, a
  flag reward item or a start item), a feed post or a `grant_fact` flag reward". A source counts
  only when it is one of: an item with `revealsFacts` naming the fact that is a takeable room
  object or container content, a takeable share or PC file, a takeable item in an NPC's
  `itemsHeld` (the inventory route refuses a non-takeable item from any location, NPC included,
  `GC:3415-3421`), a flag station's
  `itemsHeld` named by a `give_item` reward, or a `startItemsInInventory` entry; a feed post whose
  `fact` is it; or a `grant_fact` entry in some station's `flagRewards`.
- `revealsFacts` on an item that sits on a declared-grant path (`DeclaredGrants.for`: a
  `give_item` in a timer, `triggerOnInteract`, `onInteract.actions`, `completionActions` or
  `conditionalActions`) is refused: "a timer or object action hands this item over, so the server
  cannot see the player earn its facts". So is `revealsFacts` on a notepad or decor-cup type.
- An item with `revealsFacts` and no `id` is refused: "an item with `revealsFacts` needs an `id`".
  The client's `grantFact` on entry and the dungeon graph's edge both need a stable identity.
- Two item definitions with the same id, either carrying `revealsFacts`, are refused, so the
  client and the graph cannot confuse them (`item_definition` returns the first match).
- `facts` on a class other than `guessable` is refused.
- Warning: the record's `crack.password` differs from the account's habit.
- `crack.passwordPattern` gets the habit validator's checks (`scripts/validate_npc_habits.rb`,
  using `lib/break_escape/npc_habits/clues.rb` at authoring time only, as its header allows), with
  the same severities: an error when the pattern names no object (as `:135-138`); a warning when
  the pattern does not back the password (as `:267-277`; the password comes from the account's room
  NPC, an `accountOnly` one included, and the check is skipped when none has `creds.password`); a warning on `passwordPattern` with a
  class other than `guessable` (as `:257-258`). The crack's yield rests on `crack.facts`, not on
  the readable clue, so an unbacked clue weakens the teaching but does not break the puzzle.
- Warning: a `reused` crack whose `creds.password` equals no other account's, no registry
  `password` entry's account's and no capture target's `creds.password`, so the crack can never
  yield.
- Warning: a scenario whose `social.captures.revealSecret` is not true has a hash record whose
  account's `creds.password` equals a capture target's, so a crack would show a password the
  capture hides.
- `crackSeconds` only on a record that `CrackDifficulty.resolve` gives as salted (its own
  `salted: true`, or a `medium` or `hard` grade with no `salted: false`; the grade is the record's
  `crack.difficulty`, else the NPC habit `passwordDifficulty`, else none), and within 10 to 600.
- `crack.difficulty` is one of `easy`, `medium`, `hard`; any other value is refused.
- `habits.passwordDifficulty` (checked in `scripts/validate_npc_habits.rb`, beside the
  `passwordPattern` checks) is one of `easy`, `medium`, `hard`; any other value is an error. A
  warning when the NPC has no `password` habit: "passwordDifficulty has no effect without a
  password habit".
- Warning: a `difficulty` (the record's, or its account's `passwordDifficulty`) on a record whose
  class is `strong`: "difficulty has no effect on a strong password; it is a dead end at every
  grade". The band warning below stays silent for it.
- Warning: a `guessable` recipe whose number of `facts` is outside its difficulty's band (`easy` 1,
  `medium` 2, `hard` 3 or 4): "difficulty `hard` expects 3 or 4 facts; this recipe has 1". A
  warning, not an error, because the author's list is the override. No warning on a record with no
  difficulty, or on a class other than `guessable`.
- `connectsTo` on a hash record is refused, and so is `accepts: ["hash"]` on a sign-in policy.
- Every `revealsFacts` id, every recipe `facts` id and every `grant_fact` reward's `fact` names a
  `social.intelFacts` id, written bare: an `se_intel_` prefix in these three fields is refused.

Inside `check_credentials`, only two changes: the unbuilt-kind message at `VS:7469` no longer
fires for `hash`, because `CM:26` becomes `'hash' => { built: true, connects: false }`, and the
comments there say so. `connects: false` keeps `DEFAULT_ACCEPTS` as it is: a hash never signs in.
The core's S3 error rule on `grants.credential` (`OPS_CORE_PLAN.md`, the S3 validator row "`grants.credential` whose `connectsTo` PC blocks remote
sign-in", with its kind rule, the row that adds `hash` when built: both change; an error when the
granted entry's `connectsTo` PC blocks remote sign-in or its policy does not accept
`saved_connection`) accepts a granted entry of kind `hash` from S7 and skips the `connectsTo` and
policy checks for it, since a hash has no `connectsTo` and is never offered to a sign-in. S7 makes
that change, with a test showing a technique-granted hash raises no such error.

**Schema** (`scripts/scenario-schema.json`). The hash fields (`salted`, `crackSeconds`, `crack`) go
in the closed registry entry (`SCH:281-310`), with `crack` a closed object of `password` (enum
`strong guessable reused common`), `facts`, `passwordPattern` and `difficulty` (enum
`easy medium hard`, its description giving the defaults table). The habits object gains
`passwordDifficulty` (the same enum) beside `passwordPattern` (`SCH:4422`). `revealsFacts` (array of strings)
goes in `definitions.item`. `grant_fact` joins the `flagReward` type enum (`SCH:5750`) with a `fact`
string. The habit's `password` description (`SCH:4420`) says the crack reads its class.

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`). A built hash record already draws a key
node (`:1626-1634`). Add edges from the source (the share file item, the technique, or the
privilege plan's `admin@<pcId>` node) to the hash node; and from the hash node plus each recipe
fact's source (item, feed post or flag station) to the `<npcId> password` node, labelled "crack",
or "crack (hard)" and so on when the record has a difficulty. No password text appears in any
label.

## 10. Effect on existing scenarios, and the proof

No existing scenario has a `hash` record (so none has a `crack.difficulty`), a `revealsFacts` field
or a `grant_fact` reward, so
nothing it does changes. `DEFAULT_ACCEPTS` and the shipped habit keys are untouched.

The proof runs through `bin/ops-golden-compare` (built in the log rows plan's stage L1a), with
fixtures in `test/fixtures/files/ops_unchanged/cracking_<scenario>.json`, captured before C1 and
compared after C1 and after C2:

- `GET /keyring` for `test_access_networks` (a scenario with registry entries).
- The bootstrap payload for `test_simple_success`.
- The full validator output for every scenario.
- `cracking_inventory_add.json`: in a shipped scenario, a room take, an NPC give, a declared grant
  and a flag-station re-collect, with each answer body and the stored inventory. C2 changes
  `add_inventory_item!`, which every take runs.
- `cracking_flag_submit.json`: a `POST /flags` answer whose station has `give_item` and
  `set_global` rewards, and the stored `flag_rewards_claimed`. C2 adds a branch to
  `process_flag_rewards`, which every accepted flag runs.

Two existing tests may assert that `hash` is unbuilt: `test/unit/credential_model_test.rb` and
`test/models/break_escape/credential_keyring_test.rb`. They change with C1, and are the only
existing tests that should.

## 11. Tests

**C1, `test/models/break_escape/cracking_row_test.rb`.** Taking the share file lists a hash row
with token, username and `status: "ready"`, and no password; a technique grant lists the same row;
the token is stable across reloads, differs between games, and is equal for two unsalted records
whose passwords are equal; a salted record's token matches nothing; a hash never signs in.
At S8b time, once the MFA plan's `<npcId>.reset` entry exists: after an account's reset the hash
row still reads `ready` (not `cracked`) and a crack of it is not answered `cracked`; and a `reused`
crack on another account whose password equals the reset account's old `creds.password` misses.
Difficulty rows: a `hard` record with no `salted` key lists `salted: true` and a token that matches
no other record; a `hard` record with `salted: false` shares its token with an equal unsalted
record; an `easy` record lists `salted: false`; no keyring answer body contains the word
`difficulty`.

**C1, `test/unit/crack_difficulty_test.rb`.** `CrackDifficulty.resolve` for each value with no
overrides (the table's defaults), with `salted` written each way, with `crackSeconds` written, with
no difficulty (false, 60), and `easy` with `salted: true` (salted, 60). The NPC argument: no record
difficulty and an NPC `passwordDifficulty: "hard"` resolves as `hard`; a record `easy` with an NPC
`hard` resolves as `easy`; neither gives the no-difficulty defaults; an unknown value (record or
NPC) returns nil.

**C1, `test/unit/validate_cracking_test.rb`** (built as `test/unit/validate_plant_hiding_test.rb`
is). One minimal scenario per rule, each asserting the error or warning appears, and a clean
scenario asserting none:

- `account` that is not an account holder; no resolvable class; a `guessable` crack with 0, 5 or
  repeated facts; `facts` on a non-guessable class; the class-mismatch warning.
- `crackSeconds` on a record that does not resolve salted, and below 10 or above 600; `connectsTo` on a hash;
  `accepts: ["hash"]` on a policy.
- The core's S3 error rule on `grants.credential` accepts a granted `hash` and raises no
  `connectsTo` or policy error for it.
- A `guessable` habit on the account and a hash record with no `crack`: refused (a guessable crack
  needs `facts`).
- Difficulty: an unknown value refused; `hard` with 1 fact warns with the band message; `medium`
  with 2 facts and `hard` with 4 are clean; `hard` on a `strong` record raises no band warning;
  `crackSeconds` on an `easy` record with no `salted` refused; the same with `salted: true` clean;
  `crackSeconds` on a `hard` record with no `salted` key clean; on a `hard` record with
  `salted: false` refused. A `crack` holding only `difficulty` on an account whose habit is
  `guessable`: refused (a guessable crack needs `facts`).
- `passwordDifficulty`: an unknown value is an error in `validate_npc_habits.rb`; `hard` on an NPC
  with no `password` habit warns; `crackSeconds` on a record with no `difficulty` whose NPC has
  `passwordDifficulty: "hard"` and no `salted` key is clean; a `hard` `passwordDifficulty` on a
  `guessable` account with a record of 1 fact warns with the band message; a `difficulty` on a
  `strong` record warns, with no band warning.

**C2 rows in `validate_cracking_test.rb`.**

- A recipe fact with no server-visible source; the same fact on a takeable item, a takeable NPC
  held item, a start item, a feed post and a `grant_fact` reward, each clean. The fact on a
  non-takeable NPC held item: no source, the error.
- An item with `revealsFacts` and no `id`: refused.
- `revealsFacts` on an item a timer hands over and on one an object's `onInteract.actions` hands
  over: refused, and neither counts as the recipe fact's source. `revealsFacts` on a notepad and on
  a decor cup: refused.
- Two item definitions with one id, one carrying `revealsFacts`: refused.
- An unknown `revealsFacts`, recipe or `grant_fact` id, and an `se_intel_`-prefixed one: refused.
- `crack.passwordPattern` naming no object: the error. `crack.passwordPattern` naming an object
  that does not back the password: the warning. `crack.passwordPattern` on a class other than
  `guessable`: the warning. A `reused` crack with no equal
  password anywhere: the warning. A hash password equal to a capture target's with `revealSecret`
  not true: the warning.

**C2, `test/controllers/break_escape/ops_crack_test.rb`.**

- Each class: `strong` answers `nomatch` then `infeasible`; `guessable` answers `needMoreFacts`
  with the right count, then `nomatch` for a wrong pick, then yields for the exact set; `reused`
  yields only while an equal password is held; `common` yields on the first run.
- Refusals in order (`bad_request`, `not_found` for unknown, non-hash and unheld alike,
  `no_recipe`, `fact_not_held`), each with the closed `{ success: false, reason }` body. A fact id
  such as `staffId` passes `bad_request`. An already-held account answers `cracked` even with an
  unearned pick.
- Fact sources: `revealsFacts` stamped on a take, an NPC give and a `give_item` flag reward; a
  start item's facts counted with no inventory read; a served feed post's fact counted; a
  `grant_fact` reward stamped into `earnedFacts` when the flag is accepted through `submit_flag`
  and through a flag lock, and not before; a transient Hacktivity error on a flag lock (the unlock
  rolled back) leaves no stamp. `Game#stamp_earned_facts!` writes known ids only. A game made by
  `tools/playtest/new-game.rb` with a seeded flag whose station has a `grant_fact` reward and a
  `give_item` of an item carrying `revealsFacts` holds both facts in `earnedFacts`.
- Forgeries ignored: a synced `se_intel_*` global, a synced `earnedFacts`, `crackRuns`,
  `crackStarted`, `crackedAccounts` or `flag_rewards_claimed`, a `set_global` reward of
  `se_intel_<id>`, a client-reported ink `grant_fact`. A declared-grant item carrying
  `revealsFacts`, posted to the inventory with no source, is added and earns no fact. A notepad
  posted with a fact item's id earns nothing. A duplicate add of a held fact item earns nothing new
  and saves once. An `add_object` carrying `revealsFacts` stores the
  item without it. A forged NPC drop: an NPC the player has met and knocked out holds an id-less
  `notes` item; the client sends `add_object` with that item's type and name, a fact item's `id`,
  `sourceNpcId` and `sourceType: "npc_defeated"`, then takes that id; the take earns no fact,
  because the stored copy is the NPC's own item, which carries no `revealsFacts`.
- The salted wait with a frozen clock: a right pick and a wrong pick both answer `running` with the
  same `readyInSeconds`; the right one then grants, the wrong one then answers `nomatch` and the
  next pick starts a fresh wait; a post during the wait with a different pick changes nothing;
  `readyInSeconds: 0` stays `running` until the next post. A `hard` record with no `crackSeconds`
  waits 120 s, and with `crackSeconds: 30` waits 30 s. A `hard` `guessable` record answers
  `needMoreFacts` until all its authored facts are earned, exactly as one with no difficulty. A
  `hard` `strong` record answers `nomatch` then `infeasible`. A hand-edited game row with an
  unknown `crack.difficulty`, or an unknown `passwordDifficulty` on the account's NPC, answers
  `no_recipe` and writes no state, and the keyring lists no hash row for it. A record with no
  difficulty whose NPC has `passwordDifficulty: "hard"` waits 120 s; the same record with
  `crack.difficulty: "easy"` is unsalted (the record wins). The unsalted batch (one yield grants
  every held record with the same token); two parallel posts grant once; a game whose habit has
  gone answers `no_recipe`.
- The keyring digest: for a scenario with no hash row, `rev` equals the value captured before C2;
  earning a fact changes `rev`; a running crack keeps `rev` stable across two
  reads one second apart, and both `unchanged` answers carry the falling `readyInSeconds`.
- A captured and then cracked account shows one password row, with the value when the capture
  hides it. A row whose account is held from any source reads `cracked`. No answer body holds the
  password.
- State deltas (`SYNC_DELTAS_PLAN.md` section 11): across the C2 cases, the bootstrap and every
  sync, `GET /keyring` and `POST /crack` answer captured hold none of `earnedFacts`, `crackRuns`,
  `crackStarted` or `crackedAccounts`, and a sync that carries any of them leaves the re-read
  game's copies unchanged.
- The leak scanner (`tools/playtest/lib/access_leak_scanner.rb:1270`) learns the `cracked` entries:
  it asserts a `cracked` entry is present only when `crackedAccounts` holds its account, and that
  no hash row carries `password`.

**JS, `test/js/ops-cracker.test.mjs`.** The model renders each server status, offers only
`crackFacts`, sends fact ids only, posts once by itself when a countdown ends, and decides
nothing. The new modules join the copy lists of the harnesses that copy `minigames/index.js`
(`test/js/patch-panel.test.mjs`, `test/js/social-authenticator-wiring.test.mjs`), or plain `node`
fails with `ERR_MODULE_NOT_FOUND`. `test/js/exercise-station.test.mjs:31` copies the guesser,
which S7 does not import, so it is unchanged.

**JS, existing files.** `test/js/keyring-client.test.mjs`: a `cracked` password is visible at once
and is never `findWaiting`; a hash entry gives the "Hash collected" toast; an `unchanged` answer
carrying `readyInSeconds` resets a running hash row's countdown to the served value, and one
without it leaves the row as it was.
`test/js/signin-rows.test.mjs`: the hash row lists username, token and status, never a password;
its Crack button shows only for `ready` or `running`; a `running` row at 0 reads "Ready to
finish". A flag-station test: a `grant_fact` reward calls `grantFact`.

**Dungeon graph.** A graph test: the hash node has its source edge and its "crack" edge to the
password node, and no label holds password text; a record with `difficulty: "hard"` labels the edge
"crack (hard)".

**Feature scenario `scenarios/test_ops_crack/`.** One `strong`, one `guessable` (one fact from an
item, one from a feed post, one from a `grant_fact` flag reward), one `reused`, one `common` recipe
on a plain account holder with no `password` habit, a salted record beside two unsalted
records with equal passwords, and one record at each difficulty. The validator and dungeon graph run clean.

**Scripted playtest and live proof.** Through `window.__test`: collect a hash, run the cracks,
check that the browser saw only statuses and counts before the grant. Then the real path in a
browser: crack the guessable account and sign in with the cracked password.

## 12. Build steps and shared files

C1, in order: the golden fixtures captured; `CM:26` flips `hash` to built;
`lib/break_escape/crack_difficulty.rb` and `crack_difficulty_test.rb`; `passwordDifficulty` added to
`NpcHabits::PARAMETERS` and to `validate_npc_habits.rb`; schema fields;
`scripts/validate_cracking.rb`, its two hook lines and `validate_cracking_test.rb` (C1 rows); the
hash branch in `registry_keyring_entries` with the token; the client row in `keyring.js` and
`signin-rows.js` (no Crack button yet) and their JS tests; graph node edges and the graph test; the
core's S3 error rule taught to accept `hash` and skip its `connectsTo` and policy checks;
`cracking_row_test.rb`; the golden compare.

C2, in order: `revealsFacts` added to `FORGEABLE_ITEM_FIELDS`; the `fact_source:` keyword on
`add_inventory_item!`, reading the stored copy's `revealsFacts`, passed by the inventory route
(not for a declared grant), by `process_item_reward` and by the playtest seeder
(`tools/playtest/new-game.rb:416`); the earned set; `Game#stamp_earned_facts!`; the `grant_fact`
case in `process_flag_rewards` (stamped through that method, then forwarded as `set_global` is),
in the seeder's reward replay (`new-game.rb:410-437`, the same method) and in the flag station's
`processRewardEvents`; the four state keys; `crackFacts` in the keyring digest (only when present) and
`keyring_live_crack_waits` on the `unchanged` answer; `games#crack`, its route and policy; the two
new refusal codes in `ops_refusal_codes.json` and `REFUSAL_TEXT`; the grant and
`cracked_keyring_entries`; the `ops-cracker` scene and model, registered in `minigames/index.js`;
the Crack button; the scanner rule; the C2 rows of `validate_cracking_test.rb`, the other tests,
feature scenario, playtest and live proof.

Files other plans also touch (agree the order with their owners):

- `lib/break_escape/credential_model.rb`, `app/models/break_escape/credential_keyring.rb`
  (`keyring_rev`, the `unchanged` sibling)
- `lib/break_escape/item_identity.rb` (`FORGEABLE_ITEM_FIELDS`: S7 appends `revealsFacts`; the lock
  plan appends `secondStep`; neither removes anything)
- `app/models/break_escape/game.rb` (`add_inventory_item!`, `ACCESS_STATE_DEFAULTS`)
- `test/fixtures/files/ops_refusal_codes.json` and the client's `REFUSAL_TEXT` table
- `app/controllers/break_escape/games_controller.rb` (`games#crack`, `process_flag_rewards`),
  `config/routes.rb`, `app/policies/break_escape/game_policy.rb`
- `scripts/scenario-schema.json`, `scripts/validate_scenario.rb` (the require and the run line)
- `scripts/generate_dungeon_graph.rb`
- `public/break_escape/js/systems/keyring.js`,
  `public/break_escape/js/minigames/capture-log/signin-rows.js`, the remote-host text helper
  (`remote-host-text.js`) where it lists keyring kinds
- `public/break_escape/js/systems/social-intel.js` callers, the flag station minigame,
  `public/break_escape/js/minigames/index.js`
- `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/new-game.rb` (the flag-reward
  replay)
- the test harness copy lists
- `README_scenario_design.md` (feature index) and `docs/ACCESS_AND_NETWORKS.md`

S7's own new files: `app/models/break_escape/ops_cracking.rb`,
`lib/break_escape/crack_difficulty.rb`, `scripts/validate_cracking.rb`, the `ops-cracker` scene and
model under `public/break_escape/js/minigames/ops-cracker/`, `scenarios/test_ops_crack/`, and the
five new test files (`cracking_row_test.rb`, `crack_difficulty_test.rb`,
`validate_cracking_test.rb`, `ops_crack_test.rb`, `ops-cracker.test.mjs`).

## 13. Log rows this feature writes

None. Cracking happens on the attacker's own machine, so it leaves nothing on the target to log.
Getting the hash is logged where it happens, by the plan that owns that move
(`credentials_harvested`, `share_folder_opened`). S7 stores no secret value outside the keyring:
the cracked password is read from `creds.password`, which the log module already registers as a
secret source, and the token is not a secret and is never stored. So S7 calls no
`OpsLog.register_secret_source`. A later change that stores a cracked value elsewhere registers
it.

## 14. What this plan relies on from other plans

Each entry names what this plan needs from another plan and the section of that plan that provides it.

**Privilege and accounts plan (`OPS_PRIVILEGE_ACCOUNTS_PLAN.md`, section 4 "Scenario fields" and
section 9 "Validator, schema and dungeon graph").**

- The `harvested` proof, a string keyed by the sign-in PC id (`"harvested": "<pcId>"`). This plan
  reads it through `proof_kind` like any other proof.
- The privilege plan builds after this plan (S5b after S7).
- The collect panel launches the crack scene for any `hashId`, which the scene already accepts.
- Its graph edge from `admin@<pcId>` to the hash node continues to the password (section 9 of
  this plan).

Four rules the privilege plan carries so that this plan owns the recipe checks:

1. **Who owns the recipe rules.** This plan owns every rule on a hash record's `crack` (section 9).
   The privilege plan has no `passwordPattern` requirement and points to `validate_cracking.rb`.
2. **The `reused` check.** The privilege plan points to this plan's warning in
   `validate_cracking.rb` (no other account, registry `password` entry or capture target has an
   equal `creds.password`, section 9) and adds no check of its own.
3. **Its example fact `it_rota_poster_seen`.** The poster is a takeable `notes` item with
   `revealsFacts`, so it is a server-visible source (section 5 table).
4. **Habit parameter `passwordDifficulty`.** Where the privilege plan lists the NPC habit
   parameters beside `passwordPattern`, it adds the optional `passwordDifficulty` (`easy`,
   `medium`, `hard`), owned and validated by this plan, for an NPC whose account the privilege plan
   collects as a hash.

**Core plan (`OPS_CORE_PLAN.md`, section 9 "Validator, schema and dungeon graph" and section 6
"Server routes").** The core's S3 `grants.credential` error rule must accept a granted `hash` in
its kind rule and skip the `connectsTo` and policy checks for it. This plan builds both, with their
test. This plan adds `no_recipe` and `fact_not_held` to `ops_refusal_codes.json` and
`REFUSAL_TEXT`, and uses the core list's `bad_request` and `not_found`. The core's "refusal codes,
in one list" paragraph counts these two beside its twelve network-route codes (and the privilege
plan's three collect codes); the file holds each code any ops route sends.

**Second-step and lock plan (`OPS_LOCK_SECOND_STEP_PLAN.md`, section 5 "Engine behaviour" and
section 12 "Build steps and shared files").** A cracked password is a first factor and meets a
second step as any other password does, keeping the authored value. Both this plan and the lock
plan append to `FORGEABLE_ITEM_FIELDS` (`lib/break_escape/item_identity.rb`): this plan
`revealsFacts`, the lock plan `secondStep`. Each change is additive, so whichever lands second
keeps the other's entry.

**Log rows plan (`OPS_LOG_ROWS_PLAN.md`).** This plan writes no rows and registers no secret
source (section 13). Nothing is needed from the log rows plan.

**Skin plan (`OPS_REALISM_SKIN_PLAN.md`, section 5 "Engine behaviour").** The crack scene sits
outside the network view and has one look. If a crack ever shows in the simulated command-line
output, the skin plan says what it wants. This plan can offer, per run, from the `POST /crack`
answer only: the record label and token, the fact labels picked, a progress line while `running`,
and the status.

**Sync deltas plan (`SYNC_DELTAS_PLAN.md`, section 11 "How to keep state deltas", with its
section 8 growth table).** This plan's build follows that mechanism; it changes nothing in that
plan. The four state keys of section 8 (`earnedFacts`, `crackRuns`, `crackStarted`,
`crackedAccounts`) are server-owned records, written only by the server under the game lock and
bounded by authoring (at most 64 entries, keys only registry hash ids). None is sent to the
browser as state, in the bootstrap or in any answer, so none is ever re-sent whole, and a sync that
carries one is ignored. Section 8 here is their growth table, and section 11 (C2) tests it.
`crackFacts` is not stored state: it is a read answer built from `earnedFacts`, and it follows the
keyring's existing pattern for `entries` and `captures` (`credential_keyring.rb`), which the client
fetches only when `keyring_rev` changes. Rule 4 governs answers to routes that change state; a
crack or fact grant answers with its own change, and the keyring read stays a whole, rev-gated
answer, capped by authoring at 64 ids (about 1.5 KB), and it is never written back by a sync.

**Intel and scenario authors.** A recipe fact that today comes only from dialogue, an object
action, an OSINT page or a mail highlight needs a second, server-visible source: a takeable item
with `revealsFacts`, a feed post, or a `grant_fact` flag reward (section 5 table). An item a timer
or object action hands over cannot carry `revealsFacts`.

## 15. Open questions for the user

None.
