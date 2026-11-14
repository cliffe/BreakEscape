# Sync stale-but-recent ring: build log

Builds section 11 of `SYNC_STALE_RING_PLAN.md`, chunks 1 to 3 only. Chunk 4 (the
client re-stamp) and later are out of scope for this builder, so the controller
gap 2 / gap 3 / gap 1 interleaving tests, which exercise the shipped re-stamped
order, are not added here (they belong with chunk 4).

Worktree `p-hard-sync-ring`, branch `build/hard-sync-ring-plan`.

## Chunk 1: ring storage, helpers, record-only path

Scope: the `syncWrites` ring in `player_state`, the recorder (records only the
keys a merge actually changed), the normalisation to the fixed bound, the
skip-set build helper (the read path that consumes it is chunk 2), plus the
never-sent and no-op-no-UPDATE tests. Fresh requests write the ring; nothing
reads it yet.

Files:

- `app/models/break_escape/sync_ring.rb` (new): `BreakEscape::SyncRing`, the pure
  ring maths. `normalise(ring, max:, window_ms:, keys_per_entry:)`,
  `collapse_entry`, `entry_key_count`, `skip_set(ring, ts)`. Unit-testable
  without HTTP.
- `app/controllers/break_escape/games_controller.rb`: ring constants
  (`SYNC_RING_MAX = 8`, `SYNC_RING_WINDOW_MS = 60_000`,
  `SYNC_RING_KEYS_PER_ENTRY = 32`), `RING_KEYED_SECTIONS`, `RING_WHOLE_SECTIONS`;
  `@sync_client_ts` captured in `sync_state`; `ring_before_snapshot`,
  `record_ring_write!`, `ring_write_map`, `changed_hash_keys`,
  `changed_note_ids`, `note_index`, `changed_mail_keys`, `mail_value_at`,
  `ring_skip_set` (delegates to the module).
- `test/models/break_escape/sync_ring_test.rb` (new): normalisation and skip-set
  unit tests.
- `test/controllers/break_escape/sync_stale_ring_test.rb` (new): record-only
  behaviour, the bound, the burst, and the never-sent tests.

How "record only what changed" is done: `ring_before_snapshot` deep-copies the
last-write-wins sections before the merge; after the merge, `ring_write_map`
diffs stored before vs after per section. This gives "only keys a merge changed"
for free, covering server-owned drops, notSaved refusals, cap rejections, a
refused currentRoom and deletions (a tombstone is a change, recorded by name),
without touching any `merge_*!` method.

### Integrator addition (1): leak tests

`sync_stale_ring_test.rb` drives real requests and scans the raw response bodies
for `syncWrites`: the bootstrap scenario payload, a fresh and a stale
`sync_state` answer, and the objectives echo. All assert the string is absent
while `savedGlobalVariables` still ships. The ring is added to `player_state`
only; the bootstrap builds `filtered` key by key and no sync answer serialises
`player_state`, so the key is structurally unreachable by the client.

Format fixtures/corpus: `format_version_test`, `format_deployed_scenarios_test`
and `format_upgrade_test` build their own `player_state` fixtures and never call
`sync_state`, so none carries `syncWrites`; the whole-`player_state` equality
check in `format_version_test` (a no-op upgrade on an unsynced game) is
unaffected. No exclusion was needed; confirmed by running those files (see
counts).

### Integrator addition (2): size-bound burst

`sync_stale_ring_test.rb` "a long burst of syncs keeps the ring at or under 8
entries and ~8 KB" runs 60 syncs in quick succession, every tenth writing a
40-key global set that collapses, then asserts the stored entry count is 8 or
fewer, the serialised ring is under 10 KB, and every kept entry is within the
60 s window. A separate test asserts an entry more than 60 s below a newer write
is expired.

### Drift (chunk 1)

- D1 (not material). The plan's section 4 shows a `claim_key_for(path)` that
  joins the `mail_state_updates` array path back to a dotted string. The recorder
  instead derives the mailState claim key directly from the top-level
  `params[:mailState]` key (already the dotted string the client sent) and
  records it only when the stored value at that key changed. The string recorded
  is identical to the plan's join (both are the dotted form, identity on
  `mailboxes.<box>.<msgId>` including ids containing a dot, because the parse
  splits on the first dot after the prefix), and using the params key avoids a
  dependency on a private model method. Same canonical key, same pre-filter
  comparison in chunk 2.
