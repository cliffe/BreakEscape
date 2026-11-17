# Chunk 4 review R1: the client re-stamp (ordering races)

Reviewer, round 1. Scope: chunk 4 only (the client re-stamp of the reduced
flush body, the stale-path no-op decision, and the chunk 4 tests), with the
round's focus on ordering races. Review only, no code edits.

Diff reviewed: `git diff d00c2862a build/hard-sync-ring-c4`
(public/break_escape/js/state-sync.js, test/js/state-sync-hidden-save.test.mjs,
test/controllers/break_escape/sync_stale_ring_test.rb, the build log).
Spec: docs/achitechture/SYNC_STALE_RING_PLAN.md section 8 to 10, and the chunk 4
build log section.

Verification run (touched test files, no full suites, no lock):

- JS `node --test test/js/state-sync-hidden-save.test.mjs`: 39 pass, 0 fail.
- Ruby `bin/rails test test/controllers/break_escape/sync_stale_ring_test.rb`:
  19 runs, 152 assertions, 0 failures.

## Verdict: SHIP

0 Blockers, 0 Majors, 3 Minors. The shipped client change is correct given the
ring plus the completeness guard. The findings are about test fidelity and one
dead field; none blocks the merge.

## What was traced

(a) Hidden-tab flush races. Traced hide, show, hide again; a hide during an
in-flight periodic sync; pagehide after visibilitychange; and a flush racing a
requestSoon. Results:

- A periodic `sync()` is not in `_flushesInFlight`, so a hide during one takes
  the normal full-body path at a fresh stamp above `confirmed`, and both land
  as full bodies in increasing-stamp order; whichever lands first is fresh, the
  other is stale-but-recent and merges its unique keys. No loss, no false
  confirm.
- A reduced since-body never calls `_applyAnswer` (state-sync.js:943 sets
  `landed = !answer?.stale` directly), so it confirms nothing and cannot record
  a key the server dropped. Its content stays in the delta and is resent once on
  the next fresh sync (a bounded no-op, not unbounded regrowth: the next full
  body confirms it and moves `_confirmedTs`).
- A full body (the whole-delta-if-it-fits branch, or a since-body that fits) that
  lands stale-but-recent is answered `{stale:true}`; `_applyAnswer` returns early
  (state-sync.js:1016) and confirms nothing. The only non-stale answer goes to a
  fresh request, which the server did store. So the client never believes a key
  is confirmed that the server does not hold.
- The since-body is built from current state over `confirmed` layered with each
  in-flight flush's sent values (`_changesSinceInFlight` :970-979), so it always
  carries the newest value for each key it holds and cannot undo a newer write.

(b) The gated-door notSaved currentRoom contract under the re-stamp.

- currentRoom is never placed in a reduced list (`_sizeFlushBody` :937-949 omits
  it), so "a refused room inside a re-stamped reduced body" cannot arise: a room
  rides only a full body, where the existing notSaved path runs unchanged.
- A refused room on a stale answer: `_applyAnswer` returns early, so `confirm()`
  is not called and no room is recorded; the room stays in the delta and
  reconciles on the next fresh sync (build log stale-path decision, confirmed).
- An accepted older room landing second stale-but-recent: if a newer entry
  claimed currentRoom the server whole-skips it (`ring_whole_claimed?`,
  games_controller.rb:2454) and does not store or credit it; if no newer entry
  claimed it the room goes through normal acceptance, exactly as a fresh room
  does. `confirm()` records a room the server did not keep only on the intended
  notSaved tailgating path (fresh answer, R4/R5), which the re-stamp does not
  touch. viaPass credit is gated on the server-owned pass global at merge time
  and is unchanged by the re-stamp (the re-stamp only moves the since-body
  stamp up, it never creates a new older-room-with-credit case).

