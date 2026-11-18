# Review: NPC squeeze-past, round 3 (delta of 9696f853d)

B0 M0 m2. Recommendation: (a), keep the gave-up nudge and document it.

Scope: `git show 9696f853d`, plus a full re-read of `_tickPlayerPass`, `_mayPassPlayer`, `_notePlayerBlock`, `_updatePlayerPass` and `_handleBlockerAhead` in `public/break_escape/js/systems/npc-behavior.js`. `node test/js/npc-local-avoidance.test.mjs`: 65 of 65 pass.

## 1. R2 fixes

- **R2 m1 (re-issue keeps the pass): works.** `goToAndStay` sets `reissued` only for a needs re-issue of the same destination (line ~3447). `_tickPlayerPass` skips the distance clear while it is set. `_notePlayerBlock(false)` resets it the first frame the path is followed again with nothing ahead, and `cancelMove` and arrival null the whole `_playerPass`, so the flag cannot outlive the walk. Adds nothing new apart from m2 below.
- **R2 m2 (early arrival needs the player at the target): works.** The 48 px arrival now also requires a player blocker within 48 px of the destination, which is the case the old collision covered. With the player elsewhere the NPC walks onto the use or queue cell, and the pass ends by distance once clear.
- **R2 m3 (near-target squeeze for any non-passing needs walk): works.** `!this._mayPassPlayer()` covers opt-out, hostile and KO, and `_moveOwner === 'needs'` still limits it. Hostile chase and patrol never reach it.
- **R1 m4 README wording:** accurate for the pass, but see m1 below.

## 2. Design question: the gave-up nudge under `squeezePastPlayer: false`

- **It predates the fix.** In `d35f8eae0^` the same `if (a.gaveUp && waited > AVOID_GIVEUP_MS)` branch, the `AVOID_SQUEEZE_MS` (450 ms) nudge at `AVOID_SQUEEZE_FACTOR` (0.45) speed, and the cooldown re-assessment are all present (line 1842 there, 2500 ms give-up). It was never conditional on the NPC type.
- **It applies to every walker.** Anything that follows a path through `_handleBlockerAhead` reaches it: wander and waypoint patrols, scripted `goToAndStay` walks, needs walks, and the NPC-versus-NPC back-off (the nudge is its player/doorway fallback). It fires once `_requestDetour` marks `gaveUp`, i.e. no route round the blocker.
- **The timing spread is explained.** Opal waits 0.6 s, tries detours every 0.4 s until none is found, waits to 2.5 s, then nudges for 0.45 s and cools down for another 0.6 s before re-assessing. Whether one 0.45 s nudge at 0.45 speed gets her past depends on the player's exact position and body push, so 6 to 9 s in two runs and 14 s or more in one is the same mechanism with a different geometry roll. Not a new defect.
- **Opt-out already has a second exception by design.** Near the walk's target (within the look-ahead of the player) an opted-out needs walk takes the bounded `mustReach` squeeze after 0.6 s, because the errand only fires at that cell (games 1099 to 1124). So the opt-out has never meant "wait for ever".

Recommendation: **(a)**. Keep the nudge and document that `squeezePastPlayer: false` removes only the 2.5 s pass (collider off, walk through). Reasons:

1. The nudge is bounded and slow (0.45 speed, 450 ms, then a wait) and is the engine's only escape from a wedge when no detour exists. Removing it for opted-out NPCs gives an indefinite hold. An author's flag could then strand the NPC for the life of the room, and a needs walk would only escape by job timeout.
2. The nudge shares code with patrol and NPC-versus-NPC avoidance. A (b) change touches all of them and needs a per-NPC branch in a shared function, for a flag whose users (Opal, a test fixture) want a visible body block in a demo.
3. If an author really wants a hard block, the right tool already exists: stand the NPC behind a locked door or a blocking object, or make the body a patrol-disabled `squeezePastPlayer: false` NPC with an ink "excuse me" line. A permanent hold is a story decision, not an engine default.

If the owner still wants (b), the concrete change is small: in `_handleBlockerAhead`, in the `a.gaveUp && waited > AVOID_GIVEUP_MS` branch, before `a.squeezeUntil = time + AVOID_SQUEEZE_MS;` add `if (hit.isPlayer && this.config?.squeezePastPlayer === false) { a.since = time; a.gaveUp = false; a.repathAfter = 0; return true; }` (stand, re-detour, repeat). The near-target `mustReach` squeeze would also need the same guard, and users of the nudge besides needs walks (patrol, wander, scripted `goToAndStay`, and the NPC back-off fallback) would keep it, since the guard is only for the player blocker. Test: an opted-out needs walk blocked in a sealed gap does not move for 30 s. Not recommended.

## Findings

### m1. Docs and demo wording overstate the opt-out (minor)
`README_scenario_design.md` line 1845 says hostile, KO, patrol and opted-out NPCs "never pass through the player". True for the 2.5 s pass, but an opted-out NPC still nudges forward after 6 to 9 s or more (gave-up nudge) and squeezes up to a player on its target cell after 0.6 s. The scenario's `endGoal` ("keep the body block") overstates it too, although its `scenario_brief` already says the nudge eases her through.
Failure scenario: an author opts out a guard to make a player-held door unpassable, and the NPC shuffles through in 9 s.
Fix: one sentence in the README: "`squeezePastPlayer: false` only removes the 2.5 s pass. The bounded nudge when no detour exists, and the walk up to a player on the target cell, still apply; use a locked door or an object to hold an NPC for good." Change the `endGoal` to "Opal keeps blocking, then eases forward slowly".

### m2. A re-issued pass has no distance clear while the path is empty (minor, unreproduced)
With `reissued` set and an empty `currentPath`, `_tickPlayerPass` does not clear the pass by distance. If the re-issue path request is slow or fails, `isPassingPlayer()` stays true (collider off) for up to the path retry (2 s) or until the walk ends (`cancelMove` and arrival clear `_playerPass`). Other bodies are not ignored, only the player's collision.
Failure scenario: needs re-issue, pathfinder returns nothing, the player walks into the idle NPC and passes through it for the retry window.
Fix (optional): in `_tickPlayerPass`, clear `reissued` after one `AVOID_PLAYER_BLOCK_GAP_MS` (store `p.reissuedAt`, compare to the time), so the skip is one bounded gap. Not needed for merge.

## Live evidence
The demo (`a25994a92`) proves the real collider path (Sam passes, Opal does not get `isPassingPlayer`), which closes the R2 "still open" m6 live half. Open from R1/R2 and unchanged here: m9 and the `fresh` flag.