- D2 (not material). The pure ring maths live in a new `BreakEscape::SyncRing`
  module rather than inline private controller methods, so normalisation and the
  skip-set build can be unit-tested directly (the plan allows "a model test if
  the ring helpers live in Game"). The controller keeps the diff/record logic
  (it needs `player_state` and params).

Tests (chunk 1): `sync_ring_test.rb` 9 runs; `sync_stale_ring_test.rb` 15 runs;
both green. Neighbours green: `reload_persistence_test`, `capture_proofs_test`,
`captures_sync_test`, `mail_state_sync_test` (123 runs together);
`current_room_guard_refusal_test`, `saved_current_room_test`,
`format_version_test`, `format_upgrade_test`, `format_deployed_scenarios_test`
(56 runs together).

## Chunk 2: stale-but-recent band, guard, pre-filter

Scope: the middle band in `stale_sync_request?`, the completeness guard, the
empty-ring branch, clearing `syncWrites` on the ten-minute reset, and the
key-by-key pre-filter in `merge_last_write_wins_sections`. currentRoom is
whole-stripped on any stale-but-recent request (handled inline, not by a
`merge_*!` call) until chunk 3. `apply_capture_sync_step` already received
`stale: true` on every stale request (chunk 1 did not change that), so capture
proof stamping is deferred to the next fresh sync exactly as today.

Files:

- `app/controllers/break_escape/games_controller.rb`: `@stale_recent` set in
  `stale_sync_request?` (three bands: fresh, stale-but-recent, fully stale);
  reset branch clears `syncWrites`; `stale_recent_guard_holds?`;
  `sync_state` runs `merge_last_write_wins_sections(skip: ring_skip_set(...))` on
  the stale-but-recent path; `ring_filter_section`, `ring_whole_claimed?`; every
  section in `merge_last_write_wins_sections` pre-filtered.
- `test/controllers/break_escape/sync_stale_ring_merge_test.rb` (new): empty-ring
  branch, guard holds vs falls back (the >8 burst), the key-by-key pre-filter,
  mailState compound keys, phoneState by npc id, currentRoom whole-strip, and the
  reset-clearing re-engage test.

The guard holds when the request's ts is at or above the oldest retained ring
entry's ts; an empty ring merges against an empty skip set (the explicit
empty-ring branch). The stale-but-recent path never moves `lastSyncClientTs`;
the request's ring entry is recorded at its own (lower) ts.

### Drift (chunk 2)

- D3 (currentRoom strip, not material). currentRoom is stripped by gating its
  inline block on `skip.nil?` (so a stale-but-recent request never reaches it),
  matching the plan's "stripped from the params it sees" for chunk 2; chunk 3
  replaces this.

- D4 (MATERIAL, STOPPED HERE). The plan (section 11.2) says a stale-but-recent
  request keeps the phish proof mail and that "capture proof stamping is deferred
  to the next fresh sync, exactly as today". The ring does keep the mail: on the
  stale-but-recent path mailState is a pre-filtered last-write-wins section, so it
  is merged (the intended gap-1 recovery). But the capture *serving* endpoint
  does not depend on the proven stamp: `CaptureProofs#capture_revealable?`
  (capture_proofs.rb:420) returns true when `capture_evidence_holds?` now, even
  for an entry still `proven: false`. So once the mail is kept, the live evidence
  holds and GET /capture_secrets reveals the real credential on the
  stale-but-recent request, where before chunk 2 (fully-stale whole-skip) the mail
  was not merged, the evidence did not hold, and serving was deferred to the next
  fresh sync.

  Effect on tests: `capture_proofs_test.rb` test "6b: a stale request records but
  does not serve a phish credential" (line ~481) now fails its
  `assert_equal({}, secrets, 'a stale request does not serve the secret')`: the
  secret `{ 'phished' => 'Land-Secret-1' }` is served on the stale-but-recent
  clientTs:5 request. Every other assigned neighbour passes.

  Why this is not a cheat/safety regression: the credential is only revealed when
  the server-validated live evidence holds (the landing page meetsThreshold plus
  the sent phish message carrying the link kit). The stale-but-recent path runs
  the same `merge_mail_state!` and the same evidence check a fresh sync runs;
  every secret field comes from the scenario, not the client. Nothing is forged
  and no newer write is undone. The old deferral was an artifact of the all-or-
  nothing stale whole-skip, which is exactly what the ring removes. So the
  behaviour is defensible, but it changes a capture-proof security test, which is
  a judgement call outside a builder's remit.

  Decision needed from the orchestrator/user (do NOT let a builder weaken a
  security test unilaterally):
  - Option A: accept it. Update capture_proofs_test 6b to expect the secret
    served on the stale-but-recent request (the honest evidence genuinely holds),
    and add the plan's chunk-2 capture test as "mail kept, served once evidence
    holds".
  - Option B: preserve deferral. Keep a stale-but-recent request from advancing
    capture serving, e.g. exclude mailState (and se_landing_pages) from the
    stale-but-recent merge, or gate `capture_revealable?` on the stamp. Excluding
    mailState forgoes the plan's gap-1 recovery for mail, so this needs a plan
    amendment.

  Per the brief ("If the drift is material, stop and report it"), the build
  stopped at the end of chunk 2. Chunk 3 (currentRoom under the stale-but-recent
  path) is NOT built, to avoid compounding work on an unresolved decision.

  DECISION (orchestrator, 2026-11-14): option A. A stale-but-recent request now
  merges its pre-filtered mailState, capture serving reads live evidence, so a
  phish credential can be served on that request. Reason: the evidence is exactly
  what a fresh request would carry, so a client gains nothing it could not get
  with a fresh request, and it is the gap recovery the plan intends. Every secret
  field still comes from the scenario, not the client; nothing is forged and no
  newer write is undone. The old deferral was an artefact of the all-or-nothing
  whole-skip the ring removes. `capture_proofs_test.rb` 6b was split into two
  cases to match: (a) a stale-but-recent request carrying the evidence records AND
  serves it; (b) a FULLY stale request (guard fails, or outside the 60 s window)
  records but does not serve, and the next fresh sync serves. The plan's section 5
  and section 11 (chunk 2) were amended to state the stale-but-recent capture
  behaviour accurately. No other assertion weakened.

