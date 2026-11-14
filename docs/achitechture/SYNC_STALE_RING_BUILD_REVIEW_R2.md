# Sync stale-but-recent ring: build review, round 2 (chunks 1 to 3)

Reviewer, round 2. Range `c7831c5d8..d00c2862a` on `build/hard-sync-ring-plan`,
worktree `p-hard-sync-ring`. Review only, no code edits. Read first: R1 review
(`SYNC_STALE_RING_BUILD_REVIEW_R1.md`), the plan, and the build log (drifts D1 to
D4 and the D4 decision). Base for every "before" comparison is `c7831c5d8`.

## Verdict: DO NOT SHIP AS-IS. ONE MAJOR TO FIX.

Counts: Blocker 0, Major 1, Minor 2.

R1's two minors are resolved as far as chunks 1 to 3 need: the stale-answer
comment at games_controller.rb:919-930 now states plainly that today's client
returns early on a stale answer and reads neither `notSaved` nor `mailTrimmed`,
and that the next fresh answer carries them (Minor 1 of R1). Minor 2 of R1 (the
added fields pass through every part's `onAnswer` unchanged) is a client-side
chunk-4 note, nothing in this range touches it.

Reviewing fresh, the empty-ring completeness guard is correct for a game created
on this code but not for a game that already exists in production. Such a game
carries `lastSyncClientTs` (shipped earlier, in `5decddaef`) but no `syncWrites`
ring (new in this range, `147fa3c33`). The guard reads an absent ring as "nothing
newer was written", so the first stale-but-recent request after deploy merges its
last-write-wins sections against an empty skip set and can overwrite a value a
newer pre-deploy request wrote. The base code never merged last-write-wins
sections on a stale request at all, so this is a regression, not a pre-existing
gap, and it reintroduces the exact save-loss the ring exists to prevent. Details
and a fix direction in Major 1.

## What I verified

- `lastSyncClientTs` and `stale_sync_request?` exist in the base commit
  `c7831c5d8` (confirmed by `git show c7831c5d8:...`); `syncWrites`, the ring and
  `stale_recent_guard_holds?` are added in this range. So a production game can
  hold a stamp with no ring.
- Base stale handling: `c7831c5d8` sync_state runs
  `refusal = merge_last_write_wins_sections unless stale`, i.e. a stale request
  applied only the grow-only and capture steps and no last-write-wins merge.
- The only pre-existing test file the range changed is `capture_proofs_test.rb`.
  The old test `6b: a stale request records but does not serve` is split into two:
  a stale-but-recent case that now records AND serves (D4 option A, logged and
  signed off) and a fully-stale case that keeps the old `secrets == {}` deferral.
  Coverage is widened, not weakened. The other changed test files
  (`sync_stale_ring_test.rb`, `sync_stale_ring_merge_test.rb`, `sync_ring_test.rb`)
  are new in the range, so there is no prior assertion to weaken.
- deep_dup cost (Minor 1): measured `mailState.deep_dup` at the 1 MB cap
  (2065 messages, 1,000,220 bytes) under Ruby 2.7.8: ~5.7 ms per call,
  `bundle exec ruby` with active_support, 200 iterations warmed. Bench script in
  my scratchpad.

## Findings

### Major 1: an existing game's empty ring makes the first stale-but-recent request merge against an empty skip set and overwrite a newer write

`stale_recent_guard_holds?` (games_controller.rb:2257, the key line
games_controller.rb:2259 `return true unless ring.is_a?(Array) && ring.any?`)
returns true for a nil or empty ring. On a stale-but-recent request the guard's
true sends sync_state down the merge branch (games_controller.rb:876-884) with
`skip = ring_skip_set(@sync_client_ts)`, and `SyncRing.skip_set` returns `{}` for
a non-array ring, so every last-write-wins key in the stale request is merged.

The guard's premise, stated in its own comment, is "an empty ring means nothing
newer has been recorded yet". That holds for a game born on this code: by the
time `lastSyncClientTs` is set to T by a fresh request, either that request
changed a last-write-wins section and recorded a ring entry at T, or it changed
only grow-only sections and merging a stale request's last-write-wins keys loses
nothing. It does not hold for a game that predates the ring. `lastSyncClientTs`
shipped in `5decddaef` (before this range); `syncWrites` is new here. A game
already synced in production therefore has a stamp and no ring the moment this
code deploys.

Concrete scenario:
1. Production game, synced before deploy. A request at clientTs 5000 wrote
   `globalVariables['doorOpen'] = true` and set `lastSyncClientTs = 5000`. No
   `syncWrites` key exists (that code was not yet live).
2. This range deploys. Before any fresh sync on the new code re-records that key,
   a lingering old tab (or a duplicated or delayed unload flush) sends a stale
   request at clientTs 4000 carrying `globalVariables['doorOpen'] = false` (its
   value from before the door opened), within the ten minute reset window.
3. `stale_sync_request?` sees 4000 <= 5000 and 5000 - 4000 within
   `SYNC_STALE_RESET_MS`, so it is stale-but-recent and
   `@stale_recent = stale_recent_guard_holds?(4000)`. The ring is absent, so the
   guard returns true.
4. `merge_last_write_wins_sections(skip: ring_skip_set(4000))` runs with an empty
   skip set, so `merge_global_variables!({'doorOpen' => false})` overwrites the
   newer true.

Under the base code step 4 never ran (stale requests skipped the last-write-wins
merge), so the stale false was deferred and the saved true stood. The live page
has already confirmed `doorOpen` and will not resend it, so the overwrite
survives until the player changes the door again or reloads; on reload the client
bootstraps the server's false and the opened door is lost. This is user-visible
progress loss, in the same class the feature is meant to close.

Scope that keeps it Major rather than Blocker: it needs the deploy transition, a
stale (late or duplicate) request landing before a fresh new-code sync re-records
the affected keys, and a clientTs within the ten minute window. It self-heals for
any key the live client resends and re-records. But it is a real regression
against the base for real existing games, and it is untested: no case seeds a
game with a stamp, no ring and a prior conflicting last-write-wins value (the
empty-ring tests at sync_stale_ring_merge_test.rb:59 and capture_proofs_test.rb
use a grow-only first sync precisely so the empty ring is genuinely safe).

Fix direction (not applied, review only): make an absent ring distinguishable
from "ring active, nothing newer". Options: have `stale_recent_guard_holds?`
return false (fall back to today's whole-skip) when `syncWrites` is absent while
`lastSyncClientTs` is set; or initialise `syncWrites` to `[]` on the first fresh
sync on this code and treat a present-but-empty `[]` as "active, nothing newer"
while a missing key means "pre-ring, fall back". Add a test that seeds a stamp,
no ring and a conflicting global and asserts the stale request does not overwrite.

### Minor 1: the pre-merge deep-dup snapshot copies the whole mailState on every merging sync, about 5.7 ms and 1 MB of garbage at the cap

`ring_before_snapshot` (games_controller.rb:2267) deep_dups every recorded
section, mailState included (games_controller.rb:2271), on every fresh and every
stale-but-recent sync. Measured ~5.7 ms per mailState deep_dup at the 1 MB cap on
Ruby 2.7.8, plus roughly 1 MB of transient allocation each call, for a section
the diff barely reads: `changed_mail_keys` (games_controller.rb:2346) only
inspects the request's own incoming keys through `mail_value_at`, never the whole
mailbox. The snapshot of the other sections (globalVariables, the ink and npc
maps, notes) is small by comparison. On an active game near the cap this is a few
milliseconds and a megabyte of GC pressure added to every sync (roughly one per
client per thirty seconds). Not a correctness issue and well within budget, but
avoidable: snapshot only the mail values for the incoming keys (or capture their
before-values before the merge mutates them) rather than deep-dup the section.

### Minor 2: the ring bounds recorded keys by count, not by byte size, and global-variable key names are uncapped

`collapse_entry` and `normalise` (sync_ring.rb) bound an entry to
`SYNC_RING_KEYS_PER_ENTRY` (32) key claims and the ring to 8 entries in a 60 s
window, so the "fixed-size ring" guarantee is fixed-count, not fixed-bytes. A key
claim is the key's name, and `merge_global_variables!` (game.rb:801) applies no
length cap to a global-variable key name (contrast the explicit
`MAX_TRIGGERED_EVENT_KEY_LENGTH` and `MAX_CLOCK_KEY_LENGTH` caps nearby). A client
that writes a global under a very long key name has that name stored once in
`globalVariables` already, and the ring then records the same name in up to 8
entries within the window, so the ring's incremental exposure is a small multiple
of an uncapped value player_state already holds. The root (an uncapped
globalVariables key) predates this feature and is out of this range's scope, but
the ring inherits it, so the SYNC SIZE claim should read "bounded in key count;
each key's bytes are whatever globalVariables already stores" rather than
"fixed-size". A per-key length cap on recorded names, or on the global key
itself, would close it.

## Checks against the round 2 brief, traced

1. Concurrency. The ring read, the guard, the skip-set build, every merge and the
   append all run inside the one `Game.transaction` opened at sync_state's top,
   and `@game = Game.lock.select(*SYNC_STATE_COLUMNS).find` loads player_state
   fresh under `SELECT ... FOR UPDATE`, so two Puma threads for one game serialise
   on the row lock and the second reloads post-commit. No path appends without
   merging or merges without appending that persists: `record_ring_write!` runs
   only when `ring_before` is set, which is only on the two merge branches
   (games_controller.rb:874, 883) and only after the merge; a `refusal` raises
   `ActiveRecord::Rollback` before the append (games_controller.rb:886), undoing
   both merge and stamp; the format 409 rolls back before the stamp or ring is
   touched; and an error in the capture step, which runs after the append, aborts
   the whole transaction, so the append is rolled back with it. The append can be
   skipped while a merge ran (a no-op whose `ring_write_map` is empty), but then
   the merge changed nothing, so there is nothing newer to record.

2. Size and time (hostile clientTs). A non-numeric clientTs (a JSON string, null)
   fails `is_a?(Numeric)`, so `@sync_client_ts` is nil and the request records
   nothing and is treated as a pre-change client. A negative or fractional value
   passes and is `to_i`'d; it only ever becomes this game's own stamp and ring ts,
   never crosses games. A huge future clientTs cannot poison honest requests for
   long: the next honest request is more than ten minutes "older", which trips the
   reset branch in `stale_sync_request?`, clearing the ring and lowering the stamp
   to the honest value, so the honest request is treated as fresh. A future value
   within the ten minute window makes honest requests fall back to whole-skip (the
   guard fails on the future ring entry) only until wall-clock time passes it,
   bounded by that gap and by the reset, and only for the attacker's own game, so
   it delays the attacker's own saves and grants no access honest play could not
   reach (cheat policy). The ring cannot be grown in count (`normalise` on every
   append). The one unbounded axis is key-name bytes, Minor 2.

3. Performance. The deep-dup diff costs about 5.7 ms per sync at the 1 MB mailState
   cap, run on every merging sync. Minor 1.

4. Existing stored games. A game with no `syncWrites`: the empty-ring guard is
   unsafe for a pre-ring game, Major 1. A game reloaded mid-band: if clientTs is
   wall-clock based the old page's late flushes are stale-but-recent and merged
   key by key against the session's ring (safe); if a reload sets the clock back
   more than ten minutes the reset clears the ring and lowers the stamp together,
   so the new, lower timeline is treated as fresh and the lingering pre-reset
   entries do not keep the guard failing (R1 check 2, test
   sync_stale_ring_merge_test.rb reset case). The reset leaves a momentary empty
   ring, but because it lowers the stamp in the same write, later requests are
   fresh against the new low stamp rather than stale, so the Major 1 exposure does
   not arise from a reset the way it does from a pre-ring deploy.

5. Weakened tests. None. The capture_proofs_test change splits one test into two
   and keeps the deferral assertion for the fully-stale band while adding the
   serve assertion for the stale-but-recent band (D4 option A). Every other
   changed test file is new in the range.
