Counts: blockers 0, majors 0, minors 5, nits 5

# UX feedback round, slice 5 (speech bubble barks): code and UX review, round 2

Branch `build/ux-barks` at `4c9c40461`. Reviewed the R1 fixes (61cd5b8fa, 9b846cb68, f4e89a027, e4b9c5fdb, 4c9c40461), the merge of main (7442ec3ac), `UX_SLICE5_REVIEW_R1.md` and the "R1 fixes" section of `UX_SLICE5_BUILD_LOG.md`, against the pixel-art UI rule and the UI design language notes.

## What was checked

**Merge of main (7442ec3ac).** For `npc-barks.js` and `npc-manager.js`, the merge result carries main's changes line for line (diff of merge base to main equals first parent to merge) and the branch's changes line for line (merge base to branch equals second parent to merge). The one place the tracks meet, the `phoneRinger.callActive()` hold in `_shouldDefer`, runs before routing, so a bark made during a call is held and released afterwards whatever its route. Live (game 2486, `test_phone_calls`): Basic rings after the briefing, answering opens the phone-chat call, a person bark during the call is held (queue 1) and is released when the call and the debrief it hands over to close; a phone contact's bark is a toast with the phone sound; `ring_voicemail` rings, decline gives the "New voicemail" notification. Phone, ringer and voicemail test files are green (below).

