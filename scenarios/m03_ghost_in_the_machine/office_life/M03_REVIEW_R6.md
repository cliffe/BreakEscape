# m03 office life, review round 6 (delta since R5)

Branch build/ol-m03, tip dff9bd857. Scope: 689aca849 (R5 scenario fixes) and the night sofa fix (d1b833717, merged as dff9bd857): `systems/seating.js` endNpcBreath, `systems/npc-poses.js` NpcPoses.stopBreath, `systems/npc-behavior.js` setNPCVisible, `test/js/npc-hide-seated-breath.test.mjs`, `office_life/SOFA_FIX.md`. Read-only review; no servers or suites run (the fixer's results: JS 736/0, Rails 3186/0).

## Counts

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 1 |
| Nit | 4 |

## The fix

Correct and complete for the route that produced the slice 6 major.

- Cause confirmed. `NPCBehavior.update` returns at `npc-behavior.js:926` when the body is disabled, before `updateSeatedNPC` (`:937`), so the seated holder's image (`sprite-breath.js:79-92`) was never hidden again once `setNPCVisible(false)` (`npc-behavior.js:436`) turned the body off.
- Hide. `npc-behavior.js:427-432` calls `seating.endNpcBreath` (`seating.js:99-101`), which runs `endBreath` on `behavior._seat`. That destroys the image, clears the sprite crop when one is set (`sprite-breath.js:97-103`), and nulls the holder. Both calls go through `?.`, so a page without seating or poses is unaffected.
- Crop. The crop belongs to the sprite and is reset with `sprite.setCrop()` only when the holder recorded one, so the seat, pose and idle states are all handled. The seated pose offset (poseSprite) is left in place, which is right: the NPC is still seated in data.
- Show. `setNPCVisible(true)` re-enables the body. Within one 50 ms behaviour tick (`npc-behavior.js:290`), `updateSeatedNPC` or `updateNeedsSeat` calls `updateBreath`, which builds a fresh holder (`sprite-breath.js:65`) and a new image the next time the figure is "down". Until then the full seated frame shows uncropped, which is correct. The live proof (SOFA_FIX.md DUMP2) shows the image coming back.
- Hide, show, hide in quick succession. `endBreath` does nothing on a null holder, and a second hide before any update finds nothing to end. Nothing is left behind.
- A hide during a sit or a stand. NPC seat moves (`_seatMove`, `_fetch`) never breathe: the only NPC breath holder is `behavior._seat` (calls at `seating.js:1638`, `:1976`, `:2316`), and `unseatNPC` ends it at `:1638` before the stand step begins. A hide mid-move leaves `_seatMove` untouched, and the move resumes on show. That was true before the fix and has nothing to do with breath.
- Player. The player's seated breath uses the module `state` holder (`seating.js:594`, `:890`, `:1024`) on its own pose sprite, and `setNPCVisible` never touches it. No change.
- Player-state sync. The new lines touch display objects only. `recordNpcVisibility` and `RoomStateSync.updateNpcState` are called exactly as before. No change.

## Other routes checked

| Route | Result |
|---|---|
| KO of a seated NPC | Clean. `npc-hostile.js:399-418` keeps the body enabled until the death animation completes. The next behaviour tick unseats on KO (`seating.js:1957` plain seats, `:2256` needs seats), and `unseatNPC` ends the breath (`:1638`). A KO restored on reload builds a new sprite with the body off (`npc-sprites.js:191-196`) and never seats it. |
| Room unload, NPC destroy | Clean. `unloadNPCSprites` (`core/rooms.js:3470-3484`) destroys the sprite, and the image's `destroy` listener (`sprite-breath.js:81`) destroys the image. The pose map drops destroyed sprites (`npc-poses.js:409`). |
| Pose and idle breathing on a hidden NPC | Already self-healing before the fix: `NpcPoses.update` runs on every postupdate whatever the body state (`npc-poses.js:431`), and `updateBreath` hides the image when `sprite.visible` is false (`sprite-breath.js:69-72`). `stopBreath` does no harm (see nit 3). |
| Other hide routes | None. `setNPCVisible` (called from `npc-manager.js:1658`) is the only runtime hide of an NPC sprite. `npc-sprites.js:224`, `:230` and `:239` hide only at creation, before any breath exists. `npc-hostile.js:416` disables the body only after the unseat above. The `_carryBodyOff` lines in `npc-needs.js` (`:5685`, `:5862`) apply to carried items, not NPCs. No cutscene path hides NPC sprites. |
| Carried items on a hidden carrier | Clean. `npc-office-visuals.js:275-279` follows the carrier's `visible`. |
| Other missions | Seated NPCs appear in `test_seating` and `lab_physical_pentest` (`:1766`). Neither hides a seated NPC. The new calls do nothing for an NPC without `_seat` or a pose holder (`seating.js:100`, `npc-poses.js:243`). m02's only hidden NPC (`night_security_supervisor`, `m02 scenario.json.erb:3123-3143`) is neither seated nor a needs NPC. No regression found. |

## Findings

### Minor

1. **A hidden seated NPC keeps its seat** (not new in this delta; this fix's hide path is where it shows). `setNPCVisible(false)` leaves `behavior._seat` and the chair reservation (`chair.seatedBy` / `chair._places`, `seating.js:282-290`) in place. `trySit` then returns silently on a chair with no free place (`seating.js:340`, "taken: nothing happens"). In m03, if Yusuf is seated on the single-place reception armchair at the night turn, the armchair looks empty at night but clicking it does nothing. Zainab's sofa has more than one place, so the player still gets the other one. The player can hit this, but nothing breaks and the chair is optional. Not proven live; the slice 6 note "Yusuf (armchair empty)" suggests he sits there by day. Fix: on hide, unseat without the stand step (or release the place and keep `_seat` for the reveal), for example a `seating.releaseHidden(behavior)` called next to `endNpcBreath`, with a test that a hidden sitter's chair takes the player.

### Nits

1. **Hidden seated typist stays in `window.officeTypists`.** Only `unseatNPC` removes it (`seating.js:1639`); the add is at `:2306`, inside an update a hidden NPC never runs. With `"roomTone": true` the typing loop would keep playing in that room with nobody there. Not reachable at present: m03 has no roomTone, and m02 and test_needs_sims, which have it, hide no seated needs NPC. Fix: `window.officeTypists?.delete(npcId)` in the hide branch at `npc-behavior.js:427`.
2. **Test 2 doesn't prove the image comes back** (`npc-hide-seated-breath.test.mjs`, "showing the seated NPC again"). It asserts `_seat.breath === null` after the show, which holds even if nothing ever rebuilds it. The live DUMP2 covers this. Fix: after the show, call `updateSeatedBreath(behavior._seat, sprite, true)` with a stub scene, a "down" time and stub `breathRows`, then assert a new image exists and the crop is set.
3. **SOFA_FIX.md overstates the pose and idle case.** It says those images would also outlive a hide. They wouldn't: the poses loop runs regardless of body state and hides the image on an invisible sprite (see the table). The `stopBreath` call is harmless redundancy. Fix: one line in SOFA_FIX.md, optional.
4. **`destroy` listeners pile up on NPC sprites.** Each new breath image adds `sprite.once('destroy', ...)` (`sprite-breath.js:81`), and `endBreath` never removes it. Every sit and stand, and now every hide and show of a sitter, leaves one closure holding a destroyed image. A double destroy is safe in Phaser. This predates the fix and nobody can see it. Fix: keep the handler on the holder and `sprite.off('destroy', handler)` in `endBreath`.

## R5 scenario changes (689aca849)

- `scenario.json.erb:1371`, `:1374`: both "Reception had company" toasts now go at 6500 ms, 4.0 s after "The receptionist's down" (2500 ms, `:1042`, `:1049`). That meets the 4 s rule from R5 finding 1, the order stays the same, and the branch conditions are unchanged. Closed.
- `scenario.json.erb:229`: "WHITEHAT STAFF: SOMEONE STRUCK BY DAY". It no longer names reception, which was wrong because the global is set only by attacks on Zainab or Yusuf (`:1363-1364`). Its condition still excludes the KO lines below it. Closed.

## Verdict

No blockers or majors. The sofa fix is correct for the slice 6 failure and covers every way a seated breath image could outlive its NPC's visibility. KO, unload, destroy, poses and idles were already safe. The one minor (a hidden sitter keeps its chair) predates this delta and is optional to fix before the merge. The four nits can wait. Ready to merge on the engine and the scenario, given the fixer's suite results on the fix branch and the usual rerun on the tip being merged.
