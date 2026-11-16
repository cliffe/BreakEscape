# Pose fixes: review round 4

Branch `build/ol-pose-fixes`, tip f7b4668ca (contains main d1afb3be8). Scope: 794fd00ef and f7b4668ca, the R3 fixes to `npc-needs.js` `inChatWith`, `minigame-manager.js` `endMinigame`, `npc-game-bridge.js` `showNPCInventory`, the container minigame and the RFID minigame. Review only, nothing fixed.

Counts: **0 blocking, 2 major, 3 minor.**

Ran `node --max-old-space-size=2048` on `test/js/npc-chat-resume.test.mjs` (16 pass) and `test/js/npc-poses.test.mjs` (39 pass). Mutation checks and one probe ran in a scratch worktree at f7b4668ca, since removed. No full suites, no db tasks, no SecGen.

R3 findings: M1 is fixed for the routes R3 named (force close, displacement, failed open), m1 to m4 as described. One route R3 did not name is still open (M1 below).

## Major

**M1. An aborted hand-over from the NPC inventory still strands the pending return, and the NPC then counts as "in chat" during every later minigame.**
When the player opens a note, a text file or any other interactive item from an NPC's inventory, the container sets `pendingContainerReturn` (`container-minigame.js:1749`, `:1796`, `:1894`) and completes. That `complete()` sets `_returnsToChat = true` (`container-minigame.js:2046`), so the framework keeps `pendingConversationReturn` (`minigame-manager.js:228`) with no `returning` flag. The chat comes back only if the container reopens in npc mode and is then closed normally. It does not reopen when:
- the notes reader is closed by a hit, the knockout screen, a conversation or a room change (`notes-minigame.js:895` passes `reopen: !blocked()`, and `returnToContainerAfterNotes` stops at `container-minigame.js:2191`);
- the text-file reader closes the same way (`text-file-minigame.js:631-659`, which clears `pendingContainerReturn` only);
- the item opens something that never returns to a container: a phone, a locked item, a workstation (`armReturn` is false for npc mode, `container-minigame.js:1810`), or opens nothing at all.
In each case the reader is not a "child" for `_dropStrandedChatReturn` (`minigame-manager.js:227` checks `mode === 'npc'` or `rfid` only), so nothing clears the record. `inChatWith` then returns true whenever any minigame is open (`npc-needs.js:5351`, the `mg && !mg._ending` arm). A probe confirmed it: after the notes step is force-closed, `inChatWith('tom')` is false with nothing open, true during an unrelated lockpick, and the record survives the lockpick. For the rest of the session (until another `showNPCInventory` or clone overwrites it) the NPC freezes, skips his schedule and jobs (`npc-needs.js:1434`, `:4573`, `:4613`) and has his office calls hung up (`npc-needs.js:4752`) whenever the player has any minigame open, including a chat with someone else. It is not "for ever" in the R3 sense, but it is the same class of leak.
A stale record also makes the next RFID unlock anywhere restart that NPC's chat (`rfid-minigame.js:742`). That restart is older than this branch, but R3 now also flags it `returning`.
Reach: m01 to m10 do not use `give_npc_inventory_items` (grep of `scenarios/**/*.ink` finds it only in `scenarios/ink/equipment-officer.ink` and `helper-npc.ink`, used by `ceo_exfil` and the sprite test scenarios), so this sits in office-life, lab and test content, not the main missions. A narrower `inChatWith` arm (the open minigame is the npc container or a reader started from it, rather than any minigame) or dropping the record when `pendingContainerReturn` is dropped without a reopen would close it.

**M2. The card reader's chat return in the main missions has no test, and removing the line that keeps it passes every test.**
After R3 the framework drops `pendingConversationReturn` when an `rfid` minigame ends without `_returnsToChat` (`minigame-manager.js:227-228`). The clone chat resumes only because `RFIDMinigame.complete()` sets `_returnsToChat = true` before `super.complete()` (`rfid-minigame.js:746`). That ordering is correct today. But deleting lines 746-747 in the scratch worktree left `npc-chat-resume.test.mjs` at 16 pass, 0 fail: the "card reader" tests use a `FakeChild` registered as `rfid` (`npc-chat-resume.test.mjs:120`, `:128`) or run only `returnToConversationAfterRFID` (`:214`), never the real `complete()`. The live proof (`tools/playtest/npc-pose-r2-live-proof.mjs`) does not open the card reader. With that line gone, every `#clone_keycard` scene would lose its chat after the copy: m03 (Ffion, Victoria), m04 (Robert Vance, the relay), m05 (Owen, `m05_npc_owen_gallagher.ink:274`, where the scene continues "He keeps scrolling." and branches on the result), m06 (Irina), m07 (Ray Hollis), m08 (Netherton), m09 (Sorensen Hatch, Noor Haddad) and m10 (Imran, Gary). The R3 change makes this flow depend on a flag no test checks. It needs a test that runs the real `RFIDMinigame.prototype.complete` through the real framework (as `:144` does for the container) and asserts the record survives and the chat restarts, plus a live check of one real clone scene (m05 Owen is the shortest) resuming its chat.