**R1 findings, live (games 2484 at 1400x1000, 2485 at 800x600).**
- M1: a bark from an NPC whose head leaves the camera goes to the toast; a bubble whose NPC leaves the camera mid-line (scripted pan) hands the rest of the line to the toast (`left-view`, `remainder`); a room change mid-line (`enterRoom('lobby')`) does the same, whole line from the page on screen. Fixed.
- M2: store A refusal with Dana in view: her bubble, no notification. Inside her 4 s cooldown: the notification. Two NPCs on one event (Lee given a second `door_gate_denied` mapping at run time): both in view, two bubbles, no notification; both in cooldown, the notification; Dana in cooldown and Lee answering, Lee's bubble and no notification. Store B (`lockedHint`): Dana's bubble and the hint alone in a toast titled "Store B". Fixed, with m3 and m4 below.
- m1: "Hold on -- badge first" shows with an en dash in the bubble; `_speakBark` got the raw text with `{ beep: false }`. Fixed.
- m2: covered by the new tests (builder's mutation check; not repeated).
- m3: a counter on `playBarkSound` stayed at 0 through every bubble bark (keyless, so every voice fails and the old fallback beep would have fired) and went to 1 for the phone contact's toast. Fixed.
- n1, n3, n4, n5: fixed as the log says. n4 checked for jitter below.

**The `answeredInView` mark.**
- Order: `refuseAtGate` (doors.js:766) builds a fresh `data` object, emits, then reads it. `NPCEventDispatcher.emit` (npc-events.js:45) is synchronous and passes the same object to every listener, so every immediate mapping has run before the read. Both refusal paths (click, doors.js:728, and bump, doors.js:796) go through `refuseAtGate`.
- Stale or leaking: cannot leak. Each refusal makes its own object; nothing else holds it except a delayed mapping, which may set the mark on that old object after `refuseAtGate` has returned (harmless).
- Two NPCs on one event: either one in view sets it; `answeredBy` names the last. Correct, live.
- Cooldown, condition, once-only: `_markAnsweredInView` runs after `_mappingWouldFire` passed. Correct.
- Dark room, other room, off camera, minigame open: `answersInView` uses the same `_routeFor` as the bark itself. Correct.
- `delayMs`: the listener schedules and returns; nothing is marked in time. Correct.
- Gaps: a knot bark that yields no text (m4); a bark held by `_shouldDefer` while no minigame is open (n4); `answersInView` ignores the four-bubble cap, but then the line comes as a toast, which still answers the refusal.

**On-camera check.** `viewFacts.onCamera` tests the head anchor against `cameras.main.worldView` inset 8 px; `_tickSays` re-asks every frame through `_inView`. Camera moves and room changes behave (above). The placement reads `worldView` in `postupdate`, before the camera's `preRender` moves it, so a bubble clamped to an edge lags one frame (n2).

**Stay-in-view placement (builder's addition).** One NPC at the top edge (shot `big-beside-mid`): the bubble sits left of her head with its top 2 px under the view edge and its right edge touching her hair. With one speaker this reads well enough. With two speakers near the top it fails (m1).

**Overlap avoidance and jitter.** Dana and Lee a tile apart with the player above them: still, 0 layout changes in 91 frames (1400x1000) and 88 frames (800x600). Player walking between them: Dana 9 and 7 changes, Lee 2 and 1, one side change in total and no back-and-forth. No jitter.

**stillValid.** A bark whose `stillValid` fails after 0.9 s closes (`stale`) within 250 ms, with no remainder toast. Correct.

**Crisp text.** Both sizes: VT323 at 16 px, Text resolution 1, 0 part-alpha pixels on the Text canvas (694 and 575 solid), text world position whole pixels. Frame from `fillRect`s with stepped corners and a stepped tail; no radius, hairline or smooth font. Meets the pixel-art rule. At 800x600 the game draws at 1x, so the bubble text is small but sharp; scaling is not this slice.

**barkDelay.** Confirmed: `_buildMappingConfig` (npc-manager.js:1091) has no `barkDelay`, so `config.barkDelay` at npc-manager.js:1817 is always undefined and every bark fires at once. Pre-existing: the same code is on main and at the merge base. The log's "sis02 sets it to 0" understates it (n5); see m5.

**Tests.** Every test file importing a changed module (`npc-barks`, `npc-world-bubbles`, `npc-manager`, `doors`, `interactions`, `npc-action-icons`), no lock per the test lock rule: `bin/test-js -j 3` on 91 files, 91 passed, 0 failed. Includes `ux-bark-bubbles`, `ux-bark-gate-refusal`, `locked-hint-refusals`, `phone-player-lines`, `phone-ringer`, `phone-ring-layer`, `phone-call-bark-hold`, `phone-call-queue`, `phone-ringwhile`, `bark-release-policy`, `toast-hold-over-panels`.

**Live setup.** Keyless server on :3333 from this worktree, headless, `setFPS(20)` with fixed steps on. New games from `swap-scenario-game.rb test_access_habits <dir>`: 2484 and 2485 (`test_bark_bubbles`), 2486 (`test_phone_calls`). Shots in `scratchpad/ux-shots/slice5-r2/` (lossless webp; `big-*` 1400x1000, `small-*` 800x600, `phone-*`), numbers in `big-report.json` and `small-report.json`. Server stopped afterwards.

## Findings

### Blockers

None.

### Majors

None.

### Minors

**m1. Two speakers at the top edge: the tail-less bubbles overlap and the speaker is unclear.**
`public/break_escape/js/systems/npc-world-bubbles.js:148-165` (the beside branch of `placeBubble`). When both sides are taken, the branch returns `fallback`, a rect that overlaps a bubble already placed. Live (shot `big-beside-two`, Dana at the top of the view, Lee 40 px to her right): Lee's "Morning. Printer is jammed again." covers most of Dana's line ("Not with y..."), and Lee's bubble, with no tail, sits against Dana's head, so it reads as hers.
Fix: in the beside branch, when a side is taken, try lowering the body below the rect in the way (still inside the view) before giving up; if nothing is free, return no placement and let the caller hand the line to the toast (as `say()` does for a full set). Give a beside bubble a short stepped pointer on the head side, at head height, so the speaker stays clear. Test: two NPCs 40 px apart at the top of the view give two bubbles that do not overlap, or one bubble and one toast.

**m2. The HUD covers bubbles near the top-left of the view.**
`npc-world-bubbles.js:601` clamps to `cameras.main.worldView`, but the Objectives panel (and the top-right buttons) are DOM over the canvas. Live at 1400x1000 (shot `big-6d-gate-lockedhint`): Dana's refusal bubble at the top-left of the view sits half under the Objectives panel ("No...ith you behind me. ...t reception.").
Fix: pass keep-out rects for the visible HUD elements (Objectives panel, top-right buttons), mapped from screen to world through the camera, into `taken` (or shrink `view` by them) so the bubble slides or drops beside the head clear of them.

**m3. At 800x600 the lockedHint toast covers the guard and her bubble.**
`public/break_escape/js/systems/doors.js:772-776`. The ruling keeps the hint as its own toast, which is right, but at 800x600 the toast spans most of the view's top half (x 185 to 775, y 90 to 210) and covers Dana and her answer completely (shot `small-6d-gate-lockedhint`): the main-16 problem returns for any gate with a hint and an answering guard. No shipped scenario has both yet (builder's search), so this is a future risk.
Fix: when `data.answeredInView`, delay the hint toast until the answering bubble ends (the bubble layer knows `answeredBy` and its line's end), or show the hint in the bubble's remainder path as a second page. Retake at 800x600.

**m4. A knot bark that yields no text still drops the notification: a silent refusal.**
`public/break_escape/js/systems/npc-manager.js:1854-1855` marks before `_showBarkFromKnot` loads the ink; at npc-manager.js:1931 an empty knot only logs a warning, and a failed fetch is caught. Live: with Dana in cooldown and Lee given `{ eventPattern: 'door_gate_denied', knot: 'no_such_knot' }`, a refusal showed no bubble, no toast and no notification (shot `big-6c-gate-empty-knot-silent`). A real knot whose text is behind an ink condition hits the same path.
Fix: mark a knot bark only when the knot will speak. Cheapest: when the story is in `storyCache`, run the knot on a copy and mark only if it gives text; when it is not cached, do not mark (the notification shows, as for a delayed mapping). Test: a knot with no text and a knot whose only line is behind a false condition both leave the notification.

**m5. `barkDelay` does nothing in any scenario (pre-existing), and bubbles make it show.**
`npc-manager.js:1091-1131` (`_buildMappingConfig` omits `barkDelay`) and npc-manager.js:1817. Pre-existing on main. Authors rely on it: non-zero values in `m02_ransomed_trust` (10 mappings, for example 500, 800, 1000 and 1200 on the Bed 4 events), `sis01_healthcare` (about 30, with comments that it staggers reactions "to avoid overlap"), `sis02_energy` (1500), `m03_ghost_in_the_machine` (400), `lab_social_engineering` (1500 and 2500) and `test_event_cascade`. With no delay, NPCs reacting to the same event all speak at once; each NPC has its own TTS manager, so their voices overlap, and now their bubbles appear together too.
Fix (separate small change, worth its own branch): copy `barkDelay` into `_buildMappingConfig` with the same numeric guard as `delayMs`, and add a test that a mapping with `barkDelay: 500` shows its bark after 500 ms. The `answeredInView` path already skips the mark when `barkDelay > 0`, so a delayed answer keeps the notification. Playtest m02 and sis01 afterwards, since their timing will change.

### Nits

**n1.** A refusal inside the cooldown shows the notification while the guard's bubble from the last refusal is still on screen (live: `gate.cooldown`, both sizes). This follows the ruling, but the two now say the same thing side by side. Option: also mark the refusal answered when the mapping is in cooldown and that NPC's bubble is still up (`npcWorldBubbles.hasLine(npcId)`), at doors.js:772 or in `_markAnsweredInView`.
**n2.** `update()` runs on `postupdate` (npc-world-bubbles.js:634) and reads `worldView` (npc-world-bubbles.js:601) before the camera's `preRender` scrolls it, so a bubble clamped to an edge is placed against last frame's view. During a scripted pan, 19 to 20 frames had the bubble a few pixels outside the view. Not seen with the follow camera in this fixture (0 clipped frames walking towards and away from Dana at 800x600), since the hall is short. Fix if it shows in a tall room: run the pass on the scene's `prerender` or compute the view from `camera.scrollX/Y` after `camera.preRender`.
**n3.** A 2 px overlap with the player's head box lifts a bubble 76 px with a 2 px stem the same length (npc-world-bubbles.js:146 and 357; shot `big-7-overlap-closeup`, Lee's bubble). It reads, but the long stem runs past the player's shoulder. Consider trying a small lift first (just clear the overlap) or capping the lift and falling back to the toast.
**n4.** `answersInView` (npc-barks.js) does not ask `_shouldDefer` (npc-barks.js:176). In the short window where the ringer has decided to open a call but the call's minigame is not yet open (`callActive` true, no `currentMinigame`), a refusal is marked answered, its notification dropped, and the bark held until the call ends. Rare; add `!this._shouldDefer({ npcId })` to `answersInView`.
**n5.** The build log's R1 side finding says `barkDelay` is set to 0 only in sis02; six scenarios set non-zero values (m5). Correct the log line when m5 is picked up.

## Sync

Display only. Nothing is added to `player_state` and nothing new is sent; the mark lives on one event object in memory, and the bubble log is bounded at 60 entries.
