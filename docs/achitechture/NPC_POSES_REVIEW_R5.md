# NPC and player poses: review round 5 (delta)

Branch `build/ol-poses-code` (main 5043dc5c4 plus 19 pose code commits, no test art), reviewed at HEAD
`a736d34ae`. Scope: the R4 fixes (m-A, m-B, m-C), regressions in `player-poses.js`, behaviour of every pose path
with no pose art, and tests that depend on art this branch dropped. This is a standalone document.

## Verdict on the R4 fixes

- **m-A (phone pose retried per frame): holds.** `onMinigameStart` (`player-poses.js:194-198`) sets
  `phoneWanted = true` for any phone-style minigame. `_wantPhone` (`:182-186`) checks `!this.cur`, then
  `has('phone')` (one `anims.get`), and only then `blocked()`. A direction without frames skips that frame and the
  pose returns when frames exist. The new test "a direction without phone frames does not switch the pose off" covers
  it, and "no pose frames: a phone chat does no per-frame pose work" still sees zero behaviour-map reads.
- **m-B (lead token, reset on reinstall): holds.** Each lead takes `++this.leadId` (`:163`); the timer returns when
  its token is stale (`:165`) and when `leadOpen` is null (`:169`); the reinstall branch (`:246-256`) bumps `leadId`
  and clears `cur`, `phoneScene`, `phoneWanted`, `phoneShown`, `leadPending`, `leadOpen`. Walked through: lead A
  (id 1), shutdown, reinstall (`leadId` 2), lead B (id 3); timer A returns at once, timer B opens B. The stale-timer
  test queues A through `openWithPhoneLead`, fires it with and without a new lead pending, and asserts nothing opens
  early.
- **m-C (reworded R3 outcome): holds.** The R3 m4 row now says the superseded open and its `startKnot` jump are
  dropped while its thread stays in the phone. It matches `player-poses.js:158` (`this.leadOpen = open`).

## No-art behaviour

- Grep of `public/break_escape/assets/characters/*.json` (283 atlases): 0 contain a `pose_` frame name. No pose
  animation is created for any player or NPC on this branch.
- **Player poses with no frames.** Every entry point goes through `show()` (`:114-122`), which returns false when
  `has(name)` is false, so nothing plays and `cur` stays null:
  - `drink()` and `use()` (callers `consumables.js:205`, `interactions.js:846`) return false. `show()` calls
    `blocked()` before `has()`, so one behaviour-map loop runs per drink or world-object click; cheap, event-driven.
  - `onMinigameStart` sets `phoneWanted = true` (R4 change). During a phone chat, `update()` then does one
    `_player()` plus one `anims.get` per frame and stops there (`has` is checked before `blocked`). That is a cheap
    check and the only per-frame cost, and it exists only while a phone minigame is open. Outside a phone minigame
    `update()` returns on `!cur` after `_wantPhone`'s first condition fails.
  - No timers are created without frames (see the lead-in below), so no timer changes behaviour.
- **The 300 ms phone lead-in is skipped with no phone frames.** `openWithPhoneLead` (`:157-177`) calls
  `show('phone', ...)` first; with no frames it returns false and the code takes `return open()` at once, before
  `leadPending`, `leadId` or the timer are touched. The same applies when a minigame is already open. `phoneLead()`
  (`:180`, ringer and scripted calls) just returns false; those calls already had their own wait, unchanged.
- **NPC poses with no frames** (`npc-poses.js`): no errors, no timers, no animation change. `hasPoseAnim`
  (`:291`) is false, so `key` stays null and the loop calls `release()`, which returns at once for an NPC with no
  active pose. See m1 for the per-frame cost, which is more than a single check.
- **Install and callers.** `installPlayerPoses` and `installNpcPoses` only register a `postupdate` handler wrapped
  in try/catch. All engine callers use `window.playerPoses?.x?.()` or fall back to `go()` directly
  (`interactions.js:1815`, `:1837`, `npc-barks.js:985`).

## Findings

### Blocker

None.

### Major

