# UX feedback round, slice 5: speech bubble barks (build log)

Branch `build/ux-barks` (from `build/ux-feedback`). Plan: `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md`, slice 5. User notes: o-barks, main-16.

## What changed

### Routing (`js/systems/npc-barks.js`)
- New export `routeBark({ npcType, hasSprite, npcRoom, playerRoom, dark, minigameOpen })` gives `'bubble'` or `'toast'`. Bubble only for a non-phone NPC whose sprite is in the player's room, room lit, no minigame open. Phone contacts always get the toast.
- `_renderBark` asks the bubble layer (`window.npcWorldBubbles.viewFacts`, `say`) first. When the bubble takes the line, no toast is made. When `say` returns null (out of view, or farther than all of a full set of four bark bubbles) the toast is made as before.
- TTS is unchanged: `_speakBark` still voices the whole line, and now returns the audio length, which goes to the bubble handle's `setAudioMs`.
- The rest of a line cut short goes through `showBark` again with `forceToast`, `useTTS: false`, `playSound: false`, so it follows the hold rules (held while a panel or minigame holds barks) and is not voiced twice. The toast shows the speaker's name.
- `_showBarkIcon` and `_findNPCSprite` removed: no pulsing talk icon and no 1.25 tween scale. The bark-icon tracking in `interactions.js` is gone too.
- No new static import in npc-barks (the bubble layer is reached through `window`), so no JS harness copy list changed.

### Bubble layer (`js/systems/npc-world-bubbles.js`)
- `say(npcId, line, { audioMs, onRemainder, onDone })` returns `{ setAudioMs, close }` or null. Needs no needs state, so barks work in scenarios without office life.
- Pages: wrap at 24 characters (`LINE_CHARS`), at most 3 lines a page, split at word boundaries; the joined pages are the line word for word. Page time is the page's share of the line time by word count, at least 1.2 s. Line time is audio length + 0.8 s when known, else reading time (same formula as `barkLifetimeMs`). When the audio length arrives, the pages still to come are re-timed; the page on screen keeps its time.
- Leaving view (other room, dark room, minigame open, sprite gone) closes the bubble and hands the text from the current page onwards to `onRemainder`.
- Cap: `MAX_BUBBLES` (4). Barks rank before chatter, then by distance. A fifth bark from farther than all four bark bubbles is refused (toast); a nearer one pushes out the farthest bark, whose remainder goes to the toast. A new bark from an NPC with a bark up replaces it (its voice was cut by the new line too).
- `hasLine(npcId)`: `npc-action-icons.js` now hides the NPC's action icon and thought bubble while a bark bubble shows, as it already did for chatter.
- Pixel-art redraw (chatter bubbles change too): VT323 16 px, the font the NPC action icons use as world text (there are no door captions drawn as world text). The Text is not made until `window.canvasFontsReady` (or `loadCanvasFonts()`) resolves. Frame is a 2 px border drawn with whole-pixel `fillRect`s, with stepped corners (each edge stops one 2 px step short of the corner). Tail is two 2 px steps and a tip. Width rounded to even so the frame starts on a whole pixel; positions rounded; no scale. No `fillRoundedRect`, `strokeRoundedRect`, `fillTriangle` or `lineBetween`. Chatter lines wrap at the same width (whole line, no paging).
- A small bounded event log (`npcWorldBubbles.log`, last 60) for live checks.

### Test scenario
`scenarios/test_bark_bubbles`: hall with guard Dana (a 150-character bark for paging, and a short one), Lee (short bark) and phone contact Kim; lobby with Amira (out-of-view bark). Barks fire on test events `test_bark_long`, `test_bark_short`, `test_bark_far`, `test_bark_phone`. Validator: 0 errors, 0 warnings.

The plan named "the longest authored bark (150 characters, in the labs)". That line belongs to a phone contact in `lab_physical_pentest`, so it would always be a toast. The fixture has its own 150-character line on a person NPC instead.

## Decisions taken without asking
- VT323 at 16 px, matching the action icons. It reads well at the default zoom (shots below); the bubble is wider than the old 10 px monospace one (up to about 156 px of world for a full page).
- Frame drawn with fillRects, not `lineStyle(2)` + `strokeRect`: a stroked 2 px path sits on half pixels unless offset, and stepped corners need rect pieces anyway. The test checks the four edges are 2 px thick and that any `lineStyle` is 2.
- The page on screen keeps its reading-time length when the audio arrives (the plan says the pages "still to come" re-time).

