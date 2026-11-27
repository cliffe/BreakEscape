# Sync deltas branch review (R2)

Counts: 0 blockers, 0 majors, 0 minors, 2 nits.

Scope: the R1-fix commit `901dd8bc8` on `build/sync-deltas` (worktree
`.claude/worktrees/p-sync-review`, detached at `901dd8bc8`). Focus per the brief:
that R1 m1 / n1 / n2 are closed by tests that go red without the fix, and a
security read of the new case F legacy-clone backfill, which grants access.
Everything settled in R1 (the capture record ownership, the 6a / 6b boundaries,
the delta client, the cheat policy as a standing ruling) is not re-raised.

## Verdict

The three R1 fixes hold and the case F backfill is safe. It grants only a subset
of what the honest clone routes (`record_card_clone!`, `update_cloner_saved_cards!`)
already grant, validated against server-authoritative state, and it is inert on
games created on the branch. No client can forge a saved-card entry that the
backfill turns into access honest play could not reach. Details below, then two
nits (both latent / branch-only, neither a live exploit in an authored scenario).

### Case F security: can a forged saved-card become a real clone?

No. The attack would need a `saved_cards` entry whose `card_id` has no
`serverClones` record (so `legacy_cloned_cards?` fires) to reach the backfill.
Every route that writes the cloner's `saved_cards` blocks that on the branch:

- `update_cloner_saved_cards!` (game.rb:4037, the POST /inventory
  `update_saved_cards` path) adds a card only when `recorded.key?(card_id)`
  (game.rb:4048), i.e. a `serverClones` record already exists, so it can never
  create a no-record entry.
- `record_card_clone!` (game.rb:2543) writes `serverClones` before
  `add_saved_card!`, so every copy it lists has a record.
