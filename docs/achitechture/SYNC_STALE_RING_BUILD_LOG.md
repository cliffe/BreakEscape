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

- None material. currentRoom is stripped by gating its inline block on
  `skip.nil?` (so a stale-but-recent request never reaches it), matching the
  plan's "stripped from the params it sees" for chunk 2; chunk 3 replaces this.

Tests (chunk 2): PENDING FIRST RUN.

## Chunk 3: currentRoom under the stale-but-recent path

PENDING.

## Handover

(To be filled if the context limit is reached mid-build.)