## Tests (run without the lock, per the test lock rule)
- New `test/js/ux-bark-bubbles.test.mjs`: 13 pass. Routing (in view, out of view, dark, phone, minigame, no sprite); bark in view makes a bubble and no toast, no tween, no bark icon; 150-character line pages (at most 3 lines, 24 characters a line, joined equals the line); page times with and without audio; re-timing on audio; leaving view on page 2 sends pages 2 onwards to the toast with the name; minigame opening mid-bark holds the remainder (forceToast, not voiced); bark outranks chatter; fifth farthest bark to toast and nearer one pushes the farthest; pixel art (font, 2 px edges, whole-pixel rects and positions, no rounded calls, no scale); no Text before the font loads; source has no `barkIcon` or `1.25`.
- Updated for the redraw (mocks for `fillRect`, `fontsReady: true`, wrapped text): `npc-chatter-one-bubble` 2/2, `npc-social-pairing` 25/25.
- Files that read or import npc-barks, npc-world-bubbles, npc-action-icons or interactions: `bark-lifetime` 7, `bark-release-policy` 12, `engine-fixes-round6` 9, `finale-forced-call-and-closing-card` 17, `panel-barks-author-text` 4, `phone-reopen-and-persistence` 26, `phone-player-lines` 22, `toast-hold-over-panels` 6, `npc-office-visuals` 36, `room-tone` 17, `npc-action-icons` 4, `canvas-fonts` 5, `validator-strict-keys` 15: all pass, 0 fail.
- Rails tests that sweep every scenario (new fixture): `scenario_schema_test`, `ink_compiled_staleness_test`, `tts_mission_lines_test`, `capture_payload_secret_test`: 29 runs, 0 failures.

