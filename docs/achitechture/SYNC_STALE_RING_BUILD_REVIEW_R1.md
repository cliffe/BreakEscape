# Sync stale-but-recent ring: build review, round 1 (chunks 1 to 3)

Reviewer, round 1. Range `c7831c5d8..93115fe74` on `build/hard-sync-ring-plan`,
worktree `p-hard-sync-ring`. Review only, no code edits. Spec
`SYNC_STALE_RING_PLAN.md`, build log `SYNC_STALE_RING_BUILD_LOG.md` (drifts D1,
D2, D3, D4 and the D4 orchestrator decision read and checked).

## Verdict: SHIP CHUNKS 1-3

Counts: Blocker 0, Major 0, Minor 2.

The server work meets the bar. A stale request never undoes a newer write (the
skip set is `>=` and the completeness guard falls back to whole-skip when a newer
write may have been evicted); `syncWrites` stays fixed-size (normalise runs on
every append, nothing else writes it) and is never serialised to the client (leak
tests scan real bodies); a no-op resend records nothing and issues no UPDATE.
The two Minors are a comment that overstates what the current client does and a
set of answer fields that are inert until the chunk-4 client lands; neither loses
progress or admits a stale overwrite. The pre-filter is proven correct by
mutation for three sections. I ran the touched and neighbour suites green and
restored a clean tree.

## What I verified

- Suites (RBENV 2.7.8, focused, no lock): `sync_ring_test` + `sync_stale_ring_test`
  + `sync_stale_ring_merge_test` 34 runs / 188 assertions, 0 failures.
  `capture_proofs_test` + `mail_state_sync_test` + `current_room_guard_refusal_test`
  + `reload_persistence_test` 120 runs / 531 assertions, 0 failures.
- Mutation proof (check 3): changed the pre-filter at games_controller.rb:2390
  (`kept = hash.reject {...}` to `kept = hash`, i.e. under-filter). The merge
  suite then failed three per-section cases: globalVariables
  (`a claimed key is skipped...` the older `g` overwrites the newer), mailState
  (`mailState compound keys...` the older `m2` overwrites the newer) and
  phoneState (`...skips only that contact` alice kept Old). Restored the file with
  `git show HEAD:... > ...`; tree clean (only `node_modules` untracked).

## Findings

### Minor 1: the stale-answer comment and commit message overstate the client (check 5)

games_controller.rb:919-924 and commit 93115fe74 add `notSaved`/`mailTrimmed` to
the stale answer body and say "the notSaved contract holds on this path (the
client marks the refused section confirmed rather than nothing)". The shipped
client does not do that. `state-sync.js:1003` (`_applyAnswer`) returns on
`answer.stale` before it reads `notSaved` (1004-1016), before it confirms
(1017-1019) and before the `mailTrimmed` reconcile (1027-1028). So on a
stale-but-recent answer the client confirms nothing and skips the mailTrimmed
reconcile. The fields are inert with this client.

This is safe, not a save-loss:
- A refused room does not loop. The client resends currentRoom, but the next
  periodic/request-soon sync carries a higher stamp and is fresh, so the server
  refuses it in a non-stale answer and the client confirms it there
  (state-sync.js:1017-1019). The resend is bounded by the burst, not infinite; a
  fresh sync lands within the 30 s periodic cadence, and a reload bootstraps from
  the server room regardless.
- mailTrimmed is not permanent divergence. The client keeps the mail unconfirmed
  and resends it; the next fresh sync re-trims and reports `mailTrimmed` in a
  non-stale answer, which the client reconciles (state-sync.js:1028). The client
  does not keep mail the server dropped past the next fresh sync (or a reload).

Failure scenario if left unflagged: a chunk-4 author reads the comment and the
commit and assumes the client already honours the stale answer's
`notSaved`/`mailTrimmed`, so they do not add the client handling, and the
one-sync reconcile lag ships silently as if intended. Fix: correct the comment to
say the fields are for a future client (chunk 4) and that today's client
reconciles on the next fresh sync; and have chunk 4 explicitly own processing
`notSaved`/`mailTrimmed` on a stale answer (process them before the `answer.stale`
early return, without confirming on a stale answer) if the one-sync lag is not
wanted. Not required for chunks 1-3 to be correct.

### Minor 2: the stale answer's added fields run through every part's onAnswer unchanged (check 5)

`_applyAnswer` calls `part.onAnswer?.(answer)` for every flush part
(state-sync.js:1002) before the stale early return, so the hidden-flush parts now
see a stale answer that carries `notSaved`/`mailTrimmed`. I traced the parts'
`onAnswer` and it keys off the request stamp, not these fields, so there is no
behaviour change today. Logged only so chunk 4 keeps it in view when it starts
reading those fields on the stale path. No failure scenario on chunks 1-3.