## Minor

**m1. The notes hand-over flag is untested too.** Deleting `this._returnsToChat = true` at `container-minigame.js:2046` also left 16 of 16 passing. Without it the framework drops the record when the container closes for a note, and the chat no longer resumes after the note is read and the inventory closed. No test runs `complete()` with `pendingContainerReturn` set. (The other mutations were caught: ignoring `returning` in `inChatWith` failed 3 tests, removing `_dropStrandedChatReturn` failed 3, removing the container's `returning = true` failed 1.) The test at `:144` also leaves `window.pendingConversationReturn` set when it ends; later tests reset it through `frame()`, so it does no harm today.

**m2. Both `complete()` overrides flag the return before the base class's superseded-instance guard.** `rfid-minigame.js:746-750` and `container-minigame.js:2055-2064` set `_returnsToChat`, set `returning` and schedule the chat restart, then call `super.complete()`, which ignores a stale instance (`base-minigame.js:347-350`). The card reader calls `complete(true)` from unguarded timers (`rfid-minigame.js:219-220`, `:489-490`, `:568-569`; only `:365` checks `_isLive()`). A reader closed by a hit during that timer and replaced by a fresh clone from another chat would have its late `complete(true)` flag the new record `returning` and restart a chat over the open reader. The restart predates R3 and the flag is cleared by that restart, so nothing leaks, but the guard should come first.

**m3. The live proof records the hit case's resume but does not check it.** `npc-pose-r2-live-proof.mjs:92` stores `hitAfter` and only `hitFree` is asserted (`:113`). POSE_FIXES.md says the chat "resumes by design" after `playerHealth.damage(1)`; the script would pass if the hit dropped the chat instead.

## The questions asked

**1. Can an NPC still end up in chat for ever?** Not for ever, but intermittently for the session: see M1. Route by route for the inventory and card reader children:
- Complete: the container (`:2055-2064`) and reader (`:742-750`) flag `returning`; the restart clears the record in `finally` whether it succeeds, throws or is refused (`container-minigame.js:2265-2266`, `rfid-minigame.js:829-830`). No leak.
- Force close (`window.closeMinigame`, damage fallback): `endMinigame` drops it (`minigame-manager.js:240`). No leak; tested at `:96` and `:120`.
- Damage: `player-damage-interrupt.js:105` calls `complete(false)`, so the chat resumes after 150 ms, as before R2. No leak.
- Displacement by another minigame (a call, a scene): dropped by the same hook through `startMinigame`'s `endMinigame(false, null)`. No leak; tested at `:105`.
- Failed open: `showNPCInventory`'s `finally` clears it when the current minigame is not an open npc container (`npc-game-bridge.js:398-402`). `startContainerMinigame` is synchronous, so a successful open is never misread. No leak; tested at `:157`. A throwing open still rethrows into the tag processor, as before.
- Room change: the child is modal; a room change during the notes step is M1.
- Reload: `window` state is rebuilt.
- Player knocked out: `closeMinigameForKnockout` runs `complete(false)`, the restart is refused by `startMinigame` (`minigame-manager.js:51-55`) and the `finally` clears the record. No leak.
- Mission end: not traced to the ending screen itself. If it opens through `startMinigame` it displaces the child and the record is dropped; a page change clears it anyway.
- Notes or other hand-over from the inventory: M1.

**2. Regression risk outside office life.** `inChatWith` is read only by office-life code (`npc-needs.js`, `seating.js:2259`, `:2314`, `npc-poses.js:311`, `:325`, `npc-behavior.js:926` behind `npcNeedsSystem.has`). The shared changes keep the main-mission flows as they were, by reading: the card reader's restart keeps its 100 ms plus 50 ms timing and now restarts phone-chat through the same call; the identity check in the `finally` keeps a new record set by a second clone tag during the restart; no reader of `pendingConversationReturn` exists outside the container, the reader, the bridge and `inChatWith`. NPC inventory and notes hand-overs are not used by m01 to m10. `clone_keycard` is (list in M2), and its resume now depends on the untested `rfid-minigame.js:746` (M2). A force-closed or displaced clone no longer leaves a record behind, which also stops a later door's card reader from reopening that chat (an improvement).

**3. The `returning` flag.** Set only in the two `complete()` overrides (`container-minigame.js:2056`, `rfid-minigame.js:747`), each of which always queues the return function, and each return path nulls the record by identity in a `finally` or at once when the framework is missing. It lives on the record, so replacing or dropping the record drops it. It cannot outlive the 150 ms restart. The only odd case is m2, which clears itself. A record left without `returning` is M1.

**4. Are the tests real?** Mostly. The force-close, displacement, container-complete and return-gap tests fail on the matching mutation (counts in m1). The R2 regex extraction and `Object.create(MinigameFramework)` run the real code. The reader tests do not run the real `RFIDMinigame.complete()` (M2) and nothing covers the notes branch (m1).

**5. Synced player_state.** No growth. The commits touch no sync, controller or Ruby file; `pendingConversationReturn`, `returning`, `resuming` and `_returnsToChat` are page-only state.
