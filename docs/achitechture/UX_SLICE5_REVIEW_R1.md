# UX feedback round, slice 5 (speech bubble barks): code review, round 1

Branch `build/ux-barks` at `ff60eec0f`, reviewed as `git diff build/ux-feedback...HEAD`. Plan: `UX_FEEDBACK_ROUND_PLAN.md` slice 5. Build log: `UX_SLICE5_BUILD_LOG.md`. User notes: o-barks, main-16.

## What was checked

- Routing (`routeBark`, `_routeFor`, `viewFacts`): person NPC, sprite live, same room, lit, no minigame gives the bubble; phone contacts, no sprite, other room, dark room and an open minigame give the toast; a full set of four nearer bark bubbles gives the toast. All correct as written, with one gap (M1).
- Paging and timing: 24-character wrap, 3 lines a page, joined pages equal the line; page share by words, 1.2 s minimum; audio length plus 0.8 s re-times only the pages still to come; a stale handle (line replaced) ignores a late audio length. Correct.
- Remainder: from the page on screen onwards, through `showBark` with `forceToast`, `useTTS: false`, `playSound: false`, so it is held under panels and never voiced again. The whole line is still voiced once through `_speakBark` before routing. A second bark from the same NPC replaces the bubble with no remainder, which matches the audio: `TTSManager.play` stops the previous line. Correct.
- Cap and ranking: barks sort before chatter, then by distance; `barkCapacity` keeps bark bubbles at four, refuses a fifth farther bark and pushes out the farthest for a nearer one, whose remainder goes to the toast. Correct.
- Performance: text is set and measured only when the line or page changes (`bb.line` signature). Live, `update()` cost 0.004 ms a frame with two bubbles up. The room scan in `_spriteAndRoom` runs only for barking NPCs without a behaviour; no action needed.
- Following and whole pixels: position is recomputed every postupdate from `npcIconAnchor`, then rounded; width forced even so the frame starts on a whole pixel; render config has `roundPixels: true`. Correct.
- Pixel art: VT323 16 px, Text not made until the fonts resolve, 2 px frame from `fillRect`s with stepped corners, stepped tail, no rounded rects, triangles, hairlines or scale. Meets the pixel-art rule and the stepped-corner ruling.
- Old paths: phone contacts still toast (live shot b4 and the unit test); chatter keeps its needs-clock timing and only changes in drawing and wrapping; the removed `barkIcon` has no other references in the engine.
- Test scenario: `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb scenarios/test_bark_bubbles/scenario.json.erb --no-graph` gives 0 errors, 0 warnings.
- Tests (no lock, per the test lock rule): `ux-bark-bubbles` 13/13, `npc-chatter-one-bubble` 2/2, `npc-social-pairing` 25/25, `npc-action-icons` 4/4, `bark-release-policy` 12/12, `toast-hold-over-panels` 6/6, `panel-barks-author-text` 4/4, `bark-lifetime` 7/7.
- Do the tests fail without the change? Nine mutations in a scratch copy: seven are caught (remainder voiced, current page re-timed, no bark ranking, no font gate, remainder from page 1, no minimum page time, plus the routing tests against the base branch). Two are not (m2).
- Live look: keyless server on :3331 from this worktree, game 2446 (`swap-scenario-game.rb test_access_habits test_bark_bubbles`), headless, `setFPS(20)` with fixed steps on. Dana and Lee barking at once: two bubbles, no toast, no talk icon, crisp VT323, stepped frame. Server stopped afterwards.

## Findings

### Blockers

None.

### Majors

