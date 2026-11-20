# NPC and player poses: review round 6 (delta)

Branch `build/ol-poses-code`, reviewed at tip `df0b713bc` (merges main `7881ebb59`). Scope: the R5 fixes
`663fa30fe` (validator test uses a fixture atlas) and `42187041e` (per-texture `_mayPose` cache in
`npc-poses.js`, player-poses reinstall resets `holder`), plus whether the main merge touched pose code. This is a
standalone document.

## Verdict on the R5 fixes

- **M1 (validator test depends on dropped art): holds.** `663fa30fe` changes only
  `test/js/validator-npc-poses.test.mjs`; the has-poses case reads a fixture atlas. `node` on the file: 3 tests,
  3 passed.
- **m2 (holder left after reinstall): holds.** `player-poses.js` reinstall branch now sets `same.holder = {}`, and
  the reinstall test seeds `holder.breath` and asserts `{}` afterwards. `node test/js/player-poses.test.mjs`: 29 of
  29 passed.
- **m1 (per-frame cost with no art): holds, with the minor below.** `node test/js/npc-poses.test.mjs`: 22 of 22
  passed.

## Cache checks

- **Anims created after the first frame.** `_mayPose` (`npc-poses.js:190-197`) trusts a "no" for `POSE_RECHECK_MS`
  (2 s), then looks again. A pose that should show is late by at most 2 s, never lost. Acceptable; the test covers
  it.
- **Sprite swap.** The record stores `tex`; a different `sprite.texture.key` bypasses the cache at once. A "yes"
  is kept for the same texture, and the animation keys are per NPC id, so nothing stale shows.
- **NPC active when its texture changes.** `!this.active.has(id)` (`:292`) skips the cache for an active pose, so
  it is released through the normal path. No pose is hidden.
- **`active.has(id)` bypass.** Correct: an NPC already posing never reaches the skip, so `release` still runs when
  the pose is wanted no more.
- **Main merge.** `git diff 42187041e df0b713bc --stat`: 42 files, all keyring, credentials, validator, sync
  payload and access-leak scanner work. None is under `systems/*poses*`, `sprite-breath.js` or any pose test. The
  merge does not touch pose code.

## Findings

### Blocker

None.

### Major

None.

### Minor

**m1. Skipping an NPC with no pose frames deletes its use record, so a use that was already running restarts its
lead clock when frames appear.**
`npc-poses.js:292-296` calls `this.useStart.delete(id)` on every skipped frame, and `_useRec` (`:231-238`) only
creates a record (`at: clockMs`) the first time it runs for a job. If an NPC is already `using` a machine when its
pose frames first become available (the 2 s recheck after late animation creation, or a texture swap to an atlas
with poses mid-use), `at` is set at that moment, not at the start of the job. `wantedPose` then sees `usingMs`
near zero and waits the full `USE_LEAD_MS` (3 s) again before the drink pose, so the drink pose arrives up to
`2 s + elapsed use time` late (bounded by the use length). No wrong pose, no error.
Failure scenario: a scenario that builds pose animations lazily or swaps an NPC's atlas while it is at the drinks
machine; the drink pose starts late, or not at all if the use is short.
Needs late frames, which no shipped path produces today, so low priority.
Fix: in the skip branch, keep the record current instead of deleting it:
`if (s.job?.phase === 'using') this._useRec(id, s, clockMs, !!sys?.world?.inChatWith?.(id)); else this.useStart.delete(id);`
(`_useRec` does no object lookup and no allocation after the first call per job). Add a test: no frames, job
`using` for 2.5 s, frames appear, assert the use pose shows within `USE_LEAD_MS - 2.5 s` of the recheck, not a
full lead later.

## Tests

The new cache test does prove its claims for first check, five cached frames (`gets` unchanged), zero object
lookups, texture swap and recheck after 2 s. It does not cover frames appearing mid-use (m1).

R6: 0/0/1