(c) The R2 empty-ring whole-skip fallback against chunk 4's closure. The
re-stamp closes gaps 2 and 3 only in the orders where the older-stamped flush H
lands second as stale-but-recent and the completeness guard holds, which needs a
ring entry at `ts <= H.ts` inside the 60 s window
(`stale_recent_guard_holds?`, games_controller.rb:2267). In the D-lands-first
order with no qualifying ring entry (an existing game's first post-deploy
flush race, an expired ring, or a reset-cleared ring), H is whole-skipped and
H's unique last-write-wins sections are dropped. This is a page-unload loss (the
dropped section is gone on reload), and it is the documented cost (plan section
10, guard comment: "forgoes gap 1 ... self-heals on the first recorded
last-write-wins write"). Which gaps stay open until the first qualifying ring
entry: in the D-first order, gap 2 (H's unique key) and gap 1's flush unique
key; the H-first order is always two fresh writes and never affected. In a normal
session a load sync and change-driven syncs seed a ring entry within 60 s, so the
closure holds; the exposure is the narrow pre-ring window. See Minors 1 and 2 for
why the test suite does not surface this.

(d) The stale-path no-op decision: sound. The capture part's `onAnswer`
(capture-client.js:86-101) reads only `captures` and `capturesRefused`, never
notSaved, mailTrimmed or stale, so passing a stale answer through it before the
early return is inert (confirms build review R1 minor 2). A stale answer leaves
mailState and currentRoom unconfirmed, so they stay in the delta and the next
fresh sync re-sends them, re-trims and reconciles; nothing loops. For a pagehide
with no following sync, reload bootstraps from server state, so the live-view
reconcile is moot.

(e) Tests. The Ruby gap tests drive real landing orders (sequential sync_state
requests are the real order; the server is single-threaded under the row lock)
and assert the exact saved player_state in both orders; assertions compare saved
values against independently-computed expectations, not tautological. The JS
tests deliver pending requests in a chosen order through a model server, also
real orders. The `since.clientTs > flush.clientTs` assertions test the re-stamp
itself and are the point of the change, not tautologies. See Minors 1 and 2 for
the one fidelity gap.

## Findings

### Minor 1: the JS modelServer omits the completeness guard, so the recovery tests assert more than the real server guarantees

test/js/state-sync-hidden-save.test.mjs:558-570 (`deliver`) always merges a
stale-but-recent request key by key via `skipSet`; it never models
`stale_recent_guard_holds?` or the empty-ring whole-skip. The hideShowHide and
bigHiddenThenLateChange helpers seed no ring entry below the in-flight flush in
the model (the opening `sync.sync()` uses the default reply, not the model). So
the tests "C4 race (a): H2 before H1" (:826), "R2 m1: the hidden flush lands
after the pagehide" (:599) and the residual-loss closure (:639) assert H's
unique key is "recovered by the ring" in the exact D-lands-first interleaving
that is guard-sensitive, without establishing a qualifying ring entry. The
conclusion matches a real game only because a real session has a recent recorded
write below H; the test does not encode that precondition. The model comment
(:522-524) discloses the assumption, but the recovery claims read as
unconditional. Lower the risk by asserting the dependency, or point the comment
at the Ruby baseline.

### Minor 2: no test exercises the D-first empty-ring key loss (the one case where the closure does not hold)

The Ruby gap tests (test/controllers/break_escape/sync_stale_ring_test.rb:258,
283, 299) each seed a baseline fresh sync at ts 1000/2000/3000/4000 so the guard
holds, and the comment at :248-251 says exactly that. No test drives the
D-lands-first order with no qualifying ring entry to show H's unique
last-write-wins section is dropped. The empty-ring tests in
sync_stale_ring_merge_test.rb:57-111 prove the safety direction (a stale value
never overwrites a newer one) but not this loss direction. The cost is real and
intended, but leaving it untested means a change that widened the empty-ring
window (for example, a run of clock-only syncs, which record nothing in the ring,
letting the last keyed entry age past 60 s mid-session) would still pass every
gap test while quietly dropping a hidden flush's unique note or health on a
D-first race. A single Ruby test driving D then H against a clean game (no
baseline, or an aged-out ring) and asserting H's unique section is absent would
pin the boundary.

### Minor 3: `prevTs` is now a dead field on the in-flight flight record

state-sync.js:889 still carries `prevTs` in the `flight` object, and
`_changesSinceInFlight` still returns it (:980-982), but after the below-stamp
suppression (`clientTs <= oldest.prevTs`) was removed nothing reads
`flight.prevTs` any more. Harmless, but it invites a future reader to think the
ordering still turns on it. Drop it, or note that it is retained only for the
flight-record shape.

## Notes for the integrator

- The core re-stamp (strictly-above stamp via `nextClientTs`, removal of the
  caller reservation at old :853-855 and the `clientTs <= oldest.prevTs` null
  return at old :972) is correct: the stamp stays strictly increasing, the
  since-body carries newest content, and the ring makes the older flush landing
  second safe. SYNC SIZE holds (the re-stamp makes the reduced body
  smaller-or-equal, never larger; nothing new is held in the ring).
- Minors 1 and 2 together mean the suite demonstrates the closure only in the
  guard-holding case. The behaviour itself is the accepted R2 tradeoff, so this
  is a coverage gap, not a code defect.
