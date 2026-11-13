# Step 2b review, round 1 — Author notes are not live

Reviewer pass over `git diff 35993ec89...HEAD` on `build/harden-2b` (tip d9dcb0ce9).
Plan: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`, step 2b. Build log: step 2b
(phases A, B1, B2). Security-sensitive: changes the walkers that grant access and the
filters that keep secrets.

Verification done: read every changed file and the resolver; ran the affected test files
(all green, see below); live proof on a keyless server (port 3271, game 2351 of
`scenarios/test_author_notes`), capturing every response of every scenario-data route.

Orchestrator rulings honoured (not re-raised): lazy resolution plus eager explorer; the 4
kept audit notes (verdictFeedback, kindPoints, hintsByFactor); the pinned
`KNOWN_SET_GLOBAL_UNDER_NIL`; free data carries no notes and is walked in full.

Counts: 1 blocker, 0 majors, 1 minor, 1 nit.

---

## B1 (blocker) — Author notes still ship: routes that re-dup a scenario sub-object bypass the strip

The step's stated invariant is that **no client payload carries a note**. The six strips
(bootstrap, room, container, item, inventory, command board) cover every payload a
*controller* builds from the stripped bootstrap copy. They do **not** cover routes whose
*model method* independently `deep_dup`s a sub-object straight out of `scenario_data` and
renders it. Two such routes ship notes. The build-log route audit certified both as
"no scenario _ notes | none needed", which is false.

### Site 1 — feed / intel facts

`app/models/break_escape/social_feed.rb:359-361` (`feed_answer`):

```
entry = fid && facts.is_a?(Hash) && facts[fid].is_a?(Hash) ? facts[fid].deep_dup : nil
out = { ..., 'fact' => entry ? { 'id' => fid, 'entry' => entry } : nil, ... }
```

`entry` is the **whole** intel fact, deep-duped, embedded unsliced as `fact.entry`.
`#/definitions/socialIntelFact` is a closed block (`additionalProperties: false`) with the
`^_` note pattern, so any `_` key inside a fact is an author note (rule 1). It reaches the
browser via three live paths, none of which strips:

- the bootstrap: `games_controller.rb:425` attaches `filtered['feedPosts'] =
  @game.feed_posts_for_client` **after** the strip at :299; `feed_posts_for_client`
  (`social_feed.rb:126`) keeps `fact` in its `FEED_ITEM_KEYS` slice, so the fact entry (with
  its note) ships;
- `POST /feed_post` → `reveal_feed_post!` (`social_feed.rb:97`) returns
  `(answer || {}).merge(...)` unsliced;
- `POST /friendface_phone?posts=1` → `open_friendface_phone` (`social_feed.rb:234`), same
  `feed_answer` path.

Note the inconsistency this creates: the **same** fact, served in the bootstrap under
`social.intelFacts`, is stripped there (the root strip walks into it), but served again
under `feedPosts[].posts[].fact.entry` it is not. A `_draft` an author parks beside a fact
(an old secret, a reworded line) ships through the feed.

### Site 2 — objectives

`app/models/break_escape/game.rb:3691` (`objectives_state`, served by `GET /objectives`):

```
'objectives' => filter_target_flags(scenario_data['objectives']&.map(&:deep_dup)),
```

`filter_target_flags` removes only flag answers. An `#/definitions/objective` declares
`properties` with no `additionalProperties`, so an undeclared `_` key on an objective is a
note (open-with-properties → undeclared → note, as the plan states). `GET /objectives` ships
it, while the bootstrap's own `filtered['objectives']` is stripped — the same disagreement as
the feed.

### Failure scenario
An author adds `"_draft": { "password": "old-vault-pass" }` to an intel fact, or
`"_note": "<anything sensitive>"` to an objective. It never shows in the bootstrap (stripped)
so the author believes the step's guarantee holds, but it ships verbatim on `GET /objectives`
and once any feed post that cites the fact is revealed.

### Why blocker
The entire deliverable of a security-hardening step is "no note ships", the step is signed
off as complete, and the audit affirmatively (and wrongly) cleared these routes. The guarantee
is not met on live routes.

Mitigating context for the orchestrator's severity call: no corpus scenario currently parks a
`_` key inside an intel fact or an objective (the corpus `_note`/`_comment` keys sit in
triage/mail/ink blocks, not here), so this is a latent gap on the plan's own "next author"
threat model rather than an active leak today; and both payloads are player-facing content, so
the realistic leak is author commentary or a parked draft rather than a live credential.

### Fix
Strip each sub-object with its own Node before it ships, on the copy each method already owns:
- in `feed_answer`, `AuthorNotes.strip_notes!(entry, ScenarioSchema.at('#/definitions/socialIntelFact'))`
  before building `out` (add that pointer to `STARTS`);