- The generic sync merge never touches inventory: `merge_last_write_wins_sections`
  and `merge_grow_only_sections` (games_controller.rb:1986, :2068) carry no
  inventory section; inventory is written only by the dedicated /inventory route
  through `canonical_inventory_item` (the server's own copy).

So a no-record entry can arise only from the genuine case F pre-branch old-tab
reload, which is exactly what the backfill targets. On a branch-created game
`legacy_cloned_cards?` is always false (every listed card has a record), so the
backfill never runs: harmless, as the brief requires.

When it does run, `confirmable_clone_source` (game.rb:3990) grants only through
server-authoritative signals, each a subset of the honest clone checks:

- NPC path: the card's holder NPC must be in `encounteredNPCs` and
  `cloneable != false` (game.rb:3993-3996). `encounteredNPCs` is written only
  server-side from `filtered_room_data` when a room is reached
  (games_controller.rb:2140 `track_npc_encounters`); it is in no sync section, so
  it cannot be forged. Same predicate as `record_card_clone!` (game.rb:2520-2521).
- Keycard-object path: `clone_source_keycard(k['id'])` (game.rb:2582) requires the
  keycard to be held, or in a reachable room with every container above it
  unlocked and the path unlocked (`in_reach`). A keycard behind a lock the player
  never opened returns nil, so the copy is dropped. Same predicate as the honest
  object clone (game.rb:2525).
- A cloner must be held: `backfill_legacy_cloned_cards!` returns false unless
  `real_cloner` (game.rb:3952); `real_cloner` skips client-forged items.

I checked each case the brief named:

- NPC met but not cloneable -> `cloneable != false` fails, dropped (test "a legacy
  copy of a card the player never met is dropped").
- Holder met only after the backfill runs -> at bootstrap the NPC is not yet in
  `encounteredNPCs`, so the copy is dropped; the player re-clones honestly once
  they meet them (access honest play reaches, by the honest route).
- Keycard behind an unopened lock -> `in_reach` false, dropped.
- Cloner never held -> early return, no write.
- Repeated bootstraps -> idempotent: a confirmed card gains a `serverClones`
  record (so `server_clones.key?` is true next time, skipped) and a dropped card
  is removed from the list, so `legacy_cloned_cards?` is false afterwards. A
  second bootstrap writes nothing.
- Branch-created games -> no no-record entry can exist (above), backfill inert.

Bootstrap ordering is correct: the backfill runs before `repair_saved_cards!`
(game.rb:833-834), so a confirmed copy has its record and stays listed (repair
no-ops on it) and a dropped copy, now absent from both the list and
`serverClones`, is not resurrected by repair.

### phishGated is never served, and is set correctly

`captures_for_client` (capture_proofs.rb:267) and `client_capture_entry`
(games_controller.rb:937) both whitelist fields (`targetId`, `kind`, `roleLabel`,
`address`, `host`, `note`, `at`); neither copies `phishGated` or `proven`, so the
server-only flag never reaches the browser. `store_capture_entry` stores it only
when true (capture_proofs.rb:517). Migrated legacy entries are stored
`proven: true` (so never unproven, never flagged). The gate
`phish_gated_unproven_captures?` reads `player_state` alone and is cheap.

### R1 fixes: tests that go red without the fix

- n1 (`remove_saved_card!` no-op guard): I reverted the guard to the old
  unconditional `save!`/`return true` and ran the n1 test in isolation; it failed
  (`Expected: false, Actual: true`), then restored the file from HEAD. Confirmed
  red without the fix.
- m1 (lazy `extra_sent`) and n2 (phishGated fingerprint gate): both are guarded by
  `CaptureHotPathSpy`, which counts `incoming_sent_messages` and
  `phish_evidence_fingerprint` calls. Without the m1 fix the unconditional
  `extra_sent` on line 870 calls `incoming_sent_messages` once on the plain sync
  (count 1, the test asserts 0). Without the n2 fix `@phish_fp_before` is set on
  `unproven_captures?`, so the part-3-only entry fingerprints the mailbox (count
  >= 1, the test asserts 0). Each assertion is the exact post-fix value, so each
  goes red without its fix. The lazy `extra_sent` guard is also correct for
  stamping: every path that reaches `stamp_proven_captures!` (not early-returned
  at games_controller.rb:881) satisfies one of `incoming.any?`,
  `legacy_captures?` or `@phish_fp_before` non-nil, which are exactly the guard's
  conditions, so `extra_sent` is always computed when the stamp uses it.

## Nits

### n1. Backfill `uidOnly` is taken from a definition that may not be the confirmed source

File: `app/models/break_escape/game.rb:3968-3976`
(`backfill_legacy_cloned_cards!`).

`confirmable_clone_source` decides the source (an NPC or a keycard object), but
the record's `uidOnly` is recomputed from
`scenario_keycard_definitions.find { card_id } || npc_card_definition_for(card_id)`,
which prefers a keycard object over the NPC card. `npc_card` reads
`creds.card` / `rfidCard` (game.rb:1220), which `scenario_keycard_definitions`
does not collect, so an NPC-sourced card whose `card_id` also names a keycard
object elsewhere would take the object's `rfid_protocol` for `uidOnly`. If the two
share a `card_id` but differ in protocol (e.g. NPC card `MIFARE_DESFire`, object
`EM4100`), the backfill could mint a full clone (`uidOnly: false`) where the
honest NPC clone would be UID-only, granting more than honest play reaches.

This needs an authoring inconsistency (one `card_id`, two protocols); the project
treats `card_id` as the card's identity, so authored scenarios will not hit it,
and the honest `held_rfid_cards` path keys by `card_id` and would be just as
confused. Latent, not a live exploit.

Failure scenario: a scenario defines an NPC `creds.card` and a separate keycard
object with the same `card_id` and a different `rfid_protocol`; a case F legacy
copy of that card is backfilled with the object's protocol, over- or
under-granting against the NPC source.

Fix: have `confirmable_clone_source` return the resolved definition (it already
has it in hand) and compute `uidOnly` from that, so the record matches the
confirmed source rather than a `card_id` lookup.

### n2. A pre-commit unproven phish-gated entry is not stamped on a sync until the next bootstrap

Files: `app/controllers/break_escape/games_controller.rb:810`
(`@phish_fp_before` now gated on `phish_gated_unproven_captures?`),
`app/models/break_escape/capture_proofs.rb:517` (`phishGated` set at record time).

The sync-time stamp (`stamp_proven_captures!`, reached only past the early return
at games_controller.rb:881) now fires only when `@phish_fp_before` is non-nil,
which needs `phishGated == true`. An entry recorded before `901dd8bc8` (branch-era
6b code, no flag) returns false from `phish_gated_unproven_captures?`, so a sync
that lands its phish evidence will not stamp it, where the pre-commit code (gated
on `unproven_captures?`) did. No earned proof is actually lost under normal play:
`GET /capture_secrets` re-checks the evidence live through `capture_revealable?`
(capture_proofs.rb:361), so the secret is served the instant the evidence holds,
and the next page bootstrap stamps it (bootstrap `stampable_captures?` still uses
`unproven_captures?`, not the flag). The only withholding window is narrow and
branch-only: evidence lands via a sync, the page is never reloaded, and the
evidence then stops holding (read-mail trim, or the client retracting
`se_landing_pages` victim.submitted) before any bootstrap.

Since the branch is unreleased, main has no such flagless entries; only branch
test games (e.g. 1972 / 1977) could. A one-off belt-and-braces option: at
bootstrap, set `phishGated` on any flagless unproven entry that
`phish_evidence_page_for` matches. In practice the bootstrap already stamps those
entries `proven: true`, which supersedes the flag, so a code change may not be
worth it; worth a line in the build log so the gap is a known, bounded one.

## Tests run (affected files, no lock, per the test-lock rule)

All green.

- Rails (RBENV_VERSION=2.7.8): `clone_card_saved_cards_test`,
  `capture_proofs_test`, `access_model_rfid_test` -- 82 runs, 377 assertions, 0
  failures, 0 errors.
- Red-check: reverted the n1 guard, ran the n1 test alone -> 1 failure (as
  expected), restored `game.rb` from HEAD (`git checkout --`, no commit). m1 / n2
  reasoned from the `CaptureHotPathSpy` counters (each assertion is the exact
  post-fix count).

The case F tests are genuine guards: the confirm test asserts the backfilled
record's `source` is the met NPC and the door opens after a reload; the drop test
asserts no record is minted and the door stays refused when the holder was never
met. The hot-path tests assert zero extra mail walks / fingerprints on a plain
sync. A regression in the backfill gating or the stamp gating would fail them.

## No live check run

Static review and the affected suites settled every question in scope; the build
log's live case F (games 1972 / 1977, old tab across a server swap) already
exercises the backfill on the shared dev DB. I did not start a keyless server.