Tests (chunk 2): `sync_stale_ring_merge_test.rb` 8 runs, green. Neighbours:
`games_controller_test` 63, `game_state_locking_test` 6,
`reload_persistence_test`, `captures_sync_test`, `mail_state_sync_test`,
`current_room_guard_refusal_test`, `saved_current_room_test` all green;
`capture_proofs_test` 1 failure (6b), see D4 above.

## Chunk 3: currentRoom under the stale-but-recent path

Built. The `skip.nil?` gate on the inline currentRoom block in
`merge_last_write_wins_sections` is replaced with
`!ring_whole_claimed?('currentRoom', skip)`:

- A fresh request has `skip` nil, so `ring_whole_claimed?` is false and the block
  runs exactly as before (unchanged behaviour).
- A stale-but-recent request whose currentRoom a newer ring entry claimed (the
  recorder records currentRoom as a whole-section `true`) skips the block whole,
  so the newer stored room stands and no viaPass credit runs for the skipped room.
- A stale-but-recent request with an unclaimed currentRoom runs the normal
  `may_sync_current_room?` acceptance, the `credit_via_pass_on_sync!` viaPass
  credit and the notSaved contract exactly as an accepted room does.

No recorder change was needed (currentRoom was already recorded as a whole-section
claim in chunk 1). The only change is the one gate condition and its comment.

Files:

- `app/controllers/break_escape/games_controller.rb`: the gate swap and comment in
  `merge_last_write_wins_sections`.
- `test/controllers/break_escape/sync_stale_ring_merge_test.rb`: the chunk 3
  currentRoom cases (older claimed room skipped with no credit; unclaimed room
  accepted; forged room notSaved with no credit, rest of the batch commits). The
  chunk 2 "whole-stripped until chunk 3" currentRoom test was retargeted to the
  claimed-room case; its section header and the file header comment were updated.

Tests (chunk 3): `sync_stale_ring_merge_test.rb` 10 runs, green.

## Handover

- Done and committed: chunk 1 (ring storage, helpers, record-only, bound,
  never-sent, burst), chunk 2 (stale-but-recent band, guard, pre-filter,
  reset-clearing, currentRoom whole-strip) and chunk 3 (currentRoom under the
  stale-but-recent path). D4 decided (option A): capture_proofs_test 6b split into
  a stale-but-recent serve case and a fully-stale defer case; plan sections 5 and
  11 amended. Chunk 1, 2 and 3 own tests green.
- Open / blocked: chunk 4 (client re-stamp) and later are out of this builder's
  scope, not started.
- In progress: none.
- Files touched: `app/models/break_escape/sync_ring.rb` (new),
  `app/controllers/break_escape/games_controller.rb`,
  `test/models/break_escape/sync_ring_test.rb` (new),
  `test/controllers/break_escape/sync_stale_ring_test.rb` (new),
  `test/controllers/break_escape/sync_stale_ring_merge_test.rb` (new),
  `docs/achitechture/SYNC_STALE_RING_BUILD_LOG.md` (new).
- Commits: chunk 1 `147fa3c33` (+ test fix `follow-up`), chunk 2 `8e591bc11`
  (+ test fix follow-up). See `git log`.
- Gotchas: capture serving reads live evidence, not the proven stamp (D4);
  the ring entry for a stale-but-recent request is recorded at its own lower ts;
  the reset request clears the pre-reset ring then records its own fresh entry
  (so the ring is not empty after a reset, only free of pre-reset stamps).

## Build review R1 (chunks 1 to 3)

SYNC_STALE_RING_BUILD_REVIEW_R1.md: SHIP CHUNKS 1-3, 0 blockers, 0 majors, 2 minors. Minor 1, the stale-answer comment that overstated what the client does with notSaved and mailTrimmed, is corrected in games_controller.rb: the client returns early on a stale answer and reads neither field, and the next fresh answer carries them. Chunk 4 owns any client handling of the stale path. Minor 2: the stale answer's fields pass through every part's onAnswer before the early return. The parts key off the stamp, so nothing changes today. Chunk 4 re-checks it.
