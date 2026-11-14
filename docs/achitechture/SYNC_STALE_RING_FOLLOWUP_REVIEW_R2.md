# Chunk 4 follow-up review R2: the R1 folds, chunk 5 and chunk 6

Reviewer, round 2 (chunk 4 work). Scope: the range `cb6d7feb4..274069682`, which folds
the chunk 4 review R1 minors (m1, m2, m3), builds chunk 5 (the hostile-flood size-bound
test and the live reordered-request browser proof) and does the chunk 6 tidy. Review only,
no code edits.

Diff reviewed: `git diff cb6d7feb4 274069682` across state-sync.js, sync_stale_ring_test.rb,
state-sync-hidden-save.test.mjs, sync-stale-ring-live-proof.mjs (new), and the docs.
Baselines read: app/controllers/break_escape/games_controller.rb (`stale_sync_request?`,
`stale_recent_guard_holds?`, `record_ring_write!`, the bootstrap filter) and
app/models/break_escape/sync_ring.rb (`normalise`, `collapse_entry`, `skip_set`).

Verification run (no shared lock, no full suites, single files, not in parallel):

- JS `node --test test/js/state-sync-hidden-save.test.mjs`: 40 pass, 0 fail.
- Ruby `RBENV_VERSION=2.7.8 bin/rails test test/controllers/break_escape/sync_stale_ring_test.rb`:
  21 runs, 229 assertions, 0 failures.
- The live proof was not run (the brief forbids starting a server); its evidence was read
  from SYNC_STALE_RING_BUILD_LOG.md and the script traced by hand.

## Verdict: SHIP

0 Blockers, 0 Majors, 2 Minors. The range is correct. prevTs is gone with no reader left;
the JS completeness guard is a faithful model of the server; the m2 Ruby test and the
no-entry JS case both drive the D-first no-qualifying-entry order and assert H's unique
section is dropped, and both fail under a widened guard; the flood test reaches every real
cap through real PUTs and confirms the bootstrap omits the ring; the live proof drives the
real client flush, reads the client stamps off the held bodies, releases in both orders and
asserts through a fresh bootstrap with assertions that fail when the state is absent.
Standing rules hold. The two Minors are a test label and an unasserted incidental, neither
blocks the merge.

## What was checked

1. prevTs removal. `grep -rn prevTs` over public/, test/, app/, tools/ returns nothing. The
   field left the `_flushesInFlight` comment, `flush()` (the `let prevTs` and the
   since-destructure at old :877), the flight object (:886) and `_changesSinceInFlight`'s
   return and jsdoc (:979-981). `lastClientTs` and `nextClientTs` are untouched, so the
   strictly-above stamp is unchanged. No behaviour change; the live proof's reload case still
   reads `window.stateSync.lastClientTs`, which stays.

2. The JS completeness guard matches the server. `guardHolds` (state-sync-hidden-save.test.mjs:565)
   is `ring.length > 0 && ts >= Math.min(ring ts)`; the server's `stale_recent_guard_holds?`
   (games_controller.rb:2267-2272) is `ring.is_a?(Array) && ring.any?` then
   `ts >= ring.map{ts}.min`. The `>=` comparison, the whole-skip on an absent, empty or
   non-array ring, and the guard running only from the stale-but-recent branch (reached only
   when `lastSyncClientTs` is set, i.e. a stamp exists) all line up. The model's `skipSet`
   uses `e.ts >= ts` and `record` trims to a 60 s window and the newest 8, matching
   `SyncRing.skip_set` (`entry.ts >= ts`), `SYNC_RING_WINDOW_MS = 60_000` and
   `SYNC_RING_MAX = 8`. `seedQualifyingRing` (:591) records a globalVariables write just below
   the hidden flush, which is what a real session records before a hidden flush (the live
   proof's baseline does the same with a real seed sync), so the seed is realistic.

3. The loss-direction tests. The Ruby `R1 m2` test (sync_stale_ring_test.rb:395) seeds a
   stored `lastSyncClientTs` and an empty ring, lands D (ts 1002) fresh, then H (ts 1001)
   stale against only D's entry above it, and asserts `globals['blob']` is nil (H
   whole-skipped) with the stamp unmoved, then a fresh sync writing normally. The JS mirror
   (state-sync-hidden-save.test.mjs:679) drives D-first with no seed and asserts
   `server.globals.big` is undefined. Both fail if the guard were widened to merge against an
   incomplete ring; the empty-ring-merges-everything widening is caught separately by
   sync_stale_ring_merge_test.rb (the safety direction, an older value never overwriting a
   newer one).