**M1. "In view" means "in the same room", not "on screen": a bark from an NPC off camera is voiced with no text anywhere.**
`viewFacts` (npc-world-bubbles.js) and `routeBark` (npc-barks.js) check room, light and minigame, never the camera. The game size flexes with the window (`constants.js` scale mode NONE, sized in `applyPixelPerfectScale`), so the camera's world view shrinks in a small window, and 640x320 rooms (12 room maps) are wider than a 640 px view centred on a player at one end. Live, with the camera moved 600 px away from Dana and Lee in game 2446, `test_bark_short` routed to the bubble (`lastRoute` bubble, both bubbles "shown" at world y 70 and 133 with the view at y -656 to -256), and no toast was made. A player with the sound off, or on a keyless server, gets nothing. The same gap clips the top of a bubble over an NPC near the top edge of the view.
Fix: add an on-camera test to `viewFacts` (the bubble's rectangle, or at least the head anchor, inside `cameras.main.worldView`), so `routeBark` gives the toast and `_tickSays` hands the remainder on when the NPC leaves the camera; or clamp the bubble into the view. Unit test: same room, lit, sprite outside the world view gives the toast; live proof with a narrow viewport.

**M2. The door's own refusal notification covers the guard's bubble (main-16). Orchestrator ruling: when an in-view NPC bark answers a refusal, the door's notification is not shown; an out-of-view answer keeps it.**
Where: `public/break_escape/js/systems/doors.js`, `refuseAtGate` (lines 759 to 766). It calls `window.gameAlert(...)` first and then emits `door_gate_denied`, the event Sara's mapping answers (`test_access_habits/scenario.json.erb` around line 1400).
Change: emit `door_gate_denied` before the alert, and show the alert only when no in-view person NPC answered. The answer cannot be read back from the bubble layer straight after the emit, because a bark can reach `_renderBark` late (a knot bark loads ink in `_showBarkFromKnot`, `barkDelay` uses a timer, and the bark queue waits on a TTS fetch). Decide it at mapping time in the NPC manager's event handler, where the condition and cooldown have just been checked: for example the handler marks the event data (or returns a value) when a bark mapping fires for an NPC whose `routeBark` facts give `'bubble'`, and `refuseAtGate` reads that mark. Points the fix must keep:
- Sara's mappings have `cooldown: 4000` and the bump repeats every few seconds, so a refusal inside the cooldown gets no bark and must still show the notification.
- The notification carries the gate group's `lockedHint` (`appendLockedHint`). With the notification dropped the hint is not shown either; the fixer should say in the log whether any scenario's gate has a hint and an answering guard.
- Tests: refusal with an in-view answering guard makes no `gameAlert`; refusal with the guard in another room, in the dark, or inside the cooldown makes one. Retake main-16 with the notification gone.

### Minors

**m1. Bubble text skips `displayDashes`.** The toast shows `displayDashes(text)`; the bubble pages the raw text, so authored " -- " shows as two hyphens. Two shipped barks from person NPCs hit this: `m02_ransomed_trust/scenario.json.erb` lines 1645 and 1712. Fix: page `displayDashes(text)` in the bubble path (TTS keeps the raw text, so cached audio still matches); the remainder toast is unaffected because `displayDashes` leaves text with no "--" alone.

**m2. Two parts of the change are not covered by any test.**
- Removing the line `if (ttsPromise) ttsPromise.then(ms => { if (ms) handle.setAudioMs(ms); }, () => {});` in `_renderBark` leaves all 13 tests green: the audio re-time is only tested by calling `setAudioMs` directly, and no test drives a bark with `useTTS: true`. Add one with a stubbed `_speakBark` resolving to a length: it is called once with the whole line, and the bubble's later pages re-time to that length.
- Removing `if (w % 2) w += 1;` in `_render` leaves the pixel-art test green, because the mock's text widths happen to give even frames. Give the test a line whose mock width is odd.

**m3. A voiceless person NPC's bubble plays the phone alert.** For a bark without `useTTS`, `_renderBark` still calls `playBarkSound()` (message received plus phone vibrate). That made sense for a toast; over the head of someone standing beside the player it sounds like a text message arriving (the fixture's Lee does this). Suggest no sound, or a soft speech blip, on the bubble route. The orchestrator may rule this out of the slice.

### Nits

**n1.** Right padding is tighter than left: Phaser's measured width for VT323 comes up short of the drawn glyphs, so "Printer's" sits about 2 world px from the right border against 4 on the left (live shot `r1-live-long-and-short.png`, builder's b4). Measure with a pixel or two of slack, or pad from the glyph advance.
**n2.** Fixture: Lee's `storyPath` is `dana.json`, whose line is tagged "Dana Price", so talking to Lee shows Dana's name.
**n3.** The source test fails on any `1.25` anywhere in `npc-barks.js`; scope the pattern to a scale call.
**n4.** The VT323 16 px bubbles are about twice the size of the old ones (up to about 156 by 60 world px) and do not avoid each other or the player; two NPCs a tile apart overlap (b4: Dana's bubble covers the player's head). Worth the user's eye at the retake rather than a fix now.
**n5.** A bubble cannot be dismissed, is not cleared by "Clear all", and ignores `stillValid` (a stale toast is dropped on drain). Lines are short-lived, so this is a note.
**n6.** The worktree has an untracked `node_modules` symlink to another worktree; keep it out of any commit.

## Sync

Display only, as the build log says: nothing is added to `player_state` and nothing is sent. Bounded log of 60 entries in memory.

Counts: 0 blockers, 2 majors, 3 minors, 6 nits.
