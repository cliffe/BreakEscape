# Sync stale-but-recent ring: plan review round 3

Verdict: READY TO BUILD.

Counts: 0 blockers, 0 majors, 2 minors.

Target: `docs/achitechture/SYNC_STALE_RING_PLAN.md` on `build/hard-sync-ring-plan`
(worktree `p-hard-sync-ring`, tip 815aad995, cut from integration train 47
b83696932). Review only: no code or plan edited, no server run, no db command, no
full suite. Every claim below was traced to the code in this worktree.

## The four round 2 minors are closed in the design

Each is a real change to the mechanism, not a reword.

- R2 m1 (empty-ring guard branch undefined): closed. Section 5 "Empty ring" now
  states the chosen branch outright: an empty ring is treated as an empty skip
  set and every key is merged, with the reasoning that an empty ring can only
  occur before the first last-write-wins write, so no newer write is unrecorded.
  Tested in section 10 ("empty-ring branch: the first reduced body that chases the
  very first flush ... merges all its keys").
- R2 m2 (ten-minute reset leaves the ring stuck on pre-reset stamps): closed.
  Section 5 "Clearing the ring on a reset" sets `syncWrites` empty on the reset
  branch, with the lingering-max dormancy argument spelled out and a test
  (section 10 "reset clears the ring"). Section 7 repeats it. Matches
  `stale_sync_request?` at games_controller.rb:2175-2178 (the branch that stores
  the lower `client_ts`), which is where the clear must ride.
- R2 m3 (mailState and phoneState pre-filter crosses a nesting boundary): closed
  and correct, traced below.
- R2 m4 (re-stamp line references): closed and correct. Section 8 now cites
  state-sync.js:971 (`oldest.clientTs - 1`), :972 (`if (clientTs <= oldest.prevTs)
  return null`), :980 (the genuine-empty null return that stays), :853-855 (the
  reservation that is removed) and :868-871 (the whole-delta branch that is
  unchanged). All five line references match the code.

## The compound-key pre-filter (brief question 1): correct, including deletions

Traced against `mail_state_updates` (game.rb:5494-5528), `merge_mail_state!`
(game.rb:5431-5480) and `merge_phone_state!` (game.rb:5198-5222), reached from
`merge_last_write_wins_sections` (games_controller.rb:2232-2248).

- mailState. `params[:mailState].to_unsafe_h` is a flat map whose top-level keys
  are the dotted compound keys the client built (games_controller.rb:2239-2240).
  `mail_state_updates` parses each: `mailboxes.` is stripped then split on the
  first dot only (`key.delete_prefix('mailboxes.').split('.', 2)`, game.rb:5499),
  giving `['mailboxes', box_id, msg_id]`; `threads.` is stripped whole
  (`key.delete_prefix('threads.')`, game.rb:5509), giving `['threads', key]`; and
  `jobs` / `drafts` / `metrics` stay scalar (game.rb:5518). The plan's
  `claim_key_for(path)` joins the array path with `.`, which is the exact inverse
  of those two operations, so a recorded claim key is byte-for-byte the dotted
  top-level params key the pre-filter later rejects on. A box id or message id or
  thread key that itself contains a dot round-trips, because `split('.', 2)` and
  `delete_prefix` keep the remainder intact and `join('.')` rebuilds it. So the
  recorder and the filter use the same string, and the plan's identity claim
  holds.
- Deletions match what the merge writes. A `null` value yields
  `updates[['mailboxes', box, msg]] = nil` (game.rb:5503) or
  `updates[['threads', key]] = nil` (game.rb:5513) or `updates[scalar] = nil`
  (game.rb:5520); the merge then deletes the message, thread or scalar
  (game.rb:5446-5466). `claim_key_for` records the same dotted key for a deletion
  as for a write, so a deletion is a claim by its dotted key, exactly as section 5
  "Deletions are claims" requires. The merge's side effects of removing an empty
  mailbox (game.rb:5453) or an empty `threads` container (game.rb:5461) do not
  break the mapping, because claims are recorded at message / thread granularity
  and the merge rebuilds the containers from the surviving leaves: a later
  stale-but-recent request carrying a different, unclaimed message in the same box
  is still applied and re-creates the box.
- phoneState. `params[:phoneState].to_unsafe_h` is keyed by npc id at the top
  level, and `merge_phone_state!` replaces or deletes per npc id
  (game.rb:5202-5212). The claim key is the npc id, which is the top-level params
  key, so no compound derivation is needed, as the plan states. The delete path
  (the `pendingCall` null marker, game.rb:5208-5211) records the npc id as a
  claim, matching what the merge writes.
- The worked example in section 5 (newer entry claimed `mailboxes.inbox.m2`, older
  D carries `m1` and the unique `m2`, `m2` dropped and `m1` applied) is the
  correct result and is the one only the canonical dotted-key filter produces. The
  two wrong implementations the plan calls out (a whole-section skip of mailState,
  or comparing the array path against the dotted params key) do fail here, so the
  section 10 test that pins the correct answer is the right guard.

One implementation note for the builder, not a finding: the recorder must key off
what the merge actually changed, not off every key in `mail_state_updates`.
`merge_mail_state!` assigns `box['messages'][index] = value` without an equality
check (game.rb:5449), and can trim messages while still saving
(`mail_trimmed_keys`, game.rb:5478), so to honour section 4's "record only what
the merge changed a stored value" the recorder should diff the merged mailState
against the prior `player_state['mailState']` rather than record every parsed
update. Over-recording a claim is safe for the invariant (it only forgoes a gap 1
recovery), but under the no-op-no-UPDATE rule the recorder must not append for a
mailState resend that changed nothing. The plan's general rule already covers
this; it is worth the builder's attention because mailState, unlike
globalVariables, does not report its changed keys.

## The re-stamp change at state-sync.js:968-981 (brief question 2): correct

Traced `_changesSinceInFlight` (state-sync.js:968-981), `flush`
(state-sync.js:836-928) and `nextClientTs` (state-sync.js:722-725).

- Line 971 is `const clientTs = oldest.clientTs - 1`, the below-stamp the plan
  replaces with a plain `nextClientTs()`. `nextClientTs` is
  `max(Date.now(), lastClientTs + 1)` and `lastClientTs` was advanced when each
  in-flight flush drew its stamp, so a fresh draw is strictly above every
  in-flight flush and above `stored` for its own page. So the re-stamped reduced
  body is never wrongly judged stale and carries the newest content, so "fresh" is
  correct, as the plan and the round 2 trace say.
- Line 972 is `if (clientTs <= oldest.prevTs) return null`, which the plan
  correctly identifies as the suppression that must be neutralised: it exists only
  to refuse a body with no slot below the oldest flush, and once the body is
  stamped above there is always a valid stamp. Leaving it while removing only the
  :853-855 reservation would still suppress a legitimate reduced body whenever
  `oldest.clientTs - 1 <= oldest.prevTs`. The plan says this.
- Line 980 returns `changes ? { ... } : null`, the genuine-empty case the plan
  keeps. Correct.
- The caller reservation at :853-855 and the whole-delta-if-it-fits branch at
  :868-871 are as the plan describes, and `_clearHiddenGuard` (:983-989, the
  round 3 m1 fix) is untouched by this change, matching section 8's "No other
  client change".

With D stamped above H, stamp order matches content order: H-first makes D fresh
and it applies; D-first makes H stale-but-recent, and the ring skips the keys D
wrote while merging H's unique keys. The ring is what keeps the re-stamp safe, as
section 8 states. The gap 2 and gap 3 interleavings in section 3 are labelled as
today's below-stamp regime that the fix removes, and the controller tests drive
the re-stamped order, so section 3 and section 10 are consistent.

## The invariant bar: no stale request undoes a newer write, no progress lost

Confirmed for the shipped design (all chunks):

- The row lock serialises every ring read, guard check, skip-set build, merge and
  append per game (`Game.lock`, games_controller.rb:840-841), so reordering is
  only across the network before the lock, which is what the ring addresses.
- The completeness guard (stale-but-recent only when `D.ts` is at or above the
  oldest retained entry's `ts`, else fall back to today's whole-skip) keeps the
  skip set complete: a newer write cannot be both evicted and unskipped while the
  guard holds, and when it fails the fall-back whole-skip is safe. Gaps 2 and 3
  close on either branch; only gap 1's shrink depends on the guard. This matches
  the round 2 trace and I re-derived it against section 4's append/expiry.
- The ring is bounded (eight entries, 60 s window, 32 keys per entry, about 8 KB
  of jsonb) and never sent: the bootstrap builds `initial_state` from
  `preserved_keys = %w[vm_set_id vm_ips flags_by_vm standalone_flags]`
  (games_controller.rb:268) and the sync answer is built from fixed fields
  (games_controller.rb:894-903), both of which drop `syncWrites`, exactly as they
  drop `lastSyncClientTs`. The delta-sync rule (section 9) is met: the ring holds
  only stamps and key names, does not grow, and is not re-sent.
- No new refusal: a stale-but-recent request returns `{ success: true, stale:
  true }` with the capture answer fields (games_controller.rb:894-897), and the
  client treats a stale answer as resend, so a slow, reordered or offline player
  is never refused and resends anything not confirmed.

## Decisions section consistent with the body

Q1 (player_state `syncWrites`) matches section 4. Q2 (per-key, 32-key cap,
whole-section `true` for playerHealth, timedMessages and currentRoom, grow-only
never recorded, deletions as key claims, record only changed keys) matches the
section 5 table and the two whole-section paragraphs. Q3 (ship the client re-stamp
with the server ring on train 47) matches section 8. Q4 (60 s window, size 8, 32
keys, raised from the integrator's 4) matches sections 4 and 5. Q5 (gap 1 residue
to the backlog) matches sections 3 and 7. No contradiction found.

## Findings (2 minors)

### m1 (minor). Chunk 2 merged without chunk 3 leaves currentRoom unspecified on the stale-but-recent path

Where: plan section 11, chunk 2 ("the key-by-key pre-filter in `sync_state`, for
the keyed sections, the compound-key sections ... the whole-section claims
(playerHealth, timedMessages) and the deletion claim") against chunk 3
("currentRoom under the stale-but-recent path (skip when newer, else the normal
acceptance and notSaved contract)").

currentRoom is not a `merge_*!` call; it is handled inline at the top of
`merge_last_write_wins_sections` (games_controller.rb:2188-2218), so the section 5
pre-filter ("before each `merge_*!` call") does not cover it, and the plan defers
its skip-when-newer handling to chunk 3. Chunk 2 does not say what the
stale-but-recent path does with currentRoom in the meantime. If chunk 2's
stale-but-recent path reaches the inline currentRoom block with
`params[:currentRoom]` still present and no skip, then a stale-but-recent request
carrying an older room passes `may_sync_current_room?` and writes it over a newer
stored room (games_controller.rb:2199-2200), which today's whole-skip prevents
(currentRoom is never written on a stale request). That is an older-over-newer
write for one section, introduced by chunk 2 and only removed by chunk 3, so chunk
2 does not cleanly merge without chunk 3.

Failure scenario: chunk 2 is merged, chunk 3 is not. A reduced body D (old
below-stamp regime, since chunk 4 is also not in) arrives stale-but-recent
carrying currentRoom `R_old`, after a newer request already stored `R_new`.
currentRoom is neither in the skip set (chunk 3 not in) nor whole-skipped (the
stale-but-recent path now runs the merge), so `R_old` overwrites `R_new`: a
snap-back the player did not cause.

Fix: state in chunk 2 that currentRoom is not applied on the stale-but-recent
path until chunk 3 (strip it from the params the stale-but-recent merge sees, so
it stays whole-skipped exactly as today), so chunk 2 merged alone can never write
an older room. Minor: the safe reading is the natural one and the window is a
single un-merged chunk, but the plan should nail it down since the brief requires
each chunk to merge without the next.

### m2 (minor). The stale-but-recent band merges mailState, which the capture step's `stale:` gating assumes it does not

Where: plan section 4 ("The capture step ... already runs on a stale request")
and section 5, against `apply_capture_sync_step` (games_controller.rb:913-975)
and the phish-fingerprint gate (games_controller.rb:862).

The capture step branches on `stale`, and its comments state the premise directly:
"A stale request's mail is not merged and confirms nothing, so it never stamps"
(games_controller.rb:918-920) and "Non-stale only: a stale request's mail is not
merged" (games_controller.rb:967-971, with `return if stale` at :971).
`@phish_fp_before` is computed only on `!stale` (games_controller.rb:862), and
`stamp_proven_captures!` runs only on `!stale` (games_controller.rb:974). The new
stale-but-recent band breaks that premise: it does merge (pre-filtered) mailState,
so phish-proof read state can land on a request the capture step still treats as
stale, and `stamp_proven_captures!` is skipped for it. The proven stamp is not
stamped on that request even though its evidence is now persisted.

This self-heals rather than losing progress: the stale-but-recent answer is
`stale: true`, so the client confirms nothing and resends the mailState on the
next sync, which arrives fresh and carries that mail as `incoming`, so
`stamp_proven_captures!` runs then (games_controller.rb:932-937, 974). So the
capture answer is deferred by at most one sync cycle, and the stamp is grow-only
and idempotent, so this does not violate the bar. But the plan treats the capture
step as unchanged and does not say which `stale` value the stale-but-recent band
passes to `apply_capture_sync_step`, and the two obvious choices differ: passing
`stale: true` gives the safe deferral above; passing `stale: false` (because mail
was in fact merged) would run `incoming_sent_messages` and the fingerprint over
the pre-filtered mail, which the plan has not analysed. The plan should state that
the stale-but-recent band passes `stale: true` to the capture step (the proven
stamp deferred to the client's resend, safe because it is grow-only and the client
resends after a stale answer), and add a test that a stale-but-recent request
carrying phish-proof mail persists the mail and that the next fresh sync stamps
the capture proven. Minor: deferred and self-healing, no progress lost and no
refusal.

## What I checked

- games_controller.rb: `sync_state` (:833-905) including the format rollback
  (:848-851), the stale branch answer (:894-897) and the conditional save (:880),
  `stale_sync_request?` (:2169-2179), `merge_last_write_wins_sections`
  (:2187-2278) including currentRoom acceptance/credit/notSaved (:2188-2218),
  phoneState (:2232-2235) and mailState notSaved/trimmed (:2239-2248),
  `apply_capture_sync_step` and its `stale:` gating (:913-975), the phish
  fingerprint gate (:862), `SYNC_STATE_COLUMNS` (:2116), `SYNC_STALE_RESET_MS`
  (:2122), `new_session` preserved_keys (:268).
- game.rb: `merge_mail_state!` (:5431-5480), `mail_state_updates` (:5494-5528),
  `mail_state_refusal` (:5534-5562), `merge_phone_state!` (:5198-5222),
  `merge_global_variables!` (:801), `replace_timed_messages!` (:5136),
  `merge_player_health!` (:5053).
- state-sync.js: `nextClientTs` (:722-725), `flush` and the reservation
  (:836-928, esp. :851-855, :868-871), `_sizeFlushBody` (:939-956),
  `_changesSinceInFlight` (:968-981), `_clearHiddenGuard` (:983-989).
- The round 1 and round 2 reviews, to confirm each earlier finding is closed in
  the design rather than reworded.

Rules: UK English, no em or en dashes, no model names, no credential or SecGen
files read, no server run, no db command, no full suite.
