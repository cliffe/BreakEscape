Counts: blockers 0, majors 0, minors 2, nits 5

# UX feedback round, slice 5 (speech bubble barks): code and UX review, round 3

Branch `build/ux-barks` at `28b0df0ff`. Reviewed the R2 fixes (d4d90e8c3, 22dc60a0b, cea542fae, 62e15a3ba, 7d9ed99fb, 28b0df0ff), `UX_SLICE5_REVIEW_R2.md` and the "R2 fixes" section of `UX_SLICE5_BUILD_LOG.md`, against the pixel-art UI rule and the UI design language notes.

## What was checked

**R2 findings, live at 1400x1000, 800x600 and 915x412.**
- m1 (two speakers at the top edge): at 1400x1000 Dana and Lee 40 px apart get two beside bubbles pointing outwards, no overlap; at 800x600 and 915x412 Lee has a bubble and Dana's line is a toast (`no-room`). The beside pointer is whole-pixel steps, 2 px border. Fixed.
- m2 (HUD covers bubbles): Dana's head just right of the expanded Objectives panel: her bubble sits clear of it at all three sizes. Fixed.
- m3 (hint toast over the guard): store B refusal with Dana in view: her line, then the hint as pages in her bubble, no toast, at all three sizes. Fixed, with the gaps in m1 below.
- m4 (empty knot is silent): Lee answering from a knot with no text gives the notification, both with the ink loading and with it cached. Fixed.
- n1: a refusal inside Dana's cooldown shows the notification and closes her old bubble (`superseded`). Fixed.
- n2: scripted pan with a clamped bubble: 0 frames outside the view (151, 151 and 146 frames). Fixed.
- n3, n4, n5: as the log says.

