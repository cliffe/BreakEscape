# Sync stale-but-recent ring: build review, round 3 (chunks 1 to 3)

Reviewer, round 3. Worktree `p-hard-sync-ring`, branch `build/hard-sync-ring-plan`,
tip `7e7429487` (merges chunk 4 client work and main `9e23e384b`). The server fix
under review is `c532eac4e`, which closed R2's one Major and two Minors. Review
only, no code edits. Base for "before" comparisons is `c7831c5d8`. Read first: the
R2 review (`SYNC_STALE_RING_BUILD_REVIEW_R2.md`) and the "Build review R2 fixes"
section of `SYNC_STALE_RING_BUILD_LOG.md`.

## Verdict: SHIP.

Counts: Blocker 0, Major 0, Minor 0.

All three R2 findings are fixed in code and pinned by tests that drive real
`PUT sync_state` requests. The main merge did not touch the sync path. The ship
bar holds: no stale request undoes a newer write, a legitimate player is never
permanently refused, and the ring is fixed-size and never sent to the client.

## R2 fixes, confirmed in code

### Major 1 (empty or absent ring now a guard failure)

`stale_recent_guard_holds?` (games_controller.rb:2267) now returns `false` for a
nil or non-array or empty ring (games_controller.rb:2269), where R2 returned
`true`. On a stale-but-recent request the false sends `sync_state` down the
whole-skip fall-back (ring_before stays nil, the key-by-key merge branch at
games_controller.rb:883-884 is not taken), so no last-write-wins key is applied
and no older value can land over a newer one.

Reachable only with `lastSyncClientTs` set: confirmed. The guard is called only
from `stale_sync_request?` (games_controller.rb:2235), inside the branch guarded
by `stored.is_a?(Numeric) && client_ts <= stored` (games_controller.rb:2230).
`stored` is `player_state['lastSyncClientTs']`, so the guard never runs for a
game without a numeric stamp. A game with no stamp takes the fresh path and is
never stale.

The seeded pre-deploy, expired and reset tests drive real requests: confirmed.
`sync_stale_ring_merge_test.rb`'s `sync` helper is
`put sync_state_game_url(@game), params:, as: :json` (sync_stale_ring_merge_test.rb:40),
and `ps` reloads from the database. The three added tests seed state with
`@game.update!` then issue a real stale `PUT`:
- pre-deploy (stamp 5000, `doorOpen` true, no `syncWrites` key): the stale
  `doorOpen` false is whole-skipped, true stands, stamp not moved.
- empty array (`syncWrites` => []): same assertion, the expired or reset case.
- post-reset: a real fresh request sets the stamp, a clock set back more than ten
  minutes clears the ring through a grow-only request, then a stale request is
  whole-skipped.
The old "merges every key" case is rewritten to assert the key is now whole-skipped
(sync_stale_ring_merge_test.rb). Loss by this change is only gap 1 recovery of the
very first reduced flush body before any last-write-wins ring entry exists; the
client resends on its next fresh sync, so nothing is permanently dropped.

### Minor 1 (scoped mail snapshot)

`ring_before_snapshot` (games_controller.rb:2277) no longer deep_dups the whole
`mailState`; `mail_before_snapshot` (games_controller.rb:2299) deep_dups only the
request's incoming claim keys' before-values, keyed by the dotted claim key, and
`changed_mail_keys` (games_controller.rb:2381) reads that map by key.

Deletion and changed-key detection stay exact, including the two edge cases:
- `mail_before_snapshot` captures `mail_value_at(ps['mailState'], k).deep_dup` for
  each incoming key before the merge mutates the mailbox, so `before[k]` is the
  same value the old whole-section snapshot would have yielded at that key. The
  deep copy means the later merge cannot change it.
