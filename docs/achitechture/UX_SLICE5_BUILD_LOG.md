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
  - Side finding, not changed: `barkDelay` on an event mapping is never copied into the mapping config (`_buildMappingConfig`), so it does nothing in any scenario. Corrected in R2 (n5): six scenarios set non-zero values (`m02_ransomed_trust`, `sis01_healthcare`, `sis02_energy`, `m03_ghost_in_the_machine`, `lab_social_engineering`, `test_event_cascade`), not only sis02. Being fixed on its own branch (`build/bark-delay`).
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

## R2 fixes (review `UX_SLICE5_REVIEW_R2.md`, with the orchestrator's rulings)

### Findings
- **m1, fixed.** A bubble beside the head now has a short stepped pointer at head height (the bottom tail turned on its side: 7 whole-pixel pieces, tip 12 px from the head's centre), so the speaker stays clear. The beside placement takes part in the overlap avoidance: either side, and the body may move up or down while it still spans the pointer. Bubbles never cover each other, another speaker's head or a HUD panel (hard); the player's head is soft (covered only when nothing else fits). A bark with no place goes to the toast from the page on screen (`no-room`); chatter waits. Retake: at 1400x1000 Dana and Lee 40 px apart at the top edge get two beside bubbles pointing outwards, no overlap; at 800x600 the Objectives panel leaves Dana no side, so Lee has a bubble and Dana's line is a toast. A first retake showed Lee's bubble over Dana's head while other speakers' heads were soft; they are hard now.
- **m2, fixed.** `_hudRects` reads the screen rects of the fixed HUD (`.objectives-panel`, `#inventory-container`, `#health-ui-container`, `#hud-info-label`, `#scenario-timer-display`, `#music-widget-btn-anchor`, `#toggle-buttons-container`, `#combat-buttons`, `.phone-access-button`, `.tutorial-panel`), at most every 200 ms, maps them through the canvas and the camera's view into world rects (2 px gap) and treats them as no-go areas. Hidden, empty or near-full-screen elements are skipped. Live: Dana's head just right of the expanded Objectives panel: her bubble slides right, clear of it, at both sizes.
- **m3, fixed: the hint goes in the guard's bubble.** Chosen over moving the toast: the toast column is one fixed container, top right, up to 90% of the width; at 800x600 no part of the top half is clear of it, and moving one toast out of the column needs a second container. In the bubble the hint is always clear of the guard, follows her line, and rides the bubble's overlap, HUD and remainder rules. `refuseAtGate` puts the hint on the event as `answerFollowUp`; the NPC manager hands it to the bark of the first NPC that answers in view; `say()` shows it as pages after her line, each timed for reading (`followUpTimes`), not stretched to her audio; it is never voiced. If the bubble cannot open, or she leaves view, the hint goes in her toast or the remainder. With no answer in view the notification carries the hint as before. Live at 800x600 (Dana held in the hall a little way from the gate): her line, then the hint page, no toast. With Dana under the Objectives panel (her natural spot at 800x600) the line and hint go to her toast, which is clear of her.
- **m4, fixed.** A refusal is marked answered only by a bark that has text now: a plain bark with non-empty text, or a knot bark whose ink has given a line before the mapping returns. `_showBarkFromKnot` takes an `onText` callback; with the story and ink engine already loaded it runs to the end without waiting, so the mark is in time; if it has to fetch or import, the mark comes too late and is ignored (the door has already shown the notification). Each NPC's first knot-bark refusal after a page load therefore kept the notification (the engine is built per NPC; corrected in R3, where the story and engine class are preloaded); later ones use the cached story. A knot with no text, a missing knot or a failed fetch never marks: the notification shows.
- **m5.** Out of scope (`build/bark-delay`). The `barkDelay` lines in npc-manager.js are untouched; the one changed line nearby is the mark call.
- **n1, fixed.** Bark bubbles carry their event pattern as a tag. A refusal that keeps the notification closes any `door_gate_denied` bubble still up (`closeTagged`, logged `superseded`, no remainder).
- **n2, fixed.** The pass runs straight after the main camera's `preRender` (`hookCameraPass` wraps it once per camera), after follow, lerp and bounds have set this frame's view. `postupdate` marks the frame due, so a paused scene's bubbles hold still and the pass runs once a frame. With no camera (tests), `postupdate` runs it. Live scripted pan with a clamped bubble: 0 frames outside the view in 144 (1400x1000) and 142 (800x600), against 19 to 20 in R2.
- **n3, fixed.** Lift capped at `MAX_LIFT` (16 px); past it the bubble goes beside the head. Live overlap shot: no lifted bubble (Lee goes beside), no overlap.
- **n4, fixed.** `answersInView` is false while the bark would be held (`_shouldDefer`, a draining or non-empty hold queue).
- **n5, fixed.** The R1 log line above.

### Tests (no lock)
- `ux-bark-bubbles.test.mjs`: 37 pass (new: lift cap, null placement, beside pointer pieces and position, two speakers at the top edge, another speaker's head kept clear, no-room toast, HUD keep-out through the camera, preRender pass, follow-up pages and timing, closeTagged; three R1 tests updated for the cap and pointer).
- `ux-bark-gate-refusal.test.mjs`: 14 pass (new: hint in her bubble, hint on her toast when the bubble cannot open, knot with text and the story loaded, knot with no text, knot not loaded yet, cooldown closes the stale bubble, call opening).
- `locked-hint-refusals.test.mjs`: count of `lockedHintDuration` callers 16 to 15 (the hint-alone toast is gone).
- Every test file importing `npc-world-bubbles`, `npc-barks`, `npc-manager`, `doors`, `interactions`, `npc-action-icons` or `locked-hint`: 101 files, 101 passed.

### Live proof (keyless server on :3334 from this worktree, headless, setFPS(20), fixed steps on)
Driver: `scratchpad/slice5_r2fix_shots.mjs`. New games from `swap-scenario-game.rb test_access_habits test_bark_bubbles`: final shots from 2563 (1400x1000) and 2564 (800x600); 2526, 2528, 2533, 2534, 2537, 2538, 2556 and 2557 were earlier runs while the driver and the m1 retake were fixed. Shots in `scratchpad/ux-shots/slice5-r2fix/` (lossless webp, `big-*` and `small-*`), numbers in `big-report.json` and `small-report.json`:
- `a-gate-in-view`: store A, Dana's bubble, no notification. `b-gate-cooldown-closes-bubble`: inside her cooldown, the notification, her old bubble closed.
- `c-gate-empty-knot-notification`: Lee answers from a knot with no text: the notification, first with the ink loading and again with it cached.
- `d-gate-lockedhint-line`, `e-gate-lockedhint-hint-page`: store B with Dana where she stands. `d2-...`, `e2-...`: Dana held in the hall: her line, then the hint page in her bubble; no toast over her at either size.
- `f-top-two-speakers`, `f-top-two-speakers-closeup`: the two-speaker top-edge retake.
- `g-hud-objectives`: Dana beside the Objectives panel, bubble clear of it.
- `h-overlap-closeup`: Dana and Lee a tile apart, the player just above: no overlap, no tall stem.
Server stopped afterwards.

### Sync
Display only, unchanged. `answerFollowUp` and the mark live on one event's data object in memory; the hint pages and the tag live on the bubble's state; the HUD rect cache is a few rects.

### Handover (R2)
Done: m1 to m4, n1 to n5. Not done: m5 (own branch). Open points: the first knot-bark refusal of a session keeps the notification (ink not loaded); a guard bubble ended early by `stillValid` or replaced by another line of hers drops the hint with it. Files: `npc-world-bubbles.js`, `npc-barks.js`, `npc-manager.js`, `doors.js`; `test/js/ux-bark-bubbles.test.mjs`, `ux-bark-gate-refusal.test.mjs`, `locked-hint-refusals.test.mjs`. Gotchas: `window.game` is the main scene (the canvas is `window.game.sys.game.canvas`); a guard placed next to a gate holds it open, so a refusal there is no refusal; NPCs walk away from staged spots unless `body.moves` is turned off.

## R3 fixes (review `UX_SLICE5_REVIEW_R3.md`)

### Findings
- **m1, fixed.** A gate's lockedHint in the guard's bubble is never lost. `say()` takes `onFollowUpLost`; a bubble that ends for any reason but `done` hands its unread follow-up pages (from the page on screen, when that is one of them) to it. `npc-barks.js` shows them as a toast of their own (`_toastFollowUp`): silent, not voiced, and with no `stillValid`, so the check that closed her bubble does not close the hint too. The remainder paths (`left-view`, `no-room`, `pushed`) still carry line and hint together and do not hand on twice. Another line of hers that replaces the bubble takes the unread hint as its own follow-up, after the new line; the same hint again (a second refusal) shows once. `closeTagged` takes the hint the new notification carries: a bubble with that same hint closes quietly, one with another gate's hint (or with a notification that has none) hands it on. Live at all three sizes: stale on the line page and on the hint page gives one toast with the hint; replaced on the line page and on the hint page gives her new line then the hint pages, no toast; each shows the hint exactly once.
- **m2, fixed.** Bubbles are drawn at `BUBBLE_DEPTH` = `LIGHT_DEPTH + 3`, above the light map (+0) and the glows (+1, +2). Checked for things now under them: the overlay markers (talk and press-to-talk icons, health bars, damage numbers, the screen flash) use `overlayDepth`, `LIGHT_DEPTH + 10` and up, so they stay above the bubbles as before (live: Lee's talk icon at 100012, bubble at 100003). The interaction prompt, HUD and toasts are DOM over the canvas, unaffected. The only world objects that were above 5001 and are now below are the placement ghost (`interactions.js`, 9000, a 20% tint over an object) and two debug layers (sight occlusion grid, combat hitboxes); none of them sits at a speaker's head in play. Dark rooms still route barks to the toast and hide chatter (unchanged). Live fill sample of both top-edge bubbles: pure #FFFFFF at all three sizes (the blue-grey ramp and the seam are gone). The action icons at depth 5000 are left for a separate change, as the review suggests.
- **n1, fixed.** `clearHudCache()` runs on the window's `resize` event and the Phaser scale manager's `resize`. Live: shrinking to 80% and growing back, 0 frames with the bubble over the Objectives panel at each size (R3 measured 8 and 10).
- **n2, fixed.** `HUD_SELECTORS` now also lists `#music-widget-panel`, `#phone-ring-layer .incoming-call`, `.npc-interaction-prompt`, `#vm-controls-overlay`, `.panel-container`, `#bluetooth-panel`, `#biometrics-panel`, and each visible toast (`#npc-bark-container .npc-bark`, `#notification-container .notification`), not the stacks themselves. Live: the reviewer's scan for fixed elements over the canvas that the keep-out does not list found none at any size.
- **n3, fixed.** `pageLine` spreads the words evenly over the same number of pages when the last page would hold under half a page's share (one word, say), provided each page still fits in 3 lines of 24 characters. The store B hint now pages as 7 and 7 words.
- **n4, fixed.** A person NPC's mapping that answers from an ink knot (no bark text, no conversation mode) preloads the NPC's story into `storyCache` and imports the `InkEngine` class into a module variable, once per story, in the background. The first knot bark then builds the engine with no await and marks the refusal in time. Cheap and read only: one GET of the ink endpoint per such NPC at registration, nothing for plain barks, conversations or phone contacts. The engine itself is still built on first use, so a conversation opened first keeps `getInkEngine`'s global-variable sync. A failed fetch is ignored (the bark loads as before). The R2 log line is corrected above: it was first per NPC, not per session.
- **n5, fixed.** `pickShown` places bark bubbles already on screen (`held`: the bubble was visible last frame for this same line) before new ones, then nearest first, so a nearer newcomer goes to the toast instead of a line being read.

### The chatter line that did not show (R3 review, test_needs_sims)
Not a cap or the ranking: four speakers is within `MAX_BUBBLES`. The third NPC is Grace, in the player's room and talking every frame, but she sits just right of the expanded Objectives panel with Tom's head and bubble to her right. A probe of `placeBubble` for her (game 2637): no place with all keep-outs; a place with the HUD left out; none with only the HUD and heads, or only the HUD and bubbles. So the Objectives panel on one side and Tom on the other leave no free spot, and chatter waits for room (R2 m1 and m2: chatter never covers the HUD, a speaker's head or another bubble). Intended; a bark in the same spot would go to the toast.

### Tests (no lock)
- New `ux-bark-bubbles-r3.test.mjs`: 20 pass: stale on the line page and on the hint page (one toast, no `stillValid`), no follow-up stays quiet, `close()` hands on and a finished bubble does not, replaced on the line page and on the hint page (hint after the new line, once), the same hint once, another hint after the old one, a hint read to the end not carried, `closeTagged` with the same, another and no hint, remainder not doubled, depth above the lighting, resize clears the cache, the new keep-outs, balanced pages, held bubbles first (pure and live order), knot-bark preload once per story, none for plain barks, conversations and phone contacts, and the in-time mark with the story preloaded.
- Mutation check: removing the held sort turns both n5 tests red; disabling the hand-on in `_end` turns four m1 tests red.
- Every test file importing a changed module (`npc-world-bubbles`, `npc-barks`, `npc-manager`, `doors`) or `npc-action-icons`, `core/game`, `interactions`, `locked-hint`: 120 files, 120 passed.

### Live proof (keyless server on :3336 from this worktree, headless, setFPS(20), fixed steps on, scrollbars shown: 15 px probe)
Driver: `scratchpad/slice5_r3fix_shots.mjs` and `slice5_r3fix_chatter.mjs`. New games from `swap-scenario-game.rb test_access_habits <dir>`: 2622 (1400x1000), 2623 (800x600), 2624 (915x412) for `test_bark_bubbles`; 2625 and 2637 for `test_needs_sims` (chatter). Shots in `scratchpad/ux-shots/slice5-final/` (lossless webp: `big-*`, `small-*`, `phone-*`), numbers in `*-report.json` and `chatter*-chatter.json`:
- `main-16`: a store B gate refusal answered by Dana in a bubble, no notification, no toast (all three sizes); `main-16b-hint-page`: the balanced hint page in her bubble.
- `f-hint-after-stale`, `f2-hint-after-stale-on-hint-page`: her bubble closed by `stillValid`, the hint as its own toast.
- `g-hint-after-replace`, `g2-replace-then-hint-page`: her new line, then the hint in the same bubble.
- `h-cooldown-same-hint`: a second refusal: the hint once.
- `k-top-two-closeup`: the bubbles over the lit room, flat white fill.
- `i-hud-resize-*`: after the window shrinks and grows back, the bubble clear of the Objectives panel.
- `chatter-chatter-end`: the office with Grace's line waiting for room.
Server stopped afterwards.

### Sync
Display only, unchanged: nothing added to player_state and nothing new is sent. The carried hint lives on a bubble's state; the preload is a read of the ink endpoint into the existing story cache.

### Handover (R3)
Done: m1, m2, n1 to n5, the chatter question. Not done: the action icons' depth (left for its own change, as the review says). Live note: at 915x412 Dana's bubble in `main-16` sits just under Lee's head box (22 px) over his shoulders; the head stays clear, as the rule says. Files: `npc-world-bubbles.js`, `npc-barks.js`, `npc-manager.js`, `doors.js`; `test/js/ux-bark-bubbles-r3.test.mjs` (new).

## R4 fixes (review `UX_SLICE5_REVIEW_R4.md`)

### Findings
- **m1 (the hint doubled from its last page): fixed.** New pure `followUpBeyond(left, next)` in `npc-world-bubbles.js`: the unread follow-up counts as the same hint when the new hint equals it or ends with it (letters and digits only, the old `key()` hoisted to `textKey`). When the unread follow-up ends with the new hint (it carried an older hint first), only the older part is kept. `closeTagged` hands on only what the door's notification does not show; `say()` carries only what the new follow-up does not show. No hint shows twice on either path.
- **n1 (a fragment cut mid-sentence): fixed.** `followUpLeft` returns the whole follow-up while any of it is unread (the page on screen counts), and '' once the bubble is done. `_leave` on a hint page hands on the whole hint, not its tail. A reader on the last hint page sees the first half again, but every toast reads as a sentence.
- **n2 (flash and ghost under the bubbles with lighting off): fixed.** I chose to set the bubble depth from whether lighting is on. `bubbleDepth()` gives LIGHT_DEPTH + 3 (100003) with lighting on, and `BUBBLE_DEPTH_UNLIT` (8500) with it off. 8500 is under the proximity ghost (9000) and the screen flash (`overlayDepth(10000)`, 10000), and above the action icons (5000). The depth is set at creation and checked each frame a bubble is placed, so turning lighting on or off moves the bubbles on the next frame. With lighting on, the ghost stays under the bubbles (and under the light map) as in R3; the review counted that as better.
- **n3 (duplicate story GETs): fixed.** New `NPCManager._storyFromLoader(path)` reads our story cache, then `npcLazyLoader.getCachedStory`, and copies a loader copy into ours. `_preloadKnotBark` and `_showBarkFromKnot` both use it before any GET.
- **n4 (chatter voiced with no bubble; dropped mid-line), as the orchestrator ruled: fixed.**
  - `world.speak` in `npc-needs.js` now goes through the bubble layer's `deferChatterVoice`. The voice starts on the frame `update()` places the line's bubble.
  - A chatter line that finds no room (the bubble cap, no place, or its own NPC's bark) is skipped entirely: no voice, no waiting voice, and it is not shown later. It still expires on the needs clock as before.
  - A chatter bubble on screen that loses its place mid-line (a bark takes it) has its voice stopped (`npcChatterVoice.cancel`) and is not shown again.
  - Where no bubble can be placed at all (NPC off camera, a minigame open, a dark room), the line is voiced as before. If the layer has run no frame for 500 ms, `deferChatterVoice` returns false and the voice plays at once.
  - A waiting voice is dropped when its line has ended. On a first frame while the font is still loading, the voice waits for the next frame and is not played.
  - State: at most one waiting voice, one shown line and one skip mark per NPC. Each clears when the line ends. No text is added: chatter text still comes only from scenario files, and a skipped line makes no toast.

### Tests (no lock)
- New `ux-bark-bubbles-r4.test.mjs`, 21 pass:
  - m1: cooldown `closeTagged` from the last hint page gives no toast; the next refusal from the last hint page gives the line and then the hint once; case and dash variants count as the same hint; an older carried hint plus the current one, each once; `closeTagged` with another gate's hint hands hers on whole.
  - n1: `stillValid` on the last page and leaving view on the last page each hand on the whole hint; `followUpLeft` while unread and once done.
  - n2: the depth with lighting off is under the flash and ghost and over the icons; with lighting on, above the light map; a toggle moves the depth on the next frame.
  - n3: the preload reads the loader's copy, the first knot bark with no preload reads it too, and a story in neither cache is fetched once.
  - n4: a placed chatter line is voiced once; with no room it is skipped (no voice, no waiting entry, not shown later, no toast, the next line shows); a bark taking its place stops its voice; its own bark skips it; with no bubble to place it is voiced as before; on a font-loading frame it is not voiced; a voice whose line ended is dropped; the needs world defers only while the layer runs.
- `ux-bark-bubbles-r3.test.mjs`: the R3 m2 depth test now turns lighting on (with it off the depth is the R4 one), and "a hint read to the end is not carried" became the R4 n1 rule (carried whole).
- Every test file importing a changed module (`npc-world-bubbles`, `npc-needs`, `npc-manager`) or the R3 list (`npc-barks`, `doors`, `core/game`, `npc-action-icons`, `interactions`, `locked-hint`, `main.js`): 142 files, 142 passed.

### Live proof (keyless server on :3338 from this worktree, headless, setFPS(20), fixed steps on, scrollbars shown: 15 px probe)
Drivers are in `scratchpad/`: `slice5_r4fix_hint.mjs` (the reviewer's hint driver), `slice5_r4fix_shots.mjs` (final shots), `slice5_r4fix_depth.mjs`, `slice5_r4fix_chatter.mjs`, `slice5_r4fix_drop.mjs`, `slice5_r4fix_load.mjs` and `slice5_r4fix_phone2.mjs`. All games are new, from `swap-scenario-game.rb test_access_habits <dir>`. Numbers and shots are in `scratchpad/ux-shots/slice5-r4fix/`; the final shots are in `scratchpad/ux-shots/slice5-final/`.
- **Hint paths** (`test_bark_bubbles`, 2695 at 1400x1000 and 2696 at 915x412). The table counts every time either half comes into view. A is "Store B needs a staff badge. Reception" and B is "issues them to visitors with an escort.":
  - Cooldown refusal from the last hint page: B in her bubble, then the notification with A and B. A 1, B 2, no toast (was B 3, with a fragment toast).
  - Her next refusal from the last hint page: B on screen, then her new bubble with the line, A and B. A 1, B 2 (was B 3, with the half repeated).
  - `stillValid` false on the last hint page: one toast with the whole hint. A 1, B 1 (was a mid-sentence toast).
  - Line page, first hint page, `close()`, `closeTagged` with another hint and with none, and the dark room: as in R4, each once.
- **n2 depth** (`slice5_r4fix_depth.mjs`; player stood next to an interactable object to raise its ghost, a bubble over an NPC, then a 1.5 s red flash):
  - `test_phone_calls`, lighting off, game 2718: bubble 8500, ghost 9000, flash 10000. Both are above the bubble; in `unlit-depth-flash` the bubble is tinted red. The scenario opens conversations and calls on timers, so for this check only the driver closed them and held new ones off.
  - `test_bark_bubbles`, lighting on, game 2717: bubble 100003, flash 100110 (above), ghost 9000 (under the bubble and the light map, as in R3).
  - Games 2699, 2702, 2709, 2710 and 2716 were driver retries (scene lookup, choosing an interactable object, the scenario's conversation).
- **n3** (`sis01_healthcare`, game 2705): 7 ink GETs at load, one per story, plus the briefing's second `sarah_mitchell`, which R4 counted too. bed4_patient and bed2_patient are each fetched once (twice before). Both preload entries exist; neither made a GET.
- **n4 no room** (`test_needs_sims`, 2722 at 1400x1000 and 2723 at 800x600). Three 7 s lines, voiced through the needs system's own `_speak`, then a bark:
  - 1400x1000: Tom's line was placed and voiced. Amara's and Grace's found no room, were skipped from their first frame, were never voiced and never shown.
  - 800x600: two task notifications covered the view, so all three were skipped and none was voiced.
  - Afterwards: 0 waiting voices and 0 skip marks. Bubble overlap, outside-view and HUD frames were all 0.
  - Games 2700 and 2701 ran before the font-frame fix: the first frame with the font still loading voiced all three, which is why that path now waits.
- **n4 bark takes the place** (`test_needs_sims`, game 2724, `big-drop-*`): Amara's line was shown and voiced once. Four barks filled the cap, her bubble went, `cancel('amara')` was called once, and her line was not shown again after the barks ended.
- **Final shots** (`slice5-final/`, games 2697 at 1400x1000, 2698 at 800x600, 2704 at 915x412): `main-16` (Dana's refusal bubble, no notification, no toast), `main-16b-hint-page`, `f`, `f2`, `g`, `g2`, `h`, `k` and `i-hud-resize-*`, all refreshed. `f2` (stale on the hint page) is now the whole hint as one toast. HUD resize: 0 overlap frames at every size.
- **Phone calls regression** (`test_phone_calls`, game 2703): Basic rings and the answer connects. A person bark during the call is held (queue 1), then shown as a bubble after the call. The phone contact's bark is a toast. A declined voicemail gives "New voicemail".
- Server stopped afterwards.

### Sync
Display only, unchanged. Nothing is added to player_state and no request is new. The preload now makes fewer GETs. Chatter voice state is in memory, at most one entry of each kind per NPC.

### Handover (R4)
Done: m1, n1, n2, n3 and n4. Files: `npc-world-bubbles.js`, `npc-needs.js` (world.speak), `npc-manager.js`, `test/js/ux-bark-bubbles-r4.test.mjs` (new) and `test/js/ux-bark-bubbles-r3.test.mjs`. Open: with lighting on, the ghost stays under the bubbles (R3 behaviour). Raising it above them in both modes would also put it above the light map, which is a separate decision.
