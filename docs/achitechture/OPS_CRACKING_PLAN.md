# OPS_CRACKING_PLAN.md — S7 hashes and offline cracking (feature A21)

Stage S7 of the ops layer (brief `docs/agents/OPS_LAYER_BRIEF.md`, outline
`docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md` S7). One build stage, size M. Planning only.

Everything here is fictional and abstract. A hash is an invented opaque token. The plan names no
real hash format, no real tool and no real procedure. The minigame is a game move, not a technique.

## 1. What this adds and why, in play

The player can obtain an account's **hash record** — an opaque token that stands for a stored,
scrambled form of someone's password — and then run an **offline cracking** minigame that tries to
recover the plain password from it using the **intel facts** the player already holds about that
person (their pet's name, a birth year, a sports team, the sort of thing `se_intel_<factId>`
globals already track).

Three sources give a hash record:

- **Admin on a host** (S5a): with admin access the player dumps stored hashes from that host.
- **A file on a share** (N4): a carelessly stored credentials file lists a hash.
- **A technique that yields one** (S3): optional, same keyring path.

The cracking minigame shows the hash token and the facts the player holds, and lets the player
assemble a candidate from those facts (the same slot-filling idea as `password-guesser`). The
**server** decides the outcome from the NPC's `password` habit:

- A **strong** password never yields, however many facts the player holds. The lesson: good
  passwords are not guessable from personal facts, so cracking is a dead end — go and phish, or find
  it reused.
- A **guessable** password yields once the player holds the facts its pattern needs. A failed run
  tells the player how many facts are still missing, not which — so the player keeps gathering
  intel. The lesson: personal facts are password material.
- A **reused** password yields when the player already holds the same person's (or a shared)
  secret from somewhere else. The lesson: reuse turns one leak into many.
- A **salted** hash costs more effort: the server makes the player accumulate several runs before
  it releases the result, even when the candidate is right. The lesson: salting slows offline
  attacks; it does not stop a guessable password.

When a crack succeeds the recovered password lands in the keyring (A15) as a normal `password`
credential for that account, so the rest of the game (sign-in, S5c) uses it exactly as a captured
password. The teaching payoff is the contrast between the four habits and the role of salt.

## 2. What the code does today (verified, `file:line`)

- **`password-guesser` is browser-only and not reusable as-is.** Scene
  `public/break_escape/js/minigames/password-guesser/password-guesser-minigame.js` (258 lines) and
  model `…/password-guesser-model.js` (339). Every row outcome (`struck`, `opens`, `missing`,
  `holds`) is authored in the config and decided in the browser; `landedGlobal` is written client
  side through `writeGlobal` + `stateSync.sync()` (`minigame.js:227-237`) with no server check. A
  pattern-slot row exists only when `se_intel_<factId>` is true (`model.js:115-129`); `slotGuess`
  (`model.js:101-104`) fills the template; `textFor` renders a row. Its config shape is pinned by an
  awareness lint: `scripts/validate_social/awareness.rb:1298` fixes `awarenessEpisode.guess`. So the
  guesser cannot be made server-authoritative without breaking that contract; S7 builds beside it
  and reuses its **row vocabulary, CSS classes and `slotGuess`/`textFor` helpers** only.
- **The keyring already reserves a `hash` kind.** `lib/break_escape/credential_model.rb:21-27`:
  `'hash' => { built: false } # phase 3`. The validator refuses a kind whose `built` is false.
  `KINDS` also records `connects`/`routes`; `DEFAULT_ACCEPTS` (`:30`) is the kinds a PC accepts.
  `PROOF_KINDS` (`:36`) `session planted dropped held foothold`. `MAX_ENTRIES = 64` (`:39`).
- **The keyring is a server-only top-level `credentials` map**, stripped from the bootstrap
  (`credential_model.rb:14-15`; bootstrap strips `credentials` at `GM:2488`/`NA:18` per D1:132).
  Proofs are evaluated server side in `app/models/break_escape/credential_keyring.rb`
  (`credential_proof_holds?`, lines ~19-36).
- **Implicit password entries already exist**, one per captured account:
  `credential_keyring.rb:263-287` (`implicit_keyring_entries`) builds `"<npcId>.password"`,
  `kind: 'password'`, `source: 'capture'`, and attaches the `password` secret from
  `capture_secrets_for_client`. This is the exact path a cracked password should reuse, with a new
  `source`.