## Live proof (keyless server on :3330, headless, setFPS(20), fixed steps on)
Driver: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/slice5_shots.mjs`. Shots in `scratchpad/ux-shots/slice5/` (webp, lossless).

Game 2429 (`test_bark_bubbles`, swapped onto a `test_access_habits` game):
- Short barks from Dana and Lee: two bubbles, no toast, no bark icon (`b1-short-bark-two-bubbles`, `b1-short-bark-closeup`).
- Dana's 150-character bark: 3 pages (3, 3 and 1 lines), times 5293, 4886 and 1221 ms (reading time: no audio on a keyless server). One frame per page and an animated sequence: `b2-long-bark-page1-of-3`, `-page2-of-3`, `-page3-of-3`, `b2-long-bark-paging-sequence`, `b2-long-bark-page1-full`.
- Leaving on page 2 (enter the lobby): bubble closed, toast "Dana Price: " plus pages 2 and 3 (`b5-leave-view-page2-before`, `b5-leave-view-page2-remainder-toast`).
- Back in the hall, Amira's bark from the lobby: toast (`b3-out-of-view-toast`).
- Kim (phone) and Dana and Lee at once: Kim is a toast, Dana and Lee bubbles (`b4-phone-toast-beside-bubbles`).

Game 2430 (`test_access_habits`, new-game in `gate_hall` with Rowan carried), main-16 retake: interact with Sara's door to store_b; `door_gate_denied` fires and Sara's "Not with you behind me" bark is a bubble over her (`main-16-gate-refusal-bubble`, `main-16-gate-refusal-closeup`). Earlier runs: games 2413 and 2417 (same results, before the fixture and driver fixes).

## Open points for the orchestrator or user
1. **The door's own refusal notification covers Sara's bubble.** "Access denied: this door only opens for authorised staff." (doors.js, top right, 5 s) sits over the bubble when the guard stands in the top part of the view; both last about 5 s (`main-16-gate-refusal-bubble-under-notification`). The clean shot was taken after closing the notification. Options: drop the notification when a guard's bark answers the refusal, move it, or shorten it. Not changed here (outside the slice).
2. Audio re-timing is unit-tested only: the keyless server has no TTS, so no live run had an audio length.
3. `build/phone-calls` adds a 3-line hold (`phoneRinger.callActive`) to `_shouldDefer` in npc-barks.js that is not on this branch. It does not touch the code this slice changed; it should merge cleanly.
4. The NPC action icons (npc-action-icons.js) still use a 1 px stroke; that is slice 7's pixel pass, not changed here.
5. `report.json` in the shots folder holds only the last (gate) run; the bark numbers are above.

## Sync
Display only. Barks and bubbles are not synced; nothing is added to player_state.

## Handover
Done: all of slice 5 as planned, tests, live proof, shots. Nothing in progress.
Files: `public/break_escape/js/systems/npc-barks.js`, `npc-world-bubbles.js`, `npc-action-icons.js`, `interactions.js`; `test/js/ux-bark-bubbles.test.mjs` (new), `npc-chatter-one-bubble.test.mjs`, `npc-social-pairing.test.mjs`; `scenarios/test_bark_bubbles/` (new).
Gotchas: `swap-scenario-game.rb` games open with the title card, the Mission Brief and the tutorial prompt; the driver presses Space, closes the minigame and sets `tutorial_completed` in localStorage. NPCs in a room that has not loaded have no event listeners yet, so an out-of-view bark needs that room visited first.

## R1 fixes (review `UX_SLICE5_REVIEW_R1.md`, with the orchestrator's rulings)

### Merge of main first
Main moved to de63f5900 (phone-calls track). It touched `npc-barks.js` (a `phoneRinger.callActive` hold in `_shouldDefer`) and `npc-manager.js`, both files this branch changes. Merged with `git merge --no-ff main` (7442ec3ac): no conflicts. Bark, phone and door tests after the merge: 67 files, 0 failures.

### Findings
- **M1, fixed.** In view now means on camera. `viewFacts` returns `onCamera`: the head anchor inside `cameras.main.worldView`, inset by `CAMERA_MARGIN` (8 px); `routeBark` gives the toast when it is false, and `_inView` uses it, so a bubble whose NPC leaves the camera hands the rest of its line to the toast. The clipped top the review also named is fixed: a bubble stays inside the view (centred, slid left or right, lifted); over an NPC at the top edge it sits beside the head, lowered into the view, with no tail.
- **M2, fixed as ruled.** `refuseAtGate` (doors.js) emits `door_gate_denied` first and then reads the event data. The NPC manager marks the data (`answeredInView`, `answeredBy`) when a bark mapping (`bark` text or a knot bark) fires for an NPC whose bark would go to the bubble: `NPCBarkSystem.answersInView` (same room, lit, on camera, no minigame). It is decided at mapping time, after the cooldown and condition have passed. Inside the cooldown, out of the room, dark, off camera, or with a delayed mapping (`delayMs`), nothing is marked and the notification shows. With the notification dropped, a gate's `lockedHint` still shows as a toast of its own, titled with the door sign. No other import was added to npc-manager or doors (harness copy lists unchanged).
  - Scenarios with a gate that has a hint AND an NPC answering `door_gate_denied`: none. `test_access_habits` (Sara, store B) answers but its gates have no hint; `lab_physical_pentest` has a hint on `secure_area` but no bark on the event (it was removed earlier). The fixture now has both cases.
  - Side finding, not changed: `barkDelay` on an event mapping is never copied into the mapping config (`_buildMappingConfig`), so it does nothing in any scenario (sis02 sets it to 0).
- **m1, fixed.** The bubble pages `displayDashes(text)`; TTS still gets the raw text.
- **m2, fixed.** New tests fail if the `setAudioMs` wiring in `_renderBark` or the even-width rounding is removed (checked by removing each).
- **m3, fixed.** A speech bubble never plays the phone's sound: not for a voiceless bark, and not as the fallback when TTS gives no audio (`_speakBark(..., { beep: false })`). A toast keeps it.
- **n1, fixed.** Padding comes from the glyphs' ink bounds read off the Text canvas, so the left and right gaps match (4 px each in the zoom shot). `TEXT_RIGHT_SLACK` (2 px) is only the fallback when the canvas cannot be read.
- **n2, fixed.** Lee has his own `ink/lee.ink` (compiled `lee.json`) with his own name.
- **n3, fixed.** The source test now looks only for the old `scale... to: 1.25` tween.
- **n4, fixed.** Bubbles are placed in turn (barks first, nearest first) clear of each other and the player's head: centred, then slid left or right (the tail stays over the head), then lifted with a 2 px stem down to the head. Last frame's choice is tried first, so bubbles do not flip sides.
- **n5, fixed in part.** A bark bubble asks the bark's `stillValid()` every 250 ms and closes with no remainder when it fails. Dismissing a bubble or clearing it with "Clear all" was not asked for and is not done.
- **n6.** `node_modules` (untracked symlink) kept out of every commit.
- **main-19 (crisp text).** Canvas `fillText` smoothed the glyph edges (964 part-alpha pixels against 207 solid on one bubble). `crispText` now thresholds the Text canvas to clear or solid text colour and uploads it again, as Phaser's `updateText` does: 0 part-alpha pixels live. VT323 stays at 16 px (whole number); box, text and frame positions are whole pixels; the game renders with `pixelArt`, `antialias: false`, `roundPixels`.

### Tests (no lock, per the test lock rule)
- `ux-bark-bubbles.test.mjs`: 28 pass (15 new: off-camera routing and hand-on, onCamera margin, displayDashes, setAudioMs wiring, odd width, right slack, no phone sound over a bubble, stillValid, two NPCs a tile apart, placeBubble, view clamping (2), crispText, ink padding).
- New `ux-bark-gate-refusal.test.mjs`: 9 pass (real NPC manager, bark system, bubble layer and doors.js): in-view answer drops the notification and the event goes first; cooldown; other room, dark, off camera; no listener; lockedHint alone; lockedHint with no answer; delayed mapping; knot bark; `answersInView`.
- Mutation check: removing each fix (setAudioMs line, even rounding, onCamera in routeBark and `_inView`, displayDashes, beep flag, stillValid close, placement, the `answeredInView` read, the text-bark and knot-bark marks) turns at least one test red.
- Source tests updated for the new order and call: `locked-hint-refusals` (9 pass), `phone-player-lines` (23 pass).
- Every test file importing a changed module, plus all phone and door tests: 129 files, 0 failures. Rails sweeps over every scenario (`scenario_schema`, `ink_compiled_staleness`, `tts_mission_lines`, `capture_payload_secret`): 29 runs, 0 failures.
- Validator on `test_bark_bubbles`: 0 errors, 3 warnings (the two store badges no item provides, by design, and the unmodelled two-door south wall).

### Live proof (keyless server on :3332 from this worktree, headless, setFPS(20), fixed steps on)
Driver: `scratchpad/slice5_r1_shots.mjs`. Games 2465, 2466, 2467 (new, `swap-scenario-game.rb test_access_habits test_bark_bubbles`); the final shots are from 2467, the zoom and alpha numbers from 2466 and 2467. Shots in `scratchpad/ux-shots/slice5-r1/` (lossless webp), numbers in `report.json`:
- `r1-1-in-view-bubbles`, `r1-1-in-view-closeup`: Dana and Lee, two bubbles, no toast.
- `r1-2-off-camera-toast`: camera panned 700 px away, NPCs still in the player's room: both barks are toasts. `r1-2b-left-camera-remainder-toast`: the long bark's rest goes to the toast when the camera leaves Dana.
- `r1-3-gate-refusal-in-view-no-notification`: store A gate, Dana answers in a bubble (beside her head, she stands at the top of the view), no notification.
- `r1-4-gate-refusal-cooldown-notification`: again 1.5 s later, inside her 4 s cooldown: the notification shows.
- `r1-5-gate-refusal-lockedhint-toast`: store B gate: Dana's bubble, and the hint alone in a toast titled "Store B".
- `r1-6-two-npcs-a-tile-apart`, `r1-6-two-npcs-closeup`: Dana and Lee a tile apart with the player's head just above them: Dana's bubble slides left, Lee's right, neither covers the other or the head.
- `r1-7-bubble-text-3x-nearest`: Dana's bubble read off the game canvas at its own resolution (640x400 game, CSS 2x) and scaled 3x with nearest neighbour: hard-edged glyphs, even side gaps, 2 px frame.
Server stopped afterwards.

### Sync
Display only, unchanged: nothing added to player_state. The `answeredInView` mark lives on one event's data object in memory.

### Handover (R1)
Done: all R1 findings and the main-19 note. Not done: dismissing a bubble or clearing it with "Clear all" (n5, not asked). Files: `npc-barks.js`, `npc-world-bubbles.js`, `npc-manager.js`, `doors.js`; `test/js/ux-bark-bubbles.test.mjs`, `ux-bark-gate-refusal.test.mjs` (new), `locked-hint-refusals.test.mjs`, `phone-player-lines.test.mjs`; `scenarios/test_bark_bubbles/` (gates, store rooms, Lee's ink). Gotchas: the driver pans with `cameras.main.stopFollow()` and must `startFollow(window.player)` afterwards; an NPC moved onto the back wall gets pushed out by physics, so the overlap shot moves both NPCs onto open floor.