**M1. `test/js/validator-npc-poses.test.mjs:34` depends on art this branch dropped, and the JS suite fails.**
The "a listed pose the atlas lacks: warning; one it has: none" test builds an NPC on `male_office_worker_v2` with
`poses: ['drink', 'phone']` and expects no issues. `scripts/validate_npc_needs.rb:602-631` (`atlas_poses`,
`check_poses`) reads the atlas JSON for `pose_` frames, and on this branch `male_office_worker_v2.json` has none, so
the validator correctly warns `no pose_drink frames` and `assert.deepEqual(hasIt, [])` fails.
`bin/test-js` result: 684 passed, 1 failed (this file), 685 total. The first half of the test (a female atlas lacking
the frames) passes. The R4 report's "685 passed" was taken with the test art present.
Failure scenario: the branch is merged or run in CI without the art commits; the suite is red for a reason that is
not a code fault, or the test gets silenced and stops guarding the "atlas has it" path.
Fix: make the test art-independent. Either write a temporary atlas JSON with `pose_drink_south_frame_000` and
`pose_phone_south_frame_000` into a temp directory and point `atlas_poses` at it (an env var or argument for the atlas
directory), or build the scenario with a fixture atlas key under `test/js/fixtures/`. Keep the "lacks" half on a real
atlas. Re-run with and without the art commits.

### Minor

**m1. NPC poses do the full wanted-pose computation every frame for every needs NPC, even with no pose art.**
`npc-poses.js:270-294`. Before the `hasPoseAnim` test at `:291`, each needs NPC runs `blockedFor` (hostile and KO
lookups, `inChat`), `_useRec`, `wantedPose`, `facesObject` and a `getObject` lookup (cached per job). Separately,
`_idleBreath` (`:326-336`) calls `npcManager.getNPC(id)` for every behaviour every frame. With no frames this is all
wasted work, though small (tens of NPCs, no allocation beyond the `Set` and spread copies at `:264`, `:312`).
Failure scenario: a large office scenario on an atlas set with no poses spends frame time on work that cannot change
the result; no wrong behaviour.
Fix: cache per sprite texture key whether it has any `pose_` animation (one scan of the NPC's three possible keys),
and `continue` after `release()` before computing `blocked`, `wantedPose` and `facesObject`. Skip `_idleBreath`'s
`getNPC` when `idleBreathing` is off and the NPC has no breath entry (check `this.idleBreathing === true` first, then
the record only for NPCs already in `this.breath`).

**m2. The reinstall branch leaves the sprite-breath holder behind.**
`player-poses.js:246-256`. R4 clears `cur` but not `holder`, so `holder.breath` can keep a `crop` string from before
the restart. The old player sprite is destroyed, and its `destroy` handler nulls `b.img` (`sprite-breath.js:93`), but
`b.crop` stays. After the restart, `updateBreath` on the new sprite finds `b.crop === crop` (same texture frame and
cut row), skips `sprite.setCrop(...)`, and draws a new overlay image over an uncropped sprite for the "down" part of
the breath cycle, doubling the head and shoulders rows for about 1 px.
Failure scenario: an atlas with pose frames, a scene restart while a pose is held in the breath-down phase (about
40% of the cycle; `infusion-pump-minigame.js:152` is the only restart path found), then any pose on the new sprite.
Needs pose art and a rare restart, so it cannot happen on this branch as it stands.
Fix: in the reinstall branch also set `same.holder = {}` (the old sprite is gone, so there is nothing to `endBreath`).
Add a line to the reinstall test: set `inst.holder.breath = { img: null, crop: 'x|1', phase: 0 }` before the shutdown
and assert `inst.holder.breath` is undefined after the reinstall.

## Suites

Run on the worktree at HEAD `a736d34ae`:

- `bin/test-js` in full: 685 files, 684 passed, 1 failed (`validator-npc-poses.test.mjs`, M1).
- `bin/rails test`: 2852 runs, 47221 assertions, 0 failures, 0 errors, 3 skips.
- `bin/rubocop scripts/validate_npc_needs.rb` (the only changed Ruby file): 1 file, no offences.
- `python3 -m unittest tools.test_pixellab_pipeline`: 25 tests, OK.
- The worktree has no `vendor/bundle`; Ruby tools ran with `BUNDLE_PATH` pointing at the main checkout's bundle.

R5: 0/1/2