- **The `password` habit has no runtime reader.** Allowed values at `scripts/.../npc_habits.rb:24`;
  `passwordPattern` is a parameter (`:29`, `:55-57`). It is read only at authoring time:
  `scripts/validate_npc_habits.rb:253-298` (`check_password`) and `:565-598` (`password_effects`);
  `scripts/generate_dungeon_graph.rb:427-450` (edges for `reused` and backed `guessable`); and
  `lib/break_escape/npc_habits/clues.rb` — `backing` (`:427-497`), `parts_all_sourced?`
  (`:500-513`), `reuse_homes` (`:516-521`). `clues.rb:9-13` states the server never uses it today.
  Habits are **not shipped**: `SHIPPED_HABIT_KEYS = %w[screen print]` (`game.rb:7335-7345`).
  **So S7 adds the first server-side reader of `password`.** `clues.rb` is plain requirable Ruby and
  already encodes `reuse_homes`/`backing`, so the server reuses it rather than re-deriving.
- **Shares and files.** A share is a top-level `resources.<id>` of kind `file_share` with a
  `contents` list (D1:13, `SCH:347-366`); contents are served by `games#container`
  (`GC:626-668`) only when the share is admitted, else 404 (D1:109). A hash record on a share is a
  new content entry shape (section 4), owned by S7, that N4/S1 must admit through the same gate.
- **Seeded rolls** exist for deterministic tokens; no server clock exists (D4 3.3), so effort is a
  run count, not minutes.

## 3. Build stages (one stage, M)

S7 ships as one stage because the hash record, the obtain paths and the minigame are one loop and
none is useful alone. Internally, build in this order so each step is testable:

1. **Hash record + keyring `hash` kind** (set `built: true`, define that it does **not** connect).
   Validator and schema accept a hash record; the player can hold one; it shows in the keyring.
2. **Obtain paths**: a share-file content entry (N4) and the S5a admin-dump effect both grant a hash
   record. Until S5a lands, the share path alone exercises the feature.
3. **Crack route + minigame**: `POST /crack`, the server decision, the recovered-password grant, and
   the new scene.

Each step is shippable: after step 1 a scenario can hold a hash with no way to crack it (inert);
after step 2 it can be obtained; after step 3 it can be cracked.

## 4. Scenario fields (minimal JSON per concern)

**The hash record (keyring entry, kind `hash`).** A server-only `credentials` entry. It names the
account NPC, whether it is `salted`, and an optional crack `cost` (runs needed once the candidate is
right; default by `salted`). The `token` shown to the player is **not authored** — the server mints
a seeded opaque string from the account id and a scenario salt, so authors never paste a fake hash.

```json
"credentials": {
  "dana_hash": {
    "kind": "hash",
    "account": { "npc": "dana" },
    "salted": true,
    "proof": { "held": { "type": "hash_record", "id": "dana_hash_file" } }
  }
}
```

The `proof` reuses the existing proof vocabulary: here a `held` proof satisfied by an inventory item
the player picked up (the file), exactly as other keyring kinds prove holding. An admin-dump source
instead uses a proof the server writes on dump (section 14, cross-plan with S5a).

**A hash on a share (N4).** A new `contents` entry kind on a `file_share`, that grants the hash
record when the share is opened:

```json
"resources": {
  "ops_share": {
    "kind": "file_share",
    "host": "fileserver",
    "access": [ "it_admin" ],
    "contents": [
      { "kind": "hash_file", "id": "dana_hash_file", "grants": "dana_hash", "label": "backup.creds" }
    ]
  }
}
```

**The NPC `password` habit** is authored today (unchanged): `habits.password` is
`strong | guessable | reused` with `passwordPattern` naming the fact ids its pattern needs
(the same `factId`s that drive `se_intel_<factId>`). S7 adds no new habit field; it adds the
server-side **reader**.

A scenario with no hash record, no `hash_file` content and no crack is unchanged (section 10).

## 5. Engine behaviour (server then client)

**Server.** The hash record lives in the server-only `credentials` registry; its `token` is minted
once per game from a seeded function of `account.npc` + a per-scenario salt, memoised in server
state so it is stable across reloads. When a crack run arrives the server:

1. Confirms the player holds the hash record (its keyring proof holds now).
2. Reads the account NPC's `password` habit from `scenario_data` (never shipped).
3. Builds the "correct" candidate the habit implies, using `clues.rb`: for `guessable`, the fact ids
   in `passwordPattern`; for `reused`, the `reuse_homes` source secret; `strong` has no recoverable
   candidate.
4. Compares the player's submitted candidate (fact ids, or a held-credential reference for `reused`)
   against that, checks each referenced fact/secret is actually held, and applies the salt-cost
   gate.
5. On success, grants the recovered password into the keyring and returns a non-secret result.

**Client.** A new scene `ops-cracker` (a `SocialOverlayScene` sibling of `password-guesser`) shows
the hash token, the facts held, and slot rows built with the reused `slotGuess`/`textFor` helpers.
The player assembles a candidate and presses Crack; the scene calls `POST /crack` and renders the
server's result (running / no match / missing N facts / cracked). The scene **never computes the
outcome** and never holds the password before the server grants it. It is launched from the keyring
entry (a "Crack" affordance on a held `hash` record) or from an inventory tool item, both of which
just open the scene for a given hash id.

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