## Checks 1 to 7, traced

1. Recorder (sync_ring.rb, games_controller.rb `ring_write_map`,
   `changed_hash_keys`, `changed_mail_keys`, `changed_note_ids`): records only
   keys a merge changed, by diffing a pre-merge deep-dup snapshot
   (`ring_before_snapshot`) against the stored value. Deletions are recorded by
   name (key union picks up a removed key). playerHealth and timedMessages are
   whole-section `true` (`RING_WHOLE_SECTIONS`), currentRoom whole `true`.
   mailState claim keys are the dotted top-level params strings (drift D1,
   identity with the plan's `claim_key_for` join; `mail_value_at` mirrors the
   first-dot split, so an id containing a dot round-trips). Grow-only sections are
   in no ring list and not snapshotted, so never recorded (triggeredEvents too,
   though the client sends it keyed). Appended after the merges
   (`record_ring_write!` runs after `merge_last_write_wins_sections`). A no-op
   resend yields an empty `w`, so `record_ring_write!` returns before touching
   `syncWrites` and the `@game.changed?` guard still suppresses the UPDATE
   (test `an unchanged resend ... writes no ring entry and no UPDATE`).

2. Stale-but-recent band (`stale_sync_request?`, `stale_recent_guard_holds?`):
   guard holds when `ts >= min(entry ts)` of the stored (already-normalised) ring;
   empty ring returns true and merges against an empty skip set (explicit
   empty-ring branch, test line 59). Reset (over ten minutes below) clears
   `syncWrites` in the same write that lowers the stamp (test line 188, re-engages
   after). Skip set uses `>=` (sync_ring.rb:71), so a same-ms cross-tab entry is
   still skipped. Edge cases: an expired ring cannot arise (normalise trims to the
   60 s window on every append, so the stored min is always within window); two
   tabs resolved by `>=`; a format 409 raises `ActiveRecord::Rollback` before
   `@sync_client_ts` and before `stale_sync_request?`, and the rollback undoes the
   `save!`, so neither the stamp nor the ring is written; the guard failing drops
   to `@stale_recent = false`, so neither merge branch runs and nothing is
   recorded (test line 85). `@not_saved` is initialised at :839 and `@mail_trimmed`
   is read with `.present?`, so the stale render branch cannot NoMethodError.

3. Pre-filter (`ring_filter_section`, `ring_whole_claimed?`): every
   last-write-wins section in `merge_last_write_wins_sections` is filtered;
   whole-replace sections and currentRoom gate on `ring_whole_claimed?`; notes
   filter per id and honour a `:whole` collapse. Proven by mutation for three
   sections (above).

4. D4 (capture serving on the stale-but-recent band): the band still passes
   `stale: true` to `apply_capture_sync_step` (games_controller.rb:893), so the
   request never stamps a capture proof; serving reads live evidence, which holds
   because the pre-filtered mailState and landing globals are merged. Every secret
   field comes from the scenario, nothing is forged, no newer write is undone, so
   a client gains nothing a fresh request carrying the same evidence would not.
   The split 6b tests are real and pass: `...carrying the evidence records and
   serves` (empty-ring stale-but-recent, secret served) and `a fully stale
   request records but does not serve ... the next fresh sync serves` (guard
   fails on a higher anchor entry, mail whole-skipped, secret deferred). Matches
   the logged decision.

5. Chunk 3 currentRoom and the stale answer: traced in Minor 1 and 2. The
   server-side currentRoom gate itself is correct (`!ring_whole_claimed?` skips a
   claimed room with no viaPass credit, test line 147; an unclaimed room takes
   normal acceptance, line 161; a forged room is notSaved with no credit and the
   rest of the batch commits, line 174).

6. Leak and burst tests: `sync_stale_ring_test` scans real response bodies
   (`refute_includes response.body, 'syncWrites'`) for the bootstrap scenario
   payload, a fresh and a stale sync answer, and the objectives echo, asserting
   `savedGlobalVariables` still ships. The size-bound test runs 60 syncs (every
   tenth a 40-key collapsing set) and asserts the stored ring is 8 entries or
   fewer, under 10 KB serialised, and every kept entry within the 60 s window; a
   separate test asserts expiry past 60 s. Real and sound.

7. Ruby 2.7 and lock: the new keyword args (`merge_last_write_wins_sections(skip:)`,
   `SyncRing.normalise(..., max:, window_ms:, keys_per_entry:)`) are passed as
   explicit keywords with no hash-splat or positional-hash ambiguity, so no 2.7
   keyword-separation pitfall. The ring read, guard, skip-set build, every merge
   and the append all run inside the single `Game.lock` transaction opened at
   sync_state's top, so two syncs for one game cannot interleave their ring reads
   and writes; the second blocks and reloads post-commit.