**HUD keep-out.**
- Cost: `update()` with a bubble up averages 0.09 ms a frame at 1400x1000 (95th percentile 0.4 ms), 0.08 ms at 800x600, 0.07 ms at 915x412. A forced DOM read (`_hudRects` with the cache cleared) costs about 0.1 ms; the cached path is near zero. `_hudRects` returns early with no bubble on screen, so an empty frame reads nothing.
- Zoom: at camera zoom 1.5 the Objectives keep-out rect, mapped back to the screen, matches the panel's DOM rect to 1 px at all three sizes. During a 1.2 s `zoomTo(1.5)` with Dana's bubble beside the panel: 0 frames over the panel, 0 outside the view (most frames hidden because Dana's head leaves the zoomed view, and her line goes to the toast, which is right).
- Resize: shrinking the window by 20% left the bubble over the Objectives panel for 8 frames (800x600 to 640x510) and 10 frames (915x412 to 732x350), until the 200 ms cache ran out (n1). Growing it back: 0 frames.
- Missed elements: see n2.

**Hard and soft keep-outs, and the no-room fallback.** A sweep of Dana's head over a 5 by 5 grid of the view (both edges, quarter points and centre), one bark at each spot: every bark landed somewhere visible. 1400x1000: 17 bubbles, 8 toasts (`no-room`), 0 neither. 800x600: 15 and 10, 0 neither. 915x412: 10 and 15, 0 neither. No bubble was outside the view or under the Objectives panel or the inventory tray. The toasts are the top corners (Objectives panel, top-right buttons) and the bottom row (inventory tray); at 915x412 the tray takes the bottom quarter of the view, so the fy 0.8 row goes to the toast too. That is the right call there: those heads are under the tray. Another speaker's head is never covered (top-edge shots); the player's head is covered only when nothing else fits (code; not staged this round).

**The hint in the guard's bubble.**
- Shown: yes, at all three sizes, after her line.
- Not voiced: a spy on `_speakBark` saw one call, with her line only.
- Timed for reading: `followUpTimes` gives 1.5 s plus 300 ms a word, 1.5 s to 8 s a page. The hint here (13 words, then 1) got 5.4 s and 1.8 s; with the keyless server her line page ran 5.4 s by reading time, so the hint page came at 4.2 to 4.3 s after the shot and the bubble closed 6.7 to 6.9 s later. Readable. The split leaves a one-word last page (n3).
- Lost: when `stillValid` closes the bubble, or another line of hers replaces it (m1).

**m4, the knot-bark readiness check.** `_showBarkFromKnot` (npc-manager.js:1877) has no `await` on the path where both the story (`storyCache`) and the NPC's ink engine (`inkEngineCache`) are cached, so it runs to `onText` before `_handleEventMapping` sets `inTime = false`. A missing knot throws in `goToKnot` and is caught, so it never marks. Correct. The first knot bark from each NPC after a page load keeps the notification over her bubble (n4).

**Camera ordering.** `hookCameraPass` wraps the main camera's `preRender` once (`__bubblePass`), and `postupdate` only marks the frame due. In Phaser 3.60 `CameraManager.render` calls `camera.preRender()` and then reads the display list, so bubbles placed there are drawn this frame. The other `postupdate` users (seating poses, carried items, room tone; four listeners live) run as before, and the bubbles now always run after them, so a seated or carrying NPC's head anchor is this frame's (it was down to listener order). No code in the engine sets the main camera's alpha or visibility, so the pass is not skipped. A paused scene still has no pass, as before. No side effects found.

**Phone calls track (main's merge).** Game 2575 and 2597 (`test_phone_calls`, 1400x1000): Basic rings after the briefing; answering opens the phone-chat call (`callActive`); a person bark during the call is held (queue 1) and is released as a bubble when the call closes; a phone contact's bark is a toast; `ring_voicemail` rings, decline gives "New voicemail". In 2575 the voicemail stayed `queued` because the scenario's guard conversation had opened just before the ring; with that closed first (2597) it rang and declined as in R2. A phone contact's bark during that conversation was held, as the hold policy says. No regression.

**Ordinary chatter.** `test_needs_sims` (games 2598 and 2610): three one-off chatter lines at once plus one bark, sampled every frame for 15 s at 1400x1000 and 800x600: up to 3 bubbles, 0 frames with two bubbles overlapping, 0 outside the view, 0 under the HUD, 3 and 2 layout changes in total (no jitter). One of the three injected lines did not show; that NPC was probably not in the player's room, which I did not confirm. Left alone for 40 s, the office produced no chatter on its own, so this is an injected check.

**Tests.** Every test file that imports a changed module (`npc-world-bubbles`, `npc-barks`, `npc-manager`, `doors`, `interactions`, `npc-action-icons`, `locked-hint`), no lock per the test lock rule: `bin/test-js -j 3` on 101 files, 101 passed, 0 failed. Includes `ux-bark-bubbles`, `ux-bark-gate-refusal`, `locked-hint-refusals` and the phone ringer, call queue, ring layer and bark-hold files.

**Live setup.** Keyless server on :3335 from this worktree, headless, `setFPS(20)` with fixed steps on, scrollbars shown (Playwright's `--hide-scrollbars` default removed; a probe measured a 15 px scrollbar). New games from `swap-scenario-game.rb test_access_habits <dir>`: 2573 (1400x1000), 2574 (800x600), 2580 (915x412) and 2581 (grid sweep, all three sizes) for `test_bark_bubbles`; 2572 was a first run whose driver stalled the toast queue (it removed toasts without `activeBarkCount`) and is discarded; 2575 and 2597 for `test_phone_calls`; 2598 and 2610 for `test_needs_sims`. Shots in `scratchpad/ux-shots/slice5-r3/` (lossless webp: `big-*`, `small-*`, `phone-*` for 915x412, `calls-*` and `calls2-*` for the phone track), numbers in the `*-report.json`, `*-sweep.json` and `*-chatter.json` files there. Server stopped afterwards.

## Findings

### Blockers

None.

### Majors

None.

### Minors

**m1. The door's lockedHint is lost when the guard's bubble closes early or is replaced (orchestrator ruling).**
`public/break_escape/js/systems/npc-world-bubbles.js:620` (`stillValid` false: `_end(st.npcId, 'stale')`, no remainder) and `npc-world-bubbles.js:559` (a new line from the same NPC: `_end(npcId, 'replaced')`). `_end` (npc-world-bubbles.js:592) drops the follow-up pages with the line. Live at all three sizes: store B refusal, Dana's bubble up; forcing her `stillValid` false closed the bubble (`stale`) and the hint appeared nowhere (no bubble, toast or notification; shots `*-f-hint-after-stale`); a second bark of hers ("Mind the cables there.") replaced the bubble and the hint was gone (`*-g-hint-after-replace`). In test_access_habits the gate guard's refusal mappings carry a `condition`, so they get a `stillValid`; it reads only the event data there, but any condition on a global that changes in the next seconds closes the bubble with the hint.
Fix: when a bubble ends for any reason other than `done` (or the remainder paths, which already carry the pages) while follow-up pages are still to come or on screen, hand those pages on. Add an `onFollowUpLost(text)` option to `say()`; `_end` calls it with `pagesText(st.pages.slice(Math.max(st.page, st.linePages)))` when that is not empty. In `npc-barks.js` pass a handler that shows the hint as a toast of her own at once: `showBark({ ...payload, message: hint, followUp: null, forceToast: true, playSound: false, useTTS: false, stillValid: undefined })` (drop `stillValid`, or the toast is closed by the same failed check). For `replaced`, carrying the hint into her new bubble as its follow-up is the nicer option: in `say()`, read the old state's unshown follow-up before `_end` and prepend it to the new `followUp`. Leave `superseded` (closeTagged) alone when the new notification carries the same hint; pass the new hint to `closeTagged` and hand on only a different one. Tests: stale on the line page and on the hint page, replaced on both, each shows the hint once.

**m2. Bubbles are drawn under the room lighting: tinted fill and a hard seam at the room edge.**
`npc-world-bubbles.js:348` sets the bubble container to depth 5001; the lighting layer is at `LIGHT_DEPTH` 100000 (`public/break_escape/js/utils/constants.js:18`), with glows at `LIGHT_DEPTH + 1` and `+ 2`. Live (shot `big-k-top-two-closeup`, Lee's beside bubble): inside the room the fill is a soft blue-grey ramp (#DCE3F2 to #DFE5F4) from the window glare, and where the bubble overhangs the wall into the unlit void it is #FFFFFF, with a sharp vertical line through "Printer". A soft ramp in UI breaks the pixel-art rule (no gradients), and the fill changes with the room's light. The depth is pre-existing on main for chatter, but slice 5's barks now sit beside heads and clamp to edges, so they cross room edges much more often. Dark rooms never show a bubble (barks go to the toast, chatter is hidden), so nothing needs them lit.
Fix: draw the bubbles above the lighting, `setDepth(LIGHT_DEPTH + 3)`, importing `LIGHT_DEPTH` from `utils/constants.js`; check the behind-wall fade strip and the dark-room routing still hold, and retake the top-edge shot. Consider the same for the action icons at depth 5000 (`npc-action-icons.js:368` and 405) in a separate change.

### Nits

**n1.** After the window shrinks, the HUD rects stay stale for up to `HUD_EVERY_MS` (`npc-world-bubbles.js:72`, read at npc-world-bubbles.js:730): 8 and 10 frames with the bubble over the Objectives panel live. Clear `this._hud` on the Phaser scale manager's `resize` event (or a window `resize` listener) so the next pass reads the panels again.
**n2.** `HUD_SELECTORS` (`npc-world-bubbles.js:74`) leaves out fixed elements that sit over the canvas: `#music-widget-panel` (the open music panel; it is in hud.css's zoomed HUD group beside its button anchor), `#phone-ring-layer`, `.npc-interaction-prompt`, `#vm-controls-overlay`, and `.panel-container`, `#bluetooth-panel` and `#biometrics-panel`. Live only the bark toast stack showed (at 915x412 it spans x 20 to 320, y 87 to 304, a third of the view), and a `no-room` line lands in that stack, where it can cover another speaker's bubble. Add the music panel and ring layer at least; for the toast stacks, add the visible `.npc-bark` and `.notification` elements (not their containers, which can be empty and large) if the extra toasts it causes at 915x412 are acceptable.
**n3.** The hint split into "Store B needs a staff badge. Reception issues them to visitors with an" and a one-word page "escort." (`pageLine`, `npc-world-bubbles.js:265`). Balance the pages when the last one is short (split the words evenly over the same page count), for lines and follow-ups alike.
**n4.** A knot bark marks in time only when both `storyCache` and `inkEngineCache` hold the NPC's entries (`npc-manager.js:1880` to 1904); the engine is cached per NPC and `await import('./ink/ink-engine.js')` always yields, so each guard's first knot refusal after a page load shows the notification over her bubble. The build log says "first of a session"; it is first per NPC. No shipped scenario answers a gate refusal from a knot, so this is a future risk. Fix: keep the `InkEngine` class in a module-level variable after the first import (or import it statically) so a cached story builds the engine with no await; correct the log line.
**n5.** `update()` places bark bubbles nearest first (`pickShown`, `npc-world-bubbles.js:659`), so a new bark from an NPC nearer the player can take the only free spot and send a line already on screen to the toast mid-line (`no-room`). From the code; not staged live. Place bark bubbles already on screen before new ones (by `started`), so the newcomer is the one that goes to the toast.

## Sync

Display only. Nothing is added to `player_state` and nothing new is sent. `answerFollowUp` and the mark live on one event's data object in memory; the follow-up pages and the tag live on a bubble's state; the HUD cache is a few rects; the bubble log is bounded at 60 entries.
