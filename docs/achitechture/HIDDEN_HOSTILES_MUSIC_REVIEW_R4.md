# Hidden hostiles and fight music: review round 4 (delta)

Branch `build/ol-hidden-hostiles`, tip e7d81e466. Scope: 437f18237 (code and tests), 1c6b9dec0 (proof, graph, wording), e7d81e466 (outcomes section), and the main merge 1b900b615.

Result: 0 blocking, 0 major, 3 minor.

## Checks

| Question | Answer |
|---|---|
| Is `recordCalm` reached only from the hidden-NPC path? | Yes. Its single caller is `setHostile(false)` at `public/break_escape/js/systems/npc-behavior.js:3475`, guarded by `_startHostileOnReveal`. That flag is set only at `npc-behavior.js:605` (a startHostile NPC whose sprite is hidden at creation) and cleared at 435 and 3476. The influence path (3520) needs `this.hostile` true, so it cannot reach it with the flag set. |
| Saved as a delta, no growth in synced player_state? | Yes. `recordCalm` (`npc-hostile.js:217-220`) writes one `{ hostile: false, ko: false }` entry, once per NPC, never overwrites, emits nothing. It rides `npcHostility` in `buildSharedSections` (`state-sync.js:488`), a shared section compared by the existing delta sync, not `player_state`. A later real turn overwrites it through `recordHostility`. |
| Does the reveal check KO and clear the flag? | Yes. `npc-behavior.js:434-437` clears the flag first, then calls `setHostile(true)` only if `isNPCKO` is not true. A missing hostile system falls through to hostile, as before. |
| Restored hidden hostile with no record recorded hidden? | Yes, `npc-behavior.js:594-598`, in the `restored.hostile && !restored.ko && sprite.visible === false` branch only. A visible sprite is left alone (test at `hostiles-hidden-music.test.mjs`, "not recorded hidden"). |
| Does a never-touched `initiallyHidden` hostile still count? | Yes. The constructor change only runs for a restored record. An untouched hostile with no restore has no `_npcVisibility` entry, so `anyHostilesAlive` (`scenario-music-events.js:172`) still counts it. The existing tests for that rule pass. |
| Can the proof's KO check now fail? | Yes. `tools/playtest/hidden-hostiles-music-proof.mjs:93-100` wraps `MusicController.switchPlaylist` before the KO and expects exactly `['noir']`. That list is empty if `all_hostiles_ko` does not fire, and gains `noir` only through that event. The call site (`scenario-music-events.js:278`) goes through the same `window.MusicController` object. I did not run the live proof (needs a server). |
| Are the new tests real? | Yes. I ran the new test files against the code from before 437f18237 (extracted with `git archive` into the scratchpad). Four tests failed there: R3 m1 calm, R3 m2 KO reveal, R3 m3 hidden restored hostile, and the `recordCalm` persistence test. They pass on the tip. The two m7 tests pass on both, as R3 said they would, so they only guard. |
| Test runs on the tip | `hostiles-hidden-music.test.mjs`: 26 pass, 0 fail. `npc-hostility-persistence.test.mjs`: 14 pass, 0 fail. |
| Main merge 1b900b615 | Clean for this work. Main brought patch-panel, network-view, `rooms.js`, `interactions.js` and `network-links.js`. None touch hostility, `npcVisibility`, `npc-behavior.js`, `npc-manager.js` or `scenario-music-events.js`. |
| Graph, brief and doc wording | The `test_hidden_hostiles` graph files are regenerated and the "noir music" wording matches the music config. |

## Findings

### m1 (minor): the reload half of the calm fix has no round-trip test

`test/js/hostiles-hidden-music.test.mjs:290` stubs `recordCalm` and only checks that the stub was called. `test/js/npc-hostility-persistence.test.mjs:271` only checks the export. Nothing runs `recordCalm`, then `exportHostility`, then `restoreHostility`, then `takeRestoredHostility`, then a constructor that must not set `_startHostileOnReveal`. That chain is the actual bug R3 m1 described. The code reads correctly (the restored `{ hostile: false }` entry takes the `restored` branch at `npc-behavior.js:587`), but the guard is not tested end to end. Add one test in the persistence file that uses the real system, and one constructor test using the real restore.

### m2 (minor): a restored hidden hostile counts before the reload but not after

`npc-behavior.js:594-598`. An `initiallyHidden` NPC that ink turned hostile (record `hostile: true`) counts in `anyHostilesAlive` while the page is open, since it has no visibility record. After a reload the new `recordNpcVisibility(npcId, false)` call hides it from the count until a `setVisible` reveal. The chosen rule is defensible and the music stays quiet for an unseen NPC, but the same NPC now behaves differently across a reload. It also adds a permanent `npcVisibility` key to the synced state for that NPC (one boolean, written once). Nothing reveals a hidden sprite except `setNPCVisible`, so it cannot get stuck, but say so in `HIDDEN_HOSTILES_MUSIC.md` so the difference is a known one.

### m3 (minor): ink `#hostile:false` on a pending NPC is still ignored

`#hostile:true` is covered by the new m7 test (`hostiles-hidden-music.test.mjs:349`). The calm direction goes the same way, straight to `npcHostileSystem.setNPCHostile` (`npc-hostile.js:237`), which does not touch `_startHostileOnReveal` or call `recordCalm`. A calm set by ink on a hidden pending NPC is lost at the reveal, and again on reload. This is not new in R3 and the scenario does not use it, but it is the same class as R3 m1 now that `recordCalm` exists. Either have `setNPCHostile(…, false)` clear the pending start on the behaviour, or note it as a known gap.