- in `objectives_state`, strip each duped objective with `ScenarioSchema.at('#/definitions/objective')`
  (add to `STARTS`) after `filter_target_flags`.
Then re-run the route audit as "what does each render actually embed", not "what does the
controller build", so the whole class is closed (network view and foothold payloads were
checked and are safe — they are constructed key-by-key or sliced, not duped).

---

## m1 (minor) — Live-proof fixture does not exercise the gap

`scenarios/test_author_notes` has no feed, no `social.intelFacts` and no objectives, so the
live proof only covers the six strip points and could not have caught B1. Extend the fixture
with an intel fact carrying a `_` note plus a feed post that cites it, and an objective
carrying a `_` note, and assert that `GET /objectives` and the feed route carry neither the
note key nor its value. Without this the route audit has no live backstop for the
model-method class.

## n1 (nit) — STARTS must grow for the B1 fix

`ScenarioSchema.at` raises on any pointer not in `STARTS`, so the B1 fix must add
`#/definitions/socialIntelFact` and `#/definitions/objective` to the `STARTS` list (and the
schema-walk test's Explore picks them up automatically, since it greps `at` call sites).

---

## What is correct (checked, no finding)

- **Resolver and walkers.** `ScenarioSchema` rules 1-4, the map test (`additionalProperties`
  a schema or `x-id-map: true`), the "a map branch's patternProperties are never consulted"
  rule, `FREE` propagation and nil pass-through all match the plan. Every granting/deriving
  walker (`grant_foothold_actions`, `DeclaredGrants.collect`, `wearable_items`,
  `global_writers`, `OwnerClaim.scenario_objects`/`mappings`, `merge_biometric_samples!`,
  `clues.rb`) carries a Node and skips notes via `note?`/`each_live` while visiting free data.
- **Strip placement vs secret filters.** The bootstrap strip runs after
  `filter_requires_recursive` and before every player-state key is attached, so a saved `_`
  global is kept; `filtered` is a `deep_dup` of `scenario_data`, so the stored column is never
  mutated (confirmed live: notes gone from payloads, present in the stored scenario). Room,
  container, item and inventory strips all run on copies the method already owns.
- **Secret-keeping is a second line.** `lock_codes`, `hard_access_values`,
  `strip_lock_answers!`, `strip_all_grant_contents!` and `CaptureModel`'s answer sets still
  walk the whole tree (notes included), unchanged.
- **Capture writers.** All seven `each_capture_writer` callers use the new default
  `notes: :skip` (the widening-safe direction); the enumerator form threads the keyword. No
  caller needs `:visit`, consistent with plan item 5.
- **No engine JS reads a `_` payload key.** Grep of `public/break_escape/js`: the only
  `_`-token hits are `cryptex` puzzle chars and `NAME_SUFFIXES` (`_first`, `_short`, ...),
  none of which starts with `_` as an object key, so `strip_notes!` cannot break the client.
- **Boot check.** `engine.rb` initializer calls `boot_check!`; raises under `eager_load`
  (production/CI), no-ops otherwise (dev, rake). Matches the plan.

## Live proof (port 3271, game 2351, keyless server, now stopped)

All scenario-data routes returned 200 and were captured: `/scenario`, `/scenario_map`,
`/room/lobby`, `/room/vault`, `/room/_annex`, `/objectives`, `/capture_secrets`, `/network`,
`/inventory` (`/container/crate` 403, locked). No note value
(`NOTE-CREDS-OLD-111`/`-DRAFT-PIN-222`/`-CONTENTS-PW-333`/`-BOARD-444`/`-FOOTHOLD-DEAD`) and no
note key (`_creds_old`, `_draft`, `_note`) appeared in any body. `/room/lobby` shipped every
object (guard, safe, crate, folder, board, note_pc) with its notes removed; `/scenario`
shipped `commandBoard` title "Ops" without its `_note`. Free data shipped as authored
(`FREE-GLOBAL-VALUE-555` present) and the `_secretglobal` global id shipped (an id, not a
note). The game loaded, the bridge reached ready, rooms were navigable.

## Tests run (single files, no lock, per the congestion rule)

- `test/unit/author_notes_test.rb` 19/0; `test/unit/scenario_schema_test.rb` 10/0;
  `test/unit/scenario_schema_boot_test.rb` 4/0;
  `test/controllers/break_escape/notes_never_ship_test.rb` 6/0;
  `test/controllers/break_escape/capture_notes_not_live_test.rb` 4/0;
  `test/controllers/break_escape/network_notes_not_live_test.rb` 8/0;
  `test/unit/npc_habits_clues_test.rb` 14/0; `test/js/validator-note-actions.test.mjs` 2/0.
- Gap: no test covers the feed/objectives payload class (see m1). Every existing test checks
  the six controller-built payloads, which is exactly the class B1 escapes.