4. The flood test (sync_stale_ring_test.rb:202). 50 real `PUT /sync_state` calls mix a
   40-key global write (over the 32-key cap), a 200-byte key name (over the 128-byte cap) and
   `nil` deletions (counted by `changed_hash_keys`). The retained newest 8 (ts base+42..49)
   include both an over-cap and an over-length entry, so the `<= 8` entries, `<= 32` recorded
   keys and `<= 128` bytes per kept claim key assertions are each exercised, not vacuous. The
   final `get scenario_game_url` and `refute_includes 'syncWrites'` confirm the bootstrap
   leaves the ring out.

5. The live proof (tools/playtest/sync-stale-ring-live-proof.mjs). It drives the real
   `window.stateSync.flush` for H and D, reads `tsH`/`tsD` off the held request bodies
   (`H.request().postDataJSON().clientTs`), holds both PUTs at the Playwright route layer and
   releases them in both orders, and asserts `boot.savedPlayerHealth?.hp === 70` /
   `boot.savedGlobalVariables?.g === 7` from a fresh `GET /scenario`. When the saved section
   is absent the compared value is `undefined` and the check fails, so no case passes on
   missing state. It defaults to port 3670, requires an already-running keyless server, and
   creates games only through tools/playtest/new-game.rb (`GAME_ID=`). The build log records
   a 5/5 green run on a hand-started keyless server, with `tsD > tsH` shown per case.

6. Standing rules. No em or en dashes in the new or changed files; no model names in the
   code or docs (`GEMINI_API_KEY` is the existing keyless-server env var, not a model name);
   no new package (playwright is already imported by the other tools/playtest/*.mjs proofs);
   UK English throughout.

## Findings

### Minor 1: the new no-entry JS test is named `R1 m1`, but it is the R1 minor-2 loss direction

test/js/state-sync-hidden-save.test.mjs:679 names the test
`'R1 m1: D first, then H stale with no qualifying ring entry...'`, while its own comment
(:673-678) calls it "R1 minor 2 (the loss direction), mirroring the Ruby controller test of
the same name", and the Ruby counterpart is named `R1 m2` (sync_stale_ring_test.rb:395). The
label is `m1` only to avoid clashing with the two pre-existing unrelated `R1 m2` tests in the
same file (:388, :410). Harmless to behaviour, but "of the same name" is literally untrue and
a later reader chasing the m1/m2 minors across the two suites is misdirected. Rename the JS
test to match the minor it mirrors (for example `R1 m2 (JS mirror): ...`) or drop the "of the
same name" clause.

### Minor 2: the live proof reports gap-1 (blob) recovery but never asserts it

tools/playtest/sync-stale-ring-live-proof.mjs:776-781 passes each gap case on
`result === 70 && tsD > tsH` (gap 2) or `result === 7 && tsD > tsH` (gap 3); `blobPresent`
(H's unique key recovered by the ring, the gap-1 shrink) is computed (:732) and printed but
is not in the pass condition. The build log narrates `blob=true` as proof of the ring
recovering H's unique key, yet a regression that lost that recovery would still report PASS
for gap2/gap3. The stated gap2/gap3 and reload claims are strongly asserted (they fail on
absent state), so this is not a weak assertion on the proof's headline claims, only an
incidental the narrative over-credits. Add `&& g.blobPresent` to the gap pass condition, or
drop the blob line from the build-log claim.

## Notes for the integrator

- The core of the range is sound: removing prevTs is inert, the JS model now mirrors the
  server guard and whole-skip, the flood test and the live proof exercise the real paths, and
  every touched test file is green without the lock. Both findings are cosmetic or narrative,
  not code defects.
- The live proof was not executed here (no server may be started under the brief); its green
  result rests on the build-log evidence, which matches the script as read.