- A dotted key whose message is deleted: the merge removes the message, so
  `mail_value_at(after, k)` returns nil (the message id is not found in the
  mailbox's messages, games_controller.rb:2400), while `before[k]` holds the
  deep-copied message hash. Hash != nil, so the key is recorded as a change.
- A mailbox that empties: the claim key is still a message-level dotted key;
  `mail_value_at(after, k)` returns nil once the box or its messages are gone,
  against a non-nil `before[k]`, so the change is recorded.
Only incoming keys can ever be recorded, which matches the old behaviour
(`changed_mail_keys` always selected from `incoming.keys`), so no mail change
outside the incoming set was ever in scope. The scoped lookup is also cheaper on
the per-key path, matching the build log bench.

### Minor 2 (ring byte bound, MAX_KEY_BYTES 128)

`SyncRing::MAX_KEY_BYTES = 128` (sync_ring.rb:27); `collapse_entry`
(sync_ring.rb:53) collapses any per-key section holding a claim key whose
`bytesize` exceeds the cap to a whole-section claim (sync_ring.rb:55-59) before
the count collapse runs. With each kept claim key at most 128 bytes and at most
`keys_per_entry` (32) keys per entry and at most `max` (8) entries, the ring is
bounded in bytes, not only in count.

No honest key can exceed 128 bytes and lose ring precision. Scanning `scenarios/`:
the longest `globalVariables` reference is 24 bytes (`phish_hampshire_attempts`),
the longest ink variable name 43 bytes
(`npc_netherton_discussed_difficult_decisions`), the longest message id 52 bytes,
so the worst-case dotted mail claim key (`mailboxes.<box>.<msgid>`) is about 63
bytes. Every honest claim key is under half the cap. If a key ever did exceed it,
the loss is quantified and safe: the entry's whole section becomes a whole-section
claim, so a stale-but-recent request whole-skips that section instead of
key-filtering it. That is conservative (it can only forgo a gap 1 recovery, never
put an older value over a newer one), so correctness holds. The one interaction to
note, by design and documented: a single over-long key collapses the whole section
for that entry, so co-occurring short keys in that one entry also lose their gap 1
recovery; it self-heals on the next recorded write and never affects safety.

## Main merge did not disturb the sync path

`git diff c532eac4e 7e7429487 -- app/controllers/break_escape/games_controller.rb
app/models/break_escape/game.rb app/models/break_escape/sync_ring.rb` is empty: the
merge of `9e23e384b` left all three files byte-identical to the R2 fix commit. The
only server file the merge changed in the range is
`app/views/break_escape/games/show.html.erb` (removal of an unstyled
`.popup-overlay` div, commit `9461c5659`, a HUD change), which is not on the sync
path.

## Whole-range pass (c7831c5d8..7e7429487, server files) against the bar

Server files changed in the range: `games_controller.rb` (sync_state and the ring
helpers), `sync_ring.rb` (new), and the unrelated `show.html.erb` view line above.

- No stale request undoes a newer write. A stale-but-recent request either merges
  key by key against a complete ring (`skip_set` unions every entry with ts >= the
  request ts, sync_ring.rb:83-99, so any newer recorded key is skipped) or, when
  the ring cannot vouch for completeness (absent, empty, expired or reset-cleared),
  whole-skips every last-write-wins section (the Major 1 fix). The stamp is never
  moved on a stale request (games_controller.rb:2232-2236), so an unclaimed key it
  does apply is one no newer accepted request wrote. A fully-stale request (outside
  the ten-minute window) still defers the whole last-write-wins merge as before.
- A legitimate player is never permanently refused. A stale request still runs the
  grow-only and capture steps (games_controller.rb:889-894) and answers
  `{ stale: true }`, and the client resends on its next fresh request (clientTs
  increases within a page), so any key whole-skipped or refused here lands on the
  next fresh sync. Format and cap refusals are pre-existing and target too-new or
  oversized data, not honest stale flushes.
- The ring is fixed-size and never sent. `normalise` bounds the ring to 8 entries,
  32 keys per entry and now 128 bytes per claim key on every append
  (games_controller.rb:2324-2327), and nothing else writes `syncWrites`. It lives
  in `player_state` under `SYNC_STATE_COLUMNS` (games_controller.rb:2150) so it
  persists under the row lock, but the bootstrap payload is an allowlist that
  attaches named player_state keys to `filtered` (games_controller.rb:321-365) and
  never `syncWrites`; `grep syncWrites app/` outside the controller and the model
  is empty, so it is read and written only inside `sync_state` and never
  serialised to the client. It is not part of the client-resent state either, so
  the SYNC SIZE RULE holds.

## Notes

- Concurrency, hostile clientTs and weakened-tests checks from R2 are unchanged by
  `c532eac4e` (the transaction, row lock and `stale_sync_request?` reset branch are
  untouched) and still hold; not re-traced in full here.
- Tests were traced by reading, not executed (review only, shared databases). The
  added cases issue real requests and assert on reloaded state, so they exercise
  the controller path, not a helper in isolation.
